const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { validateAdminFeedImport } = require('../middleware/validators');

router.use(requireAuth, requireAdmin);

// Admin Platform Statistics
router.get('/stats', adminController.getAdminStats);

// User Management (Admin Only)
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Standard prompt endpoints
router.post('/feeds/import', validateAdminFeedImport, adminController.importFeed);
router.get('/imports', adminController.getImports);
router.delete('/imports/:id', adminController.deleteImport);

// System health audit & backward compatibility routes
router.get('/health', adminController.getHealthAudit);
router.post('/ingest', adminController.triggerFeedIngestion);
router.get('/logs', adminController.getIngestionLogs);

module.exports = router;
