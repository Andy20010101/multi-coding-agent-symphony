# v21 task-5 worker evidence

Goal id: `v21-goal-event-registration-workbench`
Task id: `task-5`
Branch: `v21-task-5-event-registration-tests-and-docs`
Worker: `v21 task-5 worker subagent`
Date recorded: 2026-05-31

## User-visible value

Workbench event registration now has regression coverage for the controlled paths that can append goal events. Worker events, reviewer verdicts, and main-verification gates are tested through the same preview and confirm API used by Workbench, and the docs state that displayed state comes from refreshed backend contracts, not browser-created status.

## Implementation summary

- Added v21 Workbench API tests for controlled worker `worker.self-check-passed` and `worker.self-check-failed` confirm paths.
- Added v21 Workbench API tests for `reviewer.approved`, `reviewer.needs-revision`, and reviewer/worker actor conflict rejection.
- Added v21 Workbench API tests for `main.verification-passed`, `main.verification-failed`, and missing main-verification task rejection.
- The tests assert refreshed `goal-progress-ledger.v1`, `goal-event-log.v1`, and `goal-next-action.v1` responses after successful confirm.
- Updated the operator guide and product contract index to describe the controlled event registration flow and the no-write failure cases.

## Files changed

- `tests/v21-goal-plan-preview-api.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v21-task-5-worker-evidence-2026-05-29.md`

## Commands run

### `pnpm test tests/v21-goal-plan-preview-api.test.js`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8 tests/v21-goal-plan-preview-api.test.js

tests 11
suites 1
pass 11
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 132.602
```

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

tests 689
suites 110
pass 689
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3665.062208
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-BspYnYKl.css   11.24 kB │ gzip:   2.57 kB
src/symphony/workbench-static/assets/index-DMa5Vmdp.js   689.08 kB │ gzip: 128.85 kB

✓ built in 139ms
```

The build emitted Node WASI experimental warnings before the Vite output. They did not change the exit code.

### `git diff --check`

Exit code: 0

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Exit code: 0

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 4
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1 status: main-verified
task-2 status: main-verified
task-3 status: main-verified
task-4 status: main-verified
task-5 status: planned
nextActions[0].label: Start task-5
nextActions[0].command: pnpm check
safety.readOnly: true
safety.copyOnly: true
```

## Workbench user path changed

The Workbench path is documented and tested as:

```text
Next Action -> event form -> dry-run preview -> inspect plan hash -> confirm with matching plan hash -> refreshed goal-status/events/next action
```

The browser can show the form selection and API error messages, but task state changes only after the backend confirm path appends one managed event and returns refreshed contracts.

## Docs changed

- `docs/workbench-operator-guide.md` now lists the controlled worker, reviewer, and main-verification paths and the no-write failure cases.
- `docs/symphony-product-contracts.md` now records the test coverage expectations for the Workbench event registration routes and states that the browser must not create approval, verification, or release-ready state from form selections or strings.

## Boundary notes

- No generic shell runner was added.
- No generic safety layer, permission system, goal framework, or artifact framework was added.
- The Workbench action surface remains centered on latest goal/runbook/next-action plus `goal update/review/gate` dry-run and confirm.
- Tests do not infer approval, main verification, or release readiness from filenames, branch names, commit messages, prompt text, or frontend heuristics.
- This worker evidence does not approve task-5, main-verify task-5, declare release readiness, or register a goal event.
- Release-adjacent task-5 commands from the runbook were not registered as release gates in this worker stage.

## Reviewer handoff checklist

- Review `tests/v21-goal-plan-preview-api.test.js` for worker, review, and main-verification success/failure coverage.
- Check that failed preview/confirm probes leave the managed state unchanged.
- Check docs wording against the controlled event registration boundary.
- Run independent review dry-run and confirm outside this worker scope if the review passes.
