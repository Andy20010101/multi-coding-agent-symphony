# v31 task-3 review evidence

Date: 2026-06-01
Goal id: `v31-main-verification-runner-evidence-writer`
Release name: `v31 Main Verification Runner + Evidence Writer`
Task id: `task-3`
Task title: `Verification operation console`
Reviewer id: `codex-v31-task-3-reviewer`
Verdict: `APPROVED`

## Evidence checked

- Runbook and plan: `docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md`, `docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md`.
- Worker evidence: `docs/plans/v31-task-3-worker-evidence-2026-06-01.md`.
- Backend implementation: `src/symphony/console.js`, `src/symphony/goal-operation-run-registry.js`.
- Workbench implementation and static output: `frontend/workbench/src/App.jsx`, `frontend/workbench/src/api/client.js`, `frontend/workbench/src/api/contracts.js`, `frontend/workbench/src/styles/workbench.css`, `src/symphony/workbench-static/`.
- Tests: `tests/v23-goal-operation-console-api.test.js`, `tests/v23-goal-operation-run-registry.test.js`, `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`.
- Docs: `docs/workbench-operator-guide.md`, `docs/symphony-product-contracts.md`.
- Local route probes against `http://127.0.0.1:8766/` after `127.0.0.1:8765` was already in use.

## Findings

No blocking findings.

The task-3 path is visible and testable in Workbench. The static bundle contains `Start controlled verification run`, `controlled verification operation`, `Goal Operation Console`, `v31-main-verification-command-suite`, `successImpliesGatePassed`, and `gatePassed`. The frontend projects the allowlisted verification plan inside Main Verification Readiness and routes the start button through `confirmControlledVerificationRun`. The operation console projects status, command preview, stdout, stderr, exit code, run result, artifact refs, verifier summary, timestamps, and polling fields from `goal-operation-runs.v1`.

The backend confirm route accepts only `goalId`, `taskId`, and `suiteId`. It rejects unsupported body fields before command execution or operation writes. It re-reads the managed runbook task, builds only the fixed suite (`pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`) plus exact active-goal JSON reads already allowed by task/runbook context (`goal-status` and `goal next` for the same goal), records a `verification` operation as `running`, then records terminal `confirmed` or `failed` state from command output.

Successful command execution does not pass the main-verification gate. The confirmation contract and operation registry keep `runResult.gatePassed: false`, verifier summary `gatePassed: false`, and `safety.successImpliesGatePassed: false`. The verification run path does not append `main.verification-passed`, does not register gate/review/update events, and does not declare release readiness.

I found no generic shell runner, browser terminal, model invocation path, local file opener, download control, merge/push/tag/publish control, self-approval control, new permission system, new goal framework, new artifact framework, or command DSL in the reviewed task-3 path. v8 compatibility commands remain documented as compatibility/script commands, not the top-level Workbench action model. The reviewed code and tests do not infer approval, adoption, main verification, or release readiness from branch names, filenames, commit messages, prompt text, task titles, copy-only command text, test names, or frontend state.

Worker self-approval was not present in the worker evidence. The registered worker event `evt_f91789d7b662ec31` records actor `codex-v31-task-3-worker`; the review identity used here is `codex-v31-task-3-reviewer`.

## Required commands

- `pnpm check` -> exit 0. Node syntax check completed successfully.
- `pnpm test` -> exit 0. Result: 749 tests passed, 0 failed.
- `pnpm workbench:build` -> exit 0. Vite built `src/symphony/workbench-static/index.html`, `assets/index-43cPgumS.css`, and `assets/index-BuJBc_Dh.js`.
- `git diff --check` -> exit 0. No whitespace errors reported.
- `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json` -> exit 0 at `2026-06-01T10:05:03.202Z`. `task-3` was `in-progress`, status source `evt_f91789d7b662ec31`, worker evidence ref present, review/main verification refs null, release ready false.
- `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json` -> exit 0 before the later journal change. Next action was `task-3`, role `reviewer`, phase `review`, reason `Worker evidence exists for task-3 but reviewer verdict is missing.`

Repeat state reads after the review journal changed:
- `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json` -> exit 0 at `2026-06-01T10:07:25.741Z`. `task-3` was `approved`, status source `evt_e8c75b40fd427223`, review evidence ref present, main verification ref null, release ready false.
- `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json` -> exit 0 after the journal change. Next action was `task-3`, role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-3 but main verification is missing.`

## Additional checks

- `rg` over `src/symphony/workbench-static/` found the built verification route, fixed suite id, start button text, operation console text, and `gatePassed` rendering in `assets/index-BuJBc_Dh.js`.
- `GET http://127.0.0.1:8766/workbench/` returned the Workbench HTML shell with the current static JS/CSS assets.
- `GET http://127.0.0.1:8766/api/goals/v31-main-verification-runner-evidence-writer/operations` returned `goal-operation-runs.v1` with `operationCount: 0`.
- `POST http://127.0.0.1:8766/api/goals/v31-main-verification-runner-evidence-writer/verification-run-confirm` with unsupported body field `command` returned `error-envelope.v1`, code `invalid-controlled-verification-confirm-request`, safe detail `unsupportedFields: "command"`.
- A second `GET` of the scoped operations route after the rejected POST still returned `operationCount: 0`.

## Boundary notes

- Current checkout was dirty and on `v30-task-3-adoption-inspect-and-recovery-view`, not `v31-task-3-verification-operation-console`. I used the repo-local/current-checkout fallback. I did not clean, stash, reset, revert, merge, push, tag, publish, or force checkout.
- Original blocked operation: `pnpm --silent symphony console --host 127.0.0.1 --port 8765` failed with `listen EADDRINUSE: address already in use 127.0.0.1:8765`. Fallback: started the console on `127.0.0.1:8766`.
- In-app Browser smoke was attempted twice against `http://127.0.0.1:8766/workbench/`; both attempts timed out waiting for the Browser webview to attach. Fallback evidence came from the built static bundle, Workbench shell/API tests, and local HTTP route probes. This is sufficient for the reviewer verdict because the task-3 UI strings and route wiring are covered by static output and tests, and the backend route behavior was probed without running the verification suite.
- A `reviewer.approved` event for task-3, `evt_e8c75b40fd427223`, appeared in `.symphony/goals/events/v31-main-verification-runner-evidence-writer.ndjson` after the first required `goal next` run. I did not run `symphony goal review`, `symphony goal update`, or `symphony goal gate` in this review thread.

## Residual risks

- The verification confirm route is synchronous from the POST caller's perspective. It writes a `running` operation before executing commands, and the operation console can poll that registry, but the initiating POST remains open until the command suite finishes.
- The artifact ref is an operation-registry ref, not a separate downloadable file. This keeps the browser away from local file open/download controls; downstream readers must use the scoped operations route for result details.

## Independence statement

I reviewed the worker evidence, implementation, tests, docs, and static output independently. I did not implement code, patch product files, register review/update/gate events, declare main verification, or declare release readiness.
