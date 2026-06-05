# v39 task-5 worker evidence

Goal id: `v39-backup-diagnostics-migration-workspace`
Task id: `task-5`
Branch: `v39-task-5-restore-validation`
User-visible value: 恢复路径安全可验证。

## Implementation summary

Implemented `app-core-restore-validation.v1` as a read-only restore validation contract. The contract validates the task-3 backup export manifest shape, SHA-256 integrity fields, safe managed state refs, artifact ref hashes, and compatible restore path. It defaults to validation-only mode and does not overwrite existing app state.

Added:

- Backend contract builder and validator in `src/symphony/app-core-restore-validation.js`.
- CLI surface: `symphony restore validate --goal <goal-id> --task <task-id> --json`.
- Workbench API route: `GET /api/restore/validate`, accepting only `goal` and `task`.
- Workbench `Restore Validation` panel and Desktop Shell restore readiness fields.
- Fixture and v39 task-5 tests for contract validation, route safety, CLI output, and no-overwrite boundary drift.
- Operator/product docs for the route, CLI, validation fields, and disabled restore apply path.

## Files changed

- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v39-task-5-worker-evidence-2026-06-02.md`
- `fixtures/contracts/app-core-restore-validation.v1.json`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `scripts/symphony.js`
- `src/symphony/app-core-restore-validation.js`
- `src/symphony/console.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-dnBmRrsG.js`
- `src/symphony/workbench-static/assets/index-MRhrrIIw.js` removed by `pnpm workbench:build`
- `tests/v39-restore-validation.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

## Commands run with exact results

`pnpm install --frozen-lockfile`

Result: passed, exit code 0. Installed workspace dependencies from the existing lockfile because `node_modules` was missing; no lockfile change was made.

`node --test tests/v39-restore-validation.test.js`

Result: passed, exit code 0.

```text
tests 4
suites 1
pass 4
fail 0
duration_ms 144.293333
```

`node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`

Result: passed, exit code 0 after updating the approved read-only endpoint list.

```text
tests 77
suites 3
pass 77
fail 0
duration_ms 705.84875
```

`pnpm check`

Result: passed, exit code 0.

```text
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: passed, exit code 0.

```text
tests 1030
suites 161
pass 1030
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 7513.762458
```

`pnpm workbench:build`

Result: passed, exit code 0.

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                     0.42 kB
src/symphony/workbench-static/assets/index-CILC3208.css     36.97 kB
src/symphony/workbench-static/assets/index-dnBmRrsG.js   1,283.61 kB
built in 81ms
```

`git diff --check`

Result: passed, exit code 0. No whitespace errors reported.

`pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json`

Result in the task-5 implementation worktree: failed, exit code 64.

```text
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

Context: this task worktree has no ignored managed `.symphony` goal state. The same command from the root checkout with authoritative managed state passed, exit code 0:

```text
contractName: goal-progress-ledger.v1
goalId: v39-backup-diagnostics-migration-workspace
summary.totalTasks: 5
summary.completedTasks: 4
summary.releaseReady: false
task-1.status: main-verified
task-2.status: main-verified
task-3.status: main-verified
task-4.status: main-verified
task-5.status: planned
task-5.workerEvidenceRef: null
nextActions[0].label: Start task-5
```

Focused restore validation smoke:

`pnpm --silent symphony restore validate --goal v39-backup-diagnostics-migration-workspace --task task-5 --json`

Result: passed, exit code 0.

```text
contractName: app-core-restore-validation.v1
status: warning
integrity.status: warning
compatibility.status: compatible-with-warnings
compatibility.overwriteDefault: false
boundaries.validationOnly: true
boundaries.confirmRestoreAvailable: false
boundaries.overwritesExistingData: false
boundaries.appliesRestore: false
```

The warning is expected in this clean task worktree because managed `.symphony` state refs are absent. It does not add a blocker; it records that a future apply path would need an explicit recovery plan for missing managed state refs.

## App/Workbench user path changed

Workbench now reads `GET /api/restore/validate` through the read-only route allowlist and displays the result in `Restore Validation`. Operators can see validation status, source backup manifest hash, integrity checks, compatibility status, overwrite default, blockers, warnings, and disabled restore-apply boundaries.

Desktop Shell artifact readiness now carries restore validation state, restore status, integrity status, compatibility status, and overwrite default from the same backend contract.

CLI users can run:

```sh
pnpm --silent symphony restore validate --goal v39-backup-diagnostics-migration-workspace --task task-5 --json
```

The CLI writes only to stdout and rejects `--output`, `--apply`, `--confirm`, and `--overwrite`.

## Boundary notes

- UI does not execute shell commands.
- UI consumes backend contract data only.
- No restore apply route, overwrite route, confirm route, generic shell runner, browser terminal, arbitrary model invocation, arbitrary bundle path read, artifact download, local file opener, auto merge, auto tag, auto push, or publish path was added.
- Status comes from explicit backend contracts and validation checks, not branch name, filename, commit message, prompt text, task title, or frontend state.
- The restore validation contract validates manifest/hash/ref compatibility only; it does not copy repo content, artifact payloads, raw logs, or managed state bodies.
- No reviewer approval, main verification, release gate, or release-ready state is claimed or registered.

## Known limitations / next task handoff

This task validates restore integrity and compatibility only. It does not implement restore apply, overwrite confirmation, or persistent bundle import. Any future apply path should require a separate explicit plan, confirm step, and recovery evidence for missing managed state refs.
