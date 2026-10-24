class RecommendationEngine {
  /**
   * Deterministically calculates match score (0-100) and explainable breakdown
   * @param {Object} profile - Student profile
   * @param {Object} opportunity - Opportunity record
   * @param {Date} referenceDate - Current evaluation date
   */
  static calculateMatch(profile, opportunity, referenceDate = new Date()) {
    if (!profile) {
      return {
        score: 50,
        matchLevel: 'Baseline',
        reasons: [{ label: 'General catalog listing (no student profile loaded)', points: 50 }],
        matchedSkills: []
      };
    }

    const reasons = [];
    let totalScore = 0;

    const studentSkills = (profile.skills || []).map(s => String(s).toLowerCase().trim());
    const oppSkills = (opportunity.requiredSkills || []).map(s => String(s).toLowerCase().trim());

    // 1. Skill Match (Max 40 points)
    const matchedSkills = [];
    oppSkills.forEach(reqSkill => {
      const found = studentSkills.find(sSkill => 
        sSkill === reqSkill || 
        sSkill.includes(reqSkill) || 
        reqSkill.includes(sSkill)
      );
      if (found) {
        matchedSkills.push(reqSkill);
      }
    });

    if (oppSkills.length === 0 || (oppSkills.length === 1 && oppSkills[0] === 'general')) {
      const skillPts = 20;
      totalScore += skillPts;
      reasons.push({
        label: 'Open to all technical backgrounds and disciplines',
        points: skillPts
      });
    } else if (matchedSkills.length > 0) {
      const matchRatio = matchedSkills.length / oppSkills.length;
      const skillPts = Math.min(40, Math.round(matchRatio * 30 + matchedSkills.length * 4));
      totalScore += skillPts;
      reasons.push({
        label: `Directly matches ${matchedSkills.length} required skill(s): ${matchedSkills.slice(0, 4).join(', ')}`,
        points: skillPts
      });
    } else {
      reasons.push({
        label: 'Growth opportunity: Introduces new technical stack areas',
        points: 0
      });
    }

    // 2. Interests & Category Alignment (Max 25 points)
    const studentInterests = (profile.interests || []).map(i => String(i).toLowerCase().trim());
    const oppType = (opportunity.opportunityType || '').toLowerCase();
    const oppText = `${opportunity.title} ${opportunity.description}`.toLowerCase();

    let interestPts = 0;
    const matchingInterests = [];

    // Check direct category match
    if (studentInterests.some(i => i.includes(oppType) || oppType.includes(i))) {
      interestPts += 15;
      matchingInterests.push(opportunity.opportunityType);
    }

    // Check keyword alignment in description
    studentInterests.forEach(interest => {
      if (oppText.includes(interest) && !matchingInterests.includes(interest)) {
        interestPts = Math.min(25, interestPts + 5);
        matchingInterests.push(interest);
      }
    });

    if (interestPts > 0) {
      totalScore += interestPts;
      reasons.push({
        label: `Aligns with student focus areas: ${matchingInterests.slice(0, 3).join(', ')}`,
        points: interestPts
      });
    } else if (studentInterests.length === 0) {
      const baselineInterest = 10;
      totalScore += baselineInterest;
      reasons.push({
        label: 'Exploratory match across broad discovery categories',
        points: baselineInterest
      });
    }

    // 3. Education Level Fit (Max 15 points)
    const eligibleLevels = (opportunity.eligibleEducationLevels || []).map(l => String(l).toLowerCase());
    const studentLevel = (profile.educationLevel || 'undergraduate').toLowerCase();

    if (eligibleLevels.includes('all') || eligibleLevels.includes(studentLevel)) {
      const eduPts = 15;
      totalScore += eduPts;
      reasons.push({
        label: `Academic level (${profile.educationLevel || 'Undergraduate'}) is explicitly targeted`,
        points: eduPts
      });
    } else {
      reasons.push({
        label: `Notice: Geared towards ${eligibleLevels.join(', ')} candidates`,
        points: 0
      });
    }

    // 4. Format Preference Match (Max 10 points)
    const studentFormat = (profile.formatPreference || 'all').toLowerCase();
    const oppFormat = (opportunity.format || 'virtual').toLowerCase();

    if (studentFormat === 'all' || studentFormat === oppFormat || oppFormat === 'hybrid') {
      const formatPts = 10;
      totalScore += formatPts;
      reasons.push({
        label: `Delivery model (${opportunity.format}) conforms to format preference`,
        points: formatPts
      });
    } else {
      reasons.push({
        label: `Location structure: ${opportunity.format} (preference: ${profile.formatPreference})`,
        points: 0
      });
    }

    // 5. Deadline Proximity & Planning Feasibility (Max 10 points)
    if (opportunity.applicationDeadline) {
      const deadline = new Date(opportunity.applicationDeadline);
      const diffDays = Math.ceil((deadline - referenceDate) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        reasons.push({
          label: 'Application window expired',
          points: 0
        });
      } else if (diffDays >= 7 && diffDays <= 45) {
        const timePts = 10;
        totalScore += timePts;
        reasons.push({
          label: `Optimal preparation runway: ${diffDays} days until deadline`,
          points: timePts
        });
      } else if (diffDays > 45 && diffDays <= 90) {
        const timePts = 7;
        totalScore += timePts;
        reasons.push({
          label: `Longer-range planning timeline: ${diffDays} days away`,
          points: timePts
        });
      } else if (diffDays < 7) {
        const timePts = 4;
        totalScore += timePts;
        reasons.push({
          label: `Urgent deadline: ${diffDays} days remaining to apply`,
          points: timePts
        });
      } else {
        const timePts = 5;
        totalScore += timePts;
        reasons.push({
          label: `Early roadmap notice: ${diffDays} days remaining`,
          points: timePts
        });
      }
    }

    // Final score clamped between 0 and 100
    const finalScore = Math.min(100, Math.max(0, totalScore));

    let matchLevel = 'Fair Match';
    if (finalScore >= 80) matchLevel = 'Excellent Match';
    else if (finalScore >= 65) matchLevel = 'Strong Match';
    else if (finalScore >= 50) matchLevel = 'Good Match';

    return {
      score: finalScore,
      matchLevel,
      reasons,
      matchedSkills
    };
  }
}

module.exports = RecommendationEngine;
