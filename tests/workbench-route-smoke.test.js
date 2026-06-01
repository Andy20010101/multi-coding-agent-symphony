import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  GUIDED_GOAL_HANDOFF_CONTRACT_NAME,
  validateGuidedGoalHandoffContract
} from '../src/symphony/guided-goal-handoff.js';
import {
  SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME,
  validateSafeArtifactPreviewContract
} from '../src/symphony/safe-artifact-preview.js';
import {
  validateErrorEnvelopeContract
} from '../src/symphony/error-envelope.js';
import {
  validateCapabilitiesContract
} from '../src/symphony/capabilities.js';
import {
  validateDiagnosticsContract
} from '../src/symphony/diagnostics.js';
import {
  DEFAULT_GOAL_PROGRESS_GOAL_ID,
  V18_GOAL_EVENT_JOURNAL_GOAL_ID,
  validateGoalProgressLedgerContract
} from '../src/symphony/goal-progress-ledger.js';
import {
  validateGoalEventLogContract
} from '../src/symphony/goal-event-contracts.js';
import {
  validateGoalCloseoutReportContract,
  validateGoalNextActionContract,
  validateGoalPromptPackContract,
  validateGoalRunbookContract
} from '../src/symphony/goal-runbook-contracts.js';
import {
  buildGoalRunbookInitPlan,
  confirmGoalRunbookInit
} from '../src/symphony/goal-runbook-registry.js';

const ROUTE_SMOKE_RUN_ID = 'task9-route-smoke-run';
const FIXED_TIME = '2026-05-27T00:00:00.000Z';
const V20_GOAL_ID = 'v20-goal-workbench-active-goal-surface';
const V20_RUNBOOK_FIXTURE = 'fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json';

describe('v16 Workbench route smoke and server parity', () => {
  it('serves the Workbench browser entry, static assets, and Task 8 fallback/404 behavior', async () => {
    const context = await startConsoleServer();

    try {
      const entryResponse = await fetch(`${context.baseUrl}/workbench/`);
      const noSlashEntryResponse = await fetch(`${context.baseUrl}/workbench`);

      assert.equal(entryResponse.status, 200);
      assert.match(entryResponse.headers.get('content-type') ?? '', /^text\/html; charset=utf-8/iu);
      assert.equal(entryResponse.headers.get('cache-control'), 'no-store');
      assert.equal(entryResponse.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(noSlashEntryResponse.status, 200);

      const html = await entryResponse.text();
      const noSlashHtml = await noSlashEntryResponse.text();
      const assetPaths = extractWorkbenchAssetPaths(html);

      assert.match(html, /<div id="root"><\/div>/u);
      assert.match(noSlashHtml, /<div id="root"><\/div>/u);
      assert.match(assetPaths.script, /^\/workbench\/assets\/index-.+\.js$/u);
      assert.match(assetPaths.style, /^\/workbench\/assets\/index-.+\.css$/u);

      const jsResponse = await fetch(`${context.baseUrl}${assetPaths.script}`);
      const cssResponse = await fetch(`${context.baseUrl}${assetPaths.style}`);
      const fallbackResponse = await fetch(`${context.baseUrl}/workbench/runs/${ROUTE_SMOKE_RUN_ID}`);
      const promptWorkspaceResponse = await fetch(`${context.baseUrl}/workbench/prompts`);
      const missingAssetResponse = await fetch(`${context.baseUrl}/workbench/assets/missing.js`);
      const extensionRouteResponse = await fetch(`${context.baseUrl}/workbench/missing.css`);
      const rootAssetResponse = await fetch(`${context.baseUrl}${assetPaths.script.replace('/workbench', '')}`);

      assert.equal(jsResponse.status, 200);
      assert.match(jsResponse.headers.get('content-type') ?? '', /javascript/iu);
      assert.equal(jsResponse.headers.get('cache-control'), 'no-store');
      assert.equal(jsResponse.headers.get('x-content-type-options'), 'nosniff');
      const jsText = await jsResponse.text();

      assert.equal(jsText.length > 1000, true);
      assert.match(jsText, /primary-active-goal-grid/u);
      assert.match(jsText, /v20 primary workflow/u);
      assert.match(jsText, /Active Goal Runbook/u);
      assert.match(jsText, /Active Goal Task Queue/u);
      assert.equal(jsText.indexOf('primary-active-goal-grid') < jsText.indexOf('panel-grid'), true);

      assert.equal(cssResponse.status, 200);
      assert.match(cssResponse.headers.get('content-type') ?? '', /^text\/css; charset=utf-8/iu);
      assert.equal(cssResponse.headers.get('cache-control'), 'no-store');
      assert.equal(cssResponse.headers.get('x-content-type-options'), 'nosniff');
      const cssText = await cssResponse.text();

      assert.equal(cssText.length > 100, true);
      assert.match(cssText, /primary-active-goal-grid/u);

      assert.equal(fallbackResponse.status, 200);
      assert.match(await fallbackResponse.text(), /<div id="root"><\/div>/u);
      assert.equal(promptWorkspaceResponse.status, 200);
      assert.match(await promptWorkspaceResponse.text(), /<div id="root"><\/div>/u);

      assert.equal(missingAssetResponse.status, 404);
      assert.doesNotMatch(await missingAssetResponse.text(), /<div id="root"><\/div>/u);
      assert.equal(extensionRouteResponse.status, 404);
      assert.doesNotMatch(await extensionRouteResponse.text(), /<div id="root"><\/div>/u);
      assert.equal(rootAssetResponse.status, 404);
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('keeps non-Workbench and Stage Charter routes outside the React fallback', async () => {
    const context = await startConsoleServer();

    try {
      const consoleResponse = await fetch(`${context.baseUrl}/`);
      const nonWorkbenchResponse = await fetch(`${context.baseUrl}/not-workbench/${ROUTE_SMOKE_RUN_ID}`);
      const stageHtmlResponse = await fetch(`${context.baseUrl}/docs/stages/v15-workbench-react-vite-migration.html`);
      const stageJsonResponse = await fetch(`${context.baseUrl}/docs/stages/v15-workbench-react-vite-migration.stage.json`);

      assert.equal(consoleResponse.status, 200);
      assert.match(consoleResponse.headers.get('content-type') ?? '', /^text\/html; charset=utf-8/iu);
      assert.doesNotMatch(await consoleResponse.text(), /<div id="root"><\/div>|\/workbench\/assets\/index-/u);

      for (const response of [nonWorkbenchResponse, stageHtmlResponse, stageJsonResponse]) {
        assert.equal(response.status, 404);
        assert.match(response.headers.get('content-type') ?? '', /^application\/json; charset=utf-8/iu);
        assert.doesNotMatch(await response.text(), /<div id="root"><\/div>|symphony\.stage-charter/u);
      }
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('keeps the Workbench read-only API allowlist on GET routes', async () => {
    const context = await startConsoleServer();

    try {
      const before = await collectTextFileSnapshot(context.stateDir);
      const expectations = [
        {
          path: '/api/summary',
          contractName: 'symphony.console-snapshot',
          assertPayload(payload) {
            assert.equal(payload.status, 'ready');
            assert.equal(payload.latestRun.runId, ROUTE_SMOKE_RUN_ID);
          }
        },
        {
          path: '/api/readiness',
          contractName: 'symphony.console-readiness',
          assertPayload(payload) {
            assert.equal(payload.readOnly, true);
            assert.equal(payload.modelInvocation, false);
            assert.equal(payload.tools.packageManager.status, 'available');
            assert.equal(payload.tools.git.status, 'available');
          }
        },
        {
          path: '/api/handoff',
          contractName: 'symphony.handoff-refs',
          assertPayload(payload) {
            assert.equal(payload.readOnly, true);
            assert.equal(payload.arbitraryPathReads, false);
            assert.deepEqual(payload.refs, [
              {
                ref: GUIDED_GOAL_HANDOFF_CONTRACT_NAME,
                contractName: GUIDED_GOAL_HANDOFF_CONTRACT_NAME,
                contractVersion: '1',
                href: `/api/handoff/${GUIDED_GOAL_HANDOFF_CONTRACT_NAME}`
              }
            ]);
          }
        },
        {
          path: `/api/handoff/${GUIDED_GOAL_HANDOFF_CONTRACT_NAME}`,
          contractName: GUIDED_GOAL_HANDOFF_CONTRACT_NAME,
          assertPayload(payload) {
            assert.deepEqual(validateGuidedGoalHandoffContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.commands.copyOnly, true);
            assert.equal(payload.tasks.find((task) => task.id === 'task-4').evidencePath, 'docs/plans/v16-task4-readonly-handoff-api-evidence-2026-05-27.md');
          }
        },
        {
          path: '/api/runs',
          contractName: 'symphony.console-runs',
          assertPayload(payload) {
            assert.deepEqual(payload.runs.map((run) => run.runId), [ROUTE_SMOKE_RUN_ID]);
          }
        },
        {
          path: '/api/runs/latest',
          contractName: 'symphony.console-run',
          assertPayload(payload) {
            assert.equal(payload.run.runId, ROUTE_SMOKE_RUN_ID);
            assert.equal(payload.run.modelInvocation, false);
            assert.equal(payload.run.artifactRefs.some((artifact) => artifact.kind === 'summary'), true);
          }
        },
        {
          path: '/api/goals',
          contractName: 'symphony.goals-index',
          assertPayload(payload) {
            assert.equal(payload.readOnly, true);
            assert.deepEqual(payload.goals.map((goal) => goal.goalId), [DEFAULT_GOAL_PROGRESS_GOAL_ID]);
          }
        },
        {
          path: '/api/goals/latest/progress',
          contractName: 'goal-progress-ledger.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalProgressLedgerContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V20_GOAL_ID);
            assert.equal(payload.summary.totalTasks, 5);
            assert.equal(payload.tasks[0].status, 'planned');
            assert.equal(payload.tasks[0].statusSource, 'goal-runbook.v1');
          }
        },
        {
          path: `/api/goals/${DEFAULT_GOAL_PROGRESS_GOAL_ID}/progress`,
          contractName: 'goal-progress-ledger.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalProgressLedgerContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, DEFAULT_GOAL_PROGRESS_GOAL_ID);
          }
        },
        {
          path: `/api/goals/${V20_GOAL_ID}/progress`,
          contractName: 'goal-progress-ledger.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalProgressLedgerContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V20_GOAL_ID);
            assert.equal(payload.summary.totalTasks, 5);
            assert.equal(payload.tasks[0].statusSource, 'goal-runbook.v1');
          }
        },
        {
          path: '/api/goals/latest/events',
          contractName: 'goal-event-log.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalEventLogContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V18_GOAL_EVENT_JOURNAL_GOAL_ID);
            assert.equal(payload.log.eventCount, 0);
            assert.deepEqual(payload.events, []);
          }
        },
        {
          path: `/api/goals/${V18_GOAL_EVENT_JOURNAL_GOAL_ID}/events`,
          contractName: 'goal-event-log.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalEventLogContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V18_GOAL_EVENT_JOURNAL_GOAL_ID);
          }
        },
        {
          path: `/api/goals/${V20_GOAL_ID}/events`,
          contractName: 'goal-event-log.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalEventLogContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V20_GOAL_ID);
            assert.equal(payload.log.eventCount, 0);
            assert.deepEqual(payload.events, []);
          }
        },
        {
          path: '/api/goals/latest/runbook',
          contractName: 'goal-runbook.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalRunbookContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V20_GOAL_ID);
            assert.equal(payload.tasks.length, 5);
            assert.equal(payload.tasks[0].taskId, 'task-1');
          }
        },
        {
          path: `/api/goals/${V20_GOAL_ID}/runbook`,
          contractName: 'goal-runbook.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalRunbookContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V20_GOAL_ID);
          }
        },
        {
          path: '/api/goals/latest/next',
          contractName: 'goal-next-action.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalNextActionContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V20_GOAL_ID);
            assert.equal(payload.next.role, 'worker');
          }
        },
        {
          path: `/api/goals/${V20_GOAL_ID}/next`,
          contractName: 'goal-next-action.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalNextActionContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V20_GOAL_ID);
          }
        },
        {
          path: '/api/goals/latest/prompt',
          contractName: 'goal-prompt-pack.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalPromptPackContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V20_GOAL_ID);
            assert.equal(payload.prompts[0].copyOnly, true);
          }
        },
        {
          path: `/api/goals/${V20_GOAL_ID}/prompt`,
          contractName: 'goal-prompt-pack.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalPromptPackContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V20_GOAL_ID);
          }
        },
        {
          path: `/api/goals/${V20_GOAL_ID}/prompt?task=task-1&role=reviewer`,
          contractName: 'goal-prompt-pack.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalPromptPackContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V20_GOAL_ID);
            assert.equal(payload.prompts[0].taskId, 'task-1');
            assert.equal(payload.prompts[0].role, 'reviewer');
            assert.equal(payload.prompts[0].roleGuidance.label, 'independent reviewer');
            assert.equal(payload.prompts[0].evidenceFile, 'docs/plans/v20-task-1-review-evidence-2026-05-29.md');
            assert.match(payload.prompts[0].text, /independent reviewer/u);
            assert.match(payload.prompts[0].text, /Role evidence checklist:/u);
          }
        },
        {
          path: '/api/goals/latest/closeout',
          contractName: 'goal-closeout-report.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalCloseoutReportContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V20_GOAL_ID);
            assert.equal(payload.summary.releaseReady, false);
          }
        },
        {
          path: `/api/goals/${V20_GOAL_ID}/closeout`,
          contractName: 'goal-closeout-report.v1',
          assertPayload(payload) {
            assert.deepEqual(validateGoalCloseoutReportContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.goalId, V20_GOAL_ID);
          }
        },
        {
          path: '/api/capabilities',
          contractName: 'capabilities.v1',
          assertPayload(payload) {
            assert.deepEqual(validateCapabilitiesContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.browserExecutionAvailable, false);
          }
        },
        {
          path: '/api/diagnostics',
          contractName: 'diagnostics.v1',
          assertPayload(payload) {
            assert.deepEqual(validateDiagnosticsContract(payload), {
              ok: true,
              errors: []
            });
            assert.equal(payload.boundaries.readOnlyApi, true);
          }
        }
      ];

      for (const expectation of expectations) {
        const response = await fetch(`${context.baseUrl}${expectation.path}`);

        assert.equal(response.status, 200, expectation.path);
        assert.match(response.headers.get('content-type') ?? '', /^application\/json; charset=utf-8/iu);

        const payload = await response.json();

        assert.equal(payload.contractName, expectation.contractName);
        assert.equal(String(payload.contractVersion), '1');
        expectation.assertPayload(payload);
      }

      const after = await collectTextFileSnapshot(context.stateDir);

      assert.deepEqual(after, before);
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('serves safe preview contracts for registered artifact refs only', async () => {
    const context = await startConsoleServer();

    try {
      const before = await collectTextFileSnapshot(context.stateDir);
      const summaryResponse = await fetch(`${context.baseUrl}/api/runs/${ROUTE_SMOKE_RUN_ID}/artifacts/summary/preview`);
      const summaryPreview = await summaryResponse.json();

      assert.equal(summaryResponse.status, 200);
      assertValidSafePreview(summaryPreview);
      assert.equal(summaryPreview.contractName, SAFE_ARTIFACT_PREVIEW_CONTRACT_NAME);
      assert.equal(summaryPreview.sourceRunId, ROUTE_SMOKE_RUN_ID);
      assert.equal(summaryPreview.mime, 'application/json');
      assert.equal(summaryPreview.previewAvailable, true);
      assert.equal(summaryPreview.safeToRenderInline, true);
      assert.equal(summaryPreview.contentText, '{"routeSmoke":true}\n');
      assert.equal(summaryPreview.downloadAvailable, false);
      assert.equal(Object.hasOwn(summaryPreview, 'path'), false);

      const htmlResponse = await fetch(`${context.baseUrl}/api/runs/${ROUTE_SMOKE_RUN_ID}/artifacts/harness/preview`);
      const htmlBody = await htmlResponse.text();
      const htmlPreview = JSON.parse(htmlBody);

      assert.equal(htmlResponse.status, 200);
      assertValidSafePreview(htmlPreview);
      assert.equal(htmlPreview.mime, 'text/html; charset=utf-8');
      assert.equal(htmlPreview.previewAvailable, false);
      assert.equal(htmlPreview.safeToRenderInline, false);
      assert.equal(Object.hasOwn(htmlPreview, 'contentText'), false);
      assert.doesNotMatch(htmlBody, /<script|alert/u);

      const blockedResponse = await fetch(`${context.baseUrl}/api/runs/${ROUTE_SMOKE_RUN_ID}/artifacts/context/preview`);
      const blockedBody = await blockedResponse.text();
      const blockedPreview = JSON.parse(blockedBody);

      assert.equal(blockedResponse.status, 403);
      assert.deepEqual(validateErrorEnvelopeContract(blockedPreview), {
        ok: true,
        errors: []
      });
      assert.equal(blockedPreview.contractName, 'error-envelope.v1');
      assert.equal(blockedPreview.error.code, 'blocked-artifact-path');
      assert.equal(Object.hasOwn(blockedPreview, 'contentText'), false);
      assert.doesNotMatch(blockedBody, /multi-coding-agent-symphony|lockfileVersion/u);

      const after = await collectTextFileSnapshot(context.stateDir);

      assert.deepEqual(after, before);
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('blocks non-GET Workbench and API requests without writing state', async () => {
    const context = await startConsoleServer();

    try {
      const before = await collectTextFileSnapshot(context.stateDir);
      const paths = [
        '/workbench/',
        '/api/summary',
        '/api/readiness',
        '/api/handoff',
        `/api/handoff/${GUIDED_GOAL_HANDOFF_CONTRACT_NAME}`,
        '/api/runs',
        '/api/runs/latest',
        '/api/goals',
        '/api/goals/latest/progress',
        `/api/goals/${DEFAULT_GOAL_PROGRESS_GOAL_ID}/progress`,
        `/api/goals/${V20_GOAL_ID}/progress`,
        '/api/goals/latest/events',
        `/api/goals/${V18_GOAL_EVENT_JOURNAL_GOAL_ID}/events`,
        `/api/goals/${V20_GOAL_ID}/events`,
        '/api/goals/latest/runbook',
        `/api/goals/${V20_GOAL_ID}/runbook`,
        '/api/goals/latest/next',
        `/api/goals/${V20_GOAL_ID}/next`,
        '/api/goals/latest/prompt',
        `/api/goals/${V20_GOAL_ID}/prompt`,
        '/api/goals/latest/closeout',
        `/api/goals/${V20_GOAL_ID}/closeout`,
        '/api/capabilities',
        '/api/diagnostics',
        `/api/runs/${ROUTE_SMOKE_RUN_ID}/artifacts/summary/preview`
      ];
      const methods = ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];

      for (const path of paths) {
        for (const method of methods) {
          const response = await fetch(`${context.baseUrl}${path}`, { method });

          assert.equal(response.status, 405, `${method} ${path}`);

          if (method !== 'HEAD') {
            assert.match(response.headers.get('content-type') ?? '', /^application\/json; charset=utf-8/iu);
            assert.doesNotMatch(await response.text(), /<div id="root"><\/div>/u);
          }
        }
      }

      const after = await collectTextFileSnapshot(context.stateDir);

      assert.deepEqual(after, before);
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('rejects safe preview traversal and arbitrary path probes', async () => {
    const context = await startConsoleServer();

    try {
      const before = await collectTextFileSnapshot(context.stateDir);
      const probes = [
        {
          path: `/api/runs/${ROUTE_SMOKE_RUN_ID}/artifacts/summary/preview?path=package.json`,
          status: 400
        },
        {
          path: `/api/runs/${ROUTE_SMOKE_RUN_ID}/artifacts/%2e%2e%2fpackage.json/preview`,
          status: 400
        },
        {
          path: '/api/runs/%2e%2e%2fpackage.json/artifacts/summary/preview',
          status: 400
        },
        {
          path: `/api/runs/${ROUTE_SMOKE_RUN_ID}/artifacts/package.json/preview`,
          status: 404
        },
        {
          path: `/api/runs/${ROUTE_SMOKE_RUN_ID}/artifacts/task-packet/preview`,
          status: 404
        }
      ];

      for (const probe of probes) {
        const response = await fetch(`${context.baseUrl}${probe.path}`);
        const body = await response.text();

        assert.equal(response.status, probe.status, probe.path);
        assert.match(response.headers.get('content-type') ?? '', /^application\/json; charset=utf-8/iu);
        assert.doesNotMatch(
          body,
          /multi-coding-agent-symphony|lockfileVersion|createSymphonyConsoleServer/u,
          probe.path
        );
      }

      const after = await collectTextFileSnapshot(context.stateDir);

      assert.deepEqual(after, before);
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('rejects unregistered handoff refs and traversal probes', async () => {
    const context = await startConsoleServer();

    try {
      const before = await collectTextFileSnapshot(context.stateDir);
      const probes = [
        {
          path: '/api/handoff/package.json',
          status: 404
        },
        {
          path: '/api/handoff/guided-goal-handoff.v2',
          status: 404
        },
        {
          path: `/api/handoff/${GUIDED_GOAL_HANDOFF_CONTRACT_NAME}?path=package.json`,
          status: 400
        },
        {
          path: '/api/handoff/%2e%2e%2fpackage.json',
          status: 400
        },
        {
          path: '/api/handoff/%5c..%5cpackage.json',
          status: 400
        },
        {
          path: `/api/handoff/${GUIDED_GOAL_HANDOFF_CONTRACT_NAME}/extra`,
          status: 400
        },
        {
          path: '/api/handoff/..%2fpnpm-lock.yaml',
          status: 400
        }
      ];

      for (const probe of probes) {
        const response = await fetch(`${context.baseUrl}${probe.path}`);
        const body = await response.text();

        assert.equal(response.status, probe.status, probe.path);
        assert.match(response.headers.get('content-type') ?? '', /^application\/json; charset=utf-8/iu);
        assert.doesNotMatch(
          body,
          /multi-coding-agent-symphony|lockfileVersion|createSymphonyConsoleServer/u,
          probe.path
        );
      }

      const after = await collectTextFileSnapshot(context.stateDir);

      assert.deepEqual(after, before);
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('rejects v18 events traversal and arbitrary path probes without writing state', async () => {
    const context = await startConsoleServer();

    try {
      const before = await collectTextFileSnapshot(context.stateDir);
      const probes = [
        '/api/goals/latest/events?path=package.json',
        '/api/goals/latest/events?path=%2FUsers%2Fandy%2Fpackage.json',
        '/api/goals/latest/events?path=file%3A%2F%2Fpackage.json',
        '/api/goals/latest/events?path=~%2Fpackage.json',
        '/api/goals/%2e%2e%2fpackage.json/events',
        '/api/goals/%2FUsers%2Fandy%2Fpackage.json/events',
        '/api/goals/file%3A%2F%2Fpackage.json/events',
        '/api/goals/~%2Fpackage.json/events'
      ];

      for (const path of probes) {
        const response = await fetch(`${context.baseUrl}${path}`);
        const body = await response.text();
        const envelope = JSON.parse(body);

        assert.equal(response.status, 400, path);
        assert.equal(envelope.contractName, 'error-envelope.v1');
        assert.equal(envelope.error.code, 'invalid-goal-ref');
        assert.deepEqual(validateErrorEnvelopeContract(envelope), {
          ok: true,
          errors: []
        });
        assert.doesNotMatch(
          body,
          /\/Users\/|multi-coding-agent-symphony|lockfileVersion|createSymphonyConsoleServer/u,
          path
        );
      }

      const after = await collectTextFileSnapshot(context.stateDir);

      assert.deepEqual(after, before);
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('rejects v19 active goal control traversal and query probes without writing state', async () => {
    const context = await startConsoleServer();

    try {
      const before = await collectTextFileSnapshot(context.stateDir);
      const suffixes = ['runbook', 'next', 'prompt', 'closeout'];
      const probes = suffixes.flatMap((suffix) => [
        `/api/goals/latest/${suffix}?path=package.json`,
        `/api/goals/%2e%2e%2fpackage.json/${suffix}`,
        `/api/goals/%2FUsers%2Fandy%2Fpackage.json/${suffix}`,
        `/api/goals/file%3A%2F%2Fpackage.json/${suffix}`,
        `/api/goals/~%2Fpackage.json/${suffix}`
      ]);

      for (const path of probes) {
        const response = await fetch(`${context.baseUrl}${path}`);
        const body = await response.text();
        const envelope = JSON.parse(body);

        assert.equal(response.status, 400, path);
        assert.equal(envelope.contractName, 'error-envelope.v1');
        assert.equal(
          envelope.error.code,
          path.includes('/prompt?') ? 'invalid-goal-prompt-request' : 'invalid-goal-ref'
        );
        assert.deepEqual(validateErrorEnvelopeContract(envelope), {
          ok: true,
          errors: []
        });
        assert.doesNotMatch(
          body,
          /\/Users\/|multi-coding-agent-symphony|lockfileVersion|createSymphonyConsoleServer/u,
          path
        );
      }

      const after = await collectTextFileSnapshot(context.stateDir);

      assert.deepEqual(after, before);
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('does not expose repository files or traversal probes through /workbench', async () => {
    const context = await startConsoleServer();
    const blockedPaths = [
      '/workbench/package.json',
      '/workbench/pnpm-lock.yaml',
      '/workbench/src/symphony/console.js',
      '/workbench/docs/plans/v15-task8-workbench-static-serving-evidence-2026-05-27.md',
      '/workbench/docs/plans/v16-task8-workbench-preview-consumption-evidence-2026-05-27.md',
      '/workbench/%2e%2e/package.json',
      '/workbench/..%2fpackage.json',
      '/workbench/%2e%2e%2fpnpm-lock.yaml',
      '/workbench/%2e%2e%2fsrc%2fsymphony%2fconsole.js',
      '/workbench/%2e%2e%2fdocs%2fplans%2fv15-task8-workbench-static-serving-evidence-2026-05-27.md',
      '/workbench/%5c..%5cpackage.json'
    ];
    const apiLikePaths = [
      '/workbench/api/summary',
      '/workbench/api/handoff',
      '/workbench/api/runs/latest',
      `/workbench/api/runs/${ROUTE_SMOKE_RUN_ID}/artifacts/summary/preview`
    ];
    const stageLikePaths = [
      '/workbench/docs/stages/v15-workbench-react-vite-migration.html',
      '/workbench/docs/stages/v15-workbench-react-vite-migration.stage.json'
    ];

    try {
      for (const path of blockedPaths) {
        const response = await fetch(`${context.baseUrl}${path}`);
        const body = await response.text();

        assert.equal([403, 404].includes(response.status), true, path);
        assert.doesNotMatch(
          body,
          /multi-coding-agent-symphony|lockfileVersion|createSymphonyConsoleServer|Task 8 Workbench/u,
          path
        );
      }

      for (const path of apiLikePaths) {
        const response = await fetch(`${context.baseUrl}${path}`);
        const body = await response.text();

        assert.equal(response.status, 200, path);
        assert.match(response.headers.get('content-type') ?? '', /^text\/html; charset=utf-8/iu);
        assert.match(body, /<div id="root"><\/div>/u, path);
        assert.doesNotMatch(
          body,
          /symphony\.console-|guided-goal-handoff|safe-artifact-preview|routeSmoke|blocked-artifact-path/u,
          path
        );
      }

      for (const path of stageLikePaths) {
        const response = await fetch(`${context.baseUrl}${path}`);
        const body = await response.text();

        assert.equal([403, 404].includes(response.status), true, path);
        assert.doesNotMatch(
          body,
          /<div id="root"><\/div>|symphony\.stage-charter|Stage Charter|v15-workbench-react-vite-migration/u,
          path
        );
      }
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('statically keeps the Workbench source free of execution, write, download, local-open, and model entry points', async () => {
    const sourceRoot = join(process.cwd(), 'frontend', 'workbench', 'src');
    const entryHtmlPath = join(process.cwd(), 'frontend', 'workbench', 'index.html');
    const files = [
      ...await collectTextFileSnapshot(sourceRoot),
      ['index.html', await readFile(entryHtmlPath, 'utf8')]
    ];
    const forbiddenEntrypoints = [
      {
        label: 'mutation controls',
        pattern: /<form\b|<a\b[^>]*download\s*=/iu
      },
      {
        label: 'mutation event handlers',
        pattern: /\bonSubmit\s*=/u
      },
      {
        label: 'raw HTML rendering',
        pattern: /\bdangerouslySetInnerHTML\b/u
      },
      {
        label: 'browser execution channels',
        pattern: /\b(?:eval\s*\(|new Function\b|XMLHttpRequest\b|WebSocket\b|EventSource\b|navigator\.sendBeacon\b)/u
      },
      {
        label: 'browser write storage',
        pattern: /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/u
      },
      {
        label: 'download or local file open APIs',
        pattern: /\b(?:URL\.createObjectURL|Blob\s*\(|window\.open|globalThis\.open|showOpenFilePicker|showSaveFilePicker|launchQueue)\b/u
      },
      {
        label: 'model API endpoints',
        pattern: /\/v1\/(?:responses|chat\/completions|completions|models)|\/api\/(?:chat|models|completions)|\b(?:openai|anthropic)\b/iu
      },
      {
        label: 'shell process APIs',
        pattern: /\b(?:child_process|spawn\s*\(|execFile\s*\(|exec\s*\()\b/u
      }
    ];

    for (const [relativePath, source] of files) {
      for (const forbidden of forbiddenEntrypoints) {
        assert.doesNotMatch(source, forbidden.pattern, `${relativePath} exposes ${forbidden.label}`);
      }
      if (relativePath === 'App.jsx') {
        assert.match(source, /Preview dry-run plan/u, 'App.jsx exposes the v21 dry-run preview control');
        assert.match(source, /Confirm event append/u, 'App.jsx exposes the v21 controlled confirm control');
        assert.match(source, /function workbenchNavHref/u, 'App.jsx keeps anchors scoped to Workbench navigation');
        assert.match(source, /return `\/workbench\/\$\{query\}#\$\{item\.targetId\}`/u, 'App.jsx section anchors stay under /workbench/');
        assert.doesNotMatch(source, /\bonClick\s*=\s*\{(?!(?:handlePreview|handleConfirm)\})/u, 'App.jsx exposes a non-preview/non-confirm click handler');
      } else {
        assert.doesNotMatch(source, /\bonClick\s*=/u, `${relativePath} exposes a click handler`);
      }
      assert.doesNotMatch(source, /\bfetch\s*\(/u, `${relativePath} should use the read-only fetch wrapper only`);
      if (relativePath === 'api/client.js') {
        assert.match(source, /confirmGoalEventPlan/u, 'api/client.js exposes the controlled confirm wrapper');
        assert.match(source, /\bmethod\s*:\s*'POST'[\s\S]*body:\s*JSON\.stringify\(body\)/u);
        assert.doesNotMatch(source, /\bmethod\s*:\s*['"`](?:PUT|PATCH|DELETE|HEAD)['"`]/u);
      } else {
        assert.doesNotMatch(source, /\bbody\s*:/u, `${relativePath} should not attach request bodies`);
        assert.doesNotMatch(
          source,
          /\bmethod\s*:\s*['"`](?:POST|PUT|PATCH|DELETE|HEAD)['"`]/u,
          `${relativePath} should not declare non-GET Workbench requests`
        );
      }
    }

    const clientSource = files.find(([relativePath]) => relativePath === 'api/client.js')?.[1] ?? '';

    assert.match(clientSource, /fetchImpl\(route\.path,\s*\{\s*method:\s*'GET'/su);
    assert.match(clientSource, /fetchImpl\(path,\s*\{\s*method:\s*'POST'/su);
  });
});

async function startConsoleServer() {
  const root = await mkdtemp(join(tmpdir(), 'symphony-workbench-route-smoke-'));
  const stateDir = join(root, '.symphony');

  await writeRouteSmokeRunFixture({ root, stateDir });

  const server = createSymphonyConsoleServer({
    stateDir,
    cwd: root,
    env: { HOME: root },
    runner: new RouteSmokeReadinessRunner()
  });
  const baseUrl = await listenOnRandomPort(server);

  return {
    root,
    stateDir,
    server,
    baseUrl
  };
}

async function writeRouteSmokeRunFixture({ root, stateDir }) {
  const artifactDir = join(root, 'artifacts');
  const summaryArtifactPath = join(artifactDir, 'summary.json');
  const harnessOutputPath = join(artifactDir, 'unsafe.html');
  const contextArtifactPath = join(process.cwd(), 'package.json');
  const runState = {
    version: '1',
    kind: 'symphony-run-state',
    contractVersion: '1',
    contractName: 'symphony.run-state',
    runId: ROUTE_SMOKE_RUN_ID,
    command: 'symphony scan',
    intent: 'scan-project',
    semanticCommand: 'scan',
    pipeline: ['scan'],
    safetyMode: 'read-only',
    executionMode: 'dry-run',
    projectWrites: false,
    runtimeWrites: true,
    externalCalls: false,
    destructiveWrites: false,
    modelInvocation: false,
    verifierStatus: 'passed',
    status: 'passed',
    projectRoot: root,
    contextArtifactPath,
    summaryArtifactPath,
    harnessOutputPath,
    nextAction: 'symphony status',
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME
  };

  await mkdir(artifactDir, { recursive: true });
  await writeFile(summaryArtifactPath, '{"routeSmoke":true}\n', 'utf8');
  await writeFile(harnessOutputPath, '<script>alert("unsafe")</script>\n', 'utf8');
  await writeFixtureJson(join(stateDir, 'runs', `${ROUTE_SMOKE_RUN_ID}.json`), runState);
  await writeFixtureJson(join(stateDir, 'runs', 'latest.json'), runState);

  const initPlan = await buildGoalRunbookInitPlan({
    stateDir,
    goalId: V20_GOAL_ID,
    fromJson: V20_RUNBOOK_FIXTURE
  });

  await confirmGoalRunbookInit({
    stateDir,
    goalId: V20_GOAL_ID,
    fromJson: V20_RUNBOOK_FIXTURE,
    planHash: initPlan.planHash
  });
}

async function writeFixtureJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
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

async function cleanupConsoleServer({ root, server }) {
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

function extractWorkbenchAssetPaths(html) {
  const script = /<script[^>]+src="([^"]+\.js)"/u.exec(html)?.[1];
  const style = /<link[^>]+href="([^"]+\.css)"/u.exec(html)?.[1];

  assert.equal(typeof script, 'string');
  assert.equal(typeof style, 'string');

  return {
    script,
    style
  };
}

async function collectTextFileSnapshot(root) {
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(path);
        continue;
      }

      if (entry.isFile()) {
        files.push([
          relative(root, path).replaceAll('\\', '/'),
          await readFile(path, 'utf8')
        ]);
      }
    }
  }

  await visit(root);

  return files.sort(([left], [right]) => left.localeCompare(right));
}

class RouteSmokeReadinessRunner {
  async run({ executable, args = [] }) {
    if (executable === 'pnpm' && args.join(' ') === '--version') {
      return commandResult({ exitCode: 0, stdout: '10.0.0\n' });
    }

    if (executable === 'git' && args.join(' ') === 'rev-parse --is-inside-work-tree') {
      return commandResult({ exitCode: 0, stdout: 'true\n' });
    }

    if (executable === 'git' && args.join(' ') === 'branch --show-current') {
      return commandResult({ exitCode: 0, stdout: 'v16-task9-route-smoke-security\n' });
    }

    if (executable === 'git' && args.join(' ') === 'rev-parse --short HEAD') {
      return commandResult({ exitCode: 0, stdout: 'task9abc\n' });
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

function assertValidSafePreview(preview) {
  assert.deepEqual(validateSafeArtifactPreviewContract(preview), {
    ok: true,
    errors: []
  });
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
