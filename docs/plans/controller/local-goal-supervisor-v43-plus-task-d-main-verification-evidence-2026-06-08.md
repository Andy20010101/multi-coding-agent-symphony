# Local goal supervisor v43+ task-D main verification evidence

Task: evidence date, runner snapshot, and worktree cleanup runbook
Recorded at: `2026-06-08 02:52:35 CST`
UTC timestamp: `2026-06-07T18:52:35Z`

## Verification Target

- Goal: `v43-plus-local-goal-supervisor-stability`
- Task: `task-3`
- Branch: `v43-plus-task-d-evidence-worktree-runbook`
- Worktree: `/Users/andy/.codex/worktrees/v43-plus-task-d-evidence-worktree-runbook`
- Base commit: `6aed9dad46c7ed72b255d9b0f9c5fa7951f70b43`
- Reviewed head before this evidence file: `b044eaaa8250136d315af942782be9c6b6c84136`
- Worker evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-d-worker-evidence-2026-06-08.md`
- Reviewer evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-d-review-evidence-2026-06-08.md`
- External runner: `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`
- Runner digest verified: `sha256 13e623b4a20f26a67dd2370bf3c6d9d392d9383edf37659f16e0b2c3e0d32522`

## Acceptance Check

Task-D passes main verification.

The assigned worktree contains the worker evidence and reviewer evidence for task 3. The review evidence approves the same branch, worktree, worker evidence, and external runner digest used for this verification.

The task-D runbook documents the evidence clock fields, runner snapshot command, doctor-output citation rule, and non-destructive worktree cleanup plan. The runbook entry is linked from `docs/plans/controller/README.md`.

The external runner snapshot reports local run date `2026-06-08`, timezone `Asia/Shanghai`, UTC generated timestamp, runner script path, SHA-256 digest, selftest status, daemon launcher command and status, doctor command, doctor status, and the fixes supplied through `--fixes`. The snapshot does not run doctor unless an operator-authorized `--doctor-output` file is supplied.

The cleanup plan reports goal, task, branch, head, dirty state, merge state, evidence state, cleanup decision, and refusal reasons. In the verifier run, task-1, task-2, and task-3 were all preserved. Task-3 was clean but unmerged, had evidence not present on `main`, and had `removalAllowed: false`.

## Commands Run

Commands ran from `/Users/andy/.codex/worktrees/v43-plus-task-d-evidence-worktree-runbook` unless noted.

- `git status --short --branch` passed clean at start.
- `git rev-parse HEAD` passed with `b044eaaa8250136d315af942782be9c6b6c84136` before this evidence file was added.
- `sed -n '1,260p' docs/plans/app-core-v43-plus-goal-runbooks/v43_plus_local-goal-supervisor-stability_goal_runbook_latest.md` passed and confirmed task-D acceptance and the expected main verification evidence ref.
- `sed -n '1,220p' docs/plans/controller/local-goal-supervisor-v43-plus-task-d-worker-evidence-2026-06-08.md` passed.
- `sed -n '1,220p' docs/plans/controller/local-goal-supervisor-v43-plus-task-d-review-evidence-2026-06-08.md` passed.
- `sed -n '1,260p' docs/plans/controller/local-goal-supervisor-v43-plus-task-d-runner-snapshot-cleanup-runbook.md` passed.
- `git diff --stat 6aed9dad46c7ed72b255d9b0f9c5fa7951f70b43..HEAD` passed and showed README, worker evidence, review evidence, and task-D runbook changes before this evidence file was added.
- `git diff --name-status 6aed9dad46c7ed72b255d9b0f9c5fa7951f70b43..HEAD` passed and confirmed the same repo file scope.
- `rg -n "task-D|runner-snapshot|worktree-cleanup-plan|evidence clock|local run date|UTC generated timestamp|doctor-output|script digest|removalAllowed|evidence-not-merged" /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs docs/plans/app-core-v43-plus-goal-runbooks/v43_plus_local-goal-supervisor-stability_goal_runbook_latest.md docs/plans/controller/README.md` passed.
- `shasum -a 256 /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed with `13e623b4a20f26a67dd2370bf3c6d9d392d9383edf37659f16e0b2c3e0d32522`.
- `node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` passed.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest` passed.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs runner-snapshot --goal v43-plus-local-goal-supervisor-stability --fixes "main verifier task-D snapshot check" --skip-selftest` passed and returned the expected evidence clock, digest, launcher, and doctor citation fields.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs worktree-cleanup-plan --goal v43-plus-local-goal-supervisor-stability --repo /Users/andy/Documents/project/multi-coding-agent-symphony --base-ref main` passed and preserved dirty, detached, unmerged, or evidence-incomplete worktrees.
- `node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs worktree-cleanup-plan --goal v43-plus-local-goal-supervisor-stability --repo /Users/andy/Documents/project/multi-coding-agent-symphony --base-ref main | node -e "...task summary filter..."` passed and showed task-1, task-2, and task-3 with `removalAllowed false`.
- `git diff --check 6aed9dad46c7ed72b255d9b0f9c5fa7951f70b43..HEAD` passed.
- `pnpm --silent check` passed.
- `pnpm --silent test` passed with 1113 tests across 173 suites.
- `pnpm --silent workbench:build` passed.

## Boundary Check

This main verification did not run mutation, audit, doctor, real CLI runner, provider CLI, tag, push, publish, or release closeout commands. It did not create, dispatch, steer, or wait on another Codex thread.

## Verdict

Passed for `main.verification-passed`.

The controller can register main verification for task 3 using evidence ref `docs/plans/controller/local-goal-supervisor-v43-plus-task-d-main-verification-evidence-2026-06-08.md`.
