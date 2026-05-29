import { GOAL_PROGRESS_RELEASE_GATE_IDS } from './goal-progress-ledger.js';
import {
  GOAL_NEXT_ACTION_CONTRACT_NAME,
  GOAL_NEXT_ACTION_CONTRACT_VERSION,
  assertGoalNextActionContract,
} from './goal-runbook-contracts.js';
import {
  GoalRunbookContextError,
  buildGoalLedgerForRunbook,
  loadGoalRunbookContext,
  readGoalEventLogForRunbook
} from './goal-runbook-context.js';

const TASK_WORKER_EVIDENCE_EVENTS = Object.freeze([
  'worker.evidence-recorded',
  'worker.self-check-passed',
  'worker.self-check-failed'
]);
const TASK_REVIEW_VERDICT_EVENTS = Object.freeze([
  'reviewer.approved',
  'reviewer.needs-revision'
]);
const TASK_MAIN_VERIFICATION_EVENTS = Object.freeze([
  'main.verification-passed',
  'main.verification-failed'
]);
const RELEASE_GATE_TO_LEDGER_ID = Object.freeze({
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
const RELEASE_GATE_COMMAND_HINTS = Object.freeze({
  'release.pnpm-check': 'pnpm check',
  'release.pnpm-test': 'pnpm test',
  'release.workbench-build': 'pnpm workbench:build',
  'release.mutation-gate': 'pnpm test:mutation:gate',
  'release.audit-high': 'pnpm audit --audit-level high',
  'release.diff-check': 'git diff --check',
  'release.mcas-doctor': 'pnpm --silent mcas doctor --json',
  'release.docs-updated': 'pnpm check',
  'release.tag-evidence': 'symphony goal gate --gate release.tag-evidence --status passed --dry-run --json'
});

export async function buildGoalNextAction({
  stateDir = '.symphony',
  goalId = 'latest',
  generatedAt = new Date().toISOString()
} = {}) {
  let context;

  try {
    context = await loadGoalRunbookContext({
      stateDir,
      goalId,
      allowControlledFixtureFallback: true
    });
  } catch (error) {
    if (error instanceof GoalRunbookContextError) {
      return buildBlockedNextAction({
        goalId: goalId ?? 'latest',
        reason: safeErrorMessage(error)
      });
    }

    throw error;
  }

  if (context === null) {
    return buildMissingRunbookNextAction({
      goalId: goalId ?? 'latest',
      reason: 'No active managed goal runbook is registered.'
    });
  }

  let eventLog;

  try {
    eventLog = await readGoalEventLogForRunbook({
      stateDir,
      runbook: context.runbook
    });
  } catch (error) {
    if (isEventLogReadFailure(error)) {
      return buildBlockedNextAction({
        goalId: context.goalId,
        reason: `Goal event log cannot be resolved: ${safeErrorMessage(error)}`
      });
    }

    throw error;
  }

  let ledger;

  try {
    ledger = await buildGoalLedgerForRunbook({
      stateDir,
      runbook: context.runbook,
      eventLog,
      generatedAt
    });
  } catch (error) {
    if (isEventLogReadFailure(error)) {
      return buildBlockedNextAction({
        goalId: context.goalId,
        reason: `Goal event log cannot be resolved: ${safeErrorMessage(error)}`
      });
    }

    throw error;
  }

  if (ledger === null) {
    return buildBlockedNextAction({
      goalId: context.goalId,
      reason: `goal-progress-ledger.v1 is not available for ${context.goalId}.`
    });
  }

  return resolveGoalNextAction({
    runbook: context.runbook,
    eventLog,
    ledger
  });
}

export function resolveGoalNextAction({
  runbook,
  eventLog,
  ledger
}) {
  const ledgerTasks = new Map(
    (Array.isArray(ledger.tasks) ? ledger.tasks : [])
      .map((task) => [task.taskId, task])
  );

  if (isReleaseComplete({ eventLog, ledger })) {
    return buildCompleteNextAction({
      goalId: runbook.goalId,
      reason: 'release.ready-declared is recorded and release.tag-evidence has passed.'
    });
  }

  const blockedTask = runbook.tasks
    .map((task) => ledgerTasks.get(task.taskId))
    .find((task) => Array.isArray(task?.blockers) && task.blockers.length > 0);

  if (blockedTask !== undefined) {
    return buildBlockedNextAction({
      goalId: runbook.goalId,
      reason: `${blockedTask.taskId} has an open blocker in goal-progress-ledger.v1.`
    });
  }

  for (const runbookTask of runbook.tasks) {
    const ledgerTask = ledgerTasks.get(runbookTask.taskId) ?? buildMissingLedgerTask(runbookTask);
    const taskEvents = taskEventState(eventLog.events, runbookTask.taskId);
    const taskAction = resolveTaskNextAction({
      runbook,
      runbookTask,
      ledgerTask,
      taskEvents
    });

    if (taskAction !== null) {
      return taskAction;
    }
  }

  const missingGate = firstMissingReleaseGate({
    runbook,
    ledger
  });

  if (missingGate !== null) {
    return buildReleaseManagerNextAction({
      goalId: runbook.goalId,
      phase: 'release-gate',
      reason: `${missingGate} is not passed in goal-progress-ledger.v1.`,
      copyOnlyCommands: releaseGateCopyOnlyCommands({
        goalId: runbook.goalId,
        gate: missingGate
      }),
      allowedEvents: ['release.gate-passed', 'release.gate-failed']
    });
  }

  return buildReleaseManagerNextAction({
    goalId: runbook.goalId,
    phase: 'release-prep',
    reason: 'All runbook tasks are main-verified and release gates are passed, but release.ready-declared is missing.',
    copyOnlyCommands: [`symphony goal-status --goal ${runbook.goalId} --json`],
    allowedEvents: ['release.ready-declared']
  });
}

function resolveTaskNextAction({
  runbook,
  runbookTask,
  ledgerTask,
  taskEvents
}) {
  if (hasMainVerificationPassed({ ledgerTask, taskEvents })) {
    return null;
  }

  if (taskEvents.latestWorkerEvidence?.eventType === 'worker.self-check-failed') {
    return buildTaskNextAction({
      goalId: runbook.goalId,
      runbookTask,
      ledgerTask,
      role: 'worker',
      phase: 'implement',
      reason: `Latest worker self-check failed for ${runbookTask.taskId}.`,
      allowedEvents: workerAllowedEvents(),
      registerWith: 'symphony goal update'
    });
  }

  if (!hasWorkerEvidence({ ledgerTask, taskEvents })) {
    return buildTaskNextAction({
      goalId: runbook.goalId,
      runbookTask,
      ledgerTask,
      role: 'worker',
      phase: 'implement',
      reason: `No explicit worker evidence is recorded for ${runbookTask.taskId}.`,
      allowedEvents: workerAllowedEvents(),
      registerWith: 'symphony goal update'
    });
  }

  if (taskEvents.latestReviewVerdict?.eventType === 'reviewer.needs-revision' &&
    isEventAfter(taskEvents.latestReviewVerdict, taskEvents.latestWorkerEvidence)) {
    return buildTaskNextAction({
      goalId: runbook.goalId,
      runbookTask,
      ledgerTask,
      role: 'worker',
      phase: 'revision',
      reason: `Latest reviewer verdict for ${runbookTask.taskId} is reviewer.needs-revision.`,
      allowedEvents: workerAllowedEvents(),
      registerWith: 'symphony goal update'
    });
  }

  if (taskEvents.latestReviewVerdict === null ||
    isEventAfter(taskEvents.latestWorkerEvidence, taskEvents.latestReviewVerdict)) {
    return buildTaskNextAction({
      goalId: runbook.goalId,
      runbookTask,
      ledgerTask,
      role: 'reviewer',
      phase: 'review',
      reason: `Worker evidence exists for ${runbookTask.taskId} but reviewer verdict is missing.`,
      allowedEvents: ['reviewer.approved', 'reviewer.needs-revision'],
      registerWith: 'symphony goal review'
    });
  }

  if (taskEvents.latestReviewVerdict.eventType === 'reviewer.approved' && !hasMainVerificationPassed({ ledgerTask, taskEvents })) {
    return buildTaskNextAction({
      goalId: runbook.goalId,
      runbookTask,
      ledgerTask,
      role: 'main-verifier',
      phase: 'main-verification',
      reason: mainVerificationRequiredReason({
        taskId: runbookTask.taskId,
        taskEvents
      }),
      allowedEvents: ['main.verification-passed', 'main.verification-failed'],
      registerWith: 'symphony goal gate --gate main-verification'
    });
  }

  return null;
}

function taskEventState(events, taskId) {
  const taskEvents = events.filter((event) => event.taskId === taskId);

  return {
    latestWorkerEvidence: latestEventOfTypes(taskEvents, TASK_WORKER_EVIDENCE_EVENTS),
    latestReviewVerdict: latestEventOfTypes(taskEvents, TASK_REVIEW_VERDICT_EVENTS),
    latestMainVerification: latestEventOfTypes(taskEvents, TASK_MAIN_VERIFICATION_EVENTS)
  };
}

function latestEventOfTypes(events, eventTypes) {
  return events
    .filter((event) => eventTypes.includes(event.eventType))
    .sort((left, right) => left.sequence - right.sequence)
    .at(-1) ?? null;
}

function hasWorkerEvidence({ ledgerTask, taskEvents }) {
  return ledgerTask.workerEvidenceRef !== null || taskEvents.latestWorkerEvidence !== null;
}

function hasMainVerificationPassed({ ledgerTask, taskEvents }) {
  if (taskEvents.latestMainVerification !== null) {
    return taskEvents.latestMainVerification.eventType === 'main.verification-passed';
  }

  return ledgerTask?.status === 'main-verified' ||
    ledgerTask?.status === 'release-ready';
}

function mainVerificationRequiredReason({ taskId, taskEvents }) {
  if (taskEvents.latestMainVerification?.eventType === 'main.verification-failed') {
    return `Latest main verification failed for ${taskId}.`;
  }

  return `Reviewer approved ${taskId} but main verification is missing.`;
}

function isEventAfter(left, right) {
  if (left === null || right === null) {
    return false;
  }

  return left.sequence > right.sequence;
}

function firstMissingReleaseGate({ runbook, ledger }) {
  for (const gate of runbook.releaseGates) {
    const ledgerGateId = RELEASE_GATE_TO_LEDGER_ID[gate];

    if (!GOAL_PROGRESS_RELEASE_GATE_IDS.includes(ledgerGateId) || ledger.releaseGates[ledgerGateId] !== 'passed') {
      return gate;
    }
  }

  return null;
}

function isReleaseComplete({ eventLog, ledger }) {
  return eventLog.events.some((event) => event.eventType === 'release.ready-declared') &&
    ledger.releaseGates.tagEvidence === 'passed';
}

function buildTaskNextAction({
  goalId,
  runbookTask,
  ledgerTask,
  role,
  phase,
  reason,
  allowedEvents,
  registerWith
}) {
  return assertGoalNextActionContract(baseNextAction({
    goalId,
    status: 'action-required',
    next: {
      taskId: runbookTask.taskId,
      role,
      phase,
      reason,
      blocked: false
    },
    evidenceState: evidenceStateFromTask(ledgerTask),
    copyOnlyCommands: taskCopyOnlyCommands({
      runbookTask,
      ledgerTask,
      role
    }),
    afterCompletion: {
      registerWith,
      allowedEvents
    }
  }));
}

function buildReleaseManagerNextAction({
  goalId,
  phase,
  reason,
  copyOnlyCommands,
  allowedEvents
}) {
  return assertGoalNextActionContract(baseNextAction({
    goalId,
    status: 'action-required',
    next: {
      taskId: 'release',
      role: 'release-manager',
      phase,
      reason,
      blocked: false
    },
    evidenceState: emptyEvidenceState(),
    copyOnlyCommands,
    afterCompletion: {
      registerWith: 'symphony goal gate',
      allowedEvents
    }
  }));
}

function buildMissingRunbookNextAction({ goalId, reason }) {
  return assertGoalNextActionContract(baseNextAction({
    goalId,
    status: 'missing-runbook',
    next: null,
    evidenceState: emptyEvidenceState(),
    copyOnlyCommands: [`symphony goal init --goal ${goalId} --from-json fixtures/contracts/goal-runbook.valid.v1.json --dry-run --json`],
    afterCompletion: {
      registerWith: 'symphony goal init',
      allowedEvents: []
    },
    reason
  }));
}

function buildBlockedNextAction({ goalId, reason }) {
  return assertGoalNextActionContract(baseNextAction({
    goalId,
    status: 'blocked',
    next: null,
    evidenceState: emptyEvidenceState(),
    copyOnlyCommands: [],
    afterCompletion: {
      registerWith: 'none',
      allowedEvents: []
    },
    reason
  }));
}

function buildCompleteNextAction({ goalId, reason }) {
  return assertGoalNextActionContract(baseNextAction({
    goalId,
    status: 'complete',
    next: null,
    evidenceState: emptyEvidenceState(),
    copyOnlyCommands: [],
    afterCompletion: {
      registerWith: 'none',
      allowedEvents: []
    },
    reason
  }));
}

function baseNextAction({
  goalId,
  status,
  next,
  evidenceState,
  copyOnlyCommands,
  afterCompletion,
  reason
}) {
  return {
    contractName: GOAL_NEXT_ACTION_CONTRACT_NAME,
    contractVersion: GOAL_NEXT_ACTION_CONTRACT_VERSION,
    goalId,
    status,
    next,
    reason: reason ?? next?.reason ?? null,
    evidenceState,
    copyOnlyPrompt: {
      available: false,
      format: null,
      text: null
    },
    copyOnlyCommands,
    afterCompletion,
    safety: {
      readOnly: true,
      copyOnly: true,
      workbenchWriteAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false
    }
  };
}

function evidenceStateFromTask(task) {
  return {
    workerEvidenceRef: task?.workerEvidenceRef ?? null,
    reviewEvidenceRef: task?.reviewEvidenceRef ?? null,
    mainVerificationRef: task?.mainVerificationRef ?? null
  };
}

function emptyEvidenceState() {
  return {
    workerEvidenceRef: null,
    reviewEvidenceRef: null,
    mainVerificationRef: null
  };
}

function taskCopyOnlyCommands({
  runbookTask,
  ledgerTask,
  role
}) {
  const commands = [];

  if (role === 'worker' && typeof ledgerTask?.nextCopyOnlyCommand === 'string') {
    commands.push(ledgerTask.nextCopyOnlyCommand);
  }

  commands.push(...runbookTask.copyOnlyCommands);

  return uniqueNonEmptyStrings(commands);
}

function releaseGateCopyOnlyCommands({ goalId, gate }) {
  return uniqueNonEmptyStrings([
    RELEASE_GATE_COMMAND_HINTS[gate],
    `symphony goal-status --goal ${goalId} --json`
  ]);
}

function workerAllowedEvents() {
  return ['worker.evidence-recorded', 'worker.self-check-passed', 'worker.self-check-failed'];
}

function buildMissingLedgerTask(runbookTask) {
  return {
    taskId: runbookTask.taskId,
    title: runbookTask.title,
    status: 'planned',
    statusSource: 'goal-runbook.v1',
    branch: runbookTask.branch,
    commit: null,
    workerEvidenceRef: null,
    reviewEvidenceRef: null,
    reviewVerdict: null,
    mainVerificationRef: null,
    blockers: [],
    nextCopyOnlyCommand: `git checkout main && git pull --ff-only && git checkout -b ${runbookTask.branch}`
  };
}

function isEventLogReadFailure(error) {
  return ['goal-event-chain-invalid', 'invalid-goal-event-log', 'invalid-goal-event'].includes(error?.code);
}

function safeErrorMessage(error) {
  if (typeof error?.safeDetails?.reason === 'string') {
    return error.safeDetails.reason;
  }

  return typeof error?.message === 'string' && error.message.trim() !== ''
    ? error.message
    : 'unknown error';
}

function uniqueNonEmptyStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim() !== ''))];
}
