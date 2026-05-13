import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  WorkspaceConflictError,
  WorkspaceManager
} from '../src/workspace-manager.js';
import { RouterScheduler } from '../src/router-scheduler.js';
import { verifyEvidence } from '../src/verifier.js';
import { classifyFailure } from '../src/failure-taxonomy.js';

const implementCommand = {
  name: 'implement',
  version: '1',
  allowedTools: ['read', 'write', 'shell', 'test'],
  workspacePolicy: 'primary-writer',
  doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
  evidenceSchema: 'implementation-evidence.v1'
};

const reviewCommand = {
  name: 'review',
  version: '1',
  allowedTools: ['read', 'shell', 'test'],
  workspacePolicy: 'review-only',
  doneCriteria: ['findings-written', 'evidence-written'],
  evidenceSchema: 'review-evidence.v1'
};

const qaCommand = {
  name: 'qa',
  version: '1',
  allowedTools: ['read', 'shell', 'test'],
  workspacePolicy: 'isolated',
  doneCriteria: ['checks-run', 'evidence-written'],
  evidenceSchema: 'qa-evidence.v1'
};

const capabilityReports = [
  {
    adapterId: 'codex',
    cliName: 'codex',
    cliVersion: '0.130.0',
    supportedCommands: ['plan', 'implement', 'review', 'fix-ci', 'qa'],
    modelProfiles: ['gpt-codex-default'],
    supportsNonInteractive: true,
    supportsResume: true,
    supportsCancel: true,
    supportsHooks: true,
    supportsMcp: true,
    supportsStructuredOutput: true,
    workspaceIsolation: 'external-workspace',
    logStrategy: 'jsonl-stdout',
    version: '1'
  },
  {
    adapterId: 'kiro-cli',
    cliName: 'kiro-cli',
    cliVersion: '2.2.2',
    supportedCommands: ['plan', 'review', 'qa'],
    modelProfiles: ['claude-kiro-default'],
    supportsNonInteractive: true,
    supportsResume: true,
    supportsCancel: true,
    supportsHooks: true,
    supportsMcp: true,
    supportsStructuredOutput: true,
    workspaceIsolation: 'external-workspace',
    logStrategy: 'stdout',
    version: '1'
  }
];

describe('Phase 4 routing, workspace, and verification modules', () => {
  it('enforces one primary writer workspace per task', () => {
    const manager = new WorkspaceManager({ rootDirectory: '/tmp/mcas-workspaces' });

    const first = manager.allocate({
      taskId: 'task-123',
      role: 'primary-writer',
      adapterId: 'codex'
    });

    assert.equal(first.writable, true);
    assert.throws(
      () => manager.allocate({
        taskId: 'task-123',
        role: 'primary-writer',
        adapterId: 'claude-code'
      }),
      WorkspaceConflictError
    );
  });

  it('allows multiple isolated non-writable review workspaces', () => {
    const manager = new WorkspaceManager({ rootDirectory: '/tmp/mcas-workspaces' });

    manager.allocate({
      taskId: 'task-123',
      role: 'primary-writer',
      adapterId: 'codex'
    });
    const firstReview = manager.allocate({
      taskId: 'task-123',
      role: 'review',
      adapterId: 'claude-code'
    });
    const secondReview = manager.allocate({
      taskId: 'task-123',
      role: 'review',
      adapterId: 'kiro-cli'
    });

    assert.notEqual(firstReview.workspaceId, secondReview.workspaceId);
    assert.equal(firstReview.writable, false);
    assert.equal(secondReview.writable, false);
  });

  it('materializes workspace directories with a manifest when enabled', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-workspaces-'));

    try {
      const manager = new WorkspaceManager({
        rootDirectory: root,
        materialize: true
      });
      const allocation = manager.allocate({
        taskId: 'task-123',
        role: 'primary-writer',
        adapterId: 'codex',
        now: '2026-05-13T00:00:00.000Z'
      });

      assert.equal((await stat(allocation.path)).isDirectory(), true);
      assert.equal(allocation.manifestPath, join(allocation.path, 'workspace-manifest.json'));
      assert.equal(allocation.allocatedAt, '2026-05-13T00:00:00.000Z');
      assert.equal(allocation.allocatedEventId, 'workspace-task-123-primary-writer-1-allocated');
      assert.deepEqual(JSON.parse(await readFile(allocation.manifestPath, 'utf8')), {
        version: '1',
        workspaceId: allocation.workspaceId,
        taskId: 'task-123',
        role: 'primary-writer',
        adapterId: 'codex',
        path: allocation.path,
        writable: true,
        allocatedAt: '2026-05-13T00:00:00.000Z',
        allocatedEventId: 'workspace-task-123-primary-writer-1-allocated'
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('cleans temporary workspace content while retaining manifest and cleanup record', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-workspaces-'));

    try {
      const manager = new WorkspaceManager({
        rootDirectory: root,
        materialize: true
      });
      const allocation = manager.allocate({
        taskId: 'task-123',
        role: 'primary-writer',
        adapterId: 'codex',
        now: '2026-05-13T00:00:00.000Z'
      });
      const temporaryFile = join(allocation.path, 'scratch.txt');

      await writeFile(temporaryFile, 'temporary output');

      const cleanup = manager.cleanup({
        workspaceId: allocation.workspaceId,
        cleanedAt: '2026-05-13T00:00:00.000Z'
      });

      assert.deepEqual(cleanup, {
        workspaceId: allocation.workspaceId,
        status: 'cleaned',
        path: allocation.path,
        manifestPath: allocation.manifestPath,
        cleanupRecordPath: join(allocation.path, 'workspace-cleanup.json'),
        retainedFiles: ['workspace-manifest.json', 'workspace-cleanup.json'],
        cleanedAt: '2026-05-13T00:00:00.000Z',
        cleanupEventId: 'workspace-task-123-primary-writer-1-cleaned'
      });
      await assert.rejects(() => stat(temporaryFile), /ENOENT/);
      assert.deepEqual(JSON.parse(await readFile(allocation.manifestPath, 'utf8')), {
        version: '1',
        workspaceId: allocation.workspaceId,
        taskId: 'task-123',
        role: 'primary-writer',
        adapterId: 'codex',
        path: allocation.path,
        writable: true,
        allocatedAt: '2026-05-13T00:00:00.000Z',
        allocatedEventId: 'workspace-task-123-primary-writer-1-allocated'
      });
      assert.deepEqual(JSON.parse(await readFile(cleanup.cleanupRecordPath, 'utf8')), {
        version: '1',
        workspaceId: allocation.workspaceId,
        taskId: 'task-123',
        path: allocation.path,
        cleanedAt: '2026-05-13T00:00:00.000Z',
        cleanupEventId: 'workspace-task-123-primary-writer-1-cleaned',
        retainedFiles: ['workspace-manifest.json', 'workspace-cleanup.json']
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('uses materialized locks to reject duplicate primary writers after restart', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-workspaces-'));

    try {
      const manager = new WorkspaceManager({
        rootDirectory: root,
        materialize: true
      });
      const allocation = manager.allocate({
        taskId: 'task-123',
        role: 'primary-writer',
        adapterId: 'codex',
        now: '2026-05-13T00:00:00.000Z'
      });
      const restartedManager = new WorkspaceManager({
        rootDirectory: root,
        materialize: true
      });

      assert.equal(allocation.lockPath, join(allocation.path, 'workspace-lock.json'));
      assert.deepEqual(JSON.parse(await readFile(allocation.lockPath, 'utf8')), {
        version: '1',
        workspaceId: allocation.workspaceId,
        taskId: 'task-123',
        role: 'primary-writer',
        adapterId: 'codex',
        path: allocation.path,
        writable: true,
        accessMode: 'read-write',
        allocatedAt: '2026-05-13T00:00:00.000Z',
        allocatedEventId: 'workspace-task-123-primary-writer-1-allocated'
      });
      assert.throws(
        () => restartedManager.allocate({
          taskId: 'task-123',
          role: 'primary-writer',
          adapterId: 'claude-code'
        }),
        WorkspaceConflictError
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('clones primary writer content into a non-writable review workspace', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-workspaces-'));

    try {
      const manager = new WorkspaceManager({
        rootDirectory: root,
        materialize: true
      });
      const primary = manager.allocate({
        taskId: 'task-123',
        role: 'primary-writer',
        adapterId: 'codex',
        now: '2026-05-13T00:00:00.000Z'
      });

      await writeFile(join(primary.path, 'implementation.txt'), 'ready for review');

      const review = manager.cloneFrom({
        sourceWorkspaceId: primary.workspaceId,
        role: 'review',
        adapterId: 'claude-code',
        now: '2026-05-13T00:00:01.000Z'
      });

      assert.equal(review.sourceWorkspaceId, primary.workspaceId);
      assert.equal(review.writable, false);
      assert.equal(await readFile(join(review.path, 'implementation.txt'), 'utf8'), 'ready for review');
      assert.deepEqual(JSON.parse(await readFile(review.lockPath, 'utf8')), {
        version: '1',
        workspaceId: review.workspaceId,
        taskId: 'task-123',
        role: 'review',
        adapterId: 'claude-code',
        path: review.path,
        writable: false,
        accessMode: 'read-only',
        allocatedAt: '2026-05-13T00:00:01.000Z',
        allocatedEventId: `workspace-${review.workspaceId}-allocated`,
        sourceWorkspaceId: primary.workspaceId
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('routes commands to capable adapters while honoring exclusions', () => {
    const scheduler = new RouterScheduler({ capabilityReports });

    assert.equal(scheduler.route({
      commandSpec: implementCommand
    }).adapterId, 'codex');

    assert.throws(() => scheduler.route({
      commandSpec: implementCommand,
      excludedAdapters: ['codex']
    }), /No capable adapter/);
  });

  it('plans retries from retryable failure taxonomy metadata', () => {
    const scheduler = new RouterScheduler({ capabilityReports });
    const failure = classifyFailure('adapter-crashed');

    assert.deepEqual(scheduler.planRetry({ failure }), {
      retry: true,
      nextCommand: 'qa',
      owner: 'adapter'
    });
  });

  it('rejects unverified model self-report as insufficient evidence', () => {
    assert.deepEqual(verifyEvidence({
      commandSpec: implementCommand,
      evidence: {
        command: 'implement',
        taskId: 'task-123',
        workspaceId: 'task-123-primary-writer-1',
        diffSummary: [],
        changedFiles: ['src/example.js'],
        checks: [],
        knownRisks: [],
        agentSummary: 'I ran the tests and everything passed.',
        version: '1'
      }
    }), {
      status: 'failed',
      reason: 'checks-missing',
      requiredEvidence: ['checks']
    });
  });

  it('accepts evidence with passing structured checks', () => {
    assert.deepEqual(verifyEvidence({
      commandSpec: implementCommand,
      evidence: {
        command: 'implement',
        taskId: 'task-123',
        workspaceId: 'task-123-primary-writer-1',
        diffSummary: [],
        changedFiles: ['src/example.js'],
        checks: [{ name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'tests passed' }],
        knownRisks: [],
        agentSummary: 'Implemented behavior.',
        version: '1'
      }
    }), {
      status: 'passed',
      reason: 'checks-passed',
      checks: [{ name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'tests passed' }]
    });
  });

  it('rejects production checks without command or artifact provenance', () => {
    assert.deepEqual(verifyEvidence({
      commandSpec: implementCommand,
      evidence: {
        command: 'implement',
        taskId: 'task-123',
        workspaceId: 'task-123-primary-writer-1',
        diffSummary: [],
        changedFiles: ['src/example.js'],
        checks: [{ name: 'pnpm test', status: 'passed', output: 'tests passed' }],
        knownRisks: [],
        agentSummary: 'Implemented behavior.',
        version: '1'
      }
    }), {
      status: 'failed',
      reason: 'artifact-missing',
      requiredEvidence: ['checks[].command+exitCode', 'checks[].artifactId'],
      checks: [{ name: 'pnpm test', status: 'passed', output: 'tests passed' }]
    });
  });

  it('rejects changed files for read-only command policies', () => {
    assert.deepEqual(verifyEvidence({
      commandSpec: reviewCommand,
      evidence: {
        command: 'review',
        taskId: 'task-123',
        workspaceId: 'task-123-review-1',
        diffSummary: [],
        changedFiles: ['src/example.js'],
        checks: [{ name: 'review', status: 'passed', artifactId: 'review-findings' }],
        knownRisks: [],
        agentSummary: 'Reviewed behavior.',
        noFindingRationale: 'No regressions found.',
        version: '1'
      }
    }), {
      status: 'failed',
      reason: 'scope-violation',
      changedFiles: ['src/example.js'],
      workspacePolicy: 'review-only'
    });
  });

  it('returns exact failed check list', () => {
    const failedCheck = {
      name: 'pnpm test',
      status: 'failed',
      command: 'pnpm test',
      exitCode: 1,
      output: '1 failing test'
    };

    assert.deepEqual(verifyEvidence({
      commandSpec: implementCommand,
      evidence: {
        command: 'implement',
        taskId: 'task-123',
        workspaceId: 'task-123-primary-writer-1',
        diffSummary: [],
        changedFiles: ['src/example.js'],
        checks: [
          { name: 'lint', status: 'passed', command: 'pnpm check', exitCode: 0, output: 'ok' },
          failedCheck
        ],
        knownRisks: [],
        agentSummary: 'One check failed.',
        version: '1'
      }
    }), {
      status: 'failed',
      reason: 'check-failed',
      failedChecks: [failedCheck]
    });
  });

  it('requires implementation evidence to include changed files or no-op rationale', () => {
    assert.deepEqual(verifyEvidence({
      commandSpec: implementCommand,
      evidence: {
        command: 'implement',
        taskId: 'task-123',
        workspaceId: 'task-123-primary-writer-1',
        diffSummary: [],
        changedFiles: [],
        checks: [{ name: 'pnpm test', status: 'passed', artifactId: 'test-log' }],
        knownRisks: [],
        agentSummary: 'No implementation was needed.',
        version: '1'
      }
    }), {
      status: 'failed',
      reason: 'verification-insufficient',
      requiredEvidence: ['changedFiles', 'noOpRationale']
    });
  });

  it('accepts explicit implementation no-op rationale', () => {
    assert.deepEqual(verifyEvidence({
      commandSpec: implementCommand,
      evidence: {
        command: 'implement',
        taskId: 'task-123',
        workspaceId: 'task-123-primary-writer-1',
        diffSummary: [],
        changedFiles: [],
        checks: [{ name: 'pnpm test', status: 'passed', artifactId: 'test-log' }],
        knownRisks: [],
        agentSummary: 'No implementation was needed.',
        noOpRationale: 'Task was already satisfied by existing behavior.',
        version: '1'
      }
    }), {
      status: 'passed',
      reason: 'checks-passed',
      checks: [{ name: 'pnpm test', status: 'passed', artifactId: 'test-log' }]
    });
  });

  it('requires review evidence to include findings or no-finding rationale', () => {
    assert.deepEqual(verifyEvidence({
      commandSpec: reviewCommand,
      evidence: {
        command: 'review',
        taskId: 'task-123',
        workspaceId: 'task-123-review-1',
        diffSummary: [],
        changedFiles: [],
        checks: [{ name: 'review', status: 'passed', artifactId: 'review-findings' }],
        knownRisks: [],
        agentSummary: 'Reviewed behavior.',
        version: '1'
      }
    }), {
      status: 'failed',
      reason: 'verification-insufficient',
      requiredEvidence: ['findings', 'noFindingRationale']
    });
  });

  it('accepts review findings as structured evidence', () => {
    assert.deepEqual(verifyEvidence({
      commandSpec: reviewCommand,
      evidence: {
        command: 'review',
        taskId: 'task-123',
        workspaceId: 'task-123-review-1',
        diffSummary: [],
        changedFiles: [],
        checks: [{ name: 'review', status: 'passed', artifactId: 'review-findings' }],
        knownRisks: [],
        findings: ['No blocking findings.'],
        agentSummary: 'Reviewed behavior.',
        version: '1'
      }
    }), {
      status: 'passed',
      reason: 'checks-passed',
      checks: [{ name: 'review', status: 'passed', artifactId: 'review-findings' }]
    });
  });

  it('requires QA evidence to include at least one check artifact', () => {
    assert.deepEqual(verifyEvidence({
      commandSpec: qaCommand,
      evidence: {
        command: 'qa',
        taskId: 'task-123',
        workspaceId: 'task-123-qa-1',
        diffSummary: [],
        changedFiles: [],
        checks: [{ name: 'pnpm test', status: 'passed', command: 'pnpm test', exitCode: 0, output: 'tests passed' }],
        knownRisks: [],
        agentSummary: 'Ran QA checks.',
        version: '1'
      }
    }), {
      status: 'failed',
      reason: 'artifact-missing',
      requiredEvidence: ['checks[].artifactId']
    });
  });
});
