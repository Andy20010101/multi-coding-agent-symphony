import { validateTaskSpec } from '../contracts.js';
import {
  findWriteSetOverlaps,
  findWriteSetSubsetViolations,
  findWriteSetViolations,
  normalizeWriteSet
} from '../integrations/workspace-bridge.js';
import { ProposalRegistry } from './proposal-registry.js';
import { arbitrateProposals } from './arbitrator.js';
import { synthesizeDecision } from './synthesis.js';
import {
  assertWriterReviewerRoles,
  safeRoleArtifactSegment
} from './role-policy.js';

const WRITER_COMMAND_SPEC = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'primary-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
};

const REVIEW_COMMAND_SPEC = {
  name: 'review',
  version: '1',
  allowedTools: ['read', 'shell', 'test'],
  workspacePolicy: 'review-only',
  doneCriteria: ['review-completed', 'evidence-written'],
  evidenceSchema: 'review-evidence.v1'
};

const PARALLEL_LANE_COMMAND_SPEC = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'parallel-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
};

export class EnsembleOrchestrator {
  constructor({ artifactStore, eventLog, orchestrator }) {
    this.artifactStore = requireMethod(artifactStore, 'writeArtifact', 'artifactStore');
    requireMethod(artifactStore, 'readArtifact', 'artifactStore');
    this.eventLog = requireMethod(eventLog, 'append', 'eventLog');
    this.orchestrator = orchestrator
      ? requireMethod(orchestrator, 'runCommand', 'orchestrator')
      : null;
    this.proposalRegistry = new ProposalRegistry({ artifactStore, eventLog });
    this.eventSequence = 0;
  }

  async runProposalOnly({
    ensembleId,
    taskSpec,
    command = 'plan',
    proposalInputs
  }) {
    assertSafeId(ensembleId, 'ensembleId');
    validateTaskSpec(taskSpec);
    assertNonEmptyArray(proposalInputs, 'proposalInputs');

    const proposals = [];

    for (const proposalInput of proposalInputs) {
      proposals.push(await this.proposalRegistry.writeProposal({
        taskSpec,
        command,
        proposal: proposalInput
      }));
    }

    const decision = arbitrateProposals({
      taskId: taskSpec.id,
      proposals
    });
    const arbitrationArtifactId = `arbitration-${ensembleId}`;

    await this.artifactStore.writeArtifact(taskSpec.id, arbitrationArtifactId, decision);
    await this.#appendEvent({
      type: 'ensemble.arbitration.decided',
      payload: {
        taskId: taskSpec.id,
        ensembleId,
        artifactId: arbitrationArtifactId,
        decision: decision.decision,
        selectedProposalId: decision.selectedProposalId
      }
    });

    const synthesis = synthesizeDecision({
      taskId: taskSpec.id,
      decision,
      proposals
    });
    const synthesisArtifactId = `synthesis-${ensembleId}`;

    await this.artifactStore.writeArtifact(taskSpec.id, synthesisArtifactId, synthesis);
    await this.#appendEvent({
      type: 'ensemble.synthesis.written',
      payload: {
        taskId: taskSpec.id,
        ensembleId,
        artifactId: synthesisArtifactId,
        sourceProposalId: synthesis.sourceProposalId
      }
    });

    const run = {
      version: '1',
      id: ensembleId,
      taskId: taskSpec.id,
      mode: 'proposal-only',
      command,
      roles: unique(proposals.map((proposal) => proposal.role)),
      proposalArtifactIds: proposals.map((proposal) => proposal.id),
      arbitrationArtifactId,
      synthesisArtifactId,
      decision: decision.decision
    };
    const runArtifactId = `ensemble-run-${ensembleId}`;

    await this.artifactStore.writeArtifact(taskSpec.id, runArtifactId, run);
    await this.#appendEvent({
      type: 'ensemble.run.completed',
      payload: {
        taskId: taskSpec.id,
        ensembleId,
        artifactId: runArtifactId,
        decision: run.decision
      }
    });

    return {
      ...structuredClone(run),
      runArtifactId
    };
  }

  async runWriterReviewer({
    ensembleId,
    taskSpec,
    writer,
    reviewers,
    executionMode = 'dry-run',
    timeoutMs,
    policyRequests = []
  }) {
    assertSafeId(ensembleId, 'ensembleId');
    validateTaskSpec(taskSpec);
    assertWriterReviewerRoles({ writer, reviewers });

    if (!this.orchestrator) {
      throw new Error('orchestrator is required for writer-reviewer mode');
    }

    const writerResult = await this.orchestrator.runCommand({
      taskSpec,
      commandSpec: WRITER_COMMAND_SPEC,
      modelProfile: writer.modelProfile,
      policyRequests,
      executionMode,
      timeoutMs
    });
    const reviewerResults = [];

    if (writerResult.verification.status === 'passed') {
      const implementationRef = {
        taskId: taskSpec.id,
        artifactId: writerResult.artifactId,
        command: writerResult.command,
        verificationStatus: writerResult.verification.status
      };

      for (const reviewer of reviewers) {
        const reviewerArtifactSegment = safeRoleArtifactSegment(reviewer.agentId, 'reviewer.agentId');
        const reviewResult = await this.orchestrator.runCommand({
          taskSpec,
          commandSpec: REVIEW_COMMAND_SPEC,
          modelProfile: reviewer.modelProfile,
          policyRequests,
          executionMode,
          timeoutMs,
          artifactRefs: [implementationRef],
          sourceWorkspaceId: writerResult.workspace.workspaceId,
          artifactIdSuffix: reviewerArtifactSegment
        });

        reviewerResults.push({
          reviewer,
          result: reviewResult
        });
      }
    }

    const run = buildWriterReviewerRun({
      ensembleId,
      taskId: taskSpec.id,
      writer,
      writerResult,
      reviewerResults
    });
    const runArtifactId = `ensemble-run-${ensembleId}`;

    await this.artifactStore.writeArtifact(taskSpec.id, runArtifactId, run);
    await this.#appendEvent({
      type: 'ensemble.run.completed',
      payload: {
        taskId: taskSpec.id,
        ensembleId,
        mode: 'writer-reviewer',
        artifactId: runArtifactId,
        decision: run.decision,
        finalVerificationStatus: run.finalVerificationStatus
      }
    });

    return {
      ...structuredClone(run),
      runArtifactId
    };
  }

  async runParallelLanes({
    ensembleId,
    taskSpec,
    lanes,
    executionMode = 'dry-run',
    timeoutMs,
    policyRequests = []
  }) {
    assertSafeId(ensembleId, 'ensembleId');
    validateTaskSpec(taskSpec);
    const normalizedLanes = normalizeParallelLanes(lanes);

    assertDisjointParallelLaneWriteSets(normalizedLanes);
    assertParallelLanesWithinTaskWriteSet({ taskSpec, lanes: normalizedLanes });

    if (!this.orchestrator) {
      throw new Error('orchestrator is required for parallel-lanes mode');
    }

    const laneResults = await Promise.all(normalizedLanes.map(async (lane) => {
      const laneResult = await this.orchestrator.runCommand({
        taskSpec: taskSpecForParallelLane({ taskSpec, lane }),
        commandSpec: PARALLEL_LANE_COMMAND_SPEC,
        modelProfile: lane.modelProfile,
        policyRequests,
        executionMode,
        timeoutMs,
        artifactIdSuffix: safeRoleArtifactSegment(lane.laneId, 'lane.laneId')
      });
      const evidence = await this.artifactStore.readArtifact(taskSpec.id, laneResult.artifactId);
      const laneWriteSetViolations = findWriteSetViolations({
        changedFiles: Array.isArray(evidence?.changedFiles) ? evidence.changedFiles : [],
        writeSet: lane.writeSet
      });
      const verification = laneWriteSetViolations.length > 0
        ? {
            status: 'failed',
            reason: 'scope-violation',
            laneId: lane.laneId,
            changedFiles: laneWriteSetViolations,
            writeSet: structuredClone(lane.writeSet)
          }
        : laneResult.verification;

      return {
        lane,
        result: {
          ...laneResult,
          verification
        }
      };
    }));
    const run = buildParallelLanesRun({
      ensembleId,
      taskId: taskSpec.id,
      laneResults
    });
    const runArtifactId = `ensemble-run-${ensembleId}`;

    await this.artifactStore.writeArtifact(taskSpec.id, runArtifactId, run);
    await this.#appendEvent({
      type: 'ensemble.run.completed',
      payload: {
        taskId: taskSpec.id,
        ensembleId,
        mode: 'parallel-lanes',
        artifactId: runArtifactId,
        decision: run.decision,
        finalVerificationStatus: run.finalVerificationStatus
      }
    });

    return {
      ...structuredClone(run),
      runArtifactId
    };
  }

  async #appendEvent({ type, payload }) {
    this.eventSequence += 1;

    return this.eventLog.append({
      id: `ensemble-run-${this.eventSequence}`,
      type,
      timestamp: new Date().toISOString(),
      actor: 'ensemble',
      payload,
      version: '1'
    });
  }
}

function buildWriterReviewerRun({
  ensembleId,
  taskId,
  writer,
  writerResult,
  reviewerResults
}) {
  const writerSummary = summarizeRoleResult({
    roleInput: writer,
    result: writerResult
  });
  const reviewerSummaries = reviewerResults.map(({ reviewer, result }) => summarizeRoleResult({
    roleInput: reviewer,
    result
  }));
  const rejectionReasons = buildRejectionReasons({
    writer: writerSummary,
    reviewers: reviewerSummaries
  });
  const finalVerificationStatus = rejectionReasons.length === 0 ? 'passed' : 'failed';

  return {
    version: '1',
    id: ensembleId,
    taskId,
    mode: 'writer-reviewer',
    command: 'implement-review',
    roles: ['writer', 'reviewer', 'verifier'],
    writer: writerSummary,
    reviewers: reviewerSummaries,
    decision: finalVerificationStatus === 'passed' ? 'accepted' : 'rejected',
    finalVerificationStatus,
    rejectionReasons
  };
}

function buildParallelLanesRun({
  ensembleId,
  taskId,
  laneResults
}) {
  const laneSummaries = laneResults.map(({ lane, result }) => summarizeLaneResult({
    lane,
    result
  }));
  const rejectionReasons = buildParallelLaneRejectionReasons(laneSummaries);
  const finalVerificationStatus = rejectionReasons.length === 0 ? 'passed' : 'failed';

  return {
    version: '1',
    id: ensembleId,
    taskId,
    mode: 'parallel-lanes',
    command: 'parallel-implement',
    roles: ['parallel-writer', 'verifier'],
    lanes: laneSummaries,
    decision: finalVerificationStatus === 'passed' ? 'accepted' : 'rejected',
    finalVerificationStatus,
    rejectionReasons
  };
}

function summarizeRoleResult({ roleInput, result }) {
  return {
    agentId: roleInput.agentId,
    ...(roleInput.modelProfile ? { modelProfile: roleInput.modelProfile } : {}),
    adapterId: result.adapterId,
    evidenceArtifactId: result.artifactId,
    runArtifactId: result.runArtifactId,
    routeDecisionArtifactId: result.routeDecisionArtifactId,
    ...(result.adapterArtifactRefs ? { adapterArtifactRefs: structuredClone(result.adapterArtifactRefs) } : {}),
    workspace: structuredClone(result.workspace),
    verificationStatus: result.verification.status,
    verification: structuredClone(result.verification)
  };
}

function summarizeLaneResult({ lane, result }) {
  return {
    laneId: lane.laneId,
    writeSet: structuredClone(lane.writeSet),
    ...summarizeRoleResult({
      roleInput: lane,
      result
    })
  };
}

function buildRejectionReasons({ writer, reviewers }) {
  const reasons = [];

  if (writer.verificationStatus !== 'passed') {
    reasons.push(`writer ${writer.agentId} verification failed: ${writer.verification.reason}`);
  }

  for (const reviewer of reviewers) {
    if (reviewer.verificationStatus !== 'passed') {
      reasons.push(`reviewer ${reviewer.agentId} verification failed: ${reviewer.verification.reason}`);
    }
  }

  return reasons;
}

function buildParallelLaneRejectionReasons(lanes) {
  const reasons = [];

  for (const lane of lanes) {
    if (lane.verificationStatus !== 'passed') {
      reasons.push(`lane ${lane.laneId} (${lane.agentId}) verification failed: ${lane.verification.reason}`);
    }
  }

  return reasons;
}

function normalizeParallelLanes(lanes) {
  assertNonEmptyArray(lanes, 'lanes');
  const laneIds = new Set();

  return lanes.map((lane, index) => {
    assertPlainObject(lane, `lanes[${index}]`);
    const laneId = requireSafeId(lane.laneId, `lanes[${index}].laneId`);

    if (laneIds.has(laneId)) {
      throw new TypeError(`lanes[${index}].laneId must be unique`);
    }

    laneIds.add(laneId);

    return {
      laneId,
      agentId: assertNonEmptyString(lane.agentId, `lanes[${index}].agentId`),
      ...(lane.modelProfile !== undefined ? { modelProfile: assertNonEmptyString(lane.modelProfile, `lanes[${index}].modelProfile`) } : {}),
      writeSet: normalizeWriteSet(lane.writeSet)
    };
  });
}

function assertDisjointParallelLaneWriteSets(lanes) {
  const overlaps = findWriteSetOverlaps(lanes.map((lane) => ({
    owner: lane.laneId,
    writeSet: lane.writeSet
  })));

  if (overlaps.length > 0) {
    const overlap = overlaps[0];
    throw new Error(`parallel lane write sets overlap: ${overlap.firstOwner} and ${overlap.secondOwner} both claim ${overlap.firstPattern}`);
  }
}

function assertParallelLanesWithinTaskWriteSet({ taskSpec, lanes }) {
  const taskWriteSet = taskWriteSetFromConstraints(taskSpec.constraints);

  for (const lane of lanes) {
    const violations = findWriteSetSubsetViolations({
      claimedWriteSet: lane.writeSet,
      allowedWriteSet: taskWriteSet
    });

    if (violations.length > 0) {
      throw new Error(`parallel lane write set escapes task write set: ${lane.laneId} claims ${violations[0]}`);
    }
  }
}

function taskWriteSetFromConstraints(constraints) {
  const writeSet = Array.isArray(constraints)
    ? constraints
      .filter((constraint) => constraint.startsWith('write_set:'))
      .map((constraint) => constraint.slice('write_set:'.length))
    : [];

  return normalizeWriteSet(writeSet);
}

function taskSpecForParallelLane({ taskSpec, lane }) {
  const constraints = Array.isArray(taskSpec.constraints)
    ? taskSpec.constraints.filter((constraint) => !constraint.startsWith('write_set:'))
    : [];

  return {
    ...structuredClone(taskSpec),
    constraints: [
      ...constraints,
      ...lane.writeSet.map((pattern) => `write_set:${pattern}`)
    ]
  };
}

function unique(values) {
  return [...new Set(values)];
}

function assertSafeId(value, field) {
  assertNonEmptyString(value, field);

  if (value.includes('/') || value.includes('..')) {
    throw new TypeError(`${field} must be a safe id`);
  }
}

function assertNonEmptyArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`${field} must be a non-empty array`);
  }
}

function assertPlainObject(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
}

function requireSafeId(value, field) {
  const id = assertNonEmptyString(value, field);

  if (id.includes('/') || id.includes('..')) {
    throw new TypeError(`${field} must be a safe id`);
  }

  return id;
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }

  return value;
}

function requireMethod(value, method, field) {
  if (!value || typeof value[method] !== 'function') {
    throw new TypeError(`${field} must provide ${method}`);
  }

  return value;
}
