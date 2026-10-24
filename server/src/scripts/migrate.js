/**
 * Repeatable Migration Runner
 * Tracks executed migrations in sequelize_meta table.
 * Supports up, --undo, and --undo-all.
 */
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');
const META_TABLE = 'sequelize_meta';

async function ensureMetaTable(queryInterface) {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map(t => (typeof t === 'string' ? t : t.tableName || t.name));

  if (!normalized.includes(META_TABLE)) {
    await queryInterface.createTable(META_TABLE, {
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      }
    });
  }
}

async function getExecutedMigrations() {
  const [results] = await sequelize.query(`SELECT name FROM "${META_TABLE}" ORDER BY name ASC`);
  return results.map(r => r.name);
}

async function recordMigration(name) {
  await sequelize.query(`INSERT INTO "${META_TABLE}" (name) VALUES (:name)`, {
    replacements: { name }
  });
}

async function removeMigration(name) {
  await sequelize.query(`DELETE FROM "${META_TABLE}" WHERE name = :name`, {
    replacements: { name }
  });
}

async function runMigrations() {
  const queryInterface = sequelize.getQueryInterface();
  const args = process.argv.slice(2);
  const isUndo = args.includes('--undo');
  const isUndoAll = args.includes('--undo-all');

  try {
    console.log('[Migrate] Connecting to database...');
    await sequelize.authenticate();
    await ensureMetaTable(queryInterface);

    const executed = await getExecutedMigrations();
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.js'))
      .sort();

    if (isUndoAll) {
      console.log('[Migrate] Rolling back ALL executed migrations...');
      const toRevert = [...executed].reverse();
      for (const name of toRevert) {
        const filePath = path.join(MIGRATIONS_DIR, name);
        if (fs.existsSync(filePath)) {
          const migration = require(filePath);
          console.log(`[Migrate] Reverting ${name}...`);
          await migration.down(queryInterface, Sequelize);
          await removeMigration(name);
          console.log(`[Migrate] Reverted ${name}.`);
        }
      }
      console.log('[Migrate] All migrations reverted.');
      return;
    }

    if (isUndo) {
      if (executed.length === 0) {
        console.log('[Migrate] No executed migrations to revert.');
        return;
      }
      const last = executed[executed.length - 1];
      const filePath = path.join(MIGRATIONS_DIR, last);
      const migration = require(filePath);
      console.log(`[Migrate] Reverting last migration: ${last}...`);
      await migration.down(queryInterface, Sequelize);
      await removeMigration(last);
      console.log(`[Migrate] Reverted ${last} successfully.`);
      return;
    }

    // Default: UP migrations
    const pending = files.filter(f => !executed.includes(f));
    if (pending.length === 0) {
      console.log('[Migrate] Database schema is up to date. No pending migrations.');
      return;
    }

    console.log(`[Migrate] Found ${pending.length} pending migration(s):`);
    for (const name of pending) {
      console.log(`[Migrate] Executing ${name}...`);
      const migration = require(path.join(MIGRATIONS_DIR, name));
      await migration.up(queryInterface, Sequelize);
      await recordMigration(name);
      console.log(`[Migrate] Executed ${name} successfully.`);
    }

    console.log('[Migrate] All migrations completed successfully.');
  } catch (err) {
    console.error('[Migrate] Migration failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
