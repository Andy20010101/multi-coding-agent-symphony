# v43 task-2 worker evidence

Goal: `v43-goal-supervisor-stabilization`
Task: `task-2` - Workspace and evidence safety
Role: `worker`
Thread: `019ea2da-0fca-7932-a97c-6b92b42e6fd8`
Branch: `v43-task-2-workspace-evidence-safety`
Worktree: `/Users/andy/.codex/worktrees/v43-task-2-workspace-evidence-safety`
Base commit: `0d4d452626da7c86483d37dd06fcc428660898ea`
Date: `2026-06-07`

## Sources checked

- `docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md`
- `docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md`
- `docs/plans/v43-goal-supervisor-stabilization-evidence-skeletons-2026-06-07.md`
- `src/symphony/supervisor-runner.js`
- `src/symphony/workspace-evidence-safety.js`
- `tests/v38-supervisor-runner.test.js`
- `tests/v43-workspace-evidence-safety.test.js`

## Implementation summary

- Added `workspace-evidence-safety.v1` helpers for dependency readiness, deterministic setup blocker records, dirty-baseline inheritance records, file inventory, root checkout mutation guards, evidence-location validation, and gate-failure classification.
- Wired the supervisor runner to block controller creation or completed-result consumption when an assigned worktree is not dependency-ready, evidence is missing from the assigned worktree, evidence exists only in the root checkout, evidence points outside the assigned worktree, or supplied root checkout before/after status snapshots differ.
- Added supervisor options for assigned worktree, root checkout, runtime workspace roots, and explicit root status snapshots. The runner consumes supplied snapshots only; it does not execute Git or mutate workspace state.
- Added task-specific tests covering the replay matrix rows for missing dependencies, setup failure, dirty-baseline inheritance, file inventory, root mutation, invalid evidence location, root-only evidence, and gate-failure classification.

## Files changed

- `src/symphony/supervisor-runner.js`
- `src/symphony/workspace-evidence-safety.js`
- `tests/v43-workspace-evidence-safety.test.js`
- `docs/plans/v43-task-2-worker-evidence-2026-06-07.md`
- `docs/plans/v43-task-1-review-evidence-2026-06-07.md` inherited from prepared task-1 baseline
- `docs/plans/v43-task-1-main-verification-evidence-2026-06-07.md` inherited from prepared task-1 baseline

## Task-specific proof

- Missing dependency blocker: `tests/v43-workspace-evidence-safety.test.js` creates a package worktree without `node_modules/.pnpm`; `inspectDependencyReadiness` returns `missing-node-modules`, `dispatchAllowed: false`, and the supervisor plan stops with `workspace-dependency-preflight-blocked`.
- Deterministic setup blocker: `prepareWorkspaceForDispatch` records `workspace-dependency-setup-required` when no setup runner is supplied and `workspace-dependency-setup-failed` when the deterministic offline setup attempt exits non-zero.
- Dirty-baseline inheritance: `recordDirtyBaselineInheritance` records source task id, source worktree, target worktree, branch, base commit, copied files, deleted files, and dependency setup details.
- File inventory: `collectFileInventoryFromGitStatus` separates tracked modifications, staged changes, deletions, and untracked files from porcelain status.
- Root checkout mutation guard: `buildRootCheckoutMutationGuard` blocks event registration when before/after inventory fingerprints differ. A supervisor-plan test verifies the same guard blocks completed-result registration with `root-checkout-mutation-rejected`.
- Evidence location: `validateEvidenceLocation` rejects absolute paths outside the assigned worktree, evidence that exists only in the root checkout, and missing assigned-worktree evidence before event registration.
- Gate failure classification: `classifyGateFailure` distinguishes environment setup failures, command typos, implementation failures, and optional diagnostic failures.

## Commands run with exact results

| Command | Outcome |
| --- | --- |
| `node --check src/symphony/supervisor-runner.js && node --check src/symphony/workspace-evidence-safety.js && node --test tests/v43-workspace-evidence-safety.test.js tests/v38-supervisor-runner.test.js` | Exit `0`. `12` tests passed, `0` failed. |
| `pnpm check` | Exit `0`. `node --check` completed across source, scripts, plugins, and tests. |
| `pnpm test` | Exit `0`. `1103` tests passed, `0` failed. |
| `pnpm workbench:build` | Exit `0`. Vite built `src/symphony/workbench-static/index.html`, `assets/index-CILC3208.css`, and `assets/index-3PVjv4nj.js`. |
| `git diff --check` | Exit `0`. No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json` | Exit `64`. Returned `{"version":"1","status":"error","exitCode":64,"message":"goal not found"}` because this assigned worktree has no local `.symphony` goal state. I did not initialize or mutate supervisor state. |

## Workspace safety notes

- The implementation keeps setup execution outside the dry-run supervisor runner. The runner records readiness and blockers from deterministic inputs instead of running install commands itself.
- Root checkout mutation detection uses explicit before/after porcelain snapshots supplied by the controller. This avoids hidden shell execution while preserving a concrete event-registration gate.
- Evidence validation is anchored to the assigned worktree. Root checkout evidence does not satisfy a completed child result.
- The assigned checkout started with inherited task-1 evidence changes recorded by the lease preparation step. I preserved those files and added the task-2 implementation and evidence on top.

## Reviewer handoff checklist

- Confirm that a known-bad package worktree cannot reach controller dispatch.
- Confirm that root checkout mutation blocks completed-result registration before `goal update`, `goal review`, or `goal gate`.
- Confirm that evidence in the root checkout alone is rejected when the assigned worktree lacks the evidence file.
- Confirm that the file inventory covers tracked, staged, deleted, and untracked files.
- Confirm that the supervisor runner remains read-only and does not execute Git, install commands, provider CLIs, release closeout, tag, push, publish, audit, doctor, or mutation gates.
