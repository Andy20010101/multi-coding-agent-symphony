export const JOB_RUN_CONTROL_CONTRACT_NAME = 'job-run-control.v1';
export const JOB_RUN_CONTROL_CONTRACT_VERSION = 1;

const JOB_STATUSES = Object.freeze([
  'queued',
  'running',
  'blocked',
  'failed',
  'passed',
  'cancelled'
]);

const CONTROLLED_TRANSITIONS = Object.freeze([
  Object.freeze({
    id: 'pause',
    label: 'Pause',
    description: 'Pause a queued or running job. Paused jobs enter blocked state and must be explicitly resumed.',
    validFrom: ['queued', 'running'],
    to: 'blocked',
    reversible: true,
    terminal: false,
    hiddenRetry: false
  }),
  Object.freeze({
    id: 'cancel',
    label: 'Cancel',
    description: 'Cancel a queued, running, blocked, or failed job. Cancellation is terminal and cannot be undone.',
    validFrom: ['queued', 'running', 'blocked', 'failed'],
    to: 'cancelled',
    reversible: false,
    terminal: true,
    hiddenRetry: false
  }),
  Object.freeze({
    id: 'resume',
    label: 'Resume',
    description: 'Resume a blocked job after the blocker has been resolved.',
    validFrom: ['blocked'],
    to: 'queued',
    reversible: false,
    terminal: false,
    hiddenRetry: false
  }),
  Object.freeze({
    id: 'recover',
    label: 'Recover',
    description: 'Recover a failed job. Recovery is always explicit, never automatic. A recovered job returns to the queue for re-execution.',
    validFrom: ['failed'],
    to: 'queued',
    reversible: false,
    terminal: false,
    hiddenRetry: false
  })
]);

const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'job-model.v1',
  'job-creation.v1',
  'job-timeline-log-stream.v1',
  'goal-event-log.v1'
]);

export function buildJobRunControlContract({
  jobId = null,
  goalId = 'latest',
  taskId = null,
  currentState = null,
  generatedAt = new Date().toISOString()
} = {}) {
  const available = currentState ? availableTransitionsFor(currentState) : [];

  return assertJobRunControlContract({
    contractName: JOB_RUN_CONTROL_CONTRACT_NAME,
    contractVersion: JOB_RUN_CONTROL_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      jobId,
      goalId,
      taskId,
      sourceContracts: [
        'job-model.v1',
        'job-creation.v1',
        'job-timeline-log-stream.v1',
        'goal-runbook.v1',
        'goal-progress-ledger.v1',
        'goal-event-log.v1'
      ],
      stateSource: 'explicit-backend-contracts'
    },
    transitions: CONTROLLED_TRANSITIONS,
    currentState,
    availableTransitions: Object.freeze(available.map((t) => t.id)),
    note: 'Job run control contract. Defines controlled pause, cancel, resume, and recover transitions. No hidden retries. Recovery is always explicit. Passed and cancelled are terminal states. Available transitions are computed from the current job state; an empty list indicates either no state was provided or the job is in a terminal state.',
    boundaries: runControlBoundaries()
  });
}

export function validateJobRunControlContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', JOB_RUN_CONTROL_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', JOB_RUN_CONTROL_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);

  validateContext(errors, contract.context);
  validateTransitions(errors, contract.transitions);

  if (contract.currentState !== null) {
    requireEnum(errors, contract.currentState, 'currentState', JOB_STATUSES);
  }

  validateAvailableTransitions(errors, contract.availableTransitions, contract.transitions, contract.currentState);

  if (typeof contract.note !== 'string' || contract.note.trim().length === 0) {
    errors.push('note must be a non-empty string');
  }

  validateRunControlBoundaries(errors, contract.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertJobRunControlContract(contract) {
  const result = validateJobRunControlContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid job run control contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function availableTransitionsFor(currentState) {
  return CONTROLLED_TRANSITIONS.filter((t) => t.validFrom.includes(currentState));
}

function runControlBoundaries() {
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
    controlSource: 'explicit-backend-job-state',
    hiddenRetryAvailable: false
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

function validateTransitions(errors, transitions) {
  if (!Array.isArray(transitions)) {
    errors.push('transitions must be an array');
    return;
  }

  validateExactTransitionTable(errors, transitions);

  transitions.forEach((transition, index) => {
    validateTransition(errors, transition, `transitions[${index}]`);
  });
}

function validateExactTransitionTable(errors, transitions) {
  if (transitions.length !== CONTROLLED_TRANSITIONS.length) {
    errors.push(`transitions must contain exactly ${CONTROLLED_TRANSITIONS.length} controlled transitions`);
    return;
  }

  transitions.forEach((transition, index) => {
    const expected = CONTROLLED_TRANSITIONS[index];

    if (!isPlainObject(transition)) {
      return;
    }

    requireExact(errors, transition.id, `transitions[${index}].id`, expected.id);
    requireExact(errors, transition.to, `transitions[${index}].to`, expected.to);
    requireExact(errors, transition.reversible, `transitions[${index}].reversible`, expected.reversible);
    requireExact(errors, transition.terminal, `transitions[${index}].terminal`, expected.terminal);

    if (Array.isArray(transition.validFrom)) {
      const expectedFrom = expected.validFrom.join(',');
      const actualFrom = transition.validFrom.join(',');

      if (actualFrom !== expectedFrom) {
        errors.push(`transitions[${index}].validFrom must be [${expectedFrom}]`);
      }
    }
  });
}

function validateTransition(errors, transition, path) {
  if (!isPlainObject(transition)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  if (typeof transition.id !== 'string' || !/^[a-z][a-z0-9-]*$/u.test(transition.id)) {
    errors.push(`${path}.id must be a safe transition id`);
  }

  if (typeof transition.label !== 'string' || transition.label.trim().length === 0) {
    errors.push(`${path}.label must be a non-empty string`);
  }

  if (typeof transition.description !== 'string' || transition.description.trim().length === 0) {
    errors.push(`${path}.description must be a non-empty string`);
  }

  if (!Array.isArray(transition.validFrom) || transition.validFrom.length === 0) {
    errors.push(`${path}.validFrom must be a non-empty array`);
  } else {
    transition.validFrom.forEach((from, fromIndex) => {
      requireEnum(errors, from, `${path}.validFrom[${fromIndex}]`, JOB_STATUSES);
    });
  }

  requireEnum(errors, transition.to, `${path}.to`, JOB_STATUSES);

  if (transition.validFrom && Array.isArray(transition.validFrom) && transition.validFrom.includes(transition.to)) {
    errors.push(`${path}.to must not be in ${path}.validFrom`);
  }

  requireExact(errors, transition.hiddenRetry, `${path}.hiddenRetry`, false);

  if (typeof transition.reversible !== 'boolean') {
    errors.push(`${path}.reversible must be a boolean`);
  }

  if (typeof transition.terminal !== 'boolean') {
    errors.push(`${path}.terminal must be a boolean`);
  }

  if (transition.terminal && transition.reversible) {
    errors.push(`${path} must not be both terminal and reversible`);
  }
}

function validateAvailableTransitions(errors, available, transitions, currentState) {
  if (!Array.isArray(available)) {
    errors.push('availableTransitions must be an array');
    return;
  }

  const transitionIds = new Set(transitions.map((t) => t.id));

  available.forEach((id, index) => {
    if (typeof id !== 'string') {
      errors.push(`availableTransitions[${index}] must be a string`);
    } else if (!transitionIds.has(id)) {
      errors.push(`availableTransitions[${index}] must be a known transition id`);
    }
  });

  if (currentState !== null && Array.isArray(transitions)) {
    const expectedIds = availableTransitionsFor(currentState).map((t) => t.id);
    const expected = [...expectedIds].sort().join(',');

    const actual = [...available].sort().join(',');

    if (actual !== expected) {
      errors.push(`availableTransitions for state ${currentState} must be [${expected}]`);
    }
  } else if (currentState === null && available.length !== 0) {
    errors.push('availableTransitions must be empty when currentState is null');
  }
}

function validateRunControlBoundaries(errors, boundaries) {
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
    'secondArtifactStoreAvailable',
    'hiddenRetryAvailable'
  ]) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }

  requireExact(errors, boundaries.controlSource, 'boundaries.controlSource', 'explicit-backend-job-state');
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

function requireContractName(errors, value, path) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*(?:\.v[0-9]+)$/u.test(value)) {
    errors.push(`${path} must be a contract name ending in .v<number>`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
