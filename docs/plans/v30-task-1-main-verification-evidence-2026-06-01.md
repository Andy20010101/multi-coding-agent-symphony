# v30 task-1 main verification evidence

Date: 2026-06-01

Goal id: `v30-verified-adoption-workspace-v2`  
Task id: `task-1`  
Task title: Adoption candidate normalization  
Verifier id: `codex-v30-task-1-main-verifier`  
Worker evidence event: `evt_a023cbeeaac087dd`  
Worker evidence ref: `docs/plans/v30-task-1-worker-evidence-2026-06-01.md`  
Reviewer approved event: `evt_364d0646c9a074c4`  
Review evidence ref: `docs/plans/v30-task-1-review-evidence-2026-06-01.md`  
Result: `PASSED`

## Verification scope

This main verification checked task-1 only. I did not implement product changes, edit worker implementation, run `symphony goal update`, run `symphony goal review`, run `symphony goal gate`, merge, push, tag, publish, or declare release readiness.

The controller stated that the checkout is intentionally dirty and still on `v29-task-4-operation-console-and-run-result-bridge`. I did not clean, stash, revert, force checkout, discard changes, or switch branches. I used the requested repo-local/current-checkout fallback for the main checkout and merge boundary.

Original blocked operation: the runbook main-verifier flow expects a clean `main`, `git pull --ff-only`, and `git merge --ff-only v30-task-1-adoption-candidate-normalization`.  
Fallback used: current checkout at `/Users/andy/Documents/project/multi-coding-agent-symphony`, with task-1 code, worker evidence, and review evidence already present.  
Fallback sufficiency: sufficient for task-1 main verification under the controller's explicit fallback instruction because the active ledger requires task-1 main verification, reviewer approval is recorded, task-1 behavior was inspected in the current checkout, and all required commands passed. It is not evidence of a clean-main merge or release readiness.

## Files and contracts checked

- `docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md`
- `docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md`
- `docs/plans/v30-verified-adoption-workspace-v2-execution-prompts-2026-06-01.md`
- `docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/v30-task-1-worker-evidence-2026-06-01.md`
- `docs/plans/v30-task-1-review-evidence-2026-06-01.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- generated Workbench static files under `src/symphony/workbench-static/`

## Implementation verification

`frontend/workbench/src/api/client.js` fetches scoped active-goal operations through `GET /api/goals/<goal-id>/operations` when an active goal id is available. The adoption candidate projection is then built from the scoped operations result, with `/api/runs` used as fallback only when implementation operations are absent.

`frontend/workbench/src/api/contracts.js` defines `AdoptionCandidateProjectionV30`. It filters `goal-operation-runs.v1` to `commandKind === "implementation"` before using run records. It projects adoptable and blocked rows from backend run fields: run id, `status`, `verifierStatus`, verifier summary, artifact refs, evidence ref, source workspace path, source workspace manifest path, source workspace fingerprint, write boundary, workspace writes, and `mainWorktreeWrites`.

The readiness decision requires:

- source run id
- `status === "passed"`
- verifier status passed or verifier summary passed
- isolated workspace write boundary or workspace writes
- `mainWorktreeWrites === false`
- source workspace path and manifest path
- source workspace fingerprint
- managed evidence artifact ref

Blocked rows remain visible with concrete reasons, including `verifier status is not passed`, `source workspace fingerprint is missing`, `workspace refs are incomplete`, `mainWorktreeWrites is not false`, and `managed evidence artifact ref is missing`.

`frontend/workbench/src/App.jsx` exposes the user path in the active Workbench page under `Adoption candidate normalization`. The panel shows active goal/task context, source contract, route state, candidate and blocked counts, criteria, per-run source run id, operation id/status, workspace refs, fingerprint, evidence artifact/ref, changed files, verifier status, write boundary, workspace writes, and main-worktree write state.

I did not find adoption readiness inferred from branch names, file names, commit messages, prompt text, task titles, execution plan labels, pipeline labels, or frontend-only state in the task-1 decision path.

## Boundary checks

- Workbench user path is visible and testable through the active goal page and the v30 adoption candidate panel.
- The panel is anchored to active goal/task context and scoped operations/runs contracts.
- Existing `goal-operation-runs.v1`, `symphony.console-runs`, goal ledger, run, adoption, and verification contracts are reused.
- State displayed by the panel comes from backend contracts and explicit command outputs, not browser-created status.
- Browser UI for task-1 does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, self-approve, or mark main verification/release readiness.
- v8 `scan/do/review/verify/status/continue/artifacts` are not presented as the top-level Workbench action model.
- No generic shell runner, browser terminal, model invocation path, permission system, goal framework, artifact framework, command DSL, or new generic safety layer was introduced by task-1.

## Command results

`git status -sb`

- Exit code: 0
- Current branch: `v29-task-4-operation-console-and-run-result-bridge`
- Result after writing this evidence: dirty checkout with modified task-1 related files, v29/v30 evidence files, generated static asset churn, untracked v30 worker/review evidence, and untracked `docs/plans/v30-task-1-main-verification-evidence-2026-06-01.md`. This matches the controller-provided fallback context.

`pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Contract: `goal-progress-ledger.v1`
- `generatedAt`: `2026-06-01T06:55:45.338Z`
- Summary: `totalTasks: 5`, `completedTasks: 1`, `blockedTasks: 0`, `needsReviewTasks: 0`, `needsRevisionTasks: 0`, `releaseReady: false`
- `task-1`: `status: "approved"`, `statusSource: "goal-event-log.v1:evt_364d0646c9a074c4"`, `workerEvidenceRef: "docs/plans/v30-task-1-worker-evidence-2026-06-01.md"`, `reviewEvidenceRef: "docs/plans/v30-task-1-review-evidence-2026-06-01.md"`, `reviewVerdict: "APPROVED"`, `mainVerificationRef: null`

`pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json`

- Exit code: 0
- Contract: `goal-next-action.v1`
- Status: `action-required`
- Next: `taskId: "task-1"`, `role: "main-verifier"`, `phase: "main-verification"`, `blocked: false`
- Reason: `Reviewer approved task-1 but main verification is missing.`
- Evidence state: worker evidence and review evidence refs present; main verification ref missing.
- After completion: register with `symphony goal gate --gate main-verification`; allowed events are `main.verification-passed` and `main.verification-failed`.

`pnpm check`

- Exit code: 0
- Output summary: `node --check` completed for `src/*.js`, `src/adapters/*.js`, `src/ensemble/*.js`, `src/integrations/*.js`, `src/intake/*.js`, `src/symphony/*.js`, `src/trackers/*.js`, `scripts/*.js`, `plugins/eval-replay/*.js`, and `tests/*.test.js`.

`pnpm test`

- Exit code: 0
- Output summary: `tests 739`, `suites 115`, `pass 739`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 6357.265166`.

`pnpm workbench:build`

- Exit code: 0
- Output summary: Vite built the Workbench static bundle successfully.
- Built files reported:
  - `src/symphony/workbench-static/index.html` 0.42 kB, gzip 0.28 kB
  - `src/symphony/workbench-static/assets/index-DEceTgZX.css` 20.62 kB, gzip 3.69 kB
  - `src/symphony/workbench-static/assets/index-B_QbMkSa.js` 932.11 kB, gzip 170.88 kB
- Build duration reported by Vite: `55ms`

`git diff --check`

- Exit code: 0
- Output before writing this evidence: no whitespace errors reported.
- Re-run after writing this evidence: exit code 0, no whitespace errors reported.

## Test coverage checked

`tests/workbench-api-client.test.js` covers a v30 operation-backed projection with one adoptable run and two blocked runs. The fixture verifies candidate count, blocked count, source contract `goal-operation-runs.v1`, operation id, workspace path, source workspace fingerprint, evidence ref normalization to `artifact-ref:artifact:<run-id>:evidence`, changed files, verifier status, `mainWorktreeWrites: false`, and blocked reasons for verifier failure and missing fingerprint.

`tests/workbench-shell.test.js` checks that the v30 adoption candidate panel is mounted, displays source run/workspace/evidence/changed files/verifier status, uses `AdoptionCandidateProjectionV30`, includes `goal-operation-runs.v1` and `symphony.console-runs` fallback, marks the source policy as backend operation/run fields only, and does not include event approval, main verification, release readiness, merge, tag, shell execution, local open, or clipboard paths in the panel body.

## Residual risks

- This verification did not run from a clean `main` checkout and did not perform `git merge --ff-only v30-task-1-adoption-candidate-normalization`. The controller explicitly required current-checkout fallback, so this is recorded as a boundary note rather than a failure.
- The current checkout includes v29 changes, v30 task-0 files, generated static assets, and task-1 worker/review evidence in one dirty worktree. I checked task-1 behavior in that combined state and did not revert unrelated files.
- Actual v29 implementation operations must preserve `sourceWorkspaceFingerprint` for intended adoptable rows. The v30 projection correctly blocks rows when that explicit field is missing.
- Generated Workbench asset filenames are part of the current build output. Packaging should keep that asset churn tied to the final controller-approved branch or commit.

## Recovery steps

If the controller or a later verifier needs clean-main proof, preserve the current evidence, then use a separate clean worktree or controller-managed merge path to run:

```bash
git checkout main
git pull --ff-only
git merge --ff-only v30-task-1-adoption-candidate-normalization
pnpm check
pnpm test
pnpm workbench:build
git diff --check
pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json
```

If task-1 fails after the controller gate is registered, patch only the adoption candidate projection, panel, or focused tests, then re-run:

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json
pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json
```

## Controller handoff

The controller can register `main.verification-passed` for `v30-verified-adoption-workspace-v2` task-1 using this evidence ref:

`docs/plans/v30-task-1-main-verification-evidence-2026-06-01.md`
