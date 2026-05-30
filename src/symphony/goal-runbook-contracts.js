import {
  GOAL_EVENT_TYPES,
  isSafeGoalEventToken,
  isUnsafeEvidenceRef
} from './goal-event-contracts.js';
import {
  GOAL_PROGRESS_RELEASE_GATE_IDS,
  GOAL_PROGRESS_RELEASE_GATE_STATUSES
} from './goal-progress-ledger.js';

export const GOAL_RUNBOOK_CONTRACT_NAME = 'goal-runbook.v1';
export const GOAL_NEXT_ACTION_CONTRACT_NAME = 'goal-next-action.v1';
export const GOAL_PROMPT_PACK_CONTRACT_NAME = 'goal-prompt-pack.v1';
export const GOAL_CLOSEOUT_REPORT_CONTRACT_NAME = 'goal-closeout-report.v1';
export const GOAL_RUNBOOK_CONTRACT_VERSION = 1;
export const GOAL_NEXT_ACTION_CONTRACT_VERSION = 1;
export const GOAL_PROMPT_PACK_CONTRACT_VERSION = 1;
export const GOAL_CLOSEOUT_REPORT_CONTRACT_VERSION = 1;

export const GOAL_RUNBOOK_TASK_ROLES = Object.freeze([
  'worker',
  'reviewer',
  'main-verifier'
]);
export const GOAL_PROMPT_PACK_ROLES = Object.freeze([
  ...GOAL_RUNBOOK_TASK_ROLES,
  'release-manager'
]);
export const GOAL_NEXT_ACTION_STATUSES = Object.freeze([
  'action-required',
  'missing-runbook',
  'blocked',
  'complete'
]);
export const GOAL_NEXT_ACTION_PHASES = Object.freeze([
  'implement',
  'review',
  'revision',
  'main-verification',
  'release-gate',
  'release-prep'
]);
export const GOAL_RUNBOOK_RELEASE_GATES = Object.freeze([
  'release.pnpm-check',
  'release.pnpm-test',
  'release.workbench-build',
  'release.mutation-gate',
  'release.audit-high',
  'release.diff-check',
  'release.mcas-doctor',
  'release.docs-updated',
  'release.tag-evidence'
]);

const EXPECTED_EVIDENCE_KEYS = Object.freeze([
  'worker',
  'reviewer',
  'mainVerifier',
  'releaseManager'
]);
const PROMPT_FORMATS = Object.freeze([
  'markdown',
  'text'
]);
const CLOSEOUT_MISSING_KINDS = Object.freeze([
  'worker-evidence',
  'review-evidence',
  'main-verification',
  'release-gate',
  'release-ready'
]);

export function validateGoalRunbookContract(runbook) {
  const errors = [];

  if (!isPlainObject(runbook)) {
    return {
      ok: false,
      errors: ['runbook must be a plain object']
    };
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'goalId',
    'goalTitle',
    'baseline',
    'tasks',
    'releaseGates',
    'rolePolicy'
  ]) {
    if (!Object.hasOwn(runbook, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExact(errors, runbook.contractName, 'contractName', GOAL_RUNBOOK_CONTRACT_NAME);
  requireExact(errors, runbook.contractVersion, 'contractVersion', GOAL_RUNBOOK_CONTRACT_VERSION);
  requireSafeToken(errors, runbook.goalId, 'goalId');
  requireNonEmptyString(errors, runbook.goalTitle, 'goalTitle');
  validateRunbookBaseline(errors, runbook.baseline);
  validateRunbookTasks(errors, runbook.tasks);
  validateRunbookReleaseGates(errors, runbook.releaseGates);
  validateRolePolicy(errors, runbook.rolePolicy);

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertGoalRunbookContract(runbook) {
  const result = validateGoalRunbookContract(runbook);

  if (!result.ok) {
    throw new Error(`Invalid goal runbook contract: ${result.errors.join('; ')}`);
  }

  return runbook;
}

export function validateGoalNextActionContract(nextAction) {
  const errors = [];

  if (!isPlainObject(nextAction)) {
    return {
      ok: false,
      errors: ['nextAction must be a plain object']
    };
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'goalId',
    'status',
    'next',
    'evidenceState',
    'copyOnlyPrompt',
    'copyOnlyCommands',
    'afterCompletion',
    'safety'
  ]) {
    if (!Object.hasOwn(nextAction, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExact(errors, nextAction.contractName, 'contractName', GOAL_NEXT_ACTION_CONTRACT_NAME);
  requireExact(errors, nextAction.contractVersion, 'contractVersion', GOAL_NEXT_ACTION_CONTRACT_VERSION);
  requireSafeToken(errors, nextAction.goalId, 'goalId');
  requireEnum(errors, nextAction.status, 'status', GOAL_NEXT_ACTION_STATUSES);
  validateNextActionNext(errors, nextAction.next, nextAction.status);
  validateEvidenceState(errors, nextAction.evidenceState);
  validateCopyOnlyPrompt(errors, nextAction.copyOnlyPrompt, 'copyOnlyPrompt');
  validateNextActionCopyOnlyCommands(errors, nextAction.copyOnlyCommands, nextAction.status);
  validateAfterCompletion(errors, nextAction.afterCompletion, nextAction.status);
  validateDisplaySafety(errors, nextAction.safety, 'safety');

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertGoalNextActionContract(nextAction) {
  const result = validateGoalNextActionContract(nextAction);

  if (!result.ok) {
    throw new Error(`Invalid goal next action contract: ${result.errors.join('; ')}`);
  }

  return nextAction;
}

export function validateGoalPromptPackContract(promptPack) {
  const errors = [];

  if (!isPlainObject(promptPack)) {
    return {
      ok: false,
      errors: ['promptPack must be a plain object']
    };
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'goalId',
    'generatedAt',
    'prompts',
    'safety'
  ]) {
    if (!Object.hasOwn(promptPack, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExact(errors, promptPack.contractName, 'contractName', GOAL_PROMPT_PACK_CONTRACT_NAME);
  requireExact(errors, promptPack.contractVersion, 'contractVersion', GOAL_PROMPT_PACK_CONTRACT_VERSION);
  requireSafeToken(errors, promptPack.goalId, 'goalId');
  requireIsoTimestamp(errors, promptPack.generatedAt, 'generatedAt');
  validatePrompts(errors, promptPack.prompts);
  validateDisplaySafety(errors, promptPack.safety, 'safety');

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertGoalPromptPackContract(promptPack) {
  const result = validateGoalPromptPackContract(promptPack);

  if (!result.ok) {
    throw new Error(`Invalid goal prompt pack contract: ${result.errors.join('; ')}`);
  }

  return promptPack;
}

export function validateGoalCloseoutReportContract(closeoutReport) {
  const errors = [];

  if (!isPlainObject(closeoutReport)) {
    return {
      ok: false,
      errors: ['closeoutReport must be a plain object']
    };
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'goalId',
    'generatedAt',
    'summary',
    'missing',
    'releaseGates',
    'nextAction',
    'safety'
  ]) {
    if (!Object.hasOwn(closeoutReport, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExact(errors, closeoutReport.contractName, 'contractName', GOAL_CLOSEOUT_REPORT_CONTRACT_NAME);
  requireExact(errors, closeoutReport.contractVersion, 'contractVersion', GOAL_CLOSEOUT_REPORT_CONTRACT_VERSION);
  requireSafeToken(errors, closeoutReport.goalId, 'goalId');
  requireIsoTimestamp(errors, closeoutReport.generatedAt, 'generatedAt');
  validateCloseoutSummary(errors, closeoutReport.summary);
  validateMissingItems(errors, closeoutReport.missing);
  validateCloseoutReleaseGates(errors, closeoutReport.releaseGates);
  validateCopyOnlyCommand(errors, closeoutReport.nextAction, 'nextAction');
  validateCloseoutSafety(errors, closeoutReport.safety);

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertGoalCloseoutReportContract(closeoutReport) {
  const result = validateGoalCloseoutReportContract(closeoutReport);

  if (!result.ok) {
    throw new Error(`Invalid goal closeout report contract: ${result.errors.join('; ')}`);
  }

  return closeoutReport;
}

function validateRunbookBaseline(errors, baseline) {
  if (!isPlainObject(baseline)) {
    errors.push('baseline must be a plain object');
    return;
  }

  requireNonEmptyString(errors, baseline.tag, 'baseline.tag');
  requireNullableString(errors, baseline.commit, 'baseline.commit');
  requireControlledEvidenceRef(errors, baseline.evidenceRef, 'baseline.evidenceRef');
}

function validateRunbookTasks(errors, tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    errors.push('tasks must be a non-empty array');
    return;
  }

  const taskIds = new Set();

  tasks.forEach((task, index) => {
    const path = `tasks[${index}]`;

    if (!isPlainObject(task)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireSafeToken(errors, task.taskId, `${path}.taskId`);
    requireNonEmptyString(errors, task.title, `${path}.title`);
    requireNonEmptyString(errors, task.branch, `${path}.branch`);
    validateRoleOrder(errors, task.roleOrder, `${path}.roleOrder`);
    validateAcceptance(errors, task.acceptance, `${path}.acceptance`);
    validateExpectedEvidence(errors, task.expectedEvidence, `${path}.expectedEvidence`);
    validateCopyOnlyCommands(errors, task.copyOnlyCommands, `${path}.copyOnlyCommands`);

    if (isNonEmptyString(task.taskId)) {
      if (taskIds.has(task.taskId)) {
        errors.push(`${path}.taskId must be unique`);
      }

      taskIds.add(task.taskId);
    }
  });
}

function validateRoleOrder(errors, roleOrder, path) {
  if (!Array.isArray(roleOrder) || roleOrder.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  roleOrder.forEach((role, index) => {
    requireEnum(errors, role, `${path}[${index}]`, GOAL_RUNBOOK_TASK_ROLES);
  });
}

function validateAcceptance(errors, acceptance, path) {
  if (!Array.isArray(acceptance) || acceptance.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  acceptance.forEach((item, index) => {
    requireNonEmptyString(errors, item, `${path}[${index}]`);
  });
}

function validateExpectedEvidence(errors, expectedEvidence, path) {
  if (!isPlainObject(expectedEvidence)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  for (const key of Object.keys(expectedEvidence)) {
    if (!EXPECTED_EVIDENCE_KEYS.includes(key)) {
      errors.push(`${path}.${key} is not supported`);
      continue;
    }

    validateExpectedEvidenceValue(errors, expectedEvidence[key], `${path}.${key}`);
  }
}

function validateExpectedEvidenceValue(errors, value, path) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      errors.push(`${path} must contain at least one event type`);
      return;
    }

    value.forEach((eventType, index) => {
      requireEnum(errors, eventType, `${path}[${index}]`, GOAL_EVENT_TYPES);
    });
    return;
  }

  requireEnum(errors, value, path, GOAL_EVENT_TYPES);
}

function validateRunbookReleaseGates(errors, releaseGates) {
  if (!Array.isArray(releaseGates) || releaseGates.length === 0) {
    errors.push('releaseGates must be a non-empty array');
    return;
  }

  const seen = new Set();

  releaseGates.forEach((gate, index) => {
    requireEnum(errors, gate, `releaseGates[${index}]`, GOAL_RUNBOOK_RELEASE_GATES);

    if (isNonEmptyString(gate)) {
      if (seen.has(gate)) {
        errors.push(`releaseGates[${index}] must be unique`);
      }

      seen.add(gate);
    }
  });
}

function validateRolePolicy(errors, rolePolicy) {
  if (!isPlainObject(rolePolicy)) {
    errors.push('rolePolicy must be a plain object');
    return;
  }

  requireExact(errors, rolePolicy.workerCannotApproveOwnTask, 'rolePolicy.workerCannotApproveOwnTask', true);
  requireExact(errors, rolePolicy.reviewerApprovalRequiredBeforeMainVerification, 'rolePolicy.reviewerApprovalRequiredBeforeMainVerification', true);
  requireExact(errors, rolePolicy.mainVerificationRequiredBeforeReleaseReady, 'rolePolicy.mainVerificationRequiredBeforeReleaseReady', true);
}

function validateNextActionNext(errors, next, status) {
  if (next === null && ['blocked', 'complete', 'missing-runbook'].includes(status)) {
    return;
  }

  if (!isPlainObject(next)) {
    errors.push('next must be a plain object');
    return;
  }

  requireSafeToken(errors, next.taskId, 'next.taskId');
  requireEnum(errors, next.role, 'next.role', GOAL_PROMPT_PACK_ROLES);
  requireEnum(errors, next.phase, 'next.phase', GOAL_NEXT_ACTION_PHASES);
  requireNonEmptyString(errors, next.reason, 'next.reason');
  requireBoolean(errors, next.blocked, 'next.blocked');

  if (status === 'blocked' && next.blocked !== true) {
    errors.push('next.blocked must be true when status is blocked');
  }

  if (status === 'action-required' && next.blocked !== false) {
    errors.push('next.blocked must be false when status is action-required');
  }
}

function validateNextActionCopyOnlyCommands(errors, commands, status) {
  if (!Array.isArray(commands)) {
    errors.push('copyOnlyCommands must be an array');
    return;
  }

  if (commands.length === 0 && status !== 'action-required') {
    return;
  }

  validateCopyOnlyCommands(errors, commands, 'copyOnlyCommands');
}

function validateEvidenceState(errors, evidenceState) {
  if (!isPlainObject(evidenceState)) {
    errors.push('evidenceState must be a plain object');
    return;
  }

  for (const field of ['workerEvidenceRef', 'reviewEvidenceRef', 'mainVerificationRef']) {
    requireNullableControlledEvidenceRef(errors, evidenceState[field], `evidenceState.${field}`);
  }
}

function validateCopyOnlyPrompt(errors, prompt, path) {
  if (!isPlainObject(prompt)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireBoolean(errors, prompt.available, `${path}.available`);

  if (prompt.available === false) {
    if (prompt.text !== null) {
      errors.push(`${path}.text must be null when ${path}.available is false`);
    }

    return;
  }

  requireEnum(errors, prompt.format, `${path}.format`, PROMPT_FORMATS);

  if (!Object.hasOwn(prompt, 'text') || typeof prompt.text !== 'string' || prompt.text.trim() === '') {
    errors.push(`${path}.text is required when ${path}.available is true`);
    return;
  }

  if (!prompt.text.startsWith('/goal')) {
    errors.push(`${path}.text must start with /goal`);
  }
}

function validateAfterCompletion(errors, afterCompletion, status = 'action-required') {
  if (!isPlainObject(afterCompletion)) {
    errors.push('afterCompletion must be a plain object');
    return;
  }

  requireNonEmptyString(errors, afterCompletion.registerWith, 'afterCompletion.registerWith');

  if (!Array.isArray(afterCompletion.allowedEvents)) {
    errors.push('afterCompletion.allowedEvents must be an array');
    return;
  }

  if (afterCompletion.allowedEvents.length === 0 && status === 'action-required') {
    errors.push('afterCompletion.allowedEvents must be a non-empty array when status is action-required');
    return;
  }

  afterCompletion.allowedEvents.forEach((eventType, index) => {
    requireEnum(errors, eventType, `afterCompletion.allowedEvents[${index}]`, GOAL_EVENT_TYPES);
  });
}

function validatePrompts(errors, prompts) {
  if (!Array.isArray(prompts) || prompts.length === 0) {
    errors.push('prompts must be a non-empty array');
    return;
  }

  prompts.forEach((prompt, index) => {
    const path = `prompts[${index}]`;

    if (!isPlainObject(prompt)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireSafeToken(errors, prompt.taskId, `${path}.taskId`);
    requireEnum(errors, prompt.role, `${path}.role`, GOAL_PROMPT_PACK_ROLES);
    requireNonEmptyString(errors, prompt.title, `${path}.title`);
    requireExact(errors, prompt.copyOnly, `${path}.copyOnly`, true);
    requireEnum(errors, prompt.format, `${path}.format`, PROMPT_FORMATS);
    requireCopyOnlyPromptText(errors, prompt.text, `${path}.text`);
    validateCopyOnlyCommands(errors, prompt.validationCommands, `${path}.validationCommands`);
    requireControlledEvidenceRef(errors, prompt.evidenceFile, `${path}.evidenceFile`);
    validateRegistration(errors, prompt.registration, `${path}.registration`, prompt.role);
  });
}

function validateRegistration(errors, registration, path, role) {
  if (!isPlainObject(registration)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireNonEmptyString(errors, registration.dryRunCommand, `${path}.dryRunCommand`);
  requireNonEmptyString(errors, registration.confirmCommand, `${path}.confirmCommand`);
  requireExact(errors, registration.confirmRequired, `${path}.confirmRequired`, true);
  requireExact(errors, registration.writesInDryRun, `${path}.writesInDryRun`, false);
  requireExact(errors, registration.appendOnlyOnConfirm, `${path}.appendOnlyOnConfirm`, true);

  if (typeof registration.dryRunCommand === 'string' && !/\s--dry-run(?:\s|$)/u.test(registration.dryRunCommand)) {
    errors.push(`${path}.dryRunCommand must include --dry-run`);
  }

  if (typeof registration.dryRunCommand === 'string' && /\s--confirm(?:\s|$)/u.test(registration.dryRunCommand)) {
    errors.push(`${path}.dryRunCommand must not include --confirm`);
  }

  if (typeof registration.confirmCommand === 'string' && !/\s--confirm(?:\s|$)/u.test(registration.confirmCommand)) {
    errors.push(`${path}.confirmCommand must include --confirm`);
  }

  if (typeof registration.confirmCommand === 'string' && !/\s--plan-hash(?:\s|$)/u.test(registration.confirmCommand)) {
    errors.push(`${path}.confirmCommand must include --plan-hash`);
  }

  validateRoleRegistrationCommands(errors, registration, path, role);
}

function validateRoleRegistrationCommands(errors, registration, path, role) {
  if (role !== 'main-verifier') {
    return;
  }

  for (const field of ['dryRunCommand', 'confirmCommand']) {
    const command = registration[field];
    const commandPath = `${path}.${field}`;

    if (typeof command !== 'string') {
      continue;
    }

    if (!/\bsymphony\s+goal\s+gate\b/u.test(command)) {
      errors.push(`${commandPath} must use symphony goal gate for main verification`);
    }

    if (!/\s--gate\s+main-verification(?:\s|$)/u.test(command)) {
      errors.push(`${commandPath} must include --gate main-verification`);
    }

    if (!/\s--status\s+(?:passed|failed)(?:\s|$)/u.test(command)) {
      errors.push(`${commandPath} must include --status passed or --status failed`);
    }

    if (/\s--event\s+main\.verification-/u.test(command)) {
      errors.push(`${commandPath} must not register main verification through --event`);
    }
  }
}

function validateCloseoutSummary(errors, summary) {
  if (!isPlainObject(summary)) {
    errors.push('summary must be a plain object');
    return;
  }

  requireNonNegativeInteger(errors, summary.totalTasks, 'summary.totalTasks');

  for (const field of [
    'workerEvidenceComplete',
    'reviewEvidenceComplete',
    'mainVerificationComplete',
    'releaseReady'
  ]) {
    requireBoolean(errors, summary[field], `summary.${field}`);
  }

  if (!Object.hasOwn(summary, 'releaseReadySource')) {
    errors.push('summary.releaseReadySource is required');
  } else {
    requireNullableString(errors, summary.releaseReadySource, 'summary.releaseReadySource');
  }

  if (summary.releaseReady === true && !isGoalEventStatusSource(summary.releaseReadySource)) {
    errors.push('summary.releaseReadySource must be a goal-event-log.v1 source when summary.releaseReady is true');
  }

  if (summary.releaseReady === false && summary.releaseReadySource !== null) {
    errors.push('summary.releaseReadySource must be null when summary.releaseReady is false');
  }
}

function validateMissingItems(errors, missing) {
  if (!Array.isArray(missing)) {
    errors.push('missing must be an array');
    return;
  }

  missing.forEach((item, index) => {
    const path = `missing[${index}]`;

    if (!isPlainObject(item)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireEnum(errors, item.kind, `${path}.kind`, CLOSEOUT_MISSING_KINDS);
    requireNullableSafeToken(errors, item.taskId, `${path}.taskId`);
    requireEnum(errors, item.expectedEvent, `${path}.expectedEvent`, GOAL_EVENT_TYPES);
  });
}

function validateCloseoutReleaseGates(errors, releaseGates) {
  if (!isPlainObject(releaseGates)) {
    errors.push('releaseGates must be a plain object');
    return;
  }

  for (const gateId of GOAL_PROGRESS_RELEASE_GATE_IDS) {
    if (!Object.hasOwn(releaseGates, gateId)) {
      errors.push(`releaseGates.${gateId} is required`);
      continue;
    }

    requireEnum(errors, releaseGates[gateId], `releaseGates.${gateId}`, GOAL_PROGRESS_RELEASE_GATE_STATUSES);
  }
}

function validateDisplaySafety(errors, safety, path) {
  if (!isPlainObject(safety)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireExact(errors, safety.readOnly, `${path}.readOnly`, true);
  requireExact(errors, safety.copyOnly, `${path}.copyOnly`, true);
  requireExact(errors, safety.workbenchWriteAvailable, `${path}.workbenchWriteAvailable`, false);
  requireExact(errors, safety.browserExecutionAvailable, `${path}.browserExecutionAvailable`, false);
  requireExact(errors, safety.modelInvocationAvailable, `${path}.modelInvocationAvailable`, false);
}

function validateCloseoutSafety(errors, safety) {
  validateDisplaySafety(errors, safety, 'safety');

  if (!isPlainObject(safety)) {
    return;
  }

  requireExact(errors, safety.writesInDryRun, 'safety.writesInDryRun', false);
  requireExact(errors, safety.confirmRequiredForWrites, 'safety.confirmRequiredForWrites', true);
  requireExact(errors, safety.releaseReadyRequiresEvidence, 'safety.releaseReadyRequiresEvidence', true);
}

function validateCopyOnlyCommands(errors, commands, path) {
  if (!Array.isArray(commands) || commands.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  commands.forEach((command, index) => validateCopyOnlyCommand(errors, command, `${path}[${index}]`));
}

function validateCopyOnlyCommand(errors, command, path) {
  requireNonEmptyString(errors, command, path);

  if (typeof command !== 'string') {
    return;
  }

  if (/\b(POST|PUT|PATCH|DELETE)\b/u.test(command)) {
    errors.push(`${path} must not contain write HTTP methods`);
  }

  if (/\b(curl|fetch)\b.*\/api\//iu.test(command)) {
    errors.push(`${path} must not invoke API routes`);
  }
}

function requireCopyOnlyPromptText(errors, text, path) {
  requireNonEmptyString(errors, text, path);

  if (typeof text === 'string' && !text.startsWith('/goal')) {
    errors.push(`${path} must start with /goal`);
  }
}

function requireControlledEvidenceRef(errors, ref, path) {
  requireNonEmptyString(errors, ref, path);

  if (typeof ref !== 'string') {
    return;
  }

  if (isUnsafeControlledRef(ref)) {
    errors.push(`${path} must be a controlled evidence reference`);
    return;
  }

  if (!isRepoDocRef(ref) && !isManagedArtifactRef(ref)) {
    errors.push(`${path} must be a repo-doc or managed artifact reference`);
  }
}

function requireNullableControlledEvidenceRef(errors, ref, path) {
  if (ref === null) {
    return;
  }

  requireControlledEvidenceRef(errors, ref, path);
}

function isUnsafeControlledRef(ref) {
  if (isUnsafeEvidenceRef(ref) || hasEncodedTraversal(ref) || hasParentDirectorySegment(ref)) {
    return true;
  }

  let decoded = ref;

  try {
    decoded = decodeURIComponent(ref);
  } catch {
    return true;
  }

  return decoded !== ref &&
    (isUnsafeEvidenceRef(decoded) || hasEncodedTraversal(decoded) || hasParentDirectorySegment(decoded));
}

function hasEncodedTraversal(ref) {
  const lower = ref.toLowerCase();

  return lower.includes('%2e') || lower.includes('%2f') || lower.includes('%5c');
}

function hasParentDirectorySegment(ref) {
  return ref.split(/[\\/]+/u).some((segment) => segment === '..');
}

function isRepoDocRef(ref) {
  return ref.startsWith('docs/plans/');
}

function isManagedArtifactRef(ref) {
  return ref.startsWith('artifacts/') || ref.startsWith('managed-artifact:');
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireEnum(errors, value, path, values) {
  if (!values.includes(value)) {
    errors.push(`${path} must be one of ${values.join(', ')}`);
  }
}

function requireSafeToken(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && !isSafeGoalEventToken(value)) {
    errors.push(`${path} must be a safe path segment`);
  }
}

function requireNullableSafeToken(errors, value, path) {
  if (value === null) {
    return;
  }

  requireSafeToken(errors, value, path);
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireNullableString(errors, value, path) {
  if (value !== null && typeof value !== 'string') {
    errors.push(`${path} must be a string or null`);
  }
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireNonNegativeInteger(errors, value, path) {
  if (!Number.isInteger(value) || value < 0) {
    errors.push(`${path} must be a non-negative integer`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp string`);
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isGoalEventStatusSource(value) {
  return typeof value === 'string' && value.startsWith('goal-event-log.v1:');
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
