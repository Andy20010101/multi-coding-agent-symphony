# v32 task-1 main verification evidence

Date: 2026-06-01

Goal id: `v32-release-manager-workspace-v2`
Release: `v32 Release Manager Workspace v2`
Task id: `task-1`
Task title: Clean release baseline resolver
Verifier role: `main-verifier`
mainVerificationStatus: `passed`

## Verification basis

- Runbook and plan checked:
  - `docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md`
  - `docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md`
  - `fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json`
- Worker evidence exists at `docs/plans/v32-task-1-worker-evidence-2026-06-01.md`.
- Review evidence exists at `docs/plans/v32-task-1-review-evidence-2026-06-01.md` and records `Verdict: approved`.
- Goal event log `.symphony/goals/events/v32-release-manager-workspace-v2.ndjson` has two `worker.evidence-recorded` events for task-1, both pointing to `docs/plans/v32-task-1-worker-evidence-2026-06-01.md`.
- The same event log has `reviewer.approved` for task-1, event id `evt_3931b8825ce24556`, actor `v32-task-1-reviewer`, evidence ref `docs/plans/v32-task-1-review-evidence-2026-06-01.md`. Reviewer actor differs from worker actors `v32-task-1-worker` and `codex-v32-task-1-worker`.
- No task-1 `main-verification` gate or `release.ready` event is present before this handoff.

The duplicate worker evidence events are not a blocker. They are both worker events, cite the same worker evidence ref, and do not claim review approval, main verification, or release readiness.

## Code and contract findings

- `src/symphony/console.js` exposes `GET /api/goals/<goal-id>/release-baseline` and `GET /api/goals/latest/release-baseline`. The route rejects query parameters and resolves a managed goal runbook before building `release-baseline-resolver.v1`.
- The backend resolver runs only fixed Git commands through the server runner:
  - `git rev-parse --abbrev-ref HEAD`
  - `git rev-parse HEAD`
  - `git rev-parse main`
  - `git rev-parse origin/main`
  - `git status --porcelain=v1`
- The resolver response includes current branch, current head, main HEAD, origin/main, worktree cleanliness, dirty paths, PR/CI ref from backend environment fields, command outputs, active goal/task/evidence context, blockers, and safety flags.
- Dirty, non-main, failed Git command, or main/origin mismatch returns `status: "stopped"` and `decision: "stop-fix-guidance-only"`. Safety keeps `releaseReadyDeclared: false` and `dirtyOrNonMainIsFinalReadiness: false`.
- `frontend/workbench/src/api/contracts.js` projects the resolver into `ReleaseBaselineResolver`, keeps `sourcePolicy` tied to backend command output, and blocks `release.ready` registration when the baseline state is `blocked`.
- `frontend/workbench/src/App.jsx` renders the resolver in Release Closeout before the `release.ready` registration area. The dirty/non-main path renders fields and stop/fix guidance, not an available release-ready form.
- `docs/workbench-operator-guide.md` and `docs/symphony-product-contracts.md` describe the v32 boundary: resolver state comes from backend git/GitHub outputs and explicit contracts; dirty/non-main baselines show stop/fix guidance only.
- Tests cover the backend route, query rejection, fixed command list, dirty/non-main stop behavior, release-ready blocking, static Workbench route list, and the existing no-shell/no-tag/no-v8 boundaries:
  - `tests/v32-release-baseline-resolver.test.js`
  - `tests/workbench-api-client.test.js`
  - `tests/workbench-shell.test.js`
  - `tests/symphony-cli.test.js`

State/readiness is not inferred from branch name, file name, commit message, prompt text, task title, frontend state, or test names. The checked path uses `goal-event-log.v1`, `goal-progress-ledger.v1`, `goal-next-action.v1`, `goal-closeout-report.v1`, and `release-baseline-resolver.v1` command outputs/contracts.

## Live resolver check

Local console server was started with:

```bash
pnpm symphony console --host 127.0.0.1 --port 8765
```

Read-only endpoint checked:

```bash
curl -sS http://127.0.0.1:8765/api/goals/v32-release-manager-workspace-v2/release-baseline
```

Observed resolver summary:

```json
{
  "contractName": "release-baseline-resolver.v1",
  "goalId": "v32-release-manager-workspace-v2",
  "taskId": "task-1",
  "role": "main-verifier",
  "phase": "main-verification",
  "status": "stopped",
  "decision": "stop-fix-guidance-only",
  "currentBranch": "v30-task-3-adoption-inspect-and-recovery-view",
  "mainHead": "4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2",
  "originMain": "4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2",
  "worktreeClean": false,
  "dirtyFileCount": 25,
  "prCiRef": {
    "state": "missing",
    "refName": null,
    "fullRef": null,
    "sha": null,
    "source": "environment"
  },
  "blockers": [
    "non-main-branch",
    "dirty-worktree"
  ],
  "commands": [
    "git rev-parse --abbrev-ref HEAD => passed/0",
    "git rev-parse HEAD => passed/0",
    "git rev-parse main => passed/0",
    "git rev-parse origin/main => passed/0",
    "git status --porcelain=v1 => passed/0"
  ],
  "releaseReadyDeclared": false,
  "dirtyOrNonMainIsFinalReadiness": false
}
```

This satisfies task-1's user path. The dirty non-main checkout is visible, main/origin refs are shown, PR/CI ref is explicitly missing from backend environment, and Workbench stops at fix guidance.

## Browser UI check

Opened `http://127.0.0.1:8765/workbench/` in the in-app Browser.

The Release Closeout panel rendered `release baseline resolver` with:

- `modelName`: `ReleaseBaselineResolver`
- `sourcePolicy`: `release-baseline-resolver.v1 fixed backend git command outputs + active goal context`
- `currentBranch`: `v30-task-3-adoption-inspect-and-recovery-view`
- `mainHead`: `4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2`
- `originMainHead`: `4537efc911e0c6d31bbf11cf2fd67c2eae1f95b2`
- `worktree.clean`: `false`
- `releaseReadinessAllowed`: `false`
- `finalJudgmentFromFallbackCheckout`: `false`
- `PR / CI ref`: `status missing`, `source environment`
- `fixed command outputs`
- `stop / fix guidance`

The same page showed `release.ready gate registration` with:

- `state`: `blocked`
- `baselineState`: `blocked`
- `baselineReleaseReadinessAllowed`: `false`
- `workbenchWriteAvailable`: `false`
- `dirtyOrNonMainBlocksFinalJudgment`: `true`
- stop/fix guidance only

The browser check did not use or reveal an arbitrary shell runner, model invocation, local file opener, artifact download, merge, push, tag, publish, self-approval path, or a mounted `release.ready` gate form for this stopped baseline. Copy-only command text remains visible as text.

## Required validation commands

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm check` | 0 | Node syntax checks passed for source, scripts, plugins, and tests. |
| `pnpm test` | 0 | Full suite passed: 754 tests, 116 suites, 0 failures. |
| `pnpm workbench:build` | 0 | Vite built `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-DE41mJx0.js`. |
| `git diff --check` | 0 | No whitespace errors reported. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | `goal-progress-ledger.v1`; task-1 status `approved`, worker/review evidence refs present, review verdict `APPROVED`, `mainVerificationRef: null`, `releaseReady: false`. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | `goal-next-action.v1`; next action is task-1 `main-verifier`, phase `main-verification`, reason `Reviewer approved task-1 but main verification is missing.` |

## Boundary and fallback notes

- Current checkout is dirty and on `v30-task-3-adoption-inspect-and-recovery-view`.
- The runbook's ideal main verification flow includes `git checkout main`, `git pull --ff-only`, and `git merge --ff-only v32-task-1-clean-release-baseline-resolver`. The current task prompt forbids cleaning, stashing, resetting, reverting, merging, pushing, tagging, publishing, or requesting manual approval, so that flow was blocked by boundary.
- Fallback used: repo-local/current-checkout verification with explicit backend endpoint output, browser UI check, source/test/doc inspection, event log inspection, and the required validation commands.
- Residual risk: this pass did not verify the task after an actual clean-main fast-forward merge. The resolver specifically detected and blocked the current dirty non-main baseline, which is task-1's release-manager value.
- No `symphony goal gate`, `symphony goal update`, `symphony goal review`, `symphony goal closeout`, merge, push, tag, publish, clean, stash, reset, or revert command was run by this verifier.
- `pnpm workbench:build` was required and was run as a validation command. No generated product files were manually edited or reverted.

## Suggested gate registration command

```bash
pnpm --silent symphony goal gate --goal v32-release-manager-workspace-v2 --task task-1 --gate main-verification --status passed --verifier codex-v32-task-1-main-verifier --evidence-ref docs/plans/v32-task-1-main-verification-evidence-2026-06-01.md --dry-run --json
```
