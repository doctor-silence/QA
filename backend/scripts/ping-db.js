const { checkDatabaseConnection, closePool } = require('../db/pool');

async function main() {
  const status = await checkDatabaseConnection();
  console.log(JSON.stringify(status, null, 2));
  if (status.configured && !status.connected) {
    process.exitCode = 1;
  }
}

main().finally(async () => {
  await closePool();
});
