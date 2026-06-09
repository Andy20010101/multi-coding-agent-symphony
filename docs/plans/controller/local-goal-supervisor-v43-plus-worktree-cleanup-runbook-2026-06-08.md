# v43+ Local Goal Supervisor Worktree Cleanup Runbook

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B9`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

## Purpose

Use one repeatable operator flow to decide which historical worktrees can be removed and which must be preserved.

This runbook does not allow automatic deletion. The runner policy is explicit-only:

- `automaticCleanupEnabled: false`
- `cleanupMode: "explicit-only"`

## Preconditions

Before touching any worktree:

1. Confirm the goal has no live child lease:

   ```text
   node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs doctor --goal <goal-id>
   ```

2. Confirm the target worktree is not the repository root.
3. Confirm the target worktree is not the active worktree for a running daemon tick or unfinished task.
4. Do not remove a worktree only because the branch looks old. Removal depends on the cleanup plan fields below.

## Generate The Cleanup Plan

Run:

```text
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs worktree-cleanup-plan --goal <goal-id> [--repo <path>] [--base-ref main]
```

The plan returns one entry per worktree with:

- `goalId`
- `taskId`
- `worktree`
- `branch`
- `head`
- `dirtyState`
- `mergeState`
- `evidenceState`
- `cleanup`

## How To Read One Entry

Use the entry fields in this order:

1. `dirtyState.dirty`
   - `true` means preserve.
2. `mergeState.branchMerged`
   - anything other than `true` means preserve.
3. `evidenceState`
   - `no-recorded-evidence` or `evidence-not-merged` means preserve.
4. `cleanup.removalAllowed`
   - only `true` means the worktree is eligible for explicit cleanup.

`cleanup.reasons` is the operator-facing explanation for every preserve decision.

## Preserve Rules

Preserve the worktree when any of these conditions apply:

- `repo root is not a cleanup target`
- `detached or unnamed worktree is not removed automatically`
- `path is not a git worktree`
- `worktree is dirty`
- `branch head is not merged into cleanup base`
- `evidence is not recorded or not present on cleanup base`

These are hard stops. Do not override them with shell cleanup commands.

## Explicit Cleanup Sequence

Only entries with `cleanup.removalAllowed: true` are candidates.

For each candidate:

1. Re-check the specific entry from a fresh cleanup plan.
2. Remove the worktree:

   ```text
   git -C <repo> worktree remove <worktree-path>
   ```

3. If the branch is no longer needed and `mergeState.branchMerged` is `true`, delete the local branch:

   ```text
   git -C <repo> branch -d <branch>
   ```

4. Prune stale git metadata:

   ```text
   git -C <repo> worktree prune
   ```

5. Re-run `worktree-cleanup-plan` and keep the before/after output with the cleanup evidence.

## Notes For This Repository

- v43+ task worktrees that are still unmerged or whose evidence is not on `main` must stay.
- Dirty historical worktrees stay, even if their branch is already merged.
- Detached worktrees are not auto-removed by this runbook. They require a separate manual decision.
- The repository root checkout is never a cleanup target.

## Output To Keep

When cleanup is performed, record:

- the exact `worktree-cleanup-plan` output before removal
- the list of removed worktree paths
- any deleted local branch names
- the post-cleanup `worktree-cleanup-plan` output

Without that record, cleanup is incomplete.
