# v31 task-3 main verification evidence

Date: 2026-06-01
Goal id: `v31-main-verification-runner-evidence-writer`
Release name: `v31 Main Verification Runner + Evidence Writer`
Task id: `task-3`
Task title: `Verification operation console`
Main verifier id: `codex-v31-task-3-main-verifier`
Main verification verdict: `passed`

## Evidence inspected

- Worker evidence: `docs/plans/v31-task-3-worker-evidence-2026-06-01.md`.
- Review evidence: `docs/plans/v31-task-3-review-evidence-2026-06-01.md`.
- Runbook task section: `docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md`.
- Plan task section: `docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md`.
- Fixture contract: `fixtures/contracts/goal-runbook.v31-main-verification-runner-evidence-writer.v1.json`.
- Backend controlled verification route and operation registry: `src/symphony/console.js`, `src/symphony/goal-operation-run-registry.js`.
- Workbench projection and UI: `frontend/workbench/src/api/contracts.js`, `frontend/workbench/src/api/client.js`, `frontend/workbench/src/App.jsx`.
- Tests covering task-3 behavior: `tests/v23-goal-operation-console-api.test.js`, `tests/v23-goal-operation-run-registry.test.js`, `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`.
- Product/operator docs: `docs/symphony-product-contracts.md`, `docs/workbench-operator-guide.md`.
- Served Workbench shell and scoped operations route from `pnpm --silent symphony console --host 127.0.0.1 --port 8765`.

## Acceptance checklist

- Passed: Workbench user path for task-3 is visible and testable. The served Workbench shell references the current static bundle. The bundle contains `Goal Operation Console`, `controlled verification operation`, `Start controlled verification run`, `successImpliesGatePassed`, `artifactRefs`, and `v31-main-verification-command-suite`.
- Passed: Verification command suite is connected to operation registry and Workbench console through controlled surfaces. `POST /api/goals/<goal-id>/verification-run-confirm` records `commandKind: "verification"` operations, and the Workbench operation console projects `goal-operation-runs.v1`.
- Passed: Saved command result contract exposes status, stdout/stderr summaries, exit code, run result, and artifact refs. The confirmation contract and registry record include `status`, `output.stdout`, `output.stderr`, `output.exitCode`, `runResult`, `artifactRefs`, `commandResults`, and `verifierSummary`.
- Passed: Command success does not automatically imply `main-verification` gate passed. The route records `gatePassed: false`, `successImpliesGatePassed: false`, and does not append goal events or gates.
- Passed: The implementation does not accept arbitrary command input and does not add a generic shell runner, command DSL, browser terminal, model invocation path, permission system, or generic safety layer. Request body fields are limited to `goalId`, `taskId`, and `suiteId`, and unsupported body/query input is rejected in tests.
- Passed: Task state is anchored to active goal/task/run/evidence context. The Workbench route context and verification preview use `goal-runbook.v1`, `goal-next-action.v1`, `goal-progress-ledger.v1`, `goal-event-log.v1`, and `goal-operation-runs.v1`.
- Passed: State comes only from explicit backend events or command outputs. The operation console reads backend registry records and command output summaries; it does not infer approval or gate state from frontend state.
- Passed: Browser UI does not execute arbitrary shell, invoke models, open local files, download artifacts, merge, push, tag, self-approve, or register events/gates. The browser starts only the controlled verification route and displays registry output.
- Passed: v8 compatibility commands are not the top-level Workbench model. Workbench navigation states that the current path follows the latest goal/runbook/next-action workflow, and task-3 is exposed through the v31 verification readiness and operation-console surfaces.

## Commands and results

- `pnpm check` -> exit 0.
- `pnpm test` -> exit 0. Result: 749 tests passed, 0 failed.
- `pnpm workbench:build` -> exit 0. Built `src/symphony/workbench-static/index.html`, `assets/index-43cPgumS.css`, and `assets/index-BuJBc_Dh.js`.
- `git diff --check` -> exit 0.
- `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json` -> exit 0. `task-3` status was `approved`, review verdict was `APPROVED`, main verification ref was `null`, release ready was `false`.
- `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json` -> exit 0. Next action was `task-3`, role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-3 but main verification is missing.`

Additional route check:

- `pnpm --silent symphony console --host 127.0.0.1 --port 8765` served the Workbench app.
- `curl -fsS http://127.0.0.1:8765/workbench/` -> exit 0. HTML referenced `/workbench/assets/index-BuJBc_Dh.js` and `/workbench/assets/index-43cPgumS.css`.
- `curl -fsS http://127.0.0.1:8765/workbench/assets/index-BuJBc_Dh.js | rg -o "Goal Operation Console|controlled verification operation|Start controlled verification run|successImpliesGatePassed|v31-main-verification-command-suite|artifactRefs"` -> exit 0. All searched strings were present.
- `curl -fsS http://127.0.0.1:8765/api/goals/v31-main-verification-runner-evidence-writer/operations` -> exit 0. Returned `goal-operation-runs.v1` for `v31-main-verification-runner-evidence-writer`.

## Gate recommendation

`main-verification passed`

Suggested gate registration details:

- task id: `task-3`
- verifier id: `codex-v31-task-3-main-verifier`
- gate: `main-verification`
- status: `passed`
- evidence ref: `docs/plans/v31-task-3-main-verification-evidence-2026-06-01.md`
- failed command: none

## Boundary notes and residual risks

- Main verifier is independent from the worker and reviewer.
- Main verifier did not implement product code.
- Main verifier wrote only this main verification evidence file.
- Main verifier did not run `symphony goal gate`, `symphony goal review`, or `symphony goal update`.
- Main verifier did not register goal events, reviews, gates, main verification, or release readiness.
- Main verifier did not clean, stash, reset, revert, merge, push, tag, or publish.
- The worktree was already dirty before this verification. Existing product changes, generated Workbench assets, and earlier evidence artifacts were treated as prior task state and were not reverted.
- The controlled verification POST remains synchronous while commands run, although it records a `running` operation before terminal state.
- Artifact refs point to operation-registry records rather than downloadable files, matching the browser boundary but requiring readers to use the scoped operations route for details.
