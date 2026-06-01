# v30 task-5 main verification evidence

Date: 2026-06-01  
Goal id: `v30-verified-adoption-workspace-v2`  
Release name: `v30 Verified Adoption Workspace v2`  
Task id: `task-5`  
Task title: `Adoption tests, docs, and evidence bridge`  
Verification result: `passed`

## Evidence Checked

- Runbook: `docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md`
- Plan: `docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md`
- Worker evidence: `docs/plans/v30-task-5-worker-evidence-2026-06-01.md`
- Review evidence: `docs/plans/v30-task-5-review-evidence-2026-06-01.md`
- Release evidence bridge: `docs/plans/v30-release-evidence-2026-06-01.md`
- Workbench UI: `frontend/workbench/src/App.jsx`
- Workbench API client and projection contracts: `frontend/workbench/src/api/client.js`, `frontend/workbench/src/api/contracts.js`
- Workbench backend routes and adoption confirm response: `src/symphony/console.js`
- Operation registry: `src/symphony/goal-operation-run-registry.js`
- Tests: `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, `tests/v23-goal-operation-run-registry.test.js`
- Docs: `docs/workbench-operator-guide.md`, `docs/symphony-product-contracts.md`
- Generated Workbench static output under `src/symphony/workbench-static/`

## Diff Basis And Checkout Notes

`git status --short --branch` reported branch `v30-task-3-adoption-inspect-and-recovery-view`, not the runbook task branch `v30-task-5-adoption-tests-docs-and-evidence-bridge`. The checkout was dirty before this verification and includes v29/v30 source, docs, tests, evidence files, fixtures, and generated Workbench static assets.

The runbook's original main verification flow expects `git checkout main`, `git pull --ff-only`, and `git merge --ff-only v30-task-5-adoption-tests-docs-and-evidence-bridge`. The delegated instruction said to use repo-local/current-checkout fallback if a boundary appears, and not to clean, stash, revert, merge, push, tag, publish, or force checkout. I therefore did not change branches or merge. The fallback basis was the current dirty checkout plus targeted code/test/doc inspection and all required validation commands.

`git diff --stat` showed task-5-relevant changes in `docs/symphony-product-contracts.md`, `docs/workbench-operator-guide.md`, `frontend/workbench/src/App.jsx`, `frontend/workbench/src/api/client.js`, `frontend/workbench/src/api/contracts.js`, `frontend/workbench/src/styles/workbench.css`, `src/symphony/console.js`, `src/symphony/goal-operation-run-registry.js`, `tests/v23-goal-operation-run-registry.test.js`, `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, and generated Workbench static assets. The fallback is sufficient for this pass because the required task-5 files, previous defect, route-safety assertions, docs bridge, full test suite, build, whitespace check, and read-only goal commands were verified in the same checkout.

## Commands Run

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | Node syntax check completed across source, scripts, plugins, and tests. |
| `pnpm test` | 0 | 745 tests, 115 suites, 745 passed, 0 failed, duration `5006.48125ms`. The run included `tests/workbench-api-client.test.js` with 38 passed tests and `tests/workbench-shell.test.js` with v30 verified workflow assertions. |
| `pnpm workbench:build` | 0 | Vite built `src/symphony/workbench-static/index.html`, `assets/index-jAAl_uMe.css`, and `assets/index-BP15T8oN.js`; built in `58ms`. |
| `git diff --check` | 0 | No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json` | 0 | `goal-progress-ledger.v1`; 5 tasks total, 5 completed by ledger summary, 0 blocked, releaseReady `false`; task-5 status `approved`, status source `goal-event-log.v1:evt_e3438c82d12d51a6`, reviewer verdict `APPROVED`, mainVerificationRef `null`. |
| `pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json` | 0 | `goal-next-action.v1`; next action is task-5 `main-verifier`, phase `main-verification`, reason `Reviewer approved task-5 but main verification is missing.` |

## Verification Findings

No blocking findings.

- The prior reviewer defect is fixed. `tests/workbench-api-client.test.js` now creates a local `runner` in `startV30Task2AdoptionFreezeServer`, passes it to `createSymphonyConsoleServer`, and returns the same object for assertions. This removes the prior `ReferenceError: runner is not defined` path.
- Rejected adoption freeze requests with query input or unsupported body fields return `error-envelope.v1`; the test asserts the runner call count stays at `0`, goal event count stays unchanged, and operation count stays unchanged before successful freeze.
- Successful freeze stays on the controlled adoption-plan path. The response contract is `controlled-adoption-plan-freeze.v1`, the operation registry records `commandKind: "adoption-plan"` and `commandName: "symphony adopt --run"`, and goal events remain unchanged after freeze.
- Rejected adoption confirm requests with unsupported body fields or query input return `error-envelope.v1`. The test records runner calls before the rejected query and asserts the count is unchanged, then asserts goal event count is unchanged.
- Successful confirm stays on the existing controlled adoption confirm path. The response contract is `controlled-adoption-confirmation.v1`, the operation registry records `commandKind: "adoption-confirm"` and `commandName: "symphony adopt --confirm"`, and refreshed contracts include active goal progress, event log, operation registry, runs, and next action.
- The backend confirm safety response sets `genericShellRunner`, `modelInvocationAvailable`, `mergeAvailable`, `pushAvailable`, `tagAvailable`, `publishAvailable`, `selfApprovalAvailable`, `reviewerEventRegistered`, `mainVerificationEventRegistered`, and `releaseReadinessRegistered` to `false`.
- The Workbench shell tests keep the visible adoption path as `Adoption candidate normalization`, `Freeze adoption plan`, `Inspect recovery state`, and `Confirm adoption`. The tests assert no direct patch/apply readiness controls, model invocation controls, arbitrary shell execution, browser terminal behavior, merge, push, tag, publish, reviewer approval, main verification declaration, or release readiness declaration are exposed in the adoption panels.
- `docs/workbench-operator-guide.md` describes adoption as a verified workflow: candidate rows are explicit backend operation/run fields, freeze uses scoped `goalId`, `taskId`, `sourceRunId`, and `operationId`, inspect is read-only from the frozen operation context, and confirm reuses existing `symphony adopt --confirm <adoption-id> --json` without merge, push, tag, publish, or reviewer/main/release event registration.
- `docs/symphony-product-contracts.md` records the same route boundaries and states that operation registry records, evidence bridge docs, Workbench build output, and route-safety tests do not become reviewer approval, main verification, release gate status, or release readiness.
- `docs/plans/v30-release-evidence-2026-06-01.md` is a release-manager bridge input only. It lists evidence inputs and release gate inputs, states that it does not declare release readiness or register `release.ready`, and states that it does not replace independent review or main verification evidence.
- `goal-status` confirms the latest reviewer approval event for task-5 is `evt_e3438c82d12d51a6`, task-5 main verification is still missing before coordinator gate registration, and `releaseReady` is `false`.
- `goal next` confirms this handoff is correctly positioned at task-5 main verification and does not claim release readiness.

## Boundary Notes

- Original blocked operation: runbook main verification branch flow (`git checkout main`, `git pull --ff-only`, `git merge --ff-only v30-task-5-adoption-tests-docs-and-evidence-bridge`) would disturb the dirty current checkout and violate the delegated boundary.
- Fallback path used: repo-local/current-checkout verification on branch `v30-task-3-adoption-inspect-and-recovery-view`.
- Exact checks used for fallback: targeted inspection of runbook, plan, worker evidence, review evidence, release evidence bridge, relevant Workbench frontend/backend/tests/docs, plus `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, `goal-status`, and `goal next`.
- I did not implement code, perform reviewer work, register goal events or gates, merge, push, tag, publish, clean, stash, revert, or force checkout.
- I did not run `symphony goal gate`; the coordinator is expected to register the main-verification gate after reading this evidence.

## Residual Risks

- I did not perform a manual browser click-through against a live Workbench server. Verification is based on code inspection, full automated tests, build output, and current goal contract commands.
- The checkout contains prior v29/v30 dirty changes and generated assets. This pass is scoped to task-5 acceptance and non-goals on the repo-local/current-checkout fallback basis.
