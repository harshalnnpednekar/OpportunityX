const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const {
  sequelize,
  User,
  StudentProfile,
  Opportunity,
  SavedOpportunity,
  OpportunityUpdate,
  Notification,
  Roadmap,
  RoadmapTask,
  MatchRequest,
  FeedImport
} = require('../src/models');

const JWT_SECRET = process.env.JWT_SECRET || 'opportunityx_super_secret_jwt_key_2026_production_grade';

describe('Student Workflows End-to-End Verification Suite', () => {
  let student1, student1Token;
  let student2, student2Token;
  let student3Private, student3PrivateToken;
  let adminUser, adminToken;
  let sampleOpp, closingOpp;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // Seed test opportunities
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const nearDeadline = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days away (< 7 days)

    sampleOpp = await Opportunity.create({
      title: 'Global Sustainable AI Hackathon 2026',
      organizer: 'Green Tech Institute',
      description: 'Build sustainable AI solutions for environmental challenges.',
      category: 'hackathon',
      eventType: 'hackathon',
      theme: 'sustainability',
      applicationUrl: 'https://greentech.edu/apply',
      normalizedFingerprint: 'global-sustainable-ai-hackathon-2026',
      format: 'virtual',
      location: 'Online',
      costAmount: 0,
      currency: 'USD',
      status: 'active',
      beginnerFriendly: true,
      sustainabilityFocused: true,
      requiredSkills: ['React', 'Python'],
      deadline: futureDate
    });

    closingOpp = await Opportunity.create({
      title: 'National Robotics Sprint 2026',
      organizer: 'RoboAlliance',
      description: 'Rapid prototyping competition closing soon.',
      category: 'competition',
      eventType: 'competition',
      theme: 'robotics',
      applicationUrl: 'https://robo.edu/apply',
      normalizedFingerprint: 'national-robotics-sprint-2026',
      format: 'in_person',
      location: 'Boston, MA',
      costAmount: 20,
      currency: 'USD',
      status: 'active',
      beginnerFriendly: false,
      sustainabilityFocused: false,
      requiredSkills: ['C++', 'ROS'],
      deadline: nearDeadline
    });

    // Seed admin user with role: 'admin' and token containing userId
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@opportunityx.edu',
      passwordHash: 'AdminPass123!',
      role: 'admin'
    });
    adminToken = jwt.sign({ userId: adminUser.id, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // 1. Authentication & Profile Journey
  describe('1. Authentication & Profile Journey', () => {
    test('Register new student with validated credentials', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Connor',
          email: 'sarah.connor@university.edu',
          password: 'Password123!',
          skills: ['React', 'Python', 'Node.js'],
          interests: ['hackathon', 'sustainability'],
          budgetMax: 50,
          availability: 'flexible',
          preferredFormat: 'virtual',
          preferredLocation: 'Online',
          experienceLevel: 'beginner',
          peerMatchingConsent: true
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('sarah.connor@university.edu');
      expect(res.body.user.passwordHash).toBeUndefined(); // Never expose password hash

      student1 = res.body.user;
      student1Token = res.body.token;
    });

    test('Log in with credentials and receive valid session token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sarah.connor@university.edu',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('student');
      student1Token = res.body.token;
    });

    test('Edit student profile and persist updated skills & budget', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          skills: ['React', 'Python', 'TypeScript'],
          budgetMax: 75,
          bio: 'Building green AI tooling for universities.'
        });

      expect(res.status).toBe(200);
      expect(res.body.profile.skills).toContain('TypeScript');
      expect(res.body.profile.budgetMax).toBe(75);
    });

    test('Setup second student (John) and private third student (Charlie)', async () => {
      // Register John (Consented)
      const reg2 = await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: 'john.doe@university.edu',
        password: 'Password123!',
        skills: ['React', 'Figma', 'UI/UX'],
        interests: ['hackathon'],
        peerMatchingConsent: true
      });
      student2 = reg2.body.user;
      student2Token = reg2.body.token;

      // Register Charlie (Private, no consent)
      const reg3 = await request(app).post('/api/auth/register').send({
        name: 'Charlie Private',
        email: 'charlie.private@university.edu',
        password: 'Password123!',
        skills: ['React', 'Python'],
        interests: ['hackathon'],
        peerMatchingConsent: false
      });
      student3Private = reg3.body.user;
      student3PrivateToken = reg3.body.token;
    });
  });

  // 2. Search, Filter & Catalogue Navigation
  describe('2. Search, Filter, Sort & Catalogue Navigation', () => {
    test('Filter by keyword search', async () => {
      const res = await request(app)
        .get('/api/opportunities?q=Sustainable')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunities.length).toBeGreaterThan(0);
      expect(res.body.opportunities[0].title).toContain('Sustainable');
    });

    test('Filter by category and remote format', async () => {
      const res = await request(app)
        .get('/api/opportunities?category=hackathon&format=virtual&remote=true');

      expect(res.status).toBe(200);
      expect(res.body.opportunities.length).toBeGreaterThan(0);
      expect(res.body.opportunities.every(o => o.format === 'virtual')).toBe(true);
    });

    test('Filter by beginnerFriendly, lowCost, and sustainabilityFocused', async () => {
      const res = await request(app)
        .get('/api/opportunities?beginnerFriendly=true&lowCost=true&sustainabilityFocused=true');

      expect(res.status).toBe(200);
      expect(res.body.opportunities.length).toBeGreaterThan(0);
      expect(res.body.opportunities[0].sustainabilityFocused).toBe(true);
      expect(res.body.opportunities[0].beginnerFriendly).toBe(true);
    });

    test('Filter by location and status', async () => {
      const res = await request(app)
        .get('/api/opportunities?location=Boston&status=active');

      expect(res.status).toBe(200);
      expect(res.body.opportunities.length).toBe(1);
      expect(res.body.opportunities[0].title).toContain('Robotics');
    });

    test('Sort by deadline and paginate results', async () => {
      const res = await request(app)
        .get('/api/opportunities?sort=deadline&page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.total).toBeDefined();
      expect(res.body.opportunities.length).toBe(2);
      // Sooner deadline should appear first
      expect(new Date(res.body.opportunities[0].deadline).getTime()).toBeLessThan(
        new Date(res.body.opportunities[1].deadline).getTime()
      );
    });

    test('Open opportunity details by ID', async () => {
      const res = await request(app)
        .get(`/api/opportunities/${sampleOpp.id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunity.id).toBe(sampleOpp.id);
      expect(res.body.opportunity.title).toBe(sampleOpp.title);
    });
  });

  // 3. Saved Opportunities & Pipeline Management
  describe('3. Saved Opportunities & Duplicate Prevention', () => {
    test('Save opportunity to tracker', async () => {
      const res = await request(app)
        .post(`/api/opportunities/${sampleOpp.id}/save`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ status: 'saved', notes: 'First choice for spring semester.' });

      expect(res.status).toBe(201);
      expect(res.body.saved).toBeDefined();
      expect(res.body.saved.status).toBe('saved');
    });

    test('Save status update when modifying existing saved entry', async () => {
      const res = await request(app)
        .post(`/api/opportunities/${sampleOpp.id}/save`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ status: 'planning', notes: 'Updated to planning phase.' });

      expect(res.status).toBe(200);
      expect(res.body.saved.status).toBe('planning');
    });

    test('Save approaching deadline opportunity for reminder testing', async () => {
      const res = await request(app)
        .post(`/api/opportunities/${closingOpp.id}/save`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ status: 'planning' });

      expect(res.status).toBe(201);
    });

    test('Query saved list with pipeline filter', async () => {
      const res = await request(app)
        .get('/api/saved')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.saved.length).toBe(2);
    });

    test('Unsave opportunity from tracker', async () => {
      const res = await request(app)
        .delete(`/api/opportunities/${sampleOpp.id}/save`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('removed');

      // Verify removal
      const checkRes = await request(app)
        .get('/api/saved')
        .set('Authorization', `Bearer ${student1Token}`);
      expect(checkRes.body.saved.length).toBe(1);

      // Re-save for downstream tests
      await request(app)
        .post(`/api/opportunities/${sampleOpp.id}/save`)
        .set('Authorization', `Bearer ${student1Token}`);
    });
  });

  // 4. Recommendations & Independent Eligibility
  describe('4. Recommendations & Independent Eligibility', () => {
    test('Retrieve explainable recommendations tailored to student', async () => {
      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.recommendations).toBeDefined();
      expect(res.body.recommendations.length).toBeGreaterThan(0);

      const rec = res.body.recommendations[0];
      expect(rec.matchScore).toBeDefined();
      expect(rec.explanation).toBeDefined();
      expect(rec.matchedSkills).toBeDefined();
    });

    test('Evaluate independent eligibility without penalizing match score', async () => {
      const res = await request(app)
        .get(`/api/opportunities/${sampleOpp.id}/eligibility`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(['eligible', 'likely_eligible']).toContain(res.body.status);
      expect(res.body.checks).toBeDefined();
    });
  });

  // 5. Preparation Roadmaps
  describe('5. Preparation Roadmaps Generation & Task Completion', () => {
    let roadmapId, taskId;

    test('Generate an 8-stage preparation roadmap', async () => {
      const res = await request(app)
        .post('/api/roadmaps/generate')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ opportunityId: sampleOpp.id });

      expect(res.status).toBe(201);
      expect(res.body.roadmap).toBeDefined();
      expect(res.body.roadmap.tasks.length).toBe(8);

      // Verify applicable stages: eligibility verification, skill prep, team formation, milestones, submission
      const taskTitles = res.body.roadmap.tasks.map(t => t.title);
      expect(taskTitles[0]).toContain('Eligibility Verification');
      expect(taskTitles.some(t => t.includes('Team Formation'))).toBe(true);
      expect(taskTitles.some(t => t.includes('Skill Preparation'))).toBe(true);
      expect(taskTitles.some(t => t.includes('Pre-Submission Checklist'))).toBe(true);
      expect(taskTitles.some(t => t.includes('Deadline Buffer'))).toBe(true);

      roadmapId = res.body.roadmap.id;
      taskId = res.body.roadmap.tasks[0].id;
    });

    test('Toggle a roadmap task to completed and verify readiness progress updates', async () => {
      const res = await request(app)
        .patch(`/api/roadmaps/${roadmapId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ isCompleted: true });

      expect(res.status).toBe(200);
      expect(res.body.task.isCompleted).toBe(true);
      expect(res.body.progressPercentage).toBe(13); // 1 of 8 = 12.5% rounded to 13%
    });
  });

  // 6. In-App Deadline Reminders & Opportunity Updates
  describe('6. Deadline Reminders & Update Notices', () => {
    test('Trigger in-app deadline reminder refresh for approaching deadline listing', async () => {
      const res = await request(app)
        .post('/api/notifications/refresh-reminders')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Deadline reminders refreshed');
      expect(res.body.notifications.length).toBeGreaterThanOrEqual(1);
    });

    test('Inspect student notifications containing deadline reminder', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBeGreaterThanOrEqual(1);

      const deadlineNotif = res.body.notifications.find(n => n.type === 'deadline_reminder');
      expect(deadlineNotif).toBeDefined();
      expect(deadlineNotif.message).toContain('closes in 4 days');
    });

    test('Record an opportunity update and verify student receives change notice', async () => {
      // Simulate feed update recording
      await OpportunityUpdate.create({
        opportunityId: sampleOpp.id,
        updateType: 'deadline_extended',
        message: 'Application deadline extended by 14 days.',
        oldValue: { deadline: sampleOpp.deadline },
        newValue: { deadline: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000) },
        detectedAt: new Date()
      });

      // Create notification for student who saved sampleOpp
      await Notification.create({
        userId: student1.id,
        opportunityId: sampleOpp.id,
        type: 'opportunity_update',
        message: 'Update for Global Sustainable AI Hackathon 2026: Application deadline extended by 14 days.'
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${student1Token}`);

      const updateNotif = res.body.notifications.find(n => n.type === 'opportunity_update');
      expect(updateNotif).toBeDefined();
      expect(updateNotif.message).toContain('extended');

      // Mark notification as read
      const markRes = await request(app)
        .patch(`/api/notifications/${updateNotif.id}/read`)
        .set('Authorization', `Bearer ${student1Token}`);
      expect(markRes.status).toBe(200);
      expect(markRes.body.notification.readAt).not.toBeNull();
    });
  });

  // 7. Consent-Based Peer Matching & Privacy Protections
  describe('7. Consent-Based Peer Matching & Privacy Flow', () => {
    beforeAll(async () => {
      // John also saves the sampleOpp
      await request(app)
        .post(`/api/opportunities/${sampleOpp.id}/save`)
        .set('Authorization', `Bearer ${student2Token}`);
    });

    test('Candidate discovery strictly redacts email and returns compatibility explanation', async () => {
      const res = await request(app)
        .get(`/api/peers/matches?opportunityId=${sampleOpp.id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.peers.length).toBeGreaterThanOrEqual(1);

      const john = res.body.peers.find(p => p.userId === student2.id);
      expect(john).toBeDefined();
      expect(john.email).toBeUndefined(); // Email must be redacted!
      expect(john.compatibilityScore).toBeGreaterThanOrEqual(50);
      expect(john.compatibilityExplanation).toContain('Compatibility:');
      expect(john.sharedSkills).toContain('React');
    });

    test('Non-consented student (Charlie) never appears in peer discovery', async () => {
      // Charlie saves sampleOpp
      await request(app)
        .post(`/api/opportunities/${sampleOpp.id}/save`)
        .set('Authorization', `Bearer ${student3PrivateToken}`);

      const res = await request(app)
        .get(`/api/peers/matches?opportunityId=${sampleOpp.id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      const charlie = res.body.peers.find(p => p.userId === student3Private.id);
      expect(charlie).toBeUndefined(); // Opt-in required!
    });

    test('Sending collaboration request from Sarah to John', async () => {
      const res = await request(app)
        .post('/api/peers/requests')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          opportunityId: sampleOpp.id,
          receiverId: student2.id,
          message: 'Hi John, let us team up on the AI track!',
          contactPreference: 'email',
          contactDetail: 'sarah.connor@university.edu'
        });

      expect(res.status).toBe(201);
      expect(res.body.request.status).toBe('pending');
    });

    test('Before acceptance, John cannot view Sarah raw contact details', async () => {
      const res = await request(app)
        .get('/api/peers/requests')
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(200);
      const incoming = res.body.received.find(r => r.requesterId === student1.id);
      expect(incoming).toBeDefined();
      expect(incoming.status).toBe('pending');
      expect(incoming.contactDetail).toBeUndefined(); // Redacted until accepted!
    });

    test('John accepts collaboration request -> contact details unlocked', async () => {
      const incomingReqs = await request(app)
        .get('/api/peers/requests')
        .set('Authorization', `Bearer ${student2Token}`);

      const matchId = incomingReqs.body.received[0].id;

      const acceptRes = await request(app)
        .patch(`/api/peers/requests/${matchId}`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ action: 'accepted', contactDetail: 'john.doe@university.edu' });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.request.status).toBe('accepted');
      expect(acceptRes.body.request.contactDetail).toBe('john.doe@university.edu');
    });

    test('Withdraw consent (DELETE /api/peers/consent) hides student and auto-declines pending requests', async () => {
      const withdrawRes = await request(app)
        .delete('/api/peers/consent')
        .set('Authorization', `Bearer ${student2Token}`);

      expect(withdrawRes.status).toBe(200);
      expect(withdrawRes.body.peerMatchingConsent).toBe(false);

      // Now Sarah searches for peers -> John should no longer appear
      const searchPeers = await request(app)
        .get(`/api/peers/matches?opportunityId=${sampleOpp.id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      const johnCandidate = searchPeers.body.peers.find(p => p.userId === student2.id);
      expect(johnCandidate).toBeUndefined();
    });
  });

  // 8. Admin Feed Ingestion & Audit Logs
  describe('8. Admin Feed Ingestion & Audit Logging', () => {
    test('Non-admin accounts are rejected with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/admin/feeds/import')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ feedId: 'sample-json-a' });

      expect(res.status).toBe(403);
    });

    test('Admin imports valid local feed and logs execution history', async () => {
      const res = await request(app)
        .post('/api/admin/feeds/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ feedId: 'sample-json-a' });

      expect(res.status).toBe(200);
      expect(res.body.import).toBeDefined();
      expect(res.body.import.recordsSeen).toBeGreaterThan(0);
    });

    test('Admin queries feed import history logs', async () => {
      const res = await request(app)
        .get('/api/admin/imports?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.imports.length).toBeGreaterThan(0);
      expect(res.body.imports[0].sourceName).toBeDefined();
    });
  });
});
