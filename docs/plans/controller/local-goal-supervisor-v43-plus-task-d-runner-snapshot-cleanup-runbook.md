# Local goal supervisor runner snapshot and worktree cleanup

Date: 2026-06-08

## Evidence clock

Every leased child prompt now carries an evidence clock:

- local run date for evidence filenames
- timezone used for that local date
- UTC generated timestamp for the evidence body

Evidence filenames should use the local run date. Evidence bodies should record all three values so a reviewer can tell which clock was used.

## Runner snapshot

Use this command before a major supervisor run or when recording release-adjacent supervisor evidence:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs runner-snapshot \
  --goal v43-plus-local-goal-supervisor-stability \
  --fixes "short fix 1; short fix 2"
```

The snapshot records:

- runner script path
- runner script digest
- selftest command and result
- daemon launcher command and launcher status
- doctor command and doctor output citation status
- external runner fixes supplied by `--fixes`

The snapshot does not run `doctor` by default. When the operator has authorized a doctor run, save the doctor output first and pass it in:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs runner-snapshot \
  --goal v43-plus-local-goal-supervisor-stability \
  --doctor-output /path/to/doctor-output.json
```

## Worktree Cleanup Plan

Use this command after release merge, before removing historical task worktrees:

```sh
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs worktree-cleanup-plan \
  --goal v43-plus-local-goal-supervisor-stability \
  --repo /Users/andy/Documents/project/multi-coding-agent-symphony \
  --base-ref main
```

The command is non-destructive. It lists each worktree with:

- goal and task when the branch belongs to the runbook
- branch
- head commit
- dirty state and compact status lines
- merge state against the cleanup base
- evidence state for recorded evidence refs
- cleanup decision and refusal reasons

Cleanup is blocked when a worktree is dirty, detached, unmerged, missing recorded evidence, or has evidence not present on the cleanup base. The repository root is never a cleanup target.

The command only reports candidates. A separate explicit cleanup command is required before any removal.
