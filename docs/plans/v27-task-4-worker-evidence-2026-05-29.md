# v27 task-4 worker evidence

## Scope

- Goal id: `v27-review-revision-loop`
- Task id: `task-4`
- Runbook branch: `v27-task-4-revision-prompt-generator`
- Actual branch: `v27-task-4-revision-prompt-generator`
- Workspace path: `/Users/andy/Documents/project/multi-coding-agent-symphony`
- User-visible value: 失败后不再手工整理返工 prompt。

## Boundary notes

- Started from a dirty checkout on `v27-task-3-review-verdict-registration`.
- Safe branch setup was attempted with `git switch -c v27-task-4-revision-prompt-generator`; it succeeded. No current-checkout fallback was needed.
- Pre-existing task-1/task-3 and prior-version files were already modified or untracked before task-4 work. I did not revert them.
- Workbench static assets were already dirty before task-4. `pnpm workbench:build` refreshed `src/symphony/workbench-static/index.html` and generated `src/symphony/workbench-static/assets/index-DpXxXTvn.js`.
- No reviewer, main-verification, release, or worker evidence event was registered.
- Workbench primary path remains the latest goal/runbook flow: `goal-status`, `goal next`, `goal prompt`, `goal update/review/gate`, and `goal closeout`.
- No generic safety layer, shell runner, permission system, goal framework, or artifact framework was added.

## Implementation summary

- `goal next` now routes `main.verification-failed` back to a `worker` `revision` next action when the failure is newer than the latest worker evidence.
- Open blockers still block ordinary flow, but when an explicit `reviewer.needs-revision` or `main.verification-failed` event requires worker revision, the resolver returns the worker revision action and carries the blockers into the prompt path.
- `goal prompt --next` now renders a revision-specific worker prompt for revision phase. The prompt includes:
  - revision trigger event and evidence refs
  - blockers from `goal-progress-ledger.v1`
  - failed commands recorded on the failure event when present
  - rerun commands from failed command evidence, latest failed run context, and runbook validation commands
  - changed files from the latest exposed run
  - acceptance delta items to re-check
- Workbench Prompt Preview now exposes revision phase and revision context counts for trigger, blockers, failed commands, rerun commands, changed files, and acceptance delta.
- Tests cover both `reviewer.needs-revision` and `main.verification-failed` revision prompts, plus the Workbench prompt-preview projection.

## Files changed for task-4

- `src/symphony/goal-next-action-resolver.js`
- `src/symphony/goal-prompt-pack.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/v19-goal-next-action-resolver.test.js`
- `tests/v19-goal-prompt-pack.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DpXxXTvn.js`

Pre-existing dirty/untracked files from task-1/task-3 and earlier versions remain in the checkout and were not reverted.

## Acceptance command results

### `pnpm check`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit code 0.

```text
tests 725
suites 114
pass 725
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 7005.240583
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
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-Cij6QcGP.css   16.38 kB │ gzip:   3.13 kB
src/symphony/workbench-static/assets/index-DpXxXTvn.js   817.50 kB │ gzip: 151.91 kB

✓ built in 51ms
```

### `git diff --check`

Result: passed, exit code 0. No output.

### `pnpm --silent symphony goal-status --goal v27-review-revision-loop --json`

Result: passed, exit code 0.

```text
contractName: goal-progress-ledger.v1
goalId: v27-review-revision-loop
generatedAt: 2026-05-31T19:54:46.707Z
summary.totalTasks: 5
summary.completedTasks: 3
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1 status: main-verified
task-2 status: main-verified
task-3 status: main-verified
task-4 status: planned
task-5 status: planned
nextActions[0].label: Start task-4
nextActions[0].command: pnpm check
```

## Reviewer handoff checklist

- Review `src/symphony/goal-next-action-resolver.js` for the new failed-verification-to-worker-revision routing.
- Review `src/symphony/goal-prompt-pack.js` for revision context generation and prompt wording.
- Review Workbench projection in `frontend/workbench/src/api/contracts.js` and display rows in `frontend/workbench/src/App.jsx`.
- Verify tests cover needs-revision, main verification failed, blocker inclusion, failed command evidence, changed files, acceptance delta, and Workbench Prompt Preview projection.
- Confirm no task approval, main verification, release readiness, merge, tag, or event registration was inferred from filenames, branches, command text, or prompt text.

## Review readiness

Initial worker evidence was submitted for independent review. Revision status is recorded below.

## Revision after NEEDS_REVISION

Revision date: 2026-06-01
Reviewer evidence: `docs/plans/v27-task-4-review-evidence-2026-05-29.md`

### Blockers addressed

- Added controlled failed-command input for reviewer and main-verification failure registration:
  - `symphony goal review` now accepts repeatable `--failed-command` only when `--verdict needs-revision` is used.
  - `symphony goal gate` now accepts repeatable `--failed-command` only when `--gate main-verification --status failed` is used.
  - Confirmed events store the lines in `metadata.failedCommands`; the dry-run plan hash includes the failed commands, so confirm must repeat the same input.
- Wired Workbench event-plan preview and confirm to the same scoped field:
  - preview query: `failedCommand`
  - confirm body: `failedCommand` or `failedCommands`
  - Workbench forms expose `--failed-command` only on `reviewer.needs-revision` and `main.verification-failed` forms.
- `goal prompt --next` now has real failed command lines after controlled review/gate registration because the revision prompt reads `metadata.failedCommands` from the failure event.
- Added user-path tests that register review/gate failure through dry-run plus plan-hash confirm, then call `goal prompt --next`. The tests assert blockers, failed commands, changed files, and acceptance delta in the revision prompt.

### Files changed in this revision

- `scripts/symphony.js`
- `src/symphony/goal-review.js`
- `src/symphony/goal-gate.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/v19-goal-prompt-pack.test.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/workbench-api-client.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BGag3HMW.js`
- `docs/plans/v27-task-4-worker-evidence-2026-05-29.md`

Workbench build also keeps the existing generated CSS asset `src/symphony/workbench-static/assets/index-Cij6QcGP.css`. Pre-existing dirty and untracked files from earlier tasks remain in the checkout and were not reverted.

### Acceptance command results

#### `pnpm check`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

#### `pnpm test`

Result: passed, exit code 0.

```text
tests 727
suites 114
pass 727
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 6773.323125
```

#### `pnpm workbench:build`

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

✓ built in 50ms
```

#### `git diff --check`

Result: passed, exit code 0. No output.

#### `pnpm --silent symphony goal-status --goal v27-review-revision-loop --json`

Result: passed, exit code 0.

```text
contractName: goal-progress-ledger.v1
goalId: v27-review-revision-loop
generatedAt: 2026-05-31T20:07:27.017Z
summary.totalTasks: 5
summary.completedTasks: 3
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 1
summary.releaseReady: false
task-1 status: main-verified
task-2 status: main-verified
task-3 status: main-verified
task-4 status: needs-revision
task-4 reviewVerdict: NEEDS_REVISION
task-5 status: planned
nextActions[0].label: Start task-4
nextActions[0].command: pnpm check
```

### Reviewer handoff checklist

- Re-check `src/symphony/goal-review.js` and `src/symphony/goal-gate.js` for the scoped `failedCommands` normalization and hash/confirm behavior.
- Re-check `src/symphony/console.js` for Workbench preview/confirm support and event summaries.
- Re-check `frontend/workbench/src/api/contracts.js` and `frontend/workbench/src/App.jsx` for the form field and copy-only command/body wiring.
- Re-check `tests/v19-goal-prompt-pack.test.js` for the controlled review/gate registration followed by `goal prompt --next`.
- Re-check `tests/v21-goal-plan-preview-api.test.js` for Workbench event-plan preview/confirm carrying `metadata.failedCommands`.
- Confirm no reviewer, main-verification, release, or worker event was registered by this revision worker.

### Revision readiness

Ready for independent re-review. This revision does not claim reviewer approval, main verification, release readiness, merge readiness, or task completion.
