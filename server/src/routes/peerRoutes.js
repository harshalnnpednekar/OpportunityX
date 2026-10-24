const express = require('express');
const router = express.Router();
const peerMatchController = require('../controllers/peerMatchController');
const { requireAuth } = require('../middleware/auth');
const {
  validatePeerMatchesQuery,
  validatePeerRequest,
  validatePeerRequestResponse
} = require('../middleware/validators');

router.use(requireAuth);

// GET /api/peers/matches?opportunityId=...
router.get('/matches', validatePeerMatchesQuery, peerMatchController.getPeerMatches);

// POST /api/peers/requests
router.post('/requests', validatePeerRequest, peerMatchController.sendPeerRequest);

// PATCH /api/peers/requests/:id
router.patch('/requests/:id', validatePeerRequestResponse, peerMatchController.respondToPeerRequest);

// GET /api/peers/requests (get all sent and received requests)
router.get('/requests', peerMatchController.getMyPeerMatches);

module.exports = router;
