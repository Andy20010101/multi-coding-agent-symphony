# v39 task-3 worker evidence

Goal id: `v39-backup-diagnostics-migration-workspace`
Task id: `task-3`
Branch: `v39-task-3-backup-export-bundle`
User-visible value: 长期使用可备份。

## Implementation summary

Implemented `app-core-backup-export.v1` as a read-only backup/export manifest for app core state. The contract lists managed `.symphony` state refs with SHA-256 hashes, ArtifactStore-derived refs, a manifest hash, and the repo content excluded from backup scope. It does not copy repo source, docs, tests, `.git`, package manifests, lockfiles, artifact payloads, or arbitrary local paths.

Added:

- Backend contract builder and validator in `src/symphony/app-core-backup-export.js`.
- CLI surface: `symphony backup export --goal <goal-id> --task <task-id> --json`.
- Workbench API route: `GET /api/backup/export`, accepting only `goal` and `task`.
- Workbench `Backup Export` panel and Desktop Shell backup readiness fields.
- Fixture and v39 task-3 tests for contract validation, route safety, CLI output, and boundary drift.
- Operator/product docs for the route, CLI, manifest fields, and exclusions.

## Files changed

- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v39-task-3-worker-evidence-2026-06-02.md`
- `fixtures/contracts/app-core-backup-export.v1.json`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `scripts/symphony.js`
- `src/symphony/app-core-backup-export.js`
- `src/symphony/console.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BQhXXbtn.js`
- `src/symphony/workbench-static/assets/index-BNNs3KXL.js` removed by `pnpm workbench:build`
- `tests/v39-backup-export-bundle.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

## Commands run with exact results

`pnpm check`

Result: passed, exit code 0.

```text
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: passed, exit code 0.

```text
tests 1022
suites 159
pass 1022
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4826.239291
```

`pnpm workbench:build`

Result: passed, exit code 0.

```text
vite v8.0.14 building client environment for production...
✓ 17 modules transformed.
✓ built in 72ms
```

`git diff --check`

Result: passed, exit code 0. No whitespace errors reported.

Final commit-range check also passed:

```text
git diff --check HEAD^ HEAD
exit code 0
```

`pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json`

Result: passed, exit code 0.

```text
contractName: goal-progress-ledger.v1
goalId: v39-backup-diagnostics-migration-workspace
summary.totalTasks: 5
summary.completedTasks: 0
summary.releaseReady: false
task-3.status: planned
task-3.statusSource: goal-runbook.v1
```

Context note: this task worktree has ignored local `.symphony` runbook state. In that local state, `goal-status` reports task-1 and task-2 as planned. The root supervisor context and root checkout ledger reported task-1 and task-2 as main-verified before this task-3 worker phase. No worker, reviewer, main-verification, or release events were registered from this task-3 worktree.

Focused checks also run:

- `pnpm exec node --test tests/v39-backup-export-bundle.test.js`: passed, 4 tests.
- `pnpm exec node --test tests/v39-backup-export-bundle.test.js tests/workbench-api-client.test.js`: passed, 53 tests.

## App/Workbench user path changed

Workbench now reads `GET /api/backup/export` through the read-only route allowlist and displays the result in `Backup Export`. Operators can see the manifest hash, managed state entry count, ArtifactStore ref count, included byte count, managed state refs, and excluded repo content policy.

Desktop Shell artifact readiness now carries backup export state, manifest hash, managed state entry count, artifact ref count, and repo content policy from the same backend contract.

CLI users can run:

```sh
pnpm --silent symphony backup export --goal v39-backup-diagnostics-migration-workspace --task task-3 --json
```

The CLI writes only to stdout and rejects `--output`.

## Boundary notes

- UI does not execute shell commands.
- UI consumes backend contract data only.
- No generic shell runner, browser terminal, arbitrary model invocation, arbitrary local path read, artifact download, local file opener, auto merge, auto tag, auto push, or publish path was added.
- Status is not inferred from branch name, filename, commit message, prompt text, task title, or frontend state.
- The backup export manifest hashes managed app state and lists refs; it does not copy repo content or artifact payloads.
- No reviewer approval, main verification, release gate, or release-ready state is claimed or registered.

## Known limitations / next task handoff

This task provides manifest/hash/ref visibility only. It does not create a persistent archive file or restore anything. Task-4 can build diagnostics on top of the same managed state and boundary fields. Task-5 should validate restore compatibility without overwriting by default.
