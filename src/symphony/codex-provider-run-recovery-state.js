import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  validateCodexProviderRunRecordContract
} from './codex-provider-execution-contracts.js';
import {
  isSafeGoalEventToken
} from './goal-event-contracts.js';

export const CODEX_PROVIDER_RUN_RECORD_STORAGE = 'managed-codex-provider-run-record';

export async function readCodexProviderRunRecord({
  stateDir = '.symphony',
  goalId,
  taskId
} = {}) {
  assertSafeStateDir(stateDir);
  assertSafeToken(goalId, 'goalId');
  assertSafeToken(taskId, 'taskId');

  return await readJsonIfExists(getCodexProviderRunRecordPath({
    stateDir,
    goalId,
    taskId
  }));
}

export function getCodexProviderRunRecordPath({
  stateDir = '.symphony',
  goalId,
  taskId
} = {}) {
  assertSafeStateDir(stateDir);
  assertSafeToken(goalId, 'goalId');
  assertSafeToken(taskId, 'taskId');

  return join(stateDir, 'goals', 'codex-provider-run-records', goalId, `${taskId}.json`);
}

export function isCodexProviderRunRecordSource(value) {
  if (value === null) {
    return false;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  if (value.contractName !== 'codexProviderRunRecord.v1') {
    return false;
  }

  const validation = validateCodexProviderRunRecordContract(value);

  if (validation.ok) {
    return true;
  }

  return validation.errors.some((error) => (
    typeof error === 'string' &&
    /raw provider output|raw transcript|rawTranscript|rawModelOutput|local session|direct mutation routes/iu.test(error)
  ));
}

async function readJsonIfExists(path) {
  try {
    const value = JSON.parse(await readFile(path, 'utf8'));

    return isCodexProviderRunRecordSource(value) ? value : null;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

function assertSafeStateDir(stateDir) {
  if (typeof stateDir !== 'string' || stateDir.trim() === '') {
    throw new TypeError('stateDir must be a non-empty string');
  }
}

function assertSafeToken(value, field) {
  if (!isSafeGoalEventToken(value)) {
    throw new TypeError(`${field} must be a safe token`);
  }
}
