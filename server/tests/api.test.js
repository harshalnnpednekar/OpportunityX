const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Profile, Opportunity, SavedOpportunity } = require('../src/models');
const FeedImporter = require('../src/services/feedImporter');

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });

  // Create demo student
  const student = await User.create({
    email: 'alex.chen@university.edu',
    passwordHash: 'StudentPass123!',
    role: 'student'
  });

  await Profile.create({
    userId: student.id,
    fullName: 'Alex Chen',
    educationLevel: 'undergraduate',
    university: 'UC Berkeley',
    major: 'Computer Science',
    skills: ['Python', 'React', 'PyTorch'],
    interests: ['hackathon', 'AI/ML'],
    formatPreference: 'virtual'
  });

  // Import feeds into test database
  await FeedImporter.importAllDefaultFeeds();
});

afterAll(async () => {
  await sequelize.close();
});

describe('OpportunityX API Endpoints', () => {
  let authToken;
  let testOppId;

  test('GET /api/health returns 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('OpportunityX REST API');
  });

  test('POST /api/auth/login logs in seeded demo student', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.chen@university.edu',
        password: 'StudentPass123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alex.chen@university.edu');
    expect(res.body.user.profile.fullName).toBe('Alex Chen');
    authToken = res.body.token;
  });

  test('GET /api/opportunities returns paginated opportunities with scores', async () => {
    const res = await request(app)
      .get('/api/opportunities')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.opportunities).toBeDefined();
    expect(res.body.opportunities.length).toBeGreaterThan(0);
    expect(res.body.total).toBeGreaterThanOrEqual(10);

    const first = res.body.opportunities[0];
    expect(first.title).toBeDefined();
    expect(first.matchScore).toBeDefined();
    expect(first.eligibilityStatus).toBeDefined();
    expect(first.isDemo).toBe(true);
    testOppId = first.id;
  });

  test('GET /api/opportunities with format filter returns only matching format', async () => {
    const res = await request(app)
      .get('/api/opportunities?format=virtual')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    res.body.opportunities.forEach(opp => {
      expect(opp.format).toBe('virtual');
    });
  });

  test('GET /api/opportunities/:id returns detailed opportunity with diagnostics', async () => {
    const res = await request(app)
      .get(`/api/opportunities/${testOppId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.opportunity).toBeDefined();
    expect(res.body.opportunity.id).toBe(testOppId);
    expect(res.body.opportunity.matchReasons).toBeDefined();
    expect(res.body.opportunity.eligibilityChecks).toBeDefined();
  });

  test('POST /api/saved saves an opportunity for student', async () => {
    const res = await request(app)
      .post('/api/saved')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        opportunityId: testOppId,
        status: 'planning',
        notes: 'Targeting this for team entry.'
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.saved).toBeDefined();
    expect(res.body.saved.status).toBe('planning');
  });

  test('GET /api/saved returns saved opportunities for user', async () => {
    const res = await request(app)
      .get('/api/saved')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.saved).toBeDefined();
    expect(Array.isArray(res.body.saved)).toBe(true);
    expect(res.body.saved.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/saved/timeline returns categorized deadline timeline', async () => {
    const res = await request(app)
      .get('/api/saved/timeline')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.timeline).toBeDefined();
    expect(res.body.timeline.critical).toBeDefined();
    expect(res.body.timeline.approaching).toBeDefined();
  });

  test('POST /api/roadmaps/generate creates 4-phase preparation plan', async () => {
    const res = await request(app)
      .post('/api/roadmaps/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ opportunityId: testOppId });

    expect([200, 201]).toContain(res.status);
    expect(res.body.roadmap).toBeDefined();
    expect(res.body.roadmap.tasks.length).toBe(8);
  });

  test('GET /api/roadmaps returns user preparation roadmaps', async () => {
    const res = await request(app)
      .get('/api/roadmaps')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.roadmaps).toBeDefined();
    expect(res.body.roadmaps.length).toBeGreaterThanOrEqual(1);
  });
});
