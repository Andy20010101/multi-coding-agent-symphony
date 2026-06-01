# v27 task-3 review evidence

## Run context

- Goal id: `v27-review-revision-loop`
- Task id: `task-3`
- Task title: `Review verdict registration`
- Branch under review: `v27-task-3-review-verdict-registration`
- Review evidence path: `docs/plans/v27-task-3-review-evidence-2026-05-29.md`
- Worker evidence reviewed: `docs/plans/v27-task-3-worker-evidence-2026-05-29.md`
- User-visible value: review results can move the ledger.

## Worktree boundary

- Current branch matched the requested branch: `v27-task-3-review-verdict-registration`.
- `git log --oneline main..HEAD` and `git diff --name-only main...HEAD` returned no output, so the task changes are current worktree changes rather than commits above `main`.
- I reviewed the current checkout diff and did not revert unrelated earlier task or prior-version artifacts.
- The worker evidence says the worker registered `worker.evidence-recorded` itself. Controller normally owns that registration step. I did not treat it as a product blocker because the task-3 review verdict registration path is still correct and the worker did not register reviewer approval, main verification, or release readiness.
- I did not register a goal review event.

## Reviewed files

- `docs/plans/workbench-v20-v28-goal-runbooks/v27_review-revision-loop_goal_runbook_latest.md`
- `docs/plans/v27-task-3-worker-evidence-2026-05-29.md`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `src/symphony/console.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/v23-goal-operation-console-api.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- Workbench static build output under `src/symphony/workbench-static/`

## Independent findings

- The Workbench active goal path exposes review verdict registration in the Review Workspace. `projectReviewVerdictRegistration` builds only `reviewer.approved` and `reviewer.needs-revision` forms and marks `symphony goal review` as the registration command.
- The UI reuses the existing dry-run and confirm path. `ReviewVerdictRegistration` renders the shared `GoalEventFormList`; `GoalEventPlanPreview` calls the preview route, then posts the plan hash to the confirm route. On successful confirm it calls `refreshWorkbenchContracts`, so the displayed task state is fetched again from Workbench contracts rather than updated from local UI assumptions.
- Backend confirm is the controlled goal event path. `confirmGoalEventPlan` accepts only `update`, `review`, and `gate`; for `review` it calls `confirmGoalReview`, then `buildGoalEventPlanConfirmResponse` reloads goal progress, events, and next action.
- Approved and needs-revision handling are both present. The Review Workspace model creates two review forms. `tests/v21-goal-plan-preview-api.test.js` confirms both approved and needs-revision review verdicts and checks refreshed task status. `tests/v23-goal-operation-console-api.test.js` specifically confirms a needs-revision Workbench operation and checks the refreshed task becomes `needs-revision`.
- The Workbench primary path remains the latest/v19 goal/runbook/next-action flow. The task uses goal progress, goal events, goal next, goal prompt, and goal review. I did not find a return to the v8 `scan/do/review/verify/status/continue/artifacts` command surface as the Workbench primary action model.
- I did not find a generic safety layer, generic shell runner, permission system, new goal framework, or artifact framework added for this task. The added Workbench write path is the existing controlled event-plan confirm endpoint.
- The frontend does not infer approval or release readiness from filenames, branch names, commits, or prompt text. Review and main-verification readiness use explicit review events or event-backed ledger fields. Existing negative tests cover title, branch, and command text that look like approval but are not treated as verdicts.
- Tests cover the user path at three levels: model projection for the Review Workspace, shell wiring from the Review Workspace to controlled goal event forms and refresh, and backend API confirm refreshing task state.

## Commands run

### `pnpm check`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

...
✔ v23 Workbench goal operation console API (100.925083ms)
✔ v15 Workbench read-only API client (65.530125ms)
✔ v15 Workbench React/Vite shell (22.75725ms)
✔ v15 Workbench static serving (31.622083ms)

ℹ tests 722
ℹ suites 114
ℹ pass 722
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6788.297417
```

### `pnpm workbench:build`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-Cij6QcGP.css   16.38 kB │ gzip:   3.13 kB
src/symphony/workbench-static/assets/index-DPQlSPKW.js   815.86 kB │ gzip: 151.54 kB

✓ built in 50ms
```

### `git diff --check`

Result: passed, exit code 0.

```text
<no output>
```

## Verdict

APPROVED

Approval scope: task-3 review verdict registration only. This does not claim main verification, merge readiness, release readiness, or main branch verification.

## Blockers

None.
