import { buildEscrowFirstRouteInput } from './app-thread-adapter.js';
import { projectGoalSupervisorRouteProgress } from './route-progress.js';
import { projectReleasePolicyBoundaries } from './release-policy.js';
import {
  buildGoalSupervisorCoreProjectionHandoff,
  TEMPORARY_GOAL_SUPERVISOR_RUNNER_PATH
} from './core-projection-handoff-metadata.js';

export const GOAL_SUPERVISOR_CORE_PROJECTION_CONTRACT_NAME = 'goal-supervisor-core-projection.v1';
export const GOAL_SUPERVISOR_CORE_PROJECTION_CONTRACT_VERSION = 1;
export {
  GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA,
  GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA_CONTRACT_NAME,
  GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA_CONTRACT_VERSION,
  TEMPORARY_GOAL_SUPERVISOR_RUNNER_PATH,
  buildGoalSupervisorCoreProjectionHandoff
} from './core-projection-handoff-metadata.js';

export function buildGoalSupervisorCoreProjection({
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
  externalRunnerPath = TEMPORARY_GOAL_SUPERVISOR_RUNNER_PATH,
  migration = {}
} = {}) {
  const resolvedRouteInput = routeInput ?? buildRouteInputIfPossible({
    state,
    active,
    threadRead,
    escrow,
    expected,
    releaseGates
  });
  const route = projectGoalSupervisorRouteProgress({
    state,
    goalNext,
    routeInput: resolvedRouteInput,
    allowCloseout,
    nowMs,
    ...(progressGraceMs === undefined ? {} : { progressGraceMs })
  });
  const progress = route.progress;

  return {
    contractName: GOAL_SUPERVISOR_CORE_PROJECTION_CONTRACT_NAME,
    contractVersion: GOAL_SUPERVISOR_CORE_PROJECTION_CONTRACT_VERSION,
    readOnly: true,
    willMutate: false,
    generatedAt: new Date(nowMs).toISOString(),
    goalId: nonEmptyString(state?.goalId) ? state.goalId : (goalNext?.goalId ?? expected?.goalId ?? null),
    current: route.current,
    route,
    progress,
    routeInput: resolvedRouteInput,
    migrationHandoff: buildGoalSupervisorCoreProjectionHandoff({
      externalRunnerPath,
      migration
    }),
    boundaries: {
      liveDaemonOwner: false,
      providerCliExecution: false,
      genericShellRunner: false,
      browserTerminalAutomation: false,
      liveManagedGoalAppend: false,
      ...projectReleasePolicyBoundaries()
    }
  };
}

function buildRouteInputIfPossible({
  state,
  active,
  threadRead,
  escrow,
  expected,
  releaseGates
}) {
  if (!isPlainObject(expected)) {
    return null;
  }

  return buildEscrowFirstRouteInput({
    state,
    active,
    threadRead,
    escrow,
    expected,
    releaseGates
  });
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}
