# v21 task-5 main verification evidence

Goal id: `v21-goal-event-registration-workbench`
Task id: `task-5`
Task title: `Event registration tests and docs`
Revision commit checked: `9d9ff9b22237841cf534ba4f51494ff2bdf48b0f`
Verification date: 2026-05-31
Latest gate recommendation: `passed`

## Post-release-ready Revision Verification

This pass verified the task-5 revision after independent reviewer approval. The verifier did not register `main.verification-passed`, `main.verification-failed`, `release.ready-declared`, or any other goal gate event.

The revision behavior is partially correct:

- The required code checks, full tests, Workbench build, and whitespace check pass.
- The v21 boundary tests pass: v21 closeout can complete without `release.tag-evidence` when all release gates listed in the v21 runbook pass and `release.ready-declared` is explicit.
- Runbooks that include `release.tag-evidence` still require it; the v19 resolver and closeout tests passed.
- The managed v21 runbook lists eight release gates and does not list `release.tag-evidence`.

The live goal state has a blocking discrepancy after the worker revision and reviewer approval:

- `goal closeout` reports `summary.mainVerificationComplete: false`, `summary.releaseReady: false`, and a missing `main.verification-passed` item for task-5.
- `goal next` does not route back to `task-5` main verification. It reports `next.taskId: release`, `next.role: release-manager`, `next.phase: release-prep`, with the reason `All runbook tasks are main-verified and release gates are passed, but release.ready-declared is missing.`
- `goal-status` still reports `summary.releaseReady: true` from an earlier `release.ready-declared` event while task-5 is currently only `status: approved` after the revision.

Because the next-action surface and closeout surface disagree about the required post-review main-verification step, this verifier cannot recommend registering the main-verification gate as passed.

## Command Results

### `git rev-parse HEAD`

Exit code: 0

```text
9d9ff9b22237841cf534ba4f51494ff2bdf48b0f
```

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
tests 691
suites 111
pass 691
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4025.642208
```

The full suite included:

- `v21 Workbench goal event dry-run plan preview API`: 11 passing tests.
- `v21 release-ready boundary without release.tag-evidence`: 2 passing tests.

### `pnpm workbench:build`

Exit code: 0

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                   0.42 kB gzip 0.27 kB
src/symphony/workbench-static/assets/index-BspYnYKl.css   11.24 kB gzip 2.57 kB
src/symphony/workbench-static/assets/index-DMa5Vmdp.js   689.08 kB gzip 128.85 kB
built in 142ms
```

The command printed Node WASI experimental warnings only.

### `git diff --check`

Exit code: 0

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Exit code: 0

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 5
summary.releaseReady: true
summary.releaseReadySource: goal-event-log.v1:evt_b98db420aa0e67bd
task-5.status: approved
task-5.statusSource: goal-event-log.v1:evt_d771262c501c60a8
task-5.workerEvidenceRef: docs/plans/v21-release-evidence-2026-05-29.md
task-5.reviewEvidenceRef: docs/plans/v21-task-5-review-evidence-2026-05-29.md
task-5.reviewVerdict: APPROVED
task-5.mainVerificationRef: docs/plans/v21-task-5-main-verification-evidence-2026-05-29.md
releaseGates.pnpmCheck: passed
releaseGates.pnpmTest: passed
releaseGates.workbenchBuild: passed
releaseGates.mutationGate: passed
releaseGates.auditHigh: passed
releaseGates.diffCheck: passed
releaseGates.mcasDoctor: passed
releaseGates.docsUpdated: passed
releaseGates.tagEvidence: unknown
```

### `pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json`

Exit code: 0

```text
contractName: goal-next-action.v1
goalId: v21-goal-event-registration-workbench
status: action-required
next.taskId: release
next.role: release-manager
next.phase: release-prep
reason: All runbook tasks are main-verified and release gates are passed, but release.ready-declared is missing.
afterCompletion.registerWith: symphony goal gate
afterCompletion.allowedEvents: release.ready-declared
copyOnlyCommands: symphony goal-status --goal v21-goal-event-registration-workbench --json
```

This is not acceptable for the current revision state because task-5 has newer worker and reviewer events after the earlier task-5 main verification event, and `goal closeout` reports task-5 main verification missing.

### `pnpm --silent symphony goal closeout --goal v21-goal-event-registration-workbench --json`

Exit code: 0

```text
contractName: goal-closeout-report.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.workerEvidenceComplete: true
summary.reviewEvidenceComplete: true
summary.mainVerificationComplete: false
summary.releaseReady: false
summary.releaseReadySource: null
missing[0].kind: main-verification
missing[0].taskId: task-5
missing[0].expectedEvent: main.verification-passed
releaseGates.pnpmCheck: passed
releaseGates.pnpmTest: passed
releaseGates.workbenchBuild: passed
releaseGates.mutationGate: passed
releaseGates.auditHigh: passed
releaseGates.diffCheck: passed
releaseGates.mcasDoctor: passed
releaseGates.docsUpdated: passed
releaseGates.tagEvidence: unknown
```

### `pnpm test -- tests/v19-goal-next-action-resolver.test.js tests/v19-goal-next-cli.test.js tests/v21-release-ready-boundary.test.js`

Exit code: 0

```text
tests 21
suites 3
pass 21
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 108.46475
```

This targeted run verified:

- v21 `goal next` completes when listed release gates pass and explicit `release.ready-declared` exists, without `release.tag-evidence`.
- v21 `goal closeout` reports `releaseReady: true`, `missing: []`, and `tagEvidence: unknown` when the v21 runbook omits that gate.
- v19 coverage still includes `release.tag-evidence` and keeps closeout not ready until required listed gates and explicit `release.ready-declared` evidence exist.

## Release Gate Boundary

The v21 managed runbook release gates are:

```text
release.pnpm-check
release.pnpm-test
release.workbench-build
release.mutation-gate
release.audit-high
release.diff-check
release.mcas-doctor
release.docs-updated
```

`release.tag-evidence` is not listed for v21 and was not required by this verification. The v19 managed runbook still lists `release.tag-evidence`, and the targeted v19 tests passed.

## Recommendation

Gate recommendation: `failed`.

Do not register task-5 `main.verification-passed` from this evidence. The release-ready boundary tests pass, but the live `goal next` and `goal closeout` surfaces disagree about the post-revision task-5 main-verification requirement.

## Retry Main Verification

Revision commit checked: `9d9ff9b22237841cf534ba4f51494ff2bdf48b0f`
Retry verification date: 2026-05-31
Gate recommendation: `passed`

This retry verified the same revision after the failed main-verification gate was registered as `evt_54e49b1db6812f4e`. This verifier did not register `main.verification-passed`, `main.verification-failed`, `release.ready-declared`, or any other goal event.

Reviewer approval is present for the revision in `docs/plans/v21-task-5-review-evidence-2026-05-29.md`: the post-release-ready revision review records `Verdict: approved` for commit `9d9ff9b22237841cf534ba4f51494ff2bdf48b0f`.

The earlier blocker is resolved. `goal next` now routes to `task-5` / `main-verifier` / `main-verification` with reason `Latest main verification failed for task-5.` `goal closeout` still reports `releaseReady: false`, but the only missing item is the expected pending `main.verification-passed` event for task-5. No unexpected closeout blocker was observed.

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
tests 691
suites 111
pass 691
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3628.876875
```

The full suite included `v21 Workbench goal event dry-run plan preview API` with 11 passing tests and `v21 release-ready boundary without release.tag-evidence` with 2 passing tests.

### `pnpm workbench:build`

Exit code: 0

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                   0.42 kB gzip 0.27 kB
src/symphony/workbench-static/assets/index-BspYnYKl.css   11.24 kB gzip 2.57 kB
src/symphony/workbench-static/assets/index-DMa5Vmdp.js   689.08 kB gzip 128.85 kB
built in 142ms
```

The command printed Node WASI experimental warnings only.

### `pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Exit code: 0

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 4
summary.releaseReady: true
summary.releaseReadySource: goal-event-log.v1:evt_b98db420aa0e67bd
task-5.status: unknown
task-5.statusSource: goal-event-log.v1:evt_54e49b1db6812f4e
task-5.workerEvidenceRef: docs/plans/v21-release-evidence-2026-05-29.md
task-5.reviewEvidenceRef: docs/plans/v21-task-5-review-evidence-2026-05-29.md
task-5.reviewVerdict: APPROVED
task-5.mainVerificationRef: docs/plans/v21-task-5-main-verification-evidence-2026-05-29.md
releaseGates.pnpmCheck: passed
releaseGates.pnpmTest: passed
releaseGates.workbenchBuild: passed
releaseGates.mutationGate: passed
releaseGates.auditHigh: passed
releaseGates.diffCheck: passed
releaseGates.mcasDoctor: passed
releaseGates.docsUpdated: passed
releaseGates.tagEvidence: unknown
```

### `pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json`

Exit code: 0

```text
contractName: goal-next-action.v1
goalId: v21-goal-event-registration-workbench
status: action-required
next.taskId: task-5
next.role: main-verifier
next.phase: main-verification
reason: Latest main verification failed for task-5.
afterCompletion.registerWith: symphony goal gate --gate main-verification
afterCompletion.allowedEvents: main.verification-passed, main.verification-failed
```

### `pnpm --silent symphony goal closeout --goal v21-goal-event-registration-workbench --json`

Exit code: 0

```text
contractName: goal-closeout-report.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.workerEvidenceComplete: true
summary.reviewEvidenceComplete: true
summary.mainVerificationComplete: false
summary.releaseReady: false
summary.releaseReadySource: null
missing[0].kind: main-verification
missing[0].taskId: task-5
missing[0].expectedEvent: main.verification-passed
releaseGates.pnpmCheck: passed
releaseGates.pnpmTest: passed
releaseGates.workbenchBuild: passed
releaseGates.mutationGate: passed
releaseGates.auditHigh: passed
releaseGates.diffCheck: passed
releaseGates.mcasDoctor: passed
releaseGates.docsUpdated: passed
releaseGates.tagEvidence: unknown
```

### `pnpm test -- tests/v19-goal-next-action-resolver.test.js tests/v19-goal-next-cli.test.js tests/v21-release-ready-boundary.test.js`

Exit code: 0

```text
tests 21
suites 3
pass 21
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 107.487667
```

This focused run verified that v21 can complete when the runbook-listed release gates pass and `release.ready-declared` exists without requiring `release.tag-evidence`, while v19 still keeps the release tag gate in its runbook boundary.

### `git diff --check`

Run after this retry section was appended.

Exit code: 0

```text
<no output>
```

## Retry Recommendation

Gate recommendation: `passed`.

Registering `main.verification-passed` for task-5 is recommended. All requested technical checks passed, reviewer approval is present, the runbook boundary around `release.tag-evidence` is preserved, and the only closeout gap is the expected pending task-5 main-verification event.
