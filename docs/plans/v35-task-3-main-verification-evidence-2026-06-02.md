# v35 Task-3 Main Verification Evidence

## Scope

- Goal id: `v35-job-queue-run-control-workspace`
- Task id: `task-3`
- Branch merged: `v35-task-3-job-event-timeline-log-stream-contract`
- Main branch commit verified: `293da63`
- Worker evidence: `docs/plans/v35-task-3-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v35-task-3-review-evidence-2026-06-02.md`
- Main verifier: `codex-main-verifier-v35-task-3`
- Verification date: `2026-06-03`

## Verification Summary

Fast-forward merged `v35-task-3-job-event-timeline-log-stream-contract` into local `main` and verified the task-3 job timeline/log stream contract on `main`.

The verified user path is:

```text
GET /api/jobs/timeline?job_id=<job-id>&goal=<goal-id>&task=<task-id>
Workbench read-only route list includes job-timeline-log-stream.v1
```

The route returns `job-timeline-log-stream.v1`, accepts only `job_id`, `goal`, and `task`, rejects unsupported query parameters and unsafe refs with `400`, and rejects non-GET requests with `405`. The contract is read-only. It returns an empty timeline and empty log refs until a real job event store exists.

## Commands Run On Main

| Command | Result |
| --- | --- |
| `git merge --ff-only v35-task-3-job-event-timeline-log-stream-contract` | Exit `0`; fast-forwarded `main` to `293da63` |
| `pnpm check` | Exit `0` |
| `pnpm test -- tests/v35-job-timeline-contract.test.js tests/v35-job-model-contract.test.js tests/v35-job-creation-contract.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js` | Exit `0`; 123 tests passed |
| `pnpm test` | Exit `0`; 841 tests passed |
| `pnpm workbench:build` | Exit `0`; Vite build completed with `index-UqI2q5Fy.js` |
| `git diff --check` | Exit `0` |
| `pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json` | Exit `0`; task-3 reviewer approval recorded, main verification missing before this evidence |
| `pnpm --silent symphony goal next --goal v35-job-queue-run-control-workspace --json` | Exit `0`; next role was `main-verifier` for task-3 |

## Boundary Verification

- No job execution or job runner was added.
- No pause, cancel, resume, or recover logic was added.
- No Workbench job console was added.
- No shell execution, model invocation, git write, tag, publish, or release path was added.
- `scripts/symphony.js` and `src/task-queue.js` were not modified by task-3.
- `timelineSource` is locked to `explicit-backend-job-events`.
- `logRefSource` is locked to `structured-log-refs-only`.
- `context.sourceContracts` must include `job-model.v1`, `job-creation.v1`, and `goal-event-log.v1`.
- Log ref URIs reject `file:`, local absolute paths outside `/api/`, encoded traversal, and backslash traversal.
- Timeline event `job_id`, `goal_id`, and `task_id` must match non-null request context fields.
- Log ref `job_id` must match non-null request context `jobId`.

## Result

Task 3 is ready for `main-verification` gate registration.
