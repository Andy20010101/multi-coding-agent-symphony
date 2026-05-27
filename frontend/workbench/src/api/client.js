import {
  READONLY_API_ROUTES,
  projectWorkbenchContracts
} from './contracts.js';

const READONLY_ERROR_MESSAGE = '读取失败 / contract 未暴露 / 不可用';

export async function fetchReadonlyRoute(route, {
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== 'function') {
    return readonlyError({
      route,
      message: READONLY_ERROR_MESSAGE
    });
  }

  let response;

  try {
    response = await fetchImpl(route.path, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json'
      }
    });
  } catch {
    return readonlyError({
      route,
      message: READONLY_ERROR_MESSAGE
    });
  }

  if (!response.ok) {
    return readonlyError({
      route,
      httpStatus: response.status,
      message: READONLY_ERROR_MESSAGE
    });
  }

  let data;

  try {
    data = await response.json();
  } catch {
    return readonlyError({
      route,
      httpStatus: response.status,
      message: READONLY_ERROR_MESSAGE
    });
  }

  if (route.contractName && data?.contractName !== route.contractName) {
    return readonlyError({
      route,
      httpStatus: response.status,
      message: READONLY_ERROR_MESSAGE
    });
  }

  return {
    ok: true,
    route: route.path,
    method: route.method,
    httpStatus: response.status,
    data
  };
}

export async function fetchWorkbenchContracts(options = {}) {
  const entries = await Promise.all(
    READONLY_API_ROUTES.map(async (route) => [
      route.id,
      await fetchReadonlyRoute(route, options)
    ])
  );

  return projectWorkbenchContracts(Object.fromEntries(entries));
}

function readonlyError({ route, httpStatus = null, message }) {
  return {
    ok: false,
    route: route.path,
    method: route.method,
    httpStatus,
    message,
    readonly: true
  };
}

export { READONLY_API_ROUTES };
