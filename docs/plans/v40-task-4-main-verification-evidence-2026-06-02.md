# v40 task-4 main verification evidence

Goal id: `v40-personal-workflow-router-app-core-release`
Task id: `task-4`
Branch: `v40-task-4-app-core-release-manager`
Main verifier thread: `019e97c3-0476-71b1-a141-2f8333013e76`
Verification target: `/Users/andy/.codex/worktrees/v40-task-4-app-core-release-manager`
Worker evidence: `docs/plans/v40-task-4-worker-evidence-2026-06-02.md`
Review evidence: `docs/plans/v40-task-4-review-evidence-2026-06-02.md`
Base commit: `32b9285719dc517bd4a84c9cf0e4328fabc53cc8`
Head commit: `32b9285719dc517bd4a84c9cf0e4328fabc53cc8`

## Verdict

PASSED.

## Scope Verified

The task-4 implementation adds `app-core-release-manager.v1`, exposes `GET /api/release/app-core-manager`, projects the contract into the Workbench read-only route model, and renders a display-only App Core Release Manager panel.

The verifier used the leased worker worktree as the verification target. No merge, tag, push, publish, provider CLI, release closeout, release-ready gate registration, mutation test, audit, or doctor command was run.

## Commands Run

`git status --short --branch`

Result: passed, exit code 0. The assigned worktree was on `v40-task-4-app-core-release-manager` with the worker implementation and worker/reviewer evidence files present as local changes.

`git rev-parse HEAD && git branch --show-current`

Result: passed, exit code 0.

```text
32b9285719dc517bd4a84c9cf0e4328fabc53cc8
v40-task-4-app-core-release-manager
```

`sed -n '637,820p' docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md`

Result: passed, exit code 0. Confirmed task-4 scope, acceptance, reviewer precondition, and main verification evidence expectation.

`sed -n '1,240p' docs/plans/v40-task-4-worker-evidence-2026-06-02.md`

Result: passed, exit code 0. Worker evidence was present in the verification target and matched the App core release manager scope.

`sed -n '1,240p' docs/plans/v40-task-4-review-evidence-2026-06-02.md`

Result: passed, exit code 0. Reviewer verdict was `APPROVED`.

`git diff --stat && git diff --name-status`

Result: passed, exit code 0. The tracked diff was scoped to Workbench UI/API projection, console route wiring, generated Workbench static output, and tests. Untracked task files were the worker evidence, review evidence, `src/symphony/app-core-release-manager.js`, `tests/v40-app-core-release-manager.test.js`, and the new generated Workbench JS asset.

`pnpm check`

Result: passed, exit code 0.

```text
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: passed, exit code 0.

```text
tests 1045
suites 164
pass 1045
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 6233.498625
```

`pnpm workbench:build`

Result: passed, exit code 0.

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                     0.42 kB
src/symphony/workbench-static/assets/index-CILC3208.css     36.97 kB
src/symphony/workbench-static/assets/index-BJrI99LV.js   1,312.27 kB
built in 69ms
```

`git diff --check`

Result: passed, exit code 0. No whitespace errors.

`pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json`

Result in the assigned worker worktree: failed, exit code 64.

```text
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

Context: the isolated worker worktree does not contain the ignored managed `.symphony` goal state. This matches the worker evidence limitation.

`pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --state-dir /Users/andy/Documents/project/multi-coding-agent-symphony/.symphony --json`

Result: passed, exit code 0. The authoritative managed state reported `totalTasks: 5`, `completedTasks: 4`, `releaseReady: false`, task-4 `status: approved`, task-4 `reviewVerdict: APPROVED`, task-4 worker and review evidence refs present, and task-4 `mainVerificationRef: null` before this verifier result is registered.

## Boundary Check

- The route accepts only `goal` and `task` query parameters and rejects unsafe refs.
- The release manager sources status from backend contracts, goal closeout, goal ledger, and goal event log state when available.
- The Workbench panel consumes projected backend contract fields and remains display-only.
- The implementation does not add shell execution, model invocation, arbitrary local file reads, git writes, merge, push, tag, publish, self-approval, release closeout execution, release-ready declaration, or frontend status inference.

## Residual Notes

The leased target is a worker worktree with local changes, not a clean main merge checkout. The supervisor lease explicitly assigned this worktree as the main-verification target. The root managed goal ledger still needs the main-verification event registration after this evidence is consumed.
