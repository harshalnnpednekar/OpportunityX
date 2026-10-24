const DataHealthAuditor = require('../services/dataHealthAuditor');
const FeedImporter = require('../services/feedImporter');
const { IngestionLog, Opportunity } = require('../models');

/**
 * Get comprehensive data health and duplicate audit report
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
 * Trigger feed ingestion (JSON or XML)
 */
const triggerFeedIngestion = async (req, res, next) => {
  try {
    const { feedName, feedType, content } = req.body;

    if (!feedName || !feedType) {
      return res.status(400).json({ error: 'feedName and feedType (json/xml) are required.' });
    }

    let result;
    if (content) {
      // Ingest custom uploaded or pasted feed payload
      result = await FeedImporter.importFeed({
        feedName,
        feedType,
        content
      });
    } else {
      // If no raw content provided, import default built-in feed sets
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
 * Get feed ingestion history
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
  getHealthAudit,
  triggerFeedIngestion,
  getIngestionLogs
};
