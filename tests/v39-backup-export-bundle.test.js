import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  APP_CORE_BACKUP_EXPORT_CONTRACT_NAME,
  buildAppCoreBackupExport,
  validateAppCoreBackupExportContract,
  assertAppCoreBackupExportContract
} from '../src/symphony/app-core-backup-export.js';
import { computeGoalEventHash } from '../src/symphony/goal-event-contracts.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import { runSymphonyCli } from '../scripts/symphony.js';

const V39_GOAL_ID = 'v39-backup-diagnostics-migration-workspace';
const FIXED_TIME = '2026-06-05T00:00:00.000Z';

describe('v39 app-core-backup-export.v1 contract', () => {
  let root;
  let stateDir;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'symphony-v39-backup-export-'));
    stateDir = join(root, '.symphony');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('validates the fixture and rejects backup boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/app-core-backup-export.v1.json', 'utf8'));

    assert.deepEqual(validateAppCoreBackupExportContract(fixture), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.boundaries.copiesRepoContent = true;
    drift.boundaries.writesBundleFile = true;
    drift.boundaries.arbitraryPathReadAvailable = true;
    drift.boundaries.repoContentPolicy = 'included';

    const errors = validateAppCoreBackupExportContract(drift).errors;

    assert.equal(errors.includes('boundaries.copiesRepoContent must be false'), true);
    assert.equal(errors.includes('boundaries.writesBundleFile must be false'), true);
    assert.equal(errors.includes('boundaries.arbitraryPathReadAvailable must be false'), true);
    assert.equal(errors.includes('boundaries.repoContentPolicy must be excluded'), true);
  });

  it('builds a manifest with managed state hashes, artifact refs, and excluded repo content only', async () => {
    await mkdir(join(stateDir, 'goals', 'events'), { recursive: true });
    await mkdir(join(stateDir, 'runs'), { recursive: true });
    await mkdir(join(stateDir, 'artifacts', 'task-3'), { recursive: true });

    const event = stampEventHash({
      eventId: 'evt_v39_worker',
      goalId: V39_GOAL_ID,
      taskId: 'task-3',
      eventType: 'worker.evidence-recorded',
      phase: 'implement',
      actor: { role: 'worker', id: 'codex-v39-task-3-worker' },
      occurredAt: FIXED_TIME,
      recordedAt: FIXED_TIME,
      branch: null,
      commit: null,
      evidenceRefs: [
        { kind: 'repo-doc', ref: 'docs/plans/v39-task-3-worker-evidence-2026-06-02.md', label: 'Worker evidence' }
      ],
      statement: 'Worker evidence recorded.'
    });

    await writeFile(
      join(stateDir, 'goals', 'events', `${V39_GOAL_ID}.ndjson`),
      `${JSON.stringify(event)}\n`,
      'utf8'
    );
    await writeFile(
      join(stateDir, 'runs', 'latest.json'),
      JSON.stringify({ runId: 'run-v39', goalId: V39_GOAL_ID }),
      'utf8'
    );
    await writeFile(
      join(stateDir, 'artifacts', 'task-3', 'worker-evidence.json'),
      JSON.stringify({ goalId: V39_GOAL_ID, taskId: 'task-3', evidenceRef: 'docs/plans/v39-task-3-worker-evidence-2026-06-02.md' }),
      'utf8'
    );

    const backupExport = await buildAppCoreBackupExport({
      cwd: root,
      stateDir,
      goalId: V39_GOAL_ID,
      taskId: 'task-3',
      generatedAt: FIXED_TIME
    });

    assert.equal(backupExport.contractName, APP_CORE_BACKUP_EXPORT_CONTRACT_NAME);
    assert.equal(backupExport.readOnly, true);
    assert.equal(backupExport.context.goalId, V39_GOAL_ID);
    assert.equal(backupExport.context.taskId, 'task-3');
    assert.match(backupExport.manifest.manifestHash, /^sha256:[0-9a-f]{64}$/u);
    assert.ok(backupExport.manifest.managedStateEntries.some((entry) => entry.ref === `goals/events/${V39_GOAL_ID}.ndjson` && entry.content_hash?.startsWith('sha256:')));
    assert.ok(backupExport.manifest.managedStateEntries.some((entry) => entry.ref === 'runs/latest.json' && entry.copyPolicy === 'hash-only-managed-state'));
    assert.ok(backupExport.manifest.artifactRefs.some((entry) => entry.artifact_ref === 'task-3/worker-evidence' && entry.copyPolicy === 'ref-and-hash-only'));
    assert.ok(backupExport.manifest.excludedRepoContent.some((entry) => entry.ref === 'src/'));
    assert.equal(backupExport.boundaries.copiesRepoContent, false);
    assert.equal(backupExport.boundaries.includesGitObjectDatabase, false);

    assertAppCoreBackupExportContract(backupExport);
  });

  it('serves the Workbench backup export route and rejects unsupported or unsafe params', async () => {
    const server = createSymphonyConsoleServer({ stateDir });
    const baseUrl = await listenOnRandomPort(server);

    try {
      const validResponse = await fetch(`${baseUrl}/api/backup/export?goal=${V39_GOAL_ID}&task=task-3`);
      const invalidResponse = await fetch(`${baseUrl}/api/backup/export?path=src/index.js`);
      const unsafeGoalResponse = await fetch(`${baseUrl}/api/backup/export?goal=..%2F..%2Fpackage.json`);
      const postResponse = await fetch(`${baseUrl}/api/backup/export`, { method: 'POST' });

      assert.equal(validResponse.status, 200);
      assert.equal(invalidResponse.status, 400);
      assert.equal(unsafeGoalResponse.status, 400);
      assert.equal(postResponse.status, 405);

      const body = await validResponse.json();
      assert.equal(body.contractName, APP_CORE_BACKUP_EXPORT_CONTRACT_NAME);
      assert.equal(body.boundaries.copiesRepoContent, false);
      assert.equal(body.boundaries.writesBundleFile, false);
      assert.equal((await invalidResponse.json()).error.code, 'invalid-backup-export-request');
      assert.equal((await unsafeGoalResponse.json()).error.code, 'invalid-backup-export-request');
    } finally {
      await closeServer(server);
    }
  });

  it('prints the backup export contract from the CLI without output-file writes', async () => {
    const stdout = createBufferedStream();

    const exitCode = await runSymphonyCli({
      argv: ['backup', 'export', '--state-dir', stateDir, '--goal', V39_GOAL_ID, '--task', 'task-3', '--json'],
      stdout: stdout.stream,
      stderr: createBufferedStream().stream
    });

    assert.equal(exitCode, 0);

    const output = JSON.parse(stdout.text());
    assert.equal(output.contractName, APP_CORE_BACKUP_EXPORT_CONTRACT_NAME);
    assert.equal(output.boundaries.copiesRepoContent, false);
    assert.equal(output.boundaries.writesBundleFile, false);
  });
});

function stampEventHash(event) {
  const eventToHash = {
    ...event,
    sequence: 1,
    previousEventHash: null
  };

  return {
    ...eventToHash,
    eventHash: computeGoalEventHash(eventToHash)
  };
}

function createBufferedStream() {
  let buffer = '';

  return {
    stream: {
      write(chunk) {
        buffer += chunk;
      }
    },
    text() {
      return buffer;
    }
  };
}

async function listenOnRandomPort(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
