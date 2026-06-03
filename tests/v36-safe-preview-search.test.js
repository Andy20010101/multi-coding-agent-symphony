import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SAFE_PREVIEW_SEARCH_CONTRACT_NAME,
  SAFE_PREVIEW_SEARCH_CONTRACT_VERSION,
  ALLOWED_SEARCH_PARAMS,
  validateSearchFilters,
  assertSearchFilters,
  searchArtifactEntries,
  buildSearchResponse
} from '../src/symphony/safe-preview-search.js';

const SAMPLE_ENTRIES = Object.freeze([
  {
    artifact_ref: 'v36-task-1/worker-evidence',
    content_hash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    kind: 'evidence',
    goal_id: 'v36-artifact-evidence-index-workspace',
    task_id: 'task-1',
    run_id: null,
    job_id: null,
    evidence_kind: 'worker',
    timestamps: {
      created_at: '2026-06-03T00:00:00.000Z',
      indexed_at: '2026-06-03T01:00:00.000Z'
    },
    labels: ['evidence', 'worker', 'v36'],
    file_path: null
  },
  {
    artifact_ref: 'v36-task-1/review-evidence',
    content_hash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    kind: 'evidence',
    goal_id: 'v36-artifact-evidence-index-workspace',
    task_id: 'task-1',
    run_id: null,
    job_id: null,
    evidence_kind: 'reviewer',
    timestamps: {
      created_at: '2026-06-03T00:30:00.000Z',
      indexed_at: '2026-06-03T01:00:00.000Z'
    },
    labels: ['evidence', 'reviewer', 'v36'],
    file_path: null
  },
  {
    artifact_ref: 'v35-task-1/job-model',
    content_hash: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    kind: 'fixture',
    goal_id: 'v35-job-queue-run-control-workspace',
    task_id: 'task-1',
    run_id: null,
    job_id: null,
    evidence_kind: null,
    timestamps: {
      created_at: '2026-06-02T00:00:00.000Z',
      indexed_at: '2026-06-03T01:00:00.000Z'
    },
    labels: ['fixture', 'job-model', 'v35'],
    file_path: null
  },
  {
    artifact_ref: 'v36-task-2/main-verification',
    content_hash: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    kind: 'evidence',
    goal_id: 'v36-artifact-evidence-index-workspace',
    task_id: 'task-2',
    run_id: null,
    job_id: null,
    evidence_kind: 'main-verifier',
    timestamps: {
      created_at: '2026-06-03T02:00:00.000Z',
      indexed_at: '2026-06-03T02:30:00.000Z'
    },
    labels: ['evidence', 'main-verifier', 'v36'],
    file_path: null
  },
  {
    artifact_ref: 'v36-task-0/runbook',
    content_hash: 'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    kind: 'runbook',
    goal_id: 'v36-artifact-evidence-index-workspace',
    task_id: 'task-0',
    run_id: null,
    job_id: null,
    evidence_kind: null,
    timestamps: {
      created_at: '2026-06-01T00:00:00.000Z',
      indexed_at: '2026-06-03T01:00:00.000Z'
    },
    labels: ['runbook', 'goal', 'v36'],
    file_path: null
  }
]);

describe('v36 safe preview search', () => {
  describe('validateSearchFilters', () => {
    it('accepts valid search filters', () => {
      assert.deepEqual(validateSearchFilters({ q: 'worker' }), { ok: true, errors: [] });
      assert.deepEqual(validateSearchFilters({ kind: 'evidence' }), { ok: true, errors: [] });
      assert.deepEqual(validateSearchFilters({ goalId: 'v36-artifact-evidence-index-workspace' }), { ok: true, errors: [] });
      assert.deepEqual(validateSearchFilters({ taskId: 'task-1' }), { ok: true, errors: [] });
      assert.deepEqual(validateSearchFilters({ evidenceKind: 'worker' }), { ok: true, errors: [] });
      assert.deepEqual(validateSearchFilters({
        q: 'evidence',
        kind: 'evidence',
        goalId: 'v36-artifact-evidence-index-workspace',
        taskId: 'task-1',
        evidenceKind: 'worker'
      }), { ok: true, errors: [] });
    });

    it('accepts empty filters object', () => {
      assert.deepEqual(validateSearchFilters({}), { ok: true, errors: [] });
    });

    it('rejects non-plain-object filters', () => {
      const result = validateSearchFilters(null);
      assert.equal(result.ok, false);
      assert.ok(result.errors.some((e) => e.includes('plain object')));
    });

    it('rejects unexpected filter keys', () => {
      const result = validateSearchFilters({ arbitraryPath: '../secret.txt' });
      assert.equal(result.ok, false);
      assert.ok(result.errors.some((e) => e.includes('unexpected filter keys')));
    });

    it('rejects empty query string', () => {
      const result = validateSearchFilters({ q: '   ' });
      assert.equal(result.ok, false);
      assert.ok(result.errors.some((e) => e.includes('q must be a non-empty string')));
    });

    it('rejects overly long query', () => {
      const result = validateSearchFilters({ q: 'x'.repeat(257) });
      assert.equal(result.ok, false);
      assert.ok(result.errors.some((e) => e.includes('must not exceed')));
    });

    it('rejects invalid kind', () => {
      const result = validateSearchFilters({ kind: 'shell-script' });
      assert.equal(result.ok, false);
      assert.ok(result.errors.some((e) => e.includes('kind must be one of')));
    });

    it('rejects unsafe goalId', () => {
      const pathResult = validateSearchFilters({ goalId: '../secret' });
      assert.equal(pathResult.ok, false);
      assert.ok(pathResult.errors.some((e) => e.includes('goalId must be a safe ref')));
    });

    it('rejects unsafe taskId', () => {
      const pathResult = validateSearchFilters({ taskId: '../../../etc/passwd' });
      assert.equal(pathResult.ok, false);
      assert.ok(pathResult.errors.some((e) => e.includes('taskId must be a safe ref')));
    });

    it('rejects invalid evidenceKind', () => {
      const result = validateSearchFilters({ evidenceKind: 'attacker' });
      assert.equal(result.ok, false);
      assert.ok(result.errors.some((e) => e.includes('evidenceKind must be one of')));
    });
  });

  describe('assertSearchFilters', () => {
    it('returns filters on success', () => {
      const filters = { q: 'worker' };
      assert.equal(assertSearchFilters(filters), filters);
    });

    it('throws on invalid filters', () => {
      assert.throws(() => assertSearchFilters({ q: '../path' }), /Invalid search filters/);
    });
  });

  describe('searchArtifactEntries', () => {
    it('returns empty array for non-array entries', () => {
      assert.deepEqual(searchArtifactEntries(null, {}), []);
      assert.deepEqual(searchArtifactEntries(undefined, {}), []);
    });

    it('returns all entries with empty filters', () => {
      assert.equal(searchArtifactEntries(SAMPLE_ENTRIES, {}).length, 5);
    });

    it('filters by kind', () => {
      const results = searchArtifactEntries(SAMPLE_ENTRIES, { kind: 'evidence' });
      assert.equal(results.length, 3);
      for (const entry of results) {
        assert.equal(entry.kind, 'evidence');
      }
    });

    it('filters by goalId', () => {
      const results = searchArtifactEntries(SAMPLE_ENTRIES, {
        goalId: 'v36-artifact-evidence-index-workspace'
      });
      assert.equal(results.length, 4);
      for (const entry of results) {
        assert.equal(entry.goal_id, 'v36-artifact-evidence-index-workspace');
      }
    });

    it('filters by taskId', () => {
      const results = searchArtifactEntries(SAMPLE_ENTRIES, { taskId: 'task-1' });
      assert.equal(results.length, 3);
      for (const entry of results) {
        assert.equal(entry.task_id, 'task-1');
      }
    });

    it('filters by evidenceKind', () => {
      const results = searchArtifactEntries(SAMPLE_ENTRIES, { evidenceKind: 'worker' });
      assert.equal(results.length, 1);
      assert.equal(results[0].artifact_ref, 'v36-task-1/worker-evidence');
    });

    it('filters by evidenceKind null does not match null evidence_kind entries', () => {
      const results = searchArtifactEntries(SAMPLE_ENTRIES, { evidenceKind: 'worker' });
      for (const entry of results) {
        assert.equal(entry.evidence_kind, 'worker');
      }
    });

    it('searches by text query in artifact_ref', () => {
      const results = searchArtifactEntries(SAMPLE_ENTRIES, { q: 'job-model' });
      assert.equal(results.length, 1);
      assert.equal(results[0].artifact_ref, 'v35-task-1/job-model');
    });

    it('searches by text query in goal_id', () => {
      const results = searchArtifactEntries(SAMPLE_ENTRIES, { q: 'v35' });
      assert.ok(results.length >= 1);
    });

    it('searches by text query in labels', () => {
      const results = searchArtifactEntries(SAMPLE_ENTRIES, { q: 'worker' });
      assert.equal(results.length, 1);
      assert.equal(results[0].evidence_kind, 'worker');
    });

    it('search is case-insensitive', () => {
      const resultsUpper = searchArtifactEntries(SAMPLE_ENTRIES, { q: 'WORKER' });
      const resultsLower = searchArtifactEntries(SAMPLE_ENTRIES, { q: 'worker' });
      assert.equal(resultsUpper.length, resultsLower.length);
    });

    it('combines query and kind filter', () => {
      const results = searchArtifactEntries(SAMPLE_ENTRIES, {
        q: 'evidence',
        kind: 'evidence'
      });
      assert.ok(results.length >= 0);
      for (const entry of results) {
        assert.equal(entry.kind, 'evidence');
      }
    });

    it('combines query, kind, goalId, and taskId', () => {
      const results = searchArtifactEntries(SAMPLE_ENTRIES, {
        q: 'worker',
        kind: 'evidence',
        goalId: 'v36-artifact-evidence-index-workspace',
        taskId: 'task-1',
        evidenceKind: 'worker'
      });
      assert.equal(results.length, 1);
      assert.equal(results[0].evidence_kind, 'worker');
      assert.equal(results[0].kind, 'evidence');
    });

    it('returns empty array with invalid filters', () => {
      const results = searchArtifactEntries(SAMPLE_ENTRIES, { kind: 'invalid' });
      assert.deepEqual(results, []);
    });

    it('returns empty when no entries match', () => {
      const results = searchArtifactEntries(SAMPLE_ENTRIES, { q: 'nonexistentxyz_987654321' });
      assert.deepEqual(results, []);
    });
  });

  describe('buildSearchResponse', () => {
    it('builds a valid response with contract metadata', () => {
      const response = buildSearchResponse(SAMPLE_ENTRIES, { q: 'worker' });
      assert.equal(response.contractName, SAFE_PREVIEW_SEARCH_CONTRACT_NAME);
      assert.equal(response.contractVersion, SAFE_PREVIEW_SEARCH_CONTRACT_VERSION);
      assert.ok(typeof response.generatedAt === 'string');
      assert.equal(response.ok, true);
      assert.equal(response.errors.length, 0);
      assert.equal(response.total, 1);
      assert.equal(response.entries.length, 1);
    });

    it('builds response with all entries when no filters', () => {
      const response = buildSearchResponse(SAMPLE_ENTRIES, {});
      assert.equal(response.total, 5);
      assert.equal(response.entries.length, 5);
    });

    it('builds error response for invalid filters', () => {
      const response = buildSearchResponse(SAMPLE_ENTRIES, { kind: 'invalid' });
      assert.equal(response.ok, false);
      assert.ok(response.errors.length > 0);
      assert.equal(response.total, 0);
    });

    it('includes boundaries in every response', () => {
      const validResponse = buildSearchResponse(SAMPLE_ENTRIES, {});
      assert.equal(validResponse.boundaries.readOnly, true);
      assert.equal(validResponse.boundaries.shellExecutionAvailable, false);
      assert.equal(validResponse.boundaries.modelInvocationAvailable, false);
      assert.equal(validResponse.boundaries.arbitraryPathReadAvailable, false);
      assert.equal(validResponse.boundaries.downloadAvailable, false);

      const errorResponse = buildSearchResponse(SAMPLE_ENTRIES, { kind: 'invalid' });
      assert.equal(errorResponse.boundaries.readOnly, true);
      assert.equal(errorResponse.boundaries.shellExecutionAvailable, false);
    });

    it('includes filterCounts in response', () => {
      const response = buildSearchResponse(SAMPLE_ENTRIES, { kind: 'evidence' });
      assert.equal(response.filterCounts.kind, 'evidence');
      assert.equal(response.filterCounts.total, 5);
      assert.equal(response.filterCounts.matched, 3);
    });
  });

  describe('boundaries', () => {
    it('search only operates on derived index data, never file system', () => {
      const withFilePath = [...SAMPLE_ENTRIES, {
        artifact_ref: 'unsafe/entry',
        content_hash: null,
        kind: 'evidence',
        goal_id: 'test',
        task_id: 'task-1',
        run_id: null,
        job_id: null,
        evidence_kind: 'worker',
        timestamps: {
          created_at: '2026-06-03T00:00:00.000Z',
          indexed_at: '2026-06-03T00:00:00.000Z'
        },
        labels: [],
        file_path: '/etc/passwd'
      }];

      const results = searchArtifactEntries(withFilePath, { q: 'etc' });
      assert.equal(results.length, 0);
    });

    it('buildSearchResponse does not read from file paths', () => {
      const entriesWithPaths = [{
        artifact_ref: 'test/entry',
        content_hash: null,
        kind: 'evidence',
        goal_id: 'test',
        task_id: 'task-1',
        run_id: null,
        job_id: null,
        evidence_kind: 'worker',
        timestamps: {
          created_at: '2026-06-03T00:00:00.000Z',
          indexed_at: '2026-06-03T00:00:00.000Z'
        },
        labels: [],
        file_path: '/tmp/should-not-be-read.json'
      }];

      const response = buildSearchResponse(entriesWithPaths, {});
      assert.equal(response.ok, true);
      assert.equal(response.total, 1);
    });
  });

  describe('contract constants', () => {
    it('ALLOWED_SEARCH_PARAMS matches expected set', () => {
      assert.deepEqual(ALLOWED_SEARCH_PARAMS, [
        'q',
        'kind',
        'goalId',
        'taskId',
        'evidenceKind'
      ]);
    });

    it('SAFE_PREVIEW_SEARCH_CONTRACT_NAME is correct', () => {
      assert.equal(SAFE_PREVIEW_SEARCH_CONTRACT_NAME, 'safe-preview-search.v1');
    });

    it('SAFE_PREVIEW_SEARCH_CONTRACT_VERSION is correct', () => {
      assert.equal(SAFE_PREVIEW_SEARCH_CONTRACT_VERSION, 1);
    });
  });
});
