# Local goal supervisor v43+ task-C main verification evidence

Task: progress and stall classifier
Recorded at: `2026-06-08 02:37:03 CST`
UTC timestamp: `2026-06-07T18:37:03Z`

## Verification Target

- Goal: `v43-plus-local-goal-supervisor-stability`
- Task: `task-2`
- Branch: `v43-plus-task-c-progress-stall-classifier`
- Worktree: `/Users/andy/.codex/worktrees/v43-plus-task-c-progress-stall-classifier`
- Worker evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-c-worker-evidence-2026-06-08.md`
- Reviewer evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-c-review-evidence-2026-06-08.md`
- Worker result escrow: `/Users/andy/.codex/local-goal-supervisor/results/v43-plus-local-goal-supervisor-stability/019ea354-3091-7ec3-80a4-952b30e5bb07.txt`
- Reviewer result escrow: `/Users/andy/.codex/local-goal-supervisor/results/v43-plus-local-goal-supervisor-stability/019ea35a-7cda-79d0-b230-48c4a5cf93b1.txt`
- External runner: `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`
- Runner digest verified: `sha256 445616d7a0d217467002adc52d5bc5b11b30f21b49a1dea7bef6dcf507dabb98`

## Acceptance Check

Task-C passes main verification.

The assigned worktree contains the worker and reviewer evidence for task 2, and the reviewer result approves the same branch, worktree, worker evidence, and worker result escrow required by the lease.

The external runner still consumes a valid result escrow before reading the app-server thread. When no result block is available, active in-progress turns now return an `activeProgress` snapshot. The snapshot includes current task/role/phase, readable thread status, turn status and timestamps, observed progress age, result escrow path/existence/mtime/mtimeMs/size, assigned worktree git health, and the latest same-task goal event when available.

Recent in-progress turns remain in `waiting-active-child` with `nextAction.kind: wait-active-thread`. Stale in-progress turns return `waiting-active-child-stalled` with `nextAction.kind: operator-thread-progress-recovery`, keeping the active lease in place instead of redispatching. `notLoaded` handling uses the same progress snapshot and separates recent wait from stale recovery. Duplicate active phase and duplicate thread binding checks remain covered by selftest.

## Commands Run

Commands ran from `/Users/andy/.codex/worktrees/v43-plus-task-c-progress-stall-classifier` unless noted.

- `git status --short --branch` passed clean at start.
- `git rev-parse HEAD` passed with `0b57d6d3d53cd152f28b083c79447c613e627aa8`.
- `sed -n '1,240p' fixtures/contracts/goal-runbook.v43-plus-local-goal-supervisor-stability.v1.json` passed.
- `sed -n '1,260p' docs/plans/app-core-v43-plus-goal-runbooks/v43_plus_local-goal-supervisor-stability_goal_runbook_latest.md` passed.
- `sed -n '1,220p' docs/plans/controller/local-goal-supervisor-v43-plus-task-c-worker-evidence-2026-06-08.md` passed.
- `sed -n '1,220p' docs/plans/controller/local-goal-supervisor-v43-plus-task-c-review-evidence-2026-06-08.md` passed.
- `sed -n '1,220p' /Users/andy/.codex/local-goal-supervisor/results/v43-plus-local-goal-supervisor-stability/019ea354-3091-7ec3-80a4-952b30e5bb07.txt` passed and matched the task-2 worker target.
- `sed -n '1,220p' /Users/andy/.codex/local-goal-supervisor/results/v43-plus-local-goal-supervisor-stability/019ea35a-7cda-79d0-b230-48c4a5cf93b1.txt` passed and matched the task-2 reviewer target.
- `shasum -a 256 /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed with `445616d7a0d217467002adc52d5bc5b11b30f21b49a1dea7bef6dcf507dabb98`.
- `rg -n "activeProgress|waiting-active-child-stalled|operator-thread-progress-recovery|notLoaded|recent-progress|stalled" /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `sed -n '1410,1505p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed and confirmed escrow-first active thread consumption plus stalled active child routing.
- `sed -n '1825,1875p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed and confirmed `notLoaded` wait/stale classification.
- `sed -n '2968,3108p' /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed and confirmed the `activeProgress` fields.
- `git diff --stat f30bde38d8689c006b66502eee786372ff0612ea..HEAD` passed and showed only task-C worker and review evidence files before this evidence file was added.
- `git diff --check f30bde38d8689c006b66502eee786372ff0612ea..HEAD` passed.
- `node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest` passed.
- `pnpm --silent symphony goal-status --goal v43-plus-local-goal-supervisor-stability --json` failed with exit code `64` and `goal not found` from the assigned worktree. This matches the reviewer evidence and the known worktree-local ledger limitation.
- `pnpm check` passed.
- `pnpm test` passed with 1113 tests across 173 suites.
- `pnpm workbench:build` passed.
- `git status --short --branch` passed clean after validation, before adding this evidence file.

## Boundary Check

This main verification did not run mutation, audit, doctor, real CLI runner, provider CLI, tag, push, publish, or release closeout commands. It did not create, dispatch, steer, or wait on another Codex thread.

## Verdict

Passed for `main.verification-passed`.

The controller can register main verification for task 2 using evidence ref `docs/plans/controller/local-goal-supervisor-v43-plus-task-c-main-verification-evidence-2026-06-08.md`.
