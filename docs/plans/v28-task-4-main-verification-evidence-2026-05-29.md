# v28 task-4 main verification evidence

Goal id: `v28-workbench-v1-release`
Task id: `task-4`
Task title: Release closeout workspace
Verifier role: main-verifier
Verification time: `2026-06-01 06:29:19 CST`

## Branch and commit basis

- Runbook task branch: `v28-task-4-release-closeout-workspace`
- Actual verification path: current-checkout fallback on `v27-task-5-review-revision-tests-docs`
- Current commit: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`
- Local `main` commit: `ab714716e85d13c71c5643036292ede0594c48a6`
- `origin/main` commit after `git fetch origin --prune`: `d12f428078e4ebcf3c1d68e982f940f53e9941dc`
- Merge/fallback mode: no checkout, pull, or ff-only merge was performed because the dirty checkout boundary would be overwritten or conflicted with.

## Preconditions

`pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json` exited 0 before verification and showed task-4 has explicit reviewer approval:

```text
task-4 status: approved
task-4 statusSource: goal-event-log.v1:evt_81719c49550ff9dc
task-4 reviewVerdict: APPROVED
task-4 workerEvidenceRef: docs/plans/v28-task-4-worker-evidence-2026-05-29.md
task-4 reviewEvidenceRef: docs/plans/v28-task-4-review-evidence-2026-05-29.md
task-4 mainVerificationRef: null
summary.releaseReady: false
summary.releaseReadySource: null
```

## Boundary notes

Ideal runbook operations were blocked before execution:

- `git checkout main`: not run. The current checkout had existing dirty changes, and 11 modified paths overlapped files that differ between `HEAD` and `main`.
- `git pull --ff-only`: not run because checkout to `main` was blocked by the dirty current checkout boundary.
- `git merge --ff-only v28-task-4-release-closeout-workspace`: not run because checkout to `main` was blocked and the task branch ref was not present locally or remotely after `git fetch origin --prune`.
- `git branch --all --list '*v28-task-4*'`: exit 0, no output.
- `git rev-parse v28-task-4-release-closeout-workspace`: exit 128, unknown revision.

Dirty-boundary evidence:

```text
Current branch: v27-task-5-review-revision-tests-docs
Current commit: 7bc15cf4a303e2f81f85db21ee4f899921c89a92
Modified paths that overlap HEAD..main:
docs/symphony-product-contracts.md
docs/workbench-operator-guide.md
frontend/workbench/src/App.jsx
frontend/workbench/src/api/client.js
frontend/workbench/src/api/contracts.js
frontend/workbench/src/styles/workbench.css
src/symphony/console.js
src/symphony/workbench-static/index.html
tests/workbench-api-client.test.js
tests/workbench-route-smoke.test.js
tests/workbench-shell.test.js

Untracked paths that collide with files tracked on main:
docs/plans/v26-task-1-review-evidence-2026-05-29.md
docs/plans/v26-task-1-worker-evidence-2026-05-29.md
```

The fallback verification basis is the current dirty checkout, matching the worker and reviewer evidence fallback. No event, gate, tag, merge, push, stage, or commit was performed by this verifier.

## Command results

### `git fetch origin --prune`

Exit code: `0`

```text
<no output>
```

### `pnpm check`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: `0`

```text
tests 734
suites 115
pass 734
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 6775.5395
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
src/symphony/workbench-static/assets/index-NKKg_tJp.js   862.88 kB │ gzip: 160.11 kB

✓ built in 53ms
```

### `git diff --check`

Exit code: `0`

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json`

Exit code: `0`

```text
summary.totalTasks: 5
summary.completedTasks: 4
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
summary.releaseReadySource: null
task-4 status: approved
task-4 statusSource: goal-event-log.v1:evt_81719c49550ff9dc
task-4 reviewVerdict: APPROVED
task-4 mainVerificationRef: null
task-5 status: planned
nextActions[0].label: Start task-5
nextActions[0].command: pnpm check
releaseGates.*: unknown
```

## Main verification result

Main verification passed on the current-checkout fallback basis:

- Required verification commands passed: `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`.
- The reviewer-approved precondition exists for task-4.
- Release readiness remains false and was not declared.
- No gate was registered by this verifier.

Parent should register `main-verification` for task-4 as `passed` if it accepts current-checkout fallback evidence.
