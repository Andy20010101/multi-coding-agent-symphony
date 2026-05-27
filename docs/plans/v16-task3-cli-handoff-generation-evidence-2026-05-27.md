# v16 Task 3 CLI Handoff Generation Evidence

日期：2026-05-27

任务：v16 Task 3 CLI handoff generation

## 任务目标

本任务在 `symphony` CLI 中增加 `handoff` 只读生成能力。CLI 只把 Task 2 冻结的 `guided-goal-handoff.v1` fixture 输出为 JSON 或 Markdown，不执行输出里的命令，不调用模型，不创建分支，不 commit，不 push，不 merge，不写任意路径。

## 前置核对

- 当前任务从 `main` 开始。
- `git checkout main`：通过，已在 `main`。
- `git pull`：通过，输出 `Already up to date.`。
- `main` / `origin/main` 当前 HEAD：`fb6930a Add v16 handoff contract fixtures`。
- `git log --oneline --decorate -8` 显示 Task 2 已在 `main`，历史包含 `3410509 Approve v16 guided handoff baseline` 和 `2c1b9b9 (tag: v15) Prepare v15 tag release evidence`。
- 任务开始前 `git status -sb` 输出 `## main...origin/main`，工作区干净。
- `git diff --check` 无输出。
- `git diff -- package.json pnpm-lock.yaml` 无输出。

Task 3 preflight 已执行：

- `pnpm check`：通过，退出码 `0`。
- `pnpm test`：通过，`543` tests / `89` suites，`543` pass，`0` fail，duration `2929.533125ms`。
- `pnpm workbench:build`：通过，Vite 成功构建 Workbench static assets；Node WASI `ExperimentalWarning` 为既有非阻塞 warning。

Task 3 分支：

- `git switch -c v16-task3-cli-handoff-generation`：通过。

## 本任务变更文件

- `scripts/symphony.js`
- `src/symphony/guided-goal-handoff-output.js`
- `tests/guided-goal-handoff-cli.test.js`
- `docs/plans/v16-task3-cli-handoff-generation-evidence-2026-05-27.md`

本任务未修改 README、Workbench 前端、console server、API route、核心执行 kernel、`package.json` 或 `pnpm-lock.yaml`。

## CLI 行为

新增命令：

- `symphony handoff`
- `symphony handoff --markdown`
- `symphony handoff --json`
- `symphony handoff --format markdown`
- `symphony handoff --format json`

输出来源固定为仓库内的 `fixtures/contracts/guided-goal-handoff.v1.json`。实现通过 `loadGuidedGoalHandoffFixture()` 读取固定 fixture URL，并在输出前调用 `assertGuidedGoalHandoffContract()`。

JSON 输出：

- 使用 `JSON.stringify(value, null, 2)`。
- 输出内容为 Task 2 fixture contract 本体。
- 不包装执行状态，不新增 route 字段，不新增 endpoint 字段。

Markdown 输出：

- 从同一个 contract 渲染。
- 包含 baseline、scope、nonGoals、safetyBoundaries、roles、task 表、copy-only command blocks、review model、release gates、stop conditions、deferred contracts。
- 明确写入：CLI 只打印 JSON 或 Markdown，不执行命令、不调用模型、不写文件、不创建分支、不 commit、不 push、不 merge。

拒绝的输入：

- `--output` 和 `-o`：返回 usage error，提示 handoff 不写文件，需要文件时由用户自行重定向 stdout。
- 非 `json` / `markdown` 的 `--format`：返回 usage error。
- 位置参数：返回 usage error。
- 同时指定 `--json` 和 `--markdown`：返回 usage error。

## 测试覆盖

新增测试：`tests/guided-goal-handoff-cli.test.js`。

测试覆盖：

- `symphony handoff --json` 输出和 bundled fixture 的 pretty JSON 完全一致。
- JSON 输出通过 `validateGuidedGoalHandoffContract()`。
- JSON 输出保持 `commands.copyOnly: true`。
- Task 3 evidence path 固定为 `docs/plans/v16-task3-cli-handoff-generation-evidence-2026-05-27.md`。
- CLI 测试注入会抛错的 `runner` 和 `mcasRunner`，确认 handoff 路径不触碰 process runner、不调用 kernel CLI、不调用模型。
- `symphony handoff --markdown` 输出和 `renderGuidedGoalHandoffMarkdown()` 完全一致。
- Markdown 输出包含 copy-only 模式说明、`git checkout main`、`git pull`、`git merge --ff-only <v16-task-branch>` 等手动命令文本。
- Markdown 输出不包含 `curl` / `fetch` 到 `/api/` 的调用，也不包含 `POST` / `PUT` / `PATCH` / `DELETE`。
- `--output`、非法 `--format`、位置参数、冲突格式均返回 usage error。

Focused test 结果：

- 首次执行 `node --test tests/guided-goal-handoff-cli.test.js tests/guided-goal-handoff-contract.test.js`：通过，`8` tests / `2` suites，`8` pass，`0` fail，duration `56.702833ms`。
- evidence 写入后再次执行同一 focused test：通过，`8` tests / `2` suites，`8` pass，`0` fail，duration `55.839208ms`。
- reviewer gate 记录补充后再次执行同一 focused test：通过，`8` tests / `2` suites，`8` pass，`0` fail，duration `54.350125ms`。

## Post-task 验证记录

Task 3 worker self-check 已执行：

- 新增文件纳入 intent-to-add 后，`git status -sb` 显示当前分支 `v16-task3-cli-handoff-generation`，只有本任务 4 个文件变更。
- `git diff --name-only`：只输出本任务 4 个文件。
- `git diff --stat`：`4 files changed, 493 insertions(+)`。
- `pnpm check`：通过，退出码 `0`。
- `pnpm test`：通过，`546` tests / `90` suites，`546` pass，`0` fail，duration `2932.897584ms`。
- `pnpm workbench:build`：通过，Vite 成功构建 Workbench static assets；Node WASI `ExperimentalWarning` 为既有非阻塞 warning。
- evidence 写入后 `git diff --check`：通过，无输出。
- reviewer gate 记录补充后 `git diff --check`：通过，无输出。
- `git diff -- package.json pnpm-lock.yaml`：无输出。
- `git diff -- scripts/symphony.js src/symphony/guided-goal-handoff-output.js tests/guided-goal-handoff-cli.test.js | rg -n "apiRoute|endpoint|writeEndpoint|httpMethod|\\b(POST|PUT|PATCH|DELETE)\\b|spawn|execFile|new NodeProcessRunner|git (switch|checkout|commit|push|merge)"`：输出 3 行，均来自 `tests/guided-goal-handoff-cli.test.js` 中对 Markdown copy-only 文本和禁止 HTTP method 的断言：
  - `assert.match(markdown, /\`\`\`bash\ngit checkout main\ngit pull/u);`
  - `assert.match(markdown, /git merge --ff-only <v16-task-branch>/u);`
  - `assert.doesNotMatch(markdown, /\\b(POST|PUT|PATCH|DELETE)\\b/u);`
  这些命中是测试中的预期手动命令文本和禁止项断言，不是 CLI 执行入口、route 字段或 process runner 调用。

## 安全边界

本任务确认：

- 不新增 Workbench 面板。
- 不新增 API route。
- 不新增 execution endpoint。
- 不新增浏览器执行面。
- 不执行 handoff 中列出的 shell 命令。
- 不调用模型。
- 不调用 `mcasRunner`。
- 不创建分支、commit、push 或 merge。
- 不接受任意 fixture path。
- 不接受 `--output` 写文件。
- 不新增依赖，不修改 `package.json` / `pnpm-lock.yaml`。
- 不修改 v12 adoption safety boundary、v14 Stage boundary、v15 Workbench read-only boundary。

## 待独立 reviewer 核对

独立 reviewer 需要确认：

- 当前 diff 是否只完成 Task 3 范围。
- `symphony handoff` 是否只是 generator，不是 executor。
- JSON 输出是否稳定来自 Task 2 fixture contract。
- Markdown command blocks 是否只作为 copy-only 文本出现。
- CLI 是否拒绝 `--output`、非法格式和位置参数。
- tests 是否证明没有 runner / kernel CLI / model invocation。
- 是否没有新增 Workbench、API route、execution endpoint、依赖或 lockfile diff。
- evidence 是否中文、路径正确、验证记录真实。

## 独立 reviewer gate

独立 reviewer 首次返回 `NEEDS_REVISION`。

reviewer 指出的问题：

- evidence 中安全扫描记录写成无输出，但实际扫描会命中 `tests/guided-goal-handoff-cli.test.js` 中 3 条断言。
- 这些命中是预期 copy-only Markdown 文本和禁止 HTTP method 断言，不是执行路径；evidence 需要改成真实记录。

修正后复核结果：

- 独立 reviewer 已返回 `APPROVED`。
- reviewer 确认修正后的扫描记录准确：3 个命中均来自 `tests/guided-goal-handoff-cli.test.js`，属于 copy-only Markdown 文本和 forbidden HTTP methods 的测试断言。
- reviewer 确认 `symphony handoff` 是 generator-only：读取固定 Task 2 fixture、校验后写 JSON 或 Markdown 到 stdout、拒绝 `--output`，handler 不接收也不调用 `runner` / `mcasRunner`。
- reviewer 确认没有 package 或 lockfile diff，`git diff --check` 通过，focused tests 通过，`pnpm check` 通过。
- reviewer 确认本 evidence 可作为 Task 3 gate 记录。

## 结论

v16 Task 3 worker 实现已完成，并已通过独立 reviewer gate。当前状态可以进入 commit、push、merge 回 `main` 的闭环流程。
