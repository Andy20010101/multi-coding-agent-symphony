import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';

const ROUTE_SMOKE_RUN_ID = 'task9-route-smoke-run';
const FIXED_TIME = '2026-05-27T00:00:00.000Z';

describe('v15 Workbench route smoke and server parity', () => {
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
      const missingAssetResponse = await fetch(`${context.baseUrl}/workbench/assets/missing.js`);
      const extensionRouteResponse = await fetch(`${context.baseUrl}/workbench/missing.css`);
      const rootAssetResponse = await fetch(`${context.baseUrl}${assetPaths.script.replace('/workbench', '')}`);

      assert.equal(jsResponse.status, 200);
      assert.match(jsResponse.headers.get('content-type') ?? '', /javascript/iu);
      assert.equal(jsResponse.headers.get('cache-control'), 'no-store');
      assert.equal(jsResponse.headers.get('x-content-type-options'), 'nosniff');
      assert.equal((await jsResponse.text()).length > 1000, true);

      assert.equal(cssResponse.status, 200);
      assert.match(cssResponse.headers.get('content-type') ?? '', /^text\/css; charset=utf-8/iu);
      assert.equal(cssResponse.headers.get('cache-control'), 'no-store');
      assert.equal(cssResponse.headers.get('x-content-type-options'), 'nosniff');
      assert.equal((await cssResponse.text()).length > 100, true);

      assert.equal(fallbackResponse.status, 200);
      assert.match(await fallbackResponse.text(), /<div id="root"><\/div>/u);

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
          }
        }
      ];

      for (const expectation of expectations) {
        const response = await fetch(`${context.baseUrl}${expectation.path}`);

        assert.equal(response.status, 200, expectation.path);
        assert.match(response.headers.get('content-type') ?? '', /^application\/json; charset=utf-8/iu);

        const payload = await response.json();

        assert.equal(payload.contractName, expectation.contractName);
        assert.equal(payload.contractVersion, '1');
        expectation.assertPayload(payload);
      }
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
        '/api/runs',
        '/api/runs/latest'
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

  it('does not expose repository files or traversal probes through /workbench', async () => {
    const context = await startConsoleServer();
    const blockedPaths = [
      '/workbench/package.json',
      '/workbench/pnpm-lock.yaml',
      '/workbench/src/symphony/console.js',
      '/workbench/docs/plans/v15-task8-workbench-static-serving-evidence-2026-05-27.md',
      '/workbench/%2e%2e/package.json',
      '/workbench/..%2fpackage.json',
      '/workbench/%2e%2e%2fpnpm-lock.yaml',
      '/workbench/%2e%2e%2fsrc%2fsymphony%2fconsole.js',
      '/workbench/%2e%2e%2fdocs%2fplans%2fv15-task8-workbench-static-serving-evidence-2026-05-27.md',
      '/workbench/%5c..%5cpackage.json'
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
    } finally {
      await cleanupConsoleServer(context);
    }
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
    nextAction: 'symphony status',
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME
  };

  await writeFixtureJson(join(stateDir, 'runs', `${ROUTE_SMOKE_RUN_ID}.json`), runState);
  await writeFixtureJson(join(stateDir, 'runs', 'latest.json'), runState);
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
      return commandResult({ exitCode: 0, stdout: 'v15-task9-workbench-route-smoke\n' });
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
