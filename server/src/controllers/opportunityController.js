const { Opportunity, SavedOpportunity } = require('../models');
const { Op } = require('sequelize');
const RecommendationEngine = require('../services/recommendationEngine');
const EligibilityEngine = require('../services/eligibilityEngine');

/**
 * Get catalog of opportunities with search, multi-filters, sorting, and pagination
 */
const getOpportunities = async (req, res, next) => {
  try {
    const {
      search,
      type,
      format,
      cost,
      experienceLevel,
      educationLevel,
      country,
      status = 'active',
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
    if (status !== 'all') {
      where.status = status;
    }

    // Opportunity type / category
    if (type && type !== 'all') {
      where.opportunityType = type;
    }

    // Delivery format
    if (format && format !== 'all') {
      where.format = format;
    }

    // Cost type
    if (cost && cost !== 'all') {
      where.costType = cost;
    }

    // Experience level
    if (experienceLevel && experienceLevel !== 'all') {
      where.experienceLevel = experienceLevel;
    }

    // Keyword search across title, organization, description
    if (search && search.trim().length > 0) {
      const term = `%${search.trim().toLowerCase()}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: term } },
        { organization: { [Op.iLike]: term } },
        { description: { [Op.iLike]: term } }
      ];
    }

    // Determine initial DB order
    let order = [['applicationDeadline', 'ASC']];
    if (sort === 'newest') {
      order = [['createdAt', 'DESC']];
    } else if (sort === 'title') {
      order = [['title', 'ASC']];
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10);

    // Fetch records
    const { count, rows } = await Opportunity.findAndCountAll({
      where,
      order,
      // If sorting by relevance, we fetch slightly broader set or sort after scoring
      limit: sort === 'relevance' ? 100 : parsedLimit,
      offset: sort === 'relevance' ? 0 : offset
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

    // If education level filter applied in query
    if (educationLevel && educationLevel !== 'all') {
      annotated = annotated.filter(o => 
        (o.eligibleEducationLevels || []).includes('all') || 
        (o.eligibleEducationLevels || []).includes(educationLevel.toLowerCase())
      );
    }

    // If country filter applied in query
    if (country && country !== 'all') {
      annotated = annotated.filter(o =>
        (o.eligibleCountries || []).includes('Global') ||
        (o.eligibleCountries || []).some(c => c.toLowerCase() === country.toLowerCase())
      );
    }

    // If sorting by relevance
    if (sort === 'relevance') {
      annotated.sort((a, b) => b.matchScore - a.matchScore);
      const totalFiltered = annotated.length;
      annotated = annotated.slice(offset, offset + parsedLimit);
      return res.json({
        total: totalFiltered,
        page: parseInt(page, 10),
        totalPages: Math.ceil(totalFiltered / parsedLimit),
        opportunities: annotated
      });
    }

    res.json({
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / parsedLimit),
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

    // Find 3 similar or complementary opportunities
    const related = await Opportunity.findAll({
      where: {
        id: { [Op.ne]: opportunity.id },
        opportunityType: opportunity.opportunityType,
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
        matchReasons: rec.reasons,
        matchedSkills: rec.matchedSkills,
        eligibilityStatus: elig.status,
        isEligible: elig.isEligible,
        eligibilitySummary: elig.summary,
        eligibilityChecks: elig.checks,
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

module.exports = {
  getOpportunities,
  getOpportunityDetail
};
