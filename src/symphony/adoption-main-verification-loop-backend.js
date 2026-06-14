import {
  ADOPTION_MAIN_VERIFICATION_BOUNDARIES,
  V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID,
  buildAdoptionReadiness,
  validateAdoptionReadinessContract
} from './adoption-main-verification-loop-contracts.js';

export { V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID } from './adoption-main-verification-loop-contracts.js';

export const ADOPTION_CONFIRMATION_CONTRACT_NAME = 'adoptionConfirmation.v1';
export const ADOPTION_BACKEND_CONTRACT_VERSION = 1;

const ADOPTION_CONFIRM_ALLOWED_FIELDS = new Set([
  'planHash',
  'goalId',
  'taskId',
  'adoptionId',
  'workerRunId',
  'reviewerVerdictId',
  'patchFingerprint',
  'sourceFingerprint'
]);
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;

export class AdoptionBackendError extends Error {
  constructor(code, message, safeDetails = {}) {
    super(message);
    this.name = 'AdoptionBackendError';
    this.code = code;
    this.safeDetails = safeDetails;
  }
}

export function buildAdoptionPreviewFromBackend({
  goalId = V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID,
  taskId = 'pr-2-adoption-preview-confirm',
  generatedAt = new Date().toISOString(),
  workerEvidence = null,
  reviewerVerdict = null,
  worktreeState = null,
  sourceFingerprint = null,
  patchPlan = null,
  artifactRefs = null
} = {}) {
  return buildAdoptionReadiness({
    generatedAt,
    goal: {
      goalId,
      title: goalId,
      state: goalId === 'missing-goal' ? 'missing' : 'active',
      sourceContract: 'goal-next-action.v1',
      sourceRef: `goal-next-action:${goalId}`
    },
    task: {
      taskId,
      title: taskId,
      state: taskId === 'missing-task' ? 'missing' : 'active',
      sourceContract: 'goal-next-action.v1',
      sourceRef: `goal-next-action:${goalId}:${taskId}`
    },
    workerEvidence: workerEvidence ?? defaultWorkerEvidence({ taskId }),
    reviewerVerdict: reviewerVerdict ?? defaultReviewerVerdict({ taskId }),
    worktreeState: worktreeState ?? defaultWorktreeState(),
    sourceFingerprint: sourceFingerprint ?? defaultSourceFingerprint(),
    patchPlan: patchPlan ?? defaultPatchPlan(),
    artifactRefs: artifactRefs ?? defaultArtifactRefs()
  });
}

export function validateAdoptionConfirmInput({
  preview,
  input
} = {}) {
  const errors = [];
  const previewValidation = validateAdoptionReadinessContract(preview);

  if (!previewValidation.ok) {
    errors.push(...previewValidation.errors.map((error) => `preview.${error}`));
  } else if (preview.state !== 'ready') {
    errors.push('preview must be ready before adoption confirm');
  }

  if (!isPlainObject(input)) {
    errors.push('adoption confirm input must be a plain object');
    return { ok: false, errors };
  }

  for (const field of Object.keys(input)) {
    if (!ADOPTION_CONFIRM_ALLOWED_FIELDS.has(field)) {
      errors.push(`${field} is not an allowed adoption confirm field`);
    }
  }

  requireHash(errors, input.planHash, 'planHash');
  requireSafeToken(errors, input.goalId, 'goalId');
  requireSafeToken(errors, input.taskId, 'taskId');
  requireSafeToken(errors, input.adoptionId, 'adoptionId');
  requireSafeToken(errors, input.workerRunId, 'workerRunId');
  requireSafeToken(errors, input.reviewerVerdictId, 'reviewerVerdictId');
  requireHash(errors, input.patchFingerprint, 'patchFingerprint');
  requireHash(errors, input.sourceFingerprint, 'sourceFingerprint');

  if (previewValidation.ok) {
    if (input.planHash !== preview.planHash) {
      errors.push('planHash must match adoption preview');
    }

    if (input.goalId !== preview.goal.goalId) {
      errors.push('goalId must match adoption preview');
    }

    if (input.taskId !== preview.task.taskId) {
      errors.push('taskId must match adoption preview');
    }

    if (input.adoptionId !== preview.adoptionId) {
      errors.push('adoptionId must match adoption preview');
    }

    if (input.workerRunId !== preview.workerEvidence.workerRunId) {
      errors.push('workerRunId must match adoption preview');
    }

    if (input.reviewerVerdictId !== preview.reviewerEvidence.verdictId) {
      errors.push('reviewerVerdictId must match adoption preview');
    }

    if (input.patchFingerprint !== preview.patchPlan.patchFingerprint) {
      errors.push('patchFingerprint must match adoption preview');
    }

    if (input.sourceFingerprint !== preview.sourceFingerprint.current) {
      errors.push('sourceFingerprint must match adoption preview');
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export async function confirmAdoptionPreview({
  preview,
  input,
  currentSourceFingerprint = null,
  applyAdoption = fakeAdoptionApplicator,
  writeJournal = null,
  startedAt = new Date().toISOString(),
  finishedAt = null
} = {}) {
  const validation = validateAdoptionConfirmInput({
    preview,
    input
  });

  if (!validation.ok) {
    throw new AdoptionBackendError(
      'invalid-adoption-confirm-request',
      'Adoption confirm request is invalid.',
      { errors: validation.errors }
    );
  }

  if (typeof applyAdoption !== 'function') {
    throw new AdoptionBackendError(
      'missing-adoption-applicator',
      'Adoption confirm requires a backend-owned applicator.',
      { applicator: 'missing' }
    );
  }

  const revalidation = revalidatePreviewBeforeApply({
    preview,
    currentSourceFingerprint: currentSourceFingerprint ?? preview.sourceFingerprint.current
  });

  if (!revalidation.ok) {
    throw new AdoptionBackendError(
      'adoption-confirm-revalidation-failed',
      'Adoption confirm revalidation failed.',
      { errors: revalidation.errors }
    );
  }

  const journal = buildAdoptionJournal({
    preview,
    startedAt,
    status: 'applying'
  });

  if (typeof writeJournal === 'function') {
    await writeJournal(structuredClone(journal));
  }

  const applyRequest = buildAdoptionApplyRequest({ preview });
  const applyResult = normalizeApplyResult(await applyAdoption(structuredClone(applyRequest)));
  const status = applyResult.status === 'applied' ? 'applied' : 'failed';
  const effectiveFinishedAt = new Date(millisOrNow(finishedAt ?? applyResult.finishedAt ?? startedAt)).toISOString();
  const finalJournal = {
    ...journal,
    status,
    finishedAt: effectiveFinishedAt,
    failureReason: applyResult.failureReason
  };

  return {
    contractName: ADOPTION_CONFIRMATION_CONTRACT_NAME,
    contractVersion: ADOPTION_BACKEND_CONTRACT_VERSION,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    adoptionId: preview.adoptionId,
    status,
    planHash: preview.planHash,
    workerRunId: preview.workerEvidence.workerRunId,
    reviewerVerdictId: preview.reviewerEvidence.verdictId,
    patchFingerprint: preview.patchPlan.patchFingerprint,
    sourceFingerprint: preview.sourceFingerprint.current,
    revalidation,
    journal: finalJournal,
    applyRequest,
    applyResult,
    nextState: {
      adoptionApplied: status === 'applied',
      taskCompleted: false,
      mainVerified: false,
      gateDraftReady: false,
      releaseReady: false
    },
    confirmContext: {
      acceptedBodyFields: [...ADOPTION_CONFIRM_ALLOWED_FIELDS],
      samePreviewContextRequired: true,
      acceptedPlanHashFromPreview: true,
      journalWrittenBeforeApply: true,
      appliesFrozenPatchOnly: true,
      acceptsProviderCommand: false,
      acceptsRendererCommand: false,
      acceptsWorkspacePath: false
    },
    safety: {
      backendOwnedPreviewConfirm: true,
      providerInvocationAvailable: false,
      directTaskCompletionAvailable: false,
      mainVerificationAutoPassAvailable: false,
      gateRegistrationAvailable: false,
      gitMutationAvailable: false,
      githubReleaseAutomationAvailable: false,
      rawProviderOutputAvailable: false
    },
    boundaries: { ...ADOPTION_MAIN_VERIFICATION_BOUNDARIES }
  };
}

export function buildAdoptionApplyRequest({ preview }) {
  return {
    contractName: 'adoptionApplyRequest.v1',
    contractVersion: ADOPTION_BACKEND_CONTRACT_VERSION,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    adoptionId: preview.adoptionId,
    planHash: preview.planHash,
    workerRunId: preview.workerEvidence.workerRunId,
    reviewerVerdictId: preview.reviewerEvidence.verdictId,
    patchRef: preview.patchPlan.patchRef,
    patchFingerprint: preview.patchPlan.patchFingerprint,
    sourceFingerprint: preview.sourceFingerprint.current,
    fileChanges: preview.patchPlan.fileChanges,
    rollback: {
      required: true,
      rollbackRef: `rollback-ref:${preview.adoptionId}`
    },
    boundaries: { ...ADOPTION_MAIN_VERIFICATION_BOUNDARIES }
  };
}

function buildAdoptionJournal({ preview, startedAt, status }) {
  return {
    contractName: 'adoptionJournal.v1',
    contractVersion: ADOPTION_BACKEND_CONTRACT_VERSION,
    journalId: `adoption-journal-${shortHash({
      adoptionId: preview.adoptionId,
      planHash: preview.planHash,
      startedAt
    })}`,
    adoptionId: preview.adoptionId,
    status,
    startedAt: new Date(millisOrNow(startedAt)).toISOString(),
    finishedAt: null,
    planHash: preview.planHash,
    workerRunId: preview.workerEvidence.workerRunId,
    reviewerVerdictId: preview.reviewerEvidence.verdictId,
    patchFingerprint: preview.patchPlan.patchFingerprint,
    sourceFingerprint: preview.sourceFingerprint.current,
    rollbackRef: `rollback-ref:${preview.adoptionId}`,
    failureReason: null
  };
}

function revalidatePreviewBeforeApply({
  preview,
  currentSourceFingerprint
}) {
  const errors = [];

  if (currentSourceFingerprint !== preview.sourceFingerprint.current) {
    errors.push('current source fingerprint must match adoption preview');
  }

  if (preview.patchPlan.appliesToFingerprint !== preview.sourceFingerprint.current) {
    errors.push('patch appliesToFingerprint must match adoption preview source fingerprint');
  }

  if (preview.patchPlan.patchFingerprint !== preview.confirmation.patchFingerprint) {
    errors.push('patch fingerprint must match adoption confirmation binding');
  }

  return {
    ok: errors.length === 0,
    errors,
    sourceFingerprint: currentSourceFingerprint,
    patchFingerprint: preview.patchPlan.patchFingerprint,
    planHash: preview.planHash
  };
}

async function fakeAdoptionApplicator(request) {
  return {
    status: 'applied',
    appliedPatchRef: request.patchRef,
    changedFiles: request.fileChanges.map((change) => change.path),
    journalAppendRequired: true,
    verifierStatus: 'not-run',
    mainVerified: false,
    gateDraftReady: false,
    releaseReady: false
  };
}

function normalizeApplyResult(result) {
  const source = isPlainObject(result) ? result : {};
  const applied = source.status === 'applied' || source.applied === true;

  return {
    status: applied ? 'applied' : 'failed',
    appliedPatchRef: safeRef(source.appliedPatchRef) ?? null,
    changedFiles: safeStringArray(source.changedFiles),
    journalAppendRequired: source.journalAppendRequired !== false,
    verifierStatus: 'not-run',
    mainVerified: false,
    gateDraftReady: false,
    releaseReady: false,
    failureReason: applied ? null : firstNonEmptyString(source.failureReason, 'Adoption applicator failed.')
  };
}

function defaultWorkerEvidence({ taskId }) {
  return {
    sourceContract: 'workerRunResult.v1',
    sourceRef: 'fixtures/contracts/worker-run/result.sanitized-success.v1.json',
    workerRunId: `worker-run-v66-${taskId}`,
    taskId,
    providerId: 'codex-cli',
    role: 'worker',
    status: 'needs-review',
    nextState: {
      taskState: 'needs-review',
      reviewRequired: true,
      taskCompleted: false,
      reviewApproved: false,
      mainVerified: false,
      releaseReady: false
    },
    sanitizedResult: {
      changedFiles: ['src/symphony/adoption-main-verification-loop-contracts.js'],
      validationCommands: ['node --test tests/v68-adoption-main-verification-loop.test.js']
    },
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/qa/v66-controlled-codex-worker-execution-acceptance.md',
      label: 'v66 worker evidence'
    }]
  };
}

function defaultReviewerVerdict({ taskId }) {
  return {
    sourceContract: 'reviewerRunVerdict.v1',
    sourceRef: 'fixtures/contracts/reviewer-run/verdict.approved.v1.json',
    verdictId: `reviewer-verdict-v67-${taskId}`,
    status: 'approved',
    reviewedWorkerRunId: `worker-run-v66-${taskId}`,
    reviewerActorId: 'claude-reviewer-v67',
    workerActorId: 'codex-worker-v66',
    nextState: {
      reviewApproved: true,
      revisionRequired: false,
      taskCompleted: false,
      adoptionReady: false,
      mainVerified: false,
      releaseReady: false
    },
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/qa/v67-claude-code-reviewer-lane-acceptance.md',
      label: 'v67 reviewer evidence'
    }]
  };
}

function defaultWorktreeState() {
  return {
    state: 'clean',
    branch: 'main',
    dirty: false,
    expectedMainWorktree: true,
    sourceRef: 'backend-worktree-state:v68-clean'
  };
}

function defaultSourceFingerprint() {
  const fingerprint = 'sha256:1111111111111111111111111111111111111111111111111111111111111111';

  return {
    expected: fingerprint,
    current: fingerprint,
    workerRecorded: fingerprint,
    reviewerRecorded: fingerprint
  };
}

function defaultPatchPlan() {
  const sourceFingerprint = 'sha256:1111111111111111111111111111111111111111111111111111111111111111';
  const patchFingerprint = 'sha256:2222222222222222222222222222222222222222222222222222222222222222';

  return {
    patchId: 'patch-v68-backend-ready',
    patchRef: 'artifact-ref:v68:backend-ready-patch',
    patchFingerprint,
    expectedPatchFingerprint: patchFingerprint,
    appliesToFingerprint: sourceFingerprint,
    applyCheck: 'passed',
    fileChanges: [{
      path: 'src/symphony/adoption-main-verification-loop-backend.js',
      operation: 'modify',
      fingerprintBefore: sourceFingerprint,
      fingerprintAfter: patchFingerprint
    }]
  };
}

function defaultArtifactRefs() {
  return [{
    kind: 'artifact-ref',
    ref: 'artifact-ref:v68:backend-ready-patch',
    label: 'bounded adoption patch'
  }];
}

function requireSafeToken(errors, value, field) {
  if (typeof value !== 'string' || !SAFE_TOKEN_PATTERN.test(value)) {
    errors.push(`${field} must be a safe token`);
  }
}

function requireHash(errors, value, field) {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
    errors.push(`${field} must be a sha256 hash`);
  }
}

function safeRef(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === '' || trimmed.includes('..') || /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])/iu.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function safeStringArray(values) {
  const source = Array.isArray(values) ? values : [];

  return source
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value !== '' && safeRef(value) !== null);
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return '';
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function millisOrNow(value) {
  const millis = Date.parse(value);

  return Number.isNaN(millis) ? Date.now() : millis;
}

function shortHash(value) {
  const text = JSON.stringify(value, Object.keys(value).sort());
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(16).padStart(8, '0');
}
