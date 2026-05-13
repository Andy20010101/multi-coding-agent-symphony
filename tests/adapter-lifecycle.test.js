import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { CodexAdapter } from '../src/adapters/codex-adapter.js';
import { ClaudeCodeAdapter } from '../src/adapters/claude-code-adapter.js';
import { KiroCliAdapter } from '../src/adapters/kiro-cli-adapter.js';

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
    id: 'task-123',
    source: 'github',
    repository: 'Andy20010101/multi-coding-agent-symphony',
    objective: 'Conform adapter lifecycle',
    acceptance: ['all lifecycle methods exist'],
    version: '1'
  },
  events: [],
  artifactRefs: []
};

const adapters = [
  new CodexAdapter({ cliVersion: '0.130.0' }),
  new ClaudeCodeAdapter({ cliVersion: '2.1.123' }),
  new KiroCliAdapter({ cliVersion: '2.2.2' })
];

describe('Runtime adapter lifecycle conformance', () => {
  it('exposes the required lifecycle methods on every adapter', () => {
    const methods = [
      'probe',
      'prepare',
      'start',
      'streamEvents',
      'cancel',
      'resume',
      'collectEvidence',
      'normalizeFailure',
      'cleanup'
    ];

    for (const adapter of adapters) {
      for (const method of methods) {
        assert.equal(typeof adapter[method], 'function', `${adapter.adapterId}.${method}`);
      }
    }
  });

  it('starts dry-run handles and streams lifecycle events', async () => {
    const adapter = new CodexAdapter({ cliVersion: '0.130.0' });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default'
    });

    const events = [];

    for await (const event of adapter.streamEvents(handle)) {
      events.push(event);
    }

    assert.equal(handle.adapterId, 'codex');
    assert.equal(handle.status, 'completed');
    assert.equal(handle.dryRun, true);
    assert.deepEqual(events.map((event) => event.type), ['adapter.started', 'command.finished']);
  });

  it('collects dry-run evidence marked as insufficient for completion', async () => {
    const adapter = new CodexAdapter({ cliVersion: '0.130.0' });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default'
    });

    assert.deepEqual(await adapter.collectEvidence(handle), {
      command: 'implement',
      taskId: 'task-123',
      workspaceId: '/work/repo',
      changedFiles: [],
      checks: [],
      knownRisks: ['dry-run-only'],
      agentSummary: 'Dry-run command rendered but no CLI execution occurred.',
      version: '1'
    });
  });

  it('cancels and resumes dry-run handles by run id', async () => {
    const adapter = new CodexAdapter({ cliVersion: '0.130.0' });
    const handle = await adapter.start({
      commandSpec,
      contextPack,
      workspace: '/work/repo',
      modelProfile: 'gpt-codex-default'
    });

    assert.deepEqual(await adapter.cancel(handle), {
      runId: handle.runId,
      status: 'cancelled'
    });
    assert.equal((await adapter.resume({ runId: handle.runId })).runId, handle.runId);
  });
});

