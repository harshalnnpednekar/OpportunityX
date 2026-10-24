const path = require('path');
const FeedNormalizer = require('./feedNormalizer');
const FixtureReader = require('../utils/fixtureReader');
const importEvents = require('./importEvents');
const {
  Opportunity,
  FeedImport,
  OpportunityUpdate,
  SavedOpportunity,
  Notification
} = require('../models');

class FeedImporter {
  /**
   * Import opportunities from file or raw text using safe streams, buffers,
   * EventEmitter notifications, and conservative duplicate/update tracking.
   */
  static async importFeed({ feedName, feedType, content, filePath }) {
    const startTime = Date.now();
    importEvents.emit('import:started', {
      feedName,
      feedType,
      timestamp: new Date(startTime)
    });

    let rawContent = content;
    let byteLength = rawContent ? Buffer.byteLength(rawContent, 'utf8') : 0;

    // Use safe stream fixture reader if filePath is provided
    if (!rawContent && filePath) {
      try {
        const streamResult = await FixtureReader.readStreamAsync(filePath);
        rawContent = streamResult.content;
        byteLength = streamResult.byteLength;
      } catch (streamErr) {
        const failedLog = await FeedImport.create({
          sourceName: feedName,
          sourceType: feedType || 'unknown',
          startedAt: new Date(startTime),
          finishedAt: new Date(),
          recordsSeen: 0,
          recordsCreated: 0,
          recordsUpdated: 0,
          duplicatesFound: 0,
          errors: [{ error: streamErr.message, stage: 'file_reading' }],
          status: 'failed',
          totalProcessed: 0,
          itemsIngested: 0,
          itemsUpdated: 0,
          duplicatesFlagged: 0,
          expiredFlagged: 0,
          invalidSkipped: 0,
          details: [{ action: 'failed', error: streamErr.message }]
        });

        importEvents.emit('import:error', {
          feedName,
          error: streamErr.message,
          timestamp: new Date()
        });

        return {
          logId: failedLog.id,
          feedName,
          feedType,
          status: 'failed',
          error: streamErr.message,
          recordsSeen: 0,
          recordsCreated: 0,
          recordsUpdated: 0,
          duplicatesDetected: 0,
          durationMs: Date.now() - startTime
        };
      }
    }

    if (!rawContent) {
      const emptyErr = 'No feed content or fixture file path provided for ingestion';
      importEvents.emit('import:error', { feedName, error: emptyErr, timestamp: new Date() });
      throw new Error(emptyErr);
    }

    let normalizedItems = [];
    try {
      if (feedType === 'xml') {
        normalizedItems = FeedNormalizer.parseXmlFeed(rawContent, feedName);
      } else {
        normalizedItems = FeedNormalizer.parseJsonFeed(rawContent, feedName);
      }
    } catch (parseErr) {
      // Record failed parse report gracefully without crashing server
      const failedLog = await FeedImport.create({
        sourceName: feedName,
        sourceType: feedType,
        startedAt: new Date(startTime),
        finishedAt: new Date(),
        recordsSeen: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        duplicatesFound: 0,
        errors: [{ error: parseErr.message, stage: 'normalization_parsing' }],
        status: 'failed',
        totalProcessed: 0,
        itemsIngested: 0,
        itemsUpdated: 0,
        duplicatesFlagged: 0,
        expiredFlagged: 0,
        invalidSkipped: 0,
        details: [{ action: 'failed', error: parseErr.message }]
      });

      importEvents.emit('import:error', {
        feedName,
        error: parseErr.message,
        timestamp: new Date()
      });

      return {
        logId: failedLog.id,
        feedName,
        feedType,
        status: 'failed',
        error: parseErr.message,
        recordsSeen: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        duplicatesDetected: 0,
        durationMs: Date.now() - startTime
      };
    }

    let itemsIngested = 0;
    let itemsUpdated = 0;
    let duplicatesFlagged = 0;
    let expiredFlagged = 0;
    let invalidSkipped = 0;
    let uncertainDuplicatesFlagged = 0;
    const details = [];

    // Track seen fingerprints within this import batch
    const batchFingerprints = new Map();

    for (const item of normalizedItems) {
      try {
        const recId = item.sourceRecordId || item.externalId;
        const sName = item.sourceName || item.sourceFeed;

        // Skip completely invalid items with missing title AND missing application URL
        if (item.dataQualityFlags.includes('missing_title') && item.dataQualityFlags.includes('missing_application_url')) {
          invalidSkipped++;
          details.push({
            externalId: recId,
            title: item.title,
            action: 'skipped_invalid',
            reason: 'Missing title and application URL'
          });
          continue;
        }

        const fp = item.normalizedFingerprint || item.fingerprint;

        // Check for batch internal duplicate
        let isBatchDuplicate = false;
        if (batchFingerprints.has(fp)) {
          isBatchDuplicate = true;
          item.isDuplicate = true;
          item.duplicateOfId = batchFingerprints.get(fp);
          if (!item.dataQualityFlags.includes('duplicate_in_same_feed')) {
            item.dataQualityFlags.push('duplicate_in_same_feed');
          }
          duplicatesFlagged++;
        }

        // Conservative duplicate check against database
        const existingByFingerprint = await Opportunity.findOne({
          where: { normalizedFingerprint: fp }
        });

        if (existingByFingerprint && !isBatchDuplicate) {
          item.isDuplicate = true;
          item.duplicateOfId = existingByFingerprint.id;
          if (!item.dataQualityFlags.includes('duplicate_record')) {
            item.dataQualityFlags.push('duplicate_record');
          }
          duplicatesFlagged++;
        }

        // Similarity signal check for UNCERTAIN / POSSIBLE duplicates
        // If not an exact match, check if title is highly similar to existing active opportunities
        if (!existingByFingerprint && !isBatchDuplicate && item.title) {
          const activeOpportunities = await Opportunity.findAll({
            where: { status: 'active' },
            attributes: ['id', 'title', 'organizer', 'startDate']
          });

          for (const candidate of activeOpportunities) {
            const similarity = FeedNormalizer.calculateStringSimilarity(item.title, candidate.title);
            if (similarity >= 0.70 && similarity < 1.0) {
              // Uncertain match: send to admin review queue rather than destructively merging!
              item.status = 'flagged';
              if (!item.dataQualityFlags.includes('uncertain_duplicate_similarity')) {
                item.dataQualityFlags.push('uncertain_duplicate_similarity');
              }
              if (!item.contradictionFlags.includes('uncertain_duplicate_similarity')) {
                item.contradictionFlags.push('uncertain_duplicate_similarity');
              }
              item.uncertainSimilarityScore = Math.round(similarity * 100);
              item.possibleDuplicateOfId = candidate.id;
              uncertainDuplicatesFlagged++;
              break;
            }
          }
        }

        if (item.status === 'expired') {
          expiredFlagged++;
        }

        // =================================================================
        // IDEMPOTENCY: Check if record exists by (sourceRecordId + sourceName)
        // =================================================================
        const existingRecord = await Opportunity.findOne({
          where: {
            sourceRecordId: recId,
            sourceName: sName
          }
        });

        let savedRecord;
        if (existingRecord) {
          // Detect meaningful changes to record updates for user notifications
          const changes = [];
          if (item.deadline && existingRecord.deadline) {
            const oldTime = new Date(existingRecord.deadline).getTime();
            const newTime = new Date(item.deadline).getTime();
            if (oldTime !== newTime) {
              changes.push({
                type: 'deadline_extended',
                message: `Deadline changed from ${new Date(existingRecord.deadline).toLocaleDateString()} to ${new Date(item.deadline).toLocaleDateString()}`,
                oldValue: existingRecord.deadline,
                newValue: item.deadline
              });
            }
          }

          if (item.costAmount !== undefined && Number(existingRecord.costAmount) !== Number(item.costAmount)) {
            changes.push({
              type: 'cost_updated',
              message: `Entry cost updated to ${item.currency} ${item.costAmount}`,
              oldValue: existingRecord.costAmount,
              newValue: item.costAmount
            });
          }

          if (item.format && existingRecord.format !== item.format) {
            changes.push({
              type: 'format_changed',
              message: `Event delivery format changed from ${existingRecord.format} to ${item.format}`,
              oldValue: existingRecord.format,
              newValue: item.format
            });
          }

          if (item.applicationUrl && existingRecord.applicationUrl !== item.applicationUrl) {
            changes.push({
              type: 'details_modified',
              message: 'Application link or registration portal updated',
              oldValue: existingRecord.applicationUrl,
              newValue: item.applicationUrl
            });
          }

          if (item.eligibilityText && existingRecord.eligibilityText !== item.eligibilityText) {
            changes.push({
              type: 'eligibility_modified',
              message: 'Eligibility criteria or participation requirements updated',
              oldValue: existingRecord.eligibilityText,
              newValue: item.eligibilityText
            });
          }

          // Persist OpportunityUpdate records and notify users who saved this opportunity
          for (const change of changes) {
            await OpportunityUpdate.create({
              opportunityId: existingRecord.id,
              updateType: change.type,
              message: change.message,
              oldValue: { val: change.oldValue },
              newValue: { val: change.newValue },
              detectedAt: new Date()
            });

            // Find all students who saved this opportunity and notify them
            const savers = await SavedOpportunity.findAll({
              where: { opportunityId: existingRecord.id }
            });
            for (const saver of savers) {
              await Notification.create({
                userId: saver.userId,
                opportunityId: existingRecord.id,
                type: 'opportunity_update',
                message: `Update for "${item.title}": ${change.message}`
              });
            }
          }

          // Update existing opportunity record
          await existingRecord.update(item);
          savedRecord = existingRecord;
          itemsUpdated++;

          details.push({
            id: savedRecord.id,
            externalId: recId,
            title: item.title,
            action: 'updated',
            flags: item.dataQualityFlags,
            isDuplicate: item.isDuplicate,
            changesCount: changes.length
          });
        } else {
          // If slug collision, append unique token
          const slugExists = await Opportunity.findOne({ where: { slug: item.slug } });
          if (slugExists) {
            item.slug = `${item.slug}-${Math.floor(Math.random() * 10000)}`;
          }

          savedRecord = await Opportunity.create(item);
          itemsIngested++;

          details.push({
            id: savedRecord.id,
            externalId: recId,
            title: item.title,
            action: 'created',
            flags: item.dataQualityFlags,
            isDuplicate: item.isDuplicate
          });
        }

        if (!batchFingerprints.has(fp)) {
          batchFingerprints.set(fp, savedRecord.id);
        }
      } catch (err) {
        console.error(`Failed to ingest item ${item.sourceRecordId || item.externalId}:`, err.message);
        invalidSkipped++;
        details.push({
          externalId: item.sourceRecordId || item.externalId,
          title: item.title,
          action: 'error',
          error: err.message
        });
      }
    }

    const logStatus = invalidSkipped > 0 || duplicatesFlagged > 0 ? 'warning' : 'success';
    const log = await FeedImport.create({
      sourceName: feedName,
      sourceType: feedType,
      startedAt: new Date(startTime),
      finishedAt: new Date(),
      recordsSeen: normalizedItems.length,
      recordsCreated: itemsIngested,
      recordsUpdated: itemsUpdated,
      duplicatesFound: duplicatesFlagged,
      errors: details.filter(d => d.action === 'error' || d.action === 'skipped_invalid'),
      status: logStatus,
      totalProcessed: normalizedItems.length,
      itemsIngested,
      itemsUpdated,
      duplicatesFlagged,
      expiredFlagged,
      invalidSkipped,
      details
    });

    const report = {
      logId: log.id,
      feedName,
      feedType,
      status: logStatus,
      recordsSeen: normalizedItems.length,
      recordsCreated: itemsIngested,
      recordsUpdated: itemsUpdated,
      duplicatesDetected: duplicatesFlagged,
      uncertainDuplicatesFlagged,
      expiredFlagged,
      invalidSkipped,
      byteLength,
      durationMs: Date.now() - startTime,
      // Backward compatibility aliases
      itemsIngested,
      itemsUpdated,
      duplicatesFlagged,
      totalProcessed: normalizedItems.length,
      details
    };

    importEvents.emit('import:completed', {
      feedName,
      feedType,
      report,
      timestamp: new Date()
    });

    return report;
  }

  /**
   * Ingest all three default sample feeds (Hackathons JSON, Competitions XML, Workshops JSON)
   */
  static async importAllDefaultFeeds() {
    const feedDir = path.resolve(__dirname, '../feeds');
    const results = [];

    // 1. JSON Feed A: Hackathons
    const hackPath = path.join(feedDir, 'sample-hackathons.json');
    const resA = await FeedImporter.importFeed({
      feedName: 'sample-hackathons-json',
      feedType: 'json',
      filePath: hackPath
    });
    results.push(resA);

    // 2. XML Feed C: Competitions
    const compPath = path.join(feedDir, 'sample-competitions.xml');
    const resC = await FeedImporter.importFeed({
      feedName: 'sample-competitions-xml',
      feedType: 'xml',
      filePath: compPath
    });
    results.push(resC);

    // 3. JSON Feed B: Workshops
    const workPath = path.join(feedDir, 'sample-workshops.json');
    const resB = await FeedImporter.importFeed({
      feedName: 'sample-workshops-json',
      feedType: 'json',
      filePath: workPath
    });
    results.push(resB);

    return results;
  }
}

module.exports = FeedImporter;
