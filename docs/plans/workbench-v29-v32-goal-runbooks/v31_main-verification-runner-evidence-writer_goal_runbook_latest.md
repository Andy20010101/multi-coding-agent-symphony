# v31 Plan + /goal Runbook: Main Verification Runner + Evidence Writer

Date: 2026-06-01  
Goal id: `v31-main-verification-runner-evidence-writer`  
Baseline: `v30 verified adoption workspace v2`  
Release name: `v31 Main Verification Runner + Evidence Writer`

## Correction note

This runbook intentionally does **not** use the old v8 command surface as the Workbench button/action baseline. The primary product surface for this version is the current goal/runbook workflow:

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

Older commands such as `scan`, `do`, `review`, `verify`, `status`, `continue`, and `artifacts` may still exist, but they are compatibility/script commands, not the Workbench model for this version.

## Product purpose

把 reviewer approved / adoption applied 之后的主线验证做成 Workbench 闭环：预览 allowlisted verification plan，执行受控验证操作，生成 main verification evidence draft，并登记 main-verification gate。

## Product spine

```text
Reviewer approved or adoption applied -> verification readiness -> preview allowlisted verification plan -> run verification operation -> write evidence -> register main-verification gate.
```

## Tasks

- task-1: Main verification readiness from explicit state — 用户知道什么时候可以进入 main verification，什么时候必须先 review/revision/adoption。
- task-2: Allowlisted verification plan preview — 用户能看清楚将要跑哪些验证命令，不能输入任意 shell。
- task-3: Verification operation console — 长时间验证不会黑盒；用户能看到状态、stdout/stderr 摘要、exit code 和 artifact refs。
- task-4: Main verification evidence writer — 用户不用手写 main verification evidence。
- task-5: Main-verification gate registration flow — 验证 evidence 完整后，Workbench 能通过 dry-run/confirm 登记 main-verification gate。

## Non-goals

- Do not build another generic safety layer.
- Do not introduce a generic shell runner, browser terminal, model invocation path, permission system, goal framework, artifact framework, or command DSL.
- Do not make v8 `scan/do/review/verify/status/continue/artifacts` the top-level Workbench action list.
- Do not infer task approval, adoption readiness, main verification, or release readiness from file names, branch names, commit messages, prompt text, task titles, or frontend heuristics.
- Do not let worker self-approve.
- Do not auto-merge, auto-tag, auto-push, or publish unless this exact version/task explicitly says so and the release manager has explicit evidence.

## Task 0: bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md`
- Execution prompt doc: `docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v31-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v31 Task 0：为 `v31-main-verification-runner-evidence-writer` 写/核对 plan/runbook 和 execution prompts，并用 latest goal init / goal-status 流程注册该 goal。

目标：
- 写入或确认 plan doc：docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
- 写入或确认 execution prompt doc：docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
- Goal id：v31-main-verification-runner-evidence-writer
- Baseline：v30 verified adoption workspace v2
- 版本目标：Main Verification Runner + Evidence Writer
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

```bash
pnpm --silent symphony goal init \
  --from docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md \
  --goal v31-main-verification-runner-evidence-writer \
  --dry-run --json

pnpm --silent symphony goal init \
  --from docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md \
  --goal v31-main-verification-runner-evidence-writer \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json
```


---

# task-1: Main verification readiness from explicit state

Branch: `v31-task-1-main-verification-readiness-from-explicit-state`  
Worker evidence: `docs/plans/v31-task-1-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v31-task-1-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v31-task-1-main-verification-evidence-2026-06-01.md`

## User-visible value

用户知道什么时候可以进入 main verification，什么时候必须先 review/revision/adoption。

## Implementation scope

建立 readiness model：只读取 goal-status、events、adoption inspect/run state 和 reviewer verdict，不从前端/文件名推断。

## Acceptance

- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json
git checkout -b v31-task-1-main-verification-readiness-from-explicit-state
```

## Worker prompt

```text
/goal
执行 v31 task-1 worker implementation：Main verification readiness from explicit state。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v31-main-verification-runner-evidence-writer。
- 当前任务：task-1。
- 当前分支必须是：v31-task-1-main-verification-readiness-from-explicit-state。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
- docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 建立 readiness model：只读取 goal-status、events、adoption inspect/run state 和 reviewer verdict，不从前端/文件名推断。

边界：
- Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 不新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 command DSL。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v31-task-1-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v31 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v31-task-1-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v31-main-verification-runner-evidence-writer
- Task id: task-1
- Branch: v31-task-1-main-verification-readiness-from-explicit-state
- User-visible value: 用户知道什么时候可以进入 main verification，什么时候必须先 review/revision/adoption。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework/generic shell runner。
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
git commit -m "Implement v31 task-1: Main verification readiness from explicit state"

pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v31-task-1-worker \
  --evidence-ref docs/plans/v31-task-1-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-1 \
  --event worker.evidence-recorded \
  --actor codex-v31-task-1-worker \
  --evidence-ref docs/plans/v31-task-1-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v31 task-1 independent reviewer review。

目标：
- 审查当前分支 `v31-task-1-main-verification-readiness-from-explicit-state` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v31-task-1-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v31 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：用户知道什么时候可以进入 main verification，什么时候必须先 review/revision/adoption。
- 是否围绕 latest/v20-v28 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 arbitrary path/file access。
- 是否没有从 branch、filename、commit message、prompt text、task title 或 frontend state 推断 task/release 状态。
- worker 是否没有自我审批、main verification 或 release-ready 声明。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Summary
- Evidence checked
- Commands run with exact result
- Blockers if any
- Review evidence path: docs/plans/v31-task-1-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v31-task-1-reviewer \
  --evidence-ref docs/plans/v31-task-1-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-1 \
  --verdict approved \
  --reviewer codex-v31-task-1-reviewer \
  --evidence-ref docs/plans/v31-task-1-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v31 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v31-task-1-main-verification-readiness-from-explicit-state
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

写入：
- Main verification evidence: docs/plans/v31-task-1-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v31-main-verifier \
  --evidence-ref docs/plans/v31-task-1-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task task-1 \
  --status passed \
  --verifier codex-v31-main-verifier \
  --evidence-ref docs/plans/v31-task-1-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# task-2: Allowlisted verification plan preview

Branch: `v31-task-2-allowlisted-verification-plan-preview`  
Worker evidence: `docs/plans/v31-task-2-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v31-task-2-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v31-task-2-main-verification-evidence-2026-06-01.md`

## User-visible value

用户能看清楚将要跑哪些验证命令，不能输入任意 shell。

## Implementation scope

增加 allowlisted verification plan preview：`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check`，可按 task scope 增加受控命令，不接受任意 command。

## Acceptance

- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json
git checkout -b v31-task-2-allowlisted-verification-plan-preview
```

## Worker prompt

```text
/goal
执行 v31 task-2 worker implementation：Allowlisted verification plan preview。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v31-main-verification-runner-evidence-writer。
- 当前任务：task-2。
- 当前分支必须是：v31-task-2-allowlisted-verification-plan-preview。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
- docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 增加 allowlisted verification plan preview：`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check`，可按 task scope 增加受控命令，不接受任意 command。

边界：
- Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 不新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 command DSL。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v31-task-2-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v31 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v31-task-2-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v31-main-verification-runner-evidence-writer
- Task id: task-2
- Branch: v31-task-2-allowlisted-verification-plan-preview
- User-visible value: 用户能看清楚将要跑哪些验证命令，不能输入任意 shell。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework/generic shell runner。
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
git commit -m "Implement v31 task-2: Allowlisted verification plan preview"

pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v31-task-2-worker \
  --evidence-ref docs/plans/v31-task-2-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-2 \
  --event worker.evidence-recorded \
  --actor codex-v31-task-2-worker \
  --evidence-ref docs/plans/v31-task-2-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v31 task-2 independent reviewer review。

目标：
- 审查当前分支 `v31-task-2-allowlisted-verification-plan-preview` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v31-task-2-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v31 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：用户能看清楚将要跑哪些验证命令，不能输入任意 shell。
- 是否围绕 latest/v20-v28 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 arbitrary path/file access。
- 是否没有从 branch、filename、commit message、prompt text、task title 或 frontend state 推断 task/release 状态。
- worker 是否没有自我审批、main verification 或 release-ready 声明。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Summary
- Evidence checked
- Commands run with exact result
- Blockers if any
- Review evidence path: docs/plans/v31-task-2-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v31-task-2-reviewer \
  --evidence-ref docs/plans/v31-task-2-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-2 \
  --verdict approved \
  --reviewer codex-v31-task-2-reviewer \
  --evidence-ref docs/plans/v31-task-2-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v31 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v31-task-2-allowlisted-verification-plan-preview
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

写入：
- Main verification evidence: docs/plans/v31-task-2-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v31-main-verifier \
  --evidence-ref docs/plans/v31-task-2-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task task-2 \
  --status passed \
  --verifier codex-v31-main-verifier \
  --evidence-ref docs/plans/v31-task-2-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# task-3: Verification operation console

Branch: `v31-task-3-verification-operation-console`  
Worker evidence: `docs/plans/v31-task-3-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v31-task-3-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v31-task-3-main-verification-evidence-2026-06-01.md`

## User-visible value

长时间验证不会黑盒；用户能看到状态、stdout/stderr 摘要、exit code 和 artifact refs。

## Implementation scope

把 verification command suite 接进 operation registry 和 Workbench console；保存 command result contract，不把运行成功自动等于 gate passed。

## Acceptance

- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json
git checkout -b v31-task-3-verification-operation-console
```

## Worker prompt

```text
/goal
执行 v31 task-3 worker implementation：Verification operation console。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v31-main-verification-runner-evidence-writer。
- 当前任务：task-3。
- 当前分支必须是：v31-task-3-verification-operation-console。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
- docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 把 verification command suite 接进 operation registry 和 Workbench console；保存 command result contract，不把运行成功自动等于 gate passed。

边界：
- Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 不新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 command DSL。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v31-task-3-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v31 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v31-task-3-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v31-main-verification-runner-evidence-writer
- Task id: task-3
- Branch: v31-task-3-verification-operation-console
- User-visible value: 长时间验证不会黑盒；用户能看到状态、stdout/stderr 摘要、exit code 和 artifact refs。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework/generic shell runner。
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
git commit -m "Implement v31 task-3: Verification operation console"

pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v31-task-3-worker \
  --evidence-ref docs/plans/v31-task-3-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-3 \
  --event worker.evidence-recorded \
  --actor codex-v31-task-3-worker \
  --evidence-ref docs/plans/v31-task-3-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v31 task-3 independent reviewer review。

目标：
- 审查当前分支 `v31-task-3-verification-operation-console` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v31-task-3-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v31 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：长时间验证不会黑盒；用户能看到状态、stdout/stderr 摘要、exit code 和 artifact refs。
- 是否围绕 latest/v20-v28 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 arbitrary path/file access。
- 是否没有从 branch、filename、commit message、prompt text、task title 或 frontend state 推断 task/release 状态。
- worker 是否没有自我审批、main verification 或 release-ready 声明。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Summary
- Evidence checked
- Commands run with exact result
- Blockers if any
- Review evidence path: docs/plans/v31-task-3-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v31-task-3-reviewer \
  --evidence-ref docs/plans/v31-task-3-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-3 \
  --verdict approved \
  --reviewer codex-v31-task-3-reviewer \
  --evidence-ref docs/plans/v31-task-3-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v31 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v31-task-3-verification-operation-console
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

写入：
- Main verification evidence: docs/plans/v31-task-3-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v31-main-verifier \
  --evidence-ref docs/plans/v31-task-3-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task task-3 \
  --status passed \
  --verifier codex-v31-main-verifier \
  --evidence-ref docs/plans/v31-task-3-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# task-4: Main verification evidence writer

Branch: `v31-task-4-main-verification-evidence-writer`  
Worker evidence: `docs/plans/v31-task-4-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v31-task-4-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v31-task-4-main-verification-evidence-2026-06-01.md`

## User-visible value

用户不用手写 main verification evidence。

## Implementation scope

根据验证结果、goal/task/run refs、review evidence、adoption refs 生成 evidence draft；draft 需要 operator/reviewer 检查，不自动 declare passed。

## Acceptance

- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json
git checkout -b v31-task-4-main-verification-evidence-writer
```

## Worker prompt

```text
/goal
执行 v31 task-4 worker implementation：Main verification evidence writer。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v31-main-verification-runner-evidence-writer。
- 当前任务：task-4。
- 当前分支必须是：v31-task-4-main-verification-evidence-writer。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
- docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 根据验证结果、goal/task/run refs、review evidence、adoption refs 生成 evidence draft；draft 需要 operator/reviewer 检查，不自动 declare passed。

边界：
- Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 不新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 command DSL。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v31-task-4-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v31 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v31-task-4-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v31-main-verification-runner-evidence-writer
- Task id: task-4
- Branch: v31-task-4-main-verification-evidence-writer
- User-visible value: 用户不用手写 main verification evidence。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework/generic shell runner。
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
git commit -m "Implement v31 task-4: Main verification evidence writer"

pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v31-task-4-worker \
  --evidence-ref docs/plans/v31-task-4-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-4 \
  --event worker.evidence-recorded \
  --actor codex-v31-task-4-worker \
  --evidence-ref docs/plans/v31-task-4-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v31 task-4 independent reviewer review。

目标：
- 审查当前分支 `v31-task-4-main-verification-evidence-writer` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v31-task-4-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v31 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：用户不用手写 main verification evidence。
- 是否围绕 latest/v20-v28 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 arbitrary path/file access。
- 是否没有从 branch、filename、commit message、prompt text、task title 或 frontend state 推断 task/release 状态。
- worker 是否没有自我审批、main verification 或 release-ready 声明。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Summary
- Evidence checked
- Commands run with exact result
- Blockers if any
- Review evidence path: docs/plans/v31-task-4-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v31-task-4-reviewer \
  --evidence-ref docs/plans/v31-task-4-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-4 \
  --verdict approved \
  --reviewer codex-v31-task-4-reviewer \
  --evidence-ref docs/plans/v31-task-4-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v31 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v31-task-4-main-verification-evidence-writer
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

写入：
- Main verification evidence: docs/plans/v31-task-4-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v31-main-verifier \
  --evidence-ref docs/plans/v31-task-4-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task task-4 \
  --status passed \
  --verifier codex-v31-main-verifier \
  --evidence-ref docs/plans/v31-task-4-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# task-5: Main-verification gate registration flow

Branch: `v31-task-5-main-verification-gate-registration-flow`  
Worker evidence: `docs/plans/v31-task-5-worker-evidence-2026-06-01.md`  
Review evidence: `docs/plans/v31-task-5-review-evidence-2026-06-01.md`  
Main verification evidence: `docs/plans/v31-task-5-main-verification-evidence-2026-06-01.md`

## User-visible value

验证 evidence 完整后，Workbench 能通过 dry-run/confirm 登记 main-verification gate。

## Implementation scope

接入 existing `goal gate --gate main-verification --status passed` preview/confirm；补测试、docs、release evidence。

## Acceptance

- The Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- Browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, or self-approve.
- v8 compatibility commands are not presented as the top-level Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
pnpm --silent symphony goal next --goal v31-main-verification-runner-evidence-writer --json
git checkout -b v31-task-5-main-verification-gate-registration-flow
```

## Worker prompt

```text
/goal
执行 v31 task-5 worker implementation：Main-verification gate registration flow。

目标：
- 这是 Workbench vertical-slice 任务，不是安全框架扩展。
- 当前版本 goal id：v31-main-verification-runner-evidence-writer。
- 当前任务：task-5。
- 当前分支必须是：v31-task-5-main-verification-gate-registration-flow。
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。

先读：
- docs/plans/v31-main-verification-runner-evidence-writer-plan-2026-06-01.md
- docs/plans/v31-main-verification-runner-evidence-writer-execution-prompts-2026-06-01.md
- docs/plans/workbench-v29-v32-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- README.md
- 现有 Workbench frontend/backend entrypoints。
- 与 goal-status、goal next、goal prompt、goal closeout、goal update/review/gate、operation registry、controlled implementation/adoption/verification 相关的实现和测试。

实现范围：
- 接入 existing `goal gate --gate main-verification --status passed` preview/confirm；补测试、docs、release evidence。

边界：
- Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- 不把 v8 scan/do/review/verify/status/continue/artifacts 作为主按钮模型。
- 不新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 command DSL。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v31-task-5-worker-evidence-2026-06-01.md
```

## Worker evidence prompt

```text
/goal
为 v31 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v31-task-5-worker-evidence-2026-06-01.md

必须记录：
- Goal id: v31-main-verification-runner-evidence-writer
- Task id: task-5
- Branch: v31-task-5-main-verification-gate-registration-flow
- User-visible value: 验证 evidence 完整后，Workbench 能通过 dry-run/confirm 登记 main-verification gate。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json
- Boundary notes:
  - 不把 v8 command surface 当 Workbench 主按钮基线。
  - 不新增安全框架/权限系统/goal framework/generic shell runner。
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
git commit -m "Implement v31 task-5: Main-verification gate registration flow"

pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v31-task-5-worker \
  --evidence-ref docs/plans/v31-task-5-worker-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal update \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-5 \
  --event worker.evidence-recorded \
  --actor codex-v31-task-5-worker \
  --evidence-ref docs/plans/v31-task-5-worker-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Independent reviewer prompt

```text
/goal
执行 v31 task-5 independent reviewer review。

目标：
- 审查当前分支 `v31-task-5-main-verification-gate-registration-flow` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v31-task-5-worker-evidence-2026-06-01.md。
- 判断实现是否满足 v31 plan 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- Workbench 用户路径是否真的新增或闭环：验证 evidence 完整后，Workbench 能通过 dry-run/confirm 登记 main-verification gate。
- 是否围绕 latest/v20-v28 goal/runbook/next-action 命令面，而不是 v8 command button list。
- 是否没有新增 generic shell runner、browser terminal、模型调用、permission system、goal framework、artifact framework 或 arbitrary path/file access。
- 是否没有从 branch、filename、commit message、prompt text、task title 或 frontend state 推断 task/release 状态。
- worker 是否没有自我审批、main verification 或 release-ready 声明。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Summary
- Evidence checked
- Commands run with exact result
- Blockers if any
- Review evidence path: docs/plans/v31-task-5-review-evidence-2026-06-01.md
```

## Reviewer event

```bash
pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v31-task-5-reviewer \
  --evidence-ref docs/plans/v31-task-5-review-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal review \
  --goal v31-main-verification-runner-evidence-writer \
  --task task-5 \
  --verdict approved \
  --reviewer codex-v31-task-5-reviewer \
  --evidence-ref docs/plans/v31-task-5-review-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Main verification prompt

```text
/goal
执行 v31 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 必须独立于 worker。
- 如果当前 main 无法 checkout/pull/ff-only merge，停止并记录 blocker，不要伪造通过。

流程：
- git checkout main
- git pull --ff-only
- git merge --ff-only v31-task-5-main-verification-gate-registration-flow
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

写入：
- Main verification evidence: docs/plans/v31-task-5-main-verification-evidence-2026-06-01.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## Main verification gate

```bash
pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v31-main-verifier \
  --evidence-ref docs/plans/v31-task-5-main-verification-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate main-verification \
  --task task-5 \
  --status passed \
  --verifier codex-v31-main-verifier \
  --evidence-ref docs/plans/v31-task-5-main-verification-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```


---

# Release closeout

Release evidence: `docs/plans/v31-release-evidence-2026-06-01.md`

## Required release gates

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

## Release manager prompt

```text
/goal
执行 v31 release manager closeout。

目标：
- 确认 v31 的 5 个 task 都有 worker evidence、independent review、main verification evidence 和 main-verification gate。
- 在干净 main/ref 上运行 release validation。
- 写 release evidence：docs/plans/v31-release-evidence-2026-06-01.md
- 使用 goal gate dry-run + confirm 登记 runbook 要求的 release gates。
- 所有 release gates passed 后，才允许登记 release.ready declared。

必须运行：
- git checkout main
- git pull --ff-only
- git status -sb
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
pnpm --silent symphony goal-status --goal v31-main-verification-runner-evidence-writer --json

可选但推荐：
- pnpm audit --audit-level high
- pnpm mcas doctor
- pnpm test:mutation:gate

禁止：
- 不从 README、branch、tag name、file name、prompt text、frontend state 或测试文案推断 release-ready。
- 不自动创建 tag、push tag、publish release。
- 不把 v8 command surface 当作 Workbench 主入口。
```

## Release gate registration commands

```bash
pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.pnpm-check \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.pnpm-check \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.pnpm-test \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.pnpm-test \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.workbench-build \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.workbench-build \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.diff-check \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.diff-check \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.docs-updated \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.docs-updated \
  --status passed \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Release.ready gate

```bash
pnpm --silent symphony goal closeout --goal v31-main-verification-runner-evidence-writer --markdown

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.ready \
  --status declared \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v31-main-verification-runner-evidence-writer \
  --gate release.ready \
  --status declared \
  --verifier codex-v31-release-manager \
  --evidence-ref docs/plans/v31-release-evidence-2026-06-01.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```
