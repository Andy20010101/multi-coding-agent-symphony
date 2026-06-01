# v30 task-5 review evidence

Goal id: `v30-verified-adoption-workspace-v2`  
Task id: `task-5`  
Task: Adoption tests, docs, and evidence bridge  
Date: 2026-06-01  
Reviewer status: `APPROVED`

## Review boundary

Required review evidence path: `docs/plans/v30-task-5-review-evidence-2026-06-01.md`.

The checkout is dirty and the current branch is `v30-task-3-adoption-inspect-and-recovery-view`, not the task-5 runbook branch `v30-task-5-adoption-tests-docs-and-evidence-bridge`. The original runbook review expectation was to review the task-5 branch diff. Because this checkout already contains v29/v30 task work, generated Workbench static output, and task evidence files, I used the controller-requested repo-local/current-checkout fallback. I did not switch branches, stash, clean, revert, merge, push, tag, publish, or force checkout.

I did not register Symphony goal events, reviews, gates, release gates, release readiness, or adoption readiness. The coordinator must register the review verdict after reading this evidence.

## Prior needs-revision context

The previous review recorded `NEEDS_REVISION` for `ReferenceError: runner is not defined` in `tests/workbench-api-client.test.js`, event `evt_72baf7aa5320f670`. The reported defect was in `startV30Task2AdoptionFreezeServer`: the server was created with a new `WorkbenchApiReadinessRunner()` but the helper returned `runner` without a local binding.

The revision worker event `evt_04b88733d2736c85` pointed back to `docs/plans/v30-task-5-worker-evidence-2026-06-01.md`. The current code now declares `const runner = new WorkbenchApiReadinessRunner();`, passes that same `runner` to `createSymphonyConsoleServer`, and returns that same object in the test context.

## Evidence checked

- `docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md`
- `docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md`
- `docs/plans/v30-task-5-worker-evidence-2026-06-01.md`
- `docs/plans/v30-release-evidence-2026-06-01.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `src/symphony/console.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- generated Workbench static output under `src/symphony/workbench-static/`

## Re-review result

The `ReferenceError` is fixed. `tests/workbench-api-client.test.js` creates a local runner in `startV30Task2AdoptionFreezeServer`, injects it into the console server, and returns it for assertions.

The route-safety coverage is sufficient for this task:

- Rejected adoption freeze requests with query parameters or unsupported fields return `error-envelope.v1`, do not start the runner, and do not append goal events or operation records.
- A successful adoption freeze records `commandKind: "adoption-plan"` in `goal-operation-runs.v1`, reports the frozen adoption plan state, and leaves goal events unchanged.
- Rejected adoption confirm requests with query parameters or unsupported fields return `error-envelope.v1`, do not start additional runner work, and do not append goal events.
- Successful confirm stays on the existing controlled adoption confirm path, records `commandKind: "adoption-confirm"`, refreshes active goal, events, operations, runs, and next action, and reports `reviewerEventRegistered: false`, `mainVerificationEventRegistered: false`, and `releaseReadinessRegistered: false`.

The Workbench UI/API and docs keep adoption as a verified workflow: adoption candidate normalization, freeze adoption plan, inspect recovery state, then controlled confirm. The reviewed surface does not add direct patch/apply buttons, model invocation, arbitrary shell execution, browser terminal behavior, generic shell runner, permission system, goal framework, artifact framework, command DSL, merge, push, tag, publish, reviewer approval, main verification declaration, or release readiness declaration.

The reviewed docs state that evidence bridge files are inputs for later review and release management. They do not convert filenames, branches, commits, prompt text, task titles, frontend state, test results, operation registry records, or generated docs into task approval, main verification, release gate status, adoption readiness, or release readiness.

## Command results

- `pnpm test -- tests/workbench-api-client.test.js`  
  Result: passed. `38` tests, `1` suite, `38` passed, `0` failed.
- `pnpm test -- tests/workbench-shell.test.js`  
  Result: passed. `25` tests, `2` suites, `25` passed, `0` failed.
- `pnpm check`  
  Result: passed. `node --check` completed for source, scripts, plugins, and tests.
- `pnpm test`  
  Result: passed. `745` tests, `115` suites, `745` passed, `0` failed.
- `pnpm workbench:build`  
  Result: passed. Vite built `src/symphony/workbench-static/index.html`, `assets/index-jAAl_uMe.css`, and `assets/index-BP15T8oN.js`.
- `git diff --check`  
  Result: passed. No output.
- `pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`  
  Result: passed. Tasks `1` through `4` are `main-verified`; task `5` still shows the prior `needs-revision` event `goal-event-log.v1:evt_72baf7aa5320f670`; `releaseReady` is `false`. This is expected before the coordinator registers the new reviewer verdict.
- `pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json`  
  Result: passed. Next action is task `5`, role `reviewer`, phase `review`, reason `Worker evidence exists for task-5 but reviewer verdict is missing.`

## Blockers and residual risks

No blocking findings remain for task-5 review.

Residual risk: this review used the dirty current-checkout fallback instead of a clean task-5 branch diff. The fallback is sufficient for this reviewer pass because the required files, previous defect, focused regressions, full test suite, build, diff whitespace check, and read-only goal commands were checked in the same checkout that the coordinator asked to review.

## Verdict

Verdict: `APPROVED`

reviewStatus: `approved`  
Evidence path: `docs/plans/v30-task-5-review-evidence-2026-06-01.md`
