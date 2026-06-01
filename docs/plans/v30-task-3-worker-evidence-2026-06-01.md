# v30 task-3 worker evidence

Date: 2026-06-01  
Goal id: `v30-verified-adoption-workspace-v2`  
Task id: `task-3`  
Task title: `Adoption inspect and recovery view`  
Branch: `v30-task-3-adoption-inspect-and-recovery-view`

## User-visible value

After an adoption plan is frozen, Workbench shows a recovery view for the frozen adoption id. The view reads existing inspect output and shows journal state, adoption plan and patch refs, before/after hashes, current worktree match results, latest confirmation run context, and source run/evidence context.

## Implementation summary

- Added a Workbench read-only adoption inspect route descriptor for `GET /api/adoptions/<adoption-id>/inspect`.
- The Workbench client derives the inspect route from the latest active-goal `goal-operation-runs.v1` entry with `commandKind: "adoption-plan"`.
- The Workbench model projects `symphony.console-adoption-inspect` into `adoptionInspectRecoveryWorkspace`, including journal status, patch hash, before/after file hashes, worktree match booleans, latest confirmation run, and copy-only recovery commands.
- Added the Adoption Inspect and Recovery panel after the adoption plan freeze panel. The panel can refresh the same read-only inspect route and does not confirm or apply adoption.
- Hardened the inspect API path so query parameters and unsafe adoption ids return a controlled `error-envelope.v1` response.
- Extended API/client and shell tests for the inspect route, projection, UI panel, and boundary rejection.
- Updated Workbench/operator and product contract docs for the v30 inspect/recovery path.

## Files changed

Task-3 implementation and evidence:

- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `src/symphony/console.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v30-task-3-worker-evidence-2026-06-01.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-jAAl_uMe.css`
- `src/symphony/workbench-static/assets/index-B5sMEzXr.js`

Dirty checkout context already included v29/v30 task-1/task-2 files and generated static assets. I did not revert, clean, stash, force checkout, or discard those files.

## Workbench user path changed

Open Workbench, use the active goal Adoption path, freeze an adoptable implementation run, then inspect the frozen adoption state in `Adoption inspect and recovery view`. The panel uses the scoped active-goal operation registry to locate the frozen `adoptionPlanId` and reads `/api/adoptions/<adoption-id>/inspect`.

## Command results

`pnpm check`

- Exit code: 0
- Result: `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`

`pnpm test`

- Exit code: 0
- Result: 743 tests, 115 suites, 743 pass, 0 fail, duration `6445.063875ms`.

`pnpm workbench:build`

- Exit code: 0
- Result: Vite build completed in 56 ms. Generated `src/symphony/workbench-static/index.html`, `assets/index-jAAl_uMe.css`, and `assets/index-B5sMEzXr.js`.

`git diff --check`

- Exit code: 0
- Result: no output.

`pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Result: `goal-progress-ledger.v1`; 5 total tasks, 2 completed tasks, 0 blocked tasks, 0 needs-review tasks, 0 needs-revision tasks, releaseReady `false`.
- Task state: task-1 `main-verified` from `evt_f6dd021ead55a7a3`; task-2 `main-verified` from `evt_5c3aee92ea3328de`; task-3 `planned` from `goal-runbook.v1` with no worker evidence ref.

`pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Result: `goal-next-action.v1`; status `action-required`; next task `task-3`, role `worker`, phase `implement`.
- Reason: `No explicit worker evidence is recorded for task-3.`
- After completion allows `worker.evidence-recorded`, `worker.self-check-passed`, and `worker.self-check-failed`.

Additional focused checks:

- `pnpm test -- tests/workbench-api-client.test.js`: exit code 0, 37 tests passed.
- `pnpm test -- tests/workbench-shell.test.js`: exit code 0, 24 tests passed.

## Boundary and fallback notes

- Branch checkout was already `v30-task-3-adoption-inspect-and-recovery-view`; no branch fallback was needed.
- The checkout was intentionally dirty with v29/v30 task-1/task-2 work and evidence. I worked with existing changes and did not revert unrelated files.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, self-approve, confirm adoption, or infer review/main/release readiness.
- Task-3 uses existing `symphony adopt --inspect <adoption-id> --json` read-only semantics through the existing inspect route.
- The inspect route rejects query parameters and unsafe adoption ids; Workbench derives adoption id from active-goal adoption-plan operation state, not user path input.
- I did not register goal events, reviewer verdicts, main verification gates, release gates, merge, push, tag, publish, or declare release readiness.
- I did not self-approve and did not declare review, main verification, or release readiness.

## Residual risks

- The Workbench inspect view depends on a confirmed `commandKind: "adoption-plan"` operation being present in `goal-operation-runs.v1`. Without that operation, the panel remains in `waiting-for-frozen-plan`.
- The inspect output reports hash matches from the current worktree. A later local edit can change those booleans without changing the frozen plan.
- The current checkout includes prior v29/v30 files and generated assets. Review should separate task-3 behavior from existing dirty context.

## Recovery steps

- If the recovery panel is unavailable, first confirm that the adoption plan freeze operation exists in `/api/goals/<goal-id>/operations`.
- If the panel shows a failed inspect route, run `symphony adopt --inspect <adoption-id> --json` in the terminal using the same adoption id and inspect the error.
- If current worktree match booleans are unexpected, compare `currentWorktreeMatchesAfterHashDetails.files[]` and `currentWorktreeMatchesJournalBeforeFilesDetails.files[]` against the frozen file operations.
- The controller can register `worker.evidence-recorded` with this evidence ref.
