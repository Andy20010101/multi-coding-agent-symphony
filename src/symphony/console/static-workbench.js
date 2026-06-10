import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isMissingFileError } from './errors.js';
import { writeJsonResponse } from './response.js';

const WORKBENCH_STATIC_ROOT = fileURLToPath(new URL('../workbench-static/', import.meta.url));
const WORKBENCH_ROUTE_PREFIX = '/workbench';

export async function writeWorkbenchStaticResponse({ response, pathname }) {
  const decision = resolveWorkbenchStaticRequest(pathname);

  if (decision.statusCode !== 200) {
    writeJsonResponse(response, decision.statusCode, {
      status: decision.status,
      message: decision.message
    });
    return;
  }

  try {
    const metadata = await stat(decision.filePath);

    if (!metadata.isFile()) {
      writeJsonResponse(response, 404, {
        status: 'missing',
        message: 'workbench static file not found'
      });
      return;
    }

    await writeWorkbenchFileResponse({
      response,
      filePath: decision.filePath,
      relativePath: decision.relativePath
    });
  } catch (error) {
    if (decision.fallbackToIndex === true && isMissingFileError(error)) {
      const indexPath = resolve(WORKBENCH_STATIC_ROOT, 'index.html');
      await writeWorkbenchFileResponse({
        response,
        filePath: indexPath,
        relativePath: 'index.html'
      });
      return;
    }

    if (isMissingFileError(error)) {
      writeJsonResponse(response, 404, {
        status: 'missing',
        message: 'workbench static file not found'
      });
      return;
    }

    throw error;
  }
}

function resolveWorkbenchStaticRequest(pathname) {
  const rootPath = resolve(WORKBENCH_STATIC_ROOT);
  const rawRelativePath = pathname === WORKBENCH_ROUTE_PREFIX
    ? ''
    : pathname.slice(`${WORKBENCH_ROUTE_PREFIX}/`.length);

  if (pathname.includes('\\') || /%5c/iu.test(pathname)) {
    return forbiddenWorkbenchPath('workbench static path is outside the allowed directory');
  }

  let decodedRelativePath;

  try {
    decodedRelativePath = decodeURIComponent(rawRelativePath);
  } catch {
    return {
      statusCode: 400,
      status: 'invalid-path',
      message: 'workbench static path is invalid'
    };
  }

  if (isUnsafeWorkbenchStaticPath(decodedRelativePath)) {
    return forbiddenWorkbenchPath('workbench static path is outside the allowed directory');
  }

  if (isRejectedLocalFileProbe(decodedRelativePath)) {
    return {
      statusCode: 404,
      status: 'missing',
      message: 'workbench static file not found'
    };
  }

  const relativePath = decodedRelativePath === '' ? 'index.html' : decodedRelativePath;
  const filePath = resolve(rootPath, relativePath);

  if (!isPathInsideRoot({ rootPath, filePath })) {
    return forbiddenWorkbenchPath('workbench static path is outside the allowed directory');
  }

  return {
    statusCode: 200,
    filePath,
    relativePath,
    fallbackToIndex: shouldFallbackToWorkbenchIndex(relativePath)
  };
}

export function isWorkbenchRoute(pathname) {
  return pathname === WORKBENCH_ROUTE_PREFIX || pathname.startsWith(`${WORKBENCH_ROUTE_PREFIX}/`);
}

function forbiddenWorkbenchPath(message) {
  return {
    statusCode: 403,
    status: 'forbidden',
    message
  };
}

function isUnsafeWorkbenchStaticPath(relativePath) {
  if (relativePath.includes('\0')
    || relativePath.startsWith('/')
    || /^[A-Za-z]:\//u.test(relativePath)
    || relativePath.split('/').some((part) => part === '..')) {
    return true;
  }

  return false;
}

function isRejectedLocalFileProbe(relativePath) {
  const [firstPart] = relativePath.split('/');

  return firstPart === 'src'
    || firstPart === 'docs'
    || firstPart === 'package.json'
    || firstPart === 'pnpm-lock.yaml';
}

function isPathInsideRoot({ rootPath, filePath }) {
  return filePath === rootPath || filePath.startsWith(`${rootPath}${sep}`);
}

function shouldFallbackToWorkbenchIndex(relativePath) {
  return relativePath !== 'index.html'
    && !relativePath.startsWith('assets/')
    && relativePath !== 'assets'
    && extname(relativePath) === '';
}

async function writeWorkbenchFileResponse({ response, filePath, relativePath }) {
  const content = await readFile(filePath);

  response.writeHead(200, {
    'content-type': workbenchContentType(relativePath),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  response.end(content);
}

function workbenchContentType(relativePath) {
  switch (extname(relativePath).toLowerCase()) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
    case '.mjs':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}
