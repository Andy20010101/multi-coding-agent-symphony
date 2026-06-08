# v43+ Local Goal Supervisor Operator Notice Normalization Evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai

Goal id: `v43-plus-local-goal-supervisor-stability`
Backlog item: `B7`

Implementation target:

```text
/Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
```

## Purpose

- Put operator-required notifications on one normalized payload contract.
- Stop mixing notice-thread ids with target thread ids.
- Make blocked approval, thread-read recovery, thread-progress recovery, and follow-up recovery produce the same operator-facing shape.

## Change Summary

The external runner now uses one operator notice payload contract:

- `goalId`
- `kind`
- `current.taskId / role / phase`
- target `threadId`
- `worktree`
- `branch`
- `reason`
- `requiresDaemonRestart`
- `primaryCommand`
- `supportingCommands`
- optional `recoveryAction`

The runner also splits:

- target thread id: `threadId`
- notice-thread id: `noticeThreadId`

That removes the previous ambiguity where one notification path stored the problem thread id and another stored the notice thread id in the same field.

The following paths now use the shared contract:

- blocked approval notices
- thread-read and thread-progress recovery notices
- follow-up-unavailable recovery notices
- evidence-location recovery notices

## Focused Validation

Commands run:

```text
node --check /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs selftest
node /Users/andy/.codex/local-goal-supervisor/bin/local-goal-supervisor.mjs doctor --goal v43-plus-local-goal-supervisor-stability
```

`selftest` now proves two B7 requirements:

1. the normalized notice payload contains goal/current/worktree/reason/command/restart fields
2. inserting the same blocked notice twice keeps one notification record instead of duplicating it

`doctor` continues to expose the current operator notifications list, and the same runner now has one shared path ready for new notice records instead of separate per-incident shapes.

## Follow-up

- The fresh daemon-created blocked notice replay is now recorded in `docs/plans/controller/local-goal-supervisor-v43-plus-operator-notice-replay-evidence-2026-06-08.md`.
- Historical live-state retirement is still documented separately in `docs/plans/controller/local-goal-supervisor-v43-plus-operator-notice-retirement-evidence-2026-06-08.md`.
- This note remains the contract-shape and dedupe baseline; the replay file closes the earlier end-to-end gap.
