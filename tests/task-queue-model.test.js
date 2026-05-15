/**
 * Model-based tests for TaskQueue state machine.
 *
 * Strategy: define a simple reference model of what the queue SHOULD do,
 * then drive both the real TaskQueue and the model with random operation
 * sequences, asserting they stay in sync.
 *
 * This catches bugs that fixed-input tests miss: concurrent dispatch,
 * retry overflow, lease recovery, ordering invariants.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

import { TaskQueue } from '../src/task-queue.js';

// ── Reference Model ───────────────────────────────────────────────────────────

class TaskQueueModel {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency;
    this.tasks = new Map(); // id -> { status, attempt }
    this.sequence = 0;
  }

  canEnqueue(id) {
    return !this.tasks.has(id);
  }

  enqueue(id) {
    this.sequence += 1;
    this.tasks.set(id, { status: 'queued', attempt: 0, sequence: this.sequence });
  }

  canLease() {
    const running = [...this.tasks.values()].filter((t) => t.status === 'running').length;
    const queued = [...this.tasks.values()].filter((t) => t.status === 'queued').length;
    return running < this.maxConcurrency && queued > 0;
  }

  lease() {
    const running = [...this.tasks.values()].filter((t) => t.status === 'running').length;
    if (running >= this.maxConcurrency) return null;

    // pick lowest sequence queued
    let best = null;
    for (const [id, t] of this.tasks) {
      if (t.status !== 'queued') continue;
      if (!best || t.sequence < best.sequence) best = { id, t };
    }
    if (!best) return null;

    best.t.status = 'running';
    best.t.attempt += 1;
    return best.id;
  }

  complete(id) {
    const t = this.tasks.get(id);
    if (!t || t.status !== 'running') throw new Error(`Cannot complete ${id}`);
    t.status = 'completed';
  }

  fail(id, retry) {
    const t = this.tasks.get(id);
    if (!t || t.status !== 'running') throw new Error(`Cannot fail ${id}`);
    t.status = retry ? 'queued' : 'failed';
  }

  cancel(id) {
    const t = this.tasks.get(id);
    if (!t) throw new Error(`Unknown ${id}`);
    if (t.status === 'completed') throw new Error(`Cannot cancel completed ${id}`);
    t.status = 'cancelled';
  }

  runningCount() {
    return [...this.tasks.values()].filter((t) => t.status === 'running').length;
  }

  queuedCount() {
    return [...this.tasks.values()].filter((t) => t.status === 'queued').length;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTask(id) {
  return {
    id,
    source: 'manual',
    repository: 'owner/repo',
    objective: `Task ${id}`,
    acceptance: ['done'],
    version: '1'
  };
}

// ── Commands (fast-check model-based) ─────────────────────────────────────────

function enqueueCmd(id) {
  return {
    check: (model) => model.canEnqueue(id),
    run: (model, real) => {
      model.enqueue(id);
      real.enqueue(makeTask(id));
    },
    toString: () => `enqueue(${id})`
  };
}

function leaseCmd() {
  return {
    check: (model) => model.canLease(),
    run: (model, real) => {
      const modelId = model.lease();
      const record = real.leaseNext();
      assert.ok(record !== null, 'real queue returned null but model expected a lease');
      assert.equal(record.task.id, modelId, 'leased task id mismatch');
      assert.equal(record.status, 'running');
    },
    toString: () => 'leaseNext()'
  };
}

function completeCmd(id) {
  return {
    check: (model) => {
      const t = model.tasks.get(id);
      return t?.status === 'running';
    },
    run: (model, real) => {
      model.complete(id);
      real.complete(id);
    },
    toString: () => `complete(${id})`
  };
}

function failRetryCmd(id) {
  return {
    check: (model) => {
      const t = model.tasks.get(id);
      return t?.status === 'running';
    },
    run: (model, real) => {
      model.fail(id, true);
      real.fail(id, { failure: { reason: 'test-failure' }, retryPlan: { retry: true } });
    },
    toString: () => `fail+retry(${id})`
  };
}

function failNoRetryCmd(id) {
  return {
    check: (model) => {
      const t = model.tasks.get(id);
      return t?.status === 'running';
    },
    run: (model, real) => {
      model.fail(id, false);
      real.fail(id, { failure: { reason: 'test-failure' }, retryPlan: { retry: false } });
    },
    toString: () => `fail(${id})`
  };
}

function cancelCmd(id) {
  return {
    check: (model) => {
      const t = model.tasks.get(id);
      return t !== undefined && t.status !== 'completed';
    },
    run: (model, real) => {
      model.cancel(id);
      real.cancel(id, 'test-cancel');
    },
    toString: () => `cancel(${id})`
  };
}

// ── Invariant check ───────────────────────────────────────────────────────────

function checkInvariants(model, real) {
  // running count never exceeds maxConcurrency
  assert.ok(
    model.runningCount() <= model.maxConcurrency,
    `model running count ${model.runningCount()} exceeds maxConcurrency ${model.maxConcurrency}`
  );

  const realRunning = real.list({ status: 'running' }).length;
  assert.equal(realRunning, model.runningCount(), 'running count mismatch');

  const realQueued = real.list({ status: 'queued' }).length;
  assert.equal(realQueued, model.queuedCount(), 'queued count mismatch');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TaskQueue model-based state machine tests', () => {
  it('state machine invariants hold across random operation sequences', () => {
    const ids = ['t1', 't2', 't3', 't4', 't5'];
    const maxConcurrency = 2;

    const allCmds = [
      ...ids.map((id) => fc.constant(enqueueCmd(id))),
      fc.constant(leaseCmd()),
      ...ids.map((id) => fc.constant(completeCmd(id))),
      ...ids.map((id) => fc.constant(failRetryCmd(id))),
      ...ids.map((id) => fc.constant(failNoRetryCmd(id))),
      ...ids.map((id) => fc.constant(cancelCmd(id)))
    ];

    fc.assert(
      fc.property(
        fc.commands(allCmds, { maxCommands: 40 }),
        (cmds) => {
          const model = new TaskQueueModel(maxConcurrency);
          const real = new TaskQueue({ maxConcurrency });

          fc.modelRun(() => ({ model, real }), cmds);
          checkInvariants(model, real);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('concurrency limit is never exceeded under concurrent enqueue+lease', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 10 }),
        (maxConcurrency, taskCount) => {
          const queue = new TaskQueue({ maxConcurrency });

          for (let i = 0; i < taskCount; i++) {
            queue.enqueue(makeTask(`task-${i}`));
          }

          let leased = 0;
          while (queue.leaseNext() !== null) {
            leased++;
          }

          const running = queue.list({ status: 'running' }).length;
          assert.ok(running <= maxConcurrency, `running ${running} > maxConcurrency ${maxConcurrency}`);
          assert.equal(leased, Math.min(taskCount, maxConcurrency));
        }
      )
    );
  });

  it('fail with retry puts task back to queued and increments attempt', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (retries) => {
        const queue = new TaskQueue({ maxConcurrency: 1 });
        queue.enqueue(makeTask('task-retry'));

        for (let i = 0; i < retries; i++) {
          const leased = queue.leaseNext();
          assert.ok(leased !== null);
          assert.equal(leased.attempt, i + 1);
          queue.fail('task-retry', { failure: { reason: 'err' }, retryPlan: { retry: true } });
          assert.equal(queue.get('task-retry').status, 'queued');
        }

        // final lease
        const final = queue.leaseNext();
        assert.equal(final.attempt, retries + 1);
      })
    );
  });

  it('completed tasks cannot be cancelled', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0), (id) => {
        const queue = new TaskQueue({ maxConcurrency: 1 });
        queue.enqueue(makeTask(id));
        queue.leaseNext();
        queue.complete(id);
        assert.throws(() => queue.cancel(id, 'too late'), /Cannot cancel completed/);
      })
    );
  });

  it('duplicate enqueue throws', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0), (id) => {
        const queue = new TaskQueue({ maxConcurrency: 1 });
        queue.enqueue(makeTask(id));
        assert.throws(() => queue.enqueue(makeTask(id)), /already exists/);
      })
    );
  });

  it('leaseNext returns null when at concurrency limit', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (maxConcurrency) => {
        const queue = new TaskQueue({ maxConcurrency });

        // fill to limit
        for (let i = 0; i < maxConcurrency; i++) {
          queue.enqueue(makeTask(`task-${i}`));
          queue.leaseNext();
        }

        // add one more queued task
        queue.enqueue(makeTask('overflow'));
        const result = queue.leaseNext();
        assert.equal(result, null);
      })
    );
  });
});
