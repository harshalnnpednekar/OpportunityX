const path = require('path');
const DataHealthAuditor = require('../services/dataHealthAuditor');
const FeedImporter = require('../services/feedImporter');
const { FeedImport, IngestionLog } = require('../models');

// Whitelisted local feeds mapping
const FEED_WHITELIST = {
  'sample-json-a': { filename: 'sample-hackathons.json', type: 'json' },
  'hackathons': { filename: 'sample-hackathons.json', type: 'json' },
  'sample-xml-a': { filename: 'sample-competitions.xml', type: 'xml' },
  'competitions': { filename: 'sample-competitions.xml', type: 'xml' },
  'sample-json-b': { filename: 'sample-workshops.json', type: 'json' },
  'workshops': { filename: 'sample-workshops.json', type: 'json' }
};

/**
 * Import a validated local feed by identifier (POST /api/admin/feeds/import)
 * Rejects untrusted paths, path traversals, or unapproved feed identifiers.
 */
const importFeed = async (req, res, next) => {
  try {
    const feedIdentifier = (req.body.feedId || req.body.feedIdentifier || req.body.feedName || req.body.feed || '').toLowerCase().trim();

    if (!feedIdentifier || !FEED_WHITELIST[feedIdentifier]) {
      return res.status(400).json({
        error: `Invalid feed identifier: "${feedIdentifier}". Allowed identifiers: ${Object.keys(FEED_WHITELIST).join(', ')}`
      });
    }

    const { filename, type } = FEED_WHITELIST[feedIdentifier];
    const feedsDir = path.resolve(__dirname, '../feeds');
    const safeFilePath = path.join(feedsDir, filename);

    // Strict path verification to prevent path traversal
    if (!safeFilePath.startsWith(feedsDir)) {
      return res.status(400).json({ error: 'Illegal filesystem access detected.' });
    }

    const result = await FeedImporter.importFeed({
      feedName: feedIdentifier,
      feedType: type,
      filePath: safeFilePath
    });

    res.status(200).json({
      message: `Feed "${feedIdentifier}" imported successfully.`,
      import: result.importLog || result,
      details: result.details || []
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get feed imports history (GET /api/admin/imports)
 */
const getImports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await FeedImport.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      imports: rows
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get comprehensive data health and duplicate audit report (GET /api/admin/health)
 */
const getHealthAudit = async (req, res, next) => {
  try {
    const report = await DataHealthAuditor.generateReport();
    res.json(report);
  } catch (err) {
    next(err);
  }
};

/**
 * Legacy feed ingestion trigger
 */
const triggerFeedIngestion = async (req, res, next) => {
  try {
    const { feedName, feedType, content } = req.body;

    if (!feedName || !feedType) {
      return res.status(400).json({ error: 'feedName and feedType (json/xml) are required.' });
    }

    let result;
    if (content) {
      result = await FeedImporter.importFeed({
        feedName,
        feedType,
        content
      });
    } else {
      const allResults = await FeedImporter.importAllDefaultFeeds();
      result = {
        message: 'Imported all default local feeds',
        batches: allResults
      };
    }

    res.json({
      message: 'Feed ingestion completed successfully.',
      result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Legacy ingestion logs endpoint
 */
const getIngestionLogs = async (req, res, next) => {
  try {
    const logs = await IngestionLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    res.json({ logs });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  importFeed,
  getImports,
  getHealthAudit,
  triggerFeedIngestion,
  getIngestionLogs
};
