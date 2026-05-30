# v20 Task 2 Review Evidence

Date: 2026-05-31
Goal ID: `v20-goal-workbench-active-goal-surface`
Task ID: `task-2`
Task title: Active Goal Runbook panel and task queue

## Findings

1. Blocking: the live Workbench cannot read the active v20 goal event log through the scoped event route.
   - `GET /api/goals/v20-goal-workbench-active-goal-surface/events` returns `404 goal-not-found` even though `.symphony/goals/events/v20-goal-workbench-active-goal-surface.ndjson` exists and contains task events.
   - Browser check at `http://127.0.0.1:8766/workbench/` showed the first panels are `Active Goal Runbook`, `Active Goal Task Queue`, `ActiveGoalViewModel`, `Next Action Card`, `Prompt Preview`, and `Closeout Gaps`, but the active events route is failed.
   - The task queue status still comes from `goal-progress-ledger.v1`, including `statusSource: goal-event-log.v1:evt_f1307fc38030c9d5` for `task-2`. However, the queue cannot render `latestEventId`, `latestEventType`, or `latestEventSequence` from `goal-event-log.v1` for the actual active v20 goal.
   - This leaves the event-backed part of the task state incomplete in the real Workbench path. The projection test uses synthetic `activeGoalEvents` data and does not catch the route gap.

2. Non-blocking but related: managed-runbook ledger rows for untouched tasks keep `statusSource: v17-template-no-events` after any event exists for the goal.
   - In the live v20 progress payload, `task-3`, `task-4`, and `task-5` are planned from the managed runbook but report `v17-template-no-events`.
   - This is not frontend inference, but the source label is misleading for a v20 managed runbook surface.

## Validation Commands

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
tests 662
suites 109
pass 662
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4594.261459
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:77530) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:77530) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:77530) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...
17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.27 kB
src/symphony/workbench-static/assets/index-heZv0jz2.css    8.24 kB | gzip:   2.14 kB
src/symphony/workbench-static/assets/index-rKukkB3g.js   644.22 kB | gzip: 120.44 kB

built in 145ms
```

### `git diff --check`

Exit code: 0

```text
```

## Files And Contracts Inspected

- `docs/plans/v20-task-2-worker-evidence-2026-05-31.md`
- `docs/plans/workbench-v20-v28-goal-runbooks-combined-2026-05-29.md`
- `fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json`
- `.symphony/goals/runbooks/v20-goal-workbench-active-goal-surface.json`
- `.symphony/goals/events/v20-goal-workbench-active-goal-surface.ndjson`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/console.js`
- `src/symphony/goal-progress-ledger.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `tests/v19-goal-template.test.js`
- Contracts checked: `goal-runbook.v1`, `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, `goal-prompt-pack.v1`, `goal-closeout-report.v1`, `managed-goal-runbook-state.v1`, `managed-active-goal-pointer.v1`.

## Revision Instructions

- Make `GET /api/goals/<managed-goal-id>/events` resolve managed runbook goals, including `v20-goal-workbench-active-goal-surface`, and return `goal-event-log.v1` with the managed runbook goal title and baseline. Preserve the existing safe route parsing, traversal rejection, and registered-template behavior.
- Add route smoke or integration coverage that creates or uses a managed runbook with events, then verifies both `/api/goals/<managed-goal-id>/progress` and `/api/goals/<managed-goal-id>/events` return contracts for the same active goal.
- Update the Workbench test path so the actual active goal task queue receives event-log data from the backend route, not only from synthetic projection fixtures.
- Prefer a managed-runbook status source such as `goal-runbook.v1` for planned runbook tasks that have no task event yet, instead of leaking `v17-template-no-events` into the v20 managed goal ledger.
- Re-run `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check`, then update worker evidence with the revision summary.

## Verdict

NEEDS_REVISION

## Blockers

- Active v20 goal event log is not available through the scoped Workbench API route, so the task queue cannot render event-backed markers from `goal-event-log.v1` in the real active-goal path.
