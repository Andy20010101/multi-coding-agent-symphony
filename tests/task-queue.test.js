import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

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

