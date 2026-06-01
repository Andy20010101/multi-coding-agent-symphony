# v23 task-2 worker evidence

## Scope

- Goal id: `v23-goal-operation-run-console`
- Task id: `task-2`
- Branch from runbook: `v23-task-2-goal-operation-console-ui`
- Actual checkout during this worker run: `main...origin/main [ahead 26]`
- User-visible value: 用户能定位 goal command 失败在哪。

## Implementation summary

Workbench now has a Goal Operation Console in the active goal path. It reads the managed `goal-operation-runs.v1` route for the selected active goal, shows the latest operation, operation history, command preview, stdout/stderr-style controlled API output, exit code, plan hash, event ids, timestamps, and the current `goal next` task/role/phase.

The dry-run / confirm form also has an inline operation console. Preview, confirm, and failure states show the command preview, stdout, stderr, exit code, plan hash, event id, and refreshed next action. The output is derived from the controlled Workbench goal event preview/confirm APIs and the operation registry; it does not execute a shell command in the browser and does not add a generic shell runner.

## Files changed

Task-2 worker changes:

- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-Chgh8Clk.css`
- `src/symphony/workbench-static/assets/index-gBrHEm5B.js`
- Removed stale built assets from the latest Workbench build: `src/symphony/workbench-static/assets/index-BRTPIdb3.js`, `src/symphony/workbench-static/assets/index-D6WeclLN.css`

Pre-existing task-1 worktree files were present before this worker implementation and were left in place:

- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `src/symphony/console.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `src/symphony/goal-operation-run-registry.js`
- `tests/v23-goal-operation-run-registry.test.js`
- `fixtures/contracts/goal-runbook.v23-goal-operation-run-console.v1.json`
- `docs/plans/v23-task-1-worker-evidence-2026-05-29.md`
- `docs/plans/v23-task-1-review-evidence-2026-05-29.md`
- `docs/plans/v23-task-1-main-verification-evidence-2026-05-29.md`

## Command results

### `pnpm check`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

tests 702
suites 112
pass 702
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3718.226125
```

Focused task-2 regression run before the full suite:

```text
pnpm test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/v21-goal-plan-preview-api.test.js tests/v23-goal-operation-run-registry.test.js
tests 49
suites 5
pass 49
fail 0
duration_ms 167.835708
```

### `pnpm workbench:build`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-Chgh8Clk.css   14.28 kB │ gzip:   2.91 kB
src/symphony/workbench-static/assets/index-gBrHEm5B.js   746.63 kB │ gzip: 138.94 kB

✓ built in 149ms
```

The build emitted Node WASI experimental warnings before Vite output. The build still exited `0`.

### `git diff --check`

Result: exit code `0`; no output.

### `pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json`

Result: exit code `0`.

```text
contractName: goal-progress-ledger.v1
goalId: v23-goal-operation-run-console
goalTitle: v23 Goal Operation Run Console
generatedAt: 2026-05-31T04:06:57.186Z
summary.totalTasks: 5
summary.completedTasks: 1
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1.status: main-verified
task-1.workerEvidenceRef: docs/plans/v23-task-1-worker-evidence-2026-05-29.md
task-1.reviewEvidenceRef: docs/plans/v23-task-1-review-evidence-2026-05-29.md
task-1.reviewVerdict: APPROVED
task-1.mainVerificationRef: docs/plans/v23-task-1-main-verification-evidence-2026-05-29.md
task-2.status: planned
task-2.statusSource: goal-runbook.v1
nextActions[0].label: Start task-2
nextActions[0].command: pnpm check
safety.browserExecutionAvailable: false
safety.modelInvocationAvailable: false
```

## Boundary notes

- Workbench remains on the latest goal/runbook/next-action path. The new route is `/api/goals/<goal-id>/operations`; no v8 scan/do/review/verify/status/continue/artifacts button list was added.
- The console output is display/projection over controlled goal operation contracts and goal event preview/confirm responses. It is not a terminal emulator and not a generic shell runner.
- The browser still does not run shell commands, invoke models, download artifacts, merge, tag, or infer task approval/readiness from filenames, branches, commits, command text, or frontend heuristics.
- This worker records only worker evidence for task-2. It does not claim reviewer approval, main verification, or release readiness.

## Worker event registration

Dry-run command:

```text
pnpm --silent symphony goal update --goal v23-goal-operation-run-console --task task-2 --event worker.evidence-recorded --actor codex-v23-task-2-worker --evidence-ref docs/plans/v23-task-2-worker-evidence-2026-05-29.md --dry-run --json
```

Dry-run result: exit code `0`; `planHash` was `sha256:0f478fc0249ba0596fc6824127252560897d6cc4093c0a67ed8153e13f19f5bb`; `wouldAppend.writesInDryRun` was `false`.

Confirm command:

```text
pnpm --silent symphony goal update --goal v23-goal-operation-run-console --task task-2 --event worker.evidence-recorded --actor codex-v23-task-2-worker --evidence-ref docs/plans/v23-task-2-worker-evidence-2026-05-29.md --confirm --plan-hash sha256:0f478fc0249ba0596fc6824127252560897d6cc4093c0a67ed8153e13f19f5bb --json
```

Confirm result: exit code `0`; `status` was `appended`; `written` was `true`; appended event id was `evt_0b2545f0063aa389`; appended event type was `worker.evidence-recorded`.

## Reviewer handoff checklist

- Check that `GoalOperationConsolePanel` appears in the active goal Workbench path and uses `activeGoalOperations`.
- Check that inline preview/confirm failures expose stderr and non-zero exit-code display without appending goal events.
- Check that operation console fields come from `goal-operation-runs.v1`, preview/confirm API results, and `goal-next-action.v1`.
- Check that no generic command input, shell execution, clipboard action, local file open, merge, tag, or release-ready shortcut was introduced.
- Re-run `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check`.
