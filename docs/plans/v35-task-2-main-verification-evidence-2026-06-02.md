# v35 Task-2 Main Verification Evidence

## Scope

- Goal id: `v35-job-queue-run-control-workspace`
- Task id: `task-2`
- Branch merged: `v35-task-2-create-job-from-controlled-action`
- Main branch commit verified: `d67547f`
- Worker evidence: `docs/plans/v35-task-2-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v35-task-2-review-evidence-2026-06-02.md`
- Main verifier: `codex-main-verifier-v35-task-2`

## Verification Summary

Fast-forward merged `v35-task-2-create-job-from-controlled-action` into local `main` and verified the task-2 dry-run job creation implementation on `main`.

The verified user path is:

```text
GET /api/jobs/create?goal=<goal-id>&task=<task-id>&action=<action-id>
Workbench read-only route list includes job-creation.v1
```

The route returns `job-creation.v1`, accepts only `goal`, `task`, and `action`, rejects missing action and unsafe refs with `400`, and rejects non-GET requests with `405`. The contract is a dry-run preview from `action-preview.v1`; it does not write event logs, queue state, or persistent job records.

## Commands Run On Main

| Command | Result |
| --- | --- |
| `git merge --ff-only v35-task-2-create-job-from-controlled-action` | Exit `0`; fast-forwarded `main` to `d67547f` |
| `pnpm check` | Exit `0` |
| `pnpm test -- tests/v35-job-creation-contract.test.js tests/v35-job-model-contract.test.js tests/v34-action-manifest.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js` | Exit `0`; 117 tests passed |
| `pnpm workbench:build` | Exit `0`; Vite build completed with `index-oXDLVfGP.js` |
| `git diff --check` | Exit `0` |
| `pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json` | Exit `0`; task-2 reviewer approval recorded, main verification missing before this evidence |
| `pnpm --silent symphony goal next --goal v35-job-queue-run-control-workspace --json` | Exit `0`; next role was `main-verifier` for task-2 |

## Boundary Verification

- No job execution or job runner was added.
- No pause, cancel, resume, or recover logic was added.
- No Workbench job console was added.
- No shell execution, model invocation, git write, merge, push, tag, publish, or release path was added.
- `scripts/symphony.js`, `src/task-queue.js`, and `CLAUDE.md` were not modified by task-2.
- `plan.dryRun` is `true`.
- `plan.writesEventLog`, `plan.writesQueueState`, `plan.createsPersistentJob`, and `plan.createsJobRecord` are `false`.
- `boundaries.jobCreationSource` is `action-preview.v1 only`.
- `context.sourceContracts` must include `action-manifest.v1`, `action-availability.v1`, `action-preview.v1`, and `job-model.v1`.

## Result

Task 2 is ready for `main-verification` gate registration.
