# v32 Plan + /goal Runbook: Release Manager Workspace v2

Date: 2026-06-01  
Goal id: `v32-release-manager-workspace-v2`  
Baseline: `v31 main verification runner + evidence writer`  
Release name: `v32 Release Manager Workspace v2`

## Correction note

This runbook intentionally does **not** use the old v8 command surface as the Workbench button/action baseline. The primary product surface for this version is the current goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older commands such as `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` may still exist, but they are compatibility/script commands, not the Workbench model for this version.

## Product purpose

把 release manager 收口做成 Workbench v2 能力：在干净 main/ref 上解析 release baseline，运行/记录 release gates，生成 release/tag evidence，并通过受控 `release.ready` gate 完成版本闭环。

## Product spine

```text
All tasks main-verified -> clean main/ref baseline -> release checklist -> record gates -> write release/tag evidence -> declare release.ready -> next-version handoff.
```

## Tasks

- task-1: Clean release baseline resolver — release manager 不再在 dirty fallback checkout 上做最终判断。
- task-2: Release gate checklist recorder — release gates 的结果能在 Workbench 里逐项记录，不靠 closeout 文案推断。
- task-3: Release and tag evidence workspace — tag evidence 有明确 ref、commit、命令结果和边界，不自动打 tag。
- task-4: Release.ready closeout confirm — 所有 release gates passed 后，用户能受控声明 `release.ready`。
- task-5: Next-version handoff generator — v32 结束后能自然生成 v33 起步上下文，不重新读散乱历史。

## Non-goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner, browser terminal, model invocation path, permission system, goal framework, artifact framework, or command DSL.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval, adoption readiness, main verification, or release readiness from file names, branch names, commit messages, prompt text, task titles, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge, auto-tag, auto-push, or publish unless this exact version/task explicitly says so and the release manager has explicit evidence.

## Task 0: bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md`
- Execution prompt doc: `docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v32-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v32 Task 0：为 `v32-release-manager-workspace-v2` 写/核对 plan/runbook 和 execution prompts，并用 latest goal init / goal-status 流程注册该 goal。

目标：
- 写入或确认 plan doc：docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md
- 写入或确认 execution prompt doc：docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
- Goal id：v32-release-manager-workspace-v2
- Baseline：v31 main verification runner + evidence writer
- 版本目标：Release Manager Workspace v2
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
  --from docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md \
  --goal v32-release-manager-workspace-v2 \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md \
  --goal v32-release-manager-workspace-v2 \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json
```


---

# task-1: Clean release baseline resolver

Branch: `v32-task-1-clean-release-baseline-resolver`  
Worker evidence: `docs/plans/v32-task-1-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v32-task-1-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v32-task-1-main-verification-evidence-2026-06-01.md`

## User-visible value

release manager 不再在 dirty fallback checkout 上做最终判断。

## Implementation scope

建立 release baseline resolver：显示 current branch、main HEAD、origin/main、worktree cleanliness、PR/CI ref；dirty 或非 main 状态时只给 stop/fix guidance。

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
pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json
git checkout -b v32-task-1-clean-release-baseline-resolver
```

## Worker prompt

```text
/goal
执行 v32 task-1 worker implementation：Clean release baseline resolver。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v32-release-manager-workspace-v2。
- 当前任务：task-1。
- 当前分支必须是：v32-task-1-clean-release-baseline-resolver。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md
- docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 建立 release baseline resolver：显示 current branch、main HEAD、origin/main、worktree cleanliness、PR/CI ref；dirty 或非 main 状态时只给 stop/fix guidance。

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
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v32-task-1-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v32 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v32-task-1-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v32-release-manager-workspace-v2
- Task id: task-1
- Branch: v32-task-1-clean-release-baseline-resolver
- User-visible value: release manager 不再在 dirty fallback checkout 上做最终判断。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
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
git commit -m "Implement v32 task-1: Clean release baseline resolver"

pnpm --silent symphony goal update \
  --goal v32-release-manager-workspace-v2 \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v32-task-1-worker \
  --evidence-ref docs/plans/v32-task-1-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v32-release-manager-workspace-v2 \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v32-task-1-worker \
  --evidence-ref docs/plans/v32-task-1-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v32 task-1 independent reviewer review。

目标：
- 审查当前分支 `v32-task-1-clean-release-baseline-resolver` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v32-task-1-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v32 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：release manager 不再在 dirty fallback checkout 上做最终判断。
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
- Review evidence path: docs/plans/v32-task-1-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v32-release-manager-workspace-v2 \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v32-task-1-reviewer \
  --evidence-ref docs/plans/v32-task-1-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v32-release-manager-workspace-v2 \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v32-task-1-reviewer \
  --evidence-ref docs/plans/v32-task-1-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v32 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v32-task-1-clean-release-baseline-resolver
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

写入：
- Main verification evidence: docs/plans/v32-task-1-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v32-main-verifier \
  --evidence-ref docs/plans/v32-task-1-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v32-main-verifier \
  --evidence-ref docs/plans/v32-task-1-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# task-2: Release gate checklist recorder

Branch: `v32-task-2-release-gate-checklist-recorder`  
Worker evidence: `docs/plans/v32-task-2-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v32-task-2-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v32-task-2-main-verification-evidence-2026-06-01.md`

## User-visible value

release gates 的结果能在 Workbench 里逐项记录，不靠 closeout 文案推断。

## Implementation scope

把 `pnpm check/test/workbench:build/test:mutation:gate/audit/mcas doctor/diff/docsUpdated` 作为 release gate checklist；支持 evidence refs 和 explicit goal gate preview/confirm。

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
pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json
git checkout -b v32-task-2-release-gate-checklist-recorder
```

## Worker prompt

```text
/goal
执行 v32 task-2 worker implementation：Release gate checklist recorder。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v32-release-manager-workspace-v2。
- 当前任务：task-2。
- 当前分支必须是：v32-task-2-release-gate-checklist-recorder。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md
- docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 把 `pnpm check/test/workbench:build/test:mutation:gate/audit/mcas doctor/diff/docsUpdated` 作为 release gate checklist；支持 evidence refs 和 explicit goal gate preview/confirm。

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
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v32-task-2-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v32 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v32-task-2-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v32-release-manager-workspace-v2
- Task id: task-2
- Branch: v32-task-2-release-gate-checklist-recorder
- User-visible value: release gates 的结果能在 Workbench 里逐项记录，不靠 closeout 文案推断。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
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
git commit -m "Implement v32 task-2: Release gate checklist recorder"

pnpm --silent symphony goal update \
  --goal v32-release-manager-workspace-v2 \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v32-task-2-worker \
  --evidence-ref docs/plans/v32-task-2-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v32-release-manager-workspace-v2 \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v32-task-2-worker \
  --evidence-ref docs/plans/v32-task-2-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v32 task-2 independent reviewer review。

目标：
- 审查当前分支 `v32-task-2-release-gate-checklist-recorder` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v32-task-2-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v32 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：release gates 的结果能在 Workbench 里逐项记录，不靠 closeout 文案推断。
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
- Review evidence path: docs/plans/v32-task-2-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v32-release-manager-workspace-v2 \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v32-task-2-reviewer \
  --evidence-ref docs/plans/v32-task-2-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v32-release-manager-workspace-v2 \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v32-task-2-reviewer \
  --evidence-ref docs/plans/v32-task-2-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v32 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v32-task-2-release-gate-checklist-recorder
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

写入：
- Main verification evidence: docs/plans/v32-task-2-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v32-main-verifier \
  --evidence-ref docs/plans/v32-task-2-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v32-main-verifier \
  --evidence-ref docs/plans/v32-task-2-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# task-3: Release and tag evidence workspace

Branch: `v32-task-3-release-and-tag-evidence-workspace`  
Worker evidence: `docs/plans/v32-task-3-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v32-task-3-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v32-task-3-main-verification-evidence-2026-06-01.md`

## User-visible value

tag evidence 有明确 ref、commit、命令结果和边界，不自动打 tag。

## Implementation scope

生成 release evidence 和 tag evidence draft；显示 tag recommendation、target commit、release notes summary；copy-only tag command，不执行 tag/push/publish。

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
pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json
git checkout -b v32-task-3-release-and-tag-evidence-workspace
```

## Worker prompt

```text
/goal
执行 v32 task-3 worker implementation：Release and tag evidence workspace。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v32-release-manager-workspace-v2。
- 当前任务：task-3。
- 当前分支必须是：v32-task-3-release-and-tag-evidence-workspace。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md
- docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 生成 release evidence 和 tag evidence draft；显示 tag recommendation、target commit、release notes summary；copy-only tag command，不执行 tag/push/publish。

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
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v32-task-3-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v32 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v32-task-3-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v32-release-manager-workspace-v2
- Task id: task-3
- Branch: v32-task-3-release-and-tag-evidence-workspace
- User-visible value: tag evidence 有明确 ref、commit、命令结果和边界，不自动打 tag。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
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
git commit -m "Implement v32 task-3: Release and tag evidence workspace"

pnpm --silent symphony goal update \
  --goal v32-release-manager-workspace-v2 \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v32-task-3-worker \
  --evidence-ref docs/plans/v32-task-3-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v32-release-manager-workspace-v2 \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v32-task-3-worker \
  --evidence-ref docs/plans/v32-task-3-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v32 task-3 independent reviewer review。

目标：
- 审查当前分支 `v32-task-3-release-and-tag-evidence-workspace` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v32-task-3-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v32 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：tag evidence 有明确 ref、commit、命令结果和边界，不自动打 tag。
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
- Review evidence path: docs/plans/v32-task-3-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v32-release-manager-workspace-v2 \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v32-task-3-reviewer \
  --evidence-ref docs/plans/v32-task-3-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v32-release-manager-workspace-v2 \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v32-task-3-reviewer \
  --evidence-ref docs/plans/v32-task-3-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v32 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v32-task-3-release-and-tag-evidence-workspace
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

写入：
- Main verification evidence: docs/plans/v32-task-3-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v32-main-verifier \
  --evidence-ref docs/plans/v32-task-3-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v32-main-verifier \
  --evidence-ref docs/plans/v32-task-3-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# task-4: Release.ready closeout confirm

Branch: `v32-task-4-release-ready-closeout-confirm`  
Worker evidence: `docs/plans/v32-task-4-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v32-task-4-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v32-task-4-main-verification-evidence-2026-06-01.md`

## User-visible value

所有 release gates passed 后，用户能受控声明 `release.ready`。

## Implementation scope

接入 `goal gate --gate release.ready --status declared` dry-run + plan-hash confirm；confirm 后 closeout 必须无缺口。

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
pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json
git checkout -b v32-task-4-release-ready-closeout-confirm
```

## Worker prompt

```text
/goal
执行 v32 task-4 worker implementation：Release.ready closeout confirm。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v32-release-manager-workspace-v2。
- 当前任务：task-4。
- 当前分支必须是：v32-task-4-release-ready-closeout-confirm。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md
- docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 接入 `goal gate --gate release.ready --status declared` dry-run + plan-hash confirm；confirm 后 closeout 必须无缺口。

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
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v32-task-4-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v32 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v32-task-4-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v32-release-manager-workspace-v2
- Task id: task-4
- Branch: v32-task-4-release-ready-closeout-confirm
- User-visible value: 所有 release gates passed 后，用户能受控声明 `release.ready`。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
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
git commit -m "Implement v32 task-4: Release.ready closeout confirm"

pnpm --silent symphony goal update \
  --goal v32-release-manager-workspace-v2 \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v32-task-4-worker \
  --evidence-ref docs/plans/v32-task-4-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v32-release-manager-workspace-v2 \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v32-task-4-worker \
  --evidence-ref docs/plans/v32-task-4-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v32 task-4 independent reviewer review。

目标：
- 审查当前分支 `v32-task-4-release-ready-closeout-confirm` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v32-task-4-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v32 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：所有 release gates passed 后，用户能受控声明 `release.ready`。
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
- Review evidence path: docs/plans/v32-task-4-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v32-release-manager-workspace-v2 \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v32-task-4-reviewer \
  --evidence-ref docs/plans/v32-task-4-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v32-release-manager-workspace-v2 \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v32-task-4-reviewer \
  --evidence-ref docs/plans/v32-task-4-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v32 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v32-task-4-release-ready-closeout-confirm
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

写入：
- Main verification evidence: docs/plans/v32-task-4-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v32-main-verifier \
  --evidence-ref docs/plans/v32-task-4-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v32-main-verifier \
  --evidence-ref docs/plans/v32-task-4-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# task-5: Next-version handoff generator

Branch: `v32-task-5-next-version-handoff-generator`  
Worker evidence: `docs/plans/v32-task-5-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v32-task-5-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v32-task-5-main-verification-evidence-2026-06-01.md`

## User-visible value

v32 结束后能自然生成 v33 起步上下文，不重新读散乱历史。

## Implementation scope

根据 final closeout、release evidence、operator guide 和 implemented capabilities 生成 next-version handoff draft；不自动创建新 goal，不自动进入 v33。

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
pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json
git checkout -b v32-task-5-next-version-handoff-generator
```

## Worker prompt

```text
/goal
执行 v32 task-5 worker implementation：Next-version handoff generator。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v32-release-manager-workspace-v2。
- 当前任务：task-5。
- 当前分支必须是：v32-task-5-next-version-handoff-generator。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md
- docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 根据 final closeout、release evidence、operator guide 和 implemented capabilities 生成 next-version handoff draft；不自动创建新 goal，不自动进入 v33。

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
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v32-task-5-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v32 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v32-task-5-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v32-release-manager-workspace-v2
- Task id: task-5
- Branch: v32-task-5-next-version-handoff-generator
- User-visible value: v32 结束后能自然生成 v33 起步上下文，不重新读散乱历史。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
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
git commit -m "Implement v32 task-5: Next-version handoff generator"

pnpm --silent symphony goal update \
  --goal v32-release-manager-workspace-v2 \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v32-task-5-worker \
  --evidence-ref docs/plans/v32-task-5-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v32-release-manager-workspace-v2 \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v32-task-5-worker \
  --evidence-ref docs/plans/v32-task-5-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v32 task-5 independent reviewer review。

目标：
- 审查当前分支 `v32-task-5-next-version-handoff-generator` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v32-task-5-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v32 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：v32 结束后能自然生成 v33 起步上下文，不重新读散乱历史。
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
- Review evidence path: docs/plans/v32-task-5-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v32-release-manager-workspace-v2 \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v32-task-5-reviewer \
  --evidence-ref docs/plans/v32-task-5-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v32-release-manager-workspace-v2 \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v32-task-5-reviewer \
  --evidence-ref docs/plans/v32-task-5-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v32 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v32-task-5-next-version-handoff-generator
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

写入：
- Main verification evidence: docs/plans/v32-task-5-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v32-main-verifier \
  --evidence-ref docs/plans/v32-task-5-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v32-main-verifier \
  --evidence-ref docs/plans/v32-task-5-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# Release closeout

Release evidence: `docs/plans/v32-release-evidence-2026-06-01.md`

## Required release gates

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.mutation-gate`
- `release.audit-high`
- `release.diff-check`
- `release.mcas-doctor`
- `release.docs-updated`
- `release.tag-evidence`

## Release manager prompt

```text
/goal
执行 v32 release manager closeout。

目标：
- 确认 v32 的 5 个 task 都有 worker evidence、independent review、main verification evidence 和 main-verification gate。
- 在干净 main/ref 上运行 release validation。
- 写 release evidence：docs/plans/v32-release-evidence-2026-06-01.md
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
pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json

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
  --goal v32-release-manager-workspace-v2 \
  --gate release.pnpm-check \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.pnpm-check \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.pnpm-test \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.pnpm-test \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.workbench-build \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.workbench-build \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.mutation-gate \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.mutation-gate \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.audit-high \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.audit-high \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.diff-check \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.diff-check \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.mcas-doctor \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.mcas-doctor \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.docs-updated \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.docs-updated \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.tag-evidence \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.tag-evidence \
  --status passed \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Release.ready gate

```bash
pnpm --silent symphony goal closeout --goal v32-release-manager-workspace-v2 --markdown

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.ready \
  --status declared \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v32-release-manager-workspace-v2 \
  --gate release.ready \
  --status declared \
  --verifier codex-v32-release-manager \
  --evidence-ref docs/plans/v32-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```
