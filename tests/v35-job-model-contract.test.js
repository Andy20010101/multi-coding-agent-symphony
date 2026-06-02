import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildJobModelContract,
  validateJobModelContract
} from '../src/symphony/job-model-contract.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';

const FIXED_TIME = '2026-06-02T00:00:00.000Z';
const V35_GOAL_ID = 'v35-job-queue-run-control-workspace';

describe('v35 job-model.v1 contract', () => {
  it('validates the fixture and rejects execution and write boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-model.v1.json', 'utf8'));

    assert.deepEqual(validateJobModelContract(fixture), {
      ok: true,
      errors: []
    });

    assert.deepEqual(validateJobModelContract(buildJobModelContract({
      projectId: null,
      goalId: V35_GOAL_ID,
      taskId: 'task-1',
      actionId: 'goal.worker-evidence.record',
      generatedAt: FIXED_TIME
    })), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.boundaries.jobExecutionAvailable = true;
    drift.boundaries.actionExecutionAvailable = true;

    assert.equal(validateJobModelContract(drift).errors.includes('boundaries.jobExecutionAvailable must be false'), true);
    assert.equal(validateJobModelContract(drift).errors.includes('boundaries.actionExecutionAvailable must be false'), true);
  });

  it('rejects job model boundary drift across all write and execution fields', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-model.v1.json', 'utf8'));

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
      'secondArtifactStoreAvailable'
    ];

    for (const field of driftFields) {
      const drift = structuredClone(fixture);
      drift.boundaries[field] = true;

      assert.equal(
        validateJobModelContract(drift).errors.includes(`boundaries.${field} must be false`),
        true,
        `boundaries.${field} must be caught when set to true`
      );
    }
  });

  it('rejects deviation from the locked jobCreationSource value', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-model.v1.json', 'utf8'));

    const mutations = [
      'arbitrary-source',
      'cli-init',
      'frontend-inference',
      ''
    ];

    for (const mutated of mutations) {
      const drift = structuredClone(fixture);
      drift.boundaries.jobCreationSource = mutated;

      assert.equal(
        validateJobModelContract(drift).errors.includes('boundaries.jobCreationSource must be action-preview.v1 only'),
        true,
        `boundaries.jobCreationSource must be rejected when set to "${mutated}"`
      );
    }
  });

  it('rejects a job model with drift on readOnly, contractName, and contractVersion', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-model.v1.json', 'utf8'));

    const readOnlyDrift = structuredClone(fixture);
    readOnlyDrift.readOnly = false;

    assert.equal(validateJobModelContract(readOnlyDrift).errors.includes('readOnly must be true'), true);

    const nameDrift = structuredClone(fixture);
    nameDrift.contractName = 'wrong-contract.v1';

    assert.equal(validateJobModelContract(nameDrift).errors.includes('contractName must be job-model.v1'), true);

    const versionDrift = structuredClone(fixture);
    versionDrift.contractVersion = 2;

    assert.equal(validateJobModelContract(versionDrift).errors.includes('contractVersion must be 1'), true);
  });

  it('rejects an unregistered or unsafe action_id on the job model', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-model.v1.json', 'utf8'));

    const invalidActionDrift = structuredClone(fixture);
    invalidActionDrift.context.actionId = '../unsafe-action';

    assert.equal(validateJobModelContract(invalidActionDrift).errors.includes('context.actionId must be a safe action id'), true);

    const jobActionDrift = structuredClone(fixture);
    jobActionDrift.job.action_id = '../run';

    assert.equal(validateJobModelContract(jobActionDrift).errors.includes('job.action_id must be a safe action id'), true);
  });

  it('rejects a job model with non-reference project_id, goal_id, task_id, or job_id', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-model.v1.json', 'utf8'));

    const drift = structuredClone(fixture);
    drift.job.goal_id = '..%2F..%2Fpackage.json';

    assert.equal(validateJobModelContract(drift).errors.includes('job.goal_id must be a safe ref'), true);
  });

  it('rejects unknown job status and queue_state values', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-model.v1.json', 'utf8'));

    const statusDrift = structuredClone(fixture);
    statusDrift.job.status = 'unknown-status';

    assert.equal(
      validateJobModelContract(statusDrift).errors.includes('job.status must be one of queued, running, blocked, failed, passed, cancelled'),
      true
    );

    const queueDrift = structuredClone(fixture);
    queueDrift.job.queue_state = 'unknown-state';

    assert.equal(
      validateJobModelContract(queueDrift).errors.includes('job.queue_state must be one of action-preview-contract, job-event, job-queue-state, goal-event'),
      true
    );
  });

  it('rejects missing v34 Action Registry source contracts', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-model.v1.json', 'utf8'));

    const requiredContracts = ['action-manifest.v1', 'action-availability.v1', 'action-preview.v1'];

    for (const required of requiredContracts) {
      const drift = structuredClone(fixture);
      drift.context.sourceContracts = drift.context.sourceContracts.filter((c) => c !== required);

      assert.equal(
        validateJobModelContract(drift).errors.includes(`context.sourceContracts must include ${required}`),
        true,
        `context.sourceContracts missing ${required} must be rejected`
      );
    }

    const drift = structuredClone(fixture);
    drift.context.sourceContracts = ['goal-runbook.v1'];
    const errors = validateJobModelContract(drift).errors;

    assert.equal(errors.includes('context.sourceContracts must include action-manifest.v1'), true);
    assert.equal(errors.includes('context.sourceContracts must include action-availability.v1'), true);
    assert.equal(errors.includes('context.sourceContracts must include action-preview.v1'), true);
  });

  it('serves the Workbench job model route and rejects unsupported query parameters', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const jobResponse = await fetch(`${baseUrl}/api/jobs?goal=v35-job-queue-run-control-workspace&task=task-1`);
      const invalidResponse = await fetch(`${baseUrl}/api/jobs?command=run&path=package.json`);
      const unsafeGoalResponse = await fetch(`${baseUrl}/api/jobs?goal=..%2F..%2Fx`);
      const unsafeTaskResponse = await fetch(`${baseUrl}/api/jobs?task=..%2Ftask`);
      const postResponse = await fetch(`${baseUrl}/api/jobs`, { method: 'POST' });

      assert.equal(jobResponse.status, 200);
      assert.equal(invalidResponse.status, 400);
      assert.equal(unsafeGoalResponse.status, 400);
      assert.equal(unsafeTaskResponse.status, 400);
      assert.equal(postResponse.status, 405);

      const jobModel = await jobResponse.json();

      assert.deepEqual(validateJobModelContract(jobModel), {
        ok: true,
        errors: []
      });
      assert.equal(jobModel.context.goalId, V35_GOAL_ID);
      assert.equal(jobModel.context.taskId, 'task-1');
      assert.equal(jobModel.boundaries.jobExecutionAvailable, false);
      assert.equal(jobModel.boundaries.actionExecutionAvailable, false);
      assert.equal(jobModel.boundaries.jobCreationSource, 'action-preview.v1 only');
      assert.equal((await invalidResponse.json()).error.code, 'invalid-job-model-request');
      assert.equal((await unsafeGoalResponse.json()).error.code, 'invalid-job-model-request');
      assert.equal((await unsafeTaskResponse.json()).error.code, 'invalid-job-model-request');
      assert.equal((await postResponse.json()).error.code, 'method-not-allowed');
    } finally {
      await closeServer(server);
    }
  });

  it('preserves the Action Registry contracts alongside the new job model contract', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const manifestResponse = await fetch(`${baseUrl}/api/actions/manifest?goal=v34-action-registry-workspace&task=task-1`);
      const availabilityResponse = await fetch(`${baseUrl}/api/actions/availability?goal=v34-action-registry-workspace&task=task-1`);
      const previewResponse = await fetch(`${baseUrl}/api/actions/preview?goal=v34-action-registry-workspace&task=task-1&action=goal.worker-evidence.record`);
      const jobResponse = await fetch(`${baseUrl}/api/jobs?goal=v35-job-queue-run-control-workspace&task=task-1`);

      assert.equal(manifestResponse.status, 200);
      assert.equal(availabilityResponse.status, 200);
      assert.equal(previewResponse.status, 200);
      assert.equal(jobResponse.status, 200);

      const manifest = await manifestResponse.json();
      const jobModel = await jobResponse.json();

      assert.equal(manifest.contractName, 'action-manifest.v1');
      assert.equal(jobModel.contractName, 'job-model.v1');
      assert.equal(jobModel.context.sourceContracts.includes('action-manifest.v1'), true);
      assert.equal(jobModel.context.sourceContracts.includes('action-availability.v1'), true);
      assert.equal(jobModel.context.sourceContracts.includes('action-preview.v1'), true);
    } finally {
      await closeServer(server);
    }
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
