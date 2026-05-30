# v20 task-5 worker evidence

## Summary

Task-5 adds test and documentation coverage for the v20 Active Goal Workbench entry path.

- Route smoke coverage now initializes the managed active goal from `fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json` and verifies the Workbench static bundle exposes the primary Active Goal workflow before the older information panels.
- Workbench shell tests now check that `primary-active-goal-grid` renders `Active Goal Runbook` and `Active Goal Task Queue` before supporting active-goal panels, summary, runs, and detail panels.
- Operator docs describe the v20 workflow as read-only / display-only / copy-only. They state that local command results are command evidence only and release-ready still requires explicit goal gate events.
- Release checklist now includes the v20 local gates used for this worker handoff: Workbench build, mutation gate, high audit threshold, diff check, and doctor.

This worker did not register goal events, approve task-5, perform main verification, declare release readiness, merge, tag, invoke a model, or add a generic shell execution path.

## Files changed

Task-5 files:

- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/release-checklist.md`
- `docs/plans/v20-task-5-worker-evidence-2026-05-31.md`

The workspace already contained v20 task-1 through task-4 edits, evidence files, the v20 runbook fixture, and generated Workbench static assets. Those changes were left in place.

## Focused self-test

`node --test tests/workbench-shell.test.js tests/workbench-route-smoke.test.js tests/workbench-api-client.test.js`

Exit code: 0

```text
ℹ tests 35
ℹ suites 4
ℹ pass 35
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 205.927625
```

## Required command results

`pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Exit code: 0

```text
ℹ tests 670
ℹ suites 109
ℹ pass 670
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3565.767875
```

`pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:66380) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:66380) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:66380) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-DGOQN4eH.css    8.32 kB │ gzip:   2.17 kB
src/symphony/workbench-static/assets/index-7IvGgo-R.js   645.20 kB │ gzip: 120.45 kB

✓ built in 138ms
```

`pnpm test:mutation:gate`

Exit code: 0

```text
Ran 3.18 tests per mutant on average.
---------------------------|------------------|----------|-----------|------------|----------|----------|
                           | % Mutation score |          |           |            |          |          |
File                       |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
---------------------------|--------|---------|----------|-----------|------------|----------|----------|
All files                  |  74.27 |   78.27 |     1763 |         6 |        491 |      122 |        0 |
 ensemble                  |  72.37 |   76.13 |      571 |         0 |        179 |       39 |        0 |
  arbitrator.js            |  82.40 |   83.06 |      103 |         0 |         21 |        1 |        0 |
  ensemble-orchestrator.js |  70.48 |   74.76 |      468 |         0 |        158 |       38 |        0 |
 contracts.js              |  83.69 |   84.47 |      272 |         0 |         50 |        3 |        0 |
 orchestrator.js           |  65.61 |   70.31 |      406 |         6 |        174 |       42 |        0 |
 policy-engine.js          |  79.20 |   81.19 |      259 |         0 |         60 |        8 |        0 |
 verifier.js               |  81.47 |   90.11 |      255 |         0 |         28 |       30 |        0 |
---------------------------|--------|---------|----------|-----------|------------|----------|----------|
03:42:00 (66563) INFO MutationTestReportHelper Final mutation score of 74.27 is greater than or equal to break threshold 60
03:42:00 (66563) INFO MutationTestExecutor Done in 21 minutes and 52 seconds.
```

`pnpm audit --audit-level high`

Exit code: 0

```text
1 vulnerabilities found
Severity: 1 moderate
```

`git diff --check`

Exit code: 0

```text
```

`pnpm mcas doctor`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 mcas /Users/andy/Documents/project/multi-coding-agent-symphony
> node scripts/mcas.js doctor

{
  "version": "1",
  "status": "ok",
  "nodeVersion": "24.14.0",
  "packageManager": "pnpm",
  "commands": [
    "doctor",
    "intake",
    "github issue",
    "harness run-taskpacket",
    "queue manual",
    "run-next",
    "run-task",
    "smoke",
    "eval replay"
  ]
}
```

## Blockers

No blocker for task-5 worker handoff.

`pnpm audit --audit-level high` returned exit code 0 and reported one moderate vulnerability. That is below the requested high audit threshold.

## Reviewer handoff

Review task-5 scope only:

- Confirm the route smoke fixture uses the v20 active goal runbook and validates the static Workbench entry bundle.
- Confirm the shell test ordering check keeps Active Goal Runbook and Active Goal Task Queue before the older information panels.
- Confirm the operator guide and release checklist describe v20 as read-only / display-only / copy-only and do not claim release readiness, model invocation, merge, tag, or generic shell execution.

This worker did not approve its own work and did not run `symphony goal update`.
