# v16 Task 5 Workbench handoff 只读面板证据

日期：2026-05-27
分支：`v16-task5-workbench-handoff-panel`
基线：`main` 已包含 `5403cb2 Expose v16 handoff through read-only API`

## 范围

本任务只把 Task 4 已暴露的 handoff GET route 接入 Workbench：

- `GET /api/handoff` 作为注册 ref index。
- `GET /api/handoff/guided-goal-handoff.v1` 只通过注册 ref 派生。
- Workbench 展示 goal、baseline、registered refs、roles、tasks、evidencePath、reviewGate、copy-only command blocks。
- command blocks 只渲染为 `<code>` 文本。页面没有按钮、表单、链接、clipboard 调用或执行 handler。

没有改动后端执行能力、模型调用、adopt/apply/retry/rollback/audit/install/mutation 入口，也没有改动依赖文件。

## Preflight

从 `main` 开始：

- `git checkout main`：已在 `main`，并且与 `origin/main` 对齐。
- `git pull`：`Already up to date.`
- `git status -sb`：`## main...origin/main`
- `git log --oneline --decorate -8`：HEAD 为 `5403cb2`，其后包含 Task 3、Task 2、Task 1 的 v16 commits。
- `git diff --check`：无输出。
- `git diff -- package.json pnpm-lock.yaml`：无输出。

基线验证：

- `pnpm check`：通过。
- `pnpm test`：547 个测试通过，90 个 suites，0 fail，duration `3004.661875ms`。
- `pnpm workbench:build`：通过，构建输出为当时 main 上的 Workbench static assets。

之后从该基线创建分支：

- `git switch -c v16-task5-workbench-handoff-panel`

## 代码变更

前端 API binding：

- `frontend/workbench/src/api/contracts.js`
  - `READONLY_API_ROUTES` 新增 `GET /api/handoff`。
  - `READONLY_API_ROUTE_ALLOWLIST` 新增 `GET /api/handoff/<ref>` 模板。
  - `createGuidedGoalHandoffRoute()` 只从 `/api/handoff` 返回的 `refs` 中选择 `guided-goal-handoff.v1`，再构造固定 `/api/handoff/<encoded-ref>` 请求。
  - `projectGuidedGoalHandoff()` 将 handoff contract 投影成 UI model；缺失字段保持 `未暴露`。
- `frontend/workbench/src/api/client.js`
  - 先读取固定 GET routes。
  - 再基于注册 ref 读取 `guided-goal-handoff.v1`。
  - 找不到注册 ref 时返回 skipped read-only state，不拼接任意路径。

Workbench UI：

- `frontend/workbench/src/App.jsx`
  - 新增 `HandoffPanel`。
  - 展示 registered refs、phase/copy-only command blocks、roles、tasks/evidence/review gate。
  - command blocks 使用 `<code>` 文本；没有 copy button，也没有 execute button。
  - task 的 `phase` 和 `status` 当前 contract 未暴露，UI 显示 `未暴露`。
- `frontend/workbench/src/styles/workbench.css`
  - 新增 handoff panel 和命令文本样式。
  - 命令文本设置 `user-select: text`，只支持用户手动选择/复制。

测试与静态构建：

- `tests/workbench-api-client.test.js`
  - 冻结新增 GET allowlist。
  - 覆盖 handoff refs、detail route、copy-only command blocks、missing task status。
- `tests/workbench-shell.test.js`
  - 扩展 shell 扫描，确认新增组件存在。
  - API path allowlist 加入 `/api/handoff` 与 `/api/handoff/<ref>`。
  - 继续扫描按钮、表单、写方法、clipboard、browser action handler。
- `pnpm workbench:build` 生成新的 Workbench static asset hash，并删除旧 hash 文件。

## 本地验证

聚焦测试：

- `node --test tests/workbench-api-client.test.js`
  - 6 个测试通过，0 fail。
- `node --test tests/workbench-shell.test.js`
  - 9 个测试通过，0 fail。

全量验证：

- `pnpm workbench:build`
  - 通过。
  - 输出 `src/symphony/workbench-static/index.html`、`index-BNWPIsAg.js`、`index-BdBWycDT.css`。
- `pnpm check`
  - 通过。
- `pnpm test`
  - 547 个测试通过，90 个 suites，0 fail，duration `2960.780875ms`。
- `git diff --check`
  - 无输出。
- `git diff -- package.json pnpm-lock.yaml`
  - 无输出。

安全扫描：

- `rg -n "<button\\b|role\\s*=\\s*['\\\"]button['\\\"]|<a\\s|href\\s*=|<form\\b|<input\\b|<select\\b|<textarea\\b|\\bonClick\\b|\\bonSubmit\\b|addEventListener\\s*\\(|XMLHttpRequest|WebSocket|EventSource|navigator\\.sendBeacon|navigator\\.clipboard|serviceWorker|localStorage|indexedDB|\\bmethod\\s*:\\s*['\\\"](POST|PUT|PATCH|DELETE)['\\\"]|\\bhandle(Execute|Retry|Apply|Adopt|Rollback|Delete|Install|Mutate|Audit)\\b" frontend/workbench/src`
  - 无输出，exit code 1。
- `rg -n "safeToRenderInline\\s*:\\s*true|previewAvailable\\s*:\\s*true|artifactKind\\s*:\\s*artifact\\.kind|child_process|spawn\\s*\\(|execFile\\s*\\(|execSync\\s*\\(|navigator\\.clipboard" frontend/workbench/src`
  - 无输出，exit code 1。

## 浏览器检查

本地启动：

- `node scripts/symphony.js console --host 127.0.0.1 --port 18765 --state-dir /tmp/symphony-v16-task5-browser-state`
- 打开 `http://127.0.0.1:18765/workbench/`

检查结果：

- 页面状态：`5/7 routes 已读取`。临时 state 没有 latest run，因此 latest run 与 timeline 不适用；handoff route 已读取。
- DOM 中存在 `Guided Goal Handoff` panel。
- handoff panel 显示：
  - `refs.readOnly` 为 `true`
  - `refs.arbitraryPathReads` 为 `false`
  - `refs.count` 为 `1`
  - `commands.copyOnly` 为 `true`
  - `role count` 为 `5`
  - `task count` 为 `12`
  - `command block count` 为 `6`
  - registered ref 为 `/api/handoff/guided-goal-handoff.v1`
- handoff panel 中 `<code>` 命令文本数量为 `32`。
- task `status` 显示 `未暴露`。
- DOM 控件计数：
  - buttons：`0`
  - forms/inputs/selects/textareas：`0`
  - anchors：`0`
- browser console warning/error：`[]`

本地 console server 已停止。

## 保留限制

- Workbench 不读取任意本地文件。
- Workbench 不执行 handoff command。
- Workbench 不调用模型。
- Workbench 不根据前端路径、文件扩展名、MIME 或 artifact kind 推断安全性。
- `guided-goal-handoff.v1` 当前没有 task `phase` 和 `status` 字段；UI 只显示 `未暴露`。

## Reviewer gate

独立 reviewer：`019e69c1-c54a-7fc0-8bff-57bcbd1c1b22`

结果：`APPROVED - no blocking findings.`

Reviewer 直接读取当前分支 diff、未跟踪 static assets 和本证据，确认：

- `contracts.js` / `client.js` 只绑定 GET routes；handoff detail route 来自 `/api/handoff` 注册 refs，并在 fetch 前编码。
- `App.jsx` 将 handoff commands 渲染为可选中的 `<code>` 文本；没有按钮、表单、clipboard 调用或 action handlers。
- task `phase` / `status` 缺失时保持 `未暴露`，没有前端推断。
- reviewer 复跑：
  - `node --test tests/workbench-api-client.test.js`：6/6 pass。
  - `node --test tests/workbench-shell.test.js`：9/9 pass。
  - `git diff --check`：clean。
  - `git diff -- package.json pnpm-lock.yaml`：empty。

Reviewer 残留风险：未复跑全量 `pnpm test`、`pnpm check`、`pnpm workbench:build` 或浏览器检查；这些由 worker 在本证据的本地验证和浏览器检查中记录。
