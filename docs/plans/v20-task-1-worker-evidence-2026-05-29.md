# v20 Task 1 Worker Evidence

Date: 2026-05-29
Goal ID: `v20-goal-workbench-active-goal-surface`
Task ID: `task-1`
Branch: `v20-task-1-latest-goal-command-inventory-workbench-view-model`
Task: Latest goal command inventory and Workbench view model

## User-Visible Value

Workbench now exposes an `ActiveGoalViewModel` that shows the active goal command-backed data sources. The primary command inventory is `goal-status`, `goal next`, `goal prompt`, and `goal closeout`, not the older scan/do/review/verify/status/continue/artifacts surface.

## Implementation Summary

- Added `ActiveGoalViewModel` projection in the Workbench contract model.
- Added a Workbench panel that displays the model name, active goal id/title, route states, source contracts, next action fields, prompt count, closeout gap count, and command-backed source inventory.
- Updated goal progress resolution so `goal-status --goal <managed-goal>` and latest active goal progress can read managed runbook state, including the v20 active runbook.
- Updated tests for the new Workbench model and for latest goal progress following the managed active runbook pointer.
- Rebuilt static Workbench assets.

## Files Changed

- `frontend/workbench/index.html`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `src/symphony/goal-progress-ledger.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CC2EAjZv.js`
- `src/symphony/workbench-static/assets/index-Duy8jdh2.js` removed by the Vite rebuild
- `tests/v19-goal-template.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`

## Validation Commands

- `pnpm check`: exit 0. Ran `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`.
- `pnpm test`: exit 0. `tests 661`, `suites 109`, `pass 661`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 3492.08525`.
- `pnpm workbench:build`: exit 0. Vite `v8.0.14`; `17 modules transformed`; built `src/symphony/workbench-static/index.html`, `assets/index-D3K9Dk14.css`, and `assets/index-CC2EAjZv.js`; `built in 137ms`.
- `git diff --check`: exit 0, no output.

## Additional Self-Checks

- `node --test tests/workbench-api-client.test.js tests/v19-goal-template.test.js tests/workbench-shell.test.js`: exit 0. `tests 22`, `suites 4`, `pass 22`, `fail 0`.
- `node --test tests/workbench-route-smoke.test.js`: exit 0. `tests 11`, `suites 1`, `pass 11`, `fail 0`.
- `pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json`: exit 0. Returned `goal-progress-ledger.v1` for `v20-goal-workbench-active-goal-surface` with `summary.totalTasks: 5` and task statuses sourced from `goal-runbook.v1`.
- Browser smoke at `http://127.0.0.1:8765/workbench/`: page title `v20 Workbench`; `ActiveGoalViewModel`, `goal-status`, `goal next`, `goal prompt`, and `goal closeout` visible; browser action/form/link control count `0`.

During development, one full `pnpm test` run failed because route smoke still expected `/api/goals/latest/progress` to ignore the active managed runbook. The test was updated to match the new goal-status backing, and the final full validation run passed.

## Worker Event Recorded

- Dry run: `pnpm --silent symphony goal update --goal v20-goal-workbench-active-goal-surface --task task-1 --event worker.evidence-recorded --actor codex-v20-task-1-worker --evidence-ref docs/plans/v20-task-1-worker-evidence-2026-05-29.md --dry-run --json`
- Dry-run result: exit 0, `goal-update-plan.v1`, `planHash: sha256:786eb4ac52d8e954195a07f4ed2532c0f3e962295a1ff39e086dc90548f65712`, `writesInDryRun: false`.
- Confirm: `pnpm --silent symphony goal update --goal v20-goal-workbench-active-goal-surface --task task-1 --event worker.evidence-recorded --actor codex-v20-task-1-worker --evidence-ref docs/plans/v20-task-1-worker-evidence-2026-05-29.md --confirm --plan-hash sha256:786eb4ac52d8e954195a07f4ed2532c0f3e962295a1ff39e086dc90548f65712`
- Confirm result: exit 0, `status: appended`, `eventType: worker.evidence-recorded`, `eventId: evt_14357928597e3824`, `eventHash: sha256:c3483aff52d82e45fc80a9e8e80669726a2e482c4e0e9361cea5da85fae2002f`.

## Workbench User Path Changed

The Active Goal area now starts with an `ActiveGoalViewModel` panel. A user can see which route and contract backs each current goal command:

- `goal-status` -> `goal-progress-ledger.v1`
- `goal next` -> `goal-next-action.v1`
- `goal prompt` -> `goal-prompt-pack.v1`
- `goal closeout` -> `goal-closeout-report.v1`

The command inventory is rendered as copy-only text. No browser execution or event registration entry point was added.

## Boundary Notes

- Workbench remains read-only, display-only, and copy-only.
- The Workbench model does not use the v8 scan/do/review/verify/status/continue/artifacts list as the top-level action baseline.
- No safety framework, permission system, goal framework, artifact framework, generic shell runner, browser write path, terminal action, model invocation, merge, tag, or release-ready path was added.
- Task status remains contract-backed; it is not inferred from prompt text, branch names, file names, commit messages, command text, or frontend heuristics.
- This evidence records worker implementation and self-test only. It does not claim reviewer approval, main verification, or release readiness.

## Reviewer Handoff Checklist

- Check `ActiveGoalViewModel` source projection in `frontend/workbench/src/api/contracts.js`.
- Check the Workbench panel in `frontend/workbench/src/App.jsx`.
- Check managed runbook goal-status behavior in `src/symphony/goal-progress-ledger.js`.
- Check tests covering command inventory and latest managed progress behavior.
