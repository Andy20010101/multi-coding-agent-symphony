# v38 task-1 main verification evidence

Goal id: `v38-provider-hub-capability-profiles`
Task id: `task-1`
Role: `main-verifier`
Branch/worktree checked: `codex/v38-task-1-provider-profile-contract` at `/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony`
Evidence path: `docs/plans/v38-task-1-main-verification-evidence-2026-06-02.md`
Final event: `main.verification-failed`

## Verdict

`FAILED`

The task-1 contract content is substantially in scope: the checked contract fixture and validator define only `claude-code-cli` and `codex-cli` as active Agent CLI providers, keep Gemini CLI, Kiro CLI, and DeepSeek inactive/future-only, enforce sanitized backend profile boundaries, and reject provider runner, prompt dispatch, model invocation, command path, auto-install, and auto-OAuth drift.

Main verification cannot pass because the implementation is not in the branch ref that would be merged. `codex/v38-task-1-provider-profile-contract` resolves to the same commit as `origin/main` (`7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`), while the task implementation exists as dirty and untracked files in the task worktree. A clean main ff-only merge would therefore merge no task-1 implementation. The required managed goal command also failed with `goal not found`.

## Required Inputs Reviewed

- `docs/plans/controller/subagent-result-format.md`: not present in this worktree or the sibling task worktree; searched local worktrees and no replacement format file was found.
- `fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json`: task-1 acceptance reviewed.
- `docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md`: task-1 section reviewed.
- `docs/plans/v38-task-1-worker-evidence-2026-06-02.md`: read from the task worktree.
- `docs/plans/v38-task-1-review-evidence-2026-06-02.md`: read from the task worktree; reviewer re-review verdict is `APPROVED`.

## Branch and Diff State

- Delegated cwd `/Users/andy/.codex/worktrees/2c3e/multi-coding-agent-symphony` was detached at `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`.
- Task branch worktree `/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony` was on `codex/v38-task-1-provider-profile-contract`.
- `git rev-parse codex/v38-task-1-provider-profile-contract` returned `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`.
- `git diff --name-status origin/main..codex/v38-task-1-provider-profile-contract` returned no output.
- The task implementation is in uncommitted tracked and untracked worktree changes, not in a mergeable branch commit.

## Acceptance Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Provider availability and secrets boundary are explicit | Pass | `agent-cli-provider.v1` fixture has availability, health refs, sanitized backend profile refs, and disabled credential/raw config flags. |
| Codex/Claude/Kiro/DeepSeek availability/lane/gate/health/secrets boundary | Pass with v38 scope correction | Active providers are `claude-code-cli` and `codex-cli`; Gemini CLI, Kiro CLI, and DeepSeek are inactive/future-only. Lanes, gates, health refs, availability, and secrets boundaries are present for the two active providers. |
| Active providers only `claude-code-cli` and `codex-cli` | Pass | Fixture `activeProviders` contains exactly those two ids; validator rejects DeepSeek/Gemini/Kiro active-provider drift. |
| DeepSeek not active | Pass | DeepSeek appears only under `inactiveProviders` and documentation/future handoff text. |
| Visible/testable App/Workbench path | Pass for task-1 contract-only scope | The path is the checked-in fixture, validator, docs, and focused tests. No task-2 health API or Provider Hub panel was added. |
| Goal/task/run/evidence anchoring | Partial | Goal/task/evidence refs are present in fixture/docs/evidence, but managed `goal-status` cannot find the goal. |
| Reuses existing goal/event/run/adoption/verification contracts | Pass | `context.sourceContracts` includes `goal-runbook.v1`, `goal-next-action.v1`, `goal-progress-ledger.v1`, `goal-event-log.v1`, and `goal-update-plan.v1`. |
| State changes only from explicit backend events or command outputs | Pass for implementation content | Contract is read-only and does not add UI state mutation or execution behavior. |
| No arbitrary shell/model/local-file/merge/push/tag/publish/self-approval UI behavior | Pass for task diff | No Provider Hub UI runner was added; contract boundaries disable these capabilities. |
| No v8 compatibility commands as top-level App/Workbench model | Pass | Runbook correction keeps latest goal/runbook/next-action as the main path and explicitly rejects the old v8 command surface as the baseline. |
| No real CLI runner, renderer-side provider invocation, generic shell runner, automatic install/OAuth, prompt dispatch, model invocation | Pass | Fixture boundaries and validator enforce these as false. |
| Main verification process preconditions | Fail | The task branch has no committed diff from `origin/main`; implementation is dirty/untracked. Required `goal-status` failed. |

## Commands

| Command | Worktree | Result |
| --- | --- | --- |
| `git status --short --branch` | delegated cwd | exit `0`; `## HEAD (no branch)` |
| `git rev-parse HEAD` | delegated cwd | exit `0`; `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0` |
| `git status --short --branch` | task worktree | exit `0`; branch `codex/v38-task-1-provider-profile-contract`; dirty tracked docs/fixture files and untracked contract/source/test/evidence files |
| `git rev-parse HEAD` | task worktree | exit `0`; `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0` |
| `pnpm check` | task worktree | exit `0`; `node --check` completed for source, scripts, and tests |
| `pnpm test` | task worktree | exit `0`; `998` tests passed, `154` suites passed |
| `pnpm workbench:build` | task worktree | exit `0`; Vite built `src/symphony/workbench-static/` |
| `git diff --check` | task worktree | exit `0`; no whitespace errors |
| `pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json` | task worktree | exit `64`; `{"version":"1","status":"error","exitCode":64,"message":"goal not found"}` |
| Validator drift probe | task worktree | exit `0`; baseline valid; `backendProfile.password`, `backendProfile.authToken`, `localCommand.commandPath`, active DeepSeek, provider CLI execution, renderer invocation, auto-OAuth, auto-install, prompt dispatch, and model invocation drift all returned `ok=false` |

## Files Inspected

- `fixtures/contracts/agent-cli-provider.v1.json`
- `src/symphony/agent-cli-provider-profile.js`
- `tests/v38-agent-cli-provider-profile.test.js`
- `fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json`
- `docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md`
- `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`
- `docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/release-checklist.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v38-task-1-worker-evidence-2026-06-02.md`
- `docs/plans/v38-task-1-review-evidence-2026-06-02.md`

## Risks and Blockers

- Blocker: task implementation is not committed to `codex/v38-task-1-provider-profile-contract`; the branch ref has no diff from `origin/main`.
- Blocker: required `goal-status` command exits `64` with `goal not found`, so active managed goal state is not available for main verification.
- Blocker: current delegated worktree is detached, not a clean `main` checkout ready for the runbook's ff-only merge flow.
- Process risk: `docs/plans/controller/subagent-result-format.md` is absent, so the exact controller result block format could not be read.

## Boundary Notes

- I did not run `claude`, `codex`, Gemini, Kiro, DeepSeek, or any provider/model CLI.
- I did not run audit, doctor, mutation, merge, push, tag, publish, release, or arbitrary shell/provider execution.
- I did not register a goal event.
- I did not declare release readiness.

## Final Result

Main verification is failed. The expected event is `main.verification-failed`.
