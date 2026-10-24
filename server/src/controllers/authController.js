const { User, Profile } = require('../models');
const { generateToken } = require('../middleware/auth');

/**
 * Register a new student account
 */
const register = async (req, res, next) => {
  try {
    const { email, password, fullName, educationLevel, university, major, skills, interests } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: 'student'
    });

    const profile = await Profile.create({
      userId: user.id,
      fullName: fullName.trim(),
      educationLevel: educationLevel || 'undergraduate',
      university: university || '',
      major: major || '',
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : []
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: user.id,
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

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

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
 * Get currently authenticated user details
 */
const getMe = async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user.id,
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
  getMe
};
