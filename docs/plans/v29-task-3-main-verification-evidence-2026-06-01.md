# v29 task-3 main verification evidence

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Task id: `task-3`  
Verifier role: `v29 task-3 main-verifier`  
Verification result: `PASSED`

## Evidence refs

- Worker event: `evt_4239d957cb6a2b41`
- Worker evidence: `docs/plans/v29-task-3-worker-evidence-2026-06-01.md`
- Reviewer event: `evt_f83eb932fa1b325d`
- Review evidence: `docs/plans/v29-task-3-review-evidence-2026-06-01.md`
- Main verification evidence: `docs/plans/v29-task-3-main-verification-evidence-2026-06-01.md`

## Verification basis

Verification used the current repo checkout at `/Users/andy/Documents/project/multi-coding-agent-symphony`.

Current branch:

```text
v29-task-3-confirm-isolated-workspace-execution
```

The checkout was dirty with task-1, task-2, and task-3 implementation/evidence/static asset changes already present. Clean main, linked worktree, checkout, merge, staging, push, tag, publish, and release-readiness operations were not run. Current-checkout verification was used to avoid changing the shared dirty checkout. No fallback command failed, and no earlier blocker needed to be superseded.

## Inspected files and contracts

- `docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md`
- `docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md`
- `docs/plans/v29-task-3-worker-evidence-2026-06-01.md`
- `docs/plans/v29-task-3-review-evidence-2026-06-01.md`
- `src/symphony/console.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `fixtures/contracts/goal-runbook.v29-active-task-controlled-implementation-workspace.v1.json`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-C4YWWvE1.js`
- `src/symphony/workbench-static/assets/index-g77dGHMD.css`

Observed contracts:

- `controlled-implementation-plan-preview.v1`
- `controlled-implementation-run-confirmation.v1`
- `symphony.execution-plan`
- `goal-progress-ledger.v1`

## Boundary checks

- `POST /api/goals/<goal-id|latest>/implementation-run-confirm` accepts no query parameters.
- Confirm body validation allows only `goalId`, `taskId`, `planId`, and `planHash`.
- Confirm rejects unsupported body fields before reading or running the plan.
- Confirm requires body `goalId` to match the route goal context.
- Confirm recomputes the controlled implementation preview using the submitted task id and the managed goal context.
- Confirm rejects mismatched `planId` or `planHash` before materializing or running a plan.
- Confirm materializes a `symphony.execution-plan` with `writeBoundary: "isolated-workspace"`, `mainWorktreeWrites: false`, `workspaceWrites: true`, and `executionMode: "dry-run"`.
- Confirm maps success to the existing CLI path: `symphony do --confirm-plan <plan-id> --json`. The implementation calls `runSymphonyCli` with `do --state-dir <state-dir> --confirm-plan <plan-id> --json`.
- The Workbench frontend builds the confirm body only from preview `goalId`, `taskId`, `planId`, and `planHash`.
- Generated Workbench static assets contain the task-3 confirm contract and reference the current generated JS/CSS assets after `pnpm workbench:build`.

Not present in the inspected task-3 path:

- Generic shell runner
- Browser terminal
- Arbitrary path or local file input
- Model invocation option
- Worker self-approval
- Merge, push, tag, or publish action
- Main verification shortcut
- Release readiness inference

## Command outcomes

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
duration_ms 4668.641709
```

Task-3 coverage observed in the passing output:

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
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-g77dGHMD.css   20.38 kB │ gzip:   3.66 kB
src/symphony/workbench-static/assets/index-C4YWWvE1.js   904.09 kB │ gzip: 166.71 kB

✓ built in 57ms
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
    "completedTasks": 3,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "tasks": [
    {
      "taskId": "task-1",
      "status": "main-verified",
      "mainVerificationRef": "docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md"
    },
    {
      "taskId": "task-2",
      "status": "main-verified",
      "mainVerificationRef": "docs/plans/v29-task-2-main-verification-evidence-2026-06-01.md"
    },
    {
      "taskId": "task-3",
      "status": "approved",
      "statusSource": "goal-event-log.v1:evt_f83eb932fa1b325d",
      "workerEvidenceRef": "docs/plans/v29-task-3-worker-evidence-2026-06-01.md",
      "reviewEvidenceRef": "docs/plans/v29-task-3-review-evidence-2026-06-01.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": null
    }
  ],
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-4",
      "command": "pnpm check"
    }
  ],
  "safety": {
    "readOnly": true,
    "copyOnly": true,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false
  }
}
```

The local goal-status output reports task-3 reviewer approval and `mainVerificationRef: null`. This document is the missing main verification evidence for task-3. This verifier did not run `symphony goal update`, `symphony goal review`, or `symphony goal gate`.

## Fallback notes

- Original blocked operation: none.
- Clean main and linked-worktree verification were not attempted because the current shared checkout already held the task implementation and evidence changes.
- Fallback path used: current branch, current diff, explicit goal event log as surfaced by `goal-status`, worker evidence, review evidence, generated Workbench static assets, and the required command outputs.
- Evidence/diff basis: current checkout plus `git status -sb`, `git diff --name-only`, targeted source/test/static asset inspection, and the five required verification commands.
- This does not supersede an earlier blocker.

## Recovery steps

- If confirm returns `invalid-controlled-implementation-confirm-request`, resend only `goalId`, `taskId`, `planId`, and `planHash` from the current preview response.
- If confirm returns `controlled-implementation-confirm-context-mismatch`, refresh the preview from the same goal route and submit against the matching confirm route.
- If confirm returns `controlled-implementation-confirm-plan-mismatch`, discard the old `planId` and `planHash`, refresh the preview, and submit the new preview context.
- If `symphony do --confirm-plan <plan-id> --json` fails after validation, inspect the returned error envelope and managed `.symphony` plan/run artifacts. Do not infer worker evidence, review approval, main verification, or release readiness from the run fields.
- If a later verification command fails, register task-3 main verification as failed with the failing command output and route the task back through the controlled revision path.

## Controller handoff

Task-3 main verification passed. The controller can register the task-3 main-verification gate as passed with evidence ref `docs/plans/v29-task-3-main-verification-evidence-2026-06-01.md`.

Do not treat this evidence as release readiness. Release readiness remains false until the explicit release gate and release-ready events are registered.
