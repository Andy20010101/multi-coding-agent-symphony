import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

import {
  collectFileInventory,
  DEFAULT_INTAKE_LIMITS,
  normalizeRelativePath,
  readTextFileLimited
} from '../intake/file-inventory.js';
import { redactSecrets } from '../redaction.js';

const FINGERPRINT_FILES = [
  'package.json',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'README.md',
  'AGENTS.md',
  'mcas.config.json'
];
const FINGERPRINT_LIMITS = {
  ...DEFAULT_INTAKE_LIMITS,
  maxDepth: 16
};

export function symphonyStatePaths({ stateDir = '.symphony', runId, planId, adoptionId, stageId, gateEventId } = {}) {
  return {
    stateDir,
    latestContextPath: join(stateDir, 'context', 'latest.json'),
    latestRunPath: join(stateDir, 'runs', 'latest.json'),
    latestStagePath: join(stateDir, 'stages', 'latest.json'),
    ...(runId ? { runPath: join(stateDir, 'runs', `${runId}.json`) } : {}),
    ...(planId ? { executionPlanPath: join(stateDir, 'plans', `${planId}.json`) } : {}),
    ...(adoptionId
      ? {
          adoptionPlanPath: join(stateDir, 'adoptions', `${adoptionId}.json`),
          adoptionPatchPath: join(stateDir, 'adoptions', `${adoptionId}.patch`),
          adoptionEvidencePath: join(stateDir, 'adoptions', `${adoptionId}-evidence.json`),
          adoptionJournalPath: join(stateDir, 'adoptions', `${adoptionId}-journal.json`)
        }
      : {}),
    ...(stageId
      ? {
          stagePath: join(stateDir, 'stages', `${stageId}.json`),
          ...(gateEventId ? { stageGateEventPath: join(stateDir, 'stages', `${stageId}-${gateEventId}.json`) } : {})
        }
      : {})
  };
}

export async function buildProjectFingerprint({ projectDir = '.', ignoredPaths = [] } = {}) {
  const root = resolve(projectDir);
  const hash = createHash('sha256');
  const ignoredRelativePaths = normalizeFingerprintIgnoredPaths({ root, ignoredPaths });

  hash.update(`root\0${root}\0`);

  for (const file of FINGERPRINT_FILES) {
    await hashOptionalFile({ hash, root, file });
  }

  await hashProjectInventory({
    hash,
    root,
    ignoredRelativePaths
  });
  await hashOptionalFile({ hash, root, file: join('.git', 'HEAD') });
  await hashOptionalStat({ hash, root, file: join('.git', 'index') });

  return `sha256:${hash.digest('hex')}`;
}

async function hashProjectInventory({ hash, root, ignoredRelativePaths }) {
  const inventory = await collectFileInventory({
    projectDir: root,
    limits: FINGERPRINT_LIMITS,
    ignoredPaths: ignoredRelativePaths
  });
  const files = inventory.files.filter((file) => !isFingerprintIgnored(file, ignoredRelativePaths));

  hash.update(`inventory\0${files.length}\0${inventory.truncated ? 'truncated' : 'complete'}\0`);

  for (const file of files) {
    await hashInventoryFile({ hash, root, file });
  }
}

async function hashInventoryFile({ hash, root, file }) {
  const path = join(root, file);

  try {
    const metadata = await stat(path);
    const content = await readTextFileLimited(root, file, FINGERPRINT_LIMITS.maxBytesPerTextFile);

    hash.update(`inventory-file\0${file}\0${metadata.size}\0${metadata.mtimeMs}\0`);
    hash.update(content);
    hash.update('\0');
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'EISDIR') {
      throw error;
    }

    hash.update(`missing-inventory-file\0${file}\0`);
  }
}

function normalizeFingerprintIgnoredPaths({ root, ignoredPaths }) {
  return ignoredPaths
    .filter((path) => typeof path === 'string' && path.trim() !== '')
    .map((path) => normalizeRelativePath(relative(root, resolve(root, path))))
    .filter((path) => path !== '' && !path.startsWith('..') && path !== '..')
    .sort();
}

function isFingerprintIgnored(file, ignoredRelativePaths) {
  return ignoredRelativePaths.some((ignored) => file === ignored || file.startsWith(`${ignored}/`));
}

export async function readLatestContext({ stateDir = '.symphony' } = {}) {
  return await readJsonIfExists(symphonyStatePaths({ stateDir }).latestContextPath);
}

export async function readLatestRun({ stateDir = '.symphony' } = {}) {
  return await readJsonIfExists(symphonyStatePaths({ stateDir }).latestRunPath);
}

export async function readRunState({ stateDir = '.symphony', runId } = {}) {
  if (runId === undefined || runId === 'latest') {
    return await readLatestRun({ stateDir });
  }

  assertSafeRunId(runId);

  return await readJsonIfExists(symphonyStatePaths({ stateDir, runId }).runPath);
}

export async function readExecutionPlan({ stateDir = '.symphony', planId } = {}) {
  assertSafeRunId(planId);

  return await readJsonIfExists(symphonyStatePaths({ stateDir, planId }).executionPlanPath);
}

export async function readAdoptionPlan({ stateDir = '.symphony', adoptionId } = {}) {
  assertSafeRunId(adoptionId);

  return await readJsonIfExists(symphonyStatePaths({ stateDir, adoptionId }).adoptionPlanPath);
}

export async function readAdoptionJournal({ stateDir = '.symphony', adoptionId } = {}) {
  assertSafeRunId(adoptionId);

  return await readJsonIfExists(symphonyStatePaths({ stateDir, adoptionId }).adoptionJournalPath);
}

export async function listRunStates({ stateDir = '.symphony' } = {}) {
  const runsDir = join(stateDir, 'runs');
  let entries;

  try {
    entries = await readdir(runsDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }

  const runStates = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json') || entry.name === 'latest.json') {
      continue;
    }

    const runState = await readJsonIfExists(join(runsDir, entry.name));

    if (runState !== null) {
      runStates.push(runState);
    }
  }

  return runStates.sort(compareRunStatesNewestFirst);
}

export async function listAdoptionPlans({ stateDir = '.symphony' } = {}) {
  const adoptionDir = join(stateDir, 'adoptions');
  let entries;

  try {
    entries = await readdir(adoptionDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }

  const plans = [];

  for (const entry of entries) {
    if (!entry.isFile()
      || !entry.name.endsWith('.json')
      || entry.name.endsWith('-evidence.json')
      || entry.name.endsWith('-journal.json')) {
      continue;
    }

    const adoptionId = entry.name.slice(0, -'.json'.length);

    try {
      assertSafeRunId(adoptionId);
    } catch {
      continue;
    }

    const plan = await readJsonIfExists(join(adoptionDir, entry.name));

    if (plan !== null) {
      plans.push(plan);
    }
  }

  return plans.sort(compareRunStatesNewestFirst);
}

export async function listAdoptionJournals({ stateDir = '.symphony' } = {}) {
  const adoptionDir = join(stateDir, 'adoptions');
  let entries;

  try {
    entries = await readdir(adoptionDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }

  const journals = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('-journal.json')) {
      continue;
    }

    const adoptionId = entry.name.slice(0, -'-journal.json'.length);

    try {
      assertSafeRunId(adoptionId);
    } catch {
      continue;
    }

    const journal = await readJsonIfExists(join(adoptionDir, entry.name));

    if (journal !== null) {
      journals.push(journal);
    }
  }

  return journals.sort(compareRunStatesNewestFirst);
}

export async function writeLatestContext({ stateDir = '.symphony', pointer }) {
  await atomicWriteJson(symphonyStatePaths({ stateDir }).latestContextPath, pointer);
  return symphonyStatePaths({ stateDir }).latestContextPath;
}

function compareRunStatesNewestFirst(left, right) {
  return timestampValue(right.updatedAt ?? right.createdAt) - timestampValue(left.updatedAt ?? left.createdAt);
}

function timestampValue(value) {
  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export async function writeRunState({ stateDir = '.symphony', runState }) {
  assertSafeRunId(runState?.runId);

  const paths = symphonyStatePaths({ stateDir, runId: runState.runId });

  await atomicWriteJson(paths.runPath, runState);
  await atomicWriteJson(paths.latestRunPath, runState);

  return paths;
}

export async function writeExecutionPlan({ stateDir = '.symphony', plan }) {
  assertSafeRunId(plan?.planId);

  const paths = symphonyStatePaths({ stateDir, planId: plan.planId });

  await atomicWriteJson(paths.executionPlanPath, plan);

  return paths.executionPlanPath;
}

export async function writeAdoptionPlan({ stateDir = '.symphony', plan }) {
  assertSafeRunId(plan?.adoptionId);

  const paths = symphonyStatePaths({ stateDir, adoptionId: plan.adoptionId });

  await atomicWriteJson(paths.adoptionPlanPath, plan);

  return paths.adoptionPlanPath;
}

export async function atomicWriteJson(path, value) {
  await mkdir(dirname(path), { recursive: true });

  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  const redactedValue = redactSecrets(value);

  await writeFile(temporaryPath, `${JSON.stringify(redactedValue, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, path);
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

async function hashOptionalFile({ hash, root, file }) {
  const path = join(root, file);

  try {
    const content = await readFile(path);

    hash.update(`file\0${file}\0`);
    hash.update(content);
    hash.update('\0');
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'EISDIR') {
      throw error;
    }

    hash.update(`missing\0${file}\0`);
  }
}

async function hashOptionalStat({ hash, root, file }) {
  const path = join(root, file);

  try {
    const metadata = await stat(path);

    hash.update(`stat\0${file}\0${metadata.size}\0${metadata.mtimeMs}\0`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    hash.update(`missing-stat\0${file}\0`);
  }
}

function assertSafeRunId(runId) {
  if (typeof runId !== 'string' || runId.trim() === '' || runId.includes('/') || runId.includes('..')) {
    throw new TypeError('runId must be a safe path segment');
  }
}
