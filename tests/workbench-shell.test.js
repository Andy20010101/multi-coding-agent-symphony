import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer as createViteServer } from 'vite';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildReviewGateControlledConfirmationState
} from '../src/symphony/review-gate-workbench-surface-contracts.js';
import {
  GOAL_EVENTS_ROUTE_TEMPLATE,
  GOAL_OPERATIONS_ROUTE_TEMPLATE,
  GOAL_PROMPT_PACK_ROUTE_TEMPLATE,
  GOAL_PROGRESS_ROUTE_TEMPLATE,
  GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE,
  READONLY_API_ROUTES,
  RUN_TIMELINE_ROUTE_TEMPLATE,
  projectWorkbenchContracts
} from '../frontend/workbench/src/api/contracts.js';

const frontendFiles = [
  'frontend/workbench/index.html',
  'frontend/workbench/vite.config.js',
  'frontend/workbench/src/main.jsx',
  'frontend/workbench/src/App.jsx',
  'frontend/workbench/src/api/client.js',
  'frontend/workbench/src/api/contracts.js',
  'frontend/workbench/src/fixtures/supervisorDashboardFixtures.js',
  'frontend/workbench/src/styles/workbench.css'
];

describe('v15 Workbench React/Vite shell', () => {
  it('adds only narrow Workbench Vite scripts', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8'));

    assert.equal(pkg.scripts['workbench:build'], 'vite build --config frontend/workbench/vite.config.js');
    assert.equal(pkg.scripts['workbench:dev'], 'vite --host 127.0.0.1 --config frontend/workbench/vite.config.js');
  });

  it('keeps the shell without browser execution controls or generic write API calls', async () => {
    const sources = await Promise.all(
      frontendFiles.map((file) => readFile(file, 'utf8'))
    );
    const source = sources.join('\n');

    assert.doesNotMatch(source, /role\s*=\s*["']button["']|<form\b|<textarea\b/i);
    assert.match(source, /Preview dry-run plan/u);
    assert.match(source, /Confirm event append/u);
    assert.match(source, /fetchGoalEventPlanPreview/u);
    assert.match(source, /confirmGoalEventPlan/u);
    assert.match(source, /function workbenchNavHref/u);
    assert.match(source, /workbenchContextQuery/u);
    assert.match(source, /return `\/workbench\/\$\{query\}#\$\{item\.targetId\}`/u);
    assert.doesNotMatch(source, /\bonSubmit\b|addEventListener\s*\(/);
    assert.doesNotMatch(source, /XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon|navigator\.clipboard|serviceWorker|localStorage|indexedDB/);
    assert.match(source, /method:\s*'POST'[\s\S]*body:\s*JSON\.stringify\(body\)/u);
    assert.doesNotMatch(source, /\bmethod\s*:\s*['"`](PUT|PATCH|DELETE)['"`]/i);
    assert.doesNotMatch(source, /\bhandle(Execute|Retry|Apply|Adopt|Rollback|Delete|Install|Mutate|Audit)\b/);
  });

  it('renders the Task 6 and Task 7 panels as read-only source components', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');

    for (const componentName of [
      'SummaryPanel',
      'RuntimeSnapshotPanel',
      'RuntimeGateList',
      'RuntimeBlockerList',
      'ReadinessPanel',
      'RunsPanel',
      'LatestRunPanel',
      'TimelinePanel',
      'ArtifactListPanel',
      'AdoptionSummaryPanel',
      'HandoffPanel',
      'GoalProgressPanel',
      'ActiveGoalViewModelPanel',
      'ActiveGoalRunbookPanel',
      'ActiveGoalTaskQueuePanel',
      'GoldenPathPanel',
      'GoldenPathStepList',
      'ActionRegistryPanel',
      'ActionRegistryList',
      'WorkflowRouterCategoriesPanel',
      'WorkflowRouterCategoryList',
      'WorkflowRouterExampleList',
      'NextActionCard',
      'PromptPreviewDrawer',
      'GoalOperationConsolePanel',
      'OperationConsoleRunCard',
      'OperationConsoleRunList',
      'GoalOperationInlineConsole',
      'OperationArtifactRefList',
      'PromptRoleGuidance',
      'CloseoutGapsPanel',
      'GoalEventsTimelinePanel',
      'EvidenceMatrixPanel',
      'CapabilitiesPanel',
      'DiagnosticsV1Panel',
      'AppCoreReleaseManagerPanel',
      'AppCoreCapabilityChecklist',
      'CommandBlockList',
      'HandoffTaskList',
      'GoalTaskList',
      'ActiveGoalCommandInventoryList',
      'GoalRunbookTaskList',
      'ActiveGoalTaskQueueList',
      'PromptPreviewList',
      'CloseoutMissingList',
      'ReleaseVerificationChecklist',
      'ReleaseReadyGateRegistration',
      'TagEvidencePrompt',
      'GoalEventTimelineList',
      'EvidenceMatrixTaskList',
      'ReleaseGateMatrixList'
    ]) {
      assert.match(app, new RegExp(`function ${componentName}\\b`, 'u'));
    }

    assert.match(app, /暂无 timeline/u);
    assert.match(app, /App Runtime Snapshot/u);
    assert.match(app, /v33 app runtime snapshot/u);
    assert.match(app, /runtime health/u);
    assert.match(app, /current project/u);
    assert.match(app, /release state/u);
    assert.match(app, /known blockers/u);
    assert.match(app, /读取中/u);
    assert.match(app, /读取失败/u);
    assert.match(app, /artifactRefs 只读列表/u);
    assert.match(app, /Adoption summary 只读状态/u);
    assert.match(app, /Guided Goal Handoff/u);
    assert.match(app, /Goal Progress Ledger/u);
    assert.match(app, /ActiveGoalViewModel/u);
    assert.match(app, /Active Goal Runbook/u);
    assert.match(app, /Active Goal Task Queue/u);
    assert.match(app, /Golden Path/u);
    assert.match(app, /v20 primary workflow/u);
    assert.match(app, /Workflow Router/u);
    assert.match(app, /route categories/u);
    assert.match(app, /WorkflowRouterCategoryList/u);
    assert.match(app, /WorkflowRouterExampleList/u);
    assert.match(app, /Next Action Card/u);
    assert.match(app, /Goal Operation Console/u);
    assert.match(app, /command preview/u);
    assert.match(app, /stdout/u);
    assert.match(app, /stderr/u);
    assert.match(app, /exitCode/u);
    assert.match(app, /run result bridge/u);
    assert.match(app, /artifact refs \/ verifier summary/u);
    assert.match(app, /afterCompletion\.registrationCommand/u);
    assert.match(app, /Prompt Preview Drawer/u);
    assert.match(app, /copy-only prompt drawer/u);
    assert.match(app, /role boundary/u);
    assert.match(app, /evidence requirements/u);
    assert.match(app, /handoff checklist/u);
    assert.match(app, /Closeout Gaps/u);
    assert.match(app, /Goal Events Timeline/u);
    assert.match(app, /Evidence Matrix/u);
    assert.match(app, /App Core Release Manager/u);
    assert.match(app, /v40 app core release manager/u);
    assert.match(app, /Capabilities Contract/u);
    assert.match(app, /Diagnostics Contract/u);
    assert.match(app, /phase \/ copy-only commands/u);
    assert.match(app, /tasks \/ evidence \/ review gate/u);
    assert.match(app, /刷新页面后会重新读取只读 API/u);
    assert.doesNotMatch(app, /\bfetch\s*\(/u);
    assert.doesNotMatch(app, /rawRunState/u);
  });

  it('renders the v34 Action Registry panel from backend action contracts without execution handlers', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const actionRegistryBody = app.slice(
      app.indexOf('function ActionRegistryPanel'),
      app.indexOf('function PromptPreviewDrawer')
    );
    const actionRegistryProjection = contracts.slice(
      contracts.indexOf('function projectActionRegistryPanel'),
      contracts.indexOf('export function projectSubagentHandoffBoard')
    );

    assert.match(app, /<ActionRegistryPanel[\s\S]*registry=\{model\.activeGoal\.actionRegistry\}/u);
    assert.match(app, /manifestRoute=\{findRoute\(model\.routeStates, 'actionManifest'\)\}/u);
    assert.match(app, /availabilityRoute=\{findRoute\(model\.routeStates, 'actionAvailability'\)\}/u);
    assert.match(app, /previewRoute=\{findRoute\(model\.routeStates, 'actionPreview'\)\}/u);
    assert.match(actionRegistryBody, /title="Action Registry Panel"/u);
    assert.match(actionRegistryBody, /<button type="button" disabled>\{action\.label\.text\}<\/button>/u);
    assert.doesNotMatch(actionRegistryBody, /onClick=|fetch\(|confirmGoalEventPlan|confirmControlledImplementationRunPlan|window\.open|location\.href/u);
    assert.match(actionRegistryProjection, /action-manifest\.v1 \+ action-availability\.v1 \+ action-preview\.v1/u);
    assert.doesNotMatch(actionRegistryProjection, /symphony\s+[^']*--|command\.replace|copyOnlyCommand/u);
  });

  it('renders the Active Goal workflow before legacy Workbench information panels', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const primarySection = app.indexOf('className="primary-active-goal-grid"');
    const activeGoalRunbook = app.indexOf('<ActiveGoalRunbookPanel', primarySection);
    const activeGoalTaskQueue = app.indexOf('<ActiveGoalTaskQueuePanel', primarySection);
    const supportingSection = app.indexOf('className="active-goal-grid"', primarySection);
    const legacyPanelSection = app.indexOf('className="panel-grid"', supportingSection);
    const detailSection = app.indexOf('className="detail-grid"', legacyPanelSection);

    assert.notEqual(primarySection, -1);
    assert.notEqual(activeGoalRunbook, -1);
    assert.notEqual(activeGoalTaskQueue, -1);
    assert.notEqual(supportingSection, -1);
    assert.notEqual(legacyPanelSection, -1);
    assert.notEqual(detailSection, -1);
    assert.equal(activeGoalRunbook > primarySection && activeGoalRunbook < supportingSection, true);
    assert.equal(activeGoalTaskQueue > activeGoalRunbook && activeGoalTaskQueue < supportingSection, true);
    assert.equal(primarySection < supportingSection, true);
    assert.equal(supportingSection < legacyPanelSection, true);
    assert.equal(legacyPanelSection < detailSection, true);
    assert.match(app, /aria-label="v20 primary active goal workflow"/u);
    assert.match(app, /aria-label="v20 Active Goal supporting contracts"/u);
  });

  it('renders the v28 Workbench state header and navigates first-screen user paths', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const css = await readFile('frontend/workbench/src/styles/workbench.css', 'utf8');
    const navSource = app.slice(
      app.indexOf('const WORKBENCH_NAV_ITEMS'),
      app.indexOf('export default function App')
    );
    const stateHeaderProjection = app.slice(
      app.indexOf('function buildWorkbenchStateHeader'),
      app.indexOf('function routeStateCounts')
    );
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const viewState = createWorkbenchRenderViewState();

      viewState.model.routeContext = createWorkbenchRenderRouteContext();

      const homeHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/', viewState);
      const promptHtml = renderWorkbenchShellAt(
        WorkbenchShell,
        '/workbench/prompts/?goal=v28-workbench-v1-release&task=task-2&role=reviewer',
        viewState
      );

      for (const label of [
        'Runtime',
        'Active Goal',
        'Prompt Handoff',
        'Operations',
        'Implementation',
        'Adoption',
        'Review',
        'Verification',
        'Closeout'
      ]) {
        assert.match(navSource, new RegExp(label, 'u'));
        assert.match(homeHtml, new RegExp(`>${label}<`, 'u'));
      }

      const stateHeaderIndex = homeHtml.indexOf('class="workbench-state-header"');
      const navigationIndex = homeHtml.indexOf('class="workbench-nav"');
      const runtimePanelIndex = homeHtml.indexOf('id="runtime-snapshot-panel"');
      const activeGoalPanelIndex = homeHtml.indexOf('id="active-goal-runbook-panel"');
      const legacyPanelIndex = homeHtml.indexOf('id="summary-panel-title"');

      assert.notEqual(stateHeaderIndex, -1);
      assert.notEqual(navigationIndex, -1);
      assert.notEqual(runtimePanelIndex, -1);
      assert.notEqual(activeGoalPanelIndex, -1);
      assert.notEqual(legacyPanelIndex, -1);
      assert.equal(stateHeaderIndex < navigationIndex, true);
      assert.equal(navigationIndex < runtimePanelIndex, true);
      assert.equal(runtimePanelIndex < activeGoalPanelIndex, true);
      assert.equal(activeGoalPanelIndex < legacyPanelIndex, true);
      assert.match(homeHtml, /App Runtime Snapshot/u);
      assert.match(homeHtml, /Runtime snapshot is the shared read-only app state schema consumed by CLI and Workbench/u);
      assert.match(homeHtml, /id="golden-path-panel"/u);
      assert.match(homeHtml, /goal init\/status -&gt; closeout gaps/u);
      assert.match(homeHtml, /copyOnlyCommands/u);
      assert.match(homeHtml, /controlledConfirmOnly/u);
      assert.match(homeHtml, /route context \/ goal-status/u);
      assert.match(homeHtml, /goal-next-action/u);
      assert.match(homeHtml, /goal-operation-runs/u);
      assert.match(homeHtml, /Goal \/ Task \/ Run \/ Evidence Context/u);
      assert.match(homeHtml, /v28-workbench-v1-release/u);
      assert.match(homeHtml, /op_v28_task2/u);
      assert.match(homeHtml, /docs\/plans\/v28-task-2-worker-evidence-2026-05-29\.md/u);
      assert.match(homeHtml, /href="\/workbench\/prompts\/\?goal=v28-workbench-v1-release&amp;task=task-2&amp;role=worker&amp;operation=op_v28_task2&amp;run=run-v28-task2&amp;evidence=docs%2Fplans%2Fv28-task-2-worker-evidence-2026-05-29\.md"[\s\S]*>Prompt Handoff</u);
      assert.match(homeHtml, /href="\/workbench\/\?goal=v28-workbench-v1-release&amp;task=task-2&amp;role=worker&amp;operation=op_v28_task2&amp;run=run-v28-task2&amp;evidence=docs%2Fplans%2Fv28-task-2-worker-evidence-2026-05-29\.md#goal-operation-console-panel"[\s\S]*>Operations</u);
      assert.match(homeHtml, /id="goal-operation-console-panel"/u);
      assert.match(homeHtml, /class="workbench-nav-item active" href="\/workbench\/\?goal=v28-workbench-v1-release&amp;task=task-2&amp;role=worker&amp;operation=op_v28_task2&amp;run=run-v28-task2&amp;evidence=docs%2Fplans%2Fv28-task-2-worker-evidence-2026-05-29\.md#active-goal-runbook-panel" aria-current="page"[\s\S]*>Active Goal</u);

      assert.match(promptHtml, /Prompt Handoff Workspace/u);
      assert.match(promptHtml, /selected goal<\/dt><dd[^>]*>v28-workbench-v1-release/u);
      assert.match(promptHtml, /selected task<\/dt><dd[^>]*>task-2/u);
      assert.match(promptHtml, /selected role<\/dt><dd[^>]*>reviewer/u);
      assert.match(promptHtml, /context operation<\/dt><dd[^>]*>op_v28_task2/u);
      assert.match(promptHtml, /class="workbench-nav-item active" href="\/workbench\/prompts\/\?goal=v28-workbench-v1-release&amp;task=task-2&amp;role=worker&amp;operation=op_v28_task2&amp;run=run-v28-task2&amp;evidence=docs%2Fplans%2Fv28-task-2-worker-evidence-2026-05-29\.md" aria-current="page"[\s\S]*>Prompt Handoff</u);
      assert.doesNotMatch(promptHtml, /class="workbench-nav-item active" href="\/workbench\/#active-goal-runbook-panel" aria-current="page"/u);
    } finally {
      await server.close();
      restoreSsrLocation();
    }

    assert.match(app, /v28 Workbench v1/u);
    assert.match(app, /<WorkbenchStateHeader header=\{stateHeader\}/u);
    assert.match(app, /<WorkbenchNavigation currentRoute=\{workbenchRoute\} routeContext=\{routeContext\}/u);
    assert.match(app, /<WorkbenchRouteContextBar context=\{routeContext\}/u);
    assert.match(app, /<GoldenPathPanel goldenPath=\{model\.goldenPath\}/u);
    assert.match(app, /goal init\/status -> closeout gaps/u);
    assert.match(app, /buildWorkbenchStateHeader/u);
    assert.match(app, /promptWorkspaceRouteSelection/u);
    assert.match(stateHeaderProjection, /route context \/ goal-status/u);
    assert.match(stateHeaderProjection, /goal-next-action/u);
    assert.match(stateHeaderProjection, /goal-operation-runs/u);
    assert.match(app, /Navigation follows the latest goal\/runbook\/next-action workflow/u);
    assert.match(css, /\.workbench-state-header/u);
    assert.match(css, /\.workbench-nav/u);
    assert.match(css, /\.workbench-nav-item:focus-visible/u);
    assert.doesNotMatch(navSource, /\bscan\b|\bdo\b|\bstatus\b|\bcontinue\b|\bartifacts\b/u);
  });

  it('renders the v47 Desktop App Home route as a native-first read-only surface', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const css = await readFile('frontend/workbench/src/styles/workbench.css', 'utf8');
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const viewState = createWorkbenchRenderViewState();

      viewState.model.routeContext = createWorkbenchRenderRouteContext();

      const desktopHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/desktop/?goal=v47-mac-app-shell-activation&task=task-1', viewState);
      const statusStripIndex = desktopHtml.indexOf('class="desktop-development-strip"');
      const firstRowIndex = desktopHtml.indexOf('id="desktop-overview"');
      const lowerGridIndex = desktopHtml.indexOf('class="desktop-card-grid desktop-lower-grid"');
      const appHomeIndex = desktopHtml.indexOf('class="desktop-app-home-panel"');
      const appStateIndex = desktopHtml.indexOf('class="desktop-app-state-strip"');
      const statusStripHtml = desktopHtml.slice(statusStripIndex, firstRowIndex);

      assert.match(desktopHtml, /Symphony App Home/u);
      assert.match(desktopHtml, /v47 Mac App Home/u);
      assert.match(desktopHtml, /class="workbench-shell desktop-shell-route"/u);
      assert.match(desktopHtml, /App Home/u);
      assert.match(desktopHtml, /href="#desktop-overview" aria-current="page">Home/u);
      assert.match(desktopHtml, /Native App Home/u);
      assert.match(desktopHtml, />backend</u);
      assert.match(desktopHtml, />boundary</u);
      assert.match(desktopHtml, />willMutate/u);
      assert.match(desktopHtml, />repo path source</u);
      assert.match(desktopHtml, />route source</u);
      assert.match(desktopHtml, />command preview</u);
      assert.match(desktopHtml, /inert text only/u);
      assert.match(desktopHtml, /backend unavailable/u);
      assert.match(desktopHtml, /sidecar missing/u);
      assert.match(desktopHtml, /sidecar launchable/u);
      assert.match(desktopHtml, /sidecar launching/u);
      assert.match(desktopHtml, /sidecar failed/u);
      assert.match(desktopHtml, /sidecar wrong port/u);
      assert.match(desktopHtml, /sidecar port conflict/u);
      assert.match(desktopHtml, /sidecar stale/u);
      assert.match(desktopHtml, /sidecar unavailable/u);
      assert.match(desktopHtml, /project missing/u);
      assert.match(desktopHtml, /active goal missing/u);
      assert.match(desktopHtml, /supervisor model unavailable/u);
      assert.match(desktopHtml, /stale snapshot/u);
      assert.match(desktopHtml, /route failed/u);
      assert.match(desktopHtml, /backend unavailable[\s\S]*true \/ failed/u);
      assert.match(desktopHtml, /sidecar missing[\s\S]*true \/ missing/u);
      assert.match(desktopHtml, /project missing[\s\S]*true \/ missing/u);
      assert.match(desktopHtml, /active goal missing[\s\S]*true \/ missing/u);
      assert.match(desktopHtml, /supervisor model unavailable[\s\S]*true \/ failed/u);
      assert.match(desktopHtml, /route failed[\s\S]*true \/ failed/u);
      assert.match(desktopHtml, /runtime snapshot route failed/u);
      assert.match(desktopHtml, /Backend/u);
      assert.match(desktopHtml, /project registry/u);
      assert.match(desktopHtml, /Projects/u);
      assert.match(desktopHtml, /sidecar health/u);
      assert.match(desktopHtml, />launch states</u);
      assert.match(desktopHtml, />allowed hosts</u);
      assert.match(desktopHtml, />allowed port min</u);
      assert.match(desktopHtml, />allowed port max</u);
      assert.match(desktopHtml, /renderer does not execute shell commands/u);
      assert.match(desktopHtml, /Active Goal/u);
      assert.match(desktopHtml, /Next Action/u);
      assert.match(desktopHtml, /Run health/u);
      assert.match(desktopHtml, /Supervisor/u);
      assert.match(desktopHtml, />command execution</u);
      assert.match(desktopHtml, /Route Sources/u);
      assert.match(desktopHtml, /route \/ source provenance/u);
      assert.match(desktopHtml, /live contract|failed route|missing route/u);
      assert.notEqual(appHomeIndex, -1);
      assert.notEqual(appStateIndex, -1);
      assert.notEqual(statusStripIndex, -1);
      assert.notEqual(firstRowIndex, -1);
      assert.notEqual(lowerGridIndex, -1);
      assert.equal(appHomeIndex < appStateIndex, true);
      assert.equal(appStateIndex < statusStripIndex, true);
      assert.equal(statusStripIndex < firstRowIndex, true);
      assert.equal(firstRowIndex < lowerGridIndex, true);
      assert.match(statusStripHtml, />blocked</u);
      assert.match(statusStripHtml, />review</u);
      assert.match(statusStripHtml, />main verification</u);
      assert.match(statusStripHtml, />release state</u);
      assert.match(statusStripHtml, />blockers</u);
      assert.match(statusStripHtml, />status source</u);
      assert.match(desktopHtml, /Lifecycle/u);
      assert.match(desktopHtml, /Review \/ Verification \/ Release/u);
      assert.match(desktopHtml, /Job \/ Run State/u);
      assert.match(desktopHtml, />actionId</u);
      assert.match(desktopHtml, />created</u);
      assert.match(desktopHtml, />run-control state</u);
      assert.match(desktopHtml, /Run-control transitions 未暴露/u);
      assert.match(desktopHtml, /Evidence Readiness/u);
      assert.match(desktopHtml, />preview routes</u);
      assert.match(desktopHtml, />safe inline</u);
      assert.match(desktopHtml, />artifact index</u);
      assert.match(desktopHtml, />evidence timeline</u);
      assert.match(desktopHtml, />install status</u);
      assert.match(desktopHtml, />install target</u);
      assert.match(desktopHtml, />install doctor</u);
      assert.match(desktopHtml, />local file open</u);
      assert.match(desktopHtml, /Safe artifact preview routes 未暴露/u);
      assert.match(desktopHtml, /Provider Availability/u);
      assert.match(desktopHtml, />active providers</u);
      assert.match(desktopHtml, />provider CLI execution</u);
      assert.match(desktopHtml, /Tauri First/u);
      assert.match(desktopHtml, /No Runner Surface/u);
      assert.match(desktopHtml, /browser terminal/u);
      assert.match(desktopHtml, /generic shell runner/u);
      assert.match(desktopHtml, /shell exec/u);
      assert.match(desktopHtml, /provider CLI from renderer/u);
      assert.match(desktopHtml, /goal event registration/u);
      assert.match(desktopHtml, /git\/release action/u);
      assert.match(desktopHtml, /git write/u);
      assert.match(desktopHtml, /release declared/u);
      assert.doesNotMatch(desktopHtml, /class="workbench-nav"/u);
      assert.doesNotMatch(desktopHtml, /scan \/ do|release ready/u);

      const staleSnapshot = JSON.parse(await readFile('fixtures/contracts/app-state-snapshot.stale.v1.json', 'utf8'));
      const runtimeRoute = READONLY_API_ROUTES.find((route) => route.id === 'runtimeSnapshot');
      const staleViewState = createWorkbenchRenderViewState();
      staleViewState.model = projectWorkbenchContracts({
        runtimeSnapshot: readonlyRouteResult(runtimeRoute, staleSnapshot)
      });
      staleViewState.model.routeContext = createWorkbenchRenderRouteContext();

      const staleHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/desktop/', staleViewState);
      assert.match(staleHtml, /stale snapshot[\s\S]*true \/ stale/u);
      assert.match(staleHtml, /runtime freshness stale/u);
    } finally {
      await server.close();
      restoreSsrLocation();
    }

    assert.match(app, /DesktopShellRoute/u);
    assert.match(app, /DesktopAppHomePanel/u);
    assert.match(app, /DesktopAppStateStrip/u);
    assert.match(app, /DesktopCurrentProjectCard/u);
    assert.match(app, /DesktopBackendHealthCard/u);
    assert.match(app, /DesktopProjectListCard/u);
    assert.match(app, /DesktopSidecarCard/u);
    assert.match(app, /DesktopActiveGoalCard/u);
    assert.match(app, /DesktopNextActionCard/u);
    assert.match(app, /DesktopSupervisorSummaryCard/u);
    assert.match(app, /DesktopDevelopmentStatusCard/u);
    assert.match(app, /DesktopDevelopmentStatusStrip/u);
    assert.match(app, /DesktopArtifactReadinessCard/u);
    assert.match(app, /DesktopProviderHubCard/u);
    assert.match(app, /DesktopRouteProvenanceCard/u);
    assert.match(app, /DesktopJobTransitionList/u);
    assert.match(app, /DesktopArtifactPreviewList/u);
    assert.match(css, /\.desktop-shell-route/u);
    assert.match(css, /\.desktop-sidebar/u);
    assert.match(css, /\.desktop-app-home-panel/u);
    assert.match(css, /\.desktop-app-state-strip/u);
    assert.match(css, /\.desktop-development-strip/u);
    assert.match(css, /\.desktop-status\.plum/u);
    assert.match(css, /\.desktop-status\.olive/u);
    assert.match(css, /\.desktop-status\.amber/u);
    assert.doesNotMatch(app.slice(app.indexOf('function DesktopShellRoute'), app.indexOf('function GoldenPathPanel')), /fetch\(|confirmGoalEventPlan|window\.open|navigator\.clipboard|<form\b|<textarea\b/u);
  });

  it('renders the v52 System Golden Path panel on Desktop App Home without execution controls', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const css = await readFile('frontend/workbench/src/styles/workbench.css', 'utf8');
    const systemGoldenPathContract = JSON.parse(
      await readFile('fixtures/contracts/system-golden-path.result-intake-blocked.v1.json', 'utf8')
    );
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const supervisorRoute = READONLY_API_ROUTES.find((route) => route.id === 'goalSupervisor');
      const viewState = createWorkbenchRenderViewState();

      viewState.model = projectWorkbenchContracts({
        goalSupervisor: readonlyRouteResult(supervisorRoute, {
          ...createGoalSupervisorRenderPayload(),
          systemGoldenPath: systemGoldenPathContract
        })
      });
      viewState.model.routeContext = createWorkbenchRenderRouteContext();

      const desktopHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/desktop/', viewState);
      const appHomeIndex = desktopHtml.indexOf('class="desktop-app-home-panel"');
      const panelIndex = desktopHtml.indexOf('id="system-golden-path-panel"');
      const appStateIndex = desktopHtml.indexOf('class="desktop-app-state-strip"');
      const panelHtml = desktopHtml.slice(panelIndex, appStateIndex);

      assert.notEqual(panelIndex, -1);
      assert.equal(appHomeIndex < panelIndex, true);
      assert.equal(panelIndex < appStateIndex, true);
      assert.match(desktopHtml, /href="#system-golden-path-panel">System Path/u);
      assert.match(panelHtml, /System Golden Path/u);
      assert.match(panelHtml, /systemGoldenPath\.v1/u);
      assert.match(panelHtml, /Next Safe Action/u);
      assert.match(panelHtml, /Source Contract/u);
      assert.match(panelHtml, /Blocked Reason/u);
      assert.match(panelHtml, /Manual CLI Required/u);
      assert.match(panelHtml, /Refresh State/u);
      assert.match(panelHtml, /pending-result-blocked/u);
      assert.match(panelHtml, /pendingResult\.v1/u);
      assert.match(panelHtml, /result-intake/u);
      assert.match(panelHtml, /symphony goal review/u);
      assert.match(panelHtml, />willMutate<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />refresh source<\/dt><dd[^>]*>fetchWorkbenchContracts/u);
      assert.doesNotMatch(panelHtml, /<form\b|<textarea\b|confirmGoalEventPlan|Preview Event Plan|Confirm Event Append|Confirm Result Escrow/u);
      assert.doesNotMatch(panelHtml, /Run Agent|>Execute<|Launch Provider|Dispatch Child|Compact Now|New Thread|>Push<|>Tag<|>Publish<|>Release</u);
    } finally {
      await server.close();
      restoreSsrLocation();
    }

    assert.match(app, /SystemGoldenPathPanel/u);
    assert.match(app, /SystemGoldenPathRefreshControl/u);
    assert.match(app, /refreshSystemGoldenPathState/u);
    assert.match(css, /\.system-golden-path-panel/u);
    assert.match(css, /\.system-golden-path-step-list/u);
    assert.doesNotMatch(app.slice(app.indexOf('function SystemGoldenPathPanel'), app.indexOf('function DesktopAppStateStrip')), /fetch\(|confirmGoalEventPlan|window\.open|navigator\.clipboard|<form\b|<textarea\b/u);
  });

  it('renders the v53 Child Dispatch Preview lane on Desktop App Home as copy-only text', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const css = await readFile('frontend/workbench/src/styles/workbench.css', 'utf8');
    const childDispatchPreview = JSON.parse(
      await readFile('fixtures/contracts/child-dispatch-preview.codex-worker.v1.json', 'utf8')
    );
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const supervisorRoute = READONLY_API_ROUTES.find((route) => route.id === 'goalSupervisor');
      const viewState = createWorkbenchRenderViewState();

      viewState.model = projectWorkbenchContracts({
        goalSupervisor: readonlyRouteResult(supervisorRoute, {
          ...createGoalSupervisorRenderPayload(),
          childDispatchPreview
        })
      });
      viewState.model.routeContext = createWorkbenchRenderRouteContext();

      const desktopHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/desktop/', viewState);
      const systemPathIndex = desktopHtml.indexOf('id="system-golden-path-panel"');
      const panelIndex = desktopHtml.indexOf('id="child-dispatch-preview-panel"');
      const appStateIndex = desktopHtml.indexOf('class="desktop-app-state-strip"');
      const panelHtml = desktopHtml.slice(panelIndex, appStateIndex);

      assert.notEqual(panelIndex, -1);
      assert.equal(systemPathIndex < panelIndex, true);
      assert.equal(panelIndex < appStateIndex, true);
      assert.match(desktopHtml, /href="#child-dispatch-preview-panel">Child Task/u);
      assert.match(desktopHtml, /Refresh State/u);
      assert.match(panelHtml, /Preview Child Task/u);
      assert.match(panelHtml, /childDispatchPreview\.v1/u);
      assert.match(panelHtml, /Copy Child Task Pack/u);
      assert.match(panelHtml, /Copy Codex Task Pack/u);
      assert.match(panelHtml, /Copy Claude Code Task Pack/u);
      assert.match(panelHtml, /Expected Result Block/u);
      assert.match(panelHtml, /Return Through Result Intake/u);
      assert.match(panelHtml, /resultIntakeRequest\.v1/u);
      assert.match(panelHtml, /v51-result-intake/u);
      assert.match(panelHtml, />provider execution<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />child start<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />goal event write<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />will append event<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />willMutate<\/dt><dd[^>]*>false/u);
      assert.doesNotMatch(panelHtml, /<button\b|<form\b|<textarea\b/u);
      assert.doesNotMatch(panelHtml, /Dispatch Child|Run Child|Launch Codex|Launch Claude Code|>Execute<|Run Provider|Confirm Child Result|Append Event|Mark Complete|>Push<|>Tag<|>Publish<|>Release</u);
    } finally {
      await server.close();
      restoreSsrLocation();
    }

    assert.match(app, /ChildDispatchPreviewPanel/u);
    assert.match(app, /ChildDispatchCopyBlock/u);
    assert.match(css, /\.child-dispatch-preview-panel/u);
    assert.match(css, /\.child-dispatch-copy-grid/u);
    assert.doesNotMatch(app.slice(app.indexOf('function ChildDispatchPreviewPanel'), app.indexOf('function DesktopAppStateStrip')), /fetch\(|confirmGoalEventPlan|window\.open|navigator\.clipboard|<form\b|<textarea\b/u);
  });

  it('renders the v54 Codex provider execution lane on Desktop App Home as read-only state', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const css = await readFile('frontend/workbench/src/styles/workbench.css', 'utf8');
    const childDispatchPreview = JSON.parse(
      await readFile('fixtures/contracts/child-dispatch-preview.codex-worker.v1.json', 'utf8')
    );
    const codexProviderExecutionPreview = JSON.parse(
      await readFile('fixtures/contracts/codex-provider-execution/preview.ready.v1.json', 'utf8')
    );
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const supervisorRoute = READONLY_API_ROUTES.find((route) => route.id === 'goalSupervisor');
      const viewState = createWorkbenchRenderViewState();

      viewState.model = projectWorkbenchContracts({
        goalSupervisor: readonlyRouteResult(supervisorRoute, {
          ...createGoalSupervisorRenderPayload(),
          childDispatchPreview,
          codexProviderExecutionPreview
        })
      });
      viewState.model.routeContext = createWorkbenchRenderRouteContext();

      const desktopHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/desktop/', viewState);
      const childPanelIndex = desktopHtml.indexOf('id="child-dispatch-preview-panel"');
      const panelIndex = desktopHtml.indexOf('id="codex-provider-execution-preview-panel"');
      const appStateIndex = desktopHtml.indexOf('class="desktop-app-state-strip"');
      const panelHtml = desktopHtml.slice(panelIndex, appStateIndex);

      assert.notEqual(panelIndex, -1);
      assert.equal(childPanelIndex < panelIndex, true);
      assert.equal(panelIndex < appStateIndex, true);
      assert.match(desktopHtml, /href="#codex-provider-execution-preview-panel">Codex Run/u);
      assert.match(panelHtml, /Codex Execution Preview/u);
      assert.match(panelHtml, /Confirm Codex Run/u);
      assert.match(panelHtml, /Codex Run Status/u);
      assert.match(panelHtml, /Return Through Result Intake/u);
      assert.match(panelHtml, /Refresh State/u);
      assert.match(panelHtml, /codexProviderExecutionPreview\.v1/u);
      assert.match(panelHtml, /codexProviderExecutionRunnerResult\.v1/u);
      assert.match(panelHtml, /resultIntakeRequest\.v1/u);
      assert.match(panelHtml, /v51-result-intake/u);
      assert.match(panelHtml, />provider<\/dt><dd[^>]*>codex/u);
      assert.match(panelHtml, />role<\/dt><dd[^>]*>worker/u);
      assert.match(panelHtml, />preview hash<\/dt><dd[^>]*>sha256:[a-f0-9]{64}/u);
      assert.match(panelHtml, />task pack hash<\/dt><dd[^>]*>sha256:[a-f0-9]{64}/u);
      assert.match(panelHtml, />starts on preview<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />starts without confirmation<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />willMutate<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />goal event write<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />task completion write<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />reviewer mutation<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />main gate mutation<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />gate mutation<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />claude-code execution<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />provider parity<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />generic shell<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />arbitrary command<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />frontend JSONL read<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />local session file read<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />transcript exposure<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />model-output exposure<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />git mutation<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />tag automation<\/dt><dd[^>]*>false/u);
      assert.match(panelHtml, />publish automation<\/dt><dd[^>]*>false/u);
      assert.doesNotMatch(panelHtml, /<button\b|<form\b|<textarea\b/u);
      assert.doesNotMatch(panelHtml, /Launch Claude Code|Run Any Provider|Run Shell|Terminal|Append Event|Mark Complete|Confirm Reviewer Verdict|Confirm Main Gate|Confirm Release Gate|>Push<|>Tag<|>Publish<|>Release</u);
    } finally {
      await server.close();
      restoreSsrLocation();
    }

    assert.match(app, /CodexProviderExecutionPreviewPanel/u);
    assert.match(css, /\.codex-provider-execution-panel/u);
    assert.match(css, /\.codex-provider-source-list/u);
    assert.doesNotMatch(app.slice(app.indexOf('function CodexProviderExecutionPreviewPanel'), app.indexOf('function DesktopAppStateStrip')), /fetch\(|confirmGoalEventPlan|window\.open|navigator\.clipboard|<button\b|<form\b|<textarea\b/u);
  });

  it('renders the v55-v58 handoff lanes on Desktop App Home as read-only state', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const css = await readFile('frontend/workbench/src/styles/workbench.css', 'utf8');
    const childDispatchPreview = JSON.parse(
      await readFile('fixtures/contracts/child-dispatch-preview.codex-worker.v1.json', 'utf8')
    );
    const codexProviderExecutionPreview = JSON.parse(
      await readFile('fixtures/contracts/codex-provider-execution/preview.ready.v1.json', 'utf8')
    );
    const codexProviderRunRecovery = JSON.parse(
      await readFile('fixtures/contracts/codex-provider-run-recovery/recovery.completed-accepted.v1.json', 'utf8')
    );
    const reviewerHandoffPreview = JSON.parse(
      await readFile('fixtures/contracts/codex-provider-run-recovery/reviewer-handoff.ready.v1.json', 'utf8')
    );
    const threadHandoffPack = JSON.parse(
      await readFile('fixtures/contracts/thread-handoff-pack/thread-handoff-pack.ready-reviewer-handoff.v1.json', 'utf8')
    );
    const reviewGatePreview = JSON.parse(
      await readFile('fixtures/contracts/review-gate-workbench-surface/review-gate-preview.ready-reviewer-verdict.v1.json', 'utf8')
    );
    const releaseCloseoutHandoffPack = JSON.parse(
      await readFile('fixtures/contracts/release-closeout-handoff-pack/release-closeout-handoff-pack.ready.v1.json', 'utf8')
    );
    const releasePublicationEvidence = JSON.parse(
      await readFile('fixtures/contracts/release-publication-evidence/release-publication-evidence.ready.v1.json', 'utf8')
    );
    const stableWorkbenchRelease = JSON.parse(
      await readFile('fixtures/contracts/stable-workbench-release/stable-workbench-release.ready.v1.json', 'utf8')
    );
    const reviewGateConfirmationState = buildReviewGateControlledConfirmationState({
      generatedAt: '2026-06-14T02:00:00.000Z',
      reviewGatePreview,
      operatorId: 'operator-v57-controller'
    });
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const supervisorRoute = READONLY_API_ROUTES.find((route) => route.id === 'goalSupervisor');
      const viewState = createWorkbenchRenderViewState();

      viewState.model = projectWorkbenchContracts({
        goalSupervisor: readonlyRouteResult(supervisorRoute, {
          ...createGoalSupervisorRenderPayload(),
          childDispatchPreview,
          codexProviderExecutionPreview,
          codexProviderRunRecovery,
          reviewerHandoffPreview,
          threadHandoffPack,
          reviewGatePreview,
          reviewGateConfirmationState,
          releaseCloseoutHandoffPack,
          releasePublicationEvidence,
          stableWorkbenchRelease
        })
      });
      viewState.model.routeContext = createWorkbenchRenderRouteContext();

      const desktopHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/desktop/', viewState);
      const codexPanelIndex = desktopHtml.indexOf('id="codex-provider-execution-preview-panel"');
      const recoveryPanelIndex = desktopHtml.indexOf('id="codex-run-recovery-panel"');
      const handoffPanelIndex = desktopHtml.indexOf('id="reviewer-handoff-preview-panel"');
      const threadPackPanelIndex = desktopHtml.indexOf('id="thread-handoff-pack-panel"');
      const reviewGatePanelIndex = desktopHtml.indexOf('id="review-gate-workbench-panel"');
      const releaseHandoffPanelIndex = desktopHtml.indexOf('id="release-closeout-handoff-panel"');
      const publicationEvidencePanelIndex = desktopHtml.indexOf('id="release-publication-evidence-panel"');
      const stablePanelIndex = desktopHtml.indexOf('id="stable-workbench-release-panel"');
      const appStateIndex = desktopHtml.indexOf('class="desktop-app-state-strip"');
      const recoveryHtml = desktopHtml.slice(recoveryPanelIndex, handoffPanelIndex);
      const handoffHtml = desktopHtml.slice(handoffPanelIndex, threadPackPanelIndex);
      const threadPackHtml = desktopHtml.slice(threadPackPanelIndex, reviewGatePanelIndex);
      const reviewGateHtml = desktopHtml.slice(reviewGatePanelIndex, releaseHandoffPanelIndex);
      const releaseHandoffHtml = desktopHtml.slice(releaseHandoffPanelIndex, publicationEvidencePanelIndex);
      const publicationEvidenceHtml = desktopHtml.slice(publicationEvidencePanelIndex, stablePanelIndex);
      const stableHtml = desktopHtml.slice(stablePanelIndex, appStateIndex);

      assert.notEqual(recoveryPanelIndex, -1);
      assert.notEqual(handoffPanelIndex, -1);
      assert.notEqual(threadPackPanelIndex, -1);
      assert.notEqual(reviewGatePanelIndex, -1);
      assert.notEqual(releaseHandoffPanelIndex, -1);
      assert.notEqual(publicationEvidencePanelIndex, -1);
      assert.notEqual(stablePanelIndex, -1);
      assert.equal(codexPanelIndex < recoveryPanelIndex, true);
      assert.equal(recoveryPanelIndex < handoffPanelIndex, true);
      assert.equal(handoffPanelIndex < threadPackPanelIndex, true);
      assert.equal(threadPackPanelIndex < reviewGatePanelIndex, true);
      assert.equal(reviewGatePanelIndex < releaseHandoffPanelIndex, true);
      assert.equal(releaseHandoffPanelIndex < publicationEvidencePanelIndex, true);
      assert.equal(publicationEvidencePanelIndex < stablePanelIndex, true);
      assert.equal(stablePanelIndex < appStateIndex, true);
      assert.match(desktopHtml, /href="#codex-run-recovery-panel">Recovery/u);
      assert.match(desktopHtml, /href="#reviewer-handoff-preview-panel">Reviewer Handoff/u);
      assert.match(desktopHtml, /href="#thread-handoff-pack-panel">Thread Pack/u);
      assert.match(desktopHtml, /href="#review-gate-workbench-panel">Review Gate/u);
      assert.match(desktopHtml, /href="#release-closeout-handoff-panel">Release Handoff/u);
      assert.match(desktopHtml, /href="#release-publication-evidence-panel">Publication Evidence/u);
      assert.match(desktopHtml, /href="#stable-workbench-release-panel">Stable Baseline/u);

      assert.match(recoveryHtml, /Codex Run Recovery/u);
      assert.match(recoveryHtml, /codexProviderRunRecovery\.v1/u);
      assert.match(recoveryHtml, /ready-for-reviewer-handoff/u);
      assert.match(recoveryHtml, /Result Intake/u);
      assert.match(recoveryHtml, />pending result state<\/dt><dd[^>]*>available/u);
      assert.match(recoveryHtml, /Next Safe Action/u);
      assert.match(recoveryHtml, />copy only<\/dt><dd[^>]*>true/u);
      assert.match(recoveryHtml, />willMutate<\/dt><dd[^>]*>false/u);
      assert.match(recoveryHtml, />provider execution<\/dt><dd[^>]*>false/u);
      assert.match(recoveryHtml, />goal event write<\/dt><dd[^>]*>false/u);
      assert.match(recoveryHtml, />github publish automation<\/dt><dd[^>]*>false/u);

      assert.match(handoffHtml, /Reviewer Handoff Preview/u);
      assert.match(handoffHtml, /reviewerHandoffPreview\.v1/u);
      assert.match(handoffHtml, /Accepted Result Summary/u);
      assert.match(handoffHtml, /Handoff Pack/u);
      assert.match(handoffHtml, /result-evidence-escrow/u);
      assert.match(handoffHtml, />copy only<\/dt><dd[^>]*>true/u);
      assert.match(handoffHtml, />willMutate<\/dt><dd[^>]*>false/u);
      assert.match(handoffHtml, />automatic reviewer verdict<\/dt><dd[^>]*>false/u);
      assert.match(handoffHtml, />reviewer mutation<\/dt><dd[^>]*>false/u);
      assert.match(handoffHtml, />git mutation<\/dt><dd[^>]*>false/u);

      assert.match(threadPackHtml, /Thread Continuation Pack/u);
      assert.match(threadPackHtml, /threadHandoffPack\.v1/u);
      assert.match(threadPackHtml, /Continuation Decision/u);
      assert.match(threadPackHtml, />decision<\/dt><dd[^>]*>reviewer-handoff/u);
      assert.match(threadPackHtml, /Copy Blocks/u);
      assert.match(threadPackHtml, /Copy Reviewer Handoff Pack/u);
      assert.match(threadPackHtml, /contextCarryoverRefs\.v1/u);
      assert.match(threadPackHtml, /threadBoundaryNotice\.v1/u);
      assert.match(threadPackHtml, /Checkpoint Snapshot/u);
      assert.match(threadPackHtml, /checkpointSnapshot\.v1/u);
      assert.match(threadPackHtml, /Refresh State/u);
      assert.match(threadPackHtml, />copy only<\/dt><dd[^>]*>true/u);
      assert.match(threadPackHtml, />willMutate<\/dt><dd[^>]*>false/u);
      assert.match(threadPackHtml, />automatic compact<\/dt><dd[^>]*>false/u);
      assert.match(threadPackHtml, />automatic new thread<\/dt><dd[^>]*>false/u);
      assert.match(threadPackHtml, />provider launch<\/dt><dd[^>]*>false/u);
      assert.match(threadPackHtml, />goal event write<\/dt><dd[^>]*>false/u);
      assert.match(threadPackHtml, />git mutation<\/dt><dd[^>]*>false/u);
      assert.match(threadPackHtml, />tag automation<\/dt><dd[^>]*>false/u);
      assert.match(threadPackHtml, />publish automation<\/dt><dd[^>]*>false/u);
      assert.doesNotMatch(`${recoveryHtml}${handoffHtml}${threadPackHtml}`, /<button\b|<form\b|<textarea\b/u);
      assert.doesNotMatch(`${recoveryHtml}${handoffHtml}${threadPackHtml}`, /Compact Now|Create New Thread|Launch Codex|Launch Claude Code|Run Provider|Run Any Provider|Run Shell|Terminal|Read Session File|Open Transcript|Append Event|Mark Complete|Confirm Reviewer Verdict|Confirm Main Gate|Confirm Release Gate|event-plan-confirm|>Push<|>Tag<|>Publish<|>Release/u);

      assert.match(reviewGateHtml, /Review Gate Preview/u);
      assert.match(reviewGateHtml, /reviewGatePreview\.v1/u);
      assert.match(reviewGateHtml, /Reviewer Verdict/u);
      assert.match(reviewGateHtml, /Main Gate/u);
      assert.match(reviewGateHtml, /Release Gate/u);
      assert.match(reviewGateHtml, /reviewGateControlledConfirmationState\.v1/u);
      assert.match(reviewGateHtml, /operator-v57-controller/u);
      assert.match(reviewGateHtml, /controlled-event-registration/u);
      assert.match(reviewGateHtml, /event-plan-preview/u);
      assert.match(reviewGateHtml, /event-plan-confirm/u);
      assert.match(reviewGateHtml, />automatic reviewer verdict<\/dt><dd[^>]*>false/u);
      assert.match(reviewGateHtml, />provider self approval<\/dt><dd[^>]*>false/u);
      assert.match(reviewGateHtml, />provider launch<\/dt><dd[^>]*>false/u);
      assert.match(reviewGateHtml, />goal event write<\/dt><dd[^>]*>false/u);
      assert.match(reviewGateHtml, />task completion write<\/dt><dd[^>]*>false/u);
      assert.match(reviewGateHtml, />generic shell<\/dt><dd[^>]*>false/u);
      assert.match(reviewGateHtml, />main gate mutation<\/dt><dd[^>]*>false/u);
      assert.match(reviewGateHtml, />release gate mutation<\/dt><dd[^>]*>false/u);
      assert.match(reviewGateHtml, />git mutation<\/dt><dd[^>]*>false/u);
      assert.match(reviewGateHtml, />tag automation<\/dt><dd[^>]*>false/u);
      assert.match(reviewGateHtml, />publish automation<\/dt><dd[^>]*>false/u);
      assert.match(reviewGateHtml, />controlled event registration<\/dt><dd[^>]*>true/u);
      assert.doesNotMatch(reviewGateHtml, /<button\b|<form\b|<textarea\b|fetchGoalEventPlanPreview|confirmGoalEventPlan|window\.open|navigator\.clipboard/u);
      assert.doesNotMatch(reviewGateHtml, /Launch Codex|Launch Claude Code|Run Provider|Run Any Provider|Run Shell|Terminal|Read Session File|Open Transcript|Append Event|Mark Complete|git push|gh release|tag creation|publish release/u);

      assert.match(releaseHandoffHtml, /Release Closeout Handoff/u);
      assert.match(releaseHandoffHtml, /releaseCloseoutHandoffPack\.v1/u);
      assert.match(releaseHandoffHtml, /Release Evidence Refs/u);
      assert.match(releaseHandoffHtml, /Target Commit/u);
      assert.match(releaseHandoffHtml, /Tag and Release Checklist/u);
      assert.match(releaseHandoffHtml, /Known Blockers/u);
      assert.match(releaseHandoffHtml, /Rollback Path/u);
      assert.match(releaseHandoffHtml, /Next Version Context/u);
      assert.match(releaseHandoffHtml, /v58-rollback-path-2026-06-14\.md/u);
      assert.match(releaseHandoffHtml, /v59-runbook-2026-06-14\.md/u);
      assert.match(releaseHandoffHtml, />tag capability<\/dt><dd[^>]*>false/u);
      assert.match(releaseHandoffHtml, />remote tag capability<\/dt><dd[^>]*>false/u);
      assert.match(releaseHandoffHtml, />release page creation<\/dt><dd[^>]*>false/u);
      assert.match(releaseHandoffHtml, />provider launch<\/dt><dd[^>]*>false/u);
      assert.match(releaseHandoffHtml, />shell<\/dt><dd[^>]*>false/u);
      assert.match(releaseHandoffHtml, />goal event write<\/dt><dd[^>]*>false/u);
      assert.match(releaseHandoffHtml, />task completion write<\/dt><dd[^>]*>false/u);
      assert.match(releaseHandoffHtml, />automatic next version goal<\/dt><dd[^>]*>false/u);
      assert.doesNotMatch(releaseHandoffHtml, /<button\b|<form\b|<textarea\b|fetchGoalEventPlanPreview|confirmGoalEventPlan|window\.open|navigator\.clipboard/u);
      assert.doesNotMatch(releaseHandoffHtml, /Run Tag|Push Tag|Publish Release|Create GitHub Release|Declare Release Ready|Launch Provider|Run Shell|Terminal|Read Session File|Open Transcript|Append Event Directly|Mark Complete|Create Next Goal|event-plan-confirm|git push|gh release|tag creation|publish release/u);

      assert.match(publicationEvidenceHtml, /Release Publication Evidence/u);
      assert.match(publicationEvidenceHtml, /releasePublicationEvidence\.v1/u);
      assert.match(publicationEvidenceHtml, /Tag Evidence/u);
      assert.match(publicationEvidenceHtml, /GitHub Release Evidence/u);
      assert.match(publicationEvidenceHtml, /Target Commit Check/u);
      assert.match(publicationEvidenceHtml, /Publication Blockers/u);
      assert.match(publicationEvidenceHtml, /Rollback Refs/u);
      assert.match(publicationEvidenceHtml, /Next Version Start Audit/u);
      assert.match(publicationEvidenceHtml, /d4046a05f8a5f44e998d2763ea3c11db4487401e/u);
      assert.match(publicationEvidenceHtml, /7cedfbd8457f78f3f73fc91201a932d780119052/u);
      assert.match(publicationEvidenceHtml, /https:\/\/github\.com\/Andy20010101\/multi-coding-agent-symphony\/releases\/tag\/v58/u);
      assert.match(publicationEvidenceHtml, />draft<\/dt><dd[^>]*>false/u);
      assert.match(publicationEvidenceHtml, />prerelease<\/dt><dd[^>]*>false/u);
      assert.match(publicationEvidenceHtml, />assets<\/dt><dd[^>]*>0 assets/u);
      assert.match(publicationEvidenceHtml, />tag write available<\/dt><dd[^>]*>false/u);
      assert.match(publicationEvidenceHtml, />remote tag write available<\/dt><dd[^>]*>false/u);
      assert.match(publicationEvidenceHtml, />release create flag<\/dt><dd[^>]*>false/u);
      assert.match(publicationEvidenceHtml, />release update flag<\/dt><dd[^>]*>false/u);
      assert.match(publicationEvidenceHtml, />provider control<\/dt><dd[^>]*>false/u);
      assert.match(publicationEvidenceHtml, />local command control<\/dt><dd[^>]*>false/u);
      assert.match(publicationEvidenceHtml, />goal event write<\/dt><dd[^>]*>false/u);
      assert.match(publicationEvidenceHtml, />task completion write<\/dt><dd[^>]*>false/u);
      assert.match(publicationEvidenceHtml, />worktree automation<\/dt><dd[^>]*>false/u);
      assert.match(publicationEvidenceHtml, />next goal automation<\/dt><dd[^>]*>false/u);
      assert.match(publicationEvidenceHtml, />start allowed<\/dt><dd[^>]*>true/u);
      assert.doesNotMatch(publicationEvidenceHtml, /<button\b|<form\b|<textarea\b|fetchGoalEventPlanPreview|confirmGoalEventPlan|window\.open|navigator\.clipboard/u);
      assert.doesNotMatch(publicationEvidenceHtml, /Run Tag|Push Tag|Publish Release|Create GitHub Release|Edit GitHub Release|Declare Release Ready|Launch Provider|Run Shell|Terminal|Read Session File|Open Transcript|Append Event Directly|Mark Complete|Create Next Goal|event-plan-confirm|git push|gh release|tag creation|publish release/u);

      assert.match(stableHtml, /Stable Workbench Release/u);
      assert.match(stableHtml, /stableWorkbenchRelease\.v1/u);
      assert.match(stableHtml, /v60-stable-personal-workbench-release/u);
      assert.match(stableHtml, />active version<\/dt><dd[^>]*>v60/u);
      assert.match(stableHtml, />current tagged release<\/dt><dd[^>]*>v59/u);
      assert.match(stableHtml, /6e4ca4e2e7e459629e66b5c89b37abca78eddb19/u);
      assert.match(stableHtml, /Surface Matrix/u);
      assert.match(stableHtml, /Project Entry/u);
      assert.match(stableHtml, /Goal Supervision/u);
      assert.match(stableHtml, /Provider Execution/u);
      assert.match(stableHtml, /Review and Gates/u);
      assert.match(stableHtml, /Release Boundary/u);
      assert.match(stableHtml, /Provider Boundary/u);
      assert.match(stableHtml, />provider<\/dt><dd[^>]*>codex-cli/u);
      assert.match(stableHtml, />claim<\/dt><dd[^>]*>controlled-provider-execution-preview/u);
      assert.match(stableHtml, />status<\/dt><dd[^>]*>tested-preview/u);
      assert.match(stableHtml, />unsupported claims<\/dt><dd[^>]*>无/u);
      assert.match(stableHtml, />raw provider CLI evidence allowed<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, /Release Boundary/u);
      assert.match(stableHtml, />tag operation<\/dt><dd[^>]*>manual-controller-action/u);
      assert.match(stableHtml, />GitHub Release command result<\/dt><dd[^>]*>not-run-by-product-code/u);
      assert.match(stableHtml, />manual controller action required<\/dt><dd[^>]*>true/u);
      assert.match(stableHtml, />automation observed<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, /Safety/u);
      assert.match(stableHtml, />raw transcript observed<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />frontend JSONL read observed<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />renderer command execution observed<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />direct goal event append observed<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />automatic next-version goal observed<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, /Disabled Capabilities/u);
      assert.match(stableHtml, />provider launch<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />unsupported provider claims<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />renderer command execution<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />frontend JSONL read<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />raw transcript exposure<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />direct goal event append<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />tag write<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />release create flag<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />public distribution claim<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, />automatic worktree creation<\/dt><dd[^>]*>false/u);
      assert.match(stableHtml, /docs\/provider-boundary-guide\.md/u);
      assert.match(stableHtml, /tag push and GitHub Release publication remain controller manual actions/u);
      assert.doesNotMatch(stableHtml, /<button\b|<form\b|<textarea\b|fetchGoalEventPlanPreview|confirmGoalEventPlan|window\.open|navigator\.clipboard/u);
      assert.doesNotMatch(stableHtml, /Run Tag|Push Tag|Publish Release|Create GitHub Release|Edit GitHub Release|Declare Release Ready|Launch Provider|Run Shell|Terminal|Read Session File|Open Transcript|Append Event Directly|Mark Complete|Create Next Goal|event-plan-confirm|git push|gh release|tag creation|publish release/u);
    } finally {
      await server.close();
      restoreSsrLocation();
    }

    assert.match(app, /CodexRunRecoveryPanel/u);
    assert.match(app, /ReviewerHandoffPreviewPanel/u);
    assert.match(app, /ThreadHandoffPackPanel/u);
    assert.match(app, /ReviewGateWorkbenchPanel/u);
    assert.match(app, /ReleaseCloseoutHandoffPanel/u);
    assert.match(app, /ReleasePublicationEvidencePanel/u);
    assert.match(app, /StableWorkbenchReleasePanel/u);
    assert.match(css, /\.codex-run-recovery-panel/u);
    assert.match(css, /\.reviewer-handoff-preview-panel/u);
    assert.match(css, /\.thread-handoff-pack-panel/u);
    assert.match(css, /\.review-gate-workbench-panel/u);
    assert.match(css, /\.release-closeout-handoff-panel/u);
    assert.match(css, /\.release-publication-evidence-panel/u);
    assert.match(css, /\.stable-workbench-release-panel/u);
    assert.doesNotMatch(app.slice(app.indexOf('function CodexRunRecoveryPanel'), app.indexOf('function DesktopAppStateStrip')), /fetch\(|confirmGoalEventPlan|window\.open|navigator\.clipboard|<button\b|<form\b|<textarea\b/u);
  });

  it('renders the v48 Project Launcher as a read-only recent-projects preview', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const css = await readFile('frontend/workbench/src/styles/workbench.css', 'utf8');
    const recentRoute = READONLY_API_ROUTES.find((route) => route.id === 'recentProjects');
    const projectRoute = READONLY_API_ROUTES.find((route) => route.id === 'projectRegistry');
    const bindingRoute = READONLY_API_ROUTES.find((route) => route.id === 'currentProjectBinding');
    const availableFixture = JSON.parse(await readFile('fixtures/contracts/recent-projects.available.v1.json', 'utf8'));
    const stateFixtures = await Promise.all(
      ['empty', 'missing', 'stale', 'degraded', 'failed'].map(async (state) => [
        state,
        JSON.parse(await readFile(`fixtures/contracts/recent-projects.${state}.v1.json`, 'utf8'))
      ])
    );
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const viewState = createWorkbenchRenderViewState();

      viewState.model = projectWorkbenchContracts({
        projectRegistry: readonlyRouteResult(projectRoute, createProjectLauncherRegistryPayload()),
        recentProjects: readonlyRouteResult(recentRoute, availableFixture),
        currentProjectBinding: readonlyRouteResult(bindingRoute, createProjectLauncherBindingPayload())
      });
      viewState.model.routeContext = createWorkbenchRenderRouteContext();

      const desktopHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/desktop/', viewState);
      const launcherIndex = desktopHtml.indexOf('id="desktop-project-launcher"');
      const appHomeIndex = desktopHtml.indexOf('class="desktop-app-home-panel"');
      const launcherHtml = desktopHtml.slice(
        launcherIndex,
        desktopHtml.indexOf('class="desktop-app-home-panel"')
      );

      assert.notEqual(launcherIndex, -1);
      assert.equal(launcherIndex < appHomeIndex, true);
      assert.match(desktopHtml, /href="#desktop-project-launcher">Projects/u);
      assert.match(desktopHtml, /Project Launcher/u);
      assert.match(desktopHtml, /Recent Projects/u);
      assert.match(desktopHtml, /current binding/u);
      assert.match(desktopHtml, /current-project-binding\.v1/u);
      assert.match(desktopHtml, /selected project health/u);
      assert.match(desktopHtml, /\/api\/projects\/current-binding\/select/u);
      assert.match(desktopHtml, /recent-projects\.v1/u);
      assert.match(desktopHtml, /\/api\/projects\/recent/u);
      assert.match(desktopHtml, /project-registry\.v1/u);
      assert.match(desktopHtml, /known-projects-only/u);
      assert.match(desktopHtml, /Multi Coding Agent Symphony/u);
      assert.match(desktopHtml, /\/workspace\/multi-coding-agent-symphony/u);
      assert.match(desktopHtml, /git@github\.com:Andy20010101\/multi-coding-agent-symphony\.git/u);
      assert.match(desktopHtml, /v48-project-launcher-recent-projects/u);
      assert.match(desktopHtml, /run-v48-pr1/u);
      assert.match(desktopHtml, /current project/u);
      assert.match(desktopHtml, />selection only<\/dt><dd[^>]*>true/u);
      assert.match(desktopHtml, />accepts project id only<\/dt><dd[^>]*>true/u);
      assert.match(desktopHtml, />disk scan<\/dt><dd[^>]*>false/u);
      assert.match(desktopHtml, />arbitrary path read<\/dt><dd[^>]*>false/u);
      assert.match(desktopHtml, />path submission<\/dt><dd[^>]*>false/u);
      assert.match(desktopHtml, />command execution<\/dt><dd[^>]*>false/u);
      assert.match(desktopHtml, />provider launch<\/dt><dd[^>]*>false/u);
      assert.match(desktopHtml, />goal mutation<\/dt><dd[^>]*>false/u);
      assert.match(desktopHtml, />job execution<\/dt><dd[^>]*>false/u);
      assert.match(desktopHtml, />git write<\/dt><dd[^>]*>false/u);
      assert.match(desktopHtml, />release write<\/dt><dd[^>]*>false/u);
      assert.doesNotMatch(launcherHtml, /<button\b|<form\b|<input\b|<textarea\b|onClick=|fetch\(|window\.open|navigator\.clipboard/u);
      assert.doesNotMatch(launcherHtml, />Select<|>Open<|>Run<|>Launch<|>Execute<|>Approve<|>Dispatch<|>Push<|>Tag<|>Release</u);

      for (const [state, fixture] of stateFixtures) {
        const stateViewState = createWorkbenchRenderViewState();
        stateViewState.model = projectWorkbenchContracts({
          projectRegistry: readonlyRouteResult(projectRoute, createProjectLauncherRegistryPayload()),
          recentProjects: readonlyRouteResult(recentRoute, fixture),
          currentProjectBinding: readonlyRouteResult(bindingRoute, createProjectLauncherBindingPayload())
        });
        stateViewState.model.routeContext = createWorkbenchRenderRouteContext();

        const stateHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/desktop/', stateViewState);

        assert.match(stateHtml, new RegExp(`>${state}<`, 'u'));
        assert.match(stateHtml, /Recent Projects/u);
        assert.match(stateHtml, /known-projects-only/u);
      }

      const degradedHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/desktop/', {
        phase: 'ready',
        model: projectWorkbenchContracts({
          projectRegistry: readonlyRouteResult(projectRoute, createProjectLauncherRegistryPayload()),
          recentProjects: readonlyRouteResult(recentRoute, stateFixtures.find(([state]) => state === 'degraded')[1]),
          currentProjectBinding: readonlyRouteResult(bindingRoute, createProjectLauncherBindingPayload())
        })
      });
      assert.match(degradedHtml, /project health is attention/u);

      const failedHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/desktop/', {
        phase: 'ready',
        model: projectWorkbenchContracts({
          projectRegistry: readonlyRouteResult(projectRoute, createProjectLauncherRegistryPayload()),
          recentProjects: readonlyRouteResult(recentRoute, stateFixtures.find(([state]) => state === 'failed')[1]),
          currentProjectBinding: readonlyRouteResult(bindingRoute, createProjectLauncherBindingPayload())
        })
      });
      assert.match(failedHtml, /project registry contract is unavailable/u);
    } finally {
      await server.close();
      restoreSsrLocation();
    }

    assert.match(app, /DesktopProjectLauncherPanel/u);
    assert.match(app, /DesktopRecentProjectRow/u);
    assert.match(app, /projectLauncherEmptyCopy/u);
    assert.match(css, /\.desktop-project-launcher/u);
    assert.match(css, /\.desktop-recent-project-list/u);
    assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.desktop-project-launcher-header/u);
    assert.doesNotMatch(app.slice(app.indexOf('function DesktopProjectLauncherPanel'), app.indexOf('function DesktopAppHomePanel')), /fetch\(|confirmGoalEventPlan|window\.open|navigator\.clipboard|<form\b|<textarea\b/u);
  });

  it('renders the v64 First-run Project Setup panel without execution controls', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const css = await readFile('frontend/workbench/src/styles/workbench.css', 'utf8');
    const projectRoute = READONLY_API_ROUTES.find((route) => route.id === 'projectRegistry');
    const recentRoute = READONLY_API_ROUTES.find((route) => route.id === 'recentProjects');
    const bindingRoute = READONLY_API_ROUTES.find((route) => route.id === 'currentProjectBinding');
    const settingsRoute = READONLY_API_ROUTES.find((route) => route.id === 'personalWorkbenchSettings');
    const recentFixture = JSON.parse(await readFile('fixtures/contracts/recent-projects.available.v1.json', 'utf8'));
    const readySettings = JSON.parse(await readFile('fixtures/contracts/personal-workbench-settings/personal-workbench-settings.ready.v1.json', 'utf8'));
    const missingSettings = JSON.parse(await readFile('fixtures/contracts/personal-workbench-settings/personal-workbench-settings.missing-settings.v1.json', 'utf8'));
    const staleSettings = JSON.parse(await readFile('fixtures/contracts/personal-workbench-settings/personal-workbench-settings.stale-project-binding.v1.json', 'utf8'));
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const viewState = createWorkbenchRenderViewState();

      viewState.model = projectWorkbenchContracts({
        projectRegistry: readonlyRouteResult(projectRoute, createProjectLauncherRegistryPayload()),
        recentProjects: readonlyRouteResult(recentRoute, recentFixture),
        currentProjectBinding: readonlyRouteResult(bindingRoute, createProjectLauncherBindingPayload()),
        personalWorkbenchSettings: readonlyRouteResult(settingsRoute, readySettings)
      });
      viewState.model.routeContext = createWorkbenchRenderRouteContext();

      const desktopHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/desktop/', viewState);
      const setupIndex = desktopHtml.indexOf('id="desktop-first-run-project-setup"');
      const launcherIndex = desktopHtml.indexOf('id="desktop-project-launcher"');
      const appHomeIndex = desktopHtml.indexOf('class="desktop-app-home-panel"');
      const setupHtml = desktopHtml.slice(setupIndex, appHomeIndex);

      assert.notEqual(setupIndex, -1);
      assert.equal(launcherIndex < setupIndex, true);
      assert.equal(setupIndex < appHomeIndex, true);
      assert.match(desktopHtml, /href="#desktop-first-run-project-setup">First-run/u);
      assert.match(setupHtml, /First-run Project Setup/u);
      assert.match(setupHtml, /personalWorkbenchSettings\.v1/u);
      assert.match(setupHtml, /settings source/u);
      assert.match(setupHtml, /fixture:personal-workbench-settings/u);
      assert.match(setupHtml, /current project/u);
      assert.match(setupHtml, /recent projects/u);
      assert.match(setupHtml, /preferred providers/u);
      assert.match(setupHtml, /codex-cli、claude-code-cli/u);
      assert.match(setupHtml, /default port/u);
      assert.match(setupHtml, /managed-state-dir/u);
      assert.match(setupHtml, /next safe action/u);
      assert.match(setupHtml, /Confirm current project and local settings source/u);
      assert.match(setupHtml, />settings write<\/dt><dd[^>]*>false/u);
      assert.match(setupHtml, />secret storage<\/dt><dd[^>]*>false/u);
      assert.match(setupHtml, />arbitrary path input<\/dt><dd[^>]*>false/u);
      assert.match(setupHtml, />arbitrary path read<\/dt><dd[^>]*>false/u);
      assert.match(setupHtml, />renderer command execution<\/dt><dd[^>]*>false/u);
      assert.match(setupHtml, />provider launch<\/dt><dd[^>]*>false/u);
      assert.match(setupHtml, />goal creation<\/dt><dd[^>]*>false/u);
      assert.match(setupHtml, />worktree creation<\/dt><dd[^>]*>false/u);
      assert.match(setupHtml, />git write<\/dt><dd[^>]*>false/u);
      assert.match(setupHtml, />release write<\/dt><dd[^>]*>false/u);
      assert.match(setupHtml, />frontend JSONL read<\/dt><dd[^>]*>false/u);
      assert.match(setupHtml, />provider folder read<\/dt><dd[^>]*>false/u);
      assert.match(setupHtml, />mutates git or releases<\/dt><dd[^>]*>false/u);
      assert.doesNotMatch(setupHtml, /<button\b|<form\b|<input\b|<textarea\b|onClick=|fetch\(|window\.open|navigator\.clipboard/u);
      assert.doesNotMatch(setupHtml, />Select<|>Open<|>Run<|>Launch<|>Execute<|>Approve<|>Dispatch<|>Push<|>Tag<|>Release</u);

      for (const [fixture, expectedCopy] of [
        [missingSettings, 'Restore local settings from the managed app state'],
        [staleSettings, 'Refresh current project binding from backend-known projects']
      ]) {
        const stateViewState = createWorkbenchRenderViewState();
        stateViewState.model = projectWorkbenchContracts({
          projectRegistry: readonlyRouteResult(projectRoute, createProjectLauncherRegistryPayload()),
          recentProjects: readonlyRouteResult(recentRoute, recentFixture),
          currentProjectBinding: readonlyRouteResult(bindingRoute, createProjectLauncherBindingPayload()),
          personalWorkbenchSettings: readonlyRouteResult(settingsRoute, fixture)
        });
        stateViewState.model.routeContext = createWorkbenchRenderRouteContext();

        const stateHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/desktop/', stateViewState);

        assert.match(stateHtml, new RegExp(expectedCopy, 'u'));
        assert.match(stateHtml, /copy only<\/dt><dd[^>]*>true/u);
        assert.match(stateHtml, /willMutate<\/dt><dd[^>]*>false/u);
      }
    } finally {
      await server.close();
      restoreSsrLocation();
    }

    assert.match(app, /DesktopFirstRunProjectSetupPanel/u);
    assert.match(css, /\.desktop-first-run-setup/u);
    assert.match(css, /\.desktop-first-run-grid/u);
    assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.desktop-first-run-header/u);
    assert.doesNotMatch(app.slice(app.indexOf('function DesktopFirstRunProjectSetupPanel'), app.indexOf('function DesktopAppHomePanel')), /fetch\(|confirmGoalEventPlan|window\.open|navigator\.clipboard|<button\b|<form\b|<input\b|<textarea\b/u);
  });

  it('renders the v46 fixture Supervisor Workbench without execution controls', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const css = await readFile('frontend/workbench/src/styles/workbench.css', 'utf8');
    const fixtureSource = await readFile('frontend/workbench/src/fixtures/supervisorDashboardFixtures.js', 'utf8');
    const supervisorSource = await readFile('frontend/workbench/src/v46SupervisorWorkbench.jsx', 'utf8');
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const viewState = createWorkbenchRenderViewState();
      const defaultHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/supervisor/', viewState);
      const releaseHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/supervisor/?scenario=release-ready', viewState);
      const pendingHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/supervisor/?scenario=pending-result', viewState);
      const leaseHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/supervisor/?scenario=healthy-active-lease', viewState);
      const staleHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/supervisor/?scenario=stale-transcript', viewState);
      const blockedHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/supervisor/?scenario=blocked-gate', viewState);
      const missingHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/supervisor/?scenario=missing-empty-context', viewState);

      assert.doesNotMatch(defaultHtml, /Supervisor Command Center/u);
      assert.match(defaultHtml, /class="workbench-shell supervisor-shell-route"/u);
      assert.match(defaultHtml, /class="v46-supervisor-shell"/u);
      assert.match(defaultHtml, /Workbench Supervisor Dashboard/u);
      assert.doesNotMatch(defaultHtml, /supervisor read-only \/ fixture fallback/u);
      assert.match(defaultHtml, />contract<\/dt><dd[^>]*>supervisor-dashboard-state\.v46 \/ 1/u);
      assert.match(defaultHtml, /local-sample-fallback/u);
      assert.match(defaultHtml, />goal id<\/dt><dd[^>]*>v45-backend-entrypoint-decomposition/u);
      assert.match(defaultHtml, />generated<\/dt><dd[^>]*>2026-06-10T13:24:00\+08:00/u);
      assert.match(defaultHtml, />readOnly<\/dt><dd[^>]*>true/u);
      assert.match(defaultHtml, />willMutate<\/dt><dd[^>]*>false/u);
      assert.match(defaultHtml, /Draft v46 Workbench frontend runbook after OpenDesign exploration/u);
      assert.match(defaultHtml, /Recommended Next Action/u);
      assert.match(defaultHtml, /Session Source Inventory/u);
      assert.match(defaultHtml, /Context Advisory/u);
      assert.match(defaultHtml, /Thread Continuation Decision/u);
      assert.match(defaultHtml, /Command Boundary/u);
      assert.match(defaultHtml, /Result Intake/u);
      assert.match(defaultHtml, /Paste worker result block/u);
      assert.match(defaultHtml, /Preview Result Intake/u);
      assert.match(defaultHtml, /This does not run a provider\./u);
      assert.match(defaultHtml, /This does not dispatch a child\./u);
      assert.match(defaultHtml, /This does not append a goal event\./u);
      assert.match(defaultHtml, /This only creates pending result escrow after confirm\./u);
      assert.match(defaultHtml, /<button[^>]*disabled[^>]*>Preview Result Intake<\/button>/u);
      assert.match(defaultHtml, /Event Plan Preview/u);
      assert.match(defaultHtml, /Preview Event Plan/u);
      assert.match(defaultHtml, /Refresh Supervisor State/u);
      assert.match(defaultHtml, /eligibility contract not available/u);
      assert.match(defaultHtml, /Event registration eligibility/u);
      assert.match(defaultHtml, />eligibility<\/dt><dd[^>]*>unknown/u);
      assert.match(defaultHtml, />blocked \/ missing reason<\/dt><dd[^>]*>eligibility contract not available/u);
      assert.match(defaultHtml, />missing inputs<\/dt><dd[^>]*>supervisorEventRegistrationEligibility/u);
      assert.match(defaultHtml, />refresh phase<\/dt><dd[^>]*>idle/u);
      assert.match(defaultHtml, />refresh source<\/dt><dd[^>]*>NULL/u);
      assert.match(defaultHtml, />refresh result<\/dt><dd[^>]*>NULL/u);
      assert.match(defaultHtml, />refresh message<\/dt><dd[^>]*>NULL/u);
      assert.match(defaultHtml, /preview result not loaded/u);
      assert.match(defaultHtml, /copyOnly true/u);
      assert.match(defaultHtml, /daemon-control/u);
      assert.match(defaultHtml, /provider-cli/u);
      assert.match(defaultHtml, /real-cli/u);
      assert.match(defaultHtml, /release-closeout/u);
      assert.match(defaultHtml, /git-tag/u);

      const sidebarLabels = [...defaultHtml.matchAll(/class="v46-sidebar-label">([^<]+)<\/span>/gu)]
        .map((match) => match[1]);
      assert.deepEqual(sidebarLabels, [
        'Overview',
        'Active Lease',
        'Source Inventory',
        'Current Gate',
        'Context Advisory',
        'Continuation',
        'Command Boundary',
        'Result Intake',
        'Context Status',
        'Timeline',
        'Ownership'
      ]);

      const goalIndex = defaultHtml.indexOf('data-od-id="goal-snapshot"');
      const leaseIndex = defaultHtml.indexOf('data-od-id="active-lease"');
      const inventoryIndex = defaultHtml.indexOf('data-od-id="session-source-inventory"');
      const gateIndex = defaultHtml.indexOf('data-od-id="current-gate"');
      const actionIndex = defaultHtml.indexOf('data-od-id="recommended-next-action"');
      const contextIndex = defaultHtml.indexOf('data-od-id="context-status"');
      const advisoryIndex = defaultHtml.indexOf('data-od-id="context-advisory"');
      const continuationIndex = defaultHtml.indexOf('data-od-id="thread-continuation-decision"');
      const boundaryIndex = defaultHtml.indexOf('data-od-id="command-boundary"');
      const pendingIndex = defaultHtml.indexOf('data-od-id="pending-result"');
      const resultIntakeIndex = defaultHtml.indexOf('data-od-id="result-intake"');
      const eventPreviewIndex = defaultHtml.indexOf('data-od-id="supervisor-event-preview"');
      const timelineIndex = defaultHtml.indexOf('data-od-id="goal-timeline"');
      const ownershipIndex = defaultHtml.indexOf('data-od-id="ownership"');

      for (const index of [goalIndex, actionIndex, leaseIndex, inventoryIndex, contextIndex, advisoryIndex, continuationIndex, pendingIndex, resultIntakeIndex, eventPreviewIndex, boundaryIndex, timelineIndex, gateIndex, ownershipIndex]) {
        assert.notEqual(index, -1);
      }

      assert.equal(goalIndex < leaseIndex, true);
      assert.equal(leaseIndex < contextIndex, true);
      assert.equal(inventoryIndex < gateIndex, true);
      assert.equal(gateIndex < actionIndex, true);
      assert.equal(actionIndex < continuationIndex, true);
      assert.equal(continuationIndex < boundaryIndex, true);
      assert.equal(boundaryIndex < pendingIndex, true);
      assert.equal(pendingIndex < resultIntakeIndex, true);
      assert.equal(resultIntakeIndex < eventPreviewIndex, true);
      assert.equal(eventPreviewIndex < timelineIndex, true);
      assert.equal(timelineIndex < ownershipIndex, true);

      assert.doesNotMatch(defaultHtml, /Release readiness is present/u);
      assert.match(releaseHtml, /Release readiness is present/u);
      assert.match(releaseHtml, /tag/u);
      assert.match(releaseHtml, /publish/u);
      assert.match(releaseHtml, /close out/u);
      assert.doesNotMatch(defaultHtml, /href="(?:artifact:|docs\/plans\/|file:)/u);
      assert.match(leaseHtml, /lease-task-2-worker-001/u);
      assert.match(leaseHtml, /readable summary/u);
      assert.match(leaseHtml, /duplicate dispatch remains blocked/u);
      assert.match(pendingHtml, /worker\.evidence-recorded/u);
      assert.match(pendingHtml, /artifact:v44-4:task-1-worker-evidence/u);
      assert.match(pendingHtml, /parser accepted event fields/u);
      assert.doesNotMatch(pendingHtml, />Register<|>Apply<|>Execute</u);
      assert.match(staleHtml, /stale transcript summary/u);
      assert.match(staleHtml, /recover-drift/u);
      assert.match(staleHtml, /Lease update is older than the stale threshold/u);
      assert.match(staleHtml, /unreadable/u);
      assert.match(staleHtml, /new-thread/u);
      assert.match(blockedHtml, /missing main verification evidence ref/u);
      assert.match(blockedHtml, /main verification evidence/u);
      assert.match(blockedHtml, /confirm-required/u);
      assert.match(missingHtml, /contextStatus\.providerSummaries is empty/u);
      assert.match(missingHtml, /sessionSourceInventory\.v1/u);
      assert.match(missingHtml, /no-readable-session-transcript/u);
      assert.match(missingHtml, />pendingResult\.output<\/dt><dd[^>]*>NULL/u);
      assert.match(missingHtml, />contract<\/dt><dd[^>]*>missing/u);
    } finally {
      await server.close();
      restoreSsrLocation();
    }

    for (const componentName of [
      'SupervisorShell',
      'SupervisorSidebar',
      'StatusHeader',
      'GoalSnapshotPanel',
      'CurrentGatePanel',
      'RecommendedNextActionBand',
      'ActiveLeasePanel',
      'PendingResultPanel',
      'ResultIntakeLane',
      'ResultIntakePreviewResult',
      'ResultEscrowConfirmAction',
      'ResultEscrowConfirmResult',
      'SupervisorEventPreviewLane',
      'SupervisorEventEligibilityNotice',
      'SupervisorEventPreviewResult',
      'SupervisorEventConfirmAction',
      'SupervisorEventConfirmResult',
      'SupervisorRefreshStateControl',
      'SessionSourceInventoryPanel',
      'ContextAdvisoryPanel',
      'ThreadContinuationDecisionPanel',
      'GoalTimelinePanel',
      'ContextStatusPanel',
      'OwnershipPanel',
      'CommandBoundaryPanel'
    ]) {
      assert.match(supervisorSource, new RegExp(`function ${componentName}\\b`, 'u'));
    }

    assert.match(app, /selectedSupervisorDashboard/u);
    assert.match(app, /projectSupervisorDashboardToWorkbenchView/u);
    assert.match(app, /\/workbench\/supervisor\//u);
    assert.match(fixtureSource, /release-ready/u);
    assert.match(fixtureSource, /healthy-active-lease/u);
    assert.match(fixtureSource, /pending-result/u);
    assert.match(fixtureSource, /stale-transcript/u);
    assert.match(fixtureSource, /blocked-gate/u);
    assert.match(fixtureSource, /missing-empty-context/u);
    assert.match(fixtureSource, /sessionSourceInventory\.v1/u);
    assert.match(fixtureSource, /contextAdvisory\.v1/u);
    assert.match(fixtureSource, /threadContinuationDecision\.v1/u);
    assert.match(css, /\.v46-supervisor-shell/u);
    assert.match(css, /\.v46-supervisor-shell[\s\S]*grid-template-columns:\s*232px minmax\(0, 1fr\)/u);
    assert.match(css, /\.v46-dashboard-grid[\s\S]*grid-template-columns:\s*minmax\(0, 1\.05fr\) minmax\(360px, 0\.95fr\)/u);
    assert.match(css, /grid-template-areas:[\s\S]*"goal lease"[\s\S]*"inventory context"[\s\S]*"decision continuation"[\s\S]*"result-intake result-intake"[\s\S]*"event-preview event-preview"[\s\S]*"ownership timeline"/u);
    assert.match(css, /@media \(max-width: 980px\)[\s\S]*\.v46-dashboard-grid[\s\S]*display:\s*flex/u);
    assert.match(css, /\.v46-family-list[\s\S]*flex-wrap:\s*wrap/u);
    assert.match(css, /\.v46-pending-panel[\s\S]*order:\s*5/u);
    assert.match(css, /\.v51-result-intake-panel[\s\S]*order:\s*11/u);
    assert.match(css, /\.v50-event-preview-panel[\s\S]*order:\s*12/u);
    assert.match(css, /\.v50-event-controls/u);
    assert.match(css, /\.v51-result-controls/u);
    assert.match(css, /\.v50-preview-button/u);
    assert.match(css, /\.v51-preview-button/u);
    assert.match(css, /\.v51-confirm-button/u);
    assert.match(css, /\.v50-refresh-button/u);
    assert.match(css, /\.v50-eligibility-notice/u);
    assert.match(css, /\.v46-inventory-panel[\s\S]*order:\s*6/u);
    assert.match(css, /\.v46-context-panel[\s\S]*order:\s*7/u);
    assert.match(supervisorSource, /fetchGoalEventPlanPreview/u);
    assert.match(supervisorSource, /confirmGoalEventPlan/u);
    assert.match(supervisorSource, /Preview Event Plan/u);
    assert.match(supervisorSource, /Confirm Event Append/u);
    assert.match(supervisorSource, /Preview Result Intake/u);
    assert.match(supervisorSource, /Confirm Result Escrow/u);
    assert.match(supervisorSource, /Refresh Supervisor State/u);
    assert.match(supervisorSource, /refreshSupervisorState/u);
    assert.match(supervisorSource, /previewResultIntake/u);
    assert.match(supervisorSource, /confirmResultEscrow/u);
    assert.doesNotMatch(supervisorSource, /\bfetch\s*\(/u);
    assert.doesNotMatch(supervisorSource, /<GoalEventPlanPreview\b|function GoalEventPlanPreview\b|<form\b|navigator\.clipboard|child_process|exec\(|spawn\(|\.symphony|jsonl|sessions\/|provider folders|raw transcripts|claude\/projects/u);
    assert.doesNotMatch(supervisorSource, />\s*(Run|Execute|Continue|Compact|New Thread|Dispatch|Launch)\s*</u);
    assert.doesNotMatch(fixtureSource, /\.symphony|runner state|jsonl|sessions\/|claude\/projects/u);
  });

  it('renders the v46 Supervisor Workbench from the projected read-only API model when available', async () => {
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const viewState = {
        phase: 'ready',
        model: createWorkbenchRenderModelWithSupervisor()
      };
      const html = renderWorkbenchShellAt(WorkbenchShell, '/workbench/supervisor/', viewState);

      assert.match(html, /Workbench Supervisor Dashboard/u);
      assert.match(html, /class="v46-supervisor-shell"/u);
      assert.match(html, />contract<\/dt><dd[^>]*>supervisor-dashboard-state\.v46 \/ 1/u);
      assert.match(html, /goal-supervisor-app-read-model\.v1/u);
      assert.match(html, />goal id<\/dt><dd[^>]*>v44-4-live-supervisor/u);
      assert.match(html, />active task<\/dt><dd[^>]*>task-3/u);
      assert.match(html, />role<\/dt><dd[^>]*>worker/u);
      assert.match(html, />generated<\/dt><dd[^>]*>2026-06-10T12:04:00\.000Z/u);
      assert.match(html, /Command Boundary/u);
      assert.match(html, /copyOnly true/u);
      assert.match(html, /Checkpoint pending result/u);
      assert.match(html, /result-awaits-registration/u);
      assert.match(html, /result-evidence-escrow:v44-4-live-supervisor:task-3:escrow_live_task_3/u);
      assert.match(html, />state<\/dt><dd[^>]*>available/u);
      assert.match(html, /Result Intake/u);
      assert.match(html, /Paste worker result block/u);
      assert.match(html, />source kind<\/dt><dd[^>]*>manual-paste/u);
      assert.match(html, />preview route<\/dt><dd[^>]*>\/api\/goals\/v44-4-live-supervisor\/result-intake-preview/u);
      assert.match(html, />confirm route<\/dt><dd[^>]*>\/api\/goals\/v44-4-live-supervisor\/result-intake-confirm/u);
      assert.match(html, /Preview Result Intake/u);
      assert.match(html, /Session Source Inventory/u);
      assert.match(html, /Context Advisory/u);
      assert.match(html, /Thread Continuation Decision/u);
      assert.match(html, /sessionSourceInventory\.v1/u);
      assert.match(html, /contextAdvisory\.v1/u);
      assert.match(html, /threadContinuationDecision\.v1/u);
      assert.match(html, /claude:all-candidate-files-unreadable/u);
      assert.match(html, /pending-result-registration/u);
      assert.match(html, /local-goal-supervisor-daemon/u);
      assert.match(html, /external-orchestration-owner/u);
      assert.match(html, /Event Plan Preview/u);
      assert.match(html, /Preview Event Plan/u);
      assert.match(html, /Refresh Supervisor State/u);
      assert.match(html, />refresh phase<\/dt><dd[^>]*>idle/u);
      assert.match(html, /supervisorEventRegistrationEligibility\.v1 \/ 1/u);
      assert.match(html, /eligible-goal-update-event/u);
      assert.match(html, /\/api\/goals\/v44-4-live-supervisor\/event-plan-preview\?command=update&amp;task=task-3&amp;event=worker\.evidence-recorded&amp;actor=local-goal-supervisor-worker&amp;evidenceRef=artifact%3Av44-4%3Apending-result&amp;statement=Worker\+evidence\+recorded\+for\+task-3\./u);
      assert.match(html, />confirm method<\/dt><dd[^>]*>POST/u);
      assert.match(html, />confirm route<\/dt><dd[^>]*>\/api\/goals\/v44-4-live-supervisor\/event-plan-confirm/u);
      assert.match(html, />confirm content type<\/dt><dd[^>]*>application\/json/u);
      assert.match(html, /goal-update-plan\.v1 \/ 1/u);
      assert.match(html, />event type<\/dt><dd[^>]*>worker\.evidence-recorded/u);
      assert.match(html, />task id<\/dt><dd[^>]*>task-3/u);
      assert.match(html, />actor role<\/dt><dd[^>]*>worker/u);
      assert.match(html, />actor id<\/dt><dd[^>]*>local-goal-supervisor-worker/u);
      assert.match(html, />evidence refs<\/dt><dd[^>]*>artifact:v44-4:pending-result/u);
      assert.match(html, />statement<\/dt><dd[^>]*>Worker evidence recorded for task-3\./u);
      assert.match(html, />blocker id<\/dt><dd[^>]*>blocker-v50-preview/u);
      assert.match(html, />blocker reason<\/dt><dd[^>]*>preview-only blocker field/u);
      assert.match(html, />blocker severity<\/dt><dd[^>]*>medium/u);
      assert.match(html, />writesInDryRun<\/dt><dd[^>]*>false/u);
      assert.match(html, />append target<\/dt><dd[^>]*>managed-goal-event-journal/u);
      assert.match(html, />operation id<\/dt><dd[^>]*>op_v50_task3_event_preview/u);
      assert.match(html, />operation status<\/dt><dd[^>]*>planned/u);
      assert.match(html, />planHash<\/dt><dd[^>]*>sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/u);
      assert.match(html, />copy-only confirm command<\/dt><dd[^>]*>symphony goal update/u);
      assert.match(html, /Confirm Event Append/u);
      assert.doesNotMatch(html, /\[object Object\]/u);
      assert.match(html, /42000 \/ 200000/u);
      assert.match(html, /21%/u);
      assert.match(html, /daemon-control/u);
      assert.match(html, /provider-cli/u);
      assert.match(html, /real-cli/u);
      assert.match(html, /release-closeout/u);
      assert.match(html, /git-tag/u);
      assert.match(html, /class="v46-family-list"/u);
      assert.match(html, /evt-live-task-3/u);
      assert.doesNotMatch(html, /href="(?:artifact:|docs\/plans\/|file:)/u);
      assert.doesNotMatch(html, /Release-ready|Healthy active lease|Pending result|Stale transcript|Blocked gate|Missing context/u);
      assert.doesNotMatch(html, />Register<|>Apply<|>Execute</u);
      assert.doesNotMatch(html, /confirmGoalEventPlan|<form|\.symphony|jsonl|sessions\/|provider folders|raw transcripts/u);
    } finally {
      await server.close();
      restoreSsrLocation();
    }
  });

  it('keeps the supervisor event preview lane blocked when eligibility is not eligible', async () => {
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const {
        projectSupervisorDashboardToWorkbenchView,
        supervisorPreviewStateFromEventPreview,
        visibleSupervisorPreviewState
      } = await server.ssrLoadModule('/src/v46SupervisorWorkbench.jsx');
      const eligibleModel = createWorkbenchRenderModelWithSupervisor();
      const blockedPayload = {
        ...createGoalSupervisorRenderPayload(),
        supervisorEventRegistrationEligibility: {
          ...createSupervisorEventEligibilityRenderPayload(),
          state: 'blocked',
          reason: 'event-routed-to-goal-gate',
          missingInputs: ['gate-evidence'],
          previewResult: null
        }
      };
      const blockedModel = createWorkbenchRenderModelWithSupervisor(blockedPayload);
      const eligibleView = projectSupervisorDashboardToWorkbenchView(
        eligibleModel.supervisorDashboard,
        eligibleModel.supervisorDashboard.route
      );
      const blockedView = projectSupervisorDashboardToWorkbenchView(
        blockedModel.supervisorDashboard,
        blockedModel.supervisorDashboard.route
      );
      const eligiblePreviewState = supervisorPreviewStateFromEventPreview(eligibleView.eventPreview);
      const visibleAfterBlockedRerender = visibleSupervisorPreviewState({
        eventPreview: blockedView.eventPreview,
        previewState: eligiblePreviewState
      });
      const viewState = {
        phase: 'ready',
        model: blockedModel
      };
      const html = renderWorkbenchShellAt(WorkbenchShell, '/workbench/supervisor/', viewState);

      assert.equal(eligiblePreviewState.result.planHash, 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      assert.equal(visibleAfterBlockedRerender.phase, 'idle');
      assert.equal(visibleAfterBlockedRerender.result, null);
      assert.match(html, /Event Plan Preview/u);
      assert.match(html, />state<\/dt><dd[^>]*>blocked/u);
      assert.match(html, /event-routed-to-goal-gate/u);
      assert.match(html, />preview path<\/dt><dd[^>]*>NULL/u);
      assert.match(html, /gate-evidence/u);
      assert.match(html, /<button[^>]*disabled[^>]*>Preview Event Plan<\/button>/u);
      assert.match(html, /preview result not loaded/u);
      assert.doesNotMatch(html, /goal-update-plan\.v1/u);
      assert.doesNotMatch(html, /sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/u);
      assert.doesNotMatch(html, /copy-only confirm command/u);
      assert.doesNotMatch(html, /Confirm Event Append|confirmGoalEventPlan/u);

      for (const scenario of [
        {
          state: 'not-applicable',
          reason: 'event-routed-to-goal-review',
          missingInput: 'review-verdict-contract'
        },
        {
          state: 'unknown',
          reason: 'eligibility contract not available',
          missingInput: 'supervisorEventRegistrationEligibility'
        }
      ]) {
        const scenarioPayload = {
          ...createGoalSupervisorRenderPayload(),
          supervisorEventRegistrationEligibility: {
            ...createSupervisorEventEligibilityRenderPayload(),
            state: scenario.state,
            reason: scenario.reason,
            missingInputs: [scenario.missingInput],
            previewResult: null
          }
        };
        const scenarioHtml = renderWorkbenchShellAt(WorkbenchShell, '/workbench/supervisor/', {
          phase: 'ready',
          model: createWorkbenchRenderModelWithSupervisor(scenarioPayload)
        });

        assert.match(scenarioHtml, /Event registration eligibility/u, scenario.state);
        assert.match(scenarioHtml, new RegExp(`>eligibility<\\/dt><dd[^>]*>${scenario.state}`, 'u'), scenario.state);
        assert.match(scenarioHtml, new RegExp(scenario.reason, 'u'), scenario.state);
        assert.match(scenarioHtml, new RegExp(scenario.missingInput, 'u'), scenario.state);
        assert.match(scenarioHtml, /<button[^>]*disabled[^>]*>Preview Event Plan<\/button>/u, scenario.state);
        assert.doesNotMatch(scenarioHtml, /goal-update-plan\.v1|Confirm Event Append|confirmGoalEventPlan/u, scenario.state);
      }
    } finally {
      await server.close();
      restoreSsrLocation();
    }
  });

  it('renders supervisor refresh status and calls only the Workbench contract refresh callback', async () => {
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const {
        SupervisorRefreshStateControl,
        refreshSupervisorState
      } = await server.ssrLoadModule('/src/v46SupervisorWorkbench.jsx');
      const calls = [];
      const succeededState = await refreshSupervisorState({
        onRefreshSupervisorState: async () => {
          calls.push('fetchWorkbenchContracts');

          return {
            ok: true,
            source: 'fetchWorkbenchContracts',
            supervisorDashboardState: 'available',
            supervisorRouteState: 'ready'
          };
        }
      });
      const failedState = await refreshSupervisorState({
        onRefreshSupervisorState: async () => ({
          ok: false,
          source: 'fetchWorkbenchContracts',
          supervisorDashboardState: null,
          supervisorRouteState: null,
          message: 'fetchWorkbenchContracts failed'
        })
      });
      const thrownState = await refreshSupervisorState({
        onRefreshSupervisorState: async () => {
          throw new Error('network unavailable');
        }
      });
      const loadingHtml = renderToStaticMarkup(React.createElement(SupervisorRefreshStateControl, {
        refreshState: {
          phase: 'loading',
          source: 'fetchWorkbenchContracts',
          result: 'pending',
          message: 'contract refresh pending'
        },
        refreshLoading: true,
        onRefreshSupervisorState: () => undefined
      }));
      const succeededHtml = renderToStaticMarkup(React.createElement(SupervisorRefreshStateControl, {
        refreshState: succeededState,
        refreshLoading: false,
        onRefreshSupervisorState: () => undefined
      }));
      const failedHtml = renderToStaticMarkup(React.createElement(SupervisorRefreshStateControl, {
        refreshState: failedState,
        refreshLoading: false,
        onRefreshSupervisorState: () => undefined
      }));

      assert.deepEqual(calls, ['fetchWorkbenchContracts']);
      assert.deepEqual(succeededState, {
        phase: 'succeeded',
        source: 'fetchWorkbenchContracts',
        result: 'supervisorDashboard available; route ready',
        message: 'contract refresh completed'
      });
      assert.deepEqual(failedState, {
        phase: 'failed',
        source: 'fetchWorkbenchContracts',
        result: 'NULL',
        message: 'fetchWorkbenchContracts failed'
      });
      assert.deepEqual(thrownState, {
        phase: 'failed',
        source: 'fetchWorkbenchContracts',
        result: 'NULL',
        message: 'network unavailable'
      });
      assert.match(loadingHtml, /Refresh Supervisor State/u);
      assert.match(loadingHtml, /<button[^>]*disabled[^>]*>Refresh Supervisor State<\/button>/u);
      assert.match(loadingHtml, />refresh phase<\/dt><dd[^>]*>loading/u);
      assert.match(loadingHtml, />refresh source<\/dt><dd[^>]*>fetchWorkbenchContracts/u);
      assert.match(loadingHtml, />refresh result<\/dt><dd[^>]*>pending/u);
      assert.match(succeededHtml, />refresh phase<\/dt><dd[^>]*>succeeded/u);
      assert.match(succeededHtml, />refresh result<\/dt><dd[^>]*>supervisorDashboard available; route ready/u);
      assert.match(failedHtml, />refresh phase<\/dt><dd[^>]*>failed/u);
      assert.match(failedHtml, />refresh message<\/dt><dd[^>]*>fetchWorkbenchContracts failed/u);
      assert.doesNotMatch(`${loadingHtml}\n${succeededHtml}\n${failedHtml}`, /Preview Event Plan|Confirm Event Append|<form|<textarea|href="(?:artifact:|docs\/plans\/|file:)/u);
    } finally {
      await server.close();
    }
  });

  it('renders v52 System Golden Path refresh status and calls only the Workbench contract refresh callback', async () => {
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const {
        SystemGoldenPathRefreshControl,
        refreshSystemGoldenPathState
      } = await server.ssrLoadModule('/src/App.jsx');
      const calls = [];
      const succeededState = await refreshSystemGoldenPathState({
        onRefreshWorkbenchContracts: async () => {
          calls.push('fetchWorkbenchContracts');

          return {
            ok: true,
            source: 'fetchWorkbenchContracts',
            systemGoldenPathState: 'blocked',
            systemGoldenPathContractName: 'systemGoldenPath.v1'
          };
        }
      });
      const failedState = await refreshSystemGoldenPathState({
        onRefreshWorkbenchContracts: async () => ({
          ok: false,
          source: 'fetchWorkbenchContracts',
          systemGoldenPathState: null,
          systemGoldenPathContractName: null,
          message: 'fetchWorkbenchContracts failed'
        })
      });
      const thrownState = await refreshSystemGoldenPathState({
        onRefreshWorkbenchContracts: async () => {
          throw new Error('network unavailable');
        }
      });
      const loadingHtml = renderToStaticMarkup(React.createElement(SystemGoldenPathRefreshControl, {
        refreshState: {
          phase: 'loading',
          source: 'fetchWorkbenchContracts',
          result: 'pending',
          message: 'contract refresh pending'
        },
        refreshLoading: true,
        onRefreshState: () => undefined
      }));
      const succeededHtml = renderToStaticMarkup(React.createElement(SystemGoldenPathRefreshControl, {
        refreshState: succeededState,
        refreshLoading: false,
        onRefreshState: () => undefined
      }));
      const failedHtml = renderToStaticMarkup(React.createElement(SystemGoldenPathRefreshControl, {
        refreshState: failedState,
        refreshLoading: false,
        onRefreshState: () => undefined
      }));

      assert.deepEqual(calls, ['fetchWorkbenchContracts']);
      assert.deepEqual(succeededState, {
        phase: 'succeeded',
        source: 'fetchWorkbenchContracts',
        result: 'systemGoldenPath blocked; contract systemGoldenPath.v1',
        message: 'contract refresh completed'
      });
      assert.deepEqual(failedState, {
        phase: 'failed',
        source: 'fetchWorkbenchContracts',
        result: 'NULL',
        message: 'fetchWorkbenchContracts failed'
      });
      assert.deepEqual(thrownState, {
        phase: 'failed',
        source: 'fetchWorkbenchContracts',
        result: 'NULL',
        message: 'network unavailable'
      });
      assert.match(loadingHtml, /Refresh State/u);
      assert.match(loadingHtml, /<button[^>]*disabled[^>]*>Refresh State<\/button>/u);
      assert.match(loadingHtml, />refresh phase<\/dt><dd[^>]*>loading/u);
      assert.match(loadingHtml, />refresh source<\/dt><dd[^>]*>fetchWorkbenchContracts/u);
      assert.match(succeededHtml, />refresh result<\/dt><dd[^>]*>systemGoldenPath blocked; contract systemGoldenPath\.v1/u);
      assert.match(failedHtml, />refresh phase<\/dt><dd[^>]*>failed/u);
      assert.match(failedHtml, />refresh message<\/dt><dd[^>]*>fetchWorkbenchContracts failed/u);
      assert.doesNotMatch(`${loadingHtml}\n${succeededHtml}\n${failedHtml}`, /Preview Event Plan|Confirm Event Append|Confirm Result Escrow|<form|<textarea|Run Agent|Execute|Launch Provider|Dispatch Child|Compact Now|New Thread|Push|Tag|Publish|Release/u);
    } finally {
      await server.close();
    }
  });

  it('previews and confirms result intake through escrow without appending goal events', async () => {
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const {
        ResultIntakeLane,
        buildResultIntakeRequestBody,
        canConfirmResultEscrow,
        confirmResultEscrowFromPreview,
        projectSupervisorDashboardToWorkbenchView,
        resultEscrowConfirmStateFromPreview,
        resultIntakePreviewResultView,
        resultIntakePreviewStateFromDescriptor
      } = await server.ssrLoadModule('/src/v46SupervisorWorkbench.jsx');
      const model = createWorkbenchRenderModelWithSupervisor();
      const view = projectSupervisorDashboardToWorkbenchView(
        model.supervisorDashboard,
        model.supervisorDashboard.route
      );
      const resultBlockText = JSON.stringify({
        status: 'completed',
        summary: 'Added controlled Workbench result intake.',
        changedFiles: ['frontend/workbench/src/v46SupervisorWorkbench.jsx'],
        validationCommands: ['pnpm workbench:build'],
        evidenceRefs: ['docs/plans/v51-workbench-result-intake-evidence-2026-06-12.md']
      });
      const request = buildResultIntakeRequestBody({
        resultIntake: view.resultIntake,
        resultBlockText,
        submittedAt: '2026-06-12T09:00:00.000Z'
      });
      const previewPayload = createResultIntakePreviewRenderPayload(request.requestBody);
      const previewState = {
        ...resultIntakePreviewStateFromDescriptor(view.resultIntake),
        phase: 'ready',
        request: request.requestBody,
        preview: previewPayload,
        result: resultIntakePreviewResultView(previewPayload),
        message: null
      };
      const calls = [];
      const confirmState = await confirmResultEscrowFromPreview({
        resultIntake: view.resultIntake,
        previewState,
        confirmResultEscrowImpl: async (path, body) => {
          calls.push([path, body]);

          return {
            ok: true,
            data: createResultIntakeConfirmationRenderPayload(previewPayload)
          };
        }
      });
      const html = renderToStaticMarkup(React.createElement(ResultIntakeLane, {
        resultIntake: view.resultIntake,
        resultBlockText,
        previewState,
        previewLoading: false,
        confirmState,
        confirmLoading: false,
        refreshState: {
          phase: 'succeeded',
          source: 'fetchWorkbenchContracts',
          result: 'supervisorDashboard available; route ready',
          message: 'contract refresh completed'
        },
        refreshLoading: false,
        onResultBlockInput: () => undefined,
        onPreviewResultIntake: () => undefined,
        onConfirmResultEscrow: () => undefined,
        onRefreshSupervisorState: () => undefined
      }));
      const idleConfirmState = resultEscrowConfirmStateFromPreview(view.resultIntake, null);

      assert.equal(request.ok, true);
      assert.equal(request.requestBody.contractName, 'resultIntakeRequest.v1');
      assert.equal(request.requestBody.goalId, 'v44-4-live-supervisor');
      assert.equal(request.requestBody.taskId, 'task-3');
      assert.equal(request.requestBody.source, 'manual-paste');
      assert.equal(request.requestBody.boundaries.directGoalEventAppendAvailable, false);
      assert.deepEqual(Object.keys(request.requestBody), [
        'contractName',
        'contractVersion',
        'goalId',
        'taskId',
        'workerRole',
        'source',
        'submittedAt',
        'resultBlock',
        'evidenceRefs',
        'requestedEvent',
        'boundaries'
      ]);
      assert.equal(canConfirmResultEscrow({
        resultIntake: view.resultIntake,
        previewState
      }), true);
      assert.deepEqual(calls, [[
        '/api/goals/v44-4-live-supervisor/result-intake-confirm',
        {
          resultIntakeRequest: request.requestBody,
          resultIntakePreview: previewPayload,
          planHash: previewPayload.planHash
        }
      ]]);
      assert.equal(confirmState.phase, 'ready');
      assert.equal(idleConfirmState.phase, 'idle');
      assert.match(html, /Preview Result Intake/u);
      assert.match(html, /Confirm Result Escrow/u);
      assert.match(html, /Refresh Supervisor State/u);
      assert.match(html, /resultIntakePreview\.v1 \/ 1/u);
      assert.match(html, />writesOnPreview<\/dt><dd[^>]*>false/u);
      assert.match(html, />writesGoalEventLog<\/dt><dd[^>]*>false/u);
      assert.match(html, />willAppendGoalEvent<\/dt><dd[^>]*>false/u);
      assert.match(html, />escrowRef<\/dt><dd[^>]*>result-evidence-escrow:v44-4-live-supervisor:task-3:escrow_live_task_3/u);
      assert.match(html, />pendingResultRef<\/dt><dd[^>]*>pending-result:v44-4-live-supervisor:task-3/u);
      assert.match(html, />refresh result<\/dt><dd[^>]*>supervisorDashboard available; route ready/u);
      assert.doesNotMatch(html, /goal-event-confirmation|Confirm Event Append|event-plan-confirm|raw model output|provider session secret/u);
      assert.doesNotMatch(JSON.stringify(calls), /"actor"|goal-event-log|event-plan-confirm/u);
    } finally {
      await server.close();
    }
  });

  it('confirms supervisor event append with the visible preview planHash and refresh callback', async () => {
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const {
        SupervisorEventPreviewLane,
        buildSupervisorEventConfirmBody,
        confirmSupervisorEventAppend,
        projectSupervisorDashboardToWorkbenchView,
        supervisorCanConfirmEventAppend,
        supervisorPreviewStateFromEventPreview
      } = await server.ssrLoadModule('/src/v46SupervisorWorkbench.jsx');
      const model = createWorkbenchRenderModelWithSupervisor();
      const view = projectSupervisorDashboardToWorkbenchView(
        model.supervisorDashboard,
        model.supervisorDashboard.route
      );
      const previewState = supervisorPreviewStateFromEventPreview(view.eventPreview);
      const constrainedBody = buildSupervisorEventConfirmBody({
        eventPreview: view.eventPreview,
        previewResult: previewState.result
      });
      const calls = [];
      const refreshes = [];
      const confirmState = await confirmSupervisorEventAppend({
        eventPreview: view.eventPreview,
        previewState,
        confirmGoalEventPlanImpl: async (path, body) => {
          calls.push([path, body]);

          return {
            ok: true,
            data: createSupervisorGoalEventConfirmationPayload()
          };
        },
        onEventConfirmed: async (data) => {
          refreshes.push(data.contractName);
        }
      });
      const html = renderToStaticMarkup(React.createElement(SupervisorEventPreviewLane, {
        eventPreview: view.eventPreview,
        previewState,
        previewLoading: false,
        confirmState,
        confirmLoading: false,
        onPreviewEventPlan: () => undefined,
        onConfirmEventAppend: () => undefined
      }));
      const mismatchConfirmState = await confirmSupervisorEventAppend({
        eventPreview: view.eventPreview,
        previewState,
        confirmGoalEventPlanImpl: async () => ({
          ok: false,
          message: 'hash mismatch'
        })
      });
      const mismatchHtml = renderToStaticMarkup(React.createElement(SupervisorEventPreviewLane, {
        eventPreview: view.eventPreview,
        previewState,
        previewLoading: false,
        confirmState: mismatchConfirmState,
        confirmLoading: false,
        onPreviewEventPlan: () => undefined,
        onConfirmEventAppend: () => undefined
      }));

      assert.equal(supervisorCanConfirmEventAppend({
        eventPreview: view.eventPreview,
        previewResult: previewState.result
      }), true);
      assert.deepEqual(Object.keys(constrainedBody), [
        'command',
        'task',
        'event',
        'actor',
        'planHash',
        'evidenceRef',
        'statement',
        'blockerId',
        'blockerReason',
        'blockerSeverity'
      ]);
      assert.deepEqual(constrainedBody, {
        command: 'update',
        task: 'task-3',
        event: 'worker.evidence-recorded',
        actor: 'local-goal-supervisor-worker',
        planHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        evidenceRef: ['artifact:v44-4:pending-result'],
        statement: 'Worker evidence recorded for task-3.',
        blockerId: 'blocker-v50-preview',
        blockerReason: 'preview-only blocker field',
        blockerSeverity: 'medium'
      });
      assert.deepEqual(calls, [[
        '/api/goals/v44-4-live-supervisor/event-plan-confirm',
        constrainedBody
      ]]);
      assert.deepEqual(refreshes, ['goal-event-confirmation.v1']);
      assert.equal(confirmState.phase, 'ready');
      assert.match(html, /Confirm Event Append/u);
      assert.match(html, />confirmation contract<\/dt><dd[^>]*>goal-event-confirmation\.v1 \/ 1/u);
      assert.match(html, />status<\/dt><dd[^>]*>appended/u);
      assert.match(html, />written<\/dt><dd[^>]*>true/u);
      assert.match(html, />event id<\/dt><dd[^>]*>evt-v50-task-3-confirmed/u);
      assert.match(html, />sequence<\/dt><dd[^>]*>7/u);
      assert.match(html, />event hash<\/dt><dd[^>]*>sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/u);
      assert.match(html, />operation id<\/dt><dd[^>]*>op_v50_task3_event_confirm/u);
      assert.match(html, />operation status<\/dt><dd[^>]*>confirmed/u);
      assert.match(html, />refreshed\.progress<\/dt><dd[^>]*>goal-progress-ledger\.v1/u);
      assert.match(html, />refreshed\.events<\/dt><dd[^>]*>goal-event-log\.v1/u);
      assert.match(html, />refreshed\.nextAction<\/dt><dd[^>]*>goal-next-action\.v1/u);
      assert.match(html, />refreshed\.closeout<\/dt><dd[^>]*>goal-closeout-report\.v1/u);
      assert.doesNotMatch(html, /\[object Object\]/u);
      assert.doesNotMatch(JSON.stringify(constrainedBody), /copyOnlyCommand|extra|branch|commit|raw|commandText/u);
      assert.equal(mismatchConfirmState.phase, 'failed');
      assert.match(mismatchHtml, /hash mismatch/u);
      assert.match(mismatchHtml, />planHash<\/dt><dd[^>]*>sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/u);
      assert.doesNotMatch(mismatchHtml, /evt-v50-task-3-confirmed/u);
    } finally {
      await server.close();
    }
  });

  it('does not confirm supervisor event append without a current eligible preview planHash', async () => {
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const {
        SupervisorEventPreviewLane,
        buildSupervisorEventConfirmBody,
        confirmSupervisorEventAppend,
        projectSupervisorDashboardToWorkbenchView,
        supervisorCanConfirmEventAppend,
        supervisorPreviewStateFromEventPreview,
        visibleSupervisorPreviewState
      } = await server.ssrLoadModule('/src/v46SupervisorWorkbench.jsx');
      const eligibleModel = createWorkbenchRenderModelWithSupervisor();
      const eligibleView = projectSupervisorDashboardToWorkbenchView(
        eligibleModel.supervisorDashboard,
        eligibleModel.supervisorDashboard.route
      );
      const readyPreviewState = supervisorPreviewStateFromEventPreview(eligibleView.eventPreview);
      const noHashPreviewState = {
        ...readyPreviewState,
        result: {
          ...readyPreviewState.result,
          planHash: 'NULL'
        }
      };
      const failedPreviewState = {
        ...readyPreviewState,
        phase: 'failed',
        result: null,
        message: 'hash mismatch'
      };
      const blockedPayload = {
        ...createGoalSupervisorRenderPayload(),
        supervisorEventRegistrationEligibility: {
          ...createSupervisorEventEligibilityRenderPayload(),
          state: 'blocked',
          reason: 'event-routed-to-goal-gate',
          previewResult: null
        }
      };
      const blockedModel = createWorkbenchRenderModelWithSupervisor(blockedPayload);
      const blockedView = projectSupervisorDashboardToWorkbenchView(
        blockedModel.supervisorDashboard,
        blockedModel.supervisorDashboard.route
      );
      const staleVisiblePreview = visibleSupervisorPreviewState({
        eventPreview: blockedView.eventPreview,
        previewState: readyPreviewState
      });
      const calls = [];
      const noHashConfirm = await confirmSupervisorEventAppend({
        eventPreview: eligibleView.eventPreview,
        previewState: noHashPreviewState,
        confirmGoalEventPlanImpl: async (path, body) => {
          calls.push([path, body]);
          return { ok: true, data: createSupervisorGoalEventConfirmationPayload() };
        }
      });
      const failedConfirm = await confirmSupervisorEventAppend({
        eventPreview: eligibleView.eventPreview,
        previewState: failedPreviewState,
        confirmGoalEventPlanImpl: async (path, body) => {
          calls.push([path, body]);
          return { ok: true, data: createSupervisorGoalEventConfirmationPayload() };
        }
      });
      const staleConfirm = await confirmSupervisorEventAppend({
        eventPreview: blockedView.eventPreview,
        previewState: readyPreviewState,
        confirmGoalEventPlanImpl: async (path, body) => {
          calls.push([path, body]);
          return { ok: true, data: createSupervisorGoalEventConfirmationPayload() };
        }
      });
      const html = renderToStaticMarkup(React.createElement(SupervisorEventPreviewLane, {
        eventPreview: blockedView.eventPreview,
        previewState: staleVisiblePreview,
        previewLoading: false,
        confirmState: {
          identity: 'stale',
          phase: 'idle',
          result: null,
          message: null
        },
        confirmLoading: false,
        onPreviewEventPlan: () => undefined,
        onConfirmEventAppend: () => undefined
      }));

      assert.equal(supervisorCanConfirmEventAppend({
        eventPreview: eligibleView.eventPreview,
        previewResult: noHashPreviewState.result
      }), false);
      assert.equal(buildSupervisorEventConfirmBody({
        eventPreview: eligibleView.eventPreview,
        previewResult: noHashPreviewState.result
      }), null);
      assert.equal(staleVisiblePreview.phase, 'idle');
      assert.equal(staleVisiblePreview.result, null);
      assert.equal(noHashConfirm.phase, 'failed');
      assert.equal(failedConfirm.phase, 'failed');
      assert.equal(staleConfirm.phase, 'failed');
      assert.deepEqual(calls, []);
      assert.doesNotMatch(html, /Confirm Event Append/u);
      assert.match(html, /preview result not loaded/u);
    } finally {
      await server.close();
    }
  });

  it('quarantines unsafe v46 supervisor live payloads before rendering', async () => {
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const unsafePayload = {
        ...createGoalSupervisorRenderPayload(),
        readOnly: false,
        willMutate: true,
        commandBoundary: {
          state: 'confirm-required',
          executionAvailable: true,
          copyOnly: false,
          blockedCommandFamilies: []
        }
      };
      const viewState = {
        phase: 'ready',
        model: createWorkbenchRenderModelWithSupervisor(unsafePayload)
      };
      const html = renderWorkbenchShellAt(WorkbenchShell, '/workbench/supervisor/', viewState);

      assert.match(html, /invalid live safety contract/u);
      assert.match(html, /safety contract failed/u);
      assert.match(html, />readOnly<\/dt><dd[^>]*>true/u);
      assert.match(html, />willMutate<\/dt><dd[^>]*>false/u);
      assert.match(html, />executionAvailable<\/dt><dd[^>]*>false/u);
      assert.match(html, />copyOnly<\/dt><dd[^>]*>true/u);
      assert.match(html, /readOnly\/willMutate rejected/u);
      assert.match(html, /daemon-control/u);
      assert.match(html, /provider-cli/u);
      assert.match(html, /real-cli/u);
      assert.match(html, /release-closeout/u);
      assert.match(html, /git-tag/u);
      assert.doesNotMatch(html, />willMutate<\/dt><dd[^>]*>true/u);
      assert.doesNotMatch(html, />executionAvailable<\/dt><dd[^>]*>true/u);
    } finally {
      await server.close();
      restoreSsrLocation();
    }
  });

  it('binds the v46 supervisor core panels from projected live model states', async () => {
    const server = await createViteServer({
      configFile: join(process.cwd(), 'frontend', 'workbench', 'vite.config.js'),
      server: {
        middlewareMode: true
      },
      appType: 'custom',
      logLevel: 'error'
    });

    try {
      const { WorkbenchShell } = await server.ssrLoadModule('/src/App.jsx');
      const scenarios = [
        {
          id: 'release-ready',
          payload: createGoalSupervisorRenderPayloadVariant('release-ready'),
          expected: [
            /copy-release-handoff/u,
            /release-ready-declared/u,
            /release evidence refs present/u,
            /Prepare release handoff/u
          ]
        },
        {
          id: 'active-lease',
          payload: createGoalSupervisorRenderPayloadVariant('active-lease'),
          expected: [
            /lease-live-task-2/u,
            /active-tool-call-in-progress/u,
            />lease health<\/dt><dd[^>]*>healthy/u
          ]
        },
        {
          id: 'pending-result',
          payload: createGoalSupervisorRenderPayloadVariant('pending-result'),
          expected: [
            /worker\.evidence-recorded/u,
            /valid-result-awaits-registration/u,
            /artifact:v44-4:pending-result/u
          ]
        },
        {
          id: 'stale-transcript',
          payload: createGoalSupervisorRenderPayloadVariant('stale-transcript'),
          expected: [
            /lease-active-transcript-stale/u,
            /stale-summary/u,
            /recover-stale-context/u
          ]
        },
        {
          id: 'blocked-gate',
          payload: createGoalSupervisorRenderPayloadVariant('blocked-gate'),
          expected: [
            /Blocked by current gate/u,
            /missing main verification evidence ref/u,
            /main verification evidence/u
          ]
        },
        {
          id: 'empty-context',
          payload: createGoalSupervisorRenderPayloadVariant('empty-context'),
          expected: [
            />label<\/dt><dd[^>]*>missing/u,
            />pendingResult\.output<\/dt><dd[^>]*>NULL/u,
            /\[ EMPTY \]/u
          ]
        }
      ];

      for (const scenario of scenarios) {
        const viewState = {
          phase: 'ready',
          model: createWorkbenchRenderModelWithSupervisor(scenario.payload)
        };
        const html = renderWorkbenchShellAt(WorkbenchShell, '/workbench/supervisor/', viewState);

        assert.match(html, /Goal Snapshot/u, scenario.id);
        assert.match(html, /Recommended Next Action/u, scenario.id);
        assert.match(html, /Active Lease/u, scenario.id);
        assert.match(html, /Pending Result/u, scenario.id);
        assert.match(html, /Session Source Inventory/u, scenario.id);
        assert.match(html, /Context Advisory/u, scenario.id);
        assert.match(html, /Thread Continuation Decision/u, scenario.id);
        assert.match(html, /Current Gate/u, scenario.id);
        assert.match(html, /Context Status/u, scenario.id);
        assert.match(html, /Ownership/u, scenario.id);
        assert.match(html, /Command Boundary/u, scenario.id);
        assert.match(html, />contract<\/dt><dd[^>]*>supervisor-dashboard-state\.v46 \/ 1/u, scenario.id);
        assert.doesNotMatch(html, /href="(?:artifact:|docs\/plans\/|file:)/u, scenario.id);
        assert.doesNotMatch(html, /supervisor-scenario/u, scenario.id);
        assert.doesNotMatch(html, />Register<|>Apply<|>Execute</u, scenario.id);

        for (const expected of scenario.expected) {
          assert.match(html, expected, scenario.id);
        }
      }
    } finally {
      await server.close();
      restoreSsrLocation();
    }
  });

  it('renders the v38 Provider Hub panel without adding browser execution controls', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const providerHubSource = app.slice(
      app.indexOf('function ProviderHubPanel'),
      app.indexOf('function ProviderLanePreviewPanel')
    );

    assert.match(app, /<ProviderHubPanel/u);
    assert.match(app, /ProviderHubAvailabilityList/u);
    assert.match(app, /ProviderHubReadinessList/u);
    assert.match(app, /ProviderHubReadinessActiveProviders/u);
    assert.match(app, /ProviderHubReadinessHistoricalProviders/u);
    assert.match(app, /ProviderHubReadinessUnsupportedProviders/u);
    assert.match(app, /ProviderHubEvidenceAnchors/u);
    assert.match(contracts, /ProviderHubPanel/u);
    assert.match(contracts, /providerReadiness\.v1/u);
    assert.match(contracts, /agent-cli-provider-health\.v1 \+ agent-cli-capability-profile\.v1 \+ agent-cli-lane-assignment-preview\.v1/u);
    assert.match(contracts, /goal-progress-ledger\.v1 task evidence refs; evidence bodies are not read by Workbench/u);
    assert.doesNotMatch(providerHubSource, /fetch\(|confirmGoalEventPlan|window\.open|navigator\.clipboard|<form\b|<textarea\b|exec|spawn|shell/u);
  });

  it('renders the v66 Worker Run panel as a backend-owned preview confirm lane', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const client = await readFile('frontend/workbench/src/api/client.js', 'utf8');
    const panelSource = app.slice(
      app.indexOf('function WorkerRunPreviewPanel'),
      app.indexOf('function buildWorkerRunConfirmBody')
    );
    const confirmBodySource = app.slice(
      app.indexOf('function buildWorkerRunConfirmBody'),
      app.indexOf('function buildControlledProviderRunnerConfirmBody')
    );

    assert.match(app, /<WorkerRunPreviewPanel/u);
    assert.match(app, /confirmWorkerRunPreview/u);
    assert.match(app, /Confirm worker run/u);
    assert.match(contracts, /workerRunPreview\.v1/u);
    assert.match(contracts, /\/api\/goals\/<goal-id>\/worker-run-preview/u);
    assert.match(client, /workerRunConfirmation\.v1/u);
    assert.match(confirmBodySource, /planHash/u);
    assert.match(confirmBodySource, /providerId/u);
    assert.match(confirmBodySource, /commandTemplateId/u);
    assert.match(confirmBodySource, /timeoutMs/u);
    assert.match(confirmBodySource, /workspacePolicyId/u);
    assert.match(panelSource, /resultPolicy/u);
    assert.match(panelSource, /taskCompletionAvailable/u);
    assert.match(panelSource, /reviewApprovalAvailable/u);
    assert.doesNotMatch(panelSource, /<form\b|<textarea\b|<input\b|window\.open|navigator\.clipboard|document\.execCommand|fetch\(|exec\(|spawn\(|commandText|providerCommand|sessionPath|jsonl/u);
    assert.doesNotMatch(confirmBodySource, /commandText|providerCommand|workspacePath|rawTranscript|rawModelOutput|rawProviderOutput/u);
  });

  it('renders the v67 Claude reviewer lane as a backend-owned preview confirm lane', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const client = await readFile('frontend/workbench/src/api/client.js', 'utf8');
    const panelSource = app.slice(
      app.indexOf('function ReviewerRunPreviewPanel'),
      app.indexOf('function buildWorkerRunConfirmBody')
    );
    const confirmBodySource = app.slice(
      app.indexOf('function buildReviewerRunConfirmBody'),
      app.indexOf('function buildControlledProviderRunnerConfirmBody')
    );

    assert.match(app, /<ReviewerRunPreviewPanel/u);
    assert.match(app, /confirmReviewerRunPreview/u);
    assert.match(app, /Confirm reviewer run/u);
    assert.match(contracts, /reviewerRunHandoff\.v1/u);
    assert.match(contracts, /\/api\/goals\/<goal-id>\/reviewer-run-preview/u);
    assert.match(client, /reviewerRunConfirmation\.v1/u);
    assert.match(confirmBodySource, /planHash/u);
    assert.match(confirmBodySource, /providerId/u);
    assert.match(confirmBodySource, /role/u);
    assert.match(confirmBodySource, /commandTemplateId/u);
    assert.match(confirmBodySource, /handoffPackRef/u);
    assert.match(confirmBodySource, /reviewerActorId/u);
    assert.match(panelSource, /worker evidence/u);
    assert.match(panelSource, /review policy/u);
    assert.match(panelSource, /next safe action/u);
    assert.match(panelSource, /reviewerOutputApprovesAdoption/u);
    assert.match(panelSource, /reviewerVerdictPassesMainVerification/u);
    assert.match(panelSource, /reviewerVerdictMarksReleaseReady/u);
    assert.doesNotMatch(panelSource, /<form\b|<textarea\b|<input\b|window\.open|navigator\.clipboard|document\.execCommand|fetch\(|exec\(|spawn\(|commandText|providerCommand|sessionPath|jsonl|rawTranscript(?!Available)|rawWorkerTranscript(?!Available)|rawModelOutput(?!Available)|rawProviderOutput(?!Available)/u);
    assert.doesNotMatch(confirmBodySource, /commandText|providerCommand|workspacePath|timeoutMs|workspacePolicyId|rawTranscript|rawModelOutput|rawProviderOutput/u);
  });

  it('renders the v68 adoption and main verification loop as read-only evidence status', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const client = await readFile('frontend/workbench/src/api/client.js', 'utf8');
    const panelSource = app.slice(
      app.indexOf('function AdoptionMainVerificationLoopPanel'),
      app.indexOf('function stripEmptyValues')
    );
    const projectionBody = contracts.slice(
      contracts.indexOf('function projectAdoptionMainVerificationLoop'),
      contracts.indexOf('function projectControlledProviderRunnerOperation')
    );

    assert.match(app, /<AdoptionMainVerificationLoopPanel loop=\{model\.activeGoal\.adoptionMainVerificationLoop\}/u);
    assert.match(panelSource, /Adoption -> Main Verification/u);
    assert.match(panelSource, /Worker -> Reviewer -> Adoption -> Main Verification -> Gate Draft/u);
    assert.match(panelSource, /next safe action/u);
    assert.match(panelSource, /backend mutations only/u);
    assert.match(panelSource, /preview\/confirm required/u);
    assert.match(panelSource, /renderer command execution/u);
    assert.match(panelSource, /generic shell runner/u);
    assert.match(panelSource, /raw provider output/u);
    assert.match(panelSource, /direct main verification/u);
    assert.match(panelSource, /release ready declaration/u);
    assert.match(panelSource, /GitHub Release automation/u);
    assert.match(contracts, /ADOPTION_READINESS_PREVIEW_ROUTE_TEMPLATE/u);
    assert.match(contracts, /MAIN_VERIFICATION_PREVIEW_ROUTE_TEMPLATE/u);
    assert.match(contracts, /function projectAdoptionMainVerificationLoop/u);
    assert.match(projectionBody, /V68AdoptionMainVerificationLoop/u);
    assert.match(projectionBody, /adoptionReadiness\.v1 \+ goal-operation-runs\.v1/u);
    assert.match(projectionBody, /mainVerificationPreview\.v1 \+ goal-operation-runs\.v1/u);
    assert.match(projectionBody, /backendOwnedMutationsOnly:\s*valueState\(true\)/u);
    assert.match(projectionBody, /rendererCommandExecutionAvailable:\s*valueState\(false\)/u);
    assert.match(projectionBody, /genericShellRunnerAvailable:\s*valueState\(false\)/u);
    assert.match(projectionBody, /rawProviderOutputAvailable:\s*valueState\(false\)/u);
    assert.match(projectionBody, /releaseReadyDeclarationAvailable:\s*valueState\(false\)/u);
    assert.match(projectionBody, /gitMutationAvailable:\s*valueState\(false\)/u);
    assert.match(projectionBody, /githubReleaseAutomationAvailable:\s*valueState\(false\)/u);
    assert.match(client, /createAdoptionReadinessPreviewRoute/u);
    assert.match(client, /createMainVerificationPreviewRoute/u);
    assert.doesNotMatch(panelSource, /<button\b|<form\b|<textarea\b|<input\b|fetch\(|window\.open|navigator\.clipboard|child_process|exec\(|spawn\(|rawTranscript|rawModelOutput|sessionPath|jsonl|git merge|git tag|git push/u);
  });

  it('keeps the next action card and prompt drawer display-only', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const source = [
      app.slice(app.indexOf('function NextActionCard'), app.indexOf('function PromptPreviewDrawer')),
      app.slice(app.indexOf('function PromptPreviewDrawer'), app.indexOf('function ReviewWorkspacePanel'))
    ].join('\n');
    const promptListSource = app.slice(
      app.indexOf('function PromptPreviewList'),
      app.indexOf('function CloseoutMissingList')
    );

    assert.match(contracts, /goal-next-action\.v1/u);
    assert.match(source, /afterCompletion\.registrationCommand/u);
    assert.match(source, /Prompt Preview Drawer/u);
    assert.match(source, /copy-only prompt drawer/u);
    assert.match(promptListSource, /revision trigger/u);
    assert.match(promptListSource, /revision failed commands/u);
    assert.match(promptListSource, /revision acceptance delta/u);
    assert.doesNotMatch(source, /confirmCommand|dryRunCommand|--confirm|--dry-run/u);
    assert.doesNotMatch(source, /navigator\.clipboard|document\.execCommand|window\.open/u);
    assert.doesNotMatch(source, /symphony goal (update|review|gate) --goal/u);
  });

  it('renders Prompt Workspace prompt text as manual copy-only handoff content', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const promptPackBody = app.slice(
      app.indexOf('function PromptWorkspacePromptPack'),
      app.indexOf('function PromptRoleGuidance')
    );

    assert.match(promptPackBody, /<pre className="prompt-preview-text"><code>\{prompt\?\.text \?\? ''\}<\/code><\/pre>/u);
    assert.match(promptPackBody, /Prompt Workspace 只展示 goal prompt 生成的 copy-only prompt pack/u);
    assert.match(promptPackBody, /不会启动 subagent、运行 shell、登记 approval 或判断任务完成/u);
    assert.doesNotMatch(promptPackBody, /navigator\.clipboard|document\.execCommand|window\.open|copyCommand|handleCopy/u);
    assert.doesNotMatch(promptPackBody, /symphony goal review|symphony goal gate|release\.ready/u);
  });

  it('wires successful goal event confirms to refresh Workbench contracts through event forms', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const nextActionInvocation = app.match(/<NextActionCard[\s\S]*?\/>/u)?.[0] ?? '';
    const reviewWorkspaceInvocation = app.match(/<ReviewWorkspacePanel[\s\S]*?\/>/u)?.[0] ?? '';
    const viewModelInvocation = app.match(/<ActiveGoalViewModelPanel[\s\S]*?\/>/u)?.[0] ?? '';
    const nextActionSignature = app.match(/function NextActionCard\([^)]*\)/u)?.[0] ?? '';
    const reviewWorkspaceSignature = app.match(/function ReviewWorkspacePanel\([^)]*\)/u)?.[0] ?? '';
    const viewModelSignature = app.match(/function ActiveGoalViewModelPanel\([^)]*\)/u)?.[0] ?? '';
    const nextActionBody = app.slice(app.indexOf('function NextActionCard'), app.indexOf('function PromptPreviewDrawer'));

    assert.match(app, /async function refreshWorkbenchContracts/u);
    assert.match(app, /onRefreshWorkbenchContracts=\{refreshWorkbenchContracts\}/u);
    assert.match(nextActionInvocation, /onGoalEventConfirmed=\{onRefreshWorkbenchContracts\}/u);
    assert.match(reviewWorkspaceInvocation, /onGoalEventConfirmed=\{onRefreshWorkbenchContracts\}/u);
    assert.doesNotMatch(viewModelInvocation, /onGoalEventConfirmed/u);
    assert.match(nextActionSignature, /onGoalEventConfirmed/u);
    assert.match(reviewWorkspaceSignature, /onGoalEventConfirmed/u);
    assert.doesNotMatch(viewModelSignature, /onGoalEventConfirmed/u);
    assert.match(nextActionBody, /<GoalEventFormModelView[\s\S]*onGoalEventConfirmed=\{onGoalEventConfirmed\}/u);
    assert.match(app, /goal-status \/ events \/ next action \/ closeout/u);
  });

  it('polls the scoped Goal Operation Console route without adding a terminal runner', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const operationPanelBody = app.slice(
      app.indexOf('function GoalOperationConsolePanel'),
      app.indexOf('function OperationConsoleRunCard')
    );

    assert.match(app, /GOAL_OPERATION_POLL_INTERVAL_MS\s*=\s*2500/u);
    assert.match(app, /window\.setInterval\(pollGoalOperationConsole, GOAL_OPERATION_POLL_INTERVAL_MS\)/u);
    assert.match(app, /window\.clearInterval\(timerId\)/u);
    assert.match(app, /goalOperationPollingEnabled/u);
    assert.match(app, /fetchWorkbenchContracts\(\)/u);
    assert.match(operationPanelBody, /polling\.enabled/u);
    assert.match(operationPanelBody, /polling\.intervalMs/u);
    assert.match(operationPanelBody, /polling\.route/u);
    assert.match(operationPanelBody, /polling\.reason/u);
    assert.match(contracts, /GET goal-operation-runs\.v1/u);
    assert.doesNotMatch(app, /child_process|exec\(|spawn\(|terminal emulator|WebSocket|EventSource/u);
    assert.doesNotMatch(operationPanelBody, /generic shell runner/u);
  });

  it('wires the v31 main verification readiness panel as explicit-state copy-only display', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const panelBody = app.slice(
      app.indexOf('function MainVerificationReadinessPanel'),
      app.indexOf('function ActiveGoalRunbookPanel')
    );
    const draftPanelBody = app.slice(
      app.indexOf('function MainVerificationEvidenceDraftPanel'),
      app.indexOf('function ActiveGoalRunbookPanel')
    );

    assert.match(app, /<MainVerificationReadinessPanel[\s\S]*readiness=\{model\.activeGoal\.mainVerificationReadiness\}[\s\S]*onVerificationRunConfirmed=\{onRefreshWorkbenchContracts\}/u);
    assert.match(app, /<MainVerificationGateRegistrationPanel[\s\S]*registration=\{model\.activeGoal\.mainVerificationGateRegistration\}[\s\S]*onGoalEventConfirmed=\{onRefreshWorkbenchContracts\}/u);
    assert.match(panelBody, /reviewer\.approved/u);
    assert.match(panelBody, /adoption state/u);
    assert.match(panelBody, /explicit state sources/u);
    assert.match(panelBody, /ignored inference sources/u);
    assert.match(panelBody, /ff-only merge guidance/u);
    assert.match(panelBody, /required verification commands/u);
    assert.match(panelBody, /allowlisted verification plan preview/u);
    assert.match(panelBody, /AllowlistedVerificationPlanPreview/u);
    assert.match(panelBody, /VerificationPlanCommandList/u);
    assert.match(panelBody, /active goal\/task\/run\/evidence context/u);
    assert.match(panelBody, /fixed verification allowlist/u);
    assert.match(panelBody, /controlled verification operation/u);
    assert.match(panelBody, /Start controlled verification run/u);
    assert.match(panelBody, /confirmControlledVerificationRun/u);
    assert.match(panelBody, /successImpliesGatePassed/u);
    assert.match(app, /mainVerificationEvidenceDraft/u);
    assert.match(draftPanelBody, /main verification evidence draft/u);
    assert.match(draftPanelBody, /MainVerificationEvidenceDraftPanel/u);
    assert.match(draftPanelBody, /draft\?\.verification\?\.operationId/u);
    assert.match(draftPanelBody, /draft\?\.refs\?\.workerEvidenceRef/u);
    assert.match(draftPanelBody, /draft\?\.refs\?\.reviewEvidenceRef/u);
    assert.match(draftPanelBody, /draft\?\.adoptionRefs\?\.adoptionConfirmStatus/u);
    assert.match(draftPanelBody, /draft\?\.copyOnlyGateDryRun/u);
    assert.match(draftPanelBody, /draft\?\.markdown\?\.text/u);
    assert.match(draftPanelBody, /draft needing operator \/ reviewer check/u);
    assert.match(draftPanelBody, /needsOperatorReview/u);
    assert.match(draftPanelBody, /writesEvidenceFile/u);
    assert.match(draftPanelBody, /declaresPassed/u);
    assert.match(draftPanelBody, /MainVerificationGateRegistrationPanel/u);
    assert.match(draftPanelBody, /main-verification gate form/u);
    assert.match(draftPanelBody, /registration\?\.targetEvidenceRef/u);
    assert.match(draftPanelBody, /registration\?\.verificationOperationId/u);
    assert.match(draftPanelBody, /registration\?\.confirmCommandPattern/u);
    assert.match(draftPanelBody, /registration\?\.safety\?\.confirmRequiresPlanHash/u);
    assert.match(draftPanelBody, /registration\?\.safety\?\.arbitraryShellAccepted/u);
    assert.match(draftPanelBody, /<GoalEventFormList[\s\S]*items:\s*registration\?\.form === null/u);
    assert.match(panelBody, /commandInputAccepted/u);
    assert.match(panelBody, /arbitraryShellAccepted/u);
    assert.match(panelBody, /evidence path/u);
    assert.match(contracts, /projectMainVerificationReadiness/u);
    assert.match(contracts, /projectAllowlistedVerificationPlanPreview/u);
    assert.match(contracts, /projectMainVerificationEvidenceDraft/u);
    assert.match(contracts, /projectMainVerificationGateRegistration/u);
    assert.match(contracts, /MainVerificationGateRegistration/u);
    assert.match(contracts, /gateStatus:\s*\{[\s\S]*readOnly:\s*true[\s\S]*options:\s*\['passed'\]/u);
    assert.match(contracts, /form:\s*available \? form : null/u);
    assert.match(contracts, /latestVerificationOperationForTask/u);
    assert.match(contracts, /Draft status: needs operator\/reviewer check/u);
    assert.match(contracts, /verification-run-confirm/u);
    assert.match(contracts, /MAIN_VERIFICATION_COMMAND_ALLOWLIST/u);
    assert.match(contracts, /CONTROLLED_VERIFICATION_CONTEXT_COMMANDS/u);
    assert.match(contracts, /projectMainVerificationAdoptionState/u);
    assert.match(contracts, /goal-operation-runs\.v1 \+ symphony\.console-adoption-inspect/u);
    assert.match(contracts, /git merge --ff-only/u);
    assert.match(contracts, /<main-verification-evidence-ref>/u);
    assert.doesNotMatch(contracts, /projectMainVerificationBranchState/u);
    assert.doesNotMatch(panelBody, /fetchGoalEventPlanPreview|confirmGoalEventPlan|window\.open|navigator\.clipboard|<textarea|<input/u);
  });

  it('shows copy-only failure recovery shortcuts for failed goal operations', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const recoveryBody = app.slice(
      app.indexOf('function GoalOperationFailureRecovery'),
      app.indexOf('function buildGoalOperationInlineTranscript')
    );

    assert.match(app, /buildGoalOperationFailureRecovery/u);
    assert.match(recoveryBody, /failure recovery/u);
    assert.match(recoveryBody, /retry-dry-run/u);
    assert.match(recoveryBody, /copy-command/u);
    assert.match(recoveryBody, /copy-reviewer-prompt/u);
    assert.match(recoveryBody, /copy-issue-prompt/u);
    assert.match(recoveryBody, /browserExecutionAvailable/u);
    assert.match(app, /buildGoalEventDryRunCopyCommand/u);
    assert.match(app, /Do not approve or verify from this prompt alone/u);
    assert.match(app, /it is not evidence of completion/u);
    assert.doesNotMatch(recoveryBody, /navigator\.clipboard|document\.execCommand|window\.open|fetchGoalEventPlanPreview|confirmGoalEventPlan/u);
  });

  it('wires Prompt Workspace worker event shortcuts through the controlled goal update dry-run and confirm flow', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const shortcutInvocation = app.match(/<PromptWorkspaceEventShortcuts[\s\S]*?\/>/u)?.[0] ?? '';
    const shortcutBody = app.slice(
      app.indexOf('function PromptWorkspaceEventShortcuts'),
      app.indexOf('function SubagentHandoffTaskList')
    );

    assert.match(shortcutInvocation, /selectedGoalId=\{selectedGoalId\}/u);
    assert.match(shortcutInvocation, /selectedTaskId=\{selectedTaskId\}/u);
    assert.match(shortcutInvocation, /selectedRole=\{selectedRole\}/u);
    assert.match(shortcutInvocation, /onGoalEventConfirmed=\{refreshPromptWorkspaceHandoff\}/u);
    assert.match(shortcutBody, /worker\.started/u);
    assert.match(shortcutBody, /worker\.evidence-recorded/u);
    assert.match(shortcutBody, /symphony goal update/u);
    assert.match(shortcutBody, /<GoalEventPlanPreview[\s\S]*onGoalEventConfirmed=\{onGoalEventConfirmed\}/u);
    assert.match(shortcutBody, /dry-run preview/u);
    assert.match(shortcutBody, /plan-hash confirm/u);
    assert.match(app, /operationId/u);
    assert.match(app, /operationStatus/u);
    assert.match(app, /operationStartedAt/u);
    assert.match(app, /operationCompletedAt/u);
    assert.doesNotMatch(shortcutBody, /symphony goal review|symphony goal gate|release\.ready|reviewer\.approved|main\.verification-passed/u);
    assert.doesNotMatch(shortcutBody, /child_process|exec\(|spawn\(|shell runner|window\.open|navigator\.clipboard/u);
  });

  it('exposes the v25 worker evidence handoff without adding a generic runner', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const handoffBody = app.slice(
      app.indexOf('function WorkerEvidenceHandoffView'),
      app.indexOf('function GoalEventFormList')
    );

    assert.match(contracts, /V25_CONTROLLED_IMPLEMENTATION_GOAL_ID = 'v25-controlled-implementation-lane'/u);
    assert.match(contracts, /function projectV25WorkerEvidenceHandoff/u);
    assert.match(contracts, /evidenceArtifactPath/u);
    assert.match(contracts, /sourceWorkspacePath/u);
    assert.match(contracts, /workerCanApproveOwnTask:\s*valueState\(false\)/u);
    assert.match(handoffBody, /prompt handoff/u);
    assert.match(handoffBody, /registration form/u);
    assert.match(handoffBody, /<GoalEventPlanPreview form=\{handoff\.registrationForm\}/u);
    assert.doesNotMatch(handoffBody, /child_process|exec\(|spawn\(|window\.open|navigator\.clipboard|reviewer\.approved|main\.verification-passed/u);
  });

  it('exposes the v30 adoption candidate panel as read-only operation/run inspection', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const panelBody = app.slice(
      app.indexOf('function AdoptionCandidatePanel'),
      app.indexOf('function HandoffPanel')
    );
    const projectionBody = contracts.slice(
      contracts.indexOf('function projectAdoptionCandidates'),
      contracts.indexOf('function projectAdoptionCandidateRun')
    );

    assert.match(app, /<AdoptionCandidatePanel candidates=\{model\.adoptionCandidates\}/u);
    assert.match(panelBody, /source run/u);
    assert.match(panelBody, /workspace/u);
    assert.match(panelBody, /evidenceArtifactPath/u);
    assert.match(panelBody, /changed files/u);
    assert.match(panelBody, /verifierStatus/u);
    assert.match(projectionBody, /AdoptionCandidateProjectionV30/u);
    assert.match(projectionBody, /GOAL_OPERATION_RUNS_CONTRACT_NAME/u);
    assert.match(projectionBody, /symphony\.console-runs/u);
    assert.match(projectionBody, /backend operation\/run fields only/u);
    assert.match(projectionBody, /genericShellRunner:\s*valueState\(false\)/u);
    assert.match(projectionBody, /workerCanApproveOwnTask:\s*valueState\(false\)/u);
    assert.doesNotMatch(panelBody, /GoalEventPlanPreview|confirmGoalEventPlan|fetchGoalEventPlanPreview|symphony goal review|symphony goal gate|release\.ready|reviewer\.approved|main\.verification-passed|git merge|git tag|child_process|exec\(|spawn\(|window\.open|navigator\.clipboard/u);
  });

  it('exposes the v30 adoption confirm path through frozen operation context', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const panelBody = app.slice(
      app.indexOf('function AdoptionInspectRecoveryPanel'),
      app.indexOf('function HandoffPanel')
    );
    const projectionBody = contracts.slice(
      contracts.indexOf('function projectAdoptionInspectRecoveryWorkspace'),
      contracts.indexOf('function projectAdoptionFreezeCandidate')
    );

    assert.match(app, /<AdoptionInspectRecoveryPanel[\s\S]*workspace=\{model\.adoptionInspectRecoveryWorkspace\}[\s\S]*onAdoptionConfirmed=\{onRefreshWorkbenchContracts\}/u);
    assert.match(contracts, /ADOPTION_INSPECT_ROUTE_TEMPLATE/u);
    assert.match(contracts, /CONTROLLED_ADOPTION_CONFIRM_ROUTE_TEMPLATE/u);
    assert.match(projectionBody, /AdoptionInspectRecoveryViewV30/u);
    assert.match(projectionBody, /goal-operation-runs\.v1 adoption-plan runResult\.adoptionPlanId/u);
    assert.match(projectionBody, /adoption inspect journal\.status/u);
    assert.match(projectionBody, /symphony adopt --confirm/u);
    assert.match(projectionBody, /refreshesAfterConfirm:\s*arrayTextState\(\['goal-status', 'goal-events', 'goal-operation-runs', 'runs', 'goal-next-action'\]\)/u);
    assert.match(projectionBody, /currentWorktreeMatchesAfterHash/u);
    assert.match(panelBody, /Inspect recovery state/u);
    assert.match(panelBody, /Confirm adoption/u);
    assert.match(panelBody, /confirm endpoint/u);
    assert.match(panelBody, /journalStatus/u);
    assert.match(panelBody, /currentWorktreeMatchesAfterHash/u);
    assert.match(panelBody, /currentWorktreeMatchesJournalBeforeFiles/u);
    assert.match(panelBody, /file operation hashes/u);
    assert.match(panelBody, /latestConfirmationEvidenceArtifactPath/u);
    assert.match(projectionBody, /genericShellRunner:\s*valueState\(false\)/u);
    assert.match(projectionBody, /adoptionConfirmAvailable:\s*valueState\(confirmBodyAvailable && isNonEmptyString\(confirmRoute\)\)/u);
    assert.match(projectionBody, /applyPatchAvailable:\s*valueState\(false\)/u);
    assert.match(projectionBody, /mergeAvailable:\s*valueState\(false\)/u);
    assert.match(projectionBody, /pushAvailable:\s*valueState\(false\)/u);
    assert.match(projectionBody, /tagAvailable:\s*valueState\(false\)/u);
    assert.doesNotMatch(panelBody, /confirmControlledAdoptionPlanFreeze|confirmGoalEventPlan|fetchGoalEventPlanPreview|symphony goal review|symphony goal gate|release\.ready|reviewer\.approved|main\.verification-passed|git merge|git tag|git push|child_process|exec\(|spawn\(|window\.open|navigator\.clipboard/u);
  });

  it('keeps the v30 adoption path as verified workflow evidence instead of direct patch or readiness controls', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const guide = await readFile('docs/workbench-operator-guide.md', 'utf8');
    const productContracts = await readFile('docs/symphony-product-contracts.md', 'utf8');
    const adoptionPanels = app.slice(
      app.indexOf('function AdoptionCandidatePanel'),
      app.indexOf('function HandoffPanel')
    );
    const confirmResultBody = app.slice(
      app.indexOf('function AdoptionConfirmResult'),
      app.indexOf('function ProjectedAdoptionInspectOutput')
    );
    const adoptionProjection = contracts.slice(
      contracts.indexOf('function projectAdoptionCandidates'),
      contracts.indexOf('function projectGoalEventForms')
    );

    assert.match(adoptionPanels, /Adoption candidate normalization/u);
    assert.match(adoptionPanels, /Freeze adoption plan/u);
    assert.match(adoptionPanels, /Inspect recovery state/u);
    assert.match(adoptionPanels, /Confirm adoption/u);
    assert.match(adoptionProjection, /goal-operation-runs\.v1/u);
    assert.match(adoptionProjection, /backend operation\/run fields only/u);
    assert.match(adoptionProjection, /mappedToExistingAdoptRun:\s*valueState\(true\)/u);
    assert.match(adoptionProjection, /refreshesAfterConfirm:\s*arrayTextState\(\['goal-status', 'goal-events', 'goal-operation-runs', 'runs', 'goal-next-action'\]\)/u);
    assert.match(confirmResultBody, /mainWorktreeWrites/u);
    assert.match(confirmResultBody, /genericShellRunner/u);
    assert.match(confirmResultBody, /modelInvocationAvailable/u);
    assert.match(confirmResultBody, /reviewerEventRegistered/u);
    assert.match(confirmResultBody, /mainVerificationEventRegistered/u);
    assert.match(confirmResultBody, /releaseReadinessRegistered/u);
    assert.match(confirmResultBody, /mergeAvailable/u);
    assert.match(confirmResultBody, /pushAvailable/u);
    assert.match(confirmResultBody, /tagAvailable/u);
    assert.match(confirmResultBody, /publishAvailable/u);
    assert.match(guide, /v30 adoption evidence bridge/u);
    assert.match(productContracts, /v30 adoption evidence bridge/u);
    assert.doesNotMatch(adoptionPanels, />Apply patch<|>Run model<|>Open local file<|>Download artifact<|>Merge<|>Push<|>Tag<|>Publish<|>Declare release ready</u);
    assert.doesNotMatch(adoptionPanels, /release\.ready|main\.verification-passed|reviewer\.approved|child_process|exec\(|spawn\(|window\.open|navigator\.clipboard/u);
  });

  it('exposes the v27 Review Workspace with controlled review verdict registration', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const panelBody = app.slice(
      app.indexOf('function ReviewWorkspacePanel'),
      app.indexOf('function CloseoutGapsPanel')
    );

    assert.match(app, /<ReviewWorkspacePanel[\s\S]*workspace=\{model\.activeGoal\.reviewWorkspace\}/u);
    assert.match(contracts, /REVIEW_WORKSPACE_MODEL_NAME = 'ReviewWorkspaceContextModel'/u);
    assert.match(contracts, /function projectReviewWorkspace/u);
    assert.match(panelBody, /source run/u);
    assert.match(panelBody, /changed files/u);
    assert.match(panelBody, /worker evidence/u);
    assert.match(panelBody, /review prompt/u);
    assert.match(panelBody, /reviewer handoff/u);
    assert.match(panelBody, /promptGeneratedFrom/u);
    assert.match(panelBody, /promptCommand/u);
    assert.match(panelBody, /reviewer evidence path/u);
    assert.match(panelBody, /reviewerActorMustDifferFromLatestWorker/u);
    assert.match(panelBody, /review checklist/u);
    assert.match(panelBody, /expected verdict event/u);
    assert.match(panelBody, /review verdict registration/u);
    assert.match(panelBody, /ReviewVerdictRegistration/u);
    assert.match(panelBody, /GoalEventFormList[\s\S]*onGoalEventConfirmed=\{onGoalEventConfirmed\}/u);
    assert.match(contracts, /function projectReviewerHandoff/u);
    assert.match(contracts, /function projectReviewVerdictRegistration/u);
    assert.match(contracts, /symphony goal prompt --goal \$\{goalId\} --task \$\{taskId\} --role reviewer --markdown/u);
    assert.match(contracts, /reviewer-is-not-worker precondition/u);
    assert.match(contracts, /reviewer\.approved/u);
    assert.match(contracts, /reviewer\.needs-revision/u);
    assert.match(contracts, /symphony goal review dry-run preview and plan-hash confirm/u);
    assert.match(panelBody, /dryRunCommand/u);
    assert.match(panelBody, /workbenchWriteAvailable/u);
    assert.match(contracts, /goal-prompt-pack\.v1/u);
    assert.match(contracts, /symphony\.console-run/u);
    assert.match(contracts, /genericShellRunner:\s*valueState\(false\)/u);
    assert.match(contracts, /workerCanApproveOwnTask:\s*valueState\(false\)/u);
    assert.doesNotMatch(panelBody, /git merge|git tag|child_process|exec\(|spawn\(|window\.open|navigator\.clipboard/u);
  });

  it('exposes the v28 Release Closeout Workspace without tagging or shell execution', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const panelBody = app.slice(
      app.indexOf('function CloseoutGapsPanel'),
      app.indexOf('function GoalOperationConsolePanel')
    );

    assert.match(app, /<CloseoutGapsPanel[\s\S]*closeoutGaps=\{model\.activeGoal\.closeoutGaps\}[\s\S]*onGoalEventConfirmed=\{onRefreshWorkbenchContracts\}/u);
    assert.match(contracts, /RELEASE_CLOSEOUT_WORKSPACE_MODEL_NAME = 'ReleaseCloseoutWorkspaceModel'/u);
    assert.match(contracts, /RELEASE_EVIDENCE_DRAFT_MODEL_NAME = 'ReleaseEvidenceDraftWriter'/u);
    assert.match(contracts, /TAG_EVIDENCE_DRAFT_MODEL_NAME = 'TagEvidenceDraftWriter'/u);
    assert.match(contracts, /RELEASE_VERIFICATION_CHECKLIST/u);
    assert.match(contracts, /release\.pnpm-check/u);
    assert.match(contracts, /release\.workbench-build/u);
    assert.match(contracts, /release\.tag-evidence/u);
    assert.match(contracts, /RELEASE_BASELINE_RESOLVER_MODEL_NAME = 'ReleaseBaselineResolver'/u);
    assert.match(contracts, /projectReleaseBaselineResolver/u);
    assert.match(contracts, /projectReleaseEvidenceDraft/u);
    assert.match(contracts, /NEXT_VERSION_HANDOFF_DRAFT_MODEL_NAME = 'NextVersionHandoffDraft'/u);
    assert.match(contracts, /projectNextVersionHandoffDraft/u);
    assert.match(contracts, /NATIVE_UX_HANDOFF_SCOPE/u);
    assert.match(contracts, /Menu bar companion/u);
    assert.match(contracts, /Notch companion/u);
    assert.match(contracts, /Native distribution/u);
    assert.match(contracts, /projectNativeUxHandoffDraft/u);
    assert.match(contracts, /copyOnlyTagCommand/u);
    assert.match(contracts, /tagExecutionAvailable:\s*valueState\(false\)/u);
    assert.match(contracts, /currentBranch/u);
    assert.match(contracts, /originMainHead/u);
    assert.match(contracts, /releaseReadyBlockedWhenDirtyOrNonMain/u);
    assert.match(contracts, /finalJudgmentFromFallbackCheckout/u);
    assert.match(contracts, /goal-gate-release-ready-declared/u);
    assert.match(contracts, /release\.ready-declared/u);
    assert.match(contracts, /gate:\s*'release\.ready'/u);
    assert.match(contracts, /gateStatus:\s*'declared'/u);
    assert.match(panelBody, /release baseline resolver/u);
    assert.match(panelBody, /ReleaseBaselineResolver/u);
    assert.match(panelBody, /PR \/ CI ref/u);
    assert.match(panelBody, /stop \/ fix guidance/u);
    assert.match(panelBody, /release verification checklist/u);
    assert.match(panelBody, /release\.ready gate registration/u);
    assert.match(panelBody, /release evidence draft/u);
    assert.match(panelBody, /tag evidence draft \/ prompt/u);
    assert.match(panelBody, /next-version handoff draft/u);
    assert.match(panelBody, /native UX handoff scope/u);
    assert.match(panelBody, /NativeUxHandoffDraft/u);
    assert.match(panelBody, /NativeUxStarterWorkPackageList/u);
    assert.match(panelBody, /ReleaseVerificationChecklist/u);
    assert.match(panelBody, /ReleaseReadyGateRegistration/u);
    assert.match(panelBody, /ReleaseEvidenceDraft/u);
    assert.match(panelBody, /TagEvidencePrompt/u);
    assert.match(panelBody, /NextVersionHandoffDraft/u);
    assert.match(panelBody, /copyOnlyTagCommand/u);
    assert.match(panelBody, /tag command result fields/u);
    assert.match(panelBody, /createsManagedGoal/u);
    assert.match(panelBody, /entersNextVersion/u);
    assert.match(panelBody, /nativeUxHandoffOnly/u);
    assert.match(panelBody, /publishesDistribution/u);
    assert.match(panelBody, /<GoalEventFormList[\s\S]*forms=\{\{[\s\S]*items:\s*\[registration\.form\]/u);
    assert.doesNotMatch(panelBody, /child_process|exec\(|spawn\(|window\.open|navigator\.clipboard|git merge|git tag/u);
  });

  it('remounts Prompt Workspace worker shortcut previews after task selection changes', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const shortcutBody = app.slice(
      app.indexOf('function PromptWorkspaceEventShortcuts'),
      app.indexOf('function createPromptWorkspaceWorkerEventShortcutForms')
    );
    const planPreviewBody = app.slice(
      app.indexOf('function GoalEventPlanPreview'),
      app.indexOf('function GoalEventPreviewInput')
    );
    const previewPathBody = app.slice(
      app.indexOf('function buildGoalEventPreviewPath'),
      app.indexOf('function buildGoalEventConfirmPath')
    );
    const confirmBody = app.slice(
      app.indexOf('function buildGoalEventConfirmBody'),
      app.indexOf('function assignBodyValue')
    );

    assert.match(shortcutBody, /promptWorkspaceWorkerEventShortcutKey\(\{[\s\S]*goalId:\s*selectedGoalId[\s\S]*taskId:\s*selectedTaskId[\s\S]*eventType:\s*form\.eventType\.value[\s\S]*\}\)/u);
    assert.match(shortcutBody, /<li key=\{shortcutKey\}>/u);
    assert.match(shortcutBody, /<GoalEventPlanPreview key=\{shortcutKey\} form=\{form\}/u);
    assert.match(app, /function promptWorkspaceWorkerEventShortcutKey\(\{ goalId, taskId, eventType \}\)[\s\S]*join\('::'\)/u);
    assert.match(planPreviewBody, /const formIdentity = goalEventFormIdentity\(form\)/u);
    assert.match(planPreviewBody, /useEffect\(\(\) => \{[\s\S]*setValues\(initialGoalEventPreviewValues\(form\)\)[\s\S]*setPreviewState\(\{[\s\S]*phase:\s*'idle'[\s\S]*setConfirmState\(\{[\s\S]*phase:\s*'idle'[\s\S]*\}, \[formIdentity\]\)/u);
    assert.match(app, /function goalEventFormIdentity\(form\)[\s\S]*field\.id\.value === 'goalId'[\s\S]*field\.id\.value === 'taskId'[\s\S]*form\.eventType\.value[\s\S]*join\('::'\)/u);
    assert.match(previewPathBody, /appendSearchParam\(searchParams,\s*'task',\s*values\.taskId\)/u);
    assert.match(confirmBody, /assignBodyValue\(body,\s*'task',\s*values\.taskId\)/u);
  });

  it('keeps frontend API paths limited to the approved read-only endpoints', async () => {
    const sources = await Promise.all(
      frontendFiles.map((file) => readFile(file, 'utf8'))
    );
    const source = sources.join('\n');
    const apiPaths = [...source.matchAll(/['"`](\/api\/[^'"`]+)['"`]/gu)]
      .map((match) => match[1])
      .sort();

    assert.deepEqual(apiPaths, [
      '/api/actions/availability',
      '/api/actions/manifest',
      '/api/actions/preview',
      '/api/adoptions/<adoption-id>/inspect',
      '/api/app-data/migration',
      '/api/app/data-inventory',
      '/api/artifacts',
      '/api/backup/export',
      '/api/bundle',
      '/api/capabilities',
      '/api/diagnostics',
      '/api/diagnostics/bundle',
      '/api/evidence/timeline',
      '/api/goals',
      '/api/goals/${encodeURIComponent(goalId)}/reviewer-run-confirm',
      '/api/goals/${encodeURIComponent(goalId)}/worker-run-confirm',
      '/api/goals/${goalId}/verification-run-confirm',
      '/api/goals/<goal-id>/adoption-confirm',
      '/api/goals/<goal-id>/adoption-plan-freeze',
      '/api/goals/<goal-id>/adoption-readiness-preview',
      '/api/goals/<goal-id>/closeout',
      '/api/goals/<goal-id>/event-plan-confirm',
      '/api/goals/<goal-id>/event-plan-preview',
      '/api/goals/<goal-id>/event-plan-preview',
      '/api/goals/<goal-id>/events',
      '/api/goals/<goal-id>/implementation-plan-preview',
      '/api/goals/<goal-id>/main-verification-preview',
      '/api/goals/<goal-id>/next',
      '/api/goals/<goal-id>/operations',
      '/api/goals/<goal-id>/progress',
      '/api/goals/<goal-id>/prompt',
      '/api/goals/<goal-id>/provider-runner-preview',
      '/api/goals/<goal-id>/release-baseline',
      '/api/goals/<goal-id>/reviewer-run-preview',
      '/api/goals/<goal-id>/runbook',
      '/api/goals/<goal-id>/supervisor',
      '/api/goals/<goal-id>/worker-run-preview',
      '/api/goals/latest/closeout',
      '/api/goals/latest/events',
      '/api/goals/latest/next',
      '/api/goals/latest/operations',
      '/api/goals/latest/progress',
      '/api/goals/latest/prompt',
      '/api/goals/latest/release-baseline',
      '/api/goals/latest/runbook',
      '/api/goals/latest/supervisor',
      '/api/handoff',
      '/api/handoff/<ref>',
      '/api/inbox/capture',
      '/api/install/status',
      '/api/jobs',
      '/api/jobs/control',
      '/api/jobs/create',
      '/api/jobs/timeline',
      '/api/projects',
      '/api/projects/current-binding',
      '/api/projects/current-binding',
      '/api/projects/current-binding/select',
      '/api/projects/recent',
      '/api/providers/capabilities',
      '/api/providers/health',
      '/api/providers/lane-preview',
      '/api/providers/readiness',
      '/api/readiness',
      '/api/release/app-core-manager',
      '/api/release/bundle',
      '/api/restore/validate',
      '/api/runs',
      '/api/runs/<run-id>/artifacts/<artifact-kind>/preview',
      '/api/runs/<run-id>/timeline',
      '/api/runs/latest',
      '/api/runtime/snapshot',
      '/api/settings/personal-workbench',
      '/api/summary',
      '/api/workflow/router-categories',
      '/api/workflows/goal-draft-handoff'
    ]);
  });

  it('consumes backend safe artifact previews without browser-side safety inference', async () => {
    const source = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');

    assert.match(source, /SAFE_ARTIFACT_PREVIEW_ROUTE_TEMPLATE/u);
    assert.match(source, /createSafeArtifactPreviewRoutes/u);
    assert.match(source, /safeToRenderInline/u);
    assert.match(source, /previewAvailable/u);
    assert.match(source, /contentText/u);
    assert.match(app, /safe-preview-text/u);
    assert.doesNotMatch(source, /safeToRenderInline\s*:\s*true/u);
    assert.doesNotMatch(source, /previewAvailable\s*:\s*true/u);
    assert.doesNotMatch(source, /mime\s*:\s*['"`]text\/html/u);
    assert.doesNotMatch(source, /artifactKind\s*:\s*artifact\.kind/u);
    assert.doesNotMatch(source, /\/artifacts\/\$\{|\/artifacts\/'\s*\+/u);
    assert.doesNotMatch(source, /extname|artifact\.path[\s\S]{0,80}\.endsWith|\.endsWith\s*\(\s*['"`]\.(html|json|txt)|\.includes\s*\(\s*['"`]\.html/u);
    assert.doesNotMatch(app, /dangerouslySetInnerHTML/u);
  });

  it('builds to the approved static Workbench output directory', async () => {
    const config = await readFile('frontend/workbench/vite.config.js', 'utf8');

    assert.match(config, /src\/symphony\/workbench-static/);
    assert.match(config, /base:\s*['"`]\/workbench\/['"`]/);
    assert.doesNotMatch(config, /proxy\s*:/);
  });

  it('limits Vite dev server filesystem access to the Workbench root', async () => {
    const config = await readFile('frontend/workbench/vite.config.js', 'utf8');
    const serverBlock = config.slice(config.indexOf('server:'), config.indexOf('build:'));
    const allowLine = serverBlock
      .split('\n')
      .find((line) => line.includes('allow:'));

    assert.match(serverBlock, /fs:\s*{[\s\S]*strict:\s*true/);
    assert.match(allowLine, /allow:\s*\[\s*workbenchRoot\s*\]/);
    assert.doesNotMatch(allowLine, /\.\.|process\.cwd|searchForWorkspaceRoot|repoRoot/);
    assert.doesNotMatch(allowLine, /src\/symphony|docs|package\.json|pnpm-lock\.yaml/);
    assert.doesNotMatch(config, /proxy\s*:/);
  });
});

describe('v15 Workbench static serving', () => {
  it('serves the Workbench app, assets, and app-route fallback under /workbench only', async () => {
    const { root, server, baseUrl } = await startConsoleServer();

    try {
      const rootResponse = await fetch(`${baseUrl}/workbench/`);

      assert.equal(rootResponse.status, 200);
      assert.match(rootResponse.headers.get('content-type') ?? '', /^text\/html; charset=utf-8/iu);
      assert.equal(rootResponse.headers.get('x-content-type-options'), 'nosniff');

      const html = await rootResponse.text();
      const noSlashResponse = await fetch(`${baseUrl}/workbench`);
      const assetPaths = extractWorkbenchAssetPaths(html);

      assert.match(html, /<div id="root"><\/div>/u);
      assert.equal(noSlashResponse.status, 200);
      assert.match(await noSlashResponse.text(), /<div id="root"><\/div>/u);
      assert.match(assetPaths.script, /^\/workbench\/assets\/index-.+\.js$/u);
      assert.match(assetPaths.style, /^\/workbench\/assets\/index-.+\.css$/u);

      const jsResponse = await fetch(`${baseUrl}${assetPaths.script}`);
      const cssResponse = await fetch(`${baseUrl}${assetPaths.style}`);
      const fallbackResponse = await fetch(`${baseUrl}/workbench/runs/example-run`);
      const summaryResponse = await fetch(`${baseUrl}/api/summary`);
      const rootAssetResponse = await fetch(`${baseUrl}${assetPaths.script.replace('/workbench', '')}`);
      const stageHtmlResponse = await fetch(`${baseUrl}/docs/stages/v15-workbench-react-vite-migration.html`);
      const stageJsonResponse = await fetch(`${baseUrl}/docs/stages/v15-workbench-react-vite-migration.stage.json`);

      assert.equal(jsResponse.status, 200);
      assert.match(jsResponse.headers.get('content-type') ?? '', /javascript/iu);
      assert.equal((await jsResponse.text()).length > 1000, true);
      assert.equal(cssResponse.status, 200);
      assert.match(cssResponse.headers.get('content-type') ?? '', /^text\/css; charset=utf-8/iu);
      assert.equal(fallbackResponse.status, 200);
      assert.match(await fallbackResponse.text(), /<div id="root"><\/div>/u);
      assert.equal(summaryResponse.status, 200);
      assert.equal((await summaryResponse.json()).contractName, 'symphony.console-snapshot');
      assert.equal(rootAssetResponse.status, 404);
      assert.equal(stageHtmlResponse.status, 404);
      assert.doesNotMatch(await stageHtmlResponse.text(), /v15 Workbench|symphony.stage-charter/u);
      assert.equal(stageJsonResponse.status, 404);
      assert.doesNotMatch(await stageJsonResponse.text(), /v15 Workbench|symphony.stage-charter/u);
    } finally {
      await closeServer(server);
      await rm(root, { recursive: true, force: true });
    }
  });

  it('returns 404/403 for missing assets, traversal, local file probes, and write methods', async () => {
    const { root, server, baseUrl } = await startConsoleServer();
    const assetName = (await readdir('src/symphony/workbench-static/assets'))
      .find((entry) => entry.endsWith('.js'));

    assert.equal(typeof assetName, 'string');

    try {
      const missingAssetResponse = await fetch(`${baseUrl}/workbench/assets/missing.js`);
      const postResponse = await fetch(`${baseUrl}/workbench/`, { method: 'POST' });

      assert.equal(missingAssetResponse.status, 404);
      assert.equal(postResponse.status, 405);
      assert.doesNotMatch(await postResponse.text(), /<div id="root"><\/div>/u);

      for (const path of [
        '/workbench/%2e%2e/package.json',
        '/workbench/..%2fpackage.json',
        '/workbench/%2e%2e%2fsrc%2fsymphony%2fconsole.js',
        '/workbench/%5c..%5cpackage.json'
      ]) {
        const response = await fetch(`${baseUrl}${path}`);
        const body = await response.text();

        assert.equal([403, 404].includes(response.status), true);
        assert.doesNotMatch(body, /multi-coding-agent-symphony|createSymphonyConsoleServer/u);
      }

      for (const path of [
        '/workbench/package.json',
        '/workbench/pnpm-lock.yaml',
        '/workbench/src/symphony/console.js',
        '/workbench/docs/plans/v15-task1-api-fixtures-evidence-2026-05-27.md',
        `/workbench/assets/${assetName}/nested`
      ]) {
        const response = await fetch(`${baseUrl}${path}`);
        const body = await response.text();

        assert.equal(response.status, 404);
        assert.doesNotMatch(body, /multi-coding-agent-symphony|createSymphonyConsoleServer|Task 1/u);
      }
    } finally {
      await closeServer(server);
      await rm(root, { recursive: true, force: true });
    }
  });
});

const originalSsrLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');

function renderWorkbenchShellAt(WorkbenchShell, pathname, viewState) {
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: new URL(`http://127.0.0.1${pathname}`)
  });

  return renderToStaticMarkup(React.createElement(WorkbenchShell, {
    viewState,
    onRefreshWorkbenchContracts: () => undefined
  }));
}

function restoreSsrLocation() {
  if (originalSsrLocation) {
    Object.defineProperty(globalThis, 'location', originalSsrLocation);
    return;
  }

  delete globalThis.location;
}

function createWorkbenchRenderViewState() {
  return {
    phase: 'ready',
    model: createWorkbenchRenderModel()
  };
}

function createWorkbenchRenderModel() {
  const results = Object.fromEntries(
    READONLY_API_ROUTES.map((route) => [route.id, unavailableRouteResult(route)])
  );

  results.guidedGoalHandoff = unavailableRouteResult(GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE);
  results.latestRunTimeline = unavailableRouteResult(RUN_TIMELINE_ROUTE_TEMPLATE);
  results.activeGoalProgress = unavailableRouteResult({
    ...GOAL_PROGRESS_ROUTE_TEMPLATE,
    id: 'activeGoalProgress',
    label: 'Active Goal Progress'
  });
  results.activeGoalEvents = unavailableRouteResult({
    ...GOAL_EVENTS_ROUTE_TEMPLATE,
    id: 'activeGoalEvents',
    label: 'Active Goal Events'
  });
  results.activeGoalOperations = unavailableRouteResult({
    ...GOAL_OPERATIONS_ROUTE_TEMPLATE,
    id: 'activeGoalOperations',
    label: 'Active Goal Operations'
  });
  results.goalReviewerPromptPack = unavailableRouteResult({
    ...GOAL_PROMPT_PACK_ROUTE_TEMPLATE,
    id: 'goalReviewerPromptPack',
    label: 'Goal Reviewer Prompt Pack'
  });
  results.safeArtifactPreviews = [];

  return projectWorkbenchContracts(results);
}

function createWorkbenchRenderModelWithSupervisor(supervisorPayload = createGoalSupervisorRenderPayload()) {
  const results = Object.fromEntries(
    READONLY_API_ROUTES.map((route) => [route.id, unavailableRouteResult(route)])
  );
  const supervisorRoute = READONLY_API_ROUTES.find((route) => route.id === 'goalSupervisor');

  results.goalSupervisor = readonlyRouteResult(supervisorRoute, supervisorPayload);
  results.guidedGoalHandoff = unavailableRouteResult(GUIDED_GOAL_HANDOFF_ROUTE_TEMPLATE);
  results.latestRunTimeline = unavailableRouteResult(RUN_TIMELINE_ROUTE_TEMPLATE);
  results.activeGoalProgress = unavailableRouteResult({
    ...GOAL_PROGRESS_ROUTE_TEMPLATE,
    id: 'activeGoalProgress',
    label: 'Active Goal Progress'
  });
  results.activeGoalEvents = unavailableRouteResult({
    ...GOAL_EVENTS_ROUTE_TEMPLATE,
    id: 'activeGoalEvents',
    label: 'Active Goal Events'
  });
  results.activeGoalOperations = unavailableRouteResult({
    ...GOAL_OPERATIONS_ROUTE_TEMPLATE,
    id: 'activeGoalOperations',
    label: 'Active Goal Operations'
  });
  results.goalReviewerPromptPack = unavailableRouteResult({
    ...GOAL_PROMPT_PACK_ROUTE_TEMPLATE,
    id: 'goalReviewerPromptPack',
    label: 'Goal Reviewer Prompt Pack'
  });
  results.safeArtifactPreviews = [];

  return projectWorkbenchContracts(results);
}

function createGoalSupervisorRenderPayloadVariant(id) {
  const base = createGoalSupervisorRenderPayload();

  if (id === 'release-ready') {
    return {
      ...base,
      goalSnapshot: {
        ...base.goalSnapshot,
        activeTask: 'release',
        activeRole: 'release-manager',
        completedCount: 4,
        totalTaskCount: 4,
        blockerCount: 0,
        releaseReadiness: 'ready-declared'
      },
      recommendedNextAction: {
        ...base.recommendedNextAction,
        actionId: 'copy-release-handoff',
        label: 'Prepare release handoff',
        reason: 'release-ready-declared',
        taskId: 'release',
        targetRole: 'release-manager',
        safeCommandPreview: 'Copy preview: release-ready status remains copy-only.',
        blockedFields: ['tag', 'publish', 'release closeout']
      },
      currentGate: {
        ...base.currentGate,
        status: 'authorized-by-read-model',
        blockingReason: null,
        evidenceRequirement: 'release evidence refs present',
        closeoutAuthorizationState: 'blocked-without-workbench-closeout'
      },
      commandBoundary: {
        ...base.commandBoundary,
        safeCommandPreview: 'Copy preview: release-ready status remains copy-only.'
      }
    };
  }

  if (id === 'active-lease') {
    return {
      ...base,
      goalSnapshot: {
        ...base.goalSnapshot,
        activeTask: 'task-2',
        blockerCount: 0
      },
      recommendedNextAction: {
        ...base.recommendedNextAction,
        actionId: 'wait',
        label: 'Wait for active thread',
        reason: 'active-tool-call-in-progress',
        taskId: 'task-2',
        waitPolicy: {
          staleThresholdMs: 600000,
          activeLeaseAgeMs: 45000
        }
      },
      activeLease: {
        ...base.activeLease,
        leaseId: 'lease-live-task-2',
        threadId: '019ea62d-live-task-2',
        taskId: 'task-2',
        status: 'healthy',
        ageMs: 45000
      },
      pendingResult: {
        ...base.pendingResult,
        status: 'unavailable',
        eventToRegister: null,
        evidenceRef: null,
        parserReason: null,
        missing: true
      }
    };
  }

  if (id === 'pending-result') {
    return base;
  }

  if (id === 'stale-transcript') {
    return {
      ...base,
      recommendedNextAction: {
        ...base.recommendedNextAction,
        actionId: 'recover-stale-context',
        label: 'Open handoff checkpoint',
        reason: 'lease-active-transcript-stale',
        mismatchList: ['lease active but transcript stale'],
        manualInterventionReason: 'recover-stale-context'
      },
      contextStatus: {
        ...base.contextStatus,
        transcriptAvailability: 'stale-summary',
        staleTranscriptState: {
          stale: true,
          reason: 'lease-active-transcript-stale'
        },
        contextUtilization: {
          ratio: 0.89
        },
        driftMarkers: ['lease active but transcript stale']
      }
    };
  }

  if (id === 'blocked-gate') {
    return {
      ...base,
      goalSnapshot: {
        ...base.goalSnapshot,
        releaseReadiness: 'blocked',
        blockerCount: 1
      },
      recommendedNextAction: {
        ...base.recommendedNextAction,
        actionId: 'block',
        label: 'Blocked by current gate',
        reason: 'missing main verification evidence ref',
        blockedFields: ['main-verification-evidence'],
        requiredConfirmationFields: ['evidenceRef'],
        mismatchList: ['main-verification-evidence'],
        manualInterventionReason: 'operator-needed-for-gate-evidence'
      },
      currentGate: {
        ...base.currentGate,
        status: 'blocked',
        evidenceRequirement: 'main-verification-evidence',
        blockingReason: 'missing main verification evidence ref'
      }
    };
  }

  if (id === 'empty-context') {
    return {
      ...base,
      contextStatus: {},
      pendingResult: null,
      goalTimeline: []
    };
  }

  return base;
}

function readonlyRouteResult(route, data) {
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

function createProjectLauncherRegistryPayload() {
  return {
    contractName: 'project-registry.v1',
    contractVersion: 1,
    generatedAt: '2026-06-11T00:00:00.000Z',
    readOnly: true,
    source: {
      kind: 'repo-local-metadata',
      scanScope: 'cwd-or-explicit-repo-path',
      stateDir: '.symphony',
      writes: false
    },
    projects: [
      {
        project_id: 'multi-coding-agent-symphony',
        project_name: 'Multi Coding Agent Symphony',
        repo_path: '/workspace/multi-coding-agent-symphony',
        default_branch: 'main',
        remote_url: 'git@github.com:Andy20010101/multi-coding-agent-symphony.git',
        last_goal_id: 'v48-project-launcher-recent-projects',
        last_run_id: 'run-v48-pr1',
        health_status: 'ok',
        last_opened_at: '2026-06-11T00:00:00.000Z',
        pinned: false
      }
    ],
    currentProjectId: 'multi-coding-agent-symphony',
    resolution: {
      status: 'resolved',
      strategy: 'cwd',
      inputPath: '/workspace/multi-coding-agent-symphony',
      repoPath: '/workspace/multi-coding-agent-symphony',
      stateDir: '.symphony',
      readOnly: true,
      blockers: []
    },
    boundaries: {
      readOnly: true,
      diskScanScope: 'cwd-or-explicit-repo-path-only',
      registryDatabaseWritesAvailable: false,
      actionExecutionAvailable: false,
      jobQueueAvailable: false,
      modelInvocationAvailable: false,
      gitWriteAvailable: false,
      releaseWriteAvailable: false,
      arbitraryCommandExecutionAvailable: false
    }
  };
}

function createProjectLauncherBindingPayload() {
  return {
    contractName: 'current-project-binding.v1',
    contractVersion: 1,
    generatedAt: '2026-06-11T00:01:00.000Z',
    state: 'bound',
    selectedProjectId: 'multi-coding-agent-symphony',
    selectedProjectName: 'Multi Coding Agent Symphony',
    repoPath: '/workspace/multi-coding-agent-symphony',
    defaultBranch: 'main',
    lastGoalId: 'v48-project-launcher-recent-projects',
    lastRunId: 'run-v48-pr1',
    healthStatus: 'ok',
    bindingSource: 'persisted app state',
    persisted: true,
    selectionUpdatedAt: '2026-06-11T00:01:00.000Z',
    fallbackReason: null,
    routeState: 'ready',
    readOnly: true,
    selectionControl: {
      state: 'available',
      endpointId: '/api/projects/current-binding/select',
      disabledReason: null
    },
    sourcePolicy: 'backend-known project id only; no frontend path input',
    boundaries: {
      selectionOnly: true,
      acceptsProjectIdOnly: true,
      arbitraryPathSubmissionAvailable: false,
      frontendFilesystemScanAvailable: false,
      frontendArbitraryPathReadAvailable: false,
      commandExecutionAvailable: false,
      providerLaunchAvailable: false,
      goalMutationAvailable: false,
      childDispatchAvailable: false,
      jobExecutionAvailable: false,
      gitWriteAvailable: false,
      releaseWriteAvailable: false,
      rawTranscriptReadAvailable: false
    }
  };
}

function createGoalSupervisorRenderPayload() {
  return {
    contractName: 'goal-supervisor-app-read-model.v1',
    contractVersion: 1,
    readOnly: true,
    willMutate: false,
    generatedAt: '2026-06-10T12:04:00.000Z',
    goalSnapshot: {
      goalId: 'v44-4-live-supervisor',
      title: 'Live supervisor route projection',
      totalTaskCount: 4,
      completedCount: 2,
      activeTask: 'task-3',
      activeRole: 'worker',
      releaseReadiness: 'not-ready',
      blockerCount: 1,
      sourceContracts: ['goal-supervisor-app-read-model.v1', 'goal-progress-ledger.v1'],
      generatedAt: '2026-06-10T12:04:00.000Z'
    },
    recommendedNextAction: {
      actionId: 'checkpoint',
      label: 'Checkpoint pending result',
      reason: 'result-awaits-registration',
      taskId: 'task-3',
      targetRole: 'worker',
      safeCommandPreview: 'Copy preview: summarize pending result only.',
      checkpointRef: 'artifact:v44-4:pending-result',
      waitPolicy: {
        staleThresholdMs: 600000,
        activeLeaseAgeMs: 120000
      },
      blockedFields: ['event-log-write']
    },
    activeLease: {
      leaseId: 'lease-live-task-3',
      threadId: '019ea62d-live-task-3',
      taskId: 'task-3',
      role: 'worker',
      phase: 'implement',
      status: 'healthy',
      startedAt: '2026-06-10T11:50:00.000Z',
      updatedAt: '2026-06-10T12:02:00.000Z',
      ageMs: 120000,
      duplicateDispatchGuard: {
        blocked: true,
        reason: 'active lease still healthy'
      }
    },
    contextStatus: {
      sessionSourceSummaries: [{
        provider: 'codex',
        status: 'available',
        threadId: '019ea62d-live-task-3',
        latestTurnAt: '2026-06-10T12:02:00.000Z'
      }],
      transcriptAvailability: 'readable-summary',
      exchangeCount: 18,
      latestToolCall: {
        name: 'node --test',
        status: 'completed'
      },
      latestTurnState: {
        status: 'completed'
      },
      tokenUsage: {
        usedTokens: 42000,
        limitTokens: 200000
      },
      contextUtilization: {
        ratio: 0.21
      },
      staleTranscriptState: {
        stale: false,
        reason: null
      },
      missingTranscriptState: {
        missing: false,
        reason: null
      },
      resultBlockEvidence: {
        status: 'present',
        present: true,
        evidenceRef: 'artifact:v44-4:pending-result'
      },
      driftMarkers: []
    },
    pendingResult: {
      contractName: 'pendingResult.v1',
      contractVersion: 1,
      goalId: 'v44-4-live-supervisor',
      taskId: 'task-3',
      workerRole: 'worker',
      source: 'result-intake',
      status: 'pending',
      state: 'available',
      escrowRef: 'result-evidence-escrow:v44-4-live-supervisor:task-3:escrow_live_task_3',
      sanitizedSummary: {
        status: 'completed',
        summary: 'Worker evidence recorded for task-3.',
        changedFiles: ['frontend/workbench/src/v46SupervisorWorkbench.jsx'],
        validationCommands: ['node --test tests/workbench-shell.test.js'],
        evidenceRefs: [{
          kind: 'artifact-ref',
          ref: 'artifact:v44-4:pending-result',
          label: 'pending result registration'
        }],
        risks: [],
        blockers: []
      },
      evidenceRefs: [{
        kind: 'artifact-ref',
        ref: 'artifact:v44-4:pending-result',
        label: 'pending result registration'
      }],
      eventCandidate: {
        eventType: 'worker.evidence-recorded',
        taskId: 'task-3',
        workerRole: 'worker',
        command: 'update',
        commandName: 'symphony goal update',
        requiresEvidence: true,
        evidenceRefs: [{
          kind: 'artifact-ref',
          ref: 'artifact:v44-4:pending-result',
          label: 'pending result registration'
        }],
        blocker: null,
        willAppendGoalEvent: false,
        state: 'eligible',
        reason: 'eligible-result-event'
      },
      eventToRegister: 'worker.evidence-recorded',
      evidenceRef: 'artifact:v44-4:pending-result',
      parserReason: 'valid-result-awaits-registration',
      stale: false,
      missing: false,
      blockedReasons: [],
      sourceContracts: [{
        contractName: 'resultEvidenceEscrow.v1',
        contractVersion: 1,
        escrowRef: 'result-evidence-escrow:v44-4-live-supervisor:task-3:escrow_live_task_3',
        previewPlanHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      }],
      boundaries: {
        providerExecutionAvailable: false,
        childDispatchAvailable: false,
        directGoalEventAppendAvailable: false,
        untrustedTranscriptProjectionAvailable: false,
        frontendLocalFileReadAvailable: false,
        reviewerMutationAvailable: false,
        mainVerificationMutationAvailable: false,
        releaseGateMutationAvailable: false,
        gitMutationAvailable: false,
        githubReleaseAutomationAvailable: false,
        projectionAppendsGoalEvent: false
      }
    },
    currentGate: {
      gateId: 'release.ready',
      requiredCommandFamily: 'release-gate',
      status: 'blocked',
      evidenceRequirement: 'main verification evidence',
      blockingReason: 'missing main verification evidence ref',
      closeoutAuthorizationState: 'blocked-without-operator-authorization'
    },
    ownership: {
      orchestrationOwner: 'local-goal-supervisor-daemon',
      deliveryBoundary: 'pull-request',
      activePr: '#44',
      branch: 'codex/v44-4-pr2-supervisor-route-api-client',
      rollbackBoundary: 'revert PR-2',
      daemonState: 'external-orchestration-owner',
      controllerInterventionReason: null
    },
    commandBoundary: {
      state: 'disabled',
      executionAvailable: false,
      copyOnly: true,
      allowedCommandFamilies: [],
      blockedCommandFamilies: ['child-dispatch', 'event-log-write'],
      safeCommandPreview: null,
      confirmationFields: []
    },
    sessionSourceInventory: {
      contractName: 'sessionSourceInventory.v1',
      contractVersion: 1,
      generatedAt: '2026-06-10T12:04:00.000Z',
      readOnly: true,
      willMutate: false,
      state: 'degraded',
      summary: {
        providerCount: 2,
        availableProviderCount: 1,
        missingProviderCount: 0,
        degradedProviderCount: 1,
        failedProviderCount: 0,
        state: 'degraded'
      },
      providers: [{
        provider: 'codex',
        state: 'available',
        readState: 'readable',
        readableFileCount: 2,
        unreadableFileCount: 0,
        latestSessionRef: 'codex:live-task-3',
        degradedReasons: []
      }, {
        provider: 'claude',
        state: 'unreadable',
        readState: 'unreadable',
        readableFileCount: 0,
        unreadableFileCount: 1,
        latestSessionRef: 'claude:live-task-3',
        degradedReasons: ['all-candidate-files-unreadable']
      }],
      degradedReasons: ['claude:all-candidate-files-unreadable']
    },
    contextAdvisory: {
      contractName: 'contextAdvisory.v1',
      contractVersion: 1,
      generatedAt: '2026-06-10T12:04:00.000Z',
      readOnly: true,
      willMutate: false,
      transcriptAvailability: 'readable',
      exchangeCount: 18,
      latestToolCall: 'name: node --test, status: completed',
      latestTurnState: 'status: completed, role: assistant',
      tokenUsage: 'status: available, totalTokens: 42000',
      contextUtilization: '21%',
      contextBand: 'low',
      resultBlockEvidence: 'present',
      staleTranscriptState: 'stale: false',
      missingTranscriptState: 'missing: false',
      degradedReasons: ['claude:all-candidate-files-unreadable'],
      blockedFields: [],
      policyInputs: {
        threadId: '019ea62d-live-task-3',
        transcriptAvailability: 'readable',
        sessionSourceSummaries: ['codex: readable: 019ea62d-live-task-3'],
        inventorySourceSummaries: ['codex: available: readable', 'claude: unreadable: unreadable']
      }
    },
    threadContinuationDecision: {
      contractName: 'threadContinuationDecision.v1',
      contractVersion: 1,
      generatedAt: '2026-06-10T12:04:00.000Z',
      readOnly: true,
      willMutate: false,
      state: 'checkpoint',
      decision: 'checkpoint',
      reason: 'result-awaits-registration',
      confidence: 'known',
      targetRole: 'worker',
      taskId: 'task-3',
      threadId: '019ea62d-live-task-3',
      checkpointRef: 'artifact:v44-4:pending-result',
      waitPolicy: null,
      blockedFields: [],
      mismatchList: [],
      requiredEvidence: ['pending-result-registration'],
      sourceContracts: ['contextAdvisory.v1', 'sessionSourceInventory.v1', 'goal-supervisor-app-read-model.v1'],
      commandBoundary: {
        state: 'disabled',
        executionAvailable: false,
        copyOnly: true,
        blockedFamilies: ['child-dispatch', 'event-log-write']
      }
    },
    supervisorEventRegistrationEligibility: createSupervisorEventEligibilityRenderPayload(),
    goalTimeline: [{
      eventId: 'evt-live-task-3',
      taskId: 'task-3',
      role: 'worker',
      status: 'pending',
      evidenceRef: 'artifact:v44-4:pending-result',
      hashChainState: 'linked',
      occurredAt: '2026-06-10T12:03:00.000Z'
    }]
  };
}

function createSupervisorEventEligibilityRenderPayload() {
  return {
    contractName: 'supervisorEventRegistrationEligibility.v1',
    contractVersion: 1,
    generatedAt: '2026-06-10T12:04:00.000Z',
    readOnly: true,
    willMutate: false,
    goalId: 'v44-4-live-supervisor',
    taskId: 'task-3',
    threadId: '019ea62d-live-task-3',
    state: 'eligible',
    reason: 'eligible-goal-update-event',
    recommendedEvent: {
      eventType: 'worker.evidence-recorded',
      command: 'update',
      commandName: 'symphony goal update',
      actorRole: 'worker',
      actorId: 'local-goal-supervisor-worker',
      taskId: 'task-3',
      evidenceRefs: ['artifact:v44-4:pending-result'],
      statement: 'Worker evidence recorded for task-3.'
    },
    requiredInputs: ['goalId', 'taskId', 'command', 'event', 'actor', 'evidenceRef'],
    missingInputs: [],
    previewRequest: {
      method: 'GET',
      route: '/api/goals/v44-4-live-supervisor/event-plan-preview',
      query: {
        command: 'update',
        task: 'task-3',
        event: 'worker.evidence-recorded',
        actor: 'local-goal-supervisor-worker',
        evidenceRef: ['artifact:v44-4:pending-result'],
        statement: 'Worker evidence recorded for task-3.'
      }
    },
    confirmRequestShape: {
      method: 'POST',
      route: '/api/goals/v44-4-live-supervisor/event-plan-confirm',
      contentType: 'application/json',
      requiredBodyFields: ['command', 'planHash', 'task', 'event', 'actor'],
      optionalBodyFields: ['evidenceRef', 'statement', 'blockerId', 'blockerReason', 'blockerSeverity'],
      confirmUsesPlanHash: true
    },
    previewResult: createSupervisorGoalUpdatePlanPreviewPayload()
  };
}

function createSupervisorGoalUpdatePlanPreviewPayload() {
  return {
    contractName: 'goal-update-plan.v1',
    contractVersion: 1,
    planId: 'plan_v50_task3_event_preview',
    planHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    goalId: 'v44-4-live-supervisor',
    mode: 'dry-run',
    command: {
      name: 'symphony goal update',
      intent: 'record-worker-task-event',
      confirmRequired: true
    },
    actor: {
      role: 'worker',
      id: 'local-goal-supervisor-worker'
    },
    proposedEvents: [{
      eventType: 'worker.evidence-recorded',
      taskId: 'task-3',
      phase: 'implement',
      requiresEvidence: true,
      evidenceRefs: [{
        kind: 'artifact-ref',
        ref: 'artifact:v44-4:pending-result',
        label: 'pending result registration'
      }],
      statement: 'Worker evidence recorded for task-3.',
      blocker: {
        blockerId: 'blocker-v50-preview',
        reason: 'preview-only blocker field',
        severity: 'medium'
      }
    }],
    eventSummary: {
      eventType: 'worker.evidence-recorded',
      taskId: 'task-3',
      evidenceRefs: [{
        kind: 'artifact-ref',
        ref: 'artifact:v44-4:pending-result',
        label: 'pending result registration'
      }]
    },
    validation: {
      status: 'ok',
      errors: [],
      warnings: []
    },
    wouldAppend: {
      appendOnly: true,
      eventCount: 1,
      target: 'managed-goal-event-journal',
      writesInDryRun: false
    },
    operationRun: {
      operationId: 'op_v50_task3_event_preview',
      status: 'planned'
    },
    confirm: {
      available: true,
      requiredFlags: ['--confirm', '--plan-hash'],
      copyOnlyCommand: 'symphony goal update --goal v44-4-live-supervisor --task task-3 --event worker.evidence-recorded --actor local-goal-supervisor-worker --evidence-ref artifact:v44-4:pending-result --confirm --plan-hash sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa --json'
    }
  };
}

function createResultIntakePreviewRenderPayload(request) {
  return {
    contractName: 'resultIntakePreview.v1',
    contractVersion: 1,
    generatedAt: '2026-06-12T09:01:00.000Z',
    readOnly: true,
    willMutate: false,
    goalId: request.goalId,
    taskId: request.taskId,
    workerRole: request.workerRole,
    source: request.source,
    sanitizedSummary: {
      status: 'completed',
      summary: 'Added controlled Workbench result intake.',
      changedFiles: ['frontend/workbench/src/v46SupervisorWorkbench.jsx'],
      validationCommands: ['pnpm workbench:build'],
      risks: [],
      blockers: []
    },
    evidenceRefs: request.evidenceRefs,
    blockedFields: [],
    eventCandidate: {
      eventType: 'worker.evidence-recorded',
      taskId: request.taskId,
      workerRole: request.workerRole,
      command: 'update',
      commandName: 'symphony goal update',
      requiresEvidence: true,
      evidenceRefs: request.evidenceRefs,
      blocker: null,
      willAppendGoalEvent: false,
      state: 'eligible',
      reason: 'eligible-result-event'
    },
    previewWriteTarget: {
      kind: 'result-evidence-escrow',
      storage: 'pending-result-escrow',
      writesOnPreview: false,
      writesOnConfirm: true,
      writesGoalEventLog: false
    },
    planHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    expiresAt: '2026-06-12T09:16:00.000Z',
    confirmRequestShape: {
      method: 'POST',
      route: `/api/goals/${request.goalId}/result-intake-confirm`,
      contentType: 'application/json',
      requiredBodyFields: ['goalId', 'taskId', 'planHash'],
      optionalBodyFields: ['previewId', 'escrowId'],
      confirmUsesPlanHash: true
    },
    boundaries: {
      providerExecutionAvailable: false,
      childDispatchAvailable: false,
      directGoalEventAppendAvailable: false,
      untrustedTranscriptProjectionAvailable: false,
      frontendLocalFileReadAvailable: false,
      reviewerMutationAvailable: false,
      mainVerificationMutationAvailable: false,
      releaseGateMutationAvailable: false,
      gitMutationAvailable: false,
      githubReleaseAutomationAvailable: false,
      readOnly: true,
      willMutate: false,
      previewWrites: false,
      confirmWritesResultEscrow: true
    }
  };
}

function createResultIntakeConfirmationRenderPayload(preview) {
  return {
    contractName: 'result-intake-confirmation.v1',
    contractVersion: 1,
    goalId: preview.goalId,
    taskId: preview.taskId,
    mode: 'confirm',
    status: 'confirmed',
    written: true,
    planHash: preview.planHash,
    refs: {
      escrowRef: 'result-evidence-escrow:v44-4-live-supervisor:task-3:escrow_live_task_3',
      pendingResultRef: 'pending-result:v44-4-live-supervisor:task-3'
    },
    refreshed: {
      supervisor: {
        method: 'GET',
        route: '/api/goals/v44-4-live-supervisor/supervisor',
        pendingResultProjectionAvailable: true
      }
    },
    safety: {
      writesResultEvidenceEscrow: true,
      writesPendingResult: true,
      writesGoalEventLog: false,
      writesOperationRegistry: false,
      providerExecutionAvailable: false,
      childDispatchAvailable: false,
      directGoalEventAppendAvailable: false
    }
  };
}

function createSupervisorGoalEventConfirmationPayload() {
  return {
    contractName: 'goal-event-confirmation.v1',
    contractVersion: 1,
    mode: 'confirm',
    status: 'appended',
    written: true,
    appendOnly: true,
    planHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    command: 'update',
    operationRun: {
      operationId: 'op_v50_task3_event_confirm',
      status: 'confirmed'
    },
    eventSummary: {
      eventId: 'evt-v50-task-3-confirmed',
      sequence: 7,
      eventType: 'worker.evidence-recorded',
      taskId: 'task-3',
      actorRole: 'worker',
      actorId: 'local-goal-supervisor-worker',
      eventHash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    },
    refreshed: {
      progress: { contractName: 'goal-progress-ledger.v1' },
      events: { contractName: 'goal-event-log.v1' },
      nextAction: { contractName: 'goal-next-action.v1' },
      closeout: { contractName: 'goal-closeout-report.v1' }
    },
    confirmEndpoint: {
      constrainedCommands: ['update', 'review', 'gate'],
      confirmUsesPlanHash: true
    },
    safety: {
      confirmWritesAppendOnly: true,
      genericShellRunner: false
    }
  };
}

function createWorkbenchRenderRouteContext() {
  const evidenceRef = 'docs/plans/v28-task-2-worker-evidence-2026-05-29.md';

  return {
    state: 'available',
    goalId: availableTextState('v28-workbench-v1-release'),
    taskId: availableTextState('task-2'),
    activeRole: availableTextState('worker'),
    activePhase: availableTextState('implement'),
    operationId: availableTextState('op_v28_task2'),
    runId: availableTextState('run-v28-task2'),
    evidenceRefs: {
      state: 'available',
      count: availableTextState(1),
      items: [{
        ref: availableTextState(evidenceRef),
        kind: availableTextState('repo-doc'),
        label: availableTextState('worker evidence'),
        source: availableTextState('goal-event-log.v1'),
        taskId: availableTextState('task-2')
      }]
    },
    sourcePolicy: availableTextState('goal-runbook.v1 + goal-next-action.v1 + goal-operation-runs.v1 + goal-event-log.v1'),
    note: 'Route context carries identifiers across Workbench modules.'
  };
}

function availableTextState(value) {
  return {
    state: 'available',
    text: String(value),
    value
  };
}

function unavailableRouteResult(route) {
  return {
    ok: false,
    route: route.path,
    method: route.method,
    routeDescriptor: route,
    httpStatus: 503,
    message: 'stub route unavailable'
  };
}

async function startConsoleServer() {
  const root = await mkdtemp(join(tmpdir(), 'symphony-workbench-static-'));
  const server = createSymphonyConsoleServer({
    stateDir: join(root, '.symphony'),
    cwd: root,
    env: {}
  });
  const baseUrl = await listenOnRandomPort(server);

  return {
    root,
    server,
    baseUrl
  };
}

async function listenOnRandomPort(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();

  assert.equal(typeof address, 'object');
  assert.notEqual(address, null);

  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
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
