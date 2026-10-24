const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[OpportunityX] Connecting to PostgreSQL database...');
    await sequelize.authenticate();
    console.log('[OpportunityX] Database connection established successfully.');

    // Sync schema in development (alter true keeps existing tables up to date)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('[OpportunityX] Database synchronized with models.');
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[OpportunityX] Fatal: Failed to connect to database in production:', err);
      process.exit(1);
    } else {
      console.warn('[OpportunityX] Warning: Could not connect to PostgreSQL. Starting in offline-db development mode.');
      console.warn(`[OpportunityX] Error details: ${err.message}`);
      console.warn('[OpportunityX] Start PostgreSQL and configure server/.env to use database-dependent features.');
    }
  }

  app.listen(PORT, () => {
    console.log(`[OpportunityX] Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
