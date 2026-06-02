# v36 Plan + /goal Runbook: Artifact/Evidence Index Workspace
Date: 2026-06-02  Goal id: `v36-artifact-evidence-index-workspace`  Baseline: `v35 Job Queue + Run Control Workspace`  Release name: `v36 Artifact/Evidence Index Workspace`
## Correction note
This runbook continues the current goal/runbook/next-action Workbench workflow. It does **not** use the old v8 command surface as the Workbench/App action baseline.
```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```
## Product purpose
把 ArtifactStore 的 evidence refs 派生为 App 可浏览、搜索、筛选、导出的索引层，同时保持 ArtifactStore 是唯一事实来源。
## Product spine
```text
ArtifactStore refs -> derived index -> safe preview/search/filter -> evidence timeline -> export bundle draft
```
## Tasks
- task-1: Artifact index contract — Evidence 能被 app 查询但不替代 ArtifactStore。
- task-2: Indexer from ArtifactStore/event refs — 不会出现第二事实来源。
- task-3: Safe preview/search/filter API — App 可以浏览证据但不能乱读文件。
- task-4: Evidence timeline + release bundle view — 用户能复盘每个版本为什么可 release。
- task-5: Export diagnostics/evidence bundle draft — v39 backup/diagnostics 有基础。

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
- Version runbook: `docs/plans/app-core-v34-v40-goal-runbooks/v36_artifact-evidence-index-workspace_goal_runbook_latest.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v36-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v36 Task 0：为 `v36-artifact-evidence-index-workspace` 写/核对 plan/runbook 和 execution prompts，并用 latest goal init / goal-status 流程注册该 goal。

目标：
- 写入或确认 plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- 写入或确认 execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v36-artifact-evidence-index-workspace
- Baseline：v35 Job Queue + Run Control Workspace
- 版本目标：Artifact/Evidence Index Workspace
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
  --from-json fixtures/contracts/goal-runbook.v36-artifact-evidence-index-workspace.v1.json \
  --goal v36-artifact-evidence-index-workspace \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v36-artifact-evidence-index-workspace.v1.json \
  --goal v36-artifact-evidence-index-workspace \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json
pnpm --silent symphony goal next --goal v36-artifact-evidence-index-workspace --json
```


---

# task-1: Artifact index contract

Branch: `v36-task-1-artifact-index-contract`  
Worker evidence: `docs/plans/v36-task-1-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v36-task-1-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v36-task-1-main-verification-evidence-2026-06-02.md`

## User-visible value

Evidence 能被 app 查询但不替代 ArtifactStore。

## Implementation scope

定义 artifact_id/kind/hash/path/ref/goal/task/run/job/status/tags/preview_summary schema。

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
pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json
pnpm --silent symphony goal next --goal v36-artifact-evidence-index-workspace --json
git checkout -b v36-task-1-artifact-index-contract
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v36 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v36-task-1-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v36-artifact-evidence-index-workspace
- Task id: task-1
- Branch: v36-task-1-artifact-index-contract
- User-visible value: Evidence 能被 app 查询但不替代 ArtifactStore。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json
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

## Main verifier prompt

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


---

# task-2: Indexer from ArtifactStore/event refs

Branch: `v36-task-2-indexer-from-artifactstore-event-refs`  
Worker evidence: `docs/plans/v36-task-2-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v36-task-2-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v36-task-2-main-verification-evidence-2026-06-02.md`

## User-visible value

不会出现第二事实来源。

## Implementation scope

从现有 ArtifactStore refs 和 explicit events 派生索引；index 是 cache。

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
pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json
pnpm --silent symphony goal next --goal v36-artifact-evidence-index-workspace --json
git checkout -b v36-task-2-indexer-from-artifactstore-event-refs
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v36 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v36-task-2-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v36-artifact-evidence-index-workspace
- Task id: task-2
- Branch: v36-task-2-indexer-from-artifactstore-event-refs
- User-visible value: 不会出现第二事实来源。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json
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

## Main verifier prompt

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


---

# task-3: Safe preview/search/filter API

Branch: `v36-task-3-safe-preview-search-filter-api`  
Worker evidence: `docs/plans/v36-task-3-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v36-task-3-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v36-task-3-main-verification-evidence-2026-06-02.md`

## User-visible value

App 可以浏览证据但不能乱读文件。

## Implementation scope

提供搜索、筛选、安全预览 API；禁止 arbitrary local path。

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
pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json
pnpm --silent symphony goal next --goal v36-artifact-evidence-index-workspace --json
git checkout -b v36-task-3-safe-preview-search-filter-api
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v36 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v36-task-3-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v36-artifact-evidence-index-workspace
- Task id: task-3
- Branch: v36-task-3-safe-preview-search-filter-api
- User-visible value: App 可以浏览证据但不能乱读文件。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json
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

## Main verifier prompt

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


---

# task-4: Evidence timeline + release bundle view

Branch: `v36-task-4-evidence-timeline-release-bundle-view`  
Worker evidence: `docs/plans/v36-task-4-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v36-task-4-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v36-task-4-main-verification-evidence-2026-06-02.md`

## User-visible value

用户能复盘每个版本为什么可 release。

## Implementation scope

按 goal/task/job/review/main verification/release 组织 timeline 和 bundle 视图。

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
pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json
pnpm --silent symphony goal next --goal v36-artifact-evidence-index-workspace --json
git checkout -b v36-task-4-evidence-timeline-release-bundle-view
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v36 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v36-task-4-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v36-artifact-evidence-index-workspace
- Task id: task-4
- Branch: v36-task-4-evidence-timeline-release-bundle-view
- User-visible value: 用户能复盘每个版本为什么可 release。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json
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

## Main verifier prompt

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


---

# task-5: Export diagnostics/evidence bundle draft

Branch: `v36-task-5-export-diagnostics-evidence-bundle-draft`  
Worker evidence: `docs/plans/v36-task-5-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v36-task-5-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v36-task-5-main-verification-evidence-2026-06-02.md`

## User-visible value

v39 backup/diagnostics 有基础。

## Implementation scope

实现 copy-only 或写入门控的 evidence/diagnostics bundle draft。

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
pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json
pnpm --silent symphony goal next --goal v36-artifact-evidence-index-workspace --json
git checkout -b v36-task-5-export-diagnostics-evidence-bundle-draft
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v36 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v36-task-5-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v36-artifact-evidence-index-workspace
- Task id: task-5
- Branch: v36-task-5-export-diagnostics-evidence-bundle-draft
- User-visible value: v39 backup/diagnostics 有基础。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v36-artifact-evidence-index-workspace --json
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

## Main verifier prompt

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


---

# Release closeout

Only after all tasks have approved review evidence and main-verification gates passed.

```bash
pnpm --silent symphony goal closeout --goal v36-artifact-evidence-index-workspace --markdown

pnpm --silent symphony goal gate \
  --goal v36-artifact-evidence-index-workspace \
  --gate release.ready \
  --status declared \
  --verifier codex-v36-release-manager \
  --evidence-ref docs/plans/v36-release-evidence-2026-06-02.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v36-artifact-evidence-index-workspace \
  --gate release.ready \
  --status declared \
  --verifier codex-v36-release-manager \
  --evidence-ref docs/plans/v36-release-evidence-2026-06-02.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Next-version handoff

After v36 release, initialize `v37-desktop-shell-mvp` using the same implementation plan and the v37 runbook.
