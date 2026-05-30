# v20 Task 1 Review Evidence

Date: 2026-05-31
Goal ID: `v20-goal-workbench-active-goal-surface`
Task ID: `task-1`
Task title: Latest goal command inventory and Workbench view model
Reviewer role: independent reviewer

## Verdict

APPROVED

## Findings

No blocking findings.

The current diff satisfies the task acceptance:

- Workbench projects an `ActiveGoalViewModel` from goal progress, next action, prompt pack, and closeout report contract results.
- The active goal command inventory uses `goal-status`, `goal next`, `goal prompt`, and `goal closeout` as its baseline.
- The old `scan` / `do` / `review` / `verify` / `status` / `continue` / `artifacts` command list is not used as the Active Goal ViewModel command inventory.

## Files Checked

- `docs/plans/v20-task-1-worker-evidence-2026-05-29.md`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `src/symphony/goal-progress-ledger.js`
- `frontend/workbench/index.html`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CC2EAjZv.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/v19-goal-template.test.js`
- `fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json`
- `.symphony/goals/latest-active-goal.json`
- `.symphony/goals/runbooks/v20-goal-workbench-active-goal-surface.json`

## Review Notes

`frontend/workbench/src/api/contracts.js` defines `ACTIVE_GOAL_COMMAND_BASELINE` with four command-backed sources:

- `goal-status` -> `goal-progress-ledger.v1`
- `goal next` -> `goal-next-action.v1`
- `goal prompt` -> `goal-prompt-pack.v1`
- `goal closeout` -> `goal-closeout-report.v1`

`projectActiveGoalControl` now includes `viewModel: projectActiveGoalViewModel(...)`. The view model exposes model name, active goal id/title, baseline, command count, route states, status summary, next action fields, prompt counts, closeout counts, and the command inventory. It does not use the older v8 top-level command sequence as the command inventory.

`frontend/workbench/src/App.jsx` renders `ActiveGoalViewModelPanel` before the runbook, next action, prompt preview, and closeout panels. The panel lists the four source contracts and renders copy-only command text. It does not add browser buttons, forms, links, terminal controls, event registration controls, model invocation controls, or write controls.

`src/symphony/goal-progress-ledger.js` resolves `goal-status` from a managed runbook state when the requested goal or latest active goal points to one. For the current v20 active goal, `goal-status --goal v20-goal-workbench-active-goal-surface --json` returns `goal-progress-ledger.v1` for the v20 runbook.

The rebuilt static bundle contains `ActiveGoalViewModel` and the four latest goal commands. The old command list appears only in task acceptance/prompt text and explanatory notes, not as the Active Goal ViewModel command inventory.

## Contract Spot Checks

`pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json`

- Exit code: 0
- Contract: `goal-progress-ledger.v1`
- Goal id: `v20-goal-workbench-active-goal-surface`
- `summary.totalTasks`: 5
- `task-1.status`: `in-progress`
- `task-1.workerEvidenceRef`: `docs/plans/v20-task-1-worker-evidence-2026-05-29.md`

`pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json`

- Exit code: 0
- Contract: `goal-next-action.v1`
- Next task: `task-1`
- Next role: `reviewer`
- Reason: `Worker evidence exists for task-1 but reviewer verdict is missing.`

`pnpm --silent symphony goal prompt --goal v20-goal-workbench-active-goal-surface --next --markdown`

- Exit code: 0
- Returned the reviewer `/goal` prompt for `task-1`.
- The parent review prompt supplies the evidence path for this review: `docs/plans/v20-task-1-review-evidence-2026-05-31.md`.

`pnpm --silent symphony goal closeout --goal v20-goal-workbench-active-goal-surface --json`

- Exit code: 0
- Contract: `goal-closeout-report.v1`
- `summary.totalTasks`: 5
- `summary.releaseReady`: false
- Missing items include task-1 review evidence and main verification, plus future task evidence and release gate gaps.

## Browser Check

Local read-only console was started with:

```bash
pnpm --silent symphony console --host 127.0.0.1 --port 8765
```

Browser check at `http://127.0.0.1:8765/workbench/`:

- Page title: `v20 Workbench`
- `ActiveGoalViewModel` visible.
- `goal-status`, `goal next`, `goal prompt`, and `goal closeout` visible in the active model area.
- Browser action controls: 0 buttons, 0 inputs, 0 links.

## Validation Command Results

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

Final summary:

```text
tests 661
suites 109
pass 661
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3510.90675
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:52907) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:52907) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:52907) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...
17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.28 kB
src/symphony/workbench-static/assets/index-D3K9Dk14.css    7.95 kB | gzip:   2.10 kB
src/symphony/workbench-static/assets/index-CC2EAjZv.js   636.30 kB | gzip: 119.40 kB

built in 138ms
```

### `git diff --check`

Exit code: 0

```text

```

## Blockers

None.

## Event Registration

No `symphony goal review` dry-run or confirm command was run by this reviewer. The parent controller should register the reviewer verdict if it accepts this evidence.
