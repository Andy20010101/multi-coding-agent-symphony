export const JOB_TIMELINE_LOG_STREAM_CONTRACT_NAME = 'job-timeline-log-stream.v1';
export const JOB_TIMELINE_LOG_STREAM_CONTRACT_VERSION = 1;

const JOB_EVENT_TYPES = Object.freeze([
  'queued',
  'running',
  'blocked',
  'failed',
  'passed',
  'cancelled',
  'recovered'
]);

const JOB_QUEUE_STATES = Object.freeze([
  'action-preview-contract',
  'job-event',
  'job-queue-state',
  'goal-event'
]);

const LOG_REF_KINDS = Object.freeze([
  'stdout',
  'stderr',
  'combined',
  'event-log',
  'structured'
]);

const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'job-model.v1',
  'job-creation.v1',
  'goal-event-log.v1'
]);

export function buildJobTimelineLogStreamContract({
  jobId = null,
  goalId = 'latest',
  taskId = null,
  generatedAt = new Date().toISOString()
} = {}) {
  return assertJobTimelineLogStreamContract({
    contractName: JOB_TIMELINE_LOG_STREAM_CONTRACT_NAME,
    contractVersion: JOB_TIMELINE_LOG_STREAM_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      jobId,
      goalId,
      taskId,
      sourceContracts: [
        'job-model.v1',
        'job-creation.v1',
        'goal-runbook.v1',
        'goal-progress-ledger.v1',
        'goal-event-log.v1'
      ],
      stateSource: 'explicit-backend-contracts'
    },
    timeline: [],
    logRefs: [],
    note: 'Job timeline and log stream contract. Timeline events are sourced from backend job events only. Log refs are pointers, not arbitrary file reads. An empty timeline indicates no job events have been recorded for the requested context.',
    boundaries: timelineBoundaries()
  });
}

export function validateJobTimelineLogStreamContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', JOB_TIMELINE_LOG_STREAM_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', JOB_TIMELINE_LOG_STREAM_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);

  validateContext(errors, contract.context);
  validateTimeline(errors, contract.timeline, contract.context);
  validateLogRefs(errors, contract.logRefs, contract.context);

  if (typeof contract.note !== 'string' || contract.note.trim().length === 0) {
    errors.push('note must be a non-empty string');
  }

  validateTimelineBoundaries(errors, contract.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertJobTimelineLogStreamContract(contract) {
  const result = validateJobTimelineLogStreamContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid job timeline log stream contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function timelineBoundaries() {
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
    secondArtifactStoreAvailable: false,
    timelineSource: 'explicit-backend-job-events',
    logRefSource: 'structured-log-refs-only'
  };
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  if (context.jobId !== null) {
    requireSafeRef(errors, context.jobId, 'context.jobId');
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');

  if (context.taskId !== null) {
    requireSafeRef(errors, context.taskId, 'context.taskId');
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
}

function validateTimeline(errors, timeline, context) {
  if (!Array.isArray(timeline)) {
    errors.push('timeline must be an array');
    return;
  }

  timeline.forEach((event, index) => {
    validateTimelineEvent(errors, event, `timeline[${index}]`, context);
  });
}

function validateTimelineEvent(errors, event, path, context) {
  if (!isPlainObject(event)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireSafeRef(errors, event.event_id, `${path}.event_id`);
  requireSafeRef(errors, event.job_id, `${path}.job_id`);
  requireSafeRef(errors, event.goal_id, `${path}.goal_id`);

  if (event.task_id !== null) {
    requireSafeRef(errors, event.task_id, `${path}.task_id`);
  }

  if (event.action_id !== null) {
    requireActionId(errors, event.action_id, `${path}.action_id`);
  }

  requireEnum(errors, event.event_type, `${path}.event_type`, JOB_EVENT_TYPES);
  requireEnum(errors, event.queue_state, `${path}.queue_state`, JOB_QUEUE_STATES);
  requireIsoTimestamp(errors, event.timestamp, `${path}.timestamp`);

  if (typeof event.source !== 'string' || event.source.trim().length === 0) {
    errors.push(`${path}.source must be a non-empty string`);
  } else if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(event.source)) {
    errors.push(`${path}.source must be a safe source id`);
  }

  if (event.message !== null && typeof event.message !== 'string') {
    errors.push(`${path}.message must be a string or null`);
  }

  if (!Array.isArray(event.refs)) {
    errors.push(`${path}.refs must be an array`);
  } else {
    event.refs.forEach((ref, refIndex) => {
      if (typeof ref !== 'string') {
        errors.push(`${path}.refs[${refIndex}] must be a string`);
      }
    });
  }

  if (event.blocker !== null) {
    validateTimelineBlocker(errors, event.blocker, `${path}.blocker`);
  }

  if (event.failure !== null) {
    validateTimelineFailure(errors, event.failure, `${path}.failure`);
  }

  validateTimelineContextAlignment(errors, event, path, context);
}

function validateTimelineBlocker(errors, blocker, path) {
  if (!isPlainObject(blocker)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  if (typeof blocker.reason !== 'string' || blocker.reason.trim().length === 0) {
    errors.push(`${path}.reason must be a non-empty string`);
  }

  if (blocker.requires !== undefined && typeof blocker.requires !== 'string') {
    errors.push(`${path}.requires must be a string`);
  }
}

function validateTimelineFailure(errors, failure, path) {
  if (!isPlainObject(failure)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  if (typeof failure.code !== 'string' || failure.code.trim().length === 0) {
    errors.push(`${path}.code must be a non-empty string`);
  }

  if (typeof failure.message !== 'string' || failure.message.trim().length === 0) {
    errors.push(`${path}.message must be a non-empty string`);
  }

  if (failure.attempt !== undefined && !Number.isInteger(failure.attempt)) {
    errors.push(`${path}.attempt must be an integer`);
  }
}

function validateLogRefs(errors, logRefs, context) {
  if (!Array.isArray(logRefs)) {
    errors.push('logRefs must be an array');
    return;
  }

  logRefs.forEach((ref, index) => {
    validateLogRef(errors, ref, `logRefs[${index}]`, context);
  });
}

function validateLogRef(errors, ref, path, context) {
  if (!isPlainObject(ref)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireSafeRef(errors, ref.ref_id, `${path}.ref_id`);

  if (ref.job_id !== null) {
    requireSafeRef(errors, ref.job_id, `${path}.job_id`);
  }

  requireEnum(errors, ref.kind, `${path}.kind`, LOG_REF_KINDS);

  if (typeof ref.label !== 'string' || ref.label.trim().length === 0) {
    errors.push(`${path}.label must be a non-empty string`);
  }

  if (typeof ref.uri !== 'string' || ref.uri.trim().length === 0) {
    errors.push(`${path}.uri must be a non-empty string`);
  } else if (isUnsafeUri(ref.uri)) {
    errors.push(`${path}.uri must not contain traversal or unsafe segments`);
  }

  if (typeof ref.available !== 'boolean') {
    errors.push(`${path}.available must be a boolean`);
  }

  if (ref.size_bytes !== null && !Number.isInteger(ref.size_bytes)) {
    errors.push(`${path}.size_bytes must be an integer or null`);
  }

  if (ref.note !== null && typeof ref.note !== 'string') {
    errors.push(`${path}.note must be a string or null`);
  }

  if (
    isPlainObject(context)
    && context.jobId !== null
    && ref.job_id !== null
    && ref.job_id !== context.jobId
  ) {
    errors.push(`${path}.job_id must equal context.jobId when both are present`);
  }
}

function validateTimelineContextAlignment(errors, event, path, context) {
  if (!isPlainObject(context)) {
    return;
  }

  if (context.jobId !== null && event.job_id !== context.jobId) {
    errors.push(`${path}.job_id must equal context.jobId`);
  }

  if (event.goal_id !== context.goalId) {
    errors.push(`${path}.goal_id must equal context.goalId`);
  }

  if (context.taskId !== null && event.task_id !== context.taskId) {
    errors.push(`${path}.task_id must equal context.taskId when context.taskId is present`);
  }
}

function validateTimelineBoundaries(errors, boundaries) {
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

  requireExact(errors, boundaries.timelineSource, 'boundaries.timelineSource', 'explicit-backend-job-events');
  requireExact(errors, boundaries.logRefSource, 'boundaries.logRefSource', 'structured-log-refs-only');
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

function isUnsafeUri(uri) {
  const variants = [uri, uri.toLowerCase()];

  try {
    variants.push(decodeURIComponent(uri));
  } catch {
    // Keep the raw variants; malformed encoding is handled by traversal checks.
  }

  if (/^file:/iu.test(uri)) {
    return true;
  }

  if (uri.startsWith('/') && !uri.startsWith('/api/')) {
    return true;
  }

  return variants.some((variant) => variant.includes('..') || variant.includes('\\'));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
