# v35 task-2 worker evidence

Goal id: `v35-job-queue-run-control-workspace`
Task id: `task-2`
Branch: `v35-task-2-create-job-from-controlled-action`
Date: 2026-06-03

## Implementation summary

Implemented the job-creation.v1 contract that creates a dry-run job from a controlled action preview. The contract enforces:

- Job creation source must be `action-preview.v1 only`
- Default readOnly/dryRun mode — no writes, no event log, no queue state, no persistent job creation
- Job identity links goal_id, task_id, action_id
- All boundaries locked to `false` (no execution, no shell, no model, no git, no merge/push/tag/publish)
- `plan` section explicitly declares `dryRun: true`, `createsPersistentJob: false`, `writesEventLog: false`, `writesQueueState: false`, `jobExecutionAvailable: false`, `requiresConfirmation: true`
- `confirmationContract` field intentionally removed from plan — task-2 has no confirm route, no write path, no persistent job creation
- Warnings and blockers derived from action preview state; each entry validated with non-empty code/message/source
- Blocker/status consistency: non-null blocker or non-empty blockers require `blocked` status and a non-null `job.blocker`; null blocker rejects `blocked` status
- `sourceActionPreview` validated: contractName must be `action-preview.v1`, generatedAt must be ISO timestamp, action must be non-null when context.actionId is set and no action-level blockers exist, action.action_id must match context.actionId and job.action_id
- Context sourceContracts must include all four required contracts: `action-manifest.v1`, `action-availability.v1`, `action-preview.v1`, `job-model.v1`
- `GET /api/jobs/create?goal=&task=&action=` route added to console.js
- Route rejects unsupported query params (400), unsafe refs (400), missing action (400), POST (405)
- Codex controller follow-up tightened validation so malformed `context` or `job` returns validation errors instead of throwing.

## Files changed

Modified (M):
- `src/symphony/console.js` — added `buildJobCreationContract` import and `GET /api/jobs/create` route handler
- `frontend/workbench/src/api/contracts.js` — added `jobCreation` route template and allowlist entry
- `tests/workbench-api-client.test.js` — updated READONLY_API_ROUTES and READONLY_API_ROUTE_ALLOWLIST assertions
- `tests/workbench-shell.test.js` — updated frontend API path assertion
- `src/symphony/workbench-static/index.html` — hash updated by workbench build

Deleted (D):
- `src/symphony/workbench-static/assets/index-DFhgyDos.js` — previous build bundle, replaced

New (??):
- `src/symphony/job-creation-contract.js` — core contract module
- `fixtures/contracts/job-creation.v1.json` — contract fixture with populated sourceActionPreview.action
- `tests/v35-job-creation-contract.test.js` — 23 tests
- `src/symphony/workbench-static/assets/index-oXDLVfGP.js` — new build bundle (replaced index-DFhgyDos.js)
- `docs/plans/v35-task-2-worker-evidence-2026-06-02.md` — this evidence

## Validation results

| Command | Exit | Result |
|---|---|---|
| `pnpm check` | 0 | No syntax errors |
| `pnpm test` | 0 | 823 pass, 0 fail, 125 suites |
| `pnpm workbench:build` | 0 | Built successfully |
| `git diff --check` | 0 | No whitespace issues |
| `pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json` | 0 | task-2 status: planned |
| `pnpm --silent symphony actions manifest --json` | 0 | Valid action-manifest.v1 |
| `pnpm --silent symphony actions availability --json` | 0 | Valid action-availability.v1 |
| `pnpm --silent symphony actions preview --goal v35-job-queue-run-control-workspace --task task-2 --action goal.worker-evidence.record --json` | 0 | Valid action-preview.v1 |

Targeted test run:
```
pnpm test -- tests/v35-job-creation-contract.test.js tests/v35-job-model-contract.test.js tests/v34-action-manifest.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js
```
Result: 117 pass, 0 fail, 9 suites

Additional validator probes after Codex controller follow-up:

- Missing `action-manifest.v1`, `action-availability.v1`, `action-preview.v1`, or `job-model.v1` is rejected.
- Fake `sourceActionPreview.contractName` is rejected.
- `sourceActionPreview.action: null` with a non-null `context.actionId` and no action-level blocker is rejected.
- Non-empty `blockers` with queued/no `job.blocker` is rejected.
- Unsafe warning/blocker source strings are rejected.
- Malformed `context` or `job` returns validation errors instead of throwing.

## User-visible App/Workbench path

`GET /api/jobs/create?goal=v35-job-queue-run-control-workspace&task=task-2&action=goal.worker-evidence.record`

Returns a job-creation.v1 contract showing:
- Job identity (job_id, goal_id, task_id, action_id)
- Status: queued or blocked, queue_state: action-preview-contract
- Plan: dryRun=true, all execution/write flags false
- Boundaries: all false, jobCreationSource locked to `action-preview.v1 only`
- sourceActionPreview with validated contractName, generatedAt, and action object
- Warnings and blockers with validated code/message/source entries

## Boundary notes

- No job execution: `plan.jobExecutionAvailable: false`, `boundaries.jobExecutionAvailable: false`
- No shell execution: `boundaries.arbitraryCommandExecutionAvailable: false`
- No model invocation: `boundaries.modelInvocationAvailable: false`
- No file writes: `plan.writesEventLog: false`, `plan.writesQueueState: false`, `plan.createsPersistentJob: false`
- No git write: `boundaries.gitWriteAvailable: false`
- No merge/push/tag/publish: all false in boundaries
- No self-approval: `boundaries.selfApprovalAvailable: false`
- Job creation source locked to `action-preview.v1 only`
- Route accepts only `goal`, `task`, `action` query params
- Route rejects unsupported params, unsafe refs, POST
- No `--output` flag, no `--confirm` flag, no plan-hash input
- No confirmationContract in plan — task-2 has no confirm route
- Validator enforces: sourceActionPreview contract name lock, action_id consistency, blocker/status consistency, warnings/blockers entry validation, and malformed context/job handling

## Known limitations / reviewer handoff

- This is a dry-run preview only; no persistent job is created
- `confirmationContract` intentionally not in plan — declarative only, no confirm route exists
- Job creation requires a valid action preview; state-dependent availability is resolved at request time
- Actual job confirmation/execution is deferred to task-4 (pause/cancel/resume/recover)
- Workbench job console binding is task-5
- No pause/cancel/resume/recover semantics (task-4)
- No job event timeline (task-3)

## Safety verification

This task adds NO:
- job execution
- shell execution
- model invocation
- git write
- release write
- artifact download
- local file open
- merge, push, tag, or publish path
- confirm route or write path

No reviewer approval recorded.
No main verification recorded.
No release readiness declared.
