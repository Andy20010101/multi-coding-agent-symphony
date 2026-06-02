# v33 Execution Prompts: App Runtime Foundation

Date: 2026-06-02
Goal id: `v33-app-runtime-foundation`
Baseline: `v32 Release Manager Workspace v2`

Use these prompts with `/goal`. The canonical full command flow is in:

```text
docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
```

## Task 0 bootstrap prompt

```text
/goal
执行 v33 Task 0：为 `v33-app-runtime-foundation` 注册 plan/runbook，并确认本版本开始前的 baseline 是 `v32 Release Manager Workspace v2`。

目标：
- Plan doc：docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md
- Execution prompt doc：docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md
- Runbook doc：docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
- Goal-runbook fixture：fixtures/contracts/goal-runbook.v33-app-runtime-foundation.v1.json
- Goal id：v33-app-runtime-foundation
- 版本目标：App Runtime Foundation
- v33 只做 read-only local app runtime foundation。

必须确认：
- Product purpose、Product spine、task-1 到 task-5 都在 plan/runbook 中。
- controlled goal-runbook fixture 能通过 `goal init --from-json ... --dry-run --json`。
- v33 不做 Desktop Shell、Action Registry execution、Job Queue、Provider Hub、Backup/Restore 或 Personal Workflow Router。
- Workbench 主线继续使用 latest goal/runbook/next-action 命令面。

验收：
- pnpm check
- pnpm test
- git diff --check
```

## task-1: Local sidecar skeleton and health API

### Worker prompt

```text
/goal
执行 v33 task-1 worker implementation：Local sidecar skeleton and health API。

目标：
- 当前 goal id：v33-app-runtime-foundation
- 当前任务：task-1
- 当前分支必须是：v33-task-1-local-sidecar-health-api
- 用户可见价值：用户能确认本地 app runtime 已启动，并看到 runtime/kernel 版本、进程状态和只读边界。

先读：
- docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md
- docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md
- docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints、CLI entrypoints、goal-status/goal next/goal closeout 相关实现和测试。

实现范围：
- 增加 local sidecar skeleton 或等价的 read-only runtime service entrypoint。
- 增加 health API/command，返回 runtime version、kernel version/source、process id、cwd/repo path、read-only mode、startup time、known blockers。
- health API 不能写 repo、不能改 git、不能执行 worker/reviewer/main verification/release、不能调用模型。
- 为 health contract 增加 fixture/test。

禁止：
- 不做 Desktop Shell、Action Registry execution、Job Queue、Provider Hub、Backup/Restore。
- 不新增 generic shell runner、browser terminal、模型调用、权限系统、goal framework、artifact framework 或 command DSL。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 当 Workbench 顶层模型。
- 不从 branch/file name/commit/prompt/frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json

完成后写 worker evidence：
- docs/plans/v33-task-1-worker-evidence-2026-06-02.md
```

### Reviewer prompt

```text
/goal
执行 v33 task-1 independent reviewer review：Local sidecar skeleton and health API。

目标：
- 审查当前分支 `v33-task-1-local-sidecar-health-api` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v33-task-1-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v33 plan、runbook 和本 task scope。
- reviewer 必须独立，不能只复述 worker 总结，不能因为测试通过就自动 APPROVED。

必须检查：
- health API/command 是否真实可运行并返回稳定 JSON。
- health response 是否明确 read-only mode 和 known blockers。
- 是否没有写 repo、改 git、执行 worker/reviewer/main verification/release 或调用模型。
- 是否保持 latest goal/runbook/next-action 主线。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v33-task-1-review-evidence-2026-06-02.md
```

### Main verifier prompt

```text
/goal
执行 v33 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v33-task-1-local-sidecar-health-api
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json

写 evidence：
- docs/plans/v33-task-1-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-2: Project registry and current project resolver

### Worker prompt

```text
/goal
执行 v33 task-2 worker implementation：Project registry and current project resolver。

目标：
- 当前 goal id：v33-app-runtime-foundation
- 当前任务：task-2
- 当前分支必须是：v33-task-2-project-registry-resolver
- 用户可见价值：app 能列出注册项目，并从 cwd/repo path 解析当前项目。

先读：
- docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md
- docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md
- docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 config、goal、artifact、Workbench API/CLI 入口和测试。

实现范围：
- 增加 project registry read model，字段至少包括 project_id、project_name、repo_path、default_branch、remote_url、last_goal_id、last_run_id、health_status、last_opened_at、pinned。
- 增加 current project resolver，从 cwd 或显式 repo path 解析当前 project。
- registry 在 v33 可以从 repo-local config、existing metadata 或测试 fixture 读取；不要引入必须迁移的持久数据库。
- 所有输出必须是 read-only JSON contract。

禁止：
- 不写入 project registry 数据库。
- 不自动扫描用户全盘。
- 不执行 git 写入、模型调用、worker/reviewer/main verification/release。
- 不新增权限系统或 job queue。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json

完成后写 worker evidence：
- docs/plans/v33-task-2-worker-evidence-2026-06-02.md
```

### Reviewer prompt

```text
/goal
执行 v33 task-2 independent reviewer review：Project registry and current project resolver。

目标：
- 审查当前分支 `v33-task-2-project-registry-resolver` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v33-task-2-worker-evidence-2026-06-02.md。
- 判断 project registry/current project resolver 是否满足 v33 scope。

必须检查：
- registry 字段是否稳定、可测试、可被 UI/CLI 消费。
- current project resolver 是否处理 repo path/cwd、不存在路径、非 git repo、缺失 metadata。
- v33 是否保持 read-only，不创建数据库迁移或写入项目注册表。
- 状态是否来自 explicit config/metadata/command output，不从文件名或前端状态推断。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v33-task-2-review-evidence-2026-06-02.md
```

### Main verifier prompt

```text
/goal
执行 v33 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- 当前必须是干净 main，且能 ff-only merge。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v33-task-2-project-registry-resolver
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json

写 evidence：
- docs/plans/v33-task-2-main-verification-evidence-2026-06-02.md
```

## task-3: Goal and release state snapshot API

### Worker prompt

```text
/goal
执行 v33 task-3 worker implementation：Goal and release state snapshot API。

目标：
- 当前 goal id：v33-app-runtime-foundation
- 当前任务：task-3
- 当前分支必须是：v33-task-3-goal-release-state-snapshot
- 用户可见价值：app 能读取当前 project 的 active goal、next action、verification 和 release 状态。

先读：
- docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md
- docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md
- docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- goal-status、goal next、goal closeout、goal event/gate registry、Workbench state API 和相关测试。

实现范围：
- 增加 app state snapshot API/command。
- snapshot 至少包含 current_project、runtime_health、active_goal、current_task、next_action、review_status、main_verification_status、release_status、evidence_refs、known_blockers。
- snapshot 必须从现有 goal/runbook/event/gate/release 数据读取。
- 缺少 goal 或 release 状态时返回明确 null/blocker，不推断、不补写。

禁止：
- 不执行 goal update/review/gate/closeout confirm。
- 不创建 action registry。
- 不创建 job queue。
- 不调用模型或 shell runner。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json

完成后写 worker evidence：
- docs/plans/v33-task-3-worker-evidence-2026-06-02.md
```

### Reviewer prompt

```text
/goal
执行 v33 task-3 independent reviewer review：Goal and release state snapshot API。

目标：
- 审查当前分支 `v33-task-3-goal-release-state-snapshot` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v33-task-3-worker-evidence-2026-06-02.md。
- 判断 snapshot 是否只读、字段稳定、来源明确。

必须检查：
- snapshot 是否包含 current_project、runtime_health、active_goal、current_task、next_action、review_status、main_verification_status、release_status、evidence_refs、known_blockers。
- 状态来源是否为现有 goal/runbook/event/gate/release 数据。
- 缺数据时是否返回 null/blocker，而不是从文件名、分支名、prompt 或 UI 推断。
- 是否没有执行 confirm、写入事件、调用模型或启动 job。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v33-task-3-review-evidence-2026-06-02.md
```

### Main verifier prompt

```text
/goal
执行 v33 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- 当前必须是干净 main，且能 ff-only merge。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v33-task-3-goal-release-state-snapshot
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json

写 evidence：
- docs/plans/v33-task-3-main-verification-evidence-2026-06-02.md
```

## task-4: App runtime contract, fixtures, and read-only Workbench surface

### Worker prompt

```text
/goal
执行 v33 task-4 worker implementation：App runtime contract, fixtures, and read-only Workbench surface。

目标：
- 当前 goal id：v33-app-runtime-foundation
- 当前任务：task-4
- 当前分支必须是：v33-task-4-runtime-contract-workbench-surface
- 用户可见价值：UI/CLI 消费同一份 app state schema，用户能在 Workbench 看到 runtime health、current project、active goal、next action 和 release state。

先读：
- docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md
- docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md
- docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench route contracts, frontend/backend API fixtures, app state tests。

实现范围：
- 定义 app runtime snapshot contract 和 fixtures。
- Workbench 增加只读 runtime surface 或现有页面区块，显示 health/current project/active goal/next action/release state/known blockers。
- UI 只调用 app runtime read API，不直接执行 shell 命令。
- loading、empty、blocked、healthy、stale states 都要可测试。

禁止：
- 不增加执行按钮。
- 不触发 action、job、model、git、release、open local file 或 artifact download。
- 不把 v8 compatibility commands 做成顶层按钮。
- 不用前端状态推断 approval/verification/release readiness。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json

完成后写 worker evidence：
- docs/plans/v33-task-4-worker-evidence-2026-06-02.md
```

### Reviewer prompt

```text
/goal
执行 v33 task-4 independent reviewer review：App runtime contract, fixtures, and read-only Workbench surface。

目标：
- 审查当前分支 `v33-task-4-runtime-contract-workbench-surface` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v33-task-4-worker-evidence-2026-06-02.md。
- 判断 UI/CLI 是否消费同一 app state contract，且 Workbench surface 保持只读。

必须检查：
- contract/fixtures 是否覆盖 healthy、missing project、missing goal、blocked、stale。
- UI 是否显示 runtime health、current project、active goal、next action、release state、known blockers。
- UI 是否没有执行按钮、shell runner、model invocation、git/release writes、local file open/download。
- 是否没有从前端状态推断 approval/main verification/release readiness。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v33-task-4-review-evidence-2026-06-02.md
```

### Main verifier prompt

```text
/goal
执行 v33 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- 当前必须是干净 main，且能 ff-only merge。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v33-task-4-runtime-contract-workbench-surface
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json

写 evidence：
- docs/plans/v33-task-4-main-verification-evidence-2026-06-02.md
```

## task-5: Runtime operator guide and v34 handoff

### Worker prompt

```text
/goal
执行 v33 task-5 worker implementation：Runtime operator guide and v34 handoff。

目标：
- 当前 goal id：v33-app-runtime-foundation
- 当前任务：task-5
- 当前分支必须是：v33-task-5-runtime-guide-v34-handoff
- 用户可见价值：用户知道如何启动、验证、恢复 v33 runtime，并能直接进入 v34 Action Registry 设计。

先读：
- docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md
- docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md
- docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 已实现的 v33 sidecar/registry/snapshot/Workbench runtime surface。

实现范围：
- 更新 operator guide 或新增 runtime guide，写清楚启动、health check、project registry、snapshot、known blockers、故障恢复。
- 写 v34 Action Registry handoff，包含 action manifest fields、permission preview fields、available actions API shape、candidate actions、v34 禁止执行边界。
- release evidence 能引用 v33 runtime validation 和 v34 handoff。

禁止：
- 不实现 Action Registry。
- 不实现 Job Queue。
- 不接入模型、provider、secret storage、desktop shell、backup/migration。
- 不自动创建 v34 goal。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json

完成后写 worker evidence：
- docs/plans/v33-task-5-worker-evidence-2026-06-02.md
```

### Reviewer prompt

```text
/goal
执行 v33 task-5 independent reviewer review：Runtime operator guide and v34 handoff。

目标：
- 审查当前分支 `v33-task-5-runtime-guide-v34-handoff` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v33-task-5-worker-evidence-2026-06-02.md。
- 判断 guide/handoff 是否能让用户运行 v33，并能启动 v34 Action Registry。

必须检查：
- guide 是否有实际命令、状态说明、failure recovery、known blockers。
- v34 handoff 是否列出 action manifest fields、permission preview fields、available actions API shape、candidate actions。
- v34 handoff 是否明确 Action Registry 只声明 action availability，不执行 job。
- 是否没有自动创建 v34 goal 或实现 v34 代码。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v33-task-5-review-evidence-2026-06-02.md
```

### Main verifier prompt

```text
/goal
执行 v33 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- 当前必须是干净 main，且能 ff-only merge。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v33-task-5-runtime-guide-v34-handoff
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json
- pnpm --silent symphony goal closeout --goal v33-app-runtime-foundation --markdown

写 evidence：
- docs/plans/v33-task-5-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready，除非 release manager 已完成所有 release gates。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Common registration commands

Worker evidence registration:

```bash
pnpm --silent symphony goal update \
  --goal v33-app-runtime-foundation \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor <worker-id> \
  --evidence-ref <worker-evidence-ref> \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v33-app-runtime-foundation \
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
  --goal v33-app-runtime-foundation \
  --task <task-id> \
  --verdict approved \
  --reviewer <reviewer-id> \
  --evidence-ref <review-evidence-ref> \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v33-app-runtime-foundation \
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
  --goal v33-app-runtime-foundation \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier <main-verifier-id> \
  --evidence-ref <main-verification-evidence-ref> \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v33-app-runtime-foundation \
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
执行 v33 release manager closeout。

目标：
- 确认 v33 的 5 个 task 都有 worker evidence、independent review、main verification evidence 和 main-verification gate。
- 在干净 main/ref 上运行 release validation。
- 写 release evidence：docs/plans/v33-release-evidence-2026-06-02.md
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
- pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json
- pnpm --silent symphony goal closeout --goal v33-app-runtime-foundation --markdown

必须记录：
- release evidence path：docs/plans/v33-release-evidence-2026-06-02.md
- runtime health/snapshot validation command and result, if v33 added one.
- v34 handoff path and summary.

禁止：
- 不创建 tag。
- 不自动 push。
- 不自动创建 v34 goal。
```
