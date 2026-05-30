# v20 closeout evidence

Goal: `v20-goal-workbench-active-goal-surface`  
Title: `v20 Workbench Active Goal Surface`  
Baseline: `v19`  
Release-manager role: closeout evidence only. No product code was changed, no model was invoked, and no goal gate was registered.

## Workspace checked

- Repository: `/Users/andy/Documents/project/multi-coding-agent-symphony`
- Branch: `main`
- HEAD: `a5778f2c9749c0f87fefd0ed52ac9336f8d3f8b3`
- Working tree was already dirty with v20 implementation, documentation, static Workbench bundle, fixture, and evidence changes. No existing edits were reverted.

## Managed goal status before release gate registration

`pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json` exited `0`.

Observed status:

- `contractName`: `goal-progress-ledger.v1`
- `summary.totalTasks`: `5`
- `summary.completedTasks`: `5`
- `summary.blockedTasks`: `0`
- `summary.needsReviewTasks`: `0`
- `summary.needsRevisionTasks`: `0`
- `summary.releaseReady`: `false`
- `summary.releaseReadySource`: `null`
- Task statuses:
  - `task-1`: `main-verified`, review verdict `APPROVED`
  - `task-2`: `main-verified`, review verdict `APPROVED`
  - `task-3`: `main-verified`, review verdict `APPROVED`
  - `task-4`: `main-verified`, review verdict `APPROVED`
  - `task-5`: `main-verified`, review verdict `APPROVED`
- Release gates:
  - `pnpmCheck`: `unknown`
  - `pnpmTest`: `unknown`
  - `workbenchBuild`: `unknown`
  - `mutationGate`: `unknown`
  - `auditHigh`: `unknown`
  - `diffCheck`: `unknown`
  - `mcasDoctor`: `unknown`
  - `docsUpdated`: `unknown`
  - `tagEvidence`: `unknown`

`pnpm --silent symphony goal closeout --goal v20-goal-workbench-active-goal-surface --json` exited `0`.

Observed closeout state:

- `contractName`: `goal-closeout-report.v1`
- `summary.workerEvidenceComplete`: `true`
- `summary.reviewEvidenceComplete`: `true`
- `summary.mainVerificationComplete`: `true`
- `summary.releaseReady`: `false`
- `summary.releaseReadySource`: `null`
- Missing before registration:
  - `release.pnpm-check`: `unknown`
  - `release.pnpm-test`: `unknown`
  - `release.workbench-build`: `unknown`
  - `release.mutation-gate`: `unknown`
  - `release.audit-high`: `unknown`
  - `release.diff-check`: `unknown`
  - `release.mcas-doctor`: `unknown`
  - `release.docs-updated`: `unknown`
  - `release.tag-evidence`: `missing`

## Task evidence checked

- `docs/plans/v20-task-1-worker-evidence-2026-05-29.md`
- `docs/plans/v20-task-1-review-evidence-2026-05-31.md`
- `docs/plans/v20-task-1-main-verification-evidence-2026-05-31.md`
- `docs/plans/v20-task-2-worker-revision-evidence-2026-05-31.md`
- `docs/plans/v20-task-2-review-revision-evidence-2026-05-31.md`
- `docs/plans/v20-task-2-main-verification-evidence-2026-05-31.md`
- `docs/plans/v20-task-3-worker-evidence-2026-05-31.md`
- `docs/plans/v20-task-3-review-evidence-2026-05-31.md`
- `docs/plans/v20-task-3-main-verification-evidence-2026-05-31.md`
- `docs/plans/v20-task-4-worker-evidence-2026-05-31.md`
- `docs/plans/v20-task-4-review-evidence-2026-05-31.md`
- `docs/plans/v20-task-4-main-verification-evidence-2026-05-31.md`
- `docs/plans/v20-task-5-worker-evidence-2026-05-31.md`
- `docs/plans/v20-task-5-review-evidence-2026-05-31.md`
- `docs/plans/v20-task-5-main-verification-evidence-2026-05-31.md`

The managed goal status is the source used for task completion. The evidence files above were checked for the expected worker handoff, explicit reviewer approval, and main verification evidence refs. Task-2 uses the revision worker and revision review evidence listed by the managed goal status.

## Required validation command results

### `pnpm check`

Result: exit `0`.

Output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

Recommendation: `release.pnpm-check` PASSED.

### `pnpm test`

Result: exit `0`.

Final output summary:

```text
tests 670
suites 109
pass 670
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3921.09375
```

Recommendation: `release.pnpm-test` PASSED.

### `pnpm workbench:build`

Result: exit `0`.

Output:

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming... 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.28 kB
src/symphony/workbench-static/assets/index-DGOQN4eH.css    8.32 kB | gzip:   2.17 kB
src/symphony/workbench-static/assets/index-7IvGgo-R.js   645.20 kB | gzip: 120.45 kB

built in 140ms
```

The command also printed Node WASI experimental warnings. The build completed successfully.

Recommendation: `release.workbench-build` PASSED.

### `pnpm test:mutation:gate`

Result: exit `0`.

Final output summary:

```text
All files | 74.22 total | 78.37 covered | 1762 killed | 6 timeout | 488 survived | 126 no cov | 0 errors
Final mutation score of 74.22 is greater than or equal to break threshold 60
Done in 25 minutes and 47 seconds.
```

Recommendation: `release.mutation-gate` PASSED.

### `pnpm audit --audit-level high`

Result: exit `0`.

Output:

```text
1 vulnerabilities found
Severity: 1 moderate
```

No high-severity vulnerability was reported by this command.

Recommendation: `release.audit-high` PASSED.

### `git diff --check`

Result: exit `0`.

Output: no output.

Recommendation: `release.diff-check` PASSED.

### `pnpm --silent mcas doctor --json`

Result: exit `0`.

Output:

```json
{
  "version": "1",
  "status": "ok",
  "nodeVersion": "24.14.0",
  "packageManager": "pnpm",
  "commands": [
    "doctor",
    "intake",
    "github issue",
    "harness run-taskpacket",
    "queue manual",
    "run-next",
    "run-task",
    "smoke",
    "eval replay"
  ]
}
```

Recommendation: `release.mcas-doctor` PASSED.

## Documentation evidence

Docs and evidence checked for `release.docs-updated`:

- `docs/workbench-operator-guide.md` documents the v20 Active Goal Workbench workflow, active goal panels, GET-only routes, command-evidence boundary, release-ready boundary, and prohibited Workbench actions including shell execution, model invocation, automatic merge, and automatic tag.
- `docs/release-checklist.md` lists the release validation commands, records mutation-gate threshold expectations, and states that passing commands is local command evidence until explicit goal gate events are registered.
- `docs/symphony-product-contracts.md` documents `goal-closeout-report.v1`, release gate status vocabulary, evidence-based release readiness, and the rule that command output alone is not release-ready evidence.
- `docs/plans/workbench-v20-v28-goal-runbooks/README.md` and `docs/plans/workbench-v20-v28-goal-runbooks/v20_workbench-active-goal-surface_goal_runbook_latest.md` provide the v20 runbook pack and closeout instructions.
- `docs/plans/v20-task-5-worker-evidence-2026-05-31.md` records the task-5 worker documentation and test changes.
- `docs/plans/v20-task-5-review-evidence-2026-05-31.md` explicitly reviews the v20 operator docs, release checklist, and product contracts and approves the docs/test scope.
- `docs/plans/v20-task-5-main-verification-evidence-2026-05-31.md` records main verification for the docs/test/release evidence task.

Recommendation: `release.docs-updated` PASSED.

## Tag evidence

Read-only tag checks:

- `git tag --list 'v20'` exited `0` with no output.
- `git ls-remote --tags origin 'refs/tags/v20'` exited `0` with no output.
- Current HEAD is `a5778f2c9749c0f87fefd0ed52ac9336f8d3f8b3`.
- Managed closeout reports `release.tag-evidence` as `missing`.

No local or remote `v20` tag was verified. No tag was created during this closeout.

Recommendation: `release.tag-evidence` FAILED.

## Gate recommendations

| Gate | Recommendation | Evidence basis |
| --- | --- | --- |
| `release.pnpm-check` | PASSED | `pnpm check` exit `0` |
| `release.pnpm-test` | PASSED | `pnpm test` exit `0`, `670` tests passed, `0` failed |
| `release.workbench-build` | PASSED | `pnpm workbench:build` exit `0`, Workbench static assets rebuilt |
| `release.mutation-gate` | PASSED | `pnpm test:mutation:gate` exit `0`, score `74.22`, break threshold `60` |
| `release.audit-high` | PASSED | `pnpm audit --audit-level high` exit `0`, only `1 moderate` vulnerability reported |
| `release.diff-check` | PASSED | `git diff --check` exit `0`, no output |
| `release.mcas-doctor` | PASSED | `pnpm --silent mcas doctor --json` exit `0`, `status: ok` |
| `release.docs-updated` | PASSED | v20 operator docs, release checklist, product contracts, runbook pack, and task-5 evidence checked |
| `release.tag-evidence` | FAILED | no verified local or remote `v20` tag; closeout reports tag evidence `missing` |

## Release readiness decision

Do not declare `release.ready` now.

The task evidence is complete and eight release gates have passing evidence, but `release.tag-evidence` does not have a passing evidence basis. After the parent registers the eight passed gates, `release.ready` should still remain undeclared until actual tag evidence exists and the tag evidence gate is registered as passed.

## Blockers and next registration step

Blocker:

- `release.tag-evidence` is missing. A `v20` tag was not found locally or on `origin`, and no tag was created by this release-manager pass.

Next gate to register:

- Register `release.pnpm-check` first if the parent registers gates in the release contract order, using this closeout evidence file. Continue through the other PASSED gates. Stop before `release.tag-evidence` unless actual tag evidence is produced and verified.
