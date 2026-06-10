# v44.3 task-2 worker evidence

Local run date: 2026-06-10
Timezone: Asia/Shanghai
Goal: v44-3-app-contract-context-supervisor
Task: task-2
Role: worker
Assigned thread: 019eaf89-53c1-7bc1-9303-9202f291c1ef
Branch: codex/v44-3-pr2-projection-api-cli
Worktree: /Users/andy/.codex/worktrees/codex_v44-3-pr2-projection-api-cli
Base commit: 6a5919c43740b0593e7ea0aa5b1d9299e551c730

## Summary

Implemented the PR-2 read-only projection surface for `goal-supervisor-app-read-model.v1`.

The backend now composes the existing goal runbook, event log, goal progress ledger, goal-next action, v44 core projection, and supervisor observability into one app-facing read model through `buildGoalSupervisorAppReadModelFromContracts`.

The console exposes the read model through:

- `GET /api/goals/latest/supervisor`
- `GET /api/goals/<goal-id>/supervisor`

The CLI mirror is:

- `pnpm --silent symphony supervisor status --goal <goal-id|latest> --json`

`symphony supervisor run` remains the existing dry-run runner path.

## Boundary checks

- API route is GET-only through the existing console method gate.
- CLI status prints JSON only and rejects output files, write-flow flags, and release flags.
- The app contract keeps `readOnly: true`, `willMutate: false`, `commandBoundary.state: disabled`, and `executionAvailable: false`.
- No frontend panel implementation was added. `frontend/workbench/src/api/contracts.js` only adds the latest route and scoped route template to the read-only route list.
- The read model does not expose `latestResultText`, `rawTranscript`, or `agentMessage`.
- No dispatch, event registration, provider CLI, real CLI, mutation, audit, tag, publish, or release closeout path was added or run.

## Commands run

| Command | Result |
| --- | --- |
| `pwd && git status --short --branch` | Passed. Confirmed assigned worktree and clean branch before implementation. |
| `find .. -name AGENTS.md -print` | Passed. No repository `AGENTS.md` file was present; prompt instructions were applied. |
| `sed -n '1,520p' docs/plans/v44-3-app-contract-context-supervisor-runbook-2026-06-10.md` | Passed. Confirmed PR-2 scope and boundaries. |
| `sed -n '1,220p' docs/plans/v44-3-task-1-main-verification-evidence-2026-06-10.md` | Passed. Confirmed inherited PR-1 baseline. |
| `node --test tests/v44-goal-supervisor-app-read-model.test.js` | Passed. Five tests passed. |
| `node --test tests/workbench-api-client.test.js` | Passed. Fifty-four tests passed. |
| `pnpm check` | Passed. Repository syntax check passed. |
| `git diff --check` | Passed. No whitespace errors. |
| `node --test tests/v44-goal-supervisor-*.test.js` | Passed. Forty tests passed. |
| `pnpm --silent symphony supervisor status --goal v19-fixture --json \| node --input-type=module -e "..."` | Passed. Returned `goal-supervisor-app-read-model.v1` with `commandBoundary: disabled` and `executionAvailable: false`. |

## Files changed

- `src/symphony/goal-supervisor/app-read-model-pipeline.js`
- `src/symphony/goal-supervisor/app-read-model.js`
- `src/symphony/goal-supervisor/index.js`
- `src/symphony/console.js`
- `scripts/symphony.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/v44-goal-supervisor-app-read-model.test.js`
- `tests/workbench-api-client.test.js`
- `docs/plans/v44-3-task-2-worker-evidence-2026-06-10.md`

## Residual risk

The PR-2 route currently uses existing repository contracts and runner observability only. PR-3 still needs the read-only Codex and Claude session hook runtime before `contextStatus` can include real transcript availability, token usage, and tool-call summaries.
