import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildEscrowFirstRouteInput,
  duplicateDispatchGuard,
  inspectEscrowResultAvailability,
  inspectThreadResultAvailability,
  normalizeAppThreadRead
} from '../src/symphony/goal-supervisor/app-thread-adapter.js';
import { formatResultBlock } from '../src/symphony/goal-supervisor/result-protocol.js';
import {
  SUPERVISOR_LIVE_STATUSES,
  isLiveSupervisorStatus
} from '../src/symphony/goal-supervisor/state-vocabulary.js';

const FIXTURE_PATH = new URL('../fixtures/contracts/goal-supervisor/app-thread-adapter.v44.replay.v1.json', import.meta.url);

describe('v44 goal supervisor app thread adapter', () => {
  it('normalizes readable threads without mutating supervisor state', () => {
    const normalized = normalizeAppThreadRead({
      threadId: 'thread-readable',
      thread: {
        id: 'thread-readable',
        status: { type: 'idle' },
        turns: [
          {
            id: 'turn-1',
            status: 'completed',
            items: [
              {
                type: 'agentMessage',
                text: formatResultBlock(validWorkerFields({ threadId: 'thread-readable' }))
              }
            ]
          }
        ]
      },
      readerCall: { adapter: 'codex-app', status: 'ok' }
    });

    assert.equal(normalized.readOnly, true);
    assert.equal(normalized.willMutate, false);
    assert.equal(normalized.status, 'readable');
    assert.equal(normalized.readable, true);
    assert.equal(normalized.turnCount, 1);
    assert.match(normalized.latestResultText, /RESULT_BLOCK_START/u);
  });

  it('treats unreadable or notLoaded threads as non-mutating wait inputs', async () => {
    const fixture = await readFixture();
    const scenario = scenarioByName(fixture, 'unreadable-thread-without-valid-result');
    const normalized = normalizeAppThreadRead(scenario.threadRead);
    const routeInput = buildEscrowFirstRouteInput({
      active: scenario.active,
      threadRead: scenario.threadRead,
      escrow: scenario.escrow,
      expected: scenario.expected,
      releaseGates: fixture.releaseGates
    });

    assert.equal(normalized.status, 'notLoaded');
    assert.equal(normalized.readable, false);
    assert.equal(normalized.waitInput, true);
    assert.equal(normalized.readOnly, true);
    assert.equal(routeInput.status, 'wait');
    assert.equal(routeInput.actionKind, 'wait-active-thread');
    assert.equal(routeInput.willMutate, false);
    assert.equal(routeInput.resultIntake.status, 'unavailable');
    assert.equal(routeInput.resultAvailability.status, 'unavailable');
  });

  it('prefers a valid escrow result over lossy thread reads', async () => {
    const fixture = await readFixture();
    const scenario = scenarioByName(fixture, 'unreadable-thread-valid-escrow');
    const escrow = inspectEscrowResultAvailability({
      escrow: scenario.escrow,
      expected: scenario.expected,
      releaseGates: fixture.releaseGates
    });
    const routeInput = buildEscrowFirstRouteInput({
      active: scenario.active,
      threadRead: scenario.threadRead,
      escrow: scenario.escrow,
      expected: scenario.expected,
      releaseGates: fixture.releaseGates
    });

    assert.equal(escrow.status, 'pending');
    assert.equal(routeInput.status, 'pending-result');
    assert.equal(routeInput.actionKind, 'consume-result');
    assert.equal(routeInput.reason, 'valid-escrow-result-preferred-before-thread-read');
    assert.equal(routeInput.resultIntake.source, 'result-escrow-file');
    assert.equal(routeInput.resultAvailability, routeInput.resultIntake);
    assert.equal(routeInput.thread.status, 'unreadable');
    assert.equal(routeInput.dispatchGuard.blocked, true);
  });

  it('blocks duplicate dispatch while an active lease exists', async () => {
    const fixture = await readFixture();
    const scenario = scenarioByName(fixture, 'unreadable-thread-without-valid-result');
    const guard = duplicateDispatchGuard({
      active: scenario.active,
      threads: []
    });
    const routeInput = buildEscrowFirstRouteInput({
      active: scenario.active,
      threadRead: scenario.threadRead,
      escrow: scenario.escrow,
      expected: scenario.expected,
      releaseGates: fixture.releaseGates
    });

    assert.equal(guard.blocked, true);
    assert.equal(guard.reason, 'active-lease-exists');
    assert.equal(routeInput.dispatchGuard.blocked, true);
    assert.equal(routeInput.actionKind, 'wait-active-thread');
  });

  it('uses the shared live status vocabulary for duplicate dispatch and wait routing', () => {
    for (const status of SUPERVISOR_LIVE_STATUSES) {
      assert.equal(isLiveSupervisorStatus(status), true);

      const active = {
        status,
        threadId: `thread-${status}`,
        taskId: 'task-2',
        role: 'worker',
        phase: 'implement'
      };
      const guard = duplicateDispatchGuard({
        active,
        threads: []
      });
      const routeInput = buildEscrowFirstRouteInput({
        active,
        threadRead: {
          threadId: active.threadId,
          thread: { status: { type: 'notLoaded' }, turns: [] }
        },
        escrow: null,
        expected: {
          goalId: 'v44-project-internal-goal-supervisor-core',
          taskId: active.taskId,
          role: active.role,
          phase: active.phase,
          threadId: active.threadId
        }
      });

      assert.equal(guard.blocked, true, status);
      assert.equal(guard.reason, 'active-lease-exists', status);
      assert.equal(routeInput.dispatchGuard.blocked, true, status);
      assert.equal(routeInput.actionKind, 'wait-active-thread', status);
    }
  });

  it('does not treat non-live statuses as duplicate dispatch blockers', () => {
    for (const status of ['completed', 'failed', 'cancelled', 'idle', 'result-consumed']) {
      assert.equal(isLiveSupervisorStatus(status), false);
      assert.deepEqual(duplicateDispatchGuard({
        active: {
          status,
          threadId: `thread-${status}`,
          taskId: 'task-2',
          role: 'worker',
          phase: 'implement'
        },
        threads: []
      }), {
        blocked: false,
        reason: 'no-active-lease'
      });
    }
  });

  it('blocks duplicate dispatch when any known live app thread exists', () => {
    const guard = duplicateDispatchGuard({
      active: null,
      threads: [
        { threadId: 'thread-complete', status: 'completed' },
        { threadId: 'thread-live', status: 'thread-active' }
      ]
    });

    assert.equal(guard.blocked, true);
    assert.equal(guard.reason, 'live-thread-exists');
    assert.deepEqual(guard.liveThreadIds, ['thread-live']);
  });

  it('can inspect a valid result from a readable app thread when escrow is absent', () => {
    const expected = {
      goalId: 'v44-project-internal-goal-supervisor-core',
      taskId: 'task-2',
      role: 'worker',
      phase: 'implement',
      threadId: 'thread-readable-result',
      branch: 'v44-task-2-app-thread-adapter-result-consumer',
      worktree: '/Users/andy/.codex/worktrees/v44-task-2-app-thread-adapter-result-consumer',
      baseCommit: '76bc744f9c75a55a96de0605a3350d3ef392c1ab',
      evidenceRef: 'docs/plans/v44-task-2-worker-evidence-2026-06-08.md'
    };
    const normalized = normalizeAppThreadRead({
      threadId: expected.threadId,
      thread: {
        status: { type: 'idle' },
        turns: [
          {
            id: 'turn-1',
            status: 'completed',
            items: [
              {
                type: 'agentMessage',
                text: formatResultBlock(validWorkerFields({ threadId: expected.threadId }))
              }
            ]
          }
        ]
      }
    });
    const availability = inspectThreadResultAvailability({
      normalizedThread: normalized,
      expected
    });

    assert.equal(availability.status, 'pending');
    assert.equal(availability.source, 'app-thread');
    assert.equal(availability.record.threadId, expected.threadId);
  });
});

async function readFixture() {
  return JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
}

function scenarioByName(fixture, name) {
  const scenario = fixture.scenarios.find((entry) => entry.name === name);
  assert.notEqual(scenario, undefined, name);
  return scenario;
}

function validWorkerFields({ threadId }) {
  return {
    goalId: 'v44-project-internal-goal-supervisor-core',
    taskId: 'task-2',
    role: 'worker',
    threadId,
    branch: 'v44-task-2-app-thread-adapter-result-consumer',
    worktree: '/Users/andy/.codex/worktrees/v44-task-2-app-thread-adapter-result-consumer',
    baseCommit: '76bc744f9c75a55a96de0605a3350d3ef392c1ab',
    headCommit: '76bc744f9c75a55a96de0605a3350d3ef392c1ab',
    status: 'completed',
    eventToRegister: 'worker.evidence-recorded',
    evidenceRef: 'docs/plans/v44-task-2-worker-evidence-2026-06-08.md',
    filesChanged: 'src/symphony/goal-supervisor/app-thread-adapter.js; tests/v44-goal-supervisor-app-thread-adapter.test.js',
    commandsRun: 'node --test tests/v44-goal-supervisor-app-thread-adapter.test.js: passed',
    validation: 'readable thread exposes a bounded worker result',
    risks: 'none',
    blockers: 'none',
    nextSuggestedAction: 'task-2 review'
  };
}
