# v29 task-4 review evidence

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Task id: `task-4`  
Task: Operation console and run-result bridge  
Review evidence path: `docs/plans/v29-task-4-review-evidence-2026-06-01.md`  
Worker evidence: `docs/plans/v29-task-4-worker-evidence-2026-06-01.md`  
Worker evidence event: `evt_5b76cf07d20b39f7`  
Verdict: `approved`

## Fallback boundary

This review was completed in the fallback reviewer thread because the original task-4 reviewer thread `019e8197-6105-76e3-b7b6-aeac0eb2dcd6` acknowledged scope but did not write this evidence file after a controller nudge.

The review used the current checkout on branch `v29-task-4-operation-console-and-run-result-bridge`. No product fixes were made. No `symphony goal update`, `symphony goal review`, `symphony goal gate`, event registration, commit, merge, push, tag, or release command was run by this reviewer.

The checkout included dirty files from task-1 through task-4 and generated Workbench assets. The review stayed scoped to task-4 paths and did not revert or clean earlier task work.

## Scope checked

Task-4 acceptance is to write and read the confirmed implementation run through the existing goal operation registry, then bridge run result, artifact refs, and verifier summary into Active Goal, Operations, and Implementation paths.

Reviewed inputs:

- `docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md`
- `docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md`
- `docs/plans/v29-task-4-worker-evidence-2026-06-01.md`

Reviewed implementation paths:

- `src/symphony/goal-operation-run-registry.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `tests/v23-goal-operation-run-registry.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CTaiFEXY.js`
- `src/symphony/workbench-static/assets/index-DEceTgZX.css`

## Implementation evidence

`src/symphony/goal-operation-run-registry.js` extends `goal-operation-runs.v1` with `commandKind: "implementation"` and optional `output`, `runResult`, `artifactRefs`, `verifierSummary`, and `failureReason`. Existing update, review, and gate operation records remain in the same registry contract.

`src/symphony/console.js` records a confirmed controlled implementation run through `recordControlledImplementationOperationRunFromConfirmation`, using `recordGoalOperationRun` with `commandKind: "implementation"`, `commandName: "symphony do --confirm-plan"`, the returned run result, artifact refs, verifier summary, output summary, and failure reason. The confirm response returns `operationRun` and refreshed `goal-operation-runs.v1` data.

`frontend/workbench/src/api/contracts.js` projects the same registry entry into `activeGoal.operationConsole.latest` and `activeGoal.controlledImplementationPlanPreview.runResultBridge`. The projected fields include run id, execution plan id, run status, exit code, verifier status, write boundary, workspace refs, evidence artifact path, artifact refs, changed-file count, output summary, and failure reason.

`frontend/workbench/src/App.jsx` displays the Operation Console run-result fields and the Implementation path run-result bridge. The confirm button posts only the preview-derived body fields built from `goalId`, `taskId`, `planId`, and `planHash`.

The backend and frontend tests cover:

- Registry persistence of controlled implementation run output, artifacts, and verifier summary.
- Rejection of unsupported confirm body fields before a run starts.
- Rejection of mismatched plan hash before a run starts.
- Successful confirm response with `controlled-implementation-run-confirmation.v1`, `operationRun`, and refreshed operations.
- Workbench projection of operation console run result and implementation run-result bridge from `goal-operation-runs.v1`.

## Acceptance commands

### `pnpm check`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit code `0`.

```text
tests 739
suites 115
pass 739
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4808.557167
```

### `pnpm workbench:build`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DEceTgZX.css   20.62 kB | gzip:   3.69 kB
src/symphony/workbench-static/assets/index-CTaiFEXY.js   916.52 kB | gzip: 168.49 kB
```

### `git diff --check`

Result: exit code `0`; no output.

### `pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json`

Result: exit code `0`.

Observed task-4 fields:

```json
{
  "taskId": "task-4",
  "title": "Operation console and run-result bridge",
  "status": "in-progress",
  "statusSource": "goal-event-log.v1:evt_5b76cf07d20b39f7",
  "workerEvidenceRef": "docs/plans/v29-task-4-worker-evidence-2026-06-01.md",
  "reviewEvidenceRef": null,
  "reviewVerdict": null,
  "mainVerificationRef": null,
  "blockers": []
}
```

Additional read-only check:

```text
pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json
```

Result: exit code `0`. It returned `next.taskId: "task-4"`, `next.role: "reviewer"`, `next.phase: "review"`, and reason `Worker evidence exists for task-4 but reviewer verdict is missing.`

## Findings

No blocking product, test, or contract issue was found in the task-4 scope.

The implementation uses the existing goal operation registry instead of adding a new artifact or goal framework. It does not add a generic shell runner, browser terminal, arbitrary model invocation path, generic permission system, command DSL, merge path, push path, tag path, or release path.

The confirm route accepts only preview context fields and recomputes the active goal/task preview before starting the existing `symphony do --confirm-plan <plan-id> --json` path. The tests verify that extra fields such as `command` and mismatched plan hashes do not start the run.

The operation registry is not treated as approval, main verification, adoption readiness, or release readiness evidence. Review and main-verification fields remain null for task-4 after worker evidence, and `goal next` routes the task to the reviewer.

## Residual risks

The worktree still contains uncommitted and untracked files from prior v29 tasks and generated Workbench assets. This review did not separate those changes into commits.

`goal-status` still includes a copy-only `nextActions` entry labelled `Start task-4`, while `goal next` correctly routes task-4 to reviewer review. This review did not treat that label as a task-4 blocker because task-4 scope is the operation console and run-result bridge, and the controlled next-role source is `goal-next-action.v1`.

No browser screenshot was taken in this review. The React shell and Workbench projection are covered by `pnpm test` and `pnpm workbench:build`.

## Recovery steps

If a later verifier sees a missing implementation run in Workbench, read `GET /api/goals/<goal-id>/operations` and check for a `goal-operation-runs.v1` entry with `commandKind: "implementation"` for the same task.

If confirm fails before a run starts, rerun the controlled implementation preview and confirm only with the returned `goalId`, `taskId`, `planId`, and `planHash`.

If the isolated run fails after starting, use the registry fields `failureReason`, `verifierSummary`, `artifactRefs`, `output`, and `runResult` to decide whether the worker needs revision.

If task-4 remains waiting after this review evidence is present, register the reviewer verdict through the controlled `symphony goal review` dry-run and confirm flow using this evidence path.
