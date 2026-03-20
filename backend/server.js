const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3001);

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

const server = http.createServer((request, response) => {
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
    sendJson(response, 200, {
      status: 'ok',
      service: 'testflow-backend',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/info') {
    sendJson(response, 200, {
      name: 'TestFlow backend scaffold',
      version: '1.0.0',
      notes: 'Current frontend still works fully in local-first mode via localStorage.',
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
