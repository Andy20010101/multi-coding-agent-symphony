import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { readGoalEventJournal } from './goal-event-journal.js';

export const GOAL_PROGRESS_LEDGER_CONTRACT_NAME = 'goal-progress-ledger.v1';
export const GOAL_PROGRESS_LEDGER_CONTRACT_VERSION = 1;
export const DEFAULT_GOAL_PROGRESS_GOAL_ID = 'v17-readonly-goal-progress-console-contracts';
export const V18_GOAL_EVENT_JOURNAL_GOAL_ID = 'v18-goal-event-journal-evidence-recorder';
export const V19_GOAL_RUNBOOK_GOAL_ID = 'v19-goal-runbook-next-action';

export const GOAL_PROGRESS_TASK_STATUSES = Object.freeze([
  'not-started',
  'planned',
  'in-progress',
  'self-checked',
  'needs-review',
  'needs-revision',
  'approved',
  'merged-to-main',
  'main-verified',
  'release-ready',
  'blocked',
  'unknown'
]);

export const GOAL_PROGRESS_REVIEW_VERDICTS = Object.freeze([
  'APPROVED',
  'NEEDS_REVISION',
  'PENDING',
  'UNKNOWN'
]);

export const GOAL_PROGRESS_RELEASE_GATE_STATUSES = Object.freeze([
  'unknown',
  'missing',
  'pending',
  'passed',
  'failed',
  'blocked'
]);

export const GOAL_PROGRESS_RELEASE_GATE_IDS = Object.freeze([
  'pnpmCheck',
  'pnpmTest',
  'workbenchBuild',
  'mutationGate',
  'auditHigh',
  'diffCheck',
  'mcasDoctor',
  'docsUpdated',
  'tagEvidence'
]);

const DEFAULT_BASELINE = Object.freeze({
  tag: 'v16',
  commit: null,
  evidenceRef: 'docs/plans/v16-tag-release-evidence-2026-05-28.md'
});
const V18_BASELINE = Object.freeze({
  tag: 'v17',
  commit: null,
  evidenceRef: 'docs/plans/v17-release-evidence-2026-05-28.md'
});
const V19_BASELINE = Object.freeze({
  tag: 'v18',
  commit: null,
  evidenceRef: 'docs/plans/v18-tag-release-evidence-2026-05-29.md'
});

const DEFAULT_TASKS = Object.freeze([
  Object.freeze({
    taskId: 'task-1',
    title: 'Add goal-progress-ledger.v1 contract fixtures and validator',
    branch: 'v17-task1-goal-progress-contract',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v17-task1-goal-progress-contract'
  }),
  Object.freeze({
    taskId: 'task-2',
    title: 'Add read-only goal progress resolver',
    branch: 'v17-task2-goal-progress-resolver',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v17-task2-goal-progress-resolver'
  }),
  Object.freeze({
    taskId: 'task-3',
    title: 'Add read-only symphony goal-status CLI',
    branch: 'v17-task3-goal-status-cli',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v17-task3-goal-status-cli'
  }),
  Object.freeze({
    taskId: 'task-4',
    title: 'Add read-only goal progress API routes',
    branch: 'v17-task4-goal-progress-api',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v17-task4-goal-progress-api'
  }),
  Object.freeze({
    taskId: 'task-5',
    title: 'Add Workbench Goal Progress panel',
    branch: 'v17-task5-workbench-goal-progress-panel',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v17-task5-workbench-goal-progress-panel'
  }),
  Object.freeze({
    taskId: 'task-6',
    title: 'Add capabilities.v1 contract, API, and UI',
    branch: 'v17-task6-capabilities-contract-api-ui',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v17-task6-capabilities-contract-api-ui'
  }),
  Object.freeze({
    taskId: 'task-7',
    title: 'Add diagnostics.v1 contract, API, and UI',
    branch: 'v17-task7-diagnostics-contract-api-ui',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v17-task7-diagnostics-contract-api-ui'
  }),
  Object.freeze({
    taskId: 'task-8',
    title: 'Add error-envelope.v1 and API error hardening',
    branch: 'v17-task8-error-envelope',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v17-task8-error-envelope'
  }),
  Object.freeze({
    taskId: 'task-9',
    title: 'Expand route smoke, fallback, and security hardening',
    branch: 'v17-task9-route-smoke-security',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v17-task9-route-smoke-security'
  }),
  Object.freeze({
    taskId: 'task-10',
    title: 'Update documentation, release evidence, and tag prep',
    branch: 'v17-task10-docs-release-evidence',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v17-task10-docs-release-evidence'
  })
]);
const V18_TASKS = Object.freeze([
  Object.freeze({
    taskId: 'task-1',
    title: 'Add goal-event-log.v1 and goal-update-plan.v1 contracts',
    branch: 'v18-task1-goal-event-contracts',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v18-task1-goal-event-contracts'
  }),
  Object.freeze({
    taskId: 'task-2',
    title: 'Add append-only event journal writer',
    branch: 'v18-task2-event-journal-writer',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v18-task2-event-journal-writer'
  }),
  Object.freeze({
    taskId: 'task-3',
    title: 'Add symphony goal update CLI',
    branch: 'v18-task3-goal-update-cli',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v18-task3-goal-update-cli'
  }),
  Object.freeze({
    taskId: 'task-4',
    title: 'Add symphony goal review CLI',
    branch: 'v18-task4-goal-review-cli',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v18-task4-goal-review-cli'
  }),
  Object.freeze({
    taskId: 'task-5',
    title: 'Add symphony goal gate CLI',
    branch: 'v18-task5-goal-gate-cli',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v18-task5-goal-gate-cli'
  }),
  Object.freeze({
    taskId: 'task-6',
    title: 'Add event resolver to goal-progress-ledger.v1',
    branch: 'v18-task6-event-ledger-resolver',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v18-task6-event-ledger-resolver'
  }),
  Object.freeze({
    taskId: 'task-7',
    title: 'Add read-only goal events API',
    branch: 'v18-task7-events-api',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v18-task7-events-api'
  }),
  Object.freeze({
    taskId: 'task-8',
    title: 'Add Workbench Goal Events Timeline and Evidence Matrix',
    branch: 'v18-task8-workbench-events',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v18-task8-workbench-events'
  }),
  Object.freeze({
    taskId: 'task-9',
    title: 'Expand route smoke and safety boundary regression',
    branch: 'v18-task9-route-smoke-security',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v18-task9-route-smoke-security'
  }),
  Object.freeze({
    taskId: 'task-10',
    title: 'Update docs, operator guide, and release evidence',
    branch: 'v18-task10-docs-release-evidence',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v18-task10-docs-release-evidence'
  })
]);
const V19_TASKS = Object.freeze([
  Object.freeze({
    taskId: 'task-1',
    title: 'Contracts, fixtures, validators',
    branch: 'v19-task1-goal-runbook-contracts',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v19-task1-goal-runbook-contracts'
  }),
  Object.freeze({
    taskId: 'task-2',
    title: 'Managed goal runbook registry and symphony goal init',
    branch: 'v19-task2-goal-runbook-registry',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v19-task2-goal-runbook-registry'
  }),
  Object.freeze({
    taskId: 'task-3',
    title: 'Next-action resolver',
    branch: 'v19-task3-next-action-resolver',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v19-task3-next-action-resolver'
  }),
  Object.freeze({
    taskId: 'task-4',
    title: 'Goal prompt pack generator',
    branch: 'v19-task4-goal-prompt-pack-generator',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v19-task4-goal-prompt-pack-generator'
  }),
  Object.freeze({
    taskId: 'task-5',
    title: 'CLI integration for goal next, goal prompt, goal closeout, and symphony next',
    branch: 'v19-task5-goal-cli-integration',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v19-task5-goal-cli-integration'
  }),
  Object.freeze({
    taskId: 'task-6',
    title: 'Workbench Active Goal Control Center',
    branch: 'v19-task6-workbench-active-goal-control-center',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v19-task6-workbench-active-goal-control-center'
  }),
  Object.freeze({
    taskId: 'task-7',
    title: 'Docs, operator guide, and contract index',
    branch: 'v19-task7-docs-operator-guide-contract-index',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v19-task7-docs-operator-guide-contract-index'
  }),
  Object.freeze({
    taskId: 'task-8',
    title: 'Release verification, final closure, and tag evidence',
    branch: 'v19-task8-release-verification-closure-tag-evidence',
    nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v19-task8-release-verification-closure-tag-evidence'
  })
]);
const GOAL_PROGRESS_TEMPLATES = Object.freeze({
  [DEFAULT_GOAL_PROGRESS_GOAL_ID]: Object.freeze({
    goalId: DEFAULT_GOAL_PROGRESS_GOAL_ID,
    goalTitle: 'v17 Read-only Goal Progress Ledger and Console Contract Hardening',
    baseline: DEFAULT_BASELINE,
    tasks: DEFAULT_TASKS
  }),
  [V18_GOAL_EVENT_JOURNAL_GOAL_ID]: Object.freeze({
    goalId: V18_GOAL_EVENT_JOURNAL_GOAL_ID,
    goalTitle: 'v18 Goal Event Journal + Evidence Recorder',
    baseline: V18_BASELINE,
    tasks: V18_TASKS
  }),
  [V19_GOAL_RUNBOOK_GOAL_ID]: Object.freeze({
    goalId: V19_GOAL_RUNBOOK_GOAL_ID,
    goalTitle: 'Goal Runbook + Next Action Control Center',
    baseline: V19_BASELINE,
    releaseTarget: 'v19',
    tasks: V19_TASKS
  })
});

const DEFAULT_RELEASE_GATES = Object.freeze(Object.fromEntries(
  GOAL_PROGRESS_RELEASE_GATE_IDS.map((gateId) => [gateId, 'unknown'])
));
const RELEASE_GATE_EVENT_IDS = Object.freeze({
  'release.pnpm-check': 'pnpmCheck',
  'release.pnpm-test': 'pnpmTest',
  'release.workbench-build': 'workbenchBuild',
  'release.mutation-gate': 'mutationGate',
  'release.audit-high': 'auditHigh',
  'release.diff-check': 'diffCheck',
  'release.mcas-doctor': 'mcasDoctor',
  'release.docs-updated': 'docsUpdated',
  'release.tag-evidence': 'tagEvidence'
});

export function validateGoalProgressLedgerContract(ledger) {
  const errors = [];

  if (!isPlainObject(ledger)) {
    return {
      ok: false,
      errors: ['ledger must be a plain object']
    };
  }

  for (const field of [
    'contractName',
    'contractVersion',
    'goalId',
    'goalTitle',
    'baseline',
    'summary',
    'tasks',
    'releaseGates',
    'blockers',
    'nextActions',
    'safety'
  ]) {
    if (!Object.hasOwn(ledger, field)) {
      errors.push(`${field} is required`);
    }
  }

  requireExact(errors, ledger.contractName, 'contractName', GOAL_PROGRESS_LEDGER_CONTRACT_NAME);
  requireExact(errors, ledger.contractVersion, 'contractVersion', GOAL_PROGRESS_LEDGER_CONTRACT_VERSION);
  requireNonEmptyString(errors, ledger.goalId, 'goalId');
  requireNonEmptyString(errors, ledger.goalTitle, 'goalTitle');
  validateBaseline(errors, ledger.baseline);
  validateSummary(errors, ledger.summary);
  validateTasks(errors, ledger.tasks);
  validateReleaseGates(errors, ledger.releaseGates);
  validateBlockers(errors, ledger.blockers, 'blockers');
  validateNextActions(errors, ledger.nextActions);
  validateSafety(errors, ledger.safety);

  const explicitReleaseReadySource = hasExplicitReleaseReadyEventSource(ledger);

  if (ledger.summary?.releaseReady === true && !allReleaseGatesPassed(ledger.releaseGates) && !explicitReleaseReadySource) {
    errors.push('summary.releaseReady requires all release gates to be passed');
  }

  if (Array.isArray(ledger.tasks) && ledger.tasks.some((task) => task?.status === 'release-ready') && !allReleaseGatesPassed(ledger.releaseGates) && !explicitReleaseReadySource) {
    errors.push('tasks with release-ready status require all release gates to be passed');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function assertGoalProgressLedgerContract(ledger) {
  const result = validateGoalProgressLedgerContract(ledger);

  if (!result.ok) {
    throw new Error(`Invalid goal progress ledger contract: ${result.errors.join('; ')}`);
  }

  return ledger;
}

export async function buildGoalProgressLedger({
  stateDir = '.symphony',
  goalId = 'latest',
  generatedAt = new Date().toISOString()
} = {}) {
  const resolvedGoalId = resolveGoalId(goalId);

  if (resolvedGoalId === null) {
    return null;
  }

  const goalTemplate = getGoalTemplate(resolvedGoalId);
  const state = await readGoalProgressState({ stateDir, goalId: resolvedGoalId });
  const eventLog = await readGoalEventJournal({
    stateDir,
    goalId: resolvedGoalId,
    goalTitle: goalTemplate.goalTitle,
    baseline: goalTemplate.baseline
  });
  const ledger = eventLog.events.length > 0
    ? buildLedgerFromEventLog({
      state,
      eventLog,
      goalTemplate,
      generatedAt
    })
    : buildLedgerFromState({
      state: noEventStateForGoal({
        state,
        goalId: resolvedGoalId
      }),
      goalTemplate,
      generatedAt,
      templateStatusSource: 'v17-template-no-events'
    });

  return assertGoalProgressLedgerContract(ledger);
}

export function listRegisteredGoals() {
  return [{
    goalId: DEFAULT_GOAL_PROGRESS_GOAL_ID,
    goalTitle: 'v17 Read-only Goal Progress Ledger and Console Contract Hardening',
    contractName: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
    contractVersion: GOAL_PROGRESS_LEDGER_CONTRACT_VERSION,
    baseline: structuredClone(getGoalTemplate(DEFAULT_GOAL_PROGRESS_GOAL_ID).baseline),
    taskCount: DEFAULT_TASKS.length,
    readOnly: true
  }];
}

export function getGoalProgressTemplate(goalId) {
  if (!Object.hasOwn(GOAL_PROGRESS_TEMPLATES, goalId)) {
    return null;
  }

  return structuredClone(GOAL_PROGRESS_TEMPLATES[goalId]);
}

export function renderGoalProgressText(ledger) {
  const lines = [
    `Goal: ${ledger.goalTitle}`,
    `Goal id: ${ledger.goalId}`,
    `Baseline: ${ledger.baseline.tag}${ledger.baseline.commit ? ` (${ledger.baseline.commit})` : ''}`,
    `Progress: ${ledger.summary.completedTasks}/${ledger.summary.totalTasks} completed, ${ledger.summary.needsReviewTasks} needs review, ${ledger.summary.needsRevisionTasks} needs revision, ${ledger.summary.blockedTasks} blocked`,
    `Release ready: ${ledger.summary.releaseReady ? 'yes' : 'no'}`,
    '',
    'Tasks:'
  ];

  for (const task of ledger.tasks) {
    lines.push(`- ${task.taskId} ${task.status.padEnd(14)} ${task.title}`);
  }

  lines.push('', 'Blockers:');

  if (ledger.blockers.length === 0) {
    lines.push('- none');
  } else {
    for (const blocker of ledger.blockers) {
      lines.push(`- ${blocker.reason}`);
    }
  }

  lines.push('', 'Next:');

  if (ledger.nextActions.length === 0) {
    lines.push('- none');
  } else {
    for (const action of ledger.nextActions) {
      lines.push(`- copy-only: ${action.command}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

export function renderGoalProgressMarkdown(ledger) {
  const lines = [
    `# ${ledger.goalTitle}`,
    '',
    `- Goal id: \`${ledger.goalId}\``,
    `- Baseline: \`${ledger.baseline.tag}\``,
    `- Progress: ${ledger.summary.completedTasks}/${ledger.summary.totalTasks} completed; ${ledger.summary.blockedTasks} blocked; release ready: ${ledger.summary.releaseReady ? 'yes' : 'no'}`,
    '',
    '| Task | Status | Review | Worker evidence | Review evidence | Main verification |',
    '|---|---|---|---|---|---|'
  ];

  for (const task of ledger.tasks) {
    lines.push([
      task.taskId,
      task.status,
      task.reviewVerdict ?? 'missing',
      task.workerEvidenceRef ?? 'missing',
      task.reviewEvidenceRef ?? 'missing',
      task.mainVerificationRef ?? 'missing'
    ].map((value) => String(value).replaceAll('|', '\\|')).join(' | ').replace(/^/u, '| ').replace(/$/u, ' |'));
  }

  lines.push('', '## Blockers');

  if (ledger.blockers.length === 0) {
    lines.push('- none');
  } else {
    for (const blocker of ledger.blockers) {
      lines.push(`- ${blocker.reason}`);
    }
  }

  lines.push('', '## Release Gates');

  for (const [gate, status] of Object.entries(ledger.releaseGates)) {
    lines.push(`- ${gate}: ${status}`);
  }

  lines.push('', '## Next Copy-only Commands');

  if (ledger.nextActions.length === 0) {
    lines.push('- none');
  } else {
    for (const action of ledger.nextActions) {
      lines.push(`- ${action.command}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function resolveGoalId(goalId) {
  const resolved = goalId === undefined || goalId === null || goalId === 'latest'
    ? DEFAULT_GOAL_PROGRESS_GOAL_ID
    : goalId;

  if (!isSafeGoalId(resolved)) {
    return null;
  }

  if (!Object.hasOwn(GOAL_PROGRESS_TEMPLATES, resolved)) {
    return null;
  }

  return resolved;
}

function getGoalTemplate(goalId) {
  return GOAL_PROGRESS_TEMPLATES[goalId] ?? GOAL_PROGRESS_TEMPLATES[DEFAULT_GOAL_PROGRESS_GOAL_ID];
}

function noEventStateForGoal({ state, goalId }) {
  if (goalId !== V18_GOAL_EVENT_JOURNAL_GOAL_ID || !isPlainObject(state)) {
    return state;
  }

  return {
    ...(Object.hasOwn(state, 'goalTitle') ? { goalTitle: state.goalTitle } : {}),
    ...(Object.hasOwn(state, 'baseline') ? { baseline: state.baseline } : {}),
    ...(Object.hasOwn(state, 'nextActions') ? { nextActions: state.nextActions } : {})
  };
}

async function readGoalProgressState({ stateDir, goalId }) {
  try {
    const path = join(stateDir, 'goals', `${goalId}.json`);
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

function buildLedgerFromState({
  state,
  goalTemplate = getGoalTemplate(DEFAULT_GOAL_PROGRESS_GOAL_ID),
  generatedAt,
  templateStatusSource = 'registered-goal-template'
}) {
  const stateTasks = new Map(
    (Array.isArray(state?.tasks) ? state.tasks : [])
      .filter((task) => isPlainObject(task) && isNonEmptyString(task.taskId))
      .map((task) => [task.taskId, task])
  );
  const tasks = goalTemplate.tasks.map((template) => buildTaskProgress({
    template,
    stateTask: stateTasks.get(template.taskId),
    templateStatusSource
  }));
  const releaseGates = {
    ...DEFAULT_RELEASE_GATES,
    ...filterReleaseGateStatuses(state?.releaseGates)
  };
  const releaseReady = allReleaseGatesPassed(releaseGates) && isNonEmptyString(state?.releaseEvidenceRef);
  const releaseReadyTasks = releaseReady
    ? tasks.map((task) => task.status === 'main-verified' ? { ...task, status: 'release-ready' } : task)
    : tasks;
  const blockers = [
    ...collectTaskBlockers(releaseReadyTasks),
    ...normalizeBlockers(state?.blockers, 'blockers')
  ];
  const completedTasks = releaseReadyTasks.filter((task) => [
    'approved',
    'merged-to-main',
    'main-verified',
    'release-ready'
  ].includes(task.status)).length;
  const nextActions = normalizeNextActions(state?.nextActions);

  return {
    contractName: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
    contractVersion: GOAL_PROGRESS_LEDGER_CONTRACT_VERSION,
    goalId: goalTemplate.goalId,
    goalTitle: state?.goalTitle ?? goalTemplate.goalTitle,
    generatedAt,
    baseline: {
      ...structuredClone(goalTemplate.baseline),
      ...(isPlainObject(state?.baseline) ? compactBaseline(state.baseline) : {})
    },
    summary: {
      totalTasks: releaseReadyTasks.length,
      completedTasks,
      blockedTasks: releaseReadyTasks.filter((task) => task.status === 'blocked').length,
      needsReviewTasks: releaseReadyTasks.filter((task) => task.status === 'needs-review').length,
      needsRevisionTasks: releaseReadyTasks.filter((task) => task.status === 'needs-revision').length,
      releaseReady
    },
    tasks: releaseReadyTasks,
    releaseGates,
    blockers,
    nextActions: nextActions.length > 0 ? nextActions : defaultNextActions(releaseReadyTasks),
    safety: {
      readOnly: true,
      copyOnly: true,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false
    }
  };
}

function buildLedgerFromEventLog({
  state,
  eventLog,
  goalTemplate,
  generatedAt
}) {
  const stateTasks = new Map(
    (Array.isArray(state?.tasks) ? state.tasks : [])
      .filter((task) => isPlainObject(task) && isNonEmptyString(task.taskId))
      .map((task) => [task.taskId, task])
  );
  const taskTemplates = buildEventTaskTemplates({
    goalTemplate,
    stateTasks,
    events: eventLog.events
  });
  const taskStates = new Map(
    taskTemplates.map((template) => [
      template.taskId,
      initializeEventTaskState({
        template,
        stateTask: stateTasks.get(template.taskId)
      })
    ])
  );
  const releaseState = {
    releaseGates: structuredClone(DEFAULT_RELEASE_GATES),
    readyDeclared: false,
    readySource: null
  };

  for (const event of eventLog.events) {
    applyReleaseEvent({
      event,
      releaseState
    });
    applyTaskEvent({
      event,
      taskStates,
      taskTemplates
    });
  }

  const releaseReady = releaseState.readyDeclared;
  const releaseReadySource = releaseState.readySource ?? 'goal-event-log.v1';
  const tasks = taskTemplates.map((template) => {
    const taskProgress = buildTaskProgressFromEventState({
      template,
      stateTask: stateTasks.get(template.taskId),
      taskState: taskStates.get(template.taskId)
    });

    if (releaseReady && taskProgress.status === 'main-verified') {
      return {
        ...taskProgress,
        status: 'release-ready',
        statusSource: releaseReadySource
      };
    }

    return taskProgress;
  });
  const blockers = collectTaskBlockers(tasks);
  const completedTasks = tasks.filter((task) => [
    'approved',
    'merged-to-main',
    'main-verified',
    'release-ready'
  ].includes(task.status)).length;
  const nextActions = normalizeNextActions(state?.nextActions);

  return {
    contractName: GOAL_PROGRESS_LEDGER_CONTRACT_NAME,
    contractVersion: GOAL_PROGRESS_LEDGER_CONTRACT_VERSION,
    goalId: goalTemplate.goalId,
    goalTitle: state?.goalTitle ?? eventLog.goalTitle ?? goalTemplate.goalTitle,
    generatedAt,
    baseline: {
      ...structuredClone(goalTemplate.baseline),
      ...(isPlainObject(eventLog.baseline) ? compactBaseline(eventLog.baseline) : {}),
      ...(isPlainObject(state?.baseline) ? compactBaseline(state.baseline) : {})
    },
    summary: {
      totalTasks: tasks.length,
      completedTasks,
      blockedTasks: tasks.filter((task) => task.status === 'blocked').length,
      needsReviewTasks: tasks.filter((task) => task.status === 'needs-review').length,
      needsRevisionTasks: tasks.filter((task) => task.status === 'needs-revision').length,
      releaseReady,
      releaseReadySource: releaseReady ? releaseReadySource : null
    },
    tasks,
    releaseGates: releaseState.releaseGates,
    blockers,
    nextActions: nextActions.length > 0 ? nextActions : defaultNextActions(tasks),
    safety: {
      readOnly: true,
      copyOnly: true,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false
    }
  };
}

function buildEventTaskTemplates({ goalTemplate, stateTasks, events }) {
  const templates = new Map(goalTemplate.tasks.map((template) => [template.taskId, template]));

  for (const event of events) {
    if (!isTaskEventId(event.taskId) || templates.has(event.taskId)) {
      continue;
    }

    const stateTask = stateTasks.get(event.taskId);

    templates.set(event.taskId, {
      taskId: event.taskId,
      title: stateTask?.title ?? event.taskId,
      branch: stateTask?.branch ?? event.branch ?? null,
      nextCopyOnlyCommand: stateTask?.nextCopyOnlyCommand ?? `symphony goal-status --goal ${goalTemplate.goalId}`
    });
  }

  return [...templates.values()];
}

function initializeEventTaskState({ template, stateTask }) {
  return {
    status: 'planned',
    statusSource: 'v17-template-no-events',
    branch: stateTask?.branch ?? template.branch ?? null,
    commit: stringOrNull(stateTask?.commit),
    workerEvidenceRef: null,
    reviewEvidenceRef: null,
    reviewVerdict: null,
    mainVerificationRef: null,
    blockers: new Map()
  };
}

function applyTaskEvent({ event, taskStates, taskTemplates }) {
  if (!isTaskEventId(event.taskId)) {
    return;
  }

  if (!taskStates.has(event.taskId)) {
    const template = {
      taskId: event.taskId,
      title: event.taskId,
      branch: event.branch ?? null,
      nextCopyOnlyCommand: 'symphony goal-status'
    };

    taskTemplates.push(template);
    taskStates.set(event.taskId, initializeEventTaskState({ template }));
  }

  const taskState = taskStates.get(event.taskId);
  const evidenceRef = firstEvidenceRef(event);

  rememberEventLocation(taskState, event);

  switch (event.eventType) {
    case 'task.planned':
      setEventTaskStatus(taskState, 'planned', event);
      break;
    case 'worker.started':
      setEventTaskStatus(taskState, 'in-progress', event);
      break;
    case 'worker.evidence-recorded':
      taskState.workerEvidenceRef = evidenceRef;
      if (taskState.status === 'planned') {
        setEventTaskStatus(taskState, 'in-progress', event);
      }
      break;
    case 'worker.self-check-passed':
      taskState.workerEvidenceRef = evidenceRef;
      setEventTaskStatus(taskState, evidenceRef === null ? 'unknown' : 'self-checked', event);
      break;
    case 'worker.self-check-failed':
      taskState.workerEvidenceRef = evidenceRef;
      setEventTaskStatus(taskState, 'unknown', event);
      break;
    case 'reviewer.review-requested':
      setEventTaskStatus(taskState, 'needs-review', event);
      break;
    case 'reviewer.approved':
      taskState.reviewEvidenceRef = evidenceRef;
      taskState.reviewVerdict = evidenceRef === null ? null : 'APPROVED';
      setEventTaskStatus(taskState, evidenceRef === null ? 'unknown' : 'approved', event);
      break;
    case 'reviewer.needs-revision':
      taskState.reviewEvidenceRef = evidenceRef;
      taskState.reviewVerdict = evidenceRef === null ? null : 'NEEDS_REVISION';
      setEventTaskStatus(taskState, evidenceRef === null ? 'unknown' : 'needs-revision', event);
      break;
    case 'reviewer.blocked':
      taskState.reviewEvidenceRef = evidenceRef;
      openEventBlocker(taskState, event);
      break;
    case 'main.merged':
      setEventTaskStatus(taskState, 'merged-to-main', event);
      break;
    case 'main.verification-passed':
      taskState.mainVerificationRef = evidenceRef;
      setEventTaskStatus(taskState, evidenceRef === null ? 'unknown' : 'main-verified', event);
      break;
    case 'main.verification-failed':
      taskState.mainVerificationRef = evidenceRef;
      setEventTaskStatus(taskState, 'unknown', event);
      break;
    case 'blocker.opened':
      openEventBlocker(taskState, event);
      break;
    case 'blocker.resolved':
      resolveEventBlocker(taskState, event);
      break;
    default:
      break;
  }
}

function applyReleaseEvent({ event, releaseState }) {
  if (event.eventType === 'release.gate-passed' || event.eventType === 'release.gate-failed') {
    const gateId = resolveReleaseGateId(event.gate);

    if (gateId !== null) {
      releaseState.releaseGates[gateId] = event.eventType === 'release.gate-passed' ? 'passed' : 'failed';
    }

    return;
  }

  if (event.eventType === 'release.ready-declared') {
    releaseState.readyDeclared = true;
    releaseState.readySource = goalEventStatusSource(event);
  }
}

function buildTaskProgressFromEventState({ template, stateTask, taskState }) {
  const rawBlockers = [...taskState.blockers.values()];
  const blockers = rawBlockers.map(({ statusSource, ...blocker }) => blocker);
  const latestBlockerSource = rawBlockers.at(-1)?.statusSource ?? taskState.statusSource;

  return {
    taskId: template.taskId,
    title: stateTask?.title ?? template.title,
    status: blockers.length > 0 ? 'blocked' : taskState.status,
    statusSource: blockers.length > 0 ? latestBlockerSource : taskState.statusSource,
    branch: taskState.branch ?? template.branch,
    commit: taskState.commit,
    workerEvidenceRef: taskState.workerEvidenceRef,
    reviewEvidenceRef: taskState.reviewEvidenceRef,
    reviewVerdict: taskState.reviewVerdict,
    mainVerificationRef: taskState.mainVerificationRef,
    blockers,
    nextCopyOnlyCommand: stateTask?.nextCopyOnlyCommand ?? template.nextCopyOnlyCommand
  };
}

function setEventTaskStatus(taskState, status, event) {
  taskState.status = status;
  taskState.statusSource = goalEventStatusSource(event);
}

function rememberEventLocation(taskState, event) {
  if (isNonEmptyString(event.branch)) {
    taskState.branch = event.branch;
  }

  if (isNonEmptyString(event.commit)) {
    taskState.commit = event.commit;
  }
}

function openEventBlocker(taskState, event) {
  const blocker = normalizeEventBlocker(event);

  taskState.blockers.set(blocker.id, blocker);
}

function resolveEventBlocker(taskState, event) {
  const blockerId = eventBlockerId(event);

  if (blockerId !== null) {
    taskState.blockers.delete(blockerId);
  }
}

function normalizeEventBlocker(event) {
  const blocker = isPlainObject(event.blocker) ? event.blocker : {};
  const id = eventBlockerId(event) ?? `event.${event.eventId}`;
  const reason = isNonEmptyString(blocker.reason) ? blocker.reason : event.statement;
  const severity = ['info', 'warning', 'error'].includes(blocker.severity) ? blocker.severity : 'warning';

  return {
    id,
    reason,
    severity,
    statusSource: goalEventStatusSource(event)
  };
}

function eventBlockerId(event) {
  return isPlainObject(event.blocker) && isNonEmptyString(event.blocker.id)
    ? event.blocker.id
    : null;
}

function firstEvidenceRef(event) {
  if (!Array.isArray(event.evidenceRefs)) {
    return null;
  }

  const evidenceRef = event.evidenceRefs.find((entry) => isPlainObject(entry) && isNonEmptyString(entry.ref));

  return evidenceRef?.ref ?? null;
}

function resolveReleaseGateId(gate) {
  if (!isPlainObject(gate)) {
    return null;
  }

  const rawGateId = gate.id ?? gate.name;

  if (!isNonEmptyString(rawGateId)) {
    return null;
  }

  if (GOAL_PROGRESS_RELEASE_GATE_IDS.includes(rawGateId)) {
    return rawGateId;
  }

  return RELEASE_GATE_EVENT_IDS[rawGateId] ?? null;
}

function goalEventStatusSource(event) {
  return `goal-event-log.v1:${event.eventId}`;
}

function isTaskEventId(taskId) {
  return isNonEmptyString(taskId) && taskId !== 'release' && taskId !== 'planning';
}

function buildTaskProgress({ template, stateTask, templateStatusSource = 'registered-goal-template' }) {
  const workerEvidenceRef = stringOrNull(stateTask?.workerEvidenceRef);
  const reviewEvidenceRef = stringOrNull(stateTask?.reviewEvidenceRef);
  const mainVerificationRef = stringOrNull(stateTask?.mainVerificationRef);
  const rawReviewVerdict = GOAL_PROGRESS_REVIEW_VERDICTS.includes(stateTask?.reviewVerdict)
    ? stateTask.reviewVerdict
    : null;
  const reviewVerdict = reviewEvidenceRef === null ? null : rawReviewVerdict;
  const blockers = normalizeBlockers(stateTask?.blockers, `tasks.${template.taskId}.blockers`);
  const requestedStatus = GOAL_PROGRESS_TASK_STATUSES.includes(stateTask?.status)
    ? stateTask.status
    : null;
  const status = supportedStatus({
    requestedStatus,
    workerEvidenceRef,
    reviewEvidenceRef,
    mainVerificationRef,
    reviewVerdict,
    blockers
  });

  return {
    taskId: template.taskId,
    title: stateTask?.title ?? template.title,
    status,
    statusSource: stateTask?.statusSource ?? (stateTask ? 'registered-goal-state' : templateStatusSource),
    branch: stateTask?.branch ?? template.branch,
    commit: stringOrNull(stateTask?.commit),
    workerEvidenceRef,
    reviewEvidenceRef,
    reviewVerdict,
    mainVerificationRef,
    blockers,
    nextCopyOnlyCommand: stateTask?.nextCopyOnlyCommand ?? template.nextCopyOnlyCommand
  };
}

function supportedStatus({
  requestedStatus,
  workerEvidenceRef,
  reviewEvidenceRef,
  mainVerificationRef,
  reviewVerdict,
  blockers
}) {
  if (blockers.length > 0) {
    return 'blocked';
  }

  if (reviewVerdict === 'NEEDS_REVISION' && reviewEvidenceRef !== null) {
    return 'needs-revision';
  }

  if (mainVerificationRef !== null) {
    return 'main-verified';
  }

  if (reviewVerdict === 'APPROVED' && reviewEvidenceRef !== null) {
    return 'approved';
  }

  if (requestedStatus === 'approved' || requestedStatus === 'needs-revision' || requestedStatus === 'main-verified' || requestedStatus === 'release-ready') {
    return 'unknown';
  }

  if (requestedStatus !== null) {
    return requestedStatus;
  }

  if (workerEvidenceRef !== null) {
    return 'self-checked';
  }

  return 'planned';
}

function compactBaseline(baseline) {
  return {
    ...(Object.hasOwn(baseline, 'tag') ? { tag: baseline.tag } : {}),
    ...(Object.hasOwn(baseline, 'commit') ? { commit: stringOrNull(baseline.commit) } : {}),
    ...(Object.hasOwn(baseline, 'evidenceRef') ? { evidenceRef: stringOrNull(baseline.evidenceRef) } : {})
  };
}

function filterReleaseGateStatuses(releaseGates) {
  if (!isPlainObject(releaseGates)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(releaseGates)
      .filter(([gate, status]) => (
        GOAL_PROGRESS_RELEASE_GATE_IDS.includes(gate) &&
        GOAL_PROGRESS_RELEASE_GATE_STATUSES.includes(status)
      ))
  );
}

function allReleaseGatesPassed(releaseGates) {
  return GOAL_PROGRESS_RELEASE_GATE_IDS.every((gateId) => releaseGates[gateId] === 'passed');
}

function hasExplicitReleaseReadyEventSource(ledger) {
  if (isGoalEventStatusSource(ledger.summary?.releaseReadySource)) {
    return true;
  }

  return Array.isArray(ledger.tasks) && ledger.tasks.some((task) => (
    task?.status === 'release-ready' && isGoalEventStatusSource(task.statusSource)
  ));
}

function isGoalEventStatusSource(value) {
  return typeof value === 'string' && value.startsWith('goal-event-log.v1:');
}

function collectTaskBlockers(tasks) {
  return tasks.flatMap((task) => task.blockers.map((blocker) => ({
    ...blocker,
    taskId: task.taskId
  })));
}

function defaultNextActions(tasks) {
  const nextTask = tasks.find((task) => !['approved', 'merged-to-main', 'main-verified', 'release-ready'].includes(task.status));

  if (nextTask === undefined) {
    return [];
  }

  return [{
    kind: 'copy-only-command',
    label: `Start ${nextTask.taskId}`,
    command: nextTask.nextCopyOnlyCommand
  }];
}

function validateBaseline(errors, baseline) {
  if (!isPlainObject(baseline)) {
    errors.push('baseline must be a plain object');
    return;
  }

  requireNonEmptyString(errors, baseline.tag, 'baseline.tag');
  requireNullableString(errors, baseline.commit, 'baseline.commit');
  requireNullableString(errors, baseline.evidenceRef, 'baseline.evidenceRef');
}

function validateSummary(errors, summary) {
  if (!isPlainObject(summary)) {
    errors.push('summary must be a plain object');
    return;
  }

  for (const field of ['totalTasks', 'completedTasks', 'blockedTasks', 'needsReviewTasks', 'needsRevisionTasks']) {
    requireNonNegativeInteger(errors, summary[field], `summary.${field}`);
  }

  requireBoolean(errors, summary.releaseReady, 'summary.releaseReady');
}

function validateTasks(errors, tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    errors.push('tasks must be a non-empty array');
    return;
  }

  const taskIds = new Set();

  tasks.forEach((task, index) => {
    const path = `tasks[${index}]`;

    if (!isPlainObject(task)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireNonEmptyString(errors, task.taskId, `${path}.taskId`);
    requireNonEmptyString(errors, task.title, `${path}.title`);
    requireEnum(errors, task.status, `${path}.status`, GOAL_PROGRESS_TASK_STATUSES);
    requireNonEmptyString(errors, task.statusSource, `${path}.statusSource`);
    requireNullableString(errors, task.commit, `${path}.commit`);
    requireNullableString(errors, task.workerEvidenceRef, `${path}.workerEvidenceRef`);
    requireNullableString(errors, task.reviewEvidenceRef, `${path}.reviewEvidenceRef`);
    requireNullableEnum(errors, task.reviewVerdict, `${path}.reviewVerdict`, GOAL_PROGRESS_REVIEW_VERDICTS);
    requireNullableString(errors, task.mainVerificationRef, `${path}.mainVerificationRef`);
    validateBlockers(errors, task.blockers, `${path}.blockers`);
    validateCopyOnlyCommand(errors, task.nextCopyOnlyCommand, `${path}.nextCopyOnlyCommand`);

    if (task.status === 'approved' && task.reviewEvidenceRef === null) {
      errors.push(`${path}.reviewEvidenceRef is required when status is approved`);
    }

    if (task.status === 'needs-revision' && task.reviewEvidenceRef === null) {
      errors.push(`${path}.reviewEvidenceRef is required when status is needs-revision`);
    }

    if (task.reviewVerdict === 'APPROVED' && task.reviewEvidenceRef === null) {
      errors.push(`${path}.reviewEvidenceRef is required when reviewVerdict is APPROVED`);
    }

    if (task.reviewVerdict === 'NEEDS_REVISION' && task.reviewEvidenceRef === null) {
      errors.push(`${path}.reviewEvidenceRef is required when reviewVerdict is NEEDS_REVISION`);
    }

    if (task.status === 'main-verified' && task.mainVerificationRef === null) {
      errors.push(`${path}.mainVerificationRef is required when status is main-verified`);
    }

    if (task.status === 'release-ready' && task.mainVerificationRef === null) {
      errors.push(`${path}.mainVerificationRef is required when status is release-ready`);
    }

    if (isNonEmptyString(task.taskId)) {
      if (taskIds.has(task.taskId)) {
        errors.push(`${path}.taskId must be unique`);
      }

      taskIds.add(task.taskId);
    }
  });
}

function validateReleaseGates(errors, releaseGates) {
  if (!isPlainObject(releaseGates)) {
    errors.push('releaseGates must be a plain object');
    return;
  }

  for (const gateId of GOAL_PROGRESS_RELEASE_GATE_IDS) {
    if (!Object.hasOwn(releaseGates, gateId)) {
      errors.push(`releaseGates.${gateId} is required`);
      continue;
    }

    requireEnum(errors, releaseGates[gateId], `releaseGates.${gateId}`, GOAL_PROGRESS_RELEASE_GATE_STATUSES);
  }
}

function validateBlockers(errors, blockers, path) {
  if (!Array.isArray(blockers)) {
    errors.push(`${path} must be an array`);
    return;
  }

  blockers.forEach((blocker, index) => {
    const blockerPath = `${path}[${index}]`;

    if (!isPlainObject(blocker)) {
      errors.push(`${blockerPath} must be a plain object`);
      return;
    }

    requireNonEmptyString(errors, blocker.reason, `${blockerPath}.reason`);

    if (Object.hasOwn(blocker, 'id')) {
      requireNonEmptyString(errors, blocker.id, `${blockerPath}.id`);
    }

    if (Object.hasOwn(blocker, 'severity')) {
      requireEnum(errors, blocker.severity, `${blockerPath}.severity`, ['info', 'warning', 'error']);
    }
  });
}

function validateNextActions(errors, nextActions) {
  if (!Array.isArray(nextActions)) {
    errors.push('nextActions must be an array');
    return;
  }

  nextActions.forEach((action, index) => {
    const path = `nextActions[${index}]`;

    if (!isPlainObject(action)) {
      errors.push(`${path} must be a plain object`);
      return;
    }

    requireExact(errors, action.kind, `${path}.kind`, 'copy-only-command');
    requireNonEmptyString(errors, action.label, `${path}.label`);
    validateCopyOnlyCommand(errors, action.command, `${path}.command`);
  });
}

function validateSafety(errors, safety) {
  if (!isPlainObject(safety)) {
    errors.push('safety must be a plain object');
    return;
  }

  requireExact(errors, safety.readOnly, 'safety.readOnly', true);
  requireExact(errors, safety.copyOnly, 'safety.copyOnly', true);
  requireExact(errors, safety.browserExecutionAvailable, 'safety.browserExecutionAvailable', false);
  requireExact(errors, safety.modelInvocationAvailable, 'safety.modelInvocationAvailable', false);
}

function validateCopyOnlyCommand(errors, command, path) {
  requireNonEmptyString(errors, command, path);

  if (typeof command !== 'string') {
    return;
  }

  if (/\b(POST|PUT|PATCH|DELETE)\b/u.test(command)) {
    errors.push(`${path} must not contain write HTTP methods`);
  }

  if (/\b(curl|fetch)\b.*\/api\//iu.test(command)) {
    errors.push(`${path} must not invoke API routes`);
  }
}

function normalizeBlockers(blockers, fallbackPath) {
  if (!Array.isArray(blockers)) {
    return [];
  }

  return blockers
    .map((blocker, index) => {
      if (typeof blocker === 'string' && blocker.trim() !== '') {
        return {
          id: `${fallbackPath}.${index + 1}`,
          reason: blocker,
          severity: 'warning'
        };
      }

      if (!isPlainObject(blocker) || !isNonEmptyString(blocker.reason)) {
        return null;
      }

      return {
        id: blocker.id ?? `${fallbackPath}.${index + 1}`,
        reason: blocker.reason,
        severity: GOAL_PROGRESS_RELEASE_GATE_STATUSES.includes(blocker.severity) ? blocker.severity : blocker.severity ?? 'warning'
      };
    })
    .filter((blocker) => blocker !== null);
}

function normalizeNextActions(nextActions) {
  if (!Array.isArray(nextActions)) {
    return [];
  }

  return nextActions
    .filter((action) => (
      isPlainObject(action) &&
      action.kind === 'copy-only-command' &&
      isNonEmptyString(action.label) &&
      isNonEmptyString(action.command) &&
      !/\b(POST|PUT|PATCH|DELETE)\b/u.test(action.command) &&
      !/\b(curl|fetch)\b.*\/api\//iu.test(action.command)
    ))
    .map((action) => ({
      kind: 'copy-only-command',
      label: action.label,
      command: action.command
    }));
}

function stringOrNull(value) {
  return isNonEmptyString(value) ? value : null;
}

function isSafeGoalId(goalId) {
  return isNonEmptyString(goalId) &&
    /^[A-Za-z0-9._:-]+$/u.test(goalId) &&
    !goalId.includes('..') &&
    !goalId.includes('/') &&
    !goalId.includes('\\');
}

function requireExact(errors, value, path, expected) {
  if (value !== expected) {
    errors.push(`${path} must be ${String(expected)}`);
  }
}

function requireNonEmptyString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function requireNullableString(errors, value, path) {
  if (value !== null && typeof value !== 'string') {
    errors.push(`${path} must be a string or null`);
  }
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') {
    errors.push(`${path} must be a boolean`);
  }
}

function requireNonNegativeInteger(errors, value, path) {
  if (!Number.isInteger(value) || value < 0) {
    errors.push(`${path} must be a non-negative integer`);
  }
}

function requireEnum(errors, value, path, values) {
  if (!values.includes(value)) {
    errors.push(`${path} must be one of ${values.join(', ')}`);
  }
}

function requireNullableEnum(errors, value, path, values) {
  if (value !== null && !values.includes(value)) {
    errors.push(`${path} must be null or one of ${values.join(', ')}`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}
