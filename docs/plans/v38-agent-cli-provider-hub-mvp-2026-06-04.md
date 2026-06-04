# v38 Agent CLI Provider Hub MVP

Date: 2026-06-04
Goal id: `v38-provider-hub-capability-profiles`
Baseline: `v37` / `075990a0b67c334220bd33b95ff4eb4f88e274bd`

## Scope

v38 turns local Agent CLI provider settings into a controlled contract surface. It does not run provider CLIs. It does not send prompts. It does not call models.

Active provider instances in v38:

- `claude-code-cli`: display name `Claude Code CLI`, local command `claude`, provider kind `agent-cli`, adapter id `claude-code`.
- `codex-cli`: display name `Codex CLI`, local command `codex`, provider kind `agent-cli`, adapter id `codex`.

Not active provider instances in v38:

- Gemini CLI.
- Kiro CLI.
- DeepSeek active provider.

DeepSeek may appear only as a sanitized backend profile/ref behind an existing local Agent CLI, or as future official Agent CLI handoff documentation. It is not an active v38 provider instance.

## Contract Shape

Task-1 owns `agent-cli-provider.v1`.

The contract records:

- active provider identity, display name, provider kind, adapter id, and local command name;
- sanitized backend profile ref and status using `configured`, `missing`, or `unknown`;
- availability, lane, gate, and health contract references;
- workspace, prompt, output, and capability boundaries;
- disabled execution boundaries for provider CLI execution, renderer-side invocation, prompt dispatch, model invocation, generic shell runner, automatic install, and automatic OAuth login.

Backend profile data must not include API keys, OAuth tokens, credential file contents, raw provider settings, full secret-bearing config, or secret-looking values.

## Task Breakdown

- task-1: Agent CLI provider profile contract and validator.
- task-2: Provider health check API. Read-only health state from `agent-cli-provider.v1` plus sanitized env presence only; no provider CLI execution, credential file read, prompt dispatch, or model invocation.
- task-3: Capability profile mapping. `agent-cli-capability-profile.v1` maps action requirements such as `repo.write`, `model.invoke`, `test.run`, and `git.change` to provider/tool gates; no real runner, provider CLI probe, prompt dispatch, model invocation, repo write, merge, push, tag, or publish.
- task-4: Worker/reviewer lane assignment preview. Display assignment preview; no execution.
- task-5: Provider Hub panel and evidence. Workbench consumes backend contracts; renderer does not run provider CLIs.

## v41 Boundary

Controlled CLI Provider Runner and Backend Completion start in v41. v38 must not add a real CLI runner, renderer-side provider invocation, generic shell runner, automatic provider install, OAuth login flow, prompt dispatch, or model invocation.

## Release Gates

For v38+ scoped closeout, use the runbook fixture `releaseGates` as the source of truth:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

Default local validation is `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check`, plus written docs-updated evidence. Mutation, audit, and doctor gates are only for repository tag/full release or an explicit runbook gate.
