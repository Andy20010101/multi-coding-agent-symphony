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

const COMPETITIVE_PATCH_COMMAND_SPEC = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'parallel-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1',
  execution: {
    maxTurns: 1
  }
};

const QA_SWARM_COMMAND_SPEC = {
  name: 'qa',
  version: '1',
  allowedTools: ['read', 'shell', 'test'],
  workspacePolicy: 'review-only',
  doneCriteria: ['checks-run', 'findings-recorded', 'evidence-written'],
  evidenceSchema: 'qa-evidence.v1'
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

  async runCompetitivePatch({
    ensembleId,
    taskSpec,
    candidates,
    executionMode = 'dry-run',
    timeoutMs,
    policyRequests = []
  }) {
    assertSafeId(ensembleId, 'ensembleId');
    validateTaskSpec(taskSpec);
    const normalizedCandidates = normalizeCompetitiveCandidates(candidates);

    if (!this.orchestrator) {
      throw new Error('orchestrator is required for competitive-patch mode');
    }

    const candidateResults = await Promise.all(normalizedCandidates.map(async (candidate) => {
      const candidateResult = await this.orchestrator.runCommand({
        taskSpec,
        commandSpec: COMPETITIVE_PATCH_COMMAND_SPEC,
        modelProfile: candidate.modelProfile,
        policyRequests,
        executionMode,
        timeoutMs,
        agentId: candidate.agentId,
        artifactIdSuffix: safeRoleArtifactSegment(candidate.candidateId, 'candidates[].candidateId')
      });
      const evidence = await this.artifactStore.readArtifact(taskSpec.id, candidateResult.artifactId);

      return {
        candidate,
        result: candidateResult,
        evidence
      };
    }));
    const run = buildCompetitivePatchRun({
      ensembleId,
      taskId: taskSpec.id,
      candidateResults
    });
    const runArtifactId = `ensemble-run-${ensembleId}`;

    for (const candidate of run.candidates) {
      const source = candidateResults.find((entry) => entry.candidate.candidateId === candidate.candidateId);

      await this.artifactStore.writeArtifact(taskSpec.id, candidate.patchArtifactId, buildCompetitivePatchArtifact({
        taskId: taskSpec.id,
        ensembleId,
        candidate,
        evidence: source?.evidence
      }));
    }

    await this.artifactStore.writeArtifact(taskSpec.id, runArtifactId, run);
    await this.#appendEvent({
      type: 'ensemble.run.completed',
      payload: {
        taskId: taskSpec.id,
        ensembleId,
        mode: 'competitive-patch',
        artifactId: runArtifactId,
        decision: run.decision,
        selectedCandidateId: run.selectedCandidateId,
        finalVerificationStatus: run.finalVerificationStatus,
        completionGate: run.completionGate
      }
    });

    return {
      ...structuredClone(run),
      runArtifactId
    };
  }

  async runQaSwarm({
    ensembleId,
    taskSpec,
    qaLanes,
    executionMode = 'dry-run',
    timeoutMs,
    policyRequests = [],
    artifactRefs = []
  }) {
    assertSafeId(ensembleId, 'ensembleId');
    validateTaskSpec(taskSpec);
    const normalizedLanes = normalizeQaLanes(qaLanes);

    if (!Array.isArray(artifactRefs)) {
      throw new TypeError('artifactRefs must be an array');
    }

    if (!this.orchestrator) {
      throw new Error('orchestrator is required for qa-swarm mode');
    }

    const laneResults = await Promise.all(normalizedLanes.map(async (lane) => {
      const laneResult = await this.orchestrator.runCommand({
        taskSpec,
        commandSpec: QA_SWARM_COMMAND_SPEC,
        modelProfile: lane.modelProfile,
        policyRequests,
        executionMode,
        timeoutMs,
        artifactRefs,
        agentId: lane.agentId,
        artifactIdSuffix: safeRoleArtifactSegment(lane.laneId, 'qaLanes[].laneId')
      });
      const evidence = await this.artifactStore.readArtifact(taskSpec.id, laneResult.artifactId);

      return {
        lane,
        result: laneResult,
        evidence
      };
    }));
    const findingsArtifactId = `qa-swarm-findings-${ensembleId}`;
    const missingEvidenceArtifactId = `qa-swarm-missing-evidence-${ensembleId}`;
    const findingsArtifact = buildQaSwarmFindingsArtifact({
      taskId: taskSpec.id,
      ensembleId,
      laneResults
    });
    const missingEvidenceArtifact = buildQaSwarmMissingEvidenceArtifact({
      taskId: taskSpec.id,
      ensembleId,
      laneResults
    });
    const run = buildQaSwarmRun({
      ensembleId,
      taskId: taskSpec.id,
      laneResults,
      findingsArtifactId,
      missingEvidenceArtifactId
    });
    const runArtifactId = `ensemble-run-${ensembleId}`;

    await this.artifactStore.writeArtifact(taskSpec.id, findingsArtifactId, findingsArtifact);
    await this.artifactStore.writeArtifact(taskSpec.id, missingEvidenceArtifactId, missingEvidenceArtifact);
    await this.artifactStore.writeArtifact(taskSpec.id, runArtifactId, run);
    await this.#appendEvent({
      type: 'ensemble.run.completed',
      payload: {
        taskId: taskSpec.id,
        ensembleId,
        mode: 'qa-swarm',
        artifactId: runArtifactId,
        decision: run.decision,
        finalVerificationStatus: run.finalVerificationStatus,
        completionGate: run.completionGate
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

function buildCompetitivePatchRun({
  ensembleId,
  taskId,
  candidateResults
}) {
  const passingCandidate = candidateResults.find(({ result }) => result.verification.status === 'passed');
  const selectedCandidateId = passingCandidate?.candidate.candidateId;
  const candidateSummaries = candidateResults.map(({ candidate, result, evidence }) => summarizeCompetitiveCandidateResult({
    candidate,
    result,
    evidence,
    selectedCandidateId
  }));
  const rejectionReasons = selectedCandidateId === undefined
    ? ['no competitive patch candidate passed verifier checks']
    : [];
  const finalVerificationStatus = selectedCandidateId === undefined ? 'failed' : 'passed';

  return {
    version: '1',
    id: ensembleId,
    taskId,
    mode: 'competitive-patch',
    command: 'competitive-implement',
    roles: ['competitive-candidate', 'verifier'],
    completionGate: 'verifier',
    candidates: candidateSummaries,
    ...(selectedCandidateId ? { selectedCandidateId } : {}),
    decision: finalVerificationStatus === 'passed' ? 'accepted' : 'rejected',
    finalVerificationStatus,
    rejectionReasons
  };
}

function buildQaSwarmRun({
  ensembleId,
  taskId,
  laneResults,
  findingsArtifactId,
  missingEvidenceArtifactId
}) {
  const qaLaneSummaries = laneResults.map(({ lane, result, evidence }) => summarizeQaLaneResult({
    lane,
    result,
    evidence,
    findingsArtifactId,
    missingEvidenceArtifactId
  }));
  const rejectionReasons = buildQaSwarmRejectionReasons(qaLaneSummaries);
  const finalVerificationStatus = rejectionReasons.length === 0 ? 'passed' : 'failed';

  return {
    version: '1',
    id: ensembleId,
    taskId,
    mode: 'qa-swarm',
    command: 'qa-swarm',
    roles: ['qa', 'verifier'],
    completionGate: 'verifier',
    findingsArtifactId,
    missingEvidenceArtifactId,
    qaLanes: qaLaneSummaries,
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
    workspace: stripUndefinedDeep(result.workspace),
    verificationStatus: result.verification.status,
    verification: structuredClone(result.verification)
  };
}

function summarizeCompetitiveCandidateResult({ candidate, result, evidence, selectedCandidateId }) {
  const verifierStatus = result.verification.status;
  const selected = candidate.candidateId === selectedCandidateId;
  const rejectedReason = competitivePatchRejectedReason({
    selected,
    selectedCandidateId,
    verification: result.verification
  });

  return {
    candidateId: candidate.candidateId,
    patchArtifactId: `competitive-patch-${safeRoleArtifactSegment(candidate.candidateId, 'candidate.candidateId')}-patch`,
    commandArtifactId: result.runArtifactId,
    verifierStatus,
    selected,
    ...(rejectedReason ? { rejectedReason } : {}),
    changedFiles: normalizeStringArray(evidence?.changedFiles),
    diffSummary: normalizeStringArray(evidence?.diffSummary),
    ...summarizeRoleResult({
      roleInput: candidate,
      result
    })
  };
}

function summarizeQaLaneResult({ lane, result, evidence, findingsArtifactId, missingEvidenceArtifactId }) {
  return {
    laneId: lane.laneId,
    findingsArtifactId,
    missingEvidenceArtifactId,
    findings: normalizeStringArray(evidence?.findings),
    missingEvidence: missingEvidenceForQaLane({
      evidence,
      verification: result.verification
    }),
    noFindingRationale: typeof evidence?.noFindingRationale === 'string'
      ? evidence.noFindingRationale
      : undefined,
    ...summarizeRoleResult({
      roleInput: lane,
      result
    })
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

function competitivePatchRejectedReason({ selected, selectedCandidateId, verification }) {
  if (selected) {
    return undefined;
  }

  if (verification.status !== 'passed') {
    return `verifier failed: ${verification.reason}`;
  }

  if (selectedCandidateId !== undefined) {
    return 'not selected';
  }

  return `verifier failed: ${verification.reason}`;
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

function buildQaSwarmRejectionReasons(qaLanes) {
  const reasons = [];

  for (const lane of qaLanes) {
    if (lane.verificationStatus !== 'passed') {
      reasons.push(`qa lane ${lane.laneId} (${lane.agentId}) verification failed: ${lane.verification.reason}`);
    }
  }

  return reasons;
}

function buildCompetitivePatchArtifact({ taskId, ensembleId, candidate, evidence }) {
  return {
    version: '1',
    kind: 'competitive-patch-candidate',
    taskId,
    ensembleId,
    candidateId: candidate.candidateId,
    agentId: candidate.agentId,
    adapterId: candidate.adapterId,
    selected: candidate.selected,
    ...(candidate.rejectedReason ? { rejectedReason: candidate.rejectedReason } : {}),
    evidenceArtifactId: candidate.evidenceArtifactId,
    commandArtifactId: candidate.commandArtifactId,
    runArtifactId: candidate.runArtifactId,
    routeDecisionArtifactId: candidate.routeDecisionArtifactId,
    verifierStatus: candidate.verifierStatus,
    verification: structuredClone(candidate.verification),
    changedFiles: normalizeStringArray(evidence?.changedFiles),
    diffSummary: normalizeStringArray(evidence?.diffSummary),
    checks: Array.isArray(evidence?.checks) ? structuredClone(evidence.checks) : []
  };
}

function buildQaSwarmFindingsArtifact({ taskId, ensembleId, laneResults }) {
  return {
    version: '1',
    kind: 'qa-swarm-findings',
    taskId,
    ensembleId,
    lanes: laneResults.map(({ lane, result, evidence }) => ({
      laneId: lane.laneId,
      agentId: lane.agentId,
      adapterId: result.adapterId,
      evidenceArtifactId: result.artifactId,
      evidenceStatus: result.verification.status,
      findings: normalizeStringArray(evidence?.findings),
      noFindingRationale: typeof evidence?.noFindingRationale === 'string'
        ? evidence.noFindingRationale
        : undefined
    }))
  };
}

function buildQaSwarmMissingEvidenceArtifact({ taskId, ensembleId, laneResults }) {
  return {
    version: '1',
    kind: 'qa-swarm-missing-evidence',
    taskId,
    ensembleId,
    lanes: laneResults.map(({ lane, result, evidence }) => ({
      laneId: lane.laneId,
      agentId: lane.agentId,
      adapterId: result.adapterId,
      evidenceArtifactId: result.artifactId,
      evidenceStatus: result.verification.status,
      missingEvidence: missingEvidenceForQaLane({
        evidence,
        verification: result.verification
      })
    }))
  };
}

function missingEvidenceForQaLane({ evidence, verification }) {
  const missing = [];

  if (Array.isArray(evidence?.missingEvidence)) {
    missing.push(...structuredClone(evidence.missingEvidence));
  }

  if (!Array.isArray(evidence?.checks) || evidence.checks.length === 0) {
    missing.push('checks');
  }

  if (!hasFindings(evidence) && typeof evidence?.noFindingRationale !== 'string') {
    missing.push('findings-or-noFindingRationale');
  }

  if (Array.isArray(verification?.requiredEvidence)) {
    missing.push(...verification.requiredEvidence);
  }

  return uniqueByJson(missing);
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

function normalizeCompetitiveCandidates(candidates) {
  assertNonEmptyArray(candidates, 'candidates');
  const candidateIds = new Set();

  return candidates.map((candidate, index) => {
    assertPlainObject(candidate, `candidates[${index}]`);
    const candidateId = requireSafeId(candidate.candidateId, `candidates[${index}].candidateId`);

    if (candidateIds.has(candidateId)) {
      throw new TypeError(`candidates[${index}].candidateId must be unique`);
    }

    candidateIds.add(candidateId);

    return {
      candidateId,
      agentId: assertNonEmptyString(candidate.agentId, `candidates[${index}].agentId`),
      ...(candidate.modelProfile !== undefined ? { modelProfile: assertNonEmptyString(candidate.modelProfile, `candidates[${index}].modelProfile`) } : {})
    };
  });
}

function normalizeQaLanes(qaLanes) {
  assertNonEmptyArray(qaLanes, 'qaLanes');
  const laneIds = new Set();

  return qaLanes.map((lane, index) => {
    assertPlainObject(lane, `qaLanes[${index}]`);
    const laneId = requireSafeId(lane.laneId, `qaLanes[${index}].laneId`);

    if (laneIds.has(laneId)) {
      throw new TypeError(`qaLanes[${index}].laneId must be unique`);
    }

    laneIds.add(laneId);

    return {
      laneId,
      agentId: assertNonEmptyString(lane.agentId, `qaLanes[${index}].agentId`),
      ...(lane.modelProfile !== undefined ? { modelProfile: assertNonEmptyString(lane.modelProfile, `qaLanes[${index}].modelProfile`) } : {})
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

function uniqueByJson(values) {
  const seen = new Set();
  const uniqueValues = [];

  for (const value of values) {
    const key = JSON.stringify(value);

    if (!seen.has(key)) {
      seen.add(key);
      uniqueValues.push(value);
    }
  }

  return uniqueValues;
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.filter((entry) => typeof entry === 'string' && entry.trim() !== '')
    : [];
}

function hasFindings(evidence) {
  return normalizeStringArray(evidence?.findings).length > 0;
}

function stripUndefinedDeep(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, stripUndefinedDeep(entry)]));
  }

  return value;
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
