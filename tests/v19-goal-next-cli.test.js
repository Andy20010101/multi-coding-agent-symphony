import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { appendGoalEvent } from '../src/symphony/goal-event-journal.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';

const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.valid.v1.json';
const FIXTURE_GOAL_ID = 'v19-fixture';
const MANAGED_GOAL_ID = 'v19-cli-managed';
const GENERATED_AT = '2026-05-29T10:00:00.000Z';

describe('v19 goal next, goal closeout, and symphony next CLI', () => {
  it('prints goal-next-action.v1 JSON for the controlled fixture without requiring registry writes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-next-fixture-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'next',
          '--state-dir',
          stateDir,
          '--goal',
          FIXTURE_GOAL_ID,
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const nextAction = JSON.parse(output.stdoutText());

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.equal(nextAction.contractName, 'goal-next-action.v1');
      assert.equal(nextAction.goalId, FIXTURE_GOAL_ID);
      assert.equal(nextAction.status, 'action-required');
      assert.equal(nextAction.next.taskId, 'task-1');
      assert.equal(nextAction.next.role, 'worker');
      assert.equal(nextAction.copyOnlyCommands.includes('pnpm check'), true);
      assert.equal(nextAction.safety.modelInvocationAvailable, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('resolves latest goal next markdown from the active managed runbook pointer', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-next-latest-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      await registerRunbook({ stateDir, goalId: MANAGED_GOAL_ID });

      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'next',
          '--state-dir',
          stateDir,
          '--goal',
          'latest',
          '--markdown'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const markdown = output.stdoutText();

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.match(markdown, /^# Goal Next Action/u);
      assert.match(markdown, new RegExp(`Goal: \`${MANAGED_GOAL_ID}\``, 'u'));
      assert.match(markdown, /Task: `task-1`/u);
      assert.match(markdown, /Role: `worker`/u);
      assert.match(markdown, /symphony goal prompt --goal v19-cli-managed --next --markdown/u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('prints goal-closeout-report.v1 JSON with missing evidence and release gate gaps', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-closeout-fixture-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'closeout',
          '--state-dir',
          stateDir,
          '--goal',
          FIXTURE_GOAL_ID,
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const closeout = JSON.parse(output.stdoutText());

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.equal(closeout.contractName, 'goal-closeout-report.v1');
      assert.equal(closeout.goalId, FIXTURE_GOAL_ID);
      assert.equal(closeout.summary.totalTasks, 2);
      assert.equal(closeout.summary.workerEvidenceComplete, false);
      assert.equal(closeout.summary.reviewEvidenceComplete, false);
      assert.equal(closeout.summary.mainVerificationComplete, false);
      assert.equal(closeout.summary.releaseReady, false);
      assert.equal(closeout.releaseGates.tagEvidence, 'missing');
      assert.equal(closeout.missing.some((item) => item.kind === 'worker-evidence' && item.taskId === 'task-1'), true);
      assert.equal(closeout.missing.some((item) => item.kind === 'release-gate' && item.gateId === 'pnpmCheck'), true);
      assert.equal(closeout.safety.releaseReadyRequiresEvidence, true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('does not treat passed check and test gates as release-ready closeout', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-closeout-gates-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      await registerRunbook({ stateDir, goalId: MANAGED_GOAL_ID });
      await appendReleaseGate({ stateDir, goalId: MANAGED_GOAL_ID, eventId: 'evt_release_pnpm_check_passed', gateName: 'release.pnpm-check' });
      await appendReleaseGate({ stateDir, goalId: MANAGED_GOAL_ID, eventId: 'evt_release_pnpm_test_passed', gateName: 'release.pnpm-test' });

      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'closeout',
          '--state-dir',
          stateDir,
          '--goal',
          MANAGED_GOAL_ID,
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const closeout = JSON.parse(output.stdoutText());

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.equal(closeout.releaseGates.pnpmCheck, 'passed');
      assert.equal(closeout.releaseGates.pnpmTest, 'passed');
      assert.equal(closeout.summary.releaseReady, false);
      assert.equal(closeout.missing.some((item) => item.kind === 'release-gate' && item.gateId === 'tagEvidence'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('makes symphony next prefer active goal next action when an active goal exists', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-symphony-next-goal-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      await registerRunbook({ stateDir, goalId: MANAGED_GOAL_ID });

      const exitCode = await runSymphonyCli({
        argv: [
          'next',
          '--state-dir',
          stateDir,
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const summary = JSON.parse(output.stdoutText());

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.equal(summary.contractName, 'symphony.product-summary');
      assert.equal(summary.nextSource, 'goal-next-action');
      assert.equal(summary.activeGoal.goalId, MANAGED_GOAL_ID);
      assert.equal(summary.goalNextAction.contractName, 'goal-next-action.v1');
      assert.equal(summary.goalNextAction.next.taskId, 'task-1');
      assert.equal(summary.nextAction, `symphony goal prompt --goal ${MANAGED_GOAL_ID} --next --markdown`);
      assert.equal(typeof summary.stageSummary.nextAction, 'string');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps symphony next Stage summary fallback when no active goal exists', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-symphony-next-stage-'));
    const stateDir = join(root, '.symphony');
    const stageOutput = createOutput();
    const nextOutput = createOutput();

    try {
      const stageExit = await runSymphonyCli({
        argv: [
          'stage',
          'summary',
          '--state-dir',
          stateDir,
          '--json'
        ],
        stdout: stageOutput.stdout,
        stderr: stageOutput.stderr
      });
      const nextExit = await runSymphonyCli({
        argv: [
          'next',
          '--state-dir',
          stateDir,
          '--json'
        ],
        stdout: nextOutput.stdout,
        stderr: nextOutput.stderr
      });
      const stageSummary = JSON.parse(stageOutput.stdoutText());
      const nextSummary = JSON.parse(nextOutput.stdoutText());

      assert.equal(stageExit, 0);
      assert.equal(nextExit, 0);
      assert.equal(stageOutput.stderrText(), '');
      assert.equal(nextOutput.stderrText(), '');
      assert.equal(nextSummary.nextSource, 'stage-summary');
      assert.equal(nextSummary.activeGoal, null);
      assert.equal(nextSummary.goalNextAction, null);
      assert.equal(nextSummary.status, stageSummary.status);
      assert.equal(nextSummary.stageId, stageSummary.stageId);
      assert.deepEqual(nextSummary.stage, stageSummary.stage);
      assert.equal(nextSummary.nextAction, stageSummary.nextAction);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

async function registerRunbook({ stateDir, goalId }) {
  const plan = await buildGoalRunbookInitPlan({
    stateDir,
    goalId,
    fromJson: RUNBOOK_FIXTURE
  });

  await confirmGoalRunbookInit({
    stateDir,
    goalId,
    fromJson: RUNBOOK_FIXTURE,
    planHash: plan.planHash
  });
}

async function appendReleaseGate({ stateDir, goalId, eventId, gateName }) {
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    recordedAt: GENERATED_AT,
    event: {
      eventId,
      goalId,
      taskId: 'release',
      eventType: 'release.gate-passed',
      phase: 'release-gate',
      actor: {
        role: 'release-manager',
        id: 'codex-release-manager'
      },
      occurredAt: GENERATED_AT,
      branch: null,
      commit: null,
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: 'docs/plans/v19-closeout-evidence-2026-05-29.md',
        label: `${gateName} evidence`
      }],
      statement: `${gateName} passed with explicit evidence.`,
      gate: {
        id: gateName,
        status: 'passed'
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
