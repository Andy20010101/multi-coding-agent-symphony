# v28 task-3 main verification evidence

Goal id: `v28-workbench-v1-release`
Task id: `task-3`
Main verifier role: `main-verifier subagent`
Evidence date: `2026-05-29`
Workspace: `/Users/andy/Documents/project/multi-coding-agent-symphony`

## Branch and commit

Branch/fallback path: current-checkout fallback on branch `v27-task-5-review-revision-tests-docs`
Main/current commit: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`
Merge/fallback mode: runbook `git checkout main`, `git pull --ff-only`, and `git merge --ff-only v28-task-3-golden-path-e2e` were not executed because the current checkout was dirty and the nominal task branch ref was not present locally or under `origin`.

## Preconditions

`pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json` reported task-3 as approved:

```text
task-3.status: approved
task-3.statusSource: goal-event-log.v1:evt_1e40948f8920ff42
task-3.branch: v28-task-3-golden-path-e2e
task-3.workerEvidenceRef: docs/plans/v28-task-3-worker-evidence-2026-05-29.md
task-3.reviewEvidenceRef: docs/plans/v28-task-3-review-evidence-2026-05-29.md
task-3.reviewVerdict: APPROVED
task-3.mainVerificationRef: null
```

Worker evidence exists at `docs/plans/v28-task-3-worker-evidence-2026-05-29.md`.
Review evidence exists at `docs/plans/v28-task-3-review-evidence-2026-05-29.md`.

## Boundary notes

Original blocked operation: runbook checkout and fast-forward merge to main:

```text
git checkout main
git pull --ff-only
git merge --ff-only v28-task-3-golden-path-e2e
```

Actual path used: current-checkout/repo-local fallback verification.

Boundary basis:

```text
$ git status --short --branch
## v27-task-5-review-revision-tests-docs
 M docs/symphony-product-contracts.md
 M docs/workbench-operator-guide.md
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/client.js
 M frontend/workbench/src/api/contracts.js
 M frontend/workbench/src/styles/workbench.css
 M scripts/symphony.js
 M src/symphony/console.js
 M src/symphony/contract.js
 M src/symphony/goal-gate.js
 M src/symphony/goal-next-action-resolver.js
 M src/symphony/goal-prompt-pack.js
 M src/symphony/goal-review.js
 D src/symphony/workbench-static/assets/index-DfZ2uJ6P.css
 D src/symphony/workbench-static/assets/index-wQbBCopW.js
 M src/symphony/workbench-static/index.html
 M tests/symphony-cli.test.js
 M tests/v19-goal-next-action-resolver.test.js
 M tests/v19-goal-prompt-pack.test.js
 M tests/v21-goal-plan-preview-api.test.js
 M tests/workbench-api-client.test.js
 M tests/workbench-route-smoke.test.js
 M tests/workbench-shell.test.js
?? docs/plans/v28-task-3-review-evidence-2026-05-29.md
?? docs/plans/v28-task-3-worker-evidence-2026-05-29.md
?? fixtures/contracts/goal-runbook.v28-workbench-v1-release.v1.json
?? src/symphony/workbench-static/assets/index-B9IfCFVY.css
?? src/symphony/workbench-static/assets/index-DTyFVtHT.js
```

Additional ref check:

```text
$ git show-ref --heads --verify refs/heads/v28-task-3-golden-path-e2e
fatal: 'refs/heads/v28-task-3-golden-path-e2e' - not a valid ref

$ git show-ref --verify refs/remotes/origin/v28-task-3-golden-path-e2e
fatal: 'refs/remotes/origin/v28-task-3-golden-path-e2e' - not a valid ref
```

I did not force checkout, pull, merge, reset, revert, stage, commit, or register any gate/event.

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
tests 733
suites 115
pass 733
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 6768.409042
```

Relevant task-3 coverage observed in the full run:

```text
✔ runs the v28 golden path through managed goal routes and controlled event registration (136.686208ms)
✔ renders the v28 Workbench state header and navigates first-screen user paths (195.07125ms)
✔ confirms main verification passed and failed gates and rejects incomplete gate input (10.030083ms)
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

✓ built in 52ms
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
summary.completedTasks: 3
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
summary.releaseReadySource: null
task-1.status: main-verified
task-2.status: main-verified
task-3.status: approved
task-3.statusSource: goal-event-log.v1:evt_1e40948f8920ff42
task-3.workerEvidenceRef: docs/plans/v28-task-3-worker-evidence-2026-05-29.md
task-3.reviewEvidenceRef: docs/plans/v28-task-3-review-evidence-2026-05-29.md
task-3.reviewVerdict: APPROVED
task-3.mainVerificationRef: null
task-4.status: planned
task-5.status: planned
releaseGates.pnpmCheck: unknown
releaseGates.pnpmTest: unknown
releaseGates.workbenchBuild: unknown
releaseGates.mutationGate: unknown
releaseGates.auditHigh: unknown
releaseGates.diffCheck: unknown
releaseGates.mcasDoctor: unknown
releaseGates.docsUpdated: unknown
releaseGates.tagEvidence: unknown
nextActions[0].label: Start task-4
nextActions[0].command: pnpm check
```

## Main verification result

Main verification passed on the current-checkout fallback basis.

Parent orchestrator should register the task-3 main-verification gate as `passed` if the boundary-first fallback basis is accepted. This evidence does not declare release readiness.
