const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { validateOpportunityQuery, validateUuidParam } = require('../middleware/validators');

// Opportunity catalog with query filters
router.get('/', optionalAuth, validateOpportunityQuery, opportunityController.getOpportunities);

// Opportunity detail
router.get('/:id', optionalAuth, opportunityController.getOpportunityDetail);

// Eligibility evaluation for opportunity
router.get('/:id/eligibility', optionalAuth, validateUuidParam('id'), opportunityController.getOpportunityEligibility);

// Save / Unsave opportunity
router.post('/:id/save', requireAuth, validateUuidParam('id'), opportunityController.saveOpportunityById);
router.delete('/:id/save', requireAuth, validateUuidParam('id'), opportunityController.unsaveOpportunityById);

// Generate roadmap for opportunity
router.post('/:id/roadmap', requireAuth, validateUuidParam('id'), opportunityController.createOpportunityRoadmap);

module.exports = router;
