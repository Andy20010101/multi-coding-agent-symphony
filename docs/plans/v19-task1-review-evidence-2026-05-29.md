# v19 Task 1 Review Evidence

Date: 2026-05-29

Verdict: NEEDS_REVISION

## Scope Reviewed

- Current branch: `v19-task1-goal-runbook-contracts`
- Compared against: `main`
- Required plan and evidence:
  - `docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md`
  - `docs/plans/v19-task1-worker-evidence-2026-05-29.md`
- Contract docs and v18 baseline:
  - `docs/symphony-product-contracts.md`
  - `src/symphony/goal-event-contracts.js`
  - `tests/v18-goal-event-contracts.test.js`
- v19 Task 1 implementation:
  - `src/symphony/goal-runbook-contracts.js`
  - `tests/v19-goal-runbook-contracts.test.js`
  - `fixtures/contracts/goal-runbook.valid.v1.json`
  - `fixtures/contracts/goal-runbook.unsafe-ref.invalid.v1.json`
  - `fixtures/contracts/goal-runbook.duplicate-task-id.invalid.v1.json`
  - `fixtures/contracts/goal-runbook.empty-acceptance.invalid.v1.json`
  - `fixtures/contracts/goal-runbook.unknown-event-type.invalid.v1.json`
  - `fixtures/contracts/goal-next-action.valid.v1.json`
  - `fixtures/contracts/goal-next-action.copy-only-prompt-missing.invalid.v1.json`
  - `fixtures/contracts/goal-prompt-pack.valid.v1.json`
  - `fixtures/contracts/goal-prompt-pack.unknown-role.invalid.v1.json`
  - `fixtures/contracts/goal-prompt-pack.dry-run-confirm-inconsistent.invalid.v1.json`
  - `fixtures/contracts/goal-closeout-report.valid.v1.json`
  - `fixtures/contracts/goal-closeout-report.unknown-event-type.invalid.v1.json`

## Diff Reviewed

`git diff --name-status main...HEAD` showed only Task 1 contract documentation, fixtures, validator, tests, and worker evidence:

```text
A	docs/plans/v19-task1-worker-evidence-2026-05-29.md
M	docs/symphony-product-contracts.md
A	fixtures/contracts/goal-closeout-report.unknown-event-type.invalid.v1.json
A	fixtures/contracts/goal-closeout-report.valid.v1.json
A	fixtures/contracts/goal-next-action.copy-only-prompt-missing.invalid.v1.json
A	fixtures/contracts/goal-next-action.valid.v1.json
A	fixtures/contracts/goal-prompt-pack.dry-run-confirm-inconsistent.invalid.v1.json
A	fixtures/contracts/goal-prompt-pack.unknown-role.invalid.v1.json
A	fixtures/contracts/goal-prompt-pack.valid.v1.json
A	fixtures/contracts/goal-runbook.duplicate-task-id.invalid.v1.json
A	fixtures/contracts/goal-runbook.empty-acceptance.invalid.v1.json
A	fixtures/contracts/goal-runbook.unknown-event-type.invalid.v1.json
A	fixtures/contracts/goal-runbook.unsafe-ref.invalid.v1.json
A	fixtures/contracts/goal-runbook.valid.v1.json
A	src/symphony/goal-runbook-contracts.js
A	tests/v19-goal-runbook-contracts.test.js
```

`git diff --exit-code main...HEAD -- package.json pnpm-lock.yaml` exited `0` with no output.

`git diff --exit-code main...HEAD -- tests/v18-goal-event-contracts.test.js src/symphony/goal-event-contracts.js src/symphony/goal-progress-ledger.js` exited `0` with no output.

`git diff --name-only main...HEAD | rg '(^src/cli|^src/server|^workbench/|package.json|pnpm-lock.yaml|goal-event-contracts|goal-progress-ledger)'` exited `1` with no output.

## Contract Review

The four new contract names and versions are explicit constants in `src/symphony/goal-runbook-contracts.js`.

- `goal-runbook.v1`: required top-level fields are present; task ids are safe tokens and unique; acceptance arrays are non-empty; expected evidence values are checked against v18 `GOAL_EVENT_TYPES`; release gates are checked against the v19 runbook gate list.
- `goal-next-action.v1`: status, next action fields, evidence refs, copy-only prompt, allowed events, commands, and safety flags are validated.
- `goal-prompt-pack.v1`: role enum covers `worker`, `reviewer`, `main-verifier`, and `release-manager`; prompt text must start with `/goal`; evidence files use controlled refs; dry-run and confirm fields are separated; main-verifier registration is forced through `symphony goal gate --gate main-verification`.
- `goal-closeout-report.v1`: summary booleans, missing expected event types, release gate statuses, next action command, and safety flags are validated.

The valid fixtures match the intended Task 1 contract shape. The invalid fixtures cover the requested categories at fixture or test level: unsafe refs, duplicate task id, empty acceptance, unknown role, unknown event type, missing copy-only prompt text, and dry-run/confirm drift.

## Blocker

`src/symphony/goal-runbook-contracts.js` does not reject raw `..` path segments when the segment appears at the end of a controlled evidence ref.

The validator rejects `../secret.md` and encoded traversal, but it accepts these refs:

- `docs/plans/..`
- `docs/plans/subdir/..`

That violates the v19 Task 1 unsafe ref requirement for controlled repo-doc or managed artifact refs. These refs are path traversal segments even though they do not contain the substring `../`.

Probe run:

```sh
node --input-type=module -e "import { validateGoalRunbookContract } from './src/symphony/goal-runbook-contracts.js'; import { readFileSync } from 'node:fs'; const runbook=JSON.parse(readFileSync('fixtures/contracts/goal-runbook.valid.v1.json','utf8')); for (const ref of ['docs/plans/..','docs/plans/.%2e/secret.md','docs/plans/%2e%2e','docs/plans/subdir/..']) { const copy=structuredClone(runbook); copy.baseline.evidenceRef=ref; console.log(ref, validateGoalRunbookContract(copy)); }"
```

Observed output:

```text
docs/plans/.. { ok: true, errors: [] }
docs/plans/.%2e/secret.md {
  ok: false,
  errors: [ 'baseline.evidenceRef must be a controlled evidence reference' ]
}
docs/plans/%2e%2e {
  ok: false,
  errors: [ 'baseline.evidenceRef must be a controlled evidence reference' ]
}
docs/plans/subdir/.. { ok: true, errors: [] }
```

## Required Changes

1. Update the controlled ref validator so raw and decoded refs reject any path segment equal to `..`, including terminal segments such as `docs/plans/..` and `artifacts/run/..`.
2. Add an invalid fixture or fixture-backed test for a raw terminal traversal segment. Keep the existing encoded traversal coverage.
3. Re-run `pnpm check`, `pnpm test`, and `git diff --check`.

## Boundary Checks

- No CLI implementation was added in this branch.
- No API route was added in this branch.
- No Workbench panel or browser execution surface was added in this branch.
- No managed runbook state writer was added in this branch.
- No dependency or lockfile change was added in this branch.
- v18 `goal-event-log.v1`, `goal-update-plan.v1`, and `goal-progress-ledger.v1` source/test files were not modified by this branch.

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
duration_ms 3352.953458
```

The v18 baseline suite passed inside the full run:

```text
v18 goal-event-log.v1 and goal-update-plan.v1 contract baseline
tests 7
pass 7
fail 0
```

The v19 Task 1 suite passed inside the full run:

```text
v19 goal runbook, next action, prompt pack, and closeout contracts
tests 8
pass 8
fail 0
```

### `git diff --check`

Result: passed, exit code `0`.

Observed output: no output.
