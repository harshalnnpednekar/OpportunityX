/**
 * RecommendationEngine — Deterministic, explainable matching engine for OpportunityX.
 * 
 * Features:
 * - Configurable baseline weights (Skill: 30%, Interest: 25%, Format/Location/Availability: 15%, Budget: 15%, Experience: 10%, Sustainability: 5%).
 * - Dynamic weight re-normalization when student profile preferences are missing, ensuring students with partial profiles are fairly scored.
 * - Granular breakdown with mathematical explanations, matched skills, matched interests, skill gaps with actionable preparation suggestions, and missing profile warnings.
 * - Independent from eligibility and trust/data-quality signals.
 */

const DEFAULT_WEIGHTS = {
  skill: 0.30,
  interest: 0.25,
  formatLocationAvailability: 0.15,
  budget: 0.15,
  experience: 0.10,
  sustainability: 0.05
};

class RecommendationEngine {
  /**
   * Generates actionable preparation suggestions for missing skills
   */
  static getPreparationAction(skill) {
    const s = String(skill || '').toLowerCase().trim();
    if (s.includes('python')) return `Practice Python data structures and algorithmic problem-solving on LeetCode/HackerRank.`;
    if (s.includes('react') || s.includes('vue') || s.includes('front')) return `Build a modular component library and review state management hooks and responsive styling.`;
    if (s.includes('node') || s.includes('express') || s.includes('fastapi') || s.includes('back')) return `Implement a RESTful API with route validation, JWT authentication, and database migrations.`;
    if (s.includes('docker') || s.includes('container') || s.includes('k8s')) return `Containerize a full-stack microservice and test local multi-container composition.`;
    if (s.includes('c++') || s.includes('rust')) return `Review memory safety, pointers, async runtimes, and competitive programming paradigms.`;
    if (s.includes('git')) return `Review Git branching, pull request workflows, merge conflict resolution, and documentation standards.`;
    if (s.includes('ai') || s.includes('pytorch') || s.includes('ml') || s.includes('tensor')) return `Experiment with transfer learning, prompt tuning, or fine-tuning open weights on HuggingFace.`;
    if (s.includes('sql') || s.includes('postgres')) return `Practice relational schema modeling, indexing strategies, and complex analytical SQL queries.`;
    return `Complete introductory tutorial documentation and build a 2-hour prototype covering ${skill} fundamentals.`;
  }

  /**
   * Normalizes weights across active profile dimensions
   */
  static normalizeWeights(activeFlags, weights = DEFAULT_WEIGHTS) {
    let activeSum = 0;
    const activeWeights = {};

    for (const [key, baseWeight] of Object.entries(weights)) {
      if (activeFlags[key]) {
        activeSum += baseWeight;
        activeWeights[key] = baseWeight;
      } else {
        activeWeights[key] = 0;
      }
    }

    const normalized = {};
    for (const [key, weight] of Object.entries(activeWeights)) {
      normalized[key] = activeSum > 0 ? parseFloat((weight / activeSum).toFixed(4)) : 0;
    }

    return { normalized, activeSum, isFullySpecified: activeSum >= 0.99 };
  }

  /**
   * Calculates deterministic match score and explainable breakdown
   */
  static calculateMatch(profile, opportunity, options = {}) {
    const weightsConfig = options.weights || DEFAULT_WEIGHTS;
    const referenceDate = options.referenceDate || new Date();

    // -------------------------------------------------------------
    // Baseline if student has no profile at all
    // -------------------------------------------------------------
    if (!profile) {
      return {
        score: 50,
        matchLevel: 'Baseline Catalog Listing',
        formula: 'Baseline score: 50/100 (Unauthenticated or empty profile)',
        explanation: 'Baseline exploratory score assigned because no student profile was loaded. Sign in or create a student profile to receive tailored recommendations.',
        matchedSkills: [],
        skillGaps: (opportunity.requiredSkills || []).slice(0, 5),
        preparationActions: (opportunity.requiredSkills || []).slice(0, 3).map(RecommendationEngine.getPreparationAction),
        matchedInterests: [],
        relevantPreferences: {},
        missingProfileInformation: ['skills', 'interests', 'preferredFormat', 'preferredLocation', 'budgetMax', 'experienceLevel'],
        missingDataEffect: 'All preference dimensions are missing. Explore listings or build your student profile for personalized rankings.',
        componentScores: {},
        weightsUsed: {},
        detailsLink: `/opportunities/${opportunity.id}`
      };
    }

    // -------------------------------------------------------------
    // Detect active preference dimensions in student profile
    // -------------------------------------------------------------
    const studentSkills = (profile.skills || []).map(s => String(s).toLowerCase().trim()).filter(Boolean);
    const studentInterests = (profile.interests || []).map(i => String(i).toLowerCase().trim()).filter(Boolean);
    const hasFormat = Boolean(profile.preferredFormat || profile.formatPreference);
    const hasLocation = Boolean(profile.preferredLocation || profile.country);
    const hasAvailability = Boolean(profile.availability);
    const hasFormatLocAvail = hasFormat || hasLocation || hasAvailability;
    const hasBudget = profile.budgetMax !== undefined && profile.budgetMax !== null && Number(profile.budgetMax) > 0;
    const hasExperience = Boolean(profile.experienceLevel);
    const hasSustainability = studentInterests.some(i => i.includes('sustainab') || i.includes('climate') || i.includes('green')) || profile.sustainabilityPreference === true;

    const activeFlags = {
      skill: studentSkills.length > 0,
      interest: studentInterests.length > 0,
      formatLocationAvailability: hasFormatLocAvail,
      budget: hasBudget,
      experience: hasExperience,
      sustainability: hasSustainability
    };

    const missingProfileInformation = [];
    if (!activeFlags.skill) missingProfileInformation.push('skills');
    if (!activeFlags.interest) missingProfileInformation.push('interests');
    if (!activeFlags.budget) missingProfileInformation.push('budgetMax');
    if (!activeFlags.formatLocationAvailability) missingProfileInformation.push('preferredFormat / preferredLocation');
    if (!activeFlags.experience) missingProfileInformation.push('experienceLevel');

    const { normalized: normWeights, activeSum, isFullySpecified } = RecommendationEngine.normalizeWeights(activeFlags, weightsConfig);

    // -------------------------------------------------------------
    // 1. Skill Overlap (Base 30%)
    // -------------------------------------------------------------
    const oppSkills = (opportunity.requiredSkills || []).map(s => String(s).toLowerCase().trim()).filter(Boolean);
    const matchedSkills = [];
    const skillGaps = [];

    oppSkills.forEach(req => {
      const isMatch = studentSkills.some(s => s === req || s.includes(req) || req.includes(s));
      if (isMatch) {
        matchedSkills.push(req);
      } else {
        skillGaps.push(req);
      }
    });

    let rawSkillScore = 0;
    let skillExplanation = '';
    if (oppSkills.length === 0 || (oppSkills.length === 1 && oppSkills[0] === 'general')) {
      rawSkillScore = 85;
      skillExplanation = 'Open to all backgrounds: No restrictive technical prerequisites specified.';
    } else if (matchedSkills.length > 0) {
      const matchRatio = matchedSkills.length / oppSkills.length;
      rawSkillScore = Math.min(100, Math.round(matchRatio * 75 + matchedSkills.length * 8));
      skillExplanation = `Matches ${matchedSkills.length} of ${oppSkills.length} required skill(s) (${matchedSkills.slice(0, 4).join(', ')}).`;
    } else if (studentSkills.length > 0) {
      rawSkillScore = 20;
      skillExplanation = `Skill growth opportunity: Requires ${oppSkills.slice(0, 3).join(', ')} (no direct overlap with your current profile skills).`;
    } else {
      rawSkillScore = 50;
      skillExplanation = 'No technical skills specified in student profile.';
    }

    const preparationActions = skillGaps.slice(0, 3).map(RecommendationEngine.getPreparationAction);

    // -------------------------------------------------------------
    // 2. Interest / Category Overlap (Base 25%)
    // -------------------------------------------------------------
    const oppCategory = String(opportunity.category || opportunity.eventType || '').toLowerCase();
    const oppText = `${opportunity.title || ''} ${opportunity.description || ''} ${opportunity.theme || ''}`.toLowerCase();
    const matchedInterests = [];
    let rawInterestScore = 0;

    studentInterests.forEach(interest => {
      const inCategory = oppCategory.includes(interest) || interest.includes(oppCategory);
      const inText = oppText.includes(interest);
      if (inCategory || inText) {
        matchedInterests.push(interest);
      }
    });

    if (matchedInterests.length > 0) {
      const directCategoryMatch = studentInterests.some(i => oppCategory.includes(i) || i.includes(oppCategory));
      rawInterestScore = Math.min(100, (directCategoryMatch ? 60 : 30) + matchedInterests.length * 15);
    } else if (studentInterests.length > 0) {
      rawInterestScore = 20;
    } else {
      rawInterestScore = 50;
    }

    const interestExplanation = matchedInterests.length > 0
      ? `Aligns with student focus areas: ${matchedInterests.slice(0, 3).join(', ')}.`
      : (studentInterests.length > 0 ? 'Differs from your primary listed focus interests.' : 'No interests specified in profile.');

    // -------------------------------------------------------------
    // 3. Format, Location & Availability Fit (Base 15%)
    // -------------------------------------------------------------
    const studentFormat = String(profile.preferredFormat || profile.formatPreference || 'all').toLowerCase();
    const oppFormat = String(opportunity.format || 'virtual').toLowerCase();
    const studentLocation = String(profile.preferredLocation || profile.country || 'Global').toLowerCase();
    const oppLocation = String(opportunity.location || 'Online').toLowerCase();

    let formatPoints = 30;
    if (studentFormat === 'all' || studentFormat === oppFormat || oppFormat === 'hybrid') {
      formatPoints = 50;
    } else if (oppFormat === 'virtual') {
      formatPoints = 40;
    }

    let locationPoints = 20;
    if (oppFormat === 'virtual' || oppLocation.includes('online')) {
      locationPoints = 40;
    } else if (studentLocation === 'global' || oppLocation.includes(studentLocation) || studentLocation.includes(oppLocation)) {
      locationPoints = 40;
    } else {
      locationPoints = 15;
    }

    let availabilityPoints = 10;
    const rawFormatScore = Math.min(100, formatPoints + locationPoints + availabilityPoints);
    const formatExplanation = `Delivery model: ${opportunity.format} (preference: ${profile.preferredFormat || 'all'}); Venue: ${opportunity.location}.`;

    // -------------------------------------------------------------
    // 4. Budget Fit (Base 15%)
    // -------------------------------------------------------------
    const oppCost = parseFloat(opportunity.costAmount) || 0.00;
    const studentBudget = Number(profile.budgetMax) || 0.00;
    let rawBudgetScore = 100;
    let budgetExplanation = '';

    if (opportunity.costType === 'free' || opportunity.costType === 'stipend_provided' || oppCost === 0) {
      rawBudgetScore = 100;
      budgetExplanation = opportunity.costType === 'stipend_provided'
        ? 'Stipend provided: Fully funded with living or travel allowance.'
        : 'Free registration: No monetary entry fees required.';
    } else if (activeFlags.budget) {
      if (oppCost <= studentBudget) {
        rawBudgetScore = 90;
        budgetExplanation = `Cost (${opportunity.currency || 'USD'} ${oppCost}) is within your maximum budget of ${opportunity.currency || 'USD'} ${studentBudget}.`;
      } else {
        const overage = oppCost - studentBudget;
        rawBudgetScore = Math.max(10, Math.round(100 - (overage / oppCost) * 100));
        budgetExplanation = `Cost (${opportunity.currency || 'USD'} ${oppCost}) exceeds your stated budget (${opportunity.currency || 'USD'} ${studentBudget}).`;
      }
    } else {
      rawBudgetScore = oppCost > 0 ? 50 : 100;
      budgetExplanation = oppCost > 0
        ? `Paid listing (${opportunity.currency || 'USD'} ${oppCost}); specify budgetMax in profile to refine.`
        : 'Free registration.';
    }

    // -------------------------------------------------------------
    // 5. Experience Suitability (Base 10%)
    // -------------------------------------------------------------
    const studentExp = String(profile.experienceLevel || 'beginner').toLowerCase();
    const isBeginnerFriendly = Boolean(opportunity.beginnerFriendly);
    let rawExperienceScore = 70;
    let experienceExplanation = '';

    if (isBeginnerFriendly) {
      if (studentExp === 'beginner') {
        rawExperienceScore = 100;
        experienceExplanation = 'Beginner-friendly opportunity directly tailored to entry-level learners.';
      } else {
        rawExperienceScore = 80;
        experienceExplanation = 'Welcoming to beginner and intermediate contributors.';
      }
    } else {
      if (studentExp === 'advanced') {
        rawExperienceScore = 100;
        experienceExplanation = 'Competitive/advanced opportunity aligned with your senior experience level.';
      } else if (studentExp === 'intermediate') {
        rawExperienceScore = 70;
        experienceExplanation = 'Intermediate challenge: May require independent self-guided preparation.';
      } else {
        rawExperienceScore = 35;
        experienceExplanation = 'Advanced requirements: Recommended to review preparation roadmap tasks.';
      }
    }

    // -------------------------------------------------------------
    // 6. Sustainability Preference (Base 5%)
    // -------------------------------------------------------------
    const isSustain = Boolean(opportunity.sustainabilityFocused) || oppText.includes('climate') || oppText.includes('sustainab');
    let rawSustainScore = 50;
    let sustainExplanation = '';

    if (hasSustainability) {
      if (isSustain) {
        rawSustainScore = 100;
        sustainExplanation = 'Directly matches your interest in climate intelligence and sustainable development.';
      } else {
        rawSustainScore = 30;
        sustainExplanation = 'General technology theme without explicit sustainability focus.';
      }
    } else {
      rawSustainScore = isSustain ? 75 : 60;
      sustainExplanation = isSustain ? 'Features environmental & climate tracks.' : 'Standard innovation focus.';
    }

    // -------------------------------------------------------------
    // Weight Normalization & Weighted Sum
    // -------------------------------------------------------------
    const componentScores = {
      skill: rawSkillScore,
      interest: rawInterestScore,
      formatLocationAvailability: rawFormatScore,
      budget: rawBudgetScore,
      experience: rawExperienceScore,
      sustainability: rawSustainScore
    };

    let totalScore = 0;
    for (const [key, rawScore] of Object.entries(componentScores)) {
      totalScore += rawScore * (normWeights[key] || 0);
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));

    let matchLevel = 'Fair Match';
    if (finalScore >= 80) matchLevel = 'Top Match';
    else if (finalScore >= 65) matchLevel = 'Strong Match';
    else if (finalScore >= 50) matchLevel = 'Good Match';

    // Detailed formula documentation
    const formula = `Score = ${Math.round(totalScore)}/100 calculated from [Skill: ${rawSkillScore} × ${normWeights.skill || 0}] + [Interest: ${rawInterestScore} × ${normWeights.interest || 0}] + [Format/Location: ${rawFormatScore} × ${normWeights.formatLocationAvailability || 0}] + [Budget: ${rawBudgetScore} × ${normWeights.budget || 0}] + [Experience: ${rawExperienceScore} × ${normWeights.experience || 0}] + [Sustainability: ${rawSustainScore} × ${normWeights.sustainability || 0}]`;

    const missingDataEffect = isFullySpecified
      ? 'All profile preference dimensions were active and evaluated.'
      : `Missing data (${missingProfileInformation.join(', ')}): Active dimensions were re-normalized to sum to 100% so you are not penalized for unprovided preferences.`;

    const explanation = [
      skillExplanation,
      interestExplanation,
      formatExplanation,
      budgetExplanation,
      experienceExplanation,
      sustainExplanation
    ].filter(Boolean).join(' ');

    const reasons = [
      { label: skillExplanation, points: Math.round(rawSkillScore * (normWeights.skill || 0)) },
      { label: interestExplanation, points: Math.round(rawInterestScore * (normWeights.interest || 0)) },
      { label: formatExplanation, points: Math.round(rawFormatScore * (normWeights.formatLocationAvailability || 0)) },
      { label: budgetExplanation, points: Math.round(rawBudgetScore * (normWeights.budget || 0)) },
      { label: experienceExplanation, points: Math.round(rawExperienceScore * (normWeights.experience || 0)) },
      { label: sustainExplanation, points: Math.round(rawSustainScore * (normWeights.sustainability || 0)) }
    ].filter(r => r.label);

    return {
      score: finalScore,
      matchLevel,
      formula,
      explanation,
      reasons,
      matchReasons: reasons,
      matchedSkills,
      skillGaps,
      preparationActions,
      matchedInterests,
      relevantPreferences: {
        preferredFormat: profile.preferredFormat || 'all',
        preferredLocation: profile.preferredLocation || 'Global',
        budgetMax: profile.budgetMax,
        experienceLevel: profile.experienceLevel,
        availability: profile.availability
      },
      missingProfileInformation,
      missingDataEffect,
      componentScores,
      weightsUsed: normWeights,
      detailsLink: `/opportunities/${opportunity.id}`
    };
  }

  /**
   * Deterministic sorting with tie-breaking:
   * 1. Match score (descending)
   * 2. Deadline proximity (soonest deadline first, excluding past dates)
   * 3. Title alphabetical (ascending)
   */
  static sortRecommendations(scoredList, referenceDate = new Date()) {
    return [...scoredList].sort((a, b) => {
      // Primary: Score descending
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }

      // Secondary: Deadline proximity
      const now = referenceDate.getTime();
      const timeA = a.applicationDeadline ? new Date(a.applicationDeadline).getTime() : Infinity;
      const timeB = b.applicationDeadline ? new Date(b.applicationDeadline).getTime() : Infinity;
      const diffA = timeA - now;
      const diffB = timeB - now;

      // Positive diffs (future deadlines) come before past or infinite
      const validA = diffA > 0;
      const validB = diffB > 0;

      if (validA && validB && timeA !== timeB) {
        return timeA - timeB;
      }
      if (validA && !validB) return -1;
      if (!validA && validB) return 1;

      // Tertiary: Deterministic alphabetical tie-breaker
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }
}

module.exports = RecommendationEngine;
