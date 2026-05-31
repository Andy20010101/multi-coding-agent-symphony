# v22 task-1 worker evidence

Goal id: `v22-goal-prompt-handoff-workspace`  
Task id: `task-1`  
Branch: `v22-task-1-prompt-workspace-route`  
User-visible value: 用户能从 UI 生成某个 task 的 worker/reviewer/main-verifier prompt。

## Implementation summary

- Added `/workbench/prompts` as a Workbench SPA route.
- Added a left selector for managed goal, task, and role. Supported roles are `worker`, `reviewer`, `main-verifier`, and `release-manager`.
- Added a right-side generated prompt pack view backed by `goal-prompt-pack.v1`.
- Extended the existing goal prompt API so `GET /api/goals/<goal-id>/prompt?task=<task-id>&role=<role>` returns an explicit task/role prompt pack. Existing next-action prompt behavior remains available at `GET /api/goals/<goal-id>/prompt` and `GET /api/goals/latest/prompt`.
- Kept prompt display copy-only. The page does not run shell commands, call a model, start a subagent, or register review/main/release events.

## Files changed

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/console.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BvEjAy60.js`
- `src/symphony/workbench-static/assets/index-D4CiDpgV.css`
- Removed stale generated assets:
  - `src/symphony/workbench-static/assets/index-BspYnYKl.css`
  - `src/symphony/workbench-static/assets/index-DMa5Vmdp.js`

Pre-existing untracked file left untouched: `fixtures/contracts/goal-runbook.v22-goal-prompt-handoff-workspace.v1.json`.

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

...
✔ v15 Workbench read-only API client (72.081458ms)
✔ v16 Workbench route smoke and server parity (185.41975ms)
✔ v15 Workbench React/Vite shell (15.882459ms)
✔ v15 Workbench static serving (33.030083ms)
...
ℹ tests 692
ℹ suites 111
ℹ pass 692
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3934.51025
```

### `pnpm workbench:build`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:74328) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:74328) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:74328) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-D4CiDpgV.css   12.30 kB │ gzip:   2.68 kB
src/symphony/workbench-static/assets/index-BvEjAy60.js   703.94 kB │ gzip: 131.68 kB

✓ built in 148ms
```

### `git diff --check`

Exit code: `0`

```text
```

### `pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json`

Exit code: `0`

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v22-goal-prompt-handoff-workspace",
  "goalTitle": "v22 Prompt Handoff Workspace",
  "generatedAt": "2026-05-31T01:05:52.248Z",
  "baseline": {
    "tag": "v21",
    "commit": null,
    "evidenceRef": "docs/plans/v21-release-evidence-2026-05-29.md"
  },
  "summary": {
    "totalTasks": 5,
    "completedTasks": 0,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "tasks": [
    {
      "taskId": "task-1",
      "title": "Prompt Workspace route",
      "status": "in-progress",
      "statusSource": "goal-event-log.v1:evt_b65ed0f59c59e085",
      "branch": "v22-task-1-prompt-workspace-route",
      "commit": null,
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-2",
      "title": "Role-specific prompt renderer",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v22-task-2-role-specific-prompt-renderer",
      "commit": null,
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-3",
      "title": "Subagent handoff board",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v22-task-3-subagent-handoff-board",
      "commit": null,
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-4",
      "title": "Prompt-to-event shortcuts",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v22-task-4-prompt-to-event-shortcuts",
      "commit": null,
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-5",
      "title": "Prompt workspace tests and docs",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v22-task-5-prompt-workspace-tests-and-docs",
      "commit": null,
      "workerEvidenceRef": null,
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    }
  ],
  "releaseGates": {
    "pnpmCheck": "unknown",
    "pnpmTest": "unknown",
    "workbenchBuild": "unknown",
    "mutationGate": "unknown",
    "auditHigh": "unknown",
    "diffCheck": "unknown",
    "mcasDoctor": "unknown",
    "docsUpdated": "unknown",
    "tagEvidence": "unknown"
  },
  "blockers": [],
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-1",
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

## Browser check

Started local console with `pnpm symphony console --host 127.0.0.1 --port 8765` and opened `http://127.0.0.1:8765/workbench/prompts`.

Observed DOM result:

```json
{
  "hasPromptPack": true,
  "hasSelectors": true,
  "hasWorkspace": true,
  "promptSnippet": "/goal\n执行 v22-goal-prompt-handoff-workspace task-1 worker implement：Prompt Worksp",
  "selectedGoal": "v22-goal-prompt-handoff-workspace",
  "selectedRole": "worker",
  "selectedTask": "task-1"
}
```

The console server was stopped after the check.

## Boundary notes

- Workbench main path remains centered on latest/v19 goal/runbook/next-action command surface: `goal-status`, `goal next`, `goal prompt`, `goal update/review/gate`, `goal closeout`, and `symphony next --goal latest`.
- Did not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Did not add a generic safety framework, permission system, goal framework, or shell runner.
- Did not infer task approval, main verification, release readiness, or task completion from filenames, branches, commit messages, prompt text, command text, or frontend heuristics.
- Did not approve worker output, run reviewer approval, run main verification, run release gates, or declare release ready.
- Did not register goal events. The controller owns dry-run and confirmed event registration.

## Reviewer handoff checklist

- Review `/workbench/prompts` in the built Workbench.
- Check `GET /api/goals/<goal-id>/prompt?task=<task-id>&role=<role>` against worker, reviewer, and main-verifier roles.
- Confirm the existing next-action prompt route still works without query parameters.
- Confirm the Workbench route remains display/copy-only and does not introduce shell execution, model invocation, subagent launch, or event approval.
- Confirm generated static assets match `pnpm workbench:build`.
