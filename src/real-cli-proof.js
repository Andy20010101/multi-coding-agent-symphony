import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { redactSecrets } from './redaction.js';

export async function writeRealCliDoctorProofArtifact({
  outputDirectory,
  report
} = {}) {
  if (typeof outputDirectory !== 'string' || outputDirectory.trim() === '') {
    return undefined;
  }

  await mkdir(outputDirectory, { recursive: true });

  const proofPath = join(outputDirectory, 'real-cli-doctor-proof.json');
  const proof = {
    version: '1',
    kind: 'real-cli-doctor',
    realCli: {
      ...report.realCli,
      proofArtifactPath: proofPath
    }
  };

  await writeFile(proofPath, `${JSON.stringify(redactSecrets(proof), null, 2)}\n`);

  return proofPath;
}

export async function writeRealCliSmokeProofArtifact({
  outputDirectory,
  command,
  adapterId,
  provider,
  result,
  now = new Date()
} = {}) {
  if (typeof outputDirectory !== 'string' || outputDirectory.trim() === '') {
    return undefined;
  }

  await mkdir(outputDirectory, { recursive: true });

  const timestamp = safeTimestamp(now);
  const proofPath = join(outputDirectory, `${timestamp}-${safePathPart(adapterId)}-real-cli-proof.json`);
  const proof = {
    version: '1',
    kind: 'real-cli-smoke-proof',
    command,
    adapterId,
    provider: provider ?? {
      name: 'unknown',
      source: 'unknown'
    },
    runId: result?.runId ?? null,
    taskId: result?.taskId ?? null,
    modelProfile: result?.modelProfile ?? 'unknown',
    requestedModelProfile: result?.requestedModelProfile ?? result?.modelProfile ?? 'unknown',
    observedModelProfile: result?.observedModelProfile ?? null,
    modelProfileStatus: result?.modelProfileStatus ?? 'unknown',
    modelProfileMismatch: result?.modelProfileMismatch ?? null,
    verifierStatus: result?.verification?.status ?? 'unknown',
    evidencePath: proofPath,
    resourceProfile: result?.resourceProfile ?? {
      status: 'unknown',
      unknownResourceProfileReason: 'resource profile was not recorded'
    },
    evidence: result?.evidence ?? null,
    skipped: result?.skipped === true,
    ...(result?.reason ? { reason: result.reason } : {})
  };

  await writeFile(proofPath, `${JSON.stringify(redactSecrets(proof), null, 2)}\n`);

  return proofPath;
}

function safeTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();

  if (Number.isNaN(time)) {
    throw new TypeError('now must be a valid timestamp');
  }

  return date.toISOString().replace(/[^0-9A-Za-z]+/g, '-').replace(/-$/u, '');
}

function safePathPart(value) {
  return String(value ?? 'unknown')
    .replace(/[^0-9A-Za-z._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}
