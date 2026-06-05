export const WORKFLOW_ROUTER_CATEGORIES_CONTRACT_NAME = 'workflow-router-categories.v1';
export const WORKFLOW_ROUTER_CATEGORIES_CONTRACT_VERSION = 1;

const DEFAULT_GOAL_ID = 'v40-personal-workflow-router-app-core-release';
const DEFAULT_TASK_ID = 'task-2';
const CATEGORY_IDS = Object.freeze([
  'direct-answer',
  'skill',
  'automation',
  'workbench-goal',
  'research',
  'ignore-skip'
]);
const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'app-state-snapshot.v1',
  'goal-runbook.v1',
  'goal-next-action.v1',
  'goal-progress-ledger.v1',
  'goal-event-log.v1',
  'action-manifest.v1',
  'job-model.v1'
]);

export function buildWorkflowRouterCategoriesContract({
  goalId = DEFAULT_GOAL_ID,
  taskId = DEFAULT_TASK_ID,
  generatedAt = new Date().toISOString()
} = {}) {
  return assertWorkflowRouterCategoriesContract({
    contractName: WORKFLOW_ROUTER_CATEGORIES_CONTRACT_NAME,
    contractVersion: WORKFLOW_ROUTER_CATEGORIES_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      taskId,
      stateSource: 'explicit-backend-contracts',
      scope: 'v40-workflow-router-categories',
      sourceContracts: [...REQUIRED_SOURCE_CONTRACTS]
    },
    categories: buildCategories(),
    decisionPolicy: {
      defaultCategoryId: 'workbench-goal',
      confidenceSource: 'deterministic-router-rules',
      requiresHumanConfirmationForGoalDraft: true,
      writesRouteDecision: false,
      modelInvocationRequired: false,
      fallbackCategoryId: 'direct-answer'
    },
    examples: buildExamples(),
    boundaries: {
      readOnly: true,
      categoryDecisionWritesAvailable: false,
      actionExecutionAvailable: false,
      jobCreationAvailable: false,
      goalDraftWriteAvailable: false,
      workbenchGoalRegistrationAvailable: false,
      researchFetchAvailable: false,
      modelInvocationAvailable: false,
      arbitraryCommandExecutionAvailable: false,
      shellExecutionAvailable: false,
      localFileOpenAvailable: false,
      arbitraryPathReadAvailable: false,
      gitWriteAvailable: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      publishAvailable: false,
      selfApprovalAvailable: false,
      releaseReadyDeclarationAvailable: false,
      statusInferenceFromFrontendAvailable: false
    }
  });
}

export function validateWorkflowRouterCategoriesContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['workflow router categories contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', WORKFLOW_ROUTER_CATEGORIES_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', WORKFLOW_ROUTER_CATEGORIES_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);
  validateContext(errors, contract.context);
  validateCategories(errors, contract.categories);
  validateDecisionPolicy(errors, contract.decisionPolicy);
  validateExamples(errors, contract.examples);
  validateBoundaries(errors, contract.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertWorkflowRouterCategoriesContract(contract) {
  const result = validateWorkflowRouterCategoriesContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid workflow router categories contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function buildCategories() {
  return [
    {
      categoryId: 'direct-answer',
      label: 'Direct answer',
      routeKind: 'respond',
      userPath: 'Answer in the current conversation.',
      requestSignals: ['single-question', 'known-context', 'no-durable-work'],
      nextStep: 'Return the answer and stop; do not open Workbench.',
      allowedContracts: ['app-state-snapshot.v1'],
      boundary: 'No goal, job, model dispatch, shell command, or filesystem write is required.'
    },
    {
      categoryId: 'skill',
      label: 'Skill',
      routeKind: 'codex-skill',
      userPath: 'Use an installed skill workflow before deciding whether Workbench is needed.',
      requestSignals: ['named-skill', 'document-workflow', 'spreadsheet-workflow', 'plugin-skill-fit'],
      nextStep: 'Load the matching skill instructions and keep any writes inside the requested artifact scope.',
      allowedContracts: ['app-state-snapshot.v1'],
      boundary: 'Skill routing is instruction selection only; it does not call models or execute tools by itself.'
    },
    {
      categoryId: 'automation',
      label: 'Automation',
      routeKind: 'controlled-action',
      userPath: 'Use declared action/job contracts when a controlled operation already exists.',
      requestSignals: ['known-action-id', 'repeatable-operation', 'dry-run-confirm-available'],
      nextStep: 'Preview the declared action and require explicit confirmation before any backend write.',
      allowedContracts: ['action-manifest.v1', 'action-availability.v1', 'action-preview.v1', 'job-model.v1'],
      boundary: 'Automation is limited to declared action/job contracts; it is not a generic shell runner.'
    },
    {
      categoryId: 'workbench-goal',
      label: 'Workbench goal',
      routeKind: 'goal-runbook',
      userPath: 'Move project work into the active goal/runbook/next-action workflow.',
      requestSignals: ['multi-step-project', 'repo-change', 'review-required', 'verification-required'],
      nextStep: 'Use goal-status, goal next, goal prompt, and controlled goal update/review/gate flow.',
      allowedContracts: ['goal-runbook.v1', 'goal-next-action.v1', 'goal-progress-ledger.v1', 'goal-event-log.v1'],
      boundary: 'Workbench goal routing keeps reviewer and main-verifier boundaries; it cannot self-approve.'
    },
    {
      categoryId: 'research',
      label: 'Research',
      routeKind: 'source-backed-research',
      userPath: 'Collect external or source-backed context before making a recommendation.',
      requestSignals: ['current-information', 'external-source-needed', 'comparison-needed'],
      nextStep: 'Record sources and return findings; create a goal only after the user chooses durable work.',
      allowedContracts: ['app-state-snapshot.v1'],
      boundary: 'Research does not write app state, create jobs, invoke provider CLIs, or register goal events.'
    },
    {
      categoryId: 'ignore-skip',
      label: 'Ignore / skip',
      routeKind: 'no-op',
      userPath: 'Do nothing when the request is noise, duplicate, or explicitly skipped.',
      requestSignals: ['duplicate', 'cancelled', 'not-actionable', 'explicit-skip'],
      nextStep: 'Record no state and leave active goal status unchanged.',
      allowedContracts: [],
      boundary: 'Skip is a no-op route; it must not mutate events, jobs, git, or release state.'
    }
  ];
}

function buildExamples() {
  return [
    {
      exampleId: 'example-direct-answer',
      inputKind: 'single factual or code question',
      selectedCategoryId: 'direct-answer',
      reason: 'The request can be answered without durable state, review, or verification.',
      nextContract: null,
      writesState: false
    },
    {
      exampleId: 'example-skill',
      inputKind: 'document or spreadsheet artifact work',
      selectedCategoryId: 'skill',
      reason: 'A local skill supplies the workflow and validation requirements.',
      nextContract: null,
      writesState: false
    },
    {
      exampleId: 'example-automation',
      inputKind: 'known controlled action',
      selectedCategoryId: 'automation',
      reason: 'The operation can be previewed through action and job contracts.',
      nextContract: 'action-preview.v1',
      writesState: false
    },
    {
      exampleId: 'example-workbench-goal',
      inputKind: 'repository change needing review',
      selectedCategoryId: 'workbench-goal',
      reason: 'The work needs worker evidence, independent review, and main verification.',
      nextContract: 'goal-next-action.v1',
      writesState: false
    },
    {
      exampleId: 'example-research',
      inputKind: 'current market or API information',
      selectedCategoryId: 'research',
      reason: 'The answer depends on current or external sources.',
      nextContract: null,
      writesState: false
    },
    {
      exampleId: 'example-ignore-skip',
      inputKind: 'duplicate or cancelled request',
      selectedCategoryId: 'ignore-skip',
      reason: 'No user-visible workflow should start.',
      nextContract: null,
      writesState: false
    }
  ];
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');
  requireExact(errors, context.taskId, 'context.taskId', DEFAULT_TASK_ID);
  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.scope, 'context.scope', 'v40-workflow-router-categories');

  if (!Array.isArray(context.sourceContracts)) {
    errors.push('context.sourceContracts must be an array');
    return;
  }

  for (const contractName of REQUIRED_SOURCE_CONTRACTS) {
    if (!context.sourceContracts.includes(contractName)) {
      errors.push(`context.sourceContracts must include ${contractName}`);
    }
  }

  context.sourceContracts.forEach((contractName, index) => {
    requireContractName(errors, contractName, `context.sourceContracts[${index}]`);
  });
}

function validateCategories(errors, categories) {
  if (!Array.isArray(categories)) {
    errors.push('categories must be an array');
    return;
  }

  const ids = categories.map((category) => category?.categoryId);

  if (ids.join(',') !== CATEGORY_IDS.join(',')) {
    errors.push(`categories must be ordered as ${CATEGORY_IDS.join(',')}`);
  }

  categories.forEach((category, index) => {
    const path = `categories[${index}]`;

    if (!isPlainObject(category)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireCategoryId(errors, category.categoryId, `${path}.categoryId`);
    requireNonEmptyString(errors, category.label, `${path}.label`);
    requireNonEmptyString(errors, category.routeKind, `${path}.routeKind`);
    requireNonEmptyString(errors, category.userPath, `${path}.userPath`);
    requireNonEmptyString(errors, category.nextStep, `${path}.nextStep`);
    requireNonEmptyString(errors, category.boundary, `${path}.boundary`);
    requireStringArray(errors, category.requestSignals, `${path}.requestSignals`);
    requireStringArray(errors, category.allowedContracts, `${path}.allowedContracts`);
    category.allowedContracts?.forEach((contractName, contractIndex) => {
      requireContractName(errors, contractName, `${path}.allowedContracts[${contractIndex}]`);
    });
  });
}

function validateDecisionPolicy(errors, policy) {
  if (!isPlainObject(policy)) {
    errors.push('decisionPolicy must be a plain object');
    return;
  }

  requireExact(errors, policy.defaultCategoryId, 'decisionPolicy.defaultCategoryId', 'workbench-goal');
  requireExact(errors, policy.confidenceSource, 'decisionPolicy.confidenceSource', 'deterministic-router-rules');
  requireExact(errors, policy.requiresHumanConfirmationForGoalDraft, 'decisionPolicy.requiresHumanConfirmationForGoalDraft', true);
  requireExact(errors, policy.writesRouteDecision, 'decisionPolicy.writesRouteDecision', false);
  requireExact(errors, policy.modelInvocationRequired, 'decisionPolicy.modelInvocationRequired', false);
  requireCategoryId(errors, policy.fallbackCategoryId, 'decisionPolicy.fallbackCategoryId');
}

function validateExamples(errors, examples) {
  if (!Array.isArray(examples)) {
    errors.push('examples must be an array');
    return;
  }

  for (const categoryId of CATEGORY_IDS) {
    if (!examples.some((example) => example?.selectedCategoryId === categoryId)) {
      errors.push(`examples must include ${categoryId}`);
    }
  }

  examples.forEach((example, index) => {
    const path = `examples[${index}]`;

    if (!isPlainObject(example)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireSafeRef(errors, example.exampleId, `${path}.exampleId`);
    requireNonEmptyString(errors, example.inputKind, `${path}.inputKind`);
    requireCategoryId(errors, example.selectedCategoryId, `${path}.selectedCategoryId`);
    requireNonEmptyString(errors, example.reason, `${path}.reason`);
    requireExact(errors, example.writesState, `${path}.writesState`, false);

    if (example.nextContract !== null) {
      requireContractName(errors, example.nextContract, `${path}.nextContract`);
    }
  });
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  const trueBoundaries = ['readOnly'];
  const falseBoundaries = [
    'categoryDecisionWritesAvailable',
    'actionExecutionAvailable',
    'jobCreationAvailable',
    'goalDraftWriteAvailable',
    'workbenchGoalRegistrationAvailable',
    'researchFetchAvailable',
    'modelInvocationAvailable',
    'arbitraryCommandExecutionAvailable',
    'shellExecutionAvailable',
    'localFileOpenAvailable',
    'arbitraryPathReadAvailable',
    'gitWriteAvailable',
    'mergeAvailable',
    'pushAvailable',
    'tagAvailable',
    'publishAvailable',
    'selfApprovalAvailable',
    'releaseReadyDeclarationAvailable',
    'statusInferenceFromFrontendAvailable'
  ];

  trueBoundaries.forEach((key) => requireExact(errors, boundaries[key], `boundaries.${key}`, true));
  falseBoundaries.forEach((key) => requireExact(errors, boundaries[key], `boundaries.${key}`, false));
}

function requireExact(errors, actual, path, expected) {
  if (actual !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireStringArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  if (value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    errors.push(`${path} must contain only non-empty strings`);
  }
}

function requireCategoryId(errors, value, path) {
  if (!CATEGORY_IDS.includes(value)) {
    errors.push(`${path} must be one of ${CATEGORY_IDS.join(',')}`);
  }
}

function requireContractName(errors, value, path) {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9.-]*\.v[0-9]+$/u.test(value)) {
    errors.push(`${path} must be a contract name`);
  }
}

function requireSafeRef(errors, value, path) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(value) || value.includes('..')) {
    errors.push(`${path} must be a safe ref`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
