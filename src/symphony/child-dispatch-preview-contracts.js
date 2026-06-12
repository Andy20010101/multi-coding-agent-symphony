export const CHILD_DISPATCH_PREVIEW_CONTRACT_NAME = 'childDispatchPreview.v1';
export const CHILD_TASK_PACK_CONTRACT_NAME = 'childTaskPack.v1';
export const CHILD_RESULT_EXPECTATION_CONTRACT_NAME = 'childResultExpectation.v1';
export const PROVIDER_ROLE_RECOMMENDATION_CONTRACT_NAME = 'providerRoleRecommendation.v1';
export const CHILD_DISPATCH_PREVIEW_CONTRACT_VERSION = 1;
export const CHILD_DISPATCH_RETURN_PATH = 'v51-result-intake';

export const CHILD_DISPATCH_ALLOWED_PROVIDER_IDS = Object.freeze([
  'codex',
  'claude-code'
]);

export const CHILD_DISPATCH_ALLOWED_ROLES = Object.freeze([
  'worker',
  'reviewer',
  'blocker-investigator',
  'verifier'
]);

export const CHILD_DISPATCH_BOUNDARIES = Object.freeze({
  copyOnly: true,
  willMutate: false,
  providerExecutionAvailable: false,
  actualChildDispatchAvailable: false,
  providerLaunchAvailable: false,
  childProcessSpawnAvailable: false,
  automaticWorktreeCreationAvailable: false,
  transcriptCompactionAvailable: false,
  newThreadAvailable: false,
  genericShellRunnerAvailable: false,
  frontendLocalFileReadAvailable: false,
  localSessionFileReadAvailable: false,
  rawProviderPayloadExposureAvailable: false,
  rawTranscriptAvailable: false,
  rawModelOutputAvailable: false,
  directGoalEventAppendAvailable: false,
  directTaskCompleteAvailable: false,
  reviewerMutationAvailable: false,
  mainVerificationMutationAvailable: false,
  releaseGateMutationAvailable: false,
  gitMutationAvailable: false,
  tagAutomationAvailable: false,
  publishAutomationAvailable: false,
  githubReleaseAutomationAvailable: false
});

const PROVIDER_ID_SET = new Set(CHILD_DISPATCH_ALLOWED_PROVIDER_IDS);
const ROLE_SET = new Set(CHILD_DISPATCH_ALLOWED_ROLES);
const READINESS_STATE_SET = new Set(['ready', 'blocked']);
const GOAL_STATE_SET = new Set(['ready', 'active', 'blocked', 'missing', 'pending']);
const REF_KIND_SET = new Set(['contract', 'route', 'fixture', 'docs']);
const EVIDENCE_REF_KIND_SET = new Set(['repo-doc', 'artifact-ref', 'commit', 'command-evidence', 'external-note']);
const RESULT_SOURCE_SET = new Set(['codex', 'claude', 'manual-paste', 'external-worker']);
const RESULT_ROLE_SET = new Set(['worker', 'reviewer', 'main-verifier', 'release-manager']);
const RESULT_EVENT_SET = new Set([
  'worker.evidence-recorded',
  'worker.self-check-passed',
  'worker.self-check-failed',
  'reviewer.approved',
  'reviewer.needs-revision',
  'reviewer.blocked',
  'blocker.opened',
  'blocker.resolved'
]);

const SOURCE_CONTRACT_NAME_PATTERN = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.v[0-9]+$/u;
const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u;
const UNSAFE_STRING_PATTERN =
  /\b(?:raw[\s_-]*transcript|raw[\s_-]*model[\s_-]*output|provider[\s_-]*session|session[\s_-]*log|session[\s_-]*file|model[\s_-]*output)\b|(?:^|[/.])(?:\.codex|\.claude|\.git|\.symphony)(?:[/]|$)|\.jsonl(?:$|[/\s])|\/api\/(?:providers?|child(?:-dispatch)?|dispatch)(?:$|[/\s])|\/(?:event-plan-confirm|event-append|append-event|mark-complete|complete-task|git|tag|publish|release)(?:$|[/\s])|\b(?:git\s+(?:push|tag|checkout|merge|commit)|gh\s+release)\b/iu;
const FORBIDDEN_VISIBLE_LABELS = new Set([
  'dispatch child',
  'run child',
  'launch codex',
  'launch claude code',
  'execute',
  'run provider',
  'confirm child result',
  'append event',
  'mark complete',
  'push',
  'tag',
  'publish',
  'release'
]);

const PREVIEW_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'generatedAt',
  'goal',
  'task',
  'requestedRole',
  'providerRecommendation',
  'readiness',
  'blockedReasons',
  'sourceContracts',
  'sourceRefs',
  'taskPack',
  'resultExpectation',
  'boundaries'
]);
const GOAL_ALLOWED_FIELDS = new Set(['goalId', 'title', 'state', 'sourceContract', 'sourceRef']);
const TASK_ALLOWED_FIELDS = new Set(['taskId', 'title', 'state', 'sourceContract', 'sourceRef']);
const PROVIDER_RECOMMENDATION_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'providerId',
  'role',
  'allowedProviders',
  'rationale',
  'copyOnly',
  'providerExecutionAvailable',
  'actualChildDispatchAvailable'
]);
const READINESS_ALLOWED_FIELDS = new Set([
  'state',
  'canPreview',
  'copyAvailable',
  'requiresManualCopy',
  'providerExecutionAvailable',
  'actualChildDispatchAvailable'
]);
const SOURCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label', 'generatedAt']);
const SOURCE_CONTRACT_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'readOnly',
  'requiredFor',
  'sourceRef'
]);
const TASK_PACK_ALLOWED_FIELDS = new Set([
  'goalId',
  'taskId',
  'role',
  'preferredProvider',
  'allowedProviders',
  'projectContextRefs',
  'sourceContracts',
  'taskPrompt',
  'acceptanceCriteria',
  'requiredEvidenceRefs',
  'forbiddenActions',
  'expectedResultBlock',
  'returnPath',
  'copyOnly',
  'willMutate'
]);
const RESULT_EXPECTATION_ALLOWED_FIELDS = new Set([
  'contractName',
  'contractVersion',
  'returnPath',
  'resultIntakeContract',
  'expectedResultBlock',
  'requiredEvidenceRefs',
  'directGoalEventAppendAvailable',
  'directTaskCompleteAvailable',
  'reviewerMutationAvailable',
  'mainVerificationMutationAvailable',
  'releaseGateMutationAvailable'
]);
const EXPECTED_RESULT_BLOCK_ALLOWED_FIELDS = new Set([
  'returnPath',
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
  'boundaries',
  'willAppendGoalEvent'
]);
const RESULT_BLOCK_ALLOWED_FIELDS = new Set([
  'status',
  'summary',
  'changedFiles',
  'validationCommands',
  'risks',
  'blockers'
]);
const EVIDENCE_REF_ALLOWED_FIELDS = new Set(['kind', 'ref', 'label']);
const REQUESTED_EVENT_ALLOWED_FIELDS = new Set(['eventType', 'taskId']);
const RESULT_INTAKE_BOUNDARY_ALLOWED_FIELDS = new Set([
  'providerExecutionAvailable',
  'childDispatchAvailable',
  'directGoalEventAppendAvailable',
  'untrustedTranscriptProjectionAvailable',
  'frontendLocalFileReadAvailable',
  'reviewerMutationAvailable',
  'mainVerificationMutationAvailable',
  'releaseGateMutationAvailable',
  'gitMutationAvailable',
  'githubReleaseAutomationAvailable'
]);
const BOUNDARY_ALLOWED_FIELDS = new Set(Object.keys(CHILD_DISPATCH_BOUNDARIES));

const RESULT_INTAKE_BOUNDARIES = Object.freeze({
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

export class ChildDispatchPreviewContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ChildDispatchPreviewContractError';
    this.code = code;
    this.details = details;
  }
}

export function buildChildTaskPack({
  goalId,
  taskId,
  role,
  preferredProvider = 'codex',
  allowedProviders = CHILD_DISPATCH_ALLOWED_PROVIDER_IDS,
  projectContextRefs = defaultProjectContextRefs(),
  sourceContracts = defaultSourceContracts(),
  taskPrompt = defaultTaskPrompt({ taskId, role }),
  acceptanceCriteria = defaultAcceptanceCriteria(),
  requiredEvidenceRefs = defaultRequiredEvidenceRefs({ taskId, role }),
  forbiddenActions = defaultForbiddenActions(),
  expectedResultBlock = null
} = {}) {
  const taskPack = {
    goalId,
    taskId,
    role,
    preferredProvider,
    allowedProviders: [...allowedProviders],
    projectContextRefs: [...projectContextRefs],
    sourceContracts: cloneArray(sourceContracts),
    taskPrompt,
    acceptanceCriteria: [...acceptanceCriteria],
    requiredEvidenceRefs: cloneArray(requiredEvidenceRefs),
    forbiddenActions: [...forbiddenActions],
    expectedResultBlock: cloneObject(expectedResultBlock ?? buildExpectedResultBlock({
      goalId,
      taskId,
      role,
      providerId: preferredProvider,
      requiredEvidenceRefs
    })),
    returnPath: CHILD_DISPATCH_RETURN_PATH,
    copyOnly: true,
    willMutate: false
  };

  assertChildTaskPackContract(taskPack);

  return taskPack;
}

export function buildChildDispatchPreviewContract({
  generatedAt = new Date().toISOString(),
  goal,
  task,
  requestedRole = 'worker',
  preferredProvider = 'codex',
  sourceContracts = defaultSourceContracts(),
  sourceRefs = defaultSourceRefs(),
  taskPack = null,
  blockedReasons = []
} = {}) {
  const normalizedGeneratedAt = new Date(millisOrNow(generatedAt)).toISOString();
  const providerSupported = PROVIDER_ID_SET.has(preferredProvider);
  const roleSupported = ROLE_SET.has(requestedRole);
  const hasActiveGoal = isPlainObject(goal) && typeof goal.goalId === 'string' && goal.goalId.trim() !== '';
  const hasTask = isPlainObject(task) && typeof task.taskId === 'string' && task.taskId.trim() !== '';
  const effectiveBlockedReasons = uniqueStrings([
    ...blockedReasons,
    ...(!hasActiveGoal ? ['active-goal-missing'] : []),
    ...(!hasTask ? ['active-task-missing'] : []),
    ...(!roleSupported ? ['unsupported-child-role'] : []),
    ...(!providerSupported ? ['unsupported-provider'] : [])
  ]);
  const ready = effectiveBlockedReasons.length === 0;
  const safeRole = roleSupported ? requestedRole : 'worker';
  const safeProvider = providerSupported ? preferredProvider : 'codex';
  const effectiveTaskPack = ready
    ? cloneObject(taskPack ?? buildChildTaskPack({
      goalId: goal.goalId,
      taskId: task.taskId,
      role: safeRole,
      preferredProvider: safeProvider,
      sourceContracts
    }))
    : null;
  const resultExpectation = ready
    ? buildChildResultExpectation({
      expectedResultBlock: effectiveTaskPack.expectedResultBlock,
      requiredEvidenceRefs: effectiveTaskPack.requiredEvidenceRefs
    })
    : null;

  const preview = {
    contractName: CHILD_DISPATCH_PREVIEW_CONTRACT_NAME,
    contractVersion: CHILD_DISPATCH_PREVIEW_CONTRACT_VERSION,
    generatedAt: normalizedGeneratedAt,
    goal: cloneObject(goal),
    task: cloneObject(task),
    requestedRole: safeRole,
    providerRecommendation: buildProviderRoleRecommendation({
      providerId: safeProvider,
      role: safeRole,
      rationale: providerSupported
        ? `${safeProvider} is allowed for ${safeRole} copy-only handoff.`
        : 'requested-provider-not-supported'
    }),
    readiness: {
      state: ready ? 'ready' : 'blocked',
      canPreview: ready,
      copyAvailable: ready,
      requiresManualCopy: true,
      providerExecutionAvailable: false,
      actualChildDispatchAvailable: false
    },
    blockedReasons: effectiveBlockedReasons,
    sourceContracts: cloneArray(sourceContracts),
    sourceRefs: cloneArray(sourceRefs),
    taskPack: effectiveTaskPack,
    resultExpectation,
    boundaries: cloneObject(CHILD_DISPATCH_BOUNDARIES)
  };

  assertChildDispatchPreviewContract(preview);

  return preview;
}

export function buildProviderRoleRecommendation({
  providerId,
  role,
  rationale = 'allowed-provider-role-copy-only'
} = {}) {
  return {
    contractName: PROVIDER_ROLE_RECOMMENDATION_CONTRACT_NAME,
    contractVersion: CHILD_DISPATCH_PREVIEW_CONTRACT_VERSION,
    providerId,
    role,
    allowedProviders: [...CHILD_DISPATCH_ALLOWED_PROVIDER_IDS],
    rationale,
    copyOnly: true,
    providerExecutionAvailable: false,
    actualChildDispatchAvailable: false
  };
}

export function buildChildResultExpectation({
  expectedResultBlock,
  requiredEvidenceRefs = []
} = {}) {
  return {
    contractName: CHILD_RESULT_EXPECTATION_CONTRACT_NAME,
    contractVersion: CHILD_DISPATCH_PREVIEW_CONTRACT_VERSION,
    returnPath: CHILD_DISPATCH_RETURN_PATH,
    resultIntakeContract: 'resultIntakeRequest.v1',
    expectedResultBlock: cloneObject(expectedResultBlock),
    requiredEvidenceRefs: cloneArray(requiredEvidenceRefs),
    directGoalEventAppendAvailable: false,
    directTaskCompleteAvailable: false,
    reviewerMutationAvailable: false,
    mainVerificationMutationAvailable: false,
    releaseGateMutationAvailable: false
  };
}

export function buildExpectedResultBlock({
  goalId,
  taskId,
  role,
  providerId,
  requiredEvidenceRefs = defaultRequiredEvidenceRefs({ taskId, role })
} = {}) {
  return {
    returnPath: CHILD_DISPATCH_RETURN_PATH,
    contractName: 'resultIntakeRequest.v1',
    contractVersion: 1,
    goalId,
    taskId,
    workerRole: resultIntakeRoleFor(role),
    source: resultSourceForProvider(providerId),
    submittedAt: '<submitted-at-iso>',
    resultBlock: {
      status: '<completed-or-blocked>',
      summary: '<sanitized-summary>',
      changedFiles: [],
      validationCommands: [],
      risks: [],
      blockers: []
    },
    evidenceRefs: cloneArray(requiredEvidenceRefs),
    requestedEvent: {
      eventType: resultEventForRole(role),
      taskId
    },
    boundaries: cloneObject(RESULT_INTAKE_BOUNDARIES),
    willAppendGoalEvent: false
  };
}

export function validateChildDispatchPreviewContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return invalidResult('contract must be a plain object');
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'generatedAt',
    'goal',
    'task',
    'requestedRole',
    'providerRecommendation',
    'readiness',
    'blockedReasons',
    'sourceContracts',
    'sourceRefs',
    'taskPack',
    'resultExpectation',
    'boundaries'
  ]) {
    if (!Object.hasOwn(contract, field)) {
      errors.push(`${field} is required`);
    }
  }

  validateAllowedFields(errors, contract, 'contract', PREVIEW_ALLOWED_FIELDS);
  requireExact(errors, contract.contractName, 'contractName', CHILD_DISPATCH_PREVIEW_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', CHILD_DISPATCH_PREVIEW_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  validateGoal(errors, contract.goal);
  validateTask(errors, contract.task);
  requireEnum(errors, contract.requestedRole, 'requestedRole', ROLE_SET);
  validateProviderRecommendation(errors, contract.providerRecommendation);
  validateReadiness(errors, contract.readiness);
  validateStringArray(errors, contract.blockedReasons, 'blockedReasons');
  validateSourceContracts(errors, contract.sourceContracts, 'sourceContracts');
  validateSourceRefs(errors, contract.sourceRefs, 'sourceRefs');
  validateReadinessBinding(errors, contract);
  validateBoundaries(errors, contract.boundaries);
  validateUnsafeStringValues(errors, contract, 'contract');

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertChildDispatchPreviewContract(contract) {
  const result = validateChildDispatchPreviewContract(contract);

  if (!result.ok) {
    throw new ChildDispatchPreviewContractError(
      'invalid-child-dispatch-preview',
      'Child dispatch preview contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return contract;
}

export function validateChildTaskPackContract(taskPack) {
  const errors = [];

  validateChildTaskPack(errors, taskPack, 'taskPack');
  validateUnsafeStringValues(errors, taskPack, 'taskPack');

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertChildTaskPackContract(taskPack) {
  const result = validateChildTaskPackContract(taskPack);

  if (!result.ok) {
    throw new ChildDispatchPreviewContractError(
      'invalid-child-task-pack',
      'Child task pack contract is invalid.',
      { reason: result.errors[0] }
    );
  }

  return taskPack;
}

function validateReadinessBinding(errors, contract) {
  const state = contract.readiness?.state;
  const blockedReasons = Array.isArray(contract.blockedReasons) ? contract.blockedReasons : [];

  if (state === 'ready') {
    if (blockedReasons.length !== 0) {
      errors.push('blockedReasons must be empty when readiness.state is ready');
    }

    validateChildTaskPack(errors, contract.taskPack, 'taskPack');
    validateChildResultExpectation(errors, contract.resultExpectation, 'resultExpectation');

    if (isPlainObject(contract.taskPack) &&
        isPlainObject(contract.resultExpectation) &&
        !structuredValuesEqual(contract.taskPack.expectedResultBlock, contract.resultExpectation.expectedResultBlock)) {
      errors.push('resultExpectation.expectedResultBlock must match taskPack.expectedResultBlock');
    }
  }

  if (state === 'blocked') {
    if (blockedReasons.length === 0) {
      errors.push('blockedReasons must explain blocked preview');
    }

    requireExact(errors, contract.taskPack, 'taskPack', null);
    requireExact(errors, contract.resultExpectation, 'resultExpectation', null);
  }
}

function validateGoal(errors, goal) {
  if (!isPlainObject(goal)) {
    errors.push('goal must be a plain object');
    return;
  }

  validateAllowedFields(errors, goal, 'goal', GOAL_ALLOWED_FIELDS);

  for (const field of ['goalId', 'title', 'state', 'sourceContract', 'sourceRef']) {
    if (!Object.hasOwn(goal, field)) {
      errors.push(`goal.${field} is required`);
    }
  }

  requireNullableSafeToken(errors, goal.goalId, 'goal.goalId');
  requireNullableString(errors, goal.title, 'goal.title');
  requireEnum(errors, goal.state, 'goal.state', GOAL_STATE_SET);
  validateNullableSourceContractName(errors, goal.sourceContract, 'goal.sourceContract');
  validateNullableSourceRef(errors, goal.sourceRef, 'goal.sourceRef');
}

function validateTask(errors, task) {
  if (!isPlainObject(task)) {
    errors.push('task must be a plain object');
    return;
  }

  validateAllowedFields(errors, task, 'task', TASK_ALLOWED_FIELDS);

  for (const field of ['taskId', 'title', 'state', 'sourceContract', 'sourceRef']) {
    if (!Object.hasOwn(task, field)) {
      errors.push(`task.${field} is required`);
    }
  }

  requireNullableSafeToken(errors, task.taskId, 'task.taskId');
  requireNullableString(errors, task.title, 'task.title');
  requireEnum(errors, task.state, 'task.state', GOAL_STATE_SET);
  validateNullableSourceContractName(errors, task.sourceContract, 'task.sourceContract');
  validateNullableSourceRef(errors, task.sourceRef, 'task.sourceRef');
}

function validateProviderRecommendation(errors, recommendation) {
  if (!isPlainObject(recommendation)) {
    errors.push('providerRecommendation must be a plain object');
    return;
  }

  validateAllowedFields(errors, recommendation, 'providerRecommendation', PROVIDER_RECOMMENDATION_ALLOWED_FIELDS);
  requireExact(
    errors,
    recommendation.contractName,
    'providerRecommendation.contractName',
    PROVIDER_ROLE_RECOMMENDATION_CONTRACT_NAME
  );
  requireExact(
    errors,
    recommendation.contractVersion,
    'providerRecommendation.contractVersion',
    CHILD_DISPATCH_PREVIEW_CONTRACT_VERSION
  );
  requireEnum(errors, recommendation.providerId, 'providerRecommendation.providerId', PROVIDER_ID_SET);
  requireEnum(errors, recommendation.role, 'providerRecommendation.role', ROLE_SET);
  requireAllowedProviderArray(errors, recommendation.allowedProviders, 'providerRecommendation.allowedProviders');
  requireNonEmptyString(errors, recommendation.rationale, 'providerRecommendation.rationale');
  requireExact(errors, recommendation.copyOnly, 'providerRecommendation.copyOnly', true);
  requireExact(errors, recommendation.providerExecutionAvailable, 'providerRecommendation.providerExecutionAvailable', false);
  requireExact(errors, recommendation.actualChildDispatchAvailable, 'providerRecommendation.actualChildDispatchAvailable', false);
}

function validateReadiness(errors, readiness) {
  if (!isPlainObject(readiness)) {
    errors.push('readiness must be a plain object');
    return;
  }

  validateAllowedFields(errors, readiness, 'readiness', READINESS_ALLOWED_FIELDS);
  requireEnum(errors, readiness.state, 'readiness.state', READINESS_STATE_SET);
  requireBoolean(errors, readiness.canPreview, 'readiness.canPreview');
  requireBoolean(errors, readiness.copyAvailable, 'readiness.copyAvailable');
  requireExact(errors, readiness.requiresManualCopy, 'readiness.requiresManualCopy', true);
  requireExact(errors, readiness.providerExecutionAvailable, 'readiness.providerExecutionAvailable', false);
  requireExact(errors, readiness.actualChildDispatchAvailable, 'readiness.actualChildDispatchAvailable', false);

  if (readiness.state === 'ready') {
    requireExact(errors, readiness.canPreview, 'readiness.canPreview', true);
    requireExact(errors, readiness.copyAvailable, 'readiness.copyAvailable', true);
  }

  if (readiness.state === 'blocked') {
    requireExact(errors, readiness.canPreview, 'readiness.canPreview', false);
    requireExact(errors, readiness.copyAvailable, 'readiness.copyAvailable', false);
  }
}

function validateChildTaskPack(errors, taskPack, path) {
  if (!isPlainObject(taskPack)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, taskPack, path, TASK_PACK_ALLOWED_FIELDS);

  for (const field of [
    'goalId',
    'taskId',
    'role',
    'preferredProvider',
    'allowedProviders',
    'projectContextRefs',
    'sourceContracts',
    'taskPrompt',
    'acceptanceCriteria',
    'requiredEvidenceRefs',
    'forbiddenActions',
    'expectedResultBlock',
    'returnPath',
    'copyOnly',
    'willMutate'
  ]) {
    if (!Object.hasOwn(taskPack, field)) {
      errors.push(`${path}.${field} is required`);
    }
  }

  requireSafeToken(errors, taskPack.goalId, `${path}.goalId`);
  requireSafeToken(errors, taskPack.taskId, `${path}.taskId`);
  requireEnum(errors, taskPack.role, `${path}.role`, ROLE_SET);
  requireEnum(errors, taskPack.preferredProvider, `${path}.preferredProvider`, PROVIDER_ID_SET);
  requireAllowedProviderArray(errors, taskPack.allowedProviders, `${path}.allowedProviders`);
  validateStringArray(errors, taskPack.projectContextRefs, `${path}.projectContextRefs`);
  validateSourceContracts(errors, taskPack.sourceContracts, `${path}.sourceContracts`);
  requireNonEmptyString(errors, taskPack.taskPrompt, `${path}.taskPrompt`);
  validateStringArray(errors, taskPack.acceptanceCriteria, `${path}.acceptanceCriteria`);
  validateEvidenceRefs(errors, taskPack.requiredEvidenceRefs, `${path}.requiredEvidenceRefs`);
  validateStringArray(errors, taskPack.forbiddenActions, `${path}.forbiddenActions`);
  validateExpectedResultBlock(errors, taskPack.expectedResultBlock, `${path}.expectedResultBlock`);
  requireExact(errors, taskPack.returnPath, `${path}.returnPath`, CHILD_DISPATCH_RETURN_PATH);
  requireExact(errors, taskPack.copyOnly, `${path}.copyOnly`, true);
  requireExact(errors, taskPack.willMutate, `${path}.willMutate`, false);

  if (isPlainObject(taskPack.expectedResultBlock)) {
    if (taskPack.expectedResultBlock.goalId !== taskPack.goalId) {
      errors.push(`${path}.expectedResultBlock.goalId must match ${path}.goalId`);
    }

    if (taskPack.expectedResultBlock.taskId !== taskPack.taskId) {
      errors.push(`${path}.expectedResultBlock.taskId must match ${path}.taskId`);
    }
  }
}

function validateChildResultExpectation(errors, expectation, path) {
  if (!isPlainObject(expectation)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, expectation, path, RESULT_EXPECTATION_ALLOWED_FIELDS);
  requireExact(errors, expectation.contractName, `${path}.contractName`, CHILD_RESULT_EXPECTATION_CONTRACT_NAME);
  requireExact(errors, expectation.contractVersion, `${path}.contractVersion`, CHILD_DISPATCH_PREVIEW_CONTRACT_VERSION);
  requireExact(errors, expectation.returnPath, `${path}.returnPath`, CHILD_DISPATCH_RETURN_PATH);
  requireExact(errors, expectation.resultIntakeContract, `${path}.resultIntakeContract`, 'resultIntakeRequest.v1');
  validateExpectedResultBlock(errors, expectation.expectedResultBlock, `${path}.expectedResultBlock`);
  validateEvidenceRefs(errors, expectation.requiredEvidenceRefs, `${path}.requiredEvidenceRefs`);
  requireExact(errors, expectation.directGoalEventAppendAvailable, `${path}.directGoalEventAppendAvailable`, false);
  requireExact(errors, expectation.directTaskCompleteAvailable, `${path}.directTaskCompleteAvailable`, false);
  requireExact(errors, expectation.reviewerMutationAvailable, `${path}.reviewerMutationAvailable`, false);
  requireExact(errors, expectation.mainVerificationMutationAvailable, `${path}.mainVerificationMutationAvailable`, false);
  requireExact(errors, expectation.releaseGateMutationAvailable, `${path}.releaseGateMutationAvailable`, false);
}

function validateExpectedResultBlock(errors, resultBlock, path) {
  if (!isPlainObject(resultBlock)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, resultBlock, path, EXPECTED_RESULT_BLOCK_ALLOWED_FIELDS);
  requireExact(errors, resultBlock.returnPath, `${path}.returnPath`, CHILD_DISPATCH_RETURN_PATH);
  requireExact(errors, resultBlock.contractName, `${path}.contractName`, 'resultIntakeRequest.v1');
  requireExact(errors, resultBlock.contractVersion, `${path}.contractVersion`, 1);
  requireSafeToken(errors, resultBlock.goalId, `${path}.goalId`);
  requireSafeToken(errors, resultBlock.taskId, `${path}.taskId`);
  requireEnum(errors, resultBlock.workerRole, `${path}.workerRole`, RESULT_ROLE_SET);
  requireEnum(errors, resultBlock.source, `${path}.source`, RESULT_SOURCE_SET);
  requireNonEmptyString(errors, resultBlock.submittedAt, `${path}.submittedAt`);
  validateResultBlockTemplate(errors, resultBlock.resultBlock, `${path}.resultBlock`);
  validateEvidenceRefs(errors, resultBlock.evidenceRefs, `${path}.evidenceRefs`);
  validateRequestedEvent(errors, resultBlock.requestedEvent, `${path}.requestedEvent`);
  validateResultIntakeBoundaries(errors, resultBlock.boundaries, `${path}.boundaries`);
  requireExact(errors, resultBlock.willAppendGoalEvent, `${path}.willAppendGoalEvent`, false);
}

function validateResultBlockTemplate(errors, resultBlock, path) {
  if (!isPlainObject(resultBlock)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, resultBlock, path, RESULT_BLOCK_ALLOWED_FIELDS);
  requireNonEmptyString(errors, resultBlock.status, `${path}.status`);
  requireNonEmptyString(errors, resultBlock.summary, `${path}.summary`);
  validateStringArray(errors, resultBlock.changedFiles, `${path}.changedFiles`);
  validateStringArray(errors, resultBlock.validationCommands, `${path}.validationCommands`);
  validateStringArray(errors, resultBlock.risks, `${path}.risks`);
  validateStringArray(errors, resultBlock.blockers, `${path}.blockers`);
}

function validateRequestedEvent(errors, requestedEvent, path) {
  if (!isPlainObject(requestedEvent)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, requestedEvent, path, REQUESTED_EVENT_ALLOWED_FIELDS);
  requireEnum(errors, requestedEvent.eventType, `${path}.eventType`, RESULT_EVENT_SET);
  requireSafeToken(errors, requestedEvent.taskId, `${path}.taskId`);
}

function validateEvidenceRefs(errors, refs, path) {
  if (!Array.isArray(refs) || refs.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  refs.forEach((ref, index) => {
    const refPath = `${path}[${index}]`;

    if (!isPlainObject(ref)) {
      errors.push(`${refPath} must be a plain object`);
      return;
    }

    validateAllowedFields(errors, ref, refPath, EVIDENCE_REF_ALLOWED_FIELDS);
    requireEnum(errors, ref.kind, `${refPath}.kind`, EVIDENCE_REF_KIND_SET);
    requireNonEmptyString(errors, ref.ref, `${refPath}.ref`);
    requireNonEmptyString(errors, ref.label, `${refPath}.label`);
  });
}

function validateSourceContracts(errors, sourceContracts, path) {
  if (!Array.isArray(sourceContracts) || sourceContracts.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  sourceContracts.forEach((contract, index) => {
    const contractPath = `${path}[${index}]`;

    if (!isPlainObject(contract)) {
      errors.push(`${contractPath} must be a plain object`);
      return;
    }

    validateAllowedFields(errors, contract, contractPath, SOURCE_CONTRACT_ALLOWED_FIELDS);
    requireSafeSourceContractName(errors, contract.contractName, `${contractPath}.contractName`);

    if (contract.contractVersion !== undefined && !Number.isInteger(contract.contractVersion)) {
      errors.push(`${contractPath}.contractVersion must be an integer`);
    }

    if (contract.readOnly !== undefined) {
      requireExact(errors, contract.readOnly, `${contractPath}.readOnly`, true);
    }

    if (contract.requiredFor !== undefined) {
      validateStringArray(errors, contract.requiredFor, `${contractPath}.requiredFor`);
    }

    if (contract.sourceRef !== undefined) {
      validateSourceRef(errors, contract.sourceRef, `${contractPath}.sourceRef`);
    }
  });
}

function validateSourceRefs(errors, sourceRefs, path) {
  if (!Array.isArray(sourceRefs) || sourceRefs.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  sourceRefs.forEach((sourceRef, index) => validateSourceRef(errors, sourceRef, `${path}[${index}]`));
}

function validateNullableSourceRef(errors, sourceRef, path) {
  if (sourceRef === null) {
    return;
  }

  validateSourceRef(errors, sourceRef, path);
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

function validateResultIntakeBoundaries(errors, boundaries, path) {
  if (!isPlainObject(boundaries)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  validateAllowedFields(errors, boundaries, path, RESULT_INTAKE_BOUNDARY_ALLOWED_FIELDS);

  for (const [field, expected] of Object.entries(RESULT_INTAKE_BOUNDARIES)) {
    requireExact(errors, boundaries[field], `${path}.${field}`, expected);
  }
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  validateAllowedFields(errors, boundaries, 'boundaries', BOUNDARY_ALLOWED_FIELDS);

  for (const [field, expected] of Object.entries(CHILD_DISPATCH_BOUNDARIES)) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, expected);
  }
}

function defaultSourceContracts() {
  return [
    {
      contractName: 'systemGoldenPath.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['preview-readiness', 'task-pack'],
      sourceRef: {
        kind: 'fixture',
        ref: 'fixtures/contracts/system-golden-path.ready.v1.json'
      }
    },
    {
      contractName: 'goal-supervisor-app-read-model.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['active-goal', 'active-task'],
      sourceRef: {
        kind: 'route',
        ref: '/api/goals/<goal-id>/supervisor'
      }
    },
    {
      contractName: 'resultIntakeRequest.v1',
      contractVersion: 1,
      readOnly: true,
      requiredFor: ['result-expectation'],
      sourceRef: {
        kind: 'contract',
        ref: 'resultIntakeRequest.v1'
      }
    }
  ];
}

function defaultSourceRefs() {
  return [
    {
      kind: 'fixture',
      ref: 'fixtures/contracts/system-golden-path.ready.v1.json',
      label: 'systemGoldenPath.v1 ready fixture'
    },
    {
      kind: 'route',
      ref: '/api/goals/<goal-id>/supervisor',
      label: 'backend supervisor read model'
    },
    {
      kind: 'docs',
      ref: 'docs/plans/v53-controlled-child-dispatch-preview-runbook-2026-06-12.md',
      label: 'v53 controlled child dispatch preview runbook'
    }
  ];
}

function defaultProjectContextRefs() {
  return [
    'docs/plans/v53-controlled-child-dispatch-preview-runbook-2026-06-12.md',
    'fixtures/contracts/system-golden-path.ready.v1.json'
  ];
}

function defaultTaskPrompt({ taskId = '<task-id>', role = 'worker' } = {}) {
  return [
    `Work on ${taskId} as ${role}.`,
    'Use the provided project context refs and return a sanitized result block through v51 Result Intake.',
    'Do not claim state changes outside the evidence you can cite.'
  ].join(' ');
}

function defaultAcceptanceCriteria() {
  return [
    'Return a sanitized result block for v51 Result Intake.',
    'List controlled evidence refs for each claim.',
    'Report remaining blockers without updating goal state.'
  ];
}

function defaultRequiredEvidenceRefs({ taskId = '<task-id>', role = 'worker' } = {}) {
  return [
    {
      kind: 'repo-doc',
      ref: `docs/plans/v53-${taskId}-${role}-evidence-2026-06-12.md`,
      label: `v53 ${taskId} ${role} evidence`
    }
  ];
}

function defaultForbiddenActions() {
  return [
    'Provider execution stays unavailable.',
    'Child work is copied manually by the operator.',
    'Child result cannot update goal state directly.',
    'Repository publication operations stay out of scope.'
  ];
}

function resultSourceForProvider(providerId) {
  if (providerId === 'claude-code') {
    return 'claude';
  }

  if (providerId === 'codex') {
    return 'codex';
  }

  return 'manual-paste';
}

function resultIntakeRoleFor(role) {
  if (role === 'reviewer') {
    return 'reviewer';
  }

  return 'worker';
}

function resultEventForRole(role) {
  if (role === 'reviewer') {
    return 'reviewer.needs-revision';
  }

  if (role === 'blocker-investigator') {
    return 'blocker.opened';
  }

  return 'worker.evidence-recorded';
}

function requireAllowedProviderArray(errors, values, path) {
  if (!Array.isArray(values)) {
    errors.push(`${path} must be an array`);
    return;
  }

  if (!stringArraysEqual(values, CHILD_DISPATCH_ALLOWED_PROVIDER_IDS)) {
    errors.push(`${path} must be exactly ${CHILD_DISPATCH_ALLOWED_PROVIDER_IDS.join(', ')}`);
  }
}

function validateStringArray(errors, values, path) {
  if (!Array.isArray(values)) {
    errors.push(`${path} must be an array`);
    return;
  }

  values.forEach((value, index) => requireNonEmptyString(errors, value, `${path}[${index}]`));
}

function validateNullableSourceContractName(errors, value, path) {
  if (value === null) {
    return;
  }

  requireSafeSourceContractName(errors, value, path);
}

function requireSafeSourceContractName(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && !SOURCE_CONTRACT_NAME_PATTERN.test(value.trim())) {
    errors.push(`${path} must be a safe contract name`);
  }
}

function requireNullableSafeToken(errors, value, path) {
  if (value === null) {
    return;
  }

  requireSafeToken(errors, value, path);
}

function requireSafeToken(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value === 'string' && !SAFE_TOKEN_PATTERN.test(value.trim())) {
    errors.push(`${path} must be a safe token`);
  }
}

function requireNullableString(errors, value, path) {
  if (value === null) {
    return;
  }

  requireNonEmptyString(errors, value, path);
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

function requireEnum(errors, value, path, allowed) {
  if (!allowed.has(value)) {
    errors.push(`${path} must be one of ${[...allowed].join(', ')}`);
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  requireNonEmptyString(errors, value, path);

  if (typeof value !== 'string') {
    return;
  }

  const time = Date.parse(value);

  if (Number.isNaN(time) || new Date(time).toISOString() !== value) {
    errors.push(`${path} must be an ISO timestamp`);
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

function validateUnsafeStringValues(errors, value, path) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateUnsafeStringValues(errors, entry, `${path}[${index}]`));
    return;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, entry]) => validateUnsafeStringValues(errors, entry, `${path}.${key}`));
    return;
  }

  if (typeof value !== 'string') {
    return;
  }

  if (UNSAFE_STRING_PATTERN.test(value) || FORBIDDEN_VISIBLE_LABELS.has(value.trim().toLowerCase())) {
    errors.push(`${path} must not contain execution, dispatch, local session, raw output, event append, git, tag, publish, or release routes`);
  }
}

function millisOrNow(value) {
  const ms = Date.parse(value);

  return Number.isNaN(ms) ? Date.now() : ms;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim() !== ''))];
}

function stringArraysEqual(left, right) {
  return Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function structuredValuesEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(',')}]`;
  }

  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function cloneArray(value) {
  return Array.isArray(value) ? structuredClone(value) : [];
}

function cloneObject(value) {
  return isPlainObject(value) ? structuredClone(value) : value;
}

function invalidResult(message) {
  return {
    ok: false,
    errors: [message]
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
