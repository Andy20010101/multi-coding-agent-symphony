# v43 task-1 independent review evidence

Goal: `v43-goal-supervisor-stabilization`
Task: `task-1` - App thread and result protocol contracts
Role: `reviewer`
Thread: `019ea2c7-0ea2-7da1-8a0d-f0e4fc343285`
Branch reviewed: `v43-task-1-app-thread-result-protocol`
Worktree reviewed: `/Users/andy/.codex/worktrees/v43-task-1-app-thread-result-protocol`
Base commit: `5e645c5c68c72c489ff938ffa076e33725bc05f9`
Head commit reviewed: `0d4d452626da7c86483d37dd06fcc428660898ea`
Worker evidence reviewed: `docs/plans/v43-task-1-worker-evidence-2026-06-07.md`
Review date: `2026-06-07`

## Verdict

`APPROVED`

No blocking findings remain after the worker revision.

## Sources checked

- `docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md`
- `docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md`
- `docs/plans/v43-task-1-worker-evidence-2026-06-07.md`
- `src/symphony/app-thread-result-protocol.js`
- `src/symphony/supervisor-runner.js`
- `tests/v43-app-thread-result-protocol.test.js`
- `tests/v38-supervisor-runner.test.js`

## Review notes

- Active child binding is gated on readable App readback. `recordThreadBinding` rejects duplicate bindings and unreadable readback before activation.
- The revised identity check requires the replayable `readThread(threadId)` capability shape, requires `optionalParameters: []`, and rejects readbacks whose capability thread id does not match the binding thread id.
- Readback responses that identify a different thread through `id`, `threadId`, `thread.id`, or `thread.threadId` are rejected before the binding can become active.
- `readThreadThroughStableAdapter` calls the adapter with only `threadId` and records the same call shape for replay.
- `notLoaded` stays a non-mutating wait state and does not become a failed child result.
- Pending valid parsed results are selected before active-thread readback.
- Result parsing covers raw result blocks, fenced JSON, invalid JSON, missing fields, wrong thread id, and missing blocks.
- Correction behavior is bounded to one result-only prompt. Repeated invalid output, unreachable correction, or a queued correction behind an active child returns manual recovery.
- Result consumption is append-only and idempotent for duplicate record ids.
- Accepted terminal events include non-success outcomes for reviewer, main-verifier, and release-manager roles.
- `src/symphony/supervisor-runner.js` now uses the shared accepted terminal event map, removing the local success-biased event list.

## Commands run

| Command | Result |
| --- | --- |
| `node --check src/symphony/app-thread-result-protocol.js && node --check src/symphony/supervisor-runner.js && node --test tests/v43-app-thread-result-protocol.test.js tests/v38-supervisor-runner.test.js` | Exit `0`. `12` tests passed, `0` failed. |
| `git diff --check 5e645c5c68c72c489ff938ffa076e33725bc05f9...HEAD` | Exit `0`. No whitespace errors. |
| `node --input-type=module <<'NODE' ... identity mismatch reproduction ... NODE` | Exit `0`. Returned `accepted: false`, `active: false`, `reason: thread-readback-capability-mismatch`. |
| `pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json` | Exit `0`. Returned `goal-progress-ledger.v1`; `totalTasks: 4`, `completedTasks: 0`, `releaseReady: false`. Local managed state has no registered worker event for task-1, which matches the no-event-registration boundary for this review. |
| `pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json` | Exit `0`. Returned `goal-next-action.v1`; local managed state still says task-1 worker evidence is not registered. This review uses the leased worker result from the supervisor context, not a local event registration. |
| `pnpm check` | Exit `0`. Repository syntax check passed. |
| `pnpm workbench:build` | Exit `0`. Vite built the Workbench static bundle successfully. |
| `pnpm test` | Exit `0`. `1094` tests passed, `0` failed. |

## Boundary notes

- I did not implement product code changes.
- I did not register `reviewer.approved` or any other goal event.
- I did not run main verification, release closeout, tag, push, publish, provider CLI, audit, doctor, or mutation commands.
- The review target was the worker result worktree and evidence ref from the supervisor context: `/Users/andy/.codex/worktrees/v43-task-1-app-thread-result-protocol` and `docs/plans/v43-task-1-worker-evidence-2026-06-07.md`.

## Residual risk

The protocol is still a pure contract/helper layer for task-1. Later tasks need to wire this into workspace safety, route reconciliation, daemon progress, and actual event registration without weakening the same identity and evidence boundaries.
