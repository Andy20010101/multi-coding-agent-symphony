# v21 task-2 main verification evidence

Goal id: `v21-goal-event-registration-workbench`  
Task id: `task-2`  
Task title: Dry-run plan preview endpoint  
Branch verified: `v21-task-2-dry-run-plan-preview-endpoint`  
Verified tree: `684108b91eae02cf9ddcc772e56b3977ccf99e12`  
Verifier: `codex-v21-task-2-main-verifier`  
Gate recommendation: `passed`

## Preconditions checked

- Reviewer evidence exists at `docs/plans/v21-task-2-review-evidence-2026-05-29.md`.
- Review evidence states `Verdict: approved` for task-2 and reviewer `codex-v21-task-2-independent-reviewer`.
- Managed goal event log includes task-2 `reviewer.approved` at sequence 5, event id `evt_5d58dd3e4958cd30`, with evidence ref `docs/plans/v21-task-2-review-evidence-2026-05-29.md`.
- `pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json` reports task-2 next role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-2 but main verification is missing.`

## Scope checked

- Read v21 runbook task-2 requirements in `docs/plans/workbench-v20-v28-goal-runbooks/v21_workbench-goal-event-registration_goal_runbook_latest.md`.
- Read worker evidence at `docs/plans/v21-task-2-worker-evidence-2026-05-29.md`.
- Read review evidence at `docs/plans/v21-task-2-review-evidence-2026-05-29.md`.
- Checked current integrated working tree at HEAD `684108b91eae02cf9ddcc772e56b3977ccf99e12`. `main` remains `d12f428078e4ebcf3c1d68e982f940f53e9941dc`; merge-base `main HEAD` is `d12f428078e4ebcf3c1d68e982f940f53e9941dc`, so this branch is fast-forwardable from local `main`. I did not switch branches or merge because this verifier was asked to verify the current integrated working tree and not register gate state.
- Task-2 specific diff checked with `git diff --name-status e942966..HEAD`.

Task-2 files in that diff:

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

## Acceptance verification

- `src/symphony/console.js` exposes `GET /api/goals/latest/event-plan-preview` and `GET /api/goals/<goal-id>/event-plan-preview`.
- The preview builder accepts only `command=update`, `command=review`, or `command=gate`, with per-command query allowlists.
- The route calls `buildGoalUpdatePlan`, `buildGoalReviewPlan`, and `buildGoalGatePlan` directly.
- Unsupported commands, `confirm`, `planHash`, repeated single-value params, `path`, and unsafe goal route segments return `error-envelope.v1`; tests cover these probes.
- Response includes `goal-update-plan.v1`, `planHash`, additive `eventSummary`, `eventSummary.planHash`, and `eventSummary.writesInDryRun: false`.
- Tests snapshot the state directory before and after preview requests, confirming preview does not append goal events.
- `frontend/workbench/src/api/client.js` calls the preview route with `method: 'GET'`.
- `frontend/workbench/src/App.jsx` renders a `Preview dry-run plan` control, builds the controlled preview query from the event form model, and displays `planHash`, command, event type, task, actor, `writesInDryRun`, and copy-only confirm command text.

## Boundary notes

- No worker implementation changes were made by this verifier.
- No reviewer approval was created by this verifier.
- No `symphony goal gate` confirm command was run, and no task-2 main-verification event was registered.
- No release-ready event was declared.
- No generic shell runner, generic command executor, permission framework, goal framework, or artifact framework was added in task-2.
- `rg -n "appendGoalEvent|confirmGoalUpdate|confirmGoalReview|confirmGoalGate" src/symphony/console.js frontend/workbench/src/App.jsx frontend/workbench/src/api/client.js` returned exit code 1 with no matches.
- `rg -n "node:child_process|child_process|spawn\\s*\\(|execFile\\s*\\(" src/symphony/console.js frontend/workbench/src/App.jsx frontend/workbench/src/api/client.js` returned exit code 1 with no matches.
- Workbench remains centered on latest goal/runbook/next-action surfaces. It does not restore the v8 top-level `scan/do/review/verify/status/continue/artifacts` action list.
- Status remains event-backed. I found no approval, main-verification, or release-ready inference from branch names, filenames, commit messages, paths, or frontend heuristics.
- Worker evidence explicitly states the worker did not self-approve.

## Commands run

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
duration_ms 3638.191459
```

`pnpm workbench:build`

Result: exit code 0. The command emitted Node WASI experimental warnings, then completed successfully.

```text
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DEdDu08W.css   10.70 kB | gzip:   2.47 kB
src/symphony/workbench-static/assets/index-Ur7gsvXy.js   671.25 kB | gzip: 125.23 kB
built in 149ms
```

`git diff --check`

Result: exit code 0, no output.

`pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Result: exit code 0.

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 2
summary.releaseReady: false
task-1.status: main-verified
task-2.status: approved
task-2.statusSource: goal-event-log.v1:evt_5d58dd3e4958cd30
task-2.workerEvidenceRef: docs/plans/v21-task-2-worker-evidence-2026-05-29.md
task-2.reviewEvidenceRef: docs/plans/v21-task-2-review-evidence-2026-05-29.md
task-2.reviewVerdict: APPROVED
task-2.mainVerificationRef: null
nextActions[0].label: Start task-3
```

`pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json`

Result: exit code 0.

```text
status: action-required
next.taskId: task-2
next.role: main-verifier
next.phase: main-verification
reason: Reviewer approved task-2 but main verification is missing.
afterCompletion.registerWith: symphony goal gate --gate main-verification
afterCompletion.allowedEvents: main.verification-passed, main.verification-failed
safety.workbenchWriteAvailable: false
safety.browserExecutionAvailable: false
safety.modelInvocationAvailable: false
```

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
duration_ms 284.405458
```

`nl -ba .symphony/goals/events/v21-goal-event-registration-workbench.ndjson`

Result: exit code 0. Relevant lines:

```text
4 task-2 worker.evidence-recorded by codex-v21-task-2-worker, evidence docs/plans/v21-task-2-worker-evidence-2026-05-29.md
5 task-2 reviewer.approved by codex-v21-task-2-reviewer, evidence docs/plans/v21-task-2-review-evidence-2026-05-29.md, verdict APPROVED
```

`git status --short`

Result: exit code 0.

```text
?? docs/plans/v21-task-2-review-evidence-2026-05-29.md
```

After writing this evidence file, the expected additional untracked file is `docs/plans/v21-task-2-main-verification-evidence-2026-05-29.md`.

## Gate recommendation

`passed`

Rationale: task-2 has explicit reviewer-approved evidence, the current integrated tree satisfies the dry-run preview endpoint acceptance criteria, full checks passed, targeted endpoint/UI tests passed, and the checked boundaries remain intact. The next operation should be the normal dry-run then confirm registration for the task-2 `main-verification` gate, performed outside this verifier.
