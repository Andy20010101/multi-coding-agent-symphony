# v38 Plan + /goal Runbook: Agent CLI Provider Hub MVP
Date: 2026-06-02  Goal id: `v38-provider-hub-capability-profiles`  Baseline: `v37 Desktop Shell MVP`  Release name: `v38 Agent CLI Provider Hub MVP`
## Correction note
This runbook continues the current goal/runbook/next-action Workbench workflow. It does **not** use the old v8 command surface as the Workbench/App action baseline.
```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```
## Product purpose
把本地 Agent CLI provider 从散落命令整理成受控配置。v38 只启用 `claude-code-cli` 和 `codex-cli` 两个 active provider instance，并声明 provider profile、sanitized backend profile ref、availability、lane、gate、health 和 secrets boundary。

Gemini CLI、Kiro CLI、DeepSeek active provider 不进入 v38。DeepSeek 只能作为现有本地 Agent CLI 后面的 sanitized backend profile/ref，或作为未来 official agent CLI handoff 说明出现。
## Product spine
```text
agent CLI provider profile -> health check -> capability mapping -> worker/reviewer lane preview -> provider hub panel
```
## Tasks
- task-1: Agent CLI provider profile contract — 模型/工具通道从散落命令变成受控配置。
- task-2: Provider health check API — 用户知道为什么某个 lane 不可用。
- task-3: Capability profile mapping — 真实执行前有明确能力预览。
- task-4: Worker/reviewer lane assignment preview — 实现者与 reviewer 分离在 App 里可见。
- task-5: Provider hub panel + evidence — App 成为多 coding agent 控制台雏形。

## Non-goals
- Do not create a generic shell runner, browser terminal, arbitrary command palette, or generic model invocation path.
- Do not let UI execute raw shell commands.
- Do not invoke `claude`, `codex`, Gemini, Kiro, DeepSeek, or any provider CLI in v38.
- Do not install providers, open OAuth login, dispatch prompts, or call models.
- Do not replace the goal framework, ArtifactStore, or event semantics.
- Do not infer status from branch names, filenames, task titles, prompt text, or frontend state.
- Do not let worker self-approve.
- Do not auto-merge, auto-push, auto-tag, or publish.
- Do not invoke providers or open local files directly from the renderer.

## Task 0: bootstrap/register this version goal
Recommended docs:

- Plan doc: `docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md`
- Execution prompt doc: `docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md`
- Version runbook: `docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b v38-task0-goal-runbook
```

### Task 0 worker prompt

```text
/goal
执行 v38 Task 0：为 `v38-provider-hub-capability-profiles` 写/核对 plan/runbook 和 execution prompts，并用 latest goal init / goal-status 流程注册该 goal。

目标：
- 写入或确认 plan doc：docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- 写入或确认 execution prompt doc：docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- Goal id：v38-provider-hub-capability-profiles
- Baseline：v37 Desktop Shell MVP
- 版本目标：Agent CLI Provider Hub MVP
- Workbench/App 主线必须使用 latest goal/runbook/next-action 命令面，不要回到 v8 command surface。

必须包含：
- Product purpose
- Product spine
- 每个 task 的 branch、acceptance、worker prompt、reviewer prompt、main verification prompt
- Common event registration commands：goal update、goal review、goal gate

禁止：
- 不实现产品代码。
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
  --from-json fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json \
  --goal v38-provider-hub-capability-profiles \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json \
  --goal v38-provider-hub-capability-profiles \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>

pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json
```


---

# task-1: Agent CLI provider profile contract

Branch: `v38-task-1-provider-profile-contract`  
Worker evidence: `docs/plans/v38-task-1-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v38-task-1-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v38-task-1-main-verification-evidence-2026-06-02.md`

## User-visible value

模型/工具通道从散落命令变成受控配置。

## Implementation scope

Define the generic `agent-cli-provider.v1` contract for v38 Agent CLI Provider Hub MVP.

Active provider instances:

- `claude-code-cli`: display name `Claude Code CLI`, local command `claude`, provider kind `agent-cli`, adapter id `claude-code`.
- `codex-cli`: display name `Codex CLI`, local command `codex`, provider kind `agent-cli`, adapter id `codex`.

Backend profile data is sanitized. It can expose profile refs and `configured`, `missing`, or `unknown` style status. It must not expose API keys, OAuth tokens, credential file contents, raw provider settings, full secret-bearing config, or secret-looking values.

The contract expresses availability, lane, gate, health, secrets, workspace, prompt, output, and capability boundaries. v38 task-1 does not run provider CLIs, send prompts, call models, install providers, open OAuth, or add a generic shell runner.

## Acceptance

- The App/Workbench user path for this task is contract-only and testable through the fixture and validator.
- Active provider instances are exactly `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek are not active provider instances.
- DeepSeek appears only as sanitized backend profile/ref or future handoff documentation.
- Validator rejects secret-bearing fields, active provider drift, raw shell runner drift, and model invocation boundary drift.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- UI does not execute arbitrary shell commands, invoke models, open arbitrary local files, merge, push, tag, publish, or self-approve.
- v8 compatibility commands are not presented as the top-level App/Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json
git checkout -b v38-task-1-provider-profile-contract
```

## Worker prompt

```text
/goal
执行 v38 task-1 worker implementation：Agent CLI provider profile contract。

目标：
- 当前 goal id：v38-provider-hub-capability-profiles
- 当前任务：task-1
- 当前分支必须是：v38-task-1-provider-profile-contract
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：模型/工具通道从散落命令变成受控配置。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
- 定义 generic Agent CLI provider profile contract，不做 Claude/Codex 专用抽象。
- Active provider instances 只能是 `claude-code-cli` 和 `codex-cli`。
- Backend profile 只能暴露 sanitized profile/ref 和 configured/missing/unknown 状态。
- Validator/tests 必须拒绝 secret-bearing fields、active provider drift、raw shell/model runner drift、execution/model invocation boundary drift。

边界：
- App/Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- UI 不得直接执行 shell 命令；只能消费 backend action/job/artifact/provider/router contracts。
- 不新增 generic shell runner、browser terminal、任意模型调用路径、任意本地路径读取、auto merge/tag/push。
- 不实现 task-2 health check API、task-3 capability mapping、task-4 lane preview UI、task-5 Provider Hub panel。
- 不真实调用 `claude` 或 `codex`。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v38-task-1-worker-evidence-2026-06-02.md
```

## Worker evidence prompt

```text
/goal
为 v38 task-1 写 worker evidence 文档。

目标文件：
- docs/plans/v38-task-1-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v38-provider-hub-capability-profiles
- Task id: task-1
- Branch: v38-task-1-provider-profile-contract
- User-visible value: 模型/工具通道从散落命令变成受控配置。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
- App/Workbench user path changed
- Boundary notes
- Known limitations / next task handoff

禁止：
- 不写 reviewer verdict。
- 不登记 main verification。
- 不宣称 release ready。
```

## Reviewer prompt

```text
/goal
执行 v38 task-1 independent reviewer review：Agent CLI provider profile contract。

目标：
- 审查当前分支 `v38-task-1-provider-profile-contract` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v38-task-1-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v38 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 App/Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 explicit events、independent review、main verification 边界。
- UI 是否没有直接执行 shell 命令、任意模型调用、任意本地路径读取、auto merge/tag/push。
- App index/cache/provider/action/job/router 是否没有替代 canonical goal/event/ArtifactStore contracts。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v38-task-1-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

## Main verifier prompt

```text
/goal
执行 v38 task-1 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v38-task-1-provider-profile-contract
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

写 evidence：
- docs/plans/v38-task-1-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


---

# task-2: Provider health check API

Branch: `v38-task-2-provider-health-check-api`  
Worker evidence: `docs/plans/v38-task-2-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v38-task-2-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v38-task-2-main-verification-evidence-2026-06-02.md`

## User-visible value

用户知道为什么某个 lane 不可用。

## Implementation scope

只读检查 provider 可用性、CLI/env/key 缺失原因；不从 renderer 调模型。

## Acceptance

- The App/Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- UI does not execute arbitrary shell commands, invoke models, open arbitrary local files, merge, push, tag, publish, or self-approve.
- v8 compatibility commands are not presented as the top-level App/Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json
git checkout -b v38-task-2-provider-health-check-api
```

## Worker prompt

```text
/goal
执行 v38 task-2 worker implementation：Provider health check API。

目标：
- 当前 goal id：v38-provider-hub-capability-profiles
- 当前任务：task-2
- 当前分支必须是：v38-task-2-provider-health-check-api
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：用户知道为什么某个 lane 不可用。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
只读检查 provider 可用性、CLI/env/key 缺失原因；不从 renderer 调模型。

边界：
- App/Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- UI 不得直接执行 shell 命令；只能消费 backend action/job/artifact/provider/router contracts。
- 不新增 generic shell runner、browser terminal、任意模型调用路径、任意本地路径读取、auto merge/tag/push。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v38-task-2-worker-evidence-2026-06-02.md
```

## Worker evidence prompt

```text
/goal
为 v38 task-2 写 worker evidence 文档。

目标文件：
- docs/plans/v38-task-2-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v38-provider-hub-capability-profiles
- Task id: task-2
- Branch: v38-task-2-provider-health-check-api
- User-visible value: 用户知道为什么某个 lane 不可用。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
- App/Workbench user path changed
- Boundary notes
- Known limitations / next task handoff

禁止：
- 不写 reviewer verdict。
- 不登记 main verification。
- 不宣称 release ready。
```

## Reviewer prompt

```text
/goal
执行 v38 task-2 independent reviewer review：Provider health check API。

目标：
- 审查当前分支 `v38-task-2-provider-health-check-api` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v38-task-2-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v38 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 App/Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 explicit events、independent review、main verification 边界。
- UI 是否没有直接执行 shell 命令、任意模型调用、任意本地路径读取、auto merge/tag/push。
- App index/cache/provider/action/job/router 是否没有替代 canonical goal/event/ArtifactStore contracts。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v38-task-2-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

## Main verifier prompt

```text
/goal
执行 v38 task-2 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v38-task-2-provider-health-check-api
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

写 evidence：
- docs/plans/v38-task-2-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


---

# task-3: Capability profile mapping

Branch: `v38-task-3-capability-profile-mapping`  
Worker evidence: `docs/plans/v38-task-3-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v38-task-3-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v38-task-3-main-verification-evidence-2026-06-02.md`

## User-visible value

真实执行前有明确能力预览。

## Implementation scope

将 action requirements 映射到 provider/tool gates：repo.write、model.invoke、test.run、git.change 等。

## Acceptance

- The App/Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- UI does not execute arbitrary shell commands, invoke models, open arbitrary local files, merge, push, tag, publish, or self-approve.
- v8 compatibility commands are not presented as the top-level App/Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json
git checkout -b v38-task-3-capability-profile-mapping
```

## Worker prompt

```text
/goal
执行 v38 task-3 worker implementation：Capability profile mapping。

目标：
- 当前 goal id：v38-provider-hub-capability-profiles
- 当前任务：task-3
- 当前分支必须是：v38-task-3-capability-profile-mapping
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：真实执行前有明确能力预览。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
将 action requirements 映射到 provider/tool gates：repo.write、model.invoke、test.run、git.change 等。

边界：
- App/Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- UI 不得直接执行 shell 命令；只能消费 backend action/job/artifact/provider/router contracts。
- 不新增 generic shell runner、browser terminal、任意模型调用路径、任意本地路径读取、auto merge/tag/push。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v38-task-3-worker-evidence-2026-06-02.md
```

## Worker evidence prompt

```text
/goal
为 v38 task-3 写 worker evidence 文档。

目标文件：
- docs/plans/v38-task-3-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v38-provider-hub-capability-profiles
- Task id: task-3
- Branch: v38-task-3-capability-profile-mapping
- User-visible value: 真实执行前有明确能力预览。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
- App/Workbench user path changed
- Boundary notes
- Known limitations / next task handoff

禁止：
- 不写 reviewer verdict。
- 不登记 main verification。
- 不宣称 release ready。
```

## Reviewer prompt

```text
/goal
执行 v38 task-3 independent reviewer review：Capability profile mapping。

目标：
- 审查当前分支 `v38-task-3-capability-profile-mapping` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v38-task-3-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v38 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 App/Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 explicit events、independent review、main verification 边界。
- UI 是否没有直接执行 shell 命令、任意模型调用、任意本地路径读取、auto merge/tag/push。
- App index/cache/provider/action/job/router 是否没有替代 canonical goal/event/ArtifactStore contracts。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v38-task-3-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

## Main verifier prompt

```text
/goal
执行 v38 task-3 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v38-task-3-capability-profile-mapping
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

写 evidence：
- docs/plans/v38-task-3-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


---

# task-4: Worker/reviewer lane assignment preview

Branch: `v38-task-4-worker-reviewer-lane-assignment-preview`  
Worker evidence: `docs/plans/v38-task-4-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v38-task-4-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v38-task-4-main-verification-evidence-2026-06-02.md`

## User-visible value

实现者与 reviewer 分离在 App 里可见。

## Implementation scope

为 worker/reviewer/main verifier 推荐独立 lane，但不自动批准。

## Acceptance

- The App/Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- UI does not execute arbitrary shell commands, invoke models, open arbitrary local files, merge, push, tag, publish, or self-approve.
- v8 compatibility commands are not presented as the top-level App/Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json
git checkout -b v38-task-4-worker-reviewer-lane-assignment-preview
```

## Worker prompt

```text
/goal
执行 v38 task-4 worker implementation：Worker/reviewer lane assignment preview。

目标：
- 当前 goal id：v38-provider-hub-capability-profiles
- 当前任务：task-4
- 当前分支必须是：v38-task-4-worker-reviewer-lane-assignment-preview
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：实现者与 reviewer 分离在 App 里可见。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
为 worker/reviewer/main verifier 推荐独立 lane，但不自动批准。

边界：
- App/Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- UI 不得直接执行 shell 命令；只能消费 backend action/job/artifact/provider/router contracts。
- 不新增 generic shell runner、browser terminal、任意模型调用路径、任意本地路径读取、auto merge/tag/push。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v38-task-4-worker-evidence-2026-06-02.md
```

## Worker evidence prompt

```text
/goal
为 v38 task-4 写 worker evidence 文档。

目标文件：
- docs/plans/v38-task-4-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v38-provider-hub-capability-profiles
- Task id: task-4
- Branch: v38-task-4-worker-reviewer-lane-assignment-preview
- User-visible value: 实现者与 reviewer 分离在 App 里可见。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
- App/Workbench user path changed
- Boundary notes
- Known limitations / next task handoff

禁止：
- 不写 reviewer verdict。
- 不登记 main verification。
- 不宣称 release ready。
```

## Reviewer prompt

```text
/goal
执行 v38 task-4 independent reviewer review：Worker/reviewer lane assignment preview。

目标：
- 审查当前分支 `v38-task-4-worker-reviewer-lane-assignment-preview` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v38-task-4-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v38 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 App/Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 explicit events、independent review、main verification 边界。
- UI 是否没有直接执行 shell 命令、任意模型调用、任意本地路径读取、auto merge/tag/push。
- App index/cache/provider/action/job/router 是否没有替代 canonical goal/event/ArtifactStore contracts。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v38-task-4-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

## Main verifier prompt

```text
/goal
执行 v38 task-4 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v38-task-4-worker-reviewer-lane-assignment-preview
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

写 evidence：
- docs/plans/v38-task-4-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


---

# task-5: Provider hub panel + evidence

Branch: `v38-task-5-provider-hub-panel-evidence`  
Worker evidence: `docs/plans/v38-task-5-worker-evidence-2026-06-02.md`  
Review evidence: `docs/plans/v38-task-5-review-evidence-2026-06-02.md`  
Main verification evidence: `docs/plans/v38-task-5-main-verification-evidence-2026-06-02.md`

## User-visible value

App 成为多 coding agent 控制台雏形。

## Implementation scope

Workbench/Desktop 显示 provider availability 和 blocked reasons，不泄露 secrets。

## Acceptance

- The App/Workbench user path for this task is visible and testable.
- The task is anchored to active goal/task/run/evidence context.
- The task reuses existing goal/event/run/adoption/verification contracts where applicable.
- State changes come only from explicit backend events or command outputs.
- UI does not execute arbitrary shell commands, invoke models, open arbitrary local files, merge, push, tag, publish, or self-approve.
- v8 compatibility commands are not presented as the top-level App/Workbench model.

## Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
pnpm --silent symphony goal next --goal v38-provider-hub-capability-profiles --json
git checkout -b v38-task-5-provider-hub-panel-evidence
```

## Worker prompt

```text
/goal
执行 v38 task-5 worker implementation：Provider hub panel + evidence。

目标：
- 当前 goal id：v38-provider-hub-capability-profiles
- 当前任务：task-5
- 当前分支必须是：v38-task-5-provider-hub-panel-evidence
- 如果当前不在这个分支，先停止并说明当前分支，不要继续实现。
- 用户可见价值：App 成为多 coding agent 控制台雏形。

先读：
- docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md
- docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md
- docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md
- docs/plans/app-core-v34-v40-goal-runbooks/v38_provider-hub-capability-profiles_goal_runbook_latest.md
- README.md
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md
- Workbench frontend/backend entrypoints and relevant tests.

实现范围：
Workbench/Desktop 显示 provider availability 和 blocked reasons，不泄露 secrets。

边界：
- App/Workbench 主路径必须围绕 latest goal/runbook/next-action 命令面。
- UI 不得直接执行 shell 命令；只能消费 backend action/job/artifact/provider/router contracts。
- 不新增 generic shell runner、browser terminal、任意模型调用路径、任意本地路径读取、auto merge/tag/push。
- 不从 branch、filename、commit message、prompt text、task title 或 frontend state 推断完成状态。
- 不宣称 reviewer approved、main verified 或 release ready。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

完成后必须返回：
- Summary
- Files changed
- Tests run with exact results
- App/Workbench user path changed
- Boundary notes
- Suggested worker evidence path: docs/plans/v38-task-5-worker-evidence-2026-06-02.md
```

## Worker evidence prompt

```text
/goal
为 v38 task-5 写 worker evidence 文档。

目标文件：
- docs/plans/v38-task-5-worker-evidence-2026-06-02.md

必须记录：
- Goal id: v38-provider-hub-capability-profiles
- Task id: task-5
- Branch: v38-task-5-provider-hub-panel-evidence
- User-visible value: App 成为多 coding agent 控制台雏形。
- Implementation summary
- Files changed
- Commands run with exact results:
  - pnpm check
  - pnpm test
  - pnpm workbench:build
  - git diff --check
  - pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json
- App/Workbench user path changed
- Boundary notes
- Known limitations / next task handoff

禁止：
- 不写 reviewer verdict。
- 不登记 main verification。
- 不宣称 release ready。
```

## Reviewer prompt

```text
/goal
执行 v38 task-5 independent reviewer review：Provider hub panel + evidence。

目标：
- 审查当前分支 `v38-task-5-provider-hub-panel-evidence` 相对 main 的 diff。
- 读取 worker evidence：docs/plans/v38-task-5-worker-evidence-2026-06-02.md。
- 判断实现是否满足 v38 plan、runbook 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- 用户可见 App/Workbench workflow 是否真的形成。
- 是否使用 latest goal/runbook/next-action 主线。
- 是否保持 explicit events、independent review、main verification 边界。
- UI 是否没有直接执行 shell 命令、任意模型调用、任意本地路径读取、auto merge/tag/push。
- App index/cache/provider/action/job/router 是否没有替代 canonical goal/event/ArtifactStore contracts。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path：docs/plans/v38-task-5-review-evidence-2026-06-02.md
- Blocking findings if NEEDS_REVISION
```

## Main verifier prompt

```text
/goal
执行 v38 task-5 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only v38-task-5-provider-hub-panel-evidence
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v38-provider-hub-capability-profiles --json

写 evidence：
- docs/plans/v38-task-5-main-verification-evidence-2026-06-02.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
```


---

# Release closeout

Only after all tasks have approved review evidence and main-verification gates passed.

```bash
pnpm --silent symphony goal closeout --goal v38-provider-hub-capability-profiles --markdown

pnpm --silent symphony goal gate \
  --goal v38-provider-hub-capability-profiles \
  --gate release.ready \
  --status declared \
  --verifier codex-v38-release-manager \
  --evidence-ref docs/plans/v38-release-evidence-2026-06-02.md \
  --dry-run --json

pnpm --silent symphony goal gate \
  --goal v38-provider-hub-capability-profiles \
  --gate release.ready \
  --status declared \
  --verifier codex-v38-release-manager \
  --evidence-ref docs/plans/v38-release-evidence-2026-06-02.md \
  --confirm \
  --plan-hash sha256:<PLAN_HASH>
```

## Next-version handoff

After v38 release, initialize `v39-backup-diagnostics-migration-workspace` using the same implementation plan and the v39 runbook.
