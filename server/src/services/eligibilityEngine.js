class EligibilityEngine {
  /**
   * Strictly evaluates whether a student meets the non-negotiable eligibility criteria
   * @param {Object} profile - Student profile
   * @param {Object} opportunity - Opportunity record
   */
  static evaluateEligibility(profile, opportunity) {
    if (!profile) {
      return {
        status: 'CONDITIONAL',
        isEligible: true,
        summary: 'Log in and complete your student profile to run automated eligibility verification.',
        checks: [
          {
            criterion: 'Profile Completion',
            status: 'warning',
            passed: false,
            details: 'No student profile detected. Sign in to verify academic standing and geographic qualification.'
          }
        ]
      };
    }

    const checks = [];
    let hasFailure = false;
    let hasWarning = false;

    // 1. Academic / Education Level Check
    const allowedEdu = (opportunity.eligibleEducationLevels || []).map(e => String(e).toLowerCase());
    const studentEdu = (profile.educationLevel || '').toLowerCase();

    if (allowedEdu.includes('all')) {
      checks.push({
        criterion: 'Academic Standing',
        status: 'pass',
        passed: true,
        details: 'Open to all academic levels (high school, undergraduate, graduate, bootcamp).'
      });
    } else if (allowedEdu.length === 0) {
      checks.push({
        criterion: 'Academic Standing',
        status: 'pass',
        passed: true,
        details: 'No restrictive academic requirements specified by organizer.'
      });
    } else if (studentEdu && allowedEdu.includes(studentEdu)) {
      checks.push({
        criterion: 'Academic Standing',
        status: 'pass',
        passed: true,
        details: `Verified: Your academic level (${profile.educationLevel}) satisfies the requirement (${allowedEdu.join(', ')}).`
      });
    } else if (!studentEdu) {
      hasWarning = true;
      checks.push({
        criterion: 'Academic Standing',
        status: 'warning',
        passed: false,
        details: `Your profile lacks an education level. This opportunity requires: ${allowedEdu.join(', ')}.`
      });
    } else {
      hasFailure = true;
      checks.push({
        criterion: 'Academic Standing',
        status: 'fail',
        passed: false,
        details: `Academic requirement not met: Opportunity requires [${allowedEdu.join(', ')}], but your profile is [${profile.educationLevel}].`
      });
    }

    // 2. Geographic / Regional Eligibility Check
    const allowedRegions = (opportunity.eligibleCountries || []).map(c => String(c).toLowerCase());
    const studentCountry = (profile.country || 'Global').toLowerCase();

    if (allowedRegions.includes('global') || allowedRegions.length === 0) {
      checks.push({
        criterion: 'Geographic Eligibility',
        status: 'pass',
        passed: true,
        details: 'Open globally to participants worldwide.'
      });
    } else if (allowedRegions.some(r => studentCountry.includes(r) || r.includes(studentCountry))) {
      checks.push({
        criterion: 'Geographic Eligibility',
        status: 'pass',
        passed: true,
        details: `Verified: Your location (${profile.country}) is within the permitted regions (${allowedRegions.join(', ')}).`
      });
    } else if (studentCountry === 'global' || !studentCountry) {
      hasWarning = true;
      checks.push({
        criterion: 'Geographic Eligibility',
        status: 'warning',
        passed: false,
        details: `Specify your exact country in your profile. Opportunity restricted to: ${allowedRegions.join(', ')}.`
      });
    } else {
      hasFailure = true;
      checks.push({
        criterion: 'Geographic Eligibility',
        status: 'fail',
        passed: false,
        details: `Geographic restriction: Restricted to [${allowedRegions.join(', ')}], but your profile specifies [${profile.country}].`
      });
    }

    // 3. Age Constraints Check
    const minAge = opportunity.minAge;
    const maxAge = opportunity.maxAge;

    if (minAge || maxAge) {
      // Estimate approximate age from graduation year assuming typical college grad age ~22
      // e.g. graduation 2027 in 2026 implies ~21
      let approxAge = null;
      if (profile.graduationYear) {
        const currentYear = 2026;
        approxAge = 22 - (profile.graduationYear - currentYear);
      }

      if (approxAge !== null) {
        let agePassed = true;
        let reason = `Estimated age (${approxAge} yrs based on grad class ${profile.graduationYear}) is within bounds`;

        if (minAge && approxAge < minAge) {
          agePassed = false;
          hasFailure = true;
          reason = `Minimum age requirement is ${minAge} years old (estimated profile age is ${approxAge}).`;
        }
        if (maxAge && approxAge > maxAge) {
          agePassed = false;
          hasFailure = true;
          reason = `Maximum age limit is ${maxAge} years old (estimated profile age is ${approxAge}).`;
        }

        checks.push({
          criterion: 'Age Restriction',
          status: agePassed ? 'pass' : 'fail',
          passed: agePassed,
          details: reason
        });
      } else {
        checks.push({
          criterion: 'Age Restriction',
          status: 'warning',
          passed: true,
          details: `Organizer notes age range: ${minAge || 'Any'} - ${maxAge || 'Any'}. Verify birthdate manually.`
        });
      }
    } else {
      checks.push({
        criterion: 'Age Restriction',
        status: 'pass',
        passed: true,
        details: 'No strict age bracket specified.'
      });
    }

    // Overall Status Computation
    let status = 'ELIGIBLE';
    let summary = 'You satisfy all verified eligibility requirements for this opportunity.';

    if (hasFailure) {
      status = 'INELIGIBLE';
      summary = 'Your profile does not satisfy one or more non-negotiable admission criteria.';
    } else if (hasWarning) {
      status = 'CONDITIONAL';
      summary = 'Conditional: Please review prerequisites or complete missing fields in your profile.';
    }

    return {
      status,
      isEligible: status === 'ELIGIBLE',
      summary,
      checks
    };
  }
}

module.exports = EligibilityEngine;
