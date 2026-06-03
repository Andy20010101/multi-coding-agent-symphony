# v35 Task-4 Main Verification Evidence

## Scope

- Goal id: `v35-job-queue-run-control-workspace`
- Task id: `task-4`
- Branch merged: `v35-task-4-pause-cancel-resume-recover-semantics`
- Main branch commit verified: `fd22df0`
- Worker evidence: `docs/plans/v35-task-4-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v35-task-4-review-evidence-2026-06-02.md`
- Main verifier: `codex-main-verifier-v35-task-4`
- Verification date: `2026-06-03`

## Verification Summary

Fast-forward merged `v35-task-4-pause-cancel-resume-recover-semantics` into local `main` and verified the task-4 job run control contract on `main`.

The verified user path is:

```text
GET /api/jobs/control?job_id=<job-id>&goal=<goal-id>&task=<task-id>&state=<queued|running|blocked|failed|passed|cancelled>
Workbench read-only route list includes job-run-control.v1
```

The route returns `job-run-control.v1`, accepts only `job_id`, `goal`, `task`, and `state`, rejects unsupported query parameters and unsafe refs with `400`, rejects invalid state values with `400`, and rejects non-GET requests with `405`. The contract defines controlled transition semantics only; it does not mutate job state.

## Commands Run On Main

| Command | Result |
| --- | --- |
| `git merge --ff-only v35-task-4-pause-cancel-resume-recover-semantics` | Exit `0`; fast-forwarded `main` to `fd22df0` |
| `pnpm check` | Exit `0` |
| `pnpm test -- tests/v35-job-run-control-contract.test.js tests/v35-job-timeline-contract.test.js tests/v35-job-model-contract.test.js tests/v35-job-creation-contract.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js` | Exit `0`; 144 tests passed |
| `pnpm test` | Exit `0`; 862 tests passed |
| `pnpm workbench:build` | Exit `0`; Vite build completed with `index-CNvfuxRl.js` |
| `git diff --check` | Exit `0` |
| `pnpm --silent symphony goal next --goal v35-job-queue-run-control-workspace --json` | Exit `0`; next role was `main-verifier` for task-4 |

## Boundary Verification

- No job execution or job runner was added.
- No hidden retry mechanism was added.
- No Workbench job console UI binding was added.
- No shell execution, model invocation, arbitrary local file read, git write, tag, publish, or release path was added.
- `scripts/symphony.js`, `src/task-queue.js`, and `CLAUDE.md` were not modified by task-4.
- `controlSource` is locked to `explicit-backend-job-state`.
- `stateSource` is locked to `explicit-backend-contracts`.
- `hiddenRetryAvailable` is `false`.
- Every transition has `hiddenRetry: false`.
- The transition table is locked to exactly `pause`, `cancel`, `resume`, and `recover`.
- Extra, missing, reordered, or retargeted transitions are rejected by validation.

## Result

Task 4 is ready for `main-verification` gate registration.
