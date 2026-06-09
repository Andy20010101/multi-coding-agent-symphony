# v44 task-3 worker revision evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai
Goal: v44-project-internal-goal-supervisor-core
Task: task-3
Role: worker
Assigned thread: 019ea674-f819-7801-aba2-f1509c3ec9b6
Branch: v44-task-3-route-progress-parity
Worktree: /Users/andy/.codex/worktrees/v44-task-3-route-progress-parity
Base commit: 8e022c85db27babdf05ed3dc902a1aca93fa86e0

## Revision

- Updated `latestValidResultForCurrent()` so archived `state.results` entries are treated as pending registration only when the entry or nested result explicitly marks `consumed: false` or `registered: false`.
- Kept explicit consumed or registered records out of pending-result routing.
- Updated the revision replay fixture to match the live durable state shape where previously registered `state.results[].result` entries have no consumed marker.
- Added focused test coverage proving markerless historical reviewer results do not block worker revision routing, while explicitly unconsumed results still route as pending.

## Reviewer finding

The reviewer reproduced a route-progress bug where a registered `reviewer.needs-revision` archive entry without a consumed marker was treated as a pending result after the worker revision result was recorded. That incorrectly returned `pending-result` and `register-recorded-result` for the old reviewer result instead of dispatching a fresh reviewer phase.

## Validation

| Command | Result |
| --- | --- |
| `node --test tests/v44-goal-supervisor-route-progress.test.js` | Passed, 5 tests. |
| Reviewer reproduction command using markerless `state.results` | Passed; returned `dispatchable`, reviewer review phase, action `create-fresh-controller`, reason `worker-revision-recorded-after-reviewer-needs-revision`. |
| `pnpm check` | Passed. |
| `git diff --check` | Passed before evidence file. |
| `pnpm test` | Passed, 1131 tests. |
| `pnpm workbench:build` | Passed. |

## Boundary notes

No mutation, audit, doctor, real CLI, provider CLI, tag, push, publish, release closeout, event registration, dispatch, subagent, or supervisor state mutation command was run.
