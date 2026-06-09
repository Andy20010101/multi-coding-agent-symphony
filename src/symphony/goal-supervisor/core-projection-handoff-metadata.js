import { deniedExternalReleaseAutomationSurfaces } from './release-policy.js';

export const GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA_CONTRACT_NAME =
  'goal-supervisor-core-projection-handoff-metadata.v1';
export const GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA_CONTRACT_VERSION = 1;
export const TEMPORARY_GOAL_SUPERVISOR_RUNNER_PATH =
  '/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs';

const REPOSITORY_OWNED_AFTER_V44_2 = Object.freeze([
  'supervisor-state-vocabulary',
  'recorded-result-intake-projection',
  'result-protocol-validation',
  'app-thread-normalization',
  'escrow-first-result-consumption',
  'route-progress-projection',
  'state-writer-dry-run-preview',
  'event-registrar-dry-run-preview',
  'release-policy-model',
  'core-projection-handoff-metadata'
]);

const REMAINS_EXTERNAL_AFTER_V44_2 = Object.freeze([
  'temporary-runner-runtime-ownership',
  'daemon-launcher-and-pty-process-ownership',
  'real-cli-execution',
  'provider-cli-execution',
  'generic-shell-execution',
  'browser-terminal-automation',
  'app-notice-thread-transport',
  'external-runner-provenance-capture',
  'destructive-worktree-cleanup-execution',
  'live-managed-goal-event-append-confirmation',
  ...deniedExternalReleaseAutomationSurfaces(),
  'github-release-automation',
  'release-closeout-execution-automation',
  'parallel-hardening-lane-mainline'
]);

export const GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA = deepFreeze({
  contractName: GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA_CONTRACT_NAME,
  contractVersion: GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA_CONTRACT_VERSION,
  readOnly: true,
  willMutate: false,
  temporaryExternalRunner: {
    path: TEMPORARY_GOAL_SUPERVISOR_RUNNER_PATH,
    operationalFallback: true
  },
  repositoryOwnedAfterV44: REPOSITORY_OWNED_AFTER_V44_2,
  remainsExternalAfterV44: REMAINS_EXTERNAL_AFTER_V44_2,
  rollbackAction: `continue using ${TEMPORARY_GOAL_SUPERVISOR_RUNNER_PATH}`,
  nextHandoffCondition:
    'compare this read-only projection against the temporary runner before moving runtime ownership',
  rollbackGuidance:
    'if this projection disagrees with live behavior, continue using the temporary external runner and treat projection output as comparison evidence'
});

export function buildGoalSupervisorCoreProjectionHandoff({
  externalRunnerPath,
  migration = {},
  descriptor = GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA
} = {}) {
  const runnerPath = nonEmptyString(externalRunnerPath)
    ? externalRunnerPath
    : descriptor.temporaryExternalRunner.path;
  const rollbackAction = nonEmptyString(migration.rollbackAction)
    ? migration.rollbackAction
    : rollbackActionForRunnerPath({
      runnerPath,
      descriptor
    });

  return {
    temporaryExternalRunner: {
      path: runnerPath,
      operationalFallback: descriptor.temporaryExternalRunner.operationalFallback === true,
      rollbackAction
    },
    repositoryOwnedAfterV44: normalizeStringList(
      migration.repositoryOwnedAfterV44,
      descriptor.repositoryOwnedAfterV44
    ),
    remainsExternalAfterV44: normalizeStringList(
      migration.remainsExternalAfterV44,
      descriptor.remainsExternalAfterV44
    ),
    nextHandoffCondition: nonEmptyString(migration.nextHandoffCondition)
      ? migration.nextHandoffCondition
      : descriptor.nextHandoffCondition,
    rollbackGuidance: nonEmptyString(migration.rollbackGuidance)
      ? migration.rollbackGuidance
      : descriptor.rollbackGuidance
  };
}

function rollbackActionForRunnerPath({
  runnerPath,
  descriptor
}) {
  if (
    runnerPath === descriptor.temporaryExternalRunner.path &&
    nonEmptyString(descriptor.rollbackAction)
  ) {
    return descriptor.rollbackAction;
  }

  return `continue using ${runnerPath}`;
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

function deepFreeze(value) {
  if (!isFreezable(value) || Object.isFrozen(value)) {
    return value;
  }

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }

  return Object.freeze(value);
}

function isFreezable(value) {
  return value !== null && (typeof value === 'object' || typeof value === 'function');
}
