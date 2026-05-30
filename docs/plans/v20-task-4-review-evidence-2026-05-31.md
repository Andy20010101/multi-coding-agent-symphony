# v20 task-4 review evidence

## Findings

No blocking findings.

The Closeout Gaps projection uses `goal-closeout-report.v1` as the source for `missing`, release gate rows, `summary.releaseReady`, and `summary.releaseReadySource`. I did not find a path where the panel upgrades closeout readiness from the active ledger or local command output when the closeout report itself is not ready.

Release readiness remains evidence-bound. `goal-closeout-report.v1` now requires `summary.releaseReadySource`; when `summary.releaseReady` is true, the source must be a `goal-event-log.v1:*` ref, and when readiness is false the source must be `null`.

## Validation Commands

`pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Exit code: 0

```text
ℹ tests 669
ℹ suites 109
ℹ pass 669
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3537.149125
```

`pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:50887) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:50887) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:50887) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-DGOQN4eH.css    8.32 kB │ gzip:   2.17 kB
src/symphony/workbench-static/assets/index-7IvGgo-R.js   645.20 kB │ gzip: 120.45 kB

✓ built in 136ms
```

`git diff --check`

Exit code: 0

```text

```

## Files and Contracts Inspected

- `docs/plans/v20-task-4-worker-evidence-2026-05-31.md`
- `fixtures/contracts/goal-runbook.v20-goal-workbench-active-goal-surface.v1.json`
- `src/symphony/goal-closeout-report.js`
- `src/symphony/goal-runbook-contracts.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/workbench-api-client.test.js`
- `tests/v19-goal-next-cli.test.js`
- `tests/v19-goal-runbook-contracts.test.js`
- `docs/symphony-product-contracts.md`

## Contract Checks

- `projectGoalCloseoutGaps` no longer takes the active ledger and projects closeout state from `goal-closeout-report.v1`.
- Closeout missing rows include `kind`, `taskId`, `expectedEvent`, `gate`, `gateId`, and `status`.
- Workbench tests cover the case where the active ledger says release-ready, but the closeout report says not ready; the panel stays not ready.
- Closeout CLI tests cover all task evidence and release gate events passing while `release.ready-declared` is still missing; `summary.releaseReady` stays false and `releaseReadySource` stays `null`.
- Contract tests reject `summary.releaseReady: true` when `releaseReadySource` is missing or uses a local-command-output source.

## Blockers

None.

## Verdict

APPROVED

I did not implement code changes, register goal events or gates, or run `symphony goal review`.
