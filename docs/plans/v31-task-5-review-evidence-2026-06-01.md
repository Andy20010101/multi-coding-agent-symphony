# v31 task-5 review evidence

Date: 2026-06-01

Goal id: `v31-main-verification-runner-evidence-writer`

Release: `v31 Main Verification Runner + Evidence Writer`

Task id: `task-5`

Task title: `Main-verification gate registration flow`

Reviewer id: `codex-v31-task-5-reviewer`

Verdict: `approved`

Evidence path: `docs/plans/v31-task-5-review-evidence-2026-06-01.md`

## Scope reviewed

I reviewed the task-5 worker evidence, the v31 runbook and plan, the v31 runbook fixture, the current checkout diff for the Workbench gate registration flow, the related frontend/backend tests, and the operator/product contract docs.

Files and evidence inspected:

- `docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md`
- `docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md`
- `fixtures/contracts/goal-runbook.v31-main-verification-runner-evidence-writer.v1.json`
- `docs/plans/v31-task-5-worker-evidence-2026-06-01.md`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `src/symphony/console.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/v23-goal-operation-console-api.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/workbench-static/`
- `.symphony/goals/events/v31-main-verification-runner-evidence-writer.ndjson`

## Acceptance findings

- Workbench user path is visible and testable: approved. `WorkbenchShell` renders `MainVerificationGateRegistrationPanel` in the main verification section, and `tests/workbench-shell.test.js` checks the panel wiring and fixed form projection.
- Flow is anchored to active context and backend state: approved. `projectMainVerificationGateRegistration` reads the active runbook, ledger, event log, next action, readiness model, evidence draft, verification operation id, verification run id, and existing main-verification ref.
- Dry-run before confirm is preserved: approved. The panel uses the existing `GoalEventFormList`, `event-plan-preview`, and `event-plan-confirm` flow. Confirm requires the returned `planHash` before appending any event.
- Gate path is fixed: approved. The task-5 form overrides `gateName` to `main-verification` and `gateStatus` to `passed`, both read-only with single-option lists. The displayed dry-run and confirm commands use `--gate main-verification --status passed`.
- Verification command success is not treated as gate passed: approved. The registration model requires `evidenceDraft.verification.gatePassed.value === false`; command success stays command evidence until the separate gate confirm runs.
- Missing evidence context suppresses the flow: approved. Missing readiness, draft, evidence ref, passed controlled verification run, command results, or existing gate form definition produces blockers and `form: null`.
- Browser boundary is preserved: approved. I found no added arbitrary shell execution, model invocation, local-file opening, artifact download, merge, push, tag, release readiness registration, or self-approval path in task-5 changes.
- No generic framework or v8 command surface was introduced: approved. The implementation reuses the existing goal event dry-run/confirm APIs and Workbench contracts. It does not add a generic shell runner, command DSL, browser terminal, model invocation path, permission system, generic framework, or v8 top-level command surface.
- Worker did not self-approve, perform main verification, or declare release ready: approved from evidence inspected. Worker evidence states those non-actions, and the managed event log separates `worker.evidence-recorded` from a later `reviewer.approved` event with reviewer actor `codex-v31-task-5-reviewer`.

## Commands and results

- `pnpm check`: exit code 0. Node syntax check completed for source, scripts, plugins, and tests.
- `pnpm test`: exit code 0. Node test runner reported 751 tests, 115 suites, 751 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo.
- `pnpm workbench:build`: exit code 0. Vite built `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-DR6VUXbR.js`.
- `git diff --check`: exit code 0. No whitespace errors were reported.
- `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json`: exit code 0. Current output showed task-1 through task-4 `main-verified`; task-5 `approved`, status source `goal-event-log.v1:evt_a2d453a28b8ba94d`, worker evidence `docs/plans/v31-task-5-worker-evidence-2026-06-01.md`, review evidence `docs/plans/v31-task-5-review-evidence-2026-06-01.md`, review verdict `APPROVED`, and `mainVerificationRef: null`.
- `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json`: exit code 0. Current output showed next action `task-5`, role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-5 but main verification is missing.`

## Boundary notes

- The checkout was dirty before review with v29/v30/v31 files, generated Workbench static assets, fixtures, docs, and task evidence files. I preserved existing changes.
- Current branch is `v30-task-3-adoption-inspect-and-recovery-view`, not the runbook branch `v31-task-5-main-verification-gate-registration-flow`. Fallback used: repo-local/current-checkout review of the files and evidence the coordinator explicitly listed.
- The prompt said the reviewer verdict was missing. During this review, read-only goal commands showed task-5 already approved, and the event log contains `evt_a2d453a28b8ba94d` for `reviewer.approved`, actor `codex-v31-task-5-reviewer`, source command `symphony goal review`, evidence ref `docs/plans/v31-task-5-review-evidence-2026-06-01.md`. I did not create that event. This current state supersedes the earlier missing-review-verdict blocker.
- I did not implement product code, edit worker evidence, run main verification, register goal events, register gates, register release readiness, switch branches, clean, stash, reset, revert, merge, push, tag, or publish.
- I did not run `goal review`, `goal gate`, or `goal update`. The only goal commands I ran were the requested read-only `goal-status` and `goal next` checks.

## Residual risks

- Review was performed against the dirty shared checkout rather than a clean task-5 branch diff. The risk is limited by checking the current diff surfaces, task-5 evidence, tests, docs, build output, and current managed goal state in the same checkout the coordinator requested.
- I did not perform browser manual testing in this reviewer pass. Coverage comes from the Workbench shell/API tests and the production build.

## Suggested review registration details

- Task id: `task-5`
- Reviewer id: `codex-v31-task-5-reviewer`
- Verdict: `approved`
- Evidence ref: `docs/plans/v31-task-5-review-evidence-2026-06-01.md`
