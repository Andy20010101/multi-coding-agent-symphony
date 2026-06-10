import { buildGoalSupervisorCoreProjection } from './core-projection.js';
import {
  chooseGoalSupervisorPolicyDecision,
  projectGoalSupervisorCommandBoundary
} from './policy.js';

export const GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME = 'goal-supervisor-app-read-model.v1';
export const GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_VERSION = 1;
export { GOAL_SUPERVISOR_APP_COMMAND_BOUNDARY_DEFAULT } from './policy.js';

export function buildGoalSupervisorAppReadModel({
  goalId = null,
  title = null,
  tasks = [],
  sourceContracts = [],
  timelineEvents = [],
  state = {},
  goalNext = null,
  routeInput = null,
  active = null,
  threadRead = null,
  escrow = null,
  expected = null,
  releaseGates = [],
  allowCloseout = false,
  nowMs = Date.now(),
  progressGraceMs,
  coreProjection = null,
  sessionContext = null,
  ownership = {},
  currentGate = null,
  commandBoundary = null,
  recommendedNextAction = null,
  activePr = null,
  branch = null
} = {}) {
  const projection = coreProjection ?? buildGoalSupervisorCoreProjection({
    state,
    goalNext,
    routeInput,
    active,
    threadRead,
    escrow,
    expected,
    releaseGates,
    allowCloseout,
    nowMs,
    ...(progressGraceMs === undefined ? {} : { progressGraceMs })
  });
  const generatedAt = new Date(nowMs).toISOString();
  const normalizedGoalId = firstNonEmptyString(goalId, projection.goalId, goalNext?.goalId, state?.goalId);
  const normalizedCommandBoundary = projectGoalSupervisorCommandBoundary({ commandBoundary });
  const normalizedContext = normalizeContextStatus(sessionContext, projection);
  const normalizedPendingResult = normalizePendingResult({
    projection,
    routeInput: projection.routeInput
  });
  const normalizedActiveLease = normalizeActiveLease({
    active: state?.active ?? active ?? projection.routeInput?.activeLease,
    routeInput: projection.routeInput,
    nowMs
  });
  const normalizedGate = normalizeCurrentGate({
    currentGate,
    route: projection.route,
    goalNext
  });

  return {
    contractName: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
    contractVersion: GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_VERSION,
    readOnly: true,
    willMutate: false,
    generatedAt,
    goalSnapshot: buildGoalSnapshot({
      goalId: normalizedGoalId,
      title,
      tasks,
      projection,
      sourceContracts,
      generatedAt,
      currentGate: normalizedGate
    }),
    goalTimeline: buildGoalTimeline({
      timelineEvents,
      state
    }),
    activeLease: normalizedActiveLease,
    pendingResult: normalizedPendingResult,
    currentGate: normalizedGate,
    recommendedNextAction: recommendedNextAction ?? chooseGoalSupervisorPolicyDecision({
      projection,
      pendingResult: normalizedPendingResult,
      activeLease: normalizedActiveLease,
      currentGate: normalizedGate,
      contextStatus: normalizedContext,
      commandBoundary: normalizedCommandBoundary
    }),
    ownership: normalizeOwnership({
      ownership,
      activePr,
      branch
    }),
    contextStatus: normalizedContext,
    commandBoundary: normalizedCommandBoundary
  };
}

function buildGoalSnapshot({
  goalId,
  title,
  tasks,
  projection,
  sourceContracts,
  generatedAt,
  currentGate
}) {
  const normalizedTasks = Array.isArray(tasks) ? tasks.filter(isPlainObject) : [];
  const completedCount = normalizedTasks.filter(isCompletedTaskStatus).length;
  const current = projection.current ?? projection.route?.current ?? {};
  const blockerCount = [
    projection.route?.state === 'blocked',
    currentGate?.status === 'blocked'
  ].filter(Boolean).length;

  return {
    goalId,
    title: nonEmptyString(title) ? title : null,
    totalTaskCount: normalizedTasks.length,
    completedCount,
    activeTask: nonEmptyString(current?.taskId) ? current.taskId : null,
    activeRole: nonEmptyString(current?.role) ? current.role : null,
    releaseReadiness: projection.route?.state === 'complete' ? 'ready' : 'not-ready',
    blockerCount,
    sourceContracts: Array.isArray(sourceContracts) ? sourceContracts.filter(nonEmptyString) : [],
    generatedAt
  };
}

function buildGoalTimeline({
  timelineEvents,
  state
}) {
  const explicitEvents = Array.isArray(timelineEvents) ? timelineEvents : [];
  const stateResults = Array.isArray(state?.results) ? state.results : [];
  const projectedResults = stateResults
    .filter(isPlainObject)
    .map((entry, index) => {
      const result = entry.result ?? entry.record ?? {};
      return {
        eventId: firstNonEmptyString(entry.eventId, result.recordId, `recorded-result-${index}`),
        taskId: result.taskId ?? null,
        role: result.role ?? null,
        status: entry.consumed === true ? 'consumed' : 'pending',
        evidenceRef: result.evidenceRef ?? null,
        hashChainState: entry.hashChainState ?? null,
        occurredAt: entry.recordedAt ?? result.generatedAt ?? null
      };
    });

  return [...explicitEvents, ...projectedResults]
    .filter(isPlainObject)
    .map((event, index) => ({
      eventId: firstNonEmptyString(event.eventId, `event-${index}`),
      taskId: event.taskId ?? null,
      role: event.role ?? null,
      status: event.status ?? null,
      evidenceRef: event.evidenceRef ?? null,
      hashChainState: event.hashChainState ?? null,
      occurredAt: event.occurredAt ?? null
    }));
}

function normalizeActiveLease({
  active,
  routeInput,
  nowMs
}) {
  const lease = isPlainObject(active) ? active : {};
  const routeLease = isPlainObject(routeInput?.activeLease) ? routeInput.activeLease : {};
  const startedAt = firstNonEmptyString(lease.startedAt, lease.createdAt, routeLease.startedAt, routeLease.createdAt);
  const updatedAt = firstNonEmptyString(lease.updatedAt, routeLease.updatedAt, startedAt);
  const ageMs = updatedAt === null ? null : Math.max(0, nowMs - Date.parse(updatedAt));

  return {
    leaseId: firstNonEmptyString(lease.leaseId, routeLease.leaseId),
    threadId: firstNonEmptyString(lease.threadId, routeLease.threadId),
    taskId: firstNonEmptyString(lease.taskId, routeLease.taskId),
    role: firstNonEmptyString(lease.role, routeLease.role),
    phase: firstNonEmptyString(lease.phase, routeLease.phase),
    status: firstNonEmptyString(lease.status, routeLease.status, routeLease.live === true ? 'thread-active' : 'none'),
    startedAt,
    updatedAt,
    ageMs: Number.isFinite(ageMs) ? ageMs : null,
    duplicateDispatchGuard: isPlainObject(routeInput?.dispatchGuard)
      ? {
          blocked: routeInput.dispatchGuard.blocked === true,
          reason: routeInput.dispatchGuard.reason ?? null
        }
      : {
          blocked: false,
          reason: 'not-evaluated'
        }
  };
}

function normalizePendingResult({
  projection,
  routeInput
}) {
  const intake = routeInput?.resultIntake ?? routeInput?.resultAvailability ?? null;
  const projected = projection.route?.pendingResult ?? projection.progress?.pendingResult ?? null;
  const record = intake?.record ?? projected?.result ?? null;

  if (isPlainObject(intake)) {
    return {
      source: intake.source ?? null,
      status: intake.status ?? 'unavailable',
      eventToRegister: record?.eventToRegister ?? null,
      evidenceRef: record?.evidenceRef ?? null,
      parserReason: intake.reason ?? null,
      stale: false,
      missing: intake.status === 'missing',
      resultId: record?.recordId ?? null
    };
  }

  if (isPlainObject(projected)) {
    return {
      source: projected.source ?? 'recorded-result-state',
      status: 'pending',
      eventToRegister: record?.eventToRegister ?? null,
      evidenceRef: record?.evidenceRef ?? null,
      parserReason: 'valid-result-awaits-registration',
      stale: false,
      missing: false,
      resultId: record?.recordId ?? null
    };
  }

  return {
    source: null,
    status: 'missing',
    eventToRegister: null,
    evidenceRef: null,
    parserReason: 'no-recorded-result-source',
    stale: false,
    missing: true,
    resultId: null
  };
}

function normalizeCurrentGate({
  currentGate,
  route,
  goalNext
}) {
  if (isPlainObject(currentGate)) {
    return {
      gateId: currentGate.gateId ?? null,
      requiredCommandFamily: currentGate.requiredCommandFamily ?? null,
      status: currentGate.status ?? 'unknown',
      evidenceRequirement: currentGate.evidenceRequirement ?? null,
      blockingReason: currentGate.blockingReason ?? null,
      closeoutAuthorizationState: currentGate.closeoutAuthorizationState ?? 'not-requested'
    };
  }

  const role = route?.current?.role ?? goalNext?.next?.role ?? null;
  const phase = route?.current?.phase ?? goalNext?.next?.phase ?? null;
  const closeoutBlocked = route?.reason === 'release-closeout-requires-operator-authorization';

  return {
    gateId: role === 'release-manager' ? phase : null,
    requiredCommandFamily: role === 'release-manager' ? 'release-gate' : null,
    status: closeoutBlocked ? 'blocked' : 'not-active',
    evidenceRequirement: role === 'release-manager' ? 'release-manager-result-block' : null,
    blockingReason: closeoutBlocked ? route.reason : null,
    closeoutAuthorizationState: closeoutBlocked ? 'blocked-without-operator-authorization' : 'not-requested'
  };
}

function normalizeOwnership({
  ownership,
  activePr,
  branch
}) {
  return {
    orchestrationOwner: ownership.orchestrationOwner ?? 'local-goal-supervisor-daemon',
    deliveryBoundary: ownership.deliveryBoundary ?? 'pull-request',
    activePr: ownership.activePr ?? activePr ?? null,
    branch: ownership.branch ?? branch ?? null,
    rollbackBoundary: ownership.rollbackBoundary ?? 'pull-request',
    daemonState: ownership.daemonState ?? 'external-orchestration-owner',
    controllerInterventionReason: ownership.controllerInterventionReason ?? null
  };
}

function normalizeContextStatus(sessionContext, projection) {
  const context = isPlainObject(sessionContext) ? sessionContext : {};
  const routeThread = projection.routeInput?.thread ?? null;
  const transcriptAvailability = context.transcriptAvailability ?? routeThread?.status ?? 'missing';
  const latestToolCall = isPlainObject(context.latestToolCall)
    ? {
        name: context.latestToolCall.name ?? null,
        status: context.latestToolCall.status ?? null,
        updatedAt: context.latestToolCall.updatedAt ?? null
      }
    : null;

  return {
    sessionSourceSummaries: Array.isArray(context.sessionSourceSummaries)
      ? context.sessionSourceSummaries.map((source) => ({
          provider: source.provider ?? null,
          status: source.status ?? 'unknown',
          threadId: source.threadId ?? null,
          latestTurnAt: source.latestTurnAt ?? null
        }))
      : [],
    transcriptAvailability,
    exchangeCount: Number.isInteger(context.exchangeCount) ? context.exchangeCount : (routeThread?.turnCount ?? 0),
    latestToolCall,
    latestTurnState: isPlainObject(context.latestTurnState) ? { ...context.latestTurnState } : { status: 'missing' },
    tokenUsage: isPlainObject(context.tokenUsage) ? { ...context.tokenUsage } : null,
    contextUtilization: isPlainObject(context.contextUtilization) ? { ...context.contextUtilization } : null,
    staleTranscriptState: isPlainObject(context.staleTranscriptState)
      ? { ...context.staleTranscriptState }
      : { stale: projection.progress?.state === 'stalled', reason: projection.progress?.reason ?? null },
    missingTranscriptState: isPlainObject(context.missingTranscriptState)
      ? { ...context.missingTranscriptState }
      : { missing: transcriptAvailability === 'missing' || transcriptAvailability === 'unavailable', reason: null },
    checkpointRef: nonEmptyString(context.checkpointRef) ? context.checkpointRef : null,
    resultBlockEvidence: isPlainObject(context.resultBlockEvidence)
      ? {
          status: context.resultBlockEvidence.status ?? 'missing',
          present: context.resultBlockEvidence.present === true,
          evidenceRef: nonEmptyString(context.resultBlockEvidence.evidenceRef) ? context.resultBlockEvidence.evidenceRef : null,
          sourceRef: nonEmptyString(context.resultBlockEvidence.sourceRef) ? context.resultBlockEvidence.sourceRef : null
        }
      : { status: 'missing', present: false },
    driftMarkers: Array.isArray(context.driftMarkers) ? context.driftMarkers.filter(nonEmptyString) : []
  };
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (nonEmptyString(value)) {
      return value;
    }
  }

  return null;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function isCompletedTaskStatus(task) {
  return [
    'completed',
    'main-verified',
    'release-ready',
    'merged-to-main'
  ].includes(task.status);
}
