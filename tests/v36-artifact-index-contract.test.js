import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildArtifactIndexContract,
  validateArtifactIndexContract
} from '../src/symphony/artifact-index-contract.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';

const FIXED_TIME = '2026-06-03T00:00:00.000Z';
const V36_GOAL_ID = 'v36-artifact-evidence-index-workspace';

describe('v36 artifact-index.v1 contract', () => {
  it('validates the fixture and rejects execution and write boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/artifact-index.v1.json', 'utf8'));

    assert.deepEqual(validateArtifactIndexContract(fixture), {
      ok: true,
      errors: []
    });

    assert.deepEqual(validateArtifactIndexContract(buildArtifactIndexContract({
      projectId: null,
      goalId: V36_GOAL_ID,
      taskId: 'task-1',
      runId: null,
      jobId: null,
      generatedAt: FIXED_TIME
    })), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.boundaries.shellExecutionAvailable = true;
    drift.boundaries.modelInvocationAvailable = true;

    assert.equal(validateArtifactIndexContract(drift).errors.includes('boundaries.shellExecutionAvailable must be false'), true);
    assert.equal(validateArtifactIndexContract(drift).errors.includes('boundaries.modelInvocationAvailable must be false'), true);
  });

  it('rejects boundary drift across all write, execution, and unsafe path fields', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/artifact-index.v1.json', 'utf8'));

    const driftFields = [
      'artifactExecutionAvailable',
      'shellExecutionAvailable',
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
      'artifactDownloadAvailable',
      'localFileOpenAvailable'
    ];

    for (const field of driftFields) {
      const drift = structuredClone(fixture);
      drift.boundaries[field] = true;

      assert.equal(
        validateArtifactIndexContract(drift).errors.includes(`boundaries.${field} must be false`),
        true,
        `boundaries.${field} must be caught when set to true`
      );
    }
  });

  it('rejects deviation from the locked canonicalSource value', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/artifact-index.v1.json', 'utf8'));

    const mutations = [
      'index-is-primary',
      'dual-source',
      'file-system',
      ''
    ];

    for (const mutated of mutations) {
      const drift = structuredClone(fixture);
      drift.boundaries.canonicalSource = mutated;

      assert.equal(
        validateArtifactIndexContract(drift).errors.includes('boundaries.canonicalSource must be ArtifactStore is canonical, index is derived cache only'),
        true,
        `boundaries.canonicalSource must be rejected when set to "${mutated}"`
      );
    }
  });

  it('rejects drift on readOnly, contractName, contractVersion, canonicalSource, and indexRole', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/artifact-index.v1.json', 'utf8'));

    const readOnlyDrift = structuredClone(fixture);
    readOnlyDrift.readOnly = false;
    assert.equal(validateArtifactIndexContract(readOnlyDrift).errors.includes('readOnly must be true'), true);

    const nameDrift = structuredClone(fixture);
    nameDrift.contractName = 'wrong-index.v1';
    assert.equal(validateArtifactIndexContract(nameDrift).errors.includes('contractName must be artifact-index.v1'), true);

    const versionDrift = structuredClone(fixture);
    versionDrift.contractVersion = 2;
    assert.equal(validateArtifactIndexContract(versionDrift).errors.includes('contractVersion must be 1'), true);

    const canonDrift = structuredClone(fixture);
    canonDrift.context.canonicalSource = 'IndexStore';
    assert.equal(validateArtifactIndexContract(canonDrift).errors.includes('context.canonicalSource must be ArtifactStore'), true);

    const roleDrift = structuredClone(fixture);
    roleDrift.context.indexRole = 'primary-source';
    assert.equal(validateArtifactIndexContract(roleDrift).errors.includes('context.indexRole must be derived-cache-and-search-only'), true);
  });

  it('rejects unsafe refs on indexEntry artifact_ref, goal_id, task_id, run_id, job_id', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/artifact-index.v1.json', 'utf8'));

    const unsafeValues = ['../escape', '..%2F..%2Fpackage.json', '/etc/passwd', 'some/path'];

    for (const unsafe of unsafeValues) {
      const drift = structuredClone(fixture);
      drift.indexEntry.artifact_ref = unsafe;
      assert.equal(
        validateArtifactIndexContract(drift).errors.includes('indexEntry.artifact_ref must be a safe ref'),
        true,
        `artifact_ref "${unsafe}" must be rejected`
      );
    }

    const goalDrift = structuredClone(fixture);
    goalDrift.indexEntry.goal_id = '../escape';
    assert.equal(validateArtifactIndexContract(goalDrift).errors.includes('indexEntry.goal_id must be a safe ref'), true);

    const taskDrift = structuredClone(fixture);
    taskDrift.indexEntry.task_id = '..%2F..%2Fx';
    assert.equal(validateArtifactIndexContract(taskDrift).errors.includes('indexEntry.task_id must be a safe ref'), true);

    const runDrift = structuredClone(fixture);
    runDrift.indexEntry.run_id = 'bad/run';
    assert.equal(validateArtifactIndexContract(runDrift).errors.includes('indexEntry.run_id must be a safe ref'), true);

    const jobDrift = structuredClone(fixture);
    jobDrift.indexEntry.job_id = '/bad/job';
    assert.equal(validateArtifactIndexContract(jobDrift).errors.includes('indexEntry.job_id must be a safe ref'), true);
  });

  it('rejects unknown artifact kind and evidence_kind values', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/artifact-index.v1.json', 'utf8'));

    const kindDrift = structuredClone(fixture);
    kindDrift.indexEntry.kind = 'unknown-kind';
    assert.equal(
      validateArtifactIndexContract(kindDrift).errors.includes('indexEntry.kind must be one of evidence, plan, runbook, fixture, log, artifact, bundle, summary'),
      true
    );

    const evidenceDrift = structuredClone(fixture);
    evidenceDrift.indexEntry.evidence_kind = 'unknown-evidence';
    assert.equal(
      validateArtifactIndexContract(evidenceDrift).errors.includes('indexEntry.evidence_kind must be one of worker, reviewer, main-verifier, release-manager'),
      true
    );
  });

  it('rejects invalid content_hash formats', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/artifact-index.v1.json', 'utf8'));

    const badHashes = [
      'abc123',
      'sha256:too-short',
      'md5:0000000000000000000000000000000000000000000000000000000000000000',
      ''
    ];

    for (const badHash of badHashes) {
      const drift = structuredClone(fixture);
      drift.indexEntry.content_hash = badHash;
      assert.equal(
        validateArtifactIndexContract(drift).errors.includes('indexEntry.content_hash must be a sha256: hex hash'),
        true,
        `content_hash "${badHash}" must be rejected`
      );
    }
  });

  it('rejects missing required source contracts', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/artifact-index.v1.json', 'utf8'));

    const requiredContracts = ['artifact-store.v1', 'goal-runbook.v1', 'goal-progress-ledger.v1', 'goal-event-log.v1'];

    for (const required of requiredContracts) {
      const drift = structuredClone(fixture);
      drift.context.sourceContracts = drift.context.sourceContracts.filter((c) => c !== required);

      assert.equal(
        validateArtifactIndexContract(drift).errors.includes(`context.sourceContracts must include ${required}`),
        true,
        `context.sourceContracts missing ${required} must be rejected`
      );
    }

    const drift = structuredClone(fixture);
    drift.context.sourceContracts = ['goal-runbook.v1'];
    const errors = validateArtifactIndexContract(drift).errors;

    assert.equal(errors.includes('context.sourceContracts must include artifact-store.v1'), true);
    assert.equal(errors.includes('context.sourceContracts must include goal-progress-ledger.v1'), true);
    assert.equal(errors.includes('context.sourceContracts must include goal-event-log.v1'), true);
  });

  it('serves the Workbench artifact index route and rejects unsupported query parameters', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const validResponse = await fetch(`${baseUrl}/api/artifacts?goal=v36-artifact-evidence-index-workspace&task=task-1&kind=evidence`);
      const invalidResponse = await fetch(`${baseUrl}/api/artifacts?command=run&path=package.json`);
      const unsafeGoalResponse = await fetch(`${baseUrl}/api/artifacts?goal=..%2F..%2Fx`);
      const unsafeTaskResponse = await fetch(`${baseUrl}/api/artifacts?task=..%2Ftask`);
      const unsafeKindResponse = await fetch(`${baseUrl}/api/artifacts?kind=..%2F..%2Fetc`);
      const postResponse = await fetch(`${baseUrl}/api/artifacts`, { method: 'POST' });

      assert.equal(validResponse.status, 200);
      assert.equal(invalidResponse.status, 400);
      assert.equal(unsafeGoalResponse.status, 400);
      assert.equal(unsafeTaskResponse.status, 400);
      assert.equal(unsafeKindResponse.status, 400);
      assert.equal(postResponse.status, 405);

      const artifactIndex = await validResponse.json();

      assert.deepEqual(validateArtifactIndexContract(artifactIndex), {
        ok: true,
        errors: []
      });
      assert.equal(artifactIndex.context.goalId, V36_GOAL_ID);
      assert.equal(artifactIndex.context.taskId, 'task-1');
      assert.equal(artifactIndex.boundaries.shellExecutionAvailable, false);
      assert.equal(artifactIndex.boundaries.modelInvocationAvailable, false);
      assert.equal(artifactIndex.boundaries.canonicalSource, 'ArtifactStore is canonical, index is derived cache only');
      assert.equal(artifactIndex.boundaries.artifactDownloadAvailable, false);
      assert.equal(artifactIndex.boundaries.localFileOpenAvailable, false);
      assert.equal((await invalidResponse.json()).error.code, 'invalid-artifact-index-request');
      assert.equal((await unsafeGoalResponse.json()).error.code, 'invalid-artifact-index-request');
      assert.equal((await unsafeTaskResponse.json()).error.code, 'invalid-artifact-index-request');
      assert.equal((await unsafeKindResponse.json()).error.code, 'invalid-artifact-index-request');
      assert.equal((await postResponse.json()).error.code, 'method-not-allowed');
    } finally {
      await closeServer(server);
    }
  });

  it('preserves the v34 Action Registry and v35 Job Model routes alongside the artifact index route', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const manifestResponse = await fetch(`${baseUrl}/api/actions/manifest?goal=v34-action-registry-workspace&task=task-1`);
      const availabilityResponse = await fetch(`${baseUrl}/api/actions/availability?goal=v34-action-registry-workspace&task=task-1`);
      const previewResponse = await fetch(`${baseUrl}/api/actions/preview?goal=v34-action-registry-workspace&task=task-1&action=goal.worker-evidence.record`);
      const jobResponse = await fetch(`${baseUrl}/api/jobs?goal=v35-job-queue-run-control-workspace&task=task-1`);
      const artifactResponse = await fetch(`${baseUrl}/api/artifacts?goal=v36-artifact-evidence-index-workspace&task=task-1`);

      assert.equal(manifestResponse.status, 200);
      assert.equal(availabilityResponse.status, 200);
      assert.equal(previewResponse.status, 200);
      assert.equal(jobResponse.status, 200);
      assert.equal(artifactResponse.status, 200);

      const manifest = await manifestResponse.json();
      const jobModel = await jobResponse.json();
      const artifactIndex = await artifactResponse.json();

      assert.equal(manifest.contractName, 'action-manifest.v1');
      assert.equal(jobModel.contractName, 'job-model.v1');
      assert.equal(artifactIndex.contractName, 'artifact-index.v1');
      assert.equal(artifactIndex.context.sourceContracts.includes('action-manifest.v1'), true);
      assert.equal(artifactIndex.context.sourceContracts.includes('action-preview.v1'), true);
      assert.equal(artifactIndex.context.sourceContracts.includes('job-model.v1'), true);
      assert.equal(artifactIndex.context.canonicalSource, 'ArtifactStore');
      assert.equal(artifactIndex.context.indexRole, 'derived-cache-and-search-only');
    } finally {
      await closeServer(server);
    }
  });

  it('rejects null indexEntry artifact_ref, invalid content_hash, and missing timestamps', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/artifact-index.v1.json', 'utf8'));

    const emptyRef = structuredClone(fixture);
    emptyRef.indexEntry.artifact_ref = '';
    assert.equal(validateArtifactIndexContract(emptyRef).errors.includes('indexEntry.artifact_ref must be a safe ref'), true);

    const noCreated = structuredClone(fixture);
    noCreated.indexEntry.timestamps.created_at = 'not-a-date';
    assert.equal(validateArtifactIndexContract(noCreated).errors.includes('indexEntry.timestamps.created_at must be an ISO timestamp'), true);

    const noIndexed = structuredClone(fixture);
    noIndexed.indexEntry.timestamps.indexed_at = 'not-a-date';
    assert.equal(validateArtifactIndexContract(noIndexed).errors.includes('indexEntry.timestamps.indexed_at must be an ISO timestamp'), true);
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
