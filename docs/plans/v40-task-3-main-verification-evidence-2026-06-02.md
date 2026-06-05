# v40 task-3 main verification evidence

Goal id: `v40-personal-workflow-router-app-core-release`
Task id: `task-3`
Branch verified: `v40-task-3-goal-runbook-draft-handoff`
Worktree verified: `/Users/andy/.codex/worktrees/v40-task-3-goal-runbook-draft-handoff`
Worker evidence reviewed: `docs/plans/v40-task-3-worker-evidence-2026-06-02.md`
Review evidence reviewed: `docs/plans/v40-task-3-review-evidence-2026-06-02.md`

## Verification target

Main verification used the worker/reviewer worktree assigned by the supervisor lease. The implementation is present as uncommitted task changes on `v40-task-3-goal-runbook-draft-handoff`; `HEAD` remains `32b9285719dc517bd4a84c9cf0e4328fabc53cc8`.

No checkout to `main`, ff-only merge, push, tag, release closeout, provider CLI, real CLI, audit, doctor, or goal gate registration was run in this leased phase.

## Result

Passed for the assigned task-3 implementation worktree.

The reviewer evidence verdict is `APPROVED`. The implementation adds a read-only `goal-draft-handoff.v1` contract and Workbench panel that turns a registered source runbook task into a draft-only goal/runbook handoff. The route accepts only `goal` and `task`, rejects unsupported fields, does not write files, does not register a goal, does not run `goal init`, and does not add shell/model/path/merge/push/tag/publish/self-approval controls.

## Commands run

- `git status --short --branch`
  - Result: assigned worktree on `v40-task-3-goal-runbook-draft-handoff` with task-3 implementation, worker evidence, reviewer evidence, and this main verification evidence uncommitted.
- `git diff --check`
  - Result: passed.
- `pnpm check`
  - Result: passed.
- `pnpm test`
  - Result: passed, 1045 tests, 0 failures.
- `pnpm workbench:build`
  - Result: passed. Vite built `src/symphony/workbench-static/index.html`, `assets/index-CILC3208.css`, and `assets/index-CkPiHK4N.js`.
- `pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json`
  - Result: failed with exit code 64: `goal not found`.

## Validation notes

- Task-specific registered-runbook behavior is covered by `tests/v40-goal-draft-handoff.test.js`, which initializes the v40 runbook in a temporary state directory before building and serving the handoff.
- The checkout does not have a registered `.symphony` goal for `v40-personal-workflow-router-app-core-release`, so the required goal-status command still fails in this local state. This matches the worker evidence and is recorded as a ledger-state limitation, not a product code failure for the read-only draft route.
- The static Workbench build output is aligned with the changed source bundle.

## Boundary notes

- Main verification did not register `main.verification-passed`.
- No release-ready gate was registered.
- No tag, push, publish, provider CLI, real CLI, audit, doctor, or mutation command outside the runbook-required validation/build path was run.
