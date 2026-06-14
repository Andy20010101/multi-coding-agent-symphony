# v65 Provider Readiness: Codex and Claude Code Only acceptance

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v65-provider-readiness-codex-claude-only`

## Accepted Scope

v65 narrows provider readiness to Codex CLI for the worker lane and Claude Code CLI for the reviewer lane. Kiro is historical compatibility only. DeepSeek is a Claude Code provider configuration detail, not an active Workbench provider.

Accepted changes:

- v65 runbook is recorded in `docs/plans/v65-provider-readiness-codex-claude-only-runbook-2026-06-14.md` and copied into `docs/plans/workbench-v61-v72-real-use-runbooks/v65_provider-readiness-codex-claude-only_goal_runbook_latest.md`.
- `providerReadiness.v1` records active providers, historical providers, unsupported provider claims, sanitized evidence policy, blocked reasons, and safety boundaries.
- Readiness fixtures cover both-ready, Codex missing, Claude missing, Claude provider mismatch, missing DeepSeek config, Kiro historical compatibility, unsupported provider claim blocked, secret-like values, local session paths, raw provider output, and unsupported active provider drift.
- `/api/providers/readiness` exposes backend-owned sanitized readiness as a read-only `GET` route and rejects query and mutation probes.
- Provider Hub projection consumes `providerReadiness.v1` next to provider health, capability profile, lane preview, and explicit goal evidence refs.
- README and `docs/provider-boundary-guide.md` state the v65 provider line: Codex worker candidate, Claude Code reviewer candidate, operator main verifier, Kiro historical, DeepSeek config detail only.
- Workbench Provider Hub and Desktop Provider Availability render readiness state, active provider count, blocked reasons, Codex/Claude candidate lanes, Kiro historical status, DeepSeek non-active status, and sanitized evidence-policy flags.
- Rebuilt Workbench static assets point to CSS asset `index-BX8171d6.css` and JS asset `index-CHkwDuMk.js`.

Out of scope:

- generic shell or terminal UI;
- renderer arbitrary command execution;
- frontend local JSONL, session, provider folder, goal ledger, event log, raw transcript, or raw model output reads;
- unsupported active provider claims;
- generic provider picker;
- raw provider CLI launcher;
- provider execution from readiness cards;
- direct goal event append or task completion from provider output;
- automatic self-review, worktree creation, or next-version goal creation;
- product-level git merge, push, tag, publish, or GitHub Release automation;
- public distribution, notarization, or auto-update claims.

## Evidence

| Check | Result |
| --- | --- |
| `node --test tests/v65-provider-readiness-codex-claude-only.test.js tests/v54-codex-provider-execution-pilot.test.js tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js` | Passed: 39 tests, 39 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed: 123 tests, 123 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm workbench:build` | Passed. Built `src/symphony/workbench-static/index.html`, CSS asset `index-BX8171d6.css`, and JS asset `index-CHkwDuMk.js`. |
| `pnpm check` | Passed. |
| `pnpm test` | Passed: 1385 tests, 1385 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `git diff --check` | Passed. |
| `git diff --cached --check` | Passed after PR-4 staging. |

## Acceptance Criteria

| Criterion | Evidence |
| --- | --- |
| Provider readiness is backed by explicit contracts and fixtures. | `src/symphony/provider-readiness-contracts.js`, `fixtures/contracts/provider-readiness/*.json`, and `tests/v65-provider-readiness-codex-claude-only.test.js`. |
| Workbench shows the two-provider line without adding launch controls. | `frontend/workbench/src/App.jsx` renders `ProviderHubReadinessList`; `tests/workbench-shell.test.js` asserts the Provider Hub source has no fetch, form, textarea, clipboard, shell, spawn, or execution entry. |
| Backend readiness route is read-only. | `tests/v65-provider-readiness-codex-claude-only.test.js` covers `GET /api/providers/readiness`, query rejection, and `POST` rejection. |
| DeepSeek is not a Workbench provider. | Readiness projection marks `deepseek-cli` as unsupported and `activeWorkbenchProvider: false`; Workbench projection asserts the same. |
| Kiro is historical compatibility only. | Readiness fixture and projection mark `kiro-cli` historical with `activeWorkbenchProvider: false`. |
| Raw provider output, sessions, local paths, and secrets stay outside payloads. | Contract tests reject unsafe fields; Workbench displays only sanitized readiness/configuration presence and false evidence-policy flags. |
| Closeout records validation, rollback, release prep, and v66 handoff. | `docs/plans/v65-provider-readiness-codex-claude-only-closeout-snapshot-2026-06-14.md` and `docs/plans/v66-controlled-codex-worker-execution-runbook-2026-06-14.md`. |

## Residual Risk

v65 does not run real Codex or Claude Code provider smoke checks. Binary presence remains `unknown`, help smoke remains `not-run`, and optional real smoke remains `not-run` unless an operator supplies sanitized evidence. That is acceptable for v65 because the release scopes readiness contracts and display, not provider execution.

Claude Code execution is not claimed in v65. v67 owns the controlled reviewer lane.

## Rollback

If provider readiness accepts Kiro, Gemini, DeepSeek, or arbitrary provider ids as active providers, revert PR #142 and dependent PRs.

If `/api/providers/readiness` exposes raw output, secrets, local session paths, or write behavior, revert PR #143.

If Workbench adds provider launch controls, generic provider selection, raw provider output, local provider links, or readiness-card execution, revert PR #144 and rebuild the static assets from the reverted source.
