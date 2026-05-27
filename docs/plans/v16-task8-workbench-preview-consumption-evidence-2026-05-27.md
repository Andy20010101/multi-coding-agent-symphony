# v16 Task 8 Workbench preview consumption 证据

日期：2026-05-27
分支：`v16-task8-workbench-preview-consumption`
基线：`main` 已包含 `7704fb6 Implement v16 safe artifact previews`

## 范围

本任务把 Task 7 后端 safe artifact preview contract 接入 React/Vite Workbench。Workbench 只读取后端暴露的 `artifact.uri`，只展示 `safe-artifact-preview.v1` contract 字段，不根据 artifact kind、路径、扩展名或 MIME 自行判断是否可 inline。

## Preflight

从 `main` 开始：

- `git checkout main && git pull --ff-only`：`Already up to date.`
- `git log --oneline --decorate -4`：HEAD 为 `7704fb6`，Task 7 已在 `main`。
- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml`
  - `pnpm check`：通过。
  - `pnpm test`：554 个 tests，91 个 suites，554 pass，0 fail，duration `3199.34925ms`。
  - `pnpm workbench:build`：通过，输出当时 `main` 上的 Workbench static assets。
  - `git diff --check`：无输出。
  - `git diff -- package.json pnpm-lock.yaml`：无输出。

之后创建分支：

- `git switch -c v16-task8-workbench-preview-consumption`

## 实现

API client：

- 新增 `SAFE_ARTIFACT_PREVIEW_ROUTE_TEMPLATE`，template 为 `GET /api/runs/<run-id>/artifacts/<artifact-kind>/preview`，contract 为 `safe-artifact-preview.v1`。
- `createSafeArtifactPreviewRoutes()` 只从 latest run 的 `artifact.uri` 创建 route，不用 `artifact.kind`、`artifact.path` 或扩展名拼 route。
- safe preview route 只接受 `/api/runs/.../artifacts/.../preview` 形态，不接受 query、hash、反斜杠或 `..`。
- `fetchReadonlyRoute()` 对 safe preview route 允许 403/404 返回的 valid `safe-artifact-preview.v1` error contract 进入只读投影；其他 route 仍按原逻辑处理非 2xx。

Workbench 投影：

- `projectArtifactRefs()` 为每个 artifact 增加 `preview` 投影，字段来自后端 payload：
  - `contractName`
  - `contractVersion`
  - `status`
  - `mime`
  - `displayTitle`
  - `artifactKind`
  - `sourceRunId`
  - `sizeBytes`
  - `maxPreviewBytes`
  - `previewAvailable`
  - `safeToRenderInline`
  - `truncated`
  - `truncationReason`
  - `downloadAvailable`
- `Latest run` panel 和独立 `Artifact refs/list` panel 使用同一组 safe preview results，避免同一个 artifact 在两个位置显示不同状态。
- `DEFERRED_CONTRACT_GAPS` 删除 artifact preview 字段缺口，保留与本任务无关的 shared capabilities / error envelope / dirty adoption gap。

React 渲染：

- `SafePreviewBlock` 展示后端 safe preview 字段。
- 只有 `safeToRenderInline === true` 且后端提供 `contentText` 或 `previewText` 字符串时，才在 `<pre><code>` 中显示文本。
- HTML、binary、blocked、missing、directory 或后端未提供 inline text 的 preview 显示不可 inline 原因，不渲染正文。
- 没有使用 `dangerouslySetInnerHTML`、`innerHTML`、`DOMParser` 或等价 HTML 注入。

构建产物：

- `pnpm workbench:build` 生成新的 static asset：
  - `src/symphony/workbench-static/assets/index-C6voo6oV.css`
  - `src/symphony/workbench-static/assets/index-CXPDMaMd.js`
- 删除旧 asset：
  - `src/symphony/workbench-static/assets/index-BdBWycDT.css`
  - `src/symphony/workbench-static/assets/index-BNWPIsAg.js`
- `src/symphony/workbench-static/index.html` 指向新的 asset hash。

## Tests

更新 `tests/workbench-api-client.test.js`：

- read-only route allowlist 增加 safe preview template。
- `fetchReadonlyRoute()` 对 safe preview route 仍使用 `GET`、`no-store`、`Accept: application/json`，不带 body。
- 新增 safe preview consumption 覆盖：
  - safe JSON preview 显示 `contentText`。
  - `text/html; charset=utf-8` preview 即使 payload 带 `contentText`，只要 `safeToRenderInline` 为 `false`，前端也不展示该文本。
  - blocked preview 以 403 `safe-artifact-preview.v1` contract 投影，显示 `blocked-artifact-path`、`downloadAvailable:false`。
  - preview routes 只来自后端 `artifact.uri`。

更新 `tests/workbench-shell.test.js`：

- approved API path list 增加 `/api/runs/<run-id>/artifacts/<artifact-kind>/preview`。
- 源码扫描确认没有按钮、链接、表单、handler、非 GET method、浏览器存储、剪贴板或 HTML 注入。
- 源码扫描确认没有 `safeToRenderInline: true` / `previewAvailable: true` 这类前端伪造安全字段，也没有从 artifact path / 扩展名推断安全性。

## 本地验证

聚焦验证：

- `node --check frontend/workbench/src/api/client.js && node --check frontend/workbench/src/api/contracts.js`
  - 通过。
- `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js`
  - 22 个 tests，4 个 suites，22 pass，0 fail，duration `102.885542ms`。
- `pnpm workbench:build`
  - 通过，输出 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。

完整验证：

- `pnpm check && pnpm test && pnpm workbench:build && git diff --check && git diff -- package.json pnpm-lock.yaml`
  - `pnpm check`：通过。
  - `pnpm test`：555 个 tests，91 个 suites，555 pass，0 fail，duration `3117.7625ms`。
  - `pnpm workbench:build`：通过，输出 `index-CXPDMaMd.js` 和 `index-C6voo6oV.css`。
  - `git diff --check`：无输出。
  - `git diff -- package.json pnpm-lock.yaml`：无输出。

安全扫描：

- `rg -n "dangerouslySetInnerHTML|innerHTML|insertAdjacentHTML|DOMParser|<iframe|srcdoc|onClick|onSubmit|addEventListener\\s*\\(|<button\\b|role\\s*=\\s*[\\\"']button[\\\"']|<a\\s|href\\s*=|<form\\b|<input\\b|<select\\b|<textarea\\b|navigator\\.clipboard|localStorage|indexedDB" frontend/workbench/src`
  - 无输出，exit code 1。
- `rg -n "method\\s*:\\s*['\\\"](POST|PUT|PATCH|DELETE)['\\\"]|fetch\\([^\\n]*(POST|PUT|PATCH|DELETE)|handle(Execute|Retry|Apply|Adopt|Rollback|Delete|Install|Mutate|Audit)|dangerouslySetInnerHTML" frontend/workbench/src tests/workbench-api-client.test.js tests/workbench-shell.test.js`
  - 命中测试里的负向断言和 `/workbench/` POST route smoke；未命中 Workbench 源码。
- `rg -n "safeToRenderInline\\s*:\\s*true|previewAvailable\\s*:\\s*true|artifactKind\\s*:\\s*artifact\\.kind|/artifacts/\\$\\{|/artifacts/'\\s*\\+|extname|artifact\\.path[\\s\\S]{0,80}\\.endsWith|\\.endsWith\\s*\\(\\s*['\\\"]\\.(html|json|txt)|\\.includes\\s*\\(\\s*['\\\"]\\.html" frontend/workbench/src`
  - 无输出，exit code 1。

浏览器核对：

- 临时 console server：`http://127.0.0.1:54009/workbench/`
- Headless Chrome DOM 检查：
  - `hasSafePreviewText: true`
  - `hasSafeContract: true`
  - `hasHtmlMime: true`
  - `hasNoUnsafeScriptText: true`
  - `noUnavailableSafePreview: true`
  - `controlCount: 0`
- 截图：`/tmp/symphony-task8-workbench.png`
- 截图中页面首屏正常渲染，route 计数为 `10/10 routes 已读取`，没有浏览器执行控件。

## 保留限制

- Workbench 不下载 artifact，不打开本地路径。
- Workbench 不执行命令，不调用模型，不新增 audit / mutation route。
- Workbench 不新增 adopt / apply / retry / rollback 控件。
- Workbench 不读取任意本地路径。
- 没有新增依赖或 lockfile 变更。
- 没有修改 v12 adoption safety boundary、v14 Stage boundary、v15 Workbench read-only boundary。

## Reviewer gate

独立 reviewer：`019e69c1-c54a-7fc0-8bff-57bcbd1c1b22`

结果：`APPROVED`

- Reviewer 未发现阻塞问题。
