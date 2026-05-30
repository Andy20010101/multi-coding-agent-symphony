# v20 task-5 main verification evidence

## Outcome

PASSED

## Scope

- Goal: `v20-goal-workbench-active-goal-surface`
- Task: `task-5`
- Task title: `Workbench tests, operator docs, and release evidence`
- Repository: `/Users/andy/Documents/project/multi-coding-agent-symphony`
- Main verifier role only. No implementation files were changed for this verification.
- No `symphony goal gate` command was run.

## Required evidence exists

- Worker evidence exists: `docs/plans/v20-task-5-worker-evidence-2026-05-31.md`
- Worker evidence states task-5 added Workbench route smoke coverage, shell ordering tests, operator guide updates, and release checklist evidence.
- Worker evidence states the worker did not register goal events, approve task-5, perform main verification, declare release readiness, merge, tag, invoke a model, or add a generic shell execution path.
- Reviewer evidence exists: `docs/plans/v20-task-5-review-evidence-2026-05-31.md`
- Reviewer approval is explicit: `Verdict` is `APPROVED`.
- Reviewer blockers: `None`.

Read-only goal checks:

- `pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json` exited `0`.
- The ledger shows task-5 status `approved`, review verdict `APPROVED`, worker evidence ref `docs/plans/v20-task-5-worker-evidence-2026-05-31.md`, review evidence ref `docs/plans/v20-task-5-review-evidence-2026-05-31.md`, and `mainVerificationRef: null`.
- `pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json` exited `0`.
- The next action says task-5 needs `main-verifier` work because reviewer approval exists and main verification is missing.

## Commit and worktree state checked

Checked before writing this evidence file:

- Branch: `main`
- Commit: `a5778f2c9749c0f87fefd0ed52ac9336f8d3f8b3`

`git status --short` showed the v20 workspace edits already present:

```text
 M docs/release-checklist.md
 M docs/symphony-product-contracts.md
 M docs/workbench-operator-guide.md
 M fixtures/contracts/goal-closeout-report.unknown-event-type.invalid.v1.json
 M fixtures/contracts/goal-closeout-report.valid.v1.json
 M frontend/workbench/index.html
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/contracts.js
 M frontend/workbench/src/styles/workbench.css
 M src/symphony/console.js
 M src/symphony/goal-closeout-report.js
 M src/symphony/goal-progress-ledger.js
 M src/symphony/goal-runbook-contracts.js
 D src/symphony/workbench-static/assets/index-D3K9Dk14.css
 D src/symphony/workbench-static/assets/index-Duy8jdh2.js
 M src/symphony/workbench-static/index.html
 M tests/v18-console-events-api.test.js
 M tests/v19-goal-next-cli.test.js
 M tests/v19-goal-runbook-contracts.test.js
 M tests/v19-goal-template.test.js
 M tests/workbench-api-client.test.js
 M tests/workbench-route-smoke.test.js
 M tests/workbench-shell.test.js
?? docs/plans/v20-task-1-main-verification-evidence-2026-05-31.md
?? docs/plans/v20-task-1-review-evidence-2026-05-31.md
?? docs/plans/v20-task-1-worker-evidence-2026-05-29.md
?? docs/plans/v20-task-2-main-verification-evidence-2026-05-31.md
?? docs/plans/v20-task-2-review-evidence-2026-05-31.md
?? docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md
?? docs/plans/v20-task-2-worker-evidence-2026-05-31.md
?? docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md
?? docs/plans/v20-task-3-main-verification-evidence-2026-05-31.md
?? docs/plans/v20-task-3-review-evidence-2026-05-31.md
?? docs/plans/v20-task-3-worker-evidence-2026-05-31.md
?? docs/plans/v20-task-4-main-verification-evidence-2026-05-31.md
?? docs/plans/v20-task-4-review-evidence-2026-05-31.md
?? docs/plans/v20-task-4-worker-evidence-2026-05-31.md
?? docs/plans/v20-task-5-review-evidence-2026-05-31.md
?? docs/plans/v20-task-5-worker-evidence-2026-05-31.md
?? docs/plans/workbench-v20-v28-goal-runbooks-combined-2026-05-29.md
?? docs/plans/workbench-v20-v28-goal-runbooks/
?? fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json
?? src/symphony/workbench-static/assets/index-7IvGgo-R.js
?? src/symphony/workbench-static/assets/index-DGOQN4eH.css
```

`git diff --stat` showed `23 files changed, 1673 insertions(+), 13894 deletions(-)` before this evidence file was added.

## Required validation commands

### `pnpm check`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: `0`

```text
ℹ tests 670
ℹ suites 109
ℹ pass 670
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3822.828292
```

### `pnpm workbench:build`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:89836) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:89836) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:89836) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-DGOQN4eH.css    8.32 kB │ gzip:   2.17 kB
src/symphony/workbench-static/assets/index-7IvGgo-R.js   645.20 kB │ gzip: 120.45 kB

✓ built in 139ms
```

### `pnpm test:mutation:gate`

Exit code: `0`

```text
Ran 3.18 tests per mutant on average.
---------------------------|------------------|----------|-----------|------------|----------|----------|
                           | % Mutation score |          |           |            |          |          |
File                       |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
---------------------------|--------|---------|----------|-----------|------------|----------|----------|
All files                  |  74.22 |   78.37 |     1762 |         6 |        488 |      126 |        0 |
 ensemble                  |  72.37 |   76.13 |      571 |         0 |        179 |       39 |        0 |
  arbitrator.js            |  82.40 |   83.06 |      103 |         0 |         21 |        1 |        0 |
  ensemble-orchestrator.js |  70.48 |   74.76 |      468 |         0 |        158 |       38 |        0 |
 contracts.js              |  83.69 |   84.47 |      272 |         0 |         50 |        3 |        0 |
 orchestrator.js           |  65.61 |   70.31 |      406 |         6 |        174 |       42 |        0 |
 policy-engine.js          |  78.90 |   81.90 |      258 |         0 |         57 |       12 |        0 |
 verifier.js               |  81.47 |   90.11 |      255 |         0 |         28 |       30 |        0 |
---------------------------|--------|---------|----------|-----------|------------|----------|----------|
04:41:09 (90020) INFO MutationTestReportHelper Final mutation score of 74.22 is greater than or equal to break threshold 60
04:41:09 (90020) INFO MutationTestExecutor Done in 25 minutes and 29 seconds.
```

### `pnpm audit --audit-level high`

Exit code: `0`

```text
1 vulnerabilities found
Severity: 1 moderate
```

This passes the requested high audit threshold because the reported vulnerability is moderate, not high or critical.

### `git diff --check`

Exit code: `0`

```text
```

### `pnpm mcas doctor`

Exit code: `0`

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

## Files and contracts checked

- `tests/workbench-shell.test.js`: checks `Active Goal Runbook`, `Active Goal Task Queue`, `v20 primary workflow`, `copy-only prompt drawer`, and ordering from `primary-active-goal-grid` to supporting active-goal panels to `panel-grid` and detail panels.
- `tests/workbench-route-smoke.test.js`: checks built Workbench JS/CSS contain `primary-active-goal-grid`, `v20 primary workflow`, `Active Goal Runbook`, and `Active Goal Task Queue`, and that `primary-active-goal-grid` appears before `panel-grid`.
- `tests/workbench-route-smoke.test.js`: checks frontend source has no mutation controls, mutation handlers, raw HTML rendering, browser execution channels, browser write storage, download/local-open APIs, model API endpoints, shell process APIs, non-wrapper `fetch`, request bodies, or non-GET Workbench requests.
- `tests/workbench-api-client.test.js`: checks Active Goal task queue projection, next action, prompt preview, closeout gaps, backend scoped event-log hydration, and event-backed verdict handling.
- `frontend/workbench/src/App.jsx`: renders `<ActiveGoalRunbookPanel>` and `<ActiveGoalTaskQueuePanel>` inside `primary-active-goal-grid` before supporting contracts and older Workbench panels.
- `frontend/workbench/src/api/client.js`: active goal API calls remain routed through approved GET paths.
- `frontend/workbench/src/api/contracts.js`: ActiveGoalViewModel, task queue, next action, prompt preview, and closeout gap projections stay contract-backed and copy-only.
- `fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json`: task-5 acceptance names Workbench tests, operator docs, release evidence, and prohibited claims.
- `docs/workbench-operator-guide.md`: v20 workflow starts from Active Goal Runbook and Active Goal Task Queue, says Workbench remains read-only / display-only / copy-only, and says release-ready requires explicit goal gate events.
- `docs/release-checklist.md`: required local gates match this verification command set and are described as command evidence only.
- `docs/symphony-product-contracts.md`: release-ready and approval status stay evidence/event based.
- `src/symphony/goal-closeout-report.js`, `src/symphony/goal-progress-ledger.js`, and `src/symphony/goal-runbook-contracts.js`: release readiness, main verification, and prompt registration remain tied to explicit contract/event state.

## Acceptance assessment

Workbench tests and route smoke coverage validate the Active Goal surface as the primary Workbench entry point:

- Source ordering test: `tests/workbench-shell.test.js` verifies `Active Goal Runbook` and `Active Goal Task Queue` render in `primary-active-goal-grid` before supporting panels, older `panel-grid`, and detail panels.
- Static route smoke: `tests/workbench-route-smoke.test.js` verifies the built JS and CSS expose the primary Active Goal workflow and that the built JS places `primary-active-goal-grid` before `panel-grid`.
- API/client tests cover active-goal route projections, event-backed evidence, prompt drawer behavior, and closeout gaps without introducing write or execution behavior.

Operator docs and release evidence describe the v20 workflow without claiming unsupported capabilities:

- `docs/workbench-operator-guide.md` says Workbench v20 starts from active goal and lists the first-screen Active Goal panels.
- The guide says command gates are command evidence only, and release-ready requires `symphony goal gate --gate release.ready --status declared`.
- The guide and release checklist do not claim auto-merge, auto-tag, model invocation, generic shell execution, or command-only release readiness.
- The checked Workbench source/tests also reject browser-side model endpoints, shell process APIs, mutation controls, and non-GET API calls.

## Blockers

None.
