# v21 task-4 worker evidence

Goal id: `v21-goal-event-registration-workbench`  
Task id: `task-4`  
Branch: `v21-task-4-evidence-ref-helper`  
Worker: `v21 task-4 worker subagent`  
Date recorded: 2026-05-31

## User-visible value

Workbench event registration now has an evidence ref helper in the goal event form. Operators can enter controlled `docs/plans` refs, choose recent refs from exposed goal/run/artifact contracts, and use managed artifact refs without copying the final `artifact-ref:` spelling by hand. Invalid refs are stopped before preview and also return a specific API error envelope from the controlled preview path.

## Implementation summary

- Added `EvidenceRefHelper` projection to the goal event form model.
- Recent evidence choices come only from exposed runbook baseline, goal progress ledger refs, goal event log refs, and latest run `artifactRefs`.
- The UI keeps the existing dry-run preview / confirm path and appends selected refs into the evidence ref input.
- Evidence ref parsing normalizes managed artifact refs such as `artifact:run-1:evidence`, `artifacts/...`, and `managed-artifact:...` to `artifact-ref:<ref>` before calling preview or confirm.
- `goal update`, `goal review`, and `goal gate` now reject uncontrolled evidence refs during normalization with `invalid-evidence-ref`, instead of surfacing only a generic invalid plan.
- Tests cover recent ref projection, managed artifact preview acceptance, and clear error envelopes for uncontrolled refs.

## Files changed

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/goal-update.js`
- `src/symphony/goal-review.js`
- `src/symphony/goal-gate.js`
- `tests/workbench-api-client.test.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BspYnYKl.css`
- `src/symphony/workbench-static/assets/index-DMa5Vmdp.js`
- Removed old built assets: `src/symphony/workbench-static/assets/index-CMCXVqRN.css`, `src/symphony/workbench-static/assets/index-Di8mm98M.js`

## Commands run

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

tests 681
suites 110
pass 681
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4173.905792
```

Targeted checks also passed after the UI safety adjustment:

```text
pnpm test -- tests/workbench-route-smoke.test.js tests/workbench-shell.test.js tests/workbench-api-client.test.js tests/v21-goal-plan-preview-api.test.js
tests 46
suites 5
pass 46
fail 0
duration_ms 211.530625
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

✓ built in 144ms
```

The build emitted Node WASI experimental warnings before Vite output. They did not change the exit code.

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
safety.readOnly: true
safety.copyOnly: true
```

## Workbench user path changed

In the Next Action event form, the `evidence ref` field now shows a recent evidence ref selector when refs are available from the exposed contracts. Selecting a recent ref appends it to the input. Operators can still type refs directly. Preview and confirm continue to use the same controlled `goal update/review/gate` dry-run plan hash flow.

For managed artifact refs, the UI accepts the operator-facing ref and sends the controlled `artifact-ref:<ref>` form to the existing event preview and confirm endpoints. Invalid refs show an inline evidence ref error before preview. The API also returns `error-envelope.v1` with `invalid-evidence-ref` for uncontrolled refs.

## Boundary notes

- Workbench still does not run shell commands, open local files, download artifacts, or invoke models.
- No generic shell runner was added.
- No generic safety layer, permission system, goal framework, or artifact framework was added.
- The Workbench action surface remains centered on latest goal/runbook/next-action and goal update/review/gate dry-run plus confirm.
- The helper does not infer task approval, main verification, release readiness, or task status from file names, branch names, commit messages, artifact names, or frontend heuristics.
- This worker evidence does not approve task-4, main-verify task-4, or declare release readiness.

## Reviewer handoff checklist

- Review `EvidenceRefHelper` projection and confirm recent refs are display/input aids only.
- Check that managed artifact normalization keeps preview and confirm inputs identical.
- Check that `invalid-evidence-ref` errors are clear and do not expose local paths.
- Confirm no new non-preview/non-confirm click action was added to Workbench.
- Run reviewer dry-run and confirm outside this worker scope if the review passes.
