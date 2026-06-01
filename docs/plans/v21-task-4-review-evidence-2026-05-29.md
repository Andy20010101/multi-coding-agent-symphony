# v21 task-4 review evidence

Goal id: `v21-goal-event-registration-workbench`
Task id: `task-4`
Task title: `Evidence ref helper`
Branch reviewed: `v21-task-4-evidence-ref-helper`
Reviewer: `v21 task-4 independent re-reviewer subagent`
Date reviewed: 2026-05-31
Verdict: `approved`

This review supersedes the earlier `needs-revision` verdict in this file. The prior blocker was that backend dry-run/confirm builders still accepted `command-evidence:*` and `external-note:*`. The revision now rejects those inputs for `goal update`, `goal review`, and `goal gate`.

## Scope Checked

- Read task-4 scope in `docs/plans/workbench-v20-v28-goal-runbooks/v21_workbench-goal-event-registration_goal_runbook_latest.md`.
- Read worker evidence in `docs/plans/v21-task-4-worker-evidence-2026-05-29.md`, including the revision note.
- Reviewed current task-4 revision diff `HEAD^..HEAD` and integration diff `main...HEAD`.
- Checked backend evidence normalization in `src/symphony/goal-update.js`, `src/symphony/goal-review.js`, and `src/symphony/goal-gate.js`.
- Checked Workbench preview/confirm routing in `src/symphony/console.js` and `frontend/workbench/src/App.jsx`.
- Checked evidence helper projection and parsing in `frontend/workbench/src/App.jsx` and `frontend/workbench/src/api/contracts.js`.
- Checked CLI/API tests for controlled acceptance and uncontrolled rejection in `tests/v18-goal-update-cli.test.js`, `tests/v18-goal-review-cli.test.js`, `tests/v18-goal-gate-cli.test.js`, and `tests/v21-goal-plan-preview-api.test.js`.

## Files and Diff Checked

`git diff --stat HEAD^..HEAD`:

```text
docs/plans/v21-task-4-review-evidence-2026-05-29.md | 209 ++++++++++++++++++
docs/plans/v21-task-4-worker-evidence-2026-05-29.md | 138 +++++++++++-
src/symphony/goal-gate.js                          |   5 +-
src/symphony/goal-review.js                        |   5 +-
src/symphony/goal-update.js                        |   5 +-
tests/v18-goal-gate-cli.test.js                    |  87 ++++++++
tests/v18-goal-review-cli.test.js                  |  90 ++++++++
tests/v18-goal-update-cli.test.js                  |  60 ++++++
tests/v21-goal-plan-preview-api.test.js            | 233 ++++++++++++++++++---
9 files changed, 782 insertions(+), 50 deletions(-)
```

`git diff --name-status HEAD^..HEAD`:

```text
A docs/plans/v21-task-4-review-evidence-2026-05-29.md
M docs/plans/v21-task-4-worker-evidence-2026-05-29.md
M src/symphony/goal-gate.js
M src/symphony/goal-review.js
M src/symphony/goal-update.js
M tests/v18-goal-gate-cli.test.js
M tests/v18-goal-review-cli.test.js
M tests/v18-goal-update-cli.test.js
M tests/v21-goal-plan-preview-api.test.js
```

`git diff --stat main...HEAD` showed the stacked v21 task-1 through task-4 branch context:

```text
32 files changed, 7818 insertions(+), 53 deletions(-)
```

## Findings

No blocking findings remain.

The backend revision fixes the prior blocker. `EVIDENCE_KIND_PREFIXES` in `goal-update.js`, `goal-review.js`, and `goal-gate.js` now contains only `repo-doc` and `artifact-ref`. Unknown prefixes such as `command-evidence:`, `external-note:`, and `commit:` fall through as repo-doc refs and fail the `docs/plans/` requirement. `repo-doc` remains limited to `docs/plans/...`, and `artifact-ref:<ref>` is preserved for managed artifact evidence refs.

The Workbench preview endpoint still accepts only constrained `command=update|review|gate` parameters and calls the matching backend builders. The confirm endpoint still calls `confirmGoalUpdate`, `confirmGoalReview`, or `confirmGoalGate` with a plan hash. The frontend still builds preview and confirm payloads from the same form values and parsed evidence refs; it does not invoke a shell runner.

Task-4 acceptance is covered:

- Evidence ref input exists in the goal event form.
- Recent refs are projected from exposed runbook, goal progress, goal event, and latest run artifact contracts.
- Invalid frontend input is blocked before preview with an evidence ref error.
- Backend preview and confirm return `invalid-evidence-ref` envelopes for uncontrolled refs.
- `docs/plans/...`, `repo-doc:docs/plans/...`, and `artifact-ref:...` remain accepted.
- The helper does not infer approval, main verification, release readiness, or task status from file names, branches, commits, artifact labels, or frontend heuristics.

## Evidence Ref Boundary Probes

Manual CLI probes used a temporary `--state-dir` and left `state-files=0`.

```text
update dry-run command-evidence:approved-looking-note | exit=64 | message=--evidence-ref must be a controlled docs/plans or managed artifact reference.
review dry-run command-evidence:approved-looking-note | exit=64 | message=--evidence-ref must be a controlled docs/plans or managed artifact reference.
gate dry-run command-evidence:approved-looking-note | exit=64 | message=--evidence-ref must be a controlled docs/plans or managed artifact reference.
update confirm command-evidence:approved-looking-note | exit=64 | message=--evidence-ref must be a controlled docs/plans or managed artifact reference.
review confirm command-evidence:approved-looking-note | exit=64 | message=--evidence-ref must be a controlled docs/plans or managed artifact reference.
gate confirm command-evidence:approved-looking-note | exit=64 | message=--evidence-ref must be a controlled docs/plans or managed artifact reference.
update dry-run external-note:approved | exit=64 | message=--evidence-ref must be a controlled docs/plans or managed artifact reference.
review dry-run external-note:approved | exit=64 | message=--evidence-ref must be a controlled docs/plans or managed artifact reference.
gate dry-run external-note:approved | exit=64 | message=--evidence-ref must be a controlled docs/plans or managed artifact reference.
update confirm external-note:approved | exit=64 | message=--evidence-ref must be a controlled docs/plans or managed artifact reference.
review confirm external-note:approved | exit=64 | message=--evidence-ref must be a controlled docs/plans or managed artifact reference.
gate confirm external-note:approved | exit=64 | message=--evidence-ref must be a controlled docs/plans or managed artifact reference.
state-files=0
```

The Workbench API test also asserts `error-envelope.v1` with `error.code: invalid-evidence-ref` for uncontrolled preview and confirm refs.

## Command Results

`pnpm test -- tests/v18-goal-update-cli.test.js tests/v18-goal-review-cli.test.js tests/v18-goal-gate-cli.test.js tests/v21-goal-plan-preview-api.test.js`

Exit code: 0

```text
tests 28
suites 4
pass 28
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 123.249959
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
duration_ms 3591.130166
```

`pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-BspYnYKl.css   11.24 kB │ gzip:   2.57 kB
src/symphony/workbench-static/assets/index-DMa5Vmdp.js   689.08 kB │ gzip: 128.85 kB

✓ built in 141ms
```

Node printed WASI experimental warnings during the Vite build. The command exited 0.

`git diff --check`

Exit code: 0

```text
<no output>
```

## Boundary Notes

- No functional code was changed by this re-review.
- No goal review event was registered.
- No generic shell runner, generic safety/permission system, goal framework, artifact framework, v8 top-level action list, frontend heuristic approval/readiness path, or worker self-approval path was found in the reviewed task-4 surface.
- `src/symphony/goal-event-contracts.js` still lists historical evidence kinds for the event log contract, but the controlled `goal update/review/gate` builders under review now accept only `repo-doc` and `artifact-ref`.
