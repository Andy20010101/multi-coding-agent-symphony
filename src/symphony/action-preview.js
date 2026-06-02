import { buildActionAvailabilityContract } from './action-availability.js';

export const ACTION_PREVIEW_CONTRACT_NAME = 'action-preview.v1';
export const ACTION_PREVIEW_CONTRACT_VERSION = 1;

const PREVIEW_STATES = Object.freeze([
  'available',
  'unavailable',
  'blocked'
]);

export async function buildActionPreviewContract({
  stateDir = '.symphony',
  goalId = 'latest',
  taskId,
  actionId = null,
  generatedAt = new Date().toISOString()
} = {}) {
  if (actionId !== null && !isSafeActionId(actionId)) {
    throw new Error('action preview actionId must be a safe action id');
  }

  const availability = await buildActionAvailabilityContract({
    stateDir,
    goalId,
    taskId,
    generatedAt
  });
  const selectedActions = actionId === null
    ? availability.actions
    : availability.actions.filter((action) => action.action_id === actionId);
  const actions = selectedActions.map((action) => buildPreviewAction(action));
  const blockers = [
    ...availability.blockers,
    ...(actionId !== null && actions.length === 0
      ? [{
          code: 'action-not-found',
          message: `Action ${actionId} is not declared in action-manifest.v1.`,
          source: 'action-manifest.v1'
        }]
      : [])
  ];

  return assertActionPreviewContract({
    contractName: ACTION_PREVIEW_CONTRACT_NAME,
    contractVersion: ACTION_PREVIEW_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId: availability.context.goalId,
      taskId: availability.context.taskId,
      actionId,
      sourceContracts: [
        'action-manifest.v1',
        'action-availability.v1',
        'goal-next-action.v1',
        'goal-progress-ledger.v1'
      ],
      stateSource: 'explicit-backend-contracts',
      nextAction: availability.context.nextAction,
      evidenceState: availability.context.evidenceState
    },
    actions,
    capabilities: actions.map((action) => action.capability),
    requiredConfirmations: actions.map((action) => action.requiredConfirmation),
    blockers,
    endpoint: {
      method: 'GET',
      route: '/api/actions/preview',
      allowedQueryFields: ['goal', 'task', 'action'],
      rejectsPromptInput: true,
      rejectsPlanHashInput: true,
      rejectsConfirmInput: true,
      writesInPreview: false,
      genericShellRunner: false
    },
    boundaries: actionPreviewBoundaries()
  });
}

export function validateActionPreviewContract(preview) {
  const errors = [];

  if (!isPlainObject(preview)) {
    return { ok: false, errors: ['preview must be a plain object'] };
  }

  requireExact(errors, preview.contractName, 'contractName', ACTION_PREVIEW_CONTRACT_NAME);
  requireExact(errors, preview.contractVersion, 'contractVersion', ACTION_PREVIEW_CONTRACT_VERSION);
  requireIsoTimestamp(errors, preview.generatedAt, 'generatedAt');
  requireExact(errors, preview.readOnly, 'readOnly', true);
  validateContext(errors, preview.context);
  validatePreviewActions(errors, preview.actions);
  validateCapabilities(errors, preview.capabilities);
  validateRequiredConfirmations(errors, preview.requiredConfirmations);
  validateReasons(errors, preview.blockers, 'blockers');
  validateEndpoint(errors, preview.endpoint, 'endpoint');
  validateBoundaries(errors, preview.boundaries, 'boundaries');

  return { ok: errors.length === 0, errors };
}

export function assertActionPreviewContract(preview) {
  const result = validateActionPreviewContract(preview);

  if (!result.ok) {
    throw new Error(`Invalid action preview contract: ${result.errors.join('; ')}`);
  }

  return preview;
}

export function isSafeActionPreviewId(value) {
  return value === null || isSafeActionId(value);
}

function buildPreviewAction(action) {
  const eventTypes = [
    action.eventMapping.primaryEventType,
    ...action.eventMapping.alternateEventTypes
  ].filter((eventType) => eventType !== null);
  const capability = {
    action_id: action.action_id,
    previewContract: action.preview.contractName,
    confirmationContract: action.eventMapping.confirmationContract,
    state: action.state,
    available: action.state === 'available',
    requiredBeforeConfirm: action.preview.requiredBeforeConfirm,
    sideEffectsInPreview: action.preview.sideEffectsInPreview,
    executionEnabled: action.execution.enabled
  };
  const requiredConfirmation = {
    action_id: action.action_id,
    commandName: action.eventMapping.commandName,
    confirmationContract: action.eventMapping.confirmationContract,
    requiredInputs: action.requiredInputs,
    evidenceRequired: action.evidenceExpectations.required,
    evidenceRefField: action.evidenceExpectations.evidenceRefField,
    eventTypes,
    appendOnlyOnConfirm: action.eventMapping.appendOnlyOnConfirm,
    requiresPreview: true,
    requiresPlanHash: true,
    available: action.state === 'available'
  };

  return {
    action_id: action.action_id,
    label: action.label,
    scope: action.scope,
    role: action.role,
    state: action.state,
    reasons: action.reasons,
    requiredContext: action.requiredContext,
    missingContext: action.missingContext,
    requiredInputs: action.requiredInputs,
    capability,
    requiredConfirmation,
    impactPreview: {
      writesInPreview: false,
      writesGoalEventOnConfirm: eventTypes.length > 0,
      eventTypes,
      readsEvidenceBody: false,
      startsImplementationRun: false,
      changesMainWorktree: false,
      executionAvailable: false,
      publishAvailable: false,
      selfApprovalAvailable: false
    }
  };
}

function actionPreviewBoundaries() {
  return {
    readOnly: true,
    actionExecutionAvailable: false,
    jobQueueAvailable: false,
    modelInvocationAvailable: false,
    arbitraryCommandExecutionAvailable: false,
    arbitraryPathReadAvailable: false,
    gitWriteAvailable: false,
    mergeAvailable: false,
    pushAvailable: false,
    tagAvailable: false,
    publishAvailable: false,
    selfApprovalAvailable: false
  };
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeNullableRef(errors, context.goalId, 'context.goalId');
  requireSafeNullableRef(errors, context.taskId, 'context.taskId');

  if (context.actionId !== null && !isSafeActionId(context.actionId)) {
    errors.push('context.actionId must be null or a safe action id');
  }

  validateStringArray(errors, context.sourceContracts, 'context.sourceContracts');
  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requirePlainObject(errors, context.nextAction, 'context.nextAction');
  requirePlainObject(errors, context.evidenceState, 'context.evidenceState');
}

function validatePreviewActions(errors, actions) {
  if (!Array.isArray(actions)) {
    errors.push('actions must be an array');
    return;
  }

  const actionIds = new Set();

  actions.forEach((action, index) => {
    const path = `actions[${index}]`;

    if (!isPlainObject(action)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireSafeActionId(errors, action.action_id, `${path}.action_id`);
    requireNonEmptyString(errors, action.label, `${path}.label`);
    requireNonEmptyString(errors, action.scope, `${path}.scope`);
    requireNonEmptyString(errors, action.role, `${path}.role`);
    requireEnum(errors, action.state, `${path}.state`, PREVIEW_STATES);
    validateReasons(errors, action.reasons, `${path}.reasons`);
    validateStringArray(errors, action.requiredContext, `${path}.requiredContext`);
    validateStringArray(errors, action.missingContext, `${path}.missingContext`);
    validateStringArray(errors, action.requiredInputs, `${path}.requiredInputs`);
    validateCapability(errors, action.capability, `${path}.capability`);
    validateRequiredConfirmation(errors, action.requiredConfirmation, `${path}.requiredConfirmation`);
    validateImpactPreview(errors, action.impactPreview, `${path}.impactPreview`);

    if (actionIds.has(action.action_id)) {
      errors.push(`${path}.action_id must be unique`);
    }

    actionIds.add(action.action_id);
  });
}

function validateCapabilities(errors, capabilities) {
  if (!Array.isArray(capabilities)) {
    errors.push('capabilities must be an array');
    return;
  }

  capabilities.forEach((capability, index) => validateCapability(errors, capability, `capabilities[${index}]`));
}

function validateCapability(errors, capability, path) {
  if (!isPlainObject(capability)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireSafeActionId(errors, capability.action_id, `${path}.action_id`);
  requireContractName(errors, capability.previewContract, `${path}.previewContract`);
  requireContractName(errors, capability.confirmationContract, `${path}.confirmationContract`);
  requireEnum(errors, capability.state, `${path}.state`, PREVIEW_STATES);

  for (const field of [
    'available',
    'requiredBeforeConfirm',
    'sideEffectsInPreview',
    'executionEnabled'
  ]) {
    if (typeof capability[field] !== 'boolean') {
      errors.push(`${path}.${field} must be a boolean`);
    }
  }

  requireExact(errors, capability.sideEffectsInPreview, `${path}.sideEffectsInPreview`, false);
  requireExact(errors, capability.executionEnabled, `${path}.executionEnabled`, false);
}

function validateRequiredConfirmations(errors, confirmations) {
  if (!Array.isArray(confirmations)) {
    errors.push('requiredConfirmations must be an array');
    return;
  }

  confirmations.forEach((confirmation, index) => validateRequiredConfirmation(errors, confirmation, `requiredConfirmations[${index}]`));
}

function validateRequiredConfirmation(errors, confirmation, path) {
  if (!isPlainObject(confirmation)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireSafeActionId(errors, confirmation.action_id, `${path}.action_id`);
  requireNonEmptyString(errors, confirmation.commandName, `${path}.commandName`);
  requireContractName(errors, confirmation.confirmationContract, `${path}.confirmationContract`);
  validateStringArray(errors, confirmation.requiredInputs, `${path}.requiredInputs`);

  if (typeof confirmation.evidenceRequired !== 'boolean') {
    errors.push(`${path}.evidenceRequired must be a boolean`);
  }

  if (confirmation.evidenceRefField !== null) {
    requireSafeNullableRef(errors, confirmation.evidenceRefField, `${path}.evidenceRefField`);
  }

  validateStringArray(errors, confirmation.eventTypes, `${path}.eventTypes`);
  requireExact(errors, confirmation.appendOnlyOnConfirm, `${path}.appendOnlyOnConfirm`, true);
  requireExact(errors, confirmation.requiresPreview, `${path}.requiresPreview`, true);
  requireExact(errors, confirmation.requiresPlanHash, `${path}.requiresPlanHash`, true);

  if (typeof confirmation.available !== 'boolean') {
    errors.push(`${path}.available must be a boolean`);
  }
}

function validateImpactPreview(errors, impact, path) {
  if (!isPlainObject(impact)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireExact(errors, impact.writesInPreview, `${path}.writesInPreview`, false);

  if (typeof impact.writesGoalEventOnConfirm !== 'boolean') {
    errors.push(`${path}.writesGoalEventOnConfirm must be a boolean`);
  }

  validateStringArray(errors, impact.eventTypes, `${path}.eventTypes`);

  for (const field of [
    'readsEvidenceBody',
    'startsImplementationRun',
    'changesMainWorktree',
    'executionAvailable',
    'publishAvailable',
    'selfApprovalAvailable'
  ]) {
    requireExact(errors, impact[field], `${path}.${field}`, false);
  }
}

function validateEndpoint(errors, endpoint, path) {
  if (!isPlainObject(endpoint)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireExact(errors, endpoint.method, `${path}.method`, 'GET');
  requireExact(errors, endpoint.route, `${path}.route`, '/api/actions/preview');
  validateStringArray(errors, endpoint.allowedQueryFields, `${path}.allowedQueryFields`);

  for (const field of [
    'rejectsPromptInput',
    'rejectsPlanHashInput',
    'rejectsConfirmInput'
  ]) {
    requireExact(errors, endpoint[field], `${path}.${field}`, true);
  }

  requireExact(errors, endpoint.writesInPreview, `${path}.writesInPreview`, false);
  requireExact(errors, endpoint.genericShellRunner, `${path}.genericShellRunner`, false);
}

function validateBoundaries(errors, boundaries, path) {
  if (!isPlainObject(boundaries)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireExact(errors, boundaries.readOnly, `${path}.readOnly`, true);

  for (const field of [
    'actionExecutionAvailable',
    'jobQueueAvailable',
    'modelInvocationAvailable',
    'arbitraryCommandExecutionAvailable',
    'arbitraryPathReadAvailable',
    'gitWriteAvailable',
    'mergeAvailable',
    'pushAvailable',
    'tagAvailable',
    'publishAvailable',
    'selfApprovalAvailable'
  ]) {
    requireExact(errors, boundaries[field], `${path}.${field}`, false);
  }
}

function validateReasons(errors, reasons, path) {
  if (!Array.isArray(reasons)) {
    errors.push(`${path} must be an array`);
    return;
  }

  reasons.forEach((item, index) => {
    const reasonPath = `${path}[${index}]`;

    if (!isPlainObject(item)) {
      errors.push(`${reasonPath} must be a plain object`);
      return;
    }

    requireSafeActionId(errors, item.code, `${reasonPath}.code`);
    requireNonEmptyString(errors, item.message, `${reasonPath}.message`);
    requireNonEmptyString(errors, item.source, `${reasonPath}.source`);
  });
}

function requirePlainObject(errors, value, path) {
  if (!isPlainObject(value)) {
    errors.push(`${path} must be a plain object`);
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

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireSafeNullableRef(errors, value, path) {
  if (value !== null && (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value))) {
    errors.push(`${path} must be null or a safe ref`);
  }
}

function requireSafeActionId(errors, value, path) {
  if (!isSafeActionId(value)) {
    errors.push(`${path} must be a safe action id`);
  }
}

function requireContractName(errors, value, path) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]*(?:\.[a-z0-9-]+)*$/u.test(value)) {
    errors.push(`${path} must be a contract name`);
  }
}

function validateStringArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((item, index) => requireNonEmptyString(errors, item, `${path}[${index}]`));
}

function isSafeActionId(value) {
  return typeof value === 'string' && /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u.test(value);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
