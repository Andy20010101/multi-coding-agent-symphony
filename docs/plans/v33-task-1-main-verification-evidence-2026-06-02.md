# v33 task-1 main verification evidence

Goal id: `v33-app-runtime-foundation`
Task id: `task-1`
Release name: `v33 App Runtime Foundation`
Branch/current checkout: `v33-task-1-local-sidecar-health-api`
Verification date: 2026-06-02

Worker evidence: `docs/plans/v33-task-1-worker-evidence-2026-06-02.md`
Reviewer evidence: `docs/plans/v33-task-1-review-evidence-2026-06-02.md`
Reviewer verdict: `APPROVED`

## Verification basis

`pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json` returned `goal-next-action.v1` with `next.taskId: "task-1"`, `next.role: "main-verifier"`, `next.phase: "main-verification"`, and reason `Reviewer approved task-1 but main verification is missing.` The command also reported `evidenceState.mainVerificationRef: null`.

Clean main checkout and ff-only merge were not used. The current checkout has staged and modified task files, so crossing into `git checkout main`, `git pull --ff-only`, and `git merge --ff-only v33-task-1-local-sidecar-health-api` would cross a dirty-worktree boundary. I used the allowed repo-local fallback: verify the approved task diff against `main` from the current checkout, confirm the prior unrelated rollback is not in the main-basis diff, then run the required validation commands and health probes.

This fallback replaces the clean-main checkout and ff-only merge operation for task-1 main verification. It is sufficient for this task because the reviewer-approved implementation is already present on the task branch, `git diff --name-status main` shows the exact main-basis file set, the v28 rollback path has no diff against `main`, and all required read-only validation commands pass from that same checkout.

I did not run `symphony goal gate`, `symphony goal update`, `symphony goal review`, `symphony goal closeout`, release commands, merge, push, tag, or publish commands.

## Diff basis

`git status -sb --untracked-files=all` exited 0:

```text
## v33-task-1-local-sidecar-health-api
M  README.md
M  docs/plans/v28-release-evidence-2026-05-29.md
A  docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md
A  docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md
AM docs/plans/v33-task-1-review-evidence-2026-06-02.md
A  docs/plans/v33-task-1-worker-evidence-2026-06-02.md
A  docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
A  docs/plans/workbench-v33-v40-app-runtime-runbooks/README_HOW_TO_START.md
A  docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
M  docs/symphony-product-contracts.md
M  docs/workbench-operator-guide.md
A  fixtures/contracts/goal-runbook.v33-app-runtime-foundation.v1.json
A  fixtures/contracts/local-runtime-health.v1.json
M  scripts/symphony.js
M  src/symphony/console.js
A  src/symphony/local-runtime-health.js
M  tests/symphony-cli.test.js
A  tests/v33-local-runtime-health.test.js
```

`git diff --name-status main` exited 0:

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

`git diff main -- docs/plans/v28-release-evidence-2026-05-29.md` exited 0 with no output. The prior unrelated rollback in this file is not present in the main-basis diff.

## Commands run

| Command | Result |
| --- | --- |
| `git branch --show-current` | Exit 0. Output: `v33-task-1-local-sidecar-health-api`. |
| `pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json` | Exit 0. Returned `goal-next-action.v1`; next action is task-1 main verifier, phase `main-verification`, reason `Reviewer approved task-1 but main verification is missing`, `mainVerificationRef: null`, safety `readOnly: true`, `copyOnly: true`. |
| `git status -sb --untracked-files=all` | Exit 0. Output listed in the Diff basis section. Current checkout is dirty with task files, which is the boundary for clean main checkout/ff-only merge verification. |
| `git diff --name-status main` | Exit 0. Output listed in the Diff basis section. Diff contains v33 task-1 health code/tests/docs plus v33 plan/runbook/evidence/fixture files. |
| `git diff main -- docs/plans/v28-release-evidence-2026-05-29.md` | Exit 0. No output; this confirms no unrelated rollback for that path in the main-basis diff. |
| `pnpm check` | Exit 0. Node syntax checks passed for `src/*.js`, `src/adapters/*.js`, `src/ensemble/*.js`, `src/integrations/*.js`, `src/intake/*.js`, `src/symphony/*.js`, `src/trackers/*.js`, `scripts/*.js`, `plugins/eval-replay/*.js`, and `tests/*.test.js`. |
| `pnpm test` | Exit 0. Node test runner reported 763 tests, 117 suites, 763 pass, 0 fail, duration 7216.523083 ms. |
| `pnpm workbench:build` | Exit 0. Vite v8.0.14 built 17 modules into `src/symphony/workbench-static`; output included `index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-BDjDodcJ.js`; built in 63 ms. |
| `git diff --check` | Exit 0. No output; no whitespace errors. |
| `pnpm --silent symphony runtime health --json` | Exit 0. Returned `local-runtime-health.v1`; status `ok`; runtime version `v33-app-runtime-foundation.1`; kernel version `v32-release-manager-workspace-v2`; cwd and repoPath `/Users/andy/Documents/project/multi-coding-agent-symphony`; `readOnly: true`; mode `read-only`; all execution/write/model/job boundary flags false; `knownBlockers: []`. |
| `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` | Exit 0. Returned `goal-progress-ledger.v1`; `summary.totalTasks: 5`; `summary.completedTasks: 1`; `summary.releaseReady: false`; task-1 status `approved`, review verdict `APPROVED`, worker and reviewer evidence refs present, `mainVerificationRef: null`. |
| Direct API probe through `createSymphonyConsoleServer` and `fetch` | Exit 0. `GET /api/health` returned HTTP 200 with `contractName: "local-runtime-health.v1"`, `readOnly: true`, `mode: "read-only"`, repoPath `/Users/andy/Documents/project/multi-coding-agent-symphony`, `knownBlockers: []`, and all execution/write/model/job boundary flags false. `GET /api/health?path=package.json` returned HTTP 400 with `contractName: "error-envelope.v1"` and `error.code: "invalid-health-request"`. `POST /api/health` returned HTTP 405 with `contractName: "error-envelope.v1"` and `error.code: "method-not-allowed"`. |

## Runtime health result

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
    "processId": 84818,
    "cwd": "/Users/andy/Documents/project/multi-coding-agent-symphony",
    "repoPath": "/Users/andy/Documents/project/multi-coding-agent-symphony",
    "startupTime": "2026-06-02T01:57:40.090Z",
    "generatedAt": "2026-06-02T01:57:40.091Z",
    "uptimeMs": 1
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

The health command and API include runtime version, kernel version/source, process id, cwd/repo path, startup time, read-only mode, and known blockers. The process id and timestamps are expected to vary by invocation.

## Boundary result

The task-1 health path remains read-only. The command and API return status data and rejection envelopes only. The verified response keeps `actionExecutionAvailable`, `jobQueueAvailable`, `modelInvocationAvailable`, `gitWriteAvailable`, `releaseWriteAvailable`, and `arbitraryCommandExecutionAvailable` set to `false`.

No worker, reviewer, main-verification, release execution, model invocation, Action Registry execution, Job Queue, Provider Hub, generic shell runner, browser terminal, permission system, goal framework, artifact framework, or command DSL was added or exercised during main verification.

## Final verdict

`MAIN_VERIFICATION_PASSED`
