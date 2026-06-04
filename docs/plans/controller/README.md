# Temporary Goal Controller

Date: 2026-06-04

This folder is a temporary Codex operating layer for this repository. It is not product code and is not part of the v38 Provider Hub implementation.

Use it when a Codex thread should act as a short-lived controller instead of a long-running master session.

## Loop

```text
/goal command
  -> controller reads repo state, runbook, checkpoint, and git state
  -> controller decides one next action
  -> controller may create or steer one subagent thread
  -> subagent works in its own branch/worktree
  -> subagent reports with the fixed result format
  -> controller records evidence/checkpoint
  -> controller stops
```

## Files

- `master-once-prompt.md`: startup prompt for the controller Codex thread.
- `v38-controller-state.md`: current checkpoint for v38 controller work.
- `subagent-result-format.md`: required result format for worker, reviewer, and verifier subagents.
- `subagent-dispatch-log.md`: append-only log of controller dispatches and handoffs.

## Command Shape

Use these messages in the controller thread:

```text
/goal status
/goal reconcile
/goal continue
/goal autopilot --steps 3
/goal dispatch task-1 worker
/goal review task-1
/goal verify task-1
/goal closeout
```

The controller should treat `/goal continue` as: reconcile first, identify the next runbook-backed action, and do one bounded step.

The controller should treat `/goal autopilot --steps <N>` as: run up to `N` bounded controller actions without waiting for another user message, stopping early on any stop condition below.

## Autopilot

Autopilot exists so the user does not need to watch every controller turn. It is still bounded and evidence-driven.

Default limits:

```text
max steps: 3
max subagents started per command: 1
max role advancement per task: one role at a time
max release stage: no release closeout unless explicitly requested
```

Autopilot may:

- reconcile state;
- register a missing managed goal/runbook when the runbook fixture is valid;
- dispatch the next required worker, reviewer, or verifier subagent;
- update the dispatch log and checkpoint;
- inspect completed subagent results when they are already available;
- register a goal event only when evidence is present and the dry-run plan hash is confirmed by the controller in the same turn.

Autopilot must stop when:

- a worktree is dirty and the change is not from the current controller turn;
- a subagent is running or was just dispatched;
- expected evidence is missing;
- a test, build, or validation command fails;
- the next action would require mutation, audit, doctor, real CLI, tag, push, publish, broad cleanup, or destructive git commands;
- the next action depends on product or scope judgment not already written in the runbook/checkpoint;
- context guard recommends `/compact` or a fresh controller thread.

Recommended unattended command:

```text
/goal autopilot --steps 3 --stop-on-subagent
```

## Context Guard

The controller must not wait until the thread feels too long. Every `/goal` turn should assume chat memory is only a cache.

Before any dispatch, review, verify, or closeout action:

```text
reconcile repo state
read the controller checkpoint
read the runbook task and evidence refs
confirm git status and active worktrees
```

If the controller cannot justify its next action from files, command output, or explicit user input, it must stop and ask for `/goal reconcile`.

Signals that the controller should checkpoint and recommend a fresh controller thread or manual `/compact`:

- `/status` reports low remaining context.
- The thread has already dispatched or reviewed more than one subagent since the last checkpoint.
- The last turn included long logs, large diffs, or broad file reads.
- The controller refers to "memory" without a file, command, evidence, or checkpoint reference.
- The visible transcript has been compacted and required details are missing.

For this temporary system, the safe default is one bounded controller action per `/goal continue`, followed by a checkpoint.

## Boundaries

- Do not rely on chat memory as the source of truth.
- Do not infer task completion from branch names or file names.
- Do not overwrite dirty worktrees.
- Do not run mutation, audit, doctor, real CLI, tag, push, or release unless the active runbook or user explicitly asks.
- Do not turn this temporary controller into product code during v38.
