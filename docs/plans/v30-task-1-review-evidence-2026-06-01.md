# v30 task-1 review evidence

Date: 2026-06-01

Goal id: `v30-verified-adoption-workspace-v2`  
Task id: `task-1`  
Task title: Adoption candidate normalization  
Reviewer id: `codex-v30-task-1-reviewer`  
Worker evidence event: `evt_a023cbeeaac087dd`  
Worker evidence ref: `docs/plans/v30-task-1-worker-evidence-2026-06-01.md`  
Verdict: `APPROVED`

## Review scope

This review checked task-1 only. I did not implement product changes, edit worker implementation, register reviewer events, run `symphony goal review --confirm`, run `symphony goal update`, run `symphony goal gate`, merge, push, tag, or declare release readiness.

The checkout was intentionally dirty and remained on `v29-task-4-operation-console-and-run-result-bridge`. I used the repo-local/current-checkout fallback requested by the controller and did not clean, stash, revert, force checkout, or discard existing changes.

## Files reviewed

- `docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md`
- `docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md`
- `docs/plans/v30-verified-adoption-workspace-v2-execution-prompts-2026-06-01.md`
- `docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/v30-task-1-worker-evidence-2026-06-01.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `src/symphony/console.js`
- `src/symphony/goal-operation-run-registry.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/v23-goal-operation-run-registry.test.js`
- generated Workbench static files under `src/symphony/workbench-static/`

## Findings

- `frontend/workbench/src/api/contracts.js` projects `AdoptionCandidateProjectionV30` from backend operation/run fields. The candidate decision uses run status, verifier status or verifier summary, isolated workspace write boundary, `mainWorktreeWrites: false`, workspace path, workspace manifest path, `sourceWorkspaceFingerprint`, and managed evidence artifact refs. I did not find branch, filename, commit message, prompt text, task title, frontend state, execution plan label, or pipeline-label readiness inference in the candidate decision.
- `frontend/workbench/src/App.jsx` exposes the task-1 user path in the Workbench adoption area as `Adoption candidate normalization`. It shows active goal/task context, source contract, candidate count, blocked count, criteria, adoptable rows, blocked rows, blocking reasons, run id, operation id, workspace refs, fingerprint, evidence ref, verifier status, changed files, and write-boundary fields.
- The candidate panel stays read-only for this task. I did not find `symphony adopt --run`, patch freezing, adoption inspect, adoption confirm, local file open, artifact download, merge, push, tag, model invocation, generic shell runner, reviewer approval, main verification, or release-ready paths in the task-1 panel body.
- The tests cover a v30 operation-backed projection with one adoptable row and two blocked rows, including blocked verifier and missing fingerprint cases. The shell test also checks the panel body does not contain review/gate/release, merge/tag, `child_process`, `exec`, `spawn`, `window.open`, or clipboard paths.
- Documentation now states that v30 reads implementation records from `goal-operation-runs.v1`, falls back to `symphony.console-runs`, separates adoptable and blocked rows, and does not infer adoption status from branch names, file names, commit messages, prompt text, task titles, or frontend heuristics.

## Command results

`pnpm check`

- Exit code: 0
- Output summary: `node --check` completed for `src/*.js`, `src/adapters/*.js`, `src/ensemble/*.js`, `src/integrations/*.js`, `src/intake/*.js`, `src/symphony/*.js`, `src/trackers/*.js`, `scripts/*.js`, `plugins/eval-replay/*.js`, and `tests/*.test.js`.

`pnpm test`

- Exit code: 0
- Output summary: `tests 739`, `suites 115`, `pass 739`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 6193.224208`.

`pnpm workbench:build`

- Exit code: 0
- Output summary: Vite built successfully.
- Built files reported:
  - `src/symphony/workbench-static/index.html` 0.42 kB, gzip 0.28 kB
  - `src/symphony/workbench-static/assets/index-DEceTgZX.css` 20.62 kB, gzip 3.69 kB
  - `src/symphony/workbench-static/assets/index-B_QbMkSa.js` 932.11 kB, gzip 170.88 kB

`git diff --check`

- Exit code: 0
- Output summary: no whitespace errors reported.

`pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Contract: `goal-progress-ledger.v1`
- `generatedAt`: `2026-06-01T06:52:51.566Z`
- Summary: `totalTasks: 5`, `completedTasks: 0`, `blockedTasks: 0`, `needsReviewTasks: 0`, `needsRevisionTasks: 0`, `releaseReady: false`.
- `task-1`: `status: "in-progress"`, `statusSource: "goal-event-log.v1:evt_a023cbeeaac087dd"`, `workerEvidenceRef: "docs/plans/v30-task-1-worker-evidence-2026-06-01.md"`, `reviewEvidenceRef: null`, `reviewVerdict: null`, `mainVerificationRef: null`.

Additional read-only check:

`pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Contract: `goal-next-action.v1`
- Status: `action-required`
- Next: `taskId: "task-1"`, `role: "reviewer"`, `phase: "review"`.
- Reason: `Worker evidence exists for task-1 but reviewer verdict is missing.`

## Boundary notes

- I did not compare against a clean task branch because the controller explicitly stated that the current checkout is intentionally dirty and asked for repo-local/current-checkout fallback.
- v29 implementation-confirm work, v30 task-0 fixtures/evidence, generated static assets, and v30 task-1 changes are present in the same dirty checkout. I reviewed task-1 behavior in that context and did not revert unrelated files.
- The v30 task-1 panel does not present v8 `scan/do/review/verify/status/continue/artifacts` as the Workbench top-level action model.
- State shown by the candidate projection comes from backend operation/run contracts and explicit command output, not frontend-only status inference.
- The worker evidence did not self-approve, declare main verification, or declare release readiness. This reviewer evidence also does not register those events.

## Residual risks

- The v30 projection requires `sourceWorkspaceFingerprint`. In this checkout, the v29 controlled implementation confirmation path records `sourceWorkspacePath` and `sourceWorkspaceManifestPath` in `confirmedRun`; I did not see the same path forwarding `sourceWorkspaceFingerprint`. The v30 projection correctly blocks rows when the fingerprint is missing, but a future task should confirm that actual v29 implementation operations preserve the fingerprint when a run is meant to become adoptable.
- The review was performed on an intentionally dirty branch fallback rather than a clean `v30-task-1-adoption-candidate-normalization` branch. Main verification should re-run from the controller-approved branch/worktree boundary.
- `pnpm workbench:build` confirmed the generated static bundle names currently present in the dirty checkout. Packaging should keep generated asset churn tied to the final task branch.

## Recovery steps

If the controller registers this verdict and later main verification fails, keep the dirty checkout intact until the failure is captured. Patch only the task-1 candidate projection or its tests, then re-run:

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json
```

If actual v29 implementation operations are expected to become adoptable but lack `sourceWorkspaceFingerprint`, update the upstream operation/run result bridge to preserve that backend field, add a regression test using the real confirm path, and keep the candidate projection blocked until the explicit fingerprint is present.

## Controller handoff

The controller can register `reviewer.approved` for `v30-verified-adoption-workspace-v2` task-1 using this evidence ref.
