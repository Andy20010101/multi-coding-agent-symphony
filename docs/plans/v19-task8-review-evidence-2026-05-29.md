# v19 Task 8 independent review evidence

文件名日期按任务要求使用 2026-05-29。实际审查执行时间：2026-05-30，时区 Asia/Shanghai。

Goal id: `v19-goal-runbook-next-action`
Task id: `task-8`
Review role: independent reviewer
Branch reviewed: `v19-task8-release-verification`
Current HEAD during review: `30161285abddbf8a29f40cd81cb66ec4cb53c0c2`
Verdict: `NEEDS_REVISION`

## reviewed files and state

- `README.md`
- `docs/plans/v19-task-evidence-index-2026-05-29.md`
- `docs/plans/v19-release-evidence-2026-05-29.md`
- `docs/plans/v19-final-closure-evidence-2026-05-29.md`
- `docs/plans/v19-task8-worker-evidence-2026-05-29.md`
- `docs/plans/v19-task4-worker-evidence-2026-05-29.md`
- `docs/plans/v19-task7-review-evidence-2026-05-29.md`
- `.symphony/goals/events/v19-goal-runbook-next-action.ndjson`
- Current branch diff against `main`, including `git diff --stat main...HEAD`, `git diff --name-status main...HEAD`, the v19 evidence hunks, and the opening hunks for the added v20-v28 runbook pack.

The current branch diff is larger than Task 8 release evidence describes: 27 files, 42,897 insertions, and 60 deletions. Besides the v19 release evidence files, the branch adds two copies of a v20-v28 runbook pack and a combined 14,234-line v20-v28 document. Those files are not covered by the Task 8 release evidence or final closure scope.

## findings

`release-ready` is not supported by current evidence. `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` reports `summary.releaseReady: false` and `summary.releaseReadySource: null`. There is no `release.ready-declared` event and no `release.tag-evidence` event.

Task evidence is incomplete in the event-backed ledger:

| Task | Worker evidence event | Reviewer approval event | Main verification event |
|---|---|---|---|
| task-1 | Present: `evt_db50ece4252ca9be` | Present: `evt_bd196b84947c0c03` | Present: `evt_beb35401ede44f6c` |
| task-2 | Present: `evt_e632b250e938b5fa` | Present: `evt_37bf1244d4a61e59` | Present: `evt_dbab0ee5a0458362` |
| task-3 | Present: `evt_ab7f8003e590b4dd` | Present: `evt_682ed327c9dd2a30` | Present: `evt_232d71c30611384b` |
| task-4 | Missing. The worker evidence file exists, but no `worker.evidence-recorded` event is registered. | Present: `evt_2cf40206107dbc86` | Present: `evt_8221ced231d42c74` |
| task-5 | Present: `evt_43167c831152bdab` | Present: `evt_4a887152a37eff6c` | Present: `evt_ea5fbc92432fe9d9` |
| task-6 | Present: `evt_f9205beab08c9e56` | Present: `evt_8be3fd362f139622` | Present: `evt_579bba01c789b474` |
| task-7 | Present: `evt_f7f1d97c224c6cdb` | Missing. The review evidence file says `APPROVED`, but no reviewer verdict event is registered. | Present: `evt_82fba2d7f67e16dd` |

Task 8 has two worker evidence events for the same evidence ref: sequence 23 `evt_03f1bc6b033b537d` and sequence 32 `evt_eac6ac2b87e494b1`. It still has no registered reviewer verdict or main verification event. The duplicate worker event does not make task-8 approved or main-verified.

Release gate events are registered for the command gates listed below:

| Gate | Registered event |
|---|---|
| `release.pnpm-check` | `evt_1a15dadf9cb10379` |
| `release.pnpm-test` | `evt_0fbe5d7a39a63bec` |
| `release.workbench-build` | `evt_ed0aa13348a7a14d` |
| `release.mutation-gate` | `evt_ef3bc8ec0366f283` |
| `release.audit-high` | `evt_b41e02f4e9919d1a` |
| `release.diff-check` | `evt_b099c51660aa3ef1` |
| `release.mcas-doctor` | `evt_fbdb52f27fa055e9` |

I reran `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check` at current HEAD `3016128`; all passed. I did not rerun `pnpm test:mutation:gate`, `pnpm audit --audit-level high`, or `pnpm mcas doctor`. Existing release evidence records those gates as passed and the event log records matching gate events, but the release evidence files still say `当前 HEAD: eae726a`, while the reviewed branch HEAD is `3016128`. I would require mutation, audit, and doctor evidence to be refreshed at the actual release-candidate HEAD before an approval review.

README wording is acceptable for this review. `README.md` still says the latest completed mainline release and current released repository tag are `v18`; it describes v19 as unreleased and requiring explicit `release.ready` evidence. `git diff main...HEAD -- README.md` has no output, so this branch does not add a README claim that tag evidence passed.

Final closure correctly says release-ready must come from explicit event state. It records `release.ready-declared` as missing and does not infer readiness from passed commands. The closure evidence is still stale because it names `eae726a` as current HEAD and does not include the later sequence 32 task-8 worker event.

Release evidence does not show a fabricated pass in the checked command summaries. It records the moderate audit finding instead of hiding it, and it records the missing `v19` tag. It is still incomplete for this branch because it omits the current HEAD mismatch, the later duplicate task-8 worker event, and the large v20-v28 runbook files added by the branch.

## commands run

| Command | Exit code | Exact result used in review |
|---|---:|---|
| `git status --short --branch` | 0 | `## v19-task8-release-verification` |
| `git rev-parse --short HEAD` | 0 | `3016128` |
| `git rev-parse HEAD` | 0 | `30161285abddbf8a29f40cd81cb66ec4cb53c0c2` |
| `git log --oneline --decorate -8` | 0 | Top entry: `3016128 (HEAD -> v19-task8-release-verification) Record v19 final closure evidence`; next entry: `eae726a (origin/main, origin/HEAD, main) Add v19 task 7 verification evidence`. |
| `git diff --stat main...HEAD` | 0 | 27 files changed, 42,897 insertions, 60 deletions. |
| `git diff --name-status main...HEAD` | 0 | Adds `docs/plans/v19-final-closure-evidence-2026-05-29.md`, `docs/plans/v19-task8-worker-evidence-2026-05-29.md`, the v20-v28 runbook pack under `docs/plans/`, and the duplicate `workbench_v20_v28_goal_runbooks_latest_commands/` tree; modifies `docs/plans/v19-release-evidence-2026-05-29.md` and `docs/plans/v19-task-evidence-index-2026-05-29.md`. |
| `git diff main...HEAD -- README.md` | 0 | No output. |
| `git tag --list v19` | 0 | No output. No local `v19` tag exists. |
| `git describe --tags --exact-match HEAD` | 128 | `fatal: no tag exactly matches '30161285abddbf8a29f40cd81cb66ec4cb53c0c2'` |
| `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` | 0 | `summary.totalTasks: 9`, `summary.completedTasks: 8`, `summary.releaseReady: false`, `summary.releaseReadySource: null`; task-4 `workerEvidenceRef: null`; task-7 `reviewEvidenceRef: null`; task-8 `reviewEvidenceRef: null`, `mainVerificationRef: null`; `releaseGates.tagEvidence: unknown`. |
| `pnpm --silent symphony goal next --goal v19-goal-runbook-next-action --json` | 0 | `status: "missing-runbook"`, reason `No active managed goal runbook is registered.` |
| `pnpm --silent symphony goal closeout --goal v19-goal-runbook-next-action --json` | 64 | `No managed goal-runbook.v1 state is registered for v19-goal-runbook-next-action.` |
| Event-log summary script over `.symphony/goals/events/v19-goal-runbook-next-action.ndjson` | 0 | task-4 worker event missing; task-7 review event missing; release.pnpm-check/test/workbench-build/mutation-gate/audit-high/diff-check/mcas-doctor present; release.tag-evidence and release.ready missing; task-8 worker events present at sequences 23 and 32. |
| `pnpm check` | 0 | Ran `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`; no diagnostics after the script line. |
| `pnpm test` | 0 | Node test runner summary: `tests 660`, `suites 109`, `pass 660`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, `duration_ms 4102.016666`. |
| `pnpm workbench:build` | 0 | Vite `v8.0.14` transformed 17 modules and built `src/symphony/workbench-static/index.html` 0.42 kB gzip 0.27 kB, `assets/index-D3K9Dk14.css` 7.95 kB gzip 2.10 kB, and `assets/index-Duy8jdh2.js` 627.71 kB gzip 117.91 kB in 145 ms. Node printed the existing WASI experimental warning. |
| `git diff --check` | 0 | No output. |

## blockers

- Register or reconcile task-4 worker evidence in the goal event log. A file exists, but the ledger has no worker event for task-4.
- Register or reconcile task-7 reviewer approval in the goal event log. The review evidence file says `APPROVED`, but the ledger has no reviewer event.
- Register this task-8 reviewer verdict as `NEEDS_REVISION` if the goal journal should reflect this review. Do not proceed to task-8 main verification until the blockers are fixed and a later independent review approves the corrected evidence.
- Register managed `goal-runbook.v1` state or explain why release closeout can proceed while `symphony goal next` reports `missing-runbook` and `symphony goal closeout` exits 64.
- Correct v19 release evidence, worker evidence, and final closure evidence to use the actual release-candidate HEAD or rerun and record gates at that HEAD.
- Decide whether the v20-v28 runbook pack belongs in this v19 release branch. If it stays, include it in release evidence and review scope; if not, remove or split it from Task 8.
- Provide tag evidence or keep release-ready blocked. Current `git tag --list v19` returns no output.
- Declare `release.ready` only through an explicit `symphony goal gate --gate release.ready --status declared` event after the evidence gaps are closed. Passing command gates alone is not enough.

## verdict

`NEEDS_REVISION`

The current evidence supports "some release gates passed" and "v19 is not release-ready." It does not support release-ready. The blockers above must be fixed before an independent reviewer can approve Task 8 release readiness.
