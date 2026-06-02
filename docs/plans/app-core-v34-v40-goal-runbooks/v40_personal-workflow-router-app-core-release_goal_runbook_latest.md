# v40 Plan + /goal Runbook: Personal Workflow Router + App Core Release Closeout
Date: 2026-06-02  Goal id: `v40-personal-workflow-router-app-core-release`  Baseline: `v39 Backup / Diagnostics / Migration Workspace`  Release name: `v40 Personal Workflow Router + App Core Release Closeout`
## Correction note
This runbook continues the current goal/runbook/next-action Workbench workflow. It does **not** use the old v8 command surface as the Workbench/App action baseline.
```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```
## Product purpose
补齐进入 Workbench 之前的 Inbox/Capture/Router，把个人开发流程入口和 App kernel 闭环接上，并完成 final app core release closeout。
## Product spine
```text
inbox capture -> router category -> goal/runbook draft -> app core release manager -> native UX handoff
```
## Tasks
- task-1: Inbox/capture contract — App 有入口，不只是执行台。
- task-2: Workflow router categories — 用户知道该走哪条流程。
- task-3: Goal/runbook draft handoff — 入口和 Workbench 闭环接上。
- task-4: App core release manager — App core 可以 declared release ready。
- task-5: Native UX handoff generator — 内核完成后自然进入 UX/分发阶段。

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
- Version runbook: `docs/plans/app-core-v34-v40-goal-runbooks/v40_personal-workflow-router-app-core-release_goal_runbook_latest.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v40-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v40 Task 0：为 `v40-personal-workflow-router-app-core-release` 写/核对 plan/runbook 和 execution prompts，并用 latest goal init / goal-status 流程注册该 goal。

目标：
- 写入或确认 plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- 写入或确认 execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v40-personal-workflow-router-app-core-release
- Baseline：v39 Backup / Diagnostics / Migration Workspace
- 版本目标：Personal Workflow Router + App Core Release Closeout
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
  --from-json fixtures/contracts/goal-runbook.v40-personal-workflow-router-app-core-release.v1.json \
  --goal v40-personal-workflow-router-app-core-release \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v40-personal-workflow-router-app-core-release.v1.json \
  --goal v40-personal-workflow-router-app-core-release \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json
pnpm --silent symphony goal next --goal v40-personal-workflow-router-app-core-release --json
```


---

# task-1: Inbox/capture contract

Branch: `v40-task-1-inbox-capture-contract`  
Worker evidence: `docs/plans/v40-task-1-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v40-task-1-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v40-task-1-main-verification-evidence-2026-06-02.md`

## User-visible value

App 有入口，不只是执行台。

## Implementation scope

捕获用户请求、项目线索、想法、故障，不强制进入 Workbench。

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
pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json
pnpm --silent symphony goal next --goal v40-personal-workflow-router-app-core-release --json
git checkout -b v40-task-1-inbox-capture-contract
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v40 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v40-task-1-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v40-personal-workflow-router-app-core-release
- Task id: task-1
- Branch: v40-task-1-inbox-capture-contract
- User-visible value: App 有入口，不只是执行台。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json
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

## Main verifier prompt

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


---

# task-2: Workflow router categories

Branch: `v40-task-2-workflow-router-categories`  
Worker evidence: `docs/plans/v40-task-2-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v40-task-2-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v40-task-2-main-verification-evidence-2026-06-02.md`

## User-visible value

用户知道该走哪条流程。

## Implementation scope

分类为 direct answer、skill、automation、workbench goal、research、ignore/skip。

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
pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json
pnpm --silent symphony goal next --goal v40-personal-workflow-router-app-core-release --json
git checkout -b v40-task-2-workflow-router-categories
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v40 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v40-task-2-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v40-personal-workflow-router-app-core-release
- Task id: task-2
- Branch: v40-task-2-workflow-router-categories
- User-visible value: 用户知道该走哪条流程。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json
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

## Main verifier prompt

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


---

# task-3: Goal/runbook draft handoff

Branch: `v40-task-3-goal-runbook-draft-handoff`  
Worker evidence: `docs/plans/v40-task-3-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v40-task-3-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v40-task-3-main-verification-evidence-2026-06-02.md`

## User-visible value

入口和 Workbench 闭环接上。

## Implementation scope

将重复摩擦或项目任务转成 goal/runbook draft，保留人工确认。

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
pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json
pnpm --silent symphony goal next --goal v40-personal-workflow-router-app-core-release --json
git checkout -b v40-task-3-goal-runbook-draft-handoff
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v40 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v40-task-3-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v40-personal-workflow-router-app-core-release
- Task id: task-3
- Branch: v40-task-3-goal-runbook-draft-handoff
- User-visible value: 入口和 Workbench 闭环接上。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json
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

## Main verifier prompt

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


---

# task-4: App core release manager

Branch: `v40-task-4-app-core-release-manager`  
Worker evidence: `docs/plans/v40-task-4-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v40-task-4-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v40-task-4-main-verification-evidence-2026-06-02.md`

## User-visible value

App core 可以 declared release ready。

## Implementation scope

收口 v34-v39 release checklist，生成 final app core evidence。

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
pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json
pnpm --silent symphony goal next --goal v40-personal-workflow-router-app-core-release --json
git checkout -b v40-task-4-app-core-release-manager
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v40 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v40-task-4-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v40-personal-workflow-router-app-core-release
- Task id: task-4
- Branch: v40-task-4-app-core-release-manager
- User-visible value: App core 可以 declared release ready。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json
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

## Main verifier prompt

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


---

# task-5: Native UX handoff generator

Branch: `v40-task-5-native-ux-handoff-generator`  
Worker evidence: `docs/plans/v40-task-5-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v40-task-5-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v40-task-5-main-verification-evidence-2026-06-02.md`

## User-visible value

内核完成后自然进入 UX/分发阶段。

## Implementation scope

生成 v41+ native UX/distribution/notch/menu bar handoff。

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
pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json
pnpm --silent symphony goal next --goal v40-personal-workflow-router-app-core-release --json
git checkout -b v40-task-5-native-ux-handoff-generator
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v40 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v40-task-5-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v40-personal-workflow-router-app-core-release
- Task id: task-5
- Branch: v40-task-5-native-ux-handoff-generator
- User-visible value: 内核完成后自然进入 UX/分发阶段。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v40-personal-workflow-router-app-core-release --json
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

## Main verifier prompt

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


---

# Release closeout

Only after all tasks have approved review evidence and main-verification gates passed.

```bash
pnpm --silent symphony goal closeout --goal v40-personal-workflow-router-app-core-release --markdown

pnpm --silent symphony goal gate \
  --goal v40-personal-workflow-router-app-core-release \
  --gate release.ready \
  --status declared \
  --verifier codex-v40-release-manager \
  --evidence-ref docs/plans/v40-release-evidence-2026-06-02.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v40-personal-workflow-router-app-core-release \
  --gate release.ready \
  --status declared \
  --verifier codex-v40-release-manager \
  --evidence-ref docs/plans/v40-release-evidence-2026-06-02.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Next-version handoff

After v40 release, generate v41+ Native UX / distribution / menu bar / notch companion handoff.
