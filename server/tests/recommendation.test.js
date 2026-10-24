const RecommendationEngine = require('../src/services/recommendationEngine');
const TrustSignalEngine = require('../src/services/trustSignalEngine');
const AIExplanationAdapter = require('../src/services/aiExplanationAdapter');

describe('RecommendationEngine & Trust Signal Verification', () => {
  const fullProfile = {
    skills: ['Python', 'PyTorch', 'React', 'Docker'],
    interests: ['hackathon', 'ai', 'climate'],
    preferredFormat: 'virtual',
    preferredLocation: 'Online',
    budgetMax: 50.00,
    experienceLevel: 'beginner',
    availability: 'flexible',
    sustainabilityPreference: true
  };

  const highMatchOpp = {
    id: 'opp-high-1',
    title: 'CalHacks AI & Climate Challenge',
    description: 'Build sustainable prototypes using PyTorch and React with climate data.',
    category: 'hackathon',
    eventType: 'hackathon',
    format: 'virtual',
    location: 'Online',
    costType: 'free',
    costAmount: 0.00,
    requiredSkills: ['Python', 'PyTorch', 'React'],
    beginnerFriendly: true,
    sustainabilityFocused: true,
    applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  };

  const lowMatchOpp = {
    id: 'opp-low-2',
    title: 'Classical Philology & Latin Inscription Seminar',
    description: 'Fieldwork in ancient Mediterranean Latin grammar and epigraphy.',
    category: 'workshop',
    eventType: 'workshop',
    format: 'in_person',
    location: 'Rome, Italy',
    costType: 'paid_entry',
    costAmount: 250.00,
    requiredSkills: ['Latin', 'Ancient Greek'],
    beginnerFriendly: false,
    sustainabilityFocused: false,
    applicationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  };

  // =================================================================
  // 1. SCORE CALCULATION & EXPLAINABLE BREAKDOWN
  // =================================================================
  describe('Deterministic Score Calculation', () => {
    test('computes high score for closely aligned skills, interests, and preferences', () => {
      const result = RecommendationEngine.calculateMatch(fullProfile, highMatchOpp);

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.matchLevel).toBe('Top Match');
      expect(result.matchedSkills).toContain('python');
      expect(result.matchedSkills).toContain('pytorch');
      expect(result.matchedInterests).toContain('hackathon');
      expect(result.formula).toBeDefined();
      expect(result.explanation).toContain('Matches 3 of 3 required skill(s)');
      expect(result.componentScores.skill).toBeGreaterThanOrEqual(85);
      expect(result.componentScores.budget).toBe(100);
      expect(result.componentScores.sustainability).toBe(100);
    });

    test('computes low score for completely mismatched opportunity with skill gap guidance', () => {
      const result = RecommendationEngine.calculateMatch(fullProfile, lowMatchOpp);

      expect(result.score).toBeLessThan(50);
      expect(result.matchedSkills.length).toBe(0);
      expect(result.skillGaps).toContain('latin');
      expect(result.preparationActions.length).toBeGreaterThan(0);
    });

    test('produces identical scores and explanations on repeated evaluation (deterministic)', () => {
      const run1 = RecommendationEngine.calculateMatch(fullProfile, highMatchOpp);
      const run2 = RecommendationEngine.calculateMatch(fullProfile, highMatchOpp);

      expect(run1.score).toBe(run2.score);
      expect(run1.formula).toBe(run2.formula);
      expect(run1.explanation).toBe(run2.explanation);
      expect(run1.weightsUsed).toEqual(run2.weightsUsed);
    });
  });

  // =================================================================
  // 2. MISSING PROFILE FIELDS & WEIGHT NORMALIZATION
  // =================================================================
  describe('Missing Profile Fields & Dynamic Weight Normalization', () => {
    test('re-normalizes active weights when student has not set a budget preference', () => {
      const partialProfileNoBudget = {
        skills: ['Python'],
        interests: ['hackathon'],
        preferredFormat: 'virtual',
        experienceLevel: 'beginner'
        // budgetMax is missing
      };

      const result = RecommendationEngine.calculateMatch(partialProfileNoBudget, highMatchOpp);

      expect(result.missingProfileInformation).toContain('budgetMax');
      expect(result.weightsUsed.budget).toBe(0);
      // Weights of active dimensions (skill, interest, format, experience) must sum to 1.0 (100%)
      const sumOfWeights = Object.values(result.weightsUsed).reduce((a, b) => a + b, 0);
      expect(sumOfWeights).toBeCloseTo(1.0, 2);
      expect(result.missingDataEffect).toMatch(/re-normalized/i);
    });

    test('returns baseline score and missing field warnings when profile is empty', () => {
      const result = RecommendationEngine.calculateMatch(null, highMatchOpp);

      expect(result.score).toBe(50);
      expect(result.matchLevel).toMatch(/baseline/i);
      expect(result.missingProfileInformation.length).toBeGreaterThan(0);
    });
  });

  // =================================================================
  // 3. DETERMINISTIC TIE CASES
  // =================================================================
  describe('Deterministic Tie Breaking', () => {
    test('breaks tie between identical scores using deadline proximity then title', () => {
      const oppA = {
        id: 'opp-a',
        title: 'Beta Hackathon',
        matchScore: 85,
        applicationDeadline: new Date('2026-11-20T00:00:00Z')
      };
      const oppB = {
        id: 'opp-b',
        title: 'Alpha Hackathon',
        matchScore: 85,
        applicationDeadline: new Date('2026-11-10T00:00:00Z') // sooner deadline
      };
      const oppC = {
        id: 'opp-c',
        title: 'Charlie Hackathon',
        matchScore: 85,
        applicationDeadline: new Date('2026-11-20T00:00:00Z') // same deadline as oppA, but title C > B
      };

      const sorted = RecommendationEngine.sortRecommendations(
        [oppA, oppB, oppC],
        new Date('2026-11-01T00:00:00Z')
      );

      // Opp B has the soonest upcoming deadline, so B is first
      expect(sorted[0].id).toBe('opp-b');
      // Between A and C (same deadline), alphabetical title breaks tie: 'Beta' < 'Charlie'
      expect(sorted[1].id).toBe('opp-a');
      expect(sorted[2].id).toBe('opp-c');
    });
  });

  // =================================================================
  // 4. TRUST / DATA QUALITY SIGNAL
  // =================================================================
  describe('Trust & Data Quality Signal Engine', () => {
    test('computes high quality score for complete, fresh, unexpired listing with verified source', () => {
      const freshListing = {
        title: 'Global AI Open Sprint 2026',
        description: 'Comprehensive collegiate hackathon testing generative machine learning and developer tooling.',
        applicationUrl: 'https://demo.example.edu/apply',
        sourceName: 'sample-hackathons-json',
        sourceUrl: 'https://demo.example.edu/feed.json',
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastVerifiedAt: new Date(),
        status: 'active',
        requiredSkills: ['Python', 'Docker']
      };

      const trust = TrustSignalEngine.evaluateTrustSignal(freshListing);
      expect(trust.trustScore).toBeGreaterThanOrEqual(80);
      expect(trust.tier).toBe('High Quality & Fresh');
      expect(trust.factors.length).toBeGreaterThan(0);
      expect(trust.disclaimer).toMatch(/INTERNAL DATA-QUALITY INDICATOR/i);
    });

    test('deducts score for expired deadlines and contradiction flags', () => {
      const expiredWithContradiction = {
        title: 'Past Expired Hackathon',
        description: 'Listing with passed deadline and contradictory dates.',
        applicationUrl: 'https://demo.example.edu/apply',
        sourceName: 'unknown-feed',
        applicationDeadline: new Date('2025-01-01T00:00:00Z'),
        status: 'expired',
        contradictionFlags: ['contradictory_dates_deadline_after_start'],
        requiredSkills: []
      };

      const trust = TrustSignalEngine.evaluateTrustSignal(expiredWithContradiction, new Date('2026-10-24T00:00:00Z'));
      expect(trust.trustScore).toBeLessThan(50);
      expect(trust.tier).toMatch(/Caution/i);
      expect(trust.factors.some(f => f.dimension === 'Lifecycle Status' && f.impact.includes('-'))).toBe(true);
      expect(trust.factors.some(f => f.dimension === 'Consistency Audits')).toBe(true);
    });
  });

  // =================================================================
  // 5. OPTIONAL AI ADAPTER FALLBACK BEHAVIOR
  // =================================================================
  describe('AIExplanationAdapter Fallback', () => {
    test('falls back safely to deterministic explanation when no AI API key is configured', async () => {
      const rec = RecommendationEngine.calculateMatch(fullProfile, highMatchOpp);
      const formatted = await AIExplanationAdapter.formatExplanation({ rec, elig: null, trust: null });

      expect(formatted).toBeDefined();
      expect(formatted.source).toBe('deterministic');
      expect(formatted.explanation).toBe(rec.explanation);
    });
  });
});
