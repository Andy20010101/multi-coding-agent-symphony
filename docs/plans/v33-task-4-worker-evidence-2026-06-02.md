# v33 task-4 worker evidence

Date: 2026-06-02

Goal id: `v33-app-runtime-foundation`
Task id: `task-4`
Release name: `v33 App Runtime Foundation`
Baseline: `v32 Release Manager Workspace v2`

## User-visible value

CLI and Workbench now consume the same `app-state-snapshot.v1` schema. Workbench has a read-only Runtime surface that shows runtime health, current project, active goal, current task, next action, release state, known blockers, freshness, and explicit no-execution boundaries from `GET /api/runtime/snapshot`.

## Implementation summary

- Added `freshness` to `app-state-snapshot.v1` so current/stale state comes from the backend contract, not frontend inference.
- Added contract fixtures for healthy, missing project, missing goal, blocked, and stale runtime snapshots.
- Added Workbench route consumption for `GET /api/runtime/snapshot`.
- Added `RuntimeSnapshotPanel` to `/workbench/`, before the active-goal workflow, rendering runtime health, current project, active goal/current task, next action, release state, known blockers, and read-only boundaries.
- Updated Workbench API projection tests and SSR shell tests for the new Runtime route and panel.
- Updated README, operator guide, and product contract notes for the shared CLI/Workbench runtime snapshot schema.
- Rebuilt static Workbench assets with `pnpm workbench:build`.

## Files changed

- `src/symphony/app-state-snapshot.js`
- `fixtures/contracts/app-state-snapshot.v1.json`
- `fixtures/contracts/app-state-snapshot.healthy.v1.json`
- `fixtures/contracts/app-state-snapshot.missing-project.v1.json`
- `fixtures/contracts/app-state-snapshot.missing-goal.v1.json`
- `fixtures/contracts/app-state-snapshot.blocked.v1.json`
- `fixtures/contracts/app-state-snapshot.stale.v1.json`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/v33-app-state-snapshot.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CkJzWTCM.js`
- `src/symphony/workbench-static/assets/index-BDjDodcJ.js` was removed by the Workbench rebuild and replaced by the new hashed bundle.
- `README.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`

## Workbench user path changed

Open `/workbench/`. The first home-page runtime section is now `App Runtime Snapshot`, rendered from `GET /api/runtime/snapshot`. It shows:

- freshness: `current` or `stale`
- runtime health: status, mode, runtime version, kernel, cwd, repo path
- current project: resolver status, project id/name, repo path, default branch, last goal, last run
- active goal/current task: goal id, title, task id/status, role/phase, blocked flag
- next action: status, reason, copy-only commands, registration target
- release state: release-ready flag/source and missing or unknown release gates
- known blockers and read-only boundaries

The panel has no execution buttons, shell runner, model invocation, git writes, release writes, local-file open, or artifact download path.

## Contract and fixture states covered

- Healthy: `fixtures/contracts/app-state-snapshot.healthy.v1.json`
- Missing project: `fixtures/contracts/app-state-snapshot.missing-project.v1.json`
- Missing goal: `fixtures/contracts/app-state-snapshot.missing-goal.v1.json`
- Blocked: `fixtures/contracts/app-state-snapshot.blocked.v1.json`
- Stale: `fixtures/contracts/app-state-snapshot.stale.v1.json`

Automated coverage:

- `tests/v33-app-state-snapshot.test.js` validates all five fixtures and verifies stale snapshots are marked through the backend contract.
- `tests/workbench-api-client.test.js` projects all five fixture states through the Workbench model.
- `tests/workbench-shell.test.js` verifies the Runtime panel renders as a read-only Workbench surface and that `/api/runtime/snapshot` is in the approved frontend API path set.

## Commands run

Boundary inspection:

- `git status -sb --untracked-files=all` exited 0. Current checkout was `v33-task-1-local-sidecar-health-api` and already dirty with staged/unstaged v33 task files plus untracked task-2/task-3 files.
- `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` exited 0. Summary: total tasks 5, completed tasks 3, blocked tasks 0, releaseReady false; task-4 status `planned`, workerEvidenceRef null.
- `pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json` exited 0. Result: action required for task-4 worker because no task-4 worker evidence is recorded.

Focused validation:

- `pnpm test tests/v33-app-state-snapshot.test.js` exited 0. Result: 7 tests passed, 0 failed.
- `pnpm test tests/workbench-api-client.test.js` exited 0. Result: 45 tests passed, 0 failed.
- `pnpm test tests/workbench-shell.test.js` exited 0. Result: 25 tests passed, 0 failed.
- `pnpm --silent symphony runtime snapshot --json` exited 0. Result: `app-state-snapshot.v1`, `freshness.status=current`, current project resolved to this repo, active goal `v33-app-runtime-foundation`, current task `task-4`, release ready false, known blockers included `release-ready-not-declared`, all write/execution boundaries false.

Required validation:

- `pnpm check` exited 0.
- `pnpm test` exited 0. Result: 776 tests passed, 0 failed.
- `pnpm workbench:build` exited 0. Result: Vite built `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-CkJzWTCM.js`.
- `git diff --check` exited 0 with no output.
- `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` exited 0. Result: total tasks 5, completed tasks 3, blocked tasks 0, releaseReady false; task-4 remained `planned` with `workerEvidenceRef: null`.

## Boundary notes

- Current-checkout fallback used: the repo was already dirty on `v33-task-1-local-sidecar-health-api`, with prior v33 task files staged, modified, and untracked. Branch checkout was unsafe, so implementation stayed in the current checkout.
- No staging, commit, merge, pull, push, tag, stash, reset, or revert was performed.
- Existing prior-task files were not reverted or unstaged.
- The UI consumes `GET /api/runtime/snapshot`; it does not execute shell commands directly.
- The CLI and UI share `app-state-snapshot.v1`; Workbench state classification uses backend fields, including `freshness.status`.
- No Action Registry execution, Job Queue, Desktop Shell, Provider Hub, model invocation, secret storage, backup/restore, budget tracking, generic shell runner, browser terminal, command DSL, permission system, local file open, artifact download, git write, release write, or top-level v8 compatibility command buttons were added.
- Worker did not register `goal update`, `goal review`, `goal gate`, or release closeout events.
- Worker did not claim reviewer approval, main verification, release readiness, or release completion.
