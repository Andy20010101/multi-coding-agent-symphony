# v42 Goal Supervisor Runtime Context Loop Plan

Date: 2026-06-06

Goal id: `v42-goal-supervisor-runtime-context-loop`

Release name: `v42 Goal Supervisor Runtime Context Loop`

Baseline: `v41 Controlled CLI Provider Runner + Backend Completion`

Baseline evidence:

- v41 release evidence: `docs/plans/v41-release-evidence-2026-06-06.md`
- v41 runbook: `docs/plans/app-core-v41-v42-goal-runbooks/v41_controlled-cli-provider-runner-backend-completion_goal_runbook_latest.md`
- v41 fixture: `fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json`
- v41 peeled tag commit: `00387489fffa843ed5e694ede7b2c55951061323`
- v41 GitHub Release: `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v41`

## Reconciliation

v42 released from managed goal state plus project-external local supervisor execution. At release time, the tracked checkout on `main` contained the local supervisor MVP notes and release evidence, but not the full tracked v42 plan, runbook, or fixture entry points.

This plan restores those tracked entry points so later work can reconcile from repository files instead of depending on untracked `.symphony` state or worktree-only history. The release truth for v42 remains:

- `docs/plans/v42-release-evidence-2026-06-06.md`
- `docs/plans/v42-github-release-evidence-2026-06-06.md`
- `docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md`

This does not mean the temporary project-external supervisor was fully merged into product code in v42. It means the repository now has a stable historical entry point for v43 planning and later review.

## Product Purpose

v42 turns the temporary local goal supervisor experience into a product-facing runtime model: durable state, controlled thread lifecycle, workspace and evidence boundaries, daemon/heartbeat health, and read-only CLI or Workbench projection.

## Product Spine

```text
managed goal runbook
  -> local supervisor state and route engine
  -> App thread adapter and result protocol
  -> workspace and evidence-location gates
  -> daemon and heartbeat coordination
  -> CLI and Workbench projection
```

## Scope

- Define a durable supervisor state model and route engine that use event sequence plus validated local results.
- Normalize App thread creation, readback, result blocks, and correction or recovery flow.
- Gate workspace preparation, dependency readiness, evidence location, and root-vs-worktree safety.
- Separate daemon health, heartbeat wake logic, operator notification, and progress monitoring.
- Expose bounded read-only supervisor status through CLI and Workbench surfaces without adding shell execution or provider calls.

## Non-goals

- No generic shell runner.
- No raw provider CLI execution.
- No active Gemini CLI, Kiro CLI, or DeepSeek provider promotion.
- No merge, push, tag, publish, or self-approval controls in UI.
- No claim that the project-external local supervisor is already a fully merged product module.
- No v43 stabilization or follow-on work inside the v42 scope itself.

## Tasks

1. `task-0`: Bootstrap v42 runbook, fixture, and managed goal
   - Restore tracked v42 entry docs and fixture.
   - Keep the release gate set limited to scoped closeout plus docs-updated evidence.

2. `task-1`: State store and route engine contracts
   - Durable single-writer state.
   - Route decisions from event sequence plus validated results.

3. `task-2`: App thread adapter and result protocol
   - Stable thread binding and readback.
   - Bounded result correction and recovery flow.

4. `task-3`: Workspace manager and evidence-location gates
   - Worktree preparation, dependency readiness, file inventory, and evidence-location enforcement.

5. `task-4`: Daemon, heartbeat, operator notification, and progress monitor
   - Health separation, stale detection, operator-visible blockers, and restart safety.

6. `task-5`: Workbench and CLI projection
   - Read-only status projection for active lease, checkpoints, blockers, and safe resume commands.

## Release Gates

v42 used the same scoped closeout gate set as v38-v41:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

Default local validation for scoped closeout:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Mutation, audit, doctor, tag, push, publish, and raw provider CLI checks are not default scoped v42 gates. They apply only when a later runbook explicitly adds them or when an operator requests repository tag or full release validation.

v43 must explicitly say whether it continues this scoped gate set unchanged or replaces it.

## Historical Boundary

v42 is the release where the repository captured the temporary supervisor MVP lessons and release evidence. It is not the release where the project-external local supervisor was fully absorbed into the product surface. That distinction is the key boundary v43 must keep.
