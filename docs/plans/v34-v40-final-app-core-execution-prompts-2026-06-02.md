# v34–v40 Final App Core Execution Prompts

Date: 2026-06-02  
Status: draft / ready for `/goal` usage  
Baseline: v33 App Runtime Foundation

Use these prompts with `/goal`. The canonical command flow is in:

- `docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md`
- the matching `*_goal_runbook_latest.md` file for each version.

Do not execute v34-v40 as one branch. Execute one version at a time, one task branch at a time.

## v34: Action Registry Workspace

### Task 0 bootstrap prompt

```text
/goal
执行 v34 Task 0：为 `v34-action-registry-workspace` 注册 plan/runbook，并确认本版本 baseline 是 `v33 App Runtime Foundation`。

目标：
- Plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- Execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v34-action-registry-workspace
- 版本目标：Action Registry Workspace
- Workbench/App 主线必须延续 v20-v32 goal/runbook/next-action 方式，不回到 v8 command surface。

验收：
- pnpm check
- pnpm test
- git diff --check
```

### task-1: Action manifest contract

#### Worker prompt

```text
/goal
执行 v34 task-1 worker implementation：Action manifest contract。

目标：
- 当前 goal id：v34-action-registry-workspace
- 当前任务：task-1
- 当前分支必须是：v34-task-1-action-manifest-contract
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：UI/Workbench 后续按钮有内核声明式 action，不再硬编码命令。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v34_action-registry-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
定义 action_id、label、scope、availability、capability preview、event mapping、evidence expectations。

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
- pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v34-task-1-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v34 task-1 independent reviewer review：Action manifest contract。

目标：
- 审查当前分支 `v34-task-1-action-manifest-contract` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v34-task-1-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v34 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v34-task-1-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v34 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v34-task-1-action-manifest-contract
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json

写 evidence：
- docs/plans/v34-task-1-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-2: Action availability resolver

#### Worker prompt

```text
/goal
执行 v34 task-2 worker implementation：Action availability resolver。

目标：
- 当前 goal id：v34-action-registry-workspace
- 当前任务：task-2
- 当前分支必须是：v34-task-2-action-availability-resolver
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：用户能知道某个 action 为什么能做或不能做。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v34_action-registry-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
基于 active goal/task/runbook/next action 计算 available/unavailable reasons。

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
- pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v34-task-2-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v34 task-2 independent reviewer review：Action availability resolver。

目标：
- 审查当前分支 `v34-task-2-action-availability-resolver` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v34-task-2-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v34 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v34-task-2-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v34 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v34-task-2-action-availability-resolver
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json

写 evidence：
- docs/plans/v34-task-2-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-3: Action preview API

#### Worker prompt

```text
/goal
执行 v34 task-3 worker implementation：Action preview API。

目标：
- 当前 goal id：v34-action-registry-workspace
- 当前任务：task-3
- 当前分支必须是：v34-task-3-action-preview-api
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：App/Workbench 能预览动作影响，不触发写入。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v34_action-registry-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
新增只读 action preview API，返回 actions、capabilities、required confirmations，不执行。

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
- pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v34-task-3-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v34 task-3 independent reviewer review：Action preview API。

目标：
- 审查当前分支 `v34-task-3-action-preview-api` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v34-task-3-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v34 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v34-task-3-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v34 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v34-task-3-action-preview-api
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json

写 evidence：
- docs/plans/v34-task-3-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-4: Workbench action panel binding

#### Worker prompt

```text
/goal
执行 v34 task-4 worker implementation：Workbench action panel binding。

目标：
- 当前 goal id：v34-action-registry-workspace
- 当前任务：task-4
- 当前分支必须是：v34-task-4-workbench-action-panel-binding
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：页面按钮来自内核，而不是前端自造流程。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v34_action-registry-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
Workbench action 面板从 registry 读取 action，不直接拼 shell 命令。

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
- pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v34-task-4-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v34 task-4 independent reviewer review：Workbench action panel binding。

目标：
- 审查当前分支 `v34-task-4-workbench-action-panel-binding` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v34-task-4-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v34 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v34-task-4-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v34 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v34-task-4-workbench-action-panel-binding
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json

写 evidence：
- docs/plans/v34-task-4-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-5: Action registry evidence + migration guide

#### Worker prompt

```text
/goal
执行 v34 task-5 worker implementation：Action registry evidence + migration guide。

目标：
- 当前 goal id：v34-action-registry-workspace
- 当前任务：task-5
- 当前分支必须是：v34-task-5-action-registry-evidence-migration-guide
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：v35 job queue 可以稳定接上 action。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v34_action-registry-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
补齐 docs/tests/evidence，说明未来 Web/Desktop/Notch 如何消费同一套 action layer。

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
- pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v34-task-5-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v34 task-5 independent reviewer review：Action registry evidence + migration guide。

目标：
- 审查当前分支 `v34-task-5-action-registry-evidence-migration-guide` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v34-task-5-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v34 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v34-task-5-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v34 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v34-task-5-action-registry-evidence-migration-guide
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json

写 evidence：
- docs/plans/v34-task-5-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


## v35: Job Queue + Run Control Workspace

### Task 0 bootstrap prompt

```text
/goal
执行 v35 Task 0：为 `v35-job-queue-run-control-workspace` 注册 plan/runbook，并确认本版本 baseline 是 `v34 Action Registry Workspace`。

目标：
- Plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- Execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v35-job-queue-run-control-workspace
- 版本目标：Job Queue + Run Control Workspace
- Workbench/App 主线必须延续 v20-v32 goal/runbook/next-action 方式，不回到 v8 command surface。

验收：
- pnpm check
- pnpm test
- git diff --check
```

### task-1: Job model contract

#### Worker prompt

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

#### Reviewer prompt

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

#### Main verifier prompt

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

### task-2: Create job from controlled action

#### Worker prompt

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

#### Reviewer prompt

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

#### Main verifier prompt

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

### task-3: Job event timeline + log stream contract

#### Worker prompt

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

#### Reviewer prompt

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

#### Main verifier prompt

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

### task-4: Pause/cancel/resume/recover semantics

#### Worker prompt

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

#### Reviewer prompt

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

#### Main verifier prompt

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

### task-5: Workbench job console binding

#### Worker prompt

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

#### Reviewer prompt

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

#### Main verifier prompt

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


## v36: Artifact/Evidence Index Workspace

### Task 0 bootstrap prompt

```text
/goal
执行 v36 Task 0：为 `v36-artifact-evidence-index-workspace` 注册 plan/runbook，并确认本版本 baseline 是 `v35 Job Queue + Run Control Workspace`。

目标：
- Plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- Execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v36-artifact-evidence-index-workspace
- 版本目标：Artifact/Evidence Index Workspace
- Workbench/App 主线必须延续 v20-v32 goal/runbook/next-action 方式，不回到 v8 command surface。

验收：
- pnpm check
- pnpm test
- git diff --check
```

### task-1: Artifact index contract

#### Worker prompt

```text
/goal
执行 v36 task-1 worker implementation：Artifact index contract。

目标：
- 当前 goal id：v36-artifact-evidence-index-workspace
- 当前任务：task-1
- 当前分支必须是：v36-task-1-artifact-index-contract
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：Evidence 能被 app 查询但不替代 ArtifactStore。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v36_artifact-evidence-index-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
定义 artifact_id/kind/hash/path/ref/goal/task/run/job/status/tags/preview_summary schema。

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
- pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v36-task-1-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v36 task-1 independent reviewer review：Artifact index contract。

目标：
- 审查当前分支 `v36-task-1-artifact-index-contract` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v36-task-1-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v36 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v36-task-1-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v36 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v36-task-1-artifact-index-contract
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json

写 evidence：
- docs/plans/v36-task-1-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-2: Indexer from ArtifactStore/event refs

#### Worker prompt

```text
/goal
执行 v36 task-2 worker implementation：Indexer from ArtifactStore/event refs。

目标：
- 当前 goal id：v36-artifact-evidence-index-workspace
- 当前任务：task-2
- 当前分支必须是：v36-task-2-indexer-from-artifactstore-event-refs
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：不会出现第二事实来源。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v36_artifact-evidence-index-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
从现有 ArtifactStore refs 和 explicit events 派生索引；index 是 cache。

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
- pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v36-task-2-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v36 task-2 independent reviewer review：Indexer from ArtifactStore/event refs。

目标：
- 审查当前分支 `v36-task-2-indexer-from-artifactstore-event-refs` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v36-task-2-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v36 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v36-task-2-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v36 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v36-task-2-indexer-from-artifactstore-event-refs
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json

写 evidence：
- docs/plans/v36-task-2-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-3: Safe preview/search/filter API

#### Worker prompt

```text
/goal
执行 v36 task-3 worker implementation：Safe preview/search/filter API。

目标：
- 当前 goal id：v36-artifact-evidence-index-workspace
- 当前任务：task-3
- 当前分支必须是：v36-task-3-safe-preview-search-filter-api
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：App 可以浏览证据但不能乱读文件。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v36_artifact-evidence-index-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
提供搜索、筛选、安全预览 API；禁止 arbitrary local path。

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
- pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v36-task-3-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v36 task-3 independent reviewer review：Safe preview/search/filter API。

目标：
- 审查当前分支 `v36-task-3-safe-preview-search-filter-api` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v36-task-3-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v36 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v36-task-3-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v36 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v36-task-3-safe-preview-search-filter-api
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json

写 evidence：
- docs/plans/v36-task-3-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-4: Evidence timeline + release bundle view

#### Worker prompt

```text
/goal
执行 v36 task-4 worker implementation：Evidence timeline + release bundle view。

目标：
- 当前 goal id：v36-artifact-evidence-index-workspace
- 当前任务：task-4
- 当前分支必须是：v36-task-4-evidence-timeline-release-bundle-view
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：用户能复盘每个版本为什么可 release。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v36_artifact-evidence-index-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
按 goal/task/job/review/main verification/release 组织 timeline 和 bundle 视图。

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
- pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v36-task-4-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v36 task-4 independent reviewer review：Evidence timeline + release bundle view。

目标：
- 审查当前分支 `v36-task-4-evidence-timeline-release-bundle-view` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v36-task-4-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v36 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v36-task-4-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v36 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v36-task-4-evidence-timeline-release-bundle-view
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json

写 evidence：
- docs/plans/v36-task-4-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-5: Export diagnostics/evidence bundle draft

#### Worker prompt

```text
/goal
执行 v36 task-5 worker implementation：Export diagnostics/evidence bundle draft。

目标：
- 当前 goal id：v36-artifact-evidence-index-workspace
- 当前任务：task-5
- 当前分支必须是：v36-task-5-export-diagnostics-evidence-bundle-draft
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：v39 backup/diagnostics 有基础。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v36_artifact-evidence-index-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
实现 copy-only 或写入门控的 evidence/diagnostics bundle draft。

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
- pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v36-task-5-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v36 task-5 independent reviewer review：Export diagnostics/evidence bundle draft。

目标：
- 审查当前分支 `v36-task-5-export-diagnostics-evidence-bundle-draft` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v36-task-5-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v36 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v36-task-5-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v36 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v36-task-5-export-diagnostics-evidence-bundle-draft
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json

写 evidence：
- docs/plans/v36-task-5-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


## v37: Desktop Shell MVP

### Task 0 bootstrap prompt

```text
/goal
执行 v37 Task 0：为 `v37-desktop-shell-mvp` 注册 plan/runbook，并确认本版本 baseline 是 `v36 Artifact/Evidence Index Workspace`。

目标：
- Plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- Execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v37-desktop-shell-mvp
- 版本目标：Desktop Shell MVP
- Workbench/App 主线必须延续 v20-v32 goal/runbook/next-action 方式，不回到 v8 command surface。

验收：
- pnpm check
- pnpm test
- git diff --check
```

### task-1: Desktop shell decision + minimal workspace

#### Worker prompt

```text
/goal
执行 v37 task-1 worker implementation：Desktop shell decision + minimal workspace。

目标：
- 当前 goal id：v37-desktop-shell-mvp
- 当前任务：task-1
- 当前分支必须是：v37-task-1-desktop-shell-decision-workspace
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：从网页走向 app，但不是网页套壳。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
记录 Tauri/Electron 选择，创建最小 desktop workspace，不重写 workflow kernel。

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
- pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v37-task-1-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v37 task-1 independent reviewer review：Desktop shell decision + minimal workspace。

目标：
- 审查当前分支 `v37-task-1-desktop-shell-decision-workspace` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v37-task-1-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v37 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v37-task-1-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v37 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v37-task-1-desktop-shell-decision-workspace
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json

写 evidence：
- docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-2: Sidecar launcher + health bridge

#### Worker prompt

```text
/goal
执行 v37 task-2 worker implementation：Sidecar launcher + health bridge。

目标：
- 当前 goal id：v37-desktop-shell-mvp
- 当前任务：task-2
- 当前分支必须是：v37-task-2-sidecar-launcher-health-bridge
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：App 可以管理本地 runtime 生命周期。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
Desktop shell 启动/连接 local sidecar，读取 health/app state。

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
- pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v37-task-2-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v37 task-2 independent reviewer review：Sidecar launcher + health bridge。

目标：
- 审查当前分支 `v37-task-2-sidecar-launcher-health-bridge` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v37-task-2-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v37 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v37-task-2-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v37 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v37-task-2-sidecar-launcher-health-bridge
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json

写 evidence：
- docs/plans/v37-task-2-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-3: Project list + active goal + next action view

#### Worker prompt

```text
/goal
执行 v37 task-3 worker implementation：Project list + active goal + next action view。

目标：
- 当前 goal id：v37-desktop-shell-mvp
- 当前任务：task-3
- 当前分支必须是：v37-task-3-project-active-goal-next-action-view
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：桌面窗口能看清当前开发状态。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
显示项目列表、当前 goal、next action、blocked/review/main verification/release 状态。

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
- pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v37-task-3-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v37 task-3 independent reviewer review：Project list + active goal + next action view。

目标：
- 审查当前分支 `v37-task-3-project-active-goal-next-action-view` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v37-task-3-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v37 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v37-task-3-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v37 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v37-task-3-project-active-goal-next-action-view
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json

写 evidence：
- docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-4: Job status + artifact preview binding

#### Worker prompt

```text
/goal
执行 v37 task-4 worker implementation：Job status + artifact preview binding。

目标：
- 当前 goal id：v37-desktop-shell-mvp
- 当前任务：task-4
- 当前分支必须是：v37-task-4-job-status-artifact-preview-binding
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：Desktop 不绕过 app kernel。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
Desktop 使用现有 job/artifact API 展示状态和安全预览。

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
- pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v37-task-4-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v37 task-4 independent reviewer review：Job status + artifact preview binding。

目标：
- 审查当前分支 `v37-task-4-job-status-artifact-preview-binding` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v37-task-4-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v37 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v37-task-4-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v37 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v37-task-4-job-status-artifact-preview-binding
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json

写 evidence：
- docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-5: Desktop build smoke + packaging boundary evidence

#### Worker prompt

```text
/goal
执行 v37 task-5 worker implementation：Desktop build smoke + packaging boundary evidence。

目标：
- 当前 goal id：v37-desktop-shell-mvp
- 当前任务：task-5
- 当前分支必须是：v37-task-5-desktop-build-smoke-packaging-boundary
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：桌面 MVP 可验证但不急于分发。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
加入 build smoke 和 packaging 边界文档；不做自动更新/发布。

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
- pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v37-task-5-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v37 task-5 independent reviewer review：Desktop build smoke + packaging boundary evidence。

目标：
- 审查当前分支 `v37-task-5-desktop-build-smoke-packaging-boundary` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v37-task-5-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v37 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v37-task-5-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v37 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v37-task-5-desktop-build-smoke-packaging-boundary
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json

写 evidence：
- docs/plans/v37-task-5-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


## v38: Provider Hub + Capability Profiles

### Task 0 bootstrap prompt

```text
/goal
执行 v38 Task 0：为 `v38-provider-hub-capability-profiles` 注册 plan/runbook，并确认本版本 baseline 是 `v37 Desktop Shell MVP`。

目标：
- Plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- Execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v38-provider-hub-capability-profiles
- 版本目标：Provider Hub + Capability Profiles
- Workbench/App 主线必须延续 v20-v32 goal/runbook/next-action 方式，不回到 v8 command surface。

验收：
- pnpm check
- pnpm test
- git diff --check
```

### task-1: Provider profile contract

#### Worker prompt

```text
/goal
执行 v38 task-1 worker implementation：Provider profile contract。

目标：
- 当前 goal id：v38-provider-hub-capability-profiles
- 当前任务：task-1
- 当前分支必须是：v38-task-1-provider-profile-contract
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：模型/工具通道从散落命令变成受控配置。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
定义 Codex/Claude/Kiro/DeepSeek profiles：availability、lane、gate、health、secret boundary。

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
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v38-task-1-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v38 task-1 independent reviewer review：Provider profile contract。

目标：
- 审查当前分支 `v38-task-1-provider-profile-contract` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v38-task-1-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v38 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v38-task-1-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v38 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v38-task-1-provider-profile-contract
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

写 evidence：
- docs/plans/v38-task-1-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-2: Provider health check API

#### Worker prompt

```text
/goal
执行 v38 task-2 worker implementation：Provider health check API。

目标：
- 当前 goal id：v38-provider-hub-capability-profiles
- 当前任务：task-2
- 当前分支必须是：v38-task-2-provider-health-check-api
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：用户知道为什么某个 lane 不可用。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
只读检查 provider 可用性、CLI/env/key 缺失原因；不从 renderer 调模型。

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
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v38-task-2-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v38 task-2 independent reviewer review：Provider health check API。

目标：
- 审查当前分支 `v38-task-2-provider-health-check-api` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v38-task-2-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v38 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v38-task-2-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v38 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v38-task-2-provider-health-check-api
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

写 evidence：
- docs/plans/v38-task-2-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-3: Capability profile mapping

#### Worker prompt

```text
/goal
执行 v38 task-3 worker implementation：Capability profile mapping。

目标：
- 当前 goal id：v38-provider-hub-capability-profiles
- 当前任务：task-3
- 当前分支必须是：v38-task-3-capability-profile-mapping
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：真实执行前有明确能力预览。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
将 action requirements 映射到 provider/tool gates：repo.write、model.invoke、test.run、git.change 等。

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
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v38-task-3-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v38 task-3 independent reviewer review：Capability profile mapping。

目标：
- 审查当前分支 `v38-task-3-capability-profile-mapping` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v38-task-3-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v38 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v38-task-3-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v38 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v38-task-3-capability-profile-mapping
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

写 evidence：
- docs/plans/v38-task-3-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-4: Worker/reviewer lane assignment preview

#### Worker prompt

```text
/goal
执行 v38 task-4 worker implementation：Worker/reviewer lane assignment preview。

目标：
- 当前 goal id：v38-provider-hub-capability-profiles
- 当前任务：task-4
- 当前分支必须是：v38-task-4-worker-reviewer-lane-assignment-preview
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：实现者与 reviewer 分离在 App 里可见。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
为 worker/reviewer/main verifier 推荐独立 lane，但不自动批准。

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
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v38-task-4-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v38 task-4 independent reviewer review：Worker/reviewer lane assignment preview。

目标：
- 审查当前分支 `v38-task-4-worker-reviewer-lane-assignment-preview` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v38-task-4-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v38 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v38-task-4-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v38 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v38-task-4-worker-reviewer-lane-assignment-preview
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

写 evidence：
- docs/plans/v38-task-4-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-5: Provider hub panel + evidence

#### Worker prompt

```text
/goal
执行 v38 task-5 worker implementation：Provider hub panel + evidence。

目标：
- 当前 goal id：v38-provider-hub-capability-profiles
- 当前任务：task-5
- 当前分支必须是：v38-task-5-provider-hub-panel-evidence
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：App 成为多 coding agent 控制台雏形。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
Workbench/Desktop 显示 provider availability 和 blocked reasons，不泄露 secrets。

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
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v38-task-5-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v38 task-5 independent reviewer review：Provider hub panel + evidence。

目标：
- 审查当前分支 `v38-task-5-provider-hub-panel-evidence` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v38-task-5-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v38 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v38-task-5-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v38 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v38-task-5-provider-hub-panel-evidence
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

写 evidence：
- docs/plans/v38-task-5-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


## v39: Backup / Diagnostics / Migration Workspace

### Task 0 bootstrap prompt

```text
/goal
执行 v39 Task 0：为 `v39-backup-diagnostics-migration-workspace` 注册 plan/runbook，并确认本版本 baseline 是 `v38 Provider Hub + Capability Profiles`。

目标：
- Plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- Execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v39-backup-diagnostics-migration-workspace
- 版本目标：Backup / Diagnostics / Migration Workspace
- Workbench/App 主线必须延续 v20-v32 goal/runbook/next-action 方式，不回到 v8 command surface。

验收：
- pnpm check
- pnpm test
- git diff --check
```

### task-1: App data inventory

#### Worker prompt

```text
/goal
执行 v39 task-1 worker implementation：App data inventory。

目标：
- 当前 goal id：v39-backup-diagnostics-migration-workspace
- 当前任务：task-1
- 当前分支必须是：v39-task-1-app-data-inventory
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：知道 app 到底保存了什么。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
列出 registry、snapshots、job state、artifact index、settings、provider profiles、evidence refs。

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
- pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v39-task-1-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v39 task-1 independent reviewer review：App data inventory。

目标：
- 审查当前分支 `v39-task-1-app-data-inventory` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v39-task-1-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v39 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v39-task-1-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v39 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v39-task-1-app-data-inventory
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json

写 evidence：
- docs/plans/v39-task-1-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-2: Schema version + migration runner

#### Worker prompt

```text
/goal
执行 v39 task-2 worker implementation：Schema version + migration runner。

目标：
- 当前 goal id：v39-backup-diagnostics-migration-workspace
- 当前任务：task-2
- 当前分支必须是：v39-task-2-schema-version-migration-runner
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：升级不会靠猜。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
实现 schema/app data version 和 dry-run migration preview；confirm 后才写。

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
- pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v39-task-2-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v39 task-2 independent reviewer review：Schema version + migration runner。

目标：
- 审查当前分支 `v39-task-2-schema-version-migration-runner` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v39-task-2-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v39 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v39-task-2-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v39 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v39-task-2-schema-version-migration-runner
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json

写 evidence：
- docs/plans/v39-task-2-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-3: Backup/export bundle

#### Worker prompt

```text
/goal
执行 v39 task-3 worker implementation：Backup/export bundle。

目标：
- 当前 goal id：v39-backup-diagnostics-migration-workspace
- 当前任务：task-3
- 当前分支必须是：v39-task-3-backup-export-bundle
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：长期使用可备份。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
导出 app core state manifest、hash、refs，不复制不该复制的 repo 内容。

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
- pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v39-task-3-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v39 task-3 independent reviewer review：Backup/export bundle。

目标：
- 审查当前分支 `v39-task-3-backup-export-bundle` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v39-task-3-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v39 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v39-task-3-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v39 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v39-task-3-backup-export-bundle
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json

写 evidence：
- docs/plans/v39-task-3-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-4: Diagnostics bundle

#### Worker prompt

```text
/goal
执行 v39 task-4 worker implementation：Diagnostics bundle。

目标：
- 当前 goal id：v39-backup-diagnostics-migration-workspace
- 当前任务：task-4
- 当前分支必须是：v39-task-4-diagnostics-bundle
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：坏了能定位。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
生成 sanitized diagnostics：版本、health、recent failures、gate status、logs refs。

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
- pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v39-task-4-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v39 task-4 independent reviewer review：Diagnostics bundle。

目标：
- 审查当前分支 `v39-task-4-diagnostics-bundle` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v39-task-4-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v39 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v39-task-4-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v39 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v39-task-4-diagnostics-bundle
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json

写 evidence：
- docs/plans/v39-task-4-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-5: Restore validation

#### Worker prompt

```text
/goal
执行 v39 task-5 worker implementation：Restore validation。

目标：
- 当前 goal id：v39-backup-diagnostics-migration-workspace
- 当前任务：task-5
- 当前分支必须是：v39-task-5-restore-validation
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：恢复路径安全可验证。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
校验 bundle 完整性和兼容性，默认不覆盖现有数据。

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
- pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v39-task-5-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v39 task-5 independent reviewer review：Restore validation。

目标：
- 审查当前分支 `v39-task-5-restore-validation` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v39-task-5-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v39 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v39-task-5-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v39 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v39-task-5-restore-validation
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json

写 evidence：
- docs/plans/v39-task-5-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


## v40: Personal Workflow Router + App Core Release Closeout

### Task 0 bootstrap prompt

```text
/goal
执行 v40 Task 0：为 `v40-personal-workflow-router-app-core-release` 注册 plan/runbook，并确认本版本 baseline 是 `v39 Backup / Diagnostics / Migration Workspace`。

目标：
- Plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- Execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v40-personal-workflow-router-app-core-release
- 版本目标：Personal Workflow Router + App Core Release Closeout
- Workbench/App 主线必须延续 v20-v32 goal/runbook/next-action 方式，不回到 v8 command surface。

验收：
- pnpm check
- pnpm test
- git diff --check
```

### task-1: Inbox/capture contract

#### Worker prompt

```text
/goal
执行 v40 task-1 worker implementation：Inbox/capture contract。

目标：
- 当前 goal id：v40-personal-workflow-router-app-core-release
- 当前任务：task-1
- 当前分支必须是：v40-task-1-inbox-capture-contract
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：App 有入口，不只是执行台。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
捕获用户请求、项目线索、想法、故障，不强制进入 Workbench。

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
- pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v40-task-1-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v40 task-1 independent reviewer review：Inbox/capture contract。

目标：
- 审查当前分支 `v40-task-1-inbox-capture-contract` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v40-task-1-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v40 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v40-task-1-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v40 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v40-task-1-inbox-capture-contract
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json

写 evidence：
- docs/plans/v40-task-1-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-2: Workflow router categories

#### Worker prompt

```text
/goal
执行 v40 task-2 worker implementation：Workflow router categories。

目标：
- 当前 goal id：v40-personal-workflow-router-app-core-release
- 当前任务：task-2
- 当前分支必须是：v40-task-2-workflow-router-categories
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：用户知道该走哪条流程。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
分类为 direct answer、skill、automation、workbench goal、research、ignore/skip。

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
- pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v40-task-2-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v40 task-2 independent reviewer review：Workflow router categories。

目标：
- 审查当前分支 `v40-task-2-workflow-router-categories` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v40-task-2-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v40 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v40-task-2-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v40 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v40-task-2-workflow-router-categories
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json

写 evidence：
- docs/plans/v40-task-2-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-3: Goal/runbook draft handoff

#### Worker prompt

```text
/goal
执行 v40 task-3 worker implementation：Goal/runbook draft handoff。

目标：
- 当前 goal id：v40-personal-workflow-router-app-core-release
- 当前任务：task-3
- 当前分支必须是：v40-task-3-goal-runbook-draft-handoff
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：入口和 Workbench 闭环接上。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
将重复摩擦或项目任务转成 goal/runbook draft，保留人工确认。

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
- pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v40-task-3-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v40 task-3 independent reviewer review：Goal/runbook draft handoff。

目标：
- 审查当前分支 `v40-task-3-goal-runbook-draft-handoff` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v40-task-3-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v40 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v40-task-3-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v40 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v40-task-3-goal-runbook-draft-handoff
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json

写 evidence：
- docs/plans/v40-task-3-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-4: App core release manager

#### Worker prompt

```text
/goal
执行 v40 task-4 worker implementation：App core release manager。

目标：
- 当前 goal id：v40-personal-workflow-router-app-core-release
- 当前任务：task-4
- 当前分支必须是：v40-task-4-app-core-release-manager
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：App core 可以 declared release ready。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
收口 v34-v39 release checklist，生成 final app core evidence。

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
- pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v40-task-4-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v40 task-4 independent reviewer review：App core release manager。

目标：
- 审查当前分支 `v40-task-4-app-core-release-manager` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v40-task-4-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v40 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v40-task-4-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v40 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v40-task-4-app-core-release-manager
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json

写 evidence：
- docs/plans/v40-task-4-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

### task-5: Native UX handoff generator

#### Worker prompt

```text
/goal
执行 v40 task-5 worker implementation：Native UX handoff generator。

目标：
- 当前 goal id：v40-personal-workflow-router-app-core-release
- 当前任务：task-5
- 当前分支必须是：v40-task-5-native-ux-handoff-generator
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：内核完成后自然进入 UX/分发阶段。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
生成 v41+ native UX/distribution/notch/menu bar handoff。

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
- pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v40-task-5-worker-evidence-2026-06-02.md
```

#### Reviewer prompt

```text
/goal
执行 v40 task-5 independent reviewer review：Native UX handoff generator。

目标：
- 审查当前分支 `v40-task-5-native-ux-handoff-generator` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v40-task-5-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v40 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v40-task-5-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

#### Main verifier prompt

```text
/goal
执行 v40 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v40-task-5-native-ux-handoff-generator
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json

写 evidence：
- docs/plans/v40-task-5-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

