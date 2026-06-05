export const INBOX_CAPTURE_CONTRACT_NAME = 'inbox-capture.v1';
export const INBOX_CAPTURE_CONTRACT_VERSION = 1;

const CAPTURE_ITEM_TYPES = Object.freeze([
  'user-request',
  'project-clue',
  'idea',
  'fault'
]);

const REQUIRED_SOURCE_CONTRACTS = Object.freeze([
  'project-registry.v1',
  'app-state-snapshot.v1',
  'goal-runbook.v1',
  'goal-next-action.v1',
  'goal-progress-ledger.v1',
  'goal-event-log.v1',
  'action-manifest.v1'
]);

const CAPTURE_BOUNDARY_FALSE_FIELDS = Object.freeze([
  'captureWriteAvailable',
  'workbenchGoalRequired',
  'shellExecutionAvailable',
  'modelInvocationAvailable',
  'providerCliExecutionAvailable',
  'arbitraryCommandExecutionAvailable',
  'arbitraryPathReadAvailable',
  'localFileOpenAvailable',
  'jobExecutionAvailable',
  'gitWriteAvailable',
  'mergeAvailable',
  'pushAvailable',
  'tagAvailable',
  'publishAvailable',
  'selfApprovalAvailable',
  'reviewApprovalAvailable',
  'mainVerificationAvailable',
  'releaseReadinessAvailable',
  'v8TopLevelModelAvailable'
]);

export function buildInboxCaptureContract({
  goalId = 'latest',
  taskId = null,
  generatedAt = new Date().toISOString()
} = {}) {
  return assertInboxCaptureContract({
    contractName: INBOX_CAPTURE_CONTRACT_NAME,
    contractVersion: INBOX_CAPTURE_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId,
      taskId,
      sourceContracts: REQUIRED_SOURCE_CONTRACTS,
      stateSource: 'explicit-backend-contracts',
      appPath: 'inbox capture -> router category -> optional goal/runbook draft'
    },
    intakeSurface: {
      route: '/api/inbox/capture',
      cliCommand: 'symphony inbox capture --json',
      workbenchPanel: 'InboxCapturePanel',
      acceptsRawRequests: true,
      requiresActiveWorkbenchGoal: false,
      writesInPreview: false
    },
    captureItemTypes: CAPTURE_ITEM_TYPES.map((type) => buildCaptureItemType(type)),
    captureDraft: {
      contractName: 'inbox-capture-draft.v1',
      persisted: false,
      requiredFields: ['itemType', 'summary', 'rawText'],
      optionalFields: ['projectHint', 'source', 'urgency', 'evidenceRef', 'notes'],
      bodyReadAvailable: false,
      validationSource: 'backend-contract-schema',
      nextContract: 'workflow-router-category.v1'
    },
    handoff: {
      routerContract: 'workflow-router-category.v1',
      goalDraftContract: 'goal-runbook-draft-handoff.v1',
      workbenchGoalRequiredForCapture: false,
      workbenchGoalRequiredForGoalDraft: true,
      allowedNextSteps: [
        'keep-in-inbox',
        'route-direct-answer',
        'route-skill',
        'route-automation',
        'route-workbench-goal',
        'route-research',
        'route-ignore-skip'
      ],
      blockedInferenceSources: [
        'branch-name',
        'file-name',
        'commit-message',
        'prompt-text',
        'task-title',
        'frontend-state'
      ]
    },
    boundaries: inboxCaptureBoundaries()
  });
}

export function validateInboxCaptureContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', INBOX_CAPTURE_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', INBOX_CAPTURE_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);
  validateContext(errors, contract.context);
  validateIntakeSurface(errors, contract.intakeSurface);
  validateCaptureItemTypes(errors, contract.captureItemTypes);
  validateCaptureDraft(errors, contract.captureDraft);
  validateHandoff(errors, contract.handoff);
  validateBoundaries(errors, contract.boundaries, 'boundaries');

  return { ok: errors.length === 0, errors };
}

export function assertInboxCaptureContract(contract) {
  const result = validateInboxCaptureContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid inbox capture contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

export function isUnsafeInboxContextRef(value) {
  return typeof value !== 'string'
    || value === ''
    || value.includes('/')
    || value.includes('\\')
    || value.includes('..');
}

export function renderInboxCaptureText(contract) {
  const lines = [
    `Inbox capture: ${contract.context.goalId}`,
    `Task: ${contract.context.taskId ?? 'none'}`,
    `Route: ${contract.intakeSurface.route}`,
    `Requires Workbench goal: ${contract.intakeSurface.requiresActiveWorkbenchGoal ? 'yes' : 'no'}`,
    `Writes in preview: ${contract.intakeSurface.writesInPreview ? 'yes' : 'no'}`,
    `Capture types: ${contract.captureItemTypes.map((item) => item.itemType).join(', ')}`,
    `Next: ${contract.handoff.routerContract}`,
    ''
  ];

  return lines.join('\n');
}

function buildCaptureItemType(itemType) {
  const labels = {
    'user-request': 'User request',
    'project-clue': 'Project clue',
    idea: 'Idea',
    fault: 'Fault'
  };
  const examples = {
    'user-request': 'A raw ask that may be answered directly or routed later.',
    'project-clue': 'A repo, task, owner, dependency, or environment detail.',
    idea: 'A possible improvement that is not yet a goal.',
    fault: 'A failure symptom, blocker, regression, or diagnostic note.'
  };

  return {
    itemType,
    label: labels[itemType],
    summary: examples[itemType],
    requiresWorkbenchGoal: false,
    routesImmediately: false,
    allowedBeforeGoalExists: true
  };
}

function inboxCaptureBoundaries() {
  return {
    readOnly: true,
    captureWriteAvailable: false,
    workbenchGoalRequired: false,
    shellExecutionAvailable: false,
    modelInvocationAvailable: false,
    providerCliExecutionAvailable: false,
    arbitraryCommandExecutionAvailable: false,
    arbitraryPathReadAvailable: false,
    localFileOpenAvailable: false,
    jobExecutionAvailable: false,
    gitWriteAvailable: false,
    mergeAvailable: false,
    pushAvailable: false,
    tagAvailable: false,
    publishAvailable: false,
    selfApprovalAvailable: false,
    reviewApprovalAvailable: false,
    mainVerificationAvailable: false,
    releaseReadinessAvailable: false,
    v8TopLevelModelAvailable: false
  };
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeRef(errors, context.goalId, 'context.goalId');

  if (context.taskId !== null) {
    requireSafeRef(errors, context.taskId, 'context.taskId');
  }

  requireStringArray(errors, context.sourceContracts, 'context.sourceContracts');

  for (const contractName of REQUIRED_SOURCE_CONTRACTS) {
    if (!context.sourceContracts.includes(contractName)) {
      errors.push(`context.sourceContracts must include ${contractName}`);
    }
  }

  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.appPath, 'context.appPath', 'inbox capture -> router category -> optional goal/runbook draft');
}

function validateIntakeSurface(errors, intakeSurface) {
  if (!isPlainObject(intakeSurface)) {
    errors.push('intakeSurface must be a plain object');
    return;
  }

  requireExact(errors, intakeSurface.route, 'intakeSurface.route', '/api/inbox/capture');
  requireExact(errors, intakeSurface.cliCommand, 'intakeSurface.cliCommand', 'symphony inbox capture --json');
  requireExact(errors, intakeSurface.workbenchPanel, 'intakeSurface.workbenchPanel', 'InboxCapturePanel');
  requireExact(errors, intakeSurface.acceptsRawRequests, 'intakeSurface.acceptsRawRequests', true);
  requireExact(errors, intakeSurface.requiresActiveWorkbenchGoal, 'intakeSurface.requiresActiveWorkbenchGoal', false);
  requireExact(errors, intakeSurface.writesInPreview, 'intakeSurface.writesInPreview', false);
}

function validateCaptureItemTypes(errors, captureItemTypes) {
  if (!Array.isArray(captureItemTypes)) {
    errors.push('captureItemTypes must be an array');
    return;
  }

  const itemTypes = captureItemTypes.map((item) => item?.itemType);

  for (const expected of CAPTURE_ITEM_TYPES) {
    if (!itemTypes.includes(expected)) {
      errors.push(`captureItemTypes must include ${expected}`);
    }
  }

  captureItemTypes.forEach((item, index) => {
    if (!isPlainObject(item)) {
      errors.push(`captureItemTypes[${index}] must be a plain object`);
      return;
    }

    if (!CAPTURE_ITEM_TYPES.includes(item.itemType)) {
      errors.push(`captureItemTypes[${index}].itemType must be supported`);
    }

    requireNonEmptyString(errors, item.label, `captureItemTypes[${index}].label`);
    requireNonEmptyString(errors, item.summary, `captureItemTypes[${index}].summary`);
    requireExact(errors, item.requiresWorkbenchGoal, `captureItemTypes[${index}].requiresWorkbenchGoal`, false);
    requireExact(errors, item.routesImmediately, `captureItemTypes[${index}].routesImmediately`, false);
    requireExact(errors, item.allowedBeforeGoalExists, `captureItemTypes[${index}].allowedBeforeGoalExists`, true);
  });
}

function validateCaptureDraft(errors, captureDraft) {
  if (!isPlainObject(captureDraft)) {
    errors.push('captureDraft must be a plain object');
    return;
  }

  requireExact(errors, captureDraft.contractName, 'captureDraft.contractName', 'inbox-capture-draft.v1');
  requireExact(errors, captureDraft.persisted, 'captureDraft.persisted', false);
  requireStringArray(errors, captureDraft.requiredFields, 'captureDraft.requiredFields');
  requireStringArray(errors, captureDraft.optionalFields, 'captureDraft.optionalFields');

  for (const requiredField of ['itemType', 'summary', 'rawText']) {
    if (!captureDraft.requiredFields.includes(requiredField)) {
      errors.push(`captureDraft.requiredFields must include ${requiredField}`);
    }
  }

  requireExact(errors, captureDraft.bodyReadAvailable, 'captureDraft.bodyReadAvailable', false);
  requireExact(errors, captureDraft.validationSource, 'captureDraft.validationSource', 'backend-contract-schema');
  requireExact(errors, captureDraft.nextContract, 'captureDraft.nextContract', 'workflow-router-category.v1');
}

function validateHandoff(errors, handoff) {
  if (!isPlainObject(handoff)) {
    errors.push('handoff must be a plain object');
    return;
  }

  requireExact(errors, handoff.routerContract, 'handoff.routerContract', 'workflow-router-category.v1');
  requireExact(errors, handoff.goalDraftContract, 'handoff.goalDraftContract', 'goal-runbook-draft-handoff.v1');
  requireExact(errors, handoff.workbenchGoalRequiredForCapture, 'handoff.workbenchGoalRequiredForCapture', false);
  requireExact(errors, handoff.workbenchGoalRequiredForGoalDraft, 'handoff.workbenchGoalRequiredForGoalDraft', true);
  requireStringArray(errors, handoff.allowedNextSteps, 'handoff.allowedNextSteps');
  requireStringArray(errors, handoff.blockedInferenceSources, 'handoff.blockedInferenceSources');

  for (const source of ['branch-name', 'file-name', 'commit-message', 'prompt-text', 'task-title', 'frontend-state']) {
    if (!handoff.blockedInferenceSources.includes(source)) {
      errors.push(`handoff.blockedInferenceSources must include ${source}`);
    }
  }
}

function validateBoundaries(errors, boundaries, path) {
  if (!isPlainObject(boundaries)) {
    errors.push(`${path} must be a plain object`);
    return;
  }

  requireExact(errors, boundaries.readOnly, `${path}.readOnly`, true);

  for (const field of CAPTURE_BOUNDARY_FALSE_FIELDS) {
    requireExact(errors, boundaries[field], `${path}.${field}`, false);
  }
}

function requireSafeRef(errors, value, path) {
  if (isUnsafeInboxContextRef(value)) {
    errors.push(`${path} must be a safe ref`);
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireIsoTimestamp(errors, value, path) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors.push(`${path} must be an ISO timestamp`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireStringArray(errors, value, path) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    errors.push(`${path} must be an array of non-empty strings`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
