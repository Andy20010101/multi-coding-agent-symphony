# v23 task-1 review evidence

## Findings

No blocking findings.

The implementation satisfies the task-1 registry scope. Workbench-controlled goal event preview now records a `dry-run-planned` operation, confirm updates the same deterministic operation id to `confirmed`, and both responses expose the operation fields a user needs to correlate one operation instead of only seeing the final goal status.

## Verdict

APPROVED

This approval is limited to v23 task-1 independent review. It is not main verification, release gate evidence, or release readiness.

## Review scope

- Goal id: `v23-goal-operation-run-console`
- Task id: `task-1`
- Task title: Goal operation run registry
- Worker evidence read: `docs/plans/v23-task-1-worker-evidence-2026-05-29.md`
- Source runbook read: `docs/plans/workbench-v20-v28-goal-runbooks/v23_goal-operation-run-console_goal_runbook_latest.md`

## Diff and evidence refs

- `src/symphony/goal-operation-run-registry.js:39` records operation runs under the managed goal operation registry, keyed by normalized goal/task/role/command kind/plan hash.
- `src/symphony/goal-operation-run-registry.js:90` builds deterministic operation ids, so preview and confirm for the same plan can meet on the same id.
- `src/symphony/goal-operation-run-registry.js:153` preserves a confirmed run if a later repeated preview arrives, while keeping started/updated/completed timestamps.
- `src/symphony/console.js:1259` adds a scoped operations read response for `goal-operation-runs.v1`.
- `src/symphony/console.js:1385` records the Workbench preview operation as `dry-run-planned` after a valid controlled plan is built.
- `src/symphony/console.js:1480` records the confirm result as `confirmed` after the matching goal event append path succeeds.
- `src/symphony/console.js:2298` parses only `/api/goals/latest/operations` and `/api/goals/<goal-id>/operations`, rejecting query-bearing operation routes and unsafe route segments.
- `src/symphony/console.js:2884` includes `operationRun` in the confirm response together with refreshed progress, events, and next action contracts.
- `src/symphony/console.js:3146` includes `operationRun` in the preview response next to the existing plan/event summary fields.
- `frontend/workbench/src/App.jsx:2592` displays preview operation id, status, plan hash, command, actor, and started timestamp.
- `frontend/workbench/src/App.jsx:2620` displays confirm operation id, status, event id/hash, completed timestamp, and refreshed goal contracts.
- `tests/v21-goal-plan-preview-api.test.js:24` covers preview operation tracking and the operations read route.
- `tests/v21-goal-plan-preview-api.test.js:388` covers confirm updating the same operation id and carrying the appended event id.
- `tests/v23-goal-operation-run-registry.test.js:18` covers registry persistence, deterministic id reuse, status update, event ids, and timestamps.
- `docs/symphony-product-contracts.md` and `docs/workbench-operator-guide.md` document `goal-operation-runs.v1`, the operations route, and the boundary that the registry is not approval/main-verification/release-ready evidence.
- `fixtures/contracts/goal-runbook.v23-goal-operation-run-console.v1.json` matches the v23 task list and task-1 acceptance fields.
- Workbench static assets were rebuilt by `pnpm workbench:build`: `src/symphony/workbench-static/index.html` now points at `assets/index-DrU9nuer.js`; the old `assets/index-BRTPIdb3.js` is removed.

## Boundary checks

- The Workbench path remains on the latest goal workflow surface: goal status, next action, prompt, closeout, and controlled goal update/review/gate event registration. I did not find v8 `scan/do/review/verify/status/continue/artifacts` promoted as top-level Workbench actions.
- The implementation does not add a generic shell runner, generic safety layer, permission system, artifact framework, auto-merge, auto-tag, or worker self-approval path.
- The frontend displays backend contract fields. I did not find task approval or release readiness inferred from filenames, branch names, commit messages, or frontend heuristics.
- Task-1 does not implement the later task-2/task-3 console/log surface. Operation history is available through the new backend operations contract and preview/confirm UI fields; stdout/stderr and near-live output remain outside this task's implemented surface.

## Commands checked

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
duration_ms 3711.592708
```

### `pnpm workbench:build`

Exit code: 0.

```text
vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-D6WeclLN.css   13.24 kB │ gzip:   2.82 kB
src/symphony/workbench-static/assets/index-DrU9nuer.js   732.69 kB │ gzip: 136.59 kB
✓ built in 146ms
```

The command also printed Node WASI experimental warnings.

### `git diff --check`

Exit code: 0. No output.

### `pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json`

Review check before registering this review event: exit code 0.

```text
contractName: goal-progress-ledger.v1
goalId: v23-goal-operation-run-console
goalTitle: v23 Goal Operation Run Console
summary.totalTasks: 5
summary.completedTasks: 0
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1.status: in-progress
task-1.statusSource: goal-event-log.v1:evt_5b1d67721f023bb8
task-1.workerEvidenceRef: docs/plans/v23-task-1-worker-evidence-2026-05-29.md
task-1.reviewEvidenceRef: null
task-1.reviewVerdict: null
nextActions[0].label: Start task-1
nextActions[0].command: pnpm check
safety.readOnly: true
safety.copyOnly: true
```

Post-registration check after confirming `reviewer.approved`: exit code 0.

```text
contractName: goal-progress-ledger.v1
goalId: v23-goal-operation-run-console
goalTitle: v23 Goal Operation Run Console
summary.totalTasks: 5
summary.completedTasks: 1
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1.status: approved
task-1.statusSource: goal-event-log.v1:evt_3d2fb5c2dc557303
task-1.workerEvidenceRef: docs/plans/v23-task-1-worker-evidence-2026-05-29.md
task-1.reviewEvidenceRef: docs/plans/v23-task-1-review-evidence-2026-05-29.md
task-1.reviewVerdict: APPROVED
nextActions[0].label: Start task-2
nextActions[0].command: pnpm check
safety.readOnly: true
safety.copyOnly: true
```

## Handoff

`reviewer.approved` was registered for `task-1` with this evidence file.

Dry-run:

```text
pnpm --silent symphony goal review --goal v23-goal-operation-run-console --task task-1 --reviewer codex-v23-task-1-reviewer --verdict approved --evidence-ref docs/plans/v23-task-1-review-evidence-2026-05-29.md --dry-run --json
```

Result: exit code 0, `planHash` `sha256:d5baa862d46ba4bc7cbfb5375ec35e0001c851d8c8f47b188f07ba76c7f8957d`, `wouldAppend.writesInDryRun: false`.

Confirm:

```text
pnpm --silent symphony goal review --goal v23-goal-operation-run-console --task task-1 --reviewer codex-v23-task-1-reviewer --verdict approved --evidence-ref docs/plans/v23-task-1-review-evidence-2026-05-29.md --confirm --plan-hash sha256:d5baa862d46ba4bc7cbfb5375ec35e0001c851d8c8f47b188f07ba76c7f8957d
```

Result: exit code 0, `status: appended`, `written: true`, `eventId: evt_3d2fb5c2dc557303`, `eventHash: sha256:31b2486c5866974f58bacfa54e04e013c39cdf645f9dc815b0098ea245c908d1`.

Main verification should run separately and should not treat this review as release readiness.
