const fs = require('fs');
const path = require('path');
const { query, closePool } = require('../db/pool');
const { isDatabaseConfigured } = require('../lib/env');

async function main() {
  if (!isDatabaseConfigured()) {
    throw new Error('PostgreSQL is not configured. Fill in backend/.env first.');
  }

  const schemaPath = path.resolve(__dirname, '../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await query(schema);
  console.log('Database schema initialized successfully.');
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
