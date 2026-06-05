# v39 task-1 review evidence

Goal id: `v39-backup-diagnostics-migration-workspace`  
Task id: `task-1`  
Role: `reviewer`  
Phase: `review`  
Branch: `v39-task-1-app-data-inventory`  
Worktree: `/Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony`  
Base commit: `036d2f6694f62960b1b05dbca04dd0c17699fb6d`  
Head commit: `036d2f6694f62960b1b05dbca04dd0c17699fb6d`

## Reconciliation

Root `goal next` returned task-1, role `reviewer`, phase `review`, with worker evidence `docs/plans/v39-task-1-worker-implement-evidence-2026-06-05.md`.

Root `goal-status` returned task-1 status `self-checked` from `goal-event-log.v1:evt_65555f7d1f22ee96`, but it still carries older review and main verification refs from June 2. The review used `goal next` and the June 5 worker evidence as the active handoff.

Worker-local `goal-status` still exits 64 with `goal not found`. Product review was done from the worker worktree diff, and durable goal state was read from `/Users/andy/Documents/project/multi-coding-agent-symphony`.

The worker branch has uncommitted implementation changes on top of `036d2f6694f62960b1b05dbca04dd0c17699fb6d`.

## Diff reviewed

`git diff --stat` shows changes in README/docs, Workbench frontend contract projection, Workbench UI, console server route registration, Workbench static output, and two existing tests. Untracked task files include:

- `src/symphony/app-data-inventory.js`
- `tests/v39-app-data-inventory.test.js`
- `src/symphony/workbench-static/assets/index-ChDY1mAT.js`
- worker evidence files under `docs/plans/`

The implementation adds `app-data-inventory.v1`, `GET /api/app/data-inventory`, Workbench route projection, an App Data Inventory panel, route allowlist coverage, and contract tests.

## Blocking finding

`src/symphony/app-data-inventory.js:172` adds the current project remote URL to the settings domain refs:

`refItem('remoteUrl', currentProject?.remote_url)`

`currentProject.remote_url` comes from `.git/config` without redaction in `src/symphony/project-registry.js:288`. A review fixture with this origin URL:

`https://token-user:ghp_testSecret123456@github.com/acme/repo.git`

returned that value verbatim from `buildAppDataInventory`. The same inventory declares `secretValueExposureAvailable: false` for the settings domain and for the top-level inventory boundaries.

This violates the task boundary that the App/Workbench inventory must not expose secret values. The fix should either remove `remoteUrl` from the inventory settings refs or redact credential-bearing URL userinfo before it reaches the inventory contract and Workbench projection. Add a regression test using a credential-bearing remote URL.

## Validation run

| Command | Directory | Result |
| --- | --- | --- |
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` | root checkout | Exit 0. Task-1 is `self-checked`, with stale June 2 review/main-verification refs still present. |
| `pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json` | root checkout | Exit 0. Next action is task-1 reviewer review. |
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` | worker worktree | Exit 64, `goal not found`. |
| `sed -n '1,260p' docs/plans/v39-task-1-worker-implement-evidence-2026-06-05.md` | worker worktree | Exit 0. Read June 5 worker evidence. |
| `git diff --stat` and targeted `git diff`/`sed` reads | worker worktree | Exit 0. Reviewed backend route, inventory contract, Workbench projection/UI, docs, tests, and static output refs. |
| Credential-bearing remote URL fixture with `buildAppDataInventory` | worker worktree | Exit 0. Reproduced `remote-secret-exposed`. |
| `pnpm check` | worker worktree | Exit 0. Syntax check passed. |
| `node --test tests/v39-app-data-inventory.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js` | worker worktree | Exit 0. 81 tests passed. |
| `git diff --check` | worker worktree | Exit 0. No whitespace errors. |

## Verdict

NEEDS_REVISION.

The main implementation path is in the right shape, and the focused validation commands pass. The unredacted remote URL exposure is a blocking boundary issue because the new inventory panel advertises secret-value protection while displaying a field that can contain credentials.
