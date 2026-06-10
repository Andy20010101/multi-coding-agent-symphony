# v44.3 task-3 worker evidence

Local run date: 2026-06-10
Timezone: Asia/Shanghai
Goal: v44-3-app-contract-context-supervisor
Task: task-3
Role: worker
Assigned thread: 019eafa8-0d0a-7ae0-b1ae-2904329b38a0
Branch: codex/v44-3-pr3-session-hook-runtime
Worktree: /Users/andy/.codex/worktrees/codex_v44-3-pr3-session-hook-runtime
Base commit: 3fb17819ba1d69308c07fdbda57040a47d5570b6

## Summary

Implemented the PR-3 read-only session hook runtime for `sessionContext.v1`.

The runtime reads sanitized Codex and Claude JSONL session fixtures through provider-specific read paths and normalizes them into one app-facing context object. The normalized shape includes transcript availability, source summaries, exchange count, latest tool-call metadata, latest turn state, token usage, context utilization, stale/missing transcript markers, drift markers, and bounded result-block presence.

`buildGoalSupervisorAppReadModelFromContracts` now feeds normalized session context into `goal-supervisor-app-read-model.v1`. The pipeline uses the active thread id from supervisor observability when present. If no active thread is known, the session runtime returns a missing transcript state instead of scanning unrelated local sessions.

## Boundary checks

- Session hooks are read-only and set `readOnly: true`, `willMutate: false`.
- Default sources remain Codex `~/.codex/sessions/**/*.jsonl` and Claude `~/.claude/projects/**/*.jsonl`; tests pass explicit sanitized fixtures.
- Unknown token usage and context utilization fields remain `status: missing`.
- The app read model does not expose raw transcript text, raw provider output, tool input, command stdout, or result block text.
- The code does not write `.symphony`, the goal ledger, the goal event log, or result escrow.
- No provider CLI, real CLI, daemon start/stop, child dispatch, mutation, audit, tag, publish, GitHub Release, or release closeout command was added or run.

## Commands run

| Command | Result |
| --- | --- |
| `node --test tests/v44-3-goal-supervisor-session-context.test.js` | Passed. Six tests passed. |
| `node --test tests/v44-goal-supervisor-app-read-model.test.js` | Passed. Five tests passed. |
| `pnpm check` | Passed. Repository syntax check passed. |
| `git diff --check` | Passed. No whitespace errors. |
| `node --test tests/workbench-api-client.test.js` | Passed. Fifty-four tests passed. |

## Files changed

- `src/symphony/goal-supervisor/session-context.js`
- `src/symphony/goal-supervisor/app-read-model-pipeline.js`
- `src/symphony/goal-supervisor/app-read-model.js`
- `src/symphony/goal-supervisor/index.js`
- `fixtures/contracts/goal-supervisor/session-context/codex-thread-active.jsonl`
- `fixtures/contracts/goal-supervisor/session-context/claude-thread-active.jsonl`
- `fixtures/contracts/goal-supervisor/session-context/codex-thread-missing-fields.jsonl`
- `tests/v44-3-goal-supervisor-session-context.test.js`
- `tests/v44-goal-supervisor-app-read-model.test.js`
- `docs/plans/v44-3-task-3-worker-evidence-2026-06-10.md`

## Residual risk

The runtime handles known Codex and Claude JSONL patterns plus conservative generic fields. Provider schema drift should surface as `missing` fields rather than inferred values.
