# v30 task-3 review evidence

Date: 2026-06-01

Goal id: `v30-verified-adoption-workspace-v2`  
Task id: `task-3`  
Task title: `Adoption inspect and recovery view`  
Reviewer id: `codex-v30-task-3-reviewer`  
Worker evidence event: `evt_ed21528591bbe3bf`  
Worker evidence ref: `docs/plans/v30-task-3-worker-evidence-2026-06-01.md`  
Verdict: `APPROVED`

## Scope

This review checked task-3 only. I did not implement product changes outside this evidence file, run `symphony goal update`, run `symphony goal review`, run `symphony goal gate`, merge, push, tag, publish, declare release readiness, confirm adoption, apply adoption, or self-approve.

The checkout is dirty on `v30-task-3-adoption-inspect-and-recovery-view` with earlier v29/v30 work, generated Workbench static assets, and evidence files. I used the repo-local/current-checkout fallback requested by the controller and scoped the verdict to the task-3 inspect/recovery surface.

Original blocked operation: clean branch review against `main` is not reliable from this dirty checkout.  
Fallback used: current checkout, v30 runbook task-3, worker evidence, task-2 worker/review/main-verification evidence, source/diff inspection, generated Workbench static assets, event-log read, and fresh command checks.  
Fallback sufficiency: sufficient for task-3 review because the current checkout contains the backend inspect route hardening, Workbench client/projection/panel, docs, tests, and built static bundle for the inspect/recovery path.

## Evidence reviewed

- `docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md`
- `docs/plans/v30-task-3-worker-evidence-2026-06-01.md`
- `docs/plans/v30-task-2-worker-evidence-2026-06-01.md`
- `docs/plans/v30-task-2-review-evidence-2026-06-01.md`
- `docs/plans/v30-task-2-main-verification-evidence-2026-06-01.md`
- `.symphony/goals/events/v30-verified-adoption-workspace-v2.ndjson`
- `src/symphony/console.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-jAAl_uMe.css`
- `src/symphony/workbench-static/assets/index-B5sMEzXr.js`

## Findings

- `src/symphony/console.js` keeps `GET /api/adoptions/<adoption-id>/inspect` mapped to `buildAdoptionInspectionSummary` and `buildConsoleAdoptionInspectContract`, which are the existing `symphony adopt --inspect <adoption-id> --json` read-only semantics. The route rejects query parameters and invalid decoded route segments with `error-envelope.v1` before the inspect builder runs.
- `frontend/workbench/src/api/client.js` fetches adoption inspection with `GET`, `cache: no-store`, and `Accept: application/json`, then accepts success only for `symphony.console-adoption-inspect`.
- `frontend/workbench/src/api/contracts.js` adds `AdoptionInspectRecoveryViewV30`. The selected frozen plan comes from `goal-operation-runs.v1` `commandKind: "adoption-plan"` operation state, scoped by active goal and active task through `projectAdoptionPlanPreviewWorkspace`. The view displays journal status, latest confirmation run, patch refs, patch hash, before/after file hashes, current worktree match booleans/details, source run/evidence refs, and copy-only inspect command context.
- The automatic initial inspect fetch route is derived from the latest active-goal adoption-plan operation. The projected view only treats the result as inspected when the returned adoption id matches the active-task frozen plan. If a later adoption-plan operation exists for another task, the panel remains available and the button fetches the active-task frozen plan route.
- `frontend/workbench/src/App.jsx` renders `AdoptionInspectRecoveryPanel` after the adoption plan preview workspace. The panel has one action, `Inspect recovery state`, and that action calls only `fetchAdoptionInspection(route)`.
- The task-3 panel body does not include adoption confirm/apply, download, local-file open, shell/model invocation, merge, push, tag, review, main-verification, or release-ready controls. The safety projection marks those capabilities unavailable.
- `tests/workbench-api-client.test.js` covers freeze-to-inspect behavior, inspect projection fields, source run/evidence context, safety booleans, and query-parameter rejection on the inspect route.
- `tests/workbench-shell.test.js` statically checks that the panel exposes journal/hash/worktree/evidence fields and excludes shell, review/gate/release, merge/tag, browser execution, and clipboard paths.
- Product and operator docs describe the v30 inspect/recovery route as read-only, sourced from the frozen adoption-plan operation and inspect output, without confirm/apply or readiness inference.

## Command results

`pnpm check`

- Source: fresh reviewer run.
- Exit code: 0.
- Output: `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`

`node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`

- Source: fresh reviewer run.
- Exit code: 0.
- Summary: 61 tests, 3 suites, 61 pass, 0 fail, duration `418.545791ms`.

`pnpm workbench:build`

- Source: fresh reviewer run.
- Exit code: 0.
- Output summary: Vite transformed 17 modules and wrote `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-jAAl_uMe.css`, and `src/symphony/workbench-static/assets/index-B5sMEzXr.js`; build completed in `60ms`.

`pnpm test`

- Source: fresh reviewer run.
- Exit code: 0.
- Summary: 743 tests, 115 suites, 743 pass, 0 fail, duration `4814.132208ms`.

`git diff --check`

- Source: fresh reviewer run after the Workbench build.
- Exit code: 0.
- Output: no output.

Focused source/static checks:

- `rg -n "Adoption inspect and recovery view|Inspect recovery state|currentWorktreeMatchesAfterHash|latestConfirmationEvidenceArtifactPath|adoptionConfirmAvailable|applyPatchAvailable|genericShellRunner" src/symphony/workbench-static/index.html src/symphony/workbench-static/assets/index-B5sMEzXr.js src/symphony/workbench-static/assets/index-jAAl_uMe.css`
- Result: generated static JS contains the task-3 panel strings, current worktree match fields, latest confirmation evidence field, and false safety projections for adoption confirm/apply/generic shell.

- `rg -n "evt_ed21528591bbe3bf|task-3|v30-task-3-worker-evidence" .symphony/goals/events/v30-verified-adoption-workspace-v2.ndjson docs/plans/v30-task-3-worker-evidence-2026-06-01.md`
- Result: worker evidence event `evt_ed21528591bbe3bf` is present with the expected evidence ref. The same local event log also already contains `evt_5eca9b717ed52455` for `reviewer.approved`; I did not create that event and did not use it as the basis for this verdict.

## Worker evidence trust

I trust the worker-reported command outcomes after rerunning the focused Workbench tests, `pnpm check`, `pnpm workbench:build`, the full `pnpm test`, and `git diff --check` in the current checkout. The fresh results match the worker's claims for the task-3 behavior and did not expose a regression in the changed Workbench/API surface.

## Boundary notes

- I did not run `symphony goal update`, `symphony goal review`, `symphony goal gate`, merge, push, tag, publish, confirm adoption, or apply adoption.
- The local event log already contains a reviewer approval event for task-3, despite the delegated context saying the reviewer verdict is missing. I treated that as pre-existing dirty-checkout state and returned an independent verdict in this file for the controller to reconcile.
- The browser path remains anchored to active goal, active task, adoption-plan operation state, frozen adoption id, inspect output, patch refs, evidence refs, and recovery context.
- The inspect route is read-only and does not execute recommended commands. It rejects query parameters before inspection. Encoded `?` or `#` characters in the path segment are not produced by the Workbench route creator; the backend rejects traversal-like segments but does not separately reject decoded `?` or `#`.
- The view does not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level action model.

## Residual risks

- The current checkout includes unrelated v29/v30 files and generated asset churn. A controller should isolate final merge scope before any merge decision.
- The automatic prefetch route for inspect uses the latest active-goal adoption-plan operation, while the projected frozen plan is active-task scoped. A cross-task latest operation can make the initial projection stay `available` instead of `inspected`, but the visible button still fetches the active-task frozen plan route.
- I did not run an interactive browser screenshot pass. The React shell tests, API integration test, and generated static bundle checks verify the route and panel behavior, but not viewport layout.

## Recovery steps

If a later check finds a task-3 issue, keep the dirty checkout intact until the failure is captured. Patch only the affected inspect route, client wrapper, projection, panel, docs, or focused tests, then rerun:

```text
pnpm check
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
pnpm workbench:build
pnpm test
git diff --check
```

If the problem is route scope, inspect `parseAdoptionInspectRequestPath`, `writeAdoptionInspectResponse`, and `buildAdoptionInspectionSummary`. If the problem is active-task anchoring, inspect `createAdoptionInspectRoute`, `projectAdoptionPlanPreviewWorkspace`, `latestAdoptionPlanFreezeOperationForTask`, and `projectAdoptionInspectRecoveryWorkspace`.

## Controller handoff

Task-3 independent review is complete. The verdict is `approved`.
