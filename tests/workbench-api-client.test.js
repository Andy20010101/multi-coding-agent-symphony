import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  READONLY_API_ROUTES,
  fetchReadonlyRoute,
  fetchWorkbenchContracts
} from '../frontend/workbench/src/api/client.js';
import {
  CONTRACT_TEXT,
  projectArtifactRefs
} from '../frontend/workbench/src/api/contracts.js';

describe('v15 Workbench read-only API client', () => {
  it('exposes only the approved read-only route list', () => {
    assert.deepEqual(
      READONLY_API_ROUTES.map((route) => [route.method, route.path, route.contractName]),
      [
        ['GET', '/api/summary', 'symphony.console-snapshot'],
        ['GET', '/api/readiness', 'symphony.console-readiness'],
        ['GET', '/api/runs', 'symphony.console-runs'],
        ['GET', '/api/runs/latest', 'symphony.console-run']
      ]
    );
  });

  it('uses GET for every client request', async () => {
    const calls = [];
    const fetchImpl = async (path, init) => {
      calls.push([path, init]);

      return {
        ok: true,
        status: 200,
        async json() {
          const route = READONLY_API_ROUTES.find((candidate) => candidate.path === path);

          return {
            contractName: route.contractName,
            contractVersion: '1'
          };
        }
      };
    };

    for (const route of READONLY_API_ROUTES) {
      const result = await fetchReadonlyRoute(route, { fetchImpl });

      assert.equal(result.ok, true);
    }

    assert.deepEqual(
      calls.map(([path, init]) => [path, init.method, init.cache, init.headers.Accept, Object.hasOwn(init, 'body')]),
      READONLY_API_ROUTES.map((route) => [route.path, 'GET', 'no-store', 'application/json', false])
    );
  });

  it('returns read-only error state for non-OK responses', async () => {
    const result = await fetchReadonlyRoute(READONLY_API_ROUTES[0], {
      fetchImpl: async () => ({
        ok: false,
        status: 503,
        async json() {
          return {
            status: 'error'
          };
        }
      })
    });

    assert.equal(result.ok, false);
    assert.equal(result.readonly, true);
    assert.equal(result.httpStatus, 503);
    assert.match(result.message, /读取失败/u);
  });

  it('projects missing artifact preview fields as contract gaps instead of inferred values', async () => {
    const artifactRefs = projectArtifactRefs([{
      kind: 'summary',
      path: '/tmp/example/summary.json'
    }]);

    assert.equal(artifactRefs.count, 1);
    assert.equal(artifactRefs.items[0].kind.text, 'summary');
    assert.equal(artifactRefs.items[0].path.text, '/tmp/example/summary.json');
    assert.deepEqual(
      artifactRefs.items[0].previewFields.map((field) => [field.label, field.text]),
      [
        ['uri/ref', CONTRACT_TEXT.missing],
        ['mime', CONTRACT_TEXT.missing],
        ['title/displayTitle', CONTRACT_TEXT.missing],
        ['safeToRenderInline', CONTRACT_TEXT.missing],
        ['sourceRunId', CONTRACT_TEXT.missing],
        ['artifactKind', CONTRACT_TEXT.missing],
        ['previewAvailable', CONTRACT_TEXT.missing],
        ['sizeBytes', CONTRACT_TEXT.missing]
      ]
    );

    for (const field of ['uri', 'ref', 'mime', 'title', 'displayTitle', 'safeToRenderInline', 'sourceRunId', 'artifactKind', 'previewAvailable', 'sizeBytes']) {
      assert.equal(Object.hasOwn(artifactRefs.items[0], field), false);
    }
  });

  it('binds summary, readiness, runs, and latest run without creating shared capabilities', async () => {
    const payloadByPath = new Map([
      ['/api/summary', {
        contractName: 'symphony.console-snapshot',
        contractVersion: '1',
        status: 'ready',
        overview: {
          status: 'attention',
          headline: 'Pending adoption is ready for review.',
          latestRunId: 'run-1',
          nextAction: 'symphony status'
        },
        stageSummary: {
          status: 'candidate',
          stageId: 'v15-workbench-react-vite-migration'
        },
        adoptionSummary: {
          status: 'pending',
          pendingCount: 1,
          dirtyBlocked: false
        },
        runStats: {
          total: 1
        },
        latestRun: {
          runId: 'run-1',
          status: 'adoption-planned',
          verifierStatus: 'passed',
          modelInvocation: false,
          executionPlanId: 'plan-1',
          adoptionPlanId: 'adoption-1',
          createdAt: '2026-05-27T00:00:00.000Z',
          updatedAt: '2026-05-27T00:01:00.000Z',
          artifactRefs: [{
            kind: 'adoption-plan',
            path: '/tmp/example/adoption.json'
          }]
        }
      }],
      ['/api/readiness', {
        contractName: 'symphony.console-readiness',
        contractVersion: '1',
        status: 'attention',
        readOnly: true,
        modelInvocation: false,
        tools: {
          git: {
            dirty: true,
            dirtyFilesCount: 2,
            dirtyPaths: ['README.md', 'src/example.js']
          },
          packageManager: {
            status: 'available'
          }
        },
        checks: [{
          id: 'git',
          label: 'Git worktree',
          status: 'attention',
          detail: '2 dirty'
        }],
        riskSummary: {
          status: 'attention',
          total: 1,
          items: [{
            id: 'dirty_git',
            category: 'dirty_git',
            severity: 'medium',
            title: 'Dirty git worktree',
            detail: '2 dirty file(s)'
          }]
        }
      }],
      ['/api/runs', {
        contractName: 'symphony.console-runs',
        contractVersion: '1',
        filter: 'all',
        availableFilters: ['all'],
        runs: [{
          runId: 'run-1',
          status: 'adoption-planned',
          verifierStatus: 'passed',
          intent: 'adopt',
          command: 'symphony adopt',
          semanticCommand: 'adopt',
          routeDecision: {
            intent: 'adopt',
            safetyMode: 'dry-run'
          },
          createdAt: '2026-05-27T00:00:00.000Z',
          updatedAt: '2026-05-27T00:01:00.000Z',
          artifactRefs: [{
            kind: 'adoption-plan',
            path: '/tmp/example/adoption.json'
          }]
        }]
      }],
      ['/api/runs/latest', {
        contractName: 'symphony.console-run',
        contractVersion: '1',
        run: {
          runId: 'run-1',
          status: 'adoption-planned',
          verifierStatus: 'passed',
          modelInvocation: false,
          executionPlanId: 'plan-1',
          adoptionPlanId: 'adoption-1',
          createdAt: '2026-05-27T00:00:00.000Z',
          updatedAt: '2026-05-27T00:01:00.000Z',
          timeline: [{
            id: 'created',
            status: 'done'
          }],
          artifactRefs: [{
            kind: 'adoption-plan',
            path: '/tmp/example/adoption.json'
          }]
        }
      }]
    ]);

    const model = await fetchWorkbenchContracts({
      fetchImpl: async (path) => ({
        ok: true,
        status: 200,
        async json() {
          return payloadByPath.get(path);
        }
      })
    });

    assert.equal(model.summary.capabilities.text, CONTRACT_TEXT.missing);
    assert.equal(model.readiness.capabilities.text, CONTRACT_TEXT.missing);
    assert.equal(model.readiness.readOnly.value, true);
    assert.equal(model.readiness.modelInvocation.value, false);
    assert.equal(model.readiness.checks.count, 1);
    assert.equal(model.readiness.checks.items[0].status.value, 'attention');
    assert.equal(model.readiness.diagnostics.items[0].category.value, 'dirty_git');
    assert.equal(model.latestRun.modelInvocation.value, false);
    assert.equal(model.latestRun.executionPlanId.value, 'plan-1');
    assert.equal(model.latestRun.adoptionPlanId.value, 'adoption-1');
    assert.equal(model.latestRun.timeline.text, '1 个事件');
    assert.equal(model.adoption.pendingCount.value, 1);
    assert.equal(model.adoption.dirtyBlocked.value, false);
    assert.equal(model.adoption.gitDirtyReadiness.value, true);
    assert.equal(model.runs.items.length, 1);
    assert.equal(model.runs.items[0].isLatest.value, true);
    assert.equal(model.runs.items[0].routeKey.text, CONTRACT_TEXT.missing);
    assert.equal(model.runs.items[0].artifactRefs.count, 1);
    assert.equal(model.artifactRefs.missingPreviewFields.includes('mime'), true);
  });
});
