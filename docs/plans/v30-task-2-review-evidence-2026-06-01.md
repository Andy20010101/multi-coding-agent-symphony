# v30 task-2 review evidence

Date: 2026-06-01

Goal id: `v30-verified-adoption-workspace-v2`  
Task id: `task-2`  
Task title: Adoption plan preview workspace  
Reviewer id: `codex-v30-task-2-reviewer`  
Worker evidence event: `evt_bd8dbb5d455e3e46`  
Worker evidence ref: `docs/plans/v30-task-2-worker-evidence-2026-06-01.md`  
Verdict: `APPROVED`

## Review scope

This review checked task-2 only. I did not implement product changes outside this evidence file, register goal events, run `symphony goal update`, run `symphony goal review`, run `symphony goal gate`, merge, push, tag, publish, or declare release readiness.

The checkout was dirty on `v30-task-2-adoption-plan-preview-workspace`. I used the repo-local/current-checkout fallback requested by the controller and did not clean, stash, revert, force checkout, or discard existing changes.

Original blocked operation: the runbook's clean-base review path would normally inspect an isolated task branch from a clean checkout.  
Fallback used: current checkout at `/Users/andy/Documents/project/multi-coding-agent-symphony`, worker evidence, task-1 upstream evidence, focused diff inspection, source searches, and local command output.  
Fallback sufficiency: sufficient for task-2 review because the current checkout contains the worker's task-2 implementation and evidence, and the focused tests exercise the controlled freeze route, Workbench client projection, React shell constraints, and static route boundary.

## Files reviewed

- `docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md`
- `docs/plans/v30-task-2-worker-evidence-2026-06-01.md`
- `docs/plans/v30-task-1-worker-evidence-2026-06-01.md`
- `docs/plans/v30-task-1-review-evidence-2026-06-01.md`
- `docs/plans/v30-task-1-main-verification-evidence-2026-06-01.md`
- `src/symphony/console.js`
- `src/symphony/goal-operation-run-registry.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/v23-goal-operation-run-registry.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- generated Workbench static files under `src/symphony/workbench-static/`

## Findings

- `src/symphony/console.js` adds `POST /api/goals/<goal-id|latest>/adoption-plan-freeze`. The route rejects query parameters, unsafe goal route segments, non-JSON bodies, non-object JSON, oversized bodies, and body fields outside `goalId`, `taskId`, `sourceRunId`, and `operationId`.
- The backend resolves the route goal, requires the body goal to match it, reads `goal-operation-runs.v1`, and accepts only a selected `commandKind: "implementation"` operation with the same `goalId`, `taskId`, `operationId`, and `runResult.runId`.
- The adoption blockers match the task boundary: operation must be confirmed, run status passed, verifier passed, isolated workspace write boundary present, `mainWorktreeWrites === false`, workspace path and manifest present, source workspace fingerprint present, and managed evidence artifact present.
- The freeze path calls the existing `symphony adopt --run <sourceRunId> --json` implementation through `runSymphonyCli`. It does not add a generic shell runner, browser terminal, command DSL, model invocation path, merge path, push path, tag path, approval path, main verification path, or release-ready path.
- Successful freeze responses return `controlled-adoption-plan-freeze.v1` with adoption plan id, patch artifact, patch hash, changed files, file operations, source workspace fingerprint, project/git fingerprints, inspect command, frozen confirmation command, and safety flags. The path records the result as `commandKind: "adoption-plan"` in `goal-operation-runs.v1`.
- `frontend/workbench/src/api/client.js` posts only the selected freeze route and JSON body, then accepts only `controlled-adoption-plan-freeze.v1` as success.
- `frontend/workbench/src/api/contracts.js` exposes `AdoptionPlanPreviewWorkspaceV30` from explicit adoption candidates and operation records. The freeze candidate payload contains only `goalId`, `taskId`, `sourceRunId`, and `operationId`; the frozen plan view is read from the operation registry record.
- `frontend/workbench/src/App.jsx` adds the visible task-2 user path: adoption candidate panel, adoption plan preview workspace panel, `Freeze adoption plan` button, latest freeze result, frozen plan from operations, affected files, file operations, fingerprints, and recovery notes. I did not find UI affordances for adoption confirm/apply, local file open, artifact download, merge, push, tag, reviewer approval, main verification, release readiness, model invocation, or arbitrary shell execution in this panel.
- Static Workbench route constraints include `/api/goals/<goal-id>/adoption-plan-freeze` as an approved frontend API path and still reject execution, write, download, local-open, and model entry points.
- Product and operator docs describe the controlled route, accepted fields, existing `adopt --run` mapping, returned patch/fingerprint/recovery data, and forbidden prompt/path/shell/confirm/merge/push/tag/review/main/release fields.

## Command results

All six controller-required commands below were rerun by the reviewer in the current checkout on 2026-06-01. None of these six results are worker-evidence-only verification.

`pnpm check`

- Source: fresh reviewer run.
- Exit code: 0.
- Exact output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

- Source: fresh reviewer run.
- Exit code: 0.
- Exact summary:

```text
tests 741
suites 115
pass 741
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 5224.09325
```

`pnpm workbench:build`

- Source: fresh reviewer run.
- Exit code: 0.
- Exact output summary:

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                   0.42 kB gzip:   0.28 kB
src/symphony/workbench-static/assets/index-BUnbjJiI.css   20.82 kB gzip:   3.70 kB
src/symphony/workbench-static/assets/index-WWvwL4k_.js   952.05 kB gzip: 174.27 kB
built in 55ms
```

`git diff --check`

- Source: fresh reviewer run.
- Exit code: 0.
- Exact output: no output.

`pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`

- Source: fresh reviewer run.
- Exit code: 0.
- Exact result:

```text
contractName: goal-progress-ledger.v1
contractVersion: 1
goalId: v30-verified-adoption-workspace-v2
goalTitle: v30 Verified Adoption Workspace v2
generatedAt: 2026-06-01T07:24:05.261Z
summary.totalTasks: 5
summary.completedTasks: 2
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1.status: main-verified
task-1.statusSource: goal-event-log.v1:evt_f6dd021ead55a7a3
task-2.status: approved
task-2.statusSource: goal-event-log.v1:evt_498fc60c1c74fffd
task-2.workerEvidenceRef: docs/plans/v30-task-2-worker-evidence-2026-06-01.md
task-2.reviewEvidenceRef: docs/plans/v30-task-2-review-evidence-2026-06-01.md
task-2.reviewVerdict: APPROVED
task-2.mainVerificationRef: null
task-3.status: planned
task-4.status: planned
task-5.status: planned
releaseGates.pnpmCheck: unknown
releaseGates.pnpmTest: unknown
releaseGates.workbenchBuild: unknown
releaseGates.diffCheck: unknown
nextActions[0].label: Start task-3
nextActions[0].command: pnpm check
safety.readOnly: true
safety.copyOnly: true
safety.browserExecutionAvailable: false
safety.modelInvocationAvailable: false
```

`pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json`

- Source: fresh reviewer run.
- Exit code: 0.
- Exact result:

```text
contractName: goal-next-action.v1
contractVersion: 1
goalId: v30-verified-adoption-workspace-v2
status: action-required
next.taskId: task-2
next.role: main-verifier
next.phase: main-verification
next.reason: Reviewer approved task-2 but main verification is missing.
next.blocked: false
reason: Reviewer approved task-2 but main verification is missing.
evidenceState.workerEvidenceRef: docs/plans/v30-task-2-worker-evidence-2026-06-01.md
evidenceState.reviewEvidenceRef: docs/plans/v30-task-2-review-evidence-2026-06-01.md
evidenceState.mainVerificationRef: null
copyOnlyPrompt.available: false
copyOnlyCommands:
  pnpm check
  pnpm test
  pnpm workbench:build
  git diff --check
  pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json
afterCompletion.registerWith: symphony goal gate --gate main-verification
afterCompletion.allowedEvents: main.verification-passed, main.verification-failed
safety.readOnly: true
safety.copyOnly: true
safety.workbenchWriteAvailable: false
safety.browserExecutionAvailable: false
safety.modelInvocationAvailable: false
```

Additional focused checks from the original review are preserved below.

`node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`

- Exit code: 0
- Output summary: `tests 59`, `suites 3`, `pass 59`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 406.892583`.

`node --test tests/workbench-route-smoke.test.js`

- Exit code: 0
- Output summary: `tests 11`, `suites 1`, `pass 11`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 193.682041`.

`pnpm --silent exec node --check src/symphony/console.js && pnpm --silent exec node --check frontend/workbench/src/api/client.js && pnpm --silent exec node --check frontend/workbench/src/api/contracts.js && pnpm --silent exec node --check tests/workbench-api-client.test.js && pnpm --silent exec node --check tests/workbench-shell.test.js`

- Exit code: 0
- Output summary: no syntax errors reported.

Focused source search:

- Command: `rg -n "child_process|exec\\(|spawn\\(|window\\.open|download|clipboard|merge|push|tag|releaseReady|main.verification|reviewer.approved|adoptionConfirmAvailable|confirm adoption|adopt --confirm|dangerouslySetInnerHTML|modelInvocation|open local|local file" frontend/workbench/src src/symphony/console.js tests/workbench-shell.test.js`
- Result: the task-2 panel hits are safety fields or display text with false values; shell/model/local-file/download assertions remain in tests. The other hits are existing review, verification, closeout, safe preview, legacy console, or test text, not new task-2 browser execution paths.

## Worker evidence trust

I trust the worker-reported full command outcomes for this review boundary. I did not rerun the full `pnpm test` or `pnpm workbench:build`; instead I reran the focused API, shell, route-smoke, syntax, and whitespace checks that cover the changed task-2 route and Workbench path. The focused results match the worker evidence claims for the affected files, and the static Workbench bundle currently present contains the new task-2 panel strings.

## Boundary notes

- The review used the current dirty checkout because the controller requested Boundary-first repo-local/current-checkout fallback.
- I did not inspect a clean branch merge, and this evidence is not release readiness.
- The backend route writes only the adoption plan freeze result and operation registry record after explicit command output from the existing adoption planner.
- The browser path can request a freeze for an exposed candidate, but it cannot supply shell commands, prompts, plan hashes, local paths, adoption confirmation fields, merge/push/tag options, review fields, main verification fields, or release readiness fields.
- `commandKind: "adoption-plan"` is narrow and tied to `symphony adopt --run`; I did not find a generic operation kind or command runner introduced by this change.
- The Workbench model still uses the active goal/runbook/next-action flow and does not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level action model.

## Residual risks

- The checkout includes intentional v29/v30 dirty files and generated static asset churn. Main verification should separate task-2 changes from unrelated dirty files before any merge decision.
- The adoption candidate projection can list all implementation operations exposed for the active goal. The freeze request body uses the active task context and the backend rejects mismatched operation/task pairs, but a future cleanup could filter the freeze candidate list by active task to reduce noisy disabled or failing rows when older implementation operations are present.
- The route relies on existing `symphony adopt --run` semantics to keep the main worktree unchanged while freezing a plan. The focused tests cover the normal path where `mainWorktreeWrites` is false; main verification should rerun broader adoption tests if the adoption planner changes.
- I did not perform an interactive browser screenshot pass. The React shell and static serving tests confirm the route, panel source, and static boundary, but they do not prove visual layout quality.

## Recovery steps

If the controller or main verifier finds a task-2 issue, keep the dirty checkout intact until the failure is captured. Patch only the affected route, projection, panel, docs, or focused tests, then rerun:

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
node --test tests/workbench-route-smoke.test.js
```

If the active-task candidate noise becomes a user-facing problem, filter `projectAdoptionPlanPreviewWorkspace` candidates to the active `goalId` and `taskId`, then add a regression test with one prior-task implementation operation and one active-task implementation operation.

## Controller handoff

The controller can register `reviewer.approved` for `v30-verified-adoption-workspace-v2` task-2 using this evidence ref.
