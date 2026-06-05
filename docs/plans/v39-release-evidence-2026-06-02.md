# v39 Release Gate Evidence

Goal id: `v39-backup-diagnostics-migration-workspace`

Evidence captured: 2026-06-05

Branch when captured: `codex/v39-release-integration`

## Gate Results

| Gate | Command | Result |
| --- | --- | --- |
| `release.pnpm-check` | `pnpm check` | Passed, exit code 0 |
| `release.pnpm-test` | `pnpm test` | Passed, exit code 0; 1041 tests passed, 0 failed |
| `release.workbench-build` | `pnpm workbench:build` | Passed, exit code 0 |
| `release.diff-check` | `git diff --check` | Passed, exit code 0 |
| `release.docs-updated` | Evidence doc review | Passed; this file records v39 gate evidence and closeout state |

## Command Output Summary

`pnpm check` ran Node syntax checks across `src/*.js`, adapters, ensemble, integrations, intake, symphony, trackers, scripts, eval replay plugin, and tests.

`pnpm test` ran `node --test --test-concurrency=8` and reported:

```text
tests 1041
pass 1041
fail 0
duration_ms 7487.670917
```

`pnpm workbench:build` ran `vite build --config frontend/workbench/vite.config.js` and produced the Workbench static bundle under `src/symphony/workbench-static/`.

`git diff --check` completed with no whitespace errors.

## Closeout State

`pnpm --silent symphony goal closeout --goal v39-backup-diagnostics-migration-workspace --markdown` reported on 2026-06-05:

- Worker evidence complete: yes
- Review evidence complete: yes
- Main verification complete: yes
- Release ready: yes
- Release ready source: `goal-event-log.v1:evt_c80f82e587a6d98d`
- Missing evidence: none
- Release gate gaps: none

`pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` reported all five tasks as `release-ready`, with `summary.releaseReady: true`.

## Integration Notes

The v39 task branches were merged onto `codex/v39-release-integration` before the final gate run. Integration exposed two small compatibility fixes:

- `app-data-inventory.v1` now normalizes event-scoped evidence sources such as `goal-event-log.v1:evt_c80f82e587a6d98d` to the source contract name before contract validation.
- The Workbench shell read-only API path assertion now matches the actual sorted order of `/api/app-data/migration` and `/api/app/data-inventory`.

## Ledger Notes

The append-only ledger contains `release.gate-passed` events for the five v39 runbook gates:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

During external supervisor closeout testing, the temporary runner replayed the first release-manager result across later gates because it inferred the gate from current `goal next` instead of the result basis. The project-external runner was fixed on 2026-06-05 to require release-manager gate results to cite exactly one concrete `release.*` gate from the result text, and to register `release.ready-declared` through `--gate release.ready --status declared`.

The invalid append-only event `evt_8dc4b8ab55719a6c` is a `release.gate-passed` event for gate name `release.ready-declared`. It does not declare release readiness and does not set `summary.releaseReady`.

The ledger also contains two valid `release.ready-declared` events for this same evidence ref:

- `evt_1ec1ec90f3717669`, actor `codex-v39-release-manager`
- `evt_c80f82e587a6d98d`, actor `local-goal-supervisor-release-manager`

The second valid ready event was appended by manual confirm after the first event had already appeared. The latest ledger projection uses `evt_c80f82e587a6d98d` as `summary.releaseReadySource`; both valid ready events point to this evidence file.

## Not Run

The v39 closeout default gates did not require mutation, audit, doctor, provider CLI execution, tag creation, tag push, release publication, or merge to `main`. None of those commands were run for this evidence.
