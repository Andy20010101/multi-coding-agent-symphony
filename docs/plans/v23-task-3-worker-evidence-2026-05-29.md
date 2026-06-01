# v23 task-3 worker evidence

- Goal id: `v23-goal-operation-run-console`
- Task id: `task-3`
- Branch from runbook: `v23-task-3-near-live-log-polling`
- Current checkout during this worker run: `main...origin/main [ahead 26]`
- User-visible value: 长一点的 goal operation 不再只显示静态结果；Workbench 的 Goal Operation Console 会近实时刷新受控 operation output、status、plan hash、event ids 和 next action。

## Implementation summary

Task-3 adds near-live polling to the v23 Goal Operation Console path without introducing a terminal emulator or shell runner.

The Workbench now:

- Polls the active goal operation console every `2500` ms after the scoped operations route is available.
- Re-reads the existing controlled Workbench contracts through `fetchWorkbenchContracts()`, so stdout/stderr-style output, operation status, plan hash, event ids, timestamps, and next action refresh while the user is watching.
- Shows `polling.enabled`, `polling.intervalMs`, `polling.route`, and `polling.reason` in the Goal Operation Console.
- Keeps all writes on the existing controlled event preview/confirm path. Polling is read-only and does not append goal events.

## Files changed for task-3

- `frontend/workbench/src/App.jsx`: adds the scoped Goal Operation Console polling loop and displays polling fields.
- `frontend/workbench/src/api/contracts.js`: projects polling metadata from `goal-operation-runs.v1` and includes the active operations route in route state.
- `tests/workbench-api-client.test.js`: asserts polling metadata is derived from the operation registry route.
- `tests/workbench-shell.test.js`: asserts the poller uses the scoped Workbench contract refresh path and does not add terminal execution surfaces.
- `docs/workbench-operator-guide.md`: documents near-live operation polling and its read-only boundary.
- `docs/symphony-product-contracts.md`: documents that polling is a read-only refresh of managed operation contracts.
- `src/symphony/workbench-static/index.html` and `src/symphony/workbench-static/assets/index-WMd6N9-y.js`: updated by `pnpm workbench:build`.

Pre-existing task-1 and task-2 worktree changes were present before this worker run and were left intact.

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
ℹ tests 703
ℹ suites 112
ℹ pass 703
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3728.141959
```

Focused task-3 test run before the full suite:

```text
pnpm test tests/workbench-api-client.test.js tests/workbench-shell.test.js
ℹ tests 38
ℹ suites 3
ℹ pass 38
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 99.725917
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
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-Chgh8Clk.css   14.28 kB │ gzip:   2.91 kB
src/symphony/workbench-static/assets/index-WMd6N9-y.js   749.15 kB │ gzip: 139.54 kB

✓ built in 149ms
```

Node printed the existing WASI experimental warning during the build.

### `git diff --check`

Exit code: `0`

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json`

Exit code: `0`

```text
goalId: v23-goal-operation-run-console
goalTitle: v23 Goal Operation Run Console
generatedAt: 2026-05-31T04:20:42.139Z
summary.totalTasks: 5
summary.completedTasks: 2
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1.status: main-verified
task-2.status: main-verified
task-3.status: planned
task-4.status: planned
task-5.status: planned
nextActions[0].label: Start task-3
nextActions[0].command: pnpm check
```

## Boundary notes

- Workbench remains on the latest goal/runbook/next-action command surface.
- The polling path re-reads controlled Workbench contracts; it does not add a generic shell runner, terminal emulator, arbitrary command input, WebSocket, EventSource, model call, merge, tag, or auto-approval path.
- Operation registry entries and polling status are not worker evidence, reviewer approval, main verification, release gate evidence, or release readiness.
- This worker did not approve its own work and did not perform reviewer, main-verifier, or release-manager duties.
- Task-1 and task-2 changes already in the worktree were preserved.

## Reviewer handoff checklist

- Check that `GoalOperationConsolePanel` shows polling fields and still renders command preview, stdout, stderr, exit code, plan hash, event ids, and next action from controlled contracts.
- Check that `App.jsx` polling calls `fetchWorkbenchContracts()` on a fixed interval only after `goal-operation-runs.v1` is available.
- Check that polling is read-only and does not add shell execution, terminal emulation, WebSocket/EventSource streaming, auto-approval, or release-ready inference.
- Check that `tests/workbench-api-client.test.js` and `tests/workbench-shell.test.js` cover the near-live polling surface.
- Check the build output asset update from `pnpm workbench:build`.

## Worker event registration

Registered only `worker.evidence-recorded` for task-3 with this evidence ref.

Dry-run command:

```text
pnpm --silent symphony goal update --goal v23-goal-operation-run-console --task task-3 --event worker.evidence-recorded --actor codex-v23-task-3-worker --evidence-ref docs/plans/v23-task-3-worker-evidence-2026-05-29.md --dry-run --json
```

Dry-run result:

```text
mode: dry-run
planId: plan_dacb88de47c037b2
planHash: sha256:91008a6a16778fb2cf57b45e2f4b4389c4d2f639f3e8fcc34dce2fcdb2cd0a5e
validation.status: ok
wouldAppend.writesInDryRun: false
ledgerPreview.changes[0].taskId: task-3
ledgerPreview.changes[0].toStatus: needs-review
```

Confirm command:

```text
pnpm --silent symphony goal update --goal v23-goal-operation-run-console --task task-3 --event worker.evidence-recorded --actor codex-v23-task-3-worker --evidence-ref docs/plans/v23-task-3-worker-evidence-2026-05-29.md --confirm --plan-hash sha256:91008a6a16778fb2cf57b45e2f4b4389c4d2f639f3e8fcc34dce2fcdb2cd0a5e --json
```

Confirm result:

```text
mode: confirm
status: appended
written: true
appendOnly: true
eventId: evt_dacb88de47c037b2
eventType: worker.evidence-recorded
taskId: task-3
actor.id: codex-v23-task-3-worker
sequence: 7
eventHash: sha256:9f69533dd9f5d64266fa640c38b75c15b33483ed3c795605b41f7c91f1e29998
```
