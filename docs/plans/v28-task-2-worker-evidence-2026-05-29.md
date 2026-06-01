# v28 task-2 worker evidence

Goal id: `v28-workbench-v1-release`
Task id: `task-2`
Recorded: `2026-06-01 Asia/Shanghai`
Worker role: implementation only

## Branch / fallback checkout

Ideal branch from runbook: `v28-task-2-unified-goal-task-run-evidence-routes`.

Actual checkout:

```text
## v27-task-5-review-revision-tests-docs
```

The checkout was already dirty before task-2 work started and included existing v23-v28 docs, Workbench, backend, test, fixture, and static-asset changes. I used the current checkout fallback, did not switch branches, did not reset files, and did not revert existing changes.

## User-visible value

用户在各模块之间不会丢上下文。

## Implementation summary

- Added a Workbench `routeContext` projection from existing contracts. It carries `goalId`, `taskId`, active role/phase, latest `operationId`, latest `runId`, and recent evidence refs from active goal, events, ledger, latest run, and operation contracts.
- Added a visible route context block below the Workbench navigation so Active Goal, Prompt Handoff, Operations, Implementation, Adoption, Review, Verification, and Closeout share the same identifiers.
- Updated Workbench navigation links to preserve route context in query params while staying under `/workbench/` and `/workbench/prompts/`.
- Updated Prompt Handoff to initialize its selected goal, task, and role from route context query params, and to refresh Workbench contracts after a controlled worker event confirm.
- Added tests for the v28 route context projection, query-preserving navigation, Prompt Handoff route initialization, and the updated static route-safety assertion.

## Files changed for task-2

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/workbench-route-smoke.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-B-SzyFhZ.css`
- `src/symphony/workbench-static/assets/index-CDondlJL.js`

The generated Workbench static assets came from `pnpm workbench:build`. Pre-existing deleted static asset entries were already present in the dirty checkout before task-2 work.

## Command results

### `pnpm check`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Initial run failed once after the code change because `tests/workbench-route-smoke.test.js` still asserted the old `/workbench/#${item.targetId}` source string. I updated that assertion to the new context-preserving route rule and reran the full command.

Final exit code: `0`

```text
ℹ tests 732
ℹ suites 115
ℹ pass 732
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6254.196791
```

### `pnpm workbench:build`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-B-SzyFhZ.css   19.48 kB │ gzip:   3.54 kB
src/symphony/workbench-static/assets/index-CDondlJL.js   836.17 kB │ gzip: 155.33 kB

✓ built in 52ms
```

### `git diff --check`

Exit code: `0`

```text
No output.
```

### `pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json`

Exit code: `0`

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v28-workbench-v1-release",
  "goalTitle": "v28 Workbench v1 Release",
  "generatedAt": "2026-05-31T21:56:30.235Z",
  "baseline": {
    "tag": "v27",
    "commit": null,
    "evidenceRef": "docs/plans/v27-release-evidence-2026-05-29.md"
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
      "title": "Workbench app navigation and state header",
      "status": "main-verified",
      "statusSource": "goal-event-log.v1:evt_29fef4e4117fb95c",
      "branch": "v28-task-1-workbench-app-navigation-and-state-header",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v28-task-1-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v28-task-1-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": "docs/plans/v28-task-1-main-verification-evidence-2026-05-29.md",
      "blockers": [],
      "nextCopyOnlyCommand": "pnpm check"
    },
    {
      "taskId": "task-2",
      "title": "Unified goal/task/run/evidence routes",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v28-task-2-unified-goal-task-run-evidence-routes",
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
      "title": "Golden path E2E",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v28-task-3-golden-path-e2e",
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
      "title": "Release closeout workspace",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v28-task-4-release-closeout-workspace",
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
      "title": "README/operator guide/release evidence",
      "status": "planned",
      "statusSource": "goal-runbook.v1",
      "branch": "v28-task-5-readme-operator-guide-release-evidence",
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

- Did not register goal events.
- Did not approve task-2.
- Did not register reviewer, main verification, release gate, main verified, or release-ready events.
- Did not add a generic shell runner.
- Did not make v8 `scan/do/review/verify/status/continue/artifacts` the Workbench top-level action list.
- Did not infer task approval or release readiness from route params, file names, branch names, commit messages, or frontend state.
- Evidence refs are surfaced as identifiers only; Workbench does not read evidence bodies or treat evidence ref presence as approval.

## Reviewer handoff checklist

- Review `routeContext` projection in `frontend/workbench/src/api/contracts.js`.
- Verify Workbench nav links preserve `goal`, `task`, `role`, `operation`, `run`, and `evidence` query params without leaving `/workbench/`.
- Verify Prompt Handoff initializes from route params and still uses controlled goal prompt/update routes only.
- Check that worker role controls cannot register reviewer approval, main verification, or release readiness.
- Re-run `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, and `pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json`.
