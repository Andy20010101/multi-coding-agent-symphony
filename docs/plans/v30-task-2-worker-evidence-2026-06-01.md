# v30 task-2 worker evidence

Date: 2026-06-01

Goal id: `v30-verified-adoption-workspace-v2`

Task id: `task-2`

Task title: Adoption plan preview workspace

Branch: `v30-task-2-adoption-plan-preview-workspace`

Checkout note: the checkout started dirty on `v29-task-4-operation-console-and-run-result-bridge`. I created the preferred task branch from that current checkout and did not clean, revert, stash, merge, push, tag, or discard existing changes. The clean-base branch setup from the runbook was not used because the delegated context explicitly described the dirty checkout as intentional; this worker used the repo-local/current-checkout fallback.

## Implementation summary

- Added a controlled backend route for `POST /api/goals/<goal-id|latest>/adoption-plan-freeze` in `src/symphony/console.js`.
- The route accepts only `goalId`, `taskId`, `sourceRunId`, and `operationId`, resolves the active goal/task context, validates the selected operation as a confirmed implementation run for the same goal/task, and requires explicit adoption candidate fields before calling existing `symphony adopt --run <confirmed-run-id> --json` semantics through the local CLI function.
- Successful freeze responses use `controlled-adoption-plan-freeze.v1`, include adoption plan id, patch artifact/hash, changed files, file operations, source workspace fingerprint, project/git fingerprints, inspect command, frozen confirmation command, and safety flags.
- Added `commandKind: "adoption-plan"` to the goal operation run registry and record the freeze as a scoped Workbench operation, without confirming adoption or applying the patch.
- Added Workbench API client support for the controlled freeze route.
- Added the Workbench Adoption plan preview workspace panel after the adoption candidate panel. The panel shows endpoint constraints, freeze candidates, latest freeze result, frozen plan from operation history, recovery notes, and safety fields.
- Updated product/operator docs for the controlled adoption plan freeze path.
- Added tests for the client wrapper, backend route validation, operation recording, projection, shell route allowlist, and Workbench static boundary.

## Files changed by this worker

- `src/symphony/console.js`
- `src/symphony/goal-operation-run-registry.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BUnbjJiI.css`
- `src/symphony/workbench-static/assets/index-WWvwL4k_.js`

Dirty checkout note: `git status --short --branch` also shows pre-existing v29/v30 evidence files, v30 fixtures, deleted older Workbench static assets, and `tests/v23-goal-operation-run-registry.test.js` modified from the incoming checkout. I did not revert or clean those files.

## Workbench user path changed

Workbench active goal view now has this path:

1. Open the active goal Workbench.
2. Use the v30 adoption candidate normalization panel to inspect explicit implementation-run candidates.
3. Use the new Adoption plan preview workspace panel.
4. Click `Freeze adoption plan` for an available candidate.
5. Review the frozen adoption plan summary: patch hash/artifact, affected files, file operations, fingerprints, inspect command, frozen confirm command, and recovery notes.

The path freezes an adoption plan. It does not confirm adoption, apply a patch to main, merge, push, tag, approve review, mark main verification, or infer release readiness.

## Acceptance command results

- `pnpm check`
  - Exit code: 0
  - Output: `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`

- `pnpm test`
  - Exit code: 0
  - Output summary: `tests 741`, `suites 115`, `pass 741`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 6243.697917`.

- `pnpm workbench:build`
  - Exit code: 0
  - Output summary: Vite transformed 17 modules and wrote `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-BUnbjJiI.css`, and `src/symphony/workbench-static/assets/index-WWvwL4k_.js`; build completed in 60ms.

- `git diff --check`
  - Exit code: 0
  - Output: no output.

- `pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`
  - Exit code: 0
  - Output summary: `goal-progress-ledger.v1`; `totalTasks: 5`; `completedTasks: 1`; `releaseReady: false`; task-1 is `main-verified`; task-2 remains `planned` with `workerEvidenceRef: null`; next action is `Start task-2` / `pnpm check`.
  - Boundary note: this worker did not register `worker.evidence-recorded`, so the ledger still shows task-2 worker evidence as missing.

## Extra checks

- `node --test tests/workbench-route-smoke.test.js`
  - Exit code: 0
  - Output summary: `tests 11`, `pass 11`, `fail 0`.

- `pnpm --silent exec node --check src/symphony/console.js && pnpm --silent exec node --check frontend/workbench/src/api/contracts.js && pnpm --silent exec node --check frontend/workbench/src/api/client.js && pnpm --silent exec node --check tests/workbench-api-client.test.js && node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`
  - Exit code: 0
  - Output summary: `tests 59`, `pass 59`, `fail 0`.

- Attempted partial syntax check including `frontend/workbench/src/App.jsx`
  - Command: `pnpm --silent exec node --check frontend/workbench/src/api/contracts.js && pnpm --silent exec node --check frontend/workbench/src/App.jsx && pnpm --silent exec node --check tests/workbench-api-client.test.js`
  - Exit code: 1
  - Outcome: Node reported `ERR_UNKNOWN_FILE_EXTENSION` for `.jsx`. This was replaced by `pnpm test` and `pnpm workbench:build`, both of which completed successfully.

## Boundary notes

- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, self-approve, confirm adoption, or infer readiness from filenames, branches, commits, prompt text, task titles, or frontend heuristics.
- The backend route maps only to existing `symphony adopt --run <confirmed-run-id> --json` plan semantics after scoped active-goal, active-task, operation, run, evidence, workspace fingerprint, and main-worktree-write validations.
- The Workbench projection avoids v8 `scan/do/review/verify/status/continue/artifacts` as a top-level action model.
- No generic shell runner, browser terminal, model invocation path, permission system, goal framework, artifact framework, command DSL, or generic safety layer was added.
- The new Workbench state changes come from backend command output and operation registry records; the frontend does not create adoption status from filenames, branch names, task titles, or prompt text.
- No goal events were registered by this worker.
- No review, main verification, release readiness, merge, push, tag, publish, or self-approval was declared by this worker.

## Reviewer handoff checklist

- Inspect `POST /api/goals/<goal-id|latest>/adoption-plan-freeze` validation and the `confirmControlledAdoptionPlanFreeze` path in `src/symphony/console.js`.
- Confirm the frontend panel uses only the controlled client wrapper and selected candidate payload fields.
- Confirm the route smoke static constraints still pass after the new Workbench click path.
- Confirm `commandKind: "adoption-plan"` is acceptable for `goal-operation-runs.v1` consumers.
- Confirm the Workbench static assets generated by `pnpm workbench:build` match the source changes.

## Residual risks and recovery

- The checkout includes intentional pre-existing v29/v30 dirty files. Review should separate this task-2 change set from the existing dirty checkout before any merge decision.
- The freeze route requires implementation operation records to include the expected v30 candidate fields, including source workspace fingerprint and evidence artifact references. Older operation rows without those fields are rejected rather than normalized by the UI.
- `symphony adopt --run` can still reject at runtime if the selected run or main-worktree boundary is invalid. Recovery is to inspect the error envelope in Workbench, run `symphony adopt --inspect <adoption-id> --json` for a frozen plan when one exists, and rerun from a valid confirmed implementation candidate.
- If the generated Workbench static asset hashes conflict with unrelated static changes in the dirty checkout, rerun `pnpm workbench:build` after isolating the final source set.
