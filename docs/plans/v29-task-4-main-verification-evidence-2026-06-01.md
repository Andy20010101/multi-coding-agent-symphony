# v29 task-4 main verification evidence

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Task id: `task-4`  
Task: Operation console and run-result bridge  
Branch checked: `v29-task-4-operation-console-and-run-result-bridge`  
Evidence path: `docs/plans/v29-task-4-main-verification-evidence-2026-06-01.md`  
Result: `passed`

## Verification basis

Task-4 scope is to write and read confirmed implementation runs through the existing goal operation registry, then bridge run result, artifact refs, and verifier summary into the Active Goal, Operations, and Implementation paths.

Read before verification:

- `docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md`
- `docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md`
- `docs/plans/v29-task-4-worker-evidence-2026-06-01.md`
- `docs/plans/v29-task-4-review-evidence-2026-06-01.md`

Inspected implementation paths:

- `src/symphony/goal-operation-run-registry.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `tests/v23-goal-operation-run-registry.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

## Evidence chain

The evidence chain is explicit and is not self-approval.

- Worker evidence exists at `docs/plans/v29-task-4-worker-evidence-2026-06-01.md`.
- The managed event log contains worker event `evt_5b76cf07d20b39f7` for `worker.evidence-recorded`, actor `codex-v29-task-4-worker`, evidence ref `docs/plans/v29-task-4-worker-evidence-2026-06-01.md`.
- Review evidence exists at `docs/plans/v29-task-4-review-evidence-2026-06-01.md`, with verdict `approved`.
- The managed event log contains reviewer approval events for the same review evidence. The latest task-4 status source is `evt_be1c0f73d1811e8d`, actor `codex-v29-task-4-reviewer-fallback`, event type `reviewer.approved`.
- `pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json` returned `next.taskId: "task-4"`, `next.role: "main-verifier"`, `next.phase: "main-verification"`, with reason `Reviewer approved task-4 but main verification is missing.`
- This verification wrote evidence only. It did not run `symphony goal gate`, did not register a main verification event, and did not approve its own worker output.

## Implementation findings

`src/symphony/goal-operation-run-registry.js` extends the existing `goal-operation-runs.v1` registry rather than adding a new framework. `COMMAND_KINDS` includes `implementation`, and the registry normalizes and persists `output`, `runResult`, `artifactRefs`, `verifierSummary`, and `failureReason`.

`src/symphony/console.js` keeps implementation confirm constrained to the preview context. The confirm body must be JSON and may contain only `goalId`, `taskId`, `planId`, and `planHash`. The backend recomputes the same active goal/task preview and rejects mismatched plan id or plan hash before starting the run. The run path maps to the existing `symphony do --confirm-plan <plan-id> --json` semantics, then records the result through `recordGoalOperationRun` with `commandKind: "implementation"`, `commandName: "symphony do --confirm-plan"`, `source: "workbench.implementation-run-confirm"`, run result, output summary, artifacts, verifier summary, and failure reason.

`frontend/workbench/src/api/contracts.js` reads the same operation registry for both `activeGoal.operationConsole.latest` and `activeGoal.controlledImplementationPlanPreview.runResultBridge`. The bridge is scoped to `commandKind: "implementation"`, matching `goalId` and `taskId`, and exposes run id, execution plan id, run status, exit code, verifier status, write boundary, workspace refs, evidence artifact path, artifact refs, changed-file count, output summary, and failure reason.

`frontend/workbench/src/App.jsx` displays the run-result bridge in the Implementation path and displays the latest implementation operation in the Operation Console, including command preview, stdout/stderr summary, artifact refs, verifier summary, and failure reason.

The task stays within the v29 non-goals. I did not find a generic shell runner, browser terminal, model invocation path, new permission system, generic goal framework, generic artifact framework, command DSL, v8 top-level action list, worker self-approval, readiness inference from filenames/branches/commits/prompts/task titles/frontend heuristics, or auto-merge/tag/push/publish path in the inspected task-4 changes.

## Command results

### `pnpm check`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit code `0`.

```text
tests 739
suites 115
pass 739
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4990.782958
```

### `pnpm workbench:build`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DEceTgZX.css   20.62 kB | gzip:   3.69 kB
src/symphony/workbench-static/assets/index-CTaiFEXY.js   916.52 kB | gzip: 168.49 kB
```

### `git diff --check`

Result: exit code `0`; no output.

### `pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json`

Result: exit code `0`.

Observed task-4 fields:

```json
{
  "taskId": "task-4",
  "title": "Operation console and run-result bridge",
  "status": "approved",
  "statusSource": "goal-event-log.v1:evt_be1c0f73d1811e8d",
  "workerEvidenceRef": "docs/plans/v29-task-4-worker-evidence-2026-06-01.md",
  "reviewEvidenceRef": "docs/plans/v29-task-4-review-evidence-2026-06-01.md",
  "reviewVerdict": "APPROVED",
  "mainVerificationRef": null,
  "blockers": []
}
```

Observed summary fields:

```json
{
  "totalTasks": 5,
  "completedTasks": 4,
  "blockedTasks": 0,
  "needsReviewTasks": 0,
  "needsRevisionTasks": 0,
  "releaseReady": false,
  "releaseReadySource": null
}
```

### Additional read-only next-action check

`pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json`

Result: exit code `0`.

```json
{
  "taskId": "task-4",
  "role": "main-verifier",
  "phase": "main-verification",
  "reason": "Reviewer approved task-4 but main verification is missing.",
  "blocked": false
}
```

## Fallback notes

The runbook main verification prompt lists a main checkout, pull, and fast-forward merge. This verifier did not switch branches or merge because the delegated controller context asked for task-4 verification in the current checkout and the worktree is intentionally dirty with task-1 through task-4 files, generated Workbench assets, evidence files, and the v29 fixture. Switching or merging inside this subagent would risk disturbing existing managed-workspace state and user changes.

Repo-local/current-checkout fallback was used. Verification was anchored to the current branch, the current managed event log, the required evidence files, source inspection, and the acceptance commands above.

No product fixes, event registrations, commits, merges, pushes, tags, publish steps, or release gates were performed.

## Residual risks

The worktree remains uncommitted and includes earlier v29 task files plus generated static assets. This evidence verifies the current checkout behavior, not a clean main-branch merge.

The event log has two reviewer approval events for task-4 using the same review evidence path: `evt_85b5a447fda0def5` and `evt_be1c0f73d1811e8d`. The latest status source is `evt_be1c0f73d1811e8d`. Both are reviewer-role approvals and neither is a main verification event, so this did not block task-4 main verification.

No browser screenshot was taken. The React shell, backend API, registry persistence, and Workbench projection paths were covered by `pnpm test` and `pnpm workbench:build`.

## Recovery steps

If the controller registers main verification and task-4 does not advance, run `pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json` and inspect the returned `evidenceState`.

If a confirmed implementation run is not visible in Workbench, read `GET /api/goals/<goal-id>/operations` and check for a `goal-operation-runs.v1` entry with `commandKind: "implementation"` for the same `goalId` and `taskId`.

If implementation confirm fails before starting a run, rerun the preview and confirm only with the returned `goalId`, `taskId`, `planId`, and `planHash`.

If an isolated run fails after starting, inspect the registry fields `failureReason`, `verifierSummary`, `artifactRefs`, `output`, and `runResult` before deciding whether task-4 needs worker revision.
