import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runSymphonyCli } from '../scripts/symphony.js';
import {
  GOAL_SUPERVISOR_APP_COMMAND_BOUNDARY_DEFAULT,
  GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME,
  buildGoalSupervisorAppReadModel,
  buildGoalSupervisorAppReadModelFromContracts
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

  it('composes existing goal contracts and supervisor observability into one read model', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v44-supervisor-model-'));

    try {
      const model = await buildGoalSupervisorAppReadModelFromContracts({
        stateDir: join(root, '.symphony'),
        goalId: 'v19-fixture',
        generatedAt: '2026-06-10T00:00:00.000Z'
      });

      assert.equal(model.contractName, GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME);
      assert.equal(model.generatedAt, '2026-06-10T00:00:00.000Z');
      assert.equal(model.goalSnapshot.goalId, 'v19-fixture');
      assert.equal(model.goalSnapshot.totalTaskCount, 2);
      assert.deepEqual(model.goalSnapshot.sourceContracts, [
        'goal-runbook.v1',
        'goal-event-log.v1',
        'goal-progress-ledger.v1',
        'goal-next-action.v1',
        'goal-supervisor-core-projection.v1',
        'goal-supervisor-observability.v1'
      ]);
      assert.equal(model.recommendedNextAction.actionId, 'open-handoff-thread');
      assert.equal(model.commandBoundary.state, 'disabled');
      assert.equal(model.commandBoundary.executionAvailable, false);
      assert.equal(model.ownership.orchestrationOwner, 'local-goal-supervisor-daemon');
      assert.equal(model.ownership.deliveryBoundary, 'pull-request');
      assertNoRawTranscriptFields(model, 'pipeline');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('prints the app read model through supervisor status as JSON only', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v44-supervisor-cli-'));
    const output = createOutput();

    try {
      const exitCode = await runSymphonyCli({
        argv: [
          'supervisor',
          'status',
          '--state-dir',
          join(root, '.symphony'),
          '--goal',
          'v19-fixture',
          '--json'
        ],
        stdout: output.stdout,
        stderr: output.stderr
      });
      const model = JSON.parse(output.stdoutText());

      assert.equal(exitCode, 0);
      assert.equal(output.stderrText(), '');
      assert.equal(model.contractName, GOAL_SUPERVISOR_APP_READ_MODEL_CONTRACT_NAME);
      assert.equal(model.goalSnapshot.goalId, 'v19-fixture');
      assert.equal(model.commandBoundary.executionAvailable, false);
      assert.equal(model.commandBoundary.copyOnly, true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
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

function createOutput() {
  let stdoutText = '';
  let stderrText = '';

  return {
    stdout: {
      write(chunk) {
        stdoutText += String(chunk);
      }
    },
    stderr: {
      write(chunk) {
        stderrText += String(chunk);
      }
    },
    stdoutText() {
      return stdoutText;
    },
    stderrText() {
      return stderrText;
    }
  };
}
