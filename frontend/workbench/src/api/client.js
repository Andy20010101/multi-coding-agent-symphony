import {
  GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
  READONLY_API_ROUTES,
  RUN_TIMELINE_ROUTE_TEMPLATE,
  GOAL_EVENTS_ROUTE_TEMPLATE,
  GOAL_PROGRESS_ROUTE_TEMPLATE,
  createGuidedGoalHandoffRoute,
  createGoalEventsRoute,
  createGoalProgressRoute,
  createRunTimelineRoute,
  createSafeArtifactPreviewRoutes,
  projectWorkbenchContracts
} from './contracts.js';

const READONLY_ERROR_MESSAGE = '读取失败 / contract 未暴露 / 不可用';
const GOAL_PLAN_PREVIEW_ERROR_MESSAGE = 'dry-run plan preview 未返回可用 contract';

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

  if (!response.ok) {
    return readonlyError({
      route,
      httpStatus: response.status,
      message: errorMessageFromEnvelope(data),
      errorEnvelope: isErrorEnvelope(data) ? data : null
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
  const activeGoalId = activeGoalIdFromResults(results);
  const activeGoalProgressRoute = createGoalProgressRoute(activeGoalId);
  const activeGoalEventsRoute = createGoalEventsRoute(activeGoalId);
  const latestRunId = latestRunIdFromResults(results);
  const timelineRoute = createRunTimelineRoute(latestRunId);

  results.guidedGoalHandoff = guidedGoalHandoffRoute === null
    ? readonlySkipped({
        route: GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
        message: 'guided handoff ref 未暴露 / 不可用'
      })
    : await fetchReadonlyRoute(guidedGoalHandoffRoute, options);

  results.activeGoalProgress = activeGoalProgressRoute === null
    ? readonlySkipped({
        route: {
          ...GOAL_PROGRESS_ROUTE_TEMPLATE,
          id: 'activeGoalProgress',
          label: 'Active Goal Progress'
        },
        message: 'active goal progress 未暴露 / 不可用'
      })
    : await fetchReadonlyRoute(activeGoalProgressRoute, options);

  results.activeGoalEvents = activeGoalEventsRoute === null
    ? readonlySkipped({
        route: {
          ...GOAL_EVENTS_ROUTE_TEMPLATE,
          id: 'activeGoalEvents',
          label: 'Active Goal Events'
        },
        message: 'active goal events 未暴露 / 不可用'
      })
    : await fetchReadonlyRoute(activeGoalEventsRoute, options);

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

export async function fetchGoalEventPlanPreview(path, {
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== 'function') {
    return {
      ok: false,
      httpStatus: null,
      message: GOAL_PLAN_PREVIEW_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  let response;

  try {
    response = await fetchImpl(path, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json'
      }
    });
  } catch {
    return {
      ok: false,
      httpStatus: null,
      message: GOAL_PLAN_PREVIEW_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  let data;

  try {
    data = await response.json();
  } catch {
    return {
      ok: false,
      httpStatus: response.status,
      message: GOAL_PLAN_PREVIEW_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      httpStatus: response.status,
      message: errorMessageFromEnvelope(data),
      errorEnvelope: isErrorEnvelope(data) ? data : null
    };
  }

  if (data?.contractName !== 'goal-update-plan.v1') {
    return {
      ok: false,
      httpStatus: response.status,
      message: GOAL_PLAN_PREVIEW_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  return {
    ok: true,
    httpStatus: response.status,
    data
  };
}

function readonlyError({ route, httpStatus = null, message, errorEnvelope = null }) {
  return {
    ok: false,
    route: route.path,
    method: route.method,
    routeDescriptor: route,
    httpStatus,
    message,
    errorEnvelope,
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

function activeGoalIdFromResults(results) {
  const candidates = [
    results.goalRunbook?.ok === true ? results.goalRunbook.data?.goalId : null,
    results.goalNextAction?.ok === true && results.goalNextAction.data?.status !== 'missing-runbook'
      ? results.goalNextAction.data?.goalId
      : null
  ];
  const goalId = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);

  return goalId === 'latest' ? null : goalId ?? null;
}

function errorMessageFromEnvelope(data) {
  if (isErrorEnvelope(data)) {
    return data.error.message;
  }

  return READONLY_ERROR_MESSAGE;
}

function isErrorEnvelope(data) {
  return data?.contractName === 'error-envelope.v1' &&
    data?.ok === false &&
    typeof data?.error?.message === 'string';
}

export { READONLY_API_ROUTES };
