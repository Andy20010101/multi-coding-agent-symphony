# v39 task-1 worker revision 2 evidence

Goal id: `v39-backup-diagnostics-migration-workspace`  
Task id: `task-1`  
Role: `worker`  
Phase: `revision`  
Worker thread: `019e963d-1e91-7701-a7c8-60ace58830f9`

## Revision target

- Worktree: `/Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony`
- Branch: `v39-task-1-app-data-inventory`
- Base commit: `036d2f6694f62960b1b05dbca04dd0c17699fb6d`
- Head commit: `036d2f6694f62960b1b05dbca04dd0c17699fb6d`
- Worker implementation evidence: `docs/plans/v39-task-1-worker-implement-evidence-2026-06-05.md`
- Review evidence: `docs/plans/v39-task-1-review-evidence-2026-06-05.md`

## Ledger reconciliation

`pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json` from the root ledger checkout returned task-1, role `worker`, phase `revision`. The reason was the latest reviewer verdict: `reviewer.needs-revision`.

`pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` from the root ledger checkout reported task-1 as `needs-revision`, with review verdict `NEEDS_REVISION` and no blockers.

The root ledger checkout is on `codex/v41-v42-runtime-runbooks` with unrelated untracked evidence files. The implementation worktree is on `v39-task-1-app-data-inventory` with the existing task-1 uncommitted implementation changes.

## Reviewer blocker addressed

The reviewer found that `src/symphony/app-data-inventory.js` projected `currentProject.remote_url` into the settings domain as `remoteUrl` while the inventory contract set `secretValueExposureAvailable: false`.

The revision removes `remoteUrl` from the App Data Inventory settings refs and removes the remote URL from that domain's `itemCount`. The project registry still owns its `remote_url` field; the app data inventory no longer exposes it as a settings pointer.

The regression test creates a fixture repo with this origin URL:

`https://token:secret@example.com/org/private-repo.git`

It verifies that:

- the inventory contract remains valid;
- the settings domain has no `remoteUrl` ref;
- the serialized inventory does not include the raw URL;
- the serialized inventory does not include `token:secret`;
- `secretValueExposureAvailable` remains `false`.

## Files changed in this revision

- `src/symphony/app-data-inventory.js`
- `tests/v39-app-data-inventory.test.js`
- `docs/plans/v39-task-1-worker-revision-2-evidence-2026-06-05.md`

## Commands run

| Command | Directory | Result |
| --- | --- | --- |
| `pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json` | Root ledger checkout | Exit 0. Next action is task-1 worker revision. |
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` | Root ledger checkout | Exit 0. Task-1 status is `needs-revision`; no blockers. |
| `git status --short --branch` | Root ledger checkout | Exit 0. Branch `codex/v41-v42-runtime-runbooks`; unrelated untracked evidence files present. |
| `git status --short --branch` | Worker worktree | Exit 0. Branch `v39-task-1-app-data-inventory`; existing task-1 working-tree changes present. |
| `sed -n '1,260p' src/symphony/app-data-inventory.js` | Worker worktree | Exit 0. Confirmed the settings refs path that exposed `remoteUrl`. |
| `sed -n '1,280p' tests/v39-app-data-inventory.test.js` | Worker worktree | Exit 0. Located the focused inventory contract tests. |
| `rg -n "remote_url\|remoteUrl\|app-data\|settings refs\|settingsRefs\|secretValueExposureAvailable" -S .` | Worker worktree | Exit 0. Confirmed the reviewer blocker and related projections. |
| `pnpm test -- tests/v39-app-data-inventory.test.js` | Worker worktree | Exit 0. 5 tests passed, including the new credential-bearing remote URL regression. |
| `pnpm check` | Worker worktree | Exit 0. Syntax check passed. |
| `pnpm test` | Worker worktree | Exit 0. 1023 tests passed. |
| `pnpm workbench:build` | Worker worktree | Exit 0. Vite build completed. |
| `git diff --check` | Worker worktree | Exit 0. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` | Root ledger checkout | Exit 0. Task-1 remains `needs-revision` pending worker result registration. |

## Validation result

Self-check passed. The reviewer blocker is fixed, the regression test covers credential-bearing HTTPS remotes, and the required default gates passed in the implementation worktree.

## Risks

- The worktree remains an uncommitted implementation branch. `baseCommit` and `headCommit` are both `036d2f6694f62960b1b05dbca04dd0c17699fb6d`.
- The root ledger still shows task-1 as `needs-revision` until the supervisor registers this worker result.
