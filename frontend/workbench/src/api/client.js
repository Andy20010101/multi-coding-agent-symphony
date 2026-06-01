import {
  GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
  GOAL_PROMPT_PACK_ROUTE_TEMPLATE,
  GOAL_RUNBOOK_ROUTE_TEMPLATE,
  GOAL_OPERATIONS_ROUTE_TEMPLATE,
  READONLY_API_ROUTES,
  RUN_TIMELINE_ROUTE_TEMPLATE,
  GOAL_EVENTS_ROUTE_TEMPLATE,
  GOAL_PROGRESS_ROUTE_TEMPLATE,
  GOAL_CLOSEOUT_ROUTE_TEMPLATE,
  RELEASE_BASELINE_ROUTE_TEMPLATE,
  GOAL_NEXT_ACTION_ROUTE_TEMPLATE,
  CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_ROUTE_TEMPLATE,
  ADOPTION_INSPECT_ROUTE_TEMPLATE,
  CONTROLLED_ADOPTION_CONFIRM_ROUTE_TEMPLATE,
  createGuidedGoalHandoffRoute,
  createAdoptionInspectRoute,
  createControlledImplementationPlanPreviewRoute,
  createGoalEventsRoute,
  createGoalOperationsRoute,
  createGoalProgressRoute,
  createGoalReviewerPromptRoute,
  createReleaseBaselineRoute,
  createRunTimelineRoute,
  createSafeArtifactPreviewRoutes,
  projectSubagentHandoffBoard,
  projectWorkbenchContracts
} from './contracts.js';

const READONLY_ERROR_MESSAGE = '读取失败 / contract 未暴露 / 不可用';
const GOAL_PLAN_PREVIEW_ERROR_MESSAGE = 'dry-run plan preview 未返回可用 contract';
const GOAL_PLAN_CONFIRM_ERROR_MESSAGE = 'event confirm 未返回可用 contract';
const CONTROLLED_IMPLEMENTATION_CONFIRM_ERROR_MESSAGE = 'implementation confirm 未返回可用 contract';
const CONTROLLED_VERIFICATION_CONFIRM_ERROR_MESSAGE = 'verification confirm 未返回可用 contract';
const CONTROLLED_ADOPTION_FREEZE_ERROR_MESSAGE = 'adoption plan freeze 未返回可用 contract';
const CONTROLLED_ADOPTION_CONFIRM_ERROR_MESSAGE = 'adoption confirm 未返回可用 contract';
const ADOPTION_INSPECT_ERROR_MESSAGE = 'adoption inspect 未返回可用 contract';
const PROMPT_WORKSPACE_ERROR_MESSAGE = 'prompt workspace route 未返回可用 contract';

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
  const activeGoalOperationsRoute = createGoalOperationsRoute(activeGoalId);
  const activeReleaseBaselineRoute = createReleaseBaselineRoute(activeGoalId);
  const goalReviewerPromptRoute = createGoalReviewerPromptRoute(activeGoalId, results.goalNextAction?.data);
  const controlledImplementationPlanPreviewRoute = createControlledImplementationPlanPreviewRoute(activeGoalId, results.goalNextAction?.data);
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

  results.activeGoalOperations = activeGoalOperationsRoute === null
    ? readonlySkipped({
        route: {
          ...GOAL_OPERATIONS_ROUTE_TEMPLATE,
          id: 'activeGoalOperations',
          label: 'Active Goal Operations'
        },
        message: 'active goal operations 未暴露 / 不可用'
    })
    : await fetchReadonlyRoute(activeGoalOperationsRoute, options);

  results.activeReleaseBaseline = activeReleaseBaselineRoute === null
    ? readonlySkipped({
        route: {
          ...RELEASE_BASELINE_ROUTE_TEMPLATE,
          id: 'activeReleaseBaseline',
          label: 'Active Release Baseline'
        },
        message: 'release baseline 未暴露 / 不可用'
      })
    : await fetchReadonlyRoute(activeReleaseBaselineRoute, options);

  const adoptionInspectRoute = createAdoptionInspectRoute(results.activeGoalOperations?.data);

  results.adoptionInspect = adoptionInspectRoute === null
    ? readonlySkipped({
        route: ADOPTION_INSPECT_ROUTE_TEMPLATE,
        message: 'adoption inspect 未暴露 / 不适用'
      })
    : await fetchReadonlyRoute(adoptionInspectRoute, options);

  results.goalReviewerPromptPack = goalReviewerPromptRoute === null
    ? readonlySkipped({
        route: {
          ...GOAL_PROMPT_PACK_ROUTE_TEMPLATE,
          id: 'goalReviewerPromptPack',
          label: 'Goal Reviewer Prompt Pack'
        },
        message: 'reviewer goal prompt 未暴露 / 不适用'
      })
    : await fetchReadonlyRoute(goalReviewerPromptRoute, options);

  results.controlledImplementationPlanPreview = controlledImplementationPlanPreviewRoute === null
    ? readonlySkipped({
        route: {
          ...CONTROLLED_IMPLEMENTATION_PLAN_PREVIEW_ROUTE_TEMPLATE,
          id: 'controlledImplementationPlanPreview',
          label: 'Controlled Implementation Plan Preview'
        },
        message: 'controlled implementation plan preview 未暴露 / 不适用'
      })
    : await fetchReadonlyRoute(controlledImplementationPlanPreviewRoute, options);

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

export async function confirmGoalEventPlan(path, body, {
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== 'function') {
    return {
      ok: false,
      httpStatus: null,
      message: GOAL_PLAN_CONFIRM_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  let response;

  try {
    response = await fetchImpl(path, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch {
    return {
      ok: false,
      httpStatus: null,
      message: GOAL_PLAN_CONFIRM_ERROR_MESSAGE,
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
      message: GOAL_PLAN_CONFIRM_ERROR_MESSAGE,
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

  if (data?.contractName !== 'goal-event-confirmation.v1') {
    return {
      ok: false,
      httpStatus: response.status,
      message: GOAL_PLAN_CONFIRM_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  return {
    ok: true,
    httpStatus: response.status,
    data
  };
}

export async function confirmControlledImplementationRunPlan(path, body, {
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== 'function') {
    return {
      ok: false,
      httpStatus: null,
      message: CONTROLLED_IMPLEMENTATION_CONFIRM_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  let response;

  try {
    response = await fetchImpl(path, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch {
    return {
      ok: false,
      httpStatus: null,
      message: CONTROLLED_IMPLEMENTATION_CONFIRM_ERROR_MESSAGE,
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
      message: CONTROLLED_IMPLEMENTATION_CONFIRM_ERROR_MESSAGE,
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

  if (data?.contractName !== 'controlled-implementation-run-confirmation.v1') {
    return {
      ok: false,
      httpStatus: response.status,
      message: CONTROLLED_IMPLEMENTATION_CONFIRM_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  return {
    ok: true,
    httpStatus: response.status,
    data
  };
}

export async function confirmControlledVerificationRun(path, body, {
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== 'function') {
    return {
      ok: false,
      httpStatus: null,
      message: CONTROLLED_VERIFICATION_CONFIRM_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  let response;

  try {
    response = await fetchImpl(path, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch {
    return {
      ok: false,
      httpStatus: null,
      message: CONTROLLED_VERIFICATION_CONFIRM_ERROR_MESSAGE,
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
      message: CONTROLLED_VERIFICATION_CONFIRM_ERROR_MESSAGE,
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

  if (data?.contractName !== 'controlled-verification-run-confirmation.v1') {
    return {
      ok: false,
      httpStatus: response.status,
      message: CONTROLLED_VERIFICATION_CONFIRM_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  return {
    ok: true,
    httpStatus: response.status,
    data
  };
}

export async function confirmControlledAdoptionPlanFreeze(path, body, {
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== 'function') {
    return {
      ok: false,
      httpStatus: null,
      message: CONTROLLED_ADOPTION_FREEZE_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  let response;

  try {
    response = await fetchImpl(path, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch {
    return {
      ok: false,
      httpStatus: null,
      message: CONTROLLED_ADOPTION_FREEZE_ERROR_MESSAGE,
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
      message: CONTROLLED_ADOPTION_FREEZE_ERROR_MESSAGE,
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

  if (data?.contractName !== 'controlled-adoption-plan-freeze.v1') {
    return {
      ok: false,
      httpStatus: response.status,
      message: CONTROLLED_ADOPTION_FREEZE_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  return {
    ok: true,
    httpStatus: response.status,
    data
  };
}

export async function confirmControlledAdoptionPlan(path, body, {
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== 'function') {
    return {
      ok: false,
      httpStatus: null,
      message: CONTROLLED_ADOPTION_CONFIRM_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  let response;

  try {
    response = await fetchImpl(path, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch {
    return {
      ok: false,
      httpStatus: null,
      message: CONTROLLED_ADOPTION_CONFIRM_ERROR_MESSAGE,
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
      message: CONTROLLED_ADOPTION_CONFIRM_ERROR_MESSAGE,
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

  if (data?.contractName !== CONTROLLED_ADOPTION_CONFIRM_ROUTE_TEMPLATE.contractName) {
    return {
      ok: false,
      httpStatus: response.status,
      message: CONTROLLED_ADOPTION_CONFIRM_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  return {
    ok: true,
    httpStatus: response.status,
    data
  };
}

export async function fetchAdoptionInspection(path, {
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== 'function') {
    return {
      ok: false,
      httpStatus: null,
      message: ADOPTION_INSPECT_ERROR_MESSAGE,
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
      message: ADOPTION_INSPECT_ERROR_MESSAGE,
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
      message: ADOPTION_INSPECT_ERROR_MESSAGE,
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

  if (data?.contractName !== ADOPTION_INSPECT_ROUTE_TEMPLATE.contractName) {
    return {
      ok: false,
      httpStatus: response.status,
      message: ADOPTION_INSPECT_ERROR_MESSAGE,
      errorEnvelope: null
    };
  }

  return {
    ok: true,
    httpStatus: response.status,
    data
  };
}

export async function fetchPromptWorkspaceRunbook(goalId, options = {}) {
  const route = createGoalWorkspaceRoute({
    template: GOAL_RUNBOOK_ROUTE_TEMPLATE,
    goalId,
    suffix: 'runbook'
  });

  if (route === null) {
    return readonlyError({
      route: {
        ...GOAL_RUNBOOK_ROUTE_TEMPLATE,
        path: GOAL_RUNBOOK_ROUTE_TEMPLATE.path
      },
      message: PROMPT_WORKSPACE_ERROR_MESSAGE
    });
  }

  return fetchReadonlyRoute(route, options);
}

export async function fetchPromptWorkspacePromptPack({ goalId, taskId, role }, options = {}) {
  const route = createGoalWorkspaceRoute({
    template: GOAL_PROMPT_PACK_ROUTE_TEMPLATE,
    goalId,
    suffix: 'prompt'
  });

  if (route === null || !isSafeWorkspaceQueryToken(taskId) || !isSafeWorkspaceQueryToken(role)) {
    return readonlyError({
      route: {
        ...GOAL_PROMPT_PACK_ROUTE_TEMPLATE,
        path: GOAL_PROMPT_PACK_ROUTE_TEMPLATE.path
      },
      message: PROMPT_WORKSPACE_ERROR_MESSAGE
    });
  }

  const searchParams = new URLSearchParams();
  searchParams.set('task', taskId);
  searchParams.set('role', role);

  return fetchReadonlyRoute({
    ...route,
    path: `${route.path}?${searchParams.toString()}`
  }, options);
}

export async function fetchPromptWorkspaceHandoffBoard(goalId, options = {}) {
  const progressRoute = createGoalWorkspaceRoute({
    template: GOAL_PROGRESS_ROUTE_TEMPLATE,
    goalId,
    suffix: 'progress'
  });
  const eventsRoute = createGoalWorkspaceRoute({
    template: GOAL_EVENTS_ROUTE_TEMPLATE,
    goalId,
    suffix: 'events'
  });
  const nextRoute = createGoalWorkspaceRoute({
    template: GOAL_NEXT_ACTION_ROUTE_TEMPLATE,
    goalId,
    suffix: 'next'
  });
  const closeoutRoute = createGoalWorkspaceRoute({
    template: GOAL_CLOSEOUT_ROUTE_TEMPLATE,
    goalId,
    suffix: 'closeout'
  });

  if (progressRoute === null || eventsRoute === null || nextRoute === null || closeoutRoute === null) {
    const errorResult = readonlyError({
      route: {
        ...GOAL_PROGRESS_ROUTE_TEMPLATE,
        path: GOAL_PROGRESS_ROUTE_TEMPLATE.path
      },
      message: PROMPT_WORKSPACE_ERROR_MESSAGE
    });

    return {
      ok: false,
      board: projectSubagentHandoffBoard({
        progressResult: errorResult,
        progress: null,
        eventsResult: errorResult,
        eventLog: null,
        nextResult: errorResult,
        nextAction: null,
        closeoutResult: errorResult,
        closeout: null
      }),
      routes: {
        progress: errorResult,
        events: errorResult,
        next: errorResult,
        closeout: errorResult
      }
    };
  }

  const [progressResult, eventsResult, nextResult, closeoutResult] = await Promise.all([
    fetchReadonlyRoute(progressRoute, options),
    fetchReadonlyRoute(eventsRoute, options),
    fetchReadonlyRoute(nextRoute, options),
    fetchReadonlyRoute(closeoutRoute, options)
  ]);

  return {
    ok: progressResult.ok === true && eventsResult.ok === true && nextResult.ok === true && closeoutResult.ok === true,
    board: projectSubagentHandoffBoard({
      progressResult,
      progress: progressResult.ok === true ? progressResult.data : null,
      eventsResult,
      eventLog: eventsResult.ok === true ? eventsResult.data : null,
      nextResult,
      nextAction: nextResult.ok === true ? nextResult.data : null,
      closeoutResult,
      closeout: closeoutResult.ok === true ? closeoutResult.data : null
    }),
    routes: {
      progress: progressResult,
      events: eventsResult,
      next: nextResult,
      closeout: closeoutResult
    }
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

function createGoalWorkspaceRoute({ template, goalId, suffix }) {
  if (!isSafeWorkspaceQueryToken(goalId)) {
    return null;
  }

  return {
    ...template,
    path: ['', 'api', 'goals', encodeURIComponent(goalId), suffix].join('/'),
    goalId
  };
}

function isSafeWorkspaceQueryToken(value) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value);
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
