#!/usr/bin/env node

import { fileURLToPath } from 'node:url';

import { runMcasCli } from './mcas.js';

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
  const exitCode = await runMcasCli({
    argv: buildHarnessCodexRealSmokeArgv()
  });

  process.exitCode = exitCode;
}
