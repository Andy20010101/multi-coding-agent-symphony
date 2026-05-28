import { createHash } from 'node:crypto';

export const GOAL_EVENT_LOG_CONTRACT_NAME = 'goal-event-log.v1';
export const GOAL_EVENT_LOG_CONTRACT_VERSION = 1;
export const GOAL_UPDATE_PLAN_CONTRACT_NAME = 'goal-update-plan.v1';
export const GOAL_UPDATE_PLAN_CONTRACT_VERSION = 1;
export const GOAL_EVENT_JOURNAL_STORAGE = 'managed-goal-event-journal';

export const GOAL_EVENT_TYPES = Object.freeze([
  'goal.planned',
  'task.planned',
  'worker.started',
  'worker.evidence-recorded',
  'worker.self-check-passed',
  'worker.self-check-failed',
  'reviewer.review-requested',
  'reviewer.approved',
  'reviewer.needs-revision',
  'reviewer.blocked',
  'main.merged',
  'main.verification-passed',
  'main.verification-failed',
  'release.gate-passed',
  'release.gate-failed',
  'release.evidence-recorded',
  'release.ready-declared',
  'blocker.opened',
  'blocker.resolved'
]);

export const GOAL_EVENT_PHASES = Object.freeze([
  'plan',
  'implement',
  'review',
  'land',
  'main-verification',
  'release-gate',
  'release-prep'
]);

export const GOAL_EVENT_ACTOR_ROLES = Object.freeze([
  'planner',
  'worker',
  'reviewer',
  'main-verifier',
  'release-verifier',
  'release-manager'
]);

export const GOAL_EVENT_REVIEW_VERDICTS = Object.freeze([
  'APPROVED',
  'NEEDS_REVISION'
]);

export const GOAL_EVENT_GATE_STATUSES = Object.freeze([
  'passed',
  'failed',
  'declared'
]);

const EVIDENCE_REF_KINDS = Object.freeze([
  'repo-doc',
  'artifact-ref',
  'commit',
  'command-evidence',
  'external-note'
]);
const EVENT_TYPES_REQUIRING_EVIDENCE = Object.freeze([
  'worker.evidence-recorded',
  'worker.self-check-passed',
  'worker.self-check-failed',
  'reviewer.approved',
  'reviewer.needs-revision',
  'reviewer.blocked',
  'main.verification-passed',
  'main.verification-failed',
  'release.gate-passed',
  'release.gate-failed',
  'release.evidence-recorded',
  'release.ready-declared'
]);
const HASH_PREFIX_PATTERN = /^sha256:[a-f0-9]{64}$/u;

export function validateGoalEventLogContract(log) {
  const errors = [];

  if (!isPlainObject(log)) {
    return {
      ok: false,
      errors: ['log must be a plain object']
    };
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'goalId',
    'goalTitle',
    'baseline',
    'log',
    'events'
  ]) {
    if (!Object.hasOwn(log, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExact(errors, log.contractName, 'contractName', GOAL_EVENT_LOG_CONTRACT_NAME);
  requireExact(errors, log.contractVersion, 'contractVersion', GOAL_EVENT_LOG_CONTRACT_VERSION);
  requireSafeToken(errors, log.goalId, 'goalId');
  requireNonEmptyString(errors, log.goalTitle, 'goalTitle');
  validateBaseline(errors, log.baseline);
  validateLogSummary(errors, log.log, Array.isArray(log.events) ? log.events : []);

  if (!Array.isArray(log.events)) {
    errors.push('events must be an array');
  } else {
    log.events.forEach((event, index) => {
      const path = `events[${index}]`;

      errors.push(...validateGoalEventRecord(event, `events[${index}]`).errors);

      if (isPlainObject(event) && event.goalId !== log.goalId) {
        errors.push(`${path}.goalId must match goalId`);
      }
    });
    errors.push(...validateGoalEventChain(log.events).errors);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertGoalEventLogContract(log) {
  const result = validateGoalEventLogContract(log);

  if (!result.ok) {
    throw new GoalEventContractError(
      'invalid-goal-event-log',
      'Goal event log contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return log;
}

export function validateGoalUpdatePlanContract(plan) {
  const errors = [];

  if (!isPlainObject(plan)) {
    return {
      ok: false,
      errors: ['plan must be a plain object']
    };
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'planId',
    'planHash',
    'goalId',
    'mode',
    'command',
    'actor',
    'proposedEvents',
    'validation',
    'wouldAppend',
    'confirm',
    'safety'
  ]) {
    if (!Object.hasOwn(plan, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExact(errors, plan.contractName, 'contractName', GOAL_UPDATE_PLAN_CONTRACT_NAME);
  requireExact(errors, plan.contractVersion, 'contractVersion', GOAL_UPDATE_PLAN_CONTRACT_VERSION);
  requireSafeToken(errors, plan.planId, 'planId');
  requireHash(errors, plan.planHash, 'planHash');
  requireSafeToken(errors, plan.goalId, 'goalId');
  requireExact(errors, plan.mode, 'mode', 'dry-run');
  validatePlanCommand(errors, plan.command);
  validateActor(errors, plan.actor, 'actor');
  validateProposedEvents(errors, plan.proposedEvents);
  validatePlanValidation(errors, plan.validation);
  validateWouldAppend(errors, plan.wouldAppend);
  validateConfirm(errors, plan.confirm);
  validatePlanSafety(errors, plan.safety);

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertGoalUpdatePlanContract(plan) {
  const result = validateGoalUpdatePlanContract(plan);

  if (!result.ok) {
    throw new GoalEventContractError(
      'invalid-goal-update-plan',
      'Goal update plan contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return plan;
}

export function validateGoalEventRecord(event, path = 'event') {
  const errors = [];

  if (!isPlainObject(event)) {
    return {
      ok: false,
      errors: [`${path} must be a plain object`]
    };
  }

  requireSafeToken(errors, event.eventId, `${path}.eventId`);
  requireNonNegativeInteger(errors, event.sequence, `${path}.sequence`);
  requireSafeToken(errors, event.goalId, `${path}.goalId`);
  requireOptionalSafeToken(errors, event.taskId, `${path}.taskId`);
  requireEnum(errors, event.eventType, `${path}.eventType`, GOAL_EVENT_TYPES);
  requireEnum(errors, event.phase, `${path}.phase`, GOAL_EVENT_PHASES);
  validateActor(errors, event.actor, `${path}.actor`);
  requireIsoTimestamp(errors, event.occurredAt, `${path}.occurredAt`);
  requireIsoTimestamp(errors, event.recordedAt, `${path}.recordedAt`);
  requireNullableString(errors, event.branch, `${path}.branch`);
  requireNullableString(errors, event.commit, `${path}.commit`);
  validateEvidenceRefs(errors, event.evidenceRefs, `${path}.evidenceRefs`);
  requireEventEvidence(errors, event.eventType, event.evidenceRefs, `${path}.evidenceRefs`);
  requireNonEmptyString(errors, event.statement, `${path}.statement`);
  validateOptionalReview(errors, event.review, `${path}.review`);
  validateOptionalGate(errors, event.gate, `${path}.gate`);
  validateOptionalObject(errors, event.blocker, `${path}.blocker`);
  validateOptionalObject(errors, event.metadata, `${path}.metadata`);

  if (event.previousEventHash !== null) {
    requireHash(errors, event.previousEventHash, `${path}.previousEventHash`);
  }

  requireHash(errors, event.eventHash, `${path}.eventHash`);

  return {
    ok: errors.length === 0,
    errors
  };
}

export function validateGoalEventChain(events) {
  const errors = [];

  if (!Array.isArray(events)) {
    return {
      ok: false,
      errors: ['events must be an array']
    };
  }

  let previousEventHash = null;
  const eventIds = new Set();

  events.forEach((event, index) => {
    const path = `events[${index}]`;

    if (!isPlainObject(event)) {
      errors.push(`${path} must be a plain object`);
      previousEventHash = null;
      return;
    }

    if (event.sequence !== index + 1) {
      errors.push(`${path}.sequence must be ${index + 1}`);
    }

    if (event.previousEventHash !== previousEventHash) {
      errors.push(`${path}.previousEventHash must match previous event hash`);
    }

    if (!isNonEmptyString(event.eventId)) {
      errors.push(`${path}.eventId must be a non-empty string`);
    } else if (eventIds.has(event.eventId)) {
      errors.push(`${path}.eventId must be unique`);
    } else {
      eventIds.add(event.eventId);
    }

    if (event.previousEventHash !== null && !HASH_PREFIX_PATTERN.test(event.previousEventHash)) {
      errors.push(`${path}.previousEventHash must be a sha256 hash or null`);
    }

    if (!HASH_PREFIX_PATTERN.test(event.eventHash)) {
      errors.push(`${path}.eventHash must be a sha256 hash`);
    } else {
      const expectedHash = computeGoalEventHash(event);

      if (event.eventHash !== expectedHash) {
        errors.push(`${path}.eventHash must match event content`);
      }
    }

    previousEventHash = event.eventHash;
  });

  return {
    ok: errors.length === 0,
    errors
  };
}

export function computeGoalEventHash(event) {
  if (!isPlainObject(event)) {
    throw new TypeError('event must be a plain object');
  }

  const hashInput = structuredClone(event);
  delete hashInput.eventHash;

  return `sha256:${createHash('sha256').update(canonicalJson(hashInput)).digest('hex')}`;
}

export function isUnsafeEvidenceRef(ref) {
  return ref.startsWith('/') ||
    ref.startsWith('file://') ||
    ref.startsWith('~/') ||
    ref.includes('../') ||
    ref.includes('..\\') ||
    ref.includes('\\') ||
    /^[A-Za-z]:[\\/]/u.test(ref);
}

export function isSafeGoalEventToken(value) {
  return isNonEmptyString(value) &&
    /^[A-Za-z0-9._:-]+$/u.test(value) &&
    !value.includes('..') &&
    !value.includes('/') &&
    !value.includes('\\');
}

export class GoalEventContractError extends Error {
  constructor(code, message, safeDetails) {
    super(message);
    this.name = 'GoalEventContractError';
    this.code = code;

    if (safeDetails !== undefined) {
      this.safeDetails = safeDetails;
    }
  }
}

function validateBaseline(errors, baseline) {
  if (!isPlainObject(baseline)) {
    errors.push('baseline must be a plain object');
    return;
  }

  requireNonEmptyString(errors, baseline.tag, 'baseline.tag');
  requireNullableString(errors, baseline.commit, 'baseline.commit');
  requireNullableString(errors, baseline.evidenceRef, 'baseline.evidenceRef');
}

function validateLogSummary(errors, log, events) {
  if (!isPlainObject(log)) {
    errors.push('log must be a plain object');
    return;
  }

  requireExact(errors, log.appendOnly, 'log.appendOnly', true);
  requireExact(errors, log.storage, 'log.storage', GOAL_EVENT_JOURNAL_STORAGE);
  requireExact(errors, log.eventCount, 'log.eventCount', events.length);
  requireExact(errors, log.firstSequence, 'log.firstSequence', events[0]?.sequence ?? null);
  requireExact(errors, log.lastSequence, 'log.lastSequence', events.at(-1)?.sequence ?? null);
  requireExact(errors, log.lastEventId, 'log.lastEventId', events.at(-1)?.eventId ?? null);
  requireExact(errors, log.lastEventHash, 'log.lastEventHash', events.at(-1)?.eventHash ?? null);
}

function validateActor(errors, actor, path) {
  if (!isPlainObject(actor)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, actor.role, `${path}.role`, GOAL_EVENT_ACTOR_ROLES);
  requireSafeToken(errors, actor.id, `${path}.id`);
}

function validateEvidenceRefs(errors, evidenceRefs, path) {
  if (!Array.isArray(evidenceRefs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  evidenceRefs.forEach((evidenceRef, index) => validateEvidenceRef(errors, evidenceRef, `${path}[${index}]`));
}

function validateEvidenceRef(errors, evidenceRef, path) {
  if (!isPlainObject(evidenceRef)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, evidenceRef.kind, `${path}.kind`, EVIDENCE_REF_KINDS);
  requireNonEmptyString(errors, evidenceRef.ref, `${path}.ref`);
  requireNonEmptyString(errors, evidenceRef.label, `${path}.label`);

  if (typeof evidenceRef.ref !== 'string') {
    return;
  }

  if (isUnsafeEvidenceRef(evidenceRef.ref)) {
    errors.push(`${path}.ref must be a controlled evidence reference`);
  }

  if (evidenceRef.kind === 'repo-doc' && !evidenceRef.ref.startsWith('docs/plans/')) {
    errors.push(`${path}.ref must be under docs/plans/ for repo-doc evidence`);
  }
}

function validateOptionalReview(errors, review, path) {
  if (review === undefined) {
    return;
  }

  validateOptionalObject(errors, review, path);

  if (isPlainObject(review) && Object.hasOwn(review, 'verdict')) {
    requireEnum(errors, review.verdict, `${path}.verdict`, GOAL_EVENT_REVIEW_VERDICTS);
  }
}

function validateOptionalGate(errors, gate, path) {
  if (gate === undefined) {
    return;
  }

  validateOptionalObject(errors, gate, path);

  if (isPlainObject(gate) && Object.hasOwn(gate, 'status')) {
    requireEnum(errors, gate.status, `${path}.status`, GOAL_EVENT_GATE_STATUSES);
  }
}

function validateOptionalObject(errors, value, path) {
  if (value !== undefined && !isPlainObject(value)) {
    errors.push(`${path} must be a plain object when present`);
  }
}

function validatePlanCommand(errors, command) {
  if (!isPlainObject(command)) {
    errors.push('command must be a plain object');
    return;
  }

  requireNonEmptyString(errors, command.name, 'command.name');
  requireNonEmptyString(errors, command.intent, 'command.intent');
  requireExact(errors, command.confirmRequired, 'command.confirmRequired', true);
}

function validateProposedEvents(errors, proposedEvents) {
  if (!Array.isArray(proposedEvents) || proposedEvents.length === 0) {
    errors.push('proposedEvents must be a non-empty array');
    return;
  }

  proposedEvents.forEach((event, index) => {
    const path = `proposedEvents[${index}]`;

    if (!isPlainObject(event)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireEnum(errors, event.eventType, `${path}.eventType`, GOAL_EVENT_TYPES);
    requireOptionalSafeToken(errors, event.taskId, `${path}.taskId`);
    requireEnum(errors, event.phase, `${path}.phase`, GOAL_EVENT_PHASES);
    requireBoolean(errors, event.requiresEvidence, `${path}.requiresEvidence`);
    validateEvidenceRefs(errors, event.evidenceRefs, `${path}.evidenceRefs`);
    requireEventEvidence(errors, event.eventType, event.evidenceRefs, `${path}.evidenceRefs`);
  });
}

function requireEventEvidence(errors, eventType, evidenceRefs, path) {
  if (!EVENT_TYPES_REQUIRING_EVIDENCE.includes(eventType)) {
    return;
  }

  if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0) {
    errors.push(`${path} must contain explicit evidence for ${eventType}`);
  }
}

function validatePlanValidation(errors, validation) {
  if (!isPlainObject(validation)) {
    errors.push('validation must be a plain object');
    return;
  }

  requireEnum(errors, validation.status, 'validation.status', ['ok', 'error']);

  if (!Array.isArray(validation.errors)) {
    errors.push('validation.errors must be an array');
  }

  if (!Array.isArray(validation.warnings)) {
    errors.push('validation.warnings must be an array');
  }
}

function validateWouldAppend(errors, wouldAppend) {
  if (!isPlainObject(wouldAppend)) {
    errors.push('wouldAppend must be a plain object');
    return;
  }

  requireExact(errors, wouldAppend.appendOnly, 'wouldAppend.appendOnly', true);
  requireNonNegativeInteger(errors, wouldAppend.eventCount, 'wouldAppend.eventCount');
  requireExact(errors, wouldAppend.target, 'wouldAppend.target', GOAL_EVENT_JOURNAL_STORAGE);
  requireExact(errors, wouldAppend.writesInDryRun, 'wouldAppend.writesInDryRun', false);
}

function validateConfirm(errors, confirm) {
  if (!isPlainObject(confirm)) {
    errors.push('confirm must be a plain object');
    return;
  }

  requireBoolean(errors, confirm.available, 'confirm.available');

  if (!Array.isArray(confirm.requiredFlags) || !confirm.requiredFlags.includes('--plan-hash')) {
    errors.push('confirm.requiredFlags must include --plan-hash');
  }

  requireNonEmptyString(errors, confirm.copyOnlyCommand, 'confirm.copyOnlyCommand');
}

function validatePlanSafety(errors, safety) {
  if (!isPlainObject(safety)) {
    errors.push('safety must be a plain object');
    return;
  }

  requireExact(errors, safety.dryRunWrites, 'safety.dryRunWrites', false);
  requireExact(errors, safety.confirmWritesAppendOnly, 'safety.confirmWritesAppendOnly', true);
  requireExact(errors, safety.workbenchWriteAvailable, 'safety.workbenchWriteAvailable', false);
  requireExact(errors, safety.browserExecutionAvailable, 'safety.browserExecutionAvailable', false);
  requireExact(errors, safety.modelInvocationAvailable, 'safety.modelInvocationAvailable', false);
  requireExact(errors, safety.arbitraryPathReadAvailable, 'safety.arbitraryPathReadAvailable', false);
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

function requireOptionalSafeToken(errors, value, path) {
  if (value === undefined || value === null) {
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

function requireNonNegativeInteger(errors, value, path) {
  if (!Number.isInteger(value) || value < 0) {
    errors.push(`${path} must be a non-negative integer`);
  }
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp string`);
  }
}

function requireHash(errors, value, path) {
  if (typeof value !== 'string' || !HASH_PREFIX_PATTERN.test(value)) {
    errors.push(`${path} must be a sha256 hash`);
  }
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => value[key] !== undefined)
        .sort()
        .map((key) => [key, canonicalize(value[key])])
    );
  }

  return value;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
