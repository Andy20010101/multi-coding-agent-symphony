# v41-v42 Goal Runbooks

This pack starts after the v40 App Core release.

## Sequence

```text
v41 controlled CLI provider runner and backend completion
  -> v42 goal supervisor runtime context loop
```

## Start v41

```sh
pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json \
  --goal v41-controlled-cli-provider-runner-backend-completion \
  --dry-run --json
```

Confirm only with the returned plan hash.

## Boundaries

- v41 active providers are `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek are not v41 active providers.
- Provider CLI execution must go through a controlled backend runner.
- UI and renderer code must not execute provider CLIs directly.
- Do not add a generic shell runner.
- v42 is listed as the next module only; do not implement it during v41.

## Post-v42 Reference

For post-v42 planning, use the tracked v42 plan, runbook, fixture, release evidence, GitHub release evidence, and local supervisor MVP notes. Do not rely on untracked `.symphony` managed-goal state as the only historical entry point.

Tracked v42 references:

- `docs/plans/v42-goal-supervisor-runtime-context-loop-plan-2026-06-06.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/v42_goal-supervisor-runtime-context-loop_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v42-goal-supervisor-runtime-context-loop.v1.json`
