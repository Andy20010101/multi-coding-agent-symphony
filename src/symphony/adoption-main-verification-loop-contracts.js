import { createHash } from 'node:crypto';

export const ADOPTION_READINESS_CONTRACT_NAME = 'adoptionReadiness.v1';
export const ADOPTION_MAIN_VERIFICATION_CONTRACT_VERSION = 1;
export const V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID = 'v68-adoption-main-verification-loop';

export const ADOPTION_MAIN_VERIFICATION_BOUNDARIES = Object.freeze({
  backendOwnedPreviewConfirm: true,
  approvedReviewerEvidenceRequired: true,
  requiresPlanHash: true,
  sourceFingerprintBinding: true,
  patchFingerprintBinding: true,
  dirtyWorktreeBlocksAdoption: true,
  gitApplyCheckRequired: true,
  rollbackPlanRequired: true,
  rendererSuppliedPatchAvailable: false,
  rendererCommandExecutionAvailable: false,
  frontendLocalJsonlReadAvailable: false,
  frontendLocalSessionReadAvailable: false,
  frontendProviderFolderReadAvailable: false,
  rawTranscriptAvailable: false,
  rawWorkerTranscriptAvailable: false,
  rawProviderOutputAvailable: false,
  rawModelOutputAvailable: false,
  providerInvocationDuringAdoption: false,
  directTaskCompletionAvailable: false,
  reviewerOutputApprovesAdoption: false,
  reviewerVerdictPassesMainVerification: false,
  verificationSuccessRegistersGate: false,
  automaticSelfReviewAvailable: false,
  automaticWorktreeCreationAvailable: false,
  automaticNextVersionGoalAvailable: false,
  gitMergePushTagAvailable: false,
  githubReleaseAutomationAvailable: false
});

const READINESS_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'adoptionId',
  'generatedAt',
  'state',
  'goal',
  'task',
  'workerEvidence',
  'reviewerEvidence',
  'worktreeState',
  'sourceFingerprint',
  'patchPlan',
  'adoptionPolicy',
  'confirmation',
  'artifactRefs',
  'blockedReasons',
  'boundaries',
  'planHash'
]);
const GOAL_ALLOWED_FIELDS = new Set(['goalId', 'title', 'state', 'sourceContract', 'sourceRef']);
const TASK_ALLOWED_FIELDS = new Set(['taskId', 'title', 'state', 'sourceContract', 'sourceRef']);
const WORKER_EVIDENCE_ALLOWED_FIELDS = new Set([
  'sourceContract',
  'sourceRef',
  'workerRunId',
  'taskId',
  'workerProviderId',
  'workerRole',
  'taskState',
  'reviewRequired',
  'taskCompleted',
  'reviewApproved',
  'mainVerified',
  'releaseReady',
  'changedFiles',
  'validationCommands',
  'evidenceRefs'
]);
const REVIEWER_EVIDENCE_ALLOWED_FIELDS = new Set([
  'sourceContract',
  'sourceRef',
  'verdictId',
  'status',
  'reviewedWorkerRunId',
  'reviewerActorId',
  'workerActorId',
  'reviewApproved',
  'revisionRequired',
  'taskCompleted',
  'adoptionReady',
  'mainVerified',
  'releaseReady',
  'evidenceRefs'
]);
const WORKTREE_STATE_ALLOWED_FIELDS = new Set(['state', 'branch', 'dirty', 'expectedMainWorktree', 'sourceRef']);
const SOURCE_FINGERPRINT_ALLOWED_FIELDS = new Set(['expected', 'current', 'workerRecorded', 'reviewerRecorded']);
const PATCH_PLAN_ALLOWED_FIELDS = new Set([
  'patchId',
  'patchRef',
  'patchFingerprint',
  'expectedPatchFingerprint',
  'appliesToFingerprint',
  'applyCheck',
  'fileChanges'
]);
const FILE_CHANGE_ALLOWED_FIELDS = new Set(['path', 'operation', 'fingerprintBefore', 'fingerprintAfter']);
const ADOPTION_POLICY_ALLOWED_FIELDS = new Set([
  'requiresApprovedReviewer',
  'requiresCleanWorktree',
  'requiresPatchFingerprintMatch',
  'requiresSourceFingerprintMatch',
  'supportsDeletion',
  'writesAdoptionJournal',
  'rollbackRequired',
  'providerInvocationAllowed'
]);
const CONFIRMATION_ALLOWED_FIELDS = new Set([
  'requiresPlanHash',
  'requiredFields',
  'adoptionId',
  'workerRunId',
  'reviewerVerdictId',
  'patchFingerprint',
  'sourceFingerprint'
]);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label']);

const READINESS_STATE_SET = new Set(['ready', 'blocked']);
const GOAL_STATE_SET = new Set(['active', 'ready', 'blocked', 'pending', 'missing']);
const TASK_STATE_SET = new Set(['active', 'ready', 'blocked', 'pending', 'missing', 'needs-review']);
const EVIDENCE_KIND_SET = new Set(['repo-doc', 'artifact-ref', 'command-evidence', 'handoff-pack']);
const FILE_OPERATION_SET = new Set(['add', 'modify', 'delete']);
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const SAFE_CONTRACT_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const UNSAFE_TEXT_PATTERN =
  /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|\b(?:raw[\s_-]*(?:worker[\s_-]*)?(?:transcript|model[\s_-]*output|provider[\s_-]*output|output)|provider[\s_-]*(?:session|folder|payload)|session[\s_-]*(?:path|file|log)|generic[\s_-]*(?:shell|terminal)|arbitrary[\s_-]*command|freeform[\s_-]*(?:command|provider[\s_-]*command)|renderer[\s_-]*command|append[\s_-]*event|task[\s_-]*(?:complete|completion)|release[\s_-]*(?:ready|readiness)|git[\s_-]*(?:merge|push|tag)|github[\s_-]*release)\b/iu;

const DEFAULT_SOURCE_FINGERPRINT = 'sha256:1111111111111111111111111111111111111111111111111111111111111111';
const DEFAULT_PATCH_FINGERPRINT = 'sha256:2222222222222222222222222222222222222222222222222222222222222222';

export class AdoptionMainVerificationContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'AdoptionMainVerificationContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildAdoptionReadiness({
  adoptionId = null,
  generatedAt = new Date().toISOString(),
  goal = null,
  task = null,
  workerEvidence = null,
  reviewerVerdict = null,
  worktreeState = null,
  sourceFingerprint = null,
  patchPlan = null,
  adoptionPolicy = null,
  artifactRefs = null,
  blockedReasons: inputBlockedReasons = []
} = {}) {
  const normalizedGoal = normalizeGoal(goal);
  const normalizedTask = normalizeTask(task);
  const normalizedWorkerEvidence = normalizeWorkerEvidence(workerEvidence);
  const normalizedReviewerEvidence = normalizeReviewerEvidence(reviewerVerdict, normalizedWorkerEvidence.workerRunId);
  const normalizedWorktreeState = normalizeWorktreeState(worktreeState);
  const normalizedSourceFingerprint = normalizeSourceFingerprint(sourceFingerprint);
  const normalizedPatchPlan = normalizePatchPlan(patchPlan, normalizedSourceFingerprint.current);
  const normalizedPolicy = normalizeAdoptionPolicy(adoptionPolicy);
  const normalizedArtifactRefs = normalizeEvidenceRefs(artifactRefs ?? normalizedPatchPlan.artifactRefs);
  const normalizedAdoptionId = safeToken(adoptionId) ??
    `adoption-v68-${normalizedWorkerEvidence.workerRunId}-${normalizedReviewerEvidence.verdictId}`;
  const blockedReasons = uniqueStrings([
    ...safeStringArray(inputBlockedReasons),
    ...workerBlockedReasons(normalizedWorkerEvidence),
    ...reviewerBlockedReasons(normalizedReviewerEvidence),
    ...(normalizedWorktreeState.dirty ? ['dirty-worktree'] : []),
    ...(normalizedSourceFingerprint.current !== normalizedSourceFingerprint.expected ? ['source-fingerprint-mismatch'] : []),
    ...(normalizedPatchPlan.appliesToFingerprint !== normalizedSourceFingerprint.current ? ['patch-source-fingerprint-mismatch'] : []),
    ...(normalizedPatchPlan.patchFingerprint !== normalizedPatchPlan.expectedPatchFingerprint ? ['patch-fingerprint-mismatch'] : []),
    ...normalizedPatchPlan.blockedReasons,
    ...(normalizedPatchPlan.applyCheck !== 'passed' ? ['patch-apply-check-not-passed'] : []),
    ...(normalizedPatchPlan.fileChanges.some((change) => change.operation === 'delete') ? ['unsupported-deletion'] : []),
    ...(normalizedPatchPlan.fileChanges.length === 0 ? ['missing-patch-changes'] : []),
    ...(normalizedArtifactRefs.length === 0 || normalizedPatchPlan.patchRef === null ? ['missing-artifact'] : []),
    ...(normalizedReviewerEvidence.reviewedWorkerRunId !== normalizedWorkerEvidence.workerRunId ? ['stale-worker-run'] : []),
    ...(normalizedPolicy.providerInvocationAllowed ? ['provider-invocation-not-allowed'] : []),
    ...(normalizedPolicy.supportsDeletion ? ['deletion-policy-enabled'] : [])
  ]);
  const readiness = {
    contractName: ADOPTION_READINESS_CONTRACT_NAME,
    contractVersion: ADOPTION_MAIN_VERIFICATION_CONTRACT_VERSION,
    adoptionId: normalizedAdoptionId,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    goal: normalizedGoal,
    task: normalizedTask,
    workerEvidence: normalizedWorkerEvidence,
    reviewerEvidence: normalizedReviewerEvidence,
    worktreeState: normalizedWorktreeState,
    sourceFingerprint: normalizedSourceFingerprint,
    patchPlan: withoutArtifactRefs(normalizedPatchPlan),
    adoptionPolicy: normalizedPolicy,
    confirmation: {
      requiresPlanHash: true,
      requiredFields: [
        'planHash',
        'goalId',
        'taskId',
        'adoptionId',
        'workerRunId',
        'reviewerVerdictId',
        'patchFingerprint',
        'sourceFingerprint'
      ],
      adoptionId: normalizedAdoptionId,
      workerRunId: normalizedWorkerEvidence.workerRunId,
      reviewerVerdictId: normalizedReviewerEvidence.verdictId,
      patchFingerprint: normalizedPatchPlan.patchFingerprint,
      sourceFingerprint: normalizedSourceFingerprint.current
    },
    artifactRefs: normalizedArtifactRefs,
    blockedReasons,
    boundaries: { ...ADOPTION_MAIN_VERIFICATION_BOUNDARIES }
  };
  const withHash = {
    ...readiness,
    planHash: computeAdoptionReadinessPlanHash(readiness)
  };

  assertAdoptionReadinessContract(withHash);

  return withHash;
}

export function computeAdoptionReadinessPlanHash(readiness) {
  const copy = cloneValue(readiness);
  delete copy.planHash;
  delete copy.generatedAt;
  return `sha256:${createHash('sha256').update(stableJson(copy)).digest('hex')}`;
}

export function validateAdoptionReadinessContract(readiness) {
  const errors = [];

  if (!isPlainObject(readiness)) {
    return invalidResult('readiness must be a plain object');
  }

  for (const field of READINESS_ALLOWED_FIELDS) {
    if (!Object.hasOwn(readiness, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, readiness, 'readiness', READINESS_ALLOWED_FIELDS);
  requireExact(errors, readiness.contractName, 'contractName', ADOPTION_READINESS_CONTRACT_NAME);
  requireExact(errors, readiness.contractVersion, 'contractVersion', ADOPTION_MAIN_VERIFICATION_CONTRACT_VERSION);
  requireSafeToken(errors, readiness.adoptionId, 'adoptionId');
  requireIsoTimestamp(errors, readiness.generatedAt, 'generatedAt');
  requireEnum(errors, readiness.state, 'state', READINESS_STATE_SET);
  validateGoal(errors, readiness.goal, 'goal');
  validateTask(errors, readiness.task, 'task');
  validateWorkerEvidence(errors, readiness.workerEvidence, readiness.state);
  validateReviewerEvidence(errors, readiness.reviewerEvidence, readiness.state);
  validateWorktreeState(errors, readiness.worktreeState);
  validateSourceFingerprint(errors, readiness.sourceFingerprint);
  validatePatchPlan(errors, readiness.patchPlan);
  validateAdoptionPolicy(errors, readiness.adoptionPolicy);
  validateConfirmation(errors, readiness.confirmation, readiness);
  validateEvidenceRefs(errors, readiness.artifactRefs, 'artifactRefs', { requireNonEmpty: readiness.state === 'ready' });
  validateStringArray(errors, readiness.blockedReasons, 'blockedReasons');
  validateBoundaries(errors, readiness.boundaries, 'boundaries');
  requireHash(errors, readiness.planHash, 'planHash');

  if (readiness.state === 'ready' && Array.isArray(readiness.blockedReasons) && readiness.blockedReasons.length !== 0) {
    errors.push('ready adoption readiness must not include blockedReasons');
  }

  if (readiness.state === 'blocked' && Array.isArray(readiness.blockedReasons) && readiness.blockedReasons.length === 0) {
    errors.push('blocked adoption readiness must include blockedReasons');
  }

  if (readiness.workerEvidence?.workerRunId !== readiness.reviewerEvidence?.reviewedWorkerRunId) {
    if (readiness.state !== 'blocked' || !readiness.blockedReasons?.includes('stale-worker-run')) {
      errors.push('reviewer evidence must match workerRunId or be blocked as stale-worker-run');
    }
  }

  if (HASH_PATTERN.test(readiness.planHash) && readiness.planHash !== computeAdoptionReadinessPlanHash(readiness)) {
    errors.push('planHash must match adoption readiness content');
  }

  validateUnsafeStrings(errors, readiness, 'readiness');

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertAdoptionReadinessContract(readiness) {
  const result = validateAdoptionReadinessContract(readiness);

  if (!result.ok) {
    throw new AdoptionMainVerificationContractError(
      'invalid-adoption-readiness',
      'Adoption readiness contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return readiness;
}

function normalizeGoal(goal) {
  const source = isPlainObject(goal) ? goal : {};
  const goalId = safeToken(source.goalId) ?? V68_ADOPTION_MAIN_VERIFICATION_GOAL_ID;

  return {
    goalId,
    title: firstNonEmptyString(source.title, 'v68 Adoption and Main Verification Workbench Loop'),
    state: GOAL_STATE_SET.has(source.state) ? source.state : 'active',
    sourceContract: safeContractName(source.sourceContract) ?? 'goal-next-action.v1',
    sourceRef: safeRef(source.sourceRef ?? 'goal-next-action:v68')
  };
}

function normalizeTask(task) {
  const source = isPlainObject(task) ? task : {};
  const taskId = safeToken(source.taskId) ?? 'pr-1-adoption-readiness-contracts';

  return {
    taskId,
    title: firstNonEmptyString(source.title, 'Adoption readiness contracts'),
    state: TASK_STATE_SET.has(source.state) ? source.state : 'active',
    sourceContract: safeContractName(source.sourceContract) ?? 'goal-next-action.v1',
    sourceRef: safeRef(source.sourceRef ?? 'goal-next-action:v68:pr-1')
  };
}

function normalizeWorkerEvidence(workerEvidence) {
  const source = isPlainObject(workerEvidence) ? workerEvidence : {};
  const nextState = isPlainObject(source.nextState) ? source.nextState : {};
  const sanitizedResult = isPlainObject(source.sanitizedResult) ? source.sanitizedResult : {};
  const workerRunId = safeToken(source.workerRunId ?? source.runId) ?? 'missing-worker-run';

  return {
    sourceContract: safeContractName(source.sourceContract) ?? 'workerRunResult.v1',
    sourceRef: safeRef(source.sourceRef ?? 'fixtures/contracts/worker-run/result.sanitized-success.v1.json') ?? 'workerRunResult.v1',
    workerRunId,
    taskId: safeToken(source.taskId) ?? 'missing-task',
    workerProviderId: safeToken(source.workerProviderId ?? source.providerId) ?? 'missing-provider',
    workerRole: safeToken(source.workerRole ?? source.role) ?? 'worker',
    taskState: firstNonEmptyString(source.taskState, nextState.taskState, source.status, 'missing'),
    reviewRequired: source.reviewRequired ?? nextState.reviewRequired,
    taskCompleted: source.taskCompleted ?? nextState.taskCompleted,
    reviewApproved: source.reviewApproved ?? nextState.reviewApproved,
    mainVerified: source.mainVerified ?? nextState.mainVerified,
    releaseReady: source.releaseReady ?? nextState.releaseReady,
    changedFiles: safePathArray(source.changedFiles ?? sanitizedResult.changedFiles),
    validationCommands: safeCommandArray(source.validationCommands ?? sanitizedResult.validationCommands),
    evidenceRefs: normalizeEvidenceRefs(source.evidenceRefs)
  };
}

function normalizeReviewerEvidence(reviewerVerdict, workerRunId) {
  const source = isPlainObject(reviewerVerdict) ? reviewerVerdict : {};
  const nextState = isPlainObject(source.nextState) ? source.nextState : {};
  const sanitizedVerdict = isPlainObject(source.sanitizedVerdict) ? source.sanitizedVerdict : {};

  return {
    sourceContract: safeContractName(source.sourceContract) ?? 'reviewerRunVerdict.v1',
    sourceRef: safeRef(source.sourceRef ?? 'fixtures/contracts/reviewer-run/verdict.approved.v1.json') ?? 'reviewerRunVerdict.v1',
    verdictId: safeToken(source.verdictId) ?? 'missing-reviewer-verdict',
    status: firstNonEmptyString(source.status, 'missing'),
    reviewedWorkerRunId: safeToken(source.reviewedWorkerRunId ?? sanitizedVerdict.reviewedWorkerRunId) ?? workerRunId,
    reviewerActorId: safeToken(source.reviewerActorId) ?? 'missing-reviewer',
    workerActorId: safeToken(source.workerActorId) ?? 'missing-worker',
    reviewApproved: source.reviewApproved ?? nextState.reviewApproved,
    revisionRequired: source.revisionRequired ?? nextState.revisionRequired,
    taskCompleted: source.taskCompleted ?? nextState.taskCompleted,
    adoptionReady: source.adoptionReady ?? nextState.adoptionReady,
    mainVerified: source.mainVerified ?? nextState.mainVerified,
    releaseReady: source.releaseReady ?? nextState.releaseReady,
    evidenceRefs: normalizeEvidenceRefs(source.evidenceRefs ?? sanitizedVerdict.evidenceRefs)
  };
}

function normalizeWorktreeState(worktreeState) {
  const source = isPlainObject(worktreeState) ? worktreeState : {};
  const dirty = source.dirty === true;

  return {
    state: dirty ? 'dirty' : firstNonEmptyString(source.state, 'clean'),
    branch: safeToken(source.branch) ?? 'main',
    dirty,
    expectedMainWorktree: source.expectedMainWorktree !== false,
    sourceRef: safeRef(source.sourceRef ?? 'backend-worktree-state:v68-adoption-preview')
  };
}

function normalizeSourceFingerprint(sourceFingerprint) {
  const source = isPlainObject(sourceFingerprint) ? sourceFingerprint : {};
  const expected = safeHash(source.expected) ?? DEFAULT_SOURCE_FINGERPRINT;
  const current = safeHash(source.current) ?? expected;

  return {
    expected,
    current,
    workerRecorded: safeHash(source.workerRecorded) ?? expected,
    reviewerRecorded: safeHash(source.reviewerRecorded) ?? expected
  };
}

function normalizePatchPlan(patchPlan, currentSourceFingerprint) {
  const source = isPlainObject(patchPlan) ? patchPlan : {};
  const patchFingerprint = safeHash(source.patchFingerprint) ?? DEFAULT_PATCH_FINGERPRINT;
  const { fileChanges, blockedReasons } = normalizeFileChanges(source.fileChanges);

  return {
    patchId: safeToken(source.patchId) ?? 'patch-v68-adoption-ready',
    patchRef: safeRef(source.patchRef ?? 'artifact-ref:v68:adoption-ready-patch'),
    patchFingerprint,
    expectedPatchFingerprint: safeHash(source.expectedPatchFingerprint) ?? patchFingerprint,
    appliesToFingerprint: safeHash(source.appliesToFingerprint) ?? currentSourceFingerprint,
    applyCheck: source.applyCheck === 'passed' ? 'passed' : 'not-run',
    fileChanges,
    blockedReasons,
    artifactRefs: normalizeEvidenceRefs(source.artifactRefs ?? [{
      kind: 'artifact-ref',
      ref: source.patchRef ?? 'artifact-ref:v68:adoption-ready-patch',
      label: 'bounded adoption patch'
    }])
  };
}

function normalizeFileChanges(fileChanges) {
  const source = Array.isArray(fileChanges) ? fileChanges : [{
    path: 'src/symphony/adoption-main-verification-loop-contracts.js',
    operation: 'modify'
  }];
  const blockedReasons = [];
  const normalized = source
    .filter(isPlainObject)
    .map((change, index) => {
      const safePath = isSafeRepoPath(change.path) ? change.path : `blocked-unsafe-patch-path-${index + 1}`;

      if (safePath !== change.path) {
        blockedReasons.push('unsafe-patch');
      }

      return {
        path: safePath,
        operation: firstNonEmptyString(change.operation, 'modify'),
        fingerprintBefore: safeHash(change.fingerprintBefore) ?? DEFAULT_SOURCE_FINGERPRINT,
        fingerprintAfter: safeHash(change.fingerprintAfter) ?? DEFAULT_PATCH_FINGERPRINT
      };
    });

  return {
    fileChanges: normalized,
    blockedReasons: uniqueStrings(blockedReasons)
  };
}

function normalizeAdoptionPolicy(adoptionPolicy) {
  const source = isPlainObject(adoptionPolicy) ? adoptionPolicy : {};

  return {
    requiresApprovedReviewer: source.requiresApprovedReviewer !== false,
    requiresCleanWorktree: source.requiresCleanWorktree !== false,
    requiresPatchFingerprintMatch: source.requiresPatchFingerprintMatch !== false,
    requiresSourceFingerprintMatch: source.requiresSourceFingerprintMatch !== false,
    supportsDeletion: source.supportsDeletion === true,
    writesAdoptionJournal: source.writesAdoptionJournal !== false,
    rollbackRequired: source.rollbackRequired !== false,
    providerInvocationAllowed: source.providerInvocationAllowed === true
  };
}

function workerBlockedReasons(workerEvidence) {
  return [
    ...(workerEvidence.workerRunId === 'missing-worker-run' ? ['worker-evidence-missing'] : []),
    ...(workerEvidence.workerProviderId !== 'codex-cli' ? ['worker-provider-not-codex-cli'] : []),
    ...(workerEvidence.workerRole !== 'worker' ? ['worker-role-not-worker'] : []),
    ...(workerEvidence.taskState !== 'needs-review' ? ['worker-evidence-not-needs-review'] : []),
    ...(workerEvidence.reviewRequired !== true ? ['worker-evidence-review-not-required'] : []),
    ...(workerEvidence.taskCompleted === true ? ['worker-evidence-completes-task'] : []),
    ...(workerEvidence.reviewApproved === true ? ['worker-evidence-already-approved'] : []),
    ...(workerEvidence.mainVerified === true ? ['worker-evidence-main-verified'] : []),
    ...(workerEvidence.releaseReady === true ? ['worker-evidence-release-ready'] : []),
    ...(workerEvidence.evidenceRefs.length === 0 ? ['worker-evidence-missing-artifact'] : [])
  ];
}

function reviewerBlockedReasons(reviewerEvidence) {
  return [
    ...(reviewerEvidence.verdictId === 'missing-reviewer-verdict' ? ['reviewer-evidence-missing'] : []),
    ...(reviewerEvidence.status !== 'approved' ? ['missing-reviewer-approval'] : []),
    ...(reviewerEvidence.reviewApproved !== true ? ['reviewer-approval-not-recorded'] : []),
    ...(reviewerEvidence.revisionRequired === true ? ['reviewer-requested-revision'] : []),
    ...(reviewerEvidence.taskCompleted === true ? ['reviewer-output-completes-task'] : []),
    ...(reviewerEvidence.adoptionReady === true ? ['reviewer-output-approves-adoption'] : []),
    ...(reviewerEvidence.mainVerified === true ? ['reviewer-output-main-verified'] : []),
    ...(reviewerEvidence.releaseReady === true ? ['reviewer-output-release-ready'] : []),
    ...(reviewerEvidence.evidenceRefs.length === 0 ? ['reviewer-evidence-missing-artifact'] : [])
  ];
}

function withoutArtifactRefs(patchPlan) {
  const { artifactRefs: _artifactRefs, blockedReasons: _blockedReasons, ...rest } = patchPlan;

  return rest;
}

function validateGoal(errors, goal, path) {
  validateAllowedFields(errors, goal, path, GOAL_ALLOWED_FIELDS);
  requireSafeToken(errors, goal?.goalId, `${path}.goalId`);
  requireString(errors, goal?.title, `${path}.title`);
  requireEnum(errors, goal?.state, `${path}.state`, GOAL_STATE_SET);
  requireSafeContract(errors, goal?.sourceContract, `${path}.sourceContract`);
  requireSafeRef(errors, goal?.sourceRef, `${path}.sourceRef`);
}

function validateTask(errors, task, path) {
  validateAllowedFields(errors, task, path, TASK_ALLOWED_FIELDS);
  requireSafeToken(errors, task?.taskId, `${path}.taskId`);
  requireString(errors, task?.title, `${path}.title`);
  requireEnum(errors, task?.state, `${path}.state`, TASK_STATE_SET);
  requireSafeContract(errors, task?.sourceContract, `${path}.sourceContract`);
  requireSafeRef(errors, task?.sourceRef, `${path}.sourceRef`);
}

function validateWorkerEvidence(errors, workerEvidence, readinessState) {
  validateAllowedFields(errors, workerEvidence, 'workerEvidence', WORKER_EVIDENCE_ALLOWED_FIELDS);
  requireSafeContract(errors, workerEvidence?.sourceContract, 'workerEvidence.sourceContract');
  requireSafeRef(errors, workerEvidence?.sourceRef, 'workerEvidence.sourceRef');
  requireSafeToken(errors, workerEvidence?.workerRunId, 'workerEvidence.workerRunId');
  requireSafeToken(errors, workerEvidence?.taskId, 'workerEvidence.taskId');
  requireExact(errors, workerEvidence?.workerProviderId, 'workerEvidence.workerProviderId', 'codex-cli');
  requireExact(errors, workerEvidence?.workerRole, 'workerEvidence.workerRole', 'worker');
  requireString(errors, workerEvidence?.taskState, 'workerEvidence.taskState');
  requireBoolean(errors, workerEvidence?.reviewRequired, 'workerEvidence.reviewRequired');
  requireBoolean(errors, workerEvidence?.taskCompleted, 'workerEvidence.taskCompleted');
  requireBoolean(errors, workerEvidence?.reviewApproved, 'workerEvidence.reviewApproved');
  requireBoolean(errors, workerEvidence?.mainVerified, 'workerEvidence.mainVerified');
  requireBoolean(errors, workerEvidence?.releaseReady, 'workerEvidence.releaseReady');
  validateStringArray(errors, workerEvidence?.changedFiles, 'workerEvidence.changedFiles', { pathLike: true });
  validateStringArray(errors, workerEvidence?.validationCommands, 'workerEvidence.validationCommands');
  validateEvidenceRefs(errors, workerEvidence?.evidenceRefs, 'workerEvidence.evidenceRefs', { requireNonEmpty: readinessState === 'ready' });

  if (readinessState === 'ready') {
    requireExact(errors, workerEvidence?.taskState, 'workerEvidence.taskState', 'needs-review');
    requireExact(errors, workerEvidence?.reviewRequired, 'workerEvidence.reviewRequired', true);
    requireExact(errors, workerEvidence?.taskCompleted, 'workerEvidence.taskCompleted', false);
    requireExact(errors, workerEvidence?.reviewApproved, 'workerEvidence.reviewApproved', false);
    requireExact(errors, workerEvidence?.mainVerified, 'workerEvidence.mainVerified', false);
    requireExact(errors, workerEvidence?.releaseReady, 'workerEvidence.releaseReady', false);
  }
}

function validateReviewerEvidence(errors, reviewerEvidence, readinessState) {
  validateAllowedFields(errors, reviewerEvidence, 'reviewerEvidence', REVIEWER_EVIDENCE_ALLOWED_FIELDS);
  requireSafeContract(errors, reviewerEvidence?.sourceContract, 'reviewerEvidence.sourceContract');
  requireSafeRef(errors, reviewerEvidence?.sourceRef, 'reviewerEvidence.sourceRef');
  requireSafeToken(errors, reviewerEvidence?.verdictId, 'reviewerEvidence.verdictId');
  requireString(errors, reviewerEvidence?.status, 'reviewerEvidence.status');
  requireSafeToken(errors, reviewerEvidence?.reviewedWorkerRunId, 'reviewerEvidence.reviewedWorkerRunId');
  requireSafeToken(errors, reviewerEvidence?.reviewerActorId, 'reviewerEvidence.reviewerActorId');
  requireSafeToken(errors, reviewerEvidence?.workerActorId, 'reviewerEvidence.workerActorId');
  requireBoolean(errors, reviewerEvidence?.reviewApproved, 'reviewerEvidence.reviewApproved');
  requireBoolean(errors, reviewerEvidence?.revisionRequired, 'reviewerEvidence.revisionRequired');
  requireBoolean(errors, reviewerEvidence?.taskCompleted, 'reviewerEvidence.taskCompleted');
  requireBoolean(errors, reviewerEvidence?.adoptionReady, 'reviewerEvidence.adoptionReady');
  requireBoolean(errors, reviewerEvidence?.mainVerified, 'reviewerEvidence.mainVerified');
  requireBoolean(errors, reviewerEvidence?.releaseReady, 'reviewerEvidence.releaseReady');
  validateEvidenceRefs(errors, reviewerEvidence?.evidenceRefs, 'reviewerEvidence.evidenceRefs', { requireNonEmpty: readinessState === 'ready' });

  if (readinessState === 'ready') {
    requireExact(errors, reviewerEvidence?.status, 'reviewerEvidence.status', 'approved');
    requireExact(errors, reviewerEvidence?.reviewApproved, 'reviewerEvidence.reviewApproved', true);
    requireExact(errors, reviewerEvidence?.revisionRequired, 'reviewerEvidence.revisionRequired', false);
    requireExact(errors, reviewerEvidence?.taskCompleted, 'reviewerEvidence.taskCompleted', false);
    requireExact(errors, reviewerEvidence?.adoptionReady, 'reviewerEvidence.adoptionReady', false);
    requireExact(errors, reviewerEvidence?.mainVerified, 'reviewerEvidence.mainVerified', false);
    requireExact(errors, reviewerEvidence?.releaseReady, 'reviewerEvidence.releaseReady', false);
  }
}

function validateWorktreeState(errors, worktreeState) {
  validateAllowedFields(errors, worktreeState, 'worktreeState', WORKTREE_STATE_ALLOWED_FIELDS);
  requireEnum(errors, worktreeState?.state, 'worktreeState.state', new Set(['clean', 'dirty']));
  requireSafeToken(errors, worktreeState?.branch, 'worktreeState.branch');
  requireBoolean(errors, worktreeState?.dirty, 'worktreeState.dirty');
  requireExact(errors, worktreeState?.expectedMainWorktree, 'worktreeState.expectedMainWorktree', true);
  requireSafeRef(errors, worktreeState?.sourceRef, 'worktreeState.sourceRef');
}

function validateSourceFingerprint(errors, sourceFingerprint) {
  validateAllowedFields(errors, sourceFingerprint, 'sourceFingerprint', SOURCE_FINGERPRINT_ALLOWED_FIELDS);
  requireHash(errors, sourceFingerprint?.expected, 'sourceFingerprint.expected');
  requireHash(errors, sourceFingerprint?.current, 'sourceFingerprint.current');
  requireHash(errors, sourceFingerprint?.workerRecorded, 'sourceFingerprint.workerRecorded');
  requireHash(errors, sourceFingerprint?.reviewerRecorded, 'sourceFingerprint.reviewerRecorded');
}

function validatePatchPlan(errors, patchPlan) {
  validateAllowedFields(errors, patchPlan, 'patchPlan', PATCH_PLAN_ALLOWED_FIELDS);
  requireSafeToken(errors, patchPlan?.patchId, 'patchPlan.patchId');
  requireSafeRef(errors, patchPlan?.patchRef, 'patchPlan.patchRef');
  requireHash(errors, patchPlan?.patchFingerprint, 'patchPlan.patchFingerprint');
  requireHash(errors, patchPlan?.expectedPatchFingerprint, 'patchPlan.expectedPatchFingerprint');
  requireHash(errors, patchPlan?.appliesToFingerprint, 'patchPlan.appliesToFingerprint');
  requireExact(errors, patchPlan?.applyCheck, 'patchPlan.applyCheck', 'passed');

  if (!Array.isArray(patchPlan?.fileChanges)) {
    errors.push('patchPlan.fileChanges must be an array');
    return;
  }

  for (const [index, change] of patchPlan.fileChanges.entries()) {
    const path = `patchPlan.fileChanges[${index}]`;

    validateAllowedFields(errors, change, path, FILE_CHANGE_ALLOWED_FIELDS);
    requireSafePath(errors, change?.path, `${path}.path`);
    requireEnum(errors, change?.operation, `${path}.operation`, FILE_OPERATION_SET);
    requireHash(errors, change?.fingerprintBefore, `${path}.fingerprintBefore`);
    requireHash(errors, change?.fingerprintAfter, `${path}.fingerprintAfter`);
  }
}

function validateAdoptionPolicy(errors, adoptionPolicy) {
  validateAllowedFields(errors, adoptionPolicy, 'adoptionPolicy', ADOPTION_POLICY_ALLOWED_FIELDS);
  requireExact(errors, adoptionPolicy?.requiresApprovedReviewer, 'adoptionPolicy.requiresApprovedReviewer', true);
  requireExact(errors, adoptionPolicy?.requiresCleanWorktree, 'adoptionPolicy.requiresCleanWorktree', true);
  requireExact(errors, adoptionPolicy?.requiresPatchFingerprintMatch, 'adoptionPolicy.requiresPatchFingerprintMatch', true);
  requireExact(errors, adoptionPolicy?.requiresSourceFingerprintMatch, 'adoptionPolicy.requiresSourceFingerprintMatch', true);
  requireExact(errors, adoptionPolicy?.supportsDeletion, 'adoptionPolicy.supportsDeletion', false);
  requireExact(errors, adoptionPolicy?.writesAdoptionJournal, 'adoptionPolicy.writesAdoptionJournal', true);
  requireExact(errors, adoptionPolicy?.rollbackRequired, 'adoptionPolicy.rollbackRequired', true);
  requireExact(errors, adoptionPolicy?.providerInvocationAllowed, 'adoptionPolicy.providerInvocationAllowed', false);
}

function validateConfirmation(errors, confirmation, readiness) {
  validateAllowedFields(errors, confirmation, 'confirmation', CONFIRMATION_ALLOWED_FIELDS);
  requireExact(errors, confirmation?.requiresPlanHash, 'confirmation.requiresPlanHash', true);
  validateStringArray(errors, confirmation?.requiredFields, 'confirmation.requiredFields');
  requireExact(errors, confirmation?.adoptionId, 'confirmation.adoptionId', readiness.adoptionId);
  requireExact(errors, confirmation?.workerRunId, 'confirmation.workerRunId', readiness.workerEvidence.workerRunId);
  requireExact(errors, confirmation?.reviewerVerdictId, 'confirmation.reviewerVerdictId', readiness.reviewerEvidence.verdictId);
  requireExact(errors, confirmation?.patchFingerprint, 'confirmation.patchFingerprint', readiness.patchPlan.patchFingerprint);
  requireExact(errors, confirmation?.sourceFingerprint, 'confirmation.sourceFingerprint', readiness.sourceFingerprint.current);
}

function validateEvidenceRefs(errors, evidenceRefs, path, { requireNonEmpty = false } = {}) {
  if (!Array.isArray(evidenceRefs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  if (requireNonEmpty && evidenceRefs.length === 0) {
    errors.push(`${path} must not be empty`);
  }

  for (const [index, ref] of evidenceRefs.entries()) {
    const refPath = `${path}[${index}]`;

    validateAllowedFields(errors, ref, refPath, EVIDENCE_REF_ALLOWED_FIELDS);
    requireEnum(errors, ref?.kind, `${refPath}.kind`, EVIDENCE_KIND_SET);
    requireSafeRef(errors, ref?.ref, `${refPath}.ref`);
    requireString(errors, ref?.label, `${refPath}.label`);
  }
}

function validateBoundaries(errors, boundaries, path) {
  validateAllowedFields(errors, boundaries, path, new Set(Object.keys(ADOPTION_MAIN_VERIFICATION_BOUNDARIES)));

  for (const [key, expected] of Object.entries(ADOPTION_MAIN_VERIFICATION_BOUNDARIES)) {
    requireExact(errors, boundaries?.[key], `${path}.${key}`, expected);
  }
}

function validateUnsafeStrings(errors, value, path) {
  for (const [textPath, text] of collectStrings(value, path)) {
    if (UNSAFE_TEXT_PATTERN.test(text)) {
      errors.push(`${textPath} contains unsafe local/raw/control text`);
    }
  }
}

function validateAllowedFields(errors, value, path, allowed) {
  if (!isPlainObject(value)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      errors.push(`${path}.${key} is not allowed`);
    }
  }
}

function validateStringArray(errors, values, path, { pathLike = false } = {}) {
  if (!Array.isArray(values)) {
    errors.push(`${path} must be an array`);
    return;
  }

  for (const [index, value] of values.entries()) {
    if (typeof value !== 'string' || value.length === 0) {
      errors.push(`${path}[${index}] must be a non-empty string`);
      continue;
    }

    if (pathLike && !isSafeRepoPath(value)) {
      errors.push(`${path}[${index}] must be a safe repository-relative path`);
    }
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function requireEnum(errors, value, path, allowed) {
  if (!allowed.has(value)) {
    errors.push(`${path} must be one of ${Array.from(allowed).join(', ')}`);
  }
}

function requireString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireSafeToken(errors, value, path) {
  if (safeToken(value) === null) {
    errors.push(`${path} must be a safe token`);
  }
}

function requireSafeContract(errors, value, path) {
  if (safeContractName(value) === null) {
    errors.push(`${path} must be a safe contract name`);
  }
}

function requireSafeRef(errors, value, path) {
  if (safeRef(value) === null) {
    errors.push(`${path} must be a safe ref`);
  }
}

function requireSafePath(errors, value, path) {
  if (!isSafeRepoPath(value)) {
    errors.push(`${path} must be a safe repository-relative path`);
  }
}

function requireHash(errors, value, path) {
  if (!HASH_PATTERN.test(value)) {
    errors.push(`${path} must be a sha256 hash`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  const date = new Date(value);

  if (typeof value !== 'string' || Number.isNaN(date.getTime()) || date.toISOString() !== value) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function safeToken(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return SAFE_TOKEN_PATTERN.test(trimmed) && !UNSAFE_TEXT_PATTERN.test(trimmed) ? trimmed : null;
}

function safeContractName(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return SAFE_CONTRACT_PATTERN.test(trimmed) ? trimmed : null;
}

function safeRef(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === '' || trimmed.includes('..') || UNSAFE_TEXT_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function safeHash(value) {
  return typeof value === 'string' && HASH_PATTERN.test(value) ? value : null;
}

function safePathArray(values) {
  return safeStringArray(values).filter(isSafeRepoPath);
}

function safeCommandArray(values) {
  return safeStringArray(values).filter((command) => /^(?:node --test|pnpm check|pnpm workbench:build|git diff --check|git diff --cached --check)\b/u.test(command));
}

function safeStringArray(values) {
  const source = Array.isArray(values) ? values : [];

  return source
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value !== '' && !UNSAFE_TEXT_PATTERN.test(value));
}

function normalizeEvidenceRefs(evidenceRefs) {
  const source = Array.isArray(evidenceRefs) ? evidenceRefs : [];

  return source
    .filter(isPlainObject)
    .map((ref) => ({
      kind: EVIDENCE_KIND_SET.has(ref.kind) ? ref.kind : 'repo-doc',
      ref: safeRef(ref.ref),
      label: firstNonEmptyString(ref.label, ref.ref)
    }))
    .filter((ref) => ref.ref !== null);
}

function isSafeRepoPath(value) {
  return typeof value === 'string' &&
    value.length > 0 &&
    !value.startsWith('/') &&
    !value.includes('..') &&
    !UNSAFE_TEXT_PATTERN.test(value) &&
    /^[a-zA-Z0-9._/-]+$/u.test(value);
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

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }

  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function collectStrings(value, path = 'value') {
  if (typeof value === 'string') {
    return [[path, value]];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStrings(item, `${path}[${index}]`));
  }

  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([key, item]) => collectStrings(item, `${path}.${key}`));
  }

  return [];
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim() !== ''))];
}

function invalidResult(message) {
  return {
    ok: false,
    errors: [message]
  };
}
