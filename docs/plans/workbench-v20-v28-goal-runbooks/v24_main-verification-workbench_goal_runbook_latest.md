# v24 Plan + /goal Runbook: Main Verification Workbench

Date: 2026-05-29  
Goal id: `v24-main-verification-workbench`  
Baseline: `v23 goal operation run console`  
Release name: `v24 Main Verification Workbench`

## Correction note

This runbook intentionally does **not** use the old v8 command surface as the Workbench button/action baseline. The primary product surface for this version is the latest goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older commands such as `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` may still exist, but they are not the main Workbench model for this version.

## Product purpose

把 v19 流程里的 main verification 做成 Workbench 路径：合并前检查、运行验证、写 evidence、登记 goal gate。不是新增安全主题，而是减少主线验收手工步骤。

## Product spine

```text
Reviewer approved -> Workbench shows merge readiness -> run verification commands -> write evidence -> goal gate main-verification passed.
```

## Tasks

- task-1: Main verification readiness panel — 用户知道是否可以进入 main verification。
- task-2: Allowlisted verification runner — 用户能在 Workbench 里执行主线验证，而不是切终端。
- task-3: Main verification evidence writer — 用户不用手写验收证据。
- task-4: Main verification gate registration — 验证完成后 goal 状态能从 Workbench 推进。
- task-5: Main verification tests/docs — 把 task close loop 变成 Workbench 能力。

## Non-goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval or release readiness from file names, branch names, commit messages, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge or auto-tag unless this exact version/task explicitly says so.

## Task 0: bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v24-main-verification-workbench-plan-2026-05-29.md`
- Execution prompt doc: `docs/plans/v24-main-verification-workbench-execution-prompts-2026-05-29.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v24-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v24 Task 0：为 `v24-main-verification-workbench` 写 plan/runbook 和 execution prompts，并用最新 v19 goal init / goal-status 流程注册该 goal。

目标：
- 写入 plan doc：docs/plans/v24-main-verification-workbench-plan-2026-05-29.md
- 写入 execution prompt doc：docs/plans/v24-main-verification-workbench-execution-prompts-2026-05-29.md
- Goal id：v24-main-verification-workbench
- Baseline：v23 goal operation run console
- 版本目标：Main Verification Workbench
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
  --from docs/plans/v24-main-verification-workbench-plan-2026-05-29.md \
  --goal v24-main-verification-workbench \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v24-main-verification-workbench-plan-2026-05-29.md \
  --goal v24-main-verification-workbench \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
pnpm --silent symphony goal next --goal v24-main-verification-workbench --json
```


---

# task-1: Main verification readiness panel

Branch: `v24-task-1-main-verification-readiness-panel`  
Worker evidence: `docs/plans/v24-task-1-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v24-task-1-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v24-task-1-main-verification-evidence-2026-05-29.md`

## User-visible value

用户知道是否可以进入 main verification。

## Implementation scope

展示 reviewer.approved、branch/main 状态、ff-only merge 指引、required verification commands、evidence path。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
pnpm --silent symphony goal next --goal v24-main-verification-workbench --json
git checkout -b v24-task-1-main-verification-readiness-panel
```

## Worker prompt

```text
/goal
执行 v24 task-1 worker implementation：Main verification readiness panel。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v24-main-verification-workbench。
- 当前任务：task-1。
- 当前分支必须是：v24-task-1-main-verification-readiness-panel。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v24-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v24-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 展示 reviewer.approved、branch/main 状态、ff-only merge 指引、required verification commands、evidence path。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v24-task-1-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v24 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v24-task-1-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v24-main-verification-workbench
- Task id: task-1
- Branch: v24-task-1-main-verification-readiness-panel
- User-visible value: 用户知道是否可以进入 main verification。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
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
git commit -m "Implement v24 task-1: Main verification readiness panel"

pnpm --silent symphony goal update \
  --goal v24-main-verification-workbench \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v24-task-1-worker \
  --evidence-ref docs/plans/v24-task-1-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v24-main-verification-workbench \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v24-task-1-worker \
  --evidence-ref docs/plans/v24-task-1-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v24 task-1 independent reviewer review。

目标：
- 审查当前分支 `v24-task-1-main-verification-readiness-panel` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v24-task-1-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v24 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户知道是否可以进入 main verification。
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
- 写入 review evidence：docs/plans/v24-task-1-review-evidence-2026-05-29.md
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
  --goal v24-main-verification-workbench \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v24-task-1-reviewer \
  --evidence-ref docs/plans/v24-task-1-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v24-main-verification-workbench \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v24-task-1-reviewer \
  --evidence-ref docs/plans/v24-task-1-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v24 task-1 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-1.
- Review evidence: docs/plans/v24-task-1-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v24-task-1-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v24 task-1 main verification。

前提：
- v24-task-1-main-verification-readiness-panel 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v24-task-1-main-verification-readiness-panel
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
- 写入 main verification evidence：docs/plans/v24-task-1-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v24-main-verification-workbench
- Task id: task-1
- Branch: v24-task-1-main-verification-readiness-panel
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
  --goal v24-main-verification-workbench \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v24-main-verifier \
  --evidence-ref docs/plans/v24-task-1-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v24-main-verification-workbench \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v24-main-verifier \
  --evidence-ref docs/plans/v24-task-1-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v24-main-verification-workbench --json
```


---

# task-2: Allowlisted verification runner

Branch: `v24-task-2-allowlisted-verification-runner`  
Worker evidence: `docs/plans/v24-task-2-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v24-task-2-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v24-task-2-main-verification-evidence-2026-05-29.md`

## User-visible value

用户能在 Workbench 里执行主线验证，而不是切终端。

## Implementation scope

从 runbook/plan 中读取并运行允许的验证命令，如 pnpm check、pnpm test、pnpm workbench:build、git diff --check。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
pnpm --silent symphony goal next --goal v24-main-verification-workbench --json
git checkout -b v24-task-2-allowlisted-verification-runner
```

## Worker prompt

```text
/goal
执行 v24 task-2 worker implementation：Allowlisted verification runner。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v24-main-verification-workbench。
- 当前任务：task-2。
- 当前分支必须是：v24-task-2-allowlisted-verification-runner。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v24-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v24-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 从 runbook/plan 中读取并运行允许的验证命令，如 pnpm check、pnpm test、pnpm workbench:build、git diff --check。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v24-task-2-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v24 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v24-task-2-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v24-main-verification-workbench
- Task id: task-2
- Branch: v24-task-2-allowlisted-verification-runner
- User-visible value: 用户能在 Workbench 里执行主线验证，而不是切终端。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
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
git commit -m "Implement v24 task-2: Allowlisted verification runner"

pnpm --silent symphony goal update \
  --goal v24-main-verification-workbench \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v24-task-2-worker \
  --evidence-ref docs/plans/v24-task-2-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v24-main-verification-workbench \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v24-task-2-worker \
  --evidence-ref docs/plans/v24-task-2-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v24 task-2 independent reviewer review。

目标：
- 审查当前分支 `v24-task-2-allowlisted-verification-runner` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v24-task-2-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v24 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户能在 Workbench 里执行主线验证，而不是切终端。
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
- 写入 review evidence：docs/plans/v24-task-2-review-evidence-2026-05-29.md
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
  --goal v24-main-verification-workbench \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v24-task-2-reviewer \
  --evidence-ref docs/plans/v24-task-2-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v24-main-verification-workbench \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v24-task-2-reviewer \
  --evidence-ref docs/plans/v24-task-2-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v24 task-2 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-2.
- Review evidence: docs/plans/v24-task-2-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v24-task-2-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v24 task-2 main verification。

前提：
- v24-task-2-allowlisted-verification-runner 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v24-task-2-allowlisted-verification-runner
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
- 写入 main verification evidence：docs/plans/v24-task-2-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v24-main-verification-workbench
- Task id: task-2
- Branch: v24-task-2-allowlisted-verification-runner
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
  --goal v24-main-verification-workbench \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v24-main-verifier \
  --evidence-ref docs/plans/v24-task-2-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v24-main-verification-workbench \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v24-main-verifier \
  --evidence-ref docs/plans/v24-task-2-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v24-main-verification-workbench --json
```


---

# task-3: Main verification evidence writer

Branch: `v24-task-3-main-verification-evidence-writer`  
Worker evidence: `docs/plans/v24-task-3-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v24-task-3-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v24-task-3-main-verification-evidence-2026-05-29.md`

## User-visible value

用户不用手写验收证据。

## Implementation scope

生成 main verification evidence 草稿/文件，记录命令结果、main commit、merge方式、task id、goal id。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
pnpm --silent symphony goal next --goal v24-main-verification-workbench --json
git checkout -b v24-task-3-main-verification-evidence-writer
```

## Worker prompt

```text
/goal
执行 v24 task-3 worker implementation：Main verification evidence writer。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v24-main-verification-workbench。
- 当前任务：task-3。
- 当前分支必须是：v24-task-3-main-verification-evidence-writer。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v24-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v24-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 生成 main verification evidence 草稿/文件，记录命令结果、main commit、merge方式、task id、goal id。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v24-task-3-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v24 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v24-task-3-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v24-main-verification-workbench
- Task id: task-3
- Branch: v24-task-3-main-verification-evidence-writer
- User-visible value: 用户不用手写验收证据。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
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
git commit -m "Implement v24 task-3: Main verification evidence writer"

pnpm --silent symphony goal update \
  --goal v24-main-verification-workbench \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v24-task-3-worker \
  --evidence-ref docs/plans/v24-task-3-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v24-main-verification-workbench \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v24-task-3-worker \
  --evidence-ref docs/plans/v24-task-3-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v24 task-3 independent reviewer review。

目标：
- 审查当前分支 `v24-task-3-main-verification-evidence-writer` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v24-task-3-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v24 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：用户不用手写验收证据。
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
- 写入 review evidence：docs/plans/v24-task-3-review-evidence-2026-05-29.md
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
  --goal v24-main-verification-workbench \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v24-task-3-reviewer \
  --evidence-ref docs/plans/v24-task-3-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v24-main-verification-workbench \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v24-task-3-reviewer \
  --evidence-ref docs/plans/v24-task-3-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v24 task-3 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-3.
- Review evidence: docs/plans/v24-task-3-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v24-task-3-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v24 task-3 main verification。

前提：
- v24-task-3-main-verification-evidence-writer 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v24-task-3-main-verification-evidence-writer
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
- 写入 main verification evidence：docs/plans/v24-task-3-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v24-main-verification-workbench
- Task id: task-3
- Branch: v24-task-3-main-verification-evidence-writer
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
  --goal v24-main-verification-workbench \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v24-main-verifier \
  --evidence-ref docs/plans/v24-task-3-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v24-main-verification-workbench \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v24-main-verifier \
  --evidence-ref docs/plans/v24-task-3-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v24-main-verification-workbench --json
```


---

# task-4: Main verification gate registration

Branch: `v24-task-4-main-verification-gate-registration`  
Worker evidence: `docs/plans/v24-task-4-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v24-task-4-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v24-task-4-main-verification-evidence-2026-05-29.md`

## User-visible value

验证完成后 goal 状态能从 Workbench 推进。

## Implementation scope

复用 v21/v23 flow 调用 symphony goal gate --gate main-verification --status passed|failed。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
pnpm --silent symphony goal next --goal v24-main-verification-workbench --json
git checkout -b v24-task-4-main-verification-gate-registration
```

## Worker prompt

```text
/goal
执行 v24 task-4 worker implementation：Main verification gate registration。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v24-main-verification-workbench。
- 当前任务：task-4。
- 当前分支必须是：v24-task-4-main-verification-gate-registration。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v24-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v24-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 复用 v21/v23 flow 调用 symphony goal gate --gate main-verification --status passed|failed。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v24-task-4-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v24 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v24-task-4-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v24-main-verification-workbench
- Task id: task-4
- Branch: v24-task-4-main-verification-gate-registration
- User-visible value: 验证完成后 goal 状态能从 Workbench 推进。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
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
git commit -m "Implement v24 task-4: Main verification gate registration"

pnpm --silent symphony goal update \
  --goal v24-main-verification-workbench \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v24-task-4-worker \
  --evidence-ref docs/plans/v24-task-4-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v24-main-verification-workbench \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v24-task-4-worker \
  --evidence-ref docs/plans/v24-task-4-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v24 task-4 independent reviewer review。

目标：
- 审查当前分支 `v24-task-4-main-verification-gate-registration` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v24-task-4-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v24 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：验证完成后 goal 状态能从 Workbench 推进。
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
- 写入 review evidence：docs/plans/v24-task-4-review-evidence-2026-05-29.md
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
  --goal v24-main-verification-workbench \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v24-task-4-reviewer \
  --evidence-ref docs/plans/v24-task-4-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v24-main-verification-workbench \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v24-task-4-reviewer \
  --evidence-ref docs/plans/v24-task-4-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v24 task-4 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-4.
- Review evidence: docs/plans/v24-task-4-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v24-task-4-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v24 task-4 main verification。

前提：
- v24-task-4-main-verification-gate-registration 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v24-task-4-main-verification-gate-registration
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
- 写入 main verification evidence：docs/plans/v24-task-4-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v24-main-verification-workbench
- Task id: task-4
- Branch: v24-task-4-main-verification-gate-registration
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
  --goal v24-main-verification-workbench \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v24-main-verifier \
  --evidence-ref docs/plans/v24-task-4-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v24-main-verification-workbench \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v24-main-verifier \
  --evidence-ref docs/plans/v24-task-4-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v24-main-verification-workbench --json
```


---

# task-5: Main verification tests/docs

Branch: `v24-task-5-main-verification-tests-docs`  
Worker evidence: `docs/plans/v24-task-5-worker-evidence-2026-05-29.md`  
Review evidence: `docs/plans/v24-task-5-review-evidence-2026-05-29.md`  
Main verification evidence: `docs/plans/v24-task-5-main-verification-evidence-2026-05-29.md`

## User-visible value

把 task close loop 变成 Workbench 能力。

## Implementation scope

覆盖 approved 前阻断、验证失败、证据写入、gate dry-run/confirm、状态刷新。

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
pnpm --silent symphony goal next --goal v24-main-verification-workbench --json
git checkout -b v24-task-5-main-verification-tests-docs
```

## Worker prompt

```text
/goal
执行 v24 task-5 worker implementation：Main verification tests/docs。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v24-main-verification-workbench。
- 当前任务：task-5。
- 当前分支必须是：v24-task-5-main-verification-tests-docs。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v24-*plan*.md 或本版本 plan/runbook 文档。
- docs/plans/v24-*execution*.md 或本文件。
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate 相关的实现和测试。

实现范围：
- 覆盖 approved 前阻断、验证失败、证据写入、gate dry-run/confirm、状态刷新。
- Workbench 主路径必须围绕 latest/v19 goal/runbook/next-action 命令面。
- 可以复用现有 API、console snapshot、goal progress/events 数据，但不要把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 只有在本任务明确需要 controlled implementation/adoption lane 时，才允许使用 do --write/confirm-plan 或 adopt --run/inspect/confirm。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v24-task-5-worker-evidence-2026-05-29.md
```

## Worker evidence prompt

```text
/goal
为 v24 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v24-task-5-worker-evidence-2026-05-29.md

必须记录：
- Goal id: v24-main-verification-workbench
- Task id: task-5
- Branch: v24-task-5-main-verification-tests-docs
- User-visible value: 把 task close loop 变成 Workbench 能力。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
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
git commit -m "Implement v24 task-5: Main verification tests/docs"

pnpm --silent symphony goal update \
  --goal v24-main-verification-workbench \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v24-task-5-worker \
  --evidence-ref docs/plans/v24-task-5-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v24-main-verification-workbench \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v24-task-5-worker \
  --evidence-ref docs/plans/v24-task-5-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v24 task-5 independent reviewer review。

目标：
- 审查当前分支 `v24-task-5-main-verification-tests-docs` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v24-task-5-worker-evidence-2026-05-29.md。
- 判断实现是否满足 v24 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增：把 task close loop 变成 Workbench 能力。
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
- 写入 review evidence：docs/plans/v24-task-5-review-evidence-2026-05-29.md
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
  --goal v24-main-verification-workbench \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v24-task-5-reviewer \
  --evidence-ref docs/plans/v24-task-5-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v24-main-verification-workbench \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v24-task-5-reviewer \
  --evidence-ref docs/plans/v24-task-5-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

If needs revision, use `--verdict needs-revision` with the same dry-run then confirm pattern, then run the revision prompt below.

## Revision prompt

```text
/goal
执行 v24 task-5 revision worker。

前提：
- Reviewer returned NEEDS_REVISION for task-5.
- Review evidence: docs/plans/v24-task-5-review-evidence-2026-05-29.md

任务：
- 只修复 reviewer blockers。
- 不扩大范围到其他 tasks。
- 保持 Workbench 主线基于 latest/v19 goal/runbook/next-action 命令面。
- 更新 worker evidence：docs/plans/v24-task-5-worker-evidence-2026-05-29.md，记录 revision summary 和重新运行的命令。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
```

## Main verification prompt

```text
/goal
执行 v24 task-5 main verification。

前提：
- v24-task-5-main-verification-tests-docs 已有 reviewer.approved evidence。
- 不要在没有 reviewer.approved 的情况下合并 main。

执行：
- git checkout main
- git pull --ff-only
- git merge --ff-only v24-task-5-main-verification-tests-docs
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
- 写入 main verification evidence：docs/plans/v24-task-5-main-verification-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v24-main-verification-workbench
- Task id: task-5
- Branch: v24-task-5-main-verification-tests-docs
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
  --goal v24-main-verification-workbench \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v24-main-verifier \
  --evidence-ref docs/plans/v24-task-5-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v24-main-verification-workbench \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v24-main-verifier \
  --evidence-ref docs/plans/v24-task-5-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

git push origin main
pnpm --silent symphony goal next --goal v24-main-verification-workbench --json
```


---

# Release closeout for v24

## Release manager prompt

```text
/goal
执行 v24 release closeout。

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
- pnpm --silent symphony goal closeout --goal v24-main-verification-workbench --markdown
- 写 release evidence：docs/plans/v24-release-evidence-2026-05-29.md

Evidence 必须记录：
- Goal id: v24-main-verification-workbench
- Release name: v24 Main Verification Workbench
- Main commit
- Commands and exact results
- Closeout gaps: none, or explicit blockers
- Boundary: Workbench 主线基于 latest goal/runbook flow，不是 v8 action dashboard
- Tag/release recommendation
```

## Release.ready gate

```bash
pnpm --silent symphony goal closeout --goal v24-main-verification-workbench --markdown

pnpm --silent symphony goal gate \
  --goal v24-main-verification-workbench \
  --gate release.ready \
  --status declared \
  --verifier codex-v24-release-manager \
  --evidence-ref docs/plans/v24-release-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v24-main-verification-workbench \
  --gate release.ready \
  --status declared \
  --verifier codex-v24-release-manager \
  --evidence-ref docs/plans/v24-release-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```
