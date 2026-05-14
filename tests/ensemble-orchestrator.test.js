import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ArtifactStore } from '../src/artifact-store.js';
import { SessionEventLog } from '../src/session-event-log.js';
import { RouterScheduler } from '../src/router-scheduler.js';
import { WorkspaceManager } from '../src/workspace-manager.js';
import { Orchestrator } from '../src/orchestrator.js';
import {
  EnsembleOrchestrator
} from '../src/ensemble/ensemble-orchestrator.js';
import {
  RolePolicyViolationError
} from '../src/ensemble/role-policy.js';

describe('V2 proposal-only ensemble workflow', () => {
  it('stores proposals, arbitrates, synthesizes, and writes an EnsembleRun', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ensemble-'));

    try {
      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const eventLog = new SessionEventLog(join(root, 'events'), 'ensemble-session');
      const ensemble = new EnsembleOrchestrator({
        artifactStore,
        eventLog
      });

      const result = await ensemble.runProposalOnly({
        ensembleId: 'ensemble-v2',
        taskSpec,
        command: 'plan',
        proposalInputs: [
          proposalInput({
            agentId: 'codex-planner',
            adapterId: 'codex',
            evidenceStatus: 'passed',
            changes: ['Add proposal registry.', 'Add arbitration tests.']
          }),
          proposalInput({
            agentId: 'kiro-planner',
            adapterId: 'kiro-cli',
            evidenceStatus: 'failed',
            changes: ['Implement without tests.']
          })
        ]
      });

      const codexProposal = await artifactStore.readArtifact('task-v2', 'proposal-codex-planner');
      const decision = await artifactStore.readArtifact('task-v2', 'arbitration-ensemble-v2');
      const synthesis = await artifactStore.readArtifact('task-v2', 'synthesis-ensemble-v2');
      const run = await artifactStore.readArtifact('task-v2', 'ensemble-run-ensemble-v2');
      const events = await eventLog.readAll();

      assert.equal(result.decision, 'accepted');
      assert.equal(codexProposal.kind, 'agent-proposal');
      assert.equal(codexProposal.agentId, 'codex-planner');
      assert.equal(codexProposal.evidenceStatus, 'passed');
      assert.equal(decision.selectedProposalId, 'proposal-codex-planner');
      assert.equal(synthesis.sourceProposalId, 'proposal-codex-planner');
      assert.deepEqual(run, {
        version: '1',
        id: 'ensemble-v2',
        taskId: 'task-v2',
        mode: 'proposal-only',
        command: 'plan',
        roles: ['planner'],
        proposalArtifactIds: ['proposal-codex-planner', 'proposal-kiro-planner'],
        arbitrationArtifactId: 'arbitration-ensemble-v2',
        synthesisArtifactId: 'synthesis-ensemble-v2',
        decision: 'accepted'
      });
      assert.deepEqual(events.map((event) => event.type), [
        'ensemble.proposal.written',
        'ensemble.proposal.written',
        'ensemble.arbitration.decided',
        'ensemble.synthesis.written',
        'ensemble.run.completed'
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('V2 writer-reviewer ensemble workflow', () => {
  it('runs one writer command and one independent reviewer command before accepting', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-writer-reviewer-'));

    try {
      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const eventLog = new SessionEventLog(join(root, 'events'), 'ensemble-session');
      const adapter = new WriterReviewerAdapter();
      const orchestrator = await buildOrchestrator({
        root,
        artifactStore,
        eventLog,
        adapter
      });
      const ensemble = new EnsembleOrchestrator({
        artifactStore,
        eventLog,
        orchestrator
      });

      const result = await ensemble.runWriterReviewer({
        ensembleId: 'ensemble-wr',
        taskSpec,
        writer: {
          agentId: 'codex-writer',
          modelProfile: 'gpt-codex-default'
        },
        reviewers: [{
          agentId: 'codex-reviewer',
          modelProfile: 'gpt-codex-default'
        }]
      });

      const run = await artifactStore.readArtifact('task-v2', 'ensemble-run-ensemble-wr');
      const events = await eventLog.readAll();

      assert.equal(result.decision, 'accepted');
      assert.equal(result.finalVerificationStatus, 'passed');
      assert.deepEqual(adapter.starts.map((start) => start.commandSpec.name), ['implement', 'review']);
      assert.equal(adapter.starts[0].commandSpec.workspacePolicy, 'primary-writer');
      assert.equal(adapter.starts[1].commandSpec.workspacePolicy, 'review-only');
      assert.deepEqual(adapter.starts[1].contextPack.artifactRefs, [{
        taskId: 'task-v2',
        artifactId: 'implement-evidence',
        command: 'implement',
        verificationStatus: 'passed'
      }]);
      assert.equal(run.mode, 'writer-reviewer');
      assert.equal(run.writer.agentId, 'codex-writer');
      assert.equal(run.writer.evidenceArtifactId, 'implement-evidence');
      assert.equal(run.reviewers[0].agentId, 'codex-reviewer');
      assert.equal(run.reviewers[0].evidenceArtifactId, 'review-codex-reviewer-evidence');
      assert.equal(run.reviewers[0].workspace.writable, false);
      assert.equal(run.reviewers[0].workspace.sourceWorkspaceId, run.writer.workspace.workspaceId);
      assert.equal(run.decision, 'accepted');
      assert.equal(events.at(-1).type, 'ensemble.run.completed');
      assert.equal(events.at(-1).payload.mode, 'writer-reviewer');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects a writer listed as its own reviewer before adapter execution', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-writer-reviewer-policy-'));

    try {
      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const eventLog = new SessionEventLog(join(root, 'events'), 'ensemble-session');
      const adapter = new WriterReviewerAdapter();
      const orchestrator = await buildOrchestrator({
        root,
        artifactStore,
        eventLog,
        adapter
      });
      const ensemble = new EnsembleOrchestrator({
        artifactStore,
        eventLog,
        orchestrator
      });

      await assert.rejects(
        () => ensemble.runWriterReviewer({
          ensembleId: 'ensemble-self-review',
          taskSpec,
          writer: {
            agentId: 'codex-agent'
          },
          reviewers: [{
            agentId: 'codex-agent'
          }]
        }),
        RolePolicyViolationError
      );
      assert.equal(adapter.starts.length, 0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects weak reviewer self-report evidence', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-writer-reviewer-weak-'));

    try {
      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const eventLog = new SessionEventLog(join(root, 'events'), 'ensemble-session');
      const adapter = new WriterReviewerAdapter({
        weakReview: true
      });
      const orchestrator = await buildOrchestrator({
        root,
        artifactStore,
        eventLog,
        adapter
      });
      const ensemble = new EnsembleOrchestrator({
        artifactStore,
        eventLog,
        orchestrator
      });

      const result = await ensemble.runWriterReviewer({
        ensembleId: 'ensemble-weak-review',
        taskSpec,
        writer: {
          agentId: 'codex-writer'
        },
        reviewers: [{
          agentId: 'codex-reviewer'
        }]
      });

      const run = await artifactStore.readArtifact('task-v2', 'ensemble-run-ensemble-weak-review');

      assert.equal(result.decision, 'rejected');
      assert.equal(result.finalVerificationStatus, 'failed');
      assert.deepEqual(result.rejectionReasons, [
        'reviewer codex-reviewer verification failed: artifact-missing'
      ]);
      assert.equal(run.reviewers[0].verificationStatus, 'failed');
      assert.equal(run.reviewers[0].verification.reason, 'artifact-missing');
      assert.equal(run.decision, 'rejected');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

const taskSpec = {
  id: 'task-v2',
  source: 'manual',
  repository: 'Andy20010101/multi-coding-agent-symphony',
  objective: 'Add V2 proposal arbitration synthesis',
  acceptance: ['proposal artifacts are stored', 'synthesis links source proposals'],
  version: '1'
};

function proposalInput({
  agentId,
  adapterId,
  evidenceStatus,
  changes
}) {
  return {
    agentId,
    adapterId,
    modelProfile: `${adapterId}-default`,
    role: 'planner',
    summary: `${agentId} plan`,
    changes,
    risks: [],
    evidenceArtifactId: `${agentId}-plan-evidence`,
    evidenceStatus
  };
}

async function buildOrchestrator({
  root,
  artifactStore,
  eventLog,
  adapter
}) {
  const report = await adapter.probe();

  return new Orchestrator({
    artifactStore,
    eventLog,
    workspaceManager: new WorkspaceManager({ rootDirectory: join(root, 'workspaces') }),
    scheduler: new RouterScheduler({ capabilityReports: [report] }),
    adapters: {
      [adapter.adapterId]: adapter
    }
  });
}

class WriterReviewerAdapter {
  constructor({ weakReview = false } = {}) {
    this.adapterId = 'codex';
    this.cliName = 'codex';
    this.cliVersion = 'synthetic';
    this.modelProfiles = ['gpt-codex-default'];
    this.weakReview = weakReview;
    this.starts = [];
    this.runs = new Map();
  }

  async probe() {
    return {
      adapterId: this.adapterId,
      cliName: this.cliName,
      cliVersion: this.cliVersion,
      supportedCommands: ['plan', 'implement', 'review', 'fix-ci', 'qa'],
      modelProfiles: [...this.modelProfiles],
      supportsNonInteractive: true,
      supportsResume: true,
      supportsCancel: true,
      supportsHooks: true,
      supportsMcp: true,
      supportsStructuredOutput: true,
      workspaceIsolation: 'external-workspace',
      logStrategy: 'jsonl-stdout',
      version: '1'
    };
  }

  async start(input) {
    this.starts.push(structuredClone(input));
    const runId = `${this.adapterId}-${input.commandSpec.name}-${this.runs.size + 1}`;
    const handle = {
      runId,
      adapterId: this.adapterId,
      status: 'completed',
      dryRun: true,
      command: input.commandSpec.name,
      taskId: input.contextPack.task.id,
      workspaceId: input.workspace
    };

    this.runs.set(runId, handle);
    return structuredClone(handle);
  }

  async *streamEvents(handle) {
    yield {
      type: 'adapter.started',
      runId: handle.runId,
      adapterId: this.adapterId,
      dryRun: true
    };
    yield {
      type: 'command.finished',
      runId: handle.runId,
      adapterId: this.adapterId,
      status: 'completed'
    };
  }

  async collectEvidence(handle) {
    if (handle.command === 'review') {
      return this.#reviewEvidence(handle);
    }

    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: ['Synthetic writer change.'],
      changedFiles: ['src/ensemble/ensemble-orchestrator.js'],
      checks: [{
        name: 'pnpm test',
        status: 'passed',
        command: 'pnpm test',
        exitCode: 0,
        artifactId: 'writer-test-log',
        output: 'tests passed'
      }],
      knownRisks: [],
      agentSummary: 'Writer evidence from synthetic adapter.',
      version: '1'
    };
  }

  #reviewEvidence(handle) {
    if (this.weakReview) {
      return {
        command: handle.command,
        taskId: handle.taskId,
        workspaceId: handle.workspaceId,
        diffSummary: [],
        changedFiles: [],
        checks: [{
          name: 'manual-review',
          status: 'passed',
          output: 'looks fine'
        }],
        knownRisks: [],
        agentSummary: 'Reviewer self-report without check provenance.',
        noFindingRationale: 'No issues reported by reviewer narrative.',
        version: '1'
      };
    }

    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: [],
      changedFiles: [],
      checks: [{
        name: 'pnpm test',
        status: 'passed',
        command: 'pnpm test',
        exitCode: 0,
        artifactId: 'review-test-log',
        output: 'tests passed'
      }],
      knownRisks: [],
      agentSummary: 'Reviewer evidence from synthetic adapter.',
      noFindingRationale: 'Synthetic reviewer found no issues.',
      version: '1'
    };
  }
}
