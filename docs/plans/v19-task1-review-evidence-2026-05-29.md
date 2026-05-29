# v19 Task 1 Review Evidence

Date: 2026-05-29

Verdict: APPROVED

## Scope Reviewed

- Current branch: `v19-task1-goal-runbook-contracts`
- Compared against: `main`
- Required plan and evidence:
  - `docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md`
  - `docs/plans/v19-task1-worker-evidence-2026-05-29.md`
  - `docs/plans/v19-task1-worker-revision-evidence-2026-05-29.md`
- Contract docs and v18 baseline:
  - `docs/symphony-product-contracts.md`
  - `src/symphony/goal-event-contracts.js`
  - `tests/v18-goal-event-contracts.test.js`
- v19 Task 1 implementation:
  - `src/symphony/goal-runbook-contracts.js`
  - `tests/v19-goal-runbook-contracts.test.js`
  - `fixtures/contracts/goal-runbook.valid.v1.json`
  - `fixtures/contracts/goal-runbook.unsafe-ref.invalid.v1.json`
  - `fixtures/contracts/goal-runbook.raw-parent-segment.invalid.v1.json`
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

`git diff --name-status main...HEAD`:

```text
A	docs/plans/v19-task1-review-evidence-2026-05-29.md
A	docs/plans/v19-task1-worker-evidence-2026-05-29.md
A	docs/plans/v19-task1-worker-revision-evidence-2026-05-29.md
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
A	fixtures/contracts/goal-runbook.raw-parent-segment.invalid.v1.json
A	fixtures/contracts/goal-runbook.unknown-event-type.invalid.v1.json
A	fixtures/contracts/goal-runbook.unsafe-ref.invalid.v1.json
A	fixtures/contracts/goal-runbook.valid.v1.json
A	src/symphony/goal-runbook-contracts.js
A	tests/v19-goal-runbook-contracts.test.js
```

The branch adds contract documentation, v19 fixtures, one validator module, v19 tests, and Task 1 evidence files. I did not find CLI, API, Workbench, managed state, package, or lockfile changes in the branch diff.

## Contract Checks

`goal-runbook.v1` has stable contract name/version constants, requires the runbook identity, baseline, tasks, release gates, and role policy, and validates safe goal/task ids, unique task ids, non-empty acceptance, known task roles, known expected evidence event types, controlled baseline evidence refs, copy-only commands, and release gate ids.

`goal-next-action.v1` has stable contract name/version constants and validates status, next action role/phase/blocking state, evidence refs, copy-only prompt availability and text, copy-only commands, after-completion event types, and read-only/copy-only safety flags.

`goal-prompt-pack.v1` has stable contract name/version constants and validates supported roles `worker`, `reviewer`, `main-verifier`, and `release-manager`; `/goal` prompt text; copy-only flags; validation commands; controlled evidence file refs; dry-run and confirm command separation; append-only confirm metadata; and main-verifier registration through `symphony goal gate --gate main-verification`.

`goal-closeout-report.v1` has stable contract name/version constants and validates summary booleans, missing evidence items, supported expected event types, release gate status vocabulary from `goal-progress-ledger.v1`, copy-only next action, and release-ready safety flags.

## Fixture Coverage

The invalid fixture and test coverage matches the requested Task 1 categories:

- Unsafe refs: absolute path fixture, encoded traversal test, raw terminal `..` fixture, nested raw `..` test, and managed artifact terminal `..` test.
- Duplicate task id: `goal-runbook.duplicate-task-id.invalid.v1.json`.
- Empty acceptance: `goal-runbook.empty-acceptance.invalid.v1.json`.
- Unknown role: `goal-prompt-pack.unknown-role.invalid.v1.json` and a runbook role mutation in the test.
- Unknown event type: `goal-runbook.unknown-event-type.invalid.v1.json` and `goal-closeout-report.unknown-event-type.invalid.v1.json`.
- Copy-only prompt missing: `goal-next-action.copy-only-prompt-missing.invalid.v1.json`.
- Dry-run/confirm drift: `goal-prompt-pack.dry-run-confirm-inconsistent.invalid.v1.json`.
- Main-verifier registration through the wrong event route: covered by the v19 test that mutates the valid prompt pack and expects `symphony goal gate --gate main-verification`.

The earlier unsafe-ref blocker for terminal parent-directory segments is fixed in the current branch. The current validator rejects `docs/plans/..`, `docs/plans/subdir/..`, `artifacts/run/..`, encoded traversal, absolute paths, and `file://` refs.

## Boundary Checks

- No CLI implementation was added.
- No API route was added.
- No Workbench panel or browser execution surface was added.
- No managed runbook state writer was added.
- No dependency or lockfile change was added.
- `src/symphony/goal-event-contracts.js`, `tests/v18-goal-event-contracts.test.js`, and `src/symphony/goal-progress-ledger.js` are unchanged relative to `main`.
- The v19 validator imports v18 `GOAL_EVENT_TYPES` and goal-progress release gate vocabulary instead of redefining incompatible event or ledger statuses.
- Full test output still includes passing v18 event log, goal update plan, event journal, goal review, goal gate, and event-backed ledger suites.

## Additional Probe

Command:

```bash
node --input-type=module - <<'NODE'
import { readFileSync } from 'node:fs';
import {
  validateGoalRunbookContract,
  validateGoalNextActionContract,
  validateGoalPromptPackContract,
  validateGoalCloseoutReportContract
} from './src/symphony/goal-runbook-contracts.js';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const runbook = read('fixtures/contracts/goal-runbook.valid.v1.json');
for (const ref of [
  'docs/plans/..',
  'docs/plans/subdir/..',
  'artifacts/run/..',
  'docs/plans/%2e%2e/secret.md',
  '/Users/example/secret.md',
  'file:///tmp/evidence.md'
]) {
  const copy = structuredClone(runbook);
  copy.baseline.evidenceRef = ref;
  const result = validateGoalRunbookContract(copy);
  console.log(`${ref}: ${result.ok ? 'ACCEPTED' : result.errors[0]}`);
}
for (const [label, path, validate] of [
  ['duplicate-task-id', 'fixtures/contracts/goal-runbook.duplicate-task-id.invalid.v1.json', validateGoalRunbookContract],
  ['empty-acceptance', 'fixtures/contracts/goal-runbook.empty-acceptance.invalid.v1.json', validateGoalRunbookContract],
  ['unknown-event-type', 'fixtures/contracts/goal-runbook.unknown-event-type.invalid.v1.json', validateGoalRunbookContract],
  ['unknown-role', 'fixtures/contracts/goal-prompt-pack.unknown-role.invalid.v1.json', validateGoalPromptPackContract],
  ['copy-only-prompt-missing', 'fixtures/contracts/goal-next-action.copy-only-prompt-missing.invalid.v1.json', validateGoalNextActionContract],
  ['dry-run-confirm-inconsistent', 'fixtures/contracts/goal-prompt-pack.dry-run-confirm-inconsistent.invalid.v1.json', validateGoalPromptPackContract],
  ['closeout-unknown-event-type', 'fixtures/contracts/goal-closeout-report.unknown-event-type.invalid.v1.json', validateGoalCloseoutReportContract]
]) {
  const result = validate(read(path));
  console.log(`${label}: ${result.ok ? 'ACCEPTED' : result.errors[0]}`);
}
NODE
```

Result: passed, exit code `0`.

Observed output:

```text
docs/plans/..: baseline.evidenceRef must be a controlled evidence reference
docs/plans/subdir/..: baseline.evidenceRef must be a controlled evidence reference
artifacts/run/..: baseline.evidenceRef must be a controlled evidence reference
docs/plans/%2e%2e/secret.md: baseline.evidenceRef must be a controlled evidence reference
/Users/example/secret.md: baseline.evidenceRef must be a controlled evidence reference
file:///tmp/evidence.md: baseline.evidenceRef must be a controlled evidence reference
duplicate-task-id: tasks[1].taskId must be unique
empty-acceptance: tasks[0].acceptance must be a non-empty array
unknown-event-type: tasks[0].expectedEvidence.worker must be one of goal.planned, task.planned, worker.started, worker.evidence-recorded, worker.self-check-passed, worker.self-check-failed, reviewer.review-requested, reviewer.approved, reviewer.needs-revision, reviewer.blocked, main.merged, main.verification-passed, main.verification-failed, release.gate-passed, release.gate-failed, release.evidence-recorded, release.ready-declared, blocker.opened, blocker.resolved
unknown-role: prompts[0].role must be one of worker, reviewer, main-verifier, release-manager
copy-only-prompt-missing: copyOnlyPrompt.text is required when copyOnlyPrompt.available is true
dry-run-confirm-inconsistent: prompts[0].registration.confirmRequired must be true
closeout-unknown-event-type: missing[0].expectedEvent must be one of goal.planned, task.planned, worker.started, worker.evidence-recorded, worker.self-check-passed, worker.self-check-failed, reviewer.review-requested, reviewer.approved, reviewer.needs-revision, reviewer.blocked, main.merged, main.verification-passed, main.verification-failed, release.gate-passed, release.gate-failed, release.evidence-recorded, release.ready-declared, blocker.opened, blocker.resolved
```

## Required Commands

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
tests 631
suites 105
pass 631
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3351.275208
```

Relevant suites from the full run:

```text
v18 goal-event-log.v1 and goal-update-plan.v1 contract baseline
tests 7
pass 7

v18 append-only event journal writer
tests 8
pass 8

v18 goal event resolver to goal-progress-ledger.v1
tests 5
pass 5

v18 symphony goal gate CLI
tests 5
pass 5

v18 symphony goal review CLI
tests 5
pass 5

v18 symphony goal update CLI
tests 5
pass 5

v19 goal runbook, next action, prompt pack, and closeout contracts
tests 9
pass 9
```

### `git diff --check`

Result: passed, exit code `0`.

Observed output: no output.

## Approval Scope

APPROVED for v19 Task 1 contract baseline only: contract docs, fixtures, `src/symphony/goal-runbook-contracts.js`, and `tests/v19-goal-runbook-contracts.test.js`. This approval does not verify `main`, does not approve release readiness, and does not approve future CLI, API, Workbench, managed state, resolver, prompt generator, or closeout implementation work.
