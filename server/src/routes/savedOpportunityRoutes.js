const express = require('express');
const router = express.Router();
const savedOpportunityController = require('../controllers/savedOpportunityController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', savedOpportunityController.getSavedOpportunities);
router.get('/timeline', savedOpportunityController.getDeadlineTimeline);
router.post('/', savedOpportunityController.saveOpportunity);
router.put('/:id', savedOpportunityController.updateSaved);
router.delete('/:id', savedOpportunityController.removeSaved);

module.exports = router;
