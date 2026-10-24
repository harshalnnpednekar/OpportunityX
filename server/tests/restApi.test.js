const request = require('supertest');
const app = require('../src/app');
const {
  sequelize,
  User,
  StudentProfile,
  Opportunity,
  SavedOpportunity,
  Notification,
  Roadmap,
  RoadmapTask,
  MatchRequest,
  FeedImport
} = require('../src/models');
const FeedImporter = require('../src/services/feedImporter');

describe('OpportunityX Comprehensive REST API Tests', () => {
  let student1Token;
  let student1User;
  let student2Token;
  let student2User;
  let adminToken;
  let adminUser;
  let testOpp1;
  let testOpp2;
  let testRoadmap;
  let testTask;
  let testNotification;
  let testMatchRequest;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // 1. Seed Feeds
    await FeedImporter.importAllDefaultFeeds();

    // 2. Create Admin
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin.lead@opportunityx.edu',
      passwordHash: 'AdminLead2026!',
      role: 'admin'
    });

    // 3. Create Student 1 (Alex)
    student1User = await User.create({
      name: 'Alex Rivera',
      email: 'alex.rivera@university.edu',
      passwordHash: 'AlexPass123!',
      role: 'student'
    });

    await StudentProfile.create({
      userId: student1User.id,
      fullName: 'Alex Rivera',
      educationLevel: 'undergraduate',
      university: 'MIT',
      major: 'Computer Science',
      skills: ['Python', 'React', 'PyTorch'],
      interests: ['AI/ML', 'hackathon'],
      preferredFormat: 'virtual',
      experienceLevel: 'beginner',
      budgetMax: 50.00,
      peerMatchingConsent: true
    });

    // 4. Create Student 2 (Taylor)
    student2User = await User.create({
      name: 'Taylor Swift',
      email: 'taylor.coder@university.edu',
      passwordHash: 'TaylorPass123!',
      role: 'student'
    });

    await StudentProfile.create({
      userId: student2User.id,
      fullName: 'Taylor Swift',
      educationLevel: 'undergraduate',
      university: 'Stanford',
      major: 'Design & CS',
      skills: ['Figma', 'UI/UX', 'Python'],
      interests: ['hackathon', 'design'],
      preferredFormat: 'virtual',
      experienceLevel: 'intermediate',
      budgetMax: 100.00,
      peerMatchingConsent: true
    });

    // Pick 2 real opportunities from seeded database
    const opps = await Opportunity.findAll({ where: { status: 'active' }, limit: 2 });
    testOpp1 = opps[0];
    testOpp2 = opps[1];

    // Seed a notification for student1
    testNotification = await Notification.create({
      userId: student1User.id,
      opportunityId: testOpp1.id,
      type: 'deadline_reminder',
      message: `Approaching deadline for ${testOpp1.title}`,
      readAt: null
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // SYSTEM ENDPOINTS
  // ==========================================
  describe('System Endpoints', () => {
    test('GET /api/health returns 200 and valid health payload', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('OpportunityX REST API');
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });

  // ==========================================
  // AUTHENTICATION AND PROFILE ENDPOINTS
  // ==========================================
  describe('Authentication & Profile Endpoints', () => {
    test('POST /api/auth/register creates a new user and profile', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'jordan.lee@university.edu',
          password: 'Password123!',
          name: 'Jordan Lee',
          skills: ['Node.js', 'PostgreSQL'],
          interests: ['web-dev', 'hackathon'],
          preferredFormat: 'virtual',
          experienceLevel: 'beginner',
          peerMatchingConsent: true
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('jordan.lee@university.edu');
      expect(res.body.user.name).toBe('Jordan Lee');
      expect(res.body.user.profile.skills).toContain('Node.js');
    });

    test('POST /api/auth/register rejects duplicate email with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'alex.rivera@university.edu',
          password: 'AnotherPassword123!',
          name: 'Alex Duplicate'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });

    test('POST /api/auth/register validates invalid input with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: '123' // too short
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    test('POST /api/auth/login logs in student1 and admin successfully', async () => {
      // Student 1
      const res1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.rivera@university.edu',
          password: 'AlexPass123!'
        });
      expect(res1.status).toBe(200);
      expect(res1.body.token).toBeDefined();
      student1Token = res1.body.token;

      // Student 2
      const res2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'taylor.coder@university.edu',
          password: 'TaylorPass123!'
        });
      expect(res2.status).toBe(200);
      student2Token = res2.body.token;

      // Admin
      const resAdmin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin.lead@opportunityx.edu',
          password: 'AdminLead2026!'
        });
      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.user.role).toBe('admin');
      adminToken = resAdmin.body.token;
    });

    test('POST /api/auth/login rejects incorrect password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.rivera@university.edu',
          password: 'WrongPassword!'
        });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });

    test('POST /api/auth/logout succeeds', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/logged out/i);
    });

    test('GET /api/auth/me returns current user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('alex.rivera@university.edu');
      expect(res.body.user.profile.university).toBe('MIT');
    });

    test('GET /api/auth/me returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('PATCH /api/profile updates user profile fields securely', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          skills: ['Python', 'React', 'PyTorch', 'TensorFlow', 'FastAPI'],
          budgetMax: 75.00,
          preferredLocation: 'North America',
          experienceLevel: 'intermediate',
          peerMatchingConsent: true
        });

      expect(res.status).toBe(200);
      expect(res.body.profile.skills).toContain('FastAPI');
      expect(Number(res.body.profile.budgetMax)).toBe(75.00);
      expect(res.body.profile.experienceLevel).toBe('intermediate');
    });
  });

  // ==========================================
  // OPPORTUNITIES ENDPOINTS & FILTERS
  // ==========================================
  describe('Opportunities Endpoints', () => {
    test('GET /api/opportunities returns paginated list with pagination metadata', async () => {
      const res = await request(app)
        .get('/api/opportunities?page=1&limit=5')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(10);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
      expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
      expect(res.body.opportunities.length).toBeLessThanOrEqual(5);
      expect(res.body.opportunities[0].matchScore).toBeDefined();
      expect(res.body.opportunities[0].eligibilityStatus).toBeDefined();
    });

    test('GET /api/opportunities filters by keyword `q`', async () => {
      const res = await request(app)
        .get('/api/opportunities?q=hackathon')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunities.length).toBeGreaterThan(0);
      res.body.opportunities.forEach(opp => {
        const text = `${opp.title} ${opp.description} ${opp.organizer} ${opp.category}`.toLowerCase();
        expect(text).toMatch(/hackathon/i);
      });
    });

    test('GET /api/opportunities filters by format, remote, beginnerFriendly, lowCost, sustainabilityFocused', async () => {
      // Test format
      const resFormat = await request(app)
        .get('/api/opportunities?format=virtual')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(resFormat.status).toBe(200);
      resFormat.body.opportunities.forEach(o => expect(o.format).toBe('virtual'));

      // Test remote
      const resRemote = await request(app)
        .get('/api/opportunities?remote=true')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(resRemote.status).toBe(200);

      // Test beginnerFriendly
      const resBeginner = await request(app)
        .get('/api/opportunities?beginnerFriendly=true')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(resBeginner.status).toBe(200);

      // Test lowCost
      const resCost = await request(app)
        .get('/api/opportunities?lowCost=true')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(resCost.status).toBe(200);

      // Test sustainabilityFocused
      const resSustain = await request(app)
        .get('/api/opportunities?sustainabilityFocused=true')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(resSustain.status).toBe(200);
    });

    test('GET /api/opportunities supports sorting by deadline, newest, title, and match', async () => {
      // Sort by newest
      const resNewest = await request(app)
        .get('/api/opportunities?sort=newest&limit=5')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(resNewest.status).toBe(200);

      // Sort by match
      const resMatch = await request(app)
        .get('/api/opportunities?sort=match&limit=5')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(resMatch.status).toBe(200);
      const scores = resMatch.body.opportunities.map(o => o.matchScore);
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });

    test('GET /api/opportunities/:id returns opportunity detail and diagnostics', async () => {
      const res = await request(app)
        .get(`/api/opportunities/${testOpp1.id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunity.id).toBe(testOpp1.id);
      expect(res.body.opportunity.matchScore).toBeDefined();
      expect(res.body.opportunity.eligibilityChecks).toBeDefined();
    });

    test('GET /api/opportunities/:id returns 404 for unknown opportunity', async () => {
      const res = await request(app)
        .get('/api/opportunities/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    test('GET /api/opportunities/:id/eligibility evaluates student profile', async () => {
      const res = await request(app)
        .get(`/api/opportunities/${testOpp1.id}/eligibility`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunityId).toBe(testOpp1.id);
      expect(res.body.eligibility).toBeDefined();
      expect(res.body.eligibility.checks).toBeDefined();
    });

    test('POST /api/opportunities/:id/save saves opportunity and DELETE removes it', async () => {
      // Save
      const saveRes = await request(app)
        .post(`/api/opportunities/${testOpp2.id}/save`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          status: 'planning',
          notes: 'Preparing submission'
        });

      expect([200, 201]).toContain(saveRes.status);
      expect(saveRes.body.saved.opportunityId).toBe(testOpp2.id);

      // Verify in GET /api/saved
      const listRes = await request(app)
        .get('/api/saved')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.saved.some(s => s.opportunityId === testOpp2.id)).toBe(true);

      // Unsave
      const deleteRes = await request(app)
        .delete(`/api/opportunities/${testOpp2.id}/save`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toMatch(/removed/i);

      // Second unsave returns 404
      const deleteAgainRes = await request(app)
        .delete(`/api/opportunities/${testOpp2.id}/save`)
        .set('Authorization', `Bearer ${student1Token}`);
      expect(deleteAgainRes.status).toBe(404);
    });
  });

  // ==========================================
  // RECOMMENDATIONS AND ROADMAPS
  // ==========================================
  describe('Recommendations and Roadmaps', () => {
    test('GET /api/recommendations returns top matched opportunities', async () => {
      const res = await request(app)
        .get('/api/recommendations?limit=6')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.recommendations).toBeDefined();
      expect(res.body.recommendations.length).toBeLessThanOrEqual(6);
      expect(res.body.recommendations[0].matchScore).toBeDefined();
    });

    test('POST /api/opportunities/:id/roadmap generates structured preparation roadmap', async () => {
      const res = await request(app)
        .post(`/api/opportunities/${testOpp1.id}/roadmap`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect([200, 201]).toContain(res.status);
      expect(res.body.roadmap).toBeDefined();
      expect(res.body.roadmap.tasks.length).toBe(8);

      testRoadmap = res.body.roadmap;
      testTask = res.body.roadmap.tasks[0];
    });

    test('GET /api/roadmaps returns user roadmaps', async () => {
      const res = await request(app)
        .get('/api/roadmaps')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.roadmaps.length).toBeGreaterThanOrEqual(1);
      expect(res.body.roadmaps[0].id).toBe(testRoadmap.id);
    });

    test('PATCH /api/roadmaps/:id/tasks/:taskId toggles task and recomputes progress %', async () => {
      const res = await request(app)
        .patch(`/api/roadmaps/${testRoadmap.id}/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ isCompleted: true });

      expect(res.status).toBe(200);
      expect(res.body.task.isCompleted).toBe(true);
      expect(res.body.progressPercentage).toBeGreaterThan(0);
    });

    test('PATCH /api/roadmaps/:id/tasks/:taskId prevents unauthorized user from editing other user roadmap', async () => {
      const res = await request(app)
        .patch(`/api/roadmaps/${testRoadmap.id}/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${student2Token}`) // Taylor trying to edit Alex's roadmap
        .send({ isCompleted: true });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/roadmap not found/i);
    });
  });

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  describe('Notifications Endpoints', () => {
    test('GET /api/notifications returns user notifications with unread count', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBeGreaterThanOrEqual(1);
      expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
      expect(res.body.notifications[0].id).toBe(testNotification.id);
    });

    test('PATCH /api/notifications/:id/read marks notification read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.notification.readAt).toBeDefined();
    });

    test('PATCH /api/notifications/:id/read prevents modifying another user notification', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${student2Token}`); // Taylor trying to mark Alex's notification

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  // ==========================================
  // PEER MATCHING
  // ==========================================
  describe('Peer Matching Endpoints', () => {
    beforeAll(async () => {
      // Both Alex (student1) and Taylor (student2) save testOpp1
      await SavedOpportunity.findOrCreate({
        where: { userId: student1User.id, opportunityId: testOpp1.id }
      });
      await SavedOpportunity.findOrCreate({
        where: { userId: student2User.id, opportunityId: testOpp1.id }
      });
    });

    test('GET /api/peers/matches?opportunityId= finds consented peers with shared skills', async () => {
      const res = await request(app)
        .get(`/api/peers/matches?opportunityId=${testOpp1.id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.peers).toBeDefined();
      expect(res.body.peers.some(p => p.userId === student2User.id)).toBe(true);

      const taylorMatch = res.body.peers.find(p => p.userId === student2User.id);
      expect(taylorMatch.sharedSkills).toContain('Python');
    });

    test('GET /api/peers/matches enforces peer matching consent', async () => {
      // Revoke consent for student1 temporarily
      const p = await StudentProfile.findOne({ where: { userId: student1User.id } });
      await p.update({ peerMatchingConsent: false, isPublicForMatching: false });

      const res = await request(app)
        .get(`/api/peers/matches?opportunityId=${testOpp1.id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.consentRequired).toBe(true);

      // Restore consent
      await p.update({ peerMatchingConsent: true, isPublicForMatching: true });
    });

    test('POST /api/peers/requests creates a collaboration request', async () => {
      const res = await request(app)
        .post('/api/peers/requests')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          opportunityId: testOpp1.id,
          recipientId: student2User.id,
          message: 'Hey Taylor! Would love to team up on this hackathon.'
        });

      expect(res.status).toBe(201);
      expect(res.body.request.requesterId).toBe(student1User.id);
      expect(res.body.request.recipientId).toBe(student2User.id);
      expect(res.body.request.status).toBe('pending');
      testMatchRequest = res.body.request;
    });

    test('POST /api/peers/requests blocks self-invites and duplicate invites', async () => {
      // Self-invite
      const selfRes = await request(app)
        .post('/api/peers/requests')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          opportunityId: testOpp1.id,
          recipientId: student1User.id
        });
      expect(selfRes.status).toBe(400);

      // Duplicate invite
      const dupRes = await request(app)
        .post('/api/peers/requests')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          opportunityId: testOpp1.id,
          recipientId: student2User.id
        });
      expect(dupRes.status).toBe(409);
    });

    test('PATCH /api/peers/requests/:id allows only designated recipient to respond', async () => {
      // Alex (requester) trying to accept their own invite should fail
      const requesterRes = await request(app)
        .patch(`/api/peers/requests/${testMatchRequest.id}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ action: 'accepted' });
      expect(requesterRes.status).toBe(404);

      // Taylor (recipient) accepts
      const recipientRes = await request(app)
        .patch(`/api/peers/requests/${testMatchRequest.id}`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ action: 'accepted', contactDetail: 'taylor@stanford.edu' });

      expect(recipientRes.status).toBe(200);
      expect(recipientRes.body.request.status).toBe('accepted');
    });
  });

  // ==========================================
  // ADMIN ENDPOINTS
  // ==========================================
  describe('Admin Endpoints', () => {
    test('POST /api/admin/feeds/import blocks unauthorized student with 403', async () => {
      const res = await request(app)
        .post('/api/admin/feeds/import')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ feedId: 'sample-json-a' });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/privileges required/i);
    });

    test('POST /api/admin/feeds/import rejects path traversal or arbitrary filesystem paths with 400', async () => {
      const res = await request(app)
        .post('/api/admin/feeds/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ feedId: '../../etc/passwd' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    test('POST /api/admin/feeds/import rejects unknown feed identifier with 400', async () => {
      const res = await request(app)
        .post('/api/admin/feeds/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ feedId: 'unapproved-custom-feed' });

      expect(res.status).toBe(400);
    });

    test('POST /api/admin/feeds/import accepts validated feed identifier `sample-json-a`', async () => {
      const res = await request(app)
        .post('/api/admin/feeds/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ feedId: 'sample-json-a' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/imported successfully/i);
    });

    test('GET /api/admin/imports returns paginated feed imports list', async () => {
      const res = await request(app)
        .get('/api/admin/imports?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.imports).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
    });
  });
});
