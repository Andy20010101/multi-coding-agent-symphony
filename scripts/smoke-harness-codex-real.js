#!/usr/bin/env node

import { fileURLToPath } from 'node:url';

import { runMcasCli } from './mcas.js';
import { writeRealCliSmokeProofArtifact } from '../src/real-cli-proof.js';

const DEFAULT_TASKPACKET = 'fixtures/harness/real-smoke-taskpacket.json';
const DEFAULT_HARNESS_DIR = 'tmp/harness-bridge-real-smoke-harness-standard';
const DEFAULT_TIMEOUT_MS = '180000';

export function buildHarnessCodexRealSmokeArgv({
  env = process.env,
  now = new Date()
} = {}) {
  const runId = env.MCAS_HARNESS_CODEX_REAL_RUN_ID ?? `fixture-real-smoke-standard-${safeTimestamp(now)}`;
  const runtimeDirectory = env.MCAS_HARNESS_CODEX_REAL_RUNTIME_DIR ?? `tmp/harness-bridge-real-smoke-standard-${runId}`;
  const harnessDirectory = env.MCAS_HARNESS_CODEX_REAL_HARNESS_DIR ?? DEFAULT_HARNESS_DIR;
  const taskPacket = env.MCAS_HARNESS_CODEX_REAL_TASKPACKET ?? DEFAULT_TASKPACKET;
  const timeoutMs = env.MCAS_HARNESS_CODEX_REAL_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS;

  return [
    'harness',
    'run-taskpacket',
    '--run-id',
    runId,
    '--taskpacket',
    taskPacket,
    '--runtime-dir',
    runtimeDirectory,
    '--harness-dir',
    harnessDirectory,
    '--real',
    '--adapter',
    'codex',
    '--sequence',
    'standard',
    '--timeout-ms',
    timeoutMs
  ];
}

function safeTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();

  if (Number.isNaN(time)) {
    throw new TypeError('now must be a valid timestamp');
  }

  return date.toISOString().replace(/[^0-9A-Za-z]+/g, '-').replace(/-$/u, '');
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = captureOnly();
  const errorOutput = captureOnly();
  const exitCode = await runMcasCli({
    argv: buildHarnessCodexRealSmokeArgv(),
    stdout: output.stream,
    stderr: errorOutput.stream
  });
  const result = parseOptionalJson(output.text());
  const proofArtifactPath = result
    ? await writeRealCliSmokeProofArtifact({
      outputDirectory: process.env.MCAS_REAL_CLI_PROOF_DIR,
      command: 'smoke:harness:codex:real',
      adapterId: result.adapterId ?? 'codex',
      provider: {
        name: process.env.MCAS_CODEX_PROVIDER ?? 'unknown',
        source: process.env.MCAS_CODEX_PROVIDER ? 'env' : 'unknown'
      },
      result: {
        skipped: false,
        runId: result.runId,
        taskId: result.taskId,
        adapterId: result.adapterId ?? 'codex',
        modelProfile: process.env.MCAS_CODEX_MODEL ?? 'codex-config-default',
        verification: {
          status: result.verifierStatus ?? result.status ?? 'unknown'
        },
        evidence: {
          evidencePaths: result.evidencePaths,
          commands: result.commands,
          diagnostics: result.diagnostics
        },
        resourceProfile: {
          status: 'unknown',
          unknownResourceProfileReason: 'Harness smoke does not currently record resourceProfile in the CLI wrapper.'
        }
      }
    })
    : undefined;

  if (errorOutput.text()) {
    process.stderr.write(errorOutput.text());
  }

  if (result) {
    if (proofArtifactPath) {
      result.proofArtifactPath = proofArtifactPath;
    }

    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (output.text()) {
    process.stdout.write(output.text());
  }

  process.exitCode = exitCode;
}

function captureOnly() {
  let captured = '';

  return {
    stream: {
      write(chunk) {
        captured += chunk;
      }
    },
    text() {
      return captured;
    }
  };
}

function parseOptionalJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
