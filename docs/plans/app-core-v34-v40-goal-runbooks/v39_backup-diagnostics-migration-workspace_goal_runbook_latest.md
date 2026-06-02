# v39 Plan + /goal Runbook: Backup / Diagnostics / Migration Workspace
Date: 2026-06-02  Goal id: `v39-backup-diagnostics-migration-workspace`  Baseline: `v38 Provider Hub + Capability Profiles`  Release name: `v39 Backup / Diagnostics / Migration Workspace`
## Correction note
This runbook continues the current goal/runbook/next-action Workbench workflow. It does **not** use the old v8 command surface as the Workbench/App action baseline.
```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```
## Product purpose
补齐 App 长期自用所需的 backup、diagnostics、schema migration、restore validation，让数据升级和故障诊断可控。
## Product spine
```text
data inventory -> schema version -> migration preview -> backup/export -> diagnostics/restore validation
```
## Tasks
- task-1: App data inventory — 知道 app 到底保存了什么。
- task-2: Schema version + migration runner — 升级不会靠猜。
- task-3: Backup/export bundle — 长期使用可备份。
- task-4: Diagnostics bundle — 坏了能定位。
- task-5: Restore validation — 恢复路径安全可验证。

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
- Version runbook: `docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v39-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v39 Task 0：为 `v39-backup-diagnostics-migration-workspace` 写/核对 plan/runbook 和 execution prompts，并用 latest goal init / goal-status 流程注册该 goal。

目标：
- 写入或确认 plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- 写入或确认 execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v39-backup-diagnostics-migration-workspace
- Baseline：v38 Provider Hub + Capability Profiles
- 版本目标：Backup / Diagnostics / Migration Workspace
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
  --from-json fixtures/contracts/goal-runbook.v39-backup-diagnostics-migration-workspace.v1.json \
  --goal v39-backup-diagnostics-migration-workspace \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v39-backup-diagnostics-migration-workspace.v1.json \
  --goal v39-backup-diagnostics-migration-workspace \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json
pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json
```


---

# task-1: App data inventory

Branch: `v39-task-1-app-data-inventory`  
Worker evidence: `docs/plans/v39-task-1-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v39-task-1-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v39-task-1-main-verification-evidence-2026-06-02.md`

## User-visible value

知道 app 到底保存了什么。

## Implementation scope

列出 registry、snapshots、job state、artifact index、settings、provider profiles、evidence refs。

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
pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json
pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json
git checkout -b v39-task-1-app-data-inventory
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v39 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v39-task-1-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v39-backup-diagnostics-migration-workspace
- Task id: task-1
- Branch: v39-task-1-app-data-inventory
- User-visible value: 知道 app 到底保存了什么。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json
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

## Main verifier prompt

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


---

# task-2: Schema version + migration runner

Branch: `v39-task-2-schema-version-migration-runner`  
Worker evidence: `docs/plans/v39-task-2-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v39-task-2-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v39-task-2-main-verification-evidence-2026-06-02.md`

## User-visible value

升级不会靠猜。

## Implementation scope

实现 schema/app data version 和 dry-run migration preview；confirm 后才写。

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
pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json
pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json
git checkout -b v39-task-2-schema-version-migration-runner
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v39 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v39-task-2-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v39-backup-diagnostics-migration-workspace
- Task id: task-2
- Branch: v39-task-2-schema-version-migration-runner
- User-visible value: 升级不会靠猜。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json
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

## Main verifier prompt

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


---

# task-3: Backup/export bundle

Branch: `v39-task-3-backup-export-bundle`  
Worker evidence: `docs/plans/v39-task-3-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v39-task-3-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v39-task-3-main-verification-evidence-2026-06-02.md`

## User-visible value

长期使用可备份。

## Implementation scope

导出 app core state manifest、hash、refs，不复制不该复制的 repo 内容。

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
pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json
pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json
git checkout -b v39-task-3-backup-export-bundle
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v39 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v39-task-3-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v39-backup-diagnostics-migration-workspace
- Task id: task-3
- Branch: v39-task-3-backup-export-bundle
- User-visible value: 长期使用可备份。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json
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

## Main verifier prompt

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


---

# task-4: Diagnostics bundle

Branch: `v39-task-4-diagnostics-bundle`  
Worker evidence: `docs/plans/v39-task-4-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v39-task-4-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v39-task-4-main-verification-evidence-2026-06-02.md`

## User-visible value

坏了能定位。

## Implementation scope

生成 sanitized diagnostics：版本、health、recent failures、gate status、logs refs。

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
pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json
pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json
git checkout -b v39-task-4-diagnostics-bundle
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v39 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v39-task-4-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v39-backup-diagnostics-migration-workspace
- Task id: task-4
- Branch: v39-task-4-diagnostics-bundle
- User-visible value: 坏了能定位。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json
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

## Main verifier prompt

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


---

# task-5: Restore validation

Branch: `v39-task-5-restore-validation`  
Worker evidence: `docs/plans/v39-task-5-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v39-task-5-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v39-task-5-main-verification-evidence-2026-06-02.md`

## User-visible value

恢复路径安全可验证。

## Implementation scope

校验 bundle 完整性和兼容性，默认不覆盖现有数据。

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
pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json
pnpm --silent symphony goal next --goal v39-backup-diagnostics-migration-workspace --json
git checkout -b v39-task-5-restore-validation
```

## Worker prompt

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

## Worker evidence prompt

```text
/goal
为 v39 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v39-task-5-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v39-backup-diagnostics-migration-workspace
- Task id: task-5
- Branch: v39-task-5-restore-validation
- User-visible value: 恢复路径安全可验证。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json
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

## Main verifier prompt

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


---

# Release closeout

Only after all tasks have approved review evidence and main-verification gates passed.

```bash
pnpm --silent symphony goal closeout --goal v39-backup-diagnostics-migration-workspace --markdown

pnpm --silent symphony goal gate \
  --goal v39-backup-diagnostics-migration-workspace \
  --gate release.ready \
  --status declared \
  --verifier codex-v39-release-manager \
  --evidence-ref docs/plans/v39-release-evidence-2026-06-02.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v39-backup-diagnostics-migration-workspace \
  --gate release.ready \
  --status declared \
  --verifier codex-v39-release-manager \
  --evidence-ref docs/plans/v39-release-evidence-2026-06-02.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Next-version handoff

After v39 release, initialize `v40-personal-workflow-router-app-core-release` using the same implementation plan and the v40 runbook.
