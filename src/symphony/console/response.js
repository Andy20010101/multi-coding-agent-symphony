import { buildErrorEnvelope } from '../error-envelope.js';

export function writeHtmlResponse(response, html) {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(html);
}

export function writeJsonResponse(response, statusCode, value) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

export function writeApiErrorResponse(response, {
  status,
  code,
  message,
  route,
  method,
  safeDetails
}) {
  writeJsonResponse(response, status, buildErrorEnvelope({
    code,
    message,
    status,
    route,
    method,
    safeDetails
  }));
}
