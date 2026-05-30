# v21 task-4 main verification evidence

Goal id: `v21-goal-event-registration-workbench`
Task id: `task-4`
Task title: `Evidence ref helper`
Branch checked: `v21-task-4-evidence-ref-helper`
Verifier: `v21 task-4 main-verifier subagent`
Date verified: 2026-05-31
Gate recommendation: `passed`

## Reviewer approval precondition

Explicit reviewer approval evidence exists in `docs/plans/v21-task-4-review-evidence-2026-05-29.md`.

The file states `Verdict: approved` and says the review supersedes the earlier `needs-revision` verdict. The superseded blocker was backend acceptance of `command-evidence:*` and `external-note:*`; the approved re-review states those are now rejected for `goal update`, `goal review`, and `goal gate`.

Current goal state also shows task-4 review approval:

```text
pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
task-4 status: approved
task-4 statusSource: goal-event-log.v1:evt_d427eabb9f9c5747
task-4 reviewVerdict: APPROVED
task-4 workerEvidenceRef: docs/plans/v21-task-4-worker-evidence-2026-05-29.md
task-4 reviewEvidenceRef: docs/plans/v21-task-4-review-evidence-2026-05-29.md
task-4 mainVerificationRef: null
```

## Scope checked

- Read task-4 scope in `docs/plans/workbench-v20-v28-goal-runbooks/v21_workbench-goal-event-registration_goal_runbook_latest.md`.
- Read worker evidence in `docs/plans/v21-task-4-worker-evidence-2026-05-29.md`, including the revision notes.
- Read review evidence in `docs/plans/v21-task-4-review-evidence-2026-05-29.md`, confirming the final approved verdict supersedes needs-revision.
- Checked current integrated branch `v21-task-4-evidence-ref-helper` at `884e79c` (`Revise v21 task-4 evidence ref validation`).
- Checked Workbench evidence helper UI in `frontend/workbench/src/App.jsx`.
- Checked evidence helper projection in `frontend/workbench/src/api/contracts.js`.
- Checked controlled preview/confirm server paths in `src/symphony/console.js`.
- Checked backend evidence ref normalization in `src/symphony/goal-update.js`, `src/symphony/goal-review.js`, and `src/symphony/goal-gate.js`.
- Checked CLI/API/frontend tests covering controlled refs, managed artifact refs, invalid refs, no filename status inference, preview/confirm flow, and no worker self-approval.

## Acceptance verification

Task-4 acceptance passed on the current integrated working tree.

- Evidence ref input exists in the goal event form.
- Recent evidence refs are projected only from exposed runbook baseline, goal progress ledger refs, goal event log refs, and latest run `artifactRefs`.
- Invalid evidence refs display a frontend evidence ref error before preview.
- `docs/plans/...` and `repo-doc:docs/plans/...` refs remain controlled repo-doc evidence refs.
- Managed artifact refs such as `artifact:...`, `artifacts/...`, `managed-artifact:...`, and `artifact-ref:...` are normalized to `artifact-ref:<ref>`.
- Backend `goal update`, `goal review`, and `goal gate` reject `command-evidence:*`, `external-note:*`, `commit:*`, absolute paths, traversal, and encoded traversal through `invalid-evidence-ref`.
- Preview still calls only controlled `goal update/review/gate` dry-run plan builders.
- Confirm still calls only matching controlled `confirmGoalUpdate`, `confirmGoalReview`, or `confirmGoalGate` with a plan hash.

## Boundary verification

- Latest goal/runbook/next-action surface is preserved. `pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json` returns task-4 `main-verifier` / `main-verification` with reason: reviewer approved task-4 but main verification is missing.
- No v8 `scan/do/review/verify/status/continue/artifacts` top-level action list was added to the task-4 Workbench surface.
- No generic shell runner was added.
- No generic safety, permission, goal, or artifact framework was added.
- No status inference from branch, file, commit, artifact label, or frontend heuristics was found in the task-4 surface.
- Worker self-check and worker events do not create reviewer approval.
- Worker evidence, review evidence, and this main verification evidence do not declare release ready.
- I did not register the main-verification gate event.

## Command results

`pnpm test -- tests/v18-goal-update-cli.test.js tests/v18-goal-review-cli.test.js tests/v18-goal-gate-cli.test.js tests/v21-goal-plan-preview-api.test.js tests/workbench-api-client.test.js tests/workbench-route-smoke.test.js tests/workbench-shell.test.js`

Exit code: 0

```text
tests 67
suites 8
pass 67
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 230.435083
```

`pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Exit code: 0

```text
tests 686
suites 110
pass 686
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3658.485125
```

`pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:72539) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:72539) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:72539) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-BspYnYKl.css   11.24 kB │ gzip:   2.57 kB
src/symphony/workbench-static/assets/index-DMa5Vmdp.js   689.08 kB │ gzip: 128.85 kB

✓ built in 141ms
```

`git diff --check`

Exit code: 0

```text
<no output>
```

`pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Exit code: 0

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 4
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1 status: main-verified
task-2 status: main-verified
task-3 status: main-verified
task-4 status: approved
task-4 reviewVerdict: APPROVED
task-4 mainVerificationRef: null
task-5 status: planned
safety.readOnly: true
safety.copyOnly: true
```

`pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json`

Exit code: 0

```text
contractName: goal-next-action.v1
goalId: v21-goal-event-registration-workbench
status: action-required
next.taskId: task-4
next.role: main-verifier
next.phase: main-verification
next.reason: Reviewer approved task-4 but main verification is missing.
afterCompletion.registerWith: symphony goal gate --gate main-verification
afterCompletion.allowedEvents: main.verification-passed, main.verification-failed
safety.readOnly: true
safety.copyOnly: true
workbenchWriteAvailable: false
```

## Files changed by this verifier

- `docs/plans/v21-task-4-main-verification-evidence-2026-05-29.md`

Pre-existing working tree note: `docs/plans/v21-task-4-review-evidence-2026-05-29.md` was already modified before this verification turn and contains the approved re-review evidence.

## Gaps

No blocking gaps for task-4 main verification.

`goal-status` reports task-4 as `approved` with `mainVerificationRef: null`; `goal next` is the authoritative next-action contract for the next role and correctly points to task-4 main verification.

## Gate recommendation

`passed`

Rationale: reviewer approval is explicit and supersedes needs-revision; controlled repo-doc and managed artifact evidence refs are accepted; uncontrolled evidence kinds and unsafe refs are rejected; preview/confirm remain limited to controlled goal update/review/gate paths; and required checks pass on the current integrated working tree.
