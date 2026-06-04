# v38 task-1 independent review evidence

Goal id: `v38-provider-hub-capability-profiles`
Task id: `task-1`
Role: independent reviewer
Thread id: `019e921d-2b22-7421-b986-406ded4629c8`
Branch: `codex/v38-task-1-provider-profile-contract`
Worktree: `/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony`
Base commit: `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`
Head commit: `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`

## Verdict

`NEEDS_REVISION`

The contract fixture and docs keep the intended v38 provider scope: active provider instances are `claude-code-cli` and `codex-cli`, while Gemini CLI, Kiro CLI, and DeepSeek are inactive or future/handoff references. The implementation is contract-only and does not add a UI panel, health API route, runner, prompt dispatch, model invocation, install flow, OAuth login, tag, push, publish, or release path.

The blocker is in the validator boundary. It accepts drift examples that the task explicitly says must be rejected: secret-bearing backend fields and a local command path.

## Findings

1. `src/symphony/agent-cli-provider-profile.js:326` validates the required backend profile fields but does not reject unknown backend profile fields. The global secret scan at `src/symphony/agent-cli-provider-profile.js:555` depends on `SECRET_KEY_PATTERN`, and that pattern does not catch common secret-bearing names such as `password` or `authToken`. A direct validator check returned `{"ok":true,"errors":[]}` for both `activeProviders[0].backendProfile.password = "plain-text-password"` and `activeProviders[0].backendProfile.authToken = "plain-auth-token"`. This misses the task requirement to reject secret-bearing fields/values.
2. `src/symphony/agent-cli-provider-profile.js:302` only forbids `args`, `argv`, `shell`, `rawCommand`, and `commandLine` under `localCommand`. It accepts `activeProviders[0].localCommand.commandPath = "/usr/bin/claude"` with `{"ok":true,"errors":[]}`. The review scope calls out raw shell/model runner drift and arbitrary shell command path boundaries, so command path exposure should be rejected or the local command shape should be strict.

## Worker Evidence Reviewed

- `docs/plans/v38-task-1-worker-evidence-2026-06-02.md`

## Files Reviewed

- `AGENTS.md`: not present in the target worktree.
- `docs/plans/v38-task-1-worker-evidence-2026-06-02.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json`
- `docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/release-checklist.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`
- `src/symphony/agent-cli-provider-profile.js`
- `fixtures/contracts/agent-cli-provider.v1.json`
- `tests/v38-agent-cli-provider-profile.test.js`
- `tests/v19-goal-runbook-contracts.test.js`

## Diff Review Summary

Tracked diff before this review evidence:

- Modified `docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md`
- Modified `docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- Modified `docs/release-checklist.md`
- Modified `docs/symphony-product-contracts.md`
- Modified `fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json`

Untracked worker files reviewed directly because `git diff` omits them:

- `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`
- `docs/plans/v38-task-1-worker-evidence-2026-06-02.md`
- `fixtures/contracts/agent-cli-provider.v1.json`
- `src/symphony/agent-cli-provider-profile.js`
- `tests/v38-agent-cli-provider-profile.test.js`

The fixture declares exactly two active providers. Inactive provider entries list `gemini-cli`, `kiro-cli`, and `deepseek`. DeepSeek appears in the changed v38 files as inactive/future or sanitized backend handoff text, not as an active provider instance.

## Boundary Review Result

- Active provider scope: passes for current fixture and generated contract.
- Gemini/Kiro/DeepSeek active provider boundary: passes for current fixture; validator rejects the tested active-provider drift cases.
- DeepSeek boundary: passes in current changed files as inactive/future/handoff documentation.
- Real CLI runner boundary: current implementation adds no runner or provider CLI invocation.
- Renderer-side invocation boundary: no renderer/API Provider Hub panel or invocation path was added.
- Task-2 health API boundary: not implemented.
- Task-3 capability mapping boundary: not implemented beyond task-1 contract boundary flags.
- Task-4 lane preview boundary: no UI preview was implemented.
- Task-5 Provider Hub panel boundary: not implemented.
- Secret and command-path validator boundary: fails; see findings.

## Commands Run

| Command | Result |
| --- | --- |
| `pwd` from target worktree | exit `0`; `/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony` |
| `git -C /Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony status --short --branch` | exit `0`; branch `codex/v38-task-1-provider-profile-contract`; worker files modified/untracked |
| `git -C /Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony rev-parse HEAD` | exit `0`; `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0` |
| `git rev-parse origin/main` | exit `0`; `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0` |
| `git diff --stat` | exit `0`; tracked diff: 5 files, 79 insertions, 17 deletions; untracked files reviewed separately |
| `git diff --name-status` | exit `0`; 5 tracked modified files |
| `node --test tests/v38-agent-cli-provider-profile.test.js` | exit `0`; 5 tests passed |
| `pnpm check` | exit `0`; `node --check` completed |
| `pnpm test` | exit `0`; 997 tests passed, 154 suites passed |
| `pnpm workbench:build` | exit `0`; Vite built `src/symphony/workbench-static/`; no static diff remained |
| `git diff --check` | exit `0`; no whitespace errors |
| Drift snippet for `backendProfile.password`, `backendProfile.authToken`, and `localCommand.commandPath` | exit `0`; each validation returned `{"ok":true,"errors":[]}` |

## Known Risks / Skipped Validation

- Did not run mutation, audit, doctor, real CLI smoke, `claude`, `codex`, Gemini, Kiro, DeepSeek, tag, push, publish, or release commands.
- Did not register a goal event.
- Did not perform main verification.
- Did not declare release readiness.

## Next Suggested Action

Worker should tighten `agent-cli-provider.v1` validation and tests so backend profile extra fields cannot carry secrets and local command data cannot expose command paths or runner-shaped fields. Re-run the task-1 focused test, `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check` after the fix.

## Re-review 2026-06-04

Verdict: `APPROVED`

Goal id: `v38-provider-hub-capability-profiles`
Task id: `task-1`
Role: independent reviewer re-review
Thread id: `019e921d-2b22-7421-b986-406ded4629c8`
Branch: `codex/v38-task-1-provider-profile-contract`
Worktree: `/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony`
Base commit: `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`
Head commit: `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`

The prior blocker is resolved. `src/symphony/agent-cli-provider-profile.js` now uses strict allowlists for `backendProfile` and `localCommand`, expands secret-bearing field detection for names such as `password` and `authToken`, and rejects runner/path-shaped local command fields including `commandPath`. `tests/v38-agent-cli-provider-profile.test.js` now has 6 focused tests covering those cases.

### Prior Findings

- Prior finding 1: resolved. `backendProfile.password` and `backendProfile.authToken` now validate with `ok=false`; unknown backend profile field `region` also validates with `ok=false`.
- Prior finding 2: resolved. `localCommand.commandPath` now validates with `ok=false`; unknown local command field `timeoutMs` also validates with `ok=false`.

### Files Reviewed

- `docs/plans/v38-task-1-worker-evidence-2026-06-02.md`
- `docs/plans/v38-task-1-review-evidence-2026-06-02.md`
- `src/symphony/agent-cli-provider-profile.js`
- `tests/v38-agent-cli-provider-profile.test.js`
- `fixtures/contracts/agent-cli-provider.v1.json`
- `fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json`
- `docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md`
- `docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/release-checklist.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`

### Changed Files Reviewed

Tracked modified files:

- `docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md`
- `docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/release-checklist.md`
- `docs/symphony-product-contracts.md`
- `fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json`

Untracked files read directly:

- `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`
- `docs/plans/v38-task-1-review-evidence-2026-06-02.md`
- `docs/plans/v38-task-1-worker-evidence-2026-06-02.md`
- `fixtures/contracts/agent-cli-provider.v1.json`
- `src/symphony/agent-cli-provider-profile.js`
- `tests/v38-agent-cli-provider-profile.test.js`

### Drift Probe Result

Direct validator probe from the target worktree returned:

- `backendProfile.password`: `ok=false`
- `backendProfile.authToken`: `ok=false`
- `localCommand.commandPath`: `ok=false`
- `backendProfile.region`: `ok=false`
- `localCommand.timeoutMs`: `ok=false`
- `localCommand.args`: `ok=false`
- `localCommand.argv`: `ok=false`
- `localCommand.shell`: `ok=false`
- `localCommand.rawCommand`: `ok=false`
- `localCommand.commandLine`: `ok=false`

`backendProfile.password` and `backendProfile.authToken` each produce duplicate errors because they are rejected by the strict backend profile allowlist and the global secret field scan. The duplicate messages are not a functional blocker; the validator still rejects the contract.

### Boundary Result

- Active providers remain exactly `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek are not active providers. The fixture lists them only under `inactiveProviders`.
- DeepSeek appears in the reviewed v38 changes as inactive/future/handoff documentation or existing release-checklist context, not as an active v38 provider.
- No task-2 health API was added.
- No task-3 capability mapping was added beyond task-1 boundary fields.
- No task-4 lane preview UI was added.
- No task-5 Provider Hub panel was added.
- No real provider CLI invocation, renderer provider invocation, generic shell runner, prompt dispatch, model invocation, install flow, OAuth flow, tag, push, publish, release path, or release readiness declaration was introduced.
- `pnpm workbench:build` produced no remaining diff under `src/symphony/workbench-static`.

### Commands Run

| Command | Result |
| --- | --- |
| `pwd` | exit `0`; `/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony` |
| `git -C /Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony status --short --branch` | exit `0`; branch `codex/v38-task-1-provider-profile-contract`; expected dirty worker/review files present |
| `git -C /Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony rev-parse HEAD` | exit `0`; `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0` |
| `node --test tests/v38-agent-cli-provider-profile.test.js` | exit `0`; 6 tests passed |
| `pnpm check` | exit `0` |
| `pnpm test` | exit `0`; 998 tests passed, 154 suites passed |
| `pnpm workbench:build` | exit `0`; Vite build completed |
| `git diff --check` | exit `0` |
| Direct drift probe for old blocker and allowlist cases | exit `0`; all probed drift cases returned `ok=false` |
| `git diff --stat` | exit `0`; tracked diff remains 5 files, 79 insertions, 17 deletions before this evidence update |
| `git ls-files --others --exclude-standard` | exit `0`; listed the untracked worker/review files reviewed directly |

### Risks / Skipped Validation

- Did not run mutation, audit, doctor, real CLI smoke, `claude`, `codex`, Gemini, Kiro, DeepSeek, or any provider CLI.
- Did not run tag, push, publish, or release commands.
- Did not register a goal event.
- Did not perform main verification.
- Did not declare release readiness.

### Next Suggested Action

Register `reviewer.approved` for task-1 with this review evidence ref, then hand off to main verification. Main verification remains a separate step.
