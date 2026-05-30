# v20 Task 2 Revision Review Evidence

Date: 2026-05-31
Goal ID: `v20-goal-workbench-active-goal-surface`
Task ID: `task-2`
Task title: Active Goal Runbook panel and task queue

## Findings

- No blocking findings.
- No non-blocking findings requiring worker revision.

## Revision Checks

- `GET /api/goals/v20-goal-workbench-active-goal-surface/events` now resolves the managed active runbook and returns `goal-event-log.v1`, not `404`.
- The backend route/projection probe returned `eventsStatus: 200`, `eventsContract: goal-event-log.v1`, `eventsGoalId: v20-goal-workbench-active-goal-surface`, `eventsCount: 6`, `lastSequence: 6`, `lastEventId: evt_8aedc69f0fb8926e`, and `lastEventType: worker.evidence-recorded`.
- The same probe returned `progressStatus: 200`, `progressContract: goal-progress-ledger.v1`, `progressGoalId: v20-goal-workbench-active-goal-surface`, `task2LedgerStatus: needs-revision`, `task2LedgerStatusSource: goal-event-log.v1:evt_5db4611d7ac43b34`, and `task3LedgerStatusSource: goal-runbook.v1`.
- Workbench projection used the backend scoped events route: `activeEventsRouteState: ready`, `activeEventsRoutePath: /api/goals/v20-goal-workbench-active-goal-surface/events`, `task2QueueLatestEventId: evt_8aedc69f0fb8926e`, `task2QueueLatestEventType: worker.evidence-recorded`, and `task2QueueLatestEventSequence: 6`.
- The first Workbench workflow section renders `Active Goal Runbook` and `Active Goal Task Queue` before the supporting ActiveGoalViewModel, next action, prompt preview, and closeout panels.
- Managed runbook tasks without task events now use `statusSource: goal-runbook.v1` in the event-backed ledger path inspected for task-3.

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
ℹ tests 664
ℹ suites 109
ℹ pass 664
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3479.244792
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:99672) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:99672) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:99672) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-heZv0jz2.css    8.24 kB │ gzip:   2.14 kB
src/symphony/workbench-static/assets/index-rKukkB3g.js   644.22 kB │ gzip: 120.44 kB

✓ built in 137ms
```

### `git diff --check`

Exit code: 0

```text
```

## Files And Contracts Inspected

- `docs/plans/v20-task-2-worker-evidence-2026-05-31.md`
- `docs/plans/v20-task-2-review-evidence-2026-05-31.md`
- `docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md`
- `.symphony/goals/latest-active-goal.json`
- `.symphony/goals/runbooks/v20-goal-workbench-active-goal-surface.json`
- `.symphony/goals/events/v20-goal-workbench-active-goal-surface.ndjson`
- `fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json`
- `src/symphony/console.js`
- `src/symphony/goal-progress-ledger.js`
- `src/symphony/goal-runbook-context.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/v18-console-events-api.test.js`
- `tests/v19-goal-template.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- Contracts checked: `goal-runbook.v1`, `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, `goal-prompt-pack.v1`, `goal-closeout-report.v1`, `managed-goal-runbook-state.v1`, `managed-active-goal-pointer.v1`.

## Verdict

APPROVED

## Blockers

None.
