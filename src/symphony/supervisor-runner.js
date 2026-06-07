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
    rootStatusAfterPorcelain
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

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
