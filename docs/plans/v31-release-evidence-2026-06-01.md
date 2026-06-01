# v31 Release Evidence

Goal id: `v31-main-verification-runner-evidence-writer`  
Release manager role: `release-manager`  
Evidence date: `2026-06-01`  
releaseManagerStatus: `ready-for-gate-registration`

## Release Gate Recommendation

All required release validation commands passed in the repo-local/current-checkout fallback. The coordinator can register the required release gates with this file as the release evidence ref.

| Gate | Recommendation | Evidence basis |
| --- | --- | --- |
| `release.pnpm-check` | `passed` | `pnpm check` exited `0`. |
| `release.pnpm-test` | `passed` | `pnpm test` exited `0`; Node test runner reported `751` tests, `751` pass, `0` fail. |
| `release.workbench-build` | `passed` | `pnpm workbench:build` exited `0`; Vite built `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-DR6VUXbR.js`. |
| `release.diff-check` | `passed` | `git diff --check` exited `0` with no output. |
| `release.docs-updated` | `passed` | v31 plan, execution prompts, runbook, fixture, all task evidence files, and this release evidence file are present. |

Optional checks do not block the required release gates. `pnpm audit --audit-level high` and `pnpm mcas doctor` passed. `pnpm test:mutation:gate` was available but was stopped after Stryker estimated a long run; no required gate depends on it.

## Validation Results

| Command | Exit | Result |
| --- | ---: | --- |
| `pnpm check` | `0` | Ran `node --check` over `src`, `scripts`, plugin, and test JavaScript files. No syntax errors reported. |
| `pnpm test` | `0` | Node test runner completed: `tests 751`, `suites 115`, `pass 751`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 5075.155958`. |
| `pnpm workbench:build` | `0` | Vite `v8.0.14` built the Workbench static output in `63ms`; output files were `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-BY5UaxlX.css`, and `src/symphony/workbench-static/assets/index-DR6VUXbR.js`. |
| `git diff --check` | `0` | No whitespace or conflict-marker output. |
| `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json` | `0` | Returned `goal-progress-ledger.v1`; `totalTasks=5`, `completedTasks=5`, `blockedTasks=0`, `releaseReady=false`; all release gate fields remained `unknown` before coordinator registration. |
| `pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json` | `0` | Returned `goal-next-action.v1`; next action is `taskId=release`, `role=release-manager`, `phase=release-gate`, reason `release.pnpm-check is not passed in goal-progress-ledger.v1.`, `blocked=false`. |
| `pnpm --silent symphony goal closeout --goal v31-main-verification-runner-evidence-writer --markdown` | `0` | Expected pre-gate state: worker evidence complete, review evidence complete, main verification complete, missing evidence `none`, release ready `no`, release gate gaps `pnpmCheck`, `pnpmTest`, `workbenchBuild`, `diffCheck`, `docsUpdated`. |
| `pnpm test:mutation:gate` | `143` | Optional check was started. Stryker found `6` files and `2382` mutants, initial test run succeeded with `71` tests in `17` seconds, then progress reached `155/2382` tested with `0` survived and `0` timed out. It was terminated after the remaining estimate reached roughly `52m`. |
| `pnpm audit --audit-level high` | `0` | Reported `1 vulnerabilities found`, severity `1 moderate`; no high-severity audit failure. |
| `pnpm mcas doctor` | `0` | Returned JSON with `"status": "ok"`, Node `24.14.0`, package manager `pnpm`, and the expected MCAS command list. |

## Task Evidence Matrix

Source basis: `pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json` and `.symphony/goals/events/v31-main-verification-runner-evidence-writer.ndjson`.

| Task | Goal-status state | Worker evidence | Review evidence | Main verification evidence | Visible event basis |
| --- | --- | --- | --- | --- | --- |
| `task-1` | `main-verified`; `statusSource=goal-event-log.v1:evt_6c071ef4d5aaca8c`; `reviewVerdict=APPROVED` | `docs/plans/v31-task-1-worker-evidence-2026-06-01.md` | `docs/plans/v31-task-1-review-evidence-2026-06-01.md` | `docs/plans/v31-task-1-main-verification-evidence-2026-06-01.md` | worker `evt_28733613f2683d32`; review approvals `evt_b3fa8c0d19c0cbbe`, `evt_d5034f7e0e4db6a9`; main-verification gate `evt_6c071ef4d5aaca8c` passed. |
| `task-2` | `main-verified`; `statusSource=goal-event-log.v1:evt_826a9701299f5c05`; `reviewVerdict=APPROVED` | `docs/plans/v31-task-2-worker-evidence-2026-06-01.md` | `docs/plans/v31-task-2-review-evidence-2026-06-01.md` | `docs/plans/v31-task-2-main-verification-evidence-2026-06-01.md` | worker `evt_3cb9ba4d401dfb10`; review approval `evt_7551adc99c910011`; main-verification gate `evt_826a9701299f5c05` passed. |
| `task-3` | `main-verified`; `statusSource=goal-event-log.v1:evt_8bc01cabf256b3b6`; `reviewVerdict=APPROVED` | `docs/plans/v31-task-3-worker-evidence-2026-06-01.md` | `docs/plans/v31-task-3-review-evidence-2026-06-01.md` | `docs/plans/v31-task-3-main-verification-evidence-2026-06-01.md` | worker `evt_f91789d7b662ec31`; review approval `evt_e8c75b40fd427223`; main-verification gate `evt_8bc01cabf256b3b6` passed. |
| `task-4` | `main-verified`; `statusSource=goal-event-log.v1:evt_da708e2bc9dbc2b8`; `reviewVerdict=APPROVED` | `docs/plans/v31-task-4-worker-evidence-2026-06-01.md` | `docs/plans/v31-task-4-review-evidence-2026-06-01.md` | `docs/plans/v31-task-4-main-verification-evidence-2026-06-01.md` | worker `evt_e9244b228fcabf44`; review needs-revision `evt_097dd9626f3e9cbe`; revision worker `evt_110ae848ce7e43e7`; review approval `evt_e087da6f77740281`; main-verification gate `evt_da708e2bc9dbc2b8` passed. |
| `task-5` | `main-verified`; `statusSource=goal-event-log.v1:evt_ec368efdad4a977e`; `reviewVerdict=APPROVED` | `docs/plans/v31-task-5-worker-evidence-2026-06-01.md` | `docs/plans/v31-task-5-review-evidence-2026-06-01.md` | `docs/plans/v31-task-5-main-verification-evidence-2026-06-01.md` | worker `evt_07c7b9d9456529bb`; review approval `evt_a2d453a28b8ba94d`; main-verification gate `evt_ec368efdad4a977e` passed. |

## Docs Updated Basis

These files were present during release validation:

| Required doc or evidence file | State |
| --- | --- |
| `docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md` | present |
| `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md` | present |
| `docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md` | present |
| `fixtures/contracts/goal-runbook.v31-main-verification-runner-evidence-writer.v1.json` | present |
| `docs/plans/v31-task-1-worker-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-1-review-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-1-main-verification-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-2-worker-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-2-review-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-2-main-verification-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-3-worker-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-3-review-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-3-main-verification-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-4-worker-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-4-review-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-4-main-verification-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-5-worker-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-5-review-evidence-2026-06-01.md` | present |
| `docs/plans/v31-task-5-main-verification-evidence-2026-06-01.md` | present |
| `docs/plans/v31-release-evidence-2026-06-01.md` | written by this release-manager pass |

## Current Goal State

`goal-status` summary:

- Contract: `goal-progress-ledger.v1`.
- Goal title: `v31 Main Verification Runner + Evidence Writer`.
- Baseline: tag `v30`, evidence ref `docs/plans/v30-release-evidence-2026-06-01.md`.
- Tasks: `5` total, `5` completed, `0` blocked, `0` needs review, `0` needs revision.
- Release ready: `false`; release ready source `null`.
- Required release gates are still `unknown` in the ledger because this release-manager pass did not register `symphony goal gate` events.

`goal next` summary:

- Contract: `goal-next-action.v1`.
- Status: `action-required`.
- Next action: `taskId=release`, `role=release-manager`, `phase=release-gate`.
- Reason: `release.pnpm-check is not passed in goal-progress-ledger.v1.`
- After completion: register with `symphony goal gate`; allowed event types are `release.gate-passed` and `release.gate-failed`.
- Safety: read-only and copy-only are `true`; Workbench write, browser execution, and model invocation are unavailable.

## Boundary and Fallback Notes

- Original blocked operation from the runbook: clean `main` checkout, `git pull --ff-only`, branch switching, and fast-forward merge basis for release validation.
- Boundary observed: the current checkout is dirty and on branch `v30-task-3-adoption-inspect-and-recovery-view`, not a clean v31 release branch. The user explicitly instructed not to clean, stash, revert, reset, merge, push, tag, publish, or stop because of dirt.
- Fallback used: repo-local/current-checkout validation from `/Users/andy/Documents/project/multi-coding-agent-symphony` at commit `07765f3b12023b83774e832d3c002384c82ddede`.
- Dirty basis before release evidence writing included modified docs, Workbench frontend/backend files, tests, deleted old static bundle files, and untracked v29/v30/v31 evidence and runbook fixture files. `pnpm workbench:build` generated current static assets `index-BY5UaxlX.css` and `index-DR6VUXbR.js` in that same dirty checkout.
- This fallback supersedes the earlier clean-checkout blocker for this release-manager evidence handoff only. It does not claim that a clean-main merge, tag, publish, or release has happened.
- No `symphony goal gate`, `release.ready`, merge, push, tag, publish, stash, reset, revert, or cleanup operation was run by this release-manager pass.

## Gate Lines

releaseGate `release.pnpm-check`: `passed`  
releaseGate `release.pnpm-test`: `passed`  
releaseGate `release.workbench-build`: `passed`  
releaseGate `release.diff-check`: `passed`  
releaseGate `release.docs-updated`: `passed`
