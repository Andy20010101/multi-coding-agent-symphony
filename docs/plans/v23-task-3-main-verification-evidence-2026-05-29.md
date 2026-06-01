# v23 task-3 main verification evidence

## Scope

- Goal id: `v23-goal-operation-run-console`
- Task id: `task-3`
- Gate: `main-verification`
- Verifier: `codex-v23-task-3-main-verifier`
- Runbook source: `docs/plans/workbench-v20-v28-goal-runbooks/v23_goal-operation-run-console_goal_runbook_latest.md`
- Task scope: Near-live log polling for the Goal Operation Console. Longer goal and closeout operations should not leave the user waiting without refreshed output. A full terminal emulator is not required.

## Reviewer approval check

Reviewer approval existed before this main verification.

- Worker evidence checked: `docs/plans/v23-task-3-worker-evidence-2026-05-29.md`
- Review evidence checked: `docs/plans/v23-task-3-review-evidence-2026-05-29.md`
- Review evidence verdict: `APPROVED`
- Review evidence findings: no blocking findings.
- Review event registration from review evidence: `eventType: reviewer.approved`, `eventId: evt_1360ff937629746b`, `taskId: task-3`, actor `codex-v23-task-3-reviewer`, evidence ref `docs/plans/v23-task-3-review-evidence-2026-05-29.md`.
- Event journal check: `.symphony/goals/events/v23-goal-operation-run-console.ndjson` line 8 contains `evt_1360ff937629746b` with `eventType: "reviewer.approved"`, `taskId: "task-3"`, actor `codex-v23-task-3-reviewer`, and the same review evidence ref.

Pre-verification `goal-status` command:

```text
pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
```

Pre-verification result: exit code `0`.

Relevant fields:

```text
task-3.status: approved
task-3.statusSource: goal-event-log.v1:evt_1360ff937629746b
task-3.workerEvidenceRef: docs/plans/v23-task-3-worker-evidence-2026-05-29.md
task-3.reviewEvidenceRef: docs/plans/v23-task-3-review-evidence-2026-05-29.md
task-3.reviewVerdict: APPROVED
task-3.mainVerificationRef: null
summary.completedTasks: 3
summary.releaseReady: false
nextActions[0].label: Start task-4
```

## Checked commit and worktree state

- Repository root: `/Users/andy/Documents/project/multi-coding-agent-symphony`
- Current branch: `main`
- Checked HEAD: `33d52949aeaba51b7b53ec07a39498fa141441df`
- Branch state before writing this evidence: `main...origin/main [ahead 26]`
- The worktree was dirty before this verifier started. Existing task-1, task-2, and task-3 implementation, docs, generated Workbench assets, managed goal files, and prior evidence files were treated as other agents' work and were not reverted.
- This verifier did not run `git pull`, `git merge`, `git rebase`, branch switching, or implementation edits. The only file added by this verifier is this evidence file.

`git status -sb` after the required checks and before writing this evidence file:

```text
## main...origin/main [ahead 26]
 M docs/symphony-product-contracts.md
 M docs/workbench-operator-guide.md
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/client.js
 M frontend/workbench/src/api/contracts.js
 M frontend/workbench/src/styles/workbench.css
 M src/symphony/console.js
 D src/symphony/workbench-static/assets/index-BRTPIdb3.js
 D src/symphony/workbench-static/assets/index-D6WeclLN.css
 M src/symphony/workbench-static/index.html
 M tests/v21-goal-plan-preview-api.test.js
 M tests/workbench-api-client.test.js
 M tests/workbench-shell.test.js
?? docs/plans/v23-task-1-main-verification-evidence-2026-05-29.md
?? docs/plans/v23-task-1-review-evidence-2026-05-29.md
?? docs/plans/v23-task-1-worker-evidence-2026-05-29.md
?? docs/plans/v23-task-2-main-verification-evidence-2026-05-29.md
?? docs/plans/v23-task-2-review-evidence-2026-05-29.md
?? docs/plans/v23-task-2-worker-evidence-2026-05-29.md
?? docs/plans/v23-task-3-review-evidence-2026-05-29.md
?? docs/plans/v23-task-3-worker-evidence-2026-05-29.md
?? fixtures/contracts/goal-runbook.v23-goal-operation-run-console.v1.json
?? src/symphony/goal-operation-run-registry.js
?? src/symphony/workbench-static/assets/index-Chgh8Clk.css
?? src/symphony/workbench-static/assets/index-WMd6N9-y.js
?? tests/v23-goal-operation-run-registry.test.js
```

## Relevant files checked

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `src/symphony/console.js`
- `src/symphony/goal-operation-run-registry.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/v23-goal-operation-run-registry.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-Chgh8Clk.css`
- `src/symphony/workbench-static/assets/index-WMd6N9-y.js`

## Verification notes

- `frontend/workbench/src/App.jsx` defines `GOAL_OPERATION_POLL_INTERVAL_MS = 2500`, starts `window.setInterval(pollGoalOperationConsole, GOAL_OPERATION_POLL_INTERVAL_MS)` only when `goalOperationPollingEnabled(...)` is true, calls `fetchWorkbenchContracts()` for refresh, avoids overlapping poll requests, and clears the timer on cleanup.
- `GoalOperationConsolePanel` displays `polling.enabled`, `polling.intervalMs`, `polling.route`, and `polling.reason` alongside command output, status, plan hash, event ids, and next action.
- `frontend/workbench/src/api/contracts.js` projects polling metadata from the active scoped `goal-operation-runs.v1` route. The polling source is `GET goal-operation-runs.v1`; the interval is `2500` only when the route is ready.
- Tests cover the projection and shell boundary. `tests/workbench-api-client.test.js` asserts polling metadata for the active operation console. `tests/workbench-shell.test.js` asserts the interval, `fetchWorkbenchContracts()` refresh path, polling fields, `GET goal-operation-runs.v1`, and absence of `child_process`, `exec(`, `spawn(`, terminal emulator, generic shell runner, `WebSocket`, or `EventSource`.
- Documentation records that the Goal Operation Console polls the active operations route to refresh command preview, stdout/stderr-style output, status, plan hash, event ids, and next action.

## Boundary notes

- Polling is read-only from the browser side and refreshes controlled Workbench contracts.
- The implementation does not add a terminal emulator, arbitrary command input, shell runner, WebSocket/EventSource stream, model call, merge, tag, or auto-approval path.
- Workbench remains centered on latest goal/runbook/next-action workflows. It does not promote v8 `scan/do/review/verify/status/continue/artifacts` as top-level action baseline.
- Operation registry entries and polling state are not treated as reviewer approval, main verification evidence, release gate evidence, or release readiness.
- This evidence verifies task-3 only. It does not claim task-4/task-5 completion or release readiness.

## Required command results

### `pnpm check`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit code `0`.

The test runner printed the full per-test listing. Final summary:

```text
tests 703
suites 112
pass 703
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4563.051584
```

### `pnpm workbench:build`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:50010) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:50010) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:50010) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-Chgh8Clk.css   14.28 kB │ gzip:   2.91 kB
src/symphony/workbench-static/assets/index-WMd6N9-y.js   749.15 kB │ gzip: 139.54 kB

✓ built in 148ms
```

### `git diff --check`

Result: exit code `0`; no output.

### `pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json`

Result: exit code `0`.

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v23-goal-operation-run-console",
  "goalTitle": "v23 Goal Operation Run Console",
  "generatedAt": "2026-05-31T04:29:13.234Z",
  "baseline": {
    "tag": "v22",
    "commit": null,
    "evidenceRef": "docs/plans/v22-release-evidence-2026-05-29.md"
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
      "title": "Goal operation run registry",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_bdee4a0dbf5d6bdf",
      "branch": "v23-task-1-goal-operation-run-registry",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v23-task-1-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v23-task-1-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v23-task-1-main-verification-evidence-2026-05-29.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-2",
      "title": "Goal operation console UI",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_ca49ab63d87794b1",
      "branch": "v23-task-2-goal-operation-console-ui",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v23-task-2-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v23-task-2-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v23-task-2-main-verification-evidence-2026-05-29.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-3",
      "title": "Near-live log polling",
      "status": "approved",
      "statusSource": "goal-event-log.v1:evt_1360ff937629746b",
      "branch": "v23-task-3-near-live-log-polling",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v23-task-3-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v23-task-3-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-4",
      "title": "Failure recovery shortcuts",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v23-task-4-failure-recovery-shortcuts",
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
      "title": "Goal operation console tests/docs",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v23-task-5-goal-operation-console-tests-docs",
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

## Verification result

Main verification status: passed.

No blockers found for task-3.
