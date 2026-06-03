import { buildActionPreviewContract } from './action-preview.js';

export const JOB_CREATION_CONTRACT_NAME = 'job-creation.v1';
export const JOB_CREATION_CONTRACT_VERSION = 1;

const JOB_STATUSES = Object.freeze([
  'queued',
  'running',
  'blocked',
  'failed',
  'passed',
  'cancelled'
]);

const JOB_QUEUE_STATES = Object.freeze([
  'action-preview-contract',
  'job-event',
  'job-queue-state',
  'goal-event'
]);

const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'action-manifest.v1',
  'action-availability.v1',
  'action-preview.v1',
  'job-model.v1'
]);

export async function buildJobCreationContract({
  stateDir = '.symphony',
  goalId = 'latest',
  taskId = null,
  actionId = null,
  generatedAt = new Date().toISOString()
} = {}) {
  if (actionId !== null && !isSafeActionId(actionId)) {
    throw new Error('job creation actionId must be a safe action id');
  }

  const preview = await buildActionPreviewContract({
    stateDir,
    goalId,
    taskId,
    actionId,
    generatedAt
  });

  if (preview.contractName !== 'action-preview.v1') {
    throw new Error('Job creation source must be action-preview.v1');
  }

  const previewAction = preview.actions.length === 1 ? preview.actions[0] : null;
  const blockers = [];
  const warnings = [];

  for (const blocker of preview.blockers) {
    blockers.push({
      code: blocker.code,
      message: blocker.message,
      source: blocker.source
    });
  }

  if (actionId !== null && previewAction === null) {
    blockers.push({
      code: 'action-not-in-preview',
      message: `Action ${actionId} was not resolved in the action preview.`,
      source: 'action-preview.v1'
    });
  }

  if (previewAction !== null && previewAction.state !== 'available') {
    blockers.push({
      code: 'action-not-available',
      message: `Action ${actionId} is in state ${previewAction.state}.`,
      source: 'action-preview.v1'
    });
  }

  if (previewAction !== null && previewAction.reasons.length > 0) {
    warnings.push({
      code: 'action-has-reasons',
      message: previewAction.reasons.map((r) => r.message).join('; '),
      source: 'action-availability.v1'
    });
  }

  const resolvedGoalId = preview.context.goalId;
  const resolvedTaskId = preview.context.taskId;
  const safeActionId = actionId ?? previewAction?.action_id ?? null;
  const jobId = buildJobId({ goalId: resolvedGoalId, taskId: resolvedTaskId, actionId: safeActionId });
  const hasBlockers = blockers.length > 0;

  const contract = {
    contractName: JOB_CREATION_CONTRACT_NAME,
    contractVersion: JOB_CREATION_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId: resolvedGoalId,
      taskId: resolvedTaskId,
      actionId: safeActionId,
      sourceContracts: dedupeAndSort([
        ...REQUIRED_SOURCE_CONTRACTS,
        'job-creation.v1',
        ...preview.context.sourceContracts
      ]),
      stateSource: 'explicit-backend-contracts'
    },
    job: {
      job_id: jobId,
      project_id: null,
      goal_id: resolvedGoalId,
      task_id: resolvedTaskId,
      action_id: safeActionId,
      status: hasBlockers ? 'blocked' : 'queued',
      queue_state: 'action-preview-contract',
      refs: [],
      timestamps: {
        created_at: generatedAt,
        leased_at: null,
        passed_at: null,
        failed_at: null,
        cancelled_at: null
      },
      failure: null,
      blocker: hasBlockers
        ? {
            reason: blockers.map((b) => b.message).join('; '),
            requires: 'operator-resolution'
          }
        : null
    },
    plan: {
      dryRun: true,
      requiresConfirmation: true,
      jobExecutionAvailable: false,
      writesEventLog: false,
      writesQueueState: false,
      createsPersistentJob: false,
      createsJobRecord: false
    },
    warnings,
    blockers,
    sourceActionPreview: buildSourceActionPreview(preview, previewAction),
    boundaries: jobCreationBoundaries()
  };

  return assertJobCreationContract(contract);
}

export function validateJobCreationContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', JOB_CREATION_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', JOB_CREATION_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);

  validateContext(errors, contract.context);
  validateJob(errors, contract.job);
  validatePlan(errors, contract.plan);
  validateWarningsAndBlockers(errors, contract.warnings, contract.blockers);
  validateBlockerStatusConsistency(errors, contract.job, contract.blockers);
  validateSourceActionPreview(errors, contract.sourceActionPreview, contract.context, contract.job, contract.blockers);
  validateBoundaries(errors, contract.boundaries, 'boundaries');

  return { ok: errors.length === 0, errors };
}

export function assertJobCreationContract(contract) {
  const result = validateJobCreationContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid job creation contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function buildJobId({ goalId, taskId, actionId }) {
  const parts = ['job', goalId, taskId, actionId].filter(Boolean).join('-');

  return parts.replace(/[^A-Za-z0-9._-]/g, '-');
}

function buildSourceActionPreview(preview, previewAction) {
  return {
    contractName: preview.contractName,
    generatedAt: preview.generatedAt,
    action: previewAction
  };
}

function jobCreationBoundaries() {
  return {
    readOnly: true,
    dryRun: true,
    jobExecutionAvailable: false,
    actionExecutionAvailable: false,
    modelInvocationAvailable: false,
    arbitraryCommandExecutionAvailable: false,
    arbitraryPathReadAvailable: false,
    gitWriteAvailable: false,
    mergeAvailable: false,
    pushAvailable: false,
    tagAvailable: false,
    publishAvailable: false,
    selfApprovalAvailable: false,
    secondArtifactStoreAvailable: false,
    jobCreationSource: 'action-preview.v1 only',
    createsPersistentJob: false,
    writesEventLog: false,
    writesQueueState: false
  };
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');

  if (context.taskId !== null) {
    requireSafeRef(errors, context.taskId, 'context.taskId');
  }

  if (context.actionId !== null) {
    requireActionId(errors, context.actionId, 'context.actionId');
  }

  if (!Array.isArray(context.sourceContracts) || context.sourceContracts.length === 0) {
    errors.push('context.sourceContracts must be a non-empty array');
  } else {
    for (const required of REQUIRED_SOURCE_CONTRACTS) {
      if (!context.sourceContracts.includes(required)) {
        errors.push(`context.sourceContracts must include ${required}`);
      }
    }
  }

  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
}

function validateJob(errors, job) {
  if (!isPlainObject(job)) {
    errors.push('job must be a plain object');
    return;
  }

  requireSafeRef(errors, job.job_id, 'job.job_id');
  requireSafeRef(errors, job.goal_id, 'job.goal_id');

  if (job.task_id !== null) {
    requireSafeRef(errors, job.task_id, 'job.task_id');
  }

  requireActionId(errors, job.action_id, 'job.action_id');
  requireEnum(errors, job.status, 'job.status', JOB_STATUSES);
  requireEnum(errors, job.queue_state, 'job.queue_state', JOB_QUEUE_STATES);

  if (!Array.isArray(job.refs)) {
    errors.push('job.refs must be an array');
  }

  requireIsoTimestamp(errors, job.timestamps.created_at, 'job.timestamps.created_at');

  if (job.blocker !== null) {
    if (!isPlainObject(job.blocker)) {
      errors.push('job.blocker must be a plain object');
    } else {
      requireNonEmptyString(errors, job.blocker.reason, 'job.blocker.reason');
    }
  }

  if (job.blocker !== null && job.status === 'queued') {
    errors.push('job.status must be blocked when job.blocker is non-null');
  }

  if (job.blocker === null && job.status === 'blocked') {
    errors.push('job.blocker must be non-null when job.status is blocked');
  }
}

function validatePlan(errors, plan) {
  if (!isPlainObject(plan)) {
    errors.push('plan must be a plain object');
    return;
  }

  requireExact(errors, plan.dryRun, 'plan.dryRun', true);
  requireExact(errors, plan.requiresConfirmation, 'plan.requiresConfirmation', true);
  requireExact(errors, plan.jobExecutionAvailable, 'plan.jobExecutionAvailable', false);
  requireExact(errors, plan.writesEventLog, 'plan.writesEventLog', false);
  requireExact(errors, plan.writesQueueState, 'plan.writesQueueState', false);
  requireExact(errors, plan.createsPersistentJob, 'plan.createsPersistentJob', false);
  requireExact(errors, plan.createsJobRecord, 'plan.createsJobRecord', false);

  // confirmationContract is intentionally not in task-2 plan
  if (Object.hasOwn(plan, 'confirmationContract')) {
    errors.push('plan must not contain confirmationContract — not implemented in task-2');
  }
}

function validateWarningsAndBlockers(errors, warnings, blockers) {
  if (!Array.isArray(warnings)) {
    errors.push('warnings must be an array');
  } else {
    warnings.forEach((entry, index) => {
      validateWarningBlockerEntry(errors, entry, `warnings[${index}]`);
    });
  }

  if (!Array.isArray(blockers)) {
    errors.push('blockers must be an array');
  } else {
    blockers.forEach((entry, index) => {
      validateWarningBlockerEntry(errors, entry, `blockers[${index}]`);
    });
  }
}

function validateWarningBlockerEntry(errors, entry, path) {
  if (!isPlainObject(entry)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  if (typeof entry.code !== 'string' || entry.code.trim().length === 0) {
    errors.push(`${path}.code must be a non-empty string`);
  } else {
    requireSafeActionId(errors, entry.code, `${path}.code`);
  }

  if (typeof entry.message !== 'string' || entry.message.trim().length === 0) {
    errors.push(`${path}.message must be a non-empty string`);
  }

  if (typeof entry.source !== 'string' || entry.source.trim().length === 0) {
    errors.push(`${path}.source must be a non-empty string`);
  } else if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(entry.source)) {
    errors.push(`${path}.source must be a safe source id`);
  }
}

function validateBlockerStatusConsistency(errors, job, blockers) {
  if (!isPlainObject(job) || !Array.isArray(blockers)) {
    return;
  }

  if (blockers.length > 0 && job.status !== 'blocked') {
    errors.push('job.status must be blocked when blockers are present');
  }

  if (blockers.length > 0 && job.blocker === null) {
    errors.push('job.blocker must be non-null when blockers are present');
  }
}

function validateSourceActionPreview(errors, sap, context, job, blockers) {
  if (!isPlainObject(sap)) {
    errors.push('sourceActionPreview must be a plain object');
    return;
  }

  requireExact(errors, sap.contractName, 'sourceActionPreview.contractName', 'action-preview.v1');
  requireIsoTimestamp(errors, sap.generatedAt, 'sourceActionPreview.generatedAt');

  if (sap.action === null) {
    const actionLevelBlockerCodes = new Set([
      'action-not-in-preview',
      'action-not-available',
      'active-task-missing',
      'goal-progress-missing',
      'goal-runbook-missing',
      'next-action-blocked',
      'task-context-missing',
      'task-not-found',
      'different-active-task'
    ]);

    const hasActionBlocker = Array.isArray(blockers) && blockers.some(
      (b) => actionLevelBlockerCodes.has(b.code)
    );

    if (isPlainObject(context) && context.actionId !== null && !hasActionBlocker) {
      errors.push('sourceActionPreview.action must be non-null when context.actionId is non-null and no action-level blockers exist');
    }

    return;
  }

  if (!isPlainObject(sap.action)) {
    errors.push('sourceActionPreview.action must be a plain object or null');
    return;
  }

  requireSafeActionId(errors, sap.action.action_id, 'sourceActionPreview.action.action_id');

  if (isPlainObject(context) && context.actionId !== null && sap.action.action_id !== context.actionId) {
    errors.push('sourceActionPreview.action.action_id must equal context.actionId');
  }

  if (isPlainObject(job) && sap.action.action_id !== job.action_id) {
    errors.push('sourceActionPreview.action.action_id must equal job.action_id');
  }
}

function validateBoundaries(errors, boundaries, path) {
  if (!isPlainObject(boundaries)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireExact(errors, boundaries.readOnly, `${path}.readOnly`, true);
  requireExact(errors, boundaries.dryRun, `${path}.dryRun`, true);

  for (const field of [
    'jobExecutionAvailable',
    'actionExecutionAvailable',
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
    'createsPersistentJob',
    'writesEventLog',
    'writesQueueState'
  ]) {
    requireExact(errors, boundaries[field], `${path}.${field}`, false);
  }

  requireExact(errors, boundaries.jobCreationSource, `${path}.jobCreationSource`, 'action-preview.v1 only');
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

function requireActionId(errors, value, path) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u.test(value)) {
    errors.push(`${path} must be a safe action id`);
  }
}

function requireSafeActionId(errors, value, path) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u.test(value)) {
    errors.push(`${path} must be a safe action id`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSafeActionId(value) {
  return typeof value === 'string' && /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u.test(value);
}

function dedupeAndSort(array) {
  return [...new Set(array)].sort();
}
