import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildJobRunControlContract,
  validateJobRunControlContract
} from '../src/symphony/job-run-control-contract.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';

const FIXED_TIME = '2026-06-03T00:00:00.000Z';
const V35_GOAL_ID = 'v35-job-queue-run-control-workspace';

describe('v35 job-run-control.v1 contract', () => {
  it('validates the fixture and rejects boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    assert.deepEqual(validateJobRunControlContract(fixture), {
      ok: true,
      errors: []
    });

    assert.deepEqual(validateJobRunControlContract(buildJobRunControlContract({
      jobId: null,
      goalId: V35_GOAL_ID,
      taskId: 'task-4',
      currentState: null,
      generatedAt: FIXED_TIME
    })), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.boundaries.jobExecutionAvailable = true;
    drift.boundaries.actionExecutionAvailable = true;

    assert.equal(validateJobRunControlContract(drift).errors.includes('boundaries.jobExecutionAvailable must be false'), true);
    assert.equal(validateJobRunControlContract(drift).errors.includes('boundaries.actionExecutionAvailable must be false'), true);
  });

  it('rejects boundary drift across all write and execution fields', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

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
      'hiddenRetryAvailable'
    ];

    for (const field of driftFields) {
      const drift = structuredClone(fixture);
      drift.boundaries[field] = true;

      assert.equal(
        validateJobRunControlContract(drift).errors.includes(`boundaries.${field} must be false`),
        true,
        `boundaries.${field} must be caught when set to true`
      );
    }
  });

  it('rejects deviation from the locked controlSource value', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const mutations = [
      'frontend-inference',
      'branch-name',
      'task-title',
      ''
    ];

    for (const mutated of mutations) {
      const drift = structuredClone(fixture);
      drift.boundaries.controlSource = mutated;

      assert.equal(
        validateJobRunControlContract(drift).errors.includes('boundaries.controlSource must be explicit-backend-job-state'),
        true,
        `boundaries.controlSource must be rejected when set to "${mutated}"`
      );
    }
  });

  it('rejects a contract with drift on readOnly, contractName, and contractVersion', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const readOnlyDrift = structuredClone(fixture);
    readOnlyDrift.readOnly = false;

    assert.equal(validateJobRunControlContract(readOnlyDrift).errors.includes('readOnly must be true'), true);

    const nameDrift = structuredClone(fixture);
    nameDrift.contractName = 'wrong-contract.v1';

    assert.equal(validateJobRunControlContract(nameDrift).errors.includes('contractName must be job-run-control.v1'), true);

    const versionDrift = structuredClone(fixture);
    versionDrift.contractVersion = 2;

    assert.equal(validateJobRunControlContract(versionDrift).errors.includes('contractVersion must be 1'), true);
  });

  it('rejects an unsafe context field', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const goalDrift = structuredClone(fixture);
    goalDrift.context.goalId = '..%2F..%2Fpackage.json';

    assert.equal(validateJobRunControlContract(goalDrift).errors.includes('context.goalId must be a safe ref'), true);

    const jobIdDrift = structuredClone(fixture);
    jobIdDrift.context.jobId = '../unsafe-job';

    assert.equal(validateJobRunControlContract(jobIdDrift).errors.includes('context.jobId must be a safe ref'), true);

    const taskIdDrift = structuredClone(fixture);
    taskIdDrift.context.taskId = '../unsafe-task';

    assert.equal(validateJobRunControlContract(taskIdDrift).errors.includes('context.taskId must be a safe ref'), true);
  });

  it('rejects missing required source contracts', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const requiredContracts = ['job-model.v1', 'job-creation.v1', 'job-timeline-log-stream.v1', 'goal-event-log.v1'];

    for (const required of requiredContracts) {
      const drift = structuredClone(fixture);
      drift.context.sourceContracts = drift.context.sourceContracts.filter((c) => c !== required);

      assert.equal(
        validateJobRunControlContract(drift).errors.includes(`context.sourceContracts must include ${required}`),
        true,
        `context.sourceContracts missing ${required} must be rejected`
      );
    }

    const drift = structuredClone(fixture);
    drift.context.sourceContracts = ['goal-runbook.v1'];
    const errors = validateJobRunControlContract(drift).errors;

    assert.equal(errors.includes('context.sourceContracts must include job-model.v1'), true);
    assert.equal(errors.includes('context.sourceContracts must include job-creation.v1'), true);
    assert.equal(errors.includes('context.sourceContracts must include job-timeline-log-stream.v1'), true);
    assert.equal(errors.includes('context.sourceContracts must include goal-event-log.v1'), true);
  });

  it('rejects context drift on stateSource', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const stateSourceDrift = structuredClone(fixture);
    stateSourceDrift.context.stateSource = 'frontend-inference';

    assert.equal(validateJobRunControlContract(stateSourceDrift).errors.includes('context.stateSource must be explicit-backend-contracts'), true);
  });

  it('rejects transitions with invalid to or validFrom values', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const badTo = structuredClone(fixture);
    badTo.transitions = [{
      id: 'test',
      label: 'Test',
      description: 'Test.',
      validFrom: ['queued'],
      to: 'unknown-status',
      reversible: false,
      terminal: false,
      hiddenRetry: false
    }];

    assert.equal(
      validateJobRunControlContract(badTo).errors.includes('transitions[0].to must be one of queued, running, blocked, failed, passed, cancelled'),
      true
    );

    const badFrom = structuredClone(fixture);
    badFrom.transitions = [{
      id: 'test',
      label: 'Test',
      description: 'Test.',
      validFrom: ['unknown-status'],
      to: 'queued',
      reversible: false,
      terminal: false,
      hiddenRetry: false
    }];

    assert.equal(
      validateJobRunControlContract(badFrom).errors.includes('transitions[0].validFrom[0] must be one of queued, running, blocked, failed, passed, cancelled'),
      true
    );
  });

  it('rejects a transition where to is in validFrom', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const selfTransition = structuredClone(fixture);
    selfTransition.transitions = [{
      id: 'self',
      label: 'Self',
      description: 'Self transition.',
      validFrom: ['queued'],
      to: 'queued',
      reversible: false,
      terminal: false,
      hiddenRetry: false
    }];

    assert.equal(
      validateJobRunControlContract(selfTransition).errors.includes('transitions[0].to must not be in transitions[0].validFrom'),
      true
    );
  });

  it('rejects a transition that is both terminal and reversible', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const badTransition = structuredClone(fixture);
    badTransition.transitions = [{
      id: 'bad',
      label: 'Bad',
      description: 'Bad.',
      validFrom: ['queued'],
      to: 'blocked',
      reversible: true,
      terminal: true,
      hiddenRetry: false
    }];

    assert.equal(
      validateJobRunControlContract(badTransition).errors.includes('transitions[0] must not be both terminal and reversible'),
      true
    );
  });

  it('rejects hiddenRetry drift on any transition', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const drift = structuredClone(fixture);
    drift.transitions = fixture.transitions.map((t) => ({ ...t, hiddenRetry: true }));

    assert.equal(
      validateJobRunControlContract(drift).errors.some((e) => e.includes('hiddenRetry must be false')),
      true
    );
  });

  it('computes correct available transitions for each job state', async () => {
    const states = {
      queued: ['pause', 'cancel'],
      running: ['pause', 'cancel'],
      blocked: ['cancel', 'resume'],
      failed: ['cancel', 'recover'],
      passed: [],
      cancelled: []
    };

    for (const [state, expected] of Object.entries(states)) {
      const contract = buildJobRunControlContract({
        goalId: V35_GOAL_ID,
        taskId: 'task-4',
        currentState: state
      });

      assert.deepEqual(validateJobRunControlContract(contract), { ok: true, errors: [] });
      assert.deepEqual(contract.availableTransitions, expected, `state ${state} must have transitions [${expected.join(', ')}]`);
      assert.equal(contract.currentState, state);
    }
  });

  it('returns empty availableTransitions when currentState is null', () => {
    const contract = buildJobRunControlContract({
      goalId: V35_GOAL_ID,
      taskId: 'task-4',
      currentState: null
    });

    assert.deepEqual(contract.availableTransitions, []);
    assert.equal(contract.currentState, null);
    assert.deepEqual(validateJobRunControlContract(contract), { ok: true, errors: [] });
  });

  it('rejects availableTransitions that do not match the currentState', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const queuedFixture = structuredClone(fixture);
    queuedFixture.currentState = 'queued';
    queuedFixture.availableTransitions = ['recover'];

    assert.equal(
      validateJobRunControlContract(queuedFixture).errors.includes('availableTransitions for state queued must be [cancel,pause]'),
      true
    );

    const nullStateWithAvailable = structuredClone(fixture);
    nullStateWithAvailable.currentState = null;
    nullStateWithAvailable.availableTransitions = ['pause'];

    assert.equal(
      validateJobRunControlContract(nullStateWithAvailable).errors.includes('availableTransitions must be empty when currentState is null'),
      true
    );

    const unknownTransition = structuredClone(fixture);
    unknownTransition.currentState = 'queued';
    unknownTransition.availableTransitions = ['pause', 'unknown'];

    assert.equal(
      validateJobRunControlContract(unknownTransition).errors.includes('availableTransitions[1] must be a known transition id'),
      true
    );
  });

  it('validates all four controlled transitions have correct fields', async () => {
    const contract = buildJobRunControlContract({
      goalId: V35_GOAL_ID,
      taskId: 'task-4'
    });

    const expectedIds = ['pause', 'cancel', 'resume', 'recover'];
    const ids = contract.transitions.map((t) => t.id);

    assert.deepEqual(ids, expectedIds);

    for (const t of contract.transitions) {
      assert.equal(typeof t.id, 'string');
      assert.equal(typeof t.label, 'string');
      assert.equal(typeof t.description, 'string');
      assert.equal(Array.isArray(t.validFrom), true);
      assert.equal(t.validFrom.length > 0, true);
      assert.equal(typeof t.to, 'string');
      assert.equal(t.to !== t.id, true);
      assert.equal(t.hiddenRetry, false);
      assert.equal(typeof t.reversible, 'boolean');
      assert.equal(typeof t.terminal, 'boolean');
    }

    assert.deepEqual(validateJobRunControlContract(contract), { ok: true, errors: [] });
  });

  it('rejects controlled transition table drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const extraTransition = structuredClone(fixture);
    extraTransition.transitions.push({
      id: 'restart',
      label: 'Restart',
      description: 'Restart drift.',
      validFrom: ['running'],
      to: 'queued',
      reversible: false,
      terminal: false,
      hiddenRetry: false
    });

    assert.equal(
      validateJobRunControlContract(extraTransition).errors.includes('transitions must contain exactly 4 controlled transitions'),
      true
    );

    const missingTransition = structuredClone(fixture);
    missingTransition.transitions.pop();

    assert.equal(
      validateJobRunControlContract(missingTransition).errors.includes('transitions must contain exactly 4 controlled transitions'),
      true
    );

    const changedTo = structuredClone(fixture);
    changedTo.transitions[0].to = 'cancelled';

    assert.equal(
      validateJobRunControlContract(changedTo).errors.includes('transitions[0].to must be blocked'),
      true
    );

    const changedFrom = structuredClone(fixture);
    changedFrom.transitions[1].validFrom = ['running'];

    assert.equal(
      validateJobRunControlContract(changedFrom).errors.includes('transitions[1].validFrom must be [queued,running,blocked,failed]'),
      true
    );
  });

  it('serves the Workbench job control route and rejects unsupported query parameters', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const controlResponse = await fetch(`${baseUrl}/api/jobs/control?goal=v35-job-queue-run-control-workspace&task=task-4`);
      const invalidResponse = await fetch(`${baseUrl}/api/jobs/control?command=run&path=package.json`);
      const unsafeGoalResponse = await fetch(`${baseUrl}/api/jobs/control?goal=..%2F..%2Fx`);
      const unsafeTaskResponse = await fetch(`${baseUrl}/api/jobs/control?task=..%2Ftask`);
      const postResponse = await fetch(`${baseUrl}/api/jobs/control`, { method: 'POST' });

      assert.equal(controlResponse.status, 200);
      assert.equal(invalidResponse.status, 400);
      assert.equal(unsafeGoalResponse.status, 400);
      assert.equal(unsafeTaskResponse.status, 400);
      assert.equal(postResponse.status, 405);

      const control = await controlResponse.json();

      assert.deepEqual(validateJobRunControlContract(control), { ok: true, errors: [] });
      assert.equal(control.contractName, 'job-run-control.v1');
      assert.equal(control.context.goalId, V35_GOAL_ID);
      assert.equal(control.context.taskId, 'task-4');
      assert.equal(control.context.stateSource, 'explicit-backend-contracts');
      assert.equal(control.boundaries.jobExecutionAvailable, false);
      assert.equal(control.boundaries.hiddenRetryAvailable, false);
      assert.equal(control.boundaries.controlSource, 'explicit-backend-job-state');
      assert.equal(Array.isArray(control.transitions), true);
      assert.equal(control.transitions.length, 4);
      assert.equal(Array.isArray(control.availableTransitions), true);
      assert.equal(control.currentState, null);
      assert.equal((await invalidResponse.json()).error.code, 'invalid-job-run-control-request');
      assert.equal((await unsafeGoalResponse.json()).error.code, 'invalid-job-run-control-request');
      assert.equal((await unsafeTaskResponse.json()).error.code, 'invalid-job-run-control-request');
      assert.equal((await postResponse.json()).error.code, 'method-not-allowed');
    } finally {
      await closeServer(server);
    }
  });

  it('serves available transitions when a valid current state is provided', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const blockedResponse = await fetch(`${baseUrl}/api/jobs/control?goal=v35-job-queue-run-control-workspace&task=task-4&state=blocked`);
      const blocked = await blockedResponse.json();

      assert.equal(blockedResponse.status, 200);
      assert.equal(blocked.currentState, 'blocked');
      assert.deepEqual(blocked.availableTransitions, ['cancel', 'resume']);

      const invalidStateResponse = await fetch(`${baseUrl}/api/jobs/control?goal=v35-job-queue-run-control-workspace&state=unknown-state`);
      assert.equal(invalidStateResponse.status, 400);
      assert.equal((await invalidStateResponse.json()).error.code, 'invalid-job-run-control-request');
    } finally {
      await closeServer(server);
    }
  });

  it('preserves the existing job model, job creation, and job timeline contracts', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const manifestResponse = await fetch(`${baseUrl}/api/actions/manifest?goal=v34-action-registry-workspace&task=task-1`);
      const jobResponse = await fetch(`${baseUrl}/api/jobs?goal=v35-job-queue-run-control-workspace&task=task-4`);
      const creationResponse = await fetch(`${baseUrl}/api/jobs/create?goal=v35-job-queue-run-control-workspace&task=task-4&action=goal.worker-evidence.record`);
      const timelineResponse = await fetch(`${baseUrl}/api/jobs/timeline?goal=v35-job-queue-run-control-workspace&task=task-4`);
      const controlResponse = await fetch(`${baseUrl}/api/jobs/control?goal=v35-job-queue-run-control-workspace&task=task-4`);

      assert.equal(manifestResponse.status, 200);
      assert.equal(jobResponse.status, 200);
      assert.equal(creationResponse.status, 200);
      assert.equal(timelineResponse.status, 200);
      assert.equal(controlResponse.status, 200);

      const manifest = await manifestResponse.json();
      const jobModel = await jobResponse.json();
      const jobCreation = await creationResponse.json();
      const timeline = await timelineResponse.json();
      const control = await controlResponse.json();

      assert.equal(manifest.contractName, 'action-manifest.v1');
      assert.equal(jobModel.contractName, 'job-model.v1');
      assert.equal(jobCreation.contractName, 'job-creation.v1');
      assert.equal(timeline.contractName, 'job-timeline-log-stream.v1');
      assert.equal(control.contractName, 'job-run-control.v1');
      assert.equal(control.context.sourceContracts.includes('job-model.v1'), true);
      assert.equal(control.context.sourceContracts.includes('job-creation.v1'), true);
      assert.equal(control.context.sourceContracts.includes('job-timeline-log-stream.v1'), true);
      assert.equal(control.context.stateSource, 'explicit-backend-contracts');
      assert.equal(control.boundaries.controlSource, 'explicit-backend-job-state');
      assert.equal(control.boundaries.hiddenRetryAvailable, false);
    } finally {
      await closeServer(server);
    }
  });

  it('rejects non-plain-object transitions and availableTransitions', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const badTransitions = structuredClone(fixture);
    badTransitions.transitions = ['not-an-object'];

    assert.equal(validateJobRunControlContract(badTransitions).errors.includes('transitions[0] must be a plain object'), true);

    const badAvailable = structuredClone(fixture);
    badAvailable.currentState = 'queued';
    badAvailable.availableTransitions = [42];

    assert.equal(
      validateJobRunControlContract(badAvailable).errors.includes('availableTransitions[0] must be a string'),
      true
    );
  });

  it('rejects transitions with empty validFrom', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-run-control.v1.json', 'utf8'));

    const emptyFrom = structuredClone(fixture);
    emptyFrom.transitions = [{
      id: 'test',
      label: 'Test',
      description: 'Test.',
      validFrom: [],
      to: 'queued',
      reversible: false,
      terminal: false,
      hiddenRetry: false
    }];

    assert.equal(
      validateJobRunControlContract(emptyFrom).errors.includes('transitions[0].validFrom must be a non-empty array'),
      true
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
