# v44.3 task-1 worker evidence

Date: 2026-06-10

Branch: `codex/v44-3-pr1-app-facing-contracts-fixtures`

Worktree: `/Users/andy/.codex/worktrees/codex_v44-3-pr1-app-facing-contracts-fixtures`

## Scope

Task-1 adds the first app-facing supervisor read-model contract and replay fixtures for PR-1. It does not add an API route, CLI command, frontend binding, ledger write, event registration, daemon control, provider CLI call, release command, tag, push, or closeout automation.

## Files Changed

- `src/symphony/goal-supervisor/app-read-model.js`
- `src/symphony/goal-supervisor/index.js`
- `fixtures/contracts/goal-supervisor/app-read-model.v44-3.pr1.v1.json`
- `tests/v44-goal-supervisor-app-read-model.test.js`
- `docs/plans/v44-3-task-1-worker-evidence-2026-06-10.md`

## Contract Coverage

The new builder emits `goal-supervisor-app-read-model.v1` with these app-facing objects:

- `goalSnapshot`
- `goalTimeline`
- `activeLease`
- `pendingResult`
- `currentGate`
- `recommendedNextAction`
- `ownership`
- `contextStatus`
- `commandBoundary`

The fixture covers the PR-1 scenarios from the runbook:

- dispatchable next action
- active lease with recent transcript
- active lease with stale transcript
- pending escrow result
- missing transcript
- release closeout blocked
- command boundary disabled
- dry-run command preview
- confirm-required command preview

The test checks that the read model is read-only, keeps command execution unavailable, and omits raw transcript fields such as `latestResultText`, `rawTranscript`, and `agentMessage`.

## Validation

- `node --test tests/v44-goal-supervisor-app-read-model.test.js`: passed
- `node --test tests/v44-goal-supervisor-*.test.js`: passed
- `pnpm check`: passed
- `git diff --check`: passed
