# v40 task-2 worker evidence

Goal id: `v40-personal-workflow-router-app-core-release`
Task id: `task-2`
Branch: `v40-task-2-workflow-router-categories`
User-visible value: 用户知道该走哪条流程。

## Implementation Summary

Added `workflow-router-categories.v1` as a read-only router category contract for six request paths: `direct-answer`, `skill`, `automation`, `workbench-goal`, `research`, and `ignore-skip`.

`GET /api/workflow/router-categories` now returns the category contract and rejects query parameters. Workbench reads the route through the existing read-only API list and renders a `Workflow Router` panel with category ids, route kinds, request signals, next steps, allowed contracts, examples, and boundary flags.

## Files Changed

- `src/symphony/workflow-router-categories.js`
- `fixtures/contracts/workflow-router-categories.v1.json`
- `src/symphony/console.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/v40-workflow-router-categories.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BUM9s_0-.js`
- `src/symphony/workbench-static/assets/index-Cc3wrmZV.js` removed by `pnpm workbench:build`

## Commands Run

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Exit 0. Installed dependencies from the existing lockfile after `react` and `vite` were missing. |
| `node --test tests/v40-workflow-router-categories.test.js` | Exit 0. 3 tests passed. |
| `node --test tests/workbench-api-client.test.js` | Exit 0. 51 tests passed. |
| `node --test tests/workbench-route-smoke.test.js` | Exit 0. 11 tests passed. |
| `node --test tests/workbench-shell.test.js` | Exit 0. 28 tests passed. |
| `pnpm check` | Exit 0. `node --check` passed for configured source, script, plugin, and test files. |
| `pnpm test` | Exit 0. 1,045 tests passed. |
| `pnpm workbench:build` | Exit 0. Vite built 17 modules and wrote `src/symphony/workbench-static/index.html`, `assets/index-CILC3208.css`, and `assets/index-BUM9s_0-.js`. |
| `git diff --check` | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json` | Exit 64. Returned `{"version":"1","status":"error","exitCode":64,"message":"goal not found"}` in this assigned worktree. I did not run goal init, goal update, review, gate, closeout, tag, push, or any release command. |

## App / Workbench User Path Changed

Workbench now has a `Workflow Router` panel in the active goal supporting contracts area. The panel uses backend contract data from `/api/workflow/router-categories`; it does not derive category state from frontend text.

The panel shows:

- category id and label
- route kind and user path
- request signals
- next step
- allowed source contracts
- example route decisions
- disabled write/execution boundaries

## Boundary Notes

- The router contract is read-only.
- The route does not accept query parameters.
- The browser path does not create goal drafts, create jobs, execute actions, fetch research, invoke models, run shell commands, open local files, write git state, self-approve, pass main verification, or declare release readiness.
- Category decisions are displayed as contract fields only. No route decision is persisted.
- Review and main verification remain separate phases.

## Known Limitations / Next Task Handoff

- This task defines categories and displays them in Workbench. It does not generate a goal/runbook draft.
- Task-3 should use these categories when deciding whether repeated friction or project work becomes a goal/runbook draft, with human confirmation before registration.
- The v40 managed goal is not registered in this worktree, so the required goal-status command returned `goal not found`.
