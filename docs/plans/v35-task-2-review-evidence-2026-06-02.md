# v35 Task-2 Review Evidence

## Scope

- Goal id: `v35-job-queue-run-control-workspace`
- Task id: `task-2`
- Branch reviewed: `v35-task-2-create-job-from-controlled-action`
- Base commit reviewed: `8a511fd`
- Worker evidence: `docs/plans/v35-task-2-worker-evidence-2026-06-02.md`
- Reviewer: `claude-independent-reviewer-v35-task-2`
- Verdict: `APPROVED`

## Files Reviewed

Modified:
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`

Replaced:
- `src/symphony/workbench-static/assets/index-DFhgyDos.js`
- `src/symphony/workbench-static/assets/index-oXDLVfGP.js`

New:
- `src/symphony/job-creation-contract.js`
- `fixtures/contracts/job-creation.v1.json`
- `tests/v35-job-creation-contract.test.js`
- `docs/plans/v35-task-2-worker-evidence-2026-06-02.md`

## Review Result

The task-2 implementation adds a dry-run `job-creation.v1` contract and a read-only `GET /api/jobs/create` route. The route accepts only `goal`, `task`, and `action`, rejects missing action and unsafe refs with `400`, and rejects non-GET requests with `405`.

The contract is anchored to `action-preview.v1`, `action-manifest.v1`, `action-availability.v1`, and `job-model.v1`. It returns a queued or blocked job preview without writing event logs, queue state, or persistent job records.

The reviewer found no blocking issues. Codex controller follow-up validator checks are included in the reviewed diff: non-empty blockers must produce `blocked` status and a non-null `job.blocker`, warning/blocker sources must be safe source ids, and malformed `context` or `job` returns validation errors instead of throwing.

## Commands Run

| Command | Result |
| --- | --- |
| `pnpm check` | Exit `0`; syntax check passed |
| `pnpm test -- tests/v35-job-creation-contract.test.js tests/v35-job-model-contract.test.js tests/v34-action-manifest.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js` | Exit `0`; 117 tests passed |
| `pnpm test` | Exit `0`; 823 tests passed |
| `pnpm workbench:build` | Exit `0`; Vite build completed with `index-oXDLVfGP.js` |
| `git diff --check` | Exit `0` |
| `pnpm --silent symphony actions preview --goal v35-job-queue-run-control-workspace --task task-2 --action goal.worker-evidence.record --json` | Exit `0`; returned `action-preview.v1` |
| `git diff -- scripts/symphony.js` | No diff |
| `git diff -- src/task-queue.js` | No diff |
| `git diff -- CLAUDE.md` | No diff |

## Boundary Review

- No job execution.
- No job runner.
- No pause, cancel, resume, or recover logic.
- No Workbench job console.
- No shell execution or model invocation.
- No git write, merge, push, tag, publish, or release path.
- `plan.dryRun` is `true`.
- `plan.writesEventLog`, `plan.writesQueueState`, `plan.createsPersistentJob`, and `plan.createsJobRecord` are `false`.
- `boundaries.jobCreationSource` is `action-preview.v1 only`.
- `plan.confirmationContract` is rejected if present because task-2 does not implement a confirm route.

## Evidence Check

Worker evidence matches the actual diff, validation results, static bundle replacement, and task boundary. No reviewer approval, main verification, or release readiness was recorded by the worker.

## Result

Task 2 is approved for worker event registration and main verification.
