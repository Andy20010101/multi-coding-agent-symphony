# v30 task-3 main verification evidence

Date: 2026-06-01  
Goal id: `v30-verified-adoption-workspace-v2`  
Task id: `task-3`  
Task title: `Adoption inspect and recovery view`  
Branch verified: `v30-task-3-adoption-inspect-and-recovery-view`  
Gate status: `PASSED`

## Ledger state checked

`pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Result contract: `goal-progress-ledger.v1`
- Task-3 status: `approved`
- Task-3 review verdict: `APPROVED`
- Worker evidence ref: `docs/plans/v30-task-3-worker-evidence-2026-06-01.md`
- Review evidence ref: `docs/plans/v30-task-3-review-evidence-2026-06-01.md`
- Main verification ref before this file: `null`
- Release ready: `false`

`pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Result contract: `goal-next-action.v1`
- Next action: task-3, role `main-verifier`, phase `main-verification`
- Reason: reviewer approved task-3 but main verification is missing.
- Copy-only commands listed: `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, and goal-status.

## Evidence reviewed

Reviewed:

- `docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md`
- `docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md`
- `docs/plans/v30-task-3-worker-evidence-2026-06-01.md`
- `docs/plans/v30-task-3-review-evidence-2026-06-01.md`

Task-3 scope is to connect Workbench to the existing read-only `symphony adopt --inspect <adoption-id> --json` output and show journal state, before/after hash data, and current worktree match results. The worker evidence records that route, projection, panel, API validation, docs, and tests were updated. The review evidence records `Verdict: APPROVED` and checks the same task boundary without treating test pass alone as approval.

I also inspected the current checkout implementation enough to confirm the evidence matches the code:

- `frontend/workbench/src/api/contracts.js` defines `ADOPTION_INSPECT_ROUTE_TEMPLATE`, derives the inspect route from the active-goal adoption-plan operation, and projects `AdoptionInspectRecoveryViewV30`.
- `frontend/workbench/src/App.jsx` renders `AdoptionInspectRecoveryPanel`, shows journal status, patch/hash fields, latest confirmation context, after-hash match details, and before-journal match details.
- `src/symphony/console.js` serves `GET /api/adoptions/<adoption-id>/inspect` through `buildAdoptionInspectionSummary` and rejects query parameters or unsafe adoption ids with `error-envelope.v1`.
- `tests/workbench-api-client.test.js` covers the frozen adoption plan route, inspect output projection, hash/worktree fields, and query-parameter rejection.
- `tests/workbench-shell.test.js` checks that the panel exposes the inspect/recovery fields and does not expose review/gate/release, shell, merge, tag, browser execution, or clipboard paths.

## Acceptance commands

`pnpm check`

- Exit code: 0
- Result: Node syntax check completed for source, scripts, plugin eval replay files, and tests.

`pnpm test`

- Exit code: 0
- Result: 743 tests, 115 suites, 743 pass, 0 fail, duration `4873.450125ms`.

`pnpm workbench:build`

- Exit code: 0
- Result: Vite build completed successfully in 56 ms.
- Output files reported: `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-jAAl_uMe.css`, `src/symphony/workbench-static/assets/index-B5sMEzXr.js`.

`git diff --check`

- Exit code: 0
- Result: no output.

## Checkout boundary

Current branch during verification: `v30-task-3-adoption-inspect-and-recovery-view`.

The checkout was already dirty with v29/v30 evidence files, task-1/task-2/task-3 Workbench changes, generated static Workbench assets, and runbook fixtures. I worked in the current checkout, did not revert or clean any existing changes, and only added this main verification evidence file.

I did not merge, push, tag, publish, stash, clean, force checkout, implement product code, or register any `symphony goal gate` event. The controller remains responsible for registering the main-verification gate.

## Verification result

Task-3 is ready for the controller to register the main-verification gate.

Gate status: `PASSED`
