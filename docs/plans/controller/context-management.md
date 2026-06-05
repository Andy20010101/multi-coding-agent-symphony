# Controller Context Management

Date: 2026-06-04

This file defines the temporary controller's context self-management contract. It exists because a controller can otherwise keep delegating work after the user intent has changed or after the thread has become too large to reason from chat safely.

## Source Of Truth

The controller must treat chat as disposable. Durable state is limited to:

- `docs/plans/controller/v38-controller-state.md`
- `docs/plans/controller/subagent-dispatch-log.md`
- managed goal ledger files under `.symphony/goals/`
- explicit evidence files named in the runbook or checkpoint
- current git state and worktree state

Do not reconstruct missing facts from memory after compaction. If the checkpoint is insufficient, stop and ask for a targeted reconcile.

## Lease Model

Every supervisor and controller command gets a lease. The lease is the only permission to mutate controller bookkeeping, dispatch subagents, poll owned threads, create controllers, or register goal events.

The supervisor lease and controller lease are separate. A supervisor may create a fresh controller, but must not do controller work. A controller may dispatch or consume one phase, but must not become a long-running supervisor.

Supervisor lease fields:

```text
command:
leaseId:
maxSupervisorTicks:
maxControllerThreadsCreated:
ownedControllerThreadIds:
ownedSubagentThreadIds:
allowedFiles:
stopCondition:
```

Lease fields:

```text
command:
leaseId:
maxControllerActions:
maxSubagentPrompts:
maxEventRegistrations:
rotationMode:
currentPhase:
maxSubagentPromptsPerPhase:
maxEventRegistrationsPerPhase:
ownedThreadIds:
allowedFiles:
stopCondition:
```

Default lease limits:

```text
/supervisor status: maxSupervisorTicks=0, maxControllerThreadsCreated=0
/supervisor tick: maxSupervisorTicks=1, maxControllerThreadsCreated=1
/supervisor run --until blocked: maxSupervisorTicks=8, maxControllerThreadsCreated=8
/goal status: maxControllerActions=0, maxSubagentPrompts=0, maxEventRegistrations=0
/goal step: maxControllerActions=1, maxSubagentPrompts=1, maxEventRegistrations=1
/goal run --until blocked: maxControllerActions=8, maxSubagentPrompts=2, maxEventRegistrations=2, rotationMode=phase, maxSubagentPromptsPerPhase=1, maxEventRegistrationsPerPhase=1
/goal autopilot --steps N: deprecated; treat as /goal run with explicit limits
/goal continue: deprecated; treat as /goal step only
```

When a lease ends, the controller must stop. It must not send itself another slash command or keep polling subagents.

One user command may still make unattended progress only through phase rotation. In phase rotation, the current controller writes a checkpoint, records the residual lease, and starts or hands off to a fresh controller thread from `master-once-prompt.md`. The current controller does not perform the next phase itself.

For longer unattended progress, use the thin supervisor from `supervisor-loop-prompt.md`. The supervisor can create fresh controllers across ticks, but it must stay low-context and never perform verification, review, event registration, or release gates itself.

## Phase Contract

A phase is one of:

```text
reconcile
worker-dispatch-or-result
reviewer-dispatch-or-result
main-verifier-dispatch-or-result
release-closeout
```

One controller thread may own at most one non-reconcile phase. It must not advance the same task from worker event to reviewer action, or from reviewer event to main verification action, in the same thread.

For task-4 and later tasks, and for any thread that has already seen automatic compaction, phase rotation is mandatory before review, main verification, release gates, or broad evidence review.

## Context Budget

The controller should manage context by limiting what enters the thread, not by waiting for compaction.

Hard limits per controller turn:

```text
supervisor final answer: 20 lines unless the user asks for detail
supervisor copied thread output: status and final fixed result metadata only, never long logs
controller final answer: 20 lines unless the user asks for detail
checkpoint update: 40 lines of new facts unless recording a required evidence/event
subagent result copied into controller thread: fixed result block plus at most 10 lines summary
large file reads: forbidden in controller; delegate to subagents
full diffs or full test logs: forbidden in controller
broad `rg` or `git log` across `docs/plans` or the full repository: forbidden in controller
tool output target: commands should return compact facts, not more than about 120 lines
```

The controller must rotate before starting an expensive phase when any of these is true:

- it has dispatched or steered one subagent;
- it has registered one goal event;
- it has inspected one completed subagent result;
- it has run validation commands beyond read-only reconciliation;
- the previous turn included long logs, large diffs, broad search output, or multiple file reads;
- the next phase is reviewer, main-verifier, release-closeout, or any gate execution.

The controller must stop and write a checkpoint when any of these happens:

- a phase ended;
- it needs broad diff/test/evidence review;
- a thread was compacted;
- a user sends `PAUSE`, `STOP`, or changes the operating model;
- any owned subagent is still running.

## Rotation

If context is low, an expensive phase is next, a phase ended, or compaction happened:

1. Write a compact checkpoint with current task, event ids, evidence refs, thread ids, dirty worktrees, blockers, and one explicit next command.
2. Stop substantive work in the current controller.
3. Do not send `/goal continue`.
4. For a user command with `rotationMode=phase`, start or hand off to a fresh controller from `master-once-prompt.md`, the checkpoint, and the residual lease. Otherwise, tell the user the exact next `/goal` command.

The old controller must not keep control after a fresh controller exists. If the old controller receives a pause/stop instruction, it must report only already-completed actions and stop.

## Subagent Ownership

Subagents are not background jobs. A controller lease may own a subagent thread only if it records that thread id in the dispatch log.

When the controller receives a pause/stop instruction, it must pause all owned active subagents before doing any new work. A paused subagent result must not be registered as a goal event until a fresh explicit controller command reconciles it from files and thread output.

The controller must not poll a subagent indefinitely. After one poll window:

- if the subagent is still running, checkpoint and stop;
- if the subagent completed, inspect only the fixed result block and required evidence refs;
- if evidence is missing or the result block is malformed, checkpoint the blocker and stop.

## Run Command Shape

Use `/goal run` for unattended progress instead of repeated `/goal continue`. The run command must use phase rotation by default; it is not one long controller session.

Example:

```text
/goal run v38-provider-hub-capability-profiles --until blocked --rotation phase --max-actions 8 --max-subagents 2
```

The run command is a state machine across phase controllers. It must not implement progress by recursively sending slash commands in the same thread. It stops when the lease is exhausted, a subagent is still running, a blocker appears, a phase controller cannot create or hand off to a fresh controller, or release closeout would be required without explicit permission.

## Current Rule Update

As of 2026-06-05, controller automation may resume only under phase rotation. A visible automatic compaction is treated as a failed controller lease: the compacted thread must stop, write or reference the latest checkpoint, and hand off to a fresh controller before doing review, verification, gates, or further event registration.
