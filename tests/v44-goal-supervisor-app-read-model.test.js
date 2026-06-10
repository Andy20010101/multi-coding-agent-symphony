import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  GOAL_SUPERVISOR_APP_COMMAND_BOUNDARY_DEFAULT,
  GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
  buildGoalSupervisorAppReadModel
} from '../src/symphony/goal-supervisor/index.js';

const FIXTURE_PATH = new URL('../fixtures/contracts/goal-supervisor/app-read-model.v44-3.pr1.v1.json', import.meta.url);

describe('v44.3 goal supervisor app read model contract', () => {
  it('renders every required app-facing object without raw transcript text', async () => {
    const fixture = await readFixture();

    for (const scenario of fixture.scenarios) {
      const model = buildGoalSupervisorAppReadModel({
        ...scenario.input,
        nowMs: Date.parse(fixture.nowUtc),
        progressGraceMs: fixture.progressGraceMs,
        releaseGates: fixture.releaseGates
      });

      assert.equal(model.contractName, GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME, scenario.name);
      assert.equal(model.readOnly, true, scenario.name);
      assert.equal(model.willMutate, false, scenario.name);
      assertTopLevelContract(model, scenario.name);
      assertNoRawTranscriptFields(model, scenario.name);
      assert.equal(model.recommendedNextAction.actionId, scenario.expected.recommendedNextActionId, scenario.name);
      assert.equal(model.commandBoundary.state, scenario.expected.commandBoundaryState, scenario.name);
      assert.equal(model.pendingResult.status, scenario.expected.pendingResultStatus, scenario.name);
      assert.equal(model.contextStatus.transcriptAvailability, scenario.expected.transcriptAvailability, scenario.name);
    }
  });

  it('keeps command execution disabled by default with all blocked families named', () => {
    const model = buildGoalSupervisorAppReadModel();

    assert.deepEqual(model.commandBoundary, GOAL_SUPERVISOR_APP_COMMAND_BOUNDARY_DEFAULT);
    assert.equal(model.commandBoundary.executionAvailable, false);
    assert.equal(model.commandBoundary.copyOnly, true);
    assert.ok(model.commandBoundary.blockedCommandFamilies.includes('provider-cli'));
    assert.ok(model.commandBoundary.blockedCommandFamilies.includes('release-closeout'));
  });

  it('describes dry-run and confirm-required previews without enabling execution', async () => {
    const fixture = await readFixture();
    const dryRun = fixture.scenarios.find((scenario) => scenario.name === 'dry-run command preview');
    const confirm = fixture.scenarios.find((scenario) => scenario.name === 'confirm-required command preview');
    const dryRunModel = buildGoalSupervisorAppReadModel({
      ...dryRun.input,
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs,
      releaseGates: fixture.releaseGates
    });
    const confirmModel = buildGoalSupervisorAppReadModel({
      ...confirm.input,
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs,
      releaseGates: fixture.releaseGates
    });

    assert.equal(dryRunModel.commandBoundary.state, 'dry-run');
    assert.equal(dryRunModel.commandBoundary.executionAvailable, false);
    assert.equal(dryRunModel.commandBoundary.copyOnly, true);
    assert.match(dryRunModel.commandBoundary.safeCommandPreview, /goal dispatch task-1 worker --fresh-controller/u);
    assert.equal(confirmModel.commandBoundary.state, 'confirm-required');
    assert.equal(confirmModel.commandBoundary.executionAvailable, false);
    assert.deepEqual(confirmModel.recommendedNextAction.requiredConfirmationFields, [
      'planHash',
      'goalId',
      'taskId',
      'actor',
      'evidenceRef',
      'reason'
    ]);
  });
});

async function readFixture() {
  return JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
}

function assertTopLevelContract(model, label) {
  for (const field of [
    'goalSnapshot',
    'goalTimeline',
    'activeLease',
    'pendingResult',
    'currentGate',
    'recommendedNextAction',
    'ownership',
    'contextStatus',
    'commandBoundary'
  ]) {
    assert.equal(typeof model[field], 'object', `${label}: ${field}`);
    assert.notEqual(model[field], null, `${label}: ${field}`);
  }

  assert.equal(model.ownership.orchestrationOwner, 'local-goal-supervisor-daemon', label);
  assert.equal(model.ownership.deliveryBoundary, 'pull-request', label);
  assert.equal(model.commandBoundary.executionAvailable, false, label);
}

function assertNoRawTranscriptFields(value, label) {
  const serialized = JSON.stringify(value);
  assert.equal(serialized.includes('latestResultText'), false, label);
  assert.equal(serialized.includes('rawTranscript'), false, label);
  assert.equal(serialized.includes('agentMessage'), false, label);
}
