# v21 task-2 worker evidence

Goal id: `v21-goal-event-registration-workbench`  
Task id: `task-2`  
Branch: `v21-task-2-dry-run-plan-preview-endpoint`  
User-visible value: Workbench users can preview a goal event registration dry-run plan in the UI before using the confirm flow.

## Implementation summary

- Added `GET /api/goals/<goal-id|latest>/event-plan-preview`.
- The route accepts only `command=update`, `command=review`, or `command=gate` with the matching goal event fields.
- The route calls the existing `buildGoalUpdatePlan`, `buildGoalReviewPlan`, and `buildGoalGatePlan` functions directly. It does not run shell commands.
- The response remains `goal-update-plan.v1` and adds `eventSummary` plus `previewEndpoint` metadata for Workbench display.
- Added a Workbench dry-run preview control to the existing goal event form model. It collects the form fields, calls the preview route with `GET`, displays `planHash`, event summary fields, and the copy-only confirm command.
- Updated tests and docs for the v21 exception: dry-run preview is allowed; confirm/event append is not part of task-2.

## Files changed

- `src/symphony/console.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DEdDu08W.css`
- `src/symphony/workbench-static/assets/index-Ur7gsvXy.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`

Removed stale Workbench build assets:

- `src/symphony/workbench-static/assets/index-DQwHi8dj.css`
- `src/symphony/workbench-static/assets/index-THFje-ok.js`

## Commands run

`node --test tests/v21-goal-plan-preview-api.test.js`

Result: exit code 0.

```text
tests 3
suites 1
pass 3
fail 0
```

`node --test tests/workbench-shell.test.js`

Result: exit code 0.

```text
tests 11
suites 2
pass 11
fail 0
```

`node --test tests/workbench-route-smoke.test.js`

Result: exit code 0.

```text
tests 11
suites 1
pass 11
fail 0
```

`pnpm check`

Result: exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: exit code 0.

```text
tests 674
suites 110
pass 674
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3544.96175
```

`pnpm workbench:build`

Result: exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DEdDu08W.css   10.70 kB | gzip:   2.47 kB
src/symphony/workbench-static/assets/index-Ur7gsvXy.js   671.25 kB | gzip: 125.23 kB

built in 140ms
```

`git diff --check`

Result: exit code 0, no output.

`pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Result: exit code 0.

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 1
summary.releaseReady: false
task-1.status: main-verified
task-2.status: planned
task-2.statusSource: goal-runbook.v1
releaseGates: all unknown
nextActions[0].label: Start task-2
```

## Workbench user path changed

- In the Next Action Card event registration forms, the operator can fill the controlled goal update/review/gate fields and click `Preview dry-run plan`.
- Workbench calls `/api/goals/<goal-id>/event-plan-preview` with a `GET` request and displays the returned `planHash`, event summary, `writesInDryRun: false`, and the copy-only confirm command.
- The UI does not append events or mark task status from the preview.

## Boundary notes

- Did not add a generic shell runner.
- Did not add a generic safety, permission, goal, or artifact framework.
- Did not make v8 `scan/do/review/verify/status/continue/artifacts` the Workbench top-level action list.
- Did not infer task approval, main verification, or release readiness from file names, branch names, commit messages, or frontend heuristics.
- Did not register worker, reviewer, main-verifier, or release events.
- Worker did not self-approve.

## Reviewer handoff checklist

- Exercise update, review, and gate preview paths.
- Confirm `eventSummary.planHash` matches the returned `planHash`.
- Confirm preview errors use `error-envelope.v1` and do not expose local paths or source content.
- Confirm no event journal append occurs during preview.
