# v21 task-3 review evidence

Date: 2026-05-29
Goal id: `v21-goal-event-registration-workbench`
Task id: `task-3`
Branch reviewed: `v21-task-3-confirm-event-append-flow`
Reviewer role: independent reviewer

## Verdict

`needs-revision`

## Scope checked

- Task-3 runbook fixture: `fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json`
- Worker evidence: `docs/plans/v21-task-3-worker-evidence-2026-05-29.md`
- Diff from `0ce236d` to `HEAD`
- Backend confirm route and body validation in `src/symphony/console.js`
- Existing confirm implementations in `src/symphony/goal-update.js`, `src/symphony/goal-review.js`, and `src/symphony/goal-gate.js`
- Frontend preview and confirm path in `frontend/workbench/src/App.jsx` and `frontend/workbench/src/api/client.js`
- Task-3 tests and Workbench static checks
- Product/operator docs changed in this branch

## Files and diff checked

`git diff --stat 0ce236d...HEAD` reported 15 changed files with 1535 insertions and 89 deletions:

- `src/symphony/console.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BngtQc4P.js`
- `src/symphony/workbench-static/assets/index-CMCXVqRN.css`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v21-task-3-worker-evidence-2026-05-29.md`

## Findings

### Needs revision: confirm success does not refresh the main Workbench contracts

Task-3 requires the frontend path to support preview, plan hash inspection, confirm, then refresh `goal-status`, events, and next action.

The refresh function exists in `frontend/workbench/src/App.jsx`, but it is wired to `ActiveGoalViewModelPanel` at line 110. The event form is rendered under `NextActionCard`, which is created at line 108 without `onGoalEventConfirmed`. `NextActionCard` also declares only `{ nextAction, route }` at line 410, so the callback passed into `GoalEventFormModelView` at line 449 is always `undefined`.

Evidence command:

```text
node - <<'NODE'
const { readFileSync } = require('node:fs');
const app = readFileSync('frontend/workbench/src/App.jsx', 'utf8');
const nextActionInvocation = app.match(/<NextActionCard[^>]*>/)?.[0] ?? '';
const viewModelInvocation = app.match(/<ActiveGoalViewModelPanel[^>]*>/)?.[0] ?? '';
const nextActionSignature = app.match(/function NextActionCard\([^)]*\)/)?.[0] ?? '';
const viewModelSignature = app.match(/function ActiveGoalViewModelPanel\([^)]*\)/)?.[0] ?? '';
console.log(JSON.stringify({
  nextActionInvocation,
  nextActionHasCallback: nextActionInvocation.includes('onGoalEventConfirmed'),
  viewModelInvocation,
  viewModelHasCallback: viewModelInvocation.includes('onGoalEventConfirmed'),
  nextActionSignature,
  viewModelSignature
}, null, 2));
NODE
```

Result:

```json
{
  "nextActionInvocation": "<NextActionCard nextAction={model.activeGoal.nextAction} route={findRoute(model.routeStates, 'goalNextAction')} />",
  "nextActionHasCallback": false,
  "viewModelInvocation": "<ActiveGoalViewModelPanel viewModel={model.activeGoal.viewModel} onGoalEventConfirmed={refreshWorkbenchContracts} />",
  "viewModelHasCallback": true,
  "nextActionSignature": "function NextActionCard({ nextAction, route })",
  "viewModelSignature": "function ActiveGoalViewModelPanel({ viewModel, onGoalEventConfirmed })"
}
```

Impact: confirm can append the event and display the confirmation response, but the Workbench panels backed by `fetchWorkbenchContracts()` are not refreshed after success. Existing tests pass because they verify the POST wrapper and route behavior, not the callback wiring from `NextActionCard` to `GoalEventPlanPreview`.

Revision instructions:

- Pass `onGoalEventConfirmed={refreshWorkbenchContracts}` to `NextActionCard`.
- Update `NextActionCard` to accept `onGoalEventConfirmed` and pass it into `GoalEventFormModelView`.
- Remove the unused `onGoalEventConfirmed` prop from `ActiveGoalViewModelPanel` unless another path uses it.
- Add a focused test that fails if a successful confirm does not trigger a contracts refresh. A static source test is acceptable if the current test setup does not mount React components.

## Boundary checks

Backend confirm scope is narrow:

- `src/symphony/console.js` exposes `POST /api/goals/<goal-id|latest>/event-plan-confirm`.
- Confirm requires JSON, limits body size to 32 KiB, rejects query parameters, rejects unsafe goal route segments, and uses a body key allowlist.
- `command` is limited to `update`, `review`, and `gate`.
- The backend calls `confirmGoalUpdate`, `confirmGoalReview`, or `confirmGoalGate`; those functions recalculate the plan hash and reject mismatches before `appendGoalEvent`.
- I did not find a generic shell runner, model call, merge, tag, arbitrary path read, or package install path in the confirm implementation.

Frontend confirm scope is partly present:

- `frontend/workbench/src/api/client.js` uses a dedicated `confirmGoalEventPlan()` wrapper with `POST`, JSON content type, and `goal-event-confirmation.v1` response validation.
- `frontend/workbench/src/App.jsx` builds confirm bodies from the previewed values and the returned `planHash`.
- The missing callback wiring prevents the required full refresh of Workbench goal-status/events/next-action after confirm.

No v8 top-level action list, approval/readiness inference from branch/file/commit/frontend heuristics, or worker self-approval was found in the reviewed diff.

## Commands run

`node --test tests/v21-goal-plan-preview-api.test.js tests/workbench-api-client.test.js tests/workbench-route-smoke.test.js tests/workbench-shell.test.js`

Result: exit code `0`.

```text
tests 42
suites 5
pass 42
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 290.911958
```

`pnpm check`

Result: exit code `0`.

```text
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm workbench:build`

Result: exit code `0`.

```text
vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-CMCXVqRN.css   10.83 kB │ gzip:   2.50 kB
src/symphony/workbench-static/assets/index-BngtQc4P.js   678.70 kB │ gzip: 126.35 kB
✓ built in 142ms
```

`pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Result: exit code `0`.

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 2
task-1.status: main-verified
task-2.status: main-verified
task-3.status: in-progress
task-3.workerEvidenceRef: docs/plans/v21-task-3-worker-evidence-2026-05-29.md
summary.releaseReady: false
```

`git status --short`

Result before writing this evidence file: exit code `0`, no output.

## Review event registration

No goal review event was registered by this reviewer.
