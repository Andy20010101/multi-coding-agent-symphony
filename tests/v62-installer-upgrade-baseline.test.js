import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runSymphonyCli } from '../scripts/symphony.js';
import {
  DEFAULT_INSTALL_REF,
  INSTALL_STATUS_CONTRACT_NAME,
  INSTALL_UPGRADE_PLAN_CONTRACT_NAME,
  buildInstallStatus,
  buildInstallUpgradePlan
} from '../src/symphony/installer-upgrade-baseline.js';

describe('v62 installer and upgrade baseline', () => {
  it('builds read-only install status without changing the conservative default ref', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-v62-status-'));

    try {
      const repo = await createInstallRepo(root);
      const binDir = join(root, 'bin');
      await mkdir(binDir, { recursive: true });
      await writeFile(join(binDir, 'symphony'), '#!/bin/sh\nexit 0\n');

      const status = buildInstallStatus({
        installDir: repo,
        binDir,
        targetRef: 'v61',
        generatedAt: '2026-06-14T18:00:00.000Z'
      });

      assert.equal(status.contractName, INSTALL_STATUS_CONTRACT_NAME);
      assert.equal(status.contractVersion, 1);
      assert.equal(status.state, 'ready');
      assert.equal(status.installDir.exists, true);
      assert.equal(status.installDir.isGitCheckout, true);
      assert.equal(status.installDir.dirty, false);
      assert.equal(status.target.ref, 'v61');
      assert.equal(status.target.availableLocally, true);
      assert.equal(status.doctor.status, 'available-not-run');
      assert.equal(status.doctor.willRun, false);
      assert.equal(status.boundaries.readOnly, true);
      assert.equal(status.boundaries.willMutate, false);
      assert.equal(status.boundaries.networkFetchAvailable, false);
      assert.equal(status.boundaries.checkoutAvailable, false);
      assert.equal(status.boundaries.dependencyInstallAvailable, false);
      assert.equal(DEFAULT_INSTALL_REF, 'v8');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('builds an upgrade dry-run plan that checks prerequisites and contains no mutation steps', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-v62-plan-'));

    try {
      const repo = await createInstallRepo(root);
      const plan = buildInstallUpgradePlan({
        installDir: repo,
        binDir: join(root, 'bin'),
        targetRef: 'v61',
        rollbackRef: 'v60',
        generatedAt: '2026-06-14T18:00:00.000Z'
      });

      assert.equal(plan.contractName, INSTALL_UPGRADE_PLAN_CONTRACT_NAME);
      assert.equal(plan.state, 'ready');
      assert.equal(plan.dryRun, true);
      assert.equal(plan.target.ref, 'v61');
      assert.equal(plan.target.availableLocally, true);
      assert.equal(plan.rollback.ref, 'v60');
      assert.equal(plan.rollback.availableLocally, true);
      assert.equal(plan.checks.dirtyInstallDir.ok, true);
      assert.equal(plan.checks.nodeVersion.ok, true);
      assert.equal(plan.checks.pnpm.available, true);
      assert.deepEqual(plan.plannedMutations, []);
      assert.equal(plan.manualActionRequired, true);
      assert.equal(plan.willMutate, false);
      assert.doesNotMatch(JSON.stringify(plan.plannedMutations), /\bgit\s+(?:fetch|checkout)|pnpm install|overwrite/iu);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('blocks upgrade dry-run when the install checkout is dirty or the target ref is absent', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-v62-blocked-'));

    try {
      const repo = await createInstallRepo(root);
      await writeFile(join(repo, 'dirty.txt'), 'local change\n');

      const plan = buildInstallUpgradePlan({
        installDir: repo,
        binDir: join(root, 'bin'),
        targetRef: 'v62',
        rollbackRef: 'v60',
        generatedAt: '2026-06-14T18:00:00.000Z'
      });

      assert.equal(plan.state, 'blocked');
      assert.ok(plan.blockedReasons.includes('dirty-install-dir'));
      assert.ok(plan.blockedReasons.includes('target-ref-not-available-locally'));
      assert.equal(plan.checks.dirtyInstallDir.dirty, true);
      assert.equal(plan.checks.targetRef.availableLocally, false);
      assert.equal(plan.willMutate, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('exposes install status and upgrade dry-run through the symphony CLI as JSON contracts', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-v62-cli-'));

    try {
      const repo = await createInstallRepo(root);
      const statusOutput = createOutput();
      const statusExit = await runSymphonyCli({
        argv: ['install', 'status', '--install-dir', repo, '--bin-dir', join(root, 'bin'), '--target-ref', 'v61', '--json'],
        stdout: statusOutput.stdout,
        stderr: statusOutput.stderr
      });

      assert.equal(statusExit, 0);
      assert.equal(statusOutput.stderrText(), '');

      const status = JSON.parse(statusOutput.stdoutText());
      assert.equal(status.contractName, INSTALL_STATUS_CONTRACT_NAME);
      assert.equal(status.target.ref, 'v61');
      assert.equal(status.readOnly, true);
      assert.equal(status.willMutate, false);

      const planOutput = createOutput();
      const planExit = await runSymphonyCli({
        argv: [
          'install',
          'upgrade',
          '--install-dir',
          repo,
          '--bin-dir',
          join(root, 'bin'),
          '--target-ref',
          'v61',
          '--rollback-ref',
          'v60',
          '--dry-run',
          '--json'
        ],
        stdout: planOutput.stdout,
        stderr: planOutput.stderr
      });

      assert.equal(planExit, 0);
      assert.equal(planOutput.stderrText(), '');

      const plan = JSON.parse(planOutput.stdoutText());
      assert.equal(plan.contractName, INSTALL_UPGRADE_PLAN_CONTRACT_NAME);
      assert.equal(plan.target.ref, 'v61');
      assert.equal(plan.rollback.ref, 'v60');
      assert.deepEqual(plan.plannedMutations, []);
      assert.equal(plan.boundaries.checkoutAvailable, false);
      assert.equal(plan.boundaries.networkFetchAvailable, false);
      assert.equal(plan.boundaries.dependencyInstallAvailable, false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

async function createInstallRepo(root) {
  const repo = join(root, 'install-repo');
  await mkdir(repo, { recursive: true });
  await writeFile(join(repo, 'README.md'), '# fixture\n');

  runGit(repo, ['init']);
  runGit(repo, ['checkout', '-b', 'main']);
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', 'v60 fixture']);
  runGit(repo, ['tag', '-a', 'v60', '-m', 'v60']);
  await writeFile(join(repo, 'README.md'), '# fixture\n\nv61\n');
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', 'v61 fixture']);
  runGit(repo, ['tag', '-a', 'v61', '-m', 'v61']);

  return repo;
}

function runGit(cwd, args) {
  const result = spawnSync('git', [
    '-c',
    'user.name=Installer Test',
    '-c',
    'user.email=installer-test@example.invalid',
    '-c',
    'commit.gpgsign=false',
    ...args
  ], {
    cwd,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function createOutput() {
  let stdoutText = '';
  let stderrText = '';

  return {
    stdout: {
      write(chunk) {
        stdoutText += chunk;
      }
    },
    stderr: {
      write(chunk) {
        stderrText += chunk;
      }
    },
    stdoutText() {
      return stdoutText;
    },
    stderrText() {
      return stderrText;
    }
  };
}
