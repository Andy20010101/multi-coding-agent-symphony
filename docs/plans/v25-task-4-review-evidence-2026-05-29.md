# v25 task-4 review evidence

Goal id: `v25-controlled-implementation-lane`
Task id: `task-4`
Task: Post-run worker evidence flow
Reviewer: independent reviewer subagent
Verdict: `approved`

## Scope reviewed

- Worker evidence: `docs/plans/v25-task-4-worker-evidence-2026-05-29.md`.
- Workbench projection and API client changes in `frontend/workbench/src/api/contracts.js` and `frontend/workbench/src/api/client.js`.
- Workbench UI changes in `frontend/workbench/src/App.jsx` and `frontend/workbench/src/styles/workbench.css`.
- Backend route and compact run-state changes in `src/symphony/console.js`, `src/symphony/contract.js`, and `src/symphony/goal-operation-run-registry.js`.
- Focused tests in `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, `tests/v23-goal-operation-console-api.test.js`, `tests/v23-goal-operation-run-registry.test.js`, and `tests/symphony-cli.test.js`.
- Built Workbench static output under `src/symphony/workbench-static/`.

The checkout contains unrelated dirty v23/v24/v25 work. I reviewed task-4 behavior in the current repo-local checkout and did not stage, commit, or register any goal event.

## Findings

No blocking findings.

The v25 worker evidence handoff is gated to `v25-controlled-implementation-lane` by `V25_CONTROLLED_IMPLEMENTATION_GOAL_ID`. The handoff requires a latest run with `runId`, `evidenceArtifactPath`, `sourceWorkspacePath`, a managed evidence artifact ref, `workspaceWrites: true`, `mainWorktreeWrites: false`, an `executionPlanId`, and an `implement` pipeline entry.

The registration form is prefilled for `worker.evidence-recorded` with actor `codex-v25-task-4-worker` and a managed evidence ref shaped as `artifact-ref:artifact:<run-id>:evidence`. The absolute `evidenceArtifactPath` and `sourceWorkspacePath` are displayed as source context and prompt handoff text; they are not used as evidence refs and are not opened or read by the browser code.

The form uses the existing controlled Workbench path: dry-run preview through `/api/goals/<goal-id>/event-plan-preview`, then confirm through `/api/goals/<goal-id>/event-plan-confirm` with the returned `planHash`. The backend calls the controlled goal update/review/gate builders and confirm functions directly. I did not find shell execution, generic terminal runner behavior, model invocation, merge/tag behavior, or reviewer/main-verification/release readiness inference in the handoff.

The static Workbench bundle was rebuilt. The generated `index-C33DSOf4.js` contains the v25 goal id, `sourceWorkspacePath`, `artifact-ref:artifact:<run-id>:evidence`, `workerCanApproveOwnTask: false`, and the event-plan confirm path.

Current controller state is consistent with reviewer handoff: `goal next` returns task-4 reviewer review because worker evidence event `evt_1e7cb6248c02873d` exists and reviewer verdict is missing.

## Commands run

- `pnpm check`
  - Result: pass.
- `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/v23-goal-operation-console-api.test.js tests/v23-goal-operation-run-registry.test.js`
  - Result: pass, 49 tests.
- `git diff --check`
  - Result: pass.
- `pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json`
  - Result: pass. Task-4 status is `in-progress`, worker evidence ref is `docs/plans/v25-task-4-worker-evidence-2026-05-29.md`, reviewer evidence is `null`, release ready is `false`.
- `pnpm test`
  - Result: pass, 713 tests.
- `pnpm workbench:build`
  - Result: pass. Built `src/symphony/workbench-static/assets/index-BTilLLdo.css` and `src/symphony/workbench-static/assets/index-C33DSOf4.js`.
- `pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json`
  - Result: pass. Returned task-4 / reviewer / review with reason: worker evidence exists for task-4 but reviewer verdict is missing.
- `rg -n "worker evidence handoff|v25-controlled-implementation-lane|sourceWorkspacePath|artifact-ref:artifact|event-plan-confirm|workerCanApproveOwnTask|genericShellRunner" src/symphony/workbench-static/index.html src/symphony/workbench-static/assets/index-BTilLLdo.css src/symphony/workbench-static/assets/index-C33DSOf4.js`
  - Result: pass. Confirmed the built bundle contains the v25 handoff and boundary fields.

## Verdict

`approved`

No revision items are required.
