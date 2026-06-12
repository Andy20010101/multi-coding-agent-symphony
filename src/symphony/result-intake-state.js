import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { isSafeGoalEventToken } from './goal-event-contracts.js';
import {
  assertPendingResultContract,
  assertResultEvidenceEscrowContract
} from './result-intake-contracts.js';
import { atomicWriteJson } from './state.js';

export const RESULT_EVIDENCE_ESCROW_STORAGE = 'managed-result-evidence-escrow';
export const PENDING_RESULT_STATE_STORAGE = 'managed-pending-result-state';

const writeChains = new Map();

export async function writeResultIntakeConfirmState({
  stateDir = '.symphony',
  escrow,
  pendingResult
} = {}) {
  assertResultEvidenceEscrowContract(escrow);
  assertPendingResultContract(pendingResult);

  if (escrow.goalId !== pendingResult.goalId || escrow.taskId !== pendingResult.taskId) {
    throw new TypeError('result intake escrow and pending result must share goalId and taskId');
  }

  const escrowPath = getResultEvidenceEscrowPath({
    stateDir,
    goalId: escrow.goalId,
    escrowId: escrow.escrowId
  });
  const pendingResultPath = getPendingResultPath({
    stateDir,
    goalId: pendingResult.goalId,
    taskId: pendingResult.taskId
  });
  const chainKey = `${escrowPath}\0${pendingResultPath}`;

  return enqueueWrite(chainKey, async () => {
    await atomicWriteJson(escrowPath, {
      ...escrow,
      storage: RESULT_EVIDENCE_ESCROW_STORAGE
    });
    await atomicWriteJson(pendingResultPath, {
      ...pendingResult,
      storage: PENDING_RESULT_STATE_STORAGE
    });

    return {
      escrowRef: escrow.escrowRef,
      pendingResultRef: buildPendingResultRef(pendingResult),
      written: {
        resultEvidenceEscrow: true,
        pendingResult: true,
        goalEventLog: false,
        operationRegistry: false,
        reviewerState: false,
        gateState: false,
        gitState: false,
        releaseState: false
      }
    };
  });
}

export async function readResultEvidenceEscrow({ stateDir = '.symphony', goalId, escrowId } = {}) {
  return readJsonIfExists(getResultEvidenceEscrowPath({
    stateDir,
    goalId,
    escrowId
  }));
}

export async function readPendingResult({ stateDir = '.symphony', goalId, taskId } = {}) {
  return readJsonIfExists(getPendingResultPath({
    stateDir,
    goalId,
    taskId
  }));
}

export function getResultEvidenceEscrowPath({ stateDir = '.symphony', goalId, escrowId } = {}) {
  assertSafeStateDir(stateDir);
  assertSafeToken(goalId, 'goalId');
  assertSafeToken(escrowId, 'escrowId');

  return join(stateDir, 'goals', 'result-evidence-escrow', goalId, `${escrowId}.json`);
}

export function getPendingResultPath({ stateDir = '.symphony', goalId, taskId } = {}) {
  assertSafeStateDir(stateDir);
  assertSafeToken(goalId, 'goalId');
  assertSafeToken(taskId, 'taskId');

  return join(stateDir, 'goals', 'pending-results', goalId, `${taskId}.json`);
}

export function buildPendingResultRef(pendingResult) {
  assertPendingResultContract(pendingResult);

  return `pending-result:${pendingResult.goalId}:${pendingResult.taskId}:${pendingResult.sourceContracts[0].previewPlanHash}`;
}

async function enqueueWrite(key, operation) {
  const previous = writeChains.get(key) ?? Promise.resolve();
  const write = previous.then(operation, operation);
  const settled = write.catch(() => {});

  writeChains.set(key, settled);

  try {
    return await write;
  } finally {
    if (writeChains.get(key) === settled) {
      writeChains.delete(key);
    }
  }
}

async function readJsonIfExists(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
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
