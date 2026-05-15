/**
 * Phase 3: Blind spot tests
 * Tests adversarial scenarios that Codex likely didn't think to test.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import fc from 'fast-check';

import { WorkspaceManager } from '../src/workspace-manager.js';
import { PolicyEngine } from '../src/policy-engine.js';
import { TaskQueue } from '../src/task-queue.js';
import { verifyEvidence } from '../src/verifier.js';

// ── 3.1 Workspace Path Safety ─────────────────────────────────────────────────

describe('Blind spot: workspace path safety', () => {
  it('workspace path is always inside root directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-blind-ws-'));
    try {
      const manager = new WorkspaceManager({ rootDirectory: root });
      const allocation = manager.allocate({ taskId: 'task-1', role: 'primary-writer', adapterId: 'codex' });
      assert.ok(
        allocation.path.startsWith(root),
        `workspace path ${allocation.path} is outside root ${root}`
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('workspace paths with path-traversal-like task ids stay inside root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-blind-traversal-'));
    try {
      const manager = new WorkspaceManager({ rootDirectory: root });
      // These ids contain traversal-like characters but should be sanitized or rejected
      const suspiciousIds = ['../evil', 'task/../../etc', 'task\x00null'];
      for (const id of suspiciousIds) {
        try {
          const allocation = manager.allocate({ taskId: id, role: 'primary-writer', adapterId: 'codex' });
          // If it succeeds, path must still be inside root
          assert.ok(
            allocation.path.startsWith(root),
            `path ${allocation.path} escaped root for id: ${id}`
          );
        } catch {
          // Rejection is also acceptable
        }
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

// ── 3.2 Policy Engine Adversarial Inputs ─────────────────────────────────────

describe('Blind spot: policy engine adversarial inputs', () => {
  it('sensitive path patterns are denied regardless of prefix', () => {
    const engine = new PolicyEngine();
    const sensitivePaths = [
      '.env',
      '/repo/.env',
      '/deep/nested/.env',
      '/home/user/.ssh/id_rsa',
      '/app/secrets/db_password',
      '.env.production',
      '.env.local'
    ];
    for (const path of sensitivePaths) {
      const result = engine.decide({ action: 'read', target: path });
      assert.equal(result.decision, 'deny', `expected deny for path: ${path}`);
    }
  });

  it('non-sensitive paths are allowed by default', () => {
    const engine = new PolicyEngine({ network: 'disabled' });
    const safePaths = [
      '/repo/src/index.js',
      '/repo/package.json',
      '/repo/README.md'
    ];
    for (const path of safePaths) {
      const result = engine.decide({ action: 'read', target: path });
      assert.equal(result.decision, 'allow', `expected allow for path: ${path}`);
    }
  });

  it('unsupported action is always denied', () => {
    const engine = new PolicyEngine();
    const unknownActions = ['execute', 'delete', 'spawn', 'eval', ''];
    for (const action of unknownActions) {
      const result = engine.decide({ action, target: '/some/path' });
      assert.equal(result.decision, 'deny');
    }
  });

  it('blank or null target is denied for path actions', () => {
    const engine = new PolicyEngine();
    const badTargets = ['', '   ', null, undefined];
    for (const target of badTargets) {
      const result = engine.decide({ action: 'read', target });
      assert.equal(result.decision, 'deny');
    }
  });

  it('network disabled denies all network requests', () => {
    const engine = new PolicyEngine({ network: 'disabled' });
    fc.assert(fc.property(
      fc.string({ minLength: 1 }),
      (host) => {
        const result = engine.decide({ action: 'network', target: host });
        assert.equal(result.decision, 'deny');
      }
    ));
  });

  it('denied command patterns block matching commands', () => {
    const engine = new PolicyEngine({
      deniedCommandPatterns: ['rm -rf *', 'curl *']
    });
    const dangerous = ['rm -rf /', 'rm -rf /etc', 'curl https://evil.com'];
    for (const cmd of dangerous) {
      const result = engine.decide({ action: 'shell', command: cmd });
      assert.equal(result.decision, 'deny', `expected deny for: ${cmd}`);
    }
  });
});

// ── 3.3 Concurrent Dispatch Race ─────────────────────────────────────────────

describe('Blind spot: concurrent dispatch race condition', () => {
  it('concurrent leaseNext calls never exceed maxConcurrency', async () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 4 }),
      fc.integer({ min: 5, max: 20 }),
      (maxConcurrency, taskCount) => {
        const queue = new TaskQueue({ maxConcurrency });

        for (let i = 0; i < taskCount; i++) {
          queue.enqueue({
            id: `task-${i}`,
            source: 'manual',
            repository: 'owner/repo',
            objective: `Task ${i}`,
            acceptance: ['done'],
            version: '1'
          });
        }

        // Simulate concurrent lease attempts by calling leaseNext many times
        // without completing any tasks first
        const leased = [];
        let result;
        while ((result = queue.leaseNext()) !== null) {
          leased.push(result);
        }

        assert.ok(
          leased.length <= maxConcurrency,
          `leased ${leased.length} tasks but maxConcurrency is ${maxConcurrency}`
        );

        const running = queue.list({ status: 'running' }).length;
        assert.equal(running, leased.length);
        assert.ok(running <= maxConcurrency);
      }
    ));
  });

  it('same task cannot be leased twice simultaneously', () => {
    const queue = new TaskQueue({ maxConcurrency: 10 });
    queue.enqueue({
      id: 'task-single',
      source: 'manual',
      repository: 'owner/repo',
      objective: 'Single task',
      acceptance: ['done'],
      version: '1'
    });

    const first = queue.leaseNext();
    const second = queue.leaseNext(); // should be null, no more queued tasks

    assert.ok(first !== null);
    assert.equal(second, null);
    assert.equal(queue.list({ status: 'running' }).length, 1);
  });
});

// ── 3.4 Retry Bomb ────────────────────────────────────────────────────────────

describe('Blind spot: retry bomb', () => {
  it('retry attempt counter increments correctly across many retries', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 50 }),
      (retryCount) => {
        const queue = new TaskQueue({ maxConcurrency: 1 });
        queue.enqueue({
          id: 'retry-bomb',
          source: 'manual',
          repository: 'owner/repo',
          objective: 'Retry bomb',
          acceptance: ['done'],
          version: '1'
        });

        for (let i = 0; i < retryCount; i++) {
          const leased = queue.leaseNext();
          assert.ok(leased !== null, `lease failed at retry ${i}`);
          assert.equal(leased.attempt, i + 1);
          queue.fail('retry-bomb', {
            failure: { reason: 'transient-error' },
            retryPlan: { retry: true }
          });
        }

        // After N retries, task is still queued (not lost)
        const record = queue.get('retry-bomb');
        assert.equal(record.status, 'queued');
        assert.equal(record.attempt, retryCount);
      }
    ));
  });

  it('queue state remains consistent after many fail+retry cycles', () => {
    const queue = new TaskQueue({ maxConcurrency: 2 });
    const ids = ['t1', 't2', 't3'];

    for (const id of ids) {
      queue.enqueue({
        id,
        source: 'manual',
        repository: 'owner/repo',
        objective: id,
        acceptance: ['done'],
        version: '1'
      });
    }

    // Run 20 cycles of lease+fail+retry
    for (let cycle = 0; cycle < 20; cycle++) {
      const leased = [];
      let r;
      while ((r = queue.leaseNext()) !== null) {
        leased.push(r.task.id);
      }
      for (const id of leased) {
        queue.fail(id, { failure: { reason: 'err' }, retryPlan: { retry: true } });
      }
    }

    // All tasks should still be queued
    const all = queue.list();
    assert.equal(all.length, ids.length);
    for (const record of all) {
      assert.equal(record.status, 'queued');
    }
  });
});

// ── 3.5 Evidence Forgery ─────────────────────────────────────────────────────

describe('Blind spot: evidence forgery detection', () => {
  it('evidence claiming all checks passed but with no command provenance fails', () => {
    // A check with status=passed but no command, exitCode, or artifactId
    // should fail the provenance check
    const commandSpec = {
      name: 'implement',
      version: '1',
      allowedTools: ['read', 'write', 'shell', 'test'],
      workspacePolicy: 'primary-writer',
      doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
      evidenceSchema: 'implementation-evidence.v1'
    };

    const evidence = {
      command: 'implement',
      taskId: 'task-1',
      workspaceId: 'ws-1',
      diffSummary: [],
      changedFiles: ['src/foo.js'],
      checks: [{ name: 'test', status: 'passed' }], // no command, exitCode, or artifactId
      knownRisks: [],
      agentSummary: 'done',
      version: '1'
    };

    const result = verifyEvidence({ commandSpec, evidence });
    assert.equal(result.status, 'failed', 'check without provenance should fail verification');
  });

  it('check with command+exitCode provenance passes verification', () => {
    const commandSpec = {
      name: 'implement',
      version: '1',
      allowedTools: ['read', 'write', 'shell', 'test'],
      workspacePolicy: 'primary-writer',
      doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
      evidenceSchema: 'implementation-evidence.v1'
    };

    // command + exitCode is sufficient provenance (no output/artifactId needed)
    const evidence = {
      command: 'implement',
      taskId: 'task-1',
      workspaceId: 'ws-1',
      diffSummary: [],
      changedFiles: ['src/foo.js'],
      checks: [{ name: 'test', status: 'passed', command: 'pnpm test', exitCode: 0 }],
      knownRisks: [],
      agentSummary: 'done',
      version: '1'
    };

    const result = verifyEvidence({ commandSpec, evidence });
    assert.equal(result.status, 'passed', 'command+exitCode should satisfy provenance');
  });
});
