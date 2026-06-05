# v39 task-1 worker evidence

Goal id: `v39-backup-diagnostics-migration-workspace`  
Task id: `task-1`  
Branch: `v39-task-1-app-data-inventory`  
User-visible value: 知道 app 到底保存了什么。

## Implementation summary

Added `app-data-inventory.v1` as a read-only App/Workbench inventory over existing backend contracts. The inventory lists project registry, runtime snapshots, job state, artifact index, settings pointers, sanitized provider profiles, and evidence refs with owning route, contract, storage role, canonical source, item count, safe refs, and boundary flags.

Workbench now fetches `GET /api/app/data-inventory` through the approved read-only route list and renders the App Data Inventory panel in the main goal support area.

## Files changed

- `src/symphony/app-data-inventory.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/v39-app-data-inventory.test.js`
- `tests/workbench-api-client.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `README.md`
- `docs/plans/v39-task-1-worker-evidence-2026-06-02.md`

## Commands run

`pnpm check`

Result: passed.

`pnpm test -- tests/v39-app-data-inventory.test.js`

Result: passed. 4 tests passed.

`pnpm test`

Result: failed because this worktree does not have required local dependencies installed. The implementation-specific v39 suite passed inside the full run. Reported missing packages included `fast-check` for property tests and `react` for `tests/workbench-shell.test.js`.

`pnpm test -- tests/v39-app-data-inventory.test.js tests/workbench-api-client.test.js`

Result: passed. 53 tests passed.

`pnpm workbench:build`

Result: failed before build because `vite` is not installed in this worktree. Output included `sh: vite: command not found` and `node_modules missing`.

`git diff --check`

Result: passed.

`pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json`

Result: controlled JSON error. The worktree-local managed goal state does not contain this goal.

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

## App/Workbench user path changed

Open Workbench and use the main goal support area. The App Data Inventory panel reads `GET /api/app/data-inventory` and shows the saved app data domains, their backend source contracts, routes, item counts, refs, and disabled write/execution boundaries.

The same route accepts only optional `goal` and `task` query parameters. Mutation requests, unsupported query fields, and unsafe goal/task refs return `error-envelope.v1`.

## Boundary notes

- The inventory is read-only and uses existing contracts as sources.
- It does not create a second canonical store.
- It does not execute shell commands, invoke models, mutate jobs, open local files, read arbitrary paths, download artifacts, read evidence bodies, expose secret values, write git state, self-approve, pass main verification, or declare release readiness.
- ArtifactStore remains canonical for artifacts; the artifact index remains a derived cache/search surface.
- Provider profile data remains sanitized and does not include secret values.

## Known limitations / next task handoff

- Full `pnpm test` and `pnpm workbench:build` require installing the repo’s frontend/property-test dependencies in this worktree.
- The local `.symphony` state in this worktree has not registered `v39-backup-diagnostics-migration-workspace`, so `goal-status` returns `goal not found`.
- Task-2 can build schema version and migration preview on top of the inventory domains exposed here.
