import { readdir, readFile, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { createHash } from 'node:crypto';

import {
  ARTIFACT_INDEX_CONTRACT_NAME,
  ARTIFACT_INDEX_CONTRACT_VERSION
} from './artifact-index-contract.js';

const ARTIFACT_KINDS = Object.freeze([
  'evidence',
  'plan',
  'runbook',
  'fixture',
  'log',
  'artifact',
  'bundle',
  'summary'
]);

const CANONICAL_SOURCE_LOCKED = 'ArtifactStore is canonical, index is derived cache only';

function sha256(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSafeSegment(value) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value);
}

function artifactRefFromPath(taskId, artifactId) {
  return `${taskId}/${artifactId}`;
}

function inferKind(artifact) {
  if (isPlainObject(artifact)) {
    if (artifact.evidenceRef || artifact.evidenceRefs) return 'evidence';
    if (artifact.goalId && artifact.tasks && Array.isArray(artifact.tasks)) return 'runbook';
    if (artifact.contractName && artifact.contractName.startsWith('goal-runbook')) return 'runbook';
    if (artifact.contractName && artifact.contractName.startsWith('goal-progress')) return 'log';
    if (artifact.contractName) return 'fixture';
    if (artifact.kind === 'evidence' || artifact.eventType) return 'evidence';
  }
  return 'artifact';
}

function inferEvidenceKind(artifact) {
  if (isPlainObject(artifact)) {
    if (artifact.actor?.role === 'worker') return 'worker';
    if (artifact.actor?.role === 'reviewer') return 'reviewer';
    if (artifact.actor?.role === 'main-verifier') return 'main-verifier';
    if (artifact.actor?.role === 'release-manager') return 'release-manager';
    if (artifact.evidence_kind) return artifact.evidence_kind;
  }
  return null;
}

function extractGoalId(artifact, taskDirName) {
  if (isPlainObject(artifact) && typeof artifact.goalId === 'string') {
    return artifact.goalId;
  }
  return taskDirName;
}

async function scanArtifactStore(artifactStoreDir) {
  const entries = [];

  let taskDirs;
  try {
    taskDirs = await readdir(artifactStoreDir, { withFileTypes: true });
  } catch {
    return entries;
  }

  for (const taskDirent of taskDirs) {
    if (!taskDirent.isDirectory()) continue;
    if (!isSafeSegment(taskDirent.name)) continue;

    const taskDirPath = join(artifactStoreDir, taskDirent.name);
    let artifactFiles;

    try {
      artifactFiles = await readdir(taskDirPath, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const fileDirent of artifactFiles) {
      if (!fileDirent.isFile()) continue;
      if (!fileDirent.name.endsWith('.json')) continue;

      const artifactId = basename(fileDirent.name, '.json');
      if (!isSafeSegment(artifactId)) continue;

      const filePath = join(taskDirPath, fileDirent.name);
      let content;

      try {
        content = await readFile(filePath, 'utf8');
      } catch {
        continue;
      }

      let artifact;
      try {
        artifact = JSON.parse(content);
      } catch {
        continue;
      }

      let fileStat;
      try {
        fileStat = await stat(filePath);
      } catch {
        fileStat = null;
      }

      const kind = inferKind(artifact);
      const evidenceKind = kind === 'evidence' ? inferEvidenceKind(artifact) : null;
      const goalId = extractGoalId(artifact, taskDirent.name);

      entries.push({
        artifact_ref: artifactRefFromPath(taskDirent.name, artifactId),
        content_hash: sha256(content),
        kind,
        goal_id: goalId,
        task_id: taskDirent.name,
        run_id: isPlainObject(artifact) && typeof artifact.runId === 'string' ? artifact.runId : null,
        job_id: isPlainObject(artifact) && typeof artifact.jobId === 'string' ? artifact.jobId : null,
        evidence_kind: evidenceKind,
        timestamps: {
          created_at: (fileStat?.mtime ?? new Date()).toISOString(),
          indexed_at: new Date().toISOString()
        },
        labels: isPlainObject(artifact) && Array.isArray(artifact.labels) ? artifact.labels : [],
        file_path: filePath
      });
    }
  }

  return entries;
}

async function scanEventRefs(stateDir, goalId) {
  const entries = [];
  const eventsPath = join(stateDir, 'goals', 'events', `${goalId}.ndjson`);

  let content;
  try {
    content = await readFile(eventsPath, 'utf8');
  } catch {
    return entries;
  }

  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim() === '') continue;

    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    if (!isPlainObject(event)) continue;
    if (!Array.isArray(event.evidenceRefs)) continue;

    for (const ref of event.evidenceRefs) {
      if (!isPlainObject(ref) || typeof ref.ref !== 'string') continue;

      entries.push({
        artifact_ref: ref.ref,
        content_hash: null,
        kind: 'evidence',
        goal_id: typeof event.goalId === 'string' ? event.goalId : goalId,
        task_id: typeof event.taskId === 'string' ? event.taskId : null,
        run_id: null,
        job_id: null,
        evidence_kind: event.actor?.role === 'worker' ? 'worker'
          : event.actor?.role === 'reviewer' ? 'reviewer'
          : event.actor?.role === 'main-verifier' ? 'main-verifier'
          : event.actor?.role === 'release-manager' ? 'release-manager'
          : null,
        timestamps: {
          created_at: event.occurredAt ?? event.recordedAt ?? new Date().toISOString(),
          indexed_at: new Date().toISOString()
        },
        labels: [],
        file_path: null
      });
    }
  }

  return entries;
}

export async function buildArtifactIndex({
  artifactStoreDir = null,
  stateDir = '.symphony',
  goalId = 'latest',
  taskId = null,
  generatedAt = new Date().toISOString()
} = {}) {
  const entries = [];

  if (artifactStoreDir !== null && typeof artifactStoreDir === 'string') {
    const storeEntries = await scanArtifactStore(artifactStoreDir);
    entries.push(...storeEntries);
  }

  if (goalId !== 'latest' && typeof goalId === 'string' && isSafeSegment(goalId)) {
    const eventEntries = await scanEventRefs(stateDir, goalId);
    const existingRefs = new Set(entries.map((e) => e.artifact_ref));
    for (const eventEntry of eventEntries) {
      if (!existingRefs.has(eventEntry.artifact_ref)) {
        entries.push(eventEntry);
      }
    }
  }

  return {
    contractName: ARTIFACT_INDEX_CONTRACT_NAME,
    contractVersion: ARTIFACT_INDEX_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      projectId: null,
      goalId,
      taskId,
      runId: null,
      jobId: null,
      sourceContracts: [
        'artifact-store.v1',
        'goal-runbook.v1',
        'goal-next-action.v1',
        'goal-progress-ledger.v1',
        'goal-event-log.v1',
        'action-manifest.v1',
        'action-availability.v1',
        'action-preview.v1',
        'job-model.v1'
      ],
      stateSource: 'explicit-backend-contracts',
      canonicalSource: 'ArtifactStore',
      indexRole: 'derived-cache-and-search-only',
      entryCount: entries.length,
      dataSources: [
        artifactStoreDir !== null ? `artifact-store:${artifactStoreDir}` : null,
        goalId !== 'latest' ? `event-log:${goalId}` : null
      ].filter(Boolean)
    },
    entries,
    boundaries: {
      readOnly: true,
      artifactExecutionAvailable: false,
      shellExecutionAvailable: false,
      modelInvocationAvailable: false,
      arbitraryCommandExecutionAvailable: false,
      arbitraryPathReadAvailable: false,
      gitWriteAvailable: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      publishAvailable: false,
      selfApprovalAvailable: false,
      canonicalSource: CANONICAL_SOURCE_LOCKED,
      secondArtifactStoreAvailable: false,
      artifactDownloadAvailable: false,
      localFileOpenAvailable: false
    }
  };
}

export function validateIndexEntry(entry) {
  const errors = [];

  if (!isPlainObject(entry)) {
    return { ok: false, errors: ['entry must be a plain object'] };
  }

  if (typeof entry.artifact_ref !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u.test(entry.artifact_ref)) {
    errors.push('artifact_ref must be a safe ref');
  }

  if (entry.content_hash !== null) {
    if (typeof entry.content_hash !== 'string' || !/^sha256:[0-9a-f]{64}$/u.test(entry.content_hash)) {
      errors.push('content_hash must be null or a sha256: hex hash');
    }
  }

  if (!ARTIFACT_KINDS.includes(entry.kind)) {
    errors.push(`kind must be one of ${ARTIFACT_KINDS.join(', ')}`);
  }

  if (typeof entry.goal_id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(entry.goal_id)) {
    errors.push('goal_id must be a safe ref');
  }

  if (entry.task_id !== null && (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(entry.task_id))) {
    errors.push('task_id must be null or a safe ref');
  }

  if (entry.run_id !== null && typeof entry.run_id !== 'string') {
    errors.push('run_id must be null or a string');
  }

  if (entry.job_id !== null && typeof entry.job_id !== 'string') {
    errors.push('job_id must be null or a string');
  }

  if (entry.evidence_kind !== null) {
    const evidenceKinds = ['worker', 'reviewer', 'main-verifier', 'release-manager'];
    if (!evidenceKinds.includes(entry.evidence_kind)) {
      errors.push(`evidence_kind must be one of ${evidenceKinds.join(', ')}`);
    }
  }

  if (!isPlainObject(entry.timestamps)) {
    errors.push('timestamps must be a plain object');
  } else {
    if (typeof entry.timestamps.created_at !== 'string' || Number.isNaN(Date.parse(entry.timestamps.created_at))) {
      errors.push('timestamps.created_at must be an ISO timestamp');
    }
    if (typeof entry.timestamps.indexed_at !== 'string' || Number.isNaN(Date.parse(entry.timestamps.indexed_at))) {
      errors.push('timestamps.indexed_at must be an ISO timestamp');
    }
  }

  if (!Array.isArray(entry.labels)) {
    errors.push('labels must be an array');
  }

  if (entry.file_path !== null && typeof entry.file_path !== 'string') {
    errors.push('file_path must be null or a string');
  }

  return { ok: errors.length === 0, errors };
}
