import {
  CODEX_PROVIDER_RUN_RECORD_CONTRACT_NAME,
  validateCodexProviderRunRecordContract
} from './codex-provider-execution-contracts.js';

export const CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME = 'codexProviderRunRecovery.v1';
export const REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME = 'reviewerHandoffPreview.v1';
export const CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_VERSION = 1;

export const CODEX_PROVIDER_RUN_RECOVERY_BOUNDARIES = Object.freeze({
  providerExecutionAvailable: false,
  claudeCodeExecutionAvailable: false,
  providerParityAvailable: false,
  automaticReviewerVerdictAvailable: false,
  directGoalEventAppendAvailable: false,
  directTaskCompleteAvailable: false,
  reviewerMutationAvailable: false,
  mainVerificationMutationAvailable: false,
  releaseGateMutationAvailable: false,
  genericShellAvailable: false,
  arbitraryCommandExecutionAvailable: false,
  frontendLocalJsonlReadAvailable: false,
  localSessionFileReadAvailable: false,
  rawTranscriptAvailable: false,
  rawModelOutputAvailable: false,
  transcriptCompactAvailable: false,
  newThreadProductCapabilityAvailable: false,
  automaticWorktreeCreationAvailable: false,
  gitMutationAvailable: false,
  tagAutomationAvailable: false,
  publishAutomationAvailable: false,
  githubReleaseAutomationAvailable: false
});

export class CodexProviderRunRecoveryContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CodexProviderRunRecoveryContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildCodexProviderRunRecovery({
  generatedAt = new Date().toISOString(),
  runRecord,
  pendingResult = null,
  currentPreviewHash = null,
  goal = null,
  task = null
} = {}) {
  if (!isPlainObject(runRecord)) {
    throw new CodexProviderRunRecoveryContractError(
      'missing-codex-provider-run-record',
      'Codex provider run recovery requires a backend-owned run record.'
    );
  }

  const validation = validateCodexProviderRunRecordContract(runRecord);
  const unsafeRunRecord = validation.ok === false && validation.errors.some(isUnsafeValidationError);
  const hasResultIntakeRequest = isPlainObject(runRecord.resultIntakeRequest);
  const pendingResultRef = pendingResultRefFromContract(pendingResult);
  const effectiveCurrentPreviewHash = safeHash(currentPreviewHash) ?? safeHash(runRecord.previewHash);
  const stalePreviewHash = effectiveCurrentPreviewHash !== null &&
    safeHash(runRecord.previewHash) !== null &&
    effectiveCurrentPreviewHash !== runRecord.previewHash;
  const recoveryState = recoveryStateFrom({
    runRecord,
    pendingResultRef,
    hasResultIntakeRequest,
    unsafeRunRecord,
    stalePreviewHash
  });
  const blockedReasons = recoveryBlockedReasons({
    recoveryState,
    runRecord,
    pendingResultRef
  });
  const recovery = {
    contractName: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
    contractVersion: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    goal: goalForRecovery({ goal, runRecord }),
    task: taskForRecovery({ task, runRecord }),
    runId: safeToken(runRecord.runId) ?? 'missing-run-id',
    providerId: 'codex',
    role: 'worker',
    previewHash: safeHash(runRecord.previewHash) ?? null,
    taskPackHash: safeHash(runRecord.taskPackHash) ?? null,
    runStatus: runRecord.status === 'blocked' ? 'blocked' : 'completed',
    resultIntake: resultIntakeForRecovery({
      runRecord,
      pendingResultRef,
      hasResultIntakeRequest,
      recoveryState,
      stalePreviewHash,
      effectiveCurrentPreviewHash
    }),
    recoveryState,
    nextSafeAction: nextSafeActionForRecovery(recoveryState),
    blockedReasons,
    sourceContracts: sourceContractsForRecovery({
      runRecord,
      hasResultIntakeRequest,
      pendingResultRef
    }),
    boundaries: buildRunRecoveryBoundaries()
  };
  const recoveryValidation = validateCodexProviderRunRecoveryContract(recovery);

  if (!recoveryValidation.ok) {
    throw new CodexProviderRunRecoveryContractError(
      'invalid-built-codex-provider-run-recovery',
      'Built Codex provider run recovery contract is invalid.',
      { reason: recoveryValidation.errors[0] }
    );
  }

  return recovery;
}

export function buildReviewerHandoffPreview({
  generatedAt = new Date().toISOString(),
  recovery,
  pendingResult = null,
  reviewerTask = null
} = {}) {
  if (!isPlainObject(recovery)) {
    throw new CodexProviderRunRecoveryContractError(
      'missing-codex-provider-run-recovery',
      'Reviewer handoff preview requires a Codex provider run recovery contract.'
    );
  }

  const recoveryValidation = validateCodexProviderRunRecoveryContract(recovery);

  if (!recoveryValidation.ok) {
    throw new CodexProviderRunRecoveryContractError(
      'invalid-source-codex-provider-run-recovery',
      'Reviewer handoff preview source recovery contract is invalid.',
      { reason: recoveryValidation.errors[0] }
    );
  }

  const pendingResultRef = pendingResultRefFromContract(pendingResult);
  const pendingResultMatchesRecovery = pendingResultMatchesAcceptedRecovery({
    recovery,
    pendingResultRef
  });
  const ready = recovery.recoveryState === 'ready-for-reviewer-handoff' &&
    pendingResultRef?.state === 'available' &&
    pendingResultMatchesRecovery;
  const acceptedResultSummary = ready ? resultSummaryFromPendingResult(pendingResult) : null;
  const preview = {
    contractName: REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME,
    contractVersion: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    goal: goalForHandoff(recovery.goal),
    workerTask: workerTaskForHandoff({
      task: recovery.task,
      pendingResultRef,
      ready
    }),
    reviewerTask: reviewerTaskForHandoff({ reviewerTask, recovery }),
    pendingResultRef: pendingResultForRecoveryContract(pendingResultRef),
    acceptedResultSummary,
    handoffPack: ready
      ? handoffPackFromAcceptedSummary({
          summary: acceptedResultSummary,
          workerTask: recovery.task,
          reviewerTask
        })
      : null,
    copyOnly: true,
    willMutate: false,
    blockedReasons: reviewerHandoffBlockedReasons({
      recovery,
      pendingResultRef,
      pendingResultMatchesRecovery
    }),
    sourceContracts: sourceContractsForReviewerHandoff({ recovery, pendingResultRef }),
    boundaries: buildRunRecoveryBoundaries()
  };
  const previewValidation = validateReviewerHandoffPreviewContract(preview);

  if (!previewValidation.ok) {
    throw new CodexProviderRunRecoveryContractError(
      'invalid-built-reviewer-handoff-preview',
      'Built reviewer handoff preview contract is invalid.',
      { reason: previewValidation.errors[0] }
    );
  }

  return preview;
}

const RECOVERY_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'goal',
  'task',
  'runId',
  'providerId',
  'role',
  'previewHash',
  'taskPackHash',
  'runStatus',
  'resultIntake',
  'recoveryState',
  'nextSafeAction',
  'blockedReasons',
  'sourceContracts',
  'boundaries'
]);
const REVIEWER_HANDOFF_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'goal',
  'workerTask',
  'reviewerTask',
  'pendingResultRef',
  'acceptedResultSummary',
  'handoffPack',
  'copyOnly',
  'willMutate',
  'blockedReasons',
  'sourceContracts',
  'boundaries'
]);
const GOAL_ALLOWED_FIELDS = new Set(['goalId', 'title', 'state', 'sourceContract', 'sourceRef']);
const TASK_ALLOWED_FIELDS = new Set(['taskId', 'title', 'state', 'sourceContract', 'sourceRef']);
const RESULT_INTAKE_ALLOWED_FIELDS = new Set([
  'contractName',
  'requestId',
  'requestState',
  'previewHash',
  'planHash',
  'pendingResult',
  'blockedReasons',
  'sourceRef'
]);
const PENDING_RESULT_ALLOWED_FIELDS = new Set([
  'contractName',
  'state',
  'escrowRef',
  'blockedReasons',
  'sourceRef'
]);
const NEXT_SAFE_ACTION_ALLOWED_FIELDS = new Set(['actionId', 'label', 'copyOnly', 'willMutate']);
const SOURCE_CONTRACT_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'readOnly',
  'requiredFor',
  'previewHash',
  'sourceRef'
]);
const SOURCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label', 'generatedAt']);
const RESULT_SUMMARY_ALLOWED_FIELDS = new Set([
  'status',
  'summary',
  'changedFiles',
  'validationCommands',
  'risks',
  'blockers',
  'evidenceRefs',
  'blockerReason'
]);
const HANDOFF_PACK_ALLOWED_FIELDS = new Set([
  'title',
  'body',
  'workerEvidenceRefs',
  'changedFiles',
  'validationCommands',
  'risks',
  'blockers'
]);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label']);

const GOAL_STATE_SET = new Set(['active', 'ready', 'blocked', 'pending', 'missing', 'accepted']);
const REF_KIND_SET = new Set(['contract', 'fixture', 'docs', 'route', 'run-record']);
const EVIDENCE_REF_KIND_SET = new Set(['repo-doc', 'artifact-ref', 'commit', 'command-evidence', 'external-note']);
const RUN_STATUS_SET = new Set(['completed', 'blocked']);
const RECOVERY_STATE_SET = new Set([
  'ready-for-reviewer-handoff',
  'blocked-provider-result',
  'missing-result-intake',
  'stale-preview-hash',
  'unsafe-provider-output',
  'pending-result-intake'
]);
const RESULT_INTAKE_STATE_SET = new Set(['accepted', 'blocked', 'missing', 'stale', 'unsafe', 'pending']);
const PENDING_RESULT_STATE_SET = new Set(['available', 'blocked', 'consumed', 'superseded']);
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const COMMIT_PATTERN = /^[a-f0-9]{7,64}$/u;
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const SOURCE_CONTRACT_NAME_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const RAW_FIELD_NAME_PATTERN =
  /^(?:rawTranscript|transcript|rawModelOutput|rawOutput|providerOutput|sessionLog|messages|conversation)$/iu;
const UNSAFE_TEXT_PATTERN =
  /\b(?:raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log|session[\s_-]*file|model[\s_-]*output|provider[\s_-]*parity)\b|(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\.jsonl(?:$|[/\s])|\/api\/(?:providers?|provider-parity|child(?:-dispatch)?|dispatch)(?:$|[/\s])|\/(?:event-append|append-event|event-plan-confirm|confirm-event-plan|confirm-goal-event-plan|goal-event-confirm|record-result|mark-complete|complete-task|git|tag|publish|release)(?:$|[/\s])|\b(?:launch\s+claude\s+code|run\s+any\s+provider|run\s+shell|terminal|append\s+event|mark\s+complete|confirm\s+goal\s+event\s+plan|event\s+plan\s+confirm|confirm\s+reviewer\s+verdict|confirm\s+main\s+gate|confirm\s+release\s+gate|record\s+result|git\s+(?:push|tag|checkout|merge|commit)|gh\s+release|tag\s+creation|github\s+release|publish\s+release)\b/iu;
const LOCAL_HIDDEN_PATH_SEGMENTS = new Set(['.codex', '.claude', '.git', '.symphony']);

export function validateCodexProviderRunRecoveryContract(recovery) {
  const errors = [];

  if (!isPlainObject(recovery)) {
    return invalidResult('recovery must be a plain object');
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'generatedAt',
    'goal',
    'task',
    'runId',
    'providerId',
    'role',
    'previewHash',
    'taskPackHash',
    'runStatus',
    'resultIntake',
    'recoveryState',
    'nextSafeAction',
    'blockedReasons',
    'sourceContracts',
    'boundaries'
  ]) {
    if (!Object.hasOwn(recovery, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, recovery, 'recovery', RECOVERY_ALLOWED_FIELDS);
  requireExact(errors, recovery.contractName, 'contractName', CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME);
  requireExact(errors, recovery.contractVersion, 'contractVersion', CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_VERSION);
  requireIsoTimestamp(errors, recovery.generatedAt, 'generatedAt');
  validateGoal(errors, recovery.goal, 'goal');
  validateTask(errors, recovery.task, 'task');
  requireSafeToken(errors, recovery.runId, 'runId');
  requireExact(errors, recovery.providerId, 'providerId', 'codex');
  requireExact(errors, recovery.role, 'role', 'worker');
  requireHash(errors, recovery.previewHash, 'previewHash');
  requireHash(errors, recovery.taskPackHash, 'taskPackHash');
  requireEnum(errors, recovery.runStatus, 'runStatus', RUN_STATUS_SET);
  validateResultIntake(errors, recovery.resultIntake, 'resultIntake', recovery.previewHash);
  requireEnum(errors, recovery.recoveryState, 'recoveryState', RECOVERY_STATE_SET);
  validateNextSafeAction(errors, recovery.nextSafeAction, 'nextSafeAction');
  validateStringArray(errors, recovery.blockedReasons, 'blockedReasons');
  validateSourceContracts(errors, recovery.sourceContracts, 'sourceContracts');
  validateBoundaries(errors, recovery.boundaries, 'boundaries');
  validateRecoveryStateBinding(errors, recovery);

  for (const field of findUnsafeFields(recovery, 'recovery')) {
    errors.push(`${field} must not contain raw provider output, local session refs, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertCodexProviderRunRecoveryContract(recovery) {
  const result = validateCodexProviderRunRecoveryContract(recovery);

  if (!result.ok) {
    throw new CodexProviderRunRecoveryContractError(
      'invalid-codex-provider-run-recovery',
      'Codex provider run recovery contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return recovery;
}

export function validateReviewerHandoffPreviewContract(preview) {
  const errors = [];

  if (!isPlainObject(preview)) {
    return invalidResult('preview must be a plain object');
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'generatedAt',
    'goal',
    'workerTask',
    'reviewerTask',
    'pendingResultRef',
    'acceptedResultSummary',
    'handoffPack',
    'copyOnly',
    'willMutate',
    'blockedReasons',
    'sourceContracts',
    'boundaries'
  ]) {
    if (!Object.hasOwn(preview, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, preview, 'preview', REVIEWER_HANDOFF_ALLOWED_FIELDS);
  requireExact(errors, preview.contractName, 'contractName', REVIEWER_HANDOFF_PREVIEW_CONTRACT_NAME);
  requireExact(errors, preview.contractVersion, 'contractVersion', CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_VERSION);
  requireIsoTimestamp(errors, preview.generatedAt, 'generatedAt');
  validateGoal(errors, preview.goal, 'goal');
  validateTask(errors, preview.workerTask, 'workerTask');
  validateTask(errors, preview.reviewerTask, 'reviewerTask');
  validateNullablePendingResult(errors, preview.pendingResultRef, 'pendingResultRef');
  validateNullableResultSummary(errors, preview.acceptedResultSummary, 'acceptedResultSummary', preview.blockedReasons);
  validateNullableHandoffPack(errors, preview.handoffPack, 'handoffPack', preview.blockedReasons);
  requireExact(errors, preview.copyOnly, 'copyOnly', true);
  requireExact(errors, preview.willMutate, 'willMutate', false);
  validateStringArray(errors, preview.blockedReasons, 'blockedReasons');
  validateSourceContracts(errors, preview.sourceContracts, 'sourceContracts');
  validateBoundaries(errors, preview.boundaries, 'boundaries');
  validateReviewerHandoffBinding(errors, preview);

  for (const field of findUnsafeFields(preview, 'preview')) {
    errors.push(`${field} must not contain raw provider output, local session refs, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertReviewerHandoffPreviewContract(preview) {
  const result = validateReviewerHandoffPreviewContract(preview);

  if (!result.ok) {
    throw new CodexProviderRunRecoveryContractError(
      'invalid-reviewer-handoff-preview',
      'Reviewer handoff preview contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return preview;
}

function recoveryStateFrom({
  runRecord,
  pendingResultRef,
  hasResultIntakeRequest,
  unsafeRunRecord,
  stalePreviewHash
}) {
  if (unsafeRunRecord) {
    return 'unsafe-provider-output';
  }

  if (!hasResultIntakeRequest) {
    return 'missing-result-intake';
  }

  if (stalePreviewHash) {
    return 'stale-preview-hash';
  }

  if (runRecord.status === 'blocked' && pendingResultRef?.state === 'blocked') {
    return 'blocked-provider-result';
  }

  if (runRecord.status === 'completed' && pendingResultRef?.state === 'available') {
    return 'ready-for-reviewer-handoff';
  }

  return 'pending-result-intake';
}

function recoveryBlockedReasons({
  recoveryState,
  runRecord,
  pendingResultRef
}) {
  if (recoveryState === 'ready-for-reviewer-handoff') {
    return [];
  }

  if (recoveryState === 'blocked-provider-result') {
    return [
      'provider-run-blocked',
      'pending-result-blocked'
    ];
  }

  if (recoveryState === 'missing-result-intake') {
    return ['missing-result-intake-request'];
  }

  if (recoveryState === 'stale-preview-hash') {
    return ['stale-preview-hash'];
  }

  if (recoveryState === 'unsafe-provider-output') {
    return ['unsafe-provider-output'];
  }

  return uniqueStrings([
    'pending-result-intake',
    ...(runRecord.status === 'blocked' ? ['provider-run-blocked'] : []),
    ...(pendingResultRef?.state === 'blocked' ? ['pending-result-blocked'] : [])
  ]);
}

function resultIntakeForRecovery({
  runRecord,
  pendingResultRef,
  hasResultIntakeRequest,
  recoveryState,
  stalePreviewHash,
  effectiveCurrentPreviewHash
}) {
  const requestState = resultIntakeStateForRecovery({ recoveryState, pendingResultRef });

  return {
    contractName: 'resultIntakeRequest.v1',
    requestId: `result-intake:${safeToken(runRecord.goalId) ?? 'missing-goal'}:${safeToken(runRecord.taskId) ?? 'missing-task'}:${safeToken(runRecord.runId) ?? 'missing-run'}`,
    requestState,
    previewHash: hasResultIntakeRequest
      ? (stalePreviewHash ? effectiveCurrentPreviewHash : safeHash(runRecord.previewHash))
      : null,
    planHash: safeHash(pendingResultRef?.previewPlanHash),
    pendingResult: pendingResultForRecoveryContract(pendingResultRef),
    blockedReasons: resultIntakeBlockedReasonsForRecovery({ recoveryState, pendingResultRef }),
    sourceRef: {
      kind: 'contract',
      ref: 'resultIntakeRequest.v1'
    }
  };
}

function resultIntakeStateForRecovery({
  recoveryState,
  pendingResultRef
}) {
  if (recoveryState === 'ready-for-reviewer-handoff') {
    return 'accepted';
  }

  if (recoveryState === 'blocked-provider-result') {
    return 'blocked';
  }

  if (recoveryState === 'missing-result-intake') {
    return 'missing';
  }

  if (recoveryState === 'stale-preview-hash') {
    return 'stale';
  }

  if (recoveryState === 'unsafe-provider-output') {
    return 'unsafe';
  }

  if (pendingResultRef?.state === 'blocked') {
    return 'blocked';
  }

  return 'pending';
}

function resultIntakeBlockedReasonsForRecovery({
  recoveryState,
  pendingResultRef
}) {
  if (recoveryState === 'ready-for-reviewer-handoff') {
    return [];
  }

  if (recoveryState === 'blocked-provider-result') {
    return ['pending-result-blocked'];
  }

  if (recoveryState === 'missing-result-intake') {
    return ['missing-result-intake-request'];
  }

  if (recoveryState === 'stale-preview-hash') {
    return ['stale-preview-hash'];
  }

  if (recoveryState === 'unsafe-provider-output') {
    return ['unsafe-provider-output'];
  }

  return uniqueStrings([
    'pending-result-intake',
    ...safeStringArray(pendingResultRef?.blockedReasons)
  ]);
}

function pendingResultRefFromContract(pendingResult) {
  if (!isPlainObject(pendingResult) || pendingResult.contractName !== 'pendingResult.v1') {
    return null;
  }

  const state = PENDING_RESULT_STATE_SET.has(pendingResult.state)
    ? pendingResult.state
    : 'blocked';
  const sourceContract = Array.isArray(pendingResult.sourceContracts)
    ? pendingResult.sourceContracts.find((contract) => isPlainObject(contract) && safeHash(contract.previewPlanHash) !== null)
    : null;

  return {
    contractName: 'pendingResult.v1',
    state,
    escrowRef: safeDisplayText(pendingResult.escrowRef) ?? `pending-result:${safeToken(pendingResult.goalId) ?? 'missing-goal'}:${safeToken(pendingResult.taskId) ?? 'missing-task'}`,
    previewPlanHash: safeHash(sourceContract?.previewPlanHash),
    blockedReasons: safeStringArray(pendingResult.blockedReasons),
    sourceRef: {
      kind: 'contract',
      ref: 'pendingResult.v1'
    }
  };
}

function pendingResultForRecoveryContract(pendingResultRef) {
  if (pendingResultRef === null) {
    return null;
  }

  return {
    contractName: 'pendingResult.v1',
    state: pendingResultRef.state,
    escrowRef: pendingResultRef.escrowRef,
    blockedReasons: pendingResultRef.blockedReasons,
    sourceRef: {
      kind: 'contract',
      ref: 'pendingResult.v1'
    }
  };
}

function nextSafeActionForRecovery(recoveryState) {
  const actions = {
    'ready-for-reviewer-handoff': {
      actionId: 'copy-reviewer-handoff',
      label: 'Copy reviewer handoff after accepted pending result',
      copyOnly: true,
      willMutate: false
    },
    'blocked-provider-result': {
      actionId: 'review-provider-blocker',
      label: 'Review provider blocker before reviewer handoff',
      copyOnly: true,
      willMutate: false
    },
    'missing-result-intake': {
      actionId: 'open-result-intake-preview',
      label: 'Open result intake preview for sanitized run result',
      copyOnly: true,
      willMutate: false
    },
    'stale-preview-hash': {
      actionId: 'refresh-codex-preview',
      label: 'Refresh Codex provider preview before recovery',
      copyOnly: true,
      willMutate: false
    },
    'unsafe-provider-output': {
      actionId: 'reject-unsafe-run-record',
      label: 'Reject unsafe run record and request sanitized evidence',
      copyOnly: true,
      willMutate: false
    },
    'pending-result-intake': {
      actionId: 'wait-result-intake',
      label: 'Wait for result intake acceptance before reviewer handoff',
      copyOnly: true,
      willMutate: false
    }
  };

  return actions[recoveryState] ?? actions['pending-result-intake'];
}

function goalForRecovery({ goal, runRecord }) {
  const source = isPlainObject(goal) ? goal : {};
  const goalId = safeToken(source.goalId) ?? safeToken(runRecord.goalId) ?? 'missing-goal';

  return {
    goalId,
    title: safeDisplayText(source.title) ?? safeDisplayText(runRecord.goalTitle) ?? goalId,
    state: GOAL_STATE_SET.has(source.state) ? source.state : 'active',
    sourceContract: safeContractName(source.sourceContract) ?? CODEX_PROVIDER_RUN_RECORD_CONTRACT_NAME,
    sourceRef: safeSourceRef(source.sourceRef) ?? {
      kind: 'run-record',
      ref: safeToken(runRecord.runId) ?? 'missing-run'
    }
  };
}

function taskForRecovery({ task, runRecord }) {
  const source = isPlainObject(task) ? task : {};
  const taskId = safeToken(source.taskId) ?? safeToken(runRecord.taskId) ?? 'missing-task';

  return {
    taskId,
    title: safeDisplayText(source.title) ?? safeDisplayText(runRecord.taskTitle) ?? taskId,
    state: GOAL_STATE_SET.has(source.state) ? source.state : 'active',
    sourceContract: safeContractName(source.sourceContract) ?? CODEX_PROVIDER_RUN_RECORD_CONTRACT_NAME,
    sourceRef: safeSourceRef(source.sourceRef) ?? {
      kind: 'run-record',
      ref: safeToken(runRecord.runId) ?? 'missing-run'
    }
  };
}

function sourceContractsForRecovery({
  runRecord,
  hasResultIntakeRequest,
  pendingResultRef
}) {
  return [
    {
      contractName: CODEX_PROVIDER_RUN_RECORD_CONTRACT_NAME,
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['run-id', 'preview-hash', 'task-pack-hash'],
      previewHash: safeHash(runRecord.previewHash) ?? undefined,
      sourceRef: {
        kind: 'run-record',
        ref: safeToken(runRecord.runId) ?? 'missing-run'
      }
    },
    hasResultIntakeRequest
      ? {
          contractName: 'resultIntakeRequest.v1',
          contractVersion: 1,
          readOnly: true,
          requiredFor: ['result-intake-state'],
          sourceRef: {
            kind: 'contract',
            ref: 'resultIntakeRequest.v1'
          }
        }
      : null,
    pendingResultRef === null
      ? null
      : {
          contractName: 'pendingResult.v1',
          contractVersion: 1,
          readOnly: true,
          requiredFor: ['pending-result-state'],
          sourceRef: {
            kind: 'contract',
            ref: 'pendingResult.v1'
          }
        }
  ].filter((contract) => contract !== null);
}

function buildRunRecoveryBoundaries() {
  return { ...CODEX_PROVIDER_RUN_RECOVERY_BOUNDARIES };
}

function goalForHandoff(goal) {
  const source = isPlainObject(goal) ? goal : {};
  const goalId = safeToken(source.goalId) ?? 'missing-goal';

  return {
    goalId,
    title: safeDisplayText(source.title) ?? goalId,
    state: GOAL_STATE_SET.has(source.state) ? source.state : 'active',
    sourceContract: safeContractName(source.sourceContract) ?? CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
    sourceRef: safeSourceRef(source.sourceRef) ?? {
      kind: 'contract',
      ref: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME
    }
  };
}

function workerTaskForHandoff({
  task,
  pendingResultRef,
  ready
}) {
  const source = isPlainObject(task) ? task : {};
  const taskId = safeToken(source.taskId) ?? 'missing-task';

  return {
    taskId,
    title: safeDisplayText(source.title) ?? taskId,
    state: ready ? 'accepted' : (GOAL_STATE_SET.has(source.state) ? source.state : 'pending'),
    sourceContract: ready ? 'pendingResult.v1' : CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
    sourceRef: pendingResultRef === null
      ? {
          kind: 'contract',
          ref: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME
        }
      : {
          kind: 'contract',
          ref: 'pendingResult.v1'
        }
  };
}

function reviewerTaskForHandoff({
  reviewerTask,
  recovery
}) {
  const source = isPlainObject(reviewerTask) ? reviewerTask : {};
  const workerTaskId = safeToken(recovery.task?.taskId) ?? 'missing-task';
  const taskId = safeToken(source.taskId) ?? `${workerTaskId}-readonly-review`;
  const workerTitle = safeDisplayText(recovery.task?.title) ?? workerTaskId;

  return {
    taskId,
    title: safeDisplayText(source.title) ?? `Review ${workerTitle}`,
    state: GOAL_STATE_SET.has(source.state) ? source.state : 'pending',
    sourceContract: safeContractName(source.sourceContract) ?? 'childTaskPack.v1',
    sourceRef: safeSourceRef(source.sourceRef) ?? {
      kind: 'contract',
      ref: 'childTaskPack.v1'
    }
  };
}

function resultSummaryFromPendingResult(pendingResult) {
  const sanitizedSummary = isPlainObject(pendingResult?.sanitizedSummary)
    ? pendingResult.sanitizedSummary
    : {};
  const evidenceRefs = controlledEvidenceRefs([
    ...safeArray(sanitizedSummary.evidenceRefs),
    ...safeArray(pendingResult?.evidenceRefs)
  ]);
  const summary = {
    status: safeDisplayText(sanitizedSummary.status) ?? 'completed',
    summary: safeDisplayText(sanitizedSummary.summary) ?? 'Pending result accepted with sanitized evidence.',
    changedFiles: safeStringArray(sanitizedSummary.changedFiles),
    validationCommands: safeStringArray(sanitizedSummary.validationCommands),
    risks: safeStringArray(sanitizedSummary.risks),
    blockers: safeStringArray(sanitizedSummary.blockers),
    evidenceRefs
  };
  const blockerReason = safeDisplayText(sanitizedSummary.blockerReason);

  return blockerReason === null
    ? summary
    : {
        ...summary,
        blockerReason
      };
}

function handoffPackFromAcceptedSummary({
  summary,
  workerTask,
  reviewerTask
}) {
  const workerTitle = safeDisplayText(workerTask?.title) ?? safeToken(workerTask?.taskId) ?? 'accepted worker result';

  return {
    title: safeDisplayText(reviewerTask?.handoffTitle) ?? `Review ${workerTitle}`,
    body: safeDisplayText(reviewerTask?.handoffBody) ??
      'Review the accepted pending result, recovery state, changed files, validation commands, risks, and blockers. This preview is copy-only and does not create a reviewer verdict.',
    workerEvidenceRefs: controlledEvidenceRefs(summary.evidenceRefs),
    changedFiles: safeStringArray(summary.changedFiles),
    validationCommands: safeStringArray(summary.validationCommands),
    risks: safeStringArray(summary.risks),
    blockers: safeStringArray(summary.blockers)
  };
}

function reviewerHandoffBlockedReasons({
  recovery,
  pendingResultRef,
  pendingResultMatchesRecovery
}) {
  if (recovery.recoveryState === 'ready-for-reviewer-handoff' &&
      pendingResultRef?.state === 'available' &&
      pendingResultMatchesRecovery) {
    return [];
  }

  return uniqueStrings([
    ...safeStringArray(recovery.blockedReasons),
    ...(recovery.recoveryState === 'ready-for-reviewer-handoff' ? [] : [recovery.recoveryState]),
    ...(recovery.recoveryState === 'ready-for-reviewer-handoff' &&
        pendingResultRef?.state === 'available' &&
        !pendingResultMatchesRecovery
      ? ['pending-result-mismatch']
      : []),
    ...(pendingResultRef?.state === 'blocked' ? ['pending-result-blocked'] : []),
    ...(pendingResultRef?.state === 'consumed' ? ['pending-result-consumed'] : []),
    ...(pendingResultRef?.state === 'superseded' ? ['pending-result-superseded'] : []),
    ...(pendingResultRef?.state === 'available' ? [] : ['pending-result-not-accepted'])
  ]);
}

function pendingResultMatchesAcceptedRecovery({
  recovery,
  pendingResultRef
}) {
  const accepted = recovery.resultIntake?.pendingResult;

  return recovery.recoveryState === 'ready-for-reviewer-handoff' &&
    isPlainObject(accepted) &&
    pendingResultRef !== null &&
    accepted.contractName === pendingResultRef.contractName &&
    accepted.state === pendingResultRef.state &&
    accepted.escrowRef === pendingResultRef.escrowRef;
}

function sourceContractsForReviewerHandoff({
  recovery,
  pendingResultRef
}) {
  return [
    {
      contractName: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME,
      contractVersion: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_VERSION,
      readOnly: true,
      requiredFor: ['recovery-state', 'pending-result-linkage'],
      sourceRef: {
        kind: 'contract',
        ref: CODEX_PROVIDER_RUN_RECOVERY_CONTRACT_NAME
      }
    },
    pendingResultRef === null
      ? null
      : {
          contractName: 'pendingResult.v1',
          contractVersion: 1,
          readOnly: true,
          requiredFor: ['accepted-result-summary'],
          sourceRef: {
            kind: 'contract',
            ref: 'pendingResult.v1'
          }
        }
  ].filter((contract) => contract !== null);
}

function controlledEvidenceRefs(refs) {
  const byKey = new Map();

  for (const ref of safeArray(refs)) {
    const controlled = controlledEvidenceRef(ref);

    if (controlled !== null) {
      byKey.set(`${controlled.kind}:${controlled.ref}`, controlled);
    }
  }

  return [...byKey.values()];
}

function controlledEvidenceRef(ref) {
  if (!isPlainObject(ref)) {
    return null;
  }

  const controlled = {
    kind: ref.kind,
    ref: safeDisplayText(ref.ref),
    label: safeDisplayText(ref.label)
  };

  return isControlledEvidenceRef(controlled) ? controlled : null;
}

function validateRecoveryStateBinding(errors, recovery) {
  if (!Array.isArray(recovery.blockedReasons) || !isPlainObject(recovery.resultIntake)) {
    return;
  }

  if (recovery.recoveryState === 'ready-for-reviewer-handoff') {
    requireExact(errors, recovery.blockedReasons.length, 'blockedReasons.length', 0);
    requireExact(errors, recovery.resultIntake.requestState, 'resultIntake.requestState', 'accepted');
    requireExact(errors, recovery.resultIntake.pendingResult?.contractName, 'resultIntake.pendingResult.contractName', 'pendingResult.v1');
    requireExact(errors, recovery.resultIntake.pendingResult?.state, 'resultIntake.pendingResult.state', 'available');
  }

  if (recovery.recoveryState === 'blocked-provider-result') {
    requireStringArrayIncludes(errors, recovery.blockedReasons, 'blockedReasons', 'provider-run-blocked');
    requireStringArrayIncludes(errors, recovery.blockedReasons, 'blockedReasons', 'pending-result-blocked');
    requireExact(errors, recovery.runStatus, 'runStatus', 'blocked');
    requireExact(errors, recovery.resultIntake.pendingResult?.state, 'resultIntake.pendingResult.state', 'blocked');
  }

  if (recovery.recoveryState === 'missing-result-intake') {
    requireStringArrayIncludes(errors, recovery.blockedReasons, 'blockedReasons', 'missing-result-intake-request');
    requireExact(errors, recovery.resultIntake.requestState, 'resultIntake.requestState', 'missing');
  }

  if (recovery.recoveryState === 'stale-preview-hash') {
    requireStringArrayIncludes(errors, recovery.blockedReasons, 'blockedReasons', 'stale-preview-hash');

    if (recovery.resultIntake.previewHash === recovery.previewHash) {
      errors.push('resultIntake.previewHash must differ from previewHash for stale-preview-hash recovery');
    }
  }

  if (recovery.recoveryState === 'unsafe-provider-output') {
    requireStringArrayIncludes(errors, recovery.blockedReasons, 'blockedReasons', 'unsafe-provider-output');
  }
}

function validateReviewerHandoffBinding(errors, preview) {
  const blockedReasons = Array.isArray(preview.blockedReasons) ? preview.blockedReasons : [];

  if (blockedReasons.length === 0) {
    requireExact(errors, preview.pendingResultRef?.contractName, 'pendingResultRef.contractName', 'pendingResult.v1');
    requireExact(errors, preview.pendingResultRef?.state, 'pendingResultRef.state', 'available');

    if (!isPlainObject(preview.acceptedResultSummary)) {
      errors.push('acceptedResultSummary must be available when handoff is ready');
    }

    if (!isPlainObject(preview.handoffPack)) {
      errors.push('handoffPack must be available when handoff is ready');
    }
    return;
  }

  if (preview.acceptedResultSummary !== null) {
    errors.push('acceptedResultSummary must be null when handoff is blocked');
  }

  if (preview.handoffPack !== null) {
    errors.push('handoffPack must be null when handoff is blocked');
  }

  if (preview.pendingResultRef === null) {
    requireStringArrayIncludes(errors, blockedReasons, 'blockedReasons', 'pending-result-not-accepted');
    return;
  }

  if (blockedReasons.includes('pending-result-not-accepted')) {
    if (preview.pendingResultRef.state === 'available') {
      errors.push('pendingResultRef.state must not be available before intake acceptance');
    }
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

  if (goal.sourceRef !== undefined) {
    validateSourceRef(errors, goal.sourceRef, `${path}.sourceRef`);
  }
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

  if (task.sourceRef !== undefined) {
    validateSourceRef(errors, task.sourceRef, `${path}.sourceRef`);
  }
}

function validateResultIntake(errors, resultIntake, path, previewHash) {
  if (!isPlainObject(resultIntake)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, resultIntake, path, RESULT_INTAKE_ALLOWED_FIELDS);
  requireExact(errors, resultIntake.contractName, `${path}.contractName`, 'resultIntakeRequest.v1');
  requireSafeToken(errors, resultIntake.requestId, `${path}.requestId`);
  requireEnum(errors, resultIntake.requestState, `${path}.requestState`, RESULT_INTAKE_STATE_SET);

  if (resultIntake.previewHash !== null) {
    requireHash(errors, resultIntake.previewHash, `${path}.previewHash`);
  }

  if (resultIntake.planHash !== null) {
    requireHash(errors, resultIntake.planHash, `${path}.planHash`);
  }

  validateNullablePendingResult(errors, resultIntake.pendingResult, `${path}.pendingResult`);
  validateStringArray(errors, resultIntake.blockedReasons, `${path}.blockedReasons`);

  if (resultIntake.sourceRef !== undefined) {
    validateSourceRef(errors, resultIntake.sourceRef, `${path}.sourceRef`);
  }

  if (resultIntake.previewHash !== null && HASH_PATTERN.test(resultIntake.previewHash) && resultIntake.previewHash !== previewHash) {
    requireStringArrayIncludes(errors, resultIntake.blockedReasons, `${path}.blockedReasons`, 'stale-preview-hash');
  }

  if (resultIntake.requestState === 'accepted') {
    requireExact(errors, resultIntake.pendingResult?.contractName, `${path}.pendingResult.contractName`, 'pendingResult.v1');
  }

  if (resultIntake.requestState === 'missing') {
    requireExact(errors, resultIntake.pendingResult, `${path}.pendingResult`, null);
  }
}

function validateNullablePendingResult(errors, pendingResult, path) {
  if (pendingResult === null) {
    return;
  }

  if (!isPlainObject(pendingResult)) {
    errors.push(`${path} must be a plain object or null`);
    return;
  }

  validateAllowedFields(errors, pendingResult, path, PENDING_RESULT_ALLOWED_FIELDS);
  requireExact(errors, pendingResult.contractName, `${path}.contractName`, 'pendingResult.v1');
  requireEnum(errors, pendingResult.state, `${path}.state`, PENDING_RESULT_STATE_SET);
  requireNonEmptyString(errors, pendingResult.escrowRef, `${path}.escrowRef`);
  validateStringArray(errors, pendingResult.blockedReasons, `${path}.blockedReasons`);

  if (pendingResult.sourceRef !== undefined) {
    validateSourceRef(errors, pendingResult.sourceRef, `${path}.sourceRef`);
  }
}

function validateNextSafeAction(errors, nextSafeAction, path) {
  if (!isPlainObject(nextSafeAction)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, nextSafeAction, path, NEXT_SAFE_ACTION_ALLOWED_FIELDS);
  requireSafeToken(errors, nextSafeAction.actionId, `${path}.actionId`);
  requireNonEmptyString(errors, nextSafeAction.label, `${path}.label`);

  if (nextSafeAction.copyOnly !== undefined) {
    requireBoolean(errors, nextSafeAction.copyOnly, `${path}.copyOnly`);
  }

  requireExact(errors, nextSafeAction.willMutate, `${path}.willMutate`, false);
}

function validateNullableResultSummary(errors, summary, path, blockedReasons) {
  if (summary === null) {
    if (Array.isArray(blockedReasons) && blockedReasons.length === 0) {
      errors.push(`${path} must be a plain object when handoff is ready`);
    }
    return;
  }

  if (!isPlainObject(summary)) {
    errors.push(`${path} must be a plain object or null`);
    return;
  }

  validateAllowedFields(errors, summary, path, RESULT_SUMMARY_ALLOWED_FIELDS);
  requireNonEmptyString(errors, summary.status, `${path}.status`);
  requireNonEmptyString(errors, summary.summary, `${path}.summary`);
  validateRepoPathArray(errors, summary.changedFiles, `${path}.changedFiles`);
  validateStringArray(errors, summary.validationCommands, `${path}.validationCommands`);
  validateStringArray(errors, summary.risks, `${path}.risks`);
  validateStringArray(errors, summary.blockers, `${path}.blockers`);
  validateEvidenceRefs(errors, summary.evidenceRefs, `${path}.evidenceRefs`, { requireNonEmpty: true });

  if (summary.blockerReason !== undefined) {
    requireNonEmptyString(errors, summary.blockerReason, `${path}.blockerReason`);
  }
}

function validateNullableHandoffPack(errors, handoffPack, path, blockedReasons) {
  if (handoffPack === null) {
    if (Array.isArray(blockedReasons) && blockedReasons.length === 0) {
      errors.push(`${path} must be a plain object when handoff is ready`);
    }
    return;
  }

  if (!isPlainObject(handoffPack)) {
    errors.push(`${path} must be a plain object or null`);
    return;
  }

  validateAllowedFields(errors, handoffPack, path, HANDOFF_PACK_ALLOWED_FIELDS);
  requireNonEmptyString(errors, handoffPack.title, `${path}.title`);
  requireNonEmptyString(errors, handoffPack.body, `${path}.body`);
  validateEvidenceRefs(errors, handoffPack.workerEvidenceRefs, `${path}.workerEvidenceRefs`, {
    requireNonEmpty: true
  });
  validateRepoPathArray(errors, handoffPack.changedFiles, `${path}.changedFiles`);
  validateStringArray(errors, handoffPack.validationCommands, `${path}.validationCommands`);
  validateStringArray(errors, handoffPack.risks, `${path}.risks`);
  validateStringArray(errors, handoffPack.blockers, `${path}.blockers`);
}

function validateSourceContracts(errors, sourceContracts, path) {
  if (!Array.isArray(sourceContracts) || sourceContracts.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  sourceContracts.forEach((sourceContract, index) => {
    const sourcePath = `${path}[${index}]`;

    if (!isPlainObject(sourceContract)) {
      errors.push(`${sourcePath} must be a plain object`);
      return;
    }

    validateAllowedFields(errors, sourceContract, sourcePath, SOURCE_CONTRACT_ALLOWED_FIELDS);
    requireSafeSourceContractName(errors, sourceContract.contractName, `${sourcePath}.contractName`);

    if (sourceContract.contractVersion !== undefined && !Number.isInteger(sourceContract.contractVersion)) {
      errors.push(`${sourcePath}.contractVersion must be an integer`);
    }

    if (sourceContract.readOnly !== undefined) {
      requireExact(errors, sourceContract.readOnly, `${sourcePath}.readOnly`, true);
    }

    if (sourceContract.requiredFor !== undefined) {
      validateStringArray(errors, sourceContract.requiredFor, `${sourcePath}.requiredFor`);
    }

    if (sourceContract.previewHash !== undefined) {
      requireHash(errors, sourceContract.previewHash, `${sourcePath}.previewHash`);
    }

    if (sourceContract.sourceRef !== undefined) {
      validateSourceRef(errors, sourceContract.sourceRef, `${sourcePath}.sourceRef`);
    }
  });
}

function validateSourceRef(errors, sourceRef, path) {
  if (!isPlainObject(sourceRef)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, sourceRef, path, SOURCE_REF_ALLOWED_FIELDS);
  requireEnum(errors, sourceRef.kind, `${path}.kind`, REF_KIND_SET);
  requireNonEmptyString(errors, sourceRef.ref, `${path}.ref`);
  validateSourceRefRef(errors, sourceRef, path);

  if (sourceRef.label !== undefined) {
    requireNonEmptyString(errors, sourceRef.label, `${path}.label`);
  }

  if (sourceRef.generatedAt !== undefined) {
    requireIsoTimestamp(errors, sourceRef.generatedAt, `${path}.generatedAt`);
  }
}

function validateSourceRefRef(errors, sourceRef, path) {
  if (typeof sourceRef.ref !== 'string') {
    return;
  }

  const ref = sourceRef.ref.trim();

  if (isUnsafeText(ref) || containsUnsafePathSegment(ref)) {
    errors.push(`${path}.ref must not contain raw provider output, local session refs, or direct mutation routes`);
    return;
  }

  if (sourceRef.kind !== 'route' && (ref.startsWith('/') || ref.startsWith('~') || /^[a-z]:[\\/]/iu.test(ref))) {
    errors.push(`${path}.ref must not contain raw provider output, local session refs, or direct mutation routes`);
    return;
  }

  if (sourceRef.kind === 'route') {
    if (!isControlledRouteRef(ref)) {
      errors.push(`${path}.ref must be a controlled route ref`);
    }
    return;
  }

  if (sourceRef.kind === 'contract') {
    if (!SOURCE_CONTRACT_NAME_PATTERN.test(ref)) {
      errors.push(`${path}.ref must be a safe contract ref`);
    }
    return;
  }

  if (sourceRef.kind === 'fixture' && (!isSafeRepoRelativePath(ref) || !ref.startsWith('fixtures/'))) {
    errors.push(`${path}.ref must be a repo-relative fixture ref`);
    return;
  }

  if (sourceRef.kind === 'docs' && (!isSafeRepoRelativePath(ref) || !ref.startsWith('docs/'))) {
    errors.push(`${path}.ref must be a repo-relative docs ref`);
    return;
  }

  if (sourceRef.kind === 'run-record' && !isSafeRepoRelativePath(ref) && !SAFE_TOKEN_PATTERN.test(ref)) {
    errors.push(`${path}.ref must be a safe run record ref`);
  }
}

function validateEvidenceRefs(errors, refs, path, {
  requireNonEmpty
}) {
  if (!Array.isArray(refs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  if (requireNonEmpty === true && refs.length === 0) {
    errors.push(`${path} must contain at least one controlled evidence ref`);
  }

  refs.forEach((ref, index) => validateEvidenceRef(errors, ref, `${path}[${index}]`));
}

function validateEvidenceRef(errors, ref, path) {
  if (!isPlainObject(ref)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, ref, path, EVIDENCE_REF_ALLOWED_FIELDS);
  requireEnum(errors, ref.kind, `${path}.kind`, EVIDENCE_REF_KIND_SET);
  requireNonEmptyString(errors, ref.ref, `${path}.ref`);
  requireNonEmptyString(errors, ref.label, `${path}.label`);

  if (!isControlledEvidenceRef(ref)) {
    errors.push(`${path}.ref must be a controlled evidence reference`);
  }
}

function validateBoundaries(errors, boundaries, path) {
  if (!isPlainObject(boundaries)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, boundaries, path, new Set(Object.keys(CODEX_PROVIDER_RUN_RECOVERY_BOUNDARIES)));

  for (const [field, expected] of Object.entries(CODEX_PROVIDER_RUN_RECOVERY_BOUNDARIES)) {
    requireExact(errors, boundaries[field], `${path}.${field}`, expected);
  }
}

function validateNullableSourceContractName(errors, value, path) {
  if (value === undefined || value === null) {
    return;
  }

  requireSafeSourceContractName(errors, value, path);
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

function validateStringArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.trim() === '') {
      errors.push(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function validateRepoPathArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((entry, index) => {
    const fieldPath = `${path}[${index}]`;

    if (typeof entry !== 'string' || entry.trim() === '') {
      errors.push(`${fieldPath} must be a non-empty string`);
      return;
    }

    if (!isSafeRepoRelativePath(entry.trim())) {
      errors.push(`${fieldPath} must be a safe repo-relative path`);
    }
  });
}

function requireStringArrayIncludes(errors, value, path, expected) {
  if (!Array.isArray(value) || !value.includes(expected)) {
    errors.push(`${path} must include ${JSON.stringify(expected)}`);
  }
}

function requireExact(errors, value, path, expected) {
  if (!Object.is(value, expected)) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function requireEnum(errors, value, path, allowedValues) {
  if (!allowedValues.has(value) && !Array.from(allowedValues).includes(value)) {
    errors.push(`${path} must be one of ${JSON.stringify(Array.from(allowedValues))}`);
  }
}

function requireHash(errors, value, path) {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
    errors.push(`${path} must be a sha256 hash`);
  }
}

function requireSafeToken(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
    return;
  }

  if (!SAFE_TOKEN_PATTERN.test(value.trim())) {
    errors.push(`${path} must be a safe token`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireSafeSourceContractName(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && !SOURCE_CONTRACT_NAME_PATTERN.test(value.trim())) {
    errors.push(`${path} must be a safe contract name`);
  }
}

function findUnsafeFields(value, path) {
  const fields = [];

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      fields.push(...findUnsafeFields(entry, `${path}[${index}]`));
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

      fields.push(...findUnsafeFields(entry, fieldPath));
    }
    return fields;
  }

  if (typeof value === 'string' && isUnsafeText(value)) {
    fields.push(path);
  }

  return fields;
}

function isControlledEvidenceRef(ref) {
  if (!isPlainObject(ref)) {
    return false;
  }

  if (!EVIDENCE_REF_KIND_SET.has(ref.kind)) {
    return false;
  }

  if (typeof ref.ref !== 'string' || typeof ref.label !== 'string') {
    return false;
  }

  if (ref.kind === 'commit') {
    return COMMIT_PATTERN.test(ref.ref);
  }

  return isSafeRepoRelativePath(ref.ref) && (ref.kind !== 'repo-doc' || ref.ref.startsWith('docs/plans/'));
}

function safeToken(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const token = value.trim();

  return SAFE_TOKEN_PATTERN.test(token) && !isUnsafeText(token) ? token : null;
}

function safeHash(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const hash = value.trim();

  return HASH_PATTERN.test(hash) ? hash : null;
}

function safeContractName(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const contractName = value.trim();

  return SOURCE_CONTRACT_NAME_PATTERN.test(contractName) && !isUnsafeText(contractName)
    ? contractName
    : null;
}

function safeSourceRef(sourceRef) {
  if (!isPlainObject(sourceRef) || !REF_KIND_SET.has(sourceRef.kind)) {
    return null;
  }

  const ref = safeDisplayText(sourceRef.ref);

  if (ref === null) {
    return null;
  }

  return {
    kind: sourceRef.kind,
    ref,
    ...(safeDisplayText(sourceRef.label) === null ? {} : { label: safeDisplayText(sourceRef.label) }),
    ...(safeTimestamp(sourceRef.generatedAt) === null ? {} : { generatedAt: safeTimestamp(sourceRef.generatedAt) })
  };
}

function safeDisplayText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();

  return text === '' || isUnsafeText(text) ? null : text;
}

function safeStringArray(value) {
  return Array.isArray(value)
    ? value.map((entry) => safeDisplayText(entry)).filter((entry) => entry !== null)
    : [];
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeTimestamp(value) {
  if (typeof value !== 'string' || value.trim() === '' || Number.isNaN(Date.parse(value))) {
    return null;
  }

  return new Date(Date.parse(value)).toISOString();
}

function millisOrNow(value) {
  const ms = Date.parse(value);

  return Number.isNaN(ms) ? Date.now() : ms;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((entry) => typeof entry === 'string' && entry.trim() !== ''))];
}

function isUnsafeValidationError(error) {
  return typeof error === 'string' &&
    /raw provider output|raw transcript|rawTranscript|rawModelOutput|local session|direct mutation routes/iu.test(error);
}

function isSafeRepoRelativePath(value) {
  if (typeof value !== 'string' || value.trim() === '' || value.startsWith('/') || value.includes('\\') || isUnsafeText(value)) {
    return false;
  }

  const segments = value.split('/');

  return !segments.some((segment) => segment === '..' || LOCAL_HIDDEN_PATH_SEGMENTS.has(segment));
}

function isControlledRouteRef(value) {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('\\') || containsUnsafePathSegment(value)) {
    return false;
  }

  return value.startsWith('/api/goals/') ||
    value.startsWith('/api/projects/') ||
    value.startsWith('/api/workbench/') ||
    value.startsWith('/workbench/');
}

function containsUnsafePathSegment(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.replaceAll('\\', '/');
  const segments = normalized.split('/').filter((segment) => segment !== '');

  return segments.some((segment) => segment === '..' || LOCAL_HIDDEN_PATH_SEGMENTS.has(segment));
}

function isUnsafeText(value) {
  if (typeof value !== 'string') {
    return false;
  }

  return UNSAFE_TEXT_PATTERN.test(value);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function invalidResult(error) {
  return {
    ok: false,
    errors: [error]
  };
}
