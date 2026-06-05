import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { buildSupervisorRunnerPlan } from '../src/symphony/supervisor-runner.js';

const FIXTURE_GOAL_ID = 'v19-fixture';
const GENERATED_AT = '2026-06-05T01:00:00.000Z';

describe('v38 local supervisor runner', () => {
  it('plans a fresh worker controller from goal-next without invoking models or writing state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v38-supervisor-runner-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'supervisor',
          'run',
          '--state-dir',
          stateDir,
          '--goal',
          FIXTURE_GOAL_ID,
          '--max-cycles',
          '3',
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const plan = JSON.parse(output.stdoutText());

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.equal(plan.contractName, 'goal-supervisor-runner-plan.v1');
      assert.equal(plan.mode, 'dry-run');
      assert.equal(plan.maxCycles, 3);
      assert.equal(plan.executedCycles, 1);
      assert.equal(plan.status, 'action-required');
      assert.equal(plan.cycles[0].state, 'next-phase-ready');
      assert.equal(plan.cycles[0].action.kind, 'create-fresh-controller');
      assert.equal(plan.cycles[0].action.command, '/goal dispatch task-1 worker --fresh-controller');
      assert.equal(plan.stopReason, 'controller-not-created-in-dry-run');
      assert.equal(plan.safety.modelInvocationAvailable, false);
      assert.equal(plan.safety.eventRegistrationAvailable, false);
      assert.equal(plan.hooks.some((hook) => hook.name === 'preCreateController'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('plans result consumption only when completed result metadata matches the ledger next action', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v38-supervisor-result-'));

    try {
      const plan = await buildSupervisorRunnerPlan({
        stateDir: join(root, '.symphony'),
        goalId: FIXTURE_GOAL_ID,
        completedThread: 'thread-worker-result',
        resultTaskId: 'task-1',
        resultRole: 'worker',
        resultEvent: 'worker.evidence-recorded',
        evidenceRef: 'docs/plans/task-1-worker-evidence.md',
        generatedAt: GENERATED_AT
      });

      assert.equal(plan.status, 'action-required');
      assert.equal(plan.cycles[0].state, 'result-ready');
      assert.equal(plan.cycles[0].completedResult.threadId, 'thread-worker-result');
      assert.equal(plan.cycles[0].action.kind, 'create-fresh-controller-to-consume-result');
      assert.equal(plan.cycles[0].action.command, '/goal dispatch task-1 worker --fresh-controller');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('blocks completed result metadata that does not match the current task role', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v38-supervisor-result-mismatch-'));

    try {
      const plan = await buildSupervisorRunnerPlan({
        stateDir: join(root, '.symphony'),
        goalId: FIXTURE_GOAL_ID,
        completedThread: 'thread-reviewer-result',
        resultTaskId: 'task-1',
        resultRole: 'reviewer',
        resultEvent: 'reviewer.approved',
        evidenceRef: 'docs/plans/task-1-review-evidence.md',
        generatedAt: GENERATED_AT
      });

      assert.equal(plan.status, 'blocked');
      assert.equal(plan.cycles[0].state, 'blocked');
      assert.equal(plan.cycles[0].action.kind, 'block');
      assert.match(plan.cycles[0].action.reason, /does not match/u);
      assert.equal(plan.stopReason, 'completed-result-does-not-match-next-action');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function createOutput() {
  let stdoutText = '';
  let stderrText = '';

  return {
    stdout: {
      write(chunk) {
        stdoutText += String(chunk);
      }
    },
    stderr: {
      write(chunk) {
        stderrText += String(chunk);
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
