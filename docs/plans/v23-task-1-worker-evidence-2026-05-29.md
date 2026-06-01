# v23 task-1 worker evidence

## Goal and task

- Goal id: `v23-goal-operation-run-console`
- Task id: `task-1`
- Branch: `v23-task-1-goal-operation-run-registry` from the runbook. Current checkout during this worker run was `main...origin/main [ahead 26]`; branch text is not used as completion evidence.
- User-visible value: 用户能追踪一次 goal 操作，不只看最终状态。

## Implementation summary

Workbench goal event preview now records a managed operation run with a stable `operationId`, `goalId`, `taskId`, `role`, `commandKind`, `dry-run-planned` status, `planHash`, source, and timestamps. A successful confirm with the same plan hash updates the same operation id to `confirmed` and records the appended event id.

The registry is stored under `.symphony/goals/operations/<goal-id>.json` through a new `goal-operation-runs.v1` contract. The Workbench preview and confirm responses also include `operationRun`, and the existing preview/confirm panel displays operation id, status, started timestamp, and completed timestamp.

## Files changed

- `src/symphony/goal-operation-run-registry.js`
- `src/symphony/console.js`
- `frontend/workbench/src/App.jsx`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DrU9nuer.js`
- `src/symphony/workbench-static/assets/index-BRTPIdb3.js` removed by the Workbench rebuild
- `tests/v23-goal-operation-run-registry.test.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`

The controller-created fixture `fixtures/contracts/goal-runbook.v23-goal-operation-run-console.v1.json` was present before this worker implementation and was left in place.

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
duration_ms 3703.351
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
✓ built in 145ms
```

The build emitted Node WASI experimental warnings before the Vite output.

### `git diff --check`

Exit code: 0. No whitespace errors were reported.

### `pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json`

Exit code: 0.

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
nextActions[0].label: Start task-1
nextActions[0].command: pnpm check
safety.readOnly: true
safety.copyOnly: true
```

## Worker evidence event registration

Dry-run command:

```text
pnpm --silent symphony goal update --goal v23-goal-operation-run-console --task task-1 --event worker.evidence-recorded --actor codex-v23-task-1-worker --evidence-ref docs/plans/v23-task-1-worker-evidence-2026-05-29.md --dry-run --json
```

Result: exit code 0, `planHash` `sha256:03c7e72678bce394b06f96aa3749c48d695ce194890a3b4ed1b2e873236c2f13`, `wouldAppend.writesInDryRun: false`.

Confirm command:

```text
pnpm --silent symphony goal update --goal v23-goal-operation-run-console --task task-1 --event worker.evidence-recorded --actor codex-v23-task-1-worker --evidence-ref docs/plans/v23-task-1-worker-evidence-2026-05-29.md --confirm --plan-hash sha256:03c7e72678bce394b06f96aa3749c48d695ce194890a3b4ed1b2e873236c2f13
```

Initial result: exit code 0, `status: appended`, `written: true`, `eventId: evt_5b1d67721f023bb8`, `eventHash: sha256:e995ccc74260b385b5587ffacc0b47b99179e50916925a6e3305b1ef4a4df38f`.

After the evidence file was updated with the final rerun results, the same dry-run returned the same `planHash`; the same confirm command exited 0 with `status: already-appended`, `written: false`, and the same `eventId` / `eventHash`.

## Browser check

Started `pnpm --silent symphony console --host 127.0.0.1 --port 8765`, opened `http://127.0.0.1:8765/workbench/` in the in-app Browser, and confirmed the page title was `v20 Workbench`, the URL loaded under `/workbench/`, and the DOM contained `Symphony Workbench` and active-goal content. The console server was stopped after the check.

## Boundary notes

- This task does not make v8 `scan/do/review/verify/status/continue/artifacts` the Workbench top-level action list.
- The registry is not a generic safety framework, permission system, goal framework, or shell runner.
- Preview still does not append to the goal event journal. It only writes the v23 operation registry so the Workbench can trace the run.
- Operation registry entries are not approval, main verification, release gate, or release-ready evidence.
- This worker did not self-approve, did not perform independent review, did not perform main verification, and did not declare release readiness.

## Reviewer handoff checklist

- Check that `goal-operation-runs.v1` stores only the task-1 fields required by the runbook.
- Confirm preview and confirm use the same deterministic operation id for the same goal/task/role/command/plan hash.
- Confirm the new `/api/goals/<goal-id|latest>/operations` route is scoped to safe goal refs and does not expose arbitrary paths.
- Confirm Workbench displays operation id/status fields without inferring task approval or release readiness from them.
- Confirm the Workbench rebuild artifact change is expected.
