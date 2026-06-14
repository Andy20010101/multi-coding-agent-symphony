import { createHash } from 'node:crypto';

import {
  THREAD_HANDOFF_PACK_CONTRACT_NAME,
  validateThreadHandoffPackContract
} from './thread-handoff-pack-contracts.js';

export const REVIEW_GATE_PREVIEW_CONTRACT_NAME = 'reviewGatePreview.v1';
export const REVIEW_GATE_CONFIRMATION_PREVIEW_CONTRACT_NAME = 'reviewGateConfirmationPreview.v1';
export const REVIEW_GATE_SOURCE_EVIDENCE_CONTRACT_NAME = 'reviewGateSourceEvidence.v1';
export const REVIEW_GATE_BOUNDARY_NOTICE_CONTRACT_NAME = 'reviewGateBoundaryNotice.v1';
export const REVIEW_GATE_CONTRACT_VERSION = 1;

export const REVIEW_GATE_BOUNDARIES = Object.freeze({
  automaticReviewerVerdictAvailable: false,
  providerSelfApprovalAvailable: false,
  providerLaunchAvailable: false,
  directGoalEventAppendAvailable: false,
  directTaskCompleteAvailable: false,
  genericShellAvailable: false,
  mainVerificationMutationAvailable: false,
  releaseGateMutationAvailable: false,
  gitMutationAvailable: false,
  tagAutomationAvailable: false,
  publishAutomationAvailable: false,
  controlledEventRegistrationAvailable: true
});

const PREVIEW_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'goal',
  'task',
  'sourceThreadHandoffPack',
  'reviewReadiness',
  'mainGateReadiness',
  'releaseGateReadiness',
  'blockedReasons',
  'requiredEvidenceRefs',
  'sourceContracts',
  'sourceEvidence',
  'confirmationPreviews',
  'nextSafeAction',
  'boundaryNotice',
  'boundaries',
  'readOnly',
  'willMutate'
]);
const CONFIRMATION_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'eventFamily',
  'eventType',
  'goalId',
  'taskId',
  'gateName',
  'planHash',
  'planHashState',
  'previewHash',
  'requiredEvidenceRefs',
  'confirmationMode',
  'requiresOperatorConfirmation',
  'providerSelfApprovalAvailable',
  'automaticMutationAvailable',
  'directGoalEventAppendAvailable',
  'controlledEventRegistrationAvailable',
  'readOnly',
  'willMutate',
  'blockedReasons',
  'boundaries'
]);
const SOURCE_EVIDENCE_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'threadHandoffPackRef',
  'reviewerEvidenceRefs',
  'mainGateEvidenceRefs',
  'releaseGateEvidenceRefs',
  'sourceContracts',
  'blockedReasons',
  'readOnly',
  'willMutate'
]);
const BOUNDARY_NOTICE_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'disabledCapabilities',
  'boundaries',
  'readOnly',
  'willMutate'
]);
const GOAL_ALLOWED_FIELDS = new Set(['goalId', 'title', 'state', 'sourceContract', 'sourceRef']);
const TASK_ALLOWED_FIELDS = new Set(['taskId', 'title', 'state', 'sourceContract', 'sourceRef']);
const THREAD_PACK_SOURCE_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'state',
  'decision',
  'goalId',
  'taskId',
  'copyOnly',
  'willMutate',
  'sourceRef',
  'blockedReasons'
]);
const READINESS_ALLOWED_FIELDS = new Set([
  'state',
  'eventFamily',
  'eventType',
  'gateName',
  'evidenceRefs',
  'blockedReasons',
  'planHash',
  'planHashState',
  'previewHash',
  'sourceRef'
]);
const NEXT_ACTION_ALLOWED_FIELDS = new Set(['actionId', 'label', 'copyOnly', 'willMutate']);
const SOURCE_CONTRACT_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'readOnly',
  'requiredFor',
  'sourceRef'
]);
const SOURCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label', 'generatedAt']);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label']);

const GOAL_STATE_SET = new Set(['active', 'ready', 'blocked', 'pending', 'missing', 'accepted']);
const THREAD_SOURCE_STATE_SET = new Set(['ready', 'blocked', 'missing', 'invalid']);
const READINESS_STATE_SET = new Set(['ready', 'blocked', 'missing', 'stale', 'not-requested']);
const PLAN_HASH_STATE_SET = new Set(['current', 'stale', 'missing', 'not-required']);
const EVENT_FAMILY_SET = new Set(['reviewer-verdict', 'main-gate', 'release-gate']);
const REVIEW_EVENT_SET = new Set(['reviewer.approved', 'reviewer.needs-revision']);
const MAIN_GATE_EVENT_SET = new Set(['main.verification-passed', 'main.verification-failed']);
const RELEASE_GATE_EVENT_SET = new Set(['release.gate-passed', 'release.gate-failed', 'release.ready-declared']);
const SOURCE_REF_KIND_SET = new Set([
  'contract',
  'fixture',
  'repo-doc',
  'artifact-ref',
  'evidence',
  'route',
  'goal',
  'task',
  'thread'
]);
const EVIDENCE_REF_KIND_SET = new Set([
  'repo-doc',
  'artifact-ref',
  'commit',
  'command-evidence',
  'external-note'
]);
const SOURCE_CONTRACT_NAME_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const RAW_FIELD_NAME_PATTERN =
  /^(?:rawTranscript|transcript|rawModelOutput|rawOutput|providerOutput|providerPayload|sessionLog|sessionPath|messages|conversation|goalLedgerInternals)$/iu;
const UNSAFE_TEXT_PATTERN =
  /\b(?:raw[\s_-]*(?:transcript|model[\s_-]*output)|provider[\s_-]*(?:output|session|payload)|session[\s_-]*(?:log|file|path)|local[\s_-]*(?:jsonl|session)|goal[\s_-]*ledger(?:[\s_-]*internals?)?|provider[\s_-]*self[\s_-]*approval)\b|(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\.jsonl(?:$|[/\s])|\/api\/(?:providers?|provider-parity|child(?:-dispatch)?|dispatch)(?:$|[/\s])|\/(?:event-append|append-event|event-plan-confirm|confirm-event-plan|confirm-goal-event-plan|goal-event-confirm|record-result|mark-complete|complete-task|git|tag|publish|release)(?:$|[/\s])|\b(?:append\s+event\s+directly|auto\s+approve|provider\s+approves|confirm\s+main\s+gate\s+automatically|confirm\s+release\s+gate\s+automatically|mark\s+complete|git\s+(?:push|tag|checkout|merge|commit)|gh\s+release|tag\s+creation|github\s+release|publish\s+release)\b/iu;

export class ReviewGatePreviewContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ReviewGatePreviewContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildReviewGatePreview({
  generatedAt = new Date().toISOString(),
  goal = null,
  task = null,
  threadHandoffPack = null,
  target = 'reviewer-verdict',
  reviewerEvidenceRefs = [],
  mainGateEvidenceRefs = [],
  releaseGateEvidenceRefs = [],
  blockedReasons: inputBlockedReasons = [],
  planHashState = 'current'
} = {}) {
  const unsafeSourceField = findUnsafeFields({
    threadHandoffPack,
    reviewerEvidenceRefs,
    mainGateEvidenceRefs,
    releaseGateEvidenceRefs
  }, 'source')[0];

  if (unsafeSourceField !== undefined) {
    throw new ReviewGatePreviewContractError(
      'unsafe-review-gate-source',
      'Review gate preview source contains raw provider output, local session refs, or direct mutation routes.',
      { reason: `${unsafeSourceField} must not contain raw provider output, local session refs, or direct mutation routes` }
    );
  }

  const normalizedGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();
  const sourceThreadHandoffPack = sourceThreadHandoffPackFrom(threadHandoffPack);
  const normalizedGoal = goalForPreview({ goal, threadHandoffPack, sourceThreadHandoffPack });
  const normalizedTask = taskForPreview({ task, threadHandoffPack, sourceThreadHandoffPack });
  const sourceContracts = sourceContractsForPreview({ sourceThreadHandoffPack });
  const normalizedReviewerEvidenceRefs = controlledEvidenceRefs(reviewerEvidenceRefs);
  const normalizedMainGateEvidenceRefs = controlledEvidenceRefs(mainGateEvidenceRefs);
  const normalizedReleaseGateEvidenceRefs = controlledEvidenceRefs(releaseGateEvidenceRefs);
  const reviewReadiness = buildReadiness({
    generatedAt: normalizedGeneratedAt,
    eventFamily: 'reviewer-verdict',
    eventType: 'reviewer.approved',
    sourceThreadHandoffPack,
    evidenceRefs: normalizedReviewerEvidenceRefs,
    missingEvidenceReason: 'missing-reviewer-evidence',
    planHashState
  });
  const mainGateReadiness = buildReadiness({
    generatedAt: normalizedGeneratedAt,
    eventFamily: 'main-gate',
    eventType: 'main.verification-passed',
    gateName: 'main-verification',
    sourceThreadHandoffPack,
    evidenceRefs: normalizedMainGateEvidenceRefs,
    missingEvidenceReason: 'missing-main-gate-evidence',
    dependencyReadiness: reviewReadiness,
    dependencyBlockedReason: 'reviewer-verdict-not-ready',
    planHashState
  });
  const releaseGateReadiness = target === 'release-gate'
    ? buildReadiness({
      generatedAt: normalizedGeneratedAt,
      eventFamily: 'release-gate',
      eventType: 'release.gate-passed',
      gateName: 'release.validation',
      sourceThreadHandoffPack,
      evidenceRefs: normalizedReleaseGateEvidenceRefs,
      missingEvidenceReason: 'missing-release-gate-evidence',
      dependencyReadiness: mainGateReadiness,
      dependencyBlockedReason: 'main-gate-not-ready',
      planHashState
    })
    : notRequestedReadiness({
      eventFamily: 'release-gate',
      eventType: 'release.gate-passed',
      gateName: 'release.validation'
    });
  const targetReadiness = readinessForTarget({
    target,
    reviewReadiness,
    mainGateReadiness,
    releaseGateReadiness
  });
  const blockedReasons = uniqueStrings([
    ...safeStringArray(inputBlockedReasons),
    ...safeStringArray(sourceThreadHandoffPack.blockedReasons),
    ...safeStringArray(targetReadiness.blockedReasons)
  ]);
  const requiredEvidenceRefs = evidenceRefsForTarget({
    target,
    reviewerEvidenceRefs: normalizedReviewerEvidenceRefs,
    mainGateEvidenceRefs: normalizedMainGateEvidenceRefs,
    releaseGateEvidenceRefs: normalizedReleaseGateEvidenceRefs
  });
  const confirmationPreviews = targetReadiness.state === 'ready' || targetReadiness.planHashState === 'stale'
    ? [buildReviewGateConfirmationPreview({
      generatedAt: normalizedGeneratedAt,
      goal: normalizedGoal,
      task: normalizedTask,
      readiness: targetReadiness,
      requiredEvidenceRefs,
      stale: targetReadiness.planHashState === 'stale'
    })]
    : [];
  const sourceEvidence = buildReviewGateSourceEvidence({
    generatedAt: normalizedGeneratedAt,
    sourceThreadHandoffPack,
    reviewerEvidenceRefs: normalizedReviewerEvidenceRefs,
    mainGateEvidenceRefs: normalizedMainGateEvidenceRefs,
    releaseGateEvidenceRefs: normalizedReleaseGateEvidenceRefs,
    sourceContracts,
    blockedReasons
  });
  const preview = {
    contractName: REVIEW_GATE_PREVIEW_CONTRACT_NAME,
    contractVersion: REVIEW_GATE_CONTRACT_VERSION,
    generatedAt: normalizedGeneratedAt,
    goal: normalizedGoal,
    task: normalizedTask,
    sourceThreadHandoffPack,
    reviewReadiness,
    mainGateReadiness,
    releaseGateReadiness,
    blockedReasons,
    requiredEvidenceRefs,
    sourceContracts,
    sourceEvidence,
    confirmationPreviews,
    nextSafeAction: nextSafeActionFor({
      target,
      blockedReasons
    }),
    boundaryNotice: buildReviewGateBoundaryNotice({
      generatedAt: normalizedGeneratedAt
    }),
    boundaries: buildReviewGateBoundaries(),
    readOnly: true,
    willMutate: false
  };

  assertReviewGatePreviewContract(preview);

  return preview;
}

export function validateReviewGatePreviewContract(preview) {
  const errors = [];

  if (!isPlainObject(preview)) {
    return invalidResult('preview must be a plain object');
  }

  for (const field of PREVIEW_ALLOWED_FIELDS) {
    if (!Object.hasOwn(preview, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, preview, 'preview', PREVIEW_ALLOWED_FIELDS);
  requireExact(errors, preview.contractName, 'contractName', REVIEW_GATE_PREVIEW_CONTRACT_NAME);
  requireExact(errors, preview.contractVersion, 'contractVersion', REVIEW_GATE_CONTRACT_VERSION);
  requireIsoTimestamp(errors, preview.generatedAt, 'generatedAt');
  validateGoal(errors, preview.goal, 'goal');
  validateTask(errors, preview.task, 'task');
  validateThreadHandoffPackSource(errors, preview.sourceThreadHandoffPack, 'sourceThreadHandoffPack');
  validateReadiness(errors, preview.reviewReadiness, 'reviewReadiness', 'reviewer-verdict');
  validateReadiness(errors, preview.mainGateReadiness, 'mainGateReadiness', 'main-gate');
  validateReadiness(errors, preview.releaseGateReadiness, 'releaseGateReadiness', 'release-gate');
  validateStringArray(errors, preview.blockedReasons, 'blockedReasons');
  validateEvidenceRefs(errors, preview.requiredEvidenceRefs, 'requiredEvidenceRefs');
  validateSourceContracts(errors, preview.sourceContracts, 'sourceContracts');
  appendPrefixedErrors(errors, validateReviewGateSourceEvidenceContract(preview.sourceEvidence), 'sourceEvidence');
  validateConfirmationPreviews(errors, preview.confirmationPreviews, 'confirmationPreviews');
  validateNextSafeAction(errors, preview.nextSafeAction, 'nextSafeAction');
  appendPrefixedErrors(errors, validateReviewGateBoundaryNoticeContract(preview.boundaryNotice), 'boundaryNotice');
  validateBoundaries(errors, preview.boundaries, 'boundaries');
  requireExact(errors, preview.readOnly, 'readOnly', true);
  requireExact(errors, preview.willMutate, 'willMutate', false);
  validatePreviewBinding(errors, preview);

  for (const field of findUnsafeFields(preview, 'preview')) {
    errors.push(`${field} must not contain raw provider output, local session refs, provider self-approval, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertReviewGatePreviewContract(preview) {
  const validation = validateReviewGatePreviewContract(preview);

  if (!validation.ok) {
    throw new ReviewGatePreviewContractError(
      'invalid-review-gate-preview',
      'Review gate preview contract is invalid.',
      { reason: validation.errors[0] }
    );
  }

  return preview;
}

export function validateReviewGateConfirmationPreviewContract(preview) {
  const errors = [];

  if (!isPlainObject(preview)) {
    return invalidResult('confirmation preview must be a plain object');
  }

  validateAllowedFields(errors, preview, 'confirmationPreview', CONFIRMATION_ALLOWED_FIELDS);
  requireExact(errors, preview.contractName, 'contractName', REVIEW_GATE_CONFIRMATION_PREVIEW_CONTRACT_NAME);
  requireExact(errors, preview.contractVersion, 'contractVersion', REVIEW_GATE_CONTRACT_VERSION);
  requireIsoTimestamp(errors, preview.generatedAt, 'generatedAt');
  requireEnum(errors, preview.state, 'state', new Set(['ready', 'blocked']));
  validateEventFamilyAndType(errors, preview, 'confirmationPreview');
  requireSafeToken(errors, preview.goalId, 'goalId');
  requireSafeToken(errors, preview.taskId, 'taskId');
  if (preview.gateName !== null && preview.gateName !== undefined) {
    requireSafeToken(errors, preview.gateName, 'gateName');
  }
  requireHash(errors, preview.planHash, 'planHash');
  requireEnum(errors, preview.planHashState, 'planHashState', PLAN_HASH_STATE_SET);
  requireHash(errors, preview.previewHash, 'previewHash');
  validateEvidenceRefs(errors, preview.requiredEvidenceRefs, 'requiredEvidenceRefs');
  requireExact(errors, preview.confirmationMode, 'confirmationMode', 'controlled-event-registration');
  requireExact(errors, preview.requiresOperatorConfirmation, 'requiresOperatorConfirmation', true);
  requireExact(errors, preview.providerSelfApprovalAvailable, 'providerSelfApprovalAvailable', false);
  requireExact(errors, preview.automaticMutationAvailable, 'automaticMutationAvailable', false);
  requireExact(errors, preview.directGoalEventAppendAvailable, 'directGoalEventAppendAvailable', false);
  requireExact(errors, preview.controlledEventRegistrationAvailable, 'controlledEventRegistrationAvailable', true);
  requireExact(errors, preview.readOnly, 'readOnly', true);
  requireExact(errors, preview.willMutate, 'willMutate', false);
  validateStringArray(errors, preview.blockedReasons, 'blockedReasons');
  validateBoundaries(errors, preview.boundaries, 'boundaries');

  if (preview.state === 'ready' && preview.planHashState !== 'current') {
    errors.push('planHashState must be current when confirmation preview is ready');
  }

  if (preview.state === 'blocked' && preview.planHashState === 'stale') {
    requireStringArrayIncludes(errors, preview.blockedReasons, 'blockedReasons', 'stale-plan-hash');
  }

  for (const field of findUnsafeFields(preview, 'confirmationPreview')) {
    errors.push(`${field} must not contain raw provider output, local session refs, provider self-approval, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function validateReviewGateSourceEvidenceContract(sourceEvidence) {
  const errors = [];

  if (!isPlainObject(sourceEvidence)) {
    return invalidResult('source evidence must be a plain object');
  }

  validateAllowedFields(errors, sourceEvidence, 'sourceEvidence', SOURCE_EVIDENCE_ALLOWED_FIELDS);
  requireExact(errors, sourceEvidence.contractName, 'contractName', REVIEW_GATE_SOURCE_EVIDENCE_CONTRACT_NAME);
  requireExact(errors, sourceEvidence.contractVersion, 'contractVersion', REVIEW_GATE_CONTRACT_VERSION);
  requireIsoTimestamp(errors, sourceEvidence.generatedAt, 'generatedAt');
  validateSourceRef(errors, sourceEvidence.threadHandoffPackRef, 'threadHandoffPackRef');
  validateEvidenceRefs(errors, sourceEvidence.reviewerEvidenceRefs, 'reviewerEvidenceRefs');
  validateEvidenceRefs(errors, sourceEvidence.mainGateEvidenceRefs, 'mainGateEvidenceRefs');
  validateEvidenceRefs(errors, sourceEvidence.releaseGateEvidenceRefs, 'releaseGateEvidenceRefs');
  validateSourceContracts(errors, sourceEvidence.sourceContracts, 'sourceContracts');
  validateStringArray(errors, sourceEvidence.blockedReasons, 'blockedReasons');
  requireExact(errors, sourceEvidence.readOnly, 'readOnly', true);
  requireExact(errors, sourceEvidence.willMutate, 'willMutate', false);

  for (const field of findUnsafeFields(sourceEvidence, 'sourceEvidence')) {
    errors.push(`${field} must not contain raw provider output, local session refs, provider self-approval, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function validateReviewGateBoundaryNoticeContract(notice) {
  const errors = [];

  if (!isPlainObject(notice)) {
    return invalidResult('boundary notice must be a plain object');
  }

  validateAllowedFields(errors, notice, 'boundaryNotice', BOUNDARY_NOTICE_ALLOWED_FIELDS);
  requireExact(errors, notice.contractName, 'contractName', REVIEW_GATE_BOUNDARY_NOTICE_CONTRACT_NAME);
  requireExact(errors, notice.contractVersion, 'contractVersion', REVIEW_GATE_CONTRACT_VERSION);
  requireIsoTimestamp(errors, notice.generatedAt, 'generatedAt');
  validateDisabledCapabilities(errors, notice.disabledCapabilities, 'disabledCapabilities');
  validateBoundaries(errors, notice.boundaries, 'boundaries');
  requireExact(errors, notice.readOnly, 'readOnly', true);
  requireExact(errors, notice.willMutate, 'willMutate', false);

  return {
    ok: errors.length === 0,
    errors
  };
}

function buildReadiness({
  generatedAt,
  eventFamily,
  eventType,
  gateName = null,
  sourceThreadHandoffPack,
  evidenceRefs,
  missingEvidenceReason,
  dependencyReadiness = null,
  dependencyBlockedReason = null,
  planHashState = 'current'
}) {
  const blockedReasons = [];
  let state = 'ready';

  if (sourceThreadHandoffPack.state !== 'ready') {
    state = sourceThreadHandoffPack.state === 'missing' ? 'missing' : 'blocked';
    blockedReasons.push(...safeStringArray(sourceThreadHandoffPack.blockedReasons));
  }

  if (isPlainObject(dependencyReadiness) && dependencyReadiness.state !== 'ready') {
    state = 'blocked';
    blockedReasons.push(dependencyBlockedReason);
  }

  if (evidenceRefs.length === 0) {
    state = 'blocked';
    blockedReasons.push(missingEvidenceReason);
  }

  const effectivePlanHashState = planHashState === 'stale' ? 'stale' : (state === 'ready' ? 'current' : 'missing');

  if (effectivePlanHashState === 'stale') {
    state = 'blocked';
    blockedReasons.push('stale-plan-hash');
  }

  const seed = {
    generatedAt,
    eventFamily,
    eventType,
    gateName,
    sourceRef: sourceThreadHandoffPack.sourceRef,
    evidenceRefs
  };
  const planHash = effectivePlanHashState === 'missing' ? null : sha256(seed);
  const previewHash = effectivePlanHashState === 'missing' ? null : sha256({ ...seed, planHash });

  return {
    state,
    eventFamily,
    eventType,
    gateName,
    evidenceRefs,
    blockedReasons: uniqueStrings(blockedReasons),
    planHash,
    planHashState: effectivePlanHashState,
    previewHash,
    sourceRef: {
      kind: 'contract',
      ref: REVIEW_GATE_PREVIEW_CONTRACT_NAME
    }
  };
}

function notRequestedReadiness({
  eventFamily,
  eventType,
  gateName = null
}) {
  return {
    state: 'not-requested',
    eventFamily,
    eventType,
    gateName,
    evidenceRefs: [],
    blockedReasons: [],
    planHash: null,
    planHashState: 'not-required',
    previewHash: null,
    sourceRef: {
      kind: 'contract',
      ref: REVIEW_GATE_PREVIEW_CONTRACT_NAME
    }
  };
}

function buildReviewGateConfirmationPreview({
  generatedAt,
  goal,
  task,
  readiness,
  requiredEvidenceRefs,
  stale = false
}) {
  const confirmation = {
    contractName: REVIEW_GATE_CONFIRMATION_PREVIEW_CONTRACT_NAME,
    contractVersion: REVIEW_GATE_CONTRACT_VERSION,
    generatedAt,
    state: stale ? 'blocked' : 'ready',
    eventFamily: readiness.eventFamily,
    eventType: readiness.eventType,
    goalId: goal.goalId,
    taskId: task.taskId,
    gateName: readiness.gateName,
    planHash: readiness.planHash,
    planHashState: stale ? 'stale' : 'current',
    previewHash: readiness.previewHash,
    requiredEvidenceRefs,
    confirmationMode: 'controlled-event-registration',
    requiresOperatorConfirmation: true,
    providerSelfApprovalAvailable: false,
    automaticMutationAvailable: false,
    directGoalEventAppendAvailable: false,
    controlledEventRegistrationAvailable: true,
    readOnly: true,
    willMutate: false,
    blockedReasons: stale ? ['stale-plan-hash'] : [],
    boundaries: buildReviewGateBoundaries()
  };
  const validation = validateReviewGateConfirmationPreviewContract(confirmation);

  if (!validation.ok) {
    throw new ReviewGatePreviewContractError(
      'invalid-built-review-gate-confirmation-preview',
      'Built review gate confirmation preview is invalid.',
      { reason: validation.errors[0] }
    );
  }

  return confirmation;
}

function buildReviewGateSourceEvidence({
  generatedAt,
  sourceThreadHandoffPack,
  reviewerEvidenceRefs,
  mainGateEvidenceRefs,
  releaseGateEvidenceRefs,
  sourceContracts,
  blockedReasons
}) {
  const sourceEvidence = {
    contractName: REVIEW_GATE_SOURCE_EVIDENCE_CONTRACT_NAME,
    contractVersion: REVIEW_GATE_CONTRACT_VERSION,
    generatedAt,
    threadHandoffPackRef: sourceThreadHandoffPack.sourceRef,
    reviewerEvidenceRefs,
    mainGateEvidenceRefs,
    releaseGateEvidenceRefs,
    sourceContracts,
    blockedReasons,
    readOnly: true,
    willMutate: false
  };
  const validation = validateReviewGateSourceEvidenceContract(sourceEvidence);

  if (!validation.ok) {
    throw new ReviewGatePreviewContractError(
      'invalid-built-review-gate-source-evidence',
      'Built review gate source evidence is invalid.',
      { reason: validation.errors[0] }
    );
  }

  return sourceEvidence;
}

function buildReviewGateBoundaryNotice({
  generatedAt
}) {
  const notice = {
    contractName: REVIEW_GATE_BOUNDARY_NOTICE_CONTRACT_NAME,
    contractVersion: REVIEW_GATE_CONTRACT_VERSION,
    generatedAt,
    disabledCapabilities: Object.entries(REVIEW_GATE_BOUNDARIES)
      .filter(([, value]) => value === false)
      .map(([key]) => key),
    boundaries: buildReviewGateBoundaries(),
    readOnly: true,
    willMutate: false
  };
  const validation = validateReviewGateBoundaryNoticeContract(notice);

  if (!validation.ok) {
    throw new ReviewGatePreviewContractError(
      'invalid-built-review-gate-boundary-notice',
      'Built review gate boundary notice is invalid.',
      { reason: validation.errors[0] }
    );
  }

  return notice;
}

function sourceThreadHandoffPackFrom(threadHandoffPack) {
  if (!isPlainObject(threadHandoffPack)) {
    return {
      contractName: THREAD_HANDOFF_PACK_CONTRACT_NAME,
      contractVersion: REVIEW_GATE_CONTRACT_VERSION,
      state: 'missing',
      blockedReasons: ['missing-thread-handoff-pack'],
      sourceRef: {
        kind: 'contract',
        ref: THREAD_HANDOFF_PACK_CONTRACT_NAME
      }
    };
  }

  const validation = validateThreadHandoffPackContract(threadHandoffPack);
  const valid = validation.ok === true;

  return {
    contractName: THREAD_HANDOFF_PACK_CONTRACT_NAME,
    contractVersion: REVIEW_GATE_CONTRACT_VERSION,
    state: valid && threadHandoffPack.blockedReasons.length === 0 ? 'ready' : (valid ? 'blocked' : 'invalid'),
    decision: safeToken(threadHandoffPack.decision) ?? 'blocked',
    goalId: safeToken(threadHandoffPack.goal?.goalId) ?? 'missing-goal',
    taskId: safeToken(threadHandoffPack.task?.taskId) ?? 'missing-task',
    copyOnly: threadHandoffPack.copyOnly === true,
    willMutate: threadHandoffPack.willMutate === true,
    sourceRef: {
      kind: 'contract',
      ref: THREAD_HANDOFF_PACK_CONTRACT_NAME
    },
    blockedReasons: valid ? safeStringArray(threadHandoffPack.blockedReasons) : ['invalid-thread-handoff-pack']
  };
}

function goalForPreview({
  goal,
  threadHandoffPack,
  sourceThreadHandoffPack
}) {
  const source = isPlainObject(goal) ? goal : {};
  const handoffGoal = isPlainObject(threadHandoffPack?.goal) ? threadHandoffPack.goal : {};
  const goalId = safeToken(source.goalId) ?? safeToken(handoffGoal.goalId) ?? safeToken(sourceThreadHandoffPack.goalId) ?? 'missing-goal';

  return {
    goalId,
    title: safeDisplayText(source.title) ?? safeDisplayText(handoffGoal.title) ?? goalId,
    state: GOAL_STATE_SET.has(source.state) ? source.state : (GOAL_STATE_SET.has(handoffGoal.state) ? handoffGoal.state : 'active'),
    sourceContract: safeContractName(source.sourceContract) ?? THREAD_HANDOFF_PACK_CONTRACT_NAME,
    sourceRef: safeSourceRef(source.sourceRef) ?? {
      kind: 'contract',
      ref: THREAD_HANDOFF_PACK_CONTRACT_NAME
    }
  };
}

function taskForPreview({
  task,
  threadHandoffPack,
  sourceThreadHandoffPack
}) {
  const source = isPlainObject(task) ? task : {};
  const handoffTask = isPlainObject(threadHandoffPack?.task) ? threadHandoffPack.task : {};
  const taskId = safeToken(source.taskId) ?? safeToken(handoffTask.taskId) ?? safeToken(sourceThreadHandoffPack.taskId) ?? 'missing-task';

  return {
    taskId,
    title: safeDisplayText(source.title) ?? safeDisplayText(handoffTask.title) ?? taskId,
    state: GOAL_STATE_SET.has(source.state) ? source.state : (GOAL_STATE_SET.has(handoffTask.state) ? handoffTask.state : 'active'),
    sourceContract: safeContractName(source.sourceContract) ?? THREAD_HANDOFF_PACK_CONTRACT_NAME,
    sourceRef: safeSourceRef(source.sourceRef) ?? {
      kind: 'contract',
      ref: THREAD_HANDOFF_PACK_CONTRACT_NAME
    }
  };
}

function sourceContractsForPreview({
  sourceThreadHandoffPack
}) {
  return [
    {
      contractName: THREAD_HANDOFF_PACK_CONTRACT_NAME,
      contractVersion: REVIEW_GATE_CONTRACT_VERSION,
      readOnly: true,
      requiredFor: ['source-thread-handoff-pack'],
      sourceRef: sourceThreadHandoffPack.sourceRef
    },
    {
      contractName: 'goal-event-log.v1',
      contractVersion: REVIEW_GATE_CONTRACT_VERSION,
      readOnly: true,
      requiredFor: ['review-and-gate-evidence'],
      sourceRef: {
        kind: 'contract',
        ref: 'goal-event-log.v1'
      }
    },
    {
      contractName: 'goal-progress-ledger.v1',
      contractVersion: REVIEW_GATE_CONTRACT_VERSION,
      readOnly: true,
      requiredFor: ['review-and-gate-state'],
      sourceRef: {
        kind: 'contract',
        ref: 'goal-progress-ledger.v1'
      }
    }
  ];
}

function readinessForTarget({
  target,
  reviewReadiness,
  mainGateReadiness,
  releaseGateReadiness
}) {
  if (target === 'main-gate') {
    return mainGateReadiness;
  }

  if (target === 'release-gate') {
    return releaseGateReadiness;
  }

  return reviewReadiness;
}

function evidenceRefsForTarget({
  target,
  reviewerEvidenceRefs,
  mainGateEvidenceRefs,
  releaseGateEvidenceRefs
}) {
  if (target === 'main-gate') {
    return controlledEvidenceRefs([
      ...reviewerEvidenceRefs,
      ...mainGateEvidenceRefs
    ]);
  }

  if (target === 'release-gate') {
    return controlledEvidenceRefs([
      ...reviewerEvidenceRefs,
      ...mainGateEvidenceRefs,
      ...releaseGateEvidenceRefs
    ]);
  }

  return controlledEvidenceRefs(reviewerEvidenceRefs);
}

function nextSafeActionFor({
  target,
  blockedReasons
}) {
  if (blockedReasons.length > 0) {
    return {
      actionId: 'resolve-review-gate-preview-blockers',
      label: 'Resolve review gate preview blockers',
      copyOnly: true,
      willMutate: false
    };
  }

  if (target === 'main-gate') {
    return {
      actionId: 'preview-main-gate-registration',
      label: 'Preview main gate registration',
      copyOnly: true,
      willMutate: false
    };
  }

  if (target === 'release-gate') {
    return {
      actionId: 'preview-release-gate-registration',
      label: 'Preview release gate registration',
      copyOnly: true,
      willMutate: false
    };
  }

  return {
    actionId: 'preview-reviewer-verdict-registration',
    label: 'Preview reviewer verdict registration',
    copyOnly: true,
    willMutate: false
  };
}

function buildReviewGateBoundaries() {
  return { ...REVIEW_GATE_BOUNDARIES };
}

function validatePreviewBinding(errors, preview) {
  if (preview.sourceThreadHandoffPack?.state === 'missing') {
    requireStringArrayIncludes(errors, preview.blockedReasons, 'blockedReasons', 'missing-thread-handoff-pack');
  }

  for (const readinessName of ['reviewReadiness', 'mainGateReadiness', 'releaseGateReadiness']) {
    const readiness = preview[readinessName];

    if (readiness?.planHashState === 'stale') {
      requireStringArrayIncludes(errors, readiness.blockedReasons, `${readinessName}.blockedReasons`, 'stale-plan-hash');
      requireStringArrayIncludes(errors, preview.blockedReasons, 'blockedReasons', 'stale-plan-hash');
    }
  }
}

function validateConfirmationPreviews(errors, confirmationPreviews, path) {
  if (!Array.isArray(confirmationPreviews)) {
    errors.push(`${path} must be an array`);
    return;
  }

  for (const [index, confirmationPreview] of confirmationPreviews.entries()) {
    appendPrefixedErrors(errors, validateReviewGateConfirmationPreviewContract(confirmationPreview), `${path}[${index}]`);
  }
}

function validateGoal(errors, goal, path) {
  if (!isPlainObject(goal)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, goal, path, GOAL_ALLOWED_FIELDS);
  requireSafeToken(errors, goal.goalId, `${path}.goalId`);
  requireNonEmptyString(errors, goal.title, `${path}.title`);
  requireEnum(errors, goal.state, `${path}.state`, GOAL_STATE_SET);
  validateNullableSourceContractName(errors, goal.sourceContract, `${path}.sourceContract`);
  validateSourceRef(errors, goal.sourceRef, `${path}.sourceRef`);
}

function validateTask(errors, task, path) {
  if (!isPlainObject(task)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, task, path, TASK_ALLOWED_FIELDS);
  requireSafeToken(errors, task.taskId, `${path}.taskId`);
  requireNonEmptyString(errors, task.title, `${path}.title`);
  requireEnum(errors, task.state, `${path}.state`, GOAL_STATE_SET);
  validateNullableSourceContractName(errors, task.sourceContract, `${path}.sourceContract`);
  validateSourceRef(errors, task.sourceRef, `${path}.sourceRef`);
}

function validateThreadHandoffPackSource(errors, source, path) {
  if (!isPlainObject(source)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, source, path, THREAD_PACK_SOURCE_ALLOWED_FIELDS);
  requireExact(errors, source.contractName, `${path}.contractName`, THREAD_HANDOFF_PACK_CONTRACT_NAME);
  requireExact(errors, source.contractVersion, `${path}.contractVersion`, REVIEW_GATE_CONTRACT_VERSION);
  requireEnum(errors, source.state, `${path}.state`, THREAD_SOURCE_STATE_SET);

  if (source.decision !== undefined) {
    requireSafeToken(errors, source.decision, `${path}.decision`);
  }

  if (source.goalId !== undefined) {
    requireSafeToken(errors, source.goalId, `${path}.goalId`);
  }

  if (source.taskId !== undefined) {
    requireSafeToken(errors, source.taskId, `${path}.taskId`);
  }

  if (source.copyOnly !== undefined) {
    requireExact(errors, source.copyOnly, `${path}.copyOnly`, true);
  }

  if (source.willMutate !== undefined) {
    requireExact(errors, source.willMutate, `${path}.willMutate`, false);
  }

  validateSourceRef(errors, source.sourceRef, `${path}.sourceRef`);
  validateStringArray(errors, source.blockedReasons, `${path}.blockedReasons`);
}

function validateReadiness(errors, readiness, path, expectedFamily) {
  if (!isPlainObject(readiness)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, readiness, path, READINESS_ALLOWED_FIELDS);
  requireEnum(errors, readiness.state, `${path}.state`, READINESS_STATE_SET);
  requireExact(errors, readiness.eventFamily, `${path}.eventFamily`, expectedFamily);
  validateEventFamilyAndType(errors, readiness, path);

  if (readiness.gateName !== null && readiness.gateName !== undefined) {
    requireSafeToken(errors, readiness.gateName, `${path}.gateName`);
  }

  validateEvidenceRefs(errors, readiness.evidenceRefs, `${path}.evidenceRefs`);
  validateStringArray(errors, readiness.blockedReasons, `${path}.blockedReasons`);
  requireEnum(errors, readiness.planHashState, `${path}.planHashState`, PLAN_HASH_STATE_SET);

  if (readiness.planHash !== null && readiness.planHash !== undefined) {
    requireHash(errors, readiness.planHash, `${path}.planHash`);
  }

  if (readiness.previewHash !== null && readiness.previewHash !== undefined) {
    requireHash(errors, readiness.previewHash, `${path}.previewHash`);
  }

  validateSourceRef(errors, readiness.sourceRef, `${path}.sourceRef`);

  if (readiness.state === 'ready' && readiness.evidenceRefs.length === 0) {
    errors.push(`${path}.evidenceRefs must contain at least one evidence ref when readiness is ready`);
  }

  if (readiness.state === 'ready' && readiness.planHashState !== 'current') {
    errors.push(`${path}.planHashState must be current when readiness is ready`);
  }

  if (readiness.planHashState === 'stale') {
    requireStringArrayIncludes(errors, readiness.blockedReasons, `${path}.blockedReasons`, 'stale-plan-hash');
  }
}

function validateEventFamilyAndType(errors, value, path) {
  requireEnum(errors, value.eventFamily, `${path}.eventFamily`, EVENT_FAMILY_SET);

  if (value.eventFamily === 'reviewer-verdict') {
    requireEnum(errors, value.eventType, `${path}.eventType`, REVIEW_EVENT_SET);
  } else if (value.eventFamily === 'main-gate') {
    requireEnum(errors, value.eventType, `${path}.eventType`, MAIN_GATE_EVENT_SET);
  } else if (value.eventFamily === 'release-gate') {
    requireEnum(errors, value.eventType, `${path}.eventType`, RELEASE_GATE_EVENT_SET);
  }
}

function validateNextSafeAction(errors, nextSafeAction, path) {
  if (!isPlainObject(nextSafeAction)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, nextSafeAction, path, NEXT_ACTION_ALLOWED_FIELDS);
  requireSafeToken(errors, nextSafeAction.actionId, `${path}.actionId`);
  requireNonEmptyString(errors, nextSafeAction.label, `${path}.label`);
  requireExact(errors, nextSafeAction.copyOnly, `${path}.copyOnly`, true);
  requireExact(errors, nextSafeAction.willMutate, `${path}.willMutate`, false);
}

function validateSourceContracts(errors, sourceContracts, path) {
  if (!Array.isArray(sourceContracts) || sourceContracts.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  sourceContracts.forEach((sourceContract, index) => {
    const contractPath = `${path}[${index}]`;

    if (!isPlainObject(sourceContract)) {
      errors.push(`${contractPath} must be a plain object`);
      return;
    }

    validateAllowedFields(errors, sourceContract, contractPath, SOURCE_CONTRACT_ALLOWED_FIELDS);
    requireSafeSourceContractName(errors, sourceContract.contractName, `${contractPath}.contractName`);
    requireExact(errors, sourceContract.contractVersion, `${contractPath}.contractVersion`, REVIEW_GATE_CONTRACT_VERSION);
    requireExact(errors, sourceContract.readOnly, `${contractPath}.readOnly`, true);
    validateStringArray(errors, sourceContract.requiredFor, `${contractPath}.requiredFor`);
    validateSourceRef(errors, sourceContract.sourceRef, `${contractPath}.sourceRef`);
  });
}

function validateSourceRef(errors, sourceRef, path) {
  if (!isPlainObject(sourceRef)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, sourceRef, path, SOURCE_REF_ALLOWED_FIELDS);
  requireEnum(errors, sourceRef.kind, `${path}.kind`, SOURCE_REF_KIND_SET);
  validateSourceRefRef(errors, sourceRef, path);

  if (sourceRef.label !== undefined) {
    requireNonEmptyString(errors, sourceRef.label, `${path}.label`);
  }

  if (sourceRef.generatedAt !== undefined) {
    requireIsoTimestamp(errors, sourceRef.generatedAt, `${path}.generatedAt`);
  }
}

function validateSourceRefRef(errors, sourceRef, path) {
  if (sourceRef.kind === 'contract') {
    requireSafeSourceContractName(errors, sourceRef.ref, `${path}.ref`);
    return;
  }

  if (sourceRef.kind === 'repo-doc') {
    if (typeof sourceRef.ref !== 'string' || !sourceRef.ref.startsWith('docs/')) {
      errors.push(`${path}.ref must be a docs/ repo path for repo-doc refs`);
    }
    return;
  }

  requireNonEmptyString(errors, sourceRef.ref, `${path}.ref`);
}

function validateEvidenceRefs(errors, refs, path) {
  if (!Array.isArray(refs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  refs.forEach((ref, index) => {
    validateEvidenceRef(errors, ref, `${path}[${index}]`);
  });
}

function validateEvidenceRef(errors, ref, path) {
  if (!isPlainObject(ref)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, ref, path, EVIDENCE_REF_ALLOWED_FIELDS);
  requireEnum(errors, ref.kind, `${path}.kind`, EVIDENCE_REF_KIND_SET);
  requireNonEmptyString(errors, ref.ref, `${path}.ref`);

  if (ref.kind === 'repo-doc' && !ref.ref.startsWith('docs/')) {
    errors.push(`${path}.ref must be a docs/ repo path for repo-doc refs`);
  }

  if (ref.label !== undefined) {
    requireNonEmptyString(errors, ref.label, `${path}.label`);
  }
}

function validateBoundaries(errors, boundaries, path) {
  if (!isPlainObject(boundaries)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  for (const key of Object.keys(REVIEW_GATE_BOUNDARIES)) {
    if (!Object.hasOwn(boundaries, key)) {
      errors.push(`${path}.${key} is required`);
      continue;
    }

    if (key === 'controlledEventRegistrationAvailable') {
      if (typeof boundaries[key] !== 'boolean') {
        errors.push(`${path}.${key} must be boolean`);
      }
    } else {
      requireExact(errors, boundaries[key], `${path}.${key}`, false);
    }
  }
}

function validateDisabledCapabilities(errors, disabledCapabilities, path) {
  if (!Array.isArray(disabledCapabilities)) {
    errors.push(`${path} must be an array`);
    return;
  }

  for (const key of Object.keys(REVIEW_GATE_BOUNDARIES)) {
    if (REVIEW_GATE_BOUNDARIES[key] === false && !disabledCapabilities.includes(key)) {
      errors.push(`${path} must include ${key}`);
    }
  }
}

function validateNullableSourceContractName(errors, value, path) {
  if (value === null || value === undefined) {
    return;
  }

  requireSafeSourceContractName(errors, value, path);
}

function requireSafeSourceContractName(errors, value, path) {
  if (typeof value !== 'string' || !SOURCE_CONTRACT_NAME_PATTERN.test(value)) {
    errors.push(`${path} must be a source contract name ending in .v<version>`);
  }
}

function requireHash(errors, value, path) {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
    errors.push(`${path} must be a sha256 hash`);
  }
}

function requireSafeToken(errors, value, path) {
  if (typeof value !== 'string' || !SAFE_TOKEN_PATTERN.test(value)) {
    errors.push(`${path} must be a safe token`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function validateStringArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.trim() === '') {
      errors.push(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function requireEnum(errors, value, path, values) {
  if (!values.has(value)) {
    errors.push(`${path} must be one of ${[...values].join(', ')}`);
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireStringArrayIncludes(errors, value, path, expected) {
  if (!Array.isArray(value) || !value.includes(expected)) {
    errors.push(`${path} must include ${expected}`);
  }
}

function validateAllowedFields(errors, value, path, allowedFields) {
  if (!isPlainObject(value)) {
    return;
  }

  for (const field of Object.keys(value)) {
    if (!allowedFields.has(field)) {
      errors.push(`${path}.${field} is not allowed`);
    }
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
    return;
  }

  if (new Date(value).toISOString() !== value) {
    errors.push(`${path} must be a canonical ISO timestamp`);
  }
}

function appendPrefixedErrors(errors, result, prefix) {
  for (const error of result.errors ?? []) {
    errors.push(`${prefix}.${error}`);
  }
}

function invalidResult(error) {
  return {
    ok: false,
    errors: [error]
  };
}

function controlledEvidenceRefs(refs) {
  const result = [];

  for (const ref of safeArray(refs)) {
    if (!isPlainObject(ref)) {
      continue;
    }

    const normalized = {
      kind: EVIDENCE_REF_KIND_SET.has(ref.kind) ? ref.kind : 'repo-doc',
      ref: safeDisplayText(ref.ref) ?? null,
      label: safeDisplayText(ref.label) ?? undefined
    };

    if (normalized.ref !== null && !isUnsafeText(normalized.ref)) {
      result.push(normalized);
    }
  }

  return uniqueEvidenceRefs(result);
}

function safeSourceRef(sourceRef) {
  if (!isPlainObject(sourceRef) || !SOURCE_REF_KIND_SET.has(sourceRef.kind)) {
    return null;
  }

  const ref = safeDisplayText(sourceRef.ref);

  if (ref === null || isUnsafeText(ref)) {
    return null;
  }

  return {
    kind: sourceRef.kind,
    ref,
    ...(safeDisplayText(sourceRef.label) !== null ? { label: safeDisplayText(sourceRef.label) } : {})
  };
}

function safeContractName(value) {
  return typeof value === 'string' && SOURCE_CONTRACT_NAME_PATTERN.test(value) ? value : null;
}

function safeToken(value) {
  return typeof value === 'string' && SAFE_TOKEN_PATTERN.test(value) ? value : null;
}

function safeDisplayText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();

  if (normalized === '' || isUnsafeText(normalized)) {
    return null;
  }

  return normalized;
}

function safeStringArray(values) {
  return safeArray(values)
    .map((value) => safeDisplayText(value))
    .filter((value) => value !== null);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim() !== ''))];
}

function uniqueEvidenceRefs(refs) {
  const seen = new Set();
  const result = [];

  for (const ref of refs) {
    const key = `${ref.kind}:${ref.ref}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(ref);
  }

  return result;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function millisOrNow(value) {
  const millis = Date.parse(value);

  return Number.isFinite(millis) ? millis : Date.now();
}

function sha256(value) {
  return `sha256:${createHash('sha256').update(stableStringify(value)).digest('hex')}`;
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function isUnsafeText(value) {
  return typeof value === 'string' && UNSAFE_TEXT_PATTERN.test(value);
}

function findUnsafeFields(value, path, seen = new Set()) {
  const results = [];

  if (value === null || value === undefined) {
    return results;
  }

  if (typeof value === 'string') {
    if (isUnsafeText(value)) {
      results.push(path);
    }
    return results;
  }

  if (typeof value !== 'object') {
    return results;
  }

  if (seen.has(value)) {
    return results;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      results.push(...findUnsafeFields(item, `${path}[${index}]`, seen));
    });
    return results;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;

    if (RAW_FIELD_NAME_PATTERN.test(key)) {
      results.push(childPath);
      continue;
    }

    results.push(...findUnsafeFields(child, childPath, seen));
  }

  return results;
}
