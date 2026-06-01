# v30 task-5 worker evidence

Goal id: `v30-verified-adoption-workspace-v2`  
Task id: `task-5`  
Task: Adoption tests, docs, and evidence bridge  
Date: 2026-06-01  
Worker status: completed

## Checkout boundary

Requested branch: `v30-task-5-adoption-tests-docs-and-evidence-bridge`  
Actual checkout branch: `v30-task-3-adoption-inspect-and-recovery-view`

The checkout was already dirty with v29/v30 Workbench changes and task-4 generated/static output when this worker started. I used the current-checkout fallback requested by the controller and did not switch branches, stash, revert, clean, merge, push, tag, or publish.

## Implementation summary

- Added a Workbench shell regression that treats the v30 adoption path as a verified workflow: adoption candidate normalization, adoption plan freeze, inspect/recovery, and controlled confirm. The test checks that the UI does not expose direct patch/apply, model, shell, merge, push, tag, publish, reviewer approval, main verification, or release readiness controls.
- Added route-safety regression coverage for rejected adoption freeze and confirm requests with unsupported query input. The tests assert the rejected requests do not start the backend runner and do not append goal events.
- Displayed controlled adoption confirm safety fields in the Workbench confirm result: `genericShellRunner`, `modelInvocationAvailable`, `reviewerEventRegistered`, `mainVerificationEventRegistered`, `releaseReadinessRegistered`, `mergeAvailable`, `pushAvailable`, `tagAvailable`, and `publishAvailable`.
- Added operator guide and product contract text for the v30 adoption evidence bridge. The docs state that task evidence and release evidence docs are not reviewer approval, main verification, release gate status, or release readiness.
- Added `docs/plans/v30-release-evidence-2026-06-01.md` as a bridge document for release-manager gate review. It lists evidence inputs and boundaries without declaring release readiness.

## Files changed by this worker

- `frontend/workbench/src/App.jsx`
- `src/symphony/console.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v30-release-evidence-2026-06-01.md`
- `docs/plans/v30-task-5-worker-evidence-2026-06-01.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-jAAl_uMe.css`
- `src/symphony/workbench-static/assets/index-BP15T8oN.js`

`pnpm workbench:build` also interacted with generated static assets that were already dirty before this worker started.

## Commands run

- `pnpm test -- tests/workbench-shell.test.js`  
  Exit code: `0`. Result: `25` tests, `2` suites, `25` passed, `0` failed, duration `383.720167ms`.
- `pnpm test -- tests/workbench-api-client.test.js`  
  Exit code: `0`. Result: `38` tests, `1` suite, `38` passed, `0` failed, duration `283.697417ms`.
- `pnpm check`  
  Exit code: `0`. Result: `node --check` completed for source, scripts, plugins, and tests.
- `pnpm test`  
  Exit code: `0`. Result: `745` tests, `115` suites, `745` passed, `0` failed, duration `5515.851834ms`.
- `pnpm workbench:build`  
  Exit code: `0`. Result: Vite built `src/symphony/workbench-static/index.html`, `assets/index-jAAl_uMe.css`, and `assets/index-BP15T8oN.js` in `57ms`.
- `git diff --check`  
  Exit code: `0`. Result: no output.
- `pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`  
  Exit code: `0`. Result: `goal-progress-ledger.v1`; tasks `1` through `4` are `main-verified`; task `5` is `needs-revision` from `goal-event-log.v1:evt_72baf7aa5320f670`; `releaseReady` is `false`.
- `pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json`  
  Exit code: `0`. Result: `goal-next-action.v1`; next action is `task-5`, role `worker`, phase `revision`; reason `Latest reviewer verdict for task-5 is reviewer.needs-revision.`

## Workbench user path covered

The task-5 test coverage checks that the visible path remains:

```text
adoption candidate -> freeze adoption plan -> inspect recovery state -> confirm adoption
```

The route tests and projection tests cover:

- `POST /api/goals/<goal-id|latest>/adoption-plan-freeze`
- `GET /api/adoptions/<adoption-id>/inspect`
- `POST /api/goals/<goal-id|latest>/adoption-confirm`
- active-goal refresh after confirm: `goal-status`, `goal-events`, `goal-operation-runs`, `runs`, and `goal-next-action`
- rejected freeze/confirm query probes return controlled error envelopes without starting the runner or appending goal events

## Boundary notes

- I did not run model invocations through Workbench.
- I did not add arbitrary shell execution, browser terminal behavior, generic shell runner, permission system, goal framework, artifact framework, or command DSL.
- I did not register Symphony goal events, reviews, gates, release gates, release readiness, or adoption readiness.
- I did not self-approve, review my own work, declare main verification, or declare release readiness.
- I did not merge, push, tag, publish, clean, stash, revert, or force checkout.
- The adoption evidence bridge documents evidence inputs only. It does not convert filenames, branch names, commits, prompt text, task titles, frontend state, test results, or generated docs into approval, main verification, adoption readiness, or release readiness.

## Reviewer handoff checklist

- Review the `tests/workbench-shell.test.js` task-5 regression and confirm it covers the adoption path as verified workflow evidence rather than direct patch/apply controls.
- Review the `frontend/workbench/src/App.jsx` confirm-result safety fields against `controlled-adoption-confirmation.v1`.
- Review `docs/workbench-operator-guide.md`, `docs/symphony-product-contracts.md`, and `docs/plans/v30-release-evidence-2026-06-01.md` for the no-model, no-arbitrary-shell, no-main-verification, and no-release-readiness boundaries.
- Rerun `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check` before independent review.

## Revision after reviewer needs-revision

Reviewer event: `evt_72baf7aa5320f670`  
Reviewer evidence: `docs/plans/v30-task-5-review-evidence-2026-06-01.md`  
Revision status: completed

### Exact fix

- `tests/workbench-api-client.test.js`: `startV30Task2AdoptionFreezeServer` now declares a local `const runner = new WorkbenchApiReadinessRunner();`, passes that same `runner` to `createSymphonyConsoleServer`, and returns that same `runner` in the test context. This fixes the reviewer-reported `ReferenceError: runner is not defined` path and preserves the existing assertions that rejected freeze/confirm requests do not start the runner.
- `docs/plans/v30-task-5-worker-evidence-2026-06-01.md`: added this revision note for controller registration.

### Revision command results

The repaired rerun results are recorded in `Commands run` above. They include both focused Workbench tests, `pnpm check`, the full `pnpm test` suite, `pnpm workbench:build`, `git diff --check`, `goal-status`, and `goal next`, all with exit code `0`.

### Revision boundary notes

- I used the current dirty checkout fallback and did not switch branches. The actual checkout branch remains `v30-task-3-adoption-inspect-and-recovery-view`; the requested task branch remains `v30-task-5-adoption-tests-docs-and-evidence-bridge`.
- I did not register Symphony goal events, reviews, gates, release gates, release readiness, or adoption readiness.
- I did not self-approve, review my own work, declare main verification, or declare release readiness.
- I did not merge, push, tag, publish, clean, stash, revert, or force checkout.
