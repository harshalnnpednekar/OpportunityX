const { Opportunity, IngestionLog, sequelize } = require('../models');
const { Op } = require('sequelize');

class DataHealthAuditor {
  /**
   * Generates a comprehensive health report across all opportunities in catalog
   */
  static async generateReport() {
    const totalCount = await Opportunity.count();
    const activeCount = await Opportunity.count({ where: { status: 'active', isDuplicate: false } });
    const expiredCount = await Opportunity.count({ where: { status: 'expired' } });
    const flaggedCount = await Opportunity.count({ where: { status: 'flagged' } });
    const duplicateCount = await Opportunity.count({ where: { isDuplicate: true } });

    // Breakdown by source feed
    const feedsBreakdown = await Opportunity.findAll({
      attributes: [
        'sourceFeed',
        'sourceFormat',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['sourceFeed', 'sourceFormat'],
      raw: true
    });

    // Breakdown by opportunity type
    const categoryBreakdown = await Opportunity.findAll({
      attributes: [
        'opportunityType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['opportunityType'],
      raw: true
    });

    // Find opportunities with specific data quality issues
    const itemsWithIssues = await Opportunity.findAll({
      where: {
        [Op.or]: [
          { isDuplicate: true },
          { status: 'expired' },
          { status: 'flagged' }
        ]
      },
      attributes: [
        'id', 'externalId', 'title', 'organization', 'sourceFeed', 
        'status', 'isDuplicate', 'duplicateOfId', 'dataQualityFlags', 
        'applicationDeadline'
      ],
      limit: 50
    });

    // Recent ingestion runs
    const recentLogs = await IngestionLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    return {
      overview: {
        totalOpportunities: totalCount,
        activeOpportunities: activeCount,
        expiredOpportunities: expiredCount,
        flaggedOpportunities: flaggedCount,
        duplicateOpportunities: duplicateCount,
        healthScore: totalCount > 0 ? Math.round(((activeCount) / totalCount) * 100) : 100
      },
      feeds: feedsBreakdown,
      categories: categoryBreakdown,
      flaggedRecords: itemsWithIssues,
      recentIngestions: recentLogs
    };
  }
}

module.exports = DataHealthAuditor;
