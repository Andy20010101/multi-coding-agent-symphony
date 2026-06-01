import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { isSafeGoalEventToken } from './goal-event-contracts.js';
import { atomicWriteJson } from './state.js';

export const GOAL_OPERATION_RUNS_CONTRACT_NAME = 'goal-operation-runs.v1';
export const GOAL_OPERATION_RUNS_CONTRACT_VERSION = 1;
export const MANAGED_GOAL_OPERATION_RUN_STORAGE = 'managed-goal-operation-run-registry';

const COMMAND_KINDS = Object.freeze(['update', 'review', 'gate', 'implementation', 'adoption-plan', 'adoption-confirm', 'verification']);
const ACTOR_ROLES = Object.freeze([
  'worker',
  'reviewer',
  'main-verifier',
  'release-verifier',
  'release-manager'
]);
const STATUSES = Object.freeze([
  'dry-run-planned',
  'running',
  'confirmed',
  'failed'
]);
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const registryWriteChains = new Map();

export class GoalOperationRunRegistryError extends Error {
  constructor(code, message, safeDetails) {
    super(message);
    this.name = 'GoalOperationRunRegistryError';
    this.code = code;

    if (safeDetails !== undefined) {
      this.safeDetails = safeDetails;
    }
  }
}

export async function recordGoalOperationRun(options = {}) {
  const normalized = normalizeOperationRun(options);
  const registryPath = getManagedGoalOperationRunsPath({
    stateDir: normalized.stateDir,
    goalId: normalized.goalId
  });

  return enqueueManagedOperationRegistryWrite(
    registryPath,
    async () => {
      const registry = await readGoalOperationRuns({
        stateDir: normalized.stateDir,
        goalId: normalized.goalId
      });
      const existing = registry.runs.find((run) => run.operationId === normalized.operationId);
      const run = buildOperationRunRecord({ normalized, existing });
      const runs = [
        ...registry.runs.filter((candidate) => candidate.operationId !== run.operationId),
        run
      ].sort(compareOperationRuns);
      const updatedRegistry = buildGoalOperationRunsContract({
        goalId: normalized.goalId,
        runs
      });

      await atomicWriteJson(registryPath, updatedRegistry);

      return structuredClone(run);
    }
  );
}

export async function readGoalOperationRuns({ stateDir = '.symphony', goalId } = {}) {
  const normalizedStateDir = normalizeStateDir(stateDir);
  const normalizedGoalId = normalizeSafeToken(goalId, 'goalId');
  const registryPath = getManagedGoalOperationRunsPath({
    stateDir: normalizedStateDir,
    goalId: normalizedGoalId
  });
  const registry = await readJsonIfExists(registryPath);

  if (registry === null) {
    return buildGoalOperationRunsContract({
      goalId: normalizedGoalId,
      runs: []
    });
  }

  return normalizeExistingRegistry(registry, normalizedGoalId);
}

export function buildGoalOperationId({
  goalId,
  taskId = null,
  role,
  commandKind,
  planHash
} = {}) {
  const normalized = {
    goalId: normalizeSafeToken(goalId, 'goalId'),
    taskId: normalizeOptionalSafeToken(taskId, 'taskId'),
    role: normalizeRole(role),
    commandKind: normalizeCommandKind(commandKind),
    planHash: normalizePlanHash(planHash)
  };

  return `op_${shortHash(normalized)}`;
}

export function getManagedGoalOperationRunsPath({ stateDir = '.symphony', goalId } = {}) {
  const normalizedStateDir = normalizeStateDir(stateDir);
  const normalizedGoalId = normalizeSafeToken(goalId, 'goalId');

  return join(normalizedStateDir, 'goals', 'operations', `${normalizedGoalId}.json`);
}

function normalizeOperationRun(options) {
  if (!isPlainObject(options)) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run',
      'Goal operation run input must be an object.'
    );
  }

  const goalId = normalizeSafeToken(options.goalId, 'goalId');
  const taskId = normalizeOptionalSafeToken(options.taskId ?? null, 'taskId');
  const role = normalizeRole(options.role);
  const commandKind = normalizeCommandKind(options.commandKind);
  const planHash = normalizePlanHash(options.planHash);

  return {
    stateDir: normalizeStateDir(options.stateDir),
    operationId: typeof options.operationId === 'string' && isSafeGoalEventToken(options.operationId)
      ? options.operationId
      : buildGoalOperationId({
          goalId,
          taskId,
          role,
          commandKind,
          planHash
        }),
    goalId,
    taskId,
    role,
    commandKind,
    commandName: normalizeOptionalString(options.commandName, 'commandName'),
    status: normalizeStatus(options.status),
    planHash,
    eventIds: normalizeEventIds(options.eventIds),
    output: normalizeOptionalJsonObject(options.output, 'output'),
    runResult: normalizeOptionalJsonObject(options.runResult, 'runResult'),
    artifactRefs: normalizeArtifactRefs(options.artifactRefs),
    verifierSummary: normalizeOptionalJsonObject(options.verifierSummary, 'verifierSummary'),
    failureReason: normalizeOptionalString(options.failureReason, 'failureReason'),
    source: normalizeOptionalString(options.source, 'source') ?? 'workbench',
    recordedAt: normalizeOptionalTimestamp(options.recordedAt) ?? new Date().toISOString()
  };
}

function buildOperationRunRecord({ normalized, existing }) {
  const existingIsTerminal = existing?.status === 'confirmed' || existing?.status === 'failed';
  const status = existingIsTerminal && normalized.status === 'dry-run-planned'
    ? existing.status
    : normalized.status;
  const startedAt = existing?.timestamps?.startedAt ?? normalized.recordedAt;
  const completedAt = (status === 'confirmed' || status === 'failed') && normalized.status === status
    ? normalized.recordedAt
    : existing?.timestamps?.completedAt ?? null;
  const eventIds = normalized.eventIds.length > 0
    ? normalized.eventIds
    : existing?.eventIds ?? normalized.eventIds;
  const source = existingIsTerminal && normalized.status === 'dry-run-planned'
    ? existing?.source ?? normalized.source
    : normalized.source;

  return stripUndefined({
    operationId: normalized.operationId,
    goalId: normalized.goalId,
    taskId: normalized.taskId,
    role: normalized.role,
    commandKind: normalized.commandKind,
    commandName: normalized.commandName,
    status,
    planHash: normalized.planHash,
    eventIds,
    output: normalized.output ?? existing?.output,
    runResult: normalized.runResult ?? existing?.runResult,
    artifactRefs: normalized.artifactRefs.length > 0
      ? normalized.artifactRefs
      : existing?.artifactRefs ?? normalized.artifactRefs,
    verifierSummary: normalized.verifierSummary ?? existing?.verifierSummary,
    failureReason: normalized.failureReason ?? existing?.failureReason,
    source,
    timestamps: {
      startedAt,
      updatedAt: normalized.recordedAt,
      completedAt
    }
  });
}

function buildGoalOperationRunsContract({ goalId, runs }) {
  const sortedRuns = [...runs].sort(compareOperationRuns);
  const latestRun = sortedRuns.at(-1) ?? null;

  return {
    contractName: GOAL_OPERATION_RUNS_CONTRACT_NAME,
    contractVersion: GOAL_OPERATION_RUNS_CONTRACT_VERSION,
    goalId,
    storage: MANAGED_GOAL_OPERATION_RUN_STORAGE,
    appendOnly: false,
    operationCount: sortedRuns.length,
    latestOperationId: latestRun?.operationId ?? null,
    runs: sortedRuns
  };
}

function normalizeExistingRegistry(registry, goalId) {
  if (!isPlainObject(registry) || registry.contractName !== GOAL_OPERATION_RUNS_CONTRACT_NAME) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run-registry',
      'Goal operation run registry state is invalid.'
    );
  }

  if (registry.goalId !== goalId || !Array.isArray(registry.runs)) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run-registry',
      'Goal operation run registry state does not match the requested goal.'
    );
  }

  return buildGoalOperationRunsContract({
    goalId,
    runs: registry.runs.map((run) => normalizeExistingRun(run, goalId))
  });
}

function normalizeExistingRun(run, goalId) {
  if (!isPlainObject(run)) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run-registry',
      'Goal operation run registry contains an invalid run.'
    );
  }

  return {
    operationId: normalizeSafeToken(run.operationId, 'operationId'),
    goalId,
    taskId: normalizeOptionalSafeToken(run.taskId ?? null, 'taskId'),
    role: normalizeRole(run.role),
    commandKind: normalizeCommandKind(run.commandKind),
    commandName: normalizeOptionalString(run.commandName, 'commandName'),
    status: normalizeStatus(run.status),
    planHash: normalizePlanHash(run.planHash),
    eventIds: normalizeEventIds(run.eventIds),
    output: normalizeOptionalJsonObject(run.output, 'output'),
    runResult: normalizeOptionalJsonObject(run.runResult, 'runResult'),
    artifactRefs: normalizeArtifactRefs(run.artifactRefs),
    verifierSummary: normalizeOptionalJsonObject(run.verifierSummary, 'verifierSummary'),
    failureReason: normalizeOptionalString(run.failureReason, 'failureReason'),
    source: normalizeOptionalString(run.source, 'source') ?? 'workbench',
    timestamps: {
      startedAt: normalizeRequiredTimestamp(run.timestamps?.startedAt, 'timestamps.startedAt'),
      updatedAt: normalizeRequiredTimestamp(run.timestamps?.updatedAt, 'timestamps.updatedAt'),
      completedAt: normalizeOptionalTimestamp(run.timestamps?.completedAt)
    }
  };
}

async function enqueueManagedOperationRegistryWrite(registryPath, operation) {
  const previous = registryWriteChains.get(registryPath) ?? Promise.resolve();
  const write = previous.then(operation, operation);
  const settled = write.catch(() => {});

  registryWriteChains.set(registryPath, settled);

  try {
    return await write;
  } finally {
    if (registryWriteChains.get(registryPath) === settled) {
      registryWriteChains.delete(registryPath);
    }
  }
}

async function readJsonIfExists(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

function normalizeStateDir(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalOperationRunRegistryError(
      'invalid-state-dir',
      'Goal operation run registry state directory is invalid.'
    );
  }

  return value;
}

function normalizeSafeToken(value, field) {
  if (!isSafeGoalEventToken(value)) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run',
      `${field} must be a safe non-empty token.`
    );
  }

  return value;
}

function normalizeOptionalSafeToken(value, field) {
  if (value === null || value === undefined) {
    return null;
  }

  return normalizeSafeToken(value, field);
}

function normalizeRole(value) {
  if (!ACTOR_ROLES.includes(value)) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run',
      `role must be one of: ${ACTOR_ROLES.join(', ')}.`
    );
  }

  return value;
}

function normalizeCommandKind(value) {
  if (!COMMAND_KINDS.includes(value)) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run',
      `commandKind must be one of: ${COMMAND_KINDS.join(', ')}.`
    );
  }

  return value;
}

function normalizeStatus(value) {
  if (!STATUSES.includes(value)) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run',
      `status must be one of: ${STATUSES.join(', ')}.`
    );
  }

  return value;
}

function normalizePlanHash(value) {
  if (!HASH_PATTERN.test(value)) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run',
      'planHash must be a sha256 hash.'
    );
  }

  return value;
}

function normalizeEventIds(value) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run',
      'eventIds must be an array.'
    );
  }

  return value.map((eventId, index) => normalizeSafeToken(eventId, `eventIds[${index}]`));
}

function normalizeArtifactRefs(value) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run',
      'artifactRefs must be an array.'
    );
  }

  return value.map((entry, index) => {
    if (!isPlainObject(entry)) {
      throw new GoalOperationRunRegistryError(
        'invalid-goal-operation-run',
        `artifactRefs[${index}] must be an object.`
      );
    }

    return stripUndefined({
      kind: normalizeOptionalString(entry.kind, `artifactRefs[${index}].kind`),
      path: normalizeOptionalString(entry.path, `artifactRefs[${index}].path`),
      ref: normalizeOptionalString(entry.ref, `artifactRefs[${index}].ref`),
      uri: normalizeOptionalString(entry.uri, `artifactRefs[${index}].uri`),
      title: normalizeOptionalString(entry.title, `artifactRefs[${index}].title`),
      displayTitle: normalizeOptionalString(entry.displayTitle, `artifactRefs[${index}].displayTitle`),
      sourceRunId: normalizeOptionalString(entry.sourceRunId, `artifactRefs[${index}].sourceRunId`),
      artifactKind: normalizeOptionalString(entry.artifactKind, `artifactRefs[${index}].artifactKind`),
      mime: normalizeOptionalString(entry.mime, `artifactRefs[${index}].mime`),
      status: normalizeOptionalString(entry.status, `artifactRefs[${index}].status`)
    });
  });
}

function normalizeOptionalJsonObject(value, field) {
  if (value === undefined || value === null) {
    return null;
  }

  if (!isPlainObject(value)) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run',
      `${field} must be an object when provided.`
    );
  }

  return stripUndefined(structuredClone(value));
}

function normalizeOptionalString(value, field) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run',
      `${field} must be a non-empty string when provided.`
    );
  }

  return value.trim();
}

function normalizeRequiredTimestamp(value, field) {
  const timestamp = normalizeOptionalTimestamp(value);

  if (timestamp === null) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run-registry',
      `${field} must be an ISO timestamp.`
    );
  }

  return timestamp;
}

function normalizeOptionalTimestamp(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new GoalOperationRunRegistryError(
      'invalid-goal-operation-run',
      'timestamps must be ISO timestamp strings.'
    );
  }

  return new Date(value).toISOString();
}

function compareOperationRuns(left, right) {
  const byUpdatedAt = left.timestamps.updatedAt.localeCompare(right.timestamps.updatedAt);

  if (byUpdatedAt !== 0) {
    return byUpdatedAt;
  }

  return left.operationId.localeCompare(right.operationId);
}

function shortHash(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex').slice(0, 16);
}

function canonicalJson(value) {
  return JSON.stringify(sortJson(value));
}

function sortJson(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJson(entry));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, sortJson(value[key])])
    );
  }

  return value;
}

function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefined(entry));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)])
    );
  }

  return value;
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}
