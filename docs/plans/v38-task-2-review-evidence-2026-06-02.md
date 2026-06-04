# v38 task-2 review evidence

Goal id: `v38-provider-hub-capability-profiles`
Task id: `task-2`
Branch: `codex/v38-task-2-provider-health-check-api`
Reviewed commit: `cc235001fe9aa8493c13345dfc1d2b8005f32670`
Reviewer actor: `codex-v38-task-2-reviewer`
Verdict: `approved`

## Review Scope

Reviewed task-2 diff from task-1 main-verified base `7fd3d10df23e128dea7efadc3790beddbe10367e` to `cc235001fe9aa8493c13345dfc1d2b8005f32670`.

## Findings

No revision required.

## Boundary Checks

- Active provider health output is limited to `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek are rejected as active provider drift and remain inactive/non-active for v38.
- DeepSeek remains only inactive/future backend profile context through the task-1 profile contract.
- Health status uses sanitized environment presence booleans only.
- The implementation does not expose env values, API keys, credential file contents, raw provider settings, prompt text, provider CLI output, model output, or shell output.
- The implementation does not execute `claude`, `codex`, Gemini, Kiro, DeepSeek, or any provider CLI.
- The implementation does not add a real CLI runner, generic shell runner, renderer provider invocation, prompt dispatch, model invocation, task-3 capability mapping, task-4 lane preview UI, or task-5 Provider Hub panel.

## Validation Reviewed

- `pnpm check`: exit `0`.
- `pnpm test`: exit `0`; `1003` tests passed.
- `pnpm workbench:build`: exit `0`.
- `git diff --check`: exit `0`.

The validation above was run on the reviewed task-2 branch before this review event. The review also inspected the provider health contract, fixture, CLI path, API route, Workbench route registration, and v38 tests.
