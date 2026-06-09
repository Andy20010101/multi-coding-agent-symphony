import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildEscrowFirstRouteInput,
  normalizeAppThreadRead
} from '../src/symphony/goal-supervisor/app-thread-adapter.js';
import {
  GOAL_SUPERVISOR_ROUTE_PROGRESS_PROJECTION_CONTRACT_NAME,
  projectGoalSupervisorRouteProgress
} from '../src/symphony/goal-supervisor/route-progress.js';
import { SUPERVISOR_LIVE_STATUSES } from '../src/symphony/goal-supervisor/state-vocabulary.js';

const FIXTURE_PATH = new URL('../fixtures/contracts/goal-supervisor/route-progress.v44.replay.v1.json', import.meta.url);

describe('v44 goal supervisor route/progress projection', () => {
  it('routes worker revision results back to reviewer after reviewer.needs-revision', async () => {
    const fixture = await readFixture();
    const scenario = scenarioByName(fixture, 'reviewer-needs-revision-worker-revision-routes-reviewer');
    const decision = projectGoalSupervisorRouteProgress({
      state: scenario.state,
      goalNext: scenario.goalNext,
      nowMs: Date.parse(fixture.nowUtc)
    });

    assert.equal(decision.contractName, GOAL_SUPERVISOR_ROUTE_PROGRESS_PROJECTION_CONTRACT_NAME);
    assert.equal(decision.readOnly, true);
    assert.equal(decision.willMutate, false);
    assert.equal(decision.state, scenario.expected.routeState);
    assert.equal(decision.action.kind, scenario.expected.actionKind);
    assert.equal(decision.current.role, scenario.expected.currentRole);
    assert.equal(decision.current.phase, scenario.expected.currentPhase);
    assert.equal(decision.reason, scenario.expected.reason);
    assert.equal(decision.progress.state, 'waiting');
  });

  it('treats only explicitly unconsumed recorded results as pending registration', () => {
    const historicalState = {
      active: null,
      threads: [],
      results: [
        {
          valid: true,
          result: {
            taskId: 'task-3',
            role: 'reviewer',
            eventToRegister: 'reviewer.needs-revision'
          }
        }
      ]
    };
    const pendingState = {
      active: null,
      threads: [],
      results: [
        {
          valid: true,
          result: {
            taskId: 'task-3',
            role: 'reviewer',
            eventToRegister: 'reviewer.approved',
            consumed: false
          }
        }
      ]
    };

    const historicalDecision = projectGoalSupervisorRouteProgress({
      state: historicalState,
      goalNext: {
        status: 'action-required',
        next: {
          taskId: 'task-3',
          role: 'reviewer',
          phase: 'review'
        },
        reason: 'reviewer approval is needed'
      }
    });
    const pendingDecision = projectGoalSupervisorRouteProgress({
      state: pendingState,
      goalNext: {
        status: 'action-required',
        next: {
          taskId: 'task-3',
          role: 'reviewer',
          phase: 'review'
        },
        reason: 'reviewer approval is needed'
      }
    });

    assert.equal(historicalDecision.state, 'dispatchable');
    assert.equal(historicalDecision.pendingResult, null);
    assert.equal(pendingDecision.state, 'pending-result');
    assert.equal(pendingDecision.pendingResult.result.eventToRegister, 'reviewer.approved');
    assert.equal(pendingDecision.progress.state, 'pending-result');
  });

  it('routes reviewer approval to main verification instead of treating it as main verification', async () => {
    const fixture = await readFixture();
    const scenario = scenarioByName(fixture, 'reviewer-approval-after-main-failure-routes-main-verifier');
    const decision = projectGoalSupervisorRouteProgress({
      state: scenario.state,
      goalNext: scenario.goalNext,
      nowMs: Date.parse(fixture.nowUtc)
    });

    assert.equal(decision.state, scenario.expected.routeState);
    assert.equal(decision.action.kind, scenario.expected.actionKind);
    assert.equal(decision.current.role, scenario.expected.currentRole);
    assert.equal(decision.current.phase, scenario.expected.currentPhase);
    assert.equal(decision.reason, scenario.expected.reason);
  });

  it('distinguishes recent progress, stalled active child, pending result, and complete progress states', async () => {
    const fixture = await readFixture();
    const stalled = scenarioByName(fixture, 'active-child-stalled-routes-operator-recovery');
    const pending = scenarioByName(fixture, 'valid-escrow-result-is-pending-result');
    const recentRouteInput = {
      thread: normalizeAppThreadRead({
        threadId: 'thread-recent-worker',
        thread: {
          status: { type: 'active' },
          turns: [
            {
              id: 'turn-recent',
              status: 'inProgress',
              updatedAt: fixture.nowUtc,
              items: []
            }
          ]
        }
      })
    };
    const recent = projectGoalSupervisorRouteProgress({
      state: {
        active: {
          status: 'active',
          threadId: 'thread-recent-worker',
          taskId: 'task-3',
          role: 'worker',
          phase: 'implement',
          updatedAt: fixture.nowUtc
        },
        threads: [],
        results: []
      },
      goalNext: stalled.goalNext,
      routeInput: recentRouteInput,
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs
    });
    const stalledRouteInput = {
      thread: normalizeAppThreadRead(stalled.threadRead)
    };
    const stalledDecision = projectGoalSupervisorRouteProgress({
      state: stalled.state,
      goalNext: stalled.goalNext,
      routeInput: stalledRouteInput,
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs
    });
    const pendingRouteInput = buildEscrowFirstRouteInput({
      active: pending.state.active,
      threadRead: pending.threadRead,
      escrow: pending.escrow,
      expected: pending.expectedResultContext,
      releaseGates: fixture.releaseGates
    });
    const pendingDecision = projectGoalSupervisorRouteProgress({
      state: pending.state,
      goalNext: pending.goalNext,
      routeInput: pendingRouteInput,
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs
    });
    const complete = projectGoalSupervisorRouteProgress({
      state: {
        active: null,
        threads: [],
        results: []
      },
      goalNext: { status: 'complete', reason: 'all tasks verified' },
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs
    });

    assert.equal(recent.progress.state, 'recent-progress');
    assert.equal(stalledDecision.progress.state, 'stalled');
    assert.equal(pendingDecision.progress.state, 'pending-result');
    assert.equal(complete.progress.state, 'complete');
  });

  it('routes stalled active children to operator recovery and valid escrow to registration', async () => {
    const fixture = await readFixture();
    const stalled = scenarioByName(fixture, 'active-child-stalled-routes-operator-recovery');
    const pending = scenarioByName(fixture, 'valid-escrow-result-is-pending-result');
    const stalledDecision = projectGoalSupervisorRouteProgress({
      state: stalled.state,
      goalNext: stalled.goalNext,
      routeInput: { thread: normalizeAppThreadRead(stalled.threadRead) },
      nowMs: Date.parse(fixture.nowUtc)
    });
    const pendingRouteInput = buildEscrowFirstRouteInput({
      active: pending.state.active,
      threadRead: pending.threadRead,
      escrow: pending.escrow,
      expected: pending.expectedResultContext,
      releaseGates: fixture.releaseGates
    });
    const pendingDecision = projectGoalSupervisorRouteProgress({
      state: pending.state,
      goalNext: pending.goalNext,
      routeInput: pendingRouteInput,
      nowMs: Date.parse(fixture.nowUtc)
    });

    assert.equal(stalledDecision.state, stalled.expected.routeState);
    assert.equal(stalledDecision.progress.state, stalled.expected.progressState);
    assert.equal(stalledDecision.action.kind, stalled.expected.actionKind);
    assert.equal(pendingDecision.state, pending.expected.routeState);
    assert.equal(pendingDecision.progress.state, pending.expected.progressState);
    assert.equal(pendingDecision.action.kind, pending.expected.actionKind);
    assert.equal(pendingDecision.pendingResult.result.eventToRegister, 'worker.evidence-recorded');
  });

  it('keeps blocked goal-next and release closeout on blocked routes', async () => {
    const fixture = await readFixture();
    const blockedGoalNext = projectGoalSupervisorRouteProgress({
      state: {
        active: null,
        threads: [],
        results: []
      },
      goalNext: {
        status: 'action-required',
        next: {
          taskId: 'task-4',
          role: 'worker',
          phase: 'implement',
          blocked: true
        },
        reason: 'blocked by missing review evidence'
      },
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs
    });
    const releaseCloseout = projectGoalSupervisorRouteProgress({
      state: {
        active: null,
        threads: [],
        results: []
      },
      goalNext: {
        status: 'action-required',
        next: {
          taskId: null,
          role: 'release-manager',
          phase: 'release-gate'
        },
        reason: 'release gate is not passed'
      },
      allowCloseout: false,
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs
    });

    assert.equal(blockedGoalNext.state, 'blocked');
    assert.equal(blockedGoalNext.action.kind, 'block');
    assert.equal(blockedGoalNext.reason, 'blocked by missing review evidence');
    assert.equal(releaseCloseout.state, 'blocked');
    assert.equal(releaseCloseout.action.kind, 'block');
    assert.equal(releaseCloseout.reason, 'release-closeout-requires-operator-authorization');
    assert.equal(releaseCloseout.progress.state, 'waiting');
  });

  it('uses the shared live status vocabulary for complete-with-live-lease blocking', async () => {
    const fixture = await readFixture();
    const blockingStatuses = SUPERVISOR_LIVE_STATUSES.filter((status) => status !== 'result-ready');

    for (const status of blockingStatuses) {
      const decision = projectGoalSupervisorRouteProgress({
        state: {
          active: {
            status,
            threadId: `thread-${status}`,
            taskId: 'task-3',
            role: 'worker',
            phase: 'implement',
            updatedAt: fixture.nowUtc
          },
          threads: [],
          results: []
        },
        goalNext: { status: 'complete', reason: 'all tasks verified' },
        nowMs: Date.parse(fixture.nowUtc),
        progressGraceMs: fixture.progressGraceMs
      });

      assert.equal(decision.state, 'blocked', status);
      assert.equal(decision.reason, 'goal-complete-with-live-supervisor-lease', status);
      assert.equal(decision.action.kind, 'recovery-required', status);
    }
  });

  it('blocks complete when a live thread status exists without a thread id', async () => {
    const fixture = await readFixture();
    const decision = projectGoalSupervisorRouteProgress({
      state: {
        active: null,
        threads: [{ status: 'thread-active' }],
        results: []
      },
      goalNext: { status: 'complete', reason: 'all tasks verified' },
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs
    });

    assert.equal(decision.state, 'blocked');
    assert.equal(decision.reason, 'goal-complete-with-live-supervisor-lease');
    assert.equal(decision.action.kind, 'recovery-required');
  });

  it('keeps result-ready complete leases on the pending-result path', async () => {
    const fixture = await readFixture();
    const decision = projectGoalSupervisorRouteProgress({
      state: {
        active: {
          status: 'result-ready',
          threadId: 'thread-result-ready',
          taskId: 'task-3',
          role: 'worker',
          phase: 'implement',
          updatedAt: fixture.nowUtc
        },
        threads: [],
        results: []
      },
      goalNext: { status: 'complete', reason: 'all tasks verified' },
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs
    });

    assert.equal(decision.state, 'pending-result');
    assert.equal(decision.reason, 'goal-complete-with-unconsumed-result');
    assert.equal(decision.action.kind, 'register-recorded-result');
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
