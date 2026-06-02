# v34 Task 1 Worker Evidence

## Scope

- Goal id: `v34-action-registry-workspace`
- Task id: `task-1`
- Branch: `v34-task-1-action-manifest-contract`
- User-visible value: UI/Workbench future buttons now have a backend declarative action manifest instead of hard-coded command assumptions.

## Implementation Summary

Implemented `action-manifest.v1` as a read-only backend contract for the first v34 Action Registry slice.

The manifest declares:

- stable `action_id` values
- labels, scopes, and roles
- availability resolver contract refs
- capability preview contract refs
- existing event mapping and confirmation contract refs
- evidence expectations
- explicit execution-disabled boundaries

The App/Workbench-visible path is:

```text
GET /api/actions/manifest
GET /api/actions/manifest?goal=<goal-id>&task=<task-id>
pnpm --silent symphony actions manifest --goal <goal-id> --task <task-id> --json
```

The route accepts only optional `goal` and `task` query parameters. The CLI writes only to stdout and rejects output-file flags.

## Files Changed

- `src/symphony/action-manifest.js`
- `fixtures/contracts/action-manifest.v1.json`
- `tests/v34-action-manifest.test.js`
- `src/symphony/console.js`
- `scripts/symphony.js`
- `tests/workbench-route-smoke.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`

## Commands Run

| Command | Result |
| --- | --- |
| `node --test tests/v34-action-manifest.test.js` | Exit `0`; 3 tests passed |
| `node --test tests/v34-action-manifest.test.js tests/workbench-route-smoke.test.js` | Exit `0`; 14 tests passed |
| `pnpm --silent symphony actions manifest --goal v34-action-registry-workspace --task task-1 --json \| node -e "...parse..."` | Exit `0`; output `action-manifest.v1 v34-action-registry-workspace task-1 false 5` |
| Unsafe manifest route probe for `goal=../../x` and `task=../task` | Exit `0`; both returned `400 error-envelope.v1 invalid-action-manifest-request` |
| `pnpm --silent symphony actions manifest --goal ../repo --json` | Exit `64`; returned safe-ref usage error |
| `pnpm check` | Exit `0` |
| `pnpm test` | Exit `0`; 779 tests passed |
| `pnpm workbench:build` | Exit `0`; Vite build completed |
| `git diff --check` | Exit `0` |
| `pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json` | Exit `0`; task-1 still planned because worker evidence has not been registered yet |

## App/Workbench User Path Changed

Workbench can now fetch `GET /api/actions/manifest` and receive a validated `action-manifest.v1` payload. The route smoke suite includes this path and validates that action execution remains unavailable.

The CLI path `symphony actions manifest --json` returns the same contract family for scripts and operator checks.

## Boundary Notes

- No action execution was added.
- No job queue was created.
- No action preview API was implemented beyond declaring preview contract refs.
- No Workbench action panel binding was added.
- No shell runner, browser terminal, arbitrary command input, arbitrary path read, model invocation, merge, push, tag, publish, self-approval, reviewer verdict, main verification, release gate, or release-ready path was added.
- State changes still come only from existing explicit backend events and command outputs.

## Known Limitations / Next Task Handoff

- task-2 should implement the availability resolver behind `action-availability.v1`.
- task-3 should implement the read-only action preview API.
- task-4 should bind the Workbench action panel to the manifest and availability/preview contracts.
