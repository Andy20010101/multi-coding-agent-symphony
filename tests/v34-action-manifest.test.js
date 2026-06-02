import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import {
  buildActionManifestContract,
  validateActionManifestContract
} from '../src/symphony/action-manifest.js';
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
