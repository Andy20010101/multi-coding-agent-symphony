import {
  chooseGoalSupervisorPolicyDecision,
  projectGoalSupervisorCommandBoundary
} from './policy.js';

export const THREAD_CONTINUATION_DECISION_CONTRACT_NAME = 'threadContinuationDecision.v1';
export const THREAD_CONTINUATION_DECISION_CONTRACT_VERSION = 1;

const DECISIONS = new Set([
  'continue',
  'compact',
  'new-thread',
  'wait',
  'blocked',
  'checkpoint',
  'recover-drift'
]);
const RUNNING_STATUS_VALUES = new Set([
  'active',
  'active-child-present',
  'inProgress',
  'in-progress',
  'pending',
  'running'
]);
const COMPLETED_STATUS_VALUES = new Set([
  'complete',
  'completed',
  'done',
  'finished',
  'main-verified',
  'merged-to-main',
  'release-ready'
]);
const INVALID_RESULT_STATUS_VALUES = new Set([
  'failed',
  'invalid',
  'parse-failed',
  'unreadable',
  'unsafe',
  'validation-failed'
]);

export function buildThreadContinuationDecision({
  contextAdvisory = null,
  activeChild = null,
  activeLease = null,
  pendingResult = null,
  currentPhase = null,
  taskState = null,
  supervisorProjection = null,
  supervisorPolicy = null,
  currentGate = null,
  commandBoundary = null,
  sourceContracts = [],
  generatedAt = new Date().toISOString()
} = {}) {
  const effectiveGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();
  const normalizedContext = normalizeContextAdvisory(contextAdvisory);
  const normalizedActiveChild = normalizeActiveChild(activeChild ?? activeLease);
  const normalizedPendingResult = normalizePendingResult(pendingResult);
  const normalizedTaskState = normalizeTaskState(taskState);
  const normalizedPhase = normalizeCurrentPhase(currentPhase);
  const current = normalizeCurrent({
    supervisorProjection,
    taskState: normalizedTaskState,
    currentPhase: normalizedPhase,
    activeChild: normalizedActiveChild
  });
  const normalizedCommandBoundary = advisoryCommandBoundary(commandBoundary);
  const policyAction = normalizePolicyAction({
    supervisorPolicy,
    supervisorProjection,
    pendingResult: normalizedPendingResult,
    activeChild: normalizedActiveChild,
    currentGate,
    contextAdvisory: normalizedContext,
    commandBoundary: normalizedCommandBoundary
  });
  const mismatchList = uniqueStrings([
    ...normalizedContext.mismatchList,
    ...normalizedTaskState.mismatchList,
    ...arrayOfStrings(supervisorProjection?.mismatchList),
    ...arrayOfStrings(supervisorProjection?.route?.mismatchList),
    ...arrayOfStrings(supervisorProjection?.progress?.driftMarkers),
    ...arrayOfStrings(policyAction.mismatchList)
  ]);
  const blockedFields = uniqueStrings([
    ...normalizedContext.blockedFields,
    ...normalizedTaskState.blockedFields,
    ...arrayOfStrings(policyAction.blockedFields),
    ...commandBoundaryBlockedFields(normalizedCommandBoundary)
  ]);
  const checkpointRef = firstNonEmptyString(
    normalizeEvidenceRef(normalizedPendingResult.evidenceRef),
    normalizeEvidenceRef(normalizedTaskState.checkpointRef),
    normalizeEvidenceRef(supervisorProjection?.checkpointRef),
    normalizeEvidenceRef(supervisorProjection?.contextStatus?.checkpointRef),
    normalizeEvidenceRef(policyAction.checkpointRef)
  );
  const resultBlockEvidenceRef = firstNonEmptyString(
    normalizedContext.resultBlockEvidence.evidenceRef,
    normalizedContext.resultBlockEvidence.checkpointRef
  );
  const durableEvidenceRef = firstNonEmptyString(checkpointRef, resultBlockEvidenceRef);
  const durableResultEvidence = durableEvidenceRef !== null;
  const requiredEvidence = uniqueStrings([
    ...normalizedTaskState.requiredEvidence,
    ...arrayOfStrings(normalizedPendingResult.requiredEvidence),
    ...arrayOfStrings(policyAction.requiredEvidence),
    normalizedPendingResult.status === 'pending' ? 'pending-result-registration' : null,
    normalizedTaskState.requiresCheckpoint ? 'durable-checkpoint' : null
  ]);
  const base = {
    generatedAt: effectiveGeneratedAt,
    targetRole: firstNonEmptyString(current.role, normalizedTaskState.role, normalizedActiveChild.role),
    taskId: firstNonEmptyString(current.taskId, normalizedTaskState.taskId, normalizedActiveChild.taskId),
    threadId: firstNonEmptyString(
      normalizedActiveChild.threadId,
      normalizedContext.threadId,
      current.threadId,
      normalizedTaskState.threadId
    ),
    checkpointRef,
    sourceContracts: sourceContractRefs({
      contextAdvisory,
      supervisorProjection,
      supervisorPolicy,
      sourceContracts
    }),
    commandBoundary: normalizedCommandBoundary,
    blockedFields,
    mismatchList,
    requiredEvidence
  };
  const decision = decideContinuation({
    contextAdvisory: normalizedContext,
    activeChild: normalizedActiveChild,
    pendingResult: normalizedPendingResult,
    current,
    taskState: normalizedTaskState,
    policyAction,
    commandBoundary: normalizedCommandBoundary,
    mismatchList,
    blockedFields,
    durableResultEvidence,
    checkpointRef,
    durableEvidenceRef
  });

  return {
    contractName: THREAD_CONTINUATION_DECISION_CONTRACT_NAME,
    contractVersion: THREAD_CONTINUATION_DECISION_CONTRACT_VERSION,
    generatedAt: effectiveGeneratedAt,
    readOnly: true,
    willMutate: false,
    decision: decision.decision,
    reason: decision.reason,
    confidence: confidenceForDecision({
      decision: decision.decision,
      reason: decision.reason,
      blockedFields,
      sourceContracts: base.sourceContracts,
      contextAdvisory: normalizedContext
    }),
    targetRole: base.targetRole,
    taskId: base.taskId,
    threadId: base.threadId,
    checkpointRef: decision.checkpointRef ?? base.checkpointRef,
    waitPolicy: decision.waitPolicy ?? null,
    blockedFields: decision.blockedFields ?? base.blockedFields,
    mismatchList: decision.mismatchList ?? base.mismatchList,
    requiredEvidence: decision.requiredEvidence ?? base.requiredEvidence,
    sourceContracts: base.sourceContracts,
    commandBoundary: base.commandBoundary
  };
}

function decideContinuation({
  contextAdvisory,
  activeChild,
  pendingResult,
  current,
  taskState,
  policyAction,
  commandBoundary,
  mismatchList,
  blockedFields,
  durableResultEvidence,
  checkpointRef,
  durableEvidenceRef
}) {
  if (mismatchList.length > 0 || policyAction.decision === 'recover-drift') {
    return {
      decision: 'recover-drift',
      reason: policyAction.reason ?? 'supervisor-context-drift-detected',
      mismatchList
    };
  }

  if (commandBoundary.state === 'confirm-required' && commandBoundary.confirmationReady !== true) {
    return {
      decision: 'blocked',
      reason: 'confirm-required-command-missing-context',
      blockedFields
    };
  }

  if (INVALID_RESULT_STATUS_VALUES.has(pendingResult.status)) {
    return {
      decision: 'blocked',
      reason: pendingResult.reason ?? 'pending-result-cannot-be-validated',
      blockedFields: uniqueStrings([...blockedFields, 'pendingResult'])
    };
  }

  if (contextAdvisory.missingTranscriptState.missing === true &&
      durableResultEvidence !== true) {
    return {
      decision: 'blocked',
      reason: contextAdvisory.missingTranscriptState.reason ?? 'no-readable-session-transcript',
      blockedFields: uniqueStrings([...blockedFields, 'transcriptAvailability'])
    };
  }

  if (isContextNearLimit(contextAdvisory) && durableResultEvidence !== true) {
    return {
      decision: 'blocked',
      reason: 'compact-checkpoint-missing',
      blockedFields: uniqueStrings([...blockedFields, 'checkpointRef']),
      requiredEvidence: uniqueStrings([...taskState.requiredEvidence, 'durable-checkpoint'])
    };
  }

  if (pendingResult.status === 'pending') {
    return {
      decision: 'checkpoint',
      reason: pendingResult.reason ?? 'result-awaits-registration',
      checkpointRef
    };
  }

  if (taskState.requiresCheckpoint === true && checkpointRef === null && isPhaseComplete(current, taskState)) {
    return {
      decision: 'checkpoint',
      reason: taskState.checkpointReason ?? 'phase-completion-needs-durable-record',
      requiredEvidence: uniqueStrings([...taskState.requiredEvidence, 'durable-checkpoint'])
    };
  }

  if (isContextNearLimit(contextAdvisory) && durableResultEvidence === true) {
    return {
      decision: 'compact',
      reason: 'context-utilization-near-limit',
      checkpointRef: durableEvidenceRef
    };
  }

  if (activeChild.running === true && latestSignalRecent(contextAdvisory) === true) {
    return {
      decision: 'wait',
      reason: activeChild.reason ?? runningReasonFromContext(contextAdvisory) ?? 'active-child-in-progress',
      waitPolicy: {
        activeLeaseAgeMs: activeChild.ageMs,
        staleThresholdMs: contextAdvisory.staleTranscriptState.thresholdMs,
        latestSignalAt: latestSignalAt(contextAdvisory)
      }
    };
  }

  if (runningReasonFromContext(contextAdvisory) !== null && latestSignalRecent(contextAdvisory) === true) {
    return {
      decision: 'wait',
      reason: runningReasonFromContext(contextAdvisory),
      waitPolicy: {
        activeLeaseAgeMs: activeChild.ageMs,
        staleThresholdMs: contextAdvisory.staleTranscriptState.thresholdMs,
        latestSignalAt: latestSignalAt(contextAdvisory)
      }
    };
  }

  if (needsNewThread({ contextAdvisory, current, taskState, policyAction })) {
    return {
      decision: 'new-thread',
      reason: policyAction.reason ?? contextAdvisory.staleTranscriptState.reason ?? taskState.handoffReason ?? 'phase-handoff-needed'
    };
  }

  if (activeChild.threadId !== null &&
      contextAdvisory.staleTranscriptState.stale !== true &&
      isContextNearLimit(contextAdvisory) !== true &&
      policyAllowsContinue(policyAction)) {
    return {
      decision: 'continue',
      reason: policyAction.reason ?? 'active-child-ready-to-continue'
    };
  }

  if (policyAction.decision === 'checkpoint') {
    return {
      decision: 'checkpoint',
      reason: policyAction.reason ?? 'checkpoint-recommended',
      checkpointRef
    };
  }

  if (policyAction.decision === 'blocked') {
    return {
      decision: 'blocked',
      reason: policyAction.reason ?? 'state-unsafe',
      blockedFields
    };
  }

  return {
    decision: 'wait',
    reason: policyAction.reason ?? 'no-action-ready',
    waitPolicy: {
      activeLeaseAgeMs: activeChild.ageMs,
      staleThresholdMs: contextAdvisory.staleTranscriptState.thresholdMs,
      latestSignalAt: latestSignalAt(contextAdvisory)
    }
  };
}

function normalizeContextAdvisory(contextAdvisory) {
  const context = isPlainObject(contextAdvisory) ? contextAdvisory : {};
  const policyInputs = isPlainObject(context.policyInputs) ? context.policyInputs : {};
  const latestToolCall = normalizeToolCall(context.latestToolCall ?? policyInputs.latestToolCall);
  const latestTurnState = normalizeTurnState(context.latestTurnState ?? policyInputs.latestTurnState);
  const staleTranscriptState = normalizeStaleTranscriptState(context.staleTranscriptState ?? policyInputs.staleTranscriptState);
  const missingTranscriptState = normalizeMissingTranscriptState(context.missingTranscriptState ?? policyInputs.missingTranscriptState);

  return {
    contractName: nonEmptyString(context.contractName) ? context.contractName : null,
    contractVersion: Number.isInteger(context.contractVersion) ? context.contractVersion : null,
    generatedAt: nonEmptyString(context.generatedAt) ? context.generatedAt : null,
    readOnly: context.readOnly === true,
    threadId: firstNonEmptyString(context.threadId, policyInputs.threadId),
    transcriptAvailability: nonEmptyString(context.transcriptAvailability)
      ? context.transcriptAvailability
      : (nonEmptyString(policyInputs.transcriptAvailability) ? policyInputs.transcriptAvailability : 'missing'),
    contextBand: nonEmptyString(context.contextBand) ? context.contextBand : 'unknown',
    contextUtilization: isPlainObject(context.contextUtilization)
      ? { ...context.contextUtilization }
      : { status: 'missing', ratio: 'missing' },
    latestToolCall,
    latestTurnState,
    staleTranscriptState,
    missingTranscriptState,
    resultBlockEvidence: normalizeResultBlockEvidence(context.resultBlockEvidence ?? policyInputs.resultBlockEvidence),
    blockedFields: arrayOfStrings(context.blockedFields),
    mismatchList: arrayOfStrings(context.mismatchList ?? context.driftMarkers),
    degradedReasons: arrayOfStrings(context.degradedReasons)
  };
}

function normalizeActiveChild(activeChild) {
  const child = isPlainObject(activeChild) ? activeChild : {};
  const status = firstNonEmptyString(child.status, child.state);

  return {
    leaseId: firstNonEmptyString(child.leaseId, child.activeLeaseId),
    threadId: firstNonEmptyString(child.threadId),
    taskId: firstNonEmptyString(child.taskId),
    role: firstNonEmptyString(child.role, child.targetRole),
    phase: firstNonEmptyString(child.phase),
    status,
    running: child.running === true ||
      (RUNNING_STATUS_VALUES.has(status) && COMPLETED_STATUS_VALUES.has(child.latestTurnState?.status) !== true),
    ageMs: Number.isFinite(child.ageMs) ? child.ageMs : null,
    reason: nonEmptyString(child.reason) ? child.reason : null
  };
}

function normalizePendingResult(pendingResult) {
  const result = isPlainObject(pendingResult) ? pendingResult : {};
  const status = nonEmptyString(result.status) ? result.status : 'missing';

  return {
    status,
    evidenceRef: firstNonEmptyString(result.evidenceRef, result.checkpointRef),
    reason: firstNonEmptyString(result.reason, result.parserReason),
    requiredEvidence: arrayOfStrings(result.requiredEvidence),
    missing: result.missing === true || status === 'missing'
  };
}

function normalizeTaskState(taskState) {
  const state = isPlainObject(taskState) ? taskState : {};

  return {
    taskId: firstNonEmptyString(state.taskId, state.id),
    role: firstNonEmptyString(state.role, state.targetRole),
    phase: firstNonEmptyString(state.phase, state.currentPhase),
    threadId: firstNonEmptyString(state.threadId),
    status: firstNonEmptyString(state.status),
    checkpointRef: firstNonEmptyString(state.checkpointRef, state.evidenceRef),
    requiresCheckpoint: state.requiresCheckpoint === true || state.phaseCompletionNeedsRecord === true,
    checkpointReason: firstNonEmptyString(state.checkpointReason),
    requiresHandoff: state.requiresHandoff === true || state.nextPhaseNewThread === true,
    handoffReason: firstNonEmptyString(state.handoffReason, state.nextPhaseReason),
    blockedFields: arrayOfStrings(state.blockedFields),
    mismatchList: arrayOfStrings(state.mismatchList),
    requiredEvidence: arrayOfStrings(state.requiredEvidence)
  };
}

function normalizeCurrentPhase(currentPhase) {
  if (isPlainObject(currentPhase)) {
    return {
      phase: firstNonEmptyString(currentPhase.phase, currentPhase.name),
      role: firstNonEmptyString(currentPhase.role, currentPhase.targetRole),
      taskId: firstNonEmptyString(currentPhase.taskId),
      threadId: firstNonEmptyString(currentPhase.threadId),
      requiresHandoff: currentPhase.requiresHandoff === true || currentPhase.nextPhaseNewThread === true,
      status: firstNonEmptyString(currentPhase.status)
    };
  }

  return {
    phase: firstNonEmptyString(currentPhase),
    role: null,
    taskId: null,
    threadId: null,
    requiresHandoff: false,
    status: null
  };
}

function normalizeCurrent({
  supervisorProjection,
  taskState,
  currentPhase,
  activeChild
}) {
  const current = supervisorProjection?.current ?? supervisorProjection?.route?.current ?? {};

  return {
    role: firstNonEmptyString(current.role, taskState.role, currentPhase.role, activeChild.role),
    taskId: firstNonEmptyString(current.taskId, taskState.taskId, currentPhase.taskId, activeChild.taskId),
    phase: firstNonEmptyString(current.phase, taskState.phase, currentPhase.phase, activeChild.phase),
    threadId: firstNonEmptyString(current.threadId, taskState.threadId, currentPhase.threadId, activeChild.threadId),
    status: firstNonEmptyString(current.status, taskState.status, currentPhase.status, supervisorProjection?.route?.state),
    requiresHandoff: currentPhase.requiresHandoff === true
  };
}

function normalizePolicyAction({
  supervisorPolicy,
  supervisorProjection,
  pendingResult,
  activeChild,
  currentGate,
  contextAdvisory,
  commandBoundary
}) {
  const explicit = isPlainObject(supervisorPolicy)
    ? normalizeExplicitPolicy(supervisorPolicy)
    : null;

  if (explicit !== null) {
    return explicit;
  }

  if (!isPlainObject(supervisorProjection)) {
    return {
      decision: null,
      reason: null,
      checkpointRef: null,
      mismatchList: [],
      blockedFields: [],
      requiredEvidence: []
    };
  }

  const action = chooseGoalSupervisorPolicyDecision({
    projection: supervisorProjection,
    pendingResult,
    activeLease: activeChild,
    currentGate,
    contextStatus: contextAdvisory,
    commandBoundary
  });

  return normalizeExplicitPolicy(action);
}

function normalizeExplicitPolicy(policy) {
  const rawDecision = firstNonEmptyString(policy.decision, policy.actionId);
  const decision = mapPolicyDecision(rawDecision);

  return {
    decision,
    reason: firstNonEmptyString(policy.reason),
    checkpointRef: firstNonEmptyString(policy.checkpointRef),
    mismatchList: arrayOfStrings(policy.mismatchList),
    blockedFields: arrayOfStrings(policy.blockedFields),
    requiredEvidence: arrayOfStrings(policy.requiredEvidence)
  };
}

function mapPolicyDecision(value) {
  if (value === 'block') {
    return 'blocked';
  }

  if (value === 'open-handoff-thread') {
    return 'new-thread';
  }

  if (DECISIONS.has(value)) {
    return value;
  }

  return null;
}

function advisoryCommandBoundary(commandBoundary) {
  const boundary = projectGoalSupervisorCommandBoundary({ commandBoundary });

  return {
    state: boundary.state,
    executionAvailable: false,
    copyOnly: true,
    readOnly: true,
    allowedCommandFamilies: Array.isArray(boundary.allowedCommandFamilies) ? [...boundary.allowedCommandFamilies] : [],
    blockedCommandFamilies: Array.isArray(boundary.blockedCommandFamilies) ? [...boundary.blockedCommandFamilies] : [],
    confirmationFields: Array.isArray(boundary.confirmationFields) ? [...boundary.confirmationFields] : [],
    confirmationReady: boundary.confirmation?.ready === true
  };
}

function commandBoundaryBlockedFields(commandBoundary) {
  if (commandBoundary.state !== 'confirm-required' || commandBoundary.confirmationReady === true) {
    return [];
  }

  return commandBoundary.confirmationFields;
}

function sourceContractRefs({
  contextAdvisory,
  supervisorProjection,
  supervisorPolicy,
  sourceContracts
}) {
  const refs = [
    contractRef(contextAdvisory),
    contractRef(contextAdvisory?.sessionContextRef),
    contractRef(contextAdvisory?.inventoryRef),
    contractRef(supervisorProjection),
    contractRef(supervisorPolicy),
    ...arrayOfContractRefs(sourceContracts)
  ].filter((ref) => ref !== null);
  const seen = new Set();

  return refs.filter((ref) => {
    const key = `${ref.contractName}:${ref.contractVersion ?? 'missing'}:${ref.generatedAt ?? 'missing'}:${ref.threadId ?? 'missing'}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function arrayOfContractRefs(sourceContracts) {
  return (Array.isArray(sourceContracts) ? sourceContracts : [])
    .map((source) => {
      if (typeof source === 'string') {
        return {
          contractName: source,
          contractVersion: null,
          generatedAt: null,
          readOnly: null,
          threadId: null
        };
      }

      return contractRef(source);
    })
    .filter((ref) => ref !== null);
}

function contractRef(contract) {
  if (!isPlainObject(contract) || !nonEmptyString(contract.contractName)) {
    return null;
  }

  return {
    contractName: contract.contractName,
    contractVersion: Number.isInteger(contract.contractVersion) ? contract.contractVersion : null,
    generatedAt: nonEmptyString(contract.generatedAt) ? contract.generatedAt : null,
    readOnly: contract.readOnly === true,
    threadId: nonEmptyString(contract.threadId) ? contract.threadId : null
  };
}

function confidenceForDecision({
  decision,
  reason,
  blockedFields,
  sourceContracts,
  contextAdvisory
}) {
  if (decision === 'blocked' &&
      (reason === 'no-readable-session-transcript' || reason === 'compact-checkpoint-missing')) {
    return 'unknown';
  }

  if (contextAdvisory.contractName === null || sourceContracts.length === 0) {
    return 'unknown';
  }

  if (blockedFields.length > 0 || contextAdvisory.contextBand === 'unknown') {
    return 'partial';
  }

  return 'known';
}

function needsNewThread({
  contextAdvisory,
  current,
  taskState,
  policyAction
}) {
  return contextAdvisory.staleTranscriptState.stale === true ||
    taskState.requiresHandoff === true ||
    current.requiresHandoff === true ||
    policyAction.decision === 'new-thread';
}

function isContextNearLimit(contextAdvisory) {
  const ratio = contextAdvisory.contextUtilization.ratio;

  return contextAdvisory.contextBand === 'near-limit' ||
    contextAdvisory.contextBand === 'over-limit' ||
    (typeof ratio === 'number' && ratio >= 0.85);
}

function policyAllowsContinue(policyAction) {
  return policyAction.decision === null || policyAction.decision === 'continue';
}

function isPhaseComplete(current, taskState) {
  return COMPLETED_STATUS_VALUES.has(current.status) || COMPLETED_STATUS_VALUES.has(taskState.status);
}

function latestSignalRecent(contextAdvisory) {
  return contextAdvisory.staleTranscriptState.stale !== true &&
    contextAdvisory.missingTranscriptState.missing !== true;
}

function runningReasonFromContext(contextAdvisory) {
  if (RUNNING_STATUS_VALUES.has(contextAdvisory.latestToolCall.status)) {
    return 'active-tool-call-in-progress';
  }

  if (RUNNING_STATUS_VALUES.has(contextAdvisory.latestTurnState.status)) {
    return 'active-turn-in-progress';
  }

  return null;
}

function latestSignalAt(contextAdvisory) {
  return firstNonEmptyString(
    contextAdvisory.latestToolCall.updatedAt,
    contextAdvisory.latestTurnState.updatedAt,
    contextAdvisory.generatedAt
  );
}

function normalizeToolCall(toolCall) {
  if (!isPlainObject(toolCall)) {
    return { name: null, status: 'missing', updatedAt: null };
  }

  return {
    name: firstNonEmptyString(toolCall.name),
    status: firstNonEmptyString(toolCall.status) ?? 'missing',
    updatedAt: firstNonEmptyString(toolCall.updatedAt)
  };
}

function normalizeTurnState(turnState) {
  if (!isPlainObject(turnState)) {
    return { status: 'missing', role: null, updatedAt: null };
  }

  return {
    status: firstNonEmptyString(turnState.status) ?? 'missing',
    role: firstNonEmptyString(turnState.role),
    updatedAt: firstNonEmptyString(turnState.updatedAt)
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

function normalizeResultBlockEvidence(resultBlockEvidence) {
  const evidence = isPlainObject(resultBlockEvidence) ? resultBlockEvidence : {};

  return {
    status: firstNonEmptyString(evidence.status) ?? 'missing',
    present: evidence.present === true,
    evidenceRef: normalizeEvidenceRef(evidence.evidenceRef),
    sourceRef: null,
    checkpointRef: normalizeEvidenceRef(evidence.checkpointRef)
  };
}

function normalizeEvidenceRef(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const ref = value.trim();
  const lower = ref.toLowerCase();

  if (/\s/.test(ref) ||
      /[\x00-\x1F\x7F]/.test(ref) ||
      ref.startsWith('/') ||
      ref.startsWith('~') ||
      /^[a-z]:[\\/]/i.test(ref) ||
      ref.includes('\\') ||
      ref === '..' ||
      ref.startsWith('../') ||
      ref.includes('/../') ||
      lower.startsWith('file:') ||
      lower.startsWith('stdout:') ||
      lower.includes('prompt') ||
      lower.includes('secret') ||
      lower.endsWith('.jsonl') ||
      lower.includes('.jsonl/')) {
    return null;
  }

  return ref;
}

function arrayOfStrings(values) {
  return (Array.isArray(values) ? values : [])
    .filter(nonEmptyString);
}

function uniqueStrings(values) {
  return [...new Set(values.filter(nonEmptyString))];
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (nonEmptyString(value)) {
      return value;
    }
  }

  return null;
}

function millisOrNow(value) {
  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? parsed : Date.now();
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}
