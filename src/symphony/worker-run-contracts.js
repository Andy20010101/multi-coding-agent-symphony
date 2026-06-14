import { createHash } from 'node:crypto';

export const WORKER_RUN_PREVIEW_CONTRACT_NAME = 'workerRunPreview.v1';
export const WORKER_RUN_RESULT_CONTRACT_NAME = 'workerRunResult.v1';
export const WORKER_RUN_CONTRACT_VERSION = 1;
export const WORKER_RUN_PROVIDER_ID = 'codex-cli';
export const WORKER_RUN_ROLE = 'worker';
export const WORKER_RUN_COMMAND_TEMPLATE_ID = 'codex-worker-controlled-v1';
export const WORKER_RUN_DEFAULT_TIMEOUT_MS = 900000;

export const WORKER_RUN_BOUNDARIES = Object.freeze({
  backendOwnedPreviewConfirm: true,
  fixedProviderId: WORKER_RUN_PROVIDER_ID,
  fixedCommandTemplateId: WORKER_RUN_COMMAND_TEMPLATE_ID,
  rendererSuppliedCommandAvailable: false,
  freeformProviderCommandAvailable: false,
  genericShellAvailable: false,
  genericTerminalAvailable: false,
  rendererCommandExecutionAvailable: false,
  frontendLocalJsonlReadAvailable: false,
  frontendLocalSessionReadAvailable: false,
  frontendProviderFolderReadAvailable: false,
  rawTranscriptAvailable: false,
  rawModelOutputAvailable: false,
  rawProviderOutputAvailable: false,
  directGoalEventAppendAvailable: false,
  directTaskCompletionAvailable: false,
  providerSuccessCompletesTask: false,
  providerOutputApprovesReview: false,
  automaticSelfReviewAvailable: false,
  automaticWorktreeCreationAvailable: false,
  automaticNextVersionGoalAvailable: false,
  writesMainWorktree: false,
  gitMutationAvailable: false,
  githubReleaseAutomationAvailable: false,
  realCodexRequiresOptIn: true
});

const PREVIEW_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'state',
  'goal',
  'task',
  'provider',
  'commandTemplate',
  'timeoutMs',
  'workspacePolicy',
  'confirmation',
  'resultPolicy',
  'blockedReasons',
  'sourceContracts',
  'boundaries',
  'planHash'
]);
const RESULT_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'runId',
  'goalId',
  'taskId',
  'providerId',
  'commandTemplateId',
  'previewPlanHash',
  'startedAt',
  'finishedAt',
  'status',
  'adapter',
  'realCodexOptIn',
  'sanitizedResult',
  'verifier',
  'evidenceRefs',
  'nextState',
  'failureLayer',
  'boundaries'
]);
const GOAL_ALLOWED_FIELDS = new Set(['goalId', 'title', 'state', 'sourceContract', 'sourceRef']);
const TASK_ALLOWED_FIELDS = new Set(['taskId', 'title', 'state', 'sourceContract', 'sourceRef']);
const PROVIDER_ALLOWED_FIELDS = new Set(['providerId', 'role', 'lane', 'readinessState', 'sourceContract', 'sourceRef']);
const COMMAND_TEMPLATE_ALLOWED_FIELDS = new Set([
  'templateId',
  'providerId',
  'commandFamily',
  'fixed',
  'acceptsFreeformCommand',
  'rendererSuppliedCommandAvailable',
  'sourceRef'
]);
const WORKSPACE_POLICY_ALLOWED_FIELDS = new Set([
  'policyId',
  'workspaceKind',
  'backendOwned',
  'mainWorktreeWrite',
  'rendererSuppliedPathAvailable',
  'allowedWriteScope'
]);
const CONFIRMATION_ALLOWED_FIELDS = new Set([
  'requiresPlanHash',
  'requiredFields',
  'providerId',
  'commandTemplateId',
  'timeoutMs',
  'workspacePolicyId'
]);
const RESULT_POLICY_ALLOWED_FIELDS = new Set([
  'successState',
  'reviewRequired',
  'taskCompletionAvailable',
  'reviewApprovalAvailable',
  'mainVerificationAvailable',
  'releaseReadinessAvailable'
]);
const SOURCE_CONTRACT_ALLOWED_FIELDS = new Set(['contractName', 'contractVersion', 'readOnly', 'requiredFor', 'sourceRef']);
const SANITIZED_RESULT_ALLOWED_FIELDS = new Set([
  'summary',
  'changedFiles',
  'validationCommands',
  'artifactRefs',
  'verifierSummary',
  'risks',
  'blockers'
]);
const VERIFIER_ALLOWED_FIELDS = new Set(['state', 'summary', 'commands', 'evidenceRefs']);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label']);
const NEXT_STATE_ALLOWED_FIELDS = new Set([
  'taskState',
  'reviewRequired',
  'taskCompleted',
  'reviewApproved',
  'mainVerified',
  'releaseReady'
]);
const FAILURE_LAYER_ALLOWED_FIELDS = new Set(['kind', 'reason', 'retryable']);

const PREVIEW_STATE_SET = new Set(['ready', 'blocked']);
const GOAL_STATE_SET = new Set(['active', 'ready', 'blocked', 'pending', 'missing']);
const TASK_STATE_SET = new Set(['active', 'ready', 'blocked', 'pending', 'missing']);
const PROVIDER_READINESS_STATE_SET = new Set(['ready', 'missing', 'blocked', 'degraded']);
const RESULT_STATUS_SET = new Set(['needs-review', 'blocked', 'failed']);
const VERIFIER_STATE_SET = new Set(['not-run', 'passed', 'failed']);
const EVIDENCE_KIND_SET = new Set(['repo-doc', 'artifact-ref', 'command-evidence']);
const FAILURE_KIND_SET = new Set(['none', 'provider-timeout', 'verifier-failed', 'adapter-error', 'contract-blocked']);
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const SAFE_CONTRACT_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const UNSAFE_TEXT_PATTERN =
  /(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\/Users\/|\.jsonl(?:$|[/\s])|\b(?:raw[\s_-]*(?:transcript|model[\s_-]*output|provider[\s_-]*output)|provider[\s_-]*(?:session|folder|payload)|session[\s_-]*(?:path|file|log)|generic[\s_-]*(?:shell|terminal)|arbitrary[\s_-]*command|freeform[\s_-]*(?:command|provider[\s_-]*command)|renderer[\s_-]*command|append[\s_-]*event|task[\s_-]*complete|review[\s_-]*approval|main[\s_-]*verified|release[\s_-]*ready|git[\s_-]*(?:merge|push|tag)|github[\s_-]*release)\b/iu;

export class WorkerRunContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'WorkerRunContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildWorkerRunPreview({
  generatedAt = new Date().toISOString(),
  goal = null,
  task = null,
  providerReadiness = null,
  commandTemplate = null,
  timeoutMs = WORKER_RUN_DEFAULT_TIMEOUT_MS,
  workspacePolicy = null,
  sourceContracts = defaultSourceContracts(),
  blockedReasons: inputBlockedReasons = []
} = {}) {
  const normalizedGoal = normalizeGoal(goal);
  const normalizedTask = normalizeTask(task);
  const provider = workerProviderFromReadiness(providerReadiness);
  const normalizedCommandTemplate = normalizeCommandTemplate(commandTemplate);
  const normalizedWorkspacePolicy = normalizeWorkspacePolicy(workspacePolicy);
  const normalizedTimeoutMs = normalizeTimeoutMs(timeoutMs);
  const blockedReasons = uniqueStrings([
    ...safeStringArray(inputBlockedReasons),
    ...(normalizedGoal.state === 'missing' ? ['active-goal-missing'] : []),
    ...(normalizedTask.state === 'missing' ? ['active-task-missing'] : []),
    ...(provider.readinessState === 'missing' ? ['codex-cli-provider-missing'] : []),
    ...(provider.readinessState === 'blocked' ? ['codex-cli-provider-blocked'] : []),
    ...(provider.readinessState === 'degraded' ? ['codex-cli-provider-degraded'] : []),
    ...(normalizedCommandTemplate.templateId !== WORKER_RUN_COMMAND_TEMPLATE_ID ? ['unsupported-command-template'] : []),
    ...(normalizedCommandTemplate.providerId !== WORKER_RUN_PROVIDER_ID ? ['unsupported-provider'] : []),
    ...(normalizedCommandTemplate.fixed !== true ? ['command-template-not-fixed'] : []),
    ...(normalizedCommandTemplate.acceptsFreeformCommand === true ? ['freeform-provider-command'] : []),
    ...(normalizedTimeoutMs !== timeoutMs ? ['invalid-timeout'] : []),
    ...(normalizedWorkspacePolicy.mainWorktreeWrite === true ? ['main-worktree-write-requested'] : []),
    ...(normalizedWorkspacePolicy.backendOwned !== true ? ['workspace-policy-not-backend-owned'] : [])
  ]);
  const preview = {
    contractName: WORKER_RUN_PREVIEW_CONTRACT_NAME,
    contractVersion: WORKER_RUN_CONTRACT_VERSION,
    generatedAt: new Date(millisOrNow(generatedAt)).toISOString(),
    state: blockedReasons.length === 0 ? 'ready' : 'blocked',
    goal: normalizedGoal,
    task: normalizedTask,
    provider,
    commandTemplate: normalizedCommandTemplate,
    timeoutMs: normalizedTimeoutMs,
    workspacePolicy: normalizedWorkspacePolicy,
    confirmation: {
      requiresPlanHash: true,
      requiredFields: [
        'planHash',
        'goalId',
        'taskId',
        'providerId',
        'commandTemplateId',
        'timeoutMs',
        'workspacePolicyId'
      ],
      providerId: WORKER_RUN_PROVIDER_ID,
      commandTemplateId: WORKER_RUN_COMMAND_TEMPLATE_ID,
      timeoutMs: normalizedTimeoutMs,
      workspacePolicyId: normalizedWorkspacePolicy.policyId
    },
    resultPolicy: {
      successState: 'needs-review',
      reviewRequired: true,
      taskCompletionAvailable: false,
      reviewApprovalAvailable: false,
      mainVerificationAvailable: false,
      releaseReadinessAvailable: false
    },
    blockedReasons,
    sourceContracts: normalizeSourceContracts(sourceContracts),
    boundaries: { ...WORKER_RUN_BOUNDARIES }
  };
  const withHash = {
    ...preview,
    planHash: computeWorkerRunPlanHash(preview)
  };

  assertWorkerRunPreviewContract(withHash);

  return withHash;
}

export function buildWorkerRunResult({
  preview,
  runId,
  startedAt = new Date().toISOString(),
  finishedAt = startedAt,
  status = 'needs-review',
  adapter = 'fake-codex-worker',
  realCodexOptIn = false,
  providerResult = {},
  verifier = null,
  evidenceRefs = null,
  failureLayer = null
} = {}) {
  assertWorkerRunPreviewContract(preview);

  const normalizedStatus = normalizeResultStatus(status);
  const normalizedVerifier = normalizeVerifier(verifier, providerResult);
  const normalizedEvidenceRefs = normalizeEvidenceRefs(evidenceRefs ?? providerResult.evidenceRefs);
  const normalizedFailureLayer = normalizeFailureLayer(failureLayer, normalizedStatus, normalizedVerifier);
  const result = {
    contractName: WORKER_RUN_RESULT_CONTRACT_NAME,
    contractVersion: WORKER_RUN_CONTRACT_VERSION,
    runId,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    providerId: WORKER_RUN_PROVIDER_ID,
    commandTemplateId: WORKER_RUN_COMMAND_TEMPLATE_ID,
    previewPlanHash: preview.planHash,
    startedAt: new Date(millisOrNow(startedAt)).toISOString(),
    finishedAt: new Date(millisOrNow(finishedAt)).toISOString(),
    status: normalizedStatus,
    adapter: firstNonEmptyString(adapter, 'fake-codex-worker'),
    realCodexOptIn: realCodexOptIn === true,
    sanitizedResult: sanitizeWorkerResult(providerResult, normalizedVerifier),
    verifier: normalizedVerifier,
    evidenceRefs: normalizedEvidenceRefs,
    nextState: nextStateForStatus(normalizedStatus),
    failureLayer: normalizedFailureLayer,
    boundaries: { ...WORKER_RUN_BOUNDARIES }
  };

  assertWorkerRunResultContract(result, { preview });

  return result;
}

export function computeWorkerRunPlanHash(preview) {
  const copy = cloneValue(preview);
  delete copy.planHash;
  return `sha256:${createHash('sha256').update(stableJson(copy)).digest('hex')}`;
}

export function validateWorkerRunPreviewContract(preview) {
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
  requireExact(errors, preview.contractName, 'contractName', WORKER_RUN_PREVIEW_CONTRACT_NAME);
  requireExact(errors, preview.contractVersion, 'contractVersion', WORKER_RUN_CONTRACT_VERSION);
  requireIsoTimestamp(errors, preview.generatedAt, 'generatedAt');
  requireEnum(errors, preview.state, 'state', PREVIEW_STATE_SET);
  validateGoal(errors, preview.goal, 'goal');
  validateTask(errors, preview.task, 'task');
  validateProvider(errors, preview.provider);
  validateCommandTemplate(errors, preview.commandTemplate);
  requireTimeout(errors, preview.timeoutMs, 'timeoutMs');
  validateWorkspacePolicy(errors, preview.workspacePolicy);
  validateConfirmation(errors, preview.confirmation, preview);
  validateResultPolicy(errors, preview.resultPolicy);
  validateStringArray(errors, preview.blockedReasons, 'blockedReasons');
  validateSourceContracts(errors, preview.sourceContracts, 'sourceContracts');
  validateBoundaries(errors, preview.boundaries, 'boundaries');
  requireHash(errors, preview.planHash, 'planHash');

  if (preview.state === 'ready' && Array.isArray(preview.blockedReasons) && preview.blockedReasons.length !== 0) {
    errors.push('ready preview must not include blockedReasons');
  }

  if (preview.state === 'blocked' && Array.isArray(preview.blockedReasons) && preview.blockedReasons.length === 0) {
    errors.push('blocked preview must include blockedReasons');
  }

  if (HASH_PATTERN.test(preview.planHash) && preview.planHash !== computeWorkerRunPlanHash(preview)) {
    errors.push('planHash must match worker run preview content');
  }

  validateUnsafeStrings(errors, preview, 'preview');

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertWorkerRunPreviewContract(preview) {
  const result = validateWorkerRunPreviewContract(preview);

  if (!result.ok) {
    throw new WorkerRunContractError(
      'invalid-worker-run-preview',
      'Worker run preview contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return preview;
}

export function validateWorkerRunResultContract(result, {
  preview = null
} = {}) {
  const errors = [];

  if (!isPlainObject(result)) {
    return invalidResult('result must be a plain object');
  }

  for (const field of RESULT_ALLOWED_FIELDS) {
    if (!Object.hasOwn(result, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, result, 'result', RESULT_ALLOWED_FIELDS);
  requireExact(errors, result.contractName, 'contractName', WORKER_RUN_RESULT_CONTRACT_NAME);
  requireExact(errors, result.contractVersion, 'contractVersion', WORKER_RUN_CONTRACT_VERSION);
  requireSafeToken(errors, result.runId, 'runId');
  requireSafeToken(errors, result.goalId, 'goalId');
  requireSafeToken(errors, result.taskId, 'taskId');
  requireExact(errors, result.providerId, 'providerId', WORKER_RUN_PROVIDER_ID);
  requireExact(errors, result.commandTemplateId, 'commandTemplateId', WORKER_RUN_COMMAND_TEMPLATE_ID);
  requireHash(errors, result.previewPlanHash, 'previewPlanHash');
  requireIsoTimestamp(errors, result.startedAt, 'startedAt');
  requireIsoTimestamp(errors, result.finishedAt, 'finishedAt');
  requireEnum(errors, result.status, 'status', RESULT_STATUS_SET);
  requireSafeToken(errors, result.adapter, 'adapter');
  requireBoolean(errors, result.realCodexOptIn, 'realCodexOptIn');
  validateSanitizedResult(errors, result.sanitizedResult);
  validateVerifier(errors, result.verifier);
  validateEvidenceRefs(errors, result.evidenceRefs, 'evidenceRefs', { requireNonEmpty: true });
  validateNextState(errors, result.nextState, result.status);
  validateFailureLayer(errors, result.failureLayer, result.status);
  validateBoundaries(errors, result.boundaries, 'boundaries');

  if (preview !== null) {
    const previewValidation = validateWorkerRunPreviewContract(preview);

    if (!previewValidation.ok) {
      errors.push(...previewValidation.errors.map((error) => `preview.${error}`));
    } else {
      if (preview.state !== 'ready') {
        errors.push('preview must be ready before worker result');
      }

      if (result.previewPlanHash !== preview.planHash) {
        errors.push('previewPlanHash must match worker run preview');
      }

      if (result.goalId !== preview.goal.goalId) {
        errors.push('goalId must match worker run preview');
      }

      if (result.taskId !== preview.task.taskId) {
        errors.push('taskId must match worker run preview');
      }
    }
  }

  validateUnsafeStrings(errors, result, 'result');

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertWorkerRunResultContract(result, options = {}) {
  const validation = validateWorkerRunResultContract(result, options);

  if (!validation.ok) {
    throw new WorkerRunContractError(
      'invalid-worker-run-result',
      'Worker run result contract is invalid.',
      { reason: validation.errors[0] }
    );
  }

  return result;
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

function workerProviderFromReadiness(providerReadiness) {
  const providers = Array.isArray(providerReadiness?.activeProviders) ? providerReadiness.activeProviders : [];
  const codexProvider = providers.find((provider) => provider?.providerId === WORKER_RUN_PROVIDER_ID);
  const readinessState = PROVIDER_READINESS_STATE_SET.has(codexProvider?.status) ? codexProvider.status : 'missing';

  return {
    providerId: WORKER_RUN_PROVIDER_ID,
    role: WORKER_RUN_ROLE,
    lane: 'codex-worker-candidate',
    readinessState,
    sourceContract: 'providerReadiness.v1',
    sourceRef: safeRef(providerReadiness?.sourceRef ?? 'fixtures/contracts/provider-readiness/provider-readiness.both-ready.v1.json')
  };
}

function normalizeCommandTemplate(commandTemplate) {
  const source = isPlainObject(commandTemplate) ? commandTemplate : {};

  return {
    templateId: firstNonEmptyString(source.templateId, WORKER_RUN_COMMAND_TEMPLATE_ID),
    providerId: firstNonEmptyString(source.providerId, WORKER_RUN_PROVIDER_ID),
    commandFamily: firstNonEmptyString(source.commandFamily, 'codex-worker-execution'),
    fixed: source.fixed !== false,
    acceptsFreeformCommand: source.acceptsFreeformCommand === true,
    rendererSuppliedCommandAvailable: source.rendererSuppliedCommandAvailable === true,
    sourceRef: safeRef(source.sourceRef ?? 'src/symphony/worker-run-contracts.js')
  };
}

function normalizeTimeoutMs(timeoutMs) {
  return Number.isInteger(timeoutMs) && timeoutMs >= 60000 && timeoutMs <= 1800000
    ? timeoutMs
    : WORKER_RUN_DEFAULT_TIMEOUT_MS;
}

function normalizeWorkspacePolicy(workspacePolicy) {
  const source = isPlainObject(workspacePolicy) ? workspacePolicy : {};

  return {
    policyId: firstNonEmptyString(source.policyId, 'isolated-provider-workspace-v1'),
    workspaceKind: firstNonEmptyString(source.workspaceKind, 'isolated-worktree'),
    backendOwned: source.backendOwned !== false,
    mainWorktreeWrite: source.mainWorktreeWrite === true,
    rendererSuppliedPathAvailable: source.rendererSuppliedPathAvailable === true,
    allowedWriteScope: firstNonEmptyString(source.allowedWriteScope, 'provider-workspace-only')
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
      requiredFor: ['codex-cli-readiness']
    }
  ];
}

function sanitizeWorkerResult(providerResult, verifier) {
  const source = isPlainObject(providerResult) ? providerResult : {};

  return {
    summary: firstNonEmptyString(source.summary, 'Worker run result recorded.'),
    changedFiles: safePathArray(source.changedFiles),
    validationCommands: safeCommandArray(source.validationCommands),
    artifactRefs: safeArtifactRefs(source.artifactRefs),
    verifierSummary: firstNonEmptyString(source.verifierSummary, verifier.summary),
    risks: safeStringArray(source.risks),
    blockers: safeStringArray(source.blockers)
  };
}

function normalizeVerifier(verifier, providerResult) {
  const source = isPlainObject(verifier) ? verifier : {};
  const resultSource = isPlainObject(providerResult) ? providerResult : {};
  const state = VERIFIER_STATE_SET.has(source.state)
    ? source.state
    : VERIFIER_STATE_SET.has(resultSource.verifierState)
      ? resultSource.verifierState
      : 'passed';

  return {
    state,
    summary: firstNonEmptyString(source.summary, resultSource.verifierSummary, state === 'passed' ? 'Focused checks passed.' : 'Focused checks did not pass.'),
    commands: safeCommandArray(source.commands ?? resultSource.validationCommands),
    evidenceRefs: normalizeEvidenceRefs(source.evidenceRefs ?? resultSource.evidenceRefs)
  };
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

function safeArtifactRefs(artifactRefs) {
  return safeStringArray(artifactRefs).filter((ref) => !UNSAFE_TEXT_PATTERN.test(ref));
}

function normalizeResultStatus(status) {
  return RESULT_STATUS_SET.has(status) ? status : 'needs-review';
}

function normalizeFailureLayer(failureLayer, status, verifier) {
  const source = isPlainObject(failureLayer) ? failureLayer : {};
  const inferredKind = status === 'failed' && verifier.state === 'failed' ? 'verifier-failed' : status === 'blocked' ? 'contract-blocked' : 'none';
  const kind = FAILURE_KIND_SET.has(source.kind) ? source.kind : inferredKind;

  return {
    kind,
    reason: kind === 'none' ? null : firstNonEmptyString(source.reason, verifier.summary, kind),
    retryable: source.retryable === true
  };
}

function nextStateForStatus(status) {
  if (status === 'needs-review') {
    return {
      taskState: 'needs-review',
      reviewRequired: true,
      taskCompleted: false,
      reviewApproved: false,
      mainVerified: false,
      releaseReady: false
    };
  }

  return {
    taskState: status,
    reviewRequired: false,
    taskCompleted: false,
    reviewApproved: false,
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
  requireExact(errors, provider?.providerId, 'provider.providerId', WORKER_RUN_PROVIDER_ID);
  requireExact(errors, provider?.role, 'provider.role', WORKER_RUN_ROLE);
  requireExact(errors, provider?.lane, 'provider.lane', 'codex-worker-candidate');
  requireEnum(errors, provider?.readinessState, 'provider.readinessState', PROVIDER_READINESS_STATE_SET);
  requireExact(errors, provider?.sourceContract, 'provider.sourceContract', 'providerReadiness.v1');
  requireSafeRef(errors, provider?.sourceRef, 'provider.sourceRef');
}

function validateCommandTemplate(errors, commandTemplate) {
  validateAllowedObject(errors, commandTemplate, 'commandTemplate', COMMAND_TEMPLATE_ALLOWED_FIELDS);
  requireExact(errors, commandTemplate?.templateId, 'commandTemplate.templateId', WORKER_RUN_COMMAND_TEMPLATE_ID);
  requireExact(errors, commandTemplate?.providerId, 'commandTemplate.providerId', WORKER_RUN_PROVIDER_ID);
  requireExact(errors, commandTemplate?.commandFamily, 'commandTemplate.commandFamily', 'codex-worker-execution');
  requireExact(errors, commandTemplate?.fixed, 'commandTemplate.fixed', true);
  requireExact(errors, commandTemplate?.acceptsFreeformCommand, 'commandTemplate.acceptsFreeformCommand', false);
  requireExact(errors, commandTemplate?.rendererSuppliedCommandAvailable, 'commandTemplate.rendererSuppliedCommandAvailable', false);
  requireSafeRef(errors, commandTemplate?.sourceRef, 'commandTemplate.sourceRef');
}

function validateWorkspacePolicy(errors, workspacePolicy) {
  validateAllowedObject(errors, workspacePolicy, 'workspacePolicy', WORKSPACE_POLICY_ALLOWED_FIELDS);
  requireSafeToken(errors, workspacePolicy?.policyId, 'workspacePolicy.policyId');
  requireEnum(errors, workspacePolicy?.workspaceKind, 'workspacePolicy.workspaceKind', new Set(['isolated-worktree', 'temporary-workspace']));
  requireExact(errors, workspacePolicy?.backendOwned, 'workspacePolicy.backendOwned', true);
  requireExact(errors, workspacePolicy?.mainWorktreeWrite, 'workspacePolicy.mainWorktreeWrite', false);
  requireExact(errors, workspacePolicy?.rendererSuppliedPathAvailable, 'workspacePolicy.rendererSuppliedPathAvailable', false);
  requireExact(errors, workspacePolicy?.allowedWriteScope, 'workspacePolicy.allowedWriteScope', 'provider-workspace-only');
}

function validateConfirmation(errors, confirmation, preview) {
  validateAllowedObject(errors, confirmation, 'confirmation', CONFIRMATION_ALLOWED_FIELDS);
  requireExact(errors, confirmation?.requiresPlanHash, 'confirmation.requiresPlanHash', true);
  validateStringArray(errors, confirmation?.requiredFields, 'confirmation.requiredFields');
  for (const field of ['planHash', 'goalId', 'taskId', 'providerId', 'commandTemplateId', 'timeoutMs', 'workspacePolicyId']) {
    if (!Array.isArray(confirmation?.requiredFields) || !confirmation.requiredFields.includes(field)) {
      errors.push(`confirmation.requiredFields must include ${field}`);
    }
  }
  requireExact(errors, confirmation?.providerId, 'confirmation.providerId', WORKER_RUN_PROVIDER_ID);
  requireExact(errors, confirmation?.commandTemplateId, 'confirmation.commandTemplateId', WORKER_RUN_COMMAND_TEMPLATE_ID);
  requireExact(errors, confirmation?.timeoutMs, 'confirmation.timeoutMs', preview?.timeoutMs);
  requireExact(errors, confirmation?.workspacePolicyId, 'confirmation.workspacePolicyId', preview?.workspacePolicy?.policyId);
}

function validateResultPolicy(errors, resultPolicy) {
  validateAllowedObject(errors, resultPolicy, 'resultPolicy', RESULT_POLICY_ALLOWED_FIELDS);
  requireExact(errors, resultPolicy?.successState, 'resultPolicy.successState', 'needs-review');
  requireExact(errors, resultPolicy?.reviewRequired, 'resultPolicy.reviewRequired', true);
  requireExact(errors, resultPolicy?.taskCompletionAvailable, 'resultPolicy.taskCompletionAvailable', false);
  requireExact(errors, resultPolicy?.reviewApprovalAvailable, 'resultPolicy.reviewApprovalAvailable', false);
  requireExact(errors, resultPolicy?.mainVerificationAvailable, 'resultPolicy.mainVerificationAvailable', false);
  requireExact(errors, resultPolicy?.releaseReadinessAvailable, 'resultPolicy.releaseReadinessAvailable', false);
}

function validateSanitizedResult(errors, sanitizedResult) {
  validateAllowedObject(errors, sanitizedResult, 'sanitizedResult', SANITIZED_RESULT_ALLOWED_FIELDS);
  requireString(errors, sanitizedResult?.summary, 'sanitizedResult.summary');
  validateSafePaths(errors, sanitizedResult?.changedFiles, 'sanitizedResult.changedFiles');
  validateStringArray(errors, sanitizedResult?.validationCommands, 'sanitizedResult.validationCommands');
  validateStringArray(errors, sanitizedResult?.artifactRefs, 'sanitizedResult.artifactRefs');
  requireString(errors, sanitizedResult?.verifierSummary, 'sanitizedResult.verifierSummary');
  validateStringArray(errors, sanitizedResult?.risks, 'sanitizedResult.risks');
  validateStringArray(errors, sanitizedResult?.blockers, 'sanitizedResult.blockers');
}

function validateVerifier(errors, verifier) {
  validateAllowedObject(errors, verifier, 'verifier', VERIFIER_ALLOWED_FIELDS);
  requireEnum(errors, verifier?.state, 'verifier.state', VERIFIER_STATE_SET);
  requireString(errors, verifier?.summary, 'verifier.summary');
  validateStringArray(errors, verifier?.commands, 'verifier.commands');
  validateEvidenceRefs(errors, verifier?.evidenceRefs, 'verifier.evidenceRefs');
}

function validateNextState(errors, nextState, status) {
  validateAllowedObject(errors, nextState, 'nextState', NEXT_STATE_ALLOWED_FIELDS);
  const expectedTaskState = status === 'needs-review' ? 'needs-review' : status;

  requireExact(errors, nextState?.taskState, 'nextState.taskState', expectedTaskState);
  requireExact(errors, nextState?.reviewRequired, 'nextState.reviewRequired', status === 'needs-review');
  requireExact(errors, nextState?.taskCompleted, 'nextState.taskCompleted', false);
  requireExact(errors, nextState?.reviewApproved, 'nextState.reviewApproved', false);
  requireExact(errors, nextState?.mainVerified, 'nextState.mainVerified', false);
  requireExact(errors, nextState?.releaseReady, 'nextState.releaseReady', false);
}

function validateFailureLayer(errors, failureLayer, status) {
  validateAllowedObject(errors, failureLayer, 'failureLayer', FAILURE_LAYER_ALLOWED_FIELDS);
  requireEnum(errors, failureLayer?.kind, 'failureLayer.kind', FAILURE_KIND_SET);
  if (status === 'needs-review') {
    requireExact(errors, failureLayer?.kind, 'failureLayer.kind', 'none');
    requireExact(errors, failureLayer?.reason, 'failureLayer.reason', null);
  } else if (failureLayer?.kind === 'none') {
    errors.push('failureLayer.kind must identify a failure when status is not needs-review');
  }
  requireBoolean(errors, failureLayer?.retryable, 'failureLayer.retryable');
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
  validateAllowedObject(errors, boundaries, path, new Set(Object.keys(WORKER_RUN_BOUNDARIES)));
  for (const [key, expected] of Object.entries(WORKER_RUN_BOUNDARIES)) {
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
    errors.push(`${path} must be an integer between 60000 and 1800000`);
  }
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireEnum(errors, value, path, values) {
  if (!values.has(value)) {
    errors.push(`${path} must be one of ${Array.from(values).join(', ')}`);
  }
}

function validateStringArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.length === 0) {
      errors.push(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function safeStringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.length > 0)
    : [];
}

function safePathArray(value) {
  return safeStringArray(value).filter(isSafeRelativePath);
}

function safeCommandArray(value) {
  return safeStringArray(value).filter((item) => !UNSAFE_TEXT_PATTERN.test(item));
}

function isSafeRelativePath(value) {
  return typeof value === 'string' &&
    value.length > 0 &&
    !value.startsWith('/') &&
    !value.startsWith('../') &&
    !value.includes('/../') &&
    !/(^|[/])(?:\.git|\.codex|\.claude|\.symphony)(?:[/]|$)/u.test(value) &&
    !UNSAFE_TEXT_PATTERN.test(value);
}

function safeToken(value) {
  return typeof value === 'string' && SAFE_TOKEN_PATTERN.test(value) ? value : null;
}

function safeContractName(value) {
  return typeof value === 'string' && SAFE_CONTRACT_PATTERN.test(value) ? value : null;
}

function safeRef(value) {
  return typeof value === 'string' && value.length > 0 && !UNSAFE_TEXT_PATTERN.test(value) ? value : null;
}

function firstNonEmptyString(...values) {
  return values.find((value) => typeof value === 'string' && value.length > 0) ?? null;
}

function uniqueStrings(values) {
  return [...new Set(safeStringArray(values))];
}

function collectStrings(value, path) {
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

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(',')}]`;
  }

  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function cloneValue(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function millisOrNow(value) {
  const millis = Date.parse(value);
  return Number.isFinite(millis) ? millis : Date.now();
}

function invalidResult(message) {
  return {
    ok: false,
    errors: [message]
  };
}
