import { mkdir, mkdtemp, readFile, readdir, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildLocalRuntimeHealth,
  validateLocalRuntimeHealthContract
} from '../src/symphony/local-runtime-health.js';

describe('v33 local runtime health contract', () => {
  it('validates the fixture and rejects execution boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/local-runtime-health.v1.json', 'utf8'));

    assert.deepEqual(validateLocalRuntimeHealthContract(fixture), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.boundaries.modelInvocationAvailable = true;

    assert.deepEqual(validateLocalRuntimeHealthContract(drift), {
      ok: false,
      errors: ['boundaries.modelInvocationAvailable must be false']
    });
  });

  it('builds read-only runtime health from process metadata and repository metadata', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v33-runtime-health-'));

    try {
      await mkdir(join(root, '.git'));
      await mkdir(join(root, 'nested'));

      const health = await buildLocalRuntimeHealth({
        cwd: join(root, 'nested'),
        startedAt: '2026-06-02T00:00:00.000Z',
        generatedAt: '2026-06-02T00:00:02.000Z',
        pid: 4321,
        nowMs: Date.parse('2026-06-02T00:00:03.000Z')
      });

      assert.deepEqual(validateLocalRuntimeHealthContract(health), {
        ok: true,
        errors: []
      });
      assert.equal(health.status, 'ok');
      assert.equal(health.readOnly, true);
      assert.equal(health.process.repoPath, root);
      assert.equal(health.process.uptimeMs, 3000);
      assert.equal(health.boundaries.actionExecutionAvailable, false);
      assert.equal(health.boundaries.jobQueueAvailable, false);
      assert.equal(health.boundaries.modelInvocationAvailable, false);
      assert.equal(health.boundaries.gitWriteAvailable, false);
      assert.equal(health.boundaries.releaseWriteAvailable, false);
      assert.deepEqual(health.knownBlockers, []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('exposes symphony runtime health --json without writing repository state', async () => {
    const root = await realpath(await mkdtemp(join(tmpdir(), 'symphony-v33-runtime-cli-')));

    try {
      await mkdir(join(root, '.git'));

      const before = await snapshotDirectoryFiles(root);
      const output = createOutput();
      const originalCwd = process.cwd();

      try {
        process.chdir(root);
        const exitCode = await runSymphonyCli({
          argv: ['runtime', 'health', '--json'],
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 0);
      } finally {
        process.chdir(originalCwd);
      }

      assert.equal(output.stderrText(), '');

      const health = JSON.parse(output.stdoutText());

      assert.deepEqual(validateLocalRuntimeHealthContract(health), {
        ok: true,
        errors: []
      });
      assert.equal(health.process.repoPath, root);
      assert.deepEqual(await snapshotDirectoryFiles(root), before);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves GET /api/health from the local sidecar and rejects mutation/query probes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v33-runtime-api-'));

    try {
      await mkdir(join(root, '.git'));

      const server = createSymphonyConsoleServer({
        stateDir: join(root, '.symphony'),
        cwd: root,
        env: { HOME: root },
        runtimeStartedAt: '2026-06-02T00:00:00.000Z'
      });
      const baseUrl = await listenOnRandomPort(server);

      try {
        const before = await snapshotDirectoryFiles(root);
        const response = await fetch(`${baseUrl}/api/health`);

        assert.equal(response.status, 200);

        const health = await response.json();

        assert.deepEqual(validateLocalRuntimeHealthContract(health), {
          ok: true,
          errors: []
        });
        assert.equal(health.process.repoPath, root);
        assert.equal(health.boundaries.arbitraryCommandExecutionAvailable, false);

        const postResponse = await fetch(`${baseUrl}/api/health`, { method: 'POST' });
        const queryResponse = await fetch(`${baseUrl}/api/health?path=package.json`);

        assert.equal(postResponse.status, 405);
        assert.equal((await postResponse.json()).contractName, 'error-envelope.v1');
        assert.equal(queryResponse.status, 400);
        assert.equal((await queryResponse.json()).error.code, 'invalid-health-request');
        assert.deepEqual(await snapshotDirectoryFiles(root), before);
      } finally {
        await closeServer(server);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
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
  const files = [];

  async function visit(directory) {
    const entries = await readdirSafe(directory);

    for (const entry of entries) {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(path);
        continue;
      }

      if (entry.isFile()) {
        files.push(path.slice(root.length + 1));
      }
    }
  }

  await visit(root);

  return files.sort();
}

async function readdirSafe(directory) {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
}
