const { XMLParser } = require('fast-xml-parser');

class FeedNormalizer {
  /**
   * Safe XML parser configuration:
   * Disallows external entity expansion, DTD entity processing, and script execution.
   */
  static getSafeXmlParser() {
    return new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      processEntities: false, // Prevents XML External Entity (XXE) expansion
      allowBooleanAttributes: false,
      trimValues: true,
      parseTagValue: true,
      parseAttributeValue: false
    });
  }

  /**
   * Normalizes whitespace: collapses multiple spaces, tabs, newlines, and trims.
   */
  static normalizeWhitespace(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/\s+/g, ' ').trim();
  }

  /**
   * Normalizes title and organizer capitalization.
   * If all uppercase or all lowercase, converts to Title Case.
   */
  static normalizeCapitalization(str) {
    const clean = FeedNormalizer.normalizeWhitespace(str);
    if (!clean) return '';
    
    // Check if fully uppercase (and has at least 3 letters) or fully lowercase
    const isAllUpper = clean === clean.toUpperCase() && /[A-Z]{3,}/.test(clean);
    const isAllLower = clean === clean.toLowerCase() && /[a-z]{3,}/.test(clean);

    if (isAllUpper || isAllLower) {
      return clean
        .toLowerCase()
        .split(' ')
        .map(word => {
          if (!word) return '';
          // Keep common small words lowercase unless at start
          const minorWords = ['and', 'or', 'for', 'the', 'in', 'on', 'at', 'to', 'of', '&'];
          if (minorWords.includes(word)) return word;
          return word
            .split('-')
            .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : '')
            .join('-');
        })
        .join(' ')
        .replace(/^([a-z])/, (match) => match.toUpperCase());
    }

    return clean;
  }

  /**
   * Normalizes event format to 'in-person', 'virtual', or 'hybrid'.
   */
  static normalizeFormat(rawFormat) {
    const clean = String(rawFormat || '').toLowerCase().trim();
    if (clean.includes('hybrid') || clean.includes('blended') || clean.includes('mixed')) {
      return 'hybrid';
    }
    if (clean.includes('virtual') || clean.includes('online') || clean.includes('remote') || clean.includes('webinar')) {
      return 'virtual';
    }
    if (clean.includes('in_person') || clean.includes('in-person') || clean.includes('onsite') || clean.includes('physical')) {
      return 'in-person';
    }
    return 'virtual';
  }

  /**
   * Normalizes dates safely into Date instances or null.
   */
  static normalizeDate(rawDate) {
    if (!rawDate) return null;
    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * Normalizes cost information.
   */
  static normalizeCost({ rawCost, rawAmount, rawCurrency, rawTuition }) {
    let costType = 'free';
    let costAmount = 0.00;
    let currency = (rawCurrency || 'USD').toUpperCase().trim();

    if (rawTuition && typeof rawTuition === 'object') {
      if (rawTuition.is_free === false || (rawTuition.fee_amount && rawTuition.fee_amount > 0)) {
        costType = 'paid_entry';
        costAmount = parseFloat(rawTuition.fee_amount) || 0.00;
      } else {
        costType = 'free';
        costAmount = 0.00;
      }
      if (rawTuition.currency) currency = rawTuition.currency.toUpperCase().trim();
    } else {
      const costStr = String(rawCost || '').toLowerCase().trim();
      if (costStr.includes('stipend') || costStr.includes('grant') || costStr.includes('allowance')) {
        costType = 'stipend_provided';
        costAmount = 0.00;
      } else if (costStr.includes('paid') || costStr.includes('fee') || (rawAmount && parseFloat(rawAmount) > 0)) {
        costType = 'paid_entry';
        costAmount = parseFloat(rawAmount) || 25.00;
      } else {
        costType = 'free';
        costAmount = 0.00;
      }
    }

    return { costType, costAmount, currency };
  }

  /**
   * Generates a deterministic deduplication fingerprint using normalized title,
   * organizer, and event date.
   */
  static generateFingerprint(title, organizer, eventDate = null) {
    const cleanTitle = (title || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const cleanOrg = (organizer || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    let dateFragment = 'nodate';
    if (eventDate) {
      const d = new Date(eventDate);
      if (!isNaN(d.getTime())) {
        dateFragment = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      }
    }

    return `${cleanOrg}_${cleanTitle}_${dateFragment}`;
  }

  /**
   * Generates a slug from title and external ID
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
    if (Array.isArray(val)) {
      return val.map(s => FeedNormalizer.normalizeWhitespace(String(s))).filter(Boolean);
    }
    if (typeof val === 'string') {
      return val.split(',').map(s => FeedNormalizer.normalizeWhitespace(s)).filter(Boolean);
    }
    if (typeof val === 'object') {
      if (val.skill) {
        return Array.isArray(val.skill)
          ? val.skill.map(s => FeedNormalizer.normalizeWhitespace(String(s))).filter(Boolean)
          : [FeedNormalizer.normalizeWhitespace(String(val.skill))];
      }
      if (val.level) {
        return Array.isArray(val.level)
          ? val.level.map(s => FeedNormalizer.normalizeWhitespace(String(s))).filter(Boolean)
          : [FeedNormalizer.normalizeWhitespace(String(val.level))];
      }
      if (val.region) {
        return Array.isArray(val.region)
          ? val.region.map(s => FeedNormalizer.normalizeWhitespace(String(s))).filter(Boolean)
          : [FeedNormalizer.normalizeWhitespace(String(val.region))];
      }
    }
    return [];
  }

  /**
   * Computes Dice / token similarity score between two normalized strings (0.0 to 1.0)
   */
  static calculateStringSimilarity(strA, strB) {
    if (!strA || !strB) return 0;
    const sA = strA.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const sB = strB.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (sA === sB) return 1.0;

    const tokensA = new Set(sA.split(/\s+/).filter(t => t.length > 2));
    const tokensB = new Set(sB.split(/\s+/).filter(t => t.length > 2));

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
    }

    return (2 * intersection) / (tokensA.size + tokensB.size);
  }

  /**
   * Evaluates record quality, flagging expired dates, missing fields,
   * contradictory dates, and cost inconsistencies.
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
    if (!item.sourceUrl || item.sourceUrl.trim().length === 0) {
      missingFields.push('missing_source_url');
      flags.push('missing_source_url');
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

    // 4. Inconsistent cost check
    if (item.costType === 'free' && item.costAmount > 0) {
      flags.push('inconsistent_cost_free_with_amount');
      contradictionFlags.push('inconsistent_cost_free_with_amount');
    }
    if (item.costType === 'paid_entry' && item.costAmount === 0) {
      flags.push('inconsistent_cost_paid_zero_amount');
      contradictionFlags.push('inconsistent_cost_paid_zero_amount');
    }

    // 5. Unclear eligibility
    if (!item.eligibilityText || item.eligibilityText.trim().length < 5) {
      missingFields.push('unclear_eligibility');
      flags.push('unclear_eligibility');
    }

    // 6. Missing skills
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
   * XML Feed Parser (Feed C: Competitions XML)
   */
  static parseXmlFeed(xmlString, feedName = 'sample-xml-a') {
    if (!xmlString || typeof xmlString !== 'string' || !xmlString.trim()) {
      throw new Error('Malformed or empty XML feed provided');
    }

    const parser = FeedNormalizer.getSafeXmlParser();
    let parsed;
    try {
      parsed = parser.parse(xmlString);
    } catch (parseErr) {
      throw new Error(`XML Parsing Error: ${parseErr.message}`);
    }

    const feed = parsed.competitionFeed || parsed.feed || parsed.root;
    if (!feed) {
      throw new Error('Invalid XML feed structure: missing <competitionFeed> or <feed> root element');
    }

    const rawEntries = feed.opportunities?.entry || feed.entry || [];
    const entries = Array.isArray(rawEntries) ? rawEntries : (rawEntries ? [rawEntries] : []);

    return entries.map((entry, idx) => {
      const extId = String(entry.externalId || entry.id || `xml-${idx + 1}`).trim();
      const title = FeedNormalizer.normalizeCapitalization(entry.name || entry.title || '');
      const organizer = FeedNormalizer.normalizeCapitalization(entry.sponsor || entry.organization || '');
      const description = FeedNormalizer.normalizeWhitespace(entry.summary || entry.description || '');
      const eventType = String(entry.type || 'competition').toLowerCase().trim();
      const format = FeedNormalizer.normalizeFormat(entry.deliveryMode || entry.format);
      const location = FeedNormalizer.normalizeWhitespace(entry.venue || entry.location || 'Online');

      const financials = entry.financials || {};
      const { costType, costAmount, currency } = FeedNormalizer.normalizeCost({
        rawCost: financials.feeStatus || entry.cost,
        rawAmount: financials.feeStatus === 'paid_entry' ? 35.00 : 0.00
      });

      const prizePool = FeedNormalizer.normalizeWhitespace(financials.prizes || entry.prizePool || '');
      const stipendAmount = FeedNormalizer.normalizeWhitespace(financials.grant || entry.stipend || '');
      const difficulty = String(entry.difficulty || 'all').toLowerCase().trim();
      const skills = FeedNormalizer.normalizeArray(entry.competencies || entry.skills);

      const admission = entry.admissionRules || {};
      const eligibleEducationLevels = FeedNormalizer.normalizeArray(admission.targetLevels || entry.education);
      const eligibleCountries = FeedNormalizer.normalizeArray(admission.eligibleRegions || entry.countries);
      const minAge = admission.minAgeYears ? parseInt(admission.minAgeYears, 10) : null;
      const maxAge = admission.maxAgeYears ? parseInt(admission.maxAgeYears, 10) : null;

      const deadline = FeedNormalizer.normalizeDate(entry.closingDate || entry.deadline);
      const startDate = FeedNormalizer.normalizeDate(entry.commenceDate || entry.startDate);
      const endDate = FeedNormalizer.normalizeDate(entry.conclusionDate || entry.endDate);
      const applicationUrl = FeedNormalizer.normalizeWhitespace(entry.registrationLink || entry.applyUrl || '');
      const sourceUrl = 'https://demo.feed.example.edu/competitions.xml';

      const teamMin = entry.teamMin ? parseInt(entry.teamMin, 10) : 1;
      const teamMax = entry.teamMax ? parseInt(entry.teamMax, 10) : 3;
      const fp = FeedNormalizer.generateFingerprint(title, organizer, startDate);

      const item = {
        title,
        organizer,
        organization: organizer,
        description,
        category: eventType,
        eventType,
        opportunityType: eventType,
        theme: FeedNormalizer.normalizeWhitespace(entry.theme || 'Competitive Algorithmic Science'),
        startDate,
        endDate,
        deadline,
        eventStartDate: startDate,
        eventEndDate: endDate,
        applicationDeadline: deadline,
        format,
        location,
        costAmount,
        currency,
        teamMin,
        teamMax,
        eligibilityText: FeedNormalizer.normalizeWhitespace(entry.eligibilityText || 'Open to qualified collegiate students.'),
        requiredSkills: skills.length > 0 ? skills : ['General'],
        beginnerFriendly: difficulty === 'beginner' || difficulty === 'all',
        sustainabilityFocused: Boolean(title.toLowerCase().includes('climate') || description.toLowerCase().includes('sustainability')),
        sourceName: feedName,
        sourceFeed: feedName,
        sourceUrl,
        applicationUrl,
        sourceRecordId: extId,
        externalId: extId,
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
   * JSON Feed Parser: handles both JSON Feed A (Hackathons) and JSON Feed B (Workshops registry)
   */
  static parseJsonFeed(jsonContent, feedName = 'sample-json-a') {
    if (!jsonContent) {
      throw new Error('Malformed or empty JSON feed provided');
    }

    let data;
    try {
      data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    } catch (parseErr) {
      throw new Error(`Invalid JSON syntax: ${parseErr.message}`);
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid JSON feed: payload root must be an object or array');
    }

    // Determine if this is Feed B (workshop_registry) or Feed A (items)
    const isFeedB = Boolean(data.workshop_registry);
    const items = data.workshop_registry || data.items || data.opportunities || (Array.isArray(data) ? data : []);

    return items.map((raw, idx) => {
      if (isFeedB) {
        // ==========================================
        // PARSE JSON FEED B (Distinct Workshops Schema)
        // ==========================================
        const extId = String(raw.workshop_code || `work-${idx + 1}`).trim();
        const title = FeedNormalizer.normalizeCapitalization(raw.event_name || '');
        const organizer = FeedNormalizer.normalizeCapitalization(raw.host_institution || '');
        const description = FeedNormalizer.normalizeWhitespace(raw.synopsis || '');
        const eventType = String(raw.track_type || 'workshop').toLowerCase().trim();
        const format = FeedNormalizer.normalizeFormat(raw.delivery_mode);
        const location = FeedNormalizer.normalizeWhitespace(raw.venue_location || 'Online');

        const { costType, costAmount, currency } = FeedNormalizer.normalizeCost({
          rawTuition: raw.tuition_pricing
        });

        const prizePool = FeedNormalizer.normalizeWhitespace(raw.award_or_fellowship || '');
        const stipendAmount = FeedNormalizer.normalizeWhitespace(raw.financial_grant || '');
        const experienceLevel = String(raw.difficulty_rating || 'all').toLowerCase().trim();
        const skills = FeedNormalizer.normalizeArray(raw.core_competencies);

        const admission = raw.admission_prerequisites || {};
        const eligibleEducationLevels = FeedNormalizer.normalizeArray(admission.academic_levels);
        const eligibleCountries = FeedNormalizer.normalizeArray(admission.geographic_scope);
        const minAge = admission.age_minimum ? parseInt(admission.age_minimum, 10) : null;

        const dates = raw.dates_and_deadlines || {};
        const deadline = FeedNormalizer.normalizeDate(dates.application_cutoff);
        const startDate = FeedNormalizer.normalizeDate(dates.commences_on);
        const endDate = FeedNormalizer.normalizeDate(dates.concludes_on);
        const applicationUrl = FeedNormalizer.normalizeWhitespace(raw.registration_portal_url || '');
        const sourceUrl = `https://demo.feed.example.edu/${feedName}.json`;

        const fp = FeedNormalizer.generateFingerprint(title, organizer, startDate);

        const item = {
          title,
          organizer,
          organization: organizer,
          description,
          category: eventType,
          eventType,
          opportunityType: eventType,
          theme: FeedNormalizer.normalizeWhitespace(title.toLowerCase().includes('climate') ? 'Climate & Cleantech' : 'Technology & Science'),
          startDate,
          endDate,
          deadline,
          eventStartDate: startDate,
          eventEndDate: endDate,
          applicationDeadline: deadline,
          format,
          location,
          costAmount,
          currency,
          teamMin: 1,
          teamMax: 1,
          eligibilityText: FeedNormalizer.normalizeWhitespace(raw.eligibilityText || 'Open to qualified undergraduate and graduate researchers worldwide.'),
          requiredSkills: skills.length > 0 ? skills : ['General'],
          beginnerFriendly: experienceLevel === 'beginner' || experienceLevel === 'all',
          sustainabilityFocused: Boolean(title.toLowerCase().includes('climate') || description.toLowerCase().includes('sustainability')),
          sourceName: feedName,
          sourceFeed: feedName,
          sourceUrl,
          applicationUrl,
          sourceRecordId: extId,
          externalId: extId,
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
          maxAge: null,
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
      } else {
        // ==========================================
        // PARSE JSON FEED A (Hackathons Schema)
        // ==========================================
        const extId = String(raw.id || raw.externalId || `json-${idx + 1}`).trim();
        const title = FeedNormalizer.normalizeCapitalization(raw.title || raw.name || '');
        const organizer = FeedNormalizer.normalizeCapitalization(raw.organization || raw.sponsor || '');
        const description = FeedNormalizer.normalizeWhitespace(raw.description || raw.summary || '');
        const eventType = String(raw.category || raw.type || 'hackathon').toLowerCase().trim();
        const format = FeedNormalizer.normalizeFormat(raw.format || raw.deliveryMode);
        const location = FeedNormalizer.normalizeWhitespace(raw.location || raw.venue || 'Online');

        const { costType, costAmount, currency } = FeedNormalizer.normalizeCost({
          rawCost: raw.cost || raw.costType,
          rawAmount: raw.costAmount,
          rawCurrency: raw.currency
        });

        const prizePool = FeedNormalizer.normalizeWhitespace(raw.prizePool || raw.prizes || '');
        const stipendAmount = FeedNormalizer.normalizeWhitespace(raw.stipend || raw.grant || '');
        const experienceLevel = String(raw.experienceLevel || raw.difficulty || 'all').toLowerCase().trim();
        const skills = FeedNormalizer.normalizeArray(raw.skills || raw.competencies);

        const eligibility = raw.eligibility || {};
        const eligibleEducationLevels = FeedNormalizer.normalizeArray(eligibility.education || raw.eligibleEducationLevels);
        const eligibleCountries = FeedNormalizer.normalizeArray(eligibility.countries || raw.eligibleCountries);
        const minAge = eligibility.minAge !== undefined ? parseInt(eligibility.minAge, 10) : null;
        const maxAge = eligibility.maxAge !== undefined ? parseInt(eligibility.maxAge, 10) : null;

        const deadline = FeedNormalizer.normalizeDate(raw.deadline || raw.closingDate || raw.applicationDeadline);
        const startDate = FeedNormalizer.normalizeDate(raw.startDate || raw.commenceDate || raw.eventStartDate);
        const endDate = FeedNormalizer.normalizeDate(raw.endDate || raw.conclusionDate || raw.eventEndDate);
        const applicationUrl = FeedNormalizer.normalizeWhitespace(raw.applyUrl || raw.registrationLink || raw.applicationUrl || '');
        const sourceUrl = `https://demo.feed.example.edu/${feedName}.json`;

        const teamMin = raw.teamMin ? parseInt(raw.teamMin, 10) : 1;
        const teamMax = raw.teamMax ? parseInt(raw.teamMax, 10) : 4;
        const fp = FeedNormalizer.generateFingerprint(title, organizer, startDate);

        const item = {
          title,
          organizer,
          organization: organizer,
          description,
          category: eventType,
          eventType,
          opportunityType: eventType,
          theme: FeedNormalizer.normalizeWhitespace(raw.theme || (title.toLowerCase().includes('climate') ? 'Climate & Cleantech' : 'Artificial Intelligence')),
          startDate,
          endDate,
          deadline,
          eventStartDate: startDate,
          eventEndDate: endDate,
          applicationDeadline: deadline,
          format,
          location,
          costAmount,
          currency,
          teamMin,
          teamMax,
          eligibilityText: FeedNormalizer.normalizeWhitespace(raw.eligibilityText || 'Open to all registered university students worldwide.'),
          requiredSkills: skills.length > 0 ? skills : ['General'],
          beginnerFriendly: experienceLevel === 'beginner' || experienceLevel === 'all',
          sustainabilityFocused: Boolean(title.toLowerCase().includes('climate') || description.toLowerCase().includes('sustainability')),
          sourceName: feedName,
          sourceFeed: feedName,
          sourceUrl,
          applicationUrl,
          sourceRecordId: extId,
          externalId: extId,
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
      }
    });
  }
}

module.exports = FeedNormalizer;
