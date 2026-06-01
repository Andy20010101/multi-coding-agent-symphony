# v23 task-2 main verification evidence

## Scope

- Goal id: `v23-goal-operation-run-console`
- Task id: `task-2`
- Gate: `main-verification`
- Verifier: `codex-v23-task-2-main-verifier`
- Runbook source: `docs/plans/workbench-v20-v28-goal-runbooks/v23_goal-operation-run-console_goal_runbook_latest.md`
- Task scope: Goal operation console UI. Users can locate where a goal command failed through command preview, stdout/stderr, exit code, plan hash, event id, and next action.

## Reviewer approval check

Reviewer approval exists before this main verification.

- Review evidence file checked: `docs/plans/v23-task-2-review-evidence-2026-05-29.md`
- Review evidence verdict: `APPROVED`
- Review evidence findings: no blocking findings.
- Goal status checked with `pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json`.
- Goal status for `task-2`: `approved`
- Goal status source: `goal-event-log.v1:evt_9f0062d5a20fa20f`
- Goal status review evidence ref: `docs/plans/v23-task-2-review-evidence-2026-05-29.md`
- Goal status review verdict: `APPROVED`
- Event journal check: `.symphony/goals/events/v23-goal-operation-run-console.ndjson` contains `evt_9f0062d5a20fa20f` with `eventType: "reviewer.approved"`, `taskId: "task-2"`, actor `codex-v23-task-2-reviewer`, and the same review evidence ref.

Worker evidence was also checked at `docs/plans/v23-task-2-worker-evidence-2026-05-29.md`.

## Checked commit and worktree state

- Repository root: `/Users/andy/Documents/project/multi-coding-agent-symphony`
- Checked HEAD: `33d52949aeaba51b7b53ec07a39498fa141441df`
- Branch state before writing this evidence: `main...origin/main [ahead 26]`
- Worktree before writing this evidence was dirty with existing task-1/task-2 implementation, review, evidence, generated Workbench assets, and managed goal files. Those changes were treated as existing worker/reviewer state and were not reverted.
- `git status --short --branch` after the required checks and before this evidence file:

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
?? docs/plans/v23-task-2-review-evidence-2026-05-29.md
?? docs/plans/v23-task-2-worker-evidence-2026-05-29.md
?? fixtures/contracts/goal-runbook.v23-goal-operation-run-console.v1.json
?? src/symphony/goal-operation-run-registry.js
?? src/symphony/workbench-static/assets/index-Chgh8Clk.css
?? src/symphony/workbench-static/assets/index-gBrHEm5B.js
?? tests/v23-goal-operation-run-registry.test.js
```

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
tests 702
suites 112
pass 702
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4254.724083
```

### `pnpm workbench:build`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:28113) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:28113) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:28113) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-Chgh8Clk.css   14.28 kB │ gzip:   2.91 kB
src/symphony/workbench-static/assets/index-gBrHEm5B.js   746.63 kB │ gzip: 138.94 kB

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
  "generatedAt": "2026-05-31T04:13:52.774Z",
  "baseline": {
    "tag": "v22",
    "commit": null,
    "evidenceRef": "docs/plans/v22-release-evidence-2026-05-29.md"
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
      "status": "approved",
      "statusSource": "goal-event-log.v1:evt_9f0062d5a20fa20f",
      "branch": "v23-task-2-goal-operation-console-ui",
      "commit": null,
      "workerEvidenceRef": "docs/plans/v23-task-2-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v23-task-2-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
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

## Relevant files checked

- `frontend/workbench/src/App.jsx`: active goal placement and `GoalOperationConsolePanel` render path.
- `frontend/workbench/src/api/client.js`: active goal operations fetch route.
- `frontend/workbench/src/api/contracts.js`: `goal-operation-runs.v1` projection and operation console fields.
- `frontend/workbench/src/styles/workbench.css`: console styling.
- `src/symphony/console.js`: Workbench operations API route and preview/confirm operation recording surface.
- `src/symphony/goal-operation-run-registry.js`: operation registry contract backing the UI projection.
- `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, `tests/v21-goal-plan-preview-api.test.js`, `tests/v23-goal-operation-run-registry.test.js`: regression coverage for operation route, UI projection, preview/confirm behavior, and registry behavior.
- `docs/symphony-product-contracts.md`, `docs/workbench-operator-guide.md`: v23 operation registry and Workbench route notes.

## Boundary notes

- This verification did not implement feature changes.
- This verification is task-2 only and does not perform worker, reviewer, release-manager, merge, tag, or release readiness duties.
- The checked task-2 surface remains on the latest goal/runbook/next-action flow and does not promote the old v8 command surface as the Workbench primary action list.
- The operation console is a controlled Workbench projection over goal operation contracts and goal event preview/confirm output. It is not a generic shell runner.
- The browser/UI does not infer reviewer approval, main verification, release gates, or release readiness from filenames, branches, commit messages, command text, or frontend heuristics.

## Gate registration

Dry-run command:

```text
pnpm --silent symphony goal gate --goal v23-goal-operation-run-console --gate main-verification --task task-2 --status passed --verifier codex-v23-task-2-main-verifier --evidence-ref docs/plans/v23-task-2-main-verification-evidence-2026-05-29.md --dry-run --json
```

Dry-run result: exit code `0`; `planHash` was `sha256:5136636d371f801e3463165b76354e38002ffec293c77c1e7ccdf11be7eaf668`; `wouldAppend.writesInDryRun` was `false`; proposed event type was `main.verification-passed`.

Confirm command:

```text
pnpm --silent symphony goal gate --goal v23-goal-operation-run-console --gate main-verification --task task-2 --status passed --verifier codex-v23-task-2-main-verifier --evidence-ref docs/plans/v23-task-2-main-verification-evidence-2026-05-29.md --confirm --plan-hash sha256:5136636d371f801e3463165b76354e38002ffec293c77c1e7ccdf11be7eaf668 --json
```

Confirm result: exit code `0`; `status` was `appended`; `written` was `true`; appended event id was `evt_ca49ab63d87794b1`; appended event type was `main.verification-passed`; sequence was `6`.

Post-registration `goal-status` check:

```text
task-2.status: main-verified
task-2.statusSource: goal-event-log.v1:evt_ca49ab63d87794b1
task-2.mainVerificationRef: docs/plans/v23-task-2-main-verification-evidence-2026-05-29.md
summary.releaseReady: false
nextActions[0].label: Start task-3
```

## Blockers

No blockers found for task-2 main verification.
