import { createHash } from 'node:crypto';

export const OPERATION_TIMELINE_CONTRACT_NAME = 'operationTimeline.v1';
export const OPERATION_FAILURE_CLASSIFICATION_CONTRACT_NAME = 'operationFailureClassification.v1';
export const OPERATION_RECOVERY_PREVIEW_CONTRACT_NAME = 'operationRecoveryPreview.v1';
export const OPERATION_RECOVERY_CONFIRMATION_CONTRACT_NAME = 'operationRecoveryConfirmation.v1';
export const OPERATION_USAGE_TIME_OBSERVABILITY_CONTRACT_NAME = 'operationUsageTimeObservability.v1';
export const OPERATION_DIAGNOSTICS_SUMMARY_CONTRACT_NAME = 'operationDiagnosticsSummary.v1';
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
const RECOVERY_PREVIEW_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'previewId',
  'generatedAt',
  'state',
  'operationId',
  'classificationId',
  'stepId',
  'requestedAction',
  'sourceFailure',
  'resumeBinding',
  'confirmation',
  'blockedReasons',
  'boundaries',
  'planHash'
]);
const RECOVERY_CONFIRMATION_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'confirmationId',
  'generatedAt',
  'status',
  'previewId',
  'operationId',
  'classificationId',
  'stepId',
  'actionId',
  'input',
  'recoveryState',
  'providerInvoked',
  'gitMutationPerformed',
  'rawPayloadCaptured',
  'diagnosticsOnly',
  'stateTransition',
  'evidenceRefs',
  'boundaries'
]);
const USAGE_TIME_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'status',
  'elapsedMs',
  'providerCallCount',
  'tokenInput',
  'tokenOutput',
  'cost',
  'source',
  'boundaries'
]);
const DIAGNOSTICS_SUMMARY_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'operationId',
  'status',
  'failureLayers',
  'recoveryStates',
  'timelineRef',
  'classifications',
  'recoveryPreviews',
  'recoveryConfirmations',
  'usage',
  'diagnostics',
  'redaction',
  'evidenceRefs',
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
const RESUME_BINDING_ALLOWED_FIELDS = new Set([
  'planHash',
  'sourceFingerprint',
  'providerId',
  'targetProviderId',
  'requiresSameProvider',
  'providerChangeRequiresPreview',
  'resumeEligible'
]);
const CONFIRMATION_REQUIREMENT_ALLOWED_FIELDS = new Set([
  'requiresPlanHash',
  'requiredFields',
  'previewId',
  'actionId',
  'classificationId',
  'operationId',
  'stepId',
  'providerInvokedOnConfirm',
  'hiddenRetryAllowed'
]);
const CONFIRMATION_INPUT_ALLOWED_FIELDS = new Set([
  'planHash',
  'actionId',
  'classificationId',
  'operationId',
  'stepId',
  'sourceFingerprint'
]);
const STATE_TRANSITION_ALLOWED_FIELDS = new Set([
  'state',
  'label',
  'backendOwned',
  'requiresOperatorFollowup',
  'providerToRun',
  'reviewerHandoffAllowed',
  'markBlockedRecorded',
  'verificationRerunAllowed'
]);
const OBSERVABILITY_METRIC_ALLOWED_FIELDS = new Set(['status', 'value', 'unit']);
const COST_METRIC_ALLOWED_FIELDS = new Set(['status', 'amount', 'currency']);
const DIAGNOSTIC_ENTRY_ALLOWED_FIELDS = new Set(['kind', 'label', 'summary', 'ref']);
const REDACTION_ALLOWED_FIELDS = new Set([
  'secretsRedacted',
  'rawLogsIncluded',
  'rawProviderOutputIncluded',
  'rawTranscriptIncluded',
  'localSessionPathsIncluded',
  'providerPayloadsIncluded',
  'redactedCount'
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
const RECOVERY_PREVIEW_STATE_SET = new Set(['ready', 'blocked']);
const RECOVERY_CONFIRMATION_STATUS_SET = new Set(['confirmed', 'blocked']);
const RECOVERY_STATE_SET = new Set([
  'retry-preview-confirmed',
  'handoff-preview-confirmed',
  'verification-rerun-preview-confirmed',
  'journal-inspection-confirmed',
  'provider-wait-recorded',
  'blocked-recorded',
  'preview-refresh-required',
  'operator-decision-required'
]);
const OBSERVABILITY_STATUS_SET = new Set(['observed', 'unavailable', 'unknown']);
const DIAGNOSTICS_STATUS_SET = new Set(['ok', 'warning', 'blocked']);
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const SAFE_CONTRACT_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const UNSAFE_TEXT_PATTERN =
  /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|\b(?:raw[\s_-]*(?:worker[\s_-]*)?(?:transcript|model[\s_-]*output|provider[\s_-]*output|output)|provider[\s_-]*(?:session|folder|payload)|session[\s_-]*(?:path|file|log)|generic[\s_-]*(?:shell|terminal)|arbitrary[\s_-]*command|freeform[\s_-]*(?:command|provider[\s_-]*command)|renderer[\s_-]*command|append[\s_-]*event|task[\s_-]*(?:complete|completion)|release[\s_-]*(?:ready|readiness)|git[\s_-]*(?:merge|push|tag)|github[\s_-]*release|hidden[\s_-]*retry|api[\s_-]*key|auth[\s_-]*token|access[\s_-]*token|refresh[\s_-]*token|password|credential|secret|sk-[a-zA-Z0-9_-]{8,})\b/iu;

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

export function buildOperationRecoveryPreview({
  generatedAt = new Date().toISOString(),
  classification,
  requestedActionId = null,
  targetProviderId = null
} = {}) {
  assertOperationFailureClassificationContract(classification);

  const requestedAction = findRequestedAction(classification, requestedActionId);
  const blockedReasons = recoveryPreviewBlockedReasons({
    classification,
    requestedAction
  });
  const preview = {
    contractName: OPERATION_RECOVERY_PREVIEW_CONTRACT_NAME,
    contractVersion: RUN_RECOVERY_CONTRACT_VERSION,
    previewId: `recovery-preview-v69-${classification.operationId}-${requestedAction.actionId}`,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    operationId: classification.operationId,
    classificationId: classification.classificationId,
    stepId: classification.stepId,
    requestedAction,
    sourceFailure: failureSummaryFromClassification(classification),
    resumeBinding: {
      planHash: { ...classification.planHash },
      sourceFingerprint: { ...classification.sourceFingerprint },
      providerId: classification.providerId,
      targetProviderId: safeNullableToken(targetProviderId) ?? classification.providerId,
      requiresSameProvider: requestedAction.actionId === 'retry-same-provider',
      providerChangeRequiresPreview: requestedAction.actionId === 'handoff-allowed-provider',
      resumeEligible: classification.resumeEligibility.eligible
    },
    confirmation: {
      requiresPlanHash: true,
      requiredFields: ['planHash', 'actionId', 'classificationId', 'operationId', 'stepId', 'sourceFingerprint'],
      previewId: `recovery-preview-v69-${classification.operationId}-${requestedAction.actionId}`,
      actionId: requestedAction.actionId,
      classificationId: classification.classificationId,
      operationId: classification.operationId,
      stepId: classification.stepId,
      providerInvokedOnConfirm: false,
      hiddenRetryAllowed: false
    },
    blockedReasons,
    boundaries: { ...RUN_RECOVERY_BOUNDARIES }
  };
  const withHash = {
    ...preview,
    planHash: computeOperationRecoveryPreviewPlanHash(preview)
  };

  assertOperationRecoveryPreviewContract(withHash);

  return withHash;
}

export function computeOperationRecoveryPreviewPlanHash(preview) {
  const copy = cloneValue(preview);
  delete copy.generatedAt;
  delete copy.planHash;
  return `sha256:${createHash('sha256').update(stableJson(copy)).digest('hex')}`;
}

export function confirmOperationRecoveryPreview({
  generatedAt = new Date().toISOString(),
  preview,
  input,
  currentPlanHash = null,
  currentSourceFingerprint = null,
  evidenceRefs = null
} = {}) {
  assertOperationRecoveryPreviewContract(preview);

  if (!isPlainObject(input)) {
    throw new RunRecoveryContractError('missing-recovery-confirm-input', 'Recovery confirm input is required.');
  }

  const normalizedInput = normalizeConfirmationInput(input);
  const effectiveCurrentPlanHash = safeHash(currentPlanHash) ?? preview.planHash;
  const effectiveCurrentFingerprint = safeHash(currentSourceFingerprint) ?? preview.resumeBinding.sourceFingerprint.current;

  if (preview.state !== 'ready') {
    throw new RunRecoveryContractError('blocked-recovery-preview', 'Recovery preview is blocked and cannot be confirmed.', {
      blockedReasons: preview.blockedReasons
    });
  }

  if (normalizedInput.planHash !== preview.planHash || effectiveCurrentPlanHash !== preview.planHash) {
    throw new RunRecoveryContractError('stale-recovery-preview', 'Recovery confirm requires the current preview planHash.');
  }

  if (normalizedInput.sourceFingerprint !== preview.resumeBinding.sourceFingerprint.current ||
    effectiveCurrentFingerprint !== preview.resumeBinding.sourceFingerprint.current) {
    throw new RunRecoveryContractError(
      'source-fingerprint-drift',
      'Recovery confirm requires the current source fingerprint.'
    );
  }

  if (normalizedInput.actionId !== preview.requestedAction.actionId ||
    normalizedInput.classificationId !== preview.classificationId ||
    normalizedInput.operationId !== preview.operationId ||
    normalizedInput.stepId !== preview.stepId) {
    throw new RunRecoveryContractError(
      'recovery-confirm-input-mismatch',
      'Recovery confirm input must match the backend-owned preview.'
    );
  }

  const stateTransition = stateTransitionForAction(preview);
  const confirmation = {
    contractName: OPERATION_RECOVERY_CONFIRMATION_CONTRACT_NAME,
    contractVersion: RUN_RECOVERY_CONTRACT_VERSION,
    confirmationId: `recovery-confirmation-v69-${preview.operationId}-${preview.requestedAction.actionId}`,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    status: 'confirmed',
    previewId: preview.previewId,
    operationId: preview.operationId,
    classificationId: preview.classificationId,
    stepId: preview.stepId,
    actionId: preview.requestedAction.actionId,
    input: normalizedInput,
    recoveryState: stateTransition.state,
    providerInvoked: false,
    gitMutationPerformed: false,
    rawPayloadCaptured: false,
    diagnosticsOnly: true,
    stateTransition,
    evidenceRefs: normalizeEvidenceRefs(evidenceRefs),
    boundaries: { ...RUN_RECOVERY_BOUNDARIES }
  };

  assertOperationRecoveryConfirmationContract(confirmation);

  return confirmation;
}

export function buildUsageTimeObservability({
  generatedAt = new Date().toISOString(),
  elapsedMs = null,
  providerCallCount = null,
  tokenInput = null,
  tokenOutput = null,
  cost = null,
  source = 'backend-operation-record'
} = {}) {
  const normalizedElapsedMs = normalizeObservedMetric(elapsedMs, 'ms');
  const normalizedProviderCallCount = normalizeObservedMetric(providerCallCount, 'count', { integer: true });
  const normalizedTokenInput = normalizeObservedMetric(tokenInput, 'tokens', { nullableWhenMissing: true });
  const normalizedTokenOutput = normalizeObservedMetric(tokenOutput, 'tokens', { nullableWhenMissing: true });
  const normalizedCost = normalizeCostMetric(cost);
  const usage = {
    contractName: OPERATION_USAGE_TIME_OBSERVABILITY_CONTRACT_NAME,
    contractVersion: RUN_RECOVERY_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    status: usageStatus([
      normalizedElapsedMs,
      normalizedProviderCallCount,
      normalizedTokenInput,
      normalizedTokenOutput,
      normalizedCost
    ]),
    elapsedMs: normalizedElapsedMs,
    providerCallCount: normalizedProviderCallCount,
    tokenInput: normalizedTokenInput,
    tokenOutput: normalizedTokenOutput,
    cost: normalizedCost,
    source: safeRef(source) ?? 'backend-operation-record',
    boundaries: { ...RUN_RECOVERY_BOUNDARIES }
  };

  assertUsageTimeObservabilityContract(usage);

  return usage;
}

export function buildOperationDiagnosticsSummary({
  generatedAt = new Date().toISOString(),
  operationId = 'operation-v69-recovery',
  status = 'warning',
  timeline = null,
  classifications = [],
  recoveryPreviews = [],
  recoveryConfirmations = [],
  usage = null,
  diagnostics = [],
  evidenceRefs = null
} = {}) {
  const safeDiagnostics = diagnostics.map((entry) => sanitizeDiagnosticEntry(entry));
  const redactedCount = safeDiagnostics.reduce((count, entry) => count + entry.redactedCount, 0);
  const normalizedClassifications = classifications.map(classificationDiagnosticSummary);
  const normalizedPreviews = recoveryPreviews.map(recoveryPreviewDiagnosticSummary);
  const normalizedConfirmations = recoveryConfirmations.map(recoveryConfirmationDiagnosticSummary);
  const failureLayers = uniqueStrings(classifications.map((classification) => classification.failureLayer));
  const recoveryStates = uniqueStrings(recoveryConfirmations.map((confirmation) => confirmation.recoveryState));
  const summary = {
    contractName: OPERATION_DIAGNOSTICS_SUMMARY_CONTRACT_NAME,
    contractVersion: RUN_RECOVERY_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    operationId: safeToken(operationId) ?? 'operation-v69-recovery',
    status: DIAGNOSTICS_STATUS_SET.has(status) ? status : 'warning',
    failureLayers,
    recoveryStates,
    timelineRef: timelineDiagnosticRef(timeline),
    classifications: normalizedClassifications,
    recoveryPreviews: normalizedPreviews,
    recoveryConfirmations: normalizedConfirmations,
    usage: usage ?? buildUsageTimeObservability({ generatedAt }),
    diagnostics: safeDiagnostics.map(({ redactedCount: _redactedCount, ...entry }) => entry),
    redaction: {
      secretsRedacted: redactedCount > 0,
      rawLogsIncluded: false,
      rawProviderOutputIncluded: false,
      rawTranscriptIncluded: false,
      localSessionPathsIncluded: false,
      providerPayloadsIncluded: false,
      redactedCount
    },
    evidenceRefs: normalizeEvidenceRefs(evidenceRefs),
    boundaries: { ...RUN_RECOVERY_BOUNDARIES }
  };

  assertOperationDiagnosticsSummaryContract(summary);

  return summary;
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

export function validateUsageTimeObservabilityContract(usage) {
  const errors = [];

  if (!isPlainObject(usage)) {
    return invalidResult('usage must be a plain object');
  }

  for (const field of USAGE_TIME_ALLOWED_FIELDS) {
    if (!Object.hasOwn(usage, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, usage, 'usage', USAGE_TIME_ALLOWED_FIELDS);
  requireExact(errors, usage.contractName, 'contractName', OPERATION_USAGE_TIME_OBSERVABILITY_CONTRACT_NAME);
  requireExact(errors, usage.contractVersion, 'contractVersion', RUN_RECOVERY_CONTRACT_VERSION);
  requireIsoTimestamp(errors, usage.generatedAt, 'generatedAt');
  requireSetValue(errors, usage.status, 'status', OBSERVABILITY_STATUS_SET);
  validateObservedMetric(errors, usage.elapsedMs, 'elapsedMs');
  validateObservedMetric(errors, usage.providerCallCount, 'providerCallCount');
  validateObservedMetric(errors, usage.tokenInput, 'tokenInput');
  validateObservedMetric(errors, usage.tokenOutput, 'tokenOutput');
  validateCostMetric(errors, usage.cost, 'cost');
  requireSafeRef(errors, usage.source, 'source');
  validateBoundaries(errors, usage.boundaries, 'boundaries');
  validateUsageConsistency(errors, usage);
  rejectUnsafeValues(errors, usage, 'usage');

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors };
}

export function validateOperationDiagnosticsSummaryContract(summary) {
  const errors = [];

  if (!isPlainObject(summary)) {
    return invalidResult('summary must be a plain object');
  }

  for (const field of DIAGNOSTICS_SUMMARY_ALLOWED_FIELDS) {
    if (!Object.hasOwn(summary, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, summary, 'summary', DIAGNOSTICS_SUMMARY_ALLOWED_FIELDS);
  requireExact(errors, summary.contractName, 'contractName', OPERATION_DIAGNOSTICS_SUMMARY_CONTRACT_NAME);
  requireExact(errors, summary.contractVersion, 'contractVersion', RUN_RECOVERY_CONTRACT_VERSION);
  requireIsoTimestamp(errors, summary.generatedAt, 'generatedAt');
  requireSafeToken(errors, summary.operationId, 'operationId');
  requireSetValue(errors, summary.status, 'status', DIAGNOSTICS_STATUS_SET);
  validateStringArray(errors, summary.failureLayers, 'failureLayers');
  validateStringArray(errors, summary.recoveryStates, 'recoveryStates');
  validateTimelineDiagnosticRef(errors, summary.timelineRef);
  validateDiagnosticRows(errors, summary.classifications, 'classifications');
  validateDiagnosticRows(errors, summary.recoveryPreviews, 'recoveryPreviews');
  validateDiagnosticRows(errors, summary.recoveryConfirmations, 'recoveryConfirmations');
  validateUsageTimeObservabilityContract(summary.usage).errors.forEach((error) => {
    errors.push(`usage.${error}`);
  });
  validateDiagnosticEntries(errors, summary.diagnostics);
  validateRedaction(errors, summary.redaction);
  validateEvidenceRefs(errors, summary.evidenceRefs, 'evidenceRefs');
  validateBoundaries(errors, summary.boundaries, 'boundaries');
  rejectUnsafeValues(errors, summary, 'summary');

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors };
}

export function validateOperationRecoveryPreviewContract(preview) {
  const errors = [];

  if (!isPlainObject(preview)) {
    return invalidResult('preview must be a plain object');
  }

  for (const field of RECOVERY_PREVIEW_ALLOWED_FIELDS) {
    if (!Object.hasOwn(preview, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, preview, 'preview', RECOVERY_PREVIEW_ALLOWED_FIELDS);
  requireExact(errors, preview.contractName, 'contractName', OPERATION_RECOVERY_PREVIEW_CONTRACT_NAME);
  requireExact(errors, preview.contractVersion, 'contractVersion', RUN_RECOVERY_CONTRACT_VERSION);
  requireSafeToken(errors, preview.previewId, 'previewId');
  requireIsoTimestamp(errors, preview.generatedAt, 'generatedAt');
  requireSetValue(errors, preview.state, 'state', RECOVERY_PREVIEW_STATE_SET);
  requireSafeToken(errors, preview.operationId, 'operationId');
  requireSafeToken(errors, preview.classificationId, 'classificationId');
  requireSafeToken(errors, preview.stepId, 'stepId');
  validateAction(errors, preview.requestedAction, 'requestedAction');
  validateFailureSummary(errors, preview.sourceFailure, 'sourceFailure', { nullable: false });
  validateResumeBinding(errors, preview.resumeBinding);
  validateConfirmationRequirement(errors, preview.confirmation);
  validateStringArray(errors, preview.blockedReasons, 'blockedReasons');
  validateBoundaries(errors, preview.boundaries, 'boundaries');
  requireHash(errors, preview.planHash, 'planHash');
  validateRecoveryPreviewConsistency(errors, preview);
  rejectUnsafeValues(errors, preview, 'preview');

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors };
}

export function validateOperationRecoveryConfirmationContract(confirmation) {
  const errors = [];

  if (!isPlainObject(confirmation)) {
    return invalidResult('confirmation must be a plain object');
  }

  for (const field of RECOVERY_CONFIRMATION_ALLOWED_FIELDS) {
    if (!Object.hasOwn(confirmation, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, confirmation, 'confirmation', RECOVERY_CONFIRMATION_ALLOWED_FIELDS);
  requireExact(errors, confirmation.contractName, 'contractName', OPERATION_RECOVERY_CONFIRMATION_CONTRACT_NAME);
  requireExact(errors, confirmation.contractVersion, 'contractVersion', RUN_RECOVERY_CONTRACT_VERSION);
  requireSafeToken(errors, confirmation.confirmationId, 'confirmationId');
  requireIsoTimestamp(errors, confirmation.generatedAt, 'generatedAt');
  requireSetValue(errors, confirmation.status, 'status', RECOVERY_CONFIRMATION_STATUS_SET);
  requireSafeToken(errors, confirmation.previewId, 'previewId');
  requireSafeToken(errors, confirmation.operationId, 'operationId');
  requireSafeToken(errors, confirmation.classificationId, 'classificationId');
  requireSafeToken(errors, confirmation.stepId, 'stepId');
  requireSetValue(errors, confirmation.actionId, 'actionId', RECOVERY_ACTION_SET);
  validateConfirmationInput(errors, confirmation.input);
  requireSetValue(errors, confirmation.recoveryState, 'recoveryState', RECOVERY_STATE_SET);
  requireExact(errors, confirmation.providerInvoked, 'providerInvoked', false);
  requireExact(errors, confirmation.gitMutationPerformed, 'gitMutationPerformed', false);
  requireExact(errors, confirmation.rawPayloadCaptured, 'rawPayloadCaptured', false);
  requireExact(errors, confirmation.diagnosticsOnly, 'diagnosticsOnly', true);
  validateStateTransition(errors, confirmation.stateTransition);
  validateEvidenceRefs(errors, confirmation.evidenceRefs, 'evidenceRefs');
  validateBoundaries(errors, confirmation.boundaries, 'boundaries');
  validateRecoveryConfirmationConsistency(errors, confirmation);
  rejectUnsafeValues(errors, confirmation, 'confirmation');

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

export function assertOperationRecoveryPreviewContract(preview) {
  const validation = validateOperationRecoveryPreviewContract(preview);

  if (!validation.ok) {
    throw new RunRecoveryContractError(
      'invalid-operation-recovery-preview',
      'Operation recovery preview contract is invalid.',
      { reason: validation.errors[0], errors: validation.errors }
    );
  }
}

export function assertOperationRecoveryConfirmationContract(confirmation) {
  const validation = validateOperationRecoveryConfirmationContract(confirmation);

  if (!validation.ok) {
    throw new RunRecoveryContractError(
      'invalid-operation-recovery-confirmation',
      'Operation recovery confirmation contract is invalid.',
      { reason: validation.errors[0], errors: validation.errors }
    );
  }
}

export function assertUsageTimeObservabilityContract(usage) {
  const validation = validateUsageTimeObservabilityContract(usage);

  if (!validation.ok) {
    throw new RunRecoveryContractError(
      'invalid-operation-usage-time-observability',
      'Operation usage/time observability contract is invalid.',
      { reason: validation.errors[0], errors: validation.errors }
    );
  }
}

export function assertOperationDiagnosticsSummaryContract(summary) {
  const validation = validateOperationDiagnosticsSummaryContract(summary);

  if (!validation.ok) {
    throw new RunRecoveryContractError(
      'invalid-operation-diagnostics-summary',
      'Operation diagnostics summary contract is invalid.',
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

function usageStatus(metrics) {
  if (metrics.some((metric) => metric.status === 'observed')) {
    return 'observed';
  }

  if (metrics.some((metric) => metric.status === 'unavailable')) {
    return 'unavailable';
  }

  return 'unknown';
}

function normalizeObservedMetric(input, unit, { integer = false, nullableWhenMissing = false } = {}) {
  if (isPlainObject(input)) {
    const status = OBSERVABILITY_STATUS_SET.has(input.status) ? input.status : 'unknown';
    const value = typeof input.value === 'number' && Number.isFinite(input.value) && input.value >= 0
      ? (integer ? Math.trunc(input.value) : input.value)
      : null;

    return {
      status: status === 'observed' && value !== null ? 'observed' : status === 'unavailable' ? 'unavailable' : 'unknown',
      value: status === 'observed' ? value : null,
      unit
    };
  }

  if (typeof input === 'number' && Number.isFinite(input) && input >= 0) {
    return {
      status: 'observed',
      value: integer ? Math.trunc(input) : input,
      unit
    };
  }

  return {
    status: nullableWhenMissing ? 'unknown' : 'unavailable',
    value: null,
    unit
  };
}

function normalizeCostMetric(input) {
  if (isPlainObject(input)) {
    const status = OBSERVABILITY_STATUS_SET.has(input.status) ? input.status : 'unknown';
    const amount = typeof input.amount === 'number' && Number.isFinite(input.amount) && input.amount >= 0
      ? input.amount
      : null;

    return {
      status: status === 'observed' && amount !== null ? 'observed' : status === 'unavailable' ? 'unavailable' : 'unknown',
      amount: status === 'observed' ? amount : null,
      currency: safeToken(input.currency) ?? null
    };
  }

  if (typeof input === 'number' && Number.isFinite(input) && input >= 0) {
    return {
      status: 'observed',
      amount: input,
      currency: 'USD'
    };
  }

  return {
    status: 'unknown',
    amount: null,
    currency: null
  };
}

function sanitizeDiagnosticEntry(entry) {
  const source = isPlainObject(entry) ? entry : {};
  const summary = sanitizeDiagnosticText(source.summary ?? 'No diagnostic summary supplied');
  const label = sanitizeDiagnosticText(source.label ?? 'Diagnostic entry');
  const ref = sanitizeDiagnosticRef(source.ref);

  return {
    kind: safeToken(source.kind) ?? 'summary',
    label: label.text,
    summary: summary.text,
    ref: ref.text,
    redactedCount: summary.redacted + label.redacted + ref.redacted
  };
}

function sanitizeDiagnosticText(value) {
  const text = typeof value === 'string' ? value.trim() : '';

  if (text.length === 0) {
    return { text: '[redacted]', redacted: 1 };
  }

  if (UNSAFE_TEXT_PATTERN.test(text)) {
    return { text: '[redacted]', redacted: 1 };
  }

  return { text, redacted: 0 };
}

function sanitizeDiagnosticRef(value) {
  const text = typeof value === 'string' ? value.trim() : '';

  if (text.length === 0 || UNSAFE_TEXT_PATTERN.test(text)) {
    return { text: 'diagnostic-ref:redacted', redacted: 1 };
  }

  return { text, redacted: 0 };
}

function classificationDiagnosticSummary(classification) {
  assertOperationFailureClassificationContract(classification);

  return {
    kind: 'failure-classification',
    label: classification.failureCode,
    summary: `${classification.failureLayer}:${classification.failureCode}`,
    ref: `classification:${classification.classificationId}`
  };
}

function recoveryPreviewDiagnosticSummary(preview) {
  assertOperationRecoveryPreviewContract(preview);

  return {
    kind: 'recovery-preview',
    label: preview.requestedAction.actionId,
    summary: `${preview.state}:${preview.requestedAction.actionId}`,
    ref: `preview:${preview.previewId}`
  };
}

function recoveryConfirmationDiagnosticSummary(confirmation) {
  assertOperationRecoveryConfirmationContract(confirmation);

  return {
    kind: 'recovery-confirmation',
    label: confirmation.actionId,
    summary: `${confirmation.status}:${confirmation.recoveryState}`,
    ref: `confirmation:${confirmation.confirmationId}`
  };
}

function timelineDiagnosticRef(timeline) {
  if (timeline === null) {
    return {
      kind: 'operation-timeline',
      ref: 'timeline:missing',
      label: 'Timeline not supplied'
    };
  }

  assertOperationTimelineContract(timeline);

  return {
    kind: 'operation-timeline',
    ref: `timeline:${timeline.operationId}`,
    label: timeline.status
  };
}

function findRequestedAction(classification, requestedActionId) {
  const explicitRequest = RECOVERY_ACTION_SET.has(requestedActionId);
  const actionId = explicitRequest ? requestedActionId : classification.nextSafeAction.actionId;
  const requestedAction = classification.recoveryActions.find((candidate) => candidate.actionId === actionId) ??
    (explicitRequest
      ? action(actionId, 'Requested recovery action unavailable', false, ['requested-action-not-available'])
      : classification.nextSafeAction);

  return normalizeAction(requestedAction) ?? defaultOperatorDecisionAction();
}

function recoveryPreviewBlockedReasons({ classification, requestedAction }) {
  const continuationAction = ['retry-same-provider', 'handoff-allowed-provider', 'rerun-verification'].includes(
    requestedAction.actionId
  );

  return uniqueStrings([
    ...requestedAction.blockedReasons,
    ...(requestedAction.allowed ? [] : ['requested-action-blocked']),
    ...(continuationAction && !classification.resumeEligibility.eligible ? ['resume-not-eligible'] : []),
    ...(continuationAction && !classification.planHash.matches ? ['plan-hash-mismatch'] : []),
    ...(continuationAction && !classification.sourceFingerprint.matches ? ['source-fingerprint-mismatch'] : [])
  ]);
}

function normalizeConfirmationInput(input) {
  const source = isPlainObject(input) ? input : {};

  return {
    planHash: safeHash(source.planHash) ?? 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
    actionId: RECOVERY_ACTION_SET.has(source.actionId) ? source.actionId : 'request-operator-decision',
    classificationId: safeToken(source.classificationId) ?? 'missing-classification',
    operationId: safeToken(source.operationId) ?? 'missing-operation',
    stepId: safeToken(source.stepId) ?? 'missing-step',
    sourceFingerprint: safeHash(source.sourceFingerprint) ??
      'sha256:0000000000000000000000000000000000000000000000000000000000000000'
  };
}

function stateTransitionForAction(preview) {
  const actionId = preview.requestedAction.actionId;
  const targetProvider = preview.resumeBinding.targetProviderId;

  if (actionId === 'retry-same-provider') {
    return transition({
      state: 'retry-preview-confirmed',
      label: 'Same-provider retry preview confirmed',
      providerToRun: targetProvider,
      requiresOperatorFollowup: true
    });
  }

  if (actionId === 'handoff-allowed-provider') {
    return transition({
      state: 'handoff-preview-confirmed',
      label: 'Allowed-provider handoff preview confirmed',
      providerToRun: targetProvider,
      reviewerHandoffAllowed: true,
      requiresOperatorFollowup: true
    });
  }

  if (actionId === 'rerun-verification') {
    return transition({
      state: 'verification-rerun-preview-confirmed',
      label: 'Verification rerun preview confirmed',
      verificationRerunAllowed: true,
      requiresOperatorFollowup: true
    });
  }

  if (actionId === 'inspect-adoption-journal') {
    return transition({
      state: 'journal-inspection-confirmed',
      label: 'Bounded adoption journal inspection confirmed',
      requiresOperatorFollowup: true
    });
  }

  if (actionId === 'wait-for-provider') {
    return transition({
      state: 'provider-wait-recorded',
      label: 'Provider wait recorded',
      requiresOperatorFollowup: true
    });
  }

  if (actionId === 'mark-blocked') {
    return transition({
      state: 'blocked-recorded',
      label: 'Recovery blocker recorded',
      markBlockedRecorded: true
    });
  }

  if (actionId === 'refresh-plan-preview') {
    return transition({
      state: 'preview-refresh-required',
      label: 'Recovery preview refresh required',
      requiresOperatorFollowup: true
    });
  }

  return transition({
    state: 'operator-decision-required',
    label: 'Operator recovery decision required',
    requiresOperatorFollowup: true
  });
}

function transition({
  state,
  label,
  requiresOperatorFollowup = false,
  providerToRun = null,
  reviewerHandoffAllowed = false,
  markBlockedRecorded = false,
  verificationRerunAllowed = false
}) {
  return {
    state,
    label,
    backendOwned: true,
    requiresOperatorFollowup,
    providerToRun: safeNullableToken(providerToRun),
    reviewerHandoffAllowed,
    markBlockedRecorded,
    verificationRerunAllowed
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

function validateResumeBinding(errors, value) {
  if (!isPlainObject(value)) {
    errors.push('resumeBinding must be a plain object');
    return;
  }

  validateAllowedFields(errors, value, 'resumeBinding', RESUME_BINDING_ALLOWED_FIELDS);
  validateMatchSet(errors, value.planHash, 'resumeBinding.planHash');
  validateMatchSet(errors, value.sourceFingerprint, 'resumeBinding.sourceFingerprint');
  requireNullableSafeToken(errors, value.providerId, 'resumeBinding.providerId');
  requireNullableSafeToken(errors, value.targetProviderId, 'resumeBinding.targetProviderId');
  requireBoolean(errors, value.requiresSameProvider, 'resumeBinding.requiresSameProvider');
  requireBoolean(errors, value.providerChangeRequiresPreview, 'resumeBinding.providerChangeRequiresPreview');
  requireBoolean(errors, value.resumeEligible, 'resumeBinding.resumeEligible');
}

function validateConfirmationRequirement(errors, value) {
  if (!isPlainObject(value)) {
    errors.push('confirmation must be a plain object');
    return;
  }

  validateAllowedFields(errors, value, 'confirmation', CONFIRMATION_REQUIREMENT_ALLOWED_FIELDS);
  requireExact(errors, value.requiresPlanHash, 'confirmation.requiresPlanHash', true);
  validateStringArray(errors, value.requiredFields, 'confirmation.requiredFields');
  requireSafeToken(errors, value.previewId, 'confirmation.previewId');
  requireSetValue(errors, value.actionId, 'confirmation.actionId', RECOVERY_ACTION_SET);
  requireSafeToken(errors, value.classificationId, 'confirmation.classificationId');
  requireSafeToken(errors, value.operationId, 'confirmation.operationId');
  requireSafeToken(errors, value.stepId, 'confirmation.stepId');
  requireExact(errors, value.providerInvokedOnConfirm, 'confirmation.providerInvokedOnConfirm', false);
  requireExact(errors, value.hiddenRetryAllowed, 'confirmation.hiddenRetryAllowed', false);
}

function validateConfirmationInput(errors, value) {
  if (!isPlainObject(value)) {
    errors.push('input must be a plain object');
    return;
  }

  validateAllowedFields(errors, value, 'input', CONFIRMATION_INPUT_ALLOWED_FIELDS);
  requireHash(errors, value.planHash, 'input.planHash');
  requireSetValue(errors, value.actionId, 'input.actionId', RECOVERY_ACTION_SET);
  requireSafeToken(errors, value.classificationId, 'input.classificationId');
  requireSafeToken(errors, value.operationId, 'input.operationId');
  requireSafeToken(errors, value.stepId, 'input.stepId');
  requireHash(errors, value.sourceFingerprint, 'input.sourceFingerprint');
}

function validateStateTransition(errors, value) {
  if (!isPlainObject(value)) {
    errors.push('stateTransition must be a plain object');
    return;
  }

  validateAllowedFields(errors, value, 'stateTransition', STATE_TRANSITION_ALLOWED_FIELDS);
  requireSetValue(errors, value.state, 'stateTransition.state', RECOVERY_STATE_SET);
  requireNonEmptyString(errors, value.label, 'stateTransition.label');
  requireExact(errors, value.backendOwned, 'stateTransition.backendOwned', true);
  requireBoolean(errors, value.requiresOperatorFollowup, 'stateTransition.requiresOperatorFollowup');
  requireNullableSafeToken(errors, value.providerToRun, 'stateTransition.providerToRun');
  requireBoolean(errors, value.reviewerHandoffAllowed, 'stateTransition.reviewerHandoffAllowed');
  requireBoolean(errors, value.markBlockedRecorded, 'stateTransition.markBlockedRecorded');
  requireBoolean(errors, value.verificationRerunAllowed, 'stateTransition.verificationRerunAllowed');
}

function validateRecoveryPreviewConsistency(errors, preview) {
  if (preview.planHash !== computeOperationRecoveryPreviewPlanHash(preview)) {
    errors.push('planHash must match recovery preview content');
  }

  if (preview.confirmation.previewId !== preview.previewId) {
    errors.push('confirmation.previewId must match previewId');
  }

  if (preview.confirmation.actionId !== preview.requestedAction.actionId) {
    errors.push('confirmation.actionId must match requestedAction.actionId');
  }

  if (preview.confirmation.classificationId !== preview.classificationId) {
    errors.push('confirmation.classificationId must match classificationId');
  }

  if (preview.confirmation.operationId !== preview.operationId) {
    errors.push('confirmation.operationId must match operationId');
  }

  if (preview.confirmation.stepId !== preview.stepId) {
    errors.push('confirmation.stepId must match stepId');
  }

  if (preview.state === 'ready' && preview.blockedReasons.length !== 0) {
    errors.push('blockedReasons must be empty when preview is ready');
  }

  if (preview.state === 'blocked' && preview.blockedReasons.length === 0) {
    errors.push('blockedReasons must not be empty when preview is blocked');
  }

  if (preview.requestedAction.actionId === 'retry-same-provider' &&
    preview.resumeBinding.targetProviderId !== preview.resumeBinding.providerId) {
    errors.push('retry-same-provider requires targetProviderId to match providerId');
  }
}

function validateRecoveryConfirmationConsistency(errors, confirmation) {
  if (confirmation.input.actionId !== confirmation.actionId) {
    errors.push('input.actionId must match actionId');
  }

  if (confirmation.input.classificationId !== confirmation.classificationId) {
    errors.push('input.classificationId must match classificationId');
  }

  if (confirmation.input.operationId !== confirmation.operationId) {
    errors.push('input.operationId must match operationId');
  }

  if (confirmation.input.stepId !== confirmation.stepId) {
    errors.push('input.stepId must match stepId');
  }

  if (confirmation.status === 'confirmed' && confirmation.stateTransition.state !== confirmation.recoveryState) {
    errors.push('stateTransition.state must match recoveryState');
  }
}

function validateObservedMetric(errors, metric, path) {
  if (!isPlainObject(metric)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, metric, path, OBSERVABILITY_METRIC_ALLOWED_FIELDS);
  requireSetValue(errors, metric.status, `${path}.status`, OBSERVABILITY_STATUS_SET);

  if (metric.status === 'observed') {
    if (typeof metric.value !== 'number' || !Number.isFinite(metric.value) || metric.value < 0) {
      errors.push(`${path}.value must be a non-negative number when observed`);
    }
  } else if (metric.value !== null) {
    errors.push(`${path}.value must be null unless status is observed`);
  }

  requireSetValue(errors, metric.unit, `${path}.unit`, new Set(['ms', 'count', 'tokens']));
}

function validateCostMetric(errors, metric, path) {
  if (!isPlainObject(metric)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, metric, path, COST_METRIC_ALLOWED_FIELDS);
  requireSetValue(errors, metric.status, `${path}.status`, OBSERVABILITY_STATUS_SET);

  if (metric.status === 'observed') {
    if (typeof metric.amount !== 'number' || !Number.isFinite(metric.amount) || metric.amount < 0) {
      errors.push(`${path}.amount must be a non-negative number when observed`);
    }

    requireSafeToken(errors, metric.currency, `${path}.currency`);
  } else {
    if (metric.amount !== null) {
      errors.push(`${path}.amount must be null unless status is observed`);
    }

    if (metric.currency !== null) {
      errors.push(`${path}.currency must be null unless status is observed`);
    }
  }
}

function validateUsageConsistency(errors, usage) {
  const metrics = [usage.elapsedMs, usage.providerCallCount, usage.tokenInput, usage.tokenOutput, usage.cost];
  const observedCount = metrics.filter((metric) => metric?.status === 'observed').length;
  const unavailableCount = metrics.filter((metric) => metric?.status === 'unavailable').length;

  if (usage.status === 'observed' && observedCount === 0) {
    errors.push('status observed requires at least one observed usage/time metric');
  }

  if (usage.status === 'unknown' && (observedCount > 0 || unavailableCount > 0)) {
    errors.push('status unknown requires all usage/time metrics to be unknown');
  }
}

function validateTimelineDiagnosticRef(errors, value) {
  if (!isPlainObject(value)) {
    errors.push('timelineRef must be a plain object');
    return;
  }

  validateAllowedFields(errors, value, 'timelineRef', EVIDENCE_REF_ALLOWED_FIELDS);
  requireSetValue(errors, value.kind, 'timelineRef.kind', new Set(['operation-timeline']));
  requireSafeRef(errors, value.ref, 'timelineRef.ref');
  requireNonEmptyString(errors, value.label, 'timelineRef.label');
}

function validateDiagnosticRows(errors, rows, path) {
  if (!Array.isArray(rows)) {
    errors.push(`${path} must be an array`);
    return;
  }

  rows.forEach((row, index) => validateDiagnosticRow(errors, row, `${path}[${index}]`));
}

function validateDiagnosticEntries(errors, entries) {
  if (!Array.isArray(entries)) {
    errors.push('diagnostics must be an array');
    return;
  }

  entries.forEach((entry, index) => validateDiagnosticRow(errors, entry, `diagnostics[${index}]`));
}

function validateDiagnosticRow(errors, row, path) {
  if (!isPlainObject(row)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, row, path, DIAGNOSTIC_ENTRY_ALLOWED_FIELDS);
  requireSafeToken(errors, row.kind, `${path}.kind`);
  requireNonEmptyString(errors, row.label, `${path}.label`);
  requireNonEmptyString(errors, row.summary, `${path}.summary`);
  requireSafeRef(errors, row.ref, `${path}.ref`);
}

function validateRedaction(errors, redaction) {
  if (!isPlainObject(redaction)) {
    errors.push('redaction must be a plain object');
    return;
  }

  validateAllowedFields(errors, redaction, 'redaction', REDACTION_ALLOWED_FIELDS);
  requireBoolean(errors, redaction.secretsRedacted, 'redaction.secretsRedacted');
  requireExact(errors, redaction.rawLogsIncluded, 'redaction.rawLogsIncluded', false);
  requireExact(errors, redaction.rawProviderOutputIncluded, 'redaction.rawProviderOutputIncluded', false);
  requireExact(errors, redaction.rawTranscriptIncluded, 'redaction.rawTranscriptIncluded', false);
  requireExact(errors, redaction.localSessionPathsIncluded, 'redaction.localSessionPathsIncluded', false);
  requireExact(errors, redaction.providerPayloadsIncluded, 'redaction.providerPayloadsIncluded', false);

  if (!Number.isInteger(redaction.redactedCount) || redaction.redactedCount < 0) {
    errors.push('redaction.redactedCount must be a non-negative integer');
  }
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

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableJson(value) {
  return JSON.stringify(sortForStableJson(value));
}

function sortForStableJson(value) {
  if (Array.isArray(value)) {
    return value.map(sortForStableJson);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.keys(value).sort().reduce((acc, key) => {
    acc[key] = sortForStableJson(value[key]);
    return acc;
  }, {});
}
