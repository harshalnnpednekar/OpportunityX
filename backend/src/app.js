const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Allowed origins
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Root notice
app.get('/', (req, res) => {
  res.json({
    app: 'OpportunityX Platform API',
    description: 'Intelligent Discovery of Practical Learning Opportunities',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// API Routes
app.use('/api', routes);

// 404 Handler for undefined API routes
app.use((req, res, next) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
