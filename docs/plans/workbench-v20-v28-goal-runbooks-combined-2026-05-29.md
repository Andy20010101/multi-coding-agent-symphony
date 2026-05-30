# Workbench v20-v28 Latest-Command /goal Runbooks

Date: 2026-05-29  
Correction: these runbooks replace the earlier v8-command-centered pack.

## Core correction

Do **not** use the old v8 command surface as the primary Workbench action baseline:

```text
scan / do / review / verify / status / continue / artifacts
```

Those commands may still exist and some remain useful as lower-level or compatibility capabilities, but the Workbench v20-v28 product spine must follow the latest goal/runbook flow established by v18-v19:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Implementation/adoption lanes may use the latest controlled execution/adoption commands only when they are anchored to the active goal/task:

```text
symphony do --write --json "<task>"
symphony do --confirm-plan <plan-id> --json
symphony adopt --run <confirmed-run-id> --json
symphony adopt --inspect <adoption-id> --json
symphony adopt --confirm <adoption-id> --json
```

These are not top-level generic Workbench buttons. They are goal/task-specific lanes.

## Global product rules

- Every version must implement a user-visible Workbench workflow, not another horizontal safety layer.
- At least 70% of tasks should be Workbench/product workflow work.
- Reuse v18/v19 goal commands and event semantics.
- Do not introduce a new goal framework, artifact framework, permission system, command DSL, or generic shell runner.
- Worker and reviewer can be separate subagents/conversations.
- A worker may self-check but must not approve its own work.
- Reviewer must be independent and should default to read-only review.
- Status must come from explicit events and command outputs, not from branch names, filenames, task titles, or frontend inference.
- `goal update` is only for worker/task-level events.
- Reviewer verdicts use `goal review`.
- Main verification and release readiness use `goal gate`.

## Latest command basis

Assume v19 has landed before starting v20. If a command name has drifted, run the matching help command and preserve the semantics.

```bash
pnpm --silent symphony goal-status --goal <goal-id> --json
pnpm --silent symphony goal init --from <plan-doc> --goal <goal-id> --dry-run --json
pnpm --silent symphony goal next --goal <goal-id> --json
pnpm --silent symphony goal prompt --goal <goal-id> --task <task-id> --role worker --markdown
pnpm --silent symphony goal prompt --goal <goal-id> --task <task-id> --role reviewer --markdown
pnpm --silent symphony goal closeout --goal <goal-id> --markdown
pnpm --silent symphony next --goal latest --json
```

Event registration pattern:

```bash
pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal <goal-id> \
  --task <task-id> \
  --event worker.evidence-recorded \
  --actor codex-<version>-<task-id>-worker \
  --evidence-ref docs/plans/<version>-<task-id>-worker-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Reviewer verdict pattern:

```bash
pnpm --silent symphony goal review \
  --goal <goal-id> \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-<version>-<task-id>-reviewer \
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal <goal-id> \
  --task <task-id> \
  --verdict approved \
  --reviewer codex-<version>-<task-id>-reviewer \
  --evidence-ref docs/plans/<version>-<task-id>-review-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Main verification gate pattern:

```bash
pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-<version>-main-verifier \
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate main-verification \
  --task <task-id> \
  --status passed \
  --verifier codex-<version>-main-verifier \
  --evidence-ref docs/plans/<version>-<task-id>-main-verification-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

Release readiness pattern:

```bash
pnpm --silent symphony goal closeout --goal <goal-id> --markdown

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate release.ready \
  --status declared \
  --verifier codex-<version>-release-manager \
  --evidence-ref docs/plans/<version>-release-evidence-2026-05-29.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal <goal-id> \
  --gate release.ready \
  --status declared \
  --verifier codex-<version>-release-manager \
  --evidence-ref docs/plans/<version>-release-evidence-2026-05-29.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Standard branch loop

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal <goal-id> --json
pnpm --silent symphony goal next --goal <goal-id> --json

git checkout -b <task-branch>
# Paste the worker prompt into a Codex /goal conversation or worker subagent.
# Worker implements only the selected task.

pnpm check
pnpm test
pnpm workbench:build
git diff --check

# Worker writes evidence doc, commits implementation + evidence, then records worker event.

# Open a separate reviewer /goal conversation or reviewer subagent.
# Reviewer reads plan, evidence, tests, and diff; reviewer writes review evidence.
# Register reviewer verdict.

# If approved:
git checkout main
git pull --ff-only
git merge --ff-only <task-branch>
pnpm check
pnpm test
pnpm workbench:build
git diff --check
# Write main verification evidence and register main-verification gate.
git push origin main
```

## Version sequence

- [v20 Workbench Active Goal Surface](v20_workbench-active-goal-surface_goal_runbook_latest.md)
- [v21 Workbench Goal Event Registration](v21_workbench-goal-event-registration_goal_runbook_latest.md)
- [v22 Prompt Handoff Workspace](v22_prompt-handoff-workspace_goal_runbook_latest.md)
- [v23 Goal Operation Run Console](v23_goal-operation-run-console_goal_runbook_latest.md)
- [v24 Main Verification Workbench](v24_main-verification-workbench_goal_runbook_latest.md)
- [v25 Controlled Implementation Lane](v25_controlled-implementation-lane_goal_runbook_latest.md)
- [v26 Verified Adoption Workbench](v26_verified-adoption-workbench_goal_runbook_latest.md)
- [v27 Review Revision Loop](v27_review-revision-loop_goal_runbook_latest.md)
- [v28 Workbench v1 Release](v28_workbench-v1-release_goal_runbook_latest.md)



---

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



---

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



---

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



---

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



---

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



---

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



---

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



---

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



---

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
