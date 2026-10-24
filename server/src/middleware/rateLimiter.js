/**
 * Rate Limiting Middleware
 * In-memory sliding window rate limiter for protecting sensitive routes (e.g. auth).
 */

const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const max = options.max || 30; // 30 requests per window
  const message = options.message || 'Too many requests from this IP, please try again later.';

  // Map of ip -> array of request timestamps
  const hits = new Map();

  // Periodically clean up stale records every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits.entries()) {
      const activeTimestamps = timestamps.filter(ts => now - ts < windowMs);
      if (activeTimestamps.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, activeTimestamps);
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    // Skip in test environment unless explicitly testing rate limiter
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();

    const clientTimestamps = (hits.get(ip) || []).filter(ts => now - ts < windowMs);

    if (clientTimestamps.length >= max) {
      const oldestTs = clientTimestamps[0];
      const retryAfterSec = Math.ceil((windowMs - (now - oldestTs)) / 1000);

      res.setHeader('Retry-After', Math.max(1, retryAfterSec));
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', 0);
      res.setHeader('RateLimit-Reset', Math.ceil((oldestTs + windowMs) / 1000));

      return res.status(429).json({
        error: message,
        retryAfterSeconds: Math.max(1, retryAfterSec)
      });
    }

    clientTimestamps.push(now);
    hits.set(ip, clientTimestamps);

    const remaining = Math.max(0, max - clientTimestamps.length);
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);

    next();
  };
};

// Specialized auth rate limiter
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts from this IP, please try again in 15 minutes.'
});

module.exports = {
  createRateLimiter,
  authRateLimiter
};
