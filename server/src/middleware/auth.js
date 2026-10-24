const jwt = require('jsonwebtoken');
const { User, StudentProfile } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'opportunityx_super_secret_jwt_key_2026_production_grade';

/**
 * Standard cookie configuration
 * Uses httpOnly, SameSite, and Secure flags in production.
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  };
};

const getClearCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  };
};

/**
 * Extracts authentication token from either httpOnly cookie or Authorization Bearer header
 */
const extractToken = (req) => {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

/**
 * Required authentication middleware
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.userId, {
      include: [{ model: StudentProfile, as: 'profile' }]
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
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        include: [{ model: StudentProfile, as: 'profile' }]
      });
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // Continue silently for optional auth
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
  generateToken,
  getCookieOptions,
  getClearCookieOptions,
  extractToken
};
