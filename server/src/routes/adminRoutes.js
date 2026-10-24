const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { validateAdminFeedImport } = require('../middleware/validators');

router.use(requireAuth, requireAdmin);

// Standard prompt endpoints
router.post('/feeds/import', validateAdminFeedImport, adminController.importFeed);
router.get('/imports', adminController.getImports);

// System health audit & backward compatibility routes
router.get('/health', adminController.getHealthAudit);
router.post('/ingest', adminController.triggerFeedIngestion);
router.get('/logs', adminController.getIngestionLogs);

module.exports = router;
