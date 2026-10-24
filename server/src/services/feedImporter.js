const fs = require('fs');
const path = require('path');
const FeedNormalizer = require('./feedNormalizer');
const { Opportunity, FeedImport } = require('../models');

class FeedImporter {
  /**
   * Import opportunities from file or raw text
   */
  static async importFeed({ feedName, feedType, content, filePath }) {
    let rawContent = content;
    if (!rawContent && filePath) {
      rawContent = fs.readFileSync(filePath, 'utf8');
    }

    if (!rawContent) {
      throw new Error('No feed content or file path provided for ingestion');
    }

    const startTime = Date.now();
    let normalizedItems = [];

    if (feedType === 'xml') {
      normalizedItems = FeedNormalizer.parseXmlFeed(rawContent, feedName);
    } else {
      normalizedItems = FeedNormalizer.parseJsonFeed(rawContent, feedName);
    }

    let itemsIngested = 0;
    let itemsUpdated = 0;
    let duplicatesFlagged = 0;
    let expiredFlagged = 0;
    let invalidSkipped = 0;
    const details = [];

    // Track seen fingerprints within this feed batch
    const batchFingerprints = new Map();

    for (const item of normalizedItems) {
      try {
        // Skip completely invalid items with no title and no URL
        if (item.dataQualityFlags.includes('missing_title') && item.dataQualityFlags.includes('missing_application_url')) {
          invalidSkipped++;
          details.push({
            externalId: item.sourceRecordId || item.externalId,
            title: item.title,
            action: 'skipped_invalid',
            reason: 'Missing title and application URL'
          });
          continue;
        }

        // Check for batch internal duplicate
        let isBatchDuplicate = false;
        const fp = item.normalizedFingerprint || item.fingerprint;
        if (batchFingerprints.has(fp)) {
          isBatchDuplicate = true;
          item.isDuplicate = true;
          item.duplicateOfId = batchFingerprints.get(fp);
          item.dataQualityFlags.push('duplicate_in_same_feed');
        }

        // Check if an existing opportunity has the same fingerprint
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

        if (item.status === 'expired') {
          expiredFlagged++;
        }

        // Find by exact sourceRecordId + sourceName to check if this is an update
        const recId = item.sourceRecordId || item.externalId;
        const sName = item.sourceName || item.sourceFeed;
        const existingRecord = await Opportunity.findOne({
          where: {
            sourceRecordId: recId,
            sourceName: sName
          }
        });

        let savedRecord;
        if (existingRecord) {
          await existingRecord.update(item);
          savedRecord = existingRecord;
          itemsUpdated++;
          details.push({
            id: savedRecord.id,
            externalId: recId,
            title: item.title,
            action: 'updated',
            flags: item.dataQualityFlags,
            isDuplicate: item.isDuplicate
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

      // Compatibility fields
      totalProcessed: normalizedItems.length,
      itemsIngested,
      itemsUpdated,
      duplicatesFlagged,
      expiredFlagged,
      invalidSkipped,
      details
    });

    return {
      logId: log.id,
      feedName,
      feedType,
      totalProcessed: normalizedItems.length,
      itemsIngested,
      itemsUpdated,
      duplicatesFlagged,
      expiredFlagged,
      invalidSkipped,
      durationMs: Date.now() - startTime
    };
  }

  /**
   * Ingest all default sample feeds from disk
   */
  static async importAllDefaultFeeds() {
    const feedDir = path.join(__dirname, '../feeds');
    const results = [];

    // 1. Hackathons JSON feed
    const hackPath = path.join(feedDir, 'sample-hackathons.json');
    if (fs.existsSync(hackPath)) {
      const res = await FeedImporter.importFeed({
        feedName: 'sample-hackathons-json',
        feedType: 'json',
        filePath: hackPath
      });
      results.push(res);
    }

    // 2. Competitions XML feed
    const compPath = path.join(feedDir, 'sample-competitions.xml');
    if (fs.existsSync(compPath)) {
      const res = await FeedImporter.importFeed({
        feedName: 'sample-competitions-xml',
        feedType: 'xml',
        filePath: compPath
      });
      results.push(res);
    }

    // 3. Workshops JSON feed
    const workPath = path.join(feedDir, 'sample-workshops.json');
    if (fs.existsSync(workPath)) {
      const res = await FeedImporter.importFeed({
        feedName: 'sample-workshops-json',
        feedType: 'json',
        filePath: workPath
      });
      results.push(res);
    }

    return results;
  }
}

module.exports = FeedImporter;
