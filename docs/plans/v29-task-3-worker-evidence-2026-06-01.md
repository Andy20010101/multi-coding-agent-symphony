# v29 task-3 worker evidence

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Task id: `task-3`  
Task: Confirm isolated workspace execution  
Branch: `v29-task-3-confirm-isolated-workspace-execution`  
Branch/fallback: requested branch was created and used. No repo-local/current-checkout fallback was needed. The checkout already contained task-1/task-2 implementation, evidence, static assets, and the v29 fixture; this task preserved those files.

## Implementation summary

Workbench now has a constrained confirm path for the active task implementation plan preview.

- Added `POST /api/goals/<goal-id|latest>/implementation-run-confirm`.
- The confirm body accepts only `goalId`, `taskId`, `planId`, and `planHash`.
- Backend confirm re-generates the same `controlled-implementation-plan-preview.v1` from managed runbook, goal next, worker prompt, and event log context.
- Confirm rejects unsupported fields, mismatched goal context, mismatched plan id, or mismatched plan hash before any implementation run starts.
- When the frozen preview context matches, the backend materializes a managed `symphony.execution-plan` and calls the existing `symphony do --confirm-plan <plan-id> --json` path.
- The Workbench panel exposes the confirm route from the preview contract and sends only the four preview fields.
- The response is `controlled-implementation-run-confirmation.v1` and reports the confirmed isolated workspace run fields, including `mainWorktreeWrites=false` and `workspaceWrites=true`.

## Files changed

- `src/symphony/console.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-C4YWWvE1.js`
- Existing generated static assets were replaced by `pnpm workbench:build`.

Pre-existing task-1/task-2 files remain present in the worktree and were not reverted.

## Workbench user path changed

User path:

```text
Open active task -> preview controlled implementation plan -> confirm isolated workspace run
```

The confirm button appears in the Controlled Implementation Plan Preview panel after preview data is available. It sends the backend-provided goal/task/plan id/hash context to `/implementation-run-confirm`. The backend performs the same-context check and then maps to the existing confirm-plan execution path.

## Boundary notes

- No arbitrary shell runner was added.
- No browser terminal was added.
- No arbitrary local path or file input was accepted.
- No model invocation path was added.
- No merge, push, tag, publish, adoption, reviewer approval, main verification, or release readiness path was added.
- Confirm status is not inferred from branch names, filenames, commit messages, prompt text, task titles, or frontend state.
- Failed body/context/hash validation does not start the implementation run. Tests verify extra `command` input and mismatched `planHash` keep harness calls at zero.
- Worker evidence is not registered by this worker. The controller must run the explicit `symphony goal update` flow if it accepts this evidence.

## Command results

### `pnpm check`

Result: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Initial result: exit 1.

Failure:

```text
tests/workbench-route-smoke.test.js
statistically keeps the Workbench source free of execution, write, download, local-open, and model entry points
AssertionError: api/contracts.js should not declare non-GET Workbench requests
```

Fix applied: removed the non-GET route template from `frontend/workbench/src/api/contracts.js`; confirm route remains backend-provided through the preview contract and is called through the dedicated client helper.

Final result: exit 0.

```text
tests 738
suites 115
pass 738
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4673.510042
```

### `pnpm workbench:build`

Result: exit 0.

```text
vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-g77dGHMD.css   20.38 kB │ gzip:   3.66 kB
src/symphony/workbench-static/assets/index-C4YWWvE1.js   904.09 kB │ gzip: 166.71 kB

✓ built in 53ms
```

### `git diff --check`

Result: exit 0. No output.

### `pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json`

Result: exit 0.

Key output:

```json
{
  "contractName": "goal-progress-ledger.v1",
  "goalId": "v29-active-task-controlled-implementation-workspace",
  "summary": {
    "totalTasks": 5,
    "completedTasks": 2,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false
  },
  "tasks": [
    { "taskId": "task-1", "status": "main-verified" },
    { "taskId": "task-2", "status": "main-verified" },
    {
      "taskId": "task-3",
      "status": "in-progress",
      "statusSource": "goal-event-log.v1:evt_4239d957cb6a2b41",
      "workerEvidenceRef": "docs/plans/v29-task-3-worker-evidence-2026-06-01.md"
    }
  ],
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-3",
      "command": "pnpm check"
    }
  ]
}
```

This worker did not run `symphony goal update`, `symphony goal review`, or `symphony goal gate`. The latest local goal-status command above reports an explicit task-3 worker evidence event already present in the managed event log.

## Additional focused checks

These were run while fixing the implementation:

```text
node --test tests/workbench-api-client.test.js
tests 34
pass 34
fail 0

node --test tests/workbench-shell.test.js
tests 23
pass 23
fail 0
```

## Recovery steps

- If Workbench confirm returns `invalid-controlled-implementation-confirm-request`, inspect the JSON body and remove any field other than `goalId`, `taskId`, `planId`, and `planHash`.
- If confirm returns `controlled-implementation-confirm-plan-mismatch`, refresh the preview for the same active goal/task and use the new plan id/hash.
- If confirm returns `controlled-implementation-preview-not-eligible`, re-run `goal-status` and `goal next`; the active task must still be assigned to the worker implementation or revision phase.
- If confirm starts and the isolated run fails, inspect the returned `confirmedRun.evidenceArtifactPath`, `sourceWorkspacePath`, and `changedFiles`; do not infer worker evidence, reviewer approval, main verification, or release readiness from those fields.

## Controller handoff

Worker evidence path: `docs/plans/v29-task-3-worker-evidence-2026-06-01.md`

The controller can register `worker.evidence-recorded` for task-3 using this evidence path after any independent checks it wants to run. This worker did not run `symphony goal update`, `symphony goal review`, or `symphony goal gate`.
