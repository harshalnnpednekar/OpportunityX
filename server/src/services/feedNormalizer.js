const { XMLParser } = require('fast-xml-parser');

class FeedNormalizer {
  /**
   * Generates a deterministic deduplication fingerprint
   */
  static generateFingerprint(title, organization) {
    const cleanTitle = (title || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const cleanOrg = (organization || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return `${cleanOrg}_${cleanTitle}`;
  }

  /**
   * Generates a slug from title
   */
  static generateSlug(title, externalId) {
    const baseSlug = (title || 'opp')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${baseSlug}-${externalId}`.substring(0, 100);
  }

  /**
   * Normalizes an array of skills or tags
   */
  static normalizeArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    if (typeof val === 'object') {
      if (val.skill) {
        return Array.isArray(val.skill) ? val.skill.map(s => String(s).trim()) : [String(val.skill).trim()];
      }
      if (val.level) {
        return Array.isArray(val.level) ? val.level.map(s => String(s).trim()) : [String(val.level).trim()];
      }
      if (val.region) {
        return Array.isArray(val.region) ? val.region.map(s => String(s).trim()) : [String(val.region).trim()];
      }
    }
    return [];
  }

  /**
   * Performs data quality checks on normalized record
   */
  static evaluateDataQuality(item, referenceDate = new Date()) {
    const flags = [];
    const missingFields = [];
    const contradictionFlags = [];
    let isExpired = false;
    let hasCriticalMissing = false;

    const organizer = item.organizer || item.organization;
    const deadline = item.deadline || item.applicationDeadline;
    const startDate = item.startDate || item.eventStartDate;
    const endDate = item.endDate || item.eventEndDate;

    // 1. Missing critical fields
    if (!item.title || item.title.trim().length === 0) {
      missingFields.push('missing_title');
      flags.push('missing_title');
      hasCriticalMissing = true;
    }
    if (!organizer || organizer.trim().length === 0) {
      missingFields.push('missing_organizer');
      flags.push('missing_organization');
      hasCriticalMissing = true;
    }
    if (!item.description || item.description.trim().length < 10) {
      missingFields.push('missing_or_short_description');
      flags.push('missing_or_short_description');
      hasCriticalMissing = true;
    }
    if (!deadline) {
      missingFields.push('missing_deadline');
      flags.push('missing_deadline');
      hasCriticalMissing = true;
    }
    if (!item.applicationUrl || item.applicationUrl.trim().length === 0) {
      missingFields.push('missing_application_url');
      flags.push('missing_application_url');
      hasCriticalMissing = true;
    }

    // 2. Expired record check
    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        flags.push('invalid_deadline_format');
        contradictionFlags.push('invalid_deadline_format');
      } else if (deadlineDate < referenceDate) {
        flags.push('deadline_passed');
        isExpired = true;
      }
    }

    // 3. Contradictory dates check
    if (deadline && startDate) {
      const deadlineDate = new Date(deadline);
      const start = new Date(startDate);
      if (!isNaN(deadlineDate.getTime()) && !isNaN(start.getTime())) {
        if (deadlineDate > start) {
          flags.push('contradictory_dates_deadline_after_start');
          contradictionFlags.push('contradictory_dates_deadline_after_start');
        }
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (start > end) {
          flags.push('contradictory_dates_start_after_end');
          contradictionFlags.push('contradictory_dates_start_after_end');
        }
      }
    }

    // 4. Contradictory age limits
    if (item.minAge && item.maxAge && item.minAge > item.maxAge) {
      flags.push('contradictory_age_range');
      contradictionFlags.push('contradictory_age_range');
    }

    // 5. Missing skills
    if (!item.requiredSkills || item.requiredSkills.length === 0) {
      missingFields.push('missing_skills');
      flags.push('missing_skills');
    }

    // Compute trust score (0 - 100)
    let trustScore = 100;
    trustScore -= missingFields.length * 15;
    trustScore -= contradictionFlags.length * 20;
    if (isExpired) trustScore -= 25;
    if (trustScore < 10) trustScore = 10;

    return {
      flags,
      missingFields,
      contradictionFlags,
      trustScore,
      isExpired,
      hasCriticalMissing,
      status: isExpired ? 'expired' : (hasCriticalMissing ? 'flagged' : 'active')
    };
  }

  /**
   * Parses raw XML feed into unified opportunity objects
   */
  static parseXmlFeed(xmlString, feedName = 'competitions-xml') {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });

    const parsed = parser.parse(xmlString);
    const feed = parsed.competitionFeed || parsed.feed || parsed.root;
    if (!feed) {
      throw new Error('Invalid XML feed: missing root element');
    }

    const rawEntries = feed.opportunities?.entry || feed.entry || [];
    const entries = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

    return entries.map((entry, idx) => {
      const extId = entry.externalId || entry.id || `xml-${idx + 1}`;
      const title = entry.name || entry.title || 'Untitled Competition';
      const organizer = entry.sponsor || entry.organization || 'Independent Organizer';
      const description = entry.summary || entry.description || '';
      const eventType = entry.type || 'competition';
      const format = entry.deliveryMode || entry.format || 'virtual';
      const location = entry.venue || entry.location || 'Online';
      
      const financials = entry.financials || {};
      const costType = financials.feeStatus || entry.cost || 'free';
      const prizePool = financials.prizes || entry.prizePool || '';
      const stipendAmount = financials.grant || entry.stipend || '';

      const difficulty = entry.difficulty || 'all';
      const skills = FeedNormalizer.normalizeArray(entry.competencies || entry.skills);

      const admission = entry.admissionRules || {};
      const eligibleEducationLevels = FeedNormalizer.normalizeArray(admission.targetLevels || entry.education);
      const eligibleCountries = FeedNormalizer.normalizeArray(admission.eligibleRegions || entry.countries);
      const minAge = admission.minAgeYears ? parseInt(admission.minAgeYears, 10) : null;
      const maxAge = admission.maxAgeYears ? parseInt(admission.maxAgeYears, 10) : null;

      const deadline = entry.closingDate || entry.deadline || null;
      const startDate = entry.commenceDate || entry.startDate || null;
      const endDate = entry.conclusionDate || entry.endDate || null;
      const applicationUrl = entry.registrationLink || entry.applyUrl || '';

      const teamMin = entry.teamMin ? parseInt(entry.teamMin, 10) : 1;
      const teamMax = entry.teamMax ? parseInt(entry.teamMax, 10) : (eventType === 'competition' ? 3 : 4);
      const costAmount = costType === 'paid_entry' ? 35.00 : 0.00;
      const theme = entry.theme || 'Competitive Algorithmic Science';
      const fp = FeedNormalizer.generateFingerprint(title, organizer);

      const item = {
        title,
        organizer,
        organization: organizer,
        description,
        category: eventType,
        eventType,
        opportunityType: eventType,
        theme,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        eventStartDate: startDate ? new Date(startDate) : null,
        eventEndDate: endDate ? new Date(endDate) : null,
        applicationDeadline: deadline ? new Date(deadline) : null,
        format,
        location,
        costAmount,
        currency: 'USD',
        teamMin,
        teamMax,
        eligibilityText: entry.eligibilityText || 'Open to qualified collegiate students.',
        requiredSkills: skills.length > 0 ? skills : ['General'],
        beginnerFriendly: difficulty === 'beginner' || difficulty === 'all',
        sustainabilityFocused: Boolean(title.toLowerCase().includes('climate') || description.toLowerCase().includes('sustainability')),
        sourceName: feedName,
        sourceFeed: feedName,
        sourceUrl: 'https://demo.feed.example.edu/competitions.xml',
        applicationUrl,
        sourceRecordId: String(extId),
        externalId: String(extId),
        lastVerifiedAt: new Date(),
        normalizedFingerprint: fp,
        fingerprint: fp,
        slug: FeedNormalizer.generateSlug(title, extId),
        costType,
        stipendAmount,
        prizePool,
        experienceLevel: difficulty,
        eligibleEducationLevels: eligibleEducationLevels.length > 0 ? eligibleEducationLevels : ['all'],
        eligibleCountries: eligibleCountries.length > 0 ? eligibleCountries : ['Global'],
        minAge,
        maxAge,
        sourceFormat: 'xml',
        isDemo: true,
        demoDisclaimer: 'DEMO LISTING: Curated demonstration entry for architectural modeling. Not a live-verified registration portal.'
      };

      const quality = FeedNormalizer.evaluateDataQuality(item);
      item.dataQualityFlags = quality.flags;
      item.missingFields = quality.missingFields;
      item.contradictionFlags = quality.contradictionFlags;
      item.trustScore = quality.trustScore;
      item.status = quality.status;

      return item;
    });
  }

  /**
   * Parses standard JSON feed into unified opportunity objects
   */
  static parseJsonFeed(jsonContent, feedName = 'json-feed') {
    const data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    const items = data.items || data.opportunities || (Array.isArray(data) ? data : []);

    return items.map((raw, idx) => {
      const extId = raw.id || raw.externalId || `json-${idx + 1}`;
      const title = raw.title || raw.name || 'Untitled Opportunity';
      const organizer = raw.organization || raw.sponsor || 'Independent Organizer';
      const description = raw.description || raw.summary || '';
      const eventType = raw.category || raw.type || raw.opportunityType || 'hackathon';
      const format = raw.format || raw.deliveryMode || 'virtual';
      const location = raw.location || raw.venue || 'Online';
      const costType = raw.cost || raw.costType || 'free';
      const prizePool = raw.prizePool || raw.prizes || '';
      const stipendAmount = raw.stipend || raw.grant || '';
      const experienceLevel = raw.experienceLevel || raw.difficulty || 'all';

      const skills = FeedNormalizer.normalizeArray(raw.skills || raw.competencies);
      const eligibility = raw.eligibility || {};
      const eligibleEducationLevels = FeedNormalizer.normalizeArray(eligibility.education || raw.eligibleEducationLevels);
      const eligibleCountries = FeedNormalizer.normalizeArray(eligibility.countries || raw.eligibleCountries);
      const minAge = eligibility.minAge !== undefined ? parseInt(eligibility.minAge, 10) : null;
      const maxAge = eligibility.maxAge !== undefined ? parseInt(eligibility.maxAge, 10) : null;

      const deadline = raw.deadline || raw.closingDate || raw.applicationDeadline || null;
      const startDate = raw.startDate || raw.commenceDate || raw.eventStartDate || null;
      const endDate = raw.endDate || raw.conclusionDate || raw.eventEndDate || null;
      const applicationUrl = raw.applyUrl || raw.registrationLink || raw.applicationUrl || '';

      const teamMin = raw.teamMin ? parseInt(raw.teamMin, 10) : 1;
      const teamMax = raw.teamMax ? parseInt(raw.teamMax, 10) : (eventType === 'workshop' ? 1 : 4);
      const costAmount = raw.costAmount !== undefined ? parseFloat(raw.costAmount) : (costType === 'free' ? 0.00 : 25.00);
      const theme = raw.theme || (title.toLowerCase().includes('climate') ? 'Climate & Cleantech' : 'Artificial Intelligence');
      const fp = FeedNormalizer.generateFingerprint(title, organizer);

      const item = {
        title,
        organizer,
        organization: organizer,
        description,
        category: raw.category || eventType,
        eventType,
        opportunityType: eventType,
        theme,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        eventStartDate: startDate ? new Date(startDate) : null,
        eventEndDate: endDate ? new Date(endDate) : null,
        applicationDeadline: deadline ? new Date(deadline) : null,
        format,
        location,
        costAmount,
        currency: raw.currency || 'USD',
        teamMin,
        teamMax,
        eligibilityText: raw.eligibilityText || 'Open to all registered university students worldwide.',
        requiredSkills: skills.length > 0 ? skills : ['General'],
        beginnerFriendly: experienceLevel === 'beginner' || experienceLevel === 'all',
        sustainabilityFocused: Boolean(title.toLowerCase().includes('climate') || description.toLowerCase().includes('sustainability')),
        sourceName: feedName,
        sourceFeed: feedName,
        sourceUrl: `https://demo.feed.example.edu/${feedName}.json`,
        applicationUrl,
        sourceRecordId: String(extId),
        externalId: String(extId),
        lastVerifiedAt: new Date(),
        normalizedFingerprint: fp,
        fingerprint: fp,
        slug: FeedNormalizer.generateSlug(title, extId),
        costType,
        stipendAmount,
        prizePool,
        experienceLevel,
        eligibleEducationLevels: eligibleEducationLevels.length > 0 ? eligibleEducationLevels : ['all'],
        eligibleCountries: eligibleCountries.length > 0 ? eligibleCountries : ['Global'],
        minAge,
        maxAge,
        sourceFormat: 'json',
        isDemo: true,
        demoDisclaimer: 'DEMO LISTING: Curated demonstration entry for architectural modeling. Not a live-verified registration portal.'
      };

      const quality = FeedNormalizer.evaluateDataQuality(item);
      item.dataQualityFlags = quality.flags;
      item.missingFields = quality.missingFields;
      item.contradictionFlags = quality.contradictionFlags;
      item.trustScore = quality.trustScore;
      item.status = quality.status;

      return item;
    });
  }
}

module.exports = FeedNormalizer;
