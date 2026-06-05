import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';

import { buildArtifactIndex } from './artifact-indexer.js';
import { resolveGoalRunbookGoalId } from './goal-runbook-context.js';

export const APP_CORE_BACKUP_EXPORT_CONTRACT_NAME = 'app-core-backup-export.v1';
export const APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION = 1;

const MANAGED_STATE_SCANS = Object.freeze([
  Object.freeze({ dir: 'context', extensions: Object.freeze(['.json']), kind: 'context-pointer' }),
  Object.freeze({ dir: 'runs', extensions: Object.freeze(['.json']), kind: 'run-state' }),
  Object.freeze({ dir: join('goals', 'runbooks'), extensions: Object.freeze(['.json']), kind: 'goal-runbook-state' }),
  Object.freeze({ dir: join('goals', 'events'), extensions: Object.freeze(['.ndjson']), kind: 'goal-event-journal' }),
  Object.freeze({ dir: 'plans', extensions: Object.freeze(['.json']), kind: 'execution-plan' }),
  Object.freeze({ dir: 'adoptions', extensions: Object.freeze(['.json']), kind: 'adoption-state' }),
  Object.freeze({ dir: 'stages', extensions: Object.freeze(['.json']), kind: 'stage-state' })
]);
const EXCLUDED_REPO_CONTENT = Object.freeze([
  Object.freeze({ ref: 'src/', reason: 'repo source is not copied into app core backup manifest' }),
  Object.freeze({ ref: 'frontend/', reason: 'Workbench source is rebuilt from git, not backup state' }),
  Object.freeze({ ref: 'tests/', reason: 'test sources are not app runtime state' }),
  Object.freeze({ ref: 'docs/', reason: 'repo docs may be referenced by evidence refs but are not copied' }),
  Object.freeze({ ref: '.git/', reason: 'git object database is outside app backup bundle scope' }),
  Object.freeze({ ref: 'package.json', reason: 'repo manifest is source metadata, not app core runtime state' }),
  Object.freeze({ ref: 'pnpm-lock.yaml', reason: 'dependency lockfile is source metadata, not app core runtime state' })
]);
const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'project-registry.v1',
  'current-project-resolver.v1',
  'app-state-snapshot.v1',
  'goal-runbook.v1',
  'goal-next-action.v1',
  'goal-progress-ledger.v1',
  'goal-event-log.v1',
  'artifact-index.v1',
  'evidence-bundle.v1'
]);
const FALSE_BOUNDARY_FIELDS = Object.freeze([
  'writesBundleFile',
  'copiesRepoContent',
  'includesRepoSourcePayloads',
  'includesGitObjectDatabase',
  'artifactDownloadAvailable',
  'localFileOpenAvailable',
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
  'releaseDecisionAvailable'
]);

export async function buildAppCoreBackupExport({
  cwd = process.cwd(),
  stateDir = '.symphony',
  goalId = 'latest',
  taskId = null,
  generatedAt = new Date().toISOString()
} = {}) {
  assertSafeContextRef(goalId, 'goalId');
  if (taskId !== null) {
    assertSafeContextRef(taskId, 'taskId');
  }

  const resolvedGoalId = await resolveBackupGoalId({ stateDir, goalId });
  const [stateEntries, artifactIndex] = await Promise.all([
    collectManagedStateEntries({ stateDir, generatedAt }),
    buildArtifactIndex({
      artifactStoreDir: join(stateDir, 'artifacts'),
      stateDir,
      goalId: resolvedGoalId,
      taskId,
      generatedAt
    })
  ]);
  const artifactRefs = artifactIndex.entries.map((entry) => ({
    artifact_ref: entry.artifact_ref,
    content_hash: entry.content_hash,
    kind: entry.kind,
    goal_id: entry.goal_id,
    task_id: entry.task_id,
    run_id: entry.run_id,
    job_id: entry.job_id,
    copyPolicy: 'ref-and-hash-only'
  }));
  const manifestPayload = {
    contractName: APP_CORE_BACKUP_EXPORT_CONTRACT_NAME,
    contractVersion: APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION,
    context: {
      goalId,
      resolvedGoalId,
      taskId,
      stateSource: 'explicit-backend-contracts',
      sourceContracts: [...REQUIRED_SOURCE_CONTRACTS]
    },
    manifest: {
      managedStateEntries: stateEntries,
      artifactRefs,
      excludedRepoContent: [...EXCLUDED_REPO_CONTENT]
    }
  };

  const manifestHash = sha256(canonicalJson(manifestPayload));

  return {
    contractName: APP_CORE_BACKUP_EXPORT_CONTRACT_NAME,
    contractVersion: APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      resolvedGoalId,
      taskId,
      cwdRef: basename(cwd),
      sourceContracts: [...REQUIRED_SOURCE_CONTRACTS],
      stateSource: 'explicit-backend-contracts',
      exportRole: 'manifest-hash-and-refs-only',
      canonicalArtifactSource: 'ArtifactStore'
    },
    manifest: {
      manifestHash,
      managedStateEntryCount: stateEntries.length,
      artifactRefCount: artifactRefs.length,
      includedByteCount: stateEntries.reduce((sum, entry) => sum + entry.byteSize, 0),
      managedStateEntries: stateEntries,
      artifactRefs,
      excludedRepoContent: [...EXCLUDED_REPO_CONTENT]
    },
    boundaries: {
      readOnly: true,
      writesBundleFile: false,
      copiesRepoContent: false,
      includesRepoSourcePayloads: false,
      includesGitObjectDatabase: false,
      artifactDownloadAvailable: false,
      localFileOpenAvailable: false,
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
      releaseDecisionAvailable: false,
      exportPayloadPolicy: 'manifest-hash-and-refs-only',
      repoContentPolicy: 'excluded'
    }
  };
}

export function validateAppCoreBackupExportContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  if (contract.contractName !== APP_CORE_BACKUP_EXPORT_CONTRACT_NAME) {
    errors.push(`contractName must be ${APP_CORE_BACKUP_EXPORT_CONTRACT_NAME}`);
  }

  if (contract.contractVersion !== APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION) {
    errors.push(`contractVersion must be ${APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION}`);
  }

  if (typeof contract.generatedAt !== 'string' || Number.isNaN(Date.parse(contract.generatedAt))) {
    errors.push('generatedAt must be an ISO timestamp');
  }

  if (contract.readOnly !== true) {
    errors.push('readOnly must be true');
  }

  validateContext(contract.context, errors);
  validateManifest(contract.manifest, errors);
  validateBoundaries(contract.boundaries, errors);

  return { ok: errors.length === 0, errors };
}

export function assertAppCoreBackupExportContract(contract) {
  const result = validateAppCoreBackupExportContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid app core backup export contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

export function renderAppCoreBackupExportText(contract) {
  return [
    `App core backup export: ${contract.context?.goalId ?? 'unknown'}`,
    `resolved goal: ${contract.context?.resolvedGoalId ?? 'unknown'}`,
    `manifest hash: ${contract.manifest?.manifestHash ?? 'missing'}`,
    `managed state entries: ${contract.manifest?.managedStateEntryCount ?? 0}`,
    `artifact refs: ${contract.manifest?.artifactRefCount ?? 0}`,
    'payload policy: manifest/hash/refs only; repo source content is excluded'
  ].join('\n') + '\n';
}

async function resolveBackupGoalId({ stateDir, goalId }) {
  if (goalId !== 'latest') {
    return goalId;
  }

  try {
    return await resolveGoalRunbookGoalId({ stateDir, goalId }) ?? 'latest';
  } catch {
    return 'latest';
  }
}

async function collectManagedStateEntries({ stateDir, generatedAt }) {
  const entries = [];

  for (const scan of MANAGED_STATE_SCANS) {
    entries.push(...await collectManagedStateDirectory({
      stateDir,
      scan,
      generatedAt
    }));
  }

  return entries.sort((a, b) => a.ref.localeCompare(b.ref));
}

async function collectManagedStateDirectory({ stateDir, scan, generatedAt }) {
  const dir = join(stateDir, scan.dir);
  let dirents;

  try {
    dirents = await readdir(dir, { withFileTypes: true });
  } catch {
    return [{
      ref: normalizeRef(scan.dir),
      kind: scan.kind,
      present: false,
      content_hash: null,
      byteSize: 0,
      modifiedAt: null,
      scannedAt: generatedAt,
      copyPolicy: 'missing-managed-state-ref'
    }];
  }

  const entries = [];
  for (const dirent of dirents) {
    if (!dirent.isFile()) {
      continue;
    }

    if (!scan.extensions.some((extension) => dirent.name.endsWith(extension))) {
      continue;
    }

    if (!isSafeManagedFileName(dirent.name)) {
      continue;
    }

    const path = join(dir, dirent.name);
    let metadata;
    let content;

    try {
      metadata = await lstat(path);
      if (!metadata.isFile()) {
        continue;
      }
      content = await readFile(path);
    } catch {
      continue;
    }

    entries.push({
      ref: normalizeRef(join(scan.dir, dirent.name)),
      kind: scan.kind,
      present: true,
      content_hash: sha256(content),
      byteSize: metadata.size,
      modifiedAt: metadata.mtime.toISOString(),
      scannedAt: generatedAt,
      copyPolicy: 'hash-only-managed-state'
    });
  }

  return entries;
}

function validateContext(context, errors) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  for (const field of ['goalId', 'resolvedGoalId']) {
    if (typeof context[field] !== 'string' || context[field].trim() === '') {
      errors.push(`context.${field} must be a non-empty string`);
    }
  }

  if (!Array.isArray(context.sourceContracts)) {
    errors.push('context.sourceContracts must be an array');
  } else {
    for (const required of REQUIRED_SOURCE_CONTRACTS) {
      if (!context.sourceContracts.includes(required)) {
        errors.push(`context.sourceContracts must include ${required}`);
      }
    }
  }

  if (context.exportRole !== 'manifest-hash-and-refs-only') {
    errors.push('context.exportRole must be manifest-hash-and-refs-only');
  }

  if (context.canonicalArtifactSource !== 'ArtifactStore') {
    errors.push('context.canonicalArtifactSource must be ArtifactStore');
  }
}

function validateManifest(manifest, errors) {
  if (!isPlainObject(manifest)) {
    errors.push('manifest must be a plain object');
    return;
  }

  if (!isSha256(manifest.manifestHash)) {
    errors.push('manifest.manifestHash must be a sha256: hex hash');
  }

  if (!Array.isArray(manifest.managedStateEntries)) {
    errors.push('manifest.managedStateEntries must be an array');
  } else {
    for (const [index, entry] of manifest.managedStateEntries.entries()) {
      validateManagedStateEntry(entry, errors, `manifest.managedStateEntries[${index}]`);
    }
  }

  if (!Array.isArray(manifest.artifactRefs)) {
    errors.push('manifest.artifactRefs must be an array');
  }

  if (!Array.isArray(manifest.excludedRepoContent) || manifest.excludedRepoContent.length === 0) {
    errors.push('manifest.excludedRepoContent must be a non-empty array');
  }
}

function validateManagedStateEntry(entry, errors, prefix) {
  if (!isPlainObject(entry)) {
    errors.push(`${prefix} must be a plain object`);
    return;
  }

  if (!isSafeManagedRef(entry.ref)) {
    errors.push(`${prefix}.ref must be a managed state ref`);
  }

  if (entry.present !== true && entry.present !== false) {
    errors.push(`${prefix}.present must be boolean`);
  }

  if (entry.content_hash !== null && !isSha256(entry.content_hash)) {
    errors.push(`${prefix}.content_hash must be null or a sha256: hex hash`);
  }

  if (!Number.isInteger(entry.byteSize) || entry.byteSize < 0) {
    errors.push(`${prefix}.byteSize must be a non-negative integer`);
  }

  if (!['hash-only-managed-state', 'missing-managed-state-ref'].includes(entry.copyPolicy)) {
    errors.push(`${prefix}.copyPolicy must be hash-only-managed-state or missing-managed-state-ref`);
  }
}

function validateBoundaries(boundaries, errors) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  if (boundaries.readOnly !== true) {
    errors.push('boundaries.readOnly must be true');
  }

  for (const field of FALSE_BOUNDARY_FIELDS) {
    if (boundaries[field] !== false) {
      errors.push(`boundaries.${field} must be false`);
    }
  }

  if (boundaries.exportPayloadPolicy !== 'manifest-hash-and-refs-only') {
    errors.push('boundaries.exportPayloadPolicy must be manifest-hash-and-refs-only');
  }

  if (boundaries.repoContentPolicy !== 'excluded') {
    errors.push('boundaries.repoContentPolicy must be excluded');
  }
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  }

  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function sha256(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

function isSha256(value) {
  return typeof value === 'string' && /^sha256:[0-9a-f]{64}$/u.test(value);
}

function isSafeManagedFileName(value) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*\.(json|ndjson)$/u.test(value);
}

function isSafeManagedRef(value) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._/-]*$/u.test(value) && !value.includes('..');
}

function assertSafeContextRef(value, field) {
  if (typeof value !== 'string' || value === '' || value.includes('/') || value.includes('\\') || value.includes('..')) {
    throw new Error(`${field} must be a safe ref`);
  }
}

function normalizeRef(value) {
  return value.split('\\').join('/');
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
