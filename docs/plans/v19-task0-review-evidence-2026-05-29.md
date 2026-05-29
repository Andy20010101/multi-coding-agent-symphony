# v19 Task 0 Review Evidence

Date: 2026-05-29

Verdict: APPROVED

## Reviewed Files

- `src/symphony/goal-progress-ledger.js`
- `tests/v19-goal-template.test.js`
- `docs/plans/v19-task0-register-goal-template-evidence-2026-05-29.md`

Reviewed diff: `v19-task0-register-goal-template` compared with `main`.

## Review Result

The branch correctly fixes the immediate `goal-status` failure for `v19-goal-runbook-next-action`. The command no longer returns `goal not found`; it returns a valid `goal-progress-ledger.v1` object for the v19 goal.

The implementation stays inside the Task 0 boundary. It registers a v19 goal progress template in `src/symphony/goal-progress-ledger.js`, adds tests for the bootstrap behavior, and writes worker evidence. It does not implement `goal-runbook.v1` storage, a runbook registry, `symphony goal init`, next-action resolution, prompt generation, closeout, API routes, or Workbench UI.

No blocker found.

## Required Checks

- v19 goal id is `v19-goal-runbook-next-action`: passed. `V19_GOAL_RUNBOOK_GOAL_ID` is set to that value and registered in `GOAL_PROGRESS_TEMPLATES`.
- v19 template task list contains `task-1` through `task-8`: passed. The template contains those eight task ids.
- Existing planning event is tolerated: passed. A planning-only journal builds a valid v19 ledger.
- Planning event does not make `completedTasks > 0`: passed. Planning-only result has `completedTasks: 0`.
- Planning event does not make `releaseReady: true`: passed. Planning-only result has `releaseReady: false`.
- Unknown goal still returns `goal not found`: passed. Direct CLI check returned exit code `64`.
- v17 and v18 `goal-status` behavior is still working: passed. Direct CLI checks for both registered goals returned exit code `0`.

Non-blocking observation: the live repository state includes explicit v19 events after planning, including a `task-0` worker evidence event in `.symphony/goals/events/v19-goal-runbook-next-action.ndjson`. Because the existing resolver keeps unknown task ids from event logs visible, the live `goal-status` output reports nine tasks. That does not come from the registered v19 template; the planning-only check and the template itself still show `task-1` through `task-8`.

## Code Evidence

- `src/symphony/goal-progress-ledger.js:10` defines `V19_GOAL_RUNBOOK_GOAL_ID`.
- `src/symphony/goal-progress-ledger.js:64` defines the v19 baseline as `v18`.
- `src/symphony/goal-progress-ledger.js:194` through `src/symphony/goal-progress-ledger.js:243` define `task-1` through `task-8`.
- `src/symphony/goal-progress-ledger.js:257` through `src/symphony/goal-progress-ledger.js:263` register the v19 template.
- `src/symphony/goal-progress-ledger.js:947` through `src/symphony/goal-progress-ledger.js:949` exclude `planning` from task event ids.
- `tests/v19-goal-template.test.js:18` through `tests/v19-goal-template.test.js:69` cover `goal-status` success and the exact eight-task planning-only ledger.
- `tests/v19-goal-template.test.js:71` through `tests/v19-goal-template.test.js:95` cover planning-only `completedTasks: 0` and `releaseReady: false`.
- `tests/v19-goal-template.test.js:97` through `tests/v19-goal-template.test.js:115` cover unknown goal failure.

## Commands Run

### `pnpm check`

Exit code: `0`

Output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: `0`

Final output summary:

```text
tests 622
suites 104
pass 622
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3302.7165
```

The v19 Task 0 suite passed inside the full run:

```text
v19 goal progress template bootstrap
tests 3
pass 3
fail 0
```

### `git diff --check`

Exit code: `0`

Output: no output.

### `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json`

Exit code: `0`

Observed exact fields from stdout:

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v19-goal-runbook-next-action",
  "goalTitle": "Goal Runbook + Next Action Control Center",
  "baseline": {
    "tag": "v18",
    "commit": null,
    "evidenceRef": "docs/plans/v18-tag-release-evidence-2026-05-29.md"
  },
  "summary": {
    "totalTasks": 9,
    "completedTasks": 0,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "taskIds": [
    "task-1",
    "task-2",
    "task-3",
    "task-4",
    "task-5",
    "task-6",
    "task-7",
    "task-8",
    "task-0"
  ]
}
```

The ninth task is event-derived from the live local journal, not part of the registered v19 template.

### Planning-only v19 ledger check

Command:

```bash
node --input-type=module -e "<temporary planning-only ledger check>"
```

Exit code: `0`

Output:

```json
{
  "goalId": "v19-goal-runbook-next-action",
  "totalTasks": 8,
  "completedTasks": 0,
  "releaseReady": false,
  "taskIds": [
    "task-1",
    "task-2",
    "task-3",
    "task-4",
    "task-5",
    "task-6",
    "task-7",
    "task-8"
  ],
  "statuses": [
    "planned",
    "planned",
    "planned",
    "planned",
    "planned",
    "planned",
    "planned",
    "planned"
  ],
  "planningPresent": false
}
```

### `pnpm --silent symphony goal-status --goal v19-not-registered --json`

Exit code: `64`

Output:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

### `pnpm --silent symphony goal-status --goal v17-readonly-goal-progress-console-contracts --json`

Exit code: `0`

Observed exact summary:

```json
{
  "goalId": "v17-readonly-goal-progress-console-contracts",
  "baselineTag": "v16",
  "totalTasks": 10,
  "completedTasks": 0,
  "releaseReady": false
}
```

### `pnpm --silent symphony goal-status --goal v18-goal-event-journal-evidence-recorder --json`

Exit code: `0`

Observed exact summary:

```json
{
  "goalId": "v18-goal-event-journal-evidence-recorder",
  "baselineTag": "v17",
  "totalTasks": 10,
  "completedTasks": 10,
  "releaseReady": true,
  "releaseReadySource": "goal-event-log.v1:evt_3714a444163c4583"
}
```

## Blockers

None.
