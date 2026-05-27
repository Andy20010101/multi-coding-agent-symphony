# v15 Task 8 Workbench 静态服务集成 Evidence

日期：2026-05-27

## 任务目标

本任务把 React/Vite Workbench 构建产物以只读方式接入 console server 的静态服务边界。范围只包含 `/workbench` 静态入口、构建产物 asset serving、Workbench app route fallback、MIME / headers、path traversal 防护、API / Stage 边界测试与证据记录。

本任务不扩展业务能力，不新增浏览器执行入口，不新增写入型 API。

## 前置状态

- Task 1 已冻结 Workbench console API fixture contracts。
- Task 2 已完成 React/Vite 依赖引入计划。
- Task 3 已受控引入 React/Vite dependencies。
- Task 4 已创建最小 React/Vite Workbench shell，并修复 Vite dev server `server.fs.allow` 边界。
- Task 5 已建立只读 API binding。
- Task 6 已建立只读 Workbench panels。
- Task 7 已建立只读 timeline / artifact list / adoption summary 展示。
- 本任务开始时目标仓库位于 `v15-task8-workbench-static-serving` 分支。
- 本任务没有新增依赖，没有运行 `pnpm add`，没有修改 `pnpm-lock.yaml`。

## 变更文件

- `src/symphony/console.js`
- `frontend/workbench/vite.config.js`
- `src/symphony/workbench-static/index.html`（由 `pnpm workbench:build` 生成）
- `tests/workbench-shell.test.js`
- `docs/plans/v15-task8-workbench-static-serving-evidence-2026-05-27.md`

`src/symphony/workbench-static/assets/index-J_tkNlVv.css` 与 `src/symphony/workbench-static/assets/index-nLv-wKCK.js` 的 hash 文件名未变化；本次构建只让 `index.html` 中的 asset URL 从 `/assets/*` 变为 `/workbench/assets/*`。

## 静态服务入口

Console server 新增 `/workbench` 与 `/workbench/*` 静态服务入口，静态根目录固定为 `src/symphony/workbench-static/`。

实现边界：

- 只从 `src/symphony/workbench-static/` 读取构建产物。
- 不接受用户传入的任意本地路径。
- 不读取仓库根目录。
- 不读取 `src/symphony/console.js`、`docs/*`、`package.json`、`pnpm-lock.yaml`。
- 非 `GET` 请求仍沿用 console server 只读策略返回 `405`。

## 路由边界

- `/workbench` 与 `/workbench/` 返回 Workbench `index.html`。
- `/workbench/assets/...` 只服务构建产物目录下实际存在的 asset 文件。
- `/workbench/runs/example-run` 这类 Workbench app 内部 route 可以 fallback 到 `index.html`。
- `/api/*` 继续优先走原有只读 API route，不被 React fallback 覆盖。
- 非 Workbench route 不会被 React fallback 吞掉。
- Stage Charter HTML / JSON 路径不被 Workbench fallback 覆盖。
- `/` 仍保留现有 console server-rendered Workbench HTML，没有替换为 React app。

## asset serving 边界

Vite config 新增 `base: '/workbench/'`，使生产构建的 JS / CSS 资源指向 `/workbench/assets/*`。

Asset serving 只允许静态根目录内的文件：

- 存在的 JS asset 返回 `200`。
- 存在的 CSS asset 返回 `200`。
- `/assets/*` 根路径不提供 Workbench 资源，返回 `404`。
- 缺失 asset 返回 `404`。
- `assets` 目录本身或 asset 后继续追加路径，不返回目录内容。

## fallback / 404 行为

- `/workbench` 和 `/workbench/` 返回 `index.html`。
- Workbench app 内部无扩展名 route 缺失时 fallback 到 `index.html`。
- `/workbench/assets/missing.js` 返回 `404`。
- `/workbench/package.json` 返回 `404`。
- `/workbench/src/symphony/console.js` 返回 `404`。
- `/workbench/docs/plans/...` 返回 `404`。
- `/docs/stages/v15-workbench-react-vite-migration.html` 返回 `404`，不会被 React app 替代。
- `/docs/stages/v15-workbench-react-vite-migration.stage.json` 返回 `404`，不会被 React app 替代。

## MIME / headers 策略

新增静态响应头策略：

- `.html` 返回 `Content-Type: text/html; charset=utf-8`。
- `.js` / `.mjs` 返回 JavaScript MIME：`text/javascript; charset=utf-8`。
- `.css` 返回 `text/css; charset=utf-8`。
- `.json` 如存在于构建产物目录内，返回 `application/json; charset=utf-8`。
- 未识别扩展名返回 `application/octet-stream`。
- 静态响应包含 `X-Content-Type-Options: nosniff`。
- 没有新增宽松 CORS。
- 没有新增允许执行本地文件的能力。

## path traversal 防护

`/workbench` 静态路径会先解码并做边界检查：

- 拒绝 `../`。
- 拒绝编码后的 traversal，例如 `%2e%2e` 与 `%2f` 组合。
- 拒绝绝对路径。
- 拒绝 Windows drive 风格路径。
- 拒绝反斜杠与编码反斜杠 `%5c`。
- 解析后的文件路径必须仍在 `src/symphony/workbench-static/` 目录内。

Traversal 请求返回 `403` 或 `404`，不会返回本地文件内容。

## 被拒绝的本地文件访问范围

测试确认以下探测不会返回文件内容：

- `/workbench/%2e%2e/package.json`
- `/workbench/..%2fpackage.json`
- `/workbench/%2e%2e%2fsrc%2fsymphony%2fconsole.js`
- `/workbench/%5c..%5cpackage.json`
- `/workbench/package.json`
- `/workbench/pnpm-lock.yaml`
- `/workbench/src/symphony/console.js`
- `/workbench/docs/plans/v15-task1-api-fixtures-evidence-2026-05-27.md`

本任务的 static serving 只服务 Workbench 构建产物目录，不暴露仓库根目录。

## API route 不被覆盖确认

测试确认 `/api/summary` 仍返回 `symphony.console-snapshot`，没有被 React fallback 覆盖。

本任务没有新增 `POST` / `PUT` / `PATCH` / `DELETE` API。Console server 对非 `GET` 请求继续返回只读 `405`。

## Stage Charter HTML / JSON 边界确认

- 本任务没有修改 `docs/stages/v15-workbench-react-vite-migration.stage.json`。
- 本任务没有修改或替换任何 `docs/stages/*.html`。
- `/docs/stages/v15-workbench-react-vite-migration.html` 不会 fallback 到 React app。
- `/docs/stages/v15-workbench-react-vite-migration.stage.json` 不会 fallback 到 React app。
- Stage Charter HTML / JSON 仍保持现有边界，React Workbench 不是 Stage Charter HTML 的替代品。

## Task 1 API contract 边界确认

- 本任务没有修改 Task 1 API fixture contract。
- 本任务没有修改 `/api/summary`、`/api/readiness`、`/api/runs`、`/api/runs/latest`、`/api/runs/<run-id>/timeline`、artifact preview route 的 contract shape。
- 本任务只增加静态服务相关测试，不更改既有 API contract 语义。

## Task 1 deferred gaps 处理方式

本任务没有补齐或推断 Task 1 deferred contract gaps：

- 没有实现 artifact inline preview。
- 没有推断 `safeToRenderInline`。
- 没有推断 `mime`。
- 没有推断 `previewAvailable`。
- 没有推断 `artifactKind`。
- 没有推断 `sourceRunId`。
- 没有推断 `displayTitle`。
- 没有推断 `uri/ref`。

这些字段仍等待后续明确 API contract，不由浏览器端或静态服务根据路径、扩展名或内容推断。

## v12 adoption safety 边界确认

- 本任务没有修改 v12 adoption apply safety kernel。
- 本任务没有修改 v12 fingerprint verification。
- 本任务没有修改 v12 dirty worktree check。
- 本任务没有修改 `git apply --check` 逻辑。
- 本任务没有新增 adoption inspect / apply / confirm / rollback 浏览器操作流。

## v14 Stage kernel / gate 边界确认

- 本任务没有修改 v14 Stage kernel。
- 本任务没有修改 Stage gate。
- 本任务没有修改 blocked snapshot recovery。
- 本任务没有修改 verifier、policy engine、workspace manager 或 ArtifactStore 边界。
- 本任务没有替换 Stage Charter HTML。

## 未实现内容

- 没有新增浏览器 write / execute / retry / adopt / apply / rollback / delete / install / model / mutation / audit 控件。
- 没有新增写入型 API。
- 没有新增 artifact inline preview。
- 没有新增任意本地文件读取入口。
- 没有新增任意路径输入入口。
- 没有新增宽松 CORS。
- 没有移除 legacy console HTML。
- 没有替换 Stage Charter HTML。

## 验证命令

```sh
pnpm check
pnpm test
pnpm workbench:build
node --test tests/workbench-shell.test.js
git diff --check
git diff -- package.json pnpm-lock.yaml
grep -RniE "<button|role=['\"]button|onClick|onSubmit|<form|<a\\s|href=" frontend/workbench/src || true
grep -RniE "method\\s*:\\s*['\"](POST|PUT|PATCH|DELETE)|navigator\\.sendBeacon|WebSocket|EventSource|XMLHttpRequest" frontend/workbench/src src/symphony tests || true
grep -RniE "adopt|apply|retry|execute|rollback|delete|mutate|mutation|audit|model|采纳|应用|重试|执行|回滚|删除|审计|模型" frontend/workbench/src src/symphony tests || true
grep -RniE "safeToRenderInline|previewAvailable|mime|artifactKind|sourceRunId|sizeBytes|displayTitle|uri|ref" frontend/workbench/src || true
```

## 验证结果

- `pnpm check`：通过。
- `pnpm test`：通过，`533` tests，`533` pass，`0` fail。
- `pnpm workbench:build`：通过；产物目录仍为 `src/symphony/workbench-static/`；JS / CSS hash 文件名未变化；`index.html` 的 asset URL 更新为 `/workbench/assets/*`。命令期间出现 Node WASI experimental warning，不影响退出码。
- `node --test tests/workbench-shell.test.js`：通过，`9` tests，`9` pass，`0` fail。
- `git diff --check`：通过。
- `git diff -- package.json pnpm-lock.yaml`：无输出，确认没有修改 `package.json` 或 `pnpm-lock.yaml`。

## 安全扫描结果

- 浏览器控件扫描：`frontend/workbench/src` 无 `<button>`、`role="button"`、`onClick`、`onSubmit`、`<form>`、`<a>` 或 `href=` 命中。
- 写入 method / 实时通道扫描：命中仅来自既有测试中的 `POST` 负向断言，以及 `tests/workbench-shell.test.js` 对 `XMLHttpRequest` / `WebSocket` / `EventSource` / `navigator.sendBeacon` 的禁止断言；没有新增浏览器写入 method、sendBeacon、WebSocket、EventSource 或 XMLHttpRequest 使用。
- 执行类关键词扫描：命中既有只读字段、adoption 状态文案、copy-only command 分组、v12/v14 kernel 与测试代码中的历史执行语义；Task 8 没有新增执行按钮、handler、mutation/audit/model trigger 或写入 endpoint。
- deferred gap 字段扫描：命中 `DEFERRED_CONTRACT_GAPS`、只读 `artifactRefs` 展示和 API projection 字段；没有把 `safeToRenderInline`、`previewAvailable`、`mime`、`artifactKind`、`sourceRunId`、`sizeBytes`、`displayTitle`、`uri/ref` 推断为可用能力。

## 延后事项

- Artifact preview 继续等待后端 contract 明确 `uri/ref`、`mime`、`displayTitle`、`safeToRenderInline`、`sourceRunId`、`artifactKind`、`previewAvailable`、`sizeBytes`。
- Dedicated dirty adoption diagnostics contract 继续延后。
- Shared top-level `capabilities` object 与 shared error envelope 继续延后。
- Adoption inspect / apply / confirm / rollback 继续不属于本任务。
- Legacy console HTML 是否在后续阶段移除，需要单独 reviewer-approved removal step。

## reviewer checklist

- [ ] 确认没有新增依赖。
- [ ] 确认没有运行 `pnpm add`。
- [ ] 确认没有修改 `pnpm-lock.yaml`。
- [ ] 确认没有新增浏览器执行控件。
- [ ] 确认没有新增写入型 API。
- [ ] 确认没有新增 `POST` / `PUT` / `PATCH` / `DELETE` route。
- [ ] 确认 `/workbench` static serving 只服务 `src/symphony/workbench-static/`。
- [ ] 确认 `/api/*` 不被 React fallback 覆盖。
- [ ] 确认 Stage Charter HTML / JSON 不被 React app 替换。
- [ ] 确认 path traversal、编码 traversal、绝对路径、反斜杠绕过被拒绝。
- [ ] 确认 `package.json`、`pnpm-lock.yaml`、`src/symphony/console.js`、`docs/*` 不会通过 Workbench static route 泄露。
- [ ] 确认没有 artifact inline preview。
- [ ] 确认没有推断 `safeToRenderInline` 或其他 Task 1 deferred contract gaps。
- [ ] 确认没有修改 v12 adoption safety kernel。
- [ ] 确认没有修改 v14 Stage kernel / gate。
