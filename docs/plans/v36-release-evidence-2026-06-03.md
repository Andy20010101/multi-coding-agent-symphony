# v36 release evidence

Date: 2026-06-03

Goal id: `v36-artifact-evidence-index-workspace`
Release name: `v36 Artifact/Evidence Index Workspace`
Baseline: `v35 Job Queue + Run Control Workspace`
Evidence path: `docs/plans/v36-release-evidence-2026-06-03.md`
Release-manager scope: closeout validation, release gate evidence, release-ready declaration basis, tag handoff, push handoff, and GitHub Release handoff.

## Release Scope

v36 adds the read-only Artifact/Evidence Index Workspace for App surfaces:

- `artifact-index.v1`
- Artifact indexer from ArtifactStore and managed goal event evidence refs
- Safe preview/search/filter API on the derived artifact index
- Evidence timeline and release bundle views
- `evidence-bundle.v1` copy-only evidence diagnostics bundle draft
- Workbench route allowlist and static Workbench binding for v36 routes
- Worker, reviewer, and main-verification evidence for all five v36 tasks

The release keeps v36 as a derived index, evidence view, and copy-only diagnostics layer. ArtifactStore remains canonical. The index and bundle do not execute actions, invoke models, read arbitrary paths, write files, mutate git/release state from Workbench, self-approve, or infer completion from branch names, filenames, prompts, task titles, or frontend state.

## Baseline

Release validation ran on `main`.

| Command | Result |
| --- | --- |
| `git status -sb --untracked-files=all` | Exit 0 before release docs were written. Current branch `main`; local branch ahead of `origin/main`. |
| `pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json` | Exit 0 in the controller worktree that owns the active managed goal journal. Returned `goal-progress-ledger.v1`; 5 total tasks, 5 completed tasks, 0 blockers, `releaseReady: false` before release gate registration. |
| `pnpm --silent symphony goal closeout --goal v36-artifact-evidence-index-workspace --markdown` | Exit 0. Worker evidence complete yes, review evidence complete yes, main verification complete yes, missing evidence none. Release gate gaps before registration: `pnpmCheck`, `pnpmTest`, `workbenchBuild`, `diffCheck`, `docsUpdated`. |

## Task Event Coverage

All tasks are main-verified through explicit goal events:

| Task | Title | Main verification evidence |
| --- | --- | --- |
| `task-1` | Artifact index contract | `docs/plans/v36-task-1-main-verification-evidence-2026-06-02.md` |
| `task-2` | Indexer from existing ArtifactStore/event refs | `docs/plans/v36-task-2-main-verification-evidence-2026-06-02.md` |
| `task-3` | Safe preview/search/filter API | `docs/plans/v36-task-3-main-verification-evidence-2026-06-02.md` |
| `task-4` | Evidence timeline and release bundle view | `docs/plans/v36-task-4-main-verification-evidence-2026-06-02.md` |
| `task-5` | Export diagnostics/evidence bundle draft | `docs/plans/v36-task-5-main-verification-evidence-2026-06-03.md` |

## Release Validation

| Command | Result |
| --- | --- |
| `pnpm check` | Exit 0. Node syntax checks passed for source, scripts, plugins, and tests. |
| `node --test tests/v36-task-5-evidence-bundle.test.js tests/v36-task-4-evidence-timeline-release-bundle.test.js tests/v36-safe-preview-search.test.js tests/v36-artifact-indexer.test.js tests/v36-artifact-index-contract.test.js` | Exit 0. 119 tests passed, 24 suites, 0 failures. |
| `pnpm test` | Exit 0. Node test runner passed: 987 tests, 152 suites, 987 pass, 0 fail. |
| `pnpm workbench:build` | Exit 0. Vite `v8.0.14` built 17 modules. Output: `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-ooe-c3KL.css`, and `src/symphony/workbench-static/assets/index-CpBepO49.js`. |
| `git diff --check` | Exit 0. No whitespace errors. |
| `pnpm --silent symphony actions manifest --json` | Exit 0. Returned `action-manifest.v1` with 5 actions. |
| `pnpm --silent symphony actions availability --goal v36-artifact-evidence-index-workspace --task task-5 --json` | Exit 0. Returned `action-availability.v1`. |
| `pnpm --silent symphony actions preview --goal v36-artifact-evidence-index-workspace --task task-5 --action goal.main-verification-gate.record --json` | Exit 0. Returned `action-preview.v1`. |
| `pnpm --silent symphony evidence bundle --goal v36-artifact-evidence-index-workspace --task task-5 --json` | Exit 0. Returned `evidence-bundle.v1`; `readOnly: true`; 15 total events; 3 matched task-5 events; boundaries deny shell/model/path/git/tag/publish capabilities. |
| `pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json` | Exit 0. Returned 5 completed tasks, 0 blockers, `releaseReady: false` before release gate registration. |

## Docs Updated Evidence

Docs and evidence are present for the release:

- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/action-registry-migration-guide.md`
- `docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v36_artifact-evidence-index-workspace_goal_runbook_latest.md`
- `docs/plans/v36-task-1-worker-evidence-2026-06-02.md` through `docs/plans/v36-task-5-main-verification-evidence-2026-06-03.md`
- `docs/plans/v36-release-evidence-2026-06-03.md`
- `docs/plans/v36-tag-evidence-2026-06-03.md`

## Release Gate Registration Basis

These gates are ready to register as passed using this evidence:

| Gate | Status | Evidence basis |
| --- | --- | --- |
| `release.pnpm-check` | `passed` | `pnpm check` exited 0. |
| `release.pnpm-test` | `passed` | targeted v36 tests and `pnpm test` exited 0. |
| `release.workbench-build` | `passed` | `pnpm workbench:build` exited 0 and produced the v36 Workbench static bundle. |
| `release.diff-check` | `passed` | `git diff --check` exited 0. |
| `release.docs-updated` | `passed` | README, product contracts, Workbench guide, migration guide, runbook/plan docs, task evidence, release evidence, and tag evidence are present. |

`release.tag-evidence` uses `docs/plans/v36-tag-evidence-2026-06-03.md`.

## Release Ready Basis

After the release gates above are registered, `release.ready` can be declared with this evidence ref if closeout reports no missing task evidence and no required release gate gaps.

## Boundaries

This release evidence does not push commits, push tags, publish a GitHub release, create v37 state, start jobs, execute actions, invoke models, or bypass the existing dry-run/confirm goal gate flow.
