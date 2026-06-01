# v26 task-1 independent review evidence

Goal id: `v26-verified-adoption-workbench`
Task id: `task-1`
Branch reviewed: `v26-task-1-adoption-candidate-panel`
Review date: 2026-05-29
Reviewer role: independent reviewer
Verdict: `NEEDS_REVISION`

## Scope reviewed

Runbook: `docs/plans/workbench-v20-v28-goal-runbooks/v26_verified-adoption-workbench_goal_runbook_latest.md`
Worker evidence: `docs/plans/v26-task-1-worker-evidence-2026-05-29.md`

Task scope from the runbook:

- User-visible value: 用户知道哪些实现结果可以采纳。
- Implementation scope: identify adoptable confirmed runs and show source run, workspace, evidence, changed files, and verifier status.
- Keep Workbench on the latest goal/runbook/next-action path, not the old v8 action dashboard.

## Baseline and checkout state

The expected runbook branch boundary was not clean.

- Current branch: `v26-task-1-adoption-candidate-panel`.
- Current `HEAD`: `7bc15cf Record v24 task-1 workspace verification rerun`.
- `main`: `22db2edd73e880765e00f464634691ed8b801836`.
- `git merge-base HEAD main`: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`.
- `git diff main...HEAD` had no committed branch diff.
- The review therefore used the repo-local fallback requested in the prompt: current checkout working tree compared against `main`, plus direct inspection of the current files.

The fallback diff is not clean enough to approve. It includes v26 task-1 code, but also carried v23/v25 product changes and deletions from newer `main` history. Examples from `git diff --name-status main`:

- Modified for v26 task-1: `frontend/workbench/src/App.jsx`, `frontend/workbench/src/api/contracts.js`, `frontend/workbench/src/styles/workbench.css`, `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, `docs/symphony-product-contracts.md`, `docs/workbench-operator-guide.md`.
- Out-of-scope carried changes: `frontend/workbench/src/api/client.js`, `src/symphony/console.js`, `src/symphony/goal-operation-run-registry.js`, `tests/v23-goal-operation-console-api.test.js`, `tests/v23-goal-operation-run-registry.test.js`, `tests/v25-controlled-implementation-lane.test.js`.
- Regressions relative to `main` in the fallback diff: deletion of v24/v25 evidence files, deletion of `src/symphony/goal-implementation-plan.js`, `src/symphony/goal-main-verification-evidence.js`, `src/symphony/goal-verification-runner.js`, and related v24/v25 tests.

## Functional review

The v26 candidate panel is present in the current files:

- `frontend/workbench/src/App.jsx` renders `AdoptionCandidatePanel` before the supporting legacy information panels.
- `frontend/workbench/src/api/contracts.js` projects `adoptionCandidates` from `symphony.console-runs`.
- The projected candidate rows include source run id, workspace path, workspace manifest, evidence artifact path/ref, changed files, verifier status, execution plan id, write boundary, workspace write flag, main worktree write flag, and update time.
- The candidate filter requires `status === "passed"`, `verifierStatus === "passed"`, isolated workspace fields, `mainWorktreeWrites === false`, implementation source metadata, source workspace path, and evidence artifact path.
- The panel remains read-only. I did not find `symphony adopt`, merge, tag, shell runner, clipboard, local-open, reviewer approval, main verification, or release-ready actions in the panel body.

The Workbench path remains anchored on active goal/runbook/next-action panels. The v26 panel is inserted after active goal runbook/task queue and main verification readiness, and before older summary/run panels. It does not replace the top-level path with `scan/do/review/verify/status/continue/artifacts`.

Tests do cover the user-visible path:

- `tests/workbench-api-client.test.js` has a projection test for v26 adoption candidates that includes one adoptable run and excludes a failed-verifier run and a main-worktree-writing run.
- `tests/workbench-shell.test.js` checks that the React panel exposes source run, workspace, evidence, changed files, verifier status, and does not wire adoption/approval/verification/merge/tag/shell actions.

## Blockers

1. The reviewable checkout includes out-of-scope product changes and baseline regressions.

   The v26 task-1 runbook only asks for adoption candidate visibility. The current checkout also carries v23 operation console work, v25 worker evidence handoff work, backend operation registry writes, and older v24/v25 deletions relative to `main`. This prevents an independent reviewer from approving the branch as a task-1 slice. If merged or main-verified from this state, the change set would not be limited to task-1.

   Required fix: rebase or recreate `v26-task-1-adoption-candidate-panel` from the appropriate current baseline and include only the v26 task-1 candidate panel changes plus required generated Workbench assets/docs/tests. Separate v23/v25 carried work and restore any files that would be deleted relative to the intended baseline unless those deletions are already present in the chosen baseline.

2. Worker evidence has not been registered in the goal ledger.

   Worker evidence records `pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json` with `task-1 status: planned` and `task-1 workerEvidenceRef: null`. The controller supplied worker evidence as context, so review proceeded, but the branch itself does not show the expected `worker.evidence-recorded` event.

   Required fix: after the scoped diff is clean, register the worker evidence event through the runbook dry-run/confirm flow, or record why the controller intentionally deferred event registration.

## Commands run

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
tests 718
suites 114
pass 718
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4514.91825
```

### `pnpm workbench:build`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-SpSymoCx.css   16.08 kB │ gzip:   3.08 kB
src/symphony/workbench-static/assets/index-BRIgAgWR.js   785.36 kB │ gzip: 146.61 kB

✓ built in 50ms
```

### `git diff --check`

Exit code: 0

Ran once before writing this evidence file and once after adding it. Both runs returned the same result.

```text
No output.
```

## Reviewed files

- `docs/plans/workbench-v20-v28-goal-runbooks/v26_verified-adoption-workbench_goal_runbook_latest.md`
- `docs/plans/v26-task-1-worker-evidence-2026-05-29.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/console.js`
- `src/symphony/contract.js`
- `tests/symphony-cli.test.js`
- `tests/v21-goal-plan-preview-api.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

## Boundary notes

- This review does not approve main verification or release readiness.
- No merge, tag, or goal review event was registered by this reviewer.
- The candidate panel itself is a reasonable read-only implementation of task-1, but the current checkout is not scoped tightly enough for approval.
