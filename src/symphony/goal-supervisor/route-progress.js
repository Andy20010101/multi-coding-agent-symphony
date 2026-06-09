export const GOAL_SUPERVISOR_ROUTE_ENGINE_CONTRACT_NAME = 'goal-supervisor-route-engine.v1';
export const GOAL_SUPERVISOR_PROGRESS_OBSERVER_CONTRACT_NAME = 'goal-supervisor-progress-observer.v1';

const ACTIVE_STATUSES = Object.freeze([
  'thread-requested',
  'thread-active',
  'active',
  'result-ready',
  'result-invalid'
]);

const DEFAULT_PROGRESS_GRACE_MS = 15 * 60 * 1000;

export function decideGoalSupervisorRoute({
  state = {},
  goalNext,
  routeInput = null,
  allowCloseout = false,
  nowMs = Date.now(),
  progressGraceMs = DEFAULT_PROGRESS_GRACE_MS
}) {
  const normalizedState = normalizeState(state);
  const initialCurrent = normalizeCurrent(goalNext?.next ?? routeInput?.activeLease ?? normalizedState.active);
  const revisionOverride = currentAfterLocalWorkerRevision({
    state: normalizedState,
    current: initialCurrent
  });
  const current = revisionOverride.current ?? initialCurrent;
  const progress = observeGoalSupervisorProgress({
    state: normalizedState,
    goalNext,
    routeInput,
    nowMs,
    progressGraceMs
  });

  if (goalNext?.status === 'complete') {
    if (progress.state === 'pending-result') {
      return routeDecision({
        state: 'pending-result',
        current: progress.current,
        pendingResult: progress.pendingResult,
        action: { kind: 'register-recorded-result' },
        reason: 'goal-complete-with-unconsumed-result',
        progress
      });
    }

    if (hasLiveSupervisorLease(normalizedState)) {
      return routeDecision({
        state: 'blocked',
        current: progress.current,
        action: { kind: 'recovery-required' },
        reason: 'goal-complete-with-live-supervisor-lease',
        progress
      });
    }

    return routeDecision({
      state: 'complete',
      current: null,
      action: { kind: 'none' },
      reason: goalNext?.reason ?? 'goal-complete',
      progress
    });
  }

  if (goalNext?.status !== 'action-required' || goalNext?.next?.blocked === true) {
    return routeDecision({
      state: 'blocked',
      current,
      action: { kind: 'block' },
      reason: goalNext?.reason ?? 'goal-next-blocked',
      progress
    });
  }

  if (routeInput?.status === 'pending-result' && routeInput?.resultAvailability?.valid === true) {
    return routeDecision({
      state: 'pending-result',
      current,
      pendingResult: resultFromAvailability(routeInput.resultAvailability),
      action: { kind: 'register-recorded-result' },
      reason: routeInput.reason ?? 'valid-result-available',
      progress
    });
  }

  if (hasActiveLeaseForCurrent({ active: normalizedState.active, current })) {
    if (progress.state === 'stalled') {
      return routeDecision({
        state: 'stalled',
        current,
        action: { kind: 'operator-thread-progress-recovery' },
        reason: 'active-child-stalled',
        progress
      });
    }

    return routeDecision({
      state: progress.state === 'pending-result' ? 'pending-result' : 'recent-progress',
      current,
      pendingResult: progress.pendingResult,
      action: { kind: progress.state === 'pending-result' ? 'register-recorded-result' : 'wait-active-thread' },
      reason: 'active-lease-exists',
      progress
    });
  }

  if (current.role === 'release-manager' && allowCloseout !== true) {
    return routeDecision({
      state: 'blocked',
      current,
      action: { kind: 'block' },
      reason: 'release-closeout-requires-operator-authorization',
      progress
    });
  }

  const pendingResult = latestValidResultForCurrent({
    state: normalizedState,
    current
  });

  if (pendingResult !== null) {
    return routeDecision({
      state: 'pending-result',
      current,
      pendingResult,
      action: { kind: 'register-recorded-result' },
      reason: 'recorded-result-awaits-registration',
      progress
    });
  }

  return routeDecision({
    state: 'dispatchable',
    current,
    action: { kind: 'create-fresh-controller' },
    reason: revisionOverride.reason ?? goalNext.reason ?? 'next-action-required',
    progress
  });
}

export function observeGoalSupervisorProgress({
  state = {},
  goalNext = null,
  routeInput = null,
  nowMs = Date.now(),
  progressGraceMs = DEFAULT_PROGRESS_GRACE_MS
}) {
  const normalizedState = normalizeState(state);
  const active = normalizedState.active;
  const thread = routeInput?.thread ?? null;
  const current = normalizeCurrent(active ?? routeInput?.activeLease ?? goalNext?.next ?? {});
  const pendingResult = routeInput?.resultAvailability?.valid === true
    ? resultFromAvailability(routeInput.resultAvailability)
    : latestValidResultForCurrent({ state: normalizedState, current });

  if (goalNext?.status === 'complete' && !hasLiveSupervisorLease(normalizedState) && pendingResult === null) {
    return progressSnapshot({
      state: 'complete',
      current: null,
      reason: 'goal-next-complete',
      progressAgeMs: null,
      progressGraceMs,
      pendingResult
    });
  }

  if (pendingResult !== null || active?.status === 'result-ready') {
    return progressSnapshot({
      state: 'pending-result',
      current,
      reason: 'valid-result-awaits-registration',
      progressAgeMs: null,
      progressGraceMs,
      pendingResult
    });
  }

  const observedAt = latestTimestamp([
    thread?.latestTurn?.updatedAt,
    thread?.latestTurn?.completedAt,
    thread?.latestTurn?.createdAt,
    thread?.latestTurn?.startedAt,
    thread?.latestInProgressTurn?.updatedAt,
    thread?.latestTerminalTurn?.updatedAt,
    normalizedState.threadRecordById.get(active?.threadId)?.updatedAt,
    active?.updatedAt,
    active?.createdAt
  ]);
  const progressAgeMs = observedAt === null
    ? null
    : Math.max(0, nowMs - Date.parse(observedAt));
  const stale = progressAgeMs !== null && progressAgeMs >= progressGraceMs;

  if (active !== null && stale) {
    return progressSnapshot({
      state: 'stalled',
      current,
      reason: 'active-child-progress-age-exceeded-grace-window',
      progressAgeMs,
      progressGraceMs,
      observedAt,
      pendingResult
    });
  }

  if (active !== null) {
    return progressSnapshot({
      state: 'recent-progress',
      current,
      reason: thread?.status === 'notLoaded'
        ? 'active-thread-not-loaded-within-grace-window'
        : 'active-child-observed-within-grace-window',
      progressAgeMs,
      progressGraceMs,
      observedAt,
      pendingResult
    });
  }

  return progressSnapshot({
    state: 'waiting',
    current,
    reason: 'no-active-child-or-pending-result',
    progressAgeMs,
    progressGraceMs,
    observedAt,
    pendingResult
  });
}

export function latestValidResultForCurrent({
  state = {},
  current
}) {
  const normalizedState = normalizeState(state);
  const normalizedCurrent = normalizeCurrent(current);

  if (normalizedCurrent.role === 'worker' && normalizedCurrent.phase === 'revision') {
    return null;
  }

  for (let index = normalizedState.results.length - 1; index >= 0; index -= 1) {
    const candidate = normalizedState.results[index];
    const result = candidate.result ?? null;

    if (
      candidate.valid === true &&
      result?.taskId === normalizedCurrent.taskId &&
      result?.role === normalizedCurrent.role &&
      isResultPendingRegistration(candidate) === true
    ) {
      return {
        ...candidate,
        result,
        resultIndex: index
      };
    }
  }

  return null;
}

export function currentAfterLocalWorkerRevision({
  state = {},
  current
}) {
  const normalizedState = normalizeState(state);
  const normalizedCurrent = normalizeCurrent(current);

  if (normalizedCurrent.role !== 'worker' || normalizedCurrent.phase !== 'revision') {
    return {
      current: null,
      reason: null
    };
  }

  const latestWorkerIndex = findLatestResultIndex(normalizedState, (entry) =>
    entry.valid === true &&
    entry.result?.taskId === normalizedCurrent.taskId &&
    entry.result?.role === 'worker'
  );
  const latestReviewerNeedsRevisionIndex = findLatestResultIndex(normalizedState, (entry) =>
    entry.valid === true &&
    entry.result?.taskId === normalizedCurrent.taskId &&
    entry.result?.role === 'reviewer' &&
    entry.result?.eventToRegister === 'reviewer.needs-revision'
  );
  const latestReviewerIndex = findLatestResultIndex(normalizedState, (entry) =>
    entry.valid === true &&
    entry.result?.taskId === normalizedCurrent.taskId &&
    entry.result?.role === 'reviewer'
  );
  const latestReviewerApprovedIndex = findLatestResultIndex(normalizedState, (entry) =>
    entry.valid === true &&
    entry.result?.taskId === normalizedCurrent.taskId &&
    entry.result?.role === 'reviewer' &&
    entry.result?.eventToRegister === 'reviewer.approved'
  );
  const latestMainVerificationFailedIndex = findLatestResultIndex(normalizedState, (entry) =>
    entry.valid === true &&
    entry.result?.taskId === normalizedCurrent.taskId &&
    entry.result?.role === 'main-verifier' &&
    entry.result?.eventToRegister === 'main.verification-failed'
  );

  if (
    latestWorkerIndex !== -1 &&
    latestReviewerNeedsRevisionIndex !== -1 &&
    latestWorkerIndex > latestReviewerNeedsRevisionIndex &&
    latestReviewerIndex < latestWorkerIndex
  ) {
    return {
      current: {
        taskId: normalizedCurrent.taskId,
        role: 'reviewer',
        phase: 'review'
      },
      reason: 'worker-revision-recorded-after-reviewer-needs-revision'
    };
  }

  if (
    latestWorkerIndex !== -1 &&
    latestMainVerificationFailedIndex !== -1 &&
    latestWorkerIndex > latestMainVerificationFailedIndex &&
    latestReviewerIndex < latestWorkerIndex
  ) {
    return {
      current: {
        taskId: normalizedCurrent.taskId,
        role: 'reviewer',
        phase: 'review'
      },
      reason: 'worker-revision-recorded-after-main-verification-failed'
    };
  }

  if (
    latestWorkerIndex !== -1 &&
    latestMainVerificationFailedIndex !== -1 &&
    latestWorkerIndex > latestMainVerificationFailedIndex &&
    latestReviewerApprovedIndex > latestWorkerIndex
  ) {
    return {
      current: {
        taskId: normalizedCurrent.taskId,
        role: 'main-verifier',
        phase: 'main-verification'
      },
      reason: 'reviewer-approved-worker-revision-after-main-verification-failed'
    };
  }

  return {
    current: null,
    reason: null
  };
}

function routeDecision({
  state,
  current,
  pendingResult = null,
  action,
  reason,
  progress
}) {
  return {
    contractName: GOAL_SUPERVISOR_ROUTE_ENGINE_CONTRACT_NAME,
    readOnly: true,
    willMutate: false,
    state,
    current,
    pendingResult,
    action,
    reason,
    progress
  };
}

function progressSnapshot({
  state,
  current,
  reason,
  progressAgeMs,
  progressGraceMs,
  observedAt = null,
  pendingResult = null
}) {
  return {
    contractName: GOAL_SUPERVISOR_PROGRESS_OBSERVER_CONTRACT_NAME,
    readOnly: true,
    willMutate: false,
    state,
    current,
    reason,
    progressAgeMs,
    progressGraceMs,
    observedAt,
    pendingResult
  };
}

function normalizeState(state) {
  const active = normalizeActive(state?.active ?? null);
  const threads = Array.isArray(state?.threads) ? state.threads.filter(isPlainObject) : [];

  return {
    ...state,
    active,
    threads,
    threadRecordById: new Map(threads
      .filter((thread) => isNonEmptyString(thread.threadId))
      .map((thread) => [thread.threadId, thread])),
    results: Array.isArray(state?.results) ? state.results.filter(isPlainObject) : []
  };
}

function normalizeActive(active) {
  if (!isPlainObject(active)) {
    return null;
  }

  return {
    ...active,
    taskId: isNonEmptyString(active.taskId) ? active.taskId : null,
    role: isNonEmptyString(active.role) ? active.role : null,
    phase: isNonEmptyString(active.phase) ? active.phase : null,
    threadId: isNonEmptyString(active.threadId) ? active.threadId : null,
    status: isNonEmptyString(active.status) ? active.status : null
  };
}

function normalizeCurrent(current) {
  return {
    taskId: isNonEmptyString(current?.taskId) ? current.taskId : null,
    role: isNonEmptyString(current?.role) ? current.role : null,
    phase: isNonEmptyString(current?.phase) ? current.phase : null
  };
}

function resultFromAvailability(availability) {
  if (availability?.record !== null && availability?.record !== undefined) {
    return {
      valid: true,
      source: availability.source,
      threadId: availability.threadId,
      result: availability.record
    };
  }

  return null;
}

function hasLiveSupervisorLease(state) {
  if (state.active !== null && ACTIVE_STATUSES.includes(state.active.status)) {
    return true;
  }

  return state.threads.some((thread) => ACTIVE_STATUSES.includes(thread.status));
}

function hasActiveLeaseForCurrent({ active, current }) {
  return active !== null &&
    ACTIVE_STATUSES.includes(active.status) &&
    active.taskId === current.taskId &&
    active.role === current.role &&
    active.phase === current.phase;
}

function latestTimestamp(values) {
  let latest = null;
  let latestMs = -Infinity;

  for (const value of values) {
    const timestampMs = Date.parse(value ?? '');

    if (!Number.isFinite(timestampMs) || timestampMs < latestMs) {
      continue;
    }

    latest = new Date(timestampMs).toISOString();
    latestMs = timestampMs;
  }

  return latest;
}

function findLatestResultIndex(state, predicate) {
  for (let index = state.results.length - 1; index >= 0; index -= 1) {
    if (predicate(state.results[index], index) === true) {
      return index;
    }
  }

  return -1;
}

function isResultPendingRegistration(candidate) {
  const result = candidate?.result ?? null;

  if (
    candidate?.registered === true ||
    candidate?.consumed === true ||
    result?.registered === true ||
    result?.consumed === true
  ) {
    return false;
  }

  return candidate?.registered === false ||
    candidate?.consumed === false ||
    result?.registered === false ||
    result?.consumed === false;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}
