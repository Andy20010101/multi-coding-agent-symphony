# v35 Plan + /goal Runbook: Job Queue + Run Control Workspace
Date: 2026-06-02  Goal id: `v35-job-queue-run-control-workspace`  Baseline: `v34 Action Registry Workspace`  Release name: `v35 Job Queue + Run Control Workspace`
## Correction note
This runbook continues the current goal/runbook/next-action Workbench workflow. It does **not** use the old v8 command surface as the Workbench/App action baseline.
```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```
## Product purpose
把 v34 的 controlled action 升级成可恢复的 Job Queue，让 App 能显示 queued/running/blocked/failed/passed 状态，并能安全恢复中断流程。
## Product spine
```text
declared action -> create job -> job timeline/log refs -> blocked/failed/recovered state -> job console
```
## Tasks
- task-1: Job model contract — App 有稳定 job 状态语言。
- task-2: Create job from controlled action — 按钮进入 job queue，而不是直接执行。
- task-3: Job event timeline + log stream contract — 用户能看见任务为什么停住或失败。
- task-4: Pause/cancel/resume/recover semantics — App 可以恢复中断流程，不伪造成功。
- task-5: Workbench job console binding — Workbench 从 dashboard 变成执行控制台。

## Non-goals
- Do not create a generic shell runner, browser terminal, arbitrary command palette, or generic model invocation path.
- Do not let UI execute raw shell commands.
- Do not replace the goal framework, ArtifactStore, or event semantics.
- Do not infer status from branch names, filenames, task titles, prompt text, or frontend state.
- Do not let worker self-approve.
- Do not auto-merge, auto-push, auto-tag, or publish.

## Task 0: bootstrap/register this version goal
Recommended docs:

- Plan doc: `docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md`
- Execution prompt doc: `docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md`
- Version runbook: `docs/plans/app-core-v34-v40-goal-runbooks/v35_job-queue-run-control-workspace_goal_runbook_latest.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v35-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v35 Task 0：为 `v35-job-queue-run-control-workspace` 写/核对 plan/runbook 和 execution prompts，并用 latest goal init / goal-status 流程注册该 goal。

目标：
- 写入或确认 plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- 写入或确认 execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v35-job-queue-run-control-workspace
- Baseline：v34 Action Registry Workspace
- 版本目标：Job Queue + Run Control Workspace
- Workbench/App 主线必须使用 latest goal/runbook/next-action 命令面，不要回到 v8 command surface。

必须包含：
- Product purpose
- Product spine
- 每个 task 的 branch、acceptance、worker prompt、reviewer prompt、main verification prompt
- Common event registration commands：goal update、goal review、goal gate

禁止：
- 不实现产品代码。
- 不登记 task 完成事件。
- 不宣称 release ready。

验收：
- pnpm check
- pnpm test
- git diff --check
```

### Register goal/runbook

```bash
pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v35-job-queue-run-control-workspace.v1.json \
  --goal v35-job-queue-run-control-workspace \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v35-job-queue-run-control-workspace.v1.json \
  --goal v35-job-queue-run-control-workspace \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
pnpm --silent symphony goal next --goal v35-job-queue-run-control-workspace --json
```


---

# task-1: Job model contract

Branch: `v35-task-1-job-model-contract`  
Worker evidence: `docs/plans/v35-task-1-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v35-task-1-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v35-task-1-main-verification-evidence-2026-06-02.md`

## User-visible value

App 有稳定 job 状态语言。

## Implementation scope

定义 job_id、project_id、goal_id、task_id、action_id、status、refs、timestamps、failure/blocker 字段。

## Acceptance

- The App/Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- UI does not execute arbitrary shell commands, invoke models, open arbitrary local files, merge, push, tag, publish, or self-approve.
- v8 compatibility commands are not presented as the top-level App/Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
pnpm --silent symphony goal next --goal v35-job-queue-run-control-workspace --json
git checkout -b v35-task-1-job-model-contract
```

## Worker prompt

```text
/goal
执行 v35 task-1 worker implementation：Job model contract。

目标：
- 当前 goal id：v35-job-queue-run-control-workspace
- 当前任务：task-1
- 当前分支必须是：v35-task-1-job-model-contract
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：App 有稳定 job 状态语言。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v35_job-queue-run-control-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
定义 job_id、project_id、goal_id、task_id、action_id、status、refs、timestamps、failure/blocker 字段。

边界：
- App/Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- UI 不得直接执行 shell 命令；只能消费 backend action/job/artifact/provider/router contracts。
- 不新增 generic shell runner、browser terminal、任意模型调用路径、任意本地路径读取、auto merge/tag/push。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v35-task-1-worker-evidence-2026-06-02.md
```

## Worker evidence prompt

```text
/goal
为 v35 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v35-task-1-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v35-job-queue-run-control-workspace
- Task id: task-1
- Branch: v35-task-1-job-model-contract
- User-visible value: App 有稳定 job 状态语言。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
- App/Workbench user path changed
- Boundary notes
- Known limitations / next task handoff

禁止：
- 不写 reviewer verdict。
- 不登记 main verification。
- 不宣称 release ready。
```

## Reviewer prompt

```text
/goal
执行 v35 task-1 independent reviewer review：Job model contract。

目标：
- 审查当前分支 `v35-task-1-job-model-contract` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v35-task-1-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v35 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 App/Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 explicit events、independent review、main verification 边界。
- UI 是否没有直接执行 shell 命令、任意模型调用、任意本地路径读取、auto merge/tag/push。
- App index/cache/provider/action/job/router 是否没有替代 canonical goal/event/ArtifactStore contracts。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v35-task-1-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

## Main verifier prompt

```text
/goal
执行 v35 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v35-task-1-job-model-contract
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json

写 evidence：
- docs/plans/v35-task-1-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


---

# task-2: Create job from controlled action

Branch: `v35-task-2-create-job-from-controlled-action`  
Worker evidence: `docs/plans/v35-task-2-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v35-task-2-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v35-task-2-main-verification-evidence-2026-06-02.md`

## User-visible value

按钮进入 job queue，而不是直接执行。

## Implementation scope

从 action preview 创建 dry-run job；默认不写入、不调用模型、不跑任意命令。

## Acceptance

- The App/Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- UI does not execute arbitrary shell commands, invoke models, open arbitrary local files, merge, push, tag, publish, or self-approve.
- v8 compatibility commands are not presented as the top-level App/Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
pnpm --silent symphony goal next --goal v35-job-queue-run-control-workspace --json
git checkout -b v35-task-2-create-job-from-controlled-action
```

## Worker prompt

```text
/goal
执行 v35 task-2 worker implementation：Create job from controlled action。

目标：
- 当前 goal id：v35-job-queue-run-control-workspace
- 当前任务：task-2
- 当前分支必须是：v35-task-2-create-job-from-controlled-action
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：按钮进入 job queue，而不是直接执行。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v35_job-queue-run-control-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
从 action preview 创建 dry-run job；默认不写入、不调用模型、不跑任意命令。

边界：
- App/Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- UI 不得直接执行 shell 命令；只能消费 backend action/job/artifact/provider/router contracts。
- 不新增 generic shell runner、browser terminal、任意模型调用路径、任意本地路径读取、auto merge/tag/push。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v35-task-2-worker-evidence-2026-06-02.md
```

## Worker evidence prompt

```text
/goal
为 v35 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v35-task-2-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v35-job-queue-run-control-workspace
- Task id: task-2
- Branch: v35-task-2-create-job-from-controlled-action
- User-visible value: 按钮进入 job queue，而不是直接执行。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
- App/Workbench user path changed
- Boundary notes
- Known limitations / next task handoff

禁止：
- 不写 reviewer verdict。
- 不登记 main verification。
- 不宣称 release ready。
```

## Reviewer prompt

```text
/goal
执行 v35 task-2 independent reviewer review：Create job from controlled action。

目标：
- 审查当前分支 `v35-task-2-create-job-from-controlled-action` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v35-task-2-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v35 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 App/Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 explicit events、independent review、main verification 边界。
- UI 是否没有直接执行 shell 命令、任意模型调用、任意本地路径读取、auto merge/tag/push。
- App index/cache/provider/action/job/router 是否没有替代 canonical goal/event/ArtifactStore contracts。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v35-task-2-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

## Main verifier prompt

```text
/goal
执行 v35 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v35-task-2-create-job-from-controlled-action
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json

写 evidence：
- docs/plans/v35-task-2-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


---

# task-3: Job event timeline + log stream contract

Branch: `v35-task-3-job-event-timeline-log-stream`  
Worker evidence: `docs/plans/v35-task-3-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v35-task-3-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v35-task-3-main-verification-evidence-2026-06-02.md`

## User-visible value

用户能看见任务为什么停住或失败。

## Implementation scope

记录 queued/running/blocked/failed/passed/recovered 事件和 app-readable log stream refs。

## Acceptance

- The App/Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- UI does not execute arbitrary shell commands, invoke models, open arbitrary local files, merge, push, tag, publish, or self-approve.
- v8 compatibility commands are not presented as the top-level App/Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
pnpm --silent symphony goal next --goal v35-job-queue-run-control-workspace --json
git checkout -b v35-task-3-job-event-timeline-log-stream
```

## Worker prompt

```text
/goal
执行 v35 task-3 worker implementation：Job event timeline + log stream contract。

目标：
- 当前 goal id：v35-job-queue-run-control-workspace
- 当前任务：task-3
- 当前分支必须是：v35-task-3-job-event-timeline-log-stream
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：用户能看见任务为什么停住或失败。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v35_job-queue-run-control-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
记录 queued/running/blocked/failed/passed/recovered 事件和 app-readable log stream refs。

边界：
- App/Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- UI 不得直接执行 shell 命令；只能消费 backend action/job/artifact/provider/router contracts。
- 不新增 generic shell runner、browser terminal、任意模型调用路径、任意本地路径读取、auto merge/tag/push。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v35-task-3-worker-evidence-2026-06-02.md
```

## Worker evidence prompt

```text
/goal
为 v35 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v35-task-3-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v35-job-queue-run-control-workspace
- Task id: task-3
- Branch: v35-task-3-job-event-timeline-log-stream
- User-visible value: 用户能看见任务为什么停住或失败。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
- App/Workbench user path changed
- Boundary notes
- Known limitations / next task handoff

禁止：
- 不写 reviewer verdict。
- 不登记 main verification。
- 不宣称 release ready。
```

## Reviewer prompt

```text
/goal
执行 v35 task-3 independent reviewer review：Job event timeline + log stream contract。

目标：
- 审查当前分支 `v35-task-3-job-event-timeline-log-stream` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v35-task-3-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v35 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 App/Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 explicit events、independent review、main verification 边界。
- UI 是否没有直接执行 shell 命令、任意模型调用、任意本地路径读取、auto merge/tag/push。
- App index/cache/provider/action/job/router 是否没有替代 canonical goal/event/ArtifactStore contracts。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v35-task-3-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

## Main verifier prompt

```text
/goal
执行 v35 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v35-task-3-job-event-timeline-log-stream
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json

写 evidence：
- docs/plans/v35-task-3-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


---

# task-4: Pause/cancel/resume/recover semantics

Branch: `v35-task-4-pause-cancel-resume-recover`  
Worker evidence: `docs/plans/v35-task-4-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v35-task-4-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v35-task-4-main-verification-evidence-2026-06-02.md`

## User-visible value

App 可以恢复中断流程，不伪造成功。

## Implementation scope

定义受控暂停/取消/恢复/中断恢复语义；不做隐藏 retry。

## Acceptance

- The App/Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- UI does not execute arbitrary shell commands, invoke models, open arbitrary local files, merge, push, tag, publish, or self-approve.
- v8 compatibility commands are not presented as the top-level App/Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
pnpm --silent symphony goal next --goal v35-job-queue-run-control-workspace --json
git checkout -b v35-task-4-pause-cancel-resume-recover
```

## Worker prompt

```text
/goal
执行 v35 task-4 worker implementation：Pause/cancel/resume/recover semantics。

目标：
- 当前 goal id：v35-job-queue-run-control-workspace
- 当前任务：task-4
- 当前分支必须是：v35-task-4-pause-cancel-resume-recover
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：App 可以恢复中断流程，不伪造成功。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v35_job-queue-run-control-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
定义受控暂停/取消/恢复/中断恢复语义；不做隐藏 retry。

边界：
- App/Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- UI 不得直接执行 shell 命令；只能消费 backend action/job/artifact/provider/router contracts。
- 不新增 generic shell runner、browser terminal、任意模型调用路径、任意本地路径读取、auto merge/tag/push。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v35-task-4-worker-evidence-2026-06-02.md
```

## Worker evidence prompt

```text
/goal
为 v35 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v35-task-4-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v35-job-queue-run-control-workspace
- Task id: task-4
- Branch: v35-task-4-pause-cancel-resume-recover
- User-visible value: App 可以恢复中断流程，不伪造成功。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
- App/Workbench user path changed
- Boundary notes
- Known limitations / next task handoff

禁止：
- 不写 reviewer verdict。
- 不登记 main verification。
- 不宣称 release ready。
```

## Reviewer prompt

```text
/goal
执行 v35 task-4 independent reviewer review：Pause/cancel/resume/recover semantics。

目标：
- 审查当前分支 `v35-task-4-pause-cancel-resume-recover` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v35-task-4-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v35 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 App/Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 explicit events、independent review、main verification 边界。
- UI 是否没有直接执行 shell 命令、任意模型调用、任意本地路径读取、auto merge/tag/push。
- App index/cache/provider/action/job/router 是否没有替代 canonical goal/event/ArtifactStore contracts。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v35-task-4-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

## Main verifier prompt

```text
/goal
执行 v35 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v35-task-4-pause-cancel-resume-recover
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json

写 evidence：
- docs/plans/v35-task-4-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


---

# task-5: Workbench job console binding

Branch: `v35-task-5-workbench-job-console-binding`  
Worker evidence: `docs/plans/v35-task-5-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v35-task-5-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v35-task-5-main-verification-evidence-2026-06-02.md`

## User-visible value

Workbench 从 dashboard 变成执行控制台。

## Implementation scope

Workbench 显示 job queue、current job、blocked reason、next action。

## Acceptance

- The App/Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- UI does not execute arbitrary shell commands, invoke models, open arbitrary local files, merge, push, tag, publish, or self-approve.
- v8 compatibility commands are not presented as the top-level App/Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
pnpm --silent symphony goal next --goal v35-job-queue-run-control-workspace --json
git checkout -b v35-task-5-workbench-job-console-binding
```

## Worker prompt

```text
/goal
执行 v35 task-5 worker implementation：Workbench job console binding。

目标：
- 当前 goal id：v35-job-queue-run-control-workspace
- 当前任务：task-5
- 当前分支必须是：v35-task-5-workbench-job-console-binding
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：Workbench 从 dashboard 变成执行控制台。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v35_job-queue-run-control-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
Workbench 显示 job queue、current job、blocked reason、next action。

边界：
- App/Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- UI 不得直接执行 shell 命令；只能消费 backend action/job/artifact/provider/router contracts。
- 不新增 generic shell runner、browser terminal、任意模型调用路径、任意本地路径读取、auto merge/tag/push。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v35-task-5-worker-evidence-2026-06-02.md
```

## Worker evidence prompt

```text
/goal
为 v35 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v35-task-5-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v35-job-queue-run-control-workspace
- Task id: task-5
- Branch: v35-task-5-workbench-job-console-binding
- User-visible value: Workbench 从 dashboard 变成执行控制台。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json
- App/Workbench user path changed
- Boundary notes
- Known limitations / next task handoff

禁止：
- 不写 reviewer verdict。
- 不登记 main verification。
- 不宣称 release ready。
```

## Reviewer prompt

```text
/goal
执行 v35 task-5 independent reviewer review：Workbench job console binding。

目标：
- 审查当前分支 `v35-task-5-workbench-job-console-binding` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v35-task-5-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v35 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 App/Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 explicit events、independent review、main verification 边界。
- UI 是否没有直接执行 shell 命令、任意模型调用、任意本地路径读取、auto merge/tag/push。
- App index/cache/provider/action/job/router 是否没有替代 canonical goal/event/ArtifactStore contracts。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v35-task-5-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

## Main verifier prompt

```text
/goal
执行 v35 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v35-task-5-workbench-job-console-binding
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v35-job-queue-run-control-workspace --json

写 evidence：
- docs/plans/v35-task-5-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


---

# Release closeout

Only after all tasks have approved review evidence and main-verification gates passed.

```bash
pnpm --silent symphony goal closeout --goal v35-job-queue-run-control-workspace --markdown

pnpm --silent symphony goal gate \
  --goal v35-job-queue-run-control-workspace \
  --gate release.ready \
  --status declared \
  --verifier codex-v35-release-manager \
  --evidence-ref docs/plans/v35-release-evidence-2026-06-02.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v35-job-queue-run-control-workspace \
  --gate release.ready \
  --status declared \
  --verifier codex-v35-release-manager \
  --evidence-ref docs/plans/v35-release-evidence-2026-06-02.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Next-version handoff

After v35 release, initialize `v36-artifact-evidence-index-workspace` using the same implementation plan and the v36 runbook.
