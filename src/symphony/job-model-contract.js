export const JOB_MODEL_CONTRACT_NAME = 'job-model.v1';
export const JOB_MODEL_CONTRACT_VERSION = 1;

const JOB_STATUSES = Object.freeze([
  'queued',
  'running',
  'blocked',
  'failed',
  'passed',
  'cancelled'
]);

const JOB_STATE_SOURCES = Object.freeze([
  'action-preview-contract',
  'job-event',
  'job-queue-state',
  'goal-event'
]);

const REQUIRED_ACTION_SOURCE_CONTRACTS = Object.freeze([
  'action-manifest.v1',
  'action-availability.v1',
  'action-preview.v1'
]);

const JOB_CREATION_SOURCE_LOCKED = 'action-preview.v1 only';

export function buildJobModelContract({
  projectId = null,
  goalId = 'latest',
  taskId = null,
  actionId = null,
  generatedAt = new Date().toISOString()
} = {}) {
  return assertJobModelContract({
    contractName: JOB_MODEL_CONTRACT_NAME,
    contractVersion: JOB_MODEL_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      projectId,
      goalId,
      taskId,
      actionId,
      sourceContracts: [
        'action-manifest.v1',
        'action-availability.v1',
        'action-preview.v1',
        'goal-runbook.v1',
        'goal-next-action.v1',
        'goal-progress-ledger.v1',
        'goal-event-log.v1'
      ],
      stateSource: 'explicit-backend-contracts'
    },
    job: buildJob({
      job_id: 'job-v35-task-1-example',
      project_id: projectId,
      goal_id: goalId,
      task_id: taskId,
      action_id: actionId ?? 'goal.worker-evidence.record',
      status: 'queued',
      queueState: 'action-preview-contract',
      refs: [],
      timestamps: {
        created_at: generatedAt,
        leased_at: null,
        passed_at: null,
        failed_at: null,
        cancelled_at: null
      },
      failure: null,
      blocker: null
    }),
    boundaries: jobModelBoundaries()
  });
}

export function validateJobModelContract(jobModel) {
  const errors = [];

  if (!isPlainObject(jobModel)) {
    return { ok: false, errors: ['job model must be a plain object'] };
  }

  requireExact(errors, jobModel.contractName, 'contractName', JOB_MODEL_CONTRACT_NAME);
  requireExact(errors, jobModel.contractVersion, 'contractVersion', JOB_MODEL_CONTRACT_VERSION);
  requireIsoTimestamp(errors, jobModel.generatedAt, 'generatedAt');
  requireExact(errors, jobModel.readOnly, 'readOnly', true);
  validateContext(errors, jobModel.context);
  validateJob(errors, jobModel.job);
  validateJobBoundaries(errors, jobModel.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertJobModelContract(jobModel) {
  const result = validateJobModelContract(jobModel);

  if (!result.ok) {
    throw new Error(`Invalid job model contract: ${result.errors.join('; ')}`);
  }

  return jobModel;
}

function buildJob({
  job_id,
  project_id,
  goal_id,
  task_id,
  action_id,
  status,
  queueState,
  refs,
  timestamps,
  failure,
  blocker
}) {
  return {
    job_id,
    project_id,
    goal_id,
    task_id,
    action_id,
    status,
    queue_state: queueState,
    refs,
    timestamps,
    failure,
    blocker
  };
}

function jobModelBoundaries() {
  return {
    readOnly: true,
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
    jobCreationSource: JOB_CREATION_SOURCE_LOCKED,
    secondArtifactStoreAvailable: false
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

  if (context.actionId !== null) {
    requireActionId(errors, context.actionId, 'context.actionId');
  }

  if (!Array.isArray(context.sourceContracts) || context.sourceContracts.length === 0) {
    errors.push('context.sourceContracts must be a non-empty array');
  } else {
    for (const required of REQUIRED_ACTION_SOURCE_CONTRACTS) {
      if (!context.sourceContracts.includes(required)) {
        errors.push(`context.sourceContracts must include ${required}`);
      }
    }

    context.sourceContracts.forEach((contractName, index) => {
      requireContractName(errors, contractName, `context.sourceContracts[${index}]`);
    });
  }

  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
}

function validateJob(errors, job) {
  if (!isPlainObject(job)) {
    errors.push('job must be a plain object');
    return;
  }

  requireSafeRef(errors, job.job_id, 'job.job_id');

  if (job.project_id !== null) {
    requireSafeRef(errors, job.project_id, 'job.project_id');
  }

  requireSafeRef(errors, job.goal_id, 'job.goal_id');

  if (job.task_id !== null) {
    requireSafeRef(errors, job.task_id, 'job.task_id');
  }

  requireActionId(errors, job.action_id, 'job.action_id');
  requireEnum(errors, job.status, 'job.status', JOB_STATUSES);
  requireEnum(errors, job.queue_state, 'job.queue_state', JOB_STATE_SOURCES);

  if (!Array.isArray(job.refs)) {
    errors.push('job.refs must be an array');
  }

  validateJobTimestamps(errors, job.timestamps);

  if (job.failure !== null) {
    validateJobFailure(errors, job.failure);
  }

  if (job.blocker !== null) {
    validateJobBlocker(errors, job.blocker);
  }
}

function validateJobTimestamps(errors, timestamps) {
  if (!isPlainObject(timestamps)) {
    errors.push('job.timestamps must be a plain object');
    return;
  }

  requireIsoTimestamp(errors, timestamps.created_at, 'job.timestamps.created_at');

  if (timestamps.leased_at !== null) {
    requireIsoTimestamp(errors, timestamps.leased_at, 'job.timestamps.leased_at');
  }

  if (timestamps.passed_at !== null) {
    requireIsoTimestamp(errors, timestamps.passed_at, 'job.timestamps.passed_at');
  }

  if (timestamps.failed_at !== null) {
    requireIsoTimestamp(errors, timestamps.failed_at, 'job.timestamps.failed_at');
  }

  if (timestamps.cancelled_at !== null) {
    requireIsoTimestamp(errors, timestamps.cancelled_at, 'job.timestamps.cancelled_at');
  }
}

function validateJobFailure(errors, failure) {
  if (!isPlainObject(failure)) {
    errors.push('job.failure must be a plain object');
    return;
  }

  if (typeof failure.code !== 'string' || failure.code.trim().length === 0) {
    errors.push('job.failure.code must be a non-empty string');
  }

  if (typeof failure.message !== 'string' || failure.message.trim().length === 0) {
    errors.push('job.failure.message must be a non-empty string');
  }

  if (failure.attempt !== undefined && !Number.isInteger(failure.attempt)) {
    errors.push('job.failure.attempt must be an integer');
  }
}

function validateJobBlocker(errors, blocker) {
  if (!isPlainObject(blocker)) {
    errors.push('job.blocker must be a plain object');
    return;
  }

  if (typeof blocker.reason !== 'string' || blocker.reason.trim().length === 0) {
    errors.push('job.blocker.reason must be a non-empty string');
  }

  if (blocker.requires !== undefined && typeof blocker.requires !== 'string') {
    errors.push('job.blocker.requires must be a string');
  }
}

function validateJobBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);

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
    'secondArtifactStoreAvailable'
  ]) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }

  requireExact(errors, boundaries.jobCreationSource, 'boundaries.jobCreationSource', JOB_CREATION_SOURCE_LOCKED);
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

function requireContractName(errors, value, path) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*(?:\.v[0-9]+)$/u.test(value)) {
    errors.push(`${path} must be a contract name ending in .v<number>`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
