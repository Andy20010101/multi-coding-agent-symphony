# Project-internal supervisor migration spec

Date: 2026-06-08

Goal id: `v43-plus-local-goal-supervisor-stability`

## Purpose

This spec defines the path from the temporary external supervisor at `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs` to a project-internal supervisor module. The temporary runner stays available while this work is planned and staged. No part of this spec requires moving the external runner before a project module is implemented, reviewed, and verified.

The migration target is a controlled supervisor layer inside this repository. It should use existing managed goal contracts and Workbench boundaries instead of adding a new execution product.

## Boundaries

Active providers stay limited to:

```text
claude-code-cli
codex-cli
```

Gemini CLI, Kiro CLI, DeepSeek, and other providers remain inactive unless a later runbook explicitly changes provider policy.

The migration does not add:

- raw provider CLI execution;
- browser terminal automation;
- a generic shell runner;
- tag, push, publish, or GitHub Release automation;
- release closeout without explicit operator authorization;
- self-approval, inferred review approval, or inferred main verification.

Provider execution, when authorized by a future task, still belongs behind the controlled v41 runner path for `claude-code-cli` and `codex-cli`. This supervisor migration only plans orchestration, state, progress, and evidence handling.

## Module Shape

The project-internal module should be introduced as a narrow supervisor package with one public controller entrypoint and explicit adapters around every external dependency. Suggested source layout:

```text
src/symphony/goal-supervisor/
  index.js
  state-writer.js
  app-thread-adapter.js
  workspace-manager.js
  result-protocol.js
  event-registrar.js
  route-engine.js
  progress-observer.js
  notification-bridge.js
```

The package should be planned and implemented in small tasks. The first task should be read-only parity for route decisions and progress snapshots. Write paths should remain behind dry-run and confirm contracts until review covers them.

## Single State Writer

`state-writer.js` owns all project-internal supervisor writes. Other modules return proposed state changes and never append files directly.

State writer responsibilities:

- append managed goal events through the existing goal update, review, gate, and closeout contracts;
- persist supervisor leases, active phase, assigned thread id, assigned worktree, result escrow path, and stop reason;
- persist operator notifications and notice status transitions;
- record runner snapshots and evidence refs supplied by the phase owner;
- reject writes when the target worktree is dirty, detached, outside the allowed workspace roots, missing expected evidence, or not assigned to the active lease.

The writer must use plan-hash confirmation for any path that mutates managed goal state. A dry-run preview must include goal id, task id, role, event type, evidence ref, actor, target state file, current head, and refusal reasons.

## App Thread Adapter

`app-thread-adapter.js` is the only module that talks to app thread state. It normalizes thread status into a small record:

```text
threadId
role
latestReadableStatus
updatedAt
createdAt
lastTurnId
notLoaded
source
```

The adapter may read app-server or local thread metadata, but route decisions must tolerate lossy `notLoaded` responses. A valid result in escrow takes priority over a missing or stale app-server read. The adapter does not create, steer, or wait on child threads from the project module until a later runbook explicitly authorizes that behavior.

## Workspace Manager

`workspace-manager.js` owns assigned checkout inspection and task-branch lifecycle planning.

Responsibilities:

- resolve the assigned worktree from the lease and reject unlisted roots;
- report branch, head, base commit, dirty state, merge state, and relevant evidence paths;
- create a workspace plan only when the runbook authorizes new task worktrees;
- keep cleanup non-destructive by default;
- refuse cleanup for dirty, detached, unmerged, or evidence-incomplete task worktrees.

The temporary external runner may keep creating and using task worktrees until the project module has an approved workspace implementation.

## Result Protocol And Parser

`result-protocol.js` defines the bounded result block used by workers, reviewers, main verifiers, and release managers.

Required parse fields:

```text
goalId
taskId
role
threadId
branch
worktree
baseCommit
headCommit
status
eventToRegister
evidenceRef
filesChanged
commandsRun
validation
risks
blockers
nextSuggestedAction
```

Parser rules:

- accept exactly one `RESULT_BLOCK_START` / `RESULT_BLOCK_END` block;
- require every field once;
- require the assigned thread id to match the lease thread id;
- require branch, worktree, base commit, and evidence ref to match the active lease or latest reviewed worker result, depending on role;
- reject missing evidence, unsafe evidence refs, dirty task worktrees after file-changing roles, and events outside the managed runbook expected event list;
- parse command results as evidence text only, not as automatic approval or release readiness.

The protocol should remain plain text so external and project-internal runners can both consume it during migration.

## Event Registrar

`event-registrar.js` converts a validated result into the existing managed goal event preview and confirm flow.

Allowed event families:

- worker evidence recorded;
- reviewer approved or needs revision;
- main verification passed or failed;
- release gate passed or failed;
- release ready declared only during explicitly authorized closeout.

The registrar must not infer events from branch names, filenames, commit messages, task titles, prompt text, copy-only commands, or front-end state. It must cite the result block, evidence ref, worktree, branch, and head commit used for the registration decision.

## Route Engine

`route-engine.js` is the deterministic decision layer. Inputs are managed runbook, goal status, event log, active lease, progress observer record, workspace inspection, closeout report, and operator authorization flags.

Route outcomes:

- dispatch next worker, reviewer, or main verifier phase when no active lease exists and prerequisites are met;
- wait when recent child progress is visible;
- consume a valid pending result before reading lossy thread state;
- report stalled child with the exact recovery action after the grace window;
- block duplicate dispatch while an active lease exists;
- block release closeout unless the runbook and operator both authorize it;
- block tag, push, publish, mutation, audit, doctor, real CLI, and provider CLI commands unless the active runbook explicitly requires them.

Every route decision should include `reason`, `inputsRead`, `blockedBy`, `nextCopyOnlyCommand`, and `operatorNoticeRef` when a notice is created.

## Progress Observer

`progress-observer.js` summarizes active child progress without changing state.

Progress record fields:

```text
leaseId
threadId
role
latestReadableStatus
threadUpdatedAt
resultEscrowMtime
worktreeBranch
worktreeHead
worktreeDirty
latestEvidenceMtime
latestRelevantGoalEvent
progressState
recoveryAction
```

`progressState` should distinguish `recent-progress`, `pending-result`, `stalled`, `blocked`, and `complete`. The observer should use a configured grace window and should not treat manual ticks as daemon health.

## Operator Notification Bridge

`notification-bridge.js` creates operator-visible notices for blocked states that need human action.

Notice fields:

```text
noticeId
goalId
taskId
role
blockKey
requiredCommand
requiredFlag
targetWorktree
currentLeaseId
daemonContinuation
createdAt
status
resolvedAt
```

The bridge should dedupe notices by `blockKey`. Repeated daemon ticks for the same release authorization block should not append duplicate notices. Each notice must say whether the daemon can continue after the operator command or must be restarted.

## Temporary Runner Continuity

The temporary external runner remains the operational path until the project module has:

- a reviewed parity spec for route decisions;
- tests for result parsing, progress classification, and duplicate dispatch blocking;
- dry-run-only state writer previews;
- a staged handoff plan that records which lease fields are still external;
- rollback guidance that returns control to `/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs`.

During migration planning, evidence should continue to cite the external runner script path, digest when available, local run date, timezone, UTC generated timestamp, assigned worktree, and result escrow path.

## Staged Migration

1. Read-only parity: implement route, progress, workspace, and result parsing projections without writes.
2. Dry-run writer: add state writer previews with plan hashes, refusal reasons, and tests.
3. Event registration confirm: allow only managed goal event appends after exact plan-hash confirmation.
4. Notification bridge: add deduped operator notices for release authorization, stalled child, dirty worktree, and missing evidence.
5. Workspace manager handoff: move worktree creation and cleanup planning into the project module while keeping cleanup non-destructive by default.
6. Runner retirement check: retire the external runner only after main verification proves equivalent route decisions and rollback has been documented.

## Acceptance Checklist

- The spec defines a single state writer, app thread adapter, workspace manager, result protocol and parser, event registrar, route engine, progress observer, and operator notification bridge.
- Active provider policy remains `claude-code-cli` and `codex-cli` only.
- Raw provider CLI execution, browser terminal automation, generic shell execution, tag automation, push automation, publish automation, and unauthorized release closeout remain out of scope.
- The temporary external runner remains usable while project-internal work is planned.
