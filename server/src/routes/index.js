const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const opportunityRoutes = require('./opportunityRoutes');
const savedOpportunityRoutes = require('./savedOpportunityRoutes');
const roadmapRoutes = require('./roadmapRoutes');
const peerMatchRoutes = require('./peerMatchRoutes');
const adminRoutes = require('./adminRoutes');

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    name: 'OpportunityX Platform API',
    status: 'ok',
    service: 'OpportunityX REST API',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/saved', savedOpportunityRoutes);
router.use('/roadmaps', roadmapRoutes);
router.use('/peer-match', peerMatchRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
