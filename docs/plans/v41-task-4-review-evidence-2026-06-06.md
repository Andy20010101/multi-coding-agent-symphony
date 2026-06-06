# v41 task-4 review evidence

Goal: `v41-controlled-cli-provider-runner-backend-completion`

Task: `task-4` - Workbench preview and confirm binding

Role: `reviewer`

Thread: `019e9abe-9119-7f91-8287-4e1043c26bc1`

Branch: `v41-task-4-workbench-preview-confirm-binding`

Worktree reviewed: `/Users/andy/.codex/worktrees/v41-task-4-workbench-preview-confirm-binding`

Base commit: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Head commit during review: `5495261bc260fb16fc2a83e8b3dd1c921615a42c`

Worker evidence reviewed: `docs/plans/v41-task-4-worker-evidence-2026-06-06.md`

Date: `2026-06-06`

## Sources checked

- `docs/plans/v41-controlled-cli-provider-runner-backend-completion-plan-2026-06-06.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/v41_controlled-cli-provider-runner-backend-completion_goal_runbook_latest.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json`
- `fixtures/contracts/controlled-provider-runner-operation.v1.json`
- `docs/plans/v41-task-4-worker-evidence-2026-06-06.md`
- `src/symphony/controlled-provider-runner.js`
- `src/symphony/console.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/v41-controlled-provider-runner.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

## Review result

Approved.

The task-4 implementation matches the runbook acceptance criteria. The backend preview returns the active provider id, goal/task/role context, backend-owned command template id, safety fields, expected sanitized artifact refs, and deterministic `planId` plus `planHash`. The confirm path accepts only the reviewed context fields plus `planId` and `planHash`, rebuilds the preview on the backend, rejects mismatches, and writes a `provider-runner` operation registry record.

The Workbench projection and panel display backend contract fields, expected artifacts, endpoint restrictions, safety flags, and operation status/evidence refs. The confirm body is assembled from the preview model and does not include arbitrary command text, provider binary, cwd, local path, raw prompt text, or secret fields. Operation status keeps `reviewerApproved`, `mainVerified`, and `releaseReady` false instead of deriving those states from provider runner output.

No raw `claude`, raw `codex`, Gemini, Kiro, DeepSeek, audit, doctor, tag, push, publish, release closeout, or event registration command was run during review.

## Validation commands

Commands were run from `/Users/andy/.codex/worktrees/v41-task-4-workbench-preview-confirm-binding`.

| Command | Result |
| --- | --- |
| `pnpm check` | Pass. Node syntax check completed for configured source, scripts, plugin, and test files. |
| `pnpm test` | Pass. 1076 tests, 168 suites, 1076 pass, 0 fail. |
| `pnpm workbench:build` | Pass. Vite built `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-CILC3208.css`, and `src/symphony/workbench-static/assets/index-3PVjv4nj.js`. |
| `git diff --check` | Pass. No whitespace diagnostics. |
| `pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json` | Pass. Returned `goal-progress-ledger.v1` for the checked-in v41 runbook, 5 planned tasks, `releaseReady: false`. |
| `pnpm --silent symphony goal next --goal v41-controlled-cli-provider-runner-backend-completion --json` | Read-only extra check. Returned `missing-runbook` because no active managed goal runbook is registered in this isolated state. |

## Residual risk

No blocking issue found. The isolated worktree can resolve `goal-status` from the checked-in v41 fixture, but `goal next` still reports no registered active managed runbook in this state. That matches the local review environment and does not invalidate the task-4 preview/confirm implementation.
