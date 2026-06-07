import { buildGoalNextAction } from './goal-next-action-resolver.js';
import { ACCEPTED_TERMINAL_EVENTS_BY_ROLE } from './app-thread-result-protocol.js';
import {
  buildRootCheckoutMutationGuard,
  collectFileInventoryFromGitStatus,
  inspectDependencyReadiness,
  validateEvidenceLocation
} from './workspace-evidence-safety.js';

export const SUPERVISOR_RUNNER_CONTRACT_NAME = 'goal-supervisor-runner-plan.v1';
export const SUPERVISOR_RUNNER_CONTRACT_VERSION = 1;
export const SUPERVISOR_OBSERVABILITY_CONTRACT_NAME = 'goal-supervisor-observability.v1';
export const SUPERVISOR_OBSERVABILITY_CONTRACT_VERSION = 1;

const DAEMON_STALE_AFTER_MS = 120_000;
const PROGRESS_RECENT_AFTER_MS = 300_000;

const RESULT_EVENTS_BY_ROLE = Object.freeze(
  Object.fromEntries(
    Object.entries(ACCEPTED_TERMINAL_EVENTS_BY_ROLE).map(([role, events]) => [role, new Set(events)])
  )
);

export class SupervisorRunnerUsageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SupervisorRunnerUsageError';
  }
}

export async function runSupervisorCli({
  args,
  stdout,
  generatedAt = new Date().toISOString()
}) {
  const options = parseSupervisorArgs(args);

  if (options.subcommand !== 'run' && options.subcommand !== 'status') {
    throw new SupervisorRunnerUsageError('supervisor supports only run and status');
  }

  const plan = await buildSupervisorRunnerPlan({
    ...options,
    generatedAt
  });

  stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  return 0;
}

export async function buildSupervisorRunnerPlan({
  stateDir = '.symphony',
  goalId = 'latest',
  maxCycles = 1,
  allowCloseout = false,
  mode = 'dry-run',
  completedThread = null,
  resultEvent = null,
  evidenceRef = null,
  resultTaskId = null,
  resultRole = null,
  assignedWorktree = null,
  rootCheckout = null,
  runtimeWorkspaceRoots = [],
  rootStatusBeforePorcelain = null,
  rootStatusAfterPorcelain = null,
  daemonPid = null,
  daemonPidAlive = null,
  daemonHealthStatus = null,
  daemonHealthAt = null,
  lastDaemonTickAt = null,
  lastManualTickAt = null,
  activeLeaseId = null,
  activeThreadId = null,
  activeChildStartedAt = null,
  activeChildLatestReadState = null,
  approvalRequiredCommand = null,
  approvalRequiredFlag = null,
  approvalRequiredReason = null,
  providerId = null,
  providerOperationId = null,
  providerStartedAt = null,
  providerProgressAt = null,
  providerTimeoutMs = null,
  providerStatus = null,
  providerArtifactRefs = [],
  providerRecoveryNote = null,
  providerRawOutput = null,
  generatedAt = new Date().toISOString()
} = {}) {
  const next = await buildGoalNextAction({
    stateDir,
    goalId,
    generatedAt
  });
  const workspaceSafety = await buildWorkspaceSafetyPlan({
    assignedWorktree,
    rootCheckout,
    runtimeWorkspaceRoots,
    rootStatusBeforePorcelain,
    rootStatusAfterPorcelain,
    evidenceRef
  });
  const observability = buildSupervisorObservability({
    goalId: next.goalId ?? goalId,
    generatedAt,
    daemonPid,
    daemonPidAlive,
    daemonHealthStatus,
    daemonHealthAt,
    lastDaemonTickAt,
    lastManualTickAt,
    activeLeaseId,
    activeThreadId,
    activeChildStartedAt,
    activeChildLatestReadState,
    approvalRequiredCommand,
    approvalRequiredFlag,
    approvalRequiredReason,
    providerId,
    providerOperationId,
    providerStartedAt,
    providerProgressAt,
    providerTimeoutMs,
    providerStatus,
    providerArtifactRefs,
    providerRecoveryNote,
    providerRawOutput
  });

  const hooks = [
    hook('preTick', 'passed', 'Supervisor tick started.'),
    hook('postReconcile', 'passed', 'Goal next action resolved from managed ledger.'),
    workspaceSafety === null
      ? hook('preWorkspaceSafety', 'skipped', 'No assigned worktree was provided for workspace preflight.')
      : hook(
        'preWorkspaceSafety',
        workspaceSafety.dispatchAllowed === true ? 'passed' : 'blocked',
        workspaceSafety.dispatchAllowed === true
          ? 'Assigned worktree passed dependency preflight.'
          : workspaceSafety.blocker.reason
      ),
    hook('preCreateController', 'pending', 'Controller creation is planned only in dry-run mode.')
  ];

  const cycle = buildSupervisorCycle({
    cycleIndex: 1,
    next,
    allowCloseout,
    completedThread,
    resultEvent,
    evidenceRef,
    resultTaskId,
    resultRole,
    workspaceSafety,
    observability,
    mode
  });

  const status = cycle.action.kind === 'block'
    ? 'blocked'
    : next.status === 'complete'
      ? 'complete'
      : 'action-required';

  return {
    contractName: SUPERVISOR_RUNNER_CONTRACT_NAME,
    contractVersion: SUPERVISOR_RUNNER_CONTRACT_VERSION,
    generatedAt,
    mode,
    goalId: next.goalId ?? goalId,
    maxCycles,
    executedCycles: 1,
    status,
    nextActionSource: next.contractName ?? null,
    cycles: [cycle],
    hooks,
    observability,
    stopReason: cycle.stopReason,
    safety: {
      readOnly: true,
      dryRunOnly: mode === 'dry-run',
      modelInvocationAvailable: false,
      eventRegistrationAvailable: false,
      testExecutionAvailable: false,
      releaseCloseoutAllowed: allowCloseout
    }
  };
}

function buildSupervisorCycle({
  cycleIndex,
  next,
  allowCloseout,
  completedThread,
  resultEvent,
  evidenceRef,
  resultTaskId,
  resultRole,
  workspaceSafety,
  observability,
  mode
}) {
  if (next.status === 'complete') {
    return {
      cycle: cycleIndex,
      state: 'done',
      goalNextStatus: next.status,
      action: {
        kind: 'none',
        reason: next.reason ?? 'Goal is complete.'
      },
      stopReason: 'goal-complete'
    };
  }

  if (next.status !== 'action-required' || next.next?.blocked === true) {
    return {
      cycle: cycleIndex,
      state: 'blocked',
      goalNextStatus: next.status,
      action: {
        kind: 'block',
        reason: next.reason ?? 'Goal next action is blocked.'
      },
      stopReason: 'blocked-next-action'
    };
  }

  if (next.next?.role === 'release-manager' && allowCloseout !== true) {
    return {
      cycle: cycleIndex,
      state: 'blocked',
      goalNextStatus: next.status,
      action: {
        kind: 'block',
        reason: 'Release closeout requires --allow-closeout.'
      },
      stopReason: 'release-closeout-requires-explicit-allow'
    };
  }

  const current = normalizeNext(next.next);
  const completedResult = normalizeCompletedResult({
    completedThread,
    resultEvent,
    evidenceRef,
    resultTaskId,
    resultRole,
    current
  });

  if (workspaceSafety !== null && workspaceSafety.dispatchAllowed !== true) {
    return {
      cycle: cycleIndex,
      state: 'blocked',
      goalNextStatus: next.status,
      current,
      workspaceSafety,
      completedResult,
      action: {
        kind: 'block',
        reason: workspaceSafety.blocker.reason
      },
      stopReason: workspaceSafety.blocker.stopReason
    };
  }

  if (completedResult !== null && completedResult.valid !== true) {
    return {
      cycle: cycleIndex,
      state: 'blocked',
      goalNextStatus: next.status,
      current,
      completedResult,
      action: {
        kind: 'block',
        reason: completedResult.reason
      },
      stopReason: 'completed-result-does-not-match-next-action'
    };
  }

  if (completedResult !== null
    && workspaceSafety !== null
    && workspaceSafety.evidenceLocation !== null
    && workspaceSafety.evidenceLocation.valid !== true) {
    return {
      cycle: cycleIndex,
      state: 'blocked',
      goalNextStatus: next.status,
      current,
      workspaceSafety,
      completedResult,
      action: {
        kind: 'block',
        reason: `Completed result evidence failed workspace validation: ${workspaceSafety.evidenceLocation.blocker.reason}`
      },
      stopReason: 'completed-result-evidence-location-rejected'
    };
  }

  if (observability.heartbeatDecision.dispatchAllowed !== true) {
    return {
      cycle: cycleIndex,
      state: 'blocked',
      goalNextStatus: next.status,
      current,
      workspaceSafety,
      completedResult,
      observability: {
        doctorState: observability.doctorState,
        heartbeatDecision: observability.heartbeatDecision,
        notifications: observability.notifications
      },
      action: {
        kind: 'block',
        reason: observability.heartbeatDecision.reason
      },
      stopReason: observability.heartbeatDecision.stopReason
    };
  }

  const command = controllerCommandForNext(current);
  const actionKind = completedResult === null
    ? 'create-fresh-controller'
    : 'create-fresh-controller-to-consume-result';

  return {
    cycle: cycleIndex,
    state: completedResult === null ? 'next-phase-ready' : 'result-ready',
    goalNextStatus: next.status,
    current,
    workspaceSafety,
    completedResult,
    action: {
      kind: actionKind,
      command,
      controllerPromptSource: 'docs/plans/controller/master-once-prompt.md',
      phase: current.phase,
      taskId: current.taskId,
      role: current.role,
      dryRunOnly: mode === 'dry-run',
      reason: completedResult === null
        ? next.reason
        : `Completed ${completedResult.role} result is ready for controller consumption.`
    },
    stopReason: mode === 'dry-run'
      ? 'controller-not-created-in-dry-run'
      : 'controller-adapter-not-configured'
  };
}

function normalizeNext(next) {
  return {
    taskId: next?.taskId ?? null,
    role: next?.role ?? null,
    phase: next?.phase ?? null
  };
}

function normalizeCompletedResult({
  completedThread,
  resultEvent,
  evidenceRef,
  resultTaskId,
  resultRole,
  current
}) {
  if (completedThread === null && resultEvent === null && evidenceRef === null && resultTaskId === null && resultRole === null) {
    return null;
  }

  if (!isNonEmptyString(completedThread)) {
    return invalidCompletedResult('Completed result metadata requires --completed-thread.');
  }

  if (!isNonEmptyString(resultEvent)) {
    return invalidCompletedResult('Completed result metadata requires --result-event.');
  }

  if (!isNonEmptyString(evidenceRef)) {
    return invalidCompletedResult('Completed result metadata requires --evidence-ref.');
  }

  const role = resultRole ?? current.role;
  const taskId = resultTaskId ?? current.taskId;
  const allowedEvents = RESULT_EVENTS_BY_ROLE[role];

  if (allowedEvents === undefined || !allowedEvents.has(resultEvent)) {
    return invalidCompletedResult(`Result event ${resultEvent} is not valid for role ${role}.`);
  }

  if (taskId !== current.taskId || role !== current.role) {
    return invalidCompletedResult('Completed result task/role does not match the current ledger next action.');
  }

  return {
    valid: true,
    threadId: completedThread,
    taskId,
    role,
    eventToRegister: resultEvent,
    evidenceRef
  };
}

function invalidCompletedResult(reason) {
  return {
    valid: false,
    reason
  };
}

function controllerCommandForNext(next) {
  if (next.role === 'worker') {
    return `/goal dispatch ${next.taskId} worker --fresh-controller`;
  }

  if (next.role === 'reviewer') {
    return `/goal review ${next.taskId} --fresh-controller`;
  }

  if (next.role === 'main-verifier') {
    return `/goal verify ${next.taskId} --fresh-controller`;
  }

  if (next.role === 'release-manager') {
    return '/goal closeout --fresh-controller --allow-closeout';
  }

  return '/goal status';
}

function hook(name, status, reason) {
  return {
    name,
    status,
    reason
  };
}

export function buildSupervisorObservability({
  goalId = 'latest',
  generatedAt = new Date().toISOString(),
  daemonPid = null,
  daemonPidAlive = null,
  daemonHealthStatus = null,
  daemonHealthAt = null,
  lastDaemonTickAt = null,
  lastManualTickAt = null,
  activeLeaseId = null,
  activeThreadId = null,
  activeChildStartedAt = null,
  activeChildLatestReadState = null,
  approvalRequiredCommand = null,
  approvalRequiredFlag = null,
  approvalRequiredReason = null,
  providerId = null,
  providerOperationId = null,
  providerStartedAt = null,
  providerProgressAt = null,
  providerTimeoutMs = null,
  providerStatus = null,
  providerArtifactRefs = [],
  providerRecoveryNote = null,
  providerRawOutput = null
} = {}) {
  const nowMs = Date.parse(generatedAt);
  const effectiveNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  const daemonSignals = [
    daemonHealthAt,
    lastDaemonTickAt
  ].filter(isNonEmptyString);
  const latestDaemonSignalAt = latestTimestamp(daemonSignals);
  const latestDaemonSignalAgeMs = ageMs(latestDaemonSignalAt, effectiveNowMs);
  const daemonFresh = latestDaemonSignalAgeMs !== null && latestDaemonSignalAgeMs <= DAEMON_STALE_AFTER_MS;
  const daemonState = daemonPidAlive === true && daemonFresh
    ? 'daemon-active'
    : daemonPidAlive === true
      ? 'daemon-stale'
      : 'daemon-stopped';
  const manualTickAgeMs = ageMs(lastManualTickAt, effectiveNowMs);
  const manualTickState = manualTickAgeMs === null
    ? 'manual-tick-missing'
    : manualTickAgeMs <= DAEMON_STALE_AFTER_MS
      ? 'manual-tick-recent'
      : 'manual-tick-stale';
  const activeChild = buildActiveChildProjection({
    activeLeaseId,
    activeThreadId,
    activeChildStartedAt,
    activeChildLatestReadState,
    nowMs: effectiveNowMs
  });
  const providerProgress = buildProviderProgressProjection({
    providerId,
    providerOperationId,
    providerStartedAt,
    providerProgressAt,
    providerTimeoutMs,
    providerStatus,
    providerArtifactRefs,
    providerRecoveryNote,
    providerRawOutput,
    nowMs: effectiveNowMs
  });
  const notifications = buildOperatorNotifications({
    daemonState,
    activeChild,
    approvalRequiredCommand,
    approvalRequiredFlag,
    approvalRequiredReason,
    providerProgress
  });
  const heartbeatDecision = buildHeartbeatDecision({
    goalId,
    daemonState,
    activeChild,
    providerProgress
  });

  return {
    contractName: SUPERVISOR_OBSERVABILITY_CONTRACT_NAME,
    contractVersion: SUPERVISOR_OBSERVABILITY_CONTRACT_VERSION,
    generatedAt,
    daemon: {
      state: daemonState,
      pid: daemonPid,
      pidAlive: daemonPidAlive,
      healthStatus: sanitizeStatus(daemonHealthStatus),
      healthUpdatedAt: daemonHealthAt,
      lastDaemonTickAt,
      latestSignalAt: latestDaemonSignalAt,
      latestSignalAgeMs: latestDaemonSignalAgeMs,
      staleAfterMs: DAEMON_STALE_AFTER_MS
    },
    manualTick: {
      state: manualTickState,
      lastManualTickAt,
      ageMs: manualTickAgeMs,
      staleAfterMs: DAEMON_STALE_AFTER_MS
    },
    activeChild,
    providerProgress,
    notifications,
    heartbeatDecision,
    doctorState: buildDoctorState({ daemonState, manualTickState, providerProgress })
  };
}

function buildActiveChildProjection({
  activeLeaseId,
  activeThreadId,
  activeChildStartedAt,
  activeChildLatestReadState,
  nowMs
}) {
  const hasActiveLease = isNonEmptyString(activeLeaseId) || isNonEmptyString(activeThreadId);

  return {
    state: hasActiveLease ? 'active-child-present' : 'none',
    leaseId: activeLeaseId,
    threadId: activeThreadId,
    startedAt: activeChildStartedAt,
    ageMs: ageMs(activeChildStartedAt, nowMs),
    latestReadState: sanitizeStatus(activeChildLatestReadState),
    safeResumeCommand: isNonEmptyString(activeThreadId)
      ? `Inspect thread ${activeThreadId} and record its bounded result before dispatching new work.`
      : null
  };
}

function buildProviderProgressProjection({
  providerId,
  providerOperationId,
  providerStartedAt,
  providerProgressAt,
  providerTimeoutMs,
  providerStatus,
  providerArtifactRefs,
  providerRecoveryNote,
  providerRawOutput,
  nowMs
}) {
  const hasOperation = isNonEmptyString(providerOperationId);

  if (!hasOperation) {
    return {
      state: 'none',
      providerId: null,
      operationId: null,
      startedAt: null,
      latestProgressAt: null,
      latestProgressAgeMs: null,
      timeoutPolicy: null,
      sanitizedStatus: null,
      artifactRefs: [],
      recoveryNote: null,
      rawOutputExposed: false
    };
  }

  const latestProgressAgeMs = ageMs(providerProgressAt, nowMs);
  const recent = latestProgressAgeMs !== null && latestProgressAgeMs <= PROGRESS_RECENT_AFTER_MS;

  return {
    state: recent ? 'recent-progress' : 'stale-progress',
    providerId: sanitizeIdentifier(providerId),
    operationId: sanitizeIdentifier(providerOperationId),
    startedAt: providerStartedAt,
    latestProgressAt: providerProgressAt,
    latestProgressAgeMs,
    timeoutPolicy: Number.isInteger(providerTimeoutMs) && providerTimeoutMs > 0
      ? { timeoutMs: providerTimeoutMs }
      : null,
    sanitizedStatus: sanitizeStatus(providerStatus),
    artifactRefs: sanitizeArtifactRefs(providerArtifactRefs),
    recoveryNote: sanitizeStatus(providerRecoveryNote),
    rawOutputExposed: false,
    rawOutputSuppressed: isNonEmptyString(providerRawOutput)
  };
}

function buildOperatorNotifications({
  daemonState,
  activeChild,
  approvalRequiredCommand,
  approvalRequiredFlag,
  approvalRequiredReason,
  providerProgress
}) {
  const notifications = [];

  if (daemonState === 'daemon-stale' && activeChild.state === 'active-child-present') {
    notifications.push({
      id: 'stale-daemon-active-child',
      severity: 'warning',
      title: 'Stale daemon with active child',
      message: `Thread ${activeChild.threadId ?? 'unknown'} is still active; inspect it before restarting or dispatching.`,
      action: activeChild.safeResumeCommand,
      duplicateDispatchAllowed: false
    });
  }

  if (isNonEmptyString(approvalRequiredCommand) || isNonEmptyString(approvalRequiredFlag)) {
    notifications.push({
      id: 'approval-required',
      severity: 'action-required',
      title: 'Approval required',
      message: sanitizeStatus(approvalRequiredReason) ?? 'Explicit operator approval is required.',
      command: approvalRequiredCommand,
      flag: approvalRequiredFlag
    });
  }

  if (providerProgress.state === 'recent-progress') {
    notifications.push({
      id: 'provider-progress-visible',
      severity: 'info',
      title: 'Controlled provider progress',
      message: `Provider ${providerProgress.providerId} operation ${providerProgress.operationId} has recent sanitized progress.`,
      operationId: providerProgress.operationId,
      artifactRefs: providerProgress.artifactRefs
    });
  }

  return notifications;
}

function buildHeartbeatDecision({
  goalId,
  daemonState,
  activeChild,
  providerProgress
}) {
  if (activeChild.state === 'active-child-present') {
    return {
      action: daemonState === 'daemon-active' ? 'wait-active-child' : 'operator-action-required',
      dispatchAllowed: false,
      duplicateDispatchAllowed: false,
      stopReason: daemonState === 'daemon-active'
        ? 'active-child-already-running'
        : 'stale-daemon-active-child-needs-operator-inspection',
      reason: daemonState === 'daemon-active'
        ? `Active child thread ${activeChild.threadId ?? 'unknown'} is already running.`
        : `Daemon is not healthy while child thread ${activeChild.threadId ?? 'unknown'} is active.`,
      inspectCommand: activeChild.safeResumeCommand
    };
  }

  if (daemonState === 'daemon-stopped') {
    const launchCommand = `pnpm --silent symphony supervisor run --goal ${goalId} --json`;

    return {
      action: 'restart-stopped-idle-runner',
      dispatchAllowed: true,
      duplicateDispatchAllowed: true,
      stopReason: null,
      reason: providerProgress.state === 'recent-progress'
        ? 'Daemon is stopped, but recent provider progress is visible; restart only through the documented path.'
        : 'Daemon is stopped and no active child is recorded.',
      launchCommand,
      documentedLaunchPath: launchCommand
    };
  }

  if (daemonState === 'daemon-stale') {
    return {
      action: 'operator-action-required',
      dispatchAllowed: true,
      duplicateDispatchAllowed: true,
      stopReason: null,
      reason: 'Daemon heartbeat is stale and no active child is recorded; use the documented launch path after checking pid and health files.',
      documentedLaunchPath: `pnpm --silent symphony supervisor run --goal ${goalId} --json`
    };
  }

  return {
    action: 'no-op',
    dispatchAllowed: true,
    duplicateDispatchAllowed: true,
    stopReason: null,
    reason: 'Daemon health is fresh.'
  };
}

function buildDoctorState({ daemonState, manualTickState, providerProgress }) {
  if (daemonState === 'daemon-stopped' && providerProgress.state === 'recent-progress') {
    return 'daemon-stopped-with-recent-progress';
  }

  if (daemonState === 'daemon-stopped' && manualTickState === 'manual-tick-recent') {
    return 'manual-tick-recent';
  }

  return daemonState;
}

function latestTimestamp(values) {
  let latest = null;
  let latestMs = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    const parsed = Date.parse(value);

    if (Number.isFinite(parsed) && parsed > latestMs) {
      latest = value;
      latestMs = parsed;
    }
  }

  return latest;
}

function ageMs(value, nowMs) {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, nowMs - parsed);
}

function sanitizeArtifactRefs(refs) {
  if (!Array.isArray(refs)) {
    return [];
  }

  return uniqueNonEmptyStrings(refs)
    .map((ref) => sanitizeStatus(ref))
    .filter(isNonEmptyString)
    .filter((ref) => ref !== '[redacted]')
    .filter((ref) => !looksSecretBearing(ref));
}

function sanitizeIdentifier(value) {
  const sanitized = sanitizeStatus(value);

  if (!isNonEmptyString(sanitized) || looksSecretBearing(sanitized)) {
    return null;
  }

  return sanitized;
}

function sanitizeStatus(value) {
  if (!isNonEmptyString(value)) {
    return null;
  }

  return value
    .trim()
    .replace(
      /(?:sk-[A-Za-z0-9_-]{8,}|[A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|CREDENTIAL)[A-Za-z0-9_]*\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+))/giu,
      '[redacted]'
    )
    .slice(0, 240);
}

function looksSecretBearing(value) {
  return /secret|token|password|credential|sk-[A-Za-z0-9_-]{8,}/iu.test(value);
}

function uniqueNonEmptyStrings(values) {
  return [...new Set(values.filter(isNonEmptyString).map((value) => value.trim()))];
}

function parseSupervisorArgs(args) {
  const [subcommand = 'run', ...rest] = args;

  let stateDir = '.symphony';
  let goalId = 'latest';
  let maxCycles = 1;
  let allowCloseout = false;
  let mode = 'dry-run';
  let completedThread = null;
  let resultEvent = null;
  let evidenceRef = null;
  let resultTaskId = null;
  let resultRole = null;
  let assignedWorktree = null;
  let rootCheckout = null;
  const runtimeWorkspaceRoots = [];
  let rootStatusBeforePorcelain = null;
  let rootStatusAfterPorcelain = null;
  let daemonPid = null;
  let daemonPidAlive = null;
  let daemonHealthStatus = null;
  let daemonHealthAt = null;
  let lastDaemonTickAt = null;
  let lastManualTickAt = null;
  let activeLeaseId = null;
  let activeThreadId = null;
  let activeChildStartedAt = null;
  let activeChildLatestReadState = null;
  let approvalRequiredCommand = null;
  let approvalRequiredFlag = null;
  let approvalRequiredReason = null;
  let providerId = null;
  let providerOperationId = null;
  let providerStartedAt = null;
  let providerProgressAt = null;
  let providerTimeoutMs = null;
  let providerStatus = null;
  const providerArtifactRefs = [];
  let providerRecoveryNote = null;
  let providerRawOutput = null;

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];

    if (value === '--state-dir') {
      stateDir = readRequiredValue(rest, index, '--state-dir');
      index += 1;
      continue;
    }

    if (value === '--goal') {
      goalId = readRequiredValue(rest, index, '--goal');
      index += 1;
      continue;
    }

    if (value === '--max-cycles') {
      maxCycles = toPositiveInteger(readRequiredValue(rest, index, '--max-cycles'), '--max-cycles');
      index += 1;
      continue;
    }

    if (value === '--allow-closeout') {
      allowCloseout = true;
      continue;
    }

    if (value === '--dry-run' || value === '--json') {
      mode = 'dry-run';
      continue;
    }

    if (value === '--completed-thread') {
      completedThread = readRequiredValue(rest, index, '--completed-thread');
      index += 1;
      continue;
    }

    if (value === '--result-event') {
      resultEvent = readRequiredValue(rest, index, '--result-event');
      index += 1;
      continue;
    }

    if (value === '--evidence-ref') {
      evidenceRef = readRequiredValue(rest, index, '--evidence-ref');
      index += 1;
      continue;
    }

    if (value === '--task') {
      resultTaskId = readRequiredValue(rest, index, '--task');
      index += 1;
      continue;
    }

    if (value === '--role') {
      resultRole = readRequiredValue(rest, index, '--role');
      index += 1;
      continue;
    }

    if (value === '--worktree') {
      assignedWorktree = readRequiredValue(rest, index, '--worktree');
      index += 1;
      continue;
    }

    if (value === '--root-checkout') {
      rootCheckout = readRequiredValue(rest, index, '--root-checkout');
      index += 1;
      continue;
    }

    if (value === '--runtime-workspace-root') {
      runtimeWorkspaceRoots.push(readRequiredValue(rest, index, '--runtime-workspace-root'));
      index += 1;
      continue;
    }

    if (value === '--root-status-before') {
      rootStatusBeforePorcelain = readStringValue(rest, index, '--root-status-before');
      index += 1;
      continue;
    }

    if (value === '--root-status-after') {
      rootStatusAfterPorcelain = readStringValue(rest, index, '--root-status-after');
      index += 1;
      continue;
    }

    if (value === '--daemon-pid') {
      daemonPid = toPositiveInteger(readRequiredValue(rest, index, '--daemon-pid'), '--daemon-pid');
      index += 1;
      continue;
    }

    if (value === '--daemon-pid-alive') {
      daemonPidAlive = toBoolean(readRequiredValue(rest, index, '--daemon-pid-alive'), '--daemon-pid-alive');
      index += 1;
      continue;
    }

    if (value === '--daemon-health-status') {
      daemonHealthStatus = readRequiredValue(rest, index, '--daemon-health-status');
      index += 1;
      continue;
    }

    if (value === '--daemon-health-at') {
      daemonHealthAt = readRequiredValue(rest, index, '--daemon-health-at');
      index += 1;
      continue;
    }

    if (value === '--last-daemon-tick-at') {
      lastDaemonTickAt = readRequiredValue(rest, index, '--last-daemon-tick-at');
      index += 1;
      continue;
    }

    if (value === '--last-manual-tick-at') {
      lastManualTickAt = readRequiredValue(rest, index, '--last-manual-tick-at');
      index += 1;
      continue;
    }

    if (value === '--active-lease') {
      activeLeaseId = readRequiredValue(rest, index, '--active-lease');
      index += 1;
      continue;
    }

    if (value === '--active-thread') {
      activeThreadId = readRequiredValue(rest, index, '--active-thread');
      index += 1;
      continue;
    }

    if (value === '--active-child-started-at') {
      activeChildStartedAt = readRequiredValue(rest, index, '--active-child-started-at');
      index += 1;
      continue;
    }

    if (value === '--active-child-read-state') {
      activeChildLatestReadState = readRequiredValue(rest, index, '--active-child-read-state');
      index += 1;
      continue;
    }

    if (value === '--approval-required-command') {
      approvalRequiredCommand = readRequiredValue(rest, index, '--approval-required-command');
      index += 1;
      continue;
    }

    if (value === '--approval-required-flag') {
      approvalRequiredFlag = readRequiredValue(rest, index, '--approval-required-flag');
      index += 1;
      continue;
    }

    if (value === '--approval-required-reason') {
      approvalRequiredReason = readRequiredValue(rest, index, '--approval-required-reason');
      index += 1;
      continue;
    }

    if (value === '--provider-id') {
      providerId = readRequiredValue(rest, index, '--provider-id');
      index += 1;
      continue;
    }

    if (value === '--provider-operation-id') {
      providerOperationId = readRequiredValue(rest, index, '--provider-operation-id');
      index += 1;
      continue;
    }

    if (value === '--provider-started-at') {
      providerStartedAt = readRequiredValue(rest, index, '--provider-started-at');
      index += 1;
      continue;
    }

    if (value === '--provider-progress-at') {
      providerProgressAt = readRequiredValue(rest, index, '--provider-progress-at');
      index += 1;
      continue;
    }

    if (value === '--provider-timeout-ms') {
      providerTimeoutMs = toPositiveInteger(readRequiredValue(rest, index, '--provider-timeout-ms'), '--provider-timeout-ms');
      index += 1;
      continue;
    }

    if (value === '--provider-status') {
      providerStatus = readRequiredValue(rest, index, '--provider-status');
      index += 1;
      continue;
    }

    if (value === '--provider-artifact-ref') {
      providerArtifactRefs.push(readRequiredValue(rest, index, '--provider-artifact-ref'));
      index += 1;
      continue;
    }

    if (value === '--provider-recovery-note') {
      providerRecoveryNote = readRequiredValue(rest, index, '--provider-recovery-note');
      index += 1;
      continue;
    }

    if (value === '--provider-raw-output') {
      providerRawOutput = readRequiredValue(rest, index, '--provider-raw-output');
      index += 1;
      continue;
    }

    if (value.startsWith('--')) {
      throw new SupervisorRunnerUsageError(`unknown supervisor option: ${value}`);
    }

    throw new SupervisorRunnerUsageError(`unexpected supervisor argument: ${value}`);
  }

  return {
    subcommand,
    stateDir,
    goalId,
    maxCycles,
    allowCloseout,
    mode,
    completedThread,
    resultEvent,
    evidenceRef,
    resultTaskId,
    resultRole,
    assignedWorktree,
    rootCheckout,
    runtimeWorkspaceRoots,
    rootStatusBeforePorcelain,
    rootStatusAfterPorcelain,
    daemonPid,
    daemonPidAlive,
    daemonHealthStatus,
    daemonHealthAt,
    lastDaemonTickAt,
    lastManualTickAt,
    activeLeaseId,
    activeThreadId,
    activeChildStartedAt,
    activeChildLatestReadState,
    approvalRequiredCommand,
    approvalRequiredFlag,
    approvalRequiredReason,
    providerId,
    providerOperationId,
    providerStartedAt,
    providerProgressAt,
    providerTimeoutMs,
    providerStatus,
    providerArtifactRefs,
    providerRecoveryNote,
    providerRawOutput
  };
}

async function buildWorkspaceSafetyPlan({
  assignedWorktree,
  rootCheckout,
  runtimeWorkspaceRoots,
  rootStatusBeforePorcelain,
  rootStatusAfterPorcelain,
  evidenceRef
}) {
  if (!isNonEmptyString(assignedWorktree)) {
    return null;
  }

  const dependencyPreflight = await inspectDependencyReadiness({
    worktree: assignedWorktree
  });
  const evidenceLocation = isNonEmptyString(evidenceRef)
    ? await validateEvidenceLocation({
      assignedWorktree,
      rootCheckout,
      evidenceRef
    })
    : null;
  const rootMutationGuard = buildOptionalRootMutationGuard({
    rootCheckout,
    beforePorcelain: rootStatusBeforePorcelain,
    afterPorcelain: rootStatusAfterPorcelain
  });
  const dispatchAllowed = dependencyPreflight.dispatchAllowed === true
    && (evidenceLocation === null || evidenceLocation.valid === true)
    && (rootMutationGuard === null || rootMutationGuard.eventRegistrationAllowed === true);
  const blocker = dependencyPreflight.dispatchAllowed !== true
    ? {
      id: 'workspace-dependency-preflight-blocked',
      reason: `Assigned worktree is not dependency-ready: ${dependencyPreflight.status}`,
      stopReason: 'workspace-dependency-preflight-blocked'
    }
    : evidenceLocation !== null && evidenceLocation.valid !== true
      ? {
        id: 'workspace-evidence-location-rejected',
        reason: `Evidence location is invalid: ${evidenceLocation.blocker.reason}`,
        stopReason: 'completed-result-evidence-location-rejected'
      }
      : rootMutationGuard !== null && rootMutationGuard.eventRegistrationAllowed !== true
        ? {
          id: 'root-checkout-mutated',
          reason: rootMutationGuard.blocker.reason,
          stopReason: 'root-checkout-mutation-rejected'
        }
      : null;

  return {
    contractName: 'supervisor-workspace-safety-plan.v1',
    contractVersion: 1,
    assignedWorktree: dependencyPreflight.worktree,
    rootCheckout,
    runtimeWorkspaceRoots,
    dependencyPreflight,
    evidenceLocation,
    rootMutationGuard,
    dispatchAllowed,
    blocker
  };
}

function buildOptionalRootMutationGuard({
  rootCheckout,
  beforePorcelain,
  afterPorcelain
}) {
  if (!isNonEmptyString(rootCheckout)
    || beforePorcelain === null
    || afterPorcelain === null) {
    return null;
  }

  const beforeInventory = collectFileInventoryFromGitStatus({
    worktree: rootCheckout,
    porcelain: beforePorcelain
  });
  const afterInventory = collectFileInventoryFromGitStatus({
    worktree: rootCheckout,
    porcelain: afterPorcelain
  });

  return buildRootCheckoutMutationGuard({
    rootCheckout,
    beforeInventory,
    afterInventory
  });
}

function readRequiredValue(args, index, optionName) {
  const value = args[index + 1];

  if (!isNonEmptyString(value) || value.startsWith('--')) {
    throw new SupervisorRunnerUsageError(`${optionName} requires a value`);
  }

  return value;
}

function readStringValue(args, index, optionName) {
  const value = args[index + 1];

  if (typeof value !== 'string' || value.startsWith('--')) {
    throw new SupervisorRunnerUsageError(`${optionName} requires a value`);
  }

  return value;
}

function toPositiveInteger(value, field) {
  const number = Number.parseInt(value, 10);

  if (!Number.isInteger(number) || number < 1 || String(number) !== value) {
    throw new SupervisorRunnerUsageError(`${field} must be a positive integer`);
  }

  return number;
}

function toBoolean(value, field) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new SupervisorRunnerUsageError(`${field} must be true or false`);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
