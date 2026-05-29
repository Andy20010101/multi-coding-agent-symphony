# v19 Task 2 Worker Evidence

Date: 2026-05-29

## Goal And Task

- Goal id: `v19-goal-runbook-next-action`
- Task id: `task-2`
- Branch: `v19-task2-goal-runbook-registry`

## Worker Summary

Task 2 adds the first managed runbook registry path for v19 and wires `symphony goal init` into the existing goal CLI family.

Changed implementation:

- `src/symphony/goal-runbook-registry.js`
  - Added managed runbook state path: `.symphony/goals/runbooks/<goalId>.json`.
  - Added latest active goal pointer path: `.symphony/goals/latest-active-goal.json`.
  - Added `goal-runbook-init-plan.v1` dry-run output with stable `planHash`, write intent, confirm command, and state refs.
  - Added confirm flow that requires `--confirm --plan-hash`.
  - Confirm validates the current input against the dry-run plan hash before writing.
  - Confirm writes only managed runbook state and the active goal pointer.
  - Confirm is idempotent for the same plan and returns `already-registered` without changing file bytes on retry.
  - First source format is controlled `--from-json fixtures/contracts/goal-runbook.valid.v1.json`.
- `scripts/symphony.js`
  - Added `symphony goal init`.
  - Added parser rules for `--goal`, `--from-json`, `--dry-run`, `--confirm`, `--plan-hash`, `--state-dir`, and `--json`.
  - Rejected markdown input through `--from`.
  - Rejected `--output` and `--plan-file`.
- `tests/v19-goal-runbook-registry-cli.test.js`
  - Covers dry-run with no managed writes.
  - Covers hash-confirmed managed state writes.
  - Covers idempotent retry for the same plan.
  - Covers mismatched plan hash refusal.
  - Covers markdown source, arbitrary JSON path, and output path rejection.

The CLI-provided `--goal` becomes the managed goal id. The source fixture's original goal id is retained in the `source.runbookGoalId` field so the dry-run output records where the runbook shape came from.

## Commands Run

### `node --check src/symphony/goal-runbook-registry.js`

Result: passed, exit code `0`.

Observed output: no output.

### `node --check scripts/symphony.js`

Result: passed, exit code `0`.

Observed output: no output.

### `node --test tests/v19-goal-runbook-registry-cli.test.js`

Result: passed, exit code `0`.

Observed summary:

```text
tests 5
suites 1
pass 5
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 67.571167
```

The focused suite passed these cases:

```text
prints a goal-runbook-init-plan.v1 dry-run without writing managed state
confirms only when the plan hash matches and writes managed runbook state plus active pointer
treats retrying the same confirmed plan as idempotent
refuses mismatched plan hashes without writing managed state
rejects markdown sources, arbitrary JSON paths, and output paths without writing
```

### `pnpm check`

Result: passed, exit code `0`.

Observed output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit code `0`.

Observed summary from the final full run:

```text
tests 636
suites 106
pass 636
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3353.762625
```

The new v19 Task 2 suite passed inside the full run:

```text
v19 symphony goal init CLI
tests 5
pass 5
fail 0
```

### `pnpm symphony goal init --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --dry-run --json`

Result: passed, exit code `0`.

Key output fields:

```text
contractName: goal-runbook-init-plan.v1
contractVersion: 1
planId: goal_init_e905b93749b69ed9
planHash: sha256:634115a9e3fcc1419ccaad41535bbc12acfba4a0a506727a4b7df03672d91aed
goalId: v19-fixture
mode: dry-run
command.name: symphony goal init
command.intent: register-managed-goal-runbook
command.confirmRequired: true
source.kind: controlled-fixture
source.ref: fixtures/contracts/goal-runbook.valid.v1.json
source.runbookGoalId: v19-goal-runbook-next-action
runbook.contractName: goal-runbook.v1
runbook.contractVersion: 1
runbook.goalTitle: v19 Goal Runbook + Next Action Control Center
runbook.taskCount: 2
runbook.taskIds: task-1, task-2
runbook.releaseGateCount: 9
validation.status: ok
writeIntent.managedOnly: true
writeIntent.writesInDryRun: false
writeIntent.confirmRequired: true
stateRefs.runbookState.path: .symphony/goals/runbooks/v19-fixture.json
stateRefs.latestActiveGoalPointer.path: .symphony/goals/latest-active-goal.json
safety.dryRunWrites: false
safety.confirmWritesManagedStateOnly: true
safety.arbitraryPathReadAvailable: false
safety.arbitraryPathWriteAvailable: false
safety.modelInvocationAvailable: false
safety.automaticEventRegistrationAvailable: false
```

Confirm command emitted by the dry-run:

```text
symphony goal init --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --confirm --plan-hash sha256:634115a9e3fcc1419ccaad41535bbc12acfba4a0a506727a4b7df03672d91aed --json
```

### `git diff --check`

Result: passed, exit code `0`.

Observed output: no output.

## Managed State Notes

Dry-run does not write files.

Confirm writes only these managed state refs:

```text
.symphony/goals/runbooks/<goalId>.json
.symphony/goals/latest-active-goal.json
```

The confirmed runbook state uses `managed-goal-runbook-state.v1`. The active pointer uses `managed-active-goal-pointer.v1`. Both are written through the managed registry code path, not through a user-supplied output path.

Confirm retries for the same plan are stable. The second confirm returns `already-registered`, reports `written: false`, and leaves both managed files unchanged.

## Boundaries

This task does not parse arbitrary markdown paths. `symphony goal init --from ...` is rejected.

This task does not read arbitrary local paths. `--from-json` is limited to controlled `fixtures/contracts/goal-runbook.*.v1.json` refs and rejects absolute paths, file URLs, home paths, traversal-like refs, backslashes, and encoded path markers.

This task does not write arbitrary paths. `--output` is rejected, and confirm writes only managed runbook registry state.

This task does not implement the next-action resolver. It does not implement `symphony goal next`, goal prompt generation, closeout reports, Workbench panels, API routes, model calls, or automatic reviewer/main/release event registration.

No reviewer approval, main verification, release-ready declaration, tag creation, or release publication is recorded in this worker evidence.

## Reviewer Handoff

Reviewer should check:

- `goal-runbook-registry.js` hash input stability and confirm hash comparison.
- The managed write paths for runbook state and active pointer.
- The controlled `--from-json` source restrictions.
- Idempotent retry behavior for the same plan.
- Rejection behavior for markdown input, arbitrary JSON paths, and output paths.
- That Task 2 does not include next-action resolver, prompt pack generation, Workbench, API routes, model invocation, or automatic evidence events.
