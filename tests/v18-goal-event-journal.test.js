import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  GOAL_EVENT_LOG_CONTRACT_NAME,
  appendGoalEvent,
  computeGoalEventHash,
  getManagedGoalEventJournalPath,
  readGoalEventJournal,
  validateGoalEventChain
} from '../src/symphony/goal-event-journal.js';

const GOAL_ID = 'v18-goal-event-journal-evidence-recorder';

describe('v18 append-only event journal writer', () => {
  it('previews a dry-run event without creating a managed journal file', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-journal-dry-run-'));
    const stateDir = join(root, '.symphony');

    try {
      const result = await appendGoalEvent({
        stateDir,
        mode: 'dry-run',
        recordedAt: '2026-05-28T10:02:00.000Z',
        event: buildEvent({ eventId: 'evt_20260528_task2_worker_started' })
      });

      assert.equal(result.mode, 'dry-run');
      assert.equal(result.written, false);
      assert.equal(result.appendOnly, true);
      assert.equal(result.event.sequence, 1);
      assert.equal(result.event.previousEventHash, null);
      assert.match(result.event.eventHash, /^sha256:[a-f0-9]{64}$/u);
      assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
      assert.equal(await pathExists(stateDir), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('confirms by appending only and preserving earlier event bytes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-journal-append-'));
    const stateDir = join(root, '.symphony');

    try {
      const first = await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:02:00.000Z',
        event: buildEvent({ eventId: 'evt_20260528_task2_worker_started' })
      });
      const journalPath = getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID });
      const firstLine = (await readFile(journalPath, 'utf8')).trimEnd();

      const second = await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:03:00.000Z',
        event: buildEvent({
          eventId: 'evt_20260528_task2_worker_self_checked',
          eventType: 'worker.self-check-passed',
          statement: 'Task 2 worker self-check completed.'
        })
      });

      const lines = (await readFile(journalPath, 'utf8')).trimEnd().split('\n');
      const events = lines.map((line) => JSON.parse(line));

      assert.equal(first.written, true);
      assert.equal(second.written, true);
      assert.equal(lines.length, 2);
      assert.equal(lines[0], firstLine);
      assert.equal(events[0].sequence, 1);
      assert.equal(events[1].sequence, 2);
      assert.equal(events[1].previousEventHash, events[0].eventHash);
      assert.deepEqual(validateGoalEventChain(events), { ok: true, errors: [] });

      const journal = await readGoalEventJournal({ stateDir, goalId: GOAL_ID });

      assert.equal(journal.contractName, GOAL_EVENT_LOG_CONTRACT_NAME);
      assert.equal(journal.log.appendOnly, true);
      assert.equal(journal.log.eventCount, 2);
      assert.equal(journal.log.firstSequence, 1);
      assert.equal(journal.log.lastSequence, 2);
      assert.equal(journal.log.lastEventId, 'evt_20260528_task2_worker_self_checked');
      assert.equal(journal.log.lastEventHash, events[1].eventHash);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('treats a repeated event id as idempotent only for the same event payload', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-journal-idempotent-'));
    const stateDir = join(root, '.symphony');

    try {
      const event = buildEvent({ eventId: 'evt_20260528_task2_idempotent' });
      const first = await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:02:00.000Z',
        event
      });
      const journalPath = getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID });
      const beforeRetry = await readFile(journalPath, 'utf8');
      const retry = await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:09:00.000Z',
        event
      });

      assert.equal(retry.status, 'already-appended');
      assert.equal(retry.written, false);
      assert.equal(retry.event.eventHash, first.event.eventHash);
      assert.equal(await readFile(journalPath, 'utf8'), beforeRetry);

      await assert.rejects(
        () => appendGoalEvent({
          stateDir,
          mode: 'confirm',
          recordedAt: '2026-05-28T10:10:00.000Z',
          event: buildEvent({
            eventId: 'evt_20260528_task2_idempotent',
            statement: 'Same id with different evidence must be rejected.'
          })
        }),
        (error) => error.code === 'goal-event-id-conflict' && !/\/Users\/|multi-coding-agent-symphony/u.test(error.message)
      );
      assert.equal(await readFile(journalPath, 'utf8'), beforeRetry);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps retries idempotent when occurredAt was omitted and defaults from recordedAt', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-journal-idempotent-default-time-'));
    const stateDir = join(root, '.symphony');

    try {
      const { occurredAt, ...eventWithoutOccurredAt } = buildEvent({
        eventId: 'evt_20260528_task2_idempotent_default_time'
      });
      const first = await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:02:00.000Z',
        event: eventWithoutOccurredAt
      });
      const journalPath = getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID });
      const beforeRetry = await readFile(journalPath, 'utf8');
      const retry = await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:09:00.000Z',
        event: eventWithoutOccurredAt
      });

      assert.equal(first.event.occurredAt, '2026-05-28T10:02:00.000Z');
      assert.equal(retry.status, 'already-appended');
      assert.equal(retry.written, false);
      assert.equal(await readFile(journalPath, 'utf8'), beforeRetry);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('refuses to append after modified, deleted, or reordered journal history', async () => {
    const tamperCases = [
      {
        name: 'modified historical event',
        mutate(lines) {
          const first = JSON.parse(lines[0]);
          first.statement = 'tampered after confirmation';
          return [JSON.stringify(first), lines[1]];
        }
      },
      {
        name: 'deleted earliest event',
        mutate(lines) {
          return [lines[1]];
        }
      },
      {
        name: 'reordered events',
        mutate(lines) {
          return [...lines].reverse();
        }
      }
    ];

    for (const tamperCase of tamperCases) {
      const root = await mkdtemp(join(tmpdir(), 'symphony-v18-journal-tamper-'));
      const stateDir = join(root, '.symphony');

      try {
        await appendTwoConfirmedEvents({ stateDir });

        const journalPath = getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID });
        const originalLines = (await readFile(journalPath, 'utf8')).trimEnd().split('\n');
        const tamperedContent = `${tamperCase.mutate(originalLines).join('\n')}\n`;

        await writeFile(journalPath, tamperedContent, 'utf8');

        await assert.rejects(
          () => appendGoalEvent({
            stateDir,
            mode: 'confirm',
            recordedAt: '2026-05-28T10:30:00.000Z',
            event: buildEvent({
              eventId: `evt_20260528_task2_after_${tamperCase.name.replaceAll(' ', '_')}`
            })
          }),
          (error) => error.code === 'goal-event-chain-invalid' && !/\/Users\/|multi-coding-agent-symphony/u.test(error.message),
          tamperCase.name
        );
        assert.equal(await readFile(journalPath, 'utf8'), tamperedContent);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  });

  it('does not accept arbitrary journal paths or unsafe goal path segments', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-journal-path-'));
    const stateDir = join(root, '.symphony');
    const outsideJournalPath = join(root, 'outside.ndjson');

    try {
      await assert.rejects(
        () => appendGoalEvent({
          stateDir,
          mode: 'confirm',
          journalPath: outsideJournalPath,
          recordedAt: '2026-05-28T10:02:00.000Z',
          event: buildEvent({ eventId: 'evt_20260528_task2_arbitrary_path' })
        }),
        (error) => error.code === 'unsupported-journal-option'
      );

      await assert.rejects(
        () => appendGoalEvent({
          stateDir,
          mode: 'confirm',
          recordedAt: '2026-05-28T10:02:00.000Z',
          event: buildEvent({
            eventId: 'evt_20260528_task2_unsafe_goal',
            goalId: '../escape'
          })
        }),
        (error) => error.code === 'invalid-goal-event'
      );

      assert.equal(await pathExists(outsideJournalPath), false);
      assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects dangerous evidence refs and invalid event enum fields without writing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-journal-invalid-input-'));
    const stateDir = join(root, '.symphony');
    const invalidCases = [
      {
        name: 'absolute evidence ref',
        event: buildEvent({
          eventId: 'evt_20260528_task2_invalid_abs_ref',
          evidenceRefs: [{ kind: 'repo-doc', ref: '/Users/example/secret.md', label: 'Unsafe evidence' }]
        })
      },
      {
        name: 'file URL evidence ref',
        event: buildEvent({
          eventId: 'evt_20260528_task2_invalid_file_ref',
          evidenceRefs: [{ kind: 'repo-doc', ref: 'file:///tmp/evidence.md', label: 'Unsafe evidence' }]
        })
      },
      {
        name: 'parent traversal evidence ref',
        event: buildEvent({
          eventId: 'evt_20260528_task2_invalid_parent_ref',
          evidenceRefs: [{ kind: 'repo-doc', ref: '../secret.md', label: 'Unsafe evidence' }]
        })
      },
      {
        name: 'home evidence ref',
        event: buildEvent({
          eventId: 'evt_20260528_task2_invalid_home_ref',
          evidenceRefs: [{ kind: 'repo-doc', ref: '~/secret.md', label: 'Unsafe evidence' }]
        })
      },
      {
        name: 'invalid event type',
        event: buildEvent({
          eventId: 'evt_20260528_task2_invalid_event_type',
          eventType: 'worker.done'
        })
      },
      {
        name: 'invalid phase',
        event: buildEvent({
          eventId: 'evt_20260528_task2_invalid_phase',
          phase: 'done'
        })
      },
      {
        name: 'invalid actor role',
        event: buildEvent({
          eventId: 'evt_20260528_task2_invalid_actor',
          actor: { role: 'approver', id: 'codex-worker-task-2' }
        })
      },
      {
        name: 'invalid gate status',
        event: buildEvent({
          eventId: 'evt_20260528_task2_invalid_gate_status',
          eventType: 'release.gate-passed',
          phase: 'release-gate',
          actor: { role: 'release-verifier', id: 'codex-release-verifier' },
          taskId: null,
          gate: { id: 'release.pnpm-check', status: 'green' }
        })
      }
    ];

    try {
      for (const invalidCase of invalidCases) {
        await assert.rejects(
          () => appendGoalEvent({
            stateDir,
            mode: 'confirm',
            recordedAt: '2026-05-28T10:02:00.000Z',
            event: invalidCase.event
          }),
          (error) => ['invalid-goal-event', 'invalid-goal-event-log'].includes(error.code) &&
            !/\/Users\/|multi-coding-agent-symphony/u.test(error.message),
          invalidCase.name
        );
      }

      assert.equal(await pathExists(getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID })), false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('serializes simultaneous confirms so sequence and hash chain stay valid', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-journal-concurrent-'));
    const stateDir = join(root, '.symphony');

    try {
      await Promise.all([
        appendGoalEvent({
          stateDir,
          mode: 'confirm',
          recordedAt: '2026-05-28T10:02:00.000Z',
          event: buildEvent({ eventId: 'evt_20260528_task2_concurrent_1' })
        }),
        appendGoalEvent({
          stateDir,
          mode: 'confirm',
          recordedAt: '2026-05-28T10:03:00.000Z',
          event: buildEvent({
            eventId: 'evt_20260528_task2_concurrent_2',
            eventType: 'worker.self-check-passed',
            statement: 'Concurrent second event.'
          })
        })
      ]);

      const journalPath = getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID });
      const events = (await readFile(journalPath, 'utf8')).trimEnd().split('\n').map((line) => JSON.parse(line));

      assert.deepEqual(events.map((event) => event.sequence), [1, 2]);
      assert.equal(events[1].previousEventHash, events[0].eventHash);
      assert.deepEqual(validateGoalEventChain(events), { ok: true, errors: [] });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('refuses valid-hash history that fails the goal-event-log contract', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v18-journal-invalid-history-'));
    const stateDir = join(root, '.symphony');

    try {
      await appendGoalEvent({
        stateDir,
        mode: 'confirm',
        recordedAt: '2026-05-28T10:02:00.000Z',
        event: buildEvent({ eventId: 'evt_20260528_task2_contract_history' })
      });

      const journalPath = getManagedGoalEventJournalPath({ stateDir, goalId: GOAL_ID });
      const invalidEvent = JSON.parse((await readFile(journalPath, 'utf8')).trim());
      invalidEvent.eventType = 'worker.done';
      invalidEvent.eventHash = computeGoalEventHash(invalidEvent);
      const invalidHistory = `${JSON.stringify(invalidEvent)}\n`;

      await writeFile(journalPath, invalidHistory, 'utf8');
      assert.deepEqual(validateGoalEventChain([invalidEvent]), { ok: true, errors: [] });

      await assert.rejects(
        () => readGoalEventJournal({ stateDir, goalId: GOAL_ID }),
        (error) => error.code === 'invalid-goal-event-log' && !/\/Users\/|multi-coding-agent-symphony/u.test(error.message)
      );
      await assert.rejects(
        () => appendGoalEvent({
          stateDir,
          mode: 'confirm',
          recordedAt: '2026-05-28T10:04:00.000Z',
          event: buildEvent({ eventId: 'evt_20260528_task2_after_invalid_contract' })
        }),
        (error) => error.code === 'invalid-goal-event-log' && !/\/Users\/|multi-coding-agent-symphony/u.test(error.message)
      );
      assert.equal(await readFile(journalPath, 'utf8'), invalidHistory);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

async function appendTwoConfirmedEvents({ stateDir }) {
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    recordedAt: '2026-05-28T10:02:00.000Z',
    event: buildEvent({ eventId: 'evt_20260528_task2_history_1' })
  });
  await appendGoalEvent({
    stateDir,
    mode: 'confirm',
    recordedAt: '2026-05-28T10:03:00.000Z',
    event: buildEvent({
      eventId: 'evt_20260528_task2_history_2',
      eventType: 'worker.self-check-passed',
      statement: 'Second event in the journal history.'
    })
  });
}

function buildEvent({
  eventId,
  goalId = GOAL_ID,
  taskId = 'task-2',
  eventType = 'worker.started',
  phase = 'implement',
  actor = { role: 'worker', id: 'codex-worker-task-2' },
  occurredAt = '2026-05-28T10:00:00.000Z',
  branch = 'codex/v18-task2-event-journal-writer',
  commit = null,
  evidenceRefs = [{
    kind: 'repo-doc',
    ref: 'docs/plans/v18-task2-worker-evidence-2026-05-28.md',
    label: 'Task 2 worker evidence'
  }],
  statement = 'Task 2 worker event recorded.',
  review,
  gate,
  blocker,
  metadata
} = {}) {
  return stripUndefined({
    eventId,
    goalId,
    taskId,
    eventType,
    phase,
    actor,
    occurredAt,
    branch,
    commit,
    evidenceRefs,
    statement,
    review,
    gate,
    blocker,
    metadata
  });
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}

async function pathExists(path) {
  try {
    await readFile(path, 'utf8');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}
