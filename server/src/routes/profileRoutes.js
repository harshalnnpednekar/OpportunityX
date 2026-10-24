const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validators');

router.get('/', requireAuth, profileController.getProfile);
router.patch('/', requireAuth, validateProfileUpdate, profileController.updateProfile);
router.put('/', requireAuth, validateProfileUpdate, profileController.updateProfile);

module.exports = router;
