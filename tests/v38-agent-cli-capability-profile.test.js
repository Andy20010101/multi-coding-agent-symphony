import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildAgentCliCapabilityProfileContract,
  validateAgentCliCapabilityProfileContract
} from '../src/symphony/agent-cli-capability-profile.js';

describe('v38 agent-cli-capability-profile.v1 contract', () => {
  it('validates the fixture and generated mapping with the required action requirements', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/agent-cli-capability-profile.v1.json', 'utf8'));
    const generated = buildAgentCliCapabilityProfileContract({
      generatedAt: '2026-06-04T00:00:00.000Z',
      env: {}
    });

    assert.deepEqual(validateAgentCliCapabilityProfileContract(fixture), {
      ok: true,
      errors: []
    });
    assert.deepEqual(validateAgentCliCapabilityProfileContract(generated), {
      ok: true,
      errors: []
    });
    assert.deepEqual(
      fixture.summary.requiredRequirementIds,
      ['repo.write', 'model.invoke', 'test.run', 'git.change']
    );
    assert.deepEqual(
      fixture.providerGates.map((provider) => provider.providerId).sort(),
      ['claude-code-cli', 'codex-cli']
    );
    assert.equal(fixture.summary.capabilityProfileMappingAvailable, true);
  });

  it('maps implementation and verification actions to provider/tool gates without enabling execution', () => {
    const profile = buildAgentCliCapabilityProfileContract({
      generatedAt: '2026-06-04T00:00:00.000Z',
      env: {
        ANTHROPIC_API_KEY: 'sk-test-secret-value',
        OPENAI_API_KEY: 'sk-test-secret-value'
      }
    });
    const implementationPreview = profile.actionMappings.find((mapping) => mapping.action_id === 'goal.implementation.preview');
    const mainVerification = profile.actionMappings.find((mapping) => mapping.action_id === 'goal.main-verification-gate.record');

    assert.deepEqual(validateAgentCliCapabilityProfileContract(profile), {
      ok: true,
      errors: []
    });
    assert.equal(JSON.stringify(profile).includes('sk-test-secret-value'), false);
    assert.deepEqual(
      implementationPreview.requirementIds,
      ['repo.write', 'model.invoke', 'test.run', 'git.change']
    );
    assert.equal(implementationPreview.providerGateIds.includes('provider.cli.execution.disabled'), true);
    assert.equal(implementationPreview.toolGateIds.includes('prompt.dispatch.disabled'), true);
    assert.equal(implementationPreview.executionEnabled, false);
    assert.equal(mainVerification.toolGateIds.includes('validation.copy-only'), true);
    assert.equal(profile.boundaries.providerCliExecutionAvailable, false);
    assert.equal(profile.boundaries.modelInvocationAvailable, false);
    assert.equal(profile.boundaries.actionExecutionAvailable, false);
  });

  it('rejects forbidden active providers, missing required requirements, and execution drift', () => {
    const profile = buildAgentCliCapabilityProfileContract({
      generatedAt: '2026-06-04T00:00:00.000Z',
      env: {}
    });
    const drift = structuredClone(profile);

    drift.providerGates.push({
      ...structuredClone(profile.providerGates[0]),
      providerId: 'deepseek',
      adapterId: 'deepseek'
    });
    drift.requirements = drift.requirements.filter((requirement) => requirement.requirementId !== 'model.invoke');
    drift.actionMappings[0].executionEnabled = true;
    drift.boundaries.modelInvocationAvailable = true;
    drift.providerGates[0].boundaries.providerCliExecutionAvailable = true;
    drift.providerGates[0].rawProviderSettings = 'sk-test-secret-leak';

    const errors = validateAgentCliCapabilityProfileContract(drift).errors;

    assert.equal(errors.includes('providerGates must not include gemini-cli, kiro-cli, or deepseek'), true);
    assert.equal(errors.includes('requirements must include model.invoke'), true);
    assert.equal(errors.includes('actionMappings[0].executionEnabled must be false'), true);
    assert.equal(errors.includes('boundaries.modelInvocationAvailable must be false'), true);
    assert.equal(errors.includes('providerGates[0].boundaries.providerCliExecutionAvailable must be false'), true);
    assert.equal(errors.includes('providerGates[0].rawProviderSettings is not allowed because capability profiles must be sanitized'), true);
  });

  it('exposes symphony providers capabilities --json without writing repository state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v38-provider-capabilities-cli-'));

    try {
      await mkdir(join(root, '.git'));
      const before = await snapshotDirectoryFiles(root);
      const output = createOutput();
      const originalCwd = process.cwd();

      try {
        process.chdir(root);
        const exitCode = await runSymphonyCli({
          argv: ['providers', 'capabilities', '--json'],
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

      const profile = JSON.parse(output.stdoutText());

      assert.deepEqual(validateAgentCliCapabilityProfileContract(profile), {
        ok: true,
        errors: []
      });
      assert.equal(JSON.stringify(profile).includes('sk-test-secret-value'), false);
      assert.deepEqual(await snapshotDirectoryFiles(root), before);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves GET /api/providers/capabilities and rejects mutation/query probes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v38-provider-capabilities-api-'));

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
        const response = await fetch(`${baseUrl}/api/providers/capabilities`);

        assert.equal(response.status, 200);

        const profile = await response.json();

        assert.deepEqual(validateAgentCliCapabilityProfileContract(profile), {
          ok: true,
          errors: []
        });
        assert.equal(JSON.stringify(profile).includes('sk-test-secret-value'), false);

        const postResponse = await fetch(`${baseUrl}/api/providers/capabilities`, { method: 'POST' });
        const queryResponse = await fetch(`${baseUrl}/api/providers/capabilities?path=package.json`);

        assert.equal(postResponse.status, 405);
        assert.equal((await postResponse.json()).contractName, 'error-envelope.v1');
        assert.equal(queryResponse.status, 400);
        assert.equal((await queryResponse.json()).error.code, 'invalid-provider-capabilities-request');
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
