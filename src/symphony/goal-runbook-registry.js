import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isSafeGoalEventToken } from './goal-event-contracts.js';
import {
  GOAL_RUNBOOK_CONTRACT_NAME,
  GOAL_RUNBOOK_CONTRACT_VERSION,
  assertGoalRunbookContract
} from './goal-runbook-contracts.js';
import { atomicWriteJson } from './state.js';

export const GOAL_RUNBOOK_INIT_PLAN_CONTRACT_NAME = 'goal-runbook-init-plan.v1';
export const GOAL_RUNBOOK_INIT_RESULT_CONTRACT_NAME = 'goal-runbook-init-result.v1';
export const GOAL_RUNBOOK_INIT_CONTRACT_VERSION = 1;
export const MANAGED_GOAL_RUNBOOK_STATE_CONTRACT_NAME = 'managed-goal-runbook-state.v1';
export const MANAGED_ACTIVE_GOAL_POINTER_CONTRACT_NAME = 'managed-active-goal-pointer.v1';
export const MANAGED_GOAL_RUNBOOK_STORAGE = 'managed-goal-runbook-registry';
export const MANAGED_ACTIVE_GOAL_POINTER_STORAGE = 'managed-active-goal-pointer';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const CONTROLLED_FIXTURE_PREFIX = 'fixtures/contracts/';
const CONTROLLED_GOAL_RUNBOOK_FIXTURE_PATTERN = /^goal-runbook\.[A-Za-z0-9._-]+\.v1\.json$/u;
const GOAL_INIT_OPTION_KEYS = new Set([
  'stateDir',
  'goalId',
  'fromJson',
  'confirm',
  'dryRun',
  'planHash',
  'help'
]);
const registryWriteChains = new Map();

export class GoalRunbookRegistryError extends Error {
  constructor(code, message, safeDetails) {
    super(message);
    this.name = 'GoalRunbookRegistryError';
    this.code = code;

    if (safeDetails !== undefined) {
      this.safeDetails = safeDetails;
    }
  }
}

export async function buildGoalRunbookInitPlan(options = {}) {
  const normalized = await normalizeGoalRunbookInitInput(options);

  return buildGoalRunbookInitPlanFromNormalized(normalized);
}

export async function confirmGoalRunbookInit(options = {}) {
  const normalized = await normalizeGoalRunbookInitInput(options);

  if (typeof normalized.planHash !== 'string') {
    throw new GoalRunbookRegistryError(
      'missing-plan-hash',
      'goal init confirm requires --plan-hash.'
    );
  }

  if (!HASH_PATTERN.test(normalized.planHash)) {
    throw new GoalRunbookRegistryError(
      'invalid-plan-hash',
      '--plan-hash must be a sha256 hash.'
    );
  }

  const plan = buildGoalRunbookInitPlanFromNormalized(normalized);

  if (plan.planHash !== normalized.planHash) {
    throw new GoalRunbookRegistryError(
      'plan-hash-mismatch',
      'goal init plan hash does not match the current input; managed registry write refused.'
    );
  }

  const registryPath = getManagedGoalRunbookPath({
    stateDir: normalized.stateDir,
    goalId: normalized.goalId
  });

  return enqueueManagedRegistryWrite(
    registryPath,
    () => writeManagedGoalRunbookState({ normalized, plan })
  );
}

export async function readManagedGoalRunbookState({ stateDir = '.symphony', goalId } = {}) {
  assertSafeGoalId(goalId);

  return readJsonIfExists(getManagedGoalRunbookPath({ stateDir, goalId }));
}

export async function readManagedActiveGoalPointer({ stateDir = '.symphony' } = {}) {
  return readJsonIfExists(getManagedActiveGoalPointerPath({ stateDir }));
}

export function getManagedGoalRunbookPath({ stateDir = '.symphony', goalId } = {}) {
  assertSafeStateDir(stateDir);
  assertSafeGoalId(goalId);

  return join(stateDir, 'goals', 'runbooks', `${goalId}.json`);
}

export function getManagedActiveGoalPointerPath({ stateDir = '.symphony' } = {}) {
  assertSafeStateDir(stateDir);

  return join(stateDir, 'goals', 'latest-active-goal.json');
}

async function normalizeGoalRunbookInitInput(options) {
  if (!isPlainObject(options)) {
    throw new GoalRunbookRegistryError(
      'invalid-goal-init-input',
      'goal init input must be an object.'
    );
  }

  assertKnownOptions(options, GOAL_INIT_OPTION_KEYS);

  const goalId = normalizeSafeToken(options.goalId, '--goal');
  const stateDir = normalizeStateDir(options.stateDir);
  const sourceRef = normalizeControlledRunbookFixtureRef(options.fromJson);
  const sourceRunbook = await readControlledGoalRunbookFixture(sourceRef);
  const runbook = assertGoalRunbookContract({
    ...structuredClone(sourceRunbook),
    goalId
  });
  const stateRefs = buildStateRefs({ stateDir, goalId });

  return {
    stateDir,
    goalId,
    source: {
      kind: 'controlled-fixture',
      ref: sourceRef,
      runbookGoalId: sourceRunbook.goalId
    },
    runbook,
    stateRefs,
    planHash: options.planHash
  };
}

function buildGoalRunbookInitPlanFromNormalized(normalized) {
  const planId = buildPlanId(normalized);
  const planHash = computePlanHash({ normalized, planId });
  const confirmCommand = buildConfirmCommand({
    normalized,
    planHash
  });

  return {
    contractName: GOAL_RUNBOOK_INIT_PLAN_CONTRACT_NAME,
    contractVersion: GOAL_RUNBOOK_INIT_CONTRACT_VERSION,
    planId,
    planHash,
    goalId: normalized.goalId,
    mode: 'dry-run',
    command: {
      name: 'symphony goal init',
      intent: 'register-managed-goal-runbook',
      confirmRequired: true
    },
    source: structuredClone(normalized.source),
    runbook: summarizeRunbook(normalized.runbook),
    validation: {
      status: 'ok',
      errors: [],
      warnings: []
    },
    writeIntent: buildWriteIntent({
      normalized,
      writesInDryRun: false
    }),
    confirm: {
      available: true,
      requiredFlags: ['--confirm', '--plan-hash'],
      copyOnlyCommand: confirmCommand
    },
    stateRefs: structuredClone(normalized.stateRefs),
    safety: buildSafety({ writesInDryRun: false })
  };
}

async function writeManagedGoalRunbookState({ normalized, plan }) {
  const state = buildManagedGoalRunbookState({ normalized, planHash: plan.planHash });
  const pointer = buildManagedActiveGoalPointer({ normalized, planHash: plan.planHash });
  const existingState = await readJsonIfExists(normalized.stateRefs.runbookState.path);

  if (existingState !== null && !sameManagedRunbookState(existingState, state)) {
    throw new GoalRunbookRegistryError(
      'goal-runbook-state-conflict',
      'managed goal runbook state already exists for this goal with different content.'
    );
  }

  const existingPointer = await readJsonIfExists(normalized.stateRefs.latestActiveGoalPointer.path);
  const shouldWriteState = existingState === null;
  const shouldWritePointer = !canonicalEqual(existingPointer, pointer);

  if (shouldWriteState) {
    await atomicWriteJson(normalized.stateRefs.runbookState.path, state);
  }

  if (shouldWritePointer) {
    await mkdir(dirname(normalized.stateRefs.latestActiveGoalPointer.path), { recursive: true });
    await atomicWriteJson(normalized.stateRefs.latestActiveGoalPointer.path, pointer);
  }

  const written = shouldWriteState || shouldWritePointer;

  return {
    contractName: GOAL_RUNBOOK_INIT_RESULT_CONTRACT_NAME,
    contractVersion: GOAL_RUNBOOK_INIT_CONTRACT_VERSION,
    mode: 'confirm',
    status: written ? 'registered' : 'already-registered',
    written,
    goalId: normalized.goalId,
    planHash: plan.planHash,
    command: {
      name: 'symphony goal init',
      intent: 'register-managed-goal-runbook',
      confirmRequired: true
    },
    source: structuredClone(normalized.source),
    runbook: summarizeRunbook(normalized.runbook),
    writeIntent: buildWriteIntent({
      normalized,
      writesInDryRun: false
    }),
    confirm: {
      available: true,
      requiredFlags: ['--confirm', '--plan-hash'],
      copyOnlyCommand: plan.confirm.copyOnlyCommand
    },
    stateRefs: structuredClone(normalized.stateRefs),
    state: {
      runbookState: shouldWriteState ? 'written' : 'unchanged',
      latestActiveGoalPointer: shouldWritePointer ? 'written' : 'unchanged'
    },
    safety: buildSafety({ writesInDryRun: false })
  };
}

function buildManagedGoalRunbookState({ normalized, planHash }) {
  return {
    contractName: MANAGED_GOAL_RUNBOOK_STATE_CONTRACT_NAME,
    contractVersion: GOAL_RUNBOOK_INIT_CONTRACT_VERSION,
    goalId: normalized.goalId,
    planHash,
    active: true,
    storage: MANAGED_GOAL_RUNBOOK_STORAGE,
    source: structuredClone(normalized.source),
    runbook: structuredClone(normalized.runbook),
    stateRefs: structuredClone(normalized.stateRefs),
    safety: {
      managedPathOnly: true,
      arbitraryPathReadAvailable: false,
      arbitraryPathWriteAvailable: false,
      modelInvocationAvailable: false
    }
  };
}

function buildManagedActiveGoalPointer({ normalized, planHash }) {
  return {
    contractName: MANAGED_ACTIVE_GOAL_POINTER_CONTRACT_NAME,
    contractVersion: GOAL_RUNBOOK_INIT_CONTRACT_VERSION,
    goalId: normalized.goalId,
    planHash,
    storage: MANAGED_ACTIVE_GOAL_POINTER_STORAGE,
    runbookStateRef: normalized.stateRefs.runbookState.path
  };
}

function buildWriteIntent({ normalized, writesInDryRun }) {
  return {
    managedOnly: true,
    writesInDryRun,
    confirmRequired: true,
    targets: [
      {
        kind: 'runbook-state',
        storage: MANAGED_GOAL_RUNBOOK_STORAGE,
        path: normalized.stateRefs.runbookState.path
      },
      {
        kind: 'latest-active-goal-pointer',
        storage: MANAGED_ACTIVE_GOAL_POINTER_STORAGE,
        path: normalized.stateRefs.latestActiveGoalPointer.path
      }
    ]
  };
}

function buildSafety({ writesInDryRun }) {
  return {
    dryRunWrites: writesInDryRun,
    confirmWritesManagedStateOnly: true,
    arbitraryPathReadAvailable: false,
    arbitraryPathWriteAvailable: false,
    workbenchWriteAvailable: false,
    browserExecutionAvailable: false,
    modelInvocationAvailable: false,
    automaticEventRegistrationAvailable: false
  };
}

function buildStateRefs({ stateDir, goalId }) {
  return {
    runbookState: {
      storage: MANAGED_GOAL_RUNBOOK_STORAGE,
      path: getManagedGoalRunbookPath({ stateDir, goalId })
    },
    latestActiveGoalPointer: {
      storage: MANAGED_ACTIVE_GOAL_POINTER_STORAGE,
      path: getManagedActiveGoalPointerPath({ stateDir })
    }
  };
}

function summarizeRunbook(runbook) {
  return {
    contractName: GOAL_RUNBOOK_CONTRACT_NAME,
    contractVersion: GOAL_RUNBOOK_CONTRACT_VERSION,
    goalTitle: runbook.goalTitle,
    taskCount: runbook.tasks.length,
    taskIds: runbook.tasks.map((task) => task.taskId),
    releaseGateCount: runbook.releaseGates.length
  };
}

function sameManagedRunbookState(existingState, nextState) {
  return canonicalEqual(existingState, nextState);
}

async function enqueueManagedRegistryWrite(registryPath, operation) {
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

function buildPlanId(normalized) {
  return `goal_init_${shortHash(stableInputForHash(normalized))}`;
}

function computePlanHash({ normalized, planId }) {
  return `sha256:${createHash('sha256').update(canonicalJson({
    contractName: GOAL_RUNBOOK_INIT_PLAN_CONTRACT_NAME,
    contractVersion: GOAL_RUNBOOK_INIT_CONTRACT_VERSION,
    planId,
    goalId: normalized.goalId,
    command: {
      name: 'symphony goal init',
      intent: 'register-managed-goal-runbook',
      confirmRequired: true
    },
    source: normalized.source,
    runbook: normalized.runbook,
    writeIntent: buildWriteIntent({
      normalized,
      writesInDryRun: false
    }),
    stateRefs: normalized.stateRefs,
    safety: buildSafety({ writesInDryRun: false })
  })).digest('hex')}`;
}

function stableInputForHash(normalized) {
  return {
    goalId: normalized.goalId,
    source: normalized.source,
    runbook: normalized.runbook,
    stateRefs: normalized.stateRefs
  };
}

function shortHash(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex').slice(0, 16);
}

function buildConfirmCommand({ normalized, planHash }) {
  const args = [
    'symphony',
    'goal',
    'init',
    '--goal',
    normalized.goalId,
    '--from-json',
    normalized.source.ref
  ];

  if (normalized.stateDir !== '.symphony') {
    args.push('--state-dir', normalized.stateDir);
  }

  args.push(
    '--confirm',
    '--plan-hash',
    planHash,
    '--json'
  );

  return args.map(shellQuote).join(' ');
}

function normalizeStateDir(value) {
  if (value === undefined) {
    return '.symphony';
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalRunbookRegistryError(
      'invalid-state-dir',
      '--state-dir must be a non-empty string.'
    );
  }

  return value;
}

function normalizeSafeToken(value, field) {
  if (!isSafeGoalEventToken(value)) {
    throw new GoalRunbookRegistryError(
      'invalid-goal-init-input',
      `${field} must be a safe non-empty token.`
    );
  }

  return value;
}

function assertSafeGoalId(goalId) {
  if (!isSafeGoalEventToken(goalId)) {
    throw new GoalRunbookRegistryError(
      'invalid-goal-id',
      'Goal runbook registry requires a safe goal id.'
    );
  }
}

function assertSafeStateDir(stateDir) {
  if (typeof stateDir !== 'string' || stateDir.trim() === '') {
    throw new GoalRunbookRegistryError(
      'invalid-state-dir',
      'Goal runbook registry state directory is invalid.'
    );
  }
}

function normalizeControlledRunbookFixtureRef(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalRunbookRegistryError(
      'missing-runbook-source',
      'goal init requires --from-json with a controlled goal-runbook fixture.'
    );
  }

  const normalized = value.trim();

  if (normalized !== value ||
    normalized.startsWith('/') ||
    normalized.startsWith('file://') ||
    normalized.startsWith('~/') ||
    normalized.includes('\\') ||
    normalized.includes('..') ||
    normalized.includes('%')) {
    throw new GoalRunbookRegistryError(
      'unsupported-runbook-source',
      '--from-json must reference a controlled goal-runbook fixture.'
    );
  }

  if (!normalized.startsWith(CONTROLLED_FIXTURE_PREFIX) || posix.normalize(normalized) !== normalized) {
    throw new GoalRunbookRegistryError(
      'unsupported-runbook-source',
      '--from-json must reference a controlled goal-runbook fixture.'
    );
  }

  const fixtureName = normalized.slice(CONTROLLED_FIXTURE_PREFIX.length);

  if (!CONTROLLED_GOAL_RUNBOOK_FIXTURE_PATTERN.test(fixtureName)) {
    throw new GoalRunbookRegistryError(
      'unsupported-runbook-source',
      '--from-json must reference a controlled goal-runbook fixture.'
    );
  }

  return normalized;
}

async function readControlledGoalRunbookFixture(ref) {
  const path = join(REPO_ROOT, ref);
  let parsed;

  try {
    parsed = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new GoalRunbookRegistryError(
        'runbook-source-not-found',
        'controlled goal-runbook fixture was not found.'
      );
    }

    if (error instanceof SyntaxError) {
      throw new GoalRunbookRegistryError(
        'invalid-runbook-json',
        'controlled goal-runbook fixture must contain valid JSON.'
      );
    }

    throw error;
  }

  try {
    return assertGoalRunbookContract(parsed);
  } catch (error) {
    throw new GoalRunbookRegistryError(
      'invalid-goal-runbook',
      'goal init requires a valid goal-runbook.v1 source.',
      { reason: error.message }
    );
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

function assertKnownOptions(options, knownKeys) {
  for (const key of Object.keys(options)) {
    if (!knownKeys.has(key)) {
      throw new GoalRunbookRegistryError(
        'unsupported-goal-init-option',
        'Goal runbook registry accepts only managed writer options.',
        { option: key }
      );
    }
  }
}

function shellQuote(value) {
  if (/^[A-Za-z0-9._:/=-]+$/u.test(value)) {
    return value;
  }

  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}

function canonicalEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => value[key] !== undefined)
        .sort()
        .map((key) => [key, canonicalize(value[key])])
    );
  }

  return value;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
