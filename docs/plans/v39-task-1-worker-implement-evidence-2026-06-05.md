# v39 task-1 worker implement evidence

Goal id: `v39-backup-diagnostics-migration-workspace`  
Task id: `task-1`  
Role: `worker`  
Phase: `implement`  
Branch: `v39-task-1-app-data-inventory`  
Worktree: `/Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony`

## Reconciliation

Root ledger command:

`pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json`

Result: exit 0. The next durable action is task-1, role `worker`, phase `implement`, because the latest worker self-check failed.

The v39 runbook scope for task-1 is App data inventory: list registry, snapshots, job state, artifact index, settings, provider profiles, and evidence refs. The worker worktree is on `v39-task-1-app-data-inventory` at `036d2f6694f62960b1b05dbca04dd0c17699fb6d`.

## Implementation update

The previous failure was partly environmental: the worker worktree had no local `node_modules`, so `pnpm test` could not load packages such as `fast-check` and `react`, and `pnpm workbench:build` could not find Vite.

Dependencies were installed in the worker worktree with the existing lockfile:

`pnpm install --frozen-lockfile`

Result: exit 0. The lockfile was up to date. Installed declared dependencies and dev dependencies, including `react`, `react-dom`, `fast-check`, `vite`, and `@vitejs/plugin-react`.

After dependency recovery, the full test suite exposed one task-1 contract mismatch: the static Workbench frontend API path allowlist did not include the new approved `/api/app/data-inventory` route. `tests/workbench-shell.test.js` now includes that route in the expected read-only endpoint list. This matches the backend route, the Workbench API client route model, and the v39 data inventory tests.

`pnpm workbench:build` regenerated the tracked Workbench static output under `src/symphony/workbench-static/`.

## Files changed

- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v39-task-1-worker-evidence-2026-06-02.md`
- `docs/plans/v39-task-1-worker-revision-evidence-2026-06-05.md`
- `docs/plans/v39-task-1-worker-implement-evidence-2026-06-05.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `src/symphony/app-data-inventory.js`
- `src/symphony/console.js`
- `src/symphony/workbench-static/assets/index-BNNs3KXL.js`
- `src/symphony/workbench-static/assets/index-ChDY1mAT.js`
- `src/symphony/workbench-static/index.html`
- `tests/v39-app-data-inventory.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

## Commands run

| Command | Directory | Result |
| --- | --- | --- |
| `find .. -name AGENTS.md -print` | Root checkout | Exit 0. No `AGENTS.md` file exists inside this repository or assigned worktree; repository instructions were supplied in the controller prompt. |
| `pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json` | Root checkout | Exit 0. Durable next action is task-1 worker implement. |
| `sed -n '1,260p' docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md` | Root checkout | Exit 0. Reconciled task-1 scope and acceptance. |
| `sed -n '1,220p' docs/plans/controller/subagent-result-format.md` | Root checkout | Exit 0. Reconciled required final result fields. |
| `git status --short --branch` | Worker worktree | Exit 0. Confirmed branch `v39-task-1-app-data-inventory` with task-1 working-tree changes. |
| `sed -n '1,240p' docs/plans/v39-task-1-worker-revision-evidence-2026-06-05.md` | Worker worktree | Exit 0. Confirmed previous self-check failure was dependency and local goal-state related. |
| `sed -n '1,240p' docs/plans/v39-task-1-main-verification-evidence-2026-06-05.md` | Root checkout | Exit 0. Confirmed main verification failed in the worker target due to missing dependencies and worker-local goal state. |
| `sed -n '1,240p' docs/plans/v39-task-1-worker-evidence-2026-06-02.md` | Worker worktree | Exit 0. Reconciled previous implementation scope and limitations. |
| `sed -n '1,220p' package.json` | Worker worktree | Exit 0. Confirmed required packages are declared in the repository manifest. |
| `test -d node_modules` | Worker worktree | Exit 1 before recovery. Confirmed local dependencies were absent. |
| `pnpm install --frozen-lockfile` | Worker worktree | Exit 0. Dependencies installed from the existing lockfile. |
| `pnpm check` | Worker worktree | Exit 0. Syntax check passed. |
| `pnpm test` | Worker worktree | First run exit 1 after dependency recovery. 1021 passed, 1 failed: `tests/workbench-shell.test.js` expected API path list omitted `/api/app/data-inventory`. |
| `pnpm test` | Worker worktree | Second run exit 0. 1022 tests passed, 0 failed. |
| `pnpm workbench:build` | Worker worktree | Exit 0. Vite built Workbench static assets successfully. |
| `git diff --check` | Worker worktree | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` | Root checkout | Exit 0. Root ledger contains v39 state and shows task-1 status from the latest worker self-check event. |
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` | Worker worktree | Exit 64. Worker-local managed goal state still returns `goal not found`; product validation used the worker worktree and durable state was read from the root ledger checkout. |

## Validation result

Worker self-check passed for task-1 implementation and environment recovery:

- `pnpm check`: passed in the worker worktree.
- `pnpm test`: passed in the worker worktree, 1022 tests passed.
- `pnpm workbench:build`: passed in the worker worktree.
- `git diff --check`: passed in the worker worktree.
- Durable `goal-status`: passed in the root ledger checkout.

The worker-local `.symphony` state still does not contain the v39 goal. This is a ledger-location limitation, not a task-1 product failure.

## App/Workbench user path

Workbench exposes an App Data Inventory panel in the goal support area. The panel reads `GET /api/app/data-inventory` and shows saved app data domains, source contracts, routes, item counts, safe refs, and disabled execution/write boundaries.

## Boundary notes

- The inventory remains read-only.
- The implementation does not add a generic shell runner, provider CLI execution, model invocation, arbitrary local file reading, merge, push, tag, publish, or self-approval path.
- The inventory is derived from existing backend contracts and does not replace the canonical goal/event/ArtifactStore state.
- Provider profile values remain sanitized; secret values and raw provider settings are not exposed.

## Remaining risk

The next reviewer or main verifier should continue reading durable v39 goal state from `/Users/andy/Documents/project/multi-coding-agent-symphony` unless the worker worktree is explicitly attached to the same managed goal ledger.
