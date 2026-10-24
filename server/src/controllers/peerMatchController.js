const { MatchRequest, User, StudentProfile, SavedOpportunity, Opportunity } = require('../models');
const { Op } = require('sequelize');

/**
 * Discover peers interested in an opportunity who gave explicit consent
 * (GET /api/peers/matches?opportunityId=...)
 */
const getPeerMatches = async (req, res, next) => {
  try {
    const opportunityId = req.query.opportunityId || req.params.opportunityId;

    if (!opportunityId) {
      return res.status(400).json({ error: 'opportunityId query parameter is required.' });
    }

    const currentProfile = req.user.profile;
    const hasConsent = currentProfile && (currentProfile.peerMatchingConsent || currentProfile.isPublicForMatching);

    if (!hasConsent) {
      return res.status(403).json({
        consentRequired: true,
        error: 'Peer matching consent required. You must enable peer matching in your profile to discover other students.',
        peers: []
      });
    }

    // Find students who saved this opportunity or are public for matching
    const savedList = await SavedOpportunity.findAll({
      where: {
        opportunityId,
        userId: { [Op.ne]: req.user.id }
      },
      attributes: ['userId']
    });

    const candidateUserIds = savedList.map(s => s.userId);

    // Query profiles with explicit consent
    const profileWhere = {
      userId: { [Op.ne]: req.user.id },
      [Op.or]: [
        { peerMatchingConsent: true },
        { isPublicForMatching: true }
      ]
    };

    if (candidateUserIds.length > 0) {
      profileWhere.userId = {
        [Op.and]: [
          { [Op.ne]: req.user.id },
          { [Op.in]: candidateUserIds }
        ]
      };
    }

    const publicProfiles = await StudentProfile.findAll({
      where: profileWhere,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name'] // Do not expose email in public candidate pool
      }]
    });

    // Check existing match requests between current user and candidate peers
    const existingMatches = await MatchRequest.findAll({
      where: {
        opportunityId,
        [Op.or]: [
          { requesterId: req.user.id },
          { recipientId: req.user.id }
        ]
      }
    });

    const matchStatusMap = new Map();
    existingMatches.forEach(m => {
      const otherId = m.requesterId === req.user.id ? m.recipientId : m.requesterId;
      matchStatusMap.set(otherId, {
        matchId: m.id,
        status: m.status,
        isRequester: m.requesterId === req.user.id,
        contactDetail: m.status === 'accepted' ? m.contactDetail : null
      });
    });

    const mySkills = (currentProfile.skills || []).map(s => String(s).toLowerCase());
    const myInterests = (currentProfile.interests || []).map(i => String(i).toLowerCase());

    const peers = publicProfiles.map(p => {
      const peerSkills = (p.skills || []).map(s => String(s));
      const peerInterests = (p.interests || []).map(i => String(i));
      const sharedSkills = peerSkills.filter(s => mySkills.includes(s.toLowerCase()));
      const complementarySkills = peerSkills.filter(s => !mySkills.includes(s.toLowerCase()));
      const sharedInterests = peerInterests.filter(i => myInterests.includes(i.toLowerCase()));
      const matchMeta = matchStatusMap.get(p.userId) || { status: 'none' };

      // Calculate compatibility score (0 to 100)
      let score = 50; // baseline
      if (sharedSkills.length > 0) score += Math.min(25, sharedSkills.length * 10);
      if (complementarySkills.length > 0) score += Math.min(15, complementarySkills.length * 5);
      if (sharedInterests.length > 0) score += Math.min(10, sharedInterests.length * 5);
      if (p.availability && currentProfile.availability && p.availability === currentProfile.availability) score += 5;
      score = Math.min(100, score);

      // Generate clear compatibility explanation
      let explanationParts = [];
      if (sharedSkills.length > 0) {
        explanationParts.push(`${sharedSkills.length} shared skill${sharedSkills.length > 1 ? 's' : ''} (${sharedSkills.slice(0, 2).join(', ')})`);
      }
      if (complementarySkills.length > 0) {
        explanationParts.push(`${complementarySkills.length} complementary toolkit${complementarySkills.length > 1 ? 's' : ''} (${complementarySkills.slice(0, 2).join(', ')})`);
      }
      if (sharedInterests.length > 0) {
        explanationParts.push(`shared interest in ${sharedInterests.slice(0, 2).join(' & ')}`);
      }
      if (explanationParts.length === 0) {
        explanationParts.push('mutual interest in this opportunity');
      }

      const compatibilityExplanation = `Compatibility: ${explanationParts.join('; ')}.`;

      return {
        userId: p.userId,
        name: p.user?.name || p.fullName,
        fullName: p.fullName || p.user?.name,
        educationLevel: p.educationLevel,
        university: p.university,
        major: p.major,
        availability: p.availability,
        matchingBio: p.matchingBio || p.bio,
        skills: peerSkills,
        sharedSkills,
        complementarySkills,
        sharedInterests,
        compatibilityScore: score,
        compatibilityExplanation,
        matchStatus: matchMeta.status,
        matchId: matchMeta.matchId || null,
        isRequester: matchMeta.isRequester || false,
        // Email/contact details ONLY exposed if mutually accepted
        contactDetail: matchMeta.status === 'accepted' ? matchMeta.contactDetail : null
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
 * Send a collaboration invite to a peer (POST /api/peers/requests)
 */
const sendPeerRequest = async (req, res, next) => {
  try {
    const {
      opportunityId,
      recipientId,
      receiverId,
      message,
      contactPreference,
      contactDetail
    } = req.body;

    const targetUserId = recipientId || receiverId;

    if (!opportunityId || !targetUserId) {
      return res.status(400).json({ error: 'opportunityId and recipientId are required.' });
    }

    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'You cannot send a collaboration request to yourself.' });
    }

    // Verify current user has consent enabled
    const myProfile = req.user.profile;
    const myConsent = myProfile && (myProfile.peerMatchingConsent || myProfile.isPublicForMatching);
    if (!myConsent) {
      return res.status(403).json({ error: 'You must enable Peer Collaboration Consent in your profile first.' });
    }

    // Verify recipient exists and has consent enabled
    const targetProfile = await StudentProfile.findOne({
      where: {
        userId: targetUserId,
        [Op.or]: [
          { peerMatchingConsent: true },
          { isPublicForMatching: true }
        ]
      }
    });

    if (!targetProfile) {
      return res.status(404).json({ error: 'Student is not available for peer matching.' });
    }

    // Check if a request already exists between these users for this opportunity
    const existing = await MatchRequest.findOne({
      where: {
        opportunityId,
        [Op.or]: [
          { requesterId: req.user.id, recipientId: targetUserId },
          { requesterId: targetUserId, recipientId: req.user.id }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({
        error: 'A collaboration request already exists with this peer.',
        match: existing,
        request: existing
      });
    }

    const match = await MatchRequest.create({
      opportunityId,
      requesterId: req.user.id,
      recipientId: targetUserId,
      status: 'pending',
      message: message || 'Hi! I saw you are preparing for this opportunity and would love to collaborate.',
      contactPreference: contactPreference || 'email',
      contactDetail: contactDetail || req.user.email
    });

    res.status(201).json({
      message: 'Collaboration request sent successfully.',
      match,
      request: match
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Respond to a received collaboration request (PATCH /api/peers/requests/:id)
 */
const respondToPeerRequest = async (req, res, next) => {
  try {
    const matchId = req.params.id || req.params.matchId;
    const { action, status, contactDetail } = req.body;

    const resolvedStatus = status || action;
    if (!resolvedStatus || !['accepted', 'declined'].includes(resolvedStatus)) {
      return res.status(400).json({ error: "Action/status must be either 'accepted' or 'declined'." });
    }

    // Strictly enforce ownership: only the designated recipient can respond
    const match = await MatchRequest.findOne({
      where: {
        id: matchId,
        recipientId: req.user.id
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Collaboration request not found.' });
    }

    await match.update({
      status: resolvedStatus,
      contactDetail: resolvedStatus === 'accepted' ? (contactDetail || req.user.email) : match.contactDetail
    });

    res.json({
      message: resolvedStatus === 'accepted' ? 'Collaboration accepted! Contact shared.' : 'Collaboration request declined.',
      match,
      request: match
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all peer requests (received and sent)
 * Strictly redacts private email addresses unless the request is accepted.
 */
const getMyPeerMatches = async (req, res, next) => {
  try {
    const rawReceived = await MatchRequest.findAll({
      where: { recipientId: req.user.id },
      include: [
        { model: Opportunity, as: 'opportunity' },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email'],
          include: [{ model: StudentProfile, as: 'profile' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const rawSent = await MatchRequest.findAll({
      where: { requesterId: req.user.id },
      include: [
        { model: Opportunity, as: 'opportunity' },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'name', 'email'],
          include: [{ model: StudentProfile, as: 'profile' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Redact email unless mutually accepted
    const received = rawReceived.map(r => {
      const plain = r.toJSON();
      if (plain.status !== 'accepted') {
        if (plain.requester) delete plain.requester.email;
        delete plain.contactDetail;
      }
      return plain;
    });

    const sent = rawSent.map(s => {
      const plain = s.toJSON();
      if (plain.status !== 'accepted') {
        if (plain.recipient) delete plain.recipient.email;
        delete plain.contactDetail;
      }
      return plain;
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
 * Update or withdraw peer collaboration consent
 * (POST /api/peers/consent, DELETE /api/peers/consent)
 */
const updatePeerConsent = async (req, res, next) => {
  try {
    const consent = req.method === 'DELETE' ? false : Boolean(req.body.consent ?? req.body.peerMatchingConsent ?? req.body.isPublicForMatching);

    let profile = await StudentProfile.findOne({ where: { userId: req.user.id } });
    if (profile) {
      await profile.update({
        peerMatchingConsent: consent,
        isPublicForMatching: consent
      });
    }

    // If withdrawing consent, decline any pending incoming invites
    if (!consent) {
      await MatchRequest.update(
        { status: 'declined' },
        { where: { recipientId: req.user.id, status: 'pending' } }
      );
    }

    res.json({
      message: consent ? 'Peer matching consent enabled.' : 'Peer matching consent withdrawn.',
      peerMatchingConsent: consent
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPeerMatches,
  getOpportunityPeers: getPeerMatches,
  sendPeerRequest,
  respondToPeerRequest,
  getMyPeerMatches,
  updatePeerConsent
};
