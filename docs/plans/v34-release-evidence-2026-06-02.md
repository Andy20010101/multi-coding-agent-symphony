# v34 release evidence

Date: 2026-06-02

Goal id: `v34-action-registry-workspace`
Release name: `v34 Action Registry Workspace`
Baseline: `v33 App Runtime Foundation`
Evidence path: `docs/plans/v34-release-evidence-2026-06-02.md`
Release-manager scope: closeout validation, release gate evidence, release-ready declaration basis, and tag handoff

## Release Scope

v34 adds the shared Action Registry layer for App surfaces:

- `action-manifest.v1`
- `action-availability.v1`
- `action-preview.v1`
- Workbench Action Registry Panel
- Action Registry migration guide for v35 job queue, Web Workbench, Desktop Shell, Notch/Menu Bar, and CLI

The release keeps v34 as a declaration, availability, and preview layer. It does not create a job queue, execute actions, invoke models, merge, push, publish, self-approve, or create v35 state.

## Baseline

Release validation ran on `main`.

| Command | Result |
| --- | --- |
| `git status -sb --untracked-files=all` | Exit 0. Current branch `main`; clean worktree before release evidence files were written; local branch ahead of `origin/main`. |
| `pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json` | Exit 0. Returned `goal-progress-ledger.v1`; 5 total tasks, 5 completed tasks, 0 blockers, `releaseReady: false`; release gates unknown before registration. |
| `pnpm --silent symphony goal closeout --goal v34-action-registry-workspace --markdown` | Exit 0. Worker evidence complete yes, review evidence complete yes, main verification complete yes, missing evidence none, release ready no. Release gate gaps before registration: `pnpmCheck`, `pnpmTest`, `workbenchBuild`, `diffCheck`, `docsUpdated`. |
| `pnpm --silent symphony goal next --goal v34-action-registry-workspace --json` | Exit 0. Next action was release-manager for `release.pnpm-check`. |

## Task Event Coverage

All tasks are main-verified through explicit goal events:

| Task | Title | Main verification evidence |
| --- | --- | --- |
| `task-1` | Action manifest contract | `docs/plans/v34-task-1-main-verification-evidence-2026-06-02.md` |
| `task-2` | Action availability resolver | `docs/plans/v34-task-2-main-verification-evidence-2026-06-02.md` |
| `task-3` | Action preview API | `docs/plans/v34-task-3-main-verification-evidence-2026-06-02.md` |
| `task-4` | Workbench action panel binding | `docs/plans/v34-task-4-main-verification-evidence-2026-06-02.md` |
| `task-5` | Action registry evidence + migration guide | `docs/plans/v34-task-5-main-verification-evidence-2026-06-02.md` |

## Release Validation

| Command | Result |
| --- | --- |
| `pnpm check` | Exit 0. Node syntax checks passed for source, scripts, plugins, and tests. |
| `pnpm test` | Exit 0. Node test runner passed: 790 tests, 123 suites, 790 pass, 0 fail. |
| `pnpm workbench:build` | Exit 0. Vite `v8.0.14` built 17 modules. Output: `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-CFPsQWlN.css`, and `src/symphony/workbench-static/assets/index-DzA47IAl.js`. |
| `git diff --check` | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json` | Exit 0. Returned 5 completed tasks, 0 blockers, `releaseReady: false`; task-5 was `approved` before task-5 main gate and `main-verified` after gate registration. |

## Docs Updated Evidence

Docs and evidence are present for the release:

- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/action-registry-migration-guide.md`
- `docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md`
- `docs/plans/v34-task-1-worker-evidence-2026-06-02.md` through `docs/plans/v34-task-5-main-verification-evidence-2026-06-02.md`
- `docs/plans/v34-release-evidence-2026-06-02.md`
- `docs/plans/v34-tag-evidence-2026-06-02.md`

## Release Gate Registration Basis

These gates are ready to register as passed using this evidence:

| Gate | Status | Evidence basis |
| --- | --- | --- |
| `release.pnpm-check` | `passed` | `pnpm check` exited 0. |
| `release.pnpm-test` | `passed` | `pnpm test` exited 0 with 790 tests passing. |
| `release.workbench-build` | `passed` | `pnpm workbench:build` exited 0 and produced the v34 Workbench static bundle. |
| `release.diff-check` | `passed` | `git diff --check` exited 0. |
| `release.docs-updated` | `passed` | v34 contract docs, operator guide, migration guide, runbook/plan docs, task evidence, release evidence, and tag evidence are present. |

`release.tag-evidence` uses `docs/plans/v34-tag-evidence-2026-06-02.md`.

## Release Ready Basis

After the release gates above are registered, `release.ready` can be declared with this evidence ref if closeout reports no missing task evidence and no required release gate gaps.

## Boundaries

This release evidence does not push commits, push tags, publish a GitHub release, create v35 state, start jobs, execute actions, invoke models, or bypass the existing dry-run/confirm goal gate flow.
