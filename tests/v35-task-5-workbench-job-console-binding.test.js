import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import {
  buildJobModelContract,
  validateJobModelContract
} from '../src/symphony/job-model-contract.js';
import {
  validateJobCreationContract
} from '../src/symphony/job-creation-contract.js';
import {
  buildJobTimelineLogStreamContract,
  validateJobTimelineLogStreamContract
} from '../src/symphony/job-timeline-contract.js';
import {
  buildJobRunControlContract,
  validateJobRunControlContract
} from '../src/symphony/job-run-control-contract.js';
import {
  READONLY_API_ROUTES,
  READONLY_API_ROUTE_ALLOWLIST,
  projectWorkbenchContracts
} from '../frontend/workbench/src/api/contracts.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';

const FIXED_TIME = '2026-06-03T00:00:00.000Z';
const V35_GOAL_ID = 'v35-job-queue-run-control-workspace';

describe('v35 task-5 Workbench job console binding', () => {
  it('includes all four job API routes in the read-only allowlist', () => {
    const jobRouteIds = new Set(['jobModel', 'jobCreation', 'jobTimeline', 'jobRunControl']);
    const jobRoutes = READONLY_API_ROUTES.filter((route) => jobRouteIds.has(route.id));

    assert.equal(jobRoutes.length, 4);

    const paths = jobRoutes.map((route) => [route.method, route.path, route.contractName]);

    assert.deepEqual(paths, [
      ['GET', '/api/jobs', 'job-model.v1'],
      ['GET', '/api/jobs/create', 'job-creation.v1'],
      ['GET', '/api/jobs/timeline', 'job-timeline-log-stream.v1'],
      ['GET', '/api/jobs/control', 'job-run-control.v1']
    ]);

    const allowlistPaths = READONLY_API_ROUTE_ALLOWLIST
      .filter((route) => jobRouteIds.has(route.id))
      .map((route) => [route.method, route.path, route.contractName]);

    assert.deepEqual(allowlistPaths, paths);
  });

  it('serves all four job API routes and returns valid contracts', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const jobModelResponse = await fetch(`${baseUrl}/api/jobs?goal=${encodeURIComponent(V35_GOAL_ID)}&task=task-1`);
      const jobCreationResponse = await fetch(`${baseUrl}/api/jobs/create?goal=${encodeURIComponent(V35_GOAL_ID)}&task=task-1&action=goal.worker-evidence.record`);
      const jobTimelineResponse = await fetch(`${baseUrl}/api/jobs/timeline?goal=${encodeURIComponent(V35_GOAL_ID)}&task=task-1`);
      const jobRunControlResponse = await fetch(`${baseUrl}/api/jobs/control?goal=${encodeURIComponent(V35_GOAL_ID)}&task=task-1&state=queued`);

      assert.equal(jobModelResponse.status, 200);
      assert.equal(jobCreationResponse.status, 200);
      assert.equal(jobTimelineResponse.status, 200);
      assert.equal(jobRunControlResponse.status, 200);

      const jobModel = await jobModelResponse.json();
      const jobCreation = await jobCreationResponse.json();
      const jobTimeline = await jobTimelineResponse.json();
      const jobRunControl = await jobRunControlResponse.json();

      assert.equal(jobModel.contractName, 'job-model.v1');
      assert.equal(jobCreation.contractName, 'job-creation.v1');
      assert.equal(jobTimeline.contractName, 'job-timeline-log-stream.v1');
      assert.equal(jobRunControl.contractName, 'job-run-control.v1');

      assert.deepEqual(validateJobModelContract(jobModel), { ok: true, errors: [] });
      assert.deepEqual(validateJobCreationContract(jobCreation), { ok: true, errors: [] });
      assert.deepEqual(validateJobTimelineLogStreamContract(jobTimeline), { ok: true, errors: [] });
      assert.deepEqual(validateJobRunControlContract(jobRunControl), { ok: true, errors: [] });
    } finally {
      await closeServer(server);
    }
  });

  it('preserves all four job contracts after projectWorkbenchContracts projection', async () => {
    const jobModel = buildJobModelContract({
      goalId: V35_GOAL_ID,
      taskId: 'task-1',
      actionId: 'goal.worker-evidence.record',
      generatedAt: FIXED_TIME
    });
    const jobTimeline = buildJobTimelineLogStreamContract({
      goalId: V35_GOAL_ID,
      taskId: 'task-1',
      generatedAt: FIXED_TIME
    });
    const jobRunControl = buildJobRunControlContract({
      goalId: V35_GOAL_ID,
      taskId: 'task-1',
      currentState: 'queued',
      generatedAt: FIXED_TIME
    });
    const jobCreation = JSON.parse(await readFile('fixtures/contracts/job-creation.v1.json', 'utf8'));

    assert.deepEqual(validateJobModelContract(jobModel), { ok: true, errors: [] });
    assert.deepEqual(validateJobCreationContract(jobCreation), { ok: true, errors: [] });
    assert.deepEqual(validateJobTimelineLogStreamContract(jobTimeline), { ok: true, errors: [] });
    assert.deepEqual(validateJobRunControlContract(jobRunControl), { ok: true, errors: [] });

    const model = projectWorkbenchContracts({
      jobModel: routeResult('jobModel', jobModel),
      jobCreation: routeResult('jobCreation', jobCreation),
      jobTimeline: routeResult('jobTimeline', jobTimeline),
      jobRunControl: routeResult('jobRunControl', jobRunControl)
    });

    assert.equal(model.jobConsole.state, 'available');
    assert.equal(model.jobConsole.jobModel.contractName.text, 'job-model.v1');
    assert.equal(model.jobConsole.jobCreation.contractName.text, 'job-creation.v1');
    assert.equal(model.jobConsole.jobTimeline.contractName.text, 'job-timeline-log-stream.v1');
    assert.equal(model.jobConsole.jobRunControl.contractName.text, 'job-run-control.v1');
    assert.equal(model.jobConsole.jobRunControl.currentState.text, 'queued');
    assert.deepEqual(
      model.jobConsole.jobRunControl.availableTransitions.items.map((item) => item.text),
      ['pause', 'cancel']
    );
    assert.equal(model.jobConsole.jobRunControl.transitionTable.count.text, '4');

    assert.equal(jobModel.contractName, 'job-model.v1');
    assert.equal(jobModel.readOnly, true);
    assert.equal(jobCreation.contractName, 'job-creation.v1');
    assert.equal(jobCreation.readOnly, true);
    assert.equal(jobTimeline.contractName, 'job-timeline-log-stream.v1');
    assert.equal(jobTimeline.readOnly, true);
    assert.equal(jobRunControl.contractName, 'job-run-control.v1');
    assert.equal(jobRunControl.readOnly, true);

    for (const field of [
      'jobExecutionAvailable',
      'actionExecutionAvailable',
      'modelInvocationAvailable',
      'arbitraryCommandExecutionAvailable',
      'arbitraryPathReadAvailable',
      'gitWriteAvailable',
      'mergeAvailable',
      'pushAvailable',
      'tagAvailable',
      'publishAvailable',
      'selfApprovalAvailable'
    ]) {
      assert.equal(jobModel.boundaries[field], false, `${field} must be false in job-model`);
      assert.equal(jobTimeline.boundaries[field], false, `${field} must be false in job-timeline`);
      assert.equal(jobRunControl.boundaries[field], false, `${field} must be false in job-run-control`);
    }
  });

  it('rejects non-GET requests on all four job API routes', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const routes = [
        '/api/jobs',
        '/api/jobs/create',
        '/api/jobs/timeline',
        '/api/jobs/control'
      ];

      for (const route of routes) {
        const postResponse = await fetch(`${baseUrl}${route}`, { method: 'POST' });
        assert.equal(postResponse.status, 405, `POST ${route} must return 405`);

        const putResponse = await fetch(`${baseUrl}${route}`, { method: 'PUT' });
        assert.equal(putResponse.status, 405, `PUT ${route} must return 405`);

        const deleteResponse = await fetch(`${baseUrl}${route}`, { method: 'DELETE' });
        assert.equal(deleteResponse.status, 405, `DELETE ${route} must return 405`);
      }
    } finally {
      await closeServer(server);
    }
  });

  it('rejects unsafe query parameters on all four job API routes', async () => {
    const server = createSymphonyConsoleServer();
    const baseUrl = await listenOnRandomPort(server);

    try {
      const badResponses = await Promise.all([
        fetch(`${baseUrl}/api/jobs?goal=../../etc/passwd`),
        fetch(`${baseUrl}/api/jobs/create?goal=${encodeURIComponent(V35_GOAL_ID)}&action=../../etc/passwd`),
        fetch(`${baseUrl}/api/jobs/timeline?job_id=../../etc/passwd`),
        fetch(`${baseUrl}/api/jobs/control?state=invalid-state`)
      ]);

      for (const response of badResponses) {
        assert.equal(response.status, 400);
      }
    } finally {
      await closeServer(server);
    }
  });

  it('statically keeps the Workbench job console free of execution, write, download, and model entry points', async () => {
    const assetsDir = 'src/symphony/workbench-static/assets';
    const entries = await readdir(assetsDir);
    const scriptFile = entries.find((name) => name.startsWith('index-') && name.endsWith('.js'));

    assert.ok(scriptFile !== undefined, 'Workbench script asset must exist');

    const scriptSrc = await readFile(join(assetsDir, scriptFile), 'utf8');

    const executionChecks = [
      { pattern: /child_process/gu, label: 'child_process' },
      { pattern: /\bexec\s*\(/gu, label: 'exec()' },
      { pattern: /\bspawn\s*\(/gu, label: 'spawn()' },
      { pattern: /\bfork\s*\(/gu, label: 'fork()' },
      { pattern: /\beval\s*\(/gu, label: 'eval()' },
      { pattern: /\bFunction\s*\(/gu, label: 'Function() constructor' },
      { pattern: /\bXMLHttpRequest\b/gu, label: 'XMLHttpRequest' },
      { pattern: /\bWebSocket\b/gu, label: 'WebSocket' },
      { pattern: /\.writeFile\b/gu, label: 'writeFile' },
      { pattern: /\.unlink\b/gu, label: 'unlink' },
      { pattern: /\.rmdir\b/gu, label: 'rmdir' },
      { pattern: /\.mkdir\b/gu, label: 'mkdir' },
      { pattern: /\bprocess\.env\b/gu, label: 'process.env' },
      { pattern: /\blocalStorage\b/gu, label: 'localStorage' },
      { pattern: /\bsessionStorage\b/gu, label: 'sessionStorage' },
      { pattern: /\bindexedDB\b/gu, label: 'indexedDB' }
    ];

    for (const check of executionChecks) {
      assert.equal(check.pattern.test(scriptSrc), false, `Workbench script must not contain ${check.label}`);
    }

    assert.match(scriptSrc, /job-console-panel/u, 'Workbench script must contain the job console panel id');
    assert.match(scriptSrc, /v35 job queue/u, 'Workbench script must contain the v35 job queue label');
    assert.match(scriptSrc, /Job Console/gu, 'Workbench script must contain the Job Console title');
    assert.match(scriptSrc, /job-console-grid/u, 'Workbench script must contain the job console grid class');
    assert.match(scriptSrc, /transition-table/u, 'Workbench script must contain the transition table class');
  });
});

function routeResult(routeId, data) {
  const route = READONLY_API_ROUTES.find((candidate) => candidate.id === routeId);

  return {
    ok: true,
    route: route.path,
    method: route.method,
    routeDescriptor: route,
    httpStatus: 200,
    data
  };
}

async function listenOnRandomPort(server) {
  await new Promise((resolveListen) => {
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();

  return `http://${address.address}:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolveClose) => {
    server.close(resolveClose);
  });
}
