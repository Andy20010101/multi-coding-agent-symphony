# v31 task-4 review evidence

Date: 2026-06-01

Goal id: `v31-main-verification-runner-evidence-writer`

Release name: `v31 Main Verification Runner + Evidence Writer`

Task id: `task-4`

Task title: `Main verification evidence writer`

Review verdict: `approved`

Reviewer id: `codex-v31-task-4-reviewer-r2`

## Evidence inspected

- Worker evidence and revision history: `docs/plans/v31-task-4-worker-evidence-2026-06-01.md`.
- Prior review evidence and blocking finding in this file before rewrite.
- Current task-4 diff paths: `frontend/workbench/src/api/contracts.js`, `frontend/workbench/src/App.jsx`, `frontend/workbench/src/api/client.js`, `frontend/workbench/src/styles/workbench.css`, `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, `docs/workbench-operator-guide.md`, `docs/symphony-product-contracts.md`, and generated Workbench static assets.
- Active Workbench projection: `projectActiveGoalContracts` assigns `activeGoal.mainVerificationEvidenceDraft` from `projectMainVerificationEvidenceDraftWriter`.
- Draft projection and wrapper: `projectMainVerificationEvidenceDraft` and `projectMainVerificationEvidenceDraftWriter`.
- Visible Workbench panel: `MainVerificationEvidenceDraftPanel`.
- Regression coverage for active model shape and panel-read field paths in `tests/workbench-api-client.test.js` and `tests/workbench-shell.test.js`.
- Current `goal-status` and `goal next` JSON command output listed below.

## Acceptance checklist

- Previous blocking finding fixed: met. The active `mainVerificationEvidenceDraft` model now exposes the fields rendered by the Workbench panel: verification refs, worker/review/run refs, adoption refs, copy-only gate dry-run command, markdown draft, command results, and safety fields.
- Draft panel renders from active model fields and remains copy/preview oriented: met. The panel reads `draft.verification`, `draft.refs`, `draft.adoptionRefs`, `draft.copyOnlyGateDryRun`, `draft.markdown`, `draft.commandResults`, and `draft.safety`.
- Draft requires operator/reviewer check and does not automatically declare passed, register main verification, or imply gate status from command success: met. The projection uses `draft-needs-operator-review`, `needsOperatorReview: true`, `requiresOperatorReview: true`, `declaresPassed: false`, `registersGates: false`, and `successImpliesGatePassed: false`; the markdown states it does not register `main.verification-passed`.
- Task remains anchored to active goal/task/run/evidence context and explicit backend contracts: met. The projection reads runbook, ledger, event log, next action, operation registry, latest run, and adoption inspect data when present.
- Browser UI does not execute arbitrary shell, invoke models, open local files, download artifacts, merge, push, tag, self-approve, or register events/gates from this path: met.
- No generic artifact framework, command DSL, shell runner, browser terminal, permission system, or model invocation path was added for task-4: met.
- v8 compatibility commands are not top-level Workbench model: met. The Workbench guide keeps legacy commands as terminal/compatibility paths, not the top-level Workbench task model.

## Commands

- `pnpm check`: exit code 0. Node syntax check completed.
- `pnpm test`: exit code 0. 750 tests passed, 0 failed.
- `pnpm workbench:build`: exit code 0. Vite built `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-BY5UaxlX.css`, and `src/symphony/workbench-static/assets/index-dzZLGXLO.js`.
- `git diff --check`: exit code 0. No whitespace errors reported.
- `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json`: exit code 0. Output showed task-4 `approved`, status source `goal-event-log.v1:evt_e087da6f77740281`, worker evidence ref `docs/plans/v31-task-4-worker-evidence-2026-06-01.md`, review evidence ref `docs/plans/v31-task-4-review-evidence-2026-06-01.md`, review verdict `APPROVED`, and no main verification ref. Task-5 remains `planned`.
- `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json`: exit code 0. Output showed task-4, role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-4 but main verification is missing.`, with worker and review evidence refs present and `mainVerificationRef: null`.

## Findings

No blocking findings.

The prior blocker is resolved. `projectMainVerificationEvidenceDraftWriter` still wraps the base draft projection, but it now returns the richer field shape consumed by `MainVerificationEvidenceDraftPanel`: `verification`, `verificationOperation`, `refs`, `adoptionRefs`, `copyOnlyGateDryRun`, `markdown`, `commandResults`, and safety flags. The active model assignment and the mounted panel now agree.

The regression tests cover the active `projectWorkbenchContracts(...)` model rather than only an unused helper shape. They assert verification operation/run refs, worker/review refs, adoption refs, latest run ref, target evidence ref, copy-only gate dry-run, markdown text, command results, missing-input behavior, and safety fields.

## Boundary notes

- I was independent from the worker and revision worker.
- I did not implement or patch product code.
- I wrote only `docs/plans/v31-task-4-review-evidence-2026-06-01.md`.
- I did not run `goal review`, `goal update`, or `goal gate`.
- I did not register goal events, reviewer verdicts, gates, main verification, release readiness, or release completion.
- I did not clean, stash, reset, revert, merge, push, tag, publish, or switch branches.
- The current goal state changed relative to the handoff text: by the time I ran the required commands, task-4 was already recorded as `approved` and `goal next` had advanced to main verification. I did not create that event.

## Residual risks

- The draft is still a copy/preview artifact, not a managed evidence file writer. This matches the task boundary because an operator/reviewer must check the content before any main-verification gate registration.
- The checkout remains dirty with unrelated v29/v30/v31 docs, source, tests, fixtures, and generated assets. I reviewed the task-4 paths in the current checkout and did not alter unrelated files.
- The wrapper name `projectMainVerificationEvidenceDraftWriter` can still be misread as a file writer. The safety fields and docs make the no-write boundary explicit, so this is not a blocker.

## Suggested review registration details

- Task id: `task-4`
- Reviewer id: `codex-v31-task-4-reviewer-r2`
- Verdict: `approved`
- Evidence ref: `docs/plans/v31-task-4-review-evidence-2026-06-01.md`
- Failed command: none
