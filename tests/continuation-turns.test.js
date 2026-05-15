import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ArtifactStore } from '../src/artifact-store.js';
import { SessionEventLog } from '../src/session-event-log.js';
import { WorkspaceManager } from '../src/workspace-manager.js';
import { RouterScheduler } from '../src/router-scheduler.js';
import { Orchestrator } from '../src/orchestrator.js';

const taskSpec = {
  id: 'task-continuation',
  source: 'manual',
  repository: 'owner/repo',
  objective: 'Implement continuation turns',
  acceptance: ['continuation behavior is verifier readable'],
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

const capabilityReport = {
  adapterId: 'fake',
  cliName: 'fake-cli',
  cliVersion: '1.0.0',
  supportedCommands: ['implement', 'review', 'qa', 'plan', 'fix-ci'],
  modelProfiles: ['fake-model'],
  supportsNonInteractive: true,
  supportsResume: true,
  supportsCancel: true,
  supportsHooks: true,
  supportsMcp: false,
  supportsStructuredOutput: true,
  workspaceIsolation: 'external-workspace',
  logStrategy: 'synthetic',
  version: '1'
};

describe('Continuation turns and stall detection', () => {
  it('retries a verifier failure as a continuation turn in the same workspace', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-continuation-pass-'));

    try {
      const adapter = new SequencedAdapter([
        failingEvidence(),
        passingEvidence()
      ]);
      const orchestrator = buildOrchestrator({ root, adapter });

      const result = await orchestrator.runCommand({
        taskSpec: {
          ...taskSpec,
          execution: {
            maxTurns: 3
          }
        },
        commandSpec
      });

      assert.equal(result.verification.status, 'passed');
      assert.equal(result.attempts, 2);
      assert.equal(adapter.starts.length, 2);
      assert.equal(adapter.starts[1].workspace, adapter.starts[0].workspace);
      assert.equal(adapter.starts[1].isContinuation, true);
      assert.equal(adapter.starts[1].contextPack.continuation.previousFailureReason, 'checks-missing');
      assert.match(adapter.starts[1].contextPack.task.objective, /Previous attempt failed: checks-missing/);
      assert.doesNotMatch(adapter.starts[1].contextPack.task.objective, /Implement continuation turns/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('does not continue after a terminal adapter failure', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-continuation-terminal-'));

    try {
      const adapter = new SequencedAdapter([
        failingEvidence()
      ], {
        failures: [{
          category: 'permission-denied',
          retryable: false,
          owner: 'policy',
          recommendedNextCommand: 'plan'
        }]
      });
      const orchestrator = buildOrchestrator({ root, adapter });

      const result = await orchestrator.runCommand({
        taskSpec: {
          ...taskSpec,
          execution: {
            maxTurns: 5
          }
        },
        commandSpec
      });

      assert.equal(result.verification.status, 'failed');
      assert.equal(result.verification.reason, 'permission-denied');
      assert.equal(result.attempts, 1);
      assert.equal(adapter.starts.length, 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('reports the final verifier failure when maxTurns is exhausted', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-continuation-exhausted-'));

    try {
      const adapter = new SequencedAdapter([
        failingEvidence(),
        failingEvidence()
      ]);
      const orchestrator = buildOrchestrator({ root, adapter });

      const result = await orchestrator.runCommand({
        taskSpec: {
          ...taskSpec,
          execution: {
            maxTurns: 2
          }
        },
        commandSpec
      });

      assert.equal(result.verification.status, 'failed');
      assert.equal(result.verification.reason, 'checks-missing');
      assert.equal(result.attempts, 2);
      assert.equal(adapter.starts.length, 2);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps single-turn behavior when maxTurns is 1', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-continuation-single-'));

    try {
      const adapter = new SequencedAdapter([
        failingEvidence(),
        passingEvidence()
      ]);
      const orchestrator = buildOrchestrator({ root, adapter });

      const result = await orchestrator.runCommand({
        taskSpec: {
          ...taskSpec,
          execution: {
            maxTurns: 1
          }
        },
        commandSpec
      });

      assert.equal(result.verification.status, 'failed');
      assert.equal(result.attempts, 1);
      assert.equal(adapter.starts.length, 1);
      assert.equal(adapter.starts[0].isContinuation, false);
      assert.equal(adapter.starts[0].contextPack.continuation, undefined);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('passes command-level turnTimeoutMs to each adapter turn', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-continuation-timeout-'));

    try {
      const adapter = new SequencedAdapter([
        passingEvidence()
      ]);
      const orchestrator = buildOrchestrator({ root, adapter });

      await orchestrator.runCommand({
        taskSpec: {
          ...taskSpec,
          execution: {
            maxTurns: 1,
            turnTimeoutMs: 111
          }
        },
        commandSpec: {
          ...commandSpec,
          execution: {
            maxTurns: 1,
            turnTimeoutMs: 222
          }
        }
      });

      assert.equal(adapter.starts[0].timeoutMs, 222);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('kills a stalled turn, records stall-timeout, and retries when turns remain', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-continuation-stall-'));

    try {
      const adapter = new SequencedAdapter([
        failingEvidence(),
        passingEvidence()
      ], {
        streams: ['stall', 'normal']
      });
      const orchestrator = buildOrchestrator({ root, adapter });

      const result = await orchestrator.runCommand({
        taskSpec: {
          ...taskSpec,
          execution: {
            maxTurns: 2,
            stallTimeoutMs: 30
          }
        },
        commandSpec
      });

      assert.equal(adapter.cancelCalls, 1);
      assert.equal(result.verification.status, 'passed');
      assert.equal(result.attempts, 2);
      assert.equal(result.turns[0].verification.reason, 'stall-timeout');
      assert.equal(result.turns[0].stalled, true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('treats adapter events as activity that resets the stall timer', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-continuation-activity-'));

    try {
      const adapter = new SequencedAdapter([
        passingEvidence()
      ], {
        streams: ['activity']
      });
      const orchestrator = buildOrchestrator({ root, adapter });

      const result = await orchestrator.runCommand({
        taskSpec: {
          ...taskSpec,
          execution: {
            maxTurns: 1,
            stallTimeoutMs: 60
          }
        },
        commandSpec
      });

      assert.equal(adapter.cancelCalls, 0);
      assert.equal(result.verification.status, 'passed');
      assert.equal(result.attempts, 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('disables stall detection when stallTimeoutMs is 0', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-continuation-stall-disabled-'));

    try {
      const adapter = new SequencedAdapter([
        passingEvidence()
      ], {
        streams: ['quiet-then-finish']
      });
      const orchestrator = buildOrchestrator({ root, adapter });

      const result = await orchestrator.runCommand({
        taskSpec: {
          ...taskSpec,
          execution: {
            maxTurns: 1,
            stallTimeoutMs: 0
          }
        },
        commandSpec
      });

      assert.equal(adapter.cancelCalls, 0);
      assert.equal(result.verification.status, 'passed');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('stops continuation when checkTaskActive reports the task inactive', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-continuation-cancelled-'));

    try {
      const adapter = new SequencedAdapter([
        failingEvidence(),
        passingEvidence()
      ]);
      const orchestrator = buildOrchestrator({ root, adapter });

      const result = await orchestrator.runCommand({
        taskSpec: {
          ...taskSpec,
          execution: {
            maxTurns: 5
          }
        },
        commandSpec,
        checkTaskActive: () => false
      });

      assert.equal(result.verification.status, 'failed');
      assert.equal(result.verification.reason, 'task-cancelled');
      assert.equal(result.attempts, 1);
      assert.equal(adapter.starts.length, 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function buildOrchestrator({ root, adapter }) {
  return new Orchestrator({
    artifactStore: new ArtifactStore(join(root, 'artifacts')),
    eventLog: new SessionEventLog(join(root, 'events'), 'session-continuation'),
    workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
    scheduler: new RouterScheduler({ capabilityReports: [capabilityReport] }),
    adapters: {
      fake: adapter
    }
  });
}

class SequencedAdapter {
  constructor(evidenceByTurn, { failures = [], streams = [] } = {}) {
    this.evidenceByTurn = evidenceByTurn;
    this.failures = failures;
    this.streams = streams;
    this.starts = [];
    this.handles = new Map();
    this.cancelCalls = 0;
  }

  async start(input) {
    const { onActivity, ...capturedInput } = input;
    this.starts.push(structuredClone(capturedInput));
    const turnIndex = this.starts.length - 1;
    const failure = this.failures[turnIndex];
    const handle = {
      runId: `fake-${turnIndex + 1}`,
      adapterId: 'fake',
      status: failure ? 'failed' : 'completed',
      command: input.commandSpec.name,
      taskId: input.contextPack.task.id,
      workspaceId: input.workspace,
      failure
    };

    this.handles.set(handle.runId, handle);
    return structuredClone(handle);
  }

  async *streamEvents(handle) {
    const streamMode = this.streams[Number(handle.runId.split('-').at(-1)) - 1] ?? 'normal';

    yield {
      type: 'adapter.started',
      runId: handle.runId,
      adapterId: 'fake'
    };

    if (streamMode === 'stall') {
      await delay(120);
      return;
    }

    if (streamMode === 'activity') {
      await delay(25);
      yield {
        type: 'tool.observed',
        runId: handle.runId,
        adapterId: 'fake',
        payload: {
          message: 'progress'
        }
      };
      await delay(25);
    }

    if (streamMode === 'quiet-then-finish') {
      await delay(80);
    }

    yield {
      type: 'command.finished',
      runId: handle.runId,
      adapterId: 'fake',
      status: handle.status
    };
  }

  async cancel(handle) {
    this.cancelCalls += 1;
    const stored = this.handles.get(handle.runId);

    if (stored) {
      stored.status = 'cancelled';
    }

    return {
      runId: handle.runId,
      status: 'cancelled',
      signal: 'SIGTERM'
    };
  }

  async collectEvidence(handle) {
    const turnIndex = Number(handle.runId.split('-').at(-1)) - 1;
    const evidence = this.evidenceByTurn[turnIndex] ?? failingEvidence();

    return {
      ...structuredClone(evidence),
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId
    };
  }
}

function passingEvidence() {
  return {
    command: 'implement',
    taskId: 'task-continuation',
    workspaceId: 'workspace',
    diffSummary: ['implemented continuation'],
    changedFiles: ['src/orchestrator.js'],
    checks: [{
      name: 'focused-continuation-check',
      status: 'passed',
      command: 'node --test tests/continuation-turns.test.js',
      exitCode: 0,
      output: 'passed'
    }],
    knownRisks: [],
    agentSummary: 'Continuation behavior implemented.',
    version: '1'
  };
}

function failingEvidence() {
  return {
    command: 'implement',
    taskId: 'task-continuation',
    workspaceId: 'workspace',
    diffSummary: [],
    changedFiles: ['src/orchestrator.js'],
    checks: [],
    knownRisks: ['missing-checks'],
    agentSummary: 'Implementation is incomplete.',
    version: '1'
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
