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
    const artifacts = summarizeArtifacts(workflowResult);

    await mkdir(runDirectory, { recursive: true });
    await writeJson(evidenceMapPath, {
      version: '1',
      runId: this.runId,
      taskId: taskSpec.id,
      taskPacketId: taskPacket.id,
      status: harnessVerification.status,
      verifierStatus: harnessVerification.status,
      symphonyStatus: workflowResult.status,
      expectedChecks: [...harnessVerification.expectedChecks],
      ...(executionMode ? { executionMode } : {}),
      artifacts,
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
      artifacts
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
      reason: harnessVerification.reason,
      expectedChecks: [...harnessVerification.expectedChecks],
      ...(executionMode ? { executionMode } : {}),
      writeSetViolations: structuredClone(harnessVerification.writeSetViolations),
      missingExpectedChecks: structuredClone(harnessVerification.missingExpectedChecks),
      ...(harnessVerification.policyDenied ? { policyDenied: structuredClone(harnessVerification.policyDenied) } : {}),
      artifactDirectory: runtime.artifactDirectory,
      eventDirectory: runtime.eventDirectory,
      workspaceDirectory: runtime.workspaceDirectory,
      sessionId: runtime.sessionId,
      artifacts,
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
    artifactId: command.artifactId,
    runArtifactId: command.runArtifactId,
    routeDecisionArtifactId: command.routeDecisionArtifactId,
    verificationStatus: command.verification?.status ?? command.verificationStatus ?? 'unknown'
  }));
}

function renderVerificationMarkdown({ runId, taskId, workflowResult, harnessVerification, artifacts }) {
  const lines = [
    `## Run ${runId}`,
    '',
    `- Task: ${taskId}`,
    `- Status: ${harnessVerification.status}`,
    `- Reason: ${harnessVerification.reason}`,
    `- Symphony status: ${workflowResult.status}`,
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
