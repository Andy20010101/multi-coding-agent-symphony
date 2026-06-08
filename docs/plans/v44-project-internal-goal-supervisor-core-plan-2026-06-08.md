# v44 Project-internal Goal Supervisor Core Plan

Date: 2026-06-08

Goal id draft: `v44-project-internal-goal-supervisor-core`

Release name: `v44 Project-internal Goal Supervisor Core`

Baseline:

- v43 release is complete and frozen.
- GitHub Release: `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v43`
- Tag: `v43`
- Tag peeled commit: `172140938503637dae909dc0daf87367ea5e9832`
- v43+ local goal supervisor stability goal is complete in managed goal state.

Source docs:

- `docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md`
- `docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md`
- `docs/plans/v43-plus-local-goal-supervisor-stability-plan-2026-06-08.md`
- `docs/plans/v43-plus-local-goal-supervisor-stability-backlog-2026-06-08.md`
- `docs/plans/v43-plus-capability-harvest-matrix-2026-06-08.md`
- `docs/plans/controller/local-goal-supervisor-v43-plus-task-e-project-internal-supervisor-migration-spec-2026-06-08.md`
- `docs/plans/controller/local-goal-supervisor-v43-plus-single-state-writer-audit-evidence-2026-06-08.md`
- `docs/plans/controller/local-goal-supervisor-v43-plus-release-phase-replay-evidence-2026-06-08.md`
- `docs/plans/controller/local-goal-supervisor-v43-plus-progress-classifier-evidence-2026-06-08.md`
- `docs/plans/controller/local-goal-supervisor-v43-plus-operator-notice-replay-evidence-2026-06-08.md`
- `docs/plans/controller/local-goal-supervisor-v43-plus-worktree-cleanup-evidence-2026-06-08.md`

## Positioning

v44 is the first repository-internal supervisor core release. It moves the stable, replayed contracts from the temporary project-external runner into product code as read-only parity and dry-run writer surfaces.

v44 does not retire the temporary runner at:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

It makes the project capable of reading, validating, previewing, and reconciling supervisor state with repository-owned code before any later release attempts full runtime handoff.

## What v44 Should Move Into The Repository

Move the `ready-to-plan` capabilities first:

- B1 single state writer and write-authority audit rule
- B2 result protocol and role-aware validator
- B3 app thread adapter contract for readback and follow-up capability declaration
- B4 escrow-first result consumer ordering and idempotent registration
- B6 progress observer and stall classifier
- B10 project-internal module boundary and migration checklist

Keep these external for now:

- B5 daemon launcher and PTY-backed process ownership
- B7 App notice-thread transport details
- B8 external runner provenance capture mechanics
- B9 destructive cleanup execution

## Product Purpose

Give the repository its own narrow supervisor core so route decisions, result parsing, progress classification, and event-registration previews no longer depend on prompt memory or on the external runner implementation details.

## Product Spine

```text
managed goal state
  -> app thread adapter
  -> result protocol and parser
  -> escrow-first result consumer
  -> route engine
  -> progress observer
  -> state writer dry-run preview
  -> event registrar preview
```

## Scope

v44 includes:

- a new repository-owned `src/symphony/goal-supervisor/` module boundary;
- read-only parity for route decisions, result parsing, worktree inspection, and progress snapshots;
- dry-run preview paths for state-writer and event-registrar actions;
- replay fixtures and tests for the harvested contracts moved into repository scope;
- read-only CLI or Workbench projection if needed to inspect route and progress outputs.

v44 excludes:

- raw provider CLI execution;
- provider allowlist expansion beyond `claude-code-cli` and `codex-cli`;
- browser terminal automation;
- generic shell execution;
- tag, push, publish, or GitHub Release automation;
- release closeout without explicit operator authorization;
- retirement of the project-external runner;
- a daemon launcher or host-specific monitor implementation inside product code.

## Proposed Module Shape

```text
src/symphony/goal-supervisor/
  index.js
  app-thread-adapter.js
  result-protocol.js
  route-engine.js
  progress-observer.js
  state-writer.js
  event-registrar.js
```

`workspace-manager.js` and `notification-bridge.js` may be stubbed or deferred in v44, but they should not own destructive cleanup or App-thread transport in this release.

## Tasks

### task-0: bootstrap v44 planning pack and managed goal

Goal:

Create the tracked v44 plan/runbook entry points and register the managed goal from a fixture created in this task.

Deliverables to create in task-0:

- `docs/plans/v44-project-internal-goal-supervisor-core-plan-2026-06-08.md`
- `docs/plans/app-core-v44-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/app-core-v44-goal-runbooks/v44_project-internal-goal-supervisor-core_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v44-project-internal-goal-supervisor-core.v1.json`

Acceptance:

- tracked v44 entry docs exist;
- the fixture validates against `assertGoalRunbookContract(...)`;
- `goal init --dry-run` succeeds for `v44-project-internal-goal-supervisor-core`;
- v44 explicitly keeps scoped closeout gates unless a later task changes them.

### task-1: result protocol and role-aware validator

Goal:

Move the bounded result block contract into repository code and make role and phase validation explicit.

Implementation scope:

- `result-protocol.js`
- role-aware parse and validation helpers
- release-manager phase-specific event validation
- parser tests and replay fixtures

Acceptance:

- one result block per phase;
- exact required fields are enforced;
- thread, branch, worktree, and evidence checks are explicit;
- release-manager `release-gate` and `release-prep` stay phase-aware;
- parser tests cover malformed blocks, wrong thread id, wrong role event, and replay-safe valid results.

### task-2: app thread adapter and escrow-first result consumer

Goal:

Introduce repository-owned read-only app thread normalization and consume valid pending results before lossy thread-state dependence.

Implementation scope:

- `app-thread-adapter.js`
- read-only thread normalization
- result availability inspection
- escrow-first route input builder

Acceptance:

- unreadable or `notLoaded` threads are non-mutating wait inputs;
- a valid escrow result is preferred over lossy thread reads;
- duplicate dispatch remains blocked while an active lease exists;
- replay tests cover unreadable thread with valid result and unreadable thread without valid result.

### task-3: route engine and progress observer parity

Goal:

Make repository-owned route decisions and progress classification deterministic without owning the live daemon.

Implementation scope:

- `route-engine.js`
- `progress-observer.js`
- shared `progressState` projection
- read-only route and progress outputs

Acceptance:

- route decisions distinguish dispatch, wait, blocked, stalled, pending-result, and complete;
- reviewer approval is not counted as main verification;
- `recent-progress`, `pending-result`, `stalled`, and `complete` are explicit progress states;
- replay tests cover worker -> reviewer -> main verification transitions plus stalled-child recovery guidance.

### task-4: single state writer dry-run and event registrar preview

Goal:

Bring B1 write-authority rules into repository scope without giving product code live write ownership yet.

Implementation scope:

- `state-writer.js`
- `event-registrar.js`
- dry-run preview payloads only
- plan-hash and refusal-reason rendering

Acceptance:

- previews show goal id, task id, role, event type, evidence ref, branch, head, and refusal reasons;
- missing-audit or unsafe write conditions are rejected in preview;
- no live goal event append happens from this task;
- tests cover trusted-registration preview and missing-audit refusal.

### task-5: supervisor core projection and migration handoff

Goal:

Publish the repository-owned parity surfaces clearly enough that later releases can compare them against the external runner before handoff.

Implementation scope:

- module index exports
- read-only CLI or Workbench projection if needed
- parity checklist and rollback notes

Acceptance:

- the repository can render read-only route and progress state from managed inputs;
- docs explain which paths remain external after v44;
- rollback guidance keeps the temporary external runner as the operational path.

## Release Gates

Until a later fixture changes them, keep the scoped closeout gate set used by v43+:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

Default local validation:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Do not add mutation, audit, doctor, tag, push, publish, provider CLI, or daemon process checks to default scoped closeout unless a later v44 runbook task explicitly requires them.

## Parallel Boundary

v44 should proceed in parallel with a small temporary-runner hardening lane, but that lane is support work, not the product release spine. The temporary runner remains the only live automation path until a later release proves parity and handoff.
