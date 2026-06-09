# Local goal supervisor v43+ task-C worker evidence

Task: progress and stall classifier
Recorded at: `2026-06-08 02:29:18 CST`
UTC timestamp: `2026-06-07T18:29:18Z`

## Scope

This worker phase changed the temporary external runner:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

The repository change in this branch records this evidence file. The supervisor runner remains project-external.

## Runner snapshot

- Script digest after the change: `sha256 445616d7a0d217467002adc52d5bc5b11b30f21b49a1dea7bef6dcf507dabb98`
- Branch used for evidence: `v43-plus-task-c-progress-stall-classifier`
- Base commit from lease: `f30bde38d8689c006b66502eee786372ff0612ea`

## Behavior changed

Active child wait results now include an `activeProgress` record. The record includes:

- readable current turn status and turn timestamps when the app-server response provides them.
- observed progress time and age against the existing two-minute grace window.
- result escrow path, existence, mtime, mtimeMs, and size.
- assigned worktree git state from the child workspace.
- latest relevant goal event from the root goal event ledger.

Recent in-progress turns continue to return `waiting-active-child`.

If the latest observable progress time is older than the grace window, the runner now returns `waiting-active-child-stalled` with `nextAction.kind` set to `operator-thread-progress-recovery`. This keeps the active lease in place and avoids duplicate dispatch.

`notLoaded` handling keeps the existing escrow-first order. A valid result escrow file is still consumed before the app-server read path can report a lossy `notLoaded` state. `notLoaded` wait and stale results also include the same `activeProgress` record, with stale cases classified as `stalled`.

Duplicate active dispatch remains guarded by the existing duplicate binding and active conflict checks. The selftest still covers duplicate thread binding rejection and duplicate active phase detection.

## Validation

Command:

```text
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Result: passed.

Command:

```text
git diff --check
```

Result: passed.

Command:

```text
pnpm check
```

Result: passed.

Command:

```text
pnpm test
```

Result: passed. The run reported 1113 passing tests across 173 suites.

Command:

```text
pnpm workbench:build
```

Result: passed.

Command:

```text
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
```

Result: passed.

Selftest coverage added:

- recent active turn progress returns `recent-progress`.
- stale active turn progress returns `stalled`.
- result escrow metadata includes mtime.
- assigned worktree state is included.
- latest current-task goal event is selected.
- duplicate thread binding and duplicate active phase checks remain covered.

## Boundary notes

- This task did not run mutation, audit, doctor, provider CLI, real CLI runner, tag, push, publish, or release closeout commands.
- This task did not create new Codex threads or subagents.
- This task did not change active provider policy.
- This task did not move the external runner into the repository.
