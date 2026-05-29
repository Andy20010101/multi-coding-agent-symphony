# v19 Task 3 Worker Evidence

## Task

- Goal id: `v19-goal-runbook-next-action`
- Task id: `task-3`
- Branch: `v19-task3-next-action-resolver`
- Date: 2026-05-29

## Implementation Summary

Task 3 adds an event-aware next-action resolver for `goal-next-action.v1`.

The resolver reads:

- Managed `goal-runbook.v1` state from the runbook registry.
- `goal-event-log.v1` from the managed event journal.
- `goal-progress-ledger.v1` from the existing progress resolver.

The resolver returns a validated `goal-next-action.v1` object. It sets `status`, `next`, `reason`, current evidence refs, copy-only command hints, and `afterCompletion.allowedEvents`.

The rule order is:

- Missing managed runbook returns `missing-runbook`.
- Invalid event chain returns `blocked` with no executable next step.
- The first runbook task without explicit worker evidence returns worker action.
- Worker evidence with no reviewer verdict returns reviewer action.
- Latest `reviewer.needs-revision` returns worker revision action.
- Latest `reviewer.approved` with no main verification returns main-verifier action.
- All runbook tasks main-verified with a missing release gate returns release-manager action.
- `release.ready-declared` with `tagEvidence` passed returns `complete`.

The implementation also updates the `goal-next-action.v1` validator so terminal `blocked`, `complete`, and `missing-runbook` results can carry no executable next step. This is required for invalid event chains, where the resolver must not recommend more execution.

## Scenario Coverage

- no events: a registered runbook with an empty event journal resolves to `task-1` worker.
- worker missing: a task with text or branch names that mention completion still resolves to worker when no explicit worker evidence event exists.
- review missing: `worker.evidence-recorded` without reviewer verdict resolves to reviewer.
- needs revision: latest `reviewer.needs-revision` resolves to worker revision.
- main verification missing: `reviewer.approved` without `main.verification-passed` resolves to main-verifier.
- release gate missing: all runbook tasks with `main.verification-passed` and a missing release gate resolve to release-manager.
- complete: `release.ready-declared` plus passed `release.tag-evidence` resolves to `complete`.
- blocked chain: a tampered event journal hash chain resolves to `blocked` with `next: null`, no copy-only commands, and no allowed completion events.

## Verification Results

### `pnpm check`

Result: passed.

- Exit code: 0
- Command run by script: `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`
- Diagnostics: none

### `pnpm test`

Result: passed.

- Exit code: 0
- Tests: 646
- Suites: 107
- Pass: 646
- Fail: 0
- Cancelled: 0
- Skipped: 0
- Todo: 0
- Duration: 3380.222125 ms

Task 3 resolver suite result inside the full run:

- `v19 event-aware goal-next-action.v1 resolver`: 10 tests, 10 pass, 0 fail.

### `git diff --check`

Result: passed.

- Exit code: 0
- Output: none

## Boundary Notes

- The resolver does not execute commands.
- The resolver does not run tests, audit, mutation, or any release gate as a side effect.
- The resolver does not generate `goal-prompt-pack.v1`.
- The resolver does not implement `symphony goal prompt`.
- The resolver does not change Workbench.
- The resolver does not infer completion from branch names, filenames, commit messages, statements, or command text.
- This evidence records worker implementation only. It does not claim reviewer approval, main verification, or release readiness.
