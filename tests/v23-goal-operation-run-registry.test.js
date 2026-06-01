import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  GOAL_OPERATION_RUNS_CONTRACT_NAME,
  buildGoalOperationId,
  readGoalOperationRuns,
  recordGoalOperationRun
} from '../src/symphony/goal-operation-run-registry.js';

const GOAL_ID = 'v23-goal-operation-run-console';
const PLAN_HASH = 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

describe('v23 goal operation run registry', () => {
  it('records a Workbench goal operation run and updates the same operation id on confirm', async () => {
    const stateDir = await mkdtemp(join(tmpdir(), 'symphony-v23-operation-runs-'));

    try {
      const operationId = buildGoalOperationId({
        goalId: GOAL_ID,
        taskId: 'task-1',
        role: 'worker',
        commandKind: 'update',
        planHash: PLAN_HASH
      });

      const previewRun = await recordGoalOperationRun({
        stateDir,
        goalId: GOAL_ID,
        taskId: 'task-1',
        role: 'worker',
        commandKind: 'update',
        commandName: 'symphony goal update',
        status: 'dry-run-planned',
        planHash: PLAN_HASH,
        source: 'workbench.event-plan-preview',
        recordedAt: '2026-05-31T01:00:00.000Z'
      });
      const confirmedRun = await recordGoalOperationRun({
        stateDir,
        goalId: GOAL_ID,
        taskId: 'task-1',
        role: 'worker',
        commandKind: 'update',
        commandName: 'symphony goal update',
        status: 'confirmed',
        planHash: PLAN_HASH,
        eventIds: ['evt_task1_worker_evidence'],
        source: 'workbench.event-plan-confirm',
        recordedAt: '2026-05-31T01:01:00.000Z'
      });
      const repeatedPreviewRun = await recordGoalOperationRun({
        stateDir,
        goalId: GOAL_ID,
        taskId: 'task-1',
        role: 'worker',
        commandKind: 'update',
        commandName: 'symphony goal update',
        status: 'dry-run-planned',
        planHash: PLAN_HASH,
        source: 'workbench.event-plan-preview',
        recordedAt: '2026-05-31T01:02:00.000Z'
      });
      const registry = await readGoalOperationRuns({
        stateDir,
        goalId: GOAL_ID
      });

      assert.equal(previewRun.operationId, operationId);
      assert.equal(confirmedRun.operationId, operationId);
      assert.equal(repeatedPreviewRun.status, 'confirmed');
      assert.equal(registry.contractName, GOAL_OPERATION_RUNS_CONTRACT_NAME);
      assert.equal(registry.operationCount, 1);
      assert.equal(registry.latestOperationId, operationId);
      assert.equal(registry.runs[0].goalId, GOAL_ID);
      assert.equal(registry.runs[0].taskId, 'task-1');
      assert.equal(registry.runs[0].role, 'worker');
      assert.equal(registry.runs[0].commandKind, 'update');
      assert.equal(registry.runs[0].status, 'confirmed');
      assert.equal(registry.runs[0].planHash, PLAN_HASH);
      assert.deepEqual(registry.runs[0].eventIds, ['evt_task1_worker_evidence']);
      assert.equal(registry.runs[0].source, 'workbench.event-plan-confirm');
      assert.deepEqual(registry.runs[0].timestamps, {
        startedAt: '2026-05-31T01:00:00.000Z',
        updatedAt: '2026-05-31T01:02:00.000Z',
        completedAt: '2026-05-31T01:01:00.000Z'
      });
    } finally {
      await rm(stateDir, {
        recursive: true,
        force: true
      });
    }
  });
});
