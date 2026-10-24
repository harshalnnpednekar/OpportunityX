const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

router.use(requireAuth, requireAdmin);

router.get('/health', adminController.getHealthAudit);
router.post('/ingest', adminController.triggerFeedIngestion);
router.get('/logs', adminController.getIngestionLogs);

module.exports = router;
