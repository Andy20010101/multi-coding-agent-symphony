import { createHash } from 'node:crypto';

export const CODEX_PROVIDER_EXECUTION_PREVIEW_CONTRACT_NAME = 'codexProviderExecutionPreview.v1';
export const CODEX_PROVIDER_EXECUTION_CONFIRMATION_CONTRACT_NAME = 'codexProviderExecutionConfirmation.v1';
export const CODEX_PROVIDER_RUN_RECORD_CONTRACT_NAME = 'codexProviderRunRecord.v1';
export const CODEX_PROVIDER_EXECUTION_CONTRACT_VERSION = 1;
export const CODEX_PROVIDER_ID = 'codex';
export const CODEX_PROVIDER_ROLE = 'worker';
export const CODEX_PROVIDER_RESULT_RETURN_PATH = 'v51-result-intake';
export const CODEX_PROVIDER_RESULT_INTAKE_CONTRACT_NAME = 'resultIntakeRequest.v1';

export const CODEX_PROVIDER_EXECUTION_RESULT_RETURN = Object.freeze({
  returnPath: CODEX_PROVIDER_RESULT_RETURN_PATH,
  resultIntakeContract: CODEX_PROVIDER_RESULT_INTAKE_CONTRACT_NAME,
  resultIntakeRequestRequired: true,
  sanitizedResultRequired: true,
  directGoalEventAppendAvailable: false,
  directTaskCompleteAvailable: false,
  reviewerMutationAvailable: false,
  mainVerificationMutationAvailable: false,
  releaseGateMutationAvailable: false,
  rawTranscriptAvailable: false,
  rawModelOutputAvailable: false
});

export const CODEX_PROVIDER_EXECUTION_BOUNDARIES = Object.freeze({
  codexOnly: true,
  workerRoleOnly: true,
  explicitOperatorConfirmationRequired: true,
  previewHashRequired: true,
  providerExecutionStartsOnPreview: false,
  providerExecutionStartsWithoutConfirmation: false,
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
  automaticWorktreeCreationAvailable: false,
  gitMutationAvailable: false,
  tagAutomationAvailable: false,
  publishAutomationAvailable: false,
  githubReleaseAutomationAvailable: false
});

export const CODEX_PROVIDER_RESULT_INTAKE_BOUNDARIES = Object.freeze({
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

const PREVIEW_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'goal',
  'task',
  'providerId',
  'role',
  'taskPackRef',
  'taskPackHash',
  'inputSummary',
  'executionPolicy',
  'resultReturn',
  'blockedReasons',
  'sourceContracts',
  'boundaries',
  'previewHash'
]);
const CONFIRMATION_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'previewHash',
  'providerId',
  'goalId',
  'taskId',
  'role',
  'operatorId',
  'confirmedAt',
  'resultReturn',
  'boundaries'
]);
const RUN_RECORD_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'runId',
  'providerId',
  'role',
  'goalId',
  'taskId',
  'previewHash',
  'taskPackHash',
  'startedAt',
  'finishedAt',
  'status',
  'sanitizedResult',
  'resultIntakeRequest',
  'evidenceRefs',
  'sourceContracts',
  'boundaries'
]);
const GOAL_ALLOWED_FIELDS = new Set(['goalId', 'title', 'state', 'sourceContract', 'sourceRef']);
const TASK_ALLOWED_FIELDS = new Set(['taskId', 'title', 'state', 'sourceContract', 'sourceRef']);
const INPUT_SUMMARY_ALLOWED_FIELDS = new Set([
  'taskPackAvailable',
  'taskPackSourceContract',
  'taskPromptSummary',
  'acceptanceCriteria',
  'evidenceRefs',
  'providerPolicyReason'
]);
const EXECUTION_POLICY_ALLOWED_FIELDS = new Set([
  'providerId',
  'role',
  'allowedProviders',
  'allowedRoles',
  'requiresOperatorConfirmation',
  'requiresPreviewHash',
  'startsOnPreview',
  'arbitraryCommandAvailable',
  'genericShellAvailable',
  'rawTranscriptAvailable',
  'rawModelOutputAvailable'
]);
const RESULT_RETURN_ALLOWED_FIELDS = new Set(Object.keys(CODEX_PROVIDER_EXECUTION_RESULT_RETURN));
const BOUNDARY_ALLOWED_FIELDS = new Set(Object.keys(CODEX_PROVIDER_EXECUTION_BOUNDARIES));
const RESULT_INTAKE_BOUNDARY_ALLOWED_FIELDS = new Set(Object.keys(CODEX_PROVIDER_RESULT_INTAKE_BOUNDARIES));
const SOURCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label', 'generatedAt']);
const SOURCE_CONTRACT_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'readOnly',
  'requiredFor',
  'previewHash',
  'sourceRef'
]);
const SANITIZED_RESULT_ALLOWED_FIELDS = new Set([
  'status',
  'summary',
  'changedFiles',
  'validationCommands',
  'risks',
  'blockers',
  'blockerReason'
]);
const RESULT_INTAKE_REQUEST_ALLOWED_FIELDS = new Set([
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
]);
const RESULT_BLOCK_ALLOWED_FIELDS = new Set([
  'status',
  'summary',
  'changedFiles',
  'validationCommands',
  'risks',
  'blockers',
  'blockerReason'
]);
const REQUESTED_EVENT_ALLOWED_FIELDS = new Set(['eventType', 'taskId', 'blocker']);
const BLOCKER_ALLOWED_FIELDS = new Set(['blockerId', 'reason', 'severity']);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label']);

const GOAL_STATE_SET = new Set(['active', 'ready', 'blocked', 'pending', 'missing']);
const REF_KIND_SET = new Set(['contract', 'fixture', 'docs', 'route', 'run-record']);
const EVIDENCE_REF_KIND_SET = new Set(['repo-doc', 'artifact-ref', 'commit', 'command-evidence', 'external-note']);
const RUN_STATUS_SET = new Set(['completed', 'blocked']);
const RESULT_EVENT_SET = new Set(['worker.evidence-recorded', 'blocker.opened']);
const SOURCE_CONTRACT_NAME_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const COMMIT_PATTERN = /^[a-f0-9]{7,64}$/u;
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const RAW_FIELD_NAME_PATTERN =
  /^(?:rawTranscript|transcript|rawModelOutput|rawOutput|providerOutput|sessionLog|messages|conversation)$/iu;
const UNSAFE_TEXT_PATTERN =
  /\b(?:raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log|session[\s_-]*file|model[\s_-]*output|provider[\s_-]*parity)\b|(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\.jsonl(?:$|[/\s])|\/api\/(?:providers?|provider-parity|child(?:-dispatch)?|dispatch)(?:$|[/\s])|\/(?:event-append|append-event|mark-complete|complete-task|git|tag|publish|release)(?:$|[/\s])|\b(?:append\s+event|mark\s+complete|confirm\s+reviewer\s+verdict|confirm\s+main\s+gate|confirm\s+release\s+gate|git\s+(?:push|tag|checkout|merge|commit)|gh\s+release|tag\s+creation|github\s+release|publish\s+release)\b/iu;
const LOCAL_HIDDEN_PATH_SEGMENTS = new Set(['.codex', '.claude', '.git', '.symphony']);

export class CodexProviderExecutionContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CodexProviderExecutionContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildCodexProviderExecutionPreview({
  generatedAt = new Date().toISOString(),
  goal = defaultGoal(),
  task = defaultTask(),
  taskPack = null,
  taskPackRef = defaultTaskPackRef(),
  providerId = CODEX_PROVIDER_ID,
  role = CODEX_PROVIDER_ROLE,
  sourceContracts = defaultPreviewSourceContracts(),
  blockedReasons: inputBlockedReasons = []
} = {}) {
  const normalizedGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();
  const taskPackAvailable = isPlainObject(taskPack);
  const taskPackProvider = taskPackAvailable ? taskPack.preferredProvider : null;
  const taskPackRole = taskPackAvailable ? taskPack.role : null;
  const returnPath = taskPackAvailable ? taskPack.returnPath : null;
  const blockedReasons = uniqueStrings([
    ...safeTextArray(inputBlockedReasons),
    ...(!taskPackAvailable ? ['task-pack-missing'] : []),
    ...(providerId !== CODEX_PROVIDER_ID || (taskPackProvider !== null && taskPackProvider !== CODEX_PROVIDER_ID)
      ? ['unsupported-provider']
      : []),
    ...(role !== CODEX_PROVIDER_ROLE || (taskPackRole !== null && taskPackRole !== CODEX_PROVIDER_ROLE)
      ? ['unsupported-role']
      : []),
    ...(returnPath !== null && returnPath !== CODEX_PROVIDER_RESULT_RETURN_PATH ? ['unsupported-result-return'] : [])
  ]);
  const ready = blockedReasons.length === 0;
  const preview = {
    contractName: CODEX_PROVIDER_EXECUTION_PREVIEW_CONTRACT_NAME,
    contractVersion: CODEX_PROVIDER_EXECUTION_CONTRACT_VERSION,
    generatedAt: normalizedGeneratedAt,
    goal: cloneValue(goal),
    task: cloneValue(task),
    providerId: CODEX_PROVIDER_ID,
    role: CODEX_PROVIDER_ROLE,
    taskPackRef: ready ? cloneValue(taskPackRef) : null,
    taskPackHash: ready ? codexProviderExecutionHash(taskPack) : null,
    inputSummary: buildInputSummary({
      taskPack,
      taskPackAvailable,
      blockedReasons
    }),
    executionPolicy: buildExecutionPolicy(),
    resultReturn: buildResultReturn(),
    blockedReasons,
    sourceContracts: cloneValue(sourceContracts),
    boundaries: buildBoundaries()
  };

  const withHash = {
    ...preview,
    previewHash: computeCodexProviderExecutionPreviewHash(preview)
  };

  assertCodexProviderExecutionPreviewContract(withHash);

  return withHash;
}

export function buildCodexProviderExecutionConfirmation(preview, {
  operatorId,
  confirmedAt = new Date().toISOString()
} = {}) {
  assertCodexProviderExecutionPreviewContract(preview);

  const confirmation = {
    contractName: CODEX_PROVIDER_EXECUTION_CONFIRMATION_CONTRACT_NAME,
    contractVersion: CODEX_PROVIDER_EXECUTION_CONTRACT_VERSION,
    previewHash: preview.previewHash,
    providerId: CODEX_PROVIDER_ID,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    role: CODEX_PROVIDER_ROLE,
    operatorId,
    confirmedAt: new Date(millisOrNow(confirmedAt)).toISOString(),
    resultReturn: buildResultReturn(),
    boundaries: buildBoundaries()
  };

  assertCodexProviderExecutionConfirmationContract(confirmation, { preview });

  return confirmation;
}

export function buildCodexProviderRunRecord({
  preview,
  confirmation,
  runId,
  startedAt = new Date().toISOString(),
  finishedAt = startedAt,
  status = 'completed',
  providerResult = {}
} = {}) {
  assertCodexProviderExecutionPreviewContract(preview);
  assertCodexProviderExecutionConfirmationContract(confirmation, { preview });

  const normalizedStatus = status === 'blocked' ? 'blocked' : 'completed';
  const effectiveStartedAt = new Date(millisOrNow(startedAt)).toISOString();
  const effectiveFinishedAt = new Date(millisOrNow(finishedAt)).toISOString();
  const evidenceRefs = normalizeEvidenceRefs(providerResult.evidenceRefs);
  const sanitizedResult = sanitizeProviderResult(providerResult, {
    status: normalizedStatus
  });
  const resultIntakeRequest = buildResultIntakeRequest({
    preview,
    status: normalizedStatus,
    sanitizedResult,
    evidenceRefs,
    submittedAt: effectiveFinishedAt
  });
  const runRecord = {
    contractName: CODEX_PROVIDER_RUN_RECORD_CONTRACT_NAME,
    contractVersion: CODEX_PROVIDER_EXECUTION_CONTRACT_VERSION,
    runId,
    providerId: CODEX_PROVIDER_ID,
    role: CODEX_PROVIDER_ROLE,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    previewHash: preview.previewHash,
    taskPackHash: preview.taskPackHash,
    startedAt: effectiveStartedAt,
    finishedAt: effectiveFinishedAt,
    status: normalizedStatus,
    sanitizedResult,
    resultIntakeRequest,
    evidenceRefs,
    sourceContracts: buildRunRecordSourceContracts({ preview, confirmation }),
    boundaries: buildBoundaries()
  };

  assertCodexProviderRunRecordContract(runRecord, { preview, confirmation });

  return runRecord;
}

export function validateCodexProviderExecutionPreviewContract(preview) {
  const errors = [];

  if (!isPlainObject(preview)) {
    return invalidResult('preview must be a plain object');
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'generatedAt',
    'goal',
    'task',
    'providerId',
    'role',
    'taskPackRef',
    'taskPackHash',
    'inputSummary',
    'executionPolicy',
    'resultReturn',
    'blockedReasons',
    'sourceContracts',
    'boundaries',
    'previewHash'
  ]) {
    if (!Object.hasOwn(preview, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, preview, 'preview', PREVIEW_ALLOWED_FIELDS);
  requireExact(errors, preview.contractName, 'contractName', CODEX_PROVIDER_EXECUTION_PREVIEW_CONTRACT_NAME);
  requireExact(errors, preview.contractVersion, 'contractVersion', CODEX_PROVIDER_EXECUTION_CONTRACT_VERSION);
  requireIsoTimestamp(errors, preview.generatedAt, 'generatedAt');
  validateGoal(errors, preview.goal);
  validateTask(errors, preview.task);
  requireExact(errors, preview.providerId, 'providerId', CODEX_PROVIDER_ID);
  requireExact(errors, preview.role, 'role', CODEX_PROVIDER_ROLE);
  validateInputSummary(errors, preview.inputSummary);
  validateExecutionPolicy(errors, preview.executionPolicy);
  validateResultReturn(errors, preview.resultReturn, 'resultReturn');
  validateStringArray(errors, preview.blockedReasons, 'blockedReasons');
  validateSourceContracts(errors, preview.sourceContracts, 'sourceContracts');
  validateBoundaries(errors, preview.boundaries, 'boundaries');
  requireHash(errors, preview.previewHash, 'previewHash');
  validatePreviewReadinessBinding(errors, preview);

  if (HASH_PATTERN.test(preview.previewHash) && preview.previewHash !== computeCodexProviderExecutionPreviewHash(preview)) {
    errors.push('previewHash must match codex provider execution preview content');
  }

  for (const field of findUnsafeFields(preview, 'preview')) {
    errors.push(`${field} must not contain raw provider output, local session refs, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertCodexProviderExecutionPreviewContract(preview) {
  const result = validateCodexProviderExecutionPreviewContract(preview);

  if (!result.ok) {
    throw new CodexProviderExecutionContractError(
      'invalid-codex-provider-execution-preview',
      'Codex provider execution preview contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return preview;
}

export function validateCodexProviderExecutionConfirmationContract(confirmation, {
  preview = null
} = {}) {
  const errors = [];

  if (!isPlainObject(confirmation)) {
    return invalidResult('confirmation must be a plain object');
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'previewHash',
    'providerId',
    'goalId',
    'taskId',
    'role',
    'operatorId',
    'confirmedAt',
    'resultReturn',
    'boundaries'
  ]) {
    if (!Object.hasOwn(confirmation, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, confirmation, 'confirmation', CONFIRMATION_ALLOWED_FIELDS);
  requireExact(
    errors,
    confirmation.contractName,
    'contractName',
    CODEX_PROVIDER_EXECUTION_CONFIRMATION_CONTRACT_NAME
  );
  requireExact(errors, confirmation.contractVersion, 'contractVersion', CODEX_PROVIDER_EXECUTION_CONTRACT_VERSION);
  requireHash(errors, confirmation.previewHash, 'previewHash');
  requireExact(errors, confirmation.providerId, 'providerId', CODEX_PROVIDER_ID);
  requireSafeToken(errors, confirmation.goalId, 'goalId');
  requireSafeToken(errors, confirmation.taskId, 'taskId');
  requireExact(errors, confirmation.role, 'role', CODEX_PROVIDER_ROLE);
  requireSafeToken(errors, confirmation.operatorId, 'operatorId');
  requireIsoTimestamp(errors, confirmation.confirmedAt, 'confirmedAt');
  validateResultReturn(errors, confirmation.resultReturn, 'resultReturn');
  validateBoundaries(errors, confirmation.boundaries, 'boundaries');

  if (preview !== null) {
    const previewValidation = validateCodexProviderExecutionPreviewContract(preview);

    if (!previewValidation.ok) {
      errors.push(...previewValidation.errors.map((error) => `preview.${error}`));
    } else {
      if (preview.blockedReasons.length !== 0) {
        errors.push('preview must be ready before confirmation');
      }

      if (confirmation.previewHash !== preview.previewHash) {
        errors.push('previewHash must match codex provider execution preview');
      }

      if (confirmation.goalId !== preview.goal.goalId) {
        errors.push('goalId must match codex provider execution preview');
      }

      if (confirmation.taskId !== preview.task.taskId) {
        errors.push('taskId must match codex provider execution preview');
      }
    }
  }

  for (const field of findUnsafeFields(confirmation, 'confirmation')) {
    errors.push(`${field} must not contain raw provider output, local session refs, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertCodexProviderExecutionConfirmationContract(confirmation, options = {}) {
  const result = validateCodexProviderExecutionConfirmationContract(confirmation, options);

  if (!result.ok) {
    throw new CodexProviderExecutionContractError(
      'invalid-codex-provider-execution-confirmation',
      'Codex provider execution confirmation contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return confirmation;
}

export function validateCodexProviderRunRecordContract(runRecord, {
  preview = null,
  confirmation = null
} = {}) {
  const errors = [];

  if (!isPlainObject(runRecord)) {
    return invalidResult('runRecord must be a plain object');
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'runId',
    'providerId',
    'role',
    'goalId',
    'taskId',
    'previewHash',
    'taskPackHash',
    'startedAt',
    'finishedAt',
    'status',
    'sanitizedResult',
    'resultIntakeRequest',
    'evidenceRefs',
    'sourceContracts',
    'boundaries'
  ]) {
    if (!Object.hasOwn(runRecord, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, runRecord, 'runRecord', RUN_RECORD_ALLOWED_FIELDS);
  requireExact(errors, runRecord.contractName, 'contractName', CODEX_PROVIDER_RUN_RECORD_CONTRACT_NAME);
  requireExact(errors, runRecord.contractVersion, 'contractVersion', CODEX_PROVIDER_EXECUTION_CONTRACT_VERSION);
  requireSafeToken(errors, runRecord.runId, 'runId');
  requireExact(errors, runRecord.providerId, 'providerId', CODEX_PROVIDER_ID);
  requireExact(errors, runRecord.role, 'role', CODEX_PROVIDER_ROLE);
  requireSafeToken(errors, runRecord.goalId, 'goalId');
  requireSafeToken(errors, runRecord.taskId, 'taskId');
  requireHash(errors, runRecord.previewHash, 'previewHash');
  requireHash(errors, runRecord.taskPackHash, 'taskPackHash');
  requireIsoTimestamp(errors, runRecord.startedAt, 'startedAt');
  requireIsoTimestamp(errors, runRecord.finishedAt, 'finishedAt');
  requireEnum(errors, runRecord.status, 'status', RUN_STATUS_SET);
  validateSanitizedResult(errors, runRecord.sanitizedResult, 'sanitizedResult');
  validateResultIntakeRequest(errors, runRecord.resultIntakeRequest, 'resultIntakeRequest');
  validateEvidenceRefs(errors, runRecord.evidenceRefs, 'evidenceRefs', { requireNonEmpty: true });
  validateSourceContracts(errors, runRecord.sourceContracts, 'sourceContracts');
  validateBoundaries(errors, runRecord.boundaries, 'boundaries');
  validateRunRecordBinding(errors, runRecord);

  if (preview !== null) {
    const previewValidation = validateCodexProviderExecutionPreviewContract(preview);

    if (!previewValidation.ok) {
      errors.push(...previewValidation.errors.map((error) => `preview.${error}`));
    } else {
      if (runRecord.previewHash !== preview.previewHash) {
        errors.push('previewHash must match codex provider execution preview');
      }

      if (runRecord.taskPackHash !== preview.taskPackHash) {
        errors.push('taskPackHash must match codex provider execution preview');
      }

      if (runRecord.goalId !== preview.goal.goalId) {
        errors.push('goalId must match codex provider execution preview');
      }

      if (runRecord.taskId !== preview.task.taskId) {
        errors.push('taskId must match codex provider execution preview');
      }
    }
  }

  if (confirmation !== null) {
    const confirmationValidation = validateCodexProviderExecutionConfirmationContract(confirmation, {
      preview
    });

    if (!confirmationValidation.ok) {
      errors.push(...confirmationValidation.errors.map((error) => `confirmation.${error}`));
    } else if (runRecord.previewHash !== confirmation.previewHash) {
      errors.push('previewHash must match codex provider execution confirmation');
    }
  }

  for (const field of findUnsafeFields(runRecord, 'runRecord')) {
    errors.push(`${field} must not contain raw provider output, local session refs, or direct mutation routes`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertCodexProviderRunRecordContract(runRecord, options = {}) {
  const result = validateCodexProviderRunRecordContract(runRecord, options);

  if (!result.ok) {
    throw new CodexProviderExecutionContractError(
      'invalid-codex-provider-run-record',
      'Codex provider run record contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return runRecord;
}

export function computeCodexProviderExecutionPreviewHash(preview) {
  return codexProviderExecutionHash(buildCodexProviderExecutionPreviewHashPayload(preview));
}

export function buildCodexProviderExecutionPreviewHashPayload(preview) {
  return {
    contractName: preview.contractName,
    contractVersion: preview.contractVersion,
    generatedAt: preview.generatedAt,
    goal: preview.goal,
    task: preview.task,
    providerId: preview.providerId,
    role: preview.role,
    taskPackRef: preview.taskPackRef,
    taskPackHash: preview.taskPackHash,
    inputSummary: preview.inputSummary,
    executionPolicy: preview.executionPolicy,
    resultReturn: preview.resultReturn,
    blockedReasons: preview.blockedReasons,
    sourceContracts: preview.sourceContracts,
    boundaries: preview.boundaries
  };
}

export function codexProviderExecutionHash(value) {
  return `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`;
}

function validatePreviewReadinessBinding(errors, preview) {
  const blockedReasons = Array.isArray(preview.blockedReasons) ? preview.blockedReasons : [];

  if (blockedReasons.length === 0) {
    validateSourceRef(errors, preview.taskPackRef, 'taskPackRef');
    requireHash(errors, preview.taskPackHash, 'taskPackHash');
    requireExact(errors, preview.inputSummary?.taskPackAvailable, 'inputSummary.taskPackAvailable', true);
    return;
  }

  requireExact(errors, preview.taskPackRef, 'taskPackRef', null);
  requireExact(errors, preview.taskPackHash, 'taskPackHash', null);

  if (blockedReasons.includes('task-pack-missing')) {
    requireExact(errors, preview.inputSummary?.taskPackAvailable, 'inputSummary.taskPackAvailable', false);
  }
}

function validateRunRecordBinding(errors, runRecord) {
  if (!isPlainObject(runRecord.sanitizedResult) || !isPlainObject(runRecord.resultIntakeRequest)) {
    return;
  }

  if (runRecord.resultIntakeRequest.goalId !== runRecord.goalId) {
    errors.push('resultIntakeRequest.goalId must match runRecord.goalId');
  }

  if (runRecord.resultIntakeRequest.taskId !== runRecord.taskId) {
    errors.push('resultIntakeRequest.taskId must match runRecord.taskId');
  }

  if (runRecord.resultIntakeRequest.resultBlock?.status !== runRecord.sanitizedResult.status) {
    errors.push('resultIntakeRequest.resultBlock.status must match sanitizedResult.status');
  }

  if (runRecord.status === 'completed') {
    requireExact(
      errors,
      runRecord.resultIntakeRequest.requestedEvent?.eventType,
      'resultIntakeRequest.requestedEvent.eventType',
      'worker.evidence-recorded'
    );
  }

  if (runRecord.status === 'blocked') {
    requireExact(
      errors,
      runRecord.resultIntakeRequest.requestedEvent?.eventType,
      'resultIntakeRequest.requestedEvent.eventType',
      'blocker.opened'
    );
    requireNonEmptyString(errors, runRecord.sanitizedResult.blockerReason, 'sanitizedResult.blockerReason');
  }
}

function validateGoal(errors, goal) {
  if (!isPlainObject(goal)) {
    errors.push('goal must be a plain object');
    return;
  }

  validateAllowedFields(errors, goal, 'goal', GOAL_ALLOWED_FIELDS);
  requireSafeToken(errors, goal.goalId, 'goal.goalId');
  requireNonEmptyString(errors, goal.title, 'goal.title');
  requireEnum(errors, goal.state, 'goal.state', GOAL_STATE_SET);
  validateNullableSourceContractName(errors, goal.sourceContract, 'goal.sourceContract');

  if (goal.sourceRef !== undefined) {
    validateSourceRef(errors, goal.sourceRef, 'goal.sourceRef');
  }
}

function validateTask(errors, task) {
  if (!isPlainObject(task)) {
    errors.push('task must be a plain object');
    return;
  }

  validateAllowedFields(errors, task, 'task', TASK_ALLOWED_FIELDS);
  requireSafeToken(errors, task.taskId, 'task.taskId');
  requireNonEmptyString(errors, task.title, 'task.title');
  requireEnum(errors, task.state, 'task.state', GOAL_STATE_SET);
  validateNullableSourceContractName(errors, task.sourceContract, 'task.sourceContract');

  if (task.sourceRef !== undefined) {
    validateSourceRef(errors, task.sourceRef, 'task.sourceRef');
  }
}

function validateInputSummary(errors, inputSummary) {
  if (!isPlainObject(inputSummary)) {
    errors.push('inputSummary must be a plain object');
    return;
  }

  validateAllowedFields(errors, inputSummary, 'inputSummary', INPUT_SUMMARY_ALLOWED_FIELDS);
  requireBoolean(errors, inputSummary.taskPackAvailable, 'inputSummary.taskPackAvailable');

  if (inputSummary.taskPackSourceContract !== null) {
    requireExact(
      errors,
      inputSummary.taskPackSourceContract,
      'inputSummary.taskPackSourceContract',
      'childTaskPack.v1'
    );
  }

  requireNonEmptyString(errors, inputSummary.taskPromptSummary, 'inputSummary.taskPromptSummary');
  validateStringArray(errors, inputSummary.acceptanceCriteria, 'inputSummary.acceptanceCriteria');
  validateEvidenceRefs(errors, inputSummary.evidenceRefs, 'inputSummary.evidenceRefs', { requireNonEmpty: false });
  requireNonEmptyString(errors, inputSummary.providerPolicyReason, 'inputSummary.providerPolicyReason');
}

function validateExecutionPolicy(errors, executionPolicy) {
  if (!isPlainObject(executionPolicy)) {
    errors.push('executionPolicy must be a plain object');
    return;
  }

  validateAllowedFields(errors, executionPolicy, 'executionPolicy', EXECUTION_POLICY_ALLOWED_FIELDS);
  requireExact(errors, executionPolicy.providerId, 'executionPolicy.providerId', CODEX_PROVIDER_ID);
  requireExact(errors, executionPolicy.role, 'executionPolicy.role', CODEX_PROVIDER_ROLE);
  requireExactStringArray(errors, executionPolicy.allowedProviders, 'executionPolicy.allowedProviders', [CODEX_PROVIDER_ID]);
  requireExactStringArray(errors, executionPolicy.allowedRoles, 'executionPolicy.allowedRoles', [CODEX_PROVIDER_ROLE]);
  requireExact(errors, executionPolicy.requiresOperatorConfirmation, 'executionPolicy.requiresOperatorConfirmation', true);
  requireExact(errors, executionPolicy.requiresPreviewHash, 'executionPolicy.requiresPreviewHash', true);
  requireExact(errors, executionPolicy.startsOnPreview, 'executionPolicy.startsOnPreview', false);
  requireExact(errors, executionPolicy.arbitraryCommandAvailable, 'executionPolicy.arbitraryCommandAvailable', false);
  requireExact(errors, executionPolicy.genericShellAvailable, 'executionPolicy.genericShellAvailable', false);
  requireExact(errors, executionPolicy.rawTranscriptAvailable, 'executionPolicy.rawTranscriptAvailable', false);
  requireExact(errors, executionPolicy.rawModelOutputAvailable, 'executionPolicy.rawModelOutputAvailable', false);
}

function validateResultReturn(errors, resultReturn, path) {
  if (!isPlainObject(resultReturn)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, resultReturn, path, RESULT_RETURN_ALLOWED_FIELDS);

  for (const [field, expected] of Object.entries(CODEX_PROVIDER_EXECUTION_RESULT_RETURN)) {
    requireExact(errors, resultReturn[field], `${path}.${field}`, expected);
  }
}

function validateBoundaries(errors, boundaries, path) {
  if (!isPlainObject(boundaries)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, boundaries, path, BOUNDARY_ALLOWED_FIELDS);

  for (const [field, expected] of Object.entries(CODEX_PROVIDER_EXECUTION_BOUNDARIES)) {
    requireExact(errors, boundaries[field], `${path}.${field}`, expected);
  }
}

function validateSanitizedResult(errors, sanitizedResult, path) {
  if (!isPlainObject(sanitizedResult)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, sanitizedResult, path, SANITIZED_RESULT_ALLOWED_FIELDS);
  requireEnum(errors, sanitizedResult.status, `${path}.status`, RUN_STATUS_SET);
  requireNonEmptyString(errors, sanitizedResult.summary, `${path}.summary`);
  validateStringArray(errors, sanitizedResult.changedFiles, `${path}.changedFiles`);
  validateStringArray(errors, sanitizedResult.validationCommands, `${path}.validationCommands`);
  validateStringArray(errors, sanitizedResult.risks, `${path}.risks`);
  validateStringArray(errors, sanitizedResult.blockers, `${path}.blockers`);

  if (sanitizedResult.status === 'blocked') {
    requireNonEmptyString(errors, sanitizedResult.blockerReason, `${path}.blockerReason`);
  }
}

function validateResultIntakeRequest(errors, request, path) {
  if (!isPlainObject(request)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, request, path, RESULT_INTAKE_REQUEST_ALLOWED_FIELDS);
  requireExact(errors, request.contractName, `${path}.contractName`, CODEX_PROVIDER_RESULT_INTAKE_CONTRACT_NAME);
  requireExact(errors, request.contractVersion, `${path}.contractVersion`, 1);
  requireSafeToken(errors, request.goalId, `${path}.goalId`);
  requireSafeToken(errors, request.taskId, `${path}.taskId`);
  requireExact(errors, request.workerRole, `${path}.workerRole`, CODEX_PROVIDER_ROLE);
  requireExact(errors, request.source, `${path}.source`, CODEX_PROVIDER_ID);
  requireIsoTimestamp(errors, request.submittedAt, `${path}.submittedAt`);
  validateResultBlock(errors, request.resultBlock, `${path}.resultBlock`);
  validateEvidenceRefs(errors, request.evidenceRefs, `${path}.evidenceRefs`, { requireNonEmpty: true });
  validateRequestedEvent(errors, request.requestedEvent, `${path}.requestedEvent`);
  validateResultIntakeBoundaries(errors, request.boundaries, `${path}.boundaries`);
}

function validateResultBlock(errors, resultBlock, path) {
  if (!isPlainObject(resultBlock)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, resultBlock, path, RESULT_BLOCK_ALLOWED_FIELDS);
  requireEnum(errors, resultBlock.status, `${path}.status`, RUN_STATUS_SET);
  requireNonEmptyString(errors, resultBlock.summary, `${path}.summary`);
  validateStringArray(errors, resultBlock.changedFiles, `${path}.changedFiles`);
  validateStringArray(errors, resultBlock.validationCommands, `${path}.validationCommands`);
  validateStringArray(errors, resultBlock.risks, `${path}.risks`);
  validateStringArray(errors, resultBlock.blockers, `${path}.blockers`);

  if (resultBlock.status === 'blocked') {
    requireNonEmptyString(errors, resultBlock.blockerReason, `${path}.blockerReason`);
  }
}

function validateRequestedEvent(errors, requestedEvent, path) {
  if (!isPlainObject(requestedEvent)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, requestedEvent, path, REQUESTED_EVENT_ALLOWED_FIELDS);
  requireEnum(errors, requestedEvent.eventType, `${path}.eventType`, RESULT_EVENT_SET);
  requireSafeToken(errors, requestedEvent.taskId, `${path}.taskId`);

  if (requestedEvent.eventType === 'blocker.opened') {
    validateBlocker(errors, requestedEvent.blocker, `${path}.blocker`);
  }
}

function validateBlocker(errors, blocker, path) {
  if (!isPlainObject(blocker)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, blocker, path, BLOCKER_ALLOWED_FIELDS);
  requireSafeToken(errors, blocker.blockerId, `${path}.blockerId`);
  requireNonEmptyString(errors, blocker.reason, `${path}.reason`);

  if (blocker.severity !== undefined) {
    requireNonEmptyString(errors, blocker.severity, `${path}.severity`);
  }
}

function validateResultIntakeBoundaries(errors, boundaries, path) {
  if (!isPlainObject(boundaries)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, boundaries, path, RESULT_INTAKE_BOUNDARY_ALLOWED_FIELDS);

  for (const [field, expected] of Object.entries(CODEX_PROVIDER_RESULT_INTAKE_BOUNDARIES)) {
    requireExact(errors, boundaries[field], `${path}.${field}`, expected);
  }
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

  if (sourceRef.label !== undefined) {
    requireNonEmptyString(errors, sourceRef.label, `${path}.label`);
  }

  if (sourceRef.generatedAt !== undefined) {
    requireIsoTimestamp(errors, sourceRef.generatedAt, `${path}.generatedAt`);
  }
}

function validateNullableSourceContractName(errors, value, path) {
  if (value === undefined || value === null) {
    return;
  }

  requireSafeSourceContractName(errors, value, path);
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

function buildInputSummary({
  taskPack,
  taskPackAvailable,
  blockedReasons
}) {
  return {
    taskPackAvailable,
    taskPackSourceContract: taskPackAvailable ? 'childTaskPack.v1' : null,
    taskPromptSummary: taskPackAvailable ? 'Codex worker task pack is present.' : 'Codex worker task pack is missing.',
    acceptanceCriteria: safeTextArray(taskPack?.acceptanceCriteria ?? []),
    evidenceRefs: normalizeEvidenceRefs(taskPack?.requiredEvidenceRefs ?? []),
    providerPolicyReason: blockedReasons.length === 0
      ? 'codex-worker-only'
      : blockedReasons.join(',')
  };
}

function buildExecutionPolicy() {
  return {
    providerId: CODEX_PROVIDER_ID,
    role: CODEX_PROVIDER_ROLE,
    allowedProviders: [CODEX_PROVIDER_ID],
    allowedRoles: [CODEX_PROVIDER_ROLE],
    requiresOperatorConfirmation: true,
    requiresPreviewHash: true,
    startsOnPreview: false,
    arbitraryCommandAvailable: false,
    genericShellAvailable: false,
    rawTranscriptAvailable: false,
    rawModelOutputAvailable: false
  };
}

function buildResultReturn() {
  return { ...CODEX_PROVIDER_EXECUTION_RESULT_RETURN };
}

function buildBoundaries() {
  return { ...CODEX_PROVIDER_EXECUTION_BOUNDARIES };
}

function buildResultIntakeRequest({
  preview,
  status,
  sanitizedResult,
  evidenceRefs,
  submittedAt
}) {
  const blocked = status === 'blocked';
  const resultBlock = stripUndefined({
    status,
    summary: sanitizedResult.summary,
    changedFiles: [...sanitizedResult.changedFiles],
    validationCommands: [...sanitizedResult.validationCommands],
    risks: [...sanitizedResult.risks],
    blockers: [...sanitizedResult.blockers],
    blockerReason: blocked ? sanitizedResult.blockerReason : undefined
  });

  return {
    contractName: CODEX_PROVIDER_RESULT_INTAKE_CONTRACT_NAME,
    contractVersion: 1,
    goalId: preview.goal.goalId,
    taskId: preview.task.taskId,
    workerRole: CODEX_PROVIDER_ROLE,
    source: CODEX_PROVIDER_ID,
    submittedAt,
    resultBlock,
    evidenceRefs: cloneValue(evidenceRefs),
    requestedEvent: blocked
      ? {
        eventType: 'blocker.opened',
        taskId: preview.task.taskId,
        blocker: {
          blockerId: `blocker-${preview.task.taskId}`,
          reason: sanitizedResult.blockerReason,
          severity: 'medium'
        }
      }
      : {
        eventType: 'worker.evidence-recorded',
        taskId: preview.task.taskId
      },
    boundaries: { ...CODEX_PROVIDER_RESULT_INTAKE_BOUNDARIES }
  };
}

function sanitizeProviderResult(providerResult, {
  status
}) {
  const summary = safeText(firstNonEmptyString(providerResult.summary, providerResult.resultSummary)) ??
    (status === 'blocked' ? 'Codex worker run is blocked.' : 'Codex worker run completed.');
  const blockerReason = safeText(firstNonEmptyString(
    providerResult.blockerReason,
    providerResult.blocker?.reason,
    providerResult.blockers?.[0]
  ));

  return stripUndefined({
    status,
    summary,
    changedFiles: safeRepoPaths(providerResult.changedFiles ?? []),
    validationCommands: safeTextArray(providerResult.validationCommands ?? []),
    risks: safeTextArray(providerResult.risks ?? []),
    blockers: safeTextArray(providerResult.blockers ?? []),
    blockerReason: status === 'blocked'
      ? (blockerReason ?? 'Codex worker run is blocked.')
      : undefined
  });
}

function buildRunRecordSourceContracts({
  preview,
  confirmation
}) {
  return [
    {
      contractName: CODEX_PROVIDER_EXECUTION_PREVIEW_CONTRACT_NAME,
      contractVersion: CODEX_PROVIDER_EXECUTION_CONTRACT_VERSION,
      readOnly: true,
      requiredFor: ['preview-hash', 'task-pack-hash'],
      previewHash: preview.previewHash,
      sourceRef: {
        kind: 'contract',
        ref: CODEX_PROVIDER_EXECUTION_PREVIEW_CONTRACT_NAME
      }
    },
    {
      contractName: CODEX_PROVIDER_EXECUTION_CONFIRMATION_CONTRACT_NAME,
      contractVersion: CODEX_PROVIDER_EXECUTION_CONTRACT_VERSION,
      readOnly: true,
      requiredFor: ['operator-confirmation'],
      previewHash: confirmation.previewHash,
      sourceRef: {
        kind: 'contract',
        ref: CODEX_PROVIDER_EXECUTION_CONFIRMATION_CONTRACT_NAME
      }
    },
    {
      contractName: CODEX_PROVIDER_RESULT_INTAKE_CONTRACT_NAME,
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['result-return'],
      sourceRef: {
        kind: 'contract',
        ref: CODEX_PROVIDER_RESULT_INTAKE_CONTRACT_NAME
      }
    }
  ];
}

function defaultPreviewSourceContracts() {
  return [
    {
      contractName: 'childDispatchPreview.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['task-pack-ref'],
      sourceRef: {
        kind: 'contract',
        ref: 'childDispatchPreview.v1'
      }
    },
    {
      contractName: 'childTaskPack.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['task-pack-hash'],
      sourceRef: {
        kind: 'contract',
        ref: 'childTaskPack.v1'
      }
    },
    {
      contractName: CODEX_PROVIDER_RESULT_INTAKE_CONTRACT_NAME,
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['result-return'],
      sourceRef: {
        kind: 'contract',
        ref: CODEX_PROVIDER_RESULT_INTAKE_CONTRACT_NAME
      }
    }
  ];
}

function defaultGoal() {
  return {
    goalId: 'v54-codex-provider-execution-pilot',
    title: 'v54 Codex Provider Execution Pilot',
    state: 'active',
    sourceContract: 'goal-supervisor-app-read-model.v1',
    sourceRef: {
      kind: 'route',
      ref: '/api/goals/<goal-id>/supervisor'
    }
  };
}

function defaultTask() {
  return {
    taskId: 'pr-1-contracts-fixtures-tests',
    title: 'Contracts, fixtures, and tests',
    state: 'active',
    sourceContract: 'childTaskPack.v1',
    sourceRef: {
      kind: 'contract',
      ref: 'childTaskPack.v1'
    }
  };
}

function defaultTaskPackRef() {
  return {
    kind: 'fixture',
    ref: 'fixtures/contracts/codex-provider-execution/task-pack.codex-worker.v1.json',
    label: 'v54 Codex worker task pack fixture'
  };
}

function normalizeEvidenceRefs(refs) {
  if (!Array.isArray(refs)) {
    return [];
  }

  return refs
    .filter(isPlainObject)
    .map((ref) => ({
      kind: ref.kind,
      ref: ref.ref,
      label: ref.label
    }))
    .filter(isControlledEvidenceRef);
}

function isControlledEvidenceRef(ref) {
  if (!isPlainObject(ref)) {
    return false;
  }

  if (!EVIDENCE_REF_KIND_SET.has(ref.kind)) {
    return false;
  }

  if (!isNonEmptyString(ref.ref) || !isNonEmptyString(ref.label)) {
    return false;
  }

  if (ref.kind === 'commit') {
    return COMMIT_PATTERN.test(ref.ref);
  }

  if (!isSafeRepoRelativePath(ref.ref)) {
    return false;
  }

  if (ref.kind === 'repo-doc' && !ref.ref.startsWith('docs/plans/')) {
    return false;
  }

  return true;
}

function isSafeRepoRelativePath(value) {
  if (!isNonEmptyString(value) || value.startsWith('/') || value.includes('\\') || UNSAFE_TEXT_PATTERN.test(value)) {
    return false;
  }

  const segments = value.split('/');

  return !segments.some((segment) => segment === '..' || LOCAL_HIDDEN_PATH_SEGMENTS.has(segment));
}

function safeRepoPaths(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter(isSafeRepoRelativePath).map((value) => value.trim());
}

function safeTextArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map((value) => safeText(value)).filter(isNonEmptyString);
}

function safeText(value) {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();

  return UNSAFE_TEXT_PATTERN.test(trimmed) ? null : trimmed;
}

function firstNonEmptyString(...values) {
  return values.find(isNonEmptyString) ?? null;
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

  if (typeof value === 'string' && UNSAFE_TEXT_PATTERN.test(value)) {
    fields.push(path);
  }

  return fields;
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

function requireExact(errors, value, path, expected) {
  if (!Object.is(value, expected)) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireEnum(errors, value, path, allowedValues) {
  if (!allowedValues.has(value)) {
    errors.push(`${path} must be one of ${[...allowedValues].join(', ')}`);
  }
}

function requireHash(errors, value, path) {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
    errors.push(`${path} must be a sha256 hash`);
  }
}

function requireSafeToken(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && !SAFE_TOKEN_PATTERN.test(value.trim())) {
    errors.push(`${path} must be a safe token`);
  }
}

function requireSafeSourceContractName(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && !SOURCE_CONTRACT_NAME_PATTERN.test(value.trim())) {
    errors.push(`${path} must be a safe contract name`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (!isNonEmptyString(value) || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (!isNonEmptyString(value)) {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireExactStringArray(errors, values, path, expected) {
  if (!Array.isArray(values) || !stringArraysEqual(values, expected)) {
    errors.push(`${path} must match ${expected.join(',')}`);
  }
}

function validateStringArray(errors, values, path) {
  if (!Array.isArray(values)) {
    errors.push(`${path} must be an array`);
    return;
  }

  values.forEach((value, index) => requireNonEmptyString(errors, value, `${path}[${index}]`));
}

function invalidResult(error) {
  return {
    ok: false,
    errors: [error]
  };
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}

function uniqueStrings(values) {
  return [...new Set(values.filter(isNonEmptyString))];
}

function stringArraysEqual(left, right) {
  if (!Array.isArray(left) || left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function millisOrNow(value) {
  const ms = Date.parse(value);

  return Number.isNaN(ms) ? Date.now() : ms;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function cloneValue(value) {
  return structuredClone(value);
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(',')}]`;
  }

  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`
    )).join(',')}}`;
  }

  return JSON.stringify(value);
}
