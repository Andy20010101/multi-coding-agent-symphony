# v40 task-5 worker evidence

Goal id: `v40-personal-workflow-router-app-core-release`
Task id: `task-5`
Branch: `v40-task-5-native-ux-handoff-generator`
User-visible value: 内核完成后自然进入 UX/分发阶段。

## Implementation summary

Closeout Gaps now exposes a structured `NativeUxHandoffDraft` inside the existing `NextVersionHandoffDraft` path. The draft is generated from the active goal closeout projection, event/evidence anchors, release baseline context, run context, and ledger/runbook task anchors.

The v40 closeout handoff now produces a v41 starter context with menu bar, notch, native distribution, UX polish, and distribution evidence work packages. The Workbench panel renders the native scope, distribution channels, starter packages, and safety flags. The model remains display-only and copy-only.

## Files changed

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-ltXnGC0K.js`
- `src/symphony/workbench-static/assets/index-Cc3wrmZV.js` removed by the rebuilt Workbench bundle
- `docs/plans/v40-task-5-worker-evidence-2026-06-02.md`

## Commands run

- `pnpm --silent exec node --test tests/workbench-api-client.test.js`
  - Result: passed, 50 tests passed.
- `pnpm --silent exec node --test tests/workbench-shell.test.js`
  - First result before dependency install: failed with `ERR_MODULE_NOT_FOUND` for package `react`.
- `pnpm install --frozen-lockfile`
  - Result: passed. Lockfile was up to date; dependencies were restored from `pnpm-lock.yaml`.
- `pnpm --silent exec node --test tests/workbench-shell.test.js`
  - Result: passed, 28 tests passed.
- `pnpm check`
  - Result: passed.
- `pnpm test`
  - Result: passed, 1041 tests passed.
- `pnpm workbench:build`
  - Result: passed. Vite built `src/symphony/workbench-static/index.html`, `assets/index-CILC3208.css`, and `assets/index-ltXnGC0K.js`.
- `git diff --check`
  - Result: passed.
- `pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json`
  - Result: failed in the assigned worktree with exit code 64.
  - Output:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

## App/Workbench user path changed

In Workbench Closeout Gaps, `next-version handoff draft` now includes `native UX handoff scope`. The panel shows:

- target next version, including `v41` for `v40-personal-workflow-router-app-core-release`
- menu bar and notch handoff scope
- native distribution channels
- starter work packages for native shell entry points, capture/router UX, and distribution evidence
- safety fields confirming the draft does not build, sign, notarize, publish, invoke providers, open local files, enter the next version, or create a managed goal

## Boundary notes

- No shell runner, browser terminal, arbitrary command palette, arbitrary model invocation, arbitrary local path read, merge, push, tag, publish, or auto-update path was added.
- The draft is generated from existing closeout, release baseline, goal event, goal progress, run, and Workbench capability projections.
- The UI does not infer approval, main verification, release readiness, or task status from branch names, filenames, task titles, prompt text, frontend state, or copied command text.
- This worker evidence does not record reviewer verdict, main verification, release readiness, or release closeout.

## Known limitations / next task handoff

- `goal-status` is not available for this goal in the assigned worktree state and returned `goal not found`. I did not run `goal init` or any confirm command because this worker phase was not authorized to mutate supervisor or goal state.
- Reviewer should inspect the Workbench closeout projection and rebuilt static bundle, then independently decide whether the goal-status environment gap is acceptable for this worker phase.
