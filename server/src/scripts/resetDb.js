/**
 * Database Reset Script
 * Drops existing tables, runs all migrations, and optionally seeds demo data.
 */
const { sequelize } = require('../config/database');
const path = require('path');
const fs = require('fs');

async function resetDatabase() {
  const queryInterface = sequelize.getQueryInterface();
  const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

  try {
    console.log('[ResetDB] Connecting to database...');
    await sequelize.authenticate();

    console.log('[ResetDB] Dropping all tables (CASCADE)...');
    await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');

    console.log('[ResetDB] Re-running all migrations from scratch...');
    // Ensure sequelize_meta exists
    await queryInterface.createTable('sequelize_meta', {
      name: {
        type: require('sequelize').STRING,
        allowNull: false,
        primaryKey: true
      }
    });

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.js'))
      .sort();

    for (const file of files) {
      console.log(`[ResetDB] Applying migration ${file}...`);
      const migration = require(path.join(MIGRATIONS_DIR, file));
      await migration.up(queryInterface, require('sequelize'));
      await sequelize.query('INSERT INTO "sequelize_meta" (name) VALUES (:name)', {
        replacements: { name: file }
      });
    }

    console.log('[ResetDB] Database schema reset and migrations applied.');

    // If --seed passed, seed demo data
    if (process.argv.includes('--seed')) {
      console.log('[ResetDB] Running database seeder...');
      const seed = require('../seeders/seed');
      await seed();
    }

    console.log('[ResetDB] Database reset complete.');
  } catch (err) {
    console.error('[ResetDB] Reset failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;
