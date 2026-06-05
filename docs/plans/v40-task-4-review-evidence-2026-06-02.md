# v40 task-4 review evidence

Goal id: `v40-personal-workflow-router-app-core-release`
Task id: `task-4`
Branch: `v40-task-4-app-core-release-manager`
Worktree: `/Users/andy/.codex/worktrees/v40-task-4-app-core-release-manager`
Reviewer thread: `019e97c0-0a71-7f93-89e3-d89f425349db`
Worker evidence reviewed: `docs/plans/v40-task-4-worker-evidence-2026-06-02.md`

## Verdict

APPROVED

## Review summary

The implementation adds a read-only `app-core-release-manager.v1` backend contract, exposes it through `GET /api/release/app-core-manager`, projects it into the Workbench read-only route model, and renders an App Core Release Manager panel. The panel gives a visible task-4 user path for v34-v39 capability status, closeout gaps, release gate status, final evidence draft sections, source counts, and explicit safety boundaries.

The route accepts only `goal` and `task` query parameters and rejects unsafe refs. The contract keeps release declaration, goal-event writes, closeout execution, shell execution, model invocation, git writes, merge, push, tag, publish, provider CLI execution, self-approval, and frontend status inference unavailable.

## Scope and boundary checks

- User-visible App/Workbench workflow exists through the new App Core Release Manager panel.
- The implementation uses backend contracts and goal closeout/event/ledger state as sources. It does not replace the canonical goal/event/ArtifactStore contracts.
- The panel is display-only and does not add generic shell, model invocation, local file open, merge, push, tag, publish, or release-ready controls.
- Release readiness remains event-backed. The manager may report `pending-release-ready-event` but keeps declaration authorization and declaration command availability false.
- The final evidence output is a draft reference and required section list only; it does not write the release evidence file.

## Files reviewed

- `docs/plans/v40-task-4-worker-evidence-2026-06-02.md`
- `src/symphony/app-core-release-manager.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/v40-app-core-release-manager.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BJrI99LV.js`
- `src/symphony/workbench-static/assets/index-Cc3wrmZV.js`

## Commands run

| Command | Result |
| --- | --- |
| `sed -n '637,785p' docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md` | Exit 0. Confirmed task-4 scope, acceptance, reviewer checks, and evidence path. |
| `sed -n '1,220p' docs/plans/v40-task-4-worker-evidence-2026-06-02.md` | Exit 0. Reviewed worker summary, changed files, validation, user path, boundaries, and limitations. |
| `git diff --name-status` | Exit 0. Confirmed tracked worker diff includes Workbench UI/API, console route, static bundle update, and tests. |
| `git ls-files --others --exclude-standard` | Exit 0. Confirmed untracked worker files include worker evidence, release manager module, built JS asset, and release manager tests. |
| `pnpm check` | Exit 0. Syntax check passed. |
| `pnpm test` | Exit 0. 1045 tests passed, 0 failed. |
| `pnpm workbench:build` | Exit 0. Vite build completed and refreshed `src/symphony/workbench-static/`. |
| `git diff --check` | Exit 0. No whitespace errors. |

## Blocking findings

None.

## Residual risks

- The assigned worker worktree still has uncommitted implementation and evidence changes. Main verification should use this worker worktree and evidence ref after reviewer verdict registration.
- The release manager cannot read the root managed `.symphony` goal state unless the server is pointed at that state directory. The worker documented this limitation, and the contract degrades to blocked/missing closeout state instead of inferring readiness.
