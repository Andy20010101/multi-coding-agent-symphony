import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ArtifactStore } from '../src/artifact-store.js';
import { SessionEventLog } from '../src/session-event-log.js';
import { WorkspaceConflictError, WorkspaceManager } from '../src/workspace-manager.js';
import { RouterScheduler } from '../src/router-scheduler.js';
import { Orchestrator, PolicyDeniedError } from '../src/orchestrator.js';
import { PolicyEngine } from '../src/policy-engine.js';
import { CodexAdapter } from '../src/adapters/codex-adapter.js';

const taskSpec = {
  id: 'task-123',
  source: 'github',
  repository: 'Andy20010101/multi-coding-agent-symphony',
  objective: 'Run a dry-run orchestration flow',
  acceptance: ['evidence is written', 'verification is recorded'],
  version: '1'
};

const commandSpec = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'primary-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
};

class PassingCodexAdapter extends CodexAdapter {
  async collectEvidence(handle) {
    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: [],
      changedFiles: ['src/orchestrator.js'],
      checks: [{ name: 'synthetic-check', status: 'passed', output: 'synthetic check passed' }],
      knownRisks: [],
      agentSummary: 'Synthetic dry-run evidence.',
      version: '1'
    };
  }
}

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

describe('Orchestrator dry-run execution flow', () => {
  it('routes, starts, stores evidence, and verifies a command', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-'));

    try {
      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const eventLog = new SessionEventLog(join(root, 'events'), 'session-123');
      const adapter = new PassingCodexAdapter({ cliVersion: '0.130.0' });
      const report = await adapter.probe();
      const orchestrator = new Orchestrator({
        artifactStore,
        eventLog,
        workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        adapters: {
          codex: adapter
        }
      });

      const result = await orchestrator.runCommand({
        taskSpec,
        commandSpec
      });

      const storedEvidence = await artifactStore.readArtifact('task-123', 'implement-evidence');
      const events = await eventLog.readAll();

      assert.equal(result.adapterId, 'codex');
      assert.equal(result.verification.status, 'passed');
      assert.deepEqual(storedEvidence.checks, [
        { name: 'synthetic-check', status: 'passed', output: 'synthetic check passed' }
      ]);
      assert.deepEqual(events.map((event) => event.type), [
        'command.queued',
        'route.selected',
        'adapter.started',
        'command.finished',
        'artifact.written',
        'verifier.result',
        'command.finished'
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('preserves single-writer ownership through orchestration', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-conflict-'));

    try {
      const adapter = new PassingCodexAdapter({ cliVersion: '0.130.0' });
      const report = await adapter.probe();
      const workspaceManager = new WorkspaceManager({ rootDirectory: join(root, 'workspaces') });
      const orchestrator = new Orchestrator({
        artifactStore: new ArtifactStore(join(root, 'artifacts')),
        eventLog: new SessionEventLog(join(root, 'events'), 'session-123'),
        workspaceManager,
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        adapters: {
          codex: adapter
        }
      });

      await orchestrator.runCommand({ taskSpec, commandSpec });

      await assert.rejects(
        () => orchestrator.runCommand({ taskSpec, commandSpec }),
        WorkspaceConflictError
      );
      assert.equal(workspaceManager.listByTask('task-123').length, 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('blocks denied policy requests before adapter start', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-policy-'));

    try {
      const adapter = new PassingCodexAdapter({ cliVersion: '0.130.0' });
      const report = await adapter.probe();
      const eventLog = new SessionEventLog(join(root, 'events'), 'session-123');
      const orchestrator = new Orchestrator({
        artifactStore: new ArtifactStore(join(root, 'artifacts')),
        eventLog,
        workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        policyEngine: new PolicyEngine({
          deniedPaths: ['.env'],
          allowedCommands: ['pnpm test']
        }),
        adapters: {
          codex: adapter
        }
      });

      await assert.rejects(
        () => orchestrator.runCommand({
          taskSpec,
          commandSpec,
          policyRequests: [
            {
              action: 'read',
              target: '.env'
            }
          ]
        }),
        PolicyDeniedError
      );

      assert.deepEqual((await eventLog.readAll()).map((event) => event.type), [
        'command.queued',
        'policy.decision'
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('passes real execution mode through to Codex adapter', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-real-codex-'));

    try {
      const runner = new FakeProcessRunner({
        exitCode: 0,
        stdout: '{"type":"agent_message","message":"done"}\n',
        stderr: '',
        durationMs: 10,
        outputFiles: {
          lastMessage: {
            path: '/tmp/codex-last-message.json',
            content: JSON.stringify({
              command: 'implement',
              taskId: 'task-real-codex',
              workspaceId: 'model-supplied-workspace',
              diffSummary: [],
              changedFiles: ['src/adapters/codex-adapter.js'],
              checks: [{ name: 'pnpm test', status: 'passed', output: 'tests passed' }],
              knownRisks: [],
              agentSummary: 'Structured evidence from real Codex execution.',
              version: '1'
            })
          }
        }
      });
      const adapter = new CodexAdapter({
        cliVersion: '0.130.0',
        processRunner: runner
      });
      const report = await adapter.probe();
      const orchestrator = new Orchestrator({
        artifactStore: new ArtifactStore(join(root, 'artifacts')),
        eventLog: new SessionEventLog(join(root, 'events'), 'session-123'),
        workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        adapters: {
          codex: adapter
        }
      });

      const result = await orchestrator.runCommand({
        taskSpec: {
          ...taskSpec,
          id: 'task-real-codex'
        },
        commandSpec,
        executionMode: 'real',
        timeoutMs: 1000
      });

      assert.equal(runner.calls.length, 1);
      assert.equal(runner.calls[0].timeoutMs, 1000);
      assert.equal(result.verification.status, 'passed');
      assert.equal(result.verification.reason, 'checks-passed');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
