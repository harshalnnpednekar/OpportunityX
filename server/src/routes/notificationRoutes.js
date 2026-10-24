const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');
const { validateUuidParam } = require('../middleware/validators');

router.use(requireAuth);

router.get('/', notificationController.getNotifications);
router.post('/refresh-reminders', notificationController.refreshReminders);
router.patch('/:id/read', validateUuidParam('id'), notificationController.markAsRead);

module.exports = router;
