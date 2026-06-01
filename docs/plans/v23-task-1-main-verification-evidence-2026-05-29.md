# v23 task-1 main verification evidence

## Goal and task

- Goal id: `v23-goal-operation-run-console`
- Task id: `task-1`
- Task title: Goal operation run registry
- Branch from runbook: `v23-task-1-goal-operation-run-registry`
- Scope checked: Workbench-started goal operations record operation id, goal id, task id, role, command kind, status, and timestamps so a user can trace one goal operation instead of only seeing the final status.

## Reviewer approval precondition

Checked before main verification.

- Worker evidence exists at `docs/plans/v23-task-1-worker-evidence-2026-05-29.md`.
- Review evidence exists at `docs/plans/v23-task-1-review-evidence-2026-05-29.md`.
- Review evidence verdict: `APPROVED`.
- Review evidence handoff says `reviewer.approved` was registered with event id `evt_3d2fb5c2dc557303`.
- Pre-verification `goal-status` returned `task-1.status: approved`, `task-1.statusSource: goal-event-log.v1:evt_3d2fb5c2dc557303`, `task-1.reviewEvidenceRef: docs/plans/v23-task-1-review-evidence-2026-05-29.md`, and `task-1.reviewVerdict: APPROVED`.

## Commit and worktree state checked

- Current branch: `main`
- Current HEAD: `33d52949aeaba51b7b53ec07a39498fa141441df`
- `git status -sb`: `## main...origin/main [ahead 26]`
- Main verification did not run `git pull`, `git merge`, `git rebase`, or branch switching. The task-1 candidate changes were already present in the dirty `main` worktree. To avoid overwriting edits made by other agents, this verifier treated the current worktree as the verification candidate and changed only this evidence file.

Candidate worktree entries checked before writing this evidence file:

```text
 M docs/symphony-product-contracts.md
 M docs/workbench-operator-guide.md
 M frontend/workbench/src/App.jsx
 M src/symphony/console.js
 D src/symphony/workbench-static/assets/index-BRTPIdb3.js
 M src/symphony/workbench-static/index.html
 M tests/v21-goal-plan-preview-api.test.js
 M tests/workbench-shell.test.js
?? docs/plans/v23-task-1-review-evidence-2026-05-29.md
?? docs/plans/v23-task-1-worker-evidence-2026-05-29.md
?? fixtures/contracts/goal-runbook.v23-goal-operation-run-console.v1.json
?? src/symphony/goal-operation-run-registry.js
?? src/symphony/workbench-static/assets/index-DrU9nuer.js
?? tests/v23-goal-operation-run-registry.test.js
```

## Relevant files checked

- `src/symphony/goal-operation-run-registry.js`
- `src/symphony/console.js`
- `frontend/workbench/src/App.jsx`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/v23-goal-operation-run-registry.test.js`
- `tests/workbench-shell.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `fixtures/contracts/goal-runbook.v23-goal-operation-run-console.v1.json`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DrU9nuer.js`

## Verification result

Main verification status: passed.

No blockers found for task-1. This is limited to task-1 main verification and does not claim release readiness.

## Command results

### `pnpm check`

Exit code: 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0.

```text
tests 701
suites 112
pass 701
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3712.657917
```

### `pnpm workbench:build`

Exit code: 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:1933) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:1933) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:1933) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-D6WeclLN.css   13.24 kB │ gzip:   2.82 kB
src/symphony/workbench-static/assets/index-DrU9nuer.js   732.69 kB │ gzip: 136.59 kB

✓ built in 148ms
```

### `git diff --check`

Exit code: 0. No output.

### `pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json`

Exit code: 0.

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v23-goal-operation-run-console",
  "goalTitle": "v23 Goal Operation Run Console",
  "generatedAt": "2026-05-31T03:57:50.787Z",
  "baseline": {
    "tag": "v22",
    "commit": null,
    "evidenceRef": "docs/plans/v22-release-evidence-2026-05-29.md"
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
      "title": "Goal operation run registry",
      "status": "approved",
      "statusSource": "goal-event-log.v1:evt_3d2fb5c2dc557303",
      "branch": "v23-task-1-goal-operation-run-registry",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v23-task-1-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v23-task-1-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": null,
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-2",
      "title": "Goal operation console UI",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v23-task-2-goal-operation-console-ui",
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
      "title": "Near-live log polling",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v23-task-3-near-live-log-polling",
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

## Boundary notes

- The verification was limited to v23 task-1.
- No feature code was edited by this verifier.
- The Workbench path remains tied to latest goal update/review/gate preview and confirm flow. I did not find the v8 command list promoted as the primary Workbench action model.
- The operation registry records Workbench goal operation tracing. It is not approval, main verification, release gate, or release-ready evidence.
- Task-1 does not implement task-2 stdout/stderr console behavior or task-3 near-live polling.
