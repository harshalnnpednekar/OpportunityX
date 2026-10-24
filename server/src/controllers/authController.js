const { User, Profile } = require('../models');
const { generateToken, getCookieOptions, getClearCookieOptions } = require('../middleware/auth');

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
      formatPreference,
      preferredLocation,
      experienceLevel,
      budgetMax,
      availability,
      peerMatchingConsent,
      isPublicForMatching
    } = req.body;

    const displayName = (name || fullName || '').trim();
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: displayName,
      email: normalizedEmail,
      passwordHash: password,
      role: 'student',
      status: 'active'
    });

    const format = preferredFormat || formatPreference || 'all';
    const consent = peerMatchingConsent !== undefined ? Boolean(peerMatchingConsent) : Boolean(isPublicForMatching);

    const profile = await Profile.create({
      userId: user.id,
      fullName: displayName,
      educationLevel: educationLevel || 'undergraduate',
      university: university || '',
      major: major || '',
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : [],
      budgetMax: budgetMax !== undefined ? parseFloat(budgetMax) : 0.00,
      availability: availability || 'flexible',
      preferredFormat: format,
      formatPreference: format,
      preferredLocation: preferredLocation || 'Global',
      experienceLevel: experienceLevel || 'beginner',
      peerMatchingConsent: consent,
      isPublicForMatching: consent
    });

    const token = generateToken(user);

    // Send secure httpOnly cookie
    res.cookie('token', token, getCookieOptions());

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
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

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact an administrator.' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    // Send secure httpOnly cookie
    res.cookie('token', token, getCookieOptions());

    res.json({
      message: 'Signed in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Log out and clear active session cookie
 */
const logout = async (req, res) => {
  res.clearCookie('token', getClearCookieOptions());
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
        status: req.user.status,
        profile: req.user.profile
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete currently authenticated user's own account (subject to safety safeguards)
 */
const deleteMyAccount = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      const activeAdminCount = await User.count({
        where: {
          role: 'admin',
          status: 'active'
        }
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last active administrator account.' });
      }
    }

    await User.destroy({ where: { id: req.user.id } });
    res.clearCookie('token', getClearCookieOptions());

    res.json({
      message: 'Your account has been permanently deleted.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  deleteMyAccount
};
