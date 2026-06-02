# v35 Task-1 Review Evidence

## Scope

- Goal id: `v35-job-queue-run-control-workspace`
- Task id: `task-1`
- Branch reviewed: `v35-task-1-job-model-contract`
- Base commit reviewed: `6b61f9b`
- Worker evidence: `docs/plans/v35-task-1-worker-evidence-2026-06-02.md`
- Reviewer: `claude-independent-reviewer-v35-task-1`
- Verdict: `APPROVED`

## Files Reviewed

- `src/symphony/job-model-contract.js`
- `fixtures/contracts/job-model.v1.json`
- `tests/v35-job-model-contract.test.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/workbench-api-client.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DzA47IAl.js`
- `src/symphony/workbench-static/assets/index-DFhgyDos.js`
- `docs/plans/v35-task-1-worker-evidence-2026-06-02.md`

## Review Result

The task-1 diff adds the read-only `job-model.v1` contract, fixture, validation tests, Workbench route allowlist entry, and minimal `GET /api/jobs` route. The route accepts only `goal` and `task` query parameters, rejects unsafe refs with `400`, and rejects non-GET requests with `405`.

The job model uses `queued`, `running`, `blocked`, `failed`, `passed`, and `cancelled`. It does not use `completed`. `boundaries.jobCreationSource` is locked to `action-preview.v1 only`, and validation rejects other values. `context.sourceContracts` must include `action-manifest.v1`, `action-availability.v1`, and `action-preview.v1`.

The reviewer found no blocking issue. One evidence gap was identified: the worker evidence originally did not list the rebuilt Workbench static bundle. The evidence file now lists `src/symphony/workbench-static/index.html`, the new `index-DFhgyDos.js`, and the replaced `index-DzA47IAl.js`.

## Commands Run

| Command | Result |
| --- | --- |
| `pnpm check` | Exit `0`; syntax check passed |
| `pnpm test -- tests/v35-job-model-contract.test.js tests/v34-action-manifest.test.js tests/workbench-api-client.test.js tests/workbench-route-smoke.test.js` | Exit `0`; 79 tests passed |
| `pnpm workbench:build` | Exit `0`; Vite build completed with `index-DFhgyDos.js` |
| `git diff --check` | Exit `0` |
| `git diff -- scripts/symphony.js` | No diff |
| `git diff -- CLAUDE.md` | No diff |
| `git diff -- src/task-queue.js` | No diff |

## Boundary Review

- No `scripts/symphony.js` change.
- No `CLAUDE.md` change in the task branch diff.
- No `src/task-queue.js` change.
- No job execution, runner, pause, cancel, resume, recover, shell execution, model invocation, git write, merge, push, tag, publish, or release write path.
- Workbench static assets are included because they are the direct `pnpm workbench:build` output for the route allowlist change.

## Result

Task 1 is approved for main verification.
