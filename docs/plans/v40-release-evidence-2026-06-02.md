# v40 Release Gate Evidence

Goal id: `v40-personal-workflow-router-app-core-release`

Evidence captured: 2026-06-05

Branch when captured: `codex/v40-integration`

Release gate base commit before task integration: `32b9285719dc517bd4a84c9cf0e4328fabc53cc8`

Integration note: the five v40 task worktree changes were applied to `codex/v40-integration`, Workbench static assets were rebuilt from the integrated source, and the default v40 closeout gates below were rerun on that integrated branch.

## Gate Results

| Gate | Command | Result |
| --- | --- | --- |
| `release.pnpm-check` | `pnpm check` | Passed, exit code 0 |
| `release.pnpm-test` | `pnpm test` | Passed, exit code 0; 1058 tests passed, 0 failed |
| `release.workbench-build` | `pnpm workbench:build` | Passed, exit code 0 |
| `release.diff-check` | `git diff --check` | Passed, exit code 0 |
| `release.docs-updated` | Evidence doc review | Passed; this file records v40 release gate evidence and closeout state |

## Command Output Summary

`pnpm check` ran Node syntax checks across `src/*.js`, adapters, ensemble, integrations, intake, symphony, trackers, scripts, eval replay plugin, and tests.

`pnpm test` ran `node --test --test-concurrency=8` and reported:

```text
tests 1058
pass 1058
fail 0
duration_ms 8810.26175
```

`pnpm workbench:build` ran `vite build --config frontend/workbench/vite.config.js` and built the Workbench static bundle under `src/symphony/workbench-static/`, including `assets/index-CWx2oU-7.js` and `assets/index-CILC3208.css`.

`git diff --check` completed with no whitespace errors.

## Task Evidence Checked

`pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json` reported all five tasks as `main-verified` before release gate registration. The event ledger contains:

- `task-1`: worker evidence, reviewer approval, and main verification.
- `task-2`: worker evidence, reviewer approval, and main verification.
- `task-3`: worker evidence, reviewer approval, and main verification.
- `task-4`: worker evidence, reviewer approval, and main verification.
- `task-5`: worker evidence, reviewer approval, and main verification.

`pnpm --silent symphony goal closeout --goal v40-personal-workflow-router-app-core-release --markdown` reported no missing task evidence before release gate registration. The only closeout gaps were the five release gates listed above and the separate `release.ready` declaration.

## Docs Updated Evidence

Docs-updated evidence for v40 closeout is this file:

- `docs/plans/v40-release-evidence-2026-06-02.md`

The closeout rules were checked against:

- `fixtures/contracts/goal-runbook.v40-personal-workflow-router-app-core-release.v1.json`
- `docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md`
- `docs/release-checklist.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`

## Boundary Notes

The v40 closeout is limited to the release gates declared in the v40 runbook:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

Mutation testing, high audit, MCAS doctor, real provider CLI execution, model-provider CLI execution, merge, push, tag creation, tag push, release publication, and arbitrary command execution were not run for this closeout.

## Event Registration Plan

Register these events with this evidence ref after reviewing the dry-run plan hashes:

- `release.gate-passed` for `release.pnpm-check`
- `release.gate-passed` for `release.pnpm-test`
- `release.gate-passed` for `release.workbench-build`
- `release.gate-passed` for `release.diff-check`
- `release.gate-passed` for `release.docs-updated`
- `release.ready-declared` for `release.ready` only after closeout reports no remaining release gate gaps
