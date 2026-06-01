# v31 task-2 review evidence

Goal id: `v31-main-verification-runner-evidence-writer`  
Release name: `v31 Main Verification Runner + Evidence Writer`  
Task id: `task-2`  
Task title: `Allowlisted verification plan preview`  
Date: 2026-06-01  
Reviewer: `codex-v31-task-2-reviewer`  
Review verdict: `approved`

## Evidence inspected

- Runbook: `docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md`
- Plan doc: `docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md`
- Fixture: `fixtures/contracts/goal-runbook.v31-main-verification-runner-evidence-writer.v1.json`
- Worker evidence: `docs/plans/v31-task-2-worker-evidence-2026-06-01.md`
- Current task-2 diff in `frontend/workbench/src/api/contracts.js`, `frontend/workbench/src/App.jsx`, `frontend/workbench/src/styles/workbench.css`, `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, `docs/workbench-operator-guide.md`, `docs/symphony-product-contracts.md`, and generated Workbench static output.

## Acceptance checklist

- Workbench user path is visible/testable: approved. `MainVerificationReadinessPanel` renders `allowlisted verification plan preview`, and shell/API tests assert the path.
- Command preview allowlist is controlled: approved. `MAIN_VERIFICATION_COMMAND_ALLOWLIST` contains only `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check`.
- Task-scoped additions are controlled: approved. The only extra accepted task commands are exact active-goal context reads matching `pnpm --silent symphony goal-status --goal <goalId> --json` and `pnpm --silent symphony goal next --goal <goalId> --json`.
- Arbitrary command input is rejected from the model: approved. Unsupported copy-only command text is counted in `rejectedTaskCommandCount` and is not rendered in `commands.items`.
- No generic runner or safety framework was added: approved. The reviewed task path does not add a generic shell runner, browser terminal, model invocation path, command DSL, permission system, or generic safety layer.
- Anchored to active goal/task/run/evidence context: approved. The preview displays goal id, task id, latest run id/status, worker/review evidence refs, adoption operation refs, and main verification ref from existing contracts.
- State changes come only from explicit backend events or command outputs: approved. The readiness/preview path reads goal runbook, goal next, goal progress ledger, goal event log, goal operation runs, latest run, and adoption inspect context; it does not infer task state from branch names, filenames, commit messages, prompts, task titles, or frontend component state.
- Browser boundary: approved. The preview renders copy-only text and safety fields; it does not execute shell, invoke models, open local files, download artifacts, merge, push, tag, self-approve, or register events/gates.
- v8 compatibility commands are not the top-level Workbench model: approved. The active Workbench model remains the current goal/runbook workflow.

## Commands run

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | Node syntax checks completed. |
| `pnpm test` | 0 | 745 tests passed, 0 failed. |
| `pnpm workbench:build` | 0 | Vite built Workbench static output: `src/symphony/workbench-static/index.html`, `assets/index-43cPgumS.css`, and `assets/index-DO3B5VL_.js`. |
| `git diff --check` | 0 | No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json` | 0 | Returned `goal-progress-ledger.v1`; task-2 currently reports `status=approved`, `reviewVerdict=APPROVED`, review evidence ref present, `mainVerificationRef=null`, and `releaseReady=false`. |
| `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json` | 0 | Returned `goal-next-action.v1`; current next action is task-2, role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-2 but main verification is missing.` |

## Findings

No blocking findings.

The implementation satisfies task-2 scope. The reviewed Workbench projection lists only the fixed v31 verification commands plus exact controlled active-goal context commands, shows the active goal/task/run/evidence context, and keeps the browser path display-only. I found no arbitrary command input, shell execution, model invocation, local file open, download, merge, push, tag, self-approval, event registration, or gate registration in the task-2 preview path.

## Boundary notes and residual risks

- The checkout was dirty before review with existing v29/v30/v31 docs, frontend/backend files, tests, and generated assets modified or untracked. I did not clean, stash, reset, revert, merge, push, tag, or publish.
- Current goal state differs from the delegation text: `goal-status` already reports task-2 as reviewed/approved and `goal next` has advanced to main verification. I did not run `symphony goal review`, `symphony goal update`, or `symphony goal gate`; this review evidence records the current state observed from the required commands.
- Browser smoke was not run separately in this review. Coverage used code inspection, generated static output, and the existing Workbench API/shell tests included in `pnpm test`.
- Task-2 is preview-only. Controlled execution and result recording are owned by later tasks.
- Generated Workbench asset hashes remain part of the current diff after `pnpm workbench:build`.

## Independence statement

Reviewer was independent from the worker. I did not implement or patch product code. I wrote only this review evidence file. I did not register goal events, reviews, gates, or release readiness. I did not merge, push, tag, or publish.

## Suggested review registration details

- Task id: `task-2`
- Reviewer id: `codex-v31-task-2-reviewer`
- Verdict: `approved`
- Evidence ref: `docs/plans/v31-task-2-review-evidence-2026-06-01.md`
- Failed command: none
