# v31 task-5 main verification evidence

Date: 2026-06-01

Goal id: `v31-main-verification-runner-evidence-writer`

Task id: `task-5`

Task title: `Main-verification gate registration flow`

Worker evidence: `docs/plans/v31-task-5-worker-evidence-2026-06-01.md`

Review evidence: `docs/plans/v31-task-5-review-evidence-2026-06-01.md`

Reviewer approved event observed in goal state: `evt_a2d453a28b8ba94d`

Branch observed: `v30-task-3-adoption-inspect-and-recovery-view`

mainVerificationStatus: passed

## Verification basis

I verified the worker and review evidence against the current checkout and the task-5 runbook scope. The implementation connects the Workbench main-verification gate registration panel to the existing `symphony goal gate --gate main-verification --status passed` preview and plan-hash confirm flow.

Relevant evidence checked:

- `frontend/workbench/src/api/contracts.js:1605` adds `mainVerificationGateRegistration` to the active goal model from the runbook, ledger, event log, next action, latest run, readiness, and evidence draft.
- `frontend/workbench/src/api/contracts.js:3107` builds the `MainVerificationGateRegistration` projection from explicit goal/task/evidence/verification state.
- `frontend/workbench/src/api/contracts.js:3184` fixes `gateName` to `main-verification`, and `frontend/workbench/src/api/contracts.js:3191` fixes `gateStatus` to `passed`.
- `frontend/workbench/src/api/contracts.js:3230` exposes the copy-only dry-run command, and `frontend/workbench/src/api/contracts.js:3231` exposes the confirm command pattern with `--confirm --plan-hash sha256:<PLAN_HASH>`.
- `frontend/workbench/src/api/contracts.js:3232` returns `form: null` unless all readiness, draft, evidence, verification, and no-existing-gate inputs are satisfied.
- `frontend/workbench/src/api/contracts.js:3234` through `frontend/workbench/src/api/contracts.js:3249` keeps plan-hash confirm required and records that evidence bodies, evidence file writes, browser execution, model invocation, arbitrary shell, merge, push, tag, release readiness, self-approval, and command-success-as-gate are unavailable.
- `frontend/workbench/src/App.jsx:221` renders `MainVerificationGateRegistrationPanel` in the main verification path.
- `frontend/workbench/src/App.jsx:1967` passes the registration form through the existing `GoalEventFormList`.
- `frontend/workbench/src/App.jsx:5555` and `frontend/workbench/src/App.jsx:5611` route gate preview and confirm through the existing `event-plan-preview` and `event-plan-confirm` command shapes.
- `tests/workbench-api-client.test.js:1826` checks the available registration projection, fixed gate/status, target evidence ref, command pattern, and safety fields.
- `tests/workbench-api-client.test.js:1891` checks blocked registration keeps `form` null and `workbenchWriteAvailable` false.
- `tests/v23-goal-operation-console-api.test.js:193` confirms the backend dry-run plus plan-hash confirm route for `main-verification` gate registration and verifies the appended event changes task state only after confirm.
- `docs/workbench-operator-guide.md` and `docs/symphony-product-contracts.md` document the v31 gate registration path and browser boundaries.

The relevant dirty diff also includes generated Workbench static assets from `pnpm workbench:build`.

## Command results

- `pnpm check`: exit code 0. Output: `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`.
- `pnpm test`: exit code 0. Node test runner reported `tests 751`, `suites 115`, `pass 751`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 5340.039292`.
- `pnpm workbench:build`: exit code 0. Vite v8.0.14 built `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-BY5UaxlX.css`, and `src/symphony/workbench-static/assets/index-DR6VUXbR.js`.
- `git diff --check`: exit code 0. No output.
- `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json`: exit code 0. Output showed task-1 through task-4 as `main-verified`; task-5 as `approved` with worker evidence `docs/plans/v31-task-5-worker-evidence-2026-06-01.md`, review evidence `docs/plans/v31-task-5-review-evidence-2026-06-01.md`, review verdict `APPROVED`, status source `goal-event-log.v1:evt_a2d453a28b8ba94d`, and `mainVerificationRef: null`.
- `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json`: exit code 0. Output showed next action `task-5`, role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-5 but main verification is missing.`, `blocked: false`, worker/review evidence refs present, `mainVerificationRef: null`, and after-completion registration through `symphony goal gate --gate main-verification`.

## Gate readiness

Task-5 is ready for the coordinator's explicit gate registration dry-run and plan-hash confirm. The verification checks passed, reviewer approval is present in the goal event log, and the implementation keeps command success separate from the `main-verification` gate.

This evidence does not register `main.verification-passed`. Current goal state correctly remains `task-5` at `approved` with `mainVerificationRef: null` until the coordinator performs the dry-run and confirm.

## Boundary and fallback notes

- The checkout was dirty before main verification. I did not clean, stash, revert, reset, merge, push, tag, publish, or switch branches.
- Current branch is `v30-task-3-adoption-inspect-and-recovery-view`, not the task branch `v31-task-5-main-verification-gate-registration-flow`.
- Original operation requiring fallback: verify task-5 from the managed v31 runbook while the shared checkout is dirty and on the v30 branch. Fallback used: repo-local/current-checkout verification, with the branch mismatch recorded here.
- This supersedes the operational blocker that task-5 main-verification evidence was missing. It does not supersede the goal-event state blocker; `goal next` will continue to report missing main verification until the coordinator registers the gate.
- I did not register `symphony goal update`, `symphony goal review`, or `symphony goal gate`.
- I did not implement product code, review or approve worker work as reviewer, perform release management, merge, push, tag, publish, or self-approve.
