# v43 Task 3 Worker Evidence

Date: 2026-06-07
Goal: `v43-goal-supervisor-stabilization`
Task: `task-3`
Branch: `v43-task-3-route-status-reconciliation`

## Implementation

- Updated `src/symphony/goal-next-action-resolver.js` so route decisions prefer append-only event state once a task or release phase has route events.
- Added `goal-route-reconciliation.v1` warnings to `goal-next-action.v1` output when event state and `goal-status` ledger state disagree.
- Kept reviewer approval separate from main verification: reviewer approval without a `main.verification-passed` event now routes to the main verifier even if stale ledger status says `main-verified`.
- Kept failed main verification on the required path: worker revision, reviewer review, then main verification.
- Kept release progression event-backed: stale passed release-gate ledger state does not move to release prep when release events show no passed gate event.
- Added `tests/v43-route-status-reconciliation.test.js` for stale ledger, failed main verification revision routing, release gate reconciliation, and idempotent consumed-result event mapping.

## Files Changed

- `src/symphony/goal-next-action-resolver.js`
- `tests/v43-route-status-reconciliation.test.js`
- `docs/plans/v43-task-3-worker-evidence-2026-06-07.md`

## Validation

- `node --test tests/v43-route-status-reconciliation.test.js` passed: 4 tests, 1 suite.
- `node --test tests/v19-goal-next-action-resolver.test.js tests/v19-goal-next-cli.test.js tests/v21-release-ready-boundary.test.js tests/v38-supervisor-runner.test.js tests/v43-app-thread-result-protocol.test.js tests/v43-workspace-evidence-safety.test.js tests/v43-route-status-reconciliation.test.js` passed: 46 tests, 7 suites.
- `pnpm check` passed.
- `pnpm test` passed: 1107 tests, 172 suites.
- `pnpm workbench:build` passed.
- `git diff --check` passed after this evidence file was added.

## Notes

- The next-action contract validator allows additional fields, so `reconciliation` and `reconciliationWarnings` are attached without changing the required `goal-next-action.v1` fields.
- Release closeout remains under the existing supervisor `--allow-closeout` gate; this task did not add release closeout execution or authorization bypasses.
- No provider allowlist, real provider CLI, mutation, audit, tag, push, publish, or release closeout commands were run.
