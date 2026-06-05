export const APP_SCHEMA_MIGRATION_CONTRACT_NAME = 'app-schema-migration.v1';
export const APP_SCHEMA_MIGRATION_CONTRACT_VERSION = 1;

const CURRENT_SCHEMA_VERSION = 1;
const TARGET_SCHEMA_VERSION = 2;
const MIGRATION_ID = 'v39-schema-version-2';
const CONFIRMATION_ACTION_ID = 'app.schema.migration.confirm';
const PLAN_HASH = 'sha256:2b22d86221a26cba59b33d210d365660d8817522a175e69f34df34b42f9c9311';
const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'app-data-inventory.v1',
  'project-registry.v1',
  'app-state-snapshot.v1',
  'goal-runbook.v1',
  'goal-next-action.v1',
  'goal-progress-ledger.v1',
  'goal-event-log.v1'
]);
const APP_DATA_AREAS = Object.freeze([
  'project-registry',
  'runtime-snapshots',
  'job-state',
  'artifact-index',
  'settings',
  'provider-profiles',
  'evidence-refs'
]);
const STEP_STATUSES = Object.freeze(['pending-confirm', 'ready']);

export function buildAppSchemaMigrationContract({
  goalId = 'v39-backup-diagnostics-migration-workspace',
  taskId = 'task-2',
  generatedAt = new Date().toISOString(),
  currentVersion = CURRENT_SCHEMA_VERSION,
  targetVersion = TARGET_SCHEMA_VERSION
} = {}) {
  return assertAppSchemaMigrationContract({
    contractName: APP_SCHEMA_MIGRATION_CONTRACT_NAME,
    contractVersion: APP_SCHEMA_MIGRATION_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      taskId,
      sourceContracts: [...REQUIRED_SOURCE_CONTRACTS],
      stateSource: 'explicit-backend-contracts',
      scope: 'v39-schema-version-migration-runner'
    },
    schema: {
      currentVersion,
      targetVersion,
      versionField: 'appData.schemaVersion',
      migrationRequired: currentVersion < targetVersion,
      versionSource: 'app-schema-migration.v1 static target until a durable app data store is introduced'
    },
    dryRun: {
      defaultMode: true,
      previewOnly: true,
      writesAttempted: false,
      status: currentVersion < targetVersion ? 'pending-confirm' : 'ready',
      affectedAreas: APP_DATA_AREAS.map((area) => ({
        area,
        currentVersion,
        targetVersion,
        writeRequiredOnConfirm: currentVersion < targetVersion
      })),
      steps: buildMigrationSteps({ currentVersion, targetVersion }),
      warnings: [
        'Preview does not write app data.',
        'Confirm must use the matching plan hash and confirmation action id.'
      ]
    },
    confirmation: {
      required: currentVersion < targetVersion,
      actionId: CONFIRMATION_ACTION_ID,
      confirmationContract: 'app-schema-migration-confirmation.v1',
      requiresPlanHash: true,
      planHash: PLAN_HASH,
      appendOnlyEventRequired: true,
      allowedWriteTarget: 'managed-app-data-store',
      writesInPreview: false,
      confirmAvailableFromBrowser: false
    },
    boundaries: {
      readOnly: true,
      dryRunDefault: true,
      writesInDryRunAvailable: false,
      confirmRequiredForWrites: true,
      shellExecutionAvailable: false,
      arbitraryCommandExecutionAvailable: false,
      modelInvocationAvailable: false,
      arbitraryPathReadAvailable: false,
      localFileOpenAvailable: false,
      providerCliExecutionAvailable: false,
      migrationConfirmExecuted: false,
      gitWriteAvailable: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      publishAvailable: false,
      selfApprovalAvailable: false,
      releaseReadyDeclarationAvailable: false
    }
  });
}

export function validateAppSchemaMigrationContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['app schema migration contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', APP_SCHEMA_MIGRATION_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', APP_SCHEMA_MIGRATION_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);
  validateContext(errors, contract.context);
  validateSchema(errors, contract.schema);
  validateDryRun(errors, contract.dryRun, contract.schema);
  validateConfirmation(errors, contract.confirmation, contract.schema);
  validateBoundaries(errors, contract.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertAppSchemaMigrationContract(contract) {
  const result = validateAppSchemaMigrationContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid app schema migration contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function buildMigrationSteps({ currentVersion, targetVersion }) {
  if (currentVersion >= targetVersion) {
    return [];
  }

  return [
    {
      stepId: 'schema-version.write-target',
      fromVersion: currentVersion,
      toVersion: targetVersion,
      status: 'pending-confirm',
      description: 'Write appData.schemaVersion after the confirm contract is accepted.',
      writesOnConfirm: true
    },
    {
      stepId: 'inventory.refs.backfill-schema-version',
      fromVersion: currentVersion,
      toVersion: targetVersion,
      status: 'pending-confirm',
      description: 'Attach the target schema version to inventory refs for registry, snapshots, jobs, artifacts, settings, providers, and evidence.',
      writesOnConfirm: true
    },
    {
      stepId: 'migration.preview.record-result',
      fromVersion: currentVersion,
      toVersion: targetVersion,
      status: 'pending-confirm',
      description: 'Record the migration preview result as explicit backend state before any later backup or restore task consumes it.',
      writesOnConfirm: true
    }
  ];
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');
  requireExact(errors, context.taskId, 'context.taskId', 'task-2');
  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.scope, 'context.scope', 'v39-schema-version-migration-runner');

  if (!Array.isArray(context.sourceContracts)) {
    errors.push('context.sourceContracts must be an array');
    return;
  }

  for (const contractName of REQUIRED_SOURCE_CONTRACTS) {
    if (!context.sourceContracts.includes(contractName)) {
      errors.push(`context.sourceContracts must include ${contractName}`);
    }
  }

  context.sourceContracts.forEach((contractName, index) => {
    requireContractName(errors, contractName, `context.sourceContracts[${index}]`);
  });
}

function validateSchema(errors, schema) {
  if (!isPlainObject(schema)) {
    errors.push('schema must be a plain object');
    return;
  }

  requirePositiveInteger(errors, schema.currentVersion, 'schema.currentVersion');
  requirePositiveInteger(errors, schema.targetVersion, 'schema.targetVersion');
  requireExact(errors, schema.versionField, 'schema.versionField', 'appData.schemaVersion');
  requireExact(errors, schema.migrationRequired, 'schema.migrationRequired', schema.currentVersion < schema.targetVersion);

  if (typeof schema.versionSource !== 'string' || schema.versionSource.trim() === '') {
    errors.push('schema.versionSource must be a non-empty string');
  }
}

function validateDryRun(errors, dryRun, schema) {
  if (!isPlainObject(dryRun)) {
    errors.push('dryRun must be a plain object');
    return;
  }

  requireExact(errors, dryRun.defaultMode, 'dryRun.defaultMode', true);
  requireExact(errors, dryRun.previewOnly, 'dryRun.previewOnly', true);
  requireExact(errors, dryRun.writesAttempted, 'dryRun.writesAttempted', false);
  requireEnum(errors, dryRun.status, 'dryRun.status', STEP_STATUSES);

  if (!Array.isArray(dryRun.affectedAreas) || dryRun.affectedAreas.length !== APP_DATA_AREAS.length) {
    errors.push('dryRun.affectedAreas must list all app data areas');
  } else {
    const areaNames = dryRun.affectedAreas.map((area) => area?.area).sort().join(',');
    if (areaNames !== [...APP_DATA_AREAS].sort().join(',')) {
      errors.push('dryRun.affectedAreas must match the v39 app data inventory areas');
    }

    dryRun.affectedAreas.forEach((area, index) => validateAffectedArea(errors, area, `dryRun.affectedAreas[${index}]`, schema));
  }

  if (!Array.isArray(dryRun.steps)) {
    errors.push('dryRun.steps must be an array');
  } else {
    dryRun.steps.forEach((step, index) => validateStep(errors, step, `dryRun.steps[${index}]`, schema));
  }

  if (!Array.isArray(dryRun.warnings) || dryRun.warnings.length === 0) {
    errors.push('dryRun.warnings must be a non-empty array');
  }
}

function validateAffectedArea(errors, area, path, schema) {
  if (!isPlainObject(area)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, area.area, `${path}.area`, APP_DATA_AREAS);
  requireExact(errors, area.currentVersion, `${path}.currentVersion`, schema.currentVersion);
  requireExact(errors, area.targetVersion, `${path}.targetVersion`, schema.targetVersion);
  requireExact(errors, area.writeRequiredOnConfirm, `${path}.writeRequiredOnConfirm`, schema.currentVersion < schema.targetVersion);
}

function validateStep(errors, step, path, schema) {
  if (!isPlainObject(step)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireSafeRef(errors, step.stepId, `${path}.stepId`);
  requireExact(errors, step.fromVersion, `${path}.fromVersion`, schema.currentVersion);
  requireExact(errors, step.toVersion, `${path}.toVersion`, schema.targetVersion);
  requireEnum(errors, step.status, `${path}.status`, STEP_STATUSES);
  requireExact(errors, step.writesOnConfirm, `${path}.writesOnConfirm`, true);

  if (typeof step.description !== 'string' || step.description.trim() === '') {
    errors.push(`${path}.description must be a non-empty string`);
  }
}

function validateConfirmation(errors, confirmation, schema) {
  if (!isPlainObject(confirmation)) {
    errors.push('confirmation must be a plain object');
    return;
  }

  requireExact(errors, confirmation.required, 'confirmation.required', schema.currentVersion < schema.targetVersion);
  requireExact(errors, confirmation.actionId, 'confirmation.actionId', CONFIRMATION_ACTION_ID);
  requireExact(errors, confirmation.confirmationContract, 'confirmation.confirmationContract', 'app-schema-migration-confirmation.v1');
  requireExact(errors, confirmation.requiresPlanHash, 'confirmation.requiresPlanHash', true);
  requireSha256Hash(errors, confirmation.planHash, 'confirmation.planHash');
  requireExact(errors, confirmation.appendOnlyEventRequired, 'confirmation.appendOnlyEventRequired', true);
  requireExact(errors, confirmation.allowedWriteTarget, 'confirmation.allowedWriteTarget', 'managed-app-data-store');
  requireExact(errors, confirmation.writesInPreview, 'confirmation.writesInPreview', false);
  requireExact(errors, confirmation.confirmAvailableFromBrowser, 'confirmation.confirmAvailableFromBrowser', false);
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);
  requireExact(errors, boundaries.dryRunDefault, 'boundaries.dryRunDefault', true);
  requireExact(errors, boundaries.confirmRequiredForWrites, 'boundaries.confirmRequiredForWrites', true);

  for (const field of [
    'writesInDryRunAvailable',
    'shellExecutionAvailable',
    'arbitraryCommandExecutionAvailable',
    'modelInvocationAvailable',
    'arbitraryPathReadAvailable',
    'localFileOpenAvailable',
    'providerCliExecutionAvailable',
    'migrationConfirmExecuted',
    'gitWriteAvailable',
    'mergeAvailable',
    'pushAvailable',
    'tagAvailable',
    'publishAvailable',
    'selfApprovalAvailable',
    'releaseReadyDeclarationAvailable'
  ]) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }
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

function requirePositiveInteger(errors, value, path) {
  if (!Number.isInteger(value) || value <= 0) {
    errors.push(`${path} must be a positive integer`);
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
