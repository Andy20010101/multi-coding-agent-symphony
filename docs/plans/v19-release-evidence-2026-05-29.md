# v19 release evidence

日期：2026-05-29
实际刷新时间：2026-05-30，Asia/Shanghai
目标：`v19-goal-runbook-next-action`
分支：`v19-task8-release-verification`
gate refresh HEAD：`30161285abddbf8a29f40cd81cb66ec4cb53c0c2`
基线：`v18`
当前 released repository tag：`v18`
状态：not release-ready

## scope checked

v19 adds an implemented Goal Runbook + Next Action Control Center surface:

- `goal-runbook.v1` defines a goal runbook blueprint with tasks, expected evidence, release gates, role policy, and copy-only commands.
- `goal-next-action.v1` reports the next operator action from managed runbook state, event log, and ledger state.
- `goal-prompt-pack.v1` renders copy-only `/goal` prompts for worker, reviewer, main-verifier, and release-manager roles.
- `goal-closeout-report.v1` reports missing task evidence and release gate gaps.
- `symphony goal init`, `symphony goal next`, `symphony goal prompt`, `symphony goal closeout`, and `symphony next` provide the terminal operator surface.
- Workbench Active Goal Control Center displays runbook, next action, prompt preview, and closeout gaps through read-only `GET` routes.

v19 does not include Autopilot, Workbench execution, browser terminal, artifact download, open local file, arbitrary path preview, model invocation, automatic merge, automatic tag, or browser-side confirm. This release verification did not create a tag, push, merge, publish a GitHub release, or call real model CLIs.

The prior Task 8 commit included a v20-v28 runbook pack that was outside this release evidence scope. That pack has been removed from the current branch working tree. The current diff against `main` is scoped to v19 release/final/task evidence docs and the Task 8 review evidence file.

## release gate command evidence

Commands were run from the repository root on branch `v19-task8-release-verification` after the v20-v28 files were removed from the working tree.

| Command | Exit code | Result | Exact output summary |
|---|---:|---|---|
| `pnpm check` | 0 | Passed. | Package script ran `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`. No diagnostics were printed after the script line. |
| `pnpm test` | 0 | Passed. | Node test runner reported `tests 660`, `suites 109`, `pass 660`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 3581.413583`. |
| `pnpm workbench:build` | 0 | Passed. | Vite `v8.0.14` transformed 17 modules and built `src/symphony/workbench-static/index.html` `0.42 kB` gzip `0.27 kB`, `assets/index-D3K9Dk14.css` `7.95 kB` gzip `2.10 kB`, and `assets/index-Duy8jdh2.js` `627.71 kB` gzip `117.91 kB` in `142ms`. Node printed the existing WASI experimental warning. |
| `pnpm test:mutation:gate` | 0 | Passed. | Stryker found 6 of 5423 files to mutate, instrumented 6 source files with 2382 mutants, and the initial test run succeeded with 65 tests in 8 seconds. Final mutation score `74.22`, covered score `78.23`, killed `1762`, timed out `6`, survived `492`, no coverage `122`, errors `0`; break threshold `60`; duration `24 minutes and 38 seconds`. |
| `pnpm audit --audit-level high` | 0 | Passed. | Output: `1 vulnerabilities found`; `Severity: 1 moderate`. No high-severity audit failure was reported. |
| `git diff --check` | 0 | Passed. | No output. |
| `pnpm mcas doctor` | 0 | Passed. | JSON output reported `"version": "1"`, `"status": "ok"`, `"nodeVersion": "24.14.0"`, `"packageManager": "pnpm"`, and commands `doctor`, `intake`, `github issue`, `harness run-taskpacket`, `queue manual`, `run-next`, `run-task`, `smoke`, `eval replay`. |

## tag evidence

This task did not create a tag.

| Command | Exit code | Result |
|---|---:|---|
| `git tag --list v19` | 0 | No output. No local `v19` tag exists in this checkout. |
| `git describe --tags --exact-match HEAD` | 128 | Output: `fatal: no tag exactly matches '30161285abddbf8a29f40cd81cb66ec4cb53c0c2'`. |

No GitHub release was created or verified.

## current goal status

The matching release gate events below are registered in the local goal event log:

| Gate | Event | Evidence ref |
|---|---|---|
| `release.pnpm-check` | `goal-event-log.v1:evt_1a15dadf9cb10379`, `release.gate-passed`. | `docs/plans/v19-release-evidence-2026-05-29.md` |
| `release.pnpm-test` | `goal-event-log.v1:evt_0fbe5d7a39a63bec`, `release.gate-passed`. | `docs/plans/v19-release-evidence-2026-05-29.md` |
| `release.workbench-build` | `goal-event-log.v1:evt_ed0aa13348a7a14d`, `release.gate-passed`. | `docs/plans/v19-release-evidence-2026-05-29.md` |
| `release.mutation-gate` | `goal-event-log.v1:evt_ef3bc8ec0366f283`, `release.gate-passed`. | `docs/plans/v19-release-evidence-2026-05-29.md` |
| `release.audit-high` | `goal-event-log.v1:evt_b41e02f4e9919d1a`, `release.gate-passed`. | `docs/plans/v19-release-evidence-2026-05-29.md` |
| `release.diff-check` | `goal-event-log.v1:evt_b099c51660aa3ef1`, `release.gate-passed`. | `docs/plans/v19-release-evidence-2026-05-29.md` |
| `release.mcas-doctor` | `goal-event-log.v1:evt_fbdb52f27fa055e9`, `release.gate-passed`. | `docs/plans/v19-release-evidence-2026-05-29.md` |
| `release.docs-updated` | `goal-event-log.v1:evt_baf6af73b3279d17`, `release.gate-passed`, sequence 38. | `docs/plans/v19-final-closure-evidence-2026-05-29.md` |

Task evidence events reconciled during this revision:

- task-4 worker evidence: `goal-event-log.v1:evt_8f4f13fe37713076`, sequence 33, evidence ref `docs/plans/v19-task4-worker-evidence-2026-05-29.md`.
- task-7 reviewer approval: `goal-event-log.v1:evt_fbdf653bb20a15d4`, sequence 34, evidence ref `docs/plans/v19-task7-review-evidence-2026-05-29.md`.
- task-7 main verification reconciliation: `goal-event-log.v1:evt_d791742183fe109e`, sequence 35, evidence ref `docs/plans/v19-task7-main-verification-evidence-2026-05-29.md`.
- task-8 review verdict: `goal-event-log.v1:evt_9d7a05bdf140269b`, sequence 36, verdict `NEEDS_REVISION`, evidence ref `docs/plans/v19-task8-review-evidence-2026-05-29.md`.
- task-8 worker self-check after revision: `goal-event-log.v1:evt_fb5abf09e074023d`, sequence 37, evidence ref `docs/plans/v19-task8-worker-evidence-2026-05-29.md`.

`pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` after those registrations reported:

- `summary.totalTasks: 9`
- `summary.completedTasks: 8`
- `summary.blockedTasks: 0`
- `summary.needsReviewTasks: 0`
- `summary.needsRevisionTasks: 0`
- `summary.releaseReady: false`
- `summary.releaseReadySource: null`
- task-4: `main-verified` with worker, reviewer, and main verification refs.
- task-7: `main-verified` with worker, reviewer, and main verification refs.
- task-8: `self-checked`, worker evidence ref `docs/plans/v19-task8-worker-evidence-2026-05-29.md`, review evidence ref `docs/plans/v19-task8-review-evidence-2026-05-29.md`, review verdict `NEEDS_REVISION`, and `mainVerificationRef: null`.
- release gates `pnpmCheck`, `pnpmTest`, `workbenchBuild`, `mutationGate`, `auditHigh`, `diffCheck`, `mcasDoctor`, and `docsUpdated`: `passed`
- release gate `tagEvidence`: `unknown`

`pnpm --silent symphony goal next --goal v19-goal-runbook-next-action --json` returned `goal-next-action.v1` with `status: "missing-runbook"` and reason `No active managed goal runbook is registered.`

`pnpm --silent symphony goal closeout --goal v19-goal-runbook-next-action --json` exited 64 with message `No managed goal-runbook.v1 state is registered for v19-goal-runbook-next-action.`

## release readiness

Status: `NOT READY`

The command gates passed, but `release.ready` is not justified. Current blockers:

- No managed `goal-runbook.v1` state is registered for `v19-goal-runbook-next-action`, so `symphony goal closeout` cannot produce the closeout report contract for this goal.
- task-8 needs a new independent reviewer approval after this worker revision.
- task-8 has no registered main verification event.
- `release.tag-evidence` is not present. No `v19` tag exists in this checkout, and this task did not create one.
- No `release.ready-declared` event is registered.

Passing `pnpm check`, `pnpm test`, `pnpm workbench:build`, mutation, audit, doctor, and `git diff --check` is command evidence. The matching release gate events listed above record those passed gates, but they do not create tag evidence or release readiness. This file does not declare v19 released and does not claim a v19 tag exists.
