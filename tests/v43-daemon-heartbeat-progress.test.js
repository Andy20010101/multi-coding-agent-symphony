import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSupervisorObservability,
  buildSupervisorRunnerPlan
} from '../src/symphony/supervisor-runner.js';

const FIXTURE_GOAL_ID = 'v19-fixture';
const GENERATED_AT = '2026-06-07T12:05:00.000Z';

describe('v43 daemon heartbeat and progress visibility', () => {
  it('keeps daemon health, manual tick freshness, and runner progress as separate states', () => {
    const visibility = buildSupervisorObservability({
      goalId: FIXTURE_GOAL_ID,
      generatedAt: GENERATED_AT,
      daemonPid: 4242,
      daemonPidAlive: false,
      lastManualTickAt: '2026-06-07T12:04:30.000Z',
      providerId: 'codex-cli',
      providerOperationId: 'op_v41_123',
      providerStartedAt: '2026-06-07T12:03:00.000Z',
      providerProgressAt: '2026-06-07T12:04:55.000Z',
      providerTimeoutMs: 300000,
      providerStatus: 'checking provider health',
      providerArtifactRefs: ['artifacts/provider/op_v41_123/status.json']
    });

    assert.equal(visibility.daemon.state, 'daemon-stopped');
    assert.equal(visibility.manualTick.state, 'manual-tick-recent');
    assert.equal(visibility.providerProgress.state, 'recent-progress');
    assert.equal(visibility.doctorState, 'daemon-stopped-with-recent-progress');
    assert.equal(visibility.heartbeatDecision.action, 'restart-stopped-idle-runner');
    assert.equal(visibility.heartbeatDecision.documentedLaunchPath, 'pnpm --silent symphony supervisor run --goal v19-fixture --json');
  });

  it('blocks duplicate dispatch when a stale daemon still has an active child', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v43-stale-child-'));

    try {
      const plan = await buildSupervisorRunnerPlan({
        stateDir: join(root, '.symphony'),
        goalId: FIXTURE_GOAL_ID,
        generatedAt: GENERATED_AT,
        daemonPid: 4242,
        daemonPidAlive: true,
        daemonHealthAt: '2026-06-07T11:55:00.000Z',
        lastDaemonTickAt: '2026-06-07T11:55:05.000Z',
        activeLeaseId: 'lease_task_4_worker',
        activeThreadId: '019ea2f4-f245-75d0-879a-e7f27ec7225a',
        activeChildStartedAt: '2026-06-07T11:50:00.000Z',
        activeChildLatestReadState: 'active'
      });

      assert.equal(plan.status, 'blocked');
      assert.equal(plan.stopReason, 'stale-daemon-active-child-needs-operator-inspection');
      assert.equal(plan.observability.daemon.state, 'daemon-stale');
      assert.equal(plan.observability.heartbeatDecision.duplicateDispatchAllowed, false);
      assert.equal(plan.cycles[0].action.kind, 'block');
      assert.match(plan.cycles[0].action.reason, /child thread 019ea2f4/u);
      assert.equal(plan.observability.notifications[0].id, 'stale-daemon-active-child');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('surfaces approval-required state with the exact blocked command or flag', () => {
    const visibility = buildSupervisorObservability({
      goalId: FIXTURE_GOAL_ID,
      generatedAt: GENERATED_AT,
      daemonPidAlive: true,
      daemonHealthAt: '2026-06-07T12:04:59.000Z',
      approvalRequiredCommand: '/goal closeout --fresh-controller --allow-closeout',
      approvalRequiredFlag: '--allow-closeout',
      approvalRequiredReason: 'Release closeout requires explicit operator approval.'
    });

    const notification = visibility.notifications.find((item) => item.id === 'approval-required');

    assert.equal(visibility.daemon.state, 'daemon-active');
    assert.equal(notification.command, '/goal closeout --fresh-controller --allow-closeout');
    assert.equal(notification.flag, '--allow-closeout');
    assert.match(notification.message, /explicit operator approval/u);
  });

  it('projects controlled provider progress through v41 operation ids and sanitized refs only', () => {
    const visibility = buildSupervisorObservability({
      goalId: FIXTURE_GOAL_ID,
      generatedAt: GENERATED_AT,
      providerId: 'codex-cli',
      providerOperationId: 'op_v41_provider_9',
      providerStartedAt: '2026-06-07T12:01:00.000Z',
      providerProgressAt: '2026-06-07T12:04:00.000Z',
      providerTimeoutMs: 120000,
      providerStatus: 'attempt finished with token=secret-value and sk-live-secret123456',
      providerArtifactRefs: [
        'artifacts/controlled-provider/op_v41_provider_9/progress.json',
        'TOKEN=secret-artifact-ref'
      ],
      providerRecoveryNote: 'Retry through controlled runner recovery; do not read raw output.',
      providerRawOutput: 'raw provider output with SECRET=do-not-print'
    });

    assert.equal(visibility.providerProgress.providerId, 'codex-cli');
    assert.equal(visibility.providerProgress.operationId, 'op_v41_provider_9');
    assert.equal(visibility.providerProgress.rawOutputExposed, false);
    assert.equal(visibility.providerProgress.rawOutputSuppressed, true);
    assert.deepEqual(visibility.providerProgress.artifactRefs, [
      'artifacts/controlled-provider/op_v41_provider_9/progress.json'
    ]);
    assert.doesNotMatch(JSON.stringify(visibility), /do-not-print|secret-artifact-ref|sk-live-secret123456/u);
  });

  it('reports a healthy daemon with an active child without creating duplicate work', async () => {
    const root = await mkdtemp(join(tmpdir(), 'symphony-v43-active-child-'));

    try {
      const plan = await buildSupervisorRunnerPlan({
        stateDir: join(root, '.symphony'),
        goalId: FIXTURE_GOAL_ID,
        generatedAt: GENERATED_AT,
        daemonPid: 4242,
        daemonPidAlive: true,
        daemonHealthAt: '2026-06-07T12:04:59.000Z',
        activeLeaseId: 'lease_task_4_worker',
        activeThreadId: 'thread-task-4-worker'
      });

      assert.equal(plan.observability.daemon.state, 'daemon-active');
      assert.equal(plan.observability.heartbeatDecision.action, 'wait-active-child');
      assert.equal(plan.observability.heartbeatDecision.duplicateDispatchAllowed, false);
      assert.equal(plan.status, 'blocked');
      assert.equal(plan.stopReason, 'active-child-already-running');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
