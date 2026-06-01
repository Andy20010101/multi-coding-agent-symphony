# v26 task-1 worker evidence

Goal id: `v26-verified-adoption-workbench`
Task id: `task-1`
Branch: `v26-task-1-adoption-candidate-panel`
User-visible value: 用户知道哪些实现结果可以采纳。

## Branch setup

- Started in `/Users/andy/Documents/project/multi-coding-agent-symphony`.
- Initial checkout was dirty on `v24-task-1-main-verification-readiness-panel` with existing v23-v25 tracked and untracked files.
- Clean `main -> pull -> new branch` setup was not safe because it would have moved a dirty checkout.
- Ran `git switch -c v26-task-1-adoption-candidate-panel`.
- Result: `Switched to a new branch 'v26-task-1-adoption-candidate-panel'`.

## Implementation summary

- Added a read-only `AdoptionCandidatePanel` to the Workbench main path.
- The panel projects candidates from `symphony.console-runs` and lists only confirmed isolated workspace runs with `status=passed`, `verifierStatus=passed`, implementation source metadata, source workspace, worker evidence, and `mainWorktreeWrites=false`.
- Each candidate shows source run, workspace path, workspace manifest when present, evidence artifact/ref, changed files, verifier status, execution plan id, write boundary, workspace write flag, main worktree write flag, and update time.
- Added Workbench model projection tests for candidate inclusion/exclusion.
- Added shell boundary tests to keep the panel read-only and separate from plan, inspect, confirm, review, main verification, merge, tag, shell, clipboard, and local-open behavior.
- Updated operator and product contract docs for the v26 candidate panel boundary.

## Files changed for this task

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v26-task-1-worker-evidence-2026-05-29.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-SpSymoCx.css`
- `src/symphony/workbench-static/assets/index-BRIgAgWR.js`

`pnpm workbench:build` also left the older generated Workbench asset names deleted from the current dirty checkout. The worktree already had generated static asset churn before this task.

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
tests 718
suites 114
pass 718
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 7031.095917
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-SpSymoCx.css   16.08 kB │ gzip:   3.08 kB
src/symphony/workbench-static/assets/index-BRIgAgWR.js   785.36 kB │ gzip: 146.61 kB

✓ built in 59ms
```

### `git diff --check`

Exit code: 0

```text
No output.
```

### `pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json`

Exit code: 0

```text
contractName: goal-progress-ledger.v1
contractVersion: 1
goalId: v26-verified-adoption-workbench
goalTitle: v26 Verified Adoption Workbench
summary.totalTasks: 5
summary.completedTasks: 0
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1 status: planned
task-1 statusSource: goal-runbook.v1
task-1 branch: v26-task-1-adoption-candidate-panel
task-1 workerEvidenceRef: null
releaseGates: all unknown
nextActions[0].label: Start task-1
nextActions[0].command: pnpm check
safety.readOnly: true
safety.copyOnly: true
browserExecutionAvailable: false
modelInvocationAvailable: false
```

## Boundary notes

- The panel does not make v8 `scan/do/review/verify/status/continue/artifacts` the Workbench top-level action list.
- The panel does not add a safety framework, permission system, shell runner, arbitrary command runner, model call, merge flow, or tag flow.
- The panel does not call `symphony adopt --run`, freeze an adoption patch, inspect adoption recovery state, or confirm adoption. Those remain later v26 tasks.
- Worker evidence display does not become reviewer approval, main verification, or release readiness.
- The implementation does not infer task approval or release readiness from file names, branch names, commit messages, copied commands, or frontend heuristics.
- This worker did not register `worker.evidence-recorded`, did not approve the task, did not mark main verified, and did not declare release ready.

## Reviewer handoff checklist

- Check the candidate filter in `frontend/workbench/src/api/contracts.js` against the v26 task-1 scope.
- Check the Workbench panel in `frontend/workbench/src/App.jsx` for the required fields: source run, workspace, evidence, changed files, verifier status.
- Check `tests/workbench-api-client.test.js` and `tests/workbench-shell.test.js` for regression coverage and boundary coverage.
- Confirm the docs describe only candidate visibility, not adoption planning or confirmation.
- Review with awareness that the checkout had pre-existing v23-v25 dirty and untracked files before this task started.
