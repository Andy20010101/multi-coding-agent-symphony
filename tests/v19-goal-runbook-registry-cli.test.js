import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import {
  getManagedActiveGoalPointerPath,
  getManagedGoalRunbookPath,
  readManagedActiveGoalPointer,
  readManagedGoalRunbookState
} from '../src/symphony/goal-runbook-registry.js';

const GOAL_ID = 'v19-fixture';
const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.valid.v1.json';

describe('v19 symphony goal init CLI', () => {
  it('prints a goal-runbook-init-plan.v1 dry-run without writing managed state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-init-dry-run-'));
    const stateDir = join(root, '.symphony');

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'init',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--from-json',
          RUNBOOK_FIXTURE,
          '--dry-run',
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const plan = JSON.parse(output.stdoutText());

      assert.equal(plan.contractName, 'goal-runbook-init-plan.v1');
      assert.equal(plan.contractVersion, 1);
      assert.equal(plan.mode, 'dry-run');
      assert.equal(plan.goalId, GOAL_ID);
      assert.match(plan.planHash, /^sha256:[a-f0-9]{64}$/u);
      assert.equal(plan.command.name, 'symphony goal init');
      assert.equal(plan.command.intent, 'register-managed-goal-runbook');
      assert.equal(plan.source.ref, RUNBOOK_FIXTURE);
      assert.equal(plan.source.runbookGoalId, 'v19-goal-runbook-next-action');
      assert.equal(plan.runbook.contractName, 'goal-runbook.v1');
      assert.deepEqual(plan.runbook.taskIds, ['task-1', 'task-2']);
      assert.equal(plan.writeIntent.managedOnly, true);
      assert.equal(plan.writeIntent.writesInDryRun, false);
      assert.deepEqual(
        plan.writeIntent.targets.map((target) => target.kind),
        ['runbook-state', 'latest-active-goal-pointer']
      );
      assert.equal(plan.stateRefs.runbookState.path, getManagedGoalRunbookPath({ stateDir, goalId: GOAL_ID }));
      assert.equal(plan.stateRefs.latestActiveGoalPointer.path, getManagedActiveGoalPointerPath({ stateDir }));
      assert.match(plan.confirm.copyOnlyCommand, /symphony goal init --goal v19-fixture/u);
      assert.match(plan.confirm.copyOnlyCommand, /--confirm --plan-hash sha256:[a-f0-9]{64}/u);
      assert.equal(plan.safety.arbitraryPathReadAvailable, false);
      assert.equal(plan.safety.modelInvocationAvailable, false);
      assert.equal(await pathExists(getManagedGoalRunbookPath({ stateDir, goalId: GOAL_ID })), false);
      assert.equal(await pathExists(getManagedActiveGoalPointerPath({ stateDir })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('confirms only when the plan hash matches and writes managed runbook state plus active pointer', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-init-confirm-'));
    const stateDir = join(root, '.symphony');
    const baseArgs = [
      'goal',
      'init',
      '--state-dir',
      stateDir,
      '--goal',
      GOAL_ID,
      '--from-json',
      RUNBOOK_FIXTURE
    ];

    try {
      const dryRun = createOutput();
      const dryRunExit = await runSymphonyCli({
        argv: [...baseArgs, '--dry-run', '--json'],
        stdout: dryRun.stdout,
        stderr: dryRun.stderr
      });
      const plan = JSON.parse(dryRun.stdoutText());

      assert.equal(dryRunExit, 0);

      const confirm = createOutput();
      const confirmExit = await runSymphonyCli({
        argv: [...baseArgs, '--confirm', '--plan-hash', plan.planHash, '--json'],
        stdout: confirm.stdout,
        stderr: confirm.stderr
      });

      assert.equal(confirmExit, 0);
      assert.equal(confirm.stderrText(), '');

      const result = JSON.parse(confirm.stdoutText());
      const state = await readManagedGoalRunbookState({ stateDir, goalId: GOAL_ID });
      const pointer = await readManagedActiveGoalPointer({ stateDir });

      assert.equal(result.contractName, 'goal-runbook-init-result.v1');
      assert.equal(result.status, 'registered');
      assert.equal(result.written, true);
      assert.equal(result.goalId, GOAL_ID);
      assert.equal(result.planHash, plan.planHash);
      assert.equal(result.state.runbookState, 'written');
      assert.equal(result.state.latestActiveGoalPointer, 'written');
      assert.equal(state.contractName, 'managed-goal-runbook-state.v1');
      assert.equal(state.goalId, GOAL_ID);
      assert.equal(state.planHash, plan.planHash);
      assert.equal(state.runbook.contractName, 'goal-runbook.v1');
      assert.equal(state.runbook.goalId, GOAL_ID);
      assert.equal(pointer.contractName, 'managed-active-goal-pointer.v1');
      assert.equal(pointer.goalId, GOAL_ID);
      assert.equal(pointer.planHash, plan.planHash);
      assert.equal(pointer.runbookStateRef, getManagedGoalRunbookPath({ stateDir, goalId: GOAL_ID }));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('treats retrying the same confirmed plan as idempotent', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-init-idempotent-'));
    const stateDir = join(root, '.symphony');
    const baseArgs = [
      'goal',
      'init',
      '--state-dir',
      stateDir,
      '--goal',
      GOAL_ID,
      '--from-json',
      RUNBOOK_FIXTURE
    ];

    try {
      const dryRun = createOutput();
      await runSymphonyCli({
        argv: [...baseArgs, '--dry-run', '--json'],
        stdout: dryRun.stdout,
        stderr: dryRun.stderr
      });
      const plan = JSON.parse(dryRun.stdoutText());

      const first = createOutput();
      const firstExit = await runSymphonyCli({
        argv: [...baseArgs, '--confirm', '--plan-hash', plan.planHash, '--json'],
        stdout: first.stdout,
        stderr: first.stderr
      });
      const statePath = getManagedGoalRunbookPath({ stateDir, goalId: GOAL_ID });
      const pointerPath = getManagedActiveGoalPointerPath({ stateDir });
      const stateBeforeRetry = await readFile(statePath, 'utf8');
      const pointerBeforeRetry = await readFile(pointerPath, 'utf8');

      const retry = createOutput();
      const retryExit = await runSymphonyCli({
        argv: [...baseArgs, '--confirm', '--plan-hash', plan.planHash, '--json'],
        stdout: retry.stdout,
        stderr: retry.stderr
      });
      const retryResult = JSON.parse(retry.stdoutText());

      assert.equal(firstExit, 0);
      assert.equal(retryExit, 0);
      assert.equal(retryResult.status, 'already-registered');
      assert.equal(retryResult.written, false);
      assert.equal(retryResult.state.runbookState, 'unchanged');
      assert.equal(retryResult.state.latestActiveGoalPointer, 'unchanged');
      assert.equal(await readFile(statePath, 'utf8'), stateBeforeRetry);
      assert.equal(await readFile(pointerPath, 'utf8'), pointerBeforeRetry);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('refuses mismatched plan hashes without writing managed state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-init-mismatch-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'init',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--from-json',
          RUNBOOK_FIXTURE,
          '--confirm',
          '--plan-hash',
          'sha256:0000000000000000000000000000000000000000000000000000000000000000',
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 64);
      assert.match(output.stderrText(), /plan hash does not match/u);
      assert.equal(await pathExists(getManagedGoalRunbookPath({ stateDir, goalId: GOAL_ID })), false);
      assert.equal(await pathExists(getManagedActiveGoalPointerPath({ stateDir })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects markdown sources, arbitrary JSON paths, and output paths without writing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-init-reject-'));
    const stateDir = join(root, '.symphony');
    const outsideRunbook = join(root, 'goal-runbook.valid.v1.json');

    try {
      await writeFile(outsideRunbook, '{}\n', 'utf8');

      const cases = [
        {
          name: 'markdown plan',
          args: ['--from', 'docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md'],
          message: /does not parse markdown paths/u
        },
        {
          name: 'absolute json path',
          args: ['--from-json', outsideRunbook],
          message: /controlled goal-runbook fixture/u
        },
        {
          name: 'output path',
          args: ['--from-json', RUNBOOK_FIXTURE, '--output', join(root, 'out.json')],
          message: /writes only managed runbook state/u
        }
      ];

      for (const testCase of cases) {
        const output = createOutput();
        const exitCode = await runSymphonyCli({
          argv: [
            'goal',
            'init',
            '--state-dir',
            stateDir,
            '--goal',
            GOAL_ID,
            ...testCase.args,
            '--dry-run',
            '--json'
          ],
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 64, testCase.name);
        assert.match(output.stderrText(), testCase.message, testCase.name);
        assert.doesNotMatch(output.stderrText(), /\/Users\/andy|multi-coding-agent-symphony/u);
      }

      assert.equal(await pathExists(getManagedGoalRunbookPath({ stateDir, goalId: GOAL_ID })), false);
      assert.equal(await pathExists(getManagedActiveGoalPointerPath({ stateDir })), false);
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

async function pathExists(path) {
  try {
    await readFile(path, 'utf8');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}
