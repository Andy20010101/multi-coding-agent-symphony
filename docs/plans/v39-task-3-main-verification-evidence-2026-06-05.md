# v39 task-3 main verification evidence

Date: 2026-06-05

Goal id: `v39-backup-diagnostics-migration-workspace`  
Task id: `task-3`  
Branch: `v39-task-3-backup-export-bundle`  
Worktree: `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony`  
Base commit: `036d2f6694f62960b1b05dbca04dd0c17699fb6d`  
Head commit: `cd58ec2973748062ccc317859caf0f1ff7f1b9ca`  
Worker evidence: `docs/plans/v39-task-3-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v39-task-3-review-evidence-2026-06-02.md`

## Verification scope

Verified the approved worker result in `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony`, not the root checkout. The compact supervisor context and root managed goal state both identify task-3 as ready for main verification.

The root managed goal state read through `/Users/andy/Documents/project/multi-coding-agent-symphony/.symphony` showed task-3 status `approved`, review verdict `APPROVED`, worker evidence `docs/plans/v39-task-3-worker-evidence-2026-06-02.md`, review evidence `docs/plans/v39-task-3-review-evidence-2026-06-02.md`, and no main verification ref yet.

The review evidence at `docs/plans/v39-task-3-review-evidence-2026-06-02.md` approved commit `cd58ec2973748062ccc317859caf0f1ff7f1b9ca` against base commit `036d2f6694f62960b1b05dbca04dd0c17699fb6d`.

## Acceptance checks

- `src/symphony/app-core-backup-export.js` defines `app-core-backup-export.v1` as a read-only manifest with managed `.symphony` state refs, SHA-256 hashes, ArtifactStore refs, manifest hash, and explicit repo content exclusions.
- `scripts/symphony.js` exposes `symphony backup export --goal <goal-id> --task <task-id> --json` and rejects `--output` so the CLI remains stdout-only.
- `src/symphony/console.js` serves `GET /api/backup/export`, accepts only `goal` and `task`, rejects unsafe refs and unsupported params, and does not add a write route.
- `frontend/workbench/src/api/contracts.js` and `frontend/workbench/src/App.jsx` project the backup export into the Workbench and Desktop Shell as display-only manifest/hash/ref state.
- `fixtures/contracts/app-core-backup-export.v1.json` and task tests cover contract validation, route safety, CLI behavior, Workbench projection, and boundary drift.

## Commands run

| Command | Result |
|---|---|
| `git -C /Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony status --short --branch` | Exit 0. Branch `v39-task-3-backup-export-bundle`; before this file was added, `docs/plans/v39-task-3-review-evidence-2026-06-02.md` was untracked. |
| `git -C /Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony rev-parse HEAD` | Exit 0. Returned `cd58ec2973748062ccc317859caf0f1ff7f1b9ca`. |
| `git -C /Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony merge-base 036d2f6694f62960b1b05dbca04dd0c17699fb6d HEAD` | Exit 0. Returned `036d2f6694f62960b1b05dbca04dd0c17699fb6d`. |
| `git -C /Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony diff --check 036d2f6694f62960b1b05dbca04dd0c17699fb6d..cd58ec2973748062ccc317859caf0f1ff7f1b9ca` | Exit 0. No whitespace errors. |
| `pnpm check` from `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony` | Exit 0. `node --check` completed for source, scripts, plugins, and tests. |
| `pnpm test` from `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony` | Exit 0. `tests 1022`, `suites 159`, `pass 1022`, `fail 0`, `duration_ms 4578.751541`. |
| `pnpm workbench:build` from `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony` | Exit 0. Vite built 17 modules and wrote `src/symphony/workbench-static/assets/index-BQhXXbtn.js`. |
| `git diff --check` from `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony` | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` from `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony` | Exit 0. Local worktree-managed state showed task-3 as `planned`; this was not used as the supervisor precondition. |
| `pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --state-dir /Users/andy/Documents/project/multi-coding-agent-symphony/.symphony --json` from `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony` | Exit 0. Returned `goal-next-action.v1` with task `task-3`, role `main-verifier`, phase `main-verification`, worker/review evidence refs present, and `mainVerificationRef: null`. |
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --state-dir /Users/andy/Documents/project/multi-coding-agent-symphony/.symphony --json` from `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony` | Exit 0. Task-3 status was `approved`; review verdict was `APPROVED`; main verification ref was `null`. |
| `pnpm --silent symphony backup export --goal v39-backup-diagnostics-migration-workspace --task task-3 --json \| node -e "<contract assertions>"` from `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony` | Exit 0. Returned `app-core-backup-export.v1 v39-backup-diagnostics-migration-workspace task-3 excluded`. |
| `pnpm --silent symphony backup export --goal v39-backup-diagnostics-migration-workspace --task task-3 --output backup.json` from `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony` | Exit 64 as expected. Returned `backup export is manifest/hash/refs only; redirect stdout if you need a file`. |
| `pnpm exec node --test tests/v39-backup-export-bundle.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js` from `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony` | Exit 0. `tests 81`, `suites 4`, `pass 81`, `fail 0`, `duration_ms 685.530375`. |

## Boundary checks

No shell execution surface, model invocation, provider CLI execution, arbitrary local-file open, arbitrary path read, browser backup write, artifact download, git write, merge, push, tag, publish, self-approval, release-ready declaration, mutation, audit, doctor, or real CLI command was added or run during main verification.

The delegated verifier did not perform an ff-only merge into root `main`, push, tag, or register a gate event. The supervisor should register the main verification event after validating this result block.

## Result

Task-3 main verification passed. The supervisor can register `main.verification-passed` for task-3 with this evidence ref: `docs/plans/v39-task-3-main-verification-evidence-2026-06-05.md`.
