# v31 task-4 main verification evidence

Date: 2026-06-01

Goal id: `v31-main-verification-runner-evidence-writer`

Release name: `v31 Main Verification Runner + Evidence Writer`

Task id: `task-4`

Task title: `Main verification evidence writer`

mainVerificationStatus: `passed`

Verifier id: `codex-v31-task-4-main-verifier`

## Evidence inspected

- Worker evidence: `docs/plans/v31-task-4-worker-evidence-2026-06-01.md`
- Review evidence: `docs/plans/v31-task-4-review-evidence-2026-06-01.md`
- Runbook: `docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md`
- Plan doc: `docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md`
- Fixture: `fixtures/contracts/goal-runbook.v31-main-verification-runner-evidence-writer.v1.json`
- Workbench model and panel paths:
  - `frontend/workbench/src/api/contracts.js`
  - `frontend/workbench/src/App.jsx`
  - `frontend/workbench/src/api/client.js`
  - `frontend/workbench/src/styles/workbench.css`
- Backend operation registry and verification run path:
  - `src/symphony/console.js`
  - `src/symphony/goal-operation-run-registry.js`
- Regression coverage:
  - `tests/workbench-api-client.test.js`
  - `tests/workbench-shell.test.js`
  - `tests/v23-goal-operation-console-api.test.js`
  - `tests/v23-goal-operation-run-registry.test.js`
- Contract and operator docs:
  - `docs/symphony-product-contracts.md`
  - `docs/workbench-operator-guide.md`
- Current command output from `goal-status` and `goal next`.

## Acceptance checklist

- Pass: Workbench user path for task-4 is visible and testable. `WorkbenchShell` mounts `MainVerificationEvidenceDraftPanel` beside `MainVerificationReadinessPanel` in the Verification path, and `tests/workbench-shell.test.js` checks the mounted panel and rendered safety fields.
- Pass: Evidence draft writer derives from explicit verification results, goal/task/run refs, review evidence refs, worker evidence refs, and adoption refs when present. `projectActiveGoalContracts` assigns `activeGoal.mainVerificationEvidenceDraft` from `projectMainVerificationEvidenceDraftWriter`, which reads `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, `goal-operation-runs.v1`, latest run state, and `symphony.console-adoption-inspect` fields when present.
- Pass: Draft requires operator/reviewer check and does not automatically declare passed, register main-verification, or imply gate status from command success. The draft status is `draft-needs-operator-review`; safety fields include `needsOperatorReview: true`, `requiresOperatorReview: true`, `declaresPassed: false`, `registersGates: false`, and `successImpliesGatePassed: false`. Backend controlled verification results also keep `gatePassed: false`.
- Pass: Existing goal/event/run/adoption/verification/operation contracts are reused. The implementation uses the existing ledger, event log, next action, operation registry, adoption inspect, latest run, and controlled verification contracts instead of adding a new evidence state framework.
- Pass: State comes only from explicit backend events or command outputs. The projection lists ignored inference sources including branch names, file names, commit messages, prompt text, task titles, command success as gate status, and frontend component state.
- Pass: Browser UI does not execute arbitrary shell, invoke models, open local files, download artifacts, merge, push, tag, self-approve, or register events/gates for this draft path. The draft panel renders copy-only markdown and refs; tests and docs confirm it does not write files, read evidence bodies, register gates, or provide arbitrary shell/model/local-file paths.
- Pass: No generic artifact framework, command DSL, shell runner, browser terminal, permission system, or model invocation path was added for task-4. The only execution path in scope remains the fixed controlled verification suite from the existing operation flow; the draft writer consumes its recorded command results.
- Pass: v8 compatibility commands are not the top-level Workbench model. The runbook and docs keep the current goal workflow as `goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest`, with old `scan/do/review/verify/status/continue/artifacts` commands documented only as compatibility/script paths.

## Commands and results

- `pnpm check`: exit code 0. Node syntax check completed.
- `pnpm test`: exit code 0. 750 tests passed, 0 failed.
- `pnpm workbench:build`: exit code 0. Vite built `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-BY5UaxlX.css`, and `src/symphony/workbench-static/assets/index-dzZLGXLO.js`.
- `git diff --check`: exit code 0. No whitespace errors reported. Rerun after writing this evidence file also exited 0.
- `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json`: exit code 0. Output showed task-4 status `approved`, worker evidence ref `docs/plans/v31-task-4-worker-evidence-2026-06-01.md`, review evidence ref `docs/plans/v31-task-4-review-evidence-2026-06-01.md`, review verdict `APPROVED`, and `mainVerificationRef: null`.
- `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json`: exit code 0. Output showed task-4, role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-4 but main verification is missing.`, with worker and review evidence refs present and `mainVerificationRef: null`.

Failed command: none.

The `goal-status` command generated its JSON at `2026-06-01T11:03:46.299Z`. It reported 5 total tasks, 4 completed tasks, no blocked tasks, and `releaseReady: false`. I did not use that release summary to declare the release ready.

## Gate recommendation

`main-verification passed`

Suggested registration details:

- Task id: `task-4`
- Verifier id: `codex-v31-task-4-main-verifier`
- Gate: `main-verification`
- Status: `passed`
- Evidence ref: `docs/plans/v31-task-4-main-verification-evidence-2026-06-01.md`
- Failed command: none

## Boundary notes and residual risks

- I was independent from the worker and reviewer.
- I did not implement product code.
- I wrote only `docs/plans/v31-task-4-main-verification-evidence-2026-06-01.md`.
- I did not run `goal gate`, `goal review`, or `goal update`.
- I did not register goal events, reviews, gates, main verification, release readiness, or release completion.
- I did not clean, stash, reset, revert, merge, push, tag, publish, or switch branches.
- Boundary condition: the current branch is `v30-task-3-adoption-inspect-and-recovery-view`, while task-4's runbook branch is `v31-task-4-main-verification-evidence-writer`; the checkout is also dirty with v29/v30/v31 docs, source, tests, fixtures, and generated Workbench assets.
- Fallback used: repo-local/current-checkout verification. I inspected the requested runbook, plan, fixture, worker evidence, review evidence, task-4 Workbench projection/UI/backend/test/doc paths, then ran the required commands in `/Users/andy/Documents/project/multi-coding-agent-symphony`. This supersedes the branch mismatch as a blocker because the user explicitly asked to preserve the dirty checkout and accommodate current work.
- The Workbench draft is still a copy/preview draft, not a managed evidence-file writer. That matches the task-4 boundary because operator/reviewer checking is required before any gate registration.
- No adoption refs were required by the current task-4 goal state. The implementation and regression test cover adoption refs when present.
