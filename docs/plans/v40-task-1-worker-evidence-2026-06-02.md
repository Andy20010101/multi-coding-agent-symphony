# v40 task-1 worker evidence

Goal id: `v40-personal-workflow-router-app-core-release`
Task id: `task-1`
Branch: `v40-task-1-inbox-capture-contract`
User-visible value: App 有入口，不只是执行台。

## Implementation summary

Implemented `inbox-capture.v1` as a read-only App entry contract for raw user requests, project clues, ideas, and faults before routing into Workbench or other workflows.

The contract is exposed through:

- CLI: `symphony inbox capture --json`
- API: `GET /api/inbox/capture`
- Workbench: `Inbox Capture` panel in the active-goal supporting contracts section

The capture contract does not persist capture items and does not require an active Workbench goal. Handoff fields point to the later router and goal/runbook draft contracts without implementing those task-2/task-3 flows in this branch.

## Files changed

- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `scripts/symphony.js`
- `src/symphony/console.js`
- `src/symphony/inbox-capture-contract.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BAd603I3.js`
- `src/symphony/workbench-static/assets/index-Cc3wrmZV.js` removed by `pnpm workbench:build`
- `tests/v40-inbox-capture-contract.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

## Commands run

- `node --test tests/v40-inbox-capture-contract.test.js`
  - Result: passed, 5 tests passed.
- `pnpm install --frozen-lockfile`
  - Result: passed, installed dependencies from the existing lockfile so required test/build commands could run.
- `pnpm check`
  - Result: passed.
- `pnpm test`
  - Result: passed on final run, 1046 tests passed, 0 failed.
- `pnpm workbench:build`
  - Result: passed. Vite built `src/symphony/workbench-static/index.html` and assets, including `index-BAd603I3.js`.
- `git diff --check`
  - Result: passed.
- `pnpm --silent symphony inbox capture --goal v40-personal-workflow-router-app-core-release --task task-1 --json`
  - Result: passed, returned `inbox-capture.v1` with `requiresActiveWorkbenchGoal: false`, `writesInPreview: false`, and disabled shell/model/git/release boundaries.
- `pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json`
  - Result: failed with exit code 64 and JSON message `goal not found`.

## App/Workbench user path changed

Workbench now has an `Inbox Capture` panel before the existing app-data/action/provider support panels. It shows:

- raw capture item types: `user-request`, `project-clue`, `idea`, `fault`
- capture draft fields: `itemType`, `summary`, `rawText`, and optional project/source/evidence notes
- handoff contracts for `workflow-router-category.v1` and `goal-runbook-draft-handoff.v1`
- explicit boundaries showing no capture persistence, shell execution, model invocation, job execution, git write, self-approval, main verification, or release readiness

## Boundary notes

- The route accepts only `goal` and `task` query parameters.
- The CLI rejects output-file, write, confirm, prompt, path, and command inputs.
- The Workbench panel renders backend contract fields only.
- No browser shell runner, arbitrary local file path, provider/model invocation, job execution, git write, merge, push, tag, publish, reviewer approval, main verification, or release-ready path was added.
- The implementation does not infer status from branch names, filenames, commit messages, prompt text, task titles, or frontend state.

## Known limitations / next task handoff

- This branch defines the capture entry contract and display path only.
- Router categories are intentionally left for task-2.
- Goal/runbook draft creation is intentionally left for task-3.
- Worker event registration was not run in this leased phase. The required goal-status read returned `goal not found` in this assigned worktree.
