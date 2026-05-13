import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  REAL_KIRO_SMOKE_FLAG,
  runKiroRealSmoke
} from '../src/kiro-real-smoke.js';

class FakeSmokeAdapter {
  constructor(evidence) {
    this.evidence = evidence;
    this.calls = [];
  }

  async start(input) {
    this.calls.push(input);

    return {
      runId: 'fake-kiro-run',
      adapterId: 'kiro-cli',
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

describe('Kiro CLI real model smoke script', () => {
  it('skips real model invocation unless explicitly gated on', async () => {
    const adapter = new FakeSmokeAdapter({});
    const result = await runKiroRealSmoke({
      adapter,
      env: {},
      workspace: '/work/repo'
    });

    assert.equal(result.skipped, true);
    assert.match(result.reason, /MCAS_RUN_REAL_KIRO=1/);
    assert.equal(adapter.calls.length, 0);
  });

  it('runs a read-only real-mode smoke path and verifies structured evidence', async () => {
    const adapter = new FakeSmokeAdapter({
      command: 'qa',
      taskId: 'kiro-model-task',
      workspaceId: 'kiro-model-workspace',
      diffSummary: [],
      changedFiles: [],
      checks: [{ name: 'kiro-real-smoke', status: 'passed', output: 'smoke passed' }],
      knownRisks: [],
      agentSummary: 'Read package.json and README.md.',
      version: '1'
    });
    const result = await runKiroRealSmoke({
      adapter,
      env: {
        [REAL_KIRO_SMOKE_FLAG]: '1'
      },
      workspace: '/work/repo',
      timeoutMs: 1000
    });

    assert.equal(result.skipped, false);
    assert.equal(result.verification.status, 'passed');
    assert.equal(adapter.calls[0].executionMode, 'real');
    assert.deepEqual(adapter.calls[0].commandSpec.allowedTools, ['read']);
    assert.equal(adapter.calls[0].commandSpec.workspacePolicy, 'review-only');
    assert.equal(adapter.calls[0].modelProfile, 'claude-kiro-default');
    assert.equal(adapter.calls[0].timeoutMs, 1000);
  });

  it('passes MCAS_KIRO_MODEL through to the adapter when provided', async () => {
    const adapter = new FakeSmokeAdapter({
      command: 'qa',
      taskId: 'task',
      workspaceId: '/work/repo',
      diffSummary: [],
      changedFiles: [],
      checks: [{ name: 'kiro-real-smoke', status: 'passed', output: 'smoke passed' }],
      knownRisks: [],
      agentSummary: 'Read package metadata.',
      version: '1'
    });

    await runKiroRealSmoke({
      adapter,
      env: {
        [REAL_KIRO_SMOKE_FLAG]: '1',
        MCAS_KIRO_MODEL: 'claude-sonnet-4-6'
      },
      workspace: '/work/repo'
    });

    assert.equal(adapter.calls[0].modelProfile, 'claude-sonnet-4-6');
  });
});
