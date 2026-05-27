import {
  GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
  READONLY_API_ROUTES,
  RUN_TIMELINE_ROUTE_TEMPLATE,
  createGuidedGoalHandoffRoute,
  createRunTimelineRoute,
  createSafeArtifactPreviewRoutes,
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

  if (!response.ok && !acceptsReadonlyErrorContract({ route, data })) {
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
    routeDescriptor: route,
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

  const results = Object.fromEntries(entries);
  const guidedGoalHandoffRoute = createGuidedGoalHandoffRoute(results.handoffRefs?.data);
  const latestRunId = latestRunIdFromResults(results);
  const timelineRoute = createRunTimelineRoute(latestRunId);

  results.guidedGoalHandoff = guidedGoalHandoffRoute === null
    ? readonlySkipped({
        route: GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
        message: 'guided handoff ref 未暴露 / 不可用'
      })
    : await fetchReadonlyRoute(guidedGoalHandoffRoute, options);

  results.latestRunTimeline = timelineRoute === null
    ? readonlySkipped({
        route: RUN_TIMELINE_ROUTE_TEMPLATE,
        message: '暂无 timeline / 未暴露 / 不可用'
      })
    : await fetchReadonlyRoute(timelineRoute, options);

  const safeArtifactPreviewRoutes = createSafeArtifactPreviewRoutes(results.latestRun?.data?.run?.artifactRefs);

  results.safeArtifactPreviews = await Promise.all(
    safeArtifactPreviewRoutes.map((route) => fetchReadonlyRoute(route, options))
  );

  return projectWorkbenchContracts(results);
}

function readonlyError({ route, httpStatus = null, message }) {
  return {
    ok: false,
    route: route.path,
    method: route.method,
    routeDescriptor: route,
    httpStatus,
    message,
    readonly: true
  };
}

function readonlySkipped({ route, message }) {
  return {
    ok: false,
    skipped: true,
    route: route.path,
    method: route.method,
    routeDescriptor: route,
    httpStatus: null,
    message,
    readonly: true
  };
}

function latestRunIdFromResults(results) {
  const runId = results.latestRun?.ok === true
    ? results.latestRun.data?.run?.runId
    : null;

  return typeof runId === 'string' && runId.trim().length > 0 ? runId : null;
}

function acceptsReadonlyErrorContract({ route, data }) {
  return route.acceptErrorContract === true &&
    route.contractName !== undefined &&
    data?.contractName === route.contractName;
}

export { READONLY_API_ROUTES };
