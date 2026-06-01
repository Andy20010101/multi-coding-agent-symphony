# v31 task-2 worker evidence

Goal id: `v31-main-verification-runner-evidence-writer`  
Release: `v31 Main Verification Runner + Evidence Writer`  
Task id: `task-2`  
Task title: `Allowlisted verification plan preview`  
Date: 2026-06-01

## User-visible value

Users can see the verification plan before running anything, and the browser does not accept arbitrary shell text.

## Implementation summary

Workbench now shows an allowlisted verification plan preview inside Main Verification Readiness. The preview is anchored to the active goal/task/run/evidence context and lists only these fixed verification commands:

- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `git diff --check`

The preview may add task-scoped controlled context commands when they exactly match the active goal's `goal-status` or `goal next` JSON command shape. Unsupported command text from runbook or next-action copy-only fields is counted as rejected and is not rendered in the command list.

The UI displays `commandInputAccepted=false`, `arbitraryShellAccepted=false`, `browserExecutionAvailable=false`, `modelInvocationAvailable=false`, `genericShellRunner=false`, `writesGoalEvents=false`, and `registersGates=false`.

## Explicit state sources

Used:

- `goal-runbook.v1` task metadata and task `copyOnlyCommands`
- `goal-next-action.v1` active task, role, phase, evidence state, and copy-only commands
- `goal-progress-ledger.v1` task evidence refs and controlled goal-status context command
- `goal-event-log.v1` reviewer and main-verification events
- `goal-operation-runs.v1` adoption operation ids when present
- `symphony.console-run` latest run id/status when present

Ignored as plan or readiness authority:

- browser command input
- free-form shell text
- branch names
- file names
- commit messages
- prompt text
- task titles
- frontend component state

## Workbench user path

Open Workbench and inspect the active goal Verification path:

1. Main Verification Readiness shows the active goal/task state.
2. The `allowlisted verification plan preview` subsection shows active goal id, task id, latest run id/status, worker/review evidence refs, adoption operation refs, and any existing main verification ref.
3. The command list shows copy-only verification commands. There is no command input, terminal, model trigger, file opener, download control, merge/push/tag control, self-approval control, or gate registration action in this preview.

## Files changed for task-2

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-43cPgumS.css`
- `src/symphony/workbench-static/assets/index-DO3B5VL_.js`
- `src/symphony/workbench-static/assets/index-B9IfCFVY.css` deleted by `pnpm workbench:build`
- `src/symphony/workbench-static/assets/index-NKKg_tJp.js` deleted by `pnpm workbench:build`
- `docs/plans/v31-task-2-worker-evidence-2026-06-01.md`

The checkout also had pre-existing dirty v29/v30/v31 docs, fixtures, frontend/backend files, tests, and generated assets before this task. I did not clean, stash, reset, revert, merge, push, tag, or publish.

## Commands and outcomes

- `node --test tests/workbench-api-client.test.js`  
  Exit code: 0. Outcome: 38 tests passed.
- `node --test tests/workbench-shell.test.js`  
  Exit code: 0. Outcome: 25 tests passed.
- `pnpm check`  
  Exit code: 0. Outcome: configured Node syntax checks completed.
- `pnpm test`  
  Exit code: 0. Outcome: 745 tests passed.
- `pnpm workbench:build`  
  Exit code: 0. Outcome: Vite built Workbench static output with `assets/index-43cPgumS.css` and `assets/index-DO3B5VL_.js`.
- `git diff --check`  
  Exit code: 0. Outcome: no whitespace errors. Rerun after writing this evidence file also exited 0.
- `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json`  
  Exit code: 0. Outcome: returned `goal-progress-ledger.v1`; summary shows 1 of 5 tasks complete, task-2 status `planned`, releaseReady `false`.
- `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json`  
  Exit code: 0. Outcome: returned `goal-next-action.v1`; next is task-2, role `worker`, phase `implement`, reason `No explicit worker evidence is recorded for task-2.`
- `pnpm symphony console --port 8765`  
  Exit code: 1. Outcome: blocked by `EADDRINUSE` on `127.0.0.1:8765`.
- `pnpm symphony console --port 8766`  
  Outcome: server started for browser smoke at `http://127.0.0.1:8766/`; stopped after verification with Ctrl-C, producing the expected interrupted lifecycle exit code 1.
- Browser smoke on `http://127.0.0.1:8766/workbench/`  
  Outcome: preview visible after reload; all four fixed commands plus the active goal-status context command were visible; `commandInputAccepted=false`, `arbitraryShellAccepted=false`, `genericShellRunner=false`; readiness panel had 0 `input`/`textarea` elements.

## Boundary notes

- Runbook branch for this task is `v31-task-2-allowlisted-verification-plan-preview`.
- Current checkout is `v30-task-3-adoption-inspect-and-recovery-view` with existing dirty worktree state. Creating or switching to the runbook branch would have mixed this task with unrelated dirty changes, so I used the current-checkout fallback and recorded it here.
- Console port `8765` was already in use, so browser smoke used the repo-supported `--port 8766` fallback.
- I did not run `symphony goal update`, `symphony goal review`, or `symphony goal gate`.
- I did not declare reviewer approval, main verification, release gates, or release readiness.
- I did not add a generic shell runner, browser terminal, model invocation path, permission framework, goal framework, artifact framework, or command DSL.
- v8 compatibility commands remain compatibility/script commands and are not presented as the top-level Workbench model.

## Residual risks

- This task adds preview only. Task-3 owns controlled execution and command-result recording.
- Generated Workbench static asset names changed because `pnpm workbench:build` hashes changed.
- The dirty checkout contains unrelated v29/v30/v31 modifications and untracked evidence files that were not cleaned or reverted.

## Reviewer handoff checklist

- Check that `AllowlistedVerificationPlanPreview` renders under Main Verification Readiness.
- Check that the command list includes only `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, and exact controlled active-goal context commands.
- Check that rejected command text is counted but not rendered as a runnable/copyable plan command.
- Check that the preview shows active goal/task/run/evidence refs without turning them into approval or verification state.
- Check that no browser UI path executes shell commands, invokes models, opens local files, downloads artifacts, merges, pushes, tags, self-approves, or registers gates from this preview.

## Worker boundary statement

Worker did not self-approve, did not register goal events, did not register reviews, did not register gates, did not register release readiness, and did not merge, push, tag, or publish.

## Suggested registration dry-run

```sh
pnpm --silent symphony goal update --goal v31-main-verification-runner-evidence-writer --task task-2 --event worker.evidence-recorded --actor codex-v31-task-2-worker --evidence-ref docs/plans/v31-task-2-worker-evidence-2026-06-01.md --dry-run --json
```
