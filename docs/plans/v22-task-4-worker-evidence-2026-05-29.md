# v22 task-4 worker evidence

## Run details

- Goal id: `v22-goal-prompt-handoff-workspace`
- Task id: `task-4`
- Branch: `v22-task-4-prompt-to-event-shortcuts`
- Phase: revision after `reviewer.needs-revision`
- Reviewer evidence: `docs/plans/v22-task-4-review-evidence-2026-05-29.md`
- User-visible value: 用户从复制 prompt 到登记 evidence 的路径连起来。

## Revision summary

The reviewer found that Prompt Workspace shortcut forms could keep stale `taskId` values after the task selector changed. The shortcut list reused items by fixed `formId`, while `GoalEventPlanPreview` initialized local values from props once.

Revision changes:

- Keyed each Prompt Workspace shortcut item and `GoalEventPlanPreview` by `goalId::taskId::eventType`.
- Added `goalEventFormIdentity()` and a reset effect inside `GoalEventPlanPreview` so preview values, preview result, and confirm state return to idle when the selected goal, task, or event changes.
- Added a regression test that locks the shortcut key to selected goal/task/event and verifies preview and confirm request builders use `values.taskId`.
- Rebuilt static Workbench assets after the frontend change.

## Files changed

- `frontend/workbench/src/App.jsx`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BRTPIdb3.js`
- `src/symphony/workbench-static/assets/index-D6WeclLN.css`
- `src/symphony/workbench-static/assets/index-BRpcXqMt.js` removed by `pnpm workbench:build`
- `src/symphony/workbench-static/assets/index-DiQWsXSk.css` removed by `pnpm workbench:build`
- `docs/plans/v22-task-4-worker-evidence-2026-05-29.md`

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
ℹ tests 697
ℹ suites 111
ℹ pass 697
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3676.309334
```

Targeted regression run before the full suite:

```text
node --test tests/workbench-shell.test.js
ℹ tests 14
ℹ suites 2
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 102.584209
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:4745) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:4745) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:4745) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-D6WeclLN.css   13.24 kB │ gzip:   2.82 kB
src/symphony/workbench-static/assets/index-BRTPIdb3.js   732.18 kB │ gzip: 136.50 kB

✓ built in 146ms
```

### `git diff --check`

Exit code: 0

```text
```

### `pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json`

Exit code: 0

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v22-goal-prompt-handoff-workspace",
  "goalTitle": "v22 Prompt Handoff Workspace",
  "generatedAt": "2026-05-31T02:27:10.875Z",
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
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_4795c48a35d864ab",
      "branch": "v22-task-3-subagent-handoff-board",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v22-task-3-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v22-task-3-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v22-task-3-main-verification-evidence-2026-05-29.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-4",
      "title": "Prompt-to-event shortcuts",
      "status": "needs-revision",
      "statusSource": "goal-event-log.v1:evt_b95a12c1b33c9aa9",
      "branch": "v22-task-4-prompt-to-event-shortcuts",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v22-task-4-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v22-task-4-review-evidence-2026-05-29.md",
      "reviewVerdict": "NEEDS_REVISION",
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

## Browser verification

Local route checked:

```text
http://127.0.0.1:9876/workbench/prompts
```

After selecting `task-4` from the task selector:

```json
{
  "confirmVisible": false,
  "previewRoutes": [
    "/api/goals/v22-goal-prompt-handoff-workspace/event-plan-preview?command=update&task=task-4&event=worker.started",
    "/api/goals/v22-goal-prompt-handoff-workspace/event-plan-preview?command=update&task=task-4&event=worker.evidence-recorded"
  ],
  "promptRoute": "/api/goals/v22-goal-prompt-handoff-workspace/prompt?task=task-4&role=worker",
  "selectedTask": "task-4",
  "taskInputs": [
    "task-4",
    "task-4"
  ]
}
```

Dry-run preview for `worker.started` after selecting `task-4`:

```json
{
  "confirmPath": "/api/goals/v22-goal-prompt-handoff-workspace/event-plan-confirm",
  "confirmVisible": true,
  "result": {
    "actorId": "codex-v22-task-4-worker",
    "actorRole": "worker",
    "command": "symphony goal update",
    "confirmAvailable": "false",
    "eventType": "worker.started",
    "planHash": "sha256:74cf5d8cf853f15e6e39c655032623329b49f23a7d2945e08a2abf8624bd23f8",
    "taskId": "task-4",
    "writesInDryRun": "false"
  }
}
```

No `Confirm event append` click was performed during browser verification.

## Boundary notes

- Event shortcut uses only the controlled `goal update` dry-run preview and matching plan-hash confirm route.
- No auto-registration happens before the operator clicks dry-run preview and then confirm.
- No generic shell runner, model invocation, browser execution control, file opener, download, merge, tag, reviewer approval, main verification, release gate, or `release.ready` action was added.
- Worker shortcuts remain limited to `worker.started` and `worker.evidence-recorded`.
- The UI does not infer task approval, release readiness, or worker evidence from file names, branch names, commit messages, prompt text, or frontend heuristics.
- The v8 `scan/do/review/verify/status/continue/artifacts` top-level action list was not added.
- I did not register goal events; controller owns dry-run and confirm event registration after this handoff.

## Reviewer handoff notes

- Recheck `/workbench/prompts` by switching the task selector from `task-1` to `task-4`.
- Both shortcut preview forms should show read-only `task id` inputs as `task-4`.
- The visible dry-run preview routes should include `task=task-4` for both `worker.started` and `worker.evidence-recorded`.
- A dry-run preview for `worker.started` should return `eventSummary.taskId` as `task-4`.
- Confirm remains available only after dry-run preview and still uses the v21 plan-hash confirm route.
