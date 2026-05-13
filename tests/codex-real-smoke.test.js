import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import {
  REAL_CODEX_SMOKE_FLAG,
  runCodexRealSmoke
} from '../src/codex-real-smoke.js';

class FakeSmokeAdapter {
  constructor(evidence) {
    this.evidence = evidence;
    this.calls = [];
  }

  async start(input) {
    this.calls.push(input);

    return {
      runId: 'fake-run',
      adapterId: 'codex',
      status: 'completed',
      exitCode: 0
    };
  }

  async *streamEvents() {
    yield { type: 'adapter.started' };
    yield { type: 'command.finished' };
  }

  async collectEvidence() {
    return this.evidence;
  }
}

describe('Codex real model smoke script', () => {
  it('uses a strict schema accepted by Codex structured output', async () => {
    const schemaPath = fileURLToPath(new URL('../schemas/evidence-package.schema.json', import.meta.url));
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));

    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.required.includes('diffSummary'), true);
    assert.equal(schema.properties.checks.items.additionalProperties, false);
    assert.equal(schema.properties.checks.items.required.includes('output'), true);
  });

  it('skips real model invocation unless explicitly gated on', async () => {
    const adapter = new FakeSmokeAdapter({});
    const result = await runCodexRealSmoke({
      adapter,
      env: {},
      workspace: '/work/repo'
    });

    assert.equal(result.skipped, true);
    assert.match(result.reason, /MCAS_RUN_REAL_CODEX=1/);
    assert.equal(adapter.calls.length, 0);
  });

  it('runs a read-only real-mode smoke path and verifies structured evidence', async () => {
    const adapter = new FakeSmokeAdapter({
      command: 'qa',
      taskId: 'model-task',
      workspaceId: 'model-workspace',
      changedFiles: [],
      checks: [{ name: 'codex-real-smoke', status: 'passed' }],
      knownRisks: [],
      agentSummary: 'Read package.json and README.md.',
      version: '1'
    });
    const result = await runCodexRealSmoke({
      adapter,
      env: {
        [REAL_CODEX_SMOKE_FLAG]: '1'
      },
      workspace: '/work/repo',
      timeoutMs: 1000
    });

    assert.equal(result.skipped, false);
    assert.equal(result.verification.status, 'passed');
    assert.equal(adapter.calls[0].executionMode, 'real');
    assert.equal(adapter.calls[0].commandSpec.workspacePolicy, 'review-only');
    assert.equal(adapter.calls[0].modelProfile, 'codex-config-default');
    assert.equal(adapter.calls[0].timeoutMs, 1000);
  });

  it('passes MCAS_CODEX_MODEL through to the adapter when provided', async () => {
    const adapter = new FakeSmokeAdapter({
      command: 'qa',
      taskId: 'task',
      workspaceId: '/work/repo',
      changedFiles: [],
      checks: [{ name: 'codex-real-smoke', status: 'passed' }],
      knownRisks: [],
      agentSummary: 'Read package metadata.',
      version: '1'
    });

    await runCodexRealSmoke({
      adapter,
      env: {
        [REAL_CODEX_SMOKE_FLAG]: '1',
        MCAS_CODEX_MODEL: 'gpt-5.5'
      },
      workspace: '/work/repo'
    });

    assert.equal(adapter.calls[0].modelProfile, 'gpt-5.5');
  });
});
