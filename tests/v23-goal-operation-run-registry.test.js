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

  it('records a controlled implementation run result with artifacts and verifier summary', async () => {
    const stateDir = await mkdtemp(join(tmpdir(), 'symphony-v29-implementation-operation-runs-'));

    try {
      const operationId = buildGoalOperationId({
        goalId: GOAL_ID,
        taskId: 'task-4',
        role: 'worker',
        commandKind: 'implementation',
        planHash: PLAN_HASH
      });
      const recorded = await recordGoalOperationRun({
        stateDir,
        goalId: GOAL_ID,
        taskId: 'task-4',
        role: 'worker',
        commandKind: 'implementation',
        commandName: 'symphony do --confirm-plan',
        status: 'confirmed',
        planHash: PLAN_HASH,
        source: 'workbench.implementation-run-confirm',
        output: {
          stdout: 'runId=run-v29-task-4\nstatus=passed\nverifierStatus=passed',
          stderr: '',
          exitCode: 0
        },
        runResult: {
          runId: 'run-v29-task-4',
          executionPlanId: 'controlled-implementation-plan-v29-task-4',
          status: 'passed',
          exitCode: 0,
          verifierStatus: 'passed',
          writeBoundary: 'isolated-workspace',
          mainWorktreeWrites: false,
          workspaceWrites: true,
          evidenceArtifactPath: 'tmp/artifacts/implementation-evidence.json',
          changedFiles: ['isolated-workspace-output.txt']
        },
        artifactRefs: [{
          kind: 'evidence',
          path: 'tmp/artifacts/implementation-evidence.json'
        }],
        verifierSummary: {
          status: 'passed',
          runStatus: 'passed',
          passed: true,
          artifactCount: 1,
          changedFileCount: 1
        },
        recordedAt: '2026-06-01T01:00:00.000Z'
      });
      const registry = await readGoalOperationRuns({
        stateDir,
        goalId: GOAL_ID
      });

      assert.equal(recorded.operationId, operationId);
      assert.equal(registry.operationCount, 1);
      assert.equal(registry.runs[0].commandKind, 'implementation');
      assert.equal(registry.runs[0].status, 'confirmed');
      assert.equal(registry.runs[0].output.stdout.includes('verifierStatus=passed'), true);
      assert.equal(registry.runs[0].runResult.runId, 'run-v29-task-4');
      assert.equal(registry.runs[0].runResult.mainWorktreeWrites, false);
      assert.equal(registry.runs[0].artifactRefs[0].kind, 'evidence');
      assert.equal(registry.runs[0].verifierSummary.passed, true);
      assert.equal(registry.runs[0].failureReason, null);
    } finally {
      await rm(stateDir, {
        recursive: true,
        force: true
      });
    }
  });

  it('records a controlled verification command result without implying a gate passed', async () => {
    const stateDir = await mkdtemp(join(tmpdir(), 'symphony-v31-verification-operation-runs-'));

    try {
      const recorded = await recordGoalOperationRun({
        stateDir,
        goalId: GOAL_ID,
        taskId: 'task-3',
        role: 'main-verifier',
        commandKind: 'verification',
        commandName: 'controlled main verification suite',
        status: 'failed',
        planHash: PLAN_HASH,
        source: 'workbench.verification-run-confirm',
        output: {
          stdout: 'command=pnpm check\nstatus=passed\nexitCode=0\n---\ncommand=git diff --check\nstatus=failed\nexitCode=1',
          stderr: 'git diff --check\ntrailing whitespace',
          exitCode: 1
        },
        runResult: {
          runId: 'verification-v31-task-3',
          suiteId: 'v31-main-verification-command-suite',
          status: 'failed',
          exitCode: 1,
          commandCount: 2,
          failedCommandCount: 1,
          gatePassed: false,
          commandResults: [{
            command: 'git diff --check',
            status: 'failed',
            exitCode: 1,
            stdoutSummary: '',
            stderrSummary: 'trailing whitespace'
          }]
        },
        artifactRefs: [{
          kind: 'operation-registry',
          ref: 'goal-operation-runs:op_verification',
          uri: `/api/goals/${GOAL_ID}/operations`
        }],
        verifierSummary: {
          status: 'failed',
          runStatus: 'failed',
          passed: false,
          commandCount: 2,
          failedCommandCount: 1,
          gatePassed: false
        },
        failureReason: 'git diff --check exited 1',
        recordedAt: '2026-06-01T02:00:00.000Z'
      });
      const registry = await readGoalOperationRuns({
        stateDir,
        goalId: GOAL_ID
      });

      assert.equal(recorded.commandKind, 'verification');
      assert.equal(registry.operationCount, 1);
      assert.equal(registry.runs[0].role, 'main-verifier');
      assert.equal(registry.runs[0].status, 'failed');
      assert.equal(registry.runs[0].runResult.gatePassed, false);
      assert.equal(registry.runs[0].runResult.commandResults[0].command, 'git diff --check');
      assert.equal(registry.runs[0].artifactRefs[0].kind, 'operation-registry');
      assert.equal(registry.runs[0].verifierSummary.passed, false);
    } finally {
      await rm(stateDir, {
        recursive: true,
        force: true
      });
    }
  });
});
