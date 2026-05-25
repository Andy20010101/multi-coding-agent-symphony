import { createServer } from 'node:http';
import { open, readdir, stat } from 'node:fs/promises';

import { NodeProcessRunner } from '../process-runner.js';
import { redactSecrets } from '../redaction.js';
import { REAL_CLI_DOCTOR_ADAPTERS } from '../real-cli-doctor.js';
import {
  listAdoptionJournals,
  listAdoptionPlans,
  listRunStates,
  readLatestContext,
  readLatestRun,
  readRunState
} from './state.js';
import {
  PRODUCT_JSON_CONTRACT,
  compactRunState
} from './contract.js';
import {
  buildAdoptionInspectionSummary,
  buildConsoleAdoptionInspectContract
} from './adoption-inspect.js';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8765;
const MAX_ARTIFACT_PREVIEW_BYTES = 200 * 1024;
const DIRECTORY_PREVIEW_ENTRY_LIMIT = 100;
const DEFAULT_READINESS_TIMEOUT_MS = 3000;
const RUN_FILTERS = Object.freeze(['all', 'passed', 'failed', 'dry-run', 'real', 'scan', 'verify', 'adoption']);
const COMMAND_GROUP_ORDER = Object.freeze(['Inspect', 'Adoptions', 'Verify', 'Artifacts', 'Real-agent gates']);
const RISK_SEVERITY_RANK = Object.freeze({ high: 3, medium: 2, low: 1 });

export async function buildConsoleSnapshot({
  stateDir = '.symphony',
  generatedAt = new Date().toISOString()
} = {}) {
  const [latestContext, latestRun, runs, adoptionPlans, adoptionJournals] = await Promise.all([
    readLatestContext({ stateDir }),
    readLatestRun({ stateDir }),
    listRunStates({ stateDir }),
    listAdoptionPlans({ stateDir }),
    listAdoptionJournals({ stateDir })
  ]);

  const compactRuns = await decorateConsoleRuns(runs.map((run) => compactRunState(run)));
  const compactLatestRun = latestRun === null
    ? null
    : compactRuns.find((run) => run.runId === latestRun.runId)
      ?? await decorateConsoleRunWithDiagnostics(compactRunState(latestRun));
  const recommendedCommands = buildSnapshotRecommendedCommands({
    latestRun: compactLatestRun
  });
  const compactPlans = compactAdoptionPlans(adoptionPlans);
  const compactJournals = compactAdoptionJournals({
    journals: adoptionJournals,
    stateDir
  });
  const runStats = buildRunStats(compactRuns);
  const riskSummary = buildRunRiskSummary(compactRuns);
  const adoptionSummary = buildAdoptionSummary({
    runs: compactRuns,
    adoptionPlans: compactPlans,
    adoptionJournals: compactJournals
  });
  const overview = buildConsoleOverview({
    latestRun: compactLatestRun,
    runStats,
    riskSummary,
    adoptionSummary,
    nextAction: latestRun?.nextAction ?? 'symphony scan'
  });

  return {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-snapshot',
    contract: {
      ...PRODUCT_JSON_CONTRACT,
      name: 'symphony.console-snapshot'
    },
    generatedAt,
    stateDir,
    status: latestRun === null ? 'no-runs' : 'ready',
    overview,
    adoptionSummary,
    latestContext: compactContext(latestContext),
    latestRun: compactLatestRun,
    runs: compactRuns,
    adoptionPlans: compactPlans,
    adoptionJournals: compactJournals,
    runStats,
    riskSummary,
    recommendedCommands,
    commandGroups: groupCommands(recommendedCommands),
    action: {
      next: latestRun?.nextAction ?? 'symphony scan'
    }
  };
}

export async function buildConsoleReadiness({
  stateDir = '.symphony',
  cwd = process.cwd(),
  env = process.env,
  runner = new NodeProcessRunner(),
  generatedAt = new Date().toISOString(),
  timeoutMs = DEFAULT_READINESS_TIMEOUT_MS
} = {}) {
  const [packageManager, git, github, realCli] = await Promise.all([
    buildPackageManagerReadiness({ runner, cwd, env, timeoutMs }),
    buildGitReadiness({ runner, cwd, timeoutMs }),
    buildGithubReadiness({ runner, cwd, env, timeoutMs }),
    buildRealCliReadiness({ runner, cwd, env, timeoutMs })
  ]);
  const node = {
    status: 'available',
    version: process.version,
    executable: process.execPath
  };
  const status = node.status === 'available'
    && packageManager.status === 'available'
    && git.status === 'available'
    ? 'ready'
    : 'attention';
  const recommendedCommands = buildReadinessRecommendedCommands({
    packageManager,
    git,
    github,
    realCli
  });

  return {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-readiness',
    contract: {
      ...PRODUCT_JSON_CONTRACT,
      name: 'symphony.console-readiness'
    },
    generatedAt,
    stateDir,
    cwd,
    status,
    readOnly: true,
    modelInvocation: false,
    tools: {
      node,
      packageManager,
      git,
      github,
      realCli
    },
    checks: buildReadinessChecks({
      node,
      packageManager,
      git,
      github,
      realCli
    }),
    riskSummary: buildReadinessRiskSummary({
      packageManager,
      git,
      github,
      realCli
    }),
    recommendedCommands,
    commandGroups: groupCommands(recommendedCommands)
  };
}

export async function buildConsoleDiagnosticsReport({
  stateDir = '.symphony',
  cwd = process.cwd(),
  env = process.env,
  runner = new NodeProcessRunner(),
  generatedAt = new Date().toISOString(),
  timeoutMs = DEFAULT_READINESS_TIMEOUT_MS
} = {}) {
  const [snapshot, readiness] = await Promise.all([
    buildConsoleSnapshot({
      stateDir,
      generatedAt
    }),
    buildConsoleReadiness({
      stateDir,
      cwd,
      env,
      runner,
      generatedAt,
      timeoutMs
    })
  ]);
  const risks = combineRiskSummaries([
    snapshot.riskSummary,
    readiness.riskSummary,
    buildAdoptionDiagnosticsRiskSummary({
      snapshot,
      readiness
    })
  ]);
  const commands = buildDiagnosticsCommands({
    snapshot,
    readiness
  });
  const status = diagnosticsStatus({
    snapshot,
    readiness,
    risks
  });
  const adoptionSummary = buildAdoptionSummary({
    runs: snapshot.runs,
    adoptionPlans: snapshot.adoptionPlans,
    adoptionJournals: snapshot.adoptionJournals,
    readiness,
    risks
  });
  const enrichedSnapshot = {
    ...snapshot,
    adoptionSummary,
    overview: buildConsoleOverview({
      latestRun: snapshot.latestRun,
      runStats: snapshot.runStats,
      riskSummary: risks,
      adoptionSummary,
      readiness,
      nextAction: snapshot.action?.next ?? 'symphony scan'
    })
  };
  const report = {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.diagnostics-report',
    contract: {
      ...PRODUCT_JSON_CONTRACT,
      name: 'symphony.diagnostics-report'
    },
    generatedAt,
    stateDir,
    cwd,
    status,
    snapshot: enrichedSnapshot,
    readiness,
    risks,
    commands,
    action: buildDiagnosticsAction({
      status,
      snapshot: enrichedSnapshot,
      risks,
      commands
    })
  };

  return redactSecrets(report);
}

export function renderDiagnosticsText(report) {
  const safeReport = redactSecrets(report);
  const snapshot = safeReport.snapshot ?? {};
  const latestRun = snapshot.latestRun ?? null;
  const runStats = snapshot.runStats ?? {};
  const artifactStats = runStats.artifacts ?? {};
  const readiness = safeReport.readiness ?? {};
  const risks = safeReport.risks ?? emptyRiskSummary();
  const lines = [
    `Status: ${formatTextValue(safeReport.status)}`,
    `Generated: ${formatTextValue(safeReport.generatedAt)}`,
    `State dir: ${formatTextValue(safeReport.stateDir)}`,
    `Runs: ${formatTextValue(runStats.total ?? snapshot.runs?.length ?? 0)}`,
    `Latest run: ${latestRun === null ? 'none' : formatTextValue(latestRun.runId)}`,
    `Artifact health: ${formatTextValue(artifactStats.status ?? latestRun?.artifactStatus?.status ?? 'unknown')}`,
    `Readiness: ${formatTextValue(readiness.status ?? 'unknown')}`,
    `Risks: ${risks.total ?? 0} total / ${risks.counts?.high ?? 0} high / ${risks.counts?.medium ?? 0} medium / ${risks.counts?.low ?? 0} low`
  ];

  if (latestRun !== null) {
    lines.push(`Latest command: ${formatTextValue(latestRun.command ?? latestRun.semanticCommand ?? 'unknown')}`);
    lines.push(`Latest verifier: ${formatTextValue(latestRun.verifierStatus ?? 'unknown')}`);
  }

  const recentRuns = Array.isArray(runStats.recentRuns) ? runStats.recentRuns : [];

  if (recentRuns.length > 0) {
    lines.push('', 'Recent runs:');
    for (const run of recentRuns.slice(0, 5)) {
      lines.push(`- ${formatTextValue(run.runId)} / ${formatTextValue(run.status ?? 'unknown')} / verifier ${formatTextValue(run.verifierStatus ?? 'unknown')}`);
    }
  }

  lines.push('', 'Risk panel:');

  if (!Array.isArray(risks.items) || risks.items.length === 0) {
    lines.push('- No visible risks.');
  } else {
    for (const risk of risks.items.slice(0, 8)) {
      lines.push(`- [${formatTextValue(risk.severity)}] ${formatTextValue(risk.title)}${risk.runId ? ` (${formatTextValue(risk.runId)})` : ''}: ${formatTextValue(risk.detail)}`);
    }
  }

  const checks = Array.isArray(readiness.checks) ? readiness.checks : [];

  lines.push('', 'Readiness checks:');

  if (checks.length === 0) {
    lines.push('- No readiness checks available.');
  } else {
    for (const check of checks) {
      lines.push(`- ${formatTextValue(check.label)}: ${formatTextValue(check.status)}${check.detail ? ` - ${formatTextValue(check.detail)}` : ''}`);
    }
  }

  lines.push('', 'Commands:');
  appendTextCommandGroups(lines, safeReport.commands?.groups ?? safeReport.commands?.commandGroups ?? []);

  lines.push('', `Next: ${formatTextValue(safeReport.action?.next ?? 'symphony scan')}`);

  return `${lines.join('\n')}\n`;
}

export function renderDiagnosticsHtml(report) {
  const safeReport = redactSecrets(report);
  const snapshot = safeReport.snapshot ?? {};
  const latestRun = snapshot.latestRun ?? null;
  const runStats = snapshot.runStats ?? {};
  const readiness = safeReport.readiness ?? {};
  const risks = safeReport.risks ?? emptyRiskSummary();
  const commandGroups = safeReport.commands?.groups ?? safeReport.commands?.commandGroups ?? [];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Symphony Diagnostics Report</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #1f252d;
      --muted: #626d7a;
      --line: #d9dee6;
      --ok: #176b4d;
      --ok-bg: #e4f3ec;
      --warn: #936419;
      --warn-bg: #fff4d8;
      --danger: #a33a2a;
      --danger-bg: #fae8e4;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-size: 14px;
      letter-spacing: 0;
    }

    header,
    main {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
    }

    header {
      padding: 28px 0 18px;
    }

    h1,
    h2,
    h3,
    p {
      margin: 0;
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
    }

    h2 {
      margin-bottom: 10px;
      font-size: 16px;
      font-weight: 700;
    }

    h3 {
      margin-bottom: 8px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
      gap: 16px;
      padding-bottom: 32px;
    }

    section,
    aside {
      min-width: 0;
    }

    .stack {
      display: grid;
      gap: 16px;
    }

    .panel,
    .metric,
    .risk,
    .command,
    .run-row,
    .check-row {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
    }

    .panel {
      padding: 16px;
    }

    .subtitle {
      margin-top: 4px;
      color: var(--muted);
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0 10px;
      background: var(--panel);
      color: var(--muted);
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .badge.ready,
    .badge.ok,
    .badge.passed {
      border-color: var(--ok);
      background: var(--ok-bg);
      color: var(--ok);
    }

    .badge.attention,
    .badge.no-runs,
    .badge.optional,
    .badge.preview {
      border-color: var(--warn);
      background: var(--warn-bg);
      color: var(--warn);
    }

    .badge.failed,
    .badge.high {
      border-color: var(--danger);
      background: var(--danger-bg);
      color: var(--danger);
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }

    .metric {
      min-width: 0;
      padding: 12px;
    }

    .label {
      color: var(--muted);
      font-size: 12px;
    }

    .value {
      margin-top: 4px;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid var(--line);
      background: var(--panel);
    }

    th,
    td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
    }

    th {
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      background: #eef1f5;
    }

    code {
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      overflow-wrap: anywhere;
    }

    .risk-list,
    .command-list,
    .check-list,
    .run-list {
      display: grid;
      gap: 8px;
    }

    .risk,
    .command,
    .check-row,
    .run-row {
      padding: 10px;
      overflow-wrap: anywhere;
    }

    .risk.high {
      border-color: var(--danger);
      background: var(--danger-bg);
    }

    .risk.medium {
      border-color: var(--warn);
      background: var(--warn-bg);
    }

    .muted {
      color: var(--muted);
    }

    .command-title,
    .risk-title,
    .run-title {
      font-weight: 700;
    }

    .command-code {
      display: block;
      margin-top: 5px;
      color: #364253;
    }

    .empty {
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      color: var(--muted);
      overflow-wrap: anywhere;
    }

    @media (max-width: 840px) {
      main,
      .metric-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Symphony Diagnostics Report</h1>
    <p class="subtitle">Static read-only diagnostics generated from local Symphony state.</p>
    <div class="meta">
      ${statusBadge(safeReport.status)}
      ${statusBadge(`readiness:${readiness.status ?? 'unknown'}`)}
      <span class="badge">copy-only commands</span>
      <span class="badge">${escapeHtml(safeReport.generatedAt)}</span>
    </div>
  </header>
  <main>
    <section class="stack">
      <div class="panel">
        <h2>Overall Status</h2>
        ${metricsGrid([
          ['Status', safeReport.status],
          ['Runs', runStats.total ?? snapshot.runs?.length ?? 0],
          ['Failed runs', runStats.failedCount ?? 0],
          ['Risks', `${risks.total ?? 0} total`],
          ['State dir', safeReport.stateDir],
          ['CWD', safeReport.cwd],
          ['Next', safeReport.action?.next ?? 'symphony scan'],
          ['Artifacts', artifactStatusLabel(runStats, latestRun)]
        ])}
      </div>
      <div class="panel">
        <h2>Latest Run</h2>
        ${renderLatestRun(latestRun)}
      </div>
      <div class="panel">
        <h2>Recent Runs</h2>
        ${renderRecentRuns(runStats.recentRuns ?? [])}
      </div>
      <div class="panel">
        <h2>Artifact Health</h2>
        ${renderArtifactHealth(runStats, latestRun)}
      </div>
    </section>
    <aside class="stack">
      <div class="panel">
        <h2>Risk Panel</h2>
        ${renderRiskList(risks.items ?? [])}
      </div>
      <div class="panel">
        <h2>Readiness</h2>
        ${renderReadinessChecks(readiness.checks ?? [])}
      </div>
      <div class="panel">
        <h2>Copy-Only Commands</h2>
        ${renderCommandGroups(commandGroups)}
      </div>
    </aside>
  </main>
</body>
</html>
`;
}

export function createSymphonyConsoleServer({
  stateDir = '.symphony',
  cwd = process.cwd(),
  env = process.env,
  runner = new NodeProcessRunner(),
  readinessTimeoutMs = DEFAULT_READINESS_TIMEOUT_MS
} = {}) {
  return createServer(async (request, response) => {
    try {
      if (request.method !== 'GET') {
        writeJsonResponse(response, 405, {
          status: 'error',
          message: 'console is read-only'
        });
        return;
      }

      const url = new URL(request.url ?? '/', 'http://localhost');

      if (url.pathname === '/') {
        writeHtmlResponse(response, renderConsoleHtml());
        return;
      }

      if (url.pathname === '/api/health') {
        writeJsonResponse(response, 200, {
          status: 'ok',
          readOnly: true
        });
        return;
      }

      if (url.pathname === '/api/summary') {
        writeJsonResponse(response, 200, await buildConsoleSnapshot({ stateDir }));
        return;
      }

      if (url.pathname === '/api/readiness') {
        writeJsonResponse(response, 200, await buildConsoleReadiness({
          stateDir,
          cwd,
          env,
          runner,
          timeoutMs: readinessTimeoutMs
        }));
        return;
      }

      const adoptionInspectRequest = parseAdoptionInspectRequestPath(url.pathname);

      if (adoptionInspectRequest !== null) {
        await writeAdoptionInspectResponse({
          response,
          stateDir,
          adoptionId: adoptionInspectRequest.adoptionId
        });
        return;
      }

      if (url.pathname === '/api/runs') {
        const runs = await decorateConsoleRuns(
          (await listRunStates({ stateDir })).map((run) => compactRunState(run))
        );
        const filter = normalizeRunFilter(url.searchParams.get('filter'));
        writeJsonResponse(response, 200, {
          contractVersion: PRODUCT_JSON_CONTRACT.version,
          contractName: 'symphony.console-runs',
          filter,
          availableFilters: [...RUN_FILTERS],
          runs: filterRuns(runs, filter)
        });
        return;
      }

      if (url.pathname === '/api/runs/latest') {
        await writeRunResponse({ response, stateDir, runId: 'latest' });
        return;
      }

      const timelineRequest = parseRunTimelineRequestPath(url.pathname);

      if (timelineRequest !== null) {
        await writeTimelineResponse({
          response,
          stateDir,
          runId: timelineRequest.runId
        });
        return;
      }

      const artifactRequest = parseArtifactRequestPath(url.pathname);

      if (artifactRequest !== null) {
        await writeArtifactResponse({
          response,
          stateDir,
          runId: artifactRequest.runId,
          artifactKind: artifactRequest.artifactKind
        });
        return;
      }

      if (url.pathname.startsWith('/api/runs/')) {
        const runId = decodeURIComponent(url.pathname.slice('/api/runs/'.length));
        await writeRunResponse({ response, stateDir, runId });
        return;
      }

      writeJsonResponse(response, 404, {
        status: 'error',
        message: 'not found'
      });
    } catch (error) {
      writeJsonResponse(response, error instanceof TypeError ? 400 : 500, {
        status: 'error',
        message: error.message
      });
    }
  });
}

export async function startSymphonyConsoleServer({
  stateDir = '.symphony',
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  cwd = process.cwd(),
  env = process.env,
  runner = new NodeProcessRunner(),
  readinessTimeoutMs = DEFAULT_READINESS_TIMEOUT_MS
} = {}) {
  const server = createSymphonyConsoleServer({
    stateDir,
    cwd,
    env,
    runner,
    readinessTimeoutMs
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  const actualPort = typeof address === 'object' && address !== null ? address.port : port;

  return {
    server,
    host,
    port: actualPort,
    url: `http://${host}:${actualPort}/`
  };
}

async function writeRunResponse({ response, stateDir, runId }) {
  const runState = await readRunState({ stateDir, runId });

  if (runState === null) {
    writeJsonResponse(response, 404, {
      status: 'missing',
      runId
    });
    return;
  }

  writeJsonResponse(response, 200, {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-run',
    run: await decorateConsoleRunWithDiagnostics(compactRunState(runState)),
    rawRunState: runState
  });
}

async function writeTimelineResponse({ response, stateDir, runId }) {
  const runState = await readRunState({ stateDir, runId });

  if (runState === null) {
    writeJsonResponse(response, 404, {
      status: 'missing',
      runId
    });
    return;
  }

  const run = await decorateConsoleRunWithDiagnostics(compactRunState(runState));

  writeJsonResponse(response, 200, {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-run-timeline',
    runId: run.runId,
    timeline: run.timeline,
    recommendedCommands: run.recommendedCommands
  });
}

async function writeArtifactResponse({ response, stateDir, runId, artifactKind }) {
  const runState = await readRunState({ stateDir, runId });

  if (runState === null) {
    writeJsonResponse(response, 404, {
      status: 'missing',
      runId
    });
    return;
  }

  const compact = compactRunState(runState);
  const artifactRef = compact.artifactRefs.find((artifact) => artifact.kind === artifactKind);

  if (artifactRef === undefined) {
    writeJsonResponse(response, 404, {
      contractVersion: PRODUCT_JSON_CONTRACT.version,
      contractName: 'symphony.console-artifact',
      status: 'missing',
      runId: compact.runId,
      artifactKind
    });
    return;
  }

  let artifact;

  try {
    artifact = await previewArtifact(artifactRef);
  } catch (error) {
    if (isMissingFileError(error)) {
      writeJsonResponse(response, 404, {
        contractVersion: PRODUCT_JSON_CONTRACT.version,
        contractName: 'symphony.console-artifact',
        status: 'missing-artifact',
        runId: compact.runId,
        artifact: {
          ...artifactRef,
          type: 'missing',
          message: 'artifact file is missing'
        }
      });
      return;
    }

    throw error;
  }

  writeJsonResponse(response, 200, {
    contractVersion: PRODUCT_JSON_CONTRACT.version,
    contractName: 'symphony.console-artifact',
    runId: compact.runId,
    artifact
  });
}

async function writeAdoptionInspectResponse({ response, stateDir, adoptionId }) {
  let summary;

  try {
    summary = await buildAdoptionInspectionSummary({
      stateDir,
      adoptionId
    });
  } catch (error) {
    if (/adoption plan not found/u.test(error.message)) {
      writeJsonResponse(response, 404, {
        status: 'missing',
        message: error.message
      });
      return;
    }

    throw error;
  }

  writeJsonResponse(response, 200, buildConsoleAdoptionInspectContract(summary));
}

async function previewArtifact(artifactRef) {
  const metadata = await stat(artifactRef.path);

  if (metadata.isDirectory()) {
    const entries = await readdir(artifactRef.path, { withFileTypes: true });

    return {
      ...artifactRef,
      type: 'directory',
      entries: entries.slice(0, DIRECTORY_PREVIEW_ENTRY_LIMIT).map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file'
      })),
      entryCount: entries.length,
      limit: DIRECTORY_PREVIEW_ENTRY_LIMIT,
      truncated: entries.length > DIRECTORY_PREVIEW_ENTRY_LIMIT
    };
  }

  const size = metadata.size;
  const length = Math.min(size, MAX_ARTIFACT_PREVIEW_BYTES);
  const handle = await open(artifactRef.path, 'r');

  try {
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, 0);
    const content = buffer.toString('utf8');
    const truncated = size > MAX_ARTIFACT_PREVIEW_BYTES;
    const jsonPreview = parseJsonPreviewWithError(content);
    const json = jsonPreview.value;
    const looksJson = isJsonArtifact({ artifactRef, content });
    const malformedJson = !truncated && json === null && looksJson;
    const truncatedJson = truncated && json === null && looksJson;

    return {
      ...artifactRef,
      type: 'file',
      size,
      truncated,
      previewLimitBytes: MAX_ARTIFACT_PREVIEW_BYTES,
      format: malformedJson ? 'malformed-json' : truncatedJson ? 'truncated-json' : json === null ? 'text' : 'json',
      content,
      ...(malformedJson ? { parseError: jsonPreview.error ?? 'invalid JSON artifact preview' } : {}),
      ...(truncated ? { message: `preview truncated to ${MAX_ARTIFACT_PREVIEW_BYTES} bytes` } : {}),
      ...(json === null ? {} : { json })
    };
  } finally {
    await handle.close();
  }
}

function isMissingFileError(error) {
  return error?.code === 'ENOENT' || error?.code === 'ENOTDIR';
}

function isJsonArtifact({ artifactRef, content }) {
  const trimmed = content.trimStart();

  return artifactRef.path.endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[');
}

function parseArtifactRequestPath(pathname) {
  const match = /^\/api\/runs\/([^/]+)\/artifacts\/([^/]+)$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  return {
    runId: decodeURIComponent(match[1]),
    artifactKind: decodeURIComponent(match[2])
  };
}

function parseAdoptionInspectRequestPath(pathname) {
  const match = /^\/api\/adoptions\/([^/]+)\/inspect$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  return {
    adoptionId: decodeURIComponent(match[1])
  };
}

function parseRunTimelineRequestPath(pathname) {
  const match = /^\/api\/runs\/([^/]+)\/timeline$/u.exec(pathname);

  if (match === null) {
    return null;
  }

  return {
    runId: decodeURIComponent(match[1])
  };
}

function parseJsonPreview(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function parseJsonPreviewWithError(content) {
  try {
    return {
      value: JSON.parse(content)
    };
  } catch (error) {
    return {
      value: null,
      error: error.message
    };
  }
}

function compactContext(context) {
  if (context === null) {
    return null;
  }

  return stripUndefined({
    runId: context.runId,
    projectRoot: context.projectRoot,
    projectFingerprint: context.projectFingerprint,
    contextArtifactPath: context.contextArtifactPath,
    summaryArtifactPath: context.summaryArtifactPath,
    recommendedWorkflow: context.recommendedWorkflow,
    verificationCommands: context.verificationCommands,
    createdAt: context.createdAt
  });
}

function compactAdoptionPlans(plans) {
  return plans.map((plan) => stripUndefined({
    adoptionPlanId: plan.adoptionId,
    sourceRunId: plan.sourceRunId,
    executionPlanId: plan.executionPlanId,
    plannedRunId: plan.plannedRunId,
    status: 'adoption-planned',
    patchArtifactPath: plan.patchArtifactPath,
    patchHash: plan.patchHash,
    changedFiles: Array.isArray(plan.changedFiles) ? [...plan.changedFiles] : undefined,
    fileOperations: plan.fileOperations === undefined ? undefined : structuredClone(plan.fileOperations),
    confirmationCommand: plan.confirmationCommand,
    createdAt: plan.createdAt
  }));
}

function compactAdoptionJournals({ journals, stateDir }) {
  return journals.map((journal) => stripUndefined({
    adoptionPlanId: journal.adoptionPlanId,
    confirmationRunId: journal.confirmationRunId,
    sourceRunId: journal.sourceRunId,
    executionPlanId: journal.executionPlanId,
    status: journal.status,
    patchArtifactPath: journal.patchArtifactPath,
    patchHash: journal.patchHash,
    changedFiles: Array.isArray(journal.changedFiles) ? [...journal.changedFiles] : undefined,
    fileOperations: journal.fileOperations === undefined ? undefined : structuredClone(journal.fileOperations),
    beforeFiles: journal.beforeFiles === undefined ? undefined : structuredClone(journal.beforeFiles),
    adoptionJournalArtifactPath: journal.adoptionPlanId
      ? `${stateDir}/adoptions/${journal.adoptionPlanId}-journal.json`
      : undefined,
    createdAt: journal.createdAt
  }));
}

function buildAdoptionSummary({
  runs = [],
  adoptionPlans = [],
  adoptionJournals = [],
  readiness,
  risks
} = {}) {
  const adoptionIds = new Set();

  for (const plan of adoptionPlans) {
    if (plan.adoptionPlanId) {
      adoptionIds.add(plan.adoptionPlanId);
    }
  }

  for (const run of runs) {
    if (run.adoptionPlanId) {
      adoptionIds.add(run.adoptionPlanId);
    }
  }

  for (const journal of adoptionJournals) {
    if (journal.adoptionPlanId) {
      adoptionIds.add(journal.adoptionPlanId);
    }
  }

  const latestConfirmations = latestAdoptionConfirmationRunsById(runs);
  const planningRuns = latestAdoptionPlanningRunsById(runs);
  const applyingJournalIds = new Set(
    adoptionJournals
      .filter((journal) => journal.status === 'applying' && journal.adoptionPlanId)
      .map((journal) => journal.adoptionPlanId)
  );

  let pendingCount = 0;
  let applyingCount = 0;
  let postApplyFailedCount = 0;
  let staleCount = 0;
  let completedCount = 0;

  for (const adoptionId of adoptionIds) {
    const confirmation = latestConfirmations.get(adoptionId);

    if (confirmation?.failurePhase === 'post-apply-evidence') {
      postApplyFailedCount += 1;
      continue;
    }

    if (confirmation?.status === 'applying' || applyingJournalIds.has(adoptionId)) {
      applyingCount += 1;
      continue;
    }

    if (confirmation?.failurePhase === 'adoption-confirmation-preflight'
      && /stale|fingerprint|HEAD/u.test(confirmation.failureMessage ?? '')) {
      staleCount += 1;
      continue;
    }

    if (confirmation?.status === 'passed') {
      completedCount += 1;
      continue;
    }

    if (planningRuns.has(adoptionId) || adoptionPlans.some((plan) => plan.adoptionPlanId === adoptionId)) {
      pendingCount += 1;
    }
  }

  const unsupportedCount = runs.filter((run) => run.failurePhase === 'adoption-planning'
    && Array.isArray(run.unsupportedChanges)
    && run.unsupportedChanges.length > 0).length;
  const dirtyBlocked = (pendingCount > 0 && readiness?.tools?.git?.dirty === true)
    || riskSummaryHasCategory(risks, 'dirty_worktree_blocks_adoption');
  const status = adoptionSummaryStatus({
    pendingCount,
    applyingCount,
    postApplyFailedCount,
    staleCount,
    unsupportedCount,
    dirtyBlocked
  });

  return {
    status,
    pendingCount,
    applyingCount,
    postApplyFailedCount,
    staleCount,
    unsupportedCount,
    completedCount,
    dirtyBlocked
  };
}

function latestAdoptionConfirmationRunsById(runs) {
  const latest = new Map();

  for (const run of runs) {
    if (!run.adoptionPlanId
      || !Array.isArray(run.pipeline)
      || !run.pipeline.includes('adopt-confirm')
      || latest.has(run.adoptionPlanId)) {
      continue;
    }

    latest.set(run.adoptionPlanId, run);
  }

  return latest;
}

function latestAdoptionPlanningRunsById(runs) {
  const latest = new Map();

  for (const run of runs) {
    if (!run.adoptionPlanId || run.status !== 'adoption-planned' || latest.has(run.adoptionPlanId)) {
      continue;
    }

    latest.set(run.adoptionPlanId, run);
  }

  return latest;
}

function adoptionSummaryStatus({
  pendingCount,
  applyingCount,
  postApplyFailedCount,
  staleCount,
  unsupportedCount,
  dirtyBlocked
}) {
  if (postApplyFailedCount > 0) return 'post-apply-failed';
  if (applyingCount > 0) return 'applying';
  if (dirtyBlocked) return 'dirty-blocked';
  if (staleCount > 0) return 'stale';
  if (unsupportedCount > 0) return 'unsupported';
  if (pendingCount > 0) return 'pending';
  return 'clear';
}

function buildConsoleOverview({
  latestRun,
  runStats,
  riskSummary,
  adoptionSummary,
  readiness,
  nextAction
}) {
  const topRisks = topOverviewRisks(riskSummary?.items ?? []);
  const status = overviewStatus({
    latestRun,
    topRisks,
    adoptionSummary,
    readiness
  });

  return stripUndefined({
    status,
    headline: overviewHeadline({
      status,
      latestRun,
      topRisks,
      adoptionSummary,
      readiness
    }),
    latestRunId: latestRun?.runId,
    latestRun: latestRun === null || latestRun === undefined
      ? null
      : stripUndefined({
          runId: latestRun.runId,
          command: latestRun.command,
          status: latestRun.status,
          verifierStatus: latestRun.verifierStatus,
          updatedAt: latestRun.updatedAt
        }),
    runCount: runStats?.total,
    topRisks,
    nextAction: overviewNextAction({
      topRisks,
      latestRun,
      adoptionSummary,
      readiness,
      fallback: nextAction
    }),
    readiness: readiness === undefined ? undefined : compactReadinessForOverview(readiness),
    adoptionStatus: adoptionSummary?.status
  });
}

function topOverviewRisks(items) {
  return [...items]
    .sort((left, right) => (RISK_SEVERITY_RANK[right.severity] ?? 0) - (RISK_SEVERITY_RANK[left.severity] ?? 0))
    .slice(0, 3)
    .map((risk) => stripUndefined({
      id: risk.id,
      category: risk.category,
      severity: risk.severity,
      title: risk.title,
      detail: risk.detail,
      runId: risk.runId,
      command: risk.command
    }));
}

function overviewStatus({ latestRun, topRisks, adoptionSummary, readiness }) {
  if (latestRun === null || latestRun === undefined) {
    return 'no-runs';
  }

  if (adoptionSummary?.status === 'dirty-blocked'
    || adoptionSummary?.status === 'applying'
    || adoptionSummary?.status === 'post-apply-failed'
    || adoptionSummary?.status === 'stale'
    || topRisks.some((risk) => risk.severity === 'high')) {
    return 'blocked';
  }

  if (adoptionSummary?.status !== undefined && adoptionSummary.status !== 'clear') {
    return 'attention';
  }

  if (readiness?.status === 'attention' || topRisks.some((risk) => risk.severity === 'medium')) {
    return 'attention';
  }

  return 'ready';
}

function overviewHeadline({ status, latestRun, topRisks, adoptionSummary, readiness }) {
  if (status === 'no-runs') {
    return 'No Symphony runs found yet.';
  }

  if (adoptionSummary?.status === 'post-apply-failed') {
    return 'Patch applied, evidence failed.';
  }

  if (adoptionSummary?.status === 'applying') {
    return 'Adoption apply is in progress or needs recovery inspection.';
  }

  if (adoptionSummary?.status === 'dirty-blocked') {
    return 'Dirty worktree blocks adoption.';
  }

  if (adoptionSummary?.status === 'stale') {
    return 'Adoption plan is stale and needs inspection.';
  }

  if (adoptionSummary?.status === 'pending') {
    return 'Pending adoption is ready for review.';
  }

  const actionableRisk = topRisks.find((risk) => risk.severity !== 'low');

  if (actionableRisk !== undefined) {
    return actionableRisk.title;
  }

  if (readiness?.status === 'attention') {
    return 'Readiness needs attention before the next run.';
  }

  return latestRun?.status === 'passed'
    ? 'Latest run passed and no high-priority risks are visible.'
    : `Latest run is ${latestRun?.status ?? 'available'}.`;
}

function overviewNextAction({ topRisks, latestRun, adoptionSummary, readiness, fallback }) {
  if (adoptionSummary?.dirtyBlocked === true || readiness?.tools?.git?.dirty === true) {
    return 'git status --short';
  }

  const riskCommand = topRisks.find((risk) => risk.command?.command)?.command?.command;

  if (riskCommand) {
    return riskCommand;
  }

  return latestRun?.nextAction ?? fallback ?? 'symphony scan';
}

function compactReadinessForOverview(readiness) {
  return stripUndefined({
    status: readiness.status,
    git: readiness.tools?.git === undefined
      ? undefined
      : stripUndefined({
          status: readiness.tools.git.status,
          branch: readiness.tools.git.branch,
          dirty: readiness.tools.git.dirty,
          dirtyFilesCount: readiness.tools.git.dirtyFilesCount
        }),
    packageManager: readiness.tools?.packageManager === undefined
      ? undefined
      : stripUndefined({
          status: readiness.tools.packageManager.status,
          name: readiness.tools.packageManager.name,
          version: readiness.tools.packageManager.version
        }),
    github: readiness.tools?.github === undefined
      ? undefined
      : stripUndefined({
          status: readiness.tools.github.status,
          authenticated: readiness.tools.github.authenticated
        }),
    realCli: readiness.tools?.realCli === undefined
      ? undefined
      : stripUndefined({
          status: readiness.tools.realCli.status,
          available: readiness.tools.realCli.available
        })
  });
}

function riskSummaryHasCategory(risks, category) {
  return Array.isArray(risks?.items) && risks.items.some((risk) => risk.category === category);
}

function decorateConsoleRun(run) {
  if (run === null) {
    return null;
  }

  const recommendedCommands = buildRunRecommendedCommands(run);

  return stripUndefined({
    ...run,
    artifactHealth: buildArtifactHealth(run),
    timeline: buildRunTimeline(run),
    recommendedCommands,
    commandGroups: groupCommands(recommendedCommands)
  });
}

async function decorateConsoleRuns(runs) {
  return await Promise.all(
    runs
      .filter((run) => run !== null)
      .map((run) => decorateConsoleRunWithDiagnostics(run))
  );
}

async function decorateConsoleRunWithDiagnostics(run) {
  if (run === null) {
    return null;
  }

  const decorated = decorateConsoleRun(run);
  const artifactStatus = await buildArtifactStatus(decorated);
  const riskSummary = buildRunRiskSummary([{ ...decorated, artifactStatus }]);

  return stripUndefined({
    ...decorated,
    artifactStatus,
    riskSummary
  });
}

function buildArtifactHealth(run) {
  const artifactRefs = Array.isArray(run.artifactRefs) ? run.artifactRefs : [];

  return {
    status: artifactRefs.length === 0 ? 'empty' : 'registered',
    total: artifactRefs.length,
    kinds: artifactRefs.map((artifact) => artifact.kind)
  };
}

async function buildArtifactStatus(run) {
  const artifactRefs = Array.isArray(run.artifactRefs) ? run.artifactRefs : [];

  if (artifactRefs.length === 0) {
    return {
      status: 'empty',
      total: 0,
      available: 0,
      missing: 0,
      unknown: 0,
      missingKinds: []
    };
  }

  const refs = await Promise.all(artifactRefs.map(async (artifact) => {
    try {
      await stat(artifact.path);

      return {
        ...artifact,
        status: 'available'
      };
    } catch (error) {
      if (isMissingFileError(error)) {
        return {
          ...artifact,
          status: 'missing'
        };
      }

      return {
        ...artifact,
        status: 'unknown',
        message: error.message
      };
    }
  }));
  const missingRefs = refs.filter((artifact) => artifact.status === 'missing');
  const unknownRefs = refs.filter((artifact) => artifact.status === 'unknown');

  return stripUndefined({
    status: missingRefs.length > 0 ? 'missing' : unknownRefs.length > 0 ? 'unknown' : 'ok',
    total: refs.length,
    available: refs.filter((artifact) => artifact.status === 'available').length,
    missing: missingRefs.length,
    unknown: unknownRefs.length,
    missingKinds: missingRefs.map((artifact) => artifact.kind),
    missingRefs
  });
}

function buildRunStats(runs) {
  const verifierRuns = runs.filter((run) => isNonEmptyString(run.verifierStatus));
  const verifierPassed = verifierRuns.filter((run) => run.verifierStatus === 'passed').length;
  const artifactMissingCount = runs.reduce((total, run) => total + (run.artifactStatus?.missing ?? 0), 0);
  const artifactRegisteredCount = runs.reduce((total, run) => total + (run.artifactStatus?.total ?? 0), 0);

  return {
    total: runs.length,
    recentRuns: runs.slice(0, 5).map((run) => stripUndefined({
      runId: run.runId,
      command: run.command,
      status: run.status,
      verifierStatus: run.verifierStatus,
      semanticCommand: run.semanticCommand,
      safetyMode: run.safetyMode,
      executionMode: run.executionMode,
      artifactStatus: run.artifactStatus?.status,
      updatedAt: run.updatedAt ?? run.createdAt
    })),
    failedCount: runs.filter((run) => run.status === 'failed' || run.verifierStatus === 'failed').length,
    verifier: {
      total: verifierRuns.length,
      passed: verifierPassed,
      failed: verifierRuns.filter((run) => run.verifierStatus === 'failed').length,
      passRate: verifierRuns.length === 0 ? null : verifierPassed / verifierRuns.length
    },
    artifacts: {
      status: artifactMissingCount > 0 ? 'missing' : artifactRegisteredCount === 0 ? 'empty' : 'ok',
      registered: artifactRegisteredCount,
      missing: artifactMissingCount,
      runsWithMissing: runs.filter((run) => (run.artifactStatus?.missing ?? 0) > 0).length
    },
    filters: RUN_FILTERS.map((filter) => ({
      id: filter,
      count: filterRuns(runs, filter).length
    }))
  };
}

function buildRunRiskSummary(runs) {
  const items = [];

  for (const run of runs) {
    if (run.status === 'failed') {
      items.push(runRisk({
        run,
        id: 'run_failed',
        severity: 'high',
        title: 'Run failed',
        detail: `${run.command ?? run.runId} ended with status failed.`
      }));
    }

    if (run.verifierStatus === 'failed') {
      items.push(runRisk({
        run,
        id: 'verifier_failed',
        severity: 'high',
        title: 'Verifier failed',
        detail: `${run.runId} has verifierStatus=failed.`
      }));
    }

    if (Array.isArray(run.unsupportedRequests) && run.unsupportedRequests.length > 0) {
      items.push(runRisk({
        run,
        id: 'unsupported_requests',
        severity: 'medium',
        title: 'Unsupported requests',
        detail: `${run.unsupportedRequests.length} unsupported request(s) were recorded.`
      }));
    }

    if (run.externalCalls === true) {
      items.push(runRisk({
        run,
        id: 'external_calls',
        severity: 'medium',
        title: 'External calls',
        detail: `${run.runId} recorded externalCalls=true.`
      }));
    }

    if (run.projectWrites === true) {
      items.push(runRisk({
        run,
        id: 'project_writes',
        severity: 'medium',
        title: 'Project writes',
        detail: `${run.runId} recorded projectWrites=true.`
      }));
    }

    if (run.runtimeWrites === true) {
      items.push(runRisk({
        run,
        id: 'runtime_writes',
        severity: 'low',
        title: 'Runtime writes',
        detail: `${run.runId} wrote Symphony runtime artifacts.`
      }));
    }

    if ((run.artifactStatus?.missing ?? 0) > 0) {
      items.push(runRisk({
        run,
        id: 'missing_artifacts',
        severity: 'high',
        title: 'Missing artifacts',
        detail: `${run.artifactStatus.missing} registered artifact(s) are missing.`,
        command: run.runId ? `symphony artifacts ${run.runId}` : 'symphony artifacts'
      }));
    }

    if (run.status === 'adoption-planned') {
      items.push(runRisk({
        run,
        id: 'pending_adoption',
        severity: 'medium',
        title: 'Pending adoption',
        detail: `${run.runId} has a frozen adoption plan waiting for confirmation.`,
        command: run.confirmationCommand ?? 'symphony status'
      }));
    }

    if (run.failurePhase === 'adoption-planning' && Array.isArray(run.unsupportedChanges) && run.unsupportedChanges.length > 0) {
      items.push(runRisk({
        run,
        id: 'unsupported_adoption_changes',
        severity: 'high',
        title: 'Unsupported adoption changes',
        detail: `${run.unsupportedChanges.length} unsupported source change(s) blocked adoption planning.`
      }));
    }

    if (run.failurePhase === 'adoption-confirmation-preflight' && /stale|fingerprint|HEAD/u.test(run.failureMessage ?? '')) {
      items.push(runRisk({
        run,
        id: 'stale_adoption',
        severity: 'high',
        title: 'Stale adoption',
        detail: run.failureMessage ?? 'Adoption confirmation preflight detected stale state.'
      }));
    }

    if (run.status === 'applying'
      && run.adoptionPlanId !== undefined
      && Array.isArray(run.pipeline)
      && run.pipeline.includes('adopt-confirm')) {
      items.push(runRisk({
        run,
        id: 'adoption_apply_in_progress',
        severity: 'high',
        title: 'Adoption apply in progress',
        detail: `${run.runId} reached the main-worktree apply phase.`,
        command: `symphony adopt --inspect ${run.adoptionPlanId} --json`
      }));
    }

    if (run.failurePhase === 'post-apply-evidence') {
      items.push(runRisk({
        run,
        id: 'adoption_post_apply_failed',
        severity: 'high',
        title: 'Adoption post-apply evidence failed',
        detail: run.failureMessage ?? 'Patch application succeeded but evidence or final state persistence failed.',
        command: `symphony adopt --inspect ${run.adoptionPlanId ?? ''} --json`.trim()
      }));
    }
  }

  return summarizeRiskItems(items);
}

function buildAdoptionDiagnosticsRiskSummary({ snapshot, readiness }) {
  const items = [];
  const pendingRuns = Array.isArray(snapshot.runs)
    ? snapshot.runs.filter((run) => run.status === 'adoption-planned')
    : [];
  const staleRuns = Array.isArray(snapshot.runs)
    ? snapshot.runs.filter((run) => run.failurePhase === 'adoption-confirmation-preflight'
      && /stale|fingerprint|HEAD/u.test(run.failureMessage ?? ''))
    : [];
  const applyingRuns = Array.isArray(snapshot.runs)
    ? snapshot.runs.filter((run) => run.status === 'applying'
      && run.adoptionPlanId !== undefined
      && Array.isArray(run.pipeline)
      && run.pipeline.includes('adopt-confirm'))
    : [];
  const applyingJournals = Array.isArray(snapshot.adoptionJournals)
    ? snapshot.adoptionJournals.filter((journal) => journal.status === 'applying')
    : [];

  if (pendingRuns.length > 0 && readiness.tools?.git?.dirty === true) {
    items.push(riskItem({
      id: 'dirty_worktree_blocks_adoption',
      category: 'dirty_worktree_blocks_adoption',
      severity: 'high',
      title: 'Dirty worktree blocks adoption',
      detail: `${pendingRuns.length} pending adoption plan(s) require a clean non-Symphony worktree before confirmation.`,
      command: 'git status --short'
    }));
    items.push(riskItem({
      id: 'adoption_dirty_file_details',
      category: 'adoption_dirty_file_details',
      severity: 'high',
      title: 'Adoption dirty file details',
      detail: `${pendingRuns.length} pending adoption plan(s) are blocked by ${readiness.tools.git.dirtyFilesCount ?? 0} dirty file(s).`,
      command: 'git status --short',
      dirtyPaths: readiness.tools.git.dirtyPaths,
      dirtyPathCount: readiness.tools.git.dirtyFilesCount
    }));
  }

  if (staleRuns.length > 0 && readiness.tools?.git?.dirty === true) {
    items.push(riskItem({
      id: 'adoption_dirty_file_details:stale',
      category: 'adoption_dirty_file_details',
      severity: 'high',
      title: 'Adoption dirty file details',
      detail: `${staleRuns.length} stale adoption confirmation run(s) are associated with ${readiness.tools.git.dirtyFilesCount ?? 0} dirty file(s).`,
      command: 'git status --short',
      dirtyPaths: readiness.tools.git.dirtyPaths,
      dirtyPathCount: readiness.tools.git.dirtyFilesCount
    }));
  }

  if (applyingRuns.length > 0 || applyingJournals.length > 0) {
    items.push(riskItem({
      id: 'adoption_apply_in_progress',
      category: 'adoption_apply_in_progress',
      severity: 'high',
      title: 'Adoption apply in progress',
      detail: `${applyingRuns.length} applying confirmation run(s), ${applyingJournals.length} applying journal(s).`,
      command: applyingRuns[0]?.adoptionPlanId
        ? `symphony adopt --inspect ${applyingRuns[0].adoptionPlanId} --json`
        : applyingJournals[0]?.adoptionPlanId
          ? `symphony adopt --inspect ${applyingJournals[0].adoptionPlanId} --json`
        : 'symphony status'
    }));
  }

  return summarizeRiskItems(items);
}

function runRisk({ run, id, severity, title, detail, command }) {
  return riskItem({
    id: `${run.runId ?? 'unknown'}:${id}`,
    category: id,
    severity,
    title,
    detail,
    runId: run.runId,
    command: command ?? 'symphony status'
  });
}

function buildRunTimeline(run) {
  return [
    timelineEvent({
      id: 'created',
      label: 'Run created',
      status: run.createdAt || run.updatedAt ? 'done' : 'missing',
      at: run.createdAt,
      detail: run.runId
    }),
    timelineEvent({
      id: 'route',
      label: 'Route decision',
      status: run.routeDecision || run.semanticCommand || run.intent ? 'done' : 'missing',
      detail: run.semanticCommand ?? run.intent
    }),
    timelineEvent({
      id: 'safety',
      label: 'Safety boundary',
      status: run.safetyMode ? 'done' : 'missing',
      detail: run.safetyMode
    }),
    timelineEvent({
      id: 'execution',
      label: 'Execution',
      status: run.status === 'failed' ? 'failed' : run.status ? 'done' : 'missing',
      detail: run.executionMode ?? run.providerStatus ?? run.status
    }),
    timelineEvent({
      id: 'verification',
      label: 'Verifier',
      status: verifierTimelineStatus(run.verifierStatus),
      detail: run.verifierStatus
    }),
    timelineEvent({
      id: 'artifacts',
      label: 'Artifacts',
      status: Array.isArray(run.artifactRefs) && run.artifactRefs.length > 0 ? 'done' : 'missing',
      detail: Array.isArray(run.artifactRefs) ? `${run.artifactRefs.length} registered` : 'none'
    })
  ];
}

function timelineEvent({ id, label, status, detail, at }) {
  return stripUndefined({
    id,
    label,
    status,
    detail,
    at
  });
}

function verifierTimelineStatus(verifierStatus) {
  if (verifierStatus === 'passed') {
    return 'done';
  }

  if (verifierStatus === 'failed') {
    return 'failed';
  }

  if (verifierStatus === undefined || verifierStatus === null) {
    return 'missing';
  }

  return 'pending';
}

function buildSnapshotRecommendedCommands({ latestRun }) {
  if (latestRun === null) {
    return [
      commandRecommendation({
        id: 'scan',
        label: 'Scan project',
        command: 'symphony scan',
        description: 'Create the first read-only project context.',
        group: 'Inspect'
      }),
      commandRecommendation({
        id: 'doctor',
        label: 'Check environment',
        command: 'symphony doctor',
        description: 'Verify the local CLI setup.',
        group: 'Inspect'
      }),
      commandRecommendation({
        id: 'console',
        label: 'Open workbench',
        command: 'symphony console',
        description: 'Start this local read-only workbench.',
        group: 'Inspect'
      })
    ];
  }

  return dedupeCommands([
    ...buildRunRecommendedCommands(latestRun),
    commandRecommendation({
      id: 'console',
      label: 'Open workbench',
      command: 'symphony console',
      description: 'Return to this read-only dashboard.',
      group: 'Inspect'
    })
  ]);
}

function buildRunRecommendedCommands(run) {
  return dedupeCommands([
    run.nextAction
      ? commandRecommendation({
          id: 'next',
          label: 'Suggested next',
          command: run.nextAction,
          description: 'Copy the next action recorded by the latest run.',
          group: commandGroupFor(run.nextAction)
        })
      : null,
    commandRecommendation({
      id: 'status',
      label: 'Status',
      command: 'symphony status',
      description: 'Read the latest product state.',
      group: 'Inspect'
    }),
    commandRecommendation({
      id: 'artifacts',
      label: 'Artifacts',
      command: run.runId ? `symphony artifacts ${run.runId}` : 'symphony artifacts',
      description: 'Print registered artifact references for this run.',
      group: 'Artifacts'
    }),
    run.semanticCommand === 'scan'
      ? commandRecommendation({
          id: 'dry-run-work',
          label: 'Dry-run work',
          command: 'symphony do --dry-run "inspect README"',
          description: 'Exercise the work path without project writes.',
          group: 'Verify'
        })
      : null,
    run.status && run.status !== 'passed'
      ? commandRecommendation({
          id: 'continue',
          label: 'Continue safely',
          command: 'symphony continue',
          description: 'Ask Symphony what can be continued from state.',
          group: 'Inspect'
        })
      : null
  ]);
}

function buildReadinessRecommendedCommands({ packageManager, git, github, realCli }) {
  return dedupeCommands([
    commandRecommendation({
      id: 'doctor',
      label: 'Doctor',
      command: 'symphony doctor',
      description: 'Check the base CLI environment.',
      group: 'Inspect'
    }),
    packageManager.status !== 'available'
      ? commandRecommendation({
          id: 'enable-pnpm',
          label: 'Enable pnpm',
          command: 'corepack enable',
          description: 'Make the package manager shim available before rechecking.',
          group: 'Inspect'
        })
      : null,
    packageManager.status !== 'available'
      ? commandRecommendation({
          id: 'check-pnpm',
          label: 'Check pnpm',
          command: 'pnpm --version',
          description: 'Confirm pnpm is available on PATH.',
          group: 'Inspect'
        })
      : null,
    git.status !== 'available'
      ? commandRecommendation({
          id: 'check-git-worktree',
          label: 'Check git',
          command: 'git rev-parse --is-inside-work-tree',
          description: 'Confirm the console is running inside a git worktree.',
          group: 'Inspect'
        })
      : null,
    git.status === 'available' && git.dirty
      ? commandRecommendation({
          id: 'git-status',
          label: 'Inspect dirty git',
          command: 'git status --short',
          description: 'Review uncommitted files before trusting run evidence.',
          group: 'Inspect'
        })
      : null,
    git.status === 'available' && git.dirty
      ? commandRecommendation({
          id: 'git-diff-stat',
          label: 'Diff summary',
          command: 'git diff --stat',
          description: 'See the shape of unstaged changes.',
          group: 'Inspect'
        })
      : null,
    github.status !== 'authenticated'
      ? commandRecommendation({
          id: 'gh-auth-status',
          label: 'Check GitHub auth',
          command: 'gh auth status',
          description: 'Inspect GitHub CLI auth without exposing tokens.',
          group: 'Inspect'
        })
      : null,
    github.status !== 'authenticated'
      ? commandRecommendation({
          id: 'gh-auth-login',
          label: 'GitHub login',
          command: 'gh auth login',
          description: 'Start GitHub CLI authentication if needed.',
          group: 'Inspect'
        })
      : null,
    github.status === 'authenticated' && github.ci?.status !== 'available'
      ? commandRecommendation({
          id: 'gh-run-list',
          label: 'Check CI',
          command: 'gh run list --limit 5',
          description: 'Inspect recent GitHub Actions runs.',
          group: 'Verify'
        })
      : null,
    commandRecommendation({
      id: 'check',
      label: 'Static check',
      command: 'pnpm check',
      description: 'Run repository syntax checks.',
      group: 'Verify'
    }),
    commandRecommendation({
      id: 'test',
      label: 'Tests',
      command: 'pnpm test',
      description: 'Run the repository test suite.',
      group: 'Verify'
    }),
    ...realCli.adapters
      .filter((adapter) => adapter.status !== 'available')
      .map((adapter) => commandRecommendation({
        id: `check-${adapter.adapterId}`,
        label: `Check ${adapter.displayName}`,
        command: adapter.command,
        description: 'Confirm whether this optional real CLI is installed.',
        group: 'Real-agent gates'
      })),
    commandRecommendation({
      id: 'real-codex',
      label: 'Real Codex gate',
      command: 'MCAS_RUN_REAL_CODEX=1 symphony do --real codex "inspect README"',
      description: 'External execution example; copy only and run intentionally.',
      group: 'Real-agent gates'
    }),
    commandRecommendation({
      id: 'real-claude',
      label: 'Real Claude gate',
      command: 'MCAS_RUN_REAL_CLAUDE=1 symphony do --real claude "inspect README"',
      description: 'External execution example; copy only and run intentionally.',
      group: 'Real-agent gates'
    }),
    commandRecommendation({
      id: 'real-kiro',
      label: 'Real Kiro gate',
      command: 'MCAS_RUN_REAL_KIRO=1 symphony do --real kiro "inspect README"',
      description: 'External execution example; copy only and run intentionally.',
      group: 'Real-agent gates'
    })
  ]);
}

function commandRecommendation({ id, label, command, description, group }) {
  return {
    id,
    label,
    command,
    description,
    group: group ?? commandGroupFor(command),
    mode: 'copy-only'
  };
}

function dedupeCommands(commands) {
  const seen = new Set();
  const deduped = [];

  for (const command of commands) {
    if (command === null || seen.has(command.command)) {
      continue;
    }

    seen.add(command.command);
    deduped.push(command);
  }

  return deduped;
}

function groupCommands(commands) {
  const grouped = new Map(COMMAND_GROUP_ORDER.map((group) => [group, []]));

  for (const command of dedupeCommands(commands)) {
    const group = command.group ?? commandGroupFor(command.command);

    if (!grouped.has(group)) {
      grouped.set(group, []);
    }

    grouped.get(group).push({
      ...command,
      group
    });
  }

  return [...grouped.entries()]
    .filter(([, groupCommands]) => groupCommands.length > 0)
    .map(([group, groupCommands]) => ({
      group,
      commands: groupCommands
    }));
}

function commandGroupFor(command) {
  const value = String(command ?? '');

  if (/MCAS_RUN_REAL_|--real/u.test(value)) {
    return 'Real-agent gates';
  }

  if (/\badopt\b/u.test(value)) {
    return 'Adoptions';
  }

  if (/artifacts?/u.test(value)) {
    return 'Artifacts';
  }

  if (/\b(check|test|verify|audit|diff --check)\b/u.test(value)) {
    return 'Verify';
  }

  return 'Inspect';
}

function normalizeRunFilter(filter) {
  return RUN_FILTERS.includes(filter) ? filter : 'all';
}

function filterRuns(runs, filter) {
  const normalized = normalizeRunFilter(filter);

  if (normalized === 'all') {
    return runs;
  }

  return runs.filter((run) => runMatchesFilter(run, normalized));
}

function runMatchesFilter(run, filter) {
  if (filter === 'passed') {
    return run.status === 'passed' || run.verifierStatus === 'passed';
  }

  if (filter === 'failed') {
    return run.status === 'failed' || run.verifierStatus === 'failed';
  }

  if (filter === 'dry-run') {
    return run.safetyMode === 'dry-run' || run.executionMode === 'dry-run';
  }

  if (filter === 'real') {
    return run.executionMode === 'real';
  }

  if (filter === 'scan') {
    return run.semanticCommand === 'scan' || run.intent === 'scan-project' || /\bscan\b/u.test(run.command ?? '');
  }

  if (filter === 'verify') {
    return run.semanticCommand === 'verify' || run.intent === 'verify' || /\b(verify|qa)\b/u.test(run.command ?? '');
  }

  if (filter === 'adoption') {
    return run.semanticCommand === 'adopt'
      || run.intent === 'adopt'
      || run.adoptionPlanId !== undefined
      || run.adoptionJournalArtifactPath !== undefined
      || (Array.isArray(run.pipeline) && run.pipeline.some((step) => /^adopt/u.test(step)));
  }

  return true;
}

async function buildPackageManagerReadiness({ runner, cwd, env, timeoutMs }) {
  const check = await runFirstReadinessCommand({
    runner,
    candidates: executableCandidates({
      executable: 'pnpm',
      env
    }),
    args: ['--version'],
    cwd,
    timeoutMs
  });

  return stripUndefined({
    name: 'pnpm',
    status: check.status === 'passed' ? 'available' : 'unavailable',
    version: check.status === 'passed' ? firstOutputLine(check) : undefined,
    command: 'pnpm --version',
    message: check.status === 'passed' ? undefined : commandFailureMessage(check)
  });
}

async function buildGitReadiness({ runner, cwd, timeoutMs }) {
  const inside = await runReadinessCommand({
    runner,
    executable: 'git',
    args: ['rev-parse', '--is-inside-work-tree'],
    cwd,
    timeoutMs
  });

  if (inside.status !== 'passed' || firstOutputLine(inside) !== 'true') {
    return {
      status: 'unavailable',
      message: commandFailureMessage(inside) ?? 'not inside a git worktree'
    };
  }

  const [branch, head, status] = await Promise.all([
    runReadinessCommand({
      runner,
      executable: 'git',
      args: ['branch', '--show-current'],
      cwd,
      timeoutMs
    }),
    runReadinessCommand({
      runner,
      executable: 'git',
      args: ['rev-parse', '--short', 'HEAD'],
      cwd,
      timeoutMs
    }),
    runReadinessCommand({
      runner,
      executable: 'git',
      args: ['status', '--porcelain'],
      cwd,
      timeoutMs
    })
  ]);
  const dirtyPaths = parseGitStatusDirtyPaths(status.stdout);
  const dirtyFilesCount = dirtyPaths.length;

  return stripUndefined({
    status: 'available',
    branch: firstOutputLine(branch) || 'detached',
    head: firstOutputLine(head) || undefined,
    dirty: dirtyFilesCount > 0,
    dirtyFilesCount,
    dirtyPaths,
    command: 'git status --short'
  });
}

async function buildGithubReadiness({ runner, cwd, env, timeoutMs }) {
  const auth = await runFirstReadinessCommand({
    runner,
    candidates: executableCandidates({
      executable: 'gh',
      env
    }),
    args: ['auth', 'status'],
    cwd,
    timeoutMs
  });
  const authOutput = commandOutput(auth);

  if (auth.status !== 'passed') {
    return stripUndefined({
      status: auth.error?.code === 'ENOENT' ? 'unavailable' : 'unauthenticated',
      account: parseGithubAccount(authOutput),
      authStatus: auth.status,
      message: commandFailureMessage(auth),
      ci: {
        status: 'skipped',
        reason: 'GitHub auth is not available'
      }
    });
  }

  const ci = await runFirstReadinessCommand({
    runner,
    candidates: [auth.executable],
    args: [
      'run',
      'list',
      '--limit',
      '1',
      '--json',
      'status,conclusion,workflowName,displayTitle,headBranch,headSha,createdAt,databaseId'
    ],
    cwd,
    timeoutMs
  });

  return stripUndefined({
    status: 'authenticated',
    account: parseGithubAccount(authOutput),
    authStatus: 'passed',
    ci: buildGithubCiReadiness(ci)
  });
}

function buildGithubCiReadiness(check) {
  if (check.status !== 'passed') {
    return {
      status: 'unavailable',
      message: commandFailureMessage(check)
    };
  }

  const parsed = parseJsonPreview(check.stdout);
  const latest = Array.isArray(parsed) ? parsed[0] : undefined;

  if (latest === undefined) {
    return {
      status: 'empty',
      latest: null
    };
  }

  return {
    status: 'available',
    latest: stripUndefined({
      databaseId: latest.databaseId,
      workflowName: latest.workflowName,
      displayTitle: latest.displayTitle,
      status: latest.status,
      conclusion: latest.conclusion,
      headBranch: latest.headBranch,
      headSha: latest.headSha,
      createdAt: latest.createdAt
    })
  };
}

async function buildRealCliReadiness({ runner, cwd, env, timeoutMs }) {
  const adapters = await Promise.all(REAL_CLI_DOCTOR_ADAPTERS.map(async (definition) => {
    const version = await runReadinessCommand({
      runner,
      executable: definition.executable,
      args: definition.versionArgs,
      cwd,
      timeoutMs
    });
    const available = version.status === 'passed';
    const gateEnabled = env[definition.gateEnv] === '1';

    return stripUndefined({
      adapterId: definition.adapterId,
      displayName: definition.displayName,
      executable: definition.executable,
      status: available ? 'available' : 'unavailable',
      version: available ? firstOutputLine(version) : undefined,
      gate: {
        envName: definition.gateEnv,
        status: gateEnabled ? 'enabled' : 'not-enabled'
      },
      modelInvocation: false,
      command: `${definition.executable} ${definition.versionArgs.join(' ')}`
    });
  }));

  return {
    status: adapters.some((adapter) => adapter.status === 'available') ? 'available' : 'unavailable',
    adapters
  };
}

function buildReadinessChecks({ node, packageManager, git, github, realCli }) {
  return [
    readinessCheck({
      id: 'node',
      label: 'Node.js',
      status: node.status === 'available' ? 'ok' : 'attention',
      detail: node.version
    }),
    readinessCheck({
      id: 'pnpm',
      label: 'pnpm',
      status: packageManager.status === 'available' ? 'ok' : 'attention',
      detail: packageManager.version ?? packageManager.message
    }),
    readinessCheck({
      id: 'git',
      label: 'Git worktree',
      status: git.status === 'available' && !git.dirty ? 'ok' : 'attention',
      detail: git.status === 'available'
        ? `${git.branch} @ ${git.head ?? 'unknown'}${git.dirty ? `, ${git.dirtyFilesCount} dirty` : ', clean'}`
        : git.message
    }),
    readinessCheck({
      id: 'github',
      label: 'GitHub',
      status: github.status === 'authenticated' ? 'ok' : 'optional',
      detail: github.account ?? github.message ?? github.status
    }),
    readinessCheck({
      id: 'real-cli',
      label: 'Real CLI gates',
      status: realCli.adapters.some((adapter) => adapter.gate.status === 'enabled') ? 'ok' : 'optional',
      detail: `${realCli.adapters.filter((adapter) => adapter.status === 'available').length}/${realCli.adapters.length} available`
    })
  ];
}

function readinessCheck({ id, label, status, detail }) {
  return stripUndefined({
    id,
    label,
    status,
    detail
  });
}

function buildReadinessRiskSummary({ packageManager, git, github, realCli }) {
  const items = [];

  if (packageManager.status !== 'available') {
    items.push(riskItem({
      id: 'missing_tool:pnpm',
      category: 'missing_tools',
      severity: 'high',
      title: 'pnpm unavailable',
      detail: packageManager.message ?? 'pnpm could not be executed.',
      command: 'corepack enable'
    }));
  }

  if (git.status !== 'available') {
    items.push(riskItem({
      id: 'missing_tool:git',
      category: 'missing_tools',
      severity: 'high',
      title: 'Git unavailable',
      detail: git.message ?? 'git worktree status could not be read.',
      command: 'git rev-parse --is-inside-work-tree'
    }));
  }

  if (git.status === 'available' && git.dirty) {
    items.push(riskItem({
      id: 'dirty_git',
      category: 'dirty_git',
      severity: 'medium',
      title: 'Dirty git worktree',
      detail: `${git.dirtyFilesCount} dirty file(s) may affect run trust.`,
      command: 'git status --short'
    }));
  }

  if (github.status !== 'authenticated') {
    items.push(riskItem({
      id: 'github_auth',
      category: 'missing_tools',
      severity: 'low',
      title: 'GitHub auth unavailable',
      detail: github.message ?? github.status,
      command: 'gh auth status'
    }));
  }

  if (github.status === 'authenticated' && github.ci?.status === 'unavailable') {
    items.push(riskItem({
      id: 'github_ci',
      category: 'missing_tools',
      severity: 'medium',
      title: 'GitHub CI unavailable',
      detail: github.ci.message ?? 'recent workflow status could not be read.',
      command: 'gh run list --limit 5'
    }));
  }

  for (const adapter of realCli.adapters) {
    if (adapter.status !== 'available') {
      items.push(riskItem({
        id: `missing_tool:${adapter.adapterId}`,
        category: 'missing_tools',
        severity: 'low',
        title: `${adapter.displayName} unavailable`,
        detail: `${adapter.executable} was not available for optional real-agent checks.`,
        command: adapter.command
      }));
    }
  }

  return summarizeRiskItems(items);
}

function riskItem({ id, category, severity, title, detail, command, runId, dirtyPaths, dirtyPathCount }) {
  return stripUndefined({
    id,
    category,
    severity,
    title,
    detail,
    dirtyPaths,
    dirtyPathCount,
    command: commandRecommendation({
      id,
      label: title,
      command,
      description: detail,
      group: commandGroupFor(command)
    }),
    runId
  });
}

function summarizeRiskItems(items) {
  const counts = {
    high: items.filter((item) => item.severity === 'high').length,
    medium: items.filter((item) => item.severity === 'medium').length,
    low: items.filter((item) => item.severity === 'low').length
  };

  return {
    status: items.length === 0 ? 'ok' : 'attention',
    total: items.length,
    counts,
    items
  };
}

async function runFirstReadinessCommand({
  runner,
  candidates,
  args,
  cwd,
  timeoutMs
}) {
  let lastCheck;

  for (const executable of candidates) {
    const check = await runReadinessCommand({
      runner,
      executable,
      args,
      cwd,
      timeoutMs
    });

    lastCheck = {
      ...check,
      executable
    };

    if (check.status === 'passed' || !isMissingExecutable(check)) {
      return lastCheck;
    }
  }

  return lastCheck;
}

function executableCandidates({ executable, env }) {
  const home = env.HOME;
  const candidates = [executable];

  if (executable === 'pnpm') {
    candidates.push(
      ...[
        env.PNPM_HOME ? `${env.PNPM_HOME}/pnpm` : undefined,
        home ? `${home}/Library/pnpm/pnpm` : undefined,
        home ? `${home}/.local/bin/pnpm` : undefined
      ].filter(Boolean)
    );
  }

  if (executable === 'gh') {
    candidates.push(
      ...[
        home ? `${home}/.local/bin/gh` : undefined,
        '/opt/homebrew/bin/gh',
        '/usr/local/bin/gh'
      ].filter(Boolean)
    );
  }

  return [...new Set(candidates)];
}

async function runReadinessCommand({
  runner,
  executable,
  args,
  cwd,
  timeoutMs
}) {
  try {
    const result = await runner.run({
      executable,
      args,
      cwd,
      timeoutMs
    });

    return {
      status: result.exitCode === 0 ? 'passed' : 'failed',
      exitCode: result.exitCode,
      stdout: redactSecrets(result.stdout ?? ''),
      stderr: redactSecrets(result.stderr ?? '')
    };
  } catch (error) {
    return {
      status: 'failed',
      exitCode: null,
      stdout: '',
      stderr: '',
      error: {
        code: error.code,
        message: redactSecrets(error.message)
      }
    };
  }
}

function isMissingExecutable(check) {
  return check.error?.code === 'ENOENT' || /ENOENT/u.test(check.error?.message ?? '');
}

function commandFailureMessage(check) {
  if (check.error?.message) {
    return check.error.message;
  }

  return firstOutputLine(check) || undefined;
}

function firstOutputLine(check) {
  return checkOutputLines(check)[0] ?? '';
}

function checkOutputLines(check) {
  return commandOutput(check)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

function parseGitStatusDirtyPaths(output) {
  return [...new Set(String(output ?? '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line !== '')
    .flatMap((line) => {
      const pathPart = line.slice(3).trim();

      if (pathPart.includes(' -> ')) {
        return pathPart.split(' -> ').map((path) => path.trim()).filter(Boolean);
      }

      return pathPart === '' ? [] : [pathPart];
    }))]
    .sort();
}

function commandOutput(check) {
  return redactSecrets(`${check.stdout ?? ''}\n${check.stderr ?? ''}`);
}

function parseGithubAccount(output) {
  const accountMatch = /account\s+([^\s]+)/iu.exec(output);

  if (accountMatch !== null) {
    return accountMatch[1];
  }

  const loggedInMatch = /Logged in to [^\s]+ as ([^\s]+)/iu.exec(output);

  return loggedInMatch?.[1];
}

function writeHtmlResponse(response, html) {
  response.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(html);
}

function writeJsonResponse(response, statusCode, value) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  );
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function buildDiagnosticsCommands({ snapshot, readiness }) {
  const items = dedupeCommands([
    ...(snapshot.recommendedCommands ?? []),
    ...(readiness.recommendedCommands ?? [])
  ]);
  const groups = groupCommands(items);

  return {
    mode: 'copy-only',
    items,
    groups,
    commandGroups: groups
  };
}

function combineRiskSummaries(summaries) {
  const seen = new Set();
  const items = [];

  for (const summary of summaries) {
    for (const item of summary?.items ?? []) {
      const key = [
        item.id,
        item.runId ?? '',
        item.title ?? '',
        item.detail ?? ''
      ].join('\0');

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      items.push(item);
    }
  }

  return summarizeRiskItems(items);
}

function emptyRiskSummary() {
  return summarizeRiskItems([]);
}

function diagnosticsStatus({ snapshot, readiness, risks }) {
  if ((snapshot.runStats?.total ?? snapshot.runs?.length ?? 0) === 0) {
    return 'no-runs';
  }

  if ((risks.counts?.high ?? 0) > 0 || requiredReadinessMissing(readiness)) {
    return 'attention';
  }

  return 'ready';
}

function requiredReadinessMissing(readiness) {
  return readiness.tools?.packageManager?.status !== 'available'
    || readiness.tools?.git?.status !== 'available';
}

function buildDiagnosticsAction({ status, snapshot, risks, commands }) {
  if (status === 'no-runs') {
    return {
      next: 'symphony scan',
      mode: 'copy-only'
    };
  }

  const highRiskCommand = risks.items
    ?.find((risk) => risk.severity === 'high' && isNonEmptyString(risk.command?.command))
    ?.command
    ?.command;

  return {
    next: highRiskCommand
      ?? snapshot.action?.next
      ?? commands.items?.[0]?.command
      ?? 'symphony status',
    mode: 'copy-only'
  };
}

function appendTextCommandGroups(lines, commandGroups) {
  if (!Array.isArray(commandGroups) || commandGroups.length === 0) {
    lines.push('- No commands available.');
    return;
  }

  for (const group of commandGroups) {
    lines.push(`${formatTextValue(group.group)}:`);
    for (const command of group.commands ?? []) {
      lines.push(`- ${formatTextValue(command.label ?? 'Command')}: ${formatTextValue(command.command)} (${formatTextValue(command.mode ?? 'copy-only')})`);
    }
  }
}

function formatTextValue(value) {
  if (value === undefined || value === null || value === '') {
    return 'unknown';
  }

  return String(redactSecrets(value));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function statusBadge(value) {
  const text = String(value ?? 'unknown');
  const statusClass = text.includes(':') ? text.split(':').at(-1) : text;

  return `<span class="badge ${escapeHtml(statusClass)}">${escapeHtml(text)}</span>`;
}

function metricsGrid(metrics) {
  return `<div class="metric-grid">${metrics.map(([label, value]) => `
    <div class="metric">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value ?? 'unknown')}</div>
    </div>`).join('')}
  </div>`;
}

function renderLatestRun(run) {
  if (run === null) {
    return '<div class="empty">No run states found yet. Copy symphony scan to create the first read-only project context.</div>';
  }

  return `
    ${metricsGrid([
      ['Run ID', run.runId],
      ['Command', run.command ?? run.semanticCommand],
      ['Status', run.status],
      ['Verifier', run.verifierStatus ?? 'unknown'],
      ['Safety', run.safetyMode ?? 'unknown'],
      ['Execution', run.executionMode ?? 'unknown'],
      ['Artifacts', artifactStatusLabel({}, run)],
      ['Updated', run.updatedAt ?? run.createdAt ?? 'unknown']
    ])}`;
}

function renderRecentRuns(runs) {
  if (!Array.isArray(runs) || runs.length === 0) {
    return '<div class="empty">No recent runs are available.</div>';
  }

  return `<table>
    <thead>
      <tr>
        <th>Run</th>
        <th>Status</th>
        <th>Verifier</th>
        <th>Artifacts</th>
        <th>Updated</th>
      </tr>
    </thead>
    <tbody>
      ${runs.map((run) => `<tr>
        <td>${escapeHtml(run.runId)}</td>
        <td>${escapeHtml(run.status ?? 'unknown')}</td>
        <td>${escapeHtml(run.verifierStatus ?? 'unknown')}</td>
        <td>${escapeHtml(run.artifactStatus ?? 'unknown')}</td>
        <td>${escapeHtml(run.updatedAt ?? 'unknown')}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function renderArtifactHealth(runStats, latestRun) {
  const artifacts = runStats.artifacts ?? {};
  const latestArtifactStatus = latestRun?.artifactStatus;

  return metricsGrid([
    ['Overall', artifactStatusLabel(runStats, latestRun)],
    ['Registered', artifacts.registered ?? latestRun?.artifactHealth?.total ?? 0],
    ['Missing', artifacts.missing ?? latestArtifactStatus?.missing ?? 0],
    ['Runs with missing', artifacts.runsWithMissing ?? ((latestArtifactStatus?.missing ?? 0) > 0 ? 1 : 0)]
  ]);
}

function artifactStatusLabel(runStats, latestRun) {
  return runStats.artifacts?.status
    ?? latestRun?.artifactStatus?.status
    ?? latestRun?.artifactHealth?.status
    ?? 'empty';
}

function renderRiskList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<div class="empty">No visible risks in this diagnostics report.</div>';
  }

  return `<div class="risk-list">${items.map((risk) => `
    <div class="risk ${escapeHtml(risk.severity ?? 'low')}">
      <div class="risk-title">${escapeHtml(risk.title)} ${statusBadge(risk.severity ?? 'low')}</div>
      <div class="muted">${escapeHtml([risk.runId, risk.detail].filter(Boolean).join(': '))}</div>
      ${risk.command?.command ? `<code class="command-code">${escapeHtml(risk.command.command)}</code>` : ''}
    </div>`).join('')}
  </div>`;
}

function renderReadinessChecks(checks) {
  if (!Array.isArray(checks) || checks.length === 0) {
    return '<div class="empty">Readiness checks are unavailable.</div>';
  }

  return `<div class="check-list">${checks.map((check) => `
    <div class="check-row">
      <div class="command-title">${escapeHtml(check.label)} ${statusBadge(check.status ?? 'unknown')}</div>
      <div class="muted">${escapeHtml(check.detail ?? '')}</div>
    </div>`).join('')}
  </div>`;
}

function renderCommandGroups(commandGroups) {
  if (!Array.isArray(commandGroups) || commandGroups.length === 0) {
    return '<div class="empty">No copy-only commands are available.</div>';
  }

  return `<div class="command-list">${commandGroups.map((group) => `
    <div>
      <h3>${escapeHtml(group.group)}</h3>
      ${(group.commands ?? []).map((command) => `
        <div class="command">
          <div class="command-title">${escapeHtml(command.label ?? 'Command')}</div>
          <code class="command-code">${escapeHtml(command.command)}</code>
          <div class="muted">${escapeHtml(command.description ?? command.mode ?? 'copy-only')}</div>
        </div>`).join('')}
    </div>`).join('')}
  </div>`;
}

function renderConsoleHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Symphony Workbench</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7fa;
      --panel: #ffffff;
      --text: #20242c;
      --muted: #5f6b7a;
      --line: #d9dee7;
      --accent: #0d6b57;
      --accent-soft: #e5f3ee;
      --warn: #9b6b1f;
      --warn-soft: #fff5dc;
      --danger: #a53d2d;
      --danger-soft: #fae8e4;
      --ok: #1f7a4f;
      --ok-soft: #e3f4ec;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-size: 14px;
      letter-spacing: 0;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: 64px;
      padding: 14px 24px;
      background: var(--panel);
      border-bottom: 1px solid var(--line);
    }

    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 650;
    }

    .subtitle {
      margin: 3px 0 0;
      color: var(--muted);
      font-size: 12px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    main {
      display: grid;
      grid-template-columns: 220px minmax(0, 1fr);
      gap: 0;
      min-height: calc(100vh - 64px);
    }

    aside {
      border-right: 1px solid var(--line);
      background: #eef2f5;
      padding: 16px;
      overflow: auto;
    }

    section {
      padding: 20px 24px;
      overflow: auto;
    }

    .view-tabs {
      display: grid;
      gap: 8px;
      margin-bottom: 16px;
    }

    .view-tab {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
      min-height: 38px;
    }

    .view-tab[aria-current="true"] {
      background: var(--accent-soft);
    }

    .view {
      display: none;
    }

    .view.active {
      display: block;
    }

    .view-header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }

    .view-title {
      margin: 0;
      font-size: 22px;
      font-weight: 680;
    }

    .overview-grid,
    .split-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
      gap: 16px;
      align-items: start;
    }

    .compact-panel {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      padding: 14px;
      margin-bottom: 16px;
    }

    .compact-panel h2 {
      margin-bottom: 12px;
    }

    #side-summary dl {
      grid-template-columns: 1fr;
      gap: 4px;
      margin-bottom: 0;
    }

    #side-summary dd {
      font-weight: 650;
    }

    button {
      min-height: 34px;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      border-radius: 6px;
      padding: 0 10px;
      cursor: pointer;
      font: inherit;
    }

    button:hover,
    button[aria-current="true"] {
      border-color: var(--accent);
      color: var(--accent);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 0 10px;
      background: var(--panel);
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }

    .dashboard {
      display: grid;
      gap: 10px;
      margin-bottom: 18px;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .metric {
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      padding: 10px;
    }

    .metric-label {
      color: var(--muted);
      font-size: 12px;
    }

    .metric-value {
      margin-top: 4px;
      font-weight: 650;
      overflow-wrap: anywhere;
    }

    .command-list {
      display: grid;
      gap: 8px;
      margin: 0 0 18px;
    }

    .command-group {
      display: grid;
      gap: 8px;
    }

    .command-group h3,
    .detail-section h3 {
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      font-weight: 650;
      text-transform: uppercase;
    }

    .command-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: start;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      padding: 10px;
    }

    .command-title {
      font-weight: 650;
    }

    .command-code {
      display: block;
      margin-top: 4px;
      color: #354052;
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      overflow-wrap: anywhere;
    }

    .run-list {
      display: grid;
      gap: 8px;
    }

    .adoption-list {
      display: grid;
      gap: 8px;
    }

    .filter-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 0 0 12px;
    }

    .filter-list button {
      min-height: 30px;
      font-size: 12px;
    }

    .run-button {
      width: 100%;
      display: grid;
      gap: 4px;
      text-align: left;
      padding: 10px;
    }

    .adoption-button {
      width: 100%;
      display: grid;
      gap: 4px;
      text-align: left;
      padding: 10px;
    }

    .run-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      color: var(--muted);
      font-size: 12px;
    }

    .empty-state {
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      overflow-wrap: anywhere;
    }

    .stack {
      display: grid;
      gap: 12px;
      margin: 0 0 18px;
    }

    .risk-list {
      display: grid;
      gap: 8px;
      margin: 0 0 18px;
    }

    .risk-row {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      padding: 10px;
      overflow-wrap: anywhere;
    }

    .risk-row.high {
      border-color: var(--danger);
      background: var(--danger-soft);
    }

    .risk-row.medium {
      border-color: var(--warn);
      background: var(--warn-soft);
    }

    .risk-row.low {
      border-color: var(--line);
      background: var(--panel);
    }

    .preview-panel {
      margin-top: 18px;
    }

    .section-block {
      margin: 0 0 18px;
    }

    .detail-section {
      margin: 0 0 22px;
    }

    h2 {
      margin: 0 0 10px;
      font-size: 14px;
      font-weight: 650;
    }

    .muted {
      color: var(--muted);
    }

    .status {
      font-weight: 650;
    }

    .ok,
    .done,
    .passed {
      color: var(--ok);
    }

    .attention,
    .pending,
    .optional {
      color: var(--warn);
    }

    .failed,
    .error {
      color: var(--danger);
    }

    .timeline {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .timeline li {
      display: grid;
      grid-template-columns: 12px minmax(0, 1fr);
      gap: 10px;
      align-items: start;
    }

    .timeline-marker {
      width: 10px;
      height: 10px;
      margin-top: 5px;
      border-radius: 999px;
      background: var(--line);
    }

    .timeline-marker.done {
      background: var(--ok);
    }

    .timeline-marker.failed {
      background: var(--danger);
    }

    .timeline-marker.pending {
      background: var(--warn);
    }

    .inline {
      min-height: 28px;
      padding: 0 8px;
    }

    pre {
      margin: 18px 0 0;
      max-height: 46vh;
      overflow: auto;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #151a21;
      color: #e7edf6;
      font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    dl {
      display: grid;
      grid-template-columns: 150px minmax(0, 1fr);
      gap: 10px 14px;
      margin: 0 0 22px;
    }

    dt {
      color: var(--muted);
    }

    dd {
      margin: 0;
      min-width: 0;
      overflow-wrap: anywhere;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border: 1px solid var(--line);
    }

    th,
    td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
      overflow-wrap: anywhere;
    }

    th {
      color: var(--muted);
      font-weight: 600;
      background: #f0f3f8;
    }

    tr[aria-current="true"] {
      background: #edf7f3;
    }

    .file-list {
      margin: 0;
      padding: 0;
      list-style: none;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
    }

    .file-list li {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 9px 12px;
      border-bottom: 1px solid var(--line);
      overflow-wrap: anywhere;
    }

    .file-list li:last-child {
      border-bottom: 0;
    }

    @media (max-width: 780px) {
      main {
        grid-template-columns: 1fr;
      }

      aside {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      dl {
        grid-template-columns: 1fr;
      }

      .overview-grid,
      .split-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Symphony Workbench</h1>
      <p class="subtitle">本地只读控制台，用于查看运行、产物、就绪状态和下一步命令。</p>
    </div>
    <div class="header-actions">
      <span class="badge">只读</span>
      <button id="refresh" type="button">刷新</button>
    </div>
  </header>
  <main>
    <aside>
      <nav id="view-tabs" class="view-tabs" aria-label="Workbench 分区">
        <button class="view-tab" type="button" data-view="overview">总览</button>
        <button class="view-tab" type="button" data-view="adoptions">采纳</button>
        <button class="view-tab" type="button" data-view="runs">运行</button>
        <button class="view-tab" type="button" data-view="diagnostics">诊断</button>
        <button class="view-tab" type="button" data-view="artifacts">产物</button>
      </nav>
      <div id="side-summary" class="stack"></div>
    </aside>
    <section>
      <div id="overview-view" class="view active">
        <div class="view-header">
          <div>
            <h2 class="view-title">总览</h2>
            <div id="overview-headline" class="muted">正在加载总览...</div>
          </div>
          <span id="overview-status" class="badge">加载中</span>
        </div>
        <div class="overview-grid">
          <div>
            <div class="compact-panel">
              <h2>最新状态</h2>
              <div id="dashboard" class="dashboard">正在加载...</div>
            </div>
            <div class="compact-panel">
              <h2>当前下一步</h2>
              <div id="commands" class="command-list"></div>
            </div>
          </div>
          <div>
            <div class="compact-panel" id="adoption-banner"></div>
            <div class="compact-panel">
              <h2>前三风险</h2>
              <div id="risk-panel" class="risk-list"></div>
            </div>
          </div>
        </div>
      </div>
      <div id="adoptions-view" class="view">
        <div class="view-header">
          <div>
            <h2 class="view-title">采纳</h2>
            <div class="muted">已冻结补丁计划、日志、恢复状态和仅复制命令。</div>
          </div>
        </div>
        <div class="split-grid">
          <div id="adoptions" class="adoption-list"></div>
          <div id="adoption-detail"></div>
        </div>
      </div>
      <div id="runs-view" class="view">
        <div class="view-header">
          <div>
            <h2 class="view-title">运行记录</h2>
            <div class="muted">历史运行状态和所选运行详情。</div>
          </div>
        </div>
        <div class="split-grid">
          <div>
            <div id="run-filters" class="filter-list"></div>
            <div id="runs" class="run-list"></div>
          </div>
          <div id="details" class="muted">正在加载运行详情...</div>
        </div>
      </div>
      <div id="diagnostics-view" class="view">
        <div class="view-header">
          <div>
            <h2 class="view-title">诊断</h2>
            <div class="muted">完整本地健康模型、就绪状态、风险和仅复制命令分组。</div>
          </div>
        </div>
        <div id="diagnostics"></div>
      </div>
      <div id="artifacts-view" class="view">
        <div class="view-header">
          <div>
            <h2 class="view-title">产物</h2>
            <div class="muted">已登记产物引用和有边界预览。</div>
          </div>
        </div>
        <div id="artifact-workspace"></div>
      </div>
    </section>
  </main>
  <script>
    const state = {
      snapshot: null,
      readiness: null,
      activeView: 'overview',
      selectedRunId: null,
      selectedAdoptionId: null,
      selectedArtifactKind: null,
      artifactPreview: null,
      adoptionInspection: null,
      runFilter: 'all'
    };

    document.getElementById('refresh').addEventListener('click', () => loadSnapshot());
    document.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeView = button.dataset.view;
        render();
      });
    });
    loadSnapshot();

    async function loadSnapshot() {
      const responses = await Promise.all([
        fetch('/api/summary', { cache: 'no-store' }),
        fetch('/api/readiness', { cache: 'no-store' })
      ]);
      state.snapshot = await responses[0].json();
      state.readiness = responses[1].ok
        ? await responses[1].json()
        : {
            status: 'attention',
            checks: [],
            recommendedCommands: []
          };
      const selectedExists = state.snapshot.runs.some((run) => run.runId === state.selectedRunId);
      if (!selectedExists) {
        state.selectedRunId = state.snapshot.latestRun?.runId || null;
        state.selectedArtifactKind = null;
        state.artifactPreview = null;
      }
      const selectedAdoptionExists = (state.snapshot.adoptionPlans || [])
        .some((plan) => plan.adoptionPlanId === state.selectedAdoptionId);
      if (!selectedAdoptionExists) {
        state.selectedAdoptionId = (state.snapshot.adoptionPlans || [])[0]?.adoptionPlanId || null;
        state.adoptionInspection = null;
      }
      if (state.selectedAdoptionId) {
        await loadAdoptionInspection(state.selectedAdoptionId, { renderAfter: false });
      }
      enrichSnapshotWithReadiness();
      render();
    }

    function render() {
      renderNavigation();
      renderSideSummary();
      renderViewVisibility();
      renderDashboard();
      renderAdoptionBanner();
      renderRiskPanel();
      renderCommands();
      renderAdoptions();
      renderRunFilters();
      renderRuns();
      renderDetails();
      renderDiagnosticsView();
      renderArtifactWorkspace();
    }

    function renderNavigation() {
      document.querySelectorAll('[data-view]').forEach((button) => {
        button.setAttribute('aria-current', String(button.dataset.view === state.activeView));
      });
    }

    function renderViewVisibility() {
      document.querySelectorAll('.view').forEach((view) => {
        view.classList.toggle('active', view.id === state.activeView + '-view');
      });
    }

    function renderSideSummary() {
      const side = document.getElementById('side-summary');
      const overview = state.snapshot?.overview || {};
      const adoption = state.snapshot?.adoptionSummary || {};
      const readiness = state.readiness || {};
      side.replaceChildren(
        compactSummaryBlock('状态', [
          ['总体', overview.status || state.snapshot?.status],
          ['采纳', adoption.status || 'clear'],
          ['就绪状态', readiness.status || 'unknown']
        ]),
        compactSummaryBlock('仅复制', [
          ['下一步', overview.nextAction || state.snapshot?.action?.next || 'symphony scan']
        ])
      );
    }

    function compactSummaryBlock(title, rows) {
      const block = document.createElement('div');
      block.className = 'compact-panel';
      const heading = document.createElement('h2');
      heading.textContent = title;
      block.append(heading, definitionList(rows));
      return block;
    }

    function enrichSnapshotWithReadiness() {
      const adoption = {
        ...(state.snapshot.adoptionSummary || {})
      };
      const pendingCount = adoption.pendingCount || 0;
      const gitDirty = state.readiness?.tools?.git?.dirty === true;

      if (pendingCount > 0 && gitDirty) {
        adoption.dirtyBlocked = true;
        adoption.status = 'dirty-blocked';
      }

      state.snapshot.adoptionSummary = adoption;

      const overview = {
        ...(state.snapshot.overview || {})
      };
      const dirtyRisk = adoption.dirtyBlocked
        ? {
            id: 'dirty_worktree_blocks_adoption',
            category: 'dirty_worktree_blocks_adoption',
            severity: 'high',
            title: '脏工作区阻塞采纳',
            detail: '待采纳内容需要先清理非 Symphony 工作区变更，再执行确认。',
            command: {
              command: 'git status --short',
              mode: 'copy-only'
            }
          }
        : null;
      const risks = dirtyRisk
        ? dedupeRisks([dirtyRisk, ...(overview.topRisks || [])]).slice(0, 3)
        : (overview.topRisks || []).slice(0, 3);

      state.snapshot.overview = {
        ...overview,
        status: adoption.dirtyBlocked ? 'blocked' : overview.status,
        headline: adoption.dirtyBlocked ? '脏工作区阻塞采纳。' : overview.headline,
        topRisks: risks,
        nextAction: adoption.dirtyBlocked ? 'git status --short' : overview.nextAction
      };
    }

    function renderDashboard() {
      const dashboard = document.getElementById('dashboard');
      const snapshot = state.snapshot;
      const readiness = state.readiness;
      const latest = snapshot.latestRun;
      const overview = snapshot.overview || {};
      const stats = snapshot.runStats || {};
      const overviewStatus = document.getElementById('overview-status');
      const overviewHeadline = document.getElementById('overview-headline');
      overviewStatus.textContent = formatValue(overview.status || snapshot.status);
      overviewStatus.className = 'badge ' + (overview.status || '');
      overviewHeadline.textContent = headlineLabel(overview.headline) || '当前暂无总览。';
      const metrics = [
        ['状态', overview.status || snapshot.status],
        ['最新运行', latest?.runId || 'none'],
        ['最新状态', latest?.status || 'none'],
        ['运行数', stats.total ?? snapshot.runs.length],
        ['风险数', (overview.topRisks || []).length],
        ['就绪状态', readiness?.status || 'loading'],
        ['Git', readiness?.tools?.git?.status === 'available'
          ? readiness.tools.git.branch + (readiness.tools.git.dirty ? ' 有未提交变更' : ' 干净')
          : readiness?.tools?.git?.status || 'unknown']
      ];

      dashboard.replaceChildren(metricGrid(metrics), latestRunOverview(latest), compactReadinessChecks(readiness));
    }

    function metricGrid(metrics) {
      const grid = document.createElement('div');
      grid.className = 'metric-grid';
      for (const [label, value] of metrics) {
        const metric = document.createElement('div');
        metric.className = 'metric';
        const metricLabel = document.createElement('div');
        metricLabel.className = 'metric-label';
        metricLabel.textContent = label;
        const metricValue = document.createElement('div');
        metricValue.className = 'metric-value';
        metricValue.textContent = formatValue(value);
        metric.append(metricLabel, metricValue);
        grid.append(metric);
      }
      return grid;
    }

    function latestRunOverview(run) {
      if (!run) {
        return emptyState('这个状态目录里还没有最新运行。');
      }

      return definitionList([
        ['命令', run.command],
        ['验证器', run.verifierStatus],
        ['更新时间', run.updatedAt],
        ['下一步', run.nextAction]
      ]);
    }

    function compactReadinessChecks(readiness) {
      if (!readiness) {
        return emptyState('就绪检查不可用。');
      }

      return definitionList([
        ['包管理器', readiness.tools?.packageManager?.status],
        ['Git 未提交变更', formatValue(readiness.tools?.git?.dirty)],
        ['未提交文件数', readiness.tools?.git?.dirtyFilesCount],
        ['GitHub', readiness.tools?.github?.status],
        ['真实 CLI', readiness.tools?.realCli?.status]
      ]);
    }

    function renderRiskPanel() {
      const riskPanel = document.getElementById('risk-panel');
      const dedupedRisks = state.snapshot?.overview?.topRisks || [];

      if (dedupedRisks.length === 0) {
        riskPanel.replaceChildren(emptyState('当前总览中没有可见的高优先级风险。'));
        return;
      }

      riskPanel.replaceChildren(...dedupedRisks.map(riskRow));
    }

    function riskRow(risk) {
      const row = document.createElement('div');
      row.className = 'risk-row ' + (risk.severity || 'low');
      const title = document.createElement('div');
      title.className = 'command-title';
      title.textContent = [riskTitleLabel(risk), severityLabel(risk.severity)].filter(Boolean).join(' / ');
      const detail = document.createElement('div');
      detail.className = 'muted';
      detail.textContent = [risk.runId, riskDetailLabel(risk)].filter(Boolean).join(': ');
      row.append(title, detail);

      if (risk.command?.command) {
        const code = document.createElement('code');
        code.className = 'command-code';
        code.textContent = risk.command.command;
        row.append(code);
      }

      return row;
    }

    function renderCommands() {
      const commands = document.getElementById('commands');
      const nextAction = state.snapshot.overview?.nextAction || state.snapshot.action?.next;
      const allCommands = nextAction
        ? [{
            id: 'overview-next-action',
            label: 'Current next action',
            command: nextAction,
            description: 'Copy-only command from the current local state.',
            mode: 'copy-only'
          }]
        : [];

      if (allCommands.length === 0) {
        commands.replaceChildren(emptyState('当前没有推荐命令。'));
        return;
      }

      commands.replaceChildren(...groupCommands(allCommands).map(commandGroupBlock));
    }

    function commandGroupBlock(group) {
      const wrapper = document.createElement('div');
      wrapper.className = 'command-group';
      const heading = document.createElement('h3');
      heading.textContent = commandGroupLabel(group.group);
      wrapper.append(heading, ...group.commands.map(commandRow));
      return wrapper;
    }

    function commandRow(command) {
      const row = document.createElement('div');
      row.className = 'command-row';
      const body = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'command-title';
      title.textContent = commandLabel(command.label) || '命令';
      const code = document.createElement('code');
      code.className = 'command-code';
      code.textContent = command.command;
      const description = document.createElement('div');
      description.className = 'muted';
      description.textContent = commandDescription(command.description || command.mode || 'copy-only');
      body.append(title, code, description);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'inline';
      button.textContent = '复制';
      button.addEventListener('click', () => copyCommand(command.command, button));
      row.append(body, button);
      return row;
    }

    function renderAdoptionBanner() {
      const banner = document.getElementById('adoption-banner');
      const summary = state.snapshot.adoptionSummary || {};
      const title = document.createElement('h2');
      title.textContent = '采纳摘要';
      const message = document.createElement('div');
      message.className = 'command-title ' + adoptionStatusClass(summary.status);
      message.textContent = adoptionStatusLabel(summary.status);
      banner.replaceChildren(
        title,
        message,
        definitionList([
          ['待确认', summary.pendingCount ?? 0],
          ['应用中', summary.applyingCount ?? 0],
          ['应用后证据失败', summary.postApplyFailedCount ?? 0],
          ['已过期', summary.staleCount ?? 0],
          ['被脏工作区阻塞', formatValue(summary.dirtyBlocked)]
        ])
      );
    }

    function renderAdoptions() {
      const list = document.getElementById('adoptions');
      const detail = document.getElementById('adoption-detail');
      const plans = state.snapshot.adoptionPlans || [];

      if (plans.length === 0) {
        list.replaceChildren(emptyState('这个状态目录里还没有采纳计划。'));
        detail.replaceChildren(emptyState('生成采纳计划后，这里会显示采纳详情。'));
        return;
      }

      list.replaceChildren(...plans.map((plan) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'adoption-button';
        button.setAttribute('aria-current', String(plan.adoptionPlanId === state.selectedAdoptionId));
        button.addEventListener('click', async () => {
          state.selectedAdoptionId = plan.adoptionPlanId;
          await loadAdoptionInspection(plan.adoptionPlanId);
        });
        button.append(text(plan.adoptionPlanId));
        const meta = document.createElement('span');
        meta.className = 'run-meta';
        meta.textContent = [
          formatValue(adoptionStatusForPlan(plan)),
          plan.sourceRunId,
          (plan.changedFiles || []).length + ' 个文件'
        ].filter(Boolean).join(' / ');
        button.append(meta);
        return button;
      }));

      const plan = selectedAdoptionPlan();
      const journal = selectedAdoptionJournal();
      const confirmation = latestConfirmationForAdoption(plan?.adoptionPlanId);
      const inspection = state.adoptionInspection?.adoptionPlanId === plan?.adoptionPlanId
        ? state.adoptionInspection
        : null;

      if (!plan) {
        detail.replaceChildren(emptyState('选择一个采纳计划查看详情。'));
        return;
      }

      detail.replaceChildren(
        detailSection('计划',
          definitionList([
            ['采纳 ID', plan.adoptionPlanId],
            ['状态', adoptionStatusForPlan(plan)],
            ['来源运行', plan.sourceRunId],
            ['执行计划', plan.executionPlanId],
            ['变更文件数', (plan.changedFiles || []).length],
            ['补丁哈希', plan.patchHash],
            ['补丁', plan.patchArtifactPath],
            ['创建时间', plan.createdAt]
          ])
        ),
        detailSection('恢复',
          definitionList([
            ['日志', journal?.adoptionJournalArtifactPath],
            ['日志状态', journal?.status],
            ['最近确认运行', confirmation?.runId],
            ['确认状态', confirmation?.status],
            ['失败阶段', confirmation?.failurePhase],
            ['工作区匹配已采纳文件', matchLabel(inspection?.currentWorktreeMatchesAfterHash)],
            ['工作区不再匹配应用前日志', inverseMatchLabel(inspection?.currentWorktreeMatchesJournalBeforeFiles)]
          ]),
          inspection?.currentWorktreeMatchesAfterHashDetails
            ? jsonBlock('已采纳文件匹配详情', inspection.currentWorktreeMatchesAfterHashDetails)
            : emptyState('这个采纳计划暂无检查数据。可以复制下方 inspect 命令查看。')
        ),
        detailSection('仅复制命令',
          ...adoptionCommands(plan, inspection).map(commandRow)
        )
      );
    }

    async function loadAdoptionInspection(adoptionId, { renderAfter = true } = {}) {
      if (!adoptionId) return;

      const response = await fetch('/api/adoptions/' + encodeURIComponent(adoptionId) + '/inspect', { cache: 'no-store' });
      state.adoptionInspection = await response.json();

      if (renderAfter) {
        render();
      }
    }

    function adoptionCommands(plan, inspection) {
      const commands = inspection?.recommendedCommands || [];

      return dedupeCommands([
        ...commands,
        {
          id: 'inspect-adoption',
          label: 'Inspect adoption',
          command: 'symphony adopt --inspect ' + plan.adoptionPlanId + ' --json',
          description: 'Read-only inspect from the terminal.',
          mode: 'copy-only'
        },
        {
          id: 'confirm-adoption',
          label: 'Confirm adoption',
          command: plan.confirmationCommand,
          description: 'Copy-only terminal command; the browser never runs it.',
          mode: 'copy-only'
        },
        {
          id: 'diagnose',
          label: 'Diagnose',
          command: 'symphony diagnose --json',
          description: 'Show all local diagnostics.',
          mode: 'copy-only'
        },
        {
          id: 'git-status',
          label: 'Git status',
          command: 'git status --short',
          description: 'Inspect dirty worktree blockers.',
          mode: 'copy-only'
        }
      ]);
    }

    function selectedAdoptionPlan() {
      return (state.snapshot.adoptionPlans || [])
        .find((plan) => plan.adoptionPlanId === state.selectedAdoptionId)
        || (state.snapshot.adoptionPlans || [])[0]
        || null;
    }

    function selectedAdoptionJournal() {
      const plan = selectedAdoptionPlan();
      return (state.snapshot.adoptionJournals || [])
        .find((journal) => journal.adoptionPlanId === plan?.adoptionPlanId)
        || null;
    }

    function latestConfirmationForAdoption(adoptionId) {
      if (!adoptionId) return null;

      return (state.snapshot.runs || []).find((run) => run.adoptionPlanId === adoptionId
        && Array.isArray(run.pipeline)
        && run.pipeline.includes('adopt-confirm')) || null;
    }

    function adoptionStatusForPlan(plan) {
      const confirmation = latestConfirmationForAdoption(plan.adoptionPlanId);
      const journal = (state.snapshot.adoptionJournals || [])
        .find((candidate) => candidate.adoptionPlanId === plan.adoptionPlanId);

      if (confirmation?.failurePhase === 'post-apply-evidence') return 'post-apply-failed';
      if (confirmation?.status === 'applying' || journal?.status === 'applying') return 'applying';
      if (confirmation?.failurePhase === 'adoption-confirmation-preflight') return 'stale';
      if (confirmation?.status === 'passed') return 'passed';
      return 'pending';
    }

    function adoptionStatusLabel(status) {
      if (status === 'post-apply-failed') return '补丁已应用，但证据失败';
      if (status === 'applying') return '正在应用采纳';
      if (status === 'dirty-blocked') return '脏工作区阻塞采纳';
      if (status === 'stale') return '采纳计划已过期';
      if (status === 'unsupported') return '采纳变更不受支持';
      if (status === 'pending') return '采纳待确认';
      return '没有待处理采纳';
    }

    function adoptionStatusClass(status) {
      if (status === 'clear') return 'passed';
      if (status === 'pending' || status === 'unsupported') return 'attention';
      return 'failed';
    }

    function matchLabel(value) {
      if (value === true) return '工作区匹配已采纳文件';
      if (value === false) return '工作区不匹配已采纳文件';
      return '未检查';
    }

    function inverseMatchLabel(value) {
      if (value === true) return '工作区仍匹配应用前日志';
      if (value === false) return '工作区已不再匹配应用前日志';
      return '未检查';
    }

    function renderRunFilters() {
      const filters = document.getElementById('run-filters');
      const filterStats = state.snapshot.runStats?.filters || [
        { id: 'all', count: state.snapshot.runs.length },
        { id: 'passed', count: filterRuns(state.snapshot.runs, 'passed').length },
        { id: 'failed', count: filterRuns(state.snapshot.runs, 'failed').length },
        { id: 'dry-run', count: filterRuns(state.snapshot.runs, 'dry-run').length },
        { id: 'real', count: filterRuns(state.snapshot.runs, 'real').length },
        { id: 'scan', count: filterRuns(state.snapshot.runs, 'scan').length },
        { id: 'verify', count: filterRuns(state.snapshot.runs, 'verify').length },
        { id: 'adoption', count: filterRuns(state.snapshot.runs, 'adoption').length }
      ];

      filters.replaceChildren(...filterStats.map((filter) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-current', String(filter.id === state.runFilter));
        button.textContent = filterLabel(filter.id) + ' ' + filter.count;
        button.addEventListener('click', () => {
          state.runFilter = filter.id;
          const visibleRuns = filteredRuns();
          if (!visibleRuns.some((run) => run.runId === state.selectedRunId)) {
            state.selectedRunId = visibleRuns[0]?.runId || state.snapshot.latestRun?.runId || null;
            state.selectedArtifactKind = null;
            state.artifactPreview = null;
          }
          render();
        });
        return button;
      }));
    }

    function renderRuns() {
      const runs = document.getElementById('runs');
      const visibleRuns = filteredRuns();

      if (state.snapshot.runs.length === 0) {
        runs.replaceChildren(emptyState('这个 Symphony 状态目录里还没有运行状态。'));
        return;
      }

      if (visibleRuns.length === 0) {
        runs.replaceChildren(emptyState('没有运行匹配当前筛选：' + filterLabel(state.runFilter)));
        return;
      }

      runs.replaceChildren(...visibleRuns.map((run) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'run-button';
        button.setAttribute('aria-current', String(run.runId === state.selectedRunId));
        button.addEventListener('click', () => {
          state.selectedRunId = run.runId;
          state.selectedArtifactKind = null;
          state.artifactPreview = null;
          render();
        });
        button.append(text(run.command || '运行'));
        const meta = document.createElement('span');
        meta.className = 'run-meta';
        meta.textContent = [run.runId, formatValue(run.status), formatValue(run.verifierStatus)].filter(Boolean).join(' / ');
        button.append(meta);
        return button;
      }));
    }

    function filteredRuns() {
      return filterRuns(state.snapshot.runs || [], state.runFilter);
    }

    function selectedRun() {
      return state.snapshot.runs.find((candidate) => candidate.runId === state.selectedRunId) || state.snapshot.latestRun;
    }

    function renderDetails() {
      const details = document.getElementById('details');
      const run = selectedRun();

      if (!run) {
        details.replaceChildren(emptyState('这个状态目录里还没有最新运行。'));
        return;
      }

      const statusClass = run.status === 'passed' ? 'passed' : run.status === 'failed' ? 'failed' : '';
      details.replaceChildren(
        detailSection('意图',
          definitionList([
            ['运行 ID', run.runId],
            ['命令', run.command],
            ['意图', run.intent],
            ['语义命令', run.semanticCommand],
            ['流水线', formatValue(run.pipeline)],
            ['项目', run.projectRoot],
            ['目标目录', run.targetDir],
            ['模板', run.template],
            ['下一步', run.nextAction]
          ])
        ),
        detailSection('路由',
          definitionList([
            ['提供方模式', run.providerMode],
            ['提供方', run.provider],
            ['提供方状态', run.providerStatus],
            ['复用上下文', formatValue(run.contextReused)]
          ]),
          jsonBlock('路由决策', run.routeDecision),
          jsonBlock('提供方回退', run.providerFallback),
          jsonBlock('匹配信号', run.matchedSignals)
        ),
        detailSection('安全',
          definitionList([
            ['安全模式', run.safetyMode],
            ['项目写入', formatValue(run.projectWrites)],
            ['主工作区写入', formatValue(run.mainWorktreeWrites)],
            ['工作空间写入', formatValue(run.workspaceWrites)],
            ['写入边界', run.writeBoundary],
            ['运行时写入', formatValue(run.runtimeWrites)],
            ['外部调用', formatValue(run.externalCalls)],
            ['破坏性写入', formatValue(run.destructiveWrites)],
            ['需要闸门', run.requiresGate],
            ['模型调用', formatValue(run.modelInvocation)]
          ]),
          jsonBlock('不支持的请求', run.unsupportedRequests)
        ),
        detailSection('执行',
          definitionList([
            ['状态', run.status, statusClass],
            ['工作流模式', run.workflowMode],
            ['适配器', run.adapter],
            ['执行模式', run.executionMode],
            ['执行计划', run.executionPlanId],
            ['计划运行', run.plannedRunId],
            ['采纳计划', run.adoptionPlanId],
            ['来源运行', run.sourceRunId],
            ['补丁', run.patchArtifactPath],
            ['补丁哈希', run.patchHash],
            ['日志', run.adoptionJournalArtifactPath],
            ['确认命令', run.confirmationCommand],
            ['创建时间', run.createdAt],
            ['更新时间', run.updatedAt]
          ])
        ),
        detailSection('验证',
          definitionList([
            ['验证器', run.verifierStatus],
            ['推荐工作流', run.recommendedWorkflow],
            ['验证命令', formatValue(run.verificationCommands)]
          ]),
          timelineBlock(run),
          commandBlock(run)
        ),
        detailSection('产物',
          definitionList([
            ['产物健康', run.artifactHealth?.status],
            ['产物状态', run.artifactStatus?.status],
            ['缺失产物数', run.artifactStatus?.missing]
          ]),
          artifactTable(run),
          artifactPreviewBlock()
        ),
        detailSection('变更',
          jsonBlock('变更文件', run.changedFiles),
          jsonBlock('文件操作', run.fileOperations),
          jsonBlock('不支持的采纳变更', run.unsupportedChanges),
          jsonBlock('创建文件', run.createdFiles),
          jsonBlock('脚手架计划', run.scaffoldPlan)
        )
      );
    }

    function renderDiagnosticsView() {
      const diagnostics = document.getElementById('diagnostics');
      const risks = combinedDiagnosticRisks();

      diagnostics.replaceChildren(
        detailSection('风险列表',
          risks.length === 0
            ? emptyState('当前状态没有可见诊断风险。')
            : (() => {
                const list = document.createElement('div');
                list.className = 'risk-list';
                list.replaceChildren(...risks.map(riskRow));
                return list;
              })()
        ),
        detailSection('就绪详情',
          readinessDetailsBlock()
        ),
        detailSection('仅复制命令',
          ...dedupeCommands([
            ...(state.snapshot.recommendedCommands || []),
            ...(state.readiness?.recommendedCommands || []),
            ...(selectedRun()?.recommendedCommands || [])
          ]).map(commandRow)
        ),
        detailSection('原始快照',
          jsonBlock('控制台快照', state.snapshot),
          jsonBlock('就绪状态', state.readiness)
        )
      );
    }

    function renderArtifactWorkspace() {
      const workspace = document.getElementById('artifact-workspace');
      const run = selectedRun();

      if (!run) {
        workspace.replaceChildren(emptyState('还没有选择用于预览产物的运行。'));
        return;
      }

      workspace.replaceChildren(
        detailSection('已选运行',
          definitionList([
            ['运行 ID', run.runId],
            ['产物健康', run.artifactHealth?.status],
            ['产物状态', run.artifactStatus?.status],
            ['登记引用数', (run.artifactRefs || []).length]
          ])
        ),
        detailSection('已登记产物引用',
          artifactTable(run),
          artifactPreviewBlock()
        )
      );
    }

    function combinedDiagnosticRisks() {
      const risks = [
        ...(state.snapshot?.riskSummary?.items || []),
        ...(selectedRun()?.riskSummary?.items || []),
        ...(state.readiness?.riskSummary?.items || [])
      ];
      const adoption = state.snapshot?.adoptionSummary || {};

      if (adoption.dirtyBlocked === true) {
        risks.push({
          id: 'dirty_worktree_blocks_adoption',
          category: 'dirty_worktree_blocks_adoption',
          severity: 'high',
          title: '脏工作区阻塞采纳',
          detail: '待采纳内容需要先清理非 Symphony 工作区变更，再执行确认。',
          command: {
            command: 'git status --short',
            mode: 'copy-only'
          }
        });
        risks.push({
          id: 'adoption_dirty_file_details',
          category: 'adoption_dirty_file_details',
          severity: 'high',
          title: '采纳阻塞文件详情',
          detail: (state.readiness?.tools?.git?.dirtyFilesCount ?? 0) + ' 个未提交文件会阻塞采纳确认。',
          dirtyPaths: state.readiness?.tools?.git?.dirtyPaths,
          dirtyPathCount: state.readiness?.tools?.git?.dirtyFilesCount,
          command: {
            command: 'git status --short',
            mode: 'copy-only'
          }
        });
      }

      return dedupeRisks(risks);
    }

    function readinessDetailsBlock() {
      if (!state.readiness) {
        return emptyState('就绪状态不可用。');
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'stack';
      wrapper.append(...[
        definitionList([
          ['状态', state.readiness.status],
          ['只读', formatValue(state.readiness.readOnly)],
          ['模型调用', formatValue(state.readiness.modelInvocation)],
          ['Git 未提交路径', formatValue(state.readiness.tools?.git?.dirtyPaths)]
        ]),
        jsonBlock('就绪检查', state.readiness.checks),
        jsonBlock('就绪工具', state.readiness.tools)
      ].filter(Boolean));
      return wrapper;
    }

    function detailSection(title, ...children) {
      const wrapper = document.createElement('div');
      wrapper.className = 'detail-section';
      const heading = document.createElement('h2');
      heading.textContent = title;
      wrapper.append(heading, ...children.filter(Boolean));
      return wrapper;
    }

    function definitionList(rows) {
      const list = document.createElement('dl');
      for (const [label, value, className] of rows) {
        if (value === undefined || value === null) continue;
        const term = document.createElement('dt');
        term.textContent = label;
        const data = document.createElement('dd');
        data.textContent = formatValue(value);
        if (className) data.className = 'status ' + className;
        list.append(term, data);
      }
      return list;
    }

    function timelineBlock(run) {
      if (!Array.isArray(run.timeline) || run.timeline.length === 0) {
        return emptyState('这个运行没有时间线。');
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'section-block';
      const heading = document.createElement('h2');
      heading.textContent = '时间线';
      const list = document.createElement('ul');
      list.className = 'timeline';
      for (const event of run.timeline) {
        const item = document.createElement('li');
        const marker = document.createElement('span');
        marker.className = 'timeline-marker ' + (event.status || '');
        const body = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'command-title ' + (event.status || '');
        title.textContent = timelineLabel(event.label) + ': ' + formatValue(event.status);
        const detail = document.createElement('div');
        detail.className = 'muted';
        const eventDetail = event.detail === undefined || event.detail === null ? '' : formatValue(event.detail);
        detail.textContent = [eventDetail, event.at].filter(Boolean).join(' / ');
        body.append(title, detail);
        item.append(marker, body);
        list.append(item);
      }
      wrapper.append(heading, list);
      return wrapper;
    }

    function commandBlock(run) {
      if (!Array.isArray(run.recommendedCommands) || run.recommendedCommands.length === 0) {
        return emptyState('这个运行没有专属命令。');
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'section-block';
      const heading = document.createElement('h2');
      heading.textContent = '运行命令';
      const list = document.createElement('div');
      list.className = 'command-list';
      list.replaceChildren(...run.recommendedCommands.map(commandRow));
      wrapper.append(heading, list);
      return wrapper;
    }

    function jsonBlock(title, value) {
      if (value === undefined || value === null) return null;
      if (Array.isArray(value) && value.length === 0) return null;

      const wrapper = document.createElement('div');
      wrapper.className = 'stack';
      const heading = document.createElement('h3');
      heading.textContent = title;
      wrapper.append(heading, codeBlock(JSON.stringify(value, null, 2)));
      return wrapper;
    }

    function artifactTable(run) {
      const artifactRefs = run.artifactRefs || [];

      if (artifactRefs.length === 0) {
        return emptyState('这个运行没有登记产物引用。');
      }

      const table = document.createElement('table');
      const head = document.createElement('thead');
      head.innerHTML = '<tr><th>产物</th><th>路径</th><th>预览</th></tr>';
      const body = document.createElement('tbody');
      for (const artifact of artifactRefs) {
        const row = document.createElement('tr');
        const kind = document.createElement('td');
        const path = document.createElement('td');
        const action = document.createElement('td');
        const button = document.createElement('button');
        row.setAttribute('aria-current', String(artifact.kind === state.selectedArtifactKind));
        kind.textContent = artifact.kind;
        path.textContent = artifact.path;
        button.type = 'button';
        button.className = 'inline';
        button.setAttribute('aria-current', String(artifact.kind === state.selectedArtifactKind));
        button.textContent = artifact.kind === state.selectedArtifactKind ? '已选' : '预览';
        button.addEventListener('click', () => loadArtifact(run.runId, artifact.kind));
        action.append(button);
        row.append(kind, path, action);
        body.append(row);
      }
      table.append(head, body);
      return table;
    }

    async function loadArtifact(runId, kind) {
      const response = await fetch('/api/runs/' + encodeURIComponent(runId) + '/artifacts/' + encodeURIComponent(kind), { cache: 'no-store' });
      state.artifactPreview = await response.json();
      state.selectedArtifactKind = kind;
      renderDetails();
      renderArtifactWorkspace();
    }

    function artifactPreviewBlock() {
      if (!state.artifactPreview) {
        const empty = document.createElement('div');
        empty.className = 'muted';
        empty.textContent = '选择一个产物后，会在这里显示预览。';
        return empty;
      }

      const artifact = state.artifactPreview.artifact;
      const panel = document.createElement('div');
      panel.className = 'preview-panel';

      if (!artifact) {
        panel.append(codeBlock(JSON.stringify(state.artifactPreview, null, 2)));
        return panel;
      }

      const heading = document.createElement('h2');
      heading.textContent = '产物预览：' + artifact.kind;
      panel.append(heading);

      if (artifact.type === 'missing') {
        panel.append(emptyState('产物已登记，但文件缺失：' + artifact.path, 'error'));
        return panel;
      }

      if (artifact.type === 'directory') {
        panel.append(emptyState('目录预览最多显示 ' + (artifact.limit || 100) + ' 项；总数：' + (artifact.entryCount ?? '未知') + '。'));
        const list = document.createElement('ul');
        list.className = 'file-list';
        for (const entry of artifact.entries || []) {
          const item = document.createElement('li');
          const name = document.createElement('span');
          const type = document.createElement('span');
          name.textContent = entry.name;
          type.className = 'muted';
          type.textContent = formatValue(entry.type);
          item.append(name, type);
          list.append(item);
        }
        panel.append(list);
        if (artifact.truncated) {
          panel.append(emptyState('目录预览已截断到 ' + (artifact.limit || 100) + ' 项。'));
        }
        return panel;
      }

      if (artifact.format === 'malformed-json') {
        panel.append(emptyState('JSON 产物格式异常。' + (artifact.parseError || '原始内容显示如下。'), 'error'));
        panel.append(codeBlock(artifact.content || ''));
        return panel;
      }

      const block = codeBlock(artifact.format === 'json'
        ? JSON.stringify(artifact.json, null, 2)
        : artifact.content);

      if (artifact.truncated) {
        block.textContent += '\\n\\n[预览已截断：' + formatBytes(artifact.previewLimitBytes) + ' / ' + formatBytes(artifact.size) + ']';
      }

      panel.append(block);
      return panel;
    }

    function emptyState(message, className = 'muted') {
      const empty = document.createElement('div');
      empty.className = 'empty-state ' + className;
      empty.textContent = message;
      return empty;
    }

    function codeBlock(value) {
      const block = document.createElement('pre');
      block.textContent = value;
      return block;
    }

    function formatValue(value) {
      if (value === undefined || value === null) return '无';
      if (Array.isArray(value)) return value.length === 0 ? '无' : value.map(formatValue).join(', ');
      if (typeof value === 'boolean') return value ? '是' : '否';
      if (typeof value === 'object' && value !== null) return JSON.stringify(value);
      return valueLabel(String(value));
    }

    function formatPercent(value) {
      if (typeof value !== 'number') return '无';
      return Math.round(value * 100) + '%';
    }

    function formatBytes(value) {
      if (typeof value !== 'number') return '大小未知';
      if (value >= 1024 * 1024) return Math.round(value / (1024 * 1024)) + ' MiB';
      if (value >= 1024) return Math.round(value / 1024) + ' KiB';
      return value + ' B';
    }

    function valueLabel(value) {
      const labels = {
        'adopt': '采纳',
        'adoption': '采纳',
        'adoption-planned': '采纳已计划',
        'applying': '应用中',
        'attention': '需关注',
        'authenticated': '已认证',
        'available': '可用',
        'blocked': '已阻塞',
        'builtin': '内置',
        'clean': '干净',
        'clear': '无待处理采纳',
        'copy-only': '仅复制',
        'dirty': '有未提交变更',
        'dirty-blocked': '脏工作区阻塞',
        'done': '完成',
        'dry-run': '演练',
        'failed': '失败',
        'file': '文件',
        'directory': '目录',
        'high': '高',
        'inspected': '已检查',
        'low': '低',
        'medium': '中',
        'loading': '加载中',
        'missing': '缺失',
        'no-runs': '暂无运行',
        'none': '无',
        'not-run': '未运行',
        'ok': '正常',
        'passed': '通过',
        'pending': '待确认',
        'post-apply-failed': '应用后证据失败',
        'read-only': '只读',
        'ready': '就绪',
        'real': '真实执行',
        'scan': '扫描',
        'skipped': '已跳过',
        'stale': '已过期',
        'true': '是',
        'unknown': '未知',
        'unavailable': '不可用',
        'unsupported': '不支持',
        'verify': '验证',
        'write': '写入'
      };

      return labels[value] || value;
    }

    function headlineLabel(value) {
      if (!value) return '';

      const labels = {
        'No Symphony runs found yet.': '还没有找到 Symphony 运行。',
        'Patch applied, evidence failed.': '补丁已应用，但证据失败。',
        'Adoption apply is in progress or needs recovery inspection.': '采纳应用正在进行，或需要恢复检查。',
        'Dirty worktree blocks adoption.': '脏工作区阻塞采纳。',
        '脏工作区阻塞采纳。': '脏工作区阻塞采纳。',
        'Adoption plan is stale and needs inspection.': '采纳计划已过期，需要检查。',
        'Pending adoption is ready for review.': '待采纳内容已准备好评审。',
        'Readiness needs attention before the next run.': '下一次运行前需要处理就绪状态。',
        'Latest run passed and no high-priority risks are visible.': '最新运行已通过，当前没有高优先级风险。'
      };
      if (labels[value]) return labels[value];

      const latestRunMatch = /^Latest run is (.+)\\.$/u.exec(value);
      if (latestRunMatch) {
        return '最新运行状态：' + formatValue(latestRunMatch[1]) + '。';
      }

      return riskTitleLabel({ title: value });
    }

    function severityLabel(value) {
      if (!value) return '';
      return valueLabel(value) + '风险';
    }

    function riskTitleLabel(risk) {
      const labels = {
        'Run failed': '运行失败',
        'Verifier failed': '验证器失败',
        'Unsupported requests': '不支持的请求',
        'External calls': '外部调用',
        'Project writes': '项目写入',
        'Runtime writes': '运行时写入',
        'Missing artifacts': '产物缺失',
        'Pending adoption': '采纳待确认',
        'Unsupported adoption changes': '不支持的采纳变更',
        'Stale adoption': '采纳已过期',
        'Adoption apply in progress': '采纳应用中',
        'Adoption post-apply evidence failed': '采纳应用后证据失败',
        'Dirty worktree blocks adoption': '脏工作区阻塞采纳',
        '脏工作区阻塞采纳': '脏工作区阻塞采纳',
        'Adoption dirty file details': '采纳阻塞文件详情',
        '采纳阻塞文件详情': '采纳阻塞文件详情',
        'pnpm unavailable': 'pnpm 不可用',
        'Git unavailable': 'Git 不可用',
        'Dirty git worktree': 'Git 工作区有未提交变更',
        'GitHub auth unavailable': 'GitHub 认证不可用',
        'GitHub CI unavailable': 'GitHub CI 不可用'
      };

      if (labels[risk?.title]) return labels[risk.title];

      const unavailableMatch = /^(.+) unavailable$/u.exec(risk?.title || '');
      if (unavailableMatch) return unavailableMatch[1] + ' 不可用';

      return risk?.title || risk?.category || '';
    }

    function riskDetailLabel(risk) {
      if (!risk?.detail) return '';

      const labels = {
        'Pending adoption requires a clean non-Symphony worktree before confirmation.': '待采纳内容需要先清理非 Symphony 工作区变更，再执行确认。',
        '待采纳内容需要先清理非 Symphony 工作区变更，再执行确认。': '待采纳内容需要先清理非 Symphony 工作区变更，再执行确认。'
      };
      if (labels[risk.detail]) return labels[risk.detail];

      const patterns = [
        [/^(.+) ended with status failed\\.$/u, (match) => match[1] + ' 结束时状态为失败。'],
        [/^(.+) has verifierStatus=failed\\.$/u, (match) => match[1] + ' 的验证器状态为失败。'],
        [/^(\\d+) unsupported request\\(s\\) were recorded\\.$/u, (match) => '记录了 ' + match[1] + ' 个不支持的请求。'],
        [/^(.+) recorded externalCalls=true\\.$/u, () => '记录了外部调用。'],
        [/^(.+) recorded projectWrites=true\\.$/u, () => '记录了项目写入。'],
        [/^(.+) wrote Symphony runtime artifacts\\.$/u, () => '写入了 Symphony 运行时产物。'],
        [/^(\\d+) registered artifact\\(s\\) are missing\\.$/u, (match) => '缺失 ' + match[1] + ' 个已登记产物。'],
        [/^(.+) has a frozen adoption plan waiting for confirmation\\.$/u, () => '有一个已冻结采纳计划正在等待确认。'],
        [/^(\\d+) unsupported source change\\(s\\) blocked adoption planning\\.$/u, (match) => match[1] + ' 个不支持的来源变更阻塞了采纳计划。'],
        [/^(.+) reached the main-worktree apply phase\\.$/u, () => '已进入主工作区应用阶段。'],
        [/^(\\d+) dirty file\\(s\\) may affect run trust\\.$/u, (match) => match[1] + ' 个未提交文件可能影响运行可信度。'],
        [/^(.+) was not available for optional real-agent checks\\.$/u, (match) => match[1] + ' 不可用，无法执行可选真实代理检查。']
      ];

      for (const [pattern, format] of patterns) {
        const match = pattern.exec(risk.detail);
        if (match) return format(match);
      }

      return formatValue(risk.detail);
    }

    function commandLabel(label) {
      const labels = {
        'Check CI': '检查 CI',
        'Check GitHub auth': '检查 GitHub 认证',
        'Check environment': '检查环境',
        'Check git': '检查 Git',
        'Check pnpm': '检查 pnpm',
        'Confirm adoption': '确认采纳',
        'Continue safely': '安全继续',
        'Current next action': '当前下一步',
        'Diagnose': '诊断',
        'Diff summary': '差异摘要',
        'Doctor': '环境体检',
        'Dry-run work': '演练工作',
        'Enable pnpm': '启用 pnpm',
        'Git status': 'Git 状态',
        'GitHub login': 'GitHub 登录',
        'Inspect adoption': '检查采纳',
        'Inspect dirty git': '查看 Git 未提交变更',
        'Open workbench': '打开 Workbench',
        'Real Claude gate': '真实 Claude 闸门',
        'Real Codex gate': '真实 Codex 闸门',
        'Real Kiro gate': '真实 Kiro 闸门',
        'Scan project': '扫描项目',
        'Static check': '静态检查',
        'Status': '状态',
        'Suggested next': '建议下一步',
        'Tests': '测试',
        'Artifacts': '产物'
      };

      return labels[label] || label;
    }

    function commandDescription(description) {
      const labels = {
        'Check the base CLI environment.': '检查基础 CLI 环境。',
        'Apply the frozen adoption patch from the terminal after reviewing it.': '评审后，从终端应用已冻结的采纳补丁。',
        'Confirm pnpm is available on PATH.': '确认 PATH 上可以使用 pnpm。',
        'Confirm the console is running inside a git worktree.': '确认控制台运行在 Git 工作区内。',
        'Confirm whether this optional real CLI is installed.': '确认这个可选真实 CLI 是否已安装。',
        'Copy the next action recorded by the latest run.': '复制最新运行记录的下一步命令。',
        'Copy-only command from the current local state.': '来自当前本地状态的仅复制命令。',
        'Copy-only terminal command; the browser never runs it.': '仅复制终端命令，浏览器不会执行。',
        'Create the first read-only project context.': '创建第一个只读项目上下文。',
        'Exercise the work path without project writes.': '在不写入项目的情况下演练工作路径。',
        'External execution example; copy only and run intentionally.': '外部执行示例；只复制，并在确认后自行运行。',
        'Inspect all Workbench diagnostics as JSON.': '以 JSON 查看全部 Workbench 诊断。',
        'Inspect dirty worktree blockers.': '查看阻塞采纳的工作区变更。',
        'Inspect GitHub CLI auth without exposing tokens.': '检查 GitHub CLI 认证，不暴露令牌。',
        'Inspect recent GitHub Actions runs.': '查看最近的 GitHub Actions 运行。',
        'Make the package manager shim available before rechecking.': '重新检查前启用包管理器 shim。',
        'Print registered artifact references for this run.': '打印这个运行登记的产物引用。',
        'Print the latest Symphony run state.': '打印最新 Symphony 运行状态。',
        'Read adoption plan, journal, and current worktree match status.': '读取采纳计划、日志和当前工作区匹配状态。',
        'Read-only inspect from the terminal.': '在终端执行只读检查。',
        'Read the latest product state.': '读取最新产品状态。',
        'Return to this read-only dashboard.': '返回这个只读看板。',
        'Review uncommitted files before trusting run evidence.': '信任运行证据前查看未提交文件。',
        'Run repository syntax checks.': '运行仓库语法检查。',
        'Run the repository test suite.': '运行仓库测试套件。',
        'See the shape of unstaged changes.': '查看未暂存变更概览。',
        'Show all local diagnostics.': '显示全部本地诊断。',
        'Start GitHub CLI authentication if needed.': '需要时启动 GitHub CLI 认证。',
        'Start this local read-only workbench.': '启动这个本地只读 Workbench。',
        'copy-only': '仅复制'
      };

      return labels[description] || riskDetailLabel({ detail: description }) || formatValue(description);
    }

    function commandGroupLabel(group) {
      const labels = {
        'Adoptions': '采纳',
        'Artifacts': '产物',
        'Inspect': '检查',
        'Real-agent gates': '真实代理闸门',
        'Verify': '验证'
      };

      return labels[group] || group;
    }

    function filterLabel(filter) {
      const labels = {
        all: '全部',
        passed: '通过',
        failed: '失败',
        'dry-run': '演练',
        real: '真实执行',
        scan: '扫描',
        verify: '验证',
        adoption: '采纳'
      };

      return labels[filter] || filter;
    }

    function timelineLabel(label) {
      const labels = {
        'Run created': '运行创建',
        'Route decision': '路由决策',
        'Safety boundary': '安全边界',
        'Execution': '执行',
        'Verifier': '验证器',
        'Artifacts': '产物'
      };

      return labels[label] || label;
    }

    function dedupeCommands(commands) {
      const seen = new Set();
      const deduped = [];

      for (const command of commands) {
        if (!command || !command.command || seen.has(command.command)) continue;
        seen.add(command.command);
        deduped.push(command);
      }

      return deduped;
    }

    function groupCommands(commands) {
      const order = ['Inspect', 'Adoptions', 'Verify', 'Artifacts', 'Real-agent gates'];
      const groups = new Map(order.map((group) => [group, []]));

      for (const command of dedupeCommands(commands)) {
        const group = command.group || commandGroupFor(command.command);
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push({ ...command, group });
      }

      return [...groups.entries()]
        .filter(([, groupCommands]) => groupCommands.length > 0)
        .map(([group, groupCommands]) => ({ group, commands: groupCommands }));
    }

    function commandGroupFor(command) {
      const value = String(command || '');
      if (/MCAS_RUN_REAL_|--real/u.test(value)) return 'Real-agent gates';
      if (/\\badopt\\b/u.test(value)) return 'Adoptions';
      if (/artifacts?/u.test(value)) return 'Artifacts';
      if (/\\b(check|test|verify|audit|diff --check)\\b/u.test(value)) return 'Verify';
      return 'Inspect';
    }

    function filterRuns(runs, filter) {
      if (filter === 'all') return runs;
      return runs.filter((run) => runMatchesFilter(run, filter));
    }

    function runMatchesFilter(run, filter) {
      if (filter === 'passed') return run.status === 'passed' || run.verifierStatus === 'passed';
      if (filter === 'failed') return run.status === 'failed' || run.verifierStatus === 'failed';
      if (filter === 'dry-run') return run.safetyMode === 'dry-run' || run.executionMode === 'dry-run';
      if (filter === 'real') return run.executionMode === 'real';
      if (filter === 'scan') return run.semanticCommand === 'scan' || run.intent === 'scan-project' || /\\bscan\\b/u.test(run.command || '');
      if (filter === 'verify') return run.semanticCommand === 'verify' || run.intent === 'verify' || /\\b(verify|qa)\\b/u.test(run.command || '');
      if (filter === 'adoption') return run.semanticCommand === 'adopt'
        || run.intent === 'adopt'
        || run.adoptionPlanId !== undefined
        || run.adoptionJournalArtifactPath !== undefined
        || (Array.isArray(run.pipeline) && run.pipeline.some((step) => /^adopt/u.test(step)));
      return true;
    }

    function dedupeRisks(risks) {
      const seen = new Set();
      const deduped = [];

      for (const risk of risks) {
        const key = risk.id || [risk.title, risk.runId, risk.detail].join(':');
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(risk);
      }

      return deduped;
    }

    async function copyCommand(command, button) {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
        button.textContent = '已复制';
        setTimeout(() => {
          button.textContent = '复制';
        }, 1200);
        return;
      }

      window.prompt('复制命令', command);
    }

    function text(value) {
      return document.createTextNode(value);
    }
  </script>
</body>
</html>`;
}
