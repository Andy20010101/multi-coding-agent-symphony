# Temporary Goal Controller

Date: 2026-06-04

This folder is a temporary Codex operating layer for this repository. It is not product code and is not part of the v38 Provider Hub implementation.

Use it when Codex should make goal progress without turning one thread into a long-running master session.

## Layers

```text
thin supervisor
  -> polls compact ledger/thread state
  -> creates one fresh controller per tick

fresh controller
  -> owns one goal phase
  -> dispatches or consumes one role result
  -> updates checkpoint and stops

subagent
  -> reads code, diffs, evidence, and logs
  -> runs bounded validation
  -> writes evidence and fixed result block
```

Automation belongs in the thin supervisor. Context-heavy reasoning belongs in fresh controllers and subagents that stop after one phase.

## Controller Loop

```text
/goal command
  -> controller reads repo state, compact checkpoint, and targeted runbook fields
  -> controller decides one next phase
  -> controller may create or steer one subagent thread
  -> subagent works in its own branch/worktree
  -> subagent reports with the fixed result format
  -> controller records evidence/checkpoint
  -> controller stops or hands the residual run lease to a fresh controller
```

## Files

- `supervisor-loop-prompt.md`: startup prompt for the thin supervisor loop.
- `supervisor-runner.md`: local dry-run runner state machine and command contract.
- `supervisor-hooks.md`: hook points for state transitions, checkpointing, and timeout/dirty handling.
- `local-goal-supervisor-v43-plus-task-d-runner-snapshot-cleanup-runbook.md`: evidence clock, runner snapshot, and non-destructive worktree cleanup rules for the temporary external supervisor.
- `local-goal-supervisor-v43-plus-task-e-project-internal-supervisor-migration-spec-2026-06-08.md`: migration spec for moving the temporary external supervisor toward a project-internal supervisor module without expanding provider or release automation scope.
- `master-once-prompt.md`: startup prompt for the controller Codex thread.
- `context-management.md`: lease, context budget, rotation, and pause rules.
- `v38-controller-state.md`: current checkpoint for v38 controller work.
- `subagent-result-format.md`: required result format for worker, reviewer, and verifier subagents.
- `subagent-dispatch-log.md`: append-only log of controller dispatches and handoffs.

## Supervisor Shape

Use these messages in the supervisor thread:

```text
/supervisor status
/supervisor tick
/supervisor run v38-provider-hub-capability-profiles --until blocked --max-ticks 8
```

The supervisor is allowed to:

- run compact ledger/status commands;
- read checkpoint and dispatch-log summaries;
- read thread status;
- create one fresh controller per tick.

Each supervisor tick gets one compact reconciliation pass. It must not poll repeatedly inside the same thread waiting for a controller, subagent, or better state.

The supervisor is not allowed to:

- read broad diffs, full evidence files, long logs, or implementation files;
- run tests, builds, mutation, audit, doctor, real CLI, tag, push, publish, or model-provider CLI commands;
- register events or decide verdicts;
- continue a compacted controller.

If a subagent completes, the supervisor creates a fresh controller to consume that result. It does not consume the result itself.

## Command Shape

Use these messages in the controller thread:

```text
/goal status
/goal reconcile
/goal step
/goal continue
/goal run v38-provider-hub-capability-profiles --until blocked --rotation phase --max-actions 8 --max-subagents 2
/goal dispatch task-1 worker
/goal review task-1
/goal verify task-1
/goal closeout
```

The controller should treat `/goal step` as: reconcile first, identify the next runbook-backed action, and do one bounded step.

The controller should treat `/goal continue` as a deprecated compatibility alias for `/goal step`. It must not suggest, queue, or self-trigger another bare `/goal continue`.

The controller should treat `/goal run ... --max-actions <N> --max-subagents <M>` as: run a bounded state machine across fresh phase controllers, stopping early on any stop condition below.

The controller should treat `/goal autopilot --steps <N>` as deprecated. It may be accepted only as `/goal run` with explicit lease limits. It must not be implemented as repeated `/goal continue`.

Every end-of-turn next command must be specific, for example:

```text
/goal dispatch task-1 worker
/goal review task-1
/goal verify task-1
/goal register task-1 reviewer.approved
```

## Run

Run mode exists so the user does not need to watch every controller turn. It is still bounded, evidence-driven, and controlled by the lease rules in `context-management.md`.

Default limits:

```text
max steps: 3
max subagents started per phase controller: 1
max subagents started per user run command: explicit lease limit
max role advancement per controller thread: one role phase
max role advancement per user run command: multiple phases only through fresh-controller rotation
max release stage: no release closeout unless explicitly requested
```

Low-context rule:

```text
The controller reads summaries and targeted snippets.
Subagents read long implementation docs, evidence files, and broad diffs.
```

Autopilot may:

- reconcile state;
- register a missing managed goal/runbook when the runbook fixture is valid;
- dispatch the next required worker, reviewer, or verifier subagent;
- update the dispatch log and checkpoint;
- inspect completed subagent results when they are already available;
- register a goal event only when evidence is present and the dry-run plan hash is confirmed by the controller in the same turn.
- hand the residual run lease to a fresh controller after checkpointing a completed phase.

Autopilot must stop when:

- a worktree is dirty and the change is not from the current controller turn;
- a subagent is running or was just dispatched;
- expected evidence is missing;
- a test, build, or validation command fails;
- the next action would require mutation, audit, doctor, real CLI, tag, push, publish, broad cleanup, or destructive git commands;
- the next action depends on product or scope judgment not already written in the runbook/checkpoint;
- context guard requires a fresh controller thread and the controller cannot create or hand off to one.

Recommended unattended command:

```text
/goal run v38-provider-hub-capability-profiles --until blocked --rotation phase --max-actions 8 --max-subagents 2
```

## Context Guard

The controller must not wait until the thread feels too long. Every `/goal` turn should assume chat memory is only a cache.

Before any dispatch, review, verify, or closeout action:

```text
reconcile repo state
read the controller checkpoint
read only the relevant runbook task fields
confirm git status and active worktrees
```

If the controller cannot justify its next action from files, command output, or explicit user input, it must stop and ask for `/goal reconcile`.

Signals that the controller should checkpoint and rotate to a fresh controller:

- `/status` reports low remaining context.
- The thread has already dispatched or reviewed more than one subagent since the last checkpoint.
- The last turn included long logs, large diffs, or broad file reads.
- The controller refers to "memory" without a file, command, evidence, or checkpoint reference.
- The visible transcript has been compacted and required details are missing.
- The next action is review, main verification, release closeout, or gate execution after any prior non-reconcile phase in this thread.

For this temporary system, the safe default is one bounded controller action per `/goal step`, followed by a checkpoint.

Do not use bare `/goal continue` as the next suggested command. If the user sends it, complete one bounded step and end with a concrete command such as `/goal verify task-1`.

## Low-Context Operating Rules

Do not load large files into the controller thread unless the user asks for a detailed audit. Prefer commands that return compact facts:

```sh
git status --short --branch
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
git rev-parse origin/main
git worktree list --porcelain
jq -r '.goalId, .goalTitle, (.releaseGates[]), (.tasks[] | select(.taskId=="task-1") | .title)' fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json
pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json
```

Use `rg` and `sed -n` to read only the relevant section of a long document. Avoid `git branch -vv --all`, full `git diff`, full runbook docs, full evidence files, and large test output in the controller thread.

Do not run broad repository searches from the controller thread. A controller search must name the smallest useful path and produce compact output.

Checkpoint entries should be short:

- command received;
- task and role;
- event ids;
- evidence refs;
- thread ids;
- current blocker;
- next command.

Do not paste long command output into checkpoints. Summarize pass/fail and keep exact command names.

If automatic compaction happens anyway, treat the current controller thread as disposable. Start a fresh controller thread with `master-once-prompt.md`; do not ask the compressed controller to reconstruct missing details from memory or continue review, verification, gates, or event registration.

The controller must also read and apply `context-management.md`. That file is the authority for leases, pause propagation, subagent ownership, and controller rotation.

## Boundaries

- Do not rely on chat memory as the source of truth.
- Do not infer task completion from branch names or file names.
- Do not overwrite dirty worktrees.
- Do not run mutation, audit, doctor, real CLI, tag, push, or release unless the active runbook or user explicitly asks.
- Do not turn this temporary controller into product code during v38.
