# v40 task-3 worker evidence

Goal id: `v40-personal-workflow-router-app-core-release`
Task id: `task-3`
Branch: `v40-task-3-goal-runbook-draft-handoff`
Worker phase: `implement`

## User-visible value

Repeated or project-scoped work can be reviewed as a goal/runbook draft before anyone registers a managed goal.

## Implementation summary

- Added `goal-draft-handoff.v1`, a read-only contract that derives a draft-only goal/runbook handoff from a registered source runbook task.
- Exposed `GET /api/workflows/goal-draft-handoff` with safe `goal` and `task` query parameters only.
- Added the Workbench `Goal Draft Handoff` panel under the active-goal support grid.
- Updated Workbench read-only route projections, route smoke tests, shell static checks, product contract docs, and operator guide notes.
- Rebuilt the tracked Workbench static bundle.

## Files changed

- `src/symphony/goal-draft-handoff.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CkPiHK4N.js`
- `src/symphony/workbench-static/assets/index-Cc3wrmZV.js` removed by the Vite rebuild
- `tests/v40-goal-draft-handoff.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`

## Commands run

- `node --test tests/v40-goal-draft-handoff.test.js`
  - Result: passed, 3 tests.
- `node --test tests/workbench-api-client.test.js`
  - Result: passed, 51 tests.
- `node --test tests/workbench-route-smoke.test.js`
  - Result: passed, 11 tests.
- `pnpm check`
  - Result: passed.
- `pnpm test`
  - First result before dependency install: failed because `node_modules` was missing existing declared packages, including `fast-check` and `react`.
  - Follow-up after `pnpm install --frozen-lockfile`: passed, 1045 tests.
- `pnpm workbench:build`
  - First result before dependency install: failed because `vite` was not installed.
  - Follow-up after `pnpm install --frozen-lockfile`: passed.
- `git diff --check`
  - Result: passed.
- `pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json`
  - Result: failed with exit code 64 and message `goal not found`.

## App/Workbench user path changed

Workbench now reads `goal-draft-handoff.v1` through `/api/workflows/goal-draft-handoff` and renders the `Goal Draft Handoff` panel. The panel shows the source goal/task, router category, suggested goal id/title, draft registration state, runbook draft summary, copy-only dry-run command, checklist, blockers, endpoint fields, and boundary flags.

## Boundary notes

- The route is `GET` only.
- The route accepts only `goal` and `task`; it rejects prompt, command, path, confirm, planHash, and output fields.
- The contract sets `draftOnly: true`, `autoRegister: false`, `writesFiles: false`, `registersGoal: false`, and `runsGoalInit: false`.
- Workbench does not execute the copy-only command, invoke models, open local files, merge, push, tag, publish, self-approve, or declare release readiness.
- The worker did not register `worker.evidence-recorded`, reviewer verdict, main verification, release gate, or release readiness.

## Known limitations / next task handoff

- The default checkout state does not have the v40 goal registered, so `goal-status` returns `goal not found`.
- The draft contains one conservative starter task. Future router work can add richer draft generation once inbox/capture and router-category inputs are available as explicit contracts.
