# v38 task-3 worker evidence

Goal id: `v38-provider-hub-capability-profiles`
Task id: `task-3`
Branch: `codex/v38-task-3-capability-profile-mapping`

## User-Visible Value

Users can inspect how App/Workbench action requirements map to provider gates and tool gates before any controlled confirm path is used.

## Implementation Summary

- Added `agent-cli-capability-profile.v1` builder, validator, and fixture.
- Added `GET /api/providers/capabilities`.
- Added `symphony providers capabilities --json`.
- Added the provider capability profile route to the Workbench read-only route registry.
- Added tests for requirement mapping, provider/tool gate mapping, sanitized contract boundaries, CLI behavior, API behavior, and Workbench route allowlists.

## Files Changed

- `src/symphony/agent-cli-capability-profile.js`
- `fixtures/contracts/agent-cli-capability-profile.v1.json`
- `src/symphony/console.js`
- `scripts/symphony.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/v38-agent-cli-capability-profile.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`
- `docs/plans/v38-task-3-worker-evidence-2026-06-02.md`

## Commands Run

- `node --test tests/v38-agent-cli-capability-profile.test.js tests/workbench-api-client.test.js tests/workbench-route-smoke.test.js tests/workbench-shell.test.js`: exit `0`; `90` tests passed.
- `pnpm check`: exit `0`.
- `pnpm test`: exit `0`; `1008` tests passed.
- `pnpm workbench:build`: exit `0`.
- `git diff --check`: exit `0`.

## Boundary Notes

- Active providers remain exactly `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek remain inactive/non-active for v38.
- The capability profile maps `repo.write`, `model.invoke`, `test.run`, and `git.change` to explicit provider/tool gates.
- `model.invoke` maps to disabled provider CLI/model invocation gates.
- `test.run` maps to copy-only validation commands.
- `goal.event.append` maps to dry-run plus plan-hash confirmation.
- The implementation does not execute `claude`, `codex`, Gemini, Kiro, DeepSeek, or any provider CLI.
- The implementation does not probe provider capabilities, dispatch prompts, call models, expose credential material, write repo files from the App/Workbench, merge, push, tag, publish, self-approve, or implement task-4/5 UI.

## Next Task Handoff

Task-4 owns worker/reviewer lane assignment preview. Task-5 owns the Provider Hub panel.
