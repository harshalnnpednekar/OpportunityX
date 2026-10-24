const EligibilityEngine = require('../src/services/eligibilityEngine');

describe('EligibilityEngine', () => {
  const profile = {
    educationLevel: 'undergraduate',
    country: 'USA',
    graduationYear: 2027
  };

  test('should pass eligibility when all requirements are met', () => {
    const opp = {
      eligibleEducationLevels: ['undergraduate', 'graduate'],
      eligibleCountries: ['USA', 'Canada'],
      minAge: 18,
      maxAge: 30
    };

    const result = EligibilityEngine.evaluateEligibility(profile, opp);
    expect(result.status).toBe('ELIGIBLE');
    expect(result.isEligible).toBe(true);
    expect(result.checks.every(c => c.passed)).toBe(true);
  });

  test('should return INELIGIBLE if education level does not match', () => {
    const opp = {
      eligibleEducationLevels: ['graduate'],
      eligibleCountries: ['USA']
    };

    const result = EligibilityEngine.evaluateEligibility(profile, opp);
    expect(result.status).toBe('INELIGIBLE');
    expect(result.isEligible).toBe(false);
    const eduCheck = result.checks.find(c => c.criterion === 'Academic Standing');
    expect(eduCheck.passed).toBe(false);
  });

  test('should return INELIGIBLE if country restriction is violated', () => {
    const opp = {
      eligibleEducationLevels: ['undergraduate'],
      eligibleCountries: ['United Kingdom', 'Germany']
    };

    const result = EligibilityEngine.evaluateEligibility(profile, opp);
    expect(result.status).toBe('INELIGIBLE');
    expect(result.isEligible).toBe(false);
    const geoCheck = result.checks.find(c => c.criterion === 'Geographic Eligibility');
    expect(geoCheck.passed).toBe(false);
  });

  test('should return CONDITIONAL if profile is missing', () => {
    const opp = {
      eligibleEducationLevels: ['undergraduate'],
      eligibleCountries: ['Global']
    };

    const result = EligibilityEngine.evaluateEligibility(null, opp);
    expect(result.status).toBe('CONDITIONAL');
  });
});
