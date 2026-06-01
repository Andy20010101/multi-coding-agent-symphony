# v30 task-4 worker evidence

Date: 2026-06-01  
Goal id: `v30-verified-adoption-workspace-v2`  
Task id: `task-4`  
Task title: `Confirm adoption and post-apply next action`  
Expected branch: `v30-task-4-confirm-adoption-and-post-apply-next-action`  
Checkout used: `v30-task-3-adoption-inspect-and-recovery-view`

## User-visible value

After a frozen adoption plan is inspected, Workbench exposes a controlled confirm action. The action uses the frozen adoption operation context, applies the adoption through the existing `symphony adopt --confirm <adoption-id> --json` path, records the confirm operation, and returns the refreshed active goal, events, runs, operations, and next action.

## Implementation summary

- Added `POST /api/goals/<goal-id|latest>/adoption-confirm`.
- The confirm body accepts only `goalId`, `taskId`, `adoptionPlanId`, and `operationId`.
- The backend rereads `goal-operation-runs.v1` and requires the same active goal/task frozen `commandKind: "adoption-plan"` operation before invoking the existing adoption confirm CLI path.
- Successful confirm responses return `controlled-adoption-confirmation.v1`, record `commandKind: "adoption-confirm"`, and include refreshed `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-operation-runs.v1`, `symphony.console-runs`, and `goal-next-action.v1`.
- The Workbench adoption inspect/recovery panel now shows the controlled confirm endpoint and has a `Confirm adoption` action that refreshes Workbench contracts after success.
- The route rejects extra body fields, query parameters, unsafe route refs, and missing frozen operation context before starting adoption confirm.
- Docs and tests were updated for the v30 confirm path and operation kind.

## Files changed for task-4

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `src/symphony/console.js`
- `src/symphony/goal-operation-run-registry.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BjfhlBaU.js`

Pre-existing dirty checkout files remain present and were not cleaned or reverted. `frontend/workbench/src/styles/workbench.css`, `tests/v23-goal-operation-run-registry.test.js`, older generated Workbench assets, v29/v30 evidence files, and goal runbook fixtures were already dirty or untracked in the delegated checkout boundary.

## Workbench user path changed

Open Workbench, use the Adoption path, freeze an adoptable implementation run, inspect the frozen adoption state, then use `Confirm adoption`. The confirm request is built from the active goal scoped frozen adoption operation. On success, the UI refreshes active goal state, events, runs, operations, and next action.

## Command results

`pnpm check`

- Exit code: 0
- Result: `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`

`pnpm test`

- Exit code: 0
- Result: 744 tests, 115 suites, 744 pass, 0 fail, duration `7969.406083ms`.

`pnpm workbench:build`

- Exit code: 0
- Result: Vite build completed in 59 ms. Generated `src/symphony/workbench-static/index.html`, `assets/index-jAAl_uMe.css`, and `assets/index-BjfhlBaU.js`.

`git diff --check`

- Exit code: 0
- Result: no output.

`pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Result: `goal-progress-ledger.v1`; 5 total tasks, 3 completed tasks, 0 blocked tasks, 0 needs-review tasks, 0 needs-revision tasks, releaseReady `false`.
- Task state: task-1, task-2, and task-3 are `main-verified`; task-4 is `planned` with no worker evidence ref.

`pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Result: `goal-next-action.v1`; status `action-required`; next task `task-4`, role `worker`, phase `implement`.
- Reason: `No explicit worker evidence is recorded for task-4.`
- After completion allows `worker.evidence-recorded`, `worker.self-check-passed`, and `worker.self-check-failed`.

Focused checks also passed:

- `pnpm test -- tests/workbench-api-client.test.js`: exit code 0, 38 tests passed.
- `pnpm test -- tests/workbench-shell.test.js`: exit code 0, 24 tests passed.

## Boundary notes

- I used the repo-local/current-checkout fallback because the delegated checkout was already dirty and on `v30-task-3-adoption-inspect-and-recovery-view`, not the expected task-4 branch.
- I did not clean, stash, revert, merge, push, tag, publish, or force checkout.
- I did not introduce a generic shell runner, browser terminal, model invocation path, permission system, goal framework, artifact framework, or command DSL.
- The Workbench confirm route maps only to existing `symphony adopt --confirm <adoption-id> --json` semantics from a frozen adoption operation.
- Browser UI does not accept shell commands, prompt text, arbitrary paths, plan hashes, merge/push/tag options, approval fields, main verification fields, or release readiness fields.
- The confirm path does not register reviewer approval, main verification, release gates, or release readiness.
- I did not self-approve and did not register Symphony goal events, reviews, gates, release gates, release readiness, or adoption readiness.

## Reviewer handoff checklist

- Confirm the route rejects unsupported fields before invoking adoption confirm.
- Confirm `commandKind: "adoption-confirm"` remains operation telemetry, not task approval or release evidence.
- Confirm post-confirm response refreshes active goal progress, event log, operation registry, runs, and next action.
- Confirm docs and tests describe controlled confirm without merge, push, tag, publish, or self-approval.
