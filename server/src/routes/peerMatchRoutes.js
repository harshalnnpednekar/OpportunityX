const express = require('express');
const router = express.Router();
const peerMatchController = require('../controllers/peerMatchController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/opportunity/:opportunityId', peerMatchController.getPeerMatches);
router.post('/request', peerMatchController.sendPeerRequest);
router.get('/my-matches', peerMatchController.getMyPeerMatches);
router.patch('/request/:matchId/respond', peerMatchController.respondToPeerRequest);

module.exports = router;
