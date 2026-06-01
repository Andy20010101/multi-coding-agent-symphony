# v32 task-1 worker evidence

Date: 2026-06-01

Goal id: `v32-release-manager-workspace-v2`
Release: `v32 Release Manager Workspace v2`
Task id: `task-1`
Task title: Clean release baseline resolver
Worker role: `worker`
Expected evidence path: `docs/plans/v32-task-1-worker-evidence-2026-06-01.md`

## Current checkout

- Branch observed before implementation: `v30-task-3-adoption-inspect-and-recovery-view`.
- Worktree state before implementation: dirty, with existing v29-v31 evidence docs, v32 runbook fixture, Workbench source changes, static Workbench assets, docs updates, and tests already present.
- Boundary used: repo-local/current-checkout fallback. I did not clean, stash, reset, revert, merge, push, tag, publish, or switch branches.
- Managed goal state: `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` returned `task-1`, role `worker`, phase `implement`, reason `No explicit worker evidence is recorded for task-1.`

## Implementation summary

Implemented a read-only release baseline resolver for Workbench:

- Added `GET /api/goals/<goal-id>/release-baseline` and `/api/goals/latest/release-baseline`.
- Resolver runs only fixed backend Git commands: current branch, current HEAD, `main`, `origin/main`, and porcelain worktree status.
- Resolver anchors output to the active managed goal/task context from `goal-runbook.v1` and `goal-next-action.v1`.
- Workbench projects the resolver into the release closeout area with current branch, main HEAD, origin/main, worktree cleanliness, PR/CI env ref, active task/evidence refs, fixed command outputs, and stop/fix guidance.
- Dirty or non-main baseline returns `status: "stopped"` / `decision: "stop-fix-guidance-only"` and blocks release-ready judgment. It does not register gates or declare release readiness.

Live repo-local endpoint check after implementation:

```json
{
  "status": 200,
  "contractName": "release-baseline-resolver.v1",
  "goalId": "v32-release-manager-workspace-v2",
  "taskId": "task-1",
  "role": "worker",
  "decision": "stop-fix-guidance-only",
  "resolverStatus": "stopped",
  "currentBranch": "v30-task-3-adoption-inspect-and-recovery-view",
  "worktreeClean": false,
  "dirtyFileCount": 25,
  "blockers": ["non-main-branch", "dirty-worktree"]
}
```

## Files changed for this task

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
- `src/symphony/workbench-static/assets/index-BY5UaxlX.css`
- `src/symphony/workbench-static/assets/index-DE41mJx0.js`
- `src/symphony/workbench-static/assets/index-B9IfCFVY.css` removed by the current Workbench build output.
- `src/symphony/workbench-static/assets/index-NKKg_tJp.js` removed by the current Workbench build output.

Workbench build output also reflects the existing dirty static asset state under `src/symphony/workbench-static/assets/`.

## Commands run

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | JavaScript syntax checks passed. |
| `pnpm test` | 0 | Full suite passed: 754 tests, 116 suites. |
| `pnpm workbench:build` | 0 | Vite build completed; static Workbench bundle written. |
| `git diff --check` | 0 | No whitespace errors reported. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | Ledger returned `goal-progress-ledger.v1`; all five v32 tasks remain `planned`; `releaseReady` is `false`. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Confirmed next action remains task-1 worker evidence. |

Additional checks:

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `node --check src/symphony/console.js` | 0 | Backend console syntax check passed. |
| `node --test tests/v32-release-baseline-resolver.test.js` | 0 | Focused resolver route checks passed. |
| `node --test tests/workbench-api-client.test.js` | 0 | Workbench client projection and release.ready blocking checks passed. |
| `node --test tests/workbench-shell.test.js` | 0 | Workbench shell source checks passed. |
| `node --test tests/symphony-cli.test.js` | 0 | CLI readiness projection checks passed with main/origin fields. |
| Local console endpoint fetch for `/api/goals/v32-release-manager-workspace-v2/release-baseline` | 0 | Returned stopped baseline for dirty non-main checkout. |

Browser verification: started `pnpm symphony console --host 127.0.0.1 --port 8765` and opened `http://127.0.0.1:8765/workbench/` in the in-app Browser. The rendered page showed the v32 active goal, `release baseline resolver`, `currentBranch`, `mainHead`, `originMainHead`, `worktree.clean`, `stop / fix guidance`, `release.ready gate registration`, `baselineStopReason`, `baselineReleaseReadinessAllowed: false`, and `workbenchWriteAvailable: false`. The release.ready panel was blocked because the checkout is on `v30-task-3-adoption-inspect-and-recovery-view` and the worktree is dirty.

## Boundary notes

- No `goal update`, `goal review`, `goal gate`, `goal closeout`, tag, push, publish, merge, clean, stash, reset, or revert was run.
- Workbench UI still uses the latest goal/runbook/next-action model. v8 compatibility commands are not introduced as top-level Workbench actions.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, publish, or self-approve.
- Resolver state comes from explicit backend command outputs and managed goal contracts. Dirty/non-main checkout state is guidance only and is not release readiness.
- This worker did not approve its own work and did not implement task-2 through task-5.

## Recovery steps

- If the resolver reports `non-main-branch`, switch to a clean `main` checkout outside Workbench before final release judgment.
- If the resolver reports `dirty-worktree`, inspect and resolve dirty files outside Workbench, then reload Workbench or refetch the resolver endpoint.
- If `main-origin-mismatch` appears, update refs outside Workbench and rerun the resolver after `main` and `origin/main` match.
- If Git command output is unavailable, run the fixed Git checks in a terminal from the repository checkout and restart the console server.

## Reviewer handoff checklist

- Review `release-baseline-resolver.v1` route behavior for latest and explicit goal ids.
- Confirm dirty/non-main states show stop/fix guidance and keep release.ready unavailable.
- Confirm clean main baseline does not itself declare release readiness.
- Confirm Workbench panels remain display/copy-only and do not add a generic shell runner.
- Re-run `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, and goal-status if reviewing on a clean branch.
