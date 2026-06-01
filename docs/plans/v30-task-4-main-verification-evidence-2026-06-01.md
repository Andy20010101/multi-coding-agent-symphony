# v30 task-4 main verification evidence

Date: 2026-06-01  
Goal id: `v30-verified-adoption-workspace-v2`  
Release name: `v30 Verified Adoption Workspace v2`  
Task id: `task-4`  
Task title: `Confirm adoption and post-apply next action`  
Verification result: `passed`

## Evidence Checked

- Runbook: `docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md`
- Plan: `docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md`
- Worker evidence: `docs/plans/v30-task-4-worker-evidence-2026-06-01.md`
- Review evidence: `docs/plans/v30-task-4-review-evidence-2026-06-01.md`
- Backend route and confirm implementation: `src/symphony/console.js`
- Operation registry command kinds: `src/symphony/goal-operation-run-registry.js`
- Workbench UI: `frontend/workbench/src/App.jsx`
- Workbench API client: `frontend/workbench/src/api/client.js`
- Workbench projection/contracts: `frontend/workbench/src/api/contracts.js`
- Tests: `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, `tests/v23-goal-operation-run-registry.test.js`
- Docs: `docs/workbench-operator-guide.md`, `docs/symphony-product-contracts.md`
- Generated Workbench static assets under `src/symphony/workbench-static/`

## Diff Basis And Checkout Notes

`git status --short --branch` reported branch `v30-task-3-adoption-inspect-and-recovery-view`, with a dirty checkout containing task-4-relevant source, docs, tests, generated Workbench static assets, and existing v29/v30 evidence files.

The runbook's original main verification flow expects `git checkout main`, `git pull --ff-only`, and `git merge --ff-only v30-task-4-confirm-adoption-and-post-apply-next-action`. The delegated instruction for this verification said not to clean, stash, revert, merge, push, tag, or publish, and to use repo-local/current-checkout fallback if branch/worktree boundaries block the expected action. I therefore did not change branches or merge. The fallback basis was the current dirty checkout plus targeted diff/code/test inspection.

`git diff --stat` showed task-4-relevant changes in `docs/symphony-product-contracts.md`, `docs/workbench-operator-guide.md`, `frontend/workbench/src/App.jsx`, `frontend/workbench/src/api/client.js`, `frontend/workbench/src/api/contracts.js`, `src/symphony/console.js`, `src/symphony/goal-operation-run-registry.js`, `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, `tests/v23-goal-operation-run-registry.test.js`, and generated Workbench static assets. This evidence supersedes the branch/worktree boundary; no product/test blocker remained after the repo-local fallback.

## Commands Run

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | Node syntax check completed across source, scripts, plugins, and tests. |
| `pnpm test` | 0 | 744 tests, 115 suites, 744 passed, 0 failed, duration `5093.442417ms`. |
| `pnpm workbench:build` | 0 | Vite built `src/symphony/workbench-static/index.html`, `assets/index-jAAl_uMe.css`, and `assets/index-BjfhlBaU.js`; built in `62ms`. |
| `git diff --check` | 0 | No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json` | 0 | `goal-progress-ledger.v1`; 5 tasks, 4 completed, 0 blocked, releaseReady `false`; task-4 status `approved`, reviewer verdict `APPROVED`, main verification missing. |
| `pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json` | 0 | `goal-next-action.v1`; next action is task-4 `main-verifier`, phase `main-verification`; after completion registers through `symphony goal gate --gate main-verification`. |

## Verification Findings

No blocking findings.

- The Workbench confirm route is `POST /api/goals/<goal-id|latest>/adoption-confirm` and rejects query parameters or unsafe goal route segments before executing confirm.
- The confirm request body is limited to `goalId`, `taskId`, `adoptionPlanId`, and `operationId`. Unsupported fields, non-JSON bodies, invalid JSON, non-object bodies, missing fields, and unsafe token values return controlled errors before confirm.
- The backend rereads `goal-operation-runs.v1` and requires the same `goalId`, `taskId`, `adoptionPlanId`, and `operationId` on a confirmed `commandKind: "adoption-plan"` operation. It also requires frozen plan and patch refs: `patchHash`, `adoptionPlanArtifactPath`, and `patchArtifactPath`.
- Confirm maps to existing CLI semantics through `runSymphonyCli({ argv: ['adopt', '--state-dir', stateDir, '--confirm', adoptionPlanId, '--json'] })`. I found no generic shell runner or arbitrary command path in the confirm implementation.
- A successful confirm returns `controlled-adoption-confirmation.v1`, records operation telemetry with `commandKind: "adoption-confirm"` and `commandName: "symphony adopt --confirm"`, and includes artifact refs plus verifier summary.
- The response refreshes active goal progress, event log, operation registry, console runs, and `goal-next-action.v1`.
- The Workbench UI builds the confirm request from the projected frozen adoption operation context and refreshes Workbench contracts through the `onAdoptionConfirmed` path after success.
- The browser UI presents no arbitrary shell/model/local-file execution, merge/push/tag/publish controls, self-approval controls, main verification controls, release readiness controls, or generic runner behavior for this confirm path.
- Tests cover the client request shape, the freeze/inspect/confirm path, unsupported confirm fields, confirm response contracts, operation telemetry, refreshed contracts, and the absence of forbidden execution/approval controls in the Workbench panel.
- Docs describe the route as controlled adoption confirm only, with no merge, push, tag, publish, self-approval, reviewer event, main verification event, or release readiness registration.

## Boundary Notes

- Original blocked operation: runbook main verification branch flow (`git checkout main`, `git pull --ff-only`, `git merge --ff-only ...`) could not be used without disturbing a dirty current checkout and violating the delegated boundary.
- Fallback used: repo-local/current-checkout verification with targeted source/diff inspection and all required validation commands.
- I did not implement code, perform reviewer work, register goal events or gates, merge, push, tag, publish, clean, stash, or revert.
- I did not run `symphony goal gate`; the coordinator is expected to register the gate after reading this evidence.

## Residual Risks

- I did not perform a manual browser click-through against a live Workbench server. Verification is based on code inspection, full automated tests, build output, and current goal contract commands.
- The checkout contains prior v29/v30 changes and generated assets. The pass result is scoped to task-4 acceptance and non-goals on the current checkout fallback basis.
