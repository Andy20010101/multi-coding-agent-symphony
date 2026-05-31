# v22 task-3 worker evidence

Goal id: `v22-goal-prompt-handoff-workspace`  
Task id: `task-3`  
Branch: `v22-task-3-subagent-handoff-board`  
User-visible value: 用户能知道哪个 subagent 该接手，而不是自己记。

## Implementation summary

Prompt Workspace now includes a Subagent Handoff Board for the selected managed goal. The board reads the selected goal's `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, and `goal-closeout-report.v1` routes, then shows each task's worker started state, worker evidence state, reviewer verdict, main verification state, closeout gaps, and current handoff role.

The current handoff role is displayed only from `goal-next-action.v1`. For the active v22 goal during verification, task-3 showed `handoff: worker`, route states were ready, and the worker.started event `evt_648a28ec2d1c078e` was visible in the board.

## Files changed

- `frontend/workbench/src/api/contracts.js`: adds the projected `SubagentHandoffBoard` model and task cell source policy.
- `frontend/workbench/src/api/client.js`: adds controlled GET fetching for selected goal progress, events, next, and closeout routes.
- `frontend/workbench/src/App.jsx`: renders the Subagent Handoff Board inside `/workbench/prompts`.
- `frontend/workbench/src/styles/workbench.css`: adds responsive board and handoff-step layout.
- `tests/workbench-api-client.test.js`: covers controlled route fetching and source-only board projection.
- `docs/workbench-operator-guide.md`: documents the board source boundaries.
- `src/symphony/workbench-static/index.html` and `src/symphony/workbench-static/assets/*`: rebuilt Workbench static assets from `pnpm workbench:build`.

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
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

tests 695
suites 111
pass 695
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3700.509125
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:38475) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:38475) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:38475) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-DiQWsXSk.css   13.18 kB │ gzip:   2.81 kB
src/symphony/workbench-static/assets/index-O1ES040M.js   722.77 kB │ gzip: 134.58 kB

✓ built in 151ms
```

### `git diff --check`

Exit code: 0

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json`

Exit code: 0

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v22-goal-prompt-handoff-workspace",
  "goalTitle": "v22 Prompt Handoff Workspace",
  "generatedAt": "2026-05-31T01:46:49.252Z",
  "baseline": {
    "tag": "v21",
    "commit": null,
    "evidenceRef": "docs/plans/v21-release-evidence-2026-05-29.md"
  },
  "summary": {
    "totalTasks": 5,
    "completedTasks": 2,
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
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_6ac008d2266fc17a",
      "branch": "v22-task-1-prompt-workspace-route",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v22-task-1-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v22-task-1-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v22-task-1-main-verification-evidence-2026-05-29.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-2",
      "title": "Role-specific prompt renderer",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_d5ccccc00398745f",
      "branch": "v22-task-2-role-specific-prompt-renderer",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v22-task-2-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v22-task-2-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v22-task-2-main-verification-evidence-2026-05-29.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-3",
      "title": "Subagent handoff board",
      "status": "in-progress",
      "statusSource": "goal-event-log.v1:evt_648a28ec2d1c078e",
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
      "label": "Start task-3",
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

## Browser verification

Built console Workbench was opened at `http://127.0.0.1:8765/workbench/prompts`. The Subagent Handoff Board rendered for `v22-goal-prompt-handoff-workspace`, showed `next.taskId` as `task-3`, `next.role` as `worker`, source policy as `goal-event-log.v1 + goal-progress-ledger.v1 + goal-next-action.v1 + goal-closeout-report.v1`, and task-3 worker started evidence from `evt_648a28ec2d1c078e`.

## Boundary notes

- Status is projected from `goal-event-log.v1`, `goal-progress-ledger.v1`, `goal-next-action.v1`, and `goal-closeout-report.v1`.
- The board does not infer status from branch names, file names, commit messages, prompt text, or copy-only command text.
- The Workbench action path remains centered on `goal-status`, `goal next`, `goal prompt`, `goal update/review/gate`, and `goal closeout`; it does not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level action list.
- No generic shell runner, safety framework, permission system, or goal framework was added.
- I did not register reviewer approval, main verification, release gates, or `release.ready`.
- Worker does not approve itself.

## Reviewer handoff checklist

- Review `/workbench/prompts` and confirm the selected goal's handoff board shows each task's worker started, evidence recorded, reviewer verdict, and main verification state.
- Confirm task-3 shows the next handoff role from `goal-next-action.v1`, not from branch or evidence path text.
- Inspect `tests/workbench-api-client.test.js` for controlled route fetching and source-only projection coverage.
- Re-run `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check`.

## Revision update: main verification status projection

Reviewer finding addressed: the Subagent Handoff Board no longer projects `mainVerification.status` from `task.mainVerificationRef`. The main verification cell now prefers explicit `main.verification-passed` / `main.verification-failed` events as the handoff status. When the ledger has only `mainVerificationRef` and no explicit gate event, the status is `recorded`, and the path remains in `mainVerification.evidenceRef`.

Files changed in this revision:

- `frontend/workbench/src/api/contracts.js`: changed main verification handoff projection precedence and added explicit status mapping for `main.verification-passed` and `main.verification-failed`.
- `tests/workbench-api-client.test.js`: added assertions that a task with `mainVerificationRef` plus `main.verification-passed` shows `mainVerification.status.value: passed` and keeps the evidence path in `mainVerification.evidenceRef.value`; also covers the ledger-only `recorded` fallback.
- `src/symphony/workbench-static/index.html` and `src/symphony/workbench-static/assets/index-BRpcXqMt.js`: rebuilt Workbench static assets with the revised projection.

Focused check before full validation:

### `node --test tests/workbench-api-client.test.js`

Exit code: 0

```text
✔ v15 Workbench read-only API client (47.884417ms)
ℹ tests 19
ℹ suites 1
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 103.481959
```

## Revision command results

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

ℹ tests 695
ℹ suites 111
ℹ pass 695
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3652.546584
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:57342) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:57342) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:57342) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DiQWsXSk.css   13.18 kB │ gzip:   2.81 kB
src/symphony/workbench-static/assets/index-BRpcXqMt.js   723.15 kB │ gzip: 134.65 kB

✓ built in 150ms
```

### `git diff --check`

Exit code: 0

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json`

Exit code: 0

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v22-goal-prompt-handoff-workspace",
  "goalTitle": "v22 Prompt Handoff Workspace",
  "generatedAt": "2026-05-31T01:58:32.488Z",
  "baseline": {
    "tag": "v21",
    "commit": null,
    "evidenceRef": "docs/plans/v21-release-evidence-2026-05-29.md"
  },
  "summary": {
    "totalTasks": 5,
    "completedTasks": 2,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 1,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "tasks": [
    {
      "taskId": "task-1",
      "title": "Prompt Workspace route",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_6ac008d2266fc17a",
      "branch": "v22-task-1-prompt-workspace-route",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v22-task-1-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v22-task-1-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v22-task-1-main-verification-evidence-2026-05-29.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-2",
      "title": "Role-specific prompt renderer",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_d5ccccc00398745f",
      "branch": "v22-task-2-role-specific-prompt-renderer",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v22-task-2-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v22-task-2-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v22-task-2-main-verification-evidence-2026-05-29.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-3",
      "title": "Subagent handoff board",
      "status": "needs-revision",
      "statusSource": "goal-event-log.v1:evt_adb608ca4767efe4",
      "branch": "v22-task-3-subagent-handoff-board",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v22-task-3-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v22-task-3-review-evidence-2026-05-29.md",
      "reviewVerdict": "NEEDS_REVISION",
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
      "label": "Start task-3",
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

## Revision handoff notes

- The reviewer should re-check task-1/task-2 in `/workbench/prompts`: main verification status should be `passed`, with the evidence file displayed under `evidenceRef`.
- The board still uses only `goal-event-log.v1`, `goal-progress-ledger.v1`, `goal-next-action.v1`, and `goal-closeout-report.v1` for handoff status.
- I did not add release gates, release.ready, model execution, a shell runner, auto-registration, reviewer approval, or main verification events.
- I did not register any goal events; controller should run the dry-run and confirm registration flow after this handoff.
