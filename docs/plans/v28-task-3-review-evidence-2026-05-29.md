# v28 task-3 independent review evidence

Goal id: `v28-workbench-v1-release`
Task id: `task-3`
Task title: `Golden path E2E`
Review date: 2026-05-29
Reviewer role: independent reviewer
Verdict: APPROVED

## Reviewed files

- `docs/plans/workbench-v20-v28-goal-runbooks/v28_workbench-v1-release_goal_runbook_latest.md`
- `docs/plans/v28-task-3-worker-evidence-2026-05-29.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/console.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/workbench-route-smoke.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-B9IfCFVY.css`
- `src/symphony/workbench-static/assets/index-DTyFVtHT.js`

## Independent checks

The Workbench now exposes a first-screen `Golden Path` panel before the older detail panels. The panel renders seven ordered steps: `goal init/status`, `goal next`, `goal prompt`, `worker event`, `review`, `main verification`, and `closeout gaps`. The static bundle contains the same projection, so the built Workbench route serves the user-visible path.

The path uses the existing goal/runbook contracts and controlled Workbench routes. `frontend/workbench/src/api/client.js` keeps readonly contract fetches on `GET`; event writes go through `fetchGoalEventPlanPreview` and `confirmGoalEventPlan`. `src/symphony/console.js` constrains event plan preview/confirm to `update`, `review`, and `gate`, requires JSON confirm bodies, and returns append-only `goal-event-confirmation.v1` responses with `genericShellRunner: false`.

The task-3 E2E test uses a temporary `.symphony` state directory. It initializes the v28 runbook fixture, seeds task-1 and task-2 completion in temp state, then drives task-3 through controlled worker evidence registration and reviewer approval. After reviewer approval it verifies the main-verification gate command/readiness and checks that closeout reports a `main-verification` gap for task-3. It does not write events to the real v28 goal.

I did not find task approval or release readiness inferred from filenames, branch names, commits, prompt text, or frontend-only heuristics. The reviewed projections continue to source status from `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, and `goal-closeout-report.v1`. The Workbench navigation does not use the v8 `scan/do/review/verify/status/continue/artifacts` command list as the top-level model.

## Boundary notes

- I did not register a real `goal review` event for task-3.
- Current checkout is `v27-task-5-review-revision-tests-docs`, matching the worker evidence branch fallback note, not the runbook's nominal `v28-task-3-golden-path-e2e` branch. I treated the current workspace diff as the review target because the user explicitly provided this workspace.
- The task-3 E2E proves worker and reviewer registration by actually confirming controlled events in temp state. For main verification it checks readiness and the `goal gate` command/gap, not a confirmed main-verification event for task-3. Existing v21 API tests cover controlled gate confirmation separately. This is acceptable for this task because Workbench must not claim main verification or release readiness from the frontend path.
- Approval scope is only task-3 Workbench golden path implementation and tests. This does not mark task-3 main-verified and does not declare release ready.

## Command results

### `pnpm check`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: `0`

```text
tests 733
suites 115
pass 733
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 6686.435708
```

Relevant passing tests observed in the full run:

```text
✔ runs the v28 golden path through managed goal routes and controlled event registration (110.253833ms)
✔ renders the v28 Workbench state header and navigates first-screen user paths (174.663708ms)
✔ confirms main verification passed and failed gates and rejects incomplete gate input (16.2965ms)
```

### `pnpm workbench:build`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-B9IfCFVY.css   19.66 kB │ gzip:   3.58 kB
src/symphony/workbench-static/assets/index-DTyFVtHT.js   847.93 kB │ gzip: 157.32 kB

✓ built in 51ms
```

### `git diff --check`

Exit code: `0`

```text
<no output>
```

## Acceptance assessment

APPROVED for task-3. The implemented Workbench path is user-visible, acceptance-testable, and backed by controlled contracts/routes rather than a browser shell runner. The tests exercise the managed Workbench path with temp-state event registration and include guardrails against frontend heuristic approval, real-goal writes, and v8 top-level command regression.
