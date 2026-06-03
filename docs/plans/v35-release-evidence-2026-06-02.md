# v35 release evidence

Date: 2026-06-03

Goal id: `v35-job-queue-run-control-workspace`
Release name: `v35 Job Queue + Run Control Workspace`
Baseline: `v34 Action Registry Workspace`
Evidence path: `docs/plans/v35-release-evidence-2026-06-02.md`
Release-manager scope: closeout validation, release gate evidence, release-ready declaration basis, and tag handoff

## Release Scope

v35 adds the read-only Job Queue + Run Control Workspace for App surfaces:

- `job-model.v1`
- `job-creation.v1`
- `job-timeline-log-stream.v1`
- `job-run-control.v1`
- Workbench Job Console panel
- Job route allowlist and static Workbench binding
- Documentation updates for README, Workbench operator guide, product JSON contracts, and Action Registry migration handoff

The release keeps v35 as a contract, display, and run-control semantics layer. It does not create a live job runner, execute jobs, run actions, invoke models, mutate frontend job state, write git/release state from Workbench, self-approve, or infer release readiness.

## Baseline

Release validation ran on `main`.

| Command | Result |
| --- | --- |
| `git status -sb --untracked-files=all` | Exit 0. Current branch `main`; worktree clean before release docs were written; local branch ahead of `origin/main`. |
| `pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json` | Exit 0. Returned `goal-progress-ledger.v1`; 5 total tasks, 5 completed tasks, 0 blockers, `releaseReady: false`; release gates unknown before registration. |
| `pnpm --silent symphony goal closeout --goal v35-job-queue-run-control-workspace --markdown` | Exit 0. Worker evidence complete yes, review evidence complete yes, main verification complete yes, missing evidence none. Release gate gaps before registration: `pnpmCheck`, `pnpmTest`, `workbenchBuild`, `diffCheck`, `docsUpdated`. |
| `pnpm --silent symphony goal next --goal v35-job-queue-run-control-workspace --json` | Exit 0. Next action was release-manager for `release.pnpm-check`. |

## Task Event Coverage

All tasks are main-verified through explicit goal events:

| Task | Title | Main verification evidence |
| --- | --- | --- |
| `task-1` | Job model contract | `docs/plans/v35-task-1-main-verification-evidence-2026-06-02.md` |
| `task-2` | Create job from controlled action | `docs/plans/v35-task-2-main-verification-evidence-2026-06-02.md` |
| `task-3` | Job event timeline + log stream contract | `docs/plans/v35-task-3-main-verification-evidence-2026-06-02.md` |
| `task-4` | Pause/cancel/resume/recover semantics | `docs/plans/v35-task-4-main-verification-evidence-2026-06-02.md` |
| `task-5` | Workbench job console binding | `docs/plans/v35-task-5-main-verification-evidence-2026-06-02.md` |

## Release Validation

| Command | Result |
| --- | --- |
| `pnpm check` | Exit 0. Node syntax checks passed for source, scripts, plugins, and tests. |
| `pnpm test -- tests/v35-task-5-workbench-job-console-binding.test.js tests/v35-job-run-control-contract.test.js tests/v35-job-timeline-contract.test.js tests/v35-job-model-contract.test.js tests/v35-job-creation-contract.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js` | Exit 0. 150 tests passed. |
| `pnpm test` | Exit 0. Node test runner passed: 868 tests, 128 suites, 868 pass, 0 fail. |
| `pnpm workbench:build` | Exit 0. Vite `v8.0.14` built 17 modules. Output: `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-ooe-c3KL.css`, and `src/symphony/workbench-static/assets/index-DGKVua6N.js`. |
| `git diff --check` | Exit 0. No whitespace errors. |
| `pnpm --silent symphony actions manifest --json` | Exit 0. Returned `action-manifest.v1`. |
| `pnpm --silent symphony actions availability --json` | Exit 0. Returned `action-availability.v1`. |
| `pnpm --silent symphony actions preview --goal v35-job-queue-run-control-workspace --task task-5 --action goal.main-verification-gate.record --json` | Exit 0. Returned `action-preview.v1`. |
| `pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json` | Exit 0. Returned 5 completed tasks, 0 blockers, `releaseReady: false`; task-5 was `main-verified` after gate registration. |

## Docs Updated Evidence

Docs and evidence are present for the release:

- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/action-registry-migration-guide.md`
- `docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v35_job-queue-run-control-workspace_goal_runbook_latest.md`
- `docs/plans/v35-task-1-worker-evidence-2026-06-02.md` through `docs/plans/v35-task-5-main-verification-evidence-2026-06-02.md`
- `docs/plans/v35-release-evidence-2026-06-02.md`
- `docs/plans/v35-tag-evidence-2026-06-02.md`

## Release Gate Registration Basis

These gates are ready to register as passed using this evidence:

| Gate | Status | Evidence basis |
| --- | --- | --- |
| `release.pnpm-check` | `passed` | `pnpm check` exited 0. |
| `release.pnpm-test` | `passed` | `pnpm test` exited 0 with 868 tests passing. |
| `release.workbench-build` | `passed` | `pnpm workbench:build` exited 0 and produced the v35 Workbench static bundle. |
| `release.diff-check` | `passed` | `git diff --check` exited 0. |
| `release.docs-updated` | `passed` | README, product contracts, Workbench guide, migration guide, runbook/plan docs, task evidence, release evidence, and tag evidence are present. |

`release.tag-evidence` uses `docs/plans/v35-tag-evidence-2026-06-02.md`.

## Release Ready Basis

After the release gates above are registered, `release.ready` can be declared with this evidence ref if closeout reports no missing task evidence and no required release gate gaps.

## Boundaries

This release evidence does not push commits, push tags, publish a GitHub release, create v36 state, start jobs, execute actions, invoke models, or bypass the existing dry-run/confirm goal gate flow.
