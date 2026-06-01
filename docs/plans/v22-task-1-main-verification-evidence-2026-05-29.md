# v22 task-1 main verification evidence

Goal id: `v22-goal-prompt-handoff-workspace`  
Task id: `task-1`  
Branch checked: `v22-task-1-prompt-workspace-route`  
Checked commit: `92a69fb90038fbe2f0bcf129ed4588a9e43326d8`  
Evidence date: 2026-05-31

## Prechecks

- Runbook checked: `docs/plans/workbench-v20-v28-goal-runbooks/v22_prompt-handoff-workspace_goal_runbook_latest.md`.
- Worker evidence read: `docs/plans/v22-task-1-worker-evidence-2026-05-29.md`.
- Reviewer evidence read: `docs/plans/v22-task-1-review-evidence-2026-05-29.md`.
- Reviewer approval source: `docs/plans/v22-task-1-review-evidence-2026-05-29.md`, verdict `APPROVED`.
- Goal-status reviewer source: `goal-event-log.v1:evt_529ebefe7c134050`.
- Goal-status precheck showed task-1 `workerEvidenceRef` as `docs/plans/v22-task-1-worker-evidence-2026-05-29.md`, `reviewEvidenceRef` as `docs/plans/v22-task-1-review-evidence-2026-05-29.md`, and `reviewVerdict` as `APPROVED`.

## Acceptance Checked

Task-1 acceptance from the v22 runbook:

- 用户能从 UI 生成某个 task 的 worker/reviewer/main-verifier prompt。
- 新增 `/workbench/prompts` 或等价路由，左侧选 goal/task/role，右侧展示由 goal prompt 生成的 prompt pack。

Verification result:

- `/workbench/prompts` served the Workbench Prompt Handoff Workspace.
- The left side exposed managed goal, role, and task selectors.
- The right side rendered a `goal-prompt-pack.v1` prompt pack.
- Browser verification selected `task-1` for `worker`, `reviewer`, and `main-verifier`.
- Each role showed a copy-only prompt pack from `/api/goals/v22-goal-prompt-handoff-workspace/prompt?task=task-1&role=<role>`.

Browser check result:

```json
{
  "roleSelectCount": 1,
  "taskSelectCount": 1,
  "roleVerificationResults": [
    {
      "copyOnlyShown": true,
      "hasPromptText": true,
      "promptMentionsRole": true,
      "promptRoute": "prompt route/api/goals/v22-goal-prompt-handoff-workspace/prompt?task=task-1&role=worker",
      "readOnlyShown": true,
      "role": "worker",
      "selectedRole": "selected roleworker",
      "selectedTask": "selected tasktask-1"
    },
    {
      "copyOnlyShown": true,
      "hasPromptText": true,
      "promptMentionsRole": true,
      "promptRoute": "prompt route/api/goals/v22-goal-prompt-handoff-workspace/prompt?task=task-1&role=reviewer",
      "readOnlyShown": true,
      "role": "reviewer",
      "selectedRole": "selected rolereviewer",
      "selectedTask": "selected tasktask-1"
    },
    {
      "copyOnlyShown": true,
      "hasPromptText": true,
      "promptMentionsRole": true,
      "promptRoute": "prompt route/api/goals/v22-goal-prompt-handoff-workspace/prompt?task=task-1&role=main-verifier",
      "readOnlyShown": true,
      "role": "main-verifier",
      "selectedRole": "selected rolemain-verifier",
      "selectedTask": "selected tasktask-1"
    }
  ]
}
```

## Commands

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
ℹ duration_ms 3646.043375
```

### `pnpm workbench:build`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:89718) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:89718) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:89718) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-D4CiDpgV.css   12.30 kB │ gzip:   2.68 kB
src/symphony/workbench-static/assets/index-BvEjAy60.js   703.94 kB │ gzip: 131.68 kB

✓ built in 143ms
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
  "generatedAt": "2026-05-31T01:15:30.360Z",
  "baseline": {
    "tag": "v21",
    "commit": null,
    "evidenceRef": "docs/plans/v21-release-evidence-2026-05-29.md"
  },
  "summary": {
    "totalTasks": 5,
    "completedTasks": 1,
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
      "status": "approved",
      "statusSource": "goal-event-log.v1:evt_529ebefe7c134050",
      "branch": "v22-task-1-prompt-workspace-route",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v22-task-1-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v22-task-1-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
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
      "label": "Start task-2",
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

## Acceptance Decision

PASSED.

Task-1 meets the runbook acceptance for the Prompt Workspace route. The implementation was checked at commit `92a69fb90038fbe2f0bcf129ed4588a9e43326d8`.

## Closeout Blockers

None for task-1 main verification evidence.

## Boundary Notes

- No goal gate event was registered.
- No release-ready claim was made.
- No task-2 role-specific renderer acceptance was claimed beyond verifying the three task-1 required roles.
- The route remains display/copy-only and does not start a subagent, invoke a model, run a shell command, or infer approval from frontend state.
- The checked commit is on `v22-task-1-prompt-workspace-route`; this verifier did not push or declare release readiness.
