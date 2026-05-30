# v28 Plan + /goal Runbook: Workbench v1 Release

Date: 2026-05-29  
Goal id: `v28-workbench-v1-release`  
Baseline: `v27 review revision loop`  
Release name: `v28 Workbench v1 Release`

## Correction note

This runbook intentionally does **not** use the old v8 command surface as the Workbench button/action baseline. The primary product surface for this version is the latest goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older commands such as `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` may still exist, but they are not the main Workbench model for this version.

## Product purpose

把 v20-v27 收束成真正的 Workbench v1：一个围绕最新 goal/runbook/next-action 的本地操作台，而不是只读 dashboard。

## Product spine

```text
Open Workbench -> active goal -> prompt handoff -> event registration -> controlled implementation/adoption -> review/revision -> main verification -> closeout/release.
```

## Tasks

- task-1: Workbench app navigation and state header — 用户一打开就是工作台，而不是信息面板集合。
- task-2: Unified goal/task/run/evidence routes — 用户在各模块之间不会丢上下文。
- task-3: Golden path E2E — Workbench v1 有可验收的主路径。
- task-4: Release closeout workspace — release 前能在 Workbench 里看到明确缺口和收口动作。
- task-5: README/operator guide/release evidence — 项目定位正式从 dashboard 变成 Workbench。

## Non-goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval or release readiness from file names, branch names, commit messages, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge or auto-tag unless this exact version/task explicitly says so.

## Task 0: bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v28-workbench-v1-release-plan-2026-05-29.md`
- Execution prompt doc: `docs/plans/v28-workbench-v1-release-execution-prompts-2026-05-29.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v28-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v28 Task 0：为 `v28-workbench-v1-release` 写 plan/runbook 和 execution prompts，并用最新 v19 goal init / goal-status 流程注册该 goal。

目标：
- 写入 plan doc：docs/plans/v28-workbench-v1-release-plan-2026-05-29.md
- 写入 execution prompt doc：docs/plans/v28-workbench-v1-release-execution-prompts-2026-05-29.md
- Goal id：v28-workbench-v1-release
- Baseline：v27 review revision loop
- 版本目标：Workbench v1 Release
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

After committing Task 0 docs, register the goal. If your local v19 CLI spelling differs, run `pnpm symphony goal --help` and preserve the dry-run then confirm pattern.

```bash
pnpm --silent symphony goal init \
  --from docs/plans/v28-workbench-v1-release-plan-2026-05-29.md \
  --goal v28-workbench-v1-release \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v28-workbench-v1-release-plan-2026-05-29.md \
  --goal v28-workbench-v1-release \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
pnpm --silent symphony goal next --goal v28-workbench-v1-release --json
```


---

# task-1: Workbench app navigation and state header

Branch: `v28-task-1-workbench-app-navigation-and-state-header`  
Worker evidence: `docs/plans/v28-task-1-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v28-task-1-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v28-task-1-main-verification-evidence-2026-05-29.md`

## User-visible value

用户一打开就是工作台，而不是信息面板集合。

## Implementation scope

统一导航：Active Goal、Prompt Handoff、Operations、Implementation、Adoption、Review、Verification、Closeout。顶部显示 goal/task/next action/latest operation。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
pnpm --silent symphony goal next --goal v28-workbench-v1-release --json
git checkout -b v28-task-1-workbench-app-navigation-and-state-header
```

## Worker prompt

```text
/goal
执行 v28 task-1 worker implementation：Workbench app navigation and state header。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v28-workbench-v1-release。
- 当前任务：task-1。
- 当前分支必须是：v28-task-1-workbench-app-navigation-and-state-header。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v28-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v28-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 统一导航：Active Goal、Prompt Handoff、Operations、Implementation、Adoption、Review、Verification、Closeout。顶部显示 goal/task/next action/latest operation。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v28-task-1-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v28 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v28-task-1-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v28-workbench-v1-release
- Task id: task-1
- Branch: v28-task-1-workbench-app-navigation-and-state-header
- User-visible value: 用户一打开就是工作台，而不是信息面板集合。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework。
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
git commit -m "Implement v28 task-1: Workbench app navigation and state header"

pnpm --silent symphony goal update \
  --goal v28-workbench-v1-release \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v28-task-1-worker \
  --evidence-ref docs/plans/v28-task-1-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v28-workbench-v1-release \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v28-task-1-worker \
  --evidence-ref docs/plans/v28-task-1-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v28 task-1 independent reviewer review。

目标：
- 审查当前分支 `v28-task-1-workbench-app-navigation-and-state-header` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v28-task-1-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v28 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户一打开就是工作台，而不是信息面板集合。
- 是否围绕 latest/v19 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增安全框架、权限系统、goal framework、artifact framework。
- 是否没有让前端根据文件名/分支名/路径推断 task 状态。
- Tests 是否覆盖用户路径，而不只是底层函数。

必须运行：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出要求：
- 写入 review evidence：docs/plans/v28-task-1-review-evidence-2026-05-29.md
- 返回 Verdict: APPROVED 或 NEEDS_REVISION
- 返回 reviewed files
- 返回 commands run with exact results
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项
- 如果 APPROVED，说明批准范围，不要宣称 main verified 或 release ready
```

## Reviewer event

If approved:

```bash
pnpm --silent symphony goal review \
  --goal v28-workbench-v1-release \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v28-task-1-reviewer \
  --evidence-ref docs/plans/v28-task-1-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v28-workbench-v1-release \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v28-task-1-reviewer \
  --evidence-ref docs/plans/v28-task-1-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v28 task-1 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-1.
- Review evidence: docs/plans/v28-task-1-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v28-task-1-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v28 task-1 main verification。

前提：
- v28-task-1-workbench-app-navigation-and-state-header 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v28-task-1-workbench-app-navigation-and-state-header
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
- 写入 main verification evidence：docs/plans/v28-task-1-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v28-workbench-v1-release
- Task id: task-1
- Branch: v28-task-1-workbench-app-navigation-and-state-header
- Main commit
- Merge mode
- Commands run with exact results
- 是否 main verification passed
- 不宣称 release ready

完成后返回：
- Summary
- Main commit
- Evidence path
- 下一步应登记 main-verification gate
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v28-workbench-v1-release \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v28-main-verifier \
  --evidence-ref docs/plans/v28-task-1-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v28-workbench-v1-release \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v28-main-verifier \
  --evidence-ref docs/plans/v28-task-1-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v28-workbench-v1-release --json
```


---

# task-2: Unified goal/task/run/evidence routes

Branch: `v28-task-2-unified-goal-task-run-evidence-routes`  
Worker evidence: `docs/plans/v28-task-2-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v28-task-2-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v28-task-2-main-verification-evidence-2026-05-29.md`

## User-visible value

用户在各模块之间不会丢上下文。

## Implementation scope

统一路由和数据流，所有页面都以 goal id、task id、operation id、evidence refs 串联。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
pnpm --silent symphony goal next --goal v28-workbench-v1-release --json
git checkout -b v28-task-2-unified-goal-task-run-evidence-routes
```

## Worker prompt

```text
/goal
执行 v28 task-2 worker implementation：Unified goal/task/run/evidence routes。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v28-workbench-v1-release。
- 当前任务：task-2。
- 当前分支必须是：v28-task-2-unified-goal-task-run-evidence-routes。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v28-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v28-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 统一路由和数据流，所有页面都以 goal id、task id、operation id、evidence refs 串联。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v28-task-2-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v28 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v28-task-2-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v28-workbench-v1-release
- Task id: task-2
- Branch: v28-task-2-unified-goal-task-run-evidence-routes
- User-visible value: 用户在各模块之间不会丢上下文。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework。
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
git commit -m "Implement v28 task-2: Unified goal/task/run/evidence routes"

pnpm --silent symphony goal update \
  --goal v28-workbench-v1-release \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v28-task-2-worker \
  --evidence-ref docs/plans/v28-task-2-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v28-workbench-v1-release \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v28-task-2-worker \
  --evidence-ref docs/plans/v28-task-2-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v28 task-2 independent reviewer review。

目标：
- 审查当前分支 `v28-task-2-unified-goal-task-run-evidence-routes` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v28-task-2-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v28 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户在各模块之间不会丢上下文。
- 是否围绕 latest/v19 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增安全框架、权限系统、goal framework、artifact framework。
- 是否没有让前端根据文件名/分支名/路径推断 task 状态。
- Tests 是否覆盖用户路径，而不只是底层函数。

必须运行：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出要求：
- 写入 review evidence：docs/plans/v28-task-2-review-evidence-2026-05-29.md
- 返回 Verdict: APPROVED 或 NEEDS_REVISION
- 返回 reviewed files
- 返回 commands run with exact results
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项
- 如果 APPROVED，说明批准范围，不要宣称 main verified 或 release ready
```

## Reviewer event

If approved:

```bash
pnpm --silent symphony goal review \
  --goal v28-workbench-v1-release \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v28-task-2-reviewer \
  --evidence-ref docs/plans/v28-task-2-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v28-workbench-v1-release \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v28-task-2-reviewer \
  --evidence-ref docs/plans/v28-task-2-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v28 task-2 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-2.
- Review evidence: docs/plans/v28-task-2-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v28-task-2-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v28 task-2 main verification。

前提：
- v28-task-2-unified-goal-task-run-evidence-routes 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v28-task-2-unified-goal-task-run-evidence-routes
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
- 写入 main verification evidence：docs/plans/v28-task-2-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v28-workbench-v1-release
- Task id: task-2
- Branch: v28-task-2-unified-goal-task-run-evidence-routes
- Main commit
- Merge mode
- Commands run with exact results
- 是否 main verification passed
- 不宣称 release ready

完成后返回：
- Summary
- Main commit
- Evidence path
- 下一步应登记 main-verification gate
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v28-workbench-v1-release \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v28-main-verifier \
  --evidence-ref docs/plans/v28-task-2-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v28-workbench-v1-release \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v28-main-verifier \
  --evidence-ref docs/plans/v28-task-2-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v28-workbench-v1-release --json
```


---

# task-3: Golden path E2E

Branch: `v28-task-3-golden-path-e2e`  
Worker evidence: `docs/plans/v28-task-3-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v28-task-3-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v28-task-3-main-verification-evidence-2026-05-29.md`

## User-visible value

Workbench v1 有可验收的主路径。

## Implementation scope

实现并测试完整路径：goal init/status -> next -> prompt -> worker event -> review -> main verification -> closeout gaps。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
pnpm --silent symphony goal next --goal v28-workbench-v1-release --json
git checkout -b v28-task-3-golden-path-e2e
```

## Worker prompt

```text
/goal
执行 v28 task-3 worker implementation：Golden path E2E。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v28-workbench-v1-release。
- 当前任务：task-3。
- 当前分支必须是：v28-task-3-golden-path-e2e。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v28-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v28-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 实现并测试完整路径：goal init/status -> next -> prompt -> worker event -> review -> main verification -> closeout gaps。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v28-task-3-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v28 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v28-task-3-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v28-workbench-v1-release
- Task id: task-3
- Branch: v28-task-3-golden-path-e2e
- User-visible value: Workbench v1 有可验收的主路径。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework。
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
git commit -m "Implement v28 task-3: Golden path E2E"

pnpm --silent symphony goal update \
  --goal v28-workbench-v1-release \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v28-task-3-worker \
  --evidence-ref docs/plans/v28-task-3-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v28-workbench-v1-release \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v28-task-3-worker \
  --evidence-ref docs/plans/v28-task-3-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v28 task-3 independent reviewer review。

目标：
- 审查当前分支 `v28-task-3-golden-path-e2e` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v28-task-3-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v28 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：Workbench v1 有可验收的主路径。
- 是否围绕 latest/v19 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增安全框架、权限系统、goal framework、artifact framework。
- 是否没有让前端根据文件名/分支名/路径推断 task 状态。
- Tests 是否覆盖用户路径，而不只是底层函数。

必须运行：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出要求：
- 写入 review evidence：docs/plans/v28-task-3-review-evidence-2026-05-29.md
- 返回 Verdict: APPROVED 或 NEEDS_REVISION
- 返回 reviewed files
- 返回 commands run with exact results
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项
- 如果 APPROVED，说明批准范围，不要宣称 main verified 或 release ready
```

## Reviewer event

If approved:

```bash
pnpm --silent symphony goal review \
  --goal v28-workbench-v1-release \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v28-task-3-reviewer \
  --evidence-ref docs/plans/v28-task-3-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v28-workbench-v1-release \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v28-task-3-reviewer \
  --evidence-ref docs/plans/v28-task-3-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v28 task-3 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-3.
- Review evidence: docs/plans/v28-task-3-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v28-task-3-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v28 task-3 main verification。

前提：
- v28-task-3-golden-path-e2e 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v28-task-3-golden-path-e2e
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
- 写入 main verification evidence：docs/plans/v28-task-3-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v28-workbench-v1-release
- Task id: task-3
- Branch: v28-task-3-golden-path-e2e
- Main commit
- Merge mode
- Commands run with exact results
- 是否 main verification passed
- 不宣称 release ready

完成后返回：
- Summary
- Main commit
- Evidence path
- 下一步应登记 main-verification gate
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v28-workbench-v1-release \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v28-main-verifier \
  --evidence-ref docs/plans/v28-task-3-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v28-workbench-v1-release \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v28-main-verifier \
  --evidence-ref docs/plans/v28-task-3-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v28-workbench-v1-release --json
```


---

# task-4: Release closeout workspace

Branch: `v28-task-4-release-closeout-workspace`  
Worker evidence: `docs/plans/v28-task-4-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v28-task-4-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v28-task-4-main-verification-evidence-2026-05-29.md`

## User-visible value

release 前能在 Workbench 里看到明确缺口和收口动作。

## Implementation scope

接入 goal closeout，运行 release verification checklist，登记 release.ready gate，并生成 tag evidence prompt。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
pnpm --silent symphony goal next --goal v28-workbench-v1-release --json
git checkout -b v28-task-4-release-closeout-workspace
```

## Worker prompt

```text
/goal
执行 v28 task-4 worker implementation：Release closeout workspace。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v28-workbench-v1-release。
- 当前任务：task-4。
- 当前分支必须是：v28-task-4-release-closeout-workspace。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v28-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v28-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 接入 goal closeout，运行 release verification checklist，登记 release.ready gate，并生成 tag evidence prompt。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v28-task-4-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v28 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v28-task-4-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v28-workbench-v1-release
- Task id: task-4
- Branch: v28-task-4-release-closeout-workspace
- User-visible value: release 前能在 Workbench 里看到明确缺口和收口动作。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework。
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
git commit -m "Implement v28 task-4: Release closeout workspace"

pnpm --silent symphony goal update \
  --goal v28-workbench-v1-release \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v28-task-4-worker \
  --evidence-ref docs/plans/v28-task-4-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v28-workbench-v1-release \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v28-task-4-worker \
  --evidence-ref docs/plans/v28-task-4-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v28 task-4 independent reviewer review。

目标：
- 审查当前分支 `v28-task-4-release-closeout-workspace` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v28-task-4-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v28 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：release 前能在 Workbench 里看到明确缺口和收口动作。
- 是否围绕 latest/v19 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增安全框架、权限系统、goal framework、artifact framework。
- 是否没有让前端根据文件名/分支名/路径推断 task 状态。
- Tests 是否覆盖用户路径，而不只是底层函数。

必须运行：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出要求：
- 写入 review evidence：docs/plans/v28-task-4-review-evidence-2026-05-29.md
- 返回 Verdict: APPROVED 或 NEEDS_REVISION
- 返回 reviewed files
- 返回 commands run with exact results
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项
- 如果 APPROVED，说明批准范围，不要宣称 main verified 或 release ready
```

## Reviewer event

If approved:

```bash
pnpm --silent symphony goal review \
  --goal v28-workbench-v1-release \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v28-task-4-reviewer \
  --evidence-ref docs/plans/v28-task-4-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v28-workbench-v1-release \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v28-task-4-reviewer \
  --evidence-ref docs/plans/v28-task-4-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v28 task-4 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-4.
- Review evidence: docs/plans/v28-task-4-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v28-task-4-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v28 task-4 main verification。

前提：
- v28-task-4-release-closeout-workspace 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v28-task-4-release-closeout-workspace
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
- 写入 main verification evidence：docs/plans/v28-task-4-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v28-workbench-v1-release
- Task id: task-4
- Branch: v28-task-4-release-closeout-workspace
- Main commit
- Merge mode
- Commands run with exact results
- 是否 main verification passed
- 不宣称 release ready

完成后返回：
- Summary
- Main commit
- Evidence path
- 下一步应登记 main-verification gate
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v28-workbench-v1-release \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v28-main-verifier \
  --evidence-ref docs/plans/v28-task-4-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v28-workbench-v1-release \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v28-main-verifier \
  --evidence-ref docs/plans/v28-task-4-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v28-workbench-v1-release --json
```


---

# task-5: README/operator guide/release evidence

Branch: `v28-task-5-readme-operator-guide-release-evidence`  
Worker evidence: `docs/plans/v28-task-5-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v28-task-5-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v28-task-5-main-verification-evidence-2026-05-29.md`

## User-visible value

项目定位正式从 dashboard 变成 Workbench。

## Implementation scope

更新 README，把 Workbench v1 作为日常入口，把 symphony CLI 作为高级/脚本入口，写 release evidence。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
pnpm --silent symphony goal next --goal v28-workbench-v1-release --json
git checkout -b v28-task-5-readme-operator-guide-release-evidence
```

## Worker prompt

```text
/goal
执行 v28 task-5 worker implementation：README/operator guide/release evidence。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v28-workbench-v1-release。
- 当前任务：task-5。
- 当前分支必须是：v28-task-5-readme-operator-guide-release-evidence。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v28-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v28-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 更新 README，把 Workbench v1 作为日常入口，把 symphony CLI 作为高级/脚本入口，写 release evidence。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v28-task-5-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v28 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v28-task-5-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v28-workbench-v1-release
- Task id: task-5
- Branch: v28-task-5-readme-operator-guide-release-evidence
- User-visible value: 项目定位正式从 dashboard 变成 Workbench。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework。
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
git commit -m "Implement v28 task-5: README/operator guide/release evidence"

pnpm --silent symphony goal update \
  --goal v28-workbench-v1-release \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v28-task-5-worker \
  --evidence-ref docs/plans/v28-task-5-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v28-workbench-v1-release \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v28-task-5-worker \
  --evidence-ref docs/plans/v28-task-5-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v28 task-5 independent reviewer review。

目标：
- 审查当前分支 `v28-task-5-readme-operator-guide-release-evidence` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v28-task-5-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v28 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：项目定位正式从 dashboard 变成 Workbench。
- 是否围绕 latest/v19 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增安全框架、权限系统、goal framework、artifact framework。
- 是否没有让前端根据文件名/分支名/路径推断 task 状态。
- Tests 是否覆盖用户路径，而不只是底层函数。

必须运行：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出要求：
- 写入 review evidence：docs/plans/v28-task-5-review-evidence-2026-05-29.md
- 返回 Verdict: APPROVED 或 NEEDS_REVISION
- 返回 reviewed files
- 返回 commands run with exact results
- 如果 NEEDS_REVISION，列出 blockers 和必须修改项
- 如果 APPROVED，说明批准范围，不要宣称 main verified 或 release ready
```

## Reviewer event

If approved:

```bash
pnpm --silent symphony goal review \
  --goal v28-workbench-v1-release \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v28-task-5-reviewer \
  --evidence-ref docs/plans/v28-task-5-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v28-workbench-v1-release \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v28-task-5-reviewer \
  --evidence-ref docs/plans/v28-task-5-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v28 task-5 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-5.
- Review evidence: docs/plans/v28-task-5-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v28-task-5-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v28 task-5 main verification。

前提：
- v28-task-5-readme-operator-guide-release-evidence 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v28-task-5-readme-operator-guide-release-evidence
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
- 写入 main verification evidence：docs/plans/v28-task-5-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v28-workbench-v1-release
- Task id: task-5
- Branch: v28-task-5-readme-operator-guide-release-evidence
- Main commit
- Merge mode
- Commands run with exact results
- 是否 main verification passed
- 不宣称 release ready

完成后返回：
- Summary
- Main commit
- Evidence path
- 下一步应登记 main-verification gate
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v28-workbench-v1-release \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v28-main-verifier \
  --evidence-ref docs/plans/v28-task-5-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v28-workbench-v1-release \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v28-main-verifier \
  --evidence-ref docs/plans/v28-task-5-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v28-workbench-v1-release --json
```


---

# Release closeout for v28

## Release manager prompt

```text
/goal
执行 v28 release closeout。

前提：
- 所有 tasks 都已经 reviewer.approved。
- 所有 tasks 都已经 main-verification passed。
- goal closeout 没有 blocker。

执行：
- git checkout main
- git pull --ff-only
- pnpm check
- pnpm test
- pnpm workbench:build
- pnpm test:mutation:gate
- pnpm audit --audit-level high
- git diff --check
- pnpm --silent symphony goal closeout --goal v28-workbench-v1-release --markdown
- 写 release evidence：docs/plans/v28-release-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v28-workbench-v1-release
- Release name: v28 Workbench v1 Release
- Main commit
- Commands and exact results
- Closeout gaps: none, or explicit blockers
- Boundary: Workbench 主线基于 latest goal/runbook flow，不是 v8 action dashboard
- Tag/release recommendation
```

## Release.ready gate

```bash
pnpm --silent symphony goal closeout --goal v28-workbench-v1-release --markdown

pnpm --silent symphony goal gate \
  --goal v28-workbench-v1-release \
  --gate release.ready \
  --status declared \
  --verifier codex-v28-release-manager \
  --evidence-ref docs/plans/v28-release-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v28-workbench-v1-release \
  --gate release.ready \
  --status declared \
  --verifier codex-v28-release-manager \
  --evidence-ref docs/plans/v28-release-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```
