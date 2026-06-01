# v29 task-5 main verification evidence

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Task id: `task-5`  
Task title: Worker evidence handoff after implementation run  
Worker evidence event: `evt_96c831c13a08094d`  
Worker evidence path: `docs/plans/v29-task-5-worker-evidence-2026-06-01.md`  
Review event: `evt_77d2a1d72b716e2e`  
Review evidence path: `docs/plans/v29-task-5-review-evidence-2026-06-01.md`  
Main verification evidence path: `docs/plans/v29-task-5-main-verification-evidence-2026-06-01.md`  
Result: `passed`

## Scope checked

Task-5 requires Workbench to carry a confirmed implementation run from `goal-operation-runs.v1` into the existing worker evidence handoff. The handoff must prefill `worker.evidence-recorded`, then use the existing `event-plan-preview` dry-run and `event-plan-confirm` plan-hash path. It must not add a generic runner, model path, permission system, command DSL, worker self-approval, readiness inference, or auto-merge/tag/push/publish behavior.

I read these scope files before verification:

- `docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md`
- `docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md`
- `docs/plans/v29-task-5-worker-evidence-2026-06-01.md`
- `docs/plans/v29-task-5-review-evidence-2026-06-01.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`

## Evidence chain

The task has a worker event and an independent reviewer event before this main verification:

- `.symphony/goals/events/v29-active-task-controlled-implementation-workspace.ndjson` line 14 records `worker.evidence-recorded` for task-5 as `evt_96c831c13a08094d`, actor `codex-v29-task-5-worker`, evidence `docs/plans/v29-task-5-worker-evidence-2026-06-01.md`.
- `.symphony/goals/events/v29-active-task-controlled-implementation-workspace.ndjson` line 15 records `reviewer.approved` for task-5 as `evt_77d2a1d72b716e2e`, actor `codex-v29-task-5-reviewer`, evidence `docs/plans/v29-task-5-review-evidence-2026-06-01.md`.
- `pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json` returned task-5 `role: "main-verifier"` and reason `Reviewer approved task-5 but main verification is missing.`
- This file is written after worker evidence and reviewer approval. I did not run `symphony goal gate` from this subagent.

## Checkout fallback

The checkout is `v29-task-4-operation-console-and-run-result-bridge`, not the task-5 branch named in the runbook. The worktree is intentionally dirty with task-1 through task-5 changes, generated Workbench assets, and v29 evidence files. I used the repo-local/current-checkout fallback requested by the controller and did not revert or rewrite existing changes.

`git status --short` showed modified Workbench source, backend registry/console source, tests, docs, regenerated static assets, and untracked v29 evidence files. `git diff --name-only` included:

- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/console.js`
- `src/symphony/goal-operation-run-registry.js`
- `tests/v23-goal-operation-run-registry.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- deleted old Workbench static assets and new generated assets under `src/symphony/workbench-static/assets/`

## Implementation findings

`frontend/workbench/src/api/contracts.js` implements the task-5 projection in `projectV29WorkerEvidenceHandoff`. The handoff is available only when:

- `goal-next-action.v1` still allows `worker.evidence-recorded`;
- `goal-operation-runs.v1` has a confirmed operation for the same goal and task;
- the operation has `commandKind: "implementation"`;
- the run result has `mainWorktreeWrites: false`;
- the run result has workspace writes or `writeBoundary: "isolated-workspace"`;
- the run result has an execution plan id, run id, evidence artifact path, and managed evidence ref.

When those conditions pass, the projection pre-fills the existing worker evidence form with actor, evidence ref, and statement values. It keeps `requiresGoalEventConfirm: true` and `confirmRequiresPlanHash: true`.

`frontend/workbench/src/App.jsx` renders the handoff under the existing Next Action event registration forms. It displays operation id, run id, execution plan id, run/verifier status, evidence artifact path, source workspace path, and evidence ref. The registration control is the existing `GoalEventPlanPreview`, so the browser path remains dry-run preview followed by plan-hash confirm.

`src/symphony/console.js` records confirmed controlled implementation runs into `goal-operation-runs.v1` with `commandKind: "implementation"`, run result, artifacts, verifier summary, and failure reason. `src/symphony/goal-operation-run-registry.js` accepts `implementation` as an operation kind and keeps the registry as run-control state, not approval or release evidence.

`tests/workbench-api-client.test.js` verifies that after a confirmed implementation run, the Workbench model exposes a worker evidence handoff with source contract `goal-operation-runs.v1`, managed artifact evidence ref, prefilled actor, and a dry-run `goal-update-plan.v1` preview. The test also confirms the dry-run does not append a goal event.

`docs/workbench-operator-guide.md` and `docs/symphony-product-contracts.md` document the v29 boundary: the handoff reads the operation registry, does not read evidence bodies, does not open source workspaces, does not run shell/model/agent paths, and does not register reviewer, main verification, release, merge, push, or tag actions.

## Boundary findings

I found no task-5 path that adds a generic shell runner, browser terminal, model invocation path, permission system, generic goal framework, artifact framework, command DSL, or top-level v8 Workbench action list.

I found no worker self-approval path. The handoff can only register `worker.evidence-recorded`; reviewer approval remains under `symphony goal review`, and main verification remains under `symphony goal gate --gate main-verification`.

I found no readiness inference from filenames, branches, commits, prompts, task titles, artifact names, or frontend state. `goal-operation-runs.v1` is treated as operation context and artifact context, not approval, main verification, or release readiness.

I found no auto-merge, auto-tag, auto-push, or publish behavior.

## Command results

```sh
pnpm check
```

Result: exit 0. `node --check` completed for source, scripts, plugin replay code, and tests.

```sh
pnpm test
```

Result: exit 0. Node test runner reported `tests 739`, `suites 115`, `pass 739`, `fail 0`, `duration_ms 5030.632917`.

```sh
pnpm workbench:build
```

Result: exit 0. Vite built:

- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DEceTgZX.css`
- `src/symphony/workbench-static/assets/index-CdwLo3Cv.js`

```sh
git diff --check
```

Result: exit 0. No whitespace errors were reported.

```sh
pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
```

Result: exit 0. The ledger reported `totalTasks: 5`, `completedTasks: 5`, `blockedTasks: 0`, `needsReviewTasks: 0`, `needsRevisionTasks: 0`, and `releaseReady: false`. Task-1 through task-4 are `main-verified`. Task-5 is `approved` from `goal-event-log.v1:evt_77d2a1d72b716e2e`, with worker evidence and review evidence refs set, review verdict `APPROVED`, and `mainVerificationRef: null`.

Additional read-only check:

```sh
pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json
```

Result: exit 0. Next action is task-5 main verification. `afterCompletion.registerWith` is `symphony goal gate --gate main-verification`; allowed events are `main.verification-passed` and `main.verification-failed`.

## Residual risks

The checkout combines task-1 through task-5 changes and generated assets, so this verification cannot isolate a clean task-5-only branch diff. I inspected the task-5 worker/reviewer evidence, the declared task-5 files, the current projection code, the operation registry bridge, tests, and docs in place.

The focused handoff test uses a v29 active task with a confirmed implementation operation and verifies the dry-run evidence registration path. It does not use a fixture named exactly task-5 after task-1 through task-4 are complete, but the projection is goal/task-id generic and the managed ledger confirms task-5 is the active main-verification target after reviewer approval.

## Recovery steps

If the handoff is missing in Workbench:

1. Read `GET /api/goals/<goal-id>/next` and confirm the active worker task still allows `worker.evidence-recorded`.
2. Read `GET /api/goals/<goal-id>/operations` and confirm a same-goal, same-task operation has `commandKind: "implementation"` and `status: "confirmed"`.
3. Confirm the run result has `mainWorktreeWrites: false`, isolated workspace writes, an execution plan id, and an evidence artifact ref.
4. Use the terminal `symphony goal update --event worker.evidence-recorded --dry-run --json` path if the browser form is unavailable.
5. Keep reviewer verdicts, main verification gates, release gates, merge, push, and tag actions outside the worker handoff path.
