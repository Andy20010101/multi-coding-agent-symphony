# v66 Controlled Codex Worker Execution acceptance

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v66-controlled-codex-worker-execution`

## Accepted Scope

v66 adds a controlled Codex worker execution lane. The lane is owned by backend preview/confirm contracts and leaves worker output in `needs-review`.

Accepted changes:

- v66 runbook is recorded in `docs/plans/v66-controlled-codex-worker-execution-runbook-2026-06-14.md` and copied into `docs/plans/workbench-v61-v72-real-use-runbooks/v66_controlled-codex-worker-execution_goal_runbook_latest.md`.
- `workerRunPreview.v1` and `workerRunResult.v1` define fixed Codex worker execution boundaries.
- Worker run fixtures cover ready preview, missing provider, provider blocked, stale `planHash`, timeout, failed verifier, sanitized success, unsafe raw output, and direct main-write rejection.
- Backend routes expose a controlled worker preview and confirm path with fake adapter coverage by default.
- Workbench shows the Worker Run lane with preview state, fixed confirm body, sanitized evidence refs, failure layer, and next safe action.
- Rebuilt Workbench static assets point to CSS asset `index-BX8171d6.css` and JS asset `index-Bv6BpPX4.js`.
- v67 handoff is recorded in `docs/plans/v67-claude-code-reviewer-lane-runbook-2026-06-14.md`.

Out of scope:

- generic shell or terminal UI;
- frontend-supplied freeform provider command;
- renderer arbitrary command execution;
- frontend reads of local JSONL files, provider session folders, `.symphony` internals, goal ledgers, event logs, raw transcripts, raw model output, or local session paths;
- unsupported provider claims;
- provider success as task completion;
- provider output as review approval;
- direct main worktree writes from provider runs;
- direct goal event append or task completion from provider output;
- automatic self-review, automatic worktree creation, or automatic next-version goal creation;
- product-level git merge, push, tag, publish, or GitHub Release automation;
- public distribution, notarization, or auto-update claims.

## Evidence

| Check | Result |
| --- | --- |
| `pnpm workbench:build` | Passed. Built `src/symphony/workbench-static/index.html`, CSS asset `index-BX8171d6.css`, and JS asset `index-Bv6BpPX4.js`. |
| `node --test tests/v66-controlled-codex-worker-execution.test.js` | Passed: 10 tests, 10 passed. |
| `node --test tests/v65-provider-readiness-codex-claude-only.test.js` | Passed: 8 tests, 8 passed. |
| `node --test tests/v54-codex-provider-execution-pilot.test.js tests/v55-codex-provider-run-recovery-reviewer-handoff.test.js` | Passed: 31 tests, 31 passed. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed: 126 tests, 126 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed. |
| `pnpm test` | Passed: 1398 tests, 1398 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `git diff --check` | Passed. |
| `git diff --cached --check` | Passed after PR-4 staging. |

## Acceptance Criteria

| Criterion | Evidence |
| --- | --- |
| Worker execution is backed by explicit contracts and fixtures. | `src/symphony/worker-run-contracts.js`, `fixtures/contracts/worker-run/*.json`, and `tests/v66-controlled-codex-worker-execution.test.js`. |
| Confirm is bound to preview `planHash`, active goal/task, fixed provider, fixed command template, timeout, and workspace policy. | `buildWorkerRunPreview`, `confirmWorkerRunPreview`, backend route tests, and Workbench confirm body tests. |
| Worker success does not complete the task or approve review. | `result.sanitized-success.v1.json` and tests assert `taskState: needs-review`, `reviewRequired: true`, `taskCompleted: false`, `reviewApproved: false`, `mainVerified: false`, and `releaseReady: false`. |
| Backend default uses fake adapter tests unless real Codex smoke is explicitly enabled. | `tests/v66-controlled-codex-worker-execution.test.js` confirms fake adapter output; `realCodexOptIn` remains `false` in the default result fixtures. |
| Workbench exposes a controlled worker lane without arbitrary execution controls. | `frontend/workbench/src/App.jsx`, `frontend/workbench/src/api/client.js`, `frontend/workbench/src/api/contracts.js`, and Workbench source tests. |
| Raw provider output, transcripts, local session paths, main-worktree writes, and secrets stay outside payloads. | Contract tests reject unsafe result fields and direct main-write paths; Workbench tests assert no generic shell, terminal, arbitrary command, local open, or model entry point is added. |
| Closeout records validation, rollback, release prep, and v67 handoff. | `docs/plans/v66-controlled-codex-worker-execution-closeout-snapshot-2026-06-14.md` and `docs/plans/v67-claude-code-reviewer-lane-runbook-2026-06-14.md`. |

## Residual Risk

v66 does not run a real Codex CLI worker smoke. The version proves the controlled worker execution contract, backend preview/confirm path, fake adapter behavior, and Workbench lane. Real Codex execution remains opt-in because raw provider output and local provider sessions must stay out of the default payload.

v66 does not approve reviewer evidence, main verification, adoption, or release readiness. v67 owns the Claude Code reviewer lane. v68 owns adoption and main verification connection.

## Rollback

If worker run contracts accept stale hashes, arbitrary provider ids, freeform command text, raw provider output, local session paths, or direct main-write paths, revert PR #147 and dependent PRs.

If backend confirm executes before a ready preview, accepts a stale `planHash`, runs a non-fixed provider/template, writes the main worktree, or appends goal events directly, revert PR #148.

If Workbench exposes a shell, terminal, prompt launcher, raw output, local session link, direct task-complete control, reviewer approval, main-verification pass, or release-ready control, revert PR #149 and rebuild static assets from the reverted source.
