import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import { appendGoalEvent } from '../src/symphony/goal-event-journal.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';
import {
  READONLY_API_ROUTES,
  confirmGoalEventPlan,
  fetchPromptWorkspaceHandoffBoard,
  fetchPromptWorkspacePromptPack,
  fetchPromptWorkspaceRunbook,
  fetchReadonlyRoute,
  fetchWorkbenchContracts
} from '../frontend/workbench/src/api/client.js';
import {
  CONTRACT_TEXT,
  READONLY_API_ROUTE_ALLOWLIST,
  createSafeArtifactPreviewRoutes,
  createRunTimelineRoute,
  projectArtifactRefs,
  projectSubagentHandoffBoard,
  projectWorkbenchContracts
} from '../frontend/workbench/src/api/contracts.js';

const GUIDED_HANDOFF_PATH = '/api/handoff/guided-goal-handoff.v1';
const V19_GOAL_ID = 'v19-goal-runbook-next-action';
const ACTIVE_GOAL_PROGRESS_PATH = `/api/goals/${V19_GOAL_ID}/progress`;
const ACTIVE_GOAL_EVENTS_PATH = `/api/goals/${V19_GOAL_ID}/events`;
const BACKEND_ACTIVE_GOAL_ID = 'v20-workbench-backend-event-test';
const BACKEND_ACTIVE_GOAL_FIXTURE = 'fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json';

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
        ['GET', '/api/goals/latest/runbook', 'goal-runbook.v1'],
        ['GET', '/api/goals/latest/next', 'goal-next-action.v1'],
        ['GET', '/api/goals/latest/prompt', 'goal-prompt-pack.v1'],
        ['GET', '/api/goals/latest/closeout', 'goal-closeout-report.v1'],
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
        ['GET', '/api/goals/latest/runbook', 'goal-runbook.v1'],
        ['GET', '/api/goals/latest/next', 'goal-next-action.v1'],
        ['GET', '/api/goals/latest/prompt', 'goal-prompt-pack.v1'],
        ['GET', '/api/goals/latest/closeout', 'goal-closeout-report.v1'],
        ['GET', '/api/capabilities', 'capabilities.v1'],
        ['GET', '/api/diagnostics', 'diagnostics.v1'],
        ['GET', '/api/goals/<goal-id>/events', 'goal-event-log.v1'],
        ['GET', '/api/goals/<goal-id>/progress', 'goal-progress-ledger.v1'],
        ['GET', '/api/goals/<goal-id>/runbook', 'goal-runbook.v1'],
        ['GET', '/api/goals/<goal-id>/next', 'goal-next-action.v1'],
        ['GET', '/api/goals/<goal-id>/prompt', 'goal-prompt-pack.v1'],
        ['GET', '/api/goals/<goal-id>/closeout', 'goal-closeout-report.v1'],
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

  it('posts controlled goal event confirm requests with a JSON body and validates the confirmation contract', async () => {
    const calls = [];
    const result = await confirmGoalEventPlan('/api/goals/latest/event-plan-confirm', {
      command: 'update',
      task: 'task-3',
      event: 'worker.evidence-recorded',
      actor: 'codex-v21-task-3-worker',
      evidenceRef: ['docs/plans/v21-task-3-worker-evidence-2026-05-29.md'],
      planHash: 'sha256:1111111111111111111111111111111111111111111111111111111111111111'
    }, {
      fetchImpl: async (path, init) => {
        calls.push([path, init]);

        return {
          ok: true,
          status: 200,
          async json() {
            return {
              contractName: 'goal-event-confirmation.v1',
              contractVersion: 1,
              status: 'appended'
            };
          }
        };
      }
    });

    assert.equal(result.ok, true);
    assert.deepEqual(calls.map(([path, init]) => [
      path,
      init.method,
      init.cache,
      init.headers.Accept,
      init.headers['Content-Type'],
      JSON.parse(init.body).planHash
    ]), [[
      '/api/goals/latest/event-plan-confirm',
      'POST',
      'no-store',
      'application/json',
      'application/json',
      'sha256:1111111111111111111111111111111111111111111111111111111111111111'
    ]]);
  });

  it('fetches Prompt Workspace runbook and explicit role prompt pack through controlled GET routes', async () => {
    const calls = [];
    const fetchImpl = async (path, init) => {
      calls.push([path, init]);

      return {
        ok: true,
        status: 200,
        async json() {
          if (path.endsWith('/runbook')) {
            return {
              contractName: 'goal-runbook.v1',
              contractVersion: 1,
              goalId: 'v22-goal-prompt-handoff-workspace',
              tasks: []
            };
          }

          return {
            contractName: 'goal-prompt-pack.v1',
            contractVersion: 1,
            goalId: 'v22-goal-prompt-handoff-workspace',
            prompts: [{
              taskId: 'task-1',
              role: 'main-verifier',
              copyOnly: true,
              text: '/goal'
            }]
          };
        }
      };
    };

    const runbookResult = await fetchPromptWorkspaceRunbook('v22-goal-prompt-handoff-workspace', { fetchImpl });
    const promptResult = await fetchPromptWorkspacePromptPack({
      goalId: 'v22-goal-prompt-handoff-workspace',
      taskId: 'task-1',
      role: 'main-verifier'
    }, { fetchImpl });

    assert.equal(runbookResult.ok, true);
    assert.equal(promptResult.ok, true);
    assert.deepEqual(calls.map(([path, init]) => [
      path,
      init.method,
      init.cache,
      init.headers.Accept,
      Object.hasOwn(init, 'body')
    ]), [
      [
        '/api/goals/v22-goal-prompt-handoff-workspace/runbook',
        'GET',
        'no-store',
        'application/json',
        false
      ],
      [
        '/api/goals/v22-goal-prompt-handoff-workspace/prompt?task=task-1&role=main-verifier',
        'GET',
        'no-store',
        'application/json',
        false
      ]
    ]);
  });

  it('fetches the Prompt Workspace subagent handoff board from controlled goal source routes', async () => {
    const calls = [];
    const progress = createV19ProgressPayload();
    const events = createV19EventsPayload();
    const nextAction = createV19NextActionPayload();
    const closeout = createV19CloseoutPayload();

    events.events = [{
      eventId: 'evt_task6_worker_started',
      sequence: 1,
      goalId: V19_GOAL_ID,
      taskId: 'task-6',
      eventType: 'worker.started',
      phase: 'implement',
      actor: {
        role: 'worker',
        id: 'codex-worker-task-6'
      },
      recordedAt: '2026-05-29T10:00:00.000Z',
      evidenceRefs: []
    }];
    progress.tasks[0] = {
      ...progress.tasks[0],
      status: 'in-progress',
      statusSource: 'goal-event-log.v1:evt_task6_worker_started'
    };

    const payloadByPath = new Map([
      [`/api/goals/${V19_GOAL_ID}/progress`, progress],
      [`/api/goals/${V19_GOAL_ID}/events`, events],
      [`/api/goals/${V19_GOAL_ID}/next`, nextAction],
      [`/api/goals/${V19_GOAL_ID}/closeout`, closeout]
    ]);

    const result = await fetchPromptWorkspaceHandoffBoard(V19_GOAL_ID, {
      fetchImpl: async (path, init) => {
        calls.push([path, init]);

        return {
          ok: true,
          status: 200,
          async json() {
            return payloadByPath.get(path);
          }
        };
      }
    });

    assert.equal(result.ok, true);
    assert.equal(result.board.goalId.value, V19_GOAL_ID);
    assert.equal(result.board.items[0].workerStarted.status.value, 'started');
    assert.equal(result.board.items[0].currentHandoff.role.value, 'worker');
    assert.equal(result.board.items[0].workerEvidence.status.value, 'missing-closeout');
    assert.deepEqual(calls.map(([path, init]) => [
      path,
      init.method,
      init.cache,
      init.headers.Accept,
      Object.hasOwn(init, 'body')
    ]), [
      [`/api/goals/${V19_GOAL_ID}/progress`, 'GET', 'no-store', 'application/json', false],
      [`/api/goals/${V19_GOAL_ID}/events`, 'GET', 'no-store', 'application/json', false],
      [`/api/goals/${V19_GOAL_ID}/next`, 'GET', 'no-store', 'application/json', false],
      [`/api/goals/${V19_GOAL_ID}/closeout`, 'GET', 'no-store', 'application/json', false]
    ]);
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
        [GUIDED_HANDOFF_PATH, 'GET', false],
        [ACTIVE_GOAL_PROGRESS_PATH, 'GET', false],
        [ACTIVE_GOAL_EVENTS_PATH, 'GET', false]
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

  it('projects the Active Goal task queue from explicit contracts and event-backed progress only', () => {
    const runbook = createV19RunbookPayload();
    const ledger = createV19ProgressPayload();
    const nextAction = createV19NextActionPayload();

    runbook.tasks[0] = {
      ...runbook.tasks[0],
      title: 'APPROVED release-ready title must stay display text',
      branch: 'main-verified-from-branch-name',
      copyOnlyCommands: ['symphony goal update --event reviewer.approved --evidence-ref docs/plans/v19-approved-looking.md']
    };
    ledger.tasks[0] = {
      ...ledger.tasks[0],
      title: runbook.tasks[0].title,
      branch: runbook.tasks[0].branch,
      status: 'planned',
      statusSource: 'goal-runbook.v1',
      workerEvidenceRef: null,
      reviewEvidenceRef: null,
      reviewVerdict: null,
      mainVerificationRef: null
    };

    const plannedModel = projectWorkbenchContracts({
      goalRunbook: createWorkbenchResult('goalRunbook', runbook),
      goalNextAction: createWorkbenchResult('goalNextAction', nextAction),
      activeGoalProgress: createActiveGoalResult('activeGoalProgress', 'progress', 'goal-progress-ledger.v1', ledger),
      activeGoalEvents: createActiveGoalResult('activeGoalEvents', 'events', 'goal-event-log.v1', createV19EventsPayload())
    });

    const plannedTask = plannedModel.activeGoal.taskQueue.items[0];

    assert.equal(plannedTask.title.value, 'APPROVED release-ready title must stay display text');
    assert.equal(plannedTask.status.value, 'planned');
    assert.equal(plannedTask.statusSource.value, 'goal-runbook.v1');
    assert.equal(plannedTask.progressSource.value, 'goal-progress-ledger.v1');
    assert.equal(plannedTask.eventBacked.value, false);
    assert.equal(plannedTask.latestEventType.text, CONTRACT_TEXT.missing);
    assert.equal(plannedTask.workerEvidenceRef.text, CONTRACT_TEXT.missing);

    const eventBackedLedger = {
      ...ledger,
      tasks: [{
        ...ledger.tasks[0],
        status: 'in-progress',
        statusSource: 'goal-event-log.v1:evt_task6_worker',
        workerEvidenceRef: 'docs/plans/v19-task6-worker-evidence-2026-05-29.md'
      }]
    };
    const eventBackedLog = createV19EventsPayload();
    const eventHash = 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    eventBackedLog.events = [{
      eventId: 'evt_task6_worker',
      sequence: 1,
      goalId: V19_GOAL_ID,
      taskId: 'task-6',
      eventType: 'worker.evidence-recorded',
      phase: 'implement',
      actor: {
        role: 'worker',
        id: 'codex-worker-task-6'
      },
      occurredAt: '2026-05-29T10:00:00.000Z',
      recordedAt: '2026-05-29T10:00:00.000Z',
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: 'docs/plans/v19-task6-worker-evidence-2026-05-29.md',
        label: 'Worker evidence'
      }],
      previousEventHash: null,
      eventHash
    }];
    eventBackedLog.log.eventCount = 1;
    eventBackedLog.log.firstSequence = 1;
    eventBackedLog.log.lastSequence = 1;
    eventBackedLog.log.lastEventId = 'evt_task6_worker';
    eventBackedLog.log.lastEventHash = eventHash;

    const eventBackedModel = projectWorkbenchContracts({
      goalRunbook: createWorkbenchResult('goalRunbook', runbook),
      goalNextAction: createWorkbenchResult('goalNextAction', nextAction),
      activeGoalProgress: createActiveGoalResult('activeGoalProgress', 'progress', 'goal-progress-ledger.v1', eventBackedLedger),
      activeGoalEvents: createActiveGoalResult('activeGoalEvents', 'events', 'goal-event-log.v1', eventBackedLog)
    });

    const eventBackedTask = eventBackedModel.activeGoal.taskQueue.items[0];

    assert.equal(eventBackedTask.status.value, 'in-progress');
    assert.equal(eventBackedTask.progressSource.value, 'event-backed goal-progress-ledger.v1');
    assert.equal(eventBackedTask.eventBacked.value, true);
    assert.equal(eventBackedTask.latestEventId.value, 'evt_task6_worker');
    assert.equal(eventBackedTask.latestEventType.value, 'worker.evidence-recorded');
    assert.equal(eventBackedTask.workerEvidenceRef.value, 'docs/plans/v19-task6-worker-evidence-2026-05-29.md');
  });

  it('projects the Subagent Handoff Board only from goal events, goal-status, goal next, and closeout', () => {
    const progress = createV19ProgressPayload();
    const eventLog = createV19EventsPayload();
    const nextAction = createV19NextActionPayload();
    const closeout = createV19CloseoutPayload();

    progress.tasks[0] = {
      ...progress.tasks[0],
      title: 'reviewer.approved in title is not a verdict',
      branch: 'main-verification-looking-branch',
      status: 'needs-review',
      statusSource: 'goal-event-log.v1:evt_task6_worker_evidence',
      workerEvidenceRef: 'docs/plans/v19-task6-worker-evidence-2026-05-29.md',
      reviewEvidenceRef: null,
      reviewVerdict: null,
      mainVerificationRef: null
    };
    nextAction.next = {
      taskId: 'task-6',
      role: 'reviewer',
      phase: 'review',
      reason: 'Worker evidence exists for task-6 but reviewer verdict is missing.',
      blocked: false
    };
    eventLog.events = [{
      eventId: 'evt_task6_worker_started',
      sequence: 1,
      goalId: V19_GOAL_ID,
      taskId: 'task-6',
      eventType: 'worker.started',
      phase: 'implement',
      actor: {
        role: 'worker',
        id: 'codex-worker-task-6'
      },
      recordedAt: '2026-05-29T10:00:00.000Z',
      evidenceRefs: []
    }, {
      eventId: 'evt_task6_worker_evidence',
      sequence: 2,
      goalId: V19_GOAL_ID,
      taskId: 'task-6',
      eventType: 'worker.evidence-recorded',
      phase: 'implement',
      actor: {
        role: 'worker',
        id: 'codex-worker-task-6'
      },
      recordedAt: '2026-05-29T10:05:00.000Z',
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: 'docs/plans/event-log-worker-evidence.md',
        label: 'Worker evidence'
      }]
    }];
    closeout.missing = [{
      kind: 'review-evidence',
      taskId: 'task-6',
      expectedEvent: 'reviewer.approved'
    }, {
      kind: 'main-verification',
      taskId: 'task-6',
      expectedEvent: 'main.verification-passed'
    }];

    const board = projectSubagentHandoffBoard({
      progressResult: createActiveGoalResult('activeGoalProgress', 'progress', 'goal-progress-ledger.v1', progress),
      progress,
      eventsResult: createActiveGoalResult('activeGoalEvents', 'events', 'goal-event-log.v1', eventLog),
      eventLog,
      nextResult: createWorkbenchResult('goalNextAction', nextAction),
      nextAction,
      closeoutResult: createWorkbenchResult('goalCloseout', closeout),
      closeout
    });
    const task = board.items[0];

    assert.equal(board.sourcePolicy.value, 'goal-event-log.v1 + goal-progress-ledger.v1 + goal-next-action.v1 + goal-closeout-report.v1');
    assert.equal(task.title.value, 'reviewer.approved in title is not a verdict');
    assert.equal(task.workerStarted.status.value, 'started');
    assert.equal(task.workerStarted.source.value, 'goal-event-log.v1');
    assert.equal(task.workerEvidence.status.value, 'recorded');
    assert.equal(task.workerEvidence.evidenceRef.value, 'docs/plans/v19-task6-worker-evidence-2026-05-29.md');
    assert.equal(task.workerEvidence.source.value, 'goal-progress-ledger.v1');
    assert.equal(task.currentHandoff.active.value, true);
    assert.equal(task.currentHandoff.role.value, 'reviewer');
    assert.equal(task.currentHandoff.source.value, 'goal-next-action.v1');
    assert.equal(task.reviewerVerdict.status.value, 'missing-closeout');
    assert.equal(task.reviewerVerdict.source.value, 'goal-closeout-report.v1');
    assert.equal(task.mainVerification.status.value, 'missing-closeout');
    assert.equal(task.mainVerification.source.value, 'goal-closeout-report.v1');
    assert.equal(task.closeoutMissingKinds.value, 'review-evidence、main-verification');

    const verifiedProgress = createV19ProgressPayload();
    const verifiedEventLog = createV19EventsPayload();
    const verifiedCloseout = createV19CloseoutPayload();
    const mainEvidenceRef = 'docs/plans/v19-task6-main-verification-evidence-2026-05-29.md';

    verifiedProgress.tasks[0] = {
      ...verifiedProgress.tasks[0],
      status: 'main-verified',
      statusSource: 'goal-event-log.v1:evt_task6_main_passed',
      mainVerificationRef: mainEvidenceRef
    };
    verifiedEventLog.events = [{
      eventId: 'evt_task6_main_passed',
      sequence: 1,
      goalId: V19_GOAL_ID,
      taskId: 'task-6',
      eventType: 'main.verification-passed',
      phase: 'main-verification',
      actor: {
        role: 'main-verifier',
        id: 'codex-main-verifier'
      },
      recordedAt: '2026-05-29T10:20:00.000Z',
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: 'docs/plans/event-log-main-verification-evidence.md',
        label: 'Main verification event evidence'
      }]
    }];
    verifiedCloseout.missing = [];

    const verifiedBoard = projectSubagentHandoffBoard({
      progressResult: createActiveGoalResult('activeGoalProgress', 'progress', 'goal-progress-ledger.v1', verifiedProgress),
      progress: verifiedProgress,
      eventsResult: createActiveGoalResult('activeGoalEvents', 'events', 'goal-event-log.v1', verifiedEventLog),
      eventLog: verifiedEventLog,
      nextResult: createWorkbenchResult('goalNextAction', nextAction),
      nextAction,
      closeoutResult: createWorkbenchResult('goalCloseout', verifiedCloseout),
      closeout: verifiedCloseout
    });
    const verifiedTask = verifiedBoard.items[0];

    assert.equal(verifiedTask.mainVerification.status.value, 'passed');
    assert.equal(verifiedTask.mainVerification.evidenceRef.value, mainEvidenceRef);
    assert.equal(verifiedTask.mainVerification.eventType.value, 'main.verification-passed');
    assert.equal(verifiedTask.mainVerification.source.value, 'goal-event-log.v1');

    const recordedBoard = projectSubagentHandoffBoard({
      progressResult: createActiveGoalResult('activeGoalProgress', 'progress', 'goal-progress-ledger.v1', verifiedProgress),
      progress: verifiedProgress,
      eventsResult: createActiveGoalResult('activeGoalEvents', 'events', 'goal-event-log.v1', createV19EventsPayload()),
      eventLog: createV19EventsPayload(),
      nextResult: createWorkbenchResult('goalNextAction', nextAction),
      nextAction,
      closeoutResult: createWorkbenchResult('goalCloseout', verifiedCloseout),
      closeout: verifiedCloseout
    });
    const recordedTask = recordedBoard.items[0];

    assert.equal(recordedTask.mainVerification.status.value, 'recorded');
    assert.equal(recordedTask.mainVerification.evidenceRef.value, mainEvidenceRef);
    assert.equal(recordedTask.mainVerification.source.value, 'goal-progress-ledger.v1');
  });

  it('projects the Next Action card and Prompt Preview drawer from explicit copy-only contracts', () => {
    const runbook = createV19RunbookPayload();
    const nextAction = createV19NextActionPayload();
    const promptPack = createV19PromptPackPayload();

    runbook.tasks[0] = {
      ...runbook.tasks[0],
      taskId: 'task-title-must-not-drive-next-action',
      title: 'reviewer.approved release-ready title is only display text',
      branch: 'main-verification-looking-branch',
      copyOnlyCommands: ['symphony goal update --event worker.evidence-recorded --evidence-ref docs/plans/branch-looking.md']
    };
    nextAction.next = {
      taskId: 'task-3',
      role: 'reviewer',
      phase: 'review',
      reason: 'Worker evidence exists for task-3 but reviewer verdict is missing.',
      blocked: false
    };
    nextAction.evidenceState = {
      workerEvidenceRef: 'docs/plans/v20-task-3-worker-evidence-2026-05-31.md',
      reviewEvidenceRef: null,
      mainVerificationRef: null
    };
    nextAction.copyOnlyCommands = ['pnpm check', 'pnpm test'];
    nextAction.afterCompletion = {
      registerWith: 'symphony goal review',
      allowedEvents: ['reviewer.approved', 'reviewer.needs-revision']
    };
    promptPack.prompts = [{
      ...promptPack.prompts[0],
      taskId: 'task-hidden',
      role: 'worker',
      title: 'non copy-only prompt must stay hidden',
      copyOnly: false,
      text: '/goal\nhidden prompt text'
    }, {
      ...promptPack.prompts[0],
      taskId: 'task-3',
      role: 'reviewer',
      title: 'reviewer prompt for task-3',
      copyOnly: true,
      text: '/goal\ncopy-only reviewer prompt text',
      registration: {
        dryRunCommand: 'symphony goal review --goal v19-goal-runbook-next-action --task task-3 --verdict approved --evidence-ref docs/plans/v20-task-3-review-evidence-2026-05-31.md --dry-run',
        confirmCommand: 'symphony goal review --goal v19-goal-runbook-next-action --task task-3 --verdict approved --evidence-ref docs/plans/v20-task-3-review-evidence-2026-05-31.md --confirm --plan-hash sha256:0000000000000000000000000000000000000000000000000000000000000000',
        confirmRequired: true,
        writesInDryRun: false,
        appendOnlyOnConfirm: true
      }
    }];

    const model = projectWorkbenchContracts({
      goalRunbook: createWorkbenchResult('goalRunbook', runbook),
      goalNextAction: createWorkbenchResult('goalNextAction', nextAction),
      goalPromptPack: createWorkbenchResult('goalPromptPack', promptPack)
    });

    assert.equal(model.activeGoal.nextAction.contractName.value, 'goal-next-action.v1');
    assert.equal(model.activeGoal.nextAction.next.taskId.value, 'task-3');
    assert.equal(model.activeGoal.nextAction.next.role.value, 'reviewer');
    assert.equal(model.activeGoal.nextAction.next.reason.value, 'Worker evidence exists for task-3 but reviewer verdict is missing.');
    assert.equal(model.activeGoal.nextAction.evidenceState.workerEvidenceRef.value, 'docs/plans/v20-task-3-worker-evidence-2026-05-31.md');
    assert.equal(model.activeGoal.nextAction.evidenceState.reviewEvidenceRef.text, CONTRACT_TEXT.missing);
    assert.equal(model.activeGoal.nextAction.afterCompletion.registrationCommand.value, 'symphony goal review');
    assert.equal(model.activeGoal.nextAction.afterCompletion.registerWith.value, 'symphony goal review');
    assert.equal(model.activeGoal.nextAction.afterCompletion.allowedEvents.value, 'reviewer.approved、reviewer.needs-revision');
    assert.equal(model.activeGoal.nextAction.eventForms.modelName.value, 'GoalEventRegistrationFormModel');
    assert.equal(model.activeGoal.nextAction.eventForms.sourceContract.value, 'goal-next-action.v1');
    assert.equal(model.activeGoal.nextAction.eventForms.goalId.value, V19_GOAL_ID);
    assert.equal(model.activeGoal.nextAction.eventForms.taskId.value, 'task-3');
    assert.equal(model.activeGoal.nextAction.eventForms.registerWith.value, 'symphony goal review');
    assert.equal(model.activeGoal.nextAction.eventForms.defaultFormId.value, 'goal-review-approved');
    assert.equal(model.activeGoal.nextAction.eventForms.recommendedForms.count.value, 2);
    assert.equal(model.activeGoal.nextAction.eventForms.recommendedForms.items[0].eventType.value, 'reviewer.approved');
    assert.equal(model.activeGoal.nextAction.eventForms.recommendedForms.items[0].commandName.value, 'symphony goal review');
    assert.equal(model.activeGoal.nextAction.eventForms.recommendedForms.items[0].requiresEvidence.value, true);
    assert.equal(model.activeGoal.nextAction.eventForms.recommendedForms.items[0].fields.items.some((field) => field.id.value === 'reviewerId' && field.required.value === true), true);
    assert.equal(model.activeGoal.nextAction.eventForms.recommendedForms.items[0].fields.items.some((field) => field.id.value === 'verdict' && field.value.value === 'approved'), true);
    assert.equal(model.activeGoal.nextAction.eventForms.supportedForms.items.some((form) => form.eventType.value === 'worker.started'), true);
    assert.equal(model.activeGoal.nextAction.eventForms.supportedForms.items.some((form) => form.eventType.value === 'blocker.opened'), true);
    assert.equal(model.activeGoal.nextAction.eventForms.policy.workerCannotApproveOwnTask.value, true);
    assert.equal(model.activeGoal.nextAction.eventForms.safety.confirmAvailableInTask1.value, false);
    assert.equal(model.activeGoal.nextAction.eventForms.safety.confirmAvailableInTask3.value, true);
    assert.equal(model.activeGoal.nextAction.eventForms.safety.workbenchWriteAvailable.value, true);

    assert.equal(model.activeGoal.promptPreview.contractName.value, 'goal-prompt-pack.v1');
    assert.equal(model.activeGoal.promptPreview.visibleCount.value, 1);
    assert.equal(model.activeGoal.promptPreview.hiddenCount.value, 1);
    assert.equal(model.activeGoal.promptPreview.items[0].taskId.value, 'task-3');
    assert.equal(model.activeGoal.promptPreview.items[0].role.value, 'reviewer');
    assert.equal(model.activeGoal.promptPreview.items[0].text.value, '/goal\ncopy-only reviewer prompt text');
    assert.equal(Object.hasOwn(model.activeGoal.promptPreview.items[0], 'registration'), false);
    assert.equal(Object.hasOwn(model.activeGoal.promptPreview.items[0], 'dryRunCommand'), false);
    assert.equal(Object.hasOwn(model.activeGoal.promptPreview.items[0], 'confirmCommand'), false);
    assert.equal(model.activeGoal.promptPreview.safety.copyOnly.value, true);
    assert.equal(model.activeGoal.promptPreview.safety.workbenchWriteAvailable.value, false);
    assert.equal(model.activeGoal.promptPreview.safety.browserExecutionAvailable.value, false);
    assert.equal(model.activeGoal.promptPreview.safety.modelInvocationAvailable.value, false);
  });

  it('projects worker, blocker, reviewer, and main-verification event form specs without approving from Workbench heuristics', () => {
    const runbook = createV19RunbookPayload();
    const workerNext = createV19NextActionPayload();

    workerNext.afterCompletion = {
      registerWith: 'symphony goal update',
      allowedEvents: ['worker.evidence-recorded', 'worker.self-check-passed', 'worker.self-check-failed']
    };

    const workerModel = projectWorkbenchContracts({
      goalRunbook: createWorkbenchResult('goalRunbook', runbook),
      goalNextAction: createWorkbenchResult('goalNextAction', workerNext)
    });
    const workerForms = workerModel.activeGoal.nextAction.eventForms;
    const workerEvidenceForm = workerForms.recommendedForms.items.find((form) => form.eventType.value === 'worker.evidence-recorded');
    const workerStartedForm = workerForms.supportedForms.items.find((form) => form.eventType.value === 'worker.started');
    const blockerOpenedForm = workerForms.supportedForms.items.find((form) => form.eventType.value === 'blocker.opened');
    const blockerResolvedForm = workerForms.supportedForms.items.find((form) => form.eventType.value === 'blocker.resolved');

    assert.equal(workerForms.recommendedForms.count.value, 3);
    assert.equal(workerEvidenceForm.commandName.value, 'symphony goal update');
    assert.equal(workerEvidenceForm.fields.items.some((field) => field.id.value === 'evidenceRef' && field.required.value === true), true);
    assert.equal(workerStartedForm.requiresEvidence.value, false);
    assert.equal(blockerOpenedForm.fields.items.some((field) => field.id.value === 'blockerReason' && field.required.value === true), true);
    assert.equal(blockerResolvedForm.fields.items.some((field) => field.id.value === 'blockerId' && field.required.value === true), true);
    assert.equal(blockerOpenedForm.availableForCurrentNextAction.value, false);

    const mainNext = createV19NextActionPayload();
    mainNext.next = {
      taskId: 'task-6',
      role: 'main-verifier',
      phase: 'main-verification',
      reason: 'Reviewer approved task-6 but main verification is missing.',
      blocked: false
    };
    mainNext.afterCompletion = {
      registerWith: 'symphony goal gate --gate main-verification',
      allowedEvents: ['main.verification-passed', 'main.verification-failed']
    };

    const mainModel = projectWorkbenchContracts({
      goalRunbook: createWorkbenchResult('goalRunbook', runbook),
      goalNextAction: createWorkbenchResult('goalNextAction', mainNext)
    });
    const mainForms = mainModel.activeGoal.nextAction.eventForms;
    const passedForm = mainForms.recommendedForms.items.find((form) => form.eventType.value === 'main.verification-passed');
    const failedForm = mainForms.recommendedForms.items.find((form) => form.eventType.value === 'main.verification-failed');

    assert.equal(mainForms.defaultFormId.value, 'goal-gate-main-verification-passed');
    assert.equal(passedForm.commandName.value, 'symphony goal gate');
    assert.equal(passedForm.fields.items.some((field) => field.id.value === 'gateName' && field.value.value === 'main-verification'), true);
    assert.equal(passedForm.fields.items.some((field) => field.id.value === 'gateStatus' && field.value.value === 'passed'), true);
    assert.equal(failedForm.fields.items.some((field) => field.id.value === 'gateStatus' && field.value.value === 'failed'), true);
    assert.equal(mainForms.policy.approvalReadinessSource.value, 'explicit goal events only');
    assert.equal(mainForms.policy.unsupportedInferenceSources.value, 'file-name、branch、commit-message、frontend-heuristic');
    assert.equal(mainForms.safety.browserExecutionAvailable.value, false);
  });

  it('projects recent controlled evidence refs for the event form helper without status inference', () => {
    const runbook = createV19RunbookPayload();
    const nextAction = createV19NextActionPayload();
    const ledger = createV19ProgressPayload();
    const eventLog = createV19EventsPayload();

    nextAction.afterCompletion = {
      registerWith: 'symphony goal update',
      allowedEvents: ['worker.evidence-recorded']
    };
    ledger.tasks[0] = {
      ...ledger.tasks[0],
      workerEvidenceRef: 'docs/plans/v19-task6-worker-evidence-2026-05-29.md',
      reviewEvidenceRef: 'docs/plans/v19-task6-review-evidence-2026-05-29.md'
    };
    eventLog.events = [{
      eventId: 'evt_task6_artifact_worker',
      sequence: 1,
      goalId: V19_GOAL_ID,
      taskId: 'task-6',
      eventType: 'worker.evidence-recorded',
      phase: 'implement',
      actor: {
        role: 'worker',
        id: 'codex-worker-task-6'
      },
      occurredAt: '2026-05-29T10:00:00.000Z',
      recordedAt: '2026-05-29T10:00:00.000Z',
      evidenceRefs: [{
        kind: 'artifact-ref',
        ref: 'artifact:run-1:evidence',
        label: 'Managed artifact evidence'
      }],
      previousEventHash: null,
      eventHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    }];

    const model = projectWorkbenchContracts({
      latestRun: createWorkbenchResult('latestRun', {
        contractName: 'symphony.console-run',
        contractVersion: '1',
        run: {
          runId: 'run-1',
          status: 'passed',
          verifierStatus: 'passed',
          modelInvocation: false,
          artifactRefs: [{
            kind: 'evidence',
            path: '/tmp/example/evidence.json',
            ref: 'artifact:run-1:evidence'
          }]
        }
      }),
      goalRunbook: createWorkbenchResult('goalRunbook', runbook),
      goalNextAction: createWorkbenchResult('goalNextAction', nextAction),
      activeGoalProgress: createActiveGoalResult('activeGoalProgress', 'progress', 'goal-progress-ledger.v1', ledger),
      activeGoalEvents: createActiveGoalResult('activeGoalEvents', 'events', 'goal-event-log.v1', eventLog)
    });

    const helper = model.activeGoal.nextAction.eventForms.evidenceRefHelper;
    const workerEvidenceForm = model.activeGoal.nextAction.eventForms.recommendedForms.items[0];
    const helperRefs = helper.recentRefs.items.map((item) => item.ref.value);

    assert.equal(helper.helperName.value, 'EvidenceRefHelper');
    assert.equal(helper.acceptedPatterns.value.includes('docs/plans/<file>'), true);
    assert.equal(helper.acceptedPatterns.value.includes('artifact-ref:<managed-artifact-ref>'), true);
    assert.equal(helperRefs.includes('artifact-ref:artifact:run-1:evidence'), true);
    assert.equal(helperRefs.includes('docs/plans/v19-task6-worker-evidence-2026-05-29.md'), true);
    assert.equal(helperRefs.includes('docs/plans/v18-tag-release-evidence-2026-05-29.md'), true);
    assert.equal(workerEvidenceForm.evidenceRefHelper.recentRefs.items[0].ref.value, 'artifact-ref:artifact:run-1:evidence');
    assert.equal(helper.safety.readsEvidenceBodies.value, false);
    assert.equal(helper.safety.infersStatusFromFilename.value, false);
    assert.equal(model.activeGoal.nextAction.eventForms.policy.approvalReadinessSource.value, 'explicit goal events only');
  });

  it('projects the Closeout Gaps panel only from goal-closeout-report.v1', () => {
    const closeout = createV19CloseoutPayload();
    const ledger = createV19ProgressPayload();

    ledger.summary.releaseReady = true;
    ledger.summary.releaseReadySource = 'goal-event-log.v1:evt_release_ready_from_ledger_only';
    ledger.releaseGates = Object.fromEntries(
      Object.keys(ledger.releaseGates).map((gateId) => [gateId, 'passed'])
    );

    const model = projectWorkbenchContracts({
      goalRunbook: createWorkbenchResult('goalRunbook', createV19RunbookPayload()),
      goalCloseout: createWorkbenchResult('goalCloseout', closeout),
      activeGoalProgress: createActiveGoalResult('activeGoalProgress', 'progress', 'goal-progress-ledger.v1', ledger)
    });

    assert.equal(model.activeGoal.closeoutGaps.contractName.value, 'goal-closeout-report.v1');
    assert.equal(model.activeGoal.closeoutGaps.summary.releaseReady.value, false);
    assert.equal(model.activeGoal.closeoutGaps.summary.releaseReadySource.text, CONTRACT_TEXT.missing);
    assert.equal(model.activeGoal.closeoutGaps.missing.items[0].kind.value, 'worker-evidence');
    assert.equal(model.activeGoal.closeoutGaps.missing.items[1].gate.value, 'release.pnpm-test');
    assert.equal(model.activeGoal.closeoutGaps.releaseGates.find((gate) => gate.gate.value === 'pnpmTest').status.value, 'unknown');

    const readyCloseout = {
      ...closeout,
      summary: {
        ...closeout.summary,
        workerEvidenceComplete: true,
        reviewEvidenceComplete: true,
        mainVerificationComplete: true,
        releaseReady: true,
        releaseReadySource: 'goal-event-log.v1:evt_release_ready_from_closeout'
      },
      missing: [],
      releaseGates: Object.fromEntries(
        Object.keys(closeout.releaseGates).map((gateId) => [gateId, 'passed'])
      )
    };
    const readyModel = projectWorkbenchContracts({
      goalCloseout: createWorkbenchResult('goalCloseout', readyCloseout)
    });

    assert.equal(readyModel.activeGoal.closeoutGaps.summary.releaseReady.value, true);
    assert.equal(readyModel.activeGoal.closeoutGaps.summary.releaseReadySource.value, 'goal-event-log.v1:evt_release_ready_from_closeout');

    const noCloseoutModel = projectWorkbenchContracts({
      activeGoalProgress: createActiveGoalResult('activeGoalProgress', 'progress', 'goal-progress-ledger.v1', ledger)
    });

    assert.equal(noCloseoutModel.activeGoal.closeoutGaps.state, 'unavailable');
    assert.equal(noCloseoutModel.activeGoal.closeoutGaps.summary.releaseReady.text, CONTRACT_TEXT.missing);
  });

  it('hydrates the Active Goal task queue with backend scoped event-log data', async () => {
    const context = await startManagedActiveGoalWorkbenchServer();

    try {
      const model = await fetchWorkbenchContracts({
        fetchImpl: (path, init) => fetch(`${context.baseUrl}${path}`, init)
      });
      const task2 = model.activeGoal.taskQueue.items.find((item) => item.taskId.value === 'task-2');
      const task3 = model.activeGoal.taskQueue.items.find((item) => item.taskId.value === 'task-3');
      const activeEventsRoute = model.routeStates.find((route) => route.id === 'activeGoalEvents');

      assert.equal(activeEventsRoute.state, 'ready');
      assert.equal(activeEventsRoute.path, `/api/goals/${BACKEND_ACTIVE_GOAL_ID}/events`);
      assert.equal(model.activeGoal.runbook.eventRouteState.value, 'ready');
      assert.equal(model.activeGoal.taskQueue.goalId.value, BACKEND_ACTIVE_GOAL_ID);
      assert.equal(task2.status.value, 'in-progress');
      assert.equal(task2.statusSource.value, 'goal-event-log.v1:evt_task2_backend_worker');
      assert.equal(task2.progressSource.value, 'event-backed goal-progress-ledger.v1');
      assert.equal(task2.eventBacked.value, true);
      assert.equal(task2.latestEventId.value, 'evt_task2_backend_worker');
      assert.equal(task2.latestEventType.value, 'worker.evidence-recorded');
      assert.equal(task2.latestEventSequence.value, 1);
      assert.equal(task2.workerEvidenceRef.value, 'docs/plans/v20-task-2-worker-evidence-2026-05-31.md');
      assert.equal(task3.status.value, 'planned');
      assert.equal(task3.statusSource.value, 'goal-runbook.v1');
      assert.equal(task3.eventBacked.value, false);
    } finally {
      await cleanupManagedActiveGoalWorkbenchServer(context);
    }
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
    assert.equal(model.activeGoal.viewModel.modelName.value, 'ActiveGoalViewModel');
    assert.equal(model.activeGoal.viewModel.goalId.value, V19_GOAL_ID);
    assert.equal(model.activeGoal.viewModel.status.contractName.value, 'goal-progress-ledger.v1');
    assert.equal(model.activeGoal.viewModel.next.contractName.value, 'goal-next-action.v1');
    assert.equal(model.activeGoal.viewModel.prompt.contractName.value, 'goal-prompt-pack.v1');
    assert.equal(model.activeGoal.viewModel.closeout.contractName.value, 'goal-closeout-report.v1');
    assert.deepEqual(
      model.activeGoal.viewModel.commandInventory.items.map((item) => [
        item.label.value,
        item.contractName.value,
        item.routeState.value
      ]),
      [
        ['goal-status', 'goal-progress-ledger.v1', 'ready'],
        ['goal next', 'goal-next-action.v1', 'ready'],
        ['goal prompt', 'goal-prompt-pack.v1', 'ready'],
        ['goal closeout', 'goal-closeout-report.v1', 'ready']
      ]
    );
    assert.equal(
      model.activeGoal.viewModel.commandInventory.items[0].command.value,
      `pnpm --silent symphony goal-status --goal ${V19_GOAL_ID} --json`
    );
    for (const oldCommand of ['scan', 'do', 'review', 'verify', 'status', 'continue', 'artifacts']) {
      assert.equal(model.activeGoal.viewModel.commandInventory.items.some((item) => item.label.value === oldCommand), false);
    }
    assert.equal(model.activeGoal.runbook.contractName.value, 'goal-runbook.v1');
    assert.equal(model.activeGoal.runbook.tasks.items[0].status.value, 'planned');
    assert.equal(model.activeGoal.taskQueue.goalId.value, V19_GOAL_ID);
    assert.equal(model.activeGoal.taskQueue.items[0].status.value, 'planned');
    assert.equal(model.activeGoal.taskQueue.items[0].progressSource.value, 'goal-progress-ledger.v1');
    assert.equal(model.activeGoal.taskQueue.items[0].eventBacked.value, false);
    assert.equal(model.activeGoal.taskQueue.items[0].nextRole.value, 'worker');
    assert.equal(model.activeGoal.nextAction.next.role.value, 'worker');
    assert.equal(model.activeGoal.promptPreview.items[0].text.value.includes('/goal'), true);
    assert.equal(model.activeGoal.closeoutGaps.missing.items[0].kind.value, 'worker-evidence');
    assert.equal(model.activeGoal.closeoutGaps.missing.items[1].gate.value, 'release.pnpm-test');
    assert.equal(model.activeGoal.closeoutGaps.missing.items[1].gateId.value, 'pnpmTest');
    assert.equal(model.activeGoal.closeoutGaps.summary.releaseReady.value, false);
    assert.equal(model.activeGoal.closeoutGaps.summary.releaseReadySource.text, CONTRACT_TEXT.missing);
    assert.equal(model.capabilities.browserExecutionAvailable.value, false);
    assert.equal(model.diagnosticsV1.status.value, 'ok');
  });
});

function createWorkbenchResult(routeId, data) {
  const route = READONLY_API_ROUTES.find((candidate) => candidate.id === routeId);

  assert.notEqual(route, undefined);

  return {
    ok: true,
    route: route.path,
    method: route.method,
    routeDescriptor: route,
    httpStatus: 200,
    data
  };
}

function createActiveGoalResult(routeId, suffix, contractName, data) {
  const route = {
    id: routeId,
    label: routeId,
    path: `/api/goals/${V19_GOAL_ID}/${suffix}`,
    method: 'GET',
    contractName,
    goalId: V19_GOAL_ID
  };

  return {
    ok: true,
    route: route.path,
    method: route.method,
    routeDescriptor: route,
    httpStatus: 200,
    data
  };
}

async function startManagedActiveGoalWorkbenchServer() {
  const root = await mkdtemp(join(tmpdir(), 'symphony-workbench-backend-events-'));
  const stateDir = join(root, '.symphony');
  const plan = await buildGoalRunbookInitPlan({
    stateDir,
    goalId: BACKEND_ACTIVE_GOAL_ID,
    fromJson: BACKEND_ACTIVE_GOAL_FIXTURE
  });

  await confirmGoalRunbookInit({
    stateDir,
    goalId: BACKEND_ACTIVE_GOAL_ID,
    fromJson: BACKEND_ACTIVE_GOAL_FIXTURE,
    planHash: plan.planHash
  });
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    recordedAt: '2026-05-31T10:01:00.000Z',
    event: {
      eventId: 'evt_task2_backend_worker',
      goalId: BACKEND_ACTIVE_GOAL_ID,
      taskId: 'task-2',
      eventType: 'worker.evidence-recorded',
      phase: 'implement',
      actor: {
        role: 'worker',
        id: 'codex-worker-task-2'
      },
      occurredAt: '2026-05-31T10:00:00.000Z',
      branch: null,
      commit: null,
      evidenceRefs: [{
        kind: 'repo-doc',
        ref: 'docs/plans/v20-task-2-worker-evidence-2026-05-31.md',
        label: 'Task 2 worker evidence'
      }],
      statement: 'Task 2 worker evidence was recorded for Workbench backend event-log hydration.'
    }
  });

  const server = createSymphonyConsoleServer({
    stateDir,
    cwd: root,
    env: { HOME: root },
    runner: new WorkbenchApiReadinessRunner()
  });
  const baseUrl = await listenOnRandomPort(server);

  return {
    root,
    stateDir,
    server,
    baseUrl
  };
}

async function listenOnRandomPort(server) {
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolvePromise();
    });
  });

  const address = server.address();

  assert.equal(typeof address, 'object');
  assert.notEqual(address, null);

  return `http://127.0.0.1:${address.port}`;
}

async function cleanupManagedActiveGoalWorkbenchServer({ root, server }) {
  await new Promise((resolvePromise, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolvePromise();
    });
  });
  await rm(root, { recursive: true, force: true });
}

class WorkbenchApiReadinessRunner {
  async run({ executable, args = [] }) {
    if (executable === 'pnpm' && args.join(' ') === '--version') {
      return commandResult({ exitCode: 0, stdout: '10.0.0\n' });
    }

    if (executable === 'git' && args.join(' ') === 'rev-parse --is-inside-work-tree') {
      return commandResult({ exitCode: 0, stdout: 'true\n' });
    }

    if (executable === 'git' && args.join(' ') === 'branch --show-current') {
      return commandResult({ exitCode: 0, stdout: 'codex/v20-task-2\n' });
    }

    if (executable === 'git' && args.join(' ') === 'rev-parse --short HEAD') {
      return commandResult({ exitCode: 0, stdout: 'v20task2\n' });
    }

    if (executable === 'git' && args.join(' ') === 'status --porcelain') {
      return commandResult({ exitCode: 0, stdout: '' });
    }

    if (executable === 'gh') {
      return commandResult({ exitCode: 1, stderr: 'not logged in\n' });
    }

    return commandResult({ exitCode: 1, stderr: `${executable} unavailable\n` });
  }
}

function commandResult({ exitCode, stdout = '', stderr = '' }) {
  return {
    exitCode,
    signal: null,
    stdout,
    stderr,
    durationMs: 1,
    timedOut: false,
    cancelled: false,
    stalled: false,
    killedAfterTimeout: false,
    outputFiles: {}
  };
}

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
    ['/api/goals/latest/runbook', createV19RunbookPayload()],
    ['/api/goals/latest/next', createV19NextActionPayload()],
    ['/api/goals/latest/prompt', createV19PromptPackPayload()],
    ['/api/goals/latest/closeout', createV19CloseoutPayload()],
    [ACTIVE_GOAL_PROGRESS_PATH, createV19ProgressPayload()],
    [ACTIVE_GOAL_EVENTS_PATH, createV19EventsPayload()],
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

function createV19RunbookPayload() {
  return {
    contractName: 'goal-runbook.v1',
    contractVersion: 1,
    goalId: V19_GOAL_ID,
    goalTitle: 'v19 Goal Runbook + Next Action Control Center',
    baseline: {
      tag: 'v18',
      commit: null,
      evidenceRef: 'docs/plans/v18-tag-release-evidence-2026-05-29.md'
    },
    tasks: [{
      taskId: 'task-6',
      title: 'Workbench Active Goal Control Center',
      branch: 'v19-task6-workbench-active-goal',
      roleOrder: ['worker', 'reviewer', 'main-verifier'],
      acceptance: [
        'Workbench displays the active goal runbook.',
        'Prompt preview remains copy-only text.'
      ],
      expectedEvidence: {
        worker: 'worker.evidence-recorded',
        reviewer: ['reviewer.approved', 'reviewer.needs-revision'],
        mainVerifier: 'main.verification-passed'
      },
      copyOnlyCommands: [
        'pnpm check',
        'pnpm test',
        'pnpm workbench:build',
        'git diff --check'
      ]
    }],
    releaseGates: [
      'release.pnpm-check',
      'release.pnpm-test',
      'release.workbench-build',
      'release.tag-evidence'
    ],
    rolePolicy: {
      workerCannotApproveOwnTask: true,
      reviewerApprovalRequiredBeforeMainVerification: true,
      mainVerificationRequiredBeforeReleaseReady: true
    }
  };
}

function createV19NextActionPayload() {
  return {
    contractName: 'goal-next-action.v1',
    contractVersion: 1,
    goalId: V19_GOAL_ID,
    status: 'action-required',
    next: {
      taskId: 'task-6',
      role: 'worker',
      phase: 'implement',
      reason: 'No explicit worker evidence is recorded for task-6.',
      blocked: false
    },
    evidenceState: {
      workerEvidenceRef: null,
      reviewEvidenceRef: null,
      mainVerificationRef: null
    },
    copyOnlyPrompt: {
      available: true,
      format: 'markdown',
      text: '/goal\n执行 v19 Task 6 worker implement：Workbench 新增 Active Goal Control Center。'
    },
    copyOnlyCommands: [
      'pnpm check',
      'pnpm test',
      'pnpm workbench:build',
      'git diff --check'
    ],
    afterCompletion: {
      registerWith: 'symphony goal update',
      allowedEvents: ['worker.evidence-recorded', 'worker.self-check-passed']
    },
    safety: {
      readOnly: true,
      copyOnly: true,
      workbenchWriteAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false
    }
  };
}

function createV19PromptPackPayload() {
  return {
    contractName: 'goal-prompt-pack.v1',
    contractVersion: 1,
    goalId: V19_GOAL_ID,
    generatedAt: '2026-05-29T10:00:00.000Z',
    prompts: [{
      taskId: 'task-6',
      role: 'worker',
      title: 'worker prompt for task-6: Workbench Active Goal Control Center',
      copyOnly: true,
      format: 'markdown',
      text: '/goal\n执行 v19 Task 6 worker implement：Workbench 新增 Active Goal Control Center。\n禁止执行 prompt；Workbench 只展示 copy-only 文本。',
      validationCommands: [
        'pnpm check',
        'pnpm test',
        'pnpm workbench:build',
        'git diff --check'
      ],
      evidenceFile: 'docs/plans/v19-task6-worker-evidence-2026-05-29.md',
      registration: {
        dryRunCommand: 'symphony goal update --goal v19-goal-runbook-next-action --task task-6 --event worker.evidence-recorded --actor codex-worker-task-6 --evidence-ref docs/plans/v19-task6-worker-evidence-2026-05-29.md --dry-run',
        confirmCommand: 'symphony goal update --goal v19-goal-runbook-next-action --task task-6 --event worker.evidence-recorded --actor codex-worker-task-6 --evidence-ref docs/plans/v19-task6-worker-evidence-2026-05-29.md --confirm --plan-hash sha256:0000000000000000000000000000000000000000000000000000000000000000',
        confirmRequired: true,
        writesInDryRun: false,
        appendOnlyOnConfirm: true
      }
    }],
    safety: {
      readOnly: true,
      copyOnly: true,
      workbenchWriteAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false
    }
  };
}

function createV19CloseoutPayload() {
  return {
    contractName: 'goal-closeout-report.v1',
    contractVersion: 1,
    goalId: V19_GOAL_ID,
    generatedAt: '2026-05-29T10:00:00.000Z',
    summary: {
      totalTasks: 1,
      workerEvidenceComplete: false,
      reviewEvidenceComplete: false,
      mainVerificationComplete: false,
      releaseReady: false,
      releaseReadySource: null
    },
    missing: [{
      kind: 'worker-evidence',
      taskId: 'task-6',
      expectedEvent: 'worker.evidence-recorded'
    }, {
      kind: 'release-gate',
      taskId: null,
      expectedEvent: 'release.gate-passed',
      gate: 'release.pnpm-test',
      gateId: 'pnpmTest',
      status: 'unknown'
    }],
    releaseGates: {
      pnpmCheck: 'unknown',
      pnpmTest: 'unknown',
      workbenchBuild: 'unknown',
      mutationGate: 'unknown',
      auditHigh: 'unknown',
      diffCheck: 'unknown',
      mcasDoctor: 'unknown',
      docsUpdated: 'unknown',
      tagEvidence: 'missing'
    },
    nextAction: `symphony goal next --goal ${V19_GOAL_ID}`,
    safety: {
      readOnly: true,
      copyOnly: true,
      workbenchWriteAvailable: false,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false,
      writesInDryRun: false,
      confirmRequiredForWrites: true,
      releaseReadyRequiresEvidence: true
    }
  };
}

function createV19ProgressPayload() {
  return {
    contractName: 'goal-progress-ledger.v1',
    contractVersion: 1,
    goalId: V19_GOAL_ID,
    goalTitle: 'v19 Goal Runbook + Next Action Control Center',
    baseline: {
      tag: 'v18',
      commit: null,
      evidenceRef: 'docs/plans/v18-tag-release-evidence-2026-05-29.md'
    },
    summary: {
      totalTasks: 1,
      completedTasks: 0,
      blockedTasks: 0,
      needsReviewTasks: 0,
      needsRevisionTasks: 0,
      releaseReady: false,
      releaseReadySource: null
    },
    tasks: [{
      taskId: 'task-6',
      title: 'Workbench Active Goal Control Center',
      status: 'planned',
      statusSource: 'goal-runbook.v1',
      branch: 'v19-task6-workbench-active-goal',
      commit: null,
      workerEvidenceRef: null,
      reviewEvidenceRef: null,
      reviewVerdict: null,
      mainVerificationRef: null,
      blockers: [],
      nextCopyOnlyCommand: 'git checkout main && git pull --ff-only && git checkout -b v19-task6-workbench-active-goal'
    }],
    releaseGates: {
      pnpmCheck: 'unknown',
      pnpmTest: 'unknown',
      workbenchBuild: 'unknown',
      mutationGate: 'unknown',
      auditHigh: 'unknown',
      diffCheck: 'unknown',
      mcasDoctor: 'unknown',
      docsUpdated: 'unknown',
      tagEvidence: 'unknown'
    },
    blockers: [],
    nextActions: [{
      kind: 'copy-only-command',
      label: 'Start task-6',
      command: 'git checkout main && git pull --ff-only && git checkout -b v19-task6-workbench-active-goal'
    }],
    safety: {
      readOnly: true,
      copyOnly: true,
      browserExecutionAvailable: false,
      modelInvocationAvailable: false
    }
  };
}

function createV19EventsPayload() {
  return {
    contractName: 'goal-event-log.v1',
    contractVersion: 1,
    goalId: V19_GOAL_ID,
    goalTitle: 'v19 Goal Runbook + Next Action Control Center',
    baseline: {
      tag: 'v18',
      commit: null,
      evidenceRef: 'docs/plans/v18-tag-release-evidence-2026-05-29.md'
    },
    log: {
      appendOnly: true,
      storage: 'managed-goal-event-journal',
      eventCount: 0,
      firstSequence: null,
      lastSequence: null,
      lastEventId: null,
      lastEventHash: null
    },
    events: []
  };
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
