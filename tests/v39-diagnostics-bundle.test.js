import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_NAME,
  buildAppCoreDiagnosticsBundle,
  validateAppCoreDiagnosticsBundleContract,
  assertAppCoreDiagnosticsBundleContract
} from '../src/symphony/app-core-diagnostics-bundle.js';
import { computeGoalEventHash } from '../src/symphony/goal-event-contracts.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import { runSymphonyCli } from '../scripts/symphony.js';

const V39_GOAL_ID = 'v39-backup-diagnostics-migration-workspace';
const FIXED_TIME = '2026-06-05T00:00:00.000Z';

describe('v39 app-core-diagnostics-bundle.v1 contract', () => {
  let root;
  let stateDir;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'symphony-v39-diagnostics-bundle-'));
    stateDir = join(root, '.symphony');
    await seedManagedGoalState(stateDir);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('validates the fixture and rejects diagnostics boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/app-core-diagnostics-bundle.v1.json', 'utf8'));

    assert.deepEqual(validateAppCoreDiagnosticsBundleContract(fixture), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.boundaries.includesSecretValues = true;
    drift.boundaries.includesRawLogBodies = true;
    drift.boundaries.arbitraryPathReadAvailable = true;
    drift.boundaries.statusSource = 'frontend-inference';

    const errors = validateAppCoreDiagnosticsBundleContract(drift).errors;

    assert.equal(errors.includes('boundaries.includesSecretValues must be false'), true);
    assert.equal(errors.includes('boundaries.includesRawLogBodies must be false'), true);
    assert.equal(errors.includes('boundaries.arbitraryPathReadAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.statusSource must be explicit-events-and-backend-contracts'), true);
  });

  it('builds sanitized health, version, failure, gate, and log-ref diagnostics', async () => {
    const bundle = await buildAppCoreDiagnosticsBundle({
      cwd: root,
      stateDir,
      goalId: V39_GOAL_ID,
      taskId: 'task-4',
      generatedAt: FIXED_TIME
    });

    assert.equal(bundle.contractName, APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_NAME);
    assert.equal(bundle.readOnly, true);
    assert.equal(bundle.context.goalId, V39_GOAL_ID);
    assert.equal(bundle.context.taskId, 'task-4');
    assert.equal(bundle.health.status, 'warning');
    assert.equal(bundle.health.runtime.status, 'ok');
    assert.equal(bundle.gateStatus.state, 'available');
    assert.equal(bundle.gateStatus.taskCount, 5);
    assert.equal(bundle.gateStatus.mainVerifiedCount, 3);
    assert.equal(bundle.recentFailures.length >= 1, true);
    assert.equal(bundle.recentFailures.some((failure) => failure.message.includes('super-secret')), false);
    assert.equal(bundle.recentFailures.some((failure) => failure.message.includes(root)), false);
    assert.equal(bundle.sanitizedLogs.policy, 'structured-refs-only-no-log-bodies');
    assert.ok(bundle.sanitizedLogs.refs.some((ref) => ref.uri === `managed-state://goals/events/${V39_GOAL_ID}.ndjson`));
    assert.equal(bundle.boundaries.includesRawLogBodies, false);
    assert.equal(bundle.boundaries.shellExecutionAvailable, false);
    assertAppCoreDiagnosticsBundleContract(bundle);
  });

  it('serves the Workbench diagnostics bundle route and rejects unsupported or unsafe params', async () => {
    const server = createSymphonyConsoleServer({ cwd: root, stateDir });
    const baseUrl = await listenOnRandomPort(server);

    try {
      const validResponse = await fetch(`${baseUrl}/api/diagnostics/bundle?goal=${V39_GOAL_ID}&task=task-4`);
      const invalidResponse = await fetch(`${baseUrl}/api/diagnostics/bundle?path=src/index.js`);
      const unsafeGoalResponse = await fetch(`${baseUrl}/api/diagnostics/bundle?goal=..%2F..%2Fpackage.json`);
      const postResponse = await fetch(`${baseUrl}/api/diagnostics/bundle`, { method: 'POST' });

      assert.equal(validResponse.status, 200);
      assert.equal(invalidResponse.status, 400);
      assert.equal(unsafeGoalResponse.status, 400);
      assert.equal(postResponse.status, 405);

      const body = await validResponse.json();
      assert.equal(body.contractName, APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_NAME);
      assert.equal(body.boundaries.includesSecretValues, false);
      assert.equal(body.boundaries.includesRawLogBodies, false);
      assert.equal((await invalidResponse.json()).error.code, 'invalid-diagnostics-bundle-request');
      assert.equal((await unsafeGoalResponse.json()).error.code, 'invalid-diagnostics-bundle-request');
    } finally {
      await closeServer(server);
    }
  });

  it('prints the diagnostics bundle contract from the CLI without output-file writes', async () => {
    const stdout = createBufferedStream();

    const exitCode = await runSymphonyCli({
      argv: ['diagnostics', 'bundle', '--state-dir', stateDir, '--goal', V39_GOAL_ID, '--task', 'task-4', '--json'],
      stdout: stdout.stream,
      stderr: createBufferedStream().stream
    });

    assert.equal(exitCode, 0);

    const output = JSON.parse(stdout.text());
    assert.equal(output.contractName, APP_CORE_DIAGNOSTICS_BUNDLE_CONTRACT_NAME);
    assert.equal(output.boundaries.includesRawLogBodies, false);
    assert.equal(output.boundaries.releaseDecisionAvailable, false);
  });
});

async function seedManagedGoalState(stateDir) {
  const runbook = JSON.parse(await readFile('fixtures/contracts/goal-runbook.v39-backup-diagnostics-migration-workspace.v1.json', 'utf8'));

  await mkdir(join(stateDir, 'goals', 'runbooks'), { recursive: true });
  await mkdir(join(stateDir, 'goals', 'events'), { recursive: true });
  await mkdir(join(stateDir, 'runs'), { recursive: true });

  await writeFile(
    join(stateDir, 'goals', 'runbooks', `${V39_GOAL_ID}.json`),
    JSON.stringify({
      contractName: 'managed-goal-runbook-state.v1',
      contractVersion: 1,
      goalId: V39_GOAL_ID,
      planHash: 'sha256:test',
      active: true,
      storage: 'repo-local-managed-goal-runbook-state',
      source: { kind: 'repo-fixture', ref: 'fixtures/contracts/goal-runbook.v39-backup-diagnostics-migration-workspace.v1.json' },
      runbook,
      stateRefs: {},
      safety: {
        managedPathOnly: true,
        arbitraryPathReadAvailable: false,
        arbitraryPathWriteAvailable: false,
        modelInvocationAvailable: false
      }
    }),
    'utf8'
  );
  await writeFile(
    join(stateDir, 'goals', 'latest-active-goal.json'),
    JSON.stringify({
      contractName: 'managed-active-goal-pointer.v1',
      contractVersion: 1,
      goalId: V39_GOAL_ID,
      planHash: 'sha256:test',
      storage: 'repo-local-managed-active-goal-pointer',
      runbookStateRef: `goals/runbooks/${V39_GOAL_ID}.json`
    }),
    'utf8'
  );

  const events = [];
  events.push(stampEventHash({
      eventId: 'evt_v39_task_1_main_verification',
      goalId: V39_GOAL_ID,
      taskId: 'task-1',
      eventType: 'main.verification-passed',
      phase: 'main-verification',
      actor: { role: 'main-verifier', id: 'codex-v39-main-verifier' },
      occurredAt: FIXED_TIME,
      recordedAt: FIXED_TIME,
      branch: null,
      commit: null,
      evidenceRefs: [{ kind: 'repo-doc', ref: 'docs/plans/v39-task-1-main-verification-evidence-2026-06-02.md', label: 'Main verification' }],
      statement: 'Main verification passed.'
    }, 1, null));
  events.push(stampEventHash({
      eventId: 'evt_v39_task_2_main_verification',
      goalId: V39_GOAL_ID,
      taskId: 'task-2',
      eventType: 'main.verification-passed',
      phase: 'main-verification',
      actor: { role: 'main-verifier', id: 'codex-v39-main-verifier' },
      occurredAt: FIXED_TIME,
      recordedAt: FIXED_TIME,
      branch: null,
      commit: null,
      evidenceRefs: [{ kind: 'repo-doc', ref: 'docs/plans/v39-task-2-main-verification-evidence-2026-06-02.md', label: 'Main verification' }],
      statement: 'Main verification passed.'
    }, 2, events.at(-1).eventHash));
  events.push(stampEventHash({
      eventId: 'evt_v39_task_3_main_verification',
      goalId: V39_GOAL_ID,
      taskId: 'task-3',
      eventType: 'main.verification-passed',
      phase: 'main-verification',
      actor: { role: 'main-verifier', id: 'codex-v39-main-verifier' },
      occurredAt: FIXED_TIME,
      recordedAt: FIXED_TIME,
      branch: null,
      commit: null,
      evidenceRefs: [{ kind: 'repo-doc', ref: 'docs/plans/v39-task-3-main-verification-evidence-2026-06-05.md', label: 'Main verification' }],
      statement: 'Main verification passed.'
    }, 3, events.at(-1).eventHash));
  events.push(stampEventHash({
      eventId: 'evt_v39_task_4_self_check_failed',
      goalId: V39_GOAL_ID,
      taskId: 'task-4',
      eventType: 'worker.self-check-failed',
      phase: 'implement',
      actor: { role: 'worker', id: 'codex-v39-task-4-worker' },
      occurredAt: FIXED_TIME,
      recordedAt: FIXED_TIME,
      branch: null,
      commit: null,
      evidenceRefs: [{ kind: 'repo-doc', ref: 'docs/plans/v39-task-4-worker-evidence-2026-06-02.md', label: 'Worker evidence' }],
      statement: `Worker self-check failed at ${stateDir} TOKEN=super-secret sk-abcdefghijklmnopqrstuvwxyz`
    }, 4, events.at(-1).eventHash));

  await writeFile(
    join(stateDir, 'goals', 'events', `${V39_GOAL_ID}.ndjson`),
    `${events.map((event) => JSON.stringify(event)).join('\n')}\n`,
    'utf8'
  );
  await writeFile(
    join(stateDir, 'runs', 'run-task-4-failed.json'),
    JSON.stringify({
      runId: 'run-task-4-failed',
      goalId: V39_GOAL_ID,
      taskId: 'task-4',
      status: 'failed',
      failurePhase: 'verify',
      failure: { message: `Failed writing ${stateDir} PASSWORD=super-secret` },
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME
    }),
    'utf8'
  );
}

function stampEventHash(event, sequence, previousEventHash) {
  const eventToHash = {
    ...event,
    sequence,
    previousEventHash
  };

  return {
    ...eventToHash,
    eventHash: computeGoalEventHash(eventToHash)
  };
}

function createBufferedStream() {
  let buffer = '';

  return {
    stream: {
      write(chunk) {
        buffer += chunk;
      }
    },
    text() {
      return buffer;
    }
  };
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
      if (error) reject(error);
      else resolve();
    });
  });
}
