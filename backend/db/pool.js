const { Pool } = require('pg');
const { getPgConfig, isDatabaseConfigured } = require('../lib/env');

let pool;

function getPool() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!pool) {
    pool = new Pool(getPgConfig());
  }

  return pool;
}

async function query(text, params = []) {
  const currentPool = getPool();
  if (!currentPool) {
    throw new Error('Database is not configured');
  }

  return currentPool.query(text, params);
}

async function checkDatabaseConnection() {
  if (!isDatabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      message: 'PostgreSQL env vars are not configured',
    };
  }

  try {
    const result = await query('SELECT current_database() AS database_name, NOW() AS server_time');
    return {
      configured: true,
      connected: true,
      database: result.rows[0].database_name,
      serverTime: result.rows[0].server_time,
      message: 'Database connection is healthy',
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      message: error.message,
    };
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  query,
  checkDatabaseConnection,
  closePool,
};
