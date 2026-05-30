# v20 Task 2 Worker Revision Evidence - 2026-05-31

## Summary

- Fixed scoped managed-goal event routing. `GET /api/goals/<managed-goal-id>/events` now resolves managed runbook state before falling back to static goal templates.
- Confirmed the real active v20 route returns `goal-event-log.v1`: `/api/goals/v20-goal-workbench-active-goal-surface/events` returned `200`, `eventCount: 5`, `lastSequence: 5`, and `lastEventId: evt_5db4611d7ac43b34`.
- Kept the Active Goal task queue sourced from explicit contracts: runbook task order from `goal-runbook.v1`, status from `goal-progress-ledger.v1`, latest event fields from backend `goal-event-log.v1`, and next role from `goal-next-action.v1`.
- Changed planned managed-runbook tasks that have no task event yet to use `statusSource: goal-runbook.v1` when the ledger is built from a managed runbook plus events.

## Files Changed

- `src/symphony/console.js`: added managed runbook resolution for explicit scoped goal events routes.
- `src/symphony/goal-progress-ledger.js`: preserved managed runbook task status source as `goal-runbook.v1` for untouched tasks in event-backed ledgers.
- `tests/v18-console-events-api.test.js`: added managed runbook progress plus scoped events route coverage.
- `tests/workbench-api-client.test.js`: added backend-backed Workbench coverage proving the task queue receives `latestEventId`, `latestEventType`, and `latestEventSequence` from the scoped events API.
- `tests/workbench-route-smoke.test.js`: added explicit active managed progress and events route smoke coverage.
- `src/symphony/workbench-static/index.html` and `src/symphony/workbench-static/assets/`: refreshed by `pnpm workbench:build`.
- `docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md`: this evidence file.

Existing task-1 and task-2 worktree changes were left in place.

## Validation Results

| Command | Result |
|---|---|
| `pnpm check` | Exit 0. `node --check` completed for source, scripts, plugins, and tests with no syntax errors. |
| `pnpm test` | Exit 0. Node test runner reported `tests 664`, `pass 664`, `fail 0`, `duration_ms 3762.739167`. |
| `pnpm workbench:build` | Exit 0. Vite built `src/symphony/workbench-static/index.html`, `assets/index-heZv0jz2.css`, and `assets/index-rKukkB3g.js`. |
| `git diff --check` | Exit 0. No whitespace errors. |

## Additional Route Check

| Command | Result |
|---|---|
| `node --input-type=module ... fetch /api/goals/v20-goal-workbench-active-goal-surface/events` | Exit 0. Returned `status: 200`, `contractName: goal-event-log.v1`, `goalId: v20-goal-workbench-active-goal-surface`, `eventCount: 5`, `lastSequence: 5`, `lastEventId: evt_5db4611d7ac43b34`, `lastEventType: reviewer.needs-revision`. |

## Blockers

None.

## Reviewer Handoff

- Re-check the reviewer-blocking route directly: `/api/goals/v20-goal-workbench-active-goal-surface/events` should return the managed event journal instead of `404 goal-not-found`.
- In Workbench, the Active Goal task queue should show backend event fields for event-backed tasks through the `activeGoalEvents` route.
- Untouched managed-runbook tasks should show planned status from `goal-runbook.v1`, not `v17-template-no-events`.
