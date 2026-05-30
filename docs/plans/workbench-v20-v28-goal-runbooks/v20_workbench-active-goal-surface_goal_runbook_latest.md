# v20 Plan + /goal Runbook: Workbench Active Goal Surface

Date: 2026-05-29  
Goal id: `v20-goal-workbench-active-goal-surface`  
Baseline: `v19 released goal runbook/next-action flow`  
Release name: `v20 Workbench Active Goal Surface`

## Correction note

This runbook intentionally does **not** use the old v8 command surface as the Workbench button/action baseline. The primary product surface for this version is the latest goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older commands such as `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` may still exist, but they are not the main Workbench model for this version.

## Product purpose

把 Workbench 的首页从普通 Dashboard 改成 Active Goal 工作台。主按钮不再是 v8 scan/do/review/verify，而是 v19 的 goal-status、goal next、goal prompt、goal closeout 和 symphony next --goal latest。

## Product spine

```text
Open Workbench -> select active goal -> read runbook/task queue -> see next action -> preview goal prompt -> see closeout gaps.
```

## Tasks

- task-1: Latest goal command inventory + Workbench view model — 用户能在 UI 里看到 active goal 的 command-backed 数据来源，而不是一组历史 CLI 按钮。
- task-2: Active Goal Runbook panel + task queue — 用户能直接知道当前 goal 的任务蓝图和每个 task 的状态。
- task-3: Next Action Card + Prompt Preview Drawer — 用户不用再去终端查下一步或手拼 /goal prompt。
- task-4: Closeout Gaps panel — 用户能看到 release 还缺什么，而不是只看泛泛 dashboard。
- task-5: Workbench tests, operator docs, release evidence — 这个版本可以作为新的 Workbench 主入口基线。

## Non-goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval or release readiness from file names, branch names, commit messages, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge or auto-tag unless this exact version/task explicitly says so.

## Task 0: bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v20-workbench-active-goal-surface-plan-2026-05-29.md`
- Execution prompt doc: `docs/plans/v20-workbench-active-goal-surface-execution-prompts-2026-05-29.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v20-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v20 Task 0：为 `v20-goal-workbench-active-goal-surface` 写 plan/runbook 和 execution prompts，并用最新 v19 goal init / goal-status 流程注册该 goal。

目标：
- 写入 plan doc：docs/plans/v20-workbench-active-goal-surface-plan-2026-05-29.md
- 写入 execution prompt doc：docs/plans/v20-workbench-active-goal-surface-execution-prompts-2026-05-29.md
- Goal id：v20-goal-workbench-active-goal-surface
- Baseline：v19 released goal runbook/next-action flow
- 版本目标：Workbench Active Goal Surface
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
  --from docs/plans/v20-workbench-active-goal-surface-plan-2026-05-29.md \
  --goal v20-goal-workbench-active-goal-surface \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v20-workbench-active-goal-surface-plan-2026-05-29.md \
  --goal v20-goal-workbench-active-goal-surface \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json
```


---

# task-1: Latest goal command inventory + Workbench view model

Branch: `v20-task-1-latest-goal-command-inventory-workbench-view-model`  
Worker evidence: `docs/plans/v20-task-1-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v20-task-1-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v20-task-1-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能在 UI 里看到 active goal 的 command-backed 数据来源，而不是一组历史 CLI 按钮。

## Implementation scope

建立 Workbench 侧的 ActiveGoalViewModel，只读取最新 goal/status/next/prompt/closeout 输出，不把 v8 action list 当主模型。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json
git checkout -b v20-task-1-latest-goal-command-inventory-workbench-view-model
```

## Worker prompt

```text
/goal
执行 v20 task-1 worker implementation：Latest goal command inventory + Workbench view model。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v20-goal-workbench-active-goal-surface。
- 当前任务：task-1。
- 当前分支必须是：v20-task-1-latest-goal-command-inventory-workbench-view-model。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v20-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v20-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 建立 Workbench 侧的 ActiveGoalViewModel，只读取最新 goal/status/next/prompt/closeout 输出，不把 v8 action list 当主模型。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v20-task-1-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v20 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v20-task-1-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v20-goal-workbench-active-goal-surface
- Task id: task-1
- Branch: v20-task-1-latest-goal-command-inventory-workbench-view-model
- User-visible value: 用户能在 UI 里看到 active goal 的 command-backed 数据来源，而不是一组历史 CLI 按钮。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
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
git commit -m "Implement v20 task-1: Latest goal command inventory + Workbench view model"

pnpm --silent symphony goal update \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v20-task-1-worker \
  --evidence-ref docs/plans/v20-task-1-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v20-task-1-worker \
  --evidence-ref docs/plans/v20-task-1-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v20 task-1 independent reviewer review。

目标：
- 审查当前分支 `v20-task-1-latest-goal-command-inventory-workbench-view-model` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v20-task-1-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v20 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能在 UI 里看到 active goal 的 command-backed 数据来源，而不是一组历史 CLI 按钮。
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
- 写入 review evidence：docs/plans/v20-task-1-review-evidence-2026-05-29.md
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
  --goal v20-goal-workbench-active-goal-surface \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v20-task-1-reviewer \
  --evidence-ref docs/plans/v20-task-1-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v20-task-1-reviewer \
  --evidence-ref docs/plans/v20-task-1-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v20 task-1 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-1.
- Review evidence: docs/plans/v20-task-1-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v20-task-1-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v20 task-1 main verification。

前提：
- v20-task-1-latest-goal-command-inventory-workbench-view-model 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v20-task-1-latest-goal-command-inventory-workbench-view-model
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
- 写入 main verification evidence：docs/plans/v20-task-1-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v20-goal-workbench-active-goal-surface
- Task id: task-1
- Branch: v20-task-1-latest-goal-command-inventory-workbench-view-model
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
  --goal v20-goal-workbench-active-goal-surface \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v20-main-verifier \
  --evidence-ref docs/plans/v20-task-1-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v20-goal-workbench-active-goal-surface \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v20-main-verifier \
  --evidence-ref docs/plans/v20-task-1-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json
```


---

# task-2: Active Goal Runbook panel + task queue

Branch: `v20-task-2-active-goal-runbook-panel-task-queue`  
Worker evidence: `docs/plans/v20-task-2-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v20-task-2-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v20-task-2-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能直接知道当前 goal 的任务蓝图和每个 task 的状态。

## Implementation scope

实现 Active Goal Runbook 面板，展示 goal title、baseline、task queue、role order、evidence requirements、release gates。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json
git checkout -b v20-task-2-active-goal-runbook-panel-task-queue
```

## Worker prompt

```text
/goal
执行 v20 task-2 worker implementation：Active Goal Runbook panel + task queue。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v20-goal-workbench-active-goal-surface。
- 当前任务：task-2。
- 当前分支必须是：v20-task-2-active-goal-runbook-panel-task-queue。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v20-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v20-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 实现 Active Goal Runbook 面板，展示 goal title、baseline、task queue、role order、evidence requirements、release gates。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v20-task-2-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v20 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v20-task-2-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v20-goal-workbench-active-goal-surface
- Task id: task-2
- Branch: v20-task-2-active-goal-runbook-panel-task-queue
- User-visible value: 用户能直接知道当前 goal 的任务蓝图和每个 task 的状态。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
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
git commit -m "Implement v20 task-2: Active Goal Runbook panel + task queue"

pnpm --silent symphony goal update \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v20-task-2-worker \
  --evidence-ref docs/plans/v20-task-2-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v20-task-2-worker \
  --evidence-ref docs/plans/v20-task-2-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v20 task-2 independent reviewer review。

目标：
- 审查当前分支 `v20-task-2-active-goal-runbook-panel-task-queue` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v20-task-2-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v20 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能直接知道当前 goal 的任务蓝图和每个 task 的状态。
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
- 写入 review evidence：docs/plans/v20-task-2-review-evidence-2026-05-29.md
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
  --goal v20-goal-workbench-active-goal-surface \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v20-task-2-reviewer \
  --evidence-ref docs/plans/v20-task-2-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v20-task-2-reviewer \
  --evidence-ref docs/plans/v20-task-2-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v20 task-2 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-2.
- Review evidence: docs/plans/v20-task-2-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v20-task-2-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v20 task-2 main verification。

前提：
- v20-task-2-active-goal-runbook-panel-task-queue 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v20-task-2-active-goal-runbook-panel-task-queue
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
- 写入 main verification evidence：docs/plans/v20-task-2-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v20-goal-workbench-active-goal-surface
- Task id: task-2
- Branch: v20-task-2-active-goal-runbook-panel-task-queue
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
  --goal v20-goal-workbench-active-goal-surface \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v20-main-verifier \
  --evidence-ref docs/plans/v20-task-2-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v20-goal-workbench-active-goal-surface \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v20-main-verifier \
  --evidence-ref docs/plans/v20-task-2-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json
```


---

# task-3: Next Action Card + Prompt Preview Drawer

Branch: `v20-task-3-next-action-card-prompt-preview-drawer`  
Worker evidence: `docs/plans/v20-task-3-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v20-task-3-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v20-task-3-main-verification-evidence-2026-05-29.md`

## User-visible value

用户不用再去终端查下一步或手拼 /goal prompt。

## Implementation scope

接入 goal next / goal prompt 输出，显示当前 task、required role、reason、copy-only prompt、后续 evidence event。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json
git checkout -b v20-task-3-next-action-card-prompt-preview-drawer
```

## Worker prompt

```text
/goal
执行 v20 task-3 worker implementation：Next Action Card + Prompt Preview Drawer。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v20-goal-workbench-active-goal-surface。
- 当前任务：task-3。
- 当前分支必须是：v20-task-3-next-action-card-prompt-preview-drawer。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v20-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v20-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 接入 goal next / goal prompt 输出，显示当前 task、required role、reason、copy-only prompt、后续 evidence event。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v20-task-3-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v20 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v20-task-3-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v20-goal-workbench-active-goal-surface
- Task id: task-3
- Branch: v20-task-3-next-action-card-prompt-preview-drawer
- User-visible value: 用户不用再去终端查下一步或手拼 /goal prompt。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
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
git commit -m "Implement v20 task-3: Next Action Card + Prompt Preview Drawer"

pnpm --silent symphony goal update \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v20-task-3-worker \
  --evidence-ref docs/plans/v20-task-3-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v20-task-3-worker \
  --evidence-ref docs/plans/v20-task-3-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v20 task-3 independent reviewer review。

目标：
- 审查当前分支 `v20-task-3-next-action-card-prompt-preview-drawer` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v20-task-3-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v20 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户不用再去终端查下一步或手拼 /goal prompt。
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
- 写入 review evidence：docs/plans/v20-task-3-review-evidence-2026-05-29.md
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
  --goal v20-goal-workbench-active-goal-surface \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v20-task-3-reviewer \
  --evidence-ref docs/plans/v20-task-3-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v20-task-3-reviewer \
  --evidence-ref docs/plans/v20-task-3-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v20 task-3 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-3.
- Review evidence: docs/plans/v20-task-3-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v20-task-3-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v20 task-3 main verification。

前提：
- v20-task-3-next-action-card-prompt-preview-drawer 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v20-task-3-next-action-card-prompt-preview-drawer
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
- 写入 main verification evidence：docs/plans/v20-task-3-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v20-goal-workbench-active-goal-surface
- Task id: task-3
- Branch: v20-task-3-next-action-card-prompt-preview-drawer
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
  --goal v20-goal-workbench-active-goal-surface \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v20-main-verifier \
  --evidence-ref docs/plans/v20-task-3-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v20-goal-workbench-active-goal-surface \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v20-main-verifier \
  --evidence-ref docs/plans/v20-task-3-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json
```


---

# task-4: Closeout Gaps panel

Branch: `v20-task-4-closeout-gaps-panel`  
Worker evidence: `docs/plans/v20-task-4-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v20-task-4-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v20-task-4-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能看到 release 还缺什么，而不是只看泛泛 dashboard。

## Implementation scope

接入 goal closeout 输出，展示缺失的 main verification、release gates、mutation/audit/tag evidence 等 gap。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json
git checkout -b v20-task-4-closeout-gaps-panel
```

## Worker prompt

```text
/goal
执行 v20 task-4 worker implementation：Closeout Gaps panel。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v20-goal-workbench-active-goal-surface。
- 当前任务：task-4。
- 当前分支必须是：v20-task-4-closeout-gaps-panel。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v20-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v20-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 接入 goal closeout 输出，展示缺失的 main verification、release gates、mutation/audit/tag evidence 等 gap。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v20-task-4-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v20 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v20-task-4-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v20-goal-workbench-active-goal-surface
- Task id: task-4
- Branch: v20-task-4-closeout-gaps-panel
- User-visible value: 用户能看到 release 还缺什么，而不是只看泛泛 dashboard。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
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
git commit -m "Implement v20 task-4: Closeout Gaps panel"

pnpm --silent symphony goal update \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v20-task-4-worker \
  --evidence-ref docs/plans/v20-task-4-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v20-task-4-worker \
  --evidence-ref docs/plans/v20-task-4-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v20 task-4 independent reviewer review。

目标：
- 审查当前分支 `v20-task-4-closeout-gaps-panel` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v20-task-4-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v20 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能看到 release 还缺什么，而不是只看泛泛 dashboard。
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
- 写入 review evidence：docs/plans/v20-task-4-review-evidence-2026-05-29.md
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
  --goal v20-goal-workbench-active-goal-surface \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v20-task-4-reviewer \
  --evidence-ref docs/plans/v20-task-4-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v20-task-4-reviewer \
  --evidence-ref docs/plans/v20-task-4-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v20 task-4 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-4.
- Review evidence: docs/plans/v20-task-4-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v20-task-4-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v20 task-4 main verification。

前提：
- v20-task-4-closeout-gaps-panel 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v20-task-4-closeout-gaps-panel
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
- 写入 main verification evidence：docs/plans/v20-task-4-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v20-goal-workbench-active-goal-surface
- Task id: task-4
- Branch: v20-task-4-closeout-gaps-panel
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
  --goal v20-goal-workbench-active-goal-surface \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v20-main-verifier \
  --evidence-ref docs/plans/v20-task-4-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v20-goal-workbench-active-goal-surface \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v20-main-verifier \
  --evidence-ref docs/plans/v20-task-4-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json
```


---

# task-5: Workbench tests, operator docs, release evidence

Branch: `v20-task-5-workbench-tests-operator-docs-release-evidence`  
Worker evidence: `docs/plans/v20-task-5-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v20-task-5-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v20-task-5-main-verification-evidence-2026-05-29.md`

## User-visible value

这个版本可以作为新的 Workbench 主入口基线。

## Implementation scope

补前端/后端测试、operator guide 和 release evidence，确认主路径都是 v19/latest goal command surface。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json
git checkout -b v20-task-5-workbench-tests-operator-docs-release-evidence
```

## Worker prompt

```text
/goal
执行 v20 task-5 worker implementation：Workbench tests, operator docs, release evidence。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v20-goal-workbench-active-goal-surface。
- 当前任务：task-5。
- 当前分支必须是：v20-task-5-workbench-tests-operator-docs-release-evidence。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v20-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v20-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 补前端/后端测试、operator guide 和 release evidence，确认主路径都是 v19/latest goal command surface。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v20-task-5-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v20 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v20-task-5-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v20-goal-workbench-active-goal-surface
- Task id: task-5
- Branch: v20-task-5-workbench-tests-operator-docs-release-evidence
- User-visible value: 这个版本可以作为新的 Workbench 主入口基线。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
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
git commit -m "Implement v20 task-5: Workbench tests, operator docs, release evidence"

pnpm --silent symphony goal update \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v20-task-5-worker \
  --evidence-ref docs/plans/v20-task-5-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v20-task-5-worker \
  --evidence-ref docs/plans/v20-task-5-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v20 task-5 independent reviewer review。

目标：
- 审查当前分支 `v20-task-5-workbench-tests-operator-docs-release-evidence` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v20-task-5-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v20 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：这个版本可以作为新的 Workbench 主入口基线。
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
- 写入 review evidence：docs/plans/v20-task-5-review-evidence-2026-05-29.md
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
  --goal v20-goal-workbench-active-goal-surface \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v20-task-5-reviewer \
  --evidence-ref docs/plans/v20-task-5-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v20-goal-workbench-active-goal-surface \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v20-task-5-reviewer \
  --evidence-ref docs/plans/v20-task-5-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v20 task-5 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-5.
- Review evidence: docs/plans/v20-task-5-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v20-task-5-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v20 task-5 main verification。

前提：
- v20-task-5-workbench-tests-operator-docs-release-evidence 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v20-task-5-workbench-tests-operator-docs-release-evidence
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v20-goal-workbench-active-goal-surface --json
- 写入 main verification evidence：docs/plans/v20-task-5-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v20-goal-workbench-active-goal-surface
- Task id: task-5
- Branch: v20-task-5-workbench-tests-operator-docs-release-evidence
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
  --goal v20-goal-workbench-active-goal-surface \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v20-main-verifier \
  --evidence-ref docs/plans/v20-task-5-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v20-goal-workbench-active-goal-surface \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v20-main-verifier \
  --evidence-ref docs/plans/v20-task-5-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v20-goal-workbench-active-goal-surface --json
```


---

# Release closeout for v20

## Release manager prompt

```text
/goal
执行 v20 release closeout。

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
- pnpm --silent symphony goal closeout --goal v20-goal-workbench-active-goal-surface --markdown
- 写 release evidence：docs/plans/v20-release-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v20-goal-workbench-active-goal-surface
- Release name: v20 Workbench Active Goal Surface
- Main commit
- Commands and exact results
- Closeout gaps: none, or explicit blockers
- Boundary: Workbench 主线基于 latest goal/runbook flow，不是 v8 action dashboard
- Tag/release recommendation
```

## Release.ready gate

```bash
pnpm --silent symphony goal closeout --goal v20-goal-workbench-active-goal-surface --markdown

pnpm --silent symphony goal gate \
  --goal v20-goal-workbench-active-goal-surface \
  --gate release.ready \
  --status declared \
  --verifier codex-v20-release-manager \
  --evidence-ref docs/plans/v20-release-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v20-goal-workbench-active-goal-surface \
  --gate release.ready \
  --status declared \
  --verifier codex-v20-release-manager \
  --evidence-ref docs/plans/v20-release-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```
