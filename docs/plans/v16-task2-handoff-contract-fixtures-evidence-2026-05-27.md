# v16 Task 2 Handoff Contract Fixtures Evidence

日期：2026-05-27

任务：v16 Task 2 handoff contract fixtures

## 任务目标

本任务为 `guided-goal-handoff.v1` 建立 fixture-backed contract。范围只包含 contract 常量、fixture、fixture 校验测试和本 evidence，不接 Workbench、不新增 API route、不新增执行 endpoint、不新增依赖。

## 前置核对

- 当前任务从 `main` 开始。
- `git pull` 返回 `Already up to date.`。
- `main` / `origin/main` 当前 HEAD：`3410509 Approve v16 guided handoff baseline`。
- `git log --oneline --decorate -8` 显示 Task 1 已在 `main`，且历史包含 `v15` tag commit `2c1b9b9 Prepare v15 tag release evidence`。
- 任务开始前 `git status -sb` 输出 `## main...origin/main`，工作区干净。
- `git diff --check` 无输出。
- `git diff -- package.json pnpm-lock.yaml` 无输出。

Task 2 preflight 已执行：

- `pnpm check`：通过，退出码 `0`。
- `pnpm test`：通过，`538` tests / `88` suites，`538` pass，`0` fail，duration `2927.663333ms`。
- `pnpm workbench:build`：通过，Vite 成功构建 Workbench static assets；Node WASI `ExperimentalWarning` 为既有非阻塞 warning。

Task 2 分支：

- `git switch -c v16-task2-handoff-contract-fixtures`：通过。

## 本任务变更文件

- `src/symphony/guided-goal-handoff.js`
- `fixtures/contracts/guided-goal-handoff.v1.json`
- `tests/guided-goal-handoff-contract.test.js`
- `docs/plans/v16-task2-handoff-contract-fixtures-evidence-2026-05-27.md`

本任务未修改 README、Workbench 前端、console server、API route、核心执行 kernel、`package.json` 或 `pnpm-lock.yaml`。

## Contract 字段

`guided-goal-handoff.v1` fixture 冻结以下顶层字段：

- `contractName`
- `contractVersion`
- `goalId`
- `title`
- `titleZh`
- `baseline`
- `scope`
- `nonGoals`
- `safetyBoundaries`
- `roles`
- `tasks`
- `commands`
- `reviewModel`
- `releaseGates`
- `stopConditions`
- `deferredContracts`

`baseline` 记录：

- `releaseTag: v15`
- `releaseTagCommit: 2c1b9b9`
- `planningCommit: 14c9c93`
- `approvalCommit: 3410509`
- v15 closure / tag evidence 和 Task 1 evidence 路径

## Fixture 覆盖

新增 fixture：`fixtures/contracts/guided-goal-handoff.v1.json`。

覆盖内容：

- goal：v16 Guided Goal Handoff + Safe Artifact Preview Contract。
- baseline：v15 tag、v16 planning commit、Task 1 approval commit 和前置 evidence。
- scope / nonGoals / safetyBoundaries：明确 Workbench 只读、copy-only、无 Autopilot、无浏览器执行面、无依赖变更。
- roles：`planner`、`worker`、`reviewer`、`verifier`、`release-evidence`。
- tasks：Task 1-12，每个 task 包含依赖、角色、范围、风险、acceptance、禁止事项、验证建议、evidence path、review gate。
- commands：`preflight`、`task-branch`、`local-validation`、`independent-review`、`commit-push-merge`、`main-post-merge-validation`，全部标记 `copyOnly: true`。
- reviewModel：固定 context isolation，worker self-check 不算最终验收，状态只允许 `APPROVED` / `NEEDS_REVISION`。
- releaseGates：覆盖 task evidence、review gates、main 上 check/test/build、dependency diff、route security、安全边界。
- stopConditions：覆盖 scope creep、未批准依赖、浏览器执行面、任意路径、前端安全推断、review needs revision、验证失败、evidence 缺失。
- deferredContracts：`diagnostics.v1`、`capabilities.v1`、`error-envelope.v1` 登记为 backlog。

## Contract / fixture tests

新增测试：`tests/guided-goal-handoff-contract.test.js`。

测试覆盖：

- bundled `guided-goal-handoff.v1` fixture 通过 `validateGuidedGoalHandoffContract` 和 `assertGuidedGoalHandoffContract`。
- 顶层字段顺序和 required fields 稳定。
- baseline、roles、12 task 列表、evidence paths 稳定。
- Task 11 使用 `verifier` role，Task 12 使用 `release-evidence` role。
- 所有 command block 均为 `copyOnly: true`。
- command block 不允许 `apiRoute`、`endpoint`、`handler`、`httpMethod`、`method`、`route`、`writeEndpoint` 字段。
- command 文本不得包含对 `/api/` 的 `POST` / `PUT` / `PATCH` / `DELETE` 调用。
- reviewModel、releaseGates、stopConditions、deferredContracts 覆盖 v16 review / verifier / release evidence 需求。
- 负例覆盖缺失 required field、非 copy-only command、command endpoint 字段、task evidence 缺失。

Focused test 结果：

- 首次执行 `node --test tests/guided-goal-handoff-contract.test.js`：通过，`5` tests / `1` suite，`5` pass，`0` fail，duration `36.288292ms`。
- post-task self-check 再次执行 `node --test tests/guided-goal-handoff-contract.test.js`：通过，`5` tests / `1` suite，`5` pass，`0` fail，duration `38.482958ms`。

## Post-task 验证记录

新增文件纳入 intent-to-add 后执行：

- `git status -sb`：显示当前分支 `v16-task2-handoff-contract-fixtures`，只有本任务 4 个新增文件。
- `git diff --name-only`：只输出本任务 4 个文件。
- `git diff --stat`：最终只包含本任务 4 个新增文件。
- `git diff -- package.json pnpm-lock.yaml`：无输出。
- `git diff --check`：通过，无输出。
- evidence 补充后再次执行 `git diff --check`：通过，无输出。
- reviewer gate 记录补充后再次执行 `git diff --check`：通过，无输出。
- `pnpm check`：通过，退出码 `0`。
- `pnpm test`：通过，`543` tests / `89` suites，`543` pass，`0` fail，duration `2882.498209ms`。
- `pnpm workbench:build`：通过，Vite 成功构建 Workbench static assets；Node WASI `ExperimentalWarning` 为既有非阻塞 warning。

通用安全扫描已执行：

- 控件扫描命中既有 legacy console 按钮、构建后的 React bundle 和既有 Workbench shell 测试断言。
- 写入 method / browser channel 扫描命中既有测试中的 non-GET 拒绝断言。
- 执行语义和 artifact safety 字段扫描命中既有只读展示、既有测试、legacy console 和本任务 contract/test 中的禁止事项说明。
- `git diff --name-only -- frontend/workbench/src src/symphony/console.js src/symphony/workbench-static` 无输出，确认本任务没有修改 Workbench 前端、console server 或构建产物。
- 本任务新增文件中的 `apiRoute`、`endpoint`、`handler`、`method`、`route` 等命中均来自禁止字段列表、负例测试或后续 task 描述，不是执行入口。

## 安全边界

本任务确认：

- 不接 Workbench。
- 不新增 API route。
- 不新增执行 endpoint。
- 不新增 CLI 生成能力。
- 不调用模型。
- 不自动创建分支、commit、push 或 merge。
- 不新增依赖，不修改 `package.json` / `pnpm-lock.yaml`。
- 不新增浏览器执行面。
- 不修改 v12 adoption safety boundary、v14 Stage boundary、v15 Workbench read-only boundary。
- Task 2 只登记 safe artifact preview 相关后续任务，不实现 preview、不推断 artifact safe fields。

## 待独立 reviewer 核对

独立 reviewer 需要确认：

- 当前 diff 是否只完成 Task 2 范围。
- `guided-goal-handoff.v1` fixture 是否覆盖 goal、baseline、scope、nonGoals、safetyBoundaries、tasks、roles、commands、reviewModel、releaseGates、stopConditions。
- tests 是否覆盖 review / verifier / release evidence 和 copy-only command safety。
- 是否没有新增 Workbench、API route、execution endpoint、依赖或 lockfile diff。
- evidence 是否中文、路径正确、验证记录真实。

## 独立 reviewer gate

独立 reviewer 已返回 `APPROVED`。

reviewer 核对结论摘要：

- 当前 diff 只新增 Task 2 相关 4 个文件：contract validator、fixture、contract test、中文 evidence。
- 没有 Workbench、API route、执行 endpoint、依赖或 lockfile 变更。
- fixture 覆盖 goal、baseline、scope、nonGoals、safetyBoundaries、roles、12 个 tasks、commands、reviewModel、releaseGates、stopConditions。
- tests 覆盖 baseline / roles / tasks / evidence paths、review / verifier / release 角色、copy-only commands、禁止 endpoint 字段和负例。
- 安全扫描命中均为禁止事项说明或测试负例，没有新增浏览器写入、执行、模型、audit、mutation、安装、adopt / apply / retry / rollback、任意路径读取或 artifact safe fields 推断。
- `package.json` / `pnpm-lock.yaml` 无 diff，`git diff --check` 通过。
- reviewer 复跑 `node --test tests/guided-goal-handoff-contract.test.js`、`pnpm check`、`pnpm test` 均通过。

## 结论

v16 Task 2 worker 实现已建立 fixture-backed Guided Goal Handoff contract，并通过 focused contract tests、通用 post-task 验证和独立 reviewer gate。reviewer 已输出 `APPROVED`，可以进入 commit、push、merge 回 `main` 的闭环流程。
