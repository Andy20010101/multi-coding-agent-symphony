import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import {
  CODEX_CONFIG_DEFAULT_MODEL_PROFILE,
  CodexAdapter
} from '../src/adapters/codex-adapter.js';
import { validateEvidencePackage } from '../src/contracts.js';
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

class FakeActiveProcessRunner {
  constructor() {
    this.cancelCalls = 0;
  }

  start() {
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

class SlowSuccessfulProcessRunner {
  async run() {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 10));

    return {
      exitCode: 0,
      signal: null,
      stdout: '',
      stderr: '',
      durationMs: 10,
      timedOut: false,
      stalled: false,
      outputFiles: {}
    };
  }
}

function sandboxArg(prepared) {
  const index = prepared.args.indexOf('--sandbox');

  return prepared.args[index + 1];
}

describe('Codex real CLI integration', () => {
  it('replays recorded Codex output as verifier-readable evidence', async () => {
    const runner = await FixtureReplayProcessRunner.fromFixture('fixtures/recordings/codex-qa-passing.json');
    const adapter = new CodexAdapter({
      cliVersion: '0.130.0',
      processRunner: runner
    });

    const handle = await adapter.start({
      commandSpec: qaCommandSpec,
      contextPack: {
        ...contextPack,
        commandName: 'qa',
        task: {
          ...contextPack.task,
          id: 'task-codex-qa'
        }
      },
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default',
      executionMode: 'real'
    });
    const evidence = await adapter.collectEvidence(handle);
    const verification = verifyEvidence({ commandSpec: qaCommandSpec, evidence });

    assert.equal(handle.dryRun, false);
    assert.equal(handle.status, 'completed');
    assert.equal(handle.exitCode, 0);
    assert.equal(validateEvidencePackage(evidence), evidence);
    assert.equal(evidence.command, 'qa');
    assert.equal(evidence.taskId, 'task-codex-qa');
    assert.equal(evidence.workspaceId, '/work/repo');
    assert.equal(verification.status, 'passed');
    assert.equal(verification.checks[0].name, 'codex-real-smoke');
    assert.equal(verification.checks[0].artifactId, 'qa-verification-log');
  });

  it('resolves relative real workspaces in the prepared Codex invocation', async () => {
    const adapter = new CodexAdapter({ cliVersion: '0.130.0' });
    const relativeWorkspace = 'tmp/harness-bridge-real/workspaces/task.scaffold/task.scaffold-primary-writer-1';
    const expectedWorkspace = resolve(relativeWorkspace);

    const prepared = await adapter.prepare({
      commandSpec,
      contextPack,
      workspace: relativeWorkspace,
      modelProfile: 'gpt-codex-default',
      executionMode: 'real'
    });

    const cdIndex = prepared.args.indexOf('--cd');

    assert.equal(prepared.cwd, expectedWorkspace);
    assert.equal(prepared.args[cdIndex + 1], expectedWorkspace);
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

  it('assigns unique run ids to concurrent real starts', async () => {
    const adapter = new CodexAdapter({
      cliVersion: '0.130.0',
      processRunner: new SlowSuccessfulProcessRunner()
    });

    const [first, second] = await Promise.all([
      adapter.start({
        commandSpec,
        contextPack,
        workspace: '/work/repo-a',
        modelProfile: 'gpt-codex-default',
        executionMode: 'real'
      }),
      adapter.start({
        commandSpec,
        contextPack,
        workspace: '/work/repo-b',
        modelProfile: 'gpt-codex-default',
        executionMode: 'real'
      })
    ]);

    assert.notEqual(first.runId, second.runId);
    assert.deepEqual([first.runId, second.runId].sort(), [
      'codex-task-123-1',
      'codex-task-123-2'
    ]);
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
    assert.match(review.prompt, /changedFiles must describe only files modified by the review command/);
    assert.match(review.prompt, /Do not copy implementation changedFiles from prior evidence/);
    assert.match(qa.prompt, /Role: QA verifier/);
    assert.match(qa.prompt, /Do not copy implementation changedFiles from prior evidence/);
    assert.match(qa.prompt, /At least one QA checks\[\] entry must include a non-null artifactId/);
    assert.equal(
      [implement, review, qa].every((prepared) => prepared.prompt.includes('Return an EvidencePackage JSON object')),
      true
    );
  });

  it('renders verification command constraints into the Codex prompt', async () => {
    const adapter = new CodexAdapter({ cliVersion: '0.130.0' });
    const prepared = await adapter.prepare({
      commandSpec,
      contextPack: {
        ...contextPack,
        task: {
          ...contextPack.task,
          constraints: [
            'write_set:synthetic-dry-run.txt',
            'verification_command:test -f synthetic-dry-run.txt'
          ]
        }
      },
      workspace: '/work/repo',
      modelProfile: CODEX_CONFIG_DEFAULT_MODEL_PROFILE,
      executionMode: 'real'
    });

    assert.match(prepared.prompt, /Required verification commands:/);
    assert.match(prepared.prompt, /test -f synthetic-dry-run\.txt/);
    assert.match(prepared.prompt, /checks\[\]\.command exactly equals/);
  });

  it('renders Codex sandbox flags for read-only smoke, writer smoke, parallel writer, and review policy', async () => {
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
    const parallelWriter = await adapter.prepare({
      commandSpec: {
        ...commandSpec,
        workspacePolicy: 'parallel-writer'
      },
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
    assert.equal(sandboxArg(parallelWriter), 'workspace-write');
    assert.equal(sandboxArg(review), 'read-only');
  });

  it('streams parsed Codex JSONL output as adapter events', async () => {
    const runner = await FixtureReplayProcessRunner.fromFixture('fixtures/recordings/codex-implement-unverified.json');
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
      'command.finished'
    ]);
    assert.equal(events[1].payload.type, 'agent_message');
    assert.equal(events.at(-1).exitCode, 0);
  });

  it('collects real Codex output as unverified evidence', async () => {
    const runner = await FixtureReplayProcessRunner.fromFixture('fixtures/recordings/codex-implement-unverified.json');
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
    const runner = await FixtureReplayProcessRunner.fromFixture(
      'fixtures/recordings/codex-implement-structured-final-message.json'
    );
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
      checks: [{ name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'tests passed' }]
    });
  });

  it('falls back to structured evidence embedded in JSONL output', async () => {
    const runner = await FixtureReplayProcessRunner.fromFixture(
      'fixtures/recordings/codex-implement-jsonl-evidence.json'
    );
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
      { name: 'node --test', status: 'passed', command: 'node --test', exitCode: 0, output: 'node tests passed' }
    ]);
    assert.equal(evidence.knownRisks.length, 0);
  });

  it('normalizes strict schema null check output from command provenance', async () => {
    const runner = await FixtureReplayProcessRunner.fromFixture(
      'fixtures/recordings/codex-implement-null-check-output.json'
    );
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

    assert.deepEqual(evidence.checks, [{
      name: 'required-file-exists',
      status: 'passed',
      command: 'test -f synthetic-dry-run.txt',
      exitCode: 0,
      output: 'Command exited with code 0.'
    }]);
  });

  it('marks timed out Codex processes as failed with retry metadata', async () => {
    const runner = await FixtureReplayProcessRunner.fromFixture('fixtures/recordings/codex-implement-timeout.json');
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
        fixture: 'fixtures/recordings/codex-implement-error-permission-denied.json',
        expected: {
          category: 'permission-denied',
          retryable: false,
          owner: 'policy',
          recommendedNextCommand: 'plan'
        }
      },
      {
        code: 'model_off_task',
        fixture: 'fixtures/recordings/codex-implement-error-model-off-task.json',
        expected: {
          category: 'model-off-task',
          retryable: true,
          owner: 'router',
          recommendedNextCommand: 'plan'
        }
      },
      {
        code: 'internal_error',
        fixture: 'fixtures/recordings/codex-implement-error-internal.json',
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
        processRunner: await FixtureReplayProcessRunner.fromFixture(testCase.fixture)
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
