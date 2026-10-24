const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, opportunityController.getOpportunities);
router.get('/:id', optionalAuth, opportunityController.getOpportunityDetail);

module.exports = router;
