# v23 task-5 worker evidence

## Goal and task

- Goal id: `v23-goal-operation-run-console`
- Task id: `task-5`
- Runbook branch: `v23-task-5-goal-operation-console-tests-docs`
- Current checkout during this worker run: `v23-task-4-failure-recovery-shortcuts`
- User-visible value: 确保 console 服务最新 goal workflow。

## Implementation summary

Added v23-specific console API regression coverage for the Goal Operation Console paths that serve the latest goal workflow:

- successful dry-run preview through `/api/goals/latest/event-plan-preview`
- successful confirm through `/api/goals/<goal-id>/event-plan-confirm`
- missing `planHash` on confirm
- unknown goal refs on preview, confirm, and operations routes
- unsupported subcommands on preview and confirm

The tests assert that dry-run writes only the operation registry, confirm appends one controlled goal event and refreshes goal-status/events/next action, and rejected requests return `error-envelope.v1` without appending events or creating generic operation runs.

The operator guide and product contract docs now name the v23 regression paths and the no-write boundary for the rejection cases.

## Files changed

Task-5 worker changes:

- `tests/v23-goal-operation-console-api.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v23-task-5-worker-evidence-2026-05-29.md`

Existing task-1 through task-4 worktree changes were already present and were preserved.

## Command results

### `pnpm test tests/v23-goal-operation-console-api.test.js`

Exit code: `0`.

```text
tests 5
suites 1
pass 5
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 99.128625
```

### `pnpm check`

Exit code: `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: `0`.

```text
tests 709
suites 113
pass 709
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3722.493833
```

### `pnpm workbench:build`

Exit code: `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DhfUBgwe.css   15.18 kB │ gzip:   2.98 kB
src/symphony/workbench-static/assets/index-BCmw_mw4.js   755.37 kB │ gzip: 140.84 kB

✓ built in 150ms
```

Node printed the existing WASI experimental warning during the build.

### `git diff --check`

Exit code: `0`.

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json`

Exit code: `0`.

```text
contractName: goal-progress-ledger.v1
goalId: v23-goal-operation-run-console
goalTitle: v23 Goal Operation Run Console
generatedAt: 2026-05-31T04:52:00.633Z
summary.totalTasks: 5
summary.completedTasks: 4
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1.status: main-verified
task-2.status: main-verified
task-3.status: main-verified
task-4.status: main-verified
task-5.status: planned
task-5.workerEvidenceRef: null
task-5.reviewEvidenceRef: null
task-5.mainVerificationRef: null
nextActions[0].label: Start task-5
nextActions[0].command: pnpm check
```

## Boundary notes

- 不把 v8 command surface 当 Workbench 主按钮基线。
- 不新增安全框架、权限系统、goal framework、generic shell runner 或 terminal emulator。
- Task-5 adds tests and docs only; it does not add a new Workbench write path.
- Dry-run operation registry entries remain run-control data, not task completion, reviewer approval, main verification, release gate, or release-ready evidence.
- This worker did not approve task-5, did not perform main verification, and did not declare release readiness.

## Worker evidence event registration

Registered only `worker.evidence-recorded` for task-5 with this evidence ref.

Dry-run command:

```text
pnpm --silent symphony goal update --goal v23-goal-operation-run-console --task task-5 --event worker.evidence-recorded --actor codex-v23-task-5-worker --evidence-ref docs/plans/v23-task-5-worker-evidence-2026-05-29.md --dry-run --json
```

Dry-run result:

```text
mode: dry-run
planId: plan_c31ed3f80547e299
planHash: sha256:47e0446bd86276f1f389a3825773aa7bb7088d3683470bc63047b4532a25ef77
validation.status: ok
wouldAppend.writesInDryRun: false
ledgerPreview.changes[0].taskId: task-5
ledgerPreview.changes[0].toStatus: needs-review
```

Confirm command:

```text
pnpm --silent symphony goal update --goal v23-goal-operation-run-console --task task-5 --event worker.evidence-recorded --actor codex-v23-task-5-worker --evidence-ref docs/plans/v23-task-5-worker-evidence-2026-05-29.md --confirm --plan-hash sha256:47e0446bd86276f1f389a3825773aa7bb7088d3683470bc63047b4532a25ef77 --json
```

Confirm result:

```text
mode: confirm
status: appended
written: true
appendOnly: true
eventId: evt_c31ed3f80547e299
eventType: worker.evidence-recorded
taskId: task-5
actor.id: codex-v23-task-5-worker
sequence: 13
eventHash: sha256:2626b09192b97a9928896b0f6e5b4d71aec7f3e8fce7834095b6d8bca78db4e2
```

## Reviewer handoff checklist

- Check that `tests/v23-goal-operation-console-api.test.js` uses the v23 managed runbook fixture and covers the required paths: successful dry-run, confirm, missing plan hash, goal not found, and unsupported subcommand.
- Check that rejected requests leave the managed goal event journal unchanged and do not create generic operation records.
- Check that the docs describe the v23 operation console workflow without turning operation registry state into evidence.
- Re-run `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, and `pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json` if needed.
