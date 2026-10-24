const RecommendationEngine = require('../src/services/recommendationEngine');

describe('RecommendationEngine', () => {
  const sampleProfile = {
    educationLevel: 'undergraduate',
    skills: ['Python', 'PyTorch', 'React'],
    interests: ['hackathon', 'AI/ML'],
    formatPreference: 'virtual'
  };

  const matchingOpportunity = {
    title: 'Autonomous AI Challenge',
    description: 'Build machine learning prototypes with PyTorch and React for smart devices.',
    opportunityType: 'hackathon',
    format: 'virtual',
    requiredSkills: ['Python', 'PyTorch', 'React', 'FastAPI'],
    eligibleEducationLevels: ['undergraduate', 'graduate'],
    applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) // 20 days away
  };

  const mismatchedOpportunity = {
    title: 'Advanced Classical Archaeology Workshop',
    description: 'Fieldwork in ancient Mediterranean history and epigraphy.',
    opportunityType: 'workshop',
    format: 'in_person',
    requiredSkills: ['Latin', 'Ancient Greek', 'Epigraphy'],
    eligibleEducationLevels: ['graduate'],
    applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
  };

  test('should compute a high match score for aligned skills and preferences', () => {
    const result = RecommendationEngine.calculateMatch(sampleProfile, matchingOpportunity);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(['Strong Match', 'Excellent Match']).toContain(result.matchLevel);
    expect(result.matchedSkills).toContain('python');
    expect(result.matchedSkills).toContain('pytorch');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  test('should compute lower match score for completely unrelated opportunity', () => {
    const result = RecommendationEngine.calculateMatch(sampleProfile, mismatchedOpportunity);
    expect(result.score).toBeLessThan(50);
    expect(result.matchedSkills.length).toBe(0);
  });

  test('should produce deterministic output for identical inputs', () => {
    const run1 = RecommendationEngine.calculateMatch(sampleProfile, matchingOpportunity);
    const run2 = RecommendationEngine.calculateMatch(sampleProfile, matchingOpportunity);
    expect(run1.score).toBe(run2.score);
    expect(run1.reasons).toEqual(run2.reasons);
  });
});
