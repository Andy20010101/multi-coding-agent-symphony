# v35 Task-1 Main Verification Evidence

## Scope

- Goal id: `v35-job-queue-run-control-workspace`
- Task id: `task-1`
- Branch merged: `v35-task-1-job-model-contract`
- Main branch commit verified: `3fb7b45`
- Worker evidence: `docs/plans/v35-task-1-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v35-task-1-review-evidence-2026-06-02.md`
- Main verifier: `codex-main-verifier-v35-task-1`

## Verification Summary

Fast-forward merged `v35-task-1-job-model-contract` into local `main` and verified the task-1 job model contract implementation on `main`.

The verified user path is:

```text
GET /api/jobs
GET /api/jobs?goal=<goal-id>&task=<task-id>
Workbench read-only route list includes job-model.v1
```

The route returns `job-model.v1`, accepts only `goal` and `task`, rejects unsafe refs, and rejects non-GET requests. The contract validator requires the v34 Action Registry source contracts and locks execution/write boundaries to false.

## Commands Run On Main

| Command | Result |
| --- | --- |
| `git merge --ff-only v35-task-1-job-model-contract` | Exit `0`; fast-forwarded `main` to `3fb7b45` |
| `pnpm check` | Exit `0` |
| `pnpm test -- tests/v35-job-model-contract.test.js tests/v34-action-manifest.test.js tests/workbench-api-client.test.js tests/workbench-route-smoke.test.js` | Exit `0`; 79 tests passed |
| `pnpm workbench:build` | Exit `0`; Vite build completed with `index-DFhgyDos.js` |
| `git diff --check` | Exit `0` |
| `pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json` | Exit `0`; task-1 reviewer approval recorded, main verification missing before this evidence |
| `pnpm --silent symphony goal next --goal v35-job-queue-run-control-workspace --json` | Exit `0`; next role was `main-verifier` for task-1 |

## Boundary Verification

- No job execution, runner, pause, cancel, resume, recover, shell execution, model invocation, git write, merge, push, tag, publish, or release write path was added.
- `scripts/symphony.js`, `src/task-queue.js`, and ArtifactStore were not modified by task-1.
- `job.status` uses `queued`, `running`, `blocked`, `failed`, `passed`, and `cancelled`.
- `boundaries.jobCreationSource` is exactly `action-preview.v1 only`.
- `context.sourceContracts` must include `action-manifest.v1`, `action-availability.v1`, and `action-preview.v1`.

## Result

Task 1 is ready for `main-verification` gate registration.
