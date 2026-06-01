# v31 Execution Prompts: Main Verification Runner + Evidence Writer

Date: 2026-06-01  
Goal id: `v31-main-verification-runner-evidence-writer`  
Baseline: `v30 verified adoption workspace v2`

Use these prompts with `/goal`. The canonical full command flow is in the matching `workbench-v29-v32-goal-runbooks/*_goal_runbook_latest.md` file.

## Task 0 bootstrap prompt

```text
/goal
执行 v31 Task 0：为 `v31-main-verification-runner-evidence-writer` 注册 plan/runbook，并确认本版本开始前的 baseline 是 `v30 verified adoption workspace v2`。

目标：
- Plan doc：docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
- Execution prompt doc：docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
- Goal id：v31-main-verification-runner-evidence-writer
- 版本目标：Main Verification Runner + Evidence Writer
- Workbench 主线必须延续 v20-v28 goal/runbook/next-action 方式，不回到 v8 command surface。

验收：
- pnpm check
- pnpm test
- git diff --check
```

## task-1: Main verification readiness from explicit state

### Worker prompt

```text
/goal
执行 v31 task-1 worker implementation：Main verification readiness from explicit state。

目标：
- 当前 goal id：v31-main-verification-runner-evidence-writer
- 当前任务：task-1
- 当前分支必须是：v31-task-1-main-verification-readiness-from-explicit-state
- 用户可见价值：用户知道什么时候可以进入 main verification，什么时候必须先 review/revision/adoption。

先读：
- docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
- docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
建立 readiness model：只读取 goal-status、events、adoption inspect/run state 和 reviewer verdict，不从前端/文件名推断。

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
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

完成后写 worker evidence：
- docs/plans/v31-task-1-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v31 task-1 independent reviewer review：Main verification readiness from explicit state。

目标：
- 审查当前分支 `v31-task-1-main-verification-readiness-from-explicit-state` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v31-task-1-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v31 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v31-task-1-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v31 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v31-task-1-main-verification-readiness-from-explicit-state
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

写 evidence：
- docs/plans/v31-task-1-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Common registration commands

Worker evidence registration:

```bash
pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor <worker-id> \
  --evidence-ref <worker-evidence-ref> \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor <worker-id> \
  --evidence-ref <worker-evidence-ref> \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Independent review registration:

```bash
pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task <task-id> \
  --verdict approved \
  --reviewer <reviewer-id> \
  --evidence-ref <review-evidence-ref> \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task <task-id> \
  --verdict approved \
  --reviewer <reviewer-id> \
  --evidence-ref <review-evidence-ref> \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Main verification gate registration:

```bash
pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier <main-verifier-id> \
  --evidence-ref <main-verification-evidence-ref> \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier <main-verifier-id> \
  --evidence-ref <main-verification-evidence-ref> \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Release closeout prompt

```text
/goal
执行 v31 release manager closeout。

目标：
- 确认 v31 的 5 个 task 都有 worker evidence、independent review、main verification evidence 和 main-verification gate。
- 在干净 main/ref 上运行 release validation。
- 写 release evidence：docs/plans/v31-release-evidence-2026-06-01.md
- 使用 goal gate dry-run + confirm 登记 runbook 要求的 release gates。
- 所有 release gates passed 后，才允许登记 release.ready declared。

必须运行：
- git checkout main
- git pull --ff-only
- git status -sb
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
- pnpm --silent symphony goal closeout --goal v31-main-verification-runner-evidence-writer --markdown

禁止：
- 不从 README、branch、tag name、file name、prompt text、frontend state 或测试文案推断 release-ready。
- 不自动创建 tag、push tag、publish release。
- 不把 v8 command surface 当作 Workbench 主入口。
```

Release gates use this dry-run/confirm shape for `release.pnpm-check`, `release.pnpm-test`, `release.workbench-build`, `release.diff-check`, and `release.docs-updated`:

```bash
pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate <release-gate> \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate <release-gate> \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Release readiness is separate and must wait for complete closeout evidence:

```bash
pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.ready \
  --status declared \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.ready \
  --status declared \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## task-2: Allowlisted verification plan preview

### Worker prompt

```text
/goal
执行 v31 task-2 worker implementation：Allowlisted verification plan preview。

目标：
- 当前 goal id：v31-main-verification-runner-evidence-writer
- 当前任务：task-2
- 当前分支必须是：v31-task-2-allowlisted-verification-plan-preview
- 用户可见价值：用户能看清楚将要跑哪些验证命令，不能输入任意 shell。

先读：
- docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
- docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
增加 allowlisted verification plan preview：`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check`，可按 task scope 增加受控命令，不接受任意 command。

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
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

完成后写 worker evidence：
- docs/plans/v31-task-2-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v31 task-2 independent reviewer review：Allowlisted verification plan preview。

目标：
- 审查当前分支 `v31-task-2-allowlisted-verification-plan-preview` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v31-task-2-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v31 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v31-task-2-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v31 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v31-task-2-allowlisted-verification-plan-preview
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

写 evidence：
- docs/plans/v31-task-2-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-3: Verification operation console

### Worker prompt

```text
/goal
执行 v31 task-3 worker implementation：Verification operation console。

目标：
- 当前 goal id：v31-main-verification-runner-evidence-writer
- 当前任务：task-3
- 当前分支必须是：v31-task-3-verification-operation-console
- 用户可见价值：长时间验证不会黑盒；用户能看到状态、stdout/stderr 摘要、exit code 和 artifact refs。

先读：
- docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
- docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
把 verification command suite 接进 operation registry 和 Workbench console；保存 command result contract，不把运行成功自动等于 gate passed。

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
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

完成后写 worker evidence：
- docs/plans/v31-task-3-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v31 task-3 independent reviewer review：Verification operation console。

目标：
- 审查当前分支 `v31-task-3-verification-operation-console` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v31-task-3-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v31 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v31-task-3-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v31 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v31-task-3-verification-operation-console
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

写 evidence：
- docs/plans/v31-task-3-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-4: Main verification evidence writer

### Worker prompt

```text
/goal
执行 v31 task-4 worker implementation：Main verification evidence writer。

目标：
- 当前 goal id：v31-main-verification-runner-evidence-writer
- 当前任务：task-4
- 当前分支必须是：v31-task-4-main-verification-evidence-writer
- 用户可见价值：用户不用手写 main verification evidence。

先读：
- docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
- docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
根据验证结果、goal/task/run refs、review evidence、adoption refs 生成 evidence draft；draft 需要 operator/reviewer 检查，不自动 declare passed。

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
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

完成后写 worker evidence：
- docs/plans/v31-task-4-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v31 task-4 independent reviewer review：Main verification evidence writer。

目标：
- 审查当前分支 `v31-task-4-main-verification-evidence-writer` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v31-task-4-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v31 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v31-task-4-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v31 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v31-task-4-main-verification-evidence-writer
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

写 evidence：
- docs/plans/v31-task-4-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-5: Main-verification gate registration flow

### Worker prompt

```text
/goal
执行 v31 task-5 worker implementation：Main-verification gate registration flow。

目标：
- 当前 goal id：v31-main-verification-runner-evidence-writer
- 当前任务：task-5
- 当前分支必须是：v31-task-5-main-verification-gate-registration-flow
- 用户可见价值：验证 evidence 完整后，Workbench 能通过 dry-run/confirm 登记 main-verification gate。

先读：
- docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
- docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v29-v32-goal-runbooks/v31_main-verification-runner-evidence-writer_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
接入 existing `goal gate --gate main-verification --status passed` preview/confirm；补测试、docs、release evidence。

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
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

完成后写 worker evidence：
- docs/plans/v31-task-5-worker-evidence-2026-06-01.md
```

### Reviewer prompt

```text
/goal
执行 v31 task-5 independent reviewer review：Main-verification gate registration flow。

目标：
- 审查当前分支 `v31-task-5-main-verification-gate-registration-flow` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v31-task-5-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v31 plan、runbook 和本 task scope。
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
- Review evidence path：docs/plans/v31-task-5-review-evidence-2026-06-01.md
```

### Main verifier prompt

```text
/goal
执行 v31 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v31-task-5-main-verification-gate-registration-flow
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

写 evidence：
- docs/plans/v31-task-5-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```
