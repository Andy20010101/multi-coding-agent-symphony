import { GOAL_EVENT_TYPES } from './goal-event-contracts.js';

export const ACTION_MANIFEST_CONTRACT_NAME = 'action-manifest.v1';
export const ACTION_MANIFEST_CONTRACT_VERSION = 1;

const ACTION_SCOPES = Object.freeze([
  'active-goal',
  'active-task',
  'release'
]);
const ACTION_ROLES = Object.freeze([
  'worker',
  'reviewer',
  'main-verifier',
  'release-verifier',
  'operator'
]);
const ACTION_AVAILABILITY_STATES = Object.freeze([
  'available',
  'blocked',
  'preview-required'
]);
const EVIDENCE_REF_FIELDS = Object.freeze([
  'workerEvidenceRef',
  'reviewEvidenceRef',
  'mainVerificationRef',
  'releaseEvidenceRef'
]);

export function buildActionManifestContract({
  goalId = 'latest',
  taskId = null,
  generatedAt = new Date().toISOString()
} = {}) {
  return assertActionManifestContract({
    contractName: ACTION_MANIFEST_CONTRACT_NAME,
    contractVersion: ACTION_MANIFEST_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      taskId,
      sourceContracts: [
        'goal-runbook.v1',
        'goal-next-action.v1',
        'goal-progress-ledger.v1',
        'goal-event-log.v1',
        'goal-update-plan.v1'
      ],
      stateSource: 'explicit-backend-contracts'
    },
    actions: [
      buildAction({
        action_id: 'goal.worker-evidence.record',
        label: 'Record worker evidence',
        scope: 'active-task',
        role: 'worker',
        requiredContext: ['goalId', 'taskId', 'workerEvidenceRef'],
        eventType: 'worker.evidence-recorded',
        commandName: 'symphony goal update',
        evidenceRefField: 'workerEvidenceRef'
      }),
      buildAction({
        action_id: 'goal.review-verdict.record',
        label: 'Record review verdict',
        scope: 'active-task',
        role: 'reviewer',
        requiredContext: ['goalId', 'taskId', 'reviewerId', 'verdict', 'reviewEvidenceRef'],
        eventType: 'reviewer.approved',
        alternateEventTypes: ['reviewer.needs-revision'],
        commandName: 'symphony goal review',
        evidenceRefField: 'reviewEvidenceRef'
      }),
      buildAction({
        action_id: 'goal.main-verification-gate.record',
        label: 'Record main verification gate',
        scope: 'active-task',
        role: 'main-verifier',
        requiredContext: ['goalId', 'taskId', 'verifierId', 'mainVerificationRef'],
        eventType: 'main.verification-passed',
        alternateEventTypes: ['main.verification-failed'],
        commandName: 'symphony goal gate',
        evidenceRefField: 'mainVerificationRef'
      }),
      buildAction({
        action_id: 'goal.release-gate.record',
        label: 'Record release gate evidence',
        scope: 'release',
        role: 'release-verifier',
        requiredContext: ['goalId', 'gateId', 'verifierId', 'releaseEvidenceRef'],
        eventType: 'release.gate-passed',
        alternateEventTypes: ['release.gate-failed', 'release.evidence-recorded'],
        commandName: 'symphony goal gate',
        evidenceRefField: 'releaseEvidenceRef'
      }),
      buildAction({
        action_id: 'goal.implementation.preview',
        label: 'Preview controlled implementation',
        scope: 'active-task',
        role: 'operator',
        requiredContext: ['goalId', 'taskId'],
        eventType: null,
        commandName: 'symphony do --write',
        evidenceRefField: null,
        previewContract: 'controlled-implementation-plan-preview.v1',
        confirmationContract: 'controlled-implementation-run-confirmation.v1'
      })
    ],
    boundaries: actionManifestBoundaries()
  });
}

export function validateActionManifestContract(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    return { ok: false, errors: ['manifest must be a plain object'] };
  }

  requireExact(errors, manifest.contractName, 'contractName', ACTION_MANIFEST_CONTRACT_NAME);
  requireExact(errors, manifest.contractVersion, 'contractVersion', ACTION_MANIFEST_CONTRACT_VERSION);
  requireIsoTimestamp(errors, manifest.generatedAt, 'generatedAt');
  requireExact(errors, manifest.readOnly, 'readOnly', true);
  validateContext(errors, manifest.context);
  validateActions(errors, manifest.actions);
  validateBoundaries(errors, manifest.boundaries, 'boundaries');

  return { ok: errors.length === 0, errors };
}

export function assertActionManifestContract(manifest) {
  const result = validateActionManifestContract(manifest);

  if (!result.ok) {
    throw new Error(`Invalid action manifest contract: ${result.errors.join('; ')}`);
  }

  return manifest;
}

function buildAction({
  action_id,
  label,
  scope,
  role,
  requiredContext,
  eventType,
  alternateEventTypes = [],
  commandName,
  evidenceRefField,
  previewContract = 'action-capability-preview.v1',
  confirmationContract = 'goal-update-plan.v1'
}) {
  return {
    action_id,
    label,
    scope,
    role,
    availability: {
      defaultState: 'preview-required',
      resolverContract: 'action-availability.v1',
      requiredContext
    },
    capabilityPreview: {
      contractName: previewContract,
      sideEffectsInPreview: false,
      requiredBeforeConfirm: true
    },
    eventMapping: {
      commandName,
      primaryEventType: eventType,
      alternateEventTypes,
      confirmationContract,
      appendOnlyOnConfirm: true
    },
    evidenceExpectations: {
      required: evidenceRefField !== null,
      evidenceRefField,
      bodyReadAvailable: false
    },
    execution: {
      enabled: false,
      rawShellCommandAvailable: false,
      arbitraryCommandAvailable: false,
      modelInvocationAvailable: false,
      gitWriteAvailable: false,
      selfApprovalAvailable: false
    }
  };
}

function actionManifestBoundaries() {
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

  requireSafeRef(errors, context.goalId, 'context.goalId');

  if (context.taskId !== null) {
    requireSafeRef(errors, context.taskId, 'context.taskId');
  }

  if (!Array.isArray(context.sourceContracts) || context.sourceContracts.length === 0) {
    errors.push('context.sourceContracts must be a non-empty array');
  } else {
    context.sourceContracts.forEach((contractName, index) => {
      requireContractName(errors, contractName, `context.sourceContracts[${index}]`);
    });
  }

  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
}

function validateActions(errors, actions) {
  if (!Array.isArray(actions) || actions.length === 0) {
    errors.push('actions must be a non-empty array');
    return;
  }

  const actionIds = new Set();

  actions.forEach((action, index) => {
    const path = `actions[${index}]`;

    if (!isPlainObject(action)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireActionId(errors, action.action_id, `${path}.action_id`);
    requireNonEmptyString(errors, action.label, `${path}.label`);
    requireEnum(errors, action.scope, `${path}.scope`, ACTION_SCOPES);
    requireEnum(errors, action.role, `${path}.role`, ACTION_ROLES);
    validateAvailability(errors, action.availability, `${path}.availability`);
    validateCapabilityPreview(errors, action.capabilityPreview, `${path}.capabilityPreview`);
    validateEventMapping(errors, action.eventMapping, `${path}.eventMapping`);
    validateEvidenceExpectations(errors, action.evidenceExpectations, `${path}.evidenceExpectations`);
    validateExecution(errors, action.execution, `${path}.execution`);

    if (isNonEmptyString(action.action_id)) {
      if (actionIds.has(action.action_id)) {
        errors.push(`${path}.action_id must be unique`);
      }

      actionIds.add(action.action_id);
    }
  });
}

function validateAvailability(errors, availability, path) {
  if (!isPlainObject(availability)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, availability.defaultState, `${path}.defaultState`, ACTION_AVAILABILITY_STATES);
  requireContractName(errors, availability.resolverContract, `${path}.resolverContract`);

  if (!Array.isArray(availability.requiredContext) || availability.requiredContext.length === 0) {
    errors.push(`${path}.requiredContext must be a non-empty array`);
  } else {
    availability.requiredContext.forEach((field, index) => requireSafeRef(errors, field, `${path}.requiredContext[${index}]`));
  }
}

function validateCapabilityPreview(errors, preview, path) {
  if (!isPlainObject(preview)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireContractName(errors, preview.contractName, `${path}.contractName`);
  requireExact(errors, preview.sideEffectsInPreview, `${path}.sideEffectsInPreview`, false);
  requireExact(errors, preview.requiredBeforeConfirm, `${path}.requiredBeforeConfirm`, true);
}

function validateEventMapping(errors, mapping, path) {
  if (!isPlainObject(mapping)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireNonEmptyString(errors, mapping.commandName, `${path}.commandName`);

  if (mapping.primaryEventType !== null) {
    requireEnum(errors, mapping.primaryEventType, `${path}.primaryEventType`, GOAL_EVENT_TYPES);
  }

  if (!Array.isArray(mapping.alternateEventTypes)) {
    errors.push(`${path}.alternateEventTypes must be an array`);
  } else {
    mapping.alternateEventTypes.forEach((eventType, index) => {
      requireEnum(errors, eventType, `${path}.alternateEventTypes[${index}]`, GOAL_EVENT_TYPES);
    });
  }

  requireContractName(errors, mapping.confirmationContract, `${path}.confirmationContract`);
  requireExact(errors, mapping.appendOnlyOnConfirm, `${path}.appendOnlyOnConfirm`, true);
}

function validateEvidenceExpectations(errors, expectations, path) {
  if (!isPlainObject(expectations)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  if (typeof expectations.required !== 'boolean') {
    errors.push(`${path}.required must be a boolean`);
  }

  if (expectations.evidenceRefField !== null) {
    requireEnum(errors, expectations.evidenceRefField, `${path}.evidenceRefField`, EVIDENCE_REF_FIELDS);
  }

  if (expectations.required === true && expectations.evidenceRefField === null) {
    errors.push(`${path}.evidenceRefField is required when evidence is required`);
  }

  requireExact(errors, expectations.bodyReadAvailable, `${path}.bodyReadAvailable`, false);
}

function validateExecution(errors, execution, path) {
  if (!isPlainObject(execution)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  for (const field of [
    'enabled',
    'rawShellCommandAvailable',
    'arbitraryCommandAvailable',
    'modelInvocationAvailable',
    'gitWriteAvailable',
    'selfApprovalAvailable'
  ]) {
    requireExact(errors, execution[field], `${path}.${field}`, false);
  }
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
  if (!isNonEmptyString(value)) {
    errors.push(`${path} must be a non-empty string`);
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

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
