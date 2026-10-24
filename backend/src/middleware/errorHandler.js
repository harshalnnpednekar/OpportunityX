/**
 * Centralized application error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Logger]', {
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => e.message)
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Unique constraint violation',
      details: err.errors.map(e => e.message)
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : (process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message);

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
