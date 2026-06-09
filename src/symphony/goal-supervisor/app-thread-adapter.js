import {
  extractBoundedResultBlocks,
  parseGoalSupervisorResultBlock
} from './result-protocol.js';

export const GOAL_SUPERVISOR_APP_THREAD_ADAPTER_CONTRACT_NAME = 'goal-supervisor-app-thread-adapter.v1';
export const GOAL_SUPERVISOR_RESULT_CONSUMER_CONTRACT_NAME = 'goal-supervisor-escrow-first-result-consumer.v1';

const ACTIVE_LEASE_STATUSES = Object.freeze([
  'thread-requested',
  'thread-active',
  'active',
  'result-ready',
  'result-invalid'
]);

const TERMINAL_TURN_STATUSES = Object.freeze([
  'completed',
  'failed',
  'cancelled',
  'canceled',
  'interrupted'
]);

export function normalizeAppThreadRead({
  threadId,
  thread = null,
  error = null,
  readerCall = null
}) {
  const normalizedThreadId = requiredString(threadId, 'threadId');
  const normalizedError = normalizeReadError(error);

  if (normalizedError !== null) {
    return normalizedThreadState({
      threadId: normalizedThreadId,
      status: 'unreadable',
      readable: false,
      waitInput: true,
      reason: normalizedError.reason,
      error: normalizedError,
      readerCall
    });
  }

  if (!isPlainObject(thread)) {
    return normalizedThreadState({
      threadId: normalizedThreadId,
      status: 'unreadable',
      readable: false,
      waitInput: true,
      reason: 'thread-read-returned-no-thread',
      readerCall
    });
  }

  const threadStatus = normalizeThreadStatus(thread.status);
  const turns = normalizeThreadTurns(thread);
  const hasTurns = turns.length > 0;

  if (threadStatus.type === 'notLoaded') {
    return normalizedThreadState({
      threadId: normalizedThreadId,
      status: 'notLoaded',
      readable: false,
      waitInput: true,
      reason: hasTurns
        ? 'thread-status-notLoaded-is-lossy-even-when-turn-data-is-present'
        : 'thread-status-notLoaded-without-turn-data',
      threadStatus,
      turns,
      readerCall
    });
  }

  return normalizedThreadState({
    threadId: normalizedThreadId,
    status: 'readable',
    readable: true,
    waitInput: false,
    reason: 'thread-readable',
    threadStatus,
    turns,
    latestResultText: extractLatestThreadResultText(turns),
    latestTurn: turns.at(-1) ?? null,
    latestTerminalTurn: latestTerminalTurn(turns),
    latestInProgressTurn: latestInProgressTurn(turns),
    readerCall
  });
}

export function inspectEscrowResultAvailability({
  escrow = null,
  expected,
  releaseGates = []
}) {
  if (!isPlainObject(escrow) || !isNonEmptyString(escrow.text)) {
    return resultAvailability({
      source: 'result-escrow-file',
      status: 'missing',
      reason: 'missing-result-escrow',
      path: isNonEmptyString(escrow?.path) ? escrow.path : null
    });
  }

  return inspectResultText({
    source: 'result-escrow-file',
    text: escrow.text,
    path: escrow.path ?? null,
    expected,
    releaseGates
  });
}

export function inspectThreadResultAvailability({
  normalizedThread,
  expected,
  releaseGates = []
}) {
  if (!isPlainObject(normalizedThread) || normalizedThread.readable !== true) {
    return resultAvailability({
      source: 'app-thread',
      status: 'unavailable',
      reason: normalizedThread?.reason ?? 'thread-not-readable',
      threadId: normalizedThread?.threadId ?? null
    });
  }

  if (!isNonEmptyString(normalizedThread.latestResultText)) {
    return resultAvailability({
      source: 'app-thread',
      status: 'missing',
      reason: 'missing-thread-result-block',
      threadId: normalizedThread.threadId
    });
  }

  return inspectResultText({
    source: 'app-thread',
    text: normalizedThread.latestResultText,
    threadId: normalizedThread.threadId,
    expected,
    releaseGates
  });
}

export function buildEscrowFirstRouteInput({
  state = null,
  active = null,
  threadRead = null,
  escrow = null,
  expected,
  releaseGates = []
}) {
  const activeLease = normalizeActiveLease(active ?? state?.active ?? null);
  const threadId = activeLease.threadId ?? threadRead?.threadId ?? expected?.threadId ?? null;
  const dispatchGuard = duplicateDispatchGuard({
    active: activeLease,
    threads: Array.isArray(state?.threads) ? state.threads : []
  });

  const escrowAvailability = inspectEscrowResultAvailability({
    escrow,
    expected,
    releaseGates
  });

  if (escrowAvailability.status === 'valid') {
    return routeInput({
      activeLease,
      dispatchGuard,
      thread: threadId === null ? null : normalizeAppThreadRead({
        threadId,
        thread: threadRead?.thread ?? null,
        error: threadRead?.error ?? null,
        readerCall: threadRead?.readerCall ?? null
      }),
      resultAvailability: escrowAvailability,
      actionKind: 'consume-result',
      status: 'pending-result',
      reason: 'valid-escrow-result-preferred-before-thread-read'
    });
  }

  const normalizedThread = threadId === null
    ? null
    : normalizeAppThreadRead({
      threadId,
      thread: threadRead?.thread ?? null,
      error: threadRead?.error ?? null,
      readerCall: threadRead?.readerCall ?? null
    });
  const threadAvailability = normalizedThread === null
    ? resultAvailability({
      source: 'app-thread',
      status: 'unavailable',
      reason: 'no-active-thread-id'
    })
    : inspectThreadResultAvailability({
      normalizedThread,
      expected,
      releaseGates
    });

  if (threadAvailability.status === 'valid') {
    return routeInput({
      activeLease,
      dispatchGuard,
      thread: normalizedThread,
      resultAvailability: threadAvailability,
      escrowAvailability,
      actionKind: 'consume-result',
      status: 'pending-result',
      reason: 'valid-thread-result-available'
    });
  }

  if (dispatchGuard.blocked === true) {
    return routeInput({
      activeLease,
      dispatchGuard,
      thread: normalizedThread,
      resultAvailability: mergeUnavailableResultAvailability({
        escrowAvailability,
        threadAvailability
      }),
      escrowAvailability,
      threadAvailability,
      actionKind: 'wait-active-thread',
      status: 'wait',
      reason: normalizedThread?.waitInput === true
        ? 'active-lease-thread-unreadable-without-valid-result'
        : 'active-lease-exists-without-valid-result'
    });
  }

  return routeInput({
    activeLease,
    dispatchGuard,
    thread: normalizedThread,
    resultAvailability: mergeUnavailableResultAvailability({
      escrowAvailability,
      threadAvailability
    }),
    escrowAvailability,
    threadAvailability,
    actionKind: 'dispatch',
    status: 'dispatchable',
    reason: 'no-active-lease-or-valid-result'
  });
}

export function duplicateDispatchGuard({
  active = null,
  threads = []
}) {
  const activeLease = normalizeActiveLease(active);
  if (activeLease.live === true) {
    return {
      blocked: true,
      reason: 'active-lease-exists',
      active: activeLease,
      nextAction: 'record-result-complete-thread-or-wait-before-dispatch'
    };
  }

  const liveThreadIds = Array.isArray(threads)
    ? threads
      .filter((thread) => ACTIVE_LEASE_STATUSES.includes(thread?.status))
      .map((thread) => thread.threadId)
      .filter(isNonEmptyString)
    : [];

  if (liveThreadIds.length > 0) {
    return {
      blocked: true,
      reason: 'live-thread-exists',
      liveThreadIds,
      nextAction: 'reconcile-live-thread-before-dispatch'
    };
  }

  return {
    blocked: false,
    reason: 'no-active-lease'
  };
}

function inspectResultText({
  source,
  text,
  path = null,
  threadId = null,
  expected,
  releaseGates
}) {
  const blocks = extractBoundedResultBlocks(text);
  if (blocks.length === 0) {
    return resultAvailability({
      source,
      status: 'missing',
      reason: 'missing-result-block',
      path,
      threadId
    });
  }

  const parsed = parseGoalSupervisorResultBlock({
    text,
    expected,
    releaseGates
  });

  return resultAvailability({
    source,
    status: parsed.valid === true ? 'valid' : 'invalid',
    reason: parsed.reason,
    path,
    threadId,
    parsed,
    record: parsed.record
  });
}

function routeInput({
  activeLease,
  dispatchGuard,
  thread,
  resultAvailability,
  escrowAvailability = null,
  threadAvailability = null,
  actionKind,
  status,
  reason
}) {
  return {
    contractName: GOAL_SUPERVISOR_RESULT_CONSUMER_CONTRACT_NAME,
    readOnly: true,
    willMutate: false,
    status,
    actionKind,
    reason,
    activeLease,
    dispatchGuard,
    thread,
    resultAvailability,
    escrowAvailability,
    threadAvailability
  };
}

function normalizedThreadState({
  threadId,
  status,
  readable,
  waitInput,
  reason,
  threadStatus = null,
  turns = [],
  latestResultText = null,
  latestTurn = null,
  latestTerminalTurn = null,
  latestInProgressTurn = null,
  error = null,
  readerCall = null
}) {
  return {
    contractName: GOAL_SUPERVISOR_APP_THREAD_ADAPTER_CONTRACT_NAME,
    readOnly: true,
    willMutate: false,
    threadId,
    status,
    readable,
    waitInput,
    reason,
    threadStatus,
    turnCount: turns.length,
    turns,
    latestResultText,
    latestTurn,
    latestTerminalTurn,
    latestInProgressTurn,
    error,
    readerCall
  };
}

function resultAvailability({
  source,
  status,
  reason,
  path = null,
  threadId = null,
  parsed = null,
  record = null
}) {
  return {
    source,
    status,
    valid: status === 'valid',
    reason,
    path,
    threadId,
    parsed,
    record
  };
}

function mergeUnavailableResultAvailability({
  escrowAvailability,
  threadAvailability
}) {
  if (threadAvailability.status === 'valid') {
    return threadAvailability;
  }

  if (escrowAvailability.status === 'invalid') {
    return escrowAvailability;
  }

  return threadAvailability.status === 'unavailable'
    ? threadAvailability
    : escrowAvailability;
}

function normalizeActiveLease(active) {
  if (!isPlainObject(active)) {
    return {
      live: false,
      status: null,
      threadId: null,
      taskId: null,
      role: null,
      phase: null
    };
  }

  const status = isNonEmptyString(active.status) ? active.status : null;
  return {
    live: ACTIVE_LEASE_STATUSES.includes(status),
    status,
    threadId: isNonEmptyString(active.threadId) ? active.threadId : null,
    taskId: isNonEmptyString(active.taskId) ? active.taskId : null,
    role: isNonEmptyString(active.role) ? active.role : null,
    phase: isNonEmptyString(active.phase) ? active.phase : null,
    requestId: isNonEmptyString(active.requestId) ? active.requestId : null
  };
}

function normalizeReadError(error) {
  if (error === null || error === undefined) {
    return null;
  }

  if (typeof error === 'string') {
    return {
      reason: classifyReadError(error),
      message: error
    };
  }

  if (isPlainObject(error)) {
    const message = String(error.message ?? error.reason ?? 'thread-read-error');
    return {
      reason: classifyReadError(message),
      message,
      code: isNonEmptyString(error.code) ? error.code : null
    };
  }

  return {
    reason: 'thread-read-error',
    message: String(error)
  };
}

function classifyReadError(message) {
  const lower = String(message).toLowerCase();
  if (lower.includes('not loaded') || lower.includes('notloaded')) {
    return 'thread-not-loaded';
  }
  if (lower.includes('not found')) {
    return 'thread-not-found';
  }
  if (lower.includes('invalid arguments') || lower.includes('invalid argument')) {
    return 'thread-read-adapter-failed';
  }
  return 'thread-read-error';
}

function normalizeThreadStatus(status) {
  if (isPlainObject(status)) {
    return {
      ...status,
      type: isNonEmptyString(status.type) ? status.type : 'unknown'
    };
  }

  if (isNonEmptyString(status)) {
    return { type: status };
  }

  return { type: 'unknown' };
}

function normalizeThreadTurns(thread) {
  const candidates = [
    thread?.turns,
    thread?.data?.turns,
    thread?.thread?.turns
  ];
  const turns = candidates.find(Array.isArray) ?? [];

  return turns
    .filter(isPlainObject)
    .map((turn) => ({
      id: isNonEmptyString(turn.id) ? turn.id : null,
      status: isNonEmptyString(turn.status) ? turn.status : null,
      updatedAt: isNonEmptyString(turn.updatedAt) ? turn.updatedAt : null,
      items: Array.isArray(turn.items) ? turn.items.filter(isPlainObject) : []
    }));
}

function extractLatestThreadResultText(turns) {
  for (let turnIndex = turns.length - 1; turnIndex >= 0; turnIndex -= 1) {
    const items = turns[turnIndex].items;
    for (let itemIndex = items.length - 1; itemIndex >= 0; itemIndex -= 1) {
      const item = items[itemIndex];
      if (item.type !== 'agentMessage' || !isNonEmptyString(item.text)) {
        continue;
      }
      const blocks = extractBoundedResultBlocks(item.text);
      if (blocks.length > 0) {
        return item.text;
      }
    }
  }
  return null;
}

function latestTerminalTurn(turns) {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    if (TERMINAL_TURN_STATUSES.includes(turns[index].status)) {
      return turns[index];
    }
  }
  return null;
}

function latestInProgressTurn(turns) {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    if (turns[index].status === 'inProgress') {
      return turns[index];
    }
  }
  return null;
}

function requiredString(value, field) {
  if (!isNonEmptyString(value)) {
    throw new TypeError(`${field} is required`);
  }
  return value;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value);
}
