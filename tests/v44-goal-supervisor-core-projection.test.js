import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  GOAL_SUPERVISOR_CORE_PROJECTION_CONTRACT_NAME,
  GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA,
  buildGoalSupervisorCoreProjection
} from '../src/symphony/goal-supervisor/index.js';

const FIXTURE_PATH = new URL('../fixtures/contracts/goal-supervisor/core-projection.v44.replay.v1.json', import.meta.url);

describe('v44 goal supervisor core projection', () => {
  it('renders read-only route and progress state from managed inputs', async () => {
    const fixture = await readFixture();
    const scenario = fixture.pendingEscrowScenario;
    const projection = buildGoalSupervisorCoreProjection({
      state: scenario.state,
      goalNext: scenario.goalNext,
      threadRead: scenario.threadRead,
      escrow: scenario.escrow,
      expected: scenario.expectedResultContext,
      releaseGates: fixture.releaseGates,
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs,
      externalRunnerPath: fixture.externalRunnerPath
    });

    assert.equal(projection.contractName, GOAL_SUPERVISOR_CORE_PROJECTION_CONTRACT_NAME);
    assert.equal(projection.readOnly, true);
    assert.equal(projection.willMutate, false);
    assert.equal(projection.route.state, 'pending-result');
    assert.equal(projection.route.action.kind, 'register-recorded-result');
    assert.equal(projection.progress.state, 'pending-result');
    assert.equal(projection.progress, projection.route.progress);
    assert.equal(projection.routeInput.reason, 'valid-escrow-result-preferred-before-thread-read');
    assert.equal(projection.routeInput.thread.status, 'notLoaded');
    assert.equal(projection.route.pendingResult.result.eventToRegister, 'worker.evidence-recorded');
  });

  it('keeps migration handoff and rollback guidance tied to the temporary runner', async () => {
    const fixture = await readFixture();
    const projection = buildGoalSupervisorCoreProjection({
      state: fixture.completeScenario.state,
      goalNext: fixture.completeScenario.goalNext,
      nowMs: Date.parse(fixture.nowUtc),
      externalRunnerPath: fixture.externalRunnerPath
    });

    assert.equal(projection.route.state, 'complete');
    assert.equal(projection.progress.state, 'complete');
    assert.equal(projection.migrationHandoff.temporaryExternalRunner.path, fixture.externalRunnerPath);
    assert.equal(projection.migrationHandoff.temporaryExternalRunner.operationalFallback, true);
    assert.equal(
      projection.migrationHandoff.temporaryExternalRunner.rollbackAction,
      `continue using ${fixture.externalRunnerPath}`
    );
    assert.match(projection.migrationHandoff.rollbackGuidance, /disagrees with live behavior/);
    assert.match(projection.migrationHandoff.rollbackGuidance, /continue using the temporary external runner/);
    assert.ok(projection.migrationHandoff.repositoryOwnedAfterV44.includes('route-progress-projection'));
    assert.ok(projection.migrationHandoff.repositoryOwnedAfterV44.includes('recorded-result-intake-projection'));
    assert.ok(projection.migrationHandoff.repositoryOwnedAfterV44.includes('release-policy-model'));
    assert.ok(projection.migrationHandoff.remainsExternalAfterV44.includes('daemon-launcher-and-pty-process-ownership'));
    assert.ok(projection.migrationHandoff.remainsExternalAfterV44.includes('provider-cli-execution'));
    assert.ok(projection.migrationHandoff.remainsExternalAfterV44.includes('github-release-automation'));
    assert.ok(projection.migrationHandoff.remainsExternalAfterV44.includes('release-closeout-execution-automation'));
    assertNoExecutableRunnerFields(projection.migrationHandoff.temporaryExternalRunner);
    assert.equal(projection.boundaries.liveDaemonOwner, false);
    assert.equal(projection.boundaries.liveManagedGoalAppend, false);
  });

  it('blocks release closeout projection without operator authorization', async () => {
    const fixture = await readFixture();
    const projection = buildGoalSupervisorCoreProjection({
      state: fixture.releaseBlockedScenario.state,
      goalNext: fixture.releaseBlockedScenario.goalNext,
      allowCloseout: false,
      nowMs: Date.parse(fixture.nowUtc)
    });

    assert.equal(projection.route.state, 'blocked');
    assert.equal(projection.route.reason, 'release-closeout-requires-operator-authorization');
    assert.equal(projection.boundaries.releaseCloseoutWithoutOperatorAuthorization, false);
    assert.equal(projection.boundaries.tagPushPublishAutomation, false);
    assert.ok(projection.migrationHandoff.remainsExternalAfterV44.includes('tag-push-publish-release-automation'));
  });

  it('keeps handoff metadata descriptor read-only and metadata-only', () => {
    assert.equal(GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA.readOnly, true);
    assert.equal(GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA.willMutate, false);
    assert.equal(Object.isFrozen(GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA), true);
    assert.equal(Object.isFrozen(GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA.remainsExternalAfterV44), true);
    assert.throws(
      () => GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA.remainsExternalAfterV44.push('new-external-surface'),
      TypeError
    );
    assertNoExecutableRunnerFields(GOAL_SUPERVISOR_CORE_PROJECTION_HANDOFF_METADATA.temporaryExternalRunner);
  });
});

async function readFixture() {
  return JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
}

function assertNoExecutableRunnerFields(runnerMetadata) {
  for (const field of ['adapter', 'args', 'command', 'doctorCommand', 'execute', 'launcher']) {
    assert.equal(Object.hasOwn(runnerMetadata, field), false);
  }
}
