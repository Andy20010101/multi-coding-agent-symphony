import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  READONLY_API_ROUTES,
  fetchReadonlyRoute,
  fetchWorkbenchContracts
} from '../frontend/workbench/src/api/client.js';
import {
  CONTRACT_TEXT,
  READONLY_API_ROUTE_ALLOWLIST,
  createSafeArtifactPreviewRoutes,
  createRunTimelineRoute,
  projectArtifactRefs,
  projectWorkbenchContracts
} from '../frontend/workbench/src/api/contracts.js';

const GUIDED_HANDOFF_PATH = '/api/handoff/guided-goal-handoff.v1';

describe('v15 Workbench read-only API client', () => {
  it('exposes only the approved read-only route list', () => {
    assert.deepEqual(
      READONLY_API_ROUTES.map((route) => [route.method, route.path, route.contractName]),
      [
        ['GET', '/api/summary', 'symphony.console-snapshot'],
        ['GET', '/api/readiness', 'symphony.console-readiness'],
        ['GET', '/api/handoff', 'symphony.handoff-refs'],
        ['GET', '/api/runs', 'symphony.console-runs'],
        ['GET', '/api/runs/latest', 'symphony.console-run'],
        ['GET', '/api/goals', 'symphony.goals-index'],
        ['GET', '/api/goals/latest/progress', 'goal-progress-ledger.v1'],
        ['GET', '/api/goals/latest/events', 'goal-event-log.v1'],
        ['GET', '/api/capabilities', 'capabilities.v1'],
        ['GET', '/api/diagnostics', 'diagnostics.v1']
      ]
    );
    assert.deepEqual(
      READONLY_API_ROUTE_ALLOWLIST.map((route) => [route.method, route.path, route.contractName]),
      [
        ['GET', '/api/summary', 'symphony.console-snapshot'],
        ['GET', '/api/readiness', 'symphony.console-readiness'],
        ['GET', '/api/handoff', 'symphony.handoff-refs'],
        ['GET', '/api/runs', 'symphony.console-runs'],
        ['GET', '/api/runs/latest', 'symphony.console-run'],
        ['GET', '/api/goals', 'symphony.goals-index'],
        ['GET', '/api/goals/latest/progress', 'goal-progress-ledger.v1'],
        ['GET', '/api/goals/latest/events', 'goal-event-log.v1'],
        ['GET', '/api/capabilities', 'capabilities.v1'],
        ['GET', '/api/diagnostics', 'diagnostics.v1'],
        ['GET', '/api/goals/<goal-id>/events', 'goal-event-log.v1'],
        ['GET', '/api/goals/<goal-id>/progress', 'goal-progress-ledger.v1'],
        ['GET', '/api/handoff/<ref>', 'guided-goal-handoff.v1'],
        ['GET', '/api/runs/<run-id>/timeline', 'symphony.console-run-timeline'],
        ['GET', '/api/runs/<run-id>/artifacts/<artifact-kind>/preview', 'safe-artifact-preview.v1']
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

    const timelineRoute = createRunTimelineRoute('run 1/slash');
    const timelineResult = await fetchReadonlyRoute(timelineRoute, {
      fetchImpl: async (path, init) => {
        calls.push([path, init]);

        return {
          ok: true,
          status: 200,
          async json() {
            return {
              contractName: 'symphony.console-run-timeline',
              contractVersion: '1',
              runId: 'run 1/slash',
              timeline: []
            };
          }
        };
      }
    });

    assert.equal(timelineResult.ok, true);
    assert.equal(timelineRoute.path, '/api/runs/run%201%2Fslash/timeline');

    const [previewRoute] = createSafeArtifactPreviewRoutes([{
      kind: 'summary',
      ref: 'artifact:run-1:summary',
      uri: '/api/runs/run-1/artifacts/summary/preview'
    }]);
    const previewResult = await fetchReadonlyRoute(previewRoute, {
      fetchImpl: async (path, init) => {
        calls.push([path, init]);

        return {
          ok: true,
          status: 200,
          async json() {
            return {
              contractName: 'safe-artifact-preview.v1',
              contractVersion: '1',
              previewAvailable: true,
              safeToRenderInline: true
            };
          }
        };
      }
    });

    assert.equal(previewResult.ok, true);
    assert.equal(previewRoute.path, '/api/runs/run-1/artifacts/summary/preview');

    assert.deepEqual(
      calls.map(([path, init]) => [path, init.method, init.cache, init.headers.Accept, Object.hasOwn(init, 'body')]),
      [
        ...READONLY_API_ROUTES.map((route) => [route.path, 'GET', 'no-store', 'application/json', false]),
        ['/api/runs/run%201%2Fslash/timeline', 'GET', 'no-store', 'application/json', false],
        ['/api/runs/run-1/artifacts/summary/preview', 'GET', 'no-store', 'application/json', false]
      ]
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

  it('projects no-runs empty state without fetching timeline', async () => {
    const calls = [];
    const payloadByPath = new Map([
      ['/api/summary', {
        contractName: 'symphony.console-snapshot',
        contractVersion: '1',
        status: 'no-runs',
        latestRun: null,
        runStats: {
          total: 0
        }
      }],
      ['/api/readiness', {
        contractName: 'symphony.console-readiness',
        contractVersion: '1',
        status: 'ready',
        readOnly: true,
        modelInvocation: false
      }],
      ['/api/handoff', createHandoffRefsPayload()],
      [GUIDED_HANDOFF_PATH, createGuidedHandoffPayload()],
      ['/api/runs', {
        contractName: 'symphony.console-runs',
        contractVersion: '1',
        filter: 'all',
        availableFilters: ['all'],
        runs: []
      }],
      ...createV17ReadonlyPayloadEntries()
    ]);

    const model = await fetchWorkbenchContracts({
      fetchImpl: async (path) => {
        calls.push(path);

        if (path === '/api/runs/latest') {
          return {
            ok: false,
            status: 404,
            async json() {
              return {};
            }
          };
        }

        return {
          ok: true,
          status: 200,
          async json() {
            return payloadByPath.get(path);
          }
        };
      }
    });

    assert.equal(calls.includes('/api/runs/<run-id>/timeline'), false);
    assert.equal(calls.some((path) => path.endsWith('/timeline')), false);
    assert.equal(model.latestRun.state, 'empty');
    assert.equal(model.latestRunTimeline.state, 'empty');
    assert.equal(model.latestRunTimeline.note, '暂无 timeline；当前没有 latest run。');
    assert.equal(model.artifactRefs.state, 'missing');
    assert.equal(model.handoff.state, 'available');
    assert.equal(model.handoff.commandBlocks.copyOnly.value, true);
    assert.equal(model.routeStates.find((route) => route.id === 'latestRunTimeline').state, 'skipped');
  });

  it('projects missing artifact preview fields as contract gaps instead of inferred values', async () => {
    const artifactRefs = projectArtifactRefs([{
      kind: 'summary',
      path: '/tmp/example/summary.json'
    }], {
      status: 'ok',
      total: 1,
      available: 1,
      missing: 0,
      unknown: 0,
      missingKinds: []
    });

    assert.equal(artifactRefs.count, 1);
    assert.equal(artifactRefs.items[0].kind.text, 'summary');
    assert.equal(artifactRefs.items[0].status.text, 'available');
    assert.equal(artifactRefs.items[0].path.text, '/tmp/example/summary.json');
    assert.equal(artifactRefs.items[0].ref.text, CONTRACT_TEXT.missing);
    assert.equal(artifactRefs.items[0].preview.state, 'missing');
    assert.equal(artifactRefs.items[0].preview.inline.state, 'missing');
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

    for (const field of ['mime', 'title', 'displayTitle', 'safeToRenderInline', 'sourceRunId', 'artifactKind', 'previewAvailable', 'sizeBytes']) {
      assert.equal(Object.hasOwn(artifactRefs.items[0], field), false);
    }
  });

  it('projects goal events timeline and evidence matrix without reading evidence refs', async () => {
    const calls = [];
    const payloadByPath = new Map([
      ['/api/summary', {
        contractName: 'symphony.console-snapshot',
        contractVersion: '1',
        status: 'no-runs',
        latestRun: null,
        runStats: {
          total: 0
        }
      }],
      ['/api/readiness', {
        contractName: 'symphony.console-readiness',
        contractVersion: '1',
        status: 'ready',
        readOnly: true,
        modelInvocation: false
      }],
      ['/api/handoff', createHandoffRefsPayload()],
      [GUIDED_HANDOFF_PATH, createGuidedHandoffPayload()],
      ['/api/runs', {
        contractName: 'symphony.console-runs',
        contractVersion: '1',
        filter: 'all',
        availableFilters: ['all'],
        runs: []
      }],
      ...createV17ReadonlyPayloadEntries(),
      ['/api/goals/latest/events', createGoalEventsPayload()]
    ]);

    const model = await fetchWorkbenchContracts({
      fetchImpl: async (path, init) => {
        calls.push([path, init]);

        if (path === '/api/runs/latest') {
          return {
            ok: false,
            status: 404,
            async json() {
              return {};
            }
          };
        }

        return {
          ok: true,
          status: 200,
          async json() {
            return payloadByPath.get(path);
          }
        };
      }
    });

    assert.equal(model.goalEvents.contractName.value, 'goal-event-log.v1');
    assert.equal(model.goalEvents.timeline.count.value, 5);
    assert.equal(model.goalEvents.timeline.items[0].sequence.value, 1);
    assert.equal(model.goalEvents.timeline.items[0].eventType.value, 'worker.self-check-passed');
    assert.equal(model.goalEvents.timeline.items[0].hashChainStatus.value, 'genesis');
    assert.equal(model.goalEvents.timeline.items[1].reviewVerdict.value, 'APPROVED');
    assert.equal(model.goalEvents.timeline.items[3].gateStatus.value, 'passed');
    assert.equal(model.goalEvents.timeline.items[3].evidenceRefs.items[0].ref.value, 'docs/plans/v18-release-evidence-2026-05-28.md');
    assert.equal(model.goalEvents.timeline.items[4].gateStatus.value, 'declared');

    assert.equal(model.goalEvents.evidenceMatrix.tasks.items[0].workerEvidence.value, 'docs/plans/v18-task8-worker-evidence-2026-05-28.md');
    assert.equal(model.goalEvents.evidenceMatrix.tasks.items[0].reviewVerdict.value, 'APPROVED');
    assert.equal(model.goalEvents.evidenceMatrix.tasks.items[0].reviewEvidence.value, 'docs/plans/v18-task8-review-evidence-2026-05-28.md');
    assert.equal(model.goalEvents.evidenceMatrix.tasks.items[0].mainVerification.value, 'docs/plans/v18-task8-main-verification-evidence-2026-05-28.md');
    assert.equal(model.goalEvents.evidenceMatrix.tasks.items[0].blocker.value, 'missing');
    assert.equal(model.goalEvents.evidenceMatrix.releaseGates.items[0].gate.value, 'release.pnpm-check');
    assert.equal(model.goalEvents.evidenceMatrix.releaseGates.items[0].status.value, 'passed');
    assert.equal(model.goalEvents.evidenceMatrix.releaseReady.status.value, 'declared');

    assert.deepEqual(
      calls.map(([path, init]) => [path, init.method, Object.hasOwn(init, 'body')]),
      [
        ...READONLY_API_ROUTES.map((route) => [route.path, 'GET', false]),
        [GUIDED_HANDOFF_PATH, 'GET', false]
      ]
    );
    assert.equal(calls.some(([path]) => path.includes('docs/plans/')), false);
  });

  it('keeps event-backed verdicts unknown when the ledger has status but events are empty', async () => {
    const payloadByPath = new Map([
      ...createV17ReadonlyPayloadEntries({
        taskOverrides: {
          status: 'approved',
          reviewVerdict: 'APPROVED',
          reviewEvidenceRef: 'docs/plans/v18-task8-review-evidence-2026-05-28.md',
          mainVerificationRef: 'docs/plans/v18-task8-main-verification-evidence-2026-05-28.md'
        },
        releaseReady: true
      }),
      ['/api/goals/latest/events', createGoalEventsPayload({ events: [] })]
    ]);

    const model = projectWorkbenchContracts({
      goalProgress: {
        ok: true,
        route: '/api/goals/latest/progress',
        method: 'GET',
        routeDescriptor: READONLY_API_ROUTES.find((route) => route.id === 'goalProgress'),
        httpStatus: 200,
        data: payloadByPath.get('/api/goals/latest/progress')
      },
      goalEvents: {
        ok: true,
        route: '/api/goals/latest/events',
        method: 'GET',
        routeDescriptor: READONLY_API_ROUTES.find((route) => route.id === 'goalEvents'),
        httpStatus: 200,
        data: payloadByPath.get('/api/goals/latest/events')
      }
    });

    assert.equal(model.goalEvents.timeline.state, 'empty');
    assert.equal(model.goalEvents.evidenceMatrix.tasks.items[0].ledgerStatus.value, 'approved');
    assert.equal(model.goalEvents.evidenceMatrix.tasks.items[0].reviewVerdict.value, 'unknown');
    assert.equal(model.goalEvents.evidenceMatrix.tasks.items[0].reviewEvidence.value, 'missing');
    assert.equal(model.goalEvents.evidenceMatrix.tasks.items[0].mainVerification.value, 'unknown');
    assert.equal(model.goalEvents.evidenceMatrix.releaseReady.status.value, 'unknown');
  });

  it('fetches and projects backend safe artifact preview contracts without inferring safety', async () => {
    const calls = [];
    const summaryPreviewPath = '/api/runs/run-1/artifacts/summary/preview';
    const htmlPreviewPath = '/api/runs/run-1/artifacts/harness/preview';
    const blockedPreviewPath = '/api/runs/run-1/artifacts/context/preview';
    const payloadByPath = new Map([
      ['/api/summary', {
        contractName: 'symphony.console-snapshot',
        contractVersion: '1',
        status: 'ready',
        latestRun: {
          runId: 'run-1'
        },
        runStats: {
          total: 1
        }
      }],
      ['/api/readiness', {
        contractName: 'symphony.console-readiness',
        contractVersion: '1',
        status: 'ready',
        readOnly: true,
        modelInvocation: false
      }],
      ['/api/handoff', createHandoffRefsPayload()],
      [GUIDED_HANDOFF_PATH, createGuidedHandoffPayload()],
      ['/api/runs', {
        contractName: 'symphony.console-runs',
        contractVersion: '1',
        filter: 'all',
        availableFilters: ['all'],
        runs: []
      }],
      ['/api/runs/latest', {
        contractName: 'symphony.console-run',
        contractVersion: '1',
        run: {
          runId: 'run-1',
          status: 'passed',
          verifierStatus: 'passed',
          modelInvocation: false,
          artifactRefs: [{
            kind: 'summary',
            path: '/tmp/example/summary.json',
            ref: 'artifact:run-1:summary',
            uri: summaryPreviewPath,
            mime: 'application/json',
            previewAvailable: true,
            safeToRenderInline: true,
            sizeBytes: 12
          }, {
            kind: 'harness',
            path: '/tmp/example/unsafe.html',
            ref: 'artifact:run-1:harness',
            uri: htmlPreviewPath,
            mime: 'text/html; charset=utf-8',
            previewAvailable: false,
            safeToRenderInline: false,
            sizeBytes: 31
          }, {
            kind: 'context',
            path: '/tmp/example/package.json',
            ref: 'artifact:run-1:context',
            uri: blockedPreviewPath,
            mime: 'application/json',
            previewAvailable: false,
            safeToRenderInline: false,
            sizeBytes: 0
          }],
          artifactStatus: {
            status: 'ok',
            total: 3,
            available: 3,
            missing: 0,
            unknown: 0,
            missingKinds: []
          }
        }
      }],
      ['/api/runs/run-1/timeline', {
        contractName: 'symphony.console-run-timeline',
        contractVersion: '1',
        runId: 'run-1',
        timeline: []
      }],
      [summaryPreviewPath, {
        contractName: 'safe-artifact-preview.v1',
        contractVersion: '1',
        ref: 'artifact:run-1:summary',
        uri: summaryPreviewPath,
        displayTitle: 'Summary artifact',
        artifactKind: 'intake-summary',
        sourceRunId: 'run-1',
        mime: 'application/json',
        sizeBytes: 12,
        maxPreviewBytes: 204800,
        previewAvailable: true,
        safeToRenderInline: true,
        truncated: false,
        truncationReason: null,
        downloadAvailable: false,
        contentText: '{"ok":true}\n'
      }],
      [htmlPreviewPath, {
        contractName: 'safe-artifact-preview.v1',
        contractVersion: '1',
        ref: 'artifact:run-1:harness',
        uri: htmlPreviewPath,
        displayTitle: 'Harness artifact',
        artifactKind: 'evidence',
        sourceRunId: 'run-1',
        mime: 'text/html; charset=utf-8',
        sizeBytes: 31,
        maxPreviewBytes: 204800,
        previewAvailable: false,
        safeToRenderInline: false,
        truncated: false,
        truncationReason: null,
        downloadAvailable: false,
        contentText: '<script>alert("unsafe")</script>'
      }],
      [blockedPreviewPath, createErrorEnvelope({
        code: 'blocked-artifact-path',
        message: 'Artifact preview is blocked by safety policy.',
        status: 403,
        route: blockedPreviewPath,
        method: 'GET'
      })],
      ...createV17ReadonlyPayloadEntries()
    ]);

    const model = await fetchWorkbenchContracts({
      fetchImpl: async (path, init) => {
        calls.push([path, init]);

        return {
          ok: path !== blockedPreviewPath,
          status: path === blockedPreviewPath ? 403 : 200,
          async json() {
            return payloadByPath.get(path);
          }
        };
      }
    });

    assert.equal(model.artifactRefs.previewRoutes.count, 3);
    assert.equal(model.artifactRefs.items[0].preview.mime.value, 'application/json');
    assert.equal(model.artifactRefs.items[0].preview.inline.state, 'available');
    assert.equal(model.artifactRefs.items[0].preview.inline.text, '{"ok":true}\n');
    assert.equal(model.artifactRefs.items[1].preview.mime.value, 'text/html; charset=utf-8');
    assert.equal(model.artifactRefs.items[1].preview.safeToRenderInline.value, false);
    assert.equal(model.artifactRefs.items[1].preview.inline.state, 'hidden');
    assert.equal(model.artifactRefs.items[1].preview.inline.text, '');
    assert.equal(model.artifactRefs.items[2].preview.status.value, 'blocked-artifact-path');
    assert.equal(model.artifactRefs.items[2].preview.httpStatus.value, 403);
    assert.equal(model.artifactRefs.items[2].preview.errorEnvelope.code.value, 'blocked-artifact-path');
    assert.equal(model.artifactRefs.items[2].preview.inline.reason, 'Artifact preview is blocked by safety policy.');
    assert.deepEqual(
      calls
        .filter(([path]) => path.includes('/artifacts/'))
        .map(([path, init]) => [path, init.method, Object.hasOwn(init, 'body')]),
      [
        [summaryPreviewPath, 'GET', false],
        [htmlPreviewPath, 'GET', false],
        [blockedPreviewPath, 'GET', false]
      ]
    );
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
          }],
          artifactStatus: {
            status: 'missing',
            total: 1,
            available: 0,
            missing: 1,
            unknown: 0,
            missingKinds: ['adoption-plan'],
            missingRefs: [{
              kind: 'adoption-plan',
              path: '/tmp/example/adoption.json',
              status: 'missing'
            }]
          }
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
      ['/api/handoff', createHandoffRefsPayload()],
      [GUIDED_HANDOFF_PATH, createGuidedHandoffPayload()],
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
          }],
          artifactStatus: {
            status: 'missing',
            total: 1,
            available: 0,
            missing: 1,
            unknown: 0,
            missingKinds: ['adoption-plan'],
            missingRefs: [{
              kind: 'adoption-plan',
              path: '/tmp/example/adoption.json',
              status: 'missing'
            }]
          }
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
          }],
          artifactStatus: {
            status: 'missing',
            total: 1,
            available: 0,
            missing: 1,
            unknown: 0,
            missingKinds: ['adoption-plan'],
            missingRefs: [{
              kind: 'adoption-plan',
              path: '/tmp/example/adoption.json',
              status: 'missing'
            }]
          }
        }
      }],
      ['/api/runs/run-1/timeline', {
        contractName: 'symphony.console-run-timeline',
        contractVersion: '1',
        runId: 'run-1',
        timeline: [{
          id: 'created',
          label: 'Run created',
          status: 'done',
          detail: 'run-1',
          at: '2026-05-27T00:00:00.000Z'
        }, {
          id: 'artifacts',
          label: 'Artifacts',
          status: 'done',
          detail: '1 registered'
        }]
      }],
      ...createV17ReadonlyPayloadEntries()
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
    assert.equal(model.latestRunTimeline.count.value, 2);
    assert.equal(model.latestRunTimeline.items[0].id.value, 'created');
    assert.equal(model.latestRunTimeline.items[1].status.value, 'done');
    assert.equal(model.adoption.pendingCount.value, 1);
    assert.equal(model.adoption.dirtyBlocked.value, false);
    assert.equal(model.adoption.gitDirtyReadiness.value, true);
    assert.equal(model.runs.items.length, 1);
    assert.equal(model.runs.items[0].isLatest.value, true);
    assert.equal(model.runs.items[0].routeKey.text, CONTRACT_TEXT.missing);
    assert.equal(model.runs.items[0].artifactRefs.count, 1);
    assert.equal(model.artifactRefs.status.status.value, 'missing');
    assert.equal(model.artifactRefs.items[0].status.value, 'missing');
    assert.equal(model.artifactRefs.missingPreviewFields.includes('mime'), true);
    assert.equal(model.handoff.refs.readOnly.value, true);
    assert.equal(model.handoff.refs.arbitraryPathReads.value, false);
    assert.equal(model.handoff.taskCount.value, 2);
    assert.equal(model.handoff.tasks.items[0].status.text, CONTRACT_TEXT.missing);
    assert.equal(model.handoff.tasks.items[0].evidencePath.value, 'docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md');
    assert.equal(model.handoff.commandBlocks.items[0].title.value, 'Preflight');
    assert.equal(model.handoff.commandBlocks.items[0].commands[0].value, 'git checkout main');
    assert.equal(model.goalProgress.contractName.value, 'goal-progress-ledger.v1');
    assert.equal(model.capabilities.browserExecutionAvailable.value, false);
    assert.equal(model.diagnosticsV1.status.value, 'ok');
  });
});

function createHandoffRefsPayload() {
  return {
    contractName: 'symphony.handoff-refs',
    contractVersion: '1',
    readOnly: true,
    arbitraryPathReads: false,
    refs: [{
      ref: 'guided-goal-handoff.v1',
      contractName: 'guided-goal-handoff.v1',
      contractVersion: '1',
      href: GUIDED_HANDOFF_PATH
    }]
  };
}

function createGuidedHandoffPayload() {
  return {
    contractName: 'guided-goal-handoff.v1',
    contractVersion: '1',
    goalId: 'v16-guided-goal-handoff-safe-artifact-preview',
    title: 'Guided Goal Handoff + Safe Artifact Preview Contract',
    titleZh: '目标执行手册与安全产物预览层',
    baseline: {
      releaseTag: 'v15',
      approvalCommit: '3410509'
    },
    roles: [{
      id: 'planner',
      description: 'Defines scope and task split.',
      inputs: ['v16 plan'],
      outputs: ['approved task plan'],
      prohibited: ['feature implementation']
    }],
    tasks: [{
      id: 'task-1',
      name: 'plan approval and baseline freeze',
      titleZh: '计划批准与基线冻结',
      role: 'planner',
      dependsOn: [],
      evidencePath: 'docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md',
      reviewGate: 'Independent reviewer must approve before commit and merge.'
    }, {
      id: 'task-5',
      name: 'Workbench handoff panel',
      titleZh: 'Workbench handoff 只读面板',
      role: 'worker',
      dependsOn: ['task-4'],
      evidencePath: 'docs/plans/v16-task5-workbench-handoff-panel-evidence-2026-05-27.md',
      reviewGate: 'Independent reviewer must confirm display-only behavior.'
    }],
    commands: {
      copyOnly: true,
      blocks: [{
        id: 'preflight',
        title: 'Preflight',
        copyOnly: true,
        commands: ['git checkout main', 'git pull']
      }]
    },
    reviewModel: {
      contextIsolation: true,
      workerSelfCheckIsFinal: false
    }
  };
}

function createV17ReadonlyPayloadEntries({
  taskOverrides = {},
  releaseReady = false
} = {}) {
  return [
    ['/api/goals', {
      contractName: 'symphony.goals-index',
      contractVersion: 1,
      readOnly: true,
      goals: [{
        goalId: 'v17-readonly-goal-progress-console-contracts',
        goalTitle: 'v17 Read-only Goal Progress Ledger and Console Contract Hardening',
        baseline: {
          tag: 'v16'
        },
        taskCount: 10,
        readOnly: true
      }]
    }],
    ['/api/goals/latest/progress', {
      contractName: 'goal-progress-ledger.v1',
      contractVersion: 1,
      goalId: 'v17-readonly-goal-progress-console-contracts',
      goalTitle: 'v17 Read-only Goal Progress Ledger and Console Contract Hardening',
      baseline: {
        tag: 'v16',
        commit: null,
        evidenceRef: 'docs/plans/v16-tag-release-evidence-2026-05-28.md'
      },
      summary: {
        totalTasks: 1,
        completedTasks: 0,
        blockedTasks: 0,
        needsReviewTasks: 0,
        needsRevisionTasks: 0,
        releaseReady
      },
      tasks: [{
        taskId: 'task-1',
        title: 'Contract fixtures',
        status: 'planned',
        statusSource: 'test',
        branch: 'v17-task1',
        commit: null,
        workerEvidenceRef: null,
        reviewEvidenceRef: null,
        reviewVerdict: null,
        mainVerificationRef: null,
        blockers: [],
        nextCopyOnlyCommand: 'git checkout -b v17-task1',
        ...taskOverrides
      }],
      releaseGates: {
        pnpmCheck: 'unknown',
        pnpmTest: 'unknown',
        workbenchBuild: 'unknown',
        mutationGate: 'unknown',
        auditHigh: 'unknown',
        diffCheck: 'unknown',
        docsUpdated: 'unknown',
        tagEvidence: 'unknown'
      },
      blockers: [],
      nextActions: [{
        kind: 'copy-only-command',
        label: 'Start task',
        command: 'git checkout -b v17-task1'
      }],
      safety: {
        readOnly: true,
        copyOnly: true,
        browserExecutionAvailable: false,
        modelInvocationAvailable: false
      }
    }],
    ['/api/capabilities', {
      contractName: 'capabilities.v1',
      contractVersion: 1,
      readOnly: true,
      displayOnly: true,
      copyOnly: true,
      mutationAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      artifactDownloadAvailable: false,
      safePreview: {
        available: true,
        inlineModes: ['bounded-text'],
        rawHtmlInlineAvailable: false,
        svgInlineAvailable: false,
        javascriptInlineAvailable: false,
        binaryInlineAvailable: false
      },
      routes: {
        handoff: true,
        safePreview: true,
        goalProgress: true,
        diagnostics: true
      }
    }],
    ['/api/diagnostics', {
      contractName: 'diagnostics.v1',
      contractVersion: 1,
      status: 'ok',
      checks: [{
        id: 'state-dir-readable',
        label: 'State directory readable',
        status: 'ok',
        severity: 'info'
      }],
      boundaries: {
        readOnlyApi: true,
        nonGetBlocked: true,
        workbenchFallbackProtected: true,
        arbitraryPathPreviewBlocked: true
      }
    }]
  ];
}

function createGoalEventsPayload({ events } = {}) {
  const resolvedEvents = events ?? [{
    eventId: 'evt_20260528_task8_worker_self_checked',
    sequence: 1,
    goalId: 'v18-goal-event-journal-evidence-recorder',
    taskId: 'task-1',
    eventType: 'worker.self-check-passed',
    phase: 'implement',
    actor: {
      role: 'worker',
      id: 'codex-worker-task-8'
    },
    occurredAt: '2026-05-28T10:00:00.000Z',
    recordedAt: '2026-05-28T10:02:00.000Z',
    branch: 'codex/v18-task8-workbench-events-matrix',
    commit: null,
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/plans/v18-task8-worker-evidence-2026-05-28.md',
      label: 'Task 8 worker evidence'
    }],
    statement: 'Task 8 worker self-check passed.',
    previousEventHash: null,
    eventHash: 'sha256:1111111111111111111111111111111111111111111111111111111111111111'
  }, {
    eventId: 'evt_20260528_task8_review_approved',
    sequence: 2,
    goalId: 'v18-goal-event-journal-evidence-recorder',
    taskId: 'task-1',
    eventType: 'reviewer.approved',
    phase: 'review',
    actor: {
      role: 'reviewer',
      id: 'codex-reviewer-task-8'
    },
    occurredAt: '2026-05-28T10:10:00.000Z',
    recordedAt: '2026-05-28T10:12:00.000Z',
    branch: 'codex/v18-task8-workbench-events-matrix',
    commit: null,
    review: {
      verdict: 'APPROVED',
      scope: 'Task 8 diff and Workbench tests'
    },
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/plans/v18-task8-review-evidence-2026-05-28.md',
      label: 'Task 8 review evidence'
    }],
    statement: 'Independent reviewer approved Task 8.',
    previousEventHash: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
    eventHash: 'sha256:2222222222222222222222222222222222222222222222222222222222222222'
  }, {
    eventId: 'evt_20260528_task8_main_verification_passed',
    sequence: 3,
    goalId: 'v18-goal-event-journal-evidence-recorder',
    taskId: 'task-1',
    eventType: 'main.verification-passed',
    phase: 'main-verification',
    actor: {
      role: 'main-verifier',
      id: 'codex-main-verifier'
    },
    occurredAt: '2026-05-28T10:20:00.000Z',
    recordedAt: '2026-05-28T10:22:00.000Z',
    branch: 'main',
    commit: null,
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/plans/v18-task8-main-verification-evidence-2026-05-28.md',
      label: 'Task 8 main verification evidence'
    }],
    statement: 'Main verification passed for Task 8.',
    previousEventHash: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
    eventHash: 'sha256:3333333333333333333333333333333333333333333333333333333333333333'
  }, {
    eventId: 'evt_20260528_release_gate_pnpm_check_passed',
    sequence: 4,
    goalId: 'v18-goal-event-journal-evidence-recorder',
    taskId: 'release',
    eventType: 'release.gate-passed',
    phase: 'release-gate',
    actor: {
      role: 'release-verifier',
      id: 'codex-release-verifier'
    },
    occurredAt: '2026-05-28T10:30:00.000Z',
    recordedAt: '2026-05-28T10:32:00.000Z',
    branch: 'main',
    commit: null,
    gate: {
      id: 'release.pnpm-check',
      status: 'passed'
    },
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/plans/v18-release-evidence-2026-05-28.md',
      label: 'v18 release evidence'
    }],
    statement: 'Release gate pnpm check passed.',
    previousEventHash: 'sha256:3333333333333333333333333333333333333333333333333333333333333333',
    eventHash: 'sha256:4444444444444444444444444444444444444444444444444444444444444444'
  }, {
    eventId: 'evt_20260528_release_ready_declared',
    sequence: 5,
    goalId: 'v18-goal-event-journal-evidence-recorder',
    taskId: 'release',
    eventType: 'release.ready-declared',
    phase: 'release-prep',
    actor: {
      role: 'release-manager',
      id: 'codex-release-manager'
    },
    occurredAt: '2026-05-28T10:40:00.000Z',
    recordedAt: '2026-05-28T10:42:00.000Z',
    branch: 'main',
    commit: null,
    gate: {
      id: 'release.ready',
      status: 'declared'
    },
    evidenceRefs: [{
      kind: 'repo-doc',
      ref: 'docs/plans/v18-release-evidence-2026-05-28.md',
      label: 'v18 release evidence'
    }],
    statement: 'Release readiness explicitly declared.',
    previousEventHash: 'sha256:4444444444444444444444444444444444444444444444444444444444444444',
    eventHash: 'sha256:5555555555555555555555555555555555555555555555555555555555555555'
  }];

  return {
    contractName: 'goal-event-log.v1',
    contractVersion: 1,
    goalId: 'v18-goal-event-journal-evidence-recorder',
    goalTitle: 'Goal Event Journal + Evidence Recorder',
    baseline: {
      tag: 'v17',
      commit: null,
      evidenceRef: null
    },
    log: {
      appendOnly: true,
      storage: 'managed-goal-event-journal',
      eventCount: resolvedEvents.length,
      firstSequence: resolvedEvents.length === 0 ? null : resolvedEvents[0].sequence,
      lastSequence: resolvedEvents.length === 0 ? null : resolvedEvents.at(-1).sequence,
      lastEventId: resolvedEvents.length === 0 ? null : resolvedEvents.at(-1).eventId,
      lastEventHash: resolvedEvents.length === 0 ? null : resolvedEvents.at(-1).eventHash
    },
    events: resolvedEvents
  };
}

function createErrorEnvelope({ code, message, status, route, method }) {
  return {
    contractName: 'error-envelope.v1',
    contractVersion: 1,
    ok: false,
    error: {
      code,
      message,
      status,
      route,
      method
    }
  };
}
