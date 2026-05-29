# v19 Task 0 Register Goal Template Evidence

Date: 2026-05-29

## Goal And Task

- Goal id: `v19-goal-runbook-next-action`
- Task id: `task-0`
- Branch: `v19-task0-register-goal-template`

## Change Summary

Task 0 adds a minimal v19 goal progress template so `symphony goal-status --goal v19-goal-runbook-next-action --json` can resolve the existing v19 event journal.

Changed implementation:

- `src/symphony/goal-progress-ledger.js`
  - Added `V19_GOAL_RUNBOOK_GOAL_ID`.
  - Added v19 baseline with tag `v18`.
  - Added the eight v19 implementation task templates.
  - Registered `v19-goal-runbook-next-action` in `GOAL_PROGRESS_TEMPLATES`.
  - Excluded `planning` from task progress events so the planning event stays in the journal but does not become an implementation task.

Changed tests:

- `tests/v19-goal-template.test.js`
  - Verifies `goal-status --goal v19-goal-runbook-next-action --json` exits `0`.
  - Verifies a v19 journal with only the existing planning event returns a valid `goal-progress-ledger.v1`.
  - Verifies planning-only progress keeps `completedTasks: 0` and `releaseReady: false`.
  - Verifies task-1 has no reviewer approval and no main verification in the planning-only case.
  - Verifies unknown goals still return exit code `64` with `goal not found`.

The test uses the known planning event identity:

- `eventId`: `evt_79a5cb787d2dc1b7`
- `eventHash`: `sha256:c041dc4c606803737cbac2e8ffffc4b6c972e81291294846970110f563d2fc68`

## Commands Run

### `git status -sb`

Result: passed, exit code `0`.

Observed output before this evidence file was added:

```text
## v19-task0-register-goal-template
 M src/symphony/goal-progress-ledger.js
?? tests/v19-goal-template.test.js
```

### `pnpm check`

Result: passed, exit code `0`.

Observed output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit code `0`.

Observed summary:

```text
tests 622
suites 104
pass 622
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3234.261917
```

The new v19 Task 0 suite passed inside the full run:

```text
v19 goal progress template bootstrap
tests 3
pass 3
fail 0
```

### `git diff --check`

Result: passed, exit code `0`.

Observed output: no output.

### `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json`

Result: passed, exit code `0`.

Observed result summary from the current local event journal:

```text
contractName: goal-progress-ledger.v1
goalId: v19-goal-runbook-next-action
goalTitle: Goal Runbook + Next Action Control Center
baseline.tag: v18
summary.totalTasks: 8
summary.completedTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1.status: in-progress
task-1.workerEvidenceRef: docs/plans/v19-task1-worker-evidence-2026-05-29.md
task-1.reviewEvidenceRef: null
task-1.mainVerificationRef: null
```

The current local journal includes the planning event and the task-1 worker evidence event. The planning-only behavior is covered by `tests/v19-goal-template.test.js`; in that case task-1 through task-8 remain planned, `completedTasks` remains `0`, and `releaseReady` remains `false`.

## Boundaries

This task only registers a static v19 goal progress template and adjusts event-to-task handling for `planning`.

No `goal-runbook.v1` storage was implemented. No `symphony goal init` behavior was implemented. No `symphony goal next` behavior was implemented. No prompt generator was implemented. No API route was implemented. No Workbench panel was implemented. No dependency was added. No README release status was changed.

The change does not infer approval, main verification, or release readiness from the planning event, branch names, filenames, test results, command text, or paths.

## Reviewer Handoff

Reviewer should check:

- The v19 template fields: goal id, title, baseline tag, and eight task definitions.
- The `planning` exclusion in `isTaskEventId`, especially that it does not affect existing v17/v18 task handling.
- The v19 bootstrap tests for CLI success, planning-only ledger behavior, task-1 evidence fields, and unknown-goal failure.
- Existing v17/v18 goal-status and event-ledger tests still pass.

No reviewer approval, main verification, release-ready declaration, tag creation, or release publication is recorded in this evidence.
