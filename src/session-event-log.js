import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { redactSecrets } from './redaction.js';

const EVENT_TYPES = new Set([
  'task.created',
  'command.queued',
  'route.selected',
  'policy.decision',
  'adapter.started',
  'tool.observed',
  'artifact.written',
  'check.started',
  'check.finished',
  'failure.classified',
  'verifier.result',
  'command.failed',
  'command.finished',
  'ensemble.proposal.written',
  'ensemble.arbitration.decided',
  'ensemble.synthesis.written',
  'ensemble.run.completed'
]);

export class SessionEventLog {
  constructor(rootDirectory, sessionId) {
    if (typeof sessionId !== 'string' || sessionId.trim() === '') {
      throw new TypeError('sessionId must be a non-empty string');
    }

    this.rootDirectory = rootDirectory;
    this.sessionId = sessionId;
  }

  async append(event) {
    const normalized = normalizeEvent(event, this.sessionId);
    const events = await this.readAll();
    events.push(normalized);
    await mkdir(this.rootDirectory, { recursive: true });
    await writeFile(this.#logPath(), `${JSON.stringify(events, null, 2)}\n`, 'utf8');
    return structuredClone(normalized);
  }

  async readAll() {
    try {
      const content = await readFile(this.#logPath(), 'utf8');
      return JSON.parse(content).map((event) => structuredClone(event));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  #logPath() {
    return join(this.rootDirectory, `${this.sessionId}.json`);
  }
}

function normalizeEvent(event, sessionId) {
  if (event === null || typeof event !== 'object' || Array.isArray(event)) {
    throw new TypeError('event must be an object');
  }

  assertNonEmptyString(event.id, 'event.id');
  assertNonEmptyString(event.timestamp, 'event.timestamp');
  assertNonEmptyString(event.actor, 'event.actor');
  assertNonEmptyString(event.version, 'event.version');

  if (!EVENT_TYPES.has(event.type)) {
    throw new TypeError(`event.type is unsupported: ${event.type}`);
  }

  if (event.payload === null || typeof event.payload !== 'object' || Array.isArray(event.payload)) {
    throw new TypeError('event.payload must be an object');
  }

  return redactSecrets(structuredClone({ ...event, sessionId }));
}

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}
