const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results and return formatted 400 errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * UUID parameter validation helper
 */
const validateUuidParam = (paramName) => [
  param(paramName)
    .trim()
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  handleValidationErrors
];

/**
 * Authentication Validators
 */
const validateRegister = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty if provided'),
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Full name cannot be empty if provided'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Profile Update Validator (PATCH /api/profile)
 */
const validateProfileUpdate = [
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array of strings'),
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array of strings'),
  body('budgetMax')
    .optional()
    .isNumeric()
    .withMessage('budgetMax must be a numeric value'),
  body('availability')
    .optional()
    .isString()
    .withMessage('availability must be a string'),
  body('preferredFormat')
    .optional()
    .isString()
    .withMessage('preferredFormat must be a string'),
  body('preferredLocation')
    .optional()
    .isString()
    .withMessage('preferredLocation must be a string'),
  body('experienceLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'all'])
    .withMessage('experienceLevel must be beginner, intermediate, advanced, or all'),
  body('peerMatchingConsent')
    .optional()
    .isBoolean()
    .withMessage('peerMatchingConsent must be a boolean'),
  body('isPublicForMatching')
    .optional()
    .isBoolean()
    .withMessage('isPublicForMatching must be a boolean'),
  handleValidationErrors
];

/**
 * Opportunity Query Validator
 */
const validateOpportunityQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100'),
  query('remote')
    .optional()
    .isBoolean()
    .withMessage('remote must be true or false'),
  query('beginnerFriendly')
    .optional()
    .isBoolean()
    .withMessage('beginnerFriendly must be true or false'),
  query('lowCost')
    .optional()
    .isBoolean()
    .withMessage('lowCost must be true or false'),
  query('sustainabilityFocused')
    .optional()
    .isBoolean()
    .withMessage('sustainabilityFocused must be true or false'),
  query('sort')
    .optional()
    .isIn(['deadline', 'newest', 'title', 'match', 'relevance'])
    .withMessage('sort must be one of: deadline, newest, title, match, relevance'),
  handleValidationErrors
];

/**
 * Roadmap Task Update Validator
 */
const validateRoadmapTaskUpdate = [
  param('id')
    .trim()
    .isUUID()
    .withMessage('Roadmap id must be a valid UUID'),
  param('taskId')
    .trim()
    .isUUID()
    .withMessage('taskId must be a valid UUID'),
  body('isCompleted')
    .optional()
    .isBoolean()
    .withMessage('isCompleted must be a boolean'),
  handleValidationErrors
];

/**
 * Peer Matching Validators
 */
const validatePeerMatchesQuery = [
  query('opportunityId')
    .trim()
    .isUUID()
    .withMessage('opportunityId query parameter must be a valid UUID'),
  handleValidationErrors
];

const validatePeerRequest = [
  body('opportunityId')
    .trim()
    .isUUID()
    .withMessage('opportunityId is required and must be a valid UUID'),
  body().custom((value) => {
    const recipient = value.recipientId || value.receiverId;
    if (!recipient) {
      throw new Error('recipientId (or receiverId) is required');
    }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipient);
    if (!isUuid) {
      throw new Error('recipientId must be a valid UUID');
    }
    return true;
  }),
  body('message')
    .optional()
    .isString()
    .withMessage('message must be a string'),
  handleValidationErrors
];

const validatePeerRequestResponse = [
  param('id')
    .trim()
    .isUUID()
    .withMessage('Peer request id must be a valid UUID'),
  body().custom((value) => {
    const action = value.status || value.action;
    if (!action || !['accepted', 'declined'].includes(action)) {
      throw new Error("Action/status must be either 'accepted' or 'declined'");
    }
    return true;
  }),
  handleValidationErrors
];

/**
 * Admin Feed Import Validator
 * Strictly validates against a local feed identifier whitelist; rejects arbitrary paths.
 */
const ALLOWED_FEED_IDENTIFIERS = [
  'sample-json-a',
  'sample-xml-a',
  'sample-json-b',
  'hackathons',
  'competitions',
  'workshops',
  'all',
  'all-default-feeds'
];

const validateAdminFeedImport = [
  body().custom((value) => {
    const feedId = value.feedId || value.feedIdentifier || value.feedName || value.feed;
    if (!feedId) {
      throw new Error('A valid feed identifier (e.g. sample-json-a) is required.');
    }
    // Block any path traversal characters
    if (typeof feedId !== 'string' || feedId.includes('/') || feedId.includes('\\') || feedId.includes('..')) {
      throw new Error('Untrusted or invalid filesystem path specified. Only registered feed identifiers are permitted.');
    }
    const normalized = feedId.toLowerCase().trim();
    if (!ALLOWED_FEED_IDENTIFIERS.includes(normalized)) {
      throw new Error(`Unrecognized feed identifier: "${feedId}". Allowed feeds: ${ALLOWED_FEED_IDENTIFIERS.join(', ')}`);
    }
    return true;
  }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUuidParam,
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateOpportunityQuery,
  validateRoadmapTaskUpdate,
  validatePeerMatchesQuery,
  validatePeerRequest,
  validatePeerRequestResponse,
  validateAdminFeedImport,
  ALLOWED_FEED_IDENTIFIERS
};
