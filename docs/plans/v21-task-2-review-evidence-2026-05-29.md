# v21 task-2 review evidence

Goal id: `v21-goal-event-registration-workbench`  
Task id: `task-2`  
Task title: Dry-run plan preview endpoint  
Branch reviewed: `v21-task-2-dry-run-plan-preview-endpoint`  
Reviewer: `codex-v21-task-2-independent-reviewer`  
Verdict: `approved`

## Scope Checked

- Read the v21 runbook section for task-2. The accepted scope is a Workbench backend endpoint only for `symphony goal update`, `symphony goal review`, and `symphony goal gate` dry-run preview, returning the plan hash and summary of the event that would be appended.
- Read worker evidence at `docs/plans/v21-task-2-worker-evidence-2026-05-29.md`.
- Reviewed the task-2 diff against the prior task branch with `git diff e942966..HEAD`. Also checked `git diff main...HEAD`; that includes task-1 evidence and fixture files because local `main` is still `d12f428`.
- Checked current goal state and next action. Task-2 has worker evidence recorded and no reviewer verdict in the managed v21 event log.

## Files and Diff Checked

Task-2 specific diff checked with `git diff e942966..HEAD`:

- `src/symphony/console.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DEdDu08W.css`
- `src/symphony/workbench-static/assets/index-Ur7gsvXy.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v21-task-2-worker-evidence-2026-05-29.md`

Additional files present in `main...HEAD` from task-1 baseline:

- `docs/plans/v21-task-1-worker-evidence-2026-05-29.md`
- `docs/plans/v21-task-1-review-evidence-2026-05-29.md`
- `docs/plans/v21-task-1-main-verification-evidence-2026-05-29.md`
- `fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json`
- `frontend/workbench/src/api/contracts.js`

## Findings

No blockers found.

- The new route is constrained to `GET /api/goals/<goal-id|latest>/event-plan-preview`. `src/symphony/console.js` dispatches it under the existing global GET-only server guard.
- The endpoint accepts only `command=update`, `command=review`, or `command=gate`. Each command has its own query allowlist, and unsupported parameters such as `path`, `confirm`, `planHash`, repeated single-value parameters, and unsupported command names are rejected with `error-envelope.v1`.
- The endpoint calls `buildGoalUpdatePlan`, `buildGoalReviewPlan`, and `buildGoalGatePlan` directly. I did not find a new shell runner, child process path, generic command executor, permission layer, artifact framework, or goal framework in the task-2 implementation.
- The route returns `goal-update-plan.v1` with additive `eventSummary` and `previewEndpoint` fields. `eventSummary.planHash` repeats the returned `planHash`, and `writesInDryRun` comes from the dry-run plan.
- The endpoint does not call `confirmGoalUpdate`, `confirmGoalReview`, `confirmGoalGate`, or `appendGoalEvent`. Tests snapshot the temporary state directory before and after preview calls.
- Workbench now renders controlled event registration preview controls from the next-action event form model. The UI calls `fetchGoalEventPlanPreview` with `GET`, shows `planHash`, event summary fields, `writesInDryRun`, and the copy-only confirm command text. It does not provide a confirm button or non-GET write path.
- The Workbench active goal surface remains centered on goal-status, goal next, goal prompt, goal closeout, next action, event forms, and goal event/progress contracts. I did not find task-2 reverting the React Workbench to the v8 top-level `scan/do/review/verify/status/continue/artifacts` action list.
- I did not find approval or release-readiness inference from filename, branch, commit message, or frontend heuristics. The current goal next action still requires reviewer action for task-2.
- Worker evidence does not claim reviewer approval, main verification, release readiness, or self-approval. The managed v21 event log contains task-2 `worker.evidence-recorded` only.

## Commands Run

`pnpm check`

Result: exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: exit code 0.

```text
tests 674
suites 110
pass 674
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4752.966958
```

`pnpm workbench:build`

Result: exit code 0.

```text
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DEdDu08W.css   10.70 kB | gzip:   2.47 kB
src/symphony/workbench-static/assets/index-Ur7gsvXy.js   671.25 kB | gzip: 125.23 kB
built in 140ms
```

The build emitted Node WASI experimental warnings before Vite output; the command still exited 0.

`git diff --check`

Result: exit code 0, no output.

`node --test tests/v21-goal-plan-preview-api.test.js tests/workbench-api-client.test.js tests/workbench-route-smoke.test.js tests/workbench-shell.test.js`

Result: exit code 0.

```text
tests 39
suites 5
pass 39
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 274.617167
```

`pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Result: exit code 0.

```text
summary.totalTasks: 5
summary.completedTasks: 1
summary.releaseReady: false
task-1.status: main-verified
task-2.status: in-progress
task-2.statusSource: goal-event-log.v1:evt_0eb3b481abe0d63f
task-2.workerEvidenceRef: docs/plans/v21-task-2-worker-evidence-2026-05-29.md
task-2.reviewEvidenceRef: null
task-2.reviewVerdict: null
nextActions[0].label: Start task-2
```

`pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json`

Result: exit code 0.

```text
status: action-required
next.taskId: task-2
next.role: reviewer
next.phase: review
reason: Worker evidence exists for task-2 but reviewer verdict is missing.
afterCompletion.registerWith: symphony goal review
afterCompletion.allowedEvents: reviewer.approved, reviewer.needs-revision
safety.workbenchWriteAvailable: false
safety.browserExecutionAvailable: false
```

`git diff e942966..HEAD --name-status`

Result: exit code 0.

```text
A docs/plans/v21-task-2-worker-evidence-2026-05-29.md
M docs/symphony-product-contracts.md
M docs/workbench-operator-guide.md
M frontend/workbench/src/App.jsx
M frontend/workbench/src/api/client.js
M frontend/workbench/src/styles/workbench.css
M src/symphony/console.js
R085 src/symphony/workbench-static/assets/index-DQwHi8dj.css -> src/symphony/workbench-static/assets/index-DEdDu08W.css
R098 src/symphony/workbench-static/assets/index-THFje-ok.js -> src/symphony/workbench-static/assets/index-Ur7gsvXy.js
M src/symphony/workbench-static/index.html
A tests/v21-goal-plan-preview-api.test.js
M tests/workbench-route-smoke.test.js
M tests/workbench-shell.test.js
```

`nl -ba .symphony/goals/events/v21-goal-event-registration-workbench.ndjson`

Result: exit code 0.

```text
sequence 1: task-1 worker.evidence-recorded
sequence 2: task-1 reviewer.approved
sequence 3: task-1 main.verification-passed
sequence 4: task-2 worker.evidence-recorded by codex-v21-task-2-worker
```

## Boundary Notes

- I did not register a goal review event.
- Approval here is limited to task-2 implementation review on branch `v21-task-2-dry-run-plan-preview-endpoint`.
- This does not mark task-2 main-verified and does not declare release readiness.
