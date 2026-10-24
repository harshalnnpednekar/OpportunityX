const path = require('path');
const { Op } = require('sequelize');
const DataHealthAuditor = require('../services/dataHealthAuditor');
const FeedImporter = require('../services/feedImporter');
const { User, StudentProfile, Opportunity, FeedImport, IngestionLog } = require('../models');

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

    if (feedIdentifier === 'all' || feedIdentifier === 'all-default-feeds') {
      const allResults = await FeedImporter.importAllDefaultFeeds();
      return res.status(200).json({
        message: 'All default local sample feeds imported successfully.',
        batches: allResults,
        import: allResults[0] || null,
        report: allResults
      });
    }

    if (!feedIdentifier || !FEED_WHITELIST[feedIdentifier]) {
      return res.status(400).json({
        error: `Invalid feed identifier: "${feedIdentifier}". Allowed identifiers: ${Object.keys(FEED_WHITELIST).join(', ')}, all`
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
      import: result,
      report: result,
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

/**
 * Delete a feed import log record (DELETE /api/admin/imports/:id)
 */
const deleteImport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return res.status(400).json({ error: 'Invalid import ID format.' });
    }
    const item = await FeedImport.findByPk(id);

    if (!item) {
      return res.status(404).json({ error: 'Feed import record not found.' });
    }

    await item.destroy();

    res.json({ message: 'Feed import record deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Get real-time aggregated platform statistics (GET /api/admin/stats)
 */
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalAdmins,
      activeStudents,
      suspendedUsers,
      totalOpportunities,
      activeOpportunities,
      expiredOpportunities,
      archivedOpportunities,
      recentRegistrations,
      recentImports
    ] = await Promise.all([
      User.count({ where: { role: 'student' } }),
      User.count({ where: { role: 'admin' } }),
      User.count({ where: { role: 'student', status: 'active' } }),
      User.count({ where: { status: 'suspended' } }),
      Opportunity.count(),
      Opportunity.count({ where: { status: 'active' } }),
      Opportunity.count({ where: { status: 'expired' } }),
      Opportunity.count({ where: { status: 'archived' } }),
      User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 6
      }),
      FeedImport.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    ]);

    res.json({
      totalStudents,
      totalAdmins,
      activeStudents,
      suspendedUsers,
      totalOpportunities,
      activeOpportunities,
      expiredOpportunities,
      archivedOpportunities,
      recentRegistrations,
      recentImports
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List registered users with search, role and status filtering (GET /api/admin/users)
 */
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { search, role, status } = req.query;
    const where = {};

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: q } },
        { email: { [Op.iLike]: q } }
      ];
    }

    if (role && role !== 'all') {
      where.role = role.toLowerCase();
    }

    if (status && status !== 'all') {
      where.status = status.toLowerCase();
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['passwordHash'] },
      include: [{
        model: StudentProfile,
        as: 'profile',
        attributes: ['id', 'fullName', 'university', 'major', 'educationLevel', 'skills', 'experienceLevel']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      users: rows
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update user account status (suspend or reactivate) (PATCH /api/admin/users/:id/status)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "active" or "suspended".' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Safety check: Prevent suspending the last active administrator
    if (user.role === 'admin' && status === 'suspended') {
      const activeAdminCount = await User.count({
        where: {
          role: 'admin',
          status: 'active'
        }
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ error: 'Cannot suspend the last active administrator account.' });
      }
    }

    await user.update({ status });

    res.json({
      message: `User account has been ${status === 'suspended' ? 'suspended' : 'reactivated'}.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update user role (student or admin) (PATCH /api/admin/users/:id/role)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "student" or "admin".' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Safety check: Prevent demoting the last active administrator
    if (user.role === 'admin' && role === 'student') {
      const activeAdminCount = await User.count({
        where: {
          role: 'admin',
          status: 'active'
        }
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last active administrator account.' });
      }
    }

    await user.update({ role });

    res.json({
      message: `User role updated to ${role}.`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a user account as administrator (DELETE /api/admin/users/:id)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Safety check: Prevent deleting the last active administrator
    if (user.role === 'admin') {
      const activeAdminCount = await User.count({
        where: {
          role: 'admin',
          status: 'active'
        }
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last active administrator account.' });
      }
    }

    await user.destroy();

    res.json({ message: 'User account has been permanently removed.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  importFeed,
  getImports,
  deleteImport,
  getHealthAudit,
  triggerFeedIngestion,
  getIngestionLogs,
  getAdminStats,
  getUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser
};
