# v38 Task 5 Worker Evidence

Goal id: `v38-provider-hub-capability-profiles`

Task id: `task-5`

Branch: `codex/v38-task-5-provider-hub-panel-evidence`

User-visible value: App 成为多 coding agent 控制台雏形。

## Implementation Summary

Added a Workbench `Provider Hub` panel that aggregates existing v38 provider contracts into one read-only operator surface. The panel consumes `agent-cli-provider-health.v1`, `agent-cli-capability-profile.v1`, `agent-cli-lane-assignment-preview.v1`, `goal-progress-ledger.v1`, and `goal-event-log.v1` projections to show provider availability, blocked reasons, sanitized environment presence, requirement gates, lane separation, and evidence anchors.

Extended the Desktop Shell view model with the same Provider Hub projection and added a `Provider Availability` desktop card. The renderer displays provider status and blockers only; it does not execute provider CLIs, expose secret values, assign agents, approve review, pass main verification, or declare release readiness.

## Files Changed

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CJnQHtv9.js`
- `src/symphony/workbench-static/assets/index-BNNs3KXL.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`

## Commands Run

- `pnpm install --frozen-lockfile`: passed; lockfile was already up to date.
- `node --test tests/workbench-api-client.test.js`: passed; `49` tests passed.
- `node --test tests/workbench-shell.test.js tests/workbench-route-smoke.test.js`: passed; `38` tests passed after installing dependencies.
- `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js`: passed; `88` tests passed.
- `pnpm check`: passed.
- `pnpm test`: passed; `1015` tests passed.
- `pnpm workbench:build`: passed; built `src/symphony/workbench-static/assets/index-BNNs3KXL.js`.
- `git diff --check`: passed.
- `pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json` from the controller root: passed; task-5 remained `planned` before worker event registration, and task-1 through task-4 were `main-verified`.

## App / Workbench User Path Changed

Workbench now renders `Provider Hub` in the active goal supporting contracts area. Desktop Shell now renders `Provider Availability` in the lower workspace. Both surfaces show active provider ids, provider health, configured/missing counts, missing-provider blockers, sanitized env presence with `valueAvailable=false`, capability requirement gates, lane preview status, and active goal evidence refs.

## Boundary Notes

- Active providers remain exactly `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek are not active v38 provider candidates.
- No provider CLI execution, command probe, prompt dispatch, model invocation, generic shell runner, browser terminal, arbitrary local path read, provider install, OAuth flow, repo merge, push, tag, publish, reviewer approval inference, main-verification inference, release-ready declaration, or self-approval was added.
- The UI reads evidence refs from explicit goal ledger/event projections only and does not read evidence document bodies.
- The UI displays env variable names and presence booleans only; it does not display env values, credential files, raw provider settings, or secret material.

## Known Limitations / Next Task Handoff

This is worker evidence only. Independent review and main verification still need separate role actions and explicit goal events.
