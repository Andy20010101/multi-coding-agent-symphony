# Supervisor Hooks

Date: 2026-06-05

Hooks are safety gates around the local supervisor runner. They keep automation small and make controller context disposable.

## Hook Points

```text
preTick
postReconcile
preCreateController
postCreateController
preConsumeResult
postRegisterEvent
preCloseout
onDirtyWorktree
onTimeout
onCompactionDetected
postCheckpoint
```

## Required Behavior

- `preTick`: confirm one compact reconciliation pass only.
- `postReconcile`: require next action to come from ledger/checkpoint/thread status, not chat memory.
- `preCreateController`: require fresh-controller phase boundaries and no active duplicate controller.
- `postCreateController`: write thread id, phase, task, and expected evidence refs to checkpoint.
- `preConsumeResult`: require fixed result block metadata and matching task/role/event/evidence ref.
- `postRegisterEvent`: checkpoint event id and stop the controller phase.
- `preCloseout`: require explicit `--allow-closeout`.
- `onDirtyWorktree`: block unless dirty files are explained by checkpoint or owned active thread.
- `onTimeout`: mark the controller/subagent stale and require fresh reconcile.
- `onCompactionDetected`: stop substantive work and hand off from durable checkpoint.
- `postCheckpoint`: keep the checkpoint compact; do not paste long logs.

## Non-Goals

Hooks must not store long context or replace the runner state machine. They only validate transitions and record small durable state:

```text
goalId
taskId
phase
threadId
eventId
evidenceRef
worktree
branch
dirtyState
blocker
nextCommand
```

Do not use hooks to run tests, read diffs, inspect implementation files, invoke provider CLIs, or keep a chat controller alive across phases.
