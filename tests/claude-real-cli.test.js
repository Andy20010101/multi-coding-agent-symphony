import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ClaudeCodeAdapter } from '../src/adapters/claude-code-adapter.js';
import { verifyEvidence } from '../src/verifier.js';
import { FixtureReplayProcessRunner } from './helpers/fixture-replay-runner.js';

const commandSpec = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'primary-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
};

const contextPack = {
  version: '1',
  commandName: 'implement',
  task: {
    id: 'task-claude',
    source: 'manual',
    repository: 'Andy20010101/multi-coding-agent-symphony',
    objective: 'Run Claude Code through a real process runner',
    acceptance: ['runner receives prompt on stdin'],
    version: '1'
  },
  events: [],
  artifactRefs: []
};

describe('Claude Code real CLI integration', () => {
  it('replays recorded Claude output through the real adapter lifecycle', async () => {
    const runner = await FixtureReplayProcessRunner.fromFixture('fixtures/recordings/claude-implement-passing.json');
    const adapter = new ClaudeCodeAdapter({
      cliVersion: '2.1.123',
      processRunner: runner
    });

    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'deepseek-claude-code',
      executionMode: 'real',
      timeoutMs: 1000
    });
    const evidence = await adapter.collectEvidence(handle);

    assert.equal(handle.dryRun, false);
    assert.equal(handle.status, 'completed');
    assert.equal(handle.exitCode, 0);
    assert.deepEqual(evidence.changedFiles, ['src/adapters/claude-code-adapter.js']);
    assert.equal(verifyEvidence({ commandSpec, evidence }).status, 'passed');
  });

  it('collects structured Claude stream output as verifier-readable evidence', async () => {
    const runner = await FixtureReplayProcessRunner.fromFixture('fixtures/recordings/claude-implement-passing.json');
    const adapter = new ClaudeCodeAdapter({
      cliVersion: '2.1.123',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'deepseek-claude-code',
      executionMode: 'real'
    });

    const evidence = await adapter.collectEvidence(handle);

    assert.equal(evidence.taskId, 'task-claude');
    assert.equal(evidence.workspaceId, '/work/repo');
    assert.deepEqual(verifyEvidence({ commandSpec, evidence }), {
      status: 'passed',
      reason: 'checks-passed',
      checks: [{ name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'tests passed' }]
    });
  });

  it('collects raw Claude output as unverified evidence when structure is missing', async () => {
    const runner = await FixtureReplayProcessRunner.fromFixture('fixtures/recordings/claude-implement-unverified.json');
    const adapter = new ClaudeCodeAdapter({
      cliVersion: '2.1.123',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'deepseek-claude-code',
      executionMode: 'real'
    });

    assert.deepEqual(await adapter.collectEvidence(handle), {
      command: 'implement',
      taskId: 'task-claude',
      workspaceId: '/work/repo',
      changedFiles: [],
      checks: [],
      knownRisks: ['real-cli-output-unverified'],
      agentSummary: 'Claude Code real CLI completed with exit code 0.',
      stdout: '{"type":"assistant","message":"done"}\n',
      stderr: 'debug line',
      version: '1'
    });
  });
});
