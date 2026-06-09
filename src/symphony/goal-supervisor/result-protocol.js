import { createHash } from 'node:crypto';

export const GOAL_SUPERVISOR_RESULT_PROTOCOL_CONTRACT_NAME = 'goal-supervisor-result-protocol.v1';
export const GOAL_SUPERVISOR_RESULT_PROTOCOL_CONTRACT_VERSION = 1;
export const GOAL_SUPERVISOR_RECORDED_RESULT_INTAKE_CONTRACT_NAME = 'goal-supervisor-recorded-result-intake.v1';
export const GOAL_SUPERVISOR_RECORDED_RESULT_INTAKE_CONTRACT_VERSION = 1;
export const RESULT_BLOCK_START = 'RESULT_BLOCK_START';
export const RESULT_BLOCK_END = 'RESULT_BLOCK_END';

export const RESULT_REQUIRED_FIELDS = Object.freeze([
  'goalId',
  'taskId',
  'role',
  'threadId',
  'branch',
  'worktree',
  'baseCommit',
  'headCommit',
  'status',
  'eventToRegister',
  'evidenceRef',
  'filesChanged',
  'commandsRun',
  'validation',
  'risks',
  'blockers',
  'nextSuggestedAction'
]);

export const RESULT_EVENTS_BY_ROLE = Object.freeze({
  worker: Object.freeze([
    'worker.evidence-recorded',
    'worker.self-check-passed',
    'worker.self-check-failed'
  ]),
  reviewer: Object.freeze([
    'reviewer.approved',
    'reviewer.needs-revision',
    'reviewer.blocked'
  ]),
  'main-verifier': Object.freeze([
    'main.verification-passed',
    'main.verification-failed'
  ]),
  'release-manager': Object.freeze([
    'release.gate-passed',
    'release.gate-failed',
    'release.evidence-recorded',
    'release.ready-declared'
  ])
});

export const RELEASE_MANAGER_EVENTS_BY_PHASE = Object.freeze({
  'release-gate': Object.freeze([
    'release.gate-passed',
    'release.gate-failed'
  ]),
  'release-prep': Object.freeze([
    'release.ready-declared'
  ])
});

const RESULT_ROLES = Object.freeze(Object.keys(RESULT_EVENTS_BY_ROLE));
const RESULT_STATUSES = Object.freeze([
  'completed',
  'needs-revision',
  'blocked'
]);
export const RECORDED_RESULT_INTAKE_STATUSES = Object.freeze([
  'pending',
  'missing',
  'invalid',
  'unavailable',
  'consumed'
]);
const PLACEHOLDER_PATTERN = /^(?:<.*>|pending|todo|tbd|unknown|null|undefined|n\/a)$/iu;
const COMMIT_PATTERN = /^[a-f0-9]{7,64}$/u;

export function acceptedResultEventsForContext({
  role,
  phase = null
}) {
  requireResultRole(role);

  if (role === 'release-manager' && isNonEmptyString(phase)) {
    return [...(RELEASE_MANAGER_EVENTS_BY_PHASE[phase] ?? [])];
  }

  return [...RESULT_EVENTS_BY_ROLE[role]];
}

export function parseGoalSupervisorResultBlock({
  text,
  expected,
  releaseGates = []
}) {
  const context = normalizeExpectedContext(expected);
  const blocks = extractBoundedResultBlocks(text);

  if (blocks.length === 0) {
    return invalidResult('missing-result-block', context, []);
  }

  if (blocks.length > 1) {
    return invalidResult('multiple-result-blocks', context, blocks, [
      'result output must contain exactly one RESULT_BLOCK_START...RESULT_BLOCK_END block'
    ]);
  }

  const parsed = parseResultBlockBody(blocks[0].body);

  if (parsed.ok !== true) {
    return invalidResult(parsed.reason, context, blocks, parsed.errors);
  }

  const errors = validateResultPayload({
    payload: parsed.payload,
    context,
    releaseGates
  });

  if (errors.length > 0) {
    return invalidResult(errors[0], context, blocks, errors);
  }

  const record = {
    contractName: GOAL_SUPERVISOR_RESULT_PROTOCOL_CONTRACT_NAME,
    contractVersion: GOAL_SUPERVISOR_RESULT_PROTOCOL_CONTRACT_VERSION,
    recordId: resultRecordId(parsed.payload),
    acceptedTerminalEvents: acceptedResultEventsForContext(context),
    appendOnly: true,
    consumed: false,
    ...parsed.payload
  };

  return {
    valid: true,
    reason: 'valid-result-block',
    errors: [],
    context,
    blocks,
    record
  };
}

export function inspectRecordedResultIntake({
  source,
  text = null,
  expected,
  releaseGates = [],
  path = null,
  threadId = null,
  available = true,
  unavailableReason = 'result-source-unavailable',
  missingReason = 'missing-result-block',
  consumedResultIds = [],
  registeredResultIds = [],
  acceptedRecords = []
}) {
  const normalizedSource = requiredString(source, 'source');

  if (available !== true) {
    return recordedResultIntake({
      source: normalizedSource,
      status: 'unavailable',
      reason: unavailableReason,
      path,
      threadId
    });
  }

  if (!isNonEmptyString(text)) {
    return recordedResultIntake({
      source: normalizedSource,
      status: 'missing',
      reason: missingReason,
      path,
      threadId
    });
  }

  const blocks = extractBoundedResultBlocks(text);
  if (blocks.length === 0) {
    return recordedResultIntake({
      source: normalizedSource,
      status: 'missing',
      reason: 'missing-result-block',
      path,
      threadId
    });
  }

  const parsed = parseGoalSupervisorResultBlock({
    text,
    expected,
    releaseGates
  });

  if (parsed.valid !== true) {
    return recordedResultIntake({
      source: normalizedSource,
      status: 'invalid',
      reason: parsed.reason,
      path,
      threadId,
      parsed
    });
  }

  const consumed = recordedResultConsumptionState({
    record: parsed.record,
    consumedResultIds,
    registeredResultIds,
    acceptedRecords
  });

  if (consumed.consumed === true) {
    return recordedResultIntake({
      source: normalizedSource,
      status: 'consumed',
      reason: consumed.reason,
      path,
      threadId,
      parsed,
      record: parsed.record
    });
  }

  return recordedResultIntake({
    source: normalizedSource,
    status: 'pending',
    reason: 'valid-result-awaits-registration',
    path,
    threadId,
    parsed,
    record: parsed.record
  });
}

export function selectRecordedResultIntake({
  escrowIntake,
  threadIntake
}) {
  if (isPendingRecordedResultIntake(escrowIntake) || escrowIntake?.status === 'consumed') {
    return escrowIntake;
  }

  if (isPendingRecordedResultIntake(threadIntake)) {
    return threadIntake;
  }

  if (escrowIntake?.status === 'invalid') {
    return escrowIntake;
  }

  return threadIntake?.status === 'unavailable'
    ? threadIntake
    : escrowIntake;
}

export function isPendingRecordedResultIntake(intake) {
  return intake?.contractName === GOAL_SUPERVISOR_RECORDED_RESULT_INTAKE_CONTRACT_NAME
    && intake.status === 'pending'
    && intake.record !== null;
}

export function pendingResultFromRecordedResultIntake(intake) {
  if (!isPendingRecordedResultIntake(intake)) {
    return null;
  }

  return {
    valid: true,
    source: intake.source,
    threadId: intake.threadId,
    result: intake.record
  };
}

export function projectRecordedResultEntryForCurrent({
  entry,
  current,
  resultIndex = null
}) {
  if (!isPlainObject(entry) || entry.valid !== true) {
    return recordedResultIntake({
      source: 'recorded-result-state',
      status: 'invalid',
      reason: 'invalid-recorded-result-entry'
    });
  }

  const normalizedCurrent = normalizeResultCurrent(current);
  const result = entry.result ?? entry.record ?? null;

  if (!isPlainObject(result)) {
    return recordedResultIntake({
      source: 'recorded-result-state',
      status: 'invalid',
      reason: 'missing-recorded-result-payload'
    });
  }

  if (result.taskId !== normalizedCurrent.taskId || result.role !== normalizedCurrent.role) {
    return recordedResultIntake({
      source: 'recorded-result-state',
      status: 'missing',
      reason: 'recorded-result-context-mismatch',
      record: result,
      resultIndex
    });
  }

  const consumed = recordedResultConsumptionState({
    record: result,
    entry
  });

  if (consumed.consumed === true) {
    return recordedResultIntake({
      source: 'recorded-result-state',
      status: 'consumed',
      reason: consumed.reason,
      record: result,
      resultIndex
    });
  }

  if (consumed.pending !== true) {
    return recordedResultIntake({
      source: 'recorded-result-state',
      status: 'missing',
      reason: 'recorded-result-not-pending-registration',
      record: result,
      resultIndex
    });
  }

  return recordedResultIntake({
    source: 'recorded-result-state',
    status: 'pending',
    reason: 'recorded-result-awaits-registration',
    record: result,
    resultIndex
  });
}

export function extractBoundedResultBlocks(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return [];
  }

  const blocks = [];
  const pattern = new RegExp(`${RESULT_BLOCK_START}\\s*([\\s\\S]*?)\\s*${RESULT_BLOCK_END}`, 'gu');
  let match;

  while ((match = pattern.exec(text)) !== null) {
    blocks.push({
      raw: match[0],
      body: match[1].trim()
    });
  }

  return blocks;
}

export function formatResultBlock(fields) {
  if (!isPlainObject(fields)) {
    throw new TypeError('fields must be a plain object');
  }

  return [
    RESULT_BLOCK_START,
    ...RESULT_REQUIRED_FIELDS.map((field) => `${field}: ${fields[field] ?? ''}`),
    RESULT_BLOCK_END
  ].join('\n');
}

function parseResultBlockBody(body) {
  if (body.startsWith('```') || body.endsWith('```')) {
    return {
      ok: false,
      reason: 'markdown-fenced-result-block',
      errors: ['result block body must not be wrapped in a markdown fence']
    };
  }

  if (body.trim().startsWith('{')) {
    return parseJsonPayload(body);
  }

  return parseKeyValuePayload(body);
}

function parseJsonPayload(body) {
  let parsed;

  try {
    parsed = JSON.parse(body);
  } catch {
    return {
      ok: false,
      reason: 'invalid-json-result-block',
      errors: ['result block JSON is not parseable']
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      ok: false,
      reason: 'result-json-must-be-object',
      errors: ['result block JSON must be an object']
    };
  }

  const exactErrors = exactFieldErrors(Object.keys(parsed));
  const typeErrors = RESULT_REQUIRED_FIELDS
    .filter((field) => Object.hasOwn(parsed, field) && typeof parsed[field] !== 'string')
    .map((field) => `non-string-field:${field}`);

  if (exactErrors.length > 0 || typeErrors.length > 0) {
    return {
      ok: false,
      reason: exactErrors[0] ?? typeErrors[0],
      errors: [...exactErrors, ...typeErrors]
    };
  }

  return {
    ok: true,
    payload: parsed
  };
}

function parseKeyValuePayload(body) {
  const payload = {};
  const seen = new Set();
  const errors = [];
  const lines = body.split(/\r?\n/u);

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      continue;
    }

    const separator = trimmed.indexOf(':');

    if (separator <= 0) {
      return {
        ok: false,
        reason: 'malformed-result-line',
        errors: [`result line is not key: value syntax: ${trimmed}`]
      };
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (seen.has(key)) {
      errors.push(`duplicate-field:${key}`);
    }

    seen.add(key);
    payload[key] = value;
  }

  const exactErrors = exactFieldErrors([...seen]);

  if (errors.length > 0 || exactErrors.length > 0) {
    return {
      ok: false,
      reason: errors[0] ?? exactErrors[0],
      errors: [...errors, ...exactErrors]
    };
  }

  return {
    ok: true,
    payload
  };
}

function validateResultPayload({
  payload,
  context,
  releaseGates
}) {
  const errors = [];

  for (const field of RESULT_REQUIRED_FIELDS) {
    if (!isNonEmptyString(payload[field])) {
      errors.push(`empty-field:${field}`);
    }
  }

  if (!RESULT_ROLES.includes(payload.role)) {
    errors.push('invalid-role');
  }

  if (!RESULT_STATUSES.includes(payload.status)) {
    errors.push('invalid-status');
  }

  if (payload.goalId !== context.goalId) {
    errors.push('context-mismatch:goalId');
  }

  if (payload.taskId !== context.taskId) {
    errors.push('context-mismatch:taskId');
  }

  if (payload.role !== context.role) {
    errors.push('context-mismatch:role');
  }

  if (payload.threadId !== context.threadId) {
    errors.push('context-mismatch:threadId');
  }

  if (context.branch !== null && payload.branch !== context.branch) {
    errors.push('context-mismatch:branch');
  }

  if (context.worktree !== null && payload.worktree !== context.worktree) {
    errors.push('context-mismatch:worktree');
  }

  if (context.baseCommit !== null && payload.baseCommit !== context.baseCommit) {
    errors.push('context-mismatch:baseCommit');
  }

  const acceptedEvents = payload.role === context.role
    ? acceptedResultEventsForContext(context)
    : [];

  if (!acceptedEvents.includes(payload.eventToRegister)) {
    errors.push(`invalid-event-for-context:${payload.eventToRegister}`);
  }

  errors.push(...validateExplicitResultFields(payload));
  errors.push(...validateEvidenceRef(payload, context));
  errors.push(...validateReleaseManagerBasis({
    payload,
    context,
    releaseGates
  }));

  return errors;
}

function validateExplicitResultFields(payload) {
  const errors = [];

  for (const field of ['branch', 'worktree', 'baseCommit', 'headCommit', 'evidenceRef']) {
    if (isPlaceholder(payload[field])) {
      errors.push(`placeholder-field:${field}`);
    }
  }

  if (!COMMIT_PATTERN.test(payload.baseCommit)) {
    errors.push('invalid-commit:baseCommit');
  }

  if (!COMMIT_PATTERN.test(payload.headCommit)) {
    errors.push('invalid-commit:headCommit');
  }

  if (!payload.worktree.startsWith('/')) {
    errors.push('worktree-must-be-absolute');
  }

  for (const field of ['filesChanged']) {
    for (const path of splitSemicolonList(payload[field])) {
      if (path !== 'none' && !isSafeRepoRelativePath(path)) {
        errors.push(`unsafe-repo-path:${field}:${path}`);
      }
    }
  }

  return errors;
}

function validateEvidenceRef(payload, context) {
  const errors = [];

  if (!isSafeRepoRelativePath(payload.evidenceRef)) {
    errors.push('unsafe-evidence-ref');
  }

  if (context.evidenceRef !== null && payload.evidenceRef !== context.evidenceRef) {
    errors.push('context-mismatch:evidenceRef');
  }

  if (Array.isArray(context.evidenceRefs) && context.evidenceRefs.length > 0 && !context.evidenceRefs.includes(payload.evidenceRef)) {
    errors.push('context-mismatch:evidenceRef');
  }

  return errors;
}

function validateReleaseManagerBasis({
  payload,
  context,
  releaseGates
}) {
  if (payload.role !== 'release-manager') {
    return [];
  }

  const errors = [];
  const basis = resultEvidenceBasis(payload);
  const gateMentions = findReleaseGateMentions({
    text: basis,
    releaseGates
  });

  if (context.phase === 'release-gate' && ['release.gate-passed', 'release.gate-failed'].includes(payload.eventToRegister)) {
    if (releaseGates.length > 0 && gateMentions.length !== 1) {
      errors.push(`release-gate-result-must-cite-one-gate:${gateMentions.length}`);
    }
  }

  if (payload.eventToRegister === 'release.ready-declared' && gateMentions.length > 0) {
    errors.push(`release-prep-result-must-not-cite-gates:${gateMentions.join(',')}`);
  }

  return errors;
}

function normalizeExpectedContext(expected) {
  if (!isPlainObject(expected)) {
    throw new TypeError('expected must be a plain object');
  }

  const role = requireResultRole(requiredStringField(expected, 'role'));
  const evidenceRefs = Array.isArray(expected.evidenceRefs)
    ? expected.evidenceRefs.filter(isNonEmptyString)
    : null;

  return {
    goalId: requiredStringField(expected, 'goalId'),
    taskId: requiredStringField(expected, 'taskId'),
    role,
    threadId: requiredStringField(expected, 'threadId'),
    phase: optionalStringField(expected, 'phase'),
    branch: optionalStringField(expected, 'branch'),
    worktree: optionalStringField(expected, 'worktree'),
    baseCommit: optionalStringField(expected, 'baseCommit'),
    evidenceRef: optionalStringField(expected, 'evidenceRef'),
    evidenceRefs
  };
}

function exactFieldErrors(keys) {
  const keySet = new Set(keys);
  const errors = [];

  for (const field of RESULT_REQUIRED_FIELDS) {
    if (!keySet.has(field)) {
      errors.push(`missing-field:${field}`);
    }
  }

  for (const key of keys) {
    if (!RESULT_REQUIRED_FIELDS.includes(key)) {
      errors.push(`unexpected-field:${key}`);
    }
  }

  return errors;
}

function invalidResult(reason, context, blocks, errors = [reason]) {
  return {
    valid: false,
    reason,
    errors,
    context,
    blocks,
    record: null
  };
}

function recordedResultIntake({
  source,
  status,
  reason,
  path = null,
  threadId = null,
  parsed = null,
  record = null,
  resultIndex = null
}) {
  if (!RECORDED_RESULT_INTAKE_STATUSES.includes(status)) {
    throw new TypeError(`unsupported recorded result intake status: ${status}`);
  }

  return {
    contractName: GOAL_SUPERVISOR_RECORDED_RESULT_INTAKE_CONTRACT_NAME,
    contractVersion: GOAL_SUPERVISOR_RECORDED_RESULT_INTAKE_CONTRACT_VERSION,
    readOnly: true,
    willMutate: false,
    source,
    status,
    valid: status === 'pending',
    pending: status === 'pending',
    registerable: status === 'pending',
    reason,
    path,
    threadId,
    parsed,
    record,
    resultIndex
  };
}

function recordedResultConsumptionState({
  record,
  entry = null,
  consumedResultIds = [],
  registeredResultIds = [],
  acceptedRecords = []
}) {
  const recordId = record?.recordId ?? null;

  if (
    entry?.registered === true ||
    entry?.consumed === true ||
    record?.registered === true ||
    record?.consumed === true
  ) {
    return {
      consumed: true,
      pending: false,
      reason: 'recorded-result-already-consumed'
    };
  }

  if (
    isNonEmptyString(recordId) &&
    (
      consumedResultIds.includes(recordId) ||
      registeredResultIds.includes(recordId) ||
      acceptedRecords.some((accepted) => accepted?.recordId === recordId)
    )
  ) {
    return {
      consumed: true,
      pending: false,
      reason: 'recorded-result-already-registered'
    };
  }

  return {
    consumed: false,
    pending: entry?.registered === false ||
      entry?.consumed === false ||
      record?.registered === false ||
      record?.consumed === false ||
      entry === null,
    reason: 'recorded-result-pending-registration'
  };
}

function normalizeResultCurrent(current) {
  return {
    taskId: isNonEmptyString(current?.taskId) ? current.taskId : null,
    role: isNonEmptyString(current?.role) ? current.role : null
  };
}

function resultRecordId(payload) {
  const canonical = JSON.stringify(
    Object.fromEntries(RESULT_REQUIRED_FIELDS.map((field) => [field, payload[field]]))
  );

  return `sha256:${createHash('sha256').update(canonical).digest('hex')}`;
}

function findReleaseGateMentions({
  text,
  releaseGates
}) {
  if (!Array.isArray(releaseGates) || releaseGates.length === 0) {
    return [];
  }

  return releaseGates.filter((gate) => isNonEmptyString(gate) && text.includes(gate));
}

function resultEvidenceBasis(payload) {
  return [
    payload.filesChanged,
    payload.commandsRun,
    payload.validation,
    payload.risks,
    payload.blockers,
    payload.nextSuggestedAction
  ].join('\n');
}

function splitSemicolonList(value) {
  return String(value)
    .split(';')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
}

function isSafeRepoRelativePath(value) {
  if (!isNonEmptyString(value) || isPlaceholder(value)) {
    return false;
  }

  if (value.startsWith('/') || value.includes('\\')) {
    return false;
  }

  return !value.split('/').some((segment) => segment === '' || segment === '.' || segment === '..');
}

function isPlaceholder(value) {
  return !isNonEmptyString(value) || PLACEHOLDER_PATTERN.test(value.trim());
}

function requireResultRole(role) {
  if (!RESULT_ROLES.includes(role)) {
    throw new TypeError(`unsupported result role: ${role}`);
  }

  return role;
}

function requiredStringField(object, field) {
  if (!isPlainObject(object) || !isNonEmptyString(object[field])) {
    throw new TypeError(`${field} is required`);
  }

  return object[field];
}

function requiredString(value, field) {
  if (!isNonEmptyString(value)) {
    throw new TypeError(`${field} is required`);
  }

  return value;
}

function optionalStringField(object, field) {
  if (!isPlainObject(object) || object[field] === undefined || object[field] === null) {
    return null;
  }

  if (!isNonEmptyString(object[field])) {
    throw new TypeError(`${field} must be a non-empty string when provided`);
  }

  return object[field];
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value);
}
