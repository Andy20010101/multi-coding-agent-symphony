# v35 Task-1 Worker Evidence

- **Goal id**: `v35-job-queue-run-control-workspace`
- **Task id**: `task-1`
- **Branch**: `v35-task-1-job-model-contract`
- **User-visible value**: App 有稳定 job 状态语言。

## Implementation summary

Created the v35 job model contract (`job-model.v1`) defining stable job state language:

- Fields: `job_id`, `project_id`, `goal_id`, `task_id`, `action_id`, `status`, `refs`, `timestamps`, `failure`, `blocker`
- Statuses: `queued`, `running`, `blocked`, `failed`, `passed`, `cancelled`
- Queue states: `action-preview-contract`, `job-event`, `job-queue-state`, `goal-event`
- `context.sourceContracts` must include `action-manifest.v1`, `action-availability.v1`, `action-preview.v1`
- `boundaries.jobCreationSource` locked to `action-preview.v1 only` — validator rejects any deviation
- All execution boundaries locked to false

Added minimal read-only `GET /api/jobs?goal=&task=` route with same query param validation and 405 rejection as v34 action routes.

No CLI command added — user-visible surface is the API route only, per Codex approval.

## Files changed

New:
- `src/symphony/job-model-contract.js` — contract module with validate/assert/build
- `fixtures/contracts/job-model.v1.json` — example fixture
- `tests/v35-job-model-contract.test.js` — 10 tests

Edited:
- `src/symphony/console.js` — added GET /api/jobs route + buildJobModelContract import
- `frontend/workbench/src/api/contracts.js` — added JOB_MODEL_CONTRACT_NAME constant, route entry in READONLY_API_ROUTES
- `tests/workbench-api-client.test.js` — added `['GET', '/api/jobs', 'job-model.v1']` to both route list assertions
- `src/symphony/workbench-static/index.html` and `src/symphony/workbench-static/assets/index-DFhgyDos.js` — rebuilt Workbench static bundle after the route allowlist change; replaced `index-DzA47IAl.js`

Not edited:
- `scripts/symphony.js` — reverted per Codex review; no CLI addition for task-1
- `src/task-queue.js` — not touched
- `CLAUDE.md` — restored from task branch, not part of task-1 changes

## Commands run with results

- `pnpm check` — passed, 0 errors
- `pnpm test -- tests/v35-job-model-contract.test.js tests/v34-action-manifest.test.js tests/workbench-api-client.test.js tests/workbench-route-smoke.test.js` — 79 pass, 0 fail
- `pnpm workbench:build` — built successfully
- `git diff --check` — passed
- `pnpm --silent symphony actions manifest --json` — returned valid action-manifest.v1
- `pnpm --silent symphony actions availability --json` — returned valid action-availability.v1
- `pnpm --silent symphony actions preview --action goal.worker-evidence.record --json` — returned valid action-preview.v1
- `pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json` — task-1 status: planned

## App/Workbench user path changed

- Read-only `GET /api/jobs` route consumable by Workbench API client
- Workbench route allowlist includes job-model.v1

## Boundary notes

- No job execution, job runner, pause/cancel/resume/recover
- No shell execution, model invocation, git write, release write
- No CLI command installed
- ArtifactStore, goal events, Action Registry contracts not modified
- `src/task-queue.js` not edited
- `jobCreationSource` locked to `action-preview.v1 only` with exact-match validation
- V34 Action Registry source contracts required in `context.sourceContracts`

## Known limitations / next task handoff

- Task-1 defines the contract only; task-2 implements job creation from controlled action preview
- `/api/jobs` returns a static example job model; stateDir-backed resolution belongs to later tasks
- No job persistence or queue integration — task-2 and task-3
