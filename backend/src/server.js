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

    app.listen(PORT, () => {
      console.log(`[OpportunityX] Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[OpportunityX] Failed to initialize server:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
