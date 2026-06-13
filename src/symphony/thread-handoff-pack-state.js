import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import {
  validateCheckpointSnapshotContract,
  validateThreadHandoffPackContract
} from './thread-handoff-pack-contracts.js';

export const THREAD_HANDOFF_CHECKPOINT_ARTIFACT_WRITE_CONTRACT_NAME =
  'threadHandoffCheckpointArtifactWrite.v1';
export const THREAD_HANDOFF_CHECKPOINT_ARTIFACT_WRITE_CONTRACT_VERSION = 1;

const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const UNSAFE_TEXT_PATTERN =
  /\b(?:raw[\s_-]*(?:transcript|model[\s_-]*output)|provider[\s_-]*(?:output|session|payload)|session[\s_-]*(?:log|file|path)|local[\s_-]*(?:jsonl|session)|goal[\s_-]*ledger(?:[\s_-]*internals?)?)\b|(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\.jsonl(?:$|[/\s])|\/(?:event-append|append-event|event-plan-confirm|confirm-event-plan|confirm-goal-event-plan|goal-event-confirm|record-result|mark-complete|complete-task|git|tag|publish|release)(?:$|[/\s])|\b(?:append\s+event|mark\s+complete|confirm\s+reviewer\s+verdict|confirm\s+main\s+gate|confirm\s+release\s+gate|record\s+result|git\s+(?:push|tag|checkout|merge|commit)|gh\s+release|tag\s+creation|github\s+release|publish\s+release)\b/iu;

export class ThreadHandoffPackStateError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ThreadHandoffPackStateError';
    this.code = code;
    this.details = details;
  }
}

export async function writeThreadHandoffCheckpointSnapshot({
  stateDir = '.symphony',
  pack,
  writeJsonFile = writeJsonFileDefault
} = {}) {
  const validation = validateThreadHandoffPackContract(pack);

  if (!validation.ok) {
    throw new ThreadHandoffPackStateError(
      'invalid-thread-handoff-pack',
      'Checkpoint snapshot artifact requires a valid thread handoff pack.',
      { reason: validation.errors[0] }
    );
  }

  const snapshot = pack.checkpointRef;
  const snapshotValidation = validateCheckpointSnapshotContract(snapshot);

  if (!snapshotValidation.ok) {
    throw new ThreadHandoffPackStateError(
      'invalid-checkpoint-snapshot',
      'Checkpoint snapshot artifact requires a valid checkpointSnapshot.v1 contract.',
      { reason: snapshotValidation.errors[0] }
    );
  }

  const unsafeField = findUnsafeCheckpointArtifactField(snapshot, 'checkpointSnapshot');

  if (unsafeField !== null) {
    throw new ThreadHandoffPackStateError(
      'unsafe-checkpoint-snapshot',
      'Checkpoint snapshot artifact must not contain raw provider output, local session refs, or mutation routes.',
      { reason: `${unsafeField} is unsafe` }
    );
  }

  const artifactPath = getThreadHandoffCheckpointSnapshotPath({
    stateDir,
    goalId: pack.goal.goalId,
    snapshotId: snapshot.snapshotId
  });
  const artifact = {
    ...snapshot,
    artifactWrite: {
      contractName: THREAD_HANDOFF_CHECKPOINT_ARTIFACT_WRITE_CONTRACT_NAME,
      contractVersion: THREAD_HANDOFF_CHECKPOINT_ARTIFACT_WRITE_CONTRACT_VERSION,
      readOnlySource: true,
      willMutateGoalState: false,
      writesGoalEventLog: false,
      writesTaskCompletion: false,
      createsProviderThread: false,
      createsWorktree: false,
      createsGitRef: false,
      createsRelease: false,
      storage: 'managed-checkpoint-snapshot-artifact'
    }
  };

  await writeJsonFile(artifactPath, artifact);

  return {
    contractName: THREAD_HANDOFF_CHECKPOINT_ARTIFACT_WRITE_CONTRACT_NAME,
    contractVersion: THREAD_HANDOFF_CHECKPOINT_ARTIFACT_WRITE_CONTRACT_VERSION,
    snapshotId: snapshot.snapshotId,
    path: artifactPath,
    checkpointSnapshot: artifact,
    artifactRef: {
      kind: 'artifact-ref',
      ref: `checkpoint-snapshot:${safePathToken(pack.goal.goalId)}:${safePathToken(snapshot.snapshotId)}`,
      label: 'Checkpoint snapshot artifact'
    },
    boundaries: {
      writesGoalEventLog: false,
      writesTaskCompletion: false,
      createsProviderThread: false,
      createsWorktree: false,
      gitMutationAvailable: false,
      tagAutomationAvailable: false,
      publishAutomationAvailable: false,
      githubReleaseAutomationAvailable: false
    }
  };
}

export async function readThreadHandoffCheckpointSnapshot({
  stateDir = '.symphony',
  goalId,
  snapshotId
} = {}) {
  const artifactPath = getThreadHandoffCheckpointSnapshotPath({
    stateDir,
    goalId,
    snapshotId
  });
  const raw = await readFile(artifactPath, 'utf8');

  return JSON.parse(raw);
}

export function getThreadHandoffCheckpointSnapshotPath({
  stateDir = '.symphony',
  goalId,
  snapshotId
} = {}) {
  assertSafeStateDir(stateDir);

  return join(
    stateDir,
    'goals',
    'thread-handoff-checkpoints',
    safePathToken(goalId),
    `${safePathToken(snapshotId)}.json`
  );
}

async function writeJsonFileDefault(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function safePathToken(value) {
  if (typeof value !== 'string' || !SAFE_TOKEN_PATTERN.test(value)) {
    throw new ThreadHandoffPackStateError(
      'unsafe-checkpoint-path-token',
      'Checkpoint snapshot artifact path token is unsafe.'
    );
  }

  if (value.includes('/') || value.includes('\\') || value === '.' || value === '..') {
    throw new ThreadHandoffPackStateError(
      'unsafe-checkpoint-path-token',
      'Checkpoint snapshot artifact path token is unsafe.'
    );
  }

  return value;
}

function assertSafeStateDir(stateDir) {
  if (typeof stateDir !== 'string' || stateDir.trim() === '') {
    throw new ThreadHandoffPackStateError(
      'invalid-state-dir',
      'stateDir must be a non-empty string.'
    );
  }

  if (/[\x00-\x1F\x7F]/u.test(stateDir)) {
    throw new ThreadHandoffPackStateError(
      'invalid-state-dir',
      'stateDir must not contain control characters.'
    );
  }
}

function findUnsafeCheckpointArtifactField(value, path, seen = new Set()) {
  if (typeof value === 'string') {
    return UNSAFE_TEXT_PATTERN.test(value) ? path : null;
  }

  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      const unsafe = findUnsafeCheckpointArtifactField(entry, `${path}[${index}]`, seen);

      if (unsafe !== null) {
        return unsafe;
      }
    }

    return null;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  if (seen.has(value)) {
    return null;
  }

  seen.add(value);

  for (const [key, entry] of Object.entries(value)) {
    const fieldPath = `${path}.${key}`;

    if (/^(?:rawTranscript|transcript|rawModelOutput|rawOutput|providerOutput|providerPayload|sessionLog|sessionPath|messages|conversation|goalLedgerInternals)$/iu.test(key)) {
      return fieldPath;
    }

    const unsafe = findUnsafeCheckpointArtifactField(entry, fieldPath, seen);

    if (unsafe !== null) {
      return unsafe;
    }
  }

  return null;
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}
