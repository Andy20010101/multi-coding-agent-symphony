# v27 task-4 re-review evidence

Goal id: `v27-review-revision-loop`
Task id: `task-4`
Task title: `Revision prompt generator`
Branch reviewed: `v27-task-4-revision-prompt-generator`
Re-review date: 2026-06-01
Verdict: `APPROVED`

## Review Boundary

`git diff main...HEAD` is empty on this checkout, while the current worktree contains uncommitted changes for this task plus earlier task and prior-version artifacts. I reviewed the working tree implementation and the updated worker evidence. I did not revert unrelated dirty or untracked files.

Approval scope is limited to v27 task-4: revision prompt generation after `reviewer.needs-revision` or `main.verification-failed`. This approval does not mark the task main-verified, release-ready, merged, or tagged.

## Reviewed Files

- `docs/plans/workbench-v20-v28-goal-runbooks/v27_review-revision-loop_goal_runbook_latest.md`
- `docs/plans/v27-task-4-worker-evidence-2026-05-29.md`
- `docs/plans/v27-task-4-review-evidence-2026-05-29.md`
- `scripts/symphony.js`
- `src/symphony/goal-review.js`
- `src/symphony/goal-gate.js`
- `src/symphony/console.js`
- `src/symphony/goal-next-action-resolver.js`
- `src/symphony/goal-prompt-pack.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/v19-goal-next-action-resolver.test.js`
- `tests/v19-goal-prompt-pack.test.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BGag3HMW.js`
- `src/symphony/workbench-static/assets/index-Cij6QcGP.css`

## Independent Findings

The prior blocker is fixed. `symphony goal review` now accepts repeatable `--failed-command` only for `--verdict needs-revision`; `symphony goal gate` accepts repeatable `--failed-command` only for `--gate main-verification --status failed`. Both paths normalize single-line command strings, reject use outside the scoped failure events, include `failedCommands` in the dry-run proposed event, include it in the plan hash input, and append it as `metadata.failedCommands` on confirm.

The Workbench event-plan preview and confirm paths use the same controlled review/gate builders. Preview accepts `failedCommand` query values for review/gate plans. Confirm accepts `failedCommand` or `failedCommands` in the JSON body, passes them into `confirmGoalReview` or `confirmGoalGate`, and returns the appended event summary with `failedCommands` when present. The frontend form catalog exposes the failed command field on `reviewer.needs-revision` and `main.verification-failed` forms, not on reviewer approval or main verification passed forms.

`goal prompt --next` now has a real source for failed command lines after controlled registration. The revision context reads the failure event from `goal-event-log.v1`, pulls failed commands from `metadata.failedCommands`, carries open blockers from `goal-progress-ledger.v1`, carries changed files from the latest exposed console run, and builds acceptance delta entries from the runbook acceptance list.

The user-path tests cover the repaired path. `tests/v19-goal-prompt-pack.test.js` registers worker evidence, registers a blocker where applicable, confirms `reviewer.needs-revision` or `main.verification-failed` through dry-run plus plan-hash confirm, then calls `goal prompt --next` and asserts the generated revision prompt includes blockers, failed commands, changed files, and acceptance delta. `tests/v21-goal-plan-preview-api.test.js` covers Workbench preview/confirm carrying `metadata.failedCommands` for both scoped failure registrations.

The latest/v19 goal-runbook path remains the primary Workbench path. The active goal command baseline still uses `goal-status`, `goal next`, `goal prompt`, and `goal closeout`; event registration remains `goal update/review/gate`. I did not find the old v8 `scan/do/review/verify/status/continue/artifacts` command surface being promoted to the primary Workbench action list.

I did not find a new generic safety layer, generic shell runner, permission system, goal framework, or artifact framework in the task-4 revision path. The failed command addition is a scoped field on existing goal review/gate registration, not a command execution facility.

The frontend continues to project state from explicit backend contracts. I did not find task approval, main verification, or release readiness inferred from filenames, branches, commit messages, copied commands, or frontend heuristics.

## Command Results

### `pnpm check`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit code 0.

```text
ℹ tests 727
ℹ suites 114
ℹ pass 727
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6930.154333
```

### `pnpm workbench:build`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-Cij6QcGP.css   16.38 kB │ gzip:   3.13 kB
src/symphony/workbench-static/assets/index-BGag3HMW.js   818.42 kB │ gzip: 152.07 kB

✓ built in 52ms
```

### `git diff --check`

Result: passed, exit code 0. No output.

## Verdict

`APPROVED`

## Blockers

No remaining blockers for v27 task-4 approval scope.
