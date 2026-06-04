# v38 task-2 worker evidence

Goal id: `v38-provider-hub-capability-profiles`
Task id: `task-2`
Branch: `codex/v38-task-2-provider-health-check-api`

## User-Visible Value

Users can see why an active Agent CLI provider lane is unavailable without the App or Workbench calling a model.

## Implementation Summary

- Added `agent-cli-provider-health.v1` builder, validator, and fixture.
- Added `GET /api/providers/health` on the local console sidecar.
- Added `symphony providers health --json`.
- Added the provider health route to the Workbench read-only route registry.
- Added tests for contract validation, sanitized env presence, route behavior, CLI behavior, and Workbench route allowlists.

## Files Changed

- `src/symphony/agent-cli-provider-health.js`
- `fixtures/contracts/agent-cli-provider-health.v1.json`
- `src/symphony/console.js`
- `scripts/symphony.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/v38-agent-cli-provider-health.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`
- `docs/plans/v38-task-2-worker-evidence-2026-06-02.md`

## Commands Run

- `node --test tests/v38-agent-cli-provider-health.test.js tests/workbench-api-client.test.js tests/workbench-route-smoke.test.js`: exit `0`; `63` tests passed.
- `pnpm check`: exit `0`.
- `pnpm test`: exit `0`; `1003` tests passed.
- `pnpm workbench:build`: exit `0`.
- `git diff --check`: exit `0`.

## App/Workbench User Path Changed

The backend exposes `GET /api/providers/health` and the Workbench read-only route registry includes `/api/providers/health` with contract `agent-cli-provider-health.v1`. Terminal users can read the same contract with `pnpm --silent symphony providers health --json`.

## Boundary Notes

- Active providers remain exactly `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek remain inactive/non-active for v38.
- DeepSeek remains only future/inactive sanitized backend profile context.
- The health contract reports env presence as booleans only and never exposes env values, API keys, OAuth tokens, credential files, or raw provider settings.
- The implementation does not execute `claude`, `codex`, Gemini, Kiro, DeepSeek, or any provider CLI.
- The implementation does not add a real CLI runner, renderer provider invocation, generic shell runner, automatic install, OAuth login, prompt dispatch, model invocation, task-3 capability mapping, task-4 lane preview UI, task-5 Provider Hub panel, tag, push, publish, release, or goal event registration.

## Known Limitations / Next Task Handoff

Task-3 owns capability profile mapping. Task-4 owns lane assignment preview. Task-5 owns the Provider Hub panel.
