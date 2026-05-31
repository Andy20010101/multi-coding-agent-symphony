import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { appendGoalEvent } from '../src/symphony/goal-event-journal.js';
import {
  buildGoalNextAction
} from '../src/symphony/goal-next-action-resolver.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';

const GOAL_ID = 'v21-goal-event-registration-workbench';
const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json';
const GENERATED_AT = '2026-05-31T00:06:32.754Z';
const TASK_IDS = Object.freeze(['task-1', 'task-2', 'task-3', 'task-4', 'task-5']);
const RELEASE_GATES_WITHOUT_TAG = Object.freeze([
  'release.pnpm-check',
  'release.pnpm-test',
  'release.workbench-build',
  'release.mutation-gate',
  'release.audit-high',
  'release.diff-check',
  'release.mcas-doctor',
  'release.docs-updated'
]);

describe('v21 release-ready boundary without release.tag-evidence', () => {
  it('lets goal next complete when listed release gates pass and release.ready is declared', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v21-next-no-tag-gate-'));
    const stateDir = join(root, '.symphony');

    try {
      await registerV21Runbook({ stateDir });
      await appendCompleteV21Evidence({ stateDir });

      const nextAction = await buildGoalNextAction({
        stateDir,
        goalId: GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assert.equal(nextAction.contractName, 'goal-next-action.v1');
      assert.equal(nextAction.goalId, GOAL_ID);
      assert.equal(nextAction.status, 'complete');
      assert.equal(nextAction.next, null);
      assert.equal(nextAction.reason, 'release.ready-declared is recorded and all runbook release gates have passed.');
      assert.deepEqual(nextAction.copyOnlyCommands, []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('reports closeout releaseReady true while tagEvidence remains unknown when the runbook omits that gate', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v21-closeout-no-tag-gate-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      await registerV21Runbook({ stateDir });
      await appendCompleteV21Evidence({ stateDir });

      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'closeout',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const closeout = JSON.parse(output.stdoutText());

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.equal(closeout.contractName, 'goal-closeout-report.v1');
      assert.equal(closeout.goalId, GOAL_ID);
      assert.equal(closeout.summary.workerEvidenceComplete, true);
      assert.equal(closeout.summary.reviewEvidenceComplete, true);
      assert.equal(closeout.summary.mainVerificationComplete, true);
      assert.equal(closeout.summary.releaseReady, true);
      assert.equal(closeout.summary.releaseReadySource, 'goal-event-log.v1:evt_v21_release_ready_declared');
      assert.equal(closeout.releaseGates.tagEvidence, 'unknown');
      assert.equal(closeout.missing.length, 0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

async function registerV21Runbook({ stateDir }) {
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

async function appendCompleteV21Evidence({ stateDir }) {
  for (const taskId of TASK_IDS) {
    await appendTaskLifecycle({
      stateDir,
      taskId
    });
  }

  for (const gateName of RELEASE_GATES_WITHOUT_TAG) {
    await appendReleaseGate({
      stateDir,
      gateName
    });
  }

  await appendReleaseReady({ stateDir });
}

async function appendTaskLifecycle({ stateDir, taskId }) {
  const safeTaskId = taskId.replaceAll('-', '_');

  for (const event of [
    {
      eventId: `evt_v21_${safeTaskId}_worker_evidence`,
      eventType: 'worker.evidence-recorded',
      phase: 'implement',
      actor: {
        role: 'worker',
        id: `codex-v21-${taskId}-worker`
      },
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: `docs/plans/v21-${taskId}-worker-evidence-2026-05-29.md`,
        label: `${taskId} worker evidence`
      }],
      statement: `${taskId} worker evidence recorded.`
    },
    {
      eventId: `evt_v21_${safeTaskId}_reviewer_approved`,
      eventType: 'reviewer.approved',
      phase: 'review',
      actor: {
        role: 'reviewer',
        id: `codex-v21-${taskId}-reviewer`
      },
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: `docs/plans/v21-${taskId}-review-evidence-2026-05-29.md`,
        label: `${taskId} review evidence`
      }],
      statement: `${taskId} reviewer approved.`,
      review: {
        verdict: 'APPROVED'
      }
    },
    {
      eventId: `evt_v21_${safeTaskId}_main_verified`,
      eventType: 'main.verification-passed',
      phase: 'main-verification',
      actor: {
        role: 'main-verifier',
        id: `codex-v21-${taskId}-main-verifier`
      },
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: `docs/plans/v21-${taskId}-main-verification-evidence-2026-05-29.md`,
        label: `${taskId} main verification evidence`
      }],
      statement: `${taskId} main verification passed.`,
      gate: {
        name: 'main-verification',
        status: 'passed'
      }
    }
  ]) {
    await appendGoalEvent({
      stateDir,
      mode: 'confirm',
      recordedAt: GENERATED_AT,
      event: {
        goalId: GOAL_ID,
        taskId,
        occurredAt: GENERATED_AT,
        branch: null,
        commit: null,
        ...event
      }
    });
  }
}

async function appendReleaseGate({ stateDir, gateName }) {
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    recordedAt: GENERATED_AT,
    event: {
      eventId: `evt_v21_${gateName.replaceAll('.', '_').replaceAll('-', '_')}_passed`,
      goalId: GOAL_ID,
      taskId: null,
      eventType: 'release.gate-passed',
      phase: 'release-gate',
      actor: {
        role: 'release-verifier',
        id: 'codex-v21-release-manager'
      },
      occurredAt: GENERATED_AT,
      branch: null,
      commit: null,
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: 'docs/plans/v21-release-evidence-2026-05-29.md',
        label: `${gateName} evidence`
      }],
      statement: `Release gate ${gateName} passed.`,
      gate: {
        name: gateName,
        status: 'passed'
      }
    }
  });
}

async function appendReleaseReady({ stateDir }) {
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    recordedAt: GENERATED_AT,
    event: {
      eventId: 'evt_v21_release_ready_declared',
      goalId: GOAL_ID,
      taskId: null,
      eventType: 'release.ready-declared',
      phase: 'release-prep',
      actor: {
        role: 'release-manager',
        id: 'codex-v21-release-manager'
      },
      occurredAt: GENERATED_AT,
      branch: null,
      commit: null,
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: 'docs/plans/v21-release-evidence-2026-05-29.md',
        label: 'Release ready evidence'
      }],
      statement: 'Release readiness declared.',
      gate: {
        name: 'release.ready',
        status: 'declared'
      }
    }
  });
}

function createOutput() {
  let stdoutText = '';
  let stderrText = '';

  return {
    stdout: {
      write(chunk) {
        stdoutText += chunk;
      }
    },
    stderr: {
      write(chunk) {
        stderrText += chunk;
      }
    },
    stdoutText() {
      return stdoutText;
    },
    stderrText() {
      return stderrText;
    }
  };
}
