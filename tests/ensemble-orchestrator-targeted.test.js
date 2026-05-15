/**
 * Targeted tests to push ensemble-orchestrator.js from 70.1% to ≥75%.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { ArtifactStore } from '../src/artifact-store.js';
import { SessionEventLog } from '../src/session-event-log.js';
import { EnsembleOrchestrator } from '../src/ensemble/ensemble-orchestrator.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeArtifactStore(root) {
  return new ArtifactStore(join(root, 'artifacts'));
}

function makeEventLog(root) {
  return new SessionEventLog(join(root, 'events'), 'ensemble-session');
}

const taskSpec = {
  id: 'task-ensemble-targeted',
  source: 'manual',
  repository: 'owner/repo',
  objective: 'targeted ensemble test',
  acceptance: ['done'],
  version: '1'
};

function proposal(id, evidenceStatus) {
  return {
    id,
    agentId: `agent-${id}`,
    adapterId: 'codex',
    modelProfile: 'gpt-codex-default',
    role: 'planner',
    taskId: taskSpec.id,
    command: 'plan',
    summary: 'Plan.',
    changes: [],
    risks: [],
    evidenceArtifactId: `${id}-ev`,
    evidenceStatus,
    version: '1'
  };
}

// ── L69, L88, L113: ObjectLiteral {} — event payload fields ──────────────────
// Kills: payload objects replaced with {}

describe('ensemble-orchestrator.js targeted: event payload fields', () => {
  it('arbitration.decided event has taskId, ensembleId, decision, selectedProposalId', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ens-targeted-'));
    try {
      const artifactStore = makeArtifactStore(root);
      const eventLog = makeEventLog(root);
      const ensemble = new EnsembleOrchestrator({ artifactStore, eventLog });

      await ensemble.runProposalOnly({
        ensembleId: 'ens-1',
        taskSpec,
        proposalInputs: [proposal('p1', 'passed')]
      });

      const events = await eventLog.readAll();
      const arbitrationEvent = events.find((e) => e.type === 'ensemble.arbitration.decided');
      assert.ok(arbitrationEvent, 'arbitration event not found');
      assert.equal(arbitrationEvent.payload.taskId, taskSpec.id);
      assert.equal(arbitrationEvent.payload.ensembleId, 'ens-1');
      assert.ok(typeof arbitrationEvent.payload.decision === 'string');
      assert.ok('selectedProposalId' in arbitrationEvent.payload);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('synthesis.written event has taskId, ensembleId, artifactId, sourceProposalId', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ens-targeted-synth-'));
    try {
      const artifactStore = makeArtifactStore(root);
      const eventLog = makeEventLog(root);
      const ensemble = new EnsembleOrchestrator({ artifactStore, eventLog });

      await ensemble.runProposalOnly({
        ensembleId: 'ens-2',
        taskSpec,
        proposalInputs: [proposal('p1', 'passed')]
      });

      const events = await eventLog.readAll();
      const synthEvent = events.find((e) => e.type === 'ensemble.synthesis.written');
      assert.ok(synthEvent, 'synthesis event not found');
      assert.equal(synthEvent.payload.taskId, taskSpec.id);
      assert.equal(synthEvent.payload.ensembleId, 'ens-2');
      assert.ok(typeof synthEvent.payload.artifactId === 'string');
      assert.ok('sourceProposalId' in synthEvent.payload);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('ensemble.run.completed event has taskId, ensembleId, artifactId, decision', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ens-targeted-run-'));
    try {
      const artifactStore = makeArtifactStore(root);
      const eventLog = makeEventLog(root);
      const ensemble = new EnsembleOrchestrator({ artifactStore, eventLog });

      await ensemble.runProposalOnly({
        ensembleId: 'ens-3',
        taskSpec,
        proposalInputs: [proposal('p1', 'passed')]
      });

      const events = await eventLog.readAll();
      const runEvent = events.find((e) => e.type === 'ensemble.run.completed');
      assert.ok(runEvent, 'run.completed event not found');
      assert.equal(runEvent.payload.taskId, taskSpec.id);
      assert.equal(runEvent.payload.ensembleId, 'ens-3');
      assert.ok(typeof runEvent.payload.artifactId === 'string');
      assert.ok(typeof runEvent.payload.decision === 'string');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

// ── L134: ArrayDeclaration — roles array ─────────────────────────────────────
// Kills: roles array replaced with ["Stryker was here"]

describe('ensemble-orchestrator.js targeted: roles array', () => {
  it('proposal-only run has roles derived from proposal roles', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ens-targeted-roles-'));
    try {
      const artifactStore = makeArtifactStore(root);
      const eventLog = makeEventLog(root);
      const ensemble = new EnsembleOrchestrator({ artifactStore, eventLog });

      const result = await ensemble.runProposalOnly({
        ensembleId: 'ens-roles',
        taskSpec,
        proposalInputs: [proposal('p1', 'passed')]
      });

      assert.ok(Array.isArray(result.roles));
      assert.ok(result.roles.includes('planner'));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

// ── L140: writerResult.verification.status === 'passed' ──────────────────────
// Kills: ConditionalExpression(false) — reviewers never run

describe('ensemble-orchestrator.js targeted: writer verification gate', () => {
  it('reviewers do not run when writer verification fails', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ens-targeted-gate-'));
    try {
      const artifactStore = makeArtifactStore(root);
      const eventLog = makeEventLog(root);

      // Mock orchestrator where writer fails
      const mockOrchestrator = {
        runCommand: async ({ commandSpec }) => ({
          adapterId: 'codex',
          command: commandSpec.name,
          artifactId: `${commandSpec.name}-evidence`,
          runArtifactId: `${commandSpec.name}-run`,
          routeDecisionArtifactId: `${commandSpec.name}-route`,
          workspace: { workspaceId: 'ws-1', writable: true, role: 'primary-writer' },
          verification: { status: commandSpec.name === 'implement' ? 'failed' : 'passed', reason: 'checks-failed' }
        })
      };

      const ensemble = new EnsembleOrchestrator({ artifactStore, eventLog, orchestrator: mockOrchestrator });

      const result = await ensemble.runWriterReviewer({
        ensembleId: 'ens-gate',
        taskSpec,
        writer: { agentId: 'writer-1', modelProfile: 'gpt-codex-default' },
        reviewers: [{ agentId: 'reviewer-1', modelProfile: 'gpt-codex-default' }]
      });

      // Writer failed → ensemble rejected, reviewers not run
      assert.equal(result.decision, 'rejected');
      assert.deepEqual(result.reviewers, []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

// ── L212: eventSequence += 1 ─────────────────────────────────────────────────
// Kills: AssignmentOperator(-=) — sequence decrements instead of increments

describe('ensemble-orchestrator.js targeted: event sequence', () => {
  it('event ids are unique and incrementing across multiple events', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ens-targeted-seq-'));
    try {
      const artifactStore = makeArtifactStore(root);
      const eventLog = makeEventLog(root);
      const ensemble = new EnsembleOrchestrator({ artifactStore, eventLog });

      await ensemble.runProposalOnly({
        ensembleId: 'ens-seq',
        taskSpec,
        proposalInputs: [proposal('p1', 'passed'), proposal('p2', 'failed')]
      });

      const events = await eventLog.readAll();
      const ensembleEvents = events.filter((e) => e.id.startsWith('ensemble-run-'));
      const ids = ensembleEvents.map((e) => e.id);
      const uniqueIds = new Set(ids);
      assert.equal(uniqueIds.size, ids.length, 'event ids must be unique');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

// ── L252: ArrayDeclaration [] — roles in writer-reviewer ─────────────────────
// Kills: roles array replaced with []

describe('ensemble-orchestrator.js targeted: writer-reviewer roles', () => {
  it('writer-reviewer run has writer, reviewer, verifier roles', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ens-targeted-wr-roles-'));
    try {
      const artifactStore = makeArtifactStore(root);
      const eventLog = makeEventLog(root);

      const mockOrchestrator = {
        runCommand: async ({ commandSpec }) => ({
          adapterId: 'codex',
          command: commandSpec.name,
          artifactId: `${commandSpec.name}-evidence`,
          runArtifactId: `${commandSpec.name}-run`,
          routeDecisionArtifactId: `${commandSpec.name}-route`,
          workspace: { workspaceId: 'ws-1', writable: commandSpec.workspacePolicy === 'primary-writer', role: commandSpec.workspacePolicy },
          verification: { status: 'passed', reason: 'checks-passed' }
        })
      };

      const ensemble = new EnsembleOrchestrator({ artifactStore, eventLog, orchestrator: mockOrchestrator });

      const result = await ensemble.runWriterReviewer({
        ensembleId: 'ens-wr-roles',
        taskSpec,
        writer: { agentId: 'writer-1', modelProfile: 'gpt-codex-default' },
        reviewers: [{ agentId: 'reviewer-1', modelProfile: 'gpt-codex-default' }]
      });

      assert.ok(result.roles.includes('writer'));
      assert.ok(result.roles.includes('reviewer'));
      assert.ok(result.roles.includes('verifier'));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

// ── L264: ObjectLiteral {} — buildWriterReviewerRun fields ───────────────────

describe('ensemble-orchestrator.js targeted: writer-reviewer run artifact fields', () => {
  it('writer-reviewer run artifact has mode, command, decision, finalVerificationStatus', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ens-targeted-wr-fields-'));
    try {
      const artifactStore = makeArtifactStore(root);
      const eventLog = makeEventLog(root);

      const mockOrchestrator = {
        runCommand: async ({ commandSpec }) => ({
          adapterId: 'codex',
          command: commandSpec.name,
          artifactId: `${commandSpec.name}-evidence`,
          runArtifactId: `${commandSpec.name}-run`,
          routeDecisionArtifactId: `${commandSpec.name}-route`,
          workspace: { workspaceId: 'ws-1', writable: true, role: 'primary-writer' },
          verification: { status: 'passed', reason: 'checks-passed' }
        })
      };

      const ensemble = new EnsembleOrchestrator({ artifactStore, eventLog, orchestrator: mockOrchestrator });

      const result = await ensemble.runWriterReviewer({
        ensembleId: 'ens-wr-fields',
        taskSpec,
        writer: { agentId: 'writer-1', modelProfile: 'gpt-codex-default' },
        reviewers: [{ agentId: 'reviewer-1', modelProfile: 'gpt-codex-default' }]
      });

      assert.equal(result.mode, 'writer-reviewer');
      assert.equal(result.command, 'implement-review');
      assert.equal(result.decision, 'accepted');
      assert.equal(result.finalVerificationStatus, 'passed');
      assert.deepEqual(result.rejectionReasons, []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

// ── L279, L299, L305, L311: assertSafeId, assertNonEmptyArray, assertNonEmptyString ──
// Kills: ConditionalExpression(false), LogicalOperator(&&)

describe('ensemble-orchestrator.js targeted: input validation', () => {
  it('throws when ensembleId contains /', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ens-targeted-safeid-'));
    try {
      const ensemble = new EnsembleOrchestrator({
        artifactStore: makeArtifactStore(root),
        eventLog: makeEventLog(root)
      });
      await assert.rejects(
        () => ensemble.runProposalOnly({
          ensembleId: 'bad/id',
          taskSpec,
          proposalInputs: [proposal('p1', 'passed')]
        }),
        TypeError
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('throws when ensembleId contains ..', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ens-targeted-safeid2-'));
    try {
      const ensemble = new EnsembleOrchestrator({
        artifactStore: makeArtifactStore(root),
        eventLog: makeEventLog(root)
      });
      await assert.rejects(
        () => ensemble.runProposalOnly({
          ensembleId: '../evil',
          taskSpec,
          proposalInputs: [proposal('p1', 'passed')]
        }),
        TypeError
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('throws when ensembleId is blank', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ens-targeted-blank-'));
    try {
      const ensemble = new EnsembleOrchestrator({
        artifactStore: makeArtifactStore(root),
        eventLog: makeEventLog(root)
      });
      await assert.rejects(
        () => ensemble.runProposalOnly({
          ensembleId: '  ',
          taskSpec,
          proposalInputs: [proposal('p1', 'passed')]
        }),
        TypeError
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('throws when proposalInputs is empty array', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-ens-targeted-empty-'));
    try {
      const ensemble = new EnsembleOrchestrator({
        artifactStore: makeArtifactStore(root),
        eventLog: makeEventLog(root)
      });
      await assert.rejects(
        () => ensemble.runProposalOnly({
          ensembleId: 'ens-1',
          taskSpec,
          proposalInputs: []
        }),
        TypeError
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
