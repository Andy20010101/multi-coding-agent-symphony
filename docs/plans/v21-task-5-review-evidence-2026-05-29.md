# v21 task-5 independent review evidence

Goal id: `v21-goal-event-registration-workbench`
Task id: `task-5`
Branch reviewed: `v21-task-5-event-registration-tests-and-docs`
Reviewer: `v21 task-5 independent reviewer subagent`
Date reviewed: 2026-05-31
Verdict: `approved`

## Scope Checked

- Read the v21 task-5 runbook scope in `docs/plans/workbench-v20-v28-goal-runbooks/v21_workbench-goal-event-registration_goal_runbook_latest.md`.
- Read the managed runbook fixture task-5 acceptance in `fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json`.
- Read worker evidence at `docs/plans/v21-task-5-worker-evidence-2026-05-29.md`.
- Reviewed the task-5 commit diff `cb9ed12..HEAD`.
- Checked the latest goal/runbook/next-action surface and confirmed task-5 is surfaced as a reviewer action from `goal-next-action.v1`, not as a v8 top-level action list.

## Files And Diff Checked

Task-5 commit diff:

```text
A	docs/plans/v21-task-5-worker-evidence-2026-05-29.md
M	docs/symphony-product-contracts.md
M	docs/workbench-operator-guide.md
M	tests/v21-goal-plan-preview-api.test.js
```

Reviewed areas:

- `tests/v21-goal-plan-preview-api.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v21-task-5-worker-evidence-2026-05-29.md`
- `fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json`
- v21 runbook task-5 instructions

## Findings

No blocking findings.

The test additions cover the requested Workbench event registration paths through the HTTP preview/confirm routes, not only lower-level CLI functions:

- worker event success/failure registration via controlled `command=update`, including `worker.self-check-passed` and `worker.self-check-failed`;
- reviewer `approved` and `needs-revision` registration via controlled `command=review`;
- reviewer/worker actor conflict rejection with a no-write snapshot assertion;
- main verification `passed` and `failed` registration via controlled `command=gate&gate=main-verification`;
- missing main-verification task rejection with a no-write snapshot assertion;
- existing v21 route tests still cover unsupported preview/confirm commands, unknown fields, unsafe goal refs, mismatched plan hash, and invalid evidence refs without appending.

The docs describe Workbench as using controlled backend `goal update/review/gate` dry-run and confirm paths, with refreshed backend `goal-progress-ledger.v1`, `goal-event-log.v1`, and `goal-next-action.v1` as the displayed state source. I did not find wording that allows the frontend to create approval, main verification, release readiness, or task completion from filenames, branches, commit messages, copied commands, or prompt text.

## Command Results

### `pnpm test tests/v21-goal-plan-preview-api.test.js`

Exit code: 0

```text
tests 11
suites 1
pass 11
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 195.406625
```

### `git diff --check`

Exit code: 0

```text
<no output>
```

### `pnpm check`

Exit code: 0

```text
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

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

### `pnpm test`

Exit code: 0

```text
tests 689
suites 110
pass 689
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3657.80375
```

### `pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Exit code: 0

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 4
summary.releaseReady: false
task-5.status: in-progress
task-5.workerEvidenceRef: docs/plans/v21-task-5-worker-evidence-2026-05-29.md
task-5.reviewEvidenceRef: null
task-5.mainVerificationRef: null
```

### `pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json`

Exit code: 0

```text
contractName: goal-next-action.v1
status: action-required
next.taskId: task-5
next.role: reviewer
next.phase: review
reason: Worker evidence exists for task-5 but reviewer verdict is missing.
afterCompletion.registerWith: symphony goal review
afterCompletion.allowedEvents: reviewer.approved, reviewer.needs-revision
```

## Boundary Notes

- This review did not implement product code.
- This review did not register a goal review event.
- No generic shell runner, permission system, safety framework, goal framework, or artifact framework was added by task-5.
- I found no worker self-approval path in the task-5 changes; the route tests assert worker/reviewer actor conflict rejection.
- Passing tests and build commands are command evidence only. They do not declare task-5 main verification or release readiness.

## Post-release-ready revision review: runbook release gates

Revision commit reviewed: `9d9ff9b22237841cf534ba4f51494ff2bdf48b0f` (`Respect runbook release gates for v21 closeout`)
Reviewer: `independent v21 reviewer subagent`
Date reviewed: 2026-05-31
Verdict: `approved`

### Scope Checked

- Reviewed the commit diff for `src/symphony/goal-next-action-resolver.js`, `src/symphony/goal-closeout-report.js`, `tests/v19-goal-next-action-resolver.test.js`, and `tests/v21-release-ready-boundary.test.js`.
- Read `docs/plans/v21-release-evidence-2026-05-29.md`, including the revision notes and registered v21 release gates.
- Checked `fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json`: v21 lists eight release gates and does not list `release.tag-evidence`.
- Checked `fixtures/contracts/goal-runbook.valid.v1.json`: the v19 fixture still lists `release.tag-evidence`.
- Checked the current v21 `goal-status`, `goal next`, and `goal closeout` outputs without registering any events.

### Findings

No blocking findings.

The resolver and closeout paths now use `runbook.releaseGates` for release completion. That matches the v21 boundary: v21 can close out with the eight listed release gates plus explicit `release.ready`, while `tagEvidence` remains `unknown`.

Tag evidence is still required when the runbook lists it. The v19 fixture includes `release.tag-evidence`; the updated v19 resolver test completes only after every listed release gate, including tag evidence, has a passed event. The v19 closeout CLI tests also keep closeout not-ready and report a `tagEvidence` release-gate gap when tag evidence is missing.

I did not find readiness being inferred from branch names, file names, command text, or frontend state in this revision. The current v21 CLI outputs are driven by the event ledger and runbook gate list.

### Command Results

`git diff --check`

- Exit code: 0
- Output: no whitespace errors reported.

`pnpm test -- tests/v19-goal-next-action-resolver.test.js tests/v19-goal-next-cli.test.js tests/v21-release-ready-boundary.test.js`

- Exit code: 0
- Result: `tests 21`, `suites 3`, `pass 21`, `fail 0`.

`pnpm check`

- Exit code: 0
- Output: `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`

`pnpm test`

- Exit code: 0
- Result: `tests 691`, `suites 111`, `pass 691`, `fail 0`, `duration_ms 3703.813042`.

`pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

- Exit code: 0
- Observed: `summary.releaseReady: true`; `summary.releaseReadySource: goal-event-log.v1:evt_b98db420aa0e67bd`; all five tasks `release-ready`; `tagEvidence: unknown`.

`pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json`

- Exit code: 0
- Observed: `status: complete`; `next: null`; reason says `release.ready-declared` is recorded and all runbook release gates passed; `copyOnlyCommands: []`.

`pnpm --silent symphony goal closeout --goal v21-goal-event-registration-workbench --json`

- Exit code: 0
- Observed: `summary.releaseReady: true`; `missing: []`; all eight v21 release gates passed; `tagEvidence: unknown`.

### Boundary Notes

- This review did not implement product code.
- This review did not register goal review events or release events.
- This review does not require `release.tag-evidence` for v21 because the v21 runbook does not list that gate.
