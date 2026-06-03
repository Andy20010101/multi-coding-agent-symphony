# v35 Task-5 Main Verification Evidence

## Scope

- Goal id: `v35-job-queue-run-control-workspace`
- Task id: `task-5`
- Branch merged: `v35-task-5-workbench-job-console-binding`
- Main branch commit verified: `bbd6435`
- Worker evidence: `docs/plans/v35-task-5-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v35-task-5-review-evidence-2026-06-02.md`
- Main verifier: `codex-main-verifier-v35-task-5`
- Verification date: `2026-06-03`

## Verification Summary

Fast-forward merged `v35-task-5-workbench-job-console-binding` into local `main` and verified the task-5 Workbench Job Console binding on `main`.

The verified user path is:

```text
Workbench /workbench renders the v35 Job Console from read-only job contracts:
GET /api/jobs
GET /api/jobs/create
GET /api/jobs/timeline
GET /api/jobs/control
```

The Workbench panel consumes `job-model.v1`, `job-creation.v1`, `job-timeline-log-stream.v1`, and `job-run-control.v1` through the read-only route allowlist. It projects queue state, blocker/failure fields, creation contract status, timeline/log counts, controlled run transitions, route health, and safety boundaries. The panel is display-only and does not create jobs, execute jobs, mutate job state, invoke models, run shell commands, or write git/release state.

## Commands Run On Main

| Command | Result |
| --- | --- |
| `git merge --ff-only v35-task-5-workbench-job-console-binding` | Exit `0`; fast-forwarded `main` to `bbd6435` |
| `pnpm check` | Exit `0` |
| `pnpm test -- tests/v35-task-5-workbench-job-console-binding.test.js tests/v35-job-run-control-contract.test.js tests/v35-job-timeline-contract.test.js tests/v35-job-model-contract.test.js tests/v35-job-creation-contract.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js` | Exit `0`; 150 tests passed |
| `pnpm test` | Exit `0`; 868 tests passed |
| `pnpm workbench:build` | Exit `0`; Vite build completed with `index-DGKVua6N.js` and `index-ooe-c3KL.css` |
| `git diff --check` | Exit `0` |
| `pnpm --silent symphony actions manifest --json` | Exit `0`; returned `action-manifest.v1` |
| `pnpm --silent symphony actions availability --json` | Exit `0`; returned `action-availability.v1`; main verification action was available for task-5 |
| `pnpm --silent symphony actions preview --goal v35-job-queue-run-control-workspace --task task-5 --action goal.main-verification-gate.record --json` | Exit `0`; returned `action-preview.v1`; confirmation required before appending the gate event |
| `pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json` | Exit `0`; task-5 was `approved`, task-1 through task-4 were `main-verified` |

## Boundary Verification

- No job creation path was added.
- No job execution path was added.
- No shell execution path was added.
- No model invocation path was added.
- No frontend job state mutation path was added.
- No git write, merge, push, tag, publish, or release path was added by the Workbench panel.
- No `src/task-queue.js` change.
- Job API routes remain explicit read-only GET routes.
- POST, PUT, and DELETE requests to all four job routes are rejected by tests.
- Unsafe query parameters are rejected by tests.
- The static Workbench build contains Job Console markers and no reviewed execution/write/browser-storage markers.

## Browser Check

Chrome visual automation was not used because the user was actively using Chrome during the task-5 review period. Main verification relies on React/static tests, route tests, Vite build output, and local HTTP/static checks already captured in worker and review evidence.

## Result

Task 5 is ready for `main-verification` gate registration.
