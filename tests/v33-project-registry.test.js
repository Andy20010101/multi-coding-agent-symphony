import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import { createSymphonyConsoleServer } from '../src/symphony/console.js';
import {
  buildProjectRegistry,
  resolveCurrentProject,
  validateCurrentProjectResolverContract,
  validateProjectRegistryContract
} from '../src/symphony/project-registry.js';

describe('v33 project registry and current project resolver', () => {
  it('validates the project registry fixture and rejects write-boundary drift', async () => {
    const fixture = JSON.parse(await readFile('fixtures/contracts/project-registry.v1.json', 'utf8'));

    assert.deepEqual(validateProjectRegistryContract(fixture), {
      ok: true,
      errors: []
    });

    const drift = structuredClone(fixture);
    drift.boundaries.registryDatabaseWritesAvailable = true;

    assert.deepEqual(validateProjectRegistryContract(drift), {
      ok: false,
      errors: ['boundaries.registryDatabaseWritesAvailable must be false']
    });
  });

  it('builds a read-only project registry from repo-local metadata and managed Symphony state', async () => {
    const root = await createProjectFixture('symphony-registry-build');

    try {
      const registry = await buildProjectRegistry({
        cwd: join(root, 'nested'),
        generatedAt: '2026-06-02T00:00:00.000Z'
      });

      assert.deepEqual(validateProjectRegistryContract(registry), {
        ok: true,
        errors: []
      });
      assert.equal(registry.readOnly, true);
      assert.equal(registry.projects.length, 1);
      assert.equal(registry.currentProjectId, registry.projects[0].project_id);
      assert.equal(registry.projects[0].project_name, 'fixture-project');
      assert.equal(registry.projects[0].repo_path, root);
      assert.equal(registry.projects[0].default_branch, 'main');
      assert.equal(registry.projects[0].remote_url, 'git@example.com:fixture/project.git');
      assert.equal(registry.projects[0].last_goal_id, 'v33-app-runtime-foundation');
      assert.equal(registry.projects[0].last_run_id, 'run-v33-project-registry');
      assert.equal(registry.projects[0].health_status, 'ok');
      assert.equal(registry.projects[0].pinned, false);
      assert.equal(registry.boundaries.actionExecutionAvailable, false);
      assert.equal(registry.boundaries.gitWriteAvailable, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('resolves current project from an explicit repo path and reports missing or non-git paths without scanning elsewhere', async () => {
    const root = await createProjectFixture('symphony-registry-current');
    const nonGitRoot = await realpath(await mkdtemp(join(tmpdir(), 'symphony-registry-non-git-')));
    const missingPath = join(nonGitRoot, 'missing');

    try {
      const resolved = await resolveCurrentProject({
        repoPath: join(root, 'nested'),
        generatedAt: '2026-06-02T00:00:00.000Z'
      });

      assert.deepEqual(validateCurrentProjectResolverContract(resolved), {
        ok: true,
        errors: []
      });
      assert.equal(resolved.resolution.status, 'resolved');
      assert.equal(resolved.resolution.strategy, 'explicit-repo-path');
      assert.equal(resolved.currentProject.repo_path, root);

      const nonGit = await resolveCurrentProject({
        repoPath: nonGitRoot,
        generatedAt: '2026-06-02T00:00:00.000Z'
      });

      assert.deepEqual(validateCurrentProjectResolverContract(nonGit), {
        ok: true,
        errors: []
      });
      assert.equal(nonGit.resolution.status, 'unresolved');
      assert.equal(nonGit.currentProject, null);
      assert.equal(nonGit.resolution.blockers[0].id, 'project-repo-unresolved');

      const missing = await resolveCurrentProject({
        repoPath: missingPath,
        generatedAt: '2026-06-02T00:00:00.000Z'
      });

      assert.deepEqual(validateCurrentProjectResolverContract(missing), {
        ok: true,
        errors: []
      });
      assert.equal(missing.resolution.status, 'unresolved');
      assert.equal(missing.currentProject, null);
      assert.equal(missing.resolution.blockers[0].id, 'project-path-missing');
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(nonGitRoot, { recursive: true, force: true });
    }
  });

  it('exposes runtime project CLI commands without writing repository state', async () => {
    const root = await createProjectFixture('symphony-registry-cli');

    try {
      const before = await snapshotDirectoryFiles(root);
      const output = createOutput();
      const originalCwd = process.cwd();

      try {
        process.chdir(root);
        const exitCode = await runSymphonyCli({
          argv: ['runtime', 'projects', '--json'],
          stdout: output.stdout,
          stderr: output.stderr
        });

        assert.equal(exitCode, 0);
      } finally {
        process.chdir(originalCwd);
      }

      assert.equal(output.stderrText(), '');

      const registry = JSON.parse(output.stdoutText());

      assert.deepEqual(validateProjectRegistryContract(registry), {
        ok: true,
        errors: []
      });
      assert.equal(registry.projects[0].repo_path, root);
      assert.deepEqual(await snapshotDirectoryFiles(root), before);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serves read-only project registry API routes and rejects mutation/query probes', async () => {
    const root = await createProjectFixture('symphony-registry-api');
    const nonGitRoot = await realpath(await mkdtemp(join(tmpdir(), 'symphony-registry-api-non-git-')));

    try {
      const server = createSymphonyConsoleServer({
        stateDir: join(root, '.symphony'),
        cwd: root,
        env: { HOME: root }
      });
      const baseUrl = await listenOnRandomPort(server);

      try {
        const before = await snapshotDirectoryFiles(root);
        const registryResponse = await fetch(`${baseUrl}/api/projects`);
        const currentResponse = await fetch(`${baseUrl}/api/projects/current?repoPath=${encodeURIComponent(join(root, 'nested'))}`);
        const nonGitResponse = await fetch(`${baseUrl}/api/projects/current?repoPath=${encodeURIComponent(nonGitRoot)}`);
        const postResponse = await fetch(`${baseUrl}/api/projects`, { method: 'POST' });
        const queryResponse = await fetch(`${baseUrl}/api/projects?path=package.json`);
        const badCurrentResponse = await fetch(`${baseUrl}/api/projects/current?path=package.json`);

        assert.equal(registryResponse.status, 200);
        assert.equal(currentResponse.status, 200);
        assert.equal(nonGitResponse.status, 200);
        assert.equal(postResponse.status, 405);
        assert.equal(queryResponse.status, 400);
        assert.equal(badCurrentResponse.status, 400);

        const registry = await registryResponse.json();
        const current = await currentResponse.json();
        const nonGit = await nonGitResponse.json();

        assert.deepEqual(validateProjectRegistryContract(registry), {
          ok: true,
          errors: []
        });
        assert.deepEqual(validateCurrentProjectResolverContract(current), {
          ok: true,
          errors: []
        });
        assert.equal(current.currentProject.repo_path, root);
        assert.equal(nonGit.resolution.status, 'unresolved');
        assert.equal((await postResponse.json()).contractName, 'error-envelope.v1');
        assert.equal((await queryResponse.json()).error.code, 'invalid-project-registry-request');
        assert.equal((await badCurrentResponse.json()).error.code, 'invalid-current-project-request');
        assert.deepEqual(await snapshotDirectoryFiles(root), before);
      } finally {
        await closeServer(server);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(nonGitRoot, { recursive: true, force: true });
    }
  });
});

async function createProjectFixture(prefix) {
  const root = await realpath(await mkdtemp(join(tmpdir(), `${prefix}-`)));

  await mkdir(join(root, '.git'));
  await writeFile(join(root, '.git', 'HEAD'), 'ref: refs/heads/main\n', 'utf8');
  await writeFile(join(root, '.git', 'config'), [
    '[remote "origin"]',
    '\turl = git@example.com:fixture/project.git',
    ''
  ].join('\n'), 'utf8');
  await mkdir(join(root, 'nested'));
  await writeFile(join(root, 'package.json'), `${JSON.stringify({
    name: 'fixture-project'
  }, null, 2)}\n`, 'utf8');
  await mkdir(join(root, '.symphony', 'goals'), { recursive: true });
  await writeFile(join(root, '.symphony', 'goals', 'latest-active-goal.json'), `${JSON.stringify({
    contractName: 'managed-active-goal-pointer.v1',
    contractVersion: 1,
    goalId: 'v33-app-runtime-foundation',
    storage: 'managed-active-goal-pointer',
    runbookStateRef: '.symphony/goals/runbooks/v33-app-runtime-foundation.json'
  }, null, 2)}\n`, 'utf8');
  await mkdir(join(root, '.symphony', 'runs'), { recursive: true });
  await writeFile(join(root, '.symphony', 'runs', 'latest.json'), `${JSON.stringify({
    runId: 'run-v33-project-registry',
    status: 'passed',
    updatedAt: '2026-06-02T00:00:00.000Z'
  }, null, 2)}\n`, 'utf8');

  return root;
}

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

  async function visit(directory) {
    const entries = await readdirSafe(directory);

    for (const entry of entries) {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(path);
        continue;
      }

      if (entry.isFile()) {
        files.push(path.slice(root.length + 1));
      }
    }
  }

  await visit(root);

  return files.sort();
}

async function readdirSafe(path) {
  try {
    return await readdir(path, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}
