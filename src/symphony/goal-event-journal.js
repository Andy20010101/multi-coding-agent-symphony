import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { redactSecrets } from '../redaction.js';
import {
  GOAL_EVENT_ACTOR_ROLES,
  GOAL_EVENT_JOURNAL_STORAGE,
  GOAL_EVENT_LOG_CONTRACT_NAME,
  GOAL_EVENT_LOG_CONTRACT_VERSION,
  GOAL_EVENT_PHASES,
  GOAL_EVENT_TYPES,
  assertGoalEventLogContract,
  computeGoalEventHash,
  validateGoalEventChain
} from './goal-event-contracts.js';

export {
  GOAL_EVENT_ACTOR_ROLES,
  GOAL_EVENT_JOURNAL_STORAGE,
  GOAL_EVENT_LOG_CONTRACT_NAME,
  GOAL_EVENT_LOG_CONTRACT_VERSION,
  GOAL_EVENT_PHASES,
  GOAL_EVENT_TYPES,
  computeGoalEventHash,
  validateGoalEventChain
} from './goal-event-contracts.js';

const EVIDENCE_REF_KINDS = Object.freeze([
  'repo-doc',
  'artifact-ref',
  'commit',
  'command-evidence',
  'external-note'
]);
const DEFAULT_BASELINE = Object.freeze({
  tag: 'v17',
  commit: null,
  evidenceRef: null
});
const APPEND_GOAL_EVENT_OPTION_KEYS = new Set([
  'stateDir',
  'mode',
  'event',
  'recordedAt'
]);
const READ_GOAL_EVENT_JOURNAL_OPTION_KEYS = new Set([
  'stateDir',
  'goalId',
  'goalTitle',
  'baseline'
]);
const MANAGED_PATH_OPTION_MESSAGE = 'Goal event journal accepts only managed writer options.';
const journalWriteChains = new Map();

export class GoalEventJournalError extends Error {
  constructor(code, message, safeDetails) {
    super(message);
    this.name = 'GoalEventJournalError';
    this.code = code;

    if (safeDetails !== undefined) {
      this.safeDetails = safeDetails;
    }
  }
}

export async function appendGoalEvent(options = {}) {
  assertKnownOptions(options, APPEND_GOAL_EVENT_OPTION_KEYS);

  const {
    stateDir = '.symphony',
    mode = 'dry-run',
    event,
    recordedAt
  } = options;

  if (mode !== 'dry-run' && mode !== 'confirm') {
    throw new GoalEventJournalError(
      'unsupported-journal-mode',
      'Goal event journal mode must be dry-run or confirm.',
      { mode: String(mode) }
    );
  }

  const normalizedInput = normalizeGoalEventInput({ event, recordedAt });
  const journalPath = getManagedGoalEventJournalPath({
    stateDir,
    goalId: normalizedInput.goalId
  });

  if (mode === 'confirm') {
    return enqueueManagedJournalWrite(
      journalPath,
      () => appendNormalizedGoalEvent({
        journalPath,
        mode,
        normalizedInput
      })
    );
  }

  return appendNormalizedGoalEvent({
    journalPath,
    mode,
    normalizedInput
  });
}

async function appendNormalizedGoalEvent({
  journalPath,
  mode,
  normalizedInput
}) {
  const events = await readManagedJournalEvents(journalPath);
  const chain = validateGoalEventChain(events);

  if (!chain.ok) {
    throw new GoalEventJournalError(
      'goal-event-chain-invalid',
      'Goal event journal hash chain is invalid; append refused.',
      { reason: chain.errors[0] ?? 'invalid-chain' }
    );
  }

  assertGoalEventLogContract(buildGoalEventLog({
    goalId: normalizedInput.goalId,
    events
  }));

  const existingEvent = events.find((candidate) => candidate.eventId === normalizedInput.eventId);

  if (existingEvent !== undefined) {
    if (goalEventIdempotencyFingerprint(existingEvent) !== goalEventIdempotencyFingerprint(normalizedInput)) {
      throw new GoalEventJournalError(
        'goal-event-id-conflict',
        'Goal event id already exists with different event content.',
        { eventId: normalizedInput.eventId }
      );
    }

    return {
      mode,
      status: 'already-appended',
      written: false,
      appendOnly: true,
      event: structuredClone(existingEvent),
      journal: buildGoalEventLog({
        goalId: normalizedInput.goalId,
        events
      })
    };
  }

  const eventToAppend = buildAppendEvent({
    event: normalizedInput,
    sequence: events.length + 1,
    previousEventHash: events.at(-1)?.eventHash ?? null
  });
  const journal = assertGoalEventLogContract(buildGoalEventLog({
    goalId: normalizedInput.goalId,
    events: [...events, eventToAppend]
  }));

  if (mode === 'dry-run') {
    return {
      mode,
      status: 'planned',
      written: false,
      appendOnly: true,
      event: structuredClone(eventToAppend),
      journal
    };
  }

  await mkdir(dirname(journalPath), { recursive: true });
  await appendFile(journalPath, `${JSON.stringify(eventToAppend)}\n`, 'utf8');

  return {
    mode,
    status: 'appended',
    written: true,
    appendOnly: true,
    event: structuredClone(eventToAppend),
    journal
  };
}

async function enqueueManagedJournalWrite(journalPath, operation) {
  const previous = journalWriteChains.get(journalPath) ?? Promise.resolve();
  const write = previous.then(operation, operation);
  const settled = write.catch(() => {});

  journalWriteChains.set(journalPath, settled);

  try {
    return await write;
  } finally {
    if (journalWriteChains.get(journalPath) === settled) {
      journalWriteChains.delete(journalPath);
    }
  }
}

export async function readGoalEventJournal(options = {}) {
  assertKnownOptions(options, READ_GOAL_EVENT_JOURNAL_OPTION_KEYS);

  const {
    stateDir = '.symphony',
    goalId,
    goalTitle,
    baseline
  } = options;

  assertSafeGoalId(goalId);

  const journalPath = getManagedGoalEventJournalPath({ stateDir, goalId });
  const events = await readManagedJournalEvents(journalPath);
  const chain = validateGoalEventChain(events);

  if (!chain.ok) {
    throw new GoalEventJournalError(
      'goal-event-chain-invalid',
      'Goal event journal hash chain is invalid; read refused.',
      { reason: chain.errors[0] ?? 'invalid-chain' }
    );
  }

  return assertGoalEventLogContract(buildGoalEventLog({
    goalId,
    goalTitle,
    baseline,
    events
  }));
}

export function getManagedGoalEventJournalPath({ stateDir = '.symphony', goalId } = {}) {
  if (typeof stateDir !== 'string' || stateDir.trim() === '') {
    throw new GoalEventJournalError(
      'invalid-state-dir',
      'Goal event journal state directory is invalid.'
    );
  }

  assertSafeGoalId(goalId);

  return join(stateDir, 'goals', 'events', `${goalId}.ndjson`);
}

function buildAppendEvent({ event, sequence, previousEventHash }) {
  const eventToHash = redactSecrets({
    ...event,
    sequence,
    previousEventHash
  });

  return {
    ...eventToHash,
    eventHash: computeGoalEventHash(eventToHash)
  };
}

function normalizeGoalEventInput({ event, recordedAt }) {
  const errors = [];

  if (!isPlainObject(event)) {
    throw new GoalEventJournalError(
      'invalid-goal-event',
      'Goal event is not valid for managed journal append.',
      { reason: 'event must be a plain object' }
    );
  }

  for (const field of ['sequence', 'previousEventHash', 'eventHash']) {
    if (Object.hasOwn(event, field)) {
      errors.push(`${field} is assigned by the journal writer`);
    }
  }

  requireSafeToken(errors, event.eventId, 'eventId');
  requireSafeToken(errors, event.goalId, 'goalId');
  requireEnum(errors, event.eventType, 'eventType', GOAL_EVENT_TYPES);
  requireEnum(errors, event.phase, 'phase', GOAL_EVENT_PHASES);
  validateActor(errors, event.actor);
  const resolvedRecordedAt = normalizeTimestamp(errors, event.recordedAt ?? recordedAt ?? new Date().toISOString(), 'recordedAt');
  const resolvedOccurredAt = normalizeTimestamp(errors, event.occurredAt ?? resolvedRecordedAt, 'occurredAt');
  const normalizedEvidenceRefs = normalizeEvidenceRefs(errors, event.evidenceRefs);
  const taskId = normalizeOptionalSafeToken(errors, event.taskId, 'taskId');
  const branch = normalizeNullableString(errors, event.branch ?? null, 'branch');
  const commit = normalizeNullableString(errors, event.commit ?? null, 'commit');
  const statement = normalizeNonEmptyString(errors, event.statement, 'statement');

  for (const [field, value] of [
    ['review', event.review],
    ['gate', event.gate],
    ['blocker', event.blocker],
    ['metadata', event.metadata]
  ]) {
    if (value !== undefined && !isPlainObject(value)) {
      errors.push(`${field} must be a plain object when present`);
    }
  }

  if (errors.length > 0) {
    throw new GoalEventJournalError(
      'invalid-goal-event',
      'Goal event is not valid for managed journal append.',
      { reason: errors[0] }
    );
  }

  return redactSecrets(stripUndefined({
    eventId: event.eventId,
    goalId: event.goalId,
    taskId,
    eventType: event.eventType,
    phase: event.phase,
    actor: {
      role: event.actor.role,
      id: event.actor.id
    },
    occurredAt: resolvedOccurredAt,
    recordedAt: resolvedRecordedAt,
    branch,
    commit,
    evidenceRefs: normalizedEvidenceRefs,
    statement,
    review: cloneOptionalObject(event.review),
    gate: cloneOptionalObject(event.gate),
    blocker: cloneOptionalObject(event.blocker),
    metadata: cloneOptionalObject(event.metadata)
  }));
}

function buildGoalEventLog({
  goalId,
  goalTitle = goalId,
  baseline = DEFAULT_BASELINE,
  events
}) {
  const firstEvent = events[0] ?? null;
  const lastEvent = events.at(-1) ?? null;

  return {
    contractName: GOAL_EVENT_LOG_CONTRACT_NAME,
    contractVersion: GOAL_EVENT_LOG_CONTRACT_VERSION,
    goalId,
    goalTitle,
    baseline: normalizeBaseline(baseline),
    log: {
      appendOnly: true,
      storage: GOAL_EVENT_JOURNAL_STORAGE,
      eventCount: events.length,
      firstSequence: firstEvent?.sequence ?? null,
      lastSequence: lastEvent?.sequence ?? null,
      lastEventId: lastEvent?.eventId ?? null,
      lastEventHash: lastEvent?.eventHash ?? null
    },
    events: structuredClone(events)
  };
}

async function readManagedJournalEvents(journalPath) {
  let content;

  try {
    content = await readFile(journalPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw new GoalEventJournalError(
      'goal-event-journal-read-failed',
      'Goal event journal could not be read safely.'
    );
  }

  const events = [];
  const lines = content.split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.trim() === '') {
      continue;
    }

    try {
      events.push(JSON.parse(line));
    } catch {
      throw new GoalEventJournalError(
        'goal-event-journal-invalid',
        'Goal event journal contains invalid event data.',
        { line: index + 1 }
      );
    }
  }

  return events;
}

function goalEventIdempotencyFingerprint(event) {
  const comparable = structuredClone(event);

  delete comparable.sequence;
  delete comparable.occurredAt;
  delete comparable.recordedAt;
  delete comparable.previousEventHash;
  delete comparable.eventHash;

  return canonicalJson(comparable);
}

function assertKnownOptions(options, allowedKeys) {
  if (!isPlainObject(options)) {
    throw new GoalEventJournalError(
      'unsupported-journal-option',
      MANAGED_PATH_OPTION_MESSAGE
    );
  }

  for (const key of Object.keys(options)) {
    if (!allowedKeys.has(key)) {
      throw new GoalEventJournalError(
        'unsupported-journal-option',
        MANAGED_PATH_OPTION_MESSAGE,
        { option: key }
      );
    }
  }
}

function assertSafeGoalId(goalId) {
  const errors = [];

  requireSafeToken(errors, goalId, 'goalId');

  if (errors.length > 0) {
    throw new GoalEventJournalError(
      'invalid-goal-event',
      'Goal event is not valid for managed journal append.',
      { reason: errors[0] }
    );
  }
}

function validateActor(errors, actor) {
  if (!isPlainObject(actor)) {
    errors.push('actor must be a plain object');
    return;
  }

  requireEnum(errors, actor.role, 'actor.role', GOAL_EVENT_ACTOR_ROLES);
  requireSafeToken(errors, actor.id, 'actor.id');
}

function normalizeEvidenceRefs(errors, evidenceRefs) {
  if (evidenceRefs === undefined) {
    return [];
  }

  if (!Array.isArray(evidenceRefs)) {
    errors.push('evidenceRefs must be an array');
    return [];
  }

  return evidenceRefs.map((ref, index) => normalizeEvidenceRef(errors, ref, `evidenceRefs[${index}]`));
}

function normalizeEvidenceRef(errors, evidenceRef, path) {
  if (!isPlainObject(evidenceRef)) {
    errors.push(`${path} must be a plain object`);
    return null;
  }

  requireEnum(errors, evidenceRef.kind, `${path}.kind`, EVIDENCE_REF_KINDS);
  const ref = normalizeNonEmptyString(errors, evidenceRef.ref, `${path}.ref`);
  const label = normalizeNonEmptyString(errors, evidenceRef.label, `${path}.label`);

  if (typeof ref === 'string' && isUnsafeEvidenceRef(ref)) {
    errors.push(`${path}.ref must be a controlled evidence reference`);
  }

  if (evidenceRef.kind === 'repo-doc' && typeof ref === 'string' && !ref.startsWith('docs/plans/')) {
    errors.push(`${path}.ref must be under docs/plans/ for repo-doc evidence`);
  }

  return {
    kind: evidenceRef.kind,
    ref,
    label
  };
}

function isUnsafeEvidenceRef(ref) {
  return ref.startsWith('/') ||
    ref.startsWith('file://') ||
    ref.startsWith('~/') ||
    ref.includes('../') ||
    ref.includes('..\\') ||
    ref.includes('\\') ||
    /^[A-Za-z]:\\/u.test(ref);
}

function normalizeTimestamp(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be an ISO timestamp string`);
    return null;
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    errors.push(`${path} must be an ISO timestamp string`);
    return null;
  }

  return value;
}

function normalizeOptionalSafeToken(errors, value, path) {
  if (value === undefined || value === null) {
    return null;
  }

  requireSafeToken(errors, value, path);

  return value;
}

function requireSafeToken(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value !== 'string') {
    return;
  }

  if (!/^[A-Za-z0-9._:-]+$/u.test(value) || value.includes('..') || value.includes('/') || value.includes('\\')) {
    errors.push(`${path} must be a safe path segment`);
  }
}

function normalizeNullableString(errors, value, path) {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    errors.push(`${path} must be a string or null`);
    return null;
  }

  return value;
}

function normalizeNonEmptyString(errors, value, path) {
  requireNonEmptyString(errors, value, path);
  return typeof value === 'string' ? value : null;
}

function normalizeBaseline(baseline) {
  if (!isPlainObject(baseline)) {
    return structuredClone(DEFAULT_BASELINE);
  }

  return {
    tag: isNonEmptyString(baseline.tag) ? baseline.tag : DEFAULT_BASELINE.tag,
    commit: typeof baseline.commit === 'string' && baseline.commit.trim() !== '' ? baseline.commit : null,
    evidenceRef: typeof baseline.evidenceRef === 'string' && baseline.evidenceRef.trim() !== '' ? baseline.evidenceRef : null
  };
}

function cloneOptionalObject(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function requireEnum(errors, value, path, values) {
  if (!values.includes(value)) {
    errors.push(`${path} must be one of ${values.join(', ')}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
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

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
