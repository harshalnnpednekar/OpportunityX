/**
 * EligibilityEngine — Deterministic, factual eligibility evaluation for OpportunityX.
 * 
 * Rules:
 * - Independent from recommendation relevance scores.
 * - Exact statuses: 'eligible', 'likely_eligible', 'needs_review', 'not_eligible', 'unknown'.
 * - Relies strictly on explicit opportunity requirements and available profile facts.
 * - Never infers age limits, location restrictions, education levels, or costs.
 * - Skill gaps are treated as preparation suggestions, not automatic disqualifiers.
 */

class EligibilityEngine {
  /**
   * Evaluates student eligibility against explicit opportunity criteria
   * @param {Object} profile - Student profile (can be null)
   * @param {Object} opportunity - Opportunity record
   * @returns {Object} Evaluation result with status, summary, and itemized checks
   */
  static evaluateEligibility(profile, opportunity) {
    if (!profile) {
      return {
        status: 'unknown',
        isEligible: null,
        summary: 'Log in and complete your student profile to evaluate eligibility.',
        checks: [
          {
            criterion: 'Profile Completion',
            status: 'unknown',
            passed: null,
            details: 'No student profile detected. Sign in to evaluate academic standing and geographic qualification.'
          }
        ]
      };
    }

    const checks = [];
    let hasFailure = false;
    let hasNeedsReview = false;
    let hasExplicitRequirements = false;

    // -------------------------------------------------------------
    // 1. Academic / Education Level Check
    // -------------------------------------------------------------
    const rawAllowedEdu = opportunity.eligibleEducationLevels || [];
    const allowedEdu = (Array.isArray(rawAllowedEdu) ? rawAllowedEdu : [rawAllowedEdu])
      .map(e => String(e).toLowerCase().trim())
      .filter(Boolean);

    const studentEdu = String(profile.educationLevel || '').toLowerCase().trim();

    if (allowedEdu.length > 0 && !allowedEdu.includes('all')) {
      hasExplicitRequirements = true;
      if (studentEdu) {
        if (allowedEdu.includes(studentEdu)) {
          checks.push({
            criterion: 'Academic Standing',
            status: 'pass',
            passed: true,
            details: `Verified: Academic level (${profile.educationLevel}) satisfies requirement (${allowedEdu.join(', ')}).`
          });
        } else {
          hasFailure = true;
          checks.push({
            criterion: 'Academic Standing',
            status: 'fail',
            passed: false,
            details: `Ineligible: Opportunity explicitly requires [${allowedEdu.join(', ')}], but your profile is registered as [${profile.educationLevel}].`
          });
        }
      } else {
        hasNeedsReview = true;
        checks.push({
          criterion: 'Academic Standing',
          status: 'needs_review',
          passed: null,
          details: `Needs review: Opportunity requires [${allowedEdu.join(', ')}], but educationLevel is not specified in your profile.`
        });
      }
    } else {
      checks.push({
        criterion: 'Academic Standing',
        status: 'pass',
        passed: true,
        details: 'Open to all academic backgrounds (no restrictive degree requirements specified).'
      });
    }

    // -------------------------------------------------------------
    // 2. Geographic / Regional Eligibility Check
    // -------------------------------------------------------------
    const rawAllowedRegions = opportunity.eligibleCountries || [];
    const allowedRegions = (Array.isArray(rawAllowedRegions) ? rawAllowedRegions : [rawAllowedRegions])
      .map(c => String(c).toLowerCase().trim())
      .filter(Boolean);

    const studentCountry = String(profile.country || profile.preferredLocation || '').toLowerCase().trim();

    if (allowedRegions.length > 0 && !allowedRegions.includes('global')) {
      hasExplicitRequirements = true;
      if (studentCountry && studentCountry !== 'global') {
        const matchesRegion = allowedRegions.some(r => studentCountry.includes(r) || r.includes(studentCountry));
        if (matchesRegion) {
          checks.push({
            criterion: 'Geographic Eligibility',
            status: 'pass',
            passed: true,
            details: `Verified: Location (${profile.country || profile.preferredLocation}) is within permitted regions (${allowedRegions.join(', ')}).`
          });
        } else {
          hasFailure = true;
          checks.push({
            criterion: 'Geographic Eligibility',
            status: 'fail',
            passed: false,
            details: `Ineligible: Opportunity is restricted to participants in [${allowedRegions.join(', ')}], but your location is [${profile.country || profile.preferredLocation}].`
          });
        }
      } else {
        hasNeedsReview = true;
        checks.push({
          criterion: 'Geographic Eligibility',
          status: 'needs_review',
          passed: null,
          details: `Needs review: Opportunity is restricted to [${allowedRegions.join(', ')}], but your country of residence is not specified in your profile.`
        });
      }
    } else {
      checks.push({
        criterion: 'Geographic Eligibility',
        status: 'pass',
        passed: true,
        details: 'Open globally to participants worldwide.'
      });
    }

    // -------------------------------------------------------------
    // 3. Age Constraints Check (No inference! Only explicit facts)
    // -------------------------------------------------------------
    const minAge = opportunity.minAge;
    const maxAge = opportunity.maxAge;

    if (minAge || maxAge) {
      hasExplicitRequirements = true;
      // Never infer age from graduation year! Only use explicit profile age if recorded
      const studentAge = profile.age !== undefined && profile.age !== null ? parseInt(profile.age, 10) : null;

      if (studentAge !== null && !isNaN(studentAge)) {
        let agePassed = true;
        let failDetail = '';

        if (minAge && studentAge < minAge) {
          agePassed = false;
          failDetail = `Minimum age requirement is ${minAge} (profile age is ${studentAge}).`;
        }
        if (maxAge && studentAge > maxAge) {
          agePassed = false;
          failDetail = `Maximum age limit is ${maxAge} (profile age is ${studentAge}).`;
        }

        if (agePassed) {
          checks.push({
            criterion: 'Age Restriction',
            status: 'pass',
            passed: true,
            details: `Verified: Your age (${studentAge}) satisfies required bracket (${minAge || 'Any'} - ${maxAge || 'Any'}).`
          });
        } else {
          hasFailure = true;
          checks.push({
            criterion: 'Age Restriction',
            status: 'fail',
            passed: false,
            details: `Ineligible: ${failDetail}`
          });
        }
      } else {
        hasNeedsReview = true;
        checks.push({
          criterion: 'Age Restriction',
          status: 'needs_review',
          passed: null,
          details: `Needs review: Opportunity specifies age range (${minAge || 'Any'} - ${maxAge || 'Any'}), but birthdate or exact age is not recorded in your student profile.`
        });
      }
    } else {
      checks.push({
        criterion: 'Age Restriction',
        status: 'pass',
        passed: true,
        details: 'No strict age bracket specified by organizer.'
      });
    }

    // -------------------------------------------------------------
    // 4. Skills Compatibility (Preparation, not automatic disqualifier)
    // -------------------------------------------------------------
    const oppSkills = (opportunity.requiredSkills || []).map(s => String(s).toLowerCase().trim()).filter(Boolean);
    const studentSkills = (profile.skills || []).map(s => String(s).toLowerCase().trim()).filter(Boolean);
    const missingSkills = oppSkills.filter(req => !studentSkills.some(s => s === req || s.includes(req) || req.includes(s)));

    if (oppSkills.length > 0 && oppSkills[0] !== 'general') {
      if (missingSkills.length > 0) {
        checks.push({
          criterion: 'Skill Preparation Runway',
          status: 'info',
          passed: true,
          details: `Skill gaps (${missingSkills.slice(0, 3).join(', ')}): Recommended for self-study and preparation before start, not an admission disqualifier.`
        });
      } else {
        checks.push({
          criterion: 'Skill Compatibility',
          status: 'pass',
          passed: true,
          details: 'All recommended prerequisite skills are represented in your profile.'
        });
      }
    }

    // -------------------------------------------------------------
    // Final Status Resolution
    // -------------------------------------------------------------
    let status = 'eligible';
    let summary = 'You satisfy all verified admission requirements for this opportunity.';
    let isEligible = true;

    if (hasFailure) {
      status = 'not_eligible';
      isEligible = false;
      summary = 'Your profile does not satisfy one or more explicit eligibility requirements.';
    } else if (hasNeedsReview) {
      status = 'needs_review';
      isEligible = null;
      summary = 'Manual review needed: Opportunity has explicit requirements that are unconfirmed in your profile.';
    } else if (hasExplicitRequirements) {
      status = 'eligible';
      isEligible = true;
      summary = 'All explicit eligibility criteria have been verified against your profile.';
    } else {
      status = 'likely_eligible';
      isEligible = true;
      summary = 'Likely eligible: No restrictive admission rules detected.';
    }

    return {
      status,
      isEligible,
      summary,
      checks
    };
  }
}

module.exports = EligibilityEngine;
