# v16 Task 1 Plan Approval Evidence

日期：2026-05-27

任务：v16 Task 1 plan approval and baseline freeze

## 任务目标

本任务冻结 v16 Guided Goal Handoff + Safe Artifact Preview Contract 的计划、边界、review model、task 列表和基线。范围只包含文档核对和 evidence 记录，不实现 v16 功能。

本任务不修改源码、测试、前端、server、kernel、`package.json` 或 `pnpm-lock.yaml`，也不删除历史 evidence。

## 前置核对

- 当前分支：`v16-task1-plan-approval`。
- 任务从 `main` 开始，`git pull` 返回 `Already up to date.`。
- `main` / `origin/main` 当前 HEAD：`14c9c93 Add v16 guided handoff planning`。
- v15 release tag：`v15`，指向 `2c1b9b9 Prepare v15 tag release evidence`。
- `git log --oneline --decorate -8` 显示当前提交链包含：
  - `14c9c93 Add v16 guided handoff planning`
  - `2c1b9b9 (tag: v15) Prepare v15 tag release evidence`
  - v15 Task 8-12 和 release bookkeeping 相关提交
- 任务开始前 `git status -sb` 输出 `## main...origin/main`，工作区无文件 diff。

已核对文档：

- `docs/plans/v16-guided-goal-handoff-safe-artifact-preview-plan-2026-05-27.md`
- `tmp/codex-prompts/v16_goal_execution_plan.md`
- `README.md`
- `docs/plans/v15-final-closure-evidence-2026-05-27.md`
- `docs/plans/v15-tag-release-evidence-2026-05-27.md`

## 本任务变更文件

- `docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md`

本任务未修改 README、v16 plan、v16 execution prompt、源码、测试、前端、server、kernel、`package.json` 或 `pnpm-lock.yaml`。

## v16 范围冻结

v16 的目标是把复杂目标执行流程沉淀为可复制、可审查、可逐步执行的 handoff contract，并补齐 safe artifact preview contract。Workbench 继续保持 read-only / display-only / copy-only，不成为执行面或 canonical state。

本任务确认 v16 范围包括：

- 定义并实现 `guided-goal-handoff.v1`。
- 固定 planner、worker、reviewer、verifier、release-evidence 的职责、输入、输出、禁止事项和 evidence。
- 生成 copy-only next commands，让用户复制命令到终端或 `/goal` 执行。
- 增加 task review evidence 和 release evidence 的固定路径、状态格式和 `APPROVED` / `NEEDS_REVISION` gate。
- 定义 `safe-artifact-preview.v1`，只有后端 contract 显式标注安全字段时，前端才展示受限预览。
- Workbench 只读消费 handoff 与 safe preview 信息。
- diagnostics、shared capabilities、error envelope 只登记为 backlog contract，未单独批准时不在 v16 中顺手实现。

## 非目标和安全边界

本任务确认 v16 不做以下事项：

- 不做 Autopilot。
- 不新增浏览器执行面。
- 不新增浏览器 adopt / apply / retry / rollback。
- 不让 Workbench 触发写入、模型、audit、mutation、安装或任意路径读取。
- 不把 Workbench 变成 canonical state。
- 不替换 Stage Charter HTML / JSON。
- 不修改 v12 adoption safety kernel、v14 Stage kernel / gate、v15 read-only Workbench 边界。
- 不新增 browser/E2E/UI library/TypeScript 依赖，除非先完成独立 dependency plan 并通过 reviewer。
- 不让前端推断 `safeToRenderInline`、`previewAvailable`、`mime`、`artifactKind`、`sourceRunId`、`sizeBytes`、`displayTitle`、`uri`、`ref`、`previewText` 或 `contentText`。

## 12 个 task 拆分

| Task | 名称 | 产物边界 | Evidence |
| --- | --- | --- | --- |
| 1 | plan approval and baseline freeze | 只做计划批准和基线 evidence | `docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md` |
| 2 | handoff contract fixtures | 冻结 handoff contract fixture 和测试，不接 Workbench | `docs/plans/v16-task2-handoff-contract-fixtures-evidence-2026-05-27.md` |
| 3 | CLI handoff generation | CLI 只生成 handoff JSON / Markdown 和 copy-only commands，不执行命令 | `docs/plans/v16-task3-cli-handoff-generation-evidence-2026-05-27.md` |
| 4 | read-only API exposure | 只读 `GET` route 暴露 registered handoff refs | `docs/plans/v16-task4-readonly-handoff-api-evidence-2026-05-27.md` |
| 5 | Workbench handoff panel | Workbench 只读展示 phases、roles、task status、copy-only commands | `docs/plans/v16-task5-workbench-handoff-panel-evidence-2026-05-27.md` |
| 6 | safe artifact preview contract fixtures | 冻结 `safe-artifact-preview.v1` fixture 和测试 | `docs/plans/v16-task6-safe-preview-contract-fixtures-evidence-2026-05-27.md` |
| 7 | safe artifact preview implementation | 后端只对 registered artifacts 生成受限 preview | `docs/plans/v16-task7-safe-preview-implementation-evidence-2026-05-27.md` |
| 8 | Workbench preview consumption | 前端只读消费 safe preview contract，不渲染 raw HTML | `docs/plans/v16-task8-workbench-preview-consumption-evidence-2026-05-27.md` |
| 9 | route smoke and security coverage | 覆盖 handoff / preview route smoke 和安全探针 | `docs/plans/v16-task9-route-smoke-security-evidence-2026-05-27.md` |
| 10 | docs and operator guide | README / operator guide / v16 docs 与实现一致 | `docs/plans/v16-task10-docs-operator-guide-evidence-2026-05-27.md` |
| 11 | release verification | 在 `main` 上记录发布级验证 | `docs/plans/v16-task11-release-verification-evidence-2026-05-27.md` |
| 12 | closure | 整理 v16 closure、task index、支持能力、不支持能力和 backlog | `docs/plans/v16-final-closure-evidence-2026-05-27.md` |

## Review model 冻结

- worker 只做当前 task；worker 自测只算 self-check。
- reviewer 必须上下文隔离，只读 diff、相关源码、测试、文档和计划文件，不依赖 worker 叙述。
- reviewer 输出 `APPROVED` 后，才允许 commit、push、merge。
- reviewer 输出 `NEEDS_REVISION` 时，只修 blocker，不扩展到下一个 task。
- task 合并回 `main` 后，由 verifier 在 `main` 上补跑对应验证。
- release evidence 由 Task 11 汇总，不由单个 feature task 自行宣称 release ready。

## Release gates 冻结

v16 release 前必须满足：

- Task 1-12 均有中文 evidence。
- 每个 task 有独立 review gate 记录。
- `main` 上 `pnpm check` 通过。
- `main` 上 `pnpm test` 通过。
- `main` 上 `pnpm workbench:build` 通过。
- `git diff --check` 无输出。
- 未批准 dependency plan 时，`git diff -- package.json pnpm-lock.yaml` 无输出。
- handoff route 与 preview route focused tests 通过。
- non-GET API / Workbench mutation probes 被拒绝。
- arbitrary path / traversal probes 被拒绝。
- v12 / v14 / v15 safety boundary 未被越界修改。

## Stop conditions 冻结

任一 task 出现以下情况应停止：

- 计划外修改源码、测试、前端、server、kernel 或依赖文件。
- 未批准新增依赖或 lockfile diff。
- Workbench 出现写入、执行、模型、audit、mutation、安装、adopt / apply / retry / rollback 控件。
- 后端 route 接受 arbitrary path 或暴露本地任意文件。
- 前端推断 artifact safety fields。
- reviewer 返回 `NEEDS_REVISION`。
- 验证失败且无法判断是环境问题还是真实 blocker。
- evidence 缺失、英文为主或删除历史 evidence。

## 本任务验证记录

Task 1 worker preflight 已执行：

- `git checkout main`：通过，已在 `main`。
- `git pull`：通过，输出 `Already up to date.`。
- `git status -sb`：通过，输出 `## main...origin/main`。
- `git log --oneline --decorate -8`：通过，包含 `14c9c93 Add v16 guided handoff planning` 和 `2c1b9b9 (tag: v15) Prepare v15 tag release evidence`。
- `pnpm check`：通过，退出码 `0`。
- `pnpm test`：通过，`538` tests / `88` suites，`538` pass，`0` fail，duration `2915.777625ms`。
- `pnpm workbench:build`：通过，Vite 成功构建 `src/symphony/workbench-static/index.html`、CSS asset 与 JS asset；Node WASI `ExperimentalWarning` 为既有非阻塞 warning。
- `git diff --check`：通过，无输出。
- `git diff -- package.json pnpm-lock.yaml`：通过，无输出。

Task 1 分支创建：

- `git switch -c v16-task1-plan-approval`：通过。

Task 1 evidence 写入后已执行 post-task self-check：

- `git add -N docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md`：通过，用于查看新增文件 diff。
- `git status -sb`：显示当前分支 `v16-task1-plan-approval`，只有本 evidence 文件为新增 intent-to-add。
- `git diff --name-only`：只输出 `docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md`。
- `git diff --stat`：最终为 `1 file changed, 166 insertions(+)`。
- `git diff -- package.json pnpm-lock.yaml`：无输出。
- `pnpm check`：通过，退出码 `0`。
- `pnpm test`：通过，`538` tests / `88` suites，`538` pass，`0` fail，duration `2833.674875ms`。
- `pnpm workbench:build`：通过，Vite 成功构建 Workbench static assets；Node WASI `ExperimentalWarning` 为既有非阻塞 warning。
- `git diff --check`：通过，无输出。
- evidence 记录补充后再次执行 `git diff --check`：通过，无输出。
- 通用安全扫描已执行；命中项来自既有 legacy console、构建后的 React bundle、只读展示字段和测试里的安全断言。本任务 diff 只包含本 evidence 文件，没有新增浏览器控件、写入 route、模型调用、依赖安装、任意路径读取或 artifact safety 推断。

## 独立 reviewer gate

补录复审日期：2026-05-28

独立 reviewer：`019e69c1-c54a-7fc0-8bff-57bcbd1c1b22`

复审结果：`APPROVED`

复审范围：

独立 reviewer 需要确认：

- v16 plan 与 v15 closure / tag release evidence 一致。
- 本文件准确记录当前 `main` planning commit `14c9c93` 与 `v15` tag commit `2c1b9b9`。
- 非目标、安全边界、12 task 拆分、review model、release gates 和 stop conditions 清晰。
- 本任务没有功能、依赖、源码、测试、前端、server 或 kernel 改动。
- evidence 为中文优先，路径正确，没有删除历史 evidence。

复审核对：

- `docs/plans/v16-task1-plan-approval-evidence-2026-05-27.md` 准确记录 Task 1 plan approval and baseline freeze 范围。
- Task 1 基线记录与 `v15` tag commit `2c1b9b9`、v16 planning commit `14c9c93`、Task 1 commit `3410509` 一致。
- 非目标、安全边界、12 task 拆分、review model、release gates 和 stop conditions 与 v16 plan 和 execution prompt 一致。
- Task 1 原始变更只包含本 evidence 文件。
- 未发现功能、依赖、源码、测试、前端、server、kernel、`package.json` 或 `pnpm-lock.yaml` 改动。

## 结论

v16 Task 1 已完成计划批准与基线冻结记录。独立 reviewer 已在 2026-05-28 补录复审并返回 `APPROVED`。
