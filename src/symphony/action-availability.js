import { buildActionManifestContract } from './action-manifest.js';
import { buildGoalNextAction } from './goal-next-action-resolver.js';
import { buildGoalProgressLedger } from './goal-progress-ledger.js';

export const ACTION_AVAILABILITY_CONTRACT_NAME = 'action-availability.v1';
export const ACTION_AVAILABILITY_CONTRACT_VERSION = 1;

const AVAILABILITY_STATES = Object.freeze([
  'available',
  'unavailable',
  'blocked'
]);
const OPERATOR_INPUT_FIELDS = Object.freeze([
  'workerEvidenceRef',
  'reviewEvidenceRef',
  'mainVerificationRef',
  'releaseEvidenceRef',
  'reviewerId',
  'verdict',
  'verifierId',
  'gateId'
]);

export async function buildActionAvailabilityContract({
  stateDir = '.symphony',
  goalId = 'latest',
  taskId,
  generatedAt = new Date().toISOString()
} = {}) {
  const [ledger, nextAction] = await Promise.all([
    buildGoalProgressLedger({ stateDir, goalId, generatedAt }),
    buildGoalNextAction({ stateDir, goalId, generatedAt })
  ]);
  const resolvedGoalId = ledger?.goalId ?? nextAction.goalId ?? goalId;
  const resolvedTaskId = taskId ?? nextAction.next?.taskId ?? null;
  const manifest = buildActionManifestContract({
    goalId: resolvedGoalId,
    taskId: resolvedTaskId,
    generatedAt
  });
  const currentTask = ledger?.tasks.find((task) => task.taskId === resolvedTaskId) ?? null;

  return assertActionAvailabilityContract({
    contractName: ACTION_AVAILABILITY_CONTRACT_NAME,
    contractVersion: ACTION_AVAILABILITY_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId: resolvedGoalId,
      taskId: resolvedTaskId,
      sourceContracts: [
        manifest.contractName,
        ledger?.contractName ?? 'goal-progress-ledger.v1',
        nextAction.contractName
      ],
      nextAction: summarizeNextAction(nextAction),
      currentTask: summarizeCurrentTask(currentTask),
      evidenceState: nextAction.evidenceState
    },
    actions: manifest.actions.map((action) => resolveActionAvailability({
      action,
      resolvedTaskId,
      currentTask,
      nextAction
    })),
    blockers: buildContractBlockers({ ledger, nextAction, resolvedTaskId }),
    boundaries: availabilityBoundaries()
  });
}

export function validateActionAvailabilityContract(availability) {
  const errors = [];

  if (!isPlainObject(availability)) {
    return { ok: false, errors: ['availability must be a plain object'] };
  }

  requireExact(errors, availability.contractName, 'contractName', ACTION_AVAILABILITY_CONTRACT_NAME);
  requireExact(errors, availability.contractVersion, 'contractVersion', ACTION_AVAILABILITY_CONTRACT_VERSION);
  requireIsoTimestamp(errors, availability.generatedAt, 'generatedAt');
  requireExact(errors, availability.readOnly, 'readOnly', true);
  validateContext(errors, availability.context);
  validateActions(errors, availability.actions);
  validateBlockers(errors, availability.blockers);
  validateBoundaries(errors, availability.boundaries, 'boundaries');

  return { ok: errors.length === 0, errors };
}

export function assertActionAvailabilityContract(availability) {
  const result = validateActionAvailabilityContract(availability);

  if (!result.ok) {
    throw new Error(`Invalid action availability contract: ${result.errors.join('; ')}`);
  }

  return availability;
}

function resolveActionAvailability({
  action,
  resolvedTaskId,
  currentTask,
  nextAction
}) {
  const reasons = [];
  const missingContext = [];
  const requiredInputs = [];
  const activeNext = nextAction.next;

  if (resolvedTaskId === null) {
    missingContext.push('taskId');
    reasons.push(reason('task-context-missing', 'No active task context is available.', 'goal-next-action.v1'));
  }

  if (currentTask === null && resolvedTaskId !== null) {
    reasons.push(reason('task-not-found', `Task ${resolvedTaskId} is not present in the goal progress ledger.`, 'goal-progress-ledger.v1'));
  }

  if (activeNext?.blocked === true || nextAction.status === 'blocked') {
    reasons.push(reason('next-action-blocked', nextAction.reason, 'goal-next-action.v1'));
  }

  if (action.scope === 'active-task' && activeNext?.taskId !== resolvedTaskId) {
    reasons.push(reason('different-active-task', 'This action is unavailable because the next action points at a different task.', 'goal-next-action.v1'));
  }

  for (const field of action.availability.requiredContext) {
    if (OPERATOR_INPUT_FIELDS.includes(field)) {
      requiredInputs.push(field);
      continue;
    }

    if (!hasRequiredContext({ field, resolvedTaskId, currentTask })) {
      missingContext.push(field);
    }
  }

  applyActionSpecificReasons({
    action,
    reasons,
    activeNext,
    currentTask
  });

  const state = reasons.length === 0 && missingContext.length === 0
    ? 'available'
    : nextAction.status === 'blocked'
      ? 'blocked'
      : 'unavailable';

  return {
    action_id: action.action_id,
    label: action.label,
    scope: action.scope,
    role: action.role,
    state,
    reasons,
    requiredContext: action.availability.requiredContext,
    missingContext,
    requiredInputs,
    eventMapping: action.eventMapping,
    evidenceExpectations: action.evidenceExpectations,
    preview: {
      contractName: action.capabilityPreview.contractName,
      requiredBeforeConfirm: action.capabilityPreview.requiredBeforeConfirm,
      sideEffectsInPreview: action.capabilityPreview.sideEffectsInPreview
    },
    execution: action.execution
  };
}

function applyActionSpecificReasons({
  action,
  reasons,
  activeNext,
  currentTask
}) {
  if (action.action_id === 'goal.worker-evidence.record') {
    requireNextRole(reasons, activeNext, 'worker', 'implement');

    if (currentTask?.workerEvidenceRef !== null && currentTask?.workerEvidenceRef !== undefined) {
      reasons.push(reason('worker-evidence-already-recorded', 'Worker evidence is already recorded for this task.', 'goal-progress-ledger.v1'));
    }
  }

  if (action.action_id === 'goal.review-verdict.record') {
    requireNextRole(reasons, activeNext, 'reviewer', 'review');

    if (currentTask?.workerEvidenceRef === null || currentTask?.workerEvidenceRef === undefined) {
      reasons.push(reason('worker-evidence-missing', 'Review is unavailable until worker evidence is recorded.', 'goal-progress-ledger.v1'));
    }

    if (currentTask?.reviewVerdict === 'APPROVED') {
      reasons.push(reason('review-already-approved', 'Review is already approved for this task.', 'goal-progress-ledger.v1'));
    }
  }

  if (action.action_id === 'goal.main-verification-gate.record') {
    requireNextRole(reasons, activeNext, 'main-verifier', 'main-verification');

    if (currentTask?.reviewVerdict !== 'APPROVED') {
      reasons.push(reason('review-approval-missing', 'Main verification is unavailable until reviewer approval is recorded.', 'goal-progress-ledger.v1'));
    }

    if (currentTask?.mainVerificationRef !== null && currentTask?.mainVerificationRef !== undefined) {
      reasons.push(reason('main-verification-already-recorded', 'Main verification is already recorded for this task.', 'goal-progress-ledger.v1'));
    }
  }

  if (action.action_id === 'goal.release-gate.record') {
    if (activeNext?.phase !== 'release-gate' && activeNext?.phase !== 'release-prep') {
      reasons.push(reason('release-phase-not-active', 'Release gate actions are unavailable until the goal reaches release verification.', 'goal-next-action.v1'));
    }
  }

  if (action.action_id === 'goal.implementation.preview') {
    requireNextRole(reasons, activeNext, 'worker', 'implement');

    if (currentTask?.workerEvidenceRef !== null && currentTask?.workerEvidenceRef !== undefined) {
      reasons.push(reason('worker-evidence-already-recorded', 'Implementation preview is unavailable after worker evidence is recorded.', 'goal-progress-ledger.v1'));
    }
  }
}

function requireNextRole(reasons, activeNext, role, phase) {
  if (activeNext === null || activeNext.role !== role || activeNext.phase !== phase) {
    reasons.push(reason(
      'next-action-role-mismatch',
      `This action requires next action role ${role} in phase ${phase}.`,
      'goal-next-action.v1'
    ));
  }
}

function hasRequiredContext({ field, resolvedTaskId, currentTask }) {
  if (field === 'goalId') {
    return true;
  }

  if (field === 'taskId') {
    return resolvedTaskId !== null;
  }

  if (field === 'workerEvidenceRef') {
    return currentTask?.workerEvidenceRef !== null && currentTask?.workerEvidenceRef !== undefined;
  }

  if (field === 'reviewEvidenceRef') {
    return currentTask?.reviewEvidenceRef !== null && currentTask?.reviewEvidenceRef !== undefined;
  }

  if (field === 'mainVerificationRef') {
    return currentTask?.mainVerificationRef !== null && currentTask?.mainVerificationRef !== undefined;
  }

  if (['reviewerId', 'verdict', 'verifierId', 'gateId', 'releaseEvidenceRef'].includes(field)) {
    return false;
  }

  return false;
}

function summarizeNextAction(nextAction) {
  return {
    status: nextAction.status,
    taskId: nextAction.next?.taskId ?? null,
    role: nextAction.next?.role ?? null,
    phase: nextAction.next?.phase ?? null,
    reason: nextAction.reason,
    blocked: nextAction.next?.blocked ?? false
  };
}

function summarizeCurrentTask(task) {
  if (task === null) {
    return null;
  }

  return {
    taskId: task.taskId,
    status: task.status,
    statusSource: task.statusSource,
    workerEvidenceRef: task.workerEvidenceRef,
    reviewEvidenceRef: task.reviewEvidenceRef,
    reviewVerdict: task.reviewVerdict,
    mainVerificationRef: task.mainVerificationRef
  };
}

function buildContractBlockers({ ledger, nextAction, resolvedTaskId }) {
  const blockers = [];

  if (ledger === null) {
    blockers.push(reason('goal-progress-missing', 'No goal progress ledger is available for the requested goal.', 'goal-progress-ledger.v1'));
  }

  if (nextAction.status === 'missing-runbook') {
    blockers.push(reason('goal-runbook-missing', nextAction.reason, 'goal-next-action.v1'));
  }

  if (resolvedTaskId === null) {
    blockers.push(reason('active-task-missing', 'No active task could be resolved.', 'goal-next-action.v1'));
  }

  return blockers;
}

function availabilityBoundaries() {
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

function reason(code, message, source) {
  return { code, message, source };
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeNullableRef(errors, context.goalId, 'context.goalId');
  requireSafeNullableRef(errors, context.taskId, 'context.taskId');
  validateStringArray(errors, context.sourceContracts, 'context.sourceContracts');
  validateNextAction(errors, context.nextAction, 'context.nextAction');

  if (context.currentTask !== null) {
    validateCurrentTask(errors, context.currentTask, 'context.currentTask');
  }

  if (!isPlainObject(context.evidenceState)) {
    errors.push('context.evidenceState must be a plain object');
  }
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

    requireSafeActionId(errors, action.action_id, `${path}.action_id`);
    requireNonEmptyString(errors, action.label, `${path}.label`);
    requireNonEmptyString(errors, action.scope, `${path}.scope`);
    requireNonEmptyString(errors, action.role, `${path}.role`);
    requireEnum(errors, action.state, `${path}.state`, AVAILABILITY_STATES);
    validateReasons(errors, action.reasons, `${path}.reasons`);
    validateStringArray(errors, action.requiredContext, `${path}.requiredContext`);
    validateStringArray(errors, action.missingContext, `${path}.missingContext`);
    validateStringArray(errors, action.requiredInputs, `${path}.requiredInputs`);
    requirePlainObject(errors, action.eventMapping, `${path}.eventMapping`);
    requirePlainObject(errors, action.evidenceExpectations, `${path}.evidenceExpectations`);
    validatePreview(errors, action.preview, `${path}.preview`);
    validateExecution(errors, action.execution, `${path}.execution`);

    if (isNonEmptyString(action.action_id)) {
      if (actionIds.has(action.action_id)) {
        errors.push(`${path}.action_id must be unique`);
      }

      actionIds.add(action.action_id);
    }
  });
}

function validateNextAction(errors, nextAction, path) {
  if (!isPlainObject(nextAction)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireNonEmptyString(errors, nextAction.status, `${path}.status`);
  requireSafeNullableRef(errors, nextAction.taskId, `${path}.taskId`);
  requireNullableString(errors, nextAction.role, `${path}.role`);
  requireNullableString(errors, nextAction.phase, `${path}.phase`);
  requireNonEmptyString(errors, nextAction.reason, `${path}.reason`);

  if (typeof nextAction.blocked !== 'boolean') {
    errors.push(`${path}.blocked must be a boolean`);
  }
}

function validateCurrentTask(errors, task, path) {
  if (!isPlainObject(task)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireSafeNullableRef(errors, task.taskId, `${path}.taskId`);
  requireNonEmptyString(errors, task.status, `${path}.status`);
  requireNonEmptyString(errors, task.statusSource, `${path}.statusSource`);
  requireNullableString(errors, task.workerEvidenceRef, `${path}.workerEvidenceRef`);
  requireNullableString(errors, task.reviewEvidenceRef, `${path}.reviewEvidenceRef`);
  requireNullableString(errors, task.reviewVerdict, `${path}.reviewVerdict`);
  requireNullableString(errors, task.mainVerificationRef, `${path}.mainVerificationRef`);
}

function validatePreview(errors, preview, path) {
  if (!isPlainObject(preview)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireNonEmptyString(errors, preview.contractName, `${path}.contractName`);
  requireExact(errors, preview.requiredBeforeConfirm, `${path}.requiredBeforeConfirm`, true);
  requireExact(errors, preview.sideEffectsInPreview, `${path}.sideEffectsInPreview`, false);
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

function validateBlockers(errors, blockers) {
  if (!Array.isArray(blockers)) {
    errors.push('blockers must be an array');
    return;
  }

  validateReasons(errors, blockers, 'blockers');
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
  if (!isNonEmptyString(value)) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireNullableString(errors, value, path) {
  if (value !== null && typeof value !== 'string') {
    errors.push(`${path} must be null or a string`);
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
  if (typeof value !== 'string' || !/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u.test(value)) {
    errors.push(`${path} must be a safe action id`);
  }
}

function validateStringArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((item, index) => requireNonEmptyString(errors, item, `${path}[${index}]`));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
