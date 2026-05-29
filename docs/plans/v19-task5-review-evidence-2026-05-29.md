# v19 Task 5 independent review evidence

Date: 2026-05-29
Branch reviewed: `v19-task5-goal-next-cli`
Base: `main`
Verdict: APPROVED

## Scope reviewed

This review checked the current branch diff against `main` and the Task 5 behavior directly. The worker evidence was used as an input, not as proof.

Required context read:

- `docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md`
- `docs/plans/v19-task5-worker-evidence-2026-05-29.md`
- `docs/plans/v19-task1-worker-evidence-2026-05-29.md`
- `docs/plans/v19-task1-review-evidence-2026-05-29.md`
- `docs/plans/v19-task1-main-verification-evidence-2026-05-29.md`
- `docs/plans/v19-task2-worker-evidence-2026-05-29.md`
- `docs/plans/v19-task2-review-evidence-2026-05-29.md`
- `docs/plans/v19-task2-main-verification-evidence-2026-05-29.md`
- `docs/plans/v19-task3-worker-evidence-2026-05-29.md`
- `docs/plans/v19-task3-review-evidence-2026-05-29.md`
- `docs/plans/v19-task3-main-verification-evidence-2026-05-29.md`
- `docs/plans/v19-task4-worker-evidence-2026-05-29.md`
- `docs/plans/v19-task4-review-evidence-2026-05-29.md`
- `docs/plans/v19-task4-main-verification-evidence-2026-05-29.md`

Implementation files reviewed:

- `scripts/symphony.js`
- `src/symphony/goal-runbook-contracts.js`
- `src/symphony/goal-runbook-registry.js`
- `src/symphony/goal-event-contracts.js`
- `src/symphony/goal-event-journal.js`
- `src/symphony/goal-progress-ledger.js`
- `src/symphony/goal-next-action-resolver.js`
- `src/symphony/goal-prompt-pack.js`
- `src/symphony/goal-runbook-context.js`
- `src/symphony/goal-closeout-report.js`
- `src/symphony/stage.js`
- `tests/v19-goal-next-action-resolver.test.js`
- `tests/v19-goal-prompt-pack.test.js`
- `tests/v19-goal-next-cli.test.js`
- `fixtures/contracts/goal-runbook.valid.v1.json`

## Diff reviewed

`git diff --name-status main...HEAD` before writing this review evidence:

```text
A	docs/plans/v19-task5-worker-evidence-2026-05-29.md
M	scripts/symphony.js
A	src/symphony/goal-closeout-report.js
M	src/symphony/goal-next-action-resolver.js
M	src/symphony/goal-progress-ledger.js
A	src/symphony/goal-runbook-context.js
A	tests/v19-goal-next-cli.test.js
```

The Task 5 diff is inside the planned CLI integration scope. It does not include Workbench execution, browser terminal controls, model invocation, release gate execution, automatic event registration, merge automation, or tag automation.

## Review checks

Goal next reads the active runbook path and event-backed state. `scripts/symphony.js` dispatches `symphony goal next` to `buildGoalNextAction`. The resolver uses `loadGoalRunbookContext`, `readGoalEventLogForRunbook`, and `buildGoalLedgerForRunbook` before calling `resolveGoalNextAction`. It does not infer completion from branch names, file names, command text, or prompt text.

The controlled `v19-fixture` path is limited to the known runbook fixture. The smoke command returned `goal-next-action.v1`, `status: action-required`, `next.taskId: task-1`, `next.role: worker`, and no evidence refs. That matches a runbook with no registered events.

Goal closeout reads the same runbook/event/ledger context and reports missing evidence and gates. `summary.releaseReady` stays `false` unless worker evidence, reviewer approval, main verification, all release gates, and explicit ledger release readiness are present. The fixture output lists worker, review, main-verification, and release-gate gaps instead of declaring readiness.

`symphony next` preserves both paths. With no active managed goal in this workspace, `pnpm symphony next --json` returned `nextSource: stage-summary`, `activeGoal: null`, `goalNextAction: null`, and the existing Stage next action `symphony stage activate v14-stage-kernel-refactor`. A separate temporary-state probe registered an active runbook and returned `nextSource: goal-next-action`, nested `goal-next-action.v1`, and a compact Stage summary.

JSON contract names are stable on the reviewed paths. `goal next` returns `goal-next-action.v1`; `goal closeout` returns `goal-closeout-report.v1`; `symphony next --json` remains `symphony.product-summary` and nests `goal-next-action.v1` only on the active-goal path.

Read-only boundaries hold. The new parser paths reject write-flow flags and output-file flags. The implementation prints commands and prompt command hints, but does not execute prompts, run release gates, call models, write release evidence docs, or append events.

One operational note: the required `pnpm symphony ... --json` smoke commands print the normal pnpm script banner before the JSON body. The JSON object emitted by `node scripts/symphony.js ... --json` is the stable contract body. This is package-manager stdout behavior, not a Task 5 contract drift.

## Commands run

### `pnpm check`

Exit code: `0`

Result: passed.

Observed output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: `0`

Result: passed.

Observed final summary:

```text
tests 659
suites 109
pass 659
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4612.680042
```

Relevant v19 suites in the full run:

```text
v19 event-aware goal-next-action.v1 resolver: pass 12
v19 goal next, goal closeout, and symphony next CLI: pass 6
v19 goal prompt pack generator and CLI: pass 5
v19 goal runbook, next action, prompt pack, and closeout contracts: pass 9
v19 symphony goal init CLI: pass 5
v19 goal progress template bootstrap: pass 3
```

### `pnpm symphony goal next --goal v19-fixture --json`

Exit code: `0`

Result: passed.

Observed output shape:

```text
contractName: goal-next-action.v1
contractVersion: 1
goalId: v19-fixture
status: action-required
next.taskId: task-1
next.role: worker
next.phase: implement
next.reason: No explicit worker evidence is recorded for task-1.
evidenceState.workerEvidenceRef: null
evidenceState.reviewEvidenceRef: null
evidenceState.mainVerificationRef: null
copyOnlyPrompt.available: false
copyOnlyCommands: pnpm check; pnpm test; git diff --check
afterCompletion.registerWith: symphony goal update
afterCompletion.allowedEvents: worker.evidence-recorded; worker.self-check-passed; worker.self-check-failed
safety.readOnly: true
safety.copyOnly: true
safety.modelInvocationAvailable: false
```

### `pnpm symphony goal closeout --goal v19-fixture --json`

Exit code: `0`

Result: passed.

Observed output shape:

```text
contractName: goal-closeout-report.v1
contractVersion: 1
goalId: v19-fixture
generatedAt: 2026-05-29T08:08:09.156Z
summary.totalTasks: 2
summary.workerEvidenceComplete: false
summary.reviewEvidenceComplete: false
summary.mainVerificationComplete: false
summary.releaseReady: false
releaseGates.pnpmCheck: unknown
releaseGates.pnpmTest: unknown
releaseGates.workbenchBuild: unknown
releaseGates.mutationGate: unknown
releaseGates.auditHigh: unknown
releaseGates.diffCheck: unknown
releaseGates.mcasDoctor: unknown
releaseGates.docsUpdated: unknown
releaseGates.tagEvidence: missing
nextAction: symphony goal next --goal v19-fixture
safety.releaseReadyRequiresEvidence: true
```

Missing items observed:

```text
worker-evidence: task-1 expects worker.evidence-recorded
review-evidence: task-1 expects reviewer.approved
main-verification: task-1 expects main.verification-passed
worker-evidence: task-2 expects worker.evidence-recorded
review-evidence: task-2 expects reviewer.approved
main-verification: task-2 expects main.verification-passed
release-gate: pnpmCheck unknown
release-gate: pnpmTest unknown
release-gate: workbenchBuild unknown
release-gate: mutationGate unknown
release-gate: auditHigh unknown
release-gate: diffCheck unknown
release-gate: mcasDoctor unknown
release-gate: docsUpdated unknown
release-gate: tagEvidence missing
```

### `pnpm symphony next --json`

Exit code: `0`

Result: passed.

Current workspace had no active managed goal pointer. Observed fields:

```text
contractName: symphony.product-summary
contractVersion: 1
command: symphony next
pipeline: next
safetyMode: read-only
projectWrites: false
runtimeWrites: false
externalCalls: false
destructiveWrites: false
status: available
nextSource: stage-summary
activeGoal: null
goalNextAction: null
stageId: v14-stage-kernel-refactor
nextAction: symphony stage activate v14-stage-kernel-refactor
```

### `git diff --check`

Exit code: `0`

Result: passed.

Observed output: no output.

## Additional probes

### Active-goal priority probe

Command:

```bash
node --input-type=module <<'NODE'
...register temporary managed runbook, then run symphony next --state-dir <temp> --json...
NODE
```

Exit code: `0`

Observed output:

```json
{
  "dryExit": 0,
  "confirmExit": 0,
  "nextExit": 0,
  "nextSource": "goal-next-action",
  "activeGoal": "v19-review-active",
  "contractName": "goal-next-action.v1",
  "nextTask": "task-1",
  "nextRole": "worker",
  "stageSummaryNextAction": "symphony stage activate v14-stage-kernel-refactor"
}
```

### Read-only flag rejection probes

Command:

```bash
node scripts/symphony.js goal next --goal v19-fixture --confirm
```

Exit code: `64`

Observed output:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal next is read-only and does not accept write-flow flags"
}
```

Command:

```bash
node scripts/symphony.js goal closeout --goal v19-fixture --output /tmp/closeout.json
```

Exit code: `64`

Observed output:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal closeout does not write files; redirect stdout if you need a file"
}
```

## Blockers

None.

## Verdict

APPROVED

