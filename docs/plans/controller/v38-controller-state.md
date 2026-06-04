# v38 Controller State

Date: 2026-06-04

## Current Goal

Goal id: `v38-provider-hub-capability-profiles`

Goal title: `v38 Agent CLI Provider Hub MVP`

Baseline:

```text
v37 release tag: v37
v37 tag peeled commit: 075990a0b67c334220bd33b95ff4eb4f88e274bd
origin/main: 7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0
GitHub Release: https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v37
```

Known managed-goal state issue:

```text
pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
returns exit 64 / goal not found in this checkout.
```

Use v37 release, tag, and GitHub Release evidence on `origin/main` as the v37 baseline source.

## Active Work

Active v38 branch:

```text
codex/v38-task-1-provider-profile-contract
```

Active v38 worktree:

```text
/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony
```

Controller ops branch:

```text
codex/controller-loop-ops
```

## v38 Task Order

1. `task-1`: Agent CLI provider profile contract
2. `task-2`: Agent CLI health check API
3. `task-3`: Capability profile mapping
4. `task-4`: Worker/reviewer lane assignment preview
5. `task-5`: Agent CLI Provider Hub panel + evidence

Current intended start:

```text
task-1 worker
```

## Scope Decisions

- v38 only does Agent CLI Provider Hub MVP.
- Active providers are `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek active provider are out of scope.
- DeepSeek may only be a sanitized backend profile behind an existing CLI provider.
- v38 does not implement a real CLI runner.
- v41 owns Controlled CLI Provider Runner + Backend Completion.

## Release Gates

Use fixture `releaseGates` as source of truth:

```text
release.pnpm-check
release.pnpm-test
release.workbench-build
release.diff-check
release.docs-updated
```

Default commands:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Do not run mutation, audit, doctor, real CLI, tag, push, or publish unless explicitly requested or explicitly listed in the current runbook.

## Last Reconciliation

Status before controller thread starts:

```text
main is clean and aligned with origin/main at 7f0108b.
v38 worktree exists and is clean at branch codex/v38-task-1-provider-profile-contract.
remote branch origin/codex/test-hardening-convergence remains for separate review.
local archive/v37-legacy-task0-runbook-09c926f remains as short-term safety reference.
dirty legacy worktrees were stashed during git cleanup.
```

## Next Suggested Command

```text
/goal continue
```
