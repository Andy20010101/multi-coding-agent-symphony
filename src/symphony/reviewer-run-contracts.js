import { createHash } from 'node:crypto';

export const REVIEWER_RUN_HANDOFF_CONTRACT_NAME = 'reviewerRunHandoff.v1';
export const REVIEWER_RUN_VERDICT_CONTRACT_NAME = 'reviewerRunVerdict.v1';
export const REVIEWER_RUN_CONTRACT_VERSION = 1;
export const REVIEWER_RUN_PROVIDER_ID = 'claude-code-cli';
export const REVIEWER_RUN_ROLE = 'reviewer';
export const REVIEWER_RUN_WORKER_PROVIDER_ID = 'codex-cli';
export const REVIEWER_RUN_WORKER_ROLE = 'worker';
export const REVIEWER_RUN_COMMAND_TEMPLATE_ID = 'claude-code-reviewer-controlled-v1';
export const REVIEWER_RUN_DEFAULT_TIMEOUT_MS = 900000;

export const REVIEWER_RUN_BOUNDARIES = Object.freeze({
  backendOwnedPreviewConfirm: true,
  fixedProviderId: REVIEWER_RUN_PROVIDER_ID,
  fixedRole: REVIEWER_RUN_ROLE,
  fixedCommandTemplateId: REVIEWER_RUN_COMMAND_TEMPLATE_ID,
  rendererSuppliedCommandAvailable: false,
  freeformProviderCommandAvailable: false,
  genericShellAvailable: false,
  genericTerminalAvailable: false,
  rendererCommandExecutionAvailable: false,
  frontendLocalJsonlReadAvailable: false,
  frontendLocalSessionReadAvailable: false,
  frontendProviderFolderReadAvailable: false,
  rawTranscriptAvailable: false,
  rawWorkerTranscriptAvailable: false,
  rawModelOutputAvailable: false,
  rawProviderOutputAvailable: false,
  reviewerReadsRawWorkerTranscript: false,
  reviewerReadsRawModelOutput: false,
  directGoalEventAppendAvailable: false,
  directTaskCompletionAvailable: false,
  reviewerOutputCompletesTask: false,
  reviewerOutputApprovesAdoption: false,
  reviewerVerdictPassesMainVerification: false,
  reviewerVerdictMarksReleaseReady: false,
  automaticSelfReviewAvailable: false,
  automaticWorktreeCreationAvailable: false,
  automaticNextVersionGoalAvailable: false,
  writesMainWorktree: false,
  gitMutationAvailable: false,
  githubReleaseAutomationAvailable: false,
  realClaudeRequiresOptIn: true
});

const HANDOFF_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'goal',
  'task',
  'provider',
  'reviewerIdentity',
  'commandTemplate',
  'timeoutMs',
  'handoffPackRef',
  'workerEvidence',
  'reviewPolicy',
  'confirmation',
  'blockedReasons',
  'sourceContracts',
  'boundaries',
  'planHash'
]);
const VERDICT_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'verdictId',
  'goalId',
  'taskId',
  'providerId',
  'role',
  'commandTemplateId',
  'handoffPlanHash',
  'handoffPackRef',
  'reviewerActorId',
  'workerActorId',
  'startedAt',
  'finishedAt',
  'status',
  'adapter',
  'realClaudeSmokeOptIn',
  'sanitizedVerdict',
  'evidenceRefs',
  'nextState',
  'boundaries'
]);
const GOAL_ALLOWED_FIELDS = new Set(['goalId', 'title', 'state', 'sourceContract', 'sourceRef']);
const TASK_ALLOWED_FIELDS = new Set(['taskId', 'title', 'state', 'sourceContract', 'sourceRef']);
const PROVIDER_ALLOWED_FIELDS = new Set(['providerId', 'role', 'lane', 'readinessState', 'sourceContract', 'sourceRef']);
const REVIEWER_IDENTITY_ALLOWED_FIELDS = new Set(['reviewerActorId', 'sourceContract', 'sourceRef']);
const COMMAND_TEMPLATE_ALLOWED_FIELDS = new Set([
  'templateId',
  'providerId',
  'role',
  'commandFamily',
  'fixed',
  'acceptsFreeformCommand',
  'rendererSuppliedCommandAvailable',
  'sourceRef'
]);
const WORKER_EVIDENCE_ALLOWED_FIELDS = new Set([
  'state',
  'sourceContract',
  'sourceRef',
  'workerRunId',
  'workerProviderId',
  'workerRole',
  'workerActorId',
  'taskState',
  'reviewRequired',
  'taskCompleted',
  'reviewApproved',
  'mainVerified',
  'releaseReady',
  'summary',
  'changedFiles',
  'validationCommands',
  'artifactRefs',
  'evidenceRefs'
]);
const REVIEW_POLICY_ALLOWED_FIELDS = new Set([
  'requiresIndependentReviewer',
  'allowedVerdicts',
  'verdictCompletesTask',
  'adoptionAvailable',
  'mainVerificationAvailable',
  'releaseReadinessAvailable'
]);
const CONFIRMATION_ALLOWED_FIELDS = new Set([
  'requiresPlanHash',
  'requiredFields',
  'providerId',
  'role',
  'commandTemplateId',
  'timeoutMs',
  'handoffPackRef'
]);
const SOURCE_CONTRACT_ALLOWED_FIELDS = new Set(['contractName', 'contractVersion', 'readOnly', 'requiredFor', 'sourceRef']);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label']);
const SANITIZED_VERDICT_ALLOWED_FIELDS = new Set([
  'summary',
  'findings',
  'validationCommands',
  'evidenceRefs',
  'risks',
  'blockers',
  'revisionSummary'
]);
const FINDING_ALLOWED_FIELDS = new Set(['severity', 'file', 'line', 'statement', 'recommendation']);
const NEXT_STATE_ALLOWED_FIELDS = new Set([
  'reviewVerdict',
  'reviewEvidenceRecorded',
  'reviewApproved',
  'revisionRequired',
  'blocked',
  'taskCompleted',
  'adoptionReady',
  'mainVerified',
  'releaseReady'
]);

const HANDOFF_STATE_SET = new Set(['ready', 'blocked']);
const GOAL_STATE_SET = new Set(['active', 'ready', 'blocked', 'pending', 'missing']);
const TASK_STATE_SET = new Set(['active', 'ready', 'blocked', 'pending', 'missing', 'needs-review']);
const PROVIDER_READINESS_STATE_SET = new Set(['ready', 'missing', 'blocked', 'degraded']);
const WORKER_EVIDENCE_STATE_SET = new Set(['ready', 'missing', 'blocked']);
const VERDICT_STATUS_SET = new Set(['approved', 'needs-revision', 'blocked']);
const SEVERITY_SET = new Set(['info', 'minor', 'major', 'blocker']);
const EVIDENCE_KIND_SET = new Set(['repo-doc', 'artifact-ref', 'command-evidence', 'handoff-pack']);
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const SAFE_CONTRACT_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const UNSAFE_TEXT_PATTERN =
  /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|\b(?:raw[\s_-]*(?:worker[\s_-]*)?(?:transcript|model[\s_-]*output|provider[\s_-]*output|output)|provider[\s_-]*(?:session|folder|payload)|session[\s_-]*(?:path|file|log)|generic[\s_-]*(?:shell|terminal)|arbitrary[\s_-]*command|freeform[\s_-]*(?:command|provider[\s_-]*command)|renderer[\s_-]*command|append[\s_-]*event|task[\s_-]*(?:complete|completion)|main[\s_-]*(?:verified|verification)|release[\s_-]*(?:ready|readiness)|git[\s_-]*(?:merge|push|tag)|github[\s_-]*release)\b/iu;

export class ReviewerRunContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ReviewerRunContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildReviewerRunHandoff({
  generatedAt = new Date().toISOString(),
  goal = null,
  task = null,
  providerReadiness = null,
  reviewerIdentity = null,
  commandTemplate = null,
  timeoutMs = REVIEWER_RUN_DEFAULT_TIMEOUT_MS,
  handoffPackRef = null,
  workerEvidence = null,
  sourceContracts = defaultSourceContracts(),
  blockedReasons: inputBlockedReasons = []
} = {}) {
  const normalizedGoal = normalizeGoal(goal);
  const normalizedTask = normalizeTask(task);
  const provider = reviewerProviderFromReadiness(providerReadiness);
  const identity = normalizeReviewerIdentity(reviewerIdentity);
  const normalizedCommandTemplate = normalizeCommandTemplate(commandTemplate);
  const normalizedTimeoutMs = normalizeTimeoutMs(timeoutMs);
  const normalizedHandoffPackRef = safeRef(handoffPackRef) ?? 'artifact-ref:v67:reviewer-handoff-pack';
  const normalizedWorkerEvidence = normalizeWorkerEvidence(workerEvidence);
  const blockedReasons = uniqueStrings([
    ...safeStringArray(inputBlockedReasons),
    ...normalizedWorkerEvidence.blockedReasons,
    ...(normalizedGoal.state === 'missing' ? ['active-goal-missing'] : []),
    ...(normalizedTask.state === 'missing' ? ['active-task-missing'] : []),
    ...(provider.readinessState === 'missing' ? ['claude-code-cli-provider-missing'] : []),
    ...(provider.readinessState === 'blocked' ? ['claude-code-cli-provider-blocked'] : []),
    ...(provider.readinessState === 'degraded' ? ['claude-code-cli-provider-degraded'] : []),
    ...(normalizedCommandTemplate.templateId !== REVIEWER_RUN_COMMAND_TEMPLATE_ID ? ['unsupported-command-template'] : []),
    ...(normalizedCommandTemplate.providerId !== REVIEWER_RUN_PROVIDER_ID ? ['unsupported-provider'] : []),
    ...(normalizedCommandTemplate.role !== REVIEWER_RUN_ROLE ? ['unsupported-role'] : []),
    ...(normalizedCommandTemplate.fixed !== true ? ['command-template-not-fixed'] : []),
    ...(normalizedCommandTemplate.acceptsFreeformCommand === true ? ['freeform-provider-command'] : []),
    ...(normalizedTimeoutMs !== timeoutMs ? ['invalid-timeout'] : []),
    ...(normalizedWorkerEvidence.evidence.workerActorId === identity.reviewerActorId ? ['self-review-blocked'] : [])
  ]);
  const handoff = {
    contractName: REVIEWER_RUN_HANDOFF_CONTRACT_NAME,
    contractVersion: REVIEWER_RUN_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    goal: normalizedGoal,
    task: normalizedTask,
    provider,
    reviewerIdentity: identity,
    commandTemplate: normalizedCommandTemplate,
    timeoutMs: normalizedTimeoutMs,
    handoffPackRef: normalizedHandoffPackRef,
    workerEvidence: normalizedWorkerEvidence.evidence,
    reviewPolicy: {
      requiresIndependentReviewer: true,
      allowedVerdicts: ['approved', 'needs-revision', 'blocked'],
      verdictCompletesTask: false,
      adoptionAvailable: false,
      mainVerificationAvailable: false,
      releaseReadinessAvailable: false
    },
    confirmation: {
      requiresPlanHash: true,
      requiredFields: [
        'planHash',
        'goalId',
        'taskId',
        'providerId',
        'role',
        'commandTemplateId',
        'handoffPackRef',
        'reviewerActorId'
      ],
      providerId: REVIEWER_RUN_PROVIDER_ID,
      role: REVIEWER_RUN_ROLE,
      commandTemplateId: REVIEWER_RUN_COMMAND_TEMPLATE_ID,
      timeoutMs: normalizedTimeoutMs,
      handoffPackRef: normalizedHandoffPackRef
    },
    blockedReasons,
    sourceContracts: normalizeSourceContracts(sourceContracts),
    boundaries: { ...REVIEWER_RUN_BOUNDARIES }
  };
  const withHash = {
    ...handoff,
    planHash: computeReviewerRunPlanHash(handoff)
  };

  assertReviewerRunHandoffContract(withHash);

  return withHash;
}

export function buildReviewerRunVerdict({
  handoff,
  verdictId,
  startedAt = new Date().toISOString(),
  finishedAt = startedAt,
  status = 'approved',
  adapter = 'fake-claude-reviewer',
  realClaudeSmokeOptIn = false,
  reviewerOutput = {},
  evidenceRefs = null
} = {}) {
  assertReviewerRunHandoffContract(handoff);

  const normalizedStatus = VERDICT_STATUS_SET.has(status) ? status : 'blocked';
  const normalizedEvidenceRefs = normalizeEvidenceRefs(evidenceRefs ?? reviewerOutput.evidenceRefs);
  const verdict = {
    contractName: REVIEWER_RUN_VERDICT_CONTRACT_NAME,
    contractVersion: REVIEWER_RUN_CONTRACT_VERSION,
    verdictId,
    goalId: handoff.goal.goalId,
    taskId: handoff.task.taskId,
    providerId: REVIEWER_RUN_PROVIDER_ID,
    role: REVIEWER_RUN_ROLE,
    commandTemplateId: REVIEWER_RUN_COMMAND_TEMPLATE_ID,
    handoffPlanHash: handoff.planHash,
    handoffPackRef: handoff.handoffPackRef,
    reviewerActorId: handoff.reviewerIdentity.reviewerActorId,
    workerActorId: handoff.workerEvidence.workerActorId,
    startedAt: new Date(millisOrNow(startedAt)).toISOString(),
    finishedAt: new Date(millisOrNow(finishedAt)).toISOString(),
    status: normalizedStatus,
    adapter: firstNonEmptyString(adapter, 'fake-claude-reviewer'),
    realClaudeSmokeOptIn: realClaudeSmokeOptIn === true,
    sanitizedVerdict: sanitizeReviewerOutput(reviewerOutput, normalizedStatus),
    evidenceRefs: normalizedEvidenceRefs,
    nextState: nextStateForVerdict(normalizedStatus),
    boundaries: { ...REVIEWER_RUN_BOUNDARIES }
  };

  assertReviewerRunVerdictContract(verdict, { handoff });

  return verdict;
}

export function computeReviewerRunPlanHash(handoff) {
  const copy = cloneValue(handoff);
  delete copy.planHash;
  delete copy.generatedAt;
  return `sha256:${createHash('sha256').update(stableJson(copy)).digest('hex')}`;
}

export function validateReviewerRunHandoffContract(handoff) {
  const errors = [];

  if (!isPlainObject(handoff)) {
    return invalidResult('handoff must be a plain object');
  }

  for (const field of HANDOFF_ALLOWED_FIELDS) {
    if (!Object.hasOwn(handoff, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, handoff, 'handoff', HANDOFF_ALLOWED_FIELDS);
  requireExact(errors, handoff.contractName, 'contractName', REVIEWER_RUN_HANDOFF_CONTRACT_NAME);
  requireExact(errors, handoff.contractVersion, 'contractVersion', REVIEWER_RUN_CONTRACT_VERSION);
  requireIsoTimestamp(errors, handoff.generatedAt, 'generatedAt');
  requireEnum(errors, handoff.state, 'state', HANDOFF_STATE_SET);
  validateGoal(errors, handoff.goal, 'goal');
  validateTask(errors, handoff.task, 'task');
  validateProvider(errors, handoff.provider);
  validateReviewerIdentity(errors, handoff.reviewerIdentity);
  validateCommandTemplate(errors, handoff.commandTemplate);
  requireTimeout(errors, handoff.timeoutMs, 'timeoutMs');
  requireSafeRef(errors, handoff.handoffPackRef, 'handoffPackRef');
  validateWorkerEvidence(errors, handoff.workerEvidence, handoff.state);
  validateReviewPolicy(errors, handoff.reviewPolicy);
  validateConfirmation(errors, handoff.confirmation, handoff);
  validateStringArray(errors, handoff.blockedReasons, 'blockedReasons');
  validateSourceContracts(errors, handoff.sourceContracts, 'sourceContracts');
  validateBoundaries(errors, handoff.boundaries, 'boundaries');
  requireHash(errors, handoff.planHash, 'planHash');

  if (handoff.state === 'ready' && Array.isArray(handoff.blockedReasons) && handoff.blockedReasons.length !== 0) {
    errors.push('ready handoff must not include blockedReasons');
  }

  if (handoff.state === 'blocked' && Array.isArray(handoff.blockedReasons) && handoff.blockedReasons.length === 0) {
    errors.push('blocked handoff must include blockedReasons');
  }

  if (handoff.workerEvidence?.workerActorId === handoff.reviewerIdentity?.reviewerActorId) {
    if (handoff.state !== 'blocked' || !handoff.blockedReasons?.includes('self-review-blocked')) {
      errors.push('self-review must be blocked');
    }
  }

  if (HASH_PATTERN.test(handoff.planHash) && handoff.planHash !== computeReviewerRunPlanHash(handoff)) {
    errors.push('planHash must match reviewer handoff content');
  }

  validateUnsafeStrings(errors, handoff, 'handoff');

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertReviewerRunHandoffContract(handoff) {
  const result = validateReviewerRunHandoffContract(handoff);

  if (!result.ok) {
    throw new ReviewerRunContractError(
      'invalid-reviewer-run-handoff',
      'Reviewer run handoff contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return handoff;
}

export function validateReviewerRunVerdictContract(verdict, {
  handoff = null
} = {}) {
  const errors = [];

  if (!isPlainObject(verdict)) {
    return invalidResult('verdict must be a plain object');
  }

  for (const field of VERDICT_ALLOWED_FIELDS) {
    if (!Object.hasOwn(verdict, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, verdict, 'verdict', VERDICT_ALLOWED_FIELDS);
  requireExact(errors, verdict.contractName, 'contractName', REVIEWER_RUN_VERDICT_CONTRACT_NAME);
  requireExact(errors, verdict.contractVersion, 'contractVersion', REVIEWER_RUN_CONTRACT_VERSION);
  requireSafeToken(errors, verdict.verdictId, 'verdictId');
  requireSafeToken(errors, verdict.goalId, 'goalId');
  requireSafeToken(errors, verdict.taskId, 'taskId');
  requireExact(errors, verdict.providerId, 'providerId', REVIEWER_RUN_PROVIDER_ID);
  requireExact(errors, verdict.role, 'role', REVIEWER_RUN_ROLE);
  requireExact(errors, verdict.commandTemplateId, 'commandTemplateId', REVIEWER_RUN_COMMAND_TEMPLATE_ID);
  requireHash(errors, verdict.handoffPlanHash, 'handoffPlanHash');
  requireSafeRef(errors, verdict.handoffPackRef, 'handoffPackRef');
  requireSafeToken(errors, verdict.reviewerActorId, 'reviewerActorId');
  requireSafeToken(errors, verdict.workerActorId, 'workerActorId');
  requireIsoTimestamp(errors, verdict.startedAt, 'startedAt');
  requireIsoTimestamp(errors, verdict.finishedAt, 'finishedAt');
  requireEnum(errors, verdict.status, 'status', VERDICT_STATUS_SET);
  requireSafeToken(errors, verdict.adapter, 'adapter');
  requireBoolean(errors, verdict.realClaudeSmokeOptIn, 'realClaudeSmokeOptIn');
  validateSanitizedVerdict(errors, verdict.sanitizedVerdict);
  validateEvidenceRefs(errors, verdict.evidenceRefs, 'evidenceRefs', { requireNonEmpty: true });
  validateNextState(errors, verdict.nextState, verdict.status);
  validateBoundaries(errors, verdict.boundaries, 'boundaries');

  if (verdict.reviewerActorId === verdict.workerActorId) {
    errors.push('reviewerActorId must differ from workerActorId');
  }

  if (handoff !== null) {
    const handoffValidation = validateReviewerRunHandoffContract(handoff);

    if (!handoffValidation.ok) {
      errors.push(...handoffValidation.errors.map((error) => `handoff.${error}`));
    } else {
      if (handoff.state !== 'ready') {
        errors.push('handoff must be ready before reviewer verdict');
      }

      if (verdict.handoffPlanHash !== handoff.planHash) {
        errors.push('handoffPlanHash must match reviewer handoff');
      }

      if (verdict.handoffPackRef !== handoff.handoffPackRef) {
        errors.push('handoffPackRef must match reviewer handoff');
      }

      if (verdict.goalId !== handoff.goal.goalId) {
        errors.push('goalId must match reviewer handoff');
      }

      if (verdict.taskId !== handoff.task.taskId) {
        errors.push('taskId must match reviewer handoff');
      }

      if (verdict.reviewerActorId !== handoff.reviewerIdentity.reviewerActorId) {
        errors.push('reviewerActorId must match reviewer handoff');
      }

      if (verdict.workerActorId !== handoff.workerEvidence.workerActorId) {
        errors.push('workerActorId must match reviewer handoff');
      }
    }
  }

  validateUnsafeStrings(errors, verdict, 'verdict');

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertReviewerRunVerdictContract(verdict, options = {}) {
  const validation = validateReviewerRunVerdictContract(verdict, options);

  if (!validation.ok) {
    throw new ReviewerRunContractError(
      'invalid-reviewer-run-verdict',
      'Reviewer run verdict contract is invalid.',
      { reason: validation.errors[0] }
    );
  }

  return verdict;
}

function normalizeGoal(goal) {
  const source = isPlainObject(goal) ? goal : {};
  const goalId = safeToken(source.goalId) ?? 'missing-goal';

  return {
    goalId,
    title: firstNonEmptyString(source.title, goalId === 'missing-goal' ? 'Missing active goal' : goalId),
    state: GOAL_STATE_SET.has(source.state) ? source.state : goalId === 'missing-goal' ? 'missing' : 'active',
    sourceContract: safeContractName(source.sourceContract) ?? 'goal-next-action.v1',
    sourceRef: safeRef(source.sourceRef ?? goalId)
  };
}

function normalizeTask(task) {
  const source = isPlainObject(task) ? task : {};
  const taskId = safeToken(source.taskId) ?? 'missing-task';

  return {
    taskId,
    title: firstNonEmptyString(source.title, taskId === 'missing-task' ? 'Missing active task' : taskId),
    state: TASK_STATE_SET.has(source.state) ? source.state : taskId === 'missing-task' ? 'missing' : 'active',
    sourceContract: safeContractName(source.sourceContract) ?? 'goal-next-action.v1',
    sourceRef: safeRef(source.sourceRef ?? taskId)
  };
}

function reviewerProviderFromReadiness(providerReadiness) {
  const providers = Array.isArray(providerReadiness?.activeProviders) ? providerReadiness.activeProviders : [];
  const claudeProvider = providers.find((provider) => provider?.providerId === REVIEWER_RUN_PROVIDER_ID);
  const readinessState = PROVIDER_READINESS_STATE_SET.has(claudeProvider?.status) ? claudeProvider.status : 'missing';

  return {
    providerId: REVIEWER_RUN_PROVIDER_ID,
    role: REVIEWER_RUN_ROLE,
    lane: 'claude-code-reviewer-candidate',
    readinessState,
    sourceContract: 'providerReadiness.v1',
    sourceRef: safeRef(providerReadiness?.sourceRef ?? 'fixtures/contracts/provider-readiness/provider-readiness.both-ready.v1.json')
  };
}

function normalizeReviewerIdentity(reviewerIdentity) {
  const source = isPlainObject(reviewerIdentity) ? reviewerIdentity : {};

  return {
    reviewerActorId: safeToken(source.reviewerActorId) ?? 'claude-code-reviewer',
    sourceContract: safeContractName(source.sourceContract) ?? 'operator-reviewer-identity.v1',
    sourceRef: safeRef(source.sourceRef ?? 'operator-reviewer:claude-code-reviewer')
  };
}

function normalizeCommandTemplate(commandTemplate) {
  const source = isPlainObject(commandTemplate) ? commandTemplate : {};

  return {
    templateId: firstNonEmptyString(source.templateId, REVIEWER_RUN_COMMAND_TEMPLATE_ID),
    providerId: firstNonEmptyString(source.providerId, REVIEWER_RUN_PROVIDER_ID),
    role: firstNonEmptyString(source.role, REVIEWER_RUN_ROLE),
    commandFamily: firstNonEmptyString(source.commandFamily, 'claude-code-review'),
    fixed: source.fixed !== false,
    acceptsFreeformCommand: source.acceptsFreeformCommand === true,
    rendererSuppliedCommandAvailable: source.rendererSuppliedCommandAvailable === true,
    sourceRef: safeRef(source.sourceRef ?? 'src/symphony/reviewer-run-contracts.js')
  };
}

function normalizeTimeoutMs(timeoutMs) {
  return Number.isInteger(timeoutMs) && timeoutMs >= 60000 && timeoutMs <= 1800000
    ? timeoutMs
    : REVIEWER_RUN_DEFAULT_TIMEOUT_MS;
}

function normalizeWorkerEvidence(workerEvidence) {
  const source = isPlainObject(workerEvidence) ? workerEvidence : {};
  const sourceNextState = isPlainObject(source.nextState) ? source.nextState : {};
  const sourceSanitized = isPlainObject(source.sanitizedResult) ? source.sanitizedResult : {};
  const unsafeInput = collectStrings(source, 'workerEvidence').some(([, text]) => UNSAFE_TEXT_PATTERN.test(text));
  const evidenceRefs = normalizeEvidenceRefs(source.evidenceRefs);
  const workerRunId = safeToken(source.workerRunId ?? source.runId) ?? 'missing-worker-run';
  const workerProviderId = safeToken(source.workerProviderId ?? source.providerId) ?? REVIEWER_RUN_WORKER_PROVIDER_ID;
  const workerRole = safeToken(source.workerRole ?? source.role) ?? REVIEWER_RUN_WORKER_ROLE;
  const taskState = firstNonEmptyString(source.taskState, sourceNextState.taskState, source.status, 'missing');
  const reviewRequired = source.reviewRequired ?? sourceNextState.reviewRequired;
  const taskCompleted = source.taskCompleted ?? sourceNextState.taskCompleted;
  const reviewApproved = source.reviewApproved ?? sourceNextState.reviewApproved;
  const mainVerified = source.mainVerified ?? sourceNextState.mainVerified;
  const releaseReady = source.releaseReady ?? sourceNextState.releaseReady;
  const missing = workerRunId === 'missing-worker-run' || evidenceRefs.length === 0;
  const blocked = unsafeInput ||
    workerProviderId !== REVIEWER_RUN_WORKER_PROVIDER_ID ||
    workerRole !== REVIEWER_RUN_WORKER_ROLE ||
    taskState !== 'needs-review' ||
    reviewRequired !== true ||
    taskCompleted === true ||
    reviewApproved === true ||
    mainVerified === true ||
    releaseReady === true;
  const state = missing ? 'missing' : blocked ? 'blocked' : 'ready';
  const blockedReasons = [
    ...(missing ? ['worker-evidence-missing'] : []),
    ...(unsafeInput ? ['unsafe-worker-evidence-source'] : []),
    ...(workerProviderId !== REVIEWER_RUN_WORKER_PROVIDER_ID ? ['worker-provider-not-codex-cli'] : []),
    ...(workerRole !== REVIEWER_RUN_WORKER_ROLE ? ['worker-role-not-worker'] : []),
    ...(taskState !== 'needs-review' ? ['worker-evidence-not-needs-review'] : []),
    ...(reviewRequired !== true ? ['worker-evidence-review-not-required'] : []),
    ...(taskCompleted === true ? ['worker-evidence-completes-task'] : []),
    ...(reviewApproved === true ? ['worker-evidence-approves-review'] : []),
    ...(mainVerified === true ? ['worker-evidence-main-verified'] : []),
    ...(releaseReady === true ? ['worker-evidence-release-ready'] : [])
  ];

  return {
    evidence: {
      state,
      sourceContract: safeContractName(source.sourceContract) ?? 'workerRunResult.v1',
      sourceRef: safeRef(source.sourceRef ?? 'fixtures/contracts/worker-run/result.sanitized-success.v1.json') ?? 'workerRunResult.v1',
      workerRunId,
      workerProviderId,
      workerRole,
      workerActorId: safeToken(source.workerActorId) ?? 'codex-worker',
      taskState,
      reviewRequired: reviewRequired === true,
      taskCompleted: taskCompleted === true,
      reviewApproved: reviewApproved === true,
      mainVerified: mainVerified === true,
      releaseReady: releaseReady === true,
      summary: firstNonEmptyString(source.summary, sourceSanitized.summary, 'Worker evidence is available for review.'),
      changedFiles: safePathArray(source.changedFiles ?? sourceSanitized.changedFiles),
      validationCommands: safeCommandArray(source.validationCommands ?? sourceSanitized.validationCommands),
      artifactRefs: safeArtifactRefs(source.artifactRefs ?? sourceSanitized.artifactRefs),
      evidenceRefs
    },
    blockedReasons
  };
}

function normalizeSourceContracts(sourceContracts) {
  const source = Array.isArray(sourceContracts) ? sourceContracts : [];

  return source
    .filter(isPlainObject)
    .map((contract) => ({
      contractName: safeContractName(contract.contractName),
      contractVersion: Number.isInteger(contract.contractVersion) ? contract.contractVersion : 1,
      readOnly: contract.readOnly !== false,
      requiredFor: safeStringArray(contract.requiredFor),
      sourceRef: safeRef(contract.sourceRef ?? contract.contractName)
    }))
    .filter((contract) => contract.contractName !== null);
}

function defaultSourceContracts() {
  return [
    {
      contractName: 'goal-next-action.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['active-goal', 'active-task']
    },
    {
      contractName: 'providerReadiness.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['claude-code-cli-readiness']
    },
    {
      contractName: 'workerRunResult.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['sanitized-worker-evidence']
    }
  ];
}

function sanitizeReviewerOutput(reviewerOutput, status) {
  const source = isPlainObject(reviewerOutput) ? reviewerOutput : {};

  return {
    summary: firstNonEmptyString(source.summary, defaultVerdictSummary(status)),
    findings: sanitizeFindings(source.findings),
    validationCommands: safeCommandArray(source.validationCommands),
    evidenceRefs: normalizeEvidenceRefs(source.evidenceRefs),
    risks: safeStringArray(source.risks),
    blockers: safeStringArray(source.blockers),
    revisionSummary: firstNonEmptyString(
      source.revisionSummary,
      status === 'needs-revision'
        ? 'Revision handoff is copy-only and remains worker-owned.'
        : 'No revision handoff requested.'
    )
  };
}

function sanitizeFindings(findings) {
  const source = Array.isArray(findings) ? findings : [];

  return source
    .filter(isPlainObject)
    .map((finding) => ({
      severity: SEVERITY_SET.has(finding.severity) ? finding.severity : 'info',
      file: safeRelativePath(finding.file) ?? 'unknown',
      line: Number.isInteger(finding.line) && finding.line > 0 ? finding.line : null,
      statement: firstNonEmptyString(finding.statement, 'Finding recorded.'),
      recommendation: firstNonEmptyString(finding.recommendation, 'Review the finding before adoption.')
    }))
    .filter((finding) => !UNSAFE_TEXT_PATTERN.test(stableJson(finding)));
}

function defaultVerdictSummary(status) {
  if (status === 'approved') {
    return 'Reviewer approved the bounded worker evidence.';
  }

  if (status === 'needs-revision') {
    return 'Reviewer requested a worker revision.';
  }

  return 'Reviewer run is blocked.';
}

function nextStateForVerdict(status) {
  return {
    reviewVerdict: status,
    reviewEvidenceRecorded: true,
    reviewApproved: status === 'approved',
    revisionRequired: status === 'needs-revision',
    blocked: status === 'blocked',
    taskCompleted: false,
    adoptionReady: false,
    mainVerified: false,
    releaseReady: false
  };
}

function validateGoal(errors, goal, path) {
  validateAllowedObject(errors, goal, path, GOAL_ALLOWED_FIELDS);
  requireSafeToken(errors, goal?.goalId, `${path}.goalId`);
  requireString(errors, goal?.title, `${path}.title`);
  requireEnum(errors, goal?.state, `${path}.state`, GOAL_STATE_SET);
  requireContractName(errors, goal?.sourceContract, `${path}.sourceContract`);
  requireSafeRef(errors, goal?.sourceRef, `${path}.sourceRef`);
}

function validateTask(errors, task, path) {
  validateAllowedObject(errors, task, path, TASK_ALLOWED_FIELDS);
  requireSafeToken(errors, task?.taskId, `${path}.taskId`);
  requireString(errors, task?.title, `${path}.title`);
  requireEnum(errors, task?.state, `${path}.state`, TASK_STATE_SET);
  requireContractName(errors, task?.sourceContract, `${path}.sourceContract`);
  requireSafeRef(errors, task?.sourceRef, `${path}.sourceRef`);
}

function validateProvider(errors, provider) {
  validateAllowedObject(errors, provider, 'provider', PROVIDER_ALLOWED_FIELDS);
  requireExact(errors, provider?.providerId, 'provider.providerId', REVIEWER_RUN_PROVIDER_ID);
  requireExact(errors, provider?.role, 'provider.role', REVIEWER_RUN_ROLE);
  requireExact(errors, provider?.lane, 'provider.lane', 'claude-code-reviewer-candidate');
  requireEnum(errors, provider?.readinessState, 'provider.readinessState', PROVIDER_READINESS_STATE_SET);
  requireExact(errors, provider?.sourceContract, 'provider.sourceContract', 'providerReadiness.v1');
  requireSafeRef(errors, provider?.sourceRef, 'provider.sourceRef');
}

function validateReviewerIdentity(errors, identity) {
  validateAllowedObject(errors, identity, 'reviewerIdentity', REVIEWER_IDENTITY_ALLOWED_FIELDS);
  requireSafeToken(errors, identity?.reviewerActorId, 'reviewerIdentity.reviewerActorId');
  requireContractName(errors, identity?.sourceContract, 'reviewerIdentity.sourceContract');
  requireSafeRef(errors, identity?.sourceRef, 'reviewerIdentity.sourceRef');
}

function validateCommandTemplate(errors, commandTemplate) {
  validateAllowedObject(errors, commandTemplate, 'commandTemplate', COMMAND_TEMPLATE_ALLOWED_FIELDS);
  requireExact(errors, commandTemplate?.templateId, 'commandTemplate.templateId', REVIEWER_RUN_COMMAND_TEMPLATE_ID);
  requireExact(errors, commandTemplate?.providerId, 'commandTemplate.providerId', REVIEWER_RUN_PROVIDER_ID);
  requireExact(errors, commandTemplate?.role, 'commandTemplate.role', REVIEWER_RUN_ROLE);
  requireExact(errors, commandTemplate?.commandFamily, 'commandTemplate.commandFamily', 'claude-code-review');
  requireExact(errors, commandTemplate?.fixed, 'commandTemplate.fixed', true);
  requireExact(errors, commandTemplate?.acceptsFreeformCommand, 'commandTemplate.acceptsFreeformCommand', false);
  requireExact(errors, commandTemplate?.rendererSuppliedCommandAvailable, 'commandTemplate.rendererSuppliedCommandAvailable', false);
  requireSafeRef(errors, commandTemplate?.sourceRef, 'commandTemplate.sourceRef');
}

function validateWorkerEvidence(errors, workerEvidence, handoffState) {
  validateAllowedObject(errors, workerEvidence, 'workerEvidence', WORKER_EVIDENCE_ALLOWED_FIELDS);
  requireEnum(errors, workerEvidence?.state, 'workerEvidence.state', WORKER_EVIDENCE_STATE_SET);
  requireContractName(errors, workerEvidence?.sourceContract, 'workerEvidence.sourceContract');
  requireSafeRef(errors, workerEvidence?.sourceRef, 'workerEvidence.sourceRef');
  requireSafeToken(errors, workerEvidence?.workerRunId, 'workerEvidence.workerRunId');
  requireSafeToken(errors, workerEvidence?.workerProviderId, 'workerEvidence.workerProviderId');
  requireSafeToken(errors, workerEvidence?.workerRole, 'workerEvidence.workerRole');
  requireSafeToken(errors, workerEvidence?.workerActorId, 'workerEvidence.workerActorId');
  requireString(errors, workerEvidence?.taskState, 'workerEvidence.taskState');
  requireBoolean(errors, workerEvidence?.reviewRequired, 'workerEvidence.reviewRequired');
  requireBoolean(errors, workerEvidence?.taskCompleted, 'workerEvidence.taskCompleted');
  requireBoolean(errors, workerEvidence?.reviewApproved, 'workerEvidence.reviewApproved');
  requireBoolean(errors, workerEvidence?.mainVerified, 'workerEvidence.mainVerified');
  requireBoolean(errors, workerEvidence?.releaseReady, 'workerEvidence.releaseReady');
  requireString(errors, workerEvidence?.summary, 'workerEvidence.summary');
  validateSafePaths(errors, workerEvidence?.changedFiles, 'workerEvidence.changedFiles');
  validateStringArray(errors, workerEvidence?.validationCommands, 'workerEvidence.validationCommands');
  validateStringArray(errors, workerEvidence?.artifactRefs, 'workerEvidence.artifactRefs');
  validateEvidenceRefs(errors, workerEvidence?.evidenceRefs, 'workerEvidence.evidenceRefs', {
    requireNonEmpty: workerEvidence?.state === 'ready'
  });

  if (handoffState === 'ready') {
    requireExact(errors, workerEvidence?.state, 'workerEvidence.state', 'ready');
  }

  if (workerEvidence?.state === 'ready') {
    requireExact(errors, workerEvidence?.workerProviderId, 'workerEvidence.workerProviderId', REVIEWER_RUN_WORKER_PROVIDER_ID);
    requireExact(errors, workerEvidence?.workerRole, 'workerEvidence.workerRole', REVIEWER_RUN_WORKER_ROLE);
    requireExact(errors, workerEvidence?.taskState, 'workerEvidence.taskState', 'needs-review');
    requireExact(errors, workerEvidence?.reviewRequired, 'workerEvidence.reviewRequired', true);
    requireExact(errors, workerEvidence?.taskCompleted, 'workerEvidence.taskCompleted', false);
    requireExact(errors, workerEvidence?.reviewApproved, 'workerEvidence.reviewApproved', false);
    requireExact(errors, workerEvidence?.mainVerified, 'workerEvidence.mainVerified', false);
    requireExact(errors, workerEvidence?.releaseReady, 'workerEvidence.releaseReady', false);
  }
}

function validateReviewPolicy(errors, reviewPolicy) {
  validateAllowedObject(errors, reviewPolicy, 'reviewPolicy', REVIEW_POLICY_ALLOWED_FIELDS);
  requireExact(errors, reviewPolicy?.requiresIndependentReviewer, 'reviewPolicy.requiresIndependentReviewer', true);
  validateStringArray(errors, reviewPolicy?.allowedVerdicts, 'reviewPolicy.allowedVerdicts');
  for (const verdict of ['approved', 'needs-revision', 'blocked']) {
    if (!Array.isArray(reviewPolicy?.allowedVerdicts) || !reviewPolicy.allowedVerdicts.includes(verdict)) {
      errors.push(`reviewPolicy.allowedVerdicts must include ${verdict}`);
    }
  }
  requireExact(errors, reviewPolicy?.verdictCompletesTask, 'reviewPolicy.verdictCompletesTask', false);
  requireExact(errors, reviewPolicy?.adoptionAvailable, 'reviewPolicy.adoptionAvailable', false);
  requireExact(errors, reviewPolicy?.mainVerificationAvailable, 'reviewPolicy.mainVerificationAvailable', false);
  requireExact(errors, reviewPolicy?.releaseReadinessAvailable, 'reviewPolicy.releaseReadinessAvailable', false);
}

function validateConfirmation(errors, confirmation, handoff) {
  validateAllowedObject(errors, confirmation, 'confirmation', CONFIRMATION_ALLOWED_FIELDS);
  requireExact(errors, confirmation?.requiresPlanHash, 'confirmation.requiresPlanHash', true);
  validateStringArray(errors, confirmation?.requiredFields, 'confirmation.requiredFields');
  for (const field of ['planHash', 'goalId', 'taskId', 'providerId', 'role', 'commandTemplateId', 'handoffPackRef', 'reviewerActorId']) {
    if (!Array.isArray(confirmation?.requiredFields) || !confirmation.requiredFields.includes(field)) {
      errors.push(`confirmation.requiredFields must include ${field}`);
    }
  }
  requireExact(errors, confirmation?.providerId, 'confirmation.providerId', REVIEWER_RUN_PROVIDER_ID);
  requireExact(errors, confirmation?.role, 'confirmation.role', REVIEWER_RUN_ROLE);
  requireExact(errors, confirmation?.commandTemplateId, 'confirmation.commandTemplateId', REVIEWER_RUN_COMMAND_TEMPLATE_ID);
  requireExact(errors, confirmation?.timeoutMs, 'confirmation.timeoutMs', handoff?.timeoutMs);
  requireExact(errors, confirmation?.handoffPackRef, 'confirmation.handoffPackRef', handoff?.handoffPackRef);
}

function validateSanitizedVerdict(errors, sanitizedVerdict) {
  validateAllowedObject(errors, sanitizedVerdict, 'sanitizedVerdict', SANITIZED_VERDICT_ALLOWED_FIELDS);
  requireString(errors, sanitizedVerdict?.summary, 'sanitizedVerdict.summary');
  validateFindings(errors, sanitizedVerdict?.findings);
  validateStringArray(errors, sanitizedVerdict?.validationCommands, 'sanitizedVerdict.validationCommands');
  validateEvidenceRefs(errors, sanitizedVerdict?.evidenceRefs, 'sanitizedVerdict.evidenceRefs');
  validateStringArray(errors, sanitizedVerdict?.risks, 'sanitizedVerdict.risks');
  validateStringArray(errors, sanitizedVerdict?.blockers, 'sanitizedVerdict.blockers');
  requireString(errors, sanitizedVerdict?.revisionSummary, 'sanitizedVerdict.revisionSummary');
}

function validateFindings(errors, findings) {
  if (!Array.isArray(findings)) {
    errors.push('sanitizedVerdict.findings must be an array');
    return;
  }

  findings.forEach((finding, index) => {
    const path = `sanitizedVerdict.findings[${index}]`;

    validateAllowedObject(errors, finding, path, FINDING_ALLOWED_FIELDS);
    requireEnum(errors, finding?.severity, `${path}.severity`, SEVERITY_SET);
    if (finding?.file !== 'unknown' && !isSafeRelativePath(finding?.file)) {
      errors.push(`${path}.file must be a safe repository-relative path`);
    }
    if (finding?.line !== null && (!Number.isInteger(finding?.line) || finding.line < 1)) {
      errors.push(`${path}.line must be a positive integer or null`);
    }
    requireString(errors, finding?.statement, `${path}.statement`);
    requireString(errors, finding?.recommendation, `${path}.recommendation`);
  });
}

function validateNextState(errors, nextState, status) {
  validateAllowedObject(errors, nextState, 'nextState', NEXT_STATE_ALLOWED_FIELDS);
  requireExact(errors, nextState?.reviewVerdict, 'nextState.reviewVerdict', status);
  requireExact(errors, nextState?.reviewEvidenceRecorded, 'nextState.reviewEvidenceRecorded', true);
  requireExact(errors, nextState?.reviewApproved, 'nextState.reviewApproved', status === 'approved');
  requireExact(errors, nextState?.revisionRequired, 'nextState.revisionRequired', status === 'needs-revision');
  requireExact(errors, nextState?.blocked, 'nextState.blocked', status === 'blocked');
  requireExact(errors, nextState?.taskCompleted, 'nextState.taskCompleted', false);
  requireExact(errors, nextState?.adoptionReady, 'nextState.adoptionReady', false);
  requireExact(errors, nextState?.mainVerified, 'nextState.mainVerified', false);
  requireExact(errors, nextState?.releaseReady, 'nextState.releaseReady', false);
}

function validateSourceContracts(errors, sourceContracts, path) {
  if (!Array.isArray(sourceContracts)) {
    errors.push(`${path} must be an array`);
    return;
  }

  sourceContracts.forEach((contract, index) => {
    const contractPath = `${path}[${index}]`;
    validateAllowedObject(errors, contract, contractPath, SOURCE_CONTRACT_ALLOWED_FIELDS);
    requireContractName(errors, contract?.contractName, `${contractPath}.contractName`);
    requirePositiveInteger(errors, contract?.contractVersion, `${contractPath}.contractVersion`);
    requireExact(errors, contract?.readOnly, `${contractPath}.readOnly`, true);
    validateStringArray(errors, contract?.requiredFor, `${contractPath}.requiredFor`);
    requireSafeRef(errors, contract?.sourceRef, `${contractPath}.sourceRef`);
  });
}

function validateEvidenceRefs(errors, evidenceRefs, path, { requireNonEmpty = false } = {}) {
  if (!Array.isArray(evidenceRefs)) {
    errors.push(`${path} must be an array`);
    return;
  }

  if (requireNonEmpty && evidenceRefs.length === 0) {
    errors.push(`${path} must include at least one evidence ref`);
  }

  evidenceRefs.forEach((ref, index) => {
    const refPath = `${path}[${index}]`;
    validateAllowedObject(errors, ref, refPath, EVIDENCE_REF_ALLOWED_FIELDS);
    requireEnum(errors, ref?.kind, `${refPath}.kind`, EVIDENCE_KIND_SET);
    requireSafeRef(errors, ref?.ref, `${refPath}.ref`);
    requireString(errors, ref?.label, `${refPath}.label`);
  });
}

function validateBoundaries(errors, boundaries, path) {
  validateAllowedObject(errors, boundaries, path, new Set(Object.keys(REVIEWER_RUN_BOUNDARIES)));
  for (const [key, expected] of Object.entries(REVIEWER_RUN_BOUNDARIES)) {
    requireExact(errors, boundaries?.[key], `${path}.${key}`, expected);
  }
}

function validateSafePaths(errors, values, path) {
  validateStringArray(errors, values, path);

  if (!Array.isArray(values)) {
    return;
  }

  values.forEach((value, index) => {
    if (!isSafeRelativePath(value)) {
      errors.push(`${path}[${index}] must be a safe repository-relative path`);
    }
  });
}

function validateUnsafeStrings(errors, value, path) {
  for (const [fieldPath, text] of collectStrings(value, path)) {
    if (UNSAFE_TEXT_PATTERN.test(text)) {
      errors.push(`${fieldPath} must not contain raw output, local session refs, freeform command material, or direct mutation claims`);
    }
  }
}

function validateAllowedObject(errors, value, path, allowedFields) {
  if (!isPlainObject(value)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, value, path, allowedFields);
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

function requireString(errors, value, path) {
  if (typeof value !== 'string' || value.length === 0) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireSafeToken(errors, value, path) {
  if (typeof value !== 'string' || !SAFE_TOKEN_PATTERN.test(value)) {
    errors.push(`${path} must be a safe token`);
  }
}

function requireSafeRef(errors, value, path) {
  if (typeof value !== 'string' || value.length === 0 || UNSAFE_TEXT_PATTERN.test(value)) {
    errors.push(`${path} must be a safe ref`);
  }
}

function requireContractName(errors, value, path) {
  if (typeof value !== 'string' || !SAFE_CONTRACT_PATTERN.test(value)) {
    errors.push(`${path} must be a contract name`);
  }
}

function requireHash(errors, value, path) {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
    errors.push(`${path} must be a sha256 hash`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  const timestamp = typeof value === 'string' ? Date.parse(value) : NaN;

  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== value) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requirePositiveInteger(errors, value, path) {
  if (!Number.isInteger(value) || value < 1) {
    errors.push(`${path} must be a positive integer`);
  }
}

function requireTimeout(errors, value, path) {
  if (!Number.isInteger(value) || value < 60000 || value > 1800000) {
    errors.push(`${path} must be a bounded timeout`);
  }
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireEnum(errors, value, path, allowedValues) {
  if (!allowedValues.has(value)) {
    errors.push(`${path} must be one of ${Array.from(allowedValues).join(', ')}`);
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function invalidResult(message) {
  return {
    ok: false,
    errors: [message]
  };
}

function safeContractName(value) {
  return typeof value === 'string' && SAFE_CONTRACT_PATTERN.test(value) ? value : null;
}

function safeToken(value) {
  return typeof value === 'string' && SAFE_TOKEN_PATTERN.test(value) ? value : null;
}

function safeRef(value) {
  return typeof value === 'string' && value.length > 0 && !UNSAFE_TEXT_PATTERN.test(value) ? value : null;
}

function safeRelativePath(value) {
  return isSafeRelativePath(value) ? value : null;
}

function safeStringArray(values) {
  return (Array.isArray(values) ? values : [])
    .filter((value) => typeof value === 'string' && value.length > 0)
    .filter((value) => !UNSAFE_TEXT_PATTERN.test(value));
}

function safePathArray(values) {
  return (Array.isArray(values) ? values : []).filter(isSafeRelativePath);
}

function safeCommandArray(values) {
  return safeStringArray(values).filter((value) => !UNSAFE_TEXT_PATTERN.test(value));
}

function safeArtifactRefs(values) {
  return safeStringArray(values).filter((ref) => !UNSAFE_TEXT_PATTERN.test(ref));
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

function isSafeRelativePath(value) {
  return typeof value === 'string' &&
    value.length > 0 &&
    !value.startsWith('/') &&
    !value.startsWith('../') &&
    !value.includes('/../') &&
    !UNSAFE_TEXT_PATTERN.test(value);
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0 && !UNSAFE_TEXT_PATTERN.test(value)) {
      return value;
    }
  }

  return '';
}

function validateStringArray(errors, values, path) {
  if (!Array.isArray(values)) {
    errors.push(`${path} must be an array`);
    return;
  }

  values.forEach((value, index) => {
    if (typeof value !== 'string' || value.length === 0) {
      errors.push(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function uniqueStrings(values) {
  return Array.from(new Set(safeStringArray(values)));
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableJson(value) {
  return JSON.stringify(sortValue(value));
}

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortValue(nested)])
    );
  }

  return value;
}

function collectStrings(value, path) {
  if (typeof value === 'string') {
    return [[path, value]];
  }

  if (Array.isArray(value)) {
    return value.flatMap((nested, index) => collectStrings(nested, `${path}[${index}]`));
  }

  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([key, nested]) => collectStrings(nested, `${path}.${key}`));
  }

  return [];
}

function millisOrNow(value) {
  const millis = Date.parse(value);

  return Number.isFinite(millis) ? millis : Date.now();
}
