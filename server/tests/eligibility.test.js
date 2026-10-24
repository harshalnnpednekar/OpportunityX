const EligibilityEngine = require('../src/services/eligibilityEngine');

describe('EligibilityEngine — Strict Independent Admission Evaluation', () => {
  const verifiedProfile = {
    educationLevel: 'undergraduate',
    country: 'USA',
    preferredLocation: 'USA',
    age: 21,
    skills: ['Python', 'Docker']
  };

  test('returns "eligible" when all explicit requirements are met and verified', () => {
    const opp = {
      eligibleEducationLevels: ['undergraduate', 'graduate'],
      eligibleCountries: ['USA', 'Canada'],
      minAge: 18,
      maxAge: 30,
      requiredSkills: ['Python']
    };

    const result = EligibilityEngine.evaluateEligibility(verifiedProfile, opp);
    expect(result.status).toBe('eligible');
    expect(result.isEligible).toBe(true);
    expect(result.checks.every(c => c.status === 'pass' || c.status === 'info')).toBe(true);
  });

  test('returns "likely_eligible" when opportunity has no restrictive admission criteria', () => {
    const broadOpp = {
      eligibleEducationLevels: ['all'],
      eligibleCountries: ['Global'],
      requiredSkills: ['general']
    };

    const result = EligibilityEngine.evaluateEligibility(verifiedProfile, broadOpp);
    expect(result.status).toBe('likely_eligible');
    expect(result.isEligible).toBe(true);
  });

  test('returns "not_eligible" when student explicitly fails education level constraint', () => {
    const gradOnlyOpp = {
      eligibleEducationLevels: ['graduate', 'postdoc'],
      eligibleCountries: ['USA']
    };

    const result = EligibilityEngine.evaluateEligibility(verifiedProfile, gradOnlyOpp);
    expect(result.status).toBe('not_eligible');
    expect(result.isEligible).toBe(false);
    const eduCheck = result.checks.find(c => c.criterion === 'Academic Standing');
    expect(eduCheck.passed).toBe(false);
  });

  test('returns "not_eligible" when student country violates geographic restrictions', () => {
    const europeOnlyOpp = {
      eligibleEducationLevels: ['undergraduate'],
      eligibleCountries: ['Germany', 'France', 'UK']
    };

    const result = EligibilityEngine.evaluateEligibility(verifiedProfile, europeOnlyOpp);
    expect(result.status).toBe('not_eligible');
    expect(result.isEligible).toBe(false);
    const geoCheck = result.checks.find(c => c.criterion === 'Geographic Eligibility');
    expect(geoCheck.passed).toBe(false);
  });

  test('returns "needs_review" when opportunity specifies explicit criteria but profile lacks the fact', () => {
    const profileMissingCountry = {
      educationLevel: 'undergraduate'
      // country / preferredLocation is missing
    };

    const geoRestrictedOpp = {
      eligibleEducationLevels: ['undergraduate'],
      eligibleCountries: ['Japan', 'South Korea']
    };

    const result = EligibilityEngine.evaluateEligibility(profileMissingCountry, geoRestrictedOpp);
    expect(result.status).toBe('needs_review');
    expect(result.isEligible).toBeNull();
    const geoCheck = result.checks.find(c => c.criterion === 'Geographic Eligibility');
    expect(geoCheck.status).toBe('needs_review');
    expect(geoCheck.details).toMatch(/country of residence is not specified/i);
  });

  test('returns "needs_review" for age restrictions without inferring age from graduation year', () => {
    const profileWithoutExplicitAge = {
      educationLevel: 'undergraduate',
      country: 'USA',
      graduationYear: 2027 // NO explicit age recorded
    };

    const ageRestrictedOpp = {
      minAge: 18,
      maxAge: 25
    };

    const result = EligibilityEngine.evaluateEligibility(profileWithoutExplicitAge, ageRestrictedOpp);
    expect(result.status).toBe('needs_review');
    const ageCheck = result.checks.find(c => c.criterion === 'Age Restriction');
    expect(ageCheck.status).toBe('needs_review');
    expect(ageCheck.details).toMatch(/exact age is not recorded/i);
  });

  test('returns "unknown" when profile is missing completely', () => {
    const result = EligibilityEngine.evaluateEligibility(null, { eligibleCountries: ['Global'] });
    expect(result.status).toBe('unknown');
    expect(result.isEligible).toBeNull();
  });

  test('treats skill gaps as preparation suggestions rather than automatic disqualifiers', () => {
    const profileLackingSkill = {
      educationLevel: 'undergraduate',
      country: 'USA',
      skills: ['HTML', 'CSS'] // lacks 'Rust'
    };

    const rustOpp = {
      eligibleEducationLevels: ['undergraduate'],
      eligibleCountries: ['USA'],
      requiredSkills: ['Rust']
    };

    const result = EligibilityEngine.evaluateEligibility(profileLackingSkill, rustOpp);
    // Student is not disqualified by skill gap alone!
    expect(result.status).toBe('eligible');
    expect(result.isEligible).toBe(true);
    const skillCheck = result.checks.find(c => c.criterion === 'Skill Preparation Runway');
    expect(skillCheck).toBeDefined();
    expect(skillCheck.details).toMatch(/Skill gaps \(rust\): Recommended for self-study/i);
  });
});
