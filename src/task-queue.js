import { validateTaskSpec } from './contracts.js';

const PRIORITY_WEIGHT = {
  high: 3,
  normal: 2,
  low: 1
};

export class TaskQueue {
  constructor({ maxConcurrency = 1 } = {}) {
    if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) {
      throw new TypeError('maxConcurrency must be a positive integer');
    }

    this.maxConcurrency = maxConcurrency;
    this.records = [];
    this.sequence = 0;
  }

  enqueue(task) {
    validateTaskSpec(task);

    if (this.records.some((record) => record.task.id === task.id)) {
      throw new Error(`Task already exists: ${task.id}`);
    }

    this.sequence += 1;

    const record = {
      task: structuredClone(task),
      status: 'queued',
      sequence: this.sequence
    };

    this.records.push(record);
    return structuredClone(record);
  }

  leaseNext() {
    if (this.#runningCount() >= this.maxConcurrency) {
      return null;
    }

    const next = this.records
      .filter((record) => record.status === 'queued')
      .sort(compareQueueRecords)[0];

    if (!next) {
      return null;
    }

    next.status = 'running';
    return structuredClone(next);
  }

  complete(taskId) {
    const record = this.#getRecord(taskId);
    record.status = 'completed';
    return structuredClone(record);
  }

  cancel(taskId, reason) {
    const record = this.#getRecord(taskId);

    if (record.status === 'completed') {
      throw new Error(`Cannot cancel completed task: ${taskId}`);
    }

    record.status = 'cancelled';
    record.cancelReason = reason;
    return structuredClone(record);
  }

  get(taskId) {
    return structuredClone(this.#getRecord(taskId));
  }

  list({ status } = {}) {
    return this.records
      .filter((record) => status === undefined || record.status === status)
      .map((record) => structuredClone(record));
  }

  #runningCount() {
    return this.records.filter((record) => record.status === 'running').length;
  }

  #getRecord(taskId) {
    const record = this.records.find((candidate) => candidate.task.id === taskId);

    if (!record) {
      throw new Error(`Unknown task: ${taskId}`);
    }

    return record;
  }
}

function compareQueueRecords(left, right) {
  const priorityDelta = priorityWeight(right.task.priority) - priorityWeight(left.task.priority);

  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  return left.sequence - right.sequence;
}

function priorityWeight(priority = 'normal') {
  return PRIORITY_WEIGHT[priority] ?? PRIORITY_WEIGHT.normal;
}

