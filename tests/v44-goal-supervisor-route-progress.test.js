import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildEscrowFirstRouteInput,
  normalizeAppThreadRead
} from '../src/symphony/goal-supervisor/app-thread-adapter.js';
import {
  currentAfterLocalWorkerRevision,
  decideGoalSupervisorRoute,
  latestValidResultForCurrent,
  observeGoalSupervisorProgress
} from '../src/symphony/goal-supervisor/route-progress.js';

const FIXTURE_PATH = new URL('../fixtures/contracts/goal-supervisor/route-progress.v44.replay.v1.json', import.meta.url);

describe('v44 goal supervisor route engine and progress observer', () => {
  it('routes worker revision results back to reviewer after reviewer.needs-revision', async () => {
    const fixture = await readFixture();
    const scenario = scenarioByName(fixture, 'reviewer-needs-revision-worker-revision-routes-reviewer');
    const historicalReviewerResult = latestValidResultForCurrent({
      state: scenario.state,
      current: {
        taskId: 'task-3',
        role: 'reviewer',
        phase: 'review'
      }
    });
    const decision = decideGoalSupervisorRoute({
      state: scenario.state,
      goalNext: scenario.goalNext,
      nowMs: Date.parse(fixture.nowUtc)
    });

    assert.equal(historicalReviewerResult, null);
    assert.equal(decision.readOnly, true);
    assert.equal(decision.willMutate, false);
    assert.equal(decision.state, scenario.expected.routeState);
    assert.equal(decision.action.kind, scenario.expected.actionKind);
    assert.equal(decision.current.role, scenario.expected.currentRole);
    assert.equal(decision.current.phase, scenario.expected.currentPhase);
    assert.equal(decision.reason, scenario.expected.reason);
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

    assert.equal(latestValidResultForCurrent({
      state: historicalState,
      current: {
        taskId: 'task-3',
        role: 'reviewer',
        phase: 'review'
      }
    }), null);
    assert.equal(latestValidResultForCurrent({
      state: pendingState,
      current: {
        taskId: 'task-3',
        role: 'reviewer',
        phase: 'review'
      }
    }).result.eventToRegister, 'reviewer.approved');
  });

  it('routes reviewer approval to main verification instead of treating it as main verification', async () => {
    const fixture = await readFixture();
    const scenario = scenarioByName(fixture, 'reviewer-approval-after-main-failure-routes-main-verifier');
    const override = currentAfterLocalWorkerRevision({
      state: scenario.state,
      current: scenario.goalNext.next
    });
    const reviewerPending = latestValidResultForCurrent({
      state: scenario.state,
      current: {
        taskId: 'task-3',
        role: 'main-verifier',
        phase: 'main-verification'
      }
    });
    const decision = decideGoalSupervisorRoute({
      state: scenario.state,
      goalNext: scenario.goalNext,
      nowMs: Date.parse(fixture.nowUtc)
    });

    assert.equal(override.current.role, 'main-verifier');
    assert.equal(reviewerPending, null);
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
    const recent = observeGoalSupervisorProgress({
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
    const stalledProgress = observeGoalSupervisorProgress({
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
    const pendingProgress = observeGoalSupervisorProgress({
      state: pending.state,
      goalNext: pending.goalNext,
      routeInput: pendingRouteInput,
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs
    });
    const complete = observeGoalSupervisorProgress({
      state: {
        active: null,
        threads: [],
        results: []
      },
      goalNext: { status: 'complete', reason: 'all tasks verified' },
      nowMs: Date.parse(fixture.nowUtc),
      progressGraceMs: fixture.progressGraceMs
    });

    assert.equal(recent.state, 'recent-progress');
    assert.equal(stalledProgress.state, 'stalled');
    assert.equal(pendingProgress.state, 'pending-result');
    assert.equal(complete.state, 'complete');
  });

  it('routes stalled active children to operator recovery and valid escrow to registration', async () => {
    const fixture = await readFixture();
    const stalled = scenarioByName(fixture, 'active-child-stalled-routes-operator-recovery');
    const pending = scenarioByName(fixture, 'valid-escrow-result-is-pending-result');
    const stalledDecision = decideGoalSupervisorRoute({
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
    const pendingDecision = decideGoalSupervisorRoute({
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
});

async function readFixture() {
  return JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
}

function scenarioByName(fixture, name) {
  const scenario = fixture.scenarios.find((entry) => entry.name === name);
  assert.notEqual(scenario, undefined, name);
  return scenario;
}
