import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { KiroCliAdapter } from '../src/adapters/kiro-cli-adapter.js';
import { verifyEvidence } from '../src/verifier.js';

const commandSpec = {
  name: 'qa',
  version: '1',
  allowedTools: ['read', 'shell', 'test'],
  workspacePolicy: 'isolated',
  doneCriteria: ['checks-run', 'evidence-written'],
  evidenceSchema: 'qa-evidence.v1'
};

const contextPack = {
  version: '1',
  commandName: 'qa',
  task: {
    id: 'task-kiro',
    source: 'manual',
    repository: 'Andy20010101/multi-coding-agent-symphony',
    objective: 'Run Kiro CLI through a real process runner',
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

describe('Kiro CLI real integration', () => {
  it('starts Kiro CLI through an injected process runner', async () => {
    const runner = new FakeProcessRunner({
      exitCode: 0,
      stdout: '{"message":"done"}\n',
      stderr: '',
      durationMs: 12
    });
    const adapter = new KiroCliAdapter({
      cliVersion: '2.2.2',
      processRunner: runner
    });

    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'claude-kiro-default',
      executionMode: 'real',
      timeoutMs: 1000
    });

    assert.equal(runner.calls[0].executable, 'kiro-cli');
    assert.deepEqual(runner.calls[0].args.slice(0, 2), ['chat', '--no-interactive']);
    assert.equal(runner.calls[0].cwd, '/work/repo');
    assert.equal(runner.calls[0].timeoutMs, 1000);
    assert.match(runner.calls[0].stdin, /Run Kiro CLI through a real process runner/);
    assert.equal(handle.dryRun, false);
    assert.equal(handle.status, 'completed');
    assert.equal(handle.exitCode, 0);
  });

  it('collects structured Kiro output as verifier-readable evidence', async () => {
    const runner = new FakeProcessRunner({
      exitCode: 0,
      stdout: JSON.stringify({
        evidence: {
          command: 'qa',
          taskId: 'model-task',
          workspaceId: 'model-workspace',
          diffSummary: [],
          changedFiles: [],
          checks: [{ name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, artifactId: 'test-log', output: 'tests passed' }],
          knownRisks: [],
          agentSummary: 'Parsed evidence from Kiro stdout.',
          version: '1'
        }
      }),
      stderr: '',
      durationMs: 12
    });
    const adapter = new KiroCliAdapter({
      cliVersion: '2.2.2',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'claude-kiro-default',
      executionMode: 'real'
    });

    const evidence = await adapter.collectEvidence(handle);

    assert.equal(evidence.taskId, 'task-kiro');
    assert.equal(evidence.workspaceId, '/work/repo');
    assert.deepEqual(verifyEvidence({ commandSpec, evidence }), {
      status: 'passed',
      reason: 'checks-passed',
      checks: [{ name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, artifactId: 'test-log', output: 'tests passed' }]
    });
  });

  it('collects raw Kiro output as unverified evidence when structure is missing', async () => {
    const runner = new FakeProcessRunner({
      exitCode: 0,
      stdout: 'done\n',
      stderr: 'debug line',
      durationMs: 12
    });
    const adapter = new KiroCliAdapter({
      cliVersion: '2.2.2',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'claude-kiro-default',
      executionMode: 'real'
    });

    assert.deepEqual(await adapter.collectEvidence(handle), {
      command: 'qa',
      taskId: 'task-kiro',
      workspaceId: '/work/repo',
      changedFiles: [],
      checks: [],
      knownRisks: ['real-cli-output-unverified'],
      agentSummary: 'Kiro CLI real execution completed with exit code 0.',
      stdout: 'done\n',
      stderr: 'debug line',
      version: '1'
    });
  });
});
