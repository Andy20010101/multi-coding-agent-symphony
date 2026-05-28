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

const smokeCommandSpec = {
  name: 'qa',
  version: '1',
  allowedTools: ['read'],
  workspacePolicy: 'review-only',
  doneCriteria: ['real-model-called', 'structured-evidence-written'],
  evidenceSchema: 'kiro-smoke-evidence.v1'
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

  it('normalizes Kiro smoke output that uses schema and check message fields', async () => {
    const runner = new StaticProcessRunner({
      stdout: [
        'Here is the structured EvidencePackage:',
        'json',
        JSON.stringify({
          schema: 'kiro-smoke-evidence.v1',
          taskId: 'task-kiro',
          checks: [
            {
              name: 'kiro-real-smoke',
              status: 'passed',
              message: 'package.json and README.md were both readable from the repository root'
            }
          ],
          doneCriteria: {
            'real-model-called': true,
            'structured-evidence-written': true
          }
        }, null, 2)
      ].join('\n')
    });
    const adapter = new KiroCliAdapter({
      cliVersion: '2.2.2',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec: smokeCommandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'claude-kiro-default',
      executionMode: 'real'
    });

    const evidence = await adapter.collectEvidence(handle);

    assert.equal(evidence.version, 'kiro-smoke-evidence.v1');
    assert.equal(evidence.checks[0].output, 'package.json and README.md were both readable from the repository root');
    assert.equal(verifyEvidence({ commandSpec: smokeCommandSpec, evidence }).status, 'passed');
  });

  it('normalizes ANSI-styled Kiro smoke JSON output', async () => {
    const runner = new StaticProcessRunner({
      stdout: [
        '\u001b[m> \u001b[0mBoth files are readable. Here is the structured EvidencePackage:',
        '\u001b[1mjson',
        '\u001b[0m{',
        '  \u001b[36m"schema"\u001b[0m: "kiro-smoke-evidence.v1",',
        '  \u001b[36m"taskId"\u001b[0m: "task-kiro",',
        '  \u001b[36m"checks"\u001b[0m: [',
        '    {',
        '      \u001b[36m"name"\u001b[0m: "kiro-real-smoke",',
        '      \u001b[36m"status"\u001b[0m: "passed",',
        '      \u001b[36m"detail"\u001b[0m: "package.json and README.md were readable"',
        '    }',
        '  ],',
        '  \u001b[36m"doneCriteria"\u001b[0m: {',
        '    "real-model-called": true,',
        '    "structured-evidence-written": true',
        '  }',
        '}\u001b[0m',
        'Summary: no files were edited.'
      ].join('\n')
    });
    const adapter = new KiroCliAdapter({
      cliVersion: '2.2.2',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec: smokeCommandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'claude-kiro-default',
      executionMode: 'real'
    });

    const evidence = await adapter.collectEvidence(handle);

    assert.equal(evidence.version, 'kiro-smoke-evidence.v1');
    assert.equal(evidence.checks[0].output, 'package.json and README.md were readable');
    assert.equal(verifyEvidence({ commandSpec: smokeCommandSpec, evidence }).status, 'passed');
  });

  it('extracts Kiro evidence JSON after earlier tool output JSON objects', async () => {
    const runner = new StaticProcessRunner({
      stdout: [
        'Batch fs_read operation with 2 operations',
        '{"name":"multi-coding-agent-symphony","version":"0.1.0"}',
        '\u001b[m> \u001b[0mBoth files were read successfully.',
        '\u001b[1mjson',
        '\u001b[0m{',
        '  "command": "qa",',
        '  "taskId": "task-kiro",',
        '  "workspaceId": "local",',
        '  "changedFiles": [],',
        '  "checks": [',
        '    {',
        '      "name": "kiro-real-smoke",',
        '      "status": "passed",',
        '      "evidence": {',
        '        "schema": "kiro-smoke-evidence.v1",',
        '        "realModelCalled": true',
        '      }',
        '    }',
        '  ],',
        '  "knownRisks": [],',
        '  "agentSummary": "Read-only Kiro CLI smoke test completed.",',
        '  "version": "kiro-smoke-evidence.v1"',
        '}',
        '\u001b[0m'
      ].join('\n')
    });
    const adapter = new KiroCliAdapter({
      cliVersion: '2.4.2',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec: smokeCommandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'claude-opus-4.7',
      executionMode: 'real'
    });

    const evidence = await adapter.collectEvidence(handle);

    assert.equal(evidence.version, 'kiro-smoke-evidence.v1');
    assert.equal(evidence.workspaceId, '/work/repo');
    assert.equal(evidence.checks[0].name, 'kiro-real-smoke');
    assert.equal(verifyEvidence({ commandSpec: smokeCommandSpec, evidence }).status, 'passed');
  });

  it('normalizes Kiro check details objects into verifier-readable output', async () => {
    const runner = new StaticProcessRunner({
      stdout: [
        'Both files are readable. Returning the structured EvidencePackage:',
        '{',
        '  "command": "qa",',
        '  "taskId": "task-kiro",',
        '  "workspaceId": "local",',
        '  "changedFiles": [],',
        '  "checks": [',
        '    {',
        '      "name": "kiro-real-smoke",',
        '      "status": "passed",',
        '      "details": {',
        '        "packageJsonReadable": true,',
        '        "readmeReadable": true',
        '      }',
        '    }',
        '  ],',
        '  "knownRisks": [],',
        '  "agentSummary": "Read-only Kiro CLI smoke test completed.",',
        '  "version": "kiro-smoke-evidence.v1"',
        '}'
      ].join('\n')
    });
    const adapter = new KiroCliAdapter({
      cliVersion: '2.4.2',
      processRunner: runner
    });
    const handle = await adapter.start({
      commandSpec: smokeCommandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'claude-opus-4.7',
      executionMode: 'real'
    });

    const evidence = await adapter.collectEvidence(handle);

    assert.equal(evidence.checks[0].output, 'Structured check details provided.');
    assert.equal(verifyEvidence({ commandSpec: smokeCommandSpec, evidence }).status, 'passed');
  });

  it('renders intake constraints into the shared Kiro prompt', async () => {
    const adapter = new KiroCliAdapter({
      cliVersion: '2.2.2'
    });
    const prepared = await adapter.prepare({
      commandSpec,
      contextPack: {
        ...contextPack,
        task: {
          ...contextPack.task,
          constraints: [
            'project_context_artifact:tmp/intake/project-context.json',
            'recommended_workflow:writer-reviewer',
            'verification_command:pnpm test'
          ]
        }
      },
      workspace: '/work/repo',
      modelProfile: 'claude-kiro-default',
      executionMode: 'real'
    });

    assert.match(prepared.prompt, /project_context_artifact:tmp\/intake\/project-context\.json/);
    assert.match(prepared.prompt, /recommended_workflow:writer-reviewer/);
    assert.match(prepared.prompt, /Required verification commands:/);
    assert.match(prepared.prompt, /pnpm test/);
    assert.match(prepared.prompt, /checks\[\]\.command exactly equals/);
  });

  it('passes explicit Kiro model profiles to the CLI model flag', async () => {
    const adapter = new KiroCliAdapter({
      cliVersion: '2.4.2'
    });

    const prepared = await adapter.prepare({
      commandSpec: smokeCommandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'claude-opus-4.7',
      executionMode: 'real'
    });

    assert.deepEqual(prepared.args.slice(0, 5), [
      'chat',
      '--no-interactive',
      '--trust-tools=read,grep',
      '--model',
      'claude-opus-4.7'
    ]);
  });

  it('keeps the default Kiro model profile on CLI defaults', async () => {
    const adapter = new KiroCliAdapter({
      cliVersion: '2.4.2'
    });

    const prepared = await adapter.prepare({
      commandSpec: smokeCommandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'claude-kiro-default',
      executionMode: 'real'
    });

    assert.equal(prepared.args.includes('--model'), false);
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
