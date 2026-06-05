# v40 task-4 worker evidence

Goal id: `v40-personal-workflow-router-app-core-release`
Task id: `task-4`
Branch: `v40-task-4-app-core-release-manager`
Worktree: `/Users/andy/.codex/worktrees/v40-task-4-app-core-release-manager`
User-visible value: App core 可以 declared release ready。

## Implementation summary

Implemented `app-core-release-manager.v1` as a read-only release manager contract for v40. The contract collects v34-v39 capability status from existing backend contracts, reads goal closeout and event state when managed goal state is available, and returns a final app-core evidence draft with required sections and blocker counts.

Added `GET /api/release/app-core-manager` to the console server. The route accepts only `goal` and `task`, rejects unsafe refs and unsupported query parameters, and does not expose a write path.

Workbench now fetches and projects the release manager route. The App Core Release Manager panel shows release readiness state, closeout gaps, v34-v39 capability checklist rows, release gate statuses, final evidence sections, source counts, and locked safety boundaries.

## Files changed

- `docs/plans/v40-task-4-worker-evidence-2026-06-02.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `src/symphony/app-core-release-manager.js`
- `src/symphony/console.js`
- `src/symphony/workbench-static/assets/index-BJrI99LV.js`
- `src/symphony/workbench-static/assets/index-Cc3wrmZV.js`
- `src/symphony/workbench-static/index.html`
- `tests/v40-app-core-release-manager.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

## Commands run

| Command | Result |
| --- | --- |
| `find .. -name AGENTS.md -print` | Exit 0. No repository `AGENTS.md` file was found; repository instructions were supplied in the controller prompt. |
| `pnpm check` before dependency install | Exit 0. Syntax check passed. |
| `pnpm test` before dependency install | Exit 1. The worktree had no local `node_modules`; imports for `fast-check` and `react` failed. The v40 release manager tests themselves passed during this run. |
| `pnpm install --frozen-lockfile` | Exit 0. Installed dependencies from the existing `pnpm-lock.yaml`; no lockfile update. |
| `pnpm test` after dependency install, before allowlist patch | Exit 1. One frontend API path allowlist test omitted the new read-only `/api/release/app-core-manager` path. |
| `pnpm check` after allowlist patch | Exit 0. Syntax check passed. |
| `pnpm test` after allowlist patch | Exit 0. 1045 tests passed, 0 failed. |
| `pnpm workbench:build` | Exit 0. Vite build completed and refreshed `src/symphony/workbench-static/`. |
| `git diff --check` before evidence file | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json` | Exit 64. The isolated worker worktree has no managed `.symphony` goal state, so the CLI returned `goal not found`. |
| `pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --state-dir /Users/andy/Documents/project/multi-coding-agent-symphony/.symphony --json` | Exit 0. Root managed state shows task-1 through task-3 `main-verified`, task-4 `planned`, task-5 `planned`, and `releaseReady: false`. |

## App / Workbench user path changed

Workbench reads `GET /api/release/app-core-manager` through the read-only route model. The panel appears after the existing Release Bundle panel and before v39 backup/restore/diagnostics surfaces.

The panel displays:

- release readiness state and reason
- explicit closeout status, missing count, and task evidence completion booleans
- v34-v39 capability checklist rows with source contract and route
- release gate status map from the goal closeout report
- final evidence draft ref and required sections
- source event, artifact, app data, and provider summary counts
- safety boundaries for release declaration, shell execution, model invocation, git writes, tag, push, publish, and self-approval

## Boundary notes

- The release manager is read-only.
- It does not write the final evidence file.
- It does not emit goal events.
- It does not run `goal closeout`, declare `release.ready`, mutate release gates, tag, push, publish, merge, invoke models, run provider CLIs, execute shell commands, or open arbitrary local files.
- It does not infer readiness from branch names, filenames, task titles, prompt text, frontend state, or test success.
- It leaves reviewer approval, main verification, and release-ready declaration to separate authorized phases.

## Known limitations / next task handoff

- The exact worker-worktree `goal-status` command cannot read the root managed goal ledger unless the root `.symphony` path is passed with `--state-dir`.
- The final evidence contract returns a draft ref and required sections only. A later authorized release-manager phase still needs to write release evidence and register the release-ready gate after reviewer and main verification are complete.
- Task-5 can use the release manager source summary and final evidence draft as input for the Native UX handoff generator.
