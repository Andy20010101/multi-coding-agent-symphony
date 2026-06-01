# v22 task-1 review evidence

Goal id: `v22-goal-prompt-handoff-workspace`  
Task id: `task-1`  
Role: independent reviewer  
Branch reviewed: `v22-task-1-prompt-workspace-route`  
Evidence date: 2026-05-29

## Findings

No blocking findings.

## Verdict

APPROVED

## Reviewed files and diff scope

Reviewed working-tree diff against `main`. `git diff main --stat` reported:

```text
 frontend/workbench/src/App.jsx                     |   386 +-
 frontend/workbench/src/api/client.js               |    66 +
 frontend/workbench/src/styles/workbench.css        |    58 +
 src/symphony/console.js                            |   116 +-
 .../workbench-static/assets/index-BspYnYKl.css     |   665 -
 .../workbench-static/assets/index-DMa5Vmdp.js      | 14968 -------------------
 src/symphony/workbench-static/index.html           |     4 +-
 tests/workbench-api-client.test.js                 |    68 +
 tests/workbench-route-smoke.test.js                |    22 +-
 9 files changed, 706 insertions(+), 15647 deletions(-)
```

Reviewed worker evidence: `docs/plans/v22-task-1-worker-evidence-2026-05-29.md`.

The branch also contains untracked `fixtures/contracts/goal-runbook.v22-goal-prompt-handoff-workspace.v1.json`, which matches the v22 managed runbook shape used by the route.

## Acceptance decision

Accepted.

- `/workbench/prompts` is served as a Workbench SPA route.
- The route exposes left-side selectors for managed goal, role, and task.
- The right side renders a `goal-prompt-pack.v1` prompt pack from `GET /api/goals/<goal-id>/prompt?task=<task-id>&role=<role>`.
- Browser verification generated task-1 prompts for `worker`, `reviewer`, and `main-verifier`.
- The route uses the goal/runbook/prompt flow. I did not find the old v8 `scan/do/review/verify/status/continue/artifacts` surface presented as the primary prompt-workspace action list.

## Boundary notes

- I did not implement task-1.
- I did not edit product code.
- I did not register goal events.
- Prompt Workspace display is copy/render handoff only. The route shows `readOnly: true`, `copyOnly: true`, `workbenchWriteAvailable: false`, `browserExecutionAvailable: false`, and `modelInvocationAvailable: false`.
- The new prompt route uses GET-only API reads for runbook and prompt pack selection. It does not start a subagent, invoke a model, run a shell command, or auto-register approval.
- Existing v21 dry-run/confirm event controls remain outside the new prompt route scope.

## Validation commands

### `pnpm check`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: `0`

```text
ℹ tests 692
ℹ suites 111
ℹ pass 692
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3677.274
```

### `pnpm workbench:build`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-D4CiDpgV.css   12.30 kB │ gzip:   2.68 kB
src/symphony/workbench-static/assets/index-BvEjAy60.js   703.94 kB │ gzip: 131.68 kB

✓ built in 144ms
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
      "workerEvidenceRef": "docs/plans/v22-task-1-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": null,
      "reviewVerdict": null,
      "mainVerificationRef": null
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

Started local console:

```text
pnpm symphony console --host 127.0.0.1 --port 8765
Status: listening
Next: http://127.0.0.1:8765/
```

Opened `http://127.0.0.1:8765/workbench/prompts` in the in-app browser and selected `task-1` for each required role.

Observed result:

```json
{
  "hasWorkspace": true,
  "hasGeneratedPromptPack": true,
  "workerOk": true,
  "reviewerOk": true,
  "mainVerifierOk": true,
  "noExecutionCopy": true,
  "workerRoute": "/api/goals/v22-goal-prompt-handoff-workspace/prompt?task=task-1&role=worker",
  "reviewerRoute": "/api/goals/v22-goal-prompt-handoff-workspace/prompt?task=task-1&role=reviewer",
  "mainVerifierRoute": "/api/goals/v22-goal-prompt-handoff-workspace/prompt?task=task-1&role=main-verifier"
}
```

The browser harness also printed a Statsig network timeout unrelated to the local app. It did not prevent local route verification.

## Next handoff

Controller can register the reviewer verdict through the dry-run then confirm flow using this evidence file:

```text
docs/plans/v22-task-1-review-evidence-2026-05-29.md
```

If confirmed as approved, task-1 is ready for main verification.
