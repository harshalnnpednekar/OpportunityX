const { Profile, User } = require('../models');

/**
 * Get profile for logged-in user
 */
const getProfile = async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      profile = await Profile.create({
        userId: req.user.id,
        fullName: req.user.name || '',
        skills: [],
        interests: []
      });
    }
    res.json({ profile });
  } catch (err) {
    next(err);
  }
};

/**
 * Update profile for logged-in user (supports PATCH and PUT)
 */
const updateProfile = async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      profile = await Profile.create({
        userId: req.user.id,
        fullName: req.user.name || '',
        skills: [],
        interests: []
      });
    }

    const {
      name,
      fullName,
      bio,
      educationLevel,
      university,
      major,
      graduationYear,
      country,
      skills,
      interests,
      budgetMax,
      availability,
      preferredFormat,
      formatPreference,
      preferredLocation,
      experienceLevel,
      peerMatchingConsent,
      isPublicForMatching,
      matchingBio,
      githubUrl,
      portfolioUrl
    } = req.body;

    const resolvedName = name !== undefined ? name : fullName;
    if (resolvedName !== undefined && resolvedName !== req.user.name) {
      await User.update({ name: resolvedName }, { where: { id: req.user.id } });
    }

    const consent = peerMatchingConsent !== undefined
      ? Boolean(peerMatchingConsent)
      : (isPublicForMatching !== undefined ? Boolean(isPublicForMatching) : profile.peerMatchingConsent);

    const format = preferredFormat !== undefined
      ? preferredFormat
      : (formatPreference !== undefined ? formatPreference : profile.preferredFormat);

    await profile.update({
      fullName: resolvedName !== undefined ? resolvedName : profile.fullName,
      bio: bio !== undefined ? bio : profile.bio,
      educationLevel: educationLevel !== undefined ? educationLevel : profile.educationLevel,
      university: university !== undefined ? university : profile.university,
      major: major !== undefined ? major : profile.major,
      graduationYear: graduationYear !== undefined ? parseInt(graduationYear, 10) : profile.graduationYear,
      country: country !== undefined ? country : profile.country,
      skills: Array.isArray(skills) ? skills : profile.skills,
      interests: Array.isArray(interests) ? interests : profile.interests,
      budgetMax: budgetMax !== undefined ? parseFloat(budgetMax) : profile.budgetMax,
      availability: availability !== undefined ? availability : profile.availability,
      preferredFormat: format,
      formatPreference: format,
      preferredLocation: preferredLocation !== undefined ? preferredLocation : profile.preferredLocation,
      experienceLevel: experienceLevel !== undefined ? experienceLevel : profile.experienceLevel,
      peerMatchingConsent: consent,
      isPublicForMatching: consent,
      matchingBio: matchingBio !== undefined ? matchingBio : profile.matchingBio,
      githubUrl: githubUrl !== undefined ? githubUrl : profile.githubUrl,
      portfolioUrl: portfolioUrl !== undefined ? portfolioUrl : profile.portfolioUrl
    });

    res.json({
      message: 'Profile updated successfully.',
      profile
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile
};
