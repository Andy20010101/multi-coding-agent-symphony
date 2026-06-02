# v34 Task 2 Worker Evidence

## Scope

- Goal id: `v34-action-registry-workspace`
- Task id: `task-2`
- Branch: `v34-task-2-action-availability-resolver`
- User-visible value: users can see why a declared action is available, unavailable, or blocked for the active goal/task context.

## Implementation Summary

Implemented `action-availability.v1` as a read-only resolver over the task-1 action manifest plus existing goal contracts.

The resolver reads:

- `action-manifest.v1`
- `goal-progress-ledger.v1`
- `goal-next-action.v1`

It returns each action with:

- `state`: `available`, `unavailable`, or `blocked`
- `reasons`: backend reasons from goal status and next action
- `missingContext`: missing backend context
- `requiredInputs`: operator-supplied fields such as evidence refs
- execution boundaries, all disabled

The App/Workbench-visible path is:

```text
GET /api/actions/availability
GET /api/actions/availability?goal=<goal-id>&task=<task-id>
pnpm --silent symphony actions availability --goal <goal-id> --task <task-id> --json
```

## Files Changed

- `src/symphony/action-availability.js`
- `fixtures/contracts/action-availability.v1.json`
- `scripts/symphony.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-Bl4TwnD_.js`
- `src/symphony/workbench-static/assets/index-CkJzWTCM.js`
- `tests/v34-action-manifest.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`

## Commands Run

| Command | Result |
| --- | --- |
| `node --test tests/v34-action-manifest.test.js` | Exit `0`; 7 tests passed |
| `node --test tests/v34-action-manifest.test.js tests/workbench-route-smoke.test.js tests/workbench-api-client.test.js` | Exit `0`; 63 tests passed |
| `node --test tests/workbench-shell.test.js` | Exit `0`; 25 tests passed |
| `pnpm --silent symphony actions availability --goal v34-action-registry-workspace --task task-2 --json \| node -e "...parse..."` | Exit `0`; output included `action-availability.v1 task-2`, `goal.worker-evidence.record:available`, and `goal.implementation.preview:available` |
| `pnpm check` | Exit `0` |
| `pnpm test` | Exit `0`; 783 tests passed |
| `pnpm workbench:build` | Exit `0`; Vite build completed |
| `git diff --check` | Exit `0` |
| `pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json` | Exit `0`; task-1 main-verified, task-2 still planned before this worker evidence |

## App/Workbench User Path Changed

Workbench can now request `/api/actions/availability` and receive a validated `action-availability.v1` payload. The API route accepts only optional `goal` and `task` query parameters and rejects unsupported or unsafe query values.

The frontend read-only route allowlist now includes:

- `/api/actions/manifest`
- `/api/actions/availability`

## Boundary Notes

- No action execution was added.
- No job queue was created.
- No action preview API was implemented beyond exposing declared preview refs and availability states.
- No Workbench action panel binding was added.
- No shell runner, browser terminal, arbitrary command input, arbitrary path read, model invocation, merge, push, tag, publish, self-approval, reviewer verdict, main verification, release gate, or release-ready path was added.
- `requiredInputs` are display data for operator input; they do not trigger file reads.

## Known Limitations / Next Task Handoff

- task-3 should implement the read-only action preview API.
- task-4 should render these manifest and availability contracts in the Workbench action panel.
- task-5 should document the action registry migration path for future versions.
