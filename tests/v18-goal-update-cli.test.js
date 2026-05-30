import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import {
  getManagedGoalEventJournalPath,
  readGoalEventJournal
} from '../src/symphony/goal-event-journal.js';

const GOAL_ID = 'v18-goal-event-journal-evidence-recorder';

describe('v18 symphony goal update CLI', () => {
  it('prints a goal-update-plan.v1 dry-run by default without writing the journal', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-update-dry-run-'));
    const stateDir = join(root, '.symphony');

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'update',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--task',
          'task-1',
          '--event',
          'worker.started',
          '--actor',
          'codex-worker-task-1'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const plan = JSON.parse(output.stdoutText());

      assert.equal(plan.contractName, 'goal-update-plan.v1');
      assert.equal(plan.mode, 'dry-run');
      assert.match(plan.planHash, /^sha256:[a-f0-9]{64}$/u);
      assert.equal(plan.command.name, 'symphony goal update');
      assert.equal(plan.actor.role, 'worker');
      assert.equal(plan.actor.id, 'codex-worker-task-1');
      assert.deepEqual(plan.proposedEvents.map((event) => event.eventType), ['worker.started']);
      assert.equal(plan.wouldAppend.writesInDryRun, false);
      assert.equal(plan.safety.workbenchWriteAvailable, false);
      assert.match(plan.confirm.copyOnlyCommand, /--confirm --plan-hash sha256:[a-f0-9]{64}/u);
      assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('confirms only when the plan hash matches and appends a worker event', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-update-confirm-'));
    const stateDir = join(root, '.symphony');
    const baseArgs = [
      'goal',
      'update',
      '--state-dir',
      stateDir,
      '--goal',
      GOAL_ID,
      '--task',
      'task-1',
      '--event',
      'worker.started',
      '--actor',
      'codex-worker-task-1',
      '--dry-run'
    ];

    try {
      const dryRun = createOutput();
      const dryRunExit = await runSymphonyCli({
        argv: baseArgs,
        stdout: dryRun.stdout,
        stderr: dryRun.stderr
      });
      const plan = JSON.parse(dryRun.stdoutText());

      assert.equal(dryRunExit, 0);

      const confirm = createOutput();
      const confirmExit = await runSymphonyCli({
        argv: [
          ...baseArgs.filter((arg) => arg !== '--dry-run'),
          '--confirm',
          '--plan-hash',
          plan.planHash
        ],
        stdout: confirm.stdout,
        stderr: confirm.stderr
      });

      assert.equal(confirmExit, 0);
      assert.equal(confirm.stderrText(), '');

      const result = JSON.parse(confirm.stdoutText());

      assert.equal(result.mode, 'confirm');
      assert.equal(result.status, 'appended');
      assert.equal(result.written, true);
      assert.equal(result.event.eventType, 'worker.started');

      const journal = await readGoalEventJournal({ stateDir, goalId: GOAL_ID });

      assert.equal(journal.log.eventCount, 1);
      assert.deepEqual(journal.events.map((event) => event.eventType), ['worker.started']);
      assert.equal(journal.events[0].actor.role, 'worker');
      assert.equal(journal.events[0].actor.id, 'codex-worker-task-1');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('refuses a mismatched plan hash without writing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-update-mismatch-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'update',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--task',
          'task-1',
          '--event',
          'worker.started',
          '--actor',
          'codex-worker-task-1',
          '--confirm',
          '--plan-hash',
          'sha256:0000000000000000000000000000000000000000000000000000000000000000'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 64);
      assert.match(output.stderrText(), /plan hash does not match/u);
      assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('records worker self-check events without creating reviewer approval', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-update-self-check-'));
    const stateDir = join(root, '.symphony');
    const baseArgs = [
      'goal',
      'update',
      '--state-dir',
      stateDir,
      '--goal',
      GOAL_ID,
      '--task',
      'task-1',
      '--event',
      'worker.self-check-passed',
      '--actor',
      'codex-worker-task-1',
      '--evidence-ref',
      'docs/plans/v18-task1-worker-evidence-2026-05-28.md'
    ];

    try {
      const dryRun = createOutput();
      const dryRunExit = await runSymphonyCli({
        argv: [...baseArgs, '--dry-run'],
        stdout: dryRun.stdout,
        stderr: dryRun.stderr
      });

      assert.equal(dryRunExit, 0);

      const plan = JSON.parse(dryRun.stdoutText());
      const confirm = createOutput();
      const confirmExit = await runSymphonyCli({
        argv: [...baseArgs, '--confirm', '--plan-hash', plan.planHash],
        stdout: confirm.stdout,
        stderr: confirm.stderr
      });

      assert.equal(confirmExit, 0);

      const journal = await readGoalEventJournal({ stateDir, goalId: GOAL_ID });

      assert.deepEqual(journal.events.map((event) => event.eventType), ['worker.self-check-passed']);
      assert.equal(journal.events.some((event) => event.eventType === 'reviewer.approved'), false);
      assert.equal(journal.events[0].review, undefined);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('accepts only controlled docs/plans and managed artifact evidence refs', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-update-controlled-evidence-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'update',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--task',
          'task-1',
          '--event',
          'worker.evidence-recorded',
          '--actor',
          'codex-worker-task-1',
          '--evidence-ref',
          'repo-doc:docs/plans/v18-task1-worker-evidence-2026-05-28.md',
          '--evidence-ref',
          'artifact-ref:artifact:run-1:evidence',
          '--dry-run'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const plan = JSON.parse(output.stdoutText());

      assert.deepEqual(plan.proposedEvents[0].evidenceRefs.map((ref) => [ref.kind, ref.ref]), [
        ['repo-doc', 'docs/plans/v18-task1-worker-evidence-2026-05-28.md'],
        ['artifact-ref', 'artifact:run-1:evidence']
      ]);
      assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects unsupported or unsafe events and evidence refs without writing', async () => {
    const cases = [
      {
        name: 'reviewer event',
        args: ['--event', 'reviewer.approved']
      },
      {
        name: 'unsafe evidence ref',
        args: ['--event', 'worker.self-check-passed', '--evidence-ref', '/Users/example/secret.md']
      },
      {
        name: 'command evidence ref',
        args: ['--event', 'worker.evidence-recorded', '--evidence-ref', 'command-evidence:approved-looking-note']
      },
      {
        name: 'external note ref',
        args: ['--event', 'worker.evidence-recorded', '--evidence-ref', 'external-note:approved']
      },
      {
        name: 'commit evidence ref',
        args: ['--event', 'worker.evidence-recorded', '--evidence-ref', 'commit:abc1234']
      }
    ];

    for (const testCase of cases) {
      const root = await mkdtemp(join(tmpdir(), `symphony-v18-goal-update-reject-${testCase.name.replaceAll(' ', '-')}-`));
      const stateDir = join(root, '.symphony');
      const output = createOutput();

      try {
        const exitCode = await runSymphonyCli({
          argv: [
            'goal',
            'update',
            '--state-dir',
            stateDir,
            '--goal',
            GOAL_ID,
            '--task',
            'task-1',
            ...testCase.args,
            '--actor',
            'codex-worker-task-1',
            '--dry-run'
          ],
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 64, testCase.name);
        if (testCase.name !== 'reviewer event') {
          assert.match(output.stderrText(), /controlled docs\/plans or managed artifact reference/u, testCase.name);
        }
        assert.doesNotMatch(output.stderrText(), /\/Users\/andy|multi-coding-agent-symphony/u);
        assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
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
