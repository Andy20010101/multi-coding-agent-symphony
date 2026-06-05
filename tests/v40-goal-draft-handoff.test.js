import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildGoalDraftHandoffContract,
  validateGoalDraftHandoffContract
} from '../src/symphony/goal-draft-handoff.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';

const V40_GOAL_ID = 'v40-personal-workflow-router-app-core-release';
const V40_RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.v40-personal-workflow-router-app-core-release.v1.json';

describe('v40 goal-draft-handoff.v1 contract', () => {
  it('builds a draft-only handoff from a registered runbook task', async () => {
    const stateDir = await registerV40GoalFixture();

    try {
      const handoff = await buildGoalDraftHandoffContract({
        stateDir,
        goalId: V40_GOAL_ID,
        taskId: 'task-3',
        generatedAt: '2026-06-02T00:00:00.000Z'
      });

      assert.deepEqual(validateGoalDraftHandoffContract(handoff), {
        ok: true,
        errors: []
      });
      assert.equal(handoff.context.goalId, V40_GOAL_ID);
      assert.equal(handoff.context.taskId, 'task-3');
      assert.equal(handoff.routing.category, 'workbench-goal');
      assert.equal(handoff.goalDraft.state, 'draft-ready');
      assert.equal(handoff.goalDraft.registrationState, 'not-registered');
      assert.equal(handoff.runbookDraft.draftOnly, true);
      assert.equal(handoff.runbookDraft.autoRegister, false);
      assert.equal(handoff.handoff.copyOnlyCommands[0].includes('--dry-run --json'), true);
      assert.equal(handoff.endpoint.writesInPreview, false);
      assert.equal(handoff.endpoint.registersGoal, false);
      assert.equal(handoff.boundaries.writesFiles, false);
      assert.equal(handoff.boundaries.registersGoal, false);
      assert.equal(handoff.boundaries.runsGoalInit, false);
      assert.equal(handoff.boundaries.modelInvocationAvailable, false);
      assert.equal(handoff.boundaries.selfApprovalAvailable, false);
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  });

  it('rejects drift that would register a goal or write during preview', async () => {
    const stateDir = await registerV40GoalFixture();

    try {
      const handoff = await buildGoalDraftHandoffContract({
        stateDir,
        goalId: V40_GOAL_ID,
        taskId: 'task-3',
        generatedAt: '2026-06-02T00:00:00.000Z'
      });
      const drift = structuredClone(handoff);

      drift.runbookDraft.autoRegister = true;
      drift.endpoint.writesInPreview = true;
      drift.boundaries.registersGoal = true;

      const errors = validateGoalDraftHandoffContract(drift).errors;

      assert.equal(errors.includes('runbookDraft.autoRegister must be false'), true);
      assert.equal(errors.includes('endpoint.writesInPreview must be false'), true);
      assert.equal(errors.includes('boundaries.registersGoal must be false'), true);
    } finally {
      await rm(stateDir, { recursive: true, force: true });
    }
  });

  it('serves the Workbench route and rejects unsupported request fields', async () => {
    const stateDir = await registerV40GoalFixture();
    const server = createSymphonyConsoleServer({ stateDir });
    const baseUrl = await listenOnRandomPort(server);

    try {
      const handoffResponse = await fetch(`${baseUrl}/api/workflows/goal-draft-handoff?goal=${V40_GOAL_ID}&task=task-3`);
      const invalidResponse = await fetch(`${baseUrl}/api/workflows/goal-draft-handoff?prompt=make%20goal`);
      const unsafeResponse = await fetch(`${baseUrl}/api/workflows/goal-draft-handoff?goal=..%2Frepo`);
      const postResponse = await fetch(`${baseUrl}/api/workflows/goal-draft-handoff`, { method: 'POST' });

      assert.equal(handoffResponse.status, 200);
      assert.equal(invalidResponse.status, 400);
      assert.equal(unsafeResponse.status, 400);
      assert.equal(postResponse.status, 405);

      const handoff = await handoffResponse.json();

      assert.deepEqual(validateGoalDraftHandoffContract(handoff), {
        ok: true,
        errors: []
      });
      assert.equal(handoff.context.taskId, 'task-3');
      assert.equal((await invalidResponse.json()).error.code, 'invalid-goal-draft-handoff-request');
      assert.equal((await unsafeResponse.json()).error.code, 'invalid-goal-draft-handoff-request');
      assert.equal((await postResponse.json()).error.code, 'method-not-allowed');
    } finally {
      await closeServer(server);
      await rm(stateDir, { recursive: true, force: true });
    }
  });
});

async function registerV40GoalFixture() {
  const stateDir = await mkdtemp(join(tmpdir(), 'symphony-v40-goal-draft-handoff-'));
  const plan = await buildGoalRunbookInitPlan({
    stateDir,
    goalId: V40_GOAL_ID,
    fromJson: V40_RUNBOOK_FIXTURE
  });

  await confirmGoalRunbookInit({
    stateDir,
    goalId: V40_GOAL_ID,
    fromJson: V40_RUNBOOK_FIXTURE,
    planHash: plan.planHash
  });

  return stateDir;
}

async function listenOnRandomPort(server) {
  await new Promise((resolveListen) => {
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();

  return `http://${address.address}:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolveClose) => {
    server.close(resolveClose);
  });
}
