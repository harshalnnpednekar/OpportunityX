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
const seed = require('../src/seeders/seed');

describe('PostgreSQL Database Layer with Sequelize', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    await seed();
  }, 30000);

  afterAll(async () => {
    await sequelize.close();
  });

  test('Database connection is authenticated and operational', async () => {
    expect(sequelize).toBeDefined();
    await expect(sequelize.authenticate()).resolves.not.toThrow();
  });

  test('1. User model can be queried and validates password', async () => {
    const user = await User.findOne({ where: { email: 'alex.chen@university.edu' } });
    expect(user).not.toBeNull();
    expect(user.name).toBe('Alex Chen');
    expect(user.role).toBe('student');
    const isValid = await user.validatePassword('StudentPass123!');
    expect(isValid).toBe(true);
  });

  test('2. StudentProfile model supports one-to-one association with User', async () => {
    const user = await User.findOne({
      where: { email: 'alex.chen@university.edu' },
      include: [{ model: StudentProfile, as: 'profile' }]
    });
    expect(user.profile).not.toBeNull();
    expect(user.profile.skills).toContain('Python');
    expect(user.profile.budgetMax).toBeDefined();
    expect(user.profile.peerMatchingConsent).toBe(true);
  });

  test('3. Opportunity model queries ~30 seeded records with data quality fields', async () => {
    const count = await Opportunity.count();
    expect(count).toBeGreaterThanOrEqual(30);

    const expired = await Opportunity.findOne({ where: { status: 'expired' } });
    expect(expired).not.toBeNull();
    expect(expired.title).toContain('[EXPIRED SAMPLE]');
    expect(expired.normalizedFingerprint).toBeDefined();
    expect(expired.trustScore).toBeLessThanOrEqual(100);

    const active = await Opportunity.findOne({ where: { status: 'active' } });
    expect(active).not.toBeNull();
    expect(active.organizer).toBeDefined();
    expect(active.eventType).toBeDefined();
    expect(active.costAmount).toBeDefined();
  });

  test('4. SavedOpportunity enforces uniqueness on userId and opportunityId', async () => {
    const saved = await SavedOpportunity.findOne();
    expect(saved).not.toBeNull();
    expect(saved.reminderEnabled).toBeDefined();
    expect(saved.savedAt).toBeDefined();

    // Verify duplicate creation throws unique constraint error
    await expect(
      SavedOpportunity.create({
        userId: saved.userId,
        opportunityId: saved.opportunityId,
        reminderEnabled: false
      })
    ).rejects.toThrow();
  });

  test('5. OpportunityUpdate model tracks changes linked to an opportunity', async () => {
    const update = await OpportunityUpdate.findOne({
      include: [{ model: Opportunity, as: 'opportunity' }]
    });
    expect(update).not.toBeNull();
    expect(update.updateType).toBe('deadline_extended');
    expect(update.opportunity).not.toBeNull();
    expect(update.detectedAt).toBeDefined();
  });

  test('6. Notification model can be queried with user and optional opportunity', async () => {
    const notification = await Notification.findOne({
      include: [
        { model: User, as: 'user' },
        { model: Opportunity, as: 'opportunity' }
      ]
    });
    expect(notification).not.toBeNull();
    expect(notification.type).toBe('deadline_reminder');
    expect(notification.user).not.toBeNull();
  });

  test('7 & 8. Roadmap and RoadmapTask models have proper cascade associations', async () => {
    const roadmap = await Roadmap.findOne({
      include: [{ model: RoadmapTask, as: 'tasks' }]
    });
    expect(roadmap).not.toBeNull();
    expect(roadmap.tasks).toBeDefined();
    expect(roadmap.tasks.length).toBeGreaterThan(0);
    expect(roadmap.tasks[0].sortOrder).toBeDefined();
    expect(roadmap.tasks[0].status).toBeDefined();
  });

  test('9. MatchRequest model links requester and recipient with optional opportunity', async () => {
    const match = await MatchRequest.findOne({
      include: [
        { model: User, as: 'requester' },
        { model: User, as: 'recipient' },
        { model: Opportunity, as: 'opportunity' }
      ]
    });
    expect(match).not.toBeNull();
    expect(match.status).toBe('pending');
    expect(match.requester).not.toBeNull();
    expect(match.recipient).not.toBeNull();
  });

  test('10. FeedImport tracks ingestion audit metrics', async () => {
    const feedImport = await FeedImport.findOne({
      order: [['startedAt', 'DESC']]
    });
    expect(feedImport).not.toBeNull();
    expect(feedImport.sourceName).toBeDefined();
    expect(feedImport.sourceType).toBeDefined();
    expect(feedImport.recordsSeen).toBeGreaterThan(0);
    expect(feedImport.recordsCreated).toBeDefined();
  });
});
