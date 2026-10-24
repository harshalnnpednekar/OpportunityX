/**
 * Request Logger Middleware
 * Logs incoming HTTP requests and response status/timing.
 * Safely redacts passwords, tokens, secrets, and sensitive user data.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'passwordhash',
  'token',
  'jwt',
  'secret',
  'authorization',
  'cookie',
  'apikey',
  'accesstoken',
  'refreshtoken',
  'creditcard',
  'cardnumber',
  'cvv',
  'ssn'
]);

/**
 * Recursively redacts sensitive keys from an object or array.
 */
function sanitize(obj, depth = 0) {
  if (depth > 5 || !obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, depth + 1));
  }

  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      cleaned[key] = sanitize(val, depth + 1);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

function requestLogger(req, res, next) {
  const startTime = Date.now();
  const { method, originalUrl } = req;

  // Log on response completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    const logLine = `[HTTP] ${method} ${originalUrl} ${statusColor}${statusCode}${resetColor} - ${duration}ms`;

    // Only log query / body metadata if present, and strictly sanitized
    if (process.env.NODE_ENV !== 'production' && req.body && Object.keys(req.body).length > 0) {
      const safeBody = sanitize(req.body);
      console.log(`${logLine} | Payload:`, JSON.stringify(safeBody));
    } else {
      console.log(logLine);
    }
  });

  next();
}

module.exports = {
  requestLogger,
  sanitize
};
