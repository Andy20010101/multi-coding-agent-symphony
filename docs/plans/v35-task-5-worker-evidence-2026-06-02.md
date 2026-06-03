# v35 task-5 worker evidence

## Identity

- Goal: v35-job-queue-run-control-workspace
- Task: task-5 — Workbench job console binding
- Branch: v35-task-5-workbench-job-console-binding
- Worker: claude-v35-task-5-worker

## Files changed

| File | Change |
|---|---|
| `frontend/workbench/src/api/contracts.js` | Added `projectJobConsole` view model function and job state helper functions. Extracts job model, job creation, job timeline, and job run control data from route results and projects a unified `jobConsole` view model for the Workbench panel. |
| `frontend/workbench/src/App.jsx` | Added `JobConsolePanel` React component. Displays job queue, current job status, blocked reason, failure info, run control transitions, creation contract warnings/blockers, timeline counts, API route states, and safety boundaries. Added to the Workbench layout in a `job-console-grid` section. |
| `frontend/workbench/src/styles/workbench.css` | Added `.job-console-grid` to grid layout sections and responsive breakpoints. Added `.transition-table`, `.transition-table-wrap` styles for the run control transition table. |
| `src/symphony/workbench-static/` | Rebuilt Workbench static output (index.html and hashed JS/CSS assets). |
| `tests/v35-task-5-workbench-job-console-binding.test.js` | New test file: 6 tests covering API allowlist, route serving and contract validation, real `projectWorkbenchContracts` job console projection, non-GET rejection, unsafe parameter rejection, and static build safety checks. |

## Validation

| Check | Result |
|---|---|
| `pnpm check` | pass |
| `pnpm test -- tests/v35-task-5-workbench-job-console-binding.test.js tests/v35-job-run-control-contract.test.js tests/v35-job-timeline-contract.test.js tests/v35-job-model-contract.test.js tests/v35-job-creation-contract.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js` | pass (150 tests) |
| `pnpm test` (868 tests) | pass |
| `pnpm workbench:build` | pass |
| `git diff --check` | pass (no whitespace errors) |
| `symphony actions manifest --json` | pass |
| `symphony actions availability --json` | pass |
| `symphony actions preview --action goal.worker-evidence.record --json` | pass |
| `symphony goal-status --goal v35-job-queue-run-control-workspace --json` | pass |

## What this task adds

- Workbench UI panel (`JobConsolePanel`) that displays job queue, current job, blocked reason, failure info, available transitions, creation contract status, timeline, and safety boundaries.
- View model projection (`projectJobConsole`) that extracts job data from existing backend contracts (job-model.v1, job-creation.v1, job-timeline-log-stream.v1, job-run-control.v1).
- Codex controller follow-up tightened the task-5 test so the projection test calls `projectWorkbenchContracts` and asserts the rendered `jobConsole` view model from all four job contracts.

## What this task does NOT add

- No job creation (consumes read-only GET `/api/jobs/create` contract).
- No job execution.
- No shell execution.
- No model invocation.
- No git write or release write.
- No artifact download path.
- No local file open.
- No merge, push, tag, or publish.
- No job state mutation from frontend.
- No job runner.
- No modification to `src/task-queue.js`.

## Boundaries confirmed

- The JobConsolePanel only consumes GET routes in the `READONLY_API_ROUTES` allowlist.
- All four job API routes (`/api/jobs`, `/api/jobs/create`, `/api/jobs/timeline`, `/api/jobs/control`) reject POST, PUT, DELETE.
- Unsafe query parameters (traversal, invalid state values) return 400.
- The static Workbench build contains no `child_process`, `exec()`, `spawn()`, `eval()`, `Function()`, `XMLHttpRequest`, `WebSocket`, `writeFile`, `localStorage`, or `indexedDB` references.
- The static build contains the job console UI markers (`job-console-panel`, `v35 job queue`, `Job Console`).
- Job contracts (job-model.v1, job-creation.v1, job-timeline-log-stream.v1, job-run-control.v1) validate cleanly through their respective validators.
- Boundary fields (`jobExecutionAvailable`, `actionExecutionAvailable`, `modelInvocationAvailable`, etc.) remain `false` across the four job contracts where those fields apply.

## User-visible App/Workbench path

The Workbench now has a "v35 job queue" section ("Job Console" panel) that shows:
- Job queue state (job id, status, goal, task, action, queue state, timestamps)
- Blocker reason and required resolution (when the job is blocked)
- Failure code and message (when the job has failed)
- Run control transitions (pause, cancel, resume, recover with valid-from states, target states, reversibility, terminality)
- Creation contract status (dry-run, confirmation required, warnings, blockers)
- Timeline event and log ref counts
- API route health for all four job endpoints
- Full safety boundaries listing

## Risks

- The job console shows static contract data since no real job execution exists yet. Actual job queue state will only populate when a job runner is implemented in a future version.
- The panel relies on all four job routes being available. If any route fails, the panel shows a "partial" state.
