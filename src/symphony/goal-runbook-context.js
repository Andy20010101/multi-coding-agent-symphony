import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isSafeGoalEventToken } from './goal-event-contracts.js';
import { readGoalEventJournal } from './goal-event-journal.js';
import {
  buildGoalProgressLedger,
  buildGoalProgressLedgerFromRunbook
} from './goal-progress-ledger.js';
import {
  readManagedActiveGoalPointer,
  readManagedGoalRunbookState
} from './goal-runbook-registry.js';
import { assertGoalRunbookContract } from './goal-runbook-contracts.js';

export const CONTROLLED_FIXTURE_GOAL_ID = 'v19-fixture';
export const CONTROLLED_FIXTURE_REF = 'fixtures/contracts/goal-runbook.valid.v1.json';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

export class GoalRunbookContextError extends Error {
  constructor(code, message, safeDetails) {
    super(message);
    this.name = 'GoalRunbookContextError';
    this.code = code;

    if (safeDetails !== undefined) {
      this.safeDetails = safeDetails;
    }
  }
}

export async function resolveGoalRunbookGoalId({
  stateDir = '.symphony',
  goalId = 'latest'
} = {}) {
  if (goalId !== undefined && goalId !== null && goalId !== 'latest') {
    if (!isSafeGoalEventToken(goalId)) {
      throw new GoalRunbookContextError(
        'invalid-goal-id',
        '--goal must be latest or a safe non-empty goal id.'
      );
    }

    return goalId;
  }

  const pointer = await readManagedActiveGoalPointer({ stateDir });

  return isSafeGoalEventToken(pointer?.goalId) ? pointer.goalId : null;
}

export async function loadGoalRunbookContext({
  stateDir = '.symphony',
  goalId = 'latest',
  allowControlledFixtureFallback = false
} = {}) {
  const resolvedGoalId = await resolveGoalRunbookGoalId({ stateDir, goalId });

  if (resolvedGoalId === null) {
    return null;
  }

  const state = await readManagedGoalRunbookState({
    stateDir,
    goalId: resolvedGoalId
  });

  if (state !== null) {
    try {
      return {
        goalId: resolvedGoalId,
        source: 'managed-runbook',
        state,
        runbook: assertGoalRunbookContract(state.runbook)
      };
    } catch (error) {
      throw new GoalRunbookContextError(
        'invalid-managed-runbook',
        'managed goal runbook state is invalid.',
        { reason: safeErrorMessage(error) }
      );
    }
  }

  if (allowControlledFixtureFallback && resolvedGoalId === CONTROLLED_FIXTURE_GOAL_ID) {
    return {
      goalId: resolvedGoalId,
      source: 'controlled-fixture',
      state: null,
      runbook: await readControlledFixtureRunbook(resolvedGoalId)
    };
  }

  return null;
}

export async function readGoalEventLogForRunbook({
  stateDir = '.symphony',
  runbook
} = {}) {
  return await readGoalEventJournal({
    stateDir,
    goalId: runbook.goalId,
    goalTitle: runbook.goalTitle,
    baseline: runbook.baseline
  });
}

export async function buildGoalLedgerForRunbook({
  stateDir = '.symphony',
  runbook,
  eventLog,
  generatedAt = new Date().toISOString()
} = {}) {
  const ledger = await buildGoalProgressLedger({
    stateDir,
    goalId: runbook.goalId,
    generatedAt
  });

  return ledger ?? buildGoalProgressLedgerFromRunbook({
    runbook,
    eventLog,
    generatedAt
  });
}

async function readControlledFixtureRunbook(goalId) {
  const parsed = JSON.parse(await readFile(join(REPO_ROOT, CONTROLLED_FIXTURE_REF), 'utf8'));

  return assertGoalRunbookContract({
    ...parsed,
    goalId
  });
}

function safeErrorMessage(error) {
  if (typeof error?.safeDetails?.reason === 'string') {
    return error.safeDetails.reason;
  }

  return typeof error?.message === 'string' && error.message.trim() !== ''
    ? error.message
    : 'unknown error';
}
