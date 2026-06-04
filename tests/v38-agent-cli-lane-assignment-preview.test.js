import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildAgentCliLaneAssignmentPreviewContract,
  validateAgentCliLaneAssignmentPreviewContract
} from '../src/symphony/agent-cli-lane-assignment-preview.js';

describe('v38 agent-cli-lane-assignment-preview.v1 contract', () => {
  it('previews worker, reviewer, and main-verifier lanes without enabling execution', () => {
    const preview = buildAgentCliLaneAssignmentPreviewContract({
      generatedAt: '2026-06-04T00:00:00.000Z',
      env: {
        ANTHROPIC_API_KEY: 'sk-test-secret-value',
        OPENAI_API_KEY: 'sk-test-secret-value'
      }
    });
    const roles = preview.lanePreviews.map((lane) => lane.role);
    const reviewerLane = preview.lanePreviews.find((lane) => lane.role === 'reviewer');
    const mainVerifierLane = preview.lanePreviews.find((lane) => lane.role === 'main-verifier');

    assert.deepEqual(validateAgentCliLaneAssignmentPreviewContract(preview), {
      ok: true,
      errors: []
    });
    assert.equal(JSON.stringify(preview).includes('sk-test-secret-value'), false);
    assert.deepEqual(preview.activeProviderIds, ['claude-code-cli', 'codex-cli']);
    assert.deepEqual(roles, ['worker', 'reviewer', 'main-verifier']);
    assert.deepEqual(reviewerLane.requiresDistinctActorFrom, ['worker']);
    assert.deepEqual(mainVerifierLane.candidateProviders, []);
    assert.equal(mainVerifierLane.operatorLane.requiresApprovedReviewer, true);
    assert.deepEqual(mainVerifierLane.copyOnlyVerificationCommands, [
      'pnpm check',
      'pnpm test',
      'pnpm workbench:build',
      'git diff --check'
    ]);
    assert.equal(preview.assignmentMatrix.every((row) => row.worker.providerId !== row.reviewer.providerId), true);
    assert.equal(preview.summary.autoApprovalAvailable, false);
    assert.equal(preview.boundaries.providerCliExecutionAvailable, false);
    assert.equal(preview.boundaries.modelInvocationAvailable, false);
    assert.equal(preview.boundaries.selfApprovalAvailable, false);
  });

  it('rejects inactive provider drift, self-review drift, and execution drift', () => {
    const preview = buildAgentCliLaneAssignmentPreviewContract({
      generatedAt: '2026-06-04T00:00:00.000Z',
      env: {}
    });
    const drift = structuredClone(preview);
    const reviewerLane = drift.lanePreviews.find((lane) => lane.role === 'reviewer');
    const mainVerifierLane = drift.lanePreviews.find((lane) => lane.role === 'main-verifier');

    drift.activeProviderIds.push('deepseek');
    reviewerLane.requiresDistinctActorFrom = [];
    mainVerifierLane.candidateProviders.push({
      providerId: 'codex-cli',
      displayName: 'Codex CLI',
      providerKind: 'agent-cli',
      adapterId: 'codex',
      healthState: 'missing',
      assignableInV38: false,
      unavailableReason: 'provider-health-missing',
      selectionSource: 'agent-cli-provider-health.v1'
    });
    drift.assignmentMatrix[0].reviewer.providerId = drift.assignmentMatrix[0].worker.providerId;
    drift.boundaries.providerCliExecutionAvailable = true;
    drift.summary.autoApprovalAvailable = true;

    const errors = validateAgentCliLaneAssignmentPreviewContract(drift).errors;

    assert.equal(errors.includes('activeProviderIds must match claude-code-cli,codex-cli'), true);
    assert.equal(errors.includes('activeProviderIds must not include gemini-cli, kiro-cli, or deepseek'), true);
    assert.equal(errors.includes('lanePreviews[1].requiresDistinctActorFrom must include worker'), true);
    assert.equal(errors.includes('lanePreviews[2] main-verifier must not be provider-backed'), true);
    assert.equal(errors.includes('assignmentMatrix[0] must recommend a reviewer provider different from the worker provider'), true);
    assert.equal(errors.includes('boundaries.providerCliExecutionAvailable must be false'), true);
    assert.equal(errors.includes('summary.autoApprovalAvailable must be false'), true);
  });

  it('exposes symphony providers lanes --json without writing repository state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v38-provider-lanes-cli-'));

    try {
      await mkdir(join(root, '.git'));
      const before = await snapshotDirectoryFiles(root);
      const output = createOutput();
      const originalCwd = process.cwd();

      try {
        process.chdir(root);
        const exitCode = await runSymphonyCli({
          argv: ['providers', 'lanes', '--json'],
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

      const preview = JSON.parse(output.stdoutText());

      assert.deepEqual(validateAgentCliLaneAssignmentPreviewContract(preview), {
        ok: true,
        errors: []
      });
      assert.equal(JSON.stringify(preview).includes('sk-test-secret-value'), false);
      assert.deepEqual(await snapshotDirectoryFiles(root), before);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves GET /api/providers/lane-preview and rejects mutation/query probes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v38-provider-lanes-api-'));

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
        const response = await fetch(`${baseUrl}/api/providers/lane-preview`);

        assert.equal(response.status, 200);

        const preview = await response.json();

        assert.deepEqual(validateAgentCliLaneAssignmentPreviewContract(preview), {
          ok: true,
          errors: []
        });
        assert.equal(JSON.stringify(preview).includes('sk-test-secret-value'), false);

        const postResponse = await fetch(`${baseUrl}/api/providers/lane-preview`, { method: 'POST' });
        const queryResponse = await fetch(`${baseUrl}/api/providers/lane-preview?provider=codex-cli`);

        assert.equal(postResponse.status, 405);
        assert.equal((await postResponse.json()).contractName, 'error-envelope.v1');
        assert.equal(queryResponse.status, 400);
        assert.equal((await queryResponse.json()).error.code, 'invalid-provider-lane-preview-request');
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
