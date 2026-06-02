import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildAppStateSnapshot,
  validateAppStateSnapshotContract
} from '../src/symphony/app-state-snapshot.js';
import { buildGoalGatePlan, confirmGoalGate } from '../src/symphony/goal-gate.js';
import { buildGoalReviewPlan, confirmGoalReview } from '../src/symphony/goal-review.js';
import { buildGoalUpdatePlan, confirmGoalUpdate } from '../src/symphony/goal-update.js';

describe('v33 app state snapshot', () => {
  it('validates the fixture and rejects write-boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/app-state-snapshot.v1.json', 'utf8'));

    assert.deepEqual(validateAppStateSnapshotContract(fixture), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.boundaries.confirmCommandAvailable = true;

    assert.deepEqual(validateAppStateSnapshotContract(drift), {
      ok: false,
      errors: ['boundaries.confirmCommandAvailable must be false']
    });
  });

  it('validates healthy, missing project, missing goal, blocked, and stale app-state fixtures', async () => {
    const fixtureExpectations = [
      ['fixtures/contracts/app-state-snapshot.healthy.v1.json', { freshness: 'current', activeGoal: true, project: true, blocked: false }],
      ['fixtures/contracts/app-state-snapshot.missing-project.v1.json', { freshness: 'current', activeGoal: true, project: false, blocked: false }],
      ['fixtures/contracts/app-state-snapshot.missing-goal.v1.json', { freshness: 'current', activeGoal: false, project: true, blocked: false }],
      ['fixtures/contracts/app-state-snapshot.blocked.v1.json', { freshness: 'current', activeGoal: true, project: true, blocked: true }],
      ['fixtures/contracts/app-state-snapshot.stale.v1.json', { freshness: 'stale', activeGoal: true, project: true, blocked: false }]
    ];

    for (const [path, expected] of fixtureExpectations) {
      const fixture = JSON.parse(await readFile(path, 'utf8'));

      assert.deepEqual(validateAppStateSnapshotContract(fixture), {
        ok: true,
        errors: []
      }, path);
      assert.equal(fixture.freshness.status, expected.freshness, path);
      assert.equal(fixture.active_goal !== null, expected.activeGoal, path);
      assert.equal(fixture.current_project.currentProject !== null, expected.project, path);
      assert.equal(fixture.current_task?.blocked === true || fixture.next_action.next?.blocked === true, expected.blocked, path);
    }
  });

  it('builds a read-only snapshot from current project, goal status, next action, evidence, and release state', async () => {
    const root = await createSnapshotProjectFixture('symphony-snapshot-build');

    try {
      await recordTask1Verified(root);

      const snapshot = await buildAppStateSnapshot({
        cwd: join(root, 'nested'),
        generatedAt: '2026-06-02T00:00:00.000Z',
        startedAt: '2026-06-02T00:00:00.000Z',
        nowMs: Date.parse('2026-06-02T00:00:00.000Z')
      });

      assert.deepEqual(validateAppStateSnapshotContract(snapshot), {
        ok: true,
        errors: []
      });
      assert.equal(snapshot.readOnly, true);
      assert.equal(snapshot.freshness.status, 'current');
      assert.equal(snapshot.current_project.currentProject.project_name, 'fixture-project');
      assert.equal(snapshot.runtime_health.boundaries.actionExecutionAvailable, false);
      assert.equal(snapshot.active_goal.goal_id, 'v33-app-runtime-foundation');
      assert.equal(snapshot.current_task.task_id, 'task-2');
      assert.equal(snapshot.current_task.role, 'worker');
      assert.equal(snapshot.next_action.afterCompletion.registerWith, 'symphony goal update');
      assert.equal(snapshot.review_status.verdict, null);
      assert.equal(snapshot.main_verification_status.evidence_ref, null);
      assert.equal(snapshot.release_status.release_ready, false);
      assert.equal(snapshot.release_status.release_ready_source, null);
      assert.equal(snapshot.release_status.release_gates.pnpmCheck, 'unknown');
      assert.equal(snapshot.evidence_refs.some((ref) => ref.ref === 'docs/plans/v33-task-1-worker-evidence-2026-06-02.md'), true);
      assert.equal(snapshot.evidence_refs.some((ref) => ref.ref === 'docs/plans/v33-task-1-main-verification-evidence-2026-06-02.md'), true);
      assert.equal(snapshot.known_blockers.some((blocker) => blocker.id === 'release-ready-not-declared'), true);
      assert.equal(snapshot.boundaries.confirmCommandAvailable, false);
      assert.equal(snapshot.boundaries.gitWriteAvailable, false);
      assert.equal(snapshot.boundaries.releaseWriteAvailable, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('returns explicit null goal and release state when managed goal data is missing', async () => {
    const root = await createSnapshotProjectFixture('symphony-snapshot-missing', {
      writeRunbook: false
    });

    try {
      const snapshot = await buildAppStateSnapshot({
        cwd: root,
        generatedAt: '2026-06-02T00:00:00.000Z',
        startedAt: '2026-06-02T00:00:00.000Z'
      });

      assert.deepEqual(validateAppStateSnapshotContract(snapshot), {
        ok: true,
        errors: []
      });
      assert.equal(snapshot.active_goal, null);
      assert.equal(snapshot.release_status, null);
      assert.equal(snapshot.source_data.goal_status_source, null);
      assert.equal(snapshot.source_data.release_status_source, null);
      assert.equal(snapshot.known_blockers.some((blocker) => blocker.id === 'active-goal-missing'), true);
      assert.equal(snapshot.known_blockers.some((blocker) => blocker.id === 'release-status-missing'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('marks stale snapshots through the shared contract instead of frontend inference', async () => {
    const root = await createSnapshotProjectFixture('symphony-snapshot-stale');

    try {
      await recordTask1Verified(root);

      const snapshot = await buildAppStateSnapshot({
        cwd: root,
        generatedAt: '2026-06-02T00:00:00.000Z',
        startedAt: '2026-06-02T00:00:00.000Z',
        nowMs: Date.parse('2026-06-02T00:10:01.000Z'),
        staleAfterMs: 300000
      });

      assert.deepEqual(validateAppStateSnapshotContract(snapshot), {
        ok: true,
        errors: []
      });
      assert.equal(snapshot.freshness.status, 'stale');
      assert.equal(snapshot.freshness.age_ms, 601000);
      assert.equal(snapshot.known_blockers.some((blocker) => blocker.id === 'runtime-snapshot-stale'), true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('exposes the runtime snapshot CLI without writing repository state', async () => {
    const root = await createSnapshotProjectFixture('symphony-snapshot-cli');

    try {
      await recordTask1Verified(root);

      const before = await snapshotDirectoryFiles(root);
      const output = createOutput();
      const originalCwd = process.cwd();

      try {
        process.chdir(root);
        const exitCode = await runSymphonyCli({
          argv: ['runtime', 'snapshot', '--json'],
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 0);
      } finally {
        process.chdir(originalCwd);
      }

      assert.equal(output.stderrText(), '');

      const snapshot = JSON.parse(output.stdoutText());

      assert.deepEqual(validateAppStateSnapshotContract(snapshot), {
        ok: true,
        errors: []
      });
      assert.equal(snapshot.current_task.task_id, 'task-2');
      assert.deepEqual(await snapshotDirectoryFiles(root), before);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves GET /api/runtime/snapshot and rejects mutation/query probes', async () => {
    const root = await createSnapshotProjectFixture('symphony-snapshot-api');

    try {
      await recordTask1Verified(root);

      const server = createSymphonyConsoleServer({
        stateDir: join(root, '.symphony'),
        cwd: root,
        env: { HOME: root },
        runtimeStartedAt: '2026-06-02T00:00:00.000Z'
      });
      const baseUrl = await listenOnRandomPort(server);

      try {
        const before = await snapshotDirectoryFiles(root);
        const response = await fetch(`${baseUrl}/api/runtime/snapshot`);
        const goalResponse = await fetch(`${baseUrl}/api/runtime/snapshot?goal=v33-app-runtime-foundation`);
        const postResponse = await fetch(`${baseUrl}/api/runtime/snapshot`, { method: 'POST' });
        const badQueryResponse = await fetch(`${baseUrl}/api/runtime/snapshot?path=package.json`);

        assert.equal(response.status, 200);
        assert.equal(goalResponse.status, 200);
        assert.equal(postResponse.status, 405);
        assert.equal(badQueryResponse.status, 400);

        const snapshot = await response.json();

        assert.deepEqual(validateAppStateSnapshotContract(snapshot), {
          ok: true,
          errors: []
        });
        assert.equal(snapshot.current_task.task_id, 'task-2');
        assert.equal((await postResponse.json()).contractName, 'error-envelope.v1');
        assert.equal((await badQueryResponse.json()).error.code, 'invalid-runtime-snapshot-request');
        assert.deepEqual(await snapshotDirectoryFiles(root), before);
      } finally {
        await closeServer(server);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

async function createSnapshotProjectFixture(prefix, { writeRunbook = true } = {}) {
  const root = await realpath(await mkdtemp(join(tmpdir(), `${prefix}-`)));

  await mkdir(join(root, '.git'));
  await writeFile(join(root, '.git', 'HEAD'), 'ref: refs/heads/main\n', 'utf8');
  await writeFile(join(root, '.git', 'config'), [
    '[remote "origin"]',
    '\turl = git@example.com:fixture/project.git',
    ''
  ].join('\n'), 'utf8');
  await mkdir(join(root, 'nested'));
  await writeFile(join(root, 'package.json'), `${JSON.stringify({
    name: 'fixture-project'
  }, null, 2)}\n`, 'utf8');
  await mkdir(join(root, '.symphony', 'goals', 'runbooks'), { recursive: true });
  await writeFile(join(root, '.symphony', 'goals', 'latest-active-goal.json'), `${JSON.stringify({
    contractName: 'managed-active-goal-pointer.v1',
    contractVersion: 1,
    goalId: 'v33-app-runtime-foundation',
    storage: 'managed-active-goal-pointer',
    runbookStateRef: join(root, '.symphony', 'goals', 'runbooks', 'v33-app-runtime-foundation.json')
  }, null, 2)}\n`, 'utf8');
  await mkdir(join(root, '.symphony', 'runs'), { recursive: true });
  await writeFile(join(root, '.symphony', 'runs', 'latest.json'), `${JSON.stringify({
    runId: 'run-v33-snapshot',
    status: 'passed',
    updatedAt: '2026-06-02T00:00:00.000Z'
  }, null, 2)}\n`, 'utf8');

  if (writeRunbook) {
    const runbook = JSON.parse(await readFile('fixtures/contracts/goal-runbook.v33-app-runtime-foundation.v1.json', 'utf8'));

    await writeFile(join(root, '.symphony', 'goals', 'runbooks', 'v33-app-runtime-foundation.json'), `${JSON.stringify({
      contractName: 'managed-goal-runbook-state.v1',
      contractVersion: 1,
      goalId: 'v33-app-runtime-foundation',
      planHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      active: true,
      storage: 'managed-goal-runbook-registry',
      source: {
        kind: 'controlled-fixture',
        ref: 'fixtures/contracts/goal-runbook.v33-app-runtime-foundation.v1.json',
        runbookGoalId: 'v33-app-runtime-foundation'
      },
      runbook,
      stateRefs: {},
      safety: {
        managedPathOnly: true,
        arbitraryPathReadAvailable: false,
        arbitraryPathWriteAvailable: false,
        modelInvocationAvailable: false
      }
    }, null, 2)}\n`, 'utf8');
  }

  return root;
}

async function recordTask1Verified(root) {
  const stateDir = join(root, '.symphony');
  const updateInput = {
    stateDir,
    goalId: 'v33-app-runtime-foundation',
    taskId: 'task-1',
    eventType: 'worker.evidence-recorded',
    actorId: 'snapshot-worker',
    evidenceRefs: ['docs/plans/v33-task-1-worker-evidence-2026-06-02.md'],
    statement: 'Worker evidence recorded for snapshot fixture.',
    branch: 'v33-task-1-local-sidecar-health-api'
  };
  const updatePlan = buildGoalUpdatePlan(updateInput);

  await confirmGoalUpdate({
    ...updateInput,
    planHash: updatePlan.planHash
  });

  const reviewInput = {
    stateDir,
    goalId: 'v33-app-runtime-foundation',
    taskId: 'task-1',
    reviewerId: 'snapshot-reviewer',
    verdict: 'approved',
    evidenceRefs: ['docs/plans/v33-task-1-review-evidence-2026-06-02.md'],
    statement: 'Review approved for snapshot fixture.',
    branch: 'v33-task-1-local-sidecar-health-api'
  };
  const reviewPlan = await buildGoalReviewPlan(reviewInput);

  await confirmGoalReview({
    ...reviewInput,
    planHash: reviewPlan.planHash
  });

  const gateInput = {
    stateDir,
    goalId: 'v33-app-runtime-foundation',
    taskId: 'task-1',
    gateName: 'main-verification',
    status: 'passed',
    verifierId: 'snapshot-main-verifier',
    evidenceRefs: ['docs/plans/v33-task-1-main-verification-evidence-2026-06-02.md'],
    statement: 'Main verification passed for snapshot fixture.',
    branch: 'v33-task-1-local-sidecar-health-api'
  };
  const gatePlan = buildGoalGatePlan(gateInput);

  await confirmGoalGate({
    ...gateInput,
    planHash: gatePlan.planHash
  });
}

function createOutput() {
  const stdoutChunks = [];
  const stderrChunks = [];

  return {
    stdout: {
      write(chunk) {
        stdoutChunks.push(String(chunk));
      }
    },
    stderr: {
      write(chunk) {
        stderrChunks.push(String(chunk));
      }
    },
    stdoutText() {
      return stdoutChunks.join('');
    },
    stderrText() {
      return stderrChunks.join('');
    }
  };
}

async function snapshotDirectoryFiles(root) {
  const files = [];

  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);

      if (entry.isDirectory()) {
        await visit(path);
      } else {
        files.push(path.slice(root.length + 1));
      }
    }
  }

  await visit(root);
  return files.sort();
}

async function listenOnRandomPort(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
