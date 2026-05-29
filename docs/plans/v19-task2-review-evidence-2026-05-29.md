# v19 Task 2 Review Evidence

Date: 2026-05-29

Verdict: APPROVED

## Scope Reviewed

Current branch: `v19-task2-goal-runbook-registry`

Reviewed against `main` with:

```text
A	docs/plans/v19-task2-worker-evidence-2026-05-29.md
M	scripts/symphony.js
A	src/symphony/goal-runbook-registry.js
A	tests/v19-goal-runbook-registry-cli.test.js
```

Files and contracts reviewed:

- `docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md`
- `docs/plans/v19-task2-worker-evidence-2026-05-29.md`
- `src/symphony/goal-runbook-contracts.js`
- `fixtures/contracts/goal-runbook.valid.v1.json`
- `tests/v19-goal-runbook-contracts.test.js`
- `src/symphony/goal-runbook-registry.js`
- `scripts/symphony.js`
- `tests/v19-goal-runbook-registry-cli.test.js`

Task 2 is limited to managed runbook registry storage and `symphony goal init`. I did not find Workbench changes, API route changes, next-action resolver code, prompt-pack generation, closeout generation, model invocation, or arbitrary markdown parsing in this branch diff.

## Reviewer Checks

Dry-run does not write managed state. `buildGoalRunbookInitPlan` normalizes and validates the controlled fixture, then returns `goal-runbook-init-plan.v1`. The mandatory dry-run command reported `writeIntent.writesInDryRun: false`, `safety.dryRunWrites: false`, and the two post-command file probes confirmed `.symphony/goals/runbooks/v19-fixture.json` and `.symphony/goals/latest-active-goal.json` were absent.

Confirm requires a plan hash. `confirmGoalRunbookInit` rejects missing `--plan-hash`, rejects non-`sha256:<64 hex>` values, rebuilds the plan from the current input, and refuses writes when the computed hash differs from the supplied hash.

Confirm writes only the managed runbook state and active goal pointer. The only write calls in `writeManagedGoalRunbookState` are `atomicWriteJson(normalized.stateRefs.runbookState.path, state)` and `atomicWriteJson(normalized.stateRefs.latestActiveGoalPointer.path, pointer)`. Those refs are reported in dry-run output as `.symphony/goals/runbooks/<goalId>.json` and `.symphony/goals/latest-active-goal.json`.

Idempotent confirm is covered and behaves correctly for the same plan. Existing identical runbook state is compared canonically, the retry returns `already-registered`, `written: false`, and the focused test verifies both file byte strings are unchanged.

`--from-json` is restricted to controlled fixture refs. The registry rejects blank input, leading/trailing whitespace, absolute paths, `file://`, `~/`, backslashes, `..`, percent-encoded path markers, non-`fixtures/contracts/` prefixes, non-normalized paths, and names outside `goal-runbook.*.v1.json`. The fixture is parsed as JSON and validated with the Task 1 `goal-runbook.v1` validator before any confirm write path is reached.

`--from`, `--plan-file`, and `--output` are rejected by the CLI parser for `goal init`. That keeps Task 2 out of arbitrary markdown parsing and arbitrary output writes.

v18 `goal update`, `goal review`, and `goal gate` behavior remains compatible. The branch only adds `init` dispatch before the existing `gate`, `review`, and `update` branches, and the focused v18 CLI suites still pass.

## Commands Run

### `pnpm check`

Exit code: `0`

Observed output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: `0`

Observed final summary:

```text
tests 636
suites 106
pass 636
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3509.841542
```

The full run included these relevant suites:

```text
v18 symphony goal gate CLI: pass 5
v18 symphony goal review CLI: pass 6
v18 symphony goal update CLI: pass 5
v19 goal runbook, next action, prompt pack, and closeout contracts: pass 9
v19 symphony goal init CLI: pass 5
```

### `pnpm symphony goal init --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --dry-run --json`

Exit code: `0`

Observed output:

```json
{
  "contractName": "goal-runbook-init-plan.v1",
  "contractVersion": 1,
  "planId": "goal_init_e905b93749b69ed9",
  "planHash": "sha256:634115a9e3fcc1419ccaad41535bbc12acfba4a0a506727a4b7df03672d91aed",
  "goalId": "v19-fixture",
  "mode": "dry-run",
  "command": {
    "name": "symphony goal init",
    "intent": "register-managed-goal-runbook",
    "confirmRequired": true
  },
  "source": {
    "kind": "controlled-fixture",
    "ref": "fixtures/contracts/goal-runbook.valid.v1.json",
    "runbookGoalId": "v19-goal-runbook-next-action"
  },
  "runbook": {
    "contractName": "goal-runbook.v1",
    "contractVersion": 1,
    "goalTitle": "v19 Goal Runbook + Next Action Control Center",
    "taskCount": 2,
    "taskIds": [
      "task-1",
      "task-2"
    ],
    "releaseGateCount": 9
  },
  "validation": {
    "status": "ok",
    "errors": [],
    "warnings": []
  },
  "writeIntent": {
    "managedOnly": true,
    "writesInDryRun": false,
    "confirmRequired": true,
    "targets": [
      {
        "kind": "runbook-state",
        "storage": "managed-goal-runbook-registry",
        "path": ".symphony/goals/runbooks/v19-fixture.json"
      },
      {
        "kind": "latest-active-goal-pointer",
        "storage": "managed-active-goal-pointer",
        "path": ".symphony/goals/latest-active-goal.json"
      }
    ]
  },
  "confirm": {
    "available": true,
    "requiredFlags": [
      "--confirm",
      "--plan-hash"
    ],
    "copyOnlyCommand": "symphony goal init --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --confirm --plan-hash sha256:634115a9e3fcc1419ccaad41535bbc12acfba4a0a506727a4b7df03672d91aed --json"
  },
  "stateRefs": {
    "runbookState": {
      "storage": "managed-goal-runbook-registry",
      "path": ".symphony/goals/runbooks/v19-fixture.json"
    },
    "latestActiveGoalPointer": {
      "storage": "managed-active-goal-pointer",
      "path": ".symphony/goals/latest-active-goal.json"
    }
  },
  "safety": {
    "dryRunWrites": false,
    "confirmWritesManagedStateOnly": true,
    "arbitraryPathReadAvailable": false,
    "arbitraryPathWriteAvailable": false,
    "workbenchWriteAvailable": false,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false,
    "automaticEventRegistrationAvailable": false
  }
}
```

### `git diff --check`

Exit code: `0`

Observed output: no output.

### `test ! -e .symphony/goals/runbooks/v19-fixture.json`

Exit code: `0`

Observed output: no output.

### `test ! -e .symphony/goals/latest-active-goal.json`

Exit code: `0`

Observed output: no output.

### `node --test tests/v19-goal-runbook-registry-cli.test.js`

Exit code: `0`

Observed output:

```text
v19 symphony goal init CLI
pass 5
fail 0
duration_ms 64.575333
```

Covered cases:

```text
prints a goal-runbook-init-plan.v1 dry-run without writing managed state
confirms only when the plan hash matches and writes managed runbook state plus active pointer
treats retrying the same confirmed plan as idempotent
refuses mismatched plan hashes without writing managed state
rejects markdown sources, arbitrary JSON paths, and output paths without writing
```

### `node scripts/symphony.js goal init --state-dir "$(mktemp -d)/.symphony" --goal v19-fixture --from-json fixtures/contracts/goal-runbook.valid.v1.json --confirm --json`

Exit code: `64`

Observed output:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal init confirm requires --plan-hash."
}
```

### `node --test tests/v18-goal-update-cli.test.js tests/v18-goal-review-cli.test.js tests/v18-goal-gate-cli.test.js`

Exit code: `0`

Observed summary:

```text
v18 symphony goal gate CLI: pass 5
v18 symphony goal review CLI: pass 6
v18 symphony goal update CLI: pass 5
tests 16
suites 3
pass 16
fail 0
duration_ms 68.15325
```

## Blockers

None.

## Approval Scope

APPROVED for v19 Task 2 only: managed goal runbook registry state, latest active goal pointer, `symphony goal init`, and the associated CLI tests/evidence. This approval does not verify `main`, does not approve release readiness, and does not approve future next-action resolver, prompt generator, closeout report, Workbench, API, model, merge, tag, or release work.
