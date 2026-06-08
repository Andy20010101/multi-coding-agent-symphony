# v43+ Capability Harvest Matrix

Date: 2026-06-08

Input goal: `v43-plus-local-goal-supervisor-stability`

Purpose:

- Track which stability fixes in the temporary coding system are turning into reusable project capabilities.
- Keep temporary runner implementation details out of the project until the reusable contract is clear.

## Decision Rule

Use these labels:

- `temporary-only`: keep the fix in the external runner.
- `candidate`: likely reusable, but still needs a bounded contract or replay coverage.
- `ready-to-plan`: stable enough to schedule as a project module or submodule.

An item should be marked `ready-to-plan` only when it has a clear contract, at least one repository-side test or fixture target, and no remaining dependency on operator memory.

## Matrix

| Backlog id | Problem being solved | Temporary fix lane | Project capability candidate | Decision | Why |
| --- | --- | --- | --- | --- | --- |
| B1 | Child thread bypassed the single state writer and directly appended `release.ready-declared`. | Keep release-prep result-only, append an explicit runner registration audit, and block completion recovery when the ledger event has no matching runner audit. | Goal supervisor event registrar with explicit write authority rules. | ready-to-plan | This is not a daemon detail. It is a core contract for any future in-project supervisor, and the repository now has bounded evidence for both the trusted-registration path and the missing-audit recovery path. |
| B2 | Release-manager results mixed multiple gates or wrong gate names, forcing manual escrow edits. | Tighten result validator and correction path in the external runner. | `app-thread-result-protocol` plus role-specific result schemas and parser tests. | ready-to-plan | The protocol already has repository touchpoints and will be reused outside this one goal. |
| B3 | Follow-up messaging to an active child was unavailable for some App threads. | Declare follow-up capability at bind time and avoid steering paths that require unsupported follow-ups. | App thread adapter contract: create, read, declare follow-up support, consume result. | candidate | The capability is reusable, but it still needs live replay coverage for same-session follow-up versus later-session recovery. |
| B4 | A valid result can exist before the active thread reader is healthy. | Consume escrow first and treat lossy thread reads as non-mutating wait states. | Result consumer state machine with escrow-first ordering and idempotent registration. | ready-to-plan | This is a durable supervisor rule, not a local workaround. |
| B5 | Daemon health, manual ticks, waiting-operator, and restart behavior need clear separation. | Keep PTY launch, pid/health files, and quiesce behavior in the external runner for now. | Supervisor health model: `daemon-active`, `waiting-operator`, `manual-tick-recent`, `stopped`, `stale`. | candidate | The state model is reusable, but the launcher/process mechanics are still temporary-only. |
| B6 | The system cannot yet classify progress versus stall with enough precision to recover automatically. | Implement the task-2 classifier and expose it through doctor as one active-progress panel. | Progress observer and stall classifier for child leases. | ready-to-plan | This is a supervisor primitive that future controlled execution also needs, and the repository now has evidence for the output contract even though more replay coverage is still useful. |
| B7 | Approval-required actions do not yet surface through one reliable user-visible path. | Normalize notices and operator actions in the external runner around one payload contract and one dedupe helper. Retire resolved notices out of live state and keep their history in the audit log. | Operator notification bridge and approval event contract. | candidate | The notice payload and lifecycle rules are reusable, but the user-facing transport is still tied to temporary App notice threads and daemon behavior. |
| B8 | External runner behavior can drift outside repository history. | Capture one runner snapshot that records script digest, selftest status, launcher command, and a bound doctor payload from the same invocation. | Runner provenance snapshot contract for out-of-repo dependencies. | candidate | The snapshot contract is reusable for any external controller dependency, but the current implementation is still tied to the temporary runner path and local doctor payload shape. |
| B9 | Worktree cleanup can destroy evidence or dirty task state if not reconciled first. | Add cleanup runbook and safety checks in the external runner, with cleanup-plan output that declares cleanup is explicit-only and never automatic for dirty or unmerged task worktrees. | Workspace manager cleanup policy and archive contract. | candidate | The policy and decision fields are reusable; the actual cleanup commands still stay temporary until the project owns the workspace manager. |
| B10 | The boundary between temporary supervisor internals and project capabilities is still fuzzy. | Keep using this matrix and the stability backlog during live runs. | Project-internal supervisor migration spec. | ready-to-plan | This is documentation and architecture work that belongs in the repository once the boundary is explicit. |

## What Should Move First

The first candidates worth pulling into repository scope are the pieces that reduce prompt dependence and operator memory:

1. Result protocol and validator coverage.
2. Single state writer and event registrar rules.
3. Result consumer ordering and idempotent registration.
4. Progress observer and stall classifier.

These four form the minimum project-facing supervisor core. They are useful even if the daemon, PTY launcher, and local monitor remain external for another version.

## What Should Stay External For Now

These pieces should stay in the temporary coding system until the project has a clearer runtime boundary:

- PTY-backed daemon launcher and stop command.
- pid file placement and local health file mechanics.
- host-specific monitor wakeup patterns.
- any recovery path that depends on local filesystem conventions under `/Users/andy/.codex/local-goal-supervisor`.

## Planning Use

When a `candidate` becomes stable in live runs:

1. Add or update a repository-side fixture, contract, or replay test.
2. Change the matrix decision to `ready-to-plan`.
3. Create or update the project module runbook that owns the capability.
4. Leave the external runner implementation in place until the repository version can handle the same recovery cases.
