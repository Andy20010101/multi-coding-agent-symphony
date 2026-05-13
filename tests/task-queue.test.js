import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { TaskQueue } from '../src/task-queue.js';

const normalTask = {
  id: 'task-normal',
  source: 'github',
  repository: 'Andy20010101/multi-coding-agent-symphony',
  objective: 'Normal priority work',
  acceptance: ['done'],
  priority: 'normal',
  version: '1'
};

const highTask = {
  id: 'task-high',
  source: 'github',
  repository: 'Andy20010101/multi-coding-agent-symphony',
  objective: 'High priority work',
  acceptance: ['done'],
  priority: 'high',
  version: '1'
};

describe('TaskQueue', () => {
  it('leases tasks in priority order and respects concurrency', () => {
    const queue = new TaskQueue({ maxConcurrency: 1 });

    queue.enqueue(normalTask);
    queue.enqueue(highTask);

    assert.equal(queue.leaseNext().task.id, 'task-high');
    assert.equal(queue.leaseNext(), null);
  });

  it('completes leased tasks and frees concurrency', () => {
    const queue = new TaskQueue({ maxConcurrency: 1 });

    queue.enqueue(highTask);
    queue.enqueue(normalTask);
    queue.leaseNext();
    queue.complete('task-high');

    assert.equal(queue.get('task-high').status, 'completed');
    assert.equal(queue.leaseNext().task.id, 'task-normal');
  });

  it('persists queue state and reloads it after restart', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-task-queue-'));

    try {
      const stateFile = join(root, 'queue.json');
      const queue = new TaskQueue({ maxConcurrency: 1, stateFile });

      queue.enqueue(highTask);
      queue.enqueue(normalTask);
      queue.leaseNext({
        adapterId: 'codex',
        command: 'implement',
        leaseTimeoutMs: 1000,
        now: '2026-05-13T00:00:00.000Z'
      });
      queue.complete('task-high');

      const reloaded = new TaskQueue({ maxConcurrency: 1, stateFile });

      assert.equal(reloaded.get('task-high').status, 'completed');
      assert.equal(reloaded.get('task-high').adapterId, 'codex');
      assert.equal(reloaded.leaseNext().task.id, 'task-normal');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('recovers expired running leases from persisted state', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-task-queue-expired-'));

    try {
      const stateFile = join(root, 'queue.json');
      const queue = new TaskQueue({ maxConcurrency: 1, stateFile });

      queue.enqueue(highTask);
      const firstLease = queue.leaseNext({
        adapterId: 'codex',
        command: 'implement',
        leaseTimeoutMs: 1000,
        now: '2026-05-13T00:00:00.000Z'
      });

      assert.equal(firstLease.attempt, 1);

      const reloaded = new TaskQueue({ maxConcurrency: 1, stateFile });
      const recovered = reloaded.recoverExpiredLeases({
        now: '2026-05-13T00:00:02.000Z'
      });

      assert.deepEqual(recovered.map((record) => record.task.id), ['task-high']);
      assert.equal(reloaded.get('task-high').status, 'queued');

      const secondLease = reloaded.leaseNext({
        adapterId: 'claude-code',
        command: 'implement',
        now: '2026-05-13T00:00:03.000Z'
      });

      assert.equal(secondLease.task.id, 'task-high');
      assert.equal(secondLease.attempt, 2);
      assert.equal(secondLease.adapterId, 'claude-code');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('records lifecycle event ids and timestamps for queue state changes', () => {
    const queue = new TaskQueue({ maxConcurrency: 1 });

    const created = queue.enqueue(highTask, {
      now: '2026-05-13T00:00:00.000Z'
    });
    const leased = queue.leaseNext({
      adapterId: 'codex',
      command: 'implement',
      now: '2026-05-13T00:00:01.000Z'
    });
    const completed = queue.complete('task-high', {
      now: '2026-05-13T00:00:02.000Z'
    });

    assert.equal(created.createdAt, '2026-05-13T00:00:00.000Z');
    assert.equal(created.createdEventId, 'task-queue-1-created');
    assert.equal(leased.leasedAt, '2026-05-13T00:00:01.000Z');
    assert.equal(leased.leasedEventId, 'task-queue-1-leased-1');
    assert.equal(completed.completedAt, '2026-05-13T00:00:02.000Z');
    assert.equal(completed.completedEventId, 'task-queue-1-completed');
  });

  it('cancels queued tasks and skips them during leasing', () => {
    const queue = new TaskQueue({ maxConcurrency: 1 });

    queue.enqueue(highTask);
    queue.enqueue(normalTask);
    queue.cancel('task-high', 'user-request');

    assert.equal(queue.get('task-high').status, 'cancelled');
    assert.equal(queue.get('task-high').cancelReason, 'user-request');
    assert.equal(queue.leaseNext().task.id, 'task-normal');
  });
});
