# v21 task-3 main verification evidence

Date: 2026-05-31  
Goal id: `v21-goal-event-registration-workbench`  
Task id: `task-3`  
Task title: Confirm event append flow  
Branch checked: `v21-task-3-confirm-event-append-flow`  
Verifier role: main-verifier

## Gate recommendation

`passed`

The current integrated task working tree satisfies task-3 acceptance. Do not treat this file as a registered gate event; this verifier did not run `symphony goal gate --confirm`, did not approve as reviewer, and did not declare release ready.

## Reviewer approval check

`docs/plans/v21-task-3-review-evidence-2026-05-29.md` now contains explicit reviewer approval:

- Verdict: `approved`
- The file states that this approval supersedes the earlier `needs-revision` verdict.
- The superseded blocking issue was the missing refresh callback wiring after confirm success.
- The revised review evidence says no blocking findings remain.

This satisfies the prerequisite for main verification. The review evidence file was already modified in the working tree before this main-verifier evidence was written; I did not revert it.

## Scope checked

- Runbook: `docs/plans/workbench-v20-v28-goal-runbooks/v21_workbench-goal-event-registration_goal_runbook_latest.md`
- Fixture: `fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json`
- Worker evidence: `docs/plans/v21-task-3-worker-evidence-2026-05-29.md`
- Review evidence: `docs/plans/v21-task-3-review-evidence-2026-05-29.md`
- Backend confirm route: `src/symphony/console.js`
- Existing confirm implementations called by the route: `src/symphony/goal-update.js`, `src/symphony/goal-review.js`, `src/symphony/goal-gate.js`
- Frontend confirm flow: `frontend/workbench/src/App.jsx`
- Frontend API wrapper: `frontend/workbench/src/api/client.js`
- Task-focused tests:
  - `tests/v21-goal-plan-preview-api.test.js`
  - `tests/workbench-api-client.test.js`
  - `tests/workbench-route-smoke.test.js`
  - `tests/workbench-shell.test.js`

Current commit checked:

```text
git branch --show-current
v21-task-3-confirm-event-append-flow

git rev-parse --short HEAD
22d653b

git rev-parse --short main
d12f428
```

Merge mode: no merge command was run in this gate pre-check. The current task branch contains local `main` as an ancestor, but local `main` is not advanced to `HEAD`.

## Acceptance verification

- Confirm uses the dry-run `planHash`: `frontend/workbench/src/App.jsx` builds the confirm body from `previewState.values` and `previewState.plan.planHash`; `src/symphony/console.js` forwards that hash into `confirmGoalUpdate`, `confirmGoalReview`, or `confirmGoalGate`.
- Confirm is limited to matching update/review/gate paths: backend `command` accepts only `update`, `review`, or `gate`; unsupported commands return `unsupported-goal-confirm-command`.
- Mismatches and unsupported inputs are rejected before append: tests cover mismatched plan hashes, unknown body fields such as `path`, unsupported commands, and unsafe goal refs without changing the state directory snapshot.
- Confirm refreshes state: backend returns refreshed `goal-progress-ledger.v1`, `goal-event-log.v1`, and `goal-next-action.v1`; frontend success calls `refreshWorkbenchContracts()` through `NextActionCard`.
- The reviewer revision blocker is fixed: `NextActionCard` receives `onGoalEventConfirmed={refreshWorkbenchContracts}` and passes it into `GoalEventFormModelView`; `ActiveGoalViewModelPanel` no longer owns that callback.

## Boundary notes

- Workbench remains centered on latest goal/runbook/next-action surfaces.
- I did not find a v8 top-level `scan/do/review/verify/status/continue/artifacts` action list in the changed Workbench surface.
- I did not find a generic shell runner, permission system, safety framework, goal framework, or artifact framework added by this task.
- Backend `POST` remains limited to the controlled event-plan confirm route; other POST API requests return method-not-allowed.
- The reviewed frontend does not infer approval, main verification, or release readiness from branch names, file names, commit messages, command text, or UI heuristics.
- Worker self-approval remains blocked by the existing goal review flow; this task does not add a self-approval path.
- Release ready remains false in `goal-status`.

## Commands run

`node --test tests/v21-goal-plan-preview-api.test.js tests/workbench-api-client.test.js tests/workbench-route-smoke.test.js tests/workbench-shell.test.js`

Result: exit code `0`.

```text
tests 43
suites 5
pass 43
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 227.25325
```

Relevant passing cases included:

- `confirms a matching update plan hash, appends one event, and returns refreshed goal state`
- `rejects mismatched plan hashes, unsupported confirm commands, unknown fields, and unsafe goal refs without appending`
- `posts controlled goal event confirm requests with a JSON body and validates the confirmation contract`
- `statically keeps the Workbench source free of execution, write, download, local-open, and model entry points`
- `wires successful goal event confirms to refresh Workbench contracts through the next action card`

`pnpm check`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

tests 678
suites 110
pass 678
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3599.296542
```

`pnpm workbench:build`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:26661) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:26661) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:26661) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-CMCXVqRN.css   10.83 kB │ gzip:   2.50 kB
src/symphony/workbench-static/assets/index-Di8mm98M.js   678.69 kB │ gzip: 126.36 kB

✓ built in 141ms
```

`git diff --check`

Result: exit code `0`. No output.

`pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Result: exit code `0`.

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 3
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1.status: main-verified
task-2.status: main-verified
task-3.status: approved
task-3.statusSource: goal-event-log.v1:evt_80ebc3e83f39eff9
task-3.workerEvidenceRef: docs/plans/v21-task-3-worker-evidence-2026-05-29.md
task-3.reviewEvidenceRef: docs/plans/v21-task-3-review-evidence-2026-05-29.md
task-3.reviewVerdict: APPROVED
task-3.mainVerificationRef: null
task-4.status: planned
task-5.status: planned
nextActions[0].label: Start task-4
```

`git status --short` before writing this evidence file

Result: exit code `0`.

```text
 M docs/plans/v21-task-3-review-evidence-2026-05-29.md
```

## Gaps and non-actions

- No main-verification gate event was registered.
- No release-ready event was registered.
- No reviewer approval was performed by this verifier.
- The only file intentionally written by this verifier is this main verification evidence file.
