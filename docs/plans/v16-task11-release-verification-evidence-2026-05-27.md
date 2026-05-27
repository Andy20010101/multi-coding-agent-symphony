# v16 Task 11 release verification 证据

日期：2026-05-27
分支：`v16-task11-release-verification`
基线：`main` 已包含 `4131864 Document v16 handoff and preview boundaries`

## 范围

本任务只做发布级验证和中文 evidence。没有新增功能，没有修改源码、测试、server、kernel、依赖或 lockfile，没有创建 tag，也没有推送 release tag。

## 分支入口

从 `main` 开始：

- `git status -sb`：`main...origin/main`。
- Task 10 已在 `main`：HEAD 为 `4131864 Document v16 handoff and preview boundaries`。
- `git switch -c v16-task11-release-verification`：通过。

## 完整验证

- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml`
  - `pnpm check`：通过。
  - `pnpm test`：557 个 tests，91 个 suites，557 pass，0 fail，duration `2986.30875ms`。
  - `pnpm workbench:build`：通过，输出 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。
  - `git diff --check`：无输出。
  - `git diff -- package.json pnpm-lock.yaml`：无输出。

## Focused tests

Handoff：

- `node --test tests/guided-goal-handoff-cli.test.js tests/guided-goal-handoff-contract.test.js`
  - 8 个 tests，2 个 suites，8 pass，0 fail，duration `52.497625ms`。

Safe preview / Workbench consumption：

- `node --test tests/safe-artifact-preview-contract.test.js tests/workbench-api-client.test.js tests/workbench-shell.test.js`
  - 22 个 tests，4 个 suites，22 pass，0 fail，duration `74.740583ms`。

Route smoke/security：

- `node --test tests/workbench-route-smoke.test.js`
  - 8 个 tests，1 个 suite，8 pass，0 fail，duration `106.402542ms`。

## Audit

- `pnpm audit --audit-level high`
  - exit code 0。
  - 输出：`1 vulnerabilities found`，`Severity: 1 moderate`。
  - high gate 通过；未自动修复 moderate vulnerability。

## 安全扫描

通用浏览器控件扫描：

- `rg -n "<button|role=['\"]button|onClick|onSubmit|<form|<a\\s|href=" frontend/workbench/src src/symphony tests || true`
  - 命中测试里的负向断言和 HTML asset regex。
  - 命中既有 legacy console HTML 的刷新 / view tab buttons。
  - 命中 React/Vite build asset 中的 React runtime `onClick` / `href` 字符串。
  - 未发现 `frontend/workbench/src` 新增按钮、链接、表单、handler 或浏览器执行控件。

通用写入 API 扫描：

- `rg -n "method\\s*:\\s*['\"](POST|PUT|PATCH|DELETE)|navigator\\.sendBeacon|WebSocket|EventSource|XMLHttpRequest" frontend/workbench/src src/symphony tests || true`
  - 命中 `tests/workbench-shell.test.js` 里的禁用 API 负向断言。
  - 命中 route smoke / CLI tests 中预期的 `POST` 拒绝用例。
  - 未发现 Workbench 源码新增 POST / PUT / PATCH / DELETE、sendBeacon、WebSocket、EventSource 或 XMLHttpRequest。

通用执行能力词扫描：

- `rg -n "adopt|apply|retry|execute|rollback|delete|mutate|mutation|audit|model|install|采纳|应用|重试|执行|回滚|删除|审计|模型|安装" frontend/workbench/src src/symphony tests || true`
  - 命中既有 adoption inspect、Stage safety 文案、prompt router、model profile tests、policy tests、QA audit fixture、Workbench 只读展示字段和负向断言。
  - 未发现 Workbench 源码新增执行按钮、写入 handler、模型调用、安装入口、audit 入口或 adopt/apply/retry/rollback 控件。

通用 artifact safety 字段扫描：

- `rg -n "safeToRenderInline|previewAvailable|mime|artifactKind|sourceRunId|sizeBytes|displayTitle|uri|ref|previewText|contentText" frontend/workbench/src src/symphony tests || true`
  - 命中 `safe-artifact-preview.v1` contract validator、console backend preview builder、Workbench contract projection、tests 和 fixture assertions。
  - 命中均为 contract 字段、后端判定、只读投影或负向断言。

针对 Workbench 源码的收紧扫描：

- `rg -n "dangerouslySetInnerHTML|innerHTML|insertAdjacentHTML|DOMParser|<iframe|srcdoc|onClick|onSubmit|addEventListener\\s*\\(|<button\\b|role\\s*=\\s*[\\\"']button[\\\"']|<a\\s|href\\s*=|<form\\b|<input\\b|<select\\b|<textarea\\b|navigator\\.clipboard|localStorage|indexedDB" frontend/workbench/src || true`
  - 无输出。
- `rg -n "method\\s*:\\s*['\\\"](POST|PUT|PATCH|DELETE)['\\\"]|fetch\\([^\\n]*(POST|PUT|PATCH|DELETE)|handle(Execute|Retry|Apply|Adopt|Rollback|Delete|Install|Mutate|Audit)|dangerouslySetInnerHTML" frontend/workbench/src tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js || true`
  - 仅命中测试里的负向断言和 `/workbench/` POST 拒绝用例。
  - 未命中 Workbench 源码。
- `rg -n "safeToRenderInline\\s*:\\s*true|previewAvailable\\s*:\\s*true|artifactKind\\s*:\\s*artifact\\.kind|/artifacts/\\$\\{|/artifacts/'\\s*\\+|extname|artifact\\.path[\\s\\S]{0,80}\\.endsWith|\\.endsWith\\s*\\(\\s*['\\\"]\\.(html|json|txt)|\\.includes\\s*\\(\\s*['\\\"]\\.html" frontend/workbench/src || true`
  - 无输出。

## Package / lockfile

- `git diff -- package.json pnpm-lock.yaml`：无输出。
- `git diff --stat v15..HEAD -- package.json pnpm-lock.yaml`：无输出。
- `git log --oneline --decorate -- package.json pnpm-lock.yaml | head -12`：最近相关提交仍是 v15 React/Vite dependency plan 和 shell 任务，v16 未修改 package 或 lockfile。

## v12 / v14 / v15 safety boundary

- `git diff v15..HEAD -- src/symphony/adoption-inspect.js src/symphony/stage.js`：无输出。
- v16 未修改 v12 adoption inspect / confirm safety 文件。
- v16 未修改 v14 Stage kernel / Stage gate 文件。
- v15 Workbench read-only boundary 仍由以下验证覆盖：
  - `tests/workbench-shell.test.js`
  - `tests/workbench-route-smoke.test.js`
  - `tests/workbench-api-client.test.js`
  - `tests/workbench-shell.test.js` 中的 `v15 Workbench static serving` suite 通过 `pnpm test` 执行。

## Release 风险

- 没有 high severity audit failure。
- 保留 1 个 moderate audit finding；本任务按计划不修 audit。
- 没有新增依赖、lockfile diff、tag 或 release tag。
- Workbench 仍为 read-only / display-only / copy-only。
- Safe preview 仍只读 registered artifact refs，不支持 arbitrary path、download、open local file 或 browser execution。
- Diagnostics、shared capabilities、route error envelope 仍是 backlog contract，不在 v16 Task 11 中实现。

## Reviewer gate

独立 reviewer：`019e69c1-c54a-7fc0-8bff-57bcbd1c1b22`

结果：`APPROVED`
