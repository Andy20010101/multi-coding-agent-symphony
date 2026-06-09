# v44 task-3 main verification evidence

Local run date: 2026-06-08
Timezone: Asia/Shanghai
Goal: v44-project-internal-goal-supervisor-core
Task: task-3
Role: main-verifier
Assigned thread: 019ea67c-3166-7652-aeee-631dcef6c4be
Branch: v44-task-3-route-progress-parity
Worktree: /Users/andy/.codex/worktrees/v44-task-3-route-progress-parity
Base commit: 8e022c85db27babdf05ed3dc902a1aca93fa86e0
Verified head before evidence: 2f4addcf1ee109307718f2406f1c166e6b8582de

## Verification target

Main verification used the assigned worker/reviewer worktree, not the root checkout:

- Worker revision evidence: `docs/plans/v44-task-3-worker-revision-evidence-2026-06-08.md`
- Reviewer revision evidence: `docs/plans/v44-task-3-review-revision-evidence-2026-06-08.md`
- Reviewed implementation: `src/symphony/goal-supervisor/route-progress.js`
- Focused replay coverage: `tests/v44-goal-supervisor-route-progress.test.js`
- Replay fixture: `fixtures/contracts/goal-supervisor/route-progress.v44.replay.v1.json`

## Result

Passed.

The route engine remains read-only and deterministic from managed inputs. The progress observer distinguishes `recent-progress`, `pending-result`, `stalled`, and `complete`. Reviewer approval is not treated as main verification. The reviewer-reported regression is covered: markerless historical `state.results[].result` records no longer block worker revision routing, while explicitly unconsumed or unregistered results still route to registration.

## Commands run

| Command | Result |
| --- | --- |
| `git status --short --branch` in `/Users/andy/.codex/worktrees/v44-task-3-route-progress-parity` | Passed, clean before evidence. |
| `sed -n '1,240p' docs/plans/app-core-v44-goal-runbooks/v44_project-internal-goal-supervisor-core_goal_runbook_latest.md` | Passed. |
| `sed -n '1,220p' docs/plans/v44-task-3-worker-revision-evidence-2026-06-08.md` | Passed. |
| `sed -n '1,240p' docs/plans/v44-task-3-review-revision-evidence-2026-06-08.md` | Passed. |
| `sed -n '1,220p' /Users/andy/.codex/local-goal-supervisor/results/v44-project-internal-goal-supervisor-core/019ea679-50b0-7823-a0e6-c0f82449a052.txt` | Passed. |
| `git diff --stat 8e022c85db27babdf05ed3dc902a1aca93fa86e0...HEAD` | Passed. |
| `git diff --name-only 8e022c85db27babdf05ed3dc902a1aca93fa86e0...HEAD` | Passed. |
| `sed -n '1,260p' src/symphony/goal-supervisor/route-progress.js` | Passed. |
| `sed -n '260,620p' src/symphony/goal-supervisor/route-progress.js` | Passed. |
| `sed -n '1,320p' tests/v44-goal-supervisor-route-progress.test.js` | Passed. |
| `sed -n '1,260p' fixtures/contracts/goal-supervisor/route-progress.v44.replay.v1.json` | Passed. |
| `git diff --check 8e022c85db27babdf05ed3dc902a1aca93fa86e0...HEAD` | Passed. |
| `node --test tests/v44-goal-supervisor-route-progress.test.js` | Passed, 5 tests. |
| `pnpm check` | Passed. |
| `pnpm test` | Passed, 1131 tests. |
| `pnpm workbench:build` | Passed. |
| Route-progress replay assertions for markerless reviewer history and reviewer-approved main-verifier routing | Passed. |

## Boundary notes

No mutation, audit, doctor, real CLI, provider CLI, tag, push, publish, release closeout, event registration, dispatch, subagent, or supervisor state mutation command was run. The only verifier write is this evidence document.
