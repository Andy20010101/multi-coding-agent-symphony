import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ClaudeCodeAdapter } from '../src/adapters/claude-code-adapter.js';
import { verifyEvidence } from '../src/verifier.js';

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

class FakeProcessRunner {
  constructor(result) {
    this.result = result;
    this.calls = [];
  }

  async run(invocation) {
    this.calls.push(invocation);
    return this.result;
  }
}

describe('Claude Code real CLI integration', () => {
  it('starts Claude Code through an injected process runner', async () => {
    const runner = new FakeProcessRunner({
      exitCode: 0,
      stdout: '{"type":"assistant","message":"done"}\n',
      stderr: '',
      durationMs: 12
    });
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

    assert.equal(runner.calls[0].executable, 'claude');
    assert.deepEqual(runner.calls[0].args.slice(0, 3), ['-p', '--output-format', 'stream-json']);
    assert.equal(runner.calls[0].cwd, '/work/repo');
    assert.equal(runner.calls[0].timeoutMs, 1000);
    assert.match(runner.calls[0].stdin, /Run Claude Code through a real process runner/);
    assert.equal(handle.dryRun, false);
    assert.equal(handle.status, 'completed');
    assert.equal(handle.exitCode, 0);
  });

  it('collects structured Claude stream output as verifier-readable evidence', async () => {
    const runner = new FakeProcessRunner({
      exitCode: 0,
      stdout: JSON.stringify({
        type: 'assistant',
        message: JSON.stringify({
          command: 'implement',
          taskId: 'model-task',
          workspaceId: 'model-workspace',
          diffSummary: ['Added Claude real evidence parsing.'],
          changedFiles: ['src/adapters/claude-code-adapter.js'],
          checks: [{ name: 'pnpm test', status: 'passed', output: 'tests passed' }],
          knownRisks: [],
          agentSummary: 'Parsed evidence from Claude stream-json output.',
          version: '1'
        })
      }),
      stderr: '',
      durationMs: 12
    });
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
      checks: [{ name: 'pnpm test', status: 'passed', output: 'tests passed' }]
    });
  });

  it('collects raw Claude output as unverified evidence when structure is missing', async () => {
    const runner = new FakeProcessRunner({
      exitCode: 0,
      stdout: '{"type":"assistant","message":"done"}\n',
      stderr: 'debug line',
      durationMs: 12
    });
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
