# v17 release evidence

日期：2026-05-28
工作树：`main`
输入文件：

- `tmp/codex-prompts/v17_update_plan.md`
- `tmp/codex-prompts/v17_execution_prompts.md`

## 执行范围

v17 已按新增 plan 和 execution prompts 落地到当前 checkout。本次没有创建 release tag，没有 push tag，也没有把当前 released repository tag 从 `v16` 改成 `v17`。

已新增和更新的能力：

- `goal-progress-ledger.v1`：新增 contract 解析、验证、默认 goal 注册表、状态渲染、fixtures、CLI 输出、API route 和 Workbench 展示。
- `capabilities.v1`：新增只读能力 contract、fixture、API route 和 Workbench 展示。
- `diagnostics.v1`：新增只读 diagnostics contract、fixture、API route 和 Workbench 展示。
- `error-envelope.v1`：新增安全错误包络、fixture、API route 错误返回和前端错误消费。
- `symphony goal-status`：支持 human、JSON、Markdown 输出；`progress` 作为同义命令；命令只读，不写 state，不执行外部操作。
- Workbench：新增 Goal Progress、Capabilities、Diagnostics 面板；所有字段来自后端 contract，不从文件名、路径、分支、命令文本或缺失字段推断状态。
- 文档：v17 plan、execution prompts、product contracts、operator guide 和 README 已更新。

## 只读边界

本次保留以下边界：

- Workbench 没有新增写 state、写文件、创建分支、commit、push、merge、apply、adopt、retry、rollback、delete、install、audit、mutation 或 model invocation 控件。
- Workbench 没有新增浏览器执行 command、clipboard 写入、download、open local file、`file:` URI 或任意路径 preview。
- `goal-progress-ledger.v1` 不从 artifact 名称、branch、命令、路径或缺失字段推断 approval / verification / release 状态。
- `release-ready` 只接受显式 release evidence 和 release gate 通过记录。
- `error-envelope.v1` 不返回本地绝对路径、stack trace、secret、raw exception message 或任意用户输入 path。

## Contract 和 fixture

新增 fixture：

- `fixtures/contracts/goal-progress-ledger.planned.v1.json`
- `fixtures/contracts/goal-progress-ledger.approved.v1.json`
- `fixtures/contracts/goal-progress-ledger.needs-revision.v1.json`
- `fixtures/contracts/goal-progress-ledger.blocked.v1.json`
- `fixtures/contracts/goal-progress-ledger.unknown.v1.json`
- `fixtures/contracts/goal-progress-ledger.release-ready.v1.json`
- `fixtures/contracts/capabilities.v1.json`
- `fixtures/contracts/diagnostics.v1.json`
- `fixtures/contracts/error-envelope.v1.json`

新增实现文件：

- `src/symphony/goal-progress-ledger.js`
- `src/symphony/capabilities.js`
- `src/symphony/diagnostics.js`
- `src/symphony/error-envelope.js`

新增测试文件：

- `tests/v17-contracts.test.js`
- `tests/v17-goal-progress.test.js`
- `tests/v17-console-api.test.js`

## CLI 验证

命令：

```bash
pnpm symphony goal-status --json
pnpm symphony goal-status --markdown
```

结果：

- 两个命令均通过。
- 当前 checkout 没有 `.symphony/goals/v17-readonly-goal-progress-console-contracts.json` 本地 progress state，因此 CLI 返回 registered v17 goal template。
- JSON 输出为 `goal-progress-ledger.v1`，10 个 task 均为 `planned`，release gates 为 `unknown`。
- Markdown 输出列出 `task-1` 到 `task-10`，状态均为 `planned`。
- 该结果符合 v17 约束：没有本地显式 evidence 时不推断完成状态。

## 测试结果

已执行：

```bash
pnpm check
node --test tests/v17-contracts.test.js tests/v17-goal-progress.test.js tests/v17-console-api.test.js tests/workbench-api-client.test.js tests/workbench-route-smoke.test.js
node --test tests/symphony-cli.test.js
pnpm test
pnpm workbench:build
pnpm audit --audit-level high
pnpm test:mutation:gate
git diff --check
```

结果：

- `pnpm check`：通过。
- v17 和 Workbench route smoke 定向测试：通过。
- `tests/symphony-cli.test.js`：通过。
- `pnpm test`：95 个 suites，568 个 tests，568 pass，0 fail，duration 约 `3050ms`。
- `pnpm workbench:build`：通过；Vite 生成 `index-BTVrZKfX.css` 和 `index-ByQvKJF_.js`。
- `pnpm audit --audit-level high`：exit code 0；输出仍显示 1 个 moderate vulnerability。当前 high 阈值通过，moderate 项未在 v17 中修复。
- `pnpm test:mutation:gate`：通过；mutation score `74.22`，covered `78.37`，killed `1762`，timed out `6`，survived `488`，no coverage `126`，break threshold `60`，duration `17m58s`。
- `git diff --check`：无输出。

## 已知状态

- v17 代码和文档已在当前 checkout 中实现。
- 当前 released repository tag 仍是 `v16`。创建 `v17` tag 需要单独执行并记录 tag evidence。
- `pnpm audit --audit-level high` 通过，但 moderate vulnerability 仍在 backlog 中。
- 当前 Workbench 静态资源 hash 已随 `pnpm workbench:build` 更新。
