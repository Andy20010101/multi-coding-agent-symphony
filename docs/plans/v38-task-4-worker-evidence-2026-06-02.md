# v38 Task 4 Worker Evidence

Goal id: `v38-provider-hub-capability-profiles`

Task id: `task-4`

Branch: `codex/v38-task-4-worker-reviewer-lane-assignment-preview`

User-visible value: 实现者与 reviewer 分离在 App 里可见。

## Implementation Summary

Implemented `agent-cli-lane-assignment-preview.v1` as a read-only v38 Provider Hub contract. The contract previews worker, reviewer, and main-verifier lanes from explicit provider/profile/health/capability and goal contracts. Worker/reviewer candidates are limited to `claude-code-cli` and `codex-cli`; the matrix recommends a reviewer provider different from the worker provider. The main-verifier lane is operator-controlled and exposes copy-only verification commands only.

Added `symphony providers lanes --json`, `GET /api/providers/lane-preview`, and a Workbench `Provider Lane Preview` panel. The route rejects query parameters and non-GET requests. The Workbench panel renders backend contract fields only; it does not assign agents, execute provider CLIs, register review, or pass main verification.

## Files Changed

- `src/symphony/agent-cli-lane-assignment-preview.js`
- `src/symphony/console.js`
- `scripts/symphony.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-Omo7gcEr.js`
- `src/symphony/workbench-static/assets/index-CJnQHtv9.js`
- `tests/v38-agent-cli-lane-assignment-preview.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-route-smoke.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v38-agent-cli-provider-hub-mvp-2026-06-04.md`

## Commands Run

- `pnpm install --frozen-lockfile`: passed; lockfile already up to date, 192 packages reused, no package files changed.
- `node --test tests/v38-agent-cli-lane-assignment-preview.test.js`: passed, 4 tests.
- `node --test tests/workbench-api-client.test.js`: passed, 48 tests before docs update; rerun with lane test passed as part of 52 focused tests.
- `node --test tests/workbench-route-smoke.test.js tests/workbench-shell.test.js`: passed, 38 tests.
- `pnpm check`: passed.
- `pnpm test`: passed, 1013 tests.
- `pnpm workbench:build`: passed; built `src/symphony/workbench-static/assets/index-CJnQHtv9.js`.
- `git diff --check`: passed.
- `pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json` from controller root: passed; task-4 remained `planned` before event registration, task-1/2/3 were `main-verified`.
- `pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json` from controller root: passed; next action was `task-4 / worker / implement`.

The same `goal-status` command from the isolated task-4 worktree returned `goal not found` because that worktree does not contain the controller-managed `.symphony` goal ledger. Controller root remained the authoritative ledger source.

## App / Workbench User Path Changed

Workbench now reads `/api/providers/lane-preview` through the approved read-only route list and renders `Provider Lane Preview` in the active goal supporting contracts area. The panel shows goal/task context, active provider ids, lane roles, reviewer independence requirements, provider health assignability, the independent review matrix, main-verifier copy-only commands, and safety boundaries.

## Boundary Notes

- Active providers remain exactly `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek are not active provider candidates.
- Main verification is not provider-backed and remains operator-controlled.
- No provider CLI execution, prompt dispatch, model invocation, capability probe, generic shell runner, repo write, merge, push, tag, publish, reviewer approval inference, main-verification inference, or self-approval was added.
- The UI has no execution handler for lane preview and does not infer task status from branch names, filenames, task titles, prompt text, command text, or frontend state.

## Known Limitations / Next Task Handoff

This task exposes lane assignment preview only. Task-5 should consume the provider profile, health, capability, and lane preview contracts in the Provider Hub panel without adding provider execution or renderer-side invocation.
