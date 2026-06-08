# v44 task-3 review revision evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai
Goal: v44-project-internal-goal-supervisor-core
Task: task-3
Role: reviewer
Assigned thread: 019ea679-50b0-7823-a0e6-c0f82449a052
Branch: v44-task-3-route-progress-parity
Worktree: /Users/andy/.codex/worktrees/v44-task-3-route-progress-parity
Base commit: 8e022c85db27babdf05ed3dc902a1aca93fa86e0
Worker evidence reviewed: docs/plans/v44-task-3-worker-revision-evidence-2026-06-08.md
Worker thread reviewed: 019ea674-f819-7801-aba2-f1509c3ec9b6
Worker head reviewed: d27959ab97b6ebfa2dc87fd419c4a7c45eb9ec75

## Verdict

Approved.

## Review notes

The worker revision fixes the prior reviewer finding. `latestValidResultForCurrent()` now treats archived markerless `state.results[].result` records as historical and only returns pending registration for records explicitly marked `consumed: false` or `registered: false` at the wrapper or nested result level.

The replay fixture now matches the live durable state shape that triggered the earlier failure. Focused tests cover both sides of the distinction: markerless historical reviewer results no longer block worker revision routing, and explicitly unconsumed results still route as pending.

The revision-path reproduction now returns a dispatchable reviewer review phase with action `create-fresh-controller` and reason `worker-revision-recorded-after-reviewer-needs-revision`. Reviewer approval is still not treated as main verification in the focused coverage.

## Commands run

| Command | Result |
| --- | --- |
| `git status --short --branch` in `/Users/andy/.codex/worktrees/v44-task-3-route-progress-parity` | Passed, clean before review evidence. |
| `sed -n '1,260p' docs/plans/v44-task-3-worker-revision-evidence-2026-06-08.md` | Passed. |
| `git diff --stat 8e022c85db27babdf05ed3dc902a1aca93fa86e0...HEAD` | Passed. |
| `git diff --check 8e022c85db27babdf05ed3dc902a1aca93fa86e0...HEAD` | Passed. |
| `sed -n '1,280p' src/symphony/goal-supervisor/route-progress.js` | Passed. |
| `sed -n '280,620p' src/symphony/goal-supervisor/route-progress.js` | Passed. |
| `sed -n '1,260p' tests/v44-goal-supervisor-route-progress.test.js` | Passed. |
| `sed -n '1,260p' fixtures/contracts/goal-supervisor/route-progress.v44.replay.v1.json` | Passed. |
| `node --test tests/v44-goal-supervisor-route-progress.test.js` | Passed, 5 tests. |
| Revision-path reproduction using markerless `state.results` | Passed, dispatchable reviewer review with no pending result. |
| `pnpm check` | Passed. |
| `pnpm test` | Passed, 1131 tests. |
| `pnpm workbench:build` | Passed. |

## Boundary notes

No mutation, audit, doctor, real CLI, provider CLI, tag, push, publish, release closeout, event registration, dispatch, subagent, or supervisor state mutation command was run.
