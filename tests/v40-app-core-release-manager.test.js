import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  APP_CORE_RELEASE_MANAGER_CONTRACT_NAME,
  buildAppCoreReleaseManager,
  validateAppCoreReleaseManagerContract
} from '../src/symphony/app-core-release-manager.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import { projectWorkbenchContracts } from '../frontend/workbench/src/api/contracts.js';

const V40_GOAL_ID = 'v40-personal-workflow-router-app-core-release';
const FIXED_TIME = '2026-06-05T00:00:00.000Z';

describe('v40 app-core-release-manager.v1 contract', () => {
  let root;
  let stateDir;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'symphony-v40-release-manager-'));
    stateDir = join(root, '.symphony');
    await seedManagedGoalState(root, stateDir);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('builds a read-only release manager checklist and final evidence draft', async () => {
    const manager = await buildAppCoreReleaseManager({
      cwd: root,
      stateDir,
      goalId: V40_GOAL_ID,
      taskId: 'task-4',
      generatedAt: FIXED_TIME,
      startedAt: FIXED_TIME,
      env: {}
    });

    assert.equal(manager.contractName, APP_CORE_RELEASE_MANAGER_CONTRACT_NAME);
    assert.equal(manager.readOnly, true);
    assert.equal(manager.context.resolvedGoalId, V40_GOAL_ID);
    assert.equal(manager.releaseReadiness.state, 'blocked');
    assert.equal(manager.releaseReadiness.declarationAuthorized, false);
    assert.equal(manager.releaseReadiness.declarationCommandAvailable, false);
    assert.equal(manager.closeoutStatus.totalTasks, 5);
    assert.equal(manager.closeoutStatus.missingCount > 0, true);
    assert.equal(manager.capabilityChecklist.totalCount, 6);
    assert.equal(manager.capabilityChecklist.items.some((item) => item.version === 'v34' && item.id === 'action-registry'), true);
    assert.equal(manager.capabilityChecklist.items.some((item) => item.version === 'v39' && item.id === 'backup-diagnostics-migration'), true);
    assert.equal(manager.finalEvidenceDraft.evidenceRef, 'docs/plans/v40-release-evidence-2026-06-02.md');
    assert.equal(manager.finalEvidenceDraft.releaseReadyDeclarationIncluded, false);
    assert.equal(manager.boundaries.releaseReadyDeclarationAvailable, false);
    assert.equal(manager.boundaries.closeoutExecutionAvailable, false);
    assert.equal(manager.boundaries.tagAvailable, false);
    assert.deepEqual(validateAppCoreReleaseManagerContract(manager), {
      ok: true,
      errors: []
    });
  });

  it('rejects release manager boundary drift', async () => {
    const manager = await buildAppCoreReleaseManager({
      cwd: root,
      stateDir,
      goalId: V40_GOAL_ID,
      generatedAt: FIXED_TIME,
      env: {}
    });
    const drift = structuredClone(manager);

    drift.boundaries.releaseReadyDeclarationAvailable = true;
    drift.boundaries.frontendStatusInferenceAvailable = true;
    drift.releaseReadiness.declarationAuthorized = true;

    const errors = validateAppCoreReleaseManagerContract(drift).errors;

    assert.equal(errors.includes('boundaries.releaseReadyDeclarationAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.frontendStatusInferenceAvailable must be false'), true);
    assert.equal(errors.includes('releaseReadiness.declarationAuthorized must be false'), true);
  });

  it('serves the Workbench app-core release manager route and rejects unsafe requests', async () => {
    const server = createSymphonyConsoleServer({ cwd: root, stateDir, env: {} });
    const baseUrl = await listenOnRandomPort(server);

    try {
      const validResponse = await fetch(`${baseUrl}/api/release/app-core-manager?goal=${V40_GOAL_ID}&task=task-4`);
      const invalidResponse = await fetch(`${baseUrl}/api/release/app-core-manager?path=docs/plans`);
      const unsafeResponse = await fetch(`${baseUrl}/api/release/app-core-manager?goal=..%2F..%2Fpackage.json`);
      const postResponse = await fetch(`${baseUrl}/api/release/app-core-manager`, { method: 'POST' });

      assert.equal(validResponse.status, 200);
      assert.equal(invalidResponse.status, 400);
      assert.equal(unsafeResponse.status, 400);
      assert.equal(postResponse.status, 405);

      const body = await validResponse.json();
      assert.equal(body.contractName, APP_CORE_RELEASE_MANAGER_CONTRACT_NAME);
      assert.equal(body.boundaries.releaseReadyDeclarationAvailable, false);
      assert.equal((await invalidResponse.json()).error.code, 'invalid-app-core-release-manager-request');
      assert.equal((await unsafeResponse.json()).error.code, 'invalid-app-core-release-manager-request');
    } finally {
      await closeServer(server);
    }
  });

  it('projects the Workbench panel model without release mutation controls', async () => {
    const manager = await buildAppCoreReleaseManager({
      cwd: root,
      stateDir,
      goalId: V40_GOAL_ID,
      generatedAt: FIXED_TIME,
      env: {}
    });
    const model = projectWorkbenchContracts({
      appCoreReleaseManager: {
        ok: true,
        route: '/api/release/app-core-manager',
        method: 'GET',
        httpStatus: 200,
        routeDescriptor: {
          id: 'appCoreReleaseManager',
          label: 'App Core Release Manager',
          path: '/api/release/app-core-manager',
          method: 'GET',
          contractName: APP_CORE_RELEASE_MANAGER_CONTRACT_NAME
        },
        data: manager
      }
    });

    assert.equal(model.appCoreReleaseManager.contractName.value, APP_CORE_RELEASE_MANAGER_CONTRACT_NAME);
    assert.equal(model.appCoreReleaseManager.releaseReadiness.declarationAuthorized.value, false);
    assert.equal(model.appCoreReleaseManager.releaseReadiness.declarationCommandAvailable.value, false);
    assert.equal(model.appCoreReleaseManager.capabilityChecklist.items.value.length, 6);
    assert.equal(model.appCoreReleaseManager.boundaries.releaseReadyDeclarationAvailable.value, false);
    assert.equal(model.appCoreReleaseManager.boundaries.tagAvailable.value, false);
  });
});

async function seedManagedGoalState(root, stateDir) {
  const runbook = JSON.parse(await readFile('fixtures/contracts/goal-runbook.v40-personal-workflow-router-app-core-release.v1.json', 'utf8'));

  await mkdir(join(root, '.git'), { recursive: true });
  await writeFile(join(root, '.git', 'HEAD'), 'ref: refs/heads/main\n', 'utf8');
  await writeFile(join(root, '.git', 'config'), '[remote "origin"]\n\turl = git@example.com:fixture/project.git\n', 'utf8');
  await writeFile(join(root, 'package.json'), '{"name":"fixture-project"}\n', 'utf8');
  await mkdir(join(stateDir, 'goals', 'runbooks'), { recursive: true });
  await mkdir(join(stateDir, 'goals', 'events'), { recursive: true });
  await writeFile(
    join(stateDir, 'goals', 'runbooks', `${V40_GOAL_ID}.json`),
    JSON.stringify({
      contractName: 'managed-goal-runbook-state.v1',
      contractVersion: 1,
      goalId: V40_GOAL_ID,
      planHash: 'sha256:test',
      active: true,
      storage: 'repo-local-managed-goal-runbook-state',
      source: { kind: 'repo-fixture', ref: 'fixtures/contracts/goal-runbook.v40-personal-workflow-router-app-core-release.v1.json' },
      runbook,
      stateRefs: {},
      safety: {
        managedPathOnly: true,
        arbitraryPathReadAvailable: false,
        arbitraryPathWriteAvailable: false,
        modelInvocationAvailable: false
      }
    }),
    'utf8'
  );
  await writeFile(
    join(stateDir, 'goals', 'latest-active-goal.json'),
    JSON.stringify({
      contractName: 'managed-active-goal-pointer.v1',
      contractVersion: 1,
      goalId: V40_GOAL_ID,
      planHash: 'sha256:test',
      storage: 'repo-local-managed-active-goal-pointer',
      runbookStateRef: `goals/runbooks/${V40_GOAL_ID}.json`
    }),
    'utf8'
  );
  await writeFile(join(stateDir, 'goals', 'events', `${V40_GOAL_ID}.ndjson`), '', 'utf8');
}

async function listenOnRandomPort(server) {
  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', resolve);
    server.once('error', reject);
  });

  const address = server.address();

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
