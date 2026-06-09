# v43+ Local Goal Supervisor Progress Classifier Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B6`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

## Purpose

- Make active-child progress classification explicit instead of inferring status from scattered state fields.
- Put the active-child classifier into `doctor`, `context`, and `heartbeat-prompt` so operator triage and monitor summaries read the same state signal.

## Change Summary

The external runner now classifies active child state with explicit outcomes:

- `recent-progress`
- `stalled`
- `not-loaded-wait`
- `terminal-no-result`
- `completed-unconsumed-result`
- `result-invalid`
- `waiting`

The classifier combines:

- latest observable turn status
- age of the latest observable activity
- thread-record status
- bounded result availability from the active thread
- bounded result availability from the result escrow file

`doctor` emits `activeProgress` as a first-class field. `context` and the generated heartbeat summary now carry the same classifier output for monitor-side decisions.

## Focused Validation

Commands run:

```text
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs context --goal b6-progress-replay-20260608
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs heartbeat-prompt --goal b6-progress-replay-20260608
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs doctor --goal b6-progress-replay-20260608 --probe-app
```

Replay fixtures used during this run:

- Scratch repo: `/tmp/mcas-b6-repo.VusbPr`
- Scratch assigned worktree: `/tmp/mcas-b6-assigned.S09WvK`
- Scratch active thread: `019ea5e2-627c-7702-9907-58aa3d5b1aa9`

`selftest` now carries one deterministic same-lease replay under `sameLeaseProgressReplay` and passed with:

- `sequence[0]`: `recent-progress`
- `sequence[1]`: `stalled`
- `sequence[2]`: `completed-unconsumed-result`
- `contextClassification`: `waiting`

The live scratch goal then confirmed the monitor-facing outputs:

- `context.activeProgress.classification`: `stalled`
- `heartbeat-prompt` generated summary `activeProgress.classification`: `stalled`
- `doctor --probe-app` on the same bound lease classified the completed thread as `completed-unconsumed-result`
- `doctor --probe-app` also reported `resultAvailability.source: thread-result-block`
- `assignedWorktree.head`: `75dffc7a5109a55220592ae7a90bcec615987fb3`
- `assignedWorktree.dirty`: `false`

The bound App thread returned the expected final result block after `sleep 150`, and the runner saw it as an unconsumed completed result before any state registration.

## Residual Note

- An early projectless live probe during the in-progress turn did not produce stable app-server turn status, so the `recent-progress` leg is now locked by deterministic same-lease selftest coverage instead of app-server timing.
- That probe inconsistency belongs to thread-read behavior, not to the classifier contract. The classifier contract itself now has deterministic replay plus live monitor/terminal proof.
