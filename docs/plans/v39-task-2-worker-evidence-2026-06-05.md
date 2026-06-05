# v39 task-2 worker evidence

Goal id: `v39-backup-diagnostics-migration-workspace`
Task id: `task-2`
Branch: `v39-task-2-schema-version-migration-runner`
Worktree: `/Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner`
User-visible value: 升级不会靠猜。

## Implementation summary

Implemented `app-schema-migration.v1` as the v39 schema version and migration dry-run preview contract. The contract reports `appData.schemaVersion` current and target versions, affected app data areas, pending migration steps, confirmation action id, plan hash requirement, and locked boundaries. Preview paths do not write app data.

Added `symphony app-data migration --json` and `GET /api/app-data/migration`. Both return the same dry-run preview and reject output/write/confirm probes. The Workbench now fetches the route and renders a Schema Migration Preview panel with schema version, dry-run status, affected app data, migration steps, confirmation fields, and boundaries.

## Files changed

- `README.md`
- `docs/plans/v39-task-2-worker-evidence-2026-06-05.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `fixtures/contracts/app-schema-migration.v1.json`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `scripts/symphony.js`
- `src/symphony/app-schema-migration.js`
- `src/symphony/console.js`
- `src/symphony/workbench-static/assets/index-3NTVLoEr.js`
- `src/symphony/workbench-static/assets/index-BNNs3KXL.js`
- `src/symphony/workbench-static/index.html`
- `tests/v39-schema-migration-runner.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

## Commands run

| Command | Result |
|---|---|
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` from root checkout before edits | Exit 0. `task-2` was `planned`; task-1 was `main-verified`; no worker evidence for task-2. |
| `pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json` from root checkout before edits | Exit 0. Next action was `task-2`, role `worker`, phase `implement`. |
| `node --test tests/v39-schema-migration-runner.test.js` | Exit 0. 5 tests passed. |
| `node --test tests/workbench-api-client.test.js tests/v39-schema-migration-runner.test.js` | Exit 0. 55 tests passed. |
| `pnpm check` before dependency install | Exit 0. Syntax check passed. |
| `pnpm test` before dependency install | Exit 1. Failed because the fresh worktree had no `node_modules`; `fast-check` and `react` imports were missing. |
| `pnpm install --frozen-lockfile` | Exit 0. Installed dependencies from the existing lockfile; no lockfile update. |
| `pnpm check` after dependency install | Exit 0. Syntax check passed. |
| `pnpm test` after dependency install, first rerun | Exit 1. One static frontend API allowlist test needed the new fixed GET path `/api/app-data/migration`. |
| `pnpm test` after allowlist update | Exit 0. 1024 tests passed. |
| `pnpm workbench:build` | Exit 0. Vite build completed and refreshed `src/symphony/workbench-static/`. |
| `git diff --check` before evidence file | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` from worker worktree | Exit 64. The isolated worktree has no managed `.symphony` goal state, so the CLI returned `goal not found`. |
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --state-dir /Users/andy/Documents/project/multi-coding-agent-symphony/.symphony --json` from worker worktree | Exit 0. `task-2` remained `planned`; task-1 remained `main-verified`; no worker evidence was registered. |

## App / Workbench user path changed

Workbench reads `/api/app-data/migration` through the existing read-only API route list. The new Schema Migration Preview panel appears in the active goal supporting contracts area and shows:

- current schema version and target schema version
- dry-run status and whether writes were attempted
- affected app data areas from the v39 inventory
- migration steps that are pending explicit confirm
- confirmation action id and confirmation contract
- browser confirm disabled and write/execution boundaries locked

## Boundary notes

- UI does not execute shell commands.
- UI does not invoke models or provider CLIs.
- UI does not open arbitrary local files or read arbitrary paths.
- Dry-run preview does not write app data.
- Migration confirm is named as a required confirmation contract but is not executed by this task.
- No reviewer verdict, main verification, release gate, tag, push, or release-ready event was registered.

## Known limitations / next task handoff

- The task implements the schema version and migration preview surface. It does not implement a durable app data store write path or confirm executor.
- The isolated worktree does not contain the root checkout `.symphony` state. Goal status can be read from the worker worktree only by passing the root `--state-dir`, or by running the exact command from the root checkout.
- Task-3 can consume `app-schema-migration.v1` as the schema/migration preview source when building the backup/export bundle.
