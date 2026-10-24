const FeedNormalizer = require('../src/services/feedNormalizer');

describe('FeedNormalizer and Data Quality', () => {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<competitionFeed version="1.0">
  <opportunities>
    <entry>
      <externalId>test-xml-01</externalId>
      <name>Global Algorithmic Cup</name>
      <sponsor>Algorithm Institute</sponsor>
      <summary>A competitive programming contest for collegiate problem solvers worldwide.</summary>
      <type>competition</type>
      <deliveryMode>virtual</deliveryMode>
      <venue>Online</venue>
      <financials>
        <feeStatus>free</feeStatus>
        <prizes>$10,000</prizes>
      </financials>
      <difficulty>advanced</difficulty>
      <competencies>
        <skill>C++</skill>
        <skill>Algorithms</skill>
      </competencies>
      <admissionRules>
        <targetLevels>
          <level>undergraduate</level>
        </targetLevels>
        <eligibleRegions>
          <region>Global</region>
        </eligibleRegions>
      </admissionRules>
      <closingDate>2026-12-15T23:59:59Z</closingDate>
      <registrationLink>https://demo.algorithmcup.example.com</registrationLink>
    </entry>
  </opportunities>
</competitionFeed>`;

  test('should parse XML feed into standardized opportunity schema', () => {
    const items = FeedNormalizer.parseXmlFeed(sampleXml, 'test-xml');
    expect(items.length).toBe(1);
    const item = items[0];
    expect(item.externalId).toBe('test-xml-01');
    expect(item.title).toBe('Global Algorithmic Cup');
    expect(item.organization).toBe('Algorithm Institute');
    expect(item.opportunityType).toBe('competition');
    expect(item.format).toBe('virtual');
    expect(item.requiredSkills).toContain('C++');
    expect(item.sourceFormat).toBe('xml');
    expect(item.isDemo).toBe(true);
  });

  test('should flag expired opportunities when deadline is in the past', () => {
    const pastItem = {
      title: 'Past Event',
      organization: 'Past Org',
      description: 'Detailed description that meets the length threshold.',
      applicationDeadline: '2025-01-01T00:00:00Z',
      applicationUrl: 'https://example.com'
    };

    const evaluation = FeedNormalizer.evaluateDataQuality(pastItem, new Date('2026-10-24T00:00:00Z'));
    expect(evaluation.isExpired).toBe(true);
    expect(evaluation.status).toBe('expired');
    expect(evaluation.flags).toContain('deadline_passed');
  });

  test('should flag contradictory dates if deadline is after start date', () => {
    const contradictoryItem = {
      title: 'Bad Date Event',
      organization: 'Org',
      description: 'Detailed description that meets the length threshold.',
      applicationDeadline: '2026-12-30T00:00:00Z',
      eventStartDate: '2026-12-01T00:00:00Z',
      applicationUrl: 'https://example.com'
    };

    const evaluation = FeedNormalizer.evaluateDataQuality(contradictoryItem, new Date('2026-10-24T00:00:00Z'));
    expect(evaluation.flags).toContain('contradictory_dates_deadline_after_start');
  });

  test('should generate consistent deduplication fingerprints', () => {
    const fp1 = FeedNormalizer.generateFingerprint('CalHacks AI & Climate Challenge 2026', 'UC Berkeley');
    const fp2 = FeedNormalizer.generateFingerprint('calhacks ai & climate challenge 2026', 'uc berkeley');
    expect(fp1).toBe(fp2);
  });
});
