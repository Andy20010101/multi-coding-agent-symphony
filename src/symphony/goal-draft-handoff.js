import {
  GoalRunbookContextError,
  loadGoalRunbookContext
} from './goal-runbook-context.js';

export const GOAL_DRAFT_HANDOFF_CONTRACT_NAME = 'goal-draft-handoff.v1';
export const GOAL_DRAFT_HANDOFF_CONTRACT_VERSION = 1;

const SOURCE_CONTRACTS = Object.freeze([
  'goal-runbook.v1',
  'goal-next-action.v1',
  'goal-progress-ledger.v1',
  'goal-prompt-pack.v1'
]);

const REQUIRED_BOUNDARY_FALSE_FIELDS = Object.freeze([
  'writesFiles',
  'registersGoal',
  'runsGoalInit',
  'modelInvocationAvailable',
  'arbitraryCommandExecutionAvailable',
  'arbitraryPathReadAvailable',
  'gitWriteAvailable',
  'mergeAvailable',
  'pushAvailable',
  'tagAvailable',
  'publishAvailable',
  'selfApprovalAvailable',
  'releaseReadyDeclared'
]);

export async function buildGoalDraftHandoffContract({
  stateDir = '.symphony',
  goalId = 'latest',
  taskId = null,
  generatedAt = new Date().toISOString()
} = {}) {
  requireSafeNullableRef(goalId, 'goalId');
  requireSafeNullableRef(taskId, 'taskId');

  const loaded = await loadRunbookOrNull({ stateDir, goalId });
  const runbook = loaded?.runbook ?? null;
  const resolvedGoalId = runbook?.goalId ?? goalId;
  const selectedTask = selectTask({ runbook, taskId });
  const sourceTaskId = selectedTask?.taskId ?? taskId;
  const draftGoalId = buildDraftGoalId({ resolvedGoalId, sourceTaskId });
  const blockers = buildBlockers({ runbook, selectedTask, requestedTaskId: taskId, loadError: loaded?.error ?? null });
  const draftReady = blockers.length === 0;
  const draftTasks = buildDraftTasks({ selectedTask, draftReady });
  const runbookDraft = {
    contractName: 'goal-runbook.v1',
    contractVersion: 1,
    draftOnly: true,
    autoRegister: false,
    goalId: draftReady ? draftGoalId : null,
    goalTitle: draftReady ? `${selectedTask.title} follow-up` : null,
    baseline: {
      tag: resolvedGoalId,
      commit: null,
      evidenceRef: null
    },
    tasks: draftTasks,
    releaseGates: draftReady
      ? ['release.pnpm-check', 'release.pnpm-test', 'release.workbench-build', 'release.diff-check']
      : [],
    rolePolicy: {
      workerCannotApproveOwnTask: true,
      reviewerApprovalRequiredBeforeMainVerification: true,
      mainVerificationRequiredBeforeReleaseReady: true
    }
  };

  return assertGoalDraftHandoffContract({
    contractName: GOAL_DRAFT_HANDOFF_CONTRACT_NAME,
    contractVersion: GOAL_DRAFT_HANDOFF_CONTRACT_VERSION,
    generatedAt,
    readOnly: true,
    context: {
      goalId: resolvedGoalId,
      taskId: sourceTaskId,
      sourceContracts: SOURCE_CONTRACTS,
      stateSource: 'explicit-backend-contracts',
      handoffMode: 'draft-only'
    },
    routing: {
      category: 'workbench-goal',
      acceptedSignals: [
        'repeated-friction',
        'project-scoped-work',
        'multi-step-validation',
        'needs-worker-reviewer-main-verifier-split'
      ],
      excludedCategories: [
        'direct-answer',
        'skill',
        'automation',
        'research',
        'skip'
      ]
    },
    goalDraft: {
      state: draftReady ? 'draft-ready' : 'blocked',
      draftOnly: true,
      sourceGoalId: resolvedGoalId,
      sourceTaskId,
      suggestedGoalId: draftReady ? draftGoalId : null,
      suggestedTitle: draftReady ? `${selectedTask.title} follow-up` : null,
      registrationState: 'not-registered',
      operatorReviewRequired: true
    },
    runbookDraft,
    handoff: {
      markdown: buildHandoffMarkdown({ runbookDraft, selectedTask, blockers, draftReady }),
      checklist: buildChecklist({ draftReady }),
      copyOnlyCommands: draftReady
        ? [
            `pnpm --silent symphony goal init --from-json <reviewed-draft-json> --goal ${draftGoalId} --dry-run --json`,
            `pnpm --silent symphony goal-status --goal ${draftGoalId} --json`
          ]
        : [],
      nextRequiredAction: draftReady
        ? 'Review the draft JSON and run goal init dry-run outside Workbench if the operator wants to create a new managed goal.'
        : 'Resolve blockers before using this handoff as a goal draft.'
    },
    blockers,
    endpoint: {
      method: 'GET',
      route: '/api/workflows/goal-draft-handoff',
      allowedQueryFields: ['goal', 'task'],
      rejectsPromptInput: true,
      rejectsPlanHashInput: true,
      rejectsConfirmInput: true,
      writesInPreview: false,
      registersGoal: false
    },
    boundaries: {
      readOnly: true,
      draftOnly: true,
      writesFiles: false,
      registersGoal: false,
      runsGoalInit: false,
      modelInvocationAvailable: false,
      arbitraryCommandExecutionAvailable: false,
      arbitraryPathReadAvailable: false,
      gitWriteAvailable: false,
      mergeAvailable: false,
      pushAvailable: false,
      tagAvailable: false,
      publishAvailable: false,
      selfApprovalAvailable: false,
      releaseReadyDeclared: false,
      statusSource: 'explicit-backend-contracts'
    }
  });
}

export function validateGoalDraftHandoffContract(contract) {
  const errors = [];

  if (!isPlainObject(contract)) {
    return { ok: false, errors: ['contract must be a plain object'] };
  }

  requireExact(errors, contract.contractName, 'contractName', GOAL_DRAFT_HANDOFF_CONTRACT_NAME);
  requireExact(errors, contract.contractVersion, 'contractVersion', GOAL_DRAFT_HANDOFF_CONTRACT_VERSION);
  requireIsoTimestamp(errors, contract.generatedAt, 'generatedAt');
  requireExact(errors, contract.readOnly, 'readOnly', true);
  validateContext(errors, contract.context);
  validateRouting(errors, contract.routing);
  validateGoalDraft(errors, contract.goalDraft);
  validateRunbookDraft(errors, contract.runbookDraft);
  validateHandoff(errors, contract.handoff);
  validateBlockers(errors, contract.blockers);
  validateEndpoint(errors, contract.endpoint);
  validateBoundaries(errors, contract.boundaries);

  return { ok: errors.length === 0, errors };
}

export function assertGoalDraftHandoffContract(contract) {
  const result = validateGoalDraftHandoffContract(contract);

  if (!result.ok) {
    throw new Error(`Invalid goal draft handoff contract: ${result.errors.join('; ')}`);
  }

  return contract;
}

function buildDraftTasks({ selectedTask, draftReady }) {
  if (!draftReady) {
    return [];
  }

  return [
    {
      taskId: 'task-1',
      title: `Clarify ${selectedTask.title}`,
      branch: 'draft-task-1-clarify-scope',
      roleOrder: ['worker', 'reviewer', 'main-verifier'],
      acceptance: [
        'Scope is confirmed from the captured request and project context.',
        'Worker evidence path is set before implementation starts.',
        'Review evidence path is set before main verification.',
        'Main verification evidence path is set before release closeout.'
      ],
      expectedEvidence: {
        worker: 'worker.evidence-recorded',
        reviewer: ['reviewer.approved', 'reviewer.needs-revision'],
        mainVerifier: 'main.verification-passed'
      },
      copyOnlyCommands: [
        'pnpm check',
        'pnpm test',
        'pnpm workbench:build',
        'git diff --check'
      ]
    }
  ];
}

function buildBlockers({ runbook, selectedTask, requestedTaskId, loadError }) {
  const blockers = [];

  if (loadError !== null) {
    blockers.push({
      code: 'runbook-unavailable',
      message: loadError.message,
      source: 'goal-runbook.v1'
    });
  }

  if (runbook === null) {
    blockers.push({
      code: 'source-runbook-missing',
      message: 'A registered source goal runbook is required before a goal draft handoff can be anchored.',
      source: 'goal-runbook.v1'
    });
  }

  if (runbook !== null && selectedTask === null) {
    blockers.push({
      code: 'source-task-missing',
      message: requestedTaskId === null
        ? 'A source task is required for a draft handoff.'
        : `Task ${requestedTaskId} is not present in the source runbook.`,
      source: 'goal-runbook.v1'
    });
  }

  return blockers;
}

function buildChecklist({ draftReady }) {
  const common = [
    'Check the suggested goal id and title before registration.',
    'Replace placeholder evidence refs before implementation starts.',
    'Run goal init with --dry-run first and confirm only with the returned plan hash.',
    'Keep worker, reviewer, and main-verifier evidence separate.'
  ];

  if (!draftReady) {
    return ['Resolve listed blockers before using the draft.', ...common];
  }

  return common;
}

function buildHandoffMarkdown({ runbookDraft, selectedTask, blockers, draftReady }) {
  const lines = [
    '# Goal Draft Handoff',
    '',
    `Source task: \`${selectedTask?.taskId ?? 'missing'}\``,
    `Source title: \`${selectedTask?.title ?? 'missing'}\``,
    `Draft state: \`${draftReady ? 'draft-ready' : 'blocked'}\``,
    '',
    '## Draft',
    '',
    `- Goal id: \`${runbookDraft.goalId ?? 'missing'}\``,
    `- Goal title: \`${runbookDraft.goalTitle ?? 'missing'}\``,
    `- Task count: \`${runbookDraft.tasks.length}\``,
    `- Auto register: \`${String(runbookDraft.autoRegister)}\``,
    '',
    '## Review Before Registration',
    '',
    '- Confirm the captured request really needs a managed goal.',
    '- Replace placeholder branches and evidence refs.',
    '- Run goal init dry-run before any confirm step.',
    '',
    '## Boundaries',
    '',
    '- This draft does not register a goal.',
    '- This draft does not write files, run commands, invoke models, merge, push, tag, publish, self-approve, or declare release readiness.'
  ];

  if (blockers.length > 0) {
    lines.push('', '## Blockers', '', ...blockers.map((blocker) => `- ${blocker.code}: ${blocker.message}`));
  }

  return lines.join('\n');
}

function selectTask({ runbook, taskId }) {
  const tasks = Array.isArray(runbook?.tasks) ? runbook.tasks : [];

  if (taskId !== null) {
    return tasks.find((task) => task?.taskId === taskId) ?? null;
  }

  return tasks[0] ?? null;
}

async function loadRunbookOrNull({ stateDir, goalId }) {
  try {
    return await loadGoalRunbookContext({ stateDir, goalId });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      return { runbook: null, error };
    }

    throw error;
  }
}

function buildDraftGoalId({ resolvedGoalId, sourceTaskId }) {
  const base = sanitizeSafeRef(resolvedGoalId === 'latest' ? 'goal' : resolvedGoalId);
  const task = sanitizeSafeRef(sourceTaskId ?? 'task');

  return `${base}-${task}-draft`;
}

function sanitizeSafeRef(value) {
  return String(value ?? 'draft')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 80) || 'draft';
}

function validateContext(errors, context) {
  if (!isPlainObject(context)) {
    errors.push('context must be a plain object');
    return;
  }

  requireSafeNullableRef(errors, context.goalId, 'context.goalId');
  requireSafeNullableRef(errors, context.taskId, 'context.taskId');
  validateStringArray(errors, context.sourceContracts, 'context.sourceContracts');
  requireExact(errors, context.stateSource, 'context.stateSource', 'explicit-backend-contracts');
  requireExact(errors, context.handoffMode, 'context.handoffMode', 'draft-only');
}

function validateRouting(errors, routing) {
  if (!isPlainObject(routing)) {
    errors.push('routing must be a plain object');
    return;
  }

  requireExact(errors, routing.category, 'routing.category', 'workbench-goal');
  validateStringArray(errors, routing.acceptedSignals, 'routing.acceptedSignals');
  validateStringArray(errors, routing.excludedCategories, 'routing.excludedCategories');
}

function validateGoalDraft(errors, goalDraft) {
  if (!isPlainObject(goalDraft)) {
    errors.push('goalDraft must be a plain object');
    return;
  }

  requireEnum(errors, goalDraft.state, 'goalDraft.state', ['draft-ready', 'blocked']);
  requireExact(errors, goalDraft.draftOnly, 'goalDraft.draftOnly', true);
  requireSafeNullableRef(errors, goalDraft.sourceGoalId, 'goalDraft.sourceGoalId');
  requireSafeNullableRef(errors, goalDraft.sourceTaskId, 'goalDraft.sourceTaskId');
  requireSafeNullableRef(errors, goalDraft.suggestedGoalId, 'goalDraft.suggestedGoalId');
  requireExact(errors, goalDraft.registrationState, 'goalDraft.registrationState', 'not-registered');
  requireExact(errors, goalDraft.operatorReviewRequired, 'goalDraft.operatorReviewRequired', true);
}

function validateRunbookDraft(errors, runbookDraft) {
  if (!isPlainObject(runbookDraft)) {
    errors.push('runbookDraft must be a plain object');
    return;
  }

  requireExact(errors, runbookDraft.contractName, 'runbookDraft.contractName', 'goal-runbook.v1');
  requireExact(errors, runbookDraft.contractVersion, 'runbookDraft.contractVersion', 1);
  requireExact(errors, runbookDraft.draftOnly, 'runbookDraft.draftOnly', true);
  requireExact(errors, runbookDraft.autoRegister, 'runbookDraft.autoRegister', false);
  requireSafeNullableRef(errors, runbookDraft.goalId, 'runbookDraft.goalId');
  requireNullableString(errors, runbookDraft.goalTitle, 'runbookDraft.goalTitle');
  requirePlainObject(errors, runbookDraft.baseline, 'runbookDraft.baseline');
  requireArray(errors, runbookDraft.tasks, 'runbookDraft.tasks');
  requireArray(errors, runbookDraft.releaseGates, 'runbookDraft.releaseGates');
  requirePlainObject(errors, runbookDraft.rolePolicy, 'runbookDraft.rolePolicy');
}

function validateHandoff(errors, handoff) {
  if (!isPlainObject(handoff)) {
    errors.push('handoff must be a plain object');
    return;
  }

  requireNonEmptyString(errors, handoff.markdown, 'handoff.markdown');
  validateStringArray(errors, handoff.checklist, 'handoff.checklist');
  validateStringArray(errors, handoff.copyOnlyCommands, 'handoff.copyOnlyCommands');
  requireNonEmptyString(errors, handoff.nextRequiredAction, 'handoff.nextRequiredAction');
}

function validateBlockers(errors, blockers) {
  if (!Array.isArray(blockers)) {
    errors.push('blockers must be an array');
    return;
  }

  blockers.forEach((blocker, index) => {
    const path = `blockers[${index}]`;

    if (!isPlainObject(blocker)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireSafeRef(errors, blocker.code, `${path}.code`);
    requireNonEmptyString(errors, blocker.message, `${path}.message`);
    requireNonEmptyString(errors, blocker.source, `${path}.source`);
  });
}

function validateEndpoint(errors, endpoint) {
  if (!isPlainObject(endpoint)) {
    errors.push('endpoint must be a plain object');
    return;
  }

  requireExact(errors, endpoint.method, 'endpoint.method', 'GET');
  requireExact(errors, endpoint.route, 'endpoint.route', '/api/workflows/goal-draft-handoff');
  validateStringArray(errors, endpoint.allowedQueryFields, 'endpoint.allowedQueryFields');
  requireExact(errors, endpoint.rejectsPromptInput, 'endpoint.rejectsPromptInput', true);
  requireExact(errors, endpoint.rejectsPlanHashInput, 'endpoint.rejectsPlanHashInput', true);
  requireExact(errors, endpoint.rejectsConfirmInput, 'endpoint.rejectsConfirmInput', true);
  requireExact(errors, endpoint.writesInPreview, 'endpoint.writesInPreview', false);
  requireExact(errors, endpoint.registersGoal, 'endpoint.registersGoal', false);
}

function validateBoundaries(errors, boundaries) {
  if (!isPlainObject(boundaries)) {
    errors.push('boundaries must be a plain object');
    return;
  }

  requireExact(errors, boundaries.readOnly, 'boundaries.readOnly', true);
  requireExact(errors, boundaries.draftOnly, 'boundaries.draftOnly', true);

  for (const field of REQUIRED_BOUNDARY_FALSE_FIELDS) {
    requireExact(errors, boundaries[field], `boundaries.${field}`, false);
  }

  requireExact(errors, boundaries.statusSource, 'boundaries.statusSource', 'explicit-backend-contracts');
}

function requirePlainObject(errors, value, path) {
  if (!isPlainObject(value)) {
    errors.push(`${path} must be a plain object`);
  }
}

function requireArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
  }
}

function validateStringArray(errors, value, path) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((item, index) => {
    requireNonEmptyString(errors, item, `${path}[${index}]`);
  });
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

function requireNullableString(errors, value, path) {
  if (value !== null && (typeof value !== 'string' || value.trim() === '')) {
    errors.push(`${path} must be null or a non-empty string`);
  }
}

function requireSafeRef(errors, value, path) {
  if (!isSafeRef(value)) {
    errors.push(`${path} must be a safe ref`);
  }
}

function requireSafeNullableRef(errorsOrValue, valueOrPath, maybePath) {
  if (Array.isArray(errorsOrValue)) {
    const errors = errorsOrValue;
    const value = valueOrPath;
    const path = maybePath;

    if (value !== null && !isSafeRef(value)) {
      errors.push(`${path} must be null or a safe ref`);
    }

    return;
  }

  const value = errorsOrValue;
  const path = valueOrPath;

  if (value !== null && !isSafeRef(value)) {
    throw new Error(`${path} must be null or a safe ref`);
  }
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${JSON.stringify(expected)}`);
  }
}

function requireEnum(errors, value, path, allowed) {
  if (!allowed.includes(value)) {
    errors.push(`${path} must be one of ${allowed.join(', ')}`);
  }
}

function isSafeRef(value) {
  return typeof value === 'string' &&
    value.trim() !== '' &&
    !value.includes('/') &&
    !value.includes('\\') &&
    !value.includes('..') &&
    !value.includes('?') &&
    !value.includes('#');
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
