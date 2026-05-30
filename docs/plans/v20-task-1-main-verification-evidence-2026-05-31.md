# v20 Task 1 Main Verification Evidence

Date: 2026-05-31
Goal ID: `v20-goal-workbench-active-goal-surface`
Task ID: `task-1`
Task title: Latest goal command inventory and Workbench view model
Verifier role: main-verifier subagent
Outcome: PASSED

## Prerequisite Evidence

Worker evidence exists:

- File: `docs/plans/v20-task-1-worker-evidence-2026-05-29.md`
- Event: `.symphony/goals/events/v20-goal-workbench-active-goal-surface.ndjson` line 1
- Event id: `evt_14357928597e3824`
- Event type: `worker.evidence-recorded`
- Evidence ref: `docs/plans/v20-task-1-worker-evidence-2026-05-29.md`

Reviewer approval evidence exists:

- File: `docs/plans/v20-task-1-review-evidence-2026-05-31.md`
- Review file verdict: `APPROVED`
- Event: `.symphony/goals/events/v20-goal-workbench-active-goal-surface.ndjson` line 2
- Event id: `evt_2c72602288fd7677`
- Event type: `reviewer.approved`
- Review verdict in event: `APPROVED`
- Evidence ref: `docs/plans/v20-task-1-review-evidence-2026-05-31.md`

`pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json` returned task-1 as `approved`, with `statusSource: goal-event-log.v1:evt_2c72602288fd7677`, worker evidence ref, review evidence ref, and `reviewVerdict: APPROVED`.

`pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json` returned `goal-next-action.v1` with next role `main-verifier` and reason `Reviewer approved task-1 but main verification is missing.`

## Checked Commit and Worktree

Checked commit:

```text
a5778f2c9749c0f87fefd0ed52ac9336f8d3f8b3
```

`git status --short --branch` before writing this evidence:

```text
## main...origin/main
 M frontend/workbench/index.html
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/contracts.js
 M src/symphony/goal-progress-ledger.js
 D src/symphony/workbench-static/assets/index-Duy8jdh2.js
 M src/symphony/workbench-static/index.html
 M tests/v19-goal-template.test.js
 M tests/workbench-api-client.test.js
 M tests/workbench-route-smoke.test.js
 M tests/workbench-shell.test.js
?? docs/plans/v20-task-1-review-evidence-2026-05-31.md
?? docs/plans/v20-task-1-worker-evidence-2026-05-29.md
?? docs/plans/workbench-v20-v28-goal-runbooks-combined-2026-05-29.md
?? docs/plans/workbench-v20-v28-goal-runbooks/
?? fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json
?? src/symphony/workbench-static/assets/index-CC2EAjZv.js
```

`git diff --stat` before writing this evidence:

```text
 frontend/workbench/index.html                      |     2 +-
 frontend/workbench/src/App.jsx                     |    88 +-
 frontend/workbench/src/api/contracts.js            |   172 +-
 src/symphony/goal-progress-ledger.js               |    85 +
 .../workbench-static/assets/index-Duy8jdh2.js      | 13307 -------------------
 src/symphony/workbench-static/index.html           |     4 +-
 tests/v19-goal-template.test.js                    |    53 +
 tests/workbench-api-client.test.js                 |    26 +
 tests/workbench-route-smoke.test.js                |     4 +-
 tests/workbench-shell.test.js                      |     3 +
 10 files changed, 428 insertions(+), 13316 deletions(-)
```

The worktree is dirty. I verified the current workspace state as-is and did not revert edits by other agents.

## Contract and File Checks

Files and contracts checked:

- `frontend/workbench/src/api/contracts.js`
  - Lines 20-49 define `ACTIVE_GOAL_COMMAND_BASELINE` with exactly `goal-status`, `goal next`, `goal prompt`, and `goal closeout`.
  - Lines 718-729 attach `viewModel: projectActiveGoalViewModel(...)` under the active goal control model.
  - Lines 755-826 project `ActiveGoalViewModel` from goal status, runbook, next action, prompt pack, and closeout report inputs.
  - Lines 829-855 render the command inventory from `ACTIVE_GOAL_COMMAND_BASELINE`.
- `frontend/workbench/src/App.jsx`
  - Lines 91-101 render `ActiveGoalViewModelPanel` before runbook, next action, prompt preview, and closeout panels.
  - Lines 251-288 render the model name, active goal fields, source contracts, route states, next action fields, prompt copy-only count, closeout count, and command-backed source inventory.
- `tests/workbench-api-client.test.js`
  - Lines 802-827 assert `ActiveGoalViewModel`, the four contract-backed commands, and absence of old top-level commands from the command inventory.
- `tests/workbench-shell.test.js`
  - Lines 27-38 assert no browser action controls or write API calls.
  - Lines 53-71 include the active goal model, runbook, next action, prompt preview, closeout, and command inventory components in the rendered source checks.
- `src/symphony/workbench-static/assets/index-CC2EAjZv.js`
  - Rebuilt static bundle contains `ActiveGoalViewModel` and the four latest goal commands.
- `src/symphony/goal-progress-ledger.js`
  - Lines 913-917 map explicit `reviewer.approved` events with evidence refs to approved ledger state.

The Workbench active goal model uses `latest-goal-command-contracts` as the baseline. The old `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` command list is not used as the ActiveGoalViewModel command inventory.

Additional contract spot checks:

- `pnpm --silent symphony goal prompt --goal v20-goal-workbench-active-goal-surface --next --json`
  - Exit code: 0
  - Contract: `goal-prompt-pack.v1`
  - Goal id: `v20-goal-workbench-active-goal-surface`
  - Returned one copy-only `main-verifier` prompt for task-1.
- `pnpm --silent symphony goal closeout --goal v20-goal-workbench-active-goal-surface --json`
  - Exit code: 0
  - Contract: `goal-closeout-report.v1`
  - Goal id: `v20-goal-workbench-active-goal-surface`
  - Task-1 missing item is the expected pre-gate `main-verification` gap.
  - Other missing items are future task evidence and release gates, not blockers for task-1 main verification.

## Validation Commands

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
duration_ms 3777.495459
```

### `pnpm workbench:build`

Exit code: 0

Result:

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.28 kB
src/symphony/workbench-static/assets/index-D3K9Dk14.css    7.95 kB | gzip:   2.10 kB
src/symphony/workbench-static/assets/index-CC2EAjZv.js   636.30 kB | gzip: 119.40 kB
built in 136ms
```

The command also printed three Node `ExperimentalWarning: WASI is an experimental feature and might change at any time` warnings.

### `git diff --check`

Exit code: 0

```text

```

No whitespace errors were reported.

## Outcome

PASSED.

Task-1 acceptance is satisfied in the current workspace:

- Workbench exposes `ActiveGoalViewModel`.
- The view model is backed by `goal-progress-ledger.v1`, `goal-next-action.v1`, `goal-prompt-pack.v1`, and `goal-closeout-report.v1`.
- The top-level active goal command inventory is `goal-status`, `goal next`, `goal prompt`, and `goal closeout`.
- The old `scan` / `do` / `review` / `verify` / `status` / `continue` / `artifacts` list is not the Workbench ActiveGoalViewModel baseline.
- Worker evidence and explicit `reviewer.approved` evidence both exist.
- Required validation commands all passed.

## Blockers

None for task-1 main verification.

No `symphony goal gate` dry-run or confirm command was run by this verifier. The parent controller should register the main-verification gate if it accepts this evidence.
