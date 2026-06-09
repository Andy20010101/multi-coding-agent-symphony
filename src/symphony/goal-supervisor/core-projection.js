import { buildEscrowFirstRouteInput } from './app-thread-adapter.js';
import { projectGoalSupervisorRouteProgress } from './route-progress.js';
import {
  deniedExternalReleaseAutomationSurfaces,
  projectReleasePolicyBoundaries
} from './release-policy.js';

export const GOAL_SUPERVISOR_CORE_PROJECTION_CONTRACT_NAME = 'goal-supervisor-core-projection.v1';
export const GOAL_SUPERVISOR_CORE_PROJECTION_CONTRACT_VERSION = 1;
export const TEMPORARY_GOAL_SUPERVISOR_RUNNER_PATH = '/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs';

const DEFAULT_REPOSITORY_OWNED_SURFACES = Object.freeze([
  'result-protocol-validation',
  'app-thread-normalization',
  'escrow-first-result-consumption',
  'route-progress-projection',
  'state-writer-dry-run-preview',
  'event-registrar-dry-run-preview'
]);

const DEFAULT_EXTERNAL_SURFACES = Object.freeze([
  'daemon-launcher-and-pty-process-ownership',
  'app-notice-thread-transport',
  'external-runner-provenance-capture',
  'destructive-worktree-cleanup-execution',
  'live-managed-goal-event-append-confirmation',
  ...deniedExternalReleaseAutomationSurfaces()
]);

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
    migrationHandoff: buildMigrationHandoff({
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

function buildMigrationHandoff({
  externalRunnerPath,
  migration
}) {
  return {
    temporaryExternalRunner: {
      path: externalRunnerPath,
      operationalFallback: true,
      rollbackAction: `continue using ${externalRunnerPath}`
    },
    repositoryOwnedAfterV44: normalizeStringList(
      migration.repositoryOwnedAfterV44,
      DEFAULT_REPOSITORY_OWNED_SURFACES
    ),
    remainsExternalAfterV44: normalizeStringList(
      migration.remainsExternalAfterV44,
      DEFAULT_EXTERNAL_SURFACES
    ),
    nextHandoffCondition: nonEmptyString(migration.nextHandoffCondition)
      ? migration.nextHandoffCondition
      : 'compare this read-only projection against the temporary runner before moving runtime ownership',
    rollbackGuidance: nonEmptyString(migration.rollbackGuidance)
      ? migration.rollbackGuidance
      : 'do not retire or bypass the temporary external runner during v44'
  };
}

function normalizeStringList(value, fallback) {
  if (!Array.isArray(value) || value.length === 0) {
    return [...fallback];
  }

  return value.filter(nonEmptyString);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}
