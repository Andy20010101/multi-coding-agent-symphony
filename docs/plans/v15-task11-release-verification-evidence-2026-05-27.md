# v15 Task 11 Release Verification Evidence

日期：2026-05-27

## 任务目标

本任务在 `main` 已包含 v15 Task 1-10 后执行发布级验证，并记录中文 release evidence。范围只包含验证与证据记录，不新增功能、不修复失败、不新增依赖、不修改 `pnpm-lock.yaml`、不重构 v12/v14 kernel。

## 前置状态

- 当前分支：`v15-task11-release-verification`。
- 当前 HEAD：`368b500 Document v15 workbench operation boundaries`，与 `main`、`origin/main`、`v15-task10-workbench-docs` 指向一致。
- 任务开始前 `git status --short` 无输出，工作区干净。
- 已阅读 `tmp/codex-prompts/v15_goal_execution_plan.md` 中 Task 11。
- 已复核 Task 8/9/10 evidence：
  - `docs/plans/v15-task8-workbench-static-serving-evidence-2026-05-27.md`
  - `docs/plans/v15-task9-workbench-route-smoke-evidence-2026-05-27.md`
  - `docs/plans/v15-task10-workbench-docs-evidence-2026-05-27.md`

## 本任务变更文件

- `docs/plans/v15-task11-release-verification-evidence-2026-05-27.md`

本任务没有修改功能代码、测试代码、`package.json` 或 `pnpm-lock.yaml`。

## 发布验证命令与结果

### `pnpm check`

结果：通过，退出码 `0`。

摘要：

- 执行 `node --check` 覆盖 `src/*.js`、adapter、ensemble、integrations、intake、symphony、trackers、scripts、eval replay plugin 与 `tests/*.test.js`。
- 无语法错误输出。

### `pnpm test`

结果：通过，退出码 `0`。

摘要：

- `538` tests。
- `538` pass。
- `0` fail。
- `0` cancelled。
- `0` skipped。
- `0` todo。
- duration：`2887.416125ms`。

覆盖到的 v15 Workbench 关键测试包括：

- `v15 Workbench read-only API client`
- `v15 Workbench route smoke and server parity`
- `v15 Workbench React/Vite shell`
- `v15 Workbench static serving`

### `pnpm workbench:build`

结果：通过，退出码 `0`。

摘要：

- Vite：`v8.0.14`。
- `17` modules transformed。
- 输出产物：
  - `src/symphony/workbench-static/index.html`
  - `src/symphony/workbench-static/assets/index-J_tkNlVv.css`
  - `src/symphony/workbench-static/assets/index-nLv-wKCK.js`
- 命令输出 Node WASI `ExperimentalWarning`，但命令退出码为 `0`。
- 构建后 `git status --short` 与 `git diff --stat` 均无输出，说明构建没有引入工作区 diff。

### `git diff --check`

结果：通过，退出码 `0`。

摘要：无输出。

### `node --test tests/workbench-route-smoke.test.js tests/workbench-shell.test.js`

结果：通过，退出码 `0`。

摘要：

- `14` tests。
- `14` pass。
- `0` fail。
- `0` skipped。
- duration：`117.312166ms`。

覆盖结论：

- `/workbench` browser entry、static assets、fallback/404 行为通过。
- 非 Workbench route 与 Stage Charter route 不被 React fallback 覆盖。
- 只读 API allowlist GET routes 通过。
- 非 GET Workbench 与 API 请求返回 `405`，且不会写入 state。
- `/workbench` 不暴露仓库文件或 traversal probes。
- React/Vite shell 不包含浏览器 action controls 或写入 API calls。
- Vite dev server filesystem access 限定在 Workbench root。

### `pnpm test:mutation:gate`

结果：通过，退出码 `0`。

摘要：

- Stryker instrumented source files：`6`。
- Mutants：`2382`。
- Initial test run：通过，`45` tests。
- 最终 mutation score：`74.22`。
- break threshold：`60`。
- killed：`1762`。
- timeout：`6`。
- survived：`488`。
- no coverage：`126`。
- errors：`0`。
- 平均每个 mutant 运行测试数：`2.58`。
- 总耗时：`19 minutes and 14 seconds`。

Stryker 明确输出：final mutation score `74.22` 大于等于 break threshold `60`。

### `pnpm audit --audit-level high`

结果：通过，退出码 `0`。

摘要：

- 输出：`1 vulnerabilities found`，`Severity: 1 moderate`。
- 额外执行 `pnpm audit --json --audit-level high` 复核：
  - moderate：`1`
  - high：`0`
  - critical：`0`
  - actions：`[]`
  - advisories：`{}`
  - totalDependencies：`222`

结论：当前 high audit gate 没有 high/critical vulnerability，因此不是 Task 11 release blocker。存在 `1` 个 moderate vulnerability，按本任务 `--audit-level high` 不阻塞；本任务禁止新增依赖或修改 lockfile，因此未做自动修复。

### `git diff -- package.json pnpm-lock.yaml`

结果：通过，退出码 `0`。

摘要：无输出，确认 Task 11 没有修改 `package.json` 或 `pnpm-lock.yaml`。

## 依赖与 lockfile 复查

当前分支工作区对 `package.json` / `pnpm-lock.yaml` 无 diff。

对 `v14..HEAD` 的依赖相关 diff 复查结果：

- `git diff --stat v14..HEAD -- package.json pnpm-lock.yaml`：
  - `package.json`：`10` 行变化。
  - `pnpm-lock.yaml`：`520` 行变化。
  - 合计 `529 insertions(+), 1 deletion(-)`。
- `package.json` 中新增 Workbench Vite scripts：
  - `workbench:build`
  - `workbench:dev`
- direct dependencies / devDependencies 与 Task 2/3/4 evidence 中批准范围一致：
  - `react: ^19.2.6`
  - `react-dom: ^19.2.6`
  - `vite: ^8.0.14`
  - `@vitejs/plugin-react: ^6.0.2`

未发现 Task 11 新增依赖、改写 lockfile 或引入未经 evidence 覆盖的依赖变更。

## Workbench 无写入/执行控件扫描

执行命令：

```sh
grep -RniE "<button|role=['\"]button|onClick|onSubmit|<form|<a\\s|href=" frontend/workbench/src || true
grep -RniE "method\\s*:\\s*['\"](POST|PUT|PATCH|DELETE)|navigator\\.sendBeacon|WebSocket|EventSource|XMLHttpRequest" frontend/workbench/src || true
grep -RniE "write|execute|retry|adopt|adopt-confirm|confirm-adoption|apply|rollback|delete|install|mutate|mutation|audit|model|agent|arbitrary file|arbitrary path|采纳|应用|重试|执行|回滚|删除|审计|模型" frontend/workbench/src || true
```

结果：

- 控件扫描无输出：未发现 `<button>`、`role="button"`、`onClick`、`onSubmit`、`<form>`、`<a>` 或 `href=`。
- 写入 method / 实时通道扫描无输出：未发现浏览器端 `POST`、`PUT`、`PATCH`、`DELETE`、`sendBeacon`、`WebSocket`、`EventSource` 或 `XMLHttpRequest`。
- 执行语义关键词扫描仅命中只读数据模型变量、`modelInvocation` 展示字段、`adoptionSummary` / adoption 只读状态文案和 contract projection。没有命中交互控件、写入 handler、mutation/audit trigger、model invocation trigger 或任意路径输入。

结论：v15 React/Vite Workbench 仍是 read-only / display-only / copy-only surface，不提供浏览器写入或执行入口。

## 静态服务不暴露本地任意文件

依据：

- `pnpm test` 中 `v15 Workbench route smoke and server parity` 与 `v15 Workbench static serving` 通过。
- 专门执行 `node --test tests/workbench-route-smoke.test.js tests/workbench-shell.test.js` 通过。

验证覆盖：

- `/workbench/package.json`
- `/workbench/pnpm-lock.yaml`
- `/workbench/src/symphony/console.js`
- `/workbench/docs/plans/v15-task8-workbench-static-serving-evidence-2026-05-27.md`
- `/workbench/%2e%2e/package.json`
- `/workbench/..%2fpackage.json`
- `/workbench/%2e%2e%2fpnpm-lock.yaml`
- `/workbench/%2e%2e%2fsrc%2fsymphony%2fconsole.js`
- `/workbench/%2e%2e%2fdocs%2fplans%2fv15-task8-workbench-static-serving-evidence-2026-05-27.md`
- `/workbench/%5c..%5cpackage.json`

结论：`/workbench` 静态服务只服务 `src/symphony/workbench-static/` 下的构建产物，不暴露仓库根目录、本地任意文件、docs、source file、lockfile 或 traversal probe 内容。

## Stage Charter HTML / JSON 边界

依据：

- `node --test tests/workbench-route-smoke.test.js tests/workbench-shell.test.js` 通过。
- route smoke 明确覆盖 `keeps non-Workbench and Stage Charter routes outside the React fallback`。

验证结论：

- `/docs/stages/v15-workbench-react-vite-migration.html` 不被 React fallback 覆盖。
- `/docs/stages/v15-workbench-react-vite-migration.stage.json` 不被 React fallback 覆盖。
- Stage Charter HTML / JSON 仍保持独立边界，React Workbench 入口仅为 `/workbench` / `/workbench/`。

## v12/v14 kernel 未被 v15 UI 任务修改

核对命令：

```sh
git diff --name-status v14..HEAD -- \
  src/symphony/adoption-inspect.js \
  src/symphony/stage.js \
  src/artifact-store.js \
  src/verifier.js \
  src/policy-engine.js \
  src/workspace-manager.js \
  src/integrations/workspace-bridge.js \
  docs/stages/v14-stage-kernel-refactor.stage.json \
  docs/stages/v14-stage-kernel-refactor.html
```

结果：无输出。

补充核对：

```sh
git diff --name-status v14..HEAD -- src/symphony src/artifact-store.js src/verifier.js src/policy-engine.js src/workspace-manager.js src/integrations/workspace-bridge.js docs/stages
```

输出仅包含：

- `docs/stages/v15-workbench-react-vite-migration.html`
- `docs/stages/v15-workbench-react-vite-migration.stage.json`
- `src/symphony/console.js`
- `src/symphony/workbench-static/*`

结论：以 `v14` tag 作为 v15 前的 kernel 基线，v15 UI/Workbench 任务没有修改列入核对的 v12 adoption safety kernel、v14 Stage kernel/gate、ArtifactStore、verifier、policy engine、workspace manager 或 workspace bridge 文件。v15 对 `src/symphony/console.js` 的变化属于 Task 8/9 已验证的 Workbench 静态服务与只读 API route parity，不是 v12/v14 kernel 重构。

## 安全边界结论

- 常规 gate：`pnpm check`、`pnpm test`、`pnpm workbench:build` 均通过。
- Mutation gate：通过，score `74.22`，高于 threshold `60`。
- Audit gate：`--audit-level high` 通过；存在 `1` 个 moderate vulnerability，但无 high/critical，不构成本 release gate blocker。
- Workbench：无浏览器写入控件、执行控件、form/link/button handler、写入 HTTP method、WebSocket/EventSource/sendBeacon/XMLHttpRequest。
- Static serving：不暴露本地任意文件，不暴露 repo root，不返回 traversal probe 内容。
- Stage Charter：HTML / JSON 不被 `/workbench` fallback 接管。
- v12/v14 kernel：未被 v15 UI/Workbench 任务修改。
- Task 11：只新增本 release verification evidence 文档。

## Release 风险

- `pnpm audit --audit-level high` 通过，但 audit metadata 显示 `1` 个 moderate vulnerability。按当前 high 阈值不阻塞 release；若 release policy 后续提升到 moderate 阈值，需要单独处理并重新审计。
- `pnpm workbench:build` 输出 Node WASI experimental warning。该 warning 未影响退出码或构建产物，但属于运行环境噪音。
- Mutation gate 仍存在 surviving/no coverage mutants，但最终 score `74.22` 高于配置 break threshold `60`，且 errors 为 `0`；本任务按现有 mutation policy 判定通过。

## 最终状态

- 本任务没有 commit。
- 本任务没有 push。
- 本任务没有修改功能代码。
- 本任务没有新增依赖。
- 本任务没有修改 `pnpm-lock.yaml`。
- 本任务没有修复或伪造任何验证失败。
