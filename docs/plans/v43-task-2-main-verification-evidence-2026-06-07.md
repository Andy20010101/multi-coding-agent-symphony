# v43 task-2 main verification evidence

Goal: `v43-goal-supervisor-stabilization`
Task: `task-2` - Workspace and evidence safety
Role: `main-verifier`
Thread: `019ea2e2-5d01-7b02-9b32-30cfdb08cf27`
Branch verified: `v43-task-2-workspace-evidence-safety`
Worktree verified: `/Users/andy/.codex/worktrees/v43-task-2-workspace-evidence-safety`
Base commit: `0d4d452626da7c86483d37dd06fcc428660898ea`
Worker head verified: `40ea661f29c8418e52f199698a6acf1f71e7ed0d`
Reviewer head verified: `eb22e8afc031bb7accdab8ce8b729f179ab0d8f8`
Verification date: `2026-06-08`

## Verdict

`PASSED`

Task-2 satisfies the v43 runbook acceptance for workspace and evidence safety.

## Sources checked

- `docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md`
- `/Users/andy/.codex/local-goal-supervisor/results/v43-goal-supervisor-stabilization/019ea2da-0fca-7932-a97c-6b92b42e6fd8.txt`
- `/Users/andy/.codex/local-goal-supervisor/results/v43-goal-supervisor-stabilization/019ea2df-12bf-74c0-9ce3-a17def305a00.txt`
- `docs/plans/v43-task-2-worker-evidence-2026-06-07.md`
- `docs/plans/v43-task-2-review-evidence-2026-06-07.md`
- `src/symphony/supervisor-runner.js`
- `src/symphony/workspace-evidence-safety.js`
- `tests/v43-workspace-evidence-safety.test.js`

## Acceptance verification

- Dependency readiness is checked before dispatch through `inspectDependencyReadiness` and `buildSupervisorRunnerPlan` workspace preflight.
- Known-bad worktrees are blocker states. Missing package dependencies stop with `workspace-dependency-preflight-blocked`, and deterministic setup failures are recorded by `prepareWorkspaceForDispatch`.
- Dirty-baseline inheritance records source task id, source worktree, target worktree, branch, base commit, copied files, deleted files, and dependency setup details.
- Verification inventory records tracked modifications, staged changes, deletions, and untracked files from Git porcelain status.
- Root checkout mutation protection blocks completed-result registration when controller-supplied before and after root inventories differ.
- Evidence-location validation rejects evidence outside the assigned worktree, missing in the assigned worktree, or present only in the root checkout.
- The implementation remains inside the supervisor dry-run boundary. It does not add Git execution, install execution, provider CLI execution, release closeout, tag, push, publish, audit, doctor, or mutation gates.

## Commands run

| Command | Result |
| --- | --- |
| `pwd && git rev-parse --show-toplevel && git status --short --branch && git rev-parse HEAD` | Exit `0`. Confirmed assigned worktree `/Users/andy/.codex/worktrees/v43-task-2-workspace-evidence-safety`, clean branch, initial verifier HEAD `eb22e8afc031bb7accdab8ce8b729f179ab0d8f8`. |
| `find .. -name AGENTS.md -print` | Exit `0`. No repository `AGENTS.md` file was present under the searched worktree parent. |
| `sed -n '1,240p' docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md` | Exit `0`. Confirmed task-2 acceptance and evidence refs. |
| `sed -n '1,260p' docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md` | Exit `0`. Confirmed scoped gates and forbidden commands. |
| `cat /Users/andy/.codex/local-goal-supervisor/results/v43-goal-supervisor-stabilization/019ea2da-0fca-7932-a97c-6b92b42e6fd8.txt` | Exit `0`. Confirmed worker result points to this worktree and `docs/plans/v43-task-2-worker-evidence-2026-06-07.md`. |
| `cat /Users/andy/.codex/local-goal-supervisor/results/v43-goal-supervisor-stabilization/019ea2df-12bf-74c0-9ce3-a17def305a00.txt` | Exit `0`. Confirmed reviewer approval points to this worktree and `docs/plans/v43-task-2-review-evidence-2026-06-07.md`. |
| `sed -n '1,220p' docs/plans/v43-task-2-worker-evidence-2026-06-07.md` | Exit `0`. Read worker evidence. |
| `sed -n '1,220p' docs/plans/v43-task-2-review-evidence-2026-06-07.md` | Exit `0`. Read reviewer evidence and approval. |
| `git diff --stat 0d4d452626da7c86483d37dd06fcc428660898ea..HEAD && git diff --name-status 0d4d452626da7c86483d37dd06fcc428660898ea..HEAD` | Exit `0`. Confirmed task-2 implementation, tests, worker evidence, review evidence, and inherited task-1 evidence files. |
| `sed -n '1,560p' src/symphony/workspace-evidence-safety.js` | Exit `0`. Inspected dependency, setup blocker, inventory, root mutation, evidence validation, and failure classification helpers. |
| `git diff 0d4d452626da7c86483d37dd06fcc428660898ea..HEAD -- src/symphony/supervisor-runner.js` | Exit `0`. Inspected supervisor runner integration. |
| `sed -n '1,430p' tests/v43-workspace-evidence-safety.test.js` | Exit `0`. Inspected task-specific replay coverage. |
| `node --check src/symphony/supervisor-runner.js && node --check src/symphony/workspace-evidence-safety.js && node --test tests/v43-workspace-evidence-safety.test.js tests/v38-supervisor-runner.test.js` | Exit `0`. `12` tests passed, `0` failed. |
| `rg -n "exec|spawn|child_process|goal update|goal review|goal gate|tag|push|publish|audit|doctor|mutation|provider|claude|gemini|kiro|deepseek" src/symphony/supervisor-runner.js src/symphony/workspace-evidence-safety.js tests/v43-workspace-evidence-safety.test.js` | Exit `0`. Matches were test names, porcelain status terms, or command strings; no new execution path was found. |
| `git diff --check 0d4d452626da7c86483d37dd06fcc428660898ea..HEAD` | Exit `0`. No whitespace errors in the task diff. |
| `pnpm check` | Exit `0`. Repository syntax check passed. |
| `pnpm test` | Exit `0`. `1103` tests passed, `0` failed. |
| `pnpm workbench:build` | Exit `0`. Vite built the Workbench static bundle. |
| `git status --short --branch && git diff --stat` | Exit `0`. Worktree was clean after build and before adding this evidence file. |
| `git diff --check` | Exit `0`. No whitespace errors before adding this evidence file. |

## Boundary notes

- Verification used the assigned worker/reviewer target from supervisor results: `/Users/andy/.codex/worktrees/v43-task-2-workspace-evidence-safety`.
- Verification used worker evidence `docs/plans/v43-task-2-worker-evidence-2026-06-07.md` and reviewer evidence `docs/plans/v43-task-2-review-evidence-2026-06-07.md`.
- I did not create, dispatch, steer, or wait on another Codex thread.
- I did not register `main.verification-passed` or any other goal event.
- I did not run release closeout, tag, push, publish, audit, doctor, mutation, real provider CLI, or raw provider CLI commands.

## Residual risk

Root checkout mutation detection depends on the controller supplying accurate before and after porcelain snapshots. That matches the task-2 design because the supervisor runner stays read-only and blocks from supplied state.
