# v20 Task 2 Main Verification Evidence - 2026-05-31

Goal: `v20-goal-workbench-active-goal-surface`  
Task: `task-2`  
Task title: Active Goal Runbook panel and task queue  
Verifier role: main-verifier subagent

## Outcome

PASSED

No goal events or gates were registered by this verifier.

## Required Evidence Confirmed

- Worker revision evidence exists at `docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md`.
- Reviewer revision evidence exists at `docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md`.
- Reviewer approval is explicit in `docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md`: `## Verdict` is `APPROVED`, with no blocking findings.
- The managed event journal `.symphony/goals/events/v20-goal-workbench-active-goal-surface.ndjson` contains task-2 revision events:
  - Sequence 6: `worker.evidence-recorded`, event `evt_8aedc69f0fb8926e`, evidence ref `docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md`.
  - Sequence 7: `reviewer.approved`, event `evt_6bf0ff28da09042b`, review verdict `APPROVED`, evidence ref `docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md`.

## Commit And Worktree State Checked

- Branch checked: `main`
- HEAD checked: `a5778f2c9749c0f87fefd0ed52ac9336f8d3f8b3`
- Worktree was already dirty before this evidence file was written. Existing edits were treated as the verification target and were not reverted.

`git status --short` before writing this evidence file:

```text
 M frontend/workbench/index.html
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/contracts.js
 M frontend/workbench/src/styles/workbench.css
 M src/symphony/console.js
 M src/symphony/goal-progress-ledger.js
 D src/symphony/workbench-static/assets/index-D3K9Dk14.css
 D src/symphony/workbench-static/assets/index-Duy8jdh2.js
 M src/symphony/workbench-static/index.html
 M tests/v18-console-events-api.test.js
 M tests/v19-goal-template.test.js
 M tests/workbench-api-client.test.js
 M tests/workbench-route-smoke.test.js
 M tests/workbench-shell.test.js
?? docs/plans/v20-task-1-main-verification-evidence-2026-05-31.md
?? docs/plans/v20-task-1-review-evidence-2026-05-31.md
?? docs/plans/v20-task-1-worker-evidence-2026-05-29.md
?? docs/plans/v20-task-2-review-evidence-2026-05-31.md
?? docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md
?? docs/plans/v20-task-2-worker-evidence-2026-05-31.md
?? docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md
?? docs/plans/workbench-v20-v28-goal-runbooks-combined-2026-05-29.md
?? docs/plans/workbench-v20-v28-goal-runbooks/
?? fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json
?? src/symphony/workbench-static/assets/index-heZv0jz2.css
?? src/symphony/workbench-static/assets/index-rKukkB3g.js
```

## Read-Only Goal State Checks

`pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json` exited 0 and returned `goal-progress-ledger.v1`.

Relevant exact fields:

```text
goalId: v20-goal-workbench-active-goal-surface
summary.totalTasks: 5
summary.completedTasks: 2
task-2.status: approved
task-2.statusSource: goal-event-log.v1:evt_6bf0ff28da09042b
task-2.workerEvidenceRef: docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md
task-2.reviewEvidenceRef: docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md
task-2.reviewVerdict: APPROVED
task-3.status: planned
task-3.statusSource: goal-runbook.v1
```

`pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json` exited 0 and returned `goal-next-action.v1`.

Relevant exact fields:

```text
status: action-required
next.taskId: task-2
next.role: main-verifier
next.phase: main-verification
reason: Reviewer approved task-2 but main verification is missing.
evidenceState.workerEvidenceRef: docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md
evidenceState.reviewEvidenceRef: docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md
afterCompletion.registerWith: symphony goal gate --gate main-verification
```

## Required Validation Commands

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

The runner printed passing test details. Final exact summary:

```text
ℹ tests 664
ℹ suites 109
ℹ pass 664
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3531.498375
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:6198) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6198) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:6198) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-heZv0jz2.css    8.24 kB │ gzip:   2.14 kB
src/symphony/workbench-static/assets/index-rKukkB3g.js   644.22 kB │ gzip: 120.44 kB

✓ built in 138ms
```

### `git diff --check`

Exit code: 0

```text
```

## Files And Contracts Checked

- `docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md`
- `docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md`
- `.symphony/goals/latest-active-goal.json`
- `.symphony/goals/runbooks/v20-goal-workbench-active-goal-surface.json`
- `.symphony/goals/events/v20-goal-workbench-active-goal-surface.ndjson`
- `fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `src/symphony/console.js`
- `src/symphony/goal-progress-ledger.js`
- `tests/v18-console-events-api.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`

Contracts checked: `managed-active-goal-pointer.v1`, `managed-goal-runbook-state.v1`, `goal-runbook.v1`, `goal-progress-ledger.v1`, `goal-event-log.v1`, and `goal-next-action.v1`.

## Acceptance Check

- `frontend/workbench/src/App.jsx` renders `ActiveGoalRunbookPanel` and `ActiveGoalTaskQueuePanel` first inside `primary-active-goal-grid`, before the supporting ActiveGoalViewModel, next action, prompt preview, closeout, and legacy read-only panels.
- `frontend/workbench/src/api/contracts.js` projects the Active Goal task queue from `goal-runbook.v1`, `goal-progress-ledger.v1`, `goal-event-log.v1`, and `goal-next-action.v1`. The queue item projection carries `status`, `statusSource`, `eventBacked`, `latestEventId`, `latestEventType`, and `latestEventSequence` from backend contracts.
- `frontend/workbench/src/api/contracts.js` states the queue policy directly: it uses runbook task order, ledger status/statusSource, event timeline, and goal-next-action, and does not determine task state from branch, file name, task title, prompt, or command text.
- `src/symphony/console.js` resolves explicit scoped goal event routes through managed runbook state before falling back to static templates.
- `src/symphony/goal-progress-ledger.js` uses `templateStatusSource: 'goal-runbook.v1'` for managed runbook tasks without events, including the task-3 planned state checked in the ledger.
- Tests cover the shell panel names and the event-backed Workbench task queue projection, including backend scoped event-log data and planned managed-runbook task status from `goal-runbook.v1`.

## Blockers

None.
