# v30 Execution Prompts: Verified Adoption Workspace v2

Date: 2026-06-01  
Goal id: `v30-verified-adoption-workspace-v2`  
Baseline: `v29 active task controlled implementation workspace`

Use these prompts with `/goal`. The canonical full command flow is in the matching `workbench-v29-v32-goal-runbooks/*_goal_runbook_latest.md` file.

## Task 0 bootstrap prompt

```text
/goal
执行 v30 Task 0：为 `v30-verified-adoption-workspace-v2` 注册 plan/runbook，并确认本版本开始前的 baseline 是 `v29 active task controlled implementation workspace`。

目标：
- Plan doc：docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md
- Execution prompt doc：docs/plans/v30-verified-adoption-workspace-v2-execution-prompts-2026-06-01.md
- Goal id：v30-verified-adoption-workspace-v2
- 版本目标：Verified Adoption Workspace v2
- Workbench 主线必须延续 v20-v28 goal/runbook/next-action 方式，不回到 v8 command surface。

验收：
- pnpm check
- pnpm test
- git diff --check
```

## task-1: Adoption candidate normalization

### Worker prompt

```text
/goal
执行 v30 task-1 worker implementation：Adoption candidate normalization。

目标：
- 当前 goal id：v30-verified-adoption-workspace-v2
- 当前任务：task-1
- 当前分支必须是：v30-task-1-adoption-candidate-normalization
- 用户可见价值：用户知道哪些 v29 implementation run 可以采纳，哪些不能采纳。

先读：
- docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md
- docs/plans/v30-verified-adoption-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
建立 adoption candidate projection：只从 passed run、artifact refs、workspace refs、fingerprints 和 verifier status 判断，不从 branch/file names 猜。

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
- pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json

完成后写 worker evidence：
- docs/plans/v30-task-1-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v30 task-1 independent reviewer review：Adoption candidate normalization。

目标：
- 审查当前分支 `v30-task-1-adoption-candidate-normalization` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v30-task-1-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v30 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v30-task-1-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v30 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v30-task-1-adoption-candidate-normalization
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json

写 evidence：
- docs/plans/v30-task-1-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-2: Adoption plan preview workspace

### Worker prompt

```text
/goal
执行 v30 task-2 worker implementation：Adoption plan preview workspace。

目标：
- 当前 goal id：v30-verified-adoption-workspace-v2
- 当前任务：task-2
- 当前分支必须是：v30-task-2-adoption-plan-preview-workspace
- 用户可见价值：用户能在 Workbench 里冻结 adoption plan，而不是直接 git apply。

先读：
- docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md
- docs/plans/v30-verified-adoption-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
接入 existing `symphony adopt --run <confirmed-run-id> --json` 计划语义，展示 patch summary、fingerprints、affected files、recovery notes。

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
- pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json

完成后写 worker evidence：
- docs/plans/v30-task-2-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v30 task-2 independent reviewer review：Adoption plan preview workspace。

目标：
- 审查当前分支 `v30-task-2-adoption-plan-preview-workspace` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v30-task-2-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v30 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v30-task-2-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v30 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v30-task-2-adoption-plan-preview-workspace
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json

写 evidence：
- docs/plans/v30-task-2-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-3: Adoption inspect and recovery view

### Worker prompt

```text
/goal
执行 v30 task-3 worker implementation：Adoption inspect and recovery view。

目标：
- 当前 goal id：v30-verified-adoption-workspace-v2
- 当前任务：task-3
- 当前分支必须是：v30-task-3-adoption-inspect-and-recovery-view
- 用户可见价值：采纳失败或中断后，用户能在 Workbench 里看清楚恢复状态。

先读：
- docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md
- docs/plans/v30-verified-adoption-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
接入 `symphony adopt --inspect <adoption-id> --json` 的 read-only 输出，展示 journal state、before/after hash、current worktree matches。

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
- pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json

完成后写 worker evidence：
- docs/plans/v30-task-3-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v30 task-3 independent reviewer review：Adoption inspect and recovery view。

目标：
- 审查当前分支 `v30-task-3-adoption-inspect-and-recovery-view` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v30-task-3-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v30 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v30-task-3-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v30 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v30-task-3-adoption-inspect-and-recovery-view
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json

写 evidence：
- docs/plans/v30-task-3-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-4: Confirm adoption and post-apply next action

### Worker prompt

```text
/goal
执行 v30 task-4 worker implementation：Confirm adoption and post-apply next action。

目标：
- 当前 goal id：v30-verified-adoption-workspace-v2
- 当前任务：task-4
- 当前分支必须是：v30-task-4-confirm-adoption-and-post-apply-next-action
- 用户可见价值：用户确认 frozen adoption plan 后，结果能进入 main worktree 并出现下一步 review/verification。

先读：
- docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md
- docs/plans/v30-verified-adoption-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
接入 `symphony adopt --confirm <adoption-id> --json` 的受控 confirm 语义；confirm 后刷新 active goal、events、runs、next action。

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
- pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json

完成后写 worker evidence：
- docs/plans/v30-task-4-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v30 task-4 independent reviewer review：Confirm adoption and post-apply next action。

目标：
- 审查当前分支 `v30-task-4-confirm-adoption-and-post-apply-next-action` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v30-task-4-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v30 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v30-task-4-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v30 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v30-task-4-confirm-adoption-and-post-apply-next-action
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json

写 evidence：
- docs/plans/v30-task-4-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-5: Adoption tests, docs, and evidence bridge

### Worker prompt

```text
/goal
执行 v30 task-5 worker implementation：Adoption tests, docs, and evidence bridge。

目标：
- 当前 goal id：v30-verified-adoption-workspace-v2
- 当前任务：task-5
- 当前分支必须是：v30-task-5-adoption-tests-docs-and-evidence-bridge
- 用户可见价值：adoption 是 verified workflow，不是直接 patch/apply 按钮。

先读：
- docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md
- docs/plans/v30-verified-adoption-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
补 Workbench UI/API tests、route-safety tests、operator guide、release evidence；明确不运行模型、不触发任意 shell、不声明 main verification。

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
- pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json

完成后写 worker evidence：
- docs/plans/v30-task-5-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v30 task-5 independent reviewer review：Adoption tests, docs, and evidence bridge。

目标：
- 审查当前分支 `v30-task-5-adoption-tests-docs-and-evidence-bridge` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v30-task-5-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v30 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v30-task-5-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v30 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v30-task-5-adoption-tests-docs-and-evidence-bridge
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json

写 evidence：
- docs/plans/v30-task-5-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```
