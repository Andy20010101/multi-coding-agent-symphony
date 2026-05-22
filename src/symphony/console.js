import { createServer } from 'node:http';
import { open, readdir, stat } from 'node:fs/promises';

import {
  listRunStates,
  readLatestContext,
  readLatestRun,
  readRunState
} from './state.js';
import {
  PRODUCT_JSON_CONTRACT,
  compactRunState
} from './contract.js';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8765;
const MAX_ARTIFACT_PREVIEW_BYTES = 200 * 1024;

export async function buildConsoleSnapshot({
  stateDir = '.symphony',
  generatedAt = new Date().toISOString()
} = {}) {
  const [latestContext, latestRun, runs] = await Promise.all([
    readLatestContext({ stateDir }),
    readLatestRun({ stateDir }),
    listRunStates({ stateDir })
  ]);

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
    latestContext: compactContext(latestContext),
    latestRun: compactRunState(latestRun),
    runs: runs.map(compactRunState),
    action: {
      next: latestRun?.nextAction ?? 'symphony scan'
    }
  };
}

export function createSymphonyConsoleServer({ stateDir = '.symphony' } = {}) {
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

      if (url.pathname === '/api/runs') {
        const runs = await listRunStates({ stateDir });
        writeJsonResponse(response, 200, {
          contractVersion: PRODUCT_JSON_CONTRACT.version,
          contractName: 'symphony.console-runs',
          runs: runs.map(compactRunState)
        });
        return;
      }

      if (url.pathname === '/api/runs/latest') {
        await writeRunResponse({ response, stateDir, runId: 'latest' });
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
  port = DEFAULT_PORT
} = {}) {
  const server = createSymphonyConsoleServer({ stateDir });

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
    run: compactRunState(runState),
    rawRunState: runState
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

async function previewArtifact(artifactRef) {
  const metadata = await stat(artifactRef.path);

  if (metadata.isDirectory()) {
    const entries = await readdir(artifactRef.path, { withFileTypes: true });

    return {
      ...artifactRef,
      type: 'directory',
      entries: entries.slice(0, 100).map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file'
      })),
      truncated: entries.length > 100
    };
  }

  const size = metadata.size;
  const length = Math.min(size, MAX_ARTIFACT_PREVIEW_BYTES);
  const handle = await open(artifactRef.path, 'r');

  try {
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, 0);
    const content = buffer.toString('utf8');
    const json = parseJsonPreview(content);
    const truncated = size > MAX_ARTIFACT_PREVIEW_BYTES;
    const malformedJson = !truncated && json === null && isJsonArtifact({ artifactRef, content });

    return {
      ...artifactRef,
      type: 'file',
      size,
      truncated,
      format: malformedJson ? 'malformed-json' : json === null ? 'text' : 'json',
      content,
      ...(malformedJson ? { parseError: 'invalid JSON artifact preview' } : {}),
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

function parseJsonPreview(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
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

function renderConsoleHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Symphony Evidence Console</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f8fb;
      --panel: #ffffff;
      --text: #20242c;
      --muted: #5f6b7a;
      --line: #d9dee7;
      --accent: #0d6b57;
      --danger: #a53d2d;
      --ok: #1f7a4f;
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

    main {
      display: grid;
      grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
      gap: 0;
      min-height: calc(100vh - 64px);
    }

    aside {
      border-right: 1px solid var(--line);
      background: #eef1f6;
      padding: 16px;
      overflow: auto;
    }

    section {
      padding: 20px 24px;
      overflow: auto;
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

    .run-list {
      display: grid;
      gap: 8px;
    }

    .run-button {
      width: 100%;
      display: grid;
      gap: 4px;
      text-align: left;
      padding: 10px;
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

    .preview-panel {
      margin-top: 18px;
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

    .passed {
      color: var(--ok);
    }

    .failed,
    .error {
      color: var(--danger);
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
    }
  </style>
</head>
<body>
  <header>
    <h1>Symphony Evidence Console</h1>
    <button id="refresh" type="button">Refresh</button>
  </header>
  <main>
    <aside>
      <div id="summary" class="muted">Loading...</div>
      <div id="runs" class="run-list"></div>
    </aside>
    <section>
      <div id="details" class="muted">Loading run details...</div>
    </section>
  </main>
  <script>
    const state = {
      snapshot: null,
      selectedRunId: null,
      selectedArtifactKind: null,
      artifactPreview: null
    };

    document.getElementById('refresh').addEventListener('click', () => loadSnapshot());
    loadSnapshot();

    async function loadSnapshot() {
      const response = await fetch('/api/summary', { cache: 'no-store' });
      state.snapshot = await response.json();
      const selectedExists = state.snapshot.runs.some((run) => run.runId === state.selectedRunId);
      if (!selectedExists) {
        state.selectedRunId = state.snapshot.latestRun?.runId || null;
        state.selectedArtifactKind = null;
        state.artifactPreview = null;
      }
      render();
    }

    function render() {
      renderSummary();
      renderRuns();
      renderDetails();
    }

    function renderSummary() {
      const summary = document.getElementById('summary');
      const snapshot = state.snapshot;
      summary.textContent = snapshot.latestRun
        ? snapshot.runs.length + ' run(s), latest ' + snapshot.latestRun.status
        : 'No runs yet. Run symphony scan to create local evidence.';
    }

    function renderRuns() {
      const runs = document.getElementById('runs');
      if (state.snapshot.runs.length === 0) {
        runs.replaceChildren(emptyState('No run states found in this Symphony state directory.'));
        return;
      }

      runs.replaceChildren(...state.snapshot.runs.map((run) => {
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
        button.append(text(run.command || 'run'));
        const meta = document.createElement('span');
        meta.className = 'muted';
        meta.textContent = run.runId || '';
        button.append(meta);
        return button;
      }));
    }

    function renderDetails() {
      const details = document.getElementById('details');
      const run = state.snapshot.runs.find((candidate) => candidate.runId === state.selectedRunId) || state.snapshot.latestRun;

      if (!run) {
        details.replaceChildren(emptyState('No latest run is available for this state directory.'));
        return;
      }

      const statusClass = run.status === 'passed' ? 'passed' : run.status === 'failed' ? 'failed' : '';
      details.replaceChildren(
        definitionList([
          ['Run', run.runId],
          ['Command', run.command],
          ['Intent', run.intent],
          ['Semantic', run.semanticCommand],
          ['Pipeline', formatValue(run.pipeline)],
          ['Status', run.status, statusClass],
          ['Verifier', run.verifierStatus],
          ['Safety', run.safetyMode],
          ['Project writes', formatValue(run.projectWrites)],
          ['Runtime writes', formatValue(run.runtimeWrites)],
          ['External calls', formatValue(run.externalCalls)],
          ['Workflow mode', run.workflowMode],
          ['Adapter', run.adapter],
          ['Execution', run.executionMode],
          ['Provider mode', run.providerMode],
          ['Provider', run.provider],
          ['Provider status', run.providerStatus],
          ['Project', run.projectRoot],
          ['Target', run.targetDir],
          ['Template', run.template],
          ['Next', run.nextAction]
        ]),
        ...structuredRunBlocks(run),
        artifactTable(run),
        artifactPreviewBlock()
      );
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

    function structuredRunBlocks(run) {
      return [
        structuredBlock('Route decision', run.routeDecision),
        structuredBlock('Provider fallback', run.providerFallback),
        structuredBlock('Unsupported requests', run.unsupportedRequests),
        structuredBlock('Scaffold plan', run.scaffoldPlan),
        structuredBlock('Changed files', run.changedFiles)
      ].filter(Boolean);
    }

    function structuredBlock(title, value) {
      if (value === undefined || value === null) return null;
      if (Array.isArray(value) && value.length === 0) return null;

      const wrapper = document.createElement('div');
      wrapper.className = 'stack';
      const heading = document.createElement('h2');
      heading.textContent = title;
      wrapper.append(heading, codeBlock(JSON.stringify(value, null, 2)));
      return wrapper;
    }

    function artifactTable(run) {
      const artifactRefs = run.artifactRefs || [];

      if (artifactRefs.length === 0) {
        return emptyState('No artifact references recorded for this run.');
      }

      const table = document.createElement('table');
      const head = document.createElement('thead');
      head.innerHTML = '<tr><th>Artifact</th><th>Path</th><th>Preview</th></tr>';
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
        button.textContent = artifact.kind === state.selectedArtifactKind ? 'Selected' : 'Preview';
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
    }

    function artifactPreviewBlock() {
      if (!state.artifactPreview) {
        const empty = document.createElement('div');
        empty.className = 'muted';
        empty.textContent = 'Select an artifact to preview it here.';
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
      heading.textContent = 'Artifact preview: ' + artifact.kind;
      panel.append(heading);

      if (artifact.type === 'missing') {
        panel.append(emptyState(artifact.message + ': ' + artifact.path, 'error'));
        return panel;
      }

      if (artifact.type === 'directory') {
        const list = document.createElement('ul');
        list.className = 'file-list';
        for (const entry of artifact.entries || []) {
          const item = document.createElement('li');
          const name = document.createElement('span');
          const type = document.createElement('span');
          name.textContent = entry.name;
          type.className = 'muted';
          type.textContent = entry.type;
          item.append(name, type);
          list.append(item);
        }
        panel.append(list);
        if (artifact.truncated) {
          panel.append(emptyState('Directory preview truncated to 100 entries.'));
        }
        return panel;
      }

      if (artifact.format === 'malformed-json') {
        panel.append(emptyState('Malformed JSON artifact. Raw content is shown below.', 'error'));
        panel.append(codeBlock(artifact.content || ''));
        return panel;
      }

      const block = codeBlock(artifact.format === 'json'
        ? JSON.stringify(artifact.json, null, 2)
        : artifact.content);

      if (artifact.truncated) {
        block.textContent += '\\n\\n[Preview truncated]';
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
      if (Array.isArray(value)) return value.length === 0 ? 'none' : value.join(', ');
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      if (typeof value === 'object' && value !== null) return JSON.stringify(value);
      return String(value);
    }

    function text(value) {
      return document.createTextNode(value);
    }
  </script>
</body>
</html>`;
}
