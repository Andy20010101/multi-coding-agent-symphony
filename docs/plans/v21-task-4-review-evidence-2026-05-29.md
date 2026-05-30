# v21 task-4 review evidence

Goal id: `v21-goal-event-registration-workbench`
Task id: `task-4`
Task title: `Evidence ref helper`
Branch reviewed: `v21-task-4-evidence-ref-helper`
Reviewer: `v21 task-4 independent reviewer subagent`
Date reviewed: 2026-05-31
Verdict: `needs-revision`

## Scope Checked

- Read task-4 scope in `docs/plans/workbench-v20-v28-goal-runbooks/v21_workbench-goal-event-registration_goal_runbook_latest.md`.
- Read worker evidence in `docs/plans/v21-task-4-worker-evidence-2026-05-29.md`.
- Reviewed task-4 commit diff `HEAD^..HEAD` and integration diff `main...HEAD`.
- Checked evidence ref helper projection, Workbench input parsing, recent ref source selection, dry-run preview path, confirm path, API error envelope behavior, and backend evidence normalization in `goal update`, `goal review`, and `goal gate`.
- Checked for generic shell runner expansion, v8 top-level action list usage, frontend status/readiness inference, and worker self-approval.

## Files and Diff Checked

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/goal-update.js`
- `src/symphony/goal-review.js`
- `src/symphony/goal-gate.js`
- `src/symphony/console.js`
- `src/symphony/goal-progress-ledger.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/workbench-api-client.test.js`
- `docs/plans/v21-task-4-worker-evidence-2026-05-29.md`
- Built static Workbench assets under `src/symphony/workbench-static/`

Diff commands checked:

```text
git diff --stat main...HEAD
28 files changed, 7074 insertions(+), 41 deletions(-)

git diff --name-status main...HEAD
Included v21 task-1 through task-4 stacked changes plus task-4 worker evidence.

git diff --stat HEAD^..HEAD
12 files changed, 1169 insertions(+), 68 deletions(-)

git diff --name-status HEAD^..HEAD
A docs/plans/v21-task-4-worker-evidence-2026-05-29.md
M frontend/workbench/src/App.jsx
M frontend/workbench/src/api/contracts.js
M frontend/workbench/src/styles/workbench.css
M src/symphony/goal-gate.js
M src/symphony/goal-review.js
M src/symphony/goal-update.js
R096 src/symphony/workbench-static/assets/index-CMCXVqRN.css -> src/symphony/workbench-static/assets/index-BspYnYKl.css
R098 src/symphony/workbench-static/assets/index-Di8mm98M.js -> src/symphony/workbench-static/assets/index-DMa5Vmdp.js
M src/symphony/workbench-static/index.html
M tests/v21-goal-plan-preview-api.test.js
M tests/workbench-api-client.test.js
```

## Command Results

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
tests 681
suites 110
pass 681
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 5793.5555
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-BspYnYKl.css   11.24 kB │ gzip:   2.57 kB
src/symphony/workbench-static/assets/index-DMa5Vmdp.js   689.08 kB │ gzip: 128.85 kB

✓ built in 141ms
```

Node printed WASI experimental warnings before and during the Vite build. The command still exited 0.

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
summary.completedTasks: 3
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1 status: main-verified
task-2 status: main-verified
task-3 status: main-verified
task-4 status: in-progress
task-4 workerEvidenceRef: docs/plans/v21-task-4-worker-evidence-2026-05-29.md
task-4 reviewEvidenceRef: null
task-5 status: planned
safety.readOnly: true
safety.copyOnly: true
```

### Evidence ref boundary probes

Exit code: 0 for both commands below:

```text
pnpm --silent symphony goal update --goal v21-goal-event-registration-workbench --task task-4 --event worker.evidence-recorded --actor codex-v21-review-probe --evidence-ref command-evidence:approved-looking-note --dry-run --json

Result: goal-update-plan.v1 dry-run accepted the evidence ref.
eventSummary equivalent in proposedEvents:
kind: command-evidence
ref: approved-looking-note
validation.status: ok
wouldAppend.writesInDryRun: false
```

```text
pnpm --silent symphony goal update --goal v21-goal-event-registration-workbench --task task-4 --event worker.evidence-recorded --actor codex-v21-review-probe --evidence-ref external-note:approved --dry-run --json

Result: goal-update-plan.v1 dry-run accepted the evidence ref.
eventSummary equivalent in proposedEvents:
kind: external-note
ref: approved
validation.status: ok
wouldAppend.writesInDryRun: false
```

Exit code: 64 for the traversal probe:

```text
pnpm --silent symphony goal update --goal v21-goal-event-registration-workbench --task task-4 --event worker.evidence-recorded --actor codex-v21-review-probe --evidence-ref ../docs/plans/evil.md --dry-run --json

{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "--evidence-ref must be a controlled docs/plans or managed artifact reference."
}
```

## Findings

### Blocker: Backend still accepts non-`docs/plans` and non-managed-artifact evidence kinds

Task-4 scope is specifically evidence ref input, recent evidence refs, and error display for `docs/plans` or managed artifact refs. The frontend parser follows that boundary: `frontend/workbench/src/App.jsx` accepts `docs/plans/`, `repo-doc:docs/plans/`, `artifact-ref:...`, `artifact:...`, `artifacts/...`, and `managed-artifact:...`, and rejects other inputs before preview.

The backend dry-run and confirm paths do not enforce the same boundary. In `src/symphony/goal-update.js`, `src/symphony/goal-review.js`, and `src/symphony/goal-gate.js`, `splitEvidenceKind` still recognizes `commit`, `command-evidence`, and `external-note`. `isUncontrolledEvidenceRef` only rejects unsafe paths and repo-doc refs outside `docs/plans/`; it does not reject the other evidence kinds. The CLI probes above show `command-evidence:approved-looking-note` and `external-note:approved` both produce valid dry-run plans.

This matters because the controlled Workbench preview endpoint calls these same builders, and `goal-progress-ledger.js` records the first evidence `ref` string as the task evidence signal. A non-file string such as `approved` can therefore satisfy evidence presence for an event even though it is neither a `docs/plans` ref nor a managed artifact ref. That conflicts with the task boundary and with the worker evidence claim that uncontrolled refs return `invalid-evidence-ref`.

Required revision:

- Align backend normalization with the Workbench helper boundary for `goal update`, `goal review`, and `goal gate`.
- Accept repo-doc evidence only when it resolves to `docs/plans/...`.
- Accept managed artifact evidence in the existing controlled managed artifact forms, preserving the `artifact-ref:<ref>` handling used by preview and confirm.
- Reject `commit:...`, `command-evidence:...`, `external-note:...`, bare non-`docs/plans` strings, traversal, encoded traversal, absolute paths, and local file refs with `invalid-evidence-ref`.
- Add API or CLI tests proving these rejected kinds fail for update, review, and gate without appending state.

## Passing Checks

- Recent evidence refs are projected from exposed runbook baseline, ledger refs, event log refs, and latest run artifact refs. The projection marks `readsEvidenceBodies`, `opensLocalFiles`, `infersStatusFromFilename`, and `infersStatusFromBranch` as false.
- Recent ref selection is an input helper. It appends refs into the evidence input and does not set task status, verdict, readiness, or gate state.
- Workbench preview and confirm still route through controlled `update`, `review`, and `gate` dry-run/confirm APIs. I did not find a generic shell runner or arbitrary command execution path in the task-4 diff.
- The frontend does not infer approval, main verification, release readiness, or task status from filenames or branch names in the helper path.
- No reviewer approval, main verification, release readiness, or goal review event was registered by this review.

## Boundary Notes

- This review does not approve task-4.
- This review did not register a `reviewer.approved` or `reviewer.needs-revision` event.
- The finding is not based on test failure. The full test suite passes, but it does not cover the non-`docs/plans`/non-artifact evidence kind acceptance.
