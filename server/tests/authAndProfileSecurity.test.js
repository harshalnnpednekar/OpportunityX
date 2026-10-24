const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const {
  sequelize,
  User,
  StudentProfile,
  Opportunity,
  SavedOpportunity
} = require('../src/models');

const JWT_SECRET = process.env.JWT_SECRET || 'opportunityx_super_secret_jwt_key_2026_production_grade';

describe('Authentication & Profile Security', () => {
  let studentAUser;
  let studentAToken;
  let studentBUser;
  let studentBToken;
  let studentCPrivateUser;
  let studentCPrivateToken;
  let adminToken;
  let sampleOpp;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // Seed one simple test opportunity without running heavy feed importers
    sampleOpp = await Opportunity.create({
      title: 'Global AI Hackathon 2026',
      organizer: 'OpportunityX Foundation',
      description: 'Annual hackathon for student innovators.',
      category: 'hackathon',
      eventType: 'hackathon',
      applicationUrl: 'https://opportunityx.edu/apply/sample-opp',
      normalizedFingerprint: 'sample-hackathon-2026-opportunityx',
      format: 'virtual',
      location: 'Online',
      costAmount: 0,
      currency: 'USD',
      status: 'active'
    });

    // 1. Student A (Consented)
    studentAUser = await User.create({
      name: 'Alice Walker',
      email: 'alice.walker@university.edu',
      passwordHash: 'AlicePassword123!',
      role: 'student'
    });
    await StudentProfile.create({
      userId: studentAUser.id,
      fullName: 'Alice Walker',
      skills: ['Python', 'PostgreSQL'],
      interests: ['hackathons'],
      budgetMax: 50.00,
      availability: 'flexible',
      preferredFormat: 'virtual',
      preferredLocation: 'North America',
      experienceLevel: 'intermediate',
      peerMatchingConsent: true
    });

    // 2. Student B (Consented)
    studentBUser = await User.create({
      name: 'Bob Martin',
      email: 'bob.martin@university.edu',
      passwordHash: 'BobPassword123!',
      role: 'student'
    });
    await StudentProfile.create({
      userId: studentBUser.id,
      fullName: 'Bob Martin',
      skills: ['React', 'Figma'],
      interests: ['hackathons'],
      budgetMax: 75.00,
      availability: 'weekends',
      preferredFormat: 'virtual',
      preferredLocation: 'Global',
      experienceLevel: 'beginner',
      peerMatchingConsent: true
    });

    // 3. Student C (Strictly NO peer consent)
    studentCPrivateUser = await User.create({
      name: 'Charlie Private',
      email: 'charlie.private@university.edu',
      passwordHash: 'CharliePassword123!',
      role: 'student'
    });
    await StudentProfile.create({
      userId: studentCPrivateUser.id,
      fullName: 'Charlie Private',
      skills: ['Rust'],
      interests: ['research'],
      peerMatchingConsent: false
    });

    // 4. Admin User
    await User.create({
      name: 'Security Admin',
      email: 'secadmin@opportunityx.edu',
      passwordHash: 'AdminSecurity123!',
      role: 'admin'
    });

    // Obtain tokens
    const loginA = await request(app).post('/api/auth/login').send({
      email: 'alice.walker@university.edu',
      password: 'AlicePassword123!'
    });
    studentAToken = loginA.body.token;

    const loginB = await request(app).post('/api/auth/login').send({
      email: 'bob.martin@university.edu',
      password: 'BobPassword123!'
    });
    studentBToken = loginB.body.token;

    const loginC = await request(app).post('/api/auth/login').send({
      email: 'charlie.private@university.edu',
      password: 'CharliePassword123!'
    });
    studentCPrivateToken = loginC.body.token;

    const loginAdmin = await request(app).post('/api/auth/login').send({
      email: 'secadmin@opportunityx.edu',
      password: 'AdminSecurity123!'
    });
    adminToken = loginAdmin.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ===================================================
  // 1. REGISTRATION, PASSWORD RULES & DUPLICATES
  // ===================================================
  describe('Registration & Password Validation', () => {
    test('rejects registration with short password (< 8 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Short Pass', email: 'short@university.edu', password: 'Pass1' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    test('rejects registration with password lacking numbers', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'No Num', email: 'nonum@university.edu', password: 'LettersOnlyPassword' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    test('rejects duplicate email with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice Duplicate', email: 'alice.walker@university.edu', password: 'StrongPassword123!' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });

    test('registers successfully, sets httpOnly cookie, and strips passwordHash', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'David New',
          email: 'david.new@university.edu',
          password: 'DavidPassword123!',
          skills: ['Python', 'Docker'],
          interests: ['hackathons'],
          budgetMax: 50.00,
          availability: 'flexible',
          preferredFormat: 'virtual',
          preferredLocation: 'Europe',
          experienceLevel: 'beginner',
          peerMatchingConsent: true
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('david.new@university.edu');
      expect(res.body.user.passwordHash).toBeUndefined(); // NEVER EXPOSED
      expect(res.body.user.profile.skills).toContain('Docker');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('token='))).toBe(true);
      expect(cookies.some(c => c.toLowerCase().includes('httponly'))).toBe(true);
    });
  });

  // ===================================================
  // 2. LOGIN, CREDENTIALS & SESSIONS
  // ===================================================
  describe('Login & Session Management', () => {
    test('returns generic error on incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice.walker@university.edu', password: 'WrongPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });

    test('returns generic error on non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@university.edu', password: 'Password123!' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });

    test('authenticates via httpOnly cookie alone (without Authorization header)', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice.walker@university.edu', password: 'AlicePassword123!' });

      const cookieHeader = loginRes.headers['set-cookie'][0].split(';')[0];
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookieHeader);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('alice.walker@university.edu');
      expect(meRes.body.user.passwordHash).toBeUndefined();
    });

    test('logout clears the active session cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/logged out/i);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('token=;') || c.includes('Expires='))).toBe(true);
    });
  });

  // ===================================================
  // 3. TOKEN VALIDATION & ROLE PERMISSIONS
  // ===================================================
  describe('Token Validation & Role Authorization', () => {
    test('rejects unauthenticated requests on protected routes with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    test('rejects expired tokens with 401', async () => {
      const expiredToken = jwt.sign(
        { userId: studentAUser.id, email: studentAUser.email, role: studentAUser.role },
        JWT_SECRET,
        { expiresIn: '-5m' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid or expired/i);
    });

    test('blocks regular student from accessing admin endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/privileges required/i);
    });

    test('allows admin user to access admin endpoints with 200', async () => {
      const res = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.overview).toBeDefined();
    });
  });

  // ===================================================
  // 4. PROFILE MANAGEMENT & OWNERSHIP BOUNDARIES
  // ===================================================
  describe('Profile Editing & Ownership Boundaries', () => {
    test('updates own profile without altering other users', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${studentBToken}`)
        .send({
          skills: ['React', 'Figma', 'TypeScript'],
          budgetMax: 120.00,
          preferredLocation: 'Remote'
        });

      expect(res.status).toBe(200);
      expect(res.body.profile.userId).toBe(studentBUser.id);
      expect(res.body.profile.skills).toContain('TypeScript');

      // Verify Alice's profile was not touched
      const aliceProfile = await StudentProfile.findOne({ where: { userId: studentAUser.id } });
      expect(aliceProfile.skills).not.toContain('TypeScript');
      expect(Number(aliceProfile.budgetMax)).toBe(50.00);
    });
  });

  // ===================================================
  // 5. PEER MATCHING CONSENT & PRIVACY
  // ===================================================
  describe('Peer Matching Privacy & Consent Isolation', () => {
    beforeAll(async () => {
      await SavedOpportunity.findOrCreate({
        where: { userId: studentAUser.id, opportunityId: sampleOpp.id }
      });
      await SavedOpportunity.findOrCreate({
        where: { userId: studentBUser.id, opportunityId: sampleOpp.id }
      });
      await SavedOpportunity.findOrCreate({
        where: { userId: studentCPrivateUser.id, opportunityId: sampleOpp.id }
      });
    });

    test('student without peer consent is blocked from searching matches with 403', async () => {
      const res = await request(app)
        .get(`/api/peers/matches?opportunityId=${sampleOpp.id}`)
        .set('Authorization', `Bearer ${studentCPrivateToken}`);

      expect(res.status).toBe(403);
      expect(res.body.consentRequired).toBe(true);
    });

    test('private students without consent are excluded from peer discovery', async () => {
      const res = await request(app)
        .get(`/api/peers/matches?opportunityId=${sampleOpp.id}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.peers.some(p => p.userId === studentBUser.id)).toBe(true);
      expect(res.body.peers.some(p => p.userId === studentCPrivateUser.id)).toBe(false);
    });

    test('cannot send match request to a user who has not consented', async () => {
      const res = await request(app)
        .post('/api/peers/requests')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          opportunityId: sampleOpp.id,
          recipientId: studentCPrivateUser.id
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not available for peer matching/i);
    });
  });
});
