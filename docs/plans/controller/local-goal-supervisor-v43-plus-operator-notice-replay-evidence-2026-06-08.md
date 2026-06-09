# v43+ Local Goal Supervisor Operator Notice Replay Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B7`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Scratch goal:

- goal id: `b7-operator-notice-replay-1780900737`
- scratch repo worktree: `/tmp/b7-operator-repo.XFAmDT`
- clean assigned worktree: `/tmp/b7-operator-thread.0ExuzL`
- blocked active child thread id: `missing-b7-blocked-closeout`
- daemon-created notice thread id: `019ea5f4-bff4-75e2-98af-387e7b48757c`

Runner provenance baseline for the same external runner revision:

- `docs/plans/controller/local-goal-supervisor-v43-plus-runner-snapshot-2026-06-08.json`
- `docs/plans/controller/local-goal-supervisor-v43-plus-runner-snapshot-doctor-2026-06-08.json`

## Purpose

- Create one fresh blocked approval notice through the daemon instead of relying on older retained state.
- Prove that repeated blocked daemon runs reuse the same notice thread instead of creating duplicates.
- Prove that `doctor` and `context` expose the normalized notice payload directly.
- Prove that manual recovery retires the live notice out of state and keeps the retirement in the audit log.

## Scratch Shape

The scratch goal used:

- one runbook task
- one release gate: `release.docs-updated`

The scratch goal was advanced to `goal next = complete` before the replay by registering:

- `worker.evidence-recorded`
- `reviewer.approved`
- `main.verification-passed`
- `release.docs-updated` passed
- `release.ready-declared`

After those events, the external runner state was initialized and one manual adopted release-manager lease was bound as:

- thread id: `missing-b7-blocked-closeout`
- task id: `release`
- role: `release-manager`
- phase: `release-prep`

No bounded result escrow file existed for that lease.

That is the blocked condition B7 wanted:

- goal ledger already complete
- active lease still present
- no valid result to reconcile automatically

## Replay A: Daemon Creates One Blocked Notice

Command:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon \
  --goal b7-operator-notice-replay-1780900737 \
  --interval-ms 1000 \
  --max-ticks 5 \
  --allow-closeout
```

Observed daemon result:

- top-level daemon status: `waiting-operator`
- tick 1 status: `waiting-operator`
- tick 1 plan status: `blocked`
- tick 1 current: `release / release-manager / release-prep`
- resume command:

```text
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon --goal b7-operator-notice-replay-1780900737 --interval-ms 10000 --max-ticks 500 --allow-closeout
```

Observed state after that run:

- `state.operatorNotifications.length`: `1`
- `operatorNotifications[0].kind`: `blocked-approval`
- `operatorNotifications[0].noticeThreadId`: `019ea5f4-bff4-75e2-98af-387e7b48757c`
- `operatorNotifications[0].requiresDaemonRestart`: `true`
- `operatorNotifications[0].primaryCommand`: same as the resume command above

`context --goal b7-operator-notice-replay-1780900737` now exposes the normalized payload directly. The live output included:

- `operatorNotifications[0].goalId`: `b7-operator-notice-replay-1780900737`
- `operatorNotifications[0].current.taskId / role / phase`: `release / release-manager / release-prep`
- `operatorNotifications[0].threadId`: `missing-b7-blocked-closeout`
- `operatorNotifications[0].noticeThreadId`: `019ea5f4-bff4-75e2-98af-387e7b48757c`
- `operatorNotifications[0].worktree`: `/tmp/b7-operator-thread.0ExuzL`
- `operatorNotifications[0].branch`: `b7-blocked-closeout`
- `operatorNotifications[0].payload.contractName`: `local-goal-supervisor-operator-notice.v1`
- `operatorNotifications[0].payload.reason`: `Goal next reported complete while the supervisor still has an active or unreconciled lease. Reconcile the child result and clear the lease before accepting goal completion.`
- `operatorNotifications[0].payload.supportingCommands`: context and doctor commands for the same goal

`doctor --goal ...` showed the same blocked state and the same notice thread id while daemon health reported:

- daemon status: `waiting-operator`
- `activityStatus: waiting-operator`
- `staleByPid: false`

## Replay B: A Second Block Reuses The Same Notice Thread

The daemon was started a second time without clearing the blocked lease:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon \
  --goal b7-operator-notice-replay-1780900737 \
  --interval-ms 1000 \
  --max-ticks 5 \
  --allow-closeout
```

Observed results:

- top-level daemon status stayed `waiting-operator`
- `state.operatorNotifications.length` stayed `1`
- first notice thread id stayed `019ea5f4-bff4-75e2-98af-387e7b48757c`
- second notice thread id stayed `019ea5f4-bff4-75e2-98af-387e7b48757c`

The daemon log recorded `operatorNotice.status: "already-notified"` on the second blocked tick.

That is the B7 dedupe proof: one blocked condition created one notice thread and later blocked daemon runs reused it.

## Replay C: Manual Recovery Retires The Notice

The blocked lease was cleared manually with:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs complete-thread \
  --goal b7-operator-notice-replay-1780900737 \
  --thread missing-b7-blocked-closeout \
  --status cancelled-manual-recovery
```

Observed post-recovery state:

- `context.operatorNotifications.length`: `0`
- `doctor.operatorNotifications.length`: `0`
- active thread: none
- latest checkpoint status: `cancelled-manual-recovery`

The append-only log then recorded one `operator-notification-retired` entry with:

- retired notice id: `notice_06a3ca65-f816-4fda-88a9-c8e96ee4096b`
- `retirement.reason`: `target-thread-not-live`
- `retirement.targetThreadId`: `missing-b7-blocked-closeout`
- `retirement.threadStatus`: `cancelled-manual-recovery`

That proves the live notice disappears from state once the operator resolves the block, while the audit log keeps the retirement record.

## Boundary Note

- A direct `codex_app.read_thread` readback for the created notice thread failed because the underlying rollout file was empty at read time. B7 acceptance in this replay therefore relied on daemon output, persisted state, `context`, `doctor`, and the append-only log instead of thread-store rendering.
- This replay now cites the shared runner snapshot baseline above instead of carrying a standalone runner digest or ad hoc doctor reference.
- This does not weaken the B7 notice contract itself. The replay still proves creation, dedupe, payload visibility, and retirement. The remaining unstable piece is the temporary App notice-thread transport, which is why B7 stays a harvest candidate rather than a project-internal ready-to-plan module.
