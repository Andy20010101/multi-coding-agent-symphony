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
    assert.match(app, /Capabilities Contract/u);
    assert.match(app, /Diagnostics Contract/u);
    assert.match(app, /phase \/ copy-only commands/u);
    assert.match(app, /tasks \/ evidence \/ review gate/u);
    assert.match(app, /刷新页面后会重新读取只读 API/u);
    assert.doesNotMatch(app, /\bfetch\s*\(/u);
    assert.doesNotMatch(app, /rawRunState/u);
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
      const activeGoalPanelIndex = homeHtml.indexOf('id="active-goal-runbook-panel"');
      const legacyPanelIndex = homeHtml.indexOf('id="summary-panel-title"');

      assert.notEqual(stateHeaderIndex, -1);
      assert.notEqual(navigationIndex, -1);
      assert.notEqual(activeGoalPanelIndex, -1);
      assert.notEqual(legacyPanelIndex, -1);
      assert.equal(stateHeaderIndex < navigationIndex, true);
      assert.equal(navigationIndex < activeGoalPanelIndex, true);
      assert.equal(activeGoalPanelIndex < legacyPanelIndex, true);
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
    assert.doesNotMatch(app, /child_process|exec\(|spawn\(|terminal emulator|generic shell runner|WebSocket|EventSource/u);
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
    assert.match(panelBody, /ReleaseVerificationChecklist/u);
    assert.match(panelBody, /ReleaseReadyGateRegistration/u);
    assert.match(panelBody, /ReleaseEvidenceDraft/u);
    assert.match(panelBody, /TagEvidencePrompt/u);
    assert.match(panelBody, /NextVersionHandoffDraft/u);
    assert.match(panelBody, /copyOnlyTagCommand/u);
    assert.match(panelBody, /tag command result fields/u);
    assert.match(panelBody, /createsManagedGoal/u);
    assert.match(panelBody, /entersNextVersion/u);
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
      '/api/adoptions/<adoption-id>/inspect',
      '/api/capabilities',
      '/api/diagnostics',
      '/api/goals',
      '/api/goals/${goalId}/verification-run-confirm',
      '/api/goals/<goal-id>/adoption-confirm',
      '/api/goals/<goal-id>/adoption-plan-freeze',
      '/api/goals/<goal-id>/closeout',
      '/api/goals/<goal-id>/event-plan-confirm',
      '/api/goals/<goal-id>/event-plan-preview',
      '/api/goals/<goal-id>/events',
      '/api/goals/<goal-id>/implementation-plan-preview',
      '/api/goals/<goal-id>/next',
      '/api/goals/<goal-id>/operations',
      '/api/goals/<goal-id>/progress',
      '/api/goals/<goal-id>/prompt',
      '/api/goals/<goal-id>/release-baseline',
      '/api/goals/<goal-id>/runbook',
      '/api/goals/latest/closeout',
      '/api/goals/latest/events',
      '/api/goals/latest/next',
      '/api/goals/latest/operations',
      '/api/goals/latest/progress',
      '/api/goals/latest/prompt',
      '/api/goals/latest/release-baseline',
      '/api/goals/latest/runbook',
      '/api/handoff',
      '/api/handoff/<ref>',
      '/api/readiness',
      '/api/runs',
      '/api/runs/<run-id>/artifacts/<artifact-kind>/preview',
      '/api/runs/<run-id>/timeline',
      '/api/runs/latest',
      '/api/summary'
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
