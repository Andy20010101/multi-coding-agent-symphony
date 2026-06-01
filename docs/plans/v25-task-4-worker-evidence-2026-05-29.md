# v25 task-4 worker evidence

Goal id: `v25-controlled-implementation-lane`
Task id: `task-4`
Task: Post-run worker evidence flow
User-visible value: implementation results can flow back into the goal event ledger.

## Implementation summary

Workbench now exposes a v25-only worker evidence handoff when the active goal is `v25-controlled-implementation-lane` and the latest run is a confirmed isolated implementation run. The handoff uses the confirmed run's `evidenceArtifactPath` and `sourceWorkspacePath`, converts the evidence artifact into a managed evidence ref such as `artifact-ref:artifact:<run-id>:evidence`, and renders a prefilled `worker.evidence-recorded` registration form.

The same form uses the existing goal event dry-run preview and plan-hash confirm path. The prompt handoff includes the source run id, execution plan id, evidence artifact path, source workspace path, actor id, and evidence ref. It does not add a generic shell runner, does not open local paths, does not read evidence bodies, and does not expose reviewer approval or main verification from the worker role.

`compactRunState` now preserves `evidenceArtifactPath` so the Workbench projection can use the confirmed run output directly instead of relying only on artifact kind names.

## Files changed for task-4

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `src/symphony/contract.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/symphony-cli.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BTilLLdo.css`
- `src/symphony/workbench-static/assets/index-C33DSOf4.js`
- `docs/plans/v25-task-4-worker-evidence-2026-05-29.md`

Build output replaced the previous tracked Workbench bundle references:

- `src/symphony/workbench-static/assets/index-DfZ2uJ6P.css`
- `src/symphony/workbench-static/assets/index-wQbBCopW.js`

The checkout already contained unrelated modified or untracked files before this task, including prior v23/v24/v25 work. I did not claim those as task-4 implementation changes.

## Acceptance mapping

- Confirmed run paths are surfaced: `projectLatestRun` exposes `evidenceArtifactPath` and `sourceWorkspacePath`; `compactRunState` preserves `evidenceArtifactPath`.
- Worker evidence registration form exists: `projectV25WorkerEvidenceHandoff` builds a prefilled `worker.evidence-recorded` form from the active `goal-next-action.v1` task and latest confirmed isolated run.
- Prompt handoff exists: `WorkerEvidenceHandoffView` renders the prompt text with run id, execution plan id, evidence artifact path, source workspace path, actor id, and evidence ref.
- Goal ledger path is reused: the registration form calls the existing `GoalEventPlanPreview`, which uses event-plan-preview and event-plan-confirm with the returned plan hash.
- Boundary held: the handoff is gated to `v25-controlled-implementation-lane`, requires `workspaceWrites: true`, `mainWorktreeWrites: false`, an implementation pipeline, and an execution plan id. It does not run shell commands, merge, tag, read local evidence bodies, or infer approval/main verification/release readiness.

## Commands run

- `node --test tests/workbench-api-client.test.js`
  - Result: pass, 24 tests.
- `node --test tests/workbench-shell.test.js`
  - Result: pass, 19 tests.
- `pnpm check`
  - Result: pass.
- `pnpm test`
  - First run: failed, 712 passed / 1 failed. Failure was the frozen console route contract key list missing the intentionally added `evidenceArtifactPath`.
  - Follow-up action: updated `tests/symphony-cli.test.js` to freeze the new field.
- `pnpm test`
  - Final result: pass, 713 tests.
- `pnpm workbench:build`
  - Result: pass. Generated `index-BTilLLdo.css` and `index-C33DSOf4.js`.
- `git diff --check`
  - Result: pass.
- `pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json`
  - Initial result before worker event registration: pass. Summary reported 5 tasks, 3 completed, task-4 planned, releaseReady false.
- `pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json`
  - Initial result before worker event registration: pass. Returned task-4 / worker / implement with reason: no explicit worker evidence is recorded for task-4.
- `pnpm --silent symphony goal update --goal v25-controlled-implementation-lane --task task-4 --event worker.evidence-recorded --actor codex-v25-task-4-worker --evidence-ref docs/plans/v25-task-4-worker-evidence-2026-05-29.md --dry-run --json`
  - Result: pass. Returned `planHash` `sha256:74a45d289b60aea1180928e119808c837d3a23bdaa65838b18008469a2616b73`; dry-run writes false.
- `pnpm --silent symphony goal update --goal v25-controlled-implementation-lane --task task-4 --event worker.evidence-recorded --actor codex-v25-task-4-worker --evidence-ref docs/plans/v25-task-4-worker-evidence-2026-05-29.md --confirm --plan-hash sha256:74a45d289b60aea1180928e119808c837d3a23bdaa65838b18008469a2616b73`
  - Result: pass. Appended `evt_1e7cb6248c02873d`; event type `worker.evidence-recorded`; evidence ref `docs/plans/v25-task-4-worker-evidence-2026-05-29.md`.
- `pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json`
  - Final result after worker event registration: pass. Task-4 has `workerEvidenceRef` `docs/plans/v25-task-4-worker-evidence-2026-05-29.md`; task-4 status is `in-progress`; releaseReady false.
- `pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json`
  - Final result after worker event registration: pass. Returned task-4 / reviewer / review with reason: worker evidence exists for task-4 but reviewer verdict is missing.

## Boundary notes

- Original branch/worktree operation blocked by state: the checkout was already on `v24-task-1-main-verification-readiness-panel` with prior uncommitted and untracked v23/v24/v25 files. Creating or switching to the expected task-4 branch would have risked mixing or losing unrelated work.
- Fallback path used: current repo-local checkout at `/Users/andy/Documents/project/multi-coding-agent-symphony`.
- Commit not created: staging a task-4 commit would have included prior dirty work in shared files, so files are left in the current checkout for the controller to isolate or review.
- No reviewer approval, main verification, release gate, merge, or tag is claimed here.

## Reviewer handoff checklist

- Verify the v25 gate in `projectV25WorkerEvidenceHandoff`.
- Verify the prefilled evidence ref is a managed artifact ref and not an absolute path.
- Verify the form still uses event-plan-preview and event-plan-confirm.
- Verify worker role cannot approve or main-verify through this handoff.
- Verify the Workbench bundle corresponds to the source changes.
