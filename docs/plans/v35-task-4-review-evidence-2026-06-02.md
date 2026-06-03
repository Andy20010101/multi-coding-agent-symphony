# v35 Task-4 Review Evidence

## Scope

- Goal id: `v35-job-queue-run-control-workspace`
- Task id: `task-4`
- Branch reviewed: `v35-task-4-pause-cancel-resume-recover-semantics`
- Commit reviewed: `edeb605`
- Worker evidence: `docs/plans/v35-task-4-worker-evidence-2026-06-02.md`
- Reviewer: `claude-independent-reviewer-v35-task-4`
- Verdict: `APPROVED`
- Review date: `2026-06-03`

## Files Reviewed

Modified:
- `frontend/workbench/src/api/contracts.js`
- `src/symphony/console.js`
- `src/symphony/workbench-static/index.html`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

Replaced:
- `src/symphony/workbench-static/assets/index-UqI2q5Fy.js`
- `src/symphony/workbench-static/assets/index-CNvfuxRl.js`

New:
- `src/symphony/job-run-control-contract.js`
- `fixtures/contracts/job-run-control.v1.json`
- `tests/v35-job-run-control-contract.test.js`
- `docs/plans/v35-task-4-worker-evidence-2026-06-02.md`

## Review Result

No blocking findings.

The reviewed implementation adds the read-only `job-run-control.v1` contract and a user-visible `GET /api/jobs/control` route. The route accepts only `job_id`, `goal`, `task`, and `state`, rejects unsupported query parameters with `400`, rejects unsafe refs with `400`, rejects invalid state values with `400`, and rejects non-GET requests with `405`.

The controlled transition table matches the task-4 scope:

| Transition | From | To | Reversible | Terminal |
| --- | --- | --- | --- | --- |
| `pause` | `queued`, `running` | `blocked` | `true` | `false` |
| `cancel` | `queued`, `running`, `blocked`, `failed` | `cancelled` | `false` | `true` |
| `resume` | `blocked` | `queued` | `false` | `false` |
| `recover` | `failed` | `queued` | `false` | `false` |

`validateExactTransitionTable()` rejects extra transitions, missing transitions, reordered transitions, changed target states, changed source states, changed `reversible`, and changed `terminal` values.

## Commands Run

| Command | Result |
| --- | --- |
| `git status --short --branch` | Exit `0`; clean worktree on `v35-task-4-pause-cancel-resume-recover-semantics` |
| `git diff --name-status HEAD~1..HEAD` | Exit `0`; task-4 implementation, fixture, tests, evidence, route allowlist, and static bundle replacement reviewed |
| `pnpm check` | Exit `0` |
| `pnpm test -- tests/v35-job-run-control-contract.test.js tests/v35-job-timeline-contract.test.js tests/v35-job-model-contract.test.js tests/v35-job-creation-contract.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js` | Exit `0`; 144 tests passed |
| `pnpm test` | Exit `0`; 862 tests passed |
| `pnpm workbench:build` | Exit `0` |
| `git diff --check` | Exit `0` |
| `pnpm --silent symphony actions manifest --json` | Exit `0`; returned `action-manifest.v1` |
| `pnpm --silent symphony actions availability --json` | Exit `0`; returned `action-availability.v1` |
| `pnpm --silent symphony actions preview --action goal.worker-evidence.record --json` | Exit `0`; returned `action-preview.v1` |
| `pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json` | Exit `0`; task-4 was `in-progress`, task-1 through task-3 were `main-verified`, task-5 was `planned` |

## Boundary Review

- No job execution.
- No job runner.
- No hidden retry.
- No shell execution.
- No model invocation.
- No arbitrary local file read.
- No git write, merge, push, tag, publish, or release path.
- No self-approval.
- No Workbench job console UI binding.
- `controlSource` is locked to `explicit-backend-job-state`.
- `stateSource` is locked to `explicit-backend-contracts`.
- Every transition has `hiddenRetry: false`.

## Evidence Check

Worker evidence matches the reviewed diff and validation output. The declared non-goals are accurate: `src/task-queue.js`, `scripts/symphony.js`, and `CLAUDE.md` were not modified. Existing v35 contracts remain available: `job-model.v1`, `job-creation.v1`, `job-timeline-log-stream.v1`, and `action-manifest.v1`.

## Result

Task 4 is approved for reviewer verdict registration and main verification.
