import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import { validateCapabilitiesContract } from '../src/symphony/capabilities.js';
import { validateDiagnosticsContract } from '../src/symphony/diagnostics.js';
import { validateErrorEnvelopeContract } from '../src/symphony/error-envelope.js';
import {
  DEFAULT_GOAL_PROGRESS_GOAL_ID,
  validateGoalProgressLedgerContract
} from '../src/symphony/goal-progress-ledger.js';

describe('v17 read-only console API routes', () => {
  it('serves goal progress, capabilities, and diagnostics contracts without writing state', async () => {
    const context = await startV17ConsoleServer();

    try {
      const before = await snapshotDirectoryFiles(context.stateDir);
      const goalsResponse = await fetch(`${context.baseUrl}/api/goals`);
      const latestResponse = await fetch(`${context.baseUrl}/api/goals/latest/progress`);
      const explicitResponse = await fetch(`${context.baseUrl}/api/goals/${DEFAULT_GOAL_PROGRESS_GOAL_ID}/progress`);
      const capabilitiesResponse = await fetch(`${context.baseUrl}/api/capabilities`);
      const diagnosticsResponse = await fetch(`${context.baseUrl}/api/diagnostics`);

      assert.equal(goalsResponse.status, 200);
      const goals = await goalsResponse.json();

      assert.equal(goals.contractName, 'symphony.goals-index');
      assert.equal(goals.readOnly, true);
      assert.deepEqual(goals.goals.map((goal) => goal.goalId), [DEFAULT_GOAL_PROGRESS_GOAL_ID]);

      for (const response of [latestResponse, explicitResponse]) {
        assert.equal(response.status, 200);

        const ledger = await response.json();

        assert.deepEqual(validateGoalProgressLedgerContract(ledger), {
          ok: true,
          errors: []
        });
        assert.equal(ledger.tasks.find((task) => task.taskId === 'task-1').status, 'approved');
        assert.equal(ledger.tasks.find((task) => task.taskId === 'task-2').status, 'needs-revision');
      }

      const capabilities = await capabilitiesResponse.json();

      assert.equal(capabilitiesResponse.status, 200);
      assert.deepEqual(validateCapabilitiesContract(capabilities), {
        ok: true,
        errors: []
      });
      assert.equal(capabilities.browserExecutionAvailable, false);
      assert.equal(capabilities.artifactDownloadAvailable, false);

      const diagnostics = await diagnosticsResponse.json();

      assert.equal(diagnosticsResponse.status, 200);
      assert.deepEqual(validateDiagnosticsContract(diagnostics), {
        ok: true,
        errors: []
      });
      assert.equal(diagnostics.boundaries.readOnlyApi, true);

      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('returns safe error envelopes for method, unknown goal, query path, and traversal probes', async () => {
    const context = await startV17ConsoleServer();

    try {
      const probes = [
        {
          path: '/api/goals/latest/progress',
          init: { method: 'POST' },
          status: 405,
          code: 'method-not-allowed'
        },
        {
          path: '/api/goals/not-registered/progress',
          init: {},
          status: 404,
          code: 'goal-not-found'
        },
        {
          path: '/api/goals/latest/progress?path=package.json',
          init: {},
          status: 400,
          code: 'invalid-goal-ref'
        },
        {
          path: '/api/goals/%2e%2e%2fpackage.json/progress',
          init: {},
          status: 400,
          code: 'invalid-goal-ref'
        },
        {
          path: '/api/capabilities?path=package.json',
          init: {},
          status: 400,
          code: 'invalid-capabilities-request'
        },
        {
          path: '/api/diagnostics?path=package.json',
          init: {},
          status: 400,
          code: 'invalid-diagnostics-request'
        }
      ];

      for (const probe of probes) {
        const response = await fetch(`${context.baseUrl}${probe.path}`, probe.init);
        const body = await response.text();
        const envelope = JSON.parse(body);

        assert.equal(response.status, probe.status, probe.path);
        assert.equal(envelope.contractName, 'error-envelope.v1');
        assert.equal(envelope.error.code, probe.code);
        assert.deepEqual(validateErrorEnvelopeContract(envelope), {
          ok: true,
          errors: []
        });
        assert.doesNotMatch(body, /\/Users\/|multi-coding-agent-symphony|lockfileVersion|createSymphonyConsoleServer/u);
      }
    } finally {
      await cleanupConsoleServer(context);
    }
  });
});

async function startV17ConsoleServer() {
  const root = await mkdtemp(join(tmpdir(), 'symphony-v17-console-api-'));
  const stateDir = join(root, '.symphony');

  await writeFixtureJson(join(stateDir, 'goals', `${DEFAULT_GOAL_PROGRESS_GOAL_ID}.json`), {
    contractName: 'symphony.goal-progress-state',
    contractVersion: '1',
    goalId: DEFAULT_GOAL_PROGRESS_GOAL_ID,
    tasks: [{
      taskId: 'task-1',
      reviewVerdict: 'APPROVED',
      reviewEvidenceRef: 'docs/plans/v17-task1-reviewer-approval-2026-05-28.md'
    }, {
      taskId: 'task-2',
      reviewVerdict: 'NEEDS_REVISION',
      reviewEvidenceRef: 'docs/plans/v17-task2-reviewer-needs-revision-2026-05-28.md'
    }]
  });

  const server = createSymphonyConsoleServer({
    stateDir,
    cwd: root,
    env: { HOME: root }
  });
  const baseUrl = await listenOnRandomPort(server);

  return {
    root,
    stateDir,
    server,
    baseUrl
  };
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

async function snapshotDirectoryFiles(root) {
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
