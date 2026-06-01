# v21 task-1 worker evidence

Date: 2026-05-31

Goal id: `v21-goal-event-registration-workbench`
Task id: `task-1`
Branch: `v21-task-1-goal-event-form-model`

## User-visible value

用户能从当前 next action 看到可登记的事件表单。Next Action Card 现在展示 `GoalEventRegistrationFormModel`，推荐表单来自 `goal-next-action.v1.afterCompletion.allowedEvents`，支持表单目录覆盖 worker、blocker、reviewer verdict 和 main-verification gate 事件。

## Implementation summary

- 在 Workbench 前端投影层增加 `GoalEventRegistrationFormModel`。
- 推荐表单只从 `goal-next-action.v1` 的 `goalId`、`next.taskId`、`next.role`、`next.phase`、`afterCompletion.registerWith` 和 `afterCompletion.allowedEvents` 生成。
- 表单目录覆盖：
  - `worker.started`
  - `worker.evidence-recorded`
  - `worker.self-check-passed`
  - `worker.self-check-failed`
  - `blocker.opened`
  - `blocker.resolved`
  - `reviewer.approved`
  - `reviewer.needs-revision`
  - `main.verification-passed`
  - `main.verification-failed`
- Next Action Card 展示推荐表单、支持表单目录、字段 required/readOnly/source、actor/reviewer/verifier 字段、evidence ref 字段、review verdict 字段、main-verification gate/status 字段和 task blocker 字段。
- 表单模型不提供执行按钮、不提供 confirm 入口、不写状态。最初我把 dry-run 命令模板放进模型后，Workbench shell 边界测试拦住了它；随后改为字段级 view model，只保留 `goal-update-plan.v1` 作为计划预览 contract 名称。
- 增加 Workbench 投影测试，覆盖 worker、blocker、reviewer verdict 和 main-verification gate 表单，并确认不会从 Workbench heuristic 推断 approval/readiness。

## Files changed

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DQwHi8dj.css`
- `src/symphony/workbench-static/assets/index-THFje-ok.js`
- removed generated assets replaced by the build:
  - `src/symphony/workbench-static/assets/index-DGOQN4eH.css`
  - `src/symphony/workbench-static/assets/index-7IvGgo-R.js`

Pre-existing workspace note: `fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json` was already present as an untracked file when this worker started. I did not edit it.

## Commands run with exact results

### `pnpm check`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit code `0`.

```text
tests 671
suites 109
pass 671
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3545.009292
```

During implementation, an earlier full `pnpm test` run failed in `tests/workbench-shell.test.js` because the first form model draft contained dry-run command templates. I removed those command templates and reran the targeted Workbench tests and the full suite; the final full run above passed.

### `pnpm workbench:build`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

(node:45596) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:45596) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
vite v8.0.14 building client environment for production...
(node:45596) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
transforming...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DQwHi8dj.css    9.11 kB │ gzip:   2.27 kB
src/symphony/workbench-static/assets/index-THFje-ok.js   662.91 kB │ gzip: 123.50 kB

✓ built in 139ms
```

### `git diff --check`

Result: exit code `0`; command produced no output.

### `pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Result: exit code `0`; returned `goal-progress-ledger.v1`.

```text
goalId: v21-goal-event-registration-workbench
goalTitle: v21 Workbench Goal Event Registration
summary.totalTasks: 5
summary.completedTasks: 0
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-1.status: planned
task-1.statusSource: goal-runbook.v1
task-1.workerEvidenceRef: null
task-1.reviewEvidenceRef: null
task-1.reviewVerdict: null
task-1.mainVerificationRef: null
releaseGates.*: unknown
```

Additional targeted check:

```text
node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
tests 25
suites 3
pass 25
fail 0
duration_ms 107.871792
```

## Boundary notes

- Workbench 主路径仍围绕 `goal-status`、`goal next`、`goal prompt`、`goal closeout` 和 `goal update/review/gate` 的 contract/view model。
- 没有把 v8 `scan/do/review/verify/status/continue/artifacts` 做成 Workbench 顶层 action list。
- 没有新增 generic safety layer、generic shell runner、permission system、goal framework 或 artifact framework。
- 没有从文件名、branch、commit message、命令文本或前端 heuristic 推断 approval/readiness。
- 表单模型保留 `workerCannotApproveOwnTask` 和 reviewer actor policy；worker 不能 approve 自己的工作。
- 本 worker 没有登记 reviewer/main/release 事件，没有 self-approve，没有宣称 main verified 或 release ready。

## Reviewer handoff checklist

- 检查 `GoalEventRegistrationFormModel` 的推荐表单是否只来自 `goal-next-action.v1.afterCompletion.allowedEvents`。
- 检查支持表单目录是否覆盖 task-1 要求的 worker、blocker、reviewer verdict 和 main-verification gate 事件。
- 检查 Workbench 源码是否仍没有执行按钮、confirm 入口、shell runner、browser write route 或模型调用入口。
- 检查 `tests/workbench-api-client.test.js` 新增断言是否能防止 reviewer/main-verification 表单被 worker 自批或前端 heuristic 驱动。
- 复跑验收命令，确认生成的 Workbench static assets 与源码一致。
