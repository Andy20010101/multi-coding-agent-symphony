# v19 Task 7 worker evidence

日期：2026-05-29
Goal id：`v19-goal-runbook-next-action`
Task id：`task-7`
Branch：`v19-task7-docs-operator-guide`

## scope

Task 7 covers docs, operator guide, task evidence index, and release evidence draft. The branch updates:

- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v19-task-evidence-index-2026-05-29.md`
- `docs/plans/v19-release-evidence-2026-05-29.md`

The worker event was registered after the dry-run plan was reviewed:

- dry-run plan id：`plan_f7f1d97c224c6cdb`
- dry-run plan hash：`sha256:139f2ef07432696ad709d80ff218e30fe488b621d3d960ecb19018a578578617`
- confirmed event：`goal-event-log.v1:evt_f7f1d97c224c6cdb`
- event type：`worker.evidence-recorded`
- event hash：`sha256:f3adc975c1c208f61d64de5f82e02a1141441707d9c0274e258d189e79177d8b`

## documentation changes

`README.md` now lists the v19 plan, execution prompts, task evidence index, and release evidence draft. Current status says v19 is an implemented draft and keeps the latest completed release and current repository tag at `v18`.

`docs/symphony-product-contracts.md` documents the v19 contract family:

- `goal-runbook.v1`
- `goal-next-action.v1`
- `goal-prompt-pack.v1`
- `goal-closeout-report.v1`

The contract notes state that prompts and commands are copy-only, Workbench remains read-only, and release-ready requires an explicit `release.ready-declared` event.

`docs/workbench-operator-guide.md` adds the v19 Active Goal Control Center operation flow. It lists the read-only Active Goal routes and states that Workbench cannot confirm runbooks, execute prompts, call models, write files, register events, merge, tag, or infer release-ready.

`docs/plans/v19-task-evidence-index-2026-05-29.md` records the current v19 planning/bootstrap/task evidence state. It keeps task-7 and task-8 incomplete until explicit events exist, records release gates as `unknown`, and notes the current managed runbook gap.

`docs/plans/v19-release-evidence-2026-05-29.md` is a release evidence draft. It records Task 7 command evidence and keeps release status as `NOT READY`.

## command evidence

Commands were run from the repository root on the Task 7 branch.

| Command | Result | Notes |
|---|---|---|
| `pnpm check` | Passed. | `node --check` completed for source, scripts, plugins, and tests. |
| `pnpm test` | Passed. | 109 suites, 660 tests, 660 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo; duration `3535.597834ms`. |
| `pnpm workbench:build` | Passed. | Vite `v8.0.14` transformed 17 modules and built `src/symphony/workbench-static/index.html`, `index-D3K9Dk14.css`, and `index-Duy8jdh2.js` in `138ms`; Node printed the existing WASI experimental warning. |
| `git diff --check` | Passed. | No output. |

## release wording

This worker evidence does not declare v19 released or tagged. It does not claim reviewer approval, main verification, release gate pass, release-ready, or tag evidence.

Passing `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check` is command evidence for this branch only. Release-ready still requires an explicit `symphony goal gate --gate release.ready --status declared` confirm flow that records `release.ready-declared`.

## reviewer handoff

Review the five files listed in the scope section and the Task 7 event registration. The review should verify that the docs match the implemented v19 contracts and Workbench read-only boundary, and that release-ready is not inferred from passing commands.
