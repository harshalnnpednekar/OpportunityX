const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const opportunityRoutes = require('./opportunityRoutes');
const savedOpportunityRoutes = require('./savedOpportunityRoutes');
const roadmapRoutes = require('./roadmapRoutes');
const notificationRoutes = require('./notificationRoutes');
const peerRoutes = require('./peerRoutes');
const peerMatchRoutes = require('./peerMatchRoutes');
const adminRoutes = require('./adminRoutes');

const opportunityController = require('../controllers/opportunityController');
const { optionalAuth } = require('../middleware/auth');

// System Health Check (GET /api/health)
router.get('/health', (req, res) => {
  res.json({
    name: 'OpportunityX Platform API',
    status: 'ok',
    service: 'OpportunityX REST API',
    timestamp: new Date().toISOString()
  });
});

// Authentication & Profile
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);

// Opportunities
router.use('/opportunities', opportunityRoutes);
router.use('/saved', savedOpportunityRoutes);

// Recommendations (GET /api/recommendations)
router.get('/recommendations', optionalAuth, opportunityController.getRecommendations);

// Roadmaps
router.use('/roadmaps', roadmapRoutes);

// Notifications (GET /api/notifications, PATCH /api/notifications/:id/read)
router.use('/notifications', notificationRoutes);

// Peer Matching (GET /api/peers/matches, POST /api/peers/requests, PATCH /api/peers/requests/:id)
router.use('/peers', peerRoutes);
router.use('/peer-match', peerMatchRoutes);

// Admin (POST /api/admin/feeds/import, GET /api/admin/imports)
router.use('/admin', adminRoutes);

module.exports = router;
