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

Managed-goal state:

```text
v38 managed runbook is registered.
Registered by controller command: /goal continue
Plan hash: sha256:3ab0de93b8fc56bff95d75d7df230fe66073ae0782d0030b571b371bdcf3dfe7
Runbook state: .symphony/goals/runbooks/v38-provider-hub-capability-profiles.json
Latest active goal pointer: .symphony/goals/latest-active-goal.json
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

Current intended next action:

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

Command received:

```text
/goal continue
```

Files read:

```text
docs/plans/controller/master-once-prompt.md
docs/plans/controller/README.md
docs/plans/controller/v38-controller-state.md
docs/plans/controller/subagent-result-format.md
docs/plans/controller/subagent-dispatch-log.md
fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json
docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
docs/release-checklist.md
```

Missing files recorded during startup read:

```text
docs/plans/v37-release-process-audit-2026-06-04.md
docs/plans/v37-release-to-v38-agent-cli-provider-handoff-2026-06-04.md
docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md
```

Git state after reconcile:

```text
controller worktree is clean on codex/controller-loop-ops at 01a1041 before this checkpoint update.
main is aligned with origin/main at 7f0108b.
v38 task-1 worktree exists and is clean at branch codex/v38-task-1-provider-profile-contract, commit 7f0108b.
remote branch origin/codex/test-hardening-convergence remains for separate review.
local archive/v37-legacy-task0-runbook-09c926f remains as short-term safety reference.
```

Controller action completed:

```text
pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json --goal v38-provider-hub-capability-profiles --dry-run --json
pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json --goal v38-provider-hub-capability-profiles --confirm --plan-hash sha256:3ab0de93b8fc56bff95d75d7df230fe66073ae0782d0030b571b371bdcf3dfe7 --json
```

Result:

```text
v38 managed runbook registered.
No task event registered.
No subagent dispatched.
No mutation, audit, doctor, real CLI, tag, or push command run.
```

Reconcile after action:

```text
pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
returns goal-progress-ledger.v1 with 5 planned tasks and 0 completed tasks.

pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json
returns action-required: task-1 worker, reason: No explicit worker evidence is recorded for task-1.
```

Evidence refs:

```text
task-1 worker evidence: null
task-1 review evidence: null
task-1 main verification evidence: null
```

Subagent:

```text
none created or steered in this turn
```

## Next Suggested Command

```text
/goal autopilot --steps 3 --stop-on-subagent
```
