# v30 task-1 worker evidence

Date: 2026-06-01

Goal id: `v30-verified-adoption-workspace-v2`  
Task id: `task-1`  
Task title: Adoption candidate normalization  
Planned branch: `v30-task-1-adoption-candidate-normalization`  
Current checkout during fallback: `v29-task-4-operation-console-and-run-result-bridge`

## Worker context

This was completed as a bounded fallback worker for task-1 only. The original task-1 worker thread `019e81e5-90e0-7982-9352-cc5bfac0fca3` had not produced this evidence file when this fallback worker started.

The checkout was already dirty with v29 implementation changes, v30 task-0 fixtures/evidence, generated Workbench assets, and partial v30 task-1 adoption-candidate code. I did not clean, stash, revert, force checkout, merge, push, tag, or register goal events. I worked with the current dirty state and recorded this fallback condition here.

## User-visible value

Workbench now shows which v29 implementation runs can be adopted and which are blocked, with the reason shown beside each blocked run.

## Implementation summary

- `frontend/workbench/src/api/contracts.js` projects `AdoptionCandidateProjectionV30` from backend run/operation fields. It prefers scoped `goal-operation-runs.v1` implementation operations when present and falls back to `symphony.console-runs` only when operation data is absent.
- Candidate decisions use only source run id, run status, artifact refs/evidence ref, source workspace refs, source workspace fingerprint, isolated workspace write boundary, `mainWorktreeWrites: false`, and verifier status/summary.
- The projection produces adoptable rows and blocked rows. Blocked rows keep concrete reasons such as missing fingerprint, verifier not passed, incomplete workspace refs, or missing managed evidence artifact ref.
- `frontend/workbench/src/App.jsx` exposes the v30 adoption candidate panel in the Workbench adoption path with active goal/task context, source contract/route state, criteria, candidate count, blocked count, run id, operation id, workspace refs, fingerprint, evidence ref, changed files, verifier status, and write-boundary fields.
- Tests cover the v30 operation-registry projection and the shell-level boundary checks. The fallback patch corrected the API-client test to use the scoped active-goal operations route helper and updated the shell test from the old v26 helper assertion to the v30 operation/run projection assertions.

## Files changed

Task-1 relevant files in the current dirty checkout:

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-B_QbMkSa.js`
- `src/symphony/workbench-static/assets/index-DEceTgZX.css`
- deleted generated assets: `src/symphony/workbench-static/assets/index-B9IfCFVY.css`, `src/symphony/workbench-static/assets/index-NKKg_tJp.js`

The wider dirty checkout also contains v29 implementation and evidence files that were present before this fallback work. I did not revert or normalize them.

## Workbench user path changed

Path: Workbench active goal view -> Adoption tab -> `Adoption candidate normalization` panel.

The panel is anchored to the active goal/task route context and displays:

- source contract: `goal-operation-runs.v1` when v29 implementation operations exist, otherwise `symphony.console-runs`
- active `goalId` and `taskId`
- adoptable count, blocked count, and total runs scanned
- criteria used for adoption readiness
- per-run source run id, operation id/status, workspace path, workspace manifest, workspace fingerprint, evidence artifact path/ref, changed files, verifier status, write boundary, workspace writes, and `mainWorktreeWrites`
- blocking reasons for runs that cannot be adopted

The browser path remains read-only for this task. It does not call `symphony adopt --run`, inspect adoption patches, confirm adoption, open local files, download artifacts, merge, push, tag, invoke models, or self-approve.

## Command results

`pnpm check`

- Exit code: 0
- Result: `node --check` completed for `src/*.js`, `src/adapters/*.js`, `src/ensemble/*.js`, `src/integrations/*.js`, `src/intake/*.js`, `src/symphony/*.js`, `src/trackers/*.js`, `scripts/*.js`, `plugins/eval-replay/*.js`, and `tests/*.test.js`.

`pnpm test`

- Exit code: 0
- Result: `tests 739`, `suites 115`, `pass 739`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 6046.358916`.

`pnpm workbench:build`

- Exit code: 0
- Result: Vite built the Workbench static bundle successfully.
- Built files reported:
  - `src/symphony/workbench-static/index.html` 0.42 kB, gzip 0.28 kB
  - `src/symphony/workbench-static/assets/index-DEceTgZX.css` 20.62 kB, gzip 3.69 kB
  - `src/symphony/workbench-static/assets/index-B_QbMkSa.js` 932.11 kB, gzip 170.88 kB

`git diff --check`

- Exit code: 0
- Result: no whitespace errors reported.

`pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Result: returned `goal-progress-ledger.v1` for `v30-verified-adoption-workspace-v2`.
- `generatedAt`: `2026-06-01T06:49:09.419Z`
- Summary fields: `totalTasks: 5`, `completedTasks: 0`, `blockedTasks: 0`, `needsReviewTasks: 0`, `needsRevisionTasks: 0`, `releaseReady: false`.
- `task-1` status was still `planned` with `workerEvidenceRef: null`, because this worker did not register `worker.evidence-recorded`.
- Next action label: `Start task-1`; command: `pnpm check`.

`pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Result: returned `goal-next-action.v1` with `status: "action-required"`.
- Next action: `taskId: "task-1"`, `role: "worker"`, `phase: "implement"`.
- Reason: `No explicit worker evidence is recorded for task-1.`

## Boundary notes

- v8 `scan/do/review/verify/status/continue/artifacts` is not used as the Workbench top-level model.
- No generic shell runner, browser terminal, model invocation path, permission system, goal framework, artifact framework, command DSL, merge path, push path, tag path, or release path was introduced.
- Candidate readiness is not inferred from branch names, filenames, commits, prompt text, task titles, or frontend state.
- State changes still come from explicit backend events, scoped operation registry output, or command output.
- This worker did not declare reviewer approval, main verification, release readiness, or task completion in the managed goal journal.

## Reviewer handoff checklist

- Check `projectAdoptionCandidates`, `normalizeAdoptionCandidateFromOperation`, `normalizeAdoptionCandidateFromRun`, and `buildAdoptionCandidateDecision` in `frontend/workbench/src/api/contracts.js`.
- Confirm the decision inputs are limited to passed run, artifact refs/evidence ref, workspace refs, source workspace fingerprint, isolated workspace write boundary, `mainWorktreeWrites: false`, and verifier status/summary.
- Confirm `AdoptionCandidatePanel` and `AdoptionCandidateList` in `frontend/workbench/src/App.jsx` show both adoptable and blocked rows with concrete reasons.
- Confirm `tests/workbench-api-client.test.js` covers v30 operation-backed candidate and blocked row projection.
- Confirm `tests/workbench-shell.test.js` keeps the panel free of browser execution, local file open, review approval, main verification, merge, tag, shell, spawn, and clipboard paths.
- Re-run `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check`.

## Residual risks

- The fallback worker completed on the intentionally dirty `v29-task-4-operation-console-and-run-result-bridge` checkout, not on the planned v30 task-1 branch.
- The generated Workbench static asset filenames changed after `pnpm workbench:build`; review should confirm the generated asset churn belongs with the final task branch packaging.
- This evidence does not make the goal ledger show task-1 worker evidence. A controller or authorized worker event registrar still needs to run the dry-run and confirm `symphony goal update` flow after review of this file.

## Recovery steps

If the reviewer finds a task-1 issue, keep the dirty checkout intact and patch only the affected task-1 files. Re-run the five required commands above and update this evidence file with the new exact results.

If the controller needs the managed goal ledger to advance, run the controlled dry-run first:

```bash
pnpm --silent symphony goal update \
  --goal v30-verified-adoption-workspace-v2 \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v30-task-1-fallback-worker \
  --evidence-ref docs/plans/v30-task-1-worker-evidence-2026-06-01.md \
  --dry-run --json
```

Then confirm only with the returned `planHash`. This fallback worker did not run either registration command.
