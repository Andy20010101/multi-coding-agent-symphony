import { lstat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export const LOCAL_RUNTIME_HEALTH_CONTRACT_NAME = 'local-runtime-health.v1';
export const LOCAL_RUNTIME_HEALTH_CONTRACT_VERSION = 1;
export const LOCAL_RUNTIME_VERSION = 'v33-app-runtime-foundation.1';
export const LOCAL_RUNTIME_RELEASE_NAME = 'v33 App Runtime Foundation';
export const WORKFLOW_KERNEL_VERSION = 'v32-release-manager-workspace-v2';
export const WORKFLOW_KERNEL_SOURCE = 'v32 Release Manager Workspace v2';

const DEFAULT_BOUNDARIES = Object.freeze({
  readOnly: true,
  actionExecutionAvailable: false,
  jobQueueAvailable: false,
  modelInvocationAvailable: false,
  gitWriteAvailable: false,
  releaseWriteAvailable: false,
  arbitraryCommandExecutionAvailable: false
});

export async function buildLocalRuntimeHealth({
  cwd = process.cwd(),
  startedAt = new Date().toISOString(),
  generatedAt = new Date().toISOString(),
  pid = process.pid,
  nowMs = Date.now()
} = {}) {
  const resolvedCwd = resolve(cwd);
  const repoPath = await resolveRepoPath(resolvedCwd);
  const blockers = [];

  if (repoPath === null) {
    blockers.push({
      id: 'repo-path-unresolved',
      severity: 'warning',
      message: 'No .git directory or linked-worktree .git file was found at cwd or its parents.'
    });
  }

  const startedAtMs = Date.parse(startedAt);
  const uptimeMs = Number.isFinite(startedAtMs)
    ? Math.max(0, nowMs - startedAtMs)
    : 0;

  return assertLocalRuntimeHealthContract({
    contractName: LOCAL_RUNTIME_HEALTH_CONTRACT_NAME,
    contractVersion: LOCAL_RUNTIME_HEALTH_CONTRACT_VERSION,
    status: blockers.some((blocker) => blocker.severity === 'error') ? 'blocked' : 'ok',
    readOnly: true,
    mode: 'read-only',
    runtime: {
      name: 'symphony-local-sidecar',
      version: LOCAL_RUNTIME_VERSION,
      releaseName: LOCAL_RUNTIME_RELEASE_NAME
    },
    kernel: {
      version: WORKFLOW_KERNEL_VERSION,
      source: WORKFLOW_KERNEL_SOURCE,
      commandSpine: [
        'goal-status',
        'goal next',
        'goal prompt',
        'goal update/review/gate',
        'goal closeout',
        'symphony next --goal latest'
      ]
    },
    process: {
      processId: pid,
      cwd: resolvedCwd,
      repoPath,
      startupTime: startedAt,
      generatedAt,
      uptimeMs
    },
    boundaries: {
      ...DEFAULT_BOUNDARIES
    },
    knownBlockers: blockers
  });
}

export function validateLocalRuntimeHealthContract(health) {
  const errors = [];

  if (!isPlainObject(health)) {
    return {
      ok: false,
      errors: ['health must be a plain object']
    };
  }

  requireExact(errors, health.contractName, 'contractName', LOCAL_RUNTIME_HEALTH_CONTRACT_NAME);
  requireExact(errors, health.contractVersion, 'contractVersion', LOCAL_RUNTIME_HEALTH_CONTRACT_VERSION);
  requireEnum(errors, health.status, 'status', ['ok', 'blocked']);
  requireExact(errors, health.readOnly, 'readOnly', true);
  requireExact(errors, health.mode, 'mode', 'read-only');
  validateRuntime(errors, health.runtime);
  validateKernel(errors, health.kernel);
  validateProcess(errors, health.process);
  validateBoundaries(errors, health.boundaries);
  validateKnownBlockers(errors, health.knownBlockers);

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertLocalRuntimeHealthContract(health) {
  const result = validateLocalRuntimeHealthContract(health);

  if (!result.ok) {
    throw new Error(`Invalid local runtime health contract: ${result.errors.join('; ')}`);
  }

  return health;
}

async function resolveRepoPath(cwd) {
  let current = cwd;

  while (true) {
    try {
      const gitEntry = await lstat(resolve(current, '.git'));

      if (gitEntry.isDirectory() || gitEntry.isFile()) {
        return current;
      }
    } catch {
      // Continue walking upward. Missing or unreadable .git metadata is reported as a blocker only after the walk is exhausted.
    }

    const parent = dirname(current);

    if (parent === current) {
      return null;
    }

    current = parent;
  }
}

function validateRuntime(errors, runtime) {
  if (!isPlainObject(runtime)) {
    errors.push('runtime must be a plain object');
    return;
  }

  requireExact(errors, runtime.name, 'runtime.name', 'symphony-local-sidecar');
  requireNonEmptyString(errors, runtime.version, 'runtime.version');
  requireNonEmptyString(errors, runtime.releaseName, 'runtime.releaseName');
}

function validateKernel(errors, kernel) {
  if (!isPlainObject(kernel)) {
    errors.push('kernel must be a plain object');
    return;
  }

  requireNonEmptyString(errors, kernel.version, 'kernel.version');
  requireNonEmptyString(errors, kernel.source, 'kernel.source');

  if (!Array.isArray(kernel.commandSpine) || kernel.commandSpine.length === 0) {
    errors.push('kernel.commandSpine must be a non-empty array');
  } else {
    kernel.commandSpine.forEach((entry, index) => {
      requireNonEmptyString(errors, entry, `kernel.commandSpine[${index}]`);
    });
  }
}

function validateProcess(errors, processInfo) {
  if (!isPlainObject(processInfo)) {
    errors.push('process must be a plain object');
    return;
  }

  if (!Number.isInteger(processInfo.processId) || processInfo.processId < 1) {
    errors.push('process.processId must be a positive integer');
  }

  requireNonEmptyString(errors, processInfo.cwd, 'process.cwd');

  if (processInfo.repoPath !== null) {
    requireNonEmptyString(errors, processInfo.repoPath, 'process.repoPath');
  }

  requireIsoTimestamp(errors, processInfo.startupTime, 'process.startupTime');
  requireIsoTimestamp(errors, processInfo.generatedAt, 'process.generatedAt');

  if (!Number.isInteger(processInfo.uptimeMs) || processInfo.uptimeMs < 0) {
    errors.push('process.uptimeMs must be a non-negative integer');
  }
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);

  for (const field of [
    'actionExecutionAvailable',
    'jobQueueAvailable',
    'modelInvocationAvailable',
    'gitWriteAvailable',
    'releaseWriteAvailable',
    'arbitraryCommandExecutionAvailable'
  ]) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }
}

function validateKnownBlockers(errors, knownBlockers) {
  if (!Array.isArray(knownBlockers)) {
    errors.push('knownBlockers must be an array');
    return;
  }

  knownBlockers.forEach((blocker, index) => {
    const path = `knownBlockers[${index}]`;

    if (!isPlainObject(blocker)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireNonEmptyString(errors, blocker.id, `${path}.id`);
    requireEnum(errors, blocker.severity, `${path}.severity`, ['info', 'warning', 'error']);
    requireNonEmptyString(errors, blocker.message, `${path}.message`);
  });
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireEnum(errors, value, path, values) {
  if (!values.includes(value)) {
    errors.push(`${path} must be one of ${values.join(', ')}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
