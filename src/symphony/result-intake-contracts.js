import { createHash } from 'node:crypto';

import {
  GOAL_EVENT_TYPES,
  isSafeGoalEventToken
} from './goal-event-contracts.js';

export const RESULT_INTAKE_REQUEST_CONTRACT_NAME = 'resultIntakeRequest.v1';
export const RESULT_INTAKE_PREVIEW_CONTRACT_NAME = 'resultIntakePreview.v1';
export const RESULT_EVIDENCE_ESCROW_CONTRACT_NAME = 'resultEvidenceEscrow.v1';
export const PENDING_RESULT_CONTRACT_NAME = 'pendingResult.v1';

export const RESULT_INTAKE_CONTRACT_VERSION = 1;

export const RESULT_INTAKE_SOURCES = Object.freeze([
  'manual-paste',
  'external-worker',
  'codex',
  'claude',
  'kiro'
]);

export const RESULT_INTAKE_WORKER_ROLES = Object.freeze([
  'worker',
  'reviewer',
  'main-verifier',
  'release-manager'
]);

export const PENDING_RESULT_STATES = Object.freeze([
  'available',
  'blocked',
  'consumed',
  'superseded'
]);

const EVIDENCE_REF_KINDS = Object.freeze([
  'repo-doc',
  'artifact-ref',
  'commit',
  'command-evidence',
  'external-note'
]);

const SUPPORTED_RESULT_EVENTS = Object.freeze([
  'worker.evidence-recorded',
  'worker.self-check-passed',
  'worker.self-check-failed',
  'blocker.opened',
  'blocker.resolved'
]);

const EVENTS_REQUIRING_EVIDENCE = new Set([
  'worker.evidence-recorded',
  'worker.self-check-passed',
  'worker.self-check-failed'
]);

const REVIEW_EVENTS = new Set([
  'reviewer.approved',
  'reviewer.needs-revision',
  'reviewer.blocked'
]);

const GATE_EVENTS = new Set([
  'main.verification-passed',
  'main.verification-failed',
  'release.gate-passed',
  'release.gate-failed',
  'release.evidence-recorded',
  'release.ready-declared'
]);

const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const COMMIT_PATTERN = /^[a-f0-9]{7,64}$/u;
const PREVIEW_TTL_MS = 15 * 60 * 1000;
const RAW_FIELD_NAME_PATTERN = /^(?:rawTranscript|transcript|rawModelOutput|rawOutput|providerOutput|sessionLog|messages|conversation)$/iu;
const RAW_TEXT_PATTERN = /\b(?:raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log|session[\s_-]*file|model[\s_-]*output|\.jsonl|\.codex\/sessions|\.claude\/)/iu;
const LOCAL_HIDDEN_PATH_SEGMENTS = new Set([
  '.codex',
  '.claude',
  '.git',
  '.symphony'
]);

const REQUEST_BOUNDARY_FLAGS = Object.freeze({
  providerExecutionAvailable: false,
  childDispatchAvailable: false,
  directGoalEventAppendAvailable: false,
  untrustedTranscriptProjectionAvailable: false,
  frontendLocalFileReadAvailable: false,
  reviewerMutationAvailable: false,
  mainVerificationMutationAvailable: false,
  releaseGateMutationAvailable: false,
  gitMutationAvailable: false,
  githubReleaseAutomationAvailable: false
});

export class ResultIntakeContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ResultIntakeContractError';
    this.code = code;
    this.details = details;
  }
}

export function validateResultIntakeRequestContract(request) {
  const errors = [];

  if (!isPlainObject(request)) {
    return invalidResult('request must be a plain object');
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'goalId',
    'taskId',
    'workerRole',
    'source',
    'submittedAt',
    'resultBlock',
    'evidenceRefs',
    'requestedEvent',
    'boundaries'
  ]) {
    if (!Object.hasOwn(request, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExact(errors, request.contractName, 'contractName', RESULT_INTAKE_REQUEST_CONTRACT_NAME);
  requireExact(errors, request.contractVersion, 'contractVersion', RESULT_INTAKE_CONTRACT_VERSION);
  requireSafeToken(errors, request.goalId, 'goalId');
  requireSafeToken(errors, request.taskId, 'taskId');
  requireEnum(errors, request.workerRole, 'workerRole', RESULT_INTAKE_WORKER_ROLES);
  requireEnum(errors, request.source, 'source', RESULT_INTAKE_SOURCES);
  requireIsoTimestamp(errors, request.submittedAt, 'submittedAt');

  if (!isPlainObject(request.resultBlock)) {
    errors.push('resultBlock must be a plain object');
  } else {
    for (const field of findUnsafeRawFields(request.resultBlock, 'resultBlock')) {
      errors.push(`${field} is not allowed`);
    }
  }

  validateEvidenceRefs(errors, request.evidenceRefs, 'evidenceRefs', {
    requireNonEmpty: true
  });
  validateRequestedEvent(errors, request.requestedEvent);
  validateBoundaryFlags(errors, request.boundaries, 'boundaries');

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertResultIntakeRequestContract(request) {
  const result = validateResultIntakeRequestContract(request);

  if (!result.ok) {
    throw new ResultIntakeContractError(
      'invalid-result-intake-request',
      'Result intake request contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return request;
}

export function buildResultIntakePreview(request, {
  generatedAt = new Date().toISOString(),
  expiresAt = null
} = {}) {
  assertResultIntakeRequestContract(request);

  const effectiveGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();
  const effectiveExpiresAt = expiresAt === null
    ? new Date(Date.parse(effectiveGeneratedAt) + PREVIEW_TTL_MS).toISOString()
    : new Date(millisOrNow(expiresAt)).toISOString();
  const summaryResult = sanitizeResultBlock(request.resultBlock);
  const evidenceRefs = normalizeEvidenceRefs(request.evidenceRefs);
  const eventCandidate = buildEventCandidate({
    request,
    evidenceRefs,
    sanitizedSummary: summaryResult.sanitizedSummary
  });
  const previewWriteTarget = {
    kind: 'result-evidence-escrow',
    storage: 'pending-result-escrow',
    writesOnPreview: false,
    writesOnConfirm: true,
    writesGoalEventLog: false
  };
  const confirmRequestShape = {
    method: 'POST',
    route: `/api/goals/${encodeURIComponent(request.goalId)}/result-intake-confirm`,
    contentType: 'application/json',
    requiredBodyFields: [
      'goalId',
      'taskId',
      'planHash'
    ],
    optionalBodyFields: [
      'previewId',
      'escrowId'
    ],
    confirmUsesPlanHash: true
  };
  const boundaries = buildResultIntakeBoundaries({
    readOnly: true,
    willMutate: false,
    previewWrites: false,
    confirmWritesResultEscrow: true
  });
  const preview = {
    contractName: RESULT_INTAKE_PREVIEW_CONTRACT_NAME,
    contractVersion: RESULT_INTAKE_CONTRACT_VERSION,
    generatedAt: effectiveGeneratedAt,
    readOnly: true,
    willMutate: false,
    goalId: request.goalId,
    taskId: request.taskId,
    workerRole: request.workerRole,
    source: request.source,
    sanitizedSummary: summaryResult.sanitizedSummary,
    evidenceRefs,
    blockedFields: summaryResult.blockedFields,
    eventCandidate,
    previewWriteTarget,
    expiresAt: effectiveExpiresAt,
    confirmRequestShape,
    boundaries
  };

  return {
    ...preview,
    planHash: computeResultIntakePreviewPlanHash(preview)
  };
}

export function validateResultIntakePreviewContract(preview) {
  const errors = [];

  if (!isPlainObject(preview)) {
    return invalidResult('preview must be a plain object');
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'generatedAt',
    'readOnly',
    'willMutate',
    'goalId',
    'taskId',
    'workerRole',
    'source',
    'sanitizedSummary',
    'evidenceRefs',
    'blockedFields',
    'eventCandidate',
    'previewWriteTarget',
    'planHash',
    'expiresAt',
    'confirmRequestShape',
    'boundaries'
  ]) {
    if (!Object.hasOwn(preview, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExact(errors, preview.contractName, 'contractName', RESULT_INTAKE_PREVIEW_CONTRACT_NAME);
  requireExact(errors, preview.contractVersion, 'contractVersion', RESULT_INTAKE_CONTRACT_VERSION);
  requireIsoTimestamp(errors, preview.generatedAt, 'generatedAt');
  requireExact(errors, preview.readOnly, 'readOnly', true);
  requireExact(errors, preview.willMutate, 'willMutate', false);
  requireSafeToken(errors, preview.goalId, 'goalId');
  requireSafeToken(errors, preview.taskId, 'taskId');
  requireEnum(errors, preview.workerRole, 'workerRole', RESULT_INTAKE_WORKER_ROLES);
  requireEnum(errors, preview.source, 'source', RESULT_INTAKE_SOURCES);
  validateSanitizedSummary(errors, preview.sanitizedSummary);
  validateEvidenceRefs(errors, preview.evidenceRefs, 'evidenceRefs', {
    requireNonEmpty: false
  });
  validateStringArray(errors, preview.blockedFields, 'blockedFields');
  validateEventCandidate(errors, preview.eventCandidate, 'eventCandidate');
  validatePreviewWriteTarget(errors, preview.previewWriteTarget);
  requireHash(errors, preview.planHash, 'planHash');
  requireIsoTimestamp(errors, preview.expiresAt, 'expiresAt');
  validateConfirmRequestShape(errors, preview.confirmRequestShape);
  validateBoundaryFlags(errors, preview.boundaries, 'boundaries');

  if (Date.parse(preview.expiresAt) <= Date.parse(preview.generatedAt)) {
    errors.push('expiresAt must be after generatedAt');
  }

  if (Date.parse(preview.expiresAt) - Date.parse(preview.generatedAt) > PREVIEW_TTL_MS) {
    errors.push('expiresAt must be within result intake preview ttl');
  }

  if (HASH_PATTERN.test(preview.planHash) && preview.planHash !== computeResultIntakePreviewPlanHash(preview)) {
    errors.push('planHash must match result intake preview content');
  }

  for (const field of findUnsafeRawFields(preview.sanitizedSummary, 'sanitizedSummary')) {
    errors.push(`${field} must not contain raw transcript data`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertResultIntakePreviewContract(preview) {
  const result = validateResultIntakePreviewContract(preview);

  if (!result.ok) {
    throw new ResultIntakeContractError(
      'invalid-result-intake-preview',
      'Result intake preview contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return preview;
}

export function validateResultEscrowConfirmInput({
  preview,
  planHash,
  now = new Date().toISOString()
}) {
  const errors = [];
  const previewResult = validateResultIntakePreviewContract(preview);

  if (!previewResult.ok) {
    errors.push(...previewResult.errors);
  }

  requireHash(errors, planHash, 'planHash');

  if (isPlainObject(preview) && preview.planHash !== planHash) {
    errors.push('planHash must match result intake preview');
  }

  if (isPlainObject(preview) && HASH_PATTERN.test(planHash) && planHash !== computeResultIntakePreviewPlanHash(preview)) {
    errors.push('submitted planHash must match result intake preview content');
  }

  if (isPlainObject(preview) && preview.eventCandidate?.state !== 'eligible') {
    errors.push('preview event candidate is not eligible');
  }

  if (isPlainObject(preview)) {
    const nowMs = millisOrNow(now);
    const expiresMs = Date.parse(preview.expiresAt);

    if (Number.isNaN(expiresMs)) {
      errors.push('expiresAt must be a valid ISO timestamp before confirm');
    } else if (nowMs > expiresMs) {
      errors.push('preview expired');
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function buildResultEvidenceEscrow(preview, {
  planHash = preview?.planHash,
  createdAt = new Date().toISOString(),
  escrowId = null,
  now = createdAt
} = {}) {
  const confirm = validateResultEscrowConfirmInput({
    preview,
    planHash,
    now
  });

  if (!confirm.ok) {
    throw new ResultIntakeContractError(
      'invalid-result-escrow-confirm-input',
      'Result escrow confirm input is invalid.',
      { reason: confirm.errors[0] }
    );
  }

  const effectiveCreatedAt = new Date(millisOrNow(createdAt)).toISOString();
  const effectiveEscrowId = escrowId ?? escrowIdForPreview(preview);

  return {
    contractName: RESULT_EVIDENCE_ESCROW_CONTRACT_NAME,
    contractVersion: RESULT_INTAKE_CONTRACT_VERSION,
    createdAt: effectiveCreatedAt,
    goalId: preview.goalId,
    taskId: preview.taskId,
    workerRole: preview.workerRole,
    source: preview.source,
    sanitizedSummary: structuredClone(preview.sanitizedSummary),
    evidenceRefs: normalizeEvidenceRefs(preview.evidenceRefs),
    eventCandidate: structuredClone(preview.eventCandidate),
    previewPlanHash: preview.planHash,
    escrowId: effectiveEscrowId,
    escrowRef: `result-evidence-escrow:${preview.goalId}:${preview.taskId}:${effectiveEscrowId}`,
    writeStatus: 'confirmed',
    boundaries: buildResultIntakeBoundaries({
      writesResultEscrow: true,
      writesGoalEventLog: false
    })
  };
}

export function validateResultEvidenceEscrowContract(escrow, {
  preview = null
} = {}) {
  const errors = [];

  if (!isPlainObject(escrow)) {
    return invalidResult('escrow must be a plain object');
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'createdAt',
    'goalId',
    'taskId',
    'workerRole',
    'source',
    'sanitizedSummary',
    'evidenceRefs',
    'eventCandidate',
    'previewPlanHash',
    'escrowId',
    'escrowRef',
    'writeStatus',
    'boundaries'
  ]) {
    if (!Object.hasOwn(escrow, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExact(errors, escrow.contractName, 'contractName', RESULT_EVIDENCE_ESCROW_CONTRACT_NAME);
  requireExact(errors, escrow.contractVersion, 'contractVersion', RESULT_INTAKE_CONTRACT_VERSION);
  requireIsoTimestamp(errors, escrow.createdAt, 'createdAt');
  requireSafeToken(errors, escrow.goalId, 'goalId');
  requireSafeToken(errors, escrow.taskId, 'taskId');
  requireEnum(errors, escrow.workerRole, 'workerRole', RESULT_INTAKE_WORKER_ROLES);
  requireEnum(errors, escrow.source, 'source', RESULT_INTAKE_SOURCES);
  validateSanitizedSummary(errors, escrow.sanitizedSummary);
  validateEvidenceRefs(errors, escrow.evidenceRefs, 'evidenceRefs', {
    requireNonEmpty: false
  });
  validateEventCandidate(errors, escrow.eventCandidate, 'eventCandidate');
  requireHash(errors, escrow.previewPlanHash, 'previewPlanHash');
  requireSafeToken(errors, escrow.escrowId, 'escrowId');
  requireNonEmptyString(errors, escrow.escrowRef, 'escrowRef');
  requireEnum(errors, escrow.writeStatus, 'writeStatus', ['confirmed']);
  validateBoundaryFlags(errors, escrow.boundaries, 'boundaries');

  if (preview !== null) {
    if (!isPlainObject(preview)) {
      errors.push('preview must be a plain object when provided');
    } else if (escrow.previewPlanHash !== preview.planHash) {
      errors.push('previewPlanHash must match source preview');
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertResultEvidenceEscrowContract(escrow, options = {}) {
  const result = validateResultEvidenceEscrowContract(escrow, options);

  if (!result.ok) {
    throw new ResultIntakeContractError(
      'invalid-result-evidence-escrow',
      'Result evidence escrow contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return escrow;
}

export function buildPendingResultFromEscrow(escrow, {
  state = null,
  createdAt = escrow?.createdAt
} = {}) {
  assertResultEvidenceEscrowContract(escrow);

  const effectiveState = state ?? pendingStateForEscrow(escrow);

  return {
    contractName: PENDING_RESULT_CONTRACT_NAME,
    contractVersion: RESULT_INTAKE_CONTRACT_VERSION,
    goalId: escrow.goalId,
    taskId: escrow.taskId,
    workerRole: escrow.workerRole,
    source: escrow.source,
    escrowRef: escrow.escrowRef,
    sanitizedSummary: structuredClone(escrow.sanitizedSummary),
    evidenceRefs: normalizeEvidenceRefs(escrow.evidenceRefs),
    eventCandidate: structuredClone(escrow.eventCandidate),
    state: effectiveState,
    blockedReasons: effectiveState === 'blocked'
      ? uniqueStrings([
        escrow.eventCandidate?.reason,
        escrow.sanitizedSummary?.blockerReason
      ].filter(isNonEmptyString))
      : [],
    createdAt: new Date(millisOrNow(createdAt)).toISOString(),
    sourceContracts: [{
      contractName: RESULT_EVIDENCE_ESCROW_CONTRACT_NAME,
      contractVersion: RESULT_INTAKE_CONTRACT_VERSION,
      escrowRef: escrow.escrowRef,
      previewPlanHash: escrow.previewPlanHash
    }],
    boundaries: buildResultIntakeBoundaries({
      projectionAppendsGoalEvent: false,
      untrustedTranscriptProjectionAvailable: false
    })
  };
}

export function validatePendingResultContract(pendingResult) {
  const errors = [];

  if (!isPlainObject(pendingResult)) {
    return invalidResult('pendingResult must be a plain object');
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'goalId',
    'taskId',
    'workerRole',
    'source',
    'escrowRef',
    'sanitizedSummary',
    'evidenceRefs',
    'eventCandidate',
    'state',
    'blockedReasons',
    'createdAt',
    'sourceContracts',
    'boundaries'
  ]) {
    if (!Object.hasOwn(pendingResult, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExact(errors, pendingResult.contractName, 'contractName', PENDING_RESULT_CONTRACT_NAME);
  requireExact(errors, pendingResult.contractVersion, 'contractVersion', RESULT_INTAKE_CONTRACT_VERSION);
  requireSafeToken(errors, pendingResult.goalId, 'goalId');
  requireSafeToken(errors, pendingResult.taskId, 'taskId');
  requireEnum(errors, pendingResult.workerRole, 'workerRole', RESULT_INTAKE_WORKER_ROLES);
  requireEnum(errors, pendingResult.source, 'source', RESULT_INTAKE_SOURCES);
  requireNonEmptyString(errors, pendingResult.escrowRef, 'escrowRef');
  validateSanitizedSummary(errors, pendingResult.sanitizedSummary);
  validateEvidenceRefs(errors, pendingResult.evidenceRefs, 'evidenceRefs', {
    requireNonEmpty: false
  });
  validateEventCandidate(errors, pendingResult.eventCandidate, 'eventCandidate');
  requireEnum(errors, pendingResult.state, 'state', PENDING_RESULT_STATES);
  validateStringArray(errors, pendingResult.blockedReasons, 'blockedReasons');
  requireIsoTimestamp(errors, pendingResult.createdAt, 'createdAt');

  if (!Array.isArray(pendingResult.sourceContracts) || pendingResult.sourceContracts.length === 0) {
    errors.push('sourceContracts must be a non-empty array');
  }

  validateBoundaryFlags(errors, pendingResult.boundaries, 'boundaries');

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertPendingResultContract(pendingResult) {
  const result = validatePendingResultContract(pendingResult);

  if (!result.ok) {
    throw new ResultIntakeContractError(
      'invalid-pending-result',
      'Pending result contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return pendingResult;
}

export function toSerializableResultIntakeContract(value) {
  return stripUnsafeRawValue(value);
}

export function resultIntakePlanHash(value) {
  return `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`;
}

export function buildResultIntakePreviewHashPayload(preview) {
  return {
    contractName: preview.contractName,
    contractVersion: preview.contractVersion,
    generatedAt: preview.generatedAt,
    readOnly: preview.readOnly,
    willMutate: preview.willMutate,
    goalId: preview.goalId,
    taskId: preview.taskId,
    workerRole: preview.workerRole,
    source: preview.source,
    sanitizedSummary: preview.sanitizedSummary,
    evidenceRefs: preview.evidenceRefs,
    blockedFields: preview.blockedFields,
    eventCandidate: preview.eventCandidate,
    previewWriteTarget: preview.previewWriteTarget,
    expiresAt: preview.expiresAt,
    confirmRequestShape: preview.confirmRequestShape,
    boundaries: preview.boundaries
  };
}

export function computeResultIntakePreviewPlanHash(preview) {
  return resultIntakePlanHash(buildResultIntakePreviewHashPayload(preview));
}

function buildEventCandidate({
  request,
  evidenceRefs,
  sanitizedSummary
}) {
  const eventType = request.requestedEvent?.eventType ?? null;
  const base = {
    eventType,
    taskId: request.requestedEvent?.taskId ?? request.taskId,
    workerRole: request.workerRole,
    command: null,
    commandName: null,
    requiresEvidence: EVENTS_REQUIRING_EVIDENCE.has(eventType),
    evidenceRefs,
    blocker: sanitizeBlocker(request.requestedEvent?.blocker, sanitizedSummary),
    willAppendGoalEvent: false
  };

  if (!isNonEmptyString(eventType)) {
    return {
      ...base,
      state: 'blocked',
      reason: 'missing-event-type'
    };
  }

  if (REVIEW_EVENTS.has(eventType)) {
    return {
      ...base,
      command: 'review',
      commandName: 'symphony goal review',
      state: 'blocked',
      reason: 'event-routed-to-goal-review'
    };
  }

  if (GATE_EVENTS.has(eventType)) {
    return {
      ...base,
      command: 'gate',
      commandName: 'symphony goal gate',
      state: 'blocked',
      reason: 'event-routed-to-goal-gate'
    };
  }

  if (!SUPPORTED_RESULT_EVENTS.includes(eventType)) {
    return {
      ...base,
      state: 'blocked',
      reason: GOAL_EVENT_TYPES.includes(eventType)
        ? 'unsupported-event-family'
        : 'unsupported-goal-event'
    };
  }

  if (EVENTS_REQUIRING_EVIDENCE.has(eventType) && evidenceRefs.length === 0) {
    return {
      ...base,
      command: 'update',
      commandName: 'symphony goal update',
      state: 'blocked',
      reason: 'missing-evidence-refs'
    };
  }

  if (eventType === 'blocker.opened' && !isNonEmptyString(base.blocker?.reason)) {
    return {
      ...base,
      command: 'update',
      commandName: 'symphony goal update',
      state: 'blocked',
      reason: 'missing-blocker-reason'
    };
  }

  return {
    ...base,
    command: 'update',
    commandName: 'symphony goal update',
    state: 'eligible',
    reason: 'eligible-result-event'
  };
}

function sanitizeResultBlock(resultBlock) {
  const blockedFields = findUnsafeRawFields(resultBlock, 'resultBlock');
  const summary = safeText(firstNonEmptyString(
    resultBlock.summary,
    resultBlock.statement,
    resultBlock.resultSummary
  ));
  const blockerReason = safeText(firstNonEmptyString(
    resultBlock.blockerReason,
    resultBlock.blocker?.reason
  ));

  return {
    sanitizedSummary: stripNullish({
      status: safeText(resultBlock.status) ?? 'unknown',
      summary,
      changedFiles: safeRepoPaths(firstArray(resultBlock.changedFiles, resultBlock.filesChanged)),
      validationCommands: sanitizeCommands(firstArray(
        resultBlock.validationCommands,
        resultBlock.commandsRun
      )),
      evidenceRefs: normalizeEvidenceRefs(firstArray(resultBlock.evidenceRefs, []), {
        filterInvalid: true
      }),
      blockerReason,
      risks: safeTextArray(firstArray(resultBlock.risks, resultBlock.knownRisks)),
      blockers: safeTextArray(firstArray(resultBlock.blockers, []))
    }),
    blockedFields: uniqueStrings(blockedFields.map((field) => field.replace(/\[(\d+)\]/gu, '.$1')))
  };
}

function sanitizeCommands(commands) {
  return commands
    .map((command) => {
      if (typeof command === 'string') {
        return safeText(command);
      }

      if (!isPlainObject(command)) {
        return null;
      }

      const commandText = safeText(firstNonEmptyString(command.command, command.name));
      const status = safeText(command.status);

      if (!isNonEmptyString(commandText)) {
        return null;
      }

      return status === null
        ? commandText
        : `${commandText} (${status})`;
    })
    .filter(isNonEmptyString);
}

function sanitizeBlocker(blocker, sanitizedSummary) {
  const source = isPlainObject(blocker) ? blocker : {};
  const reason = safeText(firstNonEmptyString(source.reason, sanitizedSummary.blockerReason));

  if (!isNonEmptyString(reason)) {
    return null;
  }

  return stripNullish({
    blockerId: safeToken(source.blockerId),
    reason,
    severity: safeText(source.severity)
  });
}

function validateRequestedEvent(errors, requestedEvent) {
  if (!isPlainObject(requestedEvent)) {
    errors.push('requestedEvent must be a plain object');
    return;
  }

  requireEnum(errors, requestedEvent.eventType, 'requestedEvent.eventType', GOAL_EVENT_TYPES);

  if (requestedEvent.taskId !== undefined) {
    requireSafeToken(errors, requestedEvent.taskId, 'requestedEvent.taskId');
  }

  if (requestedEvent.blocker !== undefined && !isPlainObject(requestedEvent.blocker)) {
    errors.push('requestedEvent.blocker must be a plain object when present');
  }
}

function validateSanitizedSummary(errors, sanitizedSummary) {
  if (!isPlainObject(sanitizedSummary)) {
    errors.push('sanitizedSummary must be a plain object');
    return;
  }

  requireNonEmptyString(errors, sanitizedSummary.status, 'sanitizedSummary.status');

  if (sanitizedSummary.summary !== undefined) {
    requireNonEmptyString(errors, sanitizedSummary.summary, 'sanitizedSummary.summary');
  }

  validateStringArray(errors, sanitizedSummary.changedFiles, 'sanitizedSummary.changedFiles');
  validateStringArray(errors, sanitizedSummary.validationCommands, 'sanitizedSummary.validationCommands');
  validateStringArray(errors, sanitizedSummary.risks, 'sanitizedSummary.risks');
  validateStringArray(errors, sanitizedSummary.blockers, 'sanitizedSummary.blockers');

  if (sanitizedSummary.evidenceRefs !== undefined) {
    validateEvidenceRefs(errors, sanitizedSummary.evidenceRefs, 'sanitizedSummary.evidenceRefs', {
      requireNonEmpty: false
    });
  }

  if (sanitizedSummary.blockerReason !== undefined) {
    requireNonEmptyString(errors, sanitizedSummary.blockerReason, 'sanitizedSummary.blockerReason');
  }
}

function validateEventCandidate(errors, eventCandidate, path) {
  if (!isPlainObject(eventCandidate)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireEnum(errors, eventCandidate.state, `${path}.state`, ['eligible', 'blocked', 'not-applicable']);
  requireNonEmptyString(errors, eventCandidate.reason, `${path}.reason`);
  requireEnum(errors, eventCandidate.eventType, `${path}.eventType`, GOAL_EVENT_TYPES);
  requireExact(errors, eventCandidate.willAppendGoalEvent, `${path}.willAppendGoalEvent`, false);
  validateEvidenceRefs(errors, eventCandidate.evidenceRefs, `${path}.evidenceRefs`, {
    requireNonEmpty: false
  });

  if (eventCandidate.command !== null) {
    requireEnum(errors, eventCandidate.command, `${path}.command`, ['update', 'review', 'gate']);
  }

  if (eventCandidate.commandName !== null) {
    requireNonEmptyString(errors, eventCandidate.commandName, `${path}.commandName`);
  }
}

function validatePreviewWriteTarget(errors, target) {
  if (!isPlainObject(target)) {
    errors.push('previewWriteTarget must be a plain object');
    return;
  }

  requireExact(errors, target.kind, 'previewWriteTarget.kind', 'result-evidence-escrow');
  requireExact(errors, target.writesOnPreview, 'previewWriteTarget.writesOnPreview', false);
  requireExact(errors, target.writesOnConfirm, 'previewWriteTarget.writesOnConfirm', true);
  requireExact(errors, target.writesGoalEventLog, 'previewWriteTarget.writesGoalEventLog', false);
}

function validateConfirmRequestShape(errors, shape) {
  if (!isPlainObject(shape)) {
    errors.push('confirmRequestShape must be a plain object');
    return;
  }

  requireExact(errors, shape.method, 'confirmRequestShape.method', 'POST');
  requireNonEmptyString(errors, shape.route, 'confirmRequestShape.route');
  requireExact(errors, shape.contentType, 'confirmRequestShape.contentType', 'application/json');
  validateStringArray(errors, shape.requiredBodyFields, 'confirmRequestShape.requiredBodyFields');
  requireExact(errors, shape.confirmUsesPlanHash, 'confirmRequestShape.confirmUsesPlanHash', true);

  if (!Array.isArray(shape.requiredBodyFields) || !shape.requiredBodyFields.includes('planHash')) {
    errors.push('confirmRequestShape.requiredBodyFields must include planHash');
  }
}

function validateEvidenceRefs(errors, evidenceRefs, path, {
  requireNonEmpty
}) {
  if (!Array.isArray(evidenceRefs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  if (requireNonEmpty === true && evidenceRefs.length === 0) {
    errors.push(`${path} must contain at least one controlled evidence ref`);
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

  if (!isControlledEvidenceRef(evidenceRef)) {
    errors.push(`${path}.ref must be a controlled evidence reference`);
  }
}

function normalizeEvidenceRefs(evidenceRefs, {
  filterInvalid = false
} = {}) {
  if (!Array.isArray(evidenceRefs)) {
    return [];
  }

  return evidenceRefs
    .filter((evidenceRef) => {
      if (!isPlainObject(evidenceRef)) {
        return false;
      }

      return filterInvalid !== true || isControlledEvidenceRef(evidenceRef);
    })
    .map((evidenceRef) => ({
      kind: evidenceRef.kind,
      ref: evidenceRef.ref,
      label: evidenceRef.label
    }));
}

function isControlledEvidenceRef(evidenceRef) {
  if (!isPlainObject(evidenceRef)) {
    return false;
  }

  if (!EVIDENCE_REF_KINDS.includes(evidenceRef.kind)) {
    return false;
  }

  if (!isNonEmptyString(evidenceRef.ref) || !isNonEmptyString(evidenceRef.label)) {
    return false;
  }

  if (evidenceRef.kind === 'commit') {
    return COMMIT_PATTERN.test(evidenceRef.ref);
  }

  const ref = evidenceRef.ref;

  if (RAW_TEXT_PATTERN.test(ref) || ref.startsWith('/') || ref.includes('\\')) {
    return false;
  }

  const segments = ref.split('/');

  if (segments.some((segment) => segment === '..' || LOCAL_HIDDEN_PATH_SEGMENTS.has(segment))) {
    return false;
  }

  if (evidenceRef.kind === 'repo-doc' && !ref.startsWith('docs/plans/')) {
    return false;
  }

  return true;
}

function buildResultIntakeBoundaries(extra = {}) {
  return {
    ...REQUEST_BOUNDARY_FLAGS,
    ...extra
  };
}

function validateBoundaryFlags(errors, boundaries, path) {
  if (!isPlainObject(boundaries)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  for (const [flag, expected] of Object.entries(REQUEST_BOUNDARY_FLAGS)) {
    requireExact(errors, boundaries[flag], `${path}.${flag}`, expected);
  }
}

function pendingStateForEscrow(escrow) {
  if (escrow.eventCandidate?.state !== 'eligible') {
    return 'blocked';
  }

  if (escrow.eventCandidate?.eventType === 'blocker.opened' || escrow.sanitizedSummary?.status === 'blocked') {
    return 'blocked';
  }

  return 'available';
}

function escrowIdForPreview(preview) {
  return `escrow_${preview.planHash.slice('sha256:'.length, 'sha256:'.length + 16)}`;
}

function findUnsafeRawFields(value, path) {
  const fields = [];

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      fields.push(...findUnsafeRawFields(entry, `${path}[${index}]`));
    });
    return fields;
  }

  if (isPlainObject(value)) {
    for (const [key, entry] of Object.entries(value)) {
      const fieldPath = `${path}.${key}`;

      if (RAW_FIELD_NAME_PATTERN.test(key)) {
        fields.push(fieldPath);
        continue;
      }

      fields.push(...findUnsafeRawFields(entry, fieldPath));
    }
    return fields;
  }

  if (typeof value === 'string' && RAW_TEXT_PATTERN.test(value)) {
    fields.push(path);
  }

  return fields;
}

function stripUnsafeRawValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => stripUnsafeRawValue(entry))
      .filter((entry) => entry !== undefined);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !RAW_FIELD_NAME_PATTERN.test(key))
        .map(([key, entry]) => [key, stripUnsafeRawValue(entry)])
        .filter(([, entry]) => entry !== undefined)
    );
  }

  if (typeof value === 'string' && RAW_TEXT_PATTERN.test(value)) {
    return undefined;
  }

  return value;
}

function safeText(value) {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();

  return RAW_TEXT_PATTERN.test(trimmed) ? null : trimmed;
}

function safeTextArray(values) {
  return values.map((value) => safeText(value)).filter(isNonEmptyString);
}

function safeRepoPaths(values) {
  return values
    .filter((value) => typeof value === 'string' && isSafeRepoRelativePath(value))
    .map((value) => value.trim());
}

function isSafeRepoRelativePath(value) {
  if (!isNonEmptyString(value) || value.startsWith('/') || value.includes('\\') || RAW_TEXT_PATTERN.test(value)) {
    return false;
  }

  const segments = value.split('/');

  return !segments.some((segment) => segment === '..' || LOCAL_HIDDEN_PATH_SEGMENTS.has(segment));
}

function firstArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function firstNonEmptyString(...values) {
  return values.find(isNonEmptyString) ?? null;
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function requireEnum(errors, value, path, allowed) {
  if (!allowed.includes(value)) {
    errors.push(`${path} must be one of: ${allowed.join(', ')}`);
  }
}

function requireSafeToken(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && !isSafeGoalEventToken(value)) {
    errors.push(`${path} must be a safe token`);
  }
}

function safeToken(value) {
  return isNonEmptyString(value) && isSafeGoalEventToken(value) ? value : null;
}

function requireNonEmptyString(errors, value, path) {
  if (!isNonEmptyString(value)) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireHash(errors, value, path) {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
    errors.push(`${path} must be a sha256 hash`);
  }
}

function validateStringArray(errors, values, path) {
  if (!Array.isArray(values)) {
    errors.push(`${path} must be an array`);
    return;
  }

  values.forEach((value, index) => {
    if (!isNonEmptyString(value)) {
      errors.push(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function millisOrNow(value) {
  const millis = Date.parse(value);
  return Number.isNaN(millis) ? Date.now() : millis;
}

function uniqueStrings(values) {
  return [...new Set(values.filter(isNonEmptyString))];
}

function stripNullish(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined)
  );
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

function invalidResult(error) {
  return {
    ok: false,
    errors: [error]
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
