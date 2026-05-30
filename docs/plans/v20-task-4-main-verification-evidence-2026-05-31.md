# v20 task-4 main verification evidence

## Outcome

PASSED

Task: `task-4`
Goal: `v20-goal-workbench-active-goal-surface`
Task title: `Closeout Gaps panel`

I did not implement code changes, revert others' edits, stage files, commit, or run `symphony goal gate`.

## Evidence prerequisites

Worker evidence exists and was read:

- `docs/plans/v20-task-4-worker-evidence-2026-05-31.md`

Reviewer evidence exists and was read:

- `docs/plans/v20-task-4-review-evidence-2026-05-31.md`

Reviewer approval is explicit:

- Review evidence verdict: `APPROVED`.
- Goal event log contains `task-4` worker evidence at `.symphony/goals/events/v20-goal-workbench-active-goal-surface.ndjson:12`, event `evt_48924a5bbae3c887`, event type `worker.evidence-recorded`, evidence ref `docs/plans/v20-task-4-worker-evidence-2026-05-31.md`.
- Goal event log contains `task-4` reviewer approval at `.symphony/goals/events/v20-goal-workbench-active-goal-surface.ndjson:13`, event `evt_6d10386c0cc0d174`, event type `reviewer.approved`, verdict `APPROVED`, evidence ref `docs/plans/v20-task-4-review-evidence-2026-05-31.md`.

Read-only goal state checks:

- `pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json` exited 0. `task-4` status is `approved`, status source is `goal-event-log.v1:evt_6d10386c0cc0d174`, worker evidence ref is `docs/plans/v20-task-4-worker-evidence-2026-05-31.md`, review evidence ref is `docs/plans/v20-task-4-review-evidence-2026-05-31.md`, review verdict is `APPROVED`, and main verification ref is `null`.
- `pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json` exited 0. It returned `goal-next-action.v1` with `taskId: task-4`, `role: main-verifier`, and reason `Reviewer approved task-4 but main verification is missing.`
- `pnpm --silent symphony goal closeout --goal v20-goal-workbench-active-goal-surface --json` exited 0. It returned `goal-closeout-report.v1` with `releaseReady: false`, `releaseReadySource: null`, `releaseReadyRequiresEvidence: true`, missing task evidence entries, and release gate gaps including `pnpmCheck`, `pnpmTest`, `workbenchBuild`, `mutationGate`, `auditHigh`, `diffCheck`, `mcasDoctor`, `docsUpdated`, and `tagEvidence`.

## Contract checks

The Workbench Closeout Gaps projection is sourced from `goal-closeout-report.v1`:

- `frontend/workbench/src/api/contracts.js:1160` defines `projectGoalCloseoutGaps({ result, closeout })`; it does not take the active ledger as an input.
- `frontend/workbench/src/api/contracts.js:1190` projects summary from `closeout.summary`, including `releaseReady` and `releaseReadySource`.
- `frontend/workbench/src/api/contracts.js:1191` through `frontend/workbench/src/api/contracts.js:1201` projects `missing` rows from `closeout.missing`, including `kind`, `taskId`, `expectedEvent`, `gate`, `gateId`, and `status`.
- `frontend/workbench/src/api/contracts.js:1203` through `frontend/workbench/src/api/contracts.js:1206` projects release gates from `closeout.releaseGates`.
- `frontend/workbench/src/api/contracts.js:1210` states the panel does not infer release state from command output, prompts, branch, or path.

The Workbench UI displays the projected closeout fields:

- `frontend/workbench/src/App.jsx:481` through `frontend/workbench/src/App.jsx:509` renders the `Closeout Gaps` panel, summary fields, missing evidence/gates, and release gates.
- `frontend/workbench/src/App.jsx:498` and `frontend/workbench/src/App.jsx:499` display `releaseReady` and `releaseReadySource`.
- `frontend/workbench/src/App.jsx:1465` through `frontend/workbench/src/App.jsx:1485` renders each missing closeout row with `kind`, `taskId`, `expectedEvent`, `gate`, `gateId`, and `status`.

Release readiness remains tied to explicit goal gate evidence:

- `src/symphony/goal-closeout-report.js:181` through `src/symphony/goal-closeout-report.js:199` sets closeout `releaseReady` only when task evidence is complete, all release gates pass, ledger release readiness is true, and `releaseReadySource` is a `goal-event-log.v1:*` source.
- `src/symphony/goal-closeout-report.js:254` through `src/symphony/goal-closeout-report.js:259` adds a `release-ready` missing item expecting `release.ready-declared` when other gaps are clear but explicit release readiness is absent.
- `src/symphony/goal-runbook-contracts.js:611` through `src/symphony/goal-runbook-contracts.js:623` requires `summary.releaseReadySource`, requires it to be a `goal-event-log.v1` source when `summary.releaseReady` is true, and requires it to be `null` when `summary.releaseReady` is false.

Test coverage checked:

- `tests/workbench-api-client.test.js:601` through `tests/workbench-api-client.test.js:652` verifies Closeout Gaps uses `goal-closeout-report.v1` even when the ledger alone says release-ready.
- `tests/v19-goal-next-cli.test.js:141` through `tests/v19-goal-next-cli.test.js:172` verifies passed check/test gates alone do not make closeout release-ready.
- `tests/v19-goal-next-cli.test.js:178` through `tests/v19-goal-next-cli.test.js:248` verifies closeout release readiness stays false until explicit `release.ready-declared` evidence exists.
- `tests/v19-goal-runbook-contracts.test.js:130` through `tests/v19-goal-runbook-contracts.test.js:152` rejects closeout readiness without a `goal-event-log.v1` source and rejects local command output as the readiness source.

## Required validation commands

`pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Exit code: 0

The command emitted detailed per-test TAP output. The exact command header and final Node test summary were:

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

ℹ tests 669
ℹ suites 109
ℹ pass 669
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3553.737792
```

`pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:56916) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:56916) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:56916) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-DGOQN4eH.css    8.32 kB │ gzip:   2.17 kB
src/symphony/workbench-static/assets/index-7IvGgo-R.js   645.20 kB │ gzip: 120.45 kB

✓ built in 137ms
```

`git diff --check`

Exit code: 0

```text

```

## Commit and worktree state

Checked before writing this evidence file.

- Branch: `main`
- HEAD: `a5778f2c9749c0f87fefd0ed52ac9336f8d3f8b3`

`git status --short`

```text
 M docs/symphony-product-contracts.md
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
?? docs/plans/v20-task-4-review-evidence-2026-05-31.md
?? docs/plans/v20-task-4-worker-evidence-2026-05-31.md
?? docs/plans/workbench-v20-v28-goal-runbooks-combined-2026-05-29.md
?? docs/plans/workbench-v20-v28-goal-runbooks/
?? fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json
?? src/symphony/workbench-static/assets/index-7IvGgo-R.js
?? src/symphony/workbench-static/assets/index-DGOQN4eH.css
```

## Blockers

None.
