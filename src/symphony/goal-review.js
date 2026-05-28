import { createHash } from 'node:crypto';

import {
  GOAL_EVENT_JOURNAL_STORAGE,
  GOAL_UPDATE_PLAN_CONTRACT_NAME,
  GOAL_UPDATE_PLAN_CONTRACT_VERSION,
  assertGoalUpdatePlanContract,
  isSafeGoalEventToken
} from './goal-event-contracts.js';
import {
  appendGoalEvent,
  readGoalEventJournal
} from './goal-event-journal.js';

const REVIEW_VERDICTS = Object.freeze({
  approved: {
    eventType: 'reviewer.approved',
    reviewVerdict: 'APPROVED',
    previewStatus: 'approved'
  },
  'needs-revision': {
    eventType: 'reviewer.needs-revision',
    reviewVerdict: 'NEEDS_REVISION',
    previewStatus: 'needs-revision'
  }
});
const EVIDENCE_KIND_PREFIXES = Object.freeze([
  'repo-doc',
  'artifact-ref',
  'commit',
  'command-evidence',
  'external-note'
]);
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;

export class GoalReviewError extends Error {
  constructor(code, message, safeDetails) {
    super(message);
    this.name = 'GoalReviewError';
    this.code = code;

    if (safeDetails !== undefined) {
      this.safeDetails = safeDetails;
    }
  }
}

export async function buildGoalReviewPlan(options = {}) {
  const normalized = await normalizeGoalReviewInput(options);

  return buildGoalReviewPlanFromNormalized(normalized);
}

export async function confirmGoalReview(options = {}) {
  const normalized = await normalizeGoalReviewInput(options);

  if (typeof normalized.planHash !== 'string') {
    throw new GoalReviewError(
      'missing-plan-hash',
      'goal review confirm requires --plan-hash.'
    );
  }

  if (!HASH_PATTERN.test(normalized.planHash)) {
    throw new GoalReviewError(
      'invalid-plan-hash',
      '--plan-hash must be a sha256 hash.'
    );
  }

  const plan = buildGoalReviewPlanFromNormalized(normalized);

  if (plan.planHash !== normalized.planHash) {
    throw new GoalReviewError(
      'plan-hash-mismatch',
      'goal review plan hash does not match the current input; append refused.'
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
    eventType: normalized.verdict.eventType,
    verdict: normalized.verdictName,
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

async function normalizeGoalReviewInput(options) {
  if (!isPlainObject(options)) {
    throw new GoalReviewError(
      'invalid-goal-review-input',
      'goal review input must be an object.'
    );
  }

  const base = {
    stateDir: normalizeStateDir(options.stateDir),
    goalId: normalizeSafeToken(options.goalId, '--goal'),
    taskId: normalizeSafeToken(options.taskId, '--task'),
    reviewerId: normalizeSafeToken(options.reviewerId, '--reviewer'),
    verdictName: normalizeVerdictName(options.verdict),
    evidenceRefs: normalizeEvidenceRefs(options.evidenceRefs),
    statement: normalizeOptionalString(options.statement, '--statement') ?? defaultStatement(options),
    branch: normalizeNullableString(options.branch, '--branch'),
    commit: normalizeNullableString(options.commit, '--commit'),
    planHash: options.planHash
  };

  if (base.evidenceRefs.length === 0) {
    throw new GoalReviewError(
      'missing-review-evidence',
      'reviewer evidence ref is required.'
    );
  }

  const latestWorkerId = await readLatestWorkerId(base);

  if (latestWorkerId !== null && latestWorkerId === base.reviewerId) {
    throw new GoalReviewError(
      'reviewer-worker-conflict',
      'Reviewer id must differ from latest worker id for this task.'
    );
  }

  return {
    ...base,
    latestWorkerId,
    verdict: REVIEW_VERDICTS[base.verdictName]
  };
}

function buildGoalReviewPlanFromNormalized(normalized) {
  const planId = buildPlanId(normalized);
  const proposedEvent = buildProposedEvent(normalized);
  const preconditions = buildPreconditions(normalized);
  const planHash = computePlanHash({
    planId,
    normalized,
    proposedEvent,
    preconditions
  });
  const plan = {
    contractName: GOAL_UPDATE_PLAN_CONTRACT_NAME,
    contractVersion: GOAL_UPDATE_PLAN_CONTRACT_VERSION,
    planId,
    planHash,
    goalId: normalized.goalId,
    mode: 'dry-run',
    command: {
      name: 'symphony goal review',
      intent: 'record-review-verdict',
      confirmRequired: true
    },
    actor: {
      role: 'reviewer',
      id: normalized.reviewerId
    },
    proposedEvents: [proposedEvent],
    validation: {
      status: 'ok',
      errors: [],
      warnings: []
    },
    preconditions,
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
    throw new GoalReviewError(
      'invalid-goal-update-plan',
      'Goal review plan is invalid.',
      { reason: error.safeDetails?.reason ?? error.message }
    );
  }
}

async function readLatestWorkerId({ stateDir, goalId, taskId }) {
  let journal;

  try {
    journal = await readGoalEventJournal({ stateDir, goalId });
  } catch (error) {
    throw new GoalReviewError(
      'goal-review-history-invalid',
      'goal review could not read worker history safely.',
      { reason: error.safeDetails?.reason ?? error.message }
    );
  }

  for (let index = journal.events.length - 1; index >= 0; index -= 1) {
    const event = journal.events[index];

    if (event.taskId === taskId && event.actor.role === 'worker') {
      return event.actor.id;
    }
  }

  return null;
}

function normalizeStateDir(value) {
  if (value === undefined) {
    return '.symphony';
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalReviewError(
      'invalid-state-dir',
      '--state-dir must be a non-empty string.'
    );
  }

  return value;
}

function normalizeSafeToken(value, field) {
  if (!isSafeGoalEventToken(value)) {
    throw new GoalReviewError(
      'invalid-goal-review-input',
      `${field} must be a safe non-empty token.`
    );
  }

  return value;
}

function normalizeVerdictName(value) {
  if (!Object.hasOwn(REVIEW_VERDICTS, value)) {
    throw new GoalReviewError(
      'unsupported-review-verdict',
      'goal review requires --verdict approved or needs-revision.'
    );
  }

  return value;
}

function normalizeEvidenceRefs(value) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new GoalReviewError(
      'invalid-evidence-ref',
      '--evidence-ref must be provided as one or more values.'
    );
  }

  return value.map((entry) => normalizeEvidenceRef(entry));
}

function normalizeEvidenceRef(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalReviewError(
      'invalid-evidence-ref',
      '--evidence-ref must be a non-empty controlled evidence reference.'
    );
  }

  const trimmed = value.trim();
  const [kind, ref] = splitEvidenceKind(trimmed);

  return {
    kind,
    ref,
    label: `Review evidence for ${ref}`
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
    throw new GoalReviewError(
      'invalid-goal-review-input',
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
    throw new GoalReviewError(
      'invalid-goal-review-input',
      `${field} must be a non-empty string when provided.`
    );
  }

  return value;
}

function defaultStatement(options) {
  const taskId = typeof options.taskId === 'string' ? options.taskId : 'task';
  const verdictName = typeof options.verdict === 'string' ? options.verdict : options.verdictName;

  if (verdictName === 'needs-revision') {
    return `Independent reviewer requested revision for ${taskId}.`;
  }

  return `Independent reviewer approved ${taskId}.`;
}

function buildProposedEvent(normalized) {
  return {
    eventType: normalized.verdict.eventType,
    taskId: normalized.taskId,
    phase: 'review',
    requiresEvidence: true,
    evidenceRefs: structuredClone(normalized.evidenceRefs),
    statement: normalized.statement,
    branch: normalized.branch,
    commit: normalized.commit,
    review: {
      verdict: normalized.verdict.reviewVerdict
    }
  };
}

function buildAppendEvent(normalized) {
  return {
    eventId: buildEventId(normalized),
    goalId: normalized.goalId,
    taskId: normalized.taskId,
    eventType: normalized.verdict.eventType,
    phase: 'review',
    actor: {
      role: 'reviewer',
      id: normalized.reviewerId
    },
    branch: normalized.branch,
    commit: normalized.commit,
    evidenceRefs: structuredClone(normalized.evidenceRefs),
    statement: normalized.statement,
    review: {
      verdict: normalized.verdict.reviewVerdict
    },
    metadata: {
      sourceCommand: 'symphony goal review'
    }
  };
}

function buildPreconditions(normalized) {
  return [{
    id: 'reviewer-is-not-worker',
    status: 'ok',
    message: normalized.latestWorkerId === null
      ? 'No worker event is recorded for this task; reviewer id has no worker conflict.'
      : 'Reviewer id differs from latest worker id recorded for this task.'
  }];
}

function buildLedgerPreviewChange(normalized) {
  return {
    taskId: normalized.taskId,
    fromStatus: 'needs-review',
    toStatus: normalized.verdict.previewStatus,
    reason: `explicit ${normalized.verdict.eventType} event would be appended`
  };
}

function buildPlanId(normalized) {
  return `plan_${shortHash(stableInputForHash(normalized))}`;
}

function buildEventId(normalized) {
  return `evt_${shortHash(stableInputForHash(normalized))}`;
}

function computePlanHash({ planId, normalized, proposedEvent, preconditions }) {
  return `sha256:${createHash('sha256').update(canonicalJson({
    contractName: GOAL_UPDATE_PLAN_CONTRACT_NAME,
    contractVersion: GOAL_UPDATE_PLAN_CONTRACT_VERSION,
    planId,
    goalId: normalized.goalId,
    command: {
      name: 'symphony goal review',
      intent: 'record-review-verdict',
      confirmRequired: true
    },
    actor: {
      role: 'reviewer',
      id: normalized.reviewerId
    },
    proposedEvents: [proposedEvent],
    preconditions,
    latestWorkerId: normalized.latestWorkerId,
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
    eventType: normalized.verdict.eventType,
    reviewerId: normalized.reviewerId,
    verdictName: normalized.verdictName,
    evidenceRefs: normalized.evidenceRefs,
    statement: normalized.statement,
    branch: normalized.branch,
    commit: normalized.commit
  };
}

function shortHash(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex').slice(0, 16);
}

function buildConfirmCommand({ normalized, planHash }) {
  const args = [
    'symphony',
    'goal',
    'review',
    '--goal',
    normalized.goalId,
    '--task',
    normalized.taskId,
    '--reviewer',
    normalized.reviewerId,
    '--verdict',
    normalized.verdictName
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

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
