# v34 Plan + /goal Runbook: Action Registry Workspace
Date: 2026-06-02  Goal id: `v34-action-registry-workspace`  Baseline: `v33 App Runtime Foundation`  Release name: `v34 Action Registry Workspace`
## Correction note
This runbook continues the current goal/runbook/next-action Workbench workflow. It does **not** use the old v8 command surface as the Workbench/App action baseline.
```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```
## Product purpose
把 Workbench 上未来所有按钮/操作抽象成内核声明式 Action Registry，让 Web/Desktop/Notch/CLI 共享同一套 action_id、availability、capability preview 和 event mapping。
## Product spine
```text
active goal/next action -> action availability -> capability preview -> event/evidence mapping -> action panel
```
## Tasks
- task-1: Action manifest contract — UI/Workbench 后续按钮有内核声明式 action，不再硬编码命令。
- task-2: Action availability resolver — 用户能知道某个 action 为什么能做或不能做。
- task-3: Action preview API — App/Workbench 能预览动作影响，不触发写入。
- task-4: Workbench action panel binding — 页面按钮来自内核，而不是前端自造流程。
- task-5: Action registry evidence + migration guide — v35 job queue 可以稳定接上 action。

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
- Version runbook: `docs/plans/app-core-v34-v40-goal-runbooks/v34_action-registry-workspace_goal_runbook_latest.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v34-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v34 Task 0：为 `v34-action-registry-workspace` 写/核对 plan/runbook 和 execution prompts，并用 latest goal init / goal-status 流程注册该 goal。

目标：
- 写入或确认 plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- 写入或确认 execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v34-action-registry-workspace
- Baseline：v33 App Runtime Foundation
- 版本目标：Action Registry Workspace
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
  --from-json fixtures/contracts/goal-runbook.v34-action-registry-workspace.v1.json \
  --goal v34-action-registry-workspace \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v34-action-registry-workspace.v1.json \
  --goal v34-action-registry-workspace \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json
pnpm --silent symphony goal next --goal v34-action-registry-workspace --json
```


---

# task-1: Action manifest contract

Branch: `v34-task-1-action-manifest-contract`  
Worker evidence: `docs/plans/v34-task-1-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v34-task-1-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v34-task-1-main-verification-evidence-2026-06-02.md`

## User-visible value

UI/Workbench 后续按钮有内核声明式 action，不再硬编码命令。

## Implementation scope

定义 action_id、label、scope、availability、capability preview、event mapping、evidence expectations。

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
pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json
pnpm --silent symphony goal next --goal v34-action-registry-workspace --json
git checkout -b v34-task-1-action-manifest-contract
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v34 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v34-task-1-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v34-action-registry-workspace
- Task id: task-1
- Branch: v34-task-1-action-manifest-contract
- User-visible value: UI/Workbench 后续按钮有内核声明式 action，不再硬编码命令。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json
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

## Main verifier prompt

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


---

# task-2: Action availability resolver

Branch: `v34-task-2-action-availability-resolver`  
Worker evidence: `docs/plans/v34-task-2-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v34-task-2-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v34-task-2-main-verification-evidence-2026-06-02.md`

## User-visible value

用户能知道某个 action 为什么能做或不能做。

## Implementation scope

基于 active goal/task/runbook/next action 计算 available/unavailable reasons。

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
pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json
pnpm --silent symphony goal next --goal v34-action-registry-workspace --json
git checkout -b v34-task-2-action-availability-resolver
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v34 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v34-task-2-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v34-action-registry-workspace
- Task id: task-2
- Branch: v34-task-2-action-availability-resolver
- User-visible value: 用户能知道某个 action 为什么能做或不能做。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json
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

## Main verifier prompt

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


---

# task-3: Action preview API

Branch: `v34-task-3-action-preview-api`  
Worker evidence: `docs/plans/v34-task-3-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v34-task-3-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v34-task-3-main-verification-evidence-2026-06-02.md`

## User-visible value

App/Workbench 能预览动作影响，不触发写入。

## Implementation scope

新增只读 action preview API，返回 actions、capabilities、required confirmations，不执行。

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
pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json
pnpm --silent symphony goal next --goal v34-action-registry-workspace --json
git checkout -b v34-task-3-action-preview-api
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v34 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v34-task-3-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v34-action-registry-workspace
- Task id: task-3
- Branch: v34-task-3-action-preview-api
- User-visible value: App/Workbench 能预览动作影响，不触发写入。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json
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

## Main verifier prompt

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


---

# task-4: Workbench action panel binding

Branch: `v34-task-4-workbench-action-panel-binding`  
Worker evidence: `docs/plans/v34-task-4-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v34-task-4-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v34-task-4-main-verification-evidence-2026-06-02.md`

## User-visible value

页面按钮来自内核，而不是前端自造流程。

## Implementation scope

Workbench action 面板从 registry 读取 action，不直接拼 shell 命令。

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
pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json
pnpm --silent symphony goal next --goal v34-action-registry-workspace --json
git checkout -b v34-task-4-workbench-action-panel-binding
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v34 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v34-task-4-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v34-action-registry-workspace
- Task id: task-4
- Branch: v34-task-4-workbench-action-panel-binding
- User-visible value: 页面按钮来自内核，而不是前端自造流程。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json
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

## Main verifier prompt

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


---

# task-5: Action registry evidence + migration guide

Branch: `v34-task-5-action-registry-evidence-migration-guide`  
Worker evidence: `docs/plans/v34-task-5-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v34-task-5-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v34-task-5-main-verification-evidence-2026-06-02.md`

## User-visible value

v35 job queue 可以稳定接上 action。

## Implementation scope

补齐 docs/tests/evidence，说明未来 Web/Desktop/Notch 如何消费同一套 action layer。

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
pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json
pnpm --silent symphony goal next --goal v34-action-registry-workspace --json
git checkout -b v34-task-5-action-registry-evidence-migration-guide
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v34 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v34-task-5-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v34-action-registry-workspace
- Task id: task-5
- Branch: v34-task-5-action-registry-evidence-migration-guide
- User-visible value: v35 job queue 可以稳定接上 action。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json
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

## Main verifier prompt

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


---

# Release closeout

Only after all tasks have approved review evidence and main-verification gates passed.

```bash
pnpm --silent symphony goal closeout --goal v34-action-registry-workspace --markdown

pnpm --silent symphony goal gate \
  --goal v34-action-registry-workspace \
  --gate release.ready \
  --status declared \
  --verifier codex-v34-release-manager \
  --evidence-ref docs/plans/v34-release-evidence-2026-06-02.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v34-action-registry-workspace \
  --gate release.ready \
  --status declared \
  --verifier codex-v34-release-manager \
  --evidence-ref docs/plans/v34-release-evidence-2026-06-02.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Next-version handoff

After v34 release, initialize `v35-job-queue-run-control-workspace` using the same implementation plan and the v35 runbook.
