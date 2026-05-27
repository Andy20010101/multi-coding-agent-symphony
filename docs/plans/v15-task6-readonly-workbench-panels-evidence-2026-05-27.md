# v15 Task 6 只读 Workbench Panels Evidence

日期：2026-05-27

任务：在 Task 5 只读 API binding 基础上，实现只读 Workbench panels 展示层。

## 任务目标

本任务构建 React/Vite Workbench 的只读 panels 展示层，把 `/api/summary`、`/api/readiness`、`/api/runs`、`/api/runs/latest` 已暴露的 contract 字段渲染为低密度、只读、可审查的 UI 面板。

本任务不是完整 Workbench，不实现 artifact preview，不提供采纳、写入、终端动作、模型调用、审计或 mutation 入口。

## 前置状态

- 当前分支：`v15-task6-readonly-workbench-panels`。
- 当前基线提交：`112d2a3 Add read-only Workbench API binding`。
- 本地 `main` 与远端 `origin/main` 查验结果均为 `112d2a32e36e3a6068042d22b7feeb08e484fcc7`。
- Task 1 已冻结 Workbench console API fixture contracts。
- Task 2 已产出 React/Vite 依赖引入计划与准入门槛。
- Task 3 已受控引入 `react`、`react-dom`、`vite`、`@vitejs/plugin-react`。
- Task 4 已创建最小 React/Vite shell，并收紧 Vite `server.fs.allow`。
- Task 5 已建立只读 Workbench API binding。
- 本任务没有新增依赖。
- 本任务没有运行 `pnpm add`。
- 本任务没有修改 `package.json`。
- 本任务没有修改 `pnpm-lock.yaml`。

## 变更文件

- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BUyDfTM6.css`（由 `pnpm workbench:build` 生成）
- `src/symphony/workbench-static/assets/index-CG-fOHVF.js`（由 `pnpm workbench:build` 生成）
- `src/symphony/workbench-static/assets/index-BGs_u4UL.css`（旧构建产物，已由当前构建替换）
- `src/symphony/workbench-static/assets/index-C6idz3hS.js`（旧构建产物，已由当前构建替换）
- `docs/plans/v15-task6-readonly-workbench-panels-evidence-2026-05-27.md`

## 新增或修改的 Workbench panel

- `SummaryPanel`：展示 summary contract 的 contract、状态、latestRun 简要信息、adoptionSummary 与只读说明。
- `ReadinessPanel`：展示 readiness status、readOnly、modelInvocation、Git dirty readiness、checks、riskSummary attention items，以及 Stage / artifact 只读信号。
- `RunsPanel`：展示 runs list、filter、availableFilters、run id、status、intent、command、route key 缺失状态、createdAt / updatedAt、artifactRefs 数量与 latest 标识。
- `LatestRunPanel`：展示 `/api/runs/latest` 对应的 run id、status、verifierStatus、executionPlanId、adoptionPlanId、createdAt / updatedAt、artifactRefs 只读列表与 timeline 可用性。
- `RoutePanel`：展示固定 GET route 使用范围。
- `ContractGapPanel`：展示 Task 1 deferred gaps，明确等待 API contract 补充。

## API contract 使用范围

本任务只继续使用 Task 5 已批准的四个只读 route：

| route | method | contract |
| --- | --- | --- |
| `/api/summary` | `GET` | `symphony.console-snapshot` |
| `/api/readiness` | `GET` | `symphony.console-readiness` |
| `/api/runs` | `GET` | `symphony.console-runs` |
| `/api/runs/latest` | `GET` | `symphony.console-run` |

本任务没有新增 timeline route binding，没有新增 artifact route binding，没有新增 adoption inspect route binding，没有新增任何写入 endpoint。

## Summary panel 说明

Summary panel 只展示 `/api/summary` 已暴露字段：

- `contractName`
- `contractVersion`
- `status`
- `generatedAt`
- `readOnly`（缺失时显示“未暴露”）
- `modelInvocation`（缺失时显示“未暴露”）
- `capabilities`（缺失时显示“未暴露”）
- `overview.status`
- `stageSummary.stageId`
- `stageSummary.status`
- `runStats.total`
- `latestRun.runId`
- `latestRun.status`
- `latestRun.verifierStatus`
- `latestRun.updatedAt`
- `adoptionSummary.status`
- `adoptionSummary.pendingCount`
- `adoptionSummary.dirtyBlocked`

React 端没有把 summary contract 中缺失的 `readOnly`、`modelInvocation` 或 shared `capabilities` 补成伪字段。

## Readiness panel 说明

Readiness panel 只展示 `/api/readiness` 与 `/api/summary` 已暴露的只读状态：

- `readiness.status`
- `readiness.readOnly`
- `readiness.modelInvocation`
- `readiness.capabilities` 缺失状态
- `tools.git.dirty`
- `tools.git.dirtyFilesCount`
- `tools.packageManager.status`
- `checks[]`
- `riskSummary.items[]`
- `stageSummary.status`
- `stageSummary.blocker`
- `stageSummary.consistency.status`
- `runStats.artifacts.status`
- `runStats.artifacts.missing`

dirty Git readiness 只作为文本状态展示。missing artifact、blocked Stage、Charter mismatch 只按 contract 已暴露字段呈现，不生成修复按钮，不生成重跑入口，不把 attention items 转成浏览器操作。

## Runs panel 说明

Runs panel 只展示 `/api/runs` 已暴露字段：

- route contract 信息
- `filter`
- `availableFilters`
- route count
- summary count
- `runId`
- `status`
- `verifierStatus`
- `intent`
- `command`
- `semanticCommand`
- `routeDecision.routeKey`（当前 contract 未暴露时显示“未暴露”）
- `routeDecision.intent`
- `routeDecision.reason`
- `createdAt`
- `updatedAt`
- `artifactRefs` 数量
- latest/history 只读标识

latest 标识来自 summary/latest run 暴露的 id，仅用于本地展示，不调用后端写入，不改变运行状态。

## Latest run panel 说明

Latest run panel 只展示 `/api/runs/latest` 对应数据：

- `runId`
- `status`
- `verifierStatus`
- `modelInvocation`
- `executionPlanId`
- `adoptionPlanId`
- `createdAt`
- `updatedAt`
- `artifactRefs` 数量
- `timeline` 可用性
- `artifactRefs` 只读列表

artifactRefs 只列出 contract 中已有的 `kind` 与 `path` 文本，不渲染链接，不读取 artifact 文件内容，不做 inline preview。

## Loading / error / empty state 说明

统一状态呈现：

- loading：显示正在读取四个只读 contract。
- error：只显示“错误摘要：只读 contract 未暴露或不可用”，不展示本地路径、堆栈或源码片段。
- empty：无 runs 或无 latest run 时显示“当前没有运行记录”。
- unavailable：route 读取失败时显示“不可用”。
- contract field missing：字段缺失统一显示“未暴露”。

页面没有提供刷新按钮；说明文本为“刷新页面后会重新读取只读 API”。

## Task 1 deferred gaps 处理方式

以下 gap 继续作为 API contract 问题处理，不由 React 端推断、补值或伪造：

- artifact preview 缺 `uri/ref`
- 缺 `mime`
- 缺 `title/displayTitle`
- 缺 `safeToRenderInline`
- 缺 `sourceRunId`
- 缺 `artifactKind`
- 缺 `previewAvailable`
- 缺 `sizeBytes`
- 没有 shared top-level capabilities object
- error envelopes 仍是 route-local
- dirty adoption 当前由 pending adoption 与 Git readiness 分别暴露

源码安全扫描会命中这些 gap 字段名，因为它们作为“缺失字段标签”和测试断言存在；这些命中不是 preview 逻辑，也不是 inline 渲染安全判断。

## 只读边界确认

- 本任务没有新增依赖。
- 本任务没有运行 `pnpm add`。
- 本任务没有修改 `pnpm-lock.yaml`。
- 本任务没有修改 `package.json`。
- 本任务没有修改 Task 1 API fixture contract。
- 本任务没有修改 console API shape。
- API client 仍只使用 `GET`。
- 没有 `POST` / `PUT` / `PATCH` / `DELETE`。
- 没有 WebSocket、EventSource、sendBeacon 或 XMLHttpRequest。
- React 端没有直接读取任意本地文件。
- React 端没有读取 `.symphony` 私有结构或 Stage Charter HTML。

## 禁止浏览器执行控件确认

- 没有新增 `<button>`。
- 没有新增 `<a>` 或 `href` 控件。
- 没有新增 `<form>`、`<input>`、`<select>`、`<textarea>`。
- 没有新增 `role="button"`。
- 没有新增 `onClick`、`onSubmit` 或 `addEventListener` handler。
- 没有新增 clipboard 控件。
- 没有新增写入、终端动作、采纳确认、回滚、删除、安装、审计、mutation、模型调用或真实 CLI 控件。

源码危险控件扫描无输出。构建产物扫描会命中 React 内部 `retry`、`delete`、`apply`、`onClick`、`href` 等字符串，以及 Workbench 数据字段中的 `modelInvocation` / `adoptionPlanId`；这些是 React runtime 内部字符串或只读数据字段，不是本任务新增的浏览器执行控件。源码检查和浏览器 smoke 均确认可交互控件计数为 `0`。

## Artifact preview 边界确认

- 本任务没有新增 artifact inline preview。
- 本任务没有调用 artifact preview route。
- 本任务没有读取 artifact 文件内容。
- 本任务没有把 artifact path 渲染成链接。
- 本任务没有根据 kind、路径、扩展名或内容推断 `mime`。
- 本任务没有根据 kind、路径、扩展名或内容推断 `safeToRenderInline`。
- 本任务没有伪造 `uri/ref`、`title/displayTitle`、`sourceRunId`、`artifactKind`、`previewAvailable`、`sizeBytes`。

## Vite fs allow 边界确认

- 本任务没有修改 `frontend/workbench/vite.config.js`。
- `server.fs.strict` 仍为 `true`。
- `server.fs.allow` 仍为 `[workbenchRoot]`。
- `server.fs.allow` 没有包含仓库根目录、父目录、`src/symphony`、`docs`、`package.json` 或 `pnpm-lock.yaml`。
- 本任务没有配置 proxy。
- `tests/workbench-shell.test.js` 继续覆盖该边界。

## Stage Charter HTML / JSON 边界确认

- 本任务没有修改 `docs/stages/v15-workbench-react-vite-migration.stage.json`。
- 本任务没有修改或替换任何 `docs/stages/*.html`。
- React/Vite Workbench 没有读取、解析或替代 Stage Charter HTML。

## v12 adoption safety 边界确认

- 本任务没有修改 v12 adoption apply safety kernel。
- 本任务没有修改 v12 fingerprint verification。
- 本任务没有修改 v12 dirty worktree check。
- 本任务没有修改 `git apply --check` 逻辑。
- 本任务没有新增采纳执行入口。
- 本任务没有新增 adoption inspect 操作页面。

## v14 Stage kernel / gate 边界确认

- 本任务没有修改 v14 Stage kernel。
- 本任务没有修改 Stage gate。
- 本任务没有修改 blocked snapshot recovery。
- 本任务没有修改 verifier、policy engine、workspace manager 或 ArtifactStore 边界。
- 本任务没有修改 Task 1 API fixture contract。

## 测试覆盖

- `tests/workbench-api-client.test.js`
  - 固定四个只读 endpoint。
  - 确认 client 请求只使用 `GET`、`no-store`、`Accept: application/json`，且没有 request body。
  - 确认 non-OK response 进入只读 error state。
  - 确认 artifact preview gap 不被推断。
  - 覆盖 summary、readiness checks、riskSummary、runs items、latest run execution/adoption plan 字段、timeline 可用性与 latest 标识。
- `tests/workbench-shell.test.js`
  - 确认无浏览器 action controls、handler、写入型 API method、实时执行通道。
  - 确认 Task 6 四个 panel source components 存在。
  - 确认 frontend API path 只包含四个允许 endpoint。
  - 确认 artifact preview gaps 只是标签，不是 preview 逻辑。
  - 确认 Vite build output 目录与 `server.fs.allow` 收紧边界。

## 验证命令

```sh
node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js
pnpm check
pnpm test
pnpm workbench:build
git diff --check
git diff -- package.json pnpm-lock.yaml
git status --short
grep -RniE "<button|role=['\"]button|onClick|onSubmit|<form|<a\s|href=" frontend/workbench/src || true
grep -RniE "method\s*:\s*['\"](POST|PUT|PATCH|DELETE)|navigator\.sendBeacon|WebSocket|EventSource|XMLHttpRequest" frontend/workbench/src || true
grep -RniE "safeToRenderInline|previewAvailable|mime|artifactKind|sourceRunId|sizeBytes|displayTitle|uri|ref" frontend/workbench/src || true
grep -RniE "execute|retry|adopt|apply|rollback|delete|install|mutate|audit|model|执行|重试|采纳|应用|回滚|删除|安装|审计|模型" frontend/workbench/src package.json || true
```

额外浏览器 smoke：

```text
打开 http://127.0.0.1:5173/
检查 H1、panel 标题、data-panel 数量与控件计数。
```

## 验证结果

- `node --test tests/workbench-shell.test.js tests/workbench-api-client.test.js`：通过，`12` tests，`12` pass，`0` fail。
- `pnpm check`：通过。
- `pnpm test`：通过，`530` tests，`530` pass，`0` fail。
- `pnpm workbench:build`：通过，输出 `src/symphony/workbench-static/index.html`、`assets/index-BUyDfTM6.css`、`assets/index-CG-fOHVF.js`。命令期间出现 Node WASI experimental warning，不影响退出码。
- `git diff --check`：通过。
- `git diff -- package.json pnpm-lock.yaml`：无输出，确认本任务没有修改 `package.json` 或 `pnpm-lock.yaml`。
- `git status --short`：显示 Task 6 源码、测试、构建产物与 evidence 文档变更；旧 hash 静态产物被当前构建替换。
- 浏览器 smoke：通过。页面标题为 `v15 Workbench`，H1 为 `v15 Workbench`，渲染 `6` 个 `.data-panel`，panel 标题包含 Summary、Readiness、Runs、Latest run、固定 GET routes、Contract gaps；`button, a, form, input, select, textarea, [role="button"], [href]` 计数为 `0`。

## 安全扫描结果

- 控件扫描：无输出。
- 写入 method / realtime channel 扫描：无输出。
- artifact preview gap 字段扫描：仅命中 `App.jsx` 中 `artifactRefs` 只读展示，以及 `contracts.js` 中 deferred gap 标签、字段缺失检查和 `projectArtifactRefs`；未命中 inline preview 控件或文件读取逻辑。
- 执行类关键词扫描：命中 `model` 变量名、`modelInvocation`、`adoptionSummary`、`adoptionPlanId` 与 deferred gap 文本；这些是只读 contract 字段和 projection 命名，不是浏览器操作控件。
- 构建产物补充扫描：命中 React runtime 内部 `retry` / `delete` / `apply` / `onClick` / `href` 等字符串，以及 Workbench 只读字段名；源码扫描和浏览器 smoke 已确认不存在危险控件、handler、写入 API 或执行 endpoint。

## 未实现内容

- 没有实现完整 Workbench tabs parity。
- 没有实现 artifact inline preview。
- 没有实现 artifact 文件内容读取。
- 没有实现 timeline route 绑定。
- 没有实现 adoption inspect UI。
- 没有实现采纳确认或执行入口。
- 没有实现 copy command 控件。
- 没有实现 console server React bundle serving 或 legacy fallback 切换。
- 没有新增 shared top-level capabilities object。
- 没有统一 error envelope。

## 延后事项

- Artifact preview 继续等待 API contract 补齐 `uri/ref`、`mime`、`title/displayTitle`、`safeToRenderInline`、`sourceRunId`、`artifactKind`、`previewAvailable`、`sizeBytes`。
- Shared top-level `capabilities` object 继续作为 API contract 后续事项。
- Shared error envelope 继续作为 API contract 后续事项。
- Dedicated dirty adoption diagnostics contract 继续作为 API contract 后续事项。
- Timeline、artifact preview、adoption inspect、完整 diagnostics parity 延后到后续任务。
- console server React bundle serving 与 legacy fallback 选择逻辑延后。

## reviewer checklist

- [ ] 确认本任务没有新增依赖。
- [ ] 确认本任务没有运行 `pnpm add`。
- [ ] 确认本任务没有修改 `pnpm-lock.yaml`。
- [ ] 确认本任务没有修改 `package.json`。
- [ ] 确认本任务没有修改 Task 1 API fixture contract。
- [ ] 确认本任务没有修改 console API shape。
- [ ] 确认本任务没有修改 v12 adoption safety kernel。
- [ ] 确认本任务没有修改 v14 Stage kernel / gate。
- [ ] 确认本任务没有替换 Stage Charter HTML。
- [ ] 确认 API client route 清单只包含 `/api/summary`、`/api/readiness`、`/api/runs`、`/api/runs/latest`。
- [ ] 确认 API client 只使用 `GET`。
- [ ] 确认不存在 `POST` / `PUT` / `PATCH` / `DELETE`。
- [ ] 确认不存在 WebSocket、EventSource、sendBeacon 或 XMLHttpRequest。
- [ ] 确认没有新增浏览器写入或执行控件。
- [ ] 确认没有新增 artifact inline preview。
- [ ] 确认 React 端没有推断 artifact preview 安全字段。
- [ ] 确认 Vite `server.fs.allow` 仍保持收紧边界。
- [ ] 确认没有配置危险 Vite proxy。
- [ ] 确认验证命令全部通过。
