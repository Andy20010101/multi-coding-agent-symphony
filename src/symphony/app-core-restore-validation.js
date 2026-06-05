import { basename } from 'node:path';

import {
  APP_CORE_BACKUP_EXPORT_CONTRACT_NAME,
  APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION,
  buildAppCoreBackupExport,
  validateAppCoreBackupExportContract
} from './app-core-backup-export.js';
import { resolveGoalRunbookGoalId } from './goal-runbook-context.js';

export const APP_CORE_RESTORE_VALIDATION_CONTRACT_NAME = 'app-core-restore-validation.v1';
export const APP_CORE_RESTORE_VALIDATION_CONTRACT_VERSION = 1;

const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'app-core-backup-export.v1',
  'goal-runbook.v1',
  'goal-next-action.v1',
  'goal-progress-ledger.v1',
  'goal-event-log.v1',
  'artifact-index.v1'
]);
const FALSE_BOUNDARY_FIELDS = Object.freeze([
  'overwritesExistingData',
  'writesManagedState',
  'appliesRestore',
  'readsArbitraryBundlePath',
  'writesBundleFile',
  'copiesRepoContent',
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

export async function buildAppCoreRestoreValidation({
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

  const resolvedGoalId = await resolveRestoreGoalId({ stateDir, goalId });
  const backupExport = await buildAppCoreBackupExport({
    cwd,
    stateDir,
    goalId,
    taskId,
    generatedAt
  });
  const backupValidation = validateAppCoreBackupExportContract(backupExport);
  const integrity = buildIntegrityValidation({ backupExport, backupValidation });
  const compatibility = buildCompatibilityValidation({ backupExport, backupValidation });
  const status = validationStatus({ integrity, compatibility });

  return assertAppCoreRestoreValidationContract({
    contractName: APP_CORE_RESTORE_VALIDATION_CONTRACT_NAME,
    contractVersion: APP_CORE_RESTORE_VALIDATION_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      resolvedGoalId,
      taskId,
      cwdRef: basename(cwd),
      sourceContracts: [...REQUIRED_SOURCE_CONTRACTS],
      stateSource: 'explicit-backend-contracts',
      restoreRole: 'validate-only-no-overwrite'
    },
    sourceBundle: {
      contractName: backupExport.contractName,
      contractVersion: backupExport.contractVersion,
      manifestHash: backupExport.manifest.manifestHash,
      managedStateEntryCount: backupExport.manifest.managedStateEntryCount,
      artifactRefCount: backupExport.manifest.artifactRefCount,
      includedByteCount: backupExport.manifest.includedByteCount,
      exportPayloadPolicy: backupExport.boundaries.exportPayloadPolicy,
      repoContentPolicy: backupExport.boundaries.repoContentPolicy
    },
    integrity,
    compatibility,
    boundaries: {
      readOnly: true,
      validationOnly: true,
      requiresExplicitConfirmForApply: true,
      confirmRestoreAvailable: false,
      overwritesExistingData: false,
      writesManagedState: false,
      appliesRestore: false,
      readsArbitraryBundlePath: false,
      writesBundleFile: false,
      copiesRepoContent: false,
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
      restorePayloadPolicy: 'manifest-hash-and-refs-only',
      restoreMode: 'validate-only'
    },
    status
  });
}

export function validateAppCoreRestoreValidationContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  if (contract.contractName !== APP_CORE_RESTORE_VALIDATION_CONTRACT_NAME) {
    errors.push(`contractName must be ${APP_CORE_RESTORE_VALIDATION_CONTRACT_NAME}`);
  }

  if (contract.contractVersion !== APP_CORE_RESTORE_VALIDATION_CONTRACT_VERSION) {
    errors.push(`contractVersion must be ${APP_CORE_RESTORE_VALIDATION_CONTRACT_VERSION}`);
  }

  if (typeof contract.generatedAt !== 'string' || Number.isNaN(Date.parse(contract.generatedAt))) {
    errors.push('generatedAt must be an ISO timestamp');
  }

  if (contract.readOnly !== true) {
    errors.push('readOnly must be true');
  }

  validateContext(errors, contract.context);
  validateSourceBundle(errors, contract.sourceBundle);
  validateIntegrity(errors, contract.integrity);
  validateCompatibility(errors, contract.compatibility);
  validateBoundaries(errors, contract.boundaries);

  if (!['valid', 'warning', 'invalid'].includes(contract.status)) {
    errors.push('status must be valid, warning, or invalid');
  }

  return { ok: errors.length === 0, errors };
}

export function assertAppCoreRestoreValidationContract(contract) {
  const result = validateAppCoreRestoreValidationContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid app core restore validation contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

export function renderAppCoreRestoreValidationText(contract) {
  return [
    `App core restore validation: ${contract.context?.goalId ?? 'unknown'}`,
    `resolved goal: ${contract.context?.resolvedGoalId ?? 'unknown'}`,
    `status: ${contract.status ?? 'unknown'}`,
    `manifest hash: ${contract.sourceBundle?.manifestHash ?? 'missing'}`,
    `integrity: ${contract.integrity?.status ?? 'unknown'}`,
    `compatibility: ${contract.compatibility?.status ?? 'unknown'}`,
    'restore mode: validate-only; existing data is not overwritten'
  ].join('\n') + '\n';
}

async function resolveRestoreGoalId({ stateDir, goalId }) {
  if (goalId !== 'latest') {
    return goalId;
  }

  try {
    return await resolveGoalRunbookGoalId({ stateDir, goalId }) ?? 'latest';
  } catch {
    return 'latest';
  }
}

function buildIntegrityValidation({ backupExport, backupValidation }) {
  const entries = Array.isArray(backupExport.manifest?.managedStateEntries)
    ? backupExport.manifest.managedStateEntries
    : [];
  const artifactRefs = Array.isArray(backupExport.manifest?.artifactRefs)
    ? backupExport.manifest.artifactRefs
    : [];
  const missingRefs = entries
    .filter((entry) => entry.present === false)
    .map((entry) => entry.ref);
  const hashedEntries = entries.filter((entry) => entry.present === true && isSha256(entry.content_hash));
  const artifactHashFailures = artifactRefs.filter((entry) => !isSha256(entry.content_hash) || !isSafeManagedRef(entry.artifact_ref));
  const checks = [
    {
      id: 'backup-contract-shape',
      status: backupValidation.ok ? 'passed' : 'failed',
      message: backupValidation.ok
        ? 'Backup export contract validates.'
        : `Backup export contract errors: ${backupValidation.errors.join('; ')}`
    },
    {
      id: 'manifest-hash',
      status: isSha256(backupExport.manifest?.manifestHash) ? 'passed' : 'failed',
      message: 'Manifest hash uses sha256 format.'
    },
    {
      id: 'managed-state-hashes',
      status: hashedEntries.length === entries.filter((entry) => entry.present === true).length ? 'passed' : 'failed',
      message: 'Present managed state entries have sha256 hashes.'
    },
    {
      id: 'artifact-ref-hashes',
      status: artifactHashFailures.length === 0 ? 'passed' : 'failed',
      message: 'Artifact refs use safe refs and sha256 hashes.'
    }
  ];

  if (missingRefs.length > 0) {
    checks.push({
      id: 'missing-managed-state-refs',
      status: 'warning',
      message: 'Some managed state refs are absent in the current app state.'
    });
  }

  const hasFailedCheck = checks.some((check) => check.status === 'failed');

  return {
    status: hasFailedCheck ? 'invalid' : missingRefs.length > 0 ? 'warning' : 'ok',
    manifestHashValid: isSha256(backupExport.manifest?.manifestHash),
    backupContractValid: backupValidation.ok,
    managedStateEntryCount: entries.length,
    presentManagedStateCount: entries.filter((entry) => entry.present === true).length,
    hashedManagedStateEntryCount: hashedEntries.length,
    missingManagedStateRefs: missingRefs,
    artifactRefCount: artifactRefs.length,
    artifactRefsValid: artifactHashFailures.length === 0,
    checks
  };
}

function buildCompatibilityValidation({ backupExport, backupValidation }) {
  const blockers = [];
  const warnings = [];

  if (!backupValidation.ok) {
    blockers.push({
      code: 'invalid-backup-contract',
      message: 'Backup export contract validation failed.'
    });
  }

  if (backupExport.contractName !== APP_CORE_BACKUP_EXPORT_CONTRACT_NAME) {
    blockers.push({
      code: 'unsupported-backup-contract',
      message: `Expected ${APP_CORE_BACKUP_EXPORT_CONTRACT_NAME}.`
    });
  }

  if (backupExport.contractVersion !== APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION) {
    blockers.push({
      code: 'unsupported-backup-version',
      message: `Expected backup contract version ${APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION}.`
    });
  }

  if (backupExport.readOnly !== true || backupExport.boundaries?.repoContentPolicy !== 'excluded') {
    blockers.push({
      code: 'unsafe-backup-boundary',
      message: 'Backup export must be read-only with repo content excluded.'
    });
  }

  if (backupExport.boundaries?.exportPayloadPolicy !== 'manifest-hash-and-refs-only') {
    blockers.push({
      code: 'unsupported-payload-policy',
      message: 'Restore validation supports manifest/hash/refs-only backup exports.'
    });
  }

  if (Array.isArray(backupExport.manifest?.managedStateEntries) && backupExport.manifest.managedStateEntries.some((entry) => entry.present === false)) {
    warnings.push({
      code: 'missing-managed-state-ref',
      message: 'Validation can continue, but a future restore apply would need an explicit recovery plan for missing managed state refs.'
    });
  }

  return {
    status: blockers.length > 0 ? 'incompatible' : warnings.length > 0 ? 'compatible-with-warnings' : 'compatible',
    supportedBackupContractName: APP_CORE_BACKUP_EXPORT_CONTRACT_NAME,
    supportedBackupContractVersion: APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION,
    candidateContractName: backupExport.contractName,
    candidateContractVersion: backupExport.contractVersion,
    compatibleRestorePath: 'validate-only-managed-state-refs',
    overwriteDefault: false,
    blockers,
    warnings
  };
}

function validationStatus({ integrity, compatibility }) {
  if (integrity.status === 'invalid' || compatibility.status === 'incompatible') {
    return 'invalid';
  }

  if (integrity.status === 'warning' || compatibility.status === 'compatible-with-warnings') {
    return 'warning';
  }

  return 'valid';
}

function validateContext(errors, context) {
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

  if (context.restoreRole !== 'validate-only-no-overwrite') {
    errors.push('context.restoreRole must be validate-only-no-overwrite');
  }
}

function validateSourceBundle(errors, sourceBundle) {
  if (!isPlainObject(sourceBundle)) {
    errors.push('sourceBundle must be a plain object');
    return;
  }

  if (sourceBundle.contractName !== APP_CORE_BACKUP_EXPORT_CONTRACT_NAME) {
    errors.push(`sourceBundle.contractName must be ${APP_CORE_BACKUP_EXPORT_CONTRACT_NAME}`);
  }

  if (sourceBundle.contractVersion !== APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION) {
    errors.push(`sourceBundle.contractVersion must be ${APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION}`);
  }

  if (!isSha256(sourceBundle.manifestHash)) {
    errors.push('sourceBundle.manifestHash must be a sha256: hex hash');
  }

  for (const field of ['managedStateEntryCount', 'artifactRefCount', 'includedByteCount']) {
    if (!Number.isInteger(sourceBundle[field]) || sourceBundle[field] < 0) {
      errors.push(`sourceBundle.${field} must be a non-negative integer`);
    }
  }

  if (sourceBundle.exportPayloadPolicy !== 'manifest-hash-and-refs-only') {
    errors.push('sourceBundle.exportPayloadPolicy must be manifest-hash-and-refs-only');
  }

  if (sourceBundle.repoContentPolicy !== 'excluded') {
    errors.push('sourceBundle.repoContentPolicy must be excluded');
  }
}

function validateIntegrity(errors, integrity) {
  if (!isPlainObject(integrity)) {
    errors.push('integrity must be a plain object');
    return;
  }

  if (!['ok', 'warning', 'invalid'].includes(integrity.status)) {
    errors.push('integrity.status must be ok, warning, or invalid');
  }

  for (const field of ['manifestHashValid', 'backupContractValid', 'artifactRefsValid']) {
    if (typeof integrity[field] !== 'boolean') {
      errors.push(`integrity.${field} must be boolean`);
    }
  }

  for (const field of ['managedStateEntryCount', 'presentManagedStateCount', 'hashedManagedStateEntryCount', 'artifactRefCount']) {
    if (!Number.isInteger(integrity[field]) || integrity[field] < 0) {
      errors.push(`integrity.${field} must be a non-negative integer`);
    }
  }

  if (!Array.isArray(integrity.missingManagedStateRefs)) {
    errors.push('integrity.missingManagedStateRefs must be an array');
  }

  if (!Array.isArray(integrity.checks) || integrity.checks.length === 0) {
    errors.push('integrity.checks must be a non-empty array');
  }
}

function validateCompatibility(errors, compatibility) {
  if (!isPlainObject(compatibility)) {
    errors.push('compatibility must be a plain object');
    return;
  }

  if (!['compatible', 'compatible-with-warnings', 'incompatible'].includes(compatibility.status)) {
    errors.push('compatibility.status must be compatible, compatible-with-warnings, or incompatible');
  }

  if (compatibility.supportedBackupContractName !== APP_CORE_BACKUP_EXPORT_CONTRACT_NAME) {
    errors.push(`compatibility.supportedBackupContractName must be ${APP_CORE_BACKUP_EXPORT_CONTRACT_NAME}`);
  }

  if (compatibility.supportedBackupContractVersion !== APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION) {
    errors.push(`compatibility.supportedBackupContractVersion must be ${APP_CORE_BACKUP_EXPORT_CONTRACT_VERSION}`);
  }

  if (compatibility.compatibleRestorePath !== 'validate-only-managed-state-refs') {
    errors.push('compatibility.compatibleRestorePath must be validate-only-managed-state-refs');
  }

  if (compatibility.overwriteDefault !== false) {
    errors.push('compatibility.overwriteDefault must be false');
  }

  if (!Array.isArray(compatibility.blockers)) {
    errors.push('compatibility.blockers must be an array');
  }

  if (!Array.isArray(compatibility.warnings)) {
    errors.push('compatibility.warnings must be an array');
  }
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  if (boundaries.readOnly !== true) {
    errors.push('boundaries.readOnly must be true');
  }

  if (boundaries.validationOnly !== true) {
    errors.push('boundaries.validationOnly must be true');
  }

  if (boundaries.requiresExplicitConfirmForApply !== true) {
    errors.push('boundaries.requiresExplicitConfirmForApply must be true');
  }

  if (boundaries.confirmRestoreAvailable !== false) {
    errors.push('boundaries.confirmRestoreAvailable must be false');
  }

  for (const field of FALSE_BOUNDARY_FIELDS) {
    if (boundaries[field] !== false) {
      errors.push(`boundaries.${field} must be false`);
    }
  }

  if (boundaries.restorePayloadPolicy !== 'manifest-hash-and-refs-only') {
    errors.push('boundaries.restorePayloadPolicy must be manifest-hash-and-refs-only');
  }

  if (boundaries.restoreMode !== 'validate-only') {
    errors.push('boundaries.restoreMode must be validate-only');
  }
}

function assertSafeContextRef(value, field) {
  if (typeof value !== 'string' || value.trim() === '' || !/^[A-Za-z0-9._:-]+$/u.test(value) || value.includes('..')) {
    throw new Error(`${field} must be a safe ref`);
  }
}

function isSha256(value) {
  return typeof value === 'string' && /^sha256:[0-9a-f]{64}$/u.test(value);
}

function isSafeManagedRef(value) {
  return typeof value === 'string' &&
    value.trim() !== '' &&
    !value.startsWith('/') &&
    !value.includes('\\') &&
    !value.split('/').includes('..') &&
    value.length <= 240;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
