# v43+ Local Goal Supervisor Stability Plan

Date: 2026-06-08

Goal id: `v43-plus-local-goal-supervisor-stability`

Baseline:

- v43 release is complete.
- GitHub Release: `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v43`
- Tag: `v43`
- Tag peeled commit: `172140938503637dae909dc0daf87367ea5e9832`
- `origin/main` after v43+ prep merge: `3b656d7911a6a0f57edb3f5f8e53e559a1be76ba`
- task-A evidence branch head: `7898460562a6c0820f2e7850f0bd655b61c7ae41`

## Purpose

This goal lets the temporary project-external coding system finish its remaining stability work while keeping the repository as the evidence ledger.

The implementation target is outside this repository:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

Repository work is limited to planning, runbook, evidence, and task branch commits. This goal does not move the supervisor into the product.

## Completed Input

task-A is already done and recorded:

```text
docs/plans/controller/local-goal-supervisor-v43-plus-task-a-runner-quiesce-evidence-2026-06-08.md
```

The remaining work starts from task-B.

## Tasks

### task-1: task-B daemon launcher and health wrapper

Goal:

Make daemon start/stop behavior deterministic. The working PTY-backed launch path should become a runner command instead of an operator memory.

Acceptance:

- A runner command starts the daemon with the known-good PTY path.
- The command records pid, PTY log path, daemon id, goal id, interval, and max tick budget.
- A stop command shuts down only the recorded daemon process.
- Doctor reports whether the daemon was started through the expected launcher.
- Manual ticks do not make doctor report a healthy daemon.

### task-2: task-C progress and stall classifier

Goal:

Classify active child progress without creating duplicate child work.

Acceptance:

- Active child records include latest readable turn status, thread update time when available, result escrow mtime, assigned worktree branch/head/dirty state, and latest relevant goal event.
- A child with recent progress remains in wait state.
- A child with no progress after the grace window reports an operator-visible stalled state.
- Valid recorded results are consumed before lossy app-server `notLoaded` checks.
- Duplicate dispatch stays blocked while an active lease exists.

### task-3: task-D evidence date, version snapshot, and worktree cleanup runbook

Goal:

Make temporary runner evidence repeatable and make post-release worktree cleanup safe.

Acceptance:

- Evidence names and bodies distinguish local run date, timezone, and UTC generated timestamp.
- Major supervisor runs can cite runner script path, digest, selftest result, launcher command, and doctor output.
- Worktree cleanup policy lists goal, branch, head, dirty state, merge state, and evidence state.
- Cleanup cannot remove dirty or unmerged task worktrees.

### task-4: task-E project-internal supervisor migration spec

Goal:

Document the migration path from the temporary external runner to a project-internal supervisor module.

Acceptance:

- The spec defines single state writer, app thread adapter, workspace manager, result protocol/parser, event registrar, route engine, progress observer, and operator notification bridge.
- The spec preserves active provider policy: only `claude-code-cli` and `codex-cli` are active.
- The spec does not add raw provider CLI execution, browser terminal automation, or tag/publish automation.
- The temporary runner remains usable while project-internal work is planned.

## Gates

Default local checks for this goal:

```text
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
git diff --check
pnpm --silent symphony goal-status --goal v43-plus-local-goal-supervisor-stability --json
```

Run `pnpm check`, `pnpm test`, and `pnpm workbench:build` when a task changes repository source or when main verification chooses to run the full default closeout gates.

## Boundaries

- Do not call provider CLIs.
- Do not add raw CLI runner scope.
- Do not promote Gemini CLI, Kiro CLI, or DeepSeek to active provider scope.
- Do not tag, push, publish, or declare release ready unless the operator explicitly authorizes release closeout.
- Do not delete historical worktrees during implementation tasks.
