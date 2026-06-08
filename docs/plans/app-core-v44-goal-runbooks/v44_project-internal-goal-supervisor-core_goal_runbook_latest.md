# v44 Plan + /goal Runbook: Project-internal Goal Supervisor Core

Date: 2026-06-08  Goal id draft: `v44-project-internal-goal-supervisor-core`

## Product Purpose

Move the stable supervisor contracts from the temporary project-external runner into repository-owned code as a narrow core module with read-only parity and dry-run write previews.

## Source Docs

- `docs/plans/v44-project-internal-goal-supervisor-core-plan-2026-06-08.md`
- `docs/plans/v43-plus-local-goal-supervisor-stability-plan-2026-06-08.md`
- `docs/plans/v43-plus-capability-harvest-matrix-2026-06-08.md`
- `docs/plans/controller/local-goal-supervisor-v43-plus-task-e-project-internal-supervisor-migration-spec-2026-06-08.md`
- `docs/plans/app-core-v44-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`

## Tasks

- `task-1`: result protocol and role-aware validator
- `task-2`: app thread adapter and escrow-first result consumer
- `task-3`: route engine and progress observer parity
- `task-4`: single state writer dry-run and event registrar preview
- `task-5`: supervisor core projection and migration handoff

## Non-goals

- Do not retire the temporary external runner.
- Do not implement PTY-backed daemon ownership in product code.
- Do not add raw provider CLI execution.
- Do not expand active providers beyond `claude-code-cli` and `codex-cli`.
- Do not add tag, push, publish, or release closeout automation.

## task-1: result protocol and role-aware validator

Branch: `v44-task-1-result-protocol-validator`
Worker evidence: `docs/plans/v44-task-1-worker-evidence-2026-06-08.md`
Review evidence: `docs/plans/v44-task-1-review-evidence-2026-06-08.md`
Main verification evidence: `docs/plans/v44-task-1-main-verification-evidence-2026-06-08.md`

Acceptance:

- bounded result block parsing is repository-owned;
- required fields are explicit;
- release-manager phase validation stays strict;
- replay coverage exists for malformed, mismatched, and valid results.

## task-2: app thread adapter and escrow-first result consumer

Branch: `v44-task-2-app-thread-adapter-result-consumer`
Worker evidence: `docs/plans/v44-task-2-worker-evidence-2026-06-08.md`
Review evidence: `docs/plans/v44-task-2-review-evidence-2026-06-08.md`
Main verification evidence: `docs/plans/v44-task-2-main-verification-evidence-2026-06-08.md`

Acceptance:

- read-only thread normalization exists in repository code;
- valid escrow result is preferred over lossy thread reads;
- duplicate dispatch remains blocked while an active lease exists;
- replay coverage proves unreadable-thread handling.

## task-3: route engine and progress observer parity

Branch: `v44-task-3-route-progress-parity`
Worker evidence: `docs/plans/v44-task-3-worker-evidence-2026-06-08.md`
Review evidence: `docs/plans/v44-task-3-review-evidence-2026-06-08.md`
Main verification evidence: `docs/plans/v44-task-3-main-verification-evidence-2026-06-08.md`

Acceptance:

- route decisions are deterministic from managed inputs;
- progress states distinguish `recent-progress`, `pending-result`, `stalled`, and `complete`;
- reviewer approval is never treated as main verification;
- replay coverage proves revision and stalled-child routing.

## task-4: single state writer dry-run and event registrar preview

Branch: `v44-task-4-state-writer-event-registrar`
Worker evidence: `docs/plans/v44-task-4-worker-evidence-2026-06-08.md`
Review evidence: `docs/plans/v44-task-4-review-evidence-2026-06-08.md`
Main verification evidence: `docs/plans/v44-task-4-main-verification-evidence-2026-06-08.md`

Acceptance:

- write previews include exact target event and refusal reasons;
- missing-audit and unsafe-write states are rejected in preview;
- no live managed goal event append is introduced by this task;
- tests cover trusted-registration and refusal paths.

## task-5: supervisor core projection and migration handoff

Branch: `v44-task-5-core-projection-handoff`
Worker evidence: `docs/plans/v44-task-5-worker-evidence-2026-06-08.md`
Review evidence: `docs/plans/v44-task-5-review-evidence-2026-06-08.md`
Main verification evidence: `docs/plans/v44-task-5-main-verification-evidence-2026-06-08.md`

Acceptance:

- repository-owned read-only projection can show route and progress state;
- docs clearly mark what remains external after v44;
- rollback guidance preserves the temporary runner as the operational fallback.

## Release Gates

Scoped closeout gates:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

Do not run mutation, audit, doctor, provider CLI, tag, push, or publish commands for scoped closeout unless a later v44 fixture explicitly adds them.
