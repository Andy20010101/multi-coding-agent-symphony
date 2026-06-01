# v25 task-4 main verification evidence

Goal id: `v25-controlled-implementation-lane`
Task id: `task-4`
Task: Post-run worker evidence flow
Verifier: main-verifier subagent
Verdict: `passed`

## Verification path

Used repo-local/current-checkout fallback at `/Users/andy/Documents/project/multi-coding-agent-symphony`.

The checkout was already dirty on branch `v24-task-1-main-verification-readiness-panel` with shared modified and untracked v23/v24/v25 files. I did not run checkout, merge, staging, or commit commands because that would risk mixing unrelated work in the shared checkout. No escalated approval was requested.

Current HEAD during verification: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`.

## Evidence checked

- `docs/plans/v25-task-4-worker-evidence-2026-05-29.md` exists and maps task-4 to converting confirmed run `evidenceArtifactPath` and `sourceWorkspacePath` into a worker evidence registration form and prompt handoff.
- `docs/plans/v25-task-4-review-evidence-2026-05-29.md` exists and records reviewer verdict `approved`.
- `pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json` returned task-4 / `main-verifier` / `main-verification` with reason `Reviewer approved task-4 but main verification is missing.`
- `pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json` returned task-4 status `approved`, worker evidence ref `docs/plans/v25-task-4-worker-evidence-2026-05-29.md`, review evidence ref `docs/plans/v25-task-4-review-evidence-2026-05-29.md`, review verdict `APPROVED`, and `mainVerificationRef: null`.

## Implementation checks

- `frontend/workbench/src/api/contracts.js` projects `projectV25WorkerEvidenceHandoff` only for `v25-controlled-implementation-lane`, requiring a latest run with `runId`, `evidenceArtifactPath`, `sourceWorkspacePath`, a managed evidence ref, `workspaceWrites: true`, `mainWorktreeWrites: false`, `executionPlanId`, and an `implement` pipeline entry.
- The projected registration form is `worker.evidence-recorded`, with actor `codex-v25-task-4-worker`, evidence ref `artifact-ref:artifact:<run-id>:evidence`, and controlled preview/confirm metadata.
- `frontend/workbench/src/App.jsx` renders the worker evidence handoff, prompt handoff, registration form, and existing `GoalEventPlanPreview` path. It does not add a shell runner.
- `src/symphony/contract.js` preserves `evidenceArtifactPath` in `compactRunState`.
- `src/symphony/console.js` keeps event-plan confirm constrained to `update`, `review`, and `gate`, requires JSON and plan hash, and returns `goal-event-confirmation.v1`.
- `tests/workbench-api-client.test.js` covers the v25 post-run worker evidence handoff from confirmed isolated workspace output.
- `tests/workbench-shell.test.js` checks the handoff is wired without a generic runner.
- `docs/symphony-product-contracts.md` and `docs/workbench-operator-guide.md` document the v25 handoff boundary.
- Static bundle coherence check found the rebuilt bundle contains `v25-controlled-implementation-lane`, `sourceWorkspacePath`, `artifact-ref:artifact`, `event-plan-confirm`, `genericShellRunner: false`, and `workerCanApproveOwnTask: false`.
- `src/symphony/workbench-static/index.html` points to `/workbench/assets/index-C33DSOf4.js` and `/workbench/assets/index-BTilLLdo.css`, matching the latest `pnpm workbench:build` output.

## Commands run

| Command | Result |
| --- | --- |
| `pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json` | Exit 0. Returned `goal-next-action.v1`; next action is task-4 main-verifier/main-verification; worker and review evidence refs are present; main verification ref is `null`. |
| `pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json` | Exit 0. Returned `goal-progress-ledger.v1`; task-4 status `approved`; review verdict `APPROVED`; releaseReady `false`. |
| `pnpm check` | Exit 0. Node syntax check completed for source, scripts, plugin, and test files. |
| `pnpm test` | Exit 0. Node test runner reported 713 tests, 113 suites, 713 pass, 0 fail. |
| `pnpm workbench:build` | Exit 0. Vite built `src/symphony/workbench-static/index.html`, `assets/index-BTilLLdo.css`, and `assets/index-C33DSOf4.js`. |
| `git diff --check` | Exit 0. No whitespace errors reported. |
| `pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json` | Exit 0 after acceptance commands. Task-4 remained `approved` with worker/review evidence present and `mainVerificationRef: null`; releaseReady remained `false`. |
| `rg -n "worker evidence handoff\|v25-controlled-implementation-lane\|sourceWorkspacePath\|artifact-ref:artifact\|event-plan-confirm\|workerCanApproveOwnTask\|genericShellRunner" src/symphony/workbench-static/index.html src/symphony/workbench-static/assets/index-BTilLLdo.css src/symphony/workbench-static/assets/index-C33DSOf4.js` | Exit 0. Confirmed the rebuilt static JS contains the v25 handoff fields and safety flags. |

## Verdict

`passed`

Task-4 satisfies the v25 acceptance scope on the repo-local/current-checkout fallback path. The implementation converts confirmed isolated run evidence/workspace paths into a controlled worker evidence registration form and prompt handoff, while leaving approval and main verification to explicit goal events. I did not register the main verification gate.
