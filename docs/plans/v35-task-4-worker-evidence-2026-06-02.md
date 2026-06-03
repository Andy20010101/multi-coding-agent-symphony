# v35 task-4 worker evidence

Date: 2026-06-03

## Goal context

- **Goal id:** `v35-job-queue-run-control-workspace`
- **Task id:** `task-4`
- **Task title:** Pause/cancel/resume/recover semantics
- **Branch:** `v35-task-4-pause-cancel-resume-recover-semantics`
- **User-visible value:** App 可以恢复中断流程，不伪造成功。

## Implementation summary

Defined a read-only `job-run-control.v1` contract that provides:

- Four controlled state transitions: pause, cancel, resume, recover
- Each transition defines valid `from` states, target `to` state, whether it's reversible/terminal, and `hiddenRetry: false`
- Available transitions are computed from the current job state and validated against the transition rules
- Passed and cancelled are terminal states (no transitions available)
- `controlSource` locked to `explicit-backend-job-state` — no frontend or branch-name inference
- All transitions enforce `hiddenRetry: false` — no automatic/hidden retries
- Recovery from failed state is explicit (`recover`), not automatic
- Codex controller follow-up locked the transition table to exactly `pause`, `cancel`, `resume`, and `recover`, including order, valid source states, target state, terminal flag, and reversible flag.

## Transition rules

| Transition | From | To | Reversible | Terminal |
|---|---|---|---|---|
| pause | queued, running | blocked | yes | no |
| cancel | queued, running, blocked, failed | cancelled | no | yes |
| resume | blocked | queued | no | no |
| recover | failed | queued | no | no |

## Files changed

### New files
- `src/symphony/job-run-control-contract.js` — Contract module: build, validate, assert functions with transition validation, available-transition computation, and boundary enforcement
- `fixtures/contracts/job-run-control.v1.json` — Static contract fixture
- `tests/v35-job-run-control-contract.test.js` — 21 tests covering fixture validation, boundary drift, transition rules, exact transition-table drift, unsafe refs, route behavior, state-based transition computation, and contract preservation

### Modified files
- `src/symphony/console.js` — Added import for `buildJobRunControlContract` and `GET /api/jobs/control` route handler accepting `job_id`, `goal`, `task`, `state` params
- `frontend/workbench/src/api/contracts.js` — Added `JOB_RUN_CONTROL_CONTRACT_NAME` constant and `jobRunControl` route entry to `READONLY_API_ROUTES`
- `tests/workbench-api-client.test.js` — Updated expected route lists (2 locations)
- `tests/workbench-shell.test.js` — Updated expected frontend API paths list

### Build output (from `pnpm workbench:build`)
- `src/symphony/workbench-static/index.html` — Updated asset reference
- `src/symphony/workbench-static/assets/index-CNvfuxRl.js` — New bundle
- `src/symphony/workbench-static/assets/index-UqI2q5Fy.js` — Replaced by new bundle

## Exact validation command results

### pnpm check
```
node --check src/*.js src/adapters/*.js ... tests/*.test.js
(exit 0, no output)
```

### pnpm test (full suite)
```
ℹ tests 862
ℹ suites 127
ℹ pass 862
ℹ fail 0
(exit 0)
```

### pnpm test (targeted v35 task-1/2/3/4 + workbench routes)
```
v35 job-run-control.v1 contract — 21/21 pass
v35 job-timeline-log-stream.v1 contract — 18/18 pass
v35 job-model.v1 contract — 10/10 pass
v35 job-creation.v1 contract — 23/23 pass
v15 Workbench read-only API client — 47/47 pass
v15 Workbench React/Vite shell — 24/24 pass
v15 Workbench static serving — 2/2 pass
Total targeted: 144 pass, 0 fail, 7 suites
(exit 0)
```

### pnpm workbench:build
```
✓ built in 102ms
(exit 0)
```

### git diff --check
```
(exit 0, no output)
```

### pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
```
task-4 status: "planned"
task-1, task-2, task-3 status: "main-verified"
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
- **No hidden retries:** `hiddenRetryAvailable: false` in boundaries; every transition has `hiddenRetry: false`
- **No arbitrary file read:** `arbitraryPathReadAvailable: false`
- **No git write:** `gitWriteAvailable: false`, `mergeAvailable: false`, `pushAvailable: false`, `tagAvailable: false`
- **No self-approval:** `selfApprovalAvailable: false`
- **No state inference:** `stateSource: "explicit-backend-contracts"`, `controlSource: "explicit-backend-job-state"`
- **POST rejected:** 405 for all POST requests to the control route (generic handler)
- **Unsafe input rejected:** 400 for traversal/unsafe refs, unsupported query params, invalid state values
- **Existing contracts preserved:** job-model.v1, job-creation.v1, job-timeline-log-stream.v1, action-manifest.v1 all continue to serve correctly
- **Transition self-loops rejected:** transitions where `to` equals a `validFrom` state are rejected
- **Transition-table drift rejected:** extra, missing, reordered, or retargeted controlled transitions are rejected
- **src/task-queue.js not modified**
- **scripts/symphony.js not modified**
- **CLAUDE.md not modified**

## Known limitations / next task handoff

- No real job state store — `currentState` is provided via query parameter and defaults to null. This is by design: task-4 defines the transition semantics; task-5 adds the Workbench job console UI binding that will consume this contract.
- No Workbench job console binding — this belongs to task-5.
- No pause/cancel/resume/recover execution — only the contract and semantic rules are defined. Actual state mutation needs a job runner (out of scope for v35).
- The `availableTransitions` array is empty when no `state` parameter is provided, indicating no job state information is available.

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
- hidden retry mechanism

## Status

- **No reviewer approval** — reviewer must be independent
- **No main verification** — main verifier must be independent
- **No merge, push, tag, or release** — Codex High handles these
- **Worker evidence only** — this document records implementation completion and self-check results
