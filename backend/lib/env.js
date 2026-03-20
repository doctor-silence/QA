const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3001),
  databaseUrl: process.env.DATABASE_URL || '',
  dbHost: process.env.POSTGRES_HOST || '127.0.0.1',
  dbPort: toNumber(process.env.POSTGRES_PORT, 5432),
  dbName: process.env.POSTGRES_DB || 'testflow',
  dbUser: process.env.POSTGRES_USER || 'postgres',
  dbPassword: process.env.POSTGRES_PASSWORD || '',
  dbSsl: String(process.env.POSTGRES_SSL || 'false').toLowerCase() === 'true',
  dbPoolMax: toNumber(process.env.POSTGRES_POOL_MAX, 10),
};

function isDatabaseConfigured() {
  return Boolean(
    process.env.DATABASE_URL
      || process.env.POSTGRES_HOST
      || process.env.POSTGRES_PORT
      || process.env.POSTGRES_DB
      || process.env.POSTGRES_USER
      || process.env.POSTGRES_PASSWORD
  );
}

function getPgConfig() {
  if (env.databaseUrl) {
    return {
      connectionString: env.databaseUrl,
      ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
      max: env.dbPoolMax,
    };
  }

  return {
    host: env.dbHost,
    port: env.dbPort,
    database: env.dbName,
    user: env.dbUser,
    password: env.dbPassword,
    ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
    max: env.dbPoolMax,
  };
}

function getPublicDatabaseConfig() {
  return {
    configured: isDatabaseConfigured(),
    host: env.databaseUrl ? 'DATABASE_URL' : env.dbHost,
    port: env.databaseUrl ? null : env.dbPort,
    database: env.databaseUrl ? null : env.dbName,
    user: env.databaseUrl ? null : env.dbUser,
    ssl: env.dbSsl,
    poolMax: env.dbPoolMax,
  };
}

module.exports = {
  env,
  isDatabaseConfigured,
  getPgConfig,
  getPublicDatabaseConfig,
};
