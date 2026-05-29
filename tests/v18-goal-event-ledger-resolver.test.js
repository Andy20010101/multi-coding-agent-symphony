import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { appendGoalEvent } from '../src/symphony/goal-event-journal.js';
import {
  buildGoalProgressLedger,
  validateGoalProgressLedgerContract
} from '../src/symphony/goal-progress-ledger.js';

const GOAL_ID = 'v18-goal-event-journal-evidence-recorder';
const GENERATED_AT = '2026-05-28T12:00:00.000Z';
const RELEASE_GATES = Object.freeze([
  'release.pnpm-check',
  'release.pnpm-test',
  'release.workbench-build',
  'release.mutation-gate',
  'release.audit-high',
  'release.diff-check',
  'release.mcas-doctor',
  'release.docs-updated',
  'release.tag-evidence'
]);

describe('v18 goal event resolver to goal-progress-ledger.v1', () => {
  it('keeps the v17 planned template with an explicit no-events status source', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-ledger-no-events-'));

    try {
      const ledger = await buildGoalProgressLedger({
        stateDir: join(root, '.symphony'),
        generatedAt: GENERATED_AT
      });

      assert.deepEqual(validateGoalProgressLedgerContract(ledger), {
        ok: true,
        errors: []
      });
      assert.equal(ledger.summary.releaseReady, false);
      assert.equal(ledger.tasks.every((task) => task.status === 'planned'), true);
      assert.equal(ledger.tasks.every((task) => task.statusSource === 'v17-template-no-events'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('does not infer v18 terminal status from stale state when the event log is empty', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-ledger-stale-state-'));
    const stateDir = join(root, '.symphony');

    try {
      await writeGoalState(stateDir, GOAL_ID, {
        tasks: [{
          taskId: 'task-1',
          status: 'main-verified',
          statusSource: 'stale-state-before-event-log',
          reviewVerdict: 'APPROVED',
          reviewEvidenceRef: 'docs/plans/v18-task1-review-evidence-2026-05-28.md',
          mainVerificationRef: 'docs/plans/v18-task1-main-verification-evidence-2026-05-28.md'
        }],
        releaseGates: {
          pnpmCheck: 'passed',
          pnpmTest: 'passed',
          workbenchBuild: 'passed',
          mutationGate: 'passed',
          auditHigh: 'passed',
          diffCheck: 'passed',
          docsUpdated: 'passed',
          tagEvidence: 'passed'
        },
        releaseEvidenceRef: 'docs/plans/v18-release-evidence-2026-05-28.md'
      });

      const ledger = await buildGoalProgressLedger({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assert.deepEqual(validateGoalProgressLedgerContract(ledger), {
        ok: true,
        errors: []
      });
      assert.equal(ledger.summary.releaseReady, false);
      assert.equal(task(ledger, 'task-1').status, 'planned');
      assert.equal(task(ledger, 'task-1').statusSource, 'v17-template-no-events');
      assert.equal(task(ledger, 'task-1').reviewEvidenceRef, null);
      assert.equal(task(ledger, 'task-1').mainVerificationRef, null);
      assert.equal(Object.values(ledger.releaseGates).every((status) => status === 'unknown'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('maps explicit task events without inferring status from branch, statement, or task title text', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-ledger-events-'));
    const stateDir = join(root, '.symphony');

    try {
      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:01:00.000Z',
        event: buildTaskEvent({
          eventId: 'evt_task1_started_branch_mentions_approved',
          taskId: 'task-1',
          eventType: 'worker.started',
          branch: 'approved-main-verified-release-ready-by-name',
          statement: 'Branch and statement mention approved release-ready but only worker.started was recorded.'
        })
      });
      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:02:00.000Z',
        event: buildTaskEvent({
          eventId: 'evt_task2_self_checked',
          taskId: 'task-2',
          eventType: 'worker.self-check-passed',
          evidenceRefs: [workerEvidence('task-2')]
        })
      });
      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:03:00.000Z',
        event: buildTaskEvent({
          eventId: 'evt_task3_approved',
          taskId: 'task-3',
          eventType: 'reviewer.approved',
          phase: 'review',
          actor: { role: 'reviewer', id: 'codex-reviewer-task-3' },
          evidenceRefs: [reviewEvidence('task-3')],
          review: { verdict: 'APPROVED', scope: 'Task 3 diff and tests' }
        })
      });
      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:04:00.000Z',
        event: buildTaskEvent({
          eventId: 'evt_task4_needs_revision',
          taskId: 'task-4',
          eventType: 'reviewer.needs-revision',
          phase: 'review',
          actor: { role: 'reviewer', id: 'codex-reviewer-task-4' },
          evidenceRefs: [reviewEvidence('task-4')],
          review: { verdict: 'NEEDS_REVISION', scope: 'Task 4 diff and tests' }
        })
      });
      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:05:00.000Z',
        event: buildTaskEvent({
          eventId: 'evt_task5_merged',
          taskId: 'task-5',
          eventType: 'main.merged',
          phase: 'land',
          actor: { role: 'main-verifier', id: 'codex-main-verifier' },
          statement: 'Task 5 merged to main.'
        })
      });
      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:06:00.000Z',
        event: buildTaskEvent({
          eventId: 'evt_task5_main_verified',
          taskId: 'task-5',
          eventType: 'main.verification-passed',
          phase: 'main-verification',
          actor: { role: 'main-verifier', id: 'codex-main-verifier' },
          evidenceRefs: [mainEvidence('task-5')]
        })
      });
      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:07:00.000Z',
        event: buildTaskEvent({
          eventId: 'evt_task6_blocked',
          taskId: 'task-6',
          eventType: 'blocker.opened',
          phase: 'implement',
          actor: { role: 'worker', id: 'codex-worker-task-6' },
          blocker: {
            id: 'blocker-task-6-review',
            reason: 'Task 6 is waiting for independent review evidence.',
            severity: 'warning'
          }
        })
      });
      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:08:00.000Z',
        event: buildTaskEvent({
          eventId: 'evt_task7_self_check_failed',
          taskId: 'task-7',
          eventType: 'worker.self-check-failed',
          evidenceRefs: [workerEvidence('task-7')],
          statement: 'Task 7 worker self-check failed; resolver must not infer a passing state.'
        })
      });

      const ledger = await buildGoalProgressLedger({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assert.deepEqual(validateGoalProgressLedgerContract(ledger), {
        ok: true,
        errors: []
      });
      assert.equal(task(ledger, 'task-1').status, 'in-progress');
      assert.equal(task(ledger, 'task-2').status, 'self-checked');
      assert.equal(task(ledger, 'task-2').workerEvidenceRef, 'docs/plans/v18-task-2-worker-evidence-2026-05-28.md');
      assert.equal(task(ledger, 'task-3').status, 'approved');
      assert.equal(task(ledger, 'task-3').reviewVerdict, 'APPROVED');
      assert.equal(task(ledger, 'task-4').status, 'needs-revision');
      assert.equal(task(ledger, 'task-4').reviewVerdict, 'NEEDS_REVISION');
      assert.equal(task(ledger, 'task-5').status, 'main-verified');
      assert.equal(task(ledger, 'task-5').mainVerificationRef, 'docs/plans/v18-task-5-main-verification-evidence-2026-05-28.md');
      assert.equal(task(ledger, 'task-6').status, 'blocked');
      assert.equal(task(ledger, 'task-6').blockers[0].reason, 'Task 6 is waiting for independent review evidence.');
      assert.equal(task(ledger, 'task-7').status, 'unknown');
      assert.equal(task(ledger, 'task-1').statusSource, 'goal-event-log.v1:evt_task1_started_branch_mentions_approved');
      assert.equal(task(ledger, 'task-8').statusSource, 'v17-template-no-events');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('does not mark release-ready from passed release gates until release.ready-declared is recorded', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-ledger-release-ready-'));
    const stateDir = join(root, '.symphony');

    try {
      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:01:00.000Z',
        event: buildTaskEvent({
          eventId: 'evt_task1_main_verified_for_release',
          taskId: 'task-1',
          eventType: 'main.verification-passed',
          phase: 'main-verification',
          actor: { role: 'main-verifier', id: 'codex-main-verifier' },
          evidenceRefs: [mainEvidence('task-1')]
        })
      });

      for (const [index, gateName] of RELEASE_GATES.entries()) {
        await appendGoalEvent({
          stateDir,
          mode: 'confirm',
          recordedAt: `2026-05-28T10:${String(index + 2).padStart(2, '0')}:00.000Z`,
          event: buildReleaseGateEvent({
            eventId: `evt_${gateName.replaceAll('.', '_').replaceAll('-', '_')}_passed`,
            gateName,
            eventType: 'release.gate-passed',
            status: 'passed'
          })
        });
      }

      const gatesOnlyLedger = await buildGoalProgressLedger({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assert.equal(gatesOnlyLedger.summary.releaseReady, false);
      assert.equal(task(gatesOnlyLedger, 'task-1').status, 'main-verified');
      assert.equal(Object.values(gatesOnlyLedger.releaseGates).every((status) => status === 'passed'), true);

      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:20:00.000Z',
        event: buildReleaseGateEvent({
          eventId: 'evt_release_ready_declared',
          gateName: 'release.ready',
          eventType: 'release.ready-declared',
          phase: 'release-prep',
          actor: { role: 'release-manager', id: 'codex-release-manager' },
          status: 'declared'
        })
      });

      const readyLedger = await buildGoalProgressLedger({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assert.deepEqual(validateGoalProgressLedgerContract(readyLedger), {
        ok: true,
        errors: []
      });
      assert.equal(readyLedger.summary.releaseReady, true);
      assert.equal(task(readyLedger, 'task-1').status, 'release-ready');
      assert.equal(task(readyLedger, 'task-1').statusSource, 'goal-event-log.v1:evt_release_ready_declared');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('maps release.ready-declared to release-ready without requiring every release gate to pass first', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-ledger-ready-declared-only-'));
    const stateDir = join(root, '.symphony');

    try {
      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:01:00.000Z',
        event: buildTaskEvent({
          eventId: 'evt_task1_main_verified_before_ready_declared',
          taskId: 'task-1',
          eventType: 'main.verification-passed',
          phase: 'main-verification',
          actor: { role: 'main-verifier', id: 'codex-main-verifier' },
          evidenceRefs: [mainEvidence('task-1')]
        })
      });
      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:02:00.000Z',
        event: buildReleaseGateEvent({
          eventId: 'evt_release_ready_declared_before_all_gates_passed',
          gateName: 'release.ready',
          eventType: 'release.ready-declared',
          phase: 'release-prep',
          actor: { role: 'release-manager', id: 'codex-release-manager' },
          status: 'declared'
        })
      });

      const ledger = await buildGoalProgressLedger({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assert.deepEqual(validateGoalProgressLedgerContract(ledger), {
        ok: true,
        errors: []
      });
      assert.equal(ledger.summary.releaseReady, true);
      assert.equal(ledger.summary.releaseReadySource, 'goal-event-log.v1:evt_release_ready_declared_before_all_gates_passed');
      assert.equal(task(ledger, 'task-1').status, 'release-ready');
      assert.equal(task(ledger, 'task-1').statusSource, 'goal-event-log.v1:evt_release_ready_declared_before_all_gates_passed');
      assert.equal(Object.values(ledger.releaseGates).every((status) => status === 'unknown'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function task(ledger, taskId) {
  return ledger.tasks.find((candidate) => candidate.taskId === taskId);
}

async function writeGoalState(stateDir, goalId, state) {
  const goalStateDir = join(stateDir, 'goals');

  await mkdir(goalStateDir, { recursive: true });
  await writeFile(join(goalStateDir, `${goalId}.json`), `${JSON.stringify({
    contractName: 'symphony.goal-progress-state',
    contractVersion: '1',
    goalId,
    ...state
  }, null, 2)}\n`, 'utf8');
}

function buildTaskEvent({
  eventId,
  taskId,
  eventType,
  phase = 'implement',
  actor = { role: 'worker', id: `codex-worker-${taskId}` },
  branch = `codex/v18-${taskId}`,
  commit = null,
  evidenceRefs = [],
  statement = `${eventType} recorded for ${taskId}.`,
  review,
  blocker
}) {
  return stripUndefined({
    eventId,
    goalId: GOAL_ID,
    taskId,
    eventType,
    phase,
    actor,
    occurredAt: '2026-05-28T10:00:00.000Z',
    branch,
    commit,
    evidenceRefs,
    statement,
    review,
    blocker
  });
}

function buildReleaseGateEvent({
  eventId,
  gateName,
  eventType,
  status,
  phase = 'release-gate',
  actor = { role: 'release-verifier', id: 'codex-release-verifier' }
}) {
  return {
    eventId,
    goalId: GOAL_ID,
    taskId: 'release',
    eventType,
    phase,
    actor,
    occurredAt: '2026-05-28T10:00:00.000Z',
    branch: 'codex/v18-task6-goal-progress-ledger',
    commit: null,
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/plans/v18-release-evidence-2026-05-28.md',
      label: 'v18 release evidence'
    }],
    statement: `${gateName} ${status}.`,
    gate: {
      id: gateName,
      status
    }
  };
}

function workerEvidence(taskId) {
  return {
    kind: 'repo-doc',
    ref: `docs/plans/v18-${taskId}-worker-evidence-2026-05-28.md`,
    label: `${taskId} worker evidence`
  };
}

function reviewEvidence(taskId) {
  return {
    kind: 'repo-doc',
    ref: `docs/plans/v18-${taskId}-review-evidence-2026-05-28.md`,
    label: `${taskId} review evidence`
  };
}

function mainEvidence(taskId) {
  return {
    kind: 'repo-doc',
    ref: `docs/plans/v18-${taskId}-main-verification-evidence-2026-05-28.md`,
    label: `${taskId} main verification evidence`
  };
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}
