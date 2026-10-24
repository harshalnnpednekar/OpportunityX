const { PeerMatch, User, Profile, SavedOpportunity, Opportunity } = require('../models');
const { Op } = require('sequelize');

/**
 * Discover peers interested in the same opportunity who gave explicit consent
 */
const getOpportunityPeers = async (req, res, next) => {
  try {
    const { opportunityId } = req.params;
    const currentProfile = req.user.profile;

    if (!currentProfile || !currentProfile.isPublicForMatching) {
      return res.json({
        consentRequired: true,
        message: 'You must enable Peer Collaboration Consent in your profile to discover other students.',
        peers: []
      });
    }

    // Find other students who saved this opportunity
    const savedList = await SavedOpportunity.findAll({
      where: {
        opportunityId,
        userId: { [Op.ne]: req.user.id }
      },
      attributes: ['userId']
    });

    const candidateUserIds = savedList.map(s => s.userId);

    // Filter candidate profiles who opted-in with explicit consent
    const publicProfiles = await Profile.findAll({
      where: {
        userId: { [Op.in]: candidateUserIds.length > 0 ? candidateUserIds : ['00000000-0000-0000-0000-000000000000'] },
        isPublicForMatching: true
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email']
      }]
    });

    // Check existing match requests between current user and these candidates
    const existingMatches = await PeerMatch.findAll({
      where: {
        opportunityId,
        [Op.or]: [
          { requesterId: req.user.id },
          { receiverId: req.user.id }
        ]
      }
    });

    const matchStatusMap = new Map();
    existingMatches.forEach(m => {
      const otherId = m.requesterId === req.user.id ? m.receiverId : m.requesterId;
      matchStatusMap.set(otherId, {
        matchId: m.id,
        status: m.status,
        isRequester: m.requesterId === req.user.id,
        contactDetail: m.status === 'accepted' ? m.contactDetail : null
      });
    });

    const mySkills = (currentProfile.skills || []).map(s => String(s).toLowerCase());

    const peers = publicProfiles.map(p => {
      const peerSkills = (p.skills || []).map(s => String(s));
      const shared = peerSkills.filter(s => mySkills.includes(s.toLowerCase()));
      const complementary = peerSkills.filter(s => !mySkills.includes(s.toLowerCase()));
      const matchMeta = matchStatusMap.get(p.userId) || { status: 'none' };

      return {
        userId: p.userId,
        fullName: p.fullName,
        educationLevel: p.educationLevel,
        university: p.university,
        major: p.major,
        matchingBio: p.matchingBio || p.bio,
        skills: peerSkills,
        sharedSkills: shared,
        complementarySkills: complementary,
        matchStatus: matchMeta.status,
        matchId: matchMeta.matchId || null,
        isRequester: matchMeta.isRequester || false,
        contactDetail: matchMeta.contactDetail || null
      };
    });

    res.json({
      consentRequired: false,
      opportunityId,
      peers
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Send a collaboration invite to a peer
 */
const sendPeerRequest = async (req, res, next) => {
  try {
    const { opportunityId, receiverId, message, contactPreference, contactDetail } = req.body;

    if (!opportunityId || !receiverId) {
      return res.status(400).json({ error: 'opportunityId and receiverId are required.' });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ error: 'You cannot send a collaboration request to yourself.' });
    }

    // Verify current user has consent enabled
    const myProfile = req.user.profile;
    if (!myProfile || !myProfile.isPublicForMatching) {
      return res.status(403).json({ error: 'You must enable Peer Collaboration Consent in your profile first.' });
    }

    // Verify receiver has consent enabled
    const receiverProfile = await Profile.findOne({
      where: { userId: receiverId, isPublicForMatching: true }
    });
    if (!receiverProfile) {
      return res.status(404).json({ error: 'Student is not available for peer matching.' });
    }

    // Check if a request already exists
    const existing = await PeerMatch.findOne({
      where: {
        opportunityId,
        [Op.or]: [
          { requesterId: req.user.id, receiverId },
          { requesterId: receiverId, receiverId: req.user.id }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({ error: 'A collaboration request already exists with this peer.', match: existing });
    }

    const match = await PeerMatch.create({
      opportunityId,
      requesterId: req.user.id,
      receiverId,
      status: 'pending',
      message: message || `Hi! I saw you are preparing for this opportunity and would love to collaborate.`,
      contactPreference: contactPreference || 'email',
      contactDetail: contactDetail || req.user.email
    });

    res.status(201).json({
      message: 'Collaboration request sent successfully.',
      match
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all peer requests (received and sent)
 */
const getMyPeerMatches = async (req, res, next) => {
  try {
    const received = await PeerMatch.findAll({
      where: { receiverId: req.user.id },
      include: [
        { model: Opportunity, as: 'opportunity' },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'email'],
          include: [{ model: Profile, as: 'profile' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const sent = await PeerMatch.findAll({
      where: { requesterId: req.user.id },
      include: [
        { model: Opportunity, as: 'opportunity' },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'email'],
          include: [{ model: Profile, as: 'profile' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      received,
      sent
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Respond to a received collaboration request
 */
const respondToPeerRequest = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { action, contactDetail } = req.body; // 'accepted' or 'declined'

    if (!['accepted', 'declined'].includes(action)) {
      return res.status(400).json({ error: "Action must be 'accepted' or 'declined'." });
    }

    const match = await PeerMatch.findOne({
      where: { id: matchId, receiverId: req.user.id }
    });

    if (!match) {
      return res.status(404).json({ error: 'Collaboration request not found.' });
    }

    await match.update({
      status: action,
      contactDetail: action === 'accepted' ? (contactDetail || req.user.email) : match.contactDetail
    });

    res.json({
      message: action === 'accepted' ? 'Collaboration accepted! Contact shared.' : 'Collaboration request declined.',
      match
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOpportunityPeers,
  sendPeerRequest,
  getMyPeerMatches,
  respondToPeerRequest
};
