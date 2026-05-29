# v19 Task 1 Worker Evidence

Date: 2026-05-29

## Goal And Task

- Goal id: `v19-goal-runbook-next-action`
- Task id: `task-1`
- Branch: `v19-task1-goal-runbook-contracts`

## Worker Summary

Task 1 adds the contract baseline for v19 Goal Runbook + Next Action Control Center. The implementation adds validators, valid fixtures, invalid fixtures, and regression tests for:

- `goal-runbook.v1`
- `goal-next-action.v1`
- `goal-prompt-pack.v1`
- `goal-closeout-report.v1`

The new validator module is `src/symphony/goal-runbook-contracts.js`. It validates contract names and versions, safe goal and task ids, controlled evidence refs, task id uniqueness, non-empty acceptance criteria, supported roles, supported event types, copy-only prompt availability, copy-only command fields, dry-run/confirm registration consistency, and the rule that main-verifier prompt registration uses `symphony goal gate --gate main-verification`.

Fixtures were added under `fixtures/contracts/` for the four valid contracts and targeted invalid cases:

- unsafe evidence refs, including encoded traversal coverage in tests
- duplicate task ids
- empty acceptance criteria
- unknown role
- unknown event type
- missing copy-only prompt text when a prompt is marked available
- dry-run and confirm registration drift
- invalid main-verifier registration through `symphony goal update --event main.verification-passed`

The regression test file is `tests/v19-goal-runbook-contracts.test.js`. It validates the four valid fixtures and checks the invalid cases above with exact validator errors or stable error prefixes.

`docs/symphony-product-contracts.md` was updated with v19 Task 1 contract descriptions and boundary notes.

The branch was synced with `main` after the Task 0 goal-status bootstrap. The valid runbook fixture now matches the registered v19 task list for Task 2: `Managed goal runbook registry and symphony goal init` on `v19-task2-goal-runbook-registry`.

## Commands Run

### `pnpm check`

Result: passed, exit code `0`.

Observed output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit code `0`.

Observed summary:

```text
tests 630
suites 105
pass 630
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3489.228625
```

The new v19 suite passed inside the full run:

```text
v19 goal runbook, next action, prompt pack, and closeout contracts
tests 8
pass 8
fail 0
```

The Task 0 bootstrap suite also passed after syncing `main`:

```text
v19 goal progress template bootstrap
tests 3
pass 3
fail 0
```

### `git diff --check`

Result: passed, exit code `0`.

Observed output: no output.

## Boundaries

This task only adds contract fixtures, validators, tests, and contract documentation.

No CLI was implemented. No API route was implemented. No Workbench panel was implemented. No managed runbook state was written. No dependency was added. No README release status was changed. No release state was updated.

The contract rules keep status evidence-based. The implementation does not infer `approved`, `main-verified`, or `release-ready` from branch names, filenames, task titles, command text, commit messages, or paths.

## Reviewer Handoff

Reviewer should check:

- Field stability for the four v19 contracts, including required fields and enum values.
- Invalid fixture coverage for unsafe refs, duplicate task ids, empty acceptance, unknown roles, unknown event types, missing copy-only prompt text, dry-run/confirm inconsistency, and main-verifier registration through the wrong CLI.
- Compatibility with v18 goal event contracts, especially reuse of supported `goal-event-log.v1` event types and evidence-ref safety rules.
- Alignment between the valid runbook fixture and the registered v19 goal progress task list.
- That v19 Task 1 stays inside the contract boundary and does not add CLI, API, Workbench, managed state, or release-status behavior.

No reviewer approval, main verification, or release-ready claim is recorded in this worker evidence.
