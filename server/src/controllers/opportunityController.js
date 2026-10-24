const { Opportunity, SavedOpportunity, Roadmap, RoadmapTask } = require('../models');
const { Op } = require('sequelize');
const RecommendationEngine = require('../services/recommendationEngine');
const EligibilityEngine = require('../services/eligibilityEngine');
const TrustSignalEngine = require('../services/trustSignalEngine');
const RoadmapGenerator = require('../services/roadmapGenerator');

/**
 * Get catalog of opportunities with search, multi-filters, sorting, and pagination
 */
const getOpportunities = async (req, res, next) => {
  try {
    const {
      q,
      search,
      category,
      type,
      format,
      remote,
      beginnerFriendly,
      lowCost,
      sustainabilityFocused,
      location,
      status = 'active',
      cost,
      experienceLevel,
      educationLevel,
      country,
      showDuplicates = 'false',
      sort = 'deadline',
      page = 1,
      limit = 12
    } = req.query;

    const where = {};

    // Duplicates filter
    if (showDuplicates !== 'true') {
      where.isDuplicate = false;
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status;
    }

    // Search query term (across title, description, organizer, theme)
    const searchTerm = (q || search || '').trim();
    if (searchTerm.length > 0) {
      const termPattern = `%${searchTerm.toLowerCase()}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: termPattern } },
        { description: { [Op.iLike]: termPattern } },
        { organizer: { [Op.iLike]: termPattern } },
        { organization: { [Op.iLike]: termPattern } },
        { theme: { [Op.iLike]: termPattern } }
      ];
    }

    // Category / opportunity type
    const categoryFilter = category || type;
    if (categoryFilter && categoryFilter !== 'all') {
      const catConditions = [
        { category: { [Op.iLike]: categoryFilter } },
        { opportunityType: { [Op.iLike]: categoryFilter } },
        { eventType: { [Op.iLike]: categoryFilter } }
      ];
      if (where[Op.or]) {
        where[Op.and] = [{ [Op.or]: where[Op.or] }, { [Op.or]: catConditions }];
        delete where[Op.or];
      } else {
        where[Op.or] = catConditions;
      }
    }

    // Format filter
    if (format && format !== 'all') {
      where.format = format;
    }

    // Remote filter
    if (remote === 'true' || remote === true) {
      const remoteCondition = {
        [Op.or]: [
          { format: 'virtual' },
          { location: { [Op.iLike]: '%remote%' } },
          { location: { [Op.iLike]: '%virtual%' } },
          { location: { [Op.iLike]: '%online%' } }
        ]
      };
      if (where[Op.and]) {
        where[Op.and].push(remoteCondition);
      } else if (where[Op.or]) {
        where[Op.and] = [{ [Op.or]: where[Op.or] }, remoteCondition];
        delete where[Op.or];
      } else {
        Object.assign(where, remoteCondition);
      }
    }

    // Beginner friendly filter
    if (beginnerFriendly === 'true' || beginnerFriendly === true) {
      const beginnerCondition = {
        [Op.or]: [
          { beginnerFriendly: true },
          { experienceLevel: 'beginner' }
        ]
      };
      if (where[Op.and]) {
        where[Op.and].push(beginnerCondition);
      } else if (where[Op.or]) {
        where[Op.and] = [{ [Op.or]: where[Op.or] }, beginnerCondition];
        delete where[Op.or];
      } else {
        Object.assign(where, beginnerCondition);
      }
    }

    // Low cost filter (free or <= $25)
    if (lowCost === 'true' || lowCost === true) {
      const lowCostCondition = {
        [Op.or]: [
          { costType: 'free' },
          { costAmount: { [Op.lte]: 25.00 } }
        ]
      };
      if (where[Op.and]) {
        where[Op.and].push(lowCostCondition);
      } else if (where[Op.or]) {
        where[Op.and] = [{ [Op.or]: where[Op.or] }, lowCostCondition];
        delete where[Op.or];
      } else {
        Object.assign(where, lowCostCondition);
      }
    }

    // Sustainability focused filter
    if (sustainabilityFocused === 'true' || sustainabilityFocused === true) {
      const sustainCondition = {
        [Op.or]: [
          { sustainabilityFocused: true },
          { theme: { [Op.iLike]: '%sustainab%' } },
          { theme: { [Op.iLike]: '%green%' } },
          { theme: { [Op.iLike]: '%climate%' } }
        ]
      };
      if (where[Op.and]) {
        where[Op.and].push(sustainCondition);
      } else if (where[Op.or]) {
        where[Op.and] = [{ [Op.or]: where[Op.or] }, sustainCondition];
        delete where[Op.or];
      } else {
        Object.assign(where, sustainCondition);
      }
    }

    // Location filter
    if (location && location !== 'all') {
      where.location = { [Op.iLike]: `%${location.trim()}%` };
    }

    // Cost type filter (legacy)
    if (cost && cost !== 'all') {
      where.costType = cost;
    }

    // Experience level filter (legacy)
    if (experienceLevel && experienceLevel !== 'all') {
      where.experienceLevel = experienceLevel;
    }

    // Order resolution
    let order = [['applicationDeadline', 'ASC']];
    if (sort === 'newest') {
      order = [['createdAt', 'DESC']];
    } else if (sort === 'title') {
      order = [['title', 'ASC']];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    // Fetch records
    const isRelevanceSort = sort === 'match' || sort === 'relevance';
    const { count, rows } = await Opportunity.findAndCountAll({
      where,
      order,
      limit: isRelevanceSort ? 100 : limitNum,
      offset: isRelevanceSort ? 0 : offset
    });

    const studentProfile = req.user?.profile || null;
    let userSavedMap = new Map();

    if (req.user) {
      const savedList = await SavedOpportunity.findAll({
        where: { userId: req.user.id }
      });
      savedList.forEach(s => userSavedMap.set(s.opportunityId, s.status));
    }

    // Annotate with recommendation score and eligibility checks
    let annotated = rows.map(opp => {
      const oppJson = opp.toJSON();
      const rec = RecommendationEngine.calculateMatch(studentProfile, oppJson);
      const elig = EligibilityEngine.evaluateEligibility(studentProfile, oppJson);

      return {
        ...oppJson,
        matchScore: rec.score,
        matchLevel: rec.matchLevel,
        matchReasons: rec.reasons,
        matchedSkills: rec.matchedSkills,
        eligibilityStatus: elig.status,
        isEligible: elig.isEligible,
        eligibilitySummary: elig.summary,
        eligibilityChecks: elig.checks,
        isSaved: userSavedMap.has(opp.id),
        savedStatus: userSavedMap.get(opp.id) || null
      };
    });

    // Education level post-filter
    if (educationLevel && educationLevel !== 'all') {
      annotated = annotated.filter(o =>
        (o.eligibleEducationLevels || []).includes('all') ||
        (o.eligibleEducationLevels || []).includes(educationLevel.toLowerCase())
      );
    }

    // Country post-filter
    if (country && country !== 'all') {
      annotated = annotated.filter(o =>
        (o.eligibleCountries || []).includes('Global') ||
        (o.eligibleCountries || []).some(c => c.toLowerCase() === country.toLowerCase())
      );
    }

    // Match / Relevance sort
    if (isRelevanceSort) {
      annotated.sort((a, b) => b.matchScore - a.matchScore);
      const totalFiltered = annotated.length;
      annotated = annotated.slice(offset, offset + limitNum);
      return res.json({
        total: totalFiltered,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalFiltered / limitNum),
        opportunities: annotated
      });
    }

    res.json({
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
      opportunities: annotated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get detailed opportunity by ID or slug
 */
const getOpportunityDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const where = isUuid ? { id } : { slug: id };

    const opportunity = await Opportunity.findOne({ where });
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    // Increment view count asynchronously
    opportunity.increment('viewCount');

    const oppJson = opportunity.toJSON();
    const studentProfile = req.user?.profile || null;
    const rec = RecommendationEngine.calculateMatch(studentProfile, oppJson);
    const elig = EligibilityEngine.evaluateEligibility(studentProfile, oppJson);
    const trust = TrustSignalEngine.evaluateTrustSignal(oppJson);

    let isSaved = false;
    let savedStatus = null;
    let savedNotes = '';

    if (req.user) {
      const saved = await SavedOpportunity.findOne({
        where: { userId: req.user.id, opportunityId: opportunity.id }
      });
      if (saved) {
        isSaved = true;
        savedStatus = saved.status;
        savedNotes = saved.notes;
      }
    }

    // Find complementary/similar opportunities
    const related = await Opportunity.findAll({
      where: {
        id: { [Op.ne]: opportunity.id },
        category: opportunity.category || opportunity.opportunityType,
        status: 'active',
        isDuplicate: false
      },
      limit: 3
    });

    res.json({
      opportunity: {
        ...oppJson,
        matchScore: rec.score,
        matchLevel: rec.matchLevel,
        formula: rec.formula,
        explanation: rec.explanation,
        matchReasons: rec.reasons || [],
        reasons: rec.reasons || [],
        matchedSkills: rec.matchedSkills,
        skillGaps: rec.skillGaps,
        preparationActions: rec.preparationActions,
        matchedInterests: rec.matchedInterests,
        relevantPreferences: rec.relevantPreferences,
        missingProfileInformation: rec.missingProfileInformation,
        missingDataEffect: rec.missingDataEffect,
        componentScores: rec.componentScores,
        weightsUsed: rec.weightsUsed,
        eligibilityStatus: elig.status,
        isEligible: elig.isEligible,
        eligibilitySummary: elig.summary,
        eligibilityChecks: elig.checks,
        eligibility: elig,
        trustSignal: trust,
        trustScore: trust.trustScore,
        isSaved,
        savedStatus,
        savedNotes
      },
      relatedOpportunities: related
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Check student eligibility for a specific opportunity
 */
const getOpportunityEligibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const where = isUuid ? { id } : { slug: id };

    const opportunity = await Opportunity.findOne({ where });
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    const studentProfile = req.user?.profile || null;
    const eligibility = EligibilityEngine.evaluateEligibility(studentProfile, opportunity.toJSON());

    res.json({
      opportunityId: opportunity.id,
      title: opportunity.title,
      eligibility,
      status: eligibility.status,
      isEligible: eligibility.isEligible,
      summary: eligibility.summary,
      checks: eligibility.checks
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Save / Bookmark an opportunity (POST /api/opportunities/:id/save)
 */
const saveOpportunityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'saved', notes = '', reminderEnabled = false } = req.body;

    const opportunity = await Opportunity.findByPk(id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    const [saved, created] = await SavedOpportunity.findOrCreate({
      where: { userId: req.user.id, opportunityId: id },
      defaults: {
        userId: req.user.id,
        opportunityId: id,
        status,
        notes,
        reminderEnabled: Boolean(reminderEnabled)
      }
    });

    if (!created) {
      await saved.update({
        status: status || saved.status,
        notes: notes !== undefined ? notes : saved.notes,
        reminderEnabled: reminderEnabled !== undefined ? Boolean(reminderEnabled) : saved.reminderEnabled
      });
    }

    const reloaded = await SavedOpportunity.findByPk(saved.id, {
      include: [{ model: Opportunity, as: 'opportunity' }]
    });

    res.status(created ? 201 : 200).json({
      message: created ? 'Opportunity saved successfully.' : 'Saved status updated.',
      saved: reloaded
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Remove saved opportunity (DELETE /api/opportunities/:id/save)
 */
const unsaveOpportunityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await SavedOpportunity.destroy({
      where: { userId: req.user.id, opportunityId: id }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Saved opportunity not found.' });
    }

    res.json({ message: 'Opportunity removed from saved list.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate preparation roadmap for opportunity (POST /api/opportunities/:id/roadmap)
 */
const createOpportunityRoadmap = async (req, res, next) => {
  try {
    const { id } = req.params;

    const opportunity = await Opportunity.findByPk(id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    // Check if user already has an active roadmap for this opportunity
    let roadmap = await Roadmap.findOne({
      where: { userId: req.user.id, opportunityId: id },
      include: [{ model: RoadmapTask, as: 'tasks' }]
    });

    if (roadmap) {
      return res.json({
        message: 'Active roadmap already exists for this opportunity.',
        roadmap
      });
    }

    const plan = RoadmapGenerator.generatePlan(opportunity);

    roadmap = await Roadmap.create({
      userId: req.user.id,
      opportunityId: id,
      title: plan.title,
      targetDeadline: plan.targetDeadline,
      progressPercentage: 0,
      status: 'active'
    });

    // Create 4-phase tasks
    const taskPromises = plan.tasks.map(t =>
      RoadmapTask.create({
        roadmapId: roadmap.id,
        phase: t.phase,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate,
        isCompleted: false,
        orderIndex: t.orderIndex,
        sortOrder: t.orderIndex
      })
    );

    await Promise.all(taskPromises);

    const fullRoadmap = await Roadmap.findByPk(roadmap.id, {
      include: [
        { model: RoadmapTask, as: 'tasks' },
        { model: Opportunity, as: 'opportunity' }
      ],
      order: [[{ model: RoadmapTask, as: 'tasks' }, 'orderIndex', 'ASC']]
    });

    res.status(201).json({
      message: 'Preparation roadmap generated successfully.',
      roadmap: fullRoadmap
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get top recommendations for current user (GET /api/recommendations)
 */
const getRecommendations = async (req, res, next) => {
  try {
    const studentProfile = req.user?.profile || null;
    const opportunities = await Opportunity.findAll({
      where: { status: 'active', isDuplicate: false },
      limit: 50
    });

    let scored = opportunities.map(opp => {
      const oppJson = opp.toJSON();
      const rec = RecommendationEngine.calculateMatch(studentProfile, oppJson);
      const elig = EligibilityEngine.evaluateEligibility(studentProfile, oppJson);
      const trust = TrustSignalEngine.evaluateTrustSignal(oppJson);

      return {
        ...oppJson,
        score: rec.score,
        matchScore: rec.score,
        matchLevel: rec.matchLevel,
        formula: rec.formula,
        explanation: rec.explanation,
        matchedSkills: rec.matchedSkills,
        skillGaps: rec.skillGaps,
        preparationActions: rec.preparationActions,
        matchedInterests: rec.matchedInterests,
        relevantPreferences: rec.relevantPreferences,
        missingProfileInformation: rec.missingProfileInformation,
        missingDataEffect: rec.missingDataEffect,
        detailsLink: rec.detailsLink,
        componentScores: rec.componentScores,
        weightsUsed: rec.weightsUsed,
        eligibility: elig,
        eligibilityStatus: elig.status,
        isEligible: elig.isEligible,
        trustSignal: trust,
        trustScore: trust.trustScore
      };
    });

    // Sort deterministically with multi-criteria tie breaking
    scored = RecommendationEngine.sortRecommendations(scored);

    const topLimit = parseInt(req.query.limit, 10) || 10;
    const recommendations = scored.slice(0, topLimit);

    res.json({
      total: recommendations.length,
      recommendations
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new opportunity (POST /api/opportunities) - Admin Only
 */
const createOpportunity = async (req, res, next) => {
  try {
    const {
      title,
      organizer,
      organization,
      description,
      category = 'general',
      eventType = 'hackathon',
      opportunityType,
      theme = '',
      startDate,
      endDate,
      deadline,
      applicationDeadline,
      format = 'virtual',
      deliveryFormat,
      location = 'Online',
      costAmount = 0.00,
      currency = 'USD',
      teamMin = 1,
      teamMax = 4,
      eligibilityText = '',
      requiredSkills = [],
      beginnerFriendly = false,
      lowCost = true,
      sustainabilityFocused = false,
      sourceFeed = 'manual-admin',
      sourceUrl,
      websiteUrl,
      applicationUrl,
      status = 'active'
    } = req.body;

    if (!title || !description || (!organizer && !organization)) {
      return res.status(400).json({ error: 'Title, description, and organizer are required.' });
    }

    const resolvedDeadline = applicationDeadline || deadline || null;
    const resolvedStartDate = startDate || null;
    const resolvedEndDate = endDate || null;
    const resolvedFormat = deliveryFormat || format || 'virtual';
    const resolvedOrg = organization || organizer;

    const opp = await Opportunity.create({
      title: title.trim(),
      organizer: organizer ? organizer.trim() : resolvedOrg,
      organization: resolvedOrg,
      description: description.trim(),
      category: category || 'general',
      eventType: eventType || 'hackathon',
      opportunityType: opportunityType || eventType || 'hackathon',
      theme: theme || '',
      startDate: resolvedStartDate,
      eventStartDate: resolvedStartDate,
      endDate: resolvedEndDate,
      eventEndDate: resolvedEndDate,
      deadline: resolvedDeadline,
      applicationDeadline: resolvedDeadline,
      format: resolvedFormat,
      deliveryFormat: resolvedFormat,
      location: location || 'Online',
      costAmount: parseFloat(costAmount) || 0.00,
      currency: currency || 'USD',
      teamMin: parseInt(teamMin, 10) || 1,
      teamMax: parseInt(teamMax, 10) || 4,
      eligibilityText: eligibilityText || '',
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      beginnerFriendly: Boolean(beginnerFriendly),
      lowCost: Boolean(lowCost),
      sustainabilityFocused: Boolean(sustainabilityFocused),
      sourceFeed: sourceFeed || 'manual-admin',
      sourceName: sourceFeed || 'manual-admin',
      sourceUrl: sourceUrl || websiteUrl || applicationUrl || '',
      websiteUrl: websiteUrl || sourceUrl || applicationUrl || '',
      applicationUrl: applicationUrl || websiteUrl || sourceUrl || '',
      status: status || 'active',
      isDuplicate: false,
      lastVerifiedAt: new Date()
    });

    const trust = TrustSignalEngine.evaluateTrustSignal(opp.toJSON());
    await opp.update({
      trustScore: trust.trustScore,
      trustSignal: trust
    });

    res.status(201).json({
      message: 'Opportunity created successfully.',
      opportunity: opp
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing opportunity (PUT/PATCH /api/opportunities/:id) - Admin Only
 */
const updateOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const opp = await Opportunity.findByPk(id);

    if (!opp) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    const {
      title,
      organizer,
      organization,
      description,
      category,
      eventType,
      opportunityType,
      theme,
      startDate,
      endDate,
      deadline,
      applicationDeadline,
      format,
      deliveryFormat,
      location,
      costAmount,
      currency,
      teamMin,
      teamMax,
      eligibilityText,
      requiredSkills,
      beginnerFriendly,
      lowCost,
      sustainabilityFocused,
      sourceFeed,
      sourceUrl,
      websiteUrl,
      applicationUrl,
      status
    } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (organizer !== undefined) updates.organizer = organizer.trim();
    if (organization !== undefined) updates.organization = organization.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) updates.category = category;
    if (eventType !== undefined) {
      updates.eventType = eventType;
      updates.opportunityType = eventType;
    }
    if (opportunityType !== undefined) updates.opportunityType = opportunityType;
    if (theme !== undefined) updates.theme = theme;
    if (startDate !== undefined) {
      updates.startDate = startDate;
      updates.eventStartDate = startDate;
    }
    if (endDate !== undefined) {
      updates.endDate = endDate;
      updates.eventEndDate = endDate;
    }
    if (deadline !== undefined || applicationDeadline !== undefined) {
      const d = applicationDeadline !== undefined ? applicationDeadline : deadline;
      updates.deadline = d;
      updates.applicationDeadline = d;
    }
    if (format !== undefined || deliveryFormat !== undefined) {
      const f = deliveryFormat !== undefined ? deliveryFormat : format;
      updates.format = f;
      updates.deliveryFormat = f;
    }
    if (location !== undefined) updates.location = location;
    if (costAmount !== undefined) updates.costAmount = parseFloat(costAmount);
    if (currency !== undefined) updates.currency = currency;
    if (teamMin !== undefined) updates.teamMin = parseInt(teamMin, 10);
    if (teamMax !== undefined) updates.teamMax = parseInt(teamMax, 10);
    if (eligibilityText !== undefined) updates.eligibilityText = eligibilityText;
    if (requiredSkills !== undefined) updates.requiredSkills = Array.isArray(requiredSkills) ? requiredSkills : [];
    if (beginnerFriendly !== undefined) updates.beginnerFriendly = Boolean(beginnerFriendly);
    if (lowCost !== undefined) updates.lowCost = Boolean(lowCost);
    if (sustainabilityFocused !== undefined) updates.sustainabilityFocused = Boolean(sustainabilityFocused);
    if (sourceFeed !== undefined) {
      updates.sourceFeed = sourceFeed;
      updates.sourceName = sourceFeed;
    }
    if (sourceUrl !== undefined) updates.sourceUrl = sourceUrl;
    if (websiteUrl !== undefined) updates.websiteUrl = websiteUrl;
    if (applicationUrl !== undefined) updates.applicationUrl = applicationUrl;
    if (status !== undefined) updates.status = status;

    updates.lastVerifiedAt = new Date();

    await opp.update(updates);

    const trust = TrustSignalEngine.evaluateTrustSignal(opp.toJSON());
    await opp.update({
      trustScore: trust.trustScore,
      trustSignal: trust
    });

    res.json({
      message: 'Opportunity updated successfully.',
      opportunity: opp
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete an opportunity (DELETE /api/opportunities/:id) - Admin Only
 */
const deleteOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const opp = await Opportunity.findByPk(id);

    if (!opp) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    await opp.destroy();

    res.json({
      message: 'Opportunity deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOpportunities,
  getOpportunityDetail,
  getOpportunityEligibility,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  saveOpportunityById,
  unsaveOpportunityById,
  createOpportunityRoadmap,
  getRecommendations
};
