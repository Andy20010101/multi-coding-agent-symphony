import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { validateTaskSpec } from './contracts.js';

const PRIORITY_WEIGHT = {
  high: 3,
  normal: 2,
  low: 1
};

export class TaskQueue {
  constructor({ maxConcurrency = 1, stateFile } = {}) {
    if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) {
      throw new TypeError('maxConcurrency must be a positive integer');
    }

    this.maxConcurrency = maxConcurrency;
    this.stateFile = stateFile;
    this.records = [];
    this.sequence = 0;

    if (stateFile !== undefined) {
      assertNonEmptyString(stateFile, 'stateFile');
      this.#load();
    }
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
    this.#persist();
    return structuredClone(record);
  }

  leaseNext({
    adapterId,
    command,
    leaseTimeoutMs,
    now
  } = {}) {
    this.recoverExpiredLeases({ now });

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
    next.leasedAt = toIsoTimestamp(now);
    next.attempt = (next.attempt ?? 0) + 1;
    setOptionalStringOrDelete(next, 'adapterId', adapterId);
    setOptionalStringOrDelete(next, 'command', command);

    if (leaseTimeoutMs !== undefined) {
      assertPositiveInteger(leaseTimeoutMs, 'leaseTimeoutMs');
      next.leaseTimeoutMs = leaseTimeoutMs;
    } else {
      delete next.leaseTimeoutMs;
    }

    this.#persist();
    return structuredClone(next);
  }

  complete(taskId) {
    const record = this.#getRecord(taskId);
    record.status = 'completed';
    this.#persist();
    return structuredClone(record);
  }

  cancel(taskId, reason) {
    const record = this.#getRecord(taskId);

    if (record.status === 'completed') {
      throw new Error(`Cannot cancel completed task: ${taskId}`);
    }

    record.status = 'cancelled';
    record.cancelReason = reason;
    this.#persist();
    return structuredClone(record);
  }

  recoverExpiredLeases({ now } = {}) {
    const nowMs = toTimestampMs(now);
    const recovered = [];

    for (const record of this.records) {
      if (!isExpiredRunningLease(record, nowMs)) {
        continue;
      }

      record.status = 'queued';
      record.recoveredAt = new Date(nowMs).toISOString();
      recovered.push(structuredClone(record));
    }

    if (recovered.length > 0) {
      this.#persist();
    }

    return recovered;
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

  #load() {
    if (!existsSync(this.stateFile)) {
      return;
    }

    const state = JSON.parse(readFileSync(this.stateFile, 'utf8'));

    if (state === null || typeof state !== 'object' || Array.isArray(state)) {
      throw new TypeError('TaskQueue state must be an object');
    }

    if (!Array.isArray(state.records)) {
      throw new TypeError('TaskQueue state records must be an array');
    }

    for (const record of state.records) {
      validateQueueRecord(record);
    }

    this.records = structuredClone(state.records);
    this.sequence = Number.isInteger(state.sequence)
      ? state.sequence
      : highestSequence(this.records);
  }

  #persist() {
    if (!this.stateFile) {
      return;
    }

    mkdirSync(dirname(this.stateFile), { recursive: true });
    writeFileSync(this.stateFile, JSON.stringify({
      version: '1',
      maxConcurrency: this.maxConcurrency,
      sequence: this.sequence,
      records: this.records
    }, null, 2));
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

function validateQueueRecord(record) {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('TaskQueue record must be an object');
  }

  validateTaskSpec(record.task);
  assertNonEmptyString(record.status, 'record.status');

  if (!Number.isInteger(record.sequence) || record.sequence < 1) {
    throw new TypeError('record.sequence must be a positive integer');
  }
}

function isExpiredRunningLease(record, nowMs) {
  if (record.status !== 'running') {
    return false;
  }

  if (!Number.isInteger(record.leaseTimeoutMs) || record.leaseTimeoutMs < 1) {
    return false;
  }

  const leasedAtMs = Date.parse(record.leasedAt);

  if (Number.isNaN(leasedAtMs)) {
    return false;
  }

  return leasedAtMs + record.leaseTimeoutMs <= nowMs;
}

function toIsoTimestamp(value) {
  return new Date(toTimestampMs(value)).toISOString();
}

function toTimestampMs(value) {
  if (value === undefined) {
    return Date.now();
  }

  if (value instanceof Date) {
    const time = value.getTime();

    if (!Number.isNaN(time)) {
      return time;
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const time = Date.parse(value);

    if (!Number.isNaN(time)) {
      return time;
    }
  }

  throw new TypeError('now must be a valid timestamp');
}

function setOptionalStringOrDelete(target, field, value) {
  if (value === undefined) {
    delete target[field];
    return;
  }

  assertNonEmptyString(value, field);
  target[field] = value;
}

function highestSequence(records) {
  return records.reduce((highest, record) => Math.max(highest, record.sequence), 0);
}

function assertPositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer`);
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}
