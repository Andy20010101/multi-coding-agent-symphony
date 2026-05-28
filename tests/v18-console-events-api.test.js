import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import { validateErrorEnvelopeContract } from '../src/symphony/error-envelope.js';
import { validateGoalEventLogContract } from '../src/symphony/goal-event-contracts.js';
import { appendGoalEvent } from '../src/symphony/goal-event-journal.js';
import { V18_GOAL_EVENT_JOURNAL_GOAL_ID } from '../src/symphony/goal-progress-ledger.js';

const GOAL_ID = V18_GOAL_EVENT_JOURNAL_GOAL_ID;

describe('v18 read-only goal events API routes', () => {
  it('serves latest and explicit goal event logs without writing state', async () => {
    const context = await startV18EventsConsoleServer();

    try {
      await appendGoalEvent({
        stateDir: context.stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:01:00.000Z',
        event: buildWorkerEvent({
          eventId: 'evt_task7_worker_started',
          eventType: 'worker.started',
          taskId: 'task-7',
          statement: 'Task 7 worker started the read-only events API implementation.'
        })
      });
      await appendGoalEvent({
        stateDir: context.stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:02:00.000Z',
        event: buildWorkerEvent({
          eventId: 'evt_task7_worker_self_checked',
          eventType: 'worker.self-check-passed',
          taskId: 'task-7',
          evidenceRefs: [{
            kind: 'repo-doc',
            ref: 'docs/plans/v18-task7-worker-evidence-2026-05-28.md',
            label: 'Task 7 worker evidence'
          }],
          statement: 'Task 7 worker self-check passed for the read-only events API.'
        })
      });

      const before = await snapshotDirectoryFiles(context.stateDir);
      const latestResponse = await fetch(`${context.baseUrl}/api/goals/latest/events`);
      const explicitResponse = await fetch(`${context.baseUrl}/api/goals/${GOAL_ID}/events`);

      for (const response of [latestResponse, explicitResponse]) {
        assert.equal(response.status, 200);

        const eventLog = await response.json();

        assert.deepEqual(validateGoalEventLogContract(eventLog), {
          ok: true,
          errors: []
        });
        assert.equal(eventLog.goalId, GOAL_ID);
        assert.equal(eventLog.log.eventCount, 2);
        assert.deepEqual(eventLog.events.map((event) => event.eventType), [
          'worker.started',
          'worker.self-check-passed'
        ]);
      }

      assert.deepEqual(await snapshotDirectoryFiles(context.stateDir), before);
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('returns an empty valid goal-event-log.v1 when the registered goal has no events', async () => {
    const context = await startV18EventsConsoleServer();

    try {
      const response = await fetch(`${context.baseUrl}/api/goals/latest/events`);
      const eventLog = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(validateGoalEventLogContract(eventLog), {
        ok: true,
        errors: []
      });
      assert.equal(eventLog.goalId, GOAL_ID);
      assert.equal(eventLog.log.eventCount, 0);
      assert.deepEqual(eventLog.events, []);
    } finally {
      await cleanupConsoleServer(context);
    }
  });

  it('returns safe error envelopes for method, unknown goal, query path, and traversal probes', async () => {
    const context = await startV18EventsConsoleServer();

    try {
      const probes = [
        {
          path: '/api/goals/latest/events',
          init: { method: 'POST' },
          status: 405,
          code: 'method-not-allowed'
        },
        {
          path: '/api/goals/not-registered/events',
          init: {},
          status: 404,
          code: 'goal-not-found'
        },
        {
          path: '/api/goals/latest/events?path=package.json',
          init: {},
          status: 400,
          code: 'invalid-goal-ref'
        },
        {
          path: '/api/goals/%2e%2e%2fpackage.json/events',
          init: {},
          status: 400,
          code: 'invalid-goal-ref'
        },
        {
          path: '/api/goals/%2FUsers%2Fandy%2Fpackage.json/events',
          init: {},
          status: 400,
          code: 'invalid-goal-ref'
        },
        {
          path: '/api/goals/file%3A%2F%2Fpackage.json/events',
          init: {},
          status: 400,
          code: 'invalid-goal-ref'
        },
        {
          path: '/api/goals/~%2Fpackage.json/events',
          init: {},
          status: 400,
          code: 'invalid-goal-ref'
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

async function startV18EventsConsoleServer() {
  const root = await mkdtemp(join(tmpdir(), 'symphony-v18-events-api-'));
  const stateDir = join(root, '.symphony');

  await mkdir(stateDir, { recursive: true });

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

function buildWorkerEvent({
  eventId,
  eventType,
  taskId,
  evidenceRefs = [],
  statement
}) {
  return {
    eventId,
    goalId: GOAL_ID,
    taskId,
    eventType,
    phase: 'implement',
    actor: {
      role: 'worker',
      id: 'codex-worker-task-7'
    },
    occurredAt: '2026-05-28T10:00:00.000Z',
    branch: 'codex/v18-task7-read-only-events-api',
    commit: null,
    evidenceRefs,
    statement
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
