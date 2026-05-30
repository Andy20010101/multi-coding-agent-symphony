# v22 Plan + /goal Runbook: Prompt Handoff Workspace

Date: 2026-05-29  
Goal id: `v22-goal-prompt-handoff-workspace`  
Baseline: `v21 goal event registration`  
Release name: `v22 Prompt Handoff Workspace`

## Correction note

This runbook intentionally does **not** use the old v8 command surface as the Workbench button/action baseline. The primary product surface for this version is the latest goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older commands such as `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` may still exist, but they are not the main Workbench model for this version.

## Product purpose

把 v19 goal prompt 变成正式 Prompt Handoff 工作区，支持 worker 和 independent reviewer/subagent 独立完成，不再散落在 markdown 或终端输出里。

## Product spine

```text
Select goal task -> choose worker/reviewer/main-verifier/release role -> render goal prompt -> copy to subagent -> record started/evidence from same workspace.
```

## Tasks

- task-1: Prompt Workspace route — 用户能从 UI 生成某个 task 的 worker/reviewer/main-verifier prompt。
- task-2: Role-specific prompt renderer — 不同 subagent 拿到的是角色明确、边界清楚、证据要求完整的 prompt。
- task-3: Subagent handoff board — 用户能知道哪个 subagent 该接手，而不是自己记。
- task-4: Prompt-to-event shortcuts — 用户从复制 prompt 到登记 evidence 的路径连起来。
- task-5: Prompt workspace tests and docs — 确保 prompt handoff 是工作台功能，不是另一个静态 dashboard。

## Non-goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval or release readiness from file names, branch names, commit messages, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge or auto-tag unless this exact version/task explicitly says so.

## Task 0: bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v22-prompt-handoff-workspace-plan-2026-05-29.md`
- Execution prompt doc: `docs/plans/v22-prompt-handoff-workspace-execution-prompts-2026-05-29.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v22-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v22 Task 0：为 `v22-goal-prompt-handoff-workspace` 写 plan/runbook 和 execution prompts，并用最新 v19 goal init / goal-status 流程注册该 goal。

目标：
- 写入 plan doc：docs/plans/v22-prompt-handoff-workspace-plan-2026-05-29.md
- 写入 execution prompt doc：docs/plans/v22-prompt-handoff-workspace-execution-prompts-2026-05-29.md
- Goal id：v22-goal-prompt-handoff-workspace
- Baseline：v21 goal event registration
- 版本目标：Prompt Handoff Workspace
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
  --from docs/plans/v22-prompt-handoff-workspace-plan-2026-05-29.md \
  --goal v22-goal-prompt-handoff-workspace \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v22-prompt-handoff-workspace-plan-2026-05-29.md \
  --goal v22-goal-prompt-handoff-workspace \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json
```


---

# task-1: Prompt Workspace route

Branch: `v22-task-1-prompt-workspace-route`  
Worker evidence: `docs/plans/v22-task-1-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v22-task-1-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v22-task-1-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能从 UI 生成某个 task 的 worker/reviewer/main-verifier prompt。

## Implementation scope

新增 /workbench/prompts 或等价路由，左侧选 goal/task/role，右侧展示由 goal prompt 生成的 prompt pack。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json
git checkout -b v22-task-1-prompt-workspace-route
```

## Worker prompt

```text
/goal
执行 v22 task-1 worker implementation：Prompt Workspace route。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v22-goal-prompt-handoff-workspace。
- 当前任务：task-1。
- 当前分支必须是：v22-task-1-prompt-workspace-route。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v22-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v22-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 新增 /workbench/prompts 或等价路由，左侧选 goal/task/role，右侧展示由 goal prompt 生成的 prompt pack。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v22-task-1-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v22 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v22-task-1-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v22-goal-prompt-handoff-workspace
- Task id: task-1
- Branch: v22-task-1-prompt-workspace-route
- User-visible value: 用户能从 UI 生成某个 task 的 worker/reviewer/main-verifier prompt。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
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
git commit -m "Implement v22 task-1: Prompt Workspace route"

pnpm --silent symphony goal update \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v22-task-1-worker \
  --evidence-ref docs/plans/v22-task-1-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v22-task-1-worker \
  --evidence-ref docs/plans/v22-task-1-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v22 task-1 independent reviewer review。

目标：
- 审查当前分支 `v22-task-1-prompt-workspace-route` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v22-task-1-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v22 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能从 UI 生成某个 task 的 worker/reviewer/main-verifier prompt。
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
- 写入 review evidence：docs/plans/v22-task-1-review-evidence-2026-05-29.md
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
  --goal v22-goal-prompt-handoff-workspace \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v22-task-1-reviewer \
  --evidence-ref docs/plans/v22-task-1-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v22-task-1-reviewer \
  --evidence-ref docs/plans/v22-task-1-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v22 task-1 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-1.
- Review evidence: docs/plans/v22-task-1-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v22-task-1-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v22 task-1 main verification。

前提：
- v22-task-1-prompt-workspace-route 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v22-task-1-prompt-workspace-route
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
- 写入 main verification evidence：docs/plans/v22-task-1-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v22-goal-prompt-handoff-workspace
- Task id: task-1
- Branch: v22-task-1-prompt-workspace-route
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
  --goal v22-goal-prompt-handoff-workspace \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v22-main-verifier \
  --evidence-ref docs/plans/v22-task-1-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v22-goal-prompt-handoff-workspace \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v22-main-verifier \
  --evidence-ref docs/plans/v22-task-1-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json
```


---

# task-2: Role-specific prompt renderer

Branch: `v22-task-2-role-specific-prompt-renderer`  
Worker evidence: `docs/plans/v22-task-2-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v22-task-2-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v22-task-2-main-verification-evidence-2026-05-29.md`

## User-visible value

不同 subagent 拿到的是角色明确、边界清楚、证据要求完整的 prompt。

## Implementation scope

支持 worker、independent reviewer、main verifier、release manager 四种 prompt 渲染和 copy。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json
git checkout -b v22-task-2-role-specific-prompt-renderer
```

## Worker prompt

```text
/goal
执行 v22 task-2 worker implementation：Role-specific prompt renderer。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v22-goal-prompt-handoff-workspace。
- 当前任务：task-2。
- 当前分支必须是：v22-task-2-role-specific-prompt-renderer。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v22-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v22-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 支持 worker、independent reviewer、main verifier、release manager 四种 prompt 渲染和 copy。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v22-task-2-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v22 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v22-task-2-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v22-goal-prompt-handoff-workspace
- Task id: task-2
- Branch: v22-task-2-role-specific-prompt-renderer
- User-visible value: 不同 subagent 拿到的是角色明确、边界清楚、证据要求完整的 prompt。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
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
git commit -m "Implement v22 task-2: Role-specific prompt renderer"

pnpm --silent symphony goal update \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v22-task-2-worker \
  --evidence-ref docs/plans/v22-task-2-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v22-task-2-worker \
  --evidence-ref docs/plans/v22-task-2-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v22 task-2 independent reviewer review。

目标：
- 审查当前分支 `v22-task-2-role-specific-prompt-renderer` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v22-task-2-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v22 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：不同 subagent 拿到的是角色明确、边界清楚、证据要求完整的 prompt。
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
- 写入 review evidence：docs/plans/v22-task-2-review-evidence-2026-05-29.md
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
  --goal v22-goal-prompt-handoff-workspace \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v22-task-2-reviewer \
  --evidence-ref docs/plans/v22-task-2-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v22-task-2-reviewer \
  --evidence-ref docs/plans/v22-task-2-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v22 task-2 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-2.
- Review evidence: docs/plans/v22-task-2-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v22-task-2-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v22 task-2 main verification。

前提：
- v22-task-2-role-specific-prompt-renderer 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v22-task-2-role-specific-prompt-renderer
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
- 写入 main verification evidence：docs/plans/v22-task-2-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v22-goal-prompt-handoff-workspace
- Task id: task-2
- Branch: v22-task-2-role-specific-prompt-renderer
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
  --goal v22-goal-prompt-handoff-workspace \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v22-main-verifier \
  --evidence-ref docs/plans/v22-task-2-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v22-goal-prompt-handoff-workspace \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v22-main-verifier \
  --evidence-ref docs/plans/v22-task-2-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json
```


---

# task-3: Subagent handoff board

Branch: `v22-task-3-subagent-handoff-board`  
Worker evidence: `docs/plans/v22-task-3-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v22-task-3-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v22-task-3-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能知道哪个 subagent 该接手，而不是自己记。

## Implementation scope

为每个 task 展示 worker started、evidence recorded、reviewer verdict、main verification 的 handoff 状态。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json
git checkout -b v22-task-3-subagent-handoff-board
```

## Worker prompt

```text
/goal
执行 v22 task-3 worker implementation：Subagent handoff board。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v22-goal-prompt-handoff-workspace。
- 当前任务：task-3。
- 当前分支必须是：v22-task-3-subagent-handoff-board。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v22-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v22-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 为每个 task 展示 worker started、evidence recorded、reviewer verdict、main verification 的 handoff 状态。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v22-task-3-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v22 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v22-task-3-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v22-goal-prompt-handoff-workspace
- Task id: task-3
- Branch: v22-task-3-subagent-handoff-board
- User-visible value: 用户能知道哪个 subagent 该接手，而不是自己记。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
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
git commit -m "Implement v22 task-3: Subagent handoff board"

pnpm --silent symphony goal update \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v22-task-3-worker \
  --evidence-ref docs/plans/v22-task-3-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v22-task-3-worker \
  --evidence-ref docs/plans/v22-task-3-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v22 task-3 independent reviewer review。

目标：
- 审查当前分支 `v22-task-3-subagent-handoff-board` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v22-task-3-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v22 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能知道哪个 subagent 该接手，而不是自己记。
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
- 写入 review evidence：docs/plans/v22-task-3-review-evidence-2026-05-29.md
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
  --goal v22-goal-prompt-handoff-workspace \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v22-task-3-reviewer \
  --evidence-ref docs/plans/v22-task-3-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v22-task-3-reviewer \
  --evidence-ref docs/plans/v22-task-3-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v22 task-3 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-3.
- Review evidence: docs/plans/v22-task-3-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v22-task-3-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v22 task-3 main verification。

前提：
- v22-task-3-subagent-handoff-board 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v22-task-3-subagent-handoff-board
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
- 写入 main verification evidence：docs/plans/v22-task-3-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v22-goal-prompt-handoff-workspace
- Task id: task-3
- Branch: v22-task-3-subagent-handoff-board
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
  --goal v22-goal-prompt-handoff-workspace \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v22-main-verifier \
  --evidence-ref docs/plans/v22-task-3-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v22-goal-prompt-handoff-workspace \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v22-main-verifier \
  --evidence-ref docs/plans/v22-task-3-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json
```


---

# task-4: Prompt-to-event shortcuts

Branch: `v22-task-4-prompt-to-event-shortcuts`  
Worker evidence: `docs/plans/v22-task-4-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v22-task-4-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v22-task-4-main-verification-evidence-2026-05-29.md`

## User-visible value

用户从复制 prompt 到登记 evidence 的路径连起来。

## Implementation scope

从 Prompt Workspace 直接生成 worker.started / worker.evidence-recorded 的事件登记表单，并复用 v21 dry-run/confirm flow。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json
git checkout -b v22-task-4-prompt-to-event-shortcuts
```

## Worker prompt

```text
/goal
执行 v22 task-4 worker implementation：Prompt-to-event shortcuts。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v22-goal-prompt-handoff-workspace。
- 当前任务：task-4。
- 当前分支必须是：v22-task-4-prompt-to-event-shortcuts。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v22-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v22-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 从 Prompt Workspace 直接生成 worker.started / worker.evidence-recorded 的事件登记表单，并复用 v21 dry-run/confirm flow。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v22-task-4-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v22 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v22-task-4-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v22-goal-prompt-handoff-workspace
- Task id: task-4
- Branch: v22-task-4-prompt-to-event-shortcuts
- User-visible value: 用户从复制 prompt 到登记 evidence 的路径连起来。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
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
git commit -m "Implement v22 task-4: Prompt-to-event shortcuts"

pnpm --silent symphony goal update \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v22-task-4-worker \
  --evidence-ref docs/plans/v22-task-4-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v22-task-4-worker \
  --evidence-ref docs/plans/v22-task-4-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v22 task-4 independent reviewer review。

目标：
- 审查当前分支 `v22-task-4-prompt-to-event-shortcuts` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v22-task-4-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v22 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户从复制 prompt 到登记 evidence 的路径连起来。
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
- 写入 review evidence：docs/plans/v22-task-4-review-evidence-2026-05-29.md
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
  --goal v22-goal-prompt-handoff-workspace \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v22-task-4-reviewer \
  --evidence-ref docs/plans/v22-task-4-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v22-task-4-reviewer \
  --evidence-ref docs/plans/v22-task-4-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v22 task-4 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-4.
- Review evidence: docs/plans/v22-task-4-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v22-task-4-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v22 task-4 main verification。

前提：
- v22-task-4-prompt-to-event-shortcuts 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v22-task-4-prompt-to-event-shortcuts
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
- 写入 main verification evidence：docs/plans/v22-task-4-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v22-goal-prompt-handoff-workspace
- Task id: task-4
- Branch: v22-task-4-prompt-to-event-shortcuts
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
  --goal v22-goal-prompt-handoff-workspace \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v22-main-verifier \
  --evidence-ref docs/plans/v22-task-4-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v22-goal-prompt-handoff-workspace \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v22-main-verifier \
  --evidence-ref docs/plans/v22-task-4-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json
```


---

# task-5: Prompt workspace tests and docs

Branch: `v22-task-5-prompt-workspace-tests-and-docs`  
Worker evidence: `docs/plans/v22-task-5-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v22-task-5-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v22-task-5-main-verification-evidence-2026-05-29.md`

## User-visible value

确保 prompt handoff 是工作台功能，不是另一个静态 dashboard。

## Implementation scope

测试 role prompt、copy、event shortcut、reviewer 独立性提示和 unsupported goal state。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json
git checkout -b v22-task-5-prompt-workspace-tests-and-docs
```

## Worker prompt

```text
/goal
执行 v22 task-5 worker implementation：Prompt workspace tests and docs。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v22-goal-prompt-handoff-workspace。
- 当前任务：task-5。
- 当前分支必须是：v22-task-5-prompt-workspace-tests-and-docs。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v22-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v22-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 测试 role prompt、copy、event shortcut、reviewer 独立性提示和 unsupported goal state。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v22-task-5-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v22 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v22-task-5-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v22-goal-prompt-handoff-workspace
- Task id: task-5
- Branch: v22-task-5-prompt-workspace-tests-and-docs
- User-visible value: 确保 prompt handoff 是工作台功能，不是另一个静态 dashboard。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
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
git commit -m "Implement v22 task-5: Prompt workspace tests and docs"

pnpm --silent symphony goal update \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v22-task-5-worker \
  --evidence-ref docs/plans/v22-task-5-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v22-task-5-worker \
  --evidence-ref docs/plans/v22-task-5-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v22 task-5 independent reviewer review。

目标：
- 审查当前分支 `v22-task-5-prompt-workspace-tests-and-docs` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v22-task-5-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v22 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：确保 prompt handoff 是工作台功能，不是另一个静态 dashboard。
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
- 写入 review evidence：docs/plans/v22-task-5-review-evidence-2026-05-29.md
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
  --goal v22-goal-prompt-handoff-workspace \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v22-task-5-reviewer \
  --evidence-ref docs/plans/v22-task-5-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v22-goal-prompt-handoff-workspace \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v22-task-5-reviewer \
  --evidence-ref docs/plans/v22-task-5-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v22 task-5 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-5.
- Review evidence: docs/plans/v22-task-5-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v22-task-5-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v22 task-5 main verification。

前提：
- v22-task-5-prompt-workspace-tests-and-docs 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v22-task-5-prompt-workspace-tests-and-docs
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v22-goal-prompt-handoff-workspace --json
- 写入 main verification evidence：docs/plans/v22-task-5-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v22-goal-prompt-handoff-workspace
- Task id: task-5
- Branch: v22-task-5-prompt-workspace-tests-and-docs
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
  --goal v22-goal-prompt-handoff-workspace \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v22-main-verifier \
  --evidence-ref docs/plans/v22-task-5-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v22-goal-prompt-handoff-workspace \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v22-main-verifier \
  --evidence-ref docs/plans/v22-task-5-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v22-goal-prompt-handoff-workspace --json
```


---

# Release closeout for v22

## Release manager prompt

```text
/goal
执行 v22 release closeout。

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
- pnpm --silent symphony goal closeout --goal v22-goal-prompt-handoff-workspace --markdown
- 写 release evidence：docs/plans/v22-release-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v22-goal-prompt-handoff-workspace
- Release name: v22 Prompt Handoff Workspace
- Main commit
- Commands and exact results
- Closeout gaps: none, or explicit blockers
- Boundary: Workbench 主线基于 latest goal/runbook flow，不是 v8 action dashboard
- Tag/release recommendation
```

## Release.ready gate

```bash
pnpm --silent symphony goal closeout --goal v22-goal-prompt-handoff-workspace --markdown

pnpm --silent symphony goal gate \
  --goal v22-goal-prompt-handoff-workspace \
  --gate release.ready \
  --status declared \
  --verifier codex-v22-release-manager \
  --evidence-ref docs/plans/v22-release-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v22-goal-prompt-handoff-workspace \
  --gate release.ready \
  --status declared \
  --verifier codex-v22-release-manager \
  --evidence-ref docs/plans/v22-release-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```
