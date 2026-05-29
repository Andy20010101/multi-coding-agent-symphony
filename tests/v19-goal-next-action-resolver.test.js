import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { appendGoalEvent, getManagedGoalEventJournalPath } from '../src/symphony/goal-event-journal.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';
import {
  buildGoalNextAction,
  resolveGoalNextAction
} from '../src/symphony/goal-next-action-resolver.js';
import { validateGoalNextActionContract } from '../src/symphony/goal-runbook-contracts.js';

const GOAL_ID = 'v19-goal-runbook-next-action';
const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.valid.v1.json';
const GENERATED_AT = '2026-05-29T10:00:00.000Z';

describe('v19 event-aware goal-next-action.v1 resolver', () => {
  it('returns missing-runbook when no managed runbook is registered', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-next-missing-runbook-'));

    try {
      const nextAction = await buildGoalNextAction({
        stateDir: join(root, '.symphony'),
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assertValidNextAction(nextAction);
      assert.equal(nextAction.status, 'missing-runbook');
      assert.equal(nextAction.next, null);
      assert.equal(nextAction.copyOnlyPrompt.available, false);
      assert.deepEqual(nextAction.afterCompletion.allowedEvents, []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('selects task-1 worker when the managed runbook has no events', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-next-no-events-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook(stateDir);

      const nextAction = await buildGoalNextAction({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assertValidNextAction(nextAction);
      assert.equal(nextAction.status, 'action-required');
      assert.equal(nextAction.next.taskId, 'task-1');
      assert.equal(nextAction.next.role, 'worker');
      assert.equal(nextAction.next.phase, 'implement');
      assert.match(nextAction.next.reason, /No explicit worker evidence/u);
      assert.deepEqual(nextAction.afterCompletion.allowedEvents, [
        'worker.evidence-recorded',
        'worker.self-check-passed',
        'worker.self-check-failed'
      ]);
      assert.equal(nextAction.copyOnlyCommands.includes('pnpm check'), true);
      assert.equal(nextAction.copyOnlyCommands.includes('pnpm test'), true);
      assert.equal(nextAction.copyOnlyCommands.includes('git diff --check'), true);
      assert.equal(nextAction.copyOnlyPrompt.available, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('sends worker evidence without a reviewer verdict to the reviewer', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-next-reviewer-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook(stateDir);
      await appendTaskEvent({
        stateDir,
        eventId: 'evt_task1_worker_evidence',
        taskId: 'task-1',
        eventType: 'worker.evidence-recorded',
        evidenceRefs: [workerEvidence('task-1')]
      });

      const nextAction = await buildGoalNextAction({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assertValidNextAction(nextAction);
      assert.equal(nextAction.next.taskId, 'task-1');
      assert.equal(nextAction.next.role, 'reviewer');
      assert.equal(nextAction.next.phase, 'review');
      assert.match(nextAction.next.reason, /reviewer verdict is missing/u);
      assert.equal(nextAction.evidenceState.workerEvidenceRef, 'docs/plans/v19-task-1-worker-evidence-2026-05-29.md');
      assert.deepEqual(nextAction.afterCompletion.allowedEvents, [
        'reviewer.approved',
        'reviewer.needs-revision'
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('sends the task back to worker revision when needs-revision is the latest verdict', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-next-revision-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook(stateDir);
      await appendTaskEvent({
        stateDir,
        eventId: 'evt_task1_worker_evidence',
        taskId: 'task-1',
        eventType: 'worker.evidence-recorded',
        evidenceRefs: [workerEvidence('task-1')]
      });
      await appendTaskEvent({
        stateDir,
        eventId: 'evt_task1_needs_revision',
        taskId: 'task-1',
        eventType: 'reviewer.needs-revision',
        phase: 'review',
        actor: { role: 'reviewer', id: 'codex-reviewer-task-1' },
        evidenceRefs: [reviewEvidence('task-1')],
        review: { verdict: 'NEEDS_REVISION', scope: 'Task 1 diff and tests' }
      });

      const nextAction = await buildGoalNextAction({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assertValidNextAction(nextAction);
      assert.equal(nextAction.next.taskId, 'task-1');
      assert.equal(nextAction.next.role, 'worker');
      assert.equal(nextAction.next.phase, 'revision');
      assert.match(nextAction.next.reason, /reviewer\.needs-revision/u);
      assert.equal(nextAction.evidenceState.reviewEvidenceRef, 'docs/plans/v19-task-1-review-evidence-2026-05-29.md');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('sends reviewer approval without main verification to the main verifier', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-next-main-verifier-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook(stateDir);
      await appendTaskEvent({
        stateDir,
        eventId: 'evt_task1_worker_evidence',
        taskId: 'task-1',
        eventType: 'worker.evidence-recorded',
        evidenceRefs: [workerEvidence('task-1')]
      });
      await appendTaskEvent({
        stateDir,
        eventId: 'evt_task1_approved',
        taskId: 'task-1',
        eventType: 'reviewer.approved',
        phase: 'review',
        actor: { role: 'reviewer', id: 'codex-reviewer-task-1' },
        evidenceRefs: [reviewEvidence('task-1')],
        review: { verdict: 'APPROVED', scope: 'Task 1 diff and tests' }
      });

      const nextAction = await buildGoalNextAction({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assertValidNextAction(nextAction);
      assert.equal(nextAction.next.taskId, 'task-1');
      assert.equal(nextAction.next.role, 'main-verifier');
      assert.equal(nextAction.next.phase, 'main-verification');
      assert.match(nextAction.next.reason, /main verification is missing/u);
      assert.deepEqual(nextAction.afterCompletion.allowedEvents, [
        'main.verification-passed',
        'main.verification-failed'
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('does not treat main.verification-failed evidence as main verified', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-next-main-verification-failed-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook(stateDir);
      await appendTaskEvent({
        stateDir,
        eventId: 'evt_task1_worker_evidence',
        taskId: 'task-1',
        eventType: 'worker.evidence-recorded',
        evidenceRefs: [workerEvidence('task-1')]
      });
      await appendTaskEvent({
        stateDir,
        eventId: 'evt_task1_approved',
        taskId: 'task-1',
        eventType: 'reviewer.approved',
        phase: 'review',
        actor: { role: 'reviewer', id: 'codex-reviewer-task-1' },
        evidenceRefs: [reviewEvidence('task-1')],
        review: { verdict: 'APPROVED', scope: 'Task 1 diff and tests' }
      });
      await appendTaskEvent({
        stateDir,
        eventId: 'evt_task1_main_verification_failed',
        taskId: 'task-1',
        eventType: 'main.verification-failed',
        phase: 'main-verification',
        actor: { role: 'main-verifier', id: 'codex-main-verifier-task-1' },
        evidenceRefs: [mainEvidence('task-1')]
      });
      await appendMainVerification({ stateDir, taskId: 'task-2' });

      const nextAction = await buildGoalNextAction({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assertValidNextAction(nextAction);
      assert.equal(nextAction.status, 'action-required');
      assert.equal(nextAction.next.taskId, 'task-1');
      assert.equal(nextAction.next.role, 'main-verifier');
      assert.equal(nextAction.next.phase, 'main-verification');
      assert.match(nextAction.next.reason, /Latest main verification failed for task-1/u);
      assert.equal(nextAction.evidenceState.mainVerificationRef, 'docs/plans/v19-task-1-main-verification-evidence-2026-05-29.md');
      assert.doesNotMatch(nextAction.next.reason, /release\.pnpm-check/u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('moves to release-manager after every runbook task is main-verified and a release gate is missing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-next-release-gate-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook(stateDir);
      await appendMainVerification({ stateDir, taskId: 'task-1' });
      await appendMainVerification({ stateDir, taskId: 'task-2' });

      const nextAction = await buildGoalNextAction({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assertValidNextAction(nextAction);
      assert.equal(nextAction.status, 'action-required');
      assert.equal(nextAction.next.taskId, 'release');
      assert.equal(nextAction.next.role, 'release-manager');
      assert.equal(nextAction.next.phase, 'release-gate');
      assert.match(nextAction.next.reason, /release\.pnpm-check is not passed/u);
      assert.deepEqual(nextAction.afterCompletion.allowedEvents, [
        'release.gate-passed',
        'release.gate-failed'
      ]);
      assert.equal(nextAction.copyOnlyCommands.includes('pnpm check'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('advances release gate progression after release.mcas-doctor passes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-next-mcas-doctor-passed-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook(stateDir);
      await appendMainVerification({ stateDir, taskId: 'task-1' });
      await appendMainVerification({ stateDir, taskId: 'task-2' });

      for (const gateName of [
        'release.pnpm-check',
        'release.pnpm-test',
        'release.workbench-build',
        'release.mutation-gate',
        'release.audit-high',
        'release.diff-check',
        'release.mcas-doctor'
      ]) {
        await appendReleaseGate({
          stateDir,
          eventId: `evt_${gateName.replaceAll('.', '_').replaceAll('-', '_')}_passed`,
          gateName,
          eventType: 'release.gate-passed',
          status: 'passed'
        });
      }

      const nextAction = await buildGoalNextAction({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assertValidNextAction(nextAction);
      assert.equal(nextAction.status, 'action-required');
      assert.equal(nextAction.next.taskId, 'release');
      assert.equal(nextAction.next.role, 'release-manager');
      assert.equal(nextAction.next.phase, 'release-gate');
      assert.match(nextAction.next.reason, /release\.docs-updated is not passed/u);
      assert.doesNotMatch(nextAction.next.reason, /release\.mcas-doctor/u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('returns complete when release.ready-declared and tagEvidence passed are explicit events', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-next-complete-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook(stateDir);
      await appendMainVerification({ stateDir, taskId: 'task-1' });
      await appendMainVerification({ stateDir, taskId: 'task-2' });
      await appendReleaseGate({
        stateDir,
        eventId: 'evt_release_tag_evidence_passed',
        gateName: 'release.tag-evidence',
        eventType: 'release.gate-passed',
        status: 'passed'
      });
      await appendReleaseGate({
        stateDir,
        eventId: 'evt_release_ready_declared',
        gateName: 'release.ready',
        eventType: 'release.ready-declared',
        phase: 'release-prep',
        status: 'declared'
      });

      const nextAction = await buildGoalNextAction({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assertValidNextAction(nextAction);
      assert.equal(nextAction.status, 'complete');
      assert.equal(nextAction.next, null);
      assert.equal(nextAction.reason, 'release.ready-declared is recorded and release.tag-evidence has passed.');
      assert.deepEqual(nextAction.copyOnlyCommands, []);
      assert.deepEqual(nextAction.afterCompletion.allowedEvents, []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('blocks without a recommended next step when the event chain is invalid', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-next-invalid-chain-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook(stateDir);
      await appendTaskEvent({
        stateDir,
        eventId: 'evt_task1_worker_evidence',
        taskId: 'task-1',
        eventType: 'worker.evidence-recorded',
        evidenceRefs: [workerEvidence('task-1')]
      });

      const journalPath = getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID });
      const [line] = (await readFile(journalPath, 'utf8')).trim().split('\n');
      const event = JSON.parse(line);

      event.statement = 'Tampered after append.';
      await writeFile(journalPath, `${JSON.stringify(event)}\n`, 'utf8');

      const nextAction = await buildGoalNextAction({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assertValidNextAction(nextAction);
      assert.equal(nextAction.status, 'blocked');
      assert.equal(nextAction.next, null);
      assert.match(nextAction.reason, /eventHash must match event content/u);
      assert.deepEqual(nextAction.copyOnlyCommands, []);
      assert.deepEqual(nextAction.afterCompletion.allowedEvents, []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('does not infer progress from branch, statement, or command text', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-next-no-text-inference-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerRunbook(stateDir);
      await appendTaskEvent({
        stateDir,
        eventId: 'evt_task1_started_text_mentions_done',
        taskId: 'task-1',
        eventType: 'worker.started',
        branch: 'reviewer-approved-main-verified-release-ready',
        statement: 'Text says worker evidence recorded, reviewer approved, and main verified.'
      });

      const nextAction = await buildGoalNextAction({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assertValidNextAction(nextAction);
      assert.equal(nextAction.next.taskId, 'task-1');
      assert.equal(nextAction.next.role, 'worker');
      assert.match(nextAction.next.reason, /No explicit worker evidence/u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('can resolve from in-memory runbook, event log, and ledger objects', () => {
    const nextAction = resolveGoalNextAction({
      runbook: {
        contractName: 'goal-runbook.v1',
        contractVersion: 1,
        goalId: GOAL_ID,
        goalTitle: 'v19 Goal Runbook + Next Action Control Center',
        baseline: {
          tag: 'v18',
          commit: null,
          evidenceRef: 'docs/plans/v18-tag-release-evidence-2026-05-29.md'
        },
        tasks: [{
          taskId: 'task-1',
          title: 'Task 1',
          branch: 'v19-task1-goal-runbook-contracts',
          roleOrder: ['worker', 'reviewer', 'main-verifier'],
          acceptance: ['Task 1 acceptance'],
          expectedEvidence: {
            worker: 'worker.evidence-recorded',
            reviewer: ['reviewer.approved', 'reviewer.needs-revision'],
            mainVerifier: 'main.verification-passed'
          },
          copyOnlyCommands: ['pnpm check']
        }],
        releaseGates: ['release.tag-evidence'],
        rolePolicy: {
          workerCannotApproveOwnTask: true,
          reviewerApprovalRequiredBeforeMainVerification: true,
          mainVerificationRequiredBeforeReleaseReady: true
        }
      },
      eventLog: {
        events: []
      },
      ledger: {
        tasks: [{
          taskId: 'task-1',
          status: 'planned',
          workerEvidenceRef: null,
          reviewEvidenceRef: null,
          reviewVerdict: null,
          mainVerificationRef: null,
          blockers: [],
          nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v19-task1-goal-runbook-contracts'
        }],
        releaseGates: { tagEvidence: 'unknown' }
      }
    });

    assertValidNextAction(nextAction);
    assert.equal(nextAction.next.role, 'worker');
  });
});

async function registerRunbook(stateDir) {
  const plan = await buildGoalRunbookInitPlan({
    stateDir,
    goalId: GOAL_ID,
    fromJson: RUNBOOK_FIXTURE
  });

  await confirmGoalRunbookInit({
    stateDir,
    goalId: GOAL_ID,
    fromJson: RUNBOOK_FIXTURE,
    planHash: plan.planHash
  });
}

async function appendMainVerification({ stateDir, taskId }) {
  await appendTaskEvent({
    stateDir,
    eventId: `evt_${taskId.replace('-', '_')}_main_verified`,
    taskId,
    eventType: 'main.verification-passed',
    phase: 'main-verification',
    actor: { role: 'main-verifier', id: `codex-main-verifier-${taskId}` },
    evidenceRefs: [mainEvidence(taskId)]
  });
}

async function appendTaskEvent({
  stateDir,
  eventId,
  taskId,
  eventType,
  phase = 'implement',
  actor = { role: 'worker', id: `codex-worker-${taskId}` },
  branch = `codex/v19-${taskId}`,
  commit = null,
  evidenceRefs = [],
  statement = `${eventType} recorded for ${taskId}.`,
  review,
  blocker
}) {
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    recordedAt: '2026-05-29T10:00:00.000Z',
    event: stripUndefined({
      eventId,
      goalId: GOAL_ID,
      taskId,
      eventType,
      phase,
      actor,
      occurredAt: '2026-05-29T10:00:00.000Z',
      branch,
      commit,
      evidenceRefs,
      statement,
      review,
      blocker
    })
  });
}

async function appendReleaseGate({
  stateDir,
  eventId,
  gateName,
  eventType,
  status,
  phase = 'release-gate'
}) {
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    recordedAt: '2026-05-29T10:00:00.000Z',
    event: {
      eventId,
      goalId: GOAL_ID,
      taskId: 'release',
      eventType,
      phase,
      actor: { role: 'release-manager', id: 'codex-release-manager' },
      occurredAt: '2026-05-29T10:00:00.000Z',
      branch: 'v19-release-verification',
      commit: null,
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: 'docs/plans/v19-release-evidence-2026-05-29.md',
        label: 'v19 release evidence'
      }],
      statement: `${gateName} ${status}.`,
      gate: {
        id: gateName,
        status
      }
    }
  });
}

function workerEvidence(taskId) {
  return {
    kind: 'repo-doc',
    ref: `docs/plans/v19-${taskId}-worker-evidence-2026-05-29.md`,
    label: `${taskId} worker evidence`
  };
}

function reviewEvidence(taskId) {
  return {
    kind: 'repo-doc',
    ref: `docs/plans/v19-${taskId}-review-evidence-2026-05-29.md`,
    label: `${taskId} review evidence`
  };
}

function mainEvidence(taskId) {
  return {
    kind: 'repo-doc',
    ref: `docs/plans/v19-${taskId}-main-verification-evidence-2026-05-29.md`,
    label: `${taskId} main verification evidence`
  };
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
