const http = require('http');
const { URL } = require('url');

const { env, getPublicDatabaseConfig } = require('./lib/env');
const { checkDatabaseConnection, closePool } = require('./db/pool');

const PORT = env.port;

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(body);
}

async function getHealthPayload() {
  const database = await checkDatabaseConnection();

  return {
    status: database.connected || !database.configured ? 'ok' : 'degraded',
    service: 'testflow-backend',
    timestamp: new Date().toISOString(),
    database,
  };
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    response.end();
    return;
  }

  if (request.method === 'GET' && (requestUrl.pathname === '/' || requestUrl.pathname === '/health' || requestUrl.pathname === '/api/health')) {
    const payload = await getHealthPayload();
    sendJson(response, payload.status === 'ok' ? 200 : 503, payload);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/db/health') {
    const database = await checkDatabaseConnection();
    sendJson(response, database.connected || !database.configured ? 200 : 503, database);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/info') {
    sendJson(response, 200, {
      name: 'TestFlow backend scaffold',
      version: '1.0.0',
      notes: 'Current frontend still works fully in local-first mode via localStorage.',
      database: getPublicDatabaseConfig(),
    });
    return;
  }

  sendJson(response, 404, {
    status: 'error',
    message: 'Route not found',
    path: requestUrl.pathname,
  });
});

server.listen(PORT, () => {
  console.log(`TestFlow backend running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});
