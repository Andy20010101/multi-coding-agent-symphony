# v34 task-3 worker evidence

## Scope

- Goal: `v34-action-registry-workspace`
- Task: `task-3`
- Role: worker
- Branch: `v34-task-3-action-preview-api`
- Baseline before task: `ba4f8e8 Add v34 task2 main verification evidence`

## Implementation

- Added `action-preview.v1` in `src/symphony/action-preview.js`.
- Added fixture `fixtures/contracts/action-preview.v1.json`.
- Added CLI command:
  - `symphony actions preview --goal <goal-id> --task <task-id> --action <action-id> --json`
- Added Workbench sidecar route:
  - `GET /api/actions/preview`
  - `GET /api/actions/preview?goal=<goal-id>&task=<task-id>&action=<action-id>`
- Updated Workbench read-only API registry and route/static tests for `/api/actions/preview`.
- Updated product contract docs and operator guide to replace the old available-actions placeholder with the implemented preview contract.
- Rebuilt Workbench static assets:
  - removed `src/symphony/workbench-static/assets/index-Bl4TwnD_.js`
  - added `src/symphony/workbench-static/assets/index-D2mRBAIc.js`

## Behavior

- Preview is read-only and derives from `action-availability.v1`, which derives from `action-manifest.v1`, `goal-progress-ledger.v1`, and `goal-next-action.v1`.
- Preview returns action state, capability preview contract, required confirmation contract, required inputs, plan-hash requirement, impact preview, endpoint safety, blockers, and no-write boundaries.
- Preview does not execute actions, create jobs, invoke models, append goal events, read evidence bodies, read arbitrary paths, merge, push, tag, publish, or self-approve.
- `action` query/CLI input filters declared action ids only and is validated as a safe action id.

## Commands

- `node --check src/symphony/action-preview.js && node --check scripts/symphony.js && node --check src/symphony/console.js`
  - Result: passed.
- `node --test tests/v34-action-manifest.test.js`
  - Result: passed, 11 tests.
- `node --test tests/workbench-route-smoke.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js`
  - Result: passed, 81 tests.
- `pnpm --silent symphony actions preview --goal v34-action-registry-workspace --task task-3 --action goal.worker-evidence.record --json | node -e "..."`
  - Result: passed.
  - Observed: `action-preview.v1 task-3 goal.worker-evidence.record available true`.
- `pnpm check`
  - Result: passed.
- `pnpm test`
  - Result: passed, 787 tests, 122 suites.
- `pnpm workbench:build`
  - Result: passed.
- `git diff --check`
  - Result: passed.
- `pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json`
  - Result: passed.
  - Observed task-3 status before worker evidence registration: `planned`.

## App/Workbench user path

The Workbench API registry now includes `GET /api/actions/preview` as a read-only route. A user can request preview context for a specific active goal/task/action and see required confirmations and impact without starting execution or writing goal state.

## Handoff

Task-3 is ready for independent review. The reviewer should check that `action-preview.v1` stays a preview-only surface, that `/api/actions/preview` accepts only `goal`, `task`, and `action`, and that all execution/write boundaries remain false.
