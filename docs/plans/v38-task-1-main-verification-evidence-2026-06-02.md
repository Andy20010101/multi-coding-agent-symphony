# v38 task-1 main verification evidence

Goal id: `v38-provider-hub-capability-profiles`
Task id: `task-1`
Role: `main-verifier`
Branch/worktree checked: `codex/v38-task-1-provider-profile-contract` at `/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony`
Evidence path: `docs/plans/v38-task-1-main-verification-evidence-2026-06-02.md`
Final event: `main.verification-passed`

## Verdict

`PASSED`

Task-1 is ready for main verification gate registration.

The prior failed evidence was correct at the time it was written: the task implementation was present only as dirty worktree state, and the task branch ref still matched `origin/main`. That blocker is now resolved. The task branch has a committed implementation at `98d79d32eb78c663d4734485bd9c618b37f66a90`, the task worktree is clean, and `origin/main` is an ancestor of the task branch.

## Scope Verified

- Active Agent CLI providers are exactly `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek are not active v38 Agent CLI providers.
- DeepSeek is represented only as inactive/future sanitized backend profile material.
- v38 does not add a real CLI runner, renderer-side provider invocation, generic shell runner, prompt dispatch, model invocation, automatic install, or automatic OAuth behavior.
- Provider availability, health references, lane boundaries, and secrets boundaries are represented in the fixture and enforced by the validator.
- The task remains contract/profile scope only; task-2 health API, task-3 mapping, task-4 lane preview, and task-5 Provider Hub UI are not implemented here.

## Merge Verification

| Check | Result |
| --- | --- |
| `git merge-base --is-ancestor origin/main codex/v38-task-1-provider-profile-contract` | exit `0`; `origin/main` is an ancestor |
| Temporary detached worktree from `origin/main` | created at `/Users/andy/.codex/worktrees/v38-task1-main-verify.4pJz1s` |
| `git merge --ff-only codex/v38-task-1-provider-profile-contract` in temporary worktree | exit `0`; fast-forwarded `7f0108b..98d79d3` |
| `git diff --check origin/main..codex/v38-task-1-provider-profile-contract` | exit `0`; no whitespace errors |

The temporary worktree was used only to prove the real fast-forward path without disturbing the controller branch. The temporary worktree is not used for JavaScript validation because it does not have `node_modules`; validation runs from the task worktree at the same branch content.

## Validation Commands

| Command | Worktree | Result |
| --- | --- | --- |
| `node --test tests/v38-agent-cli-provider-profile.test.js` | task worktree | exit `0`; `6` tests passed |
| `pnpm check` | task worktree | exit `0`; source, scripts, and tests passed syntax checks |
| `pnpm test` | task worktree | exit `0`; `998` tests passed |
| `pnpm workbench:build` | task worktree | exit `0`; Workbench build completed |
| `git diff --check` | task worktree | exit `0`; no whitespace errors |
| `git diff --check origin/main..codex/v38-task-1-provider-profile-contract` | controller worktree | exit `0`; no whitespace errors |
| `pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json` | controller worktree | exit `0`; task-1 status `approved` after reviewer event `evt_ba00500c1e698d85` |
| `pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json` | controller worktree | exit `0`; next action is task-1 `main-verifier` |

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

## Boundary Notes

- No provider CLI was invoked.
- No real CLI runner was added or executed.
- No audit, doctor, mutation gate, push, tag, publish, or release command was run.
- No release readiness was declared.

## Final Result

Main verification passed. The expected managed goal event is `main.verification-passed`.
