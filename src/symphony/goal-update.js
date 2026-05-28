import { createHash } from 'node:crypto';

import {
  GOAL_EVENT_JOURNAL_STORAGE,
  GOAL_UPDATE_PLAN_CONTRACT_NAME,
  GOAL_UPDATE_PLAN_CONTRACT_VERSION,
  assertGoalUpdatePlanContract,
  isSafeGoalEventToken
} from './goal-event-contracts.js';
import { appendGoalEvent } from './goal-event-journal.js';

const ALLOWED_UPDATE_EVENTS = Object.freeze([
  'worker.started',
  'worker.evidence-recorded',
  'worker.self-check-passed',
  'worker.self-check-failed',
  'blocker.opened',
  'blocker.resolved'
]);
const EVIDENCE_KIND_PREFIXES = Object.freeze([
  'repo-doc',
  'artifact-ref',
  'commit',
  'command-evidence',
  'external-note'
]);
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;

export class GoalUpdateError extends Error {
  constructor(code, message, safeDetails) {
    super(message);
    this.name = 'GoalUpdateError';
    this.code = code;

    if (safeDetails !== undefined) {
      this.safeDetails = safeDetails;
    }
  }
}

export function buildGoalUpdatePlan(options = {}) {
  const normalized = normalizeGoalUpdateInput(options);

  return buildGoalUpdatePlanFromNormalized(normalized);
}

function buildGoalUpdatePlanFromNormalized(normalized) {
  const planId = buildPlanId(normalized);
  const proposedEvent = buildProposedEvent(normalized);
  const planHash = computePlanHash({
    planId,
    normalized,
    proposedEvent
  });
  const plan = {
    contractName: GOAL_UPDATE_PLAN_CONTRACT_NAME,
    contractVersion: GOAL_UPDATE_PLAN_CONTRACT_VERSION,
    planId,
    planHash,
    goalId: normalized.goalId,
    mode: 'dry-run',
    command: {
      name: 'symphony goal update',
      intent: 'record-worker-task-event',
      confirmRequired: true
    },
    actor: {
      role: 'worker',
      id: normalized.actorId
    },
    proposedEvents: [proposedEvent],
    validation: {
      status: 'ok',
      errors: [],
      warnings: []
    },
    preconditions: [{
      id: 'worker-event-only',
      status: 'ok',
      message: 'symphony goal update records only worker or task-level events.'
    }],
    wouldAppend: {
      appendOnly: true,
      eventCount: 1,
      target: GOAL_EVENT_JOURNAL_STORAGE,
      writesInDryRun: false
    },
    ledgerPreview: {
      contractName: 'goal-progress-ledger.v1',
      statusSource: 'goal-update-plan.v1 dry-run preview',
      changes: [buildLedgerPreviewChange(normalized)]
    },
    confirm: {
      available: true,
      requiredFlags: ['--confirm', '--plan-hash'],
      copyOnlyCommand: buildConfirmCommand({
        normalized,
        planHash
      })
    },
    safety: {
      dryRunWrites: false,
      confirmWritesAppendOnly: true,
      workbenchWriteAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      arbitraryPathReadAvailable: false
    }
  };

  try {
    return assertGoalUpdatePlanContract(plan);
  } catch (error) {
    throw new GoalUpdateError(
      'invalid-goal-update-plan',
      'Goal update plan is invalid.',
      { reason: error.safeDetails?.reason ?? error.message }
    );
  }
}

export async function confirmGoalUpdate(options = {}) {
  const normalized = normalizeGoalUpdateInput(options);

  if (typeof normalized.planHash !== 'string') {
    throw new GoalUpdateError(
      'missing-plan-hash',
      'goal update confirm requires --plan-hash.'
    );
  }

  if (!HASH_PATTERN.test(normalized.planHash)) {
    throw new GoalUpdateError(
      'invalid-plan-hash',
      '--plan-hash must be a sha256 hash.'
    );
  }

  const plan = buildGoalUpdatePlanFromNormalized(normalized);

  if (plan.planHash !== normalized.planHash) {
    throw new GoalUpdateError(
      'plan-hash-mismatch',
      'goal update plan hash does not match the current input; append refused.'
    );
  }

  const result = await appendGoalEvent({
    stateDir: normalized.stateDir,
    mode: 'confirm',
    event: buildAppendEvent(normalized)
  });

  return {
    mode: 'confirm',
    status: result.status,
    written: result.written,
    appendOnly: result.appendOnly,
    goalId: normalized.goalId,
    taskId: normalized.taskId,
    eventType: normalized.eventType,
    event: result.event,
    journal: result.journal,
    safety: {
      confirmWritesAppendOnly: true,
      workbenchWriteAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      arbitraryPathReadAvailable: false
    }
  };
}

function normalizeGoalUpdateInput(options) {
  if (!isPlainObject(options)) {
    throw new GoalUpdateError(
      'invalid-goal-update-input',
      'goal update input must be an object.'
    );
  }

  const normalized = {
    stateDir: normalizeStateDir(options.stateDir),
    goalId: normalizeSafeToken(options.goalId, '--goal'),
    taskId: normalizeSafeToken(options.taskId, '--task'),
    eventType: normalizeEventType(options.eventType),
    actorId: normalizeSafeToken(options.actorId, '--actor'),
    evidenceRefs: normalizeEvidenceRefs(options.evidenceRefs),
    statement: normalizeOptionalString(options.statement, '--statement') ?? defaultStatement(options),
    branch: normalizeNullableString(options.branch, '--branch'),
    commit: normalizeNullableString(options.commit, '--commit'),
    planHash: options.planHash,
    blocker: normalizeOptionalObject(options.blocker, '--blocker')
  };

  return normalized;
}

function normalizeStateDir(value) {
  if (value === undefined) {
    return '.symphony';
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalUpdateError(
      'invalid-state-dir',
      '--state-dir must be a non-empty string.'
    );
  }

  return value;
}

function normalizeSafeToken(value, field) {
  if (!isSafeGoalEventToken(value)) {
    throw new GoalUpdateError(
      'invalid-goal-update-input',
      `${field} must be a safe non-empty token.`
    );
  }

  return value;
}

function normalizeEventType(value) {
  if (!ALLOWED_UPDATE_EVENTS.includes(value)) {
    throw new GoalUpdateError(
      'unsupported-goal-update-event',
      `goal update supports only worker/task-level events: ${ALLOWED_UPDATE_EVENTS.join(', ')}.`
    );
  }

  return value;
}

function normalizeEvidenceRefs(value) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new GoalUpdateError(
      'invalid-evidence-ref',
      '--evidence-ref must be provided as one or more values.'
    );
  }

  return value.map((entry) => normalizeEvidenceRef(entry));
}

function normalizeEvidenceRef(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalUpdateError(
      'invalid-evidence-ref',
      '--evidence-ref must be a non-empty controlled evidence reference.'
    );
  }

  const trimmed = value.trim();
  const [kind, ref] = splitEvidenceKind(trimmed);

  return {
    kind,
    ref,
    label: `Evidence for ${ref}`
  };
}

function splitEvidenceKind(value) {
  const separator = value.indexOf(':');

  if (separator > 0) {
    const prefix = value.slice(0, separator);

    if (EVIDENCE_KIND_PREFIXES.includes(prefix)) {
      return [prefix, value.slice(separator + 1)];
    }
  }

  return ['repo-doc', value];
}

function normalizeOptionalString(value, field) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalUpdateError(
      'invalid-goal-update-input',
      `${field} must be a non-empty string when provided.`
    );
  }

  return value;
}

function normalizeNullableString(value, field) {
  if (value === undefined) {
    return null;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalUpdateError(
      'invalid-goal-update-input',
      `${field} must be a non-empty string when provided.`
    );
  }

  return value;
}

function normalizeOptionalObject(value, field) {
  if (value === undefined) {
    return undefined;
  }

  if (!isPlainObject(value)) {
    throw new GoalUpdateError(
      'invalid-goal-update-input',
      `${field} must be an object when provided.`
    );
  }

  return structuredClone(value);
}

function defaultStatement(options) {
  const taskId = typeof options.taskId === 'string' ? options.taskId : 'task';

  switch (options.eventType) {
    case 'worker.started':
      return `Worker started ${taskId}.`;
    case 'worker.evidence-recorded':
      return `Worker evidence recorded for ${taskId}.`;
    case 'worker.self-check-passed':
      return `Worker self-check passed for ${taskId}.`;
    case 'worker.self-check-failed':
      return `Worker self-check failed for ${taskId}.`;
    case 'blocker.opened':
      return `Blocker opened for ${taskId}.`;
    case 'blocker.resolved':
      return `Blocker resolved for ${taskId}.`;
    default:
      return `Worker event recorded for ${taskId}.`;
  }
}

function buildProposedEvent(normalized) {
  return stripUndefined({
    eventType: normalized.eventType,
    taskId: normalized.taskId,
    phase: phaseForEvent(normalized.eventType),
    requiresEvidence: normalized.eventType.startsWith('worker.self-check-') ||
      normalized.eventType === 'worker.evidence-recorded',
    evidenceRefs: structuredClone(normalized.evidenceRefs),
    statement: normalized.statement,
    branch: normalized.branch,
    commit: normalized.commit,
    blocker: normalized.blocker
  });
}

function buildAppendEvent(normalized) {
  return stripUndefined({
    eventId: buildEventId(normalized),
    goalId: normalized.goalId,
    taskId: normalized.taskId,
    eventType: normalized.eventType,
    phase: phaseForEvent(normalized.eventType),
    actor: {
      role: 'worker',
      id: normalized.actorId
    },
    branch: normalized.branch,
    commit: normalized.commit,
    evidenceRefs: structuredClone(normalized.evidenceRefs),
    statement: normalized.statement,
    blocker: normalized.blocker,
    metadata: {
      sourceCommand: 'symphony goal update'
    }
  });
}

function phaseForEvent(eventType) {
  if (eventType.startsWith('blocker.')) {
    return 'implement';
  }

  return 'implement';
}

function buildLedgerPreviewChange(normalized) {
  return {
    taskId: normalized.taskId,
    fromStatus: 'unknown',
    toStatus: statusPreviewForEvent(normalized.eventType),
    reason: `explicit ${normalized.eventType} event would be appended`
  };
}

function statusPreviewForEvent(eventType) {
  switch (eventType) {
    case 'worker.started':
      return 'in-progress';
    case 'worker.evidence-recorded':
    case 'worker.self-check-passed':
      return 'needs-review';
    case 'worker.self-check-failed':
    case 'blocker.opened':
      return 'blocked';
    case 'blocker.resolved':
      return 'in-progress';
    default:
      return 'unknown';
  }
}

function buildPlanId(normalized) {
  return `plan_${shortHash(stableInputForHash(normalized))}`;
}

function buildEventId(normalized) {
  return `evt_${shortHash(stableInputForHash(normalized))}`;
}

function computePlanHash({ planId, normalized, proposedEvent }) {
  return `sha256:${createHash('sha256').update(canonicalJson({
    contractName: GOAL_UPDATE_PLAN_CONTRACT_NAME,
    contractVersion: GOAL_UPDATE_PLAN_CONTRACT_VERSION,
    planId,
    goalId: normalized.goalId,
    command: {
      name: 'symphony goal update',
      intent: 'record-worker-task-event',
      confirmRequired: true
    },
    actor: {
      role: 'worker',
      id: normalized.actorId
    },
    proposedEvents: [proposedEvent],
    wouldAppend: {
      appendOnly: true,
      eventCount: 1,
      target: GOAL_EVENT_JOURNAL_STORAGE,
      writesInDryRun: false
    },
    safety: {
      dryRunWrites: false,
      confirmWritesAppendOnly: true,
      workbenchWriteAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      arbitraryPathReadAvailable: false
    }
  })).digest('hex')}`;
}

function stableInputForHash(normalized) {
  return {
    goalId: normalized.goalId,
    taskId: normalized.taskId,
    eventType: normalized.eventType,
    actorId: normalized.actorId,
    evidenceRefs: normalized.evidenceRefs,
    statement: normalized.statement,
    branch: normalized.branch,
    commit: normalized.commit,
    blocker: normalized.blocker
  };
}

function shortHash(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex').slice(0, 16);
}

function buildConfirmCommand({ normalized, planHash }) {
  const args = [
    'symphony',
    'goal',
    'update',
    '--goal',
    normalized.goalId,
    '--task',
    normalized.taskId,
    '--event',
    normalized.eventType,
    '--actor',
    normalized.actorId
  ];

  for (const evidenceRef of normalized.evidenceRefs) {
    args.push('--evidence-ref', evidenceRef.kind === 'repo-doc' ? evidenceRef.ref : `${evidenceRef.kind}:${evidenceRef.ref}`);
  }

  if (normalized.statement !== defaultStatement(normalized)) {
    args.push('--statement', normalized.statement);
  }

  if (normalized.branch !== null) {
    args.push('--branch', normalized.branch);
  }

  if (normalized.commit !== null) {
    args.push('--commit', normalized.commit);
  }

  args.push('--confirm', '--plan-hash', planHash);

  return args.map(shellQuote).join(' ');
}

function shellQuote(value) {
  if (/^[A-Za-z0-9._:/=-]+$/u.test(value)) {
    return value;
  }

  return `'${value.replaceAll("'", "'\"'\"'")}'`;
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

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
