# v15 Task 7 只读 Timeline / Artifact List / Adoption Summary Evidence

日期：2026-05-27

## 任务目标

本任务在 Task 6 只读 Workbench panels 基础上，继续扩展 React/Vite Workbench 的只读展示能力：新增 latest run timeline、artifact refs/list 与 adoption summary 的只读 panels。页面仍是中文优先、低密度、copy-only 状态面，不提供执行、写入、采纳或 artifact inline preview 能力。

## 前置状态

- Task 1 已冻结 Workbench console API fixture contracts。
- Task 2 已完成 React/Vite 依赖引入计划。
- Task 3 已受控引入 React/Vite dependencies。
- Task 4 已创建最小 React/Vite Workbench shell，并收紧 Vite `server.fs.allow`。
- Task 5 已建立只读 API binding。
- Task 6 已建立只读 Workbench panels。
- 本任务开始时工作树干净。
- 本任务没有新增依赖，没有运行 `pnpm add`。

## 变更文件

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-J_tkNlVv.css`（由 `pnpm workbench:build` 生成）
- `src/symphony/workbench-static/assets/index-nLv-wKCK.js`（由 `pnpm workbench:build` 生成）
- `src/symphony/workbench-static/assets/index-BUyDfTM6.css`（旧构建产物，由当前构建替换）
- `src/symphony/workbench-static/assets/index-CG-fOHVF.js`（旧构建产物，由当前构建替换）
- `docs/plans/v15-task7-readonly-timeline-artifacts-evidence-2026-05-27.md`

## 新增 / 修改的只读页面或 panels

- 新增 `TimelinePanel`：展示 latest run 的 timeline route contract、run id、事件数量与只读 timeline entries。
- 新增 `ArtifactListPanel`：展示 latest run 已暴露的 artifact refs/list、artifactStatus、missing/unknown/unregistered 状态文案。
- 新增 `AdoptionSummaryPanel`：展示 adoption summary 与 Git dirty readiness 的只读状态。
- 保留 Task 6 的 `SummaryPanel`、`ReadinessPanel`、`RunsPanel`、`LatestRunPanel`、`RoutePanel`、`ContractGapPanel`。

## Timeline 展示说明

`frontend/workbench/src/api/client.js` 先读取 `/api/runs/latest`，仅当 latest run contract 暴露了非空 `run.runId` 时，才通过 `encodeURIComponent(runId)` 派生并读取 `/api/runs/<run-id>/timeline`。

Timeline panel 只展示 timeline entry 中已暴露的 `id`、`label`、`status`、`detail`、`at` 字段。没有 latest run 时显示“暂无 timeline”；timeline route 不可用时显示“不可用”；timeline 字段缺失时显示“未暴露”。前端不从 `/api/runs/latest` 或其他字段伪造 timeline route 结果。

## Artifact refs/list 展示说明

Artifact panel 只展示 latest run contract 已暴露的 `artifactRefs`、`artifactStatus`、`kind`、`path`、可选 `ref` 与状态字段。`missingRefs` 只用于把后端已经暴露的 missing 状态投影到对应 ref；前端不读取 artifact 文件内容，不拼接 `/@fs/` URL，不调用 artifact preview route。

缺失字段显示为“未暴露 / 不可用 / 等待 API contract 补充”。unregistered kind 仍是 artifact preview route 的后端状态，本任务不提供任意 kind 输入，也不读取 `/api/runs/<run-id>/artifacts/<kind>`。

## Adoption summary 展示说明

Adoption summary panel 只展示 `/api/summary` 与 `/api/readiness` 已暴露字段：

- `adoptionSummary.status`
- `adoptionSummary.pendingCount`
- `adoptionSummary.dirtyBlocked`
- `tools.git.dirty`

dirty adoption 仍由 pending adoption summary 与 Git readiness 分别暴露；React 端只展示这些字段，不合成安全结论，不实现 adoption inspect / apply / confirm / rollback。

## Timeline / Artifact list / Adoption summary 的只读边界

- Timeline 只读取 latest run API contract 暴露的 `run.runId`，并通过 `encodeURIComponent` 派生固定 GET timeline route；没有 UI 输入路径，没有任意 run id 输入。
- Timeline panel 只展示 timeline contract 已暴露的只读事件字段，不提供 retry、execute、resume、continue 或 rerun 控件。
- Artifact list 只展示 latest run contract 已暴露的 artifact refs/list 与 artifactStatus；不读取 artifact 内容，不调用 artifact preview route，不根据路径、扩展名、文件名、kind 或内容推断 preview safety。
- Adoption summary 只展示 summary/readiness contract 已暴露的 adoption 状态、pending count、dirtyBlocked 与 Git dirty readiness；没有 adoption apply、confirm、rollback 或 inspect 操作流。

## API contract 使用范围

本任务使用的前端只读 API allowlist：

| route | method | contract |
| --- | --- | --- |
| `/api/summary` | `GET` | `symphony.console-snapshot` |
| `/api/readiness` | `GET` | `symphony.console-readiness` |
| `/api/runs` | `GET` | `symphony.console-runs` |
| `/api/runs/latest` | `GET` | `symphony.console-run` |
| `/api/runs/<run-id>/timeline` | `GET` | `symphony.console-run-timeline` |

`/api/runs/<run-id>/timeline` 的 `runId` 只来自 latest run API contract，并经过 `encodeURIComponent`。没有从 UI 输入拼接任意 API 路径。没有新增通用 `request(method, url, body)` helper。

## Task 1 deferred gaps 处理方式

Task 1 deferred gaps 继续作为 API contract 问题处理，不由 React 端推断或伪造：

- artifact preview 缺 `uri/ref`
- 缺 `mime`
- 缺 `title/displayTitle`
- 缺 `safeToRenderInline`
- 缺 `sourceRunId`
- 缺 `artifactKind`
- 缺 `previewAvailable`
- 缺 `sizeBytes`
- 没有 shared top-level `capabilities` object
- error envelopes 仍是 route-local
- dirty adoption 当前仍由 pending adoption 与 Git readiness 分别暴露

源码中这些字段名仅作为缺失字段标签、allowlist 检查与保守 projection 状态出现，不是 artifact safety 推断逻辑。

## 安全边界确认

- 没有新增依赖。
- 没有运行 `pnpm add`。
- 没有修改 `package.json`。
- 没有修改 `pnpm-lock.yaml`。
- 没有新增执行控件。
- 没有新增写入型 API。
- 没有新增 `POST` / `PUT` / `PATCH` / `DELETE`。
- 没有新增 WebSocket、EventSource、sendBeacon 或 XMLHttpRequest。
- 没有 artifact inline preview。
- 没有 `safeToRenderInline` 前端推断。
- 没有根据路径、扩展名、文件名、kind 或内容推断 `mime`、`previewAvailable`、`artifactKind`、`sourceRunId`、`sizeBytes`、`displayTitle`、`uri/ref`。
- 没有 adoption apply、confirm、rollback 或 inspect 操作流。
- 没有修改 Task 1 API contract。
- 没有修改 v12 adoption safety kernel。
- 没有修改 v14 Stage kernel / gate。
- 没有替换 Stage Charter HTML。

## artifact preview 安全边界确认

- 没有实现 artifact inline preview。
- 没有调用 `/api/runs/<run-id>/artifacts/<kind>`。
- 没有读取 artifact 文件内容。
- 没有把 artifact path 渲染成链接。
- 没有拼接 `/@fs/` URL。
- 没有根据路径、扩展名、文件名、kind 或内容推断 `mime`、`safeToRenderInline`、`previewAvailable`、`artifactKind`、`sourceRunId`、`sizeBytes`、`displayTitle`、`uri/ref`。

## 禁止浏览器执行控件确认

- 没有新增 `<button>`、`role="button"`。
- 没有新增 `<a>` 或 `href` 控件。
- 没有新增 `<form>`、`<input>`、`<select>`、`<textarea>`。
- 没有新增 `onClick`、`onSubmit` 或 `addEventListener` handler。
- 没有新增 write / execute / retry / adopt / apply / rollback / delete / install / model / mutation / audit 控件。
- API client 仍只使用 `GET`。
- 没有新增 `POST` / `PUT` / `PATCH` / `DELETE`。

## Vite fs 边界确认

- 本任务没有修改 `frontend/workbench/vite.config.js`。
- `server.fs.strict` 仍为 `true`。
- `server.fs.allow` 仍为 `[workbenchRoot]`。
- 没有放宽到仓库根目录、父目录、`src/symphony`、`docs`、`package.json` 或 `pnpm-lock.yaml`。
- 没有配置 proxy。

## Stage Charter HTML / JSON 边界确认

- 本任务没有修改 `docs/stages/v15-workbench-react-vite-migration.stage.json`。
- 本任务没有修改或替换任何 `docs/stages/*.html`。
- React/Vite Workbench 没有读取、解析或替代 Stage Charter HTML。

## v12 adoption safety 边界确认

- 本任务没有修改 v12 adoption apply safety kernel。
- 本任务没有修改 v12 fingerprint verification。
- 本任务没有修改 v12 dirty worktree check。
- 本任务没有修改 `git apply --check` 逻辑。
- 本任务没有实现 adoption inspect、apply、confirm 或 rollback 操作流。

## v14 Stage kernel / gate 边界确认

- 本任务没有修改 v14 Stage kernel。
- 本任务没有修改 Stage gate。
- 本任务没有修改 blocked snapshot recovery。
- 本任务没有修改 verifier、policy engine、workspace manager 或 ArtifactStore 边界。
- 本任务没有修改 Task 1 API fixture contract。

## 未实现的内容

- 没有实现完整 Workbench 产品页。
- 没有实现 artifact inline preview。
- 没有实现 adoption inspect 页面。
- 没有实现 adoption apply / confirm / rollback。
- 没有新增 diagnostics route。
- 没有统一 error envelope。
- 没有补齐 Task 1 deferred artifact preview contract gaps。

## 验证命令

```sh
node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js
pnpm workbench:build
pnpm check
pnpm test
pnpm workbench:dev -- --port 5173 --strictPort
grep -RniE "<button|role=['\"]button|onClick|onSubmit|<form|<a\s|href=" frontend/workbench/src
grep -RniE "method\s*:\s*['\"](POST|PUT|PATCH|DELETE)|navigator\.sendBeacon|WebSocket|EventSource|XMLHttpRequest" frontend/workbench/src
grep -RniE "safeToRenderInline|previewAvailable|mime|artifactKind|sourceRunId|sizeBytes|displayTitle|uri|ref" frontend/workbench/src
git diff -- package.json pnpm-lock.yaml
git diff --check
```

## 验证结果

- `node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js`：通过，`13` tests，`13` pass，`0` fail。
- `pnpm workbench:build`：通过，生成 `src/symphony/workbench-static/index.html`、`assets/index-J_tkNlVv.css`、`assets/index-nLv-wKCK.js`。命令期间出现 Node WASI experimental warning，不影响退出码。
- `pnpm check`：通过。
- `pnpm test`：通过，`531` tests，`531` pass，`0` fail。
- `pnpm workbench:dev -- --port 5173 --strictPort`：通过，本地 Vite dev server 启动在 `http://127.0.0.1:5173/`。
- Browser smoke：通过，页面 title 为 `v15 Workbench`，H1 为 `v15 Workbench`，渲染 `9` 个只读 panel，浏览器控件计数为 `0`。由于 Vite dev server 未代理 console API，route 状态按预期显示为不可用而不崩溃。
- 浏览器控件扫描：无输出，确认 `frontend/workbench/src` 没有 `<button>`、`role="button"`、`onClick`、`onSubmit`、`<form>`、`<a>` 或 `href=` 命中。
- 写入 API / 实时通道扫描：无输出，确认没有 `POST` / `PUT` / `PATCH` / `DELETE`、`sendBeacon`、`WebSocket`、`EventSource`、`XMLHttpRequest` 命中。
- artifact gap 字段扫描：有预期命中，均为 `artifactRefs` 只读字段、Task 1 deferred gap 标签、`encodeURIComponent(runId)`、缺失字段 projection 与测试断言；没有 artifact preview route、内容读取或 inline render 逻辑。
- `git diff -- package.json pnpm-lock.yaml`：无输出，确认没有修改 `package.json` 或 `pnpm-lock.yaml`。
- `git diff --check`：通过。

## 延后事项

- Artifact preview 继续等待后端 contract 明确 `uri/ref`、`mime`、`displayTitle`、`safeToRenderInline`、`sourceRunId`、`artifactKind`、`previewAvailable`、`sizeBytes`。
- Dedicated dirty adoption diagnostics contract 继续延后。
- Shared top-level `capabilities` object 与 shared error envelope 继续延后。
- Adoption inspect / apply / confirm / rollback 继续不属于本任务。

## reviewer checklist

- [ ] 确认没有新增依赖。
- [ ] 确认没有运行 `pnpm add`。
- [ ] 确认没有修改 `pnpm-lock.yaml`。
- [ ] 确认没有修改 `package.json`。
- [ ] 确认 API client 只使用 allowlist 中的 GET route。
- [ ] 确认 timeline run id 只来自 latest run API contract，并经过 `encodeURIComponent`。
- [ ] 确认没有新增写入型 API。
- [ ] 确认没有新增 `POST` / `PUT` / `PATCH` / `DELETE`。
- [ ] 确认没有新增执行控件。
- [ ] 确认没有 artifact inline preview。
- [ ] 确认没有让 React 端推断 Task 1 deferred contract gaps。
- [ ] 确认没有修改 Task 1 API fixture contract。
- [ ] 确认没有修改 v12 adoption safety kernel。
- [ ] 确认没有修改 v14 Stage kernel / gate。
- [ ] 确认没有替换 Stage Charter HTML。
- [ ] 确认 Vite `server.fs.allow` 仍保持收紧边界。
- [ ] 确认验证命令全部通过。
