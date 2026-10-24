/**
 * Centralized application error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // If response has already started sending, delegate to Express built-in handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine status code
  let statusCode = err.statusCode || err.status || 500;
  if (statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  // Log error without sensitive fields
  console.error(`[Error] ${req.method} ${req.originalUrl} (${statusCode}):`, {
    message: err.message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });

  // Malformed JSON body handling
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    return res.status(400).json({
      error: 'Malformed JSON payload in request body'
    });
  }

  // Sequelize ORM validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors ? err.errors.map(e => e.message) : [err.message]
    });
  }

  // Sequelize Unique Constraint violations
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Unique constraint violation',
      details: err.errors ? err.errors.map(e => e.message) : [err.message]
    });
  }

  // CORS origin block
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({
      error: err.message
    });
  }

  const message = err.isOperational || statusCode < 500
    ? err.message
    : (process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message);

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
