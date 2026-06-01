# v32 Execution Prompts: Release Manager Workspace v2

Date: 2026-06-01  
Goal id: `v32-release-manager-workspace-v2`  
Baseline: `v31 main verification runner + evidence writer`

Use these prompts with `/goal`. The canonical full command flow is in the matching `workbench-v29-v32-goal-runbooks/*_goal_runbook_latest.md` file.

## Task 0 bootstrap prompt

```text
/goal
执行 v32 Task 0：为 `v32-release-manager-workspace-v2` 注册 plan/runbook，并确认本版本开始前的 baseline 是 `v31 main verification runner + evidence writer`。

目标：
- Plan doc：docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md
- Execution prompt doc：docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
- Goal id：v32-release-manager-workspace-v2
- 版本目标：Release Manager Workspace v2
- Workbench 主线必须延续 v20-v28 goal/runbook/next-action 方式，不回到 v8 command surface。

验收：
- pnpm check
- pnpm test
- git diff --check
```

## task-1: Clean release baseline resolver

### Worker prompt

```text
/goal
执行 v32 task-1 worker implementation：Clean release baseline resolver。

目标：
- 当前 goal id：v32-release-manager-workspace-v2
- 当前任务：task-1
- 当前分支必须是：v32-task-1-clean-release-baseline-resolver
- 用户可见价值：release manager 不再在 dirty fallback checkout 上做最终判断。

先读：
- docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md
- docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
建立 release baseline resolver：显示 current branch、main HEAD、origin/main、worktree cleanliness、PR/CI ref；dirty 或非 main 状态时只给 stop/fix guidance。

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
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

完成后写 worker evidence：
- docs/plans/v32-task-1-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v32 task-1 independent reviewer review：Clean release baseline resolver。

目标：
- 审查当前分支 `v32-task-1-clean-release-baseline-resolver` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v32-task-1-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v32 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v32-task-1-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v32 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v32-task-1-clean-release-baseline-resolver
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

写 evidence：
- docs/plans/v32-task-1-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-2: Release gate checklist recorder

### Worker prompt

```text
/goal
执行 v32 task-2 worker implementation：Release gate checklist recorder。

目标：
- 当前 goal id：v32-release-manager-workspace-v2
- 当前任务：task-2
- 当前分支必须是：v32-task-2-release-gate-checklist-recorder
- 用户可见价值：release gates 的结果能在 Workbench 里逐项记录，不靠 closeout 文案推断。

先读：
- docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md
- docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
把 `pnpm check/test/workbench:build/test:mutation:gate/audit/mcas doctor/diff/docsUpdated` 作为 release gate checklist；支持 evidence refs 和 explicit goal gate preview/confirm。

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
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

完成后写 worker evidence：
- docs/plans/v32-task-2-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v32 task-2 independent reviewer review：Release gate checklist recorder。

目标：
- 审查当前分支 `v32-task-2-release-gate-checklist-recorder` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v32-task-2-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v32 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v32-task-2-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v32 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v32-task-2-release-gate-checklist-recorder
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

写 evidence：
- docs/plans/v32-task-2-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-3: Release and tag evidence workspace

### Worker prompt

```text
/goal
执行 v32 task-3 worker implementation：Release and tag evidence workspace。

目标：
- 当前 goal id：v32-release-manager-workspace-v2
- 当前任务：task-3
- 当前分支必须是：v32-task-3-release-and-tag-evidence-workspace
- 用户可见价值：tag evidence 有明确 ref、commit、命令结果和边界，不自动打 tag。

先读：
- docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md
- docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
生成 release evidence 和 tag evidence draft；显示 tag recommendation、target commit、release notes summary；copy-only tag command，不执行 tag/push/publish。

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
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

完成后写 worker evidence：
- docs/plans/v32-task-3-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v32 task-3 independent reviewer review：Release and tag evidence workspace。

目标：
- 审查当前分支 `v32-task-3-release-and-tag-evidence-workspace` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v32-task-3-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v32 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v32-task-3-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v32 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v32-task-3-release-and-tag-evidence-workspace
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

写 evidence：
- docs/plans/v32-task-3-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-4: Release.ready closeout confirm

### Worker prompt

```text
/goal
执行 v32 task-4 worker implementation：Release.ready closeout confirm。

目标：
- 当前 goal id：v32-release-manager-workspace-v2
- 当前任务：task-4
- 当前分支必须是：v32-task-4-release-ready-closeout-confirm
- 用户可见价值：所有 release gates passed 后，用户能受控声明 `release.ready`。

先读：
- docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md
- docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
接入 `goal gate --gate release.ready --status declared` dry-run + plan-hash confirm；confirm 后 closeout 必须无缺口。

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
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

完成后写 worker evidence：
- docs/plans/v32-task-4-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v32 task-4 independent reviewer review：Release.ready closeout confirm。

目标：
- 审查当前分支 `v32-task-4-release-ready-closeout-confirm` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v32-task-4-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v32 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v32-task-4-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v32 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v32-task-4-release-ready-closeout-confirm
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

写 evidence：
- docs/plans/v32-task-4-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-5: Next-version handoff generator

### Worker prompt

```text
/goal
执行 v32 task-5 worker implementation：Next-version handoff generator。

目标：
- 当前 goal id：v32-release-manager-workspace-v2
- 当前任务：task-5
- 当前分支必须是：v32-task-5-next-version-handoff-generator
- 用户可见价值：v32 结束后能自然生成 v33 起步上下文，不重新读散乱历史。

先读：
- docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md
- docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
根据 final closeout、release evidence、operator guide 和 implemented capabilities 生成 next-version handoff draft；不自动创建新 goal，不自动进入 v33。

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
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

完成后写 worker evidence：
- docs/plans/v32-task-5-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v32 task-5 independent reviewer review：Next-version handoff generator。

目标：
- 审查当前分支 `v32-task-5-next-version-handoff-generator` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v32-task-5-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v32 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v32-task-5-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v32 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v32-task-5-next-version-handoff-generator
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

写 evidence：
- docs/plans/v32-task-5-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```
