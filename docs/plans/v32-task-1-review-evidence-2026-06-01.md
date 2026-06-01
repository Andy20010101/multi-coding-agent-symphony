# v32 task-1 review evidence

Date: 2026-06-01

Goal id: `v32-release-manager-workspace-v2`
Release: `v32 Release Manager Workspace v2`
Task id: `task-1`
Task title: Clean release baseline resolver
Reviewer role: `reviewer`
Verdict: `approved`

## Scope checked

Reviewed the task-1 runbook, v32 plan, goal-runbook fixture, worker evidence, touched backend/frontend/docs/tests, generated Workbench static bundle, and current managed goal state.

Task-1 requires the release manager not to make final release judgment from a dirty fallback checkout. The resolver must show current branch, main HEAD, origin/main, worktree cleanliness, and PR/CI ref from explicit backend command output or contracts. Dirty or non-main state must stop at fix guidance and must not make release readiness available.

## Evidence inspected

- `docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md`
- `docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md`
- `fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json`
- `docs/plans/v32-task-1-worker-evidence-2026-06-01.md`
- `src/symphony/console.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `tests/v32-release-baseline-resolver.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/symphony-cli.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DE41mJx0.js`
- `src/symphony/workbench-static/assets/index-BY5UaxlX.css`
- `.symphony/goals/events/v32-release-manager-workspace-v2.ndjson`

## Review findings

No blocking findings.

`src/symphony/console.js` adds `GET /api/goals/<goal-id>/release-baseline` and `/api/goals/latest/release-baseline`. The route is behind the existing GET-only console API boundary, rejects query parameters through the shared goal runbook control parser, resolves a managed goal runbook, loads `goal-next-action.v1`, and runs only fixed backend Git commands:

- `git rev-parse --abbrev-ref HEAD`
- `git rev-parse HEAD`
- `git rev-parse main`
- `git rev-parse origin/main`
- `git status --porcelain=v1`

The response contract is `release-baseline-resolver.v1`. It includes active goal/task/evidence context, command outputs, blockers, dirty paths, PR/CI ref from backend environment fields, and safety flags. Dirty worktree, non-main branch, failed Git command, or main/origin mismatch returns `status: "stopped"` and `decision: "stop-fix-guidance-only"`. Clean main returns only `decision: "clean-main-baseline"`; the note still requires explicit release gates and a separate `release.ready` declaration.

`frontend/workbench/src/api/client.js` fetches the active goal release-baseline route as a read-only GET after resolving the active goal id. It does not add a browser-side command runner.

`frontend/workbench/src/api/contracts.js` projects the resolver into Release Closeout Workspace. The model displays current branch, current head, main head, origin/main head, worktree cleanliness, dirty paths, PR/CI ref, active task/evidence fields, blockers, fixed command outputs, stop/fix guidance, and copy-only baseline commands. `projectReleaseReadyGateRegistration` sets the `release.ready` form to `null` and `workbenchWriteAvailable: false` when the resolver state is blocked.

`frontend/workbench/src/App.jsx` renders the release baseline resolver inside the closeout panel before the release-ready form. The UI displays fields and guidance only. It does not add arbitrary shell execution, model invocation, local file open, download, merge, push, tag, publish, or self-approval controls.

The generated Workbench static bundle contains the release-baseline routes, `ReleaseBaselineResolver` projection, visible panel strings, `baselineReleaseReadinessAllowed`, and `workbenchWriteAvailable` fields.

The docs update the operator guide and product contracts with the v32 resolver boundary. They keep v8 compatibility commands out of the top-level Workbench model.

The tests cover the fixed backend resolver route, query rejection, dirty/non-main stop behavior, read-only client route use, release-ready blocking, Workbench shell visibility, static bundle route list, and the existing no-shell/no-tag/no-v8 boundaries.

## Boundary checks

- Current checkout is dirty and on `v30-task-3-adoption-inspect-and-recovery-view`. Review used the repo-local/current-checkout fallback. I did not clean, stash, reset, revert, merge, push, tag, publish, or switch branches.
- The requested review evidence file already existed as an untracked file with stale command results before this pass. I replaced only `docs/plans/v32-task-1-review-evidence-2026-06-01.md`.
- The managed goal event journal already contains a `reviewer.approved` event for task-1 before this evidence rewrite: actor `v32-task-1-reviewer`, evidence ref `docs/plans/v32-task-1-review-evidence-2026-06-01.md`, event id `evt_3931b8825ce24556`.
- I did not run `symphony goal review`, `symphony goal update`, `symphony goal gate`, or `symphony goal closeout`.
- `.symphony/goals/events/v32-release-manager-workspace-v2.ndjson` shows worker evidence events from worker actors and the review event from a reviewer actor. Worker evidence did not self-approve, did not declare main verification, and did not declare release readiness.
- `pnpm --silent symphony goal events --goal v32-release-manager-workspace-v2 --json` was attempted as a read and exited 64 because `events` is not a goal subcommand. It did not change goal state.

## Required validation commands

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | Node syntax checks passed for source, scripts, plugins, and tests. |
| `pnpm test` | 0 | Full suite passed: 754 tests, 116 suites. |
| `pnpm workbench:build` | 0 | Vite build completed and wrote `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-DE41mJx0.js`. |
| `git diff --check` | 0 | No whitespace errors reported. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | Current ledger reports task-1 `approved`, review evidence ref present, main verification missing, releaseReady `false`. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Current next action is task-1 `main-verifier`, phase `main-verification`, reason `Reviewer approved task-1 but main verification is missing.` |

## Residual risk

Coordinator context in the prompt said task-1 was waiting for reviewer verdict, but the required goal reads now show task-1 already approved and waiting for main verification. This review did not register that approval. Coordinator should treat the suggested command below as a dry-run check only and decide whether any further registration is redundant.

PR/CI ref is exposed through backend environment fields in `release-baseline-resolver.v1`; when no CI environment exists it is shown as missing and does not enable readiness. The existing readiness contract still contains the `gh run list` CI command path used by the fallback projection. I do not consider this blocking for task-1 because the release decision is still stopped unless the explicit backend baseline is clean on main with matching refs.

## Coordinator handoff

Suggested dry-run command:

```bash
pnpm --silent symphony goal review --goal v32-release-manager-workspace-v2 --task task-1 --verdict approved --reviewer codex-v32-task-1-reviewer --evidence-ref docs/plans/v32-task-1-review-evidence-2026-06-01.md --dry-run --json
```
