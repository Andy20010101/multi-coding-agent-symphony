# v22 task-3 main verification evidence

Goal id: `v22-goal-prompt-handoff-workspace`  
Task id: `task-3`  
Branch: `v22-task-3-subagent-handoff-board`  
Checked commit: `2be8dd80da0e97ca7aa7557429872dc907396e9e`

## Reviewer approval source

Reviewer evidence file read: `docs/plans/v22-task-3-review-evidence-2026-05-29.md`

Reviewer verdict: `APPROVED`

Latest goal-status reviewer source for task-3:

```text
task-3.status: approved
task-3.statusSource: goal-event-log.v1:evt_a43026102ca2dae2
task-3.workerEvidenceRef: docs/plans/v22-task-3-worker-evidence-2026-05-29.md
task-3.reviewEvidenceRef: docs/plans/v22-task-3-review-evidence-2026-05-29.md
task-3.reviewVerdict: APPROVED
task-3.mainVerificationRef: null
```

Worker evidence file read: `docs/plans/v22-task-3-worker-evidence-2026-05-29.md`

## Main verification checks

The prior needs-revision finding is fixed. `projectHandoffMainVerificationCell` now maps explicit main verification events to handoff status:

- `main.verification-passed` -> `passed`
- `main.verification-failed` -> `failed`
- ledger-only `mainVerificationRef` -> `recorded`

The evidence path remains in `mainVerification.evidenceRef`. The test `projects the Subagent Handoff Board only from goal events, goal-status, goal next, and closeout` covers both event-backed `passed` and ledger-only `recorded` behavior.

Task-3 acceptance is met:

- The user can see the current handoff from `goal-next-action.v1` through the board-level `next` fields and each task's `currentHandoff` fields.
- Each task exposes worker started, evidence recorded, reviewer verdict, and main verification handoff state.
- The projection uses only `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, and `goal-closeout-report.v1` for status. It does not infer status from branch names, file names, commit messages, prompt text, or copy-only command text.

## Commands

### `pnpm check`

Result: exit code 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit code 0

```text
tests 695
suites 111
pass 695
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3674.835917
```

### `pnpm workbench:build`

Result: exit code 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:69687) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:69687) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:69687) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DiQWsXSk.css   13.18 kB │ gzip:   2.81 kB
src/symphony/workbench-static/assets/index-BRpcXqMt.js   723.15 kB │ gzip: 134.65 kB

✓ built in 146ms
```

### `git diff --check`

Result: exit code 0

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json`

Result: exit code 0

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v22-goal-prompt-handoff-workspace",
  "goalTitle": "v22 Prompt Handoff Workspace",
  "generatedAt": "2026-05-31T02:05:09.831Z",
  "baseline": {
    "tag": "v21",
    "commit": null,
    "evidenceRef": "docs/plans/v21-release-evidence-2026-05-29.md"
  },
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
      "status": "approved",
      "statusSource": "goal-event-log.v1:evt_a43026102ca2dae2",
      "branch": "v22-task-3-subagent-handoff-board",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v22-task-3-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v22-task-3-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
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

## Acceptance decision

PASSED

## Blockers

None.

## Boundary notes

- I did not register goal gate events, reviewer events, release gates, or `release.ready`.
- I did not declare the release ready.
- The controller still owns dry-run and confirm after this evidence.
- The checked implementation and worker/review evidence were committed before this main-verification evidence was written.
