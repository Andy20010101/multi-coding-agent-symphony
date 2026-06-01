# v21 task-3 review evidence

Date: 2026-05-31
Goal id: `v21-goal-event-registration-workbench`
Task id: `task-3`
Branch reviewed: `v21-task-3-confirm-event-append-flow`
Reviewer role: independent re-reviewer

## Verdict

`approved`

This supersedes the earlier `needs-revision` verdict in this file. The prior blocking issue was that confirm success displayed the backend response but did not refresh the main Workbench goal-status, events, and next-action panels because the refresh callback was wired to `ActiveGoalViewModelPanel` instead of the event form path. The revision fixes that wiring in the actual source and adds a focused regression test.

## Scope checked

- Worker evidence: `docs/plans/v21-task-3-worker-evidence-2026-05-29.md`
- Prior review evidence and blocking finding: `docs/plans/v21-task-3-review-evidence-2026-05-29.md`
- Diff from `0ce236d` to `HEAD`
- Frontend confirm path in `frontend/workbench/src/App.jsx`
- Frontend API wrapper in `frontend/workbench/src/api/client.js`
- Backend preview and confirm routes in `src/symphony/console.js`
- Existing confirm implementations reached by the route: `src/symphony/goal-update.js`, `src/symphony/goal-review.js`, `src/symphony/goal-gate.js`
- Regression and acceptance tests:
  - `tests/workbench-shell.test.js`
  - `tests/workbench-api-client.test.js`
  - `tests/workbench-route-smoke.test.js`
  - `tests/v21-goal-plan-preview-api.test.js`

## Files and diff checked

`git diff --stat 0ce236d...HEAD` reported 16 changed files with 1852 insertions and 89 deletions:

- `docs/plans/v21-task-3-review-evidence-2026-05-29.md`
- `docs/plans/v21-task-3-worker-evidence-2026-05-29.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/console.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CMCXVqRN.css`
- `src/symphony/workbench-static/assets/index-Di8mm98M.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`

## Findings

No blocking findings remain.

The prior callback wiring issue is fixed in `frontend/workbench/src/App.jsx`:

- `App` passes `onGoalEventConfirmed={refreshWorkbenchContracts}` into `NextActionCard` at lines 108-112.
- `ActiveGoalViewModelPanel` is now called without that prop at line 114, and its signature only accepts `{ viewModel }` at line 292.
- `NextActionCard` accepts `onGoalEventConfirmed` at line 414 and passes it to `GoalEventFormModelView` at line 453.
- `GoalEventPlanPreview.handleConfirm()` posts the confirm request using the previewed values and `previewState.plan.planHash`, then awaits `onGoalEventConfirmed(result.data)` after a successful `goal-event-confirmation.v1` response at lines 1626-1655.

The focused regression test is present in `tests/workbench-shell.test.js` at lines 149-163. It fails if the refresh callback is not wired through `NextActionCard`, if it is still wired through `ActiveGoalViewModelPanel`, or if `NextActionCard` stops forwarding it to `GoalEventFormModelView`.

The task-3 acceptance path is covered:

- Preview is built only from the supported Workbench form commands `symphony goal update`, `symphony goal review`, and `symphony goal gate` in `buildGoalEventPreviewPath()` at `frontend/workbench/src/App.jsx` lines 1786-1829.
- Confirm body is built from the same previewed values and the returned `planHash` in `buildGoalEventConfirmBody()` at lines 1842-1889.
- The UI displays `planHash`, the preview command summary, and the confirm route before append.
- The backend confirm response returns refreshed `goal-progress-ledger.v1`, `goal-event-log.v1`, and `goal-next-action.v1` under `refreshed` in `src/symphony/console.js` lines 2654-2690.
- The frontend calls `fetchWorkbenchContracts()` through `refreshWorkbenchContracts()` after successful confirm, refreshing the main Workbench panels rather than relying only on the confirm response display.

## Boundary checks

Backend confirm remains constrained:

- `POST` requests are accepted only for `parseGoalEventPlanConfirmRequestPath()` matches; other POST API requests return `405` in `src/symphony/console.js` lines 790-810.
- Confirm paths reject query parameters and unsafe goal route segments in lines 2212-2242.
- Preview supports only `command=update|review|gate` and uses search-parameter allowlists in lines 2388-2474.
- Confirm supports only `command=update|review|gate`, requires `planHash`, and uses body key allowlists before calling `confirmGoalUpdate`, `confirmGoalReview`, or `confirmGoalGate` in lines 2527-2638.
- Unknown confirm fields are rejected by `assertOnlyBodyKeys()` in lines 2732-2743.
- `confirmGoalUpdate`, `confirmGoalReview`, and `confirmGoalGate` recalculate the plan hash and reject mismatches before appending.

No generic shell runner or broader framework was added for this task:

- I did not find a Workbench path that accepts arbitrary shell command text, arbitrary local path reads, package installs, merges, tags, model calls, or generic write operations.
- The frontend still uses the dedicated `confirmGoalEventPlan()` wrapper with `POST`, JSON content type, and `goal-event-confirmation.v1` response validation.
- `tests/workbench-route-smoke.test.js` keeps static checks against browser execution, write, download, local-open, model entry points, non-approved click handlers, and non-confirm request bodies.
- The Workbench source stays on goal/runbook/next-action surfaces and does not reintroduce a v8 top-level action list.
- I did not find frontend approval/readiness heuristics based on branch names, file names, commit messages, or command text.
- I did not find worker self-approval. This reviewer did not register a goal review event.

## Commands run

`node --test tests/v21-goal-plan-preview-api.test.js tests/workbench-api-client.test.js tests/workbench-route-smoke.test.js tests/workbench-shell.test.js`

Result: exit code `0`.

```text
tests 43
suites 5
pass 43
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 216.908916
```

Relevant passing cases included:

- `confirms a matching update plan hash, appends one event, and returns refreshed goal state`
- `rejects mismatched plan hashes, unsupported confirm commands, unknown fields, and unsafe goal refs without appending`
- `posts controlled goal event confirm requests with a JSON body and validates the confirmation contract`
- `statically keeps the Workbench source free of execution, write, download, local-open, and model entry points`
- `wires successful goal event confirms to refresh Workbench contracts through the next action card`

`pnpm check`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`git diff --check`

Result: exit code `0`. No output.

`pnpm workbench:build`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-CMCXVqRN.css   10.83 kB │ gzip:   2.50 kB
src/symphony/workbench-static/assets/index-Di8mm98M.js   678.69 kB │ gzip: 126.36 kB

✓ built in 139ms
```

`git status --short`

Result before this evidence update: exit code `0`. No output.

## Review event registration

No goal review event was registered by this reviewer.
