# v23 Plan + /goal Runbook: Goal Operation Run Console

Date: 2026-05-29  
Goal id: `v23-goal-operation-run-console`  
Baseline: `v22 prompt handoff workspace`  
Release name: `v23 Goal Operation Run Console`

## Correction note

This runbook intentionally does **not** use the old v8 command surface as the Workbench button/action baseline. The primary product surface for this version is the latest goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older commands such as `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` may still exist, but they are not the main Workbench model for this version.

## Product purpose

给 goal init/next/prompt/closeout/update/review/gate 等最新 goal 命令补真正的运行控制台，让 Workbench 能看操作过程和失败原因。

## Product spine

```text
Start a goal operation from Workbench -> see command, stdout/stderr, status, plan hash, event ids -> jump back to active goal.
```

## Tasks

- task-1: Goal operation run registry — 用户能追踪一次 goal 操作，不只看最终状态。
- task-2: Goal operation console UI — 用户能定位 goal command 失败在哪。
- task-3: Near-live log polling — 长一点的 goal/closeout 操作不会让用户盲等。
- task-4: Failure recovery shortcuts — 用户能从失败直接进入下一步，而不是回终端重查。
- task-5: Goal operation console tests/docs — 确保 console 服务最新 goal workflow。

## Non-goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval or release readiness from file names, branch names, commit messages, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge or auto-tag unless this exact version/task explicitly says so.

## Task 0: bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v23-goal-operation-run-console-plan-2026-05-29.md`
- Execution prompt doc: `docs/plans/v23-goal-operation-run-console-execution-prompts-2026-05-29.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v23-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v23 Task 0：为 `v23-goal-operation-run-console` 写 plan/runbook 和 execution prompts，并用最新 v19 goal init / goal-status 流程注册该 goal。

目标：
- 写入 plan doc：docs/plans/v23-goal-operation-run-console-plan-2026-05-29.md
- 写入 execution prompt doc：docs/plans/v23-goal-operation-run-console-execution-prompts-2026-05-29.md
- Goal id：v23-goal-operation-run-console
- Baseline：v22 prompt handoff workspace
- 版本目标：Goal Operation Run Console
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
  --from docs/plans/v23-goal-operation-run-console-plan-2026-05-29.md \
  --goal v23-goal-operation-run-console \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v23-goal-operation-run-console-plan-2026-05-29.md \
  --goal v23-goal-operation-run-console \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
pnpm --silent symphony goal next --goal v23-goal-operation-run-console --json
```


---

# task-1: Goal operation run registry

Branch: `v23-task-1-goal-operation-run-registry`  
Worker evidence: `docs/plans/v23-task-1-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v23-task-1-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v23-task-1-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能追踪一次 goal 操作，不只看最终状态。

## Implementation scope

为 Workbench 发起的 goal operations 记录 operation id、goal id、task id、role、command kind、status、timestamps。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
pnpm --silent symphony goal next --goal v23-goal-operation-run-console --json
git checkout -b v23-task-1-goal-operation-run-registry
```

## Worker prompt

```text
/goal
执行 v23 task-1 worker implementation：Goal operation run registry。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v23-goal-operation-run-console。
- 当前任务：task-1。
- 当前分支必须是：v23-task-1-goal-operation-run-registry。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v23-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v23-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 为 Workbench 发起的 goal operations 记录 operation id、goal id、task id、role、command kind、status、timestamps。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v23-task-1-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v23 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v23-task-1-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v23-goal-operation-run-console
- Task id: task-1
- Branch: v23-task-1-goal-operation-run-registry
- User-visible value: 用户能追踪一次 goal 操作，不只看最终状态。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
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
git commit -m "Implement v23 task-1: Goal operation run registry"

pnpm --silent symphony goal update \
  --goal v23-goal-operation-run-console \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v23-task-1-worker \
  --evidence-ref docs/plans/v23-task-1-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v23-goal-operation-run-console \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v23-task-1-worker \
  --evidence-ref docs/plans/v23-task-1-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v23 task-1 independent reviewer review。

目标：
- 审查当前分支 `v23-task-1-goal-operation-run-registry` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v23-task-1-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v23 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能追踪一次 goal 操作，不只看最终状态。
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
- 写入 review evidence：docs/plans/v23-task-1-review-evidence-2026-05-29.md
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
  --goal v23-goal-operation-run-console \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v23-task-1-reviewer \
  --evidence-ref docs/plans/v23-task-1-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v23-goal-operation-run-console \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v23-task-1-reviewer \
  --evidence-ref docs/plans/v23-task-1-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v23 task-1 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-1.
- Review evidence: docs/plans/v23-task-1-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v23-task-1-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v23 task-1 main verification。

前提：
- v23-task-1-goal-operation-run-registry 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v23-task-1-goal-operation-run-registry
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
- 写入 main verification evidence：docs/plans/v23-task-1-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v23-goal-operation-run-console
- Task id: task-1
- Branch: v23-task-1-goal-operation-run-registry
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
  --goal v23-goal-operation-run-console \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v23-main-verifier \
  --evidence-ref docs/plans/v23-task-1-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v23-goal-operation-run-console \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v23-main-verifier \
  --evidence-ref docs/plans/v23-task-1-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v23-goal-operation-run-console --json
```


---

# task-2: Goal operation console UI

Branch: `v23-task-2-goal-operation-console-ui`  
Worker evidence: `docs/plans/v23-task-2-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v23-task-2-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v23-task-2-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能定位 goal command 失败在哪。

## Implementation scope

新增 goal operation console，展示 command preview、stdout/stderr、exit code、plan hash、event id、next action。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
pnpm --silent symphony goal next --goal v23-goal-operation-run-console --json
git checkout -b v23-task-2-goal-operation-console-ui
```

## Worker prompt

```text
/goal
执行 v23 task-2 worker implementation：Goal operation console UI。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v23-goal-operation-run-console。
- 当前任务：task-2。
- 当前分支必须是：v23-task-2-goal-operation-console-ui。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v23-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v23-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 新增 goal operation console，展示 command preview、stdout/stderr、exit code、plan hash、event id、next action。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v23-task-2-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v23 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v23-task-2-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v23-goal-operation-run-console
- Task id: task-2
- Branch: v23-task-2-goal-operation-console-ui
- User-visible value: 用户能定位 goal command 失败在哪。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
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
git commit -m "Implement v23 task-2: Goal operation console UI"

pnpm --silent symphony goal update \
  --goal v23-goal-operation-run-console \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v23-task-2-worker \
  --evidence-ref docs/plans/v23-task-2-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v23-goal-operation-run-console \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v23-task-2-worker \
  --evidence-ref docs/plans/v23-task-2-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v23 task-2 independent reviewer review。

目标：
- 审查当前分支 `v23-task-2-goal-operation-console-ui` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v23-task-2-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v23 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能定位 goal command 失败在哪。
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
- 写入 review evidence：docs/plans/v23-task-2-review-evidence-2026-05-29.md
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
  --goal v23-goal-operation-run-console \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v23-task-2-reviewer \
  --evidence-ref docs/plans/v23-task-2-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v23-goal-operation-run-console \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v23-task-2-reviewer \
  --evidence-ref docs/plans/v23-task-2-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v23 task-2 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-2.
- Review evidence: docs/plans/v23-task-2-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v23-task-2-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v23 task-2 main verification。

前提：
- v23-task-2-goal-operation-console-ui 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v23-task-2-goal-operation-console-ui
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
- 写入 main verification evidence：docs/plans/v23-task-2-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v23-goal-operation-run-console
- Task id: task-2
- Branch: v23-task-2-goal-operation-console-ui
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
  --goal v23-goal-operation-run-console \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v23-main-verifier \
  --evidence-ref docs/plans/v23-task-2-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v23-goal-operation-run-console \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v23-main-verifier \
  --evidence-ref docs/plans/v23-task-2-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v23-goal-operation-run-console --json
```


---

# task-3: Near-live log polling

Branch: `v23-task-3-near-live-log-polling`  
Worker evidence: `docs/plans/v23-task-3-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v23-task-3-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v23-task-3-main-verification-evidence-2026-05-29.md`

## User-visible value

长一点的 goal/closeout 操作不会让用户盲等。

## Implementation scope

给 goal operations 增加 polling 或等价的 near-live 输出刷新，不要求完整 terminal emulator。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
pnpm --silent symphony goal next --goal v23-goal-operation-run-console --json
git checkout -b v23-task-3-near-live-log-polling
```

## Worker prompt

```text
/goal
执行 v23 task-3 worker implementation：Near-live log polling。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v23-goal-operation-run-console。
- 当前任务：task-3。
- 当前分支必须是：v23-task-3-near-live-log-polling。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v23-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v23-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 给 goal operations 增加 polling 或等价的 near-live 输出刷新，不要求完整 terminal emulator。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v23-task-3-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v23 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v23-task-3-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v23-goal-operation-run-console
- Task id: task-3
- Branch: v23-task-3-near-live-log-polling
- User-visible value: 长一点的 goal/closeout 操作不会让用户盲等。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
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
git commit -m "Implement v23 task-3: Near-live log polling"

pnpm --silent symphony goal update \
  --goal v23-goal-operation-run-console \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v23-task-3-worker \
  --evidence-ref docs/plans/v23-task-3-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v23-goal-operation-run-console \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v23-task-3-worker \
  --evidence-ref docs/plans/v23-task-3-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v23 task-3 independent reviewer review。

目标：
- 审查当前分支 `v23-task-3-near-live-log-polling` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v23-task-3-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v23 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：长一点的 goal/closeout 操作不会让用户盲等。
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
- 写入 review evidence：docs/plans/v23-task-3-review-evidence-2026-05-29.md
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
  --goal v23-goal-operation-run-console \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v23-task-3-reviewer \
  --evidence-ref docs/plans/v23-task-3-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v23-goal-operation-run-console \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v23-task-3-reviewer \
  --evidence-ref docs/plans/v23-task-3-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v23 task-3 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-3.
- Review evidence: docs/plans/v23-task-3-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v23-task-3-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v23 task-3 main verification。

前提：
- v23-task-3-near-live-log-polling 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v23-task-3-near-live-log-polling
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
- 写入 main verification evidence：docs/plans/v23-task-3-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v23-goal-operation-run-console
- Task id: task-3
- Branch: v23-task-3-near-live-log-polling
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
  --goal v23-goal-operation-run-console \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v23-main-verifier \
  --evidence-ref docs/plans/v23-task-3-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v23-goal-operation-run-console \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v23-main-verifier \
  --evidence-ref docs/plans/v23-task-3-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v23-goal-operation-run-console --json
```


---

# task-4: Failure recovery shortcuts

Branch: `v23-task-4-failure-recovery-shortcuts`  
Worker evidence: `docs/plans/v23-task-4-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v23-task-4-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v23-task-4-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能从失败直接进入下一步，而不是回终端重查。

## Implementation scope

失败时显示 retry dry-run、copy command、copy reviewer prompt、copy issue prompt。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
pnpm --silent symphony goal next --goal v23-goal-operation-run-console --json
git checkout -b v23-task-4-failure-recovery-shortcuts
```

## Worker prompt

```text
/goal
执行 v23 task-4 worker implementation：Failure recovery shortcuts。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v23-goal-operation-run-console。
- 当前任务：task-4。
- 当前分支必须是：v23-task-4-failure-recovery-shortcuts。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v23-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v23-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 失败时显示 retry dry-run、copy command、copy reviewer prompt、copy issue prompt。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v23-task-4-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v23 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v23-task-4-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v23-goal-operation-run-console
- Task id: task-4
- Branch: v23-task-4-failure-recovery-shortcuts
- User-visible value: 用户能从失败直接进入下一步，而不是回终端重查。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
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
git commit -m "Implement v23 task-4: Failure recovery shortcuts"

pnpm --silent symphony goal update \
  --goal v23-goal-operation-run-console \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v23-task-4-worker \
  --evidence-ref docs/plans/v23-task-4-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v23-goal-operation-run-console \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v23-task-4-worker \
  --evidence-ref docs/plans/v23-task-4-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v23 task-4 independent reviewer review。

目标：
- 审查当前分支 `v23-task-4-failure-recovery-shortcuts` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v23-task-4-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v23 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能从失败直接进入下一步，而不是回终端重查。
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
- 写入 review evidence：docs/plans/v23-task-4-review-evidence-2026-05-29.md
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
  --goal v23-goal-operation-run-console \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v23-task-4-reviewer \
  --evidence-ref docs/plans/v23-task-4-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v23-goal-operation-run-console \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v23-task-4-reviewer \
  --evidence-ref docs/plans/v23-task-4-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v23 task-4 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-4.
- Review evidence: docs/plans/v23-task-4-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v23-task-4-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v23 task-4 main verification。

前提：
- v23-task-4-failure-recovery-shortcuts 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v23-task-4-failure-recovery-shortcuts
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
- 写入 main verification evidence：docs/plans/v23-task-4-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v23-goal-operation-run-console
- Task id: task-4
- Branch: v23-task-4-failure-recovery-shortcuts
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
  --goal v23-goal-operation-run-console \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v23-main-verifier \
  --evidence-ref docs/plans/v23-task-4-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v23-goal-operation-run-console \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v23-main-verifier \
  --evidence-ref docs/plans/v23-task-4-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v23-goal-operation-run-console --json
```


---

# task-5: Goal operation console tests/docs

Branch: `v23-task-5-goal-operation-console-tests-docs`  
Worker evidence: `docs/plans/v23-task-5-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v23-task-5-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v23-task-5-main-verification-evidence-2026-05-29.md`

## User-visible value

确保 console 服务最新 goal workflow。

## Implementation scope

覆盖成功 dry-run、confirm、missing plan hash、goal not found、unsupported subcommand 等路径。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
pnpm --silent symphony goal next --goal v23-goal-operation-run-console --json
git checkout -b v23-task-5-goal-operation-console-tests-docs
```

## Worker prompt

```text
/goal
执行 v23 task-5 worker implementation：Goal operation console tests/docs。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v23-goal-operation-run-console。
- 当前任务：task-5。
- 当前分支必须是：v23-task-5-goal-operation-console-tests-docs。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v23-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v23-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 覆盖成功 dry-run、confirm、missing plan hash、goal not found、unsupported subcommand 等路径。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v23-task-5-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v23 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v23-task-5-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v23-goal-operation-run-console
- Task id: task-5
- Branch: v23-task-5-goal-operation-console-tests-docs
- User-visible value: 确保 console 服务最新 goal workflow。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
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
git commit -m "Implement v23 task-5: Goal operation console tests/docs"

pnpm --silent symphony goal update \
  --goal v23-goal-operation-run-console \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v23-task-5-worker \
  --evidence-ref docs/plans/v23-task-5-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v23-goal-operation-run-console \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v23-task-5-worker \
  --evidence-ref docs/plans/v23-task-5-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v23 task-5 independent reviewer review。

目标：
- 审查当前分支 `v23-task-5-goal-operation-console-tests-docs` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v23-task-5-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v23 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：确保 console 服务最新 goal workflow。
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
- 写入 review evidence：docs/plans/v23-task-5-review-evidence-2026-05-29.md
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
  --goal v23-goal-operation-run-console \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v23-task-5-reviewer \
  --evidence-ref docs/plans/v23-task-5-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v23-goal-operation-run-console \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v23-task-5-reviewer \
  --evidence-ref docs/plans/v23-task-5-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v23 task-5 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-5.
- Review evidence: docs/plans/v23-task-5-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v23-task-5-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v23 task-5 main verification。

前提：
- v23-task-5-goal-operation-console-tests-docs 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v23-task-5-goal-operation-console-tests-docs
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json
- 写入 main verification evidence：docs/plans/v23-task-5-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v23-goal-operation-run-console
- Task id: task-5
- Branch: v23-task-5-goal-operation-console-tests-docs
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
  --goal v23-goal-operation-run-console \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v23-main-verifier \
  --evidence-ref docs/plans/v23-task-5-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v23-goal-operation-run-console \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v23-main-verifier \
  --evidence-ref docs/plans/v23-task-5-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v23-goal-operation-run-console --json
```


---

# Release closeout for v23

## Release manager prompt

```text
/goal
执行 v23 release closeout。

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
- pnpm --silent symphony goal closeout --goal v23-goal-operation-run-console --markdown
- 写 release evidence：docs/plans/v23-release-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v23-goal-operation-run-console
- Release name: v23 Goal Operation Run Console
- Main commit
- Commands and exact results
- Closeout gaps: none, or explicit blockers
- Boundary: Workbench 主线基于 latest goal/runbook flow，不是 v8 action dashboard
- Tag/release recommendation
```

## Release.ready gate

```bash
pnpm --silent symphony goal closeout --goal v23-goal-operation-run-console --markdown

pnpm --silent symphony goal gate \
  --goal v23-goal-operation-run-console \
  --gate release.ready \
  --status declared \
  --verifier codex-v23-release-manager \
  --evidence-ref docs/plans/v23-release-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v23-goal-operation-run-console \
  --gate release.ready \
  --status declared \
  --verifier codex-v23-release-manager \
  --evidence-ref docs/plans/v23-release-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```
