# v25 Plan + /goal Runbook: Controlled Implementation Lane

Date: 2026-05-29  
Goal id: `v25-controlled-implementation-lane`  
Baseline: `v24 main verification workbench`  
Release name: `v25 Controlled Implementation Lane`

## Correction note

This runbook intentionally does **not** use the old v8 command surface as the Workbench button/action baseline. The primary product surface for this version is the latest goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older commands such as `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` may still exist, but they are not the main Workbench model for this version.

## Product purpose

把最新受控执行能力接进 goal/task，而不是做 v8 do 按钮。用户从 Active Goal task 出发，创建 implementation plan，确认执行，拿到 isolated workspace 结果并登记 evidence。

## Product spine

```text
Select current task -> generate worker prompt -> create controlled implementation plan -> confirm isolated workspace run -> record worker evidence.
```

## Tasks

- task-1: Task-to-execution-plan bridge — 用户能从 task 进入受控实现计划。
- task-2: Execution plan review UI — 用户能看懂执行计划再确认。
- task-3: Confirm isolated workspace execution — 用户能从 Workbench 启动受控实现。
- task-4: Post-run worker evidence flow — 实现结果能回到 goal event ledger。
- task-5: Controlled implementation tests/docs — 保证这不是任意 shell 按钮。

## Non-goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval or release readiness from file names, branch names, commit messages, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge or auto-tag unless this exact version/task explicitly says so.

## Task 0: bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v25-controlled-implementation-lane-plan-2026-05-29.md`
- Execution prompt doc: `docs/plans/v25-controlled-implementation-lane-execution-prompts-2026-05-29.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v25-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v25 Task 0：为 `v25-controlled-implementation-lane` 写 plan/runbook 和 execution prompts，并用最新 v19 goal init / goal-status 流程注册该 goal。

目标：
- 写入 plan doc：docs/plans/v25-controlled-implementation-lane-plan-2026-05-29.md
- 写入 execution prompt doc：docs/plans/v25-controlled-implementation-lane-execution-prompts-2026-05-29.md
- Goal id：v25-controlled-implementation-lane
- Baseline：v24 main verification workbench
- 版本目标：Controlled Implementation Lane
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
  --from docs/plans/v25-controlled-implementation-lane-plan-2026-05-29.md \
  --goal v25-controlled-implementation-lane \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v25-controlled-implementation-lane-plan-2026-05-29.md \
  --goal v25-controlled-implementation-lane \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json
```


---

# task-1: Task-to-execution-plan bridge

Branch: `v25-task-1-task-to-execution-plan-bridge`  
Worker evidence: `docs/plans/v25-task-1-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v25-task-1-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v25-task-1-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能从 task 进入受控实现计划。

## Implementation scope

从 active goal task 和 goal prompt 生成 controlled implementation request，调用 symphony do --write --json 只创建 frozen plan。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json
git checkout -b v25-task-1-task-to-execution-plan-bridge
```

## Worker prompt

```text
/goal
执行 v25 task-1 worker implementation：Task-to-execution-plan bridge。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v25-controlled-implementation-lane。
- 当前任务：task-1。
- 当前分支必须是：v25-task-1-task-to-execution-plan-bridge。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v25-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v25-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 从 active goal task 和 goal prompt 生成 controlled implementation request，调用 symphony do --write --json 只创建 frozen plan。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v25-task-1-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v25 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v25-task-1-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v25-controlled-implementation-lane
- Task id: task-1
- Branch: v25-task-1-task-to-execution-plan-bridge
- User-visible value: 用户能从 task 进入受控实现计划。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
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
git commit -m "Implement v25 task-1: Task-to-execution-plan bridge"

pnpm --silent symphony goal update \
  --goal v25-controlled-implementation-lane \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v25-task-1-worker \
  --evidence-ref docs/plans/v25-task-1-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v25-controlled-implementation-lane \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v25-task-1-worker \
  --evidence-ref docs/plans/v25-task-1-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v25 task-1 independent reviewer review。

目标：
- 审查当前分支 `v25-task-1-task-to-execution-plan-bridge` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v25-task-1-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v25 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能从 task 进入受控实现计划。
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
- 写入 review evidence：docs/plans/v25-task-1-review-evidence-2026-05-29.md
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
  --goal v25-controlled-implementation-lane \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v25-task-1-reviewer \
  --evidence-ref docs/plans/v25-task-1-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v25-controlled-implementation-lane \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v25-task-1-reviewer \
  --evidence-ref docs/plans/v25-task-1-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v25 task-1 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-1.
- Review evidence: docs/plans/v25-task-1-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v25-task-1-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v25 task-1 main verification。

前提：
- v25-task-1-task-to-execution-plan-bridge 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v25-task-1-task-to-execution-plan-bridge
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
- 写入 main verification evidence：docs/plans/v25-task-1-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v25-controlled-implementation-lane
- Task id: task-1
- Branch: v25-task-1-task-to-execution-plan-bridge
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
  --goal v25-controlled-implementation-lane \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v25-main-verifier \
  --evidence-ref docs/plans/v25-task-1-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v25-controlled-implementation-lane \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v25-main-verifier \
  --evidence-ref docs/plans/v25-task-1-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json
```


---

# task-2: Execution plan review UI

Branch: `v25-task-2-execution-plan-review-ui`  
Worker evidence: `docs/plans/v25-task-2-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v25-task-2-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v25-task-2-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能看懂执行计划再确认。

## Implementation scope

展示 executionPlanId、confirmationCommand、writeBoundary、workspaceWrites、requiresGate、expected changed files/evidence。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json
git checkout -b v25-task-2-execution-plan-review-ui
```

## Worker prompt

```text
/goal
执行 v25 task-2 worker implementation：Execution plan review UI。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v25-controlled-implementation-lane。
- 当前任务：task-2。
- 当前分支必须是：v25-task-2-execution-plan-review-ui。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v25-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v25-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 展示 executionPlanId、confirmationCommand、writeBoundary、workspaceWrites、requiresGate、expected changed files/evidence。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v25-task-2-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v25 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v25-task-2-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v25-controlled-implementation-lane
- Task id: task-2
- Branch: v25-task-2-execution-plan-review-ui
- User-visible value: 用户能看懂执行计划再确认。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
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
git commit -m "Implement v25 task-2: Execution plan review UI"

pnpm --silent symphony goal update \
  --goal v25-controlled-implementation-lane \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v25-task-2-worker \
  --evidence-ref docs/plans/v25-task-2-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v25-controlled-implementation-lane \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v25-task-2-worker \
  --evidence-ref docs/plans/v25-task-2-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v25 task-2 independent reviewer review。

目标：
- 审查当前分支 `v25-task-2-execution-plan-review-ui` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v25-task-2-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v25 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能看懂执行计划再确认。
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
- 写入 review evidence：docs/plans/v25-task-2-review-evidence-2026-05-29.md
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
  --goal v25-controlled-implementation-lane \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v25-task-2-reviewer \
  --evidence-ref docs/plans/v25-task-2-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v25-controlled-implementation-lane \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v25-task-2-reviewer \
  --evidence-ref docs/plans/v25-task-2-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v25 task-2 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-2.
- Review evidence: docs/plans/v25-task-2-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v25-task-2-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v25 task-2 main verification。

前提：
- v25-task-2-execution-plan-review-ui 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v25-task-2-execution-plan-review-ui
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
- 写入 main verification evidence：docs/plans/v25-task-2-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v25-controlled-implementation-lane
- Task id: task-2
- Branch: v25-task-2-execution-plan-review-ui
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
  --goal v25-controlled-implementation-lane \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v25-main-verifier \
  --evidence-ref docs/plans/v25-task-2-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v25-controlled-implementation-lane \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v25-main-verifier \
  --evidence-ref docs/plans/v25-task-2-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json
```


---

# task-3: Confirm isolated workspace execution

Branch: `v25-task-3-confirm-isolated-workspace-execution`  
Worker evidence: `docs/plans/v25-task-3-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v25-task-3-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v25-task-3-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能从 Workbench 启动受控实现。

## Implementation scope

调用 symphony do --confirm-plan <plan-id> --json，并把结果接入 v23 run console。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json
git checkout -b v25-task-3-confirm-isolated-workspace-execution
```

## Worker prompt

```text
/goal
执行 v25 task-3 worker implementation：Confirm isolated workspace execution。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v25-controlled-implementation-lane。
- 当前任务：task-3。
- 当前分支必须是：v25-task-3-confirm-isolated-workspace-execution。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v25-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v25-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 调用 symphony do --confirm-plan <plan-id> --json，并把结果接入 v23 run console。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v25-task-3-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v25 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v25-task-3-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v25-controlled-implementation-lane
- Task id: task-3
- Branch: v25-task-3-confirm-isolated-workspace-execution
- User-visible value: 用户能从 Workbench 启动受控实现。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
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
git commit -m "Implement v25 task-3: Confirm isolated workspace execution"

pnpm --silent symphony goal update \
  --goal v25-controlled-implementation-lane \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v25-task-3-worker \
  --evidence-ref docs/plans/v25-task-3-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v25-controlled-implementation-lane \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v25-task-3-worker \
  --evidence-ref docs/plans/v25-task-3-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v25 task-3 independent reviewer review。

目标：
- 审查当前分支 `v25-task-3-confirm-isolated-workspace-execution` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v25-task-3-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v25 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能从 Workbench 启动受控实现。
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
- 写入 review evidence：docs/plans/v25-task-3-review-evidence-2026-05-29.md
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
  --goal v25-controlled-implementation-lane \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v25-task-3-reviewer \
  --evidence-ref docs/plans/v25-task-3-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v25-controlled-implementation-lane \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v25-task-3-reviewer \
  --evidence-ref docs/plans/v25-task-3-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v25 task-3 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-3.
- Review evidence: docs/plans/v25-task-3-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v25-task-3-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v25 task-3 main verification。

前提：
- v25-task-3-confirm-isolated-workspace-execution 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v25-task-3-confirm-isolated-workspace-execution
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
- 写入 main verification evidence：docs/plans/v25-task-3-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v25-controlled-implementation-lane
- Task id: task-3
- Branch: v25-task-3-confirm-isolated-workspace-execution
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
  --goal v25-controlled-implementation-lane \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v25-main-verifier \
  --evidence-ref docs/plans/v25-task-3-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v25-controlled-implementation-lane \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v25-main-verifier \
  --evidence-ref docs/plans/v25-task-3-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json
```


---

# task-4: Post-run worker evidence flow

Branch: `v25-task-4-post-run-worker-evidence-flow`  
Worker evidence: `docs/plans/v25-task-4-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v25-task-4-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v25-task-4-main-verification-evidence-2026-05-29.md`

## User-visible value

实现结果能回到 goal event ledger。

## Implementation scope

把 confirmed run 的 evidenceArtifactPath/sourceWorkspacePath 转成 worker evidence registration 表单和 prompt handoff。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json
git checkout -b v25-task-4-post-run-worker-evidence-flow
```

## Worker prompt

```text
/goal
执行 v25 task-4 worker implementation：Post-run worker evidence flow。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v25-controlled-implementation-lane。
- 当前任务：task-4。
- 当前分支必须是：v25-task-4-post-run-worker-evidence-flow。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v25-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v25-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 把 confirmed run 的 evidenceArtifactPath/sourceWorkspacePath 转成 worker evidence registration 表单和 prompt handoff。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v25-task-4-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v25 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v25-task-4-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v25-controlled-implementation-lane
- Task id: task-4
- Branch: v25-task-4-post-run-worker-evidence-flow
- User-visible value: 实现结果能回到 goal event ledger。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
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
git commit -m "Implement v25 task-4: Post-run worker evidence flow"

pnpm --silent symphony goal update \
  --goal v25-controlled-implementation-lane \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v25-task-4-worker \
  --evidence-ref docs/plans/v25-task-4-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v25-controlled-implementation-lane \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v25-task-4-worker \
  --evidence-ref docs/plans/v25-task-4-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v25 task-4 independent reviewer review。

目标：
- 审查当前分支 `v25-task-4-post-run-worker-evidence-flow` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v25-task-4-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v25 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：实现结果能回到 goal event ledger。
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
- 写入 review evidence：docs/plans/v25-task-4-review-evidence-2026-05-29.md
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
  --goal v25-controlled-implementation-lane \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v25-task-4-reviewer \
  --evidence-ref docs/plans/v25-task-4-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v25-controlled-implementation-lane \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v25-task-4-reviewer \
  --evidence-ref docs/plans/v25-task-4-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v25 task-4 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-4.
- Review evidence: docs/plans/v25-task-4-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v25-task-4-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v25 task-4 main verification。

前提：
- v25-task-4-post-run-worker-evidence-flow 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v25-task-4-post-run-worker-evidence-flow
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
- 写入 main verification evidence：docs/plans/v25-task-4-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v25-controlled-implementation-lane
- Task id: task-4
- Branch: v25-task-4-post-run-worker-evidence-flow
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
  --goal v25-controlled-implementation-lane \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v25-main-verifier \
  --evidence-ref docs/plans/v25-task-4-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v25-controlled-implementation-lane \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v25-main-verifier \
  --evidence-ref docs/plans/v25-task-4-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json
```


---

# task-5: Controlled implementation tests/docs

Branch: `v25-task-5-controlled-implementation-tests-docs`  
Worker evidence: `docs/plans/v25-task-5-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v25-task-5-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v25-task-5-main-verification-evidence-2026-05-29.md`

## User-visible value

保证这不是任意 shell 按钮。

## Implementation scope

使用 fake/frozen fixtures 覆盖 plan、confirm、missing gate、stale fingerprint、worker evidence registration。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json
git checkout -b v25-task-5-controlled-implementation-tests-docs
```

## Worker prompt

```text
/goal
执行 v25 task-5 worker implementation：Controlled implementation tests/docs。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v25-controlled-implementation-lane。
- 当前任务：task-5。
- 当前分支必须是：v25-task-5-controlled-implementation-tests-docs。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v25-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v25-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 使用 fake/frozen fixtures 覆盖 plan、confirm、missing gate、stale fingerprint、worker evidence registration。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v25-task-5-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v25 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v25-task-5-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v25-controlled-implementation-lane
- Task id: task-5
- Branch: v25-task-5-controlled-implementation-tests-docs
- User-visible value: 保证这不是任意 shell 按钮。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
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
git commit -m "Implement v25 task-5: Controlled implementation tests/docs"

pnpm --silent symphony goal update \
  --goal v25-controlled-implementation-lane \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v25-task-5-worker \
  --evidence-ref docs/plans/v25-task-5-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v25-controlled-implementation-lane \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v25-task-5-worker \
  --evidence-ref docs/plans/v25-task-5-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v25 task-5 independent reviewer review。

目标：
- 审查当前分支 `v25-task-5-controlled-implementation-tests-docs` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v25-task-5-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v25 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：保证这不是任意 shell 按钮。
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
- 写入 review evidence：docs/plans/v25-task-5-review-evidence-2026-05-29.md
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
  --goal v25-controlled-implementation-lane \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v25-task-5-reviewer \
  --evidence-ref docs/plans/v25-task-5-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v25-controlled-implementation-lane \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v25-task-5-reviewer \
  --evidence-ref docs/plans/v25-task-5-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v25 task-5 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-5.
- Review evidence: docs/plans/v25-task-5-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v25-task-5-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v25 task-5 main verification。

前提：
- v25-task-5-controlled-implementation-tests-docs 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v25-task-5-controlled-implementation-tests-docs
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json
- 写入 main verification evidence：docs/plans/v25-task-5-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v25-controlled-implementation-lane
- Task id: task-5
- Branch: v25-task-5-controlled-implementation-tests-docs
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
  --goal v25-controlled-implementation-lane \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v25-main-verifier \
  --evidence-ref docs/plans/v25-task-5-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v25-controlled-implementation-lane \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v25-main-verifier \
  --evidence-ref docs/plans/v25-task-5-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json
```


---

# Release closeout for v25

## Release manager prompt

```text
/goal
执行 v25 release closeout。

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
- pnpm --silent symphony goal closeout --goal v25-controlled-implementation-lane --markdown
- 写 release evidence：docs/plans/v25-release-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v25-controlled-implementation-lane
- Release name: v25 Controlled Implementation Lane
- Main commit
- Commands and exact results
- Closeout gaps: none, or explicit blockers
- Boundary: Workbench 主线基于 latest goal/runbook flow，不是 v8 action dashboard
- Tag/release recommendation
```

## Release.ready gate

```bash
pnpm --silent symphony goal closeout --goal v25-controlled-implementation-lane --markdown

pnpm --silent symphony goal gate \
  --goal v25-controlled-implementation-lane \
  --gate release.ready \
  --status declared \
  --verifier codex-v25-release-manager \
  --evidence-ref docs/plans/v25-release-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v25-controlled-implementation-lane \
  --gate release.ready \
  --status declared \
  --verifier codex-v25-release-manager \
  --evidence-ref docs/plans/v25-release-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```
