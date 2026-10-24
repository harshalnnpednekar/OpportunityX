const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin } = require('../middleware/validators');

router.post('/register', authRateLimiter, validateRegister, authController.register);
router.post('/login', authRateLimiter, validateLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
