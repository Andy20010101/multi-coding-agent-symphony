# v41 task-5 main verification evidence

Goal: `v41-controlled-cli-provider-runner-backend-completion`

Task: `task-5` - Backend completion closeout and controlled real CLI evidence

Role: `main-verifier`

Thread: `019e9ad6-5634-7e11-92df-3ecde74ac396`

Branch: `v41-task-5-backend-completion-controlled-real-cli-evidence`

Worktree: `/Users/andy/.codex/worktrees/v41-task-5-backend-completion-controlled-real-cli-evidence`

Base commit: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Head commit: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Date: `2026-06-06`

## Sources checked

- `docs/plans/v41-controlled-cli-provider-runner-backend-completion-plan-2026-06-06.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/v41_controlled-cli-provider-runner-backend-completion_goal_runbook_latest.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json`
- `fixtures/contracts/controlled-provider-runner-operation.v1.json`
- `docs/plans/v41-task-5-worker-evidence-2026-06-06.md`
- `docs/plans/v41-task-5-review-evidence-2026-06-06.md`
- `src/symphony/controlled-provider-runner.js`
- `src/symphony/console.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `tests/v41-controlled-provider-runner.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

## Verification result

PASSED.

The task-5 worker evidence at `docs/plans/v41-task-5-worker-evidence-2026-06-06.md` records both active providers through the v41 backend-controlled runner path from `/Users/andy/.codex/worktrees/v41-task-5-backend-completion-controlled-real-cli-evidence`. `claude-code-cli` and `codex-cli` reached backend preview/confirm and produced sanitized failed operation evidence with timeout blockers, operation ids, command template ids, artifact refs, redaction status, false approval/main/release boundary fields, and backend-generated recovery notes.

The timeout results are acceptable task-5 evidence under the runbook because task-5 allows backend-controlled calls or explicit unavailable/failed provider execution evidence. I did not run raw `claude`, raw `codex`, Kiro, Gemini, DeepSeek, or an arbitrary provider shell fallback during main verification.

`src/symphony/controlled-provider-runner.js` keeps active providers to `claude-code-cli` and `codex-cli`, builds provider commands from backend-owned templates, rejects arbitrary command/cwd/env/path/prompt/secret drift, and records operation evidence with `rawProviderOutputAvailable: false`. `recoveryNotes` are derived inside `buildControlledProviderRunnerOperationRecord()` from provider id, status, and failure layer; they are not accepted from preview/confirm input.

Workbench preview and confirm remain bound to backend contracts and plan hash context. The UI posts the preview context and `planHash` to `/provider-runner-confirm`; it does not build provider argv, expose env values, or infer reviewer approval, main verification, or release readiness from runner output.

Release closeout remains gated by the v41 fixture release gates and explicit release-ready event registration. I did not run `symphony goal closeout`, register `release.ready`, tag, push, publish, run mutation, run audit, or run doctor in this leased phase.

## Commands run

Commands were run from `/Users/andy/.codex/worktrees/v41-task-5-backend-completion-controlled-real-cli-evidence`.

| Command | Result |
| --- | --- |
| `node --test tests/v41-controlled-provider-runner.test.js` | Pass. 16 tests, 1 suite, 16 pass, 0 fail, duration 98.704542 ms. |
| `pnpm check` | Pass. Node syntax check completed for configured source, scripts, plugin, and test files. |
| `pnpm test` | Pass. 1076 tests, 168 suites, 1076 pass, 0 fail, duration 3554.537959 ms. |
| `pnpm workbench:build` | Pass. Vite built `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-CILC3208.css`, and `src/symphony/workbench-static/assets/index-3PVjv4nj.js`. |
| `git diff --check` | Pass. No whitespace diagnostics. |
| `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` | Pass. Returned `goal-progress-ledger.v1`; 5 planned tasks; `releaseReady: false`. |

## Residual risk

Both active provider attempts are timeout evidence, not successful real provider completions. The runbook permits explicit failed provider evidence for this task, but release closeout should keep that distinction visible and should not describe the provider CLIs as having completed successfully.
