# v39 task-1 review revision 2 evidence

Goal id: `v39-backup-diagnostics-migration-workspace`
Task id: `task-1`
Role: `reviewer`
Phase: `review`
Thread id: `019e9644-c4b2-77f3-a583-18a3b8e2c9c9`

## Review target

- Worker thread: `019e963d-1e91-7701-a7c8-60ace58830f9`
- Branch: `v39-task-1-app-data-inventory`
- Worktree: `/Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony`
- Base commit: `036d2f6694f62960b1b05dbca04dd0c17699fb6d`
- Head commit: `036d2f6694f62960b1b05dbca04dd0c17699fb6d`
- Worker evidence reviewed: `docs/plans/v39-task-1-worker-revision-2-evidence-2026-06-05.md`
- Prior blocker evidence: `docs/plans/v39-task-1-review-evidence-2026-06-05.md`

## Reconciliation

Root `pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json` returned task-1, role `reviewer`, phase `review`, with worker evidence `docs/plans/v39-task-1-worker-revision-2-evidence-2026-06-05.md`.

Root `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` reported task-1 as `self-checked` from `goal-event-log.v1:evt_96615ec624b1d8ea`; the previous review verdict remains `NEEDS_REVISION` until this review result is registered.

Root checkout status: branch `codex/v41-v42-runtime-runbooks`, with unrelated untracked evidence files. Worker worktree status: branch `v39-task-1-app-data-inventory`, with task-1 implementation files and evidence files still uncommitted.

## Blocker review

Prior blocker: `src/symphony/app-data-inventory.js` exposed `currentProject.remote_url` as a settings ref named `remoteUrl` while the inventory declared `secretValueExposureAvailable: false`. A credential-bearing HTTPS remote URL could therefore be serialized into the App Data Inventory response.

Revision 2 removes `remoteUrl` from the App Data Inventory settings domain refs and removes the remote URL from that domain's `itemCount`. The project registry still owns `remote_url`; this review is only approving that the App Data Inventory no longer republishes it through the settings domain.

The focused regression in `tests/v39-app-data-inventory.test.js` creates a fixture `.git/config` with `https://token:secret@example.com/org/private-repo.git` and verifies:

- the inventory contract validates;
- the settings domain has no `remoteUrl` ref;
- serialized inventory does not include the raw URL;
- serialized inventory does not include `token:secret`;
- `secretValueExposureAvailable` remains `false`.

## Commands run

| Command | Directory | Result |
| --- | --- | --- |
| `pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json` | `/Users/andy/Documents/project/multi-coding-agent-symphony` | Exit 0. Returned task-1 reviewer review. |
| `pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` | `/Users/andy/Documents/project/multi-coding-agent-symphony` | Exit 0. Task-1 is self-checked pending reviewer verdict registration. |
| `git -C /Users/andy/Documents/project/multi-coding-agent-symphony status --short --branch` | `/Users/andy/Documents/project/multi-coding-agent-symphony` | Exit 0. Root branch `codex/v41-v42-runtime-runbooks`; unrelated untracked evidence files present. |
| `git -C /Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony status --short --branch` | `/Users/andy/Documents/project/multi-coding-agent-symphony` | Exit 0. Worker branch `v39-task-1-app-data-inventory`; task files and evidence files uncommitted. |
| `sed -n '1,220p' /Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony/docs/plans/v39-task-1-worker-revision-2-evidence-2026-06-05.md` | `/Users/andy/Documents/project/multi-coding-agent-symphony` | Exit 0. Read latest worker evidence. |
| `git -C /Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony diff -- src/symphony/app-data-inventory.js tests/v39-app-data-inventory.test.js` | `/Users/andy/Documents/project/multi-coding-agent-symphony` | Exit 0. No output because both focused files are untracked in the worker worktree. |
| `sed -n '1,260p' src/symphony/app-data-inventory.js` | `/Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony` | Exit 0. Reviewed settings domain projection; no `remoteUrl` ref is emitted. |
| `sed -n '1,340p' tests/v39-app-data-inventory.test.js` | `/Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony` | Exit 0. Reviewed credential-bearing remote URL regression. |
| `rg -n "remote_url\|remoteUrl\|secretValueExposureAvailable\|settings" src/symphony/app-data-inventory.js tests/v39-app-data-inventory.test.js` | `/Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony` | Exit 0. Confirmed no `remoteUrl` inventory settings ref remains. |
| `git -C /Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony ls-files --stage -- src/symphony/app-data-inventory.js tests/v39-app-data-inventory.test.js` | `/Users/andy/Documents/project/multi-coding-agent-symphony` | Exit 0. No output; focused files are untracked. |
| `git -C /Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony status --short -- src/symphony/app-data-inventory.js tests/v39-app-data-inventory.test.js docs/plans/v39-task-1-worker-revision-2-evidence-2026-06-05.md` | `/Users/andy/Documents/project/multi-coding-agent-symphony` | Exit 0. Focused source, test, and worker evidence are untracked. |
| `pnpm test -- tests/v39-app-data-inventory.test.js` | `/Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony` | Exit 0. 5 tests passed, including the credential-bearing remote URL regression. |
| `git -C /Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony diff --check` | `/Users/andy/Documents/project/multi-coding-agent-symphony` | Exit 0. No whitespace errors. |
| `sed -n '1,220p' /Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony/docs/plans/v39-task-1-review-evidence-2026-06-05.md` | `/Users/andy/Documents/project/multi-coding-agent-symphony` | Exit 0. Read prior blocker evidence. |
| `sed -n '260,540p' src/symphony/app-data-inventory.js` | `/Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony` | Exit 0. Reviewed validation and boundary helpers. |
| `rg -n "app-data-inventory\|remoteUrl\|remote_url" .` | `/Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony` | Exit 0. Confirmed remaining `remoteUrl` references are outside the App Data Inventory settings ref path or in regression/evidence context. |

## Verdict

APPROVED.

The latest worker worktree and worker evidence resolve the remote URL credential exposure blocker. The App Data Inventory settings domain no longer returns `currentProject.remote_url`, and the focused regression covers credential-bearing HTTPS remote URLs while preserving `secretValueExposureAvailable: false`.

## Risks

- The worker result remains an uncommitted worktree result. `baseCommit` and `headCommit` are both `036d2f6694f62960b1b05dbca04dd0c17699fb6d`.
- Full gates were reported by the worker evidence but were not rerun in this review; this review reran the focused inventory test and `git diff --check`.
