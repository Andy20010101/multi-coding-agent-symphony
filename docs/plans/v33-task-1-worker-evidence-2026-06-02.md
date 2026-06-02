# v33 task-1 worker evidence

Goal id: `v33-app-runtime-foundation`
Task id: `task-1`
Branch: `v33-task-1-local-sidecar-health-api`

## User-visible value

Users can confirm the local app runtime is alive through `symphony runtime health --json` or `GET /api/health`. The response shows the runtime version, v32 workflow kernel source, process id, cwd/repo path, startup time, read-only mode, boundary flags, and known blockers.

## Implementation summary

- Added `local-runtime-health.v1` as the v33 sidecar health contract.
- Replaced the old two-field `/api/health` placeholder with the full read-only health response.
- Added `symphony runtime health --json` for terminal consumers.
- Added a contract fixture and automated tests for contract validation, CLI output, read-only filesystem behavior, API output, POST rejection, and query rejection.
- Documented the health command and API in the product contract, operator guide, and README.

## Files changed

- `src/symphony/local-runtime-health.js`
- `src/symphony/console.js`
- `scripts/symphony.js`
- `fixtures/contracts/local-runtime-health.v1.json`
- `tests/v33-local-runtime-health.test.js`
- `tests/symphony-cli.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `README.md`

Pre-existing untracked v33 plan/runbook files were present before implementation. I read them as task context and did not register a goal event.

## Commands run with exact results

| Command | Result |
| --- | --- |
| `git branch --show-current` | Exit 0. Output: `v33-task-1-local-sidecar-health-api`. |
| `node --check src/symphony/local-runtime-health.js && node --check scripts/symphony.js && node --check tests/v33-local-runtime-health.test.js` | Exit 0. Syntax check passed for the new runtime health module, CLI entrypoint, and focused test. |
| `node --test tests/v33-local-runtime-health.test.js` | First run exited 1 because the CLI test compared `/var/...` to macOS realpath `/private/var/...`. Test was fixed to compare real paths. Final focused run exited 0 with 4 tests passing. |
| `node --test tests/symphony-cli.test.js` | Exit 0. 52 tests passed after updating the legacy `/api/health` assertion to validate `local-runtime-health.v1`. |
| `pnpm check` | Exit 0. `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`. |
| `pnpm test` | Exit 0. `node --test --test-concurrency=8`; 763 tests, 117 suites, 763 pass, 0 fail. |
| `pnpm workbench:build` | Exit 0. Vite `v8.0.14`; 17 modules transformed; built `src/symphony/workbench-static/index.html` 0.42 kB gzip 0.27 kB, `assets/index-BY5UaxlX.css` 22.14 kB gzip 3.82 kB, `assets/index-BDjDodcJ.js` 1,115.78 kB gzip 198.88 kB; built in 63 ms. |
| `git diff --check` | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` | Exit 0. Returned `goal-progress-ledger.v1`; `summary.totalTasks: 5`, `summary.completedTasks: 0`, `summary.releaseReady: false`; task-1 status `planned`, statusSource `goal-runbook.v1`, branch `v33-task-1-local-sidecar-health-api`, workerEvidenceRef `null`; release gates all `unknown`. |
| `pnpm --silent symphony runtime health --json` | Exit 0. Returned `local-runtime-health.v1`; status `ok`, runtime version `v33-app-runtime-foundation.1`, kernel version `v32-release-manager-workspace-v2`, cwd and repoPath `/Users/andy/Documents/project/multi-coding-agent-symphony`, `readOnly: true`, all execution/write/model/job boundary flags false, `knownBlockers: []`. |

## Runtime health command/API result

`pnpm --silent symphony runtime health --json` returned:

```json
{
  "contractName": "local-runtime-health.v1",
  "contractVersion": 1,
  "status": "ok",
  "readOnly": true,
  "mode": "read-only",
  "runtime": {
    "name": "symphony-local-sidecar",
    "version": "v33-app-runtime-foundation.1",
    "releaseName": "v33 App Runtime Foundation"
  },
  "kernel": {
    "version": "v32-release-manager-workspace-v2",
    "source": "v32 Release Manager Workspace v2"
  },
  "process": {
    "cwd": "/Users/andy/Documents/project/multi-coding-agent-symphony",
    "repoPath": "/Users/andy/Documents/project/multi-coding-agent-symphony"
  },
  "boundaries": {
    "readOnly": true,
    "actionExecutionAvailable": false,
    "jobQueueAvailable": false,
    "modelInvocationAvailable": false,
    "gitWriteAvailable": false,
    "releaseWriteAvailable": false,
    "arbitraryCommandExecutionAvailable": false
  },
  "knownBlockers": []
}
```

The API route `GET /api/health` is backed by the same builder. Tests verify that it returns `local-runtime-health.v1`, rejects POST with `405` and `error-envelope.v1`, rejects query parameters with `invalid-health-request`, and does not write repository state.

## Revision after review

Reviewer thread: `019e85fd-4cfa-74d2-aa43-9a4e336623ca`
Reviewer evidence: `docs/plans/v33-task-1-review-evidence-2026-06-02.md`
Reviewer verdict: `NEEDS_REVISION`

The reviewer accepted the health implementation and found no health-path command/model/git/release execution. The blocking finding was diff basis only: the task branch was behind current `main`, and `git diff main` showed unrelated release documentation rollback in `README.md`, `docs/symphony-product-contracts.md`, `docs/workbench-operator-guide.md`, and `docs/plans/v28-release-evidence-2026-05-29.md`.

Revision action:

- Used current checkout fallback instead of rebasing or recreating the branch.
- Restored `README.md`, `docs/symphony-product-contracts.md`, `docs/workbench-operator-guide.md`, and `docs/plans/v28-release-evidence-2026-05-29.md` to current `main` content.
- Reapplied only the v33 health additions to README, product contracts, and operator guide.
- Left `docs/plans/v28-release-evidence-2026-05-29.md` matching current `main`; it no longer appears in `git diff --name-status main`.
- Staged the task files so the required `git diff --name-status main` includes new v33 files that were previously untracked.

Exact changed files after cleanup from `git diff --name-status main`:

```text
M	README.md
A	docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md
A	docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md
A	docs/plans/v33-task-1-review-evidence-2026-06-02.md
A	docs/plans/v33-task-1-worker-evidence-2026-06-02.md
A	docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
A	docs/plans/workbench-v33-v40-app-runtime-runbooks/README_HOW_TO_START.md
A	docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
M	docs/symphony-product-contracts.md
M	docs/workbench-operator-guide.md
A	fixtures/contracts/goal-runbook.v33-app-runtime-foundation.v1.json
A	fixtures/contracts/local-runtime-health.v1.json
M	scripts/symphony.js
M	src/symphony/console.js
A	src/symphony/local-runtime-health.js
M	tests/symphony-cli.test.js
A	tests/v33-local-runtime-health.test.js
```

`docs/plans/v28-release-evidence-2026-05-29.md` is staged as branch-base cleanup relative to the old task branch, but it is identical to current `main` and is absent from `git diff --name-status main`.

Fresh revision validation:

| Command | Result |
| --- | --- |
| `git diff --name-status main` | Exit 0. Output exactly the changed-file list above; no unrelated v28/v32 release documentation rollback appears. |
| `git diff --check` | Exit 0. No output. |
| `pnpm check` | Exit 0. `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`. |
| `pnpm test` | Exit 0. `node --test --test-concurrency=8`; 763 tests, 117 suites, 763 pass, 0 fail, duration 7273.628417 ms. |
| `pnpm workbench:build` | Exit 0. Vite `v8.0.14`; 17 modules transformed; built `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-BDjDodcJ.js`; built in 62 ms. |
| `pnpm --silent symphony runtime health --json` | Exit 0. Returned `local-runtime-health.v1`; status `ok`; runtime version `v33-app-runtime-foundation.1`; kernel version `v32-release-manager-workspace-v2`; cwd/repoPath `/Users/andy/Documents/project/multi-coding-agent-symphony`; `readOnly: true`; all execution/write/model/job boundary flags false; `knownBlockers: []`. |
| `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` | Exit 0. Returned `goal-progress-ledger.v1`; `summary.totalTasks: 5`; `summary.completedTasks: 0`; `summary.needsRevisionTasks: 1`; `summary.releaseReady: false`; task-1 status `needs-revision`, statusSource `goal-event-log.v1:evt_8c99d8086dee3037`, workerEvidenceRef this file, reviewEvidenceRef reviewer evidence, reviewVerdict `NEEDS_REVISION`. This is expected until the coordinator records the revision worker event. |

Diff-basis cleanup result:

- Supersedes the reviewer blocker.
- Reason: the required comparison `git diff --name-status main` now contains only v33 task-1 health code/tests/docs plus v33 plan/runbook/evidence/fixture files. The unrelated release documentation rollback in `docs/plans/v28-release-evidence-2026-05-29.md` is gone from the main-basis diff, and README/contracts/operator-guide now preserve current `main` release wording with only additive v33 health text.

## Boundary notes

- Health path is read-only.
- No action execution was added.
- No job queue was added.
- No model invocation was added.
- No generic shell runner, command DSL, browser terminal, permission system, goal framework, or artifact framework was added.
- No git write, merge, push, tag, publish, release write, verification execution, or goal event registration was added.
- Runtime health reads process metadata and checks for `.git` by filesystem metadata only; it does not shell out to git.
- I did not run `symphony goal update`, `symphony goal review`, or `symphony goal gate`.

## Reviewer handoff checklist

- Check `src/symphony/local-runtime-health.js` for contract fields, repo resolver behavior, and boundary flags.
- Check `src/symphony/console.js` for `GET /api/health` behavior and query rejection.
- Check `scripts/symphony.js` for `symphony runtime health --json` and output-only behavior.
- Check `tests/v33-local-runtime-health.test.js` and the updated `tests/symphony-cli.test.js` coverage.
- Confirm docs describe the health path as read-only and do not imply action execution, job queue, model invocation, git writes, or release readiness.
