import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { writeRealCliSmokeProofArtifact } from '../src/real-cli-proof.js';

describe('real CLI release proof artifacts', () => {
  it('records run id, model, provider, evidence path, and verifier status', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-real-cli-proof-'));

    try {
      const proofPath = await writeRealCliSmokeProofArtifact({
        outputDirectory: root,
        command: 'smoke:claude:real',
        adapterId: 'claude-code',
        provider: {
          name: 'deepseek',
          source: 'release-config'
        },
        result: {
          skipped: false,
          runId: 'claude-real-smoke-run-1',
          taskId: 'claude-real-smoke-task',
          adapterId: 'claude-code',
          modelProfile: 'deepseek-v4-pro',
          requestedModelProfile: 'sonnet',
          observedModelProfile: 'deepseek-v4-pro',
          modelProfileStatus: 'mismatched',
          modelProfileMismatch: {
            requestedModelProfile: 'sonnet',
            observedModelProfile: 'deepseek-v4-pro'
          },
          verification: {
            status: 'passed'
          },
          evidence: {
            checks: [{
              name: 'claude-real-smoke',
              status: 'passed',
              output: 'repository readable'
            }],
            stdout: 'ANTHROPIC_AUTH_TOKEN=deepseek-secret-value sk-123456789012345678901234 Bearer abcdefghijklmnopqrstuvwx /tmp/.env'
          },
          resourceProfile: {
            status: 'known',
            timeoutMs: 180000
          }
        },
        now: new Date('2026-05-19T01:02:03.000Z')
      });

      assert.equal(proofPath, join(root, '2026-05-19T01-02-03-000Z-claude-code-real-cli-proof.json'));

      const proof = JSON.parse(await readFile(proofPath, 'utf8'));

      assert.equal(proof.version, '1');
      assert.equal(proof.kind, 'real-cli-smoke-proof');
      assert.equal(proof.command, 'smoke:claude:real');
      assert.equal(proof.adapterId, 'claude-code');
      assert.equal(proof.provider.name, 'deepseek');
      assert.equal(proof.runId, 'claude-real-smoke-run-1');
      assert.equal(proof.taskId, 'claude-real-smoke-task');
      assert.equal(proof.modelProfile, 'deepseek-v4-pro');
      assert.equal(proof.requestedModelProfile, 'sonnet');
      assert.equal(proof.observedModelProfile, 'deepseek-v4-pro');
      assert.equal(proof.modelProfileStatus, 'mismatched');
      assert.deepEqual(proof.modelProfileMismatch, {
        requestedModelProfile: 'sonnet',
        observedModelProfile: 'deepseek-v4-pro'
      });
      assert.equal(proof.verifierStatus, 'passed');
      assert.equal(proof.evidencePath, proofPath);
      assert.equal(proof.resourceProfile.status, 'known');
      assert.deepEqual(proof.evidence.checks.map((check) => check.name), ['claude-real-smoke']);
      assert.equal(JSON.stringify(proof).includes('deepseek-secret-value'), false);
      assert.equal(JSON.stringify(proof).includes('sk-123456789012345678901234'), false);
      assert.match(proof.evidence.stdout, /ANTHROPIC_AUTH_TOKEN=\[REDACTED_TOKEN\]/);
      assert.match(proof.evidence.stdout, /Bearer \[REDACTED_TOKEN\]/);
      assert.match(proof.evidence.stdout, /\[REDACTED_PATH\]/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
