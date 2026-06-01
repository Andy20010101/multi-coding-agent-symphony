# v29 task-3 review evidence

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Task id: `task-3`  
Reviewer role: `v29 task-3 independent reviewer`  
Reviewed worker evidence: `docs/plans/v29-task-3-worker-evidence-2026-06-01.md`  
Verdict: `APPROVED`

## Review result

Task-3 matches the runbook scope. Workbench confirm is connected to the existing `symphony do --confirm-plan <plan-id> --json` path through the backend confirm route, and the accepted confirm body is limited to the preview-returned `goalId`, `taskId`, `planId`, and `planHash`.

No product fixes are required before the controller registers the task-3 reviewer event.

## Reviewed files

- `docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md`
- `docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md`
- `docs/plans/v29-task-3-worker-evidence-2026-06-01.md`
- `src/symphony/console.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `fixtures/contracts/goal-runbook.v29-active-task-controlled-implementation-workspace.v1.json`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-C4YWWvE1.js`
- `src/symphony/workbench-static/assets/index-g77dGHMD.css`

## Acceptance mapping

- Isolated workspace execution: `src/symphony/console.js` materializes a `symphony.execution-plan` with `writeBoundary: "isolated-workspace"`, `mainWorktreeWrites: false`, `workspaceWrites: true`, `executionMode: "dry-run"`, and then invokes `runSymphonyCli` with `do --state-dir <state-dir> --confirm-plan <plan-id> --json`. Existing confirm-plan validation still checks the frozen execution plan invariants before the harness starts.
- Same preview context: confirm rebuilds the controlled implementation preview for the submitted `taskId`, checks body `goalId` against the resolved route goal, and rejects if the recomputed `planId` or `planHash` differs from the submitted values.
- Accepted body fields: confirm calls `assertOnlyControlledImplementationConfirmBodyKeys` before reading required fields. Allowed keys are only `goalId`, `taskId`, `planId`, and `planHash`.
- Workbench body construction: `frontend/workbench/src/App.jsx` builds the confirm body only from `preview.goalId`, `preview.taskId`, `preview.plan.planId`, and `preview.plan.planHash`. The client posts JSON and validates the response contract `controlled-implementation-run-confirmation.v1`.
- Scope boundaries: the implementation adds no arbitrary shell runner, browser terminal, arbitrary path or file input, model invocation option, merge/push/tag/publish path, self-approval path, main-verification path, or release-readiness path.
- No readiness inference: preview and eligibility state are derived from managed runbook, goal next, goal prompt, goal-status, and goal-event-log contracts. The code explicitly marks branch, filename, commit message, prompt text, task title, and frontend heuristic as unsupported inference sources.
- Rejection before run start: `tests/workbench-api-client.test.js` covers extra `command` input and mismatched `planHash`; both return 400 and keep `context.harnessCalls.length === 0`.

## Command results

### `pnpm check`

Result: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit 0.

```text
tests 738
suites 115
pass 738
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4674.063333
```

Task-3 coverage observed in the passing suite:

```text
v15 Workbench read-only API client
  ✔ posts controlled implementation run confirms with only preview context fields
  ✔ projects active task implementation eligibility from goal contracts and explicit events only
  ✔ previews the controlled implementation plan from active task contracts without executing implementation
  ✔ confirms only the matching controlled implementation preview plan into an isolated workspace run

v16 Workbench route smoke and server parity
  ✔ blocks non-GET Workbench and API requests without writing state
  ✔ statically keeps the Workbench source free of execution, write, download, local-open, and model entry points
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

✓ built in 56ms
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
    {
      "taskId": "task-1",
      "status": "main-verified"
    },
    {
      "taskId": "task-2",
      "status": "main-verified"
    },
    {
      "taskId": "task-3",
      "status": "in-progress",
      "statusSource": "goal-event-log.v1:evt_4239d957cb6a2b41",
      "workerEvidenceRef": "docs/plans/v29-task-3-worker-evidence-2026-06-01.md",
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null
    }
  ],
  "releaseGates": {
    "pnpmCheck": "unknown",
    "pnpmTest": "unknown",
    "workbenchBuild": "unknown",
    "diffCheck": "unknown",
    "docsUpdated": "unknown",
    "tagEvidence": "unknown"
  },
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-3",
      "command": "pnpm check"
    }
  ]
}
```

## Findings

No blocking or non-blocking product findings.

## Boundary notes

- I did not run `symphony goal update`, `symphony goal review`, or `symphony goal gate`.
- I did not declare main verification or release readiness.
- I did not edit product files. The only file added by this reviewer is this evidence document.
- The worktree already contained task-1, task-2, task-3 implementation files, evidence files, fixture data, and rebuilt Workbench static assets before this review document was written.
- No repo-local/current-checkout fallback was needed. All required checks ran in `/Users/andy/Documents/project/multi-coding-agent-symphony`.

## Recovery steps

- If confirm returns `invalid-controlled-implementation-confirm-request`, resend only `goalId`, `taskId`, `planId`, and `planHash` from the current preview response.
- If confirm returns `controlled-implementation-confirm-context-mismatch`, refresh the preview from the same `/api/goals/<goal-id>/implementation-plan-preview?task=<task-id>` context and use that route's confirm endpoint.
- If confirm returns `controlled-implementation-confirm-plan-mismatch`, discard the old plan id/hash, refresh preview, and submit the new preview context.
- If the existing confirm-plan path fails after validation, inspect the returned error envelope and the managed `.symphony` plan/run artifacts. Do not infer worker evidence, reviewer approval, main verification, or release readiness from filenames, branches, prompts, or Workbench display state.

## Controller handoff

Controller can register `reviewer.approved` for task-3 with evidence ref `docs/plans/v29-task-3-review-evidence-2026-06-01.md`.
