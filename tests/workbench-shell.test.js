import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';

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

    assert.doesNotMatch(source, /role\s*=\s*["']button["']|<a\s|href\s*=|<form\b|<textarea\b/i);
    assert.match(source, /Preview dry-run plan/u);
    assert.match(source, /Confirm event append/u);
    assert.match(source, /fetchGoalEventPlanPreview/u);
    assert.match(source, /confirmGoalEventPlan/u);
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
      'NextActionCard',
      'PromptPreviewDrawer',
      'MainVerificationReadinessPanel',
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
    assert.match(app, /v20 primary workflow/u);
    assert.match(app, /Next Action Card/u);
    assert.match(app, /Main Verification Readiness/u);
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

  it('keeps the next action card and prompt drawer display-only', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const source = [
      app.slice(app.indexOf('function NextActionCard'), app.indexOf('function PromptPreviewDrawer')),
      app.slice(app.indexOf('function PromptPreviewDrawer'), app.indexOf('function CloseoutGapsPanel'))
    ].join('\n');

    assert.match(contracts, /goal-next-action\.v1/u);
    assert.match(source, /afterCompletion\.registrationCommand/u);
    assert.match(source, /Prompt Preview Drawer/u);
    assert.match(source, /copy-only prompt drawer/u);
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

  it('wires successful goal event confirms to refresh Workbench contracts through the next action card', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const nextActionInvocation = app.match(/<NextActionCard[\s\S]*?\/>/u)?.[0] ?? '';
    const viewModelInvocation = app.match(/<ActiveGoalViewModelPanel[\s\S]*?\/>/u)?.[0] ?? '';
    const nextActionSignature = app.match(/function NextActionCard\([^)]*\)/u)?.[0] ?? '';
    const viewModelSignature = app.match(/function ActiveGoalViewModelPanel\([^)]*\)/u)?.[0] ?? '';
    const nextActionBody = app.slice(app.indexOf('function NextActionCard'), app.indexOf('function PromptPreviewDrawer'));

    assert.match(app, /async function refreshWorkbenchContracts/u);
    assert.match(nextActionInvocation, /onGoalEventConfirmed=\{refreshWorkbenchContracts\}/u);
    assert.doesNotMatch(viewModelInvocation, /onGoalEventConfirmed/u);
    assert.match(nextActionSignature, /onGoalEventConfirmed/u);
    assert.doesNotMatch(viewModelSignature, /onGoalEventConfirmed/u);
    assert.match(nextActionBody, /<GoalEventFormModelView[\s\S]*onGoalEventConfirmed=\{onGoalEventConfirmed\}/u);
  });

  it('wires the v24 main verification readiness panel as copy-only display', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');
    const contracts = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');
    const panelBody = app.slice(
      app.indexOf('function MainVerificationReadinessPanel'),
      app.indexOf('function ActiveGoalRunbookPanel')
    );

    assert.match(app, /<MainVerificationReadinessPanel readiness=\{model\.activeGoal\.mainVerificationReadiness\}/u);
    assert.match(panelBody, /reviewer\.approved/u);
    assert.match(panelBody, /branch \/ main state/u);
    assert.match(panelBody, /ff-only merge guidance/u);
    assert.match(panelBody, /required verification commands/u);
    assert.match(panelBody, /evidence path/u);
    assert.match(contracts, /projectMainVerificationReadiness/u);
    assert.match(contracts, /git merge --ff-only/u);
    assert.match(contracts, /main-verification-evidence-2026-05-29/u);
    assert.doesNotMatch(panelBody, /fetchGoalEventPlanPreview|confirmGoalEventPlan|window\.open|navigator\.clipboard/u);
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
    assert.doesNotMatch(shortcutBody, /symphony goal review|symphony goal gate|release\.ready|reviewer\.approved|main\.verification-passed/u);
    assert.doesNotMatch(shortcutBody, /child_process|exec\(|spawn\(|shell runner|window\.open|navigator\.clipboard/u);
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
      '/api/capabilities',
      '/api/diagnostics',
      '/api/goals',
      '/api/goals/<goal-id>/closeout',
      '/api/goals/<goal-id>/event-plan-confirm',
      '/api/goals/<goal-id>/event-plan-preview',
      '/api/goals/<goal-id>/events',
      '/api/goals/<goal-id>/next',
      '/api/goals/<goal-id>/progress',
      '/api/goals/<goal-id>/prompt',
      '/api/goals/<goal-id>/runbook',
      '/api/goals/latest/closeout',
      '/api/goals/latest/events',
      '/api/goals/latest/next',
      '/api/goals/latest/progress',
      '/api/goals/latest/prompt',
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
