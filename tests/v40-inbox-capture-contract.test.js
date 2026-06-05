import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildInboxCaptureContract,
  validateInboxCaptureContract
} from '../src/symphony/inbox-capture-contract.js';
import {
  READONLY_API_ROUTES,
  projectWorkbenchContracts
} from '../frontend/workbench/src/api/contracts.js';

const FIXED_TIME = '2026-06-05T00:00:00.000Z';
const GOAL_ID = 'v40-personal-workflow-router-app-core-release';

describe('v40 inbox-capture.v1 contract', () => {
  it('captures raw request entry types without requiring a Workbench goal', () => {
    const contract = buildInboxCaptureContract({
      goalId: GOAL_ID,
      taskId: 'task-1',
      generatedAt: FIXED_TIME
    });

    assert.deepEqual(validateInboxCaptureContract(contract), {
      ok: true,
      errors: []
    });
    assert.equal(contract.contractName, 'inbox-capture.v1');
    assert.equal(contract.readOnly, true);
    assert.equal(contract.intakeSurface.requiresActiveWorkbenchGoal, false);
    assert.equal(contract.intakeSurface.writesInPreview, false);
    assert.deepEqual(
      contract.captureItemTypes.map((item) => item.itemType),
      ['user-request', 'project-clue', 'idea', 'fault']
    );
    assert.equal(contract.captureDraft.persisted, false);
    assert.equal(contract.captureDraft.requiredFields.includes('rawText'), true);
    assert.equal(contract.handoff.workbenchGoalRequiredForCapture, false);
    assert.equal(contract.handoff.workbenchGoalRequiredForGoalDraft, true);
    assert.equal(contract.boundaries.shellExecutionAvailable, false);
    assert.equal(contract.boundaries.modelInvocationAvailable, false);
    assert.equal(contract.boundaries.gitWriteAvailable, false);
    assert.equal(contract.boundaries.releaseReadinessAvailable, false);
    assert.equal(contract.boundaries.v8TopLevelModelAvailable, false);
  });

  it('rejects write, execution, and Workbench-forcing boundary drift', () => {
    const contract = buildInboxCaptureContract({
      goalId: GOAL_ID,
      taskId: 'task-1',
      generatedAt: FIXED_TIME
    });
    const drift = structuredClone(contract);

    drift.intakeSurface.requiresActiveWorkbenchGoal = true;
    drift.captureDraft.persisted = true;
    drift.boundaries.captureWriteAvailable = true;
    drift.boundaries.shellExecutionAvailable = true;
    drift.boundaries.releaseReadinessAvailable = true;
    drift.captureItemTypes = drift.captureItemTypes.filter((item) => item.itemType !== 'fault');

    const errors = validateInboxCaptureContract(drift).errors;

    assert.equal(errors.includes('intakeSurface.requiresActiveWorkbenchGoal must be false'), true);
    assert.equal(errors.includes('captureDraft.persisted must be false'), true);
    assert.equal(errors.includes('boundaries.captureWriteAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.shellExecutionAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.releaseReadinessAvailable must be false'), true);
    assert.equal(errors.includes('captureItemTypes must include fault'), true);
  });

  it('exposes a read-only CLI contract and rejects write/execution input', async () => {
    const output = createOutput();
    const exitCode = await runSymphonyCli({
      argv: [
        'inbox',
        'capture',
        '--goal',
        GOAL_ID,
        '--task',
        'task-1',
        '--json'
      ],
      stdout: output.stdout,
      stderr: output.stderr
    });

    assert.equal(exitCode, 0);
    assert.equal(output.stderrText(), '');

    const contract = JSON.parse(output.stdoutText());

    assert.deepEqual(validateInboxCaptureContract(contract), {
      ok: true,
      errors: []
    });
    assert.equal(contract.context.goalId, GOAL_ID);
    assert.equal(contract.context.taskId, 'task-1');
    assert.equal(contract.intakeSurface.cliCommand, 'symphony inbox capture --json');

    const unsafeOutput = createOutput();
    const unsafeExitCode = await runSymphonyCli({
      argv: ['inbox', 'capture', '--goal', '../repo', '--json'],
      stdout: unsafeOutput.stdout,
      stderr: unsafeOutput.stderr
    });
    const writeOutput = createOutput();
    const writeExitCode = await runSymphonyCli({
      argv: ['inbox', 'capture', '--write', '--json'],
      stdout: writeOutput.stdout,
      stderr: writeOutput.stderr
    });

    assert.equal(unsafeExitCode, 64);
    assert.match(unsafeOutput.stderrText(), /safe refs/u);
    assert.equal(writeExitCode, 64);
    assert.match(writeOutput.stderrText(), /read-only contract preview/u);
  });

  it('serves GET /api/inbox/capture and rejects mutation/query probes without writing repo state', async () => {
    const root = await createRepoFixture();
    const server = createSymphonyConsoleServer({
      cwd: root,
      stateDir: join(root, '.symphony')
    });
    const baseUrl = await listenOnRandomPort(server);

    try {
      const before = await snapshotDirectoryFiles(root);
      const response = await fetch(`${baseUrl}/api/inbox/capture?goal=${GOAL_ID}&task=task-1`);

      assert.equal(response.status, 200);

      const contract = await response.json();

      assert.deepEqual(validateInboxCaptureContract(contract), {
        ok: true,
        errors: []
      });

      const postResponse = await fetch(`${baseUrl}/api/inbox/capture`, { method: 'POST' });
      const badQueryResponse = await fetch(`${baseUrl}/api/inbox/capture?path=package.json`);
      const unsafeQueryResponse = await fetch(`${baseUrl}/api/inbox/capture?goal=../escape`);

      assert.equal(postResponse.status, 405);
      assert.equal((await postResponse.json()).contractName, 'error-envelope.v1');
      assert.equal(badQueryResponse.status, 400);
      assert.equal((await badQueryResponse.json()).error.code, 'invalid-inbox-capture-request');
      assert.equal(unsafeQueryResponse.status, 400);
      assert.equal((await unsafeQueryResponse.json()).error.code, 'invalid-inbox-capture-request');
      assert.deepEqual(await snapshotDirectoryFiles(root), before);
    } finally {
      await closeServer(server);
      await rm(root, { recursive: true, force: true });
    }
  });

  it('is included in the Workbench read-only route model projection', () => {
    const route = READONLY_API_ROUTES.find((candidate) => candidate.id === 'inboxCapture');
    const contract = buildInboxCaptureContract({
      goalId: GOAL_ID,
      taskId: 'task-1',
      generatedAt: FIXED_TIME
    });

    assert.equal(route.path, '/api/inbox/capture');
    assert.equal(route.contractName, 'inbox-capture.v1');

    const model = projectWorkbenchContracts({
      inboxCapture: {
        ok: true,
        route: route.path,
        method: route.method,
        routeDescriptor: route,
        httpStatus: 200,
        data: contract
      }
    });

    assert.equal(model.inboxCapture.state, 'available');
    assert.equal(model.inboxCapture.captureItemTypes.count.value, 4);
    assert.equal(model.inboxCapture.intakeSurface.requiresActiveWorkbenchGoal.value, false);
    assert.equal(model.inboxCapture.captureDraft.persisted.value, false);
    assert.equal(model.inboxCapture.handoff.routerContract.value, 'workflow-router-category.v1');
    assert.equal(model.inboxCapture.boundaries.items.some((item) => (
      item.key.text === 'shellExecutionAvailable' && item.value.value === false
    )), true);
  });
});

async function createRepoFixture() {
  const root = await mkdtemp(join(tmpdir(), 'symphony-v40-inbox-capture-'));

  await mkdir(join(root, '.git'));
  await mkdir(join(root, '.symphony'), { recursive: true });
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'v40-fixture' }), 'utf8');

  return root;
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

  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolvePromise, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolvePromise();
    });
  });
}

async function snapshotDirectoryFiles(root) {
  const entries = await readdir(root, { recursive: true });

  return entries.sort();
}

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
    stdoutText: () => stdoutText,
    stderrText: () => stderrText
  };
}
