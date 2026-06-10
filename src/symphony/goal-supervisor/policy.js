export const GOAL_SUPERVISOR_APP_COMMAND_BOUNDARY_DEFAULT = Object.freeze({
  state: 'disabled',
  executionAvailable: false,
  copyOnly: true,
  allowedCommandFamilies: Object.freeze([]),
  blockedCommandFamilies: Object.freeze([
    'provider-cli',
    'real-cli',
    'generic-shell',
    'daemon-launch',
    'child-dispatch',
    'goal-ledger-write',
    'event-log-write',
    'mutation-gate',
    'audit',
    'tag',
    'push-release',
    'publish-release',
    'github-release',
    'release-closeout'
  ])
});

export const GOAL_SUPERVISOR_CONFIRM_REQUIRED_FIELDS = Object.freeze([
  'planHash',
  'goalId',
  'taskId',
  'actor',
  'evidenceRef',
  'reason'
]);

const COMMAND_BOUNDARY_STATES = new Set(['disabled', 'dry-run', 'confirm-required']);
const CONTEXT_COMPACT_RATIO = 0.85;
const WAIT_STATUS_VALUES = new Set(['inProgress', 'in-progress', 'running', 'pending']);

export function projectGoalSupervisorCommandBoundary({
  commandBoundary = null
} = {}) {
  if (!isPlainObject(commandBoundary)) {
    return copyCommandBoundary(GOAL_SUPERVISOR_APP_COMMAND_BOUNDARY_DEFAULT);
  }

  const requestedState = COMMAND_BOUNDARY_STATES.has(commandBoundary.state)
    ? commandBoundary.state
    : GOAL_SUPERVISOR_APP_COMMAND_BOUNDARY_DEFAULT.state;
  const blockedCommandFamilies = uniqueStrings([
    ...GOAL_SUPERVISOR_APP_COMMAND_BOUNDARY_DEFAULT.blockedCommandFamilies,
    ...(Array.isArray(commandBoundary.blockedCommandFamilies) ? commandBoundary.blockedCommandFamilies : [])
  ]);
  const blockedSet = new Set(blockedCommandFamilies);
  const allowedCommandFamilies = requestedState === 'disabled'
    ? []
    : uniqueStrings(Array.isArray(commandBoundary.allowedCommandFamilies) ? commandBoundary.allowedCommandFamilies : [])
      .filter((family) => !blockedSet.has(family));
  const confirmationFields = requestedState === 'confirm-required'
    ? uniqueStrings([
        ...GOAL_SUPERVISOR_CONFIRM_REQUIRED_FIELDS,
        ...(Array.isArray(commandBoundary.confirmationFields) ? commandBoundary.confirmationFields : [])
      ])
    : [];
  const confirmation = requestedState === 'confirm-required'
    ? normalizeConfirmation(commandBoundary.confirmation)
    : null;

  return {
    state: requestedState,
    executionAvailable: false,
    copyOnly: true,
    allowedCommandFamilies,
    blockedCommandFamilies,
    safeCommandPreview: requestedState === 'disabled'
      ? null
      : (nonEmptyString(commandBoundary.safeCommandPreview) ? commandBoundary.safeCommandPreview : null),
    confirmationFields,
    confirmation
  };
}

export function chooseGoalSupervisorPolicyDecision({
  projection,
  pendingResult,
  activeLease,
  currentGate,
  contextStatus,
  commandBoundary
}) {
  const current = projection?.current ?? projection?.route?.current ?? {};
  const normalizedCommandBoundary = projectGoalSupervisorCommandBoundary({ commandBoundary });

  if (currentGate?.status === 'blocked') {
    return nextAction({
      actionId: 'block',
      label: 'Blocked by current gate',
      reason: currentGate.blockingReason ?? 'current-gate-blocked',
      current,
      commandBoundary: normalizedCommandBoundary,
      blockedFields: currentGate.evidenceRequirement === null ? [] : ['evidenceRequirement']
    });
  }

  if (normalizedCommandBoundary.state === 'confirm-required' && normalizedCommandBoundary.confirmation?.ready !== true) {
    return nextAction({
      actionId: 'block',
      label: 'Blocked until command preview is confirmed',
      reason: 'confirm-required-command-missing-context',
      current,
      commandBoundary: normalizedCommandBoundary,
      blockedFields: normalizedCommandBoundary.confirmation?.missingFields ?? []
    });
  }

  if (pendingResult?.status === 'pending') {
    return nextAction({
      actionId: 'checkpoint',
      label: 'Checkpoint pending result',
      reason: pendingResult.parserReason ?? 'result-awaits-registration',
      current,
      commandBoundary: normalizedCommandBoundary,
      checkpointRef: pendingResult.evidenceRef ?? null
    });
  }

  if (isContextNearLimit(contextStatus)) {
    const checkpointRef = checkpointRefFromContext(contextStatus);

    if (checkpointRef !== null) {
      return nextAction({
        actionId: 'compact',
        label: 'Compact after checkpoint',
        reason: 'context-utilization-near-limit',
        current,
        commandBoundary: normalizedCommandBoundary,
        checkpointRef
      });
    }

    return nextAction({
      actionId: 'block',
      label: 'Blocked until checkpoint is durable',
      reason: 'compact-checkpoint-missing',
      current,
      commandBoundary: normalizedCommandBoundary,
      blockedFields: ['checkpointRef']
    });
  }

  if (Array.isArray(contextStatus?.driftMarkers) && contextStatus.driftMarkers.length > 0) {
    return nextAction({
      actionId: 'recover-drift',
      label: 'Recover supervisor drift',
      reason: 'supervisor-context-drift-detected',
      current,
      commandBoundary: normalizedCommandBoundary,
      mismatchList: contextStatus.driftMarkers,
      manualInterventionReason: 'daemon-supervisor-session-state-disagree'
    });
  }

  if (contextStatus?.missingTranscriptState?.missing === true && activeLease?.threadId !== null) {
    return nextAction({
      actionId: 'block',
      label: 'Blocked by missing transcript',
      reason: contextStatus.missingTranscriptState.reason ?? 'transcript-missing-with-active-lease',
      current,
      commandBoundary: normalizedCommandBoundary,
      blockedFields: ['sessionTranscript']
    });
  }

  if (projection?.progress?.state === 'stalled' || contextStatus?.staleTranscriptState?.stale === true) {
    return nextAction({
      actionId: 'open-handoff-thread',
      label: 'Open handoff thread',
      reason: contextStatus?.staleTranscriptState?.reason ?? projection?.progress?.reason ?? 'transcript-stale',
      current,
      commandBoundary: normalizedCommandBoundary
    });
  }

  if (nonEmptyString(activeLease?.threadId)) {
    const waitReason = activeLeaseWaitReason({ projection, contextStatus });

    if (waitReason !== null) {
      return nextAction({
        actionId: 'wait',
        label: 'Wait for active thread',
        reason: waitReason,
        current,
        commandBoundary: normalizedCommandBoundary,
        waitPolicy: {
          staleThresholdMs: contextStatus?.staleTranscriptState?.thresholdMs ?? projection?.progress?.progressGraceMs ?? null,
          activeLeaseAgeMs: activeLease.ageMs ?? null
        }
      });
    }

    return nextAction({
      actionId: 'continue',
      label: 'Continue active lease',
      reason: 'active-lease-healthy',
      current,
      commandBoundary: normalizedCommandBoundary
    });
  }

  if (projection?.route?.state === 'dispatchable') {
    return nextAction({
      actionId: 'open-handoff-thread',
      label: 'Prepare next role handoff',
      reason: projection.route.reason,
      current,
      commandBoundary: normalizedCommandBoundary
    });
  }

  return nextAction({
    actionId: projection?.route?.state === 'complete' ? 'checkpoint' : 'wait',
    label: projection?.route?.state === 'complete' ? 'Checkpoint completion' : 'Wait for state change',
    reason: projection?.route?.reason ?? 'no-action-ready',
    current,
    commandBoundary: normalizedCommandBoundary
  });
}

function activeLeaseWaitReason({ projection, contextStatus }) {
  const latestToolStatus = contextStatus?.latestToolCall?.status ?? null;
  const latestTurnStatus = contextStatus?.latestTurnState?.status ?? null;

  if (WAIT_STATUS_VALUES.has(latestToolStatus)) {
    return 'active-tool-call-in-progress';
  }

  if (WAIT_STATUS_VALUES.has(latestTurnStatus)) {
    return 'active-turn-in-progress';
  }

  if (projection?.progress?.state === 'recent-progress' && projection?.progress?.reason === 'active-thread-not-loaded-within-grace-window') {
    return projection.progress.reason;
  }

  return null;
}

function nextAction({
  actionId,
  label,
  reason,
  current,
  commandBoundary,
  checkpointRef = null,
  mismatchList = [],
  manualInterventionReason = null,
  waitPolicy = null,
  blockedFields = []
}) {
  return {
    actionId,
    label,
    reason,
    targetRole: current?.role ?? null,
    taskId: current?.taskId ?? null,
    safeCommandPreview: commandBoundary.safeCommandPreview ?? null,
    requiredConfirmationFields: commandBoundary.state === 'confirm-required'
      ? commandBoundary.confirmationFields
      : [],
    checkpointRef,
    mismatchList: Array.isArray(mismatchList) ? mismatchList.filter(nonEmptyString) : [],
    manualInterventionReason,
    waitPolicy,
    blockedFields: Array.isArray(blockedFields) ? blockedFields.filter(nonEmptyString) : []
  };
}

function normalizeConfirmation(confirmation) {
  const source = isPlainObject(confirmation) ? confirmation : {};
  const values = {
    planHash: nonEmptyString(source.planHash) ? source.planHash : null,
    goalId: nonEmptyString(source.goalId) ? source.goalId : null,
    taskId: nonEmptyString(source.taskId) ? source.taskId : null,
    gateId: nonEmptyString(source.gateId) ? source.gateId : null,
    actor: nonEmptyString(source.actor) ? source.actor : null,
    evidenceRef: nonEmptyString(source.evidenceRef) ? source.evidenceRef : null,
    reason: nonEmptyString(source.reason) ? source.reason : null
  };
  const missingFields = [];

  for (const field of ['planHash', 'goalId', 'actor', 'evidenceRef', 'reason']) {
    if (values[field] === null) {
      missingFields.push(field);
    }
  }

  if (values.taskId === null && values.gateId === null) {
    missingFields.push('taskId');
  }

  return {
    ...values,
    missingFields,
    ready: missingFields.length === 0
  };
}

function isContextNearLimit(contextStatus) {
  const ratio = contextStatus?.contextUtilization?.ratio;

  return typeof ratio === 'number' && ratio >= CONTEXT_COMPACT_RATIO;
}

function checkpointRefFromContext(contextStatus) {
  return firstNonEmptyString(
    contextStatus?.checkpointRef,
    contextStatus?.resultBlockEvidence?.evidenceRef,
    contextStatus?.resultBlockEvidence?.sourceRef
  );
}

function copyCommandBoundary(boundary) {
  return {
    state: boundary.state,
    executionAvailable: boundary.executionAvailable,
    copyOnly: boundary.copyOnly,
    allowedCommandFamilies: [...boundary.allowedCommandFamilies],
    blockedCommandFamilies: [...boundary.blockedCommandFamilies]
  };
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

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}
