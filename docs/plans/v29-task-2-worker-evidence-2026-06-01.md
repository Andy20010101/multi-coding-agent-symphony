# v29 task-2 worker evidence

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Task id: `task-2`  
Branch: `v29-task-2-controlled-implementation-plan-preview`  
Worker: `codex-v29-task-2-worker`

## Branch and worktree context

The preferred task-2 branch was created successfully from the current checkout:

```text
v29-task-2-controlled-implementation-plan-preview
```

No branch fallback was needed for task-2. The current checkout already carried task-1 source/static/evidence changes and the untracked v29 runbook fixture before task-2 edits started. I did not revert or overwrite that task-1 work. The evidence below covers the combined current checkout, with task-2 changes added on top.

## Implementation summary

Implemented a Workbench controlled implementation plan preview vertical slice:

- Added `GET /api/goals/<goal-id|latest>/implementation-plan-preview?task=<task-id>`.
- The route returns `controlled-implementation-plan-preview.v1`.
- The backend builds the preview from the managed runbook, `goal-next-action.v1`, `goal-prompt-pack.v1` worker prompt, and scoped `goal-event-log.v1`.
- The preview exposes only active task constraints, worker prompt, goal/task/evidence refs, existing allowlist-style route fields, plan id/hash, write semantics, and safety flags.
- The route rejects prompt/path/command/confirm/planHash inputs and repeated query fields.
- The route does not run `symphony do`, start an isolated workspace run, call a model, run shell commands, open files, merge, push, tag, or register approval/readiness state.
- The Workbench client fetches the preview only when `goal next` assigns the active task to worker implementation or revision.
- Added a Workbench panel after Active Task Implementation Eligibility showing plan id/hash, `symphony do --write --json` semantics, active task constraints, worker prompt, evidence refs, endpoint restrictions, and safety fields.

## Workbench user path changed

```text
Open Workbench -> Active Goal -> Active Task Implementation Eligibility -> Controlled Implementation Plan Preview
```

After task-1 eligibility says the active task can enter controlled implementation, the user can inspect the frozen preview context and plan hash before any task-3 confirm flow exists.

## Files changed

Task-2 implementation files:

- `src/symphony/console.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-g77dGHMD.css`
- `src/symphony/workbench-static/assets/index-IJsKpjNP.js`
- `src/symphony/workbench-static/assets/index-B9IfCFVY.css` deleted by Workbench rebuild
- `src/symphony/workbench-static/assets/index-NKKg_tJp.js` deleted by Workbench rebuild

Pre-existing task-1 / v29 files still present in this checkout:

- `docs/plans/v29-task-1-worker-evidence-2026-06-01.md`
- `docs/plans/v29-task-1-review-evidence-2026-06-01.md`
- `docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md`
- `fixtures/contracts/goal-runbook.v29-active-task-controlled-implementation-workspace.v1.json`

## Command results

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
tests 736
suites 115
pass 736
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 7156.848834
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.28 kB
src/symphony/workbench-static/assets/index-g77dGHMD.css   20.38 kB | gzip:   3.66 kB
src/symphony/workbench-static/assets/index-IJsKpjNP.js   898.07 kB | gzip: 165.71 kB

built in 55ms
```

### `git diff --check`

Exit code: 0

```text
```

### `pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json`

Exit code: 0

Relevant result:

```json
{
  "summary": {
    "totalTasks": 5,
    "completedTasks": 1,
    "releaseReady": false
  },
  "tasks": [
    {
      "taskId": "task-1",
      "status": "main-verified",
      "workerEvidenceRef": "docs/plans/v29-task-1-worker-evidence-2026-06-01.md",
      "reviewEvidenceRef": "docs/plans/v29-task-1-review-evidence-2026-06-01.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md"
    },
    {
      "taskId": "task-2",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null
    }
  ],
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-2",
      "command": "pnpm check"
    }
  ]
}
```

## Boundary notes

- This is a Workbench vertical slice, not a generic safety layer.
- The browser route is GET-only and scoped to an active managed goal/task.
- The preview is built from explicit backend contracts: runbook, goal next, worker prompt, event log, and goal status projection.
- The preview does not execute implementation, create a workspace run, invoke models, run shell commands, open local files, read arbitrary paths, download artifacts, merge, push, tag, or publish.
- It does not register worker evidence, reviewer approval, main verification, or release readiness.
- It does not infer approval/readiness from branch names, filenames, commit messages, prompt text, task titles, or frontend state.
- The old v8 `scan/do/review/verify/status/continue/artifacts` list was not added as the Workbench top-level action model.

## Recovery steps

- If the preview route returns unavailable, run `pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json` and confirm it assigns the same task to `role: "worker"` and phase `implement` or `revision`.
- If the preview route rejects input, remove any query fields except `task`.
- If the Workbench panel is missing, rerun `pnpm workbench:build` and open `/workbench/`.
- If a blocker event is present, resolve it only through the existing `symphony goal update` dry-run plus matching plan-hash confirm flow.

## Controller handoff

Controller can register `worker.evidence-recorded` for task-2 with this evidence ref:

```text
docs/plans/v29-task-2-worker-evidence-2026-06-01.md
```
