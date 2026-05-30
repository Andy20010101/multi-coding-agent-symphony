# v21 Plan + /goal Runbook: Workbench Goal Event Registration

Date: 2026-05-29  
Goal id: `v21-goal-event-registration-workbench`  
Baseline: `v20 Active Goal Surface`  
Release name: `v21 Workbench Goal Event Registration`

## Correction note

This runbook intentionally does **not** use the old v8 command surface as the Workbench button/action baseline. The primary product surface for this version is the latest goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older commands such as `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` may still exist, but they are not the main Workbench model for this version.

## Product purpose

让 Workbench 第一次真正推进 goal 状态：不是执行 v8 工作命令，而是通过最新的 goal update/review/gate dry-run + confirm 记录 worker/reviewer/main-verification 事件。

## Product spine

```text
Open Next Action -> choose event to record -> run goal update/review/gate dry-run -> inspect plan hash -> confirm event -> timeline refreshes.
```

## Tasks

- task-1: Goal event form model — 用户能从当前 next action 进入正确事件表单。
- task-2: Dry-run plan preview endpoint — 用户能在 UI 里预览事件登记计划，而不是复制命令到终端试。
- task-3: Confirm event append flow — 用户能在 Workbench 里完成一次 evidence event 登记。
- task-4: Evidence ref helper — 用户少手动复制 evidence 路径，同时不靠文件名推断状态。
- task-5: Event registration tests and docs — 保证 Workbench 写入的是受控 goal event，而不是前端自造状态。

## Non-goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval or release readiness from file names, branch names, commit messages, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge or auto-tag unless this exact version/task explicitly says so.

## Task 0: bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v21-workbench-goal-event-registration-plan-2026-05-29.md`
- Execution prompt doc: `docs/plans/v21-workbench-goal-event-registration-execution-prompts-2026-05-29.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v21-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v21 Task 0：为 `v21-goal-event-registration-workbench` 写 plan/runbook 和 execution prompts，并用最新 v19 goal init / goal-status 流程注册该 goal。

目标：
- 写入 plan doc：docs/plans/v21-workbench-goal-event-registration-plan-2026-05-29.md
- 写入 execution prompt doc：docs/plans/v21-workbench-goal-event-registration-execution-prompts-2026-05-29.md
- Goal id：v21-goal-event-registration-workbench
- Baseline：v20 Active Goal Surface
- 版本目标：Workbench Goal Event Registration
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
  --from docs/plans/v21-workbench-goal-event-registration-plan-2026-05-29.md \
  --goal v21-goal-event-registration-workbench \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v21-workbench-goal-event-registration-plan-2026-05-29.md \
  --goal v21-goal-event-registration-workbench \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json
```


---

# task-1: Goal event form model

Branch: `v21-task-1-goal-event-form-model`  
Worker evidence: `docs/plans/v21-task-1-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v21-task-1-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v21-task-1-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能从当前 next action 进入正确事件表单。

## Implementation scope

实现 worker.started、worker.evidence-recorded、worker.self-check-*、blocker.*、reviewer verdict、main-verification gate 的表单/view model。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json
git checkout -b v21-task-1-goal-event-form-model
```

## Worker prompt

```text
/goal
执行 v21 task-1 worker implementation：Goal event form model。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v21-goal-event-registration-workbench。
- 当前任务：task-1。
- 当前分支必须是：v21-task-1-goal-event-form-model。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v21-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v21-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 实现 worker.started、worker.evidence-recorded、worker.self-check-*、blocker.*、reviewer verdict、main-verification gate 的表单/view model。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v21-task-1-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v21 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v21-task-1-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v21-goal-event-registration-workbench
- Task id: task-1
- Branch: v21-task-1-goal-event-form-model
- User-visible value: 用户能从当前 next action 进入正确事件表单。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
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
git commit -m "Implement v21 task-1: Goal event form model"

pnpm --silent symphony goal update \
  --goal v21-goal-event-registration-workbench \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v21-task-1-worker \
  --evidence-ref docs/plans/v21-task-1-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v21-goal-event-registration-workbench \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v21-task-1-worker \
  --evidence-ref docs/plans/v21-task-1-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v21 task-1 independent reviewer review。

目标：
- 审查当前分支 `v21-task-1-goal-event-form-model` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v21-task-1-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v21 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能从当前 next action 进入正确事件表单。
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
- 写入 review evidence：docs/plans/v21-task-1-review-evidence-2026-05-29.md
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
  --goal v21-goal-event-registration-workbench \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v21-task-1-reviewer \
  --evidence-ref docs/plans/v21-task-1-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v21-goal-event-registration-workbench \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v21-task-1-reviewer \
  --evidence-ref docs/plans/v21-task-1-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v21 task-1 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-1.
- Review evidence: docs/plans/v21-task-1-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v21-task-1-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v21 task-1 main verification。

前提：
- v21-task-1-goal-event-form-model 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v21-task-1-goal-event-form-model
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
- 写入 main verification evidence：docs/plans/v21-task-1-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v21-goal-event-registration-workbench
- Task id: task-1
- Branch: v21-task-1-goal-event-form-model
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
  --goal v21-goal-event-registration-workbench \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v21-main-verifier \
  --evidence-ref docs/plans/v21-task-1-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v21-goal-event-registration-workbench \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v21-main-verifier \
  --evidence-ref docs/plans/v21-task-1-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json
```


---

# task-2: Dry-run plan preview endpoint

Branch: `v21-task-2-dry-run-plan-preview-endpoint`  
Worker evidence: `docs/plans/v21-task-2-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v21-task-2-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v21-task-2-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能在 UI 里预览事件登记计划，而不是复制命令到终端试。

## Implementation scope

新增 Workbench 后端只针对 symphony goal update/review/gate 的 dry-run 预览端点，返回 plan hash 和将写入的 event 摘要。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json
git checkout -b v21-task-2-dry-run-plan-preview-endpoint
```

## Worker prompt

```text
/goal
执行 v21 task-2 worker implementation：Dry-run plan preview endpoint。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v21-goal-event-registration-workbench。
- 当前任务：task-2。
- 当前分支必须是：v21-task-2-dry-run-plan-preview-endpoint。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v21-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v21-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 新增 Workbench 后端只针对 symphony goal update/review/gate 的 dry-run 预览端点，返回 plan hash 和将写入的 event 摘要。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v21-task-2-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v21 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v21-task-2-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v21-goal-event-registration-workbench
- Task id: task-2
- Branch: v21-task-2-dry-run-plan-preview-endpoint
- User-visible value: 用户能在 UI 里预览事件登记计划，而不是复制命令到终端试。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
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
git commit -m "Implement v21 task-2: Dry-run plan preview endpoint"

pnpm --silent symphony goal update \
  --goal v21-goal-event-registration-workbench \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v21-task-2-worker \
  --evidence-ref docs/plans/v21-task-2-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v21-goal-event-registration-workbench \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v21-task-2-worker \
  --evidence-ref docs/plans/v21-task-2-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v21 task-2 independent reviewer review。

目标：
- 审查当前分支 `v21-task-2-dry-run-plan-preview-endpoint` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v21-task-2-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v21 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能在 UI 里预览事件登记计划，而不是复制命令到终端试。
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
- 写入 review evidence：docs/plans/v21-task-2-review-evidence-2026-05-29.md
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
  --goal v21-goal-event-registration-workbench \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v21-task-2-reviewer \
  --evidence-ref docs/plans/v21-task-2-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v21-goal-event-registration-workbench \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v21-task-2-reviewer \
  --evidence-ref docs/plans/v21-task-2-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v21 task-2 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-2.
- Review evidence: docs/plans/v21-task-2-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v21-task-2-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v21 task-2 main verification。

前提：
- v21-task-2-dry-run-plan-preview-endpoint 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v21-task-2-dry-run-plan-preview-endpoint
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
- 写入 main verification evidence：docs/plans/v21-task-2-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v21-goal-event-registration-workbench
- Task id: task-2
- Branch: v21-task-2-dry-run-plan-preview-endpoint
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
  --goal v21-goal-event-registration-workbench \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v21-main-verifier \
  --evidence-ref docs/plans/v21-task-2-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v21-goal-event-registration-workbench \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v21-main-verifier \
  --evidence-ref docs/plans/v21-task-2-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json
```


---

# task-3: Confirm event append flow

Branch: `v21-task-3-confirm-event-append-flow`  
Worker evidence: `docs/plans/v21-task-3-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v21-task-3-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v21-task-3-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能在 Workbench 里完成一次 evidence event 登记。

## Implementation scope

新增 confirm flow，使用 dry-run 返回的 plan hash 调用对应 goal command confirm，然后刷新 goal-status/events。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json
git checkout -b v21-task-3-confirm-event-append-flow
```

## Worker prompt

```text
/goal
执行 v21 task-3 worker implementation：Confirm event append flow。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v21-goal-event-registration-workbench。
- 当前任务：task-3。
- 当前分支必须是：v21-task-3-confirm-event-append-flow。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v21-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v21-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 新增 confirm flow，使用 dry-run 返回的 plan hash 调用对应 goal command confirm，然后刷新 goal-status/events。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v21-task-3-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v21 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v21-task-3-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v21-goal-event-registration-workbench
- Task id: task-3
- Branch: v21-task-3-confirm-event-append-flow
- User-visible value: 用户能在 Workbench 里完成一次 evidence event 登记。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
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
git commit -m "Implement v21 task-3: Confirm event append flow"

pnpm --silent symphony goal update \
  --goal v21-goal-event-registration-workbench \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v21-task-3-worker \
  --evidence-ref docs/plans/v21-task-3-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v21-goal-event-registration-workbench \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v21-task-3-worker \
  --evidence-ref docs/plans/v21-task-3-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v21 task-3 independent reviewer review。

目标：
- 审查当前分支 `v21-task-3-confirm-event-append-flow` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v21-task-3-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v21 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能在 Workbench 里完成一次 evidence event 登记。
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
- 写入 review evidence：docs/plans/v21-task-3-review-evidence-2026-05-29.md
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
  --goal v21-goal-event-registration-workbench \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v21-task-3-reviewer \
  --evidence-ref docs/plans/v21-task-3-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v21-goal-event-registration-workbench \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v21-task-3-reviewer \
  --evidence-ref docs/plans/v21-task-3-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v21 task-3 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-3.
- Review evidence: docs/plans/v21-task-3-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v21-task-3-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v21 task-3 main verification。

前提：
- v21-task-3-confirm-event-append-flow 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v21-task-3-confirm-event-append-flow
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
- 写入 main verification evidence：docs/plans/v21-task-3-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v21-goal-event-registration-workbench
- Task id: task-3
- Branch: v21-task-3-confirm-event-append-flow
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
  --goal v21-goal-event-registration-workbench \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v21-main-verifier \
  --evidence-ref docs/plans/v21-task-3-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v21-goal-event-registration-workbench \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v21-main-verifier \
  --evidence-ref docs/plans/v21-task-3-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json
```


---

# task-4: Evidence ref helper

Branch: `v21-task-4-evidence-ref-helper`  
Worker evidence: `docs/plans/v21-task-4-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v21-task-4-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v21-task-4-main-verification-evidence-2026-05-29.md`

## User-visible value

用户少手动复制 evidence 路径，同时不靠文件名推断状态。

## Implementation scope

为 docs/plans 或 managed artifact refs 提供 evidence ref 输入、近期 evidence refs 选择和错误展示。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json
git checkout -b v21-task-4-evidence-ref-helper
```

## Worker prompt

```text
/goal
执行 v21 task-4 worker implementation：Evidence ref helper。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v21-goal-event-registration-workbench。
- 当前任务：task-4。
- 当前分支必须是：v21-task-4-evidence-ref-helper。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v21-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v21-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 为 docs/plans 或 managed artifact refs 提供 evidence ref 输入、近期 evidence refs 选择和错误展示。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v21-task-4-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v21 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v21-task-4-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v21-goal-event-registration-workbench
- Task id: task-4
- Branch: v21-task-4-evidence-ref-helper
- User-visible value: 用户少手动复制 evidence 路径，同时不靠文件名推断状态。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
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
git commit -m "Implement v21 task-4: Evidence ref helper"

pnpm --silent symphony goal update \
  --goal v21-goal-event-registration-workbench \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v21-task-4-worker \
  --evidence-ref docs/plans/v21-task-4-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v21-goal-event-registration-workbench \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v21-task-4-worker \
  --evidence-ref docs/plans/v21-task-4-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v21 task-4 independent reviewer review。

目标：
- 审查当前分支 `v21-task-4-evidence-ref-helper` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v21-task-4-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v21 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户少手动复制 evidence 路径，同时不靠文件名推断状态。
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
- 写入 review evidence：docs/plans/v21-task-4-review-evidence-2026-05-29.md
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
  --goal v21-goal-event-registration-workbench \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v21-task-4-reviewer \
  --evidence-ref docs/plans/v21-task-4-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v21-goal-event-registration-workbench \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v21-task-4-reviewer \
  --evidence-ref docs/plans/v21-task-4-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v21 task-4 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-4.
- Review evidence: docs/plans/v21-task-4-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v21-task-4-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v21 task-4 main verification。

前提：
- v21-task-4-evidence-ref-helper 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v21-task-4-evidence-ref-helper
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
- 写入 main verification evidence：docs/plans/v21-task-4-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v21-goal-event-registration-workbench
- Task id: task-4
- Branch: v21-task-4-evidence-ref-helper
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
  --goal v21-goal-event-registration-workbench \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v21-main-verifier \
  --evidence-ref docs/plans/v21-task-4-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v21-goal-event-registration-workbench \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v21-main-verifier \
  --evidence-ref docs/plans/v21-task-4-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json
```


---

# task-5: Event registration tests and docs

Branch: `v21-task-5-event-registration-tests-and-docs`  
Worker evidence: `docs/plans/v21-task-5-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v21-task-5-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v21-task-5-main-verification-evidence-2026-05-29.md`

## User-visible value

保证 Workbench 写入的是受控 goal event，而不是前端自造状态。

## Implementation scope

覆盖 worker event、review approved/needs-revision、main verification gate 的成功/失败路径。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json
git checkout -b v21-task-5-event-registration-tests-and-docs
```

## Worker prompt

```text
/goal
执行 v21 task-5 worker implementation：Event registration tests and docs。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v21-goal-event-registration-workbench。
- 当前任务：task-5。
- 当前分支必须是：v21-task-5-event-registration-tests-and-docs。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v21-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v21-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 覆盖 worker event、review approved/needs-revision、main verification gate 的成功/失败路径。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v21-task-5-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v21 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v21-task-5-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v21-goal-event-registration-workbench
- Task id: task-5
- Branch: v21-task-5-event-registration-tests-and-docs
- User-visible value: 保证 Workbench 写入的是受控 goal event，而不是前端自造状态。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
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
git commit -m "Implement v21 task-5: Event registration tests and docs"

pnpm --silent symphony goal update \
  --goal v21-goal-event-registration-workbench \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v21-task-5-worker \
  --evidence-ref docs/plans/v21-task-5-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v21-goal-event-registration-workbench \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v21-task-5-worker \
  --evidence-ref docs/plans/v21-task-5-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v21 task-5 independent reviewer review。

目标：
- 审查当前分支 `v21-task-5-event-registration-tests-and-docs` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v21-task-5-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v21 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：保证 Workbench 写入的是受控 goal event，而不是前端自造状态。
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
- 写入 review evidence：docs/plans/v21-task-5-review-evidence-2026-05-29.md
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
  --goal v21-goal-event-registration-workbench \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v21-task-5-reviewer \
  --evidence-ref docs/plans/v21-task-5-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v21-goal-event-registration-workbench \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v21-task-5-reviewer \
  --evidence-ref docs/plans/v21-task-5-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v21 task-5 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-5.
- Review evidence: docs/plans/v21-task-5-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v21-task-5-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v21 task-5 main verification。

前提：
- v21-task-5-event-registration-tests-and-docs 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v21-task-5-event-registration-tests-and-docs
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json
- 写入 main verification evidence：docs/plans/v21-task-5-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v21-goal-event-registration-workbench
- Task id: task-5
- Branch: v21-task-5-event-registration-tests-and-docs
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
  --goal v21-goal-event-registration-workbench \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v21-main-verifier \
  --evidence-ref docs/plans/v21-task-5-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v21-goal-event-registration-workbench \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v21-main-verifier \
  --evidence-ref docs/plans/v21-task-5-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json
```


---

# Release closeout for v21

## Release manager prompt

```text
/goal
执行 v21 release closeout。

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
- pnpm --silent symphony goal closeout --goal v21-goal-event-registration-workbench --markdown
- 写 release evidence：docs/plans/v21-release-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v21-goal-event-registration-workbench
- Release name: v21 Workbench Goal Event Registration
- Main commit
- Commands and exact results
- Closeout gaps: none, or explicit blockers
- Boundary: Workbench 主线基于 latest goal/runbook flow，不是 v8 action dashboard
- Tag/release recommendation
```

## Release.ready gate

```bash
pnpm --silent symphony goal closeout --goal v21-goal-event-registration-workbench --markdown

pnpm --silent symphony goal gate \
  --goal v21-goal-event-registration-workbench \
  --gate release.ready \
  --status declared \
  --verifier codex-v21-release-manager \
  --evidence-ref docs/plans/v21-release-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v21-goal-event-registration-workbench \
  --gate release.ready \
  --status declared \
  --verifier codex-v21-release-manager \
  --evidence-ref docs/plans/v21-release-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```
