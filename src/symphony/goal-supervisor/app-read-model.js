import { buildGoalSupervisorCoreProjection } from './core-projection.js';
import {
  chooseGoalSupervisorPolicyDecision,
  projectGoalSupervisorCommandBoundary
} from './policy.js';
import {
  CONTEXT_ADVISORY_CONTRACT_NAME,
  CONTEXT_ADVISORY_CONTRACT_VERSION,
  SESSION_SOURCE_INVENTORY_CONTRACT_NAME,
  SESSION_SOURCE_INVENTORY_CONTRACT_VERSION,
  buildContextAdvisory
} from './session-context.js';
import {
  THREAD_CONTINUATION_DECISION_CONTRACT_NAME,
  THREAD_CONTINUATION_DECISION_CONTRACT_VERSION,
  buildThreadContinuationDecision
} from './thread-continuation-decision.js';
import {
  buildSupervisorEventRegistrationEligibility
} from './event-registration-eligibility.js';

export const GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME = 'goal-supervisor-app-read-model.v1';
export const GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_VERSION = 1;
export { GOAL_SUPERVISOR_APP_COMMAND_BOUNDARY_DEFAULT } from './policy.js';

const PENDING_RESULT_CONTRACT_NAME = 'pendingResult.v1';
const RESULT_EVIDENCE_ESCROW_CONTRACT_NAME = 'resultEvidenceEscrow.v1';
const PENDING_RESULT_STATES = new Set(['available', 'blocked', 'consumed', 'superseded']);
const SOURCE_CONTRACT_NAME_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const UNSAFE_SOURCE_CONTRACT_TEXT_PATTERN = /\b(?:raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log|session[\s_-]*file|model[\s_-]*output)\b/iu;
const PENDING_RESULT_UPDATE_EVENTS = new Set([
  'worker.evidence-recorded',
  'worker.self-check-passed',
  'worker.self-check-failed',
  'blocker.opened',
  'blocker.resolved'
]);

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
  sessionSourceInventory = null,
  contextAdvisory = null,
  threadContinuationDecision = null,
  activePr = null,
  branch = null,
  pendingResultState = null
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
    routeInput: projection.routeInput,
    pendingResultState
  });
  const pendingResultRecord = pendingResultRecordFromProjection({
    projection,
    routeInput: projection.routeInput,
    pendingResultState
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
  const normalizedNextAction = recommendedNextAction ?? chooseGoalSupervisorPolicyDecision({
    projection,
    pendingResult: normalizedPendingResult,
    activeLease: normalizedActiveLease,
    currentGate: normalizedGate,
    contextStatus: normalizedContext,
    commandBoundary: normalizedCommandBoundary
  });
  const normalizedSessionSourceInventory = normalizeSessionSourceInventory(
    sessionSourceInventory,
    generatedAt
  );
  const normalizedContextAdvisory = normalizeContextAdvisoryDisplay(
    contextAdvisory ?? buildContextAdvisory({
      sessionContext,
      sessionSourceInventory: normalizedSessionSourceInventory,
      generatedAt
    }),
    generatedAt
  );
  const normalizedThreadContinuationDecision = normalizeThreadContinuationDecisionDisplay(
    threadContinuationDecision ?? buildThreadContinuationDecision({
      contextAdvisory: normalizedContextAdvisory,
      activeLease: normalizedActiveLease,
      pendingResult: normalizedPendingResult,
      currentPhase: projection.current ?? projection.route?.current ?? null,
      taskState: projection.current ?? projection.route?.current ?? null,
      supervisorProjection: projection,
      supervisorPolicy: normalizedNextAction,
      currentGate: normalizedGate,
      commandBoundary: normalizedCommandBoundary,
      sourceContracts: [
        ...safeSourceContracts(sourceContracts),
        normalizedSessionSourceInventory,
        normalizedContextAdvisory
      ],
      generatedAt
    }),
    generatedAt
  );
  const normalizedEventRegistrationEligibility = buildSupervisorEventRegistrationEligibility({
    goalId: normalizedGoalId,
    pendingResult: normalizedPendingResult,
    pendingResultRecord,
    threadContinuationDecision: normalizedThreadContinuationDecision,
    taskState: projection.current ?? projection.route?.current ?? null,
    commandBoundary: normalizedCommandBoundary,
    sourceContracts: [
      ...safeSourceContracts(sourceContracts),
      normalizedContextAdvisory,
      normalizedThreadContinuationDecision,
      ...pendingResultSourceContracts(normalizedPendingResult)
    ],
    generatedAt
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
    recommendedNextAction: normalizedNextAction,
    ownership: normalizeOwnership({
      ownership,
      activePr,
      branch
    }),
    contextStatus: normalizedContext,
    commandBoundary: normalizedCommandBoundary,
    sessionSourceInventory: normalizedSessionSourceInventory,
    contextAdvisory: normalizedContextAdvisory,
    threadContinuationDecision: normalizedThreadContinuationDecision,
    supervisorEventRegistrationEligibility: normalizedEventRegistrationEligibility
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
    sourceContracts: safeSourceContractNames(sourceContracts),
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
  routeInput,
  pendingResultState = null
}) {
  const contracted = firstPendingResultContract(
    pendingResultState,
    routeInput?.pendingResult
  );

  if (contracted !== null) {
    return normalizeContractedPendingResult(contracted);
  }

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

function pendingResultRecordFromProjection({
  projection,
  routeInput,
  pendingResultState = null
}) {
  const contracted = firstPendingResultContract(
    pendingResultState,
    routeInput?.pendingResult
  );

  if (contracted !== null) {
    return pendingResultRecordFromContract(contracted);
  }

  const intake = routeInput?.resultIntake ?? routeInput?.resultAvailability ?? null;
  const projected = projection.route?.pendingResult ?? projection.progress?.pendingResult ?? null;
  const record = intake?.record ?? projected?.result ?? null;

  return isPlainObject(record) ? record : null;
}

function firstPendingResultContract(...values) {
  return values.find((value) => (
    isPlainObject(value) &&
    value.contractName === PENDING_RESULT_CONTRACT_NAME
  )) ?? null;
}

function normalizeContractedPendingResult(pendingResult) {
  const evidenceRefs = normalizeControlledEvidenceRefs(pendingResult.evidenceRefs);
  const eventCandidate = normalizePendingResultEventCandidate(
    pendingResult.eventCandidate,
    evidenceRefs
  );
  const state = PENDING_RESULT_STATES.has(pendingResult.state)
    ? pendingResult.state
    : 'blocked';
  const status = pendingResultRegistrationStatus({
    state,
    eventCandidate
  });
  const evidenceRef = evidenceRefs
    .map(stringifyControlledEvidenceRef)
    .find(nonEmptyString) ?? null;

  return {
    contractName: PENDING_RESULT_CONTRACT_NAME,
    contractVersion: Number.isInteger(pendingResult.contractVersion) ? pendingResult.contractVersion : null,
    goalId: firstNonEmptyString(pendingResult.goalId),
    taskId: firstNonEmptyString(pendingResult.taskId),
    workerRole: firstNonEmptyString(pendingResult.workerRole),
    source: firstNonEmptyString(pendingResult.source),
    status,
    state,
    escrowRef: safeDisplayRef(pendingResult.escrowRef),
    sanitizedSummary: normalizeSanitizedSummary(pendingResult.sanitizedSummary),
    evidenceRefs,
    eventCandidate,
    eventToRegister: eventCandidate.eventType,
    evidenceRef,
    parserReason: firstNonEmptyString(eventCandidate.reason, pendingResult.blockedReasons?.[0], 'pending-result-v1'),
    stale: false,
    missing: false,
    resultId: safeDisplayRef(pendingResult.escrowRef),
    blockedReasons: uniqueStrings(Array.isArray(pendingResult.blockedReasons) ? pendingResult.blockedReasons : []),
    sourceContracts: normalizePendingResultSourceContracts(pendingResult.sourceContracts),
    boundaries: normalizePendingResultBoundaries(pendingResult.boundaries)
  };
}

function pendingResultRecordFromContract(pendingResult) {
  const evidenceRefs = normalizeControlledEvidenceRefs(pendingResult.evidenceRefs);
  const eventCandidate = normalizePendingResultEventCandidate(
    pendingResult.eventCandidate,
    evidenceRefs
  );
  const evidenceRef = evidenceRefs
    .map(stringifyControlledEvidenceRef)
    .find(nonEmptyString) ?? null;
  const summary = normalizeSanitizedSummary(pendingResult.sanitizedSummary);

  return {
    contractName: PENDING_RESULT_CONTRACT_NAME,
    contractVersion: Number.isInteger(pendingResult.contractVersion) ? pendingResult.contractVersion : null,
    goalId: firstNonEmptyString(pendingResult.goalId),
    taskId: firstNonEmptyString(pendingResult.taskId),
    role: firstNonEmptyString(pendingResult.workerRole),
    eventToRegister: eventCandidate.eventType,
    evidenceRef,
    evidenceRefs,
    statement: firstNonEmptyString(summary.summary),
    blocker: eventCandidate.blocker,
    sourceContracts: normalizePendingResultSourceContracts(pendingResult.sourceContracts),
    escrowRef: safeDisplayRef(pendingResult.escrowRef)
  };
}

function pendingResultRegistrationStatus({
  state,
  eventCandidate
}) {
  if (state === 'consumed' || state === 'superseded') {
    return state;
  }

  if (!PENDING_RESULT_UPDATE_EVENTS.has(eventCandidate.eventType) &&
      eventCandidate.command !== 'review' &&
      eventCandidate.command !== 'gate') {
    return 'invalid';
  }

  return 'pending';
}

function normalizeSanitizedSummary(summary) {
  const source = isPlainObject(summary) ? summary : {};

  return stripEmptyObject({
    status: safeSummaryText(source.status) ?? 'unknown',
    summary: safeSummaryText(source.summary),
    changedFiles: safeSummaryStrings(source.changedFiles, safeDisplayRef),
    validationCommands: safeSummaryStrings(source.validationCommands, safeSummaryText),
    evidenceRefs: normalizeControlledEvidenceRefs(source.evidenceRefs),
    blockerReason: safeSummaryText(source.blockerReason),
    risks: safeSummaryStrings(source.risks, safeSummaryText),
    blockers: safeSummaryStrings(source.blockers, safeSummaryText)
  });
}

function normalizePendingResultEventCandidate(candidate, fallbackEvidenceRefs) {
  const event = isPlainObject(candidate) ? candidate : {};
  const evidenceRefs = normalizeControlledEvidenceRefs(event.evidenceRefs);
  const eventType = firstNonEmptyString(event.eventType);

  return stripEmptyObject({
    eventType,
    taskId: firstNonEmptyString(event.taskId),
    workerRole: firstNonEmptyString(event.workerRole),
    command: firstNonEmptyString(event.command),
    commandName: firstNonEmptyString(event.commandName),
    requiresEvidence: event.requiresEvidence === true,
    evidenceRefs: evidenceRefs.length > 0 ? evidenceRefs : fallbackEvidenceRefs,
    blocker: normalizePendingResultBlocker(event.blocker),
    willAppendGoalEvent: false,
    state: firstNonEmptyString(event.state, 'not-applicable'),
    reason: firstNonEmptyString(event.reason)
  });
}

function normalizePendingResultBlocker(blocker) {
  const source = isPlainObject(blocker) ? blocker : {};
  const normalized = stripEmptyObject({
    blockerId: firstNonEmptyString(source.blockerId),
    reason: safeSummaryText(source.reason),
    severity: safeSummaryText(source.severity)
  });

  return Object.keys(normalized).length === 0 ? null : normalized;
}

function normalizeControlledEvidenceRefs(evidenceRefs) {
  return (Array.isArray(evidenceRefs) ? evidenceRefs : [])
    .map(normalizeControlledEvidenceRef)
    .filter((evidenceRef) => evidenceRef !== null);
}

function normalizeControlledEvidenceRef(evidenceRef) {
  if (!isPlainObject(evidenceRef)) {
    return null;
  }

  const kind = firstNonEmptyString(evidenceRef.kind);
  const ref = safeDisplayRef(evidenceRef.ref);
  const label = safeSummaryText(evidenceRef.label);

  if (!['repo-doc', 'artifact-ref', 'commit', 'command-evidence', 'external-note'].includes(kind) ||
      ref === null ||
      label === null) {
    return null;
  }

  if (kind === 'repo-doc' && !ref.startsWith('docs/plans/')) {
    return null;
  }

  return { kind, ref, label };
}

function stringifyControlledEvidenceRef(evidenceRef) {
  if (!isPlainObject(evidenceRef)) {
    return null;
  }

  if (evidenceRef.kind === 'repo-doc') {
    return evidenceRef.ref;
  }

  if (evidenceRef.kind === 'artifact-ref') {
    return `artifact-ref:${evidenceRef.ref}`;
  }

  return null;
}

function normalizePendingResultSourceContracts(sourceContracts) {
  return (Array.isArray(sourceContracts) ? sourceContracts : [])
    .map((contract) => {
      if (!isPlainObject(contract)) {
        return null;
      }

      const contractName = safeContractName(contract.contractName);

      if (contractName === null) {
        return null;
      }

      return stripEmptyObject({
        contractName,
        contractVersion: Number.isInteger(contract.contractVersion) ? contract.contractVersion : null,
        escrowRef: safeDisplayRef(contract.escrowRef),
        previewPlanHash: safeHash(contract.previewPlanHash),
        generatedAt: safeTimestamp(contract.generatedAt),
        readOnly: true
      });
    })
    .filter((contract) => contract !== null);
}

function pendingResultSourceContracts(pendingResult) {
  if (!isPlainObject(pendingResult) || pendingResult.contractName !== PENDING_RESULT_CONTRACT_NAME) {
    return [];
  }

  return [
    {
      contractName: PENDING_RESULT_CONTRACT_NAME,
      contractVersion: pendingResult.contractVersion,
      readOnly: true
    },
    ...normalizePendingResultSourceContracts(pendingResult.sourceContracts).map((contract) => ({
      contractName: contract.contractName ?? RESULT_EVIDENCE_ESCROW_CONTRACT_NAME,
      contractVersion: contract.contractVersion ?? null,
      readOnly: true
    }))
  ];
}

function normalizePendingResultBoundaries(boundaries) {
  return {
    providerExecutionAvailable: false,
    childDispatchAvailable: false,
    directGoalEventAppendAvailable: false,
    untrustedTranscriptProjectionAvailable: false,
    frontendLocalFileReadAvailable: false,
    reviewerMutationAvailable: false,
    mainVerificationMutationAvailable: false,
    releaseGateMutationAvailable: false,
    gitMutationAvailable: false,
    githubReleaseAutomationAvailable: false,
    projectionAppendsGoalEvent: false
  };
}

function safeSummaryStrings(values, sanitizer) {
  return (Array.isArray(values) ? values : [])
    .map((value) => sanitizer(value))
    .filter(nonEmptyString);
}

function safeSummaryText(value) {
  const ref = safeDisplayRef(value);

  if (ref === null || /raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log/iu.test(ref)) {
    return null;
  }

  return ref;
}

function safeHash(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();

  return /^sha256:[a-f0-9]{64}$/u.test(trimmed) ? trimmed : null;
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

function normalizeSessionSourceInventory(inventory, generatedAt) {
  const sourceInventory = isPlainObject(inventory) ? inventory : {};
  const providers = Array.isArray(sourceInventory.providers)
    ? sourceInventory.providers.filter(isPlainObject).map(normalizeInventoryProvider)
    : [];
  const summary = isPlainObject(sourceInventory.summary) ? sourceInventory.summary : {};
  const failedCount = integerOrNull(summary.failedProviderCount);
  const degradedCount = integerOrNull(summary.degradedProviderCount);
  const availableCount = integerOrNull(summary.availableProviderCount);
  const missingCount = integerOrNull(summary.missingProviderCount);

  return {
    contractName: nonEmptyString(sourceInventory.contractName)
      ? sourceInventory.contractName
      : SESSION_SOURCE_INVENTORY_CONTRACT_NAME,
    contractVersion: Number.isInteger(sourceInventory.contractVersion)
      ? sourceInventory.contractVersion
      : SESSION_SOURCE_INVENTORY_CONTRACT_VERSION,
    generatedAt: firstNonEmptyString(sourceInventory.generatedAt, generatedAt),
    readOnly: sourceInventory.readOnly === true || sourceInventory.contractName === undefined,
    willMutate: false,
    state: firstNonEmptyString(
      summary.state,
      providers.length === 0 ? 'missing' : null
    ),
    scanScope: firstNonEmptyString(sourceInventory.scanScope, 'bounded-provider-session-roots'),
    maxFilesPerProvider: integerOrNull(sourceInventory.maxFilesPerProvider),
    summary: {
      providerCount: integerOrNull(summary.providerCount) ?? providers.length,
      availableProviderCount: availableCount ?? countProvidersByState(providers, ['available']),
      missingProviderCount: missingCount ?? countProvidersByState(providers, ['missing']),
      degradedProviderCount: degradedCount ?? countProvidersByState(providers, ['degraded', 'stale', 'unreadable']),
      failedProviderCount: failedCount ?? countProvidersByState(providers, ['failed']),
      state: firstNonEmptyString(summary.state, providers.length === 0 ? 'missing' : 'unknown')
    },
    providers,
    degradedReasons: uniqueStrings(providers.flatMap((provider) => provider.degradedReasons)),
    boundaries: normalizeReadOnlyBoundaries(sourceInventory.boundaries)
  };
}

function normalizeInventoryProvider(provider) {
  const sourceSummary = isPlainObject(provider.sourceSummary) ? provider.sourceSummary : {};

  return {
    provider: firstNonEmptyString(provider.provider, 'unknown'),
    state: firstNonEmptyString(provider.state, sourceSummary.availability, 'unknown'),
    readOnly: provider.readOnly === true,
    willMutate: false,
    readableFileCount: countOrMissing(provider.readableFileCount, sourceSummary.readableFileCount),
    candidateFileCount: countOrMissing(provider.candidateFileCount, sourceSummary.candidateFileCount),
    scannedFileCount: countOrMissing(sourceSummary.scannedFileCount, provider.candidateFileCount),
    unreadableFileCount: countOrMissing(sourceSummary.unreadableFileCount),
    latestModifiedAt: firstNonEmptyString(provider.latestModifiedAt, sourceSummary.latestModifiedAt),
    latestSessionRef: safeDisplayRef(firstNonEmptyString(provider.latestSessionRef, sourceSummary.latestSessionRef)),
    failureReason: firstNonEmptyString(provider.failureReason, sourceSummary.failureReason),
    degradedReasons: uniqueStrings(Array.isArray(provider.degradedReasons) ? provider.degradedReasons : []),
    sourceSummary: {
      availability: firstNonEmptyString(sourceSummary.availability, provider.state, 'unknown'),
      readState: firstNonEmptyString(sourceSummary.readState, 'unknown'),
      candidateFileCount: countOrMissing(sourceSummary.candidateFileCount, provider.candidateFileCount),
      scannedFileCount: countOrMissing(sourceSummary.scannedFileCount),
      readableFileCount: countOrMissing(sourceSummary.readableFileCount, provider.readableFileCount),
      unreadableFileCount: countOrMissing(sourceSummary.unreadableFileCount),
      latestModifiedAt: firstNonEmptyString(sourceSummary.latestModifiedAt, provider.latestModifiedAt),
      stale: sourceSummary.stale === true,
      latestSessionRef: safeDisplayRef(firstNonEmptyString(sourceSummary.latestSessionRef, provider.latestSessionRef)),
      failureReason: firstNonEmptyString(sourceSummary.failureReason, provider.failureReason)
    }
  };
}

function normalizeContextAdvisoryDisplay(contextAdvisory, generatedAt) {
  const advisory = isPlainObject(contextAdvisory) ? contextAdvisory : {};

  return {
    contractName: nonEmptyString(advisory.contractName)
      ? advisory.contractName
      : CONTEXT_ADVISORY_CONTRACT_NAME,
    contractVersion: Number.isInteger(advisory.contractVersion)
      ? advisory.contractVersion
      : CONTEXT_ADVISORY_CONTRACT_VERSION,
    generatedAt: firstNonEmptyString(advisory.generatedAt, generatedAt),
    readOnly: advisory.readOnly === true || advisory.contractName === undefined,
    willMutate: false,
    sessionContextRef: normalizeContractRef(advisory.sessionContextRef),
    inventoryRef: normalizeContractRef(advisory.inventoryRef),
    transcriptAvailability: firstNonEmptyString(advisory.transcriptAvailability, 'missing'),
    exchangeCount: Number.isInteger(advisory.exchangeCount) ? advisory.exchangeCount : 'missing',
    latestToolCall: normalizeLatestToolCall(advisory.latestToolCall),
    latestTurnState: normalizeLatestTurnState(advisory.latestTurnState),
    tokenUsage: normalizeTokenUsage(advisory.tokenUsage),
    contextUtilization: normalizeContextUtilization(advisory.contextUtilization),
    contextBand: firstNonEmptyString(advisory.contextBand, 'unknown'),
    resultBlockEvidence: normalizeResultBlockEvidence(advisory.resultBlockEvidence),
    staleTranscriptState: normalizeStaleTranscriptState(advisory.staleTranscriptState),
    missingTranscriptState: normalizeMissingTranscriptState(advisory.missingTranscriptState),
    degradedReasons: uniqueStrings(Array.isArray(advisory.degradedReasons) ? advisory.degradedReasons : []),
    blockedFields: uniqueStrings(Array.isArray(advisory.blockedFields) ? advisory.blockedFields : []),
    policyInputs: normalizePolicyInputs(advisory.policyInputs),
    boundaries: normalizeReadOnlyBoundaries(advisory.boundaries)
  };
}

function normalizeThreadContinuationDecisionDisplay(decision, generatedAt) {
  const continuation = isPlainObject(decision) ? decision : {};

  return {
    contractName: nonEmptyString(continuation.contractName)
      ? continuation.contractName
      : THREAD_CONTINUATION_DECISION_CONTRACT_NAME,
    contractVersion: Number.isInteger(continuation.contractVersion)
      ? continuation.contractVersion
      : THREAD_CONTINUATION_DECISION_CONTRACT_VERSION,
    generatedAt: firstNonEmptyString(continuation.generatedAt, generatedAt),
    readOnly: continuation.readOnly === true || continuation.contractName === undefined,
    willMutate: false,
    decision: firstNonEmptyString(continuation.decision, 'unknown'),
    reason: firstNonEmptyString(continuation.reason),
    confidence: firstNonEmptyString(continuation.confidence, 'unknown'),
    targetRole: firstNonEmptyString(continuation.targetRole),
    taskId: firstNonEmptyString(continuation.taskId),
    threadId: firstNonEmptyString(continuation.threadId),
    checkpointRef: safeDisplayRef(continuation.checkpointRef),
    waitPolicy: isPlainObject(continuation.waitPolicy) ? { ...continuation.waitPolicy } : null,
    blockedFields: uniqueStrings(Array.isArray(continuation.blockedFields) ? continuation.blockedFields : []),
    mismatchList: uniqueStrings(Array.isArray(continuation.mismatchList) ? continuation.mismatchList : []),
    requiredEvidence: uniqueStrings(Array.isArray(continuation.requiredEvidence) ? continuation.requiredEvidence : []),
    sourceContracts: normalizeContractRefs(continuation.sourceContracts),
    commandBoundary: normalizeDecisionCommandBoundary(continuation.commandBoundary)
  };
}

function normalizePolicyInputs(policyInputs) {
  const inputs = isPlainObject(policyInputs) ? policyInputs : {};

  return {
    threadId: firstNonEmptyString(inputs.threadId),
    sessionSourceSummaries: Array.isArray(inputs.sessionSourceSummaries)
      ? inputs.sessionSourceSummaries.filter(isPlainObject).map((source) => ({
          provider: firstNonEmptyString(source.provider),
          status: firstNonEmptyString(source.status, 'unknown'),
          threadId: firstNonEmptyString(source.threadId),
          latestTurnAt: firstNonEmptyString(source.latestTurnAt)
        }))
      : [],
    inventorySourceSummaries: Array.isArray(inputs.inventorySourceSummaries)
      ? inputs.inventorySourceSummaries.filter(isPlainObject).map((source) => ({
          provider: firstNonEmptyString(source.provider),
          state: firstNonEmptyString(source.state, 'unknown'),
          sourceSummary: isPlainObject(source.sourceSummary)
            ? {
                availability: firstNonEmptyString(source.sourceSummary.availability, 'unknown'),
                readState: firstNonEmptyString(source.sourceSummary.readState, 'unknown'),
                candidateFileCount: countOrMissing(source.sourceSummary.candidateFileCount),
                scannedFileCount: countOrMissing(source.sourceSummary.scannedFileCount),
                readableFileCount: countOrMissing(source.sourceSummary.readableFileCount),
                unreadableFileCount: countOrMissing(source.sourceSummary.unreadableFileCount),
                latestModifiedAt: firstNonEmptyString(source.sourceSummary.latestModifiedAt),
                stale: source.sourceSummary.stale === true,
                latestSessionRef: safeDisplayRef(source.sourceSummary.latestSessionRef),
                failureReason: firstNonEmptyString(source.sourceSummary.failureReason)
              }
            : null
        }))
      : [],
    transcriptAvailability: firstNonEmptyString(inputs.transcriptAvailability, 'missing'),
    latestToolCall: normalizeLatestToolCall(inputs.latestToolCall),
    latestTurnState: normalizeLatestTurnState(inputs.latestTurnState),
    tokenUsage: normalizeTokenUsage(inputs.tokenUsage),
    contextUtilization: normalizeContextUtilization(inputs.contextUtilization),
    resultBlockEvidence: normalizeResultBlockEvidence(inputs.resultBlockEvidence),
    staleTranscriptState: normalizeStaleTranscriptState(inputs.staleTranscriptState),
    missingTranscriptState: normalizeMissingTranscriptState(inputs.missingTranscriptState)
  };
}

function normalizeDecisionCommandBoundary(commandBoundary) {
  const boundary = isPlainObject(commandBoundary) ? commandBoundary : {};

  return {
    state: firstNonEmptyString(boundary.state, 'disabled'),
    executionAvailable: false,
    copyOnly: true,
    readOnly: true,
    allowedCommandFamilies: uniqueStrings(Array.isArray(boundary.allowedCommandFamilies) ? boundary.allowedCommandFamilies : []),
    blockedCommandFamilies: uniqueStrings(Array.isArray(boundary.blockedCommandFamilies) ? boundary.blockedCommandFamilies : []),
    confirmationFields: uniqueStrings(Array.isArray(boundary.confirmationFields) ? boundary.confirmationFields : []),
    confirmationReady: boundary.confirmationReady === true
  };
}

function normalizeReadOnlyBoundaries(boundaries) {
  const source = isPlainObject(boundaries) ? boundaries : {};

  return {
    readOnly: source.readOnly === true || boundaries === undefined,
    willMutate: false,
    frontendMayScanFolders: false,
    exposesRawTranscript: false,
    exposesRawJsonl: false,
    launchesProvider: false,
    dispatchesChildren: false,
    compactsTranscripts: false
  };
}

function normalizeContractRefs(sourceContracts) {
  return (Array.isArray(sourceContracts) ? sourceContracts : [])
    .map(normalizeContractRef)
    .filter((contract) => contract !== null);
}

function normalizeContractRef(contract) {
  if (typeof contract === 'string') {
    const contractName = safeContractName(contract);

    if (contractName === null) {
      return null;
    }

    return {
      contractName,
      contractVersion: null,
      generatedAt: null,
      readOnly: null,
      threadId: null
    };
  }

  if (!isPlainObject(contract) || !nonEmptyString(contract.contractName)) {
    return null;
  }

  const contractName = safeContractName(contract.contractName);

  if (contractName === null) {
    return null;
  }

  return {
    contractName,
    contractVersion: Number.isInteger(contract.contractVersion) ? contract.contractVersion : null,
    generatedAt: safeTimestamp(contract.generatedAt),
    readOnly: contract.readOnly === true,
    threadId: safeDisplayRef(contract.threadId)
  };
}

function normalizeLatestToolCall(toolCall) {
  if (!isPlainObject(toolCall)) {
    return { name: null, status: 'missing', updatedAt: null };
  }

  return {
    name: firstNonEmptyString(toolCall.name),
    status: firstNonEmptyString(toolCall.status, 'missing'),
    updatedAt: firstNonEmptyString(toolCall.updatedAt)
  };
}

function normalizeLatestTurnState(turnState) {
  if (!isPlainObject(turnState)) {
    return { status: 'missing', role: null, updatedAt: null };
  }

  return {
    status: firstNonEmptyString(turnState.status, 'missing'),
    role: firstNonEmptyString(turnState.role),
    updatedAt: firstNonEmptyString(turnState.updatedAt)
  };
}

function normalizeTokenUsage(tokenUsage) {
  const usage = isPlainObject(tokenUsage) ? tokenUsage : {};

  return {
    status: firstNonEmptyString(usage.status, 'missing'),
    inputTokens: numberOrMissing(usage.inputTokens),
    outputTokens: numberOrMissing(usage.outputTokens),
    totalTokens: numberOrMissing(usage.totalTokens)
  };
}

function normalizeContextUtilization(contextUtilization) {
  const utilization = isPlainObject(contextUtilization) ? contextUtilization : {};

  return {
    status: firstNonEmptyString(utilization.status, 'missing'),
    usedTokens: numberOrMissing(utilization.usedTokens),
    maxTokens: numberOrMissing(utilization.maxTokens),
    ratio: Number.isFinite(utilization.ratio) ? utilization.ratio : 'missing'
  };
}

function normalizeResultBlockEvidence(resultBlockEvidence) {
  const evidence = isPlainObject(resultBlockEvidence) ? resultBlockEvidence : {};

  return {
    status: firstNonEmptyString(evidence.status, 'missing'),
    present: evidence.present === true,
    evidenceRef: safeDisplayRef(evidence.evidenceRef),
    checkpointRef: safeDisplayRef(evidence.checkpointRef)
  };
}

function normalizeStaleTranscriptState(staleTranscriptState) {
  const state = isPlainObject(staleTranscriptState) ? staleTranscriptState : {};

  return {
    stale: state.stale === true,
    reason: firstNonEmptyString(state.reason),
    thresholdMs: Number.isFinite(state.thresholdMs) ? state.thresholdMs : null,
    ageMs: Number.isFinite(state.ageMs) ? state.ageMs : null
  };
}

function normalizeMissingTranscriptState(missingTranscriptState) {
  const state = isPlainObject(missingTranscriptState) ? missingTranscriptState : {};

  return {
    missing: state.missing === true,
    reason: firstNonEmptyString(state.reason)
  };
}

function safeSourceContracts(sourceContracts) {
  return normalizeContractRefs(sourceContracts);
}

function safeSourceContractNames(sourceContracts) {
  return safeSourceContracts(sourceContracts)
    .map((contract) => contract.contractName)
    .filter(nonEmptyString);
}

function safeContractName(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();

  return SOURCE_CONTRACT_NAME_PATTERN.test(trimmed) && !hasUnsafeSourceContractText(trimmed)
    ? trimmed
    : null;
}

function safeTimestamp(value) {
  if (!nonEmptyString(value) || hasUnsafeSourceContractText(value)) {
    return null;
  }

  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function hasUnsafeSourceContractText(value) {
  if (!nonEmptyString(value)) {
    return false;
  }

  const ref = value.trim();
  const lower = ref.toLowerCase();
  const compact = lower.replace(/[^a-z0-9]/gu, '');
  const normalized = lower.replaceAll('\\', '/');
  const segments = normalized.split('/').filter((segment) => segment !== '');

  return UNSAFE_SOURCE_CONTRACT_TEXT_PATTERN.test(ref) ||
    /[\x00-\x1F\x7F]/u.test(ref) ||
    ref.startsWith('/') ||
    ref.startsWith('~') ||
    /^[a-z]:[\\/]/iu.test(ref) ||
    ref.includes('\\') ||
    ref === '..' ||
    ref.startsWith('../') ||
    ref.includes('/../') ||
    lower.startsWith('file:') ||
    lower.includes('stdout') ||
    lower.includes('prompt') ||
    lower.includes('secret') ||
    lower.endsWith('.jsonl') ||
    lower.includes('.jsonl/') ||
    compact.includes('rawtranscript') ||
    compact.includes('rawmodeloutput') ||
    compact.includes('providersession') ||
    compact.includes('sessionlog') ||
    compact.includes('sessionfile') ||
    compact.includes('modeloutput') ||
    segments.some((segment) => ['.codex', '.claude', '.git', '.symphony'].includes(segment));
}

function countProvidersByState(providers, states) {
  return providers.filter((provider) => states.includes(provider.state)).length;
}

function countOrMissing(...values) {
  const value = values.find(Number.isInteger);

  return Number.isInteger(value) ? value : 'missing';
}

function integerOrNull(value) {
  return Number.isInteger(value) ? value : null;
}

function numberOrMissing(value) {
  return Number.isFinite(value) ? value : 'missing';
}

function safeDisplayRef(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const ref = value.trim();
  const lower = ref.toLowerCase();
  const segments = lower.replaceAll('\\', '/').split('/').filter((segment) => segment !== '');

  if (/[\x00-\x1F\x7F]/u.test(ref) ||
      ref.startsWith('/') ||
      ref.startsWith('~') ||
      /^[a-z]:[\\/]/iu.test(ref) ||
      ref.includes('\\') ||
      ref === '..' ||
      ref.startsWith('../') ||
      ref.includes('/../') ||
      lower.startsWith('file:') ||
      lower.startsWith('stdout:') ||
      lower.includes('prompt') ||
      lower.includes('secret') ||
      lower.endsWith('.jsonl') ||
      lower.includes('.jsonl/') ||
      segments.some((segment) => ['.codex', '.claude', '.git', '.symphony'].includes(segment))) {
    return null;
  }

  return ref;
}

function stripEmptyObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined)
  );
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(nonEmptyString))];
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
