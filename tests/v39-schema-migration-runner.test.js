import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildAppSchemaMigrationContract,
  validateAppSchemaMigrationContract
} from '../src/symphony/app-schema-migration.js';

describe('v39 app-schema-migration.v1 contract', () => {
  it('validates the fixture and generated dry-run preview', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/app-schema-migration.v1.json', 'utf8'));
    const generated = buildAppSchemaMigrationContract({
      generatedAt: '2026-06-05T00:00:00.000Z'
    });

    assert.deepEqual(validateAppSchemaMigrationContract(fixture), {
      ok: true,
      errors: []
    });
    assert.deepEqual(validateAppSchemaMigrationContract(generated), {
      ok: true,
      errors: []
    });
    assert.equal(generated.schema.currentVersion, 1);
    assert.equal(generated.schema.targetVersion, 2);
    assert.equal(generated.dryRun.defaultMode, true);
    assert.equal(generated.dryRun.previewOnly, true);
    assert.equal(generated.dryRun.writesAttempted, false);
    assert.equal(generated.confirmation.required, true);
    assert.equal(generated.confirmation.actionId, 'app.schema.migration.confirm');
  });

  it('rejects write, execution, browser confirm, and release boundary drift', () => {
    const contract = buildAppSchemaMigrationContract({
      generatedAt: '2026-06-05T00:00:00.000Z'
    });
    const drift = structuredClone(contract);

    drift.dryRun.writesAttempted = true;
    drift.confirmation.confirmAvailableFromBrowser = true;
    drift.boundaries.writesInDryRunAvailable = true;
    drift.boundaries.shellExecutionAvailable = true;
    drift.boundaries.modelInvocationAvailable = true;
    drift.boundaries.migrationConfirmExecuted = true;
    drift.boundaries.gitWriteAvailable = true;
    drift.boundaries.releaseReadyDeclarationAvailable = true;

    const errors = validateAppSchemaMigrationContract(drift).errors;

    assert.equal(errors.includes('dryRun.writesAttempted must be false'), true);
    assert.equal(errors.includes('confirmation.confirmAvailableFromBrowser must be false'), true);
    assert.equal(errors.includes('boundaries.writesInDryRunAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.shellExecutionAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.modelInvocationAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.migrationConfirmExecuted must be false'), true);
    assert.equal(errors.includes('boundaries.gitWriteAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.releaseReadyDeclarationAvailable must be false'), true);
  });

  it('rejects missing inventory source contracts and unsafe context refs', () => {
    const contract = buildAppSchemaMigrationContract({
      generatedAt: '2026-06-05T00:00:00.000Z'
    });
    const missingSource = structuredClone(contract);
    missingSource.context.sourceContracts = missingSource.context.sourceContracts.filter((name) => name !== 'app-data-inventory.v1');

    assert.equal(
      validateAppSchemaMigrationContract(missingSource).errors.includes('context.sourceContracts must include app-data-inventory.v1'),
      true
    );

    const unsafe = structuredClone(contract);
    unsafe.context.goalId = '../escape';
    assert.equal(validateAppSchemaMigrationContract(unsafe).errors.includes('context.goalId must be a safe ref'), true);
  });

  it('exposes symphony app-data migration --json without writing repository state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v39-app-schema-cli-'));

    try {
      await mkdir(join(root, '.git'));
      const before = await snapshotDirectoryFiles(root);
      const output = createOutput();
      const originalCwd = process.cwd();

      try {
        process.chdir(root);
        const exitCode = await runSymphonyCli({
          argv: ['app-data', 'migration', '--json'],
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 0);
      } finally {
        process.chdir(originalCwd);
      }

      assert.equal(output.stderrText(), '');

      const migration = JSON.parse(output.stdoutText());

      assert.deepEqual(validateAppSchemaMigrationContract(migration), {
        ok: true,
        errors: []
      });
      assert.deepEqual(await snapshotDirectoryFiles(root), before);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves GET /api/app-data/migration and rejects mutation/query probes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v39-app-schema-api-'));

    try {
      await mkdir(join(root, '.git'));
      const server = createSymphonyConsoleServer({
        stateDir: join(root, '.symphony'),
        cwd: root
      });
      const baseUrl = await listenOnRandomPort(server);

      try {
        const before = await snapshotDirectoryFiles(root);
        const response = await fetch(`${baseUrl}/api/app-data/migration`);

        assert.equal(response.status, 200);

        const migration = await response.json();

        assert.deepEqual(validateAppSchemaMigrationContract(migration), {
          ok: true,
          errors: []
        });
        assert.equal(migration.dryRun.writesAttempted, false);

        const postResponse = await fetch(`${baseUrl}/api/app-data/migration`, { method: 'POST' });
        const queryResponse = await fetch(`${baseUrl}/api/app-data/migration?confirm=true`);

        assert.equal(postResponse.status, 405);
        assert.equal((await postResponse.json()).contractName, 'error-envelope.v1');
        assert.equal(queryResponse.status, 400);
        assert.equal((await queryResponse.json()).error.code, 'invalid-app-schema-migration-request');
        assert.deepEqual(await snapshotDirectoryFiles(root), before);
      } finally {
        await closeServer(server);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function createOutput() {
  const stdoutChunks = [];
  const stderrChunks = [];

  return {
    stdout: {
      write(chunk) {
        stdoutChunks.push(String(chunk));
      }
    },
    stderr: {
      write(chunk) {
        stderrChunks.push(String(chunk));
      }
    },
    stdoutText() {
      return stdoutChunks.join('');
    },
    stderrText() {
      return stderrChunks.join('');
    }
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

      if (entry.isDirectory()) {
        files.push(`${relativePath}/`);
        await visit(join(current, entry.name), relativePath);
      } else {
        files.push(relativePath);
      }
    }
  }

  await visit(root);
  return files.sort();
}
