# v20 task-5 review evidence

## Findings

No findings.

Non-blocking notes:

- `pnpm audit --audit-level high` exited `0` and reported one moderate vulnerability. This is below the requested high audit threshold.
- My mutation run passed the configured gate. Its covered-score details differed slightly from the worker evidence: `covered 78.24`, `# survived 492`, `# no cov 121`. The break-threshold result remained passing.

## Verdict

APPROVED

## Blockers

None.

## Validation command results

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
ℹ duration_ms 3805.222334
```

`pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:76755) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:76755) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:76755) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-DGOQN4eH.css    8.32 kB │ gzip:   2.17 kB
src/symphony/workbench-static/assets/index-7IvGgo-R.js   645.20 kB │ gzip: 120.45 kB

✓ built in 140ms
```

`pnpm test:mutation:gate`

Exit code: 0

```text
Ran 3.18 tests per mutant on average.
---------------------------|------------------|----------|-----------|------------|----------|----------|
                           | % Mutation score |          |           |            |          |          |
File                       |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
---------------------------|--------|---------|----------|-----------|------------|----------|----------|
All files                  |  74.27 |   78.24 |     1763 |         6 |        492 |      121 |        0 |
 ensemble                  |  72.37 |   76.13 |      571 |         0 |        179 |       39 |        0 |
  arbitrator.js            |  82.40 |   83.06 |      103 |         0 |         21 |        1 |        0 |
  ensemble-orchestrator.js |  70.48 |   74.76 |      468 |         0 |        158 |       38 |        0 |
 contracts.js              |  83.69 |   84.47 |      272 |         0 |         50 |        3 |        0 |
 orchestrator.js           |  65.61 |   70.31 |      406 |         6 |        174 |       42 |        0 |
 policy-engine.js          |  79.20 |   80.94 |      259 |         0 |         61 |        7 |        0 |
 verifier.js               |  81.47 |   90.11 |      255 |         0 |         28 |       30 |        0 |
---------------------------|--------|---------|----------|-----------|------------|----------|----------|
04:10:50 (76926) INFO MutationTestReportHelper Final mutation score of 74.27 is greater than or equal to break threshold 60
04:10:50 (76926) INFO MutationTestExecutor Done in 25 minutes and 2 seconds.
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

## Files and contracts inspected

- `docs/plans/v20-task-5-worker-evidence-2026-05-31.md`
- `tests/workbench-shell.test.js`: Active Goal ordering assertions and display-only prompt/next-action checks.
- `tests/workbench-route-smoke.test.js`: v20 runbook fixture initialization, static Workbench bundle checks, scoped active-goal routes, and non-GET rejection coverage.
- `tests/workbench-api-client.test.js`: active-goal task queue projection, prompt drawer projection, closeout source handling, and backend scoped event-log hydration.
- `frontend/workbench/src/App.jsx`: `primary-active-goal-grid` appears before supporting active-goal, legacy panel, and detail sections.
- `frontend/workbench/src/api/client.js`: active goal progress/events routes are derived from the managed active goal id and fetched with GET.
- `frontend/workbench/src/api/contracts.js`: ActiveGoalViewModel, task queue, next action, prompt preview, and closeout gap projection logic.
- `frontend/workbench/src/styles/workbench.css` and built `src/symphony/workbench-static/` assets: primary active-goal grid is present in source and built output.
- `fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json`: task-5 acceptance and required validation commands.
- `docs/workbench-operator-guide.md`: v20 workflow, read-only/display-only/copy-only boundary, release-ready boundary, and prohibited capability wording.
- `docs/release-checklist.md`: local gates and command-evidence wording.
- `docs/symphony-product-contracts.md`: closeout `releaseReadySource` contract language and command-evidence boundary.
- `src/symphony/goal-closeout-report.js`: release readiness requires explicit source evidence before `releaseReady` can be true.
- `src/symphony/goal-progress-ledger.js` and `src/symphony/goal-runbook-contracts.js`: release gate ids/status vocabulary and v20 runbook validation surface.

## Review notes

- Workbench tests validate the Active Goal surface as the primary entry point: `tests/workbench-shell.test.js` checks source ordering, and `tests/workbench-route-smoke.test.js` checks the built JS/CSS bundle for `primary-active-goal-grid`, `v20 primary workflow`, `Active Goal Runbook`, and `Active Goal Task Queue` before `panel-grid`.
- Route smoke initializes `v20-goal-workbench-active-goal-surface` from `fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json` and validates latest plus scoped active-goal `progress`, `events`, `runbook`, `next`, `prompt`, and `closeout` routes.
- Operator docs and release checklist describe v20 as read-only/display-only/copy-only. They do not claim auto-merge, auto-tag, model invocation, generic shell execution, or command-only release readiness.
