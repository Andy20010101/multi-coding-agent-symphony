# v19 task evidence index

日期：2026-05-29
目标：`v19-goal-runbook-next-action`
基线：`v18`
当前分支：`v19-task7-docs-operator-guide`

## 记录规则

本索引记录当前 checkout 能核对到的 v19 planning、bootstrap、worker evidence、independent review evidence、main verification evidence 和 release gate evidence。它不把 commit、branch、文件名、命令文本、测试通过或 Workbench 文案解释成 reviewer approval、main-verified 或 release-ready。

当前 released repository tag 仍是 `v18`。v19 不是 released/tagged 状态。release-ready 仍需要显式 `symphony goal gate --gate release.ready --status declared` confirm 后写入的 `release.ready-declared` event。

当前 `pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` 显示：

- `summary.totalTasks: 9`
- `summary.completedTasks: 7`
- `summary.needsRevisionTasks: 0`
- `summary.releaseReady: false`
- `summary.releaseReadySource: null`
- task-7 `status: in-progress`, `statusSource: goal-event-log.v1:evt_f7f1d97c224c6cdb`, worker evidence ref `docs/plans/v19-task7-worker-evidence-2026-05-29.md`
- release gates `pnpmCheck`、`pnpmTest`、`workbenchBuild`、`mutationGate`、`auditHigh`、`diffCheck`、`mcasDoctor`、`docsUpdated`、`tagEvidence` 均为 `unknown`

`task-0` 是 goal-status template bootstrap 留下的历史 event，不是 v19 runbook 的 task-1 到 task-8 范围。当前本地 `.symphony` 没有 managed runbook state；`symphony goal next --goal v19-goal-runbook-next-action --json` 返回 `status: missing-runbook`，直到 runbook 通过 `symphony goal init` dry-run / confirm 注册。

## planning and bootstrap evidence

| Item | Evidence |
|---|---|
| planning | `goal-event-log.v1:evt_79a5cb787d2dc1b7`, `worker.evidence-recorded`, evidence ref `docs/plans/v19-goal-runbook-next-action-plan-2026-05-29.md`. |
| task-0 bootstrap worker | `goal-event-log.v1:evt_079f9acb523131ac`, `worker.evidence-recorded`, evidence ref `docs/plans/v19-task0-register-goal-template-evidence-2026-05-29.md`. |
| task-0 bootstrap main verification | `goal-event-log.v1:evt_aaf4e77d186b7730`, `main.verification-passed`, evidence ref `docs/plans/v19-task0-main-verification-evidence-2026-05-29.md`. |

## task evidence

| Task | Worker evidence | Independent review evidence | Main verification evidence | Release gate evidence |
|---|---|---|---|---|
| task-1 | `goal-event-log.v1:evt_db50ece4252ca9be`, `worker.evidence-recorded`, evidence ref `docs/plans/v19-task1-worker-evidence-2026-05-29.md`. | `goal-event-log.v1:evt_bd196b84947c0c03`, `reviewer.approved`, verdict `APPROVED`, evidence ref `docs/plans/v19-task1-review-evidence-2026-05-29.md`. | `goal-event-log.v1:evt_beb35401ede44f6c`, `main.verification-passed`, evidence ref `docs/plans/v19-task1-main-verification-evidence-2026-05-29.md`. | No v19 release gate event is registered for this task. |
| task-2 | `goal-event-log.v1:evt_e632b250e938b5fa`, `worker.evidence-recorded`, evidence ref `docs/plans/v19-task2-worker-evidence-2026-05-29.md`. | `goal-event-log.v1:evt_37bf1244d4a61e59`, `reviewer.approved`, verdict `APPROVED`, evidence ref `docs/plans/v19-task2-review-evidence-2026-05-29.md`. | `goal-event-log.v1:evt_dbab0ee5a0458362`, `main.verification-passed`, evidence ref `docs/plans/v19-task2-main-verification-evidence-2026-05-29.md`. | No v19 release gate event is registered for this task. |
| task-3 | `goal-event-log.v1:evt_ab7f8003e590b4dd`, `worker.evidence-recorded`, evidence ref `docs/plans/v19-task3-worker-evidence-2026-05-29.md`. | `goal-event-log.v1:evt_682ed327c9dd2a30`, `reviewer.approved`, verdict `APPROVED`, evidence ref `docs/plans/v19-task3-review-evidence-2026-05-29.md`. | `goal-event-log.v1:evt_232d71c30611384b`, `main.verification-passed`, evidence ref `docs/plans/v19-task3-main-verification-evidence-2026-05-29.md`. | No v19 release gate event is registered for this task. |
| task-4 | Worker evidence doc exists at `docs/plans/v19-task4-worker-evidence-2026-05-29.md`, but the current v19 event log summary used for this index has no `worker.evidence-recorded` event for `task-4`; `goal-status` reports `workerEvidenceRef: null`. | `goal-event-log.v1:evt_2cf40206107dbc86`, `reviewer.approved`, verdict `APPROVED`, evidence ref `docs/plans/v19-task4-review-evidence-2026-05-29.md`. | `goal-event-log.v1:evt_8221ced231d42c74`, `main.verification-passed`, evidence ref `docs/plans/v19-task4-main-verification-evidence-2026-05-29.md`. | No v19 release gate event is registered for this task. |
| task-5 | `goal-event-log.v1:evt_43167c831152bdab`, `worker.evidence-recorded`, evidence ref `docs/plans/v19-task5-worker-evidence-2026-05-29.md`. | `goal-event-log.v1:evt_4a887152a37eff6c`, `reviewer.approved`, verdict `APPROVED`, evidence ref `docs/plans/v19-task5-review-evidence-2026-05-29.md`. | `goal-event-log.v1:evt_ea5fbc92432fe9d9`, `main.verification-passed`, evidence ref `docs/plans/v19-task5-main-verification-evidence-2026-05-29.md`. | No v19 release gate event is registered for this task. |
| task-6 | `goal-event-log.v1:evt_f9205beab08c9e56`, `worker.evidence-recorded`, evidence ref `docs/plans/v19-task6-worker-evidence-2026-05-29.md`. | `goal-event-log.v1:evt_8be3fd362f139622`, `reviewer.approved`, verdict `APPROVED`, evidence ref `docs/plans/v19-task6-review-evidence-2026-05-29.md`. | `goal-event-log.v1:evt_579bba01c789b474`, `main.verification-passed`, evidence ref `docs/plans/v19-task6-main-verification-evidence-2026-05-29.md`. | No v19 release gate event is registered for this task. |
| task-7 | `goal-event-log.v1:evt_f7f1d97c224c6cdb`, `worker.evidence-recorded`, evidence ref `docs/plans/v19-task7-worker-evidence-2026-05-29.md`; this branch adds README, product contracts, operator guide, this task evidence index, and `docs/plans/v19-release-evidence-2026-05-29.md`. | Review evidence file `docs/plans/v19-task7-review-evidence-2026-05-29.md` records verdict `APPROVED`, but no reviewer verdict event is registered yet for task-7. | No `main.verification-passed` event is registered yet for task-7. | No v19 release gate event is registered for this task. |
| task-8 | Planned release verification, final closure, and tag evidence task. No worker evidence event is registered yet. | No reviewer verdict event is registered yet. | No main verification event is registered yet. | No release gate, release-ready, or tag evidence event is registered yet. |

## release status

- Local goal-status reports `summary.releaseReady: false`.
- No `release.gate-passed`, `release.gate-failed`, or `release.ready-declared` events are present in the current v19 event log.
- Passing local commands during Task 7 must stay command evidence until a release manager explicitly registers the relevant release gates.
- Tag evidence is not present. This index did not create a tag.
