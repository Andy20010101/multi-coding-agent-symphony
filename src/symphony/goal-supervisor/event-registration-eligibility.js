import {
  GOAL_EVENT_LOG_CONTRACT_NAME,
  GOAL_EVENT_LOG_CONTRACT_VERSION,
  GOAL_UPDATE_PLAN_CONTRACT_NAME,
  GOAL_UPDATE_PLAN_CONTRACT_VERSION,
  GOAL_EVENT_TYPES,
  isSafeGoalEventToken
} from '../goal-event-contracts.js';
import {
  CONTEXT_ADVISORY_CONTRACT_NAME,
  CONTEXT_ADVISORY_CONTRACT_VERSION
} from './session-context.js';
import {
  THREAD_CONTINUATION_DECISION_CONTRACT_NAME,
  THREAD_CONTINUATION_DECISION_CONTRACT_VERSION
} from './thread-continuation-decision.js';
import { projectGoalSupervisorCommandBoundary } from './policy.js';

export const SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME =
  'supervisorEventRegistrationEligibility.v1';
export const SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_VERSION = 1;

const GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_REF = Object.freeze({
  contractName: 'goal-supervisor-app-read-model.v1',
  contractVersion: 1,
  generatedAt: null,
  readOnly: true,
  threadId: null
});

const ALLOWED_UPDATE_EVENTS = Object.freeze([
  'worker.started',
  'worker.evidence-recorded',
  'worker.self-check-passed',
  'worker.self-check-failed',
  'blocker.opened',
  'blocker.resolved'
]);

const UPDATE_EVENTS_REQUIRING_EVIDENCE = new Set([
  'worker.evidence-recorded',
  'worker.self-check-passed',
  'worker.self-check-failed'
]);

const REVIEW_EVENTS = new Set([
  'reviewer.approved',
  'reviewer.needs-revision',
  'reviewer.blocked'
]);

const GATE_EVENTS = new Set([
  'main.verification-passed',
  'main.verification-failed',
  'release.gate-passed',
  'release.gate-failed',
  'release.evidence-recorded',
  'release.ready-declared'
]);

const SUPERVISOR_ACTOR_IDS = Object.freeze({
  worker: 'local-goal-supervisor-worker',
  reviewer: 'local-goal-supervisor-reviewer',
  'main-verifier': 'local-goal-supervisor-main-verifier',
  'release-verifier': 'local-goal-supervisor-release-verifier',
  'release-manager': 'local-goal-supervisor-release-manager'
});

const BLOCKED_EVENT_CATALOG = Object.freeze([
  {
    eventType: 'reviewer.approved',
    command: 'review',
    commandName: 'symphony goal review',
    reason: 'route-to-goal-review'
  },
  {
    eventType: 'reviewer.needs-revision',
    command: 'review',
    commandName: 'symphony goal review',
    reason: 'route-to-goal-review'
  },
  {
    eventType: 'reviewer.blocked',
    command: 'review',
    commandName: 'symphony goal review',
    reason: 'route-to-goal-review'
  },
  {
    eventType: 'main.verification-passed',
    command: 'gate',
    commandName: 'symphony goal gate',
    reason: 'route-to-goal-gate'
  },
  {
    eventType: 'main.verification-failed',
    command: 'gate',
    commandName: 'symphony goal gate',
    reason: 'route-to-goal-gate'
  },
  {
    eventType: 'release.gate-passed',
    command: 'gate',
    commandName: 'symphony goal gate',
    reason: 'route-to-goal-gate'
  },
  {
    eventType: 'release.gate-failed',
    command: 'gate',
    commandName: 'symphony goal gate',
    reason: 'route-to-goal-gate'
  },
  {
    eventType: 'release.evidence-recorded',
    command: 'gate',
    commandName: 'symphony goal gate',
    reason: 'route-to-goal-gate'
  },
  {
    eventType: 'release.ready-declared',
    command: 'gate',
    commandName: 'symphony goal gate',
    reason: 'route-to-goal-gate'
  }
]);

const REQUIRED_CONFIRM_FIELDS = Object.freeze([
  'command',
  'planHash',
  'task',
  'event',
  'actor'
]);

const OPTIONAL_CONFIRM_FIELDS = Object.freeze([
  'evidenceRef',
  'evidenceRefs',
  'statement',
  'branch',
  'commit',
  'blockerId',
  'blockerReason',
  'blockerSeverity'
]);
const LOCAL_HIDDEN_PATH_SEGMENTS = new Set([
  '.codex',
  '.claude',
  '.git',
  '.symphony'
]);
const RAW_TRANSCRIPT_PATTERN = /\braw[\s_-]*transcript\b/iu;

export function buildSupervisorEventRegistrationEligibility({
  goalId = null,
  pendingResult = null,
  pendingResultRecord = null,
  threadContinuationDecision = null,
  taskState = null,
  commandBoundary = null,
  sourceContracts = [],
  generatedAt = new Date().toISOString()
} = {}) {
  const effectiveGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();
  const decision = normalizeThreadContinuationDecision(threadContinuationDecision);
  const task = normalizeTaskState(taskState);
  const result = normalizePendingResult({
    pendingResult,
    pendingResultRecord,
    taskState: task,
    decision,
    goalId
  });
  const boundary = projectGoalSupervisorCommandBoundary({ commandBoundary });
  const route = routeForEvent(result.eventType);
  const recommendedEvent = buildRecommendedEvent({
    result,
    task,
    route,
    decision
  });
  const sourceReason = safeReason(
    result.reason,
    decision.reason,
    result.status === 'pending' ? 'result-awaits-registration' : null
  );
  const base = {
    contractName: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_NAME,
    contractVersion: SUPERVISOR_EVENT_REGISTRATION_ELIGIBILITY_CONTRACT_VERSION,
    generatedAt: effectiveGeneratedAt,
    readOnly: true,
    willMutate: false,
    goalId: result.goalId,
    taskId: result.taskId,
    threadId: result.threadId,
    sourceContracts: sourceContractRefs({
      sourceContracts,
      threadContinuationDecision,
      pendingResult,
      generatedAt: effectiveGeneratedAt,
      threadId: result.threadId
    }),
    recommendedEvent,
    allowedEvents: [...ALLOWED_UPDATE_EVENTS],
    blockedEvents: BLOCKED_EVENT_CATALOG.map((event) => ({ ...event })),
    requiredInputs: requiredInputsFor(result.eventType, route),
    missingInputs: [],
    previewRequest: null,
    confirmRequestShape: null,
    boundaries: buildBoundaries(boundary)
  };

  if (isContinuationBlocked(decision)) {
    return {
      ...base,
      state: 'blocked',
      reason: safeReason(decision.reason, 'thread-continuation-blocked'),
      missingInputs: uniqueStrings([
        ...base.missingInputs,
        ...decision.blockedFields
      ])
    };
  }

  if (result.status !== 'pending') {
    if (result.status !== 'missing') {
      return {
        ...base,
        state: 'blocked',
        reason: safeReason(result.reason, `pending-result-${result.status}`)
      };
    }

    return {
      ...base,
      state: 'not-applicable',
      reason: 'no-pending-result-registration'
    };
  }

  if (decision.decision !== 'checkpoint') {
    return {
      ...base,
      state: 'not-applicable',
      reason: 'thread-continuation-decision-not-checkpoint'
    };
  }

  if (route.command === 'review') {
    return {
      ...base,
      state: 'blocked',
      reason: 'event-routed-to-goal-review'
    };
  }

  if (route.command === 'gate') {
    return {
      ...base,
      state: 'blocked',
      reason: 'event-routed-to-goal-gate'
    };
  }

  if (route.command !== 'update') {
    return {
      ...base,
      state: 'blocked',
      reason: route.reason
    };
  }

  const missingInputs = missingInputsFor({
    result,
    route,
    requiredInputs: base.requiredInputs
  });

  if (missingInputs.length > 0) {
    return {
      ...base,
      state: 'blocked',
      reason: 'required-inputs-missing',
      missingInputs
    };
  }

  if (result.eventCandidateState !== null && result.eventCandidateState !== 'eligible') {
    return {
      ...base,
      state: 'blocked',
      reason: safeReason(result.reason, 'pending-result-event-candidate-blocked')
    };
  }

  return {
    ...base,
    state: 'eligible',
    reason: 'eligible-goal-update-event',
    previewRequest: buildPreviewRequest(result),
    confirmRequestShape: buildConfirmRequestShape(result)
  };
}

function normalizeThreadContinuationDecision(decision) {
  const source = isPlainObject(decision) ? decision : {};

  return {
    contractName: nonEmptyString(source.contractName)
      ? source.contractName
      : THREAD_CONTINUATION_DECISION_CONTRACT_NAME,
    contractVersion: Number.isInteger(source.contractVersion)
      ? source.contractVersion
      : THREAD_CONTINUATION_DECISION_CONTRACT_VERSION,
    generatedAt: safeTimestamp(source.generatedAt),
    readOnly: source.readOnly === true || source.contractName === undefined,
    decision: firstNonEmptyString(source.decision, 'unknown'),
    reason: safeReason(source.reason),
    taskId: safeToken(source.taskId),
    threadId: safeToken(source.threadId),
    checkpointRef: safeEvidenceRef(source.checkpointRef),
    blockedFields: uniqueStrings(Array.isArray(source.blockedFields) ? source.blockedFields : []),
    requiredEvidence: uniqueStrings(Array.isArray(source.requiredEvidence) ? source.requiredEvidence : []),
    sourceContracts: Array.isArray(source.sourceContracts) ? source.sourceContracts : []
  };
}

function normalizeTaskState(taskState) {
  const state = isPlainObject(taskState) ? taskState : {};

  return {
    taskId: safeToken(firstNonEmptyString(state.taskId, state.id)),
    role: safeRole(firstNonEmptyString(state.role, state.targetRole)),
    threadId: safeToken(state.threadId),
    status: safeReason(state.status),
    eventToRegister: safeEventType(state.eventToRegister),
    evidenceRef: safeEvidenceRef(firstNonEmptyString(state.evidenceRef, state.checkpointRef)),
    branch: safeOptionalRef(state.branch),
    commit: safeOptionalRef(firstNonEmptyString(state.commit, state.headCommit)),
    blocker: normalizeBlocker(state.blocker)
  };
}

function normalizePendingResult({
  pendingResult,
  pendingResultRecord,
  taskState,
  decision,
  goalId
}) {
  const pending = isPlainObject(pendingResult) ? pendingResult : {};
  const eventCandidate = isPlainObject(pending.eventCandidate) ? pending.eventCandidate : {};
  const record = firstPlainObject(
    pendingResultRecord,
    pending.result,
    pending.record,
    pending.pendingResult?.result,
    pending.pendingResult?.record
  );
  const v51PendingResult = isV51PendingResult(pending);
  const eventType = safeEventType(firstNonEmptyString(
    record?.eventToRegister,
    pending.eventToRegister,
    eventCandidate.eventType,
    taskState.eventToRegister
  ));
  const role = safeRole(firstNonEmptyString(
    record?.role,
    pending.role,
    pending.workerRole,
    taskState.role,
    inferRoleForEvent(eventType)
  ));
  const actorRole = actorRoleFor({ eventType, role });
  const evidenceCandidates = [
    record?.evidenceRefs,
    pending.evidenceRefs,
    eventCandidate.evidenceRefs,
    record?.evidenceRef,
    pending.evidenceRef,
    taskState.evidenceRef
  ].filter((value) => value !== null && value !== undefined);
  const eventCandidateState = safeReason(eventCandidate.state);

  return {
    status: normalizePendingResultStatus({
      pending,
      record,
      eventCandidate,
      v51PendingResult
    }),
    reason: safeReason(firstNonEmptyString(
      pending.reason,
      pending.parserReason,
      eventCandidate.reason,
      Array.isArray(pending.blockedReasons) ? pending.blockedReasons[0] : null
    )),
    goalId: safeToken(firstNonEmptyString(record?.goalId, pending.goalId, goalId)),
    taskId: safeToken(firstNonEmptyString(record?.taskId, pending.taskId, taskState.taskId, decision.taskId)),
    threadId: safeToken(firstNonEmptyString(record?.threadId, pending.threadId, decision.threadId, taskState.threadId)),
    role,
    actorRole,
    actorId: safeToken(firstNonEmptyString(
      record?.actorId,
      record?.actor?.id,
      pending.actorId,
      pending.actor?.id,
      SUPERVISOR_ACTOR_IDS[actorRole]
    )),
    eventType,
    evidenceRefs: normalizeEvidenceRefs(evidenceCandidates.length > 0
      ? evidenceCandidates
      : [decision.checkpointRef]),
    statement: safeStatement(firstNonEmptyString(
      record?.statement,
      pending.statement,
      pending.sanitizedSummary?.summary
    )),
    branch: safeOptionalRef(firstNonEmptyString(record?.branch, pending.branch, taskState.branch)),
    commit: safeOptionalRef(firstNonEmptyString(record?.headCommit, record?.commit, pending.headCommit, pending.commit, taskState.commit)),
    blocker: normalizeBlocker(firstPlainObject(
      record?.blocker,
      pending.blocker,
      eventCandidate.blocker,
      isPlainObject(pending.sanitizedSummary) && nonEmptyString(pending.sanitizedSummary.blockerReason)
        ? { reason: pending.sanitizedSummary.blockerReason }
        : null,
      taskState.blocker
    )),
    eventCandidateState,
    requiresControlledEvidence: v51PendingResult ||
      eventCandidate.requiresEvidence === true ||
      UPDATE_EVENTS_REQUIRING_EVIDENCE.has(eventType)
  };
}

function isV51PendingResult(pendingResult) {
  return pendingResult.contractName === 'pendingResult.v1' ||
    (nonEmptyString(pendingResult.state) && isPlainObject(pendingResult.eventCandidate));
}

function normalizePendingResultStatus({
  pending,
  record,
  eventCandidate,
  v51PendingResult
}) {
  if (v51PendingResult) {
    if (pending.state === 'consumed' || pending.state === 'superseded') {
      return pending.state;
    }

    return 'pending';
  }

  return firstNonEmptyString(pending.status, record === null ? null : 'pending', 'missing');
}

function routeForEvent(eventType) {
  if (!nonEmptyString(eventType)) {
    return {
      command: null,
      commandName: null,
      reason: 'missing-event-type'
    };
  }

  if (ALLOWED_UPDATE_EVENTS.includes(eventType)) {
    return {
      command: 'update',
      commandName: 'symphony goal update',
      reason: 'allowed-goal-update-event'
    };
  }

  if (REVIEW_EVENTS.has(eventType)) {
    return {
      command: 'review',
      commandName: 'symphony goal review',
      reason: 'route-to-goal-review'
    };
  }

  if (GATE_EVENTS.has(eventType)) {
    return {
      command: 'gate',
      commandName: 'symphony goal gate',
      reason: 'route-to-goal-gate'
    };
  }

  if (GOAL_EVENT_TYPES.includes(eventType)) {
    return {
      command: null,
      commandName: null,
      reason: 'event-not-eligible-for-supervisor-registration'
    };
  }

  return {
    command: null,
    commandName: null,
    reason: 'unsupported-goal-event'
  };
}

function buildRecommendedEvent({
  result,
  task,
  route,
  decision
}) {
  if (!nonEmptyString(result.eventType)) {
    return null;
  }

  return stripNullish({
    eventType: result.eventType,
    command: route.command,
    commandName: route.commandName,
    actorRole: result.actorRole,
    actorId: result.actorId,
    taskId: result.taskId,
    evidenceRefs: result.evidenceRefs,
    statement: result.statement,
    branch: result.branch,
    commit: result.commit,
    blocker: result.blocker,
    sourceReason: safeReason(
      result.reason,
      decision.reason,
      task.status,
      route.reason
    )
  });
}

function requiredInputsFor(eventType, route) {
  if (route.command !== 'update') {
    return [];
  }

  const required = [
    'goalId',
    'taskId',
    'command',
    'event',
    'actor'
  ];

  if (UPDATE_EVENTS_REQUIRING_EVIDENCE.has(eventType)) {
    required.push('evidenceRef');
  }

  if (eventType === 'blocker.opened') {
    required.push('blockerReason');
  }

  if (eventType === 'blocker.resolved') {
    required.push('blockerId');
  }

  return required;
}

function missingInputsFor({
  result,
  route,
  requiredInputs
}) {
  if (route.command !== 'update') {
    return [];
  }

  const missing = [];
  const byInput = {
    goalId: result.goalId,
    taskId: result.taskId,
    command: route.command,
    event: result.eventType,
    actor: result.actorId,
    evidenceRef: result.evidenceRefs.length > 0 ? result.evidenceRefs[0] : null,
    blockerReason: result.blocker?.reason ?? null,
    blockerId: result.blocker?.blockerId ?? null
  };

  for (const input of requiredInputs) {
    if (!nonEmptyString(byInput[input])) {
      missing.push(input);
    }
  }

  if (result.requiresControlledEvidence === true && result.evidenceRefs.length === 0) {
    missing.push('evidenceRef');
  }

  return uniqueStrings(missing);
}

function buildPreviewRequest(result) {
  return {
    method: 'GET',
    route: `/api/goals/${encodeURIComponent(result.goalId)}/event-plan-preview`,
    query: stripUndefined({
      command: 'update',
      task: result.taskId,
      event: result.eventType,
      actor: result.actorId,
      evidenceRef: [...result.evidenceRefs],
      statement: result.statement ?? undefined,
      branch: result.branch ?? undefined,
      commit: result.commit ?? undefined,
      blockerId: result.blocker?.blockerId,
      blockerReason: result.blocker?.reason,
      blockerSeverity: result.blocker?.severity
    })
  };
}

function buildConfirmRequestShape(result) {
  return {
    method: 'POST',
    route: `/api/goals/${encodeURIComponent(result.goalId)}/event-plan-confirm`,
    contentType: 'application/json',
    requiredBodyFields: [...REQUIRED_CONFIRM_FIELDS],
    optionalBodyFields: [...OPTIONAL_CONFIRM_FIELDS],
    confirmUsesPlanHash: true
  };
}

function buildBoundaries(commandBoundary) {
  return {
    readOnly: true,
    willMutate: false,
    dryRunWrites: false,
    projectionAppendsEvent: false,
    confirmWritesAppendOnly: true,
    genericShellRunner: false,
    genericShellAvailable: false,
    providerLaunchAvailable: false,
    providerCliAvailable: false,
    childDispatchAvailable: false,
    frontendFileReadAvailable: false,
    transcriptCompactAvailable: false,
    newThreadAvailable: false,
    goalLedgerWriteAvailable: false,
    eventLogWriteAvailable: false,
    gitWriteAvailable: false,
    tagAutomationAvailable: false,
    releaseAutomationAvailable: false,
    githubReleaseAutomationAvailable: false,
    githubReleaseAvailable: false,
    commandBoundary: {
      state: commandBoundary.state,
      executionAvailable: false,
      copyOnly: true,
      allowedCommandFamilies: Array.isArray(commandBoundary.allowedCommandFamilies)
        ? [...commandBoundary.allowedCommandFamilies]
        : [],
      blockedCommandFamilies: uniqueStrings([
        ...(Array.isArray(commandBoundary.blockedCommandFamilies) ? commandBoundary.blockedCommandFamilies : []),
        'provider-cli',
        'generic-shell',
        'child-dispatch',
        'transcript-compact',
        'new-thread',
        'git',
        'tag',
        'release',
        'github-release',
        'frontend-file-read'
      ])
    }
  };
}

function sourceContractRefs({
  sourceContracts,
  threadContinuationDecision,
  pendingResult,
  generatedAt,
  threadId
}) {
  const refs = [
    GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_REF,
    {
      contractName: THREAD_CONTINUATION_DECISION_CONTRACT_NAME,
      contractVersion: THREAD_CONTINUATION_DECISION_CONTRACT_VERSION,
      generatedAt: safeTimestamp(threadContinuationDecision?.generatedAt),
      readOnly: threadContinuationDecision?.readOnly === true,
      threadId: safeToken(threadContinuationDecision?.threadId)
    },
    {
      contractName: CONTEXT_ADVISORY_CONTRACT_NAME,
      contractVersion: CONTEXT_ADVISORY_CONTRACT_VERSION,
      generatedAt: null,
      readOnly: true,
      threadId
    },
    {
      contractName: GOAL_EVENT_LOG_CONTRACT_NAME,
      contractVersion: GOAL_EVENT_LOG_CONTRACT_VERSION,
      generatedAt: null,
      readOnly: true,
      threadId: null
    },
    {
      contractName: GOAL_UPDATE_PLAN_CONTRACT_NAME,
      contractVersion: GOAL_UPDATE_PLAN_CONTRACT_VERSION,
      generatedAt,
      readOnly: true,
      threadId: null
    },
    ...arrayOfContractRefs(pendingResultSourceContracts(pendingResult)),
    ...arrayOfContractRefs(threadContinuationDecision?.sourceContracts),
    ...arrayOfContractRefs(sourceContracts)
  ];
  const seen = new Set();

  return refs
    .filter((ref) => isPlainObject(ref) && nonEmptyString(ref.contractName))
    .map((ref) => ({
      contractName: ref.contractName,
      contractVersion: Number.isInteger(ref.contractVersion) ? ref.contractVersion : null,
      generatedAt: safeTimestamp(ref.generatedAt),
      readOnly: ref.readOnly === true,
      threadId: safeToken(ref.threadId)
    }))
    .filter((ref) => {
      const key = `${ref.contractName}:${ref.contractVersion ?? 'missing'}:${ref.generatedAt ?? 'missing'}:${ref.threadId ?? 'missing'}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function pendingResultSourceContracts(pendingResult) {
  const pending = isPlainObject(pendingResult) ? pendingResult : {};

  if (!isV51PendingResult(pending)) {
    return [];
  }

  return [
    {
      contractName: 'pendingResult.v1',
      contractVersion: Number.isInteger(pending.contractVersion) ? pending.contractVersion : 1,
      generatedAt: safeTimestamp(pending.createdAt),
      readOnly: true,
      threadId: safeToken(pending.threadId)
    },
    ...arrayOfContractRefs(pending.sourceContracts).map((contract) => ({
      ...contract,
      readOnly: true
    }))
  ];
}

function arrayOfContractRefs(sourceContracts) {
  return (Array.isArray(sourceContracts) ? sourceContracts : [])
    .map((contract) => {
      if (typeof contract === 'string') {
        return {
          contractName: contract,
          contractVersion: null,
          generatedAt: null,
          readOnly: null,
          threadId: null
        };
      }

      return isPlainObject(contract) ? contract : null;
    })
    .filter((contract) => contract !== null);
}

function isContinuationBlocked(decision) {
  if (decision.decision === 'checkpoint') {
    return false;
  }

  return decision.decision === 'blocked' ||
    decision.reason === 'no-readable-session-transcript' ||
    decision.reason === 'transcript-missing-with-active-lease' ||
    decision.blockedFields.includes('transcriptAvailability') ||
    decision.blockedFields.includes('sessionTranscript');
}

function normalizeEvidenceRefs(values) {
  return uniqueStrings(flattenEvidenceRefValues(values).map(safeEvidenceRef));
}

function flattenEvidenceRefValues(values) {
  const refs = [];

  for (const value of Array.isArray(values) ? values : []) {
    if (Array.isArray(value)) {
      refs.push(...flattenEvidenceRefValues(value));
      continue;
    }

    if (isPlainObject(value)) {
      refs.push(stringifyEvidenceRef(value));
      continue;
    }

    refs.push(value);
  }

  return refs;
}

function stringifyEvidenceRef(evidenceRef) {
  if (!isPlainObject(evidenceRef) ||
      !nonEmptyString(evidenceRef.kind) ||
      !nonEmptyString(evidenceRef.ref)) {
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

function safeEvidenceRef(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  const [kind, ref] = splitEvidenceKind(trimmed);

  if (hasUnsafeText(trimmed) ||
      hasUnsafePathShape(ref) ||
      hasUnsafeLocalEvidencePath(ref) ||
      lower.includes('%2e') ||
      lower.includes('%2f') ||
      lower.includes('%5c')) {
    return null;
  }

  if (kind === 'repo-doc' && !ref.startsWith('docs/plans/')) {
    return null;
  }

  return kind === 'repo-doc' ? ref : `${kind}:${ref}`;
}

function splitEvidenceKind(value) {
  const separator = value.indexOf(':');

  if (separator > 0) {
    const prefix = value.slice(0, separator);

    if (prefix === 'repo-doc' || prefix === 'artifact-ref') {
      return [prefix, value.slice(separator + 1)];
    }
  }

  return ['repo-doc', value];
}

function normalizeBlocker(value) {
  const blocker = isPlainObject(value) ? value : {};
  const normalized = stripNullish({
    blockerId: safeToken(firstNonEmptyString(blocker.blockerId, blocker.id)),
    reason: safeReason(blocker.reason),
    severity: safeReason(blocker.severity)
  });

  return Object.keys(normalized).length === 0 ? null : normalized;
}

function safeToken(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();

  if (!isSafeGoalEventToken(trimmed) || hasUnsafeText(trimmed) || hasUnsafePathShape(trimmed)) {
    return null;
  }

  return trimmed;
}

function safeEventType(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();

  return GOAL_EVENT_TYPES.includes(trimmed) ? trimmed : null;
}

function safeRole(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();

  return [
    'worker',
    'reviewer',
    'main-verifier',
    'release-verifier',
    'release-manager'
  ].includes(trimmed)
    ? trimmed
    : null;
}

function safeOptionalRef(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();

  if (hasUnsafeText(trimmed) || hasUnsafePathShape(trimmed) || /[\r\n]/u.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function safeStatement(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length > 240 || hasUnsafeText(trimmed) || hasUnsafePathShape(trimmed) || /[\r\n]/u.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function safeReason(...values) {
  for (const value of values) {
    if (!nonEmptyString(value)) {
      continue;
    }

    const trimmed = value.trim();

    if (!hasUnsafeText(trimmed) && !hasUnsafePathShape(trimmed) && !/[\r\n]/u.test(trimmed)) {
      return trimmed;
    }
  }

  return null;
}

function safeTimestamp(value) {
  if (!nonEmptyString(value)) {
    return null;
  }

  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function hasUnsafeText(value) {
  const lower = value.toLowerCase();

  return /[\x00-\x1F\x7F]/u.test(value) ||
    RAW_TRANSCRIPT_PATTERN.test(value) ||
    lower.includes('jsonl') ||
    lower.includes('prompt') ||
    lower.includes('stdout') ||
    lower.includes('secret') ||
    lower.startsWith('file:');
}

function hasUnsafeLocalEvidencePath(value) {
  if (!nonEmptyString(value)) {
    return false;
  }

  const normalized = value.replaceAll('\\', '/').toLowerCase();
  const segments = normalized.split('/').filter((segment) => segment !== '');
  const pathLike = normalized.includes('/');

  if (segments.some((segment) => LOCAL_HIDDEN_PATH_SEGMENTS.has(segment))) {
    return true;
  }

  if (segments.some((segment) => segment.startsWith('.'))) {
    return true;
  }

  if (pathLike && segments.includes('sessions')) {
    return true;
  }

  if (pathLike && normalized.includes('transcript')) {
    return true;
  }

  return normalized.endsWith('.jsonl') ||
    normalized.includes('.jsonl/');
}

function hasUnsafePathShape(value) {
  return value.startsWith('/') ||
    value.startsWith('~') ||
    /^[a-z]:[\\/]/iu.test(value) ||
    value.includes('\\') ||
    value === '..' ||
    value.startsWith('../') ||
    value.includes('/../');
}

function actorRoleFor({
  eventType,
  role
}) {
  if (eventType?.startsWith('reviewer.')) {
    return 'reviewer';
  }

  if (eventType?.startsWith('main.')) {
    return 'main-verifier';
  }

  if (eventType?.startsWith('release.')) {
    return role === 'release-verifier' ? 'release-verifier' : 'release-manager';
  }

  return 'worker';
}

function inferRoleForEvent(eventType) {
  if (!nonEmptyString(eventType)) {
    return null;
  }

  if (eventType.startsWith('reviewer.')) {
    return 'reviewer';
  }

  if (eventType.startsWith('main.')) {
    return 'main-verifier';
  }

  if (eventType.startsWith('release.')) {
    return 'release-manager';
  }

  return 'worker';
}

function firstPlainObject(...values) {
  return values.find(isPlainObject) ?? null;
}

function stripNullish(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined)
  );
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
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
