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

  it('normalizes fenced Claude JSON with verifier checks when summary fields are missing', async () => {
    const runner = new StaticProcessRunner({
      stdout: `${JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'text',
              text: [
                '```json',
                JSON.stringify({
                  command: 'implement',
                  taskId: 'task-claude',
                  workspaceId: '/work/repo',
                  diffSummary: [],
                  changedFiles: [],
                  noOpRationale: 'No file changes required for replay normalization.',
                  checks: [
                    {
                      name: 'pnpm test',
                      status: 'passed',
                      command: 'pnpm test',
                      exitCode: 0,
                      output: 'tests passed',
                      artifactId: null
                    }
                  ]
                }, null, 2),
                '```'
              ].join('\n')
            }
          ]
        }
      })}\n`
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

    assert.equal(evidence.agentSummary, 'Structured evidence extracted from CLI output.');
    assert.deepEqual(verifyEvidence({ commandSpec, evidence }), {
      status: 'passed',
      reason: 'checks-passed',
      checks: [{ name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'tests passed' }]
    });
  });

  it('records the observed Claude model profile from stream init events', async () => {
    const runner = new StaticProcessRunner({
      stdout: [
        JSON.stringify({
          type: 'system',
          subtype: 'init',
          model: 'deepseek-v4-pro'
        }),
        JSON.stringify({
          type: 'assistant',
          message: {
            content: [{
              type: 'text',
              text: JSON.stringify({
                command: 'implement',
                taskId: 'task-claude',
                workspaceId: '/work/repo',
                diffSummary: [],
                changedFiles: [],
                noOpRationale: 'No file changes were needed.',
                checks: [{
                  name: 'pnpm test',
                  status: 'passed',
                  command: 'pnpm test',
                  exitCode: 0,
                  output: 'tests passed'
                }],
                knownRisks: [],
                agentSummary: 'Structured evidence returned.',
                version: '1'
              })
            }]
          }
        })
      ].join('\n')
    });
    const adapter = new ClaudeCodeAdapter({
      cliVersion: '2.1.123',
      processRunner: runner
    });

    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'sonnet',
      executionMode: 'real'
    });
    const evidence = await adapter.collectEvidence(handle);

    assert.equal(handle.requestedModelProfile, 'sonnet');
    assert.equal(handle.observedModelProfile, 'deepseek-v4-pro');
    assert.equal(handle.modelProfileStatus, 'mismatched');
    assert.deepEqual(handle.modelProfileMismatch, {
      requestedModelProfile: 'sonnet',
      observedModelProfile: 'deepseek-v4-pro'
    });
    assert.equal(evidence.knownRisks.includes('real-cli-model-profile-mismatch'), true);
    assert.equal(verifyEvidence({ commandSpec, evidence }).status, 'passed');
  });
});

class StaticProcessRunner {
  constructor({ stdout, stderr = '' }) {
    this.stdout = stdout;
    this.stderr = stderr;
  }

  async run() {
    return {
      exitCode: 0,
      signal: null,
      stdout: this.stdout,
      stderr: this.stderr,
      durationMs: 1,
      timedOut: false,
      stalled: false
    };
  }
}
