import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  consumeParsedResult,
  parseChildResultBlock
} from '../src/symphony/app-thread-result-protocol.js';
import {
  buildGoalRouteReconciliation,
  resolveGoalNextAction
} from '../src/symphony/goal-next-action-resolver.js';
import { validateGoalNextActionContract } from '../src/symphony/goal-runbook-contracts.js';

const GOAL_ID = 'v43-goal-supervisor-stabilization';

describe('v43 route status reconciliation', () => {
  it('does not count reviewer approval as main verification when goal-status is stale', () => {
    const eventLog = eventLogFor([
      taskEvent({
        sequence: 1,
        eventId: 'evt_task_3_worker_evidence',
        taskId: 'task-3',
        eventType: 'worker.evidence-recorded',
        evidenceRef: 'docs/plans/v43-task-3-worker-evidence-2026-06-07.md'
      }),
      taskEvent({
        sequence: 2,
        eventId: 'evt_task_3_reviewer_approved',
        taskId: 'task-3',
        eventType: 'reviewer.approved',
        phase: 'review',
        actorRole: 'reviewer',
        evidenceRef: 'docs/plans/v43-task-3-review-evidence-2026-06-07.md',
        review: { verdict: 'APPROVED' }
      })
    ]);
    const ledger = ledgerFor([{
      ...ledgerTask('task-3'),
      status: 'main-verified',
      statusSource: 'goal-progress-ledger.v1:stale-summary',
      workerEvidenceRef: 'docs/plans/v43-task-3-worker-evidence-2026-06-07.md',
      reviewEvidenceRef: 'docs/plans/v43-task-3-review-evidence-2026-06-07.md',
      reviewVerdict: 'APPROVED',
      mainVerificationRef: 'docs/plans/v43-task-3-main-verification-evidence-2026-06-07.md'
    }]);

    const nextAction = resolveGoalNextAction({
      runbook: runbookFor(['task-3']),
      eventLog,
      ledger
    });

    assertValidNextAction(nextAction);
    assert.equal(nextAction.status, 'action-required');
    assert.equal(nextAction.next.taskId, 'task-3');
    assert.equal(nextAction.next.role, 'main-verifier');
    assert.equal(nextAction.next.phase, 'main-verification');
    assert.match(nextAction.next.reason, /main verification is missing/u);
    assert.equal(nextAction.reconciliation.status, 'warning');
    assert.equal(nextAction.reconciliationWarnings[0].code, 'ledger-main-verification-without-event');
  });

  it('routes failed main verification through worker revision and fresh reviewer approval', () => {
    const runbook = runbookFor(['task-3']);
    const failedMainEvents = [
      taskEvent({
        sequence: 1,
        eventId: 'evt_worker_first',
        taskId: 'task-3',
        eventType: 'worker.evidence-recorded',
        evidenceRef: 'docs/plans/v43-task-3-worker-evidence-2026-06-07.md'
      }),
      taskEvent({
        sequence: 2,
        eventId: 'evt_review_approved_first',
        taskId: 'task-3',
        eventType: 'reviewer.approved',
        phase: 'review',
        actorRole: 'reviewer',
        evidenceRef: 'docs/plans/v43-task-3-review-evidence-2026-06-07.md',
        review: { verdict: 'APPROVED' }
      }),
      taskEvent({
        sequence: 3,
        eventId: 'evt_main_failed',
        taskId: 'task-3',
        eventType: 'main.verification-failed',
        phase: 'main-verification',
        actorRole: 'main-verifier',
        evidenceRef: 'docs/plans/v43-task-3-main-verification-evidence-2026-06-07.md'
      })
    ];

    const revisionAction = resolveGoalNextAction({
      runbook,
      eventLog: eventLogFor(failedMainEvents),
      ledger: ledgerFor([{
        ...ledgerTask('task-3'),
        status: 'unknown',
        workerEvidenceRef: 'docs/plans/v43-task-3-worker-evidence-2026-06-07.md',
        reviewEvidenceRef: 'docs/plans/v43-task-3-review-evidence-2026-06-07.md',
        reviewVerdict: 'APPROVED',
        mainVerificationRef: 'docs/plans/v43-task-3-main-verification-evidence-2026-06-07.md'
      }])
    });

    assertValidNextAction(revisionAction);
    assert.equal(revisionAction.next.role, 'worker');
    assert.equal(revisionAction.next.phase, 'revision');

    const reviewAfterRevisionAction = resolveGoalNextAction({
      runbook,
      eventLog: eventLogFor([
        ...failedMainEvents,
        taskEvent({
          sequence: 4,
          eventId: 'evt_worker_revision',
          taskId: 'task-3',
          eventType: 'worker.evidence-recorded',
          evidenceRef: 'docs/plans/v43-task-3-worker-revision-evidence-2026-06-07.md'
        })
      ]),
      ledger: ledgerFor([ledgerTask('task-3')])
    });

    assertValidNextAction(reviewAfterRevisionAction);
    assert.equal(reviewAfterRevisionAction.next.role, 'reviewer');
    assert.equal(reviewAfterRevisionAction.next.phase, 'review');

    const mainAfterFreshApprovalAction = resolveGoalNextAction({
      runbook,
      eventLog: eventLogFor([
        ...failedMainEvents,
        taskEvent({
          sequence: 4,
          eventId: 'evt_worker_revision',
          taskId: 'task-3',
          eventType: 'worker.evidence-recorded',
          evidenceRef: 'docs/plans/v43-task-3-worker-revision-evidence-2026-06-07.md'
        }),
        taskEvent({
          sequence: 5,
          eventId: 'evt_review_approved_revision',
          taskId: 'task-3',
          eventType: 'reviewer.approved',
          phase: 'review',
          actorRole: 'reviewer',
          evidenceRef: 'docs/plans/v43-task-3-review-revision-evidence-2026-06-07.md',
          review: { verdict: 'APPROVED' }
        })
      ]),
      ledger: ledgerFor([ledgerTask('task-3')])
    });

    assertValidNextAction(mainAfterFreshApprovalAction);
    assert.equal(mainAfterFreshApprovalAction.next.role, 'main-verifier');
    assert.equal(mainAfterFreshApprovalAction.next.phase, 'main-verification');
  });

  it('does not advance release closeout from stale release-gate ledger state without gate events', () => {
    const runbook = runbookFor(['task-3'], ['release.pnpm-check']);
    const eventLog = eventLogFor([
      taskEvent({
        sequence: 1,
        eventId: 'evt_task_3_main_verified',
        taskId: 'task-3',
        eventType: 'main.verification-passed',
        phase: 'main-verification',
        actorRole: 'main-verifier',
        evidenceRef: 'docs/plans/v43-task-3-main-verification-evidence-2026-06-07.md'
      }),
      releaseEvent({
        sequence: 2,
        eventId: 'evt_release_ready_declared',
        gate: 'release.ready',
        eventType: 'release.ready-declared',
        phase: 'release-prep',
        status: 'declared'
      })
    ]);
    const ledger = ledgerFor([{
      ...ledgerTask('task-3'),
      status: 'main-verified',
      mainVerificationRef: 'docs/plans/v43-task-3-main-verification-evidence-2026-06-07.md'
    }], {
      pnpmCheck: 'passed'
    });

    const nextAction = resolveGoalNextAction({
      runbook,
      eventLog,
      ledger
    });

    assertValidNextAction(nextAction);
    assert.equal(nextAction.status, 'action-required');
    assert.equal(nextAction.next.taskId, 'release');
    assert.equal(nextAction.next.role, 'release-manager');
    assert.equal(nextAction.next.phase, 'release-gate');
    assert.match(nextAction.next.reason, /release\.pnpm-check is not passed/u);
    assert.equal(nextAction.reconciliationWarnings.some((warning) => warning.code === 'ledger-release-gate-without-event'), true);
  });

  it('keeps one consumed valid result mapped to one appendable goal event', () => {
    const parsed = parseChildResultBlock({
      text: resultBlock({
        goalId: GOAL_ID,
        taskId: 'task-3',
        role: 'worker',
        threadId: 'thread-task-3-worker',
        branch: 'v43-task-3-route-status-reconciliation',
        worktree: '/Users/andy/.codex/worktrees/v43-task-3-route-status-reconciliation',
        baseCommit: 'e28839353f3edeb531dcd8c4313a878ff9d8b0ab',
        headCommit: '0000000000000000000000000000000000000000',
        status: 'completed',
        eventToRegister: 'worker.evidence-recorded',
        evidenceRef: 'docs/plans/v43-task-3-worker-evidence-2026-06-07.md',
        filesChanged: ['src/symphony/goal-next-action-resolver.js'],
        commandsRun: [{ command: 'node --test tests/v43-route-status-reconciliation.test.js', status: 'passed' }],
        validation: 'focused route reconciliation test passed',
        risks: [],
        blockers: [],
        nextSuggestedAction: 'reviewer'
      }),
      expected: {
        goalId: GOAL_ID,
        taskId: 'task-3',
        role: 'worker',
        threadId: 'thread-task-3-worker',
        branch: 'v43-task-3-route-status-reconciliation',
        worktree: '/Users/andy/.codex/worktrees/v43-task-3-route-status-reconciliation'
      }
    });

    const first = consumeParsedResult({ result: parsed });
    const duplicate = consumeParsedResult({
      result: parsed,
      consumedResultIds: [first.recordId]
    });
    const reconciliation = buildGoalRouteReconciliation({
      runbook: runbookFor(['task-3']),
      eventLog: eventLogFor([
        taskEvent({
          sequence: 1,
          eventId: 'evt_consumed_worker_result',
          taskId: first.event.taskId,
          eventType: first.event.eventToRegister,
          evidenceRef: first.event.evidenceRef
        })
      ]),
      ledger: ledgerFor([ledgerTask('task-3')])
    });

    assert.equal(parsed.valid, true);
    assert.equal(first.consumed, true);
    assert.deepEqual(first.event, {
      eventToRegister: 'worker.evidence-recorded',
      goalId: GOAL_ID,
      taskId: 'task-3',
      role: 'worker',
      evidenceRef: 'docs/plans/v43-task-3-worker-evidence-2026-06-07.md',
      threadId: 'thread-task-3-worker'
    });
    assert.equal(duplicate.consumed, false);
    assert.equal(duplicate.idempotent, true);
    assert.equal(reconciliation.status, 'consistent');
  });
});

function runbookFor(taskIds, releaseGates = ['release.pnpm-check']) {
  return {
    contractName: 'goal-runbook.v1',
    contractVersion: 1,
    goalId: GOAL_ID,
    goalTitle: 'v43 Goal Supervisor Stabilization',
    baseline: {
      tag: 'v42',
      commit: '3ccacc5a6ce27318064ab7d5f2d3551d41a0388e',
      evidenceRef: 'docs/plans/v42-release-evidence-2026-06-06.md'
    },
    tasks: taskIds.map((taskId) => ({
      taskId,
      title: `Task ${taskId}`,
      branch: 'v43-task-3-route-status-reconciliation',
      roleOrder: ['worker', 'reviewer', 'main-verifier'],
      acceptance: [`${taskId} acceptance`],
      expectedEvidence: {
        worker: 'worker.evidence-recorded',
        reviewer: ['reviewer.approved', 'reviewer.needs-revision'],
        mainVerifier: 'main.verification-passed'
      },
      copyOnlyCommands: ['pnpm check']
    })),
    releaseGates,
    rolePolicy: {
      workerCannotApproveOwnTask: true,
      reviewerApprovalRequiredBeforeMainVerification: true,
      mainVerificationRequiredBeforeReleaseReady: true
    }
  };
}

function ledgerFor(tasks, releaseGates = {}) {
  return {
    tasks,
    releaseGates: {
      pnpmCheck: 'unknown',
      pnpmTest: 'unknown',
      workbenchBuild: 'unknown',
      mutationGate: 'unknown',
      auditHigh: 'unknown',
      diffCheck: 'unknown',
      mcasDoctor: 'unknown',
      docsUpdated: 'unknown',
      tagEvidence: 'unknown',
      ...releaseGates
    }
  };
}

function ledgerTask(taskId) {
  return {
    taskId,
    status: 'planned',
    statusSource: 'goal-runbook.v1',
    branch: 'v43-task-3-route-status-reconciliation',
    commit: null,
    workerEvidenceRef: null,
    reviewEvidenceRef: null,
    reviewVerdict: null,
    mainVerificationRef: null,
    blockers: [],
    nextCopyOnlyCommand: 'git checkout main && git checkout -b v43-task-3-route-status-reconciliation'
  };
}

function eventLogFor(events) {
  return {
    contractName: 'goal-event-log.v1',
    contractVersion: 1,
    goalId: GOAL_ID,
    events
  };
}

function taskEvent({
  sequence,
  eventId,
  taskId,
  eventType,
  evidenceRef,
  phase = 'implement',
  actorRole = 'worker',
  review
}) {
  return stripUndefined({
    sequence,
    eventId,
    goalId: GOAL_ID,
    taskId,
    eventType,
    phase,
    actor: {
      role: actorRole,
      id: `codex-${actorRole}`
    },
    branch: 'v43-task-3-route-status-reconciliation',
    evidenceRefs: evidenceRef === null ? [] : [{
      kind: 'repo-doc',
      ref: evidenceRef,
      label: `${taskId} evidence`
    }],
    statement: `${eventType} for ${taskId}.`,
    review
  });
}

function releaseEvent({
  sequence,
  eventId,
  gate,
  eventType,
  phase = 'release-gate',
  status
}) {
  return {
    sequence,
    eventId,
    goalId: GOAL_ID,
    taskId: 'release',
    eventType,
    phase,
    actor: {
      role: 'release-manager',
      id: 'codex-release-manager'
    },
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/plans/v43-release-evidence-2026-06-07.md',
      label: 'release evidence'
    }],
    statement: `${gate} ${status}.`,
    gate: {
      id: gate,
      status
    }
  };
}

function resultBlock(payload) {
  return [
    'RESULT_BLOCK_START',
    JSON.stringify(payload, null, 2),
    'RESULT_BLOCK_END'
  ].join('\n');
}

function assertValidNextAction(nextAction) {
  assert.deepEqual(validateGoalNextActionContract(nextAction), {
    ok: true,
    errors: []
  });
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}
