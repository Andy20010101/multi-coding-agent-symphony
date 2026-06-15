export const OPERATION_TIMELINE_CONTRACT_NAME = 'operationTimeline.v1';
export const OPERATION_FAILURE_CLASSIFICATION_CONTRACT_NAME = 'operationFailureClassification.v1';
export const RUN_RECOVERY_CONTRACT_VERSION = 1;
export const V69_RECOVERY_RESUME_DIAGNOSTICS_OBSERVABILITY_GOAL_ID =
  'v69-recovery-resume-diagnostics-observability';

export const RUN_RECOVERY_FAILURE_LAYERS = Object.freeze([
  'schema',
  'provider',
  'workspace',
  'verifier',
  'artifact',
  'review',
  'adoption',
  'git',
  'test',
  'release-boundary',
  'unknown'
]);

export const RUN_RECOVERY_BOUNDARIES = Object.freeze({
  backendOwnedPreviewConfirm: true,
  requiresPlanHashBinding: true,
  requiresFingerprintBinding: true,
  boundedDiagnosticsOnly: true,
  usageCostMustBeObserved: true,
  hiddenRetryAvailable: false,
  retryWithDifferentProviderWithoutPreview: false,
  genericShellAvailable: false,
  genericTerminalAvailable: false,
  rendererCommandExecutionAvailable: false,
  frontendLocalJsonlReadAvailable: false,
  frontendLocalSessionReadAvailable: false,
  frontendProviderFolderReadAvailable: false,
  symphonyInternalsReadAvailable: false,
  rawTranscriptAvailable: false,
  rawProviderOutputAvailable: false,
  rawModelOutputAvailable: false,
  providerPayloadAvailable: false,
  providerOutputMutationAvailable: false,
  automaticSelfReviewAvailable: false,
  automaticWorktreeCreationAvailable: false,
  automaticNextVersionGoalAvailable: false,
  productGitAutomationAvailable: false,
  githubReleaseAutomationAvailable: false
});

const TIMELINE_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'operationId',
  'goal',
  'task',
  'status',
  'startedAt',
  'finishedAt',
  'steps',
  'failureClassification',
  'artifactRefs',
  'evidenceRefs',
  'nextSafeAction',
  'boundaries'
]);
const CLASSIFICATION_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'classificationId',
  'generatedAt',
  'operationId',
  'stepId',
  'phase',
  'status',
  'providerId',
  'role',
  'failureLayer',
  'failureCode',
  'summary',
  'retryable',
  'resumeEligibility',
  'planHash',
  'sourceFingerprint',
  'artifactRefs',
  'evidenceRefs',
  'recoveryActions',
  'nextSafeAction',
  'boundaries'
]);
const GOAL_ALLOWED_FIELDS = new Set(['goalId', 'title', 'state', 'sourceContract', 'sourceRef']);
const TASK_ALLOWED_FIELDS = new Set(['taskId', 'title', 'state', 'sourceContract', 'sourceRef']);
const STEP_ALLOWED_FIELDS = new Set([
  'stepId',
  'label',
  'phase',
  'status',
  'startedAt',
  'finishedAt',
  'providerId',
  'role',
  'artifactRefs',
  'evidenceRefs',
  'failure'
]);
const FAILURE_SUMMARY_ALLOWED_FIELDS = new Set([
  'classificationId',
  'failureLayer',
  'failureCode',
  'stepId',
  'retryable',
  'resumeEligible'
]);
const RESUME_ELIGIBILITY_ALLOWED_FIELDS = new Set([
  'eligible',
  'reason',
  'requiresPlanHashMatch',
  'requiresFingerprintMatch',
  'requiresOperatorConfirm',
  'blockedReasons'
]);
const PLAN_HASH_ALLOWED_FIELDS = new Set(['expected', 'current', 'matches']);
const ACTION_ALLOWED_FIELDS = new Set([
  'actionId',
  'label',
  'backendOwned',
  'requiresPreview',
  'requiresConfirm',
  'willMutate',
  'allowed',
  'blockedReasons'
]);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label']);

const TIMELINE_STATUS_SET = new Set(['pending', 'running', 'succeeded', 'failed', 'blocked', 'timeout', 'interrupted']);
const FAILURE_STATUS_SET = new Set(['failed', 'blocked', 'timeout', 'interrupted']);
const PHASE_SET = new Set([
  'worker-run',
  'reviewer-run',
  'adoption-preview',
  'adoption-confirm',
  'main-verification',
  'gate-draft',
  'release-boundary'
]);
const ROLE_SET = new Set(['worker', 'reviewer', 'operator', 'verifier', 'system']);
const EVIDENCE_KIND_SET = new Set(['repo-doc', 'artifact-ref', 'command-evidence', 'handoff-pack', 'operation-record']);
const RECOVERY_ACTION_SET = new Set([
  'retry-same-provider',
  'handoff-allowed-provider',
  'mark-blocked',
  'rerun-verification',
  'inspect-adoption-journal',
  'request-operator-decision',
  'wait-for-provider',
  'refresh-plan-preview'
]);
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const SAFE_CONTRACT_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const UNSAFE_TEXT_PATTERN =
  /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|\b(?:raw[\s_-]*(?:worker[\s_-]*)?(?:transcript|model[\s_-]*output|provider[\s_-]*output|output)|provider[\s_-]*(?:session|folder|payload)|session[\s_-]*(?:path|file|log)|generic[\s_-]*(?:shell|terminal)|arbitrary[\s_-]*command|freeform[\s_-]*(?:command|provider[\s_-]*command)|renderer[\s_-]*command|append[\s_-]*event|task[\s_-]*(?:complete|completion)|release[\s_-]*(?:ready|readiness)|git[\s_-]*(?:merge|push|tag)|github[\s_-]*release|hidden[\s_-]*retry)\b/iu;

const DEFAULT_HASH = 'sha256:1111111111111111111111111111111111111111111111111111111111111111';

export class RunRecoveryContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'RunRecoveryContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildOperationFailureClassification({
  generatedAt = new Date().toISOString(),
  classificationId = null,
  operationId = 'operation-v69-recovery',
  stepId = 'worker-run',
  phase = 'worker-run',
  status = 'failed',
  providerId = null,
  role = null,
  failureLayer = 'unknown',
  failureCode = null,
  summary = null,
  retryable = null,
  resumeEligibility = null,
  planHash = null,
  sourceFingerprint = null,
  artifactRefs = null,
  evidenceRefs = null,
  recoveryActions = null,
  nextSafeAction = null
} = {}) {
  const normalizedOperationId = safeToken(operationId) ?? 'operation-v69-recovery';
  const normalizedStepId = safeToken(stepId) ?? 'step-v69-recovery';
  const normalizedLayer = normalizeFailureLayer(failureLayer);
  const normalizedStatus = normalizeFailureStatus(status);
  const normalizedFailureCode = safeToken(failureCode) ?? defaultFailureCode(normalizedLayer, normalizedStatus);
  const normalizedRetryable = typeof retryable === 'boolean'
    ? retryable
    : defaultRetryable(normalizedLayer, normalizedFailureCode, normalizedStatus);
  const normalizedPlanHash = normalizeMatchSet(planHash, DEFAULT_HASH);
  const normalizedFingerprint = normalizeMatchSet(sourceFingerprint, DEFAULT_HASH);
  const normalizedResumeEligibility = normalizeResumeEligibility({
    resumeEligibility,
    retryable: normalizedRetryable,
    failureLayer: normalizedLayer,
    failureCode: normalizedFailureCode,
    planHash: normalizedPlanHash,
    sourceFingerprint: normalizedFingerprint
  });
  const normalizedRecoveryActions = normalizeRecoveryActions(
    recoveryActions,
    defaultRecoveryActions({
      failureLayer: normalizedLayer,
      failureCode: normalizedFailureCode,
      retryable: normalizedRetryable,
      resumeEligibility: normalizedResumeEligibility
    })
  );
  const normalizedNextSafeAction = normalizeAction(nextSafeAction) ??
    normalizedRecoveryActions.find((action) => action.allowed) ??
    defaultOperatorDecisionAction();
  const classification = {
    contractName: OPERATION_FAILURE_CLASSIFICATION_CONTRACT_NAME,
    contractVersion: RUN_RECOVERY_CONTRACT_VERSION,
    classificationId: safeToken(classificationId) ??
      `classification-v69-${normalizedOperationId}-${normalizedStepId}`,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    operationId: normalizedOperationId,
    stepId: normalizedStepId,
    phase: PHASE_SET.has(phase) ? phase : 'worker-run',
    status: normalizedStatus,
    providerId: safeNullableToken(providerId),
    role: ROLE_SET.has(role) ? role : inferRole(phase),
    failureLayer: normalizedLayer,
    failureCode: normalizedFailureCode,
    summary: safeSummary(summary) ?? defaultSummary(normalizedLayer, normalizedFailureCode),
    retryable: normalizedRetryable,
    resumeEligibility: normalizedResumeEligibility,
    planHash: normalizedPlanHash,
    sourceFingerprint: normalizedFingerprint,
    artifactRefs: normalizeEvidenceRefs(artifactRefs),
    evidenceRefs: normalizeEvidenceRefs(evidenceRefs),
    recoveryActions: normalizedRecoveryActions,
    nextSafeAction: normalizedNextSafeAction,
    boundaries: { ...RUN_RECOVERY_BOUNDARIES }
  };

  assertOperationFailureClassificationContract(classification);

  return classification;
}

export function buildOperationTimeline({
  generatedAt = new Date().toISOString(),
  operationId = 'operation-v69-recovery',
  goal = null,
  task = null,
  status = 'failed',
  startedAt = generatedAt,
  finishedAt = generatedAt,
  steps = null,
  failureClassification = null,
  artifactRefs = null,
  evidenceRefs = null,
  nextSafeAction = null
} = {}) {
  const normalizedOperationId = safeToken(operationId) ?? 'operation-v69-recovery';
  const normalizedStatus = TIMELINE_STATUS_SET.has(status) ? status : 'failed';
  const normalizedFailureClassification = failureClassification === null
    ? null
    : failureSummaryFromClassification(failureClassification);
  const normalizedSteps = normalizeTimelineSteps(steps, normalizedOperationId, normalizedFailureClassification);
  const normalizedArtifactRefs = normalizeEvidenceRefs(artifactRefs ?? refsFromSteps(normalizedSteps, 'artifactRefs'));
  const normalizedEvidenceRefs = normalizeEvidenceRefs(evidenceRefs ?? refsFromSteps(normalizedSteps, 'evidenceRefs'));
  const normalizedNextSafeAction = normalizeAction(nextSafeAction) ??
    (isFailureStatus(normalizedStatus) && isPlainObject(failureClassification)
      ? normalizeAction(failureClassification.nextSafeAction)
      : null);
  const timeline = {
    contractName: OPERATION_TIMELINE_CONTRACT_NAME,
    contractVersion: RUN_RECOVERY_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    operationId: normalizedOperationId,
    goal: normalizeGoal(goal),
    task: normalizeTask(task),
    status: normalizedStatus,
    startedAt: new Date(millisOrNow(startedAt)).toISOString(),
    finishedAt: new Date(millisOrNow(finishedAt)).toISOString(),
    steps: normalizedSteps,
    failureClassification: normalizedFailureClassification,
    artifactRefs: normalizedArtifactRefs,
    evidenceRefs: normalizedEvidenceRefs,
    nextSafeAction: normalizedNextSafeAction,
    boundaries: { ...RUN_RECOVERY_BOUNDARIES }
  };

  assertOperationTimelineContract(timeline);

  return timeline;
}

export function validateOperationFailureClassificationContract(classification) {
  const errors = [];

  if (!isPlainObject(classification)) {
    return invalidResult('classification must be a plain object');
  }

  for (const field of CLASSIFICATION_ALLOWED_FIELDS) {
    if (!Object.hasOwn(classification, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, classification, 'classification', CLASSIFICATION_ALLOWED_FIELDS);
  requireExact(errors, classification.contractName, 'contractName', OPERATION_FAILURE_CLASSIFICATION_CONTRACT_NAME);
  requireExact(errors, classification.contractVersion, 'contractVersion', RUN_RECOVERY_CONTRACT_VERSION);
  requireSafeToken(errors, classification.classificationId, 'classificationId');
  requireIsoTimestamp(errors, classification.generatedAt, 'generatedAt');
  requireSafeToken(errors, classification.operationId, 'operationId');
  requireSafeToken(errors, classification.stepId, 'stepId');
  requireSetValue(errors, classification.phase, 'phase', PHASE_SET);
  requireSetValue(errors, classification.status, 'status', FAILURE_STATUS_SET);
  requireNullableSafeToken(errors, classification.providerId, 'providerId');
  requireNullableSetValue(errors, classification.role, 'role', ROLE_SET);
  requireSetValue(errors, classification.failureLayer, 'failureLayer', new Set(RUN_RECOVERY_FAILURE_LAYERS));
  requireSafeToken(errors, classification.failureCode, 'failureCode');
  requireNonEmptyString(errors, classification.summary, 'summary');
  requireBoolean(errors, classification.retryable, 'retryable');
  validateResumeEligibility(errors, classification.resumeEligibility);
  validateMatchSet(errors, classification.planHash, 'planHash');
  validateMatchSet(errors, classification.sourceFingerprint, 'sourceFingerprint');
  validateEvidenceRefs(errors, classification.artifactRefs, 'artifactRefs');
  validateEvidenceRefs(errors, classification.evidenceRefs, 'evidenceRefs');
  validateActions(errors, classification.recoveryActions, 'recoveryActions');
  validateAction(errors, classification.nextSafeAction, 'nextSafeAction');
  validateBoundaries(errors, classification.boundaries, 'boundaries');
  validateClassificationConsistency(errors, classification);
  rejectUnsafeValues(errors, classification, 'classification');

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors };
}

export function validateOperationTimelineContract(timeline) {
  const errors = [];

  if (!isPlainObject(timeline)) {
    return invalidResult('timeline must be a plain object');
  }

  for (const field of TIMELINE_ALLOWED_FIELDS) {
    if (!Object.hasOwn(timeline, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, timeline, 'timeline', TIMELINE_ALLOWED_FIELDS);
  requireExact(errors, timeline.contractName, 'contractName', OPERATION_TIMELINE_CONTRACT_NAME);
  requireExact(errors, timeline.contractVersion, 'contractVersion', RUN_RECOVERY_CONTRACT_VERSION);
  requireIsoTimestamp(errors, timeline.generatedAt, 'generatedAt');
  requireSafeToken(errors, timeline.operationId, 'operationId');
  validateGoal(errors, timeline.goal);
  validateTask(errors, timeline.task);
  requireSetValue(errors, timeline.status, 'status', TIMELINE_STATUS_SET);
  requireIsoTimestamp(errors, timeline.startedAt, 'startedAt');
  requireIsoTimestamp(errors, timeline.finishedAt, 'finishedAt');
  validateTimelineSteps(errors, timeline.steps);
  validateFailureSummary(errors, timeline.failureClassification);
  validateEvidenceRefs(errors, timeline.artifactRefs, 'artifactRefs');
  validateEvidenceRefs(errors, timeline.evidenceRefs, 'evidenceRefs');
  validateAction(errors, timeline.nextSafeAction, 'nextSafeAction', { nullable: !isFailureStatus(timeline.status) });
  validateBoundaries(errors, timeline.boundaries, 'boundaries');
  validateTimelineConsistency(errors, timeline);
  rejectUnsafeValues(errors, timeline, 'timeline');

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors };
}

export function assertOperationFailureClassificationContract(classification) {
  const validation = validateOperationFailureClassificationContract(classification);

  if (!validation.ok) {
    throw new RunRecoveryContractError(
      'invalid-operation-failure-classification',
      'Operation failure classification contract is invalid.',
      { reason: validation.errors[0], errors: validation.errors }
    );
  }
}

export function assertOperationTimelineContract(timeline) {
  const validation = validateOperationTimelineContract(timeline);

  if (!validation.ok) {
    throw new RunRecoveryContractError(
      'invalid-operation-timeline',
      'Operation timeline contract is invalid.',
      { reason: validation.errors[0], errors: validation.errors }
    );
  }
}

function normalizeGoal(goal) {
  const source = isPlainObject(goal) ? goal : {};

  return {
    goalId: safeToken(source.goalId) ?? V69_RECOVERY_RESUME_DIAGNOSTICS_OBSERVABILITY_GOAL_ID,
    title: safeSummary(source.title) ?? 'v69 recovery, resume, diagnostics, and observability',
    state: ['active', 'ready', 'blocked', 'pending', 'missing'].includes(source.state) ? source.state : 'active',
    sourceContract: safeContract(source.sourceContract) ?? 'goalRunbook.v1',
    sourceRef: safeRef(source.sourceRef) ?? 'docs/plans/v69-recovery-resume-diagnostics-observability-runbook-2026-06-14.md'
  };
}

function normalizeTask(task) {
  const source = isPlainObject(task) ? task : {};

  return {
    taskId: safeToken(source.taskId) ?? 'v69-recovery-task',
    title: safeSummary(source.title) ?? 'Recover controlled execution loop',
    state: ['active', 'ready', 'blocked', 'pending', 'missing', 'needs-review'].includes(source.state)
      ? source.state
      : 'active',
    sourceContract: safeContract(source.sourceContract) ?? 'goalRunbook.v1',
    sourceRef: safeRef(source.sourceRef) ?? 'docs/plans/v69-recovery-resume-diagnostics-observability-runbook-2026-06-14.md'
  };
}

function normalizeTimelineSteps(steps, operationId, failureClassification) {
  const input = Array.isArray(steps) && steps.length > 0
    ? steps
    : [{
        stepId: 'worker-run',
        label: 'Worker run',
        phase: 'worker-run',
        status: 'failed',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        providerId: 'codex-cli',
        role: 'worker'
      }];

  return input.map((step, index) => {
    const source = isPlainObject(step) ? step : {};
    const stepId = safeToken(source.stepId) ?? `step-${index + 1}`;
    const status = TIMELINE_STATUS_SET.has(source.status) ? source.status : 'pending';
    const failure = failureClassification?.stepId === stepId
      ? {
          classificationId: failureClassification.classificationId,
          failureLayer: failureClassification.failureLayer,
          failureCode: failureClassification.failureCode,
          stepId,
          retryable: failureClassification.retryable,
          resumeEligible: failureClassification.resumeEligible
        }
      : normalizeFailureSummary(source.failure);

    return {
      stepId,
      label: safeSummary(source.label) ?? `Operation step ${index + 1}`,
      phase: PHASE_SET.has(source.phase) ? source.phase : 'worker-run',
      status,
      startedAt: new Date(millisOrNow(source.startedAt)).toISOString(),
      finishedAt: source.finishedAt === null ? null : new Date(millisOrNow(source.finishedAt)).toISOString(),
      providerId: safeNullableToken(source.providerId),
      role: ROLE_SET.has(source.role) ? source.role : inferRole(source.phase),
      artifactRefs: normalizeEvidenceRefs(source.artifactRefs),
      evidenceRefs: normalizeEvidenceRefs(source.evidenceRefs),
      failure
    };
  }).map((step) => ({
    ...step,
    evidenceRefs: step.evidenceRefs.length > 0
      ? step.evidenceRefs
      : [{
          kind: 'operation-record',
          ref: `operation-record:${operationId}:${step.stepId}`,
          label: `${step.label} record`
        }]
  }));
}

function normalizeFailureLayer(layer) {
  return RUN_RECOVERY_FAILURE_LAYERS.includes(layer) ? layer : 'unknown';
}

function normalizeFailureStatus(status) {
  return FAILURE_STATUS_SET.has(status) ? status : 'failed';
}

function normalizeResumeEligibility({
  resumeEligibility,
  retryable,
  failureLayer,
  failureCode,
  planHash,
  sourceFingerprint
}) {
  const source = isPlainObject(resumeEligibility) ? resumeEligibility : {};
  const blockedReasons = uniqueStrings([
    ...safeStringArray(source.blockedReasons),
    ...(!planHash.matches ? ['plan-hash-mismatch'] : []),
    ...(!sourceFingerprint.matches ? ['source-fingerprint-mismatch'] : []),
    ...(failureLayer === 'unknown' ? ['unknown-failure-layer'] : []),
    ...(failureCode === 'provider-unavailable' ? ['provider-unavailable'] : [])
  ]);
  const eligible = typeof source.eligible === 'boolean'
    ? source.eligible
    : retryable && blockedReasons.length === 0;

  return {
    eligible,
    reason: safeSummary(source.reason) ?? (eligible ? 'Resume allowed after preview confirmation' : 'Resume blocked until operator refreshes recovery preview'),
    requiresPlanHashMatch: source.requiresPlanHashMatch !== false,
    requiresFingerprintMatch: source.requiresFingerprintMatch !== false,
    requiresOperatorConfirm: source.requiresOperatorConfirm !== false,
    blockedReasons: eligible ? [] : blockedReasons
  };
}

function normalizeMatchSet(value, fallbackHash) {
  const source = isPlainObject(value) ? value : {};
  const expected = safeHash(source.expected) ?? fallbackHash;
  const current = safeHash(source.current) ?? expected;

  return {
    expected,
    current,
    matches: typeof source.matches === 'boolean' ? source.matches : expected === current
  };
}

function defaultRecoveryActions({ failureLayer, failureCode, retryable, resumeEligibility }) {
  if (failureCode === 'provider-unavailable') {
    return [
      action('wait-for-provider', 'Wait for provider readiness', false, ['provider-unavailable']),
      action('mark-blocked', 'Record blocked provider run', true)
    ];
  }

  if (failureCode === 'stale-plan-hash') {
    return [
      action('refresh-plan-preview', 'Refresh backend recovery preview', true),
      action('mark-blocked', 'Record stale recovery plan', true)
    ];
  }

  if (failureLayer === 'verifier' || failureLayer === 'test') {
    return [
      action('rerun-verification', 'Preview fixed verification rerun', resumeEligibility.eligible),
      action('mark-blocked', 'Record verification blocker', true)
    ];
  }

  if (failureLayer === 'artifact' || failureLayer === 'adoption' || failureLayer === 'workspace') {
    return [
      action('inspect-adoption-journal', 'Inspect bounded adoption journal summary', true),
      action('mark-blocked', 'Record recovery blocker', true)
    ];
  }

  if (failureLayer === 'review') {
    return [
      action('handoff-allowed-provider', 'Preview reviewer handoff', resumeEligibility.eligible),
      action('mark-blocked', 'Record reviewer blocker', true)
    ];
  }

  if (failureLayer === 'provider' && retryable) {
    return [
      action('retry-same-provider', 'Preview same-provider retry', resumeEligibility.eligible),
      action('handoff-allowed-provider', 'Preview allowed-provider handoff', resumeEligibility.eligible),
      action('mark-blocked', 'Record provider blocker', true)
    ];
  }

  return [
    action('request-operator-decision', 'Request operator recovery decision', true),
    action('mark-blocked', 'Record unresolved recovery blocker', true)
  ];
}

function action(actionId, label, allowed, blockedReasons = []) {
  return {
    actionId,
    label,
    backendOwned: true,
    requiresPreview: true,
    requiresConfirm: actionId !== 'request-operator-decision',
    willMutate: false,
    allowed,
    blockedReasons
  };
}

function normalizeRecoveryActions(actions, defaults) {
  const input = Array.isArray(actions) && actions.length > 0 ? actions : defaults;
  const normalized = input.map((candidate) => normalizeAction(candidate)).filter(Boolean);

  return normalized.length > 0 ? normalized : [defaultOperatorDecisionAction()];
}

function normalizeAction(candidate) {
  if (!isPlainObject(candidate)) {
    return null;
  }

  const actionId = RECOVERY_ACTION_SET.has(candidate.actionId) ? candidate.actionId : null;
  if (actionId === null) {
    return null;
  }

  return {
    actionId,
    label: safeSummary(candidate.label) ?? actionId,
    backendOwned: candidate.backendOwned !== false,
    requiresPreview: candidate.requiresPreview !== false,
    requiresConfirm: candidate.requiresConfirm === true,
    willMutate: candidate.willMutate === true,
    allowed: candidate.allowed === true,
    blockedReasons: safeStringArray(candidate.blockedReasons)
  };
}

function defaultOperatorDecisionAction() {
  return action('request-operator-decision', 'Request operator recovery decision', true);
}

function failureSummaryFromClassification(classification) {
  return {
    classificationId: classification.classificationId,
    failureLayer: classification.failureLayer,
    failureCode: classification.failureCode,
    stepId: classification.stepId,
    retryable: classification.retryable,
    resumeEligible: classification.resumeEligibility.eligible
  };
}

function normalizeFailureSummary(summary) {
  if (!isPlainObject(summary)) {
    return null;
  }

  return {
    classificationId: safeToken(summary.classificationId) ?? 'classification-v69-step',
    failureLayer: normalizeFailureLayer(summary.failureLayer),
    failureCode: safeToken(summary.failureCode) ?? 'unknown-failure',
    stepId: safeToken(summary.stepId) ?? 'step-v69',
    retryable: summary.retryable === true,
    resumeEligible: summary.resumeEligible === true
  };
}

function refsFromSteps(steps, field) {
  return steps.flatMap((step) => Array.isArray(step[field]) ? step[field] : []);
}

function inferRole(phase) {
  if (phase === 'reviewer-run') {
    return 'reviewer';
  }

  if (phase === 'main-verification') {
    return 'verifier';
  }

  if (phase === 'adoption-preview' || phase === 'adoption-confirm' || phase === 'gate-draft') {
    return 'operator';
  }

  return 'worker';
}

function defaultFailureCode(layer, status) {
  if (status === 'timeout') {
    return 'provider-timeout';
  }

  if (status === 'interrupted') {
    return 'provider-interrupted';
  }

  return `${layer}-failure`;
}

function defaultRetryable(layer, code, status) {
  if (code === 'provider-unavailable' || code === 'stale-plan-hash') {
    return false;
  }

  return layer === 'provider' || status === 'timeout' || status === 'interrupted';
}

function defaultSummary(layer, code) {
  return `${layer} failure classified as ${code}`;
}

function normalizeEvidenceRefs(refs) {
  if (!Array.isArray(refs)) {
    return [];
  }

  return refs.map((ref, index) => {
    const source = isPlainObject(ref) ? ref : {};

    return {
      kind: EVIDENCE_KIND_SET.has(source.kind) ? source.kind : 'artifact-ref',
      ref: safeRef(source.ref) ?? `artifact-ref:v69:${index + 1}`,
      label: safeSummary(source.label) ?? `Evidence ${index + 1}`
    };
  });
}

function validateClassificationConsistency(errors, classification) {
  if (classification.failureCode === 'stale-plan-hash' && classification.planHash.matches !== false) {
    errors.push('planHash.matches must be false for stale-plan-hash classifications');
  }

  if (classification.failureCode === 'stale-plan-hash' && classification.resumeEligibility.eligible !== false) {
    errors.push('resumeEligibility.eligible must be false for stale-plan-hash classifications');
  }

  if (classification.failureLayer === 'unknown' && classification.retryable !== false) {
    errors.push('retryable must be false for unknown failure layer');
  }

  if (classification.resumeEligibility.eligible === true) {
    if (!classification.planHash.matches) {
      errors.push('resumeEligibility.eligible requires planHash.matches true');
    }

    if (!classification.sourceFingerprint.matches) {
      errors.push('resumeEligibility.eligible requires sourceFingerprint.matches true');
    }
  }

  if (!classification.recoveryActions.some((candidate) => candidate.actionId === classification.nextSafeAction.actionId)) {
    errors.push('nextSafeAction must be one of recoveryActions');
  }

  if (classification.nextSafeAction.allowed !== true) {
    errors.push('nextSafeAction.allowed must be true');
  }
}

function validateTimelineConsistency(errors, timeline) {
  if (Date.parse(timeline.finishedAt) < Date.parse(timeline.startedAt)) {
    errors.push('finishedAt must be at or after startedAt');
  }

  if (isFailureStatus(timeline.status) && timeline.failureClassification === null) {
    errors.push('failureClassification is required for failed, blocked, timeout, or interrupted timelines');
  }

  if (isFailureStatus(timeline.status) && timeline.nextSafeAction === null) {
    errors.push('nextSafeAction is required for failed, blocked, timeout, or interrupted timelines');
  }

  if (timeline.failureClassification !== null) {
    const step = timeline.steps.find((candidate) => candidate.stepId === timeline.failureClassification.stepId);

    if (!step) {
      errors.push('failureClassification.stepId must match a timeline step');
    }
  }
}

function validateTimelineSteps(errors, steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    errors.push('steps must be a non-empty array');
    return;
  }

  const seen = new Set();

  steps.forEach((step, index) => {
    const path = `steps[${index}]`;

    if (!isPlainObject(step)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    validateAllowedFields(errors, step, path, STEP_ALLOWED_FIELDS);
    requireSafeToken(errors, step.stepId, `${path}.stepId`);

    if (seen.has(step.stepId)) {
      errors.push(`${path}.stepId must be unique`);
    }

    seen.add(step.stepId);
    requireNonEmptyString(errors, step.label, `${path}.label`);
    requireSetValue(errors, step.phase, `${path}.phase`, PHASE_SET);
    requireSetValue(errors, step.status, `${path}.status`, TIMELINE_STATUS_SET);
    requireIsoTimestamp(errors, step.startedAt, `${path}.startedAt`);

    if (step.finishedAt !== null) {
      requireIsoTimestamp(errors, step.finishedAt, `${path}.finishedAt`);
    }

    requireNullableSafeToken(errors, step.providerId, `${path}.providerId`);
    requireNullableSetValue(errors, step.role, `${path}.role`, ROLE_SET);
    validateEvidenceRefs(errors, step.artifactRefs, `${path}.artifactRefs`);
    validateEvidenceRefs(errors, step.evidenceRefs, `${path}.evidenceRefs`);
    validateFailureSummary(errors, step.failure, `${path}.failure`, { nullable: true });
  });
}

function validateFailureSummary(errors, summary, path = 'failureClassification', { nullable = true } = {}) {
  if (summary === null && nullable) {
    return;
  }

  if (!isPlainObject(summary)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, summary, path, FAILURE_SUMMARY_ALLOWED_FIELDS);
  requireSafeToken(errors, summary.classificationId, `${path}.classificationId`);
  requireSetValue(errors, summary.failureLayer, `${path}.failureLayer`, new Set(RUN_RECOVERY_FAILURE_LAYERS));
  requireSafeToken(errors, summary.failureCode, `${path}.failureCode`);
  requireSafeToken(errors, summary.stepId, `${path}.stepId`);
  requireBoolean(errors, summary.retryable, `${path}.retryable`);
  requireBoolean(errors, summary.resumeEligible, `${path}.resumeEligible`);
}

function validateResumeEligibility(errors, value) {
  if (!isPlainObject(value)) {
    errors.push('resumeEligibility must be a plain object');
    return;
  }

  validateAllowedFields(errors, value, 'resumeEligibility', RESUME_ELIGIBILITY_ALLOWED_FIELDS);
  requireBoolean(errors, value.eligible, 'resumeEligibility.eligible');
  requireNonEmptyString(errors, value.reason, 'resumeEligibility.reason');
  requireBoolean(errors, value.requiresPlanHashMatch, 'resumeEligibility.requiresPlanHashMatch');
  requireBoolean(errors, value.requiresFingerprintMatch, 'resumeEligibility.requiresFingerprintMatch');
  requireBoolean(errors, value.requiresOperatorConfirm, 'resumeEligibility.requiresOperatorConfirm');
  validateStringArray(errors, value.blockedReasons, 'resumeEligibility.blockedReasons');
}

function validateMatchSet(errors, value, path) {
  if (!isPlainObject(value)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, value, path, PLAN_HASH_ALLOWED_FIELDS);
  requireHash(errors, value.expected, `${path}.expected`);
  requireHash(errors, value.current, `${path}.current`);
  requireBoolean(errors, value.matches, `${path}.matches`);
}

function validateActions(errors, actions, path) {
  if (!Array.isArray(actions) || actions.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  actions.forEach((candidate, index) => validateAction(errors, candidate, `${path}[${index}]`));
}

function validateAction(errors, actionValue, path = 'action', { nullable = false } = {}) {
  if (actionValue === null && nullable) {
    return;
  }

  if (!isPlainObject(actionValue)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, actionValue, path, ACTION_ALLOWED_FIELDS);
  requireSetValue(errors, actionValue.actionId, `${path}.actionId`, RECOVERY_ACTION_SET);
  requireNonEmptyString(errors, actionValue.label, `${path}.label`);
  requireExact(errors, actionValue.backendOwned, `${path}.backendOwned`, true);
  requireExact(errors, actionValue.requiresPreview, `${path}.requiresPreview`, true);
  requireBoolean(errors, actionValue.requiresConfirm, `${path}.requiresConfirm`);
  requireExact(errors, actionValue.willMutate, `${path}.willMutate`, false);
  requireBoolean(errors, actionValue.allowed, `${path}.allowed`);
  validateStringArray(errors, actionValue.blockedReasons, `${path}.blockedReasons`);
}

function validateEvidenceRefs(errors, refs, path) {
  if (!Array.isArray(refs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  refs.forEach((ref, index) => {
    const refPath = `${path}[${index}]`;

    if (!isPlainObject(ref)) {
      errors.push(`${refPath} must be a plain object`);
      return;
    }

    validateAllowedFields(errors, ref, refPath, EVIDENCE_REF_ALLOWED_FIELDS);
    requireSetValue(errors, ref.kind, `${refPath}.kind`, EVIDENCE_KIND_SET);
    requireSafeRef(errors, ref.ref, `${refPath}.ref`);
    requireNonEmptyString(errors, ref.label, `${refPath}.label`);
  });
}

function validateGoal(errors, goal) {
  if (!isPlainObject(goal)) {
    errors.push('goal must be a plain object');
    return;
  }

  validateAllowedFields(errors, goal, 'goal', GOAL_ALLOWED_FIELDS);
  requireSafeToken(errors, goal.goalId, 'goal.goalId');
  requireNonEmptyString(errors, goal.title, 'goal.title');
  requireSetValue(errors, goal.state, 'goal.state', new Set(['active', 'ready', 'blocked', 'pending', 'missing']));
  requireSafeContract(errors, goal.sourceContract, 'goal.sourceContract');
  requireSafeRef(errors, goal.sourceRef, 'goal.sourceRef');
}

function validateTask(errors, task) {
  if (!isPlainObject(task)) {
    errors.push('task must be a plain object');
    return;
  }

  validateAllowedFields(errors, task, 'task', TASK_ALLOWED_FIELDS);
  requireSafeToken(errors, task.taskId, 'task.taskId');
  requireNonEmptyString(errors, task.title, 'task.title');
  requireSetValue(errors, task.state, 'task.state', new Set(['active', 'ready', 'blocked', 'pending', 'missing', 'needs-review']));
  requireSafeContract(errors, task.sourceContract, 'task.sourceContract');
  requireSafeRef(errors, task.sourceRef, 'task.sourceRef');
}

function validateBoundaries(errors, boundaries, path) {
  if (!isPlainObject(boundaries)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, boundaries, path, new Set(Object.keys(RUN_RECOVERY_BOUNDARIES)));

  for (const [key, expected] of Object.entries(RUN_RECOVERY_BOUNDARIES)) {
    requireExact(errors, boundaries[key], `${path}.${key}`, expected);
  }
}

function validateAllowedFields(errors, object, path, allowedFields) {
  if (!isPlainObject(object)) {
    return;
  }

  for (const key of Object.keys(object)) {
    if (!allowedFields.has(key)) {
      errors.push(`${path}.${key} is not allowed`);
    }
  }
}

function rejectUnsafeValues(errors, value, path) {
  if (typeof value === 'string') {
    if (UNSAFE_TEXT_PATTERN.test(value)) {
      errors.push(`${path} must not contain raw provider output, local session refs, hidden retries, or mutation routes`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectUnsafeValues(errors, entry, `${path}[${index}]`));
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    rejectUnsafeValues(errors, entry, `${path}.${key}`);
  }
}

function requireExact(errors, actual, path, expected) {
  if (actual !== expected) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function requireSetValue(errors, actual, path, allowedSet) {
  if (!allowedSet.has(actual)) {
    errors.push(`${path} must be one of ${Array.from(allowedSet).join(', ')}`);
  }
}

function requireNullableSetValue(errors, actual, path, allowedSet) {
  if (actual === null) {
    return;
  }

  requireSetValue(errors, actual, path, allowedSet);
}

function requireSafeToken(errors, actual, path) {
  if (typeof actual !== 'string' || !SAFE_TOKEN_PATTERN.test(actual)) {
    errors.push(`${path} must be a safe token`);
  }
}

function requireNullableSafeToken(errors, actual, path) {
  if (actual === null) {
    return;
  }

  requireSafeToken(errors, actual, path);
}

function requireSafeContract(errors, actual, path) {
  if (typeof actual !== 'string' || !SAFE_CONTRACT_PATTERN.test(actual)) {
    errors.push(`${path} must be a safe contract name`);
  }
}

function requireSafeRef(errors, actual, path) {
  if (typeof actual !== 'string' || actual.length === 0 || UNSAFE_TEXT_PATTERN.test(actual)) {
    errors.push(`${path} must be a safe bounded ref`);
  }
}

function requireHash(errors, actual, path) {
  if (typeof actual !== 'string' || !HASH_PATTERN.test(actual)) {
    errors.push(`${path} must be a sha256 hash`);
  }
}

function requireIsoTimestamp(errors, actual, path) {
  if (typeof actual !== 'string' || Number.isNaN(Date.parse(actual))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireBoolean(errors, actual, path) {
  if (typeof actual !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireNonEmptyString(errors, actual, path) {
  if (typeof actual !== 'string' || actual.trim().length === 0) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function validateStringArray(errors, actual, path) {
  if (!Array.isArray(actual)) {
    errors.push(`${path} must be an array`);
    return;
  }

  actual.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.length === 0 || UNSAFE_TEXT_PATTERN.test(entry)) {
      errors.push(`${path}[${index}] must be a safe string`);
    }
  });
}

function safeNullableToken(value) {
  return typeof value === 'string' && SAFE_TOKEN_PATTERN.test(value) ? value : null;
}

function safeToken(value) {
  return safeNullableToken(value);
}

function safeContract(value) {
  return typeof value === 'string' && SAFE_CONTRACT_PATTERN.test(value) ? value : null;
}

function safeHash(value) {
  return typeof value === 'string' && HASH_PATTERN.test(value) ? value : null;
}

function safeRef(value) {
  return typeof value === 'string' && value.length > 0 && !UNSAFE_TEXT_PATTERN.test(value) ? value : null;
}

function safeSummary(value) {
  return typeof value === 'string' && value.trim().length > 0 && !UNSAFE_TEXT_PATTERN.test(value)
    ? value.trim()
    : null;
}

function safeStringArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((value) => typeof value === 'string' && value.length > 0 && !UNSAFE_TEXT_PATTERN.test(value));
}

function uniqueStrings(values) {
  return Array.from(new Set(values.filter((value) => typeof value === 'string' && value.length > 0)));
}

function millisOrNow(value) {
  const millis = Date.parse(value);

  return Number.isNaN(millis) ? Date.now() : millis;
}

function isFailureStatus(status) {
  return FAILURE_STATUS_SET.has(status);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function invalidResult(message) {
  return { ok: false, errors: [message] };
}
