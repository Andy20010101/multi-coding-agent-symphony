import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export class HarnessEvidenceSink {
  constructor({ rootDirectory = '.omx/harness', runId }) {
    assertSafePathSegment(runId, 'runId');

    this.rootDirectory = rootDirectory;
    this.runId = runId;
  }

  async write({
    taskPacket,
    taskSpec,
    workflowResult,
    harnessVerification,
    runtime,
    taskPacketPath,
    executionMode
  }) {
    const runDirectory = join(this.rootDirectory, 'runs', this.runId);
    const evidenceMapPath = join(runDirectory, 'evidence-map.json');
    const verificationPath = join(runDirectory, 'verification.md');
    const summaryPath = join(runDirectory, 'summary.json');
    const workflowMode = workflowResult.mode ?? 'linear';
    const artifacts = summarizeArtifacts(workflowResult);
    const stages = summarizeStages(workflowResult);
    const verificationMap = buildVerificationMap(stages);

    await mkdir(runDirectory, { recursive: true });
    await writeJson(evidenceMapPath, {
      version: '1',
      runId: this.runId,
      taskId: taskSpec.id,
      taskPacketId: taskPacket.id,
      status: harnessVerification.status,
      verifierStatus: harnessVerification.status,
      symphonyStatus: workflowResult.status,
      workflowMode,
      ...(workflowResult.completionGate ? { completionGate: workflowResult.completionGate } : {}),
      ...(workflowResult.selectedCandidateId ? { selectedCandidateId: workflowResult.selectedCandidateId } : {}),
      expectedChecks: [...harnessVerification.expectedChecks],
      ...(harnessVerification.diagnosticLayer ? { diagnosticLayer: harnessVerification.diagnosticLayer } : {}),
      ...(executionMode ? { executionMode } : {}),
      artifacts,
      stages,
      verificationMap,
      artifactDirectory: runtime.artifactDirectory,
      eventDirectory: runtime.eventDirectory,
      workspaceDirectory: runtime.workspaceDirectory,
      sessionId: runtime.sessionId,
      writtenAt: new Date().toISOString()
    });
    await appendFile(verificationPath, renderVerificationMarkdown({
      runId: this.runId,
      taskId: taskSpec.id,
      workflowResult,
      harnessVerification,
      artifacts,
      stages,
      workflowMode
    }), 'utf8');
    await writeJson(summaryPath, {
      version: '1',
      runId: this.runId,
      taskId: taskSpec.id,
      taskPacketId: taskPacket.id,
      taskPacketPath,
      status: harnessVerification.status,
      verifierStatus: harnessVerification.status,
      symphonyStatus: workflowResult.status,
      workflowMode,
      ...(workflowResult.completionGate ? { completionGate: workflowResult.completionGate } : {}),
      ...(workflowResult.selectedCandidateId ? { selectedCandidateId: workflowResult.selectedCandidateId } : {}),
      reason: harnessVerification.reason,
      ...(harnessVerification.diagnosticLayer ? { diagnosticLayer: harnessVerification.diagnosticLayer } : {}),
      expectedChecks: [...harnessVerification.expectedChecks],
      ...(executionMode ? { executionMode } : {}),
      writeSetViolations: structuredClone(harnessVerification.writeSetViolations),
      missingExpectedChecks: structuredClone(harnessVerification.missingExpectedChecks),
      diagnostics: structuredClone(harnessVerification.diagnostics ?? []),
      ...(harnessVerification.policyDenied ? { policyDenied: structuredClone(harnessVerification.policyDenied) } : {}),
      artifactDirectory: runtime.artifactDirectory,
      eventDirectory: runtime.eventDirectory,
      workspaceDirectory: runtime.workspaceDirectory,
      sessionId: runtime.sessionId,
      artifacts,
      stages,
      verificationMap,
      writtenAt: new Date().toISOString()
    });

    return {
      evidenceMapPath,
      verificationPath,
      summaryPath
    };
  }
}

function summarizeArtifacts(workflowResult) {
  if (!Array.isArray(workflowResult?.commands)) {
    return [];
  }

  return workflowResult.commands.map((command) => ({
    command: command.command,
    adapterId: command.adapterId,
    ...(command.candidateId ? { candidateId: command.candidateId } : {}),
    ...(command.agentId ? { agentId: command.agentId } : {}),
    artifactId: command.artifactId,
    ...(command.patchArtifactId ? { patchArtifactId: command.patchArtifactId } : {}),
    ...(command.commandArtifactId ? { commandArtifactId: command.commandArtifactId } : {}),
    runArtifactId: command.runArtifactId,
    routeDecisionArtifactId: command.routeDecisionArtifactId,
    verificationStatus: command.verification?.status ?? command.verificationStatus ?? 'unknown',
    ...(command.selected !== undefined ? { selected: command.selected } : {}),
    ...(command.rejectedReason ? { rejectedReason: command.rejectedReason } : {})
  }));
}

function summarizeStages(workflowResult) {
  if (!Array.isArray(workflowResult?.commands)) {
    return [];
  }

  return workflowResult.commands.map((command) => stripUndefined({
    stage: command.stage ?? command.command,
    role: command.role,
    laneId: command.laneId,
    candidateId: command.candidateId,
    agentId: command.agentId,
    command: command.command,
    adapterId: command.adapterId,
    writeSet: command.writeSet ? structuredClone(command.writeSet) : undefined,
    patchArtifactId: command.patchArtifactId,
    commandArtifactId: command.commandArtifactId,
    findings: command.findings ? structuredClone(command.findings) : undefined,
    missingEvidence: command.missingEvidence ? structuredClone(command.missingEvidence) : undefined,
    noFindingRationale: command.noFindingRationale,
    findingsArtifactId: command.findingsArtifactId,
    missingEvidenceArtifactId: command.missingEvidenceArtifactId,
    artifactId: command.artifactId,
    runArtifactId: command.runArtifactId,
    routeDecisionArtifactId: command.routeDecisionArtifactId,
    verificationStatus: command.verification?.status ?? command.verificationStatus ?? 'unknown',
    verificationReason: command.verification?.reason ?? command.verificationReason,
    selected: command.selected,
    rejectedReason: command.rejectedReason,
    diagnosticLayer: command.diagnosticLayer,
    adapterArtifactRefs: command.adapterArtifactRefs
  }));
}

function buildVerificationMap(stages) {
  return stages.map((stage) => stripUndefined({
    stage: stage.stage,
    laneId: stage.laneId,
    candidateId: stage.candidateId,
    agentId: stage.agentId,
    command: stage.command,
    adapterId: stage.adapterId,
    writeSet: stage.writeSet ? structuredClone(stage.writeSet) : undefined,
    patchArtifactId: stage.patchArtifactId,
    commandArtifactId: stage.commandArtifactId,
    findings: stage.findings ? structuredClone(stage.findings) : undefined,
    missingEvidence: stage.missingEvidence ? structuredClone(stage.missingEvidence) : undefined,
    noFindingRationale: stage.noFindingRationale,
    findingsArtifactId: stage.findingsArtifactId,
    missingEvidenceArtifactId: stage.missingEvidenceArtifactId,
    artifactId: stage.artifactId,
    runArtifactId: stage.runArtifactId,
    routeDecisionArtifactId: stage.routeDecisionArtifactId,
    verificationStatus: stage.verificationStatus,
    verificationReason: stage.verificationReason,
    selected: stage.selected,
    rejectedReason: stage.rejectedReason,
    diagnosticLayer: stage.diagnosticLayer
  }));
}

function renderVerificationMarkdown({ runId, taskId, workflowResult, harnessVerification, artifacts, stages, workflowMode }) {
  const lines = [
    `## Run ${runId}`,
    '',
    `- Task: ${taskId}`,
    `- Status: ${harnessVerification.status}`,
    `- Reason: ${harnessVerification.reason}`,
    ...(harnessVerification.diagnosticLayer ? [`- Diagnostic layer: ${harnessVerification.diagnosticLayer}`] : []),
    `- Symphony status: ${workflowResult.status}`,
    `- Workflow mode: ${workflowMode}`,
    ...(workflowResult.completionGate ? [`- Completion gate: ${workflowResult.completionGate}`] : []),
    `- Expected checks: ${harnessVerification.expectedChecks.join(', ')}`
  ];

  if (harnessVerification.policyDenied) {
    lines.push(`- Policy denied: ${harnessVerification.policyDenied.reason}`);
    lines.push(`- Policy target: ${harnessVerification.policyDenied.target ?? harnessVerification.policyDenied.matchedRule ?? 'unknown'}`);
  }

  if (artifacts.length > 0) {
    lines.push('- Artifacts:');
    for (const artifact of artifacts) {
      lines.push(`  - ${artifact.command}: ${artifact.artifactId} (${artifact.verificationStatus})`);
    }
  }

  if (stages.length > 0) {
    lines.push('- Stages:');
    for (const stage of stages) {
      const details = [
        stage.patchArtifactId ? `patch ${stage.patchArtifactId}` : null,
        stage.rejectedReason ? stage.rejectedReason : null
      ].filter(Boolean);
      const suffix = details.length > 0 ? `; ${details.join('; ')}` : '';

      lines.push(`  - Stage: ${stage.stage} -> ${stage.artifactId} (${stage.verificationStatus})${suffix}`);
    }
  }

  for (const violation of harnessVerification.writeSetViolations) {
    lines.push(`- Write-set violation: ${violation.changedFiles.join(', ')}`);
  }

  for (const missing of harnessVerification.missingExpectedChecks) {
    lines.push(`- Missing expected checks: ${missing.expectedCommands.join(', ')}`);
  }

  lines.push('', '');

  return lines.join('\n');
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function assertSafePathSegment(value, field) {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('/') || value.includes('..')) {
    throw new TypeError(`${field} must be a safe path segment`);
  }
}

function stripUndefined(value) {
  const normalized = {};

  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) {
      normalized[key] = entry;
    }
  }

  return normalized;
}
