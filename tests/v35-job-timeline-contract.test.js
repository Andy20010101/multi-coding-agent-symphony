import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildJobTimelineLogStreamContract,
  validateJobTimelineLogStreamContract
} from '../src/symphony/job-timeline-contract.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';

const FIXED_TIME = '2026-06-03T00:00:00.000Z';
const V35_GOAL_ID = 'v35-job-queue-run-control-workspace';

describe('v35 job-timeline-log-stream.v1 contract', () => {
  it('validates the fixture and rejects execution and write boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    assert.deepEqual(validateJobTimelineLogStreamContract(fixture), {
      ok: true,
      errors: []
    });

    assert.deepEqual(validateJobTimelineLogStreamContract(buildJobTimelineLogStreamContract({
      jobId: null,
      goalId: V35_GOAL_ID,
      taskId: 'task-3',
      generatedAt: FIXED_TIME
    })), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.boundaries.jobExecutionAvailable = true;
    drift.boundaries.actionExecutionAvailable = true;

    assert.equal(validateJobTimelineLogStreamContract(drift).errors.includes('boundaries.jobExecutionAvailable must be false'), true);
    assert.equal(validateJobTimelineLogStreamContract(drift).errors.includes('boundaries.actionExecutionAvailable must be false'), true);
  });

  it('rejects timeline boundary drift across all write and execution fields', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

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
        validateJobTimelineLogStreamContract(drift).errors.includes(`boundaries.${field} must be false`),
        true,
        `boundaries.${field} must be caught when set to true`
      );
    }
  });

  it('rejects deviation from the locked timelineSource and logRefSource values', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    const timelineMutations = [
      'frontend-inference',
      'branch-name',
      'task-title',
      ''
    ];

    for (const mutated of timelineMutations) {
      const drift = structuredClone(fixture);
      drift.boundaries.timelineSource = mutated;

      assert.equal(
        validateJobTimelineLogStreamContract(drift).errors.includes('boundaries.timelineSource must be explicit-backend-job-events'),
        true,
        `boundaries.timelineSource must be rejected when set to "${mutated}"`
      );
    }

    const logRefMutations = [
      'arbitrary-file-read',
      'local-path-resolve',
      ''
    ];

    for (const mutated of logRefMutations) {
      const drift = structuredClone(fixture);
      drift.boundaries.logRefSource = mutated;

      assert.equal(
        validateJobTimelineLogStreamContract(drift).errors.includes('boundaries.logRefSource must be structured-log-refs-only'),
        true,
        `boundaries.logRefSource must be rejected when set to "${mutated}"`
      );
    }
  });

  it('rejects a contract with drift on readOnly, contractName, and contractVersion', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    const readOnlyDrift = structuredClone(fixture);
    readOnlyDrift.readOnly = false;

    assert.equal(validateJobTimelineLogStreamContract(readOnlyDrift).errors.includes('readOnly must be true'), true);

    const nameDrift = structuredClone(fixture);
    nameDrift.contractName = 'wrong-contract.v1';

    assert.equal(validateJobTimelineLogStreamContract(nameDrift).errors.includes('contractName must be job-timeline-log-stream.v1'), true);

    const versionDrift = structuredClone(fixture);
    versionDrift.contractVersion = 2;

    assert.equal(validateJobTimelineLogStreamContract(versionDrift).errors.includes('contractVersion must be 1'), true);
  });

  it('rejects an unsafe context field on the timeline contract', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    const goalDrift = structuredClone(fixture);
    goalDrift.context.goalId = '..%2F..%2Fpackage.json';

    assert.equal(validateJobTimelineLogStreamContract(goalDrift).errors.includes('context.goalId must be a safe ref'), true);

    const jobIdDrift = structuredClone(fixture);
    jobIdDrift.context.jobId = '../unsafe-job';

    assert.equal(validateJobTimelineLogStreamContract(jobIdDrift).errors.includes('context.jobId must be a safe ref'), true);

    const taskIdDrift = structuredClone(fixture);
    taskIdDrift.context.taskId = '../unsafe-task';

    assert.equal(validateJobTimelineLogStreamContract(taskIdDrift).errors.includes('context.taskId must be a safe ref'), true);
  });

  it('rejects missing required source contracts', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    const requiredContracts = ['job-model.v1', 'job-creation.v1', 'goal-event-log.v1'];

    for (const required of requiredContracts) {
      const drift = structuredClone(fixture);
      drift.context.sourceContracts = drift.context.sourceContracts.filter((c) => c !== required);

      assert.equal(
        validateJobTimelineLogStreamContract(drift).errors.includes(`context.sourceContracts must include ${required}`),
        true,
        `context.sourceContracts missing ${required} must be rejected`
      );
    }

    const drift = structuredClone(fixture);
    drift.context.sourceContracts = ['goal-runbook.v1'];
    const errors = validateJobTimelineLogStreamContract(drift).errors;

    assert.equal(errors.includes('context.sourceContracts must include job-model.v1'), true);
    assert.equal(errors.includes('context.sourceContracts must include job-creation.v1'), true);
    assert.equal(errors.includes('context.sourceContracts must include goal-event-log.v1'), true);
  });

  it('rejects timeline events with invalid event types and queue states', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    const withBadEvent = structuredClone(fixture);
    withBadEvent.timeline = [{
      event_id: 'evt-1',
      job_id: 'job-1',
      goal_id: V35_GOAL_ID,
      task_id: null,
      action_id: null,
      event_type: 'unknown-event-type',
      queue_state: 'job-event',
      timestamp: '2026-06-03T00:00:00.000Z',
      source: 'job-event',
      message: null,
      refs: [],
      blocker: null,
      failure: null
    }];

    assert.equal(
      validateJobTimelineLogStreamContract(withBadEvent).errors.includes('timeline[0].event_type must be one of queued, running, blocked, failed, passed, cancelled, recovered'),
      true
    );

    const withBadQueueState = structuredClone(fixture);
    withBadQueueState.timeline = [{
      event_id: 'evt-1',
      job_id: 'job-1',
      goal_id: V35_GOAL_ID,
      task_id: null,
      action_id: null,
      event_type: 'queued',
      queue_state: 'unknown-queue-state',
      timestamp: '2026-06-03T00:00:00.000Z',
      source: 'job-event',
      message: null,
      refs: [],
      blocker: null,
      failure: null
    }];

    assert.equal(
      validateJobTimelineLogStreamContract(withBadQueueState).errors.includes('timeline[0].queue_state must be one of action-preview-contract, job-event, job-queue-state, goal-event'),
      true
    );
  });

  it('rejects timeline events with unsafe identifiers', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    const baseEvent = {
      event_id: 'evt-1',
      job_id: 'job-1',
      goal_id: V35_GOAL_ID,
      task_id: null,
      action_id: null,
      event_type: 'queued',
      queue_state: 'job-event',
      timestamp: '2026-06-03T00:00:00.000Z',
      source: 'job-event',
      message: null,
      refs: [],
      blocker: null,
      failure: null
    };

    const unsafeEventId = structuredClone(fixture);
    unsafeEventId.timeline = [{ ...baseEvent, event_id: '../unsafe' }];

    assert.equal(validateJobTimelineLogStreamContract(unsafeEventId).errors.includes('timeline[0].event_id must be a safe ref'), true);

    const unsafeJobId = structuredClone(fixture);
    unsafeJobId.timeline = [{ ...baseEvent, job_id: '..%2F..%2Fpasswd' }];

    assert.equal(validateJobTimelineLogStreamContract(unsafeJobId).errors.includes('timeline[0].job_id must be a safe ref'), true);

    const unsafeGoalId = structuredClone(fixture);
    unsafeGoalId.timeline = [{ ...baseEvent, goal_id: '../unsafe' }];

    assert.equal(validateJobTimelineLogStreamContract(unsafeGoalId).errors.includes('timeline[0].goal_id must be a safe ref'), true);

    const unsafeActionId = structuredClone(fixture);
    unsafeActionId.timeline = [{ ...baseEvent, action_id: '../run' }];

    assert.equal(validateJobTimelineLogStreamContract(unsafeActionId).errors.includes('timeline[0].action_id must be a safe action id'), true);
  });

  it('validates timeline blocker and failure fields', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    const baseEvent = {
      event_id: 'evt-1',
      job_id: 'job-1',
      goal_id: V35_GOAL_ID,
      task_id: 'task-3',
      action_id: null,
      event_type: 'blocked',
      queue_state: 'job-event',
      timestamp: '2026-06-03T00:00:00.000Z',
      source: 'job-event',
      message: null,
      refs: [],
      blocker: null,
      failure: null
    };

    const withBlocker = structuredClone(fixture);
    withBlocker.timeline = [{
      ...baseEvent,
      blocker: { reason: 'missing dependency' }
    }];

    assert.deepEqual(validateJobTimelineLogStreamContract(withBlocker), {
      ok: true,
      errors: []
    });

    const badBlocker = structuredClone(fixture);
    badBlocker.timeline = [{
      ...baseEvent,
      blocker: { reason: '' }
    }];

    assert.equal(validateJobTimelineLogStreamContract(badBlocker).errors.includes('timeline[0].blocker.reason must be a non-empty string'), true);

    const withFailure = structuredClone(fixture);
    withFailure.timeline = [{
      ...baseEvent,
      event_type: 'failed',
      failure: { code: 'E01', message: 'test failure', attempt: 1 }
    }];

    assert.deepEqual(validateJobTimelineLogStreamContract(withFailure), {
      ok: true,
      errors: []
    });

    const badFailure = structuredClone(fixture);
    badFailure.timeline = [{
      ...baseEvent,
      event_type: 'failed',
      failure: { code: '', message: '' }
    }];

    const failureErrors = validateJobTimelineLogStreamContract(badFailure).errors;
    assert.equal(failureErrors.includes('timeline[0].failure.code must be a non-empty string'), true);
    assert.equal(failureErrors.includes('timeline[0].failure.message must be a non-empty string'), true);
  });

  it('rejects log refs with invalid kinds and unsafe URIs', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    const baseRef = {
      ref_id: 'log-ref-1',
      job_id: null,
      kind: 'stdout',
      label: 'Job stdout',
      uri: '/api/jobs/timeline?job_id=job-1',
      available: false,
      size_bytes: null,
      note: null
    };

    const validWithRef = structuredClone(fixture);
    validWithRef.logRefs = [baseRef];

    assert.deepEqual(validateJobTimelineLogStreamContract(validWithRef), {
      ok: true,
      errors: []
    });

    const badKind = structuredClone(fixture);
    badKind.logRefs = [{ ...baseRef, kind: 'unsafe-log-kind' }];

    assert.equal(
      validateJobTimelineLogStreamContract(badKind).errors.includes('logRefs[0].kind must be one of stdout, stderr, combined, event-log, structured'),
      true
    );

    const traversalUri = structuredClone(fixture);
    traversalUri.logRefs = [{ ...baseRef, uri: '../../../etc/passwd' }];

    assert.equal(
      validateJobTimelineLogStreamContract(traversalUri).errors.includes('logRefs[0].uri must not contain traversal or unsafe segments'),
      true
    );

    const encodedTraversalUri = structuredClone(fixture);
    encodedTraversalUri.logRefs = [{ ...baseRef, uri: '/api/%2e%2e/%2e%2e/etc/passwd' }];

    assert.equal(
      validateJobTimelineLogStreamContract(encodedTraversalUri).errors.includes('logRefs[0].uri must not contain traversal or unsafe segments'),
      true
    );

    const mixedEncodedTraversalUri = structuredClone(fixture);
    mixedEncodedTraversalUri.logRefs = [{ ...baseRef, uri: '/api/%2e%2E/etc/passwd' }];

    assert.equal(
      validateJobTimelineLogStreamContract(mixedEncodedTraversalUri).errors.includes('logRefs[0].uri must not contain traversal or unsafe segments'),
      true
    );

    const fileUri = structuredClone(fixture);
    fileUri.logRefs = [{ ...baseRef, uri: 'file:///etc/passwd' }];

    assert.equal(
      validateJobTimelineLogStreamContract(fileUri).errors.includes('logRefs[0].uri must not contain traversal or unsafe segments'),
      true
    );

    const localAbsolutePath = structuredClone(fixture);
    localAbsolutePath.logRefs = [{ ...baseRef, uri: '/Users/andy/.ssh/id_rsa' }];

    assert.equal(
      validateJobTimelineLogStreamContract(localAbsolutePath).errors.includes('logRefs[0].uri must not contain traversal or unsafe segments'),
      true
    );
  });

  it('rejects log refs with invalid fields', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    const badRefId = structuredClone(fixture);
    badRefId.logRefs = [{
      ref_id: '../unsafe',
      job_id: null,
      kind: 'stdout',
      label: 'test',
      uri: '/api/test',
      available: false,
      size_bytes: null,
      note: null
    }];

    assert.equal(validateJobTimelineLogStreamContract(badRefId).errors.includes('logRefs[0].ref_id must be a safe ref'), true);

    const badSize = structuredClone(fixture);
    badSize.logRefs = [{
      ref_id: 'ref-1',
      job_id: null,
      kind: 'stdout',
      label: 'test',
      uri: '/api/test',
      available: false,
      size_bytes: 'not-a-number',
      note: null
    }];

    assert.equal(validateJobTimelineLogStreamContract(badSize).errors.includes('logRefs[0].size_bytes must be an integer or null'), true);
  });

  it('serves the Workbench job timeline route and rejects unsupported query parameters', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const timelineResponse = await fetch(`${baseUrl}/api/jobs/timeline?goal=v35-job-queue-run-control-workspace&task=task-3`);
      const invalidResponse = await fetch(`${baseUrl}/api/jobs/timeline?command=run&path=package.json`);
      const unsafeGoalResponse = await fetch(`${baseUrl}/api/jobs/timeline?goal=..%2F..%2Fx`);
      const unsafeTaskResponse = await fetch(`${baseUrl}/api/jobs/timeline?task=..%2Ftask`);
      const postResponse = await fetch(`${baseUrl}/api/jobs/timeline`, { method: 'POST' });

      assert.equal(timelineResponse.status, 200);
      assert.equal(invalidResponse.status, 400);
      assert.equal(unsafeGoalResponse.status, 400);
      assert.equal(unsafeTaskResponse.status, 400);
      assert.equal(postResponse.status, 405);

      const timeline = await timelineResponse.json();

      assert.deepEqual(validateJobTimelineLogStreamContract(timeline), {
        ok: true,
        errors: []
      });
      assert.equal(timeline.contractName, 'job-timeline-log-stream.v1');
      assert.equal(timeline.context.goalId, V35_GOAL_ID);
      assert.equal(timeline.context.taskId, 'task-3');
      assert.equal(timeline.context.stateSource, 'explicit-backend-contracts');
      assert.equal(timeline.boundaries.jobExecutionAvailable, false);
      assert.equal(timeline.boundaries.actionExecutionAvailable, false);
      assert.equal(timeline.boundaries.timelineSource, 'explicit-backend-job-events');
      assert.equal(timeline.boundaries.logRefSource, 'structured-log-refs-only');
      assert.equal(Array.isArray(timeline.timeline), true);
      assert.equal(Array.isArray(timeline.logRefs), true);
      assert.equal((await invalidResponse.json()).error.code, 'invalid-job-timeline-request');
      assert.equal((await unsafeGoalResponse.json()).error.code, 'invalid-job-timeline-request');
      assert.equal((await unsafeTaskResponse.json()).error.code, 'invalid-job-timeline-request');
      assert.equal((await postResponse.json()).error.code, 'method-not-allowed');
    } finally {
      await closeServer(server);
    }
  });

  it('preserves the existing job model, job creation, and action registry contracts alongside the new timeline contract', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const manifestResponse = await fetch(`${baseUrl}/api/actions/manifest?goal=v34-action-registry-workspace&task=task-1`);
      const jobResponse = await fetch(`${baseUrl}/api/jobs?goal=v35-job-queue-run-control-workspace&task=task-3`);
      const creationResponse = await fetch(`${baseUrl}/api/jobs/create?goal=v35-job-queue-run-control-workspace&task=task-3&action=goal.worker-evidence.record`);
      const timelineResponse = await fetch(`${baseUrl}/api/jobs/timeline?goal=v35-job-queue-run-control-workspace&task=task-3`);

      assert.equal(manifestResponse.status, 200);
      assert.equal(jobResponse.status, 200);
      assert.equal(creationResponse.status, 200);
      assert.equal(timelineResponse.status, 200);

      const manifest = await manifestResponse.json();
      const jobModel = await jobResponse.json();
      const jobCreation = await creationResponse.json();
      const timeline = await timelineResponse.json();

      assert.equal(manifest.contractName, 'action-manifest.v1');
      assert.equal(jobModel.contractName, 'job-model.v1');
      assert.equal(jobCreation.contractName, 'job-creation.v1');
      assert.equal(timeline.contractName, 'job-timeline-log-stream.v1');
      assert.equal(timeline.context.sourceContracts.includes('job-model.v1'), true);
      assert.equal(timeline.context.sourceContracts.includes('job-creation.v1'), true);
      assert.equal(timeline.context.stateSource, 'explicit-backend-contracts');
      assert.equal(timeline.boundaries.timelineSource, 'explicit-backend-job-events');
    } finally {
      await closeServer(server);
    }
  });

  it('returns empty timeline and logRefs when no real job event store exists', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const response = await fetch(`${baseUrl}/api/jobs/timeline?goal=v35-job-queue-run-control-workspace&task=task-3`);
      const timeline = await response.json();

      assert.equal(response.status, 200);
      assert.equal(timeline.timeline.length, 0);
      assert.equal(timeline.logRefs.length, 0);
      assert.equal(typeof timeline.note, 'string');
      assert.match(timeline.note, /empty timeline/i);
      assert.equal(timeline.boundaries.timelineSource, 'explicit-backend-job-events');
      assert.equal(timeline.boundaries.logRefSource, 'structured-log-refs-only');
    } finally {
      await closeServer(server);
    }
  });

  it('rejects non-plain-object timeline events and logRefs entries', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    const badTimeline = structuredClone(fixture);
    badTimeline.timeline = ['not-an-object'];

    assert.equal(validateJobTimelineLogStreamContract(badTimeline).errors.includes('timeline[0] must be a plain object'), true);

    const badLogRefs = structuredClone(fixture);
    badLogRefs.logRefs = ['not-an-object'];

    assert.equal(validateJobTimelineLogStreamContract(badLogRefs).errors.includes('logRefs[0] must be a plain object'), true);
  });

  it('rejects context drift on stateSource', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    const stateSourceDrift = structuredClone(fixture);
    stateSourceDrift.context.stateSource = 'frontend-inference';

    assert.equal(validateJobTimelineLogStreamContract(stateSourceDrift).errors.includes('context.stateSource must be explicit-backend-contracts'), true);
  });

  it('rejects timeline events and log refs that do not match the request context', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));
    const baseEvent = {
      event_id: 'evt-1',
      job_id: 'job-context',
      goal_id: V35_GOAL_ID,
      task_id: 'task-3',
      action_id: null,
      event_type: 'queued',
      queue_state: 'job-event',
      timestamp: '2026-06-03T00:00:00.000Z',
      source: 'job-event',
      message: null,
      refs: [],
      blocker: null,
      failure: null
    };
    const baseRef = {
      ref_id: 'log-ref-1',
      job_id: 'job-context',
      kind: 'stdout',
      label: 'Job stdout',
      uri: '/api/jobs/timeline?job_id=job-context',
      available: false,
      size_bytes: null,
      note: null
    };

    const jobMismatch = structuredClone(fixture);
    jobMismatch.context.jobId = 'job-context';
    jobMismatch.timeline = [{ ...baseEvent, job_id: 'job-other' }];

    assert.equal(
      validateJobTimelineLogStreamContract(jobMismatch).errors.includes('timeline[0].job_id must equal context.jobId'),
      true
    );

    const goalMismatch = structuredClone(fixture);
    goalMismatch.timeline = [{ ...baseEvent, goal_id: 'other-goal' }];

    assert.equal(
      validateJobTimelineLogStreamContract(goalMismatch).errors.includes('timeline[0].goal_id must equal context.goalId'),
      true
    );

    const taskMismatch = structuredClone(fixture);
    taskMismatch.timeline = [{ ...baseEvent, task_id: 'task-other' }];

    assert.equal(
      validateJobTimelineLogStreamContract(taskMismatch).errors.includes('timeline[0].task_id must equal context.taskId when context.taskId is present'),
      true
    );

    const logRefJobMismatch = structuredClone(fixture);
    logRefJobMismatch.context.jobId = 'job-context';
    logRefJobMismatch.logRefs = [{ ...baseRef, job_id: 'job-other' }];

    assert.equal(
      validateJobTimelineLogStreamContract(logRefJobMismatch).errors.includes('logRefs[0].job_id must equal context.jobId when both are present'),
      true
    );
  });

  it('rejects timeline events with missing required fields', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/job-timeline-log-stream.v1.json', 'utf8'));

    const missingTimestamp = structuredClone(fixture);
    missingTimestamp.timeline = [{
      event_id: 'evt-1',
      job_id: 'job-1',
      goal_id: V35_GOAL_ID,
      task_id: null,
      action_id: null,
      event_type: 'queued',
      queue_state: 'job-event',
      timestamp: 'not-a-date',
      source: 'job-event',
      message: null,
      refs: [],
      blocker: null,
      failure: null
    }];

    assert.equal(validateJobTimelineLogStreamContract(missingTimestamp).errors.includes('timeline[0].timestamp must be an ISO timestamp'), true);

    const blankSource = structuredClone(fixture);
    blankSource.timeline = [{
      event_id: 'evt-1',
      job_id: 'job-1',
      goal_id: V35_GOAL_ID,
      task_id: null,
      action_id: null,
      event_type: 'queued',
      queue_state: 'job-event',
      timestamp: '2026-06-03T00:00:00.000Z',
      source: '',
      message: null,
      refs: [],
      blocker: null,
      failure: null
    }];

    assert.equal(validateJobTimelineLogStreamContract(blankSource).errors.includes('timeline[0].source must be a non-empty string'), true);
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
