import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { appendGoalEvent } from '../src/symphony/goal-event-journal.js';
import {
  V19_GOAL_RUNBOOK_GOAL_ID,
  buildGoalProgressLedger,
  validateGoalProgressLedgerContract
} from '../src/symphony/goal-progress-ledger.js';

const GENERATED_AT = '2026-05-29T10:00:00.000Z';

describe('v19 goal progress template bootstrap', () => {
  it('resolves v19 goal-status JSON from an existing planning event journal', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-template-'));
    const stateDir = join(root, '.symphony');

    try {
      await appendPlanningEvent(stateDir);

      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: ['goal-status', '--state-dir', stateDir, '--goal', V19_GOAL_RUNBOOK_GOAL_ID, '--json'],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const ledger = JSON.parse(output.stdoutText());

      assert.deepEqual(validateGoalProgressLedgerContract(ledger), {
        ok: true,
        errors: []
      });
      assert.equal(ledger.contractName, 'goal-progress-ledger.v1');
      assert.equal(ledger.goalId, V19_GOAL_RUNBOOK_GOAL_ID);
      assert.equal(ledger.goalTitle, 'Goal Runbook + Next Action Control Center');
      assert.equal(ledger.baseline.tag, 'v18');
      assert.equal(ledger.summary.totalTasks, 8);
      assert.equal(ledger.summary.completedTasks, 0);
      assert.equal(ledger.summary.needsRevisionTasks, 0);
      assert.equal(ledger.summary.releaseReady, false);
      assert.equal(ledger.tasks.some((candidate) => candidate.taskId === 'planning'), false);
      assert.deepEqual(ledger.tasks.map((candidate) => candidate.taskId), [
        'task-1',
        'task-2',
        'task-3',
        'task-4',
        'task-5',
        'task-6',
        'task-7',
        'task-8'
      ]);
      assert.equal(task(ledger, 'task-1').status, 'planned');
      assert.equal(task(ledger, 'task-1').workerEvidenceRef, null);
      assert.equal(task(ledger, 'task-1').reviewEvidenceRef, null);
      assert.equal(task(ledger, 'task-1').reviewVerdict, null);
      assert.equal(task(ledger, 'task-1').mainVerificationRef, null);
      assert.equal(ledger.releaseGates.tagEvidence, 'unknown');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps the v19 planning event from completing implementation tasks in the resolver', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-goal-resolver-'));
    const stateDir = join(root, '.symphony');

    try {
      await appendPlanningEvent(stateDir);

      const ledger = await buildGoalProgressLedger({
        stateDir,
        goalId: V19_GOAL_RUNBOOK_GOAL_ID,
        generatedAt: GENERATED_AT
      });

      assert.deepEqual(validateGoalProgressLedgerContract(ledger), {
        ok: true,
        errors: []
      });
      assert.equal(ledger.summary.completedTasks, 0);
      assert.equal(ledger.summary.releaseReady, false);
      assert.equal(ledger.tasks.every((candidate) => candidate.status === 'planned'), true);
      assert.equal(ledger.tasks.every((candidate) => candidate.statusSource === 'v17-template-no-events'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('still returns goal not found for unknown goals', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v19-unknown-goal-'));
    const stateDir = join(root, '.symphony');

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: ['goal-status', '--state-dir', stateDir, '--goal', 'v19-not-registered', '--json'],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 64);
      assert.equal(output.stdoutText(), '');
      assert.match(output.stderrText(), /goal not found/u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

async function appendPlanningEvent(stateDir) {
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    recordedAt: '2026-05-29T02:14:51.310Z',
    event: {
      eventId: 'evt_79a5cb787d2dc1b7',
      goalId: V19_GOAL_RUNBOOK_GOAL_ID,
      taskId: 'planning',
      eventType: 'worker.evidence-recorded',
      phase: 'implement',
      actor: {
        role: 'worker',
        id: 'codex-v19-planner'
      },
      occurredAt: '2026-05-29T02:14:51.310Z',
      branch: null,
      commit: null,
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: 'docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md',
        label: 'Evidence for docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md'
      }],
      statement: 'Worker evidence recorded for planning.',
      metadata: {
        sourceCommand: 'symphony goal update'
      }
    }
  });
}

function task(ledger, taskId) {
  return ledger.tasks.find((candidate) => candidate.taskId === taskId);
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
