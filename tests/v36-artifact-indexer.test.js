import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

import {
  buildArtifactIndex,
  validateIndexEntry
} from '../src/symphony/artifact-indexer.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';

const V36_GOAL_ID = 'v36-artifact-evidence-index-workspace';

function tempDir() {
  return join(tmpdir(), `v36-test-${randomBytes(8).toString('hex')}`);
}

describe('v36 artifact indexer', () => {
  let testDir;
  let artifactStoreDir;
  let stateDir;

  beforeEach(async () => {
    testDir = tempDir();
    artifactStoreDir = join(testDir, 'artifacts');
    stateDir = join(testDir, '.symphony');
  });

  afterEach(async () => {
    try { await rm(testDir, { recursive: true, force: true }); } catch {}
  });

  describe('scanArtifactStore', () => {
    it('returns an empty index when the artifact store directory does not exist', async () => {
      const index = await buildArtifactIndex({
        artifactStoreDir: join(testDir, 'nonexistent'),
        stateDir,
        goalId: V36_GOAL_ID
      });

      assert.equal(index.contractName, 'artifact-index.v1');
      assert.equal(index.entries.length, 0);
      assert.equal(index.context.canonicalSource, 'ArtifactStore');
      assert.equal(index.context.indexRole, 'derived-cache-and-search-only');
    });

    it('builds index entries from artifact store files', async () => {
      await mkdir(join(artifactStoreDir, 'task-1'), { recursive: true });
      await mkdir(join(artifactStoreDir, 'task-2'), { recursive: true });

      const evidenceArtifact = {
        goalId: V36_GOAL_ID,
        evidenceRef: 'docs/plans/v36-task-1-worker-evidence.md',
        actor: { role: 'worker', id: 'claude-v36-task-1-worker' },
        labels: ['v36', 'evidence']
      };

      const planArtifact = {
        contractName: 'goal-runbook.v1',
        goalId: V36_GOAL_ID,
        runId: 'run-001',
        tasks: [{ taskId: 'task-1' }, { taskId: 'task-2' }]
      };

      await writeFile(
        join(artifactStoreDir, 'task-1', 'worker-evidence.json'),
        JSON.stringify(evidenceArtifact)
      );
      await writeFile(
        join(artifactStoreDir, 'task-1', 'runbook.json'),
        JSON.stringify(planArtifact)
      );

      const index = await buildArtifactIndex({
        artifactStoreDir,
        stateDir,
        goalId: V36_GOAL_ID
      });

      assert.equal(index.entries.length, 2);

      const evidenceEntry = index.entries.find((e) => e.artifact_ref === 'task-1/worker-evidence');
      assert.ok(evidenceEntry);
      assert.equal(evidenceEntry.kind, 'evidence');
      assert.equal(evidenceEntry.evidence_kind, 'worker');
      assert.equal(evidenceEntry.goal_id, V36_GOAL_ID);
      assert.equal(evidenceEntry.task_id, 'task-1');
      assert.equal(evidenceEntry.run_id, null);
      assert.equal(evidenceEntry.job_id, null);
      assert.ok(evidenceEntry.content_hash.startsWith('sha256:'));
      assert.equal(evidenceEntry.content_hash.length, 71);
      assert.deepEqual(evidenceEntry.labels, ['v36', 'evidence']);
      assert.ok(typeof evidenceEntry.timestamps.created_at === 'string');
      assert.ok(typeof evidenceEntry.timestamps.indexed_at === 'string');

      const planEntry = index.entries.find((e) => e.artifact_ref === 'task-1/runbook');
      assert.ok(planEntry);
      assert.equal(planEntry.kind, 'runbook');
      assert.equal(planEntry.evidence_kind, null);
      assert.equal(planEntry.run_id, 'run-001');
    });

    it('skips non-directory entries and unsafe segment directory names', async () => {
      await mkdir(join(artifactStoreDir, 'safe-task'), { recursive: true });

      const artifact = { goalId: V36_GOAL_ID, kind: 'artifact' };
      await writeFile(
        join(artifactStoreDir, 'safe-task', 'data.json'),
        JSON.stringify(artifact)
      );

      const index = await buildArtifactIndex({
        artifactStoreDir,
        stateDir,
        goalId: V36_GOAL_ID
      });

      assert.equal(index.entries.length, 1);
      assert.equal(index.entries[0].artifact_ref, 'safe-task/data');
    });

    it('skips non-json files and invalid json', async () => {
      await mkdir(join(artifactStoreDir, 'task-1'), { recursive: true });

      await writeFile(join(artifactStoreDir, 'task-1', 'notes.txt'), 'not json');
      await writeFile(join(artifactStoreDir, 'task-1', 'bad.json'), '{invalid');

      const artifact = { goalId: V36_GOAL_ID };
      await writeFile(
        join(artifactStoreDir, 'task-1', 'valid.json'),
        JSON.stringify(artifact)
      );

      const index = await buildArtifactIndex({
        artifactStoreDir,
        stateDir,
        goalId: V36_GOAL_ID
      });

      assert.equal(index.entries.length, 1);
      assert.equal(index.entries[0].artifact_ref, 'task-1/valid');
    });
  });

  describe('scanEventRefs', () => {
    it('returns entries from event log evidence refs', async () => {
      const eventsDir = join(stateDir, 'goals', 'events');
      await mkdir(eventsDir, { recursive: true });

      const event = {
        eventId: 'evt_test1',
        sequence: 1,
        goalId: V36_GOAL_ID,
        taskId: 'task-1',
        eventType: 'worker.evidence-recorded',
        phase: 'implement',
        actor: { role: 'worker', id: 'test-worker' },
        occurredAt: '2026-06-03T00:00:00.000Z',
        recordedAt: '2026-06-03T00:00:01.000Z',
        evidenceRefs: [
          { kind: 'repo-doc', ref: 'docs/plans/v36-task-1-worker-evidence.md', label: 'Worker evidence' }
        ],
        statement: 'Recorded worker evidence.',
        eventHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
      };

      await writeFile(
        join(eventsDir, `${V36_GOAL_ID}.ndjson`),
        JSON.stringify(event) + '\n'
      );

      const index = await buildArtifactIndex({
        stateDir,
        goalId: V36_GOAL_ID
      });

      const eventEntries = index.entries.filter((e) => e.artifact_ref === 'docs/plans/v36-task-1-worker-evidence.md');
      assert.ok(eventEntries.length >= 1);
      const eventEntry = eventEntries[0];
      assert.equal(eventEntry.kind, 'evidence');
      assert.equal(eventEntry.evidence_kind, 'worker');
      assert.equal(eventEntry.goal_id, V36_GOAL_ID);
      assert.equal(eventEntry.task_id, 'task-1');
      assert.equal(eventEntry.content_hash, null);
    });

    it('handles missing event log files gracefully', async () => {
      const index = await buildArtifactIndex({
        stateDir,
        goalId: V36_GOAL_ID
      });

      assert.ok(Array.isArray(index.entries));
    });

    it('deduplicates event refs already present from artifact store', async () => {
      await mkdir(join(artifactStoreDir, 'task-1'), { recursive: true });
      const eventsDir = join(stateDir, 'goals', 'events');
      await mkdir(eventsDir, { recursive: true });

      const artifact = {
        goalId: V36_GOAL_ID,
        evidenceRef: 'docs/plans/v36-task-1-something.md',
        actor: { role: 'worker', id: 'test' }
      };
      await writeFile(
        join(artifactStoreDir, 'task-1', 'ev.json'),
        JSON.stringify(artifact)
      );

      const event = {
        eventId: 'evt_dedup',
        sequence: 1,
        goalId: V36_GOAL_ID,
        taskId: 'task-1',
        eventType: 'worker.evidence-recorded',
        phase: 'implement',
        actor: { role: 'worker', id: 'test' },
        occurredAt: '2026-06-03T00:00:00.000Z',
        recordedAt: '2026-06-03T00:00:00.000Z',
        evidenceRefs: [
          { kind: 'repo-doc', ref: 'docs/plans/v36-task-1-something.md', label: 'dup' }
        ],
        statement: 'Test.',
        eventHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
      };
      await writeFile(
        join(eventsDir, `${V36_GOAL_ID}.ndjson`),
        JSON.stringify(event) + '\n'
      );

      const index = await buildArtifactIndex({
        artifactStoreDir,
        stateDir,
        goalId: V36_GOAL_ID
      });

      const matching = index.entries.filter(
        (e) => e.artifact_ref === 'docs/plans/v36-task-1-something.md'
      );
      assert.equal(matching.length, 1);
    });
  });

  describe('validateIndexEntry', () => {
    it('accepts a valid artifact index entry', () => {
      const entry = {
        artifact_ref: 'task-1/worker-evidence',
        content_hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
        kind: 'evidence',
        goal_id: V36_GOAL_ID,
        task_id: 'task-1',
        run_id: null,
        job_id: null,
        evidence_kind: 'worker',
        timestamps: {
          created_at: '2026-06-03T00:00:00.000Z',
          indexed_at: '2026-06-03T00:00:00.000Z'
        },
        labels: [],
        file_path: null
      };

      assert.deepEqual(validateIndexEntry(entry), { ok: true, errors: [] });
    });

    it('rejects invalid artifact_ref with unsafe characters', () => {
      const unsafeRefs = ['../escape', '/absolute', 'some\\path', ''];

      for (const ref of unsafeRefs) {
        const entry = {
          artifact_ref: ref,
          content_hash: null,
          kind: 'evidence',
          goal_id: V36_GOAL_ID,
          task_id: 'task-1',
          run_id: null,
          job_id: null,
          evidence_kind: null,
          timestamps: {
            created_at: '2026-06-03T00:00:00.000Z',
            indexed_at: '2026-06-03T00:00:00.000Z'
          },
          labels: [],
          file_path: null
        };

        assert.equal(
          validateIndexEntry(entry).ok,
          false,
          `artifact_ref "${ref}" must be rejected`
        );
      }
    });

    it('rejects invalid content_hash format', () => {
      const entry = {
        artifact_ref: 'test/artifact',
        content_hash: 'not-a-hash',
        kind: 'evidence',
        goal_id: V36_GOAL_ID,
        task_id: null,
        run_id: null,
        job_id: null,
        evidence_kind: null,
        timestamps: {
          created_at: '2026-06-03T00:00:00.000Z',
          indexed_at: '2026-06-03T00:00:00.000Z'
        },
        labels: [],
        file_path: null
      };

      assert.equal(validateIndexEntry(entry).ok, false);
      assert.ok(validateIndexEntry(entry).errors.some((e) => e.includes('content_hash')));
    });

    it('rejects unknown kind values', () => {
      const entry = {
        artifact_ref: 'test/x',
        content_hash: null,
        kind: 'unknown-kind',
        goal_id: V36_GOAL_ID,
        task_id: null,
        run_id: null,
        job_id: null,
        evidence_kind: null,
        timestamps: {
          created_at: '2026-06-03T00:00:00.000Z',
          indexed_at: '2026-06-03T00:00:00.000Z'
        },
        labels: [],
        file_path: null
      };

      assert.equal(validateIndexEntry(entry).ok, false);
    });

    it('accepts content_hash as null for event-ref entries', () => {
      const entry = {
        artifact_ref: 'docs/plans/v36-task-1-evidence.md',
        content_hash: null,
        kind: 'evidence',
        goal_id: V36_GOAL_ID,
        task_id: 'task-1',
        run_id: null,
        job_id: null,
        evidence_kind: 'worker',
        timestamps: {
          created_at: '2026-06-03T00:00:00.000Z',
          indexed_at: '2026-06-03T00:00:00.000Z'
        },
        labels: [],
        file_path: null
      };

      assert.deepEqual(validateIndexEntry(entry), { ok: true, errors: [] });
    });

    it('rejects invalid timestamps', () => {
      const entry = {
        artifact_ref: 'test/x',
        content_hash: null,
        kind: 'evidence',
        goal_id: V36_GOAL_ID,
        task_id: null,
        run_id: null,
        job_id: null,
        evidence_kind: null,
        timestamps: {
          created_at: 'not-a-date',
          indexed_at: '2026-06-03T00:00:00.000Z'
        },
        labels: [],
        file_path: null
      };

      const result = validateIndexEntry(entry);
      assert.equal(result.ok, false);
      assert.ok(result.errors.some((e) => e.includes('created_at')));
    });
  });

  describe('route integration', () => {
    it('serves the artifact index via GET /api/artifacts with entries', async () => {
      const routeArtifactDir = join(stateDir, 'artifacts');
      await mkdir(join(routeArtifactDir, 'task-1'), { recursive: true });

      const artifact = {
        goalId: V36_GOAL_ID,
        actor: { role: 'worker' },
        evidenceRef: 'docs/plans/v36-task-1-evidence.md'
      };
      await writeFile(
        join(routeArtifactDir, 'task-1', 'ev.json'),
        JSON.stringify(artifact)
      );

      const server = createSymphonyConsoleServer({
        stateDir,
        cwd: testDir
      });
      const baseUrl = await listenOnRandomPort(server);

      try {
        const response = await fetch(`${baseUrl}/api/artifacts?goal=${V36_GOAL_ID}&task=task-1`);
        assert.equal(response.status, 200);

        const index = await response.json();
        assert.equal(index.contractName, 'artifact-index.v1');
        assert.equal(index.contractVersion, 1);
        assert.equal(index.readOnly, true);
        assert.equal(index.context.canonicalSource, 'ArtifactStore');
        assert.equal(index.context.indexRole, 'derived-cache-and-search-only');
        assert.ok(Array.isArray(index.entries));
        assert.ok(index.entries.length >= 1);

        assert.equal(index.boundaries.readOnly, true);
        assert.equal(index.boundaries.shellExecutionAvailable, false);
        assert.equal(index.boundaries.modelInvocationAvailable, false);
      } finally {
        await closeServer(server);
      }
    });

    it('filters entries by kind query parameter', async () => {
      const routeArtifactDir = join(stateDir, 'artifacts');
      await mkdir(join(routeArtifactDir, 'task-1'), { recursive: true });
      await mkdir(join(routeArtifactDir, 'task-2'), { recursive: true });

      const evidenceArtifact = {
        goalId: V36_GOAL_ID,
        evidenceRef: 'test',
        actor: { role: 'worker' }
      };
      const planArtifact = {
        contractName: 'goal-runbook.v1',
        goalId: V36_GOAL_ID,
        tasks: []
      };

      await writeFile(
        join(routeArtifactDir, 'task-1', 'evidence.json'),
        JSON.stringify(evidenceArtifact)
      );
      await writeFile(
        join(routeArtifactDir, 'task-2', 'plan.json'),
        JSON.stringify(planArtifact)
      );

      const server = createSymphonyConsoleServer({
        stateDir,
        cwd: testDir
      });
      const baseUrl = await listenOnRandomPort(server);

      try {
        const allResponse = await fetch(`${baseUrl}/api/artifacts?goal=${V36_GOAL_ID}`);
        assert.equal(allResponse.status, 200);
        const allIndex = await allResponse.json();
        assert.equal(allIndex.entries.length, 2);

        const evidenceResponse = await fetch(`${baseUrl}/api/artifacts?goal=${V36_GOAL_ID}&kind=evidence`);
        assert.equal(evidenceResponse.status, 200);
        const evidenceIndex = await evidenceResponse.json();
        assert.equal(evidenceIndex.entries.length, 1);
        assert.equal(evidenceIndex.entries[0].kind, 'evidence');
        assert.equal(evidenceIndex.context.kindFilter, 'evidence');

        const runbookResponse = await fetch(`${baseUrl}/api/artifacts?goal=${V36_GOAL_ID}&kind=runbook`);
        assert.equal(runbookResponse.status, 200);
        const runbookIndex = await runbookResponse.json();
        assert.equal(runbookIndex.entries.length, 1);
        assert.equal(runbookIndex.entries[0].kind, 'runbook');
      } finally {
        await closeServer(server);
      }
    });

    it('rejects unsupported query parameters and unsafe values', async () => {
      const server = createSymphonyConsoleServer({
        stateDir,
        cwd: testDir
      });
      const baseUrl = await listenOnRandomPort(server);

      try {
        const badParam = await fetch(`${baseUrl}/api/artifacts?command=run`);
        assert.equal(badParam.status, 400);
        const badParamJson = await badParam.json();
        assert.equal(badParamJson.error.code, 'invalid-artifact-index-request');

        const unsafeGoal = await fetch(`${baseUrl}/api/artifacts?goal=..%2F..%2Fx`);
        assert.equal(unsafeGoal.status, 400);

        const postResponse = await fetch(`${baseUrl}/api/artifacts`, { method: 'POST' });
        assert.equal(postResponse.status, 405);
      } finally {
        await closeServer(server);
      }
    });

    it('preserves v34 and v35 routes alongside the index route', async () => {
      const server = createSymphonyConsoleServer({
        stateDir,
        cwd: testDir
      });
      const baseUrl = await listenOnRandomPort(server);

      try {
        const manifest = await fetch(`${baseUrl}/api/actions/manifest?goal=v34-action-registry-workspace`);
        const availability = await fetch(`${baseUrl}/api/actions/availability?goal=v34-action-registry-workspace`);
        const job = await fetch(`${baseUrl}/api/jobs?goal=v35-job-queue-run-control-workspace`);
        const artifacts = await fetch(`${baseUrl}/api/artifacts?goal=${V36_GOAL_ID}`);

        assert.equal(manifest.status, 200);
        assert.equal(availability.status, 200);
        assert.equal(job.status, 200);
        assert.equal(artifacts.status, 200);

        const manifestJson = await manifest.json();
        const jobJson = await job.json();
        const artifactsJson = await artifacts.json();

        assert.equal(manifestJson.contractName, 'action-manifest.v1');
        assert.equal(jobJson.contractName, 'job-model.v1');
        assert.equal(artifactsJson.contractName, 'artifact-index.v1');

        assert.ok(artifactsJson.context.sourceContracts.includes('action-manifest.v1'));
        assert.ok(artifactsJson.context.sourceContracts.includes('job-model.v1'));
      } finally {
        await closeServer(server);
      }
    });
  });

  describe('contract compliance', () => {
    it('every produced entry passes validateIndexEntry', async () => {
      await mkdir(join(artifactStoreDir, 'task-1'), { recursive: true });
      await mkdir(join(artifactStoreDir, 'task-2'), { recursive: true });

      const artifacts = [
        { goalId: V36_GOAL_ID, evidenceRef: 'a', actor: { role: 'worker' }, labels: ['x'] },
        { contractName: 'goal-runbook.v1', goalId: V36_GOAL_ID, tasks: [] },
        { goalId: V36_GOAL_ID, kind: 'log', runId: 'r1' },
        { goalId: V36_GOAL_ID, actor: { role: 'reviewer' }, evidenceRef: 'b' }
      ];

      await writeFile(
        join(artifactStoreDir, 'task-1', 'a.json'),
        JSON.stringify(artifacts[0])
      );
      await writeFile(
        join(artifactStoreDir, 'task-1', 'b.json'),
        JSON.stringify(artifacts[1])
      );
      await writeFile(
        join(artifactStoreDir, 'task-2', 'c.json'),
        JSON.stringify(artifacts[2])
      );
      await writeFile(
        join(artifactStoreDir, 'task-2', 'd.json'),
        JSON.stringify(artifacts[3])
      );

      const index = await buildArtifactIndex({
        artifactStoreDir,
        stateDir,
        goalId: V36_GOAL_ID
      });

      assert.equal(index.entries.length, 4);

      for (const entry of index.entries) {
        const result = validateIndexEntry(entry);
        assert.deepEqual(result, { ok: true, errors: [] }, `entry ${entry.artifact_ref} should be valid: ${result.errors.join('; ')}`);
      }
    });

    it('index boundary fields are all locked', async () => {
      const index = await buildArtifactIndex({
        artifactStoreDir,
        stateDir,
        goalId: V36_GOAL_ID
      });

      assert.equal(index.boundaries.artifactExecutionAvailable, false);
      assert.equal(index.boundaries.shellExecutionAvailable, false);
      assert.equal(index.boundaries.modelInvocationAvailable, false);
      assert.equal(index.boundaries.gitWriteAvailable, false);
      assert.equal(index.boundaries.mergeAvailable, false);
      assert.equal(index.boundaries.pushAvailable, false);
      assert.equal(index.boundaries.publishAvailable, false);
      assert.equal(index.boundaries.selfApprovalAvailable, false);
      assert.equal(index.boundaries.artifactDownloadAvailable, false);
      assert.equal(index.boundaries.localFileOpenAvailable, false);
      assert.equal(index.boundaries.secondArtifactStoreAvailable, false);
      assert.equal(index.boundaries.canonicalSource, 'ArtifactStore is canonical, index is derived cache only');
    });

    it('context declares canonicalSource and indexRole correctly', async () => {
      const index = await buildArtifactIndex({
        artifactStoreDir,
        stateDir,
        goalId: V36_GOAL_ID,
        taskId: 'task-1'
      });

      assert.equal(index.context.canonicalSource, 'ArtifactStore');
      assert.equal(index.context.indexRole, 'derived-cache-and-search-only');
      assert.equal(index.context.stateSource, 'explicit-backend-contracts');
      assert.equal(index.context.goalId, V36_GOAL_ID);
      assert.equal(index.context.taskId, 'task-1');
      assert.ok(Array.isArray(index.context.dataSources));
    });
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
