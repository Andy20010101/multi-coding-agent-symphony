import {
  GOAL_PROGRESS_RELEASE_GATE_IDS,
  GOAL_PROGRESS_RELEASE_GATE_STATUSES
} from './goal-progress-ledger.js';
import {
  GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
  GOAL_CLOSEOUT_REPORT_CONTRACT_VERSION,
  assertGoalCloseoutReportContract
} from './goal-runbook-contracts.js';
import {
  GoalRunbookContextError,
  buildGoalLedgerForRunbook,
  loadGoalRunbookContext,
  readGoalEventLogForRunbook
} from './goal-runbook-context.js';

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

export class GoalCloseoutReportError extends Error {
  constructor(code, message, safeDetails) {
    super(message);
    this.name = 'GoalCloseoutReportError';
    this.code = code;

    if (safeDetails !== undefined) {
      this.safeDetails = safeDetails;
    }
  }
}

export async function buildGoalCloseoutReport({
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
      throw new GoalCloseoutReportError(
        error.code,
        error.message,
        error.safeDetails
      );
    }

    throw error;
  }

  if (context === null) {
    throw new GoalCloseoutReportError(
      'missing-managed-runbook',
      `No managed goal-runbook.v1 state is registered for ${goalId}.`
    );
  }

  let eventLog;
  let ledger;

  try {
    eventLog = await readGoalEventLogForRunbook({
      stateDir,
      runbook: context.runbook
    });
    ledger = await buildGoalLedgerForRunbook({
      stateDir,
      runbook: context.runbook,
      eventLog,
      generatedAt
    });
  } catch (error) {
    throw new GoalCloseoutReportError(
      error?.code ?? 'goal-closeout-read-failed',
      'Goal closeout report could not read managed runbook evidence.',
      { reason: safeErrorMessage(error) }
    );
  }

  const taskMap = new Map(ledger.tasks.map((task) => [task.taskId, task]));
  const missing = missingCloseoutItems({
    runbook: context.runbook,
    ledger,
    taskMap
  });
  const summary = closeoutSummary({
    runbook: context.runbook,
    ledger,
    taskMap
  });
  const report = {
    contractName: GOAL_CLOSEOUT_REPORT_CONTRACT_NAME,
    contractVersion: GOAL_CLOSEOUT_REPORT_CONTRACT_VERSION,
    goalId: context.runbook.goalId,
    generatedAt,
    summary,
    missing,
    releaseGates: closeoutReleaseGates({
      runbook: context.runbook,
      ledger
    }),
    nextAction: `symphony goal next --goal ${context.runbook.goalId}`,
    safety: {
      readOnly: true,
      copyOnly: true,
      workbenchWriteAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      writesInDryRun: false,
      confirmRequiredForWrites: true,
      releaseReadyRequiresEvidence: true
    }
  };

  return assertGoalCloseoutReportContract(report);
}

export function renderGoalCloseoutReportMarkdown(report) {
  const lines = [
    '# Goal Closeout',
    '',
    `- Goal: \`${report.goalId}\``,
    `- Tasks: ${report.summary.totalTasks}`,
    `- Worker evidence complete: ${yesNo(report.summary.workerEvidenceComplete)}`,
    `- Review evidence complete: ${yesNo(report.summary.reviewEvidenceComplete)}`,
    `- Main verification complete: ${yesNo(report.summary.mainVerificationComplete)}`,
    `- Release ready: ${yesNo(report.summary.releaseReady)}`,
    `- Release ready source: ${report.summary.releaseReadySource ?? 'missing'}`,
    '',
    '## Missing Evidence'
  ];

  const missingEvidence = report.missing.filter((item) => item.kind !== 'release-gate');

  if (missingEvidence.length === 0) {
    lines.push('- none');
  } else {
    for (const item of missingEvidence) {
      lines.push(`- ${item.kind}: ${item.taskId ?? 'release'} expects ${item.expectedEvent}`);
    }
  }

  lines.push('', '## Release Gate Gaps');

  const releaseGateGaps = report.missing.filter((item) => item.kind === 'release-gate');

  if (releaseGateGaps.length === 0) {
    lines.push('- none');
  } else {
    for (const item of releaseGateGaps) {
      lines.push(`- ${item.gateId}: ${item.status}`);
    }
  }

  lines.push('', '## Release Gates');

  for (const gateId of GOAL_PROGRESS_RELEASE_GATE_IDS) {
    lines.push(`- ${gateId}: ${report.releaseGates[gateId]}`);
  }

  lines.push('', `Next: \`${report.nextAction}\``);

  return `${lines.join('\n')}\n`;
}

function closeoutSummary({ runbook, ledger, taskMap }) {
  const workerEvidenceComplete = runbook.tasks.every((task) => hasWorkerEvidence(taskMap.get(task.taskId)));
  const reviewEvidenceComplete = runbook.tasks.every((task) => hasReviewApproval(taskMap.get(task.taskId)));
  const mainVerificationComplete = runbook.tasks.every((task) => hasMainVerification(taskMap.get(task.taskId)));
  const releaseReadySource = explicitReleaseReadySource(ledger);
  const releaseReady = workerEvidenceComplete &&
    reviewEvidenceComplete &&
    mainVerificationComplete &&
    allRunbookReleaseGatesPassed({
      runbook,
      ledger
    }) &&
    ledger.summary?.releaseReady === true &&
    releaseReadySource !== null;

  return {
    totalTasks: runbook.tasks.length,
    workerEvidenceComplete,
    reviewEvidenceComplete,
    mainVerificationComplete,
    releaseReady,
    releaseReadySource: releaseReady ? releaseReadySource : null
  };
}

function missingCloseoutItems({ runbook, ledger, taskMap }) {
  const missing = [];

  for (const runbookTask of runbook.tasks) {
    const ledgerTask = taskMap.get(runbookTask.taskId);

    if (!hasWorkerEvidence(ledgerTask)) {
      missing.push({
        kind: 'worker-evidence',
        taskId: runbookTask.taskId,
        expectedEvent: expectedEvidenceEvent(runbookTask, 'worker', 'worker.evidence-recorded')
      });
    }

    if (!hasReviewApproval(ledgerTask)) {
      missing.push({
        kind: 'review-evidence',
        taskId: runbookTask.taskId,
        expectedEvent: 'reviewer.approved'
      });
    }

    if (!hasMainVerification(ledgerTask)) {
      missing.push({
        kind: 'main-verification',
        taskId: runbookTask.taskId,
        expectedEvent: expectedEvidenceEvent(runbookTask, 'mainVerifier', 'main.verification-passed')
      });
    }
  }

  for (const gate of runbook.releaseGates) {
    const ledgerGateId = RELEASE_GATE_TO_LEDGER_ID[gate];
    const status = releaseGateStatus({
      gate,
      ledgerGateId,
      ledger
    });

    if (status !== 'passed') {
      missing.push({
        kind: 'release-gate',
        taskId: null,
        expectedEvent: 'release.gate-passed',
        gate,
        gateId: ledgerGateId,
        status
      });
    }
  }

  if (missing.length === 0 && explicitReleaseReadySource(ledger) === null) {
    missing.push({
      kind: 'release-ready',
      taskId: null,
      expectedEvent: 'release.ready-declared'
    });
  }

  return missing;
}

function closeoutReleaseGates({ runbook, ledger }) {
  const releaseGates = Object.fromEntries(
    GOAL_PROGRESS_RELEASE_GATE_IDS.map((gateId) => [gateId, normalizedGateStatus(ledger.releaseGates?.[gateId])])
  );

  if (runbook.releaseGates.includes('release.tag-evidence') && releaseGates.tagEvidence === 'unknown') {
    releaseGates.tagEvidence = 'missing';
  }

  return releaseGates;
}

function releaseGateStatus({ gate, ledgerGateId, ledger }) {
  if (!GOAL_PROGRESS_RELEASE_GATE_IDS.includes(ledgerGateId)) {
    return 'missing';
  }

  if (gate === 'release.tag-evidence' && ledger.releaseGates?.[ledgerGateId] === 'unknown') {
    return 'missing';
  }

  return normalizedGateStatus(ledger.releaseGates?.[ledgerGateId]);
}

function normalizedGateStatus(status) {
  return GOAL_PROGRESS_RELEASE_GATE_STATUSES.includes(status) ? status : 'unknown';
}

function hasWorkerEvidence(task) {
  return typeof task?.workerEvidenceRef === 'string' && task.workerEvidenceRef.trim() !== '';
}

function hasReviewApproval(task) {
  return task?.reviewVerdict === 'APPROVED' &&
    typeof task.reviewEvidenceRef === 'string' &&
    task.reviewEvidenceRef.trim() !== '';
}

function hasMainVerification(task) {
  return ['main-verified', 'release-ready'].includes(task?.status) &&
    typeof task.mainVerificationRef === 'string' &&
    task.mainVerificationRef.trim() !== '';
}

function expectedEvidenceEvent(runbookTask, key, fallback) {
  const expected = runbookTask.expectedEvidence?.[key];

  if (typeof expected === 'string') {
    return expected;
  }

  if (Array.isArray(expected) && typeof expected[0] === 'string') {
    return expected[0];
  }

  return fallback;
}

function allRunbookReleaseGatesPassed({ runbook, ledger }) {
  return runbook.releaseGates.every((gate) => {
    const ledgerGateId = RELEASE_GATE_TO_LEDGER_ID[gate];

    return GOAL_PROGRESS_RELEASE_GATE_IDS.includes(ledgerGateId) &&
      normalizedGateStatus(ledger.releaseGates?.[ledgerGateId]) === 'passed';
  });
}

function explicitReleaseReadySource(ledger) {
  const source = ledger?.summary?.releaseReadySource;

  return typeof source === 'string' && source.startsWith('goal-event-log.v1:')
    ? source
    : null;
}

function yesNo(value) {
  return value ? 'yes' : 'no';
}

function safeErrorMessage(error) {
  if (typeof error?.safeDetails?.reason === 'string') {
    return error.safeDetails.reason;
  }

  return typeof error?.message === 'string' && error.message.trim() !== ''
    ? error.message
    : 'unknown error';
}
