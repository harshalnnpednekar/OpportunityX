const { User, Profile } = require('../models');
const { generateToken } = require('../middleware/auth');

/**
 * Register a new student account
 */
const register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      name,
      fullName,
      educationLevel,
      university,
      major,
      skills,
      interests,
      preferredFormat,
      experienceLevel,
      peerMatchingConsent
    } = req.body;

    const displayName = (name || fullName || '').trim();

    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: displayName,
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: 'student'
    });

    const profile = await Profile.create({
      userId: user.id,
      fullName: displayName,
      educationLevel: educationLevel || 'undergraduate',
      university: university || '',
      major: major || '',
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : [],
      preferredFormat: preferredFormat || 'all',
      formatPreference: preferredFormat || 'all',
      experienceLevel: experienceLevel || 'beginner',
      peerMatchingConsent: Boolean(peerMatchingConsent),
      isPublicForMatching: Boolean(peerMatchingConsent)
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Log in with email and password
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
      include: [{ model: Profile, as: 'profile' }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Signed in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Log out
 */
const logout = async (req, res) => {
  res.json({
    message: 'Logged out successfully.'
  });
};

/**
 * Get currently authenticated user details
 */
const getMe = async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profile: req.user.profile
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe
};
