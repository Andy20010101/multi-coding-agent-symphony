import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import {
  appendGoalEvent,
  getManagedGoalEventJournalPath,
  readGoalEventJournal
} from '../src/symphony/goal-event-journal.js';

const GOAL_ID = 'v18-goal-event-journal-evidence-recorder';
const REVIEW_EVIDENCE = 'docs/plans/v18-task1-review-evidence-2026-05-28.md';
const WORKER_EVIDENCE = 'docs/plans/v18-task1-worker-evidence-2026-05-28.md';

describe('v18 symphony goal review CLI', () => {
  it('prints an approved goal-update-plan.v1 dry-run without writing the journal', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-review-dry-run-'));
    const stateDir = join(root, '.symphony');

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'review',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--task',
          'task-1',
          '--reviewer',
          'codex-reviewer-task-1',
          '--verdict',
          'approved',
          '--evidence-ref',
          REVIEW_EVIDENCE,
          '--dry-run'
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
      assert.equal(plan.command.name, 'symphony goal review');
      assert.equal(plan.command.intent, 'record-review-verdict');
      assert.equal(plan.actor.role, 'reviewer');
      assert.equal(plan.actor.id, 'codex-reviewer-task-1');
      assert.deepEqual(plan.proposedEvents.map((event) => event.eventType), ['reviewer.approved']);
      assert.equal(plan.proposedEvents[0].requiresEvidence, true);
      assert.deepEqual(plan.proposedEvents[0].evidenceRefs.map((ref) => ref.ref), [REVIEW_EVIDENCE]);
      assert.equal(plan.preconditions[0].id, 'reviewer-is-not-worker');
      assert.equal(plan.wouldAppend.writesInDryRun, false);
      assert.equal(plan.safety.workbenchWriteAvailable, false);
      assert.match(plan.confirm.copyOnlyCommand, /goal review .*--verdict approved .*--confirm --plan-hash sha256:[a-f0-9]{64}/u);
      assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('accepts only controlled docs/plans and managed artifact review evidence refs', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-review-controlled-evidence-'));
    const stateDir = join(root, '.symphony');

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'review',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--task',
          'task-1',
          '--reviewer',
          'codex-reviewer-task-1',
          '--verdict',
          'approved',
          '--evidence-ref',
          'repo-doc:docs/plans/v18-task1-review-evidence-2026-05-28.md',
          '--evidence-ref',
          'artifact-ref:artifact:run-1:review',
          '--dry-run'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const plan = JSON.parse(output.stdoutText());

      assert.deepEqual(plan.proposedEvents[0].evidenceRefs.map((ref) => [ref.kind, ref.ref]), [
        ['repo-doc', 'docs/plans/v18-task1-review-evidence-2026-05-28.md'],
        ['artifact-ref', 'artifact:run-1:review']
      ]);
      assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('confirms only when the plan hash matches and appends a needs-revision reviewer event', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-review-confirm-'));
    const stateDir = join(root, '.symphony');
    const baseArgs = [
      'goal',
      'review',
      '--state-dir',
      stateDir,
      '--goal',
      GOAL_ID,
      '--task',
      'task-1',
      '--reviewer',
      'codex-reviewer-task-1',
      '--verdict',
      'needs-revision',
      '--evidence-ref',
      REVIEW_EVIDENCE
    ];

    try {
      await appendWorkerEvent({ stateDir, actorId: 'codex-worker-task-1' });

      const dryRun = createOutput();
      const dryRunExit = await runSymphonyCli({
        argv: [...baseArgs, '--dry-run'],
        stdout: dryRun.stdout,
        stderr: dryRun.stderr
      });
      const plan = JSON.parse(dryRun.stdoutText());

      assert.equal(dryRunExit, 0);

      const confirm = createOutput();
      const confirmExit = await runSymphonyCli({
        argv: [...baseArgs, '--confirm', '--plan-hash', plan.planHash],
        stdout: confirm.stdout,
        stderr: confirm.stderr
      });

      assert.equal(confirmExit, 0);
      assert.equal(confirm.stderrText(), '');

      const result = JSON.parse(confirm.stdoutText());

      assert.equal(result.mode, 'confirm');
      assert.equal(result.status, 'appended');
      assert.equal(result.written, true);
      assert.equal(result.event.eventType, 'reviewer.needs-revision');

      const journal = await readGoalEventJournal({ stateDir, goalId: GOAL_ID });

      assert.equal(journal.log.eventCount, 2);
      assert.deepEqual(journal.events.map((event) => event.eventType), [
        'worker.self-check-passed',
        'reviewer.needs-revision'
      ]);
      assert.equal(journal.events[1].actor.role, 'reviewer');
      assert.equal(journal.events[1].actor.id, 'codex-reviewer-task-1');
      assert.equal(journal.events[1].review.verdict, 'NEEDS_REVISION');
      assert.deepEqual(journal.events[1].evidenceRefs.map((ref) => ref.ref), [REVIEW_EVIDENCE]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('requires reviewer evidence before dry-run or confirm can write', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-review-missing-evidence-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'review',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--task',
          'task-1',
          '--reviewer',
          'codex-reviewer-task-1',
          '--verdict',
          'approved',
          '--dry-run'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 64);
      assert.match(output.stderrText(), /evidence ref is required/u);
      assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('requires an explicit verdict instead of inferring from the evidence ref', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-review-missing-verdict-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'review',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--task',
          'task-1',
          '--reviewer',
          'codex-reviewer-task-1',
          '--evidence-ref',
          'docs/plans/v18-task1-approved-review-evidence-2026-05-28.md',
          '--dry-run'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 64);
      assert.match(output.stderrText(), /goal review requires --verdict/u);
      assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects uncontrolled review evidence refs without writing', async () => {
    const cases = [
      'command-evidence:approved-looking-note',
      'external-note:approved',
      'commit:abc1234'
    ];

    for (const evidenceRef of cases) {
      const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-review-reject-evidence-'));
      const stateDir = join(root, '.symphony');
      const output = createOutput();

      try {
        const exitCode = await runSymphonyCli({
          argv: [
            'goal',
            'review',
            '--state-dir',
            stateDir,
            '--goal',
            GOAL_ID,
            '--task',
            'task-1',
            '--reviewer',
            'codex-reviewer-task-1',
            '--verdict',
            'approved',
            '--evidence-ref',
            evidenceRef,
            '--dry-run'
          ],
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 64, evidenceRef);
        assert.match(output.stderrText(), /controlled docs\/plans or managed artifact reference/u, evidenceRef);
        assert.doesNotMatch(output.stderrText(), /\/Users\/andy|multi-coding-agent-symphony/u);
        assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  });

  it('rejects a reviewer id that matches the latest worker id for the same task', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-review-worker-conflict-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      await appendWorkerEvent({ stateDir, actorId: 'codex-worker-task-1' });

      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'review',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--task',
          'task-1',
          '--reviewer',
          'codex-worker-task-1',
          '--verdict',
          'approved',
          '--evidence-ref',
          REVIEW_EVIDENCE,
          '--dry-run'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 64);
      assert.match(output.stderrText(), /Reviewer id must differ/u);

      const journal = await readGoalEventJournal({ stateDir, goalId: GOAL_ID });

      assert.equal(journal.log.eventCount, 1);
      assert.deepEqual(journal.events.map((event) => event.eventType), ['worker.self-check-passed']);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('refuses a mismatched plan hash without writing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-goal-review-mismatch-'));
    const stateDir = join(root, '.symphony');
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'goal',
          'review',
          '--state-dir',
          stateDir,
          '--goal',
          GOAL_ID,
          '--task',
          'task-1',
          '--reviewer',
          'codex-reviewer-task-1',
          '--verdict',
          'approved',
          '--evidence-ref',
          REVIEW_EVIDENCE,
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
});

async function appendWorkerEvent({ stateDir, actorId }) {
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    event: {
      eventId: `evt_${actorId}_self_check`,
      goalId: GOAL_ID,
      taskId: 'task-1',
      eventType: 'worker.self-check-passed',
      phase: 'implement',
      actor: {
        role: 'worker',
        id: actorId
      },
      branch: null,
      commit: null,
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: WORKER_EVIDENCE,
        label: 'Task 1 worker evidence'
      }],
      statement: 'Worker self-check passed for task-1.'
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
