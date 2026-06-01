# v32 task-5 worker evidence

Date: 2026-06-01

Goal: `v32-release-manager-workspace-v2`
Task: `task-5`
Release: `v32 Release Manager Workspace v2`
Role: worker
Phase: implement

## Implementation summary

Task-5 is implemented in the Workbench release closeout path as `NextVersionHandoffDraft`. The draft is generated from active goal closeout data, release baseline resolver fields, release evidence draft refs, tag evidence draft refs, event-backed task evidence, release gate evidence, latest run id, and implemented Workbench capability flags.

The draft does not create a v33 goal, does not enter v33, does not run shell commands from the browser, does not invoke a model, does not read evidence bodies, does not open local files, does not download artifacts, does not merge, push, tag, publish, self-approve, or declare `release.ready`.

The current checkout already contains the v32 task-1 through task-4 Workbench changes. I used the current checkout fallback and did not create a branch, merge, reset, stash, clean, push, tag, or register goal events.

## Workbench user path

1. Start the Workbench from the repo root with `pnpm workbench:build` and `pnpm symphony console`.
2. Open `http://127.0.0.1:8765/workbench/`.
3. In the active goal closeout path, open `Closeout Gaps`.
4. Use these sections in order: `release baseline resolver`, `release verification checklist`, `release evidence draft`, `tag evidence draft / prompt`, then `next-version handoff draft`.
5. Copy the markdown in `next-version handoff draft` as v33 starting context after checking the closeout and release evidence refs. The panel exposes `createsManagedGoal=false` and `entersNextVersion=false`.

## Files changed

- `frontend/workbench/src/api/contracts.js`: projects `NextVersionHandoffDraft`, task anchors, release gate anchors, evidence refs, implemented capabilities, copy-only commands, and safety fields from existing goal/runbook/event/closeout models.
- `frontend/workbench/src/App.jsx`: renders the `next-version handoff draft` section inside `Closeout Gaps`.
- `frontend/workbench/src/styles/workbench.css`: includes styling for the next-version anchor and capability lists.
- `tests/workbench-api-client.test.js`: covers the v32 next-version handoff draft projection, v33 label, release/tag evidence refs, copy-only commands, and safety flags.
- `tests/workbench-shell.test.js`: checks that the closeout panel exposes `NextVersionHandoffDraft` without shell execution, tagging, clipboard, or local-open controls.
- `docs/symphony-product-contracts.md`: documents `NextVersionHandoffDraft` as a release closeout projection with no v33 goal creation or release readiness inference.
- `docs/workbench-operator-guide.md`: documents the closeout user path and the display-only next-version draft boundary.
- `src/symphony/workbench-static/index.html` and `src/symphony/workbench-static/assets/index-BY5UaxlX.css`, `src/symphony/workbench-static/assets/index-BDjDodcJ.js`: refreshed by `pnpm workbench:build`.
- `docs/plans/v32-task-5-worker-evidence-2026-06-01.md`: this worker evidence file.

## Validation commands

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm check` | 0 | JavaScript syntax check passed for source, scripts, plugins, and tests. |
| `pnpm test` | 0 | `759` tests passed, `0` failed. |
| `pnpm workbench:build` | 0 | Vite built Workbench static output under `src/symphony/workbench-static/`. |
| `git diff --check` | 0 | No whitespace errors reported. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | Goal ledger shows task-1 through task-4 `main-verified`; task-5 remains `planned` with no worker evidence event. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Next action is task-5, role `worker`, phase `implement`, reason `No explicit worker evidence is recorded for task-5.` |

## Boundary notes

- Workbench remains on the latest goal/runbook/next-action path: `goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest`.
- The next-version draft is display-only and copy-only. It has no confirm route, no goal init route, no model invocation, and no browser command runner.
- State comes from backend contracts and explicit events: `goal-closeout-report.v1`, `release-baseline-resolver.v1`, `goal-event-log.v1`, `goal-progress-ledger.v1`, `goal-operation-runs.v1`, release/tag evidence draft models, and latest run context.
- The draft does not infer release readiness from filenames, branch names, tags, commit messages, prompt text, frontend state, test names, or release notes text.
- v8 compatibility commands remain compatibility/script commands and are not presented as the Workbench top-level model.
- I did not run `symphony goal update`, `symphony goal review`, `symphony goal gate`, or `goal closeout` event registration commands.

## Reviewer handoff checklist

- Verify `projectNextVersionHandoffDraft` only reads active closeout, event, ledger, release baseline, release/tag draft, latest run, and capability projection fields.
- Verify the rendered `NextVersionHandoffDraft` panel has no execution controls and no clipboard, file-open, download, tag, push, publish, merge, or goal-init path.
- Verify tests cover v33 draft generation, evidence anchors, release gate anchors, implemented capabilities, and `entersNextVersion=false`.
- Verify the Workbench build output matches the current React/Vite source.
- Verify this evidence file is the only task-5 event evidence intended for later registration.
