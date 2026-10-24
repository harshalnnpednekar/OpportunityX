const path = require('path');
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment configuration from server folder or current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const isTest = process.env.NODE_ENV === 'test';
const dbUrl = isTest
  ? (process.env.TEST_DATABASE_URL || process.env.DATABASE_URL)
  : process.env.DATABASE_URL;

if (!dbUrl) {
  const missingVar = isTest ? 'TEST_DATABASE_URL (or DATABASE_URL)' : 'DATABASE_URL';
  throw new Error(
    `[Database Configuration Error] Missing required environment variable: ${missingVar}. ` +
    `Please configure ${missingVar} in server/.env (see server/.env.example).`
  );
}

const isRender = typeof dbUrl === 'string' && dbUrl.includes('render.com');

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  dialectOptions: isRender ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = {
  sequelize,
  dbUrl
};
