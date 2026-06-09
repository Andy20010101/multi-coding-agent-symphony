# v43+ Local Goal Supervisor Daemon Restart Replay Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B5`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Scratch goal:

- goal id: `b5-daemon-waiting-restart-1780892771`
- scratch repo worktree: `/tmp/b5-daemon-restart.IMdtvt`
- clean assigned worktree: `/tmp/b5-daemon-thread.NV5GF4`

## Purpose

- Prove the `waiting-operator` daemon state in a live replay, not only in selftest.
- Prove that an explicit manual recovery step can clear the blocked lease and that the daemon can then be restarted to finish cleanly.
- Separate the reusable daemon health contract from the still-temporary launcher/process mechanics.

## Scratch Shape

The scratch goal used:

- one runbook task
- one release gate: `release.docs-updated`

The scratch goal was advanced to `goal next = complete` before the daemon replay by registering:

- `worker.evidence-recorded`
- `reviewer.approved`
- `main.verification-passed`
- `release.gate-passed` for `release.docs-updated`
- `release.ready-declared`

After those events, the runner state was initialized and a manual adopted release-manager lease was bound as:

- thread id: `missing-blocked-closeout`
- task id: `release`
- role: `release-manager`
- phase: `release-prep`

No bounded result escrow file was created for that active lease.

That is the exact blocked condition this replay wanted:

- goal ledger already complete
- live active lease still present
- no valid result to reconcile automatically

## Replay A: Daemon Quiesces To waiting-operator

Command:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon \
  --goal b5-daemon-waiting-restart-1780892771 \
  --interval-ms 1000 \
  --max-ticks 5 \
  --allow-closeout
```

Observed daemon result:

- top-level daemon status: `waiting-operator`
- `waitingOperator: true`
- tick count: `1`
- tick 1 status: `waiting-operator`
- tick 1 plan status: `blocked`
- tick 1 next action: `operator-approval-required`
- resume command:

```text
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon --goal b5-daemon-waiting-restart-1780892771 --interval-ms 10000 --max-ticks 500 --allow-closeout
```

`daemon-status --goal b5-daemon-waiting-restart-1780892771` then reported:

- health status: `waiting-operator`
- `daemonActive: false`
- `activityStatus: waiting-operator`
- `staleByPid: false`
- latest tick status: `waiting-operator`

This is the live B5 proof that the daemon does not keep sleeping and emitting duplicate blocked ticks after an operator block is raised.

## Replay B: Manual Recovery Clears The Lease

The blocked lease was then cleared manually with:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs complete-thread \
  --goal b5-daemon-waiting-restart-1780892771 \
  --thread missing-blocked-closeout \
  --status cancelled-manual-recovery
```

Observed completion result:

- thread status: `cancelled-manual-recovery`
- runner `active: null`
- checkpoint status: `cancelled-manual-recovery`

This is the explicit operator action the daemon was waiting for.

## Replay C: Restart Finishes Cleanly

After that manual recovery, the daemon was started again with the same closeout allowance:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs daemon \
  --goal b5-daemon-waiting-restart-1780892771 \
  --interval-ms 1000 \
  --max-ticks 5 \
  --allow-closeout
```

Observed daemon result:

- top-level daemon status: `stopped`
- `waitingOperator: false`
- tick count: `1`
- tick 1 status: `complete`
- tick 1 plan status: `complete`

`daemon-status` after the restart then reported:

- health status: `stopped`
- derived status: `daemon-stopped-with-recent-progress`
- latest tick status: `complete`
- latest plan status: `complete`
- no resume command

This proves the daemon restart path is deterministic after the blocked lease has been explicitly resolved.

## What This Replay Proved

- `waiting-operator` is a real daemon lifecycle state, not only a selftest branch.
- The daemon stops after emitting the operator block instead of looping forever.
- `resumeCommand` is actionable once the operator/manual recovery step is done.
- Restarting after recovery reaches `complete` cleanly.
- The reusable part is the health and lifecycle contract:
  - `waiting-operator`
  - `stopped`
  - `daemon-stopped-with-recent-progress`
  - `resumeCommand`

## Boundary Note

This replay does not make the PTY launcher or pid/health file implementation project-internal. Those mechanics are still temporary.

What is stable enough to harvest is the state model and restart contract:

- what counts as a quiesced operator block
- when the daemon should stop
- what the operator must do before restart
- what a healthy restart looks like afterward
