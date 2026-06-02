# v33 task-4 main verification evidence

Date: 2026-06-02

Goal id: `v33-app-runtime-foundation`
Task id: `task-4`
Release name: `v33 App Runtime Foundation`
Baseline: `v32 Release Manager Workspace v2`
Worker event id: `goal-event-log.v1:evt_89e105c5b5bfb44e`
Review approval event id: `goal-event-log.v1:evt_41c34136f4d2fa48`
Worker thread id: `019e8637-508a-71c1-a752-7ed9a8de321c`
Reviewer thread id: `019e8643-c3fd-73e1-9721-82ee1289056a`
Verifier thread id: `019e8648-3fb3-7a03-99b4-a3be33255010`

## Precondition evidence

- `git status -sb --untracked-files=all` exited 0. Current branch was `v33-task-1-local-sidecar-health-api`, not clean `main`. The worktree had mixed staged, modified, deleted, and untracked v33 files, including task-2, task-3, and task-4 evidence/code/fixture/test files.
- `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` exited 0. The ledger returned `goal-progress-ledger.v1`; task-4 status was `approved`, status source `goal-event-log.v1:evt_41c34136f4d2fa48`, worker evidence `docs/plans/v33-task-4-worker-evidence-2026-06-02.md`, review evidence `docs/plans/v33-task-4-review-evidence-2026-06-02.md`, review verdict `APPROVED`, and main verification ref `null`.
- `pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json` exited 0. It returned task-4 role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-4 but main verification is missing.`
- `.symphony/goals/events/v33-app-runtime-foundation.ndjson` contains worker event `evt_89e105c5b5bfb44e` for task-4 `worker.evidence-recorded` and reviewer event `evt_41c34136f4d2fa48` for task-4 `reviewer.approved`.
- `docs/plans/v33-task-4-review-evidence-2026-06-02.md` ends with verdict `APPROVED`.

## Ideal path and fallback

The ideal clean-main path was skipped. A safe `git checkout main`, `git pull --ff-only`, and `git merge --ff-only v33-task-4-runtime-contract-workbench-surface` was not appropriate because the checkout was dirty and mixed with prior v33 task files on `v33-task-1-local-sidecar-health-api`.

Fallback used: current-checkout verification from explicit evidence and current files. This verifier inspected the event log, goal ledger, goal next output, worker evidence, review evidence, task-4 runbook scope, runtime snapshot implementation, Workbench route contract/projection code, fixtures, task tests, Workbench shell/API tests, live API probes, and full validation command results. This supersedes the missing ideal merge evidence for this verification pass, but it does not create a clean-main merge or register a main-verification gate.

## Implementation evidence basis

- `src/symphony/app-state-snapshot.js` builds and validates `app-state-snapshot.v1`; sets `readOnly: true`; exposes freshness, current project, runtime health, active goal, current task, next action, review status, main verification status, release status, evidence refs, known blockers, source data, and boundary flags.
- Snapshot boundary flags require no snapshot writes, no action execution, no job queue, no model invocation, no git write, no release write, no arbitrary command execution, and no confirm command.
- `src/symphony/console.js` serves `GET /api/runtime/snapshot`, accepts only `repoPath` and `goal` query fields, and rejects unsupported query fields.
- `scripts/symphony.js` exposes `symphony runtime snapshot --json` from the same snapshot builder.
- `frontend/workbench/src/api/contracts.js` includes read-only route id `runtimeSnapshot` as `GET /api/runtime/snapshot` with contract `app-state-snapshot.v1`, and projects healthy, empty, blocked, and stale states from backend fields.
- `frontend/workbench/src/api/client.js` fetches read-only routes with `method: GET`, `cache: no-store`, and no request body.
- `frontend/workbench/src/App.jsx` renders `RuntimeSnapshotPanel` before the active goal workflow. It displays contract/freshness, runtime health, current project, active goal/current task, next action, release state, known blockers, and boundary flags.
- Fixtures exist for `app-state-snapshot.v1`, healthy, missing project, missing goal, blocked, and stale states.

## Validation results

- `pnpm test tests/v33-app-state-snapshot.test.js` exited 0. Result: 7 tests passed, 0 failed.
- `pnpm test tests/workbench-api-client.test.js` exited 0. Result: 45 tests passed, 0 failed.
- `pnpm test tests/workbench-shell.test.js` exited 0. Result: 25 tests passed, 0 failed.
- `pnpm --silent symphony runtime snapshot --json` exited 0. Result: `app-state-snapshot.v1`, `readOnly: true`, `freshness.status: current`, current project resolved to `/Users/andy/Documents/project/multi-coding-agent-symphony`, active goal `v33-app-runtime-foundation`, current task `task-4`, task status `approved`, next action `main-verifier/main-verification`, release ready `false`, known blocker `release-ready-not-declared`, and all execution/write boundary flags false.
- API probe used temporary `pnpm symphony console --host 127.0.0.1 --port 9876`, then stopped it with Ctrl-C after probing.
- `curl -sS -i http://127.0.0.1:9876/api/runtime/snapshot` exited 0. Result: HTTP 200 with `contractName: app-state-snapshot.v1`, `readOnly: true`, `freshness.status: current`.
- `curl -sS -i -X POST http://127.0.0.1:9876/api/runtime/snapshot` exited 0. Result: HTTP 405 with `contractName: error-envelope.v1`, error code `method-not-allowed`.
- `curl -sS -i 'http://127.0.0.1:9876/api/runtime/snapshot?path=package.json'` exited 0. Result: HTTP 400 with `contractName: error-envelope.v1`, error code `invalid-runtime-snapshot-request`.
- `pnpm check` exited 0.
- `pnpm test` exited 0. Result: 776 tests passed, 0 failed, 119 suites passed.
- `pnpm workbench:build` exited 0. Vite built `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-CkJzWTCM.js`.
- `git diff --check` exited 0 with no output.
- Final `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` exited 0. Result: total tasks 5, completed tasks 4, blocked tasks 0, needs review 0, needs revision 0, releaseReady false; task-4 remained `approved` with reviewer verdict `APPROVED` and mainVerificationRef `null`.

## Acceptance assessment

Task-4 satisfies the v33 scope:

- Shared CLI/Workbench app state schema is `app-state-snapshot.v1`.
- Fixtures cover healthy, missing project, missing goal, blocked, and stale states.
- Workbench consumes `GET /api/runtime/snapshot` and renders runtime health, current project, active goal/current task, next action, release state, known blockers, freshness, and read-only boundaries.
- Loading/empty/blocked/healthy/stale behavior is covered through Workbench projection tests and fixtures.
- Runtime snapshot state comes from current project resolver, runtime health, goal-status ledger, goal next, event/gate/release state, and backend freshness fields.

## Boundary assessment

No task-4 path was found that adds shell runner, execution button, model invocation, Action Registry execution, Job Queue execution, git or release writes, local file open/download, artifact download, merge, push, tag, publish, self-approval, generic command DSL, new permission system, new goal framework, or new artifact framework.

The broader Workbench still contains pre-existing controlled dry-run/confirm surfaces from earlier releases. Those are outside task-4 and were not added by the Runtime Snapshot panel. The task-4 runtime surface itself is read-only and data-rendering only.

State is not inferred from branch names, filenames, commits, task titles, prompt text, or frontend-only state. Frontend display state is projected from backend contract fields such as `freshness.status`, project resolver status, active goal presence, runtime health status, and next action blocked status.

The v32 workflow kernel is preserved. The documented command spine remains `goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest`, and task-4 does not replace it.

## Events not registered by this verifier

This verifier did not run `symphony goal gate`, `symphony goal update`, `symphony goal review`, `symphony goal closeout`, `release.ready`, tag, push, publish, stage, commit, merge, pull, stash, reset, revert, or branch-switch commands.

## Final result

MAIN_VERIFICATION_PASSED
