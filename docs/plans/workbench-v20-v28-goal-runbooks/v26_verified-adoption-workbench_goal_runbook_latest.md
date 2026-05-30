# v26 Plan + /goal Runbook: Verified Adoption Workbench

Date: 2026-05-29  
Goal id: `v26-verified-adoption-workbench`  
Baseline: `v25 controlled implementation lane`  
Release name: `v26 Verified Adoption Workbench`

## Correction note

This runbook intentionally does **not** use the old v8 command surface as the Workbench button/action baseline. The primary product surface for this version is the latest goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older commands such as `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` may still exist, but they are not the main Workbench model for this version.

## Product purpose

把 v12 verified adoption 变成 Workbench 路径：从 isolated workspace 结果到 main worktree 采纳，不再让用户手动记 adopt --run / inspect / confirm。

## Product spine

```text
Confirmed isolated workspace run -> plan adoption -> inspect patch/recovery -> confirm adoption -> verify main -> register gate.
```

## Tasks

- task-1: Adoption candidate panel — 用户知道哪些实现结果可以采纳。
- task-2: Adoption plan flow — 用户能在 UI 里冻结采纳 patch。
- task-3: Adoption inspect/recovery view — 采纳失败或中断时用户能恢复判断。
- task-4: Confirm adoption + post-apply next action — 用户能从实现结果推进到 main worktree。
- task-5: Adoption tests/docs — 确保 adoption 是 verified workflow，不是直接 git apply 按钮。

## Non-goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval or release readiness from file names, branch names, commit messages, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge or auto-tag unless this exact version/task explicitly says so.

## Task 0: bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v26-verified-adoption-workbench-plan-2026-05-29.md`
- Execution prompt doc: `docs/plans/v26-verified-adoption-workbench-execution-prompts-2026-05-29.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v26-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v26 Task 0：为 `v26-verified-adoption-workbench` 写 plan/runbook 和 execution prompts，并用最新 v19 goal init / goal-status 流程注册该 goal。

目标：
- 写入 plan doc：docs/plans/v26-verified-adoption-workbench-plan-2026-05-29.md
- 写入 execution prompt doc：docs/plans/v26-verified-adoption-workbench-execution-prompts-2026-05-29.md
- Goal id：v26-verified-adoption-workbench
- Baseline：v25 controlled implementation lane
- 版本目标：Verified Adoption Workbench
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
  --from docs/plans/v26-verified-adoption-workbench-plan-2026-05-29.md \
  --goal v26-verified-adoption-workbench \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v26-verified-adoption-workbench-plan-2026-05-29.md \
  --goal v26-verified-adoption-workbench \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
pnpm --silent symphony goal next --goal v26-verified-adoption-workbench --json
```


---

# task-1: Adoption candidate panel

Branch: `v26-task-1-adoption-candidate-panel`  
Worker evidence: `docs/plans/v26-task-1-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v26-task-1-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v26-task-1-main-verification-evidence-2026-05-29.md`

## User-visible value

用户知道哪些实现结果可以采纳。

## Implementation scope

识别可 adoption 的 confirmed run，展示 source run、workspace、evidence、changed files、verifier status。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
pnpm --silent symphony goal next --goal v26-verified-adoption-workbench --json
git checkout -b v26-task-1-adoption-candidate-panel
```

## Worker prompt

```text
/goal
执行 v26 task-1 worker implementation：Adoption candidate panel。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v26-verified-adoption-workbench。
- 当前任务：task-1。
- 当前分支必须是：v26-task-1-adoption-candidate-panel。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v26-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v26-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 识别可 adoption 的 confirmed run，展示 source run、workspace、evidence、changed files、verifier status。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v26-task-1-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v26 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v26-task-1-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v26-verified-adoption-workbench
- Task id: task-1
- Branch: v26-task-1-adoption-candidate-panel
- User-visible value: 用户知道哪些实现结果可以采纳。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
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
git commit -m "Implement v26 task-1: Adoption candidate panel"

pnpm --silent symphony goal update \
  --goal v26-verified-adoption-workbench \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v26-task-1-worker \
  --evidence-ref docs/plans/v26-task-1-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v26-verified-adoption-workbench \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v26-task-1-worker \
  --evidence-ref docs/plans/v26-task-1-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v26 task-1 independent reviewer review。

目标：
- 审查当前分支 `v26-task-1-adoption-candidate-panel` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v26-task-1-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v26 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户知道哪些实现结果可以采纳。
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
- 写入 review evidence：docs/plans/v26-task-1-review-evidence-2026-05-29.md
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
  --goal v26-verified-adoption-workbench \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v26-task-1-reviewer \
  --evidence-ref docs/plans/v26-task-1-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v26-verified-adoption-workbench \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v26-task-1-reviewer \
  --evidence-ref docs/plans/v26-task-1-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v26 task-1 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-1.
- Review evidence: docs/plans/v26-task-1-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v26-task-1-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v26 task-1 main verification。

前提：
- v26-task-1-adoption-candidate-panel 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v26-task-1-adoption-candidate-panel
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
- 写入 main verification evidence：docs/plans/v26-task-1-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v26-verified-adoption-workbench
- Task id: task-1
- Branch: v26-task-1-adoption-candidate-panel
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
  --goal v26-verified-adoption-workbench \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v26-main-verifier \
  --evidence-ref docs/plans/v26-task-1-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v26-verified-adoption-workbench \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v26-main-verifier \
  --evidence-ref docs/plans/v26-task-1-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v26-verified-adoption-workbench --json
```


---

# task-2: Adoption plan flow

Branch: `v26-task-2-adoption-plan-flow`  
Worker evidence: `docs/plans/v26-task-2-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v26-task-2-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v26-task-2-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能在 UI 里冻结采纳 patch。

## Implementation scope

调用 symphony adopt --run <confirmed-run-id> --json，显示 adoptionPlanId、patchArtifactPath、file operations、confirmationCommand。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
pnpm --silent symphony goal next --goal v26-verified-adoption-workbench --json
git checkout -b v26-task-2-adoption-plan-flow
```

## Worker prompt

```text
/goal
执行 v26 task-2 worker implementation：Adoption plan flow。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v26-verified-adoption-workbench。
- 当前任务：task-2。
- 当前分支必须是：v26-task-2-adoption-plan-flow。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v26-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v26-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 调用 symphony adopt --run <confirmed-run-id> --json，显示 adoptionPlanId、patchArtifactPath、file operations、confirmationCommand。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v26-task-2-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v26 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v26-task-2-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v26-verified-adoption-workbench
- Task id: task-2
- Branch: v26-task-2-adoption-plan-flow
- User-visible value: 用户能在 UI 里冻结采纳 patch。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
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
git commit -m "Implement v26 task-2: Adoption plan flow"

pnpm --silent symphony goal update \
  --goal v26-verified-adoption-workbench \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v26-task-2-worker \
  --evidence-ref docs/plans/v26-task-2-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v26-verified-adoption-workbench \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v26-task-2-worker \
  --evidence-ref docs/plans/v26-task-2-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v26 task-2 independent reviewer review。

目标：
- 审查当前分支 `v26-task-2-adoption-plan-flow` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v26-task-2-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v26 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能在 UI 里冻结采纳 patch。
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
- 写入 review evidence：docs/plans/v26-task-2-review-evidence-2026-05-29.md
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
  --goal v26-verified-adoption-workbench \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v26-task-2-reviewer \
  --evidence-ref docs/plans/v26-task-2-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v26-verified-adoption-workbench \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v26-task-2-reviewer \
  --evidence-ref docs/plans/v26-task-2-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v26 task-2 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-2.
- Review evidence: docs/plans/v26-task-2-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v26-task-2-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v26 task-2 main verification。

前提：
- v26-task-2-adoption-plan-flow 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v26-task-2-adoption-plan-flow
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
- 写入 main verification evidence：docs/plans/v26-task-2-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v26-verified-adoption-workbench
- Task id: task-2
- Branch: v26-task-2-adoption-plan-flow
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
  --goal v26-verified-adoption-workbench \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v26-main-verifier \
  --evidence-ref docs/plans/v26-task-2-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v26-verified-adoption-workbench \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v26-main-verifier \
  --evidence-ref docs/plans/v26-task-2-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v26-verified-adoption-workbench --json
```


---

# task-3: Adoption inspect/recovery view

Branch: `v26-task-3-adoption-inspect-recovery-view`  
Worker evidence: `docs/plans/v26-task-3-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v26-task-3-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v26-task-3-main-verification-evidence-2026-05-29.md`

## User-visible value

采纳失败或中断时用户能恢复判断。

## Implementation scope

接入 symphony adopt --inspect <adoption-id> --json，显示 journal、applying 状态、before/after hash、dirty blockers。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
pnpm --silent symphony goal next --goal v26-verified-adoption-workbench --json
git checkout -b v26-task-3-adoption-inspect-recovery-view
```

## Worker prompt

```text
/goal
执行 v26 task-3 worker implementation：Adoption inspect/recovery view。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v26-verified-adoption-workbench。
- 当前任务：task-3。
- 当前分支必须是：v26-task-3-adoption-inspect-recovery-view。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v26-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v26-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 接入 symphony adopt --inspect <adoption-id> --json，显示 journal、applying 状态、before/after hash、dirty blockers。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v26-task-3-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v26 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v26-task-3-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v26-verified-adoption-workbench
- Task id: task-3
- Branch: v26-task-3-adoption-inspect-recovery-view
- User-visible value: 采纳失败或中断时用户能恢复判断。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
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
git commit -m "Implement v26 task-3: Adoption inspect/recovery view"

pnpm --silent symphony goal update \
  --goal v26-verified-adoption-workbench \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v26-task-3-worker \
  --evidence-ref docs/plans/v26-task-3-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v26-verified-adoption-workbench \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v26-task-3-worker \
  --evidence-ref docs/plans/v26-task-3-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v26 task-3 independent reviewer review。

目标：
- 审查当前分支 `v26-task-3-adoption-inspect-recovery-view` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v26-task-3-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v26 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：采纳失败或中断时用户能恢复判断。
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
- 写入 review evidence：docs/plans/v26-task-3-review-evidence-2026-05-29.md
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
  --goal v26-verified-adoption-workbench \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v26-task-3-reviewer \
  --evidence-ref docs/plans/v26-task-3-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v26-verified-adoption-workbench \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v26-task-3-reviewer \
  --evidence-ref docs/plans/v26-task-3-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v26 task-3 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-3.
- Review evidence: docs/plans/v26-task-3-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v26-task-3-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v26 task-3 main verification。

前提：
- v26-task-3-adoption-inspect-recovery-view 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v26-task-3-adoption-inspect-recovery-view
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
- 写入 main verification evidence：docs/plans/v26-task-3-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v26-verified-adoption-workbench
- Task id: task-3
- Branch: v26-task-3-adoption-inspect-recovery-view
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
  --goal v26-verified-adoption-workbench \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v26-main-verifier \
  --evidence-ref docs/plans/v26-task-3-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v26-verified-adoption-workbench \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v26-main-verifier \
  --evidence-ref docs/plans/v26-task-3-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v26-verified-adoption-workbench --json
```


---

# task-4: Confirm adoption + post-apply next action

Branch: `v26-task-4-confirm-adoption-post-apply-next-action`  
Worker evidence: `docs/plans/v26-task-4-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v26-task-4-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v26-task-4-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能从实现结果推进到 main worktree。

## Implementation scope

调用 symphony adopt --confirm <adoption-id> --json，完成后转到 v24 main verification 或 v27 review loop。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
pnpm --silent symphony goal next --goal v26-verified-adoption-workbench --json
git checkout -b v26-task-4-confirm-adoption-post-apply-next-action
```

## Worker prompt

```text
/goal
执行 v26 task-4 worker implementation：Confirm adoption + post-apply next action。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v26-verified-adoption-workbench。
- 当前任务：task-4。
- 当前分支必须是：v26-task-4-confirm-adoption-post-apply-next-action。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v26-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v26-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 调用 symphony adopt --confirm <adoption-id> --json，完成后转到 v24 main verification 或 v27 review loop。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v26-task-4-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v26 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v26-task-4-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v26-verified-adoption-workbench
- Task id: task-4
- Branch: v26-task-4-confirm-adoption-post-apply-next-action
- User-visible value: 用户能从实现结果推进到 main worktree。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
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
git commit -m "Implement v26 task-4: Confirm adoption + post-apply next action"

pnpm --silent symphony goal update \
  --goal v26-verified-adoption-workbench \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v26-task-4-worker \
  --evidence-ref docs/plans/v26-task-4-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v26-verified-adoption-workbench \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v26-task-4-worker \
  --evidence-ref docs/plans/v26-task-4-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v26 task-4 independent reviewer review。

目标：
- 审查当前分支 `v26-task-4-confirm-adoption-post-apply-next-action` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v26-task-4-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v26 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能从实现结果推进到 main worktree。
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
- 写入 review evidence：docs/plans/v26-task-4-review-evidence-2026-05-29.md
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
  --goal v26-verified-adoption-workbench \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v26-task-4-reviewer \
  --evidence-ref docs/plans/v26-task-4-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v26-verified-adoption-workbench \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v26-task-4-reviewer \
  --evidence-ref docs/plans/v26-task-4-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v26 task-4 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-4.
- Review evidence: docs/plans/v26-task-4-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v26-task-4-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v26 task-4 main verification。

前提：
- v26-task-4-confirm-adoption-post-apply-next-action 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v26-task-4-confirm-adoption-post-apply-next-action
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
- 写入 main verification evidence：docs/plans/v26-task-4-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v26-verified-adoption-workbench
- Task id: task-4
- Branch: v26-task-4-confirm-adoption-post-apply-next-action
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
  --goal v26-verified-adoption-workbench \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v26-main-verifier \
  --evidence-ref docs/plans/v26-task-4-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v26-verified-adoption-workbench \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v26-main-verifier \
  --evidence-ref docs/plans/v26-task-4-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v26-verified-adoption-workbench --json
```


---

# task-5: Adoption tests/docs

Branch: `v26-task-5-adoption-tests-docs`  
Worker evidence: `docs/plans/v26-task-5-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v26-task-5-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v26-task-5-main-verification-evidence-2026-05-29.md`

## User-visible value

确保 adoption 是 verified workflow，不是直接 git apply 按钮。

## Implementation scope

覆盖 dirty worktree、unsupported changes、stale fingerprint、inspect、confirm、post-verify next action。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
pnpm --silent symphony goal next --goal v26-verified-adoption-workbench --json
git checkout -b v26-task-5-adoption-tests-docs
```

## Worker prompt

```text
/goal
执行 v26 task-5 worker implementation：Adoption tests/docs。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v26-verified-adoption-workbench。
- 当前任务：task-5。
- 当前分支必须是：v26-task-5-adoption-tests-docs。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v26-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v26-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 覆盖 dirty worktree、unsupported changes、stale fingerprint、inspect、confirm、post-verify next action。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v26-task-5-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v26 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v26-task-5-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v26-verified-adoption-workbench
- Task id: task-5
- Branch: v26-task-5-adoption-tests-docs
- User-visible value: 确保 adoption 是 verified workflow，不是直接 git apply 按钮。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
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
git commit -m "Implement v26 task-5: Adoption tests/docs"

pnpm --silent symphony goal update \
  --goal v26-verified-adoption-workbench \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v26-task-5-worker \
  --evidence-ref docs/plans/v26-task-5-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v26-verified-adoption-workbench \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v26-task-5-worker \
  --evidence-ref docs/plans/v26-task-5-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v26 task-5 independent reviewer review。

目标：
- 审查当前分支 `v26-task-5-adoption-tests-docs` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v26-task-5-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v26 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：确保 adoption 是 verified workflow，不是直接 git apply 按钮。
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
- 写入 review evidence：docs/plans/v26-task-5-review-evidence-2026-05-29.md
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
  --goal v26-verified-adoption-workbench \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v26-task-5-reviewer \
  --evidence-ref docs/plans/v26-task-5-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v26-verified-adoption-workbench \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v26-task-5-reviewer \
  --evidence-ref docs/plans/v26-task-5-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v26 task-5 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-5.
- Review evidence: docs/plans/v26-task-5-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v26-task-5-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v26 task-5 main verification。

前提：
- v26-task-5-adoption-tests-docs 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v26-task-5-adoption-tests-docs
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v26-verified-adoption-workbench --json
- 写入 main verification evidence：docs/plans/v26-task-5-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v26-verified-adoption-workbench
- Task id: task-5
- Branch: v26-task-5-adoption-tests-docs
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
  --goal v26-verified-adoption-workbench \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v26-main-verifier \
  --evidence-ref docs/plans/v26-task-5-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v26-verified-adoption-workbench \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v26-main-verifier \
  --evidence-ref docs/plans/v26-task-5-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v26-verified-adoption-workbench --json
```


---

# Release closeout for v26

## Release manager prompt

```text
/goal
执行 v26 release closeout。

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
- pnpm --silent symphony goal closeout --goal v26-verified-adoption-workbench --markdown
- 写 release evidence：docs/plans/v26-release-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v26-verified-adoption-workbench
- Release name: v26 Verified Adoption Workbench
- Main commit
- Commands and exact results
- Closeout gaps: none, or explicit blockers
- Boundary: Workbench 主线基于 latest goal/runbook flow，不是 v8 action dashboard
- Tag/release recommendation
```

## Release.ready gate

```bash
pnpm --silent symphony goal closeout --goal v26-verified-adoption-workbench --markdown

pnpm --silent symphony goal gate \
  --goal v26-verified-adoption-workbench \
  --gate release.ready \
  --status declared \
  --verifier codex-v26-release-manager \
  --evidence-ref docs/plans/v26-release-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v26-verified-adoption-workbench \
  --gate release.ready \
  --status declared \
  --verifier codex-v26-release-manager \
  --evidence-ref docs/plans/v26-release-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```
