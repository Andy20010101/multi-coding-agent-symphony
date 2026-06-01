# v29 Execution Prompts: Active Task Controlled Implementation Workspace

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Baseline: `v28 Workbench v1 merged goal/runbook chain`

Use these prompts with `/goal`. The canonical full command flow is in the matching `workbench-v29-v32-goal-runbooks/*_goal_runbook_latest.md` file.

## Task 0 bootstrap prompt

```text
/goal
执行 v29 Task 0：为 `v29-active-task-controlled-implementation-workspace` 注册 plan/runbook，并确认本版本开始前的 baseline 是 `v28 Workbench v1 merged goal/runbook chain`。

目标：
- Plan doc：docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
- Execution prompt doc：docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
- Goal id：v29-active-task-controlled-implementation-workspace
- 版本目标：Active Task Controlled Implementation Workspace
- Workbench 主线必须延续 v20-v28 goal/runbook/next-action 方式，不回到 v8 command surface。

验收：
- pnpm check
- pnpm test
- git diff --check
```

## task-1: Active task implementation eligibility

### Worker prompt

```text
/goal
执行 v29 task-1 worker implementation：Active task implementation eligibility。

目标：
- 当前 goal id：v29-active-task-controlled-implementation-workspace
- 当前任务：task-1
- 当前分支必须是：v29-task-1-active-task-implementation-eligibility
- 用户可见价值：用户知道当前 task 是否可以进入受控实现，而不是盲点 implementation。

先读：
- docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
- docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
建立 ActiveTaskImplementationEligibility 模型：读取 goal-status、goal next、runbook、events 和 route context，只从 explicit events 判断 task 是否可实现。

禁止：
- 不新增 generic shell runner、browser terminal、模型调用、权限系统、goal framework 或 artifact framework。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 当 Workbench 顶层模型。
- 不从 branch/file name/commit/prompt/frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

完成后写 worker evidence：
- docs/plans/v29-task-1-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v29 task-1 independent reviewer review：Active task implementation eligibility。

目标：
- 审查当前分支 `v29-task-1-active-task-implementation-eligibility` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v29-task-1-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v29 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 dry-run/confirm、explicit events、independent review、main verification 边界。
- 是否没有新增 generic shell runner、browser terminal、模型调用、auto merge/tag/push。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v29-task-1-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v29 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v29-task-1-active-task-implementation-eligibility
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

写 evidence：
- docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-2: Controlled implementation plan preview

### Worker prompt

```text
/goal
执行 v29 task-2 worker implementation：Controlled implementation plan preview。

目标：
- 当前 goal id：v29-active-task-controlled-implementation-workspace
- 当前任务：task-2
- 当前分支必须是：v29-task-2-controlled-implementation-plan-preview
- 用户可见价值：用户能在 Workbench 里看到 frozen implementation plan 预览，而不是把自然语言任务直接交给浏览器执行。

先读：
- docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
- docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
增加受控 plan preview API/UI，映射到 `symphony do --write --json` 的计划生成语义；只允许 active task 约束、worker prompt、goal/task/evidence refs 和 existing allowlist 字段。

禁止：
- 不新增 generic shell runner、browser terminal、模型调用、权限系统、goal framework 或 artifact framework。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 当 Workbench 顶层模型。
- 不从 branch/file name/commit/prompt/frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

完成后写 worker evidence：
- docs/plans/v29-task-2-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v29 task-2 independent reviewer review：Controlled implementation plan preview。

目标：
- 审查当前分支 `v29-task-2-controlled-implementation-plan-preview` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v29-task-2-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v29 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 dry-run/confirm、explicit events、independent review、main verification 边界。
- 是否没有新增 generic shell runner、browser terminal、模型调用、auto merge/tag/push。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v29-task-2-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v29 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v29-task-2-controlled-implementation-plan-preview
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

写 evidence：
- docs/plans/v29-task-2-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-3: Confirm isolated workspace execution

### Worker prompt

```text
/goal
执行 v29 task-3 worker implementation：Confirm isolated workspace execution。

目标：
- 当前 goal id：v29-active-task-controlled-implementation-workspace
- 当前任务：task-3
- 当前分支必须是：v29-task-3-confirm-isolated-workspace-execution
- 用户可见价值：用户确认 plan hash 后能启动 isolated workspace run，main worktree 不被写入。

先读：
- docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
- docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
接入 existing `symphony do --confirm-plan <plan-id> --json` 语义；Workbench confirm 只接受 preview 返回的 plan id/hash 和相同 task context。

禁止：
- 不新增 generic shell runner、browser terminal、模型调用、权限系统、goal framework 或 artifact framework。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 当 Workbench 顶层模型。
- 不从 branch/file name/commit/prompt/frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

完成后写 worker evidence：
- docs/plans/v29-task-3-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v29 task-3 independent reviewer review：Confirm isolated workspace execution。

目标：
- 审查当前分支 `v29-task-3-confirm-isolated-workspace-execution` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v29-task-3-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v29 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 dry-run/confirm、explicit events、independent review、main verification 边界。
- 是否没有新增 generic shell runner、browser terminal、模型调用、auto merge/tag/push。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v29-task-3-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v29 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v29-task-3-confirm-isolated-workspace-execution
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

写 evidence：
- docs/plans/v29-task-3-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-4: Operation console and run-result bridge

### Worker prompt

```text
/goal
执行 v29 task-4 worker implementation：Operation console and run-result bridge。

目标：
- 当前 goal id：v29-active-task-controlled-implementation-workspace
- 当前任务：task-4
- 当前分支必须是：v29-task-4-operation-console-and-run-result-bridge
- 用户可见价值：用户能看到 implementation run 的状态、输出摘要、artifact refs 和失败原因。

先读：
- docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
- docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
把 implementation run 写入/读取 goal operation registry，把 run result、artifact refs、verifier summary 接到 Active Goal / Operations / Implementation 路径。

禁止：
- 不新增 generic shell runner、browser terminal、模型调用、权限系统、goal framework 或 artifact framework。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 当 Workbench 顶层模型。
- 不从 branch/file name/commit/prompt/frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

完成后写 worker evidence：
- docs/plans/v29-task-4-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v29 task-4 independent reviewer review：Operation console and run-result bridge。

目标：
- 审查当前分支 `v29-task-4-operation-console-and-run-result-bridge` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v29-task-4-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v29 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 dry-run/confirm、explicit events、independent review、main verification 边界。
- 是否没有新增 generic shell runner、browser terminal、模型调用、auto merge/tag/push。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v29-task-4-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v29 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v29-task-4-operation-console-and-run-result-bridge
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

写 evidence：
- docs/plans/v29-task-4-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-5: Worker evidence handoff after implementation run

### Worker prompt

```text
/goal
执行 v29 task-5 worker implementation：Worker evidence handoff after implementation run。

目标：
- 当前 goal id：v29-active-task-controlled-implementation-workspace
- 当前任务：task-5
- 当前分支必须是：v29-task-5-worker-evidence-handoff-after-implementation-run
- 用户可见价值：实现结果能自然回到 worker evidence，不靠用户手工拼 evidence ref。

先读：
- docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
- docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v29_active-task-controlled-implementation-workspace_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
基于 confirmed implementation run 生成 worker evidence draft/handoff，连接 `goal update worker.evidence-recorded` dry-run + plan-hash confirm；补测试、docs、release evidence。

禁止：
- 不新增 generic shell runner、browser terminal、模型调用、权限系统、goal framework 或 artifact framework。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 当 Workbench 顶层模型。
- 不从 branch/file name/commit/prompt/frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

完成后写 worker evidence：
- docs/plans/v29-task-5-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v29 task-5 independent reviewer review：Worker evidence handoff after implementation run。

目标：
- 审查当前分支 `v29-task-5-worker-evidence-handoff-after-implementation-run` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v29-task-5-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v29 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 dry-run/confirm、explicit events、independent review、main verification 边界。
- 是否没有新增 generic shell runner、browser terminal、模型调用、auto merge/tag/push。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v29-task-5-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v29 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v29-task-5-worker-evidence-handoff-after-implementation-run
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

写 evidence：
- docs/plans/v29-task-5-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```
