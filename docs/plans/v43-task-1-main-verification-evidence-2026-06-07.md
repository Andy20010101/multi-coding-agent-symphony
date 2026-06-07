# v43 task-1 main verification evidence

Goal: `v43-goal-supervisor-stabilization`
Task: `task-1` - App thread and result protocol contracts
Role: `main-verifier`
Thread: `019ea2ce-1077-7f50-9a50-f53e79db2aaf`
Branch verified: `v43-task-1-app-thread-result-protocol`
Worktree verified: `/Users/andy/.codex/worktrees/v43-task-1-app-thread-result-protocol`
Base commit: `5e645c5c68c72c489ff938ffa076e33725bc05f9`
Head commit verified: `0d4d452626da7c86483d37dd06fcc428660898ea`
Worker evidence verified: `docs/plans/v43-task-1-worker-evidence-2026-06-07.md`
Reviewer evidence verified: `docs/plans/v43-task-1-review-evidence-2026-06-07.md`
Verification date: `2026-06-07`

## Verdict

`PASSED`

Task-1 satisfies the runbook acceptance criteria for App thread readback and bounded child result consumption.

## Sources checked

- `docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md`
- `docs/plans/v43-task-1-worker-evidence-2026-06-07.md`
- `docs/plans/v43-task-1-review-evidence-2026-06-07.md`
- `src/symphony/app-thread-result-protocol.js`
- `src/symphony/supervisor-runner.js`
- `tests/v43-app-thread-result-protocol.test.js`
- `tests/v38-supervisor-runner.test.js`

## Verification notes

- `readThreadThroughStableAdapter` uses the stable `readThread(threadId)` call shape and records the replayable capability.
- `recordThreadBinding` rejects duplicate bindings, unreadable readback, missing readback capability, mismatched capability thread id, and mismatched response thread id before activation.
- `notLoaded` remains a non-mutating wait state.
- Pending valid recorded results are selected before active thread readback.
- Result parsing accepts bounded result blocks and fenced JSON payloads, rejects malformed JSON, missing fields, wrong thread ids, and missing result blocks.
- Correction is limited to one result-only prompt before manual recovery.
- Result consumption is append-only and idempotent by record id.
- Accepted terminal event sets include non-success outcomes for reviewer, main-verifier, and release-manager roles.
- `supervisor-runner` now consumes the shared accepted terminal event map.

## Commands run

| Command | Result |
| --- | --- |
| `git status --short && git rev-parse HEAD && git rev-parse --abbrev-ref HEAD` | Exit `0`. Branch `v43-task-1-app-thread-result-protocol`; HEAD `0d4d452626da7c86483d37dd06fcc428660898ea`; reviewer evidence was already modified in the worktree. |
| `sed -n '1,220p' docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md` | Exit `0`. Read global runbook rules and verification gate commands. |
| `sed -n '1,260p' docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md` | Exit `0`. Read task-1 acceptance criteria and scoped verification gates. |
| `sed -n '1,220p' docs/plans/v43-task-1-worker-evidence-2026-06-07.md` | Exit `0`. Verified worker evidence from the assigned worktree. |
| `sed -n '1,220p' docs/plans/v43-task-1-review-evidence-2026-06-07.md` | Exit `0`. Verified reviewer approval evidence from the assigned worktree. |
| `git diff --stat 5e645c5c68c72c489ff938ffa076e33725bc05f9...HEAD && git diff --name-status 5e645c5c68c72c489ff938ffa076e33725bc05f9...HEAD` | Exit `0`. Confirmed task implementation and evidence files changed against base. |
| `sed -n '1,260p' src/symphony/app-thread-result-protocol.js` | Exit `0`. Inspected protocol implementation. |
| `sed -n '1,320p' tests/v43-app-thread-result-protocol.test.js` | Exit `0`. Inspected task-specific regression coverage. |
| `rg -n "ACCEPTED_RESULT_EVENTS|app-thread-result-protocol|accepted" src/symphony/supervisor-runner.js tests/v38-supervisor-runner.test.js` | Exit `0`. Confirmed supervisor runner imports the shared event map. |
| `node --check src/symphony/app-thread-result-protocol.js && node --check src/symphony/supervisor-runner.js && node --test tests/v43-app-thread-result-protocol.test.js tests/v38-supervisor-runner.test.js` | Exit `0`. `12` tests passed, `0` failed. |
| `git diff --check 5e645c5c68c72c489ff938ffa076e33725bc05f9...HEAD` | Exit `0`. No whitespace errors. |
| `pnpm check` | Exit `0`. Repository syntax check passed. |
| `pnpm workbench:build` | Exit `0`. Vite built Workbench static assets successfully. |
| `pnpm test` | Exit `0`. `1094` tests passed, `0` failed. |

## Boundary notes

- I did not create, dispatch, steer, or wait on another Codex thread.
- I did not register a main-verification gate event.
- I did not run release closeout, tag, push, publish, audit, doctor, mutation, provider CLI, or raw shell/provider execution outside the allowed verification commands.
- The verification target was the worker/reviewer result worktree from the supervisor context: `/Users/andy/.codex/worktrees/v43-task-1-app-thread-result-protocol`.

## Residual risk

Task-1 is a pure protocol/helper layer. Later v43 tasks still need to connect these contracts to workspace safety, route reconciliation, daemon visibility, and controlled event registration.
