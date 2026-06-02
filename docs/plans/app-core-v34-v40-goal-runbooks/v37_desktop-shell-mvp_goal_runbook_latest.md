# v37 Plan + /goal Runbook: Desktop Shell MVP
Date: 2026-06-02  Goal id: `v37-desktop-shell-mvp`  Baseline: `v36 Artifact/Evidence Index Workspace`  Release name: `v37 Desktop Shell MVP`
## Correction note
This runbook continues the current goal/runbook/next-action Workbench workflow. It does **not** use the old v8 command surface as the Workbench/App action baseline.
```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```
## Product purpose
创建 Desktop Shell MVP，让本地 App 能启动/连接 sidecar，显示项目、active goal、next action、job 状态和 artifact preview，但不绕过 kernel。
## Product spine
```text
desktop shell -> sidecar health -> project/goal state -> job/artifact panels -> desktop build smoke
```
## Tasks
- task-1: Desktop shell decision + minimal workspace — 从网页走向 app，但不是网页套壳。
- task-2: Sidecar launcher + health bridge — App 可以管理本地 runtime 生命周期。
- task-3: Project list + active goal + next action view — 桌面窗口能看清当前开发状态。
- task-4: Job status + artifact preview binding — Desktop 不绕过 app kernel。
- task-5: Desktop build smoke + packaging boundary evidence — 桌面 MVP 可验证但不急于分发。

## Non-goals
- Do not create a generic shell runner, browser terminal, arbitrary command palette, or generic model invocation path.
- Do not let UI execute raw shell commands.
- Do not replace the goal framework, ArtifactStore, or event semantics.
- Do not infer status from branch names, filenames, task titles, prompt text, or frontend state.
- Do not let worker self-approve.
- Do not auto-merge, auto-push, auto-tag, or publish.
- Do not invoke providers or open local files directly from the renderer.

## Task 0: bootstrap/register this version goal
Recommended docs:

- Plan doc: `docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md`
- Execution prompt doc: `docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md`
- Version runbook: `docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v37-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v37 Task 0：为 `v37-desktop-shell-mvp` 写/核对 plan/runbook 和 execution prompts，并用 latest goal init / goal-status 流程注册该 goal。

目标：
- 写入或确认 plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- 写入或确认 execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v37-desktop-shell-mvp
- Baseline：v36 Artifact/Evidence Index Workspace
- 版本目标：Desktop Shell MVP
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
  --from-json fixtures/contracts/goal-runbook.v37-desktop-shell-mvp.v1.json \
  --goal v37-desktop-shell-mvp \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v37-desktop-shell-mvp.v1.json \
  --goal v37-desktop-shell-mvp \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
pnpm --silent symphony goal next --goal v37-desktop-shell-mvp --json
```


---

# task-1: Desktop shell decision + minimal workspace

Branch: `v37-task-1-desktop-shell-decision-workspace`  
Worker evidence: `docs/plans/v37-task-1-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v37-task-1-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md`

## User-visible value

从网页走向 app，但不是网页套壳。

## Implementation scope

记录 Tauri/Electron 选择，创建最小 desktop workspace，不重写 workflow kernel。

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
pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
pnpm --silent symphony goal next --goal v37-desktop-shell-mvp --json
git checkout -b v37-task-1-desktop-shell-decision-workspace
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v37 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v37-task-1-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v37-desktop-shell-mvp
- Task id: task-1
- Branch: v37-task-1-desktop-shell-decision-workspace
- User-visible value: 从网页走向 app，但不是网页套壳。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
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

## Main verifier prompt

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


---

# task-2: Sidecar launcher + health bridge

Branch: `v37-task-2-sidecar-launcher-health-bridge`  
Worker evidence: `docs/plans/v37-task-2-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v37-task-2-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v37-task-2-main-verification-evidence-2026-06-02.md`

## User-visible value

App 可以管理本地 runtime 生命周期。

## Implementation scope

Desktop shell 启动/连接 local sidecar，读取 health/app state。

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
pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
pnpm --silent symphony goal next --goal v37-desktop-shell-mvp --json
git checkout -b v37-task-2-sidecar-launcher-health-bridge
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v37 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v37-task-2-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v37-desktop-shell-mvp
- Task id: task-2
- Branch: v37-task-2-sidecar-launcher-health-bridge
- User-visible value: App 可以管理本地 runtime 生命周期。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
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

## Main verifier prompt

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


---

# task-3: Project list + active goal + next action view

Branch: `v37-task-3-project-active-goal-next-action-view`  
Worker evidence: `docs/plans/v37-task-3-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v37-task-3-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md`

## User-visible value

桌面窗口能看清当前开发状态。

## Implementation scope

显示项目列表、当前 goal、next action、blocked/review/main verification/release 状态。

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
pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
pnpm --silent symphony goal next --goal v37-desktop-shell-mvp --json
git checkout -b v37-task-3-project-active-goal-next-action-view
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v37 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v37-task-3-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v37-desktop-shell-mvp
- Task id: task-3
- Branch: v37-task-3-project-active-goal-next-action-view
- User-visible value: 桌面窗口能看清当前开发状态。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
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

## Main verifier prompt

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


---

# task-4: Job status + artifact preview binding

Branch: `v37-task-4-job-status-artifact-preview-binding`  
Worker evidence: `docs/plans/v37-task-4-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v37-task-4-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md`

## User-visible value

Desktop 不绕过 app kernel。

## Implementation scope

Desktop 使用现有 job/artifact API 展示状态和安全预览。

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
pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
pnpm --silent symphony goal next --goal v37-desktop-shell-mvp --json
git checkout -b v37-task-4-job-status-artifact-preview-binding
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v37 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v37-task-4-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v37-desktop-shell-mvp
- Task id: task-4
- Branch: v37-task-4-job-status-artifact-preview-binding
- User-visible value: Desktop 不绕过 app kernel。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
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

## Main verifier prompt

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


---

# task-5: Desktop build smoke + packaging boundary evidence

Branch: `v37-task-5-desktop-build-smoke-packaging-boundary`  
Worker evidence: `docs/plans/v37-task-5-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v37-task-5-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v37-task-5-main-verification-evidence-2026-06-02.md`

## User-visible value

桌面 MVP 可验证但不急于分发。

## Implementation scope

加入 build smoke 和 packaging 边界文档；不做自动更新/发布。

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
pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
pnpm --silent symphony goal next --goal v37-desktop-shell-mvp --json
git checkout -b v37-task-5-desktop-build-smoke-packaging-boundary
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v37 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v37-task-5-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v37-desktop-shell-mvp
- Task id: task-5
- Branch: v37-task-5-desktop-build-smoke-packaging-boundary
- User-visible value: 桌面 MVP 可验证但不急于分发。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
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

## Main verifier prompt

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


---

# Release closeout

Only after all tasks have approved review evidence and main-verification gates passed.

```bash
pnpm --silent symphony goal closeout --goal v37-desktop-shell-mvp --markdown

pnpm --silent symphony goal gate \
  --goal v37-desktop-shell-mvp \
  --gate release.ready \
  --status declared \
  --verifier codex-v37-release-manager \
  --evidence-ref docs/plans/v37-release-evidence-2026-06-02.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v37-desktop-shell-mvp \
  --gate release.ready \
  --status declared \
  --verifier codex-v37-release-manager \
  --evidence-ref docs/plans/v37-release-evidence-2026-06-02.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Next-version handoff

After v37 release, initialize `v38-provider-hub-capability-profiles` using the same implementation plan and the v38 runbook.
