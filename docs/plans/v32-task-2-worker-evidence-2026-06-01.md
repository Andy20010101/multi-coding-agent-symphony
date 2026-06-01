# v32 task-2 worker evidence

Date: 2026-06-01

Goal id: `v32-release-manager-workspace-v2`  
Release: `v32 Release Manager Workspace v2`  
Task id: `task-2`  
Task title: `Release gate checklist recorder`

## Checkout

- Current checkout: `v30-task-3-adoption-inspect-and-recovery-view`.
- The worktree was already dirty with v29-v32 artifacts and task-1/v31/v32 Workbench changes before this task-2 pass.
- I used the repo-local/current-checkout fallback. I did not clean, stash, reset, revert, merge, push, tag, publish, stage, commit, or overwrite unrelated changes.

## Implementation summary

- The Workbench `Closeout Gaps` release checklist now covers these gate rows: `pnpm check`, `pnpm test`, `pnpm workbench:build`, `pnpm test:mutation:gate`, `pnpm audit --audit-level high`, `git diff --check`, `pnpm mcas doctor`, docs updated, and tag evidence.
- Each row shows the gate id, current status from `goal-closeout-report.v1`, the copy-only validation command, latest explicit `goal-event-log.v1` gate event details, and latest evidence refs when present.
- Each row has fixed `release.gate-passed` and `release.gate-failed` forms that reuse the existing `goal-update-plan.v1` dry-run preview and plan-hash confirm path through `symphony goal gate`.
- The default release gate evidence ref for v32 is `docs/plans/v32-release-evidence-2026-06-01.md`, matching the runbook release manager flow.
- Release gate event lookup accepts both `gate.id` and `gate.name`, matching existing fixtures and backend `goal gate` output.
- `release.ready` remains separate. The release gate checklist does not declare release readiness and does not run validation commands in the browser.

## User path

Open Workbench -> `Closeout Gaps` -> `release verification checklist`.

For each gate row, the operator runs the validation command outside Workbench, then enters verifier/evidence context in the fixed gate form, previews the dry-run plan, and confirms only with the returned plan hash. Confirm appends one explicit backend event and refreshes goal-status/events/next action. The browser does not execute shell commands, invoke models, open local files, download artifacts, merge, push, tag, publish, self-approve, or declare `release.ready`.

## Files changed for task-2

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/workbench-api-client.test.js`
- `tests/v23-goal-operation-console-api.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/release-checklist.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-B6N7YEV6.js`
- `src/symphony/workbench-static/assets/index-BY5UaxlX.css`
- Removed old built assets now superseded by the Workbench build: `src/symphony/workbench-static/assets/index-B9IfCFVY.css`, `src/symphony/workbench-static/assets/index-NKKg_tJp.js`

## Validation commands

- `node --test tests/workbench-api-client.test.js` -> exit `0`. 43 tests passed, including release gate evidence refs, per-row controlled registration forms, and v32 release evidence path coverage.
- `node --test tests/v23-goal-operation-console-api.test.js` -> exit `0`. 10 tests passed, including taskless release gate dry-run/confirm through the Workbench event endpoint.
- `node --test tests/workbench-shell.test.js` -> exit `0`. 25 tests passed.
- `pnpm check` -> exit `0`.
- `pnpm test` -> exit `0`. 757 tests passed.
- `pnpm workbench:build` -> exit `0`. Vite rebuilt `src/symphony/workbench-static/`.
- `git diff --check` -> exit `0`.
- `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` -> exit `0`. The returned ledger had 5 tasks, task-1 `main-verified`, task-2 `in-progress` with worker evidence ref `docs/plans/v32-task-2-worker-evidence-2026-06-01.md`, no blockers, and `releaseReady: false`.
- `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` -> exit `0`. The returned next action was task-2 reviewer, reason: `Worker evidence exists for task-2 but reviewer verdict is missing.`

## Boundary notes

- I did not run `symphony goal update`, `symphony goal review`, `symphony goal gate`, or `symphony goal closeout` against the real goal state.
- The goal-status/goal-next state above came from existing managed state in this checkout. I did not register worker, reviewer, main-verification, release gate, or `release.ready` events.
- The browser release checklist uses copy-only validation commands plus controlled `goal gate` preview/confirm forms. It is not a generic shell runner, terminal, model invocation path, permission system, goal framework, artifact framework, or command DSL.
- v8 compatibility commands were not promoted into the top-level Workbench model.
- Gate status is not inferred from closeout prose, filenames, branch names, commit messages, prompt text, task titles, frontend state, or test names.

## Reviewer handoff checklist

- Check `frontend/workbench/src/api/contracts.js` for the release checklist projection, v32 evidence path, `gate.id`/`gate.name` lookup, and release gate form models.
- Check `frontend/workbench/src/App.jsx` for `Closeout Gaps` rendering of per-row release gate registration forms.
- Check `tests/workbench-api-client.test.js`, `tests/v23-goal-operation-console-api.test.js`, and `tests/workbench-shell.test.js` for the task-2 user path and boundary assertions.
- Confirm the docs updates describe Workbench as a release gate recorder, not a browser command runner.
- Confirm the built Workbench static assets match `pnpm workbench:build`.
