import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import {
  buildActionManifestContract,
  validateActionManifestContract
} from '../src/symphony/action-manifest.js';
import {
  buildActionAvailabilityContract,
  validateActionAvailabilityContract
} from '../src/symphony/action-availability.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';

describe('v34 action-manifest.v1 contract', () => {
  it('validates the fixture and rejects execution boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/action-manifest.v1.json', 'utf8'));

    assert.deepEqual(validateActionManifestContract(fixture), {
      ok: true,
      errors: []
    });

    assert.deepEqual(validateActionManifestContract(buildActionManifestContract({
      goalId: 'v34-action-registry-workspace',
      taskId: 'task-1',
      generatedAt: '2026-06-02T00:00:00.000Z'
    })), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.actions[0].execution.enabled = true;
    drift.boundaries.gitWriteAvailable = true;

    assert.equal(validateActionManifestContract(drift).errors.includes('actions[0].execution.enabled must be false'), true);
    assert.equal(validateActionManifestContract(drift).errors.includes('boundaries.gitWriteAvailable must be false'), true);
  });

  it('exposes a read-only CLI manifest without accepting output files or action execution input', async () => {
    const output = createOutput();
    const exitCode = await runSymphonyCli({
      argv: [
        'actions',
        'manifest',
        '--goal',
        'v34-action-registry-workspace',
        '--task',
        'task-1',
        '--json'
      ],
      stdout: output.stdout,
      stderr: output.stderr
    });

    assert.equal(exitCode, 0);
    assert.equal(output.stderrText(), '');

    const manifest = JSON.parse(output.stdoutText());

    assert.deepEqual(validateActionManifestContract(manifest), {
      ok: true,
      errors: []
    });
    assert.equal(manifest.context.goalId, 'v34-action-registry-workspace');
    assert.equal(manifest.context.taskId, 'task-1');
    assert.equal(manifest.boundaries.actionExecutionAvailable, false);
    assert.equal(manifest.actions[0].execution.rawShellCommandAvailable, false);

    const rejectedOutput = createOutput();
    const rejectedExitCode = await runSymphonyCli({
      argv: ['actions', 'manifest', '--output', 'manifest.json', '--json'],
      stdout: rejectedOutput.stdout,
      stderr: rejectedOutput.stderr
    });

    assert.equal(rejectedExitCode, 64);
    assert.match(rejectedOutput.stderrText(), /actions manifest is read-only/u);

    const unsafeOutput = createOutput();
    const unsafeExitCode = await runSymphonyCli({
      argv: ['actions', 'manifest', '--goal', '../repo', '--json'],
      stdout: unsafeOutput.stdout,
      stderr: unsafeOutput.stderr
    });

    assert.equal(unsafeExitCode, 64);
    assert.match(unsafeOutput.stderrText(), /safe refs/u);
  });

  it('serves the Workbench action manifest route and rejects unsupported query parameters', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const manifestResponse = await fetch(`${baseUrl}/api/actions/manifest?goal=v34-action-registry-workspace&task=task-1`);
      const invalidResponse = await fetch(`${baseUrl}/api/actions/manifest?command=run&path=package.json`);
      const unsafeGoalResponse = await fetch(`${baseUrl}/api/actions/manifest?goal=..%2F..%2Fx`);
      const unsafeTaskResponse = await fetch(`${baseUrl}/api/actions/manifest?task=..%2Ftask`);
      const postResponse = await fetch(`${baseUrl}/api/actions/manifest`, { method: 'POST' });

      assert.equal(manifestResponse.status, 200);
      assert.equal(invalidResponse.status, 400);
      assert.equal(unsafeGoalResponse.status, 400);
      assert.equal(unsafeTaskResponse.status, 400);
      assert.equal(postResponse.status, 405);

      const manifest = await manifestResponse.json();

      assert.deepEqual(validateActionManifestContract(manifest), {
        ok: true,
        errors: []
      });
      assert.equal(manifest.context.goalId, 'v34-action-registry-workspace');
      assert.equal(manifest.context.taskId, 'task-1');
      assert.equal((await invalidResponse.json()).error.code, 'invalid-action-manifest-request');
      assert.equal((await unsafeGoalResponse.json()).error.code, 'invalid-action-manifest-request');
      assert.equal((await unsafeTaskResponse.json()).error.code, 'invalid-action-manifest-request');
      assert.equal((await postResponse.json()).error.code, 'method-not-allowed');
    } finally {
      await closeServer(server);
    }
  });
});

describe('v34 action-availability.v1 contract', () => {
  it('validates the fixture and rejects execution boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/action-availability.v1.json', 'utf8'));

    assert.deepEqual(validateActionAvailabilityContract(fixture), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.actions[0].execution.enabled = true;
    drift.boundaries.actionExecutionAvailable = true;

    assert.equal(validateActionAvailabilityContract(drift).errors.includes('actions[0].execution.enabled must be false'), true);
    assert.equal(validateActionAvailabilityContract(drift).errors.includes('boundaries.actionExecutionAvailable must be false'), true);
  });

  it('resolves availability from registered goal status and next action contracts', async () => {
    const stateDir = await registerV34GoalFixture();

    try {
      const availability = await buildActionAvailabilityContract({
        stateDir,
        goalId: 'v34-action-registry-workspace',
        taskId: 'task-1',
        generatedAt: '2026-06-02T00:00:00.000Z'
      });

      assert.deepEqual(validateActionAvailabilityContract(availability), {
        ok: true,
        errors: []
      });
      assert.equal(availability.context.nextAction.taskId, 'task-1');
      assert.equal(availability.context.nextAction.role, 'worker');

      const workerAction = availability.actions.find((action) => action.action_id === 'goal.worker-evidence.record');
      const reviewAction = availability.actions.find((action) => action.action_id === 'goal.review-verdict.record');
      const implementationPreview = availability.actions.find((action) => action.action_id === 'goal.implementation.preview');

      assert.equal(workerAction.state, 'available');
      assert.deepEqual(workerAction.requiredInputs, ['workerEvidenceRef']);
      assert.deepEqual(workerAction.missingContext, []);
      assert.equal(reviewAction.state, 'unavailable');
      assert.equal(reviewAction.reasons.some((item) => item.code === 'worker-evidence-missing'), true);
      assert.equal(implementationPreview.state, 'available');
      assert.equal(implementationPreview.execution.enabled, false);
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  });

  it('exposes a read-only CLI availability contract', async () => {
    const stateDir = await registerV34GoalFixture();

    try {
      const output = createOutput();
      const exitCode = await runSymphonyCli({
        argv: [
          'actions',
          'availability',
          '--state-dir',
          stateDir,
          '--goal',
          'v34-action-registry-workspace',
          '--task',
          'task-1',
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');

      const availability = JSON.parse(output.stdoutText());

      assert.deepEqual(validateActionAvailabilityContract(availability), {
        ok: true,
        errors: []
      });
      assert.equal(availability.actions.find((action) => action.action_id === 'goal.worker-evidence.record').state, 'available');

      const rejectedOutput = createOutput();
      const rejectedExitCode = await runSymphonyCli({
        argv: ['actions', 'availability', '--goal', '../repo', '--json'],
        stdout: rejectedOutput.stdout,
        stderr: rejectedOutput.stderr
      });

      assert.equal(rejectedExitCode, 64);
      assert.match(rejectedOutput.stderrText(), /safe refs/u);
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  });

  it('serves the Workbench availability route and rejects unsupported query parameters', async () => {
    const stateDir = await registerV34GoalFixture();
    const server = createSymphonyConsoleServer({ stateDir });
    const baseUrl = await listenOnRandomPort(server);

    try {
      const availabilityResponse = await fetch(`${baseUrl}/api/actions/availability?goal=v34-action-registry-workspace&task=task-1`);
      const invalidResponse = await fetch(`${baseUrl}/api/actions/availability?command=run`);
      const unsafeResponse = await fetch(`${baseUrl}/api/actions/availability?goal=..%2F..%2Fx`);
      const postResponse = await fetch(`${baseUrl}/api/actions/availability`, { method: 'POST' });

      assert.equal(availabilityResponse.status, 200);
      assert.equal(invalidResponse.status, 400);
      assert.equal(unsafeResponse.status, 400);
      assert.equal(postResponse.status, 405);

      const availability = await availabilityResponse.json();

      assert.deepEqual(validateActionAvailabilityContract(availability), {
        ok: true,
        errors: []
      });
      assert.equal(availability.context.taskId, 'task-1');
      assert.equal((await invalidResponse.json()).error.code, 'invalid-action-availability-request');
      assert.equal((await unsafeResponse.json()).error.code, 'invalid-action-availability-request');
      assert.equal((await postResponse.json()).error.code, 'method-not-allowed');
    } finally {
      await closeServer(server);
      await rm(stateDir, { recursive: true, force: true });
    }
  });
});

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

async function listenOnRandomPort(server) {
  await new Promise((resolveListen) => {
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();

  return `http://${address.address}:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolveClose) => {
    server.close(resolveClose);
  });
}

async function registerV34GoalFixture() {
  const stateDir = await mkdtemp(join(tmpdir(), 'symphony-v34-action-availability-'));
  const dryRunOutput = createOutput();
  const dryRunExitCode = await runSymphonyCli({
    argv: [
      'goal',
      'init',
      '--state-dir',
      stateDir,
      '--goal',
      'v34-action-registry-workspace',
      '--from-json',
      'fixtures/contracts/goal-runbook.v34-action-registry-workspace.v1.json',
      '--dry-run',
      '--json'
    ],
    stdout: dryRunOutput.stdout,
    stderr: dryRunOutput.stderr
  });

  assert.equal(dryRunExitCode, 0);

  const plan = JSON.parse(dryRunOutput.stdoutText());
  const confirmOutput = createOutput();
  const confirmExitCode = await runSymphonyCli({
    argv: [
      'goal',
      'init',
      '--state-dir',
      stateDir,
      '--goal',
      'v34-action-registry-workspace',
      '--from-json',
      'fixtures/contracts/goal-runbook.v34-action-registry-workspace.v1.json',
      '--confirm',
      '--plan-hash',
      plan.planHash,
      '--json'
    ],
    stdout: confirmOutput.stdout,
    stderr: confirmOutput.stderr
  });

  assert.equal(confirmExitCode, 0);

  return stateDir;
}
