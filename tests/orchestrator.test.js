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
import { TaskQueue } from '../src/task-queue.js';

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

const reviewCommandSpec = {
  name: 'review',
  version: '1',
  allowedTools: ['read', 'shell', 'test'],
  workspacePolicy: 'review-only',
  doneCriteria: ['review-completed', 'evidence-written'],
  evidenceSchema: 'review-evidence.v1'
};

class PassingCodexAdapter extends CodexAdapter {
  async collectEvidence(handle) {
    const changedFiles = handle.command === 'implement' ? ['src/orchestrator.js'] : [];

    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: [],
      changedFiles,
      checks: [{
        name: 'synthetic-check',
        status: 'passed',
        command: 'synthetic-check',
        exitCode: 0,
        artifactId: 'synthetic-check-log',
        output: 'synthetic check passed'
      }],
      knownRisks: [],
      agentSummary: 'Synthetic dry-run evidence.',
      ...(handle.command === 'review' ? { noFindingRationale: 'No findings in synthetic review.' } : {}),
      version: '1'
    };
  }
}

class CapturingCodexAdapter extends PassingCodexAdapter {
  constructor(options) {
    super(options);
    this.starts = [];
  }

  async start(input) {
    this.starts.push(structuredClone(input));
    return super.start(input);
  }
}

class FailingCodexAdapter extends CapturingCodexAdapter {
  async collectEvidence(handle) {
    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: [],
      changedFiles: ['src/orchestrator.js'],
      checks: [],
      knownRisks: ['missing-checks'],
      agentSummary: 'Synthetic failing evidence.',
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
      const routeDecision = await artifactStore.readArtifact('task-123', 'implement-route-decision');
      const events = await eventLog.readAll();

      assert.equal(result.adapterId, 'codex');
      assert.equal(result.routeDecisionArtifactId, 'implement-route-decision');
      assert.equal(result.verification.status, 'passed');
      assert.equal(routeDecision.command, 'implement');
      assert.equal(routeDecision.adapterId, 'codex');
      assert.equal(routeDecision.reason, 'first-capable-adapter');
      assert.deepEqual(storedEvidence.checks, [
        {
          name: 'synthetic-check',
          status: 'passed',
          command: 'synthetic-check',
          exitCode: 0,
          artifactId: 'synthetic-check-log',
          output: 'synthetic check passed'
        }
      ]);
      assert.deepEqual(events.map((event) => event.type), [
        'command.queued',
        'artifact.written',
        'route.selected',
        'adapter.started',
        'command.finished',
        'artifact.written',
        'verifier.result',
        'artifact.written',
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
              checks: [{ name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'tests passed' }],
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

  it('stores Codex raw log artifacts and links them from the run record', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-codex-logs-'));

    try {
      const finalMessage = {
        command: 'implement',
        taskId: 'task-codex-logs',
        workspaceId: 'model-supplied-workspace',
        diffSummary: [],
        changedFiles: ['src/adapters/codex-adapter.js'],
        checks: [{ name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'tests passed' }],
        knownRisks: [],
        agentSummary: 'Structured evidence from Codex logs.',
        version: '1'
      };
      const runner = new FakeProcessRunner({
        exitCode: 0,
        stdout: '{"type":"agent_message","message":"started"}\n',
        stderr: 'codex warning',
        durationMs: 10,
        outputFiles: {
          lastMessage: {
            path: '/tmp/codex-last-message.json',
            content: JSON.stringify(finalMessage)
          }
        }
      });
      const adapter = new CodexAdapter({
        cliVersion: '0.130.0',
        processRunner: runner
      });
      const report = await adapter.probe();
      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const orchestrator = new Orchestrator({
        artifactStore,
        eventLog: new SessionEventLog(join(root, 'events'), 'session-123'),
        workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        adapters: {
          codex: adapter
        }
      });

      await orchestrator.runCommand({
        taskSpec: {
          ...taskSpec,
          id: 'task-codex-logs'
        },
        commandSpec,
        executionMode: 'real',
        timeoutMs: 1000
      });

      assert.deepEqual(await artifactStore.readArtifact('task-codex-logs', 'implement-codex-stdout-jsonl'), {
        version: '1',
        kind: 'codex-stdout-jsonl',
        content: '{"type":"agent_message","message":"started"}\n'
      });
      assert.deepEqual(await artifactStore.readArtifact('task-codex-logs', 'implement-codex-stderr'), {
        version: '1',
        kind: 'codex-stderr',
        content: 'codex warning'
      });
      assert.deepEqual(await artifactStore.readArtifact('task-codex-logs', 'implement-codex-parsed-events'), {
        version: '1',
        kind: 'codex-parsed-events',
        content: [{ type: 'agent_message', message: 'started' }]
      });
      assert.deepEqual(await artifactStore.readArtifact('task-codex-logs', 'implement-codex-final-message'), {
        version: '1',
        kind: 'codex-final-message',
        content: JSON.stringify(finalMessage),
        path: '/tmp/codex-last-message.json'
      });
      assert.deepEqual((await artifactStore.readArtifact('task-codex-logs', 'implement-run')).adapterArtifactRefs, [
        { taskId: 'task-codex-logs', artifactId: 'implement-codex-stdout-jsonl', kind: 'codex-stdout-jsonl' },
        { taskId: 'task-codex-logs', artifactId: 'implement-codex-stderr', kind: 'codex-stderr' },
        { taskId: 'task-codex-logs', artifactId: 'implement-codex-parsed-events', kind: 'codex-parsed-events' },
        { taskId: 'task-codex-logs', artifactId: 'implement-codex-final-message', kind: 'codex-final-message' }
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs implement then review with implementation evidence in review context', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-workflow-'));

    try {
      const adapter = new CapturingCodexAdapter({ cliVersion: '0.130.0' });
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

      const result = await orchestrator.runTaskWorkflow({
        taskSpec,
        commandSpecs: [commandSpec, reviewCommandSpec]
      });

      assert.equal(result.status, 'passed');
      assert.deepEqual(result.commands.map((command) => command.command), ['implement', 'review']);
      assert.deepEqual(adapter.starts[1].contextPack.artifactRefs, [{
        taskId: 'task-123',
        artifactId: 'implement-evidence',
        command: 'implement',
        verificationStatus: 'passed'
      }]);
      assert.equal(result.commands[1].workspace.writable, false);
      assert.equal(result.commands[1].workspace.sourceWorkspaceId, result.commands[0].workspace.workspaceId);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('stops workflow after verifier failure and records command.failed', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-workflow-failure-'));

    try {
      const adapter = new FailingCodexAdapter({ cliVersion: '0.130.0' });
      const report = await adapter.probe();
      const eventLog = new SessionEventLog(join(root, 'events'), 'session-123');
      const orchestrator = new Orchestrator({
        artifactStore: new ArtifactStore(join(root, 'artifacts')),
        eventLog,
        workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        adapters: {
          codex: adapter
        }
      });

      const result = await orchestrator.runTaskWorkflow({
        taskSpec,
        commandSpecs: [commandSpec, reviewCommandSpec]
      });
      const events = await eventLog.readAll();

      assert.equal(result.status, 'failed');
      assert.equal(result.failedCommand, 'implement');
      assert.deepEqual(result.commands.map((command) => command.command), ['implement']);
      assert.equal(adapter.starts.length, 1);
      const failedEvent = events.find((event) => event.type === 'command.failed');
      assert.equal(failedEvent.payload.verificationStatus, 'failed');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('plans retry from verifier failure taxonomy metadata', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-workflow-retry-'));

    try {
      const adapter = new FailingCodexAdapter({ cliVersion: '0.130.0' });
      const report = await adapter.probe();
      const eventLog = new SessionEventLog(join(root, 'events'), 'session-123');
      const orchestrator = new Orchestrator({
        artifactStore: new ArtifactStore(join(root, 'artifacts')),
        eventLog,
        workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        adapters: {
          codex: adapter
        }
      });

      const result = await orchestrator.runTaskWorkflow({
        taskSpec,
        commandSpecs: [commandSpec, reviewCommandSpec]
      });
      const events = await eventLog.readAll();

      assert.deepEqual(result.failure, {
        category: 'checks-missing',
        retryable: true,
        owner: 'verifier',
        recommendedNextCommand: 'qa'
      });
      assert.deepEqual(result.retryPlan, {
        retry: true,
        nextCommand: 'qa',
        owner: 'verifier'
      });
      assert.equal(events.at(-1).type, 'failure.classified');
      assert.deepEqual(events.at(-1).payload, {
        taskId: 'task-123',
        command: 'implement',
        failure: result.failure,
        retryPlan: result.retryPlan
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('stores command run records with evidence and context references', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-run-records-'));

    try {
      const adapter = new CapturingCodexAdapter({ cliVersion: '0.130.0' });
      const report = await adapter.probe();
      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const orchestrator = new Orchestrator({
        artifactStore,
        eventLog: new SessionEventLog(join(root, 'events'), 'session-123'),
        workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        adapters: {
          codex: adapter
        }
      });

      await orchestrator.runTaskWorkflow({
        taskSpec,
        commandSpecs: [commandSpec, reviewCommandSpec]
      });

      assert.deepEqual(await artifactStore.readArtifact('task-123', 'implement-run'), {
        version: '1',
        taskId: 'task-123',
        command: 'implement',
        adapterId: 'codex',
        workspaceId: 'task-123-primary-writer-1',
        evidenceArtifactId: 'implement-evidence',
        routeDecisionArtifactId: 'implement-route-decision',
        verificationStatus: 'passed',
        artifactRefs: []
      });
      assert.deepEqual(await artifactStore.readArtifact('task-123', 'review-run'), {
        version: '1',
        taskId: 'task-123',
        command: 'review',
        adapterId: 'codex',
        workspaceId: 'task-123-review-2',
        evidenceArtifactId: 'review-evidence',
        routeDecisionArtifactId: 'review-route-decision',
        verificationStatus: 'passed',
        artifactRefs: [{
          taskId: 'task-123',
          artifactId: 'implement-evidence',
          command: 'implement',
          verificationStatus: 'passed'
        }]
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('hydrates referenced artifacts into later command context', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-hydrated-context-'));

    try {
      const adapter = new CapturingCodexAdapter({ cliVersion: '0.130.0' });
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

      await orchestrator.runTaskWorkflow({
        taskSpec,
        commandSpecs: [commandSpec, reviewCommandSpec]
      });

      const hydrated = adapter.starts[1].contextPack.hydratedArtifacts;
      assert.equal(hydrated.length, 1);
      assert.deepEqual(hydrated[0].ref, {
        taskId: 'task-123',
        artifactId: 'implement-evidence',
        command: 'implement',
        verificationStatus: 'passed'
      });
      assert.equal(hydrated[0].content.command, 'implement');
      assert.deepEqual(hydrated[0].content.changedFiles, ['src/orchestrator.js']);
      assert.deepEqual(hydrated[0].content.checks, [
        {
          name: 'synthetic-check',
          status: 'passed',
          command: 'synthetic-check',
          exitCode: 0,
          artifactId: 'synthetic-check-log',
          output: 'synthetic check passed'
        }
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs the next persisted queued task through the configured workflow', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-queue-'));

    try {
      const stateFile = join(root, 'queue.json');
      const queue = new TaskQueue({ maxConcurrency: 1, stateFile });
      queue.enqueue(taskSpec, {
        now: '2026-05-13T00:00:00.000Z'
      });

      const reloadedQueue = new TaskQueue({ maxConcurrency: 1, stateFile });
      const adapter = new CapturingCodexAdapter({ cliVersion: '0.130.0' });
      const report = await adapter.probe();
      const orchestrator = new Orchestrator({
        artifactStore: new ArtifactStore(join(root, 'artifacts')),
        eventLog: new SessionEventLog(join(root, 'events'), 'session-123'),
        workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        taskQueue: reloadedQueue,
        adapters: {
          codex: adapter
        }
      });

      const result = await orchestrator.runNextTask({
        commandSpecs: [commandSpec, reviewCommandSpec],
        leaseTimeoutMs: 1000,
        now: '2026-05-13T00:00:01.000Z'
      });

      assert.equal(result.taskId, 'task-123');
      assert.equal(result.status, 'passed');
      assert.deepEqual(result.commands.map((command) => command.command), ['implement', 'review']);
      assert.equal(reloadedQueue.get('task-123').status, 'completed');
      assert.equal(new TaskQueue({ maxConcurrency: 1, stateFile }).get('task-123').status, 'completed');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs the standard default command sequence when requested by name', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-default-sequence-'));

    try {
      const adapter = new CapturingCodexAdapter({ cliVersion: '0.130.0' });
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

      const result = await orchestrator.runTaskWorkflow({
        taskSpec,
        commandSequence: 'standard'
      });

      assert.equal(result.status, 'passed');
      assert.deepEqual(result.commands.map((command) => command.command), ['implement', 'review', 'qa']);
      assert.deepEqual(adapter.starts.map((start) => start.commandSpec.name), ['implement', 'review', 'qa']);
      assert.equal(result.commands[1].workspace.writable, false);
      assert.equal(result.commands[2].workspace.writable, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('runs an implementation-only command sequence when requested by name', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-implement-only-sequence-'));

    try {
      const adapter = new CapturingCodexAdapter({ cliVersion: '0.130.0' });
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

      const result = await orchestrator.runTaskWorkflow({
        taskSpec,
        commandSequence: 'implement-only'
      });

      assert.equal(result.status, 'passed');
      assert.deepEqual(result.commands.map((command) => command.command), ['implement']);
      assert.deepEqual(adapter.starts.map((start) => start.commandSpec.name), ['implement']);
      assert.equal(result.commands[0].workspace.writable, true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('persists retry metadata when a queued workflow fails verification', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-orchestrator-queue-failure-'));

    try {
      const stateFile = join(root, 'queue.json');
      const queue = new TaskQueue({ maxConcurrency: 1, stateFile });
      queue.enqueue(taskSpec, {
        now: '2026-05-13T00:00:00.000Z'
      });

      const adapter = new FailingCodexAdapter({ cliVersion: '0.130.0' });
      const report = await adapter.probe();
      const reloadedQueue = new TaskQueue({ maxConcurrency: 1, stateFile });
      const orchestrator = new Orchestrator({
        artifactStore: new ArtifactStore(join(root, 'artifacts')),
        eventLog: new SessionEventLog(join(root, 'events'), 'session-123'),
        workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
        scheduler: new RouterScheduler({ capabilityReports: [report] }),
        taskQueue: reloadedQueue,
        adapters: {
          codex: adapter
        }
      });

      const result = await orchestrator.runNextTask({
        commandSpecs: [commandSpec, reviewCommandSpec],
        now: '2026-05-13T00:00:01.000Z'
      });
      const record = new TaskQueue({ maxConcurrency: 1, stateFile }).get('task-123');

      assert.equal(result.status, 'failed');
      assert.equal(record.status, 'queued');
      assert.equal(record.failedAt, '2026-05-13T00:00:01.000Z');
      assert.equal(record.failedEventId, 'task-queue-1-failed-1');
      assert.deepEqual(record.failure, result.failure);
      assert.deepEqual(record.retryPlan, result.retryPlan);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
