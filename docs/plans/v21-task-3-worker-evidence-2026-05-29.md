# v21 task-3 worker evidence

Date: 2026-05-29  
Goal id: `v21-goal-event-registration-workbench`  
Task id: `task-3`  
Branch: `v21-task-3-confirm-event-append-flow`  
Role: worker

## User-visible value

Workbench users can preview a goal event plan, inspect the dry-run `planHash`, confirm the matching event append, and then see refreshed goal status, events, and next action state.

## Implementation summary

- Added controlled `POST /api/goals/<goal-id|latest>/event-plan-confirm`.
- The confirm route accepts only JSON bodies for `command=update`, `command=review`, or `command=gate`.
- Confirm uses the existing `confirmGoalUpdate`, `confirmGoalReview`, and `confirmGoalGate` functions. The backend recalculates the plan hash and refuses mismatches before writing.
- Confirm responses include `goal-event-confirmation.v1` plus refreshed `goal-progress-ledger.v1`, `goal-event-log.v1`, and `goal-next-action.v1` payloads.
- Workbench UI now keeps the dry-run preview step, shows the returned plan hash, sends the matching confirm request, and refreshes Workbench contracts after a successful append.
- Operator docs and product contracts now describe the v21 confirm exception without changing the top-level Workbench model into a generic command runner.

## Files changed

- `src/symphony/console.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BngtQc4P.js`
- `src/symphony/workbench-static/assets/index-CMCXVqRN.css`
- Removed stale built assets:
  - `src/symphony/workbench-static/assets/index-Ur7gsvXy.js`
  - `src/symphony/workbench-static/assets/index-DEdDu08W.css`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v21-task-3-worker-evidence-2026-05-29.md`

## Commands run

`node --test tests/v21-goal-plan-preview-api.test.js`

Result: exit code `0`.

```text
tests 5
suites 1
pass 5
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 151.71525
```

`node --test tests/workbench-api-client.test.js`

Result: exit code `0`.

```text
tests 15
suites 1
pass 15
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 98.013667
```

`node --test tests/workbench-shell.test.js`

Result: exit code `0`.

```text
tests 11
suites 2
pass 11
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 111.239084
```

`node --test tests/workbench-route-smoke.test.js`

Result: exit code `0`.

```text
tests 11
suites 1
pass 11
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 238.385834
```

`pnpm check`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: exit code `0`.

```text
tests 677
suites 110
pass 677
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4140.036
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
✓ built in 141ms
```

`git diff --check`

Result: exit code `0`. No output.

`pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Result: exit code `0`.

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 2
task-1.status: main-verified
task-2.status: main-verified
task-3.status: planned
task-4.status: planned
task-5.status: planned
summary.releaseReady: false
nextActions[0].label: Start task-3
```

Local Workbench HTTP check:

```text
pnpm workbench:dev
curl -sS -I http://127.0.0.1:5173/workbench/
HTTP/1.1 200 OK
Content-Type: text/html
```

The Browser plugin JavaScript control tool was not exposed in this session after tool discovery, so in-app browser interaction was not available. The local Vite Workbench URL was still checked over HTTP.

## Workbench user path changed

1. Open the active goal next action.
2. Choose a supported event form for `goal update`, `goal review`, or `goal gate`.
3. Run dry-run preview and inspect `planHash`.
4. Click `Confirm event append`.
5. Workbench sends the matching command body with the dry-run `planHash`.
6. The backend appends the event only if the recalculated hash matches.
7. Workbench refreshes goal status, events, and next action from backend contracts.

## Boundary notes

- No generic shell runner was added.
- Confirm is constrained to `goal update`, `goal review`, and `goal gate`.
- Confirm requires the dry-run `planHash`; mismatched hashes are rejected without appending.
- Unsupported fields such as arbitrary `path` are rejected.
- Workbench does not infer approval, main verification, or release readiness from file names, branch names, commit messages, or frontend heuristics.
- This worker did not register reviewer, main-verification, or release events.
- This worker did not self-approve.

## Reviewer handoff checklist

- Verify the confirm route rejects unsupported commands and fields.
- Verify plan hash mismatch leaves the managed event journal unchanged.
- Verify frontend confirm uses the previewed values and returned plan hash.
- Verify Workbench still uses latest goal/runbook/next-action surfaces rather than the old v8 action list.
