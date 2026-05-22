import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

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

export function symphonyStatePaths({ stateDir = '.symphony', runId } = {}) {
  return {
    stateDir,
    latestContextPath: join(stateDir, 'context', 'latest.json'),
    latestRunPath: join(stateDir, 'runs', 'latest.json'),
    ...(runId ? { runPath: join(stateDir, 'runs', `${runId}.json`) } : {})
  };
}

export async function buildProjectFingerprint({ projectDir = '.' } = {}) {
  const root = resolve(projectDir);
  const hash = createHash('sha256');

  hash.update(`root\0${root}\0`);

  for (const file of FINGERPRINT_FILES) {
    await hashOptionalFile({ hash, root, file });
  }

  await hashOptionalFile({ hash, root, file: join('.git', 'HEAD') });
  await hashOptionalStat({ hash, root, file: join('.git', 'index') });

  return `sha256:${hash.digest('hex')}`;
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
