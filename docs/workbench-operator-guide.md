# v16 Workbench 中文操作指南

## 当前定位

Workbench 是 `symphony console` 提供的本地浏览器展示面。它消费 console server 暴露的本地 `GET` API，用于查看 `.symphony` 摘要、latest run、readiness、guided handoff、timeline、artifact refs、safe preview、adoption summary 和 Stage summary。

Workbench 是 read-only / display-only / copy-only：

- 浏览器只展示状态、contract 字段和可复制的命令文本。
- 浏览器不执行命令，不写文件，不触发模型，不触发 agent。
- 浏览器不是 canonical state；`.symphony` 只保存 summary、ref、pointer，完整 evidence 继续由 ArtifactStore 承担。

## 构建 Workbench

从仓库 checkout 中构建 React/Vite Workbench：

```sh
pnpm workbench:build
```

当前脚本来自 `package.json`，执行：

```sh
vite build --config frontend/workbench/vite.config.js
```

构建产物写入 `src/symphony/workbench-static/`，console server 只从这个静态根目录服务 `/workbench` 资源。不要手动把仓库根目录、`docs/`、`src/` 或任意本地目录挂到 Workbench 静态服务上。

前端源码调试脚本当前存在：

```sh
pnpm workbench:dev
```

它来自 `package.json`，执行 Vite dev server：`vite --host 127.0.0.1 --config frontend/workbench/vite.config.js`。该脚本用于前端源码调试；验证 console API parity 和静态服务边界时，仍以 `pnpm workbench:build` 加 `symphony console` 为准。

建议的开发验证命令：

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

## 启动 Console / Workbench

安装了用户 CLI 时：

```sh
symphony console
```

从当前 checkout 使用 package script 时：

```sh
pnpm symphony console
```

默认监听地址是 `127.0.0.1:8765`。启动后：

- `http://127.0.0.1:8765/` 是既有 console HTML。
- `http://127.0.0.1:8765/workbench/` 是 React/Vite Workbench 入口。
- `/api/*` 仍由 console server 拥有，不由 React fallback 覆盖。

当前已支持的 console 参数：

```sh
pnpm symphony console --host 127.0.0.1 --port 8765
pnpm symphony console --state-dir .symphony
pnpm symphony console --snapshot --json
pnpm symphony console --snapshot --state-dir .symphony --json
```

`--snapshot --json` 只输出 `symphony.console-snapshot`，不启动浏览器服务器。`console --help` 不是当前支持的 console 选项，不要把它写进操作流程。

## 当前只读 API

Console / Workbench 当前可用的核心只读 API 包括：

```text
GET /api/summary
GET /api/readiness
GET /api/handoff
GET /api/handoff/<ref>
GET /api/runs
GET /api/runs/latest
GET /api/runs/<run-id>
GET /api/runs/<run-id>/timeline
GET /api/runs/<run-id>/artifacts/<kind>
GET /api/runs/<run-id>/artifacts/<kind>/preview
GET /api/adoptions/<adoption-id>/inspect
```

所有非 `GET` 请求都必须返回 `405`，响应语义是 console read-only。`/api/handoff` 只暴露 registered handoff ref，当前为 `guided-goal-handoff.v1`。safe preview route 只接受 run state 已登记的 artifact kind，不接受 `path` query、encoded traversal 或任意本地路径。

`/workbench` 的静态资源服务只允许读取 `src/symphony/workbench-static/` 中的构建产物。`/workbench/api/*` 只会落到 Workbench HTML fallback，不返回 API JSON contract；`/workbench/docs/stages/*.html`、`/workbench/docs/stages/*.stage.json`、`/workbench/src/*`、`/workbench/package.json` 和 lockfile 路径不能暴露仓库文件内容。

## Guided Goal Handoff

Workbench 的 handoff panel 只读取：

- `GET /api/handoff`
- `GET /api/handoff/guided-goal-handoff.v1`

面板展示 contract 中已暴露的目标、角色、任务、review gate、release gate、停止条件和 copy-only commands。命令只作为文本出现；浏览器没有执行按钮、terminal action、模型调用、agent 调用、branch 操作、commit 操作或 push 操作。

如果 handoff contract 缺少某个字段，Workbench 应显示缺失或不可用状态，不从 task id、标题、命令文本或历史 evidence 推断状态。`/api/handoff?path=...`、`/api/handoff/<unknown-ref>`、encoded traversal 和非 GET 请求都应保持被拒绝。

## Safe Artifact Preview

safe preview 的来源是后端返回的 `safe-artifact-preview.v1` contract。Workbench 只使用 artifact ref 上的后端 `uri`，不根据 artifact kind、path、扩展名、MIME 或内容片段拼接 preview route。

后端 contract 需要明确提供这些字段，Workbench 才能显示对应值：

- `uri`
- `ref`
- `mime`
- `displayTitle`
- `artifactKind`
- `sourceRunId`
- `sizeBytes`
- `previewAvailable`
- `safeToRenderInline`
- `truncated`
- `truncationReason`
- `maxPreviewBytes`
- `downloadAvailable`

只有同时满足以下条件时，Workbench 才能 inline 显示文本：

- payload 是 `safe-artifact-preview.v1`。
- `previewAvailable === true`。
- `safeToRenderInline === true`。
- 后端提供字符串 `contentText` 或 `previewText`。

inline 内容只能放在 `<pre><code>` 文本节点中。HTML、JavaScript、SVG、binary、directory、missing artifact、blocked artifact、未知 MIME 和缺少 safety 字段的 payload 都不能作为正文渲染。`downloadAvailable` 当前必须是 `false`；Workbench 不提供下载、打开本地路径、复制本地路径或任意路径输入。

后端 safe preview 边界：

- 只读取 run state 已登记 artifact ref。
- 只允许 `.symphony` state root 和同级 `artifacts/` safe root。
- 阻止 `package.json`、lockfile、`src/`、`docs/`、symlink、hardlink 和 safe root 外路径。
- 超过 200 KiB 的安全文本 preview 只返回截断内容，并标记 `truncated` 与 `truncationReason`。

字段缺失时按 contract gap 处理。前端不能推断 `safeToRenderInline`、`mime`、`previewAvailable`、`artifactKind`、`uri`、`ref`、`sourceRunId`、`sizeBytes` 或 truncation 状态。

## Stage Charter 边界

Stage Charter JSON / HTML 是独立的 Stage display artifact：

- JSON 路径形如 `docs/stages/<stage-id>.stage.json`。
- HTML 路径形如 `docs/stages/<stage-id>.html`。
- Stage Charter JSON 是机器源，HTML 是生成后的展示产物，并参与一致性检查。

React/Vite Workbench 不替换、不编辑、不解析 Stage Charter HTML / JSON。Console server 中 `/workbench` app route fallback 只覆盖 Workbench 路由；`/docs/stages/*.html`、`/docs/stages/*.stage.json`、`/workbench/docs/stages/*.html` 和 `/workbench/docs/stages/*.stage.json` 不会被 React app 替代。

## 禁止能力

Workbench 不提供也不应暗示以下能力：

- write
- execute
- retry
- adopt
- apply
- rollback
- delete
- install
- mutation
- audit
- model invocation
- arbitrary path read
- download artifact
- open local file

这些词如果出现在 Workbench 数据里，只能是只读状态、字段名、历史 run 信息、copy-only command 文本或文档说明。浏览器端不能把它们接成按钮、表单、链接、handler、HTTP mutation、terminal action、模型调用、真实 agent 调用、package installer、文件下载或本地文件打开。

## 故障排查

`/workbench/` 返回 404 或资源缺失：

先运行 `pnpm workbench:build`，确认 `src/symphony/workbench-static/index.html` 和 `src/symphony/workbench-static/assets/` 存在。不要把缺失资源问题修成任意目录静态服务。

端口 `8765` 被占用：

使用当前已支持的 `--port` 参数，例如 `pnpm symphony console --port 8766`。仍建议绑定 `127.0.0.1`。

Workbench 显示没有 runs：

这是合法状态。可以在终端运行 `pnpm symphony scan` 生成本地只读 scan state，再重新打开或刷新 Workbench。

Handoff panel 显示不可用：

先检查 `/api/handoff` 是否返回 registered ref，再检查 `/api/handoff/guided-goal-handoff.v1` 是否返回 `guided-goal-handoff.v1`。未知 ref、query path、encoded traversal 和非 GET 返回拒绝状态是预期安全边界。

Artifact preview 字段缺失：

按 contract gap 处理。前端不能推断 `safeToRenderInline`、`mime`、`previewAvailable`、`artifactKind`、`uri`、`ref` 等字段；需要后端 API contract 明确补齐。

HTML artifact 没有显示正文：

这是预期行为。`text/html` 可以作为 MIME 显示，但只要 `safeToRenderInline` 为 `false`，Workbench 就不能展示 HTML 正文，也不能把它交给浏览器解析。

Preview 返回 `blocked-artifact-path`：

这是安全边界，不是 Workbench 故障。常见原因包括 artifact ref 指向仓库 `package.json`、lockfile、`src/`、`docs/`、symlink、hardlink 或 safe root 外路径。

在 `pnpm workbench:dev` 页面看到 API 读取失败：

`workbench:dev` 是前端源码调试入口，不是完整 console server parity 验证入口。使用 `pnpm workbench:build` 后通过 `pnpm symphony console` 访问 `/workbench/`。

看到 `405`：

这是安全边界，不是故障。Workbench 和 `/api/*` 当前只接受 `GET`；写入、执行、采纳、回滚、删除、安装、mutation、audit、下载、本地打开和模型调用必须保持不可由浏览器触发。

Stage Charter HTML / JSON 没有在 Workbench 中打开：

这是预期边界。Stage Charter 文件不是 React Workbench 的替代页面，也不由 `/workbench` fallback 服务。

## 已知限制

- React/Vite Workbench 当前是只读展示层，不是执行面。
- 当前 React frontend 只消费受控 `GET` contract；不直接读取 `.symphony` 私有结构、ArtifactStore 内部结构或 Stage Charter HTML。
- Handoff commands 只作为文本显示，不提供浏览器执行、复制按钮或队列入口。
- Artifact inline preview 只支持后端明确标记为 safe 的 bounded text。
- 没有 artifact 下载、打开本地路径、任意路径输入或任意 artifact 预览。
- 没有 browser write、execute、retry、adopt、apply、rollback、delete、install、mutation、audit、model invocation。
- `/` 仍保留既有 console HTML；React/Vite Workbench 当前入口是 `/workbench/`。
- Stage Charter HTML / JSON 继续独立存在，不被 React Workbench 替换。
