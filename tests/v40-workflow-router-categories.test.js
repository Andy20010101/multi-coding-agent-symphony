import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildWorkflowRouterCategoriesContract,
  validateWorkflowRouterCategoriesContract
} from '../src/symphony/workflow-router-categories.js';

describe('v40 workflow-router-categories.v1 contract', () => {
  it('validates the fixture and generated category resolver', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/workflow-router-categories.v1.json', 'utf8'));
    const generated = buildWorkflowRouterCategoriesContract({
      generatedAt: '2026-06-05T00:00:00.000Z'
    });

    assert.deepEqual(validateWorkflowRouterCategoriesContract(fixture), {
      ok: true,
      errors: []
    });
    assert.deepEqual(validateWorkflowRouterCategoriesContract(generated), {
      ok: true,
      errors: []
    });
    assert.deepEqual(generated.categories.map((category) => category.categoryId), [
      'direct-answer',
      'skill',
      'automation',
      'workbench-goal',
      'research',
      'ignore-skip'
    ]);
    assert.equal(generated.decisionPolicy.defaultCategoryId, 'workbench-goal');
    assert.equal(generated.decisionPolicy.requiresHumanConfirmationForGoalDraft, true);
    assert.equal(generated.boundaries.modelInvocationAvailable, false);
    assert.equal(generated.boundaries.arbitraryCommandExecutionAvailable, false);
    assert.equal(generated.boundaries.selfApprovalAvailable, false);
  });

  it('rejects missing categories, write drift, execution drift, and unsafe context refs', () => {
    const contract = buildWorkflowRouterCategoriesContract({
      generatedAt: '2026-06-05T00:00:00.000Z'
    });
    const drift = structuredClone(contract);

    drift.context.goalId = '../escape';
    drift.categories = drift.categories.filter((category) => category.categoryId !== 'research');
    drift.decisionPolicy.writesRouteDecision = true;
    drift.decisionPolicy.modelInvocationRequired = true;
    drift.boundaries.actionExecutionAvailable = true;
    drift.boundaries.jobCreationAvailable = true;
    drift.boundaries.researchFetchAvailable = true;
    drift.boundaries.gitWriteAvailable = true;
    drift.boundaries.releaseReadyDeclarationAvailable = true;

    const errors = validateWorkflowRouterCategoriesContract(drift).errors;

    assert.equal(errors.includes('context.goalId must be a safe ref'), true);
    assert.equal(errors.includes('categories must be ordered as direct-answer,skill,automation,workbench-goal,research,ignore-skip'), true);
    assert.equal(errors.includes('examples must include research'), false);
    assert.equal(errors.includes('decisionPolicy.writesRouteDecision must be false'), true);
    assert.equal(errors.includes('decisionPolicy.modelInvocationRequired must be false'), true);
    assert.equal(errors.includes('boundaries.actionExecutionAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.jobCreationAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.researchFetchAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.gitWriteAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.releaseReadyDeclarationAvailable must be false'), true);
  });

  it('serves GET /api/workflow/router-categories and rejects mutation/query probes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v40-workflow-router-api-'));

    try {
      await mkdir(join(root, '.git'));
      const server = createSymphonyConsoleServer({
        stateDir: join(root, '.symphony'),
        cwd: root
      });
      const baseUrl = await listenOnRandomPort(server);

      try {
        const before = await snapshotDirectoryFiles(root);
        const response = await fetch(`${baseUrl}/api/workflow/router-categories`);

        assert.equal(response.status, 200);

        const router = await response.json();

        assert.deepEqual(validateWorkflowRouterCategoriesContract(router), {
          ok: true,
          errors: []
        });
        assert.equal(router.categories.find((category) => category.categoryId === 'automation').routeKind, 'controlled-action');

        const postResponse = await fetch(`${baseUrl}/api/workflow/router-categories`, { method: 'POST' });
        const queryResponse = await fetch(`${baseUrl}/api/workflow/router-categories?category=research`);

        assert.equal(postResponse.status, 405);
        assert.equal((await postResponse.json()).contractName, 'error-envelope.v1');
        assert.equal(queryResponse.status, 400);
        assert.equal((await queryResponse.json()).error.code, 'invalid-workflow-router-categories-request');
        assert.deepEqual(await snapshotDirectoryFiles(root), before);
      } finally {
        await closeServer(server);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

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
      if (error) {
        reject(error);
        return;
      }

      resolvePromise();
    });
  });
}

async function snapshotDirectoryFiles(root) {
  const files = [];

  async function visit(current, prefix = '') {
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
      const absolutePath = join(current, entry.name);

      if (entry.isDirectory()) {
        await visit(absolutePath, relativePath);
        continue;
      }

      files.push(relativePath);
    }
  }

  await visit(root);
  return files.sort();
}
