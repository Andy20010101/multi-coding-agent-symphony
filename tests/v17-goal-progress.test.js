import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import {
  DEFAULT_GOAL_PROGRESS_GOAL_ID,
  buildGoalProgressLedger,
  validateGoalProgressLedgerContract
} from '../src/symphony/goal-progress-ledger.js';

describe('v17 goal progress resolver and CLI', () => {
  it('returns a safe planned ledger when no goal state pointer exists', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v17-goal-empty-'));

    try {
      const ledger = await buildGoalProgressLedger({
        stateDir: join(root, '.symphony'),
        generatedAt: '2026-05-28T00:00:00.000Z'
      });

      assert.deepEqual(validateGoalProgressLedgerContract(ledger), {
        ok: true,
        errors: []
      });
      assert.equal(ledger.goalId, DEFAULT_GOAL_PROGRESS_GOAL_ID);
      assert.equal(ledger.summary.totalTasks, 10);
      assert.equal(ledger.tasks.every((task) => task.status === 'planned'), true);
      assert.equal(ledger.releaseGates.pnpmCheck, 'unknown');
      assert.equal(ledger.safety.readOnly, true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('uses explicit review and verification evidence instead of task names or branches', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v17-goal-state-'));
    const stateDir = join(root, '.symphony');

    try {
      await writeGoalState(stateDir, {
        tasks: [{
          taskId: 'task-1',
          status: 'approved',
          statusSource: 'test-state-without-review',
          reviewVerdict: 'APPROVED',
          branch: 'merged-approved-by-name-only'
        }, {
          taskId: 'task-2',
          reviewVerdict: 'APPROVED',
          reviewEvidenceRef: 'docs/plans/v17-task2-reviewer-approval-2026-05-28.md'
        }, {
          taskId: 'task-3',
          reviewVerdict: 'NEEDS_REVISION',
          reviewEvidenceRef: 'docs/plans/v17-task3-reviewer-needs-revision-2026-05-28.md'
        }, {
          taskId: 'task-4',
          status: 'main-verified',
          mainVerificationRef: 'docs/plans/v17-task4-main-verification-2026-05-28.md'
        }, {
          taskId: 'task-5',
          blockers: [{
            reason: 'review evidence is missing',
            severity: 'warning'
          }]
        }],
        releaseGates: {
          pnpmCheck: 'passed',
          pnpmTest: 'passed',
          workbenchBuild: 'passed',
          mutationGate: 'passed',
          auditHigh: 'passed',
          diffCheck: 'passed',
          mcasDoctor: 'passed',
          docsUpdated: 'passed',
          tagEvidence: 'passed'
        },
        releaseEvidenceRef: 'docs/plans/v17-final-release-review-evidence-2026-05-28.md'
      });

      const ledger = await buildGoalProgressLedger({
        stateDir,
        generatedAt: '2026-05-28T00:00:00.000Z'
      });

      assert.equal(ledger.tasks.find((task) => task.taskId === 'task-1').status, 'unknown');
      assert.equal(ledger.tasks.find((task) => task.taskId === 'task-2').status, 'approved');
      assert.equal(ledger.tasks.find((task) => task.taskId === 'task-3').status, 'needs-revision');
      assert.equal(ledger.tasks.find((task) => task.taskId === 'task-4').status, 'release-ready');
      assert.equal(ledger.tasks.find((task) => task.taskId === 'task-5').status, 'blocked');
      assert.equal(ledger.summary.releaseReady, true);
      assert.equal(ledger.blockers.some((blocker) => blocker.taskId === 'task-5'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('prints human, JSON, and markdown goal status without modifying state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v17-goal-cli-'));
    const stateDir = join(root, '.symphony');

    try {
      await writeGoalState(stateDir, {
        tasks: [{
          taskId: 'task-1',
          reviewVerdict: 'APPROVED',
          reviewEvidenceRef: 'docs/plans/v17-task1-reviewer-approval-2026-05-28.md'
        }]
      });
      const before = await snapshotDirectoryFiles(stateDir);

      const human = createOutput();
      const humanExit = await runSymphonyCli({
        argv: ['goal-status', '--state-dir', stateDir],
        stdout: human.stdout,
        stderr: human.stderr
      });

      assert.equal(humanExit, 0);
      assert.match(human.stdoutText(), /Goal: v17 Read-only Goal Progress Ledger/u);
      assert.match(human.stdoutText(), /task-1 approved/u);

      const json = createOutput();
      const jsonExit = await runSymphonyCli({
        argv: ['goal-status', '--state-dir', stateDir, '--json'],
        stdout: json.stdout,
        stderr: json.stderr
      });

      assert.equal(jsonExit, 0);
      assert.equal(JSON.parse(json.stdoutText()).contractName, 'goal-progress-ledger.v1');

      const markdown = createOutput();
      const markdownExit = await runSymphonyCli({
        argv: ['progress', '--state-dir', stateDir, '--markdown'],
        stdout: markdown.stdout,
        stderr: markdown.stderr
      });

      assert.equal(markdownExit, 0);
      assert.match(markdown.stdoutText(), /\| Task \| Status \| Review \|/u);
      assert.match(markdown.stdoutText(), /Next Copy-only Commands/u);

      const unknown = createOutput();
      const unknownExit = await runSymphonyCli({
        argv: ['goal-status', '--state-dir', stateDir, '--goal', '../package.json', '--json'],
        stdout: unknown.stdout,
        stderr: unknown.stderr
      });

      assert.equal(unknownExit, 64);
      assert.match(unknown.stderrText(), /goal not found/u);
      assert.doesNotMatch(unknown.stderrText(), /\/Users\/|multi-coding-agent-symphony/u);
      assert.deepEqual(await snapshotDirectoryFiles(stateDir), before);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

async function writeGoalState(stateDir, state) {
  await writeFixtureJson(join(stateDir, 'goals', `${DEFAULT_GOAL_PROGRESS_GOAL_ID}.json`), {
    contractName: 'symphony.goal-progress-state',
    contractVersion: '1',
    goalId: DEFAULT_GOAL_PROGRESS_GOAL_ID,
    ...state
  });
}

async function writeFixtureJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function snapshotDirectoryFiles(root) {
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(path);
        continue;
      }

      if (entry.isFile()) {
        files.push([
          relative(root, path).replaceAll('\\', '/'),
          await readFile(path, 'utf8')
        ]);
      }
    }
  }

  await visit(root);

  return files.sort(([left], [right]) => left.localeCompare(right));
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
