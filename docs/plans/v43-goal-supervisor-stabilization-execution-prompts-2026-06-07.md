# v43 Execution Prompts: Goal Supervisor Stabilization

Date: 2026-06-07
Goal id: `v43-goal-supervisor-stabilization`
Baseline: `v42 Goal Supervisor Runtime Context Loop`

Use these prompts with `/goal`. The canonical planning flow is in:

```text
docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md
```

## Task 0 bootstrap prompt

```text
/goal
执行 v43 Task 0：注册 `v43-goal-supervisor-stabilization` 的 planning pack，并确认开始基线是 `v42 Goal Supervisor Runtime Context Loop`。

目标：
- Plan doc：docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md
- Execution prompt doc：docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md
- Global rules：docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- Runbook doc：docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md
- Goal-runbook fixture：fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json
- Goal id：v43-goal-supervisor-stabilization
- 版本目标：Goal Supervisor Stabilization

必须确认：
- 当前 handoff 基线是 origin/main `d558b88e4dd9bff25d01736b940804cc9091681f` 或更晚。
- v43 只做 supervisor stabilization，不重开 v42 released scope，不引入 raw provider CLI、generic shell runner、provider allowlist 扩张。
- tracked v42 plan/runbook/fixture/release evidence 是历史入口；不能只依赖 untracked `.symphony` state。
- 当前 fixture 明确继承 v37-v42 scoped closeout gate set：`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check`、docs-updated evidence。

验收：
- node --input-type=module -e "import { readFile } from 'node:fs/promises'; import { assertGoalRunbookContract } from './src/symphony/goal-runbook-contracts.js'; const path='fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json'; const runbook=JSON.parse(await readFile(path,'utf8')); assertGoalRunbookContract(runbook); console.log(JSON.stringify({ ok:true, path, goalId:runbook.goalId, tasks:runbook.tasks.length, releaseGates:runbook.releaseGates }));"
- pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json --goal v43-goal-supervisor-stabilization --dry-run --json
- git diff --check
```

## task-1: App thread and result protocol contracts

Branch: `v43-task-1-app-thread-result-protocol`
Worker evidence: `docs/plans/v43-task-1-worker-evidence-2026-06-07.md`
Review evidence: `docs/plans/v43-task-1-review-evidence-2026-06-07.md`
Main verification evidence: `docs/plans/v43-task-1-main-verification-evidence-2026-06-07.md`

### Worker prompt

```text
/goal
执行 v43 task-1 worker implementation：App thread and result protocol contracts。

目标：
- Goal id：v43-goal-supervisor-stabilization
- 当前任务：task-1
- 当前分支必须是：v43-task-1-app-thread-result-protocol
- 用户可见价值：supervisor 只消费有边界、可回放、可纠正的 child result，不靠聊天正文猜状态。

先读：
- docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md
- docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md
- docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md
- fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json
- docs/plans/v42-goal-supervisor-runtime-context-loop-plan-2026-06-06.md
- docs/plans/app-core-v41-v42-goal-runbooks/v42_goal-supervisor-runtime-context-loop_goal_runbook_latest.md
- docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md
- docs/plans/controller/subagent-result-format.md

实现范围：
- 稳定 App-side `readThread(threadId)` 或等价受控 readback 路径。
- `record-thread` duplicate/unreadable rejection。
- result block append-only parsing、idempotent consume、accepted terminal events 表达。
- 缺失或 malformed result block 的单次 correction path。
- correction 不可达或重复无效输出时的 manual recovery action。
- `notLoaded` 只能是 non-mutating wait state。

边界：
- 不做新的 App product UI。
- 不把 raw chat prose 当 evidence。
- 不无限次发送 correction prompt。
- 不登记 reviewer/main/release gate。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json
- pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json

完成后返回 Summary、Files changed、Tests run with exact results、Result protocol boundary notes、Suggested worker evidence path。
```

### Reviewer prompt

```text
/goal
执行 v43 task-1 independent reviewer review：App thread and result protocol contracts。

目标：
- 审查当前分支 `v43-task-1-app-thread-result-protocol` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v43-task-1-worker-evidence-2026-06-07.md。
- 判断实现是否满足 v43 plan、runbook、fixture 和 task-1 scope。

必须检查：
- active child 是否只在可 readback 后才标记 active。
- duplicate binding、unreadable thread id、missing result block、malformed result block、wrong thread id 是否被覆盖。
- `notLoaded` 是否保持 non-mutating。
- result consume 是否 append-only、idempotent，且 accepted terminal events 不是只列 success。
- correction path 是否 bounded，manual recovery 是否明确。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v43-task-1-review-evidence-2026-06-07.md
```

### Main verifier prompt

```text
/goal
执行 v43 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 自审。
- 如果当前 main 不干净或不能 ff-only merge，停止并记录 blocker。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v43-task-1-app-thread-result-protocol
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json

写 evidence：
- docs/plans/v43-task-1-main-verification-evidence-2026-06-07.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```

## task-2: Workspace and evidence safety

Branch: `v43-task-2-workspace-evidence-safety`
Worker evidence: `docs/plans/v43-task-2-worker-evidence-2026-06-07.md`
Review evidence: `docs/plans/v43-task-2-review-evidence-2026-06-07.md`
Main verification evidence: `docs/plans/v43-task-2-main-verification-evidence-2026-06-07.md`

### Worker prompt

```text
/goal
执行 v43 task-2 worker implementation：Workspace and evidence safety。

目标：
- Goal id：v43-goal-supervisor-stabilization
- 当前任务：task-2
- 当前分支必须是：v43-task-2-workspace-evidence-safety
- 用户可见价值：child work 只在准备好的 worktree 里进行，evidence 不会写错位置或污染 root checkout。

先读：
- docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md
- docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md
- docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md
- fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json
- docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md
- 现有 workspace/worktree/evidence-location/state write 相关实现与测试。

实现范围：
- dependency preflight before dispatch。
- deterministic setup attempt 或 setup blocker。
- verified dirty-baseline inheritance record。
- tracked/staged/deleted/untracked file inventory。
- root checkout before/after child phase status check。
- evidenceRef outside assigned worktree rejection。

边界：
- 不自动修复或合并 dirty worktree。
- 不让 child prompt 决定 write scope。
- 不把 plain `git diff` 当完整 inventory。
- 不运行 full repository release gates，除非 runbook 或 operator 明确要求。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json

完成后返回 Summary、Files changed、Tests run with exact results、Workspace safety notes、Suggested worker evidence path。
```

### Reviewer prompt

```text
/goal
执行 v43 task-2 independent reviewer review：Workspace and evidence safety。

目标：
- 审查当前分支 `v43-task-2-workspace-evidence-safety` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v43-task-2-worker-evidence-2026-06-07.md。
- 判断实现是否满足 v43 task-2 边界。

必须检查：
- dependency readiness 是否在 dispatch 前验证。
- known-bad workspace 是否会明确 blocked，而不是继续 dispatch。
- file inventory 是否覆盖 tracked/staged/deleted/untracked。
- root checkout mutation 是否在 event register 前暴露。
- evidenceRef outside assigned worktree 或 only-in-root 情况是否会被拒绝。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v43-task-2-review-evidence-2026-06-07.md
```

### Main verifier prompt

```text
/goal
执行 v43 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- 当前 main 必须干净，且能 ff-only merge。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v43-task-2-workspace-evidence-safety
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json

写 evidence：
- docs/plans/v43-task-2-main-verification-evidence-2026-06-07.md
```

## task-3: Route engine and status reconciliation

Branch: `v43-task-3-route-status-reconciliation`
Worker evidence: `docs/plans/v43-task-3-worker-evidence-2026-06-07.md`
Review evidence: `docs/plans/v43-task-3-review-evidence-2026-06-07.md`
Main verification evidence: `docs/plans/v43-task-3-main-verification-evidence-2026-06-07.md`

### Worker prompt

```text
/goal
执行 v43 task-3 worker implementation：Route engine and status reconciliation。

目标：
- Goal id：v43-goal-supervisor-stabilization
- 当前任务：task-3
- 当前分支必须是：v43-task-3-route-status-reconciliation
- 用户可见价值：supervisor route 能稳定地从 worker -> reviewer -> main verifier -> closeout 走，不把 reviewer approval 误判成 main verified。

先读：
- docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md
- docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md
- docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md
- fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json
- docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md
- goal-status / goal next / goal closeout / route engine / ledger reconciliation 相关实现与测试。

实现范围：
- event-sequence based route transition table。
- reviewer `needs-revision` -> worker revision。
- main verification failure -> worker revision -> reviewer -> main verifier。
- `goal-status` mismatch warning。
- release closeout blocked until explicit authorization。
- one consumed valid result -> exactly one goal event。

边界：
- 不从 branch name、filename、prompt text、frontend state 推断完成状态。
- 不把 reviewer approval 计作 main verification。
- 不自动 dispatch release-manager closeout。
- 不新增 worker/reviewer/main-verifier/release-manager/controller 之外的角色语义。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json
- pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json

完成后返回 Summary、Files changed、Tests run with exact results、Route reconciliation notes、Suggested worker evidence path。
```

### Reviewer prompt

```text
/goal
执行 v43 task-3 independent reviewer review：Route engine and status reconciliation。

目标：
- 审查当前分支 `v43-task-3-route-status-reconciliation` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v43-task-3-worker-evidence-2026-06-07.md。
- 判断 routing/status logic 是否满足 v43 task-3 约束。

必须检查：
- reviewer approval 是否仍然无法直接计作 main verified。
- failed main verification 路径是否需要重新回到 worker + reviewer。
- closeout authorization 缺失时是否仍 blocked。
- mismatch warning 是否依赖真实 event/result，而不是 copy-only summary。
- consumed result 是否不会重复注册事件。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v43-task-3-review-evidence-2026-06-07.md
```

### Main verifier prompt

```text
/goal
执行 v43 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- 当前 main 必须干净，且能 ff-only merge。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v43-task-3-route-status-reconciliation
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json
- pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json

写 evidence：
- docs/plans/v43-task-3-main-verification-evidence-2026-06-07.md
```

## task-4: Daemon, heartbeat, notifications, and progress visibility

Branch: `v43-task-4-daemon-heartbeat-progress`
Worker evidence: `docs/plans/v43-task-4-worker-evidence-2026-06-07.md`
Review evidence: `docs/plans/v43-task-4-review-evidence-2026-06-07.md`
Main verification evidence: `docs/plans/v43-task-4-main-verification-evidence-2026-06-07.md`

### Worker prompt

```text
/goal
执行 v43 task-4 worker implementation：Daemon, heartbeat, notifications, and progress visibility。

目标：
- Goal id：v43-goal-supervisor-stabilization
- 当前任务：task-4
- 当前分支必须是：v43-task-4-daemon-heartbeat-progress
- 用户可见价值：operator 能看清 daemon 是否活着、child 是否卡住、什么时候需要人工批准或重启，而不是盯 raw state JSON。

先读：
- docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md
- docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md
- docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md
- fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json
- docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md
- v41 controlled runner runbook/fixture 中 operation id、sanitized artifact ref、progress state 相关实现与测试。

实现范围：
- daemon pid/health/last tick split。
- stale active-child notification。
- approval-required notification with exact blocked command or flag。
- active child age / latest read state / safe resume command。
- controlled provider operation progress summary with provider id、operation id、timeout policy、sanitized status、recovery note。
- documented restart-safe heartbeat decision path。

边界：
- 不因为 stale heartbeat 创建 duplicate work。
- 不把 manual tick 伪装成 daemon health。
- 不从 daemon wakeup 自动进入 release closeout。
- 不暴露 raw provider output、secret-bearing state、credential data。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json

完成后返回 Summary、Files changed、Tests run with exact results、Daemon/progress visibility notes、Suggested worker evidence path。
```

### Reviewer prompt

```text
/goal
执行 v43 task-4 independent reviewer review：Daemon, heartbeat, notifications, and progress visibility。

目标：
- 审查当前分支 `v43-task-4-daemon-heartbeat-progress` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v43-task-4-worker-evidence-2026-06-07.md。
- 判断 daemon/heartbeat/progress 行为是否满足 v43 task-4 边界。

必须检查：
- daemon health、manual tick、runner progress 是否真的分开。
- stale daemon + active child 是否不会 duplicate dispatch。
- blocked/approval-required 状态是否不需要读 raw state JSON 就能看到。
- provider progress 是否只引用 v41 operation ids 和 sanitized refs。
- restart path 是否只有一个 documented launch path。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v43-task-4-review-evidence-2026-06-07.md
```

### Main verifier prompt

```text
/goal
执行 v43 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- 当前 main 必须干净，且能 ff-only merge。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v43-task-4-daemon-heartbeat-progress
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json

写 evidence：
- docs/plans/v43-task-4-main-verification-evidence-2026-06-07.md
```

## Scoped closeout prompt draft

```text
/goal
执行 v43 scoped closeout。

前置：
- task-1 到 task-4 都已完成 worker/reviewer/main verification。
- release closeout 仍需要 explicit operator approval。
- 不做 repository tag/full release validation，除非 operator 明确要求。

默认 gate：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- docs-updated evidence

禁止默认加入：
- pnpm test:mutation:gate
- pnpm audit --audit-level high
- pnpm mcas doctor
- tag / push / publish / raw provider CLI
```
