import { createHash } from 'node:crypto';

export const APP_THREAD_RESULT_PROTOCOL_CONTRACT_NAME = 'app-thread-result-protocol.v1';
export const APP_THREAD_RESULT_PROTOCOL_CONTRACT_VERSION = 1;
export const RESULT_BLOCK_START = 'RESULT_BLOCK_START';
export const RESULT_BLOCK_END = 'RESULT_BLOCK_END';

export const ACCEPTED_TERMINAL_EVENTS_BY_ROLE = Object.freeze({
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

const CHILD_RESULT_ROLES = Object.freeze(Object.keys(ACCEPTED_TERMINAL_EVENTS_BY_ROLE));
const REQUIRED_RESULT_FIELDS = Object.freeze([
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
const RESULT_STATUSES = Object.freeze([
  'completed',
  'needs-revision',
  'blocked',
  'dispatched',
  'not-started'
]);

export function buildAppThreadReadCapabilityRecord({
  threadId,
  adapter = 'codex-app',
  requestedAt = null
}) {
  requireNonEmptyString(threadId, 'threadId');

  return {
    contractName: 'app-thread-read-capability.v1',
    contractVersion: 1,
    adapter,
    method: 'readThread',
    callShape: {
      threadId
    },
    optionalParameters: [],
    requestedAt,
    replayable: true
  };
}

export async function readThreadThroughStableAdapter({
  threadId,
  readThread,
  requestedAt = null
}) {
  requireNonEmptyString(threadId, 'threadId');

  if (typeof readThread !== 'function') {
    throw new TypeError('readThread must be a function');
  }

  const capability = buildAppThreadReadCapabilityRecord({
    threadId,
    requestedAt
  });

  try {
    const response = await readThread(threadId);
    const status = normalizeReaderStatus(response);

    if (status === 'notLoaded') {
      return {
        status: 'notLoaded',
        readable: false,
        waitState: true,
        mutatesState: false,
        reason: 'app-thread-not-loaded',
        capability,
        response
      };
    }

    if (status !== 'readable') {
      return {
        status: 'unreadable',
        readable: false,
        waitState: false,
        mutatesState: false,
        reason: status,
        capability,
        response
      };
    }

    return {
      status: 'readable',
      readable: true,
      waitState: false,
      mutatesState: false,
      reason: 'readback-ok',
      capability,
      response
    };
  } catch (error) {
    return {
      status: 'adapter-error',
      readable: false,
      waitState: false,
      mutatesState: false,
      reason: 'read-thread-adapter-error',
      capability,
      error: safeError(error)
    };
  }
}

export function recordThreadBinding({
  bindings = [],
  binding,
  readback
}) {
  if (!isPlainObject(binding)) {
    throw new TypeError('binding must be a plain object');
  }

  const normalized = {
    goalId: requiredStringField(binding, 'goalId'),
    taskId: requiredStringField(binding, 'taskId'),
    role: requiredRole(binding.role),
    requestId: requiredStringField(binding, 'requestId'),
    threadId: requiredStringField(binding, 'threadId'),
    worktree: requiredStringField(binding, 'worktree'),
    baseCommit: requiredStringField(binding, 'baseCommit')
  };

  const duplicate = bindings.find((existing) => (
    existing.threadId === normalized.threadId
      || existing.requestId === normalized.requestId
      || (
        existing.goalId === normalized.goalId
        && existing.taskId === normalized.taskId
        && existing.role === normalized.role
        && existing.active === true
      )
  ));

  if (duplicate !== undefined) {
    return {
      accepted: false,
      active: false,
      reason: 'duplicate-thread-binding',
      duplicate: {
        requestId: duplicate.requestId ?? null,
        threadId: duplicate.threadId ?? null,
        taskId: duplicate.taskId ?? null,
        role: duplicate.role ?? null
      },
      audit: buildAuditRecord('record-thread', 'rejected', normalized, 'duplicate-thread-binding')
    };
  }

  if (!isPlainObject(readback) || readback.readable !== true) {
    const reason = readback?.status === 'notLoaded'
      ? 'thread-readback-not-loaded'
      : 'thread-readback-unreadable';

    return {
      accepted: false,
      active: false,
      reason,
      readback: summarizeReadback(readback),
      audit: buildAuditRecord('record-thread', 'rejected', normalized, reason)
    };
  }

  const identityCheck = validateReadableThreadReadback(readback, normalized.threadId);

  if (identityCheck.valid !== true) {
    return {
      accepted: false,
      active: false,
      reason: identityCheck.reason,
      readback: summarizeReadback(readback),
      audit: buildAuditRecord('record-thread', 'rejected', normalized, identityCheck.reason)
    };
  }

  const record = {
    ...normalized,
    active: true,
    acceptedTerminalEvents: acceptedTerminalEventsForRole(normalized.role),
    readCapability: readback.capability
  };

  return {
    accepted: true,
    active: true,
    record,
    audit: buildAuditRecord('record-thread', 'accepted', normalized, 'readback-ok')
  };
}

export function extractResultBlocks(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return [];
  }

  const blocks = [];
  const blockPattern = new RegExp(`${RESULT_BLOCK_START}\\s*([\\s\\S]*?)\\s*${RESULT_BLOCK_END}`, 'gu');
  let match;

  while ((match = blockPattern.exec(text)) !== null) {
    blocks.push({
      format: 'result-block',
      raw: match[0],
      body: stripMarkdownFence(match[1]).trim(),
      fenced: isMarkdownFenced(match[1])
    });
  }

  if (blocks.length > 0) {
    return blocks;
  }

  const fencePattern = /```(?:json|text)?\s*([\s\S]*?)\s*```/giu;

  while ((match = fencePattern.exec(text)) !== null) {
    const body = match[1].trim();

    if (looksLikeResultPayload(body)) {
      blocks.push({
        format: 'markdown-fence',
        raw: match[0],
        body,
        fenced: true
      });
    }
  }

  return blocks;
}

export function parseChildResultBlock({
  text,
  expected
}) {
  const context = normalizeExpectedContext(expected);
  const blocks = extractResultBlocks(text);

  if (blocks.length === 0) {
    return invalidParsedResult({
      reason: 'missing-result-block',
      context,
      correction: buildCorrectionAction(context, 'missing-result-block')
    });
  }

  const parsed = blocks.map((block, index) => parseBlockBody({
    block,
    blockIndex: index,
    context
  }));
  const valid = parsed.find((record) => record.valid === true);

  if (valid !== undefined) {
    return {
      valid: true,
      record: valid.record,
      records: parsed,
      correction: null
    };
  }

  return invalidParsedResult({
    reason: parsed[0]?.reason ?? 'malformed-result-block',
    context,
    records: parsed,
    correction: buildCorrectionAction(context, parsed[0]?.reason ?? 'malformed-result-block')
  });
}

export function decideResultProtocolAction({
  parseResult,
  correctionAttempts = 0,
  correctionReachable = true,
  childActive = false
}) {
  if (!isPlainObject(parseResult)) {
    throw new TypeError('parseResult must be a plain object');
  }

  if (parseResult.valid === true) {
    return {
      kind: 'record-result',
      reason: 'valid-result-block',
      resultRecordId: parseResult.record.recordId,
      mutatesState: true
    };
  }

  if (correctionAttempts < 1 && correctionReachable === true && childActive !== true) {
    return {
      kind: 'send-correction',
      reason: parseResult.reason,
      prompt: parseResult.correction.prompt,
      mutatesState: true,
      audit: parseResult.correction.audit,
      boundedRetry: {
        maxAttempts: 1,
        nextAttempt: correctionAttempts + 1
      }
    };
  }

  return {
    kind: 'manual-recovery',
    reason: correctionReachable === false
      ? 'correction-unreachable'
      : childActive === true
        ? 'result-only-prompt-queued-behind-active-child'
        : 'repeated-invalid-result-output',
    mutatesState: false,
    action: {
      type: 'manual-result-recovery',
      requiredReview: true,
      acceptedTerminalEvents: parseResult.context === undefined
        ? null
        : acceptedTerminalEventsForRole(parseResult.context.role)
    },
    audit: buildAuditRecord(
      'manual-recovery',
      'required',
      parseResult.context ?? {},
      correctionReachable === false
        ? 'correction-unreachable'
        : childActive === true
          ? 'result-only-prompt-queued-behind-active-child'
          : 'repeated-invalid-result-output'
    )
  };
}

export function consumeParsedResult({
  result,
  consumedResultIds = [],
  acceptedRecords = []
}) {
  if (!isPlainObject(result) || result.valid !== true) {
    return {
      consumed: false,
      reason: 'invalid-result-not-consumable',
      event: null
    };
  }

  const record = result.record;
  const duplicate = consumedResultIds.includes(record.recordId)
    || acceptedRecords.some((accepted) => accepted.recordId === record.recordId);

  if (duplicate) {
    return {
      consumed: false,
      idempotent: true,
      reason: 'result-already-consumed',
      event: null,
      recordId: record.recordId
    };
  }

  return {
    consumed: true,
    idempotent: false,
    reason: 'accepted-terminal-event',
    recordId: record.recordId,
    event: {
      eventToRegister: record.eventToRegister,
      goalId: record.goalId,
      taskId: record.taskId,
      role: record.role,
      evidenceRef: record.evidenceRef,
      threadId: record.threadId
    },
    audit: buildAuditRecord('record-result', 'accepted', record, 'accepted-terminal-event')
  };
}

export function resolveActiveThreadResultTick({
  pendingResults = [],
  activeThreadReadback = null
}) {
  const pendingValidResult = pendingResults.find((result) => isPlainObject(result) && result.valid === true);

  if (pendingValidResult !== undefined) {
    return {
      state: 'pending-result-ready',
      consultActiveThread: false,
      mutatesState: true,
      action: {
        kind: 'record-result',
        resultRecordId: pendingValidResult.record.recordId
      }
    };
  }

  if (isPlainObject(activeThreadReadback) && activeThreadReadback.status === 'notLoaded') {
    return {
      state: 'waiting-active-child-not-loaded',
      consultActiveThread: true,
      mutatesState: false,
      action: {
        kind: 'wait',
        reason: 'app-thread-not-loaded'
      }
    };
  }

  return {
    state: 'read-active-thread',
    consultActiveThread: true,
    mutatesState: false,
    action: {
      kind: 'read-thread'
    }
  };
}

export function acceptedTerminalEventsForRole(role) {
  requiredRole(role);
  return [...ACCEPTED_TERMINAL_EVENTS_BY_ROLE[role]];
}

function parseBlockBody({
  block,
  blockIndex,
  context
}) {
  const payloadResult = parsePayload(block.body);

  if (payloadResult.ok !== true) {
    return {
      valid: false,
      blockIndex,
      reason: payloadResult.reason,
      fenced: block.fenced
    };
  }

  const payload = payloadResult.payload;
  const errors = validateResultPayload(payload, context);

  if (errors.length > 0) {
    return {
      valid: false,
      blockIndex,
      reason: errors[0],
      errors,
      fenced: block.fenced
    };
  }

  const record = {
    contractName: APP_THREAD_RESULT_PROTOCOL_CONTRACT_NAME,
    contractVersion: APP_THREAD_RESULT_PROTOCOL_CONTRACT_VERSION,
    recordId: resultRecordId(payload),
    blockIndex,
    appendOnly: true,
    consumed: false,
    acceptedTerminalEvents: acceptedTerminalEventsForRole(payload.role),
    ...payload
  };

  return {
    valid: true,
    blockIndex,
    record,
    fenced: block.fenced
  };
}

function parsePayload(body) {
  try {
    const parsed = JSON.parse(body);

    if (!isPlainObject(parsed)) {
      return {
        ok: false,
        reason: 'result-json-must-be-object'
      };
    }

    return {
      ok: true,
      payload: parsed
    };
  } catch {
    const fields = parseKeyValuePayload(body);

    if (fields === null) {
      return {
        ok: false,
        reason: 'invalid-json-result-block'
      };
    }

    return {
      ok: true,
      payload: fields
    };
  }
}

function parseKeyValuePayload(body) {
  if (body.trim().startsWith('{')) {
    return null;
  }

  const payload = {};
  const lines = body.split(/\r?\n/u);

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      continue;
    }

    const separator = trimmed.indexOf(':');

    if (separator <= 0) {
      return null;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (key === '') {
      return null;
    }

    payload[key] = value;
  }

  return Object.keys(payload).length === 0 ? null : payload;
}

function validateResultPayload(payload, context) {
  const errors = [];

  for (const field of REQUIRED_RESULT_FIELDS) {
    if (!Object.hasOwn(payload, field)) {
      errors.push(`missing-field:${field}`);
    }
  }

  if (errors.length > 0) {
    return errors;
  }

  for (const field of REQUIRED_RESULT_FIELDS) {
    if (field === 'filesChanged' || field === 'commandsRun' || field === 'validation' || field === 'risks' || field === 'blockers') {
      continue;
    }

    if (!isNonEmptyString(payload[field])) {
      errors.push(`empty-field:${field}`);
    }
  }

  if (!CHILD_RESULT_ROLES.includes(payload.role)) {
    errors.push('invalid-role');
  } else if (!ACCEPTED_TERMINAL_EVENTS_BY_ROLE[payload.role].includes(payload.eventToRegister)) {
    errors.push(`invalid-event-for-role:${payload.eventToRegister}`);
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

  return errors;
}

function invalidParsedResult({
  reason,
  context,
  records = [],
  correction
}) {
  return {
    valid: false,
    reason,
    context,
    records,
    correction
  };
}

function buildCorrectionAction(context, reason) {
  return {
    type: 'result-only-correction',
    maxAttempts: 1,
    reason,
    prompt: [
      'Return only the missing corrected child result block.',
      `Use ${RESULT_BLOCK_START} and ${RESULT_BLOCK_END}.`,
      `goalId: ${context.goalId}`,
      `taskId: ${context.taskId}`,
      `role: ${context.role}`,
      `threadId: ${context.threadId}`,
      `eventToRegister must be one of: ${acceptedTerminalEventsForRole(context.role).join(', ')}.`,
      'Do not run commands, edit files, or add chat prose around the block.'
    ].join('\n'),
    audit: buildAuditRecord('correction-prompt', 'planned', context, reason)
  };
}

function normalizeExpectedContext(expected) {
  if (!isPlainObject(expected)) {
    throw new TypeError('expected must be a plain object');
  }

  return {
    goalId: requiredStringField(expected, 'goalId'),
    taskId: requiredStringField(expected, 'taskId'),
    role: requiredRole(expected.role),
    threadId: requiredStringField(expected, 'threadId'),
    branch: optionalStringField(expected, 'branch'),
    worktree: optionalStringField(expected, 'worktree')
  };
}

function normalizeReaderStatus(response) {
  if (response === null || response === undefined) {
    return 'empty-response';
  }

  if (typeof response === 'string') {
    const normalized = response.trim();
    return normalized === '' ? 'empty-response' : normalized;
  }

  if (!isPlainObject(response)) {
    return 'invalid-response';
  }

  if (response.status === 'notLoaded' || response.notLoaded === true) {
    return 'notLoaded';
  }

  if (response.status === 'readable' || response.thread !== undefined || response.messages !== undefined || response.id !== undefined) {
    return 'readable';
  }

  if (isNonEmptyString(response.status)) {
    return response.status;
  }

  return 'invalid-response';
}

function validateReadableThreadReadback(readback, threadId) {
  const capability = readback.capability;

  if (!isPlainObject(capability)
    || capability.method !== 'readThread'
    || !isPlainObject(capability.callShape)
    || capability.callShape.threadId !== threadId
    || !Array.isArray(capability.optionalParameters)
    || capability.optionalParameters.length !== 0) {
    return {
      valid: false,
      reason: 'thread-readback-capability-mismatch'
    };
  }

  const responseThreadId = threadIdFromReadbackResponse(readback.response);

  if (responseThreadId !== null && responseThreadId !== threadId) {
    return {
      valid: false,
      reason: 'thread-readback-response-mismatch'
    };
  }

  return {
    valid: true,
    reason: 'thread-readback-identity-ok'
  };
}

function threadIdFromReadbackResponse(response) {
  if (!isPlainObject(response)) {
    return null;
  }

  if (isNonEmptyString(response.id)) {
    return response.id;
  }

  if (isNonEmptyString(response.threadId)) {
    return response.threadId;
  }

  if (isPlainObject(response.thread)) {
    if (isNonEmptyString(response.thread.id)) {
      return response.thread.id;
    }

    if (isNonEmptyString(response.thread.threadId)) {
      return response.thread.threadId;
    }
  }

  return null;
}

function summarizeReadback(readback) {
  if (!isPlainObject(readback)) {
    return {
      status: 'missing',
      readable: false
    };
  }

  return {
    status: readback.status ?? null,
    readable: readback.readable === true,
    waitState: readback.waitState === true,
    reason: readback.reason ?? null,
    capability: readback.capability ?? null
  };
}

function buildAuditRecord(action, status, payload, reason) {
  return {
    action,
    status,
    reason,
    appendOnly: true,
    auditId: `audit_${createHash('sha256')
      .update(JSON.stringify({
        action,
        status,
        reason,
        payload
      }))
      .digest('hex')
      .slice(0, 16)}`
  };
}

function resultRecordId(payload) {
  return `result_${createHash('sha256')
    .update(JSON.stringify({
      goalId: payload.goalId,
      taskId: payload.taskId,
      role: payload.role,
      threadId: payload.threadId,
      eventToRegister: payload.eventToRegister,
      evidenceRef: payload.evidenceRef,
      headCommit: payload.headCommit
    }))
    .digest('hex')
    .slice(0, 16)}`;
}

function stripMarkdownFence(value) {
  const trimmed = value.trim();
  const match = trimmed.match(/^```(?:json|text)?\s*([\s\S]*?)\s*```$/iu);
  return match === null ? value : match[1];
}

function isMarkdownFenced(value) {
  return /^```/u.test(value.trim());
}

function looksLikeResultPayload(body) {
  const trimmed = body.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return true;
  }

  return REQUIRED_RESULT_FIELDS.some((field) => trimmed.includes(`${field}:`));
}

function requiredStringField(object, field) {
  const value = object[field];
  requireNonEmptyString(value, field);
  return value;
}

function optionalStringField(object, field) {
  const value = object[field];

  if (value === undefined || value === null) {
    return null;
  }

  requireNonEmptyString(value, field);
  return value;
}

function requiredRole(role) {
  requireNonEmptyString(role, 'role');

  if (!CHILD_RESULT_ROLES.includes(role)) {
    throw new TypeError(`role must be one of ${CHILD_RESULT_ROLES.join(', ')}`);
  }

  return role;
}

function requireNonEmptyString(value, field) {
  if (!isNonEmptyString(value)) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function safeError(error) {
  return {
    name: error?.name ?? 'Error',
    message: error?.message ?? String(error)
  };
}
