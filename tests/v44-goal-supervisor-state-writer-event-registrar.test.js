import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildGoalSupervisorEventRegistrarPreview,
  buildGoalSupervisorStateWriterPreview
} from '../src/symphony/goal-supervisor/index.js';

const FIXTURE_PATH = new URL('../fixtures/contracts/goal-supervisor/state-writer-event-registrar.v44.replay.v1.json', import.meta.url);

describe('v44 goal supervisor state writer and event registrar preview', () => {
  it('builds a dry-run-only worker event registration preview with the exact target event', async () => {
    const fixture = await readFixture();
    const preview = await buildGoalSupervisorStateWriterPreview({
      stateDir: fixture.stateDir,
      result: fixture.workerResult,
      releaseGates: fixture.releaseGates
    });

    assert.equal(preview.readOnly, true);
    assert.equal(preview.willMutate, false);
    assert.equal(preview.writer.singleWriter, true);
    assert.equal(preview.status, 'preview');
    assert.deepEqual(preview.refusalReasons, []);
    assert.equal(preview.eventRegistrar.targetEvent.goalId, fixture.goalId);
    assert.equal(preview.eventRegistrar.targetEvent.taskId, 'task-4');
    assert.equal(preview.eventRegistrar.targetEvent.eventType, 'worker.evidence-recorded');
    assert.equal(preview.eventRegistrar.targetEvent.actor.id, 'local-goal-supervisor-worker');
    assert.equal(preview.eventRegistrar.targetEvent.evidenceRefs[0].ref, fixture.workerResult.evidenceRef);
    assert.equal(preview.eventRegistrar.targetEvent.branch, fixture.workerResult.branch);
    assert.equal(preview.eventRegistrar.targetEvent.commit, fixture.workerResult.headCommit);
    assert.equal(preview.eventRegistrar.eventPlan.wouldAppend.writesInDryRun, false);
    assert.equal(preview.eventRegistrar.eventPlan.confirm.executorAvailable, false);
    assert.equal(preview.boundaries.liveManagedGoalAppendIntroduced, false);
  });

  it('treats an existing event with a matching registration audit as a trusted registration', async () => {
    const fixture = await readFixture();
    const preview = await buildGoalSupervisorEventRegistrarPreview({
      stateDir: fixture.stateDir,
      result: fixture.workerResult,
      goalEvents: [fixture.matchingGoalEvent],
      registrationAudits: [fixture.matchingRegistrationAudit],
      releaseGates: fixture.releaseGates
    });

    assert.equal(preview.status, 'trusted-registration');
    assert.equal(preview.reason, 'matching-goal-event-and-registration-audit');
    assert.equal(preview.targetEvent.eventId, fixture.matchingGoalEvent.eventId);
    assert.equal(preview.registrationAudit.matched, true);
    assert.equal(preview.eventPlan, null);
    assert.deepEqual(preview.refusalReasons, []);
  });

  it('refuses an existing event when the single-writer registration audit is missing', async () => {
    const fixture = await readFixture();
    const preview = await buildGoalSupervisorEventRegistrarPreview({
      stateDir: fixture.stateDir,
      result: fixture.workerResult,
      goalEvents: [fixture.matchingGoalEvent],
      registrationAudits: [],
      releaseGates: fixture.releaseGates
    });

    assert.equal(preview.status, 'refused');
    assert.equal(preview.reason, 'missing-registration-audit');
    assert.deepEqual(preview.refusalReasons, ['missing-registration-audit']);
    assert.equal(preview.targetEvent.eventType, 'worker.evidence-recorded');
    assert.equal(preview.eventPlan, null);
  });

  it('refuses unsafe write requests instead of exposing a live append path', async () => {
    const fixture = await readFixture();
    const preview = await buildGoalSupervisorStateWriterPreview({
      stateDir: fixture.stateDir,
      result: fixture.workerResult,
      requestedMode: 'confirm',
      releaseGates: fixture.releaseGates
    });

    assert.equal(preview.status, 'refused');
    assert.equal(preview.reason, 'unsafe-write-requested');
    assert.deepEqual(preview.refusalReasons, ['unsafe-write-requested']);
    assert.equal(preview.eventRegistrar.eventPlan, null);
    assert.equal(preview.boundaries.confirmExecutorAvailable, false);
    assert.equal(preview.boundaries.liveManagedGoalAppendIntroduced, false);
  });

  it('refuses release readiness previews without explicit closeout authorization', async () => {
    const fixture = await readFixture();
    const preview = await buildGoalSupervisorEventRegistrarPreview({
      stateDir: fixture.stateDir,
      result: fixture.releaseReadyResult,
      allowCloseout: false,
      releaseGates: fixture.releaseGates
    });

    assert.equal(preview.status, 'refused');
    assert.equal(preview.reason, 'release-closeout-not-authorized');
    assert.deepEqual(preview.refusalReasons, ['release-closeout-not-authorized']);
    assert.equal(preview.eventPlan, null);
  });
});

async function readFixture() {
  return JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
}
