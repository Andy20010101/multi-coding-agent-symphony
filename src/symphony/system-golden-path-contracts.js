export const SYSTEM_GOLDEN_PATH_CONTRACT_NAME = 'systemGoldenPath.v1';
export const SYSTEM_GOLDEN_PATH_CONTRACT_VERSION = 1;

export const SYSTEM_GOLDEN_PATH_STEP_IDS = Object.freeze([
  'project-binding',
  'app-home',
  'supervisor',
  'context-advisory',
  'result-intake',
  'event-preview',
  'event-confirm',
  'review-gate',
  'closeout'
]);

export const SYSTEM_GOLDEN_PATH_STEP_STATES = Object.freeze([
  'ready',
  'pending',
  'blocked',
  'missing',
  'stale',
  'degraded',
  'manual-required'
]);

export const SYSTEM_GOLDEN_PATH_ACTION_KINDS = Object.freeze([
  'refresh-state',
  'manual-cli-required',
  'inspect-source-contract',
  'wait-for-source-contract'
]);

export const SYSTEM_GOLDEN_PATH_SOURCE_REF_KINDS = Object.freeze([
  'contract',
  'route',
  'fixture',
  'docs',
  'manual-cli'
]);

export const SYSTEM_GOLDEN_PATH_ACTION_LABELS = Object.freeze([
  'Refresh State',
  'Manual CLI Required'
]);

export const SYSTEM_GOLDEN_PATH_BOUNDARIES = Object.freeze({
  readOnly: true,
  readModelOnly: true,
  workbenchVisibilityOnly: true,
  acceptanceOnly: true,
  providerExecutionAvailable: false,
  providerLaunchAvailable: false,
  childDispatchAvailable: false,
  transcriptCompactAvailable: false,
  newThreadAvailable: false,
  genericShellRunnerAvailable: false,
  frontendLocalFileReadAvailable: false,
  localSessionFileReadAvailable: false,
  rawProviderPayloadExposureAvailable: false,
  directGoalEventAppendAvailable: false,
  resultIntakeAppendsGoalEvent: false,
  reviewerMutationAvailable: false,
  mainVerificationMutationAvailable: false,
  releaseGateMutationAvailable: false,
  gitMutationAvailable: false,
  tagAutomationAvailable: false,
  githubReleaseAutomationAvailable: false
});

const STEP_ID_SET = new Set(SYSTEM_GOLDEN_PATH_STEP_IDS);
const STEP_STATE_SET = new Set(SYSTEM_GOLDEN_PATH_STEP_STATES);
const ACTION_KIND_SET = new Set(SYSTEM_GOLDEN_PATH_ACTION_KINDS);
const ACTION_LABEL_SET = new Set(SYSTEM_GOLDEN_PATH_ACTION_LABELS);
const SOURCE_REF_KIND_SET = new Set(SYSTEM_GOLDEN_PATH_SOURCE_REF_KINDS);
const SOURCE_CONTRACT_NAME_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const UNSAFE_REFERENCE_PATTERN =
  /\b(?:raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log|session[\s_-]*file|model[\s_-]*output)\b|(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\.jsonl(?:$|[/])/iu;
const FORBIDDEN_ACTION_LABELS = new Set([
  'Run Agent',
  'Execute',
  'Launch Provider',
  'Dispatch Child',
  'Compact Now',
  'New Thread',
  'Push',
  'Tag',
  'Publish',
  'Release'
]);
const BLOCKING_STATES = new Set([
  'blocked',
  'missing',
  'stale',
  'degraded'
]);
const ACTION_FORBIDDEN_FIELDS = Object.freeze([
  'executeRoute',
  'confirmRoute',
  'mutationRoute',
  'requestBody',
  'bodyFields',
  'terminalCommand'
]);

export class SystemGoldenPathContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'SystemGoldenPathContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildSystemGoldenPathContract({
  generatedAt = new Date().toISOString(),
  project,
  goal,
  steps,
  sourceContracts,
  routeProvenance,
  boundaries = SYSTEM_GOLDEN_PATH_BOUNDARIES,
  overallState = null,
  nextSafeAction = null,
  blockedReasons = null
} = {}) {
  const normalizedSteps = cloneArray(steps);
  const contract = {
    contractName: SYSTEM_GOLDEN_PATH_CONTRACT_NAME,
    contractVersion: SYSTEM_GOLDEN_PATH_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    project: cloneObject(project),
    goal: cloneObject(goal),
    steps: normalizedSteps,
    overallState: overallState ?? deriveSystemGoldenPathOverallState(normalizedSteps),
    nextSafeAction: cloneObject(nextSafeAction ?? chooseSystemGoldenPathNextSafeAction(normalizedSteps)),
    blockedReasons: blockedReasons ?? collectSystemGoldenPathBlockedReasons(normalizedSteps),
    sourceContracts: cloneArray(sourceContracts),
    routeProvenance: cloneObject(routeProvenance),
    boundaries: cloneObject(boundaries)
  };

  assertSystemGoldenPathContract(contract);

  return contract;
}

export function validateSystemGoldenPathContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return invalidResult('contract must be a plain object');
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'generatedAt',
    'project',
    'goal',
    'steps',
    'overallState',
    'nextSafeAction',
    'blockedReasons',
    'sourceContracts',
    'routeProvenance',
    'boundaries'
  ]) {
    if (!Object.hasOwn(contract, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExact(errors, contract.contractName, 'contractName', SYSTEM_GOLDEN_PATH_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', SYSTEM_GOLDEN_PATH_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  validateProjectBinding(errors, contract.project);
  validateGoalBinding(errors, contract.goal);
  validateSteps(errors, contract.steps);
  requireEnum(errors, contract.overallState, 'overallState', STEP_STATE_SET);
  validateNextSafeAction(errors, contract.nextSafeAction, 'nextSafeAction');
  validateStringArray(errors, contract.blockedReasons, 'blockedReasons');
  validateSourceContracts(errors, contract.sourceContracts);
  validateRouteProvenance(errors, contract.routeProvenance);
  validateBoundaries(errors, contract.boundaries);
  validateUnsafeStringValues(errors, contract, 'contract');

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertSystemGoldenPathContract(contract) {
  const result = validateSystemGoldenPathContract(contract);

  if (!result.ok) {
    throw new SystemGoldenPathContractError(
      'invalid-system-golden-path',
      'System Golden Path contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return contract;
}

export function deriveSystemGoldenPathOverallState(steps = []) {
  const states = Array.isArray(steps)
    ? steps.map((step) => step?.state).filter((state) => STEP_STATE_SET.has(state))
    : [];

  for (const state of ['blocked', 'missing', 'stale', 'degraded']) {
    if (states.includes(state)) {
      return state;
    }
  }

  if (states.includes('pending') && states.includes('manual-required')) {
    return 'manual-required';
  }

  if (states.includes('pending')) {
    return 'pending';
  }

  return 'ready';
}

export function chooseSystemGoldenPathNextSafeAction(steps = []) {
  const blockingStep = Array.isArray(steps)
    ? steps.find((step) => BLOCKING_STATES.has(step?.state))
    : null;

  if (blockingStep !== undefined && blockingStep !== null) {
    return buildSystemGoldenPathRefreshAction({
      reason: blockingStep.blockedReasons?.[0] ?? `${blockingStep.id}-not-ready`
    });
  }

  const manualStep = Array.isArray(steps)
    ? steps.find((step) => step?.state === 'manual-required')
    : null;

  if (manualStep !== undefined && manualStep !== null) {
    return buildSystemGoldenPathManualCliAction({
      reason: `${manualStep.id}-manual-required`
    });
  }

  return buildSystemGoldenPathRefreshAction();
}

export function collectSystemGoldenPathBlockedReasons(steps = []) {
  if (!Array.isArray(steps)) {
    return [];
  }

  return uniqueStrings(
    steps.flatMap((step) => (
      BLOCKING_STATES.has(step?.state) && Array.isArray(step.blockedReasons)
        ? step.blockedReasons
        : []
    ))
  );
}

export function buildSystemGoldenPathRefreshAction({
  reason = 'refresh-state'
} = {}) {
  return {
    kind: 'refresh-state',
    label: 'Refresh State',
    reason,
    method: 'GET',
    routeTemplate: '/api/goals/<goal-id>/supervisor',
    willMutate: false
  };
}

export function buildSystemGoldenPathManualCliAction({
  reason = 'review-gate-manual-required',
  commandName = 'symphony goal review'
} = {}) {
  return {
    kind: 'manual-cli-required',
    label: 'Manual CLI Required',
    reason,
    commandName,
    willMutate: false
  };
}

function validateProjectBinding(errors, project) {
  if (!isPlainObject(project)) {
    errors.push('project must be a plain object');
    return;
  }

  for (const field of [
    'projectId',
    'name',
    'state',
    'selected',
    'sourceContract',
    'sourceRef'
  ]) {
    if (!Object.hasOwn(project, field)) {
      errors.push(`project.${field} is required`);
    }
  }

  requireNullableToken(errors, project.projectId, 'project.projectId');
  requireNullableString(errors, project.name, 'project.name');
  requireEnum(errors, project.state, 'project.state', STEP_STATE_SET);
  requireBoolean(errors, project.selected, 'project.selected');
  validateNullableSourceContractName(errors, project.sourceContract, 'project.sourceContract');
  validateNullableSourceRef(errors, project.sourceRef, 'project.sourceRef');
}

function validateGoalBinding(errors, goal) {
  if (!isPlainObject(goal)) {
    errors.push('goal must be a plain object');
    return;
  }

  for (const field of [
    'goalId',
    'title',
    'taskId',
    'taskLabel',
    'state',
    'sourceContract',
    'sourceRef'
  ]) {
    if (!Object.hasOwn(goal, field)) {
      errors.push(`goal.${field} is required`);
    }
  }

  requireNullableToken(errors, goal.goalId, 'goal.goalId');
  requireNullableString(errors, goal.title, 'goal.title');
  requireNullableToken(errors, goal.taskId, 'goal.taskId');
  requireNullableString(errors, goal.taskLabel, 'goal.taskLabel');
  requireEnum(errors, goal.state, 'goal.state', STEP_STATE_SET);
  validateNullableSourceContractName(errors, goal.sourceContract, 'goal.sourceContract');
  validateNullableSourceRef(errors, goal.sourceRef, 'goal.sourceRef');
}

function validateSteps(errors, steps) {
  if (!Array.isArray(steps)) {
    errors.push('steps must be an array');
    return;
  }

  if (steps.length !== SYSTEM_GOLDEN_PATH_STEP_IDS.length) {
    errors.push('steps must contain every required system golden path step');
  }

  const seenIds = new Set();

  steps.forEach((step, index) => {
    const path = `steps[${index}]`;

    if (!isPlainObject(step)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    for (const field of [
      'id',
      'label',
      'state',
      'sourceContract',
      'sourceRef',
      'blockedReasons',
      'nextSafeAction',
      'willMutate'
    ]) {
      if (!Object.hasOwn(step, field)) {
        errors.push(`${path}.${field} is required`);
      }
    }

    requireEnum(errors, step.id, `${path}.id`, STEP_ID_SET);
    requireNonEmptyString(errors, step.label, `${path}.label`);
    requireEnum(errors, step.state, `${path}.state`, STEP_STATE_SET);
    validateNullableSourceContractName(errors, step.sourceContract, `${path}.sourceContract`);
    validateNullableSourceRef(errors, step.sourceRef, `${path}.sourceRef`);
    validateStringArray(errors, step.blockedReasons, `${path}.blockedReasons`);
    validateNextSafeAction(errors, step.nextSafeAction, `${path}.nextSafeAction`);
    requireExact(errors, step.willMutate, `${path}.willMutate`, false);

    if (STEP_ID_SET.has(step.id)) {
      if (seenIds.has(step.id)) {
        errors.push(`${path}.id must be unique`);
      }
      seenIds.add(step.id);
    }

    if (SYSTEM_GOLDEN_PATH_STEP_IDS[index] !== step.id) {
      errors.push(`${path}.id must be ${SYSTEM_GOLDEN_PATH_STEP_IDS[index]}`);
    }

    if (BLOCKING_STATES.has(step.state) && step.blockedReasons.length === 0) {
      errors.push(`${path}.blockedReasons must explain ${step.state} state`);
    }
  });

  for (const stepId of SYSTEM_GOLDEN_PATH_STEP_IDS) {
    if (!seenIds.has(stepId)) {
      errors.push(`steps must include ${stepId}`);
    }
  }

  const reviewGate = steps.find((step) => step?.id === 'review-gate');

  if (reviewGate?.state !== 'manual-required') {
    errors.push('steps review-gate must default to manual-required');
  }
}

function validateNextSafeAction(errors, action, path) {
  if (!isPlainObject(action)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  for (const field of [
    'kind',
    'label',
    'willMutate'
  ]) {
    if (!Object.hasOwn(action, field)) {
      errors.push(`${path}.${field} is required`);
    }
  }

  for (const field of ACTION_FORBIDDEN_FIELDS) {
    if (Object.hasOwn(action, field)) {
      errors.push(`${path}.${field} is not allowed`);
    }
  }

  requireEnum(errors, action.kind, `${path}.kind`, ACTION_KIND_SET);
  requireEnum(errors, action.label, `${path}.label`, ACTION_LABEL_SET);
  requireExact(errors, action.willMutate, `${path}.willMutate`, false);

  if (FORBIDDEN_ACTION_LABELS.has(action.label)) {
    errors.push(`${path}.label must not be a forbidden action label`);
  }

  if (action.kind === 'refresh-state') {
    requireExact(errors, action.method, `${path}.method`, 'GET');
    requireNonEmptyString(errors, action.routeTemplate, `${path}.routeTemplate`);
  }

  if (action.kind === 'manual-cli-required') {
    requireNonEmptyString(errors, action.commandName, `${path}.commandName`);
  }
}

function validateSourceContracts(errors, sourceContracts) {
  if (!Array.isArray(sourceContracts) || sourceContracts.length === 0) {
    errors.push('sourceContracts must be a non-empty array');
    return;
  }

  sourceContracts.forEach((contract, index) => {
    const path = `sourceContracts[${index}]`;

    if (!isPlainObject(contract)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireSafeSourceContractName(errors, contract.contractName, `${path}.contractName`);

    if (contract.contractVersion !== undefined && !Number.isInteger(contract.contractVersion)) {
      errors.push(`${path}.contractVersion must be an integer`);
    }

    if (contract.readOnly !== undefined) {
      requireExact(errors, contract.readOnly, `${path}.readOnly`, true);
    }

    if (contract.generatedAt !== undefined) {
      requireIsoTimestamp(errors, contract.generatedAt, `${path}.generatedAt`);
    }

    if (contract.requiredFor !== undefined) {
      validateStepIdArray(errors, contract.requiredFor, `${path}.requiredFor`);
    }

    if (contract.sourceRef !== undefined) {
      validateSourceRef(errors, contract.sourceRef, `${path}.sourceRef`);
    }
  });
}

function validateRouteProvenance(errors, routeProvenance) {
  if (!isPlainObject(routeProvenance)) {
    errors.push('routeProvenance must be a plain object');
    return;
  }

  requireNonEmptyString(errors, routeProvenance.source, 'routeProvenance.source');
  requireEnum(
    errors,
    routeProvenance.readModelOwner,
    'routeProvenance.readModelOwner',
    new Set(['backend'])
  );
  requireEnum(
    errors,
    routeProvenance.workbenchSurface,
    'routeProvenance.workbenchSurface',
    new Set(['/workbench/desktop/', '/workbench/supervisor/'])
  );
  requireNonEmptyString(errors, routeProvenance.refreshRouteTemplate, 'routeProvenance.refreshRouteTemplate');
  requireExact(errors, routeProvenance.refreshMethod, 'routeProvenance.refreshMethod', 'GET');
  requireExact(errors, routeProvenance.frontendLocalFileReads, 'routeProvenance.frontendLocalFileReads', false);

  if (!Array.isArray(routeProvenance.mutationRoutes)) {
    errors.push('routeProvenance.mutationRoutes must be an array');
  } else if (routeProvenance.mutationRoutes.length !== 0) {
    errors.push('routeProvenance.mutationRoutes must be empty');
  }
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  for (const [field, expected] of Object.entries(SYSTEM_GOLDEN_PATH_BOUNDARIES)) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, expected);
  }
}

function validateNullableSourceContractName(errors, value, path) {
  if (value === null) {
    return;
  }

  requireSafeSourceContractName(errors, value, path);
}

function requireSafeSourceContractName(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && !SOURCE_CONTRACT_NAME_PATTERN.test(value.trim())) {
    errors.push(`${path} must be a safe contract name`);
  }
}

function validateNullableSourceRef(errors, value, path) {
  if (value === null) {
    return;
  }

  validateSourceRef(errors, value, path);
}

function validateSourceRef(errors, sourceRef, path) {
  if (!isPlainObject(sourceRef)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, sourceRef.kind, `${path}.kind`, SOURCE_REF_KIND_SET);
  requireNonEmptyString(errors, sourceRef.ref, `${path}.ref`);

  if (sourceRef.label !== undefined) {
    requireNonEmptyString(errors, sourceRef.label, `${path}.label`);
  }

  if (sourceRef.generatedAt !== undefined) {
    requireIsoTimestamp(errors, sourceRef.generatedAt, `${path}.generatedAt`);
  }
}

function validateStepIdArray(errors, values, path) {
  if (!Array.isArray(values)) {
    errors.push(`${path} must be an array`);
    return;
  }

  values.forEach((value, index) => {
    requireEnum(errors, value, `${path}[${index}]`, STEP_ID_SET);
  });
}

function validateStringArray(errors, values, path) {
  if (!Array.isArray(values)) {
    errors.push(`${path} must be an array`);
    return;
  }

  values.forEach((value, index) => {
    requireNonEmptyString(errors, value, `${path}[${index}]`);
  });
}

function validateUnsafeStringValues(errors, value, path) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateUnsafeStringValues(errors, entry, `${path}[${index}]`));
    return;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, entry]) => {
      validateUnsafeStringValues(errors, entry, `${path}.${key}`);
    });
    return;
  }

  if (typeof value === 'string' && UNSAFE_REFERENCE_PATTERN.test(value)) {
    errors.push(`${path} must not contain raw transcript, model output, or local session references`);
  }
}

function requireNullableToken(errors, value, path) {
  if (value === null) {
    return;
  }

  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && !/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u.test(value.trim())) {
    errors.push(`${path} must be a safe token`);
  }
}

function requireNullableString(errors, value, path) {
  if (value === null) {
    return;
  }

  requireNonEmptyString(errors, value, path);
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireEnum(errors, value, path, allowed) {
  if (!allowed.has(value)) {
    errors.push(`${path} must be one of ${[...allowed].join(', ')}`);
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value !== 'string') {
    return;
  }

  const time = Date.parse(value);

  if (Number.isNaN(time) || new Date(time).toISOString() !== value) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function millisOrNow(value) {
  const ms = Date.parse(value);

  return Number.isNaN(ms) ? Date.now() : ms;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim() !== ''))];
}

function cloneArray(value) {
  return Array.isArray(value) ? structuredClone(value) : [];
}

function cloneObject(value) {
  return isPlainObject(value) ? structuredClone(value) : value;
}

function invalidResult(message) {
  return {
    ok: false,
    errors: [message]
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
