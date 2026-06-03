# v36 task-5 main verification evidence

Date: 2026-06-03
Goal: v36-artifact-evidence-index-workspace
Task: task-5 - Export diagnostics/evidence bundle draft
Verifier: codex-v36-main-verifier

## Verdict

PASS. Task-5 is ready for the main-verification gate.

## Merge and commits

- Main worktree: `/private/tmp/v24-task-3-mainverify-main`
- Source branch: `v36-task-5-export-diagnostics-evidence-bundle-draft`
- Fast-forward merge: `93c2396` -> `140c67c`
- Task implementation commit: `140c67c Add v36 evidence diagnostics bundle draft`
- Worker evidence event: `evt_699a87f8c99a0433`
- Review evidence event: `evt_977e177e308d366f`

## Files verified

- `src/symphony/evidence-bundle.js`
- `tests/v36-task-5-evidence-bundle.test.js`
- `fixtures/contracts/evidence-bundle.v1.json`
- `src/symphony/console.js`
- `scripts/symphony.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/plans/v36-task-5-worker-evidence-2026-06-03.md`
- `docs/plans/v36-task-5-review-evidence-2026-06-03.md`

## Validation commands

### pnpm check

Command:

```bash
pnpm check
```

Result: PASS.

### Targeted task-5 tests

Command:

```bash
node --test tests/v36-task-5-evidence-bundle.test.js
```

Result: PASS.

Summary:

```text
tests 11
suites 4
pass 11
fail 0
duration_ms 56.039167
```

### Full test suite

Command:

```bash
pnpm test
```

Result: PASS.

Summary:

```text
tests 987
suites 152
pass 987
fail 0
duration_ms 4938.7935
```

### Workbench build

Command:

```bash
pnpm workbench:build
```

Result: PASS.

Summary:

```text
vite v8.0.14 building client environment for production
17 modules transformed
src/symphony/workbench-static/assets/index-CpBepO49.js
built in 100ms
```

### Diff whitespace

Command:

```bash
git diff --check
```

Result: PASS, no output.

### Goal status

The temporary main worktree does not hold the active managed goal journal, so `goal-status` was run in the controller worktree that owns the v36 managed state at the same task commit.

Command:

```bash
pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json
```

Result: PASS.

Summary:

```json
{
  "completed": 5,
  "total": 5,
  "task5": "approved",
  "reviewVerdict": "APPROVED",
  "releaseReady": false
}
```

### Evidence bundle CLI

Command:

```bash
pnpm --silent symphony evidence bundle --goal v36-artifact-evidence-index-workspace --task task-4 --json
```

Result: PASS.

Summary:

```json
{
  "contractName": "evidence-bundle.v1",
  "contractVersion": 1,
  "readOnly": true,
  "context": {
    "goalId": "v36-artifact-evidence-index-workspace",
    "taskId": "task-4",
    "totalEvents": 14,
    "summarizedEvents": 14,
    "matchedEvents": 3,
    "gateEvents": 2,
    "dataSource": "goal-event-log.v1"
  },
  "gate": {
    "eventId": "evt_087dc15cadfaa307",
    "eventType": "main.verification-passed",
    "phase": "main-verification",
    "taskId": "task-4",
    "gate_name": "main-verification",
    "status": "passed",
    "review_verdict": null,
    "evidenceCount": 1,
    "statement": "Main verification passed for task-4.",
    "occurredAt": "2026-06-03T05:34:52.932Z"
  },
  "boundaries": {
    "readOnly": true,
    "shellExecutionAvailable": false,
    "modelInvocationAvailable": false,
    "arbitraryPathReadAvailable": false,
    "arbitraryCommandExecutionAvailable": false,
    "gitWriteAvailable": false,
    "mergeAvailable": false,
    "pushAvailable": false,
    "tagAvailable": false,
    "publishAvailable": false
  }
}
```

## Boundary verification

- `/api/artifacts`, `/api/evidence/timeline`, and `/api/release/bundle` remain present.
- New `/api/bundle` route is GET-only and accepts only `goal` and `task`.
- Unsafe `goal` or `task` route segments are rejected.
- The evidence bundle reads only the managed goal event journal through existing goal event APIs.
- No shell execution, model invocation, arbitrary path read, evidence body read, local file open, git write, merge, push, tag, publish, or self-approval path was added.
- Workbench integration is read-only route registration, not an execution control.

## Notes

- The task-5 bundle is a draft centered on `goal-event-log.v1` signal events. The reviewer explicitly accepted this as sufficient for the v36 draft scope; broader diagnostics, operations, closeout, and backup data can be added in v39.
- The `gateEvents` array also includes review-verdict signal events. This naming was reviewed as a low-severity note, not a blocker.
