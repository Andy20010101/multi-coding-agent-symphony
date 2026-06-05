# v41 Plan + /goal Runbook: Controlled CLI Provider Runner + Backend Completion

Date: 2026-06-06  Goal id: `v41-controlled-cli-provider-runner-backend-completion`  Baseline: `v40 Personal Workflow Router + App Core Release Closeout`  Release name: `v41 Controlled CLI Provider Runner + Backend Completion`

## Correction Note

This runbook continues the current goal/runbook/next-action Workbench workflow.

```text
goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest
```

v41 implements the controlled backend runner for two active provider CLIs: `claude-code-cli` and `codex-cli`. Native UX/distribution remains outside v41. v42 is the later `Goal Supervisor Runtime Context Loop`.

## Product Purpose

让真实 provider CLI 进入 App backend 的受控执行路径。Workbench 可以预览和确认 provider runner 操作，但不能直接执行 provider CLI，也不能提交任意 shell 命令。

## Product Spine

```text
provider allowlist -> controlled runner contract -> backend runner adapter -> sanitized operation evidence -> Workbench preview/confirm
```

## Active Providers

- `claude-code-cli`
- `codex-cli`

Gemini CLI、Kiro CLI、DeepSeek 不作为 v41 active provider。DeepSeek 只能作为后续 sanitized backend profile/ref，不是 v41 runnable provider。

## Tasks

- task-1: Controlled runner contract and provider allowlist - runner 有清楚的输入、输出和禁止项。
- task-2: Backend runner execution adapter - provider CLI 只能从 backend 受控模板执行。
- task-3: Runner operation registry and sanitized evidence - provider run 有可审计状态和脱敏证据。
- task-4: Workbench preview and confirm binding - UI 只走 plan-hash confirm，不直接执行 provider CLI。
- task-5: Backend completion closeout and controlled real CLI evidence - 两个 active provider 的 runner path 完成验证。

## Non-goals

- Do not create a generic shell runner, browser terminal, arbitrary command palette, or renderer-side provider invocation.
- Do not add Gemini, Kiro, or DeepSeek as active provider or real CLI gate.
- Do not let UI execute `claude`, `codex`, or any provider CLI directly.
- Do not accept arbitrary command text, arbitrary cwd, arbitrary local paths, secret values, credential files, or raw provider settings from UI/API input.
- Do not install providers, open OAuth, merge, push, tag, publish, or self-approve.
- Do not infer state from branch names, filenames, commit messages, prompt text, command text, task titles, or frontend state.
- Do not implement v42 Goal Supervisor Runtime Context Loop.

## Task 0: Bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v41-controlled-cli-provider-runner-backend-completion-plan-2026-06-06.md`
- Global rules: `docs/plans/app-core-v41-v42-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- Version runbook: `docs/plans/app-core-v41-v42-goal-runbooks/v41_controlled-cli-provider-runner-backend-completion_goal_runbook_latest.md`
- Fixture: `fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b codex/v41-bootstrap
```

### Register goal/runbook

```bash
pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json \
  --goal v41-controlled-cli-provider-runner-backend-completion \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json \
  --goal v41-controlled-cli-provider-runner-backend-completion \
  --confirm \
  --plan-hash sha256:<PLAN_HASH> \
  --json

pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json
pnpm --silent symphony goal next --goal v41-controlled-cli-provider-runner-backend-completion --json
```

## task-1: Controlled runner contract and provider allowlist

Branch: `v41-task-1-controlled-runner-contract-provider-allowlist`
Worker evidence: `docs/plans/v41-task-1-worker-evidence-2026-06-06.md`
Review evidence: `docs/plans/v41-task-1-review-evidence-2026-06-06.md`
Main verification evidence: `docs/plans/v41-task-1-main-verification-evidence-2026-06-06.md`

### User-visible value

真实 provider CLI 有明确入口和禁区，用户不会看到散落命令或不可审计的执行路径。

### Implementation scope

Define the controlled provider runner contract for v41. The contract must identify allowed provider ids, runner input fields, command-template ownership, execution boundaries, output/evidence fields, and failure states.

### Acceptance

- Active provider ids are exactly `claude-code-cli` and `codex-cli`.
- Gemini CLI, Kiro CLI, and DeepSeek are not active provider ids.
- The contract rejects arbitrary shell command input, arbitrary provider ids, arbitrary local paths, secret values, and renderer-owned command construction.
- The contract records that provider CLI execution is available only through a backend controlled runner.
- The task reuses v38 provider profile/health/capability boundaries as source context.
- UI does not execute arbitrary shell commands, invoke models directly, open arbitrary local files, merge, push, tag, publish, or self-approve.
- Worker evidence path: `docs/plans/v41-task-1-worker-evidence-2026-06-06.md`.
- Review evidence path: `docs/plans/v41-task-1-review-evidence-2026-06-06.md`.
- Main verification evidence path: `docs/plans/v41-task-1-main-verification-evidence-2026-06-06.md`.

### Worker prompt

```text
/goal
执行 v41 task-1 worker implementation：Controlled runner contract and provider allowlist。

目标：
- Goal id：v41-controlled-cli-provider-runner-backend-completion
- 当前任务：task-1
- 当前分支必须是：v41-task-1-controlled-runner-contract-provider-allowlist
- 用户可见价值：真实 provider CLI 有明确入口和禁区。

先读：
- docs/plans/v41-controlled-cli-provider-runner-backend-completion-plan-2026-06-06.md
- docs/plans/app-core-v41-v42-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- docs/plans/app-core-v41-v42-goal-runbooks/v41_controlled-cli-provider-runner-backend-completion_goal_runbook_latest.md
- fixtures/contracts/goal-runbook.v41-controlled-cli-provider-runner-backend-completion.v1.json
- fixtures/contracts/agent-cli-provider.v1.json
- fixtures/contracts/agent-cli-provider-health.v1.json
- fixtures/contracts/agent-cli-capability-profile.v1.json
- src/symphony/agent-cli-provider-profile.js
- src/symphony/agent-cli-provider-health.js
- src/symphony/agent-cli-capability-profile.js
- docs/workbench-operator-guide.md
- docs/symphony-product-contracts.md

实现范围：
- 定义 v41 controlled provider runner contract 和 fixture。
- active provider ids 只能是 claude-code-cli、codex-cli。
- contract 必须表达 backend-owned command template、goal/task/role context、sanitized output/evidence、timeout/failure state、secret boundary、generic shell disabled。
- validator/tests 必须拒绝 provider drift、generic shell drift、arbitrary command input、secret-bearing fields、renderer provider invocation。

边界：
- 不实现 task-2 backend runner execution adapter。
- 不真实运行 claude 或 codex。
- 不加入 Gemini、Kiro、DeepSeek active provider。
- 不创建 generic shell runner。
- 不登记 reviewer/main/release gate。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json

完成后返回 Summary、Files changed、Tests run with exact results、Provider boundary notes、Suggested worker evidence path。
```

## task-2: Backend runner execution adapter

Branch: `v41-task-2-backend-runner-execution-adapter`
Worker evidence: `docs/plans/v41-task-2-worker-evidence-2026-06-06.md`
Review evidence: `docs/plans/v41-task-2-review-evidence-2026-06-06.md`
Main verification evidence: `docs/plans/v41-task-2-main-verification-evidence-2026-06-06.md`

### User-visible value

Workbench 可以请求 provider runner，但执行只发生在 backend 的受控适配器里。

### Implementation scope

Implement backend runner code for `claude-code-cli` and `codex-cli` using provider-specific command templates and active goal/task context. The adapter must not expose a generic shell API.

### Acceptance

- Backend runner accepts only allowed provider ids, active goal id, task id, role, reviewed prompt/ref context, and controlled mode.
- Command construction happens in backend code, not in UI, fixture input, browser query, or renderer state.
- The runner rejects arbitrary command text, shell metacharacter expansion, arbitrary cwd/path, and inactive provider ids.
- Direct `claude`, `codex`, Kiro, Gemini, DeepSeek, or shell execution from UI remains unavailable.
- Provider execution is bounded by timeout, cwd/workspace policy, env redaction, and failure-layer reporting.
- Worker evidence path: `docs/plans/v41-task-2-worker-evidence-2026-06-06.md`.
- Review evidence path: `docs/plans/v41-task-2-review-evidence-2026-06-06.md`.
- Main verification evidence path: `docs/plans/v41-task-2-main-verification-evidence-2026-06-06.md`.

### Worker prompt

```text
/goal
执行 v41 task-2 worker implementation：Backend runner execution adapter。

目标：
- Goal id：v41-controlled-cli-provider-runner-backend-completion
- 当前任务：task-2
- 当前分支必须是：v41-task-2-backend-runner-execution-adapter

先读 task-1 contract、tests、worker/review/main verification evidence，再读 v41 plan/runbook/global rules。

实现范围：
- 为 claude-code-cli 和 codex-cli 增加 backend-owned runner adapter。
- runner 只能消费 goal/task/role/provider/mode/ref 字段。
- provider command template 必须在 backend 代码中选择，不能由 UI/API 输入传入。
- 所有 provider CLI 执行必须经过该 runner。
- 如果需要真实 CLI smoke，只能调用本 task 实现的 controlled runner path，并记录 evidence。

边界：
- 不新增 generic shell runner。
- 不允许 UI 直接执行 provider CLI。
- 不加入 Gemini、Kiro、DeepSeek。
- 不暴露 env value、credential file contents、raw provider settings。
- 不登记 reviewer/main/release gate。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json

完成后返回 Summary、Files changed、Tests run with exact results、Controlled runner command evidence、Boundary notes、Suggested worker evidence path。
```

## task-3: Runner operation registry and sanitized evidence

Branch: `v41-task-3-runner-operation-registry-sanitized-evidence`
Worker evidence: `docs/plans/v41-task-3-worker-evidence-2026-06-06.md`
Review evidence: `docs/plans/v41-task-3-review-evidence-2026-06-06.md`
Main verification evidence: `docs/plans/v41-task-3-main-verification-evidence-2026-06-06.md`

### User-visible value

每次 provider runner 操作都有状态、失败原因和脱敏证据，reviewer 可以复核。

### Implementation scope

Record controlled runner operations with provider id, goal id, task id, role, run id, command template id, status, exit code, timing, artifact refs, redaction status, and failure layer.

### Acceptance

- Operation registry records controlled runner operation lifecycle without treating command success as reviewer approval, main verification, or release readiness.
- Evidence refs point to sanitized summaries or artifacts.
- Raw provider output, secret-looking values, API keys, OAuth tokens, credential files, and raw provider settings are not exposed.
- Failure layer distinguishes schema, provider availability, command execution, timeout, redaction, workspace, and expected-check failures.
- Worker evidence path: `docs/plans/v41-task-3-worker-evidence-2026-06-06.md`.
- Review evidence path: `docs/plans/v41-task-3-review-evidence-2026-06-06.md`.
- Main verification evidence path: `docs/plans/v41-task-3-main-verification-evidence-2026-06-06.md`.

### Worker prompt

```text
/goal
执行 v41 task-3 worker implementation：Runner operation registry and sanitized evidence。

目标：
- Goal id：v41-controlled-cli-provider-runner-backend-completion
- 当前任务：task-3
- 当前分支必须是：v41-task-3-runner-operation-registry-sanitized-evidence

先读 task-1/task-2 evidence、runner contract、backend runner adapter、goal-operation-run-registry 现有代码和 v41 runbook。

实现范围：
- 把 controlled provider runner operation 写入受控 registry。
- 记录 provider id、goal/task/role、template id、status、exit code、timing、artifact refs、redaction status、failure layer。
- 提供 contract fixture 和 tests 覆盖脱敏、失败状态、inactive provider、generic shell disabled。

边界：
- 操作成功不等于 reviewer approved、main verified 或 release ready。
- 不读取 credential file contents。
- 不暴露 raw provider output 或 secret value。
- 不新增 Gemini、Kiro、DeepSeek active provider。
- 不登记 reviewer/main/release gate。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json

完成后返回 Summary、Files changed、Tests run with exact results、Evidence/redaction notes、Suggested worker evidence path。
```

## task-4: Workbench preview and confirm binding

Branch: `v41-task-4-workbench-preview-confirm-binding`
Worker evidence: `docs/plans/v41-task-4-worker-evidence-2026-06-06.md`
Review evidence: `docs/plans/v41-task-4-review-evidence-2026-06-06.md`
Main verification evidence: `docs/plans/v41-task-4-main-verification-evidence-2026-06-06.md`

### User-visible value

用户能从 Workbench 发起受控 provider runner 操作，但页面没有 shell 输入框，也没有直接 provider CLI 执行按钮。

### Implementation scope

Expose runner preview and confirm through backend routes or CLI commands that require reviewed goal/task context and plan hash. Bind Workbench display to those contracts.

### Acceptance

- Preview returns provider id, active goal/task context, template id, safety fields, expected artifacts, and plan hash.
- Confirm accepts only the previewed context plus plan hash.
- UI cannot submit arbitrary command, provider binary, cwd, path, prompt text, secret, or inactive provider.
- Workbench displays operation status/evidence refs from backend contracts.
- Workbench does not infer reviewer approval, main verification, or release readiness from runner output.
- Worker evidence path: `docs/plans/v41-task-4-worker-evidence-2026-06-06.md`.
- Review evidence path: `docs/plans/v41-task-4-review-evidence-2026-06-06.md`.
- Main verification evidence path: `docs/plans/v41-task-4-main-verification-evidence-2026-06-06.md`.

### Worker prompt

```text
/goal
执行 v41 task-4 worker implementation：Workbench preview and confirm binding。

目标：
- Goal id：v41-controlled-cli-provider-runner-backend-completion
- 当前任务：task-4
- 当前分支必须是：v41-task-4-workbench-preview-confirm-binding

先读 task-1 到 task-3 evidence、runner contracts、backend runner code、Workbench route/client/view model tests 和 v41 runbook。

实现范围：
- 增加 controlled provider runner preview/confirm route 或 CLI surface。
- Workbench 只展示 backend contract 字段和 plan-hash confirm 流程。
- 确认后写 operation registry，不直接登记 reviewer/main/release gate。

边界：
- UI 不接受任意 shell 文本。
- UI 不直接调用 claude、codex 或 provider binary。
- 不加入 Gemini、Kiro、DeepSeek。
- 不把 runner success 推断为 approval/main/release 状态。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json

完成后返回 Summary、Files changed、Tests run with exact results、Workbench path changed、Boundary notes、Suggested worker evidence path。
```

## task-5: Backend completion closeout and controlled real CLI evidence

Branch: `v41-task-5-backend-completion-controlled-real-cli-evidence`
Worker evidence: `docs/plans/v41-task-5-worker-evidence-2026-06-06.md`
Review evidence: `docs/plans/v41-task-5-review-evidence-2026-06-06.md`
Main verification evidence: `docs/plans/v41-task-5-main-verification-evidence-2026-06-06.md`

### User-visible value

两个 active provider 的受控 runner path 可以验收，失败时有明确证据和恢复路径。

### Implementation scope

Close the backend runner path by validating task-1 through task-4 together. If real CLI execution is required, use only the v41 controlled backend runner for `claude-code-cli` and `codex-cli`.

### Acceptance

- `claude-code-cli` and `codex-cli` runner paths are validated through backend-controlled calls or explicit unavailable evidence.
- No raw `claude`, raw `codex`, Kiro, Gemini, DeepSeek, or arbitrary shell command is used as fallback evidence.
- Runner evidence records provider id, task context, operation id, command template id, exit code or blocker, artifact refs, redaction status, and recovery notes.
- Release closeout remains gated by the fixture release gates and explicit release-ready event registration.
- Worker evidence path: `docs/plans/v41-task-5-worker-evidence-2026-06-06.md`.
- Review evidence path: `docs/plans/v41-task-5-review-evidence-2026-06-06.md`.
- Main verification evidence path: `docs/plans/v41-task-5-main-verification-evidence-2026-06-06.md`.

### Worker prompt

```text
/goal
执行 v41 task-5 worker implementation：Backend completion closeout and controlled real CLI evidence。

目标：
- Goal id：v41-controlled-cli-provider-runner-backend-completion
- 当前任务：task-5
- 当前分支必须是：v41-task-5-backend-completion-controlled-real-cli-evidence

先读 task-1 到 task-4 evidence、runner contracts、Workbench binding、v41 plan/runbook/global rules、docs/release-checklist.md。

实现范围：
- 验证 claude-code-cli 和 codex-cli 两条受控 runner path。
- 如果 task 明确需要真实 CLI gate，必须只通过 v41 controlled backend runner 运行。
- 缺少本地 CLI、缺少 env、preflight 失败或 provider 执行失败都要记录为 evidence，不能用 raw shell fallback。
- 写清 closeout handoff 和 release gate evidence 要求。

边界：
- 不运行 raw claude、raw codex、Kiro、Gemini、DeepSeek 或任意 shell fallback。
- 不新增 active provider。
- 不登记 release.ready。
- 不创建 tag、push 或 GitHub Release。
- 不实现 v42。

验收命令：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json
- pnpm --silent symphony goal closeout --goal v41-controlled-cli-provider-runner-backend-completion --markdown

完成后返回 Summary、Files changed、Tests run with exact results、Controlled real CLI evidence or blocker refs、Release gate notes、Suggested worker evidence path。
```

## Common Reviewer Prompt

```text
/goal
执行 v41 independent reviewer review。

目标：
- 审查当前 task 分支相对 main 的 diff。
- 读取对应 worker evidence。
- 判断实现是否满足 v41 plan、runbook、fixture 和本 task scope。
- reviewer 必须独立；不能只复述 worker 总结；不能因为测试通过就自动 APPROVED。

必须检查：
- active provider 是否只剩 claude-code-cli、codex-cli。
- UI/renderer 是否没有直接 provider CLI 或 shell 执行。
- backend runner 是否拒绝 arbitrary command/provider/path/secret drift。
- Gemini/Kiro/DeepSeek 是否没有进入 active provider、runner path 或 real CLI gate。
- runner output 是否没有被推断为 reviewer approval、main verification 或 release readiness。

必须运行或核验：
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check

输出：
- Verdict: APPROVED 或 NEEDS_REVISION
- Review evidence path
- Blocking findings if NEEDS_REVISION
```

## Common Main Verifier Prompt

```text
/goal
执行 v41 main verification。

前置：
- reviewer verdict 必须是 APPROVED。
- main verification 不能由 worker 执行自我审批。
- 如果当前不是干净 main 或无法 ff-only merge，停止并记录 blocker，不要伪造通过。

验证：
- git checkout main
- git pull --ff-only
- git merge --ff-only <task-branch>
- pnpm check
- pnpm test
- pnpm workbench:build
- git diff --check
- pnpm --silent symphony goal-status --goal v41-controlled-cli-provider-runner-backend-completion --json

写 evidence：
- docs/plans/v41-task-<n>-main-verification-evidence-2026-06-06.md

禁止：
- 不登记 release.ready。
- 不创建 tag。
- 不自动 push，除非父流程明确要求且 main verification 已完成。
- 不运行 provider CLI，除非该 task 的 v41 runner path 已实现并明确要求受控 real CLI evidence。
```

## Release Closeout

The v41 fixture release gates are:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

Release closeout evidence must record exact results for:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Register each release gate through `symphony goal gate` dry-run and confirm. Register `release.ready` only after closeout shows no missing task evidence, no missing release gate evidence, and an explicit release evidence ref.

Do not create a v41 tag or GitHub Release in this runbook unless a separate release/tag thread requests it.

## Next Module

v42 is `Goal Supervisor Runtime Context Loop`. v41 should leave enough runner operation and evidence context for v42, but v42 controller lifecycle, daemon context loop, leases, thread creation adapter, and supervisor product UI remain out of scope.
