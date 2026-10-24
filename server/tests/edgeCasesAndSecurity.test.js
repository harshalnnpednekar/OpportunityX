const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const {
  sequelize,
  User,
  StudentProfile,
  Opportunity,
  SavedOpportunity,
  Roadmap,
  RoadmapTask,
  Notification,
  MatchRequest,
  FeedImport
} = require('../src/models');
const FeedNormalizer = require('../src/services/feedNormalizer');
const FeedImporter = require('../src/services/feedImporter');
const EligibilityEngine = require('../src/services/eligibilityEngine');
const RecommendationEngine = require('../src/services/recommendationEngine');
const TrustSignalEngine = require('../src/services/trustSignalEngine');

const JWT_SECRET = process.env.JWT_SECRET || 'opportunityx_super_secret_jwt_key_2026_production_grade';

describe('Edge Cases, Authorization & Security Hardening Suite', () => {
  let userA, userAToken;
  let userB, userBToken;
  let userPrivate, userPrivateToken;
  let adminUser, adminToken;
  let testOpp;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // Seed test opportunity
    testOpp = await Opportunity.create({
      title: 'Security Edge Testing Hackathon 2026',
      organizer: 'SecOps Lab',
      description: 'Penetration testing and secure software development competition.',
      category: 'hackathon',
      eventType: 'hackathon',
      applicationUrl: 'https://secops.edu/apply',
      normalizedFingerprint: 'security-edge-testing-hackathon-2026',
      format: 'virtual',
      location: 'Online',
      costAmount: 0,
      currency: 'USD',
      status: 'active',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
    });

    // Create User A
    userA = await User.create({
      name: 'Alice Security',
      email: 'alice.sec@university.edu',
      passwordHash: 'SecPass123!',
      role: 'student'
    });
    await StudentProfile.create({
      userId: userA.id,
      fullName: 'Alice Security',
      skills: ['Python', 'Linux'],
      interests: ['hackathon'],
      peerMatchingConsent: true,
      isPublicForMatching: true
    });
    userAToken = jwt.sign({ userId: userA.id, email: userA.email, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });

    // Create User B
    userB = await User.create({
      name: 'Bob Malicious',
      email: 'bob.mal@university.edu',
      passwordHash: 'SecPass123!',
      role: 'student'
    });
    await StudentProfile.create({
      userId: userB.id,
      fullName: 'Bob Malicious',
      skills: ['React'],
      interests: ['hackathon'],
      peerMatchingConsent: true,
      isPublicForMatching: true
    });
    userBToken = jwt.sign({ userId: userB.id, email: userB.email, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });

    // Create Non-Consenting User (Private)
    userPrivate = await User.create({
      name: 'Private Student',
      email: 'private.user@university.edu',
      passwordHash: 'SecPass123!',
      role: 'student'
    });
    await StudentProfile.create({
      userId: userPrivate.id,
      fullName: 'Private Student',
      skills: ['Java'],
      peerMatchingConsent: false,
      isPublicForMatching: false
    });
    userPrivateToken = jwt.sign({ userId: userPrivate.id, email: userPrivate.email, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });

    // Create Admin
    adminUser = await User.create({
      name: 'Sec Admin',
      email: 'admin.sec@opportunityx.edu',
      passwordHash: 'AdminPass123!',
      role: 'admin'
    });
    adminToken = jwt.sign({ userId: adminUser.id, email: adminUser.email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // =================================================================
  // 1. INPUT VALIDATION & MALFORMED REQUEST BODIES
  // =================================================================
  describe('Input Validation & Malformed Payloads', () => {
    test('Registration fails on missing required email and password fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Incomplete User' });

      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });

    test('Registration fails on invalid password complexity (too short or missing digit)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Pass',
          email: 'weak.pass@university.edu',
          password: 'short'
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some(d => d.message.includes('at least 8 characters'))).toBe(true);
    });

    test('Registration rejects duplicate email with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Twin',
          email: 'alice.sec@university.edu',
          password: 'SecPass123!'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    test('Login fails with generic 401 on incorrect password without exposing hash', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice.sec@university.edu',
          password: 'WrongPassword999!'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid email or password');
      expect(res.body.passwordHash).toBeUndefined();
    });

    test('Login fails with generic 401 on non-existent email preventing user enumeration', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost.user.does.not.exist@university.edu',
          password: 'Password123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid email or password');
    });
  });

  // =================================================================
  // 2. INVALID IDENTIFIERS & UUID VALIDATION
  // =================================================================
  describe('Invalid Identifiers & Parameter Boundary Testing', () => {
    test('Rejects malformed non-UUID id on /api/opportunities/:id/save', async () => {
      const res = await request(app)
        .post('/api/opportunities/not-a-valid-uuid/save')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.details.some(d => d.message.includes('valid UUID'))).toBe(true);
    });

    test('Rejects malformed non-UUID on /api/roadmaps/:id/tasks/:taskId', async () => {
      const res = await request(app)
        .patch('/api/roadmaps/bad-uuid/tasks/bad-task-id')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ isCompleted: true });

      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });

    test('Rejects malformed notification id on /api/notifications/:id/read', async () => {
      const res = await request(app)
        .patch('/api/notifications/invalid-id/read')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(400);
    });
  });

  // =================================================================
  // 3. AUTHENTICATION TOKEN EDGE CASES
  // =================================================================
  describe('Authentication Token Security', () => {
    test('Rejects requests with missing authorization token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication required');
    });

    test('Rejects requests with malformed Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer gibberish_invalid_token_xyz');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid or expired');
    });

    test('Rejects expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { userId: userA.id, email: userA.email, role: 'student' },
        JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });

  // =================================================================
  // 4. CROSS-USER AUTHORIZATION & OWNERSHIP ENFORCEMENT
  // =================================================================
  describe('Cross-User Authorization & Data Isolation', () => {
    let userARoadmap, userATask;
    let userASaved;
    let userANotif;

    beforeAll(async () => {
      // User A creates a roadmap
      const rmRes = await request(app)
        .post('/api/roadmaps/generate')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ opportunityId: testOpp.id });
      userARoadmap = rmRes.body.roadmap;
      userATask = userARoadmap.tasks[0];

      // User A saves the opportunity
      const saveRes = await request(app)
        .post(`/api/opportunities/${testOpp.id}/save`)
        .set('Authorization', `Bearer ${userAToken}`);
      userASaved = saveRes.body.saved;

      // User A has a notification
      userANotif = await Notification.create({
        userId: userA.id,
        opportunityId: testOpp.id,
        type: 'deadline_reminder',
        message: 'Reminder for Alice only'
      });
    });

    test('User B cannot view or modify User A roadmap task', async () => {
      const res = await request(app)
        .patch(`/api/roadmaps/${userARoadmap.id}/tasks/${userATask.id}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ isCompleted: true });

      // Should return 404 Not Found due to scoped query where: { id: roadmapId, userId: req.user.id }
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Roadmap not found');
    });

    test('User B cannot delete User A roadmap', async () => {
      const res = await request(app)
        .delete(`/api/roadmaps/${userARoadmap.id}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
    });

    test('User B cannot mark User A notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${userANotif.id}/read`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Notification not found');
    });

    test('User B cannot unsave User A saved opportunity', async () => {
      const res = await request(app)
        .delete(`/api/saved/${userASaved.id}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
    });
  });

  // =================================================================
  // 5. PAGINATION SANITIZATION & BOUNDARY LIMITS
  // =================================================================
  describe('Pagination Parameter Sanitization & Strict Validation', () => {
    test('Rejects negative page parameter with 400 Bad Request', async () => {
      const res = await request(app).get('/api/opportunities?page=-5&limit=5');
      expect(res.status).toBe(400);
      expect(res.body.details.some(d => d.field === 'page')).toBe(true);
    });

    test('Rejects excessive limit parameter exceeding 100 with 400 Bad Request', async () => {
      const res = await request(app).get('/api/opportunities?page=1&limit=5000');
      expect(res.status).toBe(400);
      expect(res.body.details.some(d => d.field === 'limit')).toBe(true);
    });

    test('Rejects non-numeric page parameter with 400 Bad Request', async () => {
      const res = await request(app).get('/api/opportunities?page=invalid&limit=invalid');
      expect(res.status).toBe(400);
    });
  });

  // =================================================================
  // 6. EMPTY SEARCH RESULTS & ZERO RESULTS INTEGRITY
  // =================================================================
  describe('Search Integrity on Non-Existent Queries', () => {
    test('Returns 200 with empty array when search query matches zero records', async () => {
      const res = await request(app).get('/api/opportunities?q=xyznonexistentterm998877');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.opportunities).toEqual([]);
    });
  });

  // =================================================================
  // 7. FEED INGESTION IDEMPOTENCY & DUPLICATE PROTECTION
  // =================================================================
  describe('Feed Ingestion Idempotency', () => {
    test('Repeated import of sample feed does not duplicate records in database', async () => {
      // First import
      await FeedImporter.importFeed({
        feedName: 'idempotency-test',
        feedType: 'json',
        filePath: require('path').resolve(__dirname, '../src/feeds/sample-hackathons.json')
      });
      const initialCount = await Opportunity.count();

      // Second import of same feed
      const secondRun = await FeedImporter.importFeed({
        feedName: 'idempotency-test',
        feedType: 'json',
        filePath: require('path').resolve(__dirname, '../src/feeds/sample-hackathons.json')
      });
      const finalCount = await Opportunity.count();

      expect(secondRun.recordsCreated).toBe(0); // Zero duplicates created!
      expect(finalCount).toBe(initialCount);
    });
  });

  // =================================================================
  // 8. MALFORMED XML & INVALID JSON INGESTION RESILIENCE
  // =================================================================
  describe('Feed Normalizer Resiliency to Corrupted Data', () => {
    test('Rejects malformed XML safely with descriptive error without process crash or entity expansion', () => {
      const corruptedXml = '<?xml version="1.0"?><competitions><item><title>Unclosed Tag';
      expect(() => {
        FeedNormalizer.parseXmlFeed(corruptedXml, 'bad-xml');
      }).toThrow(/Invalid XML/i);
    });

    test('Rejects invalid JSON syntax safely with descriptive error', () => {
      const corruptedJson = '{ items: [ { "title": "bad json without quotes" } ';
      expect(() => {
        FeedNormalizer.parseJsonFeed(corruptedJson, 'bad-json');
      }).toThrow(/Invalid JSON syntax/i);
    });
  });

  // =================================================================
  // 9. EXPIRED OPPORTUNITIES & MISSING ELIGIBILITY SPECS
  // =================================================================
  describe('Expired Opportunities & Missing Eligibility Engine Resilience', () => {
    test('EligibilityEngine does not crash when opportunity has empty eligibility criteria', () => {
      const emptyOpp = { id: 'empty-1', title: 'Opportunity Without Criteria' };
      const studentProfile = { skills: ['Python'], educationLevel: 'undergraduate' };

      const result = EligibilityEngine.evaluateEligibility(studentProfile, emptyOpp);
      expect(result).toBeDefined();
      expect(['likely_eligible', 'eligible', 'unknown']).toContain(result.status);
    });

    test('TrustSignalEngine correctly flags expired opportunity and applies penalty', () => {
      const pastDeadlineOpp = {
        title: 'Past Hackathon 2024',
        organizer: 'Past Org',
        status: 'expired',
        applicationDeadline: '2024-01-01'
      };

      const trust = TrustSignalEngine.evaluateTrustSignal(pastDeadlineOpp);
      expect(trust.factors.some(f => f.dimension === 'Lifecycle Status' && f.impact === '-30')).toBe(true);
      expect(trust.trustScore).toBeLessThan(100);
      expect(trust.disclaimer).toContain('INTERNAL DATA-QUALITY INDICATOR');
    });

    test('RecommendationEngine normalizes missing weights without penalizing student', () => {
      // Profile with only skills provided (missing budget, location, format preferences)
      const sparseProfile = { skills: ['Python'] };
      const opp = {
        title: 'Python Sprint',
        requiredSkills: ['Python'],
        costAmount: 10,
        format: 'virtual'
      };

      const result = RecommendationEngine.calculateMatch(sparseProfile, opp);
      expect(result.score).toBeGreaterThan(0);
      expect(result.missingProfileInformation.length).toBeGreaterThan(0);
      expect(result.missingDataEffect).toBeDefined();
    });
  });

  // =================================================================
  // 10. PEER COLLABORATION CONSENT ENFORCEMENT
  // =================================================================
  describe('Peer Matching Consent Enforcement', () => {
    test('User without consent receives 403 when attempting to browse peer candidates', async () => {
      const res = await request(app)
        .get(`/api/peers/matches?opportunityId=${testOpp.id}`)
        .set('Authorization', `Bearer ${userPrivateToken}`);

      expect(res.status).toBe(403);
      expect(res.body.consentRequired).toBe(true);
    });
  });

  // =================================================================
  // 11. RATE LIMITING & SENSITIVE LOG SANITIZATION
  // =================================================================
  describe('Rate Limiter & Audit Log Sanitization', () => {
    test('Rate limiter blocks requests exceeding configured threshold with 429 Too Many Requests', async () => {
      const express = require('express');
      const testLimiterApp = express();
      testLimiterApp.use(express.json());

      const { createRateLimiter } = require('../src/middleware/rateLimiter');
      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        message: 'Too many attempts, please slow down.'
      });

      testLimiterApp.post('/api/test-limit', limiter, (req, res) => res.json({ ok: true }));

      for (let i = 1; i <= 3; i++) {
        const res = await request(testLimiterApp)
          .post('/api/test-limit')
          .set('x-test-rate-limit', 'true')
          .send({});
        expect(res.status).toBe(200);
      }

      const blockedRes = await request(testLimiterApp)
        .post('/api/test-limit')
        .set('x-test-rate-limit', 'true')
        .send({});

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.error).toMatch(/too many attempts/i);
    });

    test('Request logger sanitizer redacts passwords, tokens, and API secrets from output', () => {
      const { sanitize } = require('../src/middleware/requestLogger');
      const sensitivePayload = {
        email: 'user@example.com',
        password: 'supersecretpassword',
        token: 'jwt.token.string',
        nested: {
          currentPassword: 'oldpassword123',
          secret: 'shhh'
        }
      };

      const sanitized = sanitize(sensitivePayload);
      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.nested.currentPassword).toBe('[REDACTED]');
      expect(sanitized.nested.secret).toBe('[REDACTED]');
    });
  });
});
