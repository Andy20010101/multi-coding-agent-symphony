import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CODEX_CONFIG_DEFAULT_MODEL_PROFILE,
  CodexAdapter
} from '../src/adapters/codex-adapter.js';
import { validateEvidencePackage } from '../src/contracts.js';
import { verifyEvidence } from '../src/verifier.js';

const commandSpec = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'primary-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
};

const reviewCommandSpec = {
  name: 'review',
  version: '1',
  allowedTools: ['read', 'shell'],
  workspacePolicy: 'review-only',
  doneCriteria: ['findings-written', 'evidence-written'],
  evidenceSchema: 'review-evidence.v1'
};

const qaCommandSpec = {
  name: 'qa',
  version: '1',
  allowedTools: ['read', 'shell', 'test'],
  workspacePolicy: 'isolated',
  doneCriteria: ['checks-run', 'evidence-written'],
  evidenceSchema: 'qa-evidence.v1'
};

const contextPack = {
  version: '1',
  commandName: 'implement',
  task: {
    id: 'task-123',
    source: 'github',
    repository: 'Andy20010101/multi-coding-agent-symphony',
    objective: 'Run Codex through a real process runner',
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

class FakeActiveProcessRunner {
  constructor() {
    this.calls = [];
    this.cancelCalls = 0;
  }

  start(invocation) {
    this.calls.push(invocation);

    return {
      pid: 12345,
      result: Promise.resolve({
        exitCode: null,
        signal: 'SIGTERM',
        stdout: 'partial stdout',
        stderr: '',
        durationMs: 5,
        timedOut: false,
        cancelled: true,
        outputFiles: {}
      }),
      cancel: () => {
        this.cancelCalls += 1;
        return {
          status: 'cancelled',
          signal: 'SIGTERM'
        };
      }
    };
  }
}

function sandboxArg(prepared) {
  const index = prepared.args.indexOf('--sandbox');

  return prepared.args[index + 1];
}

describe('Codex real CLI integration', () => {
  it('starts Codex through an injected process runner', async () => {
    const runner = new FakeProcessRunner({
      exitCode: 0,
      stdout: '{"type":"message","message":"done"}\n',
      stderr: '',
      durationMs: 12
    });
    const adapter = new CodexAdapter({
      cliVersion: '0.130.0',
      processRunner: runner
    });

    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default',
      executionMode: 'real'
    });

    assert.equal(runner.calls[0].executable, 'codex');
    assert.deepEqual(runner.calls[0].args.slice(0, 2), ['exec', '--json']);
    assert.equal(runner.calls[0].args.includes('--output-schema'), true);
    assert.equal(runner.calls[0].args.includes('--output-last-message'), true);
    assert.equal(runner.calls[0].cwd, '/work/repo');
    assert.match(runner.calls[0].stdin, /Run Codex through a real process runner/);
    assert.equal(handle.dryRun, false);
    assert.equal(handle.status, 'completed');
    assert.equal(handle.exitCode, 0);
  });

  it('can defer real model selection to Codex CLI config', async () => {
    const adapter = new CodexAdapter({ cliVersion: '0.130.0' });

    const prepared = await adapter.prepare({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: CODEX_CONFIG_DEFAULT_MODEL_PROFILE,
      executionMode: 'real'
    });

    assert.equal(prepared.args.includes('--model'), false);
    assert.equal(prepared.args.includes('--output-schema'), true);
  });

  it('maps project model profile ids to Codex CLI models or config default', async () => {
    const adapter = new CodexAdapter({
      cliVersion: '0.130.0',
      modelProfileMappings: {
        'codex-writer-explicit': 'gpt-5.4'
      }
    });

    const explicit = await adapter.prepare({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'codex-writer-explicit',
      executionMode: 'real'
    });
    const explicitModelIndex = explicit.args.indexOf('--model');

    assert.equal(explicit.resolvedModelProfile, 'codex-writer-explicit');
    assert.equal(explicit.resolvedModel, 'gpt-5.4');
    assert.equal(explicit.args[explicitModelIndex + 1], 'gpt-5.4');

    const configDefault = await adapter.prepare({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default',
      executionMode: 'real'
    });

    assert.equal(configDefault.resolvedModelProfile, 'gpt-codex-default');
    assert.equal(configDefault.resolvedModel, CODEX_CONFIG_DEFAULT_MODEL_PROFILE);
    assert.equal(configDefault.args.includes('--model'), false);
    assert.equal((await adapter.probe()).modelProfiles.includes('codex-writer-explicit'), true);
  });

  it('renders command-specific Codex prompts while preserving evidence instructions', async () => {
    const adapter = new CodexAdapter({ cliVersion: '0.130.0' });

    const implement = await adapter.prepare({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: CODEX_CONFIG_DEFAULT_MODEL_PROFILE,
      executionMode: 'real'
    });
    const review = await adapter.prepare({
      commandSpec: reviewCommandSpec,
      contextPack: { ...contextPack, commandName: 'review' },
      workspace: '/work/repo',
      modelProfile: CODEX_CONFIG_DEFAULT_MODEL_PROFILE,
      executionMode: 'real'
    });
    const qa = await adapter.prepare({
      commandSpec: qaCommandSpec,
      contextPack: { ...contextPack, commandName: 'qa' },
      workspace: '/work/repo',
      modelProfile: CODEX_CONFIG_DEFAULT_MODEL_PROFILE,
      executionMode: 'real'
    });

    assert.match(implement.prompt, /Role: primary writer/);
    assert.match(review.prompt, /Role: reviewer/);
    assert.match(review.prompt, /Do not edit files/);
    assert.match(qa.prompt, /Role: QA verifier/);
    assert.equal(
      [implement, review, qa].every((prepared) => prepared.prompt.includes('Return an EvidencePackage JSON object')),
      true
    );
  });

  it('renders Codex sandbox flags for read-only smoke, writer smoke, and review policy', async () => {
    const adapter = new CodexAdapter({ cliVersion: '0.130.0' });
    const readOnlySmoke = await adapter.prepare({
      commandSpec: {
        ...qaCommandSpec,
        workspacePolicy: 'review-only'
      },
      contextPack: { ...contextPack, commandName: 'qa' },
      workspace: '/work/repo',
      modelProfile: CODEX_CONFIG_DEFAULT_MODEL_PROFILE,
      executionMode: 'real'
    });
    const writerSmoke = await adapter.prepare({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: CODEX_CONFIG_DEFAULT_MODEL_PROFILE,
      executionMode: 'real'
    });
    const review = await adapter.prepare({
      commandSpec: reviewCommandSpec,
      contextPack: { ...contextPack, commandName: 'review' },
      workspace: '/work/repo',
      modelProfile: CODEX_CONFIG_DEFAULT_MODEL_PROFILE,
      executionMode: 'real'
    });

    assert.equal(sandboxArg(readOnlySmoke), 'read-only');
    assert.equal(sandboxArg(writerSmoke), 'workspace-write');
    assert.equal(sandboxArg(review), 'read-only');
  });

  it('streams parsed Codex JSONL output as adapter events', async () => {
    const runner = new FakeProcessRunner({
      exitCode: 0,
      stdout: [
        '{"type":"agent_message","message":"started"}',
        '{"type":"tool_call","tool":"shell","status":"completed"}'
      ].join('\n'),
      stderr: '',
      durationMs: 12
    });
    const adapter = new CodexAdapter({
      cliVersion: '0.130.0',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default',
      executionMode: 'real'
    });
    const events = [];

    for await (const event of adapter.streamEvents(handle)) {
      events.push(event);
    }

    assert.deepEqual(events.map((event) => event.type), [
      'adapter.started',
      'tool.observed',
      'tool.observed',
      'command.finished'
    ]);
    assert.equal(events[1].payload.type, 'agent_message');
    assert.equal(events.at(-1).exitCode, 0);
  });

  it('collects real Codex output as unverified evidence', async () => {
    const runner = new FakeProcessRunner({
      exitCode: 0,
      stdout: '{"type":"agent_message","message":"done"}\n',
      stderr: 'debug line',
      durationMs: 12
    });
    const adapter = new CodexAdapter({
      cliVersion: '0.130.0',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default',
      executionMode: 'real'
    });

    assert.deepEqual(await adapter.collectEvidence(handle), {
      command: 'implement',
      taskId: 'task-123',
      workspaceId: '/work/repo',
      changedFiles: [],
      checks: [],
      knownRisks: ['real-cli-output-unverified'],
      agentSummary: 'Codex real CLI completed with exit code 0.',
      stdout: '{"type":"agent_message","message":"done"}\n',
      stderr: 'debug line',
      version: '1'
    });
  });

  it('collects structured final Codex output as verifier-readable evidence', async () => {
    const runner = new FakeProcessRunner({
      exitCode: 0,
      stdout: '{"type":"agent_message","message":"done"}\n',
      stderr: '',
      durationMs: 12,
      outputFiles: {
        lastMessage: {
          path: '/tmp/codex-last-message.json',
          content: JSON.stringify({
            command: 'implement',
            taskId: 'model-supplied-task-id',
            workspaceId: 'model-supplied-workspace',
            diffSummary: ['Added real evidence parsing.'],
            changedFiles: ['src/adapters/codex-adapter.js'],
            checks: [{ name: 'pnpm test', status: 'passed', output: 'tests passed' }],
            knownRisks: [],
            agentSummary: 'Parsed evidence from the final Codex message.',
            version: '1'
          })
        }
      }
    });
    const adapter = new CodexAdapter({
      cliVersion: '0.130.0',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default',
      executionMode: 'real'
    });

    const evidence = await adapter.collectEvidence(handle);

    assert.equal(validateEvidencePackage(evidence), evidence);
    assert.equal(evidence.taskId, 'task-123');
    assert.equal(evidence.workspaceId, '/work/repo');
    assert.deepEqual(verifyEvidence({ commandSpec, evidence }), {
      status: 'passed',
      reason: 'checks-passed',
      checks: [{ name: 'pnpm test', status: 'passed', output: 'tests passed' }]
    });
  });

  it('falls back to structured evidence embedded in JSONL output', async () => {
    const runner = new FakeProcessRunner({
      exitCode: 0,
      stdout: JSON.stringify({
        type: 'agent_message',
        message: JSON.stringify({
          command: 'implement',
          taskId: 'task-123',
          workspaceId: '/work/repo',
          diffSummary: [],
          changedFiles: ['src/adapters/codex-adapter.js'],
          checks: [{ name: 'node --test', status: 'passed', output: 'node tests passed' }],
          knownRisks: [],
          agentSummary: 'Evidence emitted in JSONL output.',
          version: '1'
        })
      }),
      stderr: '',
      durationMs: 12
    });
    const adapter = new CodexAdapter({
      cliVersion: '0.130.0',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default',
      executionMode: 'real'
    });

    const evidence = await adapter.collectEvidence(handle);

    assert.deepEqual(evidence.checks, [
      { name: 'node --test', status: 'passed', output: 'node tests passed' }
    ]);
    assert.equal(evidence.knownRisks.length, 0);
  });

  it('marks timed out Codex processes as failed with retry metadata', async () => {
    const runner = new FakeProcessRunner({
      exitCode: null,
      signal: 'SIGTERM',
      stdout: '',
      stderr: 'timeout',
      durationMs: 1000,
      timedOut: true
    });
    const adapter = new CodexAdapter({
      cliVersion: '0.130.0',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default',
      executionMode: 'real'
    });

    assert.equal(handle.status, 'failed');
    assert.deepEqual(handle.failure, {
      category: 'cli-timeout',
      retryable: true,
      owner: 'adapter',
      recommendedNextCommand: 'qa'
    });
  });

  it('maps structured Codex error events to failure taxonomy categories', async () => {
    const cases = [
      {
        code: 'permission_denied',
        expected: {
          category: 'permission-denied',
          retryable: false,
          owner: 'policy',
          recommendedNextCommand: 'plan'
        }
      },
      {
        code: 'model_off_task',
        expected: {
          category: 'model-off-task',
          retryable: true,
          owner: 'router',
          recommendedNextCommand: 'plan'
        }
      },
      {
        code: 'internal_error',
        expected: {
          category: 'adapter-crashed',
          retryable: true,
          owner: 'adapter',
          recommendedNextCommand: 'qa'
        }
      }
    ];

    for (const testCase of cases) {
      const adapter = new CodexAdapter({
        cliVersion: '0.130.0',
        processRunner: new FakeProcessRunner({
          exitCode: 1,
          stdout: JSON.stringify({
            type: 'error',
            code: testCase.code,
            message: `${testCase.code} from Codex`
          }),
          stderr: '',
          durationMs: 12
        })
      });
      const handle = await adapter.start({
        commandSpec,
        contextPack,
        workspace: '/work/repo',
        modelProfile: 'gpt-codex-default',
        executionMode: 'real'
      });

      assert.deepEqual(handle.failure, testCase.expected);
    }
  });

  it('cancels active real Codex process handles through adapter lifecycle', async () => {
    const runner = new FakeActiveProcessRunner();
    const adapter = new CodexAdapter({
      cliVersion: '0.130.0',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default',
      executionMode: 'real',
      lifecycleMode: 'active'
    });

    assert.equal(handle.status, 'running');
    assert.equal(runner.calls.length, 1);
    assert.deepEqual(await adapter.cancel(handle), {
      runId: handle.runId,
      status: 'cancelled',
      signal: 'SIGTERM'
    });
    assert.deepEqual(await adapter.cancel(handle), {
      runId: handle.runId,
      status: 'cancelled',
      signal: 'SIGTERM'
    });
    assert.equal(runner.cancelCalls, 1);
    assert.equal((await adapter.resume({ runId: handle.runId })).status, 'cancelled');
    assert.deepEqual(await adapter.collectEvidence(handle), {
      command: 'implement',
      taskId: 'task-123',
      workspaceId: '/work/repo',
      changedFiles: [],
      checks: [],
      knownRisks: ['cancelled-run'],
      agentSummary: 'Codex real CLI was cancelled before completion.',
      stdout: 'partial stdout',
      stderr: '',
      version: '1'
    });
  });
});
