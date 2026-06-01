import { createHash } from 'node:crypto';

import {
  GOAL_EVENT_JOURNAL_STORAGE,
  GOAL_UPDATE_PLAN_CONTRACT_NAME,
  GOAL_UPDATE_PLAN_CONTRACT_VERSION,
  assertGoalUpdatePlanContract,
  isUnsafeEvidenceRef,
  isSafeGoalEventToken
} from './goal-event-contracts.js';
import { appendGoalEvent } from './goal-event-journal.js';

const GATE_STATUSES = Object.freeze(['passed', 'failed', 'declared']);
const EVIDENCE_KIND_PREFIXES = Object.freeze([
  'repo-doc',
  'artifact-ref'
]);
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;

export class GoalGateError extends Error {
  constructor(code, message, safeDetails) {
    super(message);
    this.name = 'GoalGateError';
    this.code = code;

    if (safeDetails !== undefined) {
      this.safeDetails = safeDetails;
    }
  }
}

export function buildGoalGatePlan(options = {}) {
  const normalized = normalizeGoalGateInput(options);

  return buildGoalGatePlanFromNormalized(normalized);
}

export async function confirmGoalGate(options = {}) {
  const normalized = normalizeGoalGateInput(options);

  if (typeof normalized.planHash !== 'string') {
    throw new GoalGateError(
      'missing-plan-hash',
      'goal gate confirm requires --plan-hash.'
    );
  }

  if (!HASH_PATTERN.test(normalized.planHash)) {
    throw new GoalGateError(
      'invalid-plan-hash',
      '--plan-hash must be a sha256 hash.'
    );
  }

  const plan = buildGoalGatePlanFromNormalized(normalized);

  if (plan.planHash !== normalized.planHash) {
    throw new GoalGateError(
      'plan-hash-mismatch',
      'goal gate plan hash does not match the current input; append refused.'
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
    gate: normalized.gateName,
    gateStatus: normalized.status,
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

function normalizeGoalGateInput(options) {
  if (!isPlainObject(options)) {
    throw new GoalGateError(
      'invalid-goal-gate-input',
      'goal gate input must be an object.'
    );
  }

  const base = {
    stateDir: normalizeStateDir(options.stateDir),
    goalId: normalizeSafeToken(options.goalId, '--goal'),
    gateName: normalizeSafeToken(options.gateName, '--gate'),
    taskId: normalizeOptionalSafeToken(options.taskId, '--task'),
    status: normalizeGateStatus(options.status),
    verifierId: normalizeSafeToken(options.verifierId, '--verifier'),
    evidenceRefs: normalizeEvidenceRefs(options.evidenceRefs),
    statement: normalizeOptionalString(options.statement, '--statement'),
    branch: normalizeNullableString(options.branch, '--branch'),
    commit: normalizeNullableString(options.commit, '--commit'),
    failedCommands: normalizeFailedCommands(options.failedCommands),
    planHash: options.planHash
  };
  const gateMapping = mapGateEvent(base);
  const normalized = {
    ...base,
    ...gateMapping
  };

  if (normalized.evidenceRefs.length === 0) {
    throw new GoalGateError(
      'missing-gate-evidence',
      'gate evidence ref is required.'
    );
  }

  if (normalized.failedCommands.length > 0 && normalized.eventType !== 'main.verification-failed') {
    throw new GoalGateError(
      'failed-command-not-applicable',
      '--failed-command is allowed only with --gate main-verification --status failed.'
    );
  }

  return {
    ...normalized,
    statement: normalized.statement ?? defaultStatement(normalized)
  };
}

function buildGoalGatePlanFromNormalized(normalized) {
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
      name: 'symphony goal gate',
      intent: 'record-goal-gate',
      confirmRequired: true
    },
    actor: {
      role: normalized.actorRole,
      id: normalized.verifierId
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
    throw new GoalGateError(
      'invalid-goal-update-plan',
      'Goal gate plan is invalid.',
      { reason: error.safeDetails?.reason ?? error.message }
    );
  }
}

function mapGateEvent(base) {
  if (base.gateName === 'main-verification') {
    if (base.status === 'declared') {
      throw new GoalGateError(
        'unsupported-gate-status',
        'main-verification supports only --status passed or failed.'
      );
    }

    if (base.taskId === null) {
      throw new GoalGateError(
        'missing-main-verification-task',
        'main-verification requires --task.'
      );
    }

    return {
      eventType: base.status === 'passed' ? 'main.verification-passed' : 'main.verification-failed',
      phase: 'main-verification',
      actorRole: 'main-verifier',
      previewStatus: base.status === 'passed' ? 'main-verified' : 'main-verification-failed'
    };
  }

  if (base.gateName === 'release.ready') {
    if (base.status !== 'declared') {
      throw new GoalGateError(
        'unsupported-gate-status',
        'release.ready requires --status declared.'
      );
    }

    return {
      eventType: 'release.ready-declared',
      phase: 'release-prep',
      actorRole: 'release-manager',
      previewStatus: 'release-ready'
    };
  }

  if (base.status === 'declared') {
    throw new GoalGateError(
      'unsupported-gate-status',
      'status declared is only valid for release.ready.'
    );
  }

  if (!base.gateName.startsWith('release.')) {
    throw new GoalGateError(
      'unsupported-gate-name',
      'goal gate requires --gate main-verification, release.ready, or release.<gate>.'
    );
  }

  return {
    eventType: base.status === 'passed' ? 'release.gate-passed' : 'release.gate-failed',
    phase: 'release-gate',
    actorRole: 'release-verifier',
    previewStatus: base.status === 'passed' ? 'release-gate-passed' : 'release-gate-failed'
  };
}

function normalizeStateDir(value) {
  if (value === undefined) {
    return '.symphony';
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalGateError(
      'invalid-state-dir',
      '--state-dir must be a non-empty string.'
    );
  }

  return value;
}

function normalizeSafeToken(value, field) {
  if (!isSafeGoalEventToken(value)) {
    throw new GoalGateError(
      'invalid-goal-gate-input',
      `${field} must be a safe non-empty token.`
    );
  }

  return value;
}

function normalizeOptionalSafeToken(value, field) {
  if (value === undefined || value === null) {
    return null;
  }

  return normalizeSafeToken(value, field);
}

function normalizeGateStatus(value) {
  if (!GATE_STATUSES.includes(value)) {
    throw new GoalGateError(
      'unsupported-gate-status',
      'goal gate requires --status passed, failed, or declared.'
    );
  }

  return value;
}

function normalizeEvidenceRefs(value) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new GoalGateError(
      'invalid-evidence-ref',
      '--evidence-ref must be provided as one or more values.'
    );
  }

  return value.map((entry) => normalizeEvidenceRef(entry));
}

function normalizeEvidenceRef(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalGateError(
      'invalid-evidence-ref',
      '--evidence-ref must be a non-empty controlled evidence reference.'
    );
  }

  const trimmed = value.trim();
  const [kind, ref] = splitEvidenceKind(trimmed);

  if (isUncontrolledEvidenceRef(kind, ref)) {
    throw new GoalGateError(
      'invalid-evidence-ref',
      '--evidence-ref must be a controlled docs/plans or managed artifact reference.'
    );
  }

  return {
    kind,
    ref,
    label: `Gate evidence for ${ref}`
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

function isUncontrolledEvidenceRef(kind, ref) {
  return ref.trim() === '' ||
    isUnsafeEvidenceRef(ref) ||
    hasEncodedTraversal(ref) ||
    (kind === 'repo-doc' && !ref.startsWith('docs/plans/'));
}

function hasEncodedTraversal(ref) {
  const lower = ref.toLowerCase();

  return lower.includes('%2e') || lower.includes('%2f') || lower.includes('%5c');
}

function normalizeOptionalString(value, field) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new GoalGateError(
      'invalid-goal-gate-input',
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
    throw new GoalGateError(
      'invalid-goal-gate-input',
      `${field} must be a non-empty string when provided.`
    );
  }

  return value;
}

function normalizeFailedCommands(value) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new GoalGateError(
      'invalid-failed-command',
      '--failed-command must be provided as one or more values.'
    );
  }

  const commands = [];

  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.trim() === '') {
      throw new GoalGateError(
        'invalid-failed-command',
        '--failed-command must be a non-empty command line.',
        { field: `failedCommands[${index}]` }
      );
    }

    const command = entry.trim();

    if (/[\r\n]/u.test(command)) {
      throw new GoalGateError(
        'invalid-failed-command',
        '--failed-command must be a single command line.',
        { field: `failedCommands[${index}]` }
      );
    }

    if (!commands.includes(command)) {
      commands.push(command);
    }
  });

  return commands;
}

function defaultStatement(normalized) {
  if (normalized.eventType === 'main.verification-passed') {
    return `Main verification passed for ${normalized.taskId}.`;
  }

  if (normalized.eventType === 'main.verification-failed') {
    return `Main verification failed for ${normalized.taskId}.`;
  }

  if (normalized.eventType === 'release.gate-passed') {
    return `Release gate ${normalized.gateName} passed.`;
  }

  if (normalized.eventType === 'release.gate-failed') {
    return `Release gate ${normalized.gateName} failed.`;
  }

  return 'Release readiness declared.';
}

function buildProposedEvent(normalized) {
  return stripUndefined({
    eventType: normalized.eventType,
    taskId: normalized.taskId,
    phase: normalized.phase,
    requiresEvidence: true,
    evidenceRefs: structuredClone(normalized.evidenceRefs),
    statement: normalized.statement,
    branch: normalized.branch,
    commit: normalized.commit,
    gate: {
      name: normalized.gateName,
      status: normalized.status
    },
    metadata: normalized.failedCommands.length === 0
      ? undefined
      : {
          failedCommands: [...normalized.failedCommands]
        }
  });
}

function buildAppendEvent(normalized) {
  return {
    eventId: buildEventId(normalized),
    goalId: normalized.goalId,
    taskId: normalized.taskId,
    eventType: normalized.eventType,
    phase: normalized.phase,
    actor: {
      role: normalized.actorRole,
      id: normalized.verifierId
    },
    branch: normalized.branch,
    commit: normalized.commit,
    evidenceRefs: structuredClone(normalized.evidenceRefs),
    statement: normalized.statement,
    gate: {
      name: normalized.gateName,
      status: normalized.status
    },
    metadata: stripUndefined({
      sourceCommand: 'symphony goal gate',
      failedCommands: normalized.failedCommands.length === 0
        ? undefined
        : [...normalized.failedCommands]
    })
  };
}

function buildPreconditions(normalized) {
  return [{
    id: 'explicit-gate-event',
    status: 'ok',
    message: normalized.eventType === 'release.ready-declared'
      ? 'Release readiness is declared only by explicit release.ready --status declared input.'
      : 'Gate result is recorded only from explicit --gate and --status input.'
  }];
}

function buildLedgerPreviewChange(normalized) {
  return {
    taskId: normalized.taskId,
    fromStatus: 'unknown',
    toStatus: normalized.previewStatus,
    reason: `explicit ${normalized.eventType} event would be appended`
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
      name: 'symphony goal gate',
      intent: 'record-goal-gate',
      confirmRequired: true
    },
    actor: {
      role: normalized.actorRole,
      id: normalized.verifierId
    },
    proposedEvents: [proposedEvent],
    preconditions,
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
    gateName: normalized.gateName,
    status: normalized.status,
    eventType: normalized.eventType,
    verifierId: normalized.verifierId,
    evidenceRefs: normalized.evidenceRefs,
    statement: normalized.statement,
    branch: normalized.branch,
    commit: normalized.commit,
    failedCommands: normalized.failedCommands
  };
}

function shortHash(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex').slice(0, 16);
}

function buildConfirmCommand({ normalized, planHash }) {
  const args = [
    'symphony',
    'goal',
    'gate',
    '--goal',
    normalized.goalId,
    '--gate',
    normalized.gateName
  ];

  if (normalized.taskId !== null) {
    args.push('--task', normalized.taskId);
  }

  args.push('--status', normalized.status, '--verifier', normalized.verifierId);

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

  for (const failedCommand of normalized.failedCommands) {
    args.push('--failed-command', failedCommand);
  }

  args.push('--confirm', '--plan-hash', planHash);

  return args.map(shellQuote).join(' ');
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );
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
