# v28 task-3 worker evidence

Goal id: `v28-workbench-v1-release`
Task id: `task-3`
Checkout: current checkout fallback on branch `v27-task-5-review-revision-tests-docs` at `/Users/andy/Documents/project/multi-coding-agent-symphony`

## User-visible value

Workbench v1 now exposes one acceptance path across the existing goal contracts: goal init/status, goal next, goal prompt, worker event registration, review registration, main verification readiness, and closeout gaps.

## Implementation summary

- Added a `goldenPath` Workbench projection that stitches the existing runbook, goal-status, next-action, prompt-pack, event form, review workspace, main verification readiness, operation, and closeout contracts into one ordered path.
- Added a first-screen `Golden Path` Workbench panel before the detailed Active Goal panels.
- Kept the path copy-only and controlled: commands are displayed as text, event writes still require dry-run preview plus plan-hash confirm, and the browser does not run shell commands, launch agents, merge, tag, approve, main-verify, or declare release readiness.
- Added a managed temp-state E2E test that initializes the v28 runbook, advances task-3 through controlled worker and reviewer event registration, then verifies main verification readiness and closeout gap display.
- Rebuilt the static Workbench bundle with the updated UI.

## Files changed

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-B9IfCFVY.css`
- `src/symphony/workbench-static/assets/index-DTyFVtHT.js`
- Generated bundle cleanup from the existing dirty checkout: `src/symphony/workbench-static/assets/index-DfZ2uJ6P.css`, `src/symphony/workbench-static/assets/index-wQbBCopW.js`

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
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

tests 733
suites 115
pass 733
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 6709.533958
```

Focused additions in the full test run:

```text
✔ runs the v28 golden path through managed goal routes and controlled event registration (129.287792ms)
✔ renders the v28 Workbench state header and navigates first-screen user paths (186.898333ms)
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
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-B9IfCFVY.css   19.66 kB │ gzip:   3.58 kB
src/symphony/workbench-static/assets/index-DTyFVtHT.js   847.93 kB │ gzip: 157.32 kB

✓ built in 51ms
```

### `git diff --check`

Exit code: `0`

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json`

Exit code: `0`

```text
contractName: goal-progress-ledger.v1
goalId: v28-workbench-v1-release
summary.totalTasks: 5
summary.completedTasks: 2
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
summary.releaseReadySource: null
task-1.status: main-verified
task-2.status: main-verified
task-3.status: planned
task-3.statusSource: goal-runbook.v1
task-3.workerEvidenceRef: null
task-3.reviewEvidenceRef: null
task-3.reviewVerdict: null
task-3.mainVerificationRef: null
releaseGates.pnpmCheck: unknown
releaseGates.pnpmTest: unknown
releaseGates.workbenchBuild: unknown
releaseGates.mutationGate: unknown
releaseGates.auditHigh: unknown
releaseGates.diffCheck: unknown
releaseGates.mcasDoctor: unknown
releaseGates.docsUpdated: unknown
releaseGates.tagEvidence: unknown
nextActions[0].label: Start task-3
nextActions[0].command: pnpm check
```

## Boundary notes

- Branch setup fell back to the current dirty checkout. I did not switch branches, pull, reset, or revert unrelated work.
- The E2E path writes only to test-managed temporary state. I did not register worker, reviewer, main-verification, release, reviewer approval, or release-ready events for the real v28 goal.
- The Workbench panel uses existing controlled contracts and routes. It does not add a generic shell runner, new safety framework, new goal framework, browser terminal, model invocation, merge, tag, or auto-release path.
- Worker evidence and review/main/release state remain explicit event or contract fields. The UI does not infer approval, main verification, or release readiness from file names, branch names, commit messages, prompt text, or frontend heuristics.
- Worker self-approval remains blocked by the existing reviewer separation contract.

## Reviewer handoff checklist

- Open `/workbench/` and confirm the `Golden Path` panel appears before the detailed Active Goal panels.
- Check the seven steps in order: `goal init/status`, `goal next`, `goal prompt`, `worker event`, `review`, `main verification`, `closeout gaps`.
- Confirm the worker and review steps route through dry-run preview and plan-hash confirm, not a shell runner.
- Confirm main verification is displayed as readiness plus a copy-only `goal gate` command and is not executed by Workbench.
- Confirm closeout gaps do not mark release ready without explicit closeout/release evidence.
