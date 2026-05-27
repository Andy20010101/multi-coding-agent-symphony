import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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

  it('keeps the shell without browser action controls or write API calls', async () => {
    const sources = await Promise.all(
      frontendFiles.map((file) => readFile(file, 'utf8'))
    );
    const source = sources.join('\n');

    assert.doesNotMatch(source, /<button\b|role\s*=\s*["']button["']|<a\s|href\s*=|<form\b|<input\b|<select\b|<textarea\b/i);
    assert.doesNotMatch(source, /\bonClick\b|\bonSubmit\b|addEventListener\s*\(/);
    assert.doesNotMatch(source, /XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon|navigator\.clipboard|serviceWorker|localStorage|indexedDB/);
    assert.doesNotMatch(source, /\bmethod\s*:\s*['"`](POST|PUT|PATCH|DELETE)['"`]/i);
    assert.doesNotMatch(source, /\bhandle(Execute|Retry|Apply|Adopt|Rollback|Delete|Install|Mutate|Audit)\b/);
  });

  it('renders the Task 6 panels as read-only source components', async () => {
    const app = await readFile('frontend/workbench/src/App.jsx', 'utf8');

    for (const componentName of ['SummaryPanel', 'ReadinessPanel', 'RunsPanel', 'LatestRunPanel']) {
      assert.match(app, new RegExp(`function ${componentName}\\b`, 'u'));
    }

    assert.match(app, /artifactRefs 只读列表/u);
    assert.match(app, /刷新页面后会重新读取只读 API/u);
    assert.doesNotMatch(app, /\bfetch\s*\(/u);
    assert.doesNotMatch(app, /rawRunState/u);
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
      '/api/readiness',
      '/api/runs',
      '/api/runs/latest',
      '/api/summary'
    ]);
  });

  it('keeps artifact preview gaps as labels instead of browser preview logic', async () => {
    const source = await readFile('frontend/workbench/src/api/contracts.js', 'utf8');

    assert.match(source, /DEFERRED_CONTRACT_GAPS/u);
    assert.match(source, /safeToRenderInline/u);
    assert.match(source, /previewAvailable/u);
    assert.doesNotMatch(source, /safeToRenderInline\s*:\s*true/u);
    assert.doesNotMatch(source, /previewAvailable\s*:\s*true/u);
    assert.doesNotMatch(source, /mime\s*:\s*['"`]text\/html/u);
    assert.doesNotMatch(source, /artifactKind\s*:\s*artifact\.kind/u);
  });

  it('builds to the approved static Workbench output directory', async () => {
    const config = await readFile('frontend/workbench/vite.config.js', 'utf8');

    assert.match(config, /src\/symphony\/workbench-static/);
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
