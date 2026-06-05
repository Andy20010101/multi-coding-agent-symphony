# v39 task-4 worker evidence

Goal id: `v39-backup-diagnostics-migration-workspace`
Task id: `task-4`
Branch: `v39-task-4-diagnostics-bundle`
User-visible value: 坏了能定位。

## Implementation summary

Implemented `app-core-diagnostics-bundle.v1` as a read-only diagnostics bundle for app core triage. The bundle reports sanitized health, runtime/kernel/node versions, recent failures from explicit backend events or managed run state, gate status from `goal-progress-ledger.v1`, and structured log refs. It does not copy raw log bodies, secret values, repo source, artifact payloads, or arbitrary local paths.

Added:

- Backend contract builder and validator in `src/symphony/app-core-diagnostics-bundle.js`.
- CLI surface: `symphony diagnostics bundle --goal <goal-id> --task <task-id> --json`.
- Workbench API route: `GET /api/diagnostics/bundle`, accepting only `goal` and `task`.
- Workbench `Diagnostics Bundle` panel and Desktop Shell diagnostics readiness fields.
- Fixture and v39 task-4 tests for contract validation, route safety, CLI output, redaction, and boundary drift.
- Operator/product docs for the route, CLI, contract fields, and exclusions.

## Files changed

- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v39-task-4-worker-evidence-2026-06-02.md`
- `fixtures/contracts/app-core-diagnostics-bundle.v1.json`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `scripts/symphony.js`
- `src/symphony/app-core-diagnostics-bundle.js`
- `src/symphony/console.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-MRhrrIIw.js`
- `src/symphony/workbench-static/assets/index-BQhXXbtn.js` removed by `pnpm workbench:build`
- `tests/v39-diagnostics-bundle.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`

## Commands run with exact results

`node --test tests/v39-diagnostics-bundle.test.js`

Result: passed, exit code 0.

```text
tests 4
suites 1
pass 4
fail 0
duration_ms 103.338208
```

`node --test tests/v39-diagnostics-bundle.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js`

Result: passed, exit code 0.

```text
tests 81
suites 4
pass 81
fail 0
duration_ms 745.51475
```

`pnpm check`

Result: passed, exit code 0.

```text
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: passed, exit code 0. Rerun from `/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle` on 2026-06-05 also passed.

```text
tests 1026
suites 160
pass 1026
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 7097.189625
```

`pnpm workbench:build`

Result: passed, exit code 0. Rerun from `/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle` on 2026-06-05 passed without sandbox escalation.

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                     0.42 kB
src/symphony/workbench-static/assets/index-CILC3208.css     36.97 kB
src/symphony/workbench-static/assets/index-MRhrrIIw.js   1,272.31 kB
built in 106ms
```

`git diff --check`

Result: passed, exit code 0. No whitespace errors reported.

`pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json`

Result in the task-4 implementation worktree: failed, exit code 64.

```text
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

Context: the new task-4 worktree has no ignored managed `.symphony` goal state. The command does not accept `--state-dir`.

Same command from the root checkout with the authoritative managed state: passed, exit code 0.

```text
contractName: goal-progress-ledger.v1
goalId: v39-backup-diagnostics-migration-workspace
summary.totalTasks: 5
summary.completedTasks: 3
summary.releaseReady: false
task-1.status: main-verified
task-2.status: main-verified
task-3.status: main-verified
task-4.status: planned
task-4.workerEvidenceRef: null
nextActions[0].label: Start task-4
```

Same command from the task-3 worktree state: passed, exit code 0, but that ignored local state still showed all v39 tasks as `planned`. The root checkout state matched the supervisor context for task-3 completion.

## App/Workbench user path changed

Workbench now reads `GET /api/diagnostics/bundle` through the read-only route allowlist and displays the result in `Diagnostics Bundle`. Operators can see health status, runtime/kernel/node versions, diagnostics check counts, gate status, recent failure summaries, and structured log refs.

Desktop Shell artifact readiness now carries diagnostics bundle state, diagnostics health, recent failure count, and log ref count from the same backend contract.

CLI users can run:

```sh
pnpm --silent symphony diagnostics bundle --goal v39-backup-diagnostics-migration-workspace --task task-4 --json
```

The CLI writes only to stdout and rejects `--output`.

## Boundary notes

- UI does not execute shell commands.
- UI consumes backend contract data only.
- No generic shell runner, browser terminal, arbitrary model invocation, arbitrary local path read, raw log body copy, secret-value display, local file opener, auto merge, auto tag, auto push, or publish path was added.
- Status comes from explicit backend contracts and goal events, not branch name, filename, commit message, prompt text, task title, or frontend state.
- The diagnostics bundle redacts secret/path-bearing failure text and exposes log refs only.
- No reviewer approval, main verification, release gate, or release-ready state is claimed or registered.

## Known limitations / next task handoff

The diagnostics bundle reports health/failure/gate/log-ref state. It does not validate or restore a backup/export bundle. Task-5 should use the backup export manifest and diagnostics boundaries to validate restore compatibility without overwriting by default.
