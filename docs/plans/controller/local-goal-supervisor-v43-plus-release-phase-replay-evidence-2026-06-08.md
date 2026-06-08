# v43+ Local Goal Supervisor Release Phase Replay Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai
Latest UTC timestamp: 2026-06-08T01:45:49Z

Goal id: `v43-plus-release-phase-replay`

Replay files:

- Temporary managed runbook: `.symphony/goals/runbooks/v43-plus-release-phase-replay.json`
- Temporary goal event log: `.symphony/goals/events/v43-plus-release-phase-replay.ndjson`
- Temporary detached worktree: `/tmp/v43-plus-release-phase-replay-worktree`
- External runner script: `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`

## Purpose

- Replay `release-gate -> release-prep -> complete` in an isolated scratch goal.
- Validate the phase-aware release-manager result contract in live runner state, not only in selftest.
- Validate completion handling when an active release-prep lease still exists after the goal ledger reaches `complete`.

## Scratch Goal Shape

The scratch goal used one runbook task and one scoped release gate:

- task: `task-1`
- release gate: `release.docs-updated`
- release evidence ref used by release-manager result blocks: `docs/plans/v43-release-evidence-2026-06-08.md`

The worker, reviewer, and main-verifier events for `task-1` were registered through the repository CLI so the event journal hash chain was valid:

- `worker.evidence-recorded`: `evt_80a94382b9d05659`
- `reviewer.approved`: `evt_86b382b17445e4a3`
- `main.verification-passed`: `evt_6dbe5ca3468524d5`

After those three events, `pnpm --silent symphony goal next --goal v43-plus-release-phase-replay --json` returned:

- role: `release-manager`
- phase: `release-gate`
- reason: `release.docs-updated is not passed in goal-progress-ledger.v1.`

## Live Replay A: Normal Release Flow

### release-gate

The runner state was initialized for the scratch goal, then a manual adopted release-manager thread was bound as:

- thread id: `replay-release-gate`
- task id: `release`
- role: `release-manager`
- phase: `release-gate`
- worktree: `/tmp/v43-plus-release-phase-replay-worktree`
- branch label: `detached-v43-plus-release-phase-replay`
- base commit: `3908d431eac6e0238e3606d4d41ff8f921684ab3`

The result block used:

- `eventToRegister: release.gate-passed`
- `validation: release.docs-updated passed for scratch replay release-gate`
- `filesChanged: none`

`record-result` returned `status: result-ready` with:

- evidence gate: `passed`
- clean worktree gate: `clean`

`tick --goal v43-plus-release-phase-replay --allow-closeout` then registered:

- event id: `evt_1fac4eff4d4be733`
- event type: `release.gate-passed`
- phase: `release-gate`
- gate: `release.docs-updated`

After that registration, `pnpm --silent symphony goal next --goal v43-plus-release-phase-replay --json` moved to:

- role: `release-manager`
- phase: `release-prep`
- reason: `All runbook tasks are main-verified and release gates are passed, but release.ready-declared is missing.`

### release-prep

A second adopted release-manager thread was bound as:

- thread id: `replay-release-prep`
- task id: `release`
- role: `release-manager`
- phase: `release-prep`
- worktree: `/tmp/v43-plus-release-phase-replay-worktree`

The result block used:

- `eventToRegister: release.ready-declared`
- `validation: closeout is waiting only for release.ready-declared in scratch replay`
- `filesChanged: none`

`record-result` again returned `status: result-ready` with:

- evidence gate: `passed`
- clean worktree gate: `clean`

The following `tick` registered:

- event id: `evt_18cab7eb4ceee2d3`
- event type: `release.ready-declared`
- phase: `release-prep`
- gate: `release.ready`

After that registration, `pnpm --silent symphony goal next --goal v43-plus-release-phase-replay --json` returned:

- status: `complete`
- reason: `release.ready-declared is recorded and all runbook release gates have passed.`

## Live Replay B: Completion Guard With A Live Lease

To test the guard independently from the successful consume path, the runner state was reinitialized after the scratch goal had already reached `goal next = complete`.

A fresh manual adopted thread was then bound as:

- thread id: `replay-guard-active`
- task id: `release`
- role: `release-manager`
- phase: `release-prep`
- status in runner state: `thread-active`

With the ledger already complete and the active lease still live, `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs plan --goal v43-plus-release-phase-replay --allow-closeout` returned:

- status: `blocked`
- current: `release / release-manager / release-prep`
- action kind: `recovery-required`
- reason: `Goal next reported complete while the supervisor still has an active or unreconciled lease. Reconcile the child result and clear the lease before accepting goal completion.`

This confirms the new completion guard does not accept `goal next = complete` while the supervisor still has a live release-prep lease.

## Live Replay C: Goal Already Complete With A Valid Result Escrow

To prove the runner can reconcile the same stale active lease when a valid bounded result already exists, a second scratch goal was created:

- goal id: `v43-plus-completion-reconcile-replay`
- temporary managed runbook: `.symphony/goals/runbooks/v43-plus-completion-reconcile-replay.json`
- temporary goal event log: `.symphony/goals/events/v43-plus-completion-reconcile-replay.ndjson`
- temporary detached worktree: `/tmp/v43-plus-completion-reconcile-worktree`

That scratch goal was advanced through:

- `worker.evidence-recorded`
- `reviewer.approved`
- `main.verification-passed`
- `release.gate-passed` for `release.docs-updated`
- `release.ready-declared`

After those events, `pnpm --silent symphony goal next --goal v43-plus-completion-reconcile-replay --json` returned:

- status: `complete`
- reason: `release.ready-declared is recorded and all runbook release gates have passed.`

The runner state was then initialized and a manual adopted release-manager thread was bound as:

- thread id: `replay-complete-active`
- task id: `release`
- role: `release-manager`
- phase: `release-prep`
- worktree: `/tmp/v43-plus-completion-reconcile-worktree`
- branch label: `detached-v43-plus-completion-reconcile`

A valid escrow result file was written at:

- `/Users/andy/.codex/local-goal-supervisor/results/v43-plus-completion-reconcile-replay/replay-complete-active.txt`

The result block used:

- `eventToRegister: release.ready-declared`
- `validation: release ready already declared in scratch replay; retire the active lease using the bounded result`
- `filesChanged: none`

`node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs plan --goal v43-plus-completion-reconcile-replay --allow-closeout` then returned:

- status: `action-required`
- action kind: `complete-active-thread`
- pending result source: `result-escrow-file`
- reason: `Goal next is complete, and the active lease already has a valid result. Retire the lease instead of treating the stale active pointer as a hard block.`

`tick --goal v43-plus-completion-reconcile-replay --allow-closeout` then returned:

- status: `completed-active-thread-after-goal-complete`
- thread id: `replay-complete-active`

`status --goal v43-plus-completion-reconcile-replay` then showed:

- `active: null`
- thread `replay-complete-active`: `completed`

This confirms the runner now prefers bounded result consumption and lease retirement over an operator-only conflict when the ledger is already complete and the active release-prep lease still has a valid result escrow file.

## What This Replay Validated

- `release-manager` result blocks are now phase-aware in live execution:
  - `release-gate` accepted `release.gate-passed`
  - `release-prep` accepted `release.ready-declared`
- The external runner successfully consumed both result blocks and registered the expected goal events itself.
- A clean detached worktree and an existing tracked evidence ref are enough for release-manager replay; the normal root checkout does not need to be clean for this isolated test.
- Completion is blocked when the goal ledger says `complete` but supervisor state still carries a live lease and no valid result is available.
- If the goal ledger already says `complete` and the active release-prep lease has a valid escrow result, the runner can retire that lease deterministically without treating the state as an operator-only conflict.

## Limits

- This replay did not prove that a child thread can never append `release.ready-declared` through some other external path. It proved that the runner now rejects a silent finish and can reconcile deterministically when a valid bounded result exists.
- This replay used manual adopted threads and local result files. It did not require Codex App follow-up messaging.

## Cleanup

The temporary runbooks, temporary goal event logs, temporary external runner state, temporary result escrow files, and temporary detached worktrees were removed after the replays.
