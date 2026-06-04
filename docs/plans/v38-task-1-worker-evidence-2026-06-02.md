# v38 task-1 worker evidence

Goal id: `v38-provider-hub-capability-profiles`
Task id: `task-1`
Branch: `codex/v38-task-1-provider-profile-contract`
Worker role: implementation worker
Worktree: `/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony`

## Baseline

- `pwd`: `/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony`
- `git status --short --branch`: `## codex/v38-task-1-provider-profile-contract`
- `git rev-parse HEAD`: `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`
- Base commit: `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`
- Head commit at evidence time: `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`
- Working tree state: dirty with worker changes only.

`AGENTS.md` was not present in this worktree. `docs/plans/controller/v38-controller-state.md` and `docs/plans/controller/subagent-result-format.md` were also not present on this baseline. The task used the checked-in v38 runbook fixture, app-core runbook, global latest-command rules, release checklist, README, Workbench operator guide, product contract docs, and existing contract/test patterns.

## Implementation

- Added `agent-cli-provider.v1` contract builder, validator, and assert helper in `src/symphony/agent-cli-provider-profile.js`.
- Added `fixtures/contracts/agent-cli-provider.v1.json`.
- Added focused tests in `tests/v38-agent-cli-provider-profile.test.js`.
- Updated v38 runbook fixture and plan text to `v38 Agent CLI Provider Hub MVP`.
- Added `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`.
- Updated scoped release gate wording in `docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md` and `docs/release-checklist.md`.
- Updated `docs/symphony-product-contracts.md` with the new contract boundary.

## Contract Boundary

Active provider instances are exactly:

- `claude-code-cli`: display name `Claude Code CLI`, local command `claude`, provider kind `agent-cli`, adapter id `claude-code`.
- `codex-cli`: display name `Codex CLI`, local command `codex`, provider kind `agent-cli`, adapter id `codex`.

Gemini CLI, Kiro CLI, and DeepSeek are not active provider instances in v38. DeepSeek appears only in docs or inactive/future context as a sanitized backend profile/ref or future handoff. The contract does not expose API keys, OAuth tokens, credential file contents, raw provider settings, or full secret-bearing config.

The validator rejects:

- active provider drift outside `claude-code-cli` and `codex-cli`;
- secret-bearing fields and secret-looking values;
- raw shell command fields such as local command args or command lines;
- provider CLI execution, renderer provider invocation, generic shell runner, prompt dispatch, and model invocation boundary drift.

## App/Workbench Path

Task-1 is contract-only. No Provider Hub panel, health API route, capability mapping UI, lane assignment preview UI, or renderer invocation path was added. The user path changed through the checked-in contract fixture, validator, tests, and v38 scope docs. Workbench surfaces can consume this contract in later tasks without gaining provider execution.

## Commands

- `pwd`: exit `0`; output `/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony`.
- `git status --short --branch`: exit `0`; output `## codex/v38-task-1-provider-profile-contract` before implementation.
- `git rev-parse HEAD`: exit `0`; output `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`.
- `git branch --show-current`: exit `0`; output `codex/v38-task-1-provider-profile-contract`.
- `node --test tests/v38-agent-cli-provider-profile.test.js`: exit `0`; `5` tests passed.
- `node --test tests/v38-agent-cli-provider-profile.test.js tests/v19-goal-runbook-contracts.test.js`: exit `0`; `15` tests passed.
- `pnpm check`: exit `0`.
- `pnpm test`: first run exit `1`; failed because this worktree had no `node_modules` and package resolution could not find `fast-check` and `react`.
- `pnpm install --frozen-lockfile`: exit `0`; lockfile was up to date; installed checked-in dependencies into `node_modules`.
- `pnpm test`: second run exit `0`; `997` tests passed.
- `pnpm workbench:build`: exit `0`; Vite built `src/symphony/workbench-static/`.
- `git diff --check`: exit `0`.
- `pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json`: exit `64`; output `{"version":"1","status":"error","exitCode":64,"message":"goal not found"}`.

## Files Changed

- `src/symphony/agent-cli-provider-profile.js`
- `fixtures/contracts/agent-cli-provider.v1.json`
- `tests/v38-agent-cli-provider-profile.test.js`
- `fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json`
- `docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md`
- `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`
- `docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/release-checklist.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v38-task-1-worker-evidence-2026-06-02.md`

## Not Done

- Did not implement task-2 provider health check API.
- Did not implement task-3 capability mapping beyond task-1 contract fields.
- Did not implement task-4 lane assignment preview UI.
- Did not implement task-5 Provider Hub panel.
- Did not run `claude`, `codex`, Gemini, Kiro, DeepSeek, or any provider CLI.
- Did not run mutation, audit, doctor, real CLI, tag, push, publish, or release commands.
- Did not register a goal event.

## Known Limitations

- The managed goal state is not registered in this worktree, so `goal-status` returns `goal not found`.
- The first full `pnpm test` run failed before dependencies were installed. After `pnpm install --frozen-lockfile`, the same command passed.
- This worker evidence is not reviewer approval, main verification, release readiness, or release evidence.

## Continuation Audit

2026-06-04 current-state audit:

- `pwd`: exit `0`; output `/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony`.
- `git status --short --branch`: exit `0`; output shows branch `codex/v38-task-1-provider-profile-contract` with the same worker files modified or untracked.
- `git rev-parse HEAD`: exit `0`; output `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`.
- `git rev-parse origin/main`: exit `0`; output `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`.
- `node --test tests/v38-agent-cli-provider-profile.test.js`: exit `0`; `5` tests passed.
- `pnpm check`: exit `0`.
- `pnpm test`: exit `0`; `997` tests passed.
- `pnpm workbench:build`: exit `0`; Vite built `src/symphony/workbench-static/`.
- `git diff --check`: exit `0`.
- `pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json`: exit `64`; output `{"version":"1","status":"error","exitCode":64,"message":"goal not found"}`.

The audit confirmed the fixture still contains only `claude-code-cli` and `codex-cli` as active providers. Boundary fields for provider CLI execution, renderer provider invocation, prompt dispatch, model invocation, generic shell runner, automatic install, automatic OAuth, task-2 health API, task-3 capability mapping, and task-5 Provider Hub panel remain disabled.

## Worker Revision

2026-06-04 reviewer-blocker revision:

- Tightened `backendProfile` validation to a strict allowlist: `profileRef`, `status`, `sanitized`, `secretMaterialAvailable`, `credentialFileContentsAvailable`, and `rawProviderSettingsAvailable`.
- Expanded secret-bearing field detection to reject names such as `password`, `authToken`, `passphrase`, and `privateKey`.
- Tightened `localCommand` validation to a strict allowlist: `command`, `shellExpansionAvailable`, `commandExecutionAvailable`, `automaticInstallAvailable`, and `automaticOauthAvailable`.
- Added runner/path-shaped local command field rejection for `commandPath`, `executablePath`, `binaryPath`, `path`, `cwd`, and `env`, while keeping existing `args`, `argv`, `shell`, `rawCommand`, and `commandLine` drift failures.
- Extended `tests/v38-agent-cli-provider-profile.test.js` to prove validation fails for `backendProfile.password`, `backendProfile.authToken`, `localCommand.commandPath`, and generic unknown fields on both strict shapes.

Revision commands:

- `pwd`: exit `0`; output `/Users/andy/.codex/worktrees/0845/multi-coding-agent-symphony`.
- `git status --short --branch`: exit `0`; branch `codex/v38-task-1-provider-profile-contract`; worktree remains dirty with task-1 worker files and reviewer evidence.
- `git rev-parse HEAD`: exit `0`; output `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`.
- `node --test tests/v38-agent-cli-provider-profile.test.js`: exit `0`; `6` tests passed.
- `pnpm check`: exit `0`.
- `pnpm test`: exit `0`; `998` tests passed.
- `pnpm workbench:build`: exit `0`; Vite built `src/symphony/workbench-static/`.
- `git diff --check`: exit `0`.
- `pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json`: exit `64`; output `{"version":"1","status":"error","exitCode":64,"message":"goal not found"}`.
- Drift probe for `backendProfile.password`, `backendProfile.authToken`, and `localCommand.commandPath`: exit `0`; each case returned `ok=false`.

Revision boundary notes:

- Did not modify `docs/plans/v38-task-1-review-evidence-2026-06-02.md`.
- Did not implement task-2, task-3, task-4, or task-5.
- Did not add UI, health API, provider runner, renderer provider invocation, generic shell runner, install flow, OAuth flow, or real `claude`/`codex` invocation.
- Did not run mutation, audit, doctor, real CLI, tag, push, publish, or goal event registration.
- This revision is not reviewer approval, main verification, release readiness, or release evidence.

## Next Handoff

The controller can register `worker.evidence-recorded` for task-1 with this evidence ref after reviewing the dirty worktree and validation output. An independent reviewer should review the diff, tests, and this evidence before any main verification step.

## Worker Revision: Branch Commit

2026-06-04 main-verification blocker revision:

- Main verification failed with event `evt_54b41ed97732c6be` because `codex/v38-task-1-provider-profile-contract` still resolved to `7f0108b8c9c4658219f91aa8c687f3b1ae03cfd0`, the same commit as `origin/main`.
- The task-1 implementation, worker evidence, review evidence, and main verification failure evidence were present only as dirty or untracked files in the task worktree.
- This revision stages only task-1-scoped files and creates a local commit on `codex/v38-task-1-provider-profile-contract` so the next main verification can inspect and ff-only merge an actual task branch diff.

Files intended for the local task-1 commit:

- `src/symphony/agent-cli-provider-profile.js`
- `fixtures/contracts/agent-cli-provider.v1.json`
- `tests/v38-agent-cli-provider-profile.test.js`
- `fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json`
- `docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md`
- `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`
- `docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/release-checklist.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v38-task-1-worker-evidence-2026-06-02.md`
- `docs/plans/v38-task-1-review-evidence-2026-06-02.md`
- `docs/plans/v38-task-1-main-verification-evidence-2026-06-02.md`

This revision does not change task-1 product scope. It does not implement task-2, task-3, task-4, task-5, UI, health API, provider runner, renderer provider invocation, generic shell runner, install/OAuth flow, real provider/model CLI invocation, tag, push, publish, release, or goal event registration.
