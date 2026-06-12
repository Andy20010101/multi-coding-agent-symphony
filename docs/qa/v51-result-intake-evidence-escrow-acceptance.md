# v51 Result Intake Evidence Escrow acceptance

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal: `v51-result-intake-evidence-escrow`
PR-5 branch: `codex/v51-acceptance-closeout-v52-handoff`
Acceptance baseline: `d78edf3e5db97edaf6679f64a9b90378dd94d78c`

## Merged implementation record

| Scope | PR | Branch | Head commit | Merge commit | Merged at |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook | #68 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/68` | `codex/v51-result-intake-evidence-escrow-runbook` | `db2c4efc8ab1e02a43494b4c124a45c43d854564` | `d0c0d831973e2a8151784ac478e6d426e9ab2c00` | 2026-06-12T08:36:53Z |
| PR-1 contracts, fixtures, schema tests | #69 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/69` | `codex/v51-result-intake-contracts-fixtures-schema-tests` | `ded4ec6e666e954744983ac22797e38c445a6c0e` | `1cb409ac0aef50e661ec6e0d8c3c053ef9806a79` | 2026-06-12T09:11:03Z |
| PR-2 preview and confirm API | #70 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/70` | `codex/v51-result-intake-preview-confirm-api` | `cda381afff40a710e8787676b963e38c72e2683e` | `3bdac82550a58f7a2acd7c1d06397f1fac4e9467` | 2026-06-12T10:57:15Z |
| PR-3 pending result projection and eligibility | #71 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/71` | `codex/v51-pending-result-projection-eligibility` | `be69ab825c01e31569ba1a4e4cba723835039106` | `e9750fe5a0364666868dbf33b63ddb71ef05c2ce` | 2026-06-12T12:06:47Z |
| PR-4 Workbench result intake lane | #72 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/72` | `codex/v51-workbench-result-intake-lane` | `8480adb679b74691d5aeaf787c8a2d26db71eb00` | `d78edf3e5db97edaf6679f64a9b90378dd94d78c` | 2026-06-12T12:37:29Z |

## Acceptance path evidence

| Runbook step | Evidence | Acceptance result |
| --- | --- | --- |
| 1. Prepare a fake worker result block. | PR #69 added `fixtures/contracts/result-intake/safe-worker-result.v1.json`, `blocker-result.v1.json`, unsafe transcript fixtures, unsupported reviewer/main/release fixtures, and `src/symphony/result-intake-contracts.js`. `node --test tests/v51-result-intake-evidence-escrow.test.js` passed 10 tests with 0 failures. | A fake worker result and blocker result can be validated through `resultIntakeRequest.v1` without carrying raw transcript fields. |
| 2. Run result intake preview. | PR #70 added `POST /api/goals/<goal-id>/result-intake-preview` through `src/symphony/console.js` and `src/symphony/console/server.js`. `node --test tests/v51-result-intake-preview-confirm-api.test.js tests/v51-pending-result-projection-eligibility.test.js` passed 15 tests with 0 failures. | Preview returns `resultIntakePreview.v1`, `readOnly: true`, `willMutate: false`, sanitized summary fields, controlled evidence refs, and a `sha256:` plan hash. |
| 3. Confirm preview does not write `goal-event-log.v1`. | `tests/v51-result-intake-preview-confirm-api.test.js` snapshots the state directory before preview and checks no state or operation registry files are written. `tests/v51-result-intake-evidence-escrow.test.js` checks `previewWriteTarget.writesGoalEventLog` is `false`. | Preview is a no-write operation and does not append or prepare a goal event log write. |
| 4. Confirm result escrow with the preview `planHash`. | PR #70 added `POST /api/goals/<goal-id>/result-intake-confirm` and `src/symphony/result-intake-state.js`. The focused v51 API command passed 15 tests, including missing `planHash`, mismatched `planHash`, expired preview, stale preview, and successful confirm. | Confirm writes `resultEvidenceEscrow.v1` and `pendingResult.v1` only when the submitted `planHash` matches the preview. |
| 5. Verify `pendingResult.v1` appears in the supervisor read model. | PR #71 updated `src/symphony/goal-supervisor/app-read-model.js`. The focused v51 projection command passed 15 tests; `node --test tests/v50-supervisor-event-registration-eligibility.test.js tests/v44-goal-supervisor-app-read-model.test.js` passed 17 tests with 0 failures. | Confirmed result escrow is projected as `pendingResult.v1` with sanitized summary, controlled evidence refs, and `directGoalEventAppendAvailable: false`. |
| 6. Verify `supervisorEventRegistrationEligibility.v1` can read the pending result. | PR #71 updated `src/symphony/goal-supervisor/event-registration-eligibility.js`. `tests/v51-pending-result-projection-eligibility.test.js` checks safe worker and blocker pending results become eligible only through the v50 preview route. | Eligibility reads `pendingResult.v1` and produces a controlled v50 event preview request without appending an event. |
| 7. Verify v50 event preview can generate `goal-update-plan.v1` from the pending result. | `node --test tests/v21-goal-plan-preview-api.test.js tests/v23-goal-operation-console-api.test.js` passed 22 tests with 0 failures. `tests/v51-pending-result-projection-eligibility.test.js` checks the preview route `/api/goals/v51-result-intake-evidence-escrow/event-plan-preview` with `command: update`. | The append path stays in v50: pending result can lead to `goal-update-plan.v1`, but only through dry-run event preview. |
| 8. Verify v50 event confirm still requires `planHash`. | The v21/v23 command passed 22 tests, including confirm rejection when `planHash` is omitted and when hashes mismatch. | Goal event append still requires a matching v50 preview `planHash`; v51 result intake cannot bypass it. |
| 9. Verify reviewer verdicts, main verification gates, and release gates are not opened by v51. | `tests/v51-result-intake-evidence-escrow.test.js` blocks reviewer, main verification, and release gate event families before escrow confirm. `tests/v51-result-intake-preview-confirm-api.test.js` checks those families return safe errors without writes. `tests/v50-supervisor-event-registration-eligibility.test.js` routes reviewer to `symphony goal review` and main/release to `symphony goal gate`. | v51 does not mutate reviewer verdicts, main verification gates, or release gates. Those event families stay on their existing command families. |
| 10. Verify no provider execution, child dispatch, terminal UI, frontend local session read, transcript compaction, new thread creation, git write, tag, publish, or GitHub Release automation. | PR #72 added only `Preview Result Intake`, `Confirm Result Escrow`, and `Refresh Supervisor State` controls. `pnpm workbench:build` passed. `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` passed 112 tests with 0 failures. `git tag --list 'v51' 'v50'` returned only `v50`; `gh release view v51` returned `release not found`. | Workbench exposes controlled result intake and refresh only. v51 PR-5 does not create a tag, publish, create a GitHub Release, or add execution surfaces. |

## Validation evidence

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed. `node_modules` was missing in this worktree; the lockfile was already up to date and no lockfile change was made. |
| `pnpm workbench:build` | Passed. Vite built `src/symphony/workbench-static/index.html`, `assets/index-9cXHz3CJ.css`, and `assets/index-wYUoDpH-.js`. |
| `node --test tests/v51-result-intake-evidence-escrow.test.js` | Passed: 10 tests, 0 failures. |
| `node --test tests/v51-result-intake-preview-confirm-api.test.js tests/v51-pending-result-projection-eligibility.test.js` | Passed: 15 tests, 0 failures. |
| `node --test tests/v50-supervisor-event-registration-eligibility.test.js tests/v44-goal-supervisor-app-read-model.test.js` | Passed: 17 tests, 0 failures. |
| `node --test tests/v21-goal-plan-preview-api.test.js tests/v23-goal-operation-console-api.test.js` | Passed: 22 tests, 0 failures. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed: 112 tests, 0 failures. Vite emitted a non-failing `WebSocket server error: Port 24678 is already in use` warning during the run. |
| `pnpm check` | Passed. |
| `unzip -t docs/plans/mcas_v52_v60_plan_and_runbooks_2026-06-12.zip` | Passed. `unzip` reported `No errors detected in compressed data`. |
| `shasum -a 256 docs/plans/mcas_v52_v60_plan_and_runbooks_2026-06-12.zip` | `a325f88498d55b9f46adcf68b5c51ca3ae28d5a74f6c5ed2c3a1d276b0c09d7a` |
| `git diff --check` | Passed. |
| `git diff --cached --check` | Passed after staging the four PR-5 files. |

## Boundary result

v51 accepts worker or manual result evidence as sanitized escrow. It does not run a provider, dispatch a child, compact a transcript, create a thread, expose raw transcript text, read local session files from the frontend, append a goal event directly, mutate reviewer/main/release gates, write git state, create a tag, publish, or create a GitHub Release.

The next safe product step is v52 system golden path and daily acceptance, not provider execution.
