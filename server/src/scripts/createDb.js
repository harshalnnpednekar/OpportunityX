/**
 * Database Creation Script
 * Connects to PostgreSQL server and ensures opportunityx and opportunityx_test databases exist.
 * Reads DATABASE_URL strictly from environment variables.
 */
const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('[CreateDB Error] Missing required environment variable: DATABASE_URL.');
  console.error('[CreateDB Error] Please set DATABASE_URL in server/.env (e.g. copied from server/.env.example).');
  process.exit(1);
}

async function createDatabases() {
  // Connect to default 'postgres' database on target host
  const parsed = new URL(dbUrl);
  const targetDbName = parsed.pathname.replace(/^\//, '') || 'opportunityx';
  const testDbName = `${targetDbName}_test`;

  parsed.pathname = '/postgres';
  const adminClient = new Client({ connectionString: parsed.toString() });

  try {
    console.log('[CreateDB] Connecting to PostgreSQL server...');
    await adminClient.connect();

    const dbsToCreate = [targetDbName, testDbName];
    for (const db of dbsToCreate) {
      const checkRes = await adminClient.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [db]
      );

      if (checkRes.rowCount === 0) {
        console.log(`[CreateDB] Database "${db}" does not exist. Creating...`);
        await adminClient.query(`CREATE DATABASE "${db}"`);
        console.log(`[CreateDB] Database "${db}" created successfully.`);
      } else {
        console.log(`[CreateDB] Database "${db}" already exists.`);
      }
    }
  } catch (err) {
    console.error('[CreateDB] Error checking/creating databases:', err.message);
    process.exit(1);
  } finally {
    await adminClient.end();
  }
}

if (require.main === module) {
  createDatabases().then(() => {
    console.log('[CreateDB] Completed.');
    process.exit(0);
  });
}

module.exports = createDatabases;
