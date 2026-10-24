const path = require('path');
const FeedNormalizer = require('../src/services/feedNormalizer');
const FeedImporter = require('../src/services/feedImporter');
const FixtureReader = require('../src/utils/fixtureReader');
const importEvents = require('../src/services/importEvents');
const {
  sequelize,
  Opportunity,
  FeedImport,
  OpportunityUpdate,
  User,
  SavedOpportunity,
  Notification
} = require('../src/models');

describe('Data Import Pipeline & Multi-Schema Normalization', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // =================================================================
  // 1. STREAM & BUFFER FIXTURE READER
  // =================================================================
  describe('FixtureReader Stream & Buffer Utility', () => {
    test('reads local fixture file using Node.js streams and buffers', async () => {
      const hackPath = path.resolve(__dirname, '../src/feeds/sample-hackathons.json');
      const result = await FixtureReader.readStreamAsync(hackPath);

      expect(result).toBeDefined();
      expect(typeof result.content).toBe('string');
      expect(result.byteLength).toBeGreaterThan(0);
      expect(result.filename).toBe('sample-hackathons.json');
      expect(result.content).toContain('Global Collegiate Hackathon Registry');
    });

    test('rejects path traversal attempts outside allowed fixture directories', async () => {
      await expect(
        FixtureReader.readStreamAsync('../../etc/passwd')
      ).rejects.toThrow(/Security Error: Access to path/i);
    });
  });

  // =================================================================
  // 2. PARSING JSON FEEDS A & B AND XML FEED C
  // =================================================================
  describe('Multi-Schema Normalization (Feed A, Feed B, Feed C)', () => {
    test('parses JSON Feed A (Hackathons schema) into unified opportunity schema', () => {
      const feedA = JSON.stringify({
        items: [
          {
            id: 'hack-test-1',
            title: 'mit hackmit open innovation sprint',
            organization: 'mit tech club',
            description: 'A 36-hour weekend sprint pushing autonomous agents and tooling.',
            category: 'hackathon',
            format: 'in_person',
            location: 'Cambridge, MA',
            cost: 'free',
            deadline: '2026-11-08T23:59:59Z',
            startDate: '2026-11-14T08:00:00Z',
            endDate: '2026-11-15T20:00:00Z',
            applyUrl: 'https://demo.hackmit.example.edu/register'
          }
        ]
      });

      const items = FeedNormalizer.parseJsonFeed(feedA, 'feed-a');
      expect(items.length).toBe(1);
      const item = items[0];

      expect(item.externalId).toBe('hack-test-1');
      // Capitalization normalized to Title Case
      expect(item.title).toBe('Mit Hackmit Open Innovation Sprint');
      expect(item.organizer).toBe('Mit Tech Club');
      expect(item.format).toBe('in-person');
      expect(item.costType).toBe('free');
      expect(item.costAmount).toBe(0.00);
      expect(item.sourceFormat).toBe('json');
      expect(item.isDemo).toBe(true);
      expect(item.normalizedFingerprint).toBeDefined();
    });

    test('parses JSON Feed B (distinct Workshops schema) with alternative field names', () => {
      const feedB = JSON.stringify({
        registryTitle: 'Global Academic Workshops Registry [DEMO FEED B]',
        workshop_registry: [
          {
            workshop_code: 'work-test-2',
            event_name: 'stanford foundation models masterclass',
            host_institution: 'stanford institute for human-centered ai',
            synopsis: 'A 5-day intensive technical workshop on scaling laws and parameter-efficient fine-tuning.',
            track_type: 'workshop',
            delivery_mode: 'webinar',
            venue_location: 'Online / Zoom',
            tuition_pricing: {
              is_free: false,
              fee_amount: 45.00,
              currency: 'USD'
            },
            dates_and_deadlines: {
              application_cutoff: '2026-11-12T23:59:59Z',
              commences_on: '2026-11-18T16:00:00Z',
              concludes_on: '2026-11-22T20:00:00Z'
            },
            registration_portal_url: 'https://demo.hai.stanford.example.edu/masterclass'
          }
        ]
      });

      const items = FeedNormalizer.parseJsonFeed(feedB, 'feed-b');
      expect(items.length).toBe(1);
      const item = items[0];

      expect(item.externalId).toBe('work-test-2');
      expect(item.title).toBe('Stanford Foundation Models Masterclass');
      expect(item.organizer).toBe('Stanford Institute for Human-Centered Ai');
      expect(item.format).toBe('virtual'); // 'webinar' normalized to 'virtual'
      expect(item.costType).toBe('paid_entry');
      expect(item.costAmount).toBe(45.00);
      expect(item.currency).toBe('USD');
      expect(item.sourceFormat).toBe('json');
    });

    test('parses XML Feed C (Competitions XML) safely with entities disabled', () => {
      const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<competitionFeed version="1.0">
  <opportunities>
    <entry>
      <externalId>comp-xml-1</externalId>
      <name>ACM Collegiate Programming Contest</name>
      <sponsor>Algorithm Institute</sponsor>
      <summary>The premier algorithmic problem-solving contest for university students.</summary>
      <type>competition</type>
      <deliveryMode>onsite</deliveryMode>
      <venue>San Jose, CA</venue>
      <financials>
        <feeStatus>free</feeStatus>
        <prizes>$10,000 in regional scholarships</prizes>
      </financials>
      <difficulty>advanced</difficulty>
      <competencies>
        <skill>C++</skill>
        <skill>Algorithms</skill>
      </competencies>
      <closingDate>2026-12-15T23:59:59Z</closingDate>
      <commenceDate>2026-12-20T09:00:00Z</commenceDate>
      <conclusionDate>2026-12-20T17:00:00Z</conclusionDate>
      <registrationLink>https://demo.icpc.example.com</registrationLink>
    </entry>
  </opportunities>
</competitionFeed>`;

      const items = FeedNormalizer.parseXmlFeed(sampleXml, 'feed-c');
      expect(items.length).toBe(1);
      const item = items[0];

      expect(item.externalId).toBe('comp-xml-1');
      expect(item.title).toBe('ACM Collegiate Programming Contest');
      expect(item.organizer).toBe('Algorithm Institute');
      expect(item.format).toBe('in-person');
      expect(item.costType).toBe('free');
      expect(item.requiredSkills).toContain('C++');
      expect(item.sourceFormat).toBe('xml');
    });
  });

  // =================================================================
  // 3. ERROR HANDLING: MALFORMED XML & INVALID JSON WITHOUT CRASHING
  // =================================================================
  describe('Robust Error Handling & Fault Isolation', () => {
    test('handles malformed XML feed gracefully without crashing server', async () => {
      const malformedXml = '<unclosedTag><nested>no matching close tag</entry>';
      const report = await FeedImporter.importFeed({
        feedName: 'test-malformed-xml',
        feedType: 'xml',
        content: malformedXml
      });

      expect(report.status).toBe('failed');
      expect(report.error).toBeDefined();
      expect(report.recordsCreated).toBe(0);

      // Verify FeedImport log record was created
      const log = await FeedImport.findByPk(report.logId);
      expect(log).not.toBeNull();
      expect(log.status).toBe('failed');
    });

    test('handles invalid JSON syntax gracefully without crashing server', async () => {
      const invalidJson = '{"broken": [missing bracket, {invalid: true}';
      const report = await FeedImporter.importFeed({
        feedName: 'test-invalid-json',
        feedType: 'json',
        content: invalidJson
      });

      expect(report.status).toBe('failed');
      expect(report.error).toMatch(/Invalid JSON/i);
      expect(report.recordsCreated).toBe(0);
    });
  });

  // =================================================================
  // 4. DATA QUALITY FLAGS & CONTRADICTIONS
  // =================================================================
  describe('Quality Checks & Anomaly Detection', () => {
    test('flags missing critical fields', () => {
      const incompleteItem = {
        title: '',
        organizer: '',
        description: 'Too short',
        deadline: null,
        applicationUrl: '',
        sourceUrl: ''
      };

      const quality = FeedNormalizer.evaluateDataQuality(incompleteItem);
      expect(quality.hasCriticalMissing).toBe(true);
      expect(quality.flags).toContain('missing_title');
      expect(quality.flags).toContain('missing_organization');
      expect(quality.flags).toContain('missing_or_short_description');
      expect(quality.flags).toContain('missing_deadline');
      expect(quality.flags).toContain('missing_application_url');
      expect(quality.status).toBe('flagged');
    });

    test('flags expired events when deadline is in the past', () => {
      const pastItem = {
        title: 'Past Summer Lab',
        organizer: 'National Lab',
        description: 'Complete description exceeding length threshold.',
        deadline: '2025-01-01T00:00:00Z',
        applicationUrl: 'https://example.com/apply',
        sourceUrl: 'https://example.com'
      };

      const quality = FeedNormalizer.evaluateDataQuality(pastItem, new Date('2026-10-24T00:00:00Z'));
      expect(quality.isExpired).toBe(true);
      expect(quality.status).toBe('expired');
      expect(quality.flags).toContain('deadline_passed');
    });

    test('flags contradictory dates (deadline after start date)', () => {
      const contradictoryItem = {
        title: 'Timeline Error Challenge',
        organizer: 'Tech Org',
        description: 'Detailed description for testing contradiction detection.',
        deadline: '2026-12-25T00:00:00Z',
        startDate: '2026-12-10T00:00:00Z',
        applicationUrl: 'https://example.com/apply',
        sourceUrl: 'https://example.com'
      };

      const quality = FeedNormalizer.evaluateDataQuality(contradictoryItem, new Date('2026-10-24T00:00:00Z'));
      expect(quality.flags).toContain('contradictory_dates_deadline_after_start');
    });

    test('flags inconsistent cost (free with cost amount > 0)', () => {
      const inconsistentCostItem = {
        title: 'Pricing Error Hackathon',
        organizer: 'Tech Org',
        description: 'Detailed description for cost validation.',
        deadline: '2026-12-25T00:00:00Z',
        applicationUrl: 'https://example.com/apply',
        sourceUrl: 'https://example.com',
        costType: 'free',
        costAmount: 50.00 // Contradiction: free but has cost amount
      };

      const quality = FeedNormalizer.evaluateDataQuality(inconsistentCostItem);
      expect(quality.flags).toContain('inconsistent_cost_free_with_amount');
    });
  });

  // =================================================================
  // 5. DUPLICATE DETECTION & SIMILARITY REVIEW QUEUE
  // =================================================================
  describe('Duplicate Detection & Similarity Review Queue', () => {
    test('exact duplicate matches are detected and linked via fingerprint', async () => {
      const feedPayload = JSON.stringify({
        items: [
          {
            id: 'dup-orig-01',
            title: 'Global Quantum Algorithms Sprint 2026',
            organization: 'Quantum Institute',
            description: 'Comprehensive quantum algorithm development sprint.',
            deadline: '2026-12-01T00:00:00Z',
            startDate: '2026-12-05T00:00:00Z',
            applyUrl: 'https://quantum.example.com/apply'
          },
          {
            id: 'dup-copy-02',
            title: 'global quantum algorithms sprint 2026', // same title (case insensitive)
            organization: 'quantum institute',              // same organizer
            description: 'Duplicate listing of the quantum algorithm sprint.',
            deadline: '2026-12-01T00:00:00Z',
            startDate: '2026-12-05T00:00:00Z',              // same start date
            applyUrl: 'https://quantum.example.com/apply'
          }
        ]
      });

      const report = await FeedImporter.importFeed({
        feedName: 'test-dup-feed',
        feedType: 'json',
        content: feedPayload
      });

      expect(report.recordsSeen).toBe(2);
      expect(report.recordsCreated).toBe(2);
      expect(report.duplicatesDetected).toBe(1);

      const copyRecord = await Opportunity.findOne({ where: { sourceRecordId: 'dup-copy-02' } });
      expect(copyRecord.isDuplicate).toBe(true);
      expect(copyRecord.duplicateOfId).toBeDefined();
    });

    test('uncertain matches with high title similarity are sent to review queue without destructive merge', async () => {
      // Create existing verified opportunity
      const existingOpp = await Opportunity.create({
        title: 'Stanford Machine Learning Deep Dive Symposium',
        organizer: 'Stanford AI Lab',
        description: 'Premier symposium covering machine learning architectures and scaling.',
        category: 'workshop',
        eventType: 'workshop',
        applicationUrl: 'https://stanford.example.edu/symposium',
        normalizedFingerprint: 'stanford-ml-symposium-unique-fp',
        status: 'active'
      });

      // Ingest uncertain match candidate (similar title, different organizer / no date match)
      const uncertainFeed = JSON.stringify({
        items: [
          {
            id: 'uncertain-cand-01',
            title: 'Stanford Machine Learning Deep Dive Workshop', // High similarity, slight title variation
            organization: 'Independent Student Guild',             // Different organizer
            description: 'Review candidate for machine learning symposium.',
            deadline: '2026-12-20T00:00:00Z',
            applyUrl: 'https://guild.example.com/ml-workshop'
          }
        ]
      });

      const report = await FeedImporter.importFeed({
        feedName: 'test-uncertain-similarity',
        feedType: 'json',
        content: uncertainFeed
      });

      expect(report.uncertainDuplicatesFlagged).toBeGreaterThan(0);

      const candidate = await Opportunity.findOne({ where: { sourceRecordId: 'uncertain-cand-01' } });
      expect(candidate).not.toBeNull();
      // Routed to review queue rather than destructively merged!
      expect(candidate.status).toBe('flagged');
      expect(candidate.dataQualityFlags).toContain('uncertain_duplicate_similarity');
    });
  });

  // =================================================================
  // 6. IDEMPOTENT IMPORTS & CHANGE TRACKING (OPPORTUNITY UPDATE NOTICES)
  // =================================================================
  describe('Idempotent Ingestion & Change Detection', () => {
    test('re-importing the same feed does not duplicate records and tracks meaningful changes', async () => {
      // 1. Initial import
      const feedV1 = JSON.stringify({
        items: [
          {
            id: 'idempotent-item-1',
            title: 'National Cybersecurity Collegiate Defence',
            organization: 'Cyber Defence League',
            description: 'Annual defense tournament with blue team defense scenarios.',
            deadline: '2026-11-20T23:59:59Z',
            startDate: '2026-11-25T09:00:00Z',
            format: 'virtual',
            cost: 'free',
            applyUrl: 'https://cyberleague.example.org/v1'
          }
        ]
      });

      const report1 = await FeedImporter.importFeed({
        feedName: 'idempotent-test-feed',
        feedType: 'json',
        content: feedV1
      });

      expect(report1.recordsCreated).toBe(1);
      expect(report1.recordsUpdated).toBe(0);

      const oppInitial = await Opportunity.findOne({ where: { sourceRecordId: 'idempotent-item-1' } });
      expect(oppInitial).not.toBeNull();
      const initialId = oppInitial.id;

      // 2. Re-import with meaningful change (Extended deadline and updated applyUrl)
      const feedV2 = JSON.stringify({
        items: [
          {
            id: 'idempotent-item-1', // SAME ID
            title: 'National Cybersecurity Collegiate Defence',
            organization: 'Cyber Defence League',
            description: 'Annual defense tournament with blue team defense scenarios.',
            deadline: '2026-12-10T23:59:59Z', // EXTENDED DEADLINE
            startDate: '2026-11-25T09:00:00Z',
            format: 'in_person',              // FORMAT CHANGED
            cost: 'free',
            applyUrl: 'https://cyberleague.example.org/v2-updated' // UPDATED URL
          }
        ]
      });

      const report2 = await FeedImporter.importFeed({
        feedName: 'idempotent-test-feed',
        feedType: 'json',
        content: feedV2
      });

      // IDEMPOTENCY ASSERTION:
      expect(report2.recordsCreated).toBe(0); // ZERO duplicates created!
      expect(report2.recordsUpdated).toBe(1); // Exactly 1 record updated!

      // Verify the record ID is unchanged
      const oppUpdated = await Opportunity.findOne({ where: { sourceRecordId: 'idempotent-item-1' } });
      expect(oppUpdated.id).toBe(initialId);
      expect(oppUpdated.format).toBe('in-person');

      // Verify OpportunityUpdate notice was recorded
      const updates = await OpportunityUpdate.findAll({ where: { opportunityId: initialId } });
      expect(updates.length).toBeGreaterThan(0);
      expect(updates.some(u => u.updateType === 'deadline_extended')).toBe(true);
      expect(updates.some(u => u.updateType === 'format_changed')).toBe(true);
    });
  });

  // =================================================================
  // 7. EVENT EMITTER LIFECYCLE
  // =================================================================
  describe('EventEmitter Lifecycle Events', () => {
    test('emits import:started and import:completed events', async () => {
      let startedEmitted = false;
      let completedEmitted = false;

      const startedHandler = (data) => {
        if (data.feedName === 'events-test-feed') startedEmitted = true;
      };
      const completedHandler = (data) => {
        if (data.feedName === 'events-test-feed') completedEmitted = true;
      };

      importEvents.on('import:started', startedHandler);
      importEvents.on('import:completed', completedHandler);

      await FeedImporter.importFeed({
        feedName: 'events-test-feed',
        feedType: 'json',
        content: JSON.stringify({
          items: [
            {
              id: 'event-item-1',
              title: 'Event Driven Architecture Workshop',
              organization: 'Event Institute',
              description: 'Hands on Kafka and RabbitMQ workshop for student engineers.',
              deadline: '2026-12-01T00:00:00Z',
              applyUrl: 'https://events.example.com/apply'
            }
          ]
        })
      });

      importEvents.removeListener('import:started', startedHandler);
      importEvents.removeListener('import:completed', completedHandler);

      expect(startedEmitted).toBe(true);
      expect(completedEmitted).toBe(true);
    });
  });
});
