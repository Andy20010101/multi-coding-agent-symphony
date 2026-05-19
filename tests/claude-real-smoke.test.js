import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  REAL_CLAUDE_SMOKE_FLAG,
  runClaudeRealSmoke
} from '../src/claude-real-smoke.js';

class FakeSmokeAdapter {
  constructor(evidence, handle = {}) {
    this.evidence = evidence;
    this.handle = handle;
    this.calls = [];
  }

  async start(input) {
    this.calls.push(input);

    return {
      runId: 'fake-claude-run',
      adapterId: 'claude-code',
      status: 'completed',
      exitCode: 0,
      ...this.handle
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

describe('Claude Code real model smoke script', () => {
  it('skips real model invocation unless explicitly gated on', async () => {
    const adapter = new FakeSmokeAdapter({});
    const result = await runClaudeRealSmoke({
      adapter,
      env: {},
      workspace: '/work/repo'
    });

    assert.equal(result.skipped, true);
    assert.match(result.reason, /MCAS_RUN_REAL_CLAUDE=1/);
    assert.equal(adapter.calls.length, 0);
  });

  it('runs a read-only real-mode smoke path and verifies structured evidence', async () => {
    const adapter = new FakeSmokeAdapter({
      command: 'qa',
      taskId: 'claude-model-task',
      workspaceId: 'claude-model-workspace',
      diffSummary: [],
      changedFiles: [],
      checks: [{ name: 'claude-real-smoke', status: 'passed', output: 'smoke passed' }],
      knownRisks: [],
      agentSummary: 'Read package.json and README.md.',
      version: '1'
    });
    const result = await runClaudeRealSmoke({
      adapter,
      env: {
        [REAL_CLAUDE_SMOKE_FLAG]: '1'
      },
      workspace: '/work/repo',
      timeoutMs: 1000
    });

    assert.equal(result.skipped, false);
    assert.equal(result.runId, 'fake-claude-run');
    assert.equal(result.verification.status, 'passed');
    assert.equal(adapter.calls[0].executionMode, 'real');
    assert.equal(adapter.calls[0].commandSpec.workspacePolicy, 'review-only');
    assert.deepEqual(adapter.calls[0].commandSpec.allowedTools, ['read']);
    assert.equal(adapter.calls[0].modelProfile, 'deepseek-v4-pro');
    assert.equal(adapter.calls[0].timeoutMs, 1000);
  });

  it('uses the release config model before the adapter default', async () => {
    const adapter = new FakeSmokeAdapter({
      command: 'qa',
      taskId: 'task',
      workspaceId: '/work/repo',
      diffSummary: [],
      changedFiles: [],
      checks: [{ name: 'claude-real-smoke', status: 'passed', output: 'smoke passed' }],
      knownRisks: [],
      agentSummary: 'Read package metadata.',
      version: '1'
    });

    await runClaudeRealSmoke({
      adapter,
      env: {
        [REAL_CLAUDE_SMOKE_FLAG]: '1'
      },
      realCliConfig: {
        version: '1',
        models: {
          'claude-code': 'release-config-claude'
        }
      },
      workspace: '/work/repo'
    });

    assert.equal(adapter.calls[0].modelProfile, 'release-config-claude');
  });

  it('passes MCAS_CLAUDE_MODEL through to the adapter when provided', async () => {
    const adapter = new FakeSmokeAdapter({
      command: 'qa',
      taskId: 'task',
      workspaceId: '/work/repo',
      diffSummary: [],
      changedFiles: [],
      checks: [{ name: 'claude-real-smoke', status: 'passed', output: 'smoke passed' }],
      knownRisks: [],
      agentSummary: 'Read package metadata.',
      version: '1'
    });

    await runClaudeRealSmoke({
      adapter,
      env: {
        [REAL_CLAUDE_SMOKE_FLAG]: '1',
        MCAS_CLAUDE_MODEL: 'deepseek-chat'
      },
      workspace: '/work/repo'
    });

    assert.equal(adapter.calls[0].modelProfile, 'deepseek-chat');
  });

  it('exposes requested and observed model profile diagnostics', async () => {
    const adapter = new FakeSmokeAdapter({
      command: 'qa',
      taskId: 'task',
      workspaceId: '/work/repo',
      diffSummary: [],
      changedFiles: [],
      checks: [{ name: 'claude-real-smoke', status: 'passed', output: 'smoke passed' }],
      knownRisks: ['real-cli-model-profile-mismatch'],
      agentSummary: 'Read package metadata.',
      version: '1'
    }, {
      requestedModelProfile: 'sonnet',
      observedModelProfile: 'deepseek-v4-pro',
      modelProfileStatus: 'mismatched',
      modelProfileMismatch: {
        requestedModelProfile: 'sonnet',
        observedModelProfile: 'deepseek-v4-pro'
      }
    });

    const result = await runClaudeRealSmoke({
      adapter,
      env: {
        [REAL_CLAUDE_SMOKE_FLAG]: '1',
        MCAS_CLAUDE_MODEL: 'sonnet'
      },
      workspace: '/work/repo'
    });

    assert.equal(result.modelProfile, 'sonnet');
    assert.equal(result.requestedModelProfile, 'sonnet');
    assert.equal(result.observedModelProfile, 'deepseek-v4-pro');
    assert.equal(result.modelProfileStatus, 'mismatched');
    assert.deepEqual(result.modelProfileMismatch, {
      requestedModelProfile: 'sonnet',
      observedModelProfile: 'deepseek-v4-pro'
    });
  });
});
