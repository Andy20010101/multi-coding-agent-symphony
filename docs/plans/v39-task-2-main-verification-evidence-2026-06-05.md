# v39 task-2 main verification evidence

Date: 2026-06-05

Goal id: `v39-backup-diagnostics-migration-workspace`  
Task id: `task-2`  
Branch: `v39-task-2-schema-version-migration-runner`  
Worktree: `/Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner`  
Base commit: `036d2f6694f62960b1b05dbca04dd0c17699fb6d`  
Head commit: `90c8a31a8f8a7366c2c6ae5c89e7e224a685342f`  
Worker evidence: `docs/plans/v39-task-2-worker-evidence-2026-06-05.md`  
Review evidence: `docs/plans/v39-task-2-review-evidence-2026-06-05.md`

## Verification scope

Verified the worker result in `/Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner`, not the root checkout. The managed goal state read through the root `.symphony` directory showed task-2 status `approved`, review verdict `APPROVED`, worker evidence `docs/plans/v39-task-2-worker-evidence-2026-06-05.md`, review evidence `docs/plans/v39-task-2-review-evidence-2026-06-05.md`, and no main verification ref yet.

The review evidence at `docs/plans/v39-task-2-review-evidence-2026-06-05.md` approved commit `90c8a31a8f8a7366c2c6ae5c89e7e224a685342f` against base commit `036d2f6694f62960b1b05dbca04dd0c17699fb6d`.

## Acceptance checks

- `src/symphony/app-schema-migration.js` defines `app-schema-migration.v1` with `appData.schemaVersion`, current version `1`, target version `2`, dry-run default behavior, affected app data areas, pending migration steps, `app.schema.migration.confirm`, and plan-hash metadata.
- `scripts/symphony.js` exposes `symphony app-data migration --json` as a read-only preview and rejects write or confirm probes through the app-data parser.
- `src/symphony/console.js` serves `GET /api/app-data/migration`, rejects query parameters, and does not add a browser write path.
- `frontend/workbench/src/api/contracts.js` and `frontend/workbench/src/App.jsx` project the migration preview into the Workbench as a display-only panel with schema, dry-run, confirmation, affected-area, step, and boundary fields.
- `fixtures/contracts/app-schema-migration.v1.json` and the v39 tests cover contract validation, boundary drift, CLI no-write behavior, API rejection behavior, Workbench projection, and frontend route allowlisting.

## Commands run

| Command | Result |
|---|---|
| `git -C /Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner status --short --branch` | Exit 0. Branch `v39-task-2-schema-version-migration-runner`; before this file was added, only `docs/plans/v39-task-2-review-evidence-2026-06-05.md` was untracked. |
| `git -C /Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner diff --check 036d2f6694f62960b1b05dbca04dd0c17699fb6d..90c8a31a8f8a7366c2c6ae5c89e7e224a685342f` | Exit 0. No whitespace errors. |
| `pnpm check` from `/Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner` | Exit 0. `node --check` completed for source, scripts, plugins, and tests. |
| `pnpm test` from `/Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner` | Exit 0. `tests 1024`, `suites 159`, `pass 1024`, `fail 0`, `duration_ms 5091.845209`. |
| `pnpm workbench:build` from `/Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner` | Exit 0. Vite built 17 modules and wrote `src/symphony/workbench-static/assets/index-3NTVLoEr.js`. |
| `pnpm --silent symphony app-data migration --json` from `/Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner` | Exit 0. Returned `app-schema-migration.v1` with schema `1 -> 2`, `dryRun.defaultMode: true`, `dryRun.previewOnly: true`, `dryRun.writesAttempted: false`, `confirmation.required: true`, and `confirmation.confirmAvailableFromBrowser: false`. |
| `pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --state-dir /Users/andy/Documents/project/multi-coding-agent-symphony/.symphony --json` from `/Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner` | Exit 0. Returned `goal-next-action.v1` with task `task-2`, role `main-verifier`, phase `main-verification`, worker/review evidence refs present, and `mainVerificationRef: null`. |
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --state-dir /Users/andy/Documents/project/multi-coding-agent-symphony/.symphony --json` from `/Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner` | Exit 0. Task-2 status was `approved`; review verdict was `APPROVED`; main verification ref was `null`. |

## Boundary checks

No shell execution surface, model invocation, provider CLI execution, arbitrary local-file open, arbitrary path read, browser migration confirm, git write, merge, push, tag, publish, self-approval, release-ready declaration, mutation, audit, doctor, or real CLI command was added or run during main verification.

## Result

Task-2 main verification passed. The supervisor can register `main.verification-passed` for task-2 with this evidence ref: `docs/plans/v39-task-2-main-verification-evidence-2026-06-05.md`.
