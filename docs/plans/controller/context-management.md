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

Every controller command gets a lease. The lease is the only permission to mutate controller bookkeeping, dispatch subagents, poll subagents, or register goal events.

Lease fields:

```text
command:
leaseId:
maxControllerActions:
maxSubagentPrompts:
maxEventRegistrations:
ownedThreadIds:
allowedFiles:
stopCondition:
```

Default lease limits:

```text
/goal status: maxControllerActions=0, maxSubagentPrompts=0, maxEventRegistrations=0
/goal step: maxControllerActions=1, maxSubagentPrompts=1, maxEventRegistrations=1
/goal run --until blocked: maxControllerActions=8, maxSubagentPrompts=2, maxEventRegistrations=2
/goal autopilot --steps N: deprecated; treat as /goal run with explicit limits
/goal continue: deprecated; treat as /goal step only
```

When a lease ends, the controller must stop. It must not send itself another slash command, start another controller thread, or keep polling subagents unless the same lease explicitly allows it.

## Context Budget

The controller should manage context by limiting what enters the thread, not by waiting for compaction.

Hard limits per controller turn:

```text
controller final answer: 20 lines unless the user asks for detail
checkpoint update: 40 lines of new facts unless recording a required evidence/event
subagent result copied into controller thread: fixed result block plus at most 10 lines summary
large file reads: forbidden in controller; delegate to subagents
full diffs or full test logs: forbidden in controller
```

The controller must stop and write a checkpoint when any of these happens:

- it has dispatched or steered one subagent;
- it has registered one goal event;
- it has inspected one completed subagent result;
- it needs broad diff/test/evidence review;
- a thread was compacted;
- a user sends `PAUSE`, `STOP`, or changes the operating model;
- any owned subagent is still running.

## Rotation

If context is low or compaction happened:

1. Write a compact checkpoint with current task, event ids, evidence refs, thread ids, dirty worktrees, blockers, and one explicit next command.
2. Stop the current controller.
3. Do not send `/goal continue`.
4. Start a fresh controller only from `master-once-prompt.md` and the checkpoint.

The old controller must not keep control after a fresh controller exists. If the old controller receives a pause/stop instruction, it must report only already-completed actions and stop.

## Subagent Ownership

Subagents are not background jobs. A controller lease may own a subagent thread only if it records that thread id in the dispatch log.

When the controller receives a pause/stop instruction, it must pause all owned active subagents before doing any new work. A paused subagent result must not be registered as a goal event until a fresh explicit controller command reconciles it from files and thread output.

The controller must not poll a subagent indefinitely. After one poll window:

- if the subagent is still running, checkpoint and stop;
- if the subagent completed, inspect only the fixed result block and required evidence refs;
- if evidence is missing or the result block is malformed, checkpoint the blocker and stop.

## Run Command Shape

Use `/goal run` for unattended progress instead of repeated `/goal continue`.

Example:

```text
/goal run v38-provider-hub-capability-profiles --until blocked --max-actions 8 --max-subagents 2
```

The run command is a state machine inside one lease. It must not implement progress by recursively sending slash commands. It stops when the lease is exhausted, a subagent is still running, a goal event was registered and the lease does not allow more, a blocker appears, or context rotation is required.

## Current Pause

As of 2026-06-04, the controller system is paused because context self-management failed:

- old controller thread `019e921d-2b22-7421-b986-406ded4629c8` was archived;
- verifier thread `019e9294-3d0d-7d53-baef-7f79474e2217` was archived;
- replacement controller thread `019e9295-db02-7c33-ba5e-3f29571ee56b` was archived after dispatching worker revision;
- worker thread `019e9206-5ad3-7db0-b032-fe5cb100f8e2` was paused after one evidence-file edit and before staging or committing.

Do not resume controller automation until this file and `master-once-prompt.md` have been reviewed from a fresh controller thread.
