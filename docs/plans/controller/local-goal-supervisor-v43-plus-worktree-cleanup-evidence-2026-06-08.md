# v43+ Local Goal Supervisor Worktree Cleanup Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B9`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Runbook added:

- `docs/plans/controller/local-goal-supervisor-v43-plus-worktree-cleanup-runbook-2026-06-08.md`

## Purpose

- Turn the cleanup policy into a repeatable operator runbook.
- Make the runner state its no-automatic-cleanup rule directly in the cleanup-plan contract.
- Capture the current repository/worktree inventory so later cleanup can rely on recorded evidence instead of operator memory.

## Change Summary

`worktree-cleanup-plan` now exposes the automatic-cleanup boundary directly:

- `automaticCleanupEnabled: false`
- `cleanupMode: "explicit-only"`

The cleanup runbook now defines:

- preconditions
- preserve rules
- explicit cleanup sequence
- required before/after evidence

The first validation pass did not remove worktrees. The bounded cleanup run below later removed only entries from a fresh plan where `cleanup.removalAllowed` was `true`.

## Focused Validation

Commands run:

```text
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs doctor --goal v43-plus-local-goal-supervisor-stability
git worktree list --porcelain
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs worktree-cleanup-plan --goal v43-plus-local-goal-supervisor-stability
```

Observed results:

- `selftest` passed after adding cleanup-policy checks for `automaticCleanupEnabled: false` and `cleanupMode: "explicit-only"`.
- `doctor --goal ...` reported:

```json
{
  "planStatus": "complete",
  "active": null
}
```

- the cleanup plan reported:

```json
{
  "worktreeCount": 37,
  "removableCount": 10,
  "blockedCount": 27
}
```

- blocked examples matched the intended preserve policy:
  - repo root checkout: blocked because it is the repo root, dirty, and unmerged
  - `v40-task-1` through `v40-task-5`: blocked because those worktrees are dirty
  - `v43-plus-task-b` through `v43-plus-task-e`: blocked because branch heads are unmerged and evidence is not yet on `main`
  - detached worktrees under `.codex/worktrees/*`: blocked because unnamed worktrees are never auto-removed

- removable examples were clean, merged, and no longer tied to an unfinished runbook task:
  - `v39-task-2-schema-version-migration-runner`
  - `v39-task-4-diagnostics-bundle`
  - `v39-task-5-restore-validation`
  - `v43-plus-prep`
  - `v43-task-2-workspace-evidence-safety`
  - `v43-task-3-route-status-reconciliation`
  - `v43-task-4-daemon-heartbeat-progress`

## Bounded Cleanup Run

Cleanup precondition:

```json
{
  "doctorGeneratedAt": "2026-06-08T03:16:11.615Z",
  "planStatus": "complete",
  "active": null
}
```

Fresh cleanup-plan before removal:

```json
{
  "generatedAtUtc": "2026-06-08T03:16:55.161Z",
  "worktreeCount": 37,
  "removableCount": 10,
  "blockedCount": 27
}
```

The cleanup script used the fresh `worktree-cleanup-plan` output as the only candidate source. It refused to continue if `doctor.active` was not `null`, if the repo path did not match this checkout, or if any candidate was the repo root, branchless, dirty, or unmerged.

Candidate worktree to branch mapping:

| Worktree | Branch | Head |
| --- | --- | --- |
| `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony` | `v39-task-3-backup-export-bundle` | `e1175ec43297cff4903b21d463255b50950b89de` |
| `/Users/andy/.codex/worktrees/745e/multi-coding-agent-symphony` | `codex/v43-planning` | `47481a3a5771b9e6eadbdd51f57b4e8589f09f98` |
| `/Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony` | `v39-task-1-app-data-inventory` | `411fe52880725956bae90102f2450ab9cf600a5e` |
| `/Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner` | `v39-task-2-schema-version-migration-runner` | `a4e04cb1aab3f8f4d16692086c8d49376d9271ee` |
| `/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle` | `v39-task-4-diagnostics-bundle` | `3a376798198fe9d29f8df61ccd206c59515f4879` |
| `/Users/andy/.codex/worktrees/v39-task-5-restore-validation` | `v39-task-5-restore-validation` | `588cfe97ef1a30591b6f38d44b451300f8b6f460` |
| `/Users/andy/.codex/worktrees/v43-plus-prep` | `codex/v43-plus-prep` | `3b656d7911a6a0f57edb3f5f8e53e559a1be76ba` |
| `/Users/andy/.codex/worktrees/v43-task-2-workspace-evidence-safety` | `v43-task-2-workspace-evidence-safety` | `e28839353f3edeb531dcd8c4313a878ff9d8b0ab` |
| `/Users/andy/.codex/worktrees/v43-task-3-route-status-reconciliation` | `v43-task-3-route-status-reconciliation` | `6939d4dcd126df851f935d353e4ebe585eab96ea` |
| `/Users/andy/.codex/worktrees/v43-task-4-daemon-heartbeat-progress` | `v43-task-4-daemon-heartbeat-progress` | `841904b62f46069317b43e8cca29f59d684aaac6` |

Commands run for cleanup:

```text
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs doctor --goal v43-plus-local-goal-supervisor-stability
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs worktree-cleanup-plan --goal v43-plus-local-goal-supervisor-stability
git -C /Users/andy/Documents/project/multi-coding-agent-symphony worktree remove <candidate-worktree>
git -C /Users/andy/Documents/project/multi-coding-agent-symphony branch -d <candidate-branch>
git -C /Users/andy/Documents/project/multi-coding-agent-symphony worktree prune
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs worktree-cleanup-plan --goal v43-plus-local-goal-supervisor-stability
git worktree list --porcelain
```

Removed worktrees:

- `/Users/andy/.codex/worktrees/15b8/multi-coding-agent-symphony`
- `/Users/andy/.codex/worktrees/745e/multi-coding-agent-symphony`
- `/Users/andy/.codex/worktrees/f120/multi-coding-agent-symphony`
- `/Users/andy/.codex/worktrees/v39-task-2-schema-version-migration-runner`
- `/Users/andy/.codex/worktrees/v39-task-4-diagnostics-bundle`
- `/Users/andy/.codex/worktrees/v39-task-5-restore-validation`
- `/Users/andy/.codex/worktrees/v43-plus-prep`
- `/Users/andy/.codex/worktrees/v43-task-2-workspace-evidence-safety`
- `/Users/andy/.codex/worktrees/v43-task-3-route-status-reconciliation`
- `/Users/andy/.codex/worktrees/v43-task-4-daemon-heartbeat-progress`

Deleted local branches:

- `v39-task-3-backup-export-bundle`
- `codex/v43-planning`
- `v39-task-1-app-data-inventory`
- `v39-task-2-schema-version-migration-runner`
- `v39-task-4-diagnostics-bundle`
- `v39-task-5-restore-validation`
- `codex/v43-plus-prep`
- `v43-task-2-workspace-evidence-safety`
- `v43-task-3-route-status-reconciliation`
- `v43-task-4-daemon-heartbeat-progress`

Branch deletion failures: none.

Fresh cleanup-plan after removal and `git worktree prune`:

```json
{
  "generatedAtUtc": "2026-06-08T03:17:12.712Z",
  "worktreeCount": 27,
  "removableCount": 0,
  "blockedCount": 27,
  "removable": []
}
```

Preserved blocked examples after cleanup:

- repo root checkout: preserved because it is the repo root, dirty, and unmerged
- detached unnamed worktrees under `/Users/andy/.codex/worktrees/*/multi-coding-agent-symphony`: preserved because detached or unnamed worktrees are not removed automatically
- `v40-task-1` through `v40-task-5`: preserved because those worktrees are dirty
- `v41-task-1` through `v41-task-5`: preserved because those worktrees are dirty
- `v42-bootstrap` and `v42-task-1` through `v42-task-5`: preserved because those worktrees are dirty
- `v43-plus-task-b` through `v43-plus-task-e`: preserved because branch heads are not merged into `main` and evidence is not present on `main`
- `v43-task-1-app-thread-result-protocol`: preserved because the worktree is dirty

## Result

B9 now has a repeatable cleanup runbook, a contract-level explicit-only cleanup policy, and one bounded live cleanup record. The runner did not present dirty, detached, unmerged, or repo-root worktrees as removable. After cleanup, the fresh plan reported zero remaining removable worktrees.

## Current Limit

- Detached worktrees still require separate manual review if they should be pruned later.
- Dirty historical worktrees still require separate owner review before any cleanup.
- Unmerged v43+ task worktrees stay until branch and evidence state are reconciled on `main`.
- No tag, push, publish, or release action was run in this cleanup pass.
