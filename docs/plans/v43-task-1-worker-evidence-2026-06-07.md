# v43 task-1 worker evidence

Goal: `v43-goal-supervisor-stabilization`
Task: `task-1` - App thread and result protocol contracts
Role: `worker`
Thread: `019e91fe-b10f-7fe2-a193-2628ef363bc8`
Branch: `v43-task-1-app-thread-result-protocol`
Worktree: `/Users/andy/.codex/worktrees/v43-task-1-app-thread-result-protocol`
Base commit: `5e645c5c68c72c489ff938ffa076e33725bc05f9`
Date: `2026-06-07`
Revision thread: `019ea2c2-fc88-7700-9b76-ce5da07be764`

## Sources checked

- `docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-evidence-skeletons-2026-06-07.md`
- `docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json`
- `docs/plans/v42-goal-supervisor-runtime-context-loop-plan-2026-06-06.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/v42_goal-supervisor-runtime-context-loop_goal_runbook_latest.md`
- `docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md`
- `docs/plans/controller/subagent-result-format.md`
- `src/symphony/supervisor-runner.js`
- `tests/v38-supervisor-runner.test.js`

## Implementation summary

- Added `src/symphony/app-thread-result-protocol.js` for the App-side readback and child result protocol contract.
- Centralized accepted terminal events for worker, reviewer, main-verifier, and release-manager roles, including non-success outcomes.
- Added pure contract functions for stable `readThread(threadId)` readback, `record-thread` duplicate and unreadable rejection, append-only result block parsing, one correction prompt, manual recovery escalation, and idempotent result consumption.
- Updated `src/symphony/supervisor-runner.js` to use the shared accepted terminal event map instead of a separate local list.
- Added replay-focused tests in `tests/v43-app-thread-result-protocol.test.js`.

## Revision summary

- Addressed reviewer finding 1 from `docs/plans/v43-task-1-review-evidence-2026-06-07.md`: `recordThreadBinding` now requires readable readback to carry the replayable `readThread(threadId)` capability, with `method: readThread`, matching `callShape.threadId`, and no optional parameters.
- `recordThreadBinding` now rejects a readable response when `response.id`, `response.threadId`, `response.thread.id`, or `response.thread.threadId` identifies a different thread.
- Added regression coverage for missing read capability, mismatched capability thread id, and mismatched response thread id.
- Addressed reviewer finding 2 by committing the task implementation and evidence to branch `v43-task-1-app-thread-result-protocol` after validation.

## Files changed

- `src/symphony/app-thread-result-protocol.js`
- `src/symphony/supervisor-runner.js`
- `tests/v43-app-thread-result-protocol.test.js`
- `docs/plans/v43-task-1-worker-evidence-2026-06-07.md`

## Task-specific proof

- Created thread readback uses one replayable call shape: `readThread(threadId)` with no optional parameters.
- `record-thread` rejects duplicate bindings, unreadable thread ids, missing readback capability, mismatched readback capability thread id, and mismatched response thread id before marking a thread active.
- App `notLoaded` is returned as `waiting-active-child-not-loaded` with `mutatesState: false`.
- Pending valid recorded results are selected before live active-thread readback.
- Parser coverage includes raw result blocks, markdown fenced JSON, invalid JSON, missing fields, wrong thread id, and missing result block.
- Correction is limited to one result-only prompt. Repeated invalid output, unreachable correction, or a queued prompt behind an active child escalates to `manual-result-recovery`.
- Consuming the same parsed result twice is idempotent and does not append a second event.
- Accepted terminal event sets include `reviewer.needs-revision`, `reviewer.blocked`, `main.verification-failed`, `release.gate-failed`, and `release.evidence-recorded`.

## Commands run with exact results

| Command | Outcome |
| --- | --- |
| `node --check src/symphony/app-thread-result-protocol.js && node --check src/symphony/supervisor-runner.js && node --test tests/v43-app-thread-result-protocol.test.js tests/v38-supervisor-runner.test.js` | Exit `0`. `12` tests passed, `0` failed. |
| `pnpm check` | Exit `0`. Node syntax check completed for source, scripts, plugins, and test files. |
| `pnpm test` | First run exited `1` because this worktree lacked `node_modules`; failures were module resolution errors for `fast-check` and `react`. Output reported `989` tests, `982` passed, `7` failed before dependency recovery. |
| `pnpm install --offline --frozen-lockfile` | Exit `0`. Lockfile was up to date; `192` packages were reused from the local store and added to this worktree. |
| `pnpm test` | Exit `0`. Latest run: `1094` tests passed, `0` failed. |
| `pnpm workbench:build` | Exit `0`. Latest run: Vite built `src/symphony/workbench-static/index.html`, `assets/index-CILC3208.css`, and `assets/index-3PVjv4nj.js` in `76ms`. |
| `git diff --check` | Exit `0`. No whitespace errors. |
| `pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json --goal v43-goal-supervisor-stabilization --dry-run --json` | Exit `0`. Dry-run returned plan hash `sha256:cb1287aa5bbc1351253523695ab7e73b8a05bea4743fefc021a8e570250d48c8`; writes would target ignored `.symphony` managed state only. |
| `pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json --goal v43-goal-supervisor-stabilization --confirm --plan-hash sha256:cb1287aa5bbc1351253523695ab7e73b8a05bea4743fefc021a8e570250d48c8 --json` | Exit `0`. Local managed runbook state registered. No worker, reviewer, main-verification, or release event was registered. |
| `pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json` | Exit `0`. Latest run returned `goal-progress-ledger.v1`; `totalTasks: 4`, `completedTasks: 0`, `releaseReady: false`, next action starts `task-1`. |
| `pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json` | Exit `0`. Latest run returned `goal-next-action.v1`; status `action-required`, next `task-1` / `worker` / `implement`, allowed worker events `worker.evidence-recorded`, `worker.self-check-passed`, `worker.self-check-failed`. |
| `node --input-type=module <<'NODE' ... reviewer identity mismatch reproduction ... NODE` | Exit `0`. Output showed `accepted: false`, `active: false`, `reason: thread-readback-capability-mismatch`. |

## Boundary notes

- No new App product UI was added.
- The protocol does not consume raw chat prose as evidence. Missing prose-only results produce one correction action and then manual recovery if still invalid.
- `notLoaded` is not treated as a failed child result and does not mutate state.
- The implementation does not send correction prompts itself; it returns a bounded correction action for the supervisor/controller to deliver once.
- No reviewer verdict, main-verification gate, release gate, tag, push, or release-ready event was registered.

## Reviewer handoff checklist

- Verify `recordThreadBinding` cannot activate duplicate or unreadable thread ids.
- Verify `readThreadThroughStableAdapter` calls the adapter with only `threadId`.
- Verify parser behavior for invalid JSON, fenced JSON, missing fields, wrong thread id, and missing block.
- Verify correction remains one attempt before manual recovery.
- Verify `consumeParsedResult` is append-only and idempotent.
- Verify accepted terminal events include non-success outcomes for reviewer, main-verifier, and release-manager roles.
