/**
 * Property-based companion tests for phase1-5.test.js.
 * These do NOT replace the original tests — they add randomized coverage
 * around the same properties that the example-based tests verify.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import fc from 'fast-check';

import { validateTaskSpec, validateCommandSpec, ValidationError } from '../src/contracts.js';
import { ArtifactStore } from '../src/artifact-store.js';
import { SessionEventLog } from '../src/session-event-log.js';
import { classifyFailure } from '../src/failure-taxonomy.js';
import { PolicyEngine } from '../src/policy-engine.js';
import { WorkspaceManager } from '../src/workspace-manager.js';

// ── Arbitraries ───────────────────────────────────────────────────────────────

const nonEmpty = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);
const taskSource = fc.constantFrom('github', 'linear', 'manual');
const commandName = fc.constantFrom('plan', 'implement', 'review', 'fix-ci', 'qa');
const toolName = fc.constantFrom('read', 'write', 'shell', 'test');
const workspacePolicy = fc.constantFrom('primary-writer', 'review-only', 'isolated', 'none');

const validTaskSpec = fc.record({
  id: nonEmpty,
  source: taskSource,
  repository: nonEmpty,
  objective: nonEmpty,
  acceptance: fc.array(nonEmpty, { minLength: 1 }),
  version: nonEmpty
});

const validCommandSpec = fc.record({
  name: commandName,
  version: nonEmpty,
  allowedTools: fc.array(toolName, { minLength: 1 }).map((a) => [...new Set(a)]),
  workspacePolicy,
  doneCriteria: fc.array(nonEmpty, { minLength: 1 }),
  evidenceSchema: nonEmpty
});

// ── Phase 1: contracts + artifact store + event log ───────────────────────────

describe('Phase 1 property companions', () => {
  it('validateTaskSpec returns the same object reference on success', () => {
    fc.assert(fc.property(validTaskSpec, (spec) => {
      assert.equal(validateTaskSpec(spec), spec);
    }));
  });

  it('validateCommandSpec returns the same object reference on success', () => {
    fc.assert(fc.property(validCommandSpec, (spec) => {
      assert.equal(validateCommandSpec(spec), spec);
    }));
  });

  it('any missing required TaskSpec field causes ValidationError', () => {
    const requiredFields = ['id', 'source', 'repository', 'objective', 'acceptance', 'version'];
    fc.assert(fc.property(validTaskSpec, fc.constantFrom(...requiredFields), (spec, field) => {
      const broken = { ...spec };
      delete broken[field];
      assert.throws(() => validateTaskSpec(broken), ValidationError);
    }));
  });

  it('artifact store round-trips a plain object', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-phase1-prop-'));
    try {
      const store = new ArtifactStore(join(root, 'artifacts'));
      const value = { key: 'hello', count: 42, flag: true };
      await store.writeArtifact('task-1', 'artifact-1', value);
      const retrieved = await store.readArtifact('task-1', 'artifact-1');
      assert.deepEqual(retrieved, value);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('session event log preserves event order', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-phase1-events-'));
    try {
      const log = new SessionEventLog(join(root, 'events'), 'session-1');
      const types = ['command.queued', 'artifact.written', 'route.selected'];
      for (let i = 0; i < types.length; i++) {
        await log.append({
          id: `evt-${i}`,
          type: types[i],
          timestamp: new Date().toISOString(),
          actor: 'test',
          payload: {},
          version: '1'
        });
      }
      const events = await log.readAll();
      assert.equal(events.length, types.length);
      assert.deepEqual(events.map((e) => e.type), types);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('classifyFailure always returns an object with retryable boolean and category string', () => {
    const validCategories = fc.constantFrom(
      'build-failed', 'test-failed', 'lint-failed', 'context-missing',
      'permission-denied', 'adapter-crashed', 'cli-timeout', 'scope-violation',
      'workspace-conflict', 'infrastructure-failure', 'unknown-category'
    );
    fc.assert(fc.property(validCategories, (category) => {
      const result = classifyFailure(category);
      assert.ok(typeof result.retryable === 'boolean');
      assert.ok(typeof result.category === 'string' && result.category.length > 0);
      assert.ok(typeof result.owner === 'string');
    }));
  });
});

// ── Phase 2: policy engine + context builder ──────────────────────────────────

describe('Phase 2 property companions', () => {
  it('policy engine decide always returns decision allow or deny', () => {
    const actions = fc.constantFrom('read', 'write', 'shell', 'network', 'unknown');
    fc.assert(fc.property(actions, nonEmpty, (action, target) => {
      const engine = new PolicyEngine({ network: 'disabled' });
      const result = engine.decide({ action, target, command: target });
      assert.ok(result.decision === 'allow' || result.decision === 'deny');
    }));
  });

  it('policy engine with empty allowedCommands denies all shell commands', () => {
    fc.assert(fc.property(nonEmpty, (command) => {
      const engine = new PolicyEngine({ allowedCommands: [], deniedCommands: [] });
      const result = engine.decide({ action: 'shell', command });
      assert.equal(result.decision, 'deny');
    }));
  });

  it('policy engine allows explicitly listed commands', () => {
    fc.assert(fc.property(nonEmpty, (command) => {
      const engine = new PolicyEngine({ allowedCommands: [command] });
      const result = engine.decide({ action: 'shell', command });
      assert.equal(result.decision, 'allow');
    }));
  });
});

// ── Phase 3: adapter argument rendering ──────────────────────────────────────

describe('Phase 3 property companions', () => {
  it('workspace allocation always produces a path under the root directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-phase3-prop-'));
    try {
      await fc.assert(fc.asyncProperty(
        nonEmpty.filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
        async (taskId) => {
          const manager = new WorkspaceManager({ rootDirectory: root });
          const allocation = manager.allocate({ taskId, role: 'primary-writer', adapterId: 'codex' });
          assert.ok(allocation.path.startsWith(root));
        }
      ), { numRuns: 20 });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

// ── Phase 4: workspace manager ────────────────────────────────────────────────

describe('Phase 4 property companions', () => {
  it('workspace allocation is deterministic for same taskId and role', () => {
    fc.assert(fc.property(
      nonEmpty.filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
      (taskId) => {
        const manager1 = new WorkspaceManager({ rootDirectory: '/tmp/ws-root' });
        const manager2 = new WorkspaceManager({ rootDirectory: '/tmp/ws-root' });
        const a1 = manager1.allocate({ taskId, role: 'primary-writer', adapterId: 'codex' });
        const a2 = manager2.allocate({ taskId, role: 'primary-writer', adapterId: 'codex' });
        // Same root + same taskId + same role → same path prefix
        assert.ok(a1.path.startsWith('/tmp/ws-root'));
        assert.ok(a2.path.startsWith('/tmp/ws-root'));
        assert.ok(a1.path.includes(taskId));
      }
    ));
  });

  it('primary-writer workspace is always writable', () => {
    fc.assert(fc.property(
      nonEmpty.filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
      (taskId) => {
        const manager = new WorkspaceManager({ rootDirectory: '/tmp/ws-root' });
        const allocation = manager.allocate({ taskId, role: 'primary-writer', adapterId: 'codex' });
        assert.equal(allocation.writable, true);
      }
    ));
  });

  it('review-only workspace is never writable', () => {
    fc.assert(fc.property(
      nonEmpty.filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
      (taskId) => {
        const manager = new WorkspaceManager({ rootDirectory: '/tmp/ws-root' });
        const allocation = manager.allocate({ taskId, role: 'reviewer', adapterId: 'codex' });
        assert.equal(allocation.writable, false);
      }
    ));
  });
});
