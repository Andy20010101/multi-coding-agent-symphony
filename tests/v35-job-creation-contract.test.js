import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildJobCreationContract,
  validateJobCreationContract
} from '../src/symphony/job-creation-contract.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';

const FIXED_TIME = '2026-06-03T00:00:00.000Z';
const V35_GOAL_ID = 'v35-job-queue-run-control-workspace';

describe('v35 job-creation.v1 contract', () => {
  it('validates the fixture and rejects execution and write boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    assert.deepEqual(validateJobCreationContract(fixture), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.boundaries.jobExecutionAvailable = true;
    drift.boundaries.actionExecutionAvailable = true;
    drift.plan.jobExecutionAvailable = true;

    const errors = validateJobCreationContract(drift).errors;

    assert.equal(errors.includes('boundaries.jobExecutionAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.actionExecutionAvailable must be false'), true);
    assert.equal(errors.includes('plan.jobExecutionAvailable must be false'), true);
  });

  it('rejects job creation boundary drift across all write and execution fields', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const driftFields = [
      'jobExecutionAvailable',
      'actionExecutionAvailable',
      'modelInvocationAvailable',
      'arbitraryCommandExecutionAvailable',
      'arbitraryPathReadAvailable',
      'gitWriteAvailable',
      'mergeAvailable',
      'pushAvailable',
      'tagAvailable',
      'publishAvailable',
      'selfApprovalAvailable',
      'secondArtifactStoreAvailable',
      'createsPersistentJob',
      'writesEventLog',
      'writesQueueState'
    ];

    for (const field of driftFields) {
      const drift = structuredClone(fixture);
      drift.boundaries[field] = true;

      assert.equal(
        validateJobCreationContract(drift).errors.includes(`boundaries.${field} must be false`),
        true,
        `boundaries.${field} must be caught when set to true`
      );
    }
  });

  it('rejects deviation from the locked jobCreationSource value', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const mutations = ['arbitrary-source', 'cli-init', 'frontend-inference', ''];

    for (const mutated of mutations) {
      const drift = structuredClone(fixture);
      drift.boundaries.jobCreationSource = mutated;

      assert.equal(
        validateJobCreationContract(drift).errors.includes('boundaries.jobCreationSource must be action-preview.v1 only'),
        true,
        `boundaries.jobCreationSource must be rejected when set to "${mutated}"`
      );
    }
  });

  it('rejects a job creation contract with drift on readOnly, contractName, contractVersion, and dryRun', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const readOnlyDrift = structuredClone(fixture);
    readOnlyDrift.readOnly = false;

    assert.equal(validateJobCreationContract(readOnlyDrift).errors.includes('readOnly must be true'), true);

    const nameDrift = structuredClone(fixture);
    nameDrift.contractName = 'wrong-contract.v1';

    assert.equal(validateJobCreationContract(nameDrift).errors.includes('contractName must be job-creation.v1'), true);

    const versionDrift = structuredClone(fixture);
    versionDrift.contractVersion = 2;

    assert.equal(validateJobCreationContract(versionDrift).errors.includes('contractVersion must be 1'), true);

    const dryRunDrift = structuredClone(fixture);
    dryRunDrift.plan.dryRun = false;

    assert.equal(validateJobCreationContract(dryRunDrift).errors.includes('plan.dryRun must be true'), true);

    const boundariesDryRunDrift = structuredClone(fixture);
    boundariesDryRunDrift.boundaries.dryRun = false;

    assert.equal(validateJobCreationContract(boundariesDryRunDrift).errors.includes('boundaries.dryRun must be true'), true);
  });

  it('rejects plan drift across all execution, write, and persistence fields', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const planFields = [
      'jobExecutionAvailable',
      'writesEventLog',
      'writesQueueState',
      'createsPersistentJob',
      'createsJobRecord'
    ];

    for (const field of planFields) {
      const drift = structuredClone(fixture);
      drift.plan[field] = true;

      assert.equal(
        validateJobCreationContract(drift).errors.includes(`plan.${field} must be false`),
        true,
        `plan.${field} must be caught when set to true`
      );
    }

    const requiresConfirmationDrift = structuredClone(fixture);
    requiresConfirmationDrift.plan.requiresConfirmation = false;

    assert.equal(
      validateJobCreationContract(requiresConfirmationDrift).errors.includes('plan.requiresConfirmation must be true'),
      true
    );
  });

  it('rejects the premature confirmationContract field in plan', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const drift = structuredClone(fixture);
    drift.plan.confirmationContract = 'job-creation-confirmation.v1';

    assert.equal(
      validateJobCreationContract(drift).errors.includes('plan must not contain confirmationContract — not implemented in task-2'),
      true
    );
  });

  it('rejects an unregistered or unsafe action_id on the job creation context', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const contextDrift = structuredClone(fixture);
    contextDrift.context.actionId = '../unsafe-action';

    assert.equal(validateJobCreationContract(contextDrift).errors.includes('context.actionId must be a safe action id'), true);

    const jobDrift = structuredClone(fixture);
    jobDrift.job.action_id = '../run';

    assert.equal(validateJobCreationContract(jobDrift).errors.includes('job.action_id must be a safe action id'), true);
  });

  it('rejects a job creation contract with non-reference goal_id, task_id, or job_id', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const drift = structuredClone(fixture);
    drift.job.goal_id = '..%2F..%2Fpackage.json';

    assert.equal(validateJobCreationContract(drift).errors.includes('job.goal_id must be a safe ref'), true);
  });

  it('rejects unknown job status and queue_state values', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const statusDrift = structuredClone(fixture);
    statusDrift.job.status = 'unknown-status';

    assert.equal(
      validateJobCreationContract(statusDrift).errors.includes('job.status must be one of queued, running, blocked, failed, passed, cancelled'),
      true
    );

    const queueDrift = structuredClone(fixture);
    queueDrift.job.queue_state = 'unknown-state';

    assert.equal(
      validateJobCreationContract(queueDrift).errors.includes('job.queue_state must be one of action-preview-contract, job-event, job-queue-state, goal-event'),
      true
    );
  });

  it('rejects missing each required source contract individually', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const requiredContracts = [
      'action-manifest.v1',
      'action-availability.v1',
      'action-preview.v1',
      'job-model.v1'
    ];

    for (const required of requiredContracts) {
      const drift = structuredClone(fixture);
      drift.context.sourceContracts = drift.context.sourceContracts.filter((c) => c !== required);

      assert.equal(
        validateJobCreationContract(drift).errors.includes(`context.sourceContracts must include ${required}`),
        true,
        `context.sourceContracts missing ${required} must be rejected`
      );
    }
  });

  it('rejects missing all required source contracts at once', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const drift = structuredClone(fixture);
    drift.context.sourceContracts = ['goal-runbook.v1'];
    const errors = validateJobCreationContract(drift).errors;

    assert.equal(errors.includes('context.sourceContracts must include action-manifest.v1'), true);
    assert.equal(errors.includes('context.sourceContracts must include action-availability.v1'), true);
    assert.equal(errors.includes('context.sourceContracts must include action-preview.v1'), true);
    assert.equal(errors.includes('context.sourceContracts must include job-model.v1'), true);
  });

  it('validates sourceActionPreview structure and rejects drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const missingSap = structuredClone(fixture);
    missingSap.sourceActionPreview = 'not-an-object';

    assert.equal(
      validateJobCreationContract(missingSap).errors.includes('sourceActionPreview must be a plain object'),
      true
    );

    const wrongContract = structuredClone(fixture);
    wrongContract.sourceActionPreview.contractName = 'wrong-preview.v1';

    assert.equal(
      validateJobCreationContract(wrongContract).errors.includes('sourceActionPreview.contractName must be action-preview.v1'),
      true
    );

    const badTimestamp = structuredClone(fixture);
    badTimestamp.sourceActionPreview.generatedAt = 'not-a-date';

    assert.equal(
      validateJobCreationContract(badTimestamp).errors.includes('sourceActionPreview.generatedAt must be an ISO timestamp'),
      true
    );

    const actionIdMismatch = structuredClone(fixture);
    actionIdMismatch.sourceActionPreview.action.action_id = 'goal.review-verdict.record';

    assert.equal(
      validateJobCreationContract(actionIdMismatch).errors.includes('sourceActionPreview.action.action_id must equal context.actionId'),
      true
    );

    const jobActionIdMismatch = structuredClone(fixture);
    jobActionIdMismatch.sourceActionPreview.action.action_id = 'goal.review-verdict.record';
    jobActionIdMismatch.job.action_id = 'goal.worker-evidence.record';

    assert.equal(
      validateJobCreationContract(jobActionIdMismatch).errors.includes('sourceActionPreview.action.action_id must equal job.action_id'),
      true
    );

    const nullActionWithContext = structuredClone(fixture);
    nullActionWithContext.sourceActionPreview.action = null;

    assert.equal(
      validateJobCreationContract(nullActionWithContext).errors.includes('sourceActionPreview.action must be non-null when context.actionId is non-null and no action-level blockers exist'),
      true
    );
  });

  it('rejects fake source preview contract names', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const fakeContractNames = [
      'action-manifest.v1',
      'action-availability.v1',
      'job-model.v1',
      'fake-preview.v1',
      'arbitrary-contract.v2'
    ];

    for (const fakeName of fakeContractNames) {
      const drift = structuredClone(fixture);
      drift.sourceActionPreview.contractName = fakeName;

      assert.equal(
        validateJobCreationContract(drift).errors.includes('sourceActionPreview.contractName must be action-preview.v1'),
        true,
        `sourceActionPreview.contractName "${fakeName}" must be rejected`
      );
    }
  });

  it('rejects queued status when blocker is non-null', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const drift = structuredClone(fixture);
    drift.job.blocker = { reason: 'blocked', requires: 'operator-resolution' };

    assert.equal(
      validateJobCreationContract(drift).errors.includes('job.status must be blocked when job.blocker is non-null'),
      true
    );
  });

  it('rejects blocked status when blocker is null', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const drift = structuredClone(fixture);
    drift.job.status = 'blocked';

    assert.equal(
      validateJobCreationContract(drift).errors.includes('job.blocker must be non-null when job.status is blocked'),
      true
    );
  });

  it('validates warnings and blockers entries have non-empty code, message, and source', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const badWarning = { code: '', message: 'test', source: 'test' };
    const badBlocker = { code: 'test', message: '', source: 'test' };
    const badSource = { code: 'test', message: 'test', source: '' };

    const driftWarnings = structuredClone(fixture);
    driftWarnings.warnings = [badWarning];

    assert.equal(
      validateJobCreationContract(driftWarnings).errors.includes('warnings[0].code must be a non-empty string'),
      true
    );

    const driftBlockers = structuredClone(fixture);
    driftBlockers.blockers = [badBlocker];

    assert.equal(
      validateJobCreationContract(driftBlockers).errors.includes('blockers[0].message must be a non-empty string'),
      true
    );

    const driftSource = structuredClone(fixture);
    driftSource.warnings = [badSource];

    assert.equal(
      validateJobCreationContract(driftSource).errors.includes('warnings[0].source must be a non-empty string'),
      true
    );

    const unsafeSource = structuredClone(fixture);
    unsafeSource.warnings = [{ code: 'test', message: 'test', source: 'not a contract name with spaces' }];

    assert.equal(
      validateJobCreationContract(unsafeSource).errors.includes('warnings[0].source must be a safe source id'),
      true
    );
  });

  it('rejects blockers that are not reflected in the job status and blocker field', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const queuedWithBlockers = structuredClone(fixture);
    queuedWithBlockers.blockers = [{
      code: 'action-not-available',
      message: 'Action is blocked.',
      source: 'action-preview.v1'
    }];

    const errors = validateJobCreationContract(queuedWithBlockers).errors;

    assert.equal(errors.includes('job.status must be blocked when blockers are present'), true);
    assert.equal(errors.includes('job.blocker must be non-null when blockers are present'), true);

    const blockedWithoutJobBlocker = structuredClone(queuedWithBlockers);
    blockedWithoutJobBlocker.job.status = 'blocked';

    assert.equal(
      validateJobCreationContract(blockedWithoutJobBlocker).errors.includes('job.blocker must be non-null when blockers are present'),
      true
    );
  });

  it('returns validation errors instead of throwing when context or job is malformed', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const missingContext = structuredClone(fixture);
    missingContext.context = null;

    assert.doesNotThrow(() => validateJobCreationContract(missingContext));
    assert.equal(validateJobCreationContract(missingContext).errors.includes('context must be a plain object'), true);

    const missingJob = structuredClone(fixture);
    missingJob.job = null;

    assert.doesNotThrow(() => validateJobCreationContract(missingJob));
    assert.equal(validateJobCreationContract(missingJob).errors.includes('job must be a plain object'), true);
  });

  it('accepts a blocked fixture with matching blocker and status', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    const blockedFixture = structuredClone(fixture);
    blockedFixture.job.status = 'blocked';
    blockedFixture.job.blocker = {
      reason: 'Action not found in preview.',
      requires: 'operator-resolution'
    };
    blockedFixture.blockers.push({
      code: 'action-not-in-preview',
      message: 'Action not found in preview.',
      source: 'action-preview.v1'
    });
    blockedFixture.sourceActionPreview.action = null;

    assert.deepEqual(validateJobCreationContract(blockedFixture), {
      ok: true,
      errors: []
    });
  });

  it('serves the Workbench job creation route and rejects unsupported query parameters', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const creationResponse = await fetch(
        `${baseUrl}/api/jobs/create?goal=v35-job-queue-run-control-workspace&task=task-2&action=goal.worker-evidence.record`
      );
      const invalidResponse = await fetch(
        `${baseUrl}/api/jobs/create?command=run&path=package.json`
      );
      const unsafeGoalResponse = await fetch(
        `${baseUrl}/api/jobs/create?goal=..%2F..%2Fx&action=goal.worker-evidence.record`
      );
      const unsafeActionResponse = await fetch(
        `${baseUrl}/api/jobs/create?goal=v35-job-queue-run-control-workspace&action=..%2Frun`
      );
      const missingActionResponse = await fetch(
        `${baseUrl}/api/jobs/create?goal=v35-job-queue-run-control-workspace&task=task-2`
      );
      const postResponse = await fetch(`${baseUrl}/api/jobs/create`, { method: 'POST' });

      assert.equal(creationResponse.status, 200);
      assert.equal(invalidResponse.status, 400);
      assert.equal(unsafeGoalResponse.status, 400);
      assert.equal(unsafeActionResponse.status, 400);
      assert.equal(missingActionResponse.status, 400);
      assert.equal(postResponse.status, 405);

      const jobCreation = await creationResponse.json();

      assert.deepEqual(validateJobCreationContract(jobCreation), {
        ok: true,
        errors: []
      });
      assert.equal(jobCreation.context.goalId, V35_GOAL_ID);
      assert.equal(jobCreation.context.taskId, 'task-2');
      assert.equal(jobCreation.context.actionId, 'goal.worker-evidence.record');
      assert.equal(jobCreation.plan.dryRun, true);
      assert.equal(jobCreation.plan.jobExecutionAvailable, false);
      assert.equal(jobCreation.plan.createsPersistentJob, false);
      assert.equal(jobCreation.plan.writesEventLog, false);
      assert.equal(jobCreation.plan.writesQueueState, false);
      assert.equal(jobCreation.boundaries.jobExecutionAvailable, false);
      assert.equal(jobCreation.boundaries.jobCreationSource, 'action-preview.v1 only');
      assert.equal((await invalidResponse.json()).error.code, 'invalid-job-creation-request');
      assert.equal((await unsafeGoalResponse.json()).error.code, 'invalid-job-creation-request');
      assert.equal((await unsafeActionResponse.json()).error.code, 'invalid-job-creation-request');
      assert.equal((await missingActionResponse.json()).error.code, 'invalid-job-creation-request');
      assert.equal((await postResponse.json()).error.code, 'method-not-allowed');
    } finally {
      await closeServer(server);
    }
  });

  it('rejects POST method for the job creation route', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const response = await fetch(`${baseUrl}/api/jobs/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'goal.worker-evidence.record' })
      });

      assert.equal(response.status, 405);
      const body = await response.json();

      assert.equal(body.error.code, 'method-not-allowed');
    } finally {
      await closeServer(server);
    }
  });

  it('preserves the existing job model and action registry contracts alongside the new job creation contract', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const manifestResponse = await fetch(`${baseUrl}/api/actions/manifest?goal=v34-action-registry-workspace&task=task-1`);
      const availabilityResponse = await fetch(`${baseUrl}/api/actions/availability?goal=v34-action-registry-workspace&task=task-1`);
      const previewResponse = await fetch(`${baseUrl}/api/actions/preview?goal=v34-action-registry-workspace&task=task-1&action=goal.worker-evidence.record`);
      const jobResponse = await fetch(`${baseUrl}/api/jobs?goal=v35-job-queue-run-control-workspace&task=task-2`);
      const creationResponse = await fetch(`${baseUrl}/api/jobs/create?goal=v35-job-queue-run-control-workspace&task=task-2&action=goal.worker-evidence.record`);

      assert.equal(manifestResponse.status, 200);
      assert.equal(availabilityResponse.status, 200);
      assert.equal(previewResponse.status, 200);
      assert.equal(jobResponse.status, 200);
      assert.equal(creationResponse.status, 200);

      const manifest = await manifestResponse.json();
      const jobModel = await jobResponse.json();
      const jobCreation = await creationResponse.json();

      assert.equal(manifest.contractName, 'action-manifest.v1');
      assert.equal(jobModel.contractName, 'job-model.v1');
      assert.equal(jobCreation.contractName, 'job-creation.v1');
      assert.equal(jobCreation.context.sourceContracts.includes('action-manifest.v1'), true);
      assert.equal(jobCreation.context.sourceContracts.includes('action-availability.v1'), true);
      assert.equal(jobCreation.context.sourceContracts.includes('action-preview.v1'), true);
      assert.equal(jobCreation.context.sourceContracts.includes('job-model.v1'), true);
      assert.equal(jobCreation.plan.dryRun, true);
      assert.equal(jobCreation.job.queue_state, 'action-preview-contract');
    } finally {
      await closeServer(server);
    }
  });

  it('rejects building job creation with an unsafe actionId argument', async () => {
    await assert.rejects(
      buildJobCreationContract({
        goalId: V35_GOAL_ID,
        taskId: 'task-2',
        actionId: '../unsafe',
        generatedAt: FIXED_TIME
      }),
      /safe action id/
    );
  });
});

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
