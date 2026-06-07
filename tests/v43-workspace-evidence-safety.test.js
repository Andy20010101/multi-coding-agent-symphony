import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildSupervisorRunnerPlan } from '../src/symphony/supervisor-runner.js';
import {
  buildRootCheckoutMutationGuard,
  classifyGateFailure,
  collectFileInventoryFromGitStatus,
  inspectDependencyReadiness,
  prepareWorkspaceForDispatch,
  recordDirtyBaselineInheritance,
  validateEvidenceLocation
} from '../src/symphony/workspace-evidence-safety.js';

const FIXTURE_GOAL_ID = 'v19-fixture';
const GENERATED_AT = '2026-06-07T10:00:00.000Z';

describe('v43 workspace and evidence safety', () => {
  it('blocks assigned package worktrees that are missing dependency links before dispatch', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v43-missing-deps-'));

    try {
      await writeFile(join(root, 'package.json'), '{"type":"module"}\n');
      const readiness = await inspectDependencyReadiness({
        worktree: root
      });
      const plan = await buildSupervisorRunnerPlan({
        stateDir: join(root, '.symphony'),
        goalId: FIXTURE_GOAL_ID,
        assignedWorktree: root,
        generatedAt: GENERATED_AT
      });

      assert.equal(readiness.status, 'missing-node-modules');
      assert.equal(readiness.dispatchAllowed, false);
      assert.equal(readiness.setup.command, 'pnpm install --offline --frozen-lockfile');
      assert.equal(plan.status, 'blocked');
      assert.equal(plan.stopReason, 'workspace-dependency-preflight-blocked');
      assert.equal(plan.cycles[0].workspaceSafety.dependencyPreflight.status, 'missing-node-modules');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('records deterministic dependency setup failures as blockers instead of allowing dispatch', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v43-setup-failed-'));

    try {
      await writeFile(join(root, 'package.json'), '{"type":"module"}\n');
      const setupRequired = await prepareWorkspaceForDispatch({
        worktree: root
      });
      const prepared = await prepareWorkspaceForDispatch({
        worktree: root,
        runSetup: ({ command, cwd }) => ({
          command,
          cwd,
          exitCode: 1,
          stderr: 'ERR_PNPM_OFFLINE_META_FAIL'
        })
      });

      assert.equal(setupRequired.status, 'blocked');
      assert.equal(setupRequired.blocker.id, 'workspace-dependency-setup-required');
      assert.equal(prepared.status, 'blocked');
      assert.equal(prepared.dispatchAllowed, false);
      assert.equal(prepared.blocker.id, 'workspace-dependency-setup-failed');
      assert.equal(prepared.blocker.command, 'pnpm install --offline --frozen-lockfile');
      assert.equal(prepared.setupAttempt.exitCode, 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('records verified dirty-baseline inheritance with source and target details', () => {
    const record = recordDirtyBaselineInheritance({
      sourceTaskId: 'task-1',
      sourceWorktree: '/tmp/source-worktree',
      targetWorktree: '/tmp/target-worktree',
      branch: 'v43-task-2-workspace-evidence-safety',
      baseCommit: '0d4d452626da7c86483d37dd06fcc428660898ea',
      copied: [
        'docs/plans/v43-task-1-review-evidence-2026-06-07.md'
      ],
      deleted: [
        'docs/plans/stale-evidence.md'
      ],
      dependencySetup: {
        status: 'already-ready'
      }
    });

    assert.equal(record.verified, true);
    assert.equal(record.sourceTaskId, 'task-1');
    assert.equal(record.sourceWorktree, resolve('/tmp/source-worktree'));
    assert.equal(record.targetWorktree, resolve('/tmp/target-worktree'));
    assert.deepEqual(record.copied, [
      'docs/plans/v43-task-1-review-evidence-2026-06-07.md'
    ]);
    assert.deepEqual(record.deleted, [
      'docs/plans/stale-evidence.md'
    ]);
  });

  it('builds a complete tracked, staged, deleted, and untracked inventory from git status porcelain', () => {
    const inventory = collectFileInventoryFromGitStatus({
      worktree: '/tmp/worktree',
      porcelain: [
        ' M src/unstaged.js',
        'M  src/staged.js',
        ' D docs/deleted-unstaged.md',
        'D  docs/deleted-staged.md',
        '?? docs/new-evidence.md'
      ].join('\n')
    });

    assert.deepEqual(inventory.trackedModifications, [
      {
        path: 'src/unstaged.js',
        status: 'M'
      },
      {
        path: 'docs/deleted-unstaged.md',
        status: 'D'
      }
    ]);
    assert.deepEqual(inventory.stagedChanges, [
      {
        path: 'src/staged.js',
        status: 'M'
      },
      {
        path: 'docs/deleted-staged.md',
        status: 'D'
      }
    ]);
    assert.deepEqual(inventory.deletions, [
      {
        path: 'docs/deleted-unstaged.md',
        staged: false,
        unstaged: true
      },
      {
        path: 'docs/deleted-staged.md',
        staged: true,
        unstaged: false
      }
    ]);
    assert.deepEqual(inventory.untrackedFiles, [
      'docs/new-evidence.md'
    ]);
  });

  it('blocks event registration when the root checkout mutates during a child phase', () => {
    const beforeInventory = collectFileInventoryFromGitStatus({
      worktree: '/tmp/root',
      porcelain: ''
    });
    const afterInventory = collectFileInventoryFromGitStatus({
      worktree: '/tmp/root',
      porcelain: ' M docs/plans/root-evidence.md'
    });
    const guard = buildRootCheckoutMutationGuard({
      rootCheckout: '/tmp/root',
      beforeInventory,
      afterInventory
    });

    assert.equal(guard.mutated, true);
    assert.equal(guard.eventRegistrationAllowed, false);
    assert.equal(guard.blocker.id, 'root-checkout-mutated');
  });

  it('exposes root checkout mutation through the supervisor plan before result registration', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v43-root-guard-'));
    const assigned = await mkdtemp(join(tmpdir(), 'symphony-v43-assigned-guard-'));
    const evidenceRef = 'docs/plans/task-1-worker-evidence.md';

    try {
      await writeFile(join(assigned, 'package.json'), '{"type":"module"}\n');
      await mkdir(join(assigned, 'node_modules/.pnpm'), { recursive: true });
      await mkdir(join(assigned, 'docs/plans'), { recursive: true });
      await writeFile(join(assigned, evidenceRef), '# assigned evidence\n');

      const plan = await buildSupervisorRunnerPlan({
        stateDir: join(root, '.symphony'),
        goalId: FIXTURE_GOAL_ID,
        completedThread: 'thread-worker-result',
        resultTaskId: 'task-1',
        resultRole: 'worker',
        resultEvent: 'worker.evidence-recorded',
        evidenceRef,
        assignedWorktree: assigned,
        rootCheckout: root,
        rootStatusBeforePorcelain: '',
        rootStatusAfterPorcelain: ' M docs/plans/root-evidence.md',
        generatedAt: GENERATED_AT
      });

      assert.equal(plan.status, 'blocked');
      assert.equal(plan.stopReason, 'root-checkout-mutation-rejected');
      assert.equal(plan.cycles[0].workspaceSafety.rootMutationGuard.mutated, true);
      assert.equal(plan.cycles[0].workspaceSafety.rootMutationGuard.eventRegistrationAllowed, false);
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(assigned, { recursive: true, force: true });
    }
  });

  it('rejects evidence that exists only in root checkout or outside the assigned worktree', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v43-root-'));
    const assigned = await mkdtemp(join(tmpdir(), 'symphony-v43-assigned-'));
    const outside = await mkdtemp(join(tmpdir(), 'symphony-v43-outside-'));
    const evidenceRef = 'docs/plans/v43-task-2-worker-evidence-2026-06-07.md';

    try {
      await mkdir(join(root, 'docs/plans'), { recursive: true });
      await writeFile(join(root, evidenceRef), '# root-only evidence\n');
      const rootOnly = await validateEvidenceLocation({
        assignedWorktree: assigned,
        rootCheckout: root,
        evidenceRef
      });
      const outsideLocation = await validateEvidenceLocation({
        assignedWorktree: assigned,
        rootCheckout: root,
        evidenceRef: join(outside, 'evidence.md')
      });

      await mkdir(join(assigned, 'docs/plans'), { recursive: true });
      await writeFile(join(assigned, evidenceRef), '# assigned evidence\n');
      const valid = await validateEvidenceLocation({
        assignedWorktree: assigned,
        rootCheckout: root,
        evidenceRef
      });

      assert.equal(rootOnly.valid, false);
      assert.equal(rootOnly.blocker.id, 'evidence-only-in-root-checkout');
      assert.equal(outsideLocation.valid, false);
      assert.equal(outsideLocation.blocker.id, 'evidence-outside-assigned-worktree');
      assert.equal(valid.valid, true);
      assert.equal(valid.eventRegistrationAllowed, true);
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(assigned, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('blocks completed result consumption when evidence exists only in root checkout', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v43-root-result-'));
    const assigned = await mkdtemp(join(tmpdir(), 'symphony-v43-assigned-result-'));
    const evidenceRef = 'docs/plans/task-1-worker-evidence.md';

    try {
      await writeFile(join(assigned, 'package.json'), '{"type":"module"}\n');
      await mkdir(join(assigned, 'node_modules/.pnpm'), { recursive: true });
      await mkdir(join(root, 'docs/plans'), { recursive: true });
      await writeFile(join(root, evidenceRef), '# root-only evidence\n');

      const plan = await buildSupervisorRunnerPlan({
        stateDir: join(root, '.symphony'),
        goalId: FIXTURE_GOAL_ID,
        completedThread: 'thread-worker-result',
        resultTaskId: 'task-1',
        resultRole: 'worker',
        resultEvent: 'worker.evidence-recorded',
        evidenceRef,
        assignedWorktree: assigned,
        rootCheckout: root,
        generatedAt: GENERATED_AT
      });

      assert.equal(plan.status, 'blocked');
      assert.equal(plan.stopReason, 'completed-result-evidence-location-rejected');
      assert.equal(plan.cycles[0].workspaceSafety.evidenceLocation.blocker.id, 'evidence-only-in-root-checkout');
      assert.match(plan.cycles[0].action.reason, /Evidence location is invalid/u);
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(assigned, { recursive: true, force: true });
    }
  });

  it('classifies gate failures by setup, command typo, implementation, and optional diagnostic causes', () => {
    assert.equal(classifyGateFailure({
      command: 'pnpm test',
      stderr: 'Error [ERR_MODULE_NOT_FOUND]: Cannot find package fast-check'
    }), 'environment-setup-failure');
    assert.equal(classifyGateFailure({
      command: 'pnpm --bad',
      stderr: 'unknown option --bad'
    }), 'shell-command-typo');
    assert.equal(classifyGateFailure({
      command: 'pnpm test',
      exitCode: 1,
      stderr: 'AssertionError'
    }), 'implementation-failure');
    assert.equal(classifyGateFailure({
      command: 'pnpm optional:diagnostic',
      exitCode: 1,
      optional: true
    }), 'optional-diagnostic-failure');
  });
});
