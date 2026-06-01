# v29 Plan + /goal Runbook: Active Task Controlled Implementation Workspace

Date: 2026-06-01  
Goal id: `v29-active-task-controlled-implementation-workspace`  
Baseline: `v28 Workbench v1 merged goal/runbook chain`  
Release name: `v29 Active Task Controlled Implementation Workspace`

## Correction note

This runbook intentionally does **not** use the old v8 command surface as the Workbench button/action baseline. The primary product surface for this version is the current goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older commands such as `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` may still exist, but they are compatibility/script commands, not the Workbench model for this version.

## Product purpose

把 active goal task 接到受控实现内核：用户从 Workbench 预览 `symphony do --write` implementation plan，确认 frozen plan 后在 isolated workspace 运行，并把结果带回 worker evidence 登记路径。

## Product spine

```text
Open active task -> check implementation eligibility -> preview controlled implementation plan -> confirm isolated workspace run -> watch operation console -> inspect result -> register worker evidence.
```

## Tasks

- task-1: Active task implementation eligibility — 用户知道当前 task 是否可以进入受控实现，而不是盲点 implementation。
- task-2: Controlled implementation plan preview — 用户能在 Workbench 里看到 frozen implementation plan 预览，而不是把自然语言任务直接交给浏览器执行。
- task-3: Confirm isolated workspace execution — 用户确认 plan hash 后能启动 isolated workspace run，main worktree 不被写入。
- task-4: Operation console and run-result bridge — 用户能看到 implementation run 的状态、输出摘要、artifact refs 和失败原因。
- task-5: Worker evidence handoff after implementation run — 实现结果能自然回到 worker evidence，不靠用户手工拼 evidence ref。

## Non-goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner, browser terminal, model invocation path, permission system, goal framework, artifact framework, or command DSL.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval, adoption readiness, main verification, or release readiness from file names, branch names, commit messages, prompt text, task titles, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge, auto-tag, auto-push, or publish unless this exact version/task explicitly says so and the release manager has explicit evidence.

## Task 0: bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md`
- Execution prompt doc: `docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v29-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v29 Task 0：为 `v29-active-task-controlled-implementation-workspace` 写/核对 plan/runbook 和 execution prompts，并用 latest goal init / goal-status 流程注册该 goal。

目标：
- 写入或确认 plan doc：docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
- 写入或确认 execution prompt doc：docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
- Goal id：v29-active-task-controlled-implementation-workspace
- Baseline：v28 Workbench v1 merged goal/runbook chain
- 版本目标：Active Task Controlled Implementation Workspace
- 任务列表必须包含本文件中 task-1 到 task-5。
- Workbench 主线必须使用 latest goal/runbook/next-action 命令面，不要回到 v8 command surface。

必须包含：
- Product purpose
- Product spine
- 每个 task 的 branch、acceptance、worker prompt、reviewer prompt、main verification prompt
- Common event registration commands：goal update、goal review、goal gate
- Release closeout commands：goal closeout、release.ready gate

禁止：
- 不实现产品代码。
- 不创建新 safety framework。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 列为 Workbench 主按钮基线。
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
  --from docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md \
  --goal v29-active-task-controlled-implementation-workspace \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md \
  --goal v29-active-task-controlled-implementation-workspace \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json
```


---

# task-1: Active task implementation eligibility

Branch: `v29-task-1-active-task-implementation-eligibility`  
Worker evidence: `docs/plans/v29-task-1-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v29-task-1-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md`

## User-visible value

用户知道当前 task 是否可以进入受控实现，而不是盲点 implementation。

## Implementation scope

建立 ActiveTaskImplementationEligibility 模型：读取 goal-status、goal next、runbook、events 和 route context，只从 explicit events 判断 task 是否可实现。

## Acceptance

- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json
git checkout -b v29-task-1-active-task-implementation-eligibility
```

## Worker prompt

```text
/goal
执行 v29 task-1 worker implementation：Active task implementation eligibility。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v29-active-task-controlled-implementation-workspace。
- 当前任务：task-1。
- 当前分支必须是：v29-task-1-active-task-implementation-eligibility。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
- docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 建立 ActiveTaskImplementationEligibility 模型：读取 goal-status、goal next、runbook、events 和 route context，只从 explicit events 判断 task 是否可实现。

边界：
- Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 不新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 command DSL。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v29-task-1-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v29 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v29-task-1-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v29-active-task-controlled-implementation-workspace
- Task id: task-1
- Branch: v29-task-1-active-task-implementation-eligibility
- User-visible value: 用户知道当前 task 是否可以进入受控实现，而不是盲点 implementation。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework/generic shell runner。
  - 不宣称 reviewer approved、main verified 或 release ready。
- Reviewer handoff checklist。
```

## Worker commit and event

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git status -sb
git add .
git commit -m "Implement v29 task-1: Active task implementation eligibility"

pnpm --silent symphony goal update \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v29-task-1-worker \
  --evidence-ref docs/plans/v29-task-1-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v29-task-1-worker \
  --evidence-ref docs/plans/v29-task-1-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v29 task-1 independent reviewer review。

目标：
- 审查当前分支 `v29-task-1-active-task-implementation-eligibility` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v29-task-1-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v29 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：用户知道当前 task 是否可以进入受控实现，而不是盲点 implementation。
- 是否围绕 latest/v20-v28 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 arbitrary path/file access。
- 是否没有从 branch、filename、commit message、prompt text、task title 或 frontend state 推断 task/release 状态。
- worker 是否没有自我审批、main verification 或 release-ready 声明。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Summary
- Evidence checked
- Commands run with exact result
- Blockers if any
- Review evidence path: docs/plans/v29-task-1-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v29-task-1-reviewer \
  --evidence-ref docs/plans/v29-task-1-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v29-task-1-reviewer \
  --evidence-ref docs/plans/v29-task-1-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v29 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v29-task-1-active-task-implementation-eligibility
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

写入：
- Main verification evidence: docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v29-main-verifier \
  --evidence-ref docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v29-main-verifier \
  --evidence-ref docs/plans/v29-task-1-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# task-2: Controlled implementation plan preview

Branch: `v29-task-2-controlled-implementation-plan-preview`  
Worker evidence: `docs/plans/v29-task-2-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v29-task-2-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v29-task-2-main-verification-evidence-2026-06-01.md`

## User-visible value

用户能在 Workbench 里看到 frozen implementation plan 预览，而不是把自然语言任务直接交给浏览器执行。

## Implementation scope

增加受控 plan preview API/UI，映射到 `symphony do --write --json` 的计划生成语义；只允许 active task 约束、worker prompt、goal/task/evidence refs 和 existing allowlist 字段。

## Acceptance

- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json
git checkout -b v29-task-2-controlled-implementation-plan-preview
```

## Worker prompt

```text
/goal
执行 v29 task-2 worker implementation：Controlled implementation plan preview。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v29-active-task-controlled-implementation-workspace。
- 当前任务：task-2。
- 当前分支必须是：v29-task-2-controlled-implementation-plan-preview。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
- docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 增加受控 plan preview API/UI，映射到 `symphony do --write --json` 的计划生成语义；只允许 active task 约束、worker prompt、goal/task/evidence refs 和 existing allowlist 字段。

边界：
- Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 不新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 command DSL。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v29-task-2-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v29 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v29-task-2-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v29-active-task-controlled-implementation-workspace
- Task id: task-2
- Branch: v29-task-2-controlled-implementation-plan-preview
- User-visible value: 用户能在 Workbench 里看到 frozen implementation plan 预览，而不是把自然语言任务直接交给浏览器执行。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework/generic shell runner。
  - 不宣称 reviewer approved、main verified 或 release ready。
- Reviewer handoff checklist。
```

## Worker commit and event

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git status -sb
git add .
git commit -m "Implement v29 task-2: Controlled implementation plan preview"

pnpm --silent symphony goal update \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v29-task-2-worker \
  --evidence-ref docs/plans/v29-task-2-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v29-task-2-worker \
  --evidence-ref docs/plans/v29-task-2-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v29 task-2 independent reviewer review。

目标：
- 审查当前分支 `v29-task-2-controlled-implementation-plan-preview` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v29-task-2-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v29 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：用户能在 Workbench 里看到 frozen implementation plan 预览，而不是把自然语言任务直接交给浏览器执行。
- 是否围绕 latest/v20-v28 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 arbitrary path/file access。
- 是否没有从 branch、filename、commit message、prompt text、task title 或 frontend state 推断 task/release 状态。
- worker 是否没有自我审批、main verification 或 release-ready 声明。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Summary
- Evidence checked
- Commands run with exact result
- Blockers if any
- Review evidence path: docs/plans/v29-task-2-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v29-task-2-reviewer \
  --evidence-ref docs/plans/v29-task-2-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v29-task-2-reviewer \
  --evidence-ref docs/plans/v29-task-2-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v29 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v29-task-2-controlled-implementation-plan-preview
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

写入：
- Main verification evidence: docs/plans/v29-task-2-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v29-main-verifier \
  --evidence-ref docs/plans/v29-task-2-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v29-main-verifier \
  --evidence-ref docs/plans/v29-task-2-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# task-3: Confirm isolated workspace execution

Branch: `v29-task-3-confirm-isolated-workspace-execution`  
Worker evidence: `docs/plans/v29-task-3-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v29-task-3-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v29-task-3-main-verification-evidence-2026-06-01.md`

## User-visible value

用户确认 plan hash 后能启动 isolated workspace run，main worktree 不被写入。

## Implementation scope

接入 existing `symphony do --confirm-plan <plan-id> --json` 语义；Workbench confirm 只接受 preview 返回的 plan id/hash 和相同 task context。

## Acceptance

- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json
git checkout -b v29-task-3-confirm-isolated-workspace-execution
```

## Worker prompt

```text
/goal
执行 v29 task-3 worker implementation：Confirm isolated workspace execution。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v29-active-task-controlled-implementation-workspace。
- 当前任务：task-3。
- 当前分支必须是：v29-task-3-confirm-isolated-workspace-execution。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
- docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 接入 existing `symphony do --confirm-plan <plan-id> --json` 语义；Workbench confirm 只接受 preview 返回的 plan id/hash 和相同 task context。

边界：
- Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 不新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 command DSL。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v29-task-3-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v29 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v29-task-3-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v29-active-task-controlled-implementation-workspace
- Task id: task-3
- Branch: v29-task-3-confirm-isolated-workspace-execution
- User-visible value: 用户确认 plan hash 后能启动 isolated workspace run，main worktree 不被写入。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework/generic shell runner。
  - 不宣称 reviewer approved、main verified 或 release ready。
- Reviewer handoff checklist。
```

## Worker commit and event

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git status -sb
git add .
git commit -m "Implement v29 task-3: Confirm isolated workspace execution"

pnpm --silent symphony goal update \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v29-task-3-worker \
  --evidence-ref docs/plans/v29-task-3-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v29-task-3-worker \
  --evidence-ref docs/plans/v29-task-3-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v29 task-3 independent reviewer review。

目标：
- 审查当前分支 `v29-task-3-confirm-isolated-workspace-execution` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v29-task-3-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v29 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：用户确认 plan hash 后能启动 isolated workspace run，main worktree 不被写入。
- 是否围绕 latest/v20-v28 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 arbitrary path/file access。
- 是否没有从 branch、filename、commit message、prompt text、task title 或 frontend state 推断 task/release 状态。
- worker 是否没有自我审批、main verification 或 release-ready 声明。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Summary
- Evidence checked
- Commands run with exact result
- Blockers if any
- Review evidence path: docs/plans/v29-task-3-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v29-task-3-reviewer \
  --evidence-ref docs/plans/v29-task-3-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v29-task-3-reviewer \
  --evidence-ref docs/plans/v29-task-3-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v29 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v29-task-3-confirm-isolated-workspace-execution
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

写入：
- Main verification evidence: docs/plans/v29-task-3-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v29-main-verifier \
  --evidence-ref docs/plans/v29-task-3-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v29-main-verifier \
  --evidence-ref docs/plans/v29-task-3-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# task-4: Operation console and run-result bridge

Branch: `v29-task-4-operation-console-and-run-result-bridge`  
Worker evidence: `docs/plans/v29-task-4-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v29-task-4-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v29-task-4-main-verification-evidence-2026-06-01.md`

## User-visible value

用户能看到 implementation run 的状态、输出摘要、artifact refs 和失败原因。

## Implementation scope

把 implementation run 写入/读取 goal operation registry，把 run result、artifact refs、verifier summary 接到 Active Goal / Operations / Implementation 路径。

## Acceptance

- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json
git checkout -b v29-task-4-operation-console-and-run-result-bridge
```

## Worker prompt

```text
/goal
执行 v29 task-4 worker implementation：Operation console and run-result bridge。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v29-active-task-controlled-implementation-workspace。
- 当前任务：task-4。
- 当前分支必须是：v29-task-4-operation-console-and-run-result-bridge。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
- docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 把 implementation run 写入/读取 goal operation registry，把 run result、artifact refs、verifier summary 接到 Active Goal / Operations / Implementation 路径。

边界：
- Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 不新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 command DSL。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v29-task-4-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v29 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v29-task-4-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v29-active-task-controlled-implementation-workspace
- Task id: task-4
- Branch: v29-task-4-operation-console-and-run-result-bridge
- User-visible value: 用户能看到 implementation run 的状态、输出摘要、artifact refs 和失败原因。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework/generic shell runner。
  - 不宣称 reviewer approved、main verified 或 release ready。
- Reviewer handoff checklist。
```

## Worker commit and event

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git status -sb
git add .
git commit -m "Implement v29 task-4: Operation console and run-result bridge"

pnpm --silent symphony goal update \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v29-task-4-worker \
  --evidence-ref docs/plans/v29-task-4-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v29-task-4-worker \
  --evidence-ref docs/plans/v29-task-4-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v29 task-4 independent reviewer review。

目标：
- 审查当前分支 `v29-task-4-operation-console-and-run-result-bridge` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v29-task-4-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v29 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：用户能看到 implementation run 的状态、输出摘要、artifact refs 和失败原因。
- 是否围绕 latest/v20-v28 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 arbitrary path/file access。
- 是否没有从 branch、filename、commit message、prompt text、task title 或 frontend state 推断 task/release 状态。
- worker 是否没有自我审批、main verification 或 release-ready 声明。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Summary
- Evidence checked
- Commands run with exact result
- Blockers if any
- Review evidence path: docs/plans/v29-task-4-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v29-task-4-reviewer \
  --evidence-ref docs/plans/v29-task-4-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v29-task-4-reviewer \
  --evidence-ref docs/plans/v29-task-4-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v29 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v29-task-4-operation-console-and-run-result-bridge
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

写入：
- Main verification evidence: docs/plans/v29-task-4-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v29-main-verifier \
  --evidence-ref docs/plans/v29-task-4-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v29-main-verifier \
  --evidence-ref docs/plans/v29-task-4-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# task-5: Worker evidence handoff after implementation run

Branch: `v29-task-5-worker-evidence-handoff-after-implementation-run`  
Worker evidence: `docs/plans/v29-task-5-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v29-task-5-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v29-task-5-main-verification-evidence-2026-06-01.md`

## User-visible value

实现结果能自然回到 worker evidence，不靠用户手工拼 evidence ref。

## Implementation scope

基于 confirmed implementation run 生成 worker evidence draft/handoff，连接 `goal update worker.evidence-recorded` dry-run + plan-hash confirm；补测试、docs、release evidence。

## Acceptance

- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
pnpm --silent symphony goal next --goal v29-active-task-controlled-implementation-workspace --json
git checkout -b v29-task-5-worker-evidence-handoff-after-implementation-run
```

## Worker prompt

```text
/goal
执行 v29 task-5 worker implementation：Worker evidence handoff after implementation run。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v29-active-task-controlled-implementation-workspace。
- 当前任务：task-5。
- 当前分支必须是：v29-task-5-worker-evidence-handoff-after-implementation-run。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v29-active-task-controlled-implementation-workspace-plan-2026-06-01.md
- docs/plans/v29-active-task-controlled-implementation-workspace-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 基于 confirmed implementation run 生成 worker evidence draft/handoff，连接 `goal update worker.evidence-recorded` dry-run + plan-hash confirm；补测试、docs、release evidence。

边界：
- Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 不新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 command DSL。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v29-task-5-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v29 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v29-task-5-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v29-active-task-controlled-implementation-workspace
- Task id: task-5
- Branch: v29-task-5-worker-evidence-handoff-after-implementation-run
- User-visible value: 实现结果能自然回到 worker evidence，不靠用户手工拼 evidence ref。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework/generic shell runner。
  - 不宣称 reviewer approved、main verified 或 release ready。
- Reviewer handoff checklist。
```

## Worker commit and event

```bash
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git status -sb
git add .
git commit -m "Implement v29 task-5: Worker evidence handoff after implementation run"

pnpm --silent symphony goal update \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v29-task-5-worker \
  --evidence-ref docs/plans/v29-task-5-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v29-task-5-worker \
  --evidence-ref docs/plans/v29-task-5-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v29 task-5 independent reviewer review。

目标：
- 审查当前分支 `v29-task-5-worker-evidence-handoff-after-implementation-run` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v29-task-5-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v29 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：实现结果能自然回到 worker evidence，不靠用户手工拼 evidence ref。
- 是否围绕 latest/v20-v28 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 arbitrary path/file access。
- 是否没有从 branch、filename、commit message、prompt text、task title 或 frontend state 推断 task/release 状态。
- worker 是否没有自我审批、main verification 或 release-ready 声明。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Summary
- Evidence checked
- Commands run with exact result
- Blockers if any
- Review evidence path: docs/plans/v29-task-5-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v29-task-5-reviewer \
  --evidence-ref docs/plans/v29-task-5-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v29-active-task-controlled-implementation-workspace \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v29-task-5-reviewer \
  --evidence-ref docs/plans/v29-task-5-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v29 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v29-task-5-worker-evidence-handoff-after-implementation-run
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

写入：
- Main verification evidence: docs/plans/v29-task-5-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v29-main-verifier \
  --evidence-ref docs/plans/v29-task-5-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v29-main-verifier \
  --evidence-ref docs/plans/v29-task-5-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# Release closeout

Release evidence: `docs/plans/v29-release-evidence-2026-06-01.md`

## Required release gates

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

## Release manager prompt

```text
/goal
执行 v29 release manager closeout。

目标：
- 确认 v29 的 5 个 task 都有 worker evidence、independent review、main verification evidence 和 main-verification gate。
- 在干净 main/ref 上运行 release validation。
- 写 release evidence：docs/plans/v29-release-evidence-2026-06-01.md
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
pnpm --silent symphony goal-status --goal v29-active-task-controlled-implementation-workspace --json

可选但推荐：
- pnpm audit --audit-level high
- pnpm mcas doctor
- pnpm test:mutation:gate

禁止：
- 不从 README、branch、tag name、file name、prompt text、frontend state 或测试文案推断 release-ready。
- 不自动创建 tag、push tag、publish release。
- 不把 v8 command surface 当作 Workbench 主入口。
```

## Release gate registration commands

```bash
pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate release.pnpm-check \
  --status passed \
  --verifier codex-v29-release-manager \
  --evidence-ref docs/plans/v29-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate release.pnpm-check \
  --status passed \
  --verifier codex-v29-release-manager \
  --evidence-ref docs/plans/v29-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate release.pnpm-test \
  --status passed \
  --verifier codex-v29-release-manager \
  --evidence-ref docs/plans/v29-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate release.pnpm-test \
  --status passed \
  --verifier codex-v29-release-manager \
  --evidence-ref docs/plans/v29-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate release.workbench-build \
  --status passed \
  --verifier codex-v29-release-manager \
  --evidence-ref docs/plans/v29-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate release.workbench-build \
  --status passed \
  --verifier codex-v29-release-manager \
  --evidence-ref docs/plans/v29-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate release.diff-check \
  --status passed \
  --verifier codex-v29-release-manager \
  --evidence-ref docs/plans/v29-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate release.diff-check \
  --status passed \
  --verifier codex-v29-release-manager \
  --evidence-ref docs/plans/v29-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate release.docs-updated \
  --status passed \
  --verifier codex-v29-release-manager \
  --evidence-ref docs/plans/v29-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate release.docs-updated \
  --status passed \
  --verifier codex-v29-release-manager \
  --evidence-ref docs/plans/v29-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Release.ready gate

```bash
pnpm --silent symphony goal closeout --goal v29-active-task-controlled-implementation-workspace --markdown

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate release.ready \
  --status declared \
  --verifier codex-v29-release-manager \
  --evidence-ref docs/plans/v29-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v29-active-task-controlled-implementation-workspace \
  --gate release.ready \
  --status declared \
  --verifier codex-v29-release-manager \
  --evidence-ref docs/plans/v29-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```
