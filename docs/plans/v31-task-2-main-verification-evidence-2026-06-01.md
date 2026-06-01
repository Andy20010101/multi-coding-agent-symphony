# v31 task-2 main verification evidence

Goal id: `v31-main-verification-runner-evidence-writer`  
Release: `v31 Main Verification Runner + Evidence Writer`  
Task id: `task-2`  
Task title: `Allowlisted verification plan preview`  
Date: 2026-06-01  
Main verifier: `codex-v31-task-2-main-verifier`  
Verdict: `passed`

## Evidence refs

- Worker evidence: `docs/plans/v31-task-2-worker-evidence-2026-06-01.md`
- Review evidence: `docs/plans/v31-task-2-review-evidence-2026-06-01.md`
- Main verification evidence: `docs/plans/v31-task-2-main-verification-evidence-2026-06-01.md`
- Worker event: `evt_3cb9ba4d401dfb10`
- Review event: `evt_7551adc99c910011`

## Command results

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | Node syntax checks completed. |
| `pnpm test` | 0 | 745 tests passed, 0 failed. |
| `pnpm workbench:build` | 0 | Vite built `src/symphony/workbench-static/index.html`, `assets/index-43cPgumS.css`, and `assets/index-DO3B5VL_.js`. |
| `git diff --check` | 0 | No whitespace errors reported. Reran after writing this evidence file; exit code remained 0. |
| `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json` | 0 | Returned `goal-progress-ledger.v1`; task-2 is `approved`, `statusSource=goal-event-log.v1:evt_7551adc99c910011`, `reviewVerdict=APPROVED`, worker/review refs are present, `mainVerificationRef=null`, and `releaseReady=false`. |
| `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json` | 0 | Returned `goal-next-action.v1`; next action is task-2, role `main-verifier`, phase `main-verification`, reason `Reviewer approved task-2 but main verification is missing.` |
| `rg --hidden --no-ignore -n "evt_3cb9ba4d401dfb10\|evt_7551adc99c910011\|v31-task-2-worker-evidence-2026-06-01.md\|v31-task-2-review-evidence-2026-06-01.md\|codex-v31-task-2-worker\|codex-v31-task-2-reviewer" .symphony . 2>/dev/null` | 0 | Found worker event sequence 5 and review event sequence 6 in `.symphony/goals/events/v31-main-verification-runner-evidence-writer.ndjson`. |

## Event and review basis

The worker evidence file exists and matches event `evt_3cb9ba4d401dfb10`: `worker.evidence-recorded`, task `task-2`, actor role `worker`, actor id `codex-v31-task-2-worker`, evidence ref `docs/plans/v31-task-2-worker-evidence-2026-06-01.md`.

The review evidence file exists and matches event `evt_7551adc99c910011`: `reviewer.approved`, task `task-2`, actor role `reviewer`, actor id `codex-v31-task-2-reviewer`, verdict `APPROVED`, evidence ref `docs/plans/v31-task-2-review-evidence-2026-06-01.md`.

The reviewer was independent from the worker. The event log uses different actor roles and ids, and the review evidence records reviewer `codex-v31-task-2-reviewer` with verdict `approved`.

## Workbench preview basis

`frontend/workbench/src/api/contracts.js:283` defines `MAIN_VERIFICATION_COMMAND_ALLOWLIST` with exactly:

- `pnpm check`
- `pnpm test`
- `pnpm workbench:build`
- `git diff --check`

`frontend/workbench/src/api/contracts.js:290` defines the only controlled context commands as exact active-goal JSON reads for `goal-status` and `goal next`. `frontend/workbench/src/api/contracts.js:2658` projects `AllowlistedVerificationPlanPreview` from runbook/next copy-only commands plus the fixed v31 allowlist, filters task-scoped commands through `isControlledVerificationContextCommand`, counts rejected task commands, and does not copy rejected text into `commands.items`. `frontend/workbench/src/api/contracts.js:2725` sets `commandInputAccepted=false`, `arbitraryShellAccepted=false`, `browserExecutionAvailable=false`, `modelInvocationAvailable=false`, `genericShellRunner=false`, `writesGoalEvents=false`, and `registersGates=false`.

`frontend/workbench/src/App.jsx:1570` renders `allowlisted verification plan preview` under Main Verification Readiness. `frontend/workbench/src/App.jsx:1608` renders the preview context, command list, fixed allowlist, task-scoped controlled commands, safety fields, explicit contracts, and ignored inference sources. `frontend/workbench/src/App.jsx:1678` renders the commands as copy-only list entries with `browserExecutionAvailable` and `acceptsArbitraryInput` fields.

`tests/workbench-api-client.test.js:1375` asserts the projected command list contains the fixed four commands plus the exact active-goal `goal-status` context command, and `tests/workbench-api-client.test.js:1388` asserts command input, arbitrary shell, and browser execution are false. `tests/workbench-api-client.test.js:1399` adds branch/title/copy-only command text that looks like approval and verifies the readiness path does not infer state from it. `tests/workbench-shell.test.js:373` asserts the panel wiring for the preview, and `tests/workbench-shell.test.js:390` asserts the panel does not contain event preview/confirm calls, `window.open`, clipboard, textarea, or input controls.

`docs/workbench-operator-guide.md:289` and `docs/symphony-product-contracts.md:246` document the same boundary: fixed verification commands plus exact active-goal context reads only, no arbitrary shell text, no browser input, no local file opener, no event write, and no main-verification gate registration from the preview.

## Boundary notes

- I did not implement or modify product code.
- I did not run `symphony goal gate`, `symphony goal review`, or `symphony goal update`.
- I did not clean, stash, reset, revert, checkout, pull, merge, push, tag, or publish.
- I did not declare release readiness.
- The browser path remains display-only for this task. I found no browser UI execution path, arbitrary shell input, generic runner, model invocation, local file opener, download control, merge/push/tag/publish control, self-approval control, event write, gate registration, or release-ready declaration in the task-2 preview path.
- State/readiness is backed by `goal-status`, `goal next`, and the event journal. It is not inferred from branch name, filename, commit message, prompt text, task title, copy-only command text, test text, or frontend component state.

## Recovery and fallback

The runbook main verification flow includes `git checkout main`, `git pull --ff-only`, and `git merge --ff-only v31-task-2-allowlisted-verification-plan-preview`. The delegated boundary said the checkout was dirty and on `v30-task-3-adoption-inspect-and-recovery-view`, and instructed not to clean, stash, reset, revert, merge, push, tag, or publish. I used the repo-local/current-checkout fallback.

Fallback basis:

- Current branch observed by `git status --short --branch`: `v30-task-3-adoption-inspect-and-recovery-view`.
- Current checkout contains dirty v29/v30/v31 docs, Workbench frontend/backend files, tests, and generated static assets.
- Required verification commands were run on the current checkout and all exited 0.
- Code basis came from the touched files listed above plus generated Workbench static output rebuilt by `pnpm workbench:build`.
- Event basis came from `.symphony/goals/events/v31-main-verification-runner-evidence-writer.ndjson` and the required `goal-status` / `goal next` commands.

This fallback supersedes the checkout/pull/ff-only merge blocker for this delegated task-2 main verification evidence. It does not supersede a later clean-main release verification or release-ready decision.

## Suggested gate registration command

```sh
pnpm --silent symphony goal gate --goal v31-main-verification-runner-evidence-writer --task task-2 --gate main-verification --status passed --verifier codex-v31-task-2-main-verifier --evidence-ref docs/plans/v31-task-2-main-verification-evidence-2026-06-01.md --dry-run --json
```
