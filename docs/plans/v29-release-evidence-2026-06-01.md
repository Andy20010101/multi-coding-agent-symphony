# v29 release evidence

Date: 2026-06-01

Goal id: `v29-active-task-controlled-implementation-workspace`

Release name: `v29 Active Task Controlled Implementation Workspace`

Evidence path: `docs/plans/v29-release-evidence-2026-06-01.md`

Release manager: `codex-v29-release-manager`

## Release scope

v29 connects an active goal task to controlled implementation from the Workbench path:

```text
Open active task -> check implementation eligibility -> preview controlled implementation plan -> confirm isolated workspace run -> watch operation console -> inspect result -> register worker evidence.
```

Scope anchors checked in this checkout:

- `docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md`
- `docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md`
- `docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `.symphony/goals/events/v29-active-task-controlled-implementation-workspace.ndjson`
- `pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json`
- `pnpm --silent symphony goal closeout --goal v29-active-task-controlled-implementation-workspace --json`

The v29 runbook requires these release gates:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

The runbook does not require `release.mutation-gate`, `release.audit-high`, `release.mcas-doctor`, or `release.tag-evidence` for v29 closeout. The CLI contract supports `release.mutation-gate`, `release.audit-high`, and `release.mcas-doctor`; their command outcomes are recorded below.

## Checkout boundary

The checkout was intentionally dirty and remained on branch `v29-task-4-operation-console-and-run-result-bridge`. I used the repo-local/current-checkout fallback requested by the controller. I did not checkout `main`, pull, merge, revert, tag, push, publish, or register any goal events.

`git status -sb` reported tracked v29 changes in Workbench frontend/backend files, docs, tests, generated Workbench static assets, and untracked v29 task evidence docs plus the v29 runbook fixture and generated static assets.

## Task evidence chain

Current `goal-status` reports `totalTasks: 5`, `completedTasks: 5`, `blockedTasks: 0`, `needsReviewTasks: 0`, `needsRevisionTasks: 0`, and `releaseReady: false`.

| Task | Worker evidence | Review evidence | Main verification evidence | Latest task status source |
| --- | --- | --- | --- | --- |
| `task-1` | `docs/plans/v29-task-1-worker-evidence-2026-06-01.md` | `docs/plans/v29-task-1-review-evidence-2026-06-01.md` | `docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md` | `goal-event-log.v1:evt_33fa8dc50fb698e1` |
| `task-2` | `docs/plans/v29-task-2-worker-evidence-2026-06-01.md` | `docs/plans/v29-task-2-review-evidence-2026-06-01.md` | `docs/plans/v29-task-2-main-verification-evidence-2026-06-01.md` | `goal-event-log.v1:evt_da166b77aee1f85c` |
| `task-3` | `docs/plans/v29-task-3-worker-evidence-2026-06-01.md` | `docs/plans/v29-task-3-review-evidence-2026-06-01.md` | `docs/plans/v29-task-3-main-verification-evidence-2026-06-01.md` | `goal-event-log.v1:evt_1736cbfe45b5ddce` |
| `task-4` | `docs/plans/v29-task-4-worker-evidence-2026-06-01.md` | `docs/plans/v29-task-4-review-evidence-2026-06-01.md` | `docs/plans/v29-task-4-main-verification-evidence-2026-06-01.md` | `goal-event-log.v1:evt_c1046524b5e06f49` |
| `task-5` | `docs/plans/v29-task-5-worker-evidence-2026-06-01.md` | `docs/plans/v29-task-5-review-evidence-2026-06-01.md` | `docs/plans/v29-task-5-main-verification-evidence-2026-06-01.md` | `goal-event-log.v1:evt_63efb0ef4d82079b` |

The event log contains worker, independent reviewer approval, and main verification passed events for all five tasks. Task-4 has two reviewer approval events that point at the same review evidence path; the latest task-4 status source is the main verification event, so the duplicate reviewer event does not affect release gate recommendations.

## Release command results

`pnpm check`

Result: exit `0`. `node --check` completed for source files, adapters, ensemble, integrations, intake, symphony modules, trackers, scripts, plugin replay code, and tests.

`pnpm test`

Result: exit `0`. Node test runner reported `tests 739`, `suites 115`, `pass 739`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 4960.655667`.

`pnpm workbench:build`

Result: exit `0`. Vite built the Workbench static output:

- `src/symphony/workbench-static/index.html` at `0.42 kB`, gzip `0.27 kB`
- `src/symphony/workbench-static/assets/index-DEceTgZX.css` at `20.62 kB`, gzip `3.69 kB`
- `src/symphony/workbench-static/assets/index-CdwLo3Cv.js` at `924.57 kB`, gzip `169.48 kB`

`git diff --check`

Result: exit `0`. No whitespace errors were reported.

`pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json`

Result: exit `0`. The ledger reports all five tasks as `main-verified`, no blockers, no review or revision gaps, `releaseReady: false`, and these release gate states: `pnpmCheck: unknown`, `pnpmTest: unknown`, `workbenchBuild: unknown`, `mutationGate: unknown`, `auditHigh: unknown`, `diffCheck: unknown`, `mcasDoctor: unknown`, `docsUpdated: unknown`, `tagEvidence: unknown`.

`pnpm test:mutation:gate`

Result: exit `0`. Stryker completed in 24 minutes and 47 seconds. Final mutation score was `74.22`, which is greater than or equal to the break threshold `60`. Summary: `1762` killed, `6` timed out, `488` survived, `126` no coverage, `0` errors.

`pnpm audit --audit-level high`

Result: exit `0`. Output reported `1 vulnerabilities found` with severity `1 moderate`. No high-severity audit failure was reported at the requested audit level.

`pnpm mcas doctor`

Result: exit `0`. Doctor output reported `status: "ok"`, `nodeVersion: "24.14.0"`, `packageManager: "pnpm"`, and command coverage for `doctor`, `intake`, `github issue`, `harness run-taskpacket`, `queue manual`, `run-next`, `run-task`, `smoke`, and `eval replay`.

## Closeout state before gate registration

`pnpm --silent symphony goal closeout --goal v29-active-task-controlled-implementation-workspace --json`

Result: exit `0`. Closeout reports:

- `workerEvidenceComplete: true`
- `reviewEvidenceComplete: true`
- `mainVerificationComplete: true`
- `releaseReady: false`
- Missing required release gates: `release.pnpm-check`, `release.pnpm-test`, `release.workbench-build`, `release.diff-check`, `release.docs-updated`

`pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json`

Result: exit `0`. Next action is `release-manager` for `release.pnpm-check`, with `afterCompletion.registerWith: "symphony goal gate"` and allowed events `release.gate-passed` and `release.gate-failed`.

## Docs update evidence

Document inspection supports `release.docs-updated`:

- `docs/workbench-operator-guide.md` documents the v29 controlled implementation preview route, confirm route, operation registry behavior, worker evidence handoff path, and the boundary that Workbench does not run shell commands, invoke models, open local files, merge, push, tag, or infer readiness.
- `docs/symphony-product-contracts.md` documents `controlled-implementation-plan-preview.v1`, `controlled-implementation-run-confirmation.v1`, the v29 operation registry fields, the worker evidence handoff projection, and the explicit-event rule for approval, main verification, release gates, and release readiness.
- `docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md` lists the v29 release gates and validation commands.
- `docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md` includes the v29 task list, role prompts, required release gates, and release gate registration commands.
- Task evidence docs exist for worker, review, and main verification for `task-1` through `task-5`, matching the current goal event log evidence refs.

## Gate recommendations

Required v29 gates:

| Gate | Recommendation | Evidence |
| --- | --- | --- |
| `release.pnpm-check` | `passed` | `pnpm check` exited `0`. |
| `release.pnpm-test` | `passed` | `pnpm test` exited `0` with `739` passing tests and `0` failures. |
| `release.workbench-build` | `passed` | `pnpm workbench:build` exited `0` and regenerated the Workbench static assets. |
| `release.diff-check` | `passed` | `git diff --check` exited `0` with no output. |
| `release.docs-updated` | `passed` | Docs inspection found v29 operator guide, product contract, plan, runbook, and task evidence coverage. |

Extra gates supported by the CLI contract:

| Gate | Recommendation | Evidence |
| --- | --- | --- |
| `release.mutation-gate` | `passed` if the controller chooses to register optional extra gates | `pnpm test:mutation:gate` exited `0`; score `74.22` met break threshold `60`. |
| `release.audit-high` | `passed` if the controller chooses to register optional extra gates | `pnpm audit --audit-level high` exited `0`; one moderate vulnerability was reported, no high-level audit failure. |
| `release.mcas-doctor` | `passed` if the controller chooses to register optional extra gates | `pnpm mcas doctor` exited `0` with `status: "ok"`. |

`release.tag-evidence` is supported by the general goal contracts but is not in the v29 runbook release gate list and was not requested for this closeout.

## Release readiness recommendation

Do not declare release readiness before gate registration.

After the controller registers the five required v29 release gates as `passed`, rerun:

```bash
pnpm --silent symphony goal closeout --goal v29-active-task-controlled-implementation-workspace --json
```

If the fresh closeout has no task evidence gaps and no missing required release gates, the controller should register `release.ready` as `declared` with this evidence ref. Release readiness should remain undeclared if any required gate registration fails or closeout still reports a release-gate gap.

## Residual risks

- Release validation ran from the dirty current checkout on `v29-task-4-operation-console-and-run-result-bridge`, not from a clean `main` ref. This follows the controller's fallback instruction, but a clean-main release cut should rerun the required release checks after the v29 changes and evidence docs are adopted.
- The task evidence docs and this release evidence doc are untracked in the current checkout. They are referenced by managed goal events and gate recommendations, so they need to be included in the eventual release commit or adoption path.
- `pnpm test:mutation:gate` passed the configured threshold, but the report still lists `488` survived mutants, `6` timed-out mutants, and `126` no-coverage mutants. This is not a required v29 gate, but it is a concrete follow-up signal.
- `pnpm audit --audit-level high` passed, but the audit output still reports one moderate vulnerability. It is not a high-severity release gate failure.
- This release-manager pass did not perform browser screenshot verification. The release evidence relies on `pnpm test`, `pnpm workbench:build`, command-backed goal contracts, and document inspection.

## Recovery steps

- If any required release gate dry-run or confirm fails, register that gate as failed with this evidence ref and do not declare `release.ready`.
- If the controller edits evidence docs, changes the checkout, or adopts the current changes into a clean worktree, rerun `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, `pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json`, and `pnpm --silent symphony goal closeout --goal v29-active-task-controlled-implementation-workspace --json` before registering release gates.
- If mutation quality becomes a release blocker for this version, prioritize the surviving and timed-out mutants in `src/ensemble/arbitrator.js`, `src/ensemble/ensemble-orchestrator.js`, `src/orchestrator.js`, `src/policy-engine.js`, and `src/verifier.js`, then rerun `pnpm test:mutation:gate`.
- If the clean-main rerun reports missing generated Workbench assets, rerun `pnpm workbench:build` and include the generated `src/symphony/workbench-static/` asset changes with the release.
