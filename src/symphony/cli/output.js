import { withProductJsonContract } from '../contract.js';

export function writeJson(stream, value) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function writeProductOutput(stdout, summary, json) {
  if (json) {
    writeJson(stdout, withProductJsonContract(summary));
    return;
  }

  stdout.write(`${humanProductSummary(summary)}\n`);
}

export function humanProductSummary(summary) {
  if (summary.command === 'symphony status' && summary.status === 'no-runs') {
    return [
      'Status: no runs yet',
      `Next: ${summary.nextAction}`
    ].join('\n');
  }

  const lines = [
    `Intent: ${summary.intent}`,
    `Pipeline: ${summary.pipeline.join(' -> ')}`,
    `Safety: ${summary.safetyMode}`,
    `Project writes: ${summary.projectWrites ? 'yes' : 'no'}`,
    `Runtime writes: ${summary.runtimeWrites ? 'yes' : 'no'}`,
    `External calls: ${summary.externalCalls ? 'yes' : 'no'}`,
    `Status: ${summary.status}`
  ];

  if (summary.verifierStatus !== undefined) {
    lines.push(`Verifier: ${summary.verifierStatus}`);
  }

  if (summary.runId !== undefined || summary.latestRunId !== undefined) {
    lines.push(`Run: ${summary.runId ?? summary.latestRunId}`);
  }

  for (const [label, field] of [
    ['Context', 'contextArtifactPath'],
    ['Summary', 'summaryArtifactPath'],
    ['Evidence', 'evidenceArtifactPath'],
    ['Harness', 'harnessOutputPath'],
    ['TaskPacket', 'taskPacketPath'],
    ['Execution plan', 'executionPlanArtifactPath'],
    ['Adoption plan', 'adoptionPlanArtifactPath'],
    ['Patch', 'patchArtifactPath'],
    ['Journal', 'adoptionJournalArtifactPath'],
    ['Plan', 'scaffoldPlanArtifactPath'],
    ['Manifest', 'scaffoldManifestArtifactPath'],
    ['Proof', 'proofArtifactPath']
  ]) {
    if (summary[field] !== undefined) {
      lines.push(`${label}: ${summary[field]}`);
    }
  }

  if (summary.nextAction !== undefined) {
    lines.push(`Next: ${summary.nextAction}`);
  }

  return lines.join('\n');
}
