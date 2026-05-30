# v27 Plan + /goal Runbook: Review Revision Loop

Date: 2026-05-29  
Goal id: `v27-review-revision-loop`  
Baseline: `v26 verified adoption workbench`  
Release name: `v27 Review Revision Loop`

## Correction note

This runbook intentionally does **not** use the old v8 command surface as the Workbench button/action baseline. The primary product surface for this version is the latest goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older commands such as `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` may still exist, but they are not the main Workbench model for this version.

## Product purpose

把独立 reviewer/subagent 和 revision loop 做成 Workbench 闭环。重点不是新增 reviewer 框架，而是让 needs-revision 能直接回到下一轮 worker prompt。

## Product spine

```text
Changed task result -> independent reviewer prompt -> register verdict -> if failed generate revision prompt -> rerun worker -> verify again.
```

## Tasks

- task-1: Review workspace for active task — reviewer 能从 UI 获取完整审查上下文。
- task-2: Independent reviewer handoff — 独立 reviewer/subagent 可以直接接手。
- task-3: Review verdict registration — review 结果能真实推进 ledger。
- task-4: Revision prompt generator — 失败后不再手工整理返工 prompt。
- task-5: Review/revision tests/docs — 实现完整 review -> revision -> verify loop。

## Non-goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval or release readiness from file names, branch names, commit messages, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge or auto-tag unless this exact version/task explicitly says so.

## Task 0: bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v27-review-revision-loop-plan-2026-05-29.md`
- Execution prompt doc: `docs/plans/v27-review-revision-loop-execution-prompts-2026-05-29.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v27-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v27 Task 0：为 `v27-review-revision-loop` 写 plan/runbook 和 execution prompts，并用最新 v19 goal init / goal-status 流程注册该 goal。

目标：
- 写入 plan doc：docs/plans/v27-review-revision-loop-plan-2026-05-29.md
- 写入 execution prompt doc：docs/plans/v27-review-revision-loop-execution-prompts-2026-05-29.md
- Goal id：v27-review-revision-loop
- Baseline：v26 verified adoption workbench
- 版本目标：Review Revision Loop
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
  --from docs/plans/v27-review-revision-loop-plan-2026-05-29.md \
  --goal v27-review-revision-loop \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v27-review-revision-loop-plan-2026-05-29.md \
  --goal v27-review-revision-loop \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
pnpm --silent symphony goal next --goal v27-review-revision-loop --json
```


---

# task-1: Review workspace for active task

Branch: `v27-task-1-review-workspace-for-active-task`  
Worker evidence: `docs/plans/v27-task-1-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v27-task-1-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v27-task-1-main-verification-evidence-2026-05-29.md`

## User-visible value

reviewer 能从 UI 获取完整审查上下文。

## Implementation scope

展示 changed files、source run、worker evidence、review prompt、review checklist、expected verdict event。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
pnpm --silent symphony goal next --goal v27-review-revision-loop --json
git checkout -b v27-task-1-review-workspace-for-active-task
```

## Worker prompt

```text
/goal
执行 v27 task-1 worker implementation：Review workspace for active task。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v27-review-revision-loop。
- 当前任务：task-1。
- 当前分支必须是：v27-task-1-review-workspace-for-active-task。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v27-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v27-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 展示 changed files、source run、worker evidence、review prompt、review checklist、expected verdict event。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v27-review-revision-loop --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v27-task-1-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v27 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v27-task-1-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v27-review-revision-loop
- Task id: task-1
- Branch: v27-task-1-review-workspace-for-active-task
- User-visible value: reviewer 能从 UI 获取完整审查上下文。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
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
git commit -m "Implement v27 task-1: Review workspace for active task"

pnpm --silent symphony goal update \
  --goal v27-review-revision-loop \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v27-task-1-worker \
  --evidence-ref docs/plans/v27-task-1-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v27-review-revision-loop \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v27-task-1-worker \
  --evidence-ref docs/plans/v27-task-1-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v27 task-1 independent reviewer review。

目标：
- 审查当前分支 `v27-task-1-review-workspace-for-active-task` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v27-task-1-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v27 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：reviewer 能从 UI 获取完整审查上下文。
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
- 写入 review evidence：docs/plans/v27-task-1-review-evidence-2026-05-29.md
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
  --goal v27-review-revision-loop \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v27-task-1-reviewer \
  --evidence-ref docs/plans/v27-task-1-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v27-review-revision-loop \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v27-task-1-reviewer \
  --evidence-ref docs/plans/v27-task-1-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v27 task-1 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-1.
- Review evidence: docs/plans/v27-task-1-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v27-task-1-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v27 task-1 main verification。

前提：
- v27-task-1-review-workspace-for-active-task 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v27-task-1-review-workspace-for-active-task
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
- 写入 main verification evidence：docs/plans/v27-task-1-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v27-review-revision-loop
- Task id: task-1
- Branch: v27-task-1-review-workspace-for-active-task
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
  --goal v27-review-revision-loop \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v27-main-verifier \
  --evidence-ref docs/plans/v27-task-1-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v27-review-revision-loop \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v27-main-verifier \
  --evidence-ref docs/plans/v27-task-1-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v27-review-revision-loop --json
```


---

# task-2: Independent reviewer handoff

Branch: `v27-task-2-independent-reviewer-handoff`  
Worker evidence: `docs/plans/v27-task-2-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v27-task-2-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v27-task-2-main-verification-evidence-2026-05-29.md`

## User-visible value

独立 reviewer/subagent 可以直接接手。

## Implementation scope

从 goal prompt 生成 reviewer prompt，强制标记 reviewer 与 worker 分离，并记录 reviewer evidence path。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
pnpm --silent symphony goal next --goal v27-review-revision-loop --json
git checkout -b v27-task-2-independent-reviewer-handoff
```

## Worker prompt

```text
/goal
执行 v27 task-2 worker implementation：Independent reviewer handoff。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v27-review-revision-loop。
- 当前任务：task-2。
- 当前分支必须是：v27-task-2-independent-reviewer-handoff。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v27-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v27-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 从 goal prompt 生成 reviewer prompt，强制标记 reviewer 与 worker 分离，并记录 reviewer evidence path。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v27-review-revision-loop --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v27-task-2-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v27 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v27-task-2-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v27-review-revision-loop
- Task id: task-2
- Branch: v27-task-2-independent-reviewer-handoff
- User-visible value: 独立 reviewer/subagent 可以直接接手。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
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
git commit -m "Implement v27 task-2: Independent reviewer handoff"

pnpm --silent symphony goal update \
  --goal v27-review-revision-loop \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v27-task-2-worker \
  --evidence-ref docs/plans/v27-task-2-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v27-review-revision-loop \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v27-task-2-worker \
  --evidence-ref docs/plans/v27-task-2-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v27 task-2 independent reviewer review。

目标：
- 审查当前分支 `v27-task-2-independent-reviewer-handoff` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v27-task-2-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v27 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：独立 reviewer/subagent 可以直接接手。
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
- 写入 review evidence：docs/plans/v27-task-2-review-evidence-2026-05-29.md
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
  --goal v27-review-revision-loop \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v27-task-2-reviewer \
  --evidence-ref docs/plans/v27-task-2-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v27-review-revision-loop \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v27-task-2-reviewer \
  --evidence-ref docs/plans/v27-task-2-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v27 task-2 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-2.
- Review evidence: docs/plans/v27-task-2-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v27-task-2-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v27 task-2 main verification。

前提：
- v27-task-2-independent-reviewer-handoff 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v27-task-2-independent-reviewer-handoff
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
- 写入 main verification evidence：docs/plans/v27-task-2-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v27-review-revision-loop
- Task id: task-2
- Branch: v27-task-2-independent-reviewer-handoff
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
  --goal v27-review-revision-loop \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v27-main-verifier \
  --evidence-ref docs/plans/v27-task-2-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v27-review-revision-loop \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v27-main-verifier \
  --evidence-ref docs/plans/v27-task-2-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v27-review-revision-loop --json
```


---

# task-3: Review verdict registration

Branch: `v27-task-3-review-verdict-registration`  
Worker evidence: `docs/plans/v27-task-3-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v27-task-3-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v27-task-3-main-verification-evidence-2026-05-29.md`

## User-visible value

review 结果能真实推进 ledger。

## Implementation scope

复用 goal review dry-run/confirm 登记 approved 或 needs-revision，并刷新 task state。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
pnpm --silent symphony goal next --goal v27-review-revision-loop --json
git checkout -b v27-task-3-review-verdict-registration
```

## Worker prompt

```text
/goal
执行 v27 task-3 worker implementation：Review verdict registration。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v27-review-revision-loop。
- 当前任务：task-3。
- 当前分支必须是：v27-task-3-review-verdict-registration。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v27-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v27-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 复用 goal review dry-run/confirm 登记 approved 或 needs-revision，并刷新 task state。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v27-review-revision-loop --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v27-task-3-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v27 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v27-task-3-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v27-review-revision-loop
- Task id: task-3
- Branch: v27-task-3-review-verdict-registration
- User-visible value: review 结果能真实推进 ledger。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
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
git commit -m "Implement v27 task-3: Review verdict registration"

pnpm --silent symphony goal update \
  --goal v27-review-revision-loop \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v27-task-3-worker \
  --evidence-ref docs/plans/v27-task-3-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v27-review-revision-loop \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v27-task-3-worker \
  --evidence-ref docs/plans/v27-task-3-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v27 task-3 independent reviewer review。

目标：
- 审查当前分支 `v27-task-3-review-verdict-registration` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v27-task-3-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v27 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：review 结果能真实推进 ledger。
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
- 写入 review evidence：docs/plans/v27-task-3-review-evidence-2026-05-29.md
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
  --goal v27-review-revision-loop \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v27-task-3-reviewer \
  --evidence-ref docs/plans/v27-task-3-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v27-review-revision-loop \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v27-task-3-reviewer \
  --evidence-ref docs/plans/v27-task-3-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v27 task-3 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-3.
- Review evidence: docs/plans/v27-task-3-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v27-task-3-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v27 task-3 main verification。

前提：
- v27-task-3-review-verdict-registration 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v27-task-3-review-verdict-registration
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
- 写入 main verification evidence：docs/plans/v27-task-3-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v27-review-revision-loop
- Task id: task-3
- Branch: v27-task-3-review-verdict-registration
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
  --goal v27-review-revision-loop \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v27-main-verifier \
  --evidence-ref docs/plans/v27-task-3-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v27-review-revision-loop \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v27-main-verifier \
  --evidence-ref docs/plans/v27-task-3-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v27-review-revision-loop --json
```


---

# task-4: Revision prompt generator

Branch: `v27-task-4-revision-prompt-generator`  
Worker evidence: `docs/plans/v27-task-4-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v27-task-4-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v27-task-4-main-verification-evidence-2026-05-29.md`

## User-visible value

失败后不再手工整理返工 prompt。

## Implementation scope

当 needs-revision 或 verification failed 时，生成 worker revision prompt，包含 blockers、失败命令、changed files、acceptance delta。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
pnpm --silent symphony goal next --goal v27-review-revision-loop --json
git checkout -b v27-task-4-revision-prompt-generator
```

## Worker prompt

```text
/goal
执行 v27 task-4 worker implementation：Revision prompt generator。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v27-review-revision-loop。
- 当前任务：task-4。
- 当前分支必须是：v27-task-4-revision-prompt-generator。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v27-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v27-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 当 needs-revision 或 verification failed 时，生成 worker revision prompt，包含 blockers、失败命令、changed files、acceptance delta。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v27-review-revision-loop --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v27-task-4-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v27 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v27-task-4-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v27-review-revision-loop
- Task id: task-4
- Branch: v27-task-4-revision-prompt-generator
- User-visible value: 失败后不再手工整理返工 prompt。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
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
git commit -m "Implement v27 task-4: Revision prompt generator"

pnpm --silent symphony goal update \
  --goal v27-review-revision-loop \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v27-task-4-worker \
  --evidence-ref docs/plans/v27-task-4-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v27-review-revision-loop \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v27-task-4-worker \
  --evidence-ref docs/plans/v27-task-4-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v27 task-4 independent reviewer review。

目标：
- 审查当前分支 `v27-task-4-revision-prompt-generator` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v27-task-4-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v27 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：失败后不再手工整理返工 prompt。
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
- 写入 review evidence：docs/plans/v27-task-4-review-evidence-2026-05-29.md
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
  --goal v27-review-revision-loop \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v27-task-4-reviewer \
  --evidence-ref docs/plans/v27-task-4-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v27-review-revision-loop \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v27-task-4-reviewer \
  --evidence-ref docs/plans/v27-task-4-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v27 task-4 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-4.
- Review evidence: docs/plans/v27-task-4-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v27-task-4-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v27 task-4 main verification。

前提：
- v27-task-4-revision-prompt-generator 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v27-task-4-revision-prompt-generator
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
- 写入 main verification evidence：docs/plans/v27-task-4-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v27-review-revision-loop
- Task id: task-4
- Branch: v27-task-4-revision-prompt-generator
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
  --goal v27-review-revision-loop \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v27-main-verifier \
  --evidence-ref docs/plans/v27-task-4-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v27-review-revision-loop \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v27-main-verifier \
  --evidence-ref docs/plans/v27-task-4-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v27-review-revision-loop --json
```


---

# task-5: Review/revision tests/docs

Branch: `v27-task-5-review-revision-tests-docs`  
Worker evidence: `docs/plans/v27-task-5-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v27-task-5-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v27-task-5-main-verification-evidence-2026-05-29.md`

## User-visible value

实现完整 review -> revision -> verify loop。

## Implementation scope

覆盖 approved、needs-revision、failed verification、revision prompt、二次 worker handoff。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
pnpm --silent symphony goal next --goal v27-review-revision-loop --json
git checkout -b v27-task-5-review-revision-tests-docs
```

## Worker prompt

```text
/goal
执行 v27 task-5 worker implementation：Review/revision tests/docs。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v27-review-revision-loop。
- 当前任务：task-5。
- 当前分支必须是：v27-task-5-review-revision-tests-docs。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v27-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v27-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 覆盖 approved、needs-revision、failed verification、revision prompt、二次 worker handoff。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v27-review-revision-loop --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v27-task-5-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v27 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v27-task-5-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v27-review-revision-loop
- Task id: task-5
- Branch: v27-task-5-review-revision-tests-docs
- User-visible value: 实现完整 review -> revision -> verify loop。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
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
git commit -m "Implement v27 task-5: Review/revision tests/docs"

pnpm --silent symphony goal update \
  --goal v27-review-revision-loop \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v27-task-5-worker \
  --evidence-ref docs/plans/v27-task-5-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v27-review-revision-loop \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v27-task-5-worker \
  --evidence-ref docs/plans/v27-task-5-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v27 task-5 independent reviewer review。

目标：
- 审查当前分支 `v27-task-5-review-revision-tests-docs` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v27-task-5-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v27 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：实现完整 review -> revision -> verify loop。
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
- 写入 review evidence：docs/plans/v27-task-5-review-evidence-2026-05-29.md
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
  --goal v27-review-revision-loop \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v27-task-5-reviewer \
  --evidence-ref docs/plans/v27-task-5-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v27-review-revision-loop \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v27-task-5-reviewer \
  --evidence-ref docs/plans/v27-task-5-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v27 task-5 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-5.
- Review evidence: docs/plans/v27-task-5-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v27-task-5-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v27 task-5 main verification。

前提：
- v27-task-5-review-revision-tests-docs 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v27-task-5-review-revision-tests-docs
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v27-review-revision-loop --json
- 写入 main verification evidence：docs/plans/v27-task-5-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v27-review-revision-loop
- Task id: task-5
- Branch: v27-task-5-review-revision-tests-docs
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
  --goal v27-review-revision-loop \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v27-main-verifier \
  --evidence-ref docs/plans/v27-task-5-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v27-review-revision-loop \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v27-main-verifier \
  --evidence-ref docs/plans/v27-task-5-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v27-review-revision-loop --json
```


---

# Release closeout for v27

## Release manager prompt

```text
/goal
执行 v27 release closeout。

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
- pnpm --silent symphony goal closeout --goal v27-review-revision-loop --markdown
- 写 release evidence：docs/plans/v27-release-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v27-review-revision-loop
- Release name: v27 Review Revision Loop
- Main commit
- Commands and exact results
- Closeout gaps: none, or explicit blockers
- Boundary: Workbench 主线基于 latest goal/runbook flow，不是 v8 action dashboard
- Tag/release recommendation
```

## Release.ready gate

```bash
pnpm --silent symphony goal closeout --goal v27-review-revision-loop --markdown

pnpm --silent symphony goal gate \
  --goal v27-review-revision-loop \
  --gate release.ready \
  --status declared \
  --verifier codex-v27-release-manager \
  --evidence-ref docs/plans/v27-release-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v27-review-revision-loop \
  --gate release.ready \
  --status declared \
  --verifier codex-v27-release-manager \
  --evidence-ref docs/plans/v27-release-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```
