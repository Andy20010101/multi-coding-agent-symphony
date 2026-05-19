import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { CodexAdapter } from '../src/adapters/codex-adapter.js';
import { ClaudeCodeAdapter } from '../src/adapters/claude-code-adapter.js';
import { KiroCliAdapter } from '../src/adapters/kiro-cli-adapter.js';

const implementCommand = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'primary-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
};

const reviewCommand = {
  name: 'review',
  version: '1',
  allowedTools: ['read', 'shell'],
  workspacePolicy: 'review-only',
  doneCriteria: ['findings-written', 'evidence-written'],
  evidenceSchema: 'review-evidence.v1'
};

const qaCommand = {
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
    objective: 'Prepare adapter dry-run commands',
    acceptance: ['adapters render commands without starting CLIs'],
    version: '1'
  },
  events: [],
  artifactRefs: []
};

describe('Phase 3 runtime adapter dry-run foundations', () => {
  it('probes stable capability reports for all initial adapters', async () => {
    const adapters = [
      new CodexAdapter({ cliVersion: '0.130.0' }),
      new ClaudeCodeAdapter({ cliVersion: '2.1.123' }),
      new KiroCliAdapter({ cliVersion: '2.2.2' })
    ];

    const reports = await Promise.all(adapters.map((adapter) => adapter.probe()));

    assert.deepEqual(reports.map((report) => report.adapterId), [
      'codex',
      'claude-code',
      'kiro-cli'
    ]);
    assert.equal(reports.every((report) => report.supportedCommands.includes('implement')), true);
    assert.equal(reports.every((report) => report.supportsNonInteractive), true);
    assert.equal(reports.every((report) => typeof report.logStrategy === 'string'), true);
  });

  it('renders Codex exec command arguments without starting the CLI', async () => {
    const adapter = new CodexAdapter({ cliVersion: '0.130.0' });

    const prepared = await adapter.prepare({
      commandSpec: implementCommand,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default',
      outputSchemaPath: '/tmp/evidence.schema.json'
    });

    assert.equal(prepared.dryRun, true);
    assert.equal(prepared.executable, 'codex');
    assert.deepEqual(prepared.args.slice(0, 6), [
      'exec',
      '--json',
      '--cd',
      '/work/repo',
      '--sandbox',
      'workspace-write'
    ]);
    assert.equal(prepared.args.includes('--output-schema'), true);
    assert.match(prepared.prompt, /Prepare adapter dry-run commands/);
  });

  it('renders Claude Code print-mode arguments with disallowed tools', async () => {
    const adapter = new ClaudeCodeAdapter({ cliVersion: '2.1.123' });

    const prepared = await adapter.prepare({
      commandSpec: reviewCommand,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'deepseek-claude-code',
      policyDecisions: [
        {
          decision: 'deny',
          reason: 'sensitive-path',
          matchedRule: '.env'
        }
      ]
    });

    assert.equal(prepared.executable, 'claude');
    assert.deepEqual(prepared.args.slice(0, 5), ['-p', '--output-format', 'stream-json', '--verbose', '--add-dir']);
    assert.equal(argumentValue(prepared.args, '--permission-mode'), 'dontAsk');
    assert.match(argumentValue(prepared.args, '--append-system-prompt'), /EvidencePackage JSON schema/);
    assert.deepEqual(JSON.parse(argumentValue(prepared.args, '--json-schema')).required, [
      'command',
      'taskId',
      'workspaceId',
      'diffSummary',
      'changedFiles',
      'checks',
      'knownRisks',
      'agentSummary',
      'version'
    ]);
    assert.deepEqual(valuesAfter(prepared.args, '--tools', '--disallowedTools'), ['Read', 'Bash']);
    assert.equal(prepared.args.includes('--disallowedTools'), true);
    assert.equal(prepared.args.includes('Read(.env)'), true);
    assert.match(prepared.prompt, /Command: review/);
  });

  it('lets the CLI layer inject the release Claude model profile into capability probes', async () => {
    const adapter = new ClaudeCodeAdapter({
      cliVersion: '2.1.123',
      modelProfiles: ['deepseek-v4-pro']
    });
    const probe = await adapter.probe();

    assert.deepEqual(probe.modelProfiles, ['deepseek-v4-pro']);
  });

  it('renders Kiro CLI headless arguments with trusted tool categories', async () => {
    const adapter = new KiroCliAdapter({ cliVersion: '2.2.2' });

    const prepared = await adapter.prepare({
      commandSpec: qaCommand,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'claude-kiro-default',
      requireMcpStartup: true
    });

    assert.equal(prepared.executable, 'kiro-cli');
    assert.deepEqual(prepared.args.slice(0, 3), ['chat', '--no-interactive', '--trust-tools=read,grep,bash']);
    assert.equal(prepared.args.includes('--require-mcp-startup'), true);
    assert.equal(prepared.cwd, '/work/repo');
    assert.match(prepared.prompt, /Command: qa/);
  });

  it('removes unsafe Kiro trusted tool categories when policy denies shell or network', async () => {
    const adapter = new KiroCliAdapter({ cliVersion: '2.2.2' });

    const prepared = await adapter.prepare({
      commandSpec: qaCommand,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'claude-kiro-default',
      policyDecisions: [
        {
          decision: 'deny',
          reason: 'command-not-allowed',
          matchedRule: null
        },
        {
          decision: 'deny',
          reason: 'unsupported-action',
          matchedRule: 'network'
        }
      ]
    });

    assert.deepEqual(prepared.args.slice(0, 3), ['chat', '--no-interactive', '--trust-tools=read,grep']);
  });

  it('maps policy denials to adapter-local permission restrictions without mutating CommandSpec', async () => {
    const policyDecisions = [
      {
        decision: 'deny',
        reason: 'sensitive-path',
        matchedRule: '.env'
      },
      {
        decision: 'deny',
        reason: 'denied-command-pattern',
        matchedRule: 'pnpm --filter * exec *'
      },
      {
        decision: 'deny',
        reason: 'network-denied',
        matchedRule: 'restricted'
      }
    ];
    const codexCommand = structuredClone(implementCommand);
    const claudeCommand = structuredClone(reviewCommand);
    const kiroCommand = structuredClone(qaCommand);

    const codex = await new CodexAdapter({ cliVersion: '0.130.0' }).prepare({
      commandSpec: codexCommand,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default',
      policyDecisions
    });
    const claude = await new ClaudeCodeAdapter({ cliVersion: '2.1.123' }).prepare({
      commandSpec: claudeCommand,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'deepseek-claude-code',
      policyDecisions
    });
    const kiro = await new KiroCliAdapter({ cliVersion: '2.2.2' }).prepare({
      commandSpec: kiroCommand,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'claude-kiro-default',
      policyDecisions
    });

    assert.equal(sandboxArg(codex), 'read-only');
    assert.match(codex.prompt, /Policy restrictions:/);
    assert.match(codex.prompt, /Do not read or write paths matching: \.env/);
    assert.match(codex.prompt, /Do not run shell commands/);
    assert.match(codex.prompt, /Do not access the network/);
    assert.equal(claude.args.includes('--disallowedTools'), true);
    assert.equal(claude.args.includes('Read(.env)'), true);
    assert.equal(claude.args.includes('Bash'), true);
    assert.equal(claude.args.includes('WebFetch'), true);
    assert.equal(claude.args.includes('WebSearch'), true);
    assert.deepEqual(kiro.args.slice(0, 3), ['chat', '--no-interactive', '--trust-tools=']);
    assert.deepEqual(codexCommand, implementCommand);
    assert.deepEqual(claudeCommand, reviewCommand);
    assert.deepEqual(kiroCommand, qaCommand);
  });

  it('normalizes timeout failures through the shared failure taxonomy', () => {
    const adapter = new CodexAdapter({ cliVersion: '0.130.0' });

    assert.deepEqual(adapter.normalizeFailure({ code: 'ETIMEDOUT' }), {
      category: 'cli-timeout',
      retryable: true,
      owner: 'adapter',
      recommendedNextCommand: 'qa'
    });
  });
});

function sandboxArg(prepared) {
  return prepared.args[prepared.args.indexOf('--sandbox') + 1];
}

function argumentValue(args, name) {
  return args[args.indexOf(name) + 1];
}

function valuesAfter(args, name, nextName) {
  const start = args.indexOf(name) + 1;
  const end = args.indexOf(nextName, start);

  return args.slice(start, end === -1 ? args.length : end);
}
