# v30 task-4 independent review evidence

Date: 2026-06-01  
Goal id: `v30-verified-adoption-workspace-v2`  
Task id: `task-4`  
Task title: `Confirm adoption and post-apply next action`  
Reviewer role: independent reviewer for task-4 only

Verdict: APPROVED

## Scope reviewed

I reviewed the task-4 path that connects Workbench controlled adoption confirm to existing `symphony adopt --confirm <adoption-id> --json` semantics.

Reviewed behavior:

- `POST /api/goals/<goal-id|latest>/adoption-confirm`
- request body limited to `goalId`, `taskId`, `adoptionPlanId`, and `operationId`
- backend reread of `goal-operation-runs.v1` before confirm
- requirement for matching `goalId`, `taskId`, `adoptionPlanId`, `operationId`, `commandKind: "adoption-plan"`, confirmed operation status, and frozen patch/plan refs
- confirm execution through the existing adoption CLI confirm path
- `commandKind: "adoption-confirm"` operation telemetry
- refreshed response contracts after confirm: `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-operation-runs.v1`, `symphony.console-runs`, and `goal-next-action.v1`
- Workbench inspect/recovery panel `Confirm adoption` button and request payload projection
- docs and tests for controlled confirm boundaries

## Files and diff basis

Read before review:

- `docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md`
- `docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md`
- `docs/plans/v30-task-4-worker-evidence-2026-06-01.md`

Task-4-relevant files inspected from the current dirty checkout:

- `src/symphony/console.js`
- `src/symphony/goal-operation-run-registry.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/v23-goal-operation-run-registry.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- generated Workbench static output under `src/symphony/workbench-static/`

Diff basis used:

- `git status --short`
- `git diff --name-only`
- `git diff --stat`
- targeted `git diff` and `rg` searches for `adoption-confirm`, `Confirm adoption`, `confirmControlledAdoptionPlan`, `commandKind: "adoption-confirm"`, `goal-operation-runs.v1`, and forbidden boundary terms.

The checkout was intentionally dirty and on `v30-task-3-adoption-inspect-and-recovery-view`, not the task-4 branch named in the runbook. I used the repo-local/current-checkout fallback requested in the delegation and did not clean, stash, revert, force checkout, merge, push, tag, or publish.

## Command results

`pnpm check`

- Exit code: 0
- Output summary: `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`

`pnpm test`

- Exit code: 0
- Output summary: 744 tests, 115 suites, 744 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo.
- Duration: `7012.929959ms`

`pnpm workbench:build`

- Exit code: 0
- Output summary: Vite build completed in `57ms`.
- Generated files reported by Vite:
  - `src/symphony/workbench-static/index.html`
  - `src/symphony/workbench-static/assets/index-jAAl_uMe.css`
  - `src/symphony/workbench-static/assets/index-BjfhlBaU.js`

`git diff --check`

- Exit code: 0
- Output: no whitespace errors.

`pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Contract: `goal-progress-ledger.v1`
- Summary: 5 total tasks, 3 completed tasks, 0 blocked tasks, 0 needs-review tasks, 0 needs-revision tasks, `releaseReady: false`.
- Task state: task-1, task-2, and task-3 are `main-verified`; task-4 is `in-progress` from `goal-event-log.v1:evt_aea5dfcd27cf88a2`; task-4 has worker evidence `docs/plans/v30-task-4-worker-evidence-2026-06-01.md` and no review or main verification evidence.

`pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Contract: `goal-next-action.v1`
- Status: `action-required`
- Next: task-4, role `reviewer`, phase `review`.
- Reason: `Worker evidence exists for task-4 but reviewer verdict is missing.`
- After completion registration path reported by the command: `symphony goal review`, allowed events `reviewer.approved` and `reviewer.needs-revision`.

## Findings

No required fixes found.

Evidence supporting approval:

- The backend route rejects query parameters, unsafe goal route segments, non-JSON bodies, oversized bodies, invalid JSON, non-object bodies, missing body fields, unsafe body token values, and unsupported body fields before invoking confirm.
- The backend rereads `goal-operation-runs.v1` and requires the frozen operation to match the submitted `goalId`, `taskId`, `adoptionPlanId`, and `operationId`, with `commandKind: "adoption-plan"` and `status: "confirmed"`.
- The backend requires frozen plan and patch refs before calling the existing CLI confirm path.
- The confirm command path is `symphony adopt --confirm <adoption-id> --json`, implemented through the existing `runSymphonyCli` adoption command, not a generic shell runner.
- Successful confirm records `commandKind: "adoption-confirm"` in the operation registry with run result, artifact refs, output, and verifier summary. This registry entry is operation telemetry only.
- The confirm response includes refreshed active goal progress, event log, operations, console runs, and next action.
- The Workbench confirm button builds its request from the projected frozen adoption operation context and refreshes Workbench contracts after success.
- Tests cover API client request shape, end-to-end freeze-inspect-confirm behavior, unsupported confirm fields, operation registry command kind support, refreshed response contracts, Workbench UI wiring, and frontend forbidden execution/approval patterns.
- Docs state that adoption confirm does not merge, push, tag, publish, self-approve, or append reviewer/main/release events.

## Boundary notes

- I did not run `symphony goal update`, `symphony goal review`, or `symphony goal gate`.
- I did not register goal events, reviews, gates, release gates, or release readiness.
- I did not implement product changes. This file is the only review evidence change I made.
- I did not self-approve as the worker and did not declare main verification, release readiness, merge readiness, push readiness, tag readiness, or publish readiness.
- I did not rely on filenames, branch names, commits, prompts, task titles, or frontend heuristics for the verdict.

## Residual risks

- I did not perform a manual browser click-through on a live Workbench instance. The reviewed evidence comes from code inspection plus the passing API, shell, and full test suite.
- The current checkout includes prior v29/v30 work and generated Workbench assets. Review scope was limited to task-4-relevant changes and boundaries.
