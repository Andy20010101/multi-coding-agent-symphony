import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  ValidationError,
  validateCommandSpec,
  validateTaskSpec
} from '../src/contracts.js';
import { ArtifactStore } from '../src/artifact-store.js';
import { SessionEventLog } from '../src/session-event-log.js';
import { classifyFailure } from '../src/failure-taxonomy.js';

describe('Phase 1 foundation modules', () => {
  it('validates TaskSpec and CommandSpec contracts with typed errors', () => {
    const taskSpec = {
      id: 'task-123',
      source: 'github',
      repository: 'Andy20010101/multi-coding-agent-symphony',
      objective: 'Implement contract validation',
      acceptance: ['valid specs pass', 'invalid specs fail'],
      version: '1'
    };

    const commandSpec = {
      name: 'implement',
      version: '1',
      allowedTools: ['read', 'write', 'shell', 'test'],
      workspacePolicy: 'primary-writer',
      doneCriteria: ['diff-created', 'tests-run', 'evidence-written'],
      evidenceSchema: 'implementation-evidence.v1'
    };

    assert.equal(validateTaskSpec(taskSpec), taskSpec);
    assert.equal(validateCommandSpec(commandSpec), commandSpec);
    assert.throws(
      () => validateTaskSpec({ ...taskSpec, objective: '' }),
      ValidationError
    );
    assert.throws(
      () => validateCommandSpec({ ...commandSpec, allowedTools: [] }),
      ValidationError
    );
  });

  it('validates optional TaskSpec metadata when present', () => {
    const taskSpec = {
      id: 'task-123',
      source: 'manual',
      repository: 'Andy20010101/multi-coding-agent-symphony',
      objective: 'Validate optional task metadata',
      constraints: ['Do not change public API'],
      acceptance: ['optional fields are checked'],
      priority: 'high',
      createdAt: '2026-05-13T00:00:00.000Z',
      version: '1'
    };

    assert.equal(validateTaskSpec(taskSpec), taskSpec);
    assert.throws(
      () => validateTaskSpec({ ...taskSpec, constraints: [''] }),
      ValidationError
    );
    assert.throws(
      () => validateTaskSpec({ ...taskSpec, priority: 'urgent' }),
      ValidationError
    );
    assert.throws(
      () => validateTaskSpec({ ...taskSpec, createdAt: 'not-a-date' }),
      ValidationError
    );
  });

  it('stores and retrieves artifacts by task id and artifact id', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-artifacts-'));

    try {
      const store = new ArtifactStore(root);
      const evidence = {
        command: 'implement',
        taskId: 'task-123',
        workspaceId: 'ws-primary',
        adapter: 'codex',
        changedFiles: ['src/contracts.js'],
        checks: [{ name: 'test', status: 'passed' }],
        version: '1'
      };

      const written = await store.writeArtifact('task-123', 'evidence-1', evidence);
      const retrieved = await store.readArtifact('task-123', 'evidence-1');

      assert.equal(written.taskId, 'task-123');
      assert.equal(written.artifactId, 'evidence-1');
      assert.deepEqual(retrieved, evidence);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('appends session events in order and protects stored events from mutation', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-events-'));

    try {
      const log = new SessionEventLog(root, 'session-123');
      await log.append({
        id: 'evt-1',
        type: 'command.queued',
        timestamp: '2026-05-13T00:00:00.000Z',
        actor: 'orchestrator',
        payload: { command: 'implement' },
        version: '1'
      });
      await log.append({
        id: 'evt-2',
        type: 'verifier.result',
        timestamp: '2026-05-13T00:00:01.000Z',
        actor: 'verifier',
        payload: { status: 'passed' },
        version: '1'
      });

      const events = await log.readAll();
      events[0].payload.command = 'review';
      const reread = await log.readAll();

      assert.deepEqual(reread.map((event) => event.id), ['evt-1', 'evt-2']);
      assert.equal(reread[0].payload.command, 'implement');
      assert.equal(reread[0].sessionId, 'session-123');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serializes concurrent session event appends without corrupting the log', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcas-events-concurrent-'));

    try {
      const log = new SessionEventLog(root, 'session-123');

      await Promise.all(Array.from({ length: 10 }, (_, index) => log.append({
        id: `evt-${index + 1}`,
        type: 'artifact.written',
        timestamp: `2026-05-13T00:00:${String(index).padStart(2, '0')}.000Z`,
        actor: 'orchestrator',
        payload: {
          artifactId: `artifact-${index + 1}`
        },
        version: '1'
      })));

      const events = await log.readAll();

      assert.equal(events.length, 10);
      assert.deepEqual(new Set(events.map((event) => event.id)), new Set([
        'evt-1',
        'evt-2',
        'evt-3',
        'evt-4',
        'evt-5',
        'evt-6',
        'evt-7',
        'evt-8',
        'evt-9',
        'evt-10'
      ]));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('classifies known failures with retry and next-command metadata', () => {
    assert.deepEqual(classifyFailure('build-failed'), {
      category: 'build-failed',
      retryable: true,
      owner: 'implementer',
      recommendedNextCommand: 'fix-ci'
    });

    assert.deepEqual(classifyFailure('unknown-error'), {
      category: 'infrastructure-failure',
      retryable: true,
      owner: 'orchestrator',
      recommendedNextCommand: 'qa'
    });
    assert.deepEqual(classifyFailure('external-ci-failed'), {
      category: 'external-ci-failed',
      retryable: true,
      owner: 'implementer',
      recommendedNextCommand: 'fix-ci'
    });
    assert.deepEqual(classifyFailure('external-ci-missing'), {
      category: 'external-ci-missing',
      retryable: true,
      owner: 'verifier',
      recommendedNextCommand: 'qa'
    });
  });
});
