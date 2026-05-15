import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { KiroCliAdapter } from '../src/adapters/kiro-cli-adapter.js';
import { verifyEvidence } from '../src/verifier.js';
import { FixtureReplayProcessRunner } from './helpers/fixture-replay-runner.js';

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

describe('Kiro CLI real integration', () => {
  it('replays recorded Kiro output through the real adapter lifecycle', async () => {
    const runner = await FixtureReplayProcessRunner.fromFixture('fixtures/recordings/kiro-qa-passing.json');
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
    const evidence = await adapter.collectEvidence(handle);

    assert.equal(handle.dryRun, false);
    assert.equal(handle.status, 'completed');
    assert.equal(handle.exitCode, 0);
    assert.equal(evidence.checks[0].artifactId, 'test-log');
    assert.equal(verifyEvidence({ commandSpec, evidence }).status, 'passed');
  });

  it('collects structured Kiro output as verifier-readable evidence', async () => {
    const runner = await FixtureReplayProcessRunner.fromFixture('fixtures/recordings/kiro-qa-passing.json');
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
    const runner = await FixtureReplayProcessRunner.fromFixture('fixtures/recordings/kiro-qa-unverified.json');
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
