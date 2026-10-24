const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

dotenv.config();

const app = express();

// Configure CORS from environment variables with safe defaults
const parseAllowedOrigins = () => {
  const envOrigins = (process.env.CLIENT_URL || process.env.CORS_ORIGIN || '')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  return Array.from(new Set([...defaultOrigins, ...envOrigins]));
};

const allowedOrigins = parseAllowedOrigins();

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser agents, CLI tools, tests, and same-origin requests
    if (!origin) return callback(null, true);

    // Explicit wildcard or exact match
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow localhost or local IP origins in non-production environments
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (does not log passwords, tokens, or sensitive user data)
app.use(requestLogger);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'OpportunityX Platform API',
    description: 'Intelligent Discovery of Practical Learning Opportunities',
    status: 'online',
    version: '1.0.0',
    healthCheck: '/api/health'
  });
});

// Primary API Router
app.use('/api', routes);

// 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
