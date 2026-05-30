# v21 task-5 main verification evidence

Goal id: `v21-goal-event-registration-workbench`  
Task id: `task-5`  
Task title: `Event registration tests and docs`  
Branch checked: `v21-task-5-event-registration-tests-and-docs`  
Commit checked: `7d8c4cb4eb38624cc2c4a4345415b64c91983ae3`  
Verification date: 2026-05-31  
Gate recommendation: `passed`

## Reviewer approval check

Explicit reviewer approval evidence exists before this verification:

- `docs/plans/v21-task-5-review-evidence-2026-05-29.md` records `Verdict: approved`.
- `pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json` reports task-5 `status: approved`, `reviewVerdict: APPROVED`, and `reviewEvidenceRef: docs/plans/v21-task-5-review-evidence-2026-05-29.md`.
- `pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json` reports task-5 `role: main-verifier` and `phase: main-verification`.

No main-verification event or release-ready event was registered by this verifier.

## Scope checked

- Read v21 runbook task-5 scope in `docs/plans/workbench-v20-v28-goal-runbooks/v21_workbench-goal-event-registration_goal_runbook_latest.md`.
- Read managed runbook fixture acceptance in `fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json`.
- Read worker evidence at `docs/plans/v21-task-5-worker-evidence-2026-05-29.md`.
- Read review evidence at `docs/plans/v21-task-5-review-evidence-2026-05-29.md`.
- Checked task-5 tests in `tests/v21-goal-plan-preview-api.test.js`.
- Checked docs in `docs/workbench-operator-guide.md` and `docs/symphony-product-contracts.md`.
- Checked current goal-status and next-action surfaces.

## Acceptance verification

Task-5 acceptance is met on the current working tree.

- Worker event success/failure coverage exists in `tests/v21-goal-plan-preview-api.test.js`: `worker.self-check-passed` and `worker.self-check-failed` are confirmed through the Workbench preview/confirm API, and the refreshed contracts are asserted.
- Review verdict coverage exists for `reviewer.approved` and `reviewer.needs-revision`, including rejection of worker self-approval with a no-write snapshot check.
- Main verification gate coverage exists for `main.verification-passed` and `main.verification-failed`, including rejection of incomplete main-verification gate input with a no-write snapshot check.
- Docs state that Workbench uses controlled backend `goal update/review/gate` dry-run and confirm paths, appends managed goal events on confirm, and displays refreshed backend `goal-progress-ledger.v1`, `goal-event-log.v1`, and `goal-next-action.v1`.
- Docs state that Workbench does not create frontend status and must not infer task completion, review approval, main verification, or release readiness from errors, file names, branch names, commit messages, copy-only commands, prompt text, task ids, titles, or paths.

## Boundary notes

- Latest goal/runbook/next-action remains the active surface. `goal next` reports task-5 main-verification as the next action.
- No v8 top-level action list was introduced for this task.
- No generic shell runner, safety framework, permission system, goal framework, or artifact framework was added by this verification.
- No status or release inference from branch, file, commit, prompt, command text, or frontend heuristics was accepted as evidence.
- Worker self-approval remains rejected by route coverage.
- This verifier did not do worker implementation, did not issue reviewer approval, did not register the main-verification gate, and did not declare release readiness.

## Command results

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `git diff --check`

Exit code: 0

```text
<no output>
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:93446) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:93446) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:93446) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-BspYnYKl.css   11.24 kB │ gzip:   2.57 kB
src/symphony/workbench-static/assets/index-DMa5Vmdp.js   689.08 kB │ gzip: 128.85 kB

✓ built in 152ms
```

### `pnpm test`

Exit code: 0

```text
ℹ tests 689
ℹ suites 110
ℹ pass 689
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3666.088416
```

The full test run included `v21 Workbench goal event dry-run plan preview API` with 11 passing tests.

### `pnpm test tests/v21-goal-plan-preview-api.test.js`

Exit code: 0

```text
▶ v21 Workbench goal event dry-run plan preview API
  ✔ serves a latest goal update dry-run preview with plan hash and event summary without writing state (22.923459ms)
  ✔ serves review and gate dry-run previews only through constrained command parameters (7.799167ms)
  ✔ accepts controlled repo-doc and managed artifact evidence refs in preview plans (5.293583ms)
  ✔ returns a clear error envelope for uncontrolled preview evidence refs without appending (6.009584ms)
  ✔ rejects uncontrolled confirm evidence refs before appending (6.872958ms)
  ✔ rejects arbitrary commands, confirm inputs, unknown parameters, and unsafe goal refs safely (4.6165ms)
  ✔ confirms a matching update plan hash, appends one event, and returns refreshed goal state (5.465ms)
  ✔ confirms controlled worker success and failure events without frontend-created status (6.904958ms)
  ✔ confirms review approved and needs-revision verdicts and rejects worker self-approval (10.667208ms)
  ✔ confirms main verification passed and failed gates and rejects incomplete gate input (7.86125ms)
  ✔ rejects mismatched plan hashes, unsupported confirm commands, unknown fields, and unsafe goal refs without appending (4.804208ms)
✔ v21 Workbench goal event dry-run plan preview API (89.803292ms)
ℹ tests 11
ℹ suites 1
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 138.164792
```

### `pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Exit code: 0

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 5
summary.releaseReady: false
summary.releaseReadySource: null
task-5.status: approved
task-5.statusSource: goal-event-log.v1:evt_a0b73f715e269c05
task-5.workerEvidenceRef: docs/plans/v21-task-5-worker-evidence-2026-05-29.md
task-5.reviewEvidenceRef: docs/plans/v21-task-5-review-evidence-2026-05-29.md
task-5.reviewVerdict: APPROVED
task-5.mainVerificationRef: null
releaseGates.pnpmCheck: unknown
releaseGates.pnpmTest: unknown
releaseGates.workbenchBuild: unknown
releaseGates.mutationGate: unknown
releaseGates.auditHigh: unknown
releaseGates.diffCheck: unknown
releaseGates.mcasDoctor: unknown
releaseGates.docsUpdated: unknown
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
reason: Reviewer approved task-5 but main verification is missing.
afterCompletion.registerWith: symphony goal gate --gate main-verification
afterCompletion.allowedEvents: main.verification-passed, main.verification-failed
```

### `git status --short && git diff --name-status`

Exit code: 0

```text
?? docs/plans/v21-task-5-review-evidence-2026-05-29.md
```

After writing this evidence file, the expected additional untracked file is `docs/plans/v21-task-5-main-verification-evidence-2026-05-29.md`.

## Gaps

No blocking gaps found for task-5 main verification.

Release gates remain unregistered in goal-status, which is expected for this scope. Mutation, audit, and `pnpm mcas doctor` were not run in this verification pass and were not registered as release gates.
