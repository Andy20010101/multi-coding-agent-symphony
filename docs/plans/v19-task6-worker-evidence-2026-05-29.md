# v19 Task 6 Worker Evidence

Date: 2026-05-29
Goal ID: `v19-goal-runbook-next-action`
Task ID: `task-6`
Branch: `v19-task6-workbench-active-goal`
Task: Workbench Active Goal Control Center

## Implemented

- Added read-only console API routes for `goal-runbook.v1`, `goal-next-action.v1`, `goal-prompt-pack.v1`, and `goal-closeout-report.v1`.
- Added Workbench API client parsing for the four v19 contracts and active-goal progress/events support.
- Added Workbench panels for Active Goal Runbook, Next Action Card, Prompt Preview, and Closeout Gaps.
- Updated Workbench route smoke and frontend boundary tests for the v19 GET-only routes and traversal rejection.
- Rebuilt static Workbench assets under `src/symphony/workbench-static`.

## Workbench Surface

- Active Goal Runbook shows the active goal, runbook tasks, task status, and evidence source fields from v19 contracts.
- Next Action Card shows the next role, task, rationale, and copy-only prompt availability from `goal-next-action.v1`.
- Prompt Preview shows copy-only prompt text from `goal-prompt-pack.v1`.
- Closeout Gaps shows unresolved evidence and release-gate gaps from `goal-closeout-report.v1`.

## Verification

- `pnpm check`: exit 0. Ran `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`.
- `pnpm test`: exit 0. `tests 660`, `suites 109`, `pass 660`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 3427.607375`.
- `pnpm workbench:build`: exit 0. Vite `v8.0.14`; `17 modules transformed`; built `src/symphony/workbench-static/index.html`, `assets/index-D3K9Dk14.css`, and `assets/index-Duy8jdh2.js`; `built in 137ms`.
- `git diff --check`: exit 0, no output.

## Browser Check

Tested `http://127.0.0.1:8766/workbench/` against a temporary active goal state created outside the repo.

- Active Goal Runbook visible: yes.
- Next Action Card visible: yes.
- Prompt Preview visible: yes.
- Closeout Gaps visible: yes.
- Copy-only `/goal` prompt text visible: yes.
- Buttons: 0.
- Forms: 0.
- Links: 0.

## Boundary Notes

- Workbench remains read-only, display-only, and copy-only.
- Workbench uses only GET routes for the v19 Active Goal Control Center data.
- Prompt Preview renders selectable copy-only text only.
- No execute, confirm, terminal, download, open local file, shell, model invocation, or agent entry point was added.
- No browser-side event log write or runbook registry write was added.
- Browser code does not write the event log or runbook registry.
- Task status remains sourced from ledger/events contracts, not prompt text, branch names, file names, or command text.
- Existing v16 safe preview, v17 goal progress, and v18 events timeline/evidence matrix panels were not removed or replaced.
- The passing `pnpm test` run includes the v16 Workbench route smoke/server parity tests, v17 read-only console API and goal-progress tests, and v18 goal events/event log tests.

## Scope Statement

This file records worker evidence only. It does not claim reviewer approval, main verification, or release readiness.
