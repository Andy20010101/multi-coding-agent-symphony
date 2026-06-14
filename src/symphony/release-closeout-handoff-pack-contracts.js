export const RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_NAME = 'releaseCloseoutHandoffPack.v1';
export const RELEASE_EVIDENCE_CARRYOVER_REFS_CONTRACT_NAME = 'releaseEvidenceCarryoverRefs.v1';
export const TAG_RELEASE_OPERATOR_CHECKLIST_CONTRACT_NAME = 'tagReleaseOperatorChecklist.v1';
export const GITHUB_RELEASE_DRAFT_NOTICE_CONTRACT_NAME = 'githubReleaseDraftNotice.v1';
export const NEXT_VERSION_START_CONTEXT_CONTRACT_NAME = 'nextVersionStartContext.v1';
export const RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_VERSION = 1;

export const RELEASE_CLOSEOUT_HANDOFF_BOUNDARIES = Object.freeze({
  releaseReadyDeclarationAvailable: false,
  gitTagAvailable: false,
  gitPushAvailable: false,
  githubReleaseCreateAvailable: false,
  providerLaunchAvailable: false,
  shellAvailable: false,
  directGoalEventAppendAvailable: false,
  directTaskCompleteAvailable: false,
  automaticNextVersionGoalAvailable: false
});

const PACK_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'goal',
  'reviewGateSource',
  'closeoutSource',
  'releaseBaseline',
  'targetCommit',
  'evidenceRefs',
  'knownFacts',
  'blockedReasons',
  'operatorChecklist',
  'tagReleaseChecklist',
  'releaseEvidenceCarryoverRefs',
  'githubReleaseDraftNotice',
  'nextVersionContext',
  'sourceContracts',
  'boundaries',
  'readOnly',
  'willMutate'
]);
const GOAL_ALLOWED_FIELDS = new Set(['goalId', 'title', 'state', 'sourceContract', 'sourceRef']);
const REVIEW_GATE_SOURCE_ALLOWED_FIELDS = new Set([
  'contractName',
  'state',
  'reviewReadiness',
  'mainGateReadiness',
  'releaseGateReadiness',
  'previewHash',
  'planHash',
  'sourceRef',
  'blockedReasons'
]);
const READINESS_ALLOWED_FIELDS = new Set(['state', 'eventFamily', 'eventType', 'gateName', 'evidenceRefs', 'blockedReasons']);
const CLOSEOUT_SOURCE_ALLOWED_FIELDS = new Set([
  'contractName',
  'state',
  'summary',
  'missingCount',
  'releaseReady',
  'releaseReadySource',
  'sourceRef',
  'blockedReasons'
]);
const RELEASE_BASELINE_ALLOWED_FIELDS = new Set([
  'contractName',
  'state',
  'currentBranch',
  'currentHead',
  'mainHead',
  'originMainHead',
  'targetCommit',
  'clean',
  'sourceRef',
  'blockedReasons'
]);
const TARGET_COMMIT_ALLOWED_FIELDS = new Set([
  'state',
  'commit',
  'source',
  'expectedCommit',
  'stale',
  'blockedReasons'
]);
const CHECKLIST_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'targetTag',
  'releaseTitle',
  'targetCommit',
  'releaseNotesRefs',
  'steps',
  'commandResults',
  'boundaries',
  'copyOnly',
  'readOnly',
  'willMutate'
]);
const CHECKLIST_STEP_ALLOWED_FIELDS = new Set(['stepId', 'label', 'status', 'copyOnly', 'willMutate']);
const COMMAND_RESULTS_ALLOWED_FIELDS = new Set([
  'tag',
  'pushTag',
  'githubRelease',
  'releaseReadyDeclaration'
]);
const CARRYOVER_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'evidenceRefs',
  'sourceContracts',
  'readOnly',
  'willMutate'
]);
const GITHUB_NOTICE_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'releaseUrl',
  'releaseUrlState',
  'notesSourceRefs',
  'assetsExpected',
  'boundaries',
  'readOnly',
  'willMutate'
]);
const NEXT_VERSION_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'nextVersion',
  'runbookRef',
  'startAfterRelease',
  'createsGoal',
  'entersNextVersion',
  'readOnly',
  'willMutate'
]);
const SOURCE_CONTRACT_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'readOnly',
  'requiredFor',
  'sourceRef'
]);
const SOURCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label', 'generatedAt']);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label']);

const PACK_STATE_SET = new Set(['ready', 'blocked']);
const SOURCE_STATE_SET = new Set(['ready', 'blocked', 'missing', 'stale']);
const READINESS_STATE_SET = new Set(['ready', 'blocked', 'missing', 'stale', 'not-requested']);
const GOAL_STATE_SET = new Set(['active', 'ready', 'blocked', 'pending', 'missing', 'accepted']);
const SOURCE_REF_KIND_SET = new Set(['contract', 'fixture', 'repo-doc', 'artifact-ref', 'evidence', 'route', 'goal', 'task', 'commit']);
const EVIDENCE_REF_KIND_SET = new Set(['repo-doc', 'artifact-ref', 'commit', 'command-evidence', 'external-note']);
const COMMAND_RESULT_STATUS_SET = new Set(['not-run-by-product-code', 'recorded-externally', 'missing']);
const SOURCE_CONTRACT_NAME_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const COMMIT_PATTERN = /^[a-f0-9]{7,64}$/u;
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const RAW_FIELD_NAME_PATTERN =
  /^(?:rawTranscript|transcript|rawModelOutput|rawOutput|providerOutput|providerPayload|sessionLog|sessionPath|messages|conversation|goalLedgerInternals|executableCommand|shellCommand|commandLine)$/iu;
const UNSAFE_TEXT_PATTERN =
  /\b(?:raw[\s_-]*(?:transcript|model[\s_-]*output)|provider[\s_-]*(?:output|session|payload)|session[\s_-]*(?:log|file|path)|local[\s_-]*(?:jsonl|session)|goal[\s_-]*ledger(?:[\s_-]*internals?)?)\b|(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|\/(?:event-append|append-event|event-plan-confirm|confirm-event-plan|confirm-goal-event-plan|goal-event-confirm|record-result|mark-complete|complete-task|git|tag|publish|release)(?:$|[/\s])|\b(?:append\s+event\s+directly|mark\s+complete|declare\s+release\s+ready|release-ready\s+declaration|run\s+tag|push\s+tag|git\s+(?:push|tag|checkout|merge|commit)|gh\s+release|create\s+github\s+release|publish\s+release|run\s+shell|terminal|launch\s+provider|create\s+next\s+goal)\b/iu;

export class ReleaseCloseoutHandoffPackContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ReleaseCloseoutHandoffPackContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildReleaseCloseoutHandoffPack({
  generatedAt = new Date().toISOString(),
  goal = null,
  reviewGatePreview = null,
  reviewGateConfirmationState = null,
  closeoutReport = null,
  releaseBaseline = null,
  targetCommit = null,
  expectedTargetCommit = null,
  releaseTag = null,
  releaseTitle = null,
  reviewerEvidenceRefs = [],
  mainGateEvidenceRefs = [],
  releaseGateEvidenceRefs = [],
  validationEvidenceRefs = [],
  tagEvidenceRefs = [],
  releaseNotesRefs = [],
  githubReleaseUrl = null,
  nextVersion = null,
  nextVersionRunbookRef = null,
  knownFacts = [],
  blockedReasons: inputBlockedReasons = []
} = {}) {
  const unsafeSourceField = findUnsafeFields({
    reviewGatePreview,
    reviewGateConfirmationState,
    closeoutReport,
    releaseBaseline,
    targetCommit,
    expectedTargetCommit,
    releaseTag,
    releaseTitle,
    reviewerEvidenceRefs,
    mainGateEvidenceRefs,
    releaseGateEvidenceRefs,
    validationEvidenceRefs,
    tagEvidenceRefs,
    releaseNotesRefs,
    githubReleaseUrl,
    nextVersion,
    nextVersionRunbookRef,
    knownFacts,
    inputBlockedReasons
  }, 'source')[0];

  if (unsafeSourceField !== undefined) {
    throw new ReleaseCloseoutHandoffPackContractError(
      'unsafe-release-closeout-handoff-source',
      'Release closeout handoff source contains raw provider output, local session refs, shell commands, or mutation routes.',
      { reason: `${unsafeSourceField} must not contain raw provider output, local session refs, shell commands, or mutation routes` }
    );
  }

  const normalizedGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();
  const normalizedGoal = goalForPack({ goal, reviewGatePreview, closeoutReport });
  const reviewGateSource = reviewGateSourceFrom({ reviewGatePreview, reviewGateConfirmationState });
  const closeoutSource = closeoutSourceFrom(closeoutReport);
  const baselineSource = releaseBaselineFrom(releaseBaseline);
  const targetCommitSource = targetCommitFrom({
    targetCommit,
    expectedTargetCommit,
    releaseBaseline: baselineSource
  });
  const normalizedReviewerRefs = controlledEvidenceRefs(reviewerEvidenceRefs);
  const normalizedMainRefs = controlledEvidenceRefs(mainGateEvidenceRefs);
  const normalizedReleaseRefs = controlledEvidenceRefs(releaseGateEvidenceRefs);
  const normalizedValidationRefs = controlledEvidenceRefs(validationEvidenceRefs);
  const normalizedTagRefs = controlledEvidenceRefs(tagEvidenceRefs);
  const normalizedNotesRefs = controlledEvidenceRefs(releaseNotesRefs);
  const nextContext = buildNextVersionStartContext({
    generatedAt: normalizedGeneratedAt,
    nextVersion,
    runbookRef: nextVersionRunbookRef
  });
  const sourceContracts = sourceContractsForPack({
    reviewGatePreview,
    reviewGateConfirmationState,
    closeoutReport,
    releaseBaseline
  });
  const evidenceRefs = uniqueEvidenceRefs([
    ...normalizedReviewerRefs,
    ...normalizedMainRefs,
    ...normalizedReleaseRefs,
    ...normalizedValidationRefs,
    ...normalizedTagRefs,
    ...normalizedNotesRefs,
    ...(nextContext.runbookRef === null ? [] : [nextContext.runbookRef])
  ]);
  const derivedBlockedReasons = uniqueStrings([
    ...safeStringArray(inputBlockedReasons),
    ...safeStringArray(reviewGateSource.blockedReasons),
    ...safeStringArray(closeoutSource.blockedReasons),
    ...safeStringArray(baselineSource.blockedReasons),
    ...safeStringArray(targetCommitSource.blockedReasons),
    ...(normalizedReviewerRefs.length === 0 ? ['missing-reviewer-evidence'] : []),
    ...(normalizedMainRefs.length === 0 ? ['missing-main-gate-evidence'] : []),
    ...(normalizedReleaseRefs.length === 0 ? ['missing-release-evidence'] : []),
    ...(normalizedValidationRefs.length === 0 ? ['missing-validation-evidence'] : []),
    ...(normalizedTagRefs.length === 0 ? ['missing-tag-evidence-ref'] : []),
    ...(nextContext.state === 'blocked' ? ['missing-next-version-runbook'] : [])
  ]);
  const state = derivedBlockedReasons.length === 0 ? 'ready' : 'blocked';
  const normalizedReleaseTag = firstNonEmptyString(releaseTag, tagNameForGoal(normalizedGoal.goalId));
  const normalizedReleaseTitle = firstNonEmptyString(releaseTitle, `${normalizedReleaseTag} release`);
  const tagReleaseChecklist = buildTagReleaseOperatorChecklist({
    generatedAt: normalizedGeneratedAt,
    state,
    targetTag: normalizedReleaseTag,
    releaseTitle: normalizedReleaseTitle,
    targetCommit: targetCommitSource.commit,
    releaseNotesRefs: normalizedNotesRefs
  });
  const releaseEvidenceCarryoverRefs = buildReleaseEvidenceCarryoverRefs({
    generatedAt: normalizedGeneratedAt,
    evidenceRefs,
    sourceContracts
  });
  const githubReleaseDraftNotice = buildGithubReleaseDraftNotice({
    generatedAt: normalizedGeneratedAt,
    state,
    releaseUrl: githubReleaseUrl,
    notesSourceRefs: normalizedNotesRefs
  });

  return {
    contractName: RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_NAME,
    contractVersion: RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_VERSION,
    generatedAt: normalizedGeneratedAt,
    state,
    goal: normalizedGoal,
    reviewGateSource,
    closeoutSource,
    releaseBaseline: baselineSource,
    targetCommit: targetCommitSource,
    evidenceRefs,
    knownFacts: normalizeTextItems(knownFacts),
    blockedReasons: derivedBlockedReasons,
    operatorChecklist: tagReleaseChecklist,
    tagReleaseChecklist,
    releaseEvidenceCarryoverRefs,
    githubReleaseDraftNotice,
    nextVersionContext: nextContext,
    sourceContracts,
    boundaries: RELEASE_CLOSEOUT_HANDOFF_BOUNDARIES,
    readOnly: true,
    willMutate: false
  };
}

export function assertReleaseCloseoutHandoffPackContract(pack) {
  const validation = validateReleaseCloseoutHandoffPackContract(pack);

  if (!validation.ok) {
    throw new ReleaseCloseoutHandoffPackContractError(
      'invalid-release-closeout-handoff-pack',
      'Release closeout handoff pack contract is invalid.',
      { errors: validation.errors }
    );
  }

  return pack;
}

export function validateReleaseCloseoutHandoffPackContract(pack) {
  const errors = [];

  if (!isObject(pack)) {
    return { ok: false, errors: ['pack must be an object'] };
  }

  assertAllowedFields(errors, pack, PACK_ALLOWED_FIELDS, 'pack');
  requireEqual(errors, pack.contractName, RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_NAME, 'contractName');
  requireEqual(errors, pack.contractVersion, RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_VERSION, 'contractVersion');
  validateIsoDate(errors, pack.generatedAt, 'generatedAt');
  requireSet(errors, pack.state, PACK_STATE_SET, 'state');
  requireEqual(errors, pack.readOnly, true, 'readOnly');
  requireEqual(errors, pack.willMutate, false, 'willMutate');
  validateBoundaries(errors, pack.boundaries, 'boundaries');
  validateGoal(errors, pack.goal, 'goal');
  validateReviewGateSource(errors, pack.reviewGateSource, 'reviewGateSource');
  validateCloseoutSource(errors, pack.closeoutSource, 'closeoutSource');
  validateReleaseBaseline(errors, pack.releaseBaseline, 'releaseBaseline');
  validateTargetCommit(errors, pack.targetCommit, 'targetCommit');
  validateEvidenceRefs(errors, pack.evidenceRefs, 'evidenceRefs');
  validateTextItems(errors, pack.knownFacts, 'knownFacts');
  validateTextItems(errors, pack.blockedReasons, 'blockedReasons');
  validateTagReleaseOperatorChecklistInto(errors, pack.operatorChecklist, 'operatorChecklist');
  validateTagReleaseOperatorChecklistInto(errors, pack.tagReleaseChecklist, 'tagReleaseChecklist');
  validateReleaseEvidenceCarryoverRefsInto(errors, pack.releaseEvidenceCarryoverRefs, 'releaseEvidenceCarryoverRefs');
  validateGithubReleaseDraftNoticeInto(errors, pack.githubReleaseDraftNotice, 'githubReleaseDraftNotice');
  validateNextVersionStartContextInto(errors, pack.nextVersionContext, 'nextVersionContext');
  validateSourceContracts(errors, pack.sourceContracts, 'sourceContracts');

  for (const unsafeField of findUnsafeFields(pack, 'pack')) {
    errors.push(`${unsafeField} must not expose raw provider output, local session refs, shell commands, or mutation routes`);
  }

  if (pack.state === 'ready' && Array.isArray(pack.blockedReasons) && pack.blockedReasons.length > 0) {
    errors.push('ready pack must not include blockedReasons');
  }

  return { ok: errors.length === 0, errors };
}

export function validateTagReleaseOperatorChecklistContract(checklist) {
  const errors = [];
  validateTagReleaseOperatorChecklistInto(errors, checklist, 'checklist');
  return { ok: errors.length === 0, errors };
}

export function validateReleaseEvidenceCarryoverRefsContract(carryover) {
  const errors = [];
  validateReleaseEvidenceCarryoverRefsInto(errors, carryover, 'carryover');
  return { ok: errors.length === 0, errors };
}

export function validateGithubReleaseDraftNoticeContract(notice) {
  const errors = [];
  validateGithubReleaseDraftNoticeInto(errors, notice, 'notice');
  return { ok: errors.length === 0, errors };
}

export function validateNextVersionStartContextContract(context) {
  const errors = [];
  validateNextVersionStartContextInto(errors, context, 'context');
  return { ok: errors.length === 0, errors };
}

function buildTagReleaseOperatorChecklist({
  generatedAt,
  state,
  targetTag,
  releaseTitle,
  targetCommit,
  releaseNotesRefs
}) {
  return {
    contractName: TAG_RELEASE_OPERATOR_CHECKLIST_CONTRACT_NAME,
    contractVersion: RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_VERSION,
    generatedAt,
    state,
    targetTag,
    releaseTitle,
    targetCommit,
    releaseNotesRefs,
    steps: [
      {
        stepId: 'inspect-target-commit',
        label: 'Inspect target commit and evidence refs outside product code',
        status: state,
        copyOnly: true,
        willMutate: false
      },
      {
        stepId: 'record-tag-result',
        label: 'Record external annotated tag result after operator action',
        status: 'pending-external-action',
        copyOnly: true,
        willMutate: false
      },
      {
        stepId: 'record-release-result',
        label: 'Record external release publication result after operator action',
        status: 'pending-external-action',
        copyOnly: true,
        willMutate: false
      }
    ],
    commandResults: {
      tag: 'not-run-by-product-code',
      pushTag: 'not-run-by-product-code',
      githubRelease: 'not-run-by-product-code',
      releaseReadyDeclaration: 'not-run-by-product-code'
    },
    boundaries: RELEASE_CLOSEOUT_HANDOFF_BOUNDARIES,
    copyOnly: true,
    readOnly: true,
    willMutate: false
  };
}

function buildReleaseEvidenceCarryoverRefs({
  generatedAt,
  evidenceRefs,
  sourceContracts
}) {
  return {
    contractName: RELEASE_EVIDENCE_CARRYOVER_REFS_CONTRACT_NAME,
    contractVersion: RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_VERSION,
    generatedAt,
    evidenceRefs,
    sourceContracts,
    readOnly: true,
    willMutate: false
  };
}

function buildGithubReleaseDraftNotice({
  generatedAt,
  state,
  releaseUrl,
  notesSourceRefs
}) {
  return {
    contractName: GITHUB_RELEASE_DRAFT_NOTICE_CONTRACT_NAME,
    contractVersion: RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_VERSION,
    generatedAt,
    state,
    releaseUrl: firstNonEmptyString(releaseUrl, null),
    releaseUrlState: isNonEmptyString(releaseUrl) ? 'recorded-externally' : 'not-published-by-product-code',
    notesSourceRefs,
    assetsExpected: [],
    boundaries: RELEASE_CLOSEOUT_HANDOFF_BOUNDARIES,
    readOnly: true,
    willMutate: false
  };
}

function buildNextVersionStartContext({
  generatedAt,
  nextVersion,
  runbookRef
}) {
  const normalizedRunbookRef = evidenceRefFrom(runbookRef);

  return {
    contractName: NEXT_VERSION_START_CONTEXT_CONTRACT_NAME,
    contractVersion: RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_VERSION,
    generatedAt,
    state: normalizedRunbookRef === null ? 'blocked' : 'ready',
    nextVersion: firstNonEmptyString(nextVersion, null),
    runbookRef: normalizedRunbookRef,
    startAfterRelease: true,
    createsGoal: false,
    entersNextVersion: false,
    readOnly: true,
    willMutate: false
  };
}

function goalForPack({ goal, reviewGatePreview, closeoutReport }) {
  const candidate = isObject(goal) ? goal : {};
  const previewGoal = isObject(reviewGatePreview?.goal) ? reviewGatePreview.goal : {};

  return {
    goalId: firstNonEmptyString(candidate.goalId, previewGoal.goalId, closeoutReport?.goalId, 'unknown-goal'),
    title: firstNonEmptyString(candidate.title, previewGoal.title, closeoutReport?.title, 'Release closeout handoff'),
    state: firstNonEmptyString(candidate.state, previewGoal.state, 'active'),
    sourceContract: firstNonEmptyString(candidate.sourceContract, previewGoal.sourceContract, RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_NAME),
    sourceRef: sourceRefFrom(candidate.sourceRef ?? previewGoal.sourceRef ?? {
      kind: 'goal',
      ref: firstNonEmptyString(candidate.goalId, previewGoal.goalId, closeoutReport?.goalId, 'unknown-goal'),
      label: 'release closeout goal'
    })
  };
}

function reviewGateSourceFrom({ reviewGatePreview, reviewGateConfirmationState }) {
  if (!isObject(reviewGatePreview)) {
    return {
      contractName: null,
      state: 'missing',
      reviewReadiness: missingReadiness('reviewer-verdict', 'reviewer.approved'),
      mainGateReadiness: missingReadiness('main-gate', 'main.verification-passed', 'main-verification'),
      releaseGateReadiness: missingReadiness('release-gate', 'release.gate-passed', 'release.validation'),
      previewHash: null,
      planHash: null,
      sourceRef: null,
      blockedReasons: ['missing-review-gate-preview']
    };
  }

  const reviewReadiness = readinessFrom(reviewGatePreview.reviewReadiness, 'reviewer-verdict', 'reviewer.approved');
  const mainGateReadiness = readinessFrom(reviewGatePreview.mainGateReadiness, 'main-gate', 'main.verification-passed', 'main-verification');
  const releaseGateReadiness = readinessFrom(reviewGatePreview.releaseGateReadiness, 'release-gate', 'release.gate-passed', 'release.validation');
  const confirmationPreview = Array.isArray(reviewGatePreview.confirmationPreviews)
    ? reviewGatePreview.confirmationPreviews[0]
    : null;
  const blockedReasons = uniqueStrings([
    ...safeStringArray(reviewGatePreview.blockedReasons),
    ...safeStringArray(reviewReadiness.blockedReasons),
    ...safeStringArray(mainGateReadiness.blockedReasons),
    ...safeStringArray(releaseGateReadiness.blockedReasons),
    ...(reviewReadiness.state !== 'ready' ? ['missing-reviewer-verdict'] : []),
    ...(mainGateReadiness.state !== 'ready' ? ['missing-main-gate-evidence'] : []),
    ...(releaseGateReadiness.state !== 'ready' ? ['missing-release-evidence'] : []),
    ...(isObject(reviewGateConfirmationState) && reviewGateConfirmationState.state === 'blocked'
      ? safeStringArray(reviewGateConfirmationState.blockedReasons)
      : [])
  ]);

  return {
    contractName: firstNonEmptyString(reviewGatePreview.contractName, null),
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    reviewReadiness,
    mainGateReadiness,
    releaseGateReadiness,
    previewHash: firstNonEmptyString(confirmationPreview?.previewHash, reviewGateConfirmationState?.previewHash, null),
    planHash: firstNonEmptyString(confirmationPreview?.planHash, reviewGateConfirmationState?.planHash, null),
    sourceRef: sourceRefFrom(reviewGatePreview.sourceEvidence?.threadHandoffPackRef ?? {
      kind: 'contract',
      ref: REVIEW_GATE_SOURCE_REF,
      label: 'review gate preview'
    }),
    blockedReasons
  };
}

function closeoutSourceFrom(closeoutReport) {
  if (!isObject(closeoutReport)) {
    return {
      contractName: null,
      state: 'missing',
      summary: null,
      missingCount: null,
      releaseReady: null,
      releaseReadySource: null,
      sourceRef: null,
      blockedReasons: ['missing-closeout-report']
    };
  }

  const missing = Array.isArray(closeoutReport.missing) ? closeoutReport.missing : [];
  const blockedReasons = uniqueStrings([
    ...(missing.length > 0 ? ['closeout-report-has-missing-items'] : []),
    ...safeStringArray(closeoutReport.blockedReasons)
  ]);

  return {
    contractName: firstNonEmptyString(closeoutReport.contractName, 'goal-closeout-report.v1'),
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    summary: closeoutReport.summary ?? null,
    missingCount: missing.length,
    releaseReady: closeoutReport.summary?.releaseReady ?? null,
    releaseReadySource: closeoutReport.summary?.releaseReadySource ?? null,
    sourceRef: sourceRefFrom(closeoutReport.sourceRef ?? {
      kind: 'contract',
      ref: 'goal-closeout-report.v1',
      label: 'goal closeout report'
    }),
    blockedReasons
  };
}

function releaseBaselineFrom(releaseBaseline) {
  if (!isObject(releaseBaseline)) {
    return {
      contractName: null,
      state: 'missing',
      currentBranch: null,
      currentHead: null,
      mainHead: null,
      originMainHead: null,
      targetCommit: null,
      clean: null,
      sourceRef: null,
      blockedReasons: ['missing-release-baseline']
    };
  }

  const status = firstNonEmptyString(releaseBaseline.status, releaseBaseline.state, null);
  const currentBranch = firstNonEmptyString(
    releaseBaseline.currentBranch,
    releaseBaseline.releaseBaseline?.currentBranch,
    releaseBaseline.activeContext?.branch,
    null
  );
  const currentHead = firstNonEmptyString(
    releaseBaseline.currentHeadFull,
    releaseBaseline.currentHead,
    releaseBaseline.releaseBaseline?.currentHeadFull,
    releaseBaseline.releaseBaseline?.currentHead,
    null
  );
  const mainHead = firstNonEmptyString(
    releaseBaseline.mainHead,
    releaseBaseline.releaseBaseline?.mainHead,
    null
  );
  const originMainHead = firstNonEmptyString(
    releaseBaseline.originMainHead,
    releaseBaseline.releaseBaseline?.originMainHead,
    null
  );
  const clean = releaseBaseline.clean ?? releaseBaseline.releaseBaseline?.clean ?? releaseBaseline.worktreeClean ?? null;
  const blockedReasons = uniqueStrings([
    ...(status !== 'ready' ? ['dirty-or-diverged-release-baseline'] : []),
    ...(currentBranch !== null && currentBranch !== 'main' ? ['release-baseline-not-main'] : []),
    ...(mainHead !== null && originMainHead !== null && mainHead !== originMainHead ? ['main-origin-diverged'] : []),
    ...(clean === false ? ['release-baseline-dirty'] : []),
    ...safeStringArray(releaseBaseline.blockedReasons)
  ]);

  return {
    contractName: firstNonEmptyString(releaseBaseline.contractName, 'release-baseline-resolver.v1'),
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    currentBranch,
    currentHead,
    mainHead,
    originMainHead,
    targetCommit: firstNonEmptyString(currentHead, mainHead, originMainHead, null),
    clean,
    sourceRef: sourceRefFrom(releaseBaseline.sourceRef ?? {
      kind: 'contract',
      ref: 'release-baseline-resolver.v1',
      label: 'release baseline'
    }),
    blockedReasons
  };
}

function targetCommitFrom({
  targetCommit,
  expectedTargetCommit,
  releaseBaseline
}) {
  const commit = firstNonEmptyString(
    typeof targetCommit === 'string' ? targetCommit : targetCommit?.commit,
    releaseBaseline.targetCommit,
    null
  );
  const expectedCommit = firstNonEmptyString(expectedTargetCommit, targetCommit?.expectedCommit, null);
  const stale = expectedCommit !== null && commit !== null && expectedCommit !== commit;
  const blockedReasons = uniqueStrings([
    ...(commit === null ? ['missing-target-commit'] : []),
    ...(stale ? ['stale-target-commit'] : []),
    ...safeStringArray(targetCommit?.blockedReasons)
  ]);

  return {
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    commit,
    source: firstNonEmptyString(targetCommit?.source, 'release-baseline-resolver.v1'),
    expectedCommit,
    stale,
    blockedReasons
  };
}

const REVIEW_GATE_SOURCE_REF = 'reviewGatePreview.v1';

function sourceContractsForPack({
  reviewGatePreview,
  reviewGateConfirmationState,
  closeoutReport,
  releaseBaseline
}) {
  return [
    {
      contractName: firstNonEmptyString(reviewGatePreview?.contractName, 'reviewGatePreview.v1'),
      contractVersion: Number.isInteger(reviewGatePreview?.contractVersion) ? reviewGatePreview.contractVersion : 1,
      readOnly: true,
      requiredFor: ['review-gate-source'],
      sourceRef: sourceRefFrom({ kind: 'contract', ref: 'reviewGatePreview.v1', label: 'review gate preview' })
    },
    {
      contractName: firstNonEmptyString(reviewGateConfirmationState?.contractName, 'reviewGateControlledConfirmationState.v1'),
      contractVersion: Number.isInteger(reviewGateConfirmationState?.contractVersion) ? reviewGateConfirmationState.contractVersion : 1,
      readOnly: true,
      requiredFor: ['review-gate-confirmation-state'],
      sourceRef: sourceRefFrom({ kind: 'contract', ref: 'reviewGateControlledConfirmationState.v1', label: 'review gate confirmation state' })
    },
    {
      contractName: firstNonEmptyString(closeoutReport?.contractName, 'goal-closeout-report.v1'),
      contractVersion: Number.isInteger(closeoutReport?.contractVersion) ? closeoutReport.contractVersion : 1,
      readOnly: true,
      requiredFor: ['closeout-source'],
      sourceRef: sourceRefFrom({ kind: 'contract', ref: 'goal-closeout-report.v1', label: 'goal closeout report' })
    },
    {
      contractName: firstNonEmptyString(releaseBaseline?.contractName, 'release-baseline-resolver.v1'),
      contractVersion: Number.isInteger(releaseBaseline?.contractVersion) ? releaseBaseline.contractVersion : 1,
      readOnly: true,
      requiredFor: ['release-baseline'],
      sourceRef: sourceRefFrom({ kind: 'contract', ref: 'release-baseline-resolver.v1', label: 'release baseline' })
    }
  ];
}

function readinessFrom(readiness, eventFamily, eventType, gateName = null) {
  if (!isObject(readiness)) {
    return missingReadiness(eventFamily, eventType, gateName);
  }

  return {
    state: firstNonEmptyString(readiness.state, readiness.readinessState, 'missing'),
    eventFamily: firstNonEmptyString(readiness.eventFamily, eventFamily),
    eventType: firstNonEmptyString(readiness.eventType, eventType),
    gateName: firstNonEmptyString(readiness.gateName, gateName),
    evidenceRefs: controlledEvidenceRefs(readiness.evidenceRefs),
    blockedReasons: safeStringArray(readiness.blockedReasons)
  };
}

function missingReadiness(eventFamily, eventType, gateName = null) {
  return {
    state: 'missing',
    eventFamily,
    eventType,
    gateName,
    evidenceRefs: [],
    blockedReasons: [`missing-${eventFamily}`]
  };
}

function validateGoal(errors, goal, path) {
  if (!isObject(goal)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, goal, GOAL_ALLOWED_FIELDS, path);
  requireNonEmptyString(errors, goal.goalId, `${path}.goalId`);
  requireNonEmptyString(errors, goal.title, `${path}.title`);
  requireSet(errors, goal.state, GOAL_STATE_SET, `${path}.state`);
  requireNonEmptyString(errors, goal.sourceContract, `${path}.sourceContract`);
  validateSourceRef(errors, goal.sourceRef, `${path}.sourceRef`);
}

function validateReviewGateSource(errors, source, path) {
  if (!isObject(source)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, source, REVIEW_GATE_SOURCE_ALLOWED_FIELDS, path);
  requireSet(errors, source.state, SOURCE_STATE_SET, `${path}.state`);
  validateReadiness(errors, source.reviewReadiness, `${path}.reviewReadiness`);
  validateReadiness(errors, source.mainGateReadiness, `${path}.mainGateReadiness`);
  validateReadiness(errors, source.releaseGateReadiness, `${path}.releaseGateReadiness`);
  optionalHash(errors, source.previewHash, `${path}.previewHash`);
  optionalHash(errors, source.planHash, `${path}.planHash`);
  validateOptionalSourceRef(errors, source.sourceRef, `${path}.sourceRef`);
  validateTextItems(errors, source.blockedReasons, `${path}.blockedReasons`);
}

function validateReadiness(errors, readiness, path) {
  if (!isObject(readiness)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, readiness, READINESS_ALLOWED_FIELDS, path);
  requireSet(errors, readiness.state, READINESS_STATE_SET, `${path}.state`);
  requireNonEmptyString(errors, readiness.eventFamily, `${path}.eventFamily`);
  requireNonEmptyString(errors, readiness.eventType, `${path}.eventType`);
  validateEvidenceRefs(errors, readiness.evidenceRefs, `${path}.evidenceRefs`);
  validateTextItems(errors, readiness.blockedReasons, `${path}.blockedReasons`);
}

function validateCloseoutSource(errors, source, path) {
  if (!isObject(source)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, source, CLOSEOUT_SOURCE_ALLOWED_FIELDS, path);
  requireSet(errors, source.state, SOURCE_STATE_SET, `${path}.state`);
  optionalNonNegativeInteger(errors, source.missingCount, `${path}.missingCount`);
  validateOptionalSourceRef(errors, source.sourceRef, `${path}.sourceRef`);
  validateTextItems(errors, source.blockedReasons, `${path}.blockedReasons`);
}

function validateReleaseBaseline(errors, baseline, path) {
  if (!isObject(baseline)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, baseline, RELEASE_BASELINE_ALLOWED_FIELDS, path);
  requireSet(errors, baseline.state, SOURCE_STATE_SET, `${path}.state`);
  optionalCommit(errors, baseline.currentHead, `${path}.currentHead`);
  optionalCommit(errors, baseline.mainHead, `${path}.mainHead`);
  optionalCommit(errors, baseline.originMainHead, `${path}.originMainHead`);
  optionalCommit(errors, baseline.targetCommit, `${path}.targetCommit`);
  validateOptionalSourceRef(errors, baseline.sourceRef, `${path}.sourceRef`);
  validateTextItems(errors, baseline.blockedReasons, `${path}.blockedReasons`);
}

function validateTargetCommit(errors, target, path) {
  if (!isObject(target)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, target, TARGET_COMMIT_ALLOWED_FIELDS, path);
  requireSet(errors, target.state, SOURCE_STATE_SET, `${path}.state`);
  optionalCommit(errors, target.commit, `${path}.commit`);
  optionalCommit(errors, target.expectedCommit, `${path}.expectedCommit`);
  validateTextItems(errors, target.blockedReasons, `${path}.blockedReasons`);
}

function validateTagReleaseOperatorChecklistInto(errors, checklist, path) {
  if (!isObject(checklist)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, checklist, CHECKLIST_ALLOWED_FIELDS, path);
  requireEqual(errors, checklist.contractName, TAG_RELEASE_OPERATOR_CHECKLIST_CONTRACT_NAME, `${path}.contractName`);
  requireEqual(errors, checklist.contractVersion, RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_VERSION, `${path}.contractVersion`);
  validateIsoDate(errors, checklist.generatedAt, `${path}.generatedAt`);
  requireSet(errors, checklist.state, PACK_STATE_SET, `${path}.state`);
  requireNonEmptyString(errors, checklist.targetTag, `${path}.targetTag`);
  requireNonEmptyString(errors, checklist.releaseTitle, `${path}.releaseTitle`);
  optionalCommit(errors, checklist.targetCommit, `${path}.targetCommit`);
  validateEvidenceRefs(errors, checklist.releaseNotesRefs, `${path}.releaseNotesRefs`);
  validateChecklistSteps(errors, checklist.steps, `${path}.steps`);
  validateCommandResults(errors, checklist.commandResults, `${path}.commandResults`);
  validateBoundaries(errors, checklist.boundaries, `${path}.boundaries`);
  requireEqual(errors, checklist.copyOnly, true, `${path}.copyOnly`);
  requireEqual(errors, checklist.readOnly, true, `${path}.readOnly`);
  requireEqual(errors, checklist.willMutate, false, `${path}.willMutate`);
}

function validateChecklistSteps(errors, steps, path) {
  if (!Array.isArray(steps) || steps.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  steps.forEach((step, index) => {
    const itemPath = `${path}[${index}]`;

    if (!isObject(step)) {
      errors.push(`${itemPath} must be an object`);
      return;
    }

    assertAllowedFields(errors, step, CHECKLIST_STEP_ALLOWED_FIELDS, itemPath);
    requireNonEmptyString(errors, step.stepId, `${itemPath}.stepId`);
    requireNonEmptyString(errors, step.label, `${itemPath}.label`);
    requireNonEmptyString(errors, step.status, `${itemPath}.status`);
    requireEqual(errors, step.copyOnly, true, `${itemPath}.copyOnly`);
    requireEqual(errors, step.willMutate, false, `${itemPath}.willMutate`);
  });
}

function validateCommandResults(errors, commandResults, path) {
  if (!isObject(commandResults)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, commandResults, COMMAND_RESULTS_ALLOWED_FIELDS, path);

  for (const key of COMMAND_RESULTS_ALLOWED_FIELDS) {
    requireSet(errors, commandResults[key], COMMAND_RESULT_STATUS_SET, `${path}.${key}`);
  }
}

function validateReleaseEvidenceCarryoverRefsInto(errors, carryover, path) {
  if (!isObject(carryover)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, carryover, CARRYOVER_ALLOWED_FIELDS, path);
  requireEqual(errors, carryover.contractName, RELEASE_EVIDENCE_CARRYOVER_REFS_CONTRACT_NAME, `${path}.contractName`);
  requireEqual(errors, carryover.contractVersion, RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_VERSION, `${path}.contractVersion`);
  validateIsoDate(errors, carryover.generatedAt, `${path}.generatedAt`);
  validateEvidenceRefs(errors, carryover.evidenceRefs, `${path}.evidenceRefs`);
  validateSourceContracts(errors, carryover.sourceContracts, `${path}.sourceContracts`);
  requireEqual(errors, carryover.readOnly, true, `${path}.readOnly`);
  requireEqual(errors, carryover.willMutate, false, `${path}.willMutate`);
}

function validateGithubReleaseDraftNoticeInto(errors, notice, path) {
  if (!isObject(notice)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, notice, GITHUB_NOTICE_ALLOWED_FIELDS, path);
  requireEqual(errors, notice.contractName, GITHUB_RELEASE_DRAFT_NOTICE_CONTRACT_NAME, `${path}.contractName`);
  requireEqual(errors, notice.contractVersion, RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_VERSION, `${path}.contractVersion`);
  validateIsoDate(errors, notice.generatedAt, `${path}.generatedAt`);
  requireSet(errors, notice.state, PACK_STATE_SET, `${path}.state`);
  if (notice.releaseUrl !== null && typeof notice.releaseUrl !== 'string') {
    errors.push(`${path}.releaseUrl must be null or string`);
  }
  requireNonEmptyString(errors, notice.releaseUrlState, `${path}.releaseUrlState`);
  validateEvidenceRefs(errors, notice.notesSourceRefs, `${path}.notesSourceRefs`);
  if (!Array.isArray(notice.assetsExpected)) {
    errors.push(`${path}.assetsExpected must be an array`);
  }
  validateBoundaries(errors, notice.boundaries, `${path}.boundaries`);
  requireEqual(errors, notice.readOnly, true, `${path}.readOnly`);
  requireEqual(errors, notice.willMutate, false, `${path}.willMutate`);
}

function validateNextVersionStartContextInto(errors, context, path) {
  if (!isObject(context)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, context, NEXT_VERSION_ALLOWED_FIELDS, path);
  requireEqual(errors, context.contractName, NEXT_VERSION_START_CONTEXT_CONTRACT_NAME, `${path}.contractName`);
  requireEqual(errors, context.contractVersion, RELEASE_CLOSEOUT_HANDOFF_PACK_CONTRACT_VERSION, `${path}.contractVersion`);
  validateIsoDate(errors, context.generatedAt, `${path}.generatedAt`);
  requireSet(errors, context.state, PACK_STATE_SET, `${path}.state`);
  if (context.nextVersion !== null) {
    requireNonEmptyString(errors, context.nextVersion, `${path}.nextVersion`);
  }
  if (context.runbookRef !== null) {
    validateEvidenceRef(errors, context.runbookRef, `${path}.runbookRef`);
  }
  requireEqual(errors, context.startAfterRelease, true, `${path}.startAfterRelease`);
  requireEqual(errors, context.createsGoal, false, `${path}.createsGoal`);
  requireEqual(errors, context.entersNextVersion, false, `${path}.entersNextVersion`);
  requireEqual(errors, context.readOnly, true, `${path}.readOnly`);
  requireEqual(errors, context.willMutate, false, `${path}.willMutate`);
}

function validateSourceContracts(errors, sourceContracts, path) {
  if (!Array.isArray(sourceContracts) || sourceContracts.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  sourceContracts.forEach((sourceContract, index) => {
    const itemPath = `${path}[${index}]`;

    if (!isObject(sourceContract)) {
      errors.push(`${itemPath} must be an object`);
      return;
    }

    assertAllowedFields(errors, sourceContract, SOURCE_CONTRACT_ALLOWED_FIELDS, itemPath);
    requirePattern(errors, sourceContract.contractName, SOURCE_CONTRACT_NAME_PATTERN, `${itemPath}.contractName`);
    if (!Number.isInteger(sourceContract.contractVersion) || sourceContract.contractVersion <= 0) {
      errors.push(`${itemPath}.contractVersion must be a positive integer`);
    }
    requireEqual(errors, sourceContract.readOnly, true, `${itemPath}.readOnly`);
    validateTextItems(errors, sourceContract.requiredFor, `${itemPath}.requiredFor`);
    validateSourceRef(errors, sourceContract.sourceRef, `${itemPath}.sourceRef`);
  });
}

function validateEvidenceRefs(errors, refs, path) {
  if (!Array.isArray(refs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  refs.forEach((ref, index) => validateEvidenceRef(errors, ref, `${path}[${index}]`));
}

function validateEvidenceRef(errors, ref, path) {
  if (!isObject(ref)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, ref, EVIDENCE_REF_ALLOWED_FIELDS, path);
  requireSet(errors, ref.kind, EVIDENCE_REF_KIND_SET, `${path}.kind`);
  requireNonEmptyString(errors, ref.ref, `${path}.ref`);
  requireNonEmptyString(errors, ref.label, `${path}.label`);
}

function validateOptionalSourceRef(errors, ref, path) {
  if (ref === null || ref === undefined) {
    return;
  }

  validateSourceRef(errors, ref, path);
}

function validateSourceRef(errors, ref, path) {
  if (!isObject(ref)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertAllowedFields(errors, ref, SOURCE_REF_ALLOWED_FIELDS, path);
  requireSet(errors, ref.kind, SOURCE_REF_KIND_SET, `${path}.kind`);
  requireNonEmptyString(errors, ref.ref, `${path}.ref`);
  requireNonEmptyString(errors, ref.label, `${path}.label`);

  if (ref.generatedAt !== undefined) {
    validateIsoDate(errors, ref.generatedAt, `${path}.generatedAt`);
  }
}

function validateBoundaries(errors, boundaries, path) {
  if (!isObject(boundaries)) {
    errors.push(`${path} must be an object`);
    return;
  }

  for (const [key, expected] of Object.entries(RELEASE_CLOSEOUT_HANDOFF_BOUNDARIES)) {
    requireEqual(errors, boundaries[key], expected, `${path}.${key}`);
  }
}

function controlledEvidenceRefs(refs) {
  return (Array.isArray(refs) ? refs : [])
    .map(evidenceRefFrom)
    .filter((ref) => ref !== null);
}

function evidenceRefFrom(ref) {
  if (typeof ref === 'string') {
    return { kind: 'repo-doc', ref, label: ref };
  }

  if (!isObject(ref)) {
    return null;
  }

  const normalizedRef = firstNonEmptyString(ref.ref, ref.path, ref.uri, null);

  if (normalizedRef === null) {
    return null;
  }

  return {
    kind: firstNonEmptyString(ref.kind, 'repo-doc'),
    ref: normalizedRef,
    label: firstNonEmptyString(ref.label, ref.title, normalizedRef)
  };
}

function sourceRefFrom(ref) {
  if (typeof ref === 'string') {
    return { kind: 'contract', ref, label: ref };
  }

  if (!isObject(ref)) {
    return null;
  }

  const normalizedRef = firstNonEmptyString(ref.ref, ref.path, ref.uri, null);

  if (normalizedRef === null) {
    return null;
  }

  return {
    kind: firstNonEmptyString(ref.kind, 'contract'),
    ref: normalizedRef,
    label: firstNonEmptyString(ref.label, ref.title, normalizedRef),
    ...(ref.generatedAt === undefined ? {} : { generatedAt: ref.generatedAt })
  };
}

function uniqueEvidenceRefs(refs) {
  const seen = new Set();
  const unique = [];

  for (const ref of refs) {
    if (!isObject(ref)) {
      continue;
    }

    const key = `${ref.kind}:${ref.ref}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(ref);
  }

  return unique;
}

function findUnsafeFields(value, path, visited = new Set()) {
  const findings = [];

  if (value === null || value === undefined) {
    return findings;
  }

  if (typeof value === 'string') {
    if (isAllowedControlledConfirmationRoute(path, value)) {
      return findings;
    }

    if (UNSAFE_TEXT_PATTERN.test(value)) {
      findings.push(path);
    }

    return findings;
  }

  if (typeof value !== 'object') {
    return findings;
  }

  if (visited.has(value)) {
    return findings;
  }

  visited.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      findings.push(...findUnsafeFields(item, `${path}[${index}]`, visited));
    });
    return findings;
  }

  for (const [key, nested] of Object.entries(value)) {
    const fieldPath = `${path}.${key}`;

    if (RAW_FIELD_NAME_PATTERN.test(key)) {
      findings.push(fieldPath);
      continue;
    }

    findings.push(...findUnsafeFields(nested, fieldPath, visited));
  }

  return findings;
}

function isAllowedControlledConfirmationRoute(path, value) {
  return path.startsWith('source.reviewGateConfirmationState.')
    && /\/api\/goals\/[a-zA-Z0-9._:-]+\/event-plan-(?:preview|confirm)$/u.test(value);
}

function assertAllowedFields(errors, value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      errors.push(`${path}.${key} is not allowed`);
    }
  }
}

function requireEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireSet(errors, value, allowed, path) {
  if (!allowed.has(value)) {
    errors.push(`${path} must be one of ${Array.from(allowed).join(', ')}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (!isNonEmptyString(value)) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requirePattern(errors, value, pattern, path) {
  if (!isNonEmptyString(value) || !pattern.test(value)) {
    errors.push(`${path} must match ${pattern}`);
  }
}

function optionalHash(errors, value, path) {
  if (value === null || value === undefined) {
    return;
  }

  requirePattern(errors, value, HASH_PATTERN, path);
}

function optionalCommit(errors, value, path) {
  if (value === null || value === undefined) {
    return;
  }

  requirePattern(errors, value, COMMIT_PATTERN, path);
}

function optionalNonNegativeInteger(errors, value, path) {
  if (value === null || value === undefined) {
    return;
  }

  if (!Number.isInteger(value) || value < 0) {
    errors.push(`${path} must be a non-negative integer`);
  }
}

function validateTextItems(errors, items, path) {
  if (!Array.isArray(items)) {
    errors.push(`${path} must be an array`);
    return;
  }

  items.forEach((item, index) => {
    if (!isNonEmptyString(item)) {
      errors.push(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function validateIsoDate(errors, value, path) {
  if (!isNonEmptyString(value) || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO date string`);
  }
}

function millisOrNow(value) {
  const millis = Date.parse(value);
  return Number.isFinite(millis) ? millis : Date.now();
}

function normalizeTextItems(items) {
  return safeStringArray(items);
}

function safeStringArray(value) {
  return (Array.isArray(value) ? value : [])
    .filter(isNonEmptyString);
}

function uniqueStrings(items) {
  return Array.from(new Set(items.filter(isNonEmptyString)));
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (isNonEmptyString(value)) {
      return value;
    }
  }

  return null;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function tagNameForGoal(goalId) {
  const match = /^v[0-9]+/u.exec(goalId ?? '');
  return match?.[0] ?? 'v-next';
}
