# v29 task-5 worker evidence

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Task id: `task-5`  
Task title: Worker evidence handoff after implementation run  
Expected branch: `v29-task-5-worker-evidence-handoff-after-implementation-run`  
Actual checkout: `v29-task-4-operation-console-and-run-result-bridge`

## Branch and checkout fallback

Initial command:

```sh
git status -sb && git branch --show-current
```

Result: exit 0. The checkout was `v29-task-4-operation-console-and-run-result-bridge` with existing v29 task-1 through task-4 changes, evidence files, fixture changes, and Workbench static asset changes already present. The intended branch setup was `git checkout main && git pull --ff-only && git checkout -b v29-task-5-worker-evidence-handoff-after-implementation-run`. That path was blocked by the intentionally dirty current checkout. I used the repo-local/current-checkout fallback and did not revert or overwrite the existing v29 worker changes.

## Implementation summary

Task-5 connects confirmed implementation runs back to worker evidence registration.

- `frontend/workbench/src/api/contracts.js` now projects a v29 worker evidence handoff from `goal-operation-runs.v1` when the active goal/task has a confirmed `commandKind: "implementation"` operation and the current next action still allows `worker.evidence-recorded`.
- The handoff pre-fills the existing `symphony goal update --event worker.evidence-recorded` form with worker actor, managed evidence artifact ref, operation id, run id, execution plan id, run/verifier status, and source workspace when present.
- The same handoff feeds the existing `event-plan-preview` and `event-plan-confirm` path. It does not create a new command path or a shell runner.
- `frontend/workbench/src/App.jsx` shows the source operation/run context in the existing worker evidence handoff panel.
- `tests/workbench-api-client.test.js` verifies that a confirmed implementation run produces the handoff, pre-fills the worker evidence form, exposes the managed artifact ref, and can call `event-plan-preview` without appending a goal event.
- `docs/workbench-operator-guide.md` and `docs/symphony-product-contracts.md` document the v29 handoff boundary and registry source.
- `pnpm workbench:build` regenerated the Workbench static bundle under `src/symphony/workbench-static/`.

## Files changed for task-5

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/workbench-api-client.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CdwLo3Cv.js`
- `src/symphony/workbench-static/assets/index-DEceTgZX.css`

The checkout also contains pre-existing v29 task-1 through task-4 dirty files and untracked evidence files that were present before task-5 work started. I did not revert them.

## Workbench user path changed

Path:

```text
Open active goal -> confirm controlled implementation run -> Operation Console records confirmed implementation -> Next Action Card -> event registration forms -> worker evidence handoff -> goal update dry-run preview -> plan-hash confirm
```

The visible Workbench handoff is anchored to:

- active goal id from `goal-next-action.v1`;
- active task id from `goal-next-action.v1`;
- confirmed implementation operation from `goal-operation-runs.v1`;
- managed evidence artifact ref from the confirmed run;
- existing `goal-update-plan.v1` dry-run and confirm endpoints.

The browser still does not read the evidence body, open the source workspace, run shell commands, invoke models or agents, approve review, run main verification, merge, push, tag, download artifacts, or infer readiness from artifact names.

## Acceptance command results

```sh
pnpm check
```

Result: exit 0. `node --check` completed for `src/*.js`, adapters, ensemble, integrations, intake, symphony modules, trackers, scripts, plugin eval replay, and tests.

```sh
pnpm test
```

Result: exit 0. Node test runner completed with `tests 739`, `suites 115`, `pass 739`, `fail 0`, `duration_ms 4528.830625`.

```sh
pnpm workbench:build
```

Result: exit 0. Vite built the Workbench bundle:

- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DEceTgZX.css`
- `src/symphony/workbench-static/assets/index-CdwLo3Cv.js`

```sh
git diff --check
```

Result: exit 0. No whitespace errors were reported.

```sh
pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
```

Result: exit 0. Ledger summary reported `totalTasks: 5`, `completedTasks: 4`, `blockedTasks: 0`, `needsReviewTasks: 0`, `needsRevisionTasks: 0`, `releaseReady: false`. Task-1 through task-4 are `main-verified`; task-5 is still `planned` with `workerEvidenceRef: null`, as expected before the controller registers this worker evidence.

Additional focused check:

```sh
pnpm test -- tests/workbench-api-client.test.js
```

Result: exit 0. Workbench API client suite completed with `tests 34`, `pass 34`, `fail 0`.

## Boundary notes

- No `symphony goal update --confirm` command was run.
- No reviewer verdict, main verification gate, release gate, merge, push, tag, or publish action was performed.
- No v8 `scan/do/review/verify/status/continue/artifacts` top-level Workbench action model was introduced.
- No generic shell runner, browser terminal, model invocation path, permission system, goal framework, artifact framework, or command DSL was introduced.
- Worker evidence registration remains an explicit backend event path through dry-run preview and plan-hash confirm.
- Operation registry entries remain run context, not approval, main verification, or release readiness.

## Reviewer handoff checklist

- Inspect `frontend/workbench/src/api/contracts.js` for the v29 handoff projection and confirm it only uses `goal-operation-runs.v1`, `goal-next-action.v1`, and controlled evidence refs.
- Inspect `frontend/workbench/src/App.jsx` to confirm the panel only displays context and reuses the existing `GoalEventPlanPreview` flow.
- Inspect `tests/workbench-api-client.test.js` for coverage that dry-run preview does not append events.
- Confirm docs in `docs/workbench-operator-guide.md` and `docs/symphony-product-contracts.md` match the implemented boundary.
- Re-run `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check` if the reviewer checkout changes.

## Recovery steps

If the handoff does not appear in Workbench:

1. Read `GET /api/goals/<goal-id>/next` and confirm the active task is still a worker task with `worker.evidence-recorded` in `afterCompletion.allowedEvents`.
2. Read `GET /api/goals/<goal-id>/operations` and confirm there is a `status: "confirmed"` implementation operation for the same goal/task.
3. Confirm the operation run result has `mainWorktreeWrites: false`, isolated workspace writes, and an evidence artifact ref.
4. Use the terminal copy-only command for `symphony goal update --event worker.evidence-recorded --dry-run --json` if the browser form is unavailable.
5. Do not register reviewer, main verification, or release events from the worker handoff path.
