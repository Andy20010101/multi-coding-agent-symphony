# v30 task-2 main verification evidence

Date: 2026-06-01

Goal id: `v30-verified-adoption-workspace-v2`  
Task id: `task-2`  
Task title: Adoption plan preview workspace  
Verifier id: `codex-v30-task-2-main-verifier`  
Gate recommendation: `PASSED`

## Scope

This verification checked task-2 only. I did not implement product changes. I only updated this evidence file.

I did not run `symphony goal update`, `symphony goal review`, or `symphony goal gate`. I did not merge, push, tag, publish, declare release readiness, approve review, confirm adoption, or apply an adoption patch.

## Ledger state checked

I verified reviewer approval from the ledger and event log, not from filenames or prompt text.

Pre-verification ledger command:

```text
pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json
```

Result: exit code 0. The command returned `goal-progress-ledger.v1`, `goalId: v30-verified-adoption-workspace-v2`, `summary.totalTasks: 5`, `summary.completedTasks: 2`, `summary.releaseReady: false`, task-2 `status: approved`, task-2 `statusSource: goal-event-log.v1:evt_498fc60c1c74fffd`, task-2 `workerEvidenceRef: docs/plans/v30-task-2-worker-evidence-2026-06-01.md`, task-2 `reviewEvidenceRef: docs/plans/v30-task-2-review-evidence-2026-06-01.md`, task-2 `reviewVerdict: APPROVED`, and task-2 `mainVerificationRef: null`.

Pre-verification next-action command:

```text
pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json
```

Result: exit code 0. The command returned `goal-next-action.v1`, `status: action-required`, `next.taskId: task-2`, `next.role: main-verifier`, `next.phase: main-verification`, `next.reason: Reviewer approved task-2 but main verification is missing.`, `evidenceState.workerEvidenceRef: docs/plans/v30-task-2-worker-evidence-2026-06-01.md`, `evidenceState.reviewEvidenceRef: docs/plans/v30-task-2-review-evidence-2026-06-01.md`, and `evidenceState.mainVerificationRef: null`.

Event log entries checked in `.symphony/goals/events/v30-verified-adoption-workspace-v2.ndjson`:

- Worker evidence event: `evt_bd8dbb5d455e3e46`, `eventType: worker.evidence-recorded`, evidence ref `docs/plans/v30-task-2-worker-evidence-2026-06-01.md`.
- Reviewer approval event: `evt_498fc60c1c74fffd`, `eventType: reviewer.approved`, `review.verdict: APPROVED`, evidence ref `docs/plans/v30-task-2-review-evidence-2026-06-01.md`.

Ledger timing note: after I ran the required verification commands, a later `goal-status` read showed task-2 as `main-verified` from `goal-event-log.v1:evt_5c3aee92ea3328de`, with `mainVerificationRef: docs/plans/v30-task-2-main-verification-evidence-2026-06-01.md`. That event was already present when I inspected the event log. I did not create it, and I did not run a gate registration command.

## Checkout and fallback

Verification checkout observed before and during the required command runs:

```text
branch: v30-task-2-adoption-plan-preview-workspace
HEAD: 07765f3
main: 4537efc
merge-base: bacf1d846ee7
```

Post-verification workspace note: after the evidence file was updated, `git status --short --branch` reported `v30-task-3-adoption-inspect-and-recovery-view` at the same `HEAD: 07765f3`. I did not run `git checkout` or otherwise change branches. I left that external workspace change intact.

`git status --short --branch` showed an intentionally dirty checkout with task-2 source changes, generated Workbench static asset replacement, v29/v30 evidence files, v30 fixtures, and existing dirty files. I did not clean, stash, reset, revert, force checkout, or discard any work.

The runbook nominal path is:

```text
git checkout main
git pull --ff-only
git merge --ff-only v30-task-2-adoption-plan-preview-workspace
```

I did not execute that path because the delegated boundary required current-checkout fallback when a clean main checkout or ff-only merge would be blocked by the intentional dirty checkout. The fallback used the current checkout, runbook, plan doc, worker evidence, reviewer evidence, ledger/event log, focused source inspection, generated Workbench static assets, and fresh validation commands. This was sufficient for task-2 main verification because the current checkout contains the task-2 backend route, Workbench path, registry change, tests, docs, static bundle, and evidence.

## Evidence checked

- `docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md`
- `docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md`
- `docs/plans/v30-task-2-worker-evidence-2026-06-01.md`
- `docs/plans/v30-task-2-review-evidence-2026-06-01.md`
- `.symphony/goals/events/v30-verified-adoption-workspace-v2.ndjson`
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
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BUnbjJiI.css`
- `src/symphony/workbench-static/assets/index-WWvwL4k_.js`

## Command results

`pnpm check`

- Exit code: 0
- Exact output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

- Exit code: 0
- Exact summary:

```text
tests 741
suites 115
pass 741
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4971.848833
```

`pnpm workbench:build`

- Exit code: 0
- Exact output summary:

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                   0.42 kB gzip:   0.28 kB
src/symphony/workbench-static/assets/index-BUnbjJiI.css   20.82 kB gzip:   3.70 kB
src/symphony/workbench-static/assets/index-WWvwL4k_.js   952.05 kB gzip: 174.27 kB
built in 54ms
```

`git diff --check`

- Exit code: 0
- Exact output: no output.

`pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`

- Pre-verification exit code: 0
- Exact result fields: `contractName: goal-progress-ledger.v1`; `goalId: v30-verified-adoption-workspace-v2`; `summary.totalTasks: 5`; `summary.completedTasks: 2`; `summary.releaseReady: false`; task-2 `status: approved`; task-2 `statusSource: goal-event-log.v1:evt_498fc60c1c74fffd`; task-2 `workerEvidenceRef: docs/plans/v30-task-2-worker-evidence-2026-06-01.md`; task-2 `reviewEvidenceRef: docs/plans/v30-task-2-review-evidence-2026-06-01.md`; task-2 `reviewVerdict: APPROVED`; task-2 `mainVerificationRef: null`.
- Post-validation exit code: 0
- Later result fields: task-2 `status: main-verified`; task-2 `statusSource: goal-event-log.v1:evt_5c3aee92ea3328de`; task-2 `mainVerificationRef: docs/plans/v30-task-2-main-verification-evidence-2026-06-01.md`; `summary.releaseReady: false`.

`pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json`

- Pre-verification exit code: 0
- Exact result fields: `contractName: goal-next-action.v1`; `status: action-required`; `next.taskId: task-2`; `next.role: main-verifier`; `next.phase: main-verification`; reason `Reviewer approved task-2 but main verification is missing.`; worker and review evidence refs populated; `mainVerificationRef: null`.
- Post-validation exit code: 0
- Later result fields: `contractName: goal-next-action.v1`; `status: action-required`; `next.taskId: task-3`; `next.role: worker`; `next.phase: implement`; reason `No explicit worker evidence is recorded for task-3.`

## Findings

- Task-2 scope is implemented as an adoption plan preview workspace. The Workbench user can freeze an adoption plan from an explicit adoption candidate instead of directly running `git apply`.
- `src/symphony/console.js` adds `POST /api/goals/<goal-id|latest>/adoption-plan-freeze`. The route rejects query parameters and unsafe goal route segments, accepts JSON only, and allows only `goalId`, `taskId`, `sourceRunId`, and `operationId`.
- The backend requires the route goal and body goal to match, reads `goal-operation-runs.v1`, and accepts only a same-goal, same-task `commandKind: "implementation"` operation whose `runResult.runId` matches the selected source run.
- The adoptable-run checks are explicit: confirmed operation, passed run status, passed verifier status, isolated workspace boundary, `mainWorktreeWrites === false`, source workspace path, source manifest path, source workspace fingerprint, and managed evidence artifact ref.
- The freeze path calls the existing CLI implementation with `argv: ['adopt', '--state-dir', stateDir, '--run', sourceRunId, '--json']`. It does not accept shell text, prompt text, plan hashes, arbitrary paths, model options, merge/push/tag options, review fields, main verification fields, release fields, or adoption confirm input.
- Successful freezes return `controlled-adoption-plan-freeze.v1` with adoption plan id, adoption plan artifact, patch artifact, patch hash, changed files, file operations, source workspace fingerprint, project/git fingerprints, inspect command, frozen confirm command, backend output summary, and safety booleans.
- `src/symphony/goal-operation-run-registry.js` adds the narrow `adoption-plan` command kind. The recorded operation uses `commandName: "symphony adopt --run"` and `source: "workbench.adoption-plan-freeze"`; it is not a generic runner.
- `frontend/workbench/src/api/client.js` posts JSON to the selected freeze route and accepts success only when the backend returns `controlled-adoption-plan-freeze.v1`.
- `frontend/workbench/src/api/contracts.js` projects `AdoptionPlanPreviewWorkspaceV30` from active goal/task context, explicit adoption candidates, operation records, and backend response fields. The request payload contains only `goalId`, `taskId`, `sourceRunId`, and `operationId`.
- `frontend/workbench/src/App.jsx` exposes the Workbench path: freeze candidates, `Freeze adoption plan`, latest freeze result, frozen plan from operations, affected files, file operations, fingerprints, recovery notes, and safety fields.
- The generated Workbench static bundle contains the task-2 panel and route strings after `pnpm workbench:build`.
- Tests cover the route boundary, including rejection of an extra `command: "echo unsafe"` field, successful freeze from an adoptable active-goal implementation run, `commandKind: "adoption-plan"` operation recording, and Workbench projection of the frozen plan.

## Boundary checks

I did not find a task-2 introduction of:

- Browser arbitrary shell execution.
- Browser terminal.
- Model invocation.
- Local file open or arbitrary path/file read.
- Artifact download control.
- Generic permission system.
- Command DSL.
- Merge, push, tag, publish, or release-ready path.
- Reviewer self-approval.
- Main verification inference from filenames, branches, commits, prompt text, task titles, or frontend heuristics.
- Adoption confirmation or direct patch apply from the task-2 panel.

The Workbench path stays on the current goal/runbook/next-action model and does not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level action list.

## Blockers

None for task-2 main verification.

The clean main checkout and ff-only merge path was not used because the current checkout was intentionally dirty and the delegation required the repo-local/current-checkout fallback. That is a merge-process limitation, not a product blocker for this task-2 verification.

## Residual risks

- This is not release readiness. Release gates remain unknown in `goal-status`, and I did not register `release.ready`.
- I did not perform an interactive browser screenshot pass. The React shell tests and static bundle checks verify the route, panel source, and static output, but not viewport layout quality.
- The checkout includes unrelated v29/v30 evidence and fixture files. A controller should isolate final merge scope before any merge decision.
- The controlled freeze writes adoption plan artifacts and an operation record. It does not write to the main worktree, and stale selected runs still depend on existing `symphony adopt --run` runtime checks.

## Recovery notes

If a later check finds a task-2 issue, keep the dirty checkout intact until the failure is captured. Patch only the affected route, projection, panel, docs, or tests, then rerun:

```text
pnpm check
pnpm test
pnpm workbench:build
git diff --check
pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json
pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
node --test tests/workbench-route-smoke.test.js
```

If the issue is route scope, inspect `confirmControlledAdoptionPlanFreeze`, `findAdoptableImplementationOperation`, `runExistingAdoptionPlanCommand`, and `recordControlledAdoptionOperationRunFromFreeze` in `src/symphony/console.js`. If the issue is frontend scope, inspect `projectAdoptionPlanPreviewWorkspace` in `frontend/workbench/src/api/contracts.js` and `AdoptionPlanPreviewWorkspacePanel` in `frontend/workbench/src/App.jsx`.

## Controller handoff

Task-2 main verification is complete with gate recommendation `PASSED`.

Because the current local ledger already contains `evt_5c3aee92ea3328de` for task-2 `main.verification-passed`, the controller should not double-register the same gate in this checkout. If the controller is reconciling from an earlier ledger state where task-2 main verification is still missing, it can register `main.verification-passed` with `symphony goal gate` using this evidence path. It should not register `main.verification-failed` based on this evidence.
