import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';

const GOAL_ID = 'v32-release-manager-workspace-v2';
const RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json';

describe('v32 release baseline resolver API', () => {
  it('stops release readiness judgment on dirty non-main checkout and returns fixed command evidence', async () => {
    const context = await startV32ConsoleServer({
      runner: new FakeGitRunner({
        'rev-parse --abbrev-ref HEAD': { stdout: 'v32-task-1-clean-release-baseline-resolver\n' },
        'rev-parse HEAD': { stdout: 'task1234567890\n' },
        'rev-parse main': { stdout: 'mainabcdef123\n' },
        'rev-parse origin/main': { stdout: 'mainabcdef123\n' },
        'status --porcelain=v1': { stdout: ' M frontend/workbench/src/App.jsx\n?? docs/plans/v32-task-1-worker-evidence-2026-06-01.md\n' }
      }),
      env: {
        GITHUB_HEAD_REF: 'v32-task-1-clean-release-baseline-resolver',
        GITHUB_SHA: 'task1234567890'
      }
    });

    try {
      const response = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/release-baseline`);
      const baseline = await response.json();

      assert.equal(response.status, 200);
      assert.equal(baseline.contractName, 'release-baseline-resolver.v1');
      assert.equal(baseline.goalId, GOAL_ID);
      assert.equal(baseline.taskId, 'task-1');
      assert.equal(baseline.role, 'worker');
      assert.equal(baseline.phase, 'implement');
      assert.equal(baseline.status, 'stopped');
      assert.equal(baseline.decision, 'stop-fix-guidance-only');
      assert.equal(baseline.releaseBaseline.currentBranch, 'v32-task-1-clean-release-baseline-resolver');
      assert.equal(baseline.releaseBaseline.mainHead, 'mainabcdef123');
      assert.equal(baseline.releaseBaseline.originMain, 'mainabcdef123');
      assert.equal(baseline.releaseBaseline.worktreeClean, false);
      assert.deepEqual(
        baseline.blockers.map((blocker) => blocker.id),
        ['non-main-branch', 'dirty-worktree']
      );
      assert.equal(baseline.activeContext.activeTaskTitle, 'Clean release baseline resolver');
      assert.equal(baseline.activeContext.activeTaskExpectedWorkerEvent, 'worker.evidence-recorded');
      assert.equal(baseline.safety.genericShellRunner, false);
      assert.equal(baseline.safety.browserExecutionAvailable, false);
      assert.equal(baseline.safety.mergeAvailable, false);
      assert.equal(baseline.safety.pushAvailable, false);
      assert.equal(baseline.safety.tagAvailable, false);
      assert.equal(baseline.safety.releaseReadyDeclared, false);
      assert.equal(baseline.safety.dirtyOrNonMainIsFinalReadiness, false);
      assert.deepEqual(
        baseline.commandOutputs.map((output) => output.command),
        [
          'git rev-parse --abbrev-ref HEAD',
          'git rev-parse HEAD',
          'git rev-parse main',
          'git rev-parse origin/main',
          'git status --porcelain=v1'
        ]
      );
      assert.match(baseline.fixGuidance.join('\n'), /Stop release readiness judgment/u);
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('rejects release baseline route query parameters', async () => {
    const context = await startV32ConsoleServer({
      runner: new FakeGitRunner()
    });

    try {
      const response = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/release-baseline?command=git-status`);
      const envelope = await response.json();

      assert.equal(response.status, 400);
      assert.equal(envelope.contractName, 'error-envelope.v1');
      assert.equal(envelope.error.code, 'invalid-goal-ref');
    } finally {
      await cleanupConsoleServer(context);
    }
  });
});

class FakeGitRunner {
  constructor(results = {}) {
    this.results = results;
  }

  async run({ executable, args }) {
    assert.equal(executable, 'git');

    const key = args.join(' ');
    const result = this.results[key] ?? { stdout: '' };

    return {
      exitCode: result.exitCode ?? 0,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      durationMs: 1
    };
  }
}

async function startV32ConsoleServer({ runner, env = {} }) {
  const root = await mkdtemp(join(tmpdir(), 'symphony-v32-release-baseline-'));
  const stateDir = join(root, '.symphony');

  await mkdir(dirname(join(stateDir, 'placeholder')), { recursive: true });
  await registerV32Runbook({ stateDir });

  const server = createSymphonyConsoleServer({
    stateDir,
    cwd: root,
    env: { HOME: root, ...env },
    runner
  });
  const baseUrl = await listenOnRandomPort(server);

  return {
    root,
    stateDir,
    server,
    baseUrl
  };
}

async function registerV32Runbook({ stateDir }) {
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

async function listenOnRandomPort(server) {
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolvePromise();
    });
  });

  const address = server.address();

  assert.equal(typeof address, 'object');
  assert.notEqual(address, null);

  return `http://127.0.0.1:${address.port}`;
}

async function cleanupConsoleServer({ root, server }) {
  await new Promise((resolvePromise, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolvePromise();
    });
  });
  await rm(root, { recursive: true, force: true });
}
