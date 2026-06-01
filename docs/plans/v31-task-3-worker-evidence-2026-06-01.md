# v31 task-3 worker evidence

Date: 2026-06-01
Goal id: `v31-main-verification-runner-evidence-writer`
Release name: `v31 Main Verification Runner + Evidence Writer`
Task id: `task-3`
Task title: `Verification operation console`

## User-visible value

长时间验证不会黑盒；用户能看到状态、stdout/stderr 摘要、exit code 和 artifact refs。

## State sources

Used:
- `goal-runbook.v1` for active goal/task, task title, evidence refs, and task copy-only commands.
- `goal-next-action.v1` for active task/role/phase.
- `goal-operation-runs.v1` for Workbench operation status, command output summaries, exit code, artifact refs, verifier summary, and polling state.
- `controlled-verification-run-confirmation.v1` returned by `POST /api/goals/<goal-id>/verification-run-confirm`.
- Command outputs from the fixed verification suite.

Ignored as inference sources:
- Branch names, file names, commit messages, prompt text, task titles, frontend component state, and command success as gate status.

## Implementation summary

Connected the v31 allowlisted verification suite to the existing Workbench operation registry and operation console. The new controlled verification confirm route accepts only `goalId`, `taskId`, and `suiteId=v31-main-verification-command-suite`; it re-reads the managed runbook task, runs only the fixed suite plus already-allowed active-goal JSON read commands, records a `verification` operation as `running`, then updates it to `confirmed` or `failed`.

The saved command result contract records per-command status, stdout/stderr summaries, exit code, timestamps, operation artifact refs, verifier summary, and `gatePassed: false`. Passing the suite does not append goal events and does not pass the `main-verification` gate.

Workbench user path changed:
- Verification panel -> allowlisted verification plan preview -> controlled verification operation.
- The button starts only the controlled suite through `/api/goals/<goal-id>/verification-run-confirm`.
- Goal Operation Console polls `/api/goals/<goal-id>/operations` and shows the verification operation status, command preview, stdout/stderr summaries, exit code, run result, artifact refs, and verifier summary.

Browser smoke:
- Opened `http://127.0.0.1:8765/workbench/` from `pnpm --silent symphony console --host 127.0.0.1 --port 8765`.
- Verified visible strings: `Start controlled verification run`, `controlled verification operation`, `Goal Operation Console`, `Verification operation console`, and `v31-main-verification-runner-evidence-writer`.
- Screenshot saved at `tmp/v31-task3-workbench-smoke.png`.

## Files changed

Task-3 implementation/test/doc files:
- `src/symphony/console.js`
- `src/symphony/goal-operation-run-registry.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BuJBc_Dh.js`
- `tests/v23-goal-operation-console-api.test.js`
- `tests/v23-goal-operation-run-registry.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v31-task-3-worker-evidence-2026-06-01.md`

Workbench static build also replaced prior built assets in `src/symphony/workbench-static/assets/`.

## Commands run

Required validation:
- `pnpm check` -> exit 0.
- `pnpm test` -> first run exit 1. Failures were caused by task-3 test/static guard regressions during implementation: sanitized error detail expectation, accidental adoption operation id edit, and frontend click-handler allowlist. Fixed and reran.
- `pnpm test` -> exit 0. Result: 749 tests passed, 0 failed.
- `pnpm workbench:build` -> exit 0. Vite built `src/symphony/workbench-static/index.html`, CSS, and JS bundle.
- `git diff --check` -> exit 0.
- `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json` -> exit 0. `task-3` remained `planned`; task-1 and task-2 were `main-verified`; release ready was false.
- `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json` -> exit 0. Next action remained `task-3`, role `worker`, phase `implement`, reason `No explicit worker evidence is recorded for task-3.`

Focused checks run during implementation:
- `node --test tests/v23-goal-operation-run-registry.test.js` -> exit 0.
- `node --test tests/v23-goal-operation-console-api.test.js` -> exit 0 after fixes.
- `node --test tests/workbench-api-client.test.js` -> exit 0 after fixes.
- `node --test tests/workbench-shell.test.js` -> exit 0.
- `node --test tests/workbench-route-smoke.test.js --test-name-pattern "statically keeps"` -> exit 0.

## Boundary notes

The checkout started dirty on branch `v30-task-3-adoption-inspect-and-recovery-view`, not the runbook task branch `v31-task-3-verification-operation-console`. I did not branch, clean, stash, reset, revert, merge, push, tag, publish, or overwrite unrelated changes. I used the repo-local current-checkout fallback and documented this boundary here.

The worktree already contained modified and untracked v29/v30/v31 planning/evidence files and Workbench files before this task. I only changed the task-3 implementation, tests, docs, generated Workbench static bundle, and this evidence file. Existing unrelated dirty files remain untouched.

No `symphony goal update`, `goal review`, or `goal gate` commands were run. Coordinator should register worker evidence.

## Residual risks

The controlled verification run is synchronous from the POST caller perspective, but it writes a `running` operation before executing commands and the Workbench operation console polls the registry. Very long commands still occupy the confirm request until completion.

The operation artifact ref points to the scoped operation registry route rather than a separate downloadable artifact. This keeps the browser from opening local files or downloading artifacts while still giving a stable artifact ref for the command result contract.

## Reviewer handoff checklist

- Confirm `POST /api/goals/<goal-id|latest>/verification-run-confirm` rejects unsupported body fields and does not create goal events.
- Confirm command execution is limited to `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, and exact active-goal JSON read commands.
- Confirm `goal-operation-runs.v1` accepts `commandKind: "verification"` and `status: "running"`.
- Confirm Workbench shows verification status, stdout/stderr summaries, exit code, artifact refs, and `gatePassed: false`.
- Confirm command success does not register `main.verification-passed`.

Worker did not self-approve, did not register goal events/reviews/gates/release readiness, and did not merge/push/tag/publish.
