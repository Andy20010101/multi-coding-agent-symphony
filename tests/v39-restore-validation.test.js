import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  APP_CORE_RESTORE_VALIDATION_CONTRACT_NAME,
  buildAppCoreRestoreValidation,
  validateAppCoreRestoreValidationContract,
  assertAppCoreRestoreValidationContract
} from '../src/symphony/app-core-restore-validation.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import { runSymphonyCli } from '../scripts/symphony.js';

const V39_GOAL_ID = 'v39-backup-diagnostics-migration-workspace';
const FIXED_TIME = '2026-06-05T00:00:00.000Z';

describe('v39 app-core-restore-validation.v1 contract', () => {
  let root;
  let stateDir;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'symphony-v39-restore-validation-'));
    stateDir = join(root, '.symphony');
    await seedManagedState(stateDir);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('validates the fixture and rejects restore boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/app-core-restore-validation.v1.json', 'utf8'));

    assert.deepEqual(validateAppCoreRestoreValidationContract(fixture), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.boundaries.overwritesExistingData = true;
    drift.boundaries.appliesRestore = true;
    drift.boundaries.confirmRestoreAvailable = true;
    drift.boundaries.restoreMode = 'apply';

    const errors = validateAppCoreRestoreValidationContract(drift).errors;

    assert.equal(errors.includes('boundaries.overwritesExistingData must be false'), true);
    assert.equal(errors.includes('boundaries.appliesRestore must be false'), true);
    assert.equal(errors.includes('boundaries.confirmRestoreAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.restoreMode must be validate-only'), true);
  });

  it('validates backup manifest integrity and compatible restore path without overwriting data', async () => {
    const validation = await buildAppCoreRestoreValidation({
      cwd: root,
      stateDir,
      goalId: V39_GOAL_ID,
      taskId: 'task-5',
      generatedAt: FIXED_TIME
    });

    assert.equal(validation.contractName, APP_CORE_RESTORE_VALIDATION_CONTRACT_NAME);
    assert.equal(validation.readOnly, true);
    assert.equal(validation.context.goalId, V39_GOAL_ID);
    assert.equal(validation.context.taskId, 'task-5');
    assert.equal(validation.sourceBundle.contractName, 'app-core-backup-export.v1');
    assert.match(validation.sourceBundle.manifestHash, /^sha256:[0-9a-f]{64}$/u);
    assert.equal(validation.integrity.status, 'ok');
    assert.equal(validation.integrity.manifestHashValid, true);
    assert.equal(validation.integrity.backupContractValid, true);
    assert.equal(validation.integrity.missingManagedStateRefs.length, 0);
    assert.equal(validation.integrity.checks.every((check) => check.status === 'passed'), true);
    assert.equal(validation.compatibility.status, 'compatible');
    assert.equal(validation.compatibility.compatibleRestorePath, 'validate-only-managed-state-refs');
    assert.equal(validation.compatibility.overwriteDefault, false);
    assert.equal(validation.boundaries.validationOnly, true);
    assert.equal(validation.boundaries.overwritesExistingData, false);
    assert.equal(validation.boundaries.writesManagedState, false);
    assert.equal(validation.boundaries.appliesRestore, false);
    assert.equal(validation.boundaries.confirmRestoreAvailable, false);
    assert.equal(validation.status, 'valid');

    assertAppCoreRestoreValidationContract(validation);
  });

  it('serves the Workbench restore validation route and rejects unsafe params', async () => {
    const server = createSymphonyConsoleServer({ cwd: root, stateDir });
    const baseUrl = await listenOnRandomPort(server);

    try {
      const validResponse = await fetch(`${baseUrl}/api/restore/validate?goal=${V39_GOAL_ID}&task=task-5`);
      const invalidResponse = await fetch(`${baseUrl}/api/restore/validate?path=backup.json`);
      const unsafeGoalResponse = await fetch(`${baseUrl}/api/restore/validate?goal=..%2F..%2Fpackage.json`);
      const postResponse = await fetch(`${baseUrl}/api/restore/validate`, { method: 'POST' });

      assert.equal(validResponse.status, 200);
      assert.equal(invalidResponse.status, 400);
      assert.equal(unsafeGoalResponse.status, 400);
      assert.equal(postResponse.status, 405);

      const body = await validResponse.json();
      assert.equal(body.contractName, APP_CORE_RESTORE_VALIDATION_CONTRACT_NAME);
      assert.equal(body.boundaries.validationOnly, true);
      assert.equal(body.boundaries.overwritesExistingData, false);
      assert.equal((await invalidResponse.json()).error.code, 'invalid-restore-validation-request');
      assert.equal((await unsafeGoalResponse.json()).error.code, 'invalid-restore-validation-request');
    } finally {
      await closeServer(server);
    }
  });

  it('prints restore validation from the CLI and rejects apply or overwrite flags', async () => {
    const stdout = createBufferedStream();
    const stderr = createBufferedStream();

    const exitCode = await runSymphonyCli({
      argv: ['restore', 'validate', '--state-dir', stateDir, '--goal', V39_GOAL_ID, '--task', 'task-5', '--json'],
      stdout: stdout.stream,
      stderr: stderr.stream
    });

    assert.equal(exitCode, 0);

    const output = JSON.parse(stdout.text());
    assert.equal(output.contractName, APP_CORE_RESTORE_VALIDATION_CONTRACT_NAME);
    assert.equal(output.boundaries.appliesRestore, false);
    assert.equal(output.compatibility.overwriteDefault, false);

    const applyExitCode = await runSymphonyCli({
      argv: ['restore', 'validate', '--state-dir', stateDir, '--apply'],
      stdout: createBufferedStream().stream,
      stderr: createBufferedStream().stream
    });

    assert.equal(applyExitCode, 64);
  });
});

async function seedManagedState(stateDir) {
  const runbook = JSON.parse(await readFile('fixtures/contracts/goal-runbook.v39-backup-diagnostics-migration-workspace.v1.json', 'utf8'));
  const files = [
    ['context/latest.json', { goalId: V39_GOAL_ID, taskId: 'task-5' }],
    ['runs/latest.json', { runId: 'run-v39-task-5', goalId: V39_GOAL_ID, taskId: 'task-5' }],
    [`goals/runbooks/${V39_GOAL_ID}.json`, {
      contractName: 'managed-goal-runbook-state.v1',
      contractVersion: 1,
      goalId: V39_GOAL_ID,
      active: true,
      runbook
    }],
    [`goals/events/${V39_GOAL_ID}.ndjson`, `${JSON.stringify({
      eventId: 'evt_v39_task_3_main_verification',
      goalId: V39_GOAL_ID,
      taskId: 'task-3',
      eventType: 'main.verification-passed',
      occurredAt: FIXED_TIME
    })}\n`],
    ['plans/task-5.json', { goalId: V39_GOAL_ID, taskId: 'task-5', phase: 'restore-validation' }],
    ['adoptions/none.json', { state: 'empty' }],
    ['stages/current.json', { stageId: 'v39', status: 'active' }]
  ];

  for (const [ref, content] of files) {
    await mkdir(join(stateDir, ref.split('/').slice(0, -1).join('/')), { recursive: true });
    await writeFile(
      join(stateDir, ref),
      typeof content === 'string' ? content : JSON.stringify(content),
      'utf8'
    );
  }
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
