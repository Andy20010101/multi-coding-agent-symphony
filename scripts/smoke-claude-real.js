#!/usr/bin/env node
import { runClaudeRealSmoke } from '../src/claude-real-smoke.js';
import { writeRealCliSmokeProofArtifact } from '../src/real-cli-proof.js';

try {
  const result = await runClaudeRealSmoke();
  const proofArtifactPath = await writeRealCliSmokeProofArtifact({
    outputDirectory: process.env.MCAS_REAL_CLI_PROOF_DIR,
    command: 'smoke:claude:real',
    adapterId: result.adapterId ?? 'claude-code',
    provider: result.provider,
    result
  });

  if (proofArtifactPath) {
    result.proofArtifactPath = proofArtifactPath;
  }

  console.log(JSON.stringify(result, null, 2));

  if (!result.skipped && result.verification.status !== 'passed') {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error?.stack ?? error);
  process.exitCode = 1;
}
