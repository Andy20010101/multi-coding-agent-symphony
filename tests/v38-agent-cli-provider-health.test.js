import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildAgentCliProviderHealthContract,
  validateAgentCliProviderHealthContract
} from '../src/symphony/agent-cli-provider-health.js';

describe('v38 agent-cli-provider-health.v1 contract', () => {
  it('validates the fixture and generated health with only the two active providers', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/agent-cli-provider-health.v1.json', 'utf8'));
    const generated = buildAgentCliProviderHealthContract({
      generatedAt: '2026-06-04T00:00:00.000Z',
      env: {}
    });

    assert.deepEqual(validateAgentCliProviderHealthContract(fixture), {
      ok: true,
      errors: []
    });
    assert.deepEqual(validateAgentCliProviderHealthContract(generated), {
      ok: true,
      errors: []
    });
    assert.deepEqual(
      fixture.providers.map((provider) => provider.providerId).sort(),
      ['claude-code-cli', 'codex-cli']
    );
    assert.equal(fixture.summary.healthCheckApiAvailable, true);
  });

  it('reports sanitized env presence without exposing values or running provider CLIs', () => {
    const health = buildAgentCliProviderHealthContract({
      generatedAt: '2026-06-04T00:00:00.000Z',
      env: {
        ANTHROPIC_API_KEY: 'sk-test-secret-value',
        OPENAI_API_KEY: 'sk-test-secret-value'
      }
    });

    assert.deepEqual(validateAgentCliProviderHealthContract(health), {
      ok: true,
      errors: []
    });
    assert.equal(JSON.stringify(health).includes('sk-test-secret-value'), false);
    assert.equal(health.summary.state, 'configured');
    assert.equal(health.summary.configuredProviderCount, 2);
    assert.equal(health.boundaries.providerCliExecutionAttempted, false);
    assert.equal(health.boundaries.modelInvocationAvailable, false);

    for (const provider of health.providers) {
      assert.equal(provider.health.commandProbeAttempted, false);
      assert.equal(provider.health.modelInvocationAttempted, false);
      assert.equal(provider.backendProfile.requiredEnv[0].present, true);
      assert.equal(provider.backendProfile.requiredEnv[0].valueAvailable, false);
      assert.equal(provider.lanes.every((lane) => lane.assignableInV38), true);
    }
  });

  it('rejects forbidden active providers, command execution drift, and secret-bearing fields', () => {
    const health = buildAgentCliProviderHealthContract({
      generatedAt: '2026-06-04T00:00:00.000Z',
      env: {}
    });
    const drift = structuredClone(health);

    drift.providers.push({
      ...structuredClone(health.providers[0]),
      providerId: 'deepseek',
      adapterId: 'deepseek',
      localCommand: {
        ...structuredClone(health.providers[0].localCommand),
        command: 'deepseek'
      }
    });
    drift.providers[0].localCommand.commandExecutionAttempted = true;
    drift.providers[0].health.commandProbeAttempted = true;
    drift.providers[0].backendProfile.apiKey = 'sk-test-secret-leak';
    drift.boundaries.providerCliExecutionAvailable = true;
    drift.boundaries.envValueExposureAvailable = true;

    const errors = validateAgentCliProviderHealthContract(drift).errors;

    assert.equal(errors.includes('providers must not include gemini-cli, kiro-cli, or deepseek'), true);
    assert.equal(errors.includes('providers[0].localCommand.commandExecutionAttempted must be false'), true);
    assert.equal(errors.includes('providers[0].health.commandProbeAttempted must be false'), true);
    assert.equal(errors.includes('providers[0].backendProfile.apiKey is not allowed because provider health must be sanitized'), true);
    assert.equal(errors.includes('boundaries.providerCliExecutionAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.envValueExposureAvailable must be false'), true);
  });

  it('exposes symphony providers health --json without writing repository state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v38-provider-health-cli-'));

    try {
      await mkdir(join(root, '.git'));
      const before = await snapshotDirectoryFiles(root);
      const output = createOutput();
      const originalCwd = process.cwd();

      try {
        process.chdir(root);
        const exitCode = await runSymphonyCli({
          argv: ['providers', 'health', '--json'],
          stdout: output.stdout,
          stderr: output.stderr,
          env: {
            ANTHROPIC_API_KEY: 'sk-test-secret-value',
            OPENAI_API_KEY: 'sk-test-secret-value'
          }
        });

        assert.equal(exitCode, 0);
      } finally {
        process.chdir(originalCwd);
      }

      assert.equal(output.stderrText(), '');

      const health = JSON.parse(output.stdoutText());

      assert.deepEqual(validateAgentCliProviderHealthContract(health), {
        ok: true,
        errors: []
      });
      assert.equal(JSON.stringify(health).includes('sk-test-secret-value'), false);
      assert.deepEqual(await snapshotDirectoryFiles(root), before);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves GET /api/providers/health and rejects mutation/query probes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v38-provider-health-api-'));

    try {
      await mkdir(join(root, '.git'));
      const server = createSymphonyConsoleServer({
        stateDir: join(root, '.symphony'),
        cwd: root,
        env: {
          ANTHROPIC_API_KEY: 'sk-test-secret-value',
          OPENAI_API_KEY: 'sk-test-secret-value'
        }
      });
      const baseUrl = await listenOnRandomPort(server);

      try {
        const before = await snapshotDirectoryFiles(root);
        const response = await fetch(`${baseUrl}/api/providers/health`);

        assert.equal(response.status, 200);

        const health = await response.json();

        assert.deepEqual(validateAgentCliProviderHealthContract(health), {
          ok: true,
          errors: []
        });
        assert.equal(JSON.stringify(health).includes('sk-test-secret-value'), false);

        const postResponse = await fetch(`${baseUrl}/api/providers/health`, { method: 'POST' });
        const queryResponse = await fetch(`${baseUrl}/api/providers/health?path=package.json`);

        assert.equal(postResponse.status, 405);
        assert.equal((await postResponse.json()).contractName, 'error-envelope.v1');
        assert.equal(queryResponse.status, 400);
        assert.equal((await queryResponse.json()).error.code, 'invalid-provider-health-request');
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
      } else {
        files.push(path.slice(root.length + 1));
      }
    }
  }

  await visit(root);
  files.sort();

  return files;
}

async function readdirSafe(directory) {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
}
