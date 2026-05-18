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

describe('V2 parallel-lanes ensemble workflow', () => {
  it('runs disjoint write-capable lanes with one workspace and evidence chain per lane', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-parallel-lanes-'));

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

      const result = await ensemble.runParallelLanes({
        ensembleId: 'ensemble-parallel',
        taskSpec: parallelTaskSpec,
        lanes: [
          {
            laneId: 'docs-lane',
            agentId: 'codex-docs',
            modelProfile: 'gpt-codex-default',
            writeSet: ['docs/parallel-lanes.md']
          },
          {
            laneId: 'src-lane',
            agentId: 'codex-src',
            modelProfile: 'gpt-codex-default',
            writeSet: ['src/parallel-lanes.js']
          }
        ]
      });

      const run = await artifactStore.readArtifact('task-v2', 'ensemble-run-ensemble-parallel');
      const events = await eventLog.readAll();

      assert.equal(result.decision, 'accepted');
      assert.equal(result.finalVerificationStatus, 'passed');
      assert.deepEqual(adapter.starts.map((start) => start.commandSpec.name), ['implement', 'implement']);
      assert.deepEqual(adapter.starts.map((start) => start.commandSpec.workspacePolicy), [
        'parallel-writer',
        'parallel-writer'
      ]);
      assert.deepEqual(adapter.starts
        .map((start) => start.contextPack.task.constraints)
        .sort((left, right) => left[0].localeCompare(right[0])), [
        ['write_set:docs/parallel-lanes.md'],
        ['write_set:src/parallel-lanes.js']
      ]);
      assert.equal(run.mode, 'parallel-lanes');
      assert.deepEqual(run.lanes.map((lane) => ({
        laneId: lane.laneId,
        agentId: lane.agentId,
        evidenceArtifactId: lane.evidenceArtifactId,
        runArtifactId: lane.runArtifactId,
        routeDecisionArtifactId: lane.routeDecisionArtifactId,
        writeSet: lane.writeSet,
        workspaceRole: lane.workspace.role,
        writable: lane.workspace.writable,
        verificationStatus: lane.verificationStatus
      })), [
        {
          laneId: 'docs-lane',
          agentId: 'codex-docs',
          evidenceArtifactId: 'implement-docs-lane-evidence',
          runArtifactId: 'implement-docs-lane-run',
          routeDecisionArtifactId: 'implement-docs-lane-route-decision',
          writeSet: ['docs/parallel-lanes.md'],
          workspaceRole: 'parallel-writer',
          writable: true,
          verificationStatus: 'passed'
        },
        {
          laneId: 'src-lane',
          agentId: 'codex-src',
          evidenceArtifactId: 'implement-src-lane-evidence',
          runArtifactId: 'implement-src-lane-run',
          routeDecisionArtifactId: 'implement-src-lane-route-decision',
          writeSet: ['src/parallel-lanes.js'],
          workspaceRole: 'parallel-writer',
          writable: true,
          verificationStatus: 'passed'
        }
      ]);
      assert.notEqual(run.lanes[0].workspace.workspaceId, run.lanes[1].workspace.workspaceId);
      assert.equal(events.at(-1).type, 'ensemble.run.completed');
      assert.equal(events.at(-1).payload.mode, 'parallel-lanes');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects overlapping lane write sets before adapter execution', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-parallel-lanes-overlap-'));

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
        () => ensemble.runParallelLanes({
          ensembleId: 'ensemble-overlap',
          taskSpec: parallelTaskSpec,
          lanes: [
            {
              laneId: 'one',
              agentId: 'codex-one',
              writeSet: ['src/shared.js']
            },
            {
              laneId: 'two',
              agentId: 'codex-two',
              writeSet: ['src/shared.js']
            }
          ]
        }),
        /parallel lane write sets overlap/
      );
      assert.equal(adapter.starts.length, 0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects lane write sets outside the task write set before adapter execution', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-parallel-lanes-escape-'));

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
        () => ensemble.runParallelLanes({
          ensembleId: 'ensemble-escape',
          taskSpec: parallelTaskSpec,
          lanes: [{
            laneId: 'escape',
            agentId: 'codex-escape',
            writeSet: ['src/outside-lock.js']
          }]
        }),
        /parallel lane write set escapes task write set/
      );
      assert.equal(adapter.starts.length, 0);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('V2 qa-swarm ensemble workflow', () => {
  it('runs read-only QA lanes and records verifier-readable lane artifacts', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-qa-swarm-'));

    try {
      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const eventLog = new SessionEventLog(join(root, 'events'), 'ensemble-session');
      const adapter = new WriterReviewerAdapter({
        qaEvidenceSequence: [
          {
            findings: ['Acceptance criteria are not tied to a concrete verification command.'],
            missingEvidence: [{
              requirement: 'harness smoke output',
              reason: 'No command output artifact proves the smoke command was run.'
            }]
          },
          {
            findings: [],
            noFindingRationale: 'Inspected the implementation evidence and found no blocking issues.',
            missingEvidence: []
          }
        ]
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

      const result = await ensemble.runQaSwarm({
        ensembleId: 'ensemble-qa',
        taskSpec,
        qaLanes: [
          {
            laneId: 'acceptance-audit',
            agentId: 'codex-qa-a',
            modelProfile: 'gpt-codex-default'
          },
          {
            laneId: 'regression-audit',
            agentId: 'codex-qa-b',
            modelProfile: 'gpt-codex-default'
          }
        ]
      });

      const run = await artifactStore.readArtifact('task-v2', 'ensemble-run-ensemble-qa');
      const findings = await artifactStore.readArtifact('task-v2', 'qa-swarm-findings-ensemble-qa');
      const missingEvidence = await artifactStore.readArtifact('task-v2', 'qa-swarm-missing-evidence-ensemble-qa');
      const events = await eventLog.readAll();

      assert.equal(result.decision, 'accepted');
      assert.equal(result.finalVerificationStatus, 'passed');
      assert.deepEqual(adapter.starts.map((start) => start.commandSpec.name), ['qa', 'qa']);
      assert.deepEqual(adapter.starts.map((start) => start.commandSpec.workspacePolicy), [
        'review-only',
        'review-only'
      ]);
      assert.deepEqual(adapter.starts.map((start) => start.commandSpec.allowedTools), [
        ['read', 'shell', 'test'],
        ['read', 'shell', 'test']
      ]);
      assert.equal(adapter.starts.every((start) => start.commandSpec.allowedTools.includes('write') === false), true);
      assert.equal(run.mode, 'qa-swarm');
      assert.equal(run.completionGate, 'verifier');
      assert.equal(run.vote, undefined);
      assert.deepEqual(run.qaLanes.map((lane) => ({
        laneId: lane.laneId,
        agentId: lane.agentId,
        adapterId: lane.adapterId,
        commandArtifactId: lane.runArtifactId,
        evidenceArtifactId: lane.evidenceArtifactId,
        evidenceStatus: lane.verificationStatus,
        findingsArtifactId: run.findingsArtifactId,
        missingEvidenceArtifactId: run.missingEvidenceArtifactId,
        writable: lane.workspace.writable
      })), [
        {
          laneId: 'acceptance-audit',
          agentId: 'codex-qa-a',
          adapterId: 'codex',
          commandArtifactId: 'qa-acceptance-audit-run',
          evidenceArtifactId: 'qa-acceptance-audit-evidence',
          evidenceStatus: 'passed',
          findingsArtifactId: 'qa-swarm-findings-ensemble-qa',
          missingEvidenceArtifactId: 'qa-swarm-missing-evidence-ensemble-qa',
          writable: false
        },
        {
          laneId: 'regression-audit',
          agentId: 'codex-qa-b',
          adapterId: 'codex',
          commandArtifactId: 'qa-regression-audit-run',
          evidenceArtifactId: 'qa-regression-audit-evidence',
          evidenceStatus: 'passed',
          findingsArtifactId: 'qa-swarm-findings-ensemble-qa',
          missingEvidenceArtifactId: 'qa-swarm-missing-evidence-ensemble-qa',
          writable: false
        }
      ]);
      assert.equal(findings.lanes.some((lane) => lane.findings.includes(
        'Acceptance criteria are not tied to a concrete verification command.'
      )), true);
      assert.equal(findings.lanes.some((lane) => lane.noFindingRationale ===
        'Inspected the implementation evidence and found no blocking issues.'), true);
      assert.equal(missingEvidence.lanes.some((lane) => lane.missingEvidence.some((entry) =>
        entry.requirement === 'harness smoke output' &&
        entry.reason === 'No command output artifact proves the smoke command was run.'
      )), true);
      assert.equal(events.at(-1).type, 'ensemble.run.completed');
      assert.equal(events.at(-1).payload.mode, 'qa-swarm');
      assert.equal(events.at(-1).payload.completionGate, 'verifier');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects QA lanes that report no findings without an explicit rationale', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-qa-swarm-no-rationale-'));

    try {
      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const eventLog = new SessionEventLog(join(root, 'events'), 'ensemble-session');
      const adapter = new WriterReviewerAdapter({
        qaEvidenceSequence: [
          {
            findings: [],
            missingEvidence: []
          }
        ]
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

      const result = await ensemble.runQaSwarm({
        ensembleId: 'ensemble-qa-no-rationale',
        taskSpec,
        qaLanes: [{
          laneId: 'empty-findings',
          agentId: 'codex-qa-empty'
        }]
      });

      const run = await artifactStore.readArtifact('task-v2', 'ensemble-run-ensemble-qa-no-rationale');

      assert.equal(result.decision, 'rejected');
      assert.equal(result.finalVerificationStatus, 'failed');
      assert.deepEqual(result.rejectionReasons, [
        'qa lane empty-findings (codex-qa-empty) verification failed: verification-insufficient'
      ]);
      assert.equal(run.qaLanes[0].verificationStatus, 'failed');
      assert.equal(run.qaLanes[0].verification.reason, 'verification-insufficient');
      assert.equal(run.qaLanes[0].missingEvidence.includes('findings-or-noFindingRationale'), true);
      assert.equal(run.completionGate, 'verifier');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects qa-swarm completion when any lane fails verifier checks despite a passing majority', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-qa-swarm-verifier-gate-'));

    try {
      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const eventLog = new SessionEventLog(join(root, 'events'), 'ensemble-session');
      const adapter = new WriterReviewerAdapter({
        qaEvidenceSequence: [
          {
            findings: [],
            noFindingRationale: 'No issues found in acceptance coverage.',
            missingEvidence: []
          },
          {
            findings: [],
            noFindingRationale: 'No issues found in regression coverage.',
            missingEvidence: []
          },
          {
            findings: [],
            missingEvidence: []
          }
        ]
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

      const result = await ensemble.runQaSwarm({
        ensembleId: 'ensemble-qa-verifier-gate',
        taskSpec,
        qaLanes: [
          { laneId: 'pass-a', agentId: 'codex-qa-pass-a' },
          { laneId: 'pass-b', agentId: 'codex-qa-pass-b' },
          { laneId: 'fail-c', agentId: 'codex-qa-fail' }
        ]
      });

      const run = await artifactStore.readArtifact('task-v2', 'ensemble-run-ensemble-qa-verifier-gate');

      assert.equal(result.decision, 'rejected');
      assert.equal(run.finalVerificationStatus, 'failed');
      assert.equal(run.completionGate, 'verifier');
      assert.equal(run.vote, undefined);
      assert.equal(run.qaLanes.filter((lane) => lane.verificationStatus === 'passed').length, 2);
      assert.equal(run.qaLanes.filter((lane) => lane.verificationStatus === 'failed').length, 1);
      assert.match(run.rejectionReasons[0], /qa lane .* verification failed: verification-insufficient/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('V2 competitive-patch ensemble workflow', () => {
  it('runs isolated candidates, preserves rejected artifacts, and selects exactly one verifier-passing patch', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-competitive-patch-'));

    try {
      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const eventLog = new SessionEventLog(join(root, 'events'), 'ensemble-session');
      const adapter = new WriterReviewerAdapter({
        implementEvidenceByAgent: {
          'codex-candidate-a': {
            checks: [{
              name: 'pnpm test',
              status: 'failed',
              command: 'pnpm test',
              exitCode: 1,
              artifactId: 'candidate-a-test-log',
              output: 'candidate a failed'
            }]
          },
          'codex-candidate-b': {
            checks: [{
              name: 'pnpm test',
              status: 'passed',
              command: 'pnpm test',
              exitCode: 0,
              artifactId: 'candidate-b-test-log',
              output: 'candidate b passed'
            }]
          },
          'codex-candidate-c': {
            changedFiles: [],
            noOpRationale: undefined
          }
        }
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

      const result = await ensemble.runCompetitivePatch({
        ensembleId: 'ensemble-competitive',
        taskSpec: competitivePatchTaskSpec,
        candidates: [
          { candidateId: 'candidate-a', agentId: 'codex-candidate-a', modelProfile: 'gpt-codex-default' },
          { candidateId: 'candidate-b', agentId: 'codex-candidate-b', modelProfile: 'gpt-codex-default' },
          { candidateId: 'candidate-c', agentId: 'codex-candidate-c', modelProfile: 'gpt-codex-default' }
        ]
      });

      const run = await artifactStore.readArtifact('task-v2', 'ensemble-run-ensemble-competitive');
      const events = await eventLog.readAll();

      assert.equal(result.decision, 'accepted');
      assert.equal(result.completionGate, 'verifier');
      assert.equal(result.finalVerificationStatus, 'passed');
      assert.equal(result.selectedCandidateId, 'candidate-b');
      assert.equal(result.candidates.filter((candidate) => candidate.selected).length, 1);
      assert.equal(result.candidates.filter((candidate) => candidate.verifierStatus === 'passed').length, 1);
      assert.deepEqual(adapter.starts.map((start) => start.commandSpec.name), ['implement', 'implement', 'implement']);
      assert.equal(new Set(adapter.starts.map((start) => start.workspace)).size, 3);
      assert.deepEqual(result.candidates.map((candidate) => ({
        candidateId: candidate.candidateId,
        agentId: candidate.agentId,
        adapterId: candidate.adapterId,
        patchArtifactId: candidate.patchArtifactId,
        commandArtifactId: candidate.commandArtifactId,
        routeDecisionArtifactId: candidate.routeDecisionArtifactId,
        verifierStatus: candidate.verifierStatus,
        selected: candidate.selected,
        rejectedReason: candidate.rejectedReason
      })), [
        {
          candidateId: 'candidate-a',
          agentId: 'codex-candidate-a',
          adapterId: 'codex',
          patchArtifactId: 'competitive-patch-candidate-a-patch',
          commandArtifactId: 'implement-candidate-a-run',
          routeDecisionArtifactId: 'implement-candidate-a-route-decision',
          verifierStatus: 'failed',
          selected: false,
          rejectedReason: 'verifier failed: check-failed'
        },
        {
          candidateId: 'candidate-b',
          agentId: 'codex-candidate-b',
          adapterId: 'codex',
          patchArtifactId: 'competitive-patch-candidate-b-patch',
          commandArtifactId: 'implement-candidate-b-run',
          routeDecisionArtifactId: 'implement-candidate-b-route-decision',
          verifierStatus: 'passed',
          selected: true,
          rejectedReason: undefined
        },
        {
          candidateId: 'candidate-c',
          agentId: 'codex-candidate-c',
          adapterId: 'codex',
          patchArtifactId: 'competitive-patch-candidate-c-patch',
          commandArtifactId: 'implement-candidate-c-run',
          routeDecisionArtifactId: 'implement-candidate-c-route-decision',
          verifierStatus: 'failed',
          selected: false,
          rejectedReason: 'verifier failed: verification-insufficient'
        }
      ]);
      assert.deepEqual(run.candidates, result.candidates);
      assert.equal(events.at(-1).type, 'ensemble.run.completed');
      assert.equal(events.at(-1).payload.mode, 'competitive-patch');
      assert.equal(events.at(-1).payload.completionGate, 'verifier');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('fails when no competitive patch candidate passes verifier checks', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-competitive-patch-none-'));

    try {
      const artifactStore = new ArtifactStore(join(root, 'artifacts'));
      const eventLog = new SessionEventLog(join(root, 'events'), 'ensemble-session');
      const adapter = new WriterReviewerAdapter({
        implementEvidenceByAgent: {
          'codex-candidate-a': { checks: [] },
          'codex-candidate-b': { checks: [] }
        }
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

      const result = await ensemble.runCompetitivePatch({
        ensembleId: 'ensemble-competitive-none',
        taskSpec: competitivePatchTaskSpec,
        candidates: [
          { candidateId: 'candidate-a', agentId: 'codex-candidate-a' },
          { candidateId: 'candidate-b', agentId: 'codex-candidate-b' }
        ]
      });

      const run = await artifactStore.readArtifact('task-v2', 'ensemble-run-ensemble-competitive-none');

      assert.equal(result.decision, 'rejected');
      assert.equal(result.completionGate, 'verifier');
      assert.equal(result.finalVerificationStatus, 'failed');
      assert.equal(result.selectedCandidateId, undefined);
      assert.equal(result.candidates.length, 2);
      assert.equal(result.candidates.every((candidate) => candidate.selected === false), true);
      assert.deepEqual(result.rejectionReasons, [
        'no competitive patch candidate passed verifier checks'
      ]);
      assert.deepEqual(run.candidates.map((candidate) => candidate.patchArtifactId), [
        'competitive-patch-candidate-a-patch',
        'competitive-patch-candidate-b-patch'
      ]);
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

const parallelTaskSpec = {
  ...taskSpec,
  constraints: [
    'write_set:docs/parallel-lanes.md',
    'write_set:src/parallel-lanes.js'
  ]
};

const competitivePatchTaskSpec = {
  ...taskSpec,
  constraints: [
    'write_set:synthetic-dry-run.txt'
  ]
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
  constructor({
    weakReview = false,
    qaEvidenceByAgent = {},
    qaEvidenceSequence = [],
    implementEvidenceByAgent = {}
  } = {}) {
    this.adapterId = 'codex';
    this.cliName = 'codex';
    this.cliVersion = 'synthetic';
    this.modelProfiles = ['gpt-codex-default'];
    this.weakReview = weakReview;
    this.qaEvidenceByAgent = qaEvidenceByAgent;
    this.qaEvidenceSequence = qaEvidenceSequence;
    this.qaEvidenceIndex = 0;
    this.implementEvidenceByAgent = implementEvidenceByAgent;
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
      agentId: input.contextPack.agentId,
      taskId: input.contextPack.task.id,
      workspaceId: input.workspace,
      changedFiles: changedFilesForSyntheticImplement(input.contextPack.task.constraints)
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

    if (handle.command === 'qa') {
      return this.#qaEvidence(handle);
    }

    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: ['Synthetic writer change.'],
      changedFiles: handle.changedFiles,
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
      version: '1',
      ...structuredClone(this.implementEvidenceByAgent[handle.agentId] ?? {})
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

  #qaEvidence(handle) {
    const laneEvidence = this.qaEvidenceByAgent[handle.agentId] ??
      this.qaEvidenceSequence[this.qaEvidenceIndex] ??
      {};
    this.qaEvidenceIndex += 1;

    return {
      command: handle.command,
      taskId: handle.taskId,
      workspaceId: handle.workspaceId,
      diffSummary: [],
      changedFiles: [],
      checks: [{
        name: 'qa-verification',
        status: 'passed',
        command: 'pnpm test',
        exitCode: 0,
        artifactId: `${handle.agentId}-qa-verification-log`,
        output: 'qa verification passed'
      }],
      knownRisks: [],
      agentSummary: 'QA evidence from synthetic adapter.',
      findings: structuredClone(laneEvidence.findings ?? []),
      missingEvidence: structuredClone(laneEvidence.missingEvidence ?? []),
      ...(laneEvidence.noFindingRationale ? { noFindingRationale: laneEvidence.noFindingRationale } : {}),
      version: '1'
    };
  }
}

function changedFilesForSyntheticImplement(constraints = []) {
  const writeSet = constraints
    .filter((constraint) => constraint.startsWith('write_set:'))
    .map((constraint) => constraint.slice('write_set:'.length));

  return [writeSet.find((pattern) => !pattern.includes('*')) ?? 'src/ensemble/ensemble-orchestrator.js'];
}
