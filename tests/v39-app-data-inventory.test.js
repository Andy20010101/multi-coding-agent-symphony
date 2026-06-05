import { mkdir, mkdtemp, rm, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildAppDataInventory,
  validateAppDataInventoryContract
} from '../src/symphony/app-data-inventory.js';
import {
  READONLY_API_ROUTES,
  projectWorkbenchContracts
} from '../frontend/workbench/src/api/contracts.js';

const FIXED_TIME = '2026-06-05T00:00:00.000Z';
const GOAL_ID = 'v39-backup-diagnostics-migration-workspace';

describe('v39 app-data-inventory.v1 contract', () => {
  it('lists registry, snapshots, job state, artifact index, settings, provider profiles, and evidence refs', async () => {
    const root = await createRepoFixture();

    try {
      const inventory = await buildAppDataInventory({
        cwd: root,
        stateDir: join(root, '.symphony'),
        goalId: GOAL_ID,
        taskId: 'task-1',
        generatedAt: FIXED_TIME,
        startedAt: FIXED_TIME,
        env: {}
      });

      assert.deepEqual(validateAppDataInventoryContract(inventory), {
        ok: true,
        errors: []
      });
      assert.equal(inventory.contractName, 'app-data-inventory.v1');
      assert.equal(inventory.readOnly, true);
      assert.deepEqual(
        inventory.domains.map((domain) => domain.domainId),
        [
          'project-registry',
          'runtime-snapshots',
          'job-state',
          'artifact-index',
          'settings',
          'provider-profiles',
          'evidence-refs'
        ]
      );
      assert.equal(inventory.summary.persistedDataKinds.includes('artifact-index'), true);
      assert.equal(inventory.boundaries.shellExecutionAvailable, false);
      assert.equal(inventory.boundaries.modelInvocationAvailable, false);
      assert.equal(inventory.boundaries.arbitraryPathReadAvailable, false);
      assert.equal(inventory.boundaries.providerCliExecutionAvailable, false);
      assert.equal(inventory.boundaries.secretValueExposureAvailable, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects execution/write boundary drift', async () => {
    const inventory = await buildAppDataInventory({
      cwd: process.cwd(),
      goalId: GOAL_ID,
      taskId: 'task-1',
      generatedAt: FIXED_TIME,
      startedAt: FIXED_TIME,
      env: {}
    });
    const drift = structuredClone(inventory);

    drift.boundaries.shellExecutionAvailable = true;
    drift.boundaries.modelInvocationAvailable = true;
    drift.boundaries.gitWriteAvailable = true;
    drift.domains = drift.domains.filter((domain) => domain.domainId !== 'provider-profiles');

    const errors = validateAppDataInventoryContract(drift).errors;

    assert.equal(errors.includes('boundaries.shellExecutionAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.modelInvocationAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.gitWriteAvailable must be false'), true);
    assert.equal(errors.includes('domains must include provider-profiles'), true);
  });

  it('does not expose credential-bearing git remote URLs in settings refs', async () => {
    const remoteUrl = 'https://token:secret@example.com/org/private-repo.git';
    const root = await createRepoFixture({ remoteUrl });

    try {
      const inventory = await buildAppDataInventory({
        cwd: root,
        stateDir: join(root, '.symphony'),
        goalId: GOAL_ID,
        taskId: 'task-1',
        generatedAt: FIXED_TIME,
        startedAt: FIXED_TIME,
        env: {}
      });
      const settingsDomain = inventory.domains.find((domain) => domain.domainId === 'settings');
      const serialized = JSON.stringify(inventory);

      assert.deepEqual(validateAppDataInventoryContract(inventory), {
        ok: true,
        errors: []
      });
      assert.equal(settingsDomain.refs.some((ref) => ref.kind === 'remoteUrl'), false);
      assert.equal(settingsDomain.itemCount, 2);
      assert.equal(serialized.includes(remoteUrl), false);
      assert.equal(serialized.includes('token:secret'), false);
      assert.equal(inventory.settings.secretValueExposureAvailable, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves GET /api/app/data-inventory and rejects mutation/query probes without writing repo state', async () => {
    const root = await createRepoFixture();
    const server = createSymphonyConsoleServer({
      cwd: root,
      stateDir: join(root, '.symphony'),
      env: {
        OPENAI_API_KEY: 'sk-test-secret-value'
      }
    });
    const baseUrl = await listenOnRandomPort(server);

    try {
      const before = await snapshotDirectoryFiles(root);
      const response = await fetch(`${baseUrl}/api/app/data-inventory?goal=${GOAL_ID}&task=task-1`);

      assert.equal(response.status, 200);

      const inventory = await response.json();

      assert.deepEqual(validateAppDataInventoryContract(inventory), {
        ok: true,
        errors: []
      });
      assert.equal(JSON.stringify(inventory).includes('sk-test-secret-value'), false);

      const postResponse = await fetch(`${baseUrl}/api/app/data-inventory`, { method: 'POST' });
      const badQueryResponse = await fetch(`${baseUrl}/api/app/data-inventory?path=package.json`);
      const unsafeQueryResponse = await fetch(`${baseUrl}/api/app/data-inventory?goal=../escape`);

      assert.equal(postResponse.status, 405);
      assert.equal((await postResponse.json()).contractName, 'error-envelope.v1');
      assert.equal(badQueryResponse.status, 400);
      assert.equal((await badQueryResponse.json()).error.code, 'invalid-app-data-inventory-request');
      assert.equal(unsafeQueryResponse.status, 400);
      assert.equal((await unsafeQueryResponse.json()).error.code, 'invalid-app-data-inventory-request');
      assert.deepEqual(await snapshotDirectoryFiles(root), before);
    } finally {
      await closeServer(server);
      await rm(root, { recursive: true, force: true });
    }
  });

  it('is included in the Workbench read-only route model projection', async () => {
    const route = READONLY_API_ROUTES.find((candidate) => candidate.id === 'appDataInventory');
    const inventory = await buildAppDataInventory({
      cwd: process.cwd(),
      goalId: GOAL_ID,
      taskId: 'task-1',
      generatedAt: FIXED_TIME,
      startedAt: FIXED_TIME,
      env: {}
    });

    assert.equal(route.path, '/api/app/data-inventory');
    assert.equal(route.contractName, 'app-data-inventory.v1');

    const model = projectWorkbenchContracts({
      appDataInventory: {
        ok: true,
        route: route.path,
        method: route.method,
        routeDescriptor: route,
        httpStatus: 200,
        data: inventory
      }
    });

    assert.equal(model.appDataInventory.state, 'available');
    assert.equal(model.appDataInventory.domainCount.value, 7);
    assert.equal(model.appDataInventory.domains.items.some((domain) => domain.domainId.text === 'provider-profiles'), true);
    assert.equal(model.appDataInventory.boundaries.items.some((item) => item.key.text === 'shellExecutionAvailable' && item.value.value === false), true);
  });
});

async function createRepoFixture({ remoteUrl = null } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'symphony-v39-data-inventory-'));

  await mkdir(join(root, '.git'));
  await mkdir(join(root, '.symphony', 'artifacts'), { recursive: true });
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'v39-fixture' }), 'utf8');

  if (typeof remoteUrl === 'string' && remoteUrl.trim() !== '') {
    await writeFile(join(root, '.git', 'config'), [
      '[remote "origin"]',
      `  url = ${remoteUrl}`,
      ''
    ].join('\n'), 'utf8');
  }

  return root;
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

async function closeServer(server) {
  await new Promise((resolvePromise, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolvePromise();
    });
  });
}

async function snapshotDirectoryFiles(root) {
  const entries = [];

  async function walk(dir, prefix = '') {
    let dirents;
    try {
      dirents = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const dirent of dirents.sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = prefix === '' ? dirent.name : `${prefix}/${dirent.name}`;
      const abs = join(dir, dirent.name);

      entries.push(rel);
      if (dirent.isDirectory()) {
        await walk(abs, rel);
      }
    }
  }

  await walk(root);

  return entries;
}
