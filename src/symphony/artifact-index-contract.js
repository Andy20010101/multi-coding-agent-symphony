export const ARTIFACT_INDEX_CONTRACT_NAME = 'artifact-index.v1';
export const ARTIFACT_INDEX_CONTRACT_VERSION = 1;

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

const EVIDENCE_KINDS = Object.freeze([
  'worker',
  'reviewer',
  'main-verifier',
  'release-manager'
]);

const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'artifact-store.v1',
  'goal-runbook.v1',
  'goal-progress-ledger.v1',
  'goal-event-log.v1'
]);

const CANONICAL_SOURCE_LOCKED = 'ArtifactStore is canonical, index is derived cache only';

export function buildArtifactIndexContract({
  projectId = null,
  goalId = 'latest',
  taskId = null,
  runId = null,
  jobId = null,
  generatedAt = new Date().toISOString()
} = {}) {
  return assertArtifactIndexContract({
    contractName: ARTIFACT_INDEX_CONTRACT_NAME,
    contractVersion: ARTIFACT_INDEX_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      projectId,
      goalId,
      taskId,
      runId,
      jobId,
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
      indexRole: 'derived-cache-and-search-only'
    },
    indexEntry: buildIndexEntry({
      artifact_ref: 'v36-task-1-worker-evidence-example',
      content_hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      kind: 'evidence',
      goal_id: goalId,
      task_id: taskId ?? 'task-1',
      run_id: runId,
      job_id: jobId,
      evidence_kind: 'worker',
      timestamps: {
        created_at: generatedAt,
        indexed_at: generatedAt
      },
      labels: [],
      file_path: null
    }),
    boundaries: artifactIndexBoundaries()
  });
}

export function validateArtifactIndexContract(model) {
  const errors = [];

  if (!isPlainObject(model)) {
    return { ok: false, errors: ['artifact index must be a plain object'] };
  }

  requireExact(errors, model.contractName, 'contractName', ARTIFACT_INDEX_CONTRACT_NAME);
  requireExact(errors, model.contractVersion, 'contractVersion', ARTIFACT_INDEX_CONTRACT_VERSION);
  requireIsoTimestamp(errors, model.generatedAt, 'generatedAt');
  requireExact(errors, model.readOnly, 'readOnly', true);
  validateContext(errors, model.context);
  validateIndexEntry(errors, model.indexEntry);
  validateBoundaries(errors, model.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertArtifactIndexContract(model) {
  const result = validateArtifactIndexContract(model);

  if (!result.ok) {
    throw new Error(`Invalid artifact index contract: ${result.errors.join('; ')}`);
  }

  return model;
}

function buildIndexEntry({
  artifact_ref,
  content_hash,
  kind,
  goal_id,
  task_id,
  run_id,
  job_id,
  evidence_kind,
  timestamps,
  labels,
  file_path
}) {
  return {
    artifact_ref,
    content_hash,
    kind,
    goal_id,
    task_id,
    run_id,
    job_id,
    evidence_kind,
    timestamps,
    labels,
    file_path
  };
}

function artifactIndexBoundaries() {
  return {
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
  };
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  if (context.projectId !== null) {
    requireSafeRef(errors, context.projectId, 'context.projectId');
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');

  if (context.taskId !== null) {
    requireSafeRef(errors, context.taskId, 'context.taskId');
  }

  if (context.runId !== null) {
    requireSafeRef(errors, context.runId, 'context.runId');
  }

  if (context.jobId !== null) {
    requireSafeRef(errors, context.jobId, 'context.jobId');
  }

  if (!Array.isArray(context.sourceContracts) || context.sourceContracts.length === 0) {
    errors.push('context.sourceContracts must be a non-empty array');
  } else {
    for (const required of REQUIRED_SOURCE_CONTRACTS) {
      if (!context.sourceContracts.includes(required)) {
        errors.push(`context.sourceContracts must include ${required}`);
      }
    }

    context.sourceContracts.forEach((contractName, index) => {
      requireContractName(errors, contractName, `context.sourceContracts[${index}]`);
    });
  }

  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.canonicalSource, 'context.canonicalSource', 'ArtifactStore');
  requireExact(errors, context.indexRole, 'context.indexRole', 'derived-cache-and-search-only');
}

function validateIndexEntry(errors, entry) {
  if (!isPlainObject(entry)) {
    errors.push('indexEntry must be a plain object');
    return;
  }

  requireSafeRef(errors, entry.artifact_ref, 'indexEntry.artifact_ref');
  requireSha256Hash(errors, entry.content_hash, 'indexEntry.content_hash');
  requireEnum(errors, entry.kind, 'indexEntry.kind', ARTIFACT_KINDS);
  requireSafeRef(errors, entry.goal_id, 'indexEntry.goal_id');

  if (entry.task_id !== null) {
    requireSafeRef(errors, entry.task_id, 'indexEntry.task_id');
  }

  if (entry.run_id !== null) {
    requireSafeRef(errors, entry.run_id, 'indexEntry.run_id');
  }

  if (entry.job_id !== null) {
    requireSafeRef(errors, entry.job_id, 'indexEntry.job_id');
  }

  if (entry.evidence_kind !== null) {
    requireEnum(errors, entry.evidence_kind, 'indexEntry.evidence_kind', EVIDENCE_KINDS);
  }

  validateIndexTimestamps(errors, entry.timestamps);

  if (!Array.isArray(entry.labels)) {
    errors.push('indexEntry.labels must be an array');
  }

  if (entry.file_path !== null && typeof entry.file_path !== 'string') {
    errors.push('indexEntry.file_path must be null or a string');
  }
}

function validateIndexTimestamps(errors, timestamps) {
  if (!isPlainObject(timestamps)) {
    errors.push('indexEntry.timestamps must be a plain object');
    return;
  }

  requireIsoTimestamp(errors, timestamps.created_at, 'indexEntry.timestamps.created_at');
  requireIsoTimestamp(errors, timestamps.indexed_at, 'indexEntry.timestamps.indexed_at');
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);

  for (const field of [
    'artifactExecutionAvailable',
    'shellExecutionAvailable',
    'modelInvocationAvailable',
    'arbitraryCommandExecutionAvailable',
    'arbitraryPathReadAvailable',
    'gitWriteAvailable',
    'mergeAvailable',
    'pushAvailable',
    'tagAvailable',
    'publishAvailable',
    'selfApprovalAvailable',
    'secondArtifactStoreAvailable',
    'artifactDownloadAvailable',
    'localFileOpenAvailable'
  ]) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }

  requireExact(errors, boundaries.canonicalSource, 'boundaries.canonicalSource', CANONICAL_SOURCE_LOCKED);
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireEnum(errors, value, path, allowed) {
  if (!allowed.includes(value)) {
    errors.push(`${path} must be one of ${allowed.join(', ')}`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireSafeRef(errors, value, path) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value)) {
    errors.push(`${path} must be a safe ref`);
  }
}

function requireSha256Hash(errors, value, path) {
  if (typeof value !== 'string' || !/^sha256:[0-9a-f]{64}$/u.test(value)) {
    errors.push(`${path} must be a sha256: hex hash`);
  }
}

function requireContractName(errors, value, path) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*(?:\.v[0-9]+)$/u.test(value)) {
    errors.push(`${path} must be a contract name ending in .v<number>`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
