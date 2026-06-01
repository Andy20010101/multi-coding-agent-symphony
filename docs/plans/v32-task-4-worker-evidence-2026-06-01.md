# v32 task-4 worker evidence

Date: 2026-06-01  
Goal id: `v32-release-manager-workspace-v2`  
Release: `v32 Release Manager Workspace v2`  
Task id: `task-4`  
Task title: `Release.ready closeout confirm`

## Checkout

- Current checkout: `v30-task-3-adoption-inspect-and-recovery-view`.
- The worktree was dirty before this task-4 pass, with shared v29-v32 docs, tests, Workbench source, backend source, and static build artifacts already present.
- I used the repo-local/current-checkout fallback. I did not clean, stash, reset, revert, switch branches, pull, merge, push, tag, publish, stage, commit, or overwrite unrelated changes.
- Read-only goal state during validation reported task-4 worker evidence already present in the managed event log: `goal-status` showed task-4 `status: "in-progress"` with `statusSource: "goal-event-log.v1:evt_57b3ac130d866ca0"` and worker evidence ref `docs/plans/v32-task-4-worker-evidence-2026-06-01.md`. I did not register that event.

## Implementation summary

- The current Workbench Closeout Gaps path exposes `ReleaseReadyGateRegistration` only through the existing `goal-update-plan.v1` dry-run and plan-hash confirm flow for `symphony goal gate --gate release.ready --status declared`.
- The release-ready form is available only when the release baseline is not blocked, all runbook-required release gates are `passed`, and `goal-closeout-report.v1` has no missing items other than `release.ready-declared`.
- The confirm response contract refreshes `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, and `goal-closeout-report.v1`; the UI now states that closeout is refreshed during confirm and displays refreshed closeout missing count plus releaseReady status.
- Existing API coverage verifies that after a controlled `release.ready` dry-run and matching plan-hash confirm, refreshed closeout reports `summary.releaseReady: true` and `missing.length: 0`.
- The browser still does not execute release validation commands, run shell, invoke models, open local files, download artifacts, merge, push, tag, publish, self-approve, or infer release readiness from filenames, branches, commits, prompts, test names, or frontend state.

## User path

Open Workbench -> Active Goal -> Closeout Gaps -> `release.ready gate registration`.

Blocked state:

- Dirty/non-main or diverged baseline comes from `ReleaseBaselineResolver` and shows stop/fix guidance.
- Pending release gates appear in `pendingRequiredReleaseGateIds`.
- Missing worker, review, main verification, or release gate evidence appears as closeout blocking gaps.
- No `release.ready` form is rendered while these blockers remain.

Available state:

- The form fixes `gateName` to `release.ready` and `gateStatus` to `declared`.
- The operator supplies the release manager verifier id and evidence ref, previews the dry-run plan, checks the returned `planHash`, then confirms with the same fields.
- After confirm, Workbench displays the backend refreshed closeout contract, including missing count and releaseReady status. It does not create a local release-ready state.

## Files changed

Task-4 worker-pass edits:

- `frontend/workbench/src/App.jsx` - confirm loading copy now includes closeout refresh.
- `tests/workbench-shell.test.js` - source-level assertion covers the closeout refresh text in event confirm forms.
- `docs/plans/v32-task-4-worker-evidence-2026-06-01.md` - this evidence file.

Task-4 implementation surface already present in the current dirty checkout and validated by this worker pass:

- `frontend/workbench/src/api/contracts.js`
- `src/symphony/console.js`
- `tests/workbench-api-client.test.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`

Build output refreshed by `pnpm workbench:build`:

- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BY5UaxlX.css`
- `src/symphony/workbench-static/assets/index-Br7sQ7ot.js`

Pre-existing static asset deletions remained in the worktree:

- `src/symphony/workbench-static/assets/index-B9IfCFVY.css`
- `src/symphony/workbench-static/assets/index-NKKg_tJp.js`

## Commands run

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | Node syntax check passed for source, scripts, plugins, and tests. |
| `pnpm test` | 0 | Full suite passed: 759 tests, 116 suites, 0 failures. |
| `pnpm workbench:build` | 0 | Vite build succeeded; static output now includes `assets/index-Br7sQ7ot.js` and `assets/index-BY5UaxlX.css`. |
| `git diff --check` | 0 | No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | Returned `goal-progress-ledger.v1`; tasks 1-3 are `main-verified`, task-4 is `in-progress` with worker evidence ref, task-5 is `planned`, `releaseReady` is `false`, release gates are `unknown`. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Returned `goal-next-action.v1`; next action is task-4 reviewer, phase `review`, reason `Worker evidence exists for task-4 but reviewer verdict is missing.` |

## Boundary notes

- I did not run `symphony goal update`, `symphony goal review`, `symphony goal gate`, or `symphony goal closeout`.
- I did not register worker evidence, reviewer verdict, main verification, release gate evidence, or `release.ready`.
- I did not declare release readiness. Current read-only goal-status still reports `releaseReady: false`.
- The Workbench main path remains the latest goal/runbook/next-action flow; v8 compatibility commands are not presented as the top-level Workbench model.
- The `release.ready` declaration path reuses the controlled `goal gate` dry-run plus plan-hash confirm path. It is not a shell runner, browser terminal, model invocation path, permission system, new goal framework, artifact framework, or command DSL.
- The closeout requirement is verified through backend-confirm test coverage and the refreshed `goal-closeout-report.v1` fields returned after confirm, not through closeout prose or frontend inference.

## Reviewer handoff checklist

- Check `frontend/workbench/src/api/contracts.js` for `projectReleaseReadyGateRegistration`, especially baseline blocking, required gate checks, and closeout blocking gap checks.
- Check `src/symphony/console.js` for `buildGoalEventPlanConfirmResponse` refreshing `goal-closeout-report.v1`.
- Check `frontend/workbench/src/App.jsx` for the release-ready form rendering and closeout refresh feedback.
- Check `tests/v21-goal-plan-preview-api.test.js` for the controlled `release.ready` dry-run and confirm path with refreshed closeout `missing.length === 0`.
- Check `tests/workbench-api-client.test.js` and `tests/workbench-shell.test.js` for Workbench projection and browser-boundary coverage.
- Confirm no tag, push, publish, merge, arbitrary shell execution, local file open, artifact download, self-approval, or release-ready inference path was introduced.
