import { createServer } from 'node:http';

import { writeApiErrorResponse } from './response.js';

const POST_METHOD_NOT_ALLOWED_MESSAGE = 'Console API is read-only except controlled result intake preview, controlled result intake confirm, controlled goal event plan confirm, controlled implementation run confirm, controlled verification run confirm, controlled provider runner confirm, controlled adoption plan freeze, and controlled adoption confirm.';
const READONLY_METHOD_NOT_ALLOWED_MESSAGE = 'Console API is read-only.';

export function createConsoleHttpServer(handleRequest) {
  return createServer(handleRequest);
}

export async function startConsoleHttpServer({
  server,
  host,
  port
}) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  const actualPort = typeof address === 'object' && address !== null ? address.port : port;

  return {
    server,
    host,
    port: actualPort,
    url: `http://${host}:${actualPort}/`
  };
}

export function writeConsoleMethodNotAllowedResponse({
  response,
  route,
  method
}) {
  writeApiErrorResponse(response, {
    status: 405,
    code: 'method-not-allowed',
    message: method === 'POST'
      ? POST_METHOD_NOT_ALLOWED_MESSAGE
      : READONLY_METHOD_NOT_ALLOWED_MESSAGE,
    route,
    method
  });
}
