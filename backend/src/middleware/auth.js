const jwt = require('jsonwebtoken');
const { User, Profile } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'opportunityx_super_secret_jwt_key_2026_production_grade';

/**
 * Required authentication middleware
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Profile, as: 'profile' }]
    });

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

/**
 * Optional authentication middleware (for guest browsing with recommendation boosts if logged in)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        include: [{ model: Profile, as: 'profile' }]
      });
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // Silently continue for optional auth
  }
  next();
};

/**
 * Helper to generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  requireAuth,
  optionalAuth,
  generateToken
};
