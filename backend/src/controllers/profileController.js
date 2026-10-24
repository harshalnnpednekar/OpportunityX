const { Profile } = require('../models');

/**
 * Get profile for logged-in user
 */
const getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    res.json({ profile });
  } catch (err) {
    next(err);
  }
};

/**
 * Update profile for logged-in user
 */
const updateProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const {
      fullName,
      bio,
      educationLevel,
      university,
      major,
      graduationYear,
      country,
      skills,
      interests,
      formatPreference,
      isPublicForMatching,
      matchingBio,
      githubUrl,
      portfolioUrl
    } = req.body;

    await profile.update({
      fullName: fullName !== undefined ? fullName : profile.fullName,
      bio: bio !== undefined ? bio : profile.bio,
      educationLevel: educationLevel !== undefined ? educationLevel : profile.educationLevel,
      university: university !== undefined ? university : profile.university,
      major: major !== undefined ? major : profile.major,
      graduationYear: graduationYear !== undefined ? parseInt(graduationYear, 10) : profile.graduationYear,
      country: country !== undefined ? country : profile.country,
      skills: Array.isArray(skills) ? skills : profile.skills,
      interests: Array.isArray(interests) ? interests : profile.interests,
      formatPreference: formatPreference !== undefined ? formatPreference : profile.formatPreference,
      isPublicForMatching: isPublicForMatching !== undefined ? Boolean(isPublicForMatching) : profile.isPublicForMatching,
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
