# v35 task-3 worker evidence

Date: 2026-06-03

## Goal context

- **Goal id:** `v35-job-queue-run-control-workspace`
- **Task id:** `task-3`
- **Task title:** Job event timeline + log stream contract
- **Branch:** `v35-task-3-job-event-timeline-log-stream-contract`
- **User-visible value:** 用户能看到 job timeline 和 log refs

## Implementation summary

Defined a read-only `job-timeline-log-stream.v1` contract that provides:
- Job event timeline (list of structured events: queued, running, blocked, failed, passed, cancelled, recovered)
- Log stream refs (structured pointers to where logs would be available, not arbitrary file reads)
- Explicit `stateSource: "explicit-backend-contracts"` and `timelineSource: "explicit-backend-job-events"`
- Empty timeline/logRefs by default, with a note stating no job event store exists yet (task-4 will populate)
- Codex controller follow-up tightened validation for required `goal-event-log.v1` source, context/timeline alignment, context/log-ref alignment, and unsafe log ref URI handling.

Timeline events carry: `event_id`, `job_id`, `goal_id`, `task_id`, `action_id`, `event_type`, `queue_state`, `timestamp`, `source`, `message`, `refs`, `blocker`, `failure`.

Log refs carry: `ref_id`, `job_id`, `kind` (stdout/stderr/combined/event-log/structured), `label`, `uri`, `available`, `size_bytes`, `note`.

New API route: `GET /api/jobs/timeline` — accepts only `job_id`, `goal`, `task` query params. Rejects unsupported params (400), unsafe refs (400), POST (405).

## Files changed

### New files
- `src/symphony/job-timeline-contract.js` — Contract module: build, validate, assert functions
- `fixtures/contracts/job-timeline-log-stream.v1.json` — Static contract fixture
- `tests/v35-job-timeline-contract.test.js` — 18 tests covering fixture validation, boundary drift, unsafe input, POST 405, empty state, source contracts, context alignment, and unsafe log refs

### Modified files
- `src/symphony/console.js` — Added import for `buildJobTimelineLogStreamContract` and `GET /api/jobs/timeline` route handler
- `frontend/workbench/src/api/contracts.js` — Added `JOB_TIMELINE_LOG_STREAM_CONTRACT_NAME` constant and `jobTimeline` route entry to `READONLY_API_ROUTES`
- `tests/workbench-api-client.test.js` — Updated expected route lists (2 locations) and no-timeline assertion
- `tests/workbench-shell.test.js` — Updated expected frontend API paths list

### Build output (from `pnpm workbench:build`)
- `src/symphony/workbench-static/index.html` — Updated asset reference
- `src/symphony/workbench-static/assets/index-UqI2q5Fy.js` — New bundle
- `src/symphony/workbench-static/assets/index-oXDLVfGP.js` — Replaced by new bundle

## Exact validation command results

### pnpm check
```
> node --check src/*.js src/adapters/*.js src/ensemble/*.js ...
(exit 0, no output)
```

### pnpm test (full suite)
```
ℹ tests 841
ℹ suites 126
ℹ pass 841
ℹ fail 0
(exit 0)
```

### pnpm test (targeted)
```
tests/v35-job-timeline-contract.test.js — 18/18 pass
tests/v35-job-model-contract.test.js — 10/10 pass
tests/v35-job-creation-contract.test.js — 23/23 pass
tests/workbench-api-client.test.js — 46/46 pass
tests/workbench-shell.test.js — pass
Total targeted run: 123 pass, 0 fail, 6 suites
(exit 0)
```

### pnpm workbench:build
```
✓ built in 76ms
(exit 0)
```

### git diff --check
```
(exit 0, no output)
```

### pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
```
task-3 status: "planned"
task-1, task-2 status: "main-verified"
(exit 0)
```

### pnpm --silent symphony actions manifest --json
```
contractName: "action-manifest.v1"
(exit 0, existing contracts preserved)
```

## Boundary notes

- **No job execution:** `jobExecutionAvailable: false` is enforced in boundaries
- **No shell execution:** `arbitraryCommandExecutionAvailable: false`
- **No model invocation:** `modelInvocationAvailable: false`
- **No arbitrary file read:** `arbitraryPathReadAvailable: false`; log refs use URIs with traversal rejection
- **No local file refs:** log ref URIs reject `file:`, local absolute paths outside `/api/`, encoded traversal, and backslash traversal
- **No git write:** `gitWriteAvailable: false`, `mergeAvailable: false`, `pushAvailable: false`, `tagAvailable: false`
- **No self-approval:** `selfApprovalAvailable: false`
- **No state inference:** `stateSource: "explicit-backend-contracts"`, `timelineSource: "explicit-backend-job-events"`
- **POST rejected:** 405 for all POST requests to the timeline route
- **Unsafe input rejected:** 400 for traversal/goal/task refs, unsupported query params
- **Existing contracts preserved:** job-model.v1, job-creation.v1, action-manifest.v1 all continue to serve correctly
- **Event source required:** `context.sourceContracts` must include `goal-event-log.v1`
- **Context alignment enforced:** timeline event goal/task/job ids and log ref job ids must match non-null request context fields
- **src/task-queue.js not modified** — no change needed for this read-only contract
- **scripts/symphony.js not modified** — no change needed for this read-only contract

## Known limitations / reviewer handoff

- Timeline and logRefs are returned empty — no real job event store exists. This is by design: task-3 defines the contract; task-4 (pause/cancel/resume/recover) adds state transitions; task-5 (Workbench job console) binds the UI.
- No pause/cancel/resume/recover semantics — these belong to task-4.
- No Workbench job console binding — this belongs to task-5.
- Log refs define structured pointers (`kind`, `uri`, `available`) rather than reading actual log files — actual log creation needs a job runner (out of scope for v35 task-3).

## Explicit safety declarations

This task added NONE of the following:
- job execution
- shell execution
- model invocation
- git write
- release write
- artifact download path
- local file open
- merge, push, tag, or publish path

## Status

- **No reviewer approval** — reviewer must be independent
- **No main verification** — main verifier must be independent
- **No merge, push, tag, or release** — Codex High handles these
- **Worker evidence only** — this document records implementation completion and self-check results
