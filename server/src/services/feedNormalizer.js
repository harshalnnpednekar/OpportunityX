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
      // Handles XML parser returning { skill: [...] } or { skill: "C++" }
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
    let isExpired = false;
    let hasCriticalMissing = false;

    // 1. Missing critical fields
    if (!item.title || item.title.trim().length === 0) {
      flags.push('missing_title');
      hasCriticalMissing = true;
    }
    if (!item.organization || item.organization.trim().length === 0) {
      flags.push('missing_organization');
      hasCriticalMissing = true;
    }
    if (!item.description || item.description.trim().length < 10) {
      flags.push('missing_or_short_description');
      hasCriticalMissing = true;
    }
    if (!item.applicationDeadline) {
      flags.push('missing_deadline');
      hasCriticalMissing = true;
    }
    if (!item.applicationUrl || item.applicationUrl.trim().length === 0) {
      flags.push('missing_application_url');
      hasCriticalMissing = true;
    }

    // 2. Expired record check
    if (item.applicationDeadline) {
      const deadlineDate = new Date(item.applicationDeadline);
      if (isNaN(deadlineDate.getTime())) {
        flags.push('invalid_deadline_format');
      } else if (deadlineDate < referenceDate) {
        flags.push('deadline_passed');
        isExpired = true;
      }
    }

    // 3. Contradictory dates check (e.g. deadline after start date)
    if (item.applicationDeadline && item.eventStartDate) {
      const deadlineDate = new Date(item.applicationDeadline);
      const startDate = new Date(item.eventStartDate);
      if (!isNaN(deadlineDate.getTime()) && !isNaN(startDate.getTime())) {
        if (deadlineDate > startDate) {
          flags.push('contradictory_dates_deadline_after_start');
        }
      }
    }

    // 4. Contradictory age limits
    if (item.minAge && item.maxAge && item.minAge > item.maxAge) {
      flags.push('contradictory_age_range');
    }

    // 5. Missing skills or categorization
    if (!item.requiredSkills || item.requiredSkills.length === 0) {
      flags.push('missing_skills');
    }

    return {
      flags,
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
      const organization = entry.sponsor || entry.organization || 'Independent Organizer';
      const description = entry.summary || entry.description || '';
      const opportunityType = entry.type || 'competition';
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

      const applicationDeadline = entry.closingDate || entry.deadline || null;
      const eventStartDate = entry.commenceDate || entry.startDate || null;
      const eventEndDate = entry.conclusionDate || entry.endDate || null;
      const applicationUrl = entry.registrationLink || entry.applyUrl || '';

      const item = {
        externalId: String(extId),
        fingerprint: FeedNormalizer.generateFingerprint(title, organization),
        title,
        slug: FeedNormalizer.generateSlug(title, extId),
        organization,
        description,
        opportunityType,
        format,
        location,
        costType,
        stipendAmount,
        prizePool,
        experienceLevel: difficulty,
        requiredSkills: skills.length > 0 ? skills : ['General'],
        eligibleEducationLevels: eligibleEducationLevels.length > 0 ? eligibleEducationLevels : ['all'],
        eligibleCountries: eligibleCountries.length > 0 ? eligibleCountries : ['Global'],
        minAge,
        maxAge,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        eventStartDate: eventStartDate ? new Date(eventStartDate) : null,
        eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
        applicationUrl,
        sourceFeed: feedName,
        sourceFormat: 'xml',
        isDemo: true,
        demoDisclaimer: 'DEMO LISTING: Curated demonstration entry for architectural modeling. Not a live-verified registration portal.'
      };

      const quality = FeedNormalizer.evaluateDataQuality(item);
      item.dataQualityFlags = quality.flags;
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
      const organization = raw.organization || raw.sponsor || 'Independent Organizer';
      const description = raw.description || raw.summary || '';
      const opportunityType = raw.category || raw.type || raw.opportunityType || 'hackathon';
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

      const applicationDeadline = raw.deadline || raw.closingDate || raw.applicationDeadline || null;
      const eventStartDate = raw.startDate || raw.commenceDate || raw.eventStartDate || null;
      const eventEndDate = raw.endDate || raw.conclusionDate || raw.eventEndDate || null;
      const applicationUrl = raw.applyUrl || raw.registrationLink || raw.applicationUrl || '';

      const item = {
        externalId: String(extId),
        fingerprint: FeedNormalizer.generateFingerprint(title, organization),
        title,
        slug: FeedNormalizer.generateSlug(title, extId),
        organization,
        description,
        opportunityType,
        format,
        location,
        costType,
        stipendAmount,
        prizePool,
        experienceLevel,
        requiredSkills: skills.length > 0 ? skills : ['General'],
        eligibleEducationLevels: eligibleEducationLevels.length > 0 ? eligibleEducationLevels : ['all'],
        eligibleCountries: eligibleCountries.length > 0 ? eligibleCountries : ['Global'],
        minAge,
        maxAge,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        eventStartDate: eventStartDate ? new Date(eventStartDate) : null,
        eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
        applicationUrl,
        sourceFeed: feedName,
        sourceFormat: 'json',
        isDemo: true,
        demoDisclaimer: 'DEMO LISTING: Curated demonstration entry for architectural modeling. Not a live-verified registration portal.'
      };

      const quality = FeedNormalizer.evaluateDataQuality(item);
      item.dataQualityFlags = quality.flags;
      item.status = quality.status;

      return item;
    });
  }
}

module.exports = FeedNormalizer;
