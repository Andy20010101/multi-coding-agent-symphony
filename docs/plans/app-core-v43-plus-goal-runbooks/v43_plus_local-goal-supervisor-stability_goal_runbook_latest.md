# v43+ Plan + /goal Runbook: Local Goal Supervisor Stability

Date: 2026-06-08  Goal id: `v43-plus-local-goal-supervisor-stability`

## Product Purpose

Stabilize the temporary local goal supervisor so it can keep serving v44+ project work while the project-internal supervisor module is planned later.

## Source Docs

- `docs/plans/v43-plus-goal-supervisor-stability-prep-2026-06-08.md`
- `docs/plans/v43-plus-local-goal-supervisor-stability-plan-2026-06-08.md`
- `docs/plans/controller/local-goal-supervisor-v43-plus-task-a-runner-quiesce-evidence-2026-06-08.md`
- `docs/plans/app-core-v43-plus-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `fixtures/contracts/goal-runbook.v43-plus-local-goal-supervisor-stability.v1.json`

## Tasks

- `task-1`: task-B daemon launcher and health wrapper
- `task-2`: task-C progress and stall classifier
- `task-3`: task-D evidence date, version snapshot, and worktree cleanup runbook
- `task-4`: task-E project-internal supervisor migration spec

## Non-goals

- Do not move the temporary runner into the repository.
- Do not add raw provider CLI execution.
- Do not expand active providers beyond `claude-code-cli` and `codex-cli`.
- Do not tag, push, publish, or declare release ready without explicit operator authorization.

## task-1: task-B daemon launcher and health wrapper

Branch: `v43-plus-task-b-daemon-launcher`
Worker evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-b-worker-evidence-2026-06-08.md`
Review evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-b-review-evidence-2026-06-08.md`
Main verification evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-b-main-verification-evidence-2026-06-08.md`

Acceptance:

- PTY-backed start command records pid, PTY log path, daemon id, goal id, interval, and max ticks.
- Stop command shuts down only the recorded daemon process.
- Doctor reports launcher status.
- Manual tick freshness is not daemon health.

## task-2: task-C progress and stall classifier

Branch: `v43-plus-task-c-progress-stall-classifier`
Worker evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-c-worker-evidence-2026-06-08.md`
Review evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-c-review-evidence-2026-06-08.md`
Main verification evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-c-main-verification-evidence-2026-06-08.md`

Acceptance:

- Active child progress records include readable turn status, update time when available, result escrow mtime, assigned worktree state, and latest relevant goal event.
- Recent progress waits.
- No progress after the grace window reports a bounded stalled state.
- Valid pending result is consumed before lossy app-server `notLoaded`.
- Duplicate active dispatch remains blocked.

## task-3: task-D evidence date, version snapshot, and worktree cleanup runbook

Branch: `v43-plus-task-d-evidence-worktree-runbook`
Worker evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-d-worker-evidence-2026-06-08.md`
Review evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-d-review-evidence-2026-06-08.md`
Main verification evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-d-main-verification-evidence-2026-06-08.md`
Cleanup runbook: `docs/plans/controller/local-goal-supervisor-v43-plus-worktree-cleanup-runbook-2026-06-08.md`
Cleanup evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-worktree-cleanup-evidence-2026-06-08.md`

Acceptance:

- Evidence names and bodies distinguish local date, timezone, and UTC timestamp.
- Runner snapshots cite script path, digest, selftest, launcher command, and doctor output.
- Worktree cleanup policy lists goal, branch, head, dirty state, merge state, and evidence state.
- Cleanup cannot remove dirty or unmerged task worktrees.

## task-4: task-E project-internal supervisor migration spec

Branch: `v43-plus-task-e-supervisor-migration-spec`
Worker evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-e-worker-evidence-2026-06-08.md`
Review evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-e-review-evidence-2026-06-08.md`
Main verification evidence: `docs/plans/controller/local-goal-supervisor-v43-plus-task-e-main-verification-evidence-2026-06-08.md`
Migration spec: `docs/plans/controller/local-goal-supervisor-v43-plus-task-e-project-internal-supervisor-migration-spec-2026-06-08.md`

Acceptance:

- Migration spec defines state writer, app thread adapter, workspace manager, result protocol/parser, event registrar, route engine, progress observer, and operator notification bridge.
- Active provider policy stays unchanged.
- Raw provider CLI execution and browser terminal automation remain out of scope.
- Temporary runner remains usable during migration planning.

## Release Gates

Scoped closeout gates:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

Do not run mutation, audit, doctor, tag, push, publish, provider CLI, or real CLI runner checks unless the operator explicitly asks for a repository release.
