# v19 Task 8 independent review evidence

文件名日期按任务要求使用 2026-05-29。实际审查执行时间：2026-05-30，时区 Asia/Shanghai。

Goal id: `v19-goal-runbook-next-action`
Task id: `task-8`
Review role: independent reviewer
Branch reviewed: `v19-task8-release-verification`
Current HEAD during review: `168423fae7e1f11d9656e43b328802d6d98349ec`
Verdict: `NEEDS_REVISION`

## reviewed files and state

- `README.md`
- `docs/plans/v19-task-evidence-index-2026-05-29.md`
- `docs/plans/v19-release-evidence-2026-05-29.md`
- `docs/plans/v19-final-closure-evidence-2026-05-29.md`
- `docs/plans/v19-task8-worker-evidence-2026-05-29.md`
- Current branch diff against `main`
- `.symphony/goals/events/v19-goal-runbook-next-action.ndjson`
- `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json`
- `pnpm --silent symphony goal next --goal v19-goal-runbook-next-action --json`
- `pnpm --silent symphony goal closeout --goal v19-goal-runbook-next-action --json`
- Task 1 through Task 7 worker, review, and main verification evidence files referenced by the event log

The branch diff against `main` is scoped to five evidence files:

| Status | Path |
|---|---|
| Added | `docs/plans/v19-final-closure-evidence-2026-05-29.md` |
| Modified | `docs/plans/v19-release-evidence-2026-05-29.md` |
| Modified | `docs/plans/v19-task-evidence-index-2026-05-29.md` |
| Added | `docs/plans/v19-task8-review-evidence-2026-05-29.md` |
| Added | `docs/plans/v19-task8-worker-evidence-2026-05-29.md` |

`git diff main...HEAD -- README.md` produced no output. README still says the current released repository tag is `v18`, v19 is an implemented draft, and v19 release-ready still requires an explicit `symphony goal gate --gate release.ready --status declared` event. I found no README claim that v19 tag evidence passed.

## evidence checks

Task 1 through Task 7 now have worker evidence, reviewer approval, and main verification in the event-backed ledger and in the referenced evidence files:

| Task | Worker evidence | Reviewer approval | Main verification |
|---|---|---|---|
| task-1 | `evt_db50ece4252ca9be`, `docs/plans/v19-task1-worker-evidence-2026-05-29.md` | `evt_bd196b84947c0c03`, `APPROVED`, `docs/plans/v19-task1-review-evidence-2026-05-29.md` | `evt_beb35401ede44f6c`, `docs/plans/v19-task1-main-verification-evidence-2026-05-29.md` |
| task-2 | `evt_e632b250e938b5fa`, `docs/plans/v19-task2-worker-evidence-2026-05-29.md` | `evt_37bf1244d4a61e59`, `APPROVED`, `docs/plans/v19-task2-review-evidence-2026-05-29.md` | `evt_dbab0ee5a0458362`, `docs/plans/v19-task2-main-verification-evidence-2026-05-29.md` |
| task-3 | `evt_ab7f8003e590b4dd`, `docs/plans/v19-task3-worker-evidence-2026-05-29.md` | `evt_682ed327c9dd2a30`, `APPROVED`, `docs/plans/v19-task3-review-evidence-2026-05-29.md` | `evt_232d71c30611384b`, `docs/plans/v19-task3-main-verification-evidence-2026-05-29.md` |
| task-4 | `evt_8f4f13fe37713076`, `docs/plans/v19-task4-worker-evidence-2026-05-29.md` | `evt_2cf40206107dbc86`, `APPROVED`, `docs/plans/v19-task4-review-evidence-2026-05-29.md` | `evt_8221ced231d42c74`, `docs/plans/v19-task4-main-verification-evidence-2026-05-29.md` |
| task-5 | `evt_43167c831152bdab`, `docs/plans/v19-task5-worker-evidence-2026-05-29.md` | `evt_4a887152a37eff6c`, `APPROVED`, `docs/plans/v19-task5-review-evidence-2026-05-29.md` | `evt_ea5fbc92432fe9d9`, `docs/plans/v19-task5-main-verification-evidence-2026-05-29.md` |
| task-6 | `evt_f9205beab08c9e56`, `docs/plans/v19-task6-worker-evidence-2026-05-29.md` | `evt_8be3fd362f139622`, `APPROVED`, `docs/plans/v19-task6-review-evidence-2026-05-29.md` | `evt_579bba01c789b474`, `docs/plans/v19-task6-main-verification-evidence-2026-05-29.md` |
| task-7 | `evt_f7f1d97c224c6cdb`, `docs/plans/v19-task7-worker-evidence-2026-05-29.md` | `evt_fbdf653bb20a15d4`, `APPROVED`, `docs/plans/v19-task7-review-evidence-2026-05-29.md` | latest `evt_d791742183fe109e`, `docs/plans/v19-task7-main-verification-evidence-2026-05-29.md` |

Release gate events are registered for:

| Gate | Event |
|---|---|
| `release.pnpm-check` | `evt_1a15dadf9cb10379`, `release.gate-passed` |
| `release.pnpm-test` | `evt_0fbe5d7a39a63bec`, `release.gate-passed` |
| `release.workbench-build` | `evt_ed0aa13348a7a14d`, `release.gate-passed` |
| `release.mutation-gate` | `evt_ef3bc8ec0366f283`, `release.gate-passed` |
| `release.audit-high` | `evt_b41e02f4e9919d1a`, `release.gate-passed` |
| `release.diff-check` | `evt_b099c51660aa3ef1`, `release.gate-passed` |
| `release.mcas-doctor` | `evt_fbdb52f27fa055e9`, `release.gate-passed` |
| `release.docs-updated` | `evt_604e0ea48531c5d7` and later `evt_baf6af73b3279d17`, `release.gate-passed` |

I did not find evidence that the release evidence fabricated a passed gate or hid the audit result. It records the moderate audit vulnerability and no high-severity failure. It also records that no `v19` tag exists.

## release-ready assessment

Release-ready is not supported by the current evidence.

Current goal-status reports:

- `summary.totalTasks: 9`
- `summary.completedTasks: 8`
- `summary.needsRevisionTasks: 0`
- `summary.releaseReady: false`
- `summary.releaseReadySource: null`
- task-8 `status: self-checked`
- task-8 `reviewVerdict: NEEDS_REVISION`
- task-8 `mainVerificationRef: null`
- `releaseGates.tagEvidence: unknown`

The final closure evidence handles release readiness correctly: it does not infer release-ready from passing commands, and it names `release.ready-declared` as missing. The blocker list is real, not cosmetic. `pnpm --silent symphony goal closeout --goal v19-goal-runbook-next-action --json` still exits 64 because no managed `goal-runbook.v1` state is registered for this goal.

## commands run

| Command | Exit code | Exact result used in review |
|---|---:|---|
| `git status --short --branch` | 0 | `## v19-task8-release-verification` |
| `git rev-parse HEAD` | 0 | `168423fae7e1f11d9656e43b328802d6d98349ec` |
| `git log --oneline --decorate main..HEAD` | 0 | `168423f (HEAD -> v19-task8-release-verification) Address v19 final closure review`; `3016128 Record v19 final closure evidence` |
| `git diff --stat main...HEAD` | 0 | `5 files changed, 378 insertions(+), 59 deletions(-)` |
| `git diff --name-status main...HEAD` | 0 | Added `v19-final-closure`, added `v19-task8-review`, added `v19-task8-worker`, modified `v19-release-evidence`, modified `v19-task-evidence-index` |
| `git diff main...HEAD -- README.md` | 0 | No output |
| `git diff --name-only 30161285abddbf8a29f40cd81cb66ec4cb53c0c2..HEAD` | 0 | Evidence-doc changes plus deletion of the out-of-scope v20-v28 runbook pack that had been present in the earlier Task 8 commit |
| Event-log summary script over `.symphony/goals/events/v19-goal-runbook-next-action.ndjson` | 0 | 38 events; task-1 through task-7 worker/review/main evidence present; release check/test/workbench/mutation/audit/diff/doctor/docs events present; no tag evidence event; no `release.ready-declared` event |
| `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` | 0 | `summary.totalTasks: 9`, `completedTasks: 8`, `releaseReady: false`, `releaseReadySource: null`; task-8 `self-checked`, `reviewVerdict: NEEDS_REVISION`, `mainVerificationRef: null`; `tagEvidence: unknown` |
| `pnpm --silent symphony goal next --goal v19-goal-runbook-next-action --json` | 0 | `status: "missing-runbook"`, reason `No active managed goal runbook is registered.` |
| `pnpm --silent symphony goal closeout --goal v19-goal-runbook-next-action --json` | 64 | `No managed goal-runbook.v1 state is registered for v19-goal-runbook-next-action.` |
| `git tag --list v19` | 0 | No output. No local `v19` tag exists. |
| `git describe --tags --exact-match HEAD` | 128 | `fatal: no tag exactly matches '168423fae7e1f11d9656e43b328802d6d98349ec'` |
| `pnpm check` | 0 | Ran `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`; no diagnostics after the script line |
| `pnpm test` | 0 | Node test runner summary: `tests 660`, `suites 109`, `pass 660`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 3796.075166` |
| `pnpm workbench:build` | 0 | Vite `v8.0.14` transformed 17 modules and built `src/symphony/workbench-static/index.html` 0.42 kB gzip 0.27 kB, `assets/index-D3K9Dk14.css` 7.95 kB gzip 2.10 kB, and `assets/index-Duy8jdh2.js` 627.71 kB gzip 117.91 kB in 143 ms. Node printed the existing WASI experimental warning. |
| `git diff --check` | 0 | No output |
| `pnpm audit --audit-level high` | 0 | `1 vulnerabilities found`; `Severity: 1 moderate`. No high-severity audit failure. |
| `pnpm mcas doctor` | 0 | JSON reported `"status": "ok"`, `"nodeVersion": "24.14.0"`, `"packageManager": "pnpm"`, and commands `doctor`, `intake`, `github issue`, `harness run-taskpacket`, `queue manual`, `run-next`, `run-task`, `smoke`, `eval replay` |

I did not rerun `pnpm test:mutation:gate` during this review. Existing release evidence records a mutation gate pass at gate refresh HEAD `30161285abddbf8a29f40cd81cb66ec4cb53c0c2`, and the current post-gate diff is docs/evidence cleanup rather than runtime source or test code. Before any future `APPROVED` release-ready review at current or later HEAD, either rerun and record `pnpm test:mutation:gate` at the final candidate HEAD or explicitly document why the prior mutation run remains accepted for the unchanged runtime scope.

## blockers and required changes

- Do not declare v19 release-ready from the current evidence. `goal-status` reports `releaseReady: false` and `releaseReadySource: null`.
- Register or restore managed `goal-runbook.v1` state for `v19-goal-runbook-next-action`, or document an approved release process that does not require `symphony goal closeout`; the current closeout command exits 64.
- Obtain a new independent reviewer approval after the Task 8 worker revision if the goal is to advance Task 8. The event log currently contains `reviewer.needs-revision` for task-8 and no later reviewer approval event.
- Add task-8 main verification evidence before any final release-ready declaration.
- Provide actual tag evidence before claiming tag evidence passed. `git tag --list v19` is empty and exact-match tag lookup at current HEAD fails.
- Declare `release.ready` only through an explicit `release.ready-declared` event after the evidence gaps are closed.
- Refresh mutation gate evidence at the final candidate HEAD, or make the accepted prior mutation run explicit, before asking for an approval review of release-ready state.

## verdict

`NEEDS_REVISION`

The current evidence supports "v19 command gates were mostly run and recorded" and "v19 is not release-ready." It does not support release-ready.
